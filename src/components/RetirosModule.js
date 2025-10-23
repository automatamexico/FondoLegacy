// src/components/RetirosModule.js
import React, { useEffect, useMemo, useState } from 'react';

const SUPABASE_URL = 'https://ubfkhtkmlvutwdivmoff.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InViZmtodGttbHZ1dHdkaXZtb2ZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4MTc5NTUsImV4cCI6MjA2NjM5Mzk1NX0.c0iRma-dnlL29OR3ffq34nmZuj_ViApBTMG-6PEX_B4';

const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

function fmtMoney(n) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(Number(n || 0));
}
function toDateInput(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
function fmtLongDate(s) {
  if (!s) return '';
  let d;
  if (typeof s === 'string' && s.length <= 10) d = new Date(`${s}T00:00:00`);
  else d = new Date(s);
  const dd = String(d.getDate()).padStart(2, '0');
  const mname = MONTHS[d.getMonth()];
  const yyyy = d.getFullYear();
  return `${dd}/${mname}/${yyyy}`;
}
function fmtTime12h(isoLike) {
  if (!isoLike) return '';
  const d = new Date(isoLike);
  return d.toLocaleString('es-MX', { hour: 'numeric', minute: '2-digit', hour12: true });
}

const RetirosModule = () => {
  // Tarjeta retiros del día
  const [loadingCard, setLoadingCard] = useState(true);
  const [cardError, setCardError] = useState(null);
  const [retirosHoyMonto, setRetirosHoyMonto] = useState(0);
  const [retirosHoyCount, setRetirosHoyCount] = useState(0);

  // Buscar socio
  const [buscarTerm, setBuscarTerm] = useState('');
  const [sugSocios, setSugSocios] = useState([]);
  const [socioSel, setSocioSel] = useState(null);

  // Historial de retiros del socio
  const [retirosSocio, setRetirosSocio] = useState([]);
  const [retirosError, setRetirosError] = useState(null);

  // Modal ver nota
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [noteContent, setNoteContent] = useState('');

  const totalRetiradoSocio = useMemo(
    () => retirosSocio.reduce((s, r) => s + Number(r.monto_retirado || 0), 0),
    [retirosSocio]
  );

  // Cargar tarjeta: retiros del día (desde tabla 'retiros')
  useEffect(() => {
    (async () => {
      setLoadingCard(true);
      setCardError(null);
      try {
        const hoy = toDateInput(new Date());
        const url = `${SUPABASE_URL}/rest/v1/retiros?fecha_retiro=eq.${hoy}&select=monto_retirado`;
        const r = await fetch(url, {
          headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` }
        });
        if (!r.ok) throw new Error('fetch');
        const data = await r.json();
        setRetirosHoyCount(data.length);
        setRetirosHoyMonto(data.reduce((s, x) => s + Number(x.monto_retirado || 0), 0));
      } catch {
        setCardError('No se pudieron cargar los retiros del día.');
        setRetirosHoyCount(0);
        setRetirosHoyMonto(0);
      } finally {
        setLoadingCard(false);
      }
    })();
  }, []);

  // Autocomplete de socios (desde 'socios')
  useEffect(() => {
    const run = async () => {
      const t = (buscarTerm || '').trim().toLowerCase();
      if (!t) { setSugSocios([]); return; }
      try {
        const r = await fetch(
          `${SUPABASE_URL}/rest/v1/socios?select=id_socio,nombre,apellido_paterno,apellido_materno`,
          { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } }
        );
        const data = await r.json();
        const list = data.filter(s =>
          String(s.id_socio).includes(t) ||
          `${s.nombre} ${s.apellido_paterno} ${s.apellido_materno}`.toLowerCase().includes(t)
        ).slice(0, 20);
        setSugSocios(list);
      } catch {
        setSugSocios([]);
      }
    };
    run();
  }, [buscarTerm]);

  // Cargar historial de retiros para el socio seleccionado
  const cargarRetirosSocio = async () => {
    if (!socioSel) return;
    setRetirosError(null);
    setRetirosSocio([]);
    try {
      // Traer todos los campos para mostrar: id_retiro, fecha_retiro, fecha_hora, monto_retirado, forma_retiro, nota
      const url = `${SUPABASE_URL}/rest/v1/retiros?id_socio=eq.${socioSel.id_socio}&select=*` +
                  `&order=fecha_retiro.desc&order=id_retiro.desc`;
      const r = await fetch(url, {
        headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` }
      });
      if (!r.ok) throw new Error('fetch');
      const data = await r.json();
      setRetirosSocio(data || []);
    } catch {
      setRetirosError('No se pudieron cargar los retiros del socio.');
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Tarjeta: Retiros del día */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center">
              <span className="text-rose-600">🏧</span>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Retiros del día</h3>
              <p className="text-sm text-slate-600">Monto total y cantidad</p>
            </div>
          </div>
          {loadingCard ? (
            <p className="text-slate-600">Cargando…</p>
          ) : cardError ? (
            <p className="text-red-600">{cardError}</p>
          ) : (
            <div className="mt-2">
              <div className="text-2xl font-bold text-rose-600">{fmtMoney(retirosHoyMonto)}</div>
              <div className="text-sm text-slate-600">{retirosHoyCount} retiro(s)</div>
            </div>
          )}
        </div>
      </div>

      {/* Bloque principal: RETIROS + buscador */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h2 className="text-xl font-bold text-slate-900 tracking-wide mb-4">RETIROS</h2>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 items-center">
          <input
            type="text"
            className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl"
            placeholder="Buscar socio por ID o Nombre completo…"
            value={buscarTerm}
            onChange={(e) => {
              setBuscarTerm(e.target.value);
              setSocioSel(null);
              setRetirosSocio([]);
            }}
          />
          <button
            className={`px-4 py-2 rounded-xl text-white ${socioSel ? 'bg-blue-600 hover:bg-blue-700' : 'bg-slate-400 cursor-not-allowed'}`}
            disabled={!socioSel}
            onClick={cargarRetirosSocio}
          >
            Seleccionar
          </button>
        </div>

        {sugSocios.length > 0 && (
          <div className="mt-3 space-y-2">
            {sugSocios.map(s => (
              <div key={s.id_socio} className="p-2 bg-slate-50 rounded-lg flex justify-between items-center border">
                <span className="text-slate-800">
                  ID: {s.id_socio} — {s.nombre} {s.apellido_paterno} {s.apellido_materno}
                </span>
                <button
                  className="px-3 py-1 bg-emerald-600 text-white rounded-lg"
                  onClick={() => {
                    setSocioSel(s);
                    setBuscarTerm(`ID: ${s.id_socio} — ${s.nombre} ${s.apellido_paterno} ${s.apellido_materno}`);
                    setSugSocios([]);
                    setRetirosSocio([]);
                  }}
                >
                  Elegir
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Historial de retiros del socio */}
        {socioSel && (
          <div className="mt-6">
            <h4 className="font-semibold text-slate-900 mb-2">
              Historial de retiros — {socioSel.nombre} {socioSel.apellido_paterno} {socioSel.apellido_materno}
            </h4>

            {retirosError && <p className="text-red-600">{retirosError}</p>}

            {retirosSocio.length === 0 ? (
              <p className="text-slate-600">Este socio no tiene retiros registrados.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-2 px-3">ID Retiro</th>
                      <th className="text-left py-2 px-3">Fecha</th>
                      <th className="text-left py-2 px-3">Hora</th>
                      <th className="text-left py-2 px-3">Monto</th>
                      <th className="text-left py-2 px-3">Forma de retiro</th>
                      <th className="text-left py-2 px-3">Nota</th>
                    </tr>
                  </thead>
                  <tbody>
                    {retirosSocio.map((r) => (
                      <tr key={r.id_retiro} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="py-2 px-3">{r.id_retiro}</td>
                        <td className="py-2 px-3">{fmtLongDate(r.fecha_retiro || r.fecha_hora)}</td>
                        <td className="py-2 px-3">{fmtTime12h(r.fecha_hora)}</td>
                        <td className="py-2 px-3 font-semibold">{fmtMoney(r.monto_retirado)}</td>
                        <td className="py-2 px-3">{r.forma_retiro || '—'}</td>
                        <td className="py-2 px-3">
                          {r.nota && r.nota.trim() ? (
                            <button
                              className="px-3 py-1 bg-slate-200 rounded-lg hover:bg-slate-300"
                              onClick={() => { setNoteContent(r.nota); setNoteModalOpen(true); }}
                            >
                              Ver nota
                            </button>
                          ) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Total retirado */}
            <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
              <span className="text-slate-700 font-medium">Total retirado</span>
              <span className="text-2xl font-bold text-rose-600">{fmtMoney(totalRetiradoSocio)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Modal de nota */}
      {noteModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">Nota del retiro</h3>
              <button className="px-3 py-1 rounded-lg bg-slate-100" onClick={() => setNoteModalOpen(false)}>Cerrar</button>
            </div>
            <div className="p-4">
              <p className="whitespace-pre-wrap text-slate-800">{noteContent || 'Sin nota'}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RetirosModule;
