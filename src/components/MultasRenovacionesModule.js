// src/components/MultasRenovacionesModule.js
import React, { useEffect, useMemo, useState } from 'react';

const SUPABASE_URL = 'https://ubfkhtkmlvutwdivmoff.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InViZmtodGttbHZ1dHdkaXZtb2ZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4MTc5NTUsImV4cCI6MjA2NjM5Mzk1NX0.c0iRma-dnlL29OR3ffq34nmZuj_ViApBTMG-6PEX_B4';

// Utilidades
function fmtMoney(n) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(Number(n || 0));
}
function ymd(d) {
  if (!d) return '';
  const Y = d.getFullYear();
  const M = String(d.getMonth()+1).padStart(2,'0');
  const D = String(d.getDate()).padStart(2,'0');
  return `${Y}-${M}-${D}`;
}
function addYears(date, n) {
  const d = new Date(date);
  d.setFullYear(d.getFullYear() + n);
  return d;
}
function subDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() - n);
  return d;
}
function fmtLongDate(s) {
  if (!s) return '';
  const d = new Date(s);
  return d.toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: '2-digit' });
}

const MultasRenovacionesModule = () => {
  // ---- Tarjetas
  const [proximasRenovaciones, setProximasRenovaciones] = useState([]); // listado que se abre en modal
  const [acumAfiliaciones, setAcumAfiliaciones] = useState(0);          // suma de pago_afiliaciones.monto_afiliacion_papeleria
  const [acumMultasHoja, setAcumMultasHoja] = useState(0);              // NUEVO: suma de pago_multas.monto_multa_hoja
  const [acumMoras, setAcumMoras] = useState(0);                        // placeholder si ya lo usas en otro lado

  // ---- Modal de “Próximas Renovaciones”
  const [showRenovacionesModal, setShowRenovacionesModal] = useState(false);
  const [renovSel, setRenovSel] = useState(null); // socio seleccionado para renovar
  const [showRenovarModal, setShowRenovarModal] = useState(false);
  const [montoAfiliacion, setMontoAfiliacion] = useState('');

  // Carga de tarjetas (sin tocar tu lógica previa, solo asegurando los 3 cálculos)
  useEffect(() => {
    (async () => {
      try {
        // 1) Próximas renovaciones (basado en socios.miembro_desde, mostrar 30 días antes del aniversario del siguiente año, y excluir si ya está pagada en pago_afiliaciones)
        const rSoc = await fetch(`${SUPABASE_URL}/rest/v1/socios?select=id_socio,nombre,apellido_paterno,apellido_materno,miembro_desde,estatus`, {
          headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` }
        });
        const socios = await rSoc.json();

        const rAf = await fetch(`${SUPABASE_URL}/rest/v1/pago_afiliaciones?select=id_socio,fecha_hora,estatus`, {
          headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` }
        });
        const pagosAf = await rAf.json();

        const hoy = new Date();

        const pendientes = (socios || [])
          .filter(s => s.estatus !== false && s.miembro_desde) // activos y con fecha
          .map(s => {
            const base = new Date(s.miembro_desde);            // fecha de inicio
            // siguiente aniversario (un año después del último aniversario que haya pasado o esté por venir)
            let nextAnniv = addYears(base, hoy.getFullYear() - base.getFullYear());
            if (nextAnniv < hoy) nextAnniv = addYears(nextAnniv, 1);
            // fecha en la que aparece (30 días antes)
            const apareceDesde = subDays(nextAnniv, 30);

            // ¿ya hay afiliación pagada este ciclo? Consideramos pagado si existe un registro con estatus 'AFILIACION PAGADA'
            const pagoHecho = (pagosAf || []).some(p => p.id_socio === s.id_socio && String(p.estatus || '').toUpperCase() === 'AFILIACION PAGADA');

            return {
              ...s,
              nextAnniv,
              apareceDesde,
              pagoHecho
            };
          })
          .filter(row => hoy >= row.apareceDesde && !row.pagoHecho) // visibles y sin pago
          .sort((a,b) => a.nextAnniv - b.nextAnniv);

        setProximasRenovaciones(pendientes);

        // 2) Acumulado de Afiliaciones (suma monto_afiliacion_papeleria)
        try {
          const rSumAf = await fetch(`${SUPABASE_URL}/rest/v1/pago_afiliaciones?select=monto_afiliacion_papeleria`, {
            headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` }
          });
          const dataAf = await rSumAf.json();
          const totalAf = (dataAf || []).reduce((acc, it) => acc + Number(it.monto_afiliacion_papeleria || 0), 0);
          setAcumAfiliaciones(totalAf);
        } catch {
          setAcumAfiliaciones(0);
        }

        // 3) NUEVO: Acumulado de Multas por Hoja (suma pago_multas.monto_multa_hoja)
        try {
          const rMultas = await fetch(`${SUPABASE_URL}/rest/v1/pago_multas?select=monto_multa_hoja`, {
            headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` }
          });
          const dataMultas = await rMultas.json();
          const totalMultas = (dataMultas || []).reduce((acc, it) => acc + Number(it.monto_multa_hoja || 0), 0);
          setAcumMultasHoja(totalMultas);
        } catch {
          setAcumMultasHoja(0);
        }

        // 4) Acumulado de moras (si ya lo calculas en otro lado puedes reemplazar; aquí lo dejamos como está)
        // setAcumMoras(0); // no modificado
      } catch (e) {
        // manejo silencioso, no cambiamos nada más
      }
    })();
  }, []);

  // Abrir listado de próximas renovaciones (modal) al dar clic en la tarjeta
  const abrirModalRenovaciones = () => setShowRenovacionesModal(true);
  const cerrarModalRenovaciones = () => setShowRenovacionesModal(false);

  // Abrir modal para renovar un socio seleccionado
  const abrirRenovar = (socio) => {
    setRenovSel(socio);
    setMontoAfiliacion('');
    setShowRenovarModal(true);
  };
  const cerrarRenovar = () => {
    setShowRenovarModal(false);
    setRenovSel(null);
  };

  // Aplicar renovación → inserta en pago_afiliaciones con estatus AFILIACION PAGADA
  const aplicarRenovacion = async () => {
    if (!(Number(montoAfiliacion) > 0) || !renovSel?.id_socio) return;
    try {
      const now = new Date();
      const fecha_hora = `${ymd(now)}T${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`;

      const body = {
        id_socio: renovSel.id_socio,
        monto_afiliacion_papeleria: Number(montoAfiliacion),
        fecha_hora,
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
      if (!r.ok) throw new Error('No se pudo registrar la afiliación');

      // Refrescar tarjetas mínimas relacionadas
      setAcumAfiliaciones(prev => prev + Number(montoAfiliacion || 0));
      // Sacar al socio del listado de pendientes
      setProximasRenovaciones(prev => prev.filter(s => s.id_socio !== renovSel.id_socio));

      cerrarRenovar();
    } catch (e) {
      alert('No se pudo renovar la afiliación.');
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Multas y Renovaciones</h2>
          <p className="text-slate-600">Control de afiliaciones, multas y renovaciones</p>
        </div>
      </div>

      {/* Tarjetas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Próximas Renovaciones (abre modal con listado) */}
        <button
          onClick={abrirModalRenovaciones}
          className="text-left bg-white rounded-2xl border border-slate-200 p-6 hover:shadow transition"
        >
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <span className="text-blue-600">📆</span>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Próximas Renovaciones</h3>
              <p className="text-2xl font-bold text-blue-600">{proximasRenovaciones.length}</p>
            </div>
          </div>
          <p className="text-xs text-slate-500">Click para ver el detalle</p>
        </button>

        {/* Acumulado de Afiliaciones */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
              <span className="text-emerald-600">💳</span>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Acumulado de Afiliaciones</h3>
              <p className="text-2xl font-bold text-emerald-600">{fmtMoney(acumAfiliaciones)}</p>
            </div>
          </div>
        </div>

        {/* Acumulado de multas por hoja (NUEVO cálculo mostrado) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center">
              <span className="text-rose-600">📄</span>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Acumulado de multas por hoja</h3>
              <p className="text-2xl font-bold text-rose-600">{fmtMoney(acumMultasHoja)}</p>
            </div>
          </div>
        </div>

        {/* Acumulado de moras (sin cambios) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
              <span className="text-purple-600">⏰</span>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Acumulado de moras</h3>
              <p className="text-2xl font-bold text-purple-600">{fmtMoney(acumMoras)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL: Listado de Próximas Renovaciones */}
      {showRenovacionesModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl shadow-xl">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">Socios pendientes de renovación (30 días antes del aniversario)</h3>
              <button className="px-3 py-1 rounded-lg bg-slate-100" onClick={cerrarModalRenovaciones}>Cerrar</button>
            </div>

            <div className="p-4 max-h-[70vh] overflow-y-auto">
              {proximasRenovaciones.length === 0 ? (
                <p className="text-slate-600">No hay socios pendientes.</p>
              ) : (
                <div className="space-y-2">
                  {proximasRenovaciones.map(s => (
                    <div key={s.id_socio} className="p-3 bg-slate-50 rounded-lg border flex items-center justify-between">
                      <div>
                        <div className="font-medium text-slate-900">
                          #{s.id_socio} — {s.nombre} {s.apellido_paterno} {s.apellido_materno}
                        </div>
                        <div className="text-sm text-slate-600">
                          Miembro desde: <span className="font-medium">{fmtLongDate(s.miembro_desde)}</span>
                          {' · '}Aniversario: <span className="font-medium">{fmtLongDate(s.nextAnniv)}</span>
                          {' · '}Visible desde: <span className="font-medium">{fmtLongDate(s.apareceDesde)}</span>
                        </div>
                      </div>
                      <button
                        className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                        onClick={() => abrirRenovar(s)}
                      >
                        Renovar Afiliación
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SUB-MODAL: Renovar afiliación (monto requerido) */}
      {showRenovarModal && renovSel && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl p-5">
            <h3 className="text-lg font-semibold mb-3">
              Renovar afiliación — Socio #{renovSel.id_socio}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-700 mb-1">Monto de afiliación</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border rounded-lg"
                  value={montoAfiliacion}
                  onChange={(e) => setMontoAfiliacion(e.target.value)}
                  placeholder="0.00"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button className="px-4 py-2 rounded-lg bg-slate-100" onClick={cerrarRenovar}>Cancelar</button>
                <button
                  className="px-4 py-2 rounded-lg bg-emerald-600 text-white disabled:opacity-60"
                  onClick={aplicarRenovacion}
                  disabled={!(Number(montoAfiliacion) > 0)}
                >
                  Aceptar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default MultasRenovacionesModule;
