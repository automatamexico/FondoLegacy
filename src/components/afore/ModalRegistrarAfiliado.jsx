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

  // 🔥 PRECARGAR DATOS SI ES EDICIÓN
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

    setLoading(true);

    try {
      let foto_url = afiliado?.foto_url || null;

      // SUBIR FOTO NUEVA SI SE CAMBIÓ
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

      // 🔥 NUEVO REGISTRO
      if (modo === "new") {
        const { error: insertError } = await supabase
          .from("afore_afiliados")
          .insert([
            {
              ...form,
              foto_url,
              estatus: "activo",
            },
          ]);

        if (insertError) throw insertError;
      }

      // 🔥 EDICIÓN REAL
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

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl w-full max-w-3xl p-6">
        <h2 className="text-2xl font-bold mb-4">
          {modo === "edit"
            ? "Editar Afiliado AFORE"
            : "Registrar Nuevo Afiliado AFORE"}
        </h2>

        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input name="nombre" value={form.nombre} placeholder="Nombre" onChange={handleChange} />
          <input name="apellido_paterno" value={form.apellido_paterno} placeholder="Apellido paterno" onChange={handleChange} />
          <input name="apellido_materno" value={form.apellido_materno} placeholder="Apellido materno" onChange={handleChange} />
          <input name="email" value={form.email} placeholder="Correo" onChange={handleChange} />
          <input type="password" name="contraseña" value={form.contraseña} placeholder="Contraseña" onChange={handleChange} />
          <input name="telefono" value={form.telefono} placeholder="Teléfono" onChange={handleChange} />
          <input name="direccion" value={form.direccion} placeholder="Dirección" onChange={handleChange} />
          <input name="cp" value={form.cp} placeholder="Código Postal" onChange={handleChange} />

          <div>
            <label className="text-sm">Fecha de nacimiento</label>
            <input type="date" name="fecha_nacimiento" value={form.fecha_nacimiento} onChange={handleChange} />
          </div>

          <div>
            <label className="text-sm">Fecha de registro</label>
            <input type="date" name="miembro_desde" value={form.miembro_desde} onChange={handleChange} />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm mb-1">Foto del afiliado</label>
            <input type="file" onChange={(e) => setFoto(e.target.files[0])} />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="px-4 py-2 border rounded">
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            {loading ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalRegistrarAfiliado;
