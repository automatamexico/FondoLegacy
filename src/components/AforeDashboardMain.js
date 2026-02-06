import React, { useEffect, useState } from 'react';

const SUPABASE_URL = 'https://ubfkhtkmlvutwdivmoff.supabase.co';
const SUPABASE_ANON_KEY = 'TU_ANON_KEY_AQUI';

const AforeDashboardMain = () => {
  const [stats, setStats] = useState({
    afiliados: 0,
    ahorro: 0,
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarDatos();
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

  const cargarDatos = async () => {
    setLoading(true);

    const afiliados = await fetchJSON(
      `${SUPABASE_URL}/rest/v1/afore_afiliados?select=id_afiliado`
    );

    const ahorros = await fetchJSON(
      `${SUPABASE_URL}/rest/v1/ahorro_afore?select=ahorro_aportado`
    );

    const totalAhorro = ahorros.reduce(
      (s, r) => s + Number(r.ahorro_aportado || 0),
      0
    );

    setStats({
      afiliados: afiliados.length,
      ahorro: totalAhorro,
    });

    setLoading(false);
  };

  return (
    <div className="p-6 bg-slate-50 min-h-full">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold">Control de AFORE</h1>
        <p className="text-slate-600 text-lg">
          Tablero general de ahorro para el futuro
        </p>
      </div>

      {loading ? (
        <div className="text-center text-lg">Cargando...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <Card title="Afiliados registrados" value={stats.afiliados} />
          <Card title="Ahorro acumulado" value={`$${stats.ahorro.toLocaleString()}`} />
        </div>
      )}
    </div>
  );
};

const Card = ({ title, value }) => (
  <div className="bg-white p-6 rounded-2xl shadow">
    <h3 className="text-lg font-semibold">{title}</h3>
    <p className="text-3xl font-bold mt-2">{value}</p>
  </div>
);

export default AforeDashboardMain;
