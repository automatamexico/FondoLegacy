import React, { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";

const BUCKET_NAME = "Fotos-Afiliados";

const initialForm = {
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
};

const AforeAfiliadosModule = () => {
  const [afiliados, setAfiliados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [foto, setFoto] = useState(null);

  // ===============================
  // CARGAR AFILIADOS
  // ===============================
  const cargarAfiliados = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("afore_afiliados")
      .select("*")
      .order("id_afiliado", { ascending: false });

    if (error) setError(error.message);
    else setAfiliados(data || []);
    setLoading(false);
  };

  useEffect(() => {
    cargarAfiliados();
  }, []);

  // ===============================
  // FORM
  // ===============================
  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const resetForm = () => {
    setForm(initialForm);
    setFoto(null);
    setEditId(null);
  };

  // ===============================
  // GUARDAR / EDITAR
  // ===============================
  const guardarAfiliado = async () => {
    setError("");

    const required = [
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

    const faltantes = required.filter((f) => !form[f]);
    if (faltantes.length) {
      setError("Completa todos los campos obligatorios");
      return;
    }

    try {
      let foto_url = null;

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
        ...form,
        estatus: "activo",
        ...(foto_url && { foto_url }),
      };

      let query = supabase.from("afore_afiliados");

      if (editId) {
        query = query.update(payload).eq("id_afiliado", editId);
      } else {
        query = query.insert([payload]);
      }

      const { error } = await query;
      if (error) throw error;

      resetForm();
      setShowForm(false);
      cargarAfiliados();
    } catch (err) {
      setError(err.message);
    }
  };

  // ===============================
  // EDITAR
  // ===============================
  const editarAfiliado = (a) => {
    setForm({
      nombre: a.nombre || "",
      apellido_paterno: a.apellido_paterno || "",
      apellido_materno: a.apellido_materno || "",
      email: a.email || "",
      contraseña: a.contraseña || "",
      telefono: a.telefono || "",
      direccion: a.direccion || "",
      cp: a.cp || "",
      fecha_nacimiento: a.fecha_nacimiento || "",
      miembro_desde: a.miembro_desde || "",
    });
    setEditId(a.id_afiliado);
    setShowForm(true);
  };

  // ===============================
  // BORRAR
  // ===============================
  const borrarAfiliado = async (id) => {
    if (!window.confirm("¿Eliminar este afiliado?")) return;

    const { error } = await supabase
      .from("afore_afiliados")
      .delete()
      .eq("id_afiliado", id);

    if (error) {
      alert(error.message);
    } else {
      cargarAfiliados();
    }
  };

  // ===============================
  // UI
  // ===============================
  return (
    <div className="p-6 bg-slate-50 min-h-full">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Afiliados AFORE</h1>
          <p className="text-slate-600 mt-1">
            Administra los afiliados del módulo AFORE.
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="px-5 py-2 bg-blue-600 text-white rounded-xl shadow hover:bg-blue-700"
        >
          + Nuevo Afiliado
        </button>
      </div>

      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="bg-white rounded-2xl shadow border border-slate-200">
        <table className="w-full text-left">
          <thead className="border-b border-slate-200">
            <tr>
              <th className="p-4">Foto</th>
              <th className="p-4">ID</th>
              <th className="p-4">Nombre Completo</th>
              <th className="p-4">Email</th>
              <th className="p-4">Teléfono</th>
              <th className="p-4">Estatus</th>
              <th className="p-4">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {afiliados.map((a) => (
              <tr
                key={a.id_afiliado}
                className="border-b hover:bg-slate-50"
              >
                <td className="p-4">
                  {a.foto_url ? (
                    <img
                      src={a.foto_url}
                      alt=""
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-green-500 text-white rounded-full flex items-center justify-center font-bold">
                      {a.nombre?.[0]}
                      {a.apellido_paterno?.[0]}
                    </div>
                  )}
                </td>
                <td className="p-4">{a.id_afiliado}</td>
                <td className="p-4 font-medium">
                  {a.nombre} {a.apellido_paterno} {a.apellido_materno}
                </td>
                <td className="p-4">{a.email}</td>
                <td className="p-4">{a.telefono}</td>
                <td className="p-4">
                  <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold">
                    {a.estatus}
                  </span>
                </td>
                <td className="p-4 flex gap-2">
                  <button
                    onClick={() => editarAfiliado(a)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                    title="Editar"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => borrarAfiliado(a.id_afiliado)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    title="Borrar"
                  >
                    🗑️
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-full max-w-3xl p-6">
            <h2 className="text-2xl font-bold mb-4">
              {editId ? "Editar Afiliado AFORE" : "Registrar Afiliado AFORE"}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.keys(initialForm).map((key) => (
                <input
                  key={key}
                  type={
                    key.includes("fecha")
                      ? "date"
                      : key === "contraseña"
                      ? "password"
                      : "text"
                  }
                  name={key}
                  value={form[key]}
                  placeholder={key.replace("_", " ")}
                  onChange={handleChange}
                  className="border p-2 rounded"
                />
              ))}

              <div className="md:col-span-2">
                <input
                  type="file"
                  onChange={(e) => setFoto(e.target.files[0])}
                />
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
