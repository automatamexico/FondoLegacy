// src/components/MultasRenovacionesModule.js
import React, { useEffect, useMemo, useState } from 'react';

const SUPABASE_URL = 'https://ubfkhtkmlvutwdivmoff.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InViZmtodGttbHZ1dHdkaXZtb2ZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4MTc5NTUsImV4cCI6MjA2NjM5Mzk1NX0.c0iRma-dnlL29OR3ffq34nmZuj_ViApBTMG-6PEX_B4';

// ===== Helpers de fechas / formato =====
function toLocalDate(dateLike) {
  if (!dateLike) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateLike)) return new Date(`${dateLike}T00:00:00`);
  return new Date(dateLike);
}
function addYears(d, n) { const nd = new Date(d.getTime()); nd.setFullYear(nd.getFullYear() + n); return nd; }
function addDays(d, n) { const nd = new Date(d.getTime()); nd.setDate(nd.getDate() + n); return nd; }
function startOfToday() { const t = new Date(); return new Date(t.getFullYear(), t.getMonth(), t.getDate()); }
function money(n) { return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(Number(n || 0)); }
function localPlainDateTime() { const d = new Date(); const y=d.getFullYear(); const M=String(d.getMonth()+1).padStart(2,'0'); const D=String(d.getDate()).padStart(2,'0'); const h=String(d.getHours()).padStart(2,'0'); const m=String(d.getMinutes()).padStart(2,'0'); const s=String(d.getSeconds()).padStart(2,'0'); return `${y}-${M}-${D}T${h}:${m}:${s}`; }

