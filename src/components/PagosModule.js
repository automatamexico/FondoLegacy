import React, { useState } from "react";

const PagosModule = () => {
  const [propina, setPropina] = useState(0);
  const [monto, setMonto] = useState(350);
  const [darPropina, setDarPropina] = useState(false);

  const tipPercent = [5,10,15];
  const total = darPropina ? monto + (monto * propina / 100) : monto;

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border space-y-4">
      <h2 className="text-lg font-semibold">Registrar pago</h2>
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="text-sm text-slate-600">Monto</label>
          <input type="number" value={monto} onChange={(e)=>setMonto(Number(e.target.value)||0)} className="w-full border rounded-lg px-3 py-2" />
        </div>
        <div>
          <label className="text-sm text-slate-600 block">¿Agregar propina?</label>
          <select value={darPropina? "si" : "no"} onChange={(e)=>setDarPropina(e.target.value==="si")} className="border rounded-lg px-3 py-2">
            <option value="no">No</option>
            <option value="si">Sí</option>
          </select>
        </div>
        {darPropina && (
          <div className="sm:col-span-2">
            <label className="text-sm text-slate-600 block mb-1">Selecciona porcentaje</label>
            <div className="flex items-center gap-2">
              {tipPercent.map(p => (
                <button key={p} onClick={()=>setPropina(p)} className={`px-3 py-1.5 rounded-lg border ${propina===p?"bg-slate-800 text-white":"hover:bg-slate-50"}`}>{p}%</button>
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="p-4 bg-slate-50 rounded-lg">
        <p className="text-sm">Total a cobrar: <strong>${"{:,.2f}".format(total)}</strong></p>
      </div>
      <div className="border rounded-lg p-4">
        <h3 className="font-semibold mb-2">Ticket</h3>
        <p className="text-sm">Monto base: ${"{:,.2f}".format(monto)}</p>
        <p className="text-sm">Propina: {darPropina ? f"${propina}%" : "—"}</p>
        <p className="text-sm font-semibold">Total: ${"{:,.2f}".format(total)}</p>
      </div>
    </div>
  );
};

export default PagosModule;
