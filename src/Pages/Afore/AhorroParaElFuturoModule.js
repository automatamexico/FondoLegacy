import React, { useEffect, useState } from "react";

const SUPABASE_URL = "https://ubfkhtkmlvutwdivmoff.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InViZmtodGttbHZ1dHdkaXZtb2ZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4MTc5NTUsImV4cCI6MjA2NjM5Mzk1NX0.c0iRma-dnlL29OR3ffq34nmZuj_ViApBTMG-6PEX_B4";

const headers = {
  "Content-Type": "application/json",
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
};

const formatCurrency = (value) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(Number(value || 0));

const getCountFromContentRange = (resp) => {
  const cr = resp.headers.get("content-range") || "0/0";
  const total = Number((cr.split("/")?.[1] || "0").trim());
  return Number.isFinite(total) ? total : 0;
};

const Card = ({ title, value, sub }) => (
  <div className="bg-white rounded-2xl border border-slate-200 p-6">
    <h3 className="font-semibold text-slate-900">{title}</h3>
    <div className="mt-2 text-3xl font-extrabold text-slate-900">{value}</div>
    {sub ? <div className="mt-1 text-sm text-slate-500">{sub}</div> : null}
  </div>
);

const AhorroParaElFuturoModule = () => {
  const [loading, setLoading] = useState(true);
  const [afiliadosCount, setAfiliadosCount] = useState(0);
  const [ahorroAcumulado, setAhorroAcumulado] = useState(0);

  // placeholders (sin estructura aún)
  const [interesAlDia] = useState(null);
  const [interesAcumulado] = useState(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        // 1) Conteo de afiliados (tabla: afore_afiliados)
        const r1 = await fetch(
          `${SUPABASE_URL}/rest/v1/afore_afiliados?select=count`,
          {
            method: "GET",
            headers: {
              ...headers,
              Prefer: "count=exact",
              Range: "0-0",
              "Range-Unit": "items",
            },
          }
        );
        if (r1.ok) setAfiliadosCount(getCountFromContentRange(r1));

        // 2) Suma total de ahorros (tabla: ahorro_afore, campo: ahorro_aportado)
        //    Si tus retiros van como negativos aquí mismo, esto ya calcula “neto”.
        const r2 = await fetch(
          `${SUPABASE_URL}/rest/v1/ahorro_afore?select=ahorro_aportado`,
          { headers }
        );
        if (r2.ok) {
          const rows = await r2.json();
          const total = (rows || []).reduce((acc, x) => acc + (Number(x.ahorro_aportado) || 0), 0);
          setAhorroAcumulado(total);
        }
      } catch (e) {
        console.error("Afore KPIs error:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Ahorro para el Futuro</h2>
          <p className="text-slate-600">
            Sección AFORE separada de tu Fondo de Ahorro (tablas y flujos independientes).
          </p>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 text-slate-600">
          Cargando indicadores…
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          <Card title="Afore Afiliados" value={afiliadosCount.toLocaleString()} />
          <Card title="Ahorro Acumulado" value={formatCurrency(ahorroAcumulado)} sub="Suma neta de ahorro_aportado" />
          <Card title="Interes al día" value={interesAlDia == null ? "—" : formatCurrency(interesAlDia)} sub="Pendiente de estructura" />
          <Card title="Interes Acumulado" value={interesAcumulado == null ? "—" : formatCurrency(interesAcumulado)} sub="Pendiente de estructura" />
        </div>
      )}

      {/* Aquí después metemos tus pantallas de Afiliados, Movimientos, etc */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <p className="text-slate-700 font-semibold mb-1">Siguiente paso (cuando quieras)</p>
        <p className="text-slate-600">
          Agregamos submódulos: Afiliados, Movimientos, Retiros, Reportes… todo dentro de /afore.
        </p>
      </div>
    </div>
  );
};

export default AhorroParaElFuturoModule;
