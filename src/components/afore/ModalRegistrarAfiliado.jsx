console.log("🔥 MODAL REGISTRAR/EDITAR AFILIADO (AFORE) 🔥");

import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../../supabaseClient";

const ModalRegistrarAfiliado = ({
  onClose,
  onSaved,
  bucketName = "Fotos-Afiliados",
  modo = "new", // "new" | "edit"
  afiliado = null,
}) => {
  const isEdit = modo === "edit" && afiliado?.id_afiliado;

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

  // Normaliza fecha desde Supabase a YYYY-MM-DD para input type="date"
  const toDateInput = (v) => {
    if (!v) return "";
    const s = String(v);
    // Si ya viene YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
    // Si viene con hora
    const d = new Date(s);
    if (Number.isNaN(d.getTime())) return "";
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  // Precarga en modo editar
  useEffect(() => {
    if (!isEdit) return;

    setForm({
      nombre: afiliado.nombre || "",
      apellido_paterno: afiliado.apellido_paterno || "",
      apellido_materno: afiliado.apellido_materno || "",
      email: afiliado.email || "",
      contraseña: afiliado.contraseña || "", // si no quieres mostrarla, dime y lo ocultamos
      telefono: afiliado.telefono || "",
      direccion: afiliado.direccion || "",
      cp: afiliado.cp || "",
      fecha_nacimiento: toDateInput(afiliado.fecha_nacimiento),
      miembro_desde: toDateInput(afiliado.miembro_desde),
      estatus: afiliado.estatus || "activo",
    });

    setFoto(null);
    setError("");
  }, [isEdit, afiliado]);

  const requiredFields = useMemo(() => {
    // En tu tabla contraseña es NOT NULL
    // En edición, si el usuario borra el campo, conservamos la existente.
    return [
      "nombre",
      "apellido_paterno",
      "apellido_materno",
      "email",
      "telefono",
      "direccion",
      "cp",
      "fecha_nacimiento",
      "miembro_desde",
      "estatus",
    ];
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const validate = () => {
    const missing = requiredFields.filter((f) => !String(form[f] || "").trim());

    // contraseña:
    // - new: obligatoria
    // - edit: si está vacía, mantenemos la que ya existe en BD (afiliado.contraseña)
    if (!isEdit && !String(form.contraseña || "").trim()) {
      missing.push("contraseña");
    }

    if (missing.length) {
      setError("Faltan campos obligatorios. Revisa los que tienen *.");
      return false;
    }
    return true;
  };

  const subirFotoSiAplica = async () => {
    if (!foto) return null;

    const fileName = `${Date.now()}-${foto.name}`;

    const { error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(fileName, foto, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from(bucketName).getPublicUrl(fileName);
    return data?.publicUrl || null;
  };

  const handleSubmit = async () => {
    setError("");
    if (!validate()) return;

    setLoading(true);

    try {
      const foto_url = await subirFotoSiAplica();

      // En edit: si contraseña está vacía, conserva la anterior
      const contraseñaFinal =
        isEdit && !String(form.contraseña || "").trim()
          ? afiliado.contraseña
          : form.contraseña;

      if (!contraseñaFinal) {
        throw new Error("La contraseña es obligatoria.");
      }

      if (isEdit) {
        // UPDATE
        const payload = {
          nombre: form.nombre,
          apellido_paterno: form.apellido_paterno,
          apellido_materno: form.apellido_materno,
          email: form.email,
          contraseña: contraseñaFinal,
          telefono: form.telefono,
          direccion: form.direccion,
          cp: form.cp,
          fecha_nacimiento: form.fecha_nacimiento,
          miembro_desde: form.miembro_desde,
          estatus: form.estatus,
        };

        // Si subieron nueva foto, actualizamos foto_url; si no, NO tocamos foto_url
        if (foto_url) payload.foto_url = foto_url;

        const { error: updErr } = await supabase
          .from("afore_afiliados")
          .update(payload)
          .eq("id_afiliado", afiliado.id_afiliado);

        if (updErr) throw updErr;

        onSaved?.();
        return;
      }

      // INSERT (NEW)
      const payload = {
        nombre: form.nombre,
        apellido_paterno: form.apellido_paterno,
        apellido_materno: form.apellido_materno,
        email: form.email,
        contraseña: contraseñaFinal,
        telefono: form.telefono,
        direccion: form.direccion,
        cp: form.cp,
        fecha_nacimiento: form.fecha_nacimiento,
        miembro_desde: form.miembro_desde,
        estatus: form.estatus || "activo",
        foto_url: foto_url || null,
      };

      const { error: insErr } = await supabase.from("afore_afiliados").insert([payload]);
      if (insErr) throw insErr;

      onSaved?.();
    } catch (err) {
      setError(err?.message || "Ocurrió un error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl w-full max-w-3xl p-6">
        <h2 className="text-2xl font-bold mb-4">
          {isEdit ? "Editar Afiliado AFORE" : "Registrar Afiliado AFORE"}
        </h2>

        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            name="nombre"
            placeholder="Nombre *"
            value={form.nombre}
            onChange={handleChange}
          />

          <input
            name="apellido_paterno"
            placeholder="Apellido paterno *"
            value={form.apellido_paterno}
            onChange={handleChange}
          />

          <input
            name="apellido_materno"
            placeholder="Apellido materno *"
            value={form.apellido_materno}
            onChange={handleChange}
          />

          <input
            name="email"
            placeholder="Correo electrónico *"
            value={form.email}
            onChange={handleChange}
          />

          <input
            type="password"
            name="contraseña"
            placeholder={isEdit ? "Contraseña (deja vacío para conservar)" : "Contraseña *"}
            value={form.contraseña}
            onChange={handleChange}
            autoComplete="current-password"
          />

          <input
            name="telefono"
            placeholder="Teléfono *"
            value={form.telefono}
            onChange={handleChange}
          />

          <input
            name="direccion"
            placeholder="Dirección *"
            value={form.direccion}
            onChange={handleChange}
          />

          <input
            name="cp"
            placeholder="Código Postal *"
            value={form.cp}
            onChange={handleChange}
          />

          <div>
            <label className="text-sm">Fecha de registro (Miembro desde) *</label>
            <input
              type="date"
              name="miembro_desde"
              value={form.miembro_desde}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="text-sm">Fecha de nacimiento *</label>
            <input
              type="date"
              name="fecha_nacimiento"
              value={form.fecha_nacimiento}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="text-sm">Estatus *</label>
            <select
              name="estatus"
              value={form.estatus}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
            >
              <option value="activo">activo</option>
              <option value="inactivo">inactivo</option>
              <option value="bloqueado">bloqueado</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm mb-1">Foto del afiliado (JPG o PNG)</label>
            <input type="file" accept="image/*" onChange={(e) => setFoto(e.target.files?.[0] || null)} />
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
            {loading ? "Guardando..." : isEdit ? "Guardar cambios" : "Guardar afiliado"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalRegistrarAfiliado;
