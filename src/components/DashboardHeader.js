import React from "react";

const DashboardHeader = ({ user, onLogout }) => {
  return (
    <header className="bg-white border-b px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl grid place-items-center text-white font-bold">DM</div>
          <div>
            <h1 className="font-semibold text-slate-800 leading-none">DELSU Dashboard</h1>
            <p className="text-xs text-slate-500">Bienvenido, {user?.name}</p>
          </div>
        </div>
        <button onClick={onLogout} className="text-sm px-3 py-1.5 rounded-lg border hover:bg-slate-50">
          Cerrar sesión
        </button>
      </div>
    </header>
  );
};

export default DashboardHeader;
