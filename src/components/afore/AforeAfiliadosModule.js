import React, { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";

const BUCKET_NAME = "Fotos-Afiliados";

const AforeAfiliadosModule = () => {
  const [afiliados, setAfiliados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);

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

  // ===============================
  // CARGAR AFILIADOS
  // ===============================
  const cargarAfiliados = async () => {
    setLoading(true);
    setError("");

    const { data, error } = await supabase
      .from("afore_afiliados")
      .select("*")
      .order("id_afiliado", { ascending: false });

    if (error) {
      setError(error.message);
    } else {
      setAfiliados(data || []);
    }

    setLoading(false);
  };

  useEffect(() => {
    cargarAfiliados();
  }, []);

  // ===============================
  // MANEJO FORM
  // ===============================
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const resetForm = () => {
    setForm({
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
    setFoto(null);
  };

  // ===============================
  // GUARDAR AFILIADO
  // ===============================
  const guardarAfiliado = async () => {
    setError("");

    if (
      !form.nombre ||
      !form.apellido_paterno ||
      !form.apellido_materno ||
      !form.email ||
      !form.contraseña
    ) {
      setError("Completa los campos obligatorios");
      return;
    }

    let foto_url = null;

    try {
      // SUBIR FOTO
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

      // INSERTAR AFILIADO
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

      resetForm();
      setShowForm(false);
      cargarAfiliados();
    } catch (err) {
      setError(err.message);
    }
  };

  // ===============================
  // UI
  // ===============================
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Afiliados AFORE</h1>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg"
        >
          + Nuevo Afiliado
        </button>
      </div>

      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <p>Cargando afiliados...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border text-sm">
            <thead className="bg-slate-100">
              <tr>
                <th className="p-2 border">Nombre</th>
                <th className="p-2 border">Correo</th>
                <th className="p-2 border">Teléfono</th>
                <th className="p-2 border">Estatus</th>
              </tr>
            </thead>
            <tbody>
              {afiliados.map((a) => (
                <tr key={a.id_afiliado} className="hover:bg-slate-50">
                  <td className="p-2 border">
                    {a.nombre} {a.apellido_paterno} {a.apellido_materno}
                  </td>
                  <td className="p-2 border">{a.email}</td>
                  <td className="p-2 border">{a.telefono || "-"}</td>
                  <td className="p-2 border">{a.estatus}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-3xl rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4">
              Registrar Afiliado AFORE
            </h2>

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
              <input name="email" placeholder="Correo" onChange={handleChange} />
              <input
                type="password"
                name="contraseña"
                placeholder="Contraseña"
                onChange={handleChange}
              />
              <input
                name="telefono"
                placeholder="Teléfono"
                onChange={handleChange}
              />
              <input
                name="direccion"
                placeholder="Dirección"
                onChange={handleChange}
              />
              <input name="cp" placeholder="CP" onChange={handleChange} />
              <input
                type="date"
                name="fecha_nacimiento"
                onChange={handleChange}
              />
              <input
                type="date"
                name="miembro_desde"
                onChange={handleChange}
              />

              <div className="md:col-span-2">
                <input type="file" onChange={(e) => setFoto(e.target.files[0])} />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  resetForm();
                  setShowForm(false);
                }}
                className="px-4 py-2 border rounded"
              >
                Cancelar
              </button>
              <button
                onClick={guardarAfiliado}
                className="px-4 py-2 bg-blue-600 text-white rounded"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AforeAfiliadosModule;
