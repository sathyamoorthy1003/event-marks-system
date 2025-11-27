import React from "react";
import { X, AlertCircle, CheckCircle, ChevronLeft, ChevronRight } from "lucide-react";

export const Card = ({ children, className = "" }) => (
  <div
    className={`bg-white rounded-xl border border-slate-200 shadow-sm ${className}`}
  >
    {children}
  </div>
);

export const Button = ({
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

export const Input = ({ label, className, error, icon: Icon, ...props }) => (
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

export const Badge = ({ children, color = "blue" }) => {
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

export const Modal = ({ isOpen, onClose, title, children }) => {
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

export const ToastContainer = ({ toasts, removeToast }) => (
  <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2">
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

export const Pagination = ({
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

export const SampleDataPreview = ({ type, onClose }) => {
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
