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
        `¿Eliminar al afiliado "${afiliado.nombre} ${afiliado.apellido_paterno}"?`
      );
      if (!ok) return;

      const { error } = await supabase
        .from("afore_afiliados")
        .delete()
        .eq("id_afiliado", afiliado.id_afiliado);

      if (error) throw error;

      await cargarAfiliados();
    } catch (e) {
      setError(e?.message || "No se pudo borrar el afiliado.");
    }
  };

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-full">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Afiliados AFORE</h2>
          <p className="text-slate-600 mt-1">
            Administra los afiliados del módulo AFORE.
          </p>
        </div>

        <button
          onClick={() => {
            setEditAfiliado(null);
            setShowForm(true);
          }}
          className="px-5 py-2 bg-blue-600 text-white rounded-xl shadow-md hover:bg-blue-700 transition-all duration-300 transform hover:scale-[1.02]"
        >
          + Nuevo Afiliado
        </button>
      </div>

      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded-xl border border-red-200">
          {error}
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
        <div className="mb-6">
          <input
            type="text"
            placeholder="Buscar por nombre, correo, teléfono o estatus..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {!loading && filtered.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-200 text-slate-700">
                  <th className="py-3 px-4">Foto</th>
                  <th className="py-3 px-4">ID</th>
                  <th className="py-3 px-4">Nombre Completo</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Teléfono</th>
                  <th className="py-3 px-4">Estatus</th>
                  <th className="py-3 px-4">Acciones</th>
                </tr>
              </thead>

              <tbody>
                {filtered.map((a) => (
                  <tr
                    key={a.id_afiliado}
                    className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer"
                    onClick={() => setFicha(a)}
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

                    <td className="py-4 px-4">{a.id_afiliado}</td>

                    <td className="py-4 px-4 font-medium">
                      {a.nombre} {a.apellido_paterno} {a.apellido_materno}
                    </td>

                    <td className="py-4 px-4">{a.email}</td>

                    <td className="py-4 px-4">{a.telefono || "-"}</td>

                    <td className="py-4 px-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${estatusBadge(a.estatus)}`}>
                        {a.estatus}
                      </span>
                    </td>

                    <td
                      className="py-4 px-4"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex gap-2">
                        <button
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditAfiliado(a);
                            setShowForm(true);
                          }}
                        >
                          ✏️
                        </button>

                        <button
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                          onClick={(e) => {
                            e.stopPropagation();
                            borrarAfiliado(a);
                          }}
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

      {showForm && (
        <ModalRegistrarAfiliado
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

      {ficha && (
        <AforeAfiliadoFichaModal
          afiliado={ficha}
          onClose={() => setFicha(null)}
        />
      )}
    </div>
  );
};

export default AforeAfiliadosModule;
