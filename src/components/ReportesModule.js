import React, { useEffect, useMemo, useState } from 'react';

/** Config Supabase **/
const SUPABASE_URL = 'https://ubfkhtkmlvutwdivmoff.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InViZmtodGttbHZ1dHdkaXZtb2ZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4MTc5NTUsImV4cCI6MjA2NjM5Mzk1NX0.c0iRma-dnlL29OR3ffq34nmZuj_ViApBTMG-6PEX_B4';

const headers = {
  'Content-Type': 'application/json',
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
};

function clsx(...classes) {
  return classes.filter(Boolean).join(' ');
}

const ReportesModule = () => {
  // búsqueda de socio
  const [term, setTerm] = useState('');
  const [sociosEncontrados, setSociosEncontrados] = useState([]);
  const [cargandoBusqueda, setCargandoBusqueda] = useState(false);

  // socio seleccionado
  const [socioSel, setSocioSel] = useState(null);

  // préstamos del socio
  const [prestamos, setPrestamos] = useState([]);
  const [loadingPrestamos, setLoadingPrestamos] = useState(false);
  const [errorPrestamos, setErrorPrestamos] = useState('');

  // para exportar
  const XLSX = useMemo(() => window?.XLSX, []);

  /** Buscar socios al escribir */
  useEffect(() => {
    let cancel = false;

    const run = async () => {
      const q = term.trim().toLowerCase();
      if (!q) {
        setSociosEncontrados([]);
        return;
      }
      try {
        setCargandoBusqueda(true);
        const url = `${SUPABASE_URL}/rest/v1/socios?select=id_socio,nombre,apellido_paterno,apellido_materno`;
        const res = await fetch(url, { headers });
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();

        if (cancel) return;

        const filtered = data.filter((s) => {
          const full = `${s.nombre} ${s.apellido_paterno || ''} ${s.apellido_materno || ''}`.trim().toLowerCase();
          return (
            String(s.id_socio).includes(q) ||
            full.includes(q)
          );
        });
        setSociosEncontrados(filtered.slice(0, 20));
      } catch (e) {
        console.error('Error buscando socios:', e);
        setSociosEncontrados([]);
      } finally {
        if (!cancel) setCargandoBusqueda(false);
      }
    };

    run();
    return () => {
      cancel = true;
    };
  }, [term]);

  /** Cargar préstamos del socio elegido */
  const cargarPrestamos = async (idSocio) => {
    setLoadingPrestamos(true);
    setErrorPrestamos('');
    try {
      // NOTA: select=* evita errores por columnas que no conocemos.
      const url = `${SUPABASE_URL}/rest/v1/prestamos?select=*&id_socio=eq.${idSocio}&order=id_prestamo.desc`;
      const res = await fetch(url, { headers });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || res.statusText);
      }
      const data = await res.json();
      setPrestamos(data || []);
    } catch (e) {
      console.error('Error al cargar préstamos del socio:', e);
      setErrorPrestamos('No se pudieron cargar los préstamos del socio');
      setPrestamos([]);
    } finally {
      setLoadingPrestamos(false);
    }
  };

  const seleccionarSocio = (s) => {
    setSocioSel(s);
    setTerm(`ID: ${s.id_socio} - ${s.nombre} ${s.apellido_paterno || ''} ${s.apellido_materno || ''}`.replace(/\s+/g, ' ').trim());
    setSociosEncontrados([]);
    cargarPrestamos(s.id_socio);
  };

  const limpiarSeleccion = () => {
    setSocioSel(null);
    setPrestamos([]);
    setTerm('');
    setErrorPrestamos('');
  };

  /** Exportar Control de préstamos (simple, 1 hoja) */
  const exportarExcel = async () => {
    if (!XLSX) {
      alert('Librería Excel no cargada. Verifica el <script> de SheetJS en index.html.');
      return;
    }
    if (!socioSel) {
      alert('Selecciona un socio primero.');
      return;
    }
    if (!prestamos.length) {
      alert('El socio no tiene préstamos para exportar.');
      return;
    }

    try {
      // Traer pagos para todos los préstamos del socio
      const ids = prestamos.map((p) => p.id_prestamo).join(',');
      const urlPagos = `${SUPABASE_URL}/rest/v1/pagos_prestamos?select=*&id_prestamo=in.(${ids})&order=id_prestamo.asc,numero_pago.asc`;
      const resPagos = await fetch(urlPagos, { headers });
      if (!resPagos.ok) throw new Error(await resPagos.text());
      const pagos = await resPagos.json();

      const filas = [];
      const nombreCompleto = `${socioSel.nombre} ${socioSel.apellido_paterno || ''} ${socioSel.apellido_materno || ''}`.replace(/\s+/g, ' ').trim();

      // construir filas
      for (const pago of pagos) {
        const pres = prestamos.find((p) => p.id_prestamo === pago.id_prestamo);
        filas.push({
          'ID socio': socioSel.id_socio,
          'Nombre completo': nombreCompleto,
          'ID préstamo': pago.id_prestamo,
          '# pago': pago.numero_pago,
          'Fecha programada': pago.fecha_programada || '',
          'Fecha pago': pago.fecha_pago || '',
          'Monto programado': Number(pago.monto_pago || 0),
          'Monto pagado': Number(pago.monto_pagado || 0),
          'Estado': pago.estatus || pago.estado_pago || '',
          'Frecuencia': pago.frecuencia || pres?.frecuencia || '',
          'Nota': pago.nota || '',
        });
      }

      // si no hay pagos, al menos deja filas de “sin pagos” por préstamo
      if (filas.length === 0) {
        for (const pres of prestamos) {
          filas.push({
            'ID socio': socioSel.id_socio,
            'Nombre completo': nombreCompleto,
            'ID préstamo': pres.id_prestamo,
            '# pago': '',
            'Fecha programada': '',
            'Fecha pago': '',
            'Monto programado': 0,
            'Monto pagado': 0,
            'Estado': pres.estatus || '',
            'Frecuencia': pres.frecuencia || '',
            'Nota': '',
          });
        }
      }

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(filas);
      XLSX.utils.book_append_sheet(wb, ws, 'Control de préstamos');
      const archivo = `control_prestamos_socio_${socioSel.id_socio}.xlsx`;
      XLSX.writeFile(wb, archivo);
    } catch (e) {
      console.error('Error exportando Excel:', e);
      alert('No se pudo exportar el Excel. Revisa la consola para más detalles.');
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">Reportes</h2>
        <p className="text-slate-600 dark:text-slate-400">Exporta tus reportes directamente a Excel</p>
      </div>

      {/* Selector del reporte (por ahora uno) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          type="button"
          className="border-2 border-green-300 dark:border-green-400 rounded-2xl p-4 text-left bg-white dark:bg-slate-800 hover:bg-green-50 dark:hover:bg-slate-700 transition-colors"
        >
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900 flex items-center justify-center">
              <svg className="w-5 h-5 text-green-700 dark:text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-6h6v6M9 7h6m2 12H7a2 2 0 01-2-2V7a2 2 0 012-2h10a2 2 0 012 2v10a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">Control de préstamos</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">Genera la hoja de control por préstamo en Excel.</p>
            </div>
          </div>
        </button>

        <div className="rounded-2xl p-4 border-2 border-dashed border-slate-200 dark:border-slate-700 text-slate-400 text-sm">
          Próximamente…
        </div>
        <div className="rounded-2xl p-4 border-2 border-dashed border-slate-200 dark:border-slate-700 text-slate-400 text-sm">
          Próximamente…
        </div>
      </div>

      {/* Parámetros */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
        <h4 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Parámetros del reporte</h4>

        {/* Buscar socio */}
        <div className="relative">
          <input
            type="text"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Buscar ID de socio o Nombre completo"
            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400"
          />
          {cargandoBusqueda && (
            <div className="absolute right-3 top-3 text-slate-400 text-sm">Buscando…</div>
          )}
          {/* Sugerencias */}
          {sociosEncontrados.length > 0 && (
            <div className="absolute z-10 mt-2 w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl max-h-64 overflow-auto">
              {sociosEncontrados.map((s) => (
                <button
                  key={s.id_socio}
                  onClick={() => seleccionarSocio(s)}
                  className="w-full text-left px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-slate-700 dark:text-slate-200"
                >
                  ID: {s.id_socio} — {s.nombre} {s.apellido_paterno} {s.apellido_materno}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Panel préstamos del socio */}
        <div className="mt-6">
          <div className="flex items-center justify-between">
            <h5 className="font-semibold text-slate-900 dark:text-slate-100">
              {socioSel ? `Préstamos de ${socioSel.nombre} ${socioSel.apellido_paterno || ''}` : 'Selecciona un socio'}
            </h5>
            {socioSel && (
              <div className="flex items-center gap-2">
                <button
                  onClick={exportarExcel}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-colors"
                  disabled={loadingPrestamos || prestamos.length === 0}
                >
                  Exportar a Excel
                </button>
                <button
                  onClick={limpiarSeleccion}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-100 rounded-xl hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                >
                  Limpiar selección
                </button>
              </div>
            )}
          </div>

          <div className="mt-4">
            {loadingPrestamos && (
              <p className="text-slate-600 dark:text-slate-400">Cargando préstamos…</p>
            )}
            {!!errorPrestamos && !loadingPrestamos && (
              <p className="text-red-500">{errorPrestamos}</p>
            )}
            {!loadingPrestamos && !errorPrestamos && socioSel && prestamos.length === 0 && (
              <p className="text-slate-600 dark:text-slate-400">No hay préstamos registrados para este socio.</p>
            )}

            {!loadingPrestamos && prestamos.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700">
                      <th className="text-left py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">ID préstamo</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">Estatus</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">Frecuencia</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">Monto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {prestamos.map((p) => (
                      <tr key={p.id_prestamo} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700">
                        <td className="py-3 px-4 text-slate-800 dark:text-slate-100">{p.id_prestamo}</td>
                        <td className="py-3 px-4">
                          <span className={clsx(
                            'px-2 py-1 rounded-full text-xs font-medium',
                            (p.estatus || '').toLowerCase() === 'activo'
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                              : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200'
                          )}>
                            {p.estatus || '—'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-700 dark:text-slate-200">{p.frecuencia || '—'}</td>
                        <td className="py-3 px-4 text-slate-800 dark:text-slate-100">
                          {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(Number(p.monto_total || p.monto || 0))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportesModule;
