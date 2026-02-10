import React, { useMemo, useState } from "react";
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

  // Todos obligatorios (incluye contraseña y foto)
  const requiredFields = useMemo(
    () => [
      { key: "nombre", label: "Nombre" },
      { key: "apellido_paterno", label: "Apellido paterno" },
      { key: "apellido_materno", label: "Apellido materno" },
      { key: "email", label: "Correo electrónico" },
      { key: "contraseña", label: "Contraseña" },
      { key: "fecha_nacimiento", label: "Fecha de nacimiento" },
      { key: "miembro_desde", label: "Fecha de registro" },
      { key: "telefono", label: "Teléfono" },
      { key: "direccion", label: "Dirección" },
      { key: "cp", label: "Código Postal" },
      { key: "__foto__", label: "Foto del afiliado" },
    ],
    []
  );

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const validate = () => {
    const missing = [];

    for (const f of requiredFields) {
      if (f.key === "__foto__") {
        if (!foto) missing.push(f.label);
        continue;
      }

      const value = form[f.key];
      if (typeof value === "string") {
        if (!value.trim()) missing.push(f.label);
      } else if (!value) {
        missing.push(f.label);
      }
    }

    // Validación simple de email
    const email = (form.email || "").trim();
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (email && !emailOk) {
      return "El correo electrónico no parece válido.";
    }

    if (missing.length) {
      return `Faltan campos obligatorios: ${missing.join(", ")}.`;
    }

    return "";
  };

  const handleSubmit = async () => {
    setError("");

    const validationMessage = validate();
    if (validationMessage) {
      setError(validationMessage);
      return;
    }

    setLoading(true);

    try {
      let foto_url = null;

      // 1) Subir foto a Storage
      const fileName = `${Date.now()}-${foto.name}`;

      const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(fileName, foto, {
          cacheControl: "3600",
          upsert: false,
          contentType: foto.type || "image/*",
        });

      if (uploadError) throw uploadError;

      const { data: publicData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(fileName);

      foto_url = publicData?.publicUrl || null;

      // 2) Insertar afiliado
      const payload = {
        ...form,
        email: form.email.trim().toLowerCase(),
        foto_url,
        estatus: "activo",
      };

      const { error: insertError } = await supabase
        .from("afore_afiliados")
        .insert([payload]);

      if (insertError) throw insertError;

      onClose?.();
    } catch (err) {
      // err puede venir como objeto de supabase, o string
      const msg =
        (err && (err.message || err.error_description || err.error)) ||
        "Ocurrió un error al guardar.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl w-full max-w-3xl p-6">
        <h2 className="text-2xl font-bold mb-4">Registrar Afiliado AFORE</h2>

        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            name="nombre"
            placeholder="Nombre"
            value={form.nombre}
            onChange={handleChange}
            className="border rounded px-3 py-2"
          />

          <input
            name="apellido_paterno"
            placeholder="Apellido paterno"
            value={form.apellido_paterno}
            onChange={handleChange}
            className="border rounded px-3 py-2"
          />

          <input
            name="apellido_materno"
            placeholder="Apellido materno"
            value={form.apellido_materno}
            onChange={handleChange}
            className="border rounded px-3 py-2"
          />

          <input
            name="email"
            placeholder="Correo electrónico"
            value={form.email}
            onChange={handleChange}
            className="border rounded px-3 py-2"
          />

          <input
            type="password"
            name="contraseña"
            placeholder="Contraseña"
            value={form.contraseña}
            onChange={handleChange}
            className="border rounded px-3 py-2"
          />

          <div className="border rounded px-3 py-2">
            <label className="text-sm font-semibold text-slate-700 block">
              Fecha de registro
            </label>
            <p className="text-xs text-slate-500 mb-1">
              Fecha en que el afiliado se da de alta en AFORE
            </p>
            <input
              type="date"
              name="miembro_desde"
              value={form.miembro_desde}
              onChange={handleChange}
              className="w-full"
            />
          </div>

          <div className="border rounded px-3 py-2">
            <label className="text-sm font-semibold text-slate-700 block">
              Fecha de nacimiento
            </label>
            <p className="text-xs text-slate-500 mb-1">
              Fecha real de nacimiento del afiliado
            </p>
            <input
              type="date"
              name="fecha_nacimiento"
              value={form.fecha_nacimiento}
              onChange={handleChange}
              className="w-full"
            />
          </div>

          <input
            name="telefono"
            placeholder="Teléfono"
            value={form.telefono}
            onChange={handleChange}
            className="border rounded px-3 py-2"
          />

          <input
            name="direccion"
            placeholder="Dirección"
            value={form.direccion}
            onChange={handleChange}
            className="border rounded px-3 py-2"
          />

          <input
            name="cp"
            placeholder="Código Postal"
            value={form.cp}
            onChange={handleChange}
            className="border rounded px-3 py-2"
          />

          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Foto del afiliado (obligatoria)
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFoto(e.target.files?.[0] || null)}
              className="block"
            />
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
            {loading ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalRegistrarAfiliado;
