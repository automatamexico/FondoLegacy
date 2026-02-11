import React, { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";

const BUCKET_BENEFICIARIOS = "Beneficiarios-Afore";

const AforeAfiliadoFichaModal = ({ afiliado, onClose, bucketName }) => {
  if (!afiliado) return null;

  const [refs, setRefs] = useState([]);
  const [beneficiarios, setBeneficiarios] = useState([]);

  // ===============================
  // CARGAR DATOS RELACIONADOS
  // ===============================
  useEffect(() => {
    cargarReferencias();
    cargarBeneficiarios();
  }, [afiliado]);

  const cargarReferencias = async () => {
    const { data } = await supabase
      .from("refs_afore")
      .select("*")
      .eq("id_afiliado", afiliado.id_afiliado);

    setRefs(data || []);
  };

  const cargarBeneficiarios = async () => {
    const { data } = await supabase
      .from("beneficiarios_afore")
      .select("*")
      .eq("id_afiliado", afiliado.id_afiliado);

    setBeneficiarios(data || []);
  };

  // ===============================
  // UTILIDADES EXISTENTES (NO TOCADAS)
  // ===============================

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
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-2xl">

        {/* HEADER */}
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-xl font-bold text-slate-900">
            Ficha del afiliado
          </h3>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-900"
          >
            Cerrar
          </button>
        </div>

        {/* DATOS PRINCIPALES */}
        <div className="flex items-center space-x-4 mb-4">
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

            <div className="text-sm text-slate-600 mt-1">
              Teléfono:{" "}
              <span className="font-medium text-slate-900">
                {afiliado.telefono || "-"}
              </span>
            </div>

            <div className="text-xs text-slate-500 mt-1">
              Bucket:{" "}
              <span className="font-medium">{bucketName}</span>
            </div>
          </div>
        </div>

        {/* GRID PRINCIPAL */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          <div className="p-3 bg-slate-50 rounded-lg">
            <div className="text-xs text-slate-500">Correo</div>
            <div className="font-medium break-all">
              {afiliado.email || "-"}
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg">
            <div className="text-xs text-slate-500">Estatus</div>
            <div className="font-medium">
              {afiliado.estatus || "-"}
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg">
            <div className="text-xs text-slate-500">
              Fecha de nacimiento
            </div>
            <div className="font-medium">
              {fmtFecha(afiliado.fecha_nacimiento)}
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg">
            <div className="text-xs text-slate-500">
              Miembro desde
            </div>
            <div className="font-medium">
              {fmtFecha(afiliado.miembro_desde)}
            </div>
          </div>

        </div>

        {/* =============================== */}
        {/* REFERENCIAS */}
        {/* =============================== */}

        <div className="h-1 bg-blue-600 rounded-full mt-8"></div>

        <h3 className="text-lg font-bold mt-4 mb-3">
          Referencias Personales
        </h3>

        {refs.length === 0 && (
          <p className="text-slate-500 text-sm">
            No hay referencias registradas.
          </p>
        )}

        {refs.map((r) => (
          <div
            key={r.id_ref}
            className="p-3 bg-slate-50 rounded-lg mb-2"
          >
            <div className="font-medium">
              {r.nombre} {r.apellido_paterno}{" "}
              {r.apellido_materno}
            </div>
            <div className="text-sm text-slate-600">
              Tel: {r.telefono || "-"}
            </div>
            <div className="text-sm text-slate-600">
              Dir: {r.direccion || "-"}
            </div>
          </div>
        ))}

        {/* =============================== */}
        {/* BENEFICIARIOS */}
        {/* =============================== */}

        <div className="h-1 bg-blue-600 rounded-full mt-8"></div>

        <h3 className="text-lg font-bold mt-4 mb-3">
          Beneficiarios
        </h3>

        {beneficiarios.length === 0 && (
          <p className="text-slate-500 text-sm">
            No hay beneficiarios registrados.
          </p>
        )}

        {beneficiarios.map((b) => (
          <div
            key={b.id_beneficiario}
            className="p-3 bg-slate-50 rounded-lg mb-2"
          >
            <div className="font-medium">
              {b.nombre} {b.apellido_paterno}{" "}
              {b.apellido_materno}
            </div>
            <div className="text-sm text-slate-600">
              Tel: {b.telefono || "-"}
            </div>
            <div className="text-sm text-slate-600">
              Dir: {b.direccion || "-"}
            </div>

            {b.foto_url && (
              <a
                href={b.foto_url}
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 text-sm block mt-1"
              >
                Ver Foto
              </a>
            )}

            {b.documento_url && (
              <a
                href={b.documento_url}
                target="_blank"
                rel="noreferrer"
                className="text-green-600 text-sm block"
              >
                Ver Documento
              </a>
            )}
          </div>
        ))}

        {/* BOTÓN FINAL */}
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
