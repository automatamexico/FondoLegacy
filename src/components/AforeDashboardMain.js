import React, { useEffect, useState } from 'react';

const SUPABASE_URL = 'https://ubfkhtkmlvutwdivmoff.supabase.co';
const SUPABASE_ANON_KEY = 'TU_ANON_KEY_AQUI';

const AforeDashboardMain = () => {
  const [stats, setStats] = useState({
    afiliados: 0,
    ahorroAcumulado: 0,
    interesDia: 0,
    interesAcumulado: 0,
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchJSON = async (url) => {
    const res = await fetch(url, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
    });
    return res.json();
  };

  const fetchStats = async () => {
    setLoading(true);

    const afiliados = await fetchJSON(
      `${SUPABASE_URL}/rest/v1/afore_afiliados?select=id_afiliado`
    );

    const ahorros = await fetchJSON(
      `${SUPABASE_URL}/rest/v1/ahorro_afore?select=ahorro_aportado`
    );

    const totalAhorro = ahorros.reduce(
      (sum, row) => sum + (parseFloat(row.ahorro_aportado) || 0),
      0
    );

    setStats({
      afiliados: afiliados.length,
      ahorroAcumulado: totalAhorro,
      interesDia: 0,
      interesAcumulado: 0,
    });

    setLoading(false);
  };

  const formatCurrency = (value) =>
    new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(value || 0);

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

      {loading ? (
        <div className="text-center">Cargando...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card title="Afiliados al Afore" value={stats.afiliados} />
          <Card
            title="Ahorro acumulado"
            value={formatCurrency(stats.ahorroAcumulado)}
          />
          <Card title="Interés al día" value={formatCurrency(0)} />
          <Card title="Interés acumulado" value={formatCurrency(0)} />
        </div>
      )}
    </div>
  );
};

const Card = ({ title, value }) => (
  <div className="bg-white rounded-2xl shadow p-6">
    <h3 className="text-lg font-semibold">{title}</h3>
    <p className="text-3xl font-bold mt-2">{value}</p>
  </div>
);

export default AforeDashboardMain;
