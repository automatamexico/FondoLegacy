console.log("🔥 MODAL REGISTRAR AFILIADO - VERSION NUEVA 🔥");

import React, { useState } from "react";
import { supabase } from "../../supabaseClient";

const BUCKET_NAME = "Fotos-Afiliados";

const ModalRegistrarAfiliado = ({ onClose }) => {
  const [form, setForm] = useState({
    nombre: "",
    apellido_paterno: "",
    apellido_materno: "",
    email: "",
    contraseña: "",
    fecha_nacimiento: "",
    miembro_desde: "",
    telefono: "",
    direccion: "",
    cp: "",
  });

  const [foto, setFoto] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async () => {
    setError("");

    const required = [
      "nombre",
      "apellido_paterno",
      "apellido_materno",
      "email",
      "fecha_nacimiento",
      "miembro_desde",
      "telefono",
      "direccion",
      "cp",
    ];

    const missing = required.filter((f) => !form[f]);
    if (missing.length) {
      setError("Estos campos son obligatorios");
      return;
    }

    setLoading(true);

    try {
      let foto_url = null;

      // 🔹 SUBIR FOTO CORRECTAMENTE
      if (foto) {
        const fileName = `${Date.now()}-${foto.name}`;

        const { error: uploadError } = await supabase.storage
          .from(BUCKET_NAME)
          .upload(fileName, foto, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) throw uploadError;

        const { data } = supabase.storage
          .from(BUCKET_NAME)
          .getPublicUrl(fileName);

        foto_url = data.publicUrl;
      }

      // 🔹 INSERTAR AFILIADO
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
        <h2 className="text-2xl font-bold mb-4">Registrar nuevo afiliado</h2>

        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input name="nombre" placeholder="Nombre" onChange={handleChange} />
          <input name="apellido_paterno" placeholder="Apellido paterno" onChange={handleChange} />
          <input name="apellido_materno" placeholder="Apellido materno" onChange={handleChange} />
          <input name="email" placeholder="Correo electrónico" onChange={handleChange} />
          <input type="password" name="contraseña" placeholder="Genera una contraseña" onChange={handleChange} />

          <div>
            <label className="text-sm">Fecha de nacimiento</label>
            <input type="date" name="fecha_nacimiento" onChange={handleChange} />
          </div>

          <div>
            <label className="text-sm">Fecha de registro</label>
            <input type="date" name="miembro_desde" onChange={handleChange} />
          </div>

          <input name="telefono" placeholder="Teléfono" onChange={handleChange} />
          <input name="direccion" placeholder="Dirección" onChange={handleChange} />
          <input name="cp" placeholder="Código Postal" onChange={handleChange} />

          <div className="md:col-span-2">
            <label className="block text-sm mb-1">Foto del afiliado</label>
            <input type="file" onChange={(e) => setFoto(e.target.files[0])} />
            <p className="text-xs text-slate-500 mt-1">
              Bucket usado para fotos: {BUCKET_NAME}
            </p>
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
            {loading ? "Guardando..." : "Guardar afiliado"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalRegistrarAfiliado;