const MultasRenovacionesModule = () => {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  const [socios, setSocios] = useState([]);
  const [pagosAfiliacion, setPagosAfiliacion] = useState([]);

  const [showListadoModal, setShowListadoModal] = useState(false);
  const [selSocio, setSelSocio] = useState(null);

  const [showPagarModal, setShowPagarModal] = useState(false);
  const [montoAfiliacion, setMontoAfiliacion] = useState('');
  const [guardandoPago, setGuardandoPago] = useState(false);
  const [toast, setToast] = useState('');

  // ===== Carga inicial =====
  useEffect(() => {
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const rSoc = await fetch(
          `${SUPABASE_URL}/rest/v1/socios?select=id_socio,nombre,apellido_paterno,apellido_materno,miembro_desde&order=id_socio.asc`,
          { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } }
        );
        if (!rSoc.ok) throw new Error('No se pudieron cargar los socios');
        const sociosData = await rSoc.json();

        const rPag = await fetch(
          `${SUPABASE_URL}/rest/v1/pago_afiliaciones?select=id_socio,fecha_hora,estatus,monto_afiliacion_papeleria`,
          { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } }
        );
        if (!rPag.ok) throw new Error('No se pudieron cargar los pagos de afiliación');
        const pagosData = await rPag.json();

        setSocios(sociosData || []);
        setPagosAfiliacion(pagosData || []);
      } catch (e) {
        setErr(e.message || 'Error desconocido');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ===== Último pago por socio (estatus correcto) =====
  const lastPaidMap = useMemo(() => {
    const map = new Map();
    for (const p of pagosAfiliacion) {
      if ((p.estatus || '').toUpperCase() !== 'AFILIACION PAGADA') continue;
      const d = toLocalDate(p.fecha_hora);
      if (!d) continue;
      const prev = map.get(p.id_socio);
      if (!prev || d > prev) map.set(p.id_socio, d);
    }
    return map;
  }, [pagosAfiliacion]);

  // ===== Próximas renovaciones =====
  const proximasRenovaciones = useMemo(() => {
    const hoy = startOfToday();
    const resultados = [];
    for (const s of socios) {
      const miembroDesde = toLocalDate(s.miembro_desde);
      const ultimoPago = lastPaidMap.get(s.id_socio) || null;
      const ancla = ultimoPago || miembroDesde;
      if (!ancla) continue;
      let proxima = addYears(ancla, 1);
      while (proxima <= hoy) proxima = addYears(proxima, 1);
      const inicioVentana = addDays(proxima, -30);
      if (hoy >= inicioVentana) {
        resultados.push({
          id_socio: s.id_socio,
          nombre: `${s.nombre} ${s.apellido_paterno} ${s.apellido_materno}`,
          proxima_renovacion: proxima
        });
      }
    }
    resultados.sort((a, b) => a.proxima_renovacion - b.proxima_renovacion);
    return resultados;
  }, [socios, lastPaidMap]);

  // ======== ACUMULADO DE AFILIACIONES (ÚNICO CAMBIO SOLICITADO) ========
  const kpiAcumuladoAfiliaciones = useMemo(() => {
    return pagosAfiliacion
      .filter(p => (p.estatus || '').toUpperCase() === 'AFILIACION PAGADA')
      .reduce((sum, p) => sum + Number(p.monto_afiliacion_papeleria || 0), 0);
  }, [pagosAfiliacion]);
  // =====================================================================

  const kpiProximasRenovaciones = proximasRenovaciones.length;
  const kpiAcumuladoMultasHoja = 0;
  const kpiAcumuladoMoras = 0;

  const abrirListado = () => { setSelSocio(null); setShowListadoModal(true); };
  const cerrarListado = () => { setShowListadoModal(false); setSelSocio(null); };
  const abrirPagar = () => { if (!selSocio) return; setMontoAfiliacion(''); setShowPagarModal(true); };
  const cerrarPagar = () => setShowPagarModal(false);

  const aplicarPagoAfiliacion = async () => {
    const monto = Number(montoAfiliacion);
    if (!selSocio || !monto || monto <= 0) return;
    setGuardandoPago(true);
    try {
      const body = {
        id_socio: selSocio.id_socio,
        monto_afiliacion_papeleria: monto,
        fecha_hora: localPlainDateTime(),
        estatus: 'AFILIACION PAGADA'
      };
      const r = await fetch(`${SUPABASE_URL}/rest/v1/pago_afiliaciones`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          Prefer: 'return=representation'
        },
        body: JSON.stringify(body)
      });
      if (!r.ok) throw new Error('No se pudo registrar el pago');
      const inserted = await r.json();
      setPagosAfiliacion(prev => [...prev, ...(inserted || [])]);
      setToast('Afiliación renovada correctamente.');
      setTimeout(() => setToast(''), 2500);
      setShowPagarModal(false);
      setSelSocio(null);
    } catch (e) {
      alert(e.message || 'No se pudo registrar el pago.');
    } finally {
      setGuardandoPago(false);
    }
  };

  const cards = [
    {
      id: 'proximas',
      title: 'Próximas Renovaciones',
      value: kpiProximasRenovaciones.toLocaleString(),
      bg: 'bg-blue-100',
      text: 'text-blue-800',
      onClick: () => { setSelSocio(null); setShowListadoModal(true); },
      icon: (
        <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            d="M8 7V3m8 4V3M5 11h14M5 19h14a2 2 0 002-2v-8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      )
    },
    {
      id: 'afiliaciones',
      title: 'Acumulado de Afiliaciones',
      value: money(kpiAcumuladoAfiliaciones),
      bg: 'bg-green-100',
      text: 'text-green-800',
      icon: (
        <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
        </svg>
      )
    },
    {
      id: 'multas',
      title: 'Acumulado de multas por hoja',
      value: money(kpiAcumuladoMultasHoja),
      bg: 'bg-orange-100',
      text: 'text-orange-800',
      icon: (
        <svg className="w-7 h-7 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            d="M9 12h6m-7 4h8M7 7h10a2 2 0 012 2v8a2 2 0 01-2 2H7a2 2 0 01-2-2V9a2 2 0 012-2z" />
        </svg>
      )
    },
    {
      id: 'moras',
      title: 'Acumulado de moras',
      value: money(kpiAcumuladoMoras),
      bg: 'bg-purple-100',
      text: 'text-purple-800',
      icon: (
        <svg className="w-7 h-7 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a2 2 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      )
    }
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Multas y Renovaciones</h2>
          <p className="text-slate-600">Control de afiliaciones, renovaciones y sanciones</p>
        </div>
      </div>

      {loading && <p className="text-center text-slate-600">Cargando…</p>}
      {err && !loading && <p className="text-center text-red-600">Error: {err}</p>}

      {!loading && !err && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {cards.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={c.onClick}
                className={`${c.bg} rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all text-left ${c.onClick ? 'cursor-pointer' : 'cursor-default'}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className={`text-lg font-semibold ${c.text}`}>{c.title}</h3>
                  <div className="p-2 bg-white bg-opacity-40 rounded-full">{c.icon}</div>
                </div>
                <div className={`text-3xl font-bold ${c.text}`}>{c.value}</div>
                {c.id === 'proximas' && <div className="text-sm mt-2 text-slate-700">Click para ver detalle</div>}
              </button>
            ))}
          </div>
        </>
      )}

      {/* Los modales y lógica de pago permanecen igual que antes */}
      {showListadoModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl shadow-xl">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">Próximas Renovaciones (30 días)</h3>
              <button className="px-3 py-1 rounded-lg bg-slate-100" onClick={cerrarListado}>Cerrar</button>
            </div>

            <div className="p-4">
              {proximasRenovaciones.length === 0 ? (
                <p className="text-slate-600">No hay socios próximos a renovar.</p>
              ) : (
                <>
                  <div className="max-h-[55vh] overflow-y-auto rounded-lg border border-slate-200">
                    <table className="w-full">
                      <thead className="bg-slate-50 sticky top-0">
                        <tr className="border-b border-slate-200">
                          <th className="text-left py-3 px-4 text-slate-700">Seleccionar</th>
                          <th className="text-left py-3 px-4 text-slate-700">ID Socio</th>
                          <th className="text-left py-3 px-4 text-slate-700">Nombre</th>
                          <th className="text-left py-3 px-4 text-slate-700">Próxima renovación</th>
                        </tr>
                      </thead>
                      <tbody>
                        {proximasRenovaciones.map((r) => {
                          const seleccionado = selSocio?.id_socio === r.id_socio;
                          return (
                            <tr key={r.id_socio} className="border-b border-slate-100 hover:bg-slate-50">
                              <td className="py-3 px-4">
                                <input type="radio" name="selSocioRenov" checked={seleccionado} onChange={() => setSelSocio(r)} />
                              </td>
                              <td className="py-3 px-4">{r.id_socio}</td>
                              <td className="py-3 px-4">{r.nombre}</td>
                              <td className="py-3 px-4">
                                {r.proxima_renovacion.toLocaleDateString('es-MX', { year: 'numeric', month: '2-digit', day: '2-digit' })}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex justify-end gap-3 mt-4">
                    <button
                      className={`px-4 py-2 rounded-xl text-white ${selSocio ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-slate-400 cursor-not-allowed'}`}
                      disabled={!selSocio}
                      onClick={() => { if (!selSocio) return; setMontoAfiliacion(''); setShowPagarModal(true); }}
                    >
                      Renovar Afiliación
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {showPagarModal && selSocio && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl p-5">
            <h3 className="text-lg font-semibold mb-2">Renovar Afiliación</h3>
            <p className="text-slate-700 mb-4">
              Socio <span className="font-semibold">{selSocio.nombre}</span> (ID {selSocio.id_socio})
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-700 mb-1">Monto de afiliación</label>
                <input
                  type="number" min="0" step="0.01"
                  className="w-full px-3 py-2 border rounded-lg"
                  value={montoAfiliacion}
                  onChange={(e) => setMontoAfiliacion(e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button className="px-4 py-2 rounded-lg bg-slate-100" onClick={cerrarPagar}>Cancelar</button>
                <button
                  className={`px-4 py-2 rounded-lg text-white ${Number(montoAfiliacion) > 0 && !guardandoPago ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-slate-400 cursor-not-allowed'}`}
                  onClick={aplicarPagoAfiliacion}
                  disabled={!(Number(montoAfiliacion) > 0) || guardandoPago}
                >
                  {guardandoPago ? 'Guardando…' : 'Aceptar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-4 right-4 bg-emerald-600 text-white px-6 py-3 rounded-xl shadow-lg z-50">
          {toast}
        </div>
      )}
    </div>
  );
};

export default MultasRenovacionesModule;
