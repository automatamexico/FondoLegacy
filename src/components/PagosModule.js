import React, { useState } from "react";

const formatMXN = (n) =>
  (Number(n) || 0).toLocaleString("es-MX", { style: "currency", currency: "MXN" });

const nowCDMX = () =>
  new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Mexico_City",
  }).format(new Date());

const PagosModule = () => {
  const [monto, setMonto] = useState("");
  const [entregado, setEntregado] = useState("");
  const [metodo, setMetodo] = useState("Transferencia");
  const [referencia, setReferencia] = useState("");
  const [concepto, setConcepto] = useState("Abono a préstamo");
  const [registro, setRegistro] = useState(null);

  const montoNum = parseFloat(monto) || 0;
  const entregadoNum = parseFloat(entregado) || 0;
  const cambio = metodo === "Efectivo" ? Math.max(0, entregadoNum - montoNum) : 0;
  const puedeRegistrar = montoNum > 0 && metodo;

  const handleRegistrar = () => {
    if (!puedeRegistrar) return;
    setRegistro({
      id: Date.now(),
      fecha: nowCDMX(),
      monto: montoNum,
      entregado: entregadoNum,
      cambio,
      metodo,
      referencia: referencia.trim(),
      concepto,
    });
  };

  const handleLimpiar = () => {
    setMonto("");
    setEntregado("");
    setMetodo("Transferencia");
    setReferencia("");
    setConcepto("Abono a préstamo");
    setRegistro(null);
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border space-y-5">
      <h2 className="text-lg font-semibold">Registrar pago</h2>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-slate-600 mb-1">Concepto</label>
          <select
            className="w-full border rounded-lg px-3 py-2"
            value={concepto}
            onChange={(e) => setConcepto(e.target.value)}
          >
            <option>Abono a préstamo</option>
            <option>Depósito de ahorro</option>
            <option>Cuota administrativa</option>
            <option>Otro</option>
          </select>
        </div>

        <div>
          <label className="block text-sm text-slate-600 mb-1">Método de pago</label>
          <select
            className="w-full border rounded-lg px-3 py-2"
            value={metodo}
            onChange={(e) => setMetodo(e.target.value)}
          >
            <option>Transferencia</option>
            <option>Depósito</option>
            <option>Efectivo</option>
          </select>
        </div>

        <div>
          <label className="block text-sm text-slate-600 mb-1">Monto a pagar</label>
          <input
            type="number"
            className="w-full border rounded-lg px-3 py-2"
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            placeholder="0.00"
            min="0"
            step="0.01"
          />
        </div>

        <div>
          <label className="block text-sm text-slate-600 mb-1">
            Monto recibido {metodo === "Efectivo" ? "(para calcular cambio)" : "(opcional)"}
          </label>
          <input
            type="number"
            className="w-full border rounded-lg px-3 py-2"
            value={entregado}
            onChange={(e) => setEntregado(e.target.value)}
            placeholder="0.00"
            min="0"
            step="0.01"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-sm text-slate-600 mb-1">
            Referencia / folio (transferencia, depósito, etc.)
          </label>
          <input
            className="w-full border rounded-lg px-3 py-2"
            value={referencia}
            onChange={(e) => setReferencia(e.target.value)}
            placeholder="Ej. 1234-REF-BANCO"
          />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="p-4 bg-slate-50 rounded-lg border">
          <p className="text-sm text-slate-600">Resumen</p>
          <div className="mt-2 space-y-1">
            <p className="text-sm">Monto: <strong>{formatMXN(montoNum)}</strong></p>
            <p className="text-sm">Entregado: <strong>{formatMXN(entregadoNum)}</strong></p>
            <p className="text-sm">Cambio: <strong>{formatMXN(cambio)}</strong></p>
          </div>
        </div>

        <div className="flex items-end justify-end gap-2">
          <button onClick={handleLimpiar} className="px-4 py-2 border rounded-lg hover:bg-slate-50">
            Limpiar
          </button>
          <button
            onClick={handleRegistrar}
            className={`px-4 py-2 rounded-lg text-white ${
              puedeRegistrar ? "bg-indigo-600 hover:bg-indigo-700" : "bg-slate-400 cursor-not-allowed"
            }`}
            disabled={!puedeRegistrar}
          >
            Registrar pago
          </button>
        </div>
      </div>

      {registro && (
        <div className="border rounded-lg p-4">
          <h3 className="font-semibold mb-2">Ticket — DELSU Fondo de Inversión</h3>
          <div className="text-sm space-y-1">
            <p>ID: {registro.id}</p>
            <p>Fecha (CDMX): {registro.fecha}</p>
            <p>Concepto: {registro.concepto}</p>
            <p>Método: {registro.metodo}</p>
            <p>Referencia: {registro.referencia || "—"}</p>
            <p>Monto: <strong>{formatMXN(registro.monto)}</strong></p>
            <p>Entregado: <strong>{formatMXN(registro.entregado)}</strong></p>
            <p>Cambio: <strong>{formatMXN(registro.cambio)}</strong></p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PagosModule;


