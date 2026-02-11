import React, { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";
import ModalRegistrarAfiliado from "./ModalRegistrarAfiliado";

const AforeAfiliadosModule = () => {
  const [afiliados, setAfiliados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);

  const cargarAfiliados = async () => {
    setLoading(true);
    setError("");

    const { data, error } = await supabase
      .from("afore_afiliados")
      .select("*")
      .order("id_afiliado", { ascending: false });

    if (error) {
      setError(error.message);
    } else {
      setAfiliados(data || []);
    }

    setLoading(false);
  };

  useEffect(() => {
    cargarAfiliados();
  }, []);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Afiliados AFORE</h1>

        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700"
        >
          + Nuevo Afiliado
        </button>
      </div>

      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded-xl mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-slate-500">Cargando afiliados...</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full text-sm">
            <thead className="bg-slate-100">
              <tr>
                <th className="p-3 text-left">Nombre</th>
                <th className="p-3 text-left">Correo</th>
                <th className="p-3 text-left">Teléfono</th>
                <th className="p-3 text-left">Estatus</th>
              </tr>
            </thead>
            <tbody>
              {afiliados.map((a) => (
                <tr key={a.id_afiliado} className="border-t hover:bg-slate-50">
                  <td className="p-3">
                    {a.nombre} {a.apellido_paterno} {a.apellido_materno}
                  </td>
                  <td className="p-3">{a.email}</td>
                  <td className="p-3">{a.telefono || "-"}</td>
                  <td className="p-3 capitalize">{a.estatus}</td>
                </tr>
              ))}

              {afiliados.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-slate-500">
                    No hay afiliados registrados
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL REAL */}
      {showModal && (
        <ModalRegistrarAfiliado
          onClose={() => setShowModal(false)}
          onSaved={cargarAfiliados}
        />
      )}
    </div>
  );
};

export default AforeAfiliadosModule;
