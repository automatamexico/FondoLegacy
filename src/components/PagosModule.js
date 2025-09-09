import React, { useState, useEffect } from 'react';

// Si ya tienes esta utilidad y te funciona para timestamps, puedes seguir usándola.
// Aquí creamos formateadores específicos para fecha-only y timestamp.
const MX_TZ = 'America/Mexico_City';

const SUPABASE_URL = 'https://ubfkhtkmlvutwdivmoff.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InViZmtodGttbHZ1dHdkaXZtb2ZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4MTc5NTUsImV4cCI6MjA2NjM5Mzk1NX0.c0iRma-dnlL29OR3ffq34nmZuj_ViApBTMG-6PEX_B4';

const HIST_PAGE_SIZE = 50;  // historial principal
const MODAL_PAGE_SIZE = 10; // modal

const formatCurrency = (value) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(
    Number.isFinite(+value) ? +value : 0
  );

// Devuelve la FECHA local de México en YYYY-MM-DD (ideal para columnas DATE)
const localMXDateISO = (d = new Date()) =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: MX_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d); // YYYY-MM-DD

// Convierte "YYYY-MM-DD" a "DD/MM/YYYY" sin desfasar la zona
const formatDateOnlyMX = (yyyy_mm_dd) => {
  if (!yyyy_mm_dd || !/^\d{4}-\d{2}-\d{2}$/.test(yyyy_mm_dd)) return yyyy_mm_dd || '—';
  const [y, m, d] = yyyy_mm_dd.split('-');
  return `${d}/${m}/${y}`;
};

