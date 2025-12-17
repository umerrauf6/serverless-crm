import { useState } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  User,
  Mail,
  Lock,
  ArrowRight,
  Building,
  Users,
} from "lucide-react";
import axios from "axios";

// 🔴 REPLACE WITH YOUR CORRECT BASE URL
const API_URL = import.meta.env.VITE_API_URL;

export default function AuthScreen({ onAuthenticated, onShowToast }) {
  const [isLogin, setIsLogin] = useState(true);
  const [isJoining, setIsJoining] = useState(false); // NEW: Toggle for "Join vs Create"
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    orgName: "",
    orgId: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isLogin) {
        // --- LOGIN ---
        const res = await axios.post(`${API_URL}/auth/login`, {
          email: formData.email,
          password: formData.password,
          orgId: formData.orgId,
        });
        onAuthenticated(res.data.user, res.data.token, res.data.orgId);
      } else {
        // --- SIGNUP ---

        // Prepare Payload based on "Join" vs "Create"
        const payload = {
          email: formData.email,
          password: formData.password,
          name: formData.name,
          // If Joining: Send orgId, ignore orgName
          // If Creating: Send orgName, ignore orgId
          ...(isJoining
            ? { orgId: formData.orgId }
            : { orgName: formData.orgName }),
        };

        const res = await axios.post(`${API_URL}/auth/signup`, payload);

        setFormData((prev) => ({ ...prev, orgId: res.data.orgId }));
        setIsLogin(true);

        if (onShowToast) {
          const roleMsg =
            res.data.role === "ADMIN"
              ? "Workspace created!"
              : "Joined workspace successfully!";
          onShowToast(`${roleMsg} Please log in.`, "success");
        }
      }
    } catch (error) {
      console.error(error);
      const msg = error.response?.data?.error || "Authentication failed";
      if (onShowToast) onShowToast(msg, "error");
      else alert(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-full items-center justify-center bg-gray-50">
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-100"
      >
        <div className="flex flex-col items-center justify-center mb-6">
          <div className="bg-indigo-600 p-3 rounded-xl shadow-lg shadow-indigo-200 mb-4">
            <Activity className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            SERVERLESS CRM
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {isLogin
              ? "Sign in to your workspace"
              : "Create or Join a Workspace"}
          </p>
        </div>

        {/* JOIN / CREATE TOGGLE (Only visible in Signup) */}
        {!isLogin && (
          <div className="flex bg-gray-100 p-1 rounded-lg mb-6">
            <button
              type="button"
              onClick={() => setIsJoining(false)}
              className={`flex-1 py-2 text-xs font-bold rounded-md transition ${
                !isJoining
                  ? "bg-white shadow-sm text-indigo-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Create New
            </button>
            <button
              type="button"
              onClick={() => setIsJoining(true)}
              className={`flex-1 py-2 text-xs font-bold rounded-md transition ${
                isJoining
                  ? "bg-white shadow-sm text-indigo-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Join Existing
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Fields only for Signup */}
          {!isLogin && (
            <div className="relative">
              <User className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                required
                className="w-full pl-10 p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Full Name"
              />
            </div>
          )}

          {/* DYNAMIC FIELD: Org Name OR Org ID */}
          {!isLogin && !isJoining && (
            // CASE A: CREATING NEW (Ask for Name)
            <div className="relative">
              <Building className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                required
                className="w-full pl-10 p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition"
                value={formData.orgName}
                onChange={(e) =>
                  setFormData({ ...formData, orgName: e.target.value })
                }
                placeholder="New Organization Name"
              />
            </div>
          )}

          {/* Case B: JOINING or LOGGING IN (Ask for ID) */}
          {(isLogin || isJoining) && (
            <div className="relative">
              <Users className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                required
                className="w-full pl-10 p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition bg-gray-50"
                value={formData.orgId}
                onChange={(e) =>
                  setFormData({ ...formData, orgId: e.target.value })
                }
                placeholder={
                  isJoining
                    ? "Enter Organization ID to Join"
                    : "Organization ID"
                }
              />
              {isJoining && (
                <p className="text-[10px] text-gray-400 mt-1 ml-1">
                  Ask your admin for the Organization ID.
                </p>
              )}
            </div>
          )}

          {/* Common Fields */}
          <div className="relative">
            <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="email"
              required
              className="w-full pl-10 p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              placeholder="Email Address"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="password"
              required
              className="w-full pl-10 p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              placeholder="Password"
            />
          </div>

          <button
            disabled={isLoading}
            className="w-full bg-indigo-600 text-white p-3 rounded-xl font-bold hover:bg-indigo-700 transition flex justify-center items-center gap-2 shadow-md shadow-indigo-100"
          >
            {isLoading
              ? "Processing..."
              : isLogin
              ? "Sign In"
              : isJoining
              ? "Join Workspace"
              : "Create Workspace"}
            {!isLoading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>

        <div className="mt-8 text-center border-t border-gray-100 pt-6">
          <p className="text-sm text-gray-600">
            {isLogin ? "Don't have a workspace? " : "Already have an account? "}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-indigo-600 font-bold hover:underline"
            >
              {isLogin ? "Sign Up" : "Sign In"}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
