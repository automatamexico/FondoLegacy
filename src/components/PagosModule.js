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

