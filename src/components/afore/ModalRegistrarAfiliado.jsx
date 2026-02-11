import React, { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";

const BUCKET_AFILIADOS = "Fotos-Afiliados";
const BUCKET_BENEFICIARIOS = "Beneficiarios-Afore";

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

  const [referencia, setReferencia] = useState({
    nombre: "",
    apellido_paterno: "",
    apellido_materno: "",
    telefono: "",
    direccion: "",
  });

  const [beneficiario, setBeneficiario] = useState({
    nombre: "",
    apellido_paterno: "",
    apellido_materno: "",
    telefono: "",
    direccion: "",
  });

  const [beneficiarioFoto, setBeneficiarioFoto] = useState(null);
  const [beneficiarioDoc, setBeneficiarioDoc] = useState(null);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
        es_referido: afiliado.es_referido ?? false,
        nombre_referido: afiliado.nombre_referido || "",
      });
    }
  }, [modo, afiliado]);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const inputStyle =
    "w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500";

  const labelStyle = "text-sm font-medium text-slate-700 mb-1";

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
      !form.cp ||
      !form.fecha_nacimiento ||
      !form.miembro_desde
    ) {
      setError("Todos los campos obligatorios deben completarse.");
      return;
    }

    if (form.es_referido && !form.nombre_referido) {
      setError("Debes ingresar el nombre completo de quien refiere.");
      return;
    }

    if (!window.confirm("¿Estas seguro de guardar los cambios realizados?"))
      return;

    setLoading(true);

    try {
      let foto_url = afiliado?.foto_url || null;

      if (foto) {
        const fileName = `${Date.now()}-${foto.name}`;
        const { error } = await supabase.storage
          .from(BUCKET_AFILIADOS)
          .upload(fileName, foto);

        if (error) throw error;

        const { data } = supabase.storage
          .from(BUCKET_AFILIADOS)
          .getPublicUrl(fileName);

        foto_url = data.publicUrl;
      }

      const payload = {
        ...form,
        foto_url,
        nombre_referido: form.es_referido
          ? form.nombre_referido
          : "Nuevo",
      };

      let afiliadoId = afiliado?.id_afiliado;

      if (modo === "new") {
        const { data, error } = await supabase
          .from("afore_afiliados")
          .insert([payload])
          .select("id_afiliado")
          .single();

        if (error) throw error;
        afiliadoId = data.id_afiliado;
      } else {
        const { error } = await supabase
          .from("afore_afiliados")
          .update({ ...payload, updated_at: new Date().toISOString() })
          .eq("id_afiliado", afiliadoId);

        if (error) throw error;
      }

      if (referencia.nombre) {
        await supabase.from("Refs_Afore").insert([
          { ...referencia, id_afiliado: afiliadoId },
        ]);
      }

      if (beneficiario.nombre) {
        let foto_url = null;
        let doc_url = null;

        if (beneficiarioFoto) {
          const fileName = `${Date.now()}-${beneficiarioFoto.name}`;
          await supabase.storage
            .from(BUCKET_BENEFICIARIOS)
            .upload(fileName, beneficiarioFoto);
          const { data } = supabase.storage
            .from(BUCKET_BENEFICIARIOS)
            .getPublicUrl(fileName);
          foto_url = data.publicUrl;
        }

        if (beneficiarioDoc) {
          const fileName = `${Date.now()}-${beneficiarioDoc.name}`;
          await supabase.storage
            .from(BUCKET_BENEFICIARIOS)
            .upload(fileName, beneficiarioDoc);
          const { data } = supabase.storage
            .from(BUCKET_BENEFICIARIOS)
            .getPublicUrl(fileName);
          doc_url = data.publicUrl;
        }

        await supabase.from("Beneficiarios_Afore").insert([
          {
            ...beneficiario,
            id_afiliado: afiliadoId,
            foto_url,
            documento_url: doc_url,
          },
        ]);
      }

      if (onSaved) await onSaved();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-6 z-50">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-5xl">
        <h2 className="text-2xl font-bold mb-1">
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

        {/* DATOS PRINCIPALES */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          <input className={inputStyle} name="nombre" placeholder="Nombre *" value={form.nombre} onChange={handleChange} />
          <input className={inputStyle} name="apellido_paterno" placeholder="Apellido paterno *" value={form.apellido_paterno} onChange={handleChange} />
          <input className={inputStyle} name="apellido_materno" placeholder="Apellido materno *" value={form.apellido_materno} onChange={handleChange} />
          <input className={inputStyle} name="email" placeholder="Correo electrónico *" value={form.email} onChange={handleChange} />
          <input className={inputStyle} type="password" name="contraseña" placeholder="Contraseña *" value={form.contraseña} onChange={handleChange} />
          <input className={inputStyle} name="telefono" placeholder="Teléfono *" value={form.telefono} onChange={handleChange} />
          <input className={inputStyle} name="direccion" placeholder="Dirección *" value={form.direccion} onChange={handleChange} />
          <input className={inputStyle} name="cp" placeholder="Código Postal *" value={form.cp} onChange={handleChange} />

          <div>
            <label className={labelStyle}>Fecha de nacimiento *</label>
            <input className={inputStyle} type="date" name="fecha_nacimiento" value={form.fecha_nacimiento} onChange={handleChange} />
          </div>

          <div>
            <label className={labelStyle}>Fecha de registro *</label>
            <input className={inputStyle} type="date" name="miembro_desde" value={form.miembro_desde} onChange={handleChange} />
          </div>

        </div>

        {/* FOTO */}
        <div className="mt-4">
          <label className={labelStyle}>Foto del afiliado *</label>
          <input type="file" onChange={(e) => setFoto(e.target.files[0])} />
        </div>

        {/* REFERIDO */}
        <div className="mt-6 border-t pt-4">
          <div className="font-semibold mb-2">Referido</div>
          <div className="flex gap-6">
            <label>
              <input type="radio" checked={form.es_referido} onChange={() => setForm({ ...form, es_referido: true })}/> Sí
            </label>
            <label>
              <input type="radio" checked={!form.es_referido} onChange={() => setForm({ ...form, es_referido: false, nombre_referido: "" })}/> No
            </label>
          </div>
          {form.es_referido && (
            <input className={inputStyle + " mt-3"} name="nombre_referido" placeholder="Nombre completo de quien refiere" value={form.nombre_referido} onChange={handleChange} />
          )}
        </div>

        {/* REFERENCIAS */}
        <div className="mt-6 border-t-4 border-blue-600 pt-4">
          <div className="font-bold mb-3">Referencias Personales</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input className={inputStyle} placeholder="Nombre" onChange={(e)=>setReferencia({...referencia,nombre:e.target.value})}/>
            <input className={inputStyle} placeholder="Apellido Paterno" onChange={(e)=>setReferencia({...referencia,apellido_paterno:e.target.value})}/>
            <input className={inputStyle} placeholder="Apellido Materno" onChange={(e)=>setReferencia({...referencia,apellido_materno:e.target.value})}/>
            <input className={inputStyle} placeholder="Teléfono" onChange={(e)=>setReferencia({...referencia,telefono:e.target.value})}/>
            <input className={inputStyle + " md:col-span-2"} placeholder="Dirección" onChange={(e)=>setReferencia({...referencia,direccion:e.target.value})}/>
          </div>
        </div>

        {/* BENEFICIARIO */}
        <div className="mt-6 border-t-4 border-blue-600 pt-4">
          <div className="font-bold mb-3">Beneficiario</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input className={inputStyle} placeholder="Nombre" onChange={(e)=>setBeneficiario({...beneficiario,nombre:e.target.value})}/>
            <input className={inputStyle} placeholder="Apellido Paterno" onChange={(e)=>setBeneficiario({...beneficiario,apellido_paterno:e.target.value})}/>
            <input className={inputStyle} placeholder="Apellido Materno" onChange={(e)=>setBeneficiario({...beneficiario,apellido_materno:e.target.value})}/>
            <input className={inputStyle} placeholder="Teléfono" onChange={(e)=>setBeneficiario({...beneficiario,telefono:e.target.value})}/>
            <input className={inputStyle + " md:col-span-2"} placeholder="Dirección" onChange={(e)=>setBeneficiario({...beneficiario,direccion:e.target.value})}/>
          </div>

          <div className="mt-3">
            <label className={labelStyle}>Foto beneficiario</label>
            <input type="file" onChange={(e)=>setBeneficiarioFoto(e.target.files[0])}/>
          </div>

          <div className="mt-3">
            <label className={labelStyle}>Documento beneficiario</label>
            <input type="file" onChange={(e)=>setBeneficiarioDoc(e.target.files[0])}/>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-8">
          <button onClick={onClose} className="px-5 py-2 border rounded-xl">Cancelar</button>
          <button onClick={handleSubmit} disabled={loading} className="px-6 py-2 bg-blue-600 text-white rounded-xl">
            {loading ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalRegistrarAfiliado;
