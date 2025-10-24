import React, { useState, useEffect } from 'react';
import { convertirFechaHoraLocal } from '../utils/dateFormatter';

const SUPABASE_URL = 'https://ubfkhtkmlvutwdivmoff.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InViZmtodGttbHZ1dHdkaXZtb2ZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4MTc5NTUsImV4cCI6MjA2NjM5Mzk1NX0.c0iRma-dnlL29OR3ffq34nmZuj_ViApBTMG-6PEX_B4';

const Dashboard = ({ idSocio }) => {
  const [totalSocios, setTotalSocios] = useState(0);
  const [totalPrestamosActivos, setTotalPrestamosActivos] = useState(0);
  const [totalAhorroAcumulado, setTotalAhorroAcumulado] = useState(0);
  const [pagosPendientesHoy, setPagosPendientesHoy] = useState(0);
  const [proximosPagos, setProximosPagos] = useState(0);
  const [totalPrestadoNeto, setTotalPrestadoNeto] = useState(0); // ⬅️ capital vivo (activo - capital pagado en esos préstamos)
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    setLoading(true);
    setError(null);
    try {
      // Total Socios
      const sociosResponse = await fetch(`${SUPABASE_URL}/rest/v1/socios?select=count`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Prefer': 'count=exact'
        }
      });
      const sociosRange = sociosResponse.headers.get('content-range') || '0/0';
      const sociosCount = parseInt(sociosRange.split('/')[1], 10) || 0;
      setTotalSocios(sociosCount);

      // Total Préstamos Activos (conteo)
      const prestamosActivosResponse = await fetch(`${SUPABASE_URL}/rest/v1/prestamos?estatus=eq.activo&select=count`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Prefer': 'count=exact'
        }
      });
      const prestamosActivosRange = prestamosActivosResponse.headers.get('content-range') || '0/0';
      const prestamosActivosCount = parseInt(prestamosActivosRange.split('/')[1], 10) || 0;
      setTotalPrestamosActivos(prestamosActivosCount);

      // Total Ahorro Acumulado
      const ahorroResponse = await fetch(`${SUPABASE_URL}/rest/v1/ahorros?select=ahorro_aportado`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
      });
      const ahorroData = await ahorroResponse.json();
      const totalAhorro = ahorroData.reduce((sum, item) => sum + (parseFloat(item.ahorro_aportado) || 0), 0);
      setTotalAhorroAcumulado(totalAhorro);

      // Pagos pendientes hoy y próximos pagos
      const now = new Date();
      const today = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');

      const tomorrow = new Date(now);
      tomorrow.setDate(now.getDate() + 1);
      const tomorrowStr = tomorrow.getFullYear() + '-' + String(tomorrow.getMonth() + 1).padStart(2, '0') + '-' + String(tomorrow.getDate()).padStart(2, '0');

      const dayAfterTomorrow = new Date(now);
      dayAfterTomorrow.setDate(now.getDate() + 2);
      const dayAfterTomorrowStr = dayAfterTomorrow.getFullYear() + '-' + String(dayAfterTomorrow.getMonth() + 1).padStart(2, '0') + '-' + String(dayAfterTomorrow.getDate()).padStart(2, '0');

      const pendientesHoyResponse = await fetch(`${SUPABASE_URL}/rest/v1/pagos_prestamos?fecha_programada=eq.${today}&estatus=eq.pendiente&select=count`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Prefer': 'count=exact',
          'Range': '0-0',
          'Range-Unit': 'items'
        }
      });
      const pendientesHoyRange = pendientesHoyResponse.headers.get('content-range') || '0/0';
      const countPendientesHoy = parseInt(pendientesHoyRange.split('/')[1], 10) || 0;
      setPagosPendientesHoy(countPendientesHoy);

      const proximosPagosResponse = await fetch(`${SUPABASE_URL}/rest/v1/pagos_prestamos?or=(fecha_programada.eq.${tomorrowStr},fecha_programada.eq.${dayAfterTomorrowStr})&estatus=eq.pendiente&select=count`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Prefer': 'count=exact',
          'Range': '0-0',
          'Range-Unit': 'items'
        }
      });
      const proximosRange = proximosPagosResponse.headers.get('content-range') || '0/0';
      const countProximosPagos = parseInt(proximosRange.split('/')[1], 10) || 0;
      setProximosPagos(countProximosPagos);

      // ⬇️ TOTAL PRESTADO (CRITERIO DEL MÓDULO DE PRÉSTAMOS)
      // 1) Traer préstamos activos (id y monto_solicitado)
      const activosResp = await fetch(`${SUPABASE_URL}/rest/v1/prestamos?estatus=eq.activo&select=id_prestamo,monto_solicitado`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
      });
      const activosRows = await activosResp.json();
      const activosIds = activosRows.map(r => r.id_prestamo);
      const sumaSolicitadaActivos = activosRows.reduce((s, r) => s + (parseFloat(r.monto_solicitado) || 0), 0);

      let sumaCapitalPagadoActivos = 0;
      if (activosIds.length > 0) {
        // 2) Sumar capital_pagado SOLO de esos préstamos activos
        //    (en batches por si la lista es larga)
        const chunkSize = 100;
        for (let i = 0; i < activosIds.length; i += chunkSize) {
          const chunk = activosIds.slice(i, i + chunkSize);
          const idsList = chunk.join(',');
          const pagosResp = await fetch(
            `${SUPABASE_URL}/rest/v1/pagos_prestamos?id_prestamo=in.(${idsList})&capital_pagado=not.is.null&select=capital_pagado`,
            {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
              }
            }
          );
          const pagosRows = await pagosResp.json();
          sumaCapitalPagadoActivos += pagosRows.reduce((s, r) => s + (parseFloat(r.capital_pagado) || 0), 0);
        }
      }

      // 3) Neto: monto solicitado (activos) - capital_pagado (de esos activos)
      setTotalPrestadoNeto(Math.max(0, sumaSolicitadaActivos - sumaCapitalPagadoActivos));
    } catch (err) {
      console.error("Error al cargar estadísticas del dashboard:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value || 0);
  };

  if (loading) {
    return <div className="p-6 text-center text-slate-600">Cargando tablero...</div>;
  }

  if (error) {
    return <div className="p-6 text-center text-red-500">Error: {error}</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold text-slate-900 mb-4">Tablero Principal</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total de Socios */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Total de Socios</h3>
              <p className="text-2xl font-bold text-indigo-600">{totalSocios.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Préstamos Activos (conteo) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Préstamos Activos</h3>
              <p className="text-2xl font-bold text-orange-600">{totalPrestamosActivos.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Ahorro Acumulado */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Ahorro Acumulado</h3>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(totalAhorroAcumulado)}</p>
            </div>
          </div>
        </div>

        {/* Pagos Pendientes Hoy */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Pagos Pendientes Hoy</h3>
              <p className="text-2xl font-bold text-red-600">{pagosPendientesHoy}</p>
            </div>
          </div>
        </div>

        {/* Próximos Pagos */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Próximos Pagos</h3>
              <p className="text-2xl font-bold text-yellow-600">{proximosPagos}</p>
            </div>
          </div>
        </div>

        {/* Total prestado (capital vivo) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Total prestado</h3>
              <p className="text-2xl font-bold text-purple-600">{formatCurrency(totalPrestadoNeto)}</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
