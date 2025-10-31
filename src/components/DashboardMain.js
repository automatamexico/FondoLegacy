// src/components/DashboardMain.js
import React, { useState, useEffect } from 'react';

const SUPABASE_URL = 'https://ubfkhtkmlvutwdivmoff.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InViZmtodGttbHZ1dHdkaXZtb2ZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4MTc5NTUsImV4cCI6MjA2NjM5Mzk1NX0.c0iRma-dnlL29OR3ffq34nmZuj_ViApBTMG-6PEX_B4';

const DashboardMain = () => {
  const [stats, setStats] = useState({
    totalSocios: 0,
    ahorrosAcumulados: 0,
    prestamosActivos: 0,
    montoTotalPrestado: 0,
    interesesAcumulados: 0,
    proximosPagos: 0,     // NUEVO
    pagosVencidos: 0,     // NUEVO
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  async function fetchJSON(url, extraHeaders = {}) {
    const r = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        Range: '0-999999',
        ...extraHeaders,
      },
    });
    if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
    return r.json();
  }

  // Helper para obtener conteos vía Content-Range (más eficiente)
  async function fetchCount(url) {
    const r = await fetch(url, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        Prefer: 'count=exact',
        'Range-Unit': 'items',
        Range: '0-0',
      },
    });
    if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
    const cr = r.headers.get('content-range') || '0/0';
    return parseInt(cr.split('/')[1] || '0', 10);
  }

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1) Total socios
      const socios = await fetchJSON(`${SUPABASE_URL}/rest/v1/socios?select=id_socio`);
      const totalSocios = socios.length;

      // 2) Ahorros acumulados = suma(>0) - suma(|<0|)
      const pos = await fetchJSON(`${SUPABASE_URL}/rest/v1/ahorros?select=ahorro_aportado&ahorro_aportado=gt.0`);
      const neg = await fetchJSON(`${SUPABASE_URL}/rest/v1/ahorros?select=ahorro_aportado&ahorro_aportado=lt.0`);
      const sumaPos = pos.reduce((s, r) => s + (parseFloat(r.ahorro_aportado) || 0), 0);
      const sumaNegAbs = neg.reduce((s, r) => {
        const v = parseFloat(r.ahorro_aportado) || 0;
        return s + (v < 0 ? Math.abs(v) : 0);
      }, 0);
      const ahorrosAcumulados = sumaPos - sumaNegAbs;

      // 3) Préstamos activos y total prestado neto (solicitado - capital_pagado)
      const prestamos = await fetchJSON(`${SUPABASE_URL}/rest/v1/prestamos?select=estatus,monto_solicitado`);
      const prestamosActivos = prestamos.filter(p => p.estatus === 'activo').length;
      const totalSolicitado = prestamos.reduce((s, p) => s + (parseFloat(p.monto_solicitado) || 0), 0);

      const pagos = await fetchJSON(`${SUPABASE_URL}/rest/v1/pagos_prestamos?select=capital_pagado,interes_pagado`);
      const totalCapitalPagado = pagos.reduce((s, r) => s + (parseFloat(r.capital_pagado) || 0), 0);
      const interesesAcumulados = pagos.reduce((s, r) => s + (parseFloat(r.interes_pagado) || 0), 0);
      const montoTotalPrestado = Math.max(0, totalSolicitado - totalCapitalPagado);

      // 4) NUEVO: Próximos pagos (siguientes 3 días) y Pagos vencidos (antes de hoy) con estatus pendiente
      const now = new Date();
      const today = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
      const d1 = new Date(now); d1.setDate(now.getDate()+1);
      const d2 = new Date(now); d2.setDate(now.getDate()+2);
      const d3 = new Date(now); d3.setDate(now.getDate()+3);
      const s1 = `${d1.getFullYear()}-${String(d1.getMonth()+1).padStart(2,'0')}-${String(d1.getDate()).padStart(2,'0')}`;
      const s2 = `${d2.getFullYear()}-${String(d2.getMonth()+1).padStart(2,'0')}-${String(d2.getDate()).padStart(2,'0')}`;
      const s3 = `${d3.getFullYear()}-${String(d3.getMonth()+1).padStart(2,'0')}-${String(d3.getDate()).padStart(2,'0')}`;

      const proximosPagos = await fetchCount(
        `${SUPABASE_URL}/rest/v1/pagos_prestamos?or=(fecha_programada.eq.${s1},fecha_programada.eq.${s2},fecha_programada.eq.${s3})&estatus=eq.pendiente&select=id_pago`
      );
      const pagosVencidos = await fetchCount(
        `${SUPABASE_URL}/rest/v1/pagos_prestamos?fecha_programada=lt.${today}&estatus=eq.pendiente&select=id_pago`
      );

      setStats({
        totalSocios,
        ahorrosAcumulados,
        prestamosActivos,
        montoTotalPrestado,
        interesesAcumulados,
        proximosPagos,
        pagosVencidos,
      });
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (v) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(v || 0);

  const dashboardCards = [
    {
      title: 'Socios registrados',
      value: stats.totalSocios.toLocaleString(),
      icon: (
        <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-800',
    },
    {
      title: 'Ahorros acumulados',
      value: formatCurrency(stats.ahorrosAcumulados),
      icon: (
        <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      bgColor: 'bg-green-100',
      textColor: 'text-green-800',
    },
    {
      title: 'Préstamos activos',
      value: stats.prestamosActivos.toLocaleString(),
      icon: (
        <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
        </svg>
      ),
      bgColor: 'bg-orange-100',
      textColor: 'text-orange-800',
    },
    {
      title: 'Total prestado',
      value: formatCurrency(stats.montoTotalPrestado),
      icon: (
        <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      ),
      bgColor: 'bg-purple-100',
      textColor: 'text-purple-800',
    },
    {
      title: 'Intereses acumulados al día de hoy',
      value: formatCurrency(stats.interesesAcumulados),
      icon: (
        <svg className="w-8 h-8 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-2.21 0-4 1.343-4 3s1.79 3 4 3 4 1.343 4 3-1.79 3-4 3m0-12c1.11 0 2.08.402 2.6 1M12 8V7m0 1v8" />
        </svg>
      ),
      bgColor: 'bg-sky-100',
      textColor: 'text-sky-800',
    },
    // NUEVAS TARJETAS:
    {
      title: 'Próximos pagos',
      value: stats.proximosPagos.toLocaleString(),
      icon: (
        <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      bgColor: 'bg-yellow-100',
      textColor: 'text-yellow-800',
    },
    {
      title: 'Pagos vencidos',
      value: stats.pagosVencidos.toLocaleString(),
      icon: (
        <svg className="w-8 h-8 text-fuchsia-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      bgColor: 'bg-fuchsia-100',
      textColor: 'text-fuchsia-800',
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
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl" role="alert">
          <strong className="font-bold">¡Error!</strong> <span className="sm:inline"> {error}</span>
        </div>
      )}

      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {dashboardCards.map((card, i) => (
            <div key={i} className={`relative ${card.bgColor} rounded-2xl shadow-lg p-6 hover:scale-105 hover:shadow-xl transition`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-lg font-semibold ${card.textColor}`}>{card.title}</h3>
                <div className="p-2 rounded-full bg-white/30">{card.icon}</div>
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
