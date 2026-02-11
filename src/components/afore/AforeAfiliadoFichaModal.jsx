import React from "react";

const AforeAfiliadoFichaModal = ({ afiliado, onClose }) => {
  if (!afiliado) return null;

  const tipoRegistro =
    afiliado.referido && afiliado.nombre_referido !== "Nuevo"
      ? `Referido por: ${afiliado.nombre_referido}`
      : "Nuevo";

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-2xl">

        <div className="flex justify-between mb-6">
          <h3 className="text-xl font-bold text-slate-900">
            Ficha del Afiliado
          </h3>
          <button onClick={onClose}>Cerrar</button>
        </div>

        <div className="flex items-center gap-6 mb-6">
          <img
            src={afiliado.foto_url}
            alt="foto"
            className="w-24 h-24 rounded-xl object-cover border"
          />
          <div>
            <div className="text-sm text-slate-500">
              ID Afiliado
            </div>
            <div className="text-lg font-semibold">
              {afiliado.id_afiliado}
            </div>
            <div className="text-slate-900 font-medium">
              {afiliado.nombre} {afiliado.apellido_paterno} {afiliado.apellido_materno}
            </div>
            <div className="text-sm text-slate-600 mt-1">
              {tipoRegistro}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">

          <div className="p-3 bg-slate-50 rounded-lg">
            <div className="text-xs text-slate-500">Correo</div>
            <div className="font-medium">{afiliado.email}</div>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg">
            <div className="text-xs text-slate-500">Teléfono</div>
            <div className="font-medium">{afiliado.telefono}</div>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg">
            <div className="text-xs text-slate-500">Dirección</div>
            <div className="font-medium">{afiliado.direccion}</div>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg">
            <div className="text-xs text-slate-500">Código Postal</div>
            <div className="font-medium">{afiliado.cp}</div>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg">
            <div className="text-xs text-slate-500">Fecha Nacimiento</div>
            <div className="font-medium">{afiliado.fecha_nacimiento}</div>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg">
            <div className="text-xs text-slate-500">Miembro desde</div>
            <div className="font-medium">{afiliado.miembro_desde}</div>
          </div>

        </div>

        <div className="flex justify-end mt-8">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-blue-600 text-white rounded-xl"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default AforeAfiliadoFichaModal;
