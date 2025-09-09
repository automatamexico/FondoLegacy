import React from "react";

const PrestamosModule = () => {
  const data = [
    { id: 1, socio: "Ana Martínez", monto: 5000, estado: "Activo" },
    { id: 2, socio: "Luis Pérez", monto: 12000, estado: "Liquidado" },
  ];
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border">
      <h2 className="text-lg font-semibold mb-4">Préstamos</h2>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-slate-500">
            <th className="py-2">ID</th>
            <th className="py-2">Socio</th>
            <th className="py-2">Monto</th>
            <th className="py-2">Estado</th>
          </tr>
        </thead>
        <tbody>
          {data.map((r)=>(
            <tr key={r.id} className="border-t">
              <td className="py-2">{r.id}</td>
              <td className="py-2">{r.socio}</td>
              <td className="py-2">${"{:,}".format(r.monto)}</td>
              <td className="py-2">{r.estado}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PrestamosModule;
