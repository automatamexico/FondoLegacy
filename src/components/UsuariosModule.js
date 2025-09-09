import React from "react";

const UsuariosModule = () => {
  const data = [
    { id: 1, usuario: "admin", rol: "admin" },
    { id: 2, usuario: "usuario", rol: "user" },
  ];
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border">
      <h2 className="text-lg font-semibold mb-4">Usuarios</h2>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-slate-500">
            <th className="py-2">ID</th>
            <th className="py-2">Usuario</th>
            <th className="py-2">Rol</th>
          </tr>
        </thead>
        <tbody>
          {data.map((r)=>(
            <tr key={r.id} className="border-t">
              <td className="py-2">{r.id}</td>
              <td className="py-2">{r.usuario}</td>
              <td className="py-2">{r.rol}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default UsuariosModule;
