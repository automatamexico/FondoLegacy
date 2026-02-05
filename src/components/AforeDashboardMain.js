import React, { useEffect, useState } from 'react';

const SUPABASE_URL = 'https://ubfkhtkmlvutwdivmoff.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InViZmtodGttbHZ1dHdkaXZtb2ZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4MTc5NTUsImV4cCI6MjA2NjM5Mzk1NX0.c0iRma-dnlL29OR3ffq34nmZuj_ViApBTMG-6PEX_B4'; // usa la misma que ya usas en otros módulos

const AforeDashboardMain = () => {
  const [stats, setStats] = useState({
    afiliados: 0,
    ahorroAcumulado: 0,
    interesDia: 0,
    interesAcumulado: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAforeStats();
  }, []);

  const fetchJSON = async (url) => {
    const res = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
    });
    if (!res.ok) throw new Error('Error al consultar datos AFORE');
    return res.json();
  };

  const fetchAforeStats = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1️⃣ Afiliados únicos al AFORE
      const afiliados = await fetchJSON(
        `${SUPABASE_URL}/rest/v1/afore_afiliados?select=id_afiliado`
      );
      const totalAfiliados = afiliados.length;

      // 2️⃣ Ahorro acumulado (suma de aportaciones)
      const ahorros = await fetchJSON(
        `${SUPABASE_URL}/rest/v1/ahorro_afore?select=ahorro_aportado`
      );
      const totalAhorro = ahorros.reduce(
        (sum, row) => sum + (parseFloat(row.ahorro_aportado) || 0),
        0
      );

      setStats({
        afiliados: totalAfiliados,
        ahorroAcumulado: totalAhorro,
        interesDia: 0,        // pendiente
        interesAcumulado: 0, // pendiente
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) =>
    new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(value || 0);

  const cards = [
    {
      title: 'Afiliados al Afore',
      value: stats.afiliados.toLocaleString(),
      color: 'bg-green-100 text-green-800',
    },
    {
      title: 'Ahorro Acumulado',
      value: formatCurrency(stats.ahorroAcumulado),
      color: 'bg-emerald-100 text-emerald-800',
    },
    {
      title: 'Interés al día',
      value: formatCurrency(stats.interesDia),
      color: 'bg-slate-100 text-slate-600',
    },
    {
      title: 'Interés acumulado',
      value: formatCurrency(stats.interesAcumulado),
      color: 'bg-slate-100 text-slate-600',
    },
  ];

  return (
    <div className="p-6 space-y-8 bg-slate-50 min-h-full">
      <div className="text-center">
        <h1 className="text-4xl font-extrabold text-slate-900 mb-2">
          Control de Afore
        </h1>
        <p className="text-xl text-slate-600">
          Tablero general de ahorro para el futuro
        </p>
      </div>

      {loading && (
        <div className="flex justify-center items-center h-48">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-green-500"></div>
          <p className="ml-4 text-slate-700 text-lg">Cargando datos...</p>
        </div>
      )}

      {error && !loading && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {cards.map((card, i) => (
            <div
              key={i}
              className={`rounded-2xl shadow-lg p-6 hover:scale-105 transition ${card.color}`}
            >
              <h3 className="text-lg font-semibold mb-2">
                {card.title}
              </h3>
              <p className="text-4xl font-bold">
                {card.value}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AforeDashboardMain;
