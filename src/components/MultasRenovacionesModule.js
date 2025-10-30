// src/components/MultasRenovacionesModule.js
import React, { useEffect, useState } from 'react';

const SUPABASE_URL = 'https://ubfkhtkmlvutwdivmoff.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InViZmtodGttbHZ1dHdkaXZtb2ZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4MTc5NTUsImV4cCI6MjA2NjM5Mzk1NX0.c0iRma-dnlL29OR3ffq34nmZuj_ViApBTMG-6PEX_B4';

/**
 * Ajusta aquí si tus tablas/campos tienen otros nombres.
 * El código intenta usar primero estos nombres y tiene fallbacks internos.
 */
const CFG = {
  // 1) Renovaciones: usa tabla 'renovaciones' con campo 'fecha_renovacion' y estatus 'pendiente'.
  // Si no existe, intenta en 'socios' con 'fecha_renovacion'.
  renovaciones: {
    primary: { table: 'renovaciones', dateField: 'fecha_renovacion', statusField: 'estatus', pendingValue: 'pendiente' },
    fallback: { table: 'socios', dateField: 'fecha_renovacion', statusField: 'estatus', activeValue: 'activo' },
    daysWindow: 15, // ventana de proximidad en días
  },

  // 2) Afiliaciones: suma de monto. Primero tabla 'afiliaciones' (monto/monto_afiliacion),
  // fallback: 'socios' con 'cuota_afiliacion'
  afiliaciones: {
    primary: { table: 'afiliaciones', amountFields: ['monto', 'monto_afiliacion'] },
    fallback: { table: 'socios', amountFields: ['cuota_afiliacion'] },
  },

  // 3) Multas por hoja: tabla 'multas' con tipo='hoja'
  multasHoja: {
    table: 'multas',
    typeField: 'tipo',
    typeValue: 'hoja',
    amountFields: ['monto', 'cantidad', 'importe'],
  },

  // 4) Moras: tabla 'multas' con tipo='mora'
  moras: {
    table: 'multas',
    typeField: 'tipo',
    typeValue: 'mora',
    amountFields: ['monto', 'cantidad', 'importe'],
  },
};

function mxn(n) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(Number(n || 0));
}
function ymd(d) {
  const dt = (d instanceof Date) ? d : new Date(d);
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  const day = String(dt.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

async function fetchJSON(url) {
  const resp = await fetch(url, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    },
  });
  if (!resp.ok) {
    // No romper el render; reportar y seguir con 0
    console.warn('Supabase fetch warning:', resp.status, url);
    return { ok: false, data: null, resp };
  }
  const data = await resp.json();
  return { ok: true, data, resp };
}

/**
 * Intenta sumar el primer campo existente en 'amountFields'.
 * Si ninguno existe, suma 0.
 */
function sumAmountFlexible(rows, amountFields) {
  if (!Array.isArray(rows) || rows.length === 0) return 0;
  let total = 0;
  for (const row of rows) {
    let picked = 0;
    for (const f of amountFields) {
      if (Object.prototype.hasOwnProperty.call(row, f) && row[f] != null) {
        picked = Number(row[f]) || 0;
        break;
      }
    }
    total += picked;
  }
  return total;
}

