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
    telefono: "",
    direccion: "",
    cp: "",
    fecha_nacimiento: "",
    miembro_desde: "",
  });

  const [foto, setFoto] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    setError("");

    // 🔴 TODOS LOS CAMPOS OBLIGATORIOS
    const requiredFields = [
      "nombre",
      "apellido_paterno",
      "apellido_materno",
      "email",
      "contraseña",
      "telefono",
      "direccion",
      "cp",
      "fecha_nacimiento",
      "miembro_desde",
    ];

    const missing = requiredFields.filter((f) => !form[f]);
    if (missing.length > 0) {
      setError("Todos los campos son obligatorios. Verifica la información.");
      return;
    }

    setLoading(true);

    try {
      let foto_url = null;

      // 📸 SUBIR FOTO
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

      // 🧠 INSERT AFILIADO AFORE
      const { error: insertError } = await supabase
        .from("afore_afiliados")
        .insert([
          {
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
      <div className="bg-white rounded-2xl w-full max-w-4xl p-6">
        <h2 className="text-2xl font-bold mb-6">Registrar Afiliado AFORE</h2>

        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input name="nombre" placeholder="Nombre *" onChange={handleChange} />
          <input name="apellido_paterno" placeholder="Apellido Paterno *" onChange={handleChange} />
          <input name="apellido_materno" placeholder="Apellido Materno *" onChange={handleChange} />
          <input name="email" placeholder="Correo electrónico *" onChange={handleChange} />
          <input type="password" name="contraseña" placeholder="Contraseña *" onChange={handleChange} />
          <input name="telefono" placeholder="Teléfono *" onChange={handleChange} />
          <input name="direccion" placeholder="Dirección *" onChange={handleChange} />
          <input name="cp" placeholder="Código Postal *" onChange={handleChange} />

          {/* FECHAS CLARAS */}
          <div>
            <label className="text-sm font-medium">Fecha de Nacimiento *</label>
            <input type="date" name="fecha_nacimiento" onChange={handleChange} />
          </div>

          <div>
            <label className="text-sm font-medium">Fecha de Registro en AFORE *</label>
            <input type="date" name="miembro_desde" onChange={handleChange} />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">
              Foto del Afiliado (JPG o PNG)
            </label>
            <input type="file" onChange={(e) => setFoto(e.target.files[0])} />
            <p className="text-xs text-slate-500 mt-1">
              Bucket: {BUCKET_NAME}
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
            {loading ? "Guardando..." : "Guardar Afiliado"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalRegistrarAfiliado;
