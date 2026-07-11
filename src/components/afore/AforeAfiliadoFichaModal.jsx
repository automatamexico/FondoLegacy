import React, { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";

const AforeAfiliadoFichaModal = ({ afiliado, onClose, bucketName }) => {
  if (!afiliado) return null;

  const [refs, setRefs] = useState([]);
  const [beneficiarios, setBeneficiarios] = useState([]);
  const [referenciaBancaria, setReferenciaBancaria] = useState(null);
  const [loadingExtras, setLoadingExtras] = useState(false);
  const [extrasError, setExtrasError] = useState("");

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

  // evita desfase de fecha (mismo truco que Socios)
  const fmtFecha = (isoDate) => {
    if (!isoDate) return "-";
    // si viene como "YYYY-MM-DD"
    if (/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) {
      const [y, m, d] = isoDate.split("-").map(Number);
      const dt = new Date(y, m - 1, d);
      return dt.toLocaleDateString("es-MX", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    }
    // si viene como timestamp
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

  const getFullName = (x) =>
    `${x?.nombre || ""} ${x?.apellido_paterno || ""} ${x?.apellido_materno || ""}`
      .replace(/\s+/g, " ")
      .trim();

  const fetchExtras = async () => {
    setLoadingExtras(true);
    setExtrasError("");

    try {
      // REFERENCIAS
      const { data: refsData, error: refsErr } = await supabase
        .from("refs_afore")
        .select("*")
        .eq("id_afiliado", afiliado.id_afiliado)
        .order("created_at", { ascending: false });

      if (refsErr) throw refsErr;

      // BENEFICIARIOS
      const { data: benData, error: benErr } = await supabase
        .from("beneficiarios_afore")
        .select("*")
        .eq("id_afiliado", afiliado.id_afiliado)
        .order("created_at", { ascending: false });

    if (benErr) throw benErr;

// REFERENCIA BANCARIA
const { data: bancoData, error: bancoErr } = await supabase
  .from("referencias_bancarias_afore")
  .select("*")
  .eq("id_afiliado", afiliado.id_afiliado)
  .maybeSingle();

if (bancoErr) throw bancoErr;

setRefs(refsData || []);
setBeneficiarios(benData || []);
setReferenciaBancaria(bancoData || null);
    } catch (e) {
      setExtrasError(e?.message || "No se pudieron cargar referencias/beneficiarios.");
     setRefs([]);
setBeneficiarios([]);
setReferenciaBancaria(null);
    } finally {
      setLoadingExtras(false);
    }
  };

 useEffect(() => {
  if (afiliado?.id_afiliado) {
    fetchExtras();
  }
}, [afiliado]);


  // “Referido Por:” (regla: si es_referido = false -> No Referido, si true -> nombre_referido)
  const referidoPor = afiliado?.es_referido
    ? afiliado?.nombre_referido || "-"
    : "No Referido";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-4 z-50">
     <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-4xl max-h-[85vh] overflow-y-auto">
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-xl font-bold text-slate-900">Ficha del Afiliado</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-900">
            Cerrar
          </button>
        </div>

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
            <div className="text-lg font-semibold">{afiliado.id_afiliado}</div>

            <div className="text-slate-900 font-medium">
              {afiliado.nombre} {afiliado.apellido_paterno} {afiliado.apellido_materno}
            </div>

            
          </div>
        </div>

        {/* === GRID ORIGINAL (NO TOCADO, SOLO INCLUYE LO QUE YA TENÍAS) === */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-3 bg-slate-50 rounded-lg">
            <div className="text-xs text-slate-500">Correo</div>
            <div className="font-medium break-all">{afiliado.email || "-"}</div>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg">
            <div className="text-xs text-slate-500">Teléfono</div>
            <div className="font-medium break-all">{afiliado.telefono || "-"}</div>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg">
            <div className="text-xs text-slate-500">Dirección</div>
            <div className="font-medium">{afiliado.direccion || "-"}</div>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg">
            <div className="text-xs text-slate-500">Código Postal</div>
            <div className="font-medium">{afiliado.cp || "-"}</div>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg">
            <div className="text-xs text-slate-500">Fecha de nacimiento</div>
            <div className="font-medium">{fmtFecha(afiliado.fecha_nacimiento)}</div>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg">
            <div className="text-xs text-slate-500">Miembro desde</div>
            <div className="font-medium">{fmtFecha(afiliado.miembro_desde)}</div>
          </div>

          <div className="md:col-span-2 p-3 bg-slate-50 rounded-lg">
            <div className="text-xs text-slate-500">Referido Por:</div>
            <div className="font-medium break-all">{referidoPor}</div>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg">
            <div className="text-xs text-slate-500">Contraseña</div>
            <div className="font-medium break-all">{afiliado.contraseña || "-"}</div>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg">
            <div className="text-xs text-slate-500">Estatus</div>
            <div className="font-medium">{afiliado.estatus || "-"}</div>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg">
            <div className="text-xs text-slate-500">Creado</div>
            <div className="font-medium">{fmtDateTime(afiliado.created_at)}</div>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg">
            <div className="text-xs text-slate-500">Actualizado</div>
            <div className="font-medium">{fmtDateTime(afiliado.updated_at)}</div>
          </div>
        </div>

        {/* === NUEVO: REFERENCIAS + BENEFICIARIOS (SIN MOVER LO DEMÁS) === */}
        <div className="mt-6">
          <div className="h-[3px] bg-blue-600 rounded-full mb-4" />

          <div className="font-bold text-slate-900 mb-3">Referencias Personales</div>

          {extrasError ? (
            <div className="bg-red-100 text-red-700 p-3 rounded-lg border border-red-200 mb-4">
              {extrasError}
            </div>
          ) : loadingExtras ? (
            <p className="text-sm text-slate-600">Cargando referencias...</p>
          ) : refs.length === 0 ? (
            <p className="text-sm text-slate-500">Sin referencias registradas.</p>
          ) : (
            <div className="space-y-3">
              {refs.map((r) => (
                <div
                  key={r.id_ref ?? `${r.id_afiliado}-${r.created_at}-${getFullName(r)}`}
                  className="p-3 bg-slate-50 rounded-lg border border-slate-100"
                >
                  <div className="font-medium text-slate-900">{getFullName(r) || "-"}</div>
                  <div className="text-sm text-slate-700 mt-1">
                    Teléfono: <span className="font-medium">{r.telefono || "-"}</span>
                  </div>
                  <div className="text-sm text-slate-700">
                    Dirección: <span className="font-medium">{r.direccion || "-"}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="h-[3px] bg-blue-600 rounded-full my-5" />

          <div className="font-bold text-slate-900 mb-3">Beneficiarios</div>

          {loadingExtras ? (
            <p className="text-sm text-slate-600">Cargando beneficiarios...</p>
          ) : beneficiarios.length === 0 ? (
            <p className="text-sm text-slate-500">Sin beneficiarios registrados.</p>
          ) : (
            <div className="space-y-3">
              {beneficiarios.map((b) => {
                const foto =
                  b.foto_url || b.foto_public_url || b.foto || null;
                const doc =
                  b.documento_url || b.documento_public_url || b.documento || null;

                return (
                  <div
                    key={b.id_beneficiario ?? `${b.id_afiliado}-${b.created_at}-${getFullName(b)}`}
                    className="p-3 bg-slate-50 rounded-lg border border-slate-100"
                  >
                    <div className="font-medium text-slate-900">{getFullName(b) || "-"}</div>

                    <div className="text-sm text-slate-700 mt-1">
                      Teléfono: <span className="font-medium">{b.telefono || "-"}</span>
                    </div>

                    <div className="text-sm text-slate-700">
                      Dirección: <span className="font-medium">{b.direccion || "-"}</span>
                    </div>

                    {(foto || doc) && (
                      <div className="text-sm text-slate-700 mt-2 flex flex-col gap-1">
                        {foto && (
                          <a
                            href={foto}
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            Ver foto
                          </a>
                        )}
                        {doc && (
                          <a
                            href={doc}
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            Ver documento
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

{/* REFERENCIA BANCARIA */}
<div className="mt-6">
  <div className="h-[3px] bg-blue-600 rounded-full mb-5" />

  <div className="font-bold text-slate-900 mb-3">
    Referencia Bancaria
  </div>

  {loadingExtras ? (
    <p className="text-sm text-slate-600">
      Cargando referencia bancaria...
    </p>
  ) : referenciaBancaria ? (
    <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 space-y-2">
      <div className="text-sm text-slate-700">
        <span className="font-semibold">Banco:</span>{" "}
        {referenciaBancaria.entidad_bancaria === "OTRO"
          ? referenciaBancaria.banco_otro || "-"
          : referenciaBancaria.entidad_bancaria || "-"}
      </div>

      <div className="text-sm text-slate-700">
        <span className="font-semibold">Titular:</span>{" "}
        {referenciaBancaria.titular_cuenta || "-"}
      </div>

      <div className="text-sm text-slate-700">
        <span className="font-semibold">Número de cuenta:</span>{" "}
        {referenciaBancaria.numero_cuenta || "-"}
      </div>

      <div className="text-sm text-slate-700">
        <span className="font-semibold">Cuenta CLABE:</span>{" "}
        {referenciaBancaria.cuenta_clabe || "-"}
      </div>

      <div className="text-sm text-slate-700">
        <span className="font-semibold">País:</span>{" "}
        {referenciaBancaria.pais || "México"}
      </div>
    </div>
  ) : (
    <p className="text-sm text-slate-500">
      Sin referencia bancaria registrada.
    </p>
  )}
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
