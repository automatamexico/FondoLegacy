import React from "react";

const DashboardSidebar = ({
  activeSection,
  onSectionChange,
  currentUser,
  workMode,
}) => {

  // ============================
  // MENÚ CONDICIONAL POR MÓDULO
  // ============================

  const menuItems =
    workMode === "afore"
      ? [
          {
            id: "afore-dashboard",
            name: "Control de AFORE",
            icon: (
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M3 3h18v18H3z"
                />
              </svg>
            ),
          },
        ]
      : [
          {
            id: "dashboard",
            name: "Dashboard",
          },
          {
            id: "socios",
            name: "Socios",
          },
          {
            id: "prestamos",
            name: "Préstamos",
          },
          {
            id: "pagos",
            name: "Pagos",
          },
          {
            id: "ahorro",
            name: "Fondo de Ahorro",
          },
        ];

  // ============================
  // RENDER
  // ============================

  return (
    <aside className="w-64 bg-white border-r h-screen">
      <div className="p-4 border-b">
        <h2 className="font-bold text-lg">FONDO LEGACY</h2>
        {currentUser && (
          <p className="text-sm text-gray-500">{currentUser.email}</p>
        )}
      </div>

      <nav className="p-4 space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onSectionChange(item.id)}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded text-left
              ${
                activeSection === item.id
                  ? "bg-blue-600 text-white"
                  : "hover:bg-gray-100"
              }`}
          >
            {item.icon && item.icon}
            <span>{item.name}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
};

export default DashboardSidebar;
