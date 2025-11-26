import React, { useState, useEffect, useMemo, useRef } from "react";
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  deleteDoc,
  doc,
  serverTimestamp,
  query,
  orderBy,
  setDoc,
  writeBatch,
  updateDoc,
  where,
  getDocs,
} from "firebase/firestore";
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged,
  signInWithCustomToken,
  signOut,
} from "firebase/auth";
import {
  LayoutDashboard,
  Users,
  QrCode,
  UserCheck,
  FileSpreadsheet,
  Settings,
  Plus,
  Trash2,
  Download,
  Award,
  CheckCircle,
  X,
  LogOut,
  ChevronRight,
  Search,
  FileJson,
  AlertCircle,
  Save,
  FileText,
  Shield,
  Activity,
  Upload,
  FileDown,
  Printer,
  Power,
  Lock,
  Unlock,
  ClipboardList,
  CheckSquare,
  Square,
  FileArchive,
  FileType,
  Star,
  Bell,
  Calculator,
  ChevronLeft,
  Eye,
  Loader,
  KeyRound,
  Mail,
  Database,
  LogIn,
  UserPlus,
} from "lucide-react";

// ==========================================
// --- src/lib/firebase.js ---
// ==========================================

// Use __firebase_config environment variable if available (Preview Environment)
// Otherwise fallback to the user's hardcoded config (Local Dev / Production)
let firebaseConfig;
try {
  if (typeof __firebase_config !== "undefined") {
    firebaseConfig = JSON.parse(__firebase_config);
  } else {
    // User's actual config (fallback for local/deployment if env var missing)
    firebaseConfig = {
      apiKey: "AIzaSyBSnLkIdiPYdkzEvtYAfjJ-dJFfwXPyf7w",
      authDomain: "event-mark.firebaseapp.com",
      projectId: "event-mark",
      storageBucket: "event-mark.firebasestorage.app",
      messagingSenderId: "859059423914",
      appId: "1:859059423914:web:82db36f82ab7e5acd8ded3",
      measurementId: "G-SL4FRYN3FQ",
    };
  }
} catch (error) {
  console.error("Firebase Config Error:", error);
}

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// CONSTANTS
const MASTER_SYSTEM_ID = "sys_master_v1";
const DEFAULT_APP_ID = "demo_event_v1";

// Use the environment-provided App ID for the root path to strictly follow permissions
const GLOBAL_ROOT_ID =
  typeof __app_id !== "undefined" ? __app_id : "default-global-id";

// Helper to generate consistent collection paths avoiding permission errors
// Strategy: Flattened Multi-Tenancy
const getCollectionRef = (tenantId, collectionName) => {
  const safeTenant = tenantId || DEFAULT_APP_ID;
  const finalName = `${safeTenant}_${collectionName}`;
  return collection(
    db,
    "artifacts",
    GLOBAL_ROOT_ID,
    "public",
    "data",
    finalName
  );
};

const getDocRef = (tenantId, collectionName, docId) => {
  const safeTenant = tenantId || DEFAULT_APP_ID;
  const finalName = `${safeTenant}_${collectionName}`;
  return doc(
    db,
    "artifacts",
    GLOBAL_ROOT_ID,
    "public",
    "data",
    finalName,
    docId
  );
};

// ==========================================
// --- src/components/UIComponents.jsx ---
// ==========================================
const Card = ({ children, className = "" }) => (
  <div
    className={`bg-white rounded-xl border border-slate-200 shadow-sm ${className}`}
  >
    {children}
  </div>
);

const Button = ({
  children,
  variant = "primary",
  className = "",
  onClick,
  disabled,
  icon: Icon,
  ...props
}) => {
  const baseStyle =
    "px-4 py-2 rounded-lg font-medium transition-all flex items-center justify-center gap-2 text-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    primary:
      "bg-blue-600 text-white hover:bg-blue-700 shadow-sm shadow-blue-200",
    success:
      "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm shadow-emerald-200",
    secondary:
      "bg-white text-slate-700 border border-slate-300 hover:bg-slate-50",
    danger: "bg-red-50 text-red-600 hover:bg-red-100 border border-red-200",
    ghost: "text-slate-600 hover:bg-slate-100",
    dark: "bg-slate-800 text-white hover:bg-slate-900 shadow-sm",
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyle} ${variants[variant]} ${className}`}
      {...props}
    >
      {Icon && <Icon size={16} />}
      {children}
    </button>
  );
};

const Input = ({ label, className, error, icon: Icon, ...props }) => (
  <div className={`space-y-1.5 w-full ${className}`}>
    {label && (
      <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">
        {label}
      </label>
    )}
    <div className="relative">
      <input
        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-all text-sm placeholder:text-slate-400 ${
          Icon ? "pl-10" : ""
        } ${
          error
            ? "border-red-300 focus:ring-red-200"
            : "border-slate-300 focus:ring-blue-500 focus:border-transparent"
        }`}
        {...props}
      />
      {Icon && (
        <Icon size={18} className="absolute left-3 top-2.5 text-slate-400" />
      )}
    </div>
    {error && <p className="text-xs text-red-500">{error}</p>}
  </div>
);

const Badge = ({ children, color = "blue" }) => {
  const colors = {
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    green: "bg-emerald-50 text-emerald-700 border-emerald-200",
    red: "bg-red-50 text-red-700 border-red-200",
    purple: "bg-purple-50 text-purple-700 border-purple-200",
    orange: "bg-orange-50 text-orange-700 border-orange-200",
    gray: "bg-slate-100 text-slate-600 border-slate-200",
  };
  return (
    <span
      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
        colors[color] || colors.blue
      }`}
    >
      {children}
    </span>
  );
};

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h3 className="font-bold text-lg text-slate-800">{title}</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-200 rounded-full transition-colors text-slate-500"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-6 max-h-[80vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
};

const ToastContainer = ({ toasts, removeToast }) => (
  <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2">
    {toasts.map((toast) => (
      <div
        key={toast.id}
        className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border transition-all animate-in slide-in-from-right duration-300 ${
          toast.type === "error"
            ? "bg-white border-red-100 text-red-600"
            : toast.type === "success"
            ? "bg-white border-green-100 text-green-600"
            : "bg-white border-blue-100 text-blue-600"
        }`}
      >
        {toast.type === "error" ? (
          <AlertCircle size={20} />
        ) : (
          <CheckCircle size={20} />
        )}
        <p className="text-sm font-medium text-slate-800">{toast.message}</p>
        <button
          onClick={() => removeToast(toast.id)}
          className="ml-2 text-slate-400 hover:text-slate-600"
        >
          <X size={14} />
        </button>
      </div>
    ))}
  </div>
);

// Reusable Pagination Component
const Pagination = ({
  totalItems,
  itemsPerPage,
  currentPage,
  onPageChange,
}) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50 rounded-b-xl">
      <div className="text-xs text-slate-500">
        Showing <b>{(currentPage - 1) * itemsPerPage + 1}</b> to{" "}
        <b>{Math.min(currentPage * itemsPerPage, totalItems)}</b> of{" "}
        <b>{totalItems}</b>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="p-1 rounded hover:bg-slate-200 disabled:opacity-30"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="text-sm font-medium text-slate-700 px-2">
          {currentPage} / {totalPages}
        </span>
        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="p-1 rounded hover:bg-slate-200 disabled:opacity-30"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};

