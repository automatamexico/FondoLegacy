// src/components/PagosModule.js
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

const PagosModule = ({ idSocio }) => {
  // ---------- TARJETAS (SIN CAMBIOS) ----------
  const [loading, setLoading] = useState(true);
  const [dashError, setDashError] = useState(null);

  const [pendientesHoy, setPendientesHoy] = useState(0);
  const [proximos, setProximos] = useState(0);
  const [recibidosHoyCount, setRecibidosHoyCount] = useState(0);
  const [recibidosHoyMonto, setRecibidosHoyMonto] = useState(0);
  const [vencidos, setVencidos] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const now = new Date();
        const hoy = toDateInput(now);
        const d1 = toDateInput(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1));
        const d2 = toDateInput(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2));
        const d3 = toDateInput(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 3));

        const r1 = await fetch(
          `${SUPABASE_URL}/rest/v1/pagos_prestamos?fecha_programada=eq.${hoy}&estatus=eq.pendiente&select=id_pago`,
          { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}`, Prefer: 'count=exact', 'Range-Unit': 'items', Range: '0-0' } }
        );
        const c1 = parseInt(r1.headers.get('content-range')?.split('/')?.[1] || '0', 10);
        setPendientesHoy(c1);

        const r2 = await fetch(
          `${SUPABASE_URL}/rest/v1/pagos_prestamos?or=(fecha_programada.eq.${d1},fecha_programada.eq.${d2},fecha_programada.eq.${d3})&estatus=eq.pendiente&select=id_pago`,
          { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}`, Prefer: 'count=exact', 'Range-Unit': 'items', Range: '0-0' } }
        );
        const c2 = parseInt(r2.headers.get('content-range')?.split('/')?.[1] || '0', 10);
        setProximos(c2);

        const r3 = await fetch(
          `${SUPABASE_URL}/rest/v1/pagos_prestamos?fecha_pago=eq.${hoy}&select=monto_pagado`,
          { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } }
        );
        const data3 = await r3.json();
        setRecibidosHoyCount(data3.length);
        setRecibidosHoyMonto(data3.reduce((s, x) => s + Number(x.monto_pagado || 0), 0));

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

  // ---------- BUSCAR SOCIO (SECCIÓN SIMPLIFICADA) ----------
  const [buscarSocioTerm, setBuscarSocioTerm] = useState('');
  const [sugSocios, setSugSocios] = useState([]);
  const [socioSel, setSocioSel] = useState(null);

  // Ver Préstamos / selección de préstamo
  const [prestamosSocio, setPrestamosSocio] = useState([]);
  const [prestamoSel, setPrestamoSel] = useState(null);

  // Modal de pagos programados del préstamo
  const [showPagoModal, setShowPagoModal] = useState(false);
  const [pagosProgramados, setPagosProgramados] = useState([]);
  const [prestamoMeta, setPrestamoMeta] = useState(null); // {monto_solicitado, numero_plazos, interes}

  // Sub-modal: ingresar monto
  const [showMontoModal, setShowMontoModal] = useState(false);
  const [pagoTarget, setPagoTarget] = useState(null);
  const [montoIngresado, setMontoIngresado] = useState('');

  // Confirmación final
  const [showConfirm, setShowConfirm] = useState(false);
  const [saving, setSaving] = useState(false);

  // Sugerencias de socios por texto
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

  const verPrestamos = async () => {
    if (!socioSel) return;
    const r = await fetch(
      `${SUPABASE_URL}/rest/v1/prestamos?id_socio=eq.${socioSel.id_socio}&select=id_prestamo,monto_solicitado,numero_plazos,interes,tipo_plazo`,
      { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } }
    );
    const data = await r.json();
    setPrestamosSocio(data);
    setPrestamoSel(null);
  };

  const abrirRealizarPago = async () => {
    if (!prestamoSel) return;
    // Cargar pagos programados y meta del préstamo
    const [rp, rmeta] = await Promise.all([
      fetch(
        `${SUPABASE_URL}/rest/v1/pagos_prestamos?id_prestamo=eq.${prestamoSel.id_prestamo}&select=id_pago,numero_pago,fecha_programada,monto_pago,fecha_pago,fecha_hora_pago,monto_pagado,interes_pagado,capital_pagado,estatus&order=numero_pago.asc`,
        { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } }
      ),
      fetch(
        `${SUPABASE_URL}/rest/v1/prestamos?id_prestamo=eq.${prestamoSel.id_prestamo}&select=monto_solicitado,numero_plazos,interes`,
        { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } }
      )
    ]);
    const pagos = await rp.json();
    const metaArr = await rmeta.json();
    const meta = metaArr?.[0] || null;

    setPrestamoMeta(meta);
    setPagosProgramados(pagos);
    setShowPagoModal(true);
  };

  // Abrir sub-modal para capturar monto manual del pago seleccionado
  const onClickRealizarPagoFila = (p) => {
    setPagoTarget(p);
    setMontoIngresado(p.monto_pago || '');
    setShowMontoModal(true);
  };

  // Aplicar pago -> abre confirmación final
  const aplicarPago = () => {
    if (!montoIngresado || Number(montoIngresado) <= 0) {
      alert('Indique un monto válido.');
      return;
    }
    setShowConfirm(true);
  };

  // Confirmar y guardar en BD
  const confirmarAplicacionPago = async () => {
    if (!pagoTarget || !prestamoMeta) return;
    setSaving(true);
    try {
      const monto = Number(montoIngresado);
      const capitalEstimado = Number(prestamoMeta.monto_solicitado) / Number(prestamoMeta.numero_plazos || 1);
      const interesEstimado = Number(prestamoMeta.monto_solicitado) * (Number(prestamoMeta.interes) / 100);
      const totalPeriodo = capitalEstimado + interesEstimado;

      const interes_pagado = Math.min(monto, interesEstimado);
      const capital_pagado = Math.min(Math.max(monto - interes_pagado, 0), capitalEstimado);

      const nowLocalISO = toLocalISO(new Date());
      const soloFecha = nowLocalISO.slice(0, 10);

      const body = {
        fecha_pago: soloFecha,
        fecha_hora_pago: nowLocalISO,
        estatus: monto >= totalPeriodo ? 'pagado' : 'parcial',
        monto_pagado: monto,
        interes_pagado,
        capital_pagado
      };

      const r = await fetch(
        `${SUPABASE_URL}/rest/v1/pagos_prestamos?id_pago=eq.${pagoTarget.id_pago}`,
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
      if (!r.ok) throw new Error('No se pudo registrar el pago');

      // Refrescar lista del modal
      await abrirRealizarPago();

      // Cerrar sub-modales
      setShowConfirm(false);
      setShowMontoModal(false);
      setPagoTarget(null);
      setMontoIngresado('');
    } catch (e) {
      alert('No se pudo registrar el pago.');
    } finally {
      setSaving(false);
    }
  };

  // ---------- RENDER ----------
  return (
    <div className="p-6 space-y-6">
      {/* Encabezado y botón superior (SIN CAMBIOS) */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Pagos</h2>
          <p className="text-slate-600">Consulta el detalle de pago de los socios</p>
        </div>
        {/* Botón global original (se deja) */}
        <button
          onClick={() => { /* se conserva sin acción adicional */ }}
          className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
        >
          Realizar pago
        </button>
      </div>

      {/* Tarjetas (SIN CAMBIOS) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center"><span className="text-red-600">⏲️</span></div>
            <div>
              <h3 className="font-semibold text-slate-900">Pendientes del día</h3>
              <p className="text-2xl font-bold text-red-600">{pendientesHoy}</p>
              {dashError && <p className="text-xs text-red-500">{dashError}</p>}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center"><span className="text-yellow-600">📅</span></div>
            <div>
              <h3 className="font-semibold text-slate-900">Próximos pagos</h3>
              <p className="text-2xl font-bold text-yellow-600">{proximos}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center"><span className="text-green-600">💵</span></div>
            <div>
              <h3 className="font-semibold text-slate-900">Total recibido hoy</h3>
              <p className="text-2xl font-bold text-green-600">{fmtMoney(recibidosHoyMonto)}</p>
              <p className="text-sm text-slate-600">{recibidosHoyCount} pagos</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center"><span className="text-purple-600">⏰</span></div>
            <div>
              <h3 className="font-semibold text-slate-900">Pagos vencidos</h3>
              <p className="text-2xl font-bold text-purple-600">{vencidos}</p>
            </div>
          </div>
        </div>
      </div>

      {/* === BUSCAR SOCIO (solo input + flujo Prestamos/Pago) === */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-3">Buscar Socio</h3>

        {/* Campo único de búsqueda */}
        <div className="grid grid-cols-1 md:grid-cols-1 gap-3 items-center">
          <input
            type="text"
            className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl"
            placeholder="ID o Nombre completo…"
            value={buscarSocioTerm}
            onChange={(e) => { setBuscarSocioTerm(e.target.value); setSocioSel(null); setPrestamosSocio([]); setPrestamoSel(null); }}
          />
        </div>

        {/* Sugerencias */}
        {sugSocios.length > 0 && (
          <div className="mt-3 space-y-2">
            {sugSocios.map(s => (
              <div key={s.id_socio} className="p-2 bg-slate-50 rounded-lg flex justify-between">
                <span>ID: {s.id_socio} — {s.nombre} {s.apellido_paterno} {s.apellido_materno}</span>
                <button
                  className="px-3 py-1 bg-emerald-600 text-white rounded-lg"
                  onClick={() => {
                    setSocioSel(s);
                    setBuscarSocioTerm(`ID: ${s.id_socio} — ${s.nombre} ${s.apellido_paterno} ${s.apellido_materno}`);
                    setSugSocios([]);
                    setPrestamosSocio([]);
                    setPrestamoSel(null);
                  }}
                >
                  Seleccionar
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Botón Ver Préstamos */}
        <div className="mt-4">
          <button
            className={`px-4 py-2 rounded-xl text-white ${socioSel ? 'bg-blue-600 hover:bg-blue-700' : 'bg-slate-400 cursor-not-allowed'}`}
            disabled={!socioSel}
            onClick={verPrestamos}
          >
            Ver Préstamos
          </button>
        </div>

        {/* Lista de préstamos del socio */}
        {prestamosSocio.length > 0 && (
          <div className="mt-4">
            <h4 className="font-semibold text-slate-900 mb-2">Préstamos de {socioSel?.nombre} {socioSel?.apellido_paterno}</h4>
            <div className="space-y-2">
              {prestamosSocio.map(p => (
                <label key={p.id_prestamo} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="prestamoSel"
                      checked={prestamoSel?.id_prestamo === p.id_prestamo}
                      onChange={() => setPrestamoSel(p)}
                    />
                    <span className="font-medium">
                      Préstamo #{p.id_prestamo} — {fmtMoney(p.monto_solicitado)} — {p.tipo_plazo} — {p.numero_plazos} plazos — Tasa {p.interes}%
                    </span>
                  </div>
                </label>
              ))}
            </div>

            {/* Botón Realizar pago (habilita modal) */}
            <div className="mt-4">
              <button
                className={`px-4 py-2 rounded-xl text-white ${prestamoSel ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-slate-400 cursor-not-allowed'}`}
                disabled={!prestamoSel}
                onClick={abrirRealizarPago}
              >
                Realizar pago
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL: pagos programados del préstamo */}
      {showPagoModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-5xl shadow-xl">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">
                Pagos programados — Préstamo #{prestamoSel?.id_prestamo}
              </h3>
              <button className="px-3 py-1 rounded-lg bg-slate-100" onClick={() => setShowPagoModal(false)}>Cerrar</button>
            </div>

            <div className="p-4 max-h-[70vh] overflow-y-auto">
              {(!pagosProgramados || pagosProgramados.length === 0) ? (
                <p className="text-slate-600">Sin pagos programados.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="text-left py-2 px-3">No</th>
                        <th className="text-left py-2 px-3">Fecha programada</th>
                        <th className="text-left py-2 px-3">Monto a pagar</th>
                        <th className="text-left py-2 px-3">Interés (est.)</th>
                        <th className="text-left py-2 px-3">Capital (est.)</th>
                        <th className="text-left py-2 px-3">Fecha/Hora pago</th>
                        <th className="text-left py-2 px-3">Estatus</th>
                        <th className="text-left py-2 px-3">Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pagosProgramados.map(row => {
                        const capEst = prestamoMeta ? (Number(prestamoMeta.monto_solicitado) / Number(prestamoMeta.numero_plazos || 1)) : 0;
                        const intEst = prestamoMeta ? (Number(prestamoMeta.monto_solicitado) * (Number(prestamoMeta.interes) / 100)) : 0;
                        const fechaTxt = row.fecha_hora_pago ? fmt12h(row.fecha_hora_pago) : (row.fecha_pago || '—');
                        return (
                          <tr key={row.id_pago} className="border-b border-slate-100">
                            <td className="py-2 px-3">{row.numero_pago}</td>
                            <td className="py-2 px-3">{fmtLongDate(row.fecha_programada)}</td>
                            <td className="py-2 px-3">{fmtMoney(row.monto_pago)}</td>
                            <td className="py-2 px-3">{fmtMoney(intEst)}</td>
                            <td className="py-2 px-3">{fmtMoney(capEst)}</td>
                            <td className="py-2 px-3">{fechaTxt}</td>
                            <td className="py-2 px-3">{row.estatus || 'pendiente'}</td>
                            <td className="py-2 px-3">
                              <button
                                className="px-3 py-1 bg-blue-600 text-white rounded-lg"
                                onClick={() => onClickRealizarPagoFila(row)}
                              >
                                Realizar pago
                              </button>
                            </td>
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

      {/* SUB-MODAL: ingresar monto manual */}
      {showMontoModal && pagoTarget && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl p-5">
            <h3 className="text-lg font-semibold mb-3">Realizar pago — # {pagoTarget.numero_pago}</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-slate-700 mb-1">Monto a pagar (manual)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border rounded-lg"
                  value={montoIngresado}
                  onChange={(e) => setMontoIngresado(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button className="px-4 py-2 rounded-lg bg-slate-100" onClick={() => { setShowMontoModal(false); setPagoTarget(null); }}>Cancelar</button>
                <button className="px-4 py-2 rounded-lg bg-emerald-600 text-white" onClick={aplicarPago}>Aplicar pago</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMACIÓN FINAL */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl p-5 text-center">
            <h3 className="text-lg font-semibold mb-3">¿Está seguro que desea aplicar el pago ahora?</h3>
            <p className="text-slate-700 mb-5">Se registrará el pago con el monto indicado.</p>
            <div className="flex justify-center gap-3">
              <button
                className="px-4 py-2 rounded-lg bg-slate-100"
                onClick={() => setShowConfirm(false)}
                disabled={saving}
              >
                Cancelar
              </button>
              <button
                className={`px-4 py-2 rounded-lg text-white ${saving ? 'bg-emerald-400 cursor-wait' : 'bg-emerald-600 hover:bg-emerald-700'}`}
                onClick={confirmarAplicacionPago}
                disabled={saving}
              >
                {saving ? 'Aplicando…' : 'Aceptar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PagosModule;
