import React, { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";

const BUCKET_AFILIADOS = "Fotos-Afiliados";
const BUCKET_BENEFICIARIOS = "Beneficiarios-Afore";

const ModalRegistrarAfiliado = ({ onClose, onSaved, afiliado, modo = "new" }) => {
  const [form, setForm] = useState({
    nombre: "",
    apellido_paterno: "",
    apellido_materno: "",
    email: "",
    contraseña: "",
    telefono: "",
    direccion: "",
    cp: "",
    fecha_nacimiento: "",
    miembro_desde: "",
    estatus: "activo",
    es_referido: false,
    nombre_referido: "",
  });

  const [foto, setFoto] = useState(null);

  const [referencia, setReferencia] = useState({
    nombre: "",
    apellido_paterno: "",
    apellido_materno: "",
    telefono: "",
    direccion: "",
  });

  const [beneficiario, setBeneficiario] = useState({
    nombre: "",
    apellido_paterno: "",
    apellido_materno: "",
    telefono: "",
    direccion: "",
  });

  const [beneficiarioFoto, setBeneficiarioFoto] = useState(null);
  const [beneficiarioDoc, setBeneficiarioDoc] = useState(null);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (modo === "edit" && afiliado) {
      setForm({
        nombre: afiliado.nombre || "",
        apellido_paterno: afiliado.apellido_paterno || "",
        apellido_materno: afiliado.apellido_materno || "",
        email: afiliado.email || "",
        contraseña: afiliado.contraseña || "",
        telefono: afiliado.telefono || "",
        direccion: afiliado.direccion || "",
        cp: afiliado.cp || "",
        fecha_nacimiento: afiliado.fecha_nacimiento || "",
        miembro_desde: afiliado.miembro_desde || "",
        estatus: afiliado.estatus || "activo",
        es_referido: afiliado.es_referido ?? false,
        nombre_referido: afiliado.nombre_referido || "",
      });
    }
  }, [modo, afiliado]);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const inputBase =
    "w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all";

  const labelBase = "text-sm font-medium text-slate-700 mb-1";

  const handleSubmit = async () => {
    setError("");

    if (
      !form.nombre ||
      !form.apellido_paterno ||
      !form.apellido_materno ||
      !form.email ||
      !form.contraseña ||
      !form.telefono ||
      !form.direccion ||
      !form.cp ||
      !form.fecha_nacimiento ||
      !form.miembro_desde
    ) {
      setError("Todos los campos obligatorios deben completarse.");
      return;
    }

    if (form.es_referido && !form.nombre_referido) {
      setError("Debes ingresar el nombre completo de quien refiere.");
      return;
    }

    const confirmar = window.confirm("¿Estas seguro de guardar los cambios realizados?");
    if (!confirmar) return;

    setLoading(true);

    try {
      let foto_url = afiliado?.foto_url || null;

      if (foto) {
        const fileName = `${Date.now()}-${foto.name}`;
        const { error: uploadError } = await supabase.storage
          .from(BUCKET_AFILIADOS)
          .upload(fileName, foto, { upsert: false });

        if (uploadError) throw uploadError;

        const { data } = supabase.storage
          .from(BUCKET_AFILIADOS)
          .getPublicUrl(fileName);

        foto_url = data.publicUrl;
      }

      const payload = {
        nombre: form.nombre,
        apellido_paterno: form.apellido_paterno,
        apellido_materno: form.apellido_materno,
        email: form.email,
        contraseña: form.contraseña,
        telefono: form.telefono,
        direccion: form.direccion,
        cp: form.cp,
        fecha_nacimiento: form.fecha_nacimiento,
        miembro_desde: form.miembro_desde,
        estatus: form.estatus,
        foto_url,
        es_referido: !!form.es_referido,
        nombre_referido: form.es_referido ? form.nombre_referido : "Nuevo",
      };

      let afiliadoId = afiliado?.id_afiliado || null;

      if (modo === "new") {
        const { data, error } = await supabase
          .from("afore_afiliados")
          .insert([payload])
          .select("id_afiliado")
          .single();

        if (error) throw error;
        afiliadoId = data.id_afiliado;
      } else {
        const { error } = await supabase
          .from("afore_afiliados")
          .update({ ...payload, updated_at: new Date().toISOString() })
          .eq("id_afiliado", afiliadoId);

        if (error) throw error;
      }

      if (onSaved) await onSaved();
      onClose();
    } catch (err) {
      setError(err?.message || "Error al guardar.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-6 z-50">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-4xl">
        <h2 className="text-2xl font-bold text-slate-900 mb-1">
          {modo === "edit"
            ? "Editar Afiliado AFORE"
            : "Registrar Nuevo Afiliado AFORE"}
        </h2>
        <p className="text-slate-500 mb-6">
          Todos los campos son obligatorios.
        </p>

        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {/* CONTINÚA TU FORMULARIO EXACTAMENTE IGUAL */}
        {/* NO CAMBIÉ NADA MÁS */}

      </div>
    </div>
  );
};

export default ModalRegistrarAfiliado;
