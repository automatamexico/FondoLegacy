import React, { useState, useEffect } from 'react';
import { convertirFechaHoraLocal } from '../utils/dateFormatter';

const SUPABASE_URL = 'https://ubfkhtkmlvutwdivmoff.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InViZmtodGttbHZ1dHdkaXZtb2ZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4MTc5NTUsImV4cCI6MjA2NjM5Mzk1NX0.c0iRma-dnlL29OR3ffq34nmZuj_ViApBTMG-6PEX_B4';

const PagosModule = ({ idSocio }) => {
  const [pagosList, setPagosList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagosPendientesHoy, setPagosPendientesHoy] = useState(0);
  const [proximosPagos, setProximosPagos] = useState(0);
  const [totalPagosRecibidosHoy, setTotalPagosRecibidosHoy] = useState(0);
  const [montoPagosRecibidosHoy, setMontoPagosRecibidosHoy] = useState(0);
  const [pagosVencidos, setPagosVencidos] = useState(0);

  const [searchTerm, setSearchTerm] = useState('');
  const [searchSociosResults, setSearchSociosResults] = useState([]);
  const [selectedSocio, setSelectedSocio] = useState(null);
  const [socioHistorialPagos, setSocioHistorialPagos] = useState([]);
  const [socioHasActiveLoan, setSocioHasActiveLoan] = useState(false);
  const [showHistorialView, setShowHistorialView] = useState(false);
  const [showRealizarPagoMenu, setShowRealizarPagoMenu] = useState(false); // Nuevo estado para el menú

  useEffect(() => {
    if (idSocio) {
      fetchPagos();
    } else {
      setLoading(false);
      setError("No se pudo obtener el ID de socio. Por favor, inicie sesión nuevamente.");
    }
    fetchDashboardStats();
  }, [idSocio]);

  const fetchPagos = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/pagos_prestamos?id_socio=eq.${idSocio}&select=*`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Error al cargar pagos: ${response.statusText} - ${errorData.message || 'Error desconocido'}`);
      }
      const data = await response.json();
      setPagosList(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchDashboardStats = async () => {
    const now = new Date();
    const today = now.getFullYear() + '-' +
                  String(now.getMonth() + 1).padStart(2, '0') + '-' +
                  String(now.getDate()).padStart(2, '0');
    
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    const tomorrowStr = tomorrow.getFullYear() + '-' +
                        String(tomorrow.getMonth() + 1).padStart(2, '0') + '-' +
                        String(tomorrow.getDate()).padStart(2, '0');

    const dayAfterTomorrow = new Date(now);
    dayAfterTomorrow.setDate(now.getDate() + 2);
    const dayAfterTomorrowStr = dayAfterTomorrow.getFullYear() + '-' +
                                String(dayAfterTomorrow.getMonth() + 1).padStart(2, '0') + '-' +
                                String(dayAfterTomorrow.getDate()).padStart(2, '0');

    try {
      // Pagos pendientes del día
      const pendientesHoyResponse = await fetch(`${SUPABASE_URL}/rest/v1/pagos_prestamos?fecha_programada=eq.${today}&estatus=eq.pendiente&select=*`, {
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
      if (!pendientesHoyResponse.ok) throw new Error('Error al cargar pagos pendientes hoy');
      const countPendientesHoy = parseInt(pendientesHoyResponse.headers.get('content-range').split('/')[1], 10) || 0;
      setPagosPendientesHoy(countPendientesHoy);

      // Próximos pagos (mañana y pasado mañana)
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
      if (!proximosPagosResponse.ok) throw new Error('Error al cargar próximos pagos');
      const countProximosPagos = parseInt(proximosPagosResponse.headers.get('content-range').split('/')[1], 10) || 0;
      setProximosPagos(countProximosPagos);

      // Total de pagos recibidos hoy
      const pagosRecibidosHoyResponse = await fetch(`${SUPABASE_URL}/rest/v1/pagos_prestamos?fecha_pago=eq.${today}&select=monto_pagado`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
      });
      if (!pagosRecibidosHoyResponse.ok) throw new Error('Error al cargar pagos recibidos hoy');
      const pagosRecibidosHoyData = await pagosRecibidosHoyResponse.json();
      const totalMontoRecibido = pagosRecibidosHoyData.reduce((sum, pago) => sum + (parseFloat(pago.monto_pagado) || 0), 0);
      setMontoPagosRecibidosHoy(totalMontoRecibido);
      setTotalPagosRecibidosHoy(pagosRecibidosHoyData.length);

      // Pagos vencidos
      const pagosVencidosResponse = await fetch(`${SUPABASE_URL}/rest/v1/pagos_prestamos?fecha_programada=lt.${today}&estatus=eq.pendiente&select=count`, {
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
      if (!pagosVencidosResponse.ok) throw new Error('Error al cargar pagos vencidos');
      const countPagosVencidos = parseInt(pagosVencidosResponse.headers.get('content-range').split('/')[1], 10) || 0;
      setPagosVencidos(countPagosVencidos);

    } catch (err) {
      console.error("Error al cargar estadísticas del dashboard:", err);
      setError(err.message);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value);
  };

  const handleSearchSocio = async (e) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);
    if (term.length > 0) {
      try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/socios?select=id_socio,nombre,apellido_paterno,apellido_materno`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
          }
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`Error al buscar socios: ${response.statusText} - ${errorData.message || 'Error desconocido'}`);
        }
        const data = await response.json();
        const filteredResults = data.filter(socio =>
          socio.id_socio.toString().includes(term) ||
          `${socio.nombre} ${socio.apellido_paterno} ${socio.apellido_materno}`.toLowerCase().includes(term)
        );
        setSearchSociosResults(filteredResults);
      } catch (err) {
        console.error("Error en la búsqueda de socios:", err);
        setSearchSociosResults([]);
      }
    } else {
      setSearchSociosResults([]);
    }
  };

  const handleSelectSocio = async (socio) => {
    setSelectedSocio(socio);
    setSearchTerm(`ID: ${socio.id_socio} - ${socio.nombre} ${socio.apellido_paterno} ${socio.apellido_materno}`);
    setSearchSociosResults([]);
    setShowHistorialView(true);
    setLoading(true);
    setError(null);

    try {
      // Validar si el socio tiene préstamos activos
      const prestamosActivosResponse = await fetch(`${SUPABASE_URL}/rest/v1/prestamos?id_socio=eq.${socio.id_socio}&estatus=eq.activo&select=id_prestamo`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
      });
      if (!prestamosActivosResponse.ok) {
        const errorData = await prestamosActivosResponse.json();
        throw new Error(`Error al verificar préstamos activos: ${prestamosActivosResponse.statusText} - ${errorData.message || 'Error desconocido'}`);
      }
      const prestamosActivosData = await prestamosActivosResponse.json();

      if (prestamosActivosData.length > 0) {
        setSocioHasActiveLoan(true);
        // Obtener historial de pagos realizados
        const historialResponse = await fetch(`${SUPABASE_URL}/rest/v1/pagos_prestamos?id_socio=eq.${socio.id_socio}&estatus=eq.pagado&select=id_prestamo,monto_pagado,fecha_pago,numero_pago`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
          }
        });
        if (!historialResponse.ok) {
          const errorData = await historialResponse.json();
          throw new Error(`Error al cargar historial de pagos: ${historialResponse.statusText} - ${errorData.message || 'Error desconocido'}`);
        }
        const historialData = await historialResponse.json();
        setSocioHistorialPagos(historialData);
      } else {
        setSocioHasActiveLoan(false);
        setSocioHistorialPagos([]);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToMainView = () => {
    setShowHistorialView(false);
    setSelectedSocio(null);
    setSearchTerm('');
    setSearchSociosResults([]);
    setSocioHistorialPagos([]);
    setSocioHasActiveLoan(false);
    setError(null);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Pagos</h2>
          <p className="text-slate-600">Consulta el detalle de pago de los socios</p>
        </div>
        <div className="relative">
          <button
            onClick={() => setShowRealizarPagoMenu(!showRealizarPagoMenu)}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
          >
            Realizar Pago
          </button>
          {showRealizarPagoMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
              <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Opción 1</a>
              <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Opción 2</a>
              <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Opción 3</a>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Tarjeta 1: Pagos pendientes del día */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Pagos pendientes del día</h3>
              <p className="text-2xl font-bold text-red-600">{pagosPendientesHoy}</p>
            </div>
          </div>
        </div>

        {/* Tarjeta 2: Próximos pagos */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Próximos pagos</h3>
              <p className="text-2xl font-bold text-yellow-600">{proximosPagos}</p>
            </div>
          </div>
        </div>

        {/* Tarjeta 3: Total de pagos recibidos */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Total de pagos recibidos</h3>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(montoPagosRecibidosHoy)}</p>
              <p className="text-sm text-slate-600">{totalPagosRecibidosHoy} Pagos confirmados</p>
            </div>
          </div>
        </div>

        {/* Tarjeta 4: Pagos vencidos */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Pagos vencidos</h3>
              <p className="text-2xl font-bold text-purple-600">{pagosVencidos}</p>
            </div>
          </div>
        </div>
      </div>

      {!showHistorialView ? (
        <>
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="mb-6">
              <input
                type="text"
                placeholder="Buscar por ID de Préstamo o número de pago..."
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {loading && <p className="text-center text-slate-600">Cargando pagos...</p>}
            {error && !loading && <p className="text-center text-red-500">Error: {error}</p>}

            {!loading && !error && pagosList.length === 0 && (
              <p className="text-center text-slate-600">No tienes pagos registrados.</p>
            )}

            {!loading && !error && pagosList.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">ID Pago</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">ID Préstamo</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">Número de Pago</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">Monto Programado</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">Fecha Programada</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">Estatus</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagosList.map((pago) => {
                      const { fecha, hora } = convertirFechaHoraLocal(pago.fecha_programada);
                      return (
                        <tr key={pago.id_pago} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="py-4 px-4 text-slate-700">{pago.id_pago}</td>
                          <td className="py-4 px-4 text-slate-700">{pago.id_prestamo}</td>
                          <td className="py-4 px-4 text-slate-700">{pago.numero_pago}</td>
                          <td className="py-4 px-4 font-bold text-slate-900">
                            {formatCurrency(pago.monto_pago)}
                          </td>
                          <td className="py-4 px-4 text-slate-700">
                            {fecha} {hora}
                          </td>
                          <td className="py-4 px-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              pago.estatus === 'pendiente' 
                                ? 'bg-yellow-100 text-yellow-700' 
                                : pago.estatus === 'pagado' 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-red-100 text-red-700'
                            }`}>
                              {pago.estatus}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex space-x-2">
                              <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                              </button>
                              <button className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 mt-6">
            <h3 className="text-xl font-bold text-slate-900 mb-4">Buscar Historial de Pagos por Socio</h3>
            <input
              type="text"
              placeholder="Buscar por ID de Socio o Nombre Completo..."
              value={searchTerm}
              onChange={handleSearchSocio}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {searchTerm && searchSociosResults.length > 0 && (
              <div className="mt-4 space-y-2">
                {searchSociosResults.map(socio => (
                  <div key={socio.id_socio} className="flex justify-between items-center p-3 bg-slate-100 rounded-lg">
                    <span className="text-slate-800">ID: {socio.id_socio} - {socio.nombre} {socio.apellido_paterno} {socio.apellido_materno}</span>
                    <div className="flex space-x-2">
                      <button onClick={() => handleSelectSocio(socio)} className="px-3 py-1 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600">Ver Detalles</button>
                      <button onClick={() => alert('Editar socio')} className="px-3 py-1 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600">Editar</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {searchTerm && searchSociosResults.length === 0 && (
              <p className="text-center text-slate-600 mt-4">No se encontraron socios.</p>
            )}
          </div>
        </>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 mt-6">
          <h3 className="text-xl font-bold text-slate-900 mb-4">Historial de Pagos para {selectedSocio.nombre} {selectedSocio.apellido_paterno}</h3>
          {loading && <p className="text-center text-slate-600">Cargando historial...</p>}
          {error && !loading && <p className="text-center text-red-500">Error: {error}</p>}

          {!loading && !error && !socioHasActiveLoan && (
            <>
              <p className="text-center text-red-500 text-lg font-semibold mb-4">Este socio no cuenta con ningún préstamo activo.</p>
              <div className="flex justify-center">
                <button onClick={handleBackToMainView} className="px-5 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium">
                  Volver
                </button>
              </div>
            </>
          )}

          {!loading && !error && socioHasActiveLoan && socioHistorialPagos.length === 0 && (
            <>
              <p className="text-center text-slate-600">Este socio no tiene pagos registrados.</p>
              <div className="flex justify-center mt-4">
                <button onClick={handleBackToMainView} className="px-5 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium">
                  Volver
                </button>
              </div>
            </>
          )}

          {!loading && !error && socioHasActiveLoan && socioHistorialPagos.length > 0 && (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">ID Préstamo</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">Monto Pagado</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">Fecha Pago</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">Número de Pago</th>
                    </tr>
                  </thead>
                  <tbody>
                    {socioHistorialPagos.map((pago) => {
                      const { fecha, hora } = convertirFechaHoraLocal(pago.fecha_pago);
                      return (
                        <tr key={pago.id_pago} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="py-4 px-4 text-slate-700">{pago.id_prestamo}</td>
                          <td className="py-4 px-4 font-bold text-slate-900">{formatCurrency(pago.monto_pagado)}</td>
                          <td className="py-4 px-4 text-slate-700">{fecha} {hora}</td>
                          <td className="py-4 px-4 text-slate-700">{pago.numero_pago}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-center mt-6">
                <button onClick={handleBackToMainView} className="px-5 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium">
                  Volver
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Toast Message */}
      {/* ... (tu código de toast message) */}
    </div>
  );
};

export default PagosModule;