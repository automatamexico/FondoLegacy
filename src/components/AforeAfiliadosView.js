import React, { useState } from "react";

const SUPABASE_URL = "https://ubfkhtkmlvutwdivmoff.supabase.co";
const SUPABASE_ANON_KEY =
  "PEGA_AQUI_TU_ANON_PUBLIC_KEY"; // la misma que usas en AforeDashboardMain

const BUCKET_NAME = "Fotos-Afiliados";

const AforeAfiliadoModal = ({ onClose }) => {
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

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    setError("");

    // Campos obligatorios (excepto contraseña)
    const requiredFields = [
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

    const missing = requiredFields.filter((f) => !form[f]);
    if (missing.length > 0) {
      setError("Estos campos son obligatorios");
      return;
    }

    setLoading(true);

    try {
      let foto_url = null;

      // 1️⃣ Subir imagen (si hay)
      if (foto) {
        const fileName = `${Date.now()}-${foto.name}`;

        const upload = await fetch(
          `${SUPABASE_URL}/storage/v1/object/${BUCKET_NAME}/${fileName}`,
          {
            method: "POST",
            headers: {
              apikey: SUPABASE_ANON_KEY,
            },
            body: foto,
          }
        );

        if (!upload.ok) {
          const err = await upload.text();
          throw new Error(`No se pudo subir la imagen (${upload.status}) ${err}`);
        }

        foto_url = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/${fileName}`;
      }

      // 2️⃣ Insertar afiliado
      const insert = await fetch(
        `${SUPABASE_URL}/rest/v1/afore_afiliados`,
        {
          method: "POST",
          headers: {
            apikey: SUPABASE_ANON_KEY,
            "Content-Type": "application/json",
            Prefer: "return=minimal",
          },
          body: JSON.stringify({
            ...form,
            foto_url,
            estatus: "activo",
          }),
        }
      );

      if (!insert.ok) {
        const err = await insert.text();
        throw new Error(err);
      }

      onClose(); // cerrar modal
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl w-full max-w-3xl p-6 relative">
        <h2 className="text-2xl font-bold mb-4">
          Registrar nuevo afiliado
        </h2>

        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input name="nombre" placeholder="Nombre" onChange={handleChange} />
          <input
            name="apellido_paterno"
            placeholder="Apellido paterno"
            onChange={handleChange}
          />
          <input
            name="apellido_materno"
            placeholder="Apellido materno"
            onChange={handleChange}
          />
          <input name="email" placeholder="Correo electrónico" onChange={handleChange} />
          <input
            name="contraseña"
            type="password"
            placeholder="Genera una contraseña"
            onChange={handleChange}
          />

          <div>
            <label className="text-sm text-slate-600">Fecha de nacimiento</label>
            <input type="date" name="fecha_nacimiento" onChange={handleChange} />
          </div>

          <div>
            <label className="text-sm text-slate-600">Fecha de registro</label>
            <input type="date" name="miembro_desde" onChange={handleChange} />
          </div>

          <input name="telefono" placeholder="Teléfono" onChange={handleChange} />
          <input name="direccion" placeholder="Dirección" onChange={handleChange} />
          <input name="cp" placeholder="Código Postal" onChange={handleChange} />

          <div className="md:col-span-2">
            <label className="block text-sm text-slate-600 mb-1">
              Foto del afiliado
            </label>
            <input type="file" onChange={(e) => setFoto(e.target.files[0])} />
            <p className="text-xs text-slate-500 mt-1">
              Bucket usado para fotos: {BUCKET_NAME}
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="px-4 py-2 rounded border">
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 rounded bg-blue-600 text-white"
          >
            {loading ? "Guardando..." : "Guardar afiliado"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AforeAfiliadoModal;
