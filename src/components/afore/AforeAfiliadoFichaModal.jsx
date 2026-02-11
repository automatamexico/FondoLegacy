import React from "react";

const AforeAfiliadoFichaModal = ({ afiliado, onClose, bucketName }) => {
  if (!afiliado) return null;

  const avatarFallback = (a) => {
    const n1 = (a?.nombre || "A").trim().charAt(0).toUpperCase();
    const n2 = (a?.apellido_paterno || "F").trim().charAt(0).toUpperCase();
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80">
        <rect width="100%" height="100%" rx="16" ry="16" fill="#2563eb"/>
        <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle"
              font-family="Arial" font-size="28" fill="#ffffff" font-weight="700">
          ${n1}${n2}
        </text>
      </svg>
    `.trim();
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  };

  const fmtFecha = (isoDate) => {
    if (!isoDate) return "-";
    if (/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) {
      const [y, m, d] = isoDate.split("-").map(Number);
      const dt = new Date(y, m - 1, d);
      return dt.toLocaleDateString("es-MX", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    }
    const dt = new Date(isoDate);
    if (Number.isNaN(dt.getTime())) return String(isoDate);
    return dt.toLocaleDateString("es-MX", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const fmtDateTime = (iso) => {
    if (!iso) return "-";
    const dt = new Date(iso);
    if (Number.isNaN(dt.getTime())) return String(iso);
    return dt.toLocaleString("es-MX");
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-2xl">

        <div className="flex items-start justify-between mb-4">
          <h3 className="text-xl font-bold text-slate-900">
            Ficha del Afiliado
          </h3>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-900"
          >
            Cerrar
          </button>
        </div>

        {/* FOTO + INFO PRINCIPAL */}
        <div className="flex items-center gap-4 mb-6">
          <img
            src={afiliado.foto_url || avatarFallback(afiliado)}
            alt="foto"
            className="w-20 h-20 rounded-xl object-cover border"
            onError={(e) => {
              e.currentTarget.src = avatarFallback(afiliado);
            }}
          />
          <div>
            <div className="text-sm text-slate-500">ID Afiliado</div>
            <div className="text-lg font-semibold">
              {afiliado.id_afiliado}
            </div>
            <div className="text-slate-900 font-medium">
              {afiliado.nombre} {afiliado.apellido_paterno}{" "}
              {afiliado.apellido_materno}
            </div>
          </div>
        </div>

        {/* GRID INFO */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          <div className="p-3 bg-slate-50 rounded-lg">
            <div className="text-xs text-slate-500">Correo</div>
            <div className="font-medium break-all">
              {afiliado.email || "-"}
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg">
            <div className="text-xs text-slate-500">Teléfono</div>
            <div className="font-medium">
              {afiliado.telefono || "-"}
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg">
            <div className="text-xs text-slate-500">Dirección</div>
            <div className="font-medium">
              {afiliado.direccion || "-"}
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg">
            <div className="text-xs text-slate-500">Código Postal</div>
            <div className="font-medium">
              {afiliado.cp || "-"}
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg">
            <div className="text-xs text-slate-500">Fecha de nacimiento</div>
            <div className="font-medium">
              {fmtFecha(afiliado.fecha_nacimiento)}
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg">
            <div className="text-xs text-slate-500">Miembro desde</div>
            <div className="font-medium">
              {fmtFecha(afiliado.miembro_desde)}
            </div>
          </div>

          {/* NUEVO CAMPO REFERIDO */}
          <div className="p-3 bg-slate-50 rounded-lg md:col-span-2">
            <div className="text-xs text-slate-500">Referido Por</div>
            <div className="font-medium">
              {afiliado.es_referido
                ? afiliado.nombre_referido
                : "No Referido"}
            </div>
          </div>

          {/* CONTRASEÑA */}
          <div className="p-3 bg-slate-50 rounded-lg">
            <div className="text-xs text-slate-500">Contraseña</div>
            <div className="font-medium break-all">
              {afiliado.contraseña || "-"}
            </div>
          </div>

          {/* ESTATUS */}
          <div className="p-3 bg-slate-50 rounded-lg">
            <div className="text-xs text-slate-500">Estatus</div>
            <div className="font-medium">
              {afiliado.estatus || "-"}
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg">
            <div className="text-xs text-slate-500">Creado</div>
            <div className="font-medium">
              {fmtDateTime(afiliado.created_at)}
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg">
            <div className="text-xs text-slate-500">Actualizado</div>
            <div className="font-medium">
              {fmtDateTime(afiliado.updated_at)}
            </div>
          </div>

        </div>

        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};

export default AforeAfiliadoFichaModal;
