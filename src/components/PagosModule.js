import React, { useEffect, useState } from 'react';
import { convertirFechaHoraLocal } from '../utils/dateFormatter'; // lo conservamos por compat, pero abajo usamos formateadores propios

const SUPABASE_URL = 'https://ubfkhtkmlvutwdivmoff.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InViZmtodGttbHZ1dHdkaXZtb2ZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4MTc5NTUsImV4cCI6MjA2NjM5Mzk1NX0.c0iRma-dnlL29OR3ffq34nmZuj_ViApBTMG-6PEX_B4';

const PAGE_SIZE = 50;
const MODAL_PAGE_SIZE = 10;

// --------- helpers de formato locales ---------
const toLocalYMD = (d = new Date()) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};
const fmtMoney = (v) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(Number(v || 0));
const fmtYMDtoDMY = (ymd) => {
  if (!ymd) return '';
  const [y, m, d] = String(ymd).split('-');
  if (!y || !m || !d) return ymd;
  return `${d}/${m}/${y}`;
};
const fmtTS12h = (ts) => {
  if (!ts) return '';
  try {
    const d = new Date(ts);
    return d.toLocaleString('es-MX', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return String(ts);
  }
};

// =========================================================
const PagosModule = ({ idSocio }) => {
  // Tarjetas
  const [pagosPendientesHoy, setPagosPendientesHoy] = useState(0);
  const [proximosPagos, setProximosPagos] = useState(0);
  const [totalPagosRecibidosHoy, setTotalPagosRecibidosHoy] = useState(0);
  const [montoPagosRecibidosHoy, setMontoPagosRecibidosHoy] = useState(0);
  const [pagosVencidos, setPagosVencidos] = useState(0);

  // Historial principal
  const [searchTerm, setSearchTerm] = useState('');
  const [searchSociosResults, setSearchSociosResults] = useState([]);
  const [selectedSocio, setSelectedSocio] = useState(null);
  const [historial, setHistorial] = useState([]);
  const [histPage, setHistPage] = useState(1);
  const [histTotal, setHistTotal] = useState(0);
  const [histStart, setHistStart] = useState('');
  const [histEnd, setHistEnd] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Modal realizar pago
  const [showPayModal, setShowPayModal] = useState(false);
  const [modalSocioTerm, setModalSocioTerm] = useState('');
  const [modalSocioResults, setModalSocioResults] = useState([]);
  const [modalSocio, setModalSocio] = useState(null);

  const [payLoading, setPayLoading] = useState(false);
  const [payPendientes, setPayPendientes] = useState([]);
  const [payPagados, setPayPagados] = useState([]);
  const [payPendPage, setPayPendPage] = useState(1);
  const [payPaidPage, setPayPaidPage] = useState(1);
  const [payPendTotal, setPayPendTotal] = useState(0);
  const [payPaidTotal, setPayPaidTotal] = useState(0);

  const [pendStart, setPendStart] = useState('');
  const [pendEnd, setPendEnd] = useState('');
  const [paidStart, setPaidStart] = useState('');
  const [paidEnd, setPaidEnd] = useState('');

  // Sub-modal de confirmación de pago
  const [showDoPay, setShowDoPay] = useState(false);
  const [pagoTarget, setPagoTarget] = useState(null);
  const [payAmount, setPayAmount] = useState('');
  const [payNote, setPayNote] = useState('');

  // Nota inline
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [noteDraft, setNoteDraft] = useState('');

  // ----------------- Tarjetas dashboard -----------------
  useEffect(() => {
    const loadCards = async () => {
      const today = toLocalYMD();
      const d1 = new Date(); d1.setDate(d1.getDate() + 1);
      const d2 = new Date(); d2.setDate(d2.getDate() + 2);
      const tomorrow = toLocalYMD(d1);
      const dayAfter = toLocalYMD(d2);

      try {
        // Pendientes hoy
        const r1 = await fetch(
          `${SUPABASE_URL}/rest/v1/pagos_prestamos?fecha_programada=eq.${today}&estatus=eq.pendiente&select=id_pago`,
          {
            headers: {
              'Content-Type': 'application/json',
              apikey: SUPABASE_ANON_KEY,
              Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
              Prefer: 'count=exact',
              'Range': '0-0',
              'Range-Unit': 'items',
            },
          }
        );
        setPagosPendientesHoy(parseInt(r1.headers.get('content-range')?.split('/')[1] ?? '0', 10));

        // Próximos pagos
        const r2 = await fetch(
          `${SUPABASE_URL}/rest/v1/pagos_prestamos?or=(fecha_programada.eq.${tomorrow},fecha_programada.eq.${dayAfter})&estatus=eq.pendiente&select=id_pago`,
          {
            headers: {
              'Content-Type': 'application/json',
              apikey: SUPABASE_ANON_KEY,
              Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
              Prefer: 'count=exact',
              'Range': '0-0',
              'Range-Unit': 'items',
            },
          }
        );
        setProximosPagos(parseInt(r2.headers.get('content-range')?.split('/')[1] ?? '0', 10));

        // Pagos de hoy (monto+conteo). OJO: fecha_pago DATE (no hora)
        const r3 = await fetch(
          `${SUPABASE_URL}/rest/v1/pagos_prestamos?fecha_pago=eq.${today}&estatus=eq.pagado&select=monto_pagado`,
          { headers: { 'Content-Type': 'application/json', apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } }
        );
        const pagosHoy = await r3.json();
        setTotalPagosRecibidosHoy(pagosHoy.length);
        setMontoPagosRecibidosHoy(pagosHoy.reduce((s, p) => s + Number(p.monto_pagado || 0), 0));

        // Vencidos
        const r4 = await fetch(
          `${SUPABASE_URL}/rest/v1/pagos_prestamos?fecha_programada=lt.${today}&estatus=eq.pendiente&select=id_pago`,
          {
            headers: {
              'Content-Type': 'application/json',
              apikey: SUPABASE_ANON_KEY,
              Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
              Prefer: 'count=exact',
              'Range': '0-0',
              'Range-Unit': 'items',
            },
          }
        );
        setPagosVencidos(parseInt(r4.headers.get('content-range')?.split('/')[1] ?? '0', 10));
      } catch (err) {
        console.error(err);
      }
    };
    loadCards();
  }, []);

  // ----------------- Búsqueda socio (principal) -----------------
  const handleSearchSocio = async (e) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);
    if (!term) return setSearchSociosResults([]);

    try {
      const r = await fetch(
        `${SUPABASE_URL}/rest/v1/socios?select=id_socio,nombre,apellido_paterno,apellido_materno`,
        { headers: { 'Content-Type': 'application/json', apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } }
      );
      const data = await r.json();
      const filtered = data.filter(
        (s) =>
          String(s.id_socio).includes(term) ||
          `${s.nombre} ${s.apellido_paterno} ${s.apellido_materno}`.toLowerCase().includes(term)
      );
      setSearchSociosResults(filtered);
    } catch {
      setSearchSociosResults([]);
    }
  };

  // ----------------- Historial por socio -----------------
  const loadHistorial = async (page = 1, start = '', end = '') => {
    if (!selectedSocio) return;
    setLoading(true);
    setError(null);
    try {
      const offset = (page - 1) * PAGE_SIZE;
      const dateRangeQS = () => {
        if (start && end) return `&and=(fecha_pago.gte.${start},fecha_pago.lte.${end})`;
        if (start) return `&fecha_pago=gte.${start}`;
        if (end) return `&fecha_pago=lte.${end}`;
        return '';
      };

      const url =
        `${SUPABASE_URL}/rest/v1/pagos_prestamos` +
        `?select=id_pago,id_prestamo,numero_pago,monto_pago,monto_pagado,fecha_programada,fecha_pago,fecha_pago_ts,nota,estatus` +
        `&id_socio=eq.${selectedSocio.id_socio}` +
        `&order=fecha_pago_ts.desc,nullslast&order=fecha_pago.desc,nullslast&order=fecha_programada.desc` +
        `${dateRangeQS()}` +
        `&limit=${PAGE_SIZE}&offset=${offset}`;

      const r = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          Prefer: 'count=exact',
        },
      });
      if (!r.ok) throw new Error('Error al cargar historial');
      const json = await r.json();
      setHistorial(json);
      setHistTotal(parseInt(r.headers.get('content-range')?.split('/')[1] ?? '0', 10));
      setHistPage(page);
    } catch (err) {
      setError(err.message);
      setHistorial([]);
      setHistTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSocio = (s) => {
    setSelectedSocio(s);
    setSearchTerm(`ID: ${s.id_socio} - ${s.nombre} ${s.apellido_paterno} ${s.apellido_materno}`);
    setSearchSociosResults([]);
    loadHistorial(1, histStart, histEnd);
  };

  // ----------------- Modal: buscar socio -----------------
  const handleModalSocioSearch = async (e) => {
    const term = e.target.value.toLowerCase();
    setModalSocioTerm(term);
    if (!term) return setModalSocioResults([]);

    try {
      const r = await fetch(
        `${SUPABASE_URL}/rest/v1/socios?select=id_socio,nombre,apellido_paterno,apellido_materno`,
        { headers: { 'Content-Type': 'application/json', apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } }
      );
      const data = await r.json();
      const filtered = data.filter(
        (s) =>
          String(s.id_socio).includes(term) ||
          `${s.nombre} ${s.apellido_paterno} ${s.apellido_materno}`.toLowerCase().includes(term)
      );
      setModalSocioResults(filtered);
    } catch {
      setModalSocioResults([]);
    }
  };

  // ----------------- Modal: cargar listas -----------------
  const refreshPayLists = async (
    id_socio,
    pendPage = 1,
    paidPage = 1,
    pendStartVal = '',
    pendEndVal = '',
    paidStartVal = '',
    paidEndVal = ''
  ) => {
    setPayLoading(true);
    try {
      const pendOffset = (pendPage - 1) * MODAL_PAGE_SIZE;
      const paidOffset = (paidPage - 1) * MODAL_PAGE_SIZE;

      const dateQS = (column, start, end) => {
        if (start && end) return `&and=(${column}.gte.${start},${column}.lte.${end})`;
        if (start) return `&${column}=gte.${start}`;
        if (end) return `&${column}=lte.${end}`;
        return '';
      };

      // Pendientes (incluye 'parcial')
      const pendUrl =
        `${SUPABASE_URL}/rest/v1/pagos_prestamos` +
        `?select=id_pago,id_prestamo,numero_pago,monto_pago,monto_pagado,fecha_programada,estatus,nota` +
        `&id_socio=eq.${id_socio}` +
        `&or=(estatus.eq.pendiente,estatus.eq.parcial)` +
        `${dateQS('fecha_programada', pendStartVal, pendEndVal)}` +
        `&order=fecha_programada.asc` +
        `&limit=${MODAL_PAGE_SIZE}&offset=${pendOffset}`;

      const rPend = await fetch(pendUrl, {
        headers: {
          'Content-Type': 'application/json',
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          Prefer: 'count=exact',
        },
      });
      if (!rPend.ok) throw new Error('Error al cargar pagos pendientes');
      const pendJson = await rPend.json();
      setPayPendientes(pendJson);
      setPayPendTotal(parseInt(rPend.headers.get('content-range')?.split('/')[1] ?? '0', 10));

      // Realizados (incluye fecha_pago_ts)
      const paidUrl =
        `${SUPABASE_URL}/rest/v1/pagos_prestamos` +
        `?select=id_pago,id_prestamo,numero_pago,monto_pagado,fecha_pago,fecha_pago_ts,nota` +
        `&id_socio=eq.${id_socio}` +
        `&estatus=eq.pagado` +
        `${dateQS('fecha_pago', paidStartVal, paidEndVal)}` +
        `&order=fecha_pago_ts.desc,nullslast&order=fecha_pago.desc` +
        `&limit=${MODAL_PAGE_SIZE}&offset=${paidOffset}`;

      const rPaid = await fetch(paidUrl, {
        headers: {
          'Content-Type': 'application/json',
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          Prefer: 'count=exact',
        },
      });
      if (!rPaid.ok) throw new Error('Error al cargar pagos realizados');
      const paidJson = await rPaid.json();
      setPayPagados(paidJson);
      setPayPaidTotal(parseInt(rPaid.headers.get('content-range')?.split('/')[1] ?? '0', 10));

      setPayPendPage(pendPage);
      setPayPaidPage(paidPage);
    } catch (err) {
      setError(err.message);
      setPayPendientes([]);
      setPayPagados([]);
      setPayPendTotal(0);
      setPayPaidTotal(0);
    } finally {
      setPayLoading(false);
    }
  };

  const pickModalSocio = (s) => {
    setModalSocio(s);
    setModalSocioTerm(`ID: ${s.id_socio} - ${s.nombre} ${s.apellido_paterno} ${s.apellido_materno}`);
    setModalSocioResults([]);
    refreshPayLists(s.id_socio, 1, 1, pendStart, pendEnd, paidStart, paidEnd);
  };

  const openPayModal = () => {
    setShowPayModal(true);
    setModalSocio(null);
    setModalSocioTerm('');
    setModalSocioResults([]);
    setPendStart('');
    setPendEnd('');
    setPaidStart('');
    setPaidEnd('');
    setPayPendientes([]);
    setPayPagados([]);
    setPayPendTotal(0);
    setPayPaidTotal(0);
  };
  const closePayModal = () => {
    setShowPayModal(false);
    setShowDoPay(false);
    setPagoTarget(null);
    setPayAmount('');
    setPayNote('');
  };

  // Elegir pendiente a pagar
  const handleClickPending = (pago) => {
    setPagoTarget(pago);
    const restante = Number(pago.monto_pago || 0) - Number(pago.monto_pagado || 0);
    setPayAmount(restante > 0 ? String(restante) : '');
    setPayNote('');
    setShowDoPay(true);
  };

  // Confirmar pago (guarda fecha exacta en fecha_pago_ts)
  const confirmPay = async () => {
    if (!pagoTarget || !modalSocio) return;

    const cantidad = Number(payAmount || 0);
    if (!(cantidad > 0)) {
      alert('Ingresa un monto válido.');
      return;
    }

    const restante = Number(pagoTarget.monto_pago || 0) - Number(pagoTarget.monto_pagado || 0);
    const isPartial = cantidad < restante;

    if (!window.confirm(`¿Confirmas ${isPartial ? 'pago PARCIAL' : 'pago TOTAL'} por ${fmtMoney(cantidad)}?`)) {
      return;
    }

    try {
      setPayLoading(true);
      const hoy = toLocalYMD();                 // DATE (local)
      const ts = new Date().toISOString();      // TIMESTAMPTZ (UTC, se mostrará en local con fmtTS12h)
      const nuevoPagado = Number(pagoTarget.monto_pagado || 0) + cantidad;

      const body = {
        monto_pagado: nuevoPagado,
        fecha_pago: hoy,
        fecha_pago_ts: ts,
        estatus: isPartial ? 'parcial' : 'pagado',
        nota: payNote || (isPartial ? 'Pago parcial' : null),
      };

      const r = await fetch(
        `${SUPABASE_URL}/rest/v1/pagos_prestamos?id_pago=eq.${pagoTarget.id_pago}`,
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
      if (!r.ok) {
        const e = await r.json().catch(() => ({}));
        throw new Error(e.message || 'Error al registrar el pago');
      }

      await refreshPayLists(modalSocio.id_socio, payPendPage, payPaidPage, pendStart, pendEnd, paidStart, paidEnd);
      if (selectedSocio?.id_socio === modalSocio.id_socio) {
        await loadHistorial(histPage, histStart, histEnd);
      }

      setShowDoPay(false);
      setPagoTarget(null);
      setPayAmount('');
      setPayNote('');
      alert('Pago registrado correctamente.');
    } catch (err) {
      alert(err.message);
    } finally {
      setPayLoading(false);
    }
  };

  // Guardar nota inline
  const saveRowNote = async (row) => {
    try {
      const r = await fetch(
        `${SUPABASE_URL}/rest/v1/pagos_prestamos?id_pago=eq.${row.id_pago}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
            Prefer: 'return=minimal',
          },
          body: JSON.stringify({ nota: noteDraft || null }),
        }
      );
      if (!r.ok) throw new Error('Error al actualizar la nota');
      setEditingNoteId(null);
      setNoteDraft('');
      loadHistorial(histPage, histStart, histEnd);
    } catch (err) {
      alert(err.message);
    }
  };

  // ============================ UI ============================
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Pagos</h2>
          <p className="text-slate-600">Consulta el detalle de pago de los socios</p>
        </div>
        <button
          onClick={openPayModal}
          className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
        >
          Realizar pago
        </button>
      </div>

      {/* Tarjetas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Pendientes del día</h3>
              <p className="text-2xl font-bold text-red-600">{pagosPendientesHoy}</p>
            </div>
          </div>
        </div>

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

        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Total recibido hoy</h3>
              <p className="text-2xl font-bold text-green-600">{fmtMoney(montoPagosRecibidosHoy)}</p>
              <p className="text-sm text-slate-600">{totalPagosRecibidosHoy} pagos</p>
            </div>
          </div>
        </div>

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

      {/* Buscador + historial */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h3 className="text-xl font-bold text-slate-900 mb-4">Buscar historial por socio</h3>
        <div className="grid md:grid-cols-2 gap-3 mb-3">
          <input
            type="text"
            placeholder="Buscar por ID de Socio o Nombre Completo..."
            value={searchTerm}
            onChange={handleSearchSocio}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="flex items-center gap-2">
            <input type="date" value={histStart} onChange={(e) => setHistStart(e.target.value)}
                   className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl"/>
            <input type="date" value={histEnd} onChange={(e) => setHistEnd(e.target.value)}
                   className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl"/>
            <button
              onClick={() => loadHistorial(1, histStart, histEnd)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              disabled={!selectedSocio}
            >
              Aplicar
            </button>
          </div>
        </div>

        {searchTerm && searchSociosResults.length > 0 && (
          <div className="mt-2 space-y-2">
            {searchSociosResults.map((s) => (
              <div key={s.id_socio} className="flex justify-between items-center p-3 bg-slate-100 rounded-lg">
                <span className="text-slate-800">ID: {s.id_socio} - {s.nombre} {s.apellido_paterno} {s.apellido_materno}</span>
                <button onClick={() => handleSelectSocio(s)} className="px-3 py-1 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600">
                  Ver historial
                </button>
              </div>
            ))}
          </div>
        )}

        {selectedSocio && (
          <div className="mt-6">
            <h4 className="text-lg font-semibold text-slate-900 mb-3">
              Historial — {selectedSocio.nombre} {selectedSocio.apellido_paterno}
            </h4>

            {loading && <p className="text-slate-600">Cargando...</p>}
            {error && !loading && <p className="text-red-500">{error}</p>}

            {!loading && historial.length === 0 && (
              <p className="text-slate-600">Sin pagos para los criterios seleccionados.</p>
            )}

            {!loading && historial.length > 0 && (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="text-left py-3 px-4 font-semibold text-slate-700">ID Pago</th>
                        <th className="text-left py-3 px-4 font-semibold text-slate-700">ID Préstamo</th>
                        <th className="text-left py-3 px-4 font-semibold text-slate-700"># Pago</th>
                        <th className="text-left py-3 px-4 font-semibold text-slate-700">Programado</th>
                        <th className="text-left py-3 px-4 font-semibold text-slate-700">Pagado (fecha/hora)</th>
                        <th className="text-left py-3 px-4 font-semibold text-slate-700">Monto Prog.</th>
                        <th className="text-left py-3 px-4 font-semibold text-slate-700">Monto Pagado</th>
                        <th className="text-left py-3 px-4 font-semibold text-slate-700">Estatus</th>
                        <th className="text-left py-3 px-4 font-semibold text-slate-700">Nota</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historial.map((row) => (
                        <tr key={row.id_pago} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="py-3 px-4">{row.id_pago}</td>
                          <td className="py-3 px-4">{row.id_prestamo}</td>
                          <td className="py-3 px-4">{row.numero_pago}</td>
                          <td className="py-3 px-4">{fmtYMDtoDMY(row.fecha_programada)}</td>
                          <td className="py-3 px-4">
                            {row.fecha_pago_ts ? fmtTS12h(row.fecha_pago_ts) : (row.fecha_pago ? fmtYMDtoDMY(row.fecha_pago) : '—')}
                          </td>
                          <td className="py-3 px-4 font-medium">{fmtMoney(row.monto_pago)}</td>
                          <td className="py-3 px-4 font-medium">{fmtMoney(row.monto_pagado)}</td>
                          <td className="py-3 px-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              row.estatus === 'pendiente'
                                ? 'bg-yellow-100 text-yellow-700'
                                : row.estatus === 'parcial'
                                ? 'bg-orange-100 text-orange-700'
                                : 'bg-green-100 text-green-700'
                            }`}>
                              {row.estatus}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            {editingNoteId === row.id_pago ? (
                              <div className="flex items-center gap-2">
                                <input
                                  value={noteDraft}
                                  onChange={(e) => setNoteDraft(e.target.value)}
                                  className="px-2 py-1 border border-slate-300 rounded"
                                  placeholder="Escribe una nota…"
                                />
                                <button
                                  onClick={() => saveRowNote(row)}
                                  className="px-2 py-1 bg-green-600 text-white rounded"
                                >
                                  Guardar
                                </button>
                                <button
                                  onClick={() => { setEditingNoteId(null); setNoteDraft(''); }}
                                  className="px-2 py-1 bg-slate-200 rounded"
                                >
                                  Cancelar
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <span className="text-slate-700">{row.nota || '—'}</span>
                                <button
                                  title="Editar nota"
                                  onClick={() => { setEditingNoteId(row.id_pago); setNoteDraft(row.nota || ''); }}
                                  className="p-1 rounded hover:bg-slate-200"
                                >
                                  <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                      d="M15.232 5.232l3.536 3.536M3 21h4.243L19.778 8.465a1.5 1.5 0 00-2.121-2.121L5.121 18.879V21z" />
                                  </svg>
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-slate-600">
                    Mostrando {historial.length} de {histTotal} registros
                  </p>
                  <div className="flex gap-2">
                    <button
                      className="px-3 py-1 border rounded disabled:opacity-50"
                      onClick={() => loadHistorial(Math.max(1, histPage - 1), histStart, histEnd)}
                      disabled={histPage <= 1}
                    >
                      Anterior
                    </button>
                    <span className="px-2 py-1">Página {histPage}</span>
                    <button
                      className="px-3 py-1 border rounded disabled:opacity-50"
                      onClick={() => loadHistorial(histPage + 1, histStart, histEnd)}
                      disabled={histPage * PAGE_SIZE >= histTotal}
                    >
                      Siguiente
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* ================== MODAL REALIZAR PAGO ================== */}
      {showPayModal && (
        <div className="fixed inset-0 bg-black/40 flex items-start justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-5xl">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">Realizar pago</h3>
              <button onClick={closePayModal} className="px-3 py-1 rounded hover:bg-slate-100">Cerrar</button>
            </div>

            {/* Contenido con SCROLL */}
            <div className="p-4 max-h-[78vh] overflow-y-auto">
              {/* Buscar socio */}
              <div className="mb-3">
                <input
                  type="text"
                  placeholder="Ingresa ID o nombre del socio…"
                  value={modalSocioTerm}
                  onChange={handleModalSocioSearch}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
                {modalSocioTerm && modalSocioResults.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {modalSocioResults.map((s) => (
                      <div key={s.id_socio} className="flex justify-between items-center p-2 bg-slate-100 rounded">
                        <span>ID {s.id_socio} — {s.nombre} {s.apellido_paterno} {s.apellido_materno}</span>
                        <button className="px-3 py-1 bg-blue-600 text-white rounded" onClick={() => pickModalSocio(s)}>
                          Seleccionar
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {modalSocio && (
                <>
                  <div className="mb-3 p-2 bg-slate-50 border rounded">
                    Socio seleccionado: <b>ID {modalSocio.id_socio}</b> — {modalSocio.nombre} {modalSocio.apellido_paterno} {modalSocio.apellido_materno}
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    {/* Pendientes */}
                    <div className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold">Pendientes</h4>
                        <div className="flex items-center gap-2">
                          <input type="date" value={pendStart} onChange={(e) => setPendStart(e.target.value)} className="px-2 py-1 border rounded"/>
                          <input type="date" value={pendEnd} onChange={(e) => setPendEnd(e.target.value)} className="px-2 py-1 border rounded"/>
                          <button
                            onClick={() => refreshPayLists(modalSocio.id_socio, 1, payPaidPage, pendStart, pendEnd, paidStart, paidEnd)}
                            className="px-3 py-1 bg-blue-600 text-white rounded"
                          >
                            Aplicar
                          </button>
                        </div>
                      </div>

                      <div className="max-h-72 overflow-y-auto">
                        {payLoading && <p className="text-slate-600">Cargando…</p>}
                        {!payLoading && payPendientes.length === 0 && (
                          <p className="text-slate-600">No hay pagos pendientes.</p>
                        )}
                        {!payLoading && payPendientes.map((p) => {
                          const restante = Number(p.monto_pago || 0) - Number(p.monto_pagado || 0);
                          return (
                            <div key={p.id_pago} className="p-2 border rounded mb-2">
                              <div className="flex justify-between items-center">
                                <div>
                                  <div className="font-medium">Préstamo #{p.id_prestamo} — Pago #{p.numero_pago}</div>
                                  <div className="text-sm text-slate-600">
                                    Programado: {fmtYMDtoDMY(p.fecha_programada)} — Monto: {fmtMoney(p.monto_pago)} {p.monto_pagado > 0 ? `(pagado ${fmtMoney(p.monto_pagado)})` : ''}
                                  </div>
                                  {p.nota && <div className="text-xs text-slate-500 mt-1">Nota: {p.nota}</div>}
                                </div>
                                <button
                                  onClick={() => handleClickPending(p)}
                                  className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                                >
                                  Pagar {restante > 0 ? fmtMoney(restante) : ''}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="flex justify-end gap-2 mt-2">
                        <button
                          className="px-3 py-1 border rounded disabled:opacity-50"
                          onClick={() => refreshPayLists(modalSocio.id_socio, Math.max(1, payPendPage - 1), payPaidPage, pendStart, pendEnd, paidStart, paidEnd)}
                          disabled={payPendPage <= 1}
                        >
                          Anterior
                        </button>
                        <span className="px-2 py-1 text-sm">Página {payPendPage}</span>
                        <button
                          className="px-3 py-1 border rounded disabled:opacity-50"
                          onClick={() => refreshPayLists(modalSocio.id_socio, payPendPage + 1, payPaidPage, pendStart, pendEnd, paidStart, paidEnd)}
                          disabled={payPendPage * MODAL_PAGE_SIZE >= payPendTotal}
                        >
                          Siguiente
                        </button>
                      </div>
                    </div>

                    {/* Realizados */}
                    <div className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold">Realizados</h4>
                        <div className="flex items-center gap-2">
                          <input type="date" value={paidStart} onChange={(e) => setPaidStart(e.target.value)} className="px-2 py-1 border rounded"/>
                          <input type="date" value={paidEnd} onChange={(e) => setPaidEnd(e.target.value)} className="px-2 py-1 border rounded"/>
                          <button
                            onClick={() => refreshPayLists(modalSocio.id_socio, payPendPage, 1, pendStart, pendEnd, paidStart, paidEnd)}
                            className="px-3 py-1 bg-blue-600 text-white rounded"
                          >
                            Aplicar
                          </button>
                        </div>
                      </div>

                      <div className="max-h-72 overflow-y-auto">
                        {payLoading && <p className="text-slate-600">Cargando…</p>}
                        {!payLoading && payPagados.length === 0 && (
                          <p className="text-slate-600">Aún no hay pagos registrados.</p>
                        )}
                        {!payLoading && payPagados.map((p) => (
                          <div key={p.id_pago} className="p-2 border rounded mb-2">
                            <div className="font-medium">Préstamo #{p.id_prestamo} — Pago #{p.numero_pago}</div>
                            <div className="text-sm text-slate-600">
                              Pagado: {p.fecha_pago_ts ? fmtTS12h(p.fecha_pago_ts) : (p.fecha_pago ? fmtYMDtoDMY(p.fecha_pago) : '—')} — Monto: {fmtMoney(p.monto_pagado)}
                            </div>
                            {p.nota && <div className="text-xs text-slate-500 mt-1">Nota: {p.nota}</div>}
                          </div>
                        ))}
                      </div>

                      <div className="flex justify-end gap-2 mt-2">
                        <button
                          className="px-3 py-1 border rounded disabled:opacity-50"
                          onClick={() => refreshPayLists(modalSocio.id_socio, payPendPage, Math.max(1, payPaidPage - 1), pendStart, pendEnd, paidStart, paidEnd)}
                          disabled={payPaidPage <= 1}
                        >
                          Anterior
                        </button>
                        <span className="px-2 py-1 text-sm">Página {payPaidPage}</span>
                        <button
                          className="px-3 py-1 border rounded disabled:opacity-50"
                          onClick={() => refreshPayLists(modalSocio.id_socio, payPendPage, payPaidPage + 1, pendStart, pendEnd, paidStart, paidEnd)}
                          disabled={payPaidPage * MODAL_PAGE_SIZE >= payPaidTotal}
                        >
                          Siguiente
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Sub-modal confirmar pago */}
          {showDoPay && pagoTarget && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-5">
                <h4 className="text-lg font-semibold mb-3">Confirmar pago</h4>
                <p className="text-sm text-slate-700 mb-2">
                  Préstamo #{pagoTarget.id_prestamo} — Pago #{pagoTarget.numero_pago}<br />
                  Programado: {fmtYMDtoDMY(pagoTarget.fecha_programada)} — Monto: {fmtMoney(pagoTarget.monto_pago)}
                  {pagoTarget.monto_pagado > 0 ? <> — Pagado: {fmtMoney(pagoTarget.monto_pagado)}</> : null}
                </p>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-slate-700">Monto a pagar</label>
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={payAmount}
                      onChange={(e) => setPayAmount(e.target.value)}
                      className="w-full px-3 py-2 border rounded mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700">Nota (opcional)</label>
                    <textarea
                      rows={3}
                      value={payNote}
                      onChange={(e) => setPayNote(e.target.value)}
                      placeholder="Ej. Pago parcial por falta de efectivo"
                      className="w-full px-3 py-2 border rounded mt-1"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 mt-4">
                  <button onClick={() => { setShowDoPay(false); setPagoTarget(null); }} className="px-4 py-2 bg-slate-200 rounded">
                    Cancelar
                  </button>
                  <button onClick={confirmPay} className="px-4 py-2 bg-green-600 text-white rounded">
                    Confirmar pago
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PagosModule;

