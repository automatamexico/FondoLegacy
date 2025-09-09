import React, { useState, useEffect } from 'react';
import { convertirFechaHoraLocal } from '../utils/dateFormatter';

const SUPABASE_URL = 'https://ubfkhtkmlvutwdivmoff.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InViZmtodGttbHZ1dHdkaXZtb2ZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4MTc5NTUsImV4cCI6MjA2NjM5Mzk1NX0.c0iRma-dnlL29OR3ffq34nmZuj_ViApBTMG-6PEX_B4';

const PAGE_LIMIT = 50; // límite máximos de registros en historial

const PagosModule = () => {
  // Tarjetas / stats
  const [pagosPendientesHoy, setPagosPendientesHoy] = useState(0);
  const [proximosPagos, setProximosPagos] = useState(0);
  const [totalPagosRecibidosHoy, setTotalPagosRecibidosHoy] = useState(0);
  const [montoPagosRecibidosHoy, setMontoPagosRecibidosHoy] = useState(0);
  const [pagosVencidos, setPagosVencidos] = useState(0);

  // Búsqueda e historial en la vista principal
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [searchSociosResults, setSearchSociosResults] = useState([]);
  const [selectedSocio, setSelectedSocio] = useState(null);
  const [socioHistorialPagos, setSocioHistorialPagos] = useState([]);
  const [socioHasActiveLoan, setSocioHasActiveLoan] = useState(false);

  // Modal de realizar pago
  const [showPayModal, setShowPayModal] = useState(false);
  const [paySearchTerm, setPaySearchTerm] = useState('');
  const [paySearchResults, setPaySearchResults] = useState([]);
  const [paySelectedSocio, setPaySelectedSocio] = useState(null);
  const [payPendientes, setPayPendientes] = useState([]);
  const [payPagados, setPayPagados] = useState([]);
  const [payLoading, setPayLoading] = useState(false);

  // Toast
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    const now = new Date();
    const today =
      now.getFullYear() +
      '-' +
      String(now.getMonth() + 1).padStart(2, '0') +
      '-' +
      String(now.getDate()).padStart(2, '0');

    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    const tomorrowStr =
      tomorrow.getFullYear() +
      '-' +
      String(tomorrow.getMonth() + 1).padStart(2, '0') +
      '-' +
      String(tomorrow.getDate()).padStart(2, '0');

    const dayAfterTomorrow = new Date(now);
    dayAfterTomorrow.setDate(now.getDate() + 2);
    const dayAfterTomorrowStr =
      dayAfterTomorrow.getFullYear() +
      '-' +
      String(dayAfterTomorrow.getMonth() + 1).padStart(2, '0') +
      '-' +
      String(dayAfterTomorrow.getDate()).padStart(2, '0');

    try {
      setLoading(true);

      // Pendientes hoy
      const pendientesHoyResponse = await fetch(
        `${SUPABASE_URL}/rest/v1/pagos_prestamos?fecha_programada=eq.${today}&estatus=eq.pendiente&select=*`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
            Prefer: 'count=exact',
            Range: '0-0',
            'Range-Unit': 'items',
          },
        }
      );
      if (!pendientesHoyResponse.ok)
        throw new Error('Error al cargar pagos pendientes hoy');
      const countPendientesHoy = parseInt(
        pendientesHoyResponse.headers.get('content-range')?.split('/')[1] ?? '0',
        10
      );
      setPagosPendientesHoy(countPendientesHoy);

      // Próximos pagos (mañana y pasado mañana)
      const proximosPagosResponse = await fetch(
        `${SUPABASE_URL}/rest/v1/pagos_prestamos?or=(fecha_programada.eq.${tomorrowStr},fecha_programada.eq.${dayAfterTomorrowStr})&estatus=eq.pendiente&select=count`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
            Prefer: 'count=exact',
            Range: '0-0',
            'Range-Unit': 'items',
          },
        }
      );
      if (!proximosPagosResponse.ok)
        throw new Error('Error al cargar próximos pagos');
      const countProximosPagos = parseInt(
        proximosPagosResponse.headers.get('content-range')?.split('/')[1] ?? '0',
        10
      );
      setProximosPagos(countProximosPagos);

      // Pagos recibidos hoy (monto y cantidad)
      const pagosRecibidosHoyResponse = await fetch(
        `${SUPABASE_URL}/rest/v1/pagos_prestamos?fecha_pago=eq.${today}&select=monto_pagado`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          },
        }
      );
      if (!pagosRecibidosHoyResponse.ok)
        throw new Error('Error al cargar pagos recibidos hoy');
      const pagosRecibidosHoyData = await pagosRecibidosHoyResponse.json();
      const totalMontoRecibido = pagosRecibidosHoyData.reduce(
        (sum, p) => sum + (parseFloat(p.monto_pagado) || 0),
        0
      );
      setMontoPagosRecibidosHoy(totalMontoRecibido);
      setTotalPagosRecibidosHoy(pagosRecibidosHoyData.length);

      // Vencidos
      const pagosVencidosResponse = await fetch(
        `${SUPABASE_URL}/rest/v1/pagos_prestamos?fecha_programada=lt.${today}&estatus=eq.pendiente&select=count`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
            Prefer: 'count=exact',
            Range: '0-0',
            'Range-Unit': 'items',
          },
        }
      );
      if (!pagosVencidosResponse.ok)
        throw new Error('Error al cargar pagos vencidos');
      const countPagosVencidos = parseInt(
        pagosVencidosResponse.headers.get('content-range')?.split('/')[1] ?? '0',
        10
      );
      setPagosVencidos(countPagosVencidos);
    } catch (err) {
      console.error('Error al cargar estadísticas del dashboard:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) =>
    new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(value);

  // -------- BÚSQUEDA DE SOCIOS (vista principal) --------
  const handleSearchSocio = async (e) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);

    if (!term) {
      setSearchSociosResults([]);
      return;
    }

    try {
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/socios?select=id_socio,nombre,apellido_paterno,apellido_materno`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          },
        }
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          `Error al buscar socios: ${response.statusText} - ${
            errorData.message || 'Error desconocido'
          }`
        );
      }
      const data = await response.json();
      const filtered = data.filter(
        (s) =>
          s.id_socio.toString().includes(term) ||
          `${s.nombre} ${s.apellido_paterno} ${s.apellido_materno}`
            .toLowerCase()
            .includes(term)
      );
      setSearchSociosResults(filtered);
    } catch (err) {
      console.error('Error en la búsqueda de socios:', err);
      setSearchSociosResults([]);
    }
  };

  const loadHistorialSocio = async (socio) => {
    try {
      // ¿Tiene préstamo activo?
      const prestamosActivosResponse = await fetch(
        `${SUPABASE_URL}/rest/v1/prestamos?id_socio=eq.${socio.id_socio}&estatus=eq.activo&select=id_prestamo`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          },
        }
      );
      if (!prestamosActivosResponse.ok) {
        const errorData = await prestamosActivosResponse.json();
        throw new Error(
          `Error al verificar préstamos activos: ${prestamosActivosResponse.statusText} - ${
            errorData.message || 'Error desconocido'
          }`
        );
      }
      const prestamosActivosData = await prestamosActivosResponse.json();

      if (prestamosActivosData.length === 0) {
        setSocioHasActiveLoan(false);
        setSocioHistorialPagos([]);
        return;
      }

      setSocioHasActiveLoan(true);

      // HISTORIAL pagado, ordenado reciente→antiguo, límite 50
      const historialResponse = await fetch(
        `${SUPABASE_URL}/rest/v1/pagos_prestamos?id_socio=eq.${socio.id_socio}&estatus=eq.pagado&order=fecha_pago.desc&limit=${PAGE_LIMIT}&select=id_pago,id_prestamo,monto_pagado,fecha_pago,numero_pago`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          },
        }
      );
      if (!historialResponse.ok) {
        const errorData = await historialResponse.json();
        throw new Error(
          `Error al cargar historial de pagos: ${historialResponse.statusText} - ${
            errorData.message || 'Error desconocido'
          }`
        );
      }
      const historialData = await historialResponse.json();
      setSocioHistorialPagos(historialData);
    } catch (err) {
      setError(err.message);
      setSocioHistorialPagos([]);
      setSocioHasActiveLoan(false);
    }
  };

  const handleSelectSocio = async (socio) => {
    setSelectedSocio(socio);
    setSearchTerm(
      `ID: ${socio.id_socio} - ${socio.nombre} ${socio.apellido_paterno} ${socio.apellido_materno}`
    );
    setSearchSociosResults([]);
    setLoading(true);
    setError(null);
    await loadHistorialSocio(socio);
    setLoading(false);
  };

  const handleClear = () => {
    setSelectedSocio(null);
    setSocioHistorialPagos([]);
    setSocioHasActiveLoan(false);
    setSearchTerm('');
    setSearchSociosResults([]);
    setError(null);
  };

  // ---------- MODAL: REALIZAR PAGO ----------
  const openPayModal = () => {
    setShowPayModal(true);
    setPaySearchTerm('');
    setPaySearchResults([]);
    setPaySelectedSocio(null);
    setPayPendientes([]);
    setPayPagados([]);
    setPayLoading(false);
  };

  const closePayModal = () => {
    setShowPayModal(false);
  };

  const handlePaySearch = async (e) => {
    const term = e.target.value.toLowerCase();
    setPaySearchTerm(term);

    if (!term) {
      setPaySearchResults([]);
      return;
    }

    try {
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/socios?select=id_socio,nombre,apellido_paterno,apellido_materno`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          },
        }
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          `Error al buscar socios: ${response.statusText} - ${
            errorData.message || 'Error desconocido'
          }`
        );
      }
      const data = await response.json();
      const filtered = data.filter(
        (s) =>
          s.id_socio.toString().includes(term) ||
          `${s.nombre} ${s.apellido_paterno} ${s.apellido_materno}`
            .toLowerCase()
            .includes(term)
      );
      setPaySearchResults(filtered);
    } catch (err) {
      console.error('Error en la búsqueda (modal):', err);
      setPaySearchResults([]);
    }
  };

  const handlePaySelectSocio = async (socio) => {
    setPaySelectedSocio(socio);
    setPaySearchTerm(
      `ID: ${socio.id_socio} - ${socio.nombre} ${socio.apellido_paterno} ${socio.apellido_materno}`
    );
    setPaySearchResults([]);
    await refreshPayLists(socio.id_socio);
  };

  const refreshPayLists = async (id_socio) => {
    setPayLoading(true);
    try {
      // Pendientes
      const pResp = await fetch(
        `${SUPABASE_URL}/rest/v1/pagos_prestamos?id_socio=eq.${id_socio}&estatus=eq.pendiente&order=fecha_programada.asc&select=id_pago,id_prestamo,numero_pago,monto_pago,fecha_programada`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          },
        }
      );
      if (!pResp.ok) throw new Error('Error al cargar pagos pendientes');
      const pData = await pResp.json();
      setPayPendientes(pData);

      // Pagados (últimos 50)
      const rResp = await fetch(
        `${SUPABASE_URL}/rest/v1/pagos_prestamos?id_socio=eq.${id_socio}&estatus=eq.pagado&order=fecha_pago.desc&limit=50&select=id_pago,id_prestamo,numero_pago,monto_pagado,fecha_pago`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          },
        }
      );
      if (!rResp.ok) throw new Error('Error al cargar pagos realizados');
      const rData = await rResp.json();
      setPayPagados(rData);
    } catch (err) {
      setError(err.message);
      setPayPendientes([]);
      setPayPagados([]);
    } finally {
      setPayLoading(false);
    }
  };

  const handleRealizarPago = async (pago) => {
    const confirmar = window.confirm(
      `¿Deseas registrar el pago #${pago.numero_pago} del préstamo ${pago.id_prestamo} por ${formatCurrency(
        pago.monto_pago
      )}?`
    );
    if (!confirmar) return;

    try {
      setPayLoading(true);

      const nowISO = new Date().toISOString(); // fecha_pago
      const body = {
        estatus: 'pagado',
        fecha_pago: nowISO,
        monto_pagado: pago.monto_pago, // por defecto, igual a lo programado
      };

      const resp = await fetch(
        `${SUPABASE_URL}/rest/v1/pagos_prestamos?id_pago=eq.${pago.id_pago}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
            Prefer: 'return=representation',
          },
          body: JSON.stringify(body),
        }
      );

      if (!resp.ok) {
        const errData = await resp.json();
        throw new Error(
          `No se pudo registrar el pago: ${resp.statusText} - ${
            errData.message || 'Error desconocido'
          }`
        );
      }

      // Actualizar listas del modal y tarjetas
      if (paySelectedSocio) {
        await refreshPayLists(paySelectedSocio.id_socio);
      }
      await fetchDashboardStats();

      setToastMessage('Pago registrado correctamente');
      setTimeout(() => setToastMessage(''), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setPayLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Pagos</h2>
          <p className="text-slate-600">
            Consulta indicadores y el historial de pagos por socio
          </p>
        </div>

        <button
          onClick={openPayModal}
          className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
        >
          Realizar Pago
        </button>
      </div>

      {/* Tarjetas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Pendientes hoy */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
              <svg
                className="w-5 h-5 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">
                Pagos pendientes del día
              </h3>
              <p className="text-2xl font-bold text-red-600">
                {pagosPendientesHoy}
              </p>
            </div>
          </div>
        </div>

        {/* Próximos pagos */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center">
              <svg
                className="w-5 h-5 text-yellow-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Próximos pagos</h3>
              <p className="text-2xl font-bold text-yellow-600">
                {proximosPagos}
              </p>
            </div>
          </div>
        </div>

        {/* Total recibidos hoy */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <svg
                className="w-5 h-5 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">
                Total de pagos recibidos
              </h3>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(montoPagosRecibidosHoy)}
              </p>
              <p className="text-sm text-slate-600">
                {totalPagosRecibidosHoy} pagos confirmados hoy
              </p>
            </div>
          </div>
        </div>

        {/* Vencidos */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
              <svg
                className="w-5 h-5 text-purple-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Pagos vencidos</h3>
              <p className="text-2xl font-bold text-purple-600">
                {pagosVencidos}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Buscador por socio */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h3 className="text-xl font-bold text-slate-900 mb-4">
          Buscar historial de pagos por socio
        </h3>

        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Buscar por ID de Socio o Nombre Completo..."
            value={searchTerm}
            onChange={handleSearchSocio}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {selectedSocio && (
            <button
              onClick={handleClear}
              className="px-4 py-3 bg-slate-200 text-slate-800 rounded-xl hover:bg-slate-300 transition-colors"
            >
              Limpiar
            </button>
          )}
        </div>

        {searchTerm && searchSociosResults.length > 0 && (
          <div className="mt-4 space-y-2">
            {searchSociosResults.map((socio) => (
              <div
                key={socio.id_socio}
                className="flex justify-between items-center p-3 bg-slate-100 rounded-lg"
              >
                <span className="text-slate-800">
                  ID: {socio.id_socio} - {socio.nombre} {socio.apellido_paterno}{' '}
                  {socio.apellido_materno}
                </span>
                <button
                  onClick={() => handleSelectSocio(socio)}
                  className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                >
                  Ver historial
                </button>
              </div>
            ))}
          </div>
        )}
        {searchTerm && searchSociosResults.length === 0 && (
          <p className="text-center text-slate-600 mt-4">
            No se encontraron socios.
          </p>
        )}
      </div>

      {/* Historial del socio seleccionado */}
      {selectedSocio && (
        <
