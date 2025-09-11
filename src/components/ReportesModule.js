import React, { useEffect, useState } from 'react';

const SUPABASE_URL = 'https://ubfkhtkmlvutwdivmoff.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InViZmtodGttbHZ1dHdkaXZtb2ZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4MTc5NTUsImV4cCI6MjA2NjM5Mzk1NX0.c0iRma-dnlL29OR3ffq34nmZuj_ViApBTMG-6PEX_B4';

const ReportesModule = () => {
  const [activeCard, setActiveCard] = useState('control');
  const [search, setSearch] = useState('');
  const [socios, setSocios] = useState([]);
  const [selectedSocio, setSelectedSocio] = useState(null);
  const [prestamos, setPrestamos] = useState([]);
  const [loadingSocios, setLoadingSocios] = useState(false);
  const [loadingPrestamos, setLoadingPrestamos] = useState(false);
  const [errorPrestamos, setErrorPrestamos] = useState('');

  // Buscar socios al escribir
  useEffect(() => {
    let abort = false;
    const run = async () => {
      if (!search || search.trim().length < 1) {
        setSocios([]);
        return;
      }
      setLoadingSocios(true);
      try {
        const resp = await fetch(
          `${SUPABASE_URL}/rest/v1/socios?select=id_socio,nombre,apellido_paterno,apellido_materno,telefono,direccion,cp&or=(id_socio.like.%25${encodeURIComponent(
            search
          )}%25,nombre.ilike.%25${encodeURIComponent(
            search
          )}%25,apellido_paterno.ilike.%25${encodeURIComponent(
            search
          )}%25,apellido_materno.ilike.%25${encodeURIComponent(search)}%25)`,
          {
            headers: {
              apikey: SUPABASE_ANON_KEY,
              Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
            },
          }
        );
        if (!resp.ok) throw new Error('No se pudo buscar socios');
        const data = await resp.json();
        if (!abort) setSocios(data);
      } catch (e) {
        if (!abort) setSocios([]);
      } finally {
        if (!abort) setLoadingSocios(false);
      }
    };
    run();
    return () => {
      abort = true;
    };
  }, [search]);

  const seleccionarSocio = async (s) => {
    setSelectedSocio(s);
    setPrestamos([]);
    setErrorPrestamos('');
    setSearch(`${s.id_socio} - ${s.nombre} ${s.apellido_paterno} ${s.apellido_materno}`);
    setSocios([]);
    setLoadingPrestamos(true);
    try {
      const resp = await fetch(
        `${SUPABASE_URL}/rest/v1/prestamos?select=id_prestamo,monto_prestamo,estatus,fecha_inicio,plazo_meses&id_socio=eq.${s.id_socio}`,
        {
          headers: {
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          },
        }
      );
      if (!resp.ok) throw new Error('No se pudieron cargar los préstamos del socio');
      const data = await resp.json();
      setPrestamos(data);
    } catch (e) {
      setErrorPrestamos('No se pudieron cargar los préstamos del socio');
    } finally {
      setLoadingPrestamos(false);
    }
  };

  const limpiar = () => {
    setSelectedSocio(null);
    setPrestamos([]);
    setErrorPrestamos('');
    setSearch('');
    setSocios([]);
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Reportes</h2>
        <p className="text-slate-600">Exporta tus reportes directamente a Excel</p>
      </div>

      {/* Tarjetas de tipos de reporte */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={() => setActiveCard('control')}
          className={`text-left rounded-2xl border p-5 transition-all ${
            activeCard === 'control'
              ? 'border-green-300 bg-green-50 ring-2 ring-green-200'
              : 'border-slate-200 bg-white hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-6a2 2 0 012-2h8m-6 8h6m-6-4h6M7 7h.01M4 6h6a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2z" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-slate-900">Control de préstamos</p>
              <p className="text-sm text-slate-600">Genera la hoja de control por préstamo en Excel.</p>
            </div>
          </div>
        </button>

        <div className="rounded-2xl border border-dashed border-slate-300 p-5 bg-white text-slate-400">
          Próximamente…
        </div>
        <div className="rounded-2xl border border-dashed border-slate-300 p-5 bg-white text-slate-400">
          Próximamente…
        </div>
      </div>

      {/* Panel de parámetros (estilos claros) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Parámetros del reporte</h3>

        {/* Buscador de socio */}
        <div className="relative">
          <input
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Buscar ID de socio o Nombre completo"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {loadingSocios && (
            <div className="absolute right-3 top-3 text-slate-400 text-sm">Buscando…</div>
          )}

          {/* Lista de resultados */}
          {socios.length > 0 && (
            <div className="mt-2 rounded-xl border border-slate-200 bg-white shadow">
              {socios.slice(0, 8).map((s) => (
                <button
                  key={s.id_socio}
                  onClick={() => seleccionarSocio(s)}
                  className="w-full text-left px-4 py-3 hover:bg-slate-50"
                >
                  <span className="font-medium text-slate-900">ID: {s.id_socio}</span>{' '}
                  <span className="text-slate-700">
                    — {s.nombre} {s.apellido_paterno} {s.apellido_materno}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Seleccion actual */}
        <div className="mt-6">
          <h4 className="text-slate-800 font-medium mb-2">Selecciona un socio</h4>

          {!selectedSocio && <p className="text-slate-500">Aún no has seleccionado un socio.</p>}

          {selectedSocio && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl p-4">
                <div>
                  <p className="font-semibold text-slate-900">
                    ID {selectedSocio.id_socio} — {selectedSocio.nombre} {selectedSocio.apellido_paterno}{' '}
                    {selectedSocio.apellido_materno}
                  </p>
                  <p className="text-sm text-slate-600">
                    {selectedSocio.direccion || 'Sin dirección'} • CP {selectedSocio.cp || '—'} •{' '}
                    {selectedSocio.telefono || 'Sin teléfono'}
                  </p>
                </div>
                <button
                  onClick={limpiar}
                  className="px-3 py-2 text-sm rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700"
                >
                  Limpiar selección
                </button>
              </div>

              {/* Prestamos del socio */}
              <div className="bg-white border border-slate-200 rounded-xl p-4">
                <h5 className="font-semibold text-slate-900 mb-3">
                  Préstamos de {selectedSocio.nombre} {selectedSocio.apellido_paterno}
                </h5>

                {loadingPrestamos && <p className="text-slate-600">Cargando préstamos…</p>}
                {!!errorPrestamos && <p className="text-red-600">{errorPrestamos}</p>}

                {!loadingPrestamos && !errorPrestamos && prestamos.length === 0 && (
                  <p className="text-slate-600">No hay préstamos registrados para este socio.</p>
                )}

                {!loadingPrestamos && prestamos.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50">
                          <th className="text-left py-3 px-4 text-slate-700 font-semibold">ID Préstamo</th>
                          <th className="text-left py-3 px-4 text-slate-700 font-semibold">Monto</th>
                          <th className="text-left py-3 px-4 text-slate-700 font-semibold">Estatus</th>
                          <th className="text-left py-3 px-4 text-slate-700 font-semibold">Fecha inicio</th>
                          <th className="text-left py-3 px-4 text-slate-700 font-semibold">Plazo (meses)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {prestamos.map((p) => (
                          <tr key={p.id_prestamo} className="border-b border-slate-100 hover:bg-slate-50">
                            <td className="py-3 px-4 text-slate-800">{p.id_prestamo}</td>
                            <td className="py-3 px-4 text-slate-800">
                              {new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN'}).format(p.monto_prestamo || 0)}
                            </td>
                            <td className="py-3 px-4">
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                p.estatus === 'activo'
                                  ? 'bg-green-100 text-green-700'
                                  : p.estatus === 'liquidado'
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-yellow-100 text-yellow-700'
                              }`}>
                                {p.estatus}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-slate-800">{p.fecha_inicio || '—'}</td>
                            <td className="py-3 px-4 text-slate-800">{p.plazo_meses ?? '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportesModule;
