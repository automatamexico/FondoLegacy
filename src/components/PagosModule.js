import React, { useEffect, useMemo, useState } from 'react';

const SUPABASE_URL = 'https://ubfkhtkmlvutwdivmoff.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InViZmtodGttbHZ1dHdkaXZtb2ZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4MTc5NTUsImV4cCI6MjA2NjM5Mzk1NX0.c0iRma-dnlL29OR3ffq34nmZuj_ViApBTMG-6PEX_B4';

function fmtMoney(n) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(Number(n || 0));
}
function toDateInput(d) {
  if (!d) return '';
  const dt = new Date(d);
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  const day = String(dt.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
function toLocalISO(now = new Date()) {
  const tz = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - tz).toISOString();
}
const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
function fmtLongDate(s) {
  if (!s) return '';
  let d;
  if (typeof s === 'string' && s.length <= 10) d = new Date(`${s}T00:00:00`);
  else d = new Date(s);
  const dd = String(d.getDate()).padStart(2,'0');
  const mname = MONTHS[d.getMonth()];
  const yyyy = d.getFullYear();
  return `${dd}/${mname}/${yyyy}`;
}
function fmt12h(iso) {
  if (!iso) return '';
  const dt = new Date(iso);
  return dt.toLocaleString('es-MX', {
    hour: 'numeric', minute: '2-digit', hour12: true,
    year: 'numeric', month: '2-digit', day: '2-digit'
  });
}
function daysDiff(dateStr) {
  if (!dateStr) return 0;
  const t = new Date(); t.setHours(0,0,0,0);
  const d = new Date(`${dateStr}T00:00:00`); d.setHours(0,0,0,0);
  return Math.max(0, Math.floor((t.getTime() - d.getTime()) / (1000*60*60*24)));
}

const PagosModule = ({ idSocio }) => {
  const [loading, setLoading] = useState(true);
  const [dashError, setDashError] = useState(null);

  // Tarjetas
  const [pendientesHoy, setPendientesHoy] = useState(0);
  const [proximos, setProximos] = useState(0); // ahora 1–3 días
  const [recibidosHoyCount, setRecibidosHoyCount] = useState(0);
  const [recibidosHoyMonto, setRecibidosHoyMonto] = useState(0);
  const [vencidos, setVencidos] = useState(0);

  // Historial por socio
  const [buscarSocioTerm, setBuscarSocioTerm] = useState('');
  const [sugSocios, setSugSocios] = useState([]);
  const [socioSel, setSocioSel] = useState(null);
  const [histFrom, setHistFrom] = useState('');
  const [histTo, setHistTo] = useState('');
  const [historial, setHistorial] = useState([]);
  const [histError, setHistError] = useState(null);

  // Modal pagar
  const [showModal, setShowModal] = useState(false);
  const [modalSocio, setModalSocio] = useState(null);
  const [pendFrom, setPendFrom] = useState('');
  const [pendTo, setPendTo] = useState('');
  const [realFrom, setRealFrom] = useState('');
  const [realTo, setRealTo] = useState('');
  const [pendientes, setPendientes] = useState([]);
  const [realizados, setRealizados] = useState([]);
  const [mpageP, setMpageP] = useState(1);
  const [mpageR, setMpageR] = useState(1);
  const pageSize = 10;

  const [pagoSel, setPagoSel] = useState(null);
  const [montoPagar, setMontoPagar] = useState('');
  const [parcial, setParcial] = useState(false);
  const [nota, setNota] = useState('');
  const [saving, setSaving] = useState(false);

  // Modal de detalles para tarjetas
  const [showCardModal, setShowCardModal] = useState(false);
  thead
  const [cardModalTitle, setCardModalTitle] = useState('');
  const [cardModalKind, setCardModalKind] = useState(null); // 'pendientes'|'proximos'|'recibidos'|'vencidos'
  const [cardModalRows, setCardModalRows] = useState([]);
  const [cardModalLoading, setCardModalLoading] = useState(false);
  const [cardModalError, setCardModalError] = useState(null);

  // ---------- TARJETAS ----------
  useEffect(() => {
    (async () => {
      try {
        const now = new Date();
        const hoy = toDateInput(now);
        const d1 = toDateInput(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1));
        const d2 = toDateInput(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2));
        const d3 = toDateInput(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 3));

        // Pendientes hoy
        const r1 = await fetch(
          `${SUPABASE_URL}/rest/v1/pagos_prestamos?fecha_programada=eq.${hoy}&estatus=eq.pendiente&select=id_pago`,
          { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}`, Prefer: 'count=exact', 'Range-Unit': 'items', Range: '0-0' } }
        );
        const c1 = parseInt(r1.headers.get('content-range')?.split('/')?.[1] || '0', 10);
        setPendientesHoy(c1);

        // Próximos (1–3 días)
        const r2 = await fetch(
          `${SUPABASE_URL}/rest/v1/pagos_prestamos?or=(fecha_programada.eq.${d1},fecha_programada.eq.${d2},fecha_programada.eq.${d3})&estatus=eq.pendiente&select=id_pago`,
          { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}`, Prefer: 'count=exact', 'Range-Unit': 'items', Range: '0-0' } }
        );
        const c2 = parseInt(r2.headers.get('content-range')?.split('/')?.[1] || '0', 10);
        setProximos(c2);

        // Recibidos hoy
        const r3 = await fetch(
          `${SUPABASE_URL}/rest/v1/pagos_prestamos?fecha_pago=eq.${hoy}&select=monto_pagado`,
          { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } }
        );
        const data3 = await r3.json();
        setRecibidosHoyCount(data3.length);
        setRecibidosHoyMonto(data3.reduce((s, x) => s + Number(x.monto_pagado || 0), 0));

        // Vencidos
        const r4 = await fetch(
          `${SUPABASE_URL}/rest/v1/pagos_prestamos?fecha_programada=lt.${hoy}&estatus=eq.pendiente&select=id_pago`,
          { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}`, Prefer: 'count=exact', 'Range-Unit': 'items', Range: '0-0' } }
        );
        const c4 = parseInt(r4.headers.get('content-range')?.split('/')?.[1] || '0', 10);
        setVencidos(c4);

        setDashError(null);
      } catch (e) {
        setDashError('No se pudieron cargar las métricas.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ---------- BUSCAR SOCIO (historial) ----------
  useEffect(() => {
    const run = async () => {
      const t = buscarSocioTerm.trim().toLowerCase();
      if (!t) { setSugSocios([]); return; }
      const r = await fetch(`${SUPABASE_URL}/rest/v1/socios?select=id_socio,nombre,apellido_paterno,apellido_materno`,
        { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } });
      const data = await r.json();
      const fil = data.filter(s =>
        String(s.id_socio).includes(t) ||
        `${s.nombre} ${s.apellido_paterno} ${s.apellido_materno}`.toLowerCase().includes(t)
      ).slice(0, 20);
      setSugSocios(fil);
    };
    run();
  }, [buscarSocioTerm]);

  const cargarHistorial = async (socio) => {
    try {
      setHistError(null);
      const base = `${SUPABASE_URL}/rest/v1/pagos_prestamos?id_socio=eq.${socio.id_socio}&monto_pagado=gt.0&select=id_pago,id_prestamo,monto_pagado,fecha_pago,fecha_hora_pago,numero_pago,nota`;
      const parts = [];
      if (histFrom) parts.push(`fecha_pago=gte.${histFrom}`);
      if (histTo) parts.push(`fecha_pago=lte.${histTo}`);
      const url = [base, ...parts].join('&') + `&order=fecha_pago.desc&order=id_pago.desc&limit=50`;
      const r = await fetch(url, { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } });
      if (!r.ok) throw new Error('err');
      const data = await r.json();
      setHistorial(data);
    } catch {
      setHistorial([]);
      setHistError('Error al cargar pagos realizados');
    }
  };

  // ---------- MODAL PAGAR (ahora también trae interes_pagado y capital_pagado) ----------
  const cargarModalListas = async (socio) => {
    // Pendientes (agregamos interes_pagado y capital_pagado)
    const pParts = [
      `${SUPABASE_URL}/rest/v1/pagos_prestamos?id_socio=eq.${socio.id_socio}`,
      `estatus=eq.pendiente`,
      `select=id_pago,id_prestamo,numero_pago,fecha_programada,monto_pago,frecuencia,interes_pagado,capital_pagado`
    ];
    if (pendFrom) pParts.push(`fecha_programada=gte.${pendFrom}`);
    if (pendTo) pParts.push(`fecha_programada=lte.${pendTo}`);
    const pUrl = pParts.join('&') + `&order=fecha_programada.asc&order=id_pago.asc`;
    const rp = await fetch(pUrl, { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } });
    const dataP = await rp.json();
    setPendientes(dataP);

    // Realizados (igual que antes)
    const rParts = [
      `${SUPABASE_URL}/rest/v1/pagos_prestamos?id_socio=eq.${socio.id_socio}`,
      `monto_pagado=gt.0`,
      `select=id_pago,id_prestamo,numero_pago,fecha_pago,fecha_hora_pago,monto_pagado,nota,interes_pagado,capital_pagado`
    ];
    if (realFrom) rParts.push(`fecha_pago=gte.${realFrom}`);
    if (realTo) rParts.push(`fecha_pago=lte.${realTo}`);
    const rUrl = rParts.join('&') + `&order=fecha_pago.desc&order=id_pago.desc`;
    const rr = await fetch(rUrl, { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } });
    const dataR = await rr.json();
    setRealizados(dataR);
  };

  const abrirPagar = (pago) => {
    setPagoSel(pago);
    setMontoPagar(pago.monto_pago || '');
    setParcial(false);
    setNota('');
  };

  // --- Cálculo de división de pago (interés/capital) y PATCH ---
  const confirmarPagar = async () => {
    if (!pagoSel) return;

    const montoIngresado = Number(montoPagar || pagoSel.monto_pago || 0);
    if (parcial && (!montoIngresado || montoIngresado <= 0)) {
      alert('Indica un monto parcial válido.');
      return;
    }

    setSaving(true);
    try {
      // 1) Traer datos del préstamo
      const rPrest = await fetch(
        `${SUPABASE_URL}/rest/v1/prestamos?id_prestamo=eq.${pagoSel.id_prestamo}&select=id_prestamo,monto_solicitado,interes`,
        { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } }
      );
      const prestArr = await rPrest.json();
      if (!prestArr || !prestArr.length) throw new Error('No se encontró el préstamo.');
      const prest = prestArr[0];
      const montoSolicitado = Number(prest.monto_solicitado || 0);
      const tasa = Number(prest.interes || 0) / 100;

      // 2) Número de periodos (conteo de pagos programados)
      const rCount = await fetch(
        `${SUPABASE_URL}/rest/v1/pagos_prestamos?id_prestamo=eq.${pagoSel.id_prestamo}&select=id_pago`,
        {
          headers: {
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
            Prefer: 'count=exact',
            'Range-Unit': 'items',
            Range: '0-0'
          }
        }
      );
      const totalPeriodos = parseInt(rCount.headers.get('content-range')?.split('/')?.[1] || '0', 10) || 0;

      // 3) Interés y capital por periodo (según tu construcción original)
      const interesPorPeriodo = montoSolicitado * tasa;
      let capitalPorPeriodo;
      if (pagoSel.monto_pago != null) {
        // Usar el monto_programado menos el interés por periodo
        capitalPorPeriodo = Math.max(Number(pagoSel.monto_pago) - interesPorPeriodo, 0);
      } else {
        // Respaldo: dividir capital en partes iguales
        capitalPorPeriodo = totalPeriodos > 0 ? (montoSolicitado / totalPeriodos) : 0;
      }

      // 4) Tomar acumulados anteriores de este pago (si existen)
      const yaInteres = Number(pagoSel.interes_pagado || 0);
      const yaCapital = Number(pagoSel.capital_pagado || 0);

      // Interés pendiente de este periodo (si hubo parciales previos)
      const interesPendiente = Math.max(interesPorPeriodo - yaInteres, 0);
      const capitalPendiente = Math.max(capitalPorPeriodo - yaCapital, 0);

      // 5) Distribuir el monto ingresado: primero interés pendiente y luego capital
      let interesAAgregar = 0;
      let capitalAAgregar = 0;

      if (parcial) {
        const pagaInteres = Math.min(montoIngresado, interesPendiente);
        const pagaCapital = Math.max(montoIngresado - pagaInteres, 0);
        interesAAgregar = pagaInteres;
        capitalAAgregar = Math.min(pagaCapital, capitalPendiente);
      } else {
        // Pago "completo" del periodo: lleva el total teórico restante
        interesAAgregar = interesPendiente;
        capitalAAgregar = capitalPendiente;
      }

      const nuevoInteres = yaInteres + interesAAgregar;
      const nuevoCapital = yaCapital + capitalAAgregar;
      const totalAcumuladoPeriodo = nuevoInteres + nuevoCapital;
      const objetivoPeriodo = Number(pagoSel.monto_pago || (interesPorPeriodo + capitalPorPeriodo));

      // decidir estatus: pagado si ya cubrió el periodo (tolerancia por centavos)
      const estatusFinal = totalAcumuladoPeriodo >= (objetivoPeriodo - 0.01) ? 'pagado' : 'parcial';

      // 6) PATCH al pago
      const nowLocalISO = toLocalISO(new Date());
      const soloFecha = nowLocalISO.slice(0, 10);

      const body = {
        fecha_pago: soloFecha,
        fecha_hora_pago: nowLocalISO,
        estatus: estatusFinal,
        monto_pagado: Number((yaInteres + yaCapital) + interesAAgregar + capitalAAgregar).toFixed(2),
        interes_pagado: Number(nuevoInteres).toFixed(2),
        capital_pagado: Number(nuevoCapital).toFixed(2),
        nota: (nota || '').trim() || null
      };

      const r = await fetch(
        `${SUPABASE_URL}/rest/v1/pagos_prestamos?id_pago=eq.${pagoSel.id_pago}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify(body)
        }
      );
      if (!r.ok) throw new Error('No se pudo registrar el pago.');

      // recargar listas
      await cargarModalListas(modalSocio);
      if (socioSel) await cargarHistorial(socioSel);

      setPagoSel(null);
      setMontoPagar('');
      setParcial(false);
      setNota('');
    } catch (e) {
      console.error(e);
      alert('No se pudo registrar el pago.');
    } finally {
      setSaving(false);
    }
  };

  // ---------- MODAL tarjetas ----------
  const openCardDetails = async (kind) => {
    setShowCardModal(true);
    setCardModalLoading(true);
    setCardModalError(null);
    setCardModalRows([]);
    setCardModalKind(kind);

    const now = new Date();
    const hoy = toDateInput(now);
    const d1 = toDateInput(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1));
    const d2 = toDateInput(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2));
    const d3 = toDateInput(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 3));

    try {
      let title = '';
      let url = '';

      if (kind === 'pendientes') {
        title = 'Pagos pendientes del día';
        url = `${SUPABASE_URL}/rest/v1/pagos_prestamos?fecha_programada=eq.${hoy}&estatus=eq.pendiente&select=id_pago,id_prestamo,id_socio,numero_pago,fecha_programada,monto_pago,frecuencia&order=fecha_programada.asc&order=id_pago.asc`;
      } else if (kind === 'proximos') {
        title = 'Próximos pagos (1–3 días)';
        url = `${SUPABASE_URL}/rest/v1/pagos_prestamos?or=(fecha_programada.eq.${d1},fecha_programada.eq.${d2},fecha_programada.eq.${d3})&estatus=eq.pendiente&select=id_pago,id_prestamo,id_socio,numero_pago,fecha_programada,monto_pago,frecuencia&order=fecha_programada.asc&order=id_pago.asc`;
      } else if (kind === 'recibidos') {
        title = 'Pagos recibidos hoy';
        url = `${SUPABASE_URL}/rest/v1/pagos_prestamos?fecha_pago=eq.${hoy}&monto_pagado=gt.0&select=id_pago,id_prestamo,id_socio,numero_pago,fecha_pago,fecha_hora_pago,monto_pagado,nota&order=fecha_hora_pago.desc&order=id_pago.desc`;
      } else if (kind === 'vencidos') {
        title = 'Pagos vencidos';
        url = `${SUPABASE_URL}/rest/v1/pagos_prestamos?fecha_programada=lt.${hoy}&estatus=eq.pendiente&select=id_pago,id_prestamo,id_socio,numero_pago,fecha_programada,monto_pago,frecuencia&order=fecha_programada.asc&order=id_pago.asc`;
      }

      setCardModalTitle(title);

      const r = await fetch(url, {
        headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` }
      });
      if (!r.ok) throw new Error('fetch');
      const data = await r.json();

      // Enriquecer con nombre completo del socio
      if (data.length > 0) {
        const ids = [...new Set(data.map(x => x.id_socio).filter(Boolean))];
        if (ids.length > 0) {
          const inList = ids.join(',');
          const rs = await fetch(
            `${SUPABASE_URL}/rest/v1/socios?id_socio=in.(${inList})&select=id_socio,nombre,apellido_paterno,apellido_materno`,
            { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } }
          );
          const socios = await rs.json();
          const map = new Map(socios.map(s => [s.id_socio, `${s.nombre} ${s.apellido_paterno} ${s.apellido_materno}`]));
          data.forEach(row => { row.nombre_completo = map.get(row.id_socio) || '—'; });
        }
      }
      setCardModalRows(data);
    } catch (e) {
      setCardModalError('No se pudo cargar la información.');
    } finally {
      setCardModalLoading(false);
    }
  };

  // ---------- RENDER ----------
  const pagPend = useMemo(() => pendientes.slice((mpageP - 1) * pageSize, mpageP * pageSize), [pendientes, mpageP]);
  const pagReal = useMemo(() => realizados.slice((mpageR - 1) * pageSize, mpageR * pageSize), [realizados, mpageR]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Pagos</h2>
          <p className="text-slate-600">Consulta el detalle de pago de los socios</p>
        </div>
        <button
          onClick={() => { setShowModal(true); setModalSocio(null); setPendientes([]); setRealizados([]); }}
          className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
        >
          Realizar pago
        </button>
      </div>

      {/* Tarjetas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 cursor-pointer hover:ring-2 hover:ring-blue-100"
             onClick={() => openCardDetails('pendientes')}>
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center"><span className="text-red-600">⏲️</span></div>
            <div>
              <h3 className="font-semibold text-slate-900">Pendientes del día</h3>
              <p className="text-2xl font-bold text-red-600">{pendientesHoy}</p>
            </div>
          </div>
          {dashError && <p className="text-xs text-red-500">{dashError}</p>}
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 cursor-pointer hover:ring-2 hover:ring-blue-100"
             onClick={() => openCardDetails('proximos')}>
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center"><span className="text-yellow-600">📅</span></div>
            <div>
              <h3 className="font-semibold text-slate-900">Próximos pagos</h3>
              <p className="text-2xl font-bold text-yellow-600">{proximos}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 cursor-pointer hover:ring-2 hover:ring-blue-100"
             onClick={() => openCardDetails('recibidos')}>
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center"><span className="text-green-600">💵</span></div>
            <div>
              <h3 className="font-semibold text-slate-900">Total recibido hoy</h3>
              <p className="text-2xl font-bold text-green-600">{fmtMoney(recibidosHoyMonto)}</p>
              <p className="text-sm text-slate-600">{recibidosHoyCount} pagos</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 cursor-pointer hover:ring-2 hover:ring-blue-100"
             onClick={() => openCardDetails('vencidos')}>
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center"><span className="text-purple-600">⏰</span></div>
            <div>
              <h3 className="font-semibold text-slate-900">Pagos vencidos</h3>
              <p className="text-2xl font-bold text-purple-600">{vencidos}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Buscar historial por socio (igual que antes) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-3">Buscar historial por socio</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
          <input
            type="text"
            className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl"
            placeholder="ID o Nombre completo…"
            value={buscarSocioTerm}
            onChange={(e) => setBuscarSocioTerm(e.target.value)}
          />
          <input type="date" className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl" value={histFrom} onChange={e => setHistFrom(e.target.value)} />
          <input type="date" className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl" value={histTo} onChange={e => setHistTo(e.target.value)} />
          <button className="px-4 py-2 bg-blue-600 text-white rounded-xl"
                  onClick={() => { if (socioSel) cargarHistorial(socioSel); }}>
            Aplicar
          </button>
        </div>

        {sugSocios.length > 0 && (
          <div className="mt-3 space-y-2">
            {sugSocios.map(s => (
              <div key={s.id_socio} className="p-2 bg-slate-50 rounded-lg flex justify-between">
                <span>ID: {s.id_socio} — {s.nombre} {s.apellido_paterno} {s.apellido_materno}</span>
                <button
                  className="px-3 py-1 bg-emerald-600 text-white rounded-lg"
                  onClick={() => { setSocioSel(s); setBuscarSocioTerm(`ID: ${s.id_socio} — ${s.nombre} ${s.apellido_paterno} ${s.apellido_materno}`); setSugSocios([]); cargarHistorial(s); }}
                >
                  Ver historial
                </button>
              </div>
            ))}
          </div>
        )}

        {socioSel && (
          <div className="mt-6">
            <h4 className="font-semibold text-slate-900 mb-2">Historial — {socioSel.nombre} {socioSel.apellido_paterno}</h4>
            {histError && <p className="text-red-500 mb-2">{histError}</p>}
            {historial.length === 0 ? (
              <p className="text-slate-600">Sin pagos para los criterios seleccionados.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-2 px-3">ID Préstamo</th>
                      <th className="text-left py-2 px-3">Monto pagado</th>
                      <th className="text-left py-2 px-3">Fecha/hora</th>
                      <th className="text-left py-2 px-3"># Pago</th>
                      <th className="text-left py-2 px-3">Nota</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historial.map(p => (
                      <tr key={p.id_pago} className="border-b border-slate-100">
                        <td className="py-2 px-3">{p.id_prestamo}</td>
                        <td className="py-2 px-3 font-semibold">{fmtMoney(p.monto_pagado)}</td>
                        <td className="py-2 px-3">{p.fecha_hora_pago ? fmt12h(p.fecha_hora_pago) : (p.fecha_pago || '')}</td>
                        <td className="py-2 px-3">{p.numero_pago}</td>
                        <td className="py-2 px-3">{p.nota || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODAL: Realizar pago */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-5xl shadow-xl">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">Realizar pago</h3>
              <button className="px-3 py-1 rounded-lg bg-slate-100" onClick={() => setShowModal(false)}>Cerrar</button>
            </div>

            <div className="p-4 max-h-[70vh] overflow-y-auto">
              {/* BUSCAR SOCIO PARA MODAL */}
              {!modalSocio && (
                <div className="mb-4">
                  <p className="text-sm text-slate-700 mb-2">Buscar socio para pagar</p>
                  <input
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                    placeholder="ID o Nombre…"
                    value={buscarSocioTerm}
                    onChange={(e) => setBuscarSocioTerm(e.target.value)}
                  />
                  {sugSocios.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {sugSocios.map(s => (
                        <div key={s.id_socio} className="p-2 bg-slate-50 rounded-lg flex justify-between">
                          <span>ID: {s.id_socio} — {s.nombre} {s.apellido_paterno} {s.apellido_materno}</span>
                          <button
                            className="px-3 py-1 bg-blue-600 text-white rounded-lg"
                            onClick={() => { setModalSocio(s); setMpageP(1); setMpageR(1); cargarModalListas(s); }}
                          >
                            Seleccionar
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* LISTAS PENDIENTES / REALIZADOS */}
              {modalSocio && (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold">Socio: {modalSocio.nombre} {modalSocio.apellido_paterno} (ID {modalSocio.id_socio})</h4>
                    <button className="px-3 py-1 rounded-lg bg-slate-100" onClick={() => { setModalSocio(null); setPendientes([]); setRealizados([]); }}>Cambiar socio</button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Pendientes */}
                    <div className="border rounded-xl p-3">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-semibold">Pagos pendientes</h5>
                        <div className="flex gap-2">
                          <input type="date" className="px-2 py-1 border rounded-lg" value={pendFrom} onChange={e => setPendFrom(e.target.value)} />
                          <input type="date" className="px-2 py-1 border rounded-lg" value={pendTo} onChange={e => setPendTo(e.target.value)} />
                          <button className="px-3 py-1 bg-blue-600 text-white rounded-lg" onClick={() => cargarModalListas(modalSocio)}>Filtrar</button>
                        </div>
                      </div>
                      {pagPend.length === 0 ? (
                        <p className="text-slate-600 text-sm">Sin pendientes.</p>
                      ) : (
                        <div className="space-y-2">
                          {pagPend.map(p => (
                            <div key={p.id_pago} className="p-2 bg-slate-50 rounded-lg flex items-center justify-between">
                              <div>
                                <div className="text-sm font-medium"># {p.numero_pago} — {fmtLongDate(p.fecha_programada)}</div>
                                <div className="text-xs text-slate-600">Programado: {fmtMoney(p.monto_pago)}</div>
                              </div>
                              <button className="px-3 py-1 bg-emerald-600 text-white rounded-lg" onClick={() => abrirPagar(p)}>Pagar</button>
                            </div>
                          ))}
                          <div className="flex items-center justify-end gap-2 pt-2">
                            <button className="px-2 py-1 border rounded" disabled={mpageP===1} onClick={()=>setMpageP(p=>p-1)}>«</button>
                            <span className="text-sm">Página {mpageP}</span>
                            <button className="px-2 py-1 border rounded" disabled={mpageP*pageSize>=pendientes.length} onClick={()=>setMpageP(p=>p+1)}>»</button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Realizados */}
                    <div className="border rounded-xl p-3">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-semibold">Pagos realizados</h5>
                        <div className="flex gap-2">
                          <input type="date" className="px-2 py-1 border rounded-lg" value={realFrom} onChange={e => setRealFrom(e.target.value)} />
                          <input type="date" className="px-2 py-1 border rounded-lg" value={realTo} onChange={e => setRealTo(e.target.value)} />
                          <button className="px-3 py-1 bg-blue-600 text-white rounded-lg" onClick={() => cargarModalListas(modalSocio)}>Filtrar</button>
                        </div>
                      </div>
                      {pagReal.length === 0 ? (
                        <p className="text-slate-600 text-sm">Sin realizados.</p>
                      ) : (
                        <div className="space-y-2">
                          {pagReal.map(p => (
                            <div key={p.id_pago} className="p-2 bg-slate-50 rounded-lg">
                              <div className="text-sm">
                                Pago #{p.numero_pago} — {p.fecha_hora_pago ? fmt12h(p.fecha_hora_pago) : (p.fecha_pago || '')}
                              </div>
                              <div className="text-xs text-slate-600">
                                Monto: {fmtMoney(p.monto_pagado)} · Interés: {fmtMoney(p.interes_pagado)} · Capital: {fmtMoney(p.capital_pagado)} {p.nota ? `· Nota: ${p.nota}` : ''}
                              </div>
                            </div>
                          ))}
                          <div className="flex items-center justify-end gap-2 pt-2">
                            <button className="px-2 py-1 border rounded" disabled={mpageR===1} onClick={()=>setMpageR(p=>p-1)}>«</button>
                            <span className="text-sm">Página {mpageR}</span>
                            <button className="px-2 py-1 border rounded" disabled={mpageR*pageSize>=realizados.length} onClick={()=>setMpageR(p=>p+1)}>»</button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Caja de pago seleccionado */}
                  {pagoSel && (
                    <div className="mt-4 border rounded-xl p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold">Pagar # {pagoSel.numero_pago} — {fmtLongDate(pagoSel.fecha_programada)}</div>
                          <div className="text-sm text-slate-600">Programado: {fmtMoney(pagoSel.monto_pago)}</div>
                        </div>
                        <button className="px-3 py-1 rounded-lg bg-slate-100" onClick={()=>setPagoSel(null)}>Cancelar</button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-3">
                        <input type="number" min="0" step="0.01" className="px-3 py-2 border rounded-lg" value={montoPagar} onChange={e=>setMontoPagar(e.target.value)} placeholder="Monto a pagar" />
                        <label className="flex items-center gap-2 text-sm">
                          <input type="checkbox" checked={parcial} onChange={e=>setParcial(e.target.checked)} />
                          Pago parcial
                        </label>
                        <input type="text" className="px-3 py-2 border rounded-lg md:col-span-2" value={nota} onChange={e=>setNota(e.target.value)} placeholder="Nota (opcional)" />
                      </div>
                      <div className="flex justify-end mt-3 gap-2">
                        <button className="px-4 py-2 bg-emerald-600 text-white rounded-lg" disabled={saving} onClick={()=>{
                          if (window.confirm('¿Confirma que desea realizar el pago?')) confirmarPagar();
                        }}>
                          {saving ? 'Aplicando…' : 'Aplicar pago'}
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Detalle de tarjetas */}
      {showCardModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-6xl shadow-xl">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">{cardModalTitle}</h3>
              <button className="px-3 py-1 rounded-lg bg-slate-100" onClick={() => setShowCardModal(false)}>Cerrar</button>
            </div>

            <div className="p-4 max-h-[70vh] overflow-y-auto">
              {cardModalLoading && <p className="text-slate-600">Cargando…</p>}
              {cardModalError && <p className="text-red-600">{cardModalError}</p>}
              {!cardModalLoading && !cardModalError && cardModalRows.length === 0 && (
                <p className="text-slate-600">Sin registros.</p>
              )}
              {!cardModalLoading && !cardModalError && cardModalRows.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="text-left py-2 px-3">ID Socio</th>
                        <th className="text-left py-2 px-3">Nombre completo</th>
                        <th className="text-left py-2 px-3"># Pago</th>
                        <th className="text-left py-2 px-3">Fecha</th>
                        <th className="text-left py-2 px-3">Monto</th>
                        <th className="text-left py-2 px-3">Frecuencia / Nota</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cardModalRows.map(row => {
                        const fechaBase = (cardModalKind === 'recibidos')
                          ? (row.fecha_hora_pago || row.fecha_pago)
                          : row.fecha_programada;
                        const fechaTxt = fmtLongDate(fechaBase);

                        const montoTxt = (row.monto_pagado != null)
                          ? fmtMoney(row.monto_pagado)
                          : fmtMoney(row.monto_pago);

                        const ultCol = row.nota ? row.nota : (row.frecuencia ?? '—');

                        return (
                          <tr key={row.id_pago} className="border-b border-slate-100">
                            <td className="py-2 px-3">{row.id_socio ?? '—'}</td>
                            <td className="py-2 px-3">{row.nombre_completo ?? '—'}</td>
                            <td className="py-2 px-3">{row.numero_pago}</td>
                            <td className="py-2 px-3">
                              {fechaTxt}
                              {cardModalKind === 'vencidos' && row.fecha_programada && daysDiff(row.fecha_programada) > 0 && (
                                <span className="ml-2 text-xs text-red-600">
                                  ({daysDiff(row.fecha_programada)} día(s) de atraso)
                                </span>
                              )}
                            </td>
                            <td className="py-2 px-3">{montoTxt}</td>
                            <td className="py-2 px-3">{ultCol}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PagosModule;
