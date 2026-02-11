import React, { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";

const BUCKET_NAME = "Fotos-Afiliados";
const BENEFICIARIOS_BUCKET = "Beneficiarios-Afore";

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
    referido: false,
    nombre_referido: "",
  });

  // 🔹 REFERENCIAS
  const [referencia, setReferencia] = useState({
    nombre: "",
    apellido_paterno: "",
    apellido_materno: "",
    telefono: "",
    direccion: "",
  });

  // 🔹 BENEFICIARIO
  const [beneficiario, setBeneficiario] = useState({
    nombre: "",
    apellido_paterno: "",
    apellido_materno: "",
    telefono: "",
    direccion: "",
  });

  const [beneficiarioFoto, setBeneficiarioFoto] = useState(null);
  const [beneficiarioDoc, setBeneficiarioDoc] = useState(null);

  const [foto, setFoto] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (modo === "edit" && afiliado) {
      setForm({
        ...form,
        ...afiliado,
        referido: afiliado.es_referido || false,
        nombre_referido: afiliado.nombre_referido || "",
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

    if (form.referido && !form.nombre_referido) {
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
          .upload(fileName, foto);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage
          .from(BUCKET_NAME)
          .getPublicUrl(fileName);

        foto_url = data.publicUrl;
      }

      const payload = {
        ...form,
        foto_url,
        es_referido: form.referido,
        nombre_referido: form.referido
          ? form.nombre_referido
          : "Nuevo",
      };

      let afiliadoId;

      if (modo === "new") {
        const { data, error } = await supabase
          .from("afore_afiliados")
          .insert([payload])
          .select();

        if (error) throw error;
        afiliadoId = data[0].id_afiliado;
      } else {
        const { error } = await supabase
          .from("afore_afiliados")
          .update({
            ...payload,
            updated_at: new Date().toISOString(),
          })
          .eq("id_afiliado", afiliado.id_afiliado);

        if (error) throw error;
        afiliadoId = afiliado.id_afiliado;
      }

      // 🔹 GUARDAR REFERENCIA (SI LLENÓ ALGO)
      if (referencia.nombre) {
        await supabase.from("Refs_Afore").insert([
          {
            id_afiliado: afiliadoId,
            ...referencia,
          },
        ]);
      }

      // 🔹 SUBIR ARCHIVOS BENEFICIARIO
      let fotoBenefUrl = null;
      let docBenefUrl = null;

      if (beneficiarioFoto) {
        const fileName = `${Date.now()}-${beneficiarioFoto.name}`;
        await supabase.storage
          .from(BENEFICIARIOS_BUCKET)
          .upload(fileName, beneficiarioFoto);

        const { data } = supabase.storage
          .from(BENEFICIARIOS_BUCKET)
          .getPublicUrl(fileName);

        fotoBenefUrl = data.publicUrl;
      }

      if (beneficiarioDoc) {
        const fileName = `${Date.now()}-${beneficiarioDoc.name}`;
        await supabase.storage
          .from(BENEFICIARIOS_BUCKET)
          .upload(fileName, beneficiarioDoc);

        const { data } = supabase.storage
          .from(BENEFICIARIOS_BUCKET)
          .getPublicUrl(fileName);

        docBenefUrl = data.publicUrl;
      }

      // 🔹 GUARDAR BENEFICIARIO
      if (beneficiario.nombre) {
        await supabase.from("Beneficiarios_Afore").insert([
          {
            id_afiliado: afiliadoId,
            ...beneficiario,
            foto_url: fotoBenefUrl,
            documento_url: docBenefUrl,
          },
        ]);
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

        <h2 className="text-2xl font-bold mb-2">
          {modo === "edit"
            ? "Editar Afiliado AFORE"
            : "Registrar Nuevo Afiliado AFORE"}
        </h2>

        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* ----------- CAMPOS ACTUALES (NO TOCADOS) ----------- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input name="nombre" placeholder="Nombre *" value={form.nombre} onChange={handleChange} />
          <input name="apellido_paterno" placeholder="Apellido paterno *" value={form.apellido_paterno} onChange={handleChange} />
          <input name="apellido_materno" placeholder="Apellido materno *" value={form.apellido_materno} onChange={handleChange} />
          <input name="email" placeholder="Correo electrónico *" value={form.email} onChange={handleChange} />
          <input type="password" name="contraseña" placeholder="Contraseña *" value={form.contraseña} onChange={handleChange} />
          <input name="telefono" placeholder="Teléfono *" value={form.telefono} onChange={handleChange} />
          <input name="direccion" placeholder="Dirección *" value={form.direccion} onChange={handleChange} />
          <input name="cp" placeholder="Código Postal *" value={form.cp} onChange={handleChange} />
        </div>

        {/* ---------------- REFERIDO ---------------- */}
        <div className="mt-6 border-t pt-4">
          <div className="font-semibold mb-2">Referido</div>
          <label>
            <input type="radio" checked={form.referido} onChange={() => setForm({ ...form, referido: true })} /> Sí
          </label>
          <label className="ml-4">
            <input type="radio" checked={!form.referido} onChange={() => setForm({ ...form, referido: false, nombre_referido: "" })} /> No
          </label>

          {form.referido && (
            <input
              className="mt-2 w-full"
              placeholder="Ingresa el Nombre completo de quien refiere"
              value={form.nombre_referido}
              onChange={(e) =>
                setForm({ ...form, nombre_referido: e.target.value })
              }
            />
          )}
        </div>

        {/* ----------- REFERENCIAS PERSONALES ----------- */}
        <div className="mt-6 border-t pt-6">
          <div className="font-bold mb-4">Referencias Personales</div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input placeholder="Nombre" onChange={(e)=>setReferencia({...referencia,nombre:e.target.value})}/>
            <input placeholder="Apellido Paterno" onChange={(e)=>setReferencia({...referencia,apellido_paterno:e.target.value})}/>
            <input placeholder="Apellido Materno" onChange={(e)=>setReferencia({...referencia,apellido_materno:e.target.value})}/>
            <input placeholder="Teléfono" onChange={(e)=>setReferencia({...referencia,telefono:e.target.value})}/>
            <input placeholder="Dirección" className="md:col-span-2" onChange={(e)=>setReferencia({...referencia,direccion:e.target.value})}/>
          </div>
        </div>

        {/* ----------- BENEFICIARIO ----------- */}
        <div className="mt-6 border-t pt-6 border-blue-600">
          <div className="font-bold mb-4 text-blue-600">Beneficiario</div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input placeholder="Nombre" onChange={(e)=>setBeneficiario({...beneficiario,nombre:e.target.value})}/>
            <input placeholder="Apellido Paterno" onChange={(e)=>setBeneficiario({...beneficiario,apellido_paterno:e.target.value})}/>
            <input placeholder="Apellido Materno" onChange={(e)=>setBeneficiario({...beneficiario,apellido_materno:e.target.value})}/>
            <input placeholder="Teléfono" onChange={(e)=>setBeneficiario({...beneficiario,telefono:e.target.value})}/>
            <input placeholder="Dirección" className="md:col-span-2" onChange={(e)=>setBeneficiario({...beneficiario,direccion:e.target.value})}/>

            <input type="file" onChange={(e)=>setBeneficiarioFoto(e.target.files[0])}/>
            <input type="file" onChange={(e)=>setBeneficiarioDoc(e.target.files[0])}/>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-8">
          <button onClick={onClose} className="px-5 py-2 border rounded-xl">
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-xl"
          >
            {loading ? "Guardando..." : "Guardar"}
          </button>
        </div>

      </div>
    </div>
  );
};

export default ModalRegistrarAfiliado;
