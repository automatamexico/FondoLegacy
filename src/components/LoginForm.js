import React, { useState } from "react";

const LoginForm = ({ onSuccess }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    // Demo login sin backend
    if ((username === "admin" && password === "admin123") ||
        (username === "usuario" && password === "user123")) {
      onSuccess({ name: username === "admin" ? "Administrador" : "Usuario Demo", role: username === "admin" ? "admin" : "user" });
    } else {
      setError("Credenciales inválidas (prueba admin/admin123 o usuario/user123).");
    }
  };

  return (
    <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
      <h1 className="text-2xl font-bold mb-6 text-slate-800">Iniciar sesión</h1>
      {error && <div className="mb-4 text-red-600 text-sm">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-slate-600 mb-1">Usuario</label>
          <input value={username} onChange={(e)=>setUsername(e.target.value)} className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring" placeholder="admin o usuario" />
        </div>
        <div>
          <label className="block text-sm text-slate-600 mb-1">Contraseña</label>
          <input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring" placeholder="••••••••" />
        </div>
        <button className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700">Entrar</button>
      </form>
      <p className="text-xs text-slate-500 mt-4">Demo: admin/admin123 o usuario/user123</p>
    </div>
  );
};

export default LoginForm;
