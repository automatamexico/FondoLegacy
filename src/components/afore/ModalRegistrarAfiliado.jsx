import React, { useMemo, useRef, useState } from "react";
import { supabase } from "../../supabaseClient";

const BUCKET_NAME = "Fotos-Afiliados";

const fieldLabels = {
  nombre: "Nombre",
  apellido_paterno: "Apellido paterno",
  apellido_materno: "Apellido materno",
  email: "Correo electrónico",
  contraseña: "Contraseña",
  telefono: "Teléfono",
  direccion: "Dirección",
  cp: "Código Postal",
  miembro_desde: "Fecha de registro",
  fecha_nacimiento: "Fecha de nacimiento",
  foto: "Foto del afiliado",
};

const inputBase =
  "w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder-slate-400 " +
  "focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-300";

const ModalRegistrarAfiliado = ({ onClose, onSaved }) => {
  const [form, setForm] = useState({
    nombre: "",
    apellido_paterno: "",
    apellido_materno: "",
    email: "",
    contraseña: "",
    telefono: "",
    direccion: "",
    cp: "",
    miembro_desde: "",
    fecha_nacimiento: "",
  });

  const [fotoFile, setFotoFile] = useState(null);
  const [fotoPreview, setFotoPreview] = useState("");
  const [error, setError] = useState("");
  const [missingFields, setMissingFields] = useState([]);
  const [loading, setLoading] = useState(false);
  const dropRef = useRef(null);

  const initials = useMemo(() => {
    const n = (form.nombre || "").trim();
    const a = (form.apellido_paterno || "").trim();
    const i1 = n ? n[0].toUpperCase() : "A";
    const i2 = a ? a[0].toUpperCase() : "F";
    return `${i1}${i2}`;
  }, [form.nombre, form.apellido_paterno]);

  const validatePhoto = (file) => {
    if (!file) return "Selecciona una imagen.";
    const okTypes = ["image/jpeg", "image/png"];
    if (!okTypes.includes(file.type)) return "Solo JPG o PNG.";
    const maxMB = 5;
    if (file.size > maxMB * 1024 * 1024) return `Máximo ${maxMB} MB.`;
    return "";
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePickPhoto = (file) => {
    const msg = validatePhoto(file);
    if (msg) {
      setFotoFile(null);
      setFotoPreview("");
      setError(msg);
      return;
    }
    setError("");
    setFotoFile(file);
    setFotoPreview(URL.createObjectURL(file));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    dropRef.current?.classList.remove("ring-2", "ring-blue-500");
    const f = e.dataTransfer.files?.[0];
    if (f) handlePickPhoto(f);
  };

  const handleSubmit = async () => {
    setError("");
    setMissingFields([]);

    // ✅ TODOS obligatorios (incluye foto)
    const required = [
      "nombre",
      "apellido_paterno",
      "apellido_materno",
      "email",
      "contraseña",
      "telefono",
      "direccion",
      "cp",
      "miembro_desde",
      "fecha_nacimiento",
    ];

    const missing = required.filter((k) => !String(form[k] || "").trim());
    if (!fotoFile) missing.push("foto");

    if (missing.length) {
      setMissingFields(missing);
      setError("Faltan campos obligatorios. Revisa lo marcado.");
      return;
    }

    setLoading(true);

    try {
      // 1) Subir foto a Storage
      const ext = fotoFile.type === "image/png" ? "png" : "jpg";
      const fileNameSafe =
        `${Date.now()}_${(form.nombre || "afiliado").trim()}`.replace(/\s+/g, "_");
      const path = `afiliado_${fileNameSafe}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(path, fotoFile, {
          cacheControl: "3600",
          upsert: true,
          contentType: fotoFile.type,
        });

      if (uploadError) throw uploadError;

      const { data: pub } = supabase.storage.from(BUCKET_NAME).getPublicUrl(path);
      const foto_url = pub?.publicUrl || null;

      // 2) Insertar afiliado
      const { error: insertError } = await supabase.from("afore_afiliados").insert([
        {
          ...form,
          foto_url,
          estatus: "activo",
        },
      ]);

      if (insertError) throw insertError;

      // refrescar tabla si tu módulo lo soporta
      if (typeof onSaved === "function") onSaved();

      onClose();
    } catch (err) {
      setError(err?.message || "Error al guardar.");
    } finally {
      setLoading(false);
    }
  };

  const showMissing = (k) => missingFields.includes(k);

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-5xl p-6 md:p-8 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              Registrar Afiliado AFORE
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Todos los campos son obligatorios.
            </p>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50"
          >
            Cancelar
          </button>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 border border-red-200 p-3 rounded-xl mt-4">
            <div className="font-semibold">{error}</div>

            {missingFields.length > 0 && (
              <ul className="mt-2 list-disc pl-5 text-sm">
                {missingFields.map((k) => (
                  <li key={k}>{fieldLabels[k] || k}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            className={`${inputBase} ${showMissing("nombre") ? "border-red-300" : ""}`}
            name="nombre"
            placeholder="Nombre *"
            value={form.nombre}
            onChange={handleChange}
          />
          <input
            className={`${inputBase} ${showMissing("apellido_paterno") ? "border-red-300" : ""}`}
            name="apellido_paterno"
            placeholder="Apellido paterno *"
            value={form.apellido_paterno}
            onChange={handleChange}
          />

          <input
            className={`${inputBase} ${showMissing("apellido_materno") ? "border-red-300" : ""}`}
            name="apellido_materno"
            placeholder="Apellido materno *"
            value={form.apellido_materno}
            onChange={handleChange}
          />
          <input
            className={`${inputBase} ${showMissing("email") ? "border-red-300" : ""}`}
            name="email"
            placeholder="Correo electrónico *"
            value={form.email}
            onChange={handleChange}
          />

          <input
            className={`${inputBase} ${showMissing("contraseña") ? "border-red-300" : ""}`}
            type="password"
            name="contraseña"
            placeholder="Contraseña *"
            value={form.contraseña}
            onChange={handleChange}
          />
          <input
            className={`${inputBase} ${showMissing("telefono") ? "border-red-300" : ""}`}
            name="telefono"
            placeholder="Teléfono *"
            value={form.telefono}
            onChange={handleChange}
          />

          <input
            className={`${inputBase} ${showMissing("direccion") ? "border-red-300" : ""}`}
            name="direccion"
            placeholder="Dirección *"
            value={form.direccion}
            onChange={handleChange}
          />
          <input
            className={`${inputBase} ${showMissing("cp") ? "border-red-300" : ""}`}
            name="cp"
            placeholder="Código Postal *"
            value={form.cp}
            onChange={handleChange}
          />

          <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700">
                Fecha de registro *
              </label>
              <input
                className={`${inputBase} mt-2 ${showMissing("miembro_desde") ? "border-red-300" : ""}`}
                type="date"
                name="miembro_desde"
                value={form.miembro_desde}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">
                Fecha de nacimiento *
              </label>
              <input
                className={`${inputBase} mt-2 ${showMissing("fecha_nacimiento") ? "border-red-300" : ""}`}
                type="date"
                name="fecha_nacimiento"
                value={form.fecha_nacimiento}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* FOTO (estilo tipo Socios) */}
          <div className="md:col-span-2 mt-2">
            <label className="text-sm font-medium text-slate-700">
              Foto del afiliado (JPG o PNG) *
            </label>

            <div
              ref={dropRef}
              onDragOver={(e) => {
                e.preventDefault();
                dropRef.current?.classList.add("ring-2", "ring-blue-500");
              }}
              onDragLeave={() => dropRef.current?.classList.remove("ring-2", "ring-blue-500")}
              onDrop={handleDrop}
              className={`mt-2 rounded-2xl border-2 border-dashed p-5 flex items-center gap-4 ${
                showMissing("foto") ? "border-red-300" : "border-slate-200"
              }`}
            >
              <div className="w-16 h-16 rounded-full bg-blue-600 text-white flex items-center justify-center text-xl font-bold overflow-hidden">
                {fotoPreview ? (
                  <img
                    src={fotoPreview}
                    alt="preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  initials
                )}
              </div>

              <div className="flex-1">
                <div className="font-semibold text-slate-800">
                  Arrastra y suelta la foto aquí
                </div>
                <div className="text-sm text-slate-500">o</div>
                <div className="mt-2">
                  <label className="inline-flex items-center px-4 py-2 rounded-xl bg-slate-900 text-white cursor-pointer hover:bg-slate-800">
                    Elegir archivo
                    <input
                      type="file"
                      accept="image/png,image/jpeg"
                      className="hidden"
                      onChange={(e) => handlePickPhoto(e.target.files?.[0])}
                    />
                  </label>
                  <span className="ml-3 text-sm text-slate-600">
                    {fotoFile ? fotoFile.name : "No se ha seleccionado ningún archivo"}
                  </span>
                </div>

                <div className="text-xs text-slate-400 mt-2">
                  Bucket: {BUCKET_NAME}
                </div>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="mt-6 w-full py-3 rounded-2xl bg-blue-600 text-white font-bold hover:bg-blue-700 disabled:opacity-60"
        >
          {loading ? "Guardando..." : "Guardar Afiliado"}
        </button>
      </div>
    </div>
  );
};

export default ModalRegistrarAfiliado;
