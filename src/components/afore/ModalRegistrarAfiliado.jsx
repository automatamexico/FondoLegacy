import React, { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";

const BUCKET_AFILIADOS = "Fotos-Afiliados";
const BUCKET_BENEFICIARIOS = "Beneficiarios-Afore";

const ModalRegistrarAfiliado = ({
  onClose,
  onSaved,
  afiliado,
  modo = "new",
}) => {
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
    setForm({ ...form, [e.target.name]: e.target.value });

  const inputStyle =
    "w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500";

  const labelStyle = "text-sm font-medium text-slate-700 mb-1";

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

    if (!window.confirm("¿Estas seguro de guardar los cambios realizados?"))
      return;

    setLoading(true);

    try {
      let foto_url = afiliado?.foto_url || null;

      if (foto) {
        const fileName = `${Date.now()}-${foto.name}`;
        const { error: uploadError } = await supabase.storage
          .from(BUCKET_AFILIADOS)
          .upload(fileName, foto);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage
          .from(BUCKET_AFILIADOS)
          .getPublicUrl(fileName);

        foto_url = data.publicUrl;
      }

      const payload = {
        ...form,
        foto_url,
        nombre_referido: form.es_referido
          ? form.nombre_referido
          : "Nuevo",
      };

      let afiliadoId = afiliado?.id_afiliado;

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

      // ===== REFERENCIA =====
      if (referencia.nombre) {
        const { error: refError } = await supabase
          .from("refs_afore")
          .insert([{ ...referencia, id_afiliado: afiliadoId }]);

        if (refError) throw refError;
      }

      // ===== BENEFICIARIO =====
      if (beneficiario.nombre) {
        let fotoBeneficiarioUrl = null;
        let docUrl = null;

        if (beneficiarioFoto) {
          const fileName = `${Date.now()}-${beneficiarioFoto.name}`;
          const { error: uploadError } = await supabase.storage
            .from(BUCKET_BENEFICIARIOS)
            .upload(fileName, beneficiarioFoto);

          if (uploadError) throw uploadError;

          const { data } = supabase.storage
            .from(BUCKET_BENEFICIARIOS)
            .getPublicUrl(fileName);

          fotoBeneficiarioUrl = data.publicUrl;
        }

        if (beneficiarioDoc) {
          const fileName = `${Date.now()}-${beneficiarioDoc.name}`;
          const { error: uploadError } = await supabase.storage
            .from(BUCKET_BENEFICIARIOS)
            .upload(fileName, beneficiarioDoc);

          if (uploadError) throw uploadError;

          const { data } = supabase.storage
            .from(BUCKET_BENEFICIARIOS)
            .getPublicUrl(fileName);

          docUrl = data.publicUrl;
        }

        const { error: benError } = await supabase
          .from("beneficiarios_afore")
          .insert([
            {
              ...beneficiario,
              id_afiliado: afiliadoId,
              foto_url: fotoBeneficiarioUrl,
              documento_url: docUrl,
            },
          ]);

        if (benError) throw benError;
      }

      if (onSaved) await onSaved();
      onClose();
    } catch (err) {
      console.error("ERROR REAL:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-6 z-50">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-5xl max-h-[90vh] overflow-y-auto">

        {/* TODO tu JSX intacto aquí abajo */}

      </div>
    </div>
  );
};

export default ModalRegistrarAfiliado;
