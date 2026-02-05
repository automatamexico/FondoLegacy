import React from "react";

const DashboardSidebar = ({
  activeSection,
  onSectionChange,
  currentUser,
  workMode,
}) => {

  const GO_BACK_PATH = "/";

  // 🔹 MENÚ ORIGINAL (NO SE TOCA)
  const menuItems = [
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

  return (
    <aside className="w-64 bg-white border-r h-screen">
      {/* HEADER */}
      <div className="p-4 border-b">
        {workMode === "afore" ? (
          <button
            onClick={() => (window.location.href = GO_BACK_PATH)}
            className="w-full flex items-center gap-2 px-3 py-2 rounded border hover:bg-gray-100"
          >
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
                d="M15 19l-7-7 7-7"
              />
            </svg>
            <span className="font-semibold">Regresar al Inicio</span>
          </button>
        ) : (
          <>
            <h2 className="font-bold text-lg">FONDO LEGACY</h2>
            {currentUser && (
              <p className="text-sm text-gray-500">{currentUser.email}</p>
            )}
          </>
        )}
      </div>

      {/* MENÚ */}
      <nav className="p-4 space-y-2">
        {menuItems
          // 👇 AQUÍ ESTÁ LA MAGIA
          .filter((item) =>
            workMode === "afore" ? item.id === "dashboard" : true
          )
          .map((item) => (
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
              <span>{item.name}</span>
            </button>
          ))}
      </nav>
    </aside>
  );
};

export default DashboardSidebar;
