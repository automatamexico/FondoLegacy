import React from "react";

const Stat = ({ label, value }) => (
  <div className="bg-white rounded-xl p-5 shadow-sm border">
    <p className="text-xs text-slate-500">{label}</p>
    <p className="text-2xl font-bold text-slate-800 mt-1">{value}</p>
  </div>
);

const DashboardMain = () => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Socios activos" value="128" />
        <Stat label="Ahorros del mes" value="$ 152,300" />
        <Stat label="Préstamos activos" value="37" />
        <Stat label="Pagos hoy" value="12" />
      </div>
      <div className="bg-white rounded-xl p-6 shadow-sm border">
        <h2 className="text-lg font-semibold mb-3">Resumen</h2>
        <p className="text-sm text-slate-600">
          Este es un tablero demo listo para desplegar en Netlify. Puedes personalizar módulos,
          conectar Supabase y reemplazar los datos mock cuando lo necesites.
        </p>
      </div>
    </div>
  );
};

export default DashboardMain;
