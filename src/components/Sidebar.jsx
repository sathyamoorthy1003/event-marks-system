import React from "react";
import {
  LayoutDashboard,
  Users,
  QrCode,
  UserCheck,
  FileSpreadsheet,
  Settings,
  LogOut,
  Activity,
  Award,
} from "lucide-react";

const Sidebar = ({ view, setView, onLogout, activeAppId }) => {
  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "participants", label: "Participants", icon: Users },
    { id: "invigilators", label: "Invigilators", icon: UserCheck },
    { id: "qr", label: "QR Codes", icon: QrCode },
    { id: "submissions", label: "Submissions", icon: FileSpreadsheet },
    { id: "ranking", label: "Ranking Logic", icon: Award },
    { id: "export", label: "Export Data", icon: FileSpreadsheet },
    { id: "audit", label: "Audit Logs", icon: Activity },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="w-64 bg-slate-900 text-white flex flex-col h-full shadow-xl">
      <div className="p-6 border-b border-slate-800">
        <h1 className="text-xl font-bold tracking-tight">Event Marks</h1>
        <p className="text-xs text-slate-400 mt-1">Management System</p>
        {activeAppId && (
            <p className="text-[10px] text-slate-500 mt-2 font-mono truncate">
                ID: {activeAppId}
            </p>
        )}
      </div>
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setView(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
              view === item.id
                ? "bg-blue-600 text-white shadow-lg shadow-blue-900/50"
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <item.icon size={20} />
            <span className="font-medium text-sm">{item.label}</span>
          </button>
        ))}
      </nav>
      <div className="p-4 border-t border-slate-800">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-400 hover:bg-red-500/10 hover:text-red-500 transition-all"
        >
          <LogOut size={20} />
          <span className="font-medium text-sm">Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
