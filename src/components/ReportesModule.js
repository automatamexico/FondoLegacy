// src/components/ReportesModule.js
import React, { useEffect, useMemo, useState } from 'react';
import { exportControlPrestamoXLSX } from '../utils/exportControlPrestamo';

const SUPABASE_URL = 'https://ubfkhtkmlvutwdivmoff.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InViZmtodGttbHZ1dHdkaXZtb2ZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4MTc5NTUsImV4cCI6MjA2NjM5Mzk1NX0.c0iRma-dnlL29OR3ffq34nmZuj_ViApBTMG-6PEX_B4';

function money(n) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(Number(n || 0));
}
function fechaISOaDMY(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

const ReportesModule = () => {
  const [selectedReport, setSelectedReport] = useState('controlPrestamos'); // único por ahora
  const [searchTerm, setSearchTerm] = useState('');
  const [sociosResults, setSociosResults] = useState([]);
  const [loadingSocios, setLoadingSocios] = useState(false);
  const [selectedSocio, setSelectedSocio] = useState(null);

  const [prestamos, setPrestamos] = useState([]);
  const [loadingPrestamos, setLoadingPrestamos] = useState(false);
  const [error, setError] = useState('');

  // color de marca #0ea15a
  const brandGradient = useMemo(
    () => ({ background: 'linear-gradient(to right, #0ea15a, #0b7e45)' }),
    []
  );

  useEffect(() => {
    setError('');
  }, [selectedReport]);

  async function fetchSocios(term) {
    setLoadingSocios(true);
    setError('');
    try {
      // Traemos lo esencial y filtramos en cliente (simple y compatible con tu patrón actual)
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/socios?select=id_socio,nombre,apellido_paterno,apellido_materno,email,telefono&order=id_socio.asc`,
        {
          headers: {
            'Content-Type': 'application/json',
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          },
        }
      );
      if (!res.ok) throw new Error('No se pudieron cargar los socios');
      const all = await res.json();

      const t = term.toLowerCase();
      const filtered = all.filter(
        (s) =>
          String(s.id_socio).includes(t) ||
          `${s.nombre} ${s.apellido_paterno || ''} ${s.apellido_materno || ''}`
            .toLowerCase()
            .includes(t)
      );
      setSociosResults(filtered.slice(0, 20)); // limitar sugerencias
    } catch (e) {
      console.error(e);
      setError(e.message);
      setSociosResults([]);
    } finally {
      setLoadingSocios(false);
    }
  }

  function onSearchChange(e) {
    const v = e.target.value;
    setSearchTerm(v);
    setSelectedSocio(null);
    setPrestamos([]);
    if (v.trim().length >= 2) {
      fetchSocios(v.trim());
    } else {
      setSociosResults([]);
    }
  }

  async function onSelectSocio(socio) {
    setSelectedSocio(socio);
    setSearchTerm(`ID: ${socio.id_socio} - ${socio.nombre} ${socio.apellido_paterno || ''} ${socio.apellido_materno || ''}`.trim());
    setSociosResults([]);
    setLoadingPrestamos(true);
    setError('');
    try {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/prestamos?id_socio=eq.${socio.id_socio}&select=id_prestamo,monto_solicitado,interes,tasa_interes_mensual,plazo_meses,estatus,fecha_solicitud,fecha_creacion&order=fecha_solicitud.desc`,
        {
          headers: {
            'Content-Type': 'application/json',
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          },
        }
      );
      if (!res.ok) throw new Error('No se pudieron cargar los préstamos del socio');
      const data = await res.json();
      setPrestamos(data);
    } catch (e) {
      console.error(e);
      setError(e.message);
      setPrestamos([]);
    } finally {
      setLoadingPrestamos(false);
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Reportes</h2>
          <p className="text-slate-600">Exporta tus reportes directamente a Excel</p>
        </div>
      </div>

      {/* Selector de reportes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <button
          onClick={() => setSelectedReport('controlPrestamos')}
          className={`rounded-2xl border p-5 text-left transition-all hover:shadow-md ${
            selectedReport === 'controlPrestamos'
              ? 'border-emerald-500 ring-2 ring-emerald-200'
              : 'border-slate-200'
          }`}
        >
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center mb-3 text-white"
            style={brandGradient}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-6a2 2 0 012-2h7M9 17l-2 2m2-2l2 2m8-10h.01M13 7h.01" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-1">Control de préstamos</h3>
          <p className="text-sm text-slate-600">
            Genera la hoja de control (préstamos e intereses) por préstamo en formato Excel.
          </p>
        </button>

        {/* Lugar para más reportes en el futuro */}
        <div className="rounded-2xl border border-dashed border-slate-200 p-5 text-slate-400">
          Próximamente…
        </div>
        <div className="rounded-2xl border border-dashed border-slate-200 p-5 text-slate-400">
          Próximamente…
        </div>
      </div>

      {/* Filtros / Parámetros según reporte */}
      {selectedReport === 'controlPrestamos' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6">
          <h4 className="text-lg font-semibold text-slate-900">Parámetros del reporte</h4>

          {/* Buscar socio */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Buscar ID de socio o Nombre completo
            </label>
            <input
              type="text"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="Ej. 102 o Juan Pérez"
              value={searchTerm}
              onChange={onSearchChange}
            />
            {loadingSocios && (
              <p className="text-sm text-slate-500 mt-2">Buscando socios…</p>
            )}
            {!loadingSocios && sociosResults.length > 0 && (
              <div className="mt-3 space-y-2">
                {sociosResults.map((s) => (
                  <div
                    key={s.id_socio}
                    className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between hover:bg-slate-100 cursor-pointer"
                    onClick={() => onSelectSocio(s)}
                  >
                    <div className="text-slate-800">
                      <span className="font-medium">ID: {s.id_socio}</span> — {s.nombre} {s.apellido_paterno} {s.apellido_materno}
                    </div>
                    <span className="text-xs text-slate-500">{s.email}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tabla de préstamos del socio seleccionado */}
          {selectedSocio && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h5 className="font-semibold text-slate-900">
                  Préstamos de {selectedSocio.nombre} {selectedSocio.apellido_paterno} {selectedSocio.apellido_materno}
                </h5>
                <button
                  onClick={() => {
                    setSelectedSocio(null);
                    setPrestamos([]);
                    setSearchTerm('');
                    setSociosResults([]);
                  }}
                  className="px-3 py-2 text-sm rounded-lg border border-slate-200 hover:bg-slate-50"
                >
                  Limpiar selección
                </button>
              </div>

              {loadingPrestamos && <p className="text-slate-600">Cargando préstamos…</p>}
              {!loadingPrestamos && prestamos.length === 0 && (
                <p className="text-slate-600">No hay préstamos registrados para este socio.</p>
              )}

              {!loadingPrestamos && prestamos.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="text-left py-3 px-4 font-semibold text-slate-700">ID Préstamo</th>
                        <th className="text-left py-3 px-4 font-semibold text-slate-700">Monto</th>
                        <th className="text-left py-3 px-4 font-semibold text-slate-700">Tasa mensual</th>
                        <th className="text-left py-3 px-4 font-semibold text-slate-700">Plazo (meses)</th>
                        <th className="text-left py-3 px-4 font-semibold text-slate-700">Fecha solicitud</th>
                        <th className="text-left py-3 px-4 font-semibold text-slate-700">Estatus</th>
                        <th className="text-left py-3 px-4 font-semibold text-slate-700">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {prestamos.map((p) => {
                        const tasa = (p.interes ?? p.tasa_interes_mensual ?? 0);
                        return (
                          <tr key={p.id_prestamo} className="border-b border-slate-100 hover:bg-slate-50">
                            <td className="py-3 px-4">{p.id_prestamo}</td>
                            <td className="py-3 px-4 font-medium">{money(p.monto_solicitado)}</td>
                            <td className="py-3 px-4">{tasa}%</td>
                            <td className="py-3 px-4">{p.plazo_meses}</td>
                            <td className="py-3 px-4">{fechaISOaDMY(p.fecha_solicitud || p.fecha_creacion)}</td>
                            <td className="py-3 px-4">
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-medium ${
                                  p.estatus === 'activo'
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-slate-100 text-slate-700'
                                }`}
                              >
                                {p.estatus || '—'}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <button
                                onClick={() => exportControlPrestamoXLSX(p.id_prestamo)}
                                className="px-3 py-1.5 rounded-lg text-white text-sm"
                                style={brandGradient}
                                title="Exportar control de préstamos (Excel)"
                              >
                                Exportar Excel
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
          )}

          {error && <div className="text-red-600 text-sm">{error}</div>}
        </div>
      )}
    </div>
  );
};

export default ReportesModule;
