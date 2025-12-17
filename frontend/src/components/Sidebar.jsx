import {
  Activity,
  LayoutDashboard,
  Users,
  LogOut,
  Settings,
} from "lucide-react";

export default function Sidebar({ view, setView, onLogout }) {
  return (
    <div className="w-20 lg:w-64 bg-indigo-900 text-white flex flex-col justify-between shadow-2xl z-20">
      <div>
        {/* Logo Area */}
        <div className="p-6 flex items-center gap-3 font-bold text-xl tracking-wider border-b border-indigo-800">
          <Activity className="text-indigo-400 w-6 h-6" />
          <span className="hidden lg:block">Serverless CRM</span>
        </div>

        {/* Navigation Links */}
        <nav className="mt-8 flex flex-col gap-2 px-4">
          <NavButton
            active={view === "dashboard"}
            onClick={() => setView("dashboard")}
            icon={<LayoutDashboard className="w-5 h-5" />}
            label="Dashboard"
          />
          <NavButton
            active={view === "leads"}
            onClick={() => setView("leads")}
            icon={<Users className="w-5 h-5" />}
            label="Leads CRM"
          />
          <NavButton
            active={view === "settings"}
            onClick={() => setView("settings")}
            icon={<Settings className="w-5 h-5" />}
            label="Configuration"
          />
          <NavButton
            active={view === "team"}
            onClick={() => setView("team")}
            icon={<Users className="w-5 h-5" />}
            label="Team"
          />
        </nav>
      </div>

      {/* Logout Button */}
      <div className="p-6 border-t border-indigo-800 bg-indigo-950">
        <button
          onClick={onLogout}
          className="flex items-center gap-3 text-indigo-300 hover:text-white transition w-full"
        >
          <LogOut className="w-5 h-5" />
          <span className="hidden lg:block font-medium">Sign Out</span>
        </button>
      </div>
    </div>
  );
}

// Helper Component for Buttons
function NavButton({ active, onClick, icon, label }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-200 w-full ${
        active
          ? "bg-indigo-600 text-white shadow-lg translate-x-1"
          : "text-indigo-300 hover:bg-indigo-800 hover:text-white"
      }`}
    >
      {icon} <span className="hidden lg:block font-medium">{label}</span>
    </button>
  );
}
