import { useState, useEffect } from "react";
import axios from "axios";

// COMPONENTS
import AuthScreen from "./components/AuthScreen";
import Sidebar from "./components/Sidebar";
import Dashboard from "./components/Dashboard";
import LeadsManager from "./components/LeadsManager";
import Settings from "./components/Settings";
import TeamManager from "./components/TeamManager"; // Ensure you have this imported
import NotificationToast from "./components/NotificationToast";
import KanbanBoard from "./components/KanbanBoard";

// 🔴 REPLACE WITH YOUR AWS API URL
const BASE_API = import.meta.env.VITE_API_URL;

export default function App() {
  // --- STATE ---
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  const [view, setView] = useState("dashboard");
  const [leads, setLeads] = useState([]);
  const [customFields, setCustomFields] = useState([]);
  const [notification, setNotification] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // New loading state for initial check

  // --- 1. CHECK LOGIN ON LOAD (The Fix) ---
  useEffect(() => {
    const savedUser = localStorage.getItem("pulse_user");
    const savedToken = localStorage.getItem("pulse_token");

    if (savedUser && savedToken) {
      // If found in storage, restore the session immediately
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      setToken(savedToken);
      axios.defaults.headers.common["Authorization"] = `Bearer ${savedToken}`;

      // Fetch fresh data in background
      fetchLeads();
      fetchSettings();
    }
    setIsLoading(false); // Done checking
  }, []);

  // --- HELPER: SHOW TOAST ---
  const showToast = (message, type = "success") => {
    setNotification({ message, type });
  };

  // --- AUTH HANDLERS ---
  const handleAuth = (userData, token, orgId) => {
    // 1. Save to State
    setUser(userData);
    setToken(token);

    // 2. Save to LocalStorage (PERSISTENCE)
    localStorage.setItem("pulse_user", JSON.stringify(userData));
    localStorage.setItem("pulse_token", token);

    // 3. Configure Axios
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

    // 4. Load Data
    fetchLeads();
    fetchSettings();
    showToast(`Welcome back, ${userData.name}!`, "success");
  };

  const handleLogout = () => {
    // 1. Clear State
    setUser(null);
    setToken(null);
    setLeads([]);

    // 2. Clear LocalStorage
    localStorage.removeItem("pulse_user");
    localStorage.removeItem("pulse_token");

    delete axios.defaults.headers.common["Authorization"];
    showToast("Logged out successfully", "warning");
  };

  // --- API FETCHERS ---
  const fetchLeads = async () => {
    try {
      const res = await axios.get(`${BASE_API}/leads`);

      // ✅ FIX: Ensure we only set an array
      if (Array.isArray(res.data)) {
        setLeads(res.data);
      } else {
        console.warn("API returned non-array data:", res.data);
        setLeads([]); // Fallback to empty array
      }
    } catch (error) {
      console.error("Error fetching leads:", error);
      if (error.response?.status === 401) handleLogout();
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await axios.get(`${BASE_API}/settings/fields`);

      // ✅ FIX: Only save if it's a real array
      if (Array.isArray(res.data)) {
        setCustomFields(res.data);
      } else {
        console.warn("Invalid custom fields data:", res.data);
        setCustomFields([]); // Fallback to empty
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
      setCustomFields([]); // Safety fallback
    }
  };

  // --- RENDER ---

  // 1. Show nothing while checking localStorage (prevents flashing Login screen)
  if (isLoading) return null;

  return (
    <>
      <NotificationToast
        notification={notification}
        onClose={() => setNotification(null)}
      />

      {/* 2. IF NOT LOGGED IN -> SHOW LOGIN SCREEN */}
      {!user ? (
        <AuthScreen onAuthenticated={handleAuth} onShowToast={showToast} />
      ) : (
        /* 3. IF LOGGED IN -> SHOW DASHBOARD */
        <div className="flex h-screen w-full bg-gray-50 text-gray-800 font-sans overflow-hidden">
          <Sidebar view={view} setView={setView} onLogout={handleLogout} />

          <div className="flex-1 flex flex-col h-full overflow-hidden relative">
            <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 shadow-sm z-10">
              <h2 className="text-lg font-semibold text-gray-700 capitalize tracking-tight">
                {view === "leads"
                  ? "Leads Management"
                  : view === "team"
                  ? "Team Management"
                  : view === "settings"
                  ? "Configuration"
                  : "Dashboard"}
              </h2>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 py-1 px-3 rounded-full hidden md:flex">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                  <span className="text-xs font-medium text-emerald-700">
                    Live Connection
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right hidden md:block">
                    <p className="text-sm font-bold text-gray-700">
                      {user.name}
                    </p>
                    <p className="text-xs text-gray-400">{user.email}</p>
                  </div>
                  <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold shadow-md border-2 border-white ring-2 ring-indigo-50">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                </div>
              </div>
            </header>

            <div className="flex-1 overflow-hidden bg-gray-50 relative">
              {view === "dashboard" && <Dashboard leads={leads} />}

              {view === "leads" && (
                <LeadsManager
                  leads={leads}
                  onLeadAdded={() => {
                    fetchLeads();
                    showToast("Lead added successfully!", "success");
                  }}
                  onNoteAdded={() => {
                    fetchLeads();
                    showToast("Note saved.", "success");
                  }}
                  onLeadDeleted={() => {
                    fetchLeads();
                    showToast("Lead deleted.", "warning");
                  }}
                  apiUrl={`${BASE_API}/leads`}
                  customFields={customFields}
                  showToast={showToast}
                />
              )}

              {view === "team" && (
                <TeamManager
                  apiUrl={BASE_API}
                  currentUser={user}
                  onShowToast={showToast}
                />
              )}

              {view === "kanban" && (
                <KanbanBoard
                  leads={leads}
                  onLeadUpdated={fetchLeads} // Reload data after drop
                  apiUrl={`${BASE_API}/leads`} // Endpoint base
                />
              )}

              {view === "settings" && (
                <Settings
                  customFields={customFields}
                  setCustomFields={setCustomFields}
                  apiUrl={BASE_API}
                  onSave={() => showToast("Configuration saved!", "success")}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
