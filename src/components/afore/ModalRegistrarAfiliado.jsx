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
    es_referido: false,
    nombre_referido: "",
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
        es_referido: afiliado.es_referido || false,
        nombre_referido:
          afiliado.nombre_referido && afiliado.nombre_referido !== "Nuevo"
            ? afiliado.nombre_referido
            : "",
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
      !form.contraseña ||
      !form.telefono ||
      !form.direccion ||
      !form.cp
    ) {
      setError("Todos los campos obligatorios deben completarse.");
      return;
    }

    if (form.es_referido && !form.nombre_referido) {
      setError("Debes ingresar el nombre completo de quien refiere.");
      return;
    }

    const confirmar = window.confirm(
      "¿Estas seguro de guardar los cambios realizados?"
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

      const payload = {
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
        estatus: form.estatus,
        es_referido: form.es_referido,
        nombre_referido: form.es_referido
          ? form.nombre_referido
          : "Nuevo",
        foto_url,
      };

      if (modo === "new") {
        const { error } = await supabase
          .from("afore_afiliados")
          .insert([payload]);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("afore_afiliados")
          .update({
            ...payload,
            updated_at: new Date().toISOString(),
          })
          .eq("id_afiliado", afiliado.id_afiliado);

        if (error) throw error;
      }

      await onSaved();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-6 z-50">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-4xl">
        <h2 className="text-2xl font-bold text-slate-900 mb-1">
          {modo === "edit"
            ? "Editar Afiliado AFORE"
            : "Registrar Nuevo Afiliado AFORE"}
        </h2>

        <p className="text-slate-500 mb-6">
          Todos los campos son obligatorios.
        </p>

        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input className="input" name="nombre" placeholder="Nombre *" value={form.nombre} onChange={handleChange} />
          <input className="input" name="apellido_paterno" placeholder="Apellido paterno *" value={form.apellido_paterno} onChange={handleChange} />
          <input className="input" name="apellido_materno" placeholder="Apellido materno *" value={form.apellido_materno} onChange={handleChange} />
          <input className="input" name="email" placeholder="Correo electrónico *" value={form.email} onChange={handleChange} />
          <input className="input" type="password" name="contraseña" placeholder="Contraseña *" value={form.contraseña} onChange={handleChange} />
          <input className="input" name="telefono" placeholder="Teléfono *" value={form.telefono} onChange={handleChange} />
          <input className="input" name="direccion" placeholder="Dirección *" value={form.direccion} onChange={handleChange} />
          <input className="input" name="cp" placeholder="Código Postal *" value={form.cp} onChange={handleChange} />
          <input className="input" type="date" name="fecha_nacimiento" value={form.fecha_nacimiento} onChange={handleChange} />
          <input className="input" type="date" name="miembro_desde" value={form.miembro_desde} onChange={handleChange} />
        </div>

        {/* REFERIDO */}
        <div className="mt-6 border-t pt-4">
          <div className="font-semibold mb-2">Referido</div>

          <div className="flex gap-6 mb-3">
            <label>
              <input
                type="radio"
                checked={form.es_referido === true}
                onChange={() =>
                  setForm({ ...form, es_referido: true })
                }
              />{" "}
              Sí
            </label>
            <label>
              <input
                type="radio"
                checked={form.es_referido === false}
                onChange={() =>
                  setForm({
                    ...form,
                    es_referido: false,
                    nombre_referido: "",
                  })
                }
              />{" "}
              No
            </label>
          </div>

          {form.es_referido && (
            <input
              className="input w-full"
              placeholder="Ingresa el Nombre completo de quien refiere"
              name="nombre_referido"
              value={form.nombre_referido}
              onChange={handleChange}
            />
          )}
        </div>

        <div className="flex justify-end gap-3 mt-8">
          <button onClick={onClose} className="px-5 py-2 border rounded-xl">
            Cancelar
          </button>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-xl shadow-md hover:bg-blue-700"
          >
            {loading ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalRegistrarAfiliado;