// Formatea un timestamptz a "DD/MM/YYYY, hh:mm:ss a.m./p.m." en zona MX
const formatTs12MX = (ts) => {
  if (!ts) return '—';
  const dt = new Date(ts);
  return dt.toLocaleString('es-MX', {
    timeZone: MX_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
};

const dateFilterQS = (column, start, end) => {
  if (start && end) return `&and=(${column}.gte.${start},${column}.lte.${end})`;
  if (start) return `&${column}=gte.${start}`;
  if (end) return `&${column}=lte.${end}`;
  return '';
};

const PagosModule = ({ idSocio }) => {
  // Tarjetas
  const [pagosPendientesHoy, setPagosPendientesHoy] = useState(0);
  const [proximosPagos, setProximosPagos] = useState(0);
  const [totalPagosRecibidosHoy, setTotalPagosRecibidosHoy] = useState(0);
  const [montoPagosRecibidosHoy, setMontoPagosRecibidosHoy] = useState(0);
  const [pagosVencidos, setPagosVencidos] = useState(0);

  // Estado general
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  // Listado principal (cuando hay idSocio)
  const [pagosList, setPagosList] = useState([]);
  const [loadingPagosList, setLoadingPagosList] = useState(false);

  // Búsqueda / historial por socio
  const [searchTerm, setSearchTerm] = useState('');
  const [searchSociosResults, setSearchSociosResults] = useState([]);
  const [selectedSocio, setSelectedSocio] = useState(null);
  const [socioHasActiveLoan, setSocioHasActiveLoan] = useState(false);
  const [socioHistorialPagos, setSocioHistorialPagos] = useState([]);
  const [histPage, setHistPage] = useState(1);
  const [histTotal, setHistTotal] = useState(0);
  const [histStartDate, setHistStartDate] = useState('');
  const [histEndDate, setHistEndDate] = useState('');

  // Modal Realizar Pago + scroll
  const [showPayModal, setShowPayModal] = useState(false);
  const [paySearchTerm, setPaySearchTerm] = useState('');
  const [paySearchResults, setPaySearchResults] = useState([]);
  const [paySelectedSocio, setPaySelectedSocio] = useState(null);

  const [payPendientes, setPayPendientes] = useState([]);
  const [payPendPage, setPayPendPage] = useState(1);
  const [payPendTotal, setPayPendTotal] = useState(0);
  const [payPendStart, setPayPendStart] = useState('');
  const [payPendEnd, setPayPendEnd] = useState('');

  const [payPagados, setPayPagados] = useState([]);
  const [payPaidPage, setPayPaidPage] = useState(1);
  const [payPaidTotal, setPayPaidTotal] = useState(0);
  const [payPaidStart, setPayPaidStart] = useState('');
  const [payPaidEnd, setPayPaidEnd] = useState('');

  const [payLoading, setPayLoading] = useState(false);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  useEffect(() => {
    if (idSocio) fetchPagosList(idSocio);
    else setPagosList([]);
  }, [idSocio]);

  const fetchDashboardStats = async () => {
    const today = localMXDateISO(new Date()); // fecha local MX

    const tmr = new Date();
    tmr.setDate(tmr.getDate() + 1);
    const tomorrowStr = localMXDateISO(tmr);

    const dat = new Date();
    dat.setDate(dat.getDate() + 2);
    const dayAfterTomorrowStr = localMXDateISO(dat);

    try {
      setLoading(true);
      // Pendientes hoy
      const r1 = await fetch(
        `${SUPABASE_URL}/rest/v1/pagos_prestamos?fecha_programada=eq.${today}&estatus=eq.pendiente&select=*`,
        { headers: { 'Content-Type': 'application/json', apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}`, Prefer: 'count=exact', Range: '0-0', 'Range-Unit': 'items' } }
      );
      if (!r1.ok) throw new Error('Error al cargar pagos pendientes hoy');
      setPagosPendientesHoy(parseInt(r1.headers.get('content-range')?.split('/')[1] ?? '0', 10));

      // Próximos pagos
      const r2 = await fetch(
        `${SUPABASE_URL}/rest/v1/pagos_prestamos?or=(fecha_programada.eq.${tomorrowStr},fecha_programada.eq.${dayAfterTomorrowStr})&estatus=eq.pendiente&select=count`,
        { headers: { 'Content-Type': 'application/json', apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}`, Prefer: 'count=exact', Range: '0-0', 'Range-Unit': 'items' } }
      );
      if (!r2.ok) throw new Error('Error al cargar próximos pagos');
      setProximosPagos(parseInt(r2.headers.get('content-range')?.split('/')[1] ?? '0', 10));

      // Recibidos hoy (sumar monto_pagado, filtrar por fecha_pago == today)
      const r3 = await fetch(
        `${SUPABASE_URL}/rest/v1/pagos_prestamos?fecha_pago=eq.${today}&select=monto_pagado`,
        { headers: { 'Content-Type': 'application/json', apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } }
      );
      if (!r3.ok) throw new Error('Error al cargar pagos recibidos hoy');
      const data3 = await r3.json();
      setMontoPagosRecibidosHoy(
        data3.reduce((sum, p) => sum + (parseFloat(p.monto_pagado) || 0), 0)
      );
      setTotalPagosRecibidosHoy(data3.length);

      // Vencidos
      const r4 = await fetch(
        `${SUPABASE_URL}/rest/v1/pagos_prestamos?fecha_programada=lt.${today}&estatus=eq.pendiente&select=count`,
        { headers: { 'Content-Type': 'application/json', apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}`, Prefer: 'count=exact', Range: '0-0', 'Range-Unit': 'items' } }
      );
      if (!r4.ok) throw new Error('Error al cargar pagos vencidos');
      setPagosVencidos(parseInt(r4.headers.get('content-range')?.split('/')[1] ?? '0', 10));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchPagosList = async (socioId) => {
    setLoadingPagosList(true);
    setError(null);
    try {
      const r = await fetch(
        `${SUPABASE_URL}/rest/v1/pagos_prestamos?` +
          `id_socio=eq.${socioId}&select=id_pago,id_prestamo,numero_pago,monto_pago,fecha_programada,estatus,nota,monto_pagado,fecha_pago,fecha_pago_ts`,
        { headers: { 'Content-Type': 'application/json', apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } }
      );
      if (!r.ok) {
        const e = await r.json();
        throw new Error(`Error al cargar pagos: ${r.statusText} - ${e.message || 'Error desconocido'}`);
      }
      setPagosList(await r.json());
    } catch (err) {
      setError(err.message);
      setPagosList([]);
    } finally {
      setLoadingPagosList(false);
    }
  };

  // ==== Búsqueda / historial por socio ====
  const handleSearchSocio = async (e) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);
    if (!term) return setSearchSociosResults([]);

    try {
      const r = await fetch(
        `${SUPABASE_URL}/rest/v1/socios?select=id_socio,nombre,apellido_paterno,apellido_materno`,
        { headers: { 'Content-Type': 'application/json', apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } }
      );
      if (!r.ok) throw new Error('Error al buscar socios');
      const all = await r.json();
      setSearchSociosResults(
        all.filter((s) =>
          s.id_socio.toString().includes(term) ||
          `${s.nombre} ${s.apellido_paterno} ${s.apellido_materno}`.toLowerCase().includes(term)
        )
      );
    } catch (err) {
      setSearchSociosResults([]);
      setError(err.message);
    }
  };

  const loadHistorialSocio = async (socio, page = 1, start = '', end = '') => {
    try {
      // ¿Tiene préstamo activo?
      const r0 = await fetch(
        `${SUPABASE_URL}/rest/v1/prestamos?id_socio=eq.${socio.id_socio}&estatus=eq.activo&select=id_prestamo`,
        { headers: { 'Content-Type': 'application/json', apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } }
      );
      if (!r0.ok) throw new Error('Error al verificar préstamos activos');
      const activos = await r0.json();
      if (activos.length === 0) {
        setSocioHasActiveLoan(false);
        setSocioHistorialPagos([]);
        setHistTotal(0);
        return;
      }
      setSocioHasActiveLoan(true);

      const offset = (page - 1) * HIST_PAGE_SIZE;
      const dateQS = dateFilterQS('fecha_pago', start, end);
      const r = await fetch(
        `${SUPABASE_URL}/rest/v1/pagos_prestamos?` +
          `id_socio=eq.${socio.id_socio}&estatus=eq.pagado` +
          `${dateQS}` +
          `&order=fecha_pago_ts.desc,nullslast&order=fecha_pago.desc&limit=${HIST_PAGE_SIZE}&offset=${offset}` +
          `&select=id_pago,id_prestamo,monto_pagado,fecha_pago,fecha_pago_ts,numero_pago,nota`,
        { headers: { 'Content-Type': 'application/json', apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}`, Prefer: 'count=exact' } }
      );
      if (!r.ok) throw new Error('Error al cargar historial');
      const total = parseInt(r.headers.get('content-range')?.split('/')[1] ?? '0', 10);
      setHistTotal(total);
      setSocioHistorialPagos(await r.json());
    } catch (err) {
      setError(err.message);
      setSocioHistorialPagos([]);
      setHistTotal(0);
      setSocioHasActiveLoan(false);
    }
  };

  const handleSelectSocio = async (socio) => {
    setSelectedSocio(socio);
    setSearchTerm(`ID: ${socio.id_socio} - ${socio.nombre} ${socio.apellido_paterno} ${socio.apellido_materno}`);
    setSearchSociosResults([]);
    setHistPage(1);
    setLoading(true);
    await loadHistorialSocio(socio, 1, histStartDate, histEndDate);
    setLoading(false);
  };

  const applyHistFilters = async () => {
    if (!selectedSocio) return;
    setHistPage(1);
    setLoading(true);
    await loadHistorialSocio(selectedSocio, 1, histStartDate, histEndDate);
    setLoading(false);
  };

  const handleHistPageChange = async (nextPage) => {
    if (!selectedSocio) return;
    setHistPage(nextPage);
    setLoading(true);
    await loadHistorialSocio(selectedSocio, nextPage, histStartDate, histEndDate);
    setLoading(false);
  };

  const handleClear = () => {
    setSelectedSocio(null);
    setSocioHistorialPagos([]);
    setSocioHasActiveLoan(false);
    setSearchTerm('');
    setSearchSociosResults([]);
    setHistPage(1);
    setHistTotal(0);
    setHistStartDate('');
    setHistEndDate('');
    setError(null);
  };

  // ==== Modal (scroll + lógica) ====
  const openPayModal = () => {
    setShowPayModal(true);
    setPaySearchTerm('');
    setPaySearchResults([]);
    setPaySelectedSocio(null);

    setPayPendPage(1); setPayPendTotal(0); setPayPendStart(''); setPayPendEnd(''); setPayPendientes([]);
    setPayPaidPage(1); setPayPaidTotal(0); setPayPaidStart(''); setPayPaidEnd(''); setPayPagados([]);
  };
  const closePayModal = () => setShowPayModal(false);

  const handlePaySearch = async (e) => {
    const term = e.target.value.toLowerCase();
    setPaySearchTerm(term);
    if (!term) return setPaySearchResults([]);

    try {
      const r = await fetch(
        `${SUPABASE_URL}/rest/v1/socios?select=id_socio,nombre,apellido_paterno,apellido_materno`,
        { headers: { 'Content-Type': 'application/json', apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } }
      );
      if (!r.ok) throw new Error('Error al buscar socios');
      const all = await r.json();
      setPaySearchResults(
        all.filter((s) =>
          s.id_socio.toString().includes(term) ||
          `${s.nombre} ${s.apellido_paterno} ${s.apellido_materno}`.toLowerCase().includes(term)
        )
      );
    } catch (err) {
      setPaySearchResults([]);
      setError(err.message);
    }
  };

  const refreshPayLists = async (id_socio,
    pendPage = 1, paidPage = 1,
    pendStart = '', pendEnd = '',
    paidStart = '', paidEnd = ''
  ) => {
    setPayLoading(true);
    try {
      // Pendientes (incluye parciales)
      const pendOffset = (pendPage - 1) * MODAL_PAGE_SIZE;
      const pendDateQS = dateFilterQS('fecha_programada', pendStart, pendEnd);
      const rP = await fetch(
        `${SUPABASE_URL}/rest/v1/pagos_prestamos?` +
          `id_socio=eq.${id_socio}&estatus=in.(pendiente,parcial)` +
          `&order=fecha_programada.asc&limit=${MODAL_PAGE_SIZE}&offset=${pendOffset}` +
          `${pendDateQS}` +
          `&select=id_pago,id_prestamo,numero_pago,monto_pago,fecha_programada,monto_pagado,estatus,nota`,
        { headers: { 'Content-Type': 'application/json', apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}`, Prefer: 'count=exact' } }
      );
      if (!rP.ok) throw new Error('Error al cargar pagos pendientes');
      setPayPendientes(await rP.json());
      setPayPendTotal(parseInt(rP.headers.get('content-range')?.split('/')[1] ?? '0', 10));

      // Realizados
      const paidOffset = (paidPage - 1) * MODAL_PAGE_SIZE;
      const paidDateQS = dateFilterQS('fecha_pago', paidStart, paidEnd);
      const rR = await fetch(
        `${SUPABASE_URL}/rest/v1/pagos_prestamos?` +
          `id_socio=eq.${id_socio}&estatus=eq.pagado` +
          `${paidDateQS}` +
          `&order=fecha_pago_ts.desc,nullslast&order=fecha_pago.desc&limit=${MODAL_PAGE_SIZE}&offset=${paidOffset}` +
          `&select=id_pago,id_prestamo,numero_pago,monto_pagado,fecha_pago,fecha_pago_ts,nota`,
        { headers: { 'Content-Type': 'application/json', apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}`, Prefer: 'count=exact' } }
      );
      if (!rR.ok) throw new Error('Error al cargar pagos realizados');
      setPayPagados(await rR.json());
      setPayPaidTotal(parseInt(rR.headers.get('content-range')?.split('/')[1] ?? '0', 10));
    } catch (err) {
      setError(err.message);
      setPayPendientes([]); setPayPagados([]); setPayPendTotal(0); setPayPaidTotal(0);
    } finally {
      setPayLoading(false);
    }
  };

  const handlePaySelectSocio = async (socio) => {
    setPaySelectedSocio(socio);
    setPaySearchTerm(`ID: ${socio.id_socio} - ${socio.nombre} ${socio.apellido_paterno} ${socio.apellido_materno}`);
    setPaySearchResults([]);
    setPayPendPage(1); setPayPaidPage(1);
    await refreshPayLists(socio.id_socio, 1, 1, payPendStart, payPendEnd, payPaidStart, payPaidEnd);
  };

  // ====== Realizar pago (con hora correcta y formato 12h) ======
  const handleRealizarPago = async (pago) => {
    const yaPagado = parseFloat(pago.monto_pagado || 0);
    const programado = parseFloat(pago.monto_pago || 0);
    const restante = Math.max(programado - yaPagado, 0);

    const entrada = window.prompt(
      `Ingresa el monto a pagar (restante: ${formatCurrency(restante)}).\n` +
        `Si cubres todo el restante, el pago queda como PAGADO.`,
      restante.toFixed(2)
    );
    if (entrada === null) return;
    const montoIngresado = parseFloat(entrada);
    if (!Number.isFinite(montoIngresado) || montoIngresado <= 0) return alert('Monto inválido.');
    if (montoIngresado > restante + 0.0001) return alert('El monto excede el restante.');

    const nuevoAcumulado = yaPagado + montoIngresado;
    const liquidado = nuevoAcumulado >= programado - 0.0001;

    // Nota si es parcial
    let notaFinal = pago.nota || '';
    if (!liquidado) {
      const notaParcial = window.prompt('Agregar nota para este PAGO PARCIAL (opcional):', '') || '';
      if (notaParcial.trim()) {
        notaFinal = (notaFinal ? `${notaFinal} | ` : '') + `Parcial: ${notaParcial.trim()}`;
      } else {
        notaFinal = (notaFinal ? `${notaFinal} | ` : '') + 'Parcial';
      }
    }

    const confirmar = window.confirm(
      `¿Deseas registrar el pago por ${formatCurrency(montoIngresado)}${!liquidado ? ' (PARCIAL)' : ''}?`
    );
    if (!confirmar) return;

    try {
      setPayLoading(true);

      // Guardamos:
      // - fecha_pago (DATE) como fecha local MX
      // - fecha_pago_ts (TIMESTAMPTZ) como timestamp exacto (UTC interno, se mostrará en MX)
      const now = new Date();
      const fechaPagoDate = localMXDateISO(now);     // YYYY-MM-DD local MX
      const fechaPagoTs = now.toISOString();         // ISO UTC (timestamptz)

      const payload = {
        estatus: liquidado ? 'pagado' : 'parcial',
        fecha_pago: fechaPagoDate,
        fecha_pago_ts: fechaPagoTs,
        monto_pagado: nuevoAcumulado,
        ...( !liquidado ? { nota: notaFinal } : {} ),
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
          body: JSON.stringify(payload),
        }
      );
      if (!resp.ok) {
        const e = await resp.json();
        throw new Error(`No se pudo registrar el pago: ${resp.statusText} - ${e.message || 'Error desconocido'}`);
      }

      // Refrescos
      if (paySelectedSocio) {
        await refreshPayLists(
          paySelectedSocio.id_socio,
          payPendPage,
          payPaidPage,
          payPendStart,
          payPendEnd,
          payPaidStart,
          payPaidEnd
        );
      }
      await fetchDashboardStats();
      if (idSocio && paySelectedSocio && idSocio === paySelectedSocio.id_socio) {
        await fetchPagosList(idSocio);
      }
      if (selectedSocio && paySelectedSocio && selectedSocio.id_socio === paySelectedSocio.id_socio) {
        await loadHistorialSocio(selectedSocio, histPage, histStartDate, histEndDate);
      }

      setToastMessage('Pago registrado correctamente');
      setTimeout(() => setToastMessage(''), 2500);
    } catch (err) {
      setError(err.message);
    } finally {
      setPayLoading(false);
    }
  };
  // ========================================

  // Editar nota en la tabla principal
  const handleEditarNota = async (pagoRow) => {
    const notaInicial = pagoRow.nota || '';
    const nuevaNota = window.prompt('Editar nota del pago:', notaInicial);
    if (nuevaNota === null) return;

    try {
      const resp = await fetch(
        `${SUPABASE_URL}/rest/v1/pagos_prestamos?id_pago=eq.${pagoRow.id_pago}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
            Prefer: 'return=representation',
          },
          body: JSON.stringify({ nota: nuevaNota }),
        }
      );
      if (!resp.ok) {
        const e = await resp.json();
        throw new Error(`No se pudo actualizar la nota: ${resp.statusText} - ${e.message || 'Error desconocido'}`);
      }

      setPagosList((prev) => prev.map((p) => (p.id_pago === pagoRow.id_pago ? { ...p, nota: nuevaNota } : p)));
      setToastMessage('Nota actualizada');
      setTimeout(() => setToastMessage(''), 2000);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header + botón */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Pagos</h2>
          <p className="text-slate-600">Indicadores y gestión de pagos</p>
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

        {/* Próximos pagos */}
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

        {/* Total recibidos hoy */}
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
              <p className="text-sm text-slate-600">{totalPagosRecibidosHoy} pagos confirmados hoy</p>
            </div>
          </div>
        </div>

        {/* Vencidos */}
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

      {/* ===== Listado principal (si hay idSocio) ===== */}
      {idSocio && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h3 className="text-xl font-bold text-slate-900 mb-4">Pagos programados del socio</h3>

          {loadingPagosList && <p className="text-center text-slate-600">Cargando pagos…</p>}
          {error && !loadingPagosList && <p className="text-center text-red-500">Error: {error}</p>}

          {!loadingPagosList && !error && pagosList.length === 0 && (
            <p className="text-center text-slate-600">No hay pagos programados.</p>
          )}

          {!loadingPagosList && !error && pagosList.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">ID Pago</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">ID Préstamo</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Nº Pago</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Monto Programado</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Fecha Programada</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Estatus</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Nota</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {pagosList.map((pago) => (
                    <tr key={pago.id_pago} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-4 px-4 text-slate-700">{pago.id_pago}</td>
                      <td className="py-4 px-4 text-slate-700">{pago.id_prestamo}</td>
                      <td className="py-4 px-4 text-slate-700">{pago.numero_pago}</td>
                      <td className="py-4 px-4 font-bold text-slate-900">{formatCurrency(pago.monto_pago)}</td>
                      <td className="py-4 px-4 text-slate-700">{formatDateOnlyMX(pago.fecha_programada)}</td>
                      <td className="py-4 px-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            pago.estatus === 'pendiente'
                              ? 'bg-yellow-100 text-yellow-700'
                              : pago.estatus === 'pagado'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-orange-100 text-orange-700'
                          }`}
                        >
                          {pago.estatus}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-slate-600 text-sm">{pago.nota || '—'}</td>
                      <td className="py-4 px-4">
                        <button
                          onClick={() => handleEditarNota(pago)}
                          className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Editar nota"
                        >
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                              d="M15.232 5.232l3.536 3.536M4 20h4.586a1 1 0 00.707-.293l9.9-9.9a2 2 0 000-2.828l-1.172-1.172a2 2 0 00-2.828 0l-9.9 9.9A1 1 0 004 15.414V20z" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ===== Buscador por socio + filtros de historial ===== */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h3 className="text-xl font-bold text-slate-900 mb-4">Buscar historial de pagos por socio</h3>

        <div className="flex flex-col md:flex-row gap-3">
          <input
            type="text"
            placeholder="Buscar por ID de Socio o Nombre Completo..."
            value={searchTerm}
            onChange={handleSearchSocio}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <div className="flex gap-3">
            <input
              type="date"
              value={histStartDate}
              onChange={(e) => setHistStartDate(e.target.value)}
              className="px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl"
              title="Desde (fecha de pago)"
            />
            <input
              type="date"
              value={histEndDate}
              onChange={(e) => setHistEndDate(e.target.value)}
              className="px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl"
              title="Hasta (fecha de pago)"
            />
            <button
              onClick={applyHistFilters}
              className="px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700"
              disabled={!selectedSocio}
            >
              Aplicar
            </button>
            {selectedSocio && (
              <button
                onClick={handleClear}
                className="px-4 py-3 bg-slate-200 text-slate-800 rounded-xl hover:bg-slate-300"
              >
                Limpiar
              </button>
            )}
          </div>
        </div>

        {searchTerm && searchSociosResults.length > 0 && (
          <div className="mt-4 space-y-2">
            {searchSociosResults.map((socio) => (
              <div key={socio.id_socio} className="flex justify-between items-center p-3 bg-slate-100 rounded-lg">
                <span className="text-slate-800">ID: {socio.id_socio} - {socio.nombre} {socio.apellido_paterno} {socio.apellido_materno}</span>
                <button onClick={() => handleSelectSocio(socio)} className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
                  Ver historial
                </button>
              </div>
            ))}
          </div>
        )}

        {searchTerm && searchSociosResults.length === 0 && (
          <p className="text-center text-slate-600 mt-4">No se encontraron socios.</p>
        )}
      </div>

      {/* Historial del socio seleccionado */}
      {selectedSocio && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h3 className="text-xl font-bold text-slate-900 mb-4">
            Historial de pagos de {selectedSocio.nombre} {selectedSocio.apellido_paterno}
          </h3>

          {loading && <p className="text-center text-slate-600">Cargando historial...</p>}
          {error && !loading && <p className="text-center text-red-500">Error: {error}</p>}

          {!loading && !error && !socioHasActiveLoan && (
            <p className="text-center text-red-500 text-lg font-semibold mb-2">Este socio no cuenta con ningún préstamo activo.</p>
          )}

          {!loading && !error && socioHasActiveLoan && (
            <>
              {socioHistorialPagos.length === 0 ? (
                <p className="text-center text-slate-600">Este socio no tiene pagos registrados.</p>
              ) : (
                <>
                  <p className="text-sm text-slate-500 mb-2">
                    Mostrando {socioHistorialPagos.length} de máximo {HIST_PAGE_SIZE} registros (más reciente → antiguo).
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-200">
                          <th className="text-left py-3 px-4 font-semibold text-slate-700">ID Préstamo</th>
                          <th className="text-left py-3 px-4 font-semibold text-slate-700">Monto Pagado</th>
                          <th className="text-left py-3 px-4 font-semibold text-slate-700">Fecha y Hora (MX)</th>
                          <th className="text-left py-3 px-4 font-semibold text-slate-700">Nº Pago</th>
                          <th className="text-left py-3 px-4 font-semibold text-slate-700">Nota</th>
                        </tr>
                      </thead>
                      <tbody>
                        {socioHistorialPagos.map((pago) => (
                          <tr key={pago.id_pago} className="border-b border-slate-100 hover:bg-slate-50">
                            <td className="py-4 px-4 text-slate-700">{pago.id_prestamo}</td>
                            <td className="py-4 px-4 font-bold text-slate-900">{formatCurrency(pago.monto_pagado)}</td>
                            <td className="py-4 px-4 text-slate-700">
                              {/* Si hay timestamp, formateamos 12h; si no, mostramos la fecha-only */}
                              {pago.fecha_pago_ts ? formatTs12MX(pago.fecha_pago_ts) : formatDateOnlyMX(pago.fecha_pago)}
                            </td>
                            <td className="py-4 px-4 text-slate-700">{pago.numero_pago}</td>
                            <td className="py-4 px-4 text-slate-600 text-sm">{pago.nota || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex items-center justify-center gap-3 mt-4">
                    <button
                      onClick={() => handleHistPageChange(Math.max(1, histPage - 1))}
                      disabled={histPage <= 1}
                      className={`px-3 py-2 rounded-lg border ${histPage <= 1 ? 'text-slate-400 border-slate-200' : 'text-slate-700 border-slate-300 hover:bg-slate-50'}`}
                    >
                      Anterior
                    </button>
                    <span className="text-sm text-slate-600">
                      Página {histPage} de {Math.max(1, Math.ceil(histTotal / HIST_PAGE_SIZE))}
                    </span>
                    <button
                      onClick={() => handleHistPageChange(Math.min(Math.ceil(histTotal / HIST_PAGE_SIZE), histPage + 1))}
                      disabled={histPage >= Math.ceil(histTotal / HIST_PAGE_SIZE)}
                      className={`px-3 py-2 rounded-lg border ${histPage >= Math.ceil(histTotal / HIST_PAGE_SIZE) ? 'text-slate-400 border-slate-200' : 'text-slate-700 border-slate-300 hover:bg-slate-50'}`}
                    >
                      Siguiente
                    </button>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      )}

      {/* ===== MODAL Realizar Pago (con SCROLL real) ===== */}
      {showPayModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-5xl rounded-2xl shadow-xl max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-xl font-bold text-slate-900">Realizar pago</h3>
              <button onClick={closePayModal} className="px-3 py-1 rounded-md bg-slate-100 hover:bg-slate-200">
                Cerrar
              </button>
            </div>

            {/* Body con altura fija + scroll */}
            <div
              className="p-6 h-[75vh] overflow-y-auto overscroll-contain"
              style={{ WebkitOverflowScrolling: 'touch' }}
            >
              <input
                type="text"
                placeholder="Buscar socio por ID o Nombre completo..."
                value={paySearchTerm}
                onChange={handlePaySearch}
                className="w-full mb-4 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              {paySearchTerm && paySearchResults.length > 0 && (
                <div className="space-y-2 mb-4">
                  {paySearchResults.map((s) => (
                    <div key={s.id_socio} className="flex justify-between items-center p-3 bg-slate-100 rounded-lg">
                      <span className="text-slate-800">
                        ID: {s.id_socio} - {s.nombre} {s.apellido_paterno} {s.apellido_materno}
                      </span>
                      <button
                        onClick={() => handlePaySelectSocio(s)}
                        className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                      >
                        Seleccionar
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {paySelectedSocio && (
                <>
                  <p className="text-slate-700 font-medium mb-4">
                    Socio: ID {paySelectedSocio.id_socio} — {paySelectedSocio.nombre} {paySelectedSocio.apellido_paterno} {paySelectedSocio.apellido_materno}
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Pendientes */}
                    <div className="border border-slate-200 rounded-xl p-4">
                      <div className="flex flex-wrap gap-2 items-center mb-3">
                        <h4 className="font-semibold text-slate-900 mr-auto">Pendientes</h4>
                        <input type="date" value={payPendStart} onChange={(e) => setPayPendStart(e.target.value)} className="px-2 py-2 bg-slate-50 border border-slate-200 rounded-lg" />
                        <input type="date" value={payPendEnd} onChange={(e) => setPayPendEnd(e.target.value)} className="px-2 py-2 bg-slate-50 border border-slate-200 rounded-lg" />
                        <button
                          onClick={() =>
                            refreshPayLists(
                              paySelectedSocio.id_socio, 1, payPaidPage, payPendStart, payPendEnd, payPaidStart, payPaidEnd
                            ).then(() => setPayPendPage(1))
                          }
                          className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                        >
                          Aplicar
                        </button>
                      </div>

                      {payLoading ? (
                        <p className="text-slate-600">Cargando pagos...</p>
                      ) : payPendientes.length === 0 ? (
                        <p className="text-slate-500 text-sm">No hay pagos pendientes.</p>
                      ) : (
                        <>
                          <ul className="space-y-2">
                            {payPendientes.map((p) => {
                              const yaPagado = parseFloat(p.monto_pagado || 0);
                              const restante = Math.max((parseFloat(p.monto_pago) || 0) - yaPagado, 0);
                              return (
                                <li key={p.id_pago} className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                                  <div>
                                    <p className="font-medium text-slate-800">
                                      Nº {p.numero_pago} — {formatCurrency(p.monto_pago)}{' '}
                                      {p.estatus === 'parcial' && (
                                        <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">Parcial</span>
                                      )}
                                    </p>
                                    <p className="text-xs text-slate-500">
                                      Programado: {formatDateOnlyMX(p.fecha_programada)} — Préstamo {p.id_prestamo} — Restante: <span className="font-semibold">{formatCurrency(restante)}</span>
                                    </p>
                                    {p.nota && <p className="text-xs text-slate-500 mt-0.5">Nota: {p.nota}</p>}
                                  </div>
                                  <button
                                    onClick={() => handleRealizarPago(p)}
                                    className="px-3 py-1.5 bg-green-600 text-white rounded-md text-sm hover:bg-green-700"
                                  >
                                    Pagar
                                  </button>
                                </li>
                              );
                            })}
                          </ul>

                          <div className="flex items-center justify-center gap-2 mt-3">
                            <button
                              onClick={() => {
                                const newPage = Math.max(1, payPendPage - 1);
                                setPayPendPage(newPage);
                                refreshPayLists(
                                  paySelectedSocio.id_socio, newPage, payPaidPage, payPendStart, payPendEnd, payPaidStart, payPaidEnd
                                );
                              }}
                              disabled={payPendPage <= 1}
                              className={`px-2 py-1 rounded border ${payPendPage <= 1 ? 'text-slate-400 border-slate-200' : 'text-slate-700 border-slate-300 hover:bg-slate-50'}`}
                            >
                              ◀
                            </button>
                            <span className="text-xs text-slate-600">
                              {payPendPage} / {Math.max(1, Math.ceil(payPendTotal / MODAL_PAGE_SIZE))}
                            </span>
                            <button
                              onClick={() => {
                                const newPage = Math.min(Math.ceil(payPendTotal / MODAL_PAGE_SIZE), payPendPage + 1);
                                setPayPendPage(newPage);
                                refreshPayLists(
                                  paySelectedSocio.id_socio, newPage, payPaidPage, payPendStart, payPendEnd, payPaidStart, payPaidEnd
                                );
                              }}
                              disabled={payPendPage >= Math.ceil(payPendTotal / MODAL_PAGE_SIZE)}
                              className={`px-2 py-1 rounded border ${payPendPage >= Math.ceil(payPendTotal / MODAL_PAGE_SIZE) ? 'text-slate-400 border-slate-200' : 'text-slate-700 border-slate-300 hover:bg-slate-50'}`}
                            >
                              ▶
                            </button>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Realizados */}
                    <div className="border border-slate-200 rounded-xl p-4">
                      <div className="flex flex-wrap gap-2 items-center mb-3">
                        <h4 className="font-semibold text-slate-900 mr-auto">Realizados</h4>
                        <input type="date" value={payPaidStart} onChange={(e) => setPayPaidStart(e.target.value)} className="px-2 py-2 bg-slate-50 border border-slate-200 rounded-lg" />
                        <input type="date" value={payPaidEnd} onChange={(e) => setPayPaidEnd(e.target.value)} className="px-2 py-2 bg-slate-50 border border-slate-200 rounded-lg" />
                        <button
                          onClick={() =>
                            refreshPayLists(
                              paySelectedSocio.id_socio, payPendPage, 1, payPendStart, payPendEnd, payPaidStart, payPaidEnd
                            ).then(() => setPayPaidPage(1))
                          }
                          className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                        >
                          Aplicar
                        </button>
                      </div>

                      {payLoading ? (
                        <p className="text-slate-600">Cargando pagos...</p>
                      ) : payPagados.length === 0 ? (
                        <p className="text-slate-500 text-sm">Aún no hay pagos registrados.</p>
                      ) : (
                        <>
                          <ul className="space-y-2">
                            {payPagados.map((p) => (
                              <li key={p.id_pago} className="bg-white border border-slate-200 rounded-lg px-3 py-2">
                                <p className="font-medium text-slate-800">
                                  Nº {p.numero_pago} — {formatCurrency(p.monto_pagado)}
                                </p>
                                <p className="text-xs text-slate-500">
                                  {/* Mostrar FECHA+HORA local si hay timestamp */}
                                  {p.fecha_pago_ts ? formatTs12MX(p.fecha_pago_ts) : formatDateOnlyMX(p.fecha_pago)} — Préstamo {p.id_prestamo}
                                </p>
                                {p.nota && <p className="text-xs text-slate-500 mt-0.5">Nota: {p.nota}</p>}
                              </li>
                            ))}
                          </ul>

                          <div className="flex items-center justify-center gap-2 mt-3">
                            <button
                              onClick={() => {
                                const newPage = Math.max(1, payPaidPage - 1);
                                setPayPaidPage(newPage);
                                refreshPayLists(
                                  paySelectedSocio.id_socio, payPendPage, newPage, payPendStart, payPendEnd, payPaidStart, payPaidEnd
                                );
                              }}
                              disabled={payPaidPage <= 1}
                              className={`px-2 py-1 rounded border ${payPaidPage <= 1 ? 'text-slate-400 border-slate-200' : 'text-slate-700 border-slate-300 hover:bg-slate-50'}`}
                            >
                              ◀
                            </button>
                            <span className="text-xs text-slate-600">
                              {payPaidPage} / {Math.max(1, Math.ceil(payPaidTotal / MODAL_PAGE_SIZE))}
                            </span>
                            <button
                              onClick={() => {
                                const newPage = Math.min(Math.ceil(payPaidTotal / MODAL_PAGE_SIZE), payPaidPage + 1);
                                setPayPaidPage(newPage);
                                refreshPayLists(
                                  paySelectedSocio.id_socio, payPendPage, newPage, payPendStart, payPendEnd, payPaidStart, payPaidEnd
                                );
                              }}
                              disabled={payPaidPage >= Math.ceil(payPaidTotal / MODAL_PAGE_SIZE)}
                              className={`px-2 py-1 rounded border ${payPaidPage >= Math.ceil(payPaidTotal / MODAL_PAGE_SIZE) ? 'text-slate-400 border-slate-200' : 'text-slate-700 border-slate-300 hover:bg-slate-50'}`}
                            >
                              ▶
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {toastMessage && (
        <div className="fixed bottom-4 right-4 bg-green-600 text-white px-5 py-3 rounded-xl shadow-lg z-50">
          {toastMessage}
        </div>
      )}
    </div>
  );
};

export default PagosModule;
