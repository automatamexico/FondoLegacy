import React, { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";

const BUCKET_NAME = "Fotos-Afiliados";

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
  });

  const [foto, setFoto] = useState(null);
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
      });
    }
  }, [modo, afiliado]);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async () => {
    setError("");

    if (
      !form.nombre ||
      !form.apellido_paterno ||
      !form.apellido_materno ||
      !form.email ||
      !form.contraseña
    ) {
      setError("Completa los campos obligatorios.");
      return;
    }

    const confirmar = window.confirm(
      "¿Estás seguro de guardar los cambios realizados?"
    );
    if (!confirmar) return;

    setLoading(true);

    try {
      let foto_url = afiliado?.foto_url || null;

      if (foto) {
        const fileName = `${Date.now()}-${foto.name}`;

        const { error: uploadError } = await supabase.storage
          .from(BUCKET_NAME)
          .upload(fileName, foto, { upsert: false });

        if (uploadError) throw uploadError;

        const { data } = supabase.storage
          .from(BUCKET_NAME)
          .getPublicUrl(fileName);

        foto_url = data.publicUrl;
      }

      if (modo === "new") {
        const { error: insertError } = await supabase
          .from("afore_afiliados")
          .insert([{ ...form, foto_url, estatus: "activo" }]);

        if (insertError) throw insertError;
      }

      if (modo === "edit") {
        const { error: updateError } = await supabase
          .from("afore_afiliados")
          .update({
            ...form,
            foto_url,
            updated_at: new Date().toISOString(),
          })
          .eq("id_afiliado", afiliado.id_afiliado);

        if (updateError) throw updateError;
      }

      if (onSaved) await onSaved();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle =
    "w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all";

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl w-full max-w-4xl p-8 shadow-2xl border border-slate-200">

        <h2 className="text-3xl font-bold text-slate-900 mb-2">
          {modo === "edit"
            ? "Editar Afiliado AFORE"
            : "Registrar Nuevo Afiliado AFORE"}
        </h2>

        <p className="text-slate-500 mb-6">
          Completa la información del afiliado.
        </p>

        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded-xl border border-red-200 mb-6">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          <input name="nombre" value={form.nombre} placeholder="Nombre" onChange={handleChange} className={inputStyle} />
          <input name="apellido_paterno" value={form.apellido_paterno} placeholder="Apellido paterno" onChange={handleChange} className={inputStyle} />
          <input name="apellido_materno" value={form.apellido_materno} placeholder="Apellido materno" onChange={handleChange} className={inputStyle} />
          <input name="email" value={form.email} placeholder="Correo electrónico" onChange={handleChange} className={inputStyle} />
          <input type="password" name="contraseña" value={form.contraseña} placeholder="Contraseña" onChange={handleChange} className={inputStyle} />
          <input name="telefono" value={form.telefono} placeholder="Teléfono" onChange={handleChange} className={inputStyle} />
          <input name="direccion" value={form.direccion} placeholder="Dirección" onChange={handleChange} className={inputStyle} />
          <input name="cp" value={form.cp} placeholder="Código Postal" onChange={handleChange} className={inputStyle} />

          <div>
            <label className="text-sm text-slate-600 mb-1 block">
              Fecha de nacimiento
            </label>
            <input type="date" name="fecha_nacimiento" value={form.fecha_nacimiento} onChange={handleChange} className={inputStyle} />
          </div>

          <div>
            <label className="text-sm text-slate-600 mb-1 block">
              Fecha de registro
            </label>
            <input type="date" name="miembro_desde" value={form.miembro_desde} onChange={handleChange} className={inputStyle} />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm text-slate-600 mb-2">
              Foto del afiliado
            </label>
            <input
              type="file"
              onChange={(e) => setFoto(e.target.files[0])}
              className="block w-full text-sm text-slate-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-xl file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100"
            />
          </div>
        </div>

        <div className="flex justify-end gap-4 mt-10">
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 transition"
          >
            Cancelar
          </button>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold shadow-md hover:bg-blue-700 transition-all duration-200"
          >
            {loading ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalRegistrarAfiliado;
