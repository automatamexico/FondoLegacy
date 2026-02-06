import React, { useState } from "react";
import { supabase } from "../../supabaseClient";

const ModalRegistrarAfiliado = ({ open, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [foto, setFoto] = useState(null);

  const [form, setForm] = useState({
    nombre: "",
    apellido_paterno: "",
    apellido_materno: "",
    fecha_nacimiento: "",
    correo: "",
    telefono: "",
    direccion: "",
    codigo_postal: "",
    activo: true,
  });

  if (!open) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === "checkbox" ? checked : value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    let foto_url = null;

    if (foto) {
      const fileName = `${Date.now()}-${foto.name}`;
      const { error } = await supabase.storage
        .from("Fotos Afiliados")
        .upload(fileName, foto);

      if (error) {
        alert("Error al subir foto");
        setLoading(false);
        return;
      }

      const { data } = supabase.storage
        .from("Fotos Afiliados")
        .getPublicUrl(fileName);

      foto_url = data.publicUrl;
    }

    const { error } = await supabase.from("afore_afiliados").insert([
      {
        ...form,
        foto_url,
      },
    ]);

    if (error) {
      alert("Error al guardar afiliado");
    } else {
      alert("Afiliado registrado correctamente");
      onClose();
    }

    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-full max-w-3xl p-6">
        <h2 className="text-xl font-bold mb-4">Registrar nuevo afiliado</h2>

        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
          <input name="nombre" placeholder="Nombre" onChange={handleChange} required />
          <input name="apellido_paterno" placeholder="Apellido paterno" onChange={handleChange} required />
          <input name="apellido_materno" placeholder="Apellido materno" onChange={handleChange} />
          <input type="date" name="fecha_nacimiento" onChange={handleChange} />
          <input type="email" name="correo" placeholder="Correo electrónico" onChange={handleChange} />
          <input name="telefono" placeholder="Teléfono" onChange={handleChange} />
          <input name="direccion" placeholder="Dirección" onChange={handleChange} />
          <input name="codigo_postal" placeholder="Código Postal" onChange={handleChange} />

          <div className="col-span-2">
            <label className="flex items-center gap-2">
              <input type="checkbox" name="activo" checked={form.activo} onChange={handleChange} />
              Afiliado activo
            </label>
          </div>

          <div className="col-span-2">
            <input type="file" accept="image/*" onChange={(e) => setFoto(e.target.files[0])} />
          </div>

          <div className="col-span-2 flex justify-end gap-3 mt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded"
            >
              {loading ? "Guardando..." : "Guardar afiliado"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModalRegistrarAfiliado;