// Sample Data Viewer Component
const SampleDataPreview = ({ type, onClose }) => {
  const isParticipant = type === "participant";
  const data = isParticipant
    ? [
        { col1: "The Avengers", col2: "TM-AV01" },
        { col1: "Cyber Punks", col2: "TM-CP99" },
        { col1: "Team Alpha", col2: "TM-001" },
      ]
    : [
        { col1: "JDG001", col2: "Dr. Smith" },
        { col1: "JDG002", col2: "Prof. X" },
        { col1: "JDG003", col2: "Jane Doe" },
      ];

  const headers = isParticipant
    ? ["Team Name", "Team ID (Mandatory)"]
    : ["Judge ID", "Name (Optional)"];

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
        <p className="text-sm text-blue-800 mb-2 font-bold">
          Format Instructions:
        </p>
        <ul className="list-disc list-inside text-xs text-blue-700 space-y-1">
          <li>
            File must be <b>.csv</b> format.
          </li>
          <li>First row is ignored (headers).</li>
          <li>
            <b>Column A:</b> {headers[0]}
          </li>
          <li>
            <b>Column B:</b> {headers[1]}
          </li>
        </ul>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-100 text-slate-700 font-bold">
            <tr>
              <th className="px-4 py-2 border-b border-r">A</th>
              <th className="px-4 py-2 border-b">B</th>
            </tr>
          </thead>
          <tbody>
            <tr className="bg-slate-50 text-slate-500 italic">
              <td className="px-4 py-2 border-r border-b">{headers[0]}</td>
              <td className="px-4 py-2 border-b">{headers[1]}</td>
            </tr>
            {data.map((row, i) => (
              <tr key={i} className="border-b last:border-0">
                <td className="px-4 py-2 border-r">{row.col1}</td>
                <td className="px-4 py-2">{row.col2}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex justify-end">
        <Button onClick={onClose}>Close Preview</Button>
      </div>
    </div>
  );
};

// ==========================================
// --- SUPER ADMIN VIEW ---
// ==========================================
const SuperAdminDashboard = ({ onLogout, onAccessDatabase }) => {
  const [clients, setClients] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newClient, setNewClient] = useState({
    orgName: "",
    email: "",
    password: "",
  });

  useEffect(() => {
    // Uses 'MASTER_SYSTEM_ID' as the tenant prefix for the system users collection
    const unsub = onSnapshot(
      getCollectionRef(MASTER_SYSTEM_ID, "system_users"),
      (snap) => {
        setClients(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      }
    );
    return () => unsub();
  }, []);

  const createClient = async () => {
    if (!newClient.email || !newClient.password || !newClient.orgName) {
      alert("All fields are required");
      return;
    }

    const uniqueAppId = "event-" + Math.random().toString(36).substr(2, 9);

    try {
      await addDoc(getCollectionRef(MASTER_SYSTEM_ID, "system_users"), {
        ...newClient,
        uniqueAppId: uniqueAppId,
        createdAt: serverTimestamp(),
        role: "client",
      });
      setNewClient({ orgName: "", email: "", password: "" });
      setIsModalOpen(false);
    } catch (e) {
      alert("Error creating client. Check console for permissions.");
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-900 flex flex-col">
      <div className="bg-slate-900 text-white p-6 flex justify-between items-center shadow-lg">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-blue-500/50 shadow-lg">
            <Shield size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Super Admin Console</h1>
            <p className="text-xs text-slate-400 uppercase tracking-wider">
              Database Management System
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right mr-4 hidden md:block">
            <p className="text-sm font-bold">Sathyamoorthy</p>
            <p className="text-xs text-slate-400">Super Administrator</p>
          </div>
          <Button
            variant="secondary"
            className="bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
            onClick={onLogout}
            icon={LogOut}
          >
            Logout
          </Button>
        </div>
      </div>

      <div className="flex-1 p-8 max-w-7xl mx-auto w-full">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">
              Client Databases
            </h2>
            <p className="text-slate-500">
              Manage event organizers and their isolated environments.
            </p>
          </div>
          <Button
            icon={UserPlus}
            onClick={() => setIsModalOpen(true)}
            className="shadow-xl"
          >
            Add New Client
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clients.map((client) => (
            <Card
              key={client.id}
              className="p-6 hover:shadow-xl transition-all border-t-4 border-t-blue-600 group"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <Database size={24} />
                </div>
                <button
                  className="text-slate-300 hover:text-red-500"
                  onClick={() =>
                    deleteDoc(
                      getDocRef(MASTER_SYSTEM_ID, "system_users", client.id)
                    )
                  }
                >
                  <Trash2 size={18} />
                </button>
              </div>

              <h3 className="font-bold text-lg text-slate-900 mb-1">
                {client.organizationName}
              </h3>
              <div className="space-y-2 mb-6">
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Mail size={14} /> {client.email}
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-500 font-mono bg-slate-100 px-2 py-1 rounded w-fit">
                  <KeyRound size={14} /> {client.password}
                </div>
                <div className="text-xs text-slate-400 mt-2">
                  DB ID: {client.uniqueAppId}
                </div>
              </div>

              <Button
                onClick={() => onAccessDatabase(client)}
                className="w-full"
                variant="secondary"
                icon={LogIn}
              >
                Access Database
              </Button>
            </Card>
          ))}

          {clients.length === 0 && (
            <div className="col-span-full p-12 text-center border-2 border-dashed border-slate-300 rounded-xl text-slate-400">
              <Database size={48} className="mx-auto mb-4 opacity-20" />
              <p>No clients found. Create your first client database.</p>
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create New Client Database"
      >
        <div className="space-y-4">
          <Input
            label="Organization Name"
            placeholder="e.g. MIT Tech Fest"
            value={newClient.orgName}
            onChange={(e) =>
              setNewClient({ ...newClient, orgName: e.target.value })
            }
          />
          <Input
            label="Login Email"
            placeholder="client@event.com"
            value={newClient.email}
            onChange={(e) =>
              setNewClient({ ...newClient, email: e.target.value })
            }
          />
          <Input
            label="Login Password"
            type="password"
            placeholder="******"
            value={newClient.password}
            onChange={(e) =>
              setNewClient({ ...newClient, password: e.target.value })
            }
          />
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={createClient}>Create Database</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

// ==========================================
// --- src/pages/LoginView.jsx ---
// ==========================================
const LoginView = ({ onLogin, addToast }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // 1. Check if Super Admin
    if (
      email.toLowerCase() === "sathyamoorthyc1003@gmail.com" &&
      password === "Prakash@1"
    ) {
      await new Promise((r) => setTimeout(r, 500));
      onLogin({ role: "super_admin", name: "Sathyamoorthy" });
      setLoading(false);
      return;
    }

    // 2. Check if it's a Client User
    try {
      const usersRef = getCollectionRef(MASTER_SYSTEM_ID, "system_users");
      const q = query(
        usersRef,
        where("email", "==", email),
        where("password", "==", password)
      );
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const userData = querySnapshot.docs[0].data();
        onLogin({
          role: "client",
          name: userData.organizationName || "Client",
          dbId: userData.uniqueAppId,
        });
      } else {
        // Demo fallback
        if (email === "admin@event.com" && password === "admin123") {
          onLogin({ role: "client", name: "Demo Admin", dbId: DEFAULT_APP_ID });
        } else {
          addToast("Invalid credentials", "error");
        }
      }
    } catch (err) {
      console.error(err);
      if (email === "admin@event.com" && password === "admin123") {
        onLogin({ role: "client", name: "Demo Admin", dbId: DEFAULT_APP_ID });
      } else {
        addToast("Login failed. Please check credentials.", "error");
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 shadow-2xl border-0">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200 mx-auto mb-4">
            <Shield size={32} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">System Access</h1>
          <p className="text-slate-500 mt-1">Event Marks Management</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="Email ID"
            icon={Mail}
            placeholder="user@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            label="Password"
            type="password"
            icon={KeyRound}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button className="w-full py-3 text-base" disabled={loading}>
            {loading ? "Verifying..." : "Login"}
          </Button>
        </form>
        <div className="mt-6 text-center text-xs text-slate-400">
          Secure Multi-Tenant Environment
        </div>
      </Card>
    </div>
  );
};

// ==========================================
// --- src/components/Sidebar.jsx ---
// ==========================================
const Sidebar = ({ view, setView, onLogout, userRole, activeAppId }) => {
  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "ranking", label: "Ranking Logic", icon: Calculator },
    { id: "participants", label: "Participants", icon: Users },
    { id: "qr", label: "QR Codes", icon: QrCode },
    { id: "invigilators", label: "Invigilators", icon: UserCheck },
    { id: "submissions", label: "Submissions", icon: FileSpreadsheet },
    { id: "audit", label: "Audit Logs", icon: FileJson },
    { id: "export", label: "Export Data", icon: Download },
    { id: "rubric", label: "Rubric Config", icon: Settings },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex-shrink-0 flex flex-col h-full">
      <div className="p-6 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center text-white ${
              userRole === "super_admin" ? "bg-purple-600" : "bg-blue-600"
            }`}
          >
            <Award size={22} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 leading-tight">
              EventMarks
            </h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              {userRole === "super_admin" ? "Impersonating" : "Client Portal"}
            </p>
          </div>
        </div>
      </div>
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setView(item.id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              view === item.id
                ? "bg-blue-50 text-blue-700 shadow-sm"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <item.icon
              size={18}
              className={view === item.id ? "text-blue-600" : "text-slate-400"}
            />
            {item.label}
            {view === item.id && (
              <ChevronRight size={14} className="ml-auto opacity-50" />
            )}
          </button>
        ))}
      </nav>
      <div className="p-4 border-t border-slate-100">
        <div className="mb-3 px-2 text-xs font-mono text-slate-400 break-all">
          DB: {activeAppId}
        </div>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors text-sm font-medium"
        >
          <LogOut size={18} />
          {userRole === "super_admin" ? "Exit to Admin" : "Sign Out"}
        </button>
      </div>
    </aside>
  );
};

// ==========================================
// --- src/pages/Dashboard.jsx ---
// ==========================================
const DashboardView = ({
  teams,
  invigilators,
  submissions,
  leaderboard,
  rankingConfig,
}) => {
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;
  const stats = [
    {
      label: "Total Participants",
      value: teams.length,
      icon: Users,
      color: "blue",
    },
    {
      label: "Total Invigilators",
      value: invigilators.length,
      icon: UserCheck,
      color: "green",
    },
    {
      label: "Total Submissions",
      value: submissions.length,
      icon: FileSpreadsheet,
      color: "purple",
    },
    { label: "Active Round", value: "Finals", icon: Award, color: "orange" },
  ];
  const paginatedLeaderboard = useMemo(() => {
    const start = (page - 1) * itemsPerPage;
    return leaderboard.slice(start, start + itemsPerPage);
  }, [leaderboard, page]);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Dashboard</h2>
        <p className="text-slate-500">
          Real-time event overview and leaderboard.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <Card
            key={i}
            className="p-6 flex items-start justify-between hover:shadow-md transition-shadow"
          >
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">
                {stat.label}
              </p>
              <p className="text-3xl font-bold text-slate-900">{stat.value}</p>
            </div>
            <div
              className={`p-3 rounded-lg ${
                stat.color === "blue"
                  ? "bg-blue-50 text-blue-600"
                  : stat.color === "green"
                  ? "bg-emerald-50 text-emerald-600"
                  : stat.color === "purple"
                  ? "bg-purple-50 text-purple-600"
                  : "bg-orange-50 text-orange-600"
              }`}
            >
              <stat.icon size={24} />
            </div>
          </Card>
        ))}
      </div>
      <Card className="overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              Top 10 Leaderboard
            </h3>
            <p className="text-sm text-slate-500">
              Ranking Method:{" "}
              <span className="font-semibold text-blue-600">
                {rankingConfig?.method === "bayesian"
                  ? "Bayesian Weighted"
                  : "Simple Sum"}
              </span>
            </p>
          </div>
          <Badge color="green">Live Updates On</Badge>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-medium">
                <th className="px-6 py-4">Rank</th>
                <th className="px-6 py-4">Code</th>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4 text-right">Evaluations</th>
                <th className="px-6 py-4 text-right">Raw Score</th>
                <th className="px-6 py-4 text-right">Weighted Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {leaderboard.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    Waiting for submissions...
                  </td>
                </tr>
              ) : (
                paginatedLeaderboard.map((team, index) => {
                  const actualRank = (page - 1) * itemsPerPage + index + 1;
                  return (
                    <tr
                      key={team.id}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        {actualRank === 1 ? (
                          <span className="text-xl">🥇</span>
                        ) : actualRank === 2 ? (
                          <span className="text-xl">🥈</span>
                        ) : actualRank === 3 ? (
                          <span className="text-xl">🥉</span>
                        ) : (
                          <span className="font-mono text-slate-400">
                            #{actualRank}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-500">
                        {team.teamCode}
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-800">
                        {team.teamName}
                      </td>
                      <td className="px-6 py-4 text-right text-slate-500">
                        {team.count}
                      </td>
                      <td className="px-6 py-4 text-right text-slate-400 font-mono">
                        {team.total?.toFixed(1)}
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-blue-600 text-lg">
                        {team.finalScore?.toFixed(2)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          totalItems={leaderboard.length}
          itemsPerPage={itemsPerPage}
          currentPage={page}
          onPageChange={setPage}
        />
      </Card>
    </div>
  );
};

// ==========================================
// --- src/pages/RankingLogic.jsx ---
// ==========================================
const RankingLogicView = ({
  rankingConfig,
  setRankingConfig,
  submissions,
  teams,
  addToast,
  currentAppId,
}) => {
  const [localConfig, setLocalConfig] = useState({
    method: "bayesian",
    autoCalculate: true,
    cValue: 5,
    mValue: 3.0,
  });
  const [calculatedStats, setCalculatedStats] = useState({ c: 0, m: 0 });

  useEffect(() => {
    if (rankingConfig) {
      setLocalConfig((prev) => ({
        ...prev,
        ...rankingConfig,
        cValue: rankingConfig.cValue ?? prev.cValue,
        mValue: rankingConfig.mValue ?? prev.mValue,
        autoCalculate: rankingConfig.autoCalculate ?? prev.autoCalculate,
      }));
    }
  }, [rankingConfig]);

  useEffect(() => {
    if (submissions.length > 0) {
      const totalRatings = submissions.length;
      const totalScoreSum = submissions.reduce(
        (acc, s) => acc + s.totalScore,
        0
      );
      const globalAvgRating = totalScoreSum / totalRatings;
      const teamCounts = {};
      submissions.forEach(
        (s) => (teamCounts[s.teamId] = (teamCounts[s.teamId] || 0) + 1)
      );
      const avgRatingsPerTeam = totalRatings / Object.keys(teamCounts).length;
      setCalculatedStats({
        c: parseFloat(avgRatingsPerTeam.toFixed(2)),
        m: parseFloat(globalAvgRating.toFixed(2)),
      });
    }
  }, [submissions]);

  const saveConfig = async () => {
    try {
      const configToSave = {
        ...localConfig,
        cValue: localConfig.autoCalculate
          ? calculatedStats.c
          : parseFloat(localConfig.cValue),
        mValue: localConfig.autoCalculate
          ? calculatedStats.m
          : parseFloat(localConfig.mValue),
      };
      await setDoc(
        getDocRef(currentAppId, "ranking_config", "main"),
        configToSave
      );
      await addDoc(getCollectionRef(currentAppId, "audit_logs"), {
        action: "ranking_config_update",
        details: configToSave,
        timestamp: serverTimestamp(),
      });
      addToast("Ranking Logic Updated", "success");
    } catch (e) {
      console.error(e);
      addToast("Error saving configuration", "error");
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Ranking Logic</h2>
        <p className="text-slate-500">
          Configure how the leaderboard ranks participants.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="font-bold text-lg mb-4 text-slate-800 flex items-center gap-2">
            <Settings size={20} /> Ranking Method
          </h3>
          <div className="space-y-3">
            <button
              onClick={() =>
                setLocalConfig({ ...localConfig, method: "bayesian" })
              }
              className={`w-full text-left p-4 rounded-xl border transition-all ${
                localConfig.method === "bayesian"
                  ? "border-blue-500 bg-blue-50 ring-1 ring-blue-200"
                  : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-800">
                  Bayesian Weighted Average
                </span>
                {localConfig.method === "bayesian" && (
                  <CheckCircle size={18} className="text-blue-600" />
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Balances rating volume and score.
              </p>
            </button>
            <button
              onClick={() => setLocalConfig({ ...localConfig, method: "sum" })}
              className={`w-full text-left p-4 rounded-xl border transition-all ${
                localConfig.method === "sum"
                  ? "border-blue-500 bg-blue-50 ring-1 ring-blue-200"
                  : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-800">
                  Simple Sum (Total Points)
                </span>
                {localConfig.method === "sum" && (
                  <CheckCircle size={18} className="text-blue-600" />
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Classic leaderboard.
              </p>
            </button>
          </div>
        </Card>
        <Card className="p-6 bg-slate-900 text-white">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
            <Calculator size={20} /> The Formula
          </h3>
          {localConfig.method === "bayesian" ? (
            <div className="space-y-4">
              <div className="p-4 bg-slate-800 rounded-lg font-mono text-sm text-center overflow-x-auto">
                <p className="text-blue-300 mb-2">Weighted Score = </p>
                <p className="text-lg">
                  ( v / (v + C) ) × R + ( C / (v + C) ) × m
                </p>
              </div>
              <ul className="text-sm space-y-2 text-slate-300">
                <li>
                  <strong className="text-white">v:</strong> Number of ratings.
                </li>
                <li>
                  <strong className="text-white">R:</strong> Average rating.
                </li>
                <li>
                  <strong className="text-white">C:</strong> Minimum ratings
                  threshold.
                </li>
                <li>
                  <strong className="text-white">m:</strong> Global average
                  rating.
                </li>
              </ul>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-slate-400">
              <p className="text-center">Score = Sum of all points.</p>
            </div>
          )}
        </Card>
      </div>
      {localConfig.method === "bayesian" && (
        <Card className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-lg text-slate-800">
              Algorithm Parameters
            </h3>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-slate-600">
                Auto-Calculate
              </label>
              <button
                onClick={() =>
                  setLocalConfig({
                    ...localConfig,
                    autoCalculate: !localConfig.autoCalculate,
                  })
                }
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  localConfig.autoCalculate ? "bg-blue-600" : "bg-slate-200"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    localConfig.autoCalculate
                      ? "translate-x-6"
                      : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-bold text-slate-700">
                  C (Threshold)
                </label>
                {localConfig.autoCalculate && (
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                    Calculated: {calculatedStats.c}
                  </span>
                )}
              </div>
              <Input
                type="number"
                step="0.1"
                disabled={localConfig.autoCalculate}
                value={
                  localConfig.autoCalculate
                    ? calculatedStats.c ?? 0
                    : localConfig.cValue ?? ""
                }
                onChange={(e) =>
                  setLocalConfig({ ...localConfig, cValue: e.target.value })
                }
              />
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-bold text-slate-700">
                  m (Average)
                </label>
                {localConfig.autoCalculate && (
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                    Calculated: {calculatedStats.m}
                  </span>
                )}
              </div>
              <Input
                type="number"
                step="0.1"
                disabled={localConfig.autoCalculate}
                value={
                  localConfig.autoCalculate
                    ? calculatedStats.m ?? 0
                    : localConfig.mValue ?? ""
                }
                onChange={(e) =>
                  setLocalConfig({ ...localConfig, mValue: e.target.value })
                }
              />
            </div>
          </div>
        </Card>
      )}
      <div className="fixed bottom-0 left-64 right-0 p-4 bg-white border-t border-slate-200 flex justify-end gap-4 z-10">
        <Button onClick={saveConfig} icon={Save}>
          Save Ranking Logic
        </Button>
      </div>
    </div>
  );
};

// ==========================================
// --- src/pages/QRCodes.jsx ---
// ==========================================
const QRCodeManager = ({ teams, onSimulateScan, addToast }) => {
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!window.JSZip) {
      const script = document.createElement("script");
      script.src =
        "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js";
      script.async = true;
      document.body.appendChild(script);
    }
    if (!window.docx) {
      const script = document.createElement("script");
      script.src = "https://unpkg.com/docx@7.1.0/build/index.js";
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  const toggleSelect = (id) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === teams.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(teams.map((t) => t.id)));
  };

  const downloadSingle = async (team) => {
    try {
      const url = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
        window.location.href + "?team=" + team.id
      )}`;
      const response = await fetch(url);
      const blob = await response.blob();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `QR_${team.code}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      addToast("QR Code Downloaded", "success");
    } catch (e) {
      addToast("Error downloading QR", "error");
    }
  };

  const downloadZip = async () => {
    if (selectedIds.size === 0)
      return addToast("Select at least one team", "error");
    if (!window.JSZip)
      return addToast("Zip library loading... try again.", "error");

    setIsProcessing(true);
    const zip = new window.JSZip();
    const folder = zip.folder("QR_Codes");
    const selectedTeams = teams.filter((t) => selectedIds.has(t.id));

    try {
      await Promise.all(
        selectedTeams.map(async (team) => {
          const url = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
            window.location.href + "?team=" + team.id
          )}`;
          const response = await fetch(url);
          const blob = await response.blob();
          folder.file(
            `${team.code}_${team.name.replace(/\s+/g, "_")}.png`,
            blob
          );
        })
      );

      const content = await zip.generateAsync({ type: "blob" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(content);
      link.download = `QR_Codes_Batch_${new Date()
        .toISOString()
        .slice(0, 10)}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      addToast("Batch ZIP Downloaded", "success");
    } catch (e) {
      console.error(e);
      addToast("Error generating Zip", "error");
    }
    setIsProcessing(false);
  };

  const handlePrint = (team = null) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return addToast("Allow popups to print", "error");

    const styles = `
      body { font-family: sans-serif; padding: 20px; }
      .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
      .card { border: 1px dashed #ccc; padding: 30px; text-align: center; page-break-inside: avoid; border-radius: 12px; }
      .code { font-size: 28px; font-weight: 800; margin-bottom: 5px; display: block; letter-spacing: 2px; }
      .name { font-size: 20px; margin-bottom: 15px; font-weight: 600; }
      .img { width: 180px; height: 180px; }
      @media print { .no-print { display: none; } }
    `;

    const dataToPrint = team ? [team] : teams;

    const content = dataToPrint
      .map(
        (t) => `
      <div class="card">
        <span class="code">${t.code}</span>
        <div class="name">${t.name}</div>
        <img class="img" src="https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
          window.location.href + "?team=" + t.id
        )}" />
      </div>
    `
      )
      .join("");

    printWindow.document.write(`
      <html>
        <head><title>Print QR Codes</title><style>${styles}</style></head>
        <body>
          <h1 class="no-print">Print QR Codes (Ctrl+P / Cmd+P to Save as PDF)</h1>
          <div class="grid">${content}</div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const downloadWord = async () => {
    if (selectedIds.size === 0)
      return addToast("Select at least one team", "error");
    if (!window.docx) return addToast("Word generator loading...", "error");

    setIsProcessing(true);
    const selectedTeams = teams.filter((t) => selectedIds.has(t.id));
    const {
      Document,
      Packer,
      Paragraph,
      TextRun,
      ImageRun,
      AlignmentType,
      HeadingLevel,
      PageBreak,
    } = window.docx;

    const children = [];

    for (let i = 0; i < selectedTeams.length; i++) {
      const team = selectedTeams[i];
      const url = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
        window.location.href + "?team=" + team.id
      )}`;
      try {
        const resp = await fetch(url);
        const blob = await resp.blob();
        const arrayBuffer = await blob.arrayBuffer();

        children.push(
          new Paragraph({
            text: `${team.code}`,
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            spacing: { before: 200, after: 100 },
          }),
          new Paragraph({
            text: `${team.name}`,
            heading: HeadingLevel.HEADING_2,
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
          }),
          new Paragraph({
            children: [
              new ImageRun({
                data: arrayBuffer,
                transformation: { width: 300, height: 300 },
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
          })
        );

        if (i < selectedTeams.length - 1) {
          children.push(new Paragraph({ children: [new PageBreak()] }));
        }
      } catch (e) {
        console.error("Err fetching image for docx", e);
      }
    }

    const doc = new Document({
      sections: [{ properties: {}, children: children }],
    });

    try {
      const blob = await Packer.toBlob(doc);
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `QR_Codes_Doc_${new Date()
        .toISOString()
        .slice(0, 10)}.docx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      addToast("Word Document Generated", "success");
    } catch (e) {
      console.error(e);
      addToast("Error creating Word doc", "error");
    }
    setIsProcessing(false);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            QR Code Management
          </h2>
          <p className="text-slate-500">
            Generate and batch download QR codes.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="secondary"
            onClick={toggleSelectAll}
            icon={
              selectedIds.size === teams.length && teams.length > 0
                ? CheckSquare
                : Square
            }
          >
            {selectedIds.size === teams.length && teams.length > 0
              ? "Deselect All"
              : "Select All"}
          </Button>
          <Button
            onClick={downloadZip}
            disabled={isProcessing || selectedIds.size === 0}
            icon={FileArchive}
          >
            {isProcessing ? "Processing..." : "Download ZIP"}
          </Button>
          <Button
            onClick={downloadWord}
            disabled={isProcessing || selectedIds.size === 0}
            icon={FileType}
          >
            {isProcessing ? "Generating..." : "Download DOCX"}
          </Button>
          <Button
            variant="secondary"
            icon={Printer}
            onClick={() => handlePrint()}
          >
            Print All (PDF)
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teams.map((team) => (
          <div
            key={team.id}
            className={`relative bg-white rounded-xl border transition-all ${
              selectedIds.has(team.id)
                ? "border-blue-500 ring-2 ring-blue-200"
                : "border-slate-200"
            } shadow-sm hover:shadow-md p-6 flex flex-col items-center text-center space-y-4`}
          >
            <div className="absolute top-4 left-4">
              <input
                type="checkbox"
                checked={selectedIds.has(team.id)}
                onChange={() => toggleSelect(team.id)}
                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
              />
            </div>

            <div className="w-full font-mono text-2xl font-bold text-slate-800 tracking-wider border-b border-slate-100 pb-2 mt-2">
              {team.code}
            </div>

            <div className="w-full">
              <h3 className="font-bold text-lg text-slate-900 truncate">
                {team.name}
              </h3>
            </div>

            <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
                  window.location.href + "?team=" + team.id
                )}`}
                alt={`QR for ${team.name}`}
                className="w-32 h-32 object-contain"
              />
            </div>

            <div className="flex gap-2 w-full pt-2">
              <Button
                variant="secondary"
                className="flex-1 text-[10px] px-1"
                onClick={() => downloadSingle(team)}
              >
                Save PNG
              </Button>
              <Button
                variant="secondary"
                className="flex-1 text-[10px] px-1"
                onClick={() => handlePrint(team)}
              >
                Print
              </Button>
              <Button
                className="flex-1 text-[10px] px-1"
                onClick={() => onSimulateScan(team.id)}
              >
                Scan
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ==========================================
// --- src/pages/JudgeApp.jsx ---
// ==========================================
const JudgeApp = ({
  teamId,
  teams,
  rubric,
  invigilators,
  submissions,
  onExit,
  addToast,
  currentAppId,
}) => {
  const team = teams.find((t) => t.id === teamId);
  const [judgeId, setJudgeId] = useState("");
  const [authenticatedJudge, setAuthenticatedJudge] = useState(null);
  const [scores, setScores] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDone, setIsDone] = useState(false);

  const alreadyScored = useMemo(() => {
    if (!authenticatedJudge) return false;
    return submissions.some(
      (s) =>
        s.teamId === teamId && s.invigilatorId === authenticatedJudge.judgeId
    );
  }, [authenticatedJudge, submissions, teamId]);

  const verifyJudge = () => {
    const normalizedInput = judgeId.trim().toUpperCase();
    const valid = invigilators.find((i) => i.judgeId === normalizedInput);
    if (valid) {
      if (valid.status === "inactive") {
        addToast("Access Denied: Your ID is inactive.", "error");
      } else {
        setAuthenticatedJudge(valid);
        addToast(`Welcome, ${valid.name}`, "success");
      }
    } else {
      addToast("Invalid Judge ID", "error");
    }
  };

  const submitEvaluation = async () => {
    if (Object.keys(scores).length < rubric.length)
      return addToast("Please fill all criteria.", "error");
    setIsSubmitting(true);
    const total = Object.values(scores).reduce((a, b) => a + b, 0);

    try {
      await addDoc(getCollectionRef(currentAppId, "submissions"), {
        teamId: team.id,
        teamName: team.name,
        teamCode: team.code,
        invigilatorId: authenticatedJudge.judgeId,
        scores,
        totalScore: total,
        timestamp: serverTimestamp(),
      });
      await addDoc(getCollectionRef(currentAppId, "audit_logs"), {
        action: "score_submit",
        details: {
          team: team.name,
          judge: authenticatedJudge.judgeId,
          total: total,
        },
        timestamp: serverTimestamp(),
      });
      setIsDone(true);
      addToast("Scores Submitted Successfully!", "success");
    } catch (err) {
      console.error(err);
      addToast("Submission failed. Try again.", "error");
    }
    setIsSubmitting(false);
  };

  if (!team)
    return (
      <div className="h-screen flex items-center justify-center text-red-500">
        Invalid QR Code
      </div>
    );

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10 px-4 py-3 flex items-center justify-between shadow-sm">
        <div>
          <h1 className="font-bold text-slate-900">{team.name}</h1>
          <p className="text-xs text-slate-500 font-mono">{team.code}</p>
        </div>
        <button
          onClick={onExit}
          className="p-2 bg-slate-100 rounded-full text-slate-600"
        >
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 p-4 max-w-md mx-auto w-full">
        {!authenticatedJudge ? (
          <Card className="p-6 space-y-6 mt-10">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mx-auto mb-4">
                <UserCheck size={32} />
              </div>
              <h2 className="text-xl font-bold text-slate-900">
                Judge Verification
              </h2>
              <p className="text-slate-500 text-sm mt-1">
                Enter your ID to start scoring.
              </p>
            </div>
            <div className="space-y-4">
              <Input
                placeholder="Judge ID (e.g., JDG001)"
                value={judgeId}
                onChange={(e) => setJudgeId(e.target.value)}
                className="text-center uppercase tracking-widest text-lg"
              />
              <Button onClick={verifyJudge} className="w-full py-3 text-base">
                Verify Identity
              </Button>
            </div>
          </Card>
        ) : isDone || alreadyScored ? (
          <Card className="p-8 text-center mt-10 space-y-4">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-green-600 mx-auto">
              <CheckCircle size={40} />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Success!</h2>
            <p className="text-slate-600">
              Evaluation for <strong>{team.name}</strong> has been submitted.
            </p>
            <Button variant="secondary" onClick={onExit} className="w-full">
              Return to Home
            </Button>
          </Card>
        ) : (
          <div className="space-y-6">
            <div className="bg-blue-600 text-white p-4 rounded-xl shadow-lg shadow-blue-200">
              <p className="text-blue-100 text-xs font-bold uppercase">
                Current Judge
              </p>
              <p className="font-medium text-lg">
                {authenticatedJudge.name} ({authenticatedJudge.judgeId})
              </p>
            </div>
            <div className="space-y-4">
              {rubric.map((criterion) => (
                <Card key={criterion.id} className="p-5">
                  <div className="flex justify-between items-center mb-3">
                    <div>
                      <label className="font-bold text-slate-800 block">
                        {criterion.name}
                      </label>
                      <span className="text-xs text-slate-400">
                        Type:{" "}
                        {criterion.inputType === "stars"
                          ? "Star Rating"
                          : "Score"}
                      </span>
                    </div>
                    <span className="text-xs font-bold bg-slate-100 px-2 py-1 rounded text-slate-500">
                      Max: {criterion.max}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2 items-center">
                    {criterion.inputType === "stars" ? (
                      [...Array(criterion.max)].map((_, i) => (
                        <button
                          key={i}
                          onClick={() =>
                            setScores({ ...scores, [criterion.id]: i + 1 })
                          }
                          className={`transition-all transform active:scale-90 ${
                            (scores[criterion.id] || 0) > i
                              ? "text-yellow-400 fill-yellow-400 scale-110"
                              : "text-slate-200 hover:text-slate-300"
                          }`}
                        >
                          <Star
                            size={32}
                            className={
                              (scores[criterion.id] || 0) > i
                                ? "fill-current"
                                : ""
                            }
                          />
                        </button>
                      ))
                    ) : (
                      <div className="w-full flex gap-4 items-center">
                        <input
                          type="range"
                          min="0"
                          max={criterion.max}
                          value={scores[criterion.id] || 0}
                          onChange={(e) =>
                            setScores({
                              ...scores,
                              [criterion.id]: parseInt(e.target.value),
                            })
                          }
                          className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                        />
                        <div className="w-16 h-12 border border-slate-300 rounded-lg flex items-center justify-center font-bold text-xl text-slate-900 bg-white">
                          {scores[criterion.id] || 0}
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
              {rubric.length === 0 && (
                <p className="text-center text-slate-400">
                  No criteria defined.
                </p>
              )}
            </div>
            <div className="sticky bottom-4">
              <Button
                onClick={submitEvaluation}
                disabled={isSubmitting}
                className="w-full py-4 text-lg shadow-xl"
              >
                {isSubmitting ? "Submitting..." : "Submit Score"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ==========================================
// --- src/pages/Participants.jsx ---
// ==========================================
const ParticipantsView = ({
  teams,
  submissions,
  rubric,
  addToast,
  currentAppId,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [newTeamCode, setNewTeamCode] = useState("");
  const [page, setPage] = useState(1);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef(null);
  const itemsPerPage = 20;

  const paginatedTeams = useMemo(() => {
    const start = (page - 1) * itemsPerPage;
    return teams.slice(start, start + itemsPerPage);
  }, [teams, page]);

  const addParticipant = async () => {
    if (!newTeamName || !newTeamCode)
      return addToast("Fill all fields.", "error");
    if (teams.some((t) => t.code === newTeamCode))
      return addToast("ID exists.", "error");
    try {
      await addDoc(getCollectionRef(currentAppId, "teams"), {
        name: newTeamName,
        code: newTeamCode,
        createdAt: serverTimestamp(),
      });
      await addDoc(getCollectionRef(currentAppId, "audit_logs"), {
        action: "add_participant",
        details: { name: newTeamName, code: newTeamCode },
        timestamp: serverTimestamp(),
      });
      setNewTeamName("");
      setNewTeamCode("");
      setIsModalOpen(false);
      addToast("Participant Added", "success");
    } catch (err) {
      console.error(err);
      addToast("Error adding participant: " + err.message, "error");
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target.result;
      const rows = text
        .split(/\r\n|\n/)
        .map((row) => row.trim())
        .filter((r) => r);
      const BATCH_SIZE = 450;
      const allData = [];

      for (let i = 1; i < rows.length; i++) {
        const cols = rows[i].split(",");
        if (cols[0]) {
          allData.push({
            name: cols[0].trim(),
            code:
              cols[1]?.trim() ||
              `TM-${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
            createdAt: serverTimestamp(),
          });
        }
      }

      for (let i = 0; i < allData.length; i += BATCH_SIZE) {
        const batch = writeBatch(db);
        const chunk = allData.slice(i, i + BATCH_SIZE);
        chunk.forEach((item) => {
          const newRef = doc(getCollectionRef(currentAppId, "teams"));
          batch.set(newRef, item);
        });
        await batch.commit();
      }

      await addDoc(getCollectionRef(currentAppId, "audit_logs"), {
        action: "import_participants",
        details: { count: allData.length },
        timestamp: serverTimestamp(),
      });
      addToast(`Imported ${allData.length} participants`, "success");
    };
    reader.readAsText(file);
  };

  const downloadParticipantReport = (team) => {
    const teamSubs = submissions.filter((s) => s.teamId === team.id);
    if (teamSubs.length === 0)
      return addToast("No evaluations found.", "error");
    const csv =
      "data:text/csv;charset=utf-8,Judge," +
      rubric.map((r) => r.name).join(",") +
      ",Total,Time\n" +
      teamSubs
        .map((s) =>
          [
            s.invigilatorId,
            ...rubric.map((r) => s.scores[r.id] || 0),
            s.totalScore,
            s.timestamp?.toDate()?.toLocaleString(),
          ].join(",")
        )
        .join("\n");
    const link = document.createElement("a");
    link.href = encodeURI(csv);
    link.download = `${team.name}_report.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast("Report Downloaded", "success");
  };

  const downloadTemplate = () => {
    const csvContent =
      "Team Name,Team Code (Mandatory)\nTeam Alpha,TM-001\nTeam Beta,TM-002";
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "participants_template.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Participants</h2>
        </div>
        <div className="flex gap-2">
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept=".csv"
            onChange={handleFileUpload}
          />
          <Button
            variant="secondary"
            onClick={() => setIsPreviewOpen(true)}
            icon={Eye}
          >
            Preview Format
          </Button>
          <Button
            variant="secondary"
            onClick={downloadTemplate}
            icon={FileDown}
          >
            Template
          </Button>
          <Button
            variant="secondary"
            onClick={() => fileInputRef.current.click()}
            icon={isImporting ? Loader : Upload}
            disabled={isImporting}
          >
            {isImporting ? "Importing..." : "Import CSV"}
          </Button>
          <Button onClick={() => setIsModalOpen(true)} icon={Plus}>
            Add Manually
          </Button>
        </div>
      </div>
      <Card>
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3">ID</th>
              <th className="px-6 py-3">Name</th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedTeams.map((t) => (
              <tr key={t.id} className="hover:bg-slate-50">
                <td className="px-6 py-3 font-mono text-blue-600">{t.code}</td>
                <td className="px-6 py-3 font-bold">{t.name}</td>
                <td className="px-6 py-3 text-right flex justify-end gap-2">
                  <button
                    onClick={() => downloadParticipantReport(t)}
                    className="text-blue-600"
                  >
                    <ClipboardList size={16} />
                  </button>
                  <button
                    onClick={() =>
                      deleteDoc(getDocRef(currentAppId, "teams", t.id))
                    }
                    className="text-red-600"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
            {teams.length === 0 && (
              <tr>
                <td colSpan="3" className="p-8 text-center text-slate-400">
                  No participants.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <Pagination
          totalItems={teams.length}
          itemsPerPage={itemsPerPage}
          currentPage={page}
          onPageChange={setPage}
        />
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add Participant"
      >
        <div className="space-y-4">
          <Input
            label="Name"
            value={newTeamName}
            onChange={(e) => setNewTeamName(e.target.value)}
          />
          <Input
            label="ID"
            value={newTeamCode}
            onChange={(e) => setNewTeamCode(e.target.value.toUpperCase())}
          />
          <div className="flex justify-end gap-2 pt-4">
            <Button onClick={addParticipant}>Add</Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        title="CSV Template Preview"
      >
        <SampleDataPreview
          type="participant"
          onClose={() => setIsPreviewOpen(false)}
        />
      </Modal>
    </div>
  );
};

// ==========================================
// --- src/pages/Invigilators.jsx ---
// ==========================================
const InvigilatorsView = ({
  invigilators,
  submissions,
  rubric,
  addToast,
  currentAppId,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [form, setForm] = useState({ id: "", name: "" });
  const [page, setPage] = useState(1);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef(null);
  const itemsPerPage = 20;

  const paginatedInvigilators = useMemo(() => {
    const start = (page - 1) * itemsPerPage;
    return invigilators.slice(start, start + itemsPerPage);
  }, [invigilators, page]);

  const addJudge = async () => {
    if (!form.id) return addToast("Judge ID is required", "error");
    try {
      await addDoc(getCollectionRef(currentAppId, "invigilators"), {
        judgeId: form.id.toUpperCase(),
        name: form.name || "",
        status: "active",
      });
      await addDoc(getCollectionRef(currentAppId, "audit_logs"), {
        action: "add_judge",
        details: { id: form.id, name: form.name },
        timestamp: serverTimestamp(),
      });
      setForm({ id: "", name: "" });
      setIsModalOpen(false);
      addToast("Judge Added", "success");
    } catch (err) {
      console.error(err);
      addToast("Error adding judge: " + err.message, "error");
    }
  };

  const toggleStatus = async (judge) => {
    const newStatus = judge.status === "active" ? "inactive" : "active";
    await updateDoc(getDocRef(currentAppId, "invigilators", judge.id), {
      status: newStatus,
    });
    await addDoc(getCollectionRef(currentAppId, "audit_logs"), {
      action: "toggle_judge_status",
      details: { id: judge.judgeId, status: newStatus },
      timestamp: serverTimestamp(),
    });
    addToast(`Judge ${newStatus}`, "success");
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target.result;
        const rows = text
          .split(/\r\n|\n/)
          .map((row) => row.trim())
          .filter((r) => r);
        const BATCH_SIZE = 450;
        const allData = [];

        for (let i = 1; i < rows.length; i++) {
          const cols = rows[i].split(",");
          if (cols[0]) {
            allData.push({
              judgeId: cols[0].trim().toUpperCase(),
              name: cols[1]?.trim() || "",
              status: "active",
              createdAt: serverTimestamp(),
            });
          }
        }

        for (let i = 0; i < allData.length; i += BATCH_SIZE) {
          const batch = writeBatch(db);
          const chunk = allData.slice(i, i + BATCH_SIZE);
          chunk.forEach((item) => {
            const newRef = doc(getCollectionRef(currentAppId, "invigilators"));
            batch.set(newRef, item);
          });
          await batch.commit();
        }

        await addDoc(getCollectionRef(currentAppId, "audit_logs"), {
          action: "import_judges",
          details: { count: allData.length },
          timestamp: serverTimestamp(),
        });
        addToast(`Imported ${allData.length} judges`, "success");
      } catch (err) {
        console.error(err);
        addToast("Error importing judges", "error");
      } finally {
        setIsImporting(false);
        e.target.value = null;
      }
    };
    reader.readAsText(file);
  };

  const downloadJudgeReport = (judge) => {
    const judgeSubs = submissions.filter(
      (s) => s.invigilatorId === judge.judgeId
    );
    if (judgeSubs.length === 0)
      return addToast("No evaluations found.", "error");
    const csv =
      "data:text/csv;charset=utf-8,Team,Code," +
      rubric.map((r) => r.name).join(",") +
      ",Total,Time\n" +
      judgeSubs
        .map((s) =>
          [
            s.teamName,
            s.teamCode,
            ...rubric.map((r) => s.scores[r.id] || 0),
            s.totalScore,
            s.timestamp?.toDate()?.toLocaleString(),
          ].join(",")
        )
        .join("\n");
    const link = document.createElement("a");
    link.href = encodeURI(csv);
    link.download = `${judge.name || judge.judgeId}_evaluations.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast("Report Downloaded", "success");
  };

  const downloadTemplate = () => {
    const csvContent = "Judge ID,Name (Optional)\nJDG001,Dr. Smith\nJDG002,";
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "invigilators_template.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Invigilators</h2>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="secondary"
            onClick={() => setIsPreviewOpen(true)}
            icon={Eye}
          >
            Preview Format
          </Button>
          <Button
            variant="secondary"
            onClick={downloadTemplate}
            icon={FileDown}
          >
            Template
          </Button>
          <div className="relative">
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept=".csv"
              onChange={handleFileUpload}
            />
            <Button
              variant="secondary"
              onClick={() => fileInputRef.current.click()}
              icon={isImporting ? Loader : Upload}
              disabled={isImporting}
            >
              {isImporting ? "Importing..." : "Import CSV"}
            </Button>
          </div>
          <Button onClick={() => setIsModalOpen(true)} icon={Plus}>
            Add Manually
          </Button>
        </div>
      </div>
      <Card>
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3">ID</th>
              <th className="px-6 py-3">Name</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedInvigilators.map((i) => (
              <tr key={i.id} className="hover:bg-slate-50">
                <td className="px-6 py-3 font-mono text-blue-600">
                  {i.judgeId}
                </td>
                <td className="px-6 py-3 font-medium">{i.name || "-"}</td>
                <td className="px-6 py-3">
                  <div className="flex items-center gap-2">
                    <Badge
                      color={
                        i.status === "active" || !i.status ? "green" : "gray"
                      }
                    >
                      {i.status === "active" || !i.status
                        ? "Active"
                        : "Inactive"}
                    </Badge>
                    <button
                      onClick={() => toggleStatus(i)}
                      className="text-slate-400 hover:text-blue-600"
                    >
                      {i.status === "active" || !i.status ? (
                        <Lock size={14} />
                      ) : (
                        <Unlock size={14} />
                      )}
                    </button>
                  </div>
                </td>
                <td className="px-6 py-3 text-right flex justify-end gap-2">
                  <button
                    onClick={() => downloadJudgeReport(i)}
                    className="text-blue-600"
                  >
                    <ClipboardList size={16} />
                  </button>
                  <button
                    onClick={() =>
                      deleteDoc(
                        doc(
                          db,
                          "artifacts",
                          currentAppId,
                          "public",
                          "data",
                          "invigilators",
                          i.id
                        )
                      )
                    }
                    className="text-red-600"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
            {invigilators.length === 0 && (
              <tr>
                <td colSpan="4" className="p-8 text-center text-slate-400">
                  No invigilators.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <Pagination
          totalItems={invigilators.length}
          itemsPerPage={itemsPerPage}
          currentPage={page}
          onPageChange={setPage}
        />
      </Card>
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add Invigilator"
      >
        <div className="space-y-4">
          <Input
            label="ID"
            value={form.id}
            onChange={(e) => setForm({ ...form, id: e.target.value })}
          />
          <Input
            label="Name (Optional)"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <div className="flex justify-end gap-2 pt-4">
            <Button onClick={addJudge}>Add</Button>
          </div>
        </div>
      </Modal>
      <Modal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        title="CSV Template Preview"
      >
        <SampleDataPreview
          type="invigilator"
          onClose={() => setIsPreviewOpen(false)}
        />
      </Modal>
    </div>
  );
};

// ==========================================
// --- src/pages/Settings.jsx ---
// ==========================================
const SettingsView = ({ rubric, setRubric, addToast, currentAppId }) => {
  const [localRubric, setLocalRubric] = useState(rubric || []);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (rubric.length > 0 && localRubric.length === 0) setLocalRubric(rubric);
  }, [rubric]);

  const handleFieldChange = (index, field, value) => {
    const updated = [...localRubric];
    updated[index][field] = value;
    setLocalRubric(updated);
  };
  const addCriterion = () =>
    setLocalRubric([
      ...localRubric,
      {
        id: Date.now().toString(),
        name: "",
        min: 0,
        max: 10,
        weight: 1.0,
        inputType: "number",
      },
    ]);
  const removeCriterion = (index) => {
    const updated = [...localRubric];
    updated.splice(index, 1);
    setLocalRubric(updated);
  };

  const saveRubric = async () => {
    setIsSaving(true);
    try {
      const sanitizedRubric = localRubric.map((r) => ({
        ...r,
        min: r.min === "" ? 0 : Number(r.min),
        max: r.max === "" ? 0 : Number(r.max),
        weight: r.weight === "" ? 0 : Number(r.weight),
        inputType: r.inputType || "number",
      }));

      await setDoc(getDocRef(currentAppId, "rubric_config", "main"), {
        criteria: sanitizedRubric,
        updatedAt: serverTimestamp(),
      });
      await addDoc(getCollectionRef(currentAppId, "audit_logs"), {
        action: "rubric_update",
        details: { criteriaCount: sanitizedRubric.length },
        timestamp: serverTimestamp(),
      });
      addToast("Rubric Config Saved!", "success");
    } catch (e) {
      console.error(e);
      addToast("Error saving.", "error");
    }
    setIsSaving(false);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-20">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Scoring Rubric</h2>
        <p className="text-slate-500">Configure evaluation criteria.</p>
      </div>
      <div className="space-y-4">
        {localRubric.map((item, index) => (
          <Card
            key={item.id || index}
            className="p-6 transition-all hover:shadow-md"
          >
            <div className="flex justify-between items-start mb-4">
              <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wide">
                Criterion {index + 1}
              </h4>
              <button
                onClick={() => removeCriterion(index)}
                className="text-slate-400 hover:text-red-500"
              >
                <Trash2 size={18} />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="col-span-2">
                <Input
                  label="Criterion Name"
                  value={item.name}
                  onChange={(e) =>
                    handleFieldChange(index, "name", e.target.value)
                  }
                />
              </div>
              <div className="col-span-2 md:col-span-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1.5">
                  Input Type
                </label>
                <select
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  value={item.inputType || "number"}
                  onChange={(e) =>
                    handleFieldChange(index, "inputType", e.target.value)
                  }
                >
                  <option value="number">Number Input (Slider)</option>
                  <option value="stars">Star Rating</option>
                </select>
              </div>
              <div className="col-span-2 md:col-span-1">
                <Input
                  label="Max Score"
                  type="number"
                  value={item.max}
                  onChange={(e) =>
                    handleFieldChange(
                      index,
                      "max",
                      e.target.value === "" ? "" : parseFloat(e.target.value)
                    )
                  }
                />
              </div>
              <div className="col-span-2 md:col-span-1">
                <Input
                  label="Weight (Multiplier)"
                  type="number"
                  step="0.1"
                  value={item.weight}
                  onChange={(e) =>
                    handleFieldChange(
                      index,
                      "weight",
                      e.target.value === "" ? "" : parseFloat(e.target.value)
                    )
                  }
                />
              </div>
            </div>
          </Card>
        ))}
      </div>
      <button
        onClick={addCriterion}
        className="w-full py-4 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 font-medium hover:border-blue-400 hover:text-blue-600"
      >
        <Plus size={20} /> Add Criterion
      </button>
      <div className="fixed bottom-0 left-64 right-0 p-4 bg-white border-t border-slate-200 flex justify-end gap-4 z-10">
        <Button variant="secondary" onClick={() => setLocalRubric(rubric)}>
          Reset
        </Button>
        <Button onClick={saveRubric} disabled={isSaving} icon={Save}>
          {isSaving ? "Saving..." : "Save Rubric"}
        </Button>
      </div>
    </div>
  );
};

// ==========================================
// --- src/pages/Export.jsx ---
// ==========================================
const ExportView = ({ submissions, rubric, teams, invigilators }) => {
  const downloadCSV = (content, filename) => {
    const encodedUri = encodeURI(content);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  const exportJudgeData = () => {
    const headers = ["Judge ID", "Name", "Status"];
    const rows = invigilators.map((i) => [
      i.judgeId,
      i.name,
      i.status || "active",
    ]);
    downloadCSV(
      "data:text/csv;charset=utf-8," +
        [headers.join(","), ...rows.map((e) => e.join(","))].join("\n"),
      "judges_datasheet.csv"
    );
  };
  const exportTeamData = () => {
    const headers = ["Team ID", "Team Name"];
    const rows = teams.map((t) => [t.code, t.name]);
    downloadCSV(
      "data:text/csv;charset=utf-8," +
        [headers.join(","), ...rows.map((e) => e.join(","))].join("\n"),
      "teams_datasheet.csv"
    );
  };
  const exportOverallData = () => {
    const criteriaHeaders = rubric.map((r) => r.name);
    const headers = [
      "Submission ID",
      "Team Code",
      "Team Name",
      "Invigilator ID",
      ...criteriaHeaders,
      "Total Score",
      "Timestamp",
    ];
    const rows = submissions.map((sub) => [
      sub.id,
      sub.teamCode,
      sub.teamName,
      sub.invigilatorId,
      ...rubric.map((r) => sub.scores[r.id] || 0),
      sub.totalScore,
      sub.timestamp?.toDate()?.toLocaleString(),
    ]);
    downloadCSV(
      "data:text/csv;charset=utf-8," +
        [headers.join(","), ...rows.map((e) => e.join(","))].join("\n"),
      "master_score_sheet.csv"
    );
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Export Data</h2>
        <p className="text-slate-500">
          Download specific datasets or full reports.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 border-t-4 border-t-purple-500 hover:shadow-lg transition-shadow">
          <div className="mb-4 p-3 bg-purple-100 text-purple-600 rounded-lg w-fit">
            <UserCheck size={24} />
          </div>
          <h3 className="font-bold text-lg text-slate-800">Judge Data Sheet</h3>
          <p className="text-sm text-slate-500 mt-1 mb-6">
            List of all registered invigilators.
          </p>
          <Button
            variant="secondary"
            onClick={exportJudgeData}
            className="w-full"
          >
            Download CSV
          </Button>
        </Card>
        <Card className="p-6 border-t-4 border-t-blue-500 hover:shadow-lg transition-shadow">
          <div className="mb-4 p-3 bg-blue-100 text-blue-600 rounded-lg w-fit">
            <Users size={24} />
          </div>
          <h3 className="font-bold text-lg text-slate-800">
            Student Team Data
          </h3>
          <p className="text-sm text-slate-500 mt-1 mb-6">
            List of all participating teams.
          </p>
          <Button
            variant="secondary"
            onClick={exportTeamData}
            className="w-full"
          >
            Download CSV
          </Button>
        </Card>
        <Card className="p-6 border-t-4 border-t-emerald-500 hover:shadow-lg transition-shadow">
          <div className="mb-4 p-3 bg-emerald-100 text-emerald-600 rounded-lg w-fit">
            <FileText size={24} />
          </div>
          <h3 className="font-bold text-lg text-slate-800">
            Master Score Sheet
          </h3>
          <p className="text-sm text-slate-500 mt-1 mb-6">
            Complete record of all scores.
          </p>
          <Button onClick={exportOverallData} className="w-full">
            Download CSV
          </Button>
        </Card>
      </div>
    </div>
  );
};

// ==========================================
// --- src/App.jsx (Main Router) ---
// ==========================================
export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState("dashboard");
  const [adminLoggedIn, setAdminLoggedIn] = useState(false);
  const [activeAppId, setActiveAppId] = useState(DEFAULT_APP_ID);
  const [userRole, setUserRole] = useState("client");

  const [teams, setTeams] = useState([]);
  const [invigilators, setInvigilators] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [rubric, setRubric] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [activeTeamId, setActiveTeamId] = useState(null);
  const [rankingConfig, setRankingConfig] = useState(null);
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = "info") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(
      () => setToasts((prev) => prev.filter((t) => t.id !== id)),
      3000
    );
  };

  useEffect(() => {
    const init = async () => {
      if (typeof __initial_auth_token !== "undefined" && __initial_auth_token)
        await signInWithCustomToken(auth, __initial_auth_token);
      else await signInAnonymously(auth);
    };
    init();
    onAuthStateChanged(auth, setUser);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const scannedTeamId = params.get("team");
    const scannedTenantId = params.get("tenant"); // Get tenant from URL
    if (scannedTeamId && scannedTenantId) {
      setActiveTeamId(scannedTeamId);
      setActiveAppId(scannedTenantId); // Set the tenant ID
    } else if (scannedTeamId) {
      // Fallback for legacy links or missing tenant param - assumes default
      setActiveTeamId(scannedTeamId);
    }
  }, []);

  const handleLoginSuccess = (userData) => {
    if (userData.role === "super_admin") {
      setUserRole("super_admin");
      setAdminLoggedIn(true);
      setView("admin_dashboard");
    } else {
      setUserRole("client");
      setActiveAppId(userData.dbId);
      setAdminLoggedIn(true);
      setView("dashboard");
    }
  };

  useEffect(() => {
    if (!user) return;
    if (!adminLoggedIn && !activeTeamId) return;
    // Skip fetching event data if we are in super admin dashboard view
    if (userRole === "super_admin" && view === "admin_dashboard") return;

    // Use helper functions with activeAppId as the tenantId
    const unsubTeams = onSnapshot(
      query(
        getCollectionRef(activeAppId, "teams"),
        orderBy("createdAt", "desc")
      ),
      (s) => setTeams(s.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    const unsubInv = onSnapshot(
      getCollectionRef(activeAppId, "invigilators"),
      (s) => setInvigilators(s.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    const unsubSub = onSnapshot(
      getCollectionRef(activeAppId, "submissions"),
      (s) => setSubmissions(s.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    const unsubLogs = onSnapshot(
      query(
        getCollectionRef(activeAppId, "audit_logs"),
        orderBy("timestamp", "desc")
      ),
      (s) => setAuditLogs(s.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    const unsubRubric = onSnapshot(
      getDocRef(activeAppId, "rubric_config", "main"),
      (docSnap) =>
        setRubric(docSnap.exists() ? docSnap.data().criteria || [] : [])
    );
    const unsubRanking = onSnapshot(
      getDocRef(activeAppId, "ranking_config", "main"),
      (docSnap) =>
        setRankingConfig(docSnap.exists() ? docSnap.data() : { method: "sum" })
    );

    return () => {
      unsubTeams();
      unsubInv();
      unsubSub();
      unsubLogs();
      unsubRubric();
      unsubRanking();
    };
  }, [user, adminLoggedIn, activeAppId, userRole, view]);

  const leaderboard = useMemo(() => {
    const scores = {};
    let globalTotalScore = 0;
    let globalTotalCount = 0;

    submissions.forEach((sub) => {
      if (!scores[sub.teamId])
        scores[sub.teamId] = {
          total: 0,
          count: 0,
          teamName: sub.teamName,
          teamCode: sub.teamCode,
          finalScore: 0,
        };
      scores[sub.teamId].total += sub.totalScore;
      scores[sub.teamId].count += 1;
      globalTotalScore += sub.totalScore;
      globalTotalCount += 1;
    });

    let m =
      rankingConfig?.mValue ||
      (globalTotalCount > 0 ? globalTotalScore / globalTotalCount : 0);
    let C =
      rankingConfig?.cValue ||
      (Object.keys(scores).length > 0
        ? globalTotalCount / Object.keys(scores).length
        : 0);

    return Object.entries(scores)
      .map(([id, d]) => {
        let finalScore = 0;
        if (rankingConfig?.method === "bayesian") {
          const v = d.count;
          const R = v > 0 ? d.total / v : 0;
          if (v + C > 0) finalScore = (v / (v + C)) * R + (C / (v + C)) * m;
        } else {
          finalScore = d.total;
        }
        return { id, ...d, finalScore };
      })
      .sort((a, b) => b.finalScore - a.finalScore);
  }, [submissions, rankingConfig]);

  // Render Super Admin Dashboard
  if (
    adminLoggedIn &&
    userRole === "super_admin" &&
    view === "admin_dashboard"
  ) {
    return (
      <SuperAdminDashboard
        onLogout={() => setAdminLoggedIn(false)}
        onAccessDatabase={(client) => {
          setActiveAppId(client.uniqueAppId);
          setUserRole("super_admin_impersonating");
          setView("dashboard");
        }}
      />
    );
  }

  // Render Judge App (Public)
  if (activeTeamId && !adminLoggedIn && !userRole) {
    return (
      <>
        <ToastContainer
          toasts={toasts}
          removeToast={(id) =>
            setToasts((prev) => prev.filter((t) => t.id !== id))
          }
        />
        <JudgeApp
          teamId={activeTeamId}
          teams={teams}
          rubric={rubric}
          invigilators={invigilators}
          submissions={submissions}
          onExit={() => setActiveTeamId(null)}
          addToast={addToast}
          currentAppId={activeAppId}
        />
      </>
    );
  } else if (activeTeamId) {
    return (
      <>
        <ToastContainer
          toasts={toasts}
          removeToast={(id) =>
            setToasts((prev) => prev.filter((t) => t.id !== id))
          }
        />
        <JudgeApp
          teamId={activeTeamId}
          teams={teams}
          rubric={rubric}
          invigilators={invigilators}
          submissions={submissions}
          onExit={() => setActiveTeamId(null)}
          addToast={addToast}
          currentAppId={activeAppId}
        />
      </>
    );
  }

  // Render Login View
  if (!adminLoggedIn)
    return (
      <>
        <ToastContainer
          toasts={toasts}
          removeToast={(id) =>
            setToasts((prev) => prev.filter((t) => t.id !== id))
          }
        />
        <LoginView onLogin={handleLoginSuccess} addToast={addToast} />
      </>
    );

  // Render Main Admin/Client Dashboard
  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden">
      <ToastContainer
        toasts={toasts}
        removeToast={(id) =>
          setToasts((prev) => prev.filter((t) => t.id !== id))
        }
      />
      <Sidebar
        view={view}
        setView={setView}
        onLogout={() => {
          if (userRole === "super_admin_impersonating") {
            setUserRole("super_admin");
            setView("admin_dashboard");
          } else {
            setAdminLoggedIn(false);
          }
        }}
        userRole={userRole}
        activeAppId={activeAppId}
      />
      <main className="flex-1 overflow-y-auto p-8 relative">
        {view === "dashboard" && (
          <DashboardView
            teams={teams}
            invigilators={invigilators}
            submissions={submissions}
            leaderboard={leaderboard}
            rankingConfig={rankingConfig}
          />
        )}
        {view === "ranking" && (
          <RankingLogicView
            rankingConfig={rankingConfig}
            setRankingConfig={setRankingConfig}
            submissions={submissions}
            teams={teams}
            addToast={addToast}
            currentAppId={activeAppId}
          />
        )}
        {(view === "settings" || view === "rubric") && (
          <SettingsView
            rubric={rubric}
            setRubric={setRubric}
            addToast={addToast}
            currentAppId={activeAppId}
          />
        )}
        {view === "export" && (
          <ExportView
            submissions={submissions}
            rubric={rubric}
            teams={teams}
            invigilators={invigilators}
          />
        )}
        {view === "audit" && (
          <div className="space-y-6 max-w-5xl mx-auto">
            <h2 className="text-2xl font-bold">Audit Logs</h2>
            <div className="space-y-4">
              {auditLogs.map((log) => {
                let badgeColor = "gray";
                let icon = <Activity size={16} />;
                if (log.action?.includes("add")) {
                  badgeColor = "blue";
                  icon = <Plus size={16} />;
                } else if (log.action?.includes("submit")) {
                  badgeColor = "green";
                  icon = <CheckCircle size={16} />;
                } else if (
                  log.action?.includes("toggle") ||
                  log.action?.includes("status")
                ) {
                  badgeColor = "orange";
                  icon = <Lock size={16} />;
                }
                return (
                  <Card
                    key={log.id}
                    className="p-4 border-l-4 border-l-slate-400 flex items-start gap-4"
                  >
                    <div
                      className={`p-2 rounded-full bg-${
                        badgeColor === "gray" ? "slate" : badgeColor
                      }-100 text-${
                        badgeColor === "gray" ? "slate" : badgeColor
                      }-600`}
                    >
                      {icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <h4 className="font-bold text-slate-800 capitalize">
                          {log.action.replace(/_/g, " ")}
                        </h4>
                        <span className="text-xs text-slate-400 font-mono">
                          {log.timestamp?.toDate()?.toLocaleString()}
                        </span>
                      </div>
                      <div className="text-sm text-slate-600 font-mono bg-slate-50 p-2 rounded border border-slate-100">
                        {Object.entries(log.details || {}).map(([k, v]) => (
                          <span key={k} className="mr-4">
                            <span className="font-bold text-slate-500">
                              {k}:
                            </span>{" "}
                            {typeof v === "object" ? JSON.stringify(v) : v}
                          </span>
                        ))}
                      </div>
                    </div>
                  </Card>
                );
              })}
              {auditLogs.length === 0 && (
                <div className="p-10 text-center text-slate-400">
                  No activity recorded yet.
                </div>
              )}
            </div>
          </div>
        )}
        {view === "participants" && (
          <ParticipantsView
            teams={teams}
            submissions={submissions}
            rubric={rubric}
            addToast={addToast}
            currentAppId={activeAppId}
          />
        )}
        {view === "qr" && (
          <QRCodeManager
            teams={teams}
            onSimulateScan={setActiveTeamId}
            addToast={addToast}
          />
        )}
        {view === "invigilators" && (
          <InvigilatorsView
            invigilators={invigilators}
            submissions={submissions}
            rubric={rubric}
            addToast={addToast}
            currentAppId={activeAppId}
          />
        )}
        {view === "submissions" && (
          <div className="space-y-6 max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold">Submissions</h2>
            <Card>
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3">Time</th>
                    <th className="px-6 py-3">Team</th>
                    <th className="px-6 py-3">Judge</th>
                    <th className="px-6 py-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.map((s) => (
                    <tr key={s.id}>
                      <td className="px-6 py-3 text-slate-400">
                        {s.timestamp?.toDate()?.toLocaleTimeString()}
                      </td>
                      <td className="px-6 py-3 font-bold">{s.teamName}</td>
                      <td className="px-6 py-3 font-mono">{s.invigilatorId}</td>
                      <td className="px-6 py-3 text-right font-bold text-blue-600">
                        {s.totalScore}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
