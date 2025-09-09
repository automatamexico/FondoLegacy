import React from "react";

const formatMXN = (n) =>
  (Number(n) || 0).toLocaleString("es-MX", { style: "currency", currency: "MXN" });

const AhorrosModule = () => {
  const data = [
    { id: 1, socio: "María González", monto: 1000, fecha: "2024-05-20" },
    { id: 2, socio: "Carlos Rodríguez", monto: 500,  fecha: "2024-05-21" },
  ];

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border">
      <h2 className="text-lg font-semibold mb-4">Ahorros</h2>
      <ul className="space-y-2">
        {data.map((r) => (
          <li key={r.id} className="border rounded-lg px-3 py-2 grid grid-cols-3 gap-2">
            <span>{r.socio}</span>
            <span className="text-right">{formatMXN(r.monto)}</span>
            <span className="text-slate-500 text-right">
              {new Date(r.fecha).toLocaleDateString("es-MX")}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AhorrosModule;
