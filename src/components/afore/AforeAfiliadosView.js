import React, { useState } from "react";

const SUPABASE_URL = "https://ubfkhtkmlvutwdivmoff.supabase.co";
const SUPABASE_ANON_KEY =
  "TU_ANON_KEY_AQUI"; // usa la misma que ya usas en AFORE

const BUCKET_ID = "Fotos-Afiliados";

const AforeAfiliadosView = () => {
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
    foto: null,
  });

  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const onChange = (e) => {
    const { name, value, files } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
    }));
  };

  const subirFoto = async (file) => {
    const cleanName = file.name
      .replace(/\s+/g, "-")
      .replace(/[^a-zA-Z0-9.-]/g, "");

    const filePath = `${Date.now()}-${cleanName}`;

    const uploadUrl = `${SUPABASE_URL}/storage/v1/object/${BUCKET_ID}/${filePath}`;

    const res = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        "Content-Type": file.type,
        "x-upsert": "true",
      },
      body: file,
    });

    if (!res.ok) {
      const t = await res.text();
      throw new Error(t || "Error al subir imagen");
    }

    return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_ID}/${filePath}`;
  };

  const guardarAfiliado = async () => {
    setError("");

    if (
      !form.nombre ||
      !form.apellido_paterno ||
      !form.apellido_materno ||
      !form.email ||
      !form.fecha_nacimiento ||
      !form.miembro_desde
    ) {
      setError("Estos campos son obligatorios.");
      return;
    }

    try {
      setSaving(true);

      let foto_url = null;
      if (form.foto) {
        foto_url = await subirFoto(form.foto);
      }

      const payload = {
        nombre: form.nombre,
        apellido_paterno: form.apellido_paterno,
        apellido_materno: form.apellido_materno,
        email: form.email,
        contraseña: form.contraseña || "",
        telefono: form.telefono,
        direccion: form.direccion,
        cp: form.cp,
        fecha_nacimiento: form.fecha_nacimiento,
        miembro_desde: form.miembro_desde,
        estatus: "activo",
        foto_url,
      };

      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/afore_afiliados`,
        {
          method: "POST",
          headers: {
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
            "Content-Type": "application/json",
            Prefer: "return=minimal",
          },
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) {
        const t = await res.text();
        throw new Error(t);
      }

      alert("Afiliado registrado correctamente");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">
        Registrar nuevo afiliado
      </h2>

      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <input name="nombre" placeholder="Nombre" onChange={onChange} />
        <input
          name="apellido_paterno"
          placeholder="Apellido paterno"
          onChange={onChange}
        />
        <input
          name="apellido_materno"
          placeholder="Apellido materno"
          onChange={onChange}
        />
        <input name="email" placeholder="Correo electrónico" onChange={onChange} />
        <input
          name="contraseña"
          placeholder="Genera una contraseña"
          type="password"
          onChange={onChange}
        />

        <div>
          <label className="text-sm">Fecha de nacimiento</label>
          <input type="date" name="fecha_nacimiento" onChange={onChange} />
        </div>

        <div>
          <label className="text-sm">Fecha de registro</label>
          <input type="date" name="miembro_desde" onChange={onChange} />
        </div>

        <input name="telefono" placeholder="Teléfono" onChange={onChange} />
        <input name="direccion" placeholder="Dirección" onChange={onChange} />
        <input name="cp" placeholder="Código Postal" onChange={onChange} />

        <div>
          <label className="text-sm">Foto del afiliado</label>
          <input type="file" name="foto" accept="image/*" onChange={onChange} />
        </div>
      </div>

      <p className="text-xs text-gray-500 mt-2">
        Bucket usado para fotos: <b>{BUCKET_ID}</b>
      </p>

      <div className="mt-6 text-right">
        <button
          onClick={guardarAfiliado}
          disabled={saving}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          {saving ? "Guardando..." : "Guardar afiliado"}
        </button>
      </div>
    </div>
  );
};

export default AforeAfiliadosView;
