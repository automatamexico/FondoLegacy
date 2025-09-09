import React from "react";

const AhorrosModule = () => {
  const data = [
    { id: 1, socio: "María González", monto: 1000, fecha: "2024-05-20" },
    { id: 2, socio: "Carlos Rodríguez", monto: 500, fecha: "2024-05-21" },
  ];
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border">
      <h2 className="text-lg font-semibold mb-4">Ahorros</h2>
      <ul className="space-y-2">
        {data.map((r)=>(
          <li key={r.id} className="border rounded-lg px-3 py-2 flex justify-between">
            <span>{r.socio}</span>
            <span>${"{:,}".format(r.monto)}</span>
            <span className="text-slate-500">{r.fecha}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AhorrosModule;
