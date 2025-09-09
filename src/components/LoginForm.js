import React, { useState } from 'react';

const SUPABASE_URL = 'https://ubfkhtkmlvutwdivmoff.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InViZmtodGttbHZ1dHdkaXZtb2ZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4MTc5NTUsImV4cCI6MjA2NjM5Mzk1NX0.c0iRma-dnlL29OR3ffq34nmZuj_ViApBTMG-6PEX_B4';

const LoginForm = ({ onLogin }) => {
  const [credentials, setCredentials] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!credentials.email || !credentials.password) {
      setError('Por favor, ingrese su email y contraseña.');
      setLoading(false);
      return;
    }

    try {
      // 1. Consultar la tabla usuarios_sistema por el email
      const response = await fetch(`${SUPABASE_URL}/rest/v1/usuarios_sistema?email=eq.${credentials.email}&select=*`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Error al buscar usuario: ${response.statusText} - ${errorData.message || 'Error desconocido'}`);
      }

      const users = await response.json();

      if (users.length === 0) {
        setError('Email o contraseña incorrectos.');
        setLoading(false);
        return;
      }

      const user = users[0];

      // 2. Verificar contraseña (en producción debería ir hasheada)
      if (user.contrasena !== credentials.password) {
        setError('Email o contraseña incorrectos.');
        setLoading(false);
        return;
      }

      // 3. OK -> notificar a la app
      onLogin({
        id: user.id_usuario,
        name: user.nombre_usuario || user.email,
        role: user.rol,
        id_socio: user.id_socio
      });

    } catch (err) {
      console.error("Error en el login:", err);
      setError(`Error al iniciar sesión: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setCredentials({
      ...credentials,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
          <div className="text-center mb-8">
            {/* LOGO: usa tu URL de Supabase */}
            <div className="w-16 h-16 rounded-xl mx-auto mb-4 flex items-center justify-center bg-white ring-2 ring-[#0ea15a]">
              <img
                src="https://ubfkhtkmlvutwdivmoff.supabase.co/storage/v1/object/public/Logos/LOGO_OK.png"
                alt="Fondo Legacy"
                className="w-12 h-12 object-contain"
              />
            </div>

            {/* NOMBRE DEL SISTEMA */}
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Fondo Legacy</h1>
            <p className="text-slate-600">Ingresa a tu cuenta para continuar</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={credentials.email}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0ea15a] focus:border-transparent transition-all"
                placeholder="Ingresa tu email"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Contraseña
              </label>
              <input
                type="password"
                name="password"
                value={credentials.password}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0ea15a] focus:border-transparent transition-all"
                placeholder="Ingresa tu contraseña"
                required
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            {/* BOTÓN con verde #0ea15a */}
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-[#0ea15a] to-[#0ea15a] text-white py-3 px-4 rounded-xl font-medium hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-[#0ea15a] focus:ring-offset-2 transition-all transform hover:scale-[1.02]"
              disabled={loading}
            >
              {loading ? 'Iniciando Sesión...' : 'Iniciar Sesión'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-500">
              Desarrollado por Fondo Legacy
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
