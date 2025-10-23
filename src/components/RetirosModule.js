import React, { useEffect, useMemo, useState } from 'react';

const SUPABASE_URL = 'https://ubfkhtkmlvutwdivmoff.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InViZmtodGttbHZ1dHdkaXZtb2ZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4MTc5NTUsImV4cCI6MjA2NjM5Mzk1NX0.c0iRma-dnlL29OR3ffq34nmZuj_ViApBTMG-6PEX_B4';

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

/** ISO local con offset: 2025-10-22T14:35:10-06:00 (NO hay desfase) */
function nowLocalISOWithTZ(now = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  const yyyy = now.getFullYear();
  const MM = pad(now.getMonth() + 1);
  const dd = pad(now.getDate());
  const hh = pad(now.getHours());
  const mm = pad(now.getMinutes());
  const ss = pad(now.getSeconds());

  const offsetMin = -now.getTimezoneOffset(); // ej. -360 → -06:00
  const sign = offsetMin >= 0 ? '+' : '-';
  const abs = Math.abs(offsetMin);
  const oh = pad(Math.floor(abs / 60));
  const om = pad(abs % 60);

  return `${yyyy}-${MM}-${dd}T${hh}:${mm}:${ss}${sign}${oh}:${om}`;
}

/**
 * Convierte lo que venga de la BD a Date local:
 * - Si trae 'Z' o ±HH:MM, se respeta.
 * - Si NO trae zona (ej. '2025-10-22T14:35:10'), lo tratamos como UTC (añadimos 'Z')
 *   para que al renderizar se vea correcto en local.
 */
function parseDBDateToLocal(s) {
  if (!s) return null;
  const hasTZ = /([zZ]|[+\-]\d{2}:\d{2})$/.test(s);
  const str = hasTZ ? s : `${s}Z`;
  return new Date(str);
}

function warn(msg) {
  window.alert(msg);
}

