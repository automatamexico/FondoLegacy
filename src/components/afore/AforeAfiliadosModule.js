console.log("🔥 AforeAfiliadosModule ACTIVO 🔥");

import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../../supabaseClient";
import ModalRegistrarAfiliado from "./ModalRegistrarAfiliado";
import AforeAfiliadoFichaModal from "./AforeAfiliadoFichaModal";

const BUCKET_NAME = "Fotos-Afiliados";

const AforeAfiliadosModule = () => {
  const [afiliados, setAfiliados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editAfiliado, setEditAfiliado] = useState(null);
  const [ficha, setFicha] = useState(null);

  const cargarAfiliados = async () => {
    setLoading(true);
    setError("");

    const { data, error } = await supabase
      .from("afore_afiliados")
      .select("*")
      .order("id_afiliado", { ascending: false });

    if (error) {
      setError(error.message);
      setAfiliados([]);
    } else {
      setAfiliados(data || []);
    }

    setLoading(false);
  };

  useEffect(() => {
    cargarAfiliados();
  }, []);

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return afiliados;

    return afiliados.filter((a) => {
      const full = `${a.nombre || ""} ${a.apellido_paterno || ""} ${a.apellido_materno || ""}`.toLowerCase();
      return (
        full.includes(q) ||
        (a.email || "").toLowerCase().includes(q) ||
        (a.telefono || "").toLowerCase().includes(q) ||
        (a.estatus || "").toLowerCase().includes(q)
      );
    });
  }, [afiliados, searchTerm]);

  const avatarFallback = (a) => {
    const n1 = (a?.nombre || "A").trim().charAt(0).toUpperCase();
    const n2 = (a?.apellido_paterno || "F").trim().charAt(0).toUpperCase();
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80">
        <rect width="100%" height="100%" rx="16" ry="16" fill="#10b981"/>
        <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle"
              font-family="Arial" font-size="28" fill="#ffffff" font-weight="700">
          ${n1}${n2}
        </text>
      </svg>
    `.trim();
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  };

  const estatusBadge = (estatus) => {
    const e = (estatus || "").toLowerCase();
    if (e === "activo") return "bg-emerald-100 text-emerald-700";
    if (e === "inactivo") return "bg-slate-100 text-slate-700";
    if (e === "bloqueado") return "bg-red-100 text-red-700";
    return "bg-slate-100 text-slate-700";
  };

  const borrarAfiliado = async (afiliado) => {
    try {
      setError("");

      const ok = window.confirm(
        `¿Eliminar al afiliado "${afiliado.nombre} ${afiliado.apellido_paterno}"?\n\nEsto intentará borrarlo de la base de datos.`
      );
      if (!ok) return;

      // 1) Intento: DELETE real
      const { error: delErr } = await supabase
        .from("afore_afiliados")
        .delete()
        .eq("id_afiliado", afiliado.id_afiliado);

      if (!delErr) {
        await cargarAfiliados();
        return;
      }

      // Si RLS bloquea, mostramos el error y hacemos fallback opcional:
      // 2) Fallback: baja lógica (estatus = inactivo)
      // (Si también te lo bloquea, verás el error igualmente.)
      const { error: softErr } = await supabase
        .from("afore_afiliados")
        .update({ estatus: "inactivo" })
        .eq("id_afiliado", afiliado.id_afiliado);

      if (softErr) {
        throw delErr; // muestra el error de delete (más representativo)
      }

      await cargarAfiliados();
    } catch (e) {
      setError(e?.message || "No se pudo borrar el afiliado (revisa RLS).");
    }
  };

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Afiliados AFORE</h2>
          <p className="text-slate-600 mt-1">Administra los afiliados del módulo AFORE.</p>
        </div>

        <button
          onClick={() => {
            setEditAfiliado(null);
            setShowForm(true);
          }}
          className="px-5 py-2 bg-blue-600 text-white rounded-xl shadow-md hover:bg-blue-700 transition-all duration-300 transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          + Nuevo Afiliado
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded-xl border border-red-200">
          {error}
        </div>
      )}

      {/* Card tabla */}
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
        <div className="mb-6">
          <input
            type="text"
            placeholder="Buscar por nombre, correo, teléfono o estatus..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>

        {loading && <p className="text-center text-slate-600">Cargando afiliados...</p>}

        {!loading && !error && filtered.length === 0 && (
          <p className="text-center text-slate-600">No hay afiliados registrados.</p>
        )}

        {!loading && filtered.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-200 text-slate-700">
                  <th className="py-3 px-4 font-semibold">Foto</th>
                  <th className="py-3 px-4 font-semibold">ID</th>
                  <th className="py-3 px-4 font-semibold">Nombre Completo</th>
                  <th className="py-3 px-4 font-semibold">Email</th>
                  <th className="py-3 px-4 font-semibold">Teléfono</th>
                  <th className="py-3 px-4 font-semibold">Estatus</th>
                  <th className="py-3 px-4 font-semibold">Acciones</th>
                </tr>
              </thead>

              <tbody>
                {filtered.map((a) => (
                  <tr
                    key={a.id_afiliado}
                    className="border-b border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer"
                    onClick={() => setFicha(a)}
                    title="Clic para ver ficha"
                  >
                    <td className="py-4 px-4">
                      <img
                        src={a.foto_url || avatarFallback(a)}
                        alt="foto"
                        className="w-10 h-10 rounded-full object-cover border"
                        onError={(e) => {
                          e.currentTarget.src = avatarFallback(a);
                        }}
                      />
                    </td>

                    <td className="py-4 px-4 text-slate-700">{a.id_afiliado}</td>

                    <td className="py-4 px-4 font-medium text-slate-900">
                      {a.nombre} {a.apellido_paterno} {a.apellido_materno}
                    </td>

                    <td className="py-4 px-4 text-slate-700">{a.email}</td>

                    <td className="py-4 px-4 text-slate-700">{a.telefono || "-"}</td>

                    <td className="py-4 px-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${estatusBadge(a.estatus)}`}>
                        {a.estatus || "—"}
                      </span>
                    </td>

                    {/* Acciones */}
                    <td
                      className="py-4 px-4"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center gap-2">
                        <button
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Editar"
                          onClick={() => {
                            setEditAfiliado(a);
                            setShowForm(true);
                          }}
                        >
                          ✏️
                        </button>

                        <button
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Borrar"
                          onClick={() => borrarAfiliado(a)}
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL: Nuevo/Editar Afiliado */}
      {showForm && (
        <ModalRegistrarAfiliado
          bucketName={BUCKET_NAME}
          modo={editAfiliado ? "edit" : "new"}
          afiliado={editAfiliado}
          onClose={() => {
            setShowForm(false);
            setEditAfiliado(null);
          }}
          onSaved={async () => {
            setShowForm(false);
            setEditAfiliado(null);
            await cargarAfiliados();
          }}
        />
      )}

      {/* MODAL: Ficha */}
      {ficha && (
        <AforeAfiliadoFichaModal
          afiliado={ficha}
          onClose={() => setFicha(null)}
          bucketName={BUCKET_NAME}
        />
      )}
    </div>
  );
};

export default AforeAfiliadosModule;
