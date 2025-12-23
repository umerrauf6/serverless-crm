import { useState, useEffect } from "react";
import axios from "axios";
import { Trash2, Shield, Mail, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function TeamManager({ apiUrl, currentUser, onShowToast }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [userToDelete, setUserToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await axios.get(`${apiUrl}/users`);

      // ✅ SAFETY CHECK: Only set state if it's actually an array
      if (Array.isArray(res.data)) {
        setUsers(res.data);
      } else {
        console.warn("API returned invalid team data:", res.data);
        setUsers([]); // Fallback to empty list
      }
      setLoading(false);
    } catch (error) {
      console.error(error);
      setUsers([]); // Safety fallback
      setLoading(false);
    }
  };

  const initiateDelete = (user) => {
    setUserToDelete(user);
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;

    setIsDeleting(true);
    try {
      await axios.delete(
        `${apiUrl}/users/${encodeURIComponent(userToDelete.email)}`
      );
      setUsers(users.filter((u) => u.email !== userToDelete.email));
      onShowToast("User removed from organization", "success");
      setUserToDelete(null);
    } catch (error) {
      console.error(error);
      const msg = error.response?.data?.error || "Failed to delete user";
      onShowToast(msg, "error");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto relative h-full flex flex-col">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
          <Shield className="w-8 h-8 text-indigo-600" /> Team Management
        </h1>
        <p className="text-gray-500 mt-2">
          Manage access and roles for your organization.
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex-1">
        <div className="overflow-y-auto h-full">
          {/* Header - Hidden on Mobile */}
          <div className="hidden md:grid grid-cols-12 bg-gray-50 p-4 border-b border-gray-100 text-xs font-bold text-gray-400 uppercase tracking-wider sticky top-0 z-10">
            <div className="col-span-4">User</div>
            <div className="col-span-4">Email</div>
            <div className="col-span-2">Role</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>

          {loading ? (
            <div className="p-8 text-center text-gray-400">Loading team...</div>
          ) : (
            // ✅ SAFE MAP: Use optional chaining or fallback just in case
            (users || []).map((user) => (
              <div
                key={user.userId || user.email}
                className={`
                  relative p-4 border-b border-gray-100 transition
                  flex flex-col gap-3
                  md:grid md:grid-cols-12 md:gap-0 md:items-center
                  ${
                    userToDelete?.email === user.email
                      ? "bg-red-50"
                      : "hover:bg-gray-50"
                  }
                `}
              >
                {/* --- NAME SECTION (Mobile: Row 1, Desktop: Col 1) --- */}
                <div className="col-span-4 flex items-center justify-between md:justify-start gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold shrink-0">
                      {(user.name || "?").charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-800 truncate">
                        {user.name || "Unknown"}
                      </p>
                      {user.email === currentUser.email && (
                        <span className="text-xs text-green-600 font-medium md:hidden">
                          (You)
                        </span>
                      )}
                    </div>
                    {user.email === currentUser.email && (
                      <span className="text-xs text-green-600 font-medium hidden md:inline-block">
                        (You)
                      </span>
                    )}
                  </div>

                  {/* Mobile Role Badge */}
                  <div className="md:hidden shrink-0">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                        user.role === "ADMIN"
                          ? "bg-purple-100 text-purple-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {user.role}
                    </span>
                  </div>
                </div>

                {/* --- EMAIL SECTION (Mobile: Row 2, Desktop: Col 2) --- */}
                <div className="col-span-4 flex items-center justify-between md:justify-start gap-2">
                  <div className="flex items-center gap-2 text-gray-600 text-sm min-w-0">
                    <Mail className="w-4 h-4 text-gray-300 shrink-0" />
                    <span className="truncate">{user.email}</span>
                  </div>

                  {/* Mobile Actions */}
                  <div className="md:hidden">
                    {currentUser.role === "ADMIN" &&
                      user.email !== currentUser.email && (
                        <button
                          onClick={() => initiateDelete(user)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                  </div>
                </div>

                {/* --- DESKTOP ROLE (Col 3) --- */}
                <div className="col-span-2 hidden md:block">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      user.role === "ADMIN"
                        ? "bg-purple-100 text-purple-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {user.role}
                  </span>
                </div>

                {/* --- DESKTOP ACTIONS (Col 4) --- */}
                <div className="col-span-2 hidden md:flex justify-end">
                  {currentUser.role === "ADMIN" &&
                  user.email !== currentUser.email ? (
                    <button
                      onClick={() => initiateDelete(user)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                      title="Remove User"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  ) : (
                    <div className="w-9 h-9"></div>
                  )}
                </div>
              </div>
            ))
          )}

          {/* Empty State Message */}
          {!loading && users.length === 0 && (
            <div className="p-8 text-center text-gray-400 italic">
              No team members found.
            </div>
          )}
        </div>
      </div>

      {/* --- CONFIRMATION SLIDE-UP BAR --- */}
      <AnimatePresence>
        {userToDelete && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="absolute bottom-10 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-6 py-4 rounded-full shadow-2xl flex items-center gap-8 z-50 border border-gray-700 min-w-[400px]"
            style={{ translateX: "-50%" }}
          >
            <div className="flex items-center gap-3">
              <div className="bg-red-500/20 p-2 rounded-full">
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <span className="block font-bold text-sm">Remove User?</span>
                <span className="text-xs text-gray-400">
                  Permanently remove {userToDelete.name}?
                </span>
              </div>
            </div>

            <div className="flex gap-2 ml-auto">
              <button
                onClick={() => setUserToDelete(null)}
                className="px-3 py-1.5 text-xs font-medium text-gray-400 hover:text-white transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded-full transition shadow-lg"
              >
                {isDeleting ? "Deleting..." : "Confirm"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
