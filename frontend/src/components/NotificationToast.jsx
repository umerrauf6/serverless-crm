// src/components/NotificationToast.jsx
import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, XCircle, AlertTriangle, X } from "lucide-react";

export default function NotificationToast({ notification, onClose }) {
  // Auto-dismiss after 3 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [notification, onClose]);

  return (
    <AnimatePresence>
      {notification && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.9 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="fixed top-6 left-1/2 transform -translate-x-1/2 z-[100] w-[90vw] sm:w-auto sm:min-w-[320px] max-w-md"
          style={{ translateX: "-50%" }} // Fixes centering issue with Framer Motion
        >
          <div
            className={`
            flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border backdrop-blur-md
            ${
              notification.type === "error"
                ? "bg-red-50/90 border-red-200 text-red-800"
                : ""
            }
            ${
              notification.type === "success"
                ? "bg-green-50/90 border-green-200 text-green-800"
                : ""
            }
            ${
              notification.type === "warning"
                ? "bg-amber-50/90 border-amber-200 text-amber-800"
                : ""
            }
          `}
          >
            {/* Icon Based on Type */}
            <div className="shrink-0">
              {notification.type === "error" && (
                <XCircle className="w-5 h-5 text-red-500" />
              )}
              {notification.type === "success" && (
                <CheckCircle className="w-5 h-5 text-green-500" />
              )}
              {notification.type === "warning" && (
                <AlertTriangle className="w-5 h-5 text-amber-500" />
              )}
            </div>

            {/* Message Text */}
            <div className="flex-1">
              <p className="text-sm font-semibold">{notification.message}</p>
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-1 rounded-full hover:bg-black/5 transition opacity-50 hover:opacity-100"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
