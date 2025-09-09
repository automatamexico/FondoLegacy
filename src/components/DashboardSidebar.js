import React from "react";

const items = [
  { id: "dashboard", label: "Tablero" },
  { id: "socios", label: "Socios" },
  { id: "ahorros", label: "Ahorros" },
  { id: "prestamos", label: "Préstamos" },
  { id: "pagos", label: "Pagos" },
  { id: "centro", label: "Centro Digital" },
  { id: "usuarios", label: "Usuarios" },
];

const DashboardSidebar = ({ activeSection, onSectionChange }) => {
  return (
    <aside className="w-64 bg-white border-r p-4 space-y-2">
      {items.map((it) => (
        <button
          key={it.id}
          onClick={() => onSectionChange(it.id)}
          className={`w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 ${activeSection===it.id ? "bg-slate-100 font-semibold" : ""}`}
        >
          {it.label}
        </button>
      ))}
    </aside>
  );
};

export default DashboardSidebar;
