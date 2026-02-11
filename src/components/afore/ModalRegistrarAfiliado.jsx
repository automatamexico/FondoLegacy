import React, { useMemo, useState } from "react";
import { supabase } from "../../supabaseClient";

const ModalRegistrarAfiliado = ({ onClose, onSaved, bucketName }) => {
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
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const fields = useMemo(
    () => [
      { key: "nombre", label: "Nombre" },
      { key: "apellido_paterno", label: "Apellido Paterno" },
      { key: "apellido_materno", label: "Apellido Materno" },
      { key: "email", label: "Correo electrónico" },
      { key: "contraseña", label: "Contraseña" },
      { key: "telefono", label: "Teléfono" },
      { key: "direccion", label: "Dirección" },
      { key: "cp", label: "Código Postal" },
      { key: "fecha_nacimiento", label: "Fecha de nacimiento" },
      { key: "miembro_desde", label: "Fecha de registro (miembro desde)" },
      { key: "estatus", label: "Estatus" },
      { key: "foto", label: "Foto del afiliado" },
    ],
    []
  );

  const handleChange = (e) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  const sanitizeFileName = (name) => {
    return (name || "foto")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\w.\-]+/g, "_");
  };

  const uploadFoto = async (file) => {
    const safe = sanitizeFileName(file.name);
    const path = `afiliados/${Date.now()}-${safe}`;

    const { error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(path, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type || "image/jpeg",
      });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from(bucketName).getPublicUrl(path);
    return data?.publicUrl || null;
  };

  const validate = () => {
    const missing = [];

    // Todos obligatorios (incluida foto)
    const requiredKeys = [
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
      "estatus",
    ];

    requiredKeys.forEach((k) => {
      if (!String(form[k] ?? "").trim()) missing.push(k);
    });

    if (!foto) missing.push("foto");

    if (missing.length) {
      const msg = missing
        .map((k) => fields.find((f) => f.key === k)?.label || k)
        .join(", ");
      return `Te faltan campos obligatorios: ${msg}`;
    }

    // Mini sanity
    if (!form.email.includes("@")) return "El correo electrónico no parece válido.";
    if (String(form.contraseña).trim().length < 4) return "La contraseña debe tener al menos 4 caracteres.";

    return "";
  };

  const handleSubmit = async () => {
    setError("");
    const v = validate();
    if (v) {
      setError(v);
      return;
    }

    setSaving(true);

    try {
      let foto_url = null;

      if (foto) {
        foto_url = await uploadFoto(foto);
      }

      const payload = {
        nombre: form.nombre.trim(),
        apellido_paterno: form.apellido_paterno.trim(),
        apellido_materno: form.apellido_materno.trim(),
        email: form.email.trim(),
        contraseña: form.contraseña,
        telefono: form.telefono.trim(),
        direccion: form.direccion.trim(),
        cp: form.cp.trim(),
        fecha_nacimiento: form.fecha_nacimiento,
        miembro_desde: form.miembro_desde,
        estatus: form.estatus,
        foto_url,
      };

      const { error: insertError } = await supabase.from("afore_afiliados").insert([payload]);

      if (insertError) throw insertError;

      onSaved?.();
    } catch (err) {
      setError(err?.message || "Error desconocido al guardar.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-5xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-2xl font-bold text-slate-900">Registrar Afiliado AFORE</h3>
            <p className="text-slate-600 text-sm mt-1">Todos los campos son obligatorios, incluida la foto.</p>
          </div>

          <button onClick={onClose} className="text-slate-500 hover:text-slate-900">
            Cerrar
          </button>
        </div>

        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded-xl border border-red-200 mb-4">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            name="nombre"
            placeholder="Nombre *"
            value={form.nombre}
            onChange={handleChange}
          />

          <input
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            name="apellido_paterno"
            placeholder="Apellido Paterno *"
            value={form.apellido_paterno}
            onChange={handleChange}
          />

          <input
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            name="apellido_materno"
            placeholder="Apellido Materno *"
            value={form.apellido_materno}
            onChange={handleChange}
          />

          <input
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            name="email"
            placeholder="Correo electrónico *"
            value={form.email}
            onChange={handleChange}
          />

          <input
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            type="password"
            name="contraseña"
            placeholder="Contraseña *"
            value={form.contraseña}
            onChange={handleChange}
          />

          <input
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            name="telefono"
            placeholder="Teléfono *"
            value={form.telefono}
            onChange={handleChange}
          />

          <input
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            name="direccion"
            placeholder="Dirección *"
            value={form.direccion}
            onChange={handleChange}
          />

          <input
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            name="cp"
            placeholder="Código Postal *"
            value={form.cp}
            onChange={handleChange}
          />

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Fecha de nacimiento *</label>
            <input
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              type="date"
              name="fecha_nacimiento"
              value={form.fecha_nacimiento}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Fecha de registro (Miembro desde) *</label>
            <input
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              type="date"
              name="miembro_desde"
              value={form.miembro_desde}
              onChange={handleChange}
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-2">Estatus *</label>
            <select
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              name="estatus"
              value={form.estatus}
              onChange={handleChange}
            >
              <option value="activo">activo</option>
              <option value="inactivo">inactivo</option>
              <option value="bloqueado">bloqueado</option>
            </select>
          </div>

          {/* Foto look&feel tipo Socios */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-2">Foto del afiliado (JPG o PNG) *</label>

            <div className="w-full border-2 border-dashed border-slate-300 rounded-2xl p-4 bg-slate-50">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                  AF
                </div>

                <div className="flex-1">
                  <div className="text-slate-700 font-medium">Arrastra y suelta la foto aquí</div>
                  <div className="text-slate-500 text-sm">o</div>

                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setFoto(e.target.files?.[0] || null)}
                    className="mt-2 block"
                  />

                  <div className="text-xs text-slate-500 mt-2">
                    Bucket: <span className="font-medium">{bucketName}</span>
                    {foto?.name ? (
                      <>
                        {" · "}Archivo: <span className="font-medium">{foto.name}</span>
                      </>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-5 py-2 border border-slate-200 rounded-xl hover:bg-slate-50"
          >
            Cancelar
          </button>

          <button
            onClick={handleSubmit}
            disabled={saving}
            className="px-5 py-2 bg-blue-600 text-white rounded-xl shadow-md hover:bg-blue-700 disabled:opacity-60"
          >
            {saving ? "Guardando..." : "Guardar Afiliado"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalRegistrarAfiliado;