const MultasRenovacionesModule = () => {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  const [proximasRenovaciones, setProximasRenovaciones] = useState(0);
  const [acumAfiliaciones, setAcumAfiliaciones] = useState(0);
  const [acumMultasHoja, setAcumMultasHoja] = useState(0);
  const [acumMoras, setAcumMoras] = useState(0);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        await Promise.all([
          loadProximasRenovaciones(),
          loadAcumAfiliaciones(),
          loadAcumMultasHoja(),
          loadAcumMoras(),
        ]);
      } catch (e) {
        setErr('No se pudo cargar toda la información. Revisa la consola para detalles.');
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // 1) Próximas Renovaciones
  const loadProximasRenovaciones = async () => {
    const { primary, fallback, daysWindow } = CFG.renovaciones;
    const today = new Date();
    const to = new Date();
    to.setDate(today.getDate() + (daysWindow || 15));

    const fromStr = ymd(today);
    const toStr = ymd(to);

    // Intenta en tabla primaria 'renovaciones'
    // Filtra por fecha_renovacion entre hoy y +N días, y estatus=pendiente (si existe)
    let url = `${SUPABASE_URL}/rest/v1/${primary.table}?${primary.dateField}=gte.${fromStr}&${primary.dateField}=lte.${toStr}&select=${primary.dateField}`;
    if (primary.statusField && primary.pendingValue) {
      url += `&${primary.statusField}=eq.${encodeURIComponent(primary.pendingValue)}`;
    }

    let { ok, data } = await fetchJSON(url);

    // Fallback: 'socios' con fecha_renovacion en rango y estatus=activo
    if (!ok || !Array.isArray(data)) {
      console.warn('Usando fallback para Próximas Renovaciones en tabla:', fallback.table);
      let urlFB = `${SUPABASE_URL}/rest/v1/${fallback.table}?${fallback.dateField}=gte.${fromStr}&${fallback.dateField}=lte.${toStr}&select=${fallback.dateField}`;
      if (fallback.statusField && fallback.activeValue) {
        urlFB += `&${fallback.statusField}=eq.${encodeURIComponent(fallback.activeValue)}`;
      }
      const fbRes = await fetchJSON(urlFB);
      if (fbRes.ok && Array.isArray(fbRes.data)) {
        setProximasRenovaciones(fbRes.data.length);
        return;
      }
      setProximasRenovaciones(0);
      return;
    }

    setProximasRenovaciones(data.length);
  };

  // 2) Acumulado de Afiliaciones
  const loadAcumAfiliaciones = async () => {
    const { primary, fallback } = CFG.afiliaciones;

    // primaria
    let url = `${SUPABASE_URL}/rest/v1/${primary.table}?select=${encodeURIComponent(primary.amountFields.join(','))}`;
    let { ok, data } = await fetchJSON(url);
    if (ok && Array.isArray(data)) {
      setAcumAfiliaciones(sumAmountFlexible(data, primary.amountFields));
      return;
    }

    // fallback
    console.warn('Usando fallback para Afiliaciones en tabla:', fallback.table);
    let urlFB = `${SUPABASE_URL}/rest/v1/${fallback.table}?select=${encodeURIComponent(fallback.amountFields.join(','))}`;
    const fbRes = await fetchJSON(urlFB);
    if (fbRes.ok && Array.isArray(fbRes.data)) {
      setAcumAfiliaciones(sumAmountFlexible(fbRes.data, fallback.amountFields));
      return;
    }
    setAcumAfiliaciones(0);
  };

  // 3) Acumulado de multas por hoja
  const loadAcumMultasHoja = async () => {
    const { table, typeField, typeValue, amountFields } = CFG.multasHoja;
    const url = `${SUPABASE_URL}/rest/v1/${table}?${typeField}=eq.${encodeURIComponent(typeValue)}&select=${encodeURIComponent(amountFields.join(','))}`;
    const { ok, data } = await fetchJSON(url);
    if (ok && Array.isArray(data)) {
      setAcumMultasHoja(sumAmountFlexible(data, amountFields));
      return;
    }
    console.warn('No se pudo leer multas por hoja; ¿existe la tabla/columnas?');
    setAcumMultasHoja(0);
  };

  // 4) Acumulado de moras
  const loadAcumMoras = async () => {
    const { table, typeField, typeValue, amountFields } = CFG.moras;
    const url = `${SUPABASE_URL}/rest/v1/${table}?${typeField}=eq.${encodeURIComponent(typeValue)}&select=${encodeURIComponent(amountFields.join(','))}`;
    const { ok, data } = await fetchJSON(url);
    if (ok && Array.isArray(data)) {
      setAcumMoras(sumAmountFlexible(data, amountFields));
      return;
    }
    console.warn('No se pudo leer moras; ¿existe la tabla/columnas?');
    setAcumMoras(0);
  };

  const cards = [
    {
      title: 'Próximas Renovaciones',
      value: proximasRenovaciones.toLocaleString(),
      bg: 'bg-yellow-100',
      text: 'text-yellow-800',
      icon: (
        <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      title: 'Acumulado de Afiliaciones',
      value: mxn(acumAfiliaciones),
      bg: 'bg-green-100',
      text: 'text-green-800',
      icon: (
        <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
    },
    {
      title: 'Acumulado de multas por hoja',
      value: mxn(acumMultasHoja),
      bg: 'bg-purple-100',
      text: 'text-purple-800',
      icon: (
        <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      ),
    },
    {
      title: 'Acumulado de moras',
      value: mxn(acumMoras),
      bg: 'bg-red-100',
      text: 'text-red-800',
      icon: (
        <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-1">Multas y Renovaciones</h2>
          <p className="text-slate-600">Resumen ejecutivo de renovaciones, afiliaciones y penalizaciones</p>
        </div>
      </div>

      {loading && (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-indigo-500"></div>
          <p className="ml-4 text-slate-700 text-lg">Cargando datos...</p>
        </div>
      )}

      {err && !loading && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl">
          {err}
        </div>
      )}

      {!loading && !err && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {cards.map((c, i) => (
            <div
              key={i}
              className={`relative ${c.bg} rounded-2xl shadow-lg p-6 transform transition-all duration-300 hover:scale-105 hover:shadow-xl`}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-lg font-semibold ${c.text}`}>{c.title}</h3>
                <div className="p-2 rounded-full bg-white bg-opacity-30">
                  {c.icon}
                </div>
              </div>
              <p className={`text-4xl font-bold ${c.text}`}>{c.value}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MultasRenovacionesModule;
