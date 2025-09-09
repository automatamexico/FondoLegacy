import React from "react";

const SociosModule = () => {
  const data = [
    { id: 1, nombre: "María González", estado: "Activa" },
    { id: 2, nombre: "Carlos Rodríguez", estado: "Activa" },
    { id: 3, nombre: "Ana Martínez", estado: "Inactiva" },
  ];
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border">
      <h2 className="text-lg font-semibold mb-4">Socios</h2>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-slate-500">
            <th className="py-2">ID</th>
            <th className="py-2">Nombre</th>
            <th className="py-2">Estado</th>
          </tr>
        </thead>
        <tbody>
          {data.map((r)=>(
            <tr key={r.id} className="border-t">
              <td className="py-2">{r.id}</td>
              <td className="py-2">{r.nombre}</td>
              <td className="py-2">{r.estado}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default SociosModule;