const RetirosModule = () => {
  // --------- tarjetas superiores ----------
  const [retirosHoyCount, setRetirosHoyCount] = useState(0);
  const [retirosHoyMonto, setRetirosHoyMonto] = useState(0);
  const [loadingTop, setLoadingTop] = useState(true);

  // --------- búsqueda de socio ----------
  const [term, setTerm] = useState('');
  const [sugs, setSugs] = useState([]);
  const [socioSel, setSocioSel] = useState(null);

  // --------- info financiera del socio ----------
  const [ahorroTotal, setAhorroTotal] = useState(0);
  const [deudaPendiente, setDeudaPendiente] = useState(0);
  const [cargandoFinanzas, setCargandoFinanzas] = useState(false);
  const disponible = useMemo(() => Math.max(0, Number(ahorroTotal) - Number(deudaPendiente)), [ahorroTotal, deudaPendiente]);

  // --------- retiros del socio ----------
  const [retirosSocio, setRetirosSocio] = useState([]);
  const [cargandoRetiros, setCargandoRetiros] = useState(false);

  // --------- flujo de retiro ----------
  const [showResumenModal, setShowResumenModal] = useState(false);
  const [showMontoModal, setShowMontoModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const [montoRetiro, setMontoRetiro] = useState('');
  const [nota, setNota] = useState('');
  const [formaRetiro, setFormaRetiro] = useState(''); // 'Efectivo' | 'Transferencia'
  const [aplicando, setAplicando] = useState(false);

  // =================== cargar tarjetas "Retiros del día" ===================
  useEffect(() => {
    (async () => {
      try {
        const hoy = toDateInput(new Date());
        const r = await fetch(
          `${SUPABASE_URL}/rest/v1/retiros?fecha_retiro=eq.${hoy}&select=monto_retirado`,
          { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } }
        );
        const data = await r.json();
        setRetirosHoyCount(data.length);
        setRetirosHoyMonto(data.reduce((s, x) => s + Number(x.monto_retirado || 0), 0));
      } catch {
        setRetirosHoyCount(0);
        setRetirosHoyMonto(0);
      } finally {
        setLoadingTop(false);
      }
    })();
  }, []);

  // =================== sugerencias de socio ===================
  useEffect(() => {
    const run = async () => {
      const t = term.trim().toLowerCase();
      if (!t) { setSugs([]); return; }
      const r = await fetch(
        `${SUPABASE_URL}/rest/v1/socios?select=id_socio,nombre,apellido_paterno,apellido_materno`,
        { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } }
      );
      const data = await r.json();
      const fil = data.filter(s =>
        String(s.id_socio).includes(t) ||
        `${s.nombre} ${s.apellido_paterno} ${s.apellido_materno}`.toLowerCase().includes(t)
      ).slice(0, 20);
      setSugs(fil);
    };
    run();
  }, [term]);

  // =================== al seleccionar socio: cargar finanzas ===================
  const onSelectSocio = async (s) => {
    setSocioSel(s);
    setSugs([]);
    setTerm(`${s.id_socio} — ${s.nombre} ${s.apellido_paterno} ${s.apellido_materno}`);
    await Promise.all([cargarFinanzas(s.id_socio), cargarRetirosSocio(s.id_socio)]);
  };

  const cargarFinanzas = async (id_socio) => {
    setCargandoFinanzas(true);
    try {
      // AHORRO ACUMULADO (sumatoria de movimientos positivos/negativos)
      const ra = await fetch(
        `${SUPABASE_URL}/rest/v1/ahorros?id_socio=eq.${id_socio}&select=ahorro_aportado`,
        { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } }
      );
      const ah = await ra.json();
      const totalAhorro = ah.reduce((s, x) => s + Number(x.ahorro_aportado || 0), 0);
      setAhorroTotal(totalAhorro);

      // DEUDA PENDIENTE (pagos pendientes)
      const rd = await fetch(
        `${SUPABASE_URL}/rest/v1/pagos_prestamos?id_socio=eq.${id_socio}&estatus=eq.pendiente&select=monto_pago`,
        { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } }
      );
      const deudaRows = await rd.json();
      const totalDeuda = deudaRows.reduce((s, x) => s + Number(x.monto_pago || 0), 0);
      setDeudaPendiente(totalDeuda);
    } catch {
      setAhorroTotal(0);
      setDeudaPendiente(0);
    } finally {
      setCargandoFinanzas(false);
    }
  };

  const cargarRetirosSocio = async (id_socio) => {
    setCargandoRetiros(true);
    try {
      const r = await fetch(
        `${SUPABASE_URL}/rest/v1/retiros?id_socio=eq.${id_socio}&select=id_retiro,monto_retirado,fecha_retiro,fecha_hora,nota,forma_retiro&order=fecha_hora.desc`,
        { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } }
      );
      const data = await r.json();
      setRetirosSocio(data);
    } catch {
      setRetirosSocio([]);
    } finally {
      setCargandoRetiros(false);
    }
  };

  // =================== flujo de retiro ===================
  const abrirResumen = () => {
    if (!socioSel) return warn('Seleccione un socio.');
    setShowResumenModal(true);
  };

  const abrirMonto = () => {
    setMontoRetiro('');
    setNota('');
    setFormaRetiro('');
    setShowMontoModal(true);
  };

  const confirmarRetiro = () => {
    if (!montoRetiro || Number(montoRetiro) <= 0) {
      warn('Indique un monto válido.');
      return;
    }
    if (Number(montoRetiro) > Number(disponible)) {
      warn('El monto que pretende retirar es superior al monto disponible.');
      return;
    }
    if (!formaRetiro) {
      warn('Debe seleccionar su forma de retiro (Efectivo o Transferencia).');
      return;
    }
    setShowConfirmModal(true);
  };

  const aplicarRetiro = async () => {
    if (!socioSel) return;
    const m = Number(montoRetiro);
    if (m <= 0 || m > Number(disponible)) {
      warn('Monto inválido para retirar.');
      return;
    }
    if (!formaRetiro) {
      warn('Debe seleccionar su forma de retiro.');
      return;
    }
    setAplicando(true);
    try {
      // >>>>>>> GUARDA HORA LOCAL CON OFFSET
      const nowISO = nowLocalISOWithTZ(new Date());
      const soloFecha = nowISO.slice(0, 10);

      // 1) INSERT en retiros
      let ret = await fetch(`${SUPABASE_URL}/rest/v1/retiros`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          Prefer: 'return=representation'
        },
        body: JSON.stringify({
          id_socio: socioSel.id_socio,
          monto_retirado: m,
          fecha_retiro: soloFecha,   // solo fecha local
          fecha_hora: nowISO,        // timestamp con zona local
          forma_retiro: formaRetiro,
          nota: (nota || '').trim() || null
        })
      });

      if (!ret.ok) {
        const j = await ret.json().catch(() => ({}));
        throw new Error(`Error al registrar retiro: ${j?.message || ret.statusText}`);
      }

      // 2) Movimiento negativo en AHORROS
      const ra = await fetch(`${SUPABASE_URL}/rest/v1/ahorros`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          Prefer: 'return=representation'
        },
        body: JSON.stringify({
          id_socio: socioSel.id_socio,
          ahorro_aportado: -m,
          fecha: soloFecha,
          fecha_hora: nowISO, // también con zona local
          es_retiro: true
        })
      });
      if (!ra.ok) {
        const j = await ra.json().catch(() => ({}));
        throw new Error(`No se pudo registrar el movimiento en ahorros: ${j?.message || ra.statusText}`);
      }

      await Promise.all([cargarFinanzas(socioSel.id_socio), cargarRetirosSocio(socioSel.id_socio)]);

      setShowConfirmModal(false);
      setShowMontoModal(false);
      setShowResumenModal(false);
      warn('Retiro aplicado correctamente.');
    } catch (e) {
      warn(e.message || 'No se pudo aplicar el retiro.');
    } finally {
      setAplicando(false);
    }
  };

  // =================== render ===================
  return (
    <div className="p-6 space-y-6">
      {/* Título y tarjeta superior */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Retiros</h2>
          <p className="text-slate-600">Gestiona retiros sobre los ahorros de los socios</p>
        </div>
      </div>

      {/* Tarjeta informativa: Retiros del día */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <span className="text-blue-600">🏧</span>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Retiros del día</h3>
              {loadingTop ? (
                <p className="text-slate-500 text-sm">Cargando…</p>
              ) : (
                <>
                  <p className="text-2xl font-bold text-blue-700">{fmtMoney(retirosHoyMonto)}</p>
                  <p className="text-slate-600 text-sm">{retirosHoyCount} retiro(s)</p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Búsqueda de socio */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-3">Buscar socio</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
          <input
            type="text"
            className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl"
            placeholder="ID o Nombre completo…"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
          />
        </div>

        {sugs.length > 0 && (
          <div className="mt-3 space-y-2">
            {sugs.map(s => (
              <div key={s.id_socio} className="p-2 bg-slate-50 rounded-lg flex justify-between items-center">
                <span>ID: {s.id_socio} — {s.nombre} {s.apellido_paterno} {s.apellido_materno}</span>
                <button
                  className="px-3 py-1 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                  onClick={() => onSelectSocio(s)}
                >
                  Seleccionar
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info del socio seleccionado */}
      {socioSel && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">
              {socioSel.nombre} {socioSel.apellido_paterno} {socioSel.apellido_materno} — ID {socioSel.id_socio}
            </h3>
            <button
              className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700"
              onClick={abrirResumen}
            >
              Realizar retiro
            </button>
          </div>

          {/* Tarjetas: ahorro acumulado / deuda acumulada */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-5">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-100 text-green-700 rounded-xl flex items-center justify-center">💰</div>
                <div>
                  <p className="text-slate-600 text-sm">Ahorro acumulado</p>
                  <p className="text-2xl font-bold text-slate-900">{cargandoFinanzas ? '—' : fmtMoney(ahorroTotal)}</p>
                </div>
              </div>
            </div>
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-5">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-red-100 text-red-700 rounded-xl flex items-center justify-center">📉</div>
                <div>
                  <p className="text-slate-600 text-sm">Deuda acumulada</p>
                  <p className="text-2xl font-bold text-slate-900">{cargandoFinanzas ? '—' : fmtMoney(deudaPendiente)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Últimos retiros */}
          <div className="mt-2">
            <h4 className="font-semibold text-slate-900 mb-2">Últimos retiros</h4>
            {cargandoRetiros ? (
              <p className="text-slate-600">Cargando…</p>
            ) : retirosSocio.length === 0 ? (
              <p className="text-slate-600">Este socio no tiene retiros registrados.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-2 px-3">Fecha</th>
                      <th className="text-left py-2 px-3">Monto</th>
                      <th className="text-left py-2 px-3">Hora</th>
                      <th className="text-left py-2 px-3">Forma de retiro</th>
                      <th className="text-left py-2 px-3">Nota</th>
                    </tr>
                  </thead>
                  <tbody>
                    {retirosSocio.map(r => {
                      const dt = parseDBDateToLocal(r.fecha_hora) || parseDBDateToLocal(`${r.fecha_retiro}T00:00:00`);
                      const fecha = toDateInput(dt);
                      const hora = dt.toLocaleString('es-MX', { hour: 'numeric', minute: '2-digit', hour12: true });
                      return (
                        <tr key={r.id_retiro} className="border-b border-slate-100">
                          <td className="py-2 px-3">{fecha}</td>
                          <td className="py-2 px-3 font-semibold">{fmtMoney(r.monto_retirado)}</td>
                          <td className="py-2 px-3">{hora}</td>
                          <td className="py-2 px-3">{r.forma_retiro || '—'}</td>
                          <td className="py-2 px-3">{r.nota || '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 1: Resumen y disponible */}
      {showResumenModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-xl shadow-xl">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">Resumen para retiro</h3>
              <button className="px-3 py-1 rounded-lg bg-slate-100" onClick={() => setShowResumenModal(false)}>Cerrar</button>
            </div>
            <div className="p-5 space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-600">Ahorro acumulado:</span>
                <span className="font-semibold">{fmtMoney(ahorroTotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Deuda acumulada:</span>
                <span className="font-semibold">{fmtMoney(deudaPendiente)}</span>
              </div>
              <div className="flex justify-between border-t pt-3">
                <span className="text-slate-900 font-medium">Total disponible para retirar:</span>
                <span className="text-xl font-bold text-emerald-700">{fmtMoney(disponible)}</span>
              </div>

              <div className="flex justify-end mt-4">
                <button
                  className={`px-4 py-2 rounded-xl text-white ${disponible > 0 ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-slate-400 cursor-not-allowed'}`}
                  disabled={disponible <= 0}
                  onClick={abrirMonto}
                >
                  Retirar ahora
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Monto + forma + nota */}
      {showMontoModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">Elija la cantidad que desea retirar</h3>
              <button className="px-3 py-1 rounded-lg bg-slate-100" onClick={() => setShowMontoModal(false)}>Cerrar</button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm text-slate-700 mb-1">Monto (máximo {fmtMoney(disponible)})</label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={montoRetiro}
                  onChange={(e) => setMontoRetiro(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg"
                  placeholder="0.00"
                />
              </div>

              <div>
                <p className="block text-sm text-slate-700 mb-2">Seleccione la forma de retiro</p>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="forma_retiro"
                      value="Efectivo"
                      checked={formaRetiro === 'Efectivo'}
                      onChange={(e) => setFormaRetiro(e.target.value)}
                    />
                    <span>Efectivo</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="forma_retiro"
                      value="Transferencia"
                      checked={formaRetiro === 'Transferencia'}
                      onChange={(e) => setFormaRetiro(e.target.value)}
                    />
                    <span>Transferencia</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm text-slate-700 mb-1">
                  Nota (opcional)
                </label>
                <textarea
                  value={nota}
                  onChange={(e) => setNota(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg"
                  rows={3}
                  placeholder="Ejemplo: Retiro por problema familiar"
                />
              </div>

              <div className="flex justify-end gap-3">
                <button className="px-4 py-2 bg-slate-200 rounded-xl" onClick={() => setShowMontoModal(false)}>Cancelar</button>
                <button
                  className="px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700"
                  onClick={confirmarRetiro}
                >
                  Aplicar retiro
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Confirmación */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl">
            <div className="p-6 text-center">
              <h3 className="text-lg font-bold text-slate-900 mb-2">Confirmar retiro</h3>
              <p className="text-slate-700 mb-1">
                ¿Está seguro que desea retirar <span className="font-semibold">{fmtMoney(montoRetiro)}</span>?
              </p>
              <p className="text-slate-600 mb-4">
                Forma de retiro: <span className="font-semibold">{formaRetiro || '—'}</span>
              </p>
              <div className="flex justify-center gap-3">
                <button
                  className="px-5 py-2 bg-slate-200 rounded-xl"
                  onClick={() => setShowConfirmModal(false)}
                  disabled={aplicando}
                >
                  Cancelar
                </button>
                <button
                  className={`px-5 py-2 rounded-xl text-white ${aplicando ? 'bg-emerald-400' : 'bg-emerald-600 hover:bg-emerald-700'}`}
                  onClick={aplicarRetiro}
                  disabled={aplicando}
                >
                  {aplicando ? 'Aplicando…' : 'Aceptar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RetirosModule;
