import React, { useState, useEffect } from 'react';

const SUPABASE_URL = 'https://ubfkhtkmlvutwdivmoff.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InViZmtodGttbHZ1dHdkaXZtb2ZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4MTc5NTUsImV4cCI6MjA2NjM5Mzk1NX0.c0iRma-dnlL29OR3ffq34nmZuj_ViApBTMG-6PEX_B4';

const DashboardMain = () => {
  const [stats, setStats] = useState({
    totalSocios: 0,
    ahorrosAcumulados: 0,
    prestamosActivos: 0,
    montoTotalPrestado: 0, // neto = solicitado - capital_pagado
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1) Total Socios
      const sociosResponse = await fetch(`${SUPABASE_URL}/rest/v1/socios?select=*`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
      });
      if (!sociosResponse.ok) {
        const errorData = await sociosResponse.json();
        throw new Error(`Error al cargar socios: ${sociosResponse.statusText} - ${errorData.message || 'Error desconocido'}`);
      }
      const sociosData = await sociosResponse.json();
      const totalSocios = sociosData.length;

      // 2) Ahorros Acumulados (positivos - |negativos|)
      const ahorrosResponse = await fetch(`${SUPABASE_URL}/rest/v1/ahorros?select=ahorro_aportado`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
      });
      if (!ahorrosResponse.ok) {
        const errorData = await ahorrosResponse.json();
        throw new Error(`Error al cargar ahorros: ${ahorrosResponse.statusText} - ${errorData.message || 'Error desconocido'}`);
      }
      const ahorrosData = await ahorrosResponse.json();
      const positivos = ahorrosData.reduce((s, r) => {
        const v = parseFloat(r.ahorro_aportado) || 0;
        return s + (v > 0 ? v : 0);
      }, 0);
      const negativosAbs = ahorrosData.reduce((s, r) => {
        const v = parseFloat(r.ahorro_aportado) || 0;
        return s + (v < 0 ? Math.abs(v) : 0);
      }, 0);
      const ahorrosAcumulados = positivos - negativosAbs;

      // 3) Préstamos (para activos y total solicitado)
      const prestamosResponse = await fetch(`${SUPABASE_URL}/rest/v1/prestamos?select=estatus,monto_solicitado`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
      });
      if (!prestamosResponse.ok) {
        const errorData = await prestamosResponse.json();
        throw new Error(`Error al cargar préstamos: ${prestamosResponse.statusText} - ${errorData.message || 'Error desconocido'}`);
      }
      const prestamosData = await prestamosResponse.json();
      const prestamosActivos = prestamosData.filter(p => p.estatus === 'activo').length;
      const totalSolicitado = prestamosData.reduce((sum, p) => sum + (parseFloat(p.monto_solicitado) || 0), 0);

      // 4) Capital pagado acumulado (para "Total prestado" neto)
      const pagosResponse = await fetch(`${SUPABASE_URL}/rest/v1/pagos_prestamos?select=capital_pagado`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
      });
      if (!pagosResponse.ok) {
        const errorData = await pagosResponse.json();
        throw new Error(`Error al cargar pagos de préstamos: ${pagosResponse.statusText} - ${errorData.message || 'Error desconocido'}`);
      }
      const pagosData = await pagosResponse.json();
      const totalCapitalPagado = pagosData.reduce((sum, r) => sum + (parseFloat(r.capital_pagado) || 0), 0);

      // Neto: solicitado - capital pagado (sin intereses)
      const montoTotalPrestado = Math.max(0, totalSolicitado - totalCapitalPagado);

      setStats({
        totalSocios,
        ahorrosAcumulados,
        prestamosActivos,
        montoTotalPrestado,
      });

    } catch (err) {
      console.error("Error en fetchDashboardData:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value || 0);

  const dashboardCards = [
    {
      title: "Socios registrados",
      value: stats.totalSocios.toLocaleString(),
      icon: (
        <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      bgColor: "bg-blue-100",
      textColor: "text-blue-800"
    },
    {
      title: "Ahorros acumulados",
      value: formatCurrency(stats.ahorrosAcumulados),
      icon: (
        <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      bgColor: "bg-green-100",
      textColor: "text-green-800"
    },
    {
      title: "Préstamos activos",
      value: stats.prestamosActivos.toLocaleString(),
      icon: (
        <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
        </svg>
      ),
      bgColor: "bg-orange-100",
      textColor: "text-orange-800"
    },
    {
      title: "Total prestado",
      value: formatCurrency(stats.montoTotalPrestado), // neto
      icon: (
        <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      ),
      bgColor: "bg-purple-100",
      textColor: "text-purple-800"
    },
  ];

  return (
    <div className="p-6 space-y-8 bg-slate-50 min-h-full">
      <div className="text-center">
        <h1 className="text-4xl font-extrabold text-slate-900 mb-2">Panel de Control Financiero</h1>
        <p className="text-xl text-slate-600">Resumen ejecutivo de tus operaciones</p>
      </div>

      {loading && (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
          <p className="ml-4 text-slate-700 text-lg">Cargando datos...</p>
        </div>
      )}

      {error && !loading && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl relative" role="alert">
          <strong className="font-bold">¡Error al cargar!</strong>
          <span className="block sm:inline"> {error}. Por favor, verifica tu conexión a Supabase y que las tablas existan y tengan los permisos correctos.</span>
        </div>
      )}

      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {dashboardCards.map((card, index) => (
            <div
              key={index}
              className={`relative ${card.bgColor} rounded-2xl shadow-lg p-6 transform transition-all duration-300 hover:scale-105 hover:shadow-xl`}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-lg font-semibold ${card.textColor}`}>{card.title}</h3>
                <div className="p-2 rounded-full bg-white bg-opacity-30">
                  {card.icon}
                </div>
              </div>
              <p className={`text-4xl font-bold ${card.textColor}`}>{card.value}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DashboardMain;
