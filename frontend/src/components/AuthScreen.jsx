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
  KeyRound,
} from "lucide-react";
import axios from "axios";

// 🔴 Ensure your .env file has VITE_API_URL defined
const API_URL = import.meta.env.VITE_API_URL;

export default function AuthScreen({ onAuthenticated, onShowToast }) {
  // MODES: 'LOGIN' | 'SIGNUP' | 'FORGOT_EMAIL' | 'FORGOT_CODE'
  const [authMode, setAuthMode] = useState("LOGIN");
  const [isJoining, setIsJoining] = useState(false); // Toggle for "Create" vs "Join" in Signup
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    orgName: "",
    orgId: "",
    resetCode: "",
    newPassword: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // --- 1. LOGIN ---
      if (authMode === "LOGIN") {
        const res = await axios.post(`${API_URL}/auth/login`, {
          email: formData.email,
          password: formData.password,
          orgId: formData.orgId,
        });
        onAuthenticated(res.data.user, res.data.token, res.data.orgId);
      }

      // --- 2. SIGNUP ---
      else if (authMode === "SIGNUP") {
        const payload = {
          email: formData.email,
          password: formData.password,
          name: formData.name,
          // If Joining: Send orgId. If Creating: Send orgName.
          ...(isJoining
            ? { orgId: formData.orgId }
            : { orgName: formData.orgName }),
        };

        const res = await axios.post(`${API_URL}/auth/signup`, payload);

        // Auto-fill the Org ID for them
        setFormData((prev) => ({ ...prev, orgId: res.data.orgId }));

        setAuthMode("LOGIN");
        if (onShowToast) {
          const msg =
            res.data.role === "ADMIN"
              ? "Workspace created! Please log in."
              : "Joined workspace! Please log in.";
          onShowToast(msg, "success");
        }
      }

      // --- 3. FORGOT PASSWORD: STEP A (Send Code) ---
      else if (authMode === "FORGOT_EMAIL") {
        await axios.post(`${API_URL}/auth/forgot-password`, {
          email: formData.email,
        });
        setAuthMode("FORGOT_CODE");
        if (onShowToast)
          onShowToast("Reset code sent to your email.", "success");
      }

      // --- 4. FORGOT PASSWORD: STEP B (Verify & Reset) ---
      else if (authMode === "FORGOT_CODE") {
        await axios.post(`${API_URL}/auth/reset-password`, {
          email: formData.email,
          code: formData.resetCode,
          newPassword: formData.newPassword,
        });
        setAuthMode("LOGIN");
        if (onShowToast)
          onShowToast("Password reset! Please log in.", "success");
      }
    } catch (error) {
      console.error(error);
      const msg = error.response?.data?.error || "Request failed";
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
        className="bg-white p-6 md:p-8 rounded-2xl shadow-xl w-[90%] max-w-md border border-gray-100"
      >
        {/* HEADER */}
        <div className="flex flex-col items-center justify-center mb-6">
          <div className="bg-indigo-600 p-3 rounded-xl shadow-lg shadow-indigo-200 mb-4">
            <Activity className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            PULSE CRM
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {authMode === "LOGIN"
              ? "Sign in to your workspace"
              : authMode === "SIGNUP"
              ? "Create or Join a Workspace"
              : authMode === "FORGOT_EMAIL"
              ? "Recover your password"
              : "Set a new password"}
          </p>
        </div>

        {/* JOIN / CREATE TOGGLE (Only visible in Signup) */}
        {authMode === "SIGNUP" && (
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
          {/* --- COMMON: EMAIL --- */}
          {/* We hide this in FORGOT_CODE to prevent changing email midway */}
          {authMode !== "FORGOT_CODE" && (
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
          )}

          {/* --- VIEW: SIGNUP --- */}
          {authMode === "SIGNUP" && (
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

          {/* Org Name (Only if Creating New) */}
          {authMode === "SIGNUP" && !isJoining && (
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

          {/* Org ID (If Joining or Logging In) */}
          {((authMode === "SIGNUP" && isJoining) || authMode === "LOGIN") && (
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

          {/* --- VIEW: PASSWORD INPUTS --- */}
          {(authMode === "LOGIN" || authMode === "SIGNUP") && (
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
          )}

          {/* --- VIEW: FORGOT PASSWORD CODE --- */}
          {authMode === "FORGOT_CODE" && (
            <>
              <div className="p-3 bg-blue-50 text-blue-700 rounded-lg text-sm text-center mb-2">
                We sent a code to <strong>{formData.email}</strong>
              </div>
              <div className="relative">
                <KeyRound className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  required
                  className="w-full pl-10 p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition font-mono tracking-widest"
                  value={formData.resetCode}
                  onChange={(e) =>
                    setFormData({ ...formData, resetCode: e.target.value })
                  }
                  placeholder="Enter 6-digit Code"
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  required
                  className="w-full pl-10 p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition"
                  value={formData.newPassword}
                  onChange={(e) =>
                    setFormData({ ...formData, newPassword: e.target.value })
                  }
                  placeholder="New Password"
                />
              </div>
            </>
          )}

          {/* SUBMIT BUTTON */}
          <button
            disabled={isLoading}
            className="w-full bg-indigo-600 text-white p-3 rounded-xl font-bold hover:bg-indigo-700 transition flex justify-center items-center gap-2 shadow-md shadow-indigo-100"
          >
            {isLoading
              ? "Processing..."
              : authMode === "LOGIN"
              ? "Sign In"
              : authMode === "SIGNUP"
              ? isJoining
                ? "Join Workspace"
                : "Create Workspace"
              : authMode === "FORGOT_EMAIL"
              ? "Send Reset Code"
              : "Reset Password"}
            {!isLoading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>

        {/* FOOTER LINKS */}
        <div className="mt-8 text-center border-t border-gray-100 pt-6 space-y-2">
          {authMode === "LOGIN" && (
            <>
              <p className="text-sm text-gray-600">
                Don't have a workspace?{" "}
                <button
                  onClick={() => setAuthMode("SIGNUP")}
                  className="text-indigo-600 font-bold hover:underline"
                >
                  Sign Up
                </button>
              </p>
              <button
                onClick={() => setAuthMode("FORGOT_EMAIL")}
                className="text-xs text-gray-400 hover:text-gray-600"
              >
                Forgot your password?
              </button>
            </>
          )}

          {authMode === "SIGNUP" && (
            <p className="text-sm text-gray-600">
              Already have an account?{" "}
              <button
                onClick={() => setAuthMode("LOGIN")}
                className="text-indigo-600 font-bold hover:underline"
              >
                Sign In
              </button>
            </p>
          )}

          {(authMode === "FORGOT_EMAIL" || authMode === "FORGOT_CODE") && (
            <button
              onClick={() => setAuthMode("LOGIN")}
              className="text-sm text-gray-500 hover:text-gray-800 font-medium"
            >
              ← Back to Login
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
