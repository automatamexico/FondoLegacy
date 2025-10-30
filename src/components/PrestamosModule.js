// src/components/PrestamosModule.js
import React, { useState, useEffect, useCallback } from 'react';
import { convertirFechaHoraLocal } from '../utils/dateFormatter';

const SUPABASE_URL = 'https://ubfkhtkmlvutwdivmoff.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InViZmtodGttbHZ1dHdkaXZtb2ZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4MTc5NTUsImV4cCI6MjA2NjM5Mzk1NX0.c0iRma-dnlL29OR3ffq34nmZuj_ViApBTMG-6PEX_B4';

const PrestamosModule = ({ idSocio }) => {
  const [prestamosList, setPrestamosList] = useState([]);
  const [sociosList, setSociosList] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [totalSociosConPrestamo, setTotalSociosConPrestamo] = useState(0);
  const [totalDineroPrestado, setTotalDineroPrestado] = useState(0);

  const [showAddPrestamoModal, setShowAddPrestamoModal] = useState(false);
  const [showConfirmPrestamoModal, setShowConfirmPrestamoModal] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [sociosConPrestamosActivos, setSociosConPrestamosActivos] = useState([]);

  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedPrestamo, setSelectedPrestamo] = useState(null);
  const [historialPagosPrestamo, setHistorialPagosPrestamo] = useState([]);

  const [showPrestamoHistorial, setShowPrestamoHistorial] = useState(false);
  const [selectedSocioForHistorial, setSelectedSocioForHistorial] = useState(null);
  const [socioPrestamos, setSocioPrestamos] = useState([]);
  const [showEditPrestamosModal, setShowEditPrestamosModal] = useState(false);

  const [submitting, setSubmitting] = useState(false);

  const currentUserRole = localStorage.getItem('currentUser')
    ? (JSON.parse(localStorage.getItem('currentUser')).role || 'admin')
    : 'admin';

  const weeklyRateOptions = Array.from({ length: 12 }, (_, i) => 0.5 * (i + 1));
  const biweeklyRateOptions = Array.from({ length: 13 }, (_, i) => 2 + 0.5 * i);

  const [newPrestamo, setNewPrestamo] = useState({
    id_socio: '',
    monto_solicitado: '',
    numero_plazos: '',
    tasa_interes_mensual: '',
    tipo_plazo: 'mensual',
    plazo_semanas: '',
    tasa_interes_semanal: '',
    plazo_quincenas: '',
    tasa_interes_quincenal: ''
  });

  const [pagoPeriodo, setPagoPeriodo] = useState(0);
  const [abonoCapitalPeriodo, setAbonoCapitalPeriodo] = useState(0);
  const [interesPeriodoEstimado, setInteresPeriodoEstimado] = useState(0);

  const plazoOpciones = Array.from({ length: 48 }, (_, i) => i + 1);
  const tasaOpciones = Array.from({ length: 7 }, (_, i) => i + 2);

  useEffect(() => {
    fetchGlobalPrestamoStats();
    fetchSocios();
    if (!idSocio) {
      fetchAllSociosConPrestamoActivo();
    } else {
      fetchPrestamosForUser(idSocio);
    }
  }, [idSocio]);

  // Marcar LIQUIDADO si todos sus pagos están 'pagado'
  const checkAndMarkLiquidado = async (id_prestamo) => {
    try {
      const totalResp = await fetch(
        `${SUPABASE_URL}/rest/v1/pagos_prestamos?id_prestamo=eq.${id_prestamo}&select=count`,
        { headers: { 'Content-Type': 'application/json', apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}`, Prefer: 'count=exact', Range: '0-0', 'Range-Unit': 'items' } }
      );
      const totalRange = totalResp.headers.get('content-range') || '0/0';
      const totalPagos = parseInt(totalRange.split('/')[1], 10) || 0;

      const pagadosResp = await fetch(
        `${SUPABASE_URL}/rest/v1/pagos_prestamos?id_prestamo=eq.${id_prestamo}&estatus=eq.pagado&select=count`,
        { headers: { 'Content-Type': 'application/json', apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}`, Prefer: 'count=exact', Range: '0-0', 'Range-Unit': 'items' } }
      );
      const pagadosRange = pagadosResp.headers.get('content-range') || '0/0';
      const pagosPagados = parseInt(pagadosRange.split('/')[1], 10) || 0;

      if (totalPagos > 0 && pagosPagados === totalPagos) {
        const patchResp = await fetch(
          `${SUPABASE_URL}/rest/v1/prestamos?id_prestamo=eq.${id_prestamo}`,
          {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}`, Prefer: 'return=representation' },
            body: JSON.stringify({ estatus: 'LIQUIDADO' })
          }
        );
        if (patchResp.ok) {
          setPrestamosList(prev => prev.map(p => p.id_prestamo === id_prestamo ? { ...p, estatus: 'LIQUIDADO' } : p));
        }
      }
    } catch (e) {
      console.error('checkAndMarkLiquidado error:', e);
    }
  };

  // KPIs
  const fetchGlobalPrestamoStats = async () => {
    try {
      const sociosConPrestamoResponse = await fetch(
        `${SUPABASE_URL}/rest/v1/prestamos?select=id_socio`,
        { headers: { 'Content-Type': 'application/json', apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } }
      );
      const sociosConPrestamoData = await sociosConPrestamoResponse.json();
      const uniqueSociosIds = new Set(sociosConPrestamoData.map((item) => item.id_socio));
      setTotalSociosConPrestamo(uniqueSociosIds.size);

      const sumPrestamosResp = await fetch(
        `${SUPABASE_URL}/rest/v1/prestamos?select=monto_solicitado`,
        { headers: { 'Content-Type': 'application/json', apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } }
      );
      const prestamosRows = await sumPrestamosResp.json();
      const totalPrestado = prestamosRows.reduce((s, x) => s + (parseFloat(x.monto_solicitado) || 0), 0);

      const sumCapitalResp = await fetch(
        `${SUPABASE_URL}/rest/v1/pagos_prestamos?select=capital_pagado&capital_pagado=not.is.null`,
        { headers: { 'Content-Type': 'application/json', apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } }
      );
      const capitalRows = await sumCapitalResp.json();
      const totalCapitalPagado = capitalRows.reduce((s, x) => s + (parseFloat(x.capital_pagado) || 0), 0);

      const netoAdeudado = Math.max(0, totalPrestado - totalCapitalPagado);
      setTotalDineroPrestado(netoAdeudado);
    } catch (err) {
      console.error('Error KPIs préstamos:', err);
      setTotalSociosConPrestamo(0);
      setTotalDineroPrestado(0);
    }
  };

  // Listado usuario
  const fetchPrestamosForUser = async (socioId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/prestamos?id_socio=eq.${socioId}&select=*`,
        { headers: { 'Content-Type': 'application/json', apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } }
      );
      if (!response.ok) throw new Error('Error al cargar préstamos del socio');
      const data = await response.json();
      setPrestamosList(data);
      await Promise.all((data || []).map(p => checkAndMarkLiquidado(p.id_prestamo)));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Catálogo de socios
  const fetchSocios = async () => {
    try {
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/socios?select=id_socio,nombre,apellido_paterno,apellido_materno`,
        { headers: { 'Content-Type': 'application/json', apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } }
      );
      if (!response.ok) throw new Error('Error al cargar socios');
      const data = await response.json();
      setSociosList(data);
    } catch (err) {
      console.error('Error al cargar socios:', err);
    }
  };

  // Socios con préstamos activos
  const fetchAllSociosConPrestamoActivo = async () => {
    setLoading(true);
    setError(null);
    try {
      const prestamosActivosResponse = await fetch(
        `${SUPABASE_URL}/rest/v1/prestamos?select=id_socio&estatus=eq.activo`,
        { headers: { 'Content-Type': 'application/json', apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } }
      );
      if (!prestamosActivosResponse.ok) throw new Error('Error al cargar préstamos activos');
      const prestamosActivosData = await prestamosActivosResponse.json();
      const uniqueSocioIds = [...new Set(prestamosActivosData.map((item) => item.id_socio))];

      if (uniqueSocioIds.length === 0) {
        setSociosConPrestamosActivos([]);
        setLoading(false);
        return;
      }

      const sociosResponse = await fetch(
        `${SUPABASE_URL}/rest/v1/socios?id_socio=in.(${uniqueSocioIds.join(',')})&select=id_socio,nombre,apellido_paterno,apellido_materno`,
        { headers: { 'Content-Type': 'application/json', apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } }
      );
      if (!sociosResponse.ok) throw new Error('Error al cargar detalles de socios');
      const sociosData = await sociosResponse.json();
      setSociosConPrestamosActivos(sociosData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // VER HISTORIAL (restaurado)
  const handleVerHistorialPrestamosSocio = async (socio) => {
    setSelectedSocioForHistorial(socio);
    setShowEditPrestamosModal(false);
    setShowPrestamoHistorial(true);
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/prestamos?id_socio=eq.${socio.id_socio}&order=fecha_solicitud.desc&select=id_prestamo,monto_solicitado,fecha_solicitud,numero_plazos,tipo_plazo,interes`,
        { headers: { 'Content-Type': 'application/json', apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } }
      );
      if (!response.ok) throw new Error('Error al cargar préstamos del socio');

      const data = await response.json();
      const prestamosConEstado = await Promise.all(
        data.map(async (prestamo) => {
          // Para informar si ya está pagado completamente (solo informativo)
          const totalPagosProgramadosResponse = await fetch(
            `${SUPABASE_URL}/rest/v1/pagos_prestamos?id_prestamo=eq.${prestamo.id_prestamo}&select=count`,
            { headers: { 'Content-Type': 'application/json', apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}`, Prefer: 'count=exact', Range: '0-0', 'Range-Unit': 'items' } }
          );
          const totalRange = totalPagosProgramadosResponse.headers.get('content-range') || '0/0';
          const totalPagosProgramados = parseInt(totalRange.split('/')[1], 10) || 0;

          const pagosPagadosResponse = await fetch(
            `${SUPABASE_URL}/rest/v1/pagos_prestamos?id_prestamo=eq.${prestamo.id_prestamo}&estatus=eq.pagado&select=count`,
            { headers: { 'Content-Type': 'application/json', apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}`, Prefer: 'count=exact', Range: '0-0', 'Range-Unit': 'items' } }
          );
          const pagadosRange = pagosPagadosResponse.headers.get('content-range') || '0/0';
          const pagosPagados = parseInt(pagadosRange.split('/')[1], 10) || 0;

          return { ...prestamo, isPaid: totalPagosProgramados > 0 && pagosPagados === totalPagosProgramados };
        })
      );

      setSocioPrestamos(prestamosConEstado);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // EDITAR (restaurado)
  const handleEditarPrestamosSocio = async (socio) => {
    setSelectedSocioForHistorial(socio);
    setShowPrestamoHistorial(false);
    setShowEditPrestamosModal(true);
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/prestamos?id_socio=eq.${socio.id_socio}&order=fecha_solicitud.desc&select=id_prestamo,monto_solicitado,fecha_solicitud,numero_plazos`,
        { headers: { 'Content-Type': 'application/json', apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } }
      );
      if (!response.ok) throw new Error('Error al cargar préstamos para edición');

      const data = await response.json();
      const prestamosConEstadoYHabilitacion = await Promise.all(
        data.map(async (prestamo) => {
          const pagosRealizadosResponse = await fetch(
            `${SUPABASE_URL}/rest/v1/pagos_prestamos?id_prestamo=eq.${prestamo.id_prestamo}&monto_pagado=gt.0&select=count`,
            { headers: { 'Content-Type': 'application/json', apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}`, Prefer: 'count=exact', Range: '0-0', 'Range-Unit': 'items' } }
          );
          const range = pagosRealizadosResponse.headers.get('content-range') || '0/0';
          const pagosRealizadosCount = parseInt(range.split('/')[1], 10) || 0;

          const fechaSolicitud = new Date(prestamo.fecha_solicitud);
          const now = new Date();
          const diffTime = Math.abs(now.getTime() - fechaSolicitud.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          const canDelete = pagosRealizadosCount === 0 && diffDays <= 1;
          return { ...prestamo, canDelete };
        })
      );
      setSocioPrestamos(prestamosConEstadoYHabilitacion);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Ver detalles (y verificar LIQUIDADO)
  const handleVerDetallesPrestamo = async (prestamo) => {
    setSelectedPrestamo(prestamo);
    setShowDetailsModal(true);
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/pagos_prestamos?id_prestamo=eq.${prestamo.id_prestamo}&order=fecha_programada.asc&select=numero_pago,fecha_programada,monto_pago,fecha_pago,fecha_hora_pago,monto_pagado,interes_pagado,capital_pagado,estatus`,
        { headers: { 'Content-Type': 'application/json', apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } }
      );
      if (!response.ok) throw new Error('Error al cargar historial de pagos del préstamo');
      const data = await response.json();
      setHistorialPagosPrestamo(data);

      await checkAndMarkLiquidado(prestamo.id_prestamo);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToListadoPrestamos = () => {
    setShowDetailsModal(false);
    setSelectedPrestamo(null);
    setHistorialPagosPrestamo([]);
  };

  const handleBackToMainView = () => {
    setShowPrestamoHistorial(false);
    setShowEditPrestamosModal(false);
    setSelectedSocioForHistorial(null);
    setSocioPrestamos([]);
    setSearchTerm('');
    setSearchResults([]);
    setError(null);
  };

  const handleDeletePrestamo = async (prestamoId) => {
    if (!window.confirm('¿Eliminar este préstamo? Esta acción no se puede deshacer.')) return;
    setLoading(true);
    setError(null);
    setToastMessage('');
    try {
      const deletePagosResponse = await fetch(
        `${SUPABASE_URL}/rest/v1/pagos_prestamos?id_prestamo=eq.${prestamoId}`,
        { method: 'DELETE', headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } }
      );
      if (!deletePagosResponse.ok) throw new Error('Error al eliminar pagos relacionados');

      const deletePrestamoResponse = await fetch(
        `${SUPABASE_URL}/rest/v1/prestamos?id_prestamo=eq.${prestamoId}`,
        { method: 'DELETE', headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } }
      );
      if (!deletePrestamoResponse.ok) throw new Error('Error al eliminar el préstamo');

      setToastMessage('Préstamo eliminado exitosamente.');
      if (selectedSocioForHistorial) {
        if (showEditPrestamosModal) await handleEditarPrestamosSocio(selectedSocioForHistorial);
        if (showPrestamoHistorial) await handleVerHistorialPrestamosSocio(selectedSocioForHistorial);
      }
      fetchGlobalPrestamoStats();
      if (!idSocio) fetchAllSociosConPrestamoActivo();
      else fetchPrestamosForUser(idSocio);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setTimeout(() => setToastMessage(''), 3000);
    }
  };

  const handleSearch = (e) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);
    if (sociosList) {
      const results = sociosList.filter(
        (socio) =>
          socio.id_socio.toString().includes(term) ||
          `${socio.nombre} ${socio.apellido_paterno} ${socio.apellido_materno}`.toLowerCase().includes(term)
      );
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  };

  const formatCurrency = (value) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value || 0);

  // ============================
  // Render
  // ============================
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Préstamos</h2>
          <p className="text-slate-600">Consulta el detalle de los préstamos de los socios</p>
        </div>
        {currentUserRole === 'admin' && (
          <button
            onClick={() => setShowAddPrestamoModal(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-medium"
          >
            Registrar nuevo préstamo
          </button>
        )}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Total de Socios con Préstamo</h3>
              <p className="text-2xl font-bold text-orange-600">{totalSociosConPrestamo.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Total de Dinero Prestado</h3>
              <p className="text-2xl font-bold text-purple-600">{formatCurrency(totalDineroPrestado)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Búsqueda */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h3 className="text-xl font-semibold text-slate-900 mb-4">Buscar Socio</h3>
        <input
          type="text"
          placeholder="Buscar por ID de Socio o Nombre Completo..."
          value={searchTerm}
          onChange={handleSearch}
          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {searchTerm && sociosList && searchResults.length > 0 && (
          <div className="mt-4 space-y-2">
            {searchResults.map((socio) => (
              <div key={socio.id_socio} className="flex justify-between items-center p-3 bg-slate-100 rounded-lg">
                <span className="text-slate-800">
                  ID: {socio.id_socio} - {socio.nombre} {socio.apellido_paterno} {socio.apellido_materno}
                </span>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleVerHistorialPrestamosSocio(socio)}
                    className="px-3 py-1 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600"
                  >
                    Ver Historial de Préstamos
                  </button>
                  <button
                    onClick={() => handleEditarPrestamosSocio(socio)}
                    className="px-3 py-1 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600"
                  >
                    Editar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        {searchTerm && sociosList && searchResults.length === 0 && (
          <p className="text-center text-slate-600 mt-4">No se encontraron resultados.</p>
        )}
      </div>

      {/* Socios con préstamos activos (admin) */}
      {currentUserRole === 'admin' &&
        sociosConPrestamosActivos.length > 0 &&
        !showPrestamoHistorial &&
        !showEditPrestamosModal && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h3 className="text-xl font-semibold text-slate-900 mb-4">Socios con Préstamos Activos</h3>
            {loading && <p className="text-center text-slate-600">Cargando socios con préstamos...</p>}
            {error && !loading && <p className="text-center text-red-500">Error: {error}</p>}
            {!loading && !error && sociosConPrestamosActivos.length === 0 && (
              <p className="text-center text-slate-600">No hay socios con préstamos activos.</p>
            )}
            {!loading && !error && sociosConPrestamosActivos.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">ID Socio</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">Nombre Completo</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sociosConPrestamosActivos.map((socio) => (
                      <tr key={socio.id_socio} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="py-4 px-4 text-slate-700">{socio.id_socio}</td>
                        <td className="py-4 px-4 font-medium text-slate-900">
                          {socio.nombre} {socio.apellido_paterno} {socio.apellido_materno}
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleVerHistorialPrestamosSocio(socio)}
                              className="px-3 py-1 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600"
                            >
                              Ver Historial de Préstamos
                            </button>
                            <button
                              onClick={() => handleEditarPrestamosSocio(socio)}
                              className="px-3 py-1 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600"
                            >
                              Editar
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      {/* Tabla de préstamos del socio (cuando idSocio viene) */}
      {!showPrestamoHistorial && !showEditPrestamosModal && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          {loading && <p className="text-center text-slate-600">Cargando préstamos...</p>}
          {error && !loading && <p className="text-center text-red-500">Error: {error}</p>}
          {!loading && !error && prestamosList.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">ID Préstamo</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Monto Original</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Pago por periodo</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Tasa</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Vencimiento</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Estado</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {prestamosList.map((prestamo) => (
                    <tr key={prestamo.id_prestamo} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-4 px-4 text-slate-700">{prestamo.id_prestamo}</td>
                      <td className="py-4 px-4 font-bold text-slate-900">
                        {formatCurrency(parseFloat(prestamo.monto_solicitado) || 0)}
                      </td>
                      <td className="py-4 px-4 font-medium text-slate-900">
                        {formatCurrency(parseFloat(prestamo.pago_requerido) || 0)}
                      </td>
                      <td className="py-4 px-4 text-orange-600 font-medium">{prestamo.interes}%</td>
                      <td className="py-4 px-4 text-slate-700">{prestamo.fecha_vencimiento}</td>
                      <td className="py-4 px-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            prestamo.estatus === 'activo'
                              ? 'bg-green-100 text-green-700'
                              : prestamo.estatus === 'LIQUIDADO'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {prestamo.estatus}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleVerDetallesPrestamo(prestamo)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Vista: Historial de préstamos del socio (restaurada) */}
      {showPrestamoHistorial && selectedSocioForHistorial && !showEditPrestamosModal && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h3 className="text-xl font-bold text-slate-900 mb-4">
            Historial de Préstamos de {selectedSocioForHistorial.nombre} {selectedSocioForHistorial.apellido_paterno}
          </h3>
          {loading && <p className="text-center text-slate-600">Cargando préstamos...</p>}
          {error && !loading && <p className="text-center text-red-500">Error: {error}</p>}
          {!loading && !error && socioPrestamos.length === 0 && (
            <p className="text-center text-slate-600">Este socio no tiene préstamos registrados.</p>
          )}
          {!loading && !error && socioPrestamos.length > 0 && (
            <div className="space-y-4">
              {socioPrestamos.map((prestamo) => (
                <div key={prestamo.id_prestamo} className="p-4 border border-slate-200 rounded-lg flex justify-between items-center">
                  <div>
                    <p className="font-medium text-slate-900">
                      Préstamo de {formatCurrency(prestamo.monto_solicitado)} solicitado el{' '}
                      {convertirFechaHoraLocal(prestamo.fecha_solicitud).fecha}
                    </p>
                    {prestamo.isPaid && (
                      <span className="inline-block mt-2 px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-700">
                        Pagos completados
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => handleVerDetallesPrestamo(prestamo)}
                    className="px-3 py-1 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600"
                  >
                    Ver detalles
                  </button>
                </div>
              ))}
              <div className="flex justify-center mt-6">
                <button onClick={handleBackToMainView} className="px-5 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium">
                  Volver
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Vista: Edición de préstamos del socio (restaurada) */}
      {showEditPrestamosModal && selectedSocioForHistorial && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h3 className="text-xl font-bold text-slate-900 mb-4">
            Editar Préstamos de {selectedSocioForHistorial.nombre} {selectedSocioForHistorial.apellido_paterno}
          </h3>
          {loading && <p className="text-center text-slate-600">Cargando préstamos para edición...</p>}
          {error && !loading && <p className="text-center text-red-500">Error: {error}</p>}
          {!loading && !error && socioPrestamos.length === 0 && (
            <p className="text-center text-slate-600">Este socio no tiene préstamos registrados para editar.</p>
          )}
          {!loading && !error && socioPrestamos.length > 0 && (
            <div className="space-y-4">
              {socioPrestamos.map((prestamo) => (
                <div key={prestamo.id_prestamo} className="p-4 border border-slate-200 rounded-lg flex justify-between items-center">
                  <div>
                    <p className="font-medium text-slate-900">
                      Préstamo de {formatCurrency(prestamo.monto_solicitado)} solicitado el{' '}
                      {convertirFechaHoraLocal(prestamo.fecha_solicitud).fecha}
                    </p>
                    {!prestamo.canDelete && (
                      <p className="text-xs text-slate-500 mt-1">No se puede eliminar (tiene pagos o supera 1 día).</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleDeletePrestamo(prestamo.id_prestamo)}
                    className={`px-3 py-1 bg-red-500 text-white rounded-lg text-sm transition-colors ${
                      prestamo.canDelete ? 'hover:bg-red-600' : 'opacity-50 cursor-not-allowed'
                    }`}
                    disabled={!prestamo.canDelete}
                  >
                    Eliminar
                  </button>
                </div>
              ))}
              <div className="flex justify-center mt-6">
                <button onClick={handleBackToMainView} className="px-5 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium">
                  Volver
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal de Detalles */}
      {showDetailsModal && selectedPrestamo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-6xl w-full">
            <h3 className="text-xl font-bold text-slate-900 mb-4">
              Historial de Pagos del Préstamo {selectedPrestamo.id_prestamo}
            </h3>

            {loading && <p className="text-center text-slate-600">Cargando historial de pagos...</p>}
            {error && !loading && <p className="text-center text-red-500">Error: {error}</p>}

            {!loading && !error && historialPagosPrestamo.length === 0 && (
              <p className="text-center text-slate-600">Aún no hay pagos registrados para este préstamo.</p>
            )}

            {!loading && !error && historialPagosPrestamo.length > 0 && (
              <div className="max-h-[60vh] overflow-y-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">#</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">Fecha</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">Programado</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">Pagado</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">Interés</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">Capital</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">Estatus</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historialPagosPrestamo.map((pago, idx) => {
                      const programada = pago.fecha_programada || '';
                      const fechaShow = pago.fecha_hora_pago
                        ? `${convertirFechaHoraLocal(pago.fecha_hora_pago).fecha} ${convertirFechaHoraLocal(pago.fecha_hora_pago).hora}`
                        : programada;
                      return (
                        <tr key={idx} className="border-b border-slate-100">
                          <td className="py-3 px-4">{pago.numero_pago}</td>
                          <td className="py-3 px-4">{fechaShow}</td>
                          <td className="py-3 px-4">{formatCurrency(pago.monto_pago)}</td>
                          <td className="py-3 px-4">{pago.monto_pagado != null ? formatCurrency(pago.monto_pagado) : '—'}</td>
                          <td className="py-3 px-4">{pago.interes_pagado != null ? formatCurrency(pago.interes_pagado) : '—'}</td>
                          <td className="py-3 px-4">{pago.capital_pagado != null ? formatCurrency(pago.capital_pagado) : '—'}</td>
                          <td className="py-3 px-4">{pago.estatus}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex justify-end mt-6">
              <button onClick={handleBackToListadoPrestamos} className="px-5 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium">
                Volver
              </button>
            </div>
          </div>
        </div>
      )}

      {toastMessage && (
        <div className="fixed bottom-4 right-4 bg-green-500 text-white px-6 py-3 rounded-xl shadow-lg transition-opacity duration-300 z-50">
          {toastMessage}
        </div>
      )}
    </div>
  );
};

export default PrestamosModule;
