// src/components/MultasRenovacionesModule.js
import React, { useEffect, useMemo, useState } from 'react';

const SUPABASE_URL = 'https://ubfkhtkmlvutwdivmoff.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InViZmtodGttbHZ1dHdkaXZtb2ZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4MTc5NTUsImV4cCI6MjA2NjM5Mzk1NX0.c0iRma-dnlL29OR3ffq34nmZuj_ViApBTMG-6PEX_B4';

// Helpers de fechas seguros (evitan desfases por zona horaria)
function toLocalDate(dateLike) {
  // dateLike: 'YYYY-MM-DD' o ISO. Para fechas puras añadimos T00:00:00
  if (!dateLike) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateLike)) return new Date(`${dateLike}T00:00:00`);
  return new Date(dateLike);
}
function addYears(d, n) {
  const nd = new Date(d.getTime());
  nd.setFullYear(nd.getFullYear() + n);
  return nd;
}
function addDays(d, n) {
  const nd = new Date(d.getTime());
  nd.setDate(nd.getDate() + n);
  return nd;
}
function startOfToday() {
  const t = new Date();
  return new Date(t.getFullYear(), t.getMonth(), t.getDate());
}
function money(n) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(Number(n || 0));
}

const MultasRenovacionesModule = () => {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  const [socios, setSocios] = useState([]); // {id_socio, nombre, apellidos..., miembro_desde}
  const [pagosAfiliacion, setPagosAfiliacion] = useState([]); // {id_socio, fecha_hora, estatus}

  useEffect(() => {
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        // 1) Socios con miembro_desde
        const rSoc = await fetch(
          `${SUPABASE_URL}/rest/v1/socios?select=id_socio,nombre,apellido_paterno,apellido_materno,miembro_desde&order=id_socio.asc`,
          { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } }
        );
        if (!rSoc.ok) throw new Error('No se pudieron cargar los socios');
        const sociosData = await rSoc.json();

        // 2) Pagos de afiliación (sólo los que tienen estatus; usaremos el último por socio)
        const rPag = await fetch(
          `${SUPABASE_URL}/rest/v1/pago_afiliaciones?select=id_socio,fecha_hora,estatus`,
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

  // Mapa: último pago de afiliación exitoso por socio
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

  // Cálculo de próximas renovaciones (ventana: 30 días antes del aniversario en adelante)
  const proximasRenovaciones = useMemo(() => {
    const hoy = startOfToday();
    const resultados = [];

    for (const s of socios) {
      // Ancla: último pago exitoso, si no existe usar miembro_desde
      const miembroDesde = toLocalDate(s.miembro_desde);
      const ultimoPago = lastPaidMap.get(s.id_socio) || null;
      const ancla = ultimoPago || miembroDesde;
      if (!ancla) continue; // si no hay ninguna fecha, no se puede calcular

      // Avanzar ancla + 1 año hasta que la "próxima" quede en el futuro
      let proxima = addYears(ancla, 1);
      while (proxima <= hoy) {
        proxima = addYears(proxima, 1);
      }

      // Si ya estamos dentro de la ventana de 30 días previos a la próxima renovación => contar
      const inicioVentana = addDays(proxima, -30);
      if (hoy >= inicioVentana) {
        resultados.push({
          id_socio: s.id_socio,
          nombre: `${s.nombre} ${s.apellido_paterno} ${s.apellido_materno}`,
          proxima_renovacion: proxima
        });
      }
    }
    // Puedes ordenar por fecha más próxima
    resultados.sort((a, b) => a.proxima_renovacion - b.proxima_renovacion);
    return resultados;
  }, [socios, lastPaidMap]);

  // KPIs de las 4 tarjetas
  const kpiProximasRenovaciones = proximasRenovaciones.length;
  const kpiAcumuladoAfiliaciones = 0;      // Conéctalo a tu suma real cuando lo decidas
  const kpiAcumuladoMultasHoja = 0;        // Conéctalo a tu suma real
  const kpiAcumuladoMoras = 0;             // Conéctalo a tu suma real

  const cards = [
    {
      title: 'Próximas Renovaciones',
      value: kpiProximasRenovaciones.toLocaleString(),
      bg: 'bg-blue-100',
      text: 'text-blue-800',
      icon: (
        <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            d="M8 7V3m8 4V3M5 11h14M5 19h14a2 2 0 002-2v-8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      )
    },
    {
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
      title: 'Acumulado de moras',
      value: money(kpiAcumuladoMoras),
      bg: 'bg-purple-100',
      text: 'text-purple-800',
      icon: (
        <svg className="w-7 h-7 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
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
            {cards.map((c, i) => (
              <div key={i} className={`${c.bg} rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all`}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className={`text-lg font-semibold ${c.text}`}>{c.title}</h3>
                  <div className="p-2 bg-white bg-opacity-40 rounded-full">{c.icon}</div>
                </div>
                <div className={`text-3xl font-bold ${c.text}`}>{c.value}</div>
              </div>
            ))}
          </div>

          {/* (Opcional) Lista breve de próximos a renovar */}
          {proximasRenovaciones.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h3 className="text-xl font-semibold text-slate-900 mb-3">Socios próximos a renovar (30 días)</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-3 px-4 text-slate-700">ID Socio</th>
                      <th className="text-left py-3 px-4 text-slate-700">Nombre</th>
                      <th className="text-left py-3 px-4 text-slate-700">Próxima renovación</th>
                    </tr>
                  </thead>
                  <tbody>
                    {proximasRenovaciones.map(r => (
                      <tr key={r.id_socio} className="border-b border-slate-100">
                        <td className="py-3 px-4">{r.id_socio}</td>
                        <td className="py-3 px-4">{r.nombre}</td>
                        <td className="py-3 px-4">
                          {r.proxima_renovacion.toLocaleDateString('es-MX', { year: 'numeric', month: '2-digit', day: '2-digit' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MultasRenovacionesModule;
