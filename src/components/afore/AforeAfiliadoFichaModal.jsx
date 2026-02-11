import React, { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";

const BUCKET_BENEFICIARIOS = "Beneficiarios-Afore";

const AforeAfiliadoFichaModal = ({ afiliado, onClose, bucketName }) => {
  if (!afiliado) return null;

  const [refs, setRefs] = useState([]);
  const [beneficiarios, setBeneficiarios] = useState([]);

  const [refForm, setRefForm] = useState(null);
  const [benForm, setBenForm] = useState(null);

  const [fotoBen, setFotoBen] = useState(null);
  const [docBen, setDocBen] = useState(null);

  // ============================
  // CARGAR DATOS
  // ============================

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

  useEffect(() => {
    cargarReferencias();
    cargarBeneficiarios();
  }, [afiliado]);

  // ============================
  // REFERENCIAS
  // ============================

  const guardarReferencia = async () => {
    if (!refForm.nombre) return;

    if (refForm.id_ref) {
      await supabase
        .from("refs_afore")
        .update(refForm)
        .eq("id_ref", refForm.id_ref);
    } else {
      await supabase.from("refs_afore").insert([
        { ...refForm, id_afiliado: afiliado.id_afiliado },
      ]);
    }

    setRefForm(null);
    cargarReferencias();
  };

  const eliminarReferencia = async (r) => {
    if (!window.confirm("¿Eliminar esta referencia?")) return;
    await supabase
      .from("refs_afore")
      .delete()
      .eq("id_ref", r.id_ref);
    cargarReferencias();
  };

  // ============================
  // BENEFICIARIOS
  // ============================

  const guardarBeneficiario = async () => {
    let foto_url = benForm?.foto_url || null;
    let documento_url = benForm?.documento_url || null;

    if (fotoBen) {
      const fileName = `foto-${Date.now()}-${fotoBen.name}`;
      await supabase.storage
        .from(BUCKET_BENEFICIARIOS)
        .upload(fileName, fotoBen);
      const { data } = supabase.storage
        .from(BUCKET_BENEFICIARIOS)
        .getPublicUrl(fileName);
      foto_url = data.publicUrl;
    }

    if (docBen) {
      const fileName = `doc-${Date.now()}-${docBen.name}`;
      await supabase.storage
        .from(BUCKET_BENEFICIARIOS)
        .upload(fileName, docBen);
      const { data } = supabase.storage
        .from(BUCKET_BENEFICIARIOS)
        .getPublicUrl(fileName);
      documento_url = data.publicUrl;
    }

    if (benForm.id_beneficiario) {
      await supabase
        .from("beneficiarios_afore")
        .update({ ...benForm, foto_url, documento_url })
        .eq("id_beneficiario", benForm.id_beneficiario);
    } else {
      await supabase.from("beneficiarios_afore").insert([
        {
          ...benForm,
          foto_url,
          documento_url,
          id_afiliado: afiliado.id_afiliado,
        },
      ]);
    }

    setBenForm(null);
    setFotoBen(null);
    setDocBen(null);
    cargarBeneficiarios();
  };

  const eliminarBeneficiario = async (b) => {
    if (!window.confirm("¿Eliminar beneficiario?")) return;
    await supabase
      .from("beneficiarios_afore")
      .delete()
      .eq("id_beneficiario", b.id_beneficiario);
    cargarBeneficiarios();
  };

  // ============================
  // UI
  // ============================

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-3xl">

        <div className="flex justify-between mb-6">
          <h2 className="text-xl font-bold">Ficha del Afiliado</h2>
          <button onClick={onClose}>Cerrar</button>
        </div>

        {/* ================= REFERENCIAS ================= */}

        <div className="h-1 bg-blue-600 rounded-full mt-6"></div>
        <h3 className="font-bold mt-4 mb-3">Referencias Personales</h3>

        <button
          className="mb-3 px-3 py-1 bg-blue-600 text-white rounded"
          onClick={() =>
            setRefForm({
              nombre: "",
              apellido_paterno: "",
              apellido_materno: "",
              telefono: "",
              direccion: "",
            })
          }
        >
          + Agregar Referencia
        </button>

        {refs.map((r) => (
          <div key={r.id_ref} className="bg-slate-50 p-3 rounded mb-2">
            <div className="font-medium">
              {r.nombre} {r.apellido_paterno}
            </div>
            <div className="text-sm">{r.telefono}</div>
            <div className="flex gap-3 mt-2">
              <button onClick={() => setRefForm(r)}>Editar</button>
              <button onClick={() => eliminarReferencia(r)} className="text-red-600">
                Eliminar
              </button>
            </div>
          </div>
        ))}

        {refForm && (
          <div className="bg-slate-100 p-4 rounded mt-3">
            <input
              placeholder="Nombre"
              value={refForm.nombre}
              onChange={(e) =>
                setRefForm({ ...refForm, nombre: e.target.value })
              }
              className="border p-2 w-full mb-2"
            />
            <button
              onClick={guardarReferencia}
              className="px-3 py-1 bg-green-600 text-white rounded"
            >
              Guardar
            </button>
          </div>
        )}

        {/* ================= BENEFICIARIOS ================= */}

        <div className="h-1 bg-blue-600 rounded-full mt-8"></div>
        <h3 className="font-bold mt-4 mb-3">Beneficiarios</h3>

        <button
          className="mb-3 px-3 py-1 bg-blue-600 text-white rounded"
          onClick={() =>
            setBenForm({
              nombre: "",
              apellido_paterno: "",
              apellido_materno: "",
              telefono: "",
              direccion: "",
            })
          }
        >
          + Agregar Beneficiario
        </button>

        {beneficiarios.map((b) => (
          <div key={b.id_beneficiario} className="bg-slate-50 p-3 rounded mb-2">
            <div className="font-medium">
              {b.nombre} {b.apellido_paterno}
            </div>
            <div className="text-sm">{b.telefono}</div>
            <div className="flex gap-3 mt-2">
              <button onClick={() => setBenForm(b)}>Editar</button>
              <button
                onClick={() => eliminarBeneficiario(b)}
                className="text-red-600"
              >
                Eliminar
              </button>
            </div>
          </div>
        ))}

        {benForm && (
          <div className="bg-slate-100 p-4 rounded mt-3">
            <input
              placeholder="Nombre"
              value={benForm.nombre}
              onChange={(e) =>
                setBenForm({ ...benForm, nombre: e.target.value })
              }
              className="border p-2 w-full mb-2"
            />

            <input
              type="file"
              onChange={(e) => setFotoBen(e.target.files[0])}
              className="mb-2"
            />

            <input
              type="file"
              onChange={(e) => setDocBen(e.target.files[0])}
              className="mb-2"
            />

            <button
              onClick={guardarBeneficiario}
              className="px-3 py-1 bg-green-600 text-white rounded"
            >
              Guardar
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default AforeAfiliadoFichaModal;
