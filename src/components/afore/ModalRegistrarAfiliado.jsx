import React, { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";

const BUCKET_AFILIADOS = "Fotos-Afiliados";
const BUCKET_BENEFICIARIOS = "Beneficiarios-Afore";

const ModalRegistrarAfiliado = ({ onClose, onSaved, afiliado, modo = "new" }) => {
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

    // ✅ en BD es es_referido + nombre_referido
    es_referido: false,
    nombre_referido: "",
  });

  // Foto afiliado
  const [foto, setFoto] = useState(null);

  // Referencias (1 opcional)
  const [referencia, setReferencia] = useState({
    nombre: "",
    apellido_paterno: "",
    apellido_materno: "",
    telefono: "",
    direccion: "",
  });

  // Beneficiario (1 opcional)
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

  // ✅ Precargar si es edición
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

        // ✅ leer de BD
        es_referido: afiliado.es_referido ?? false,
        nombre_referido: afiliado.nombre_referido || "",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modo, afiliado]);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const inputBase =
    "w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl " +
    "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all";

  const labelBase = "text-sm font-medium text-slate-700 mb-1";

  const handleSubmit = async () => {
    setError("");

    // ✅ obligatorios (mantengo tu criterio actual)
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

    const confirmar = window.confirm("¿Estas seguro de guardar los cambios realizados?");
    if (!confirmar) return;

    setLoading(true);

    try {
      // =========================
      // SUBIR FOTO AFILIADO (si hay)
      // =========================
      let foto_url = afiliado?.foto_url || null;

      if (foto) {
        const fileName = `${Date.now()}-${foto.name}`;
        const { error: uploadError } = await supabase.storage
          .from(BUCKET_AFILIADOS)
          .upload(fileName, foto, { upsert: false });

        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from(BUCKET_AFILIADOS).getPublicUrl(fileName);
        foto_url = data.publicUrl;
      }

      // ✅ Payload EXACTO a tu tabla (NO existe 'referido')
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

        foto_url,

        // ✅ BD
        es_referido: !!form.es_referido,
        nombre_referido: form.es_referido ? form.nombre_referido : "Nuevo",
      };

      let afiliadoId = afiliado?.id_afiliado || null;

      // =========================
      // INSERT / UPDATE AFILIADO
      // =========================
      if (modo === "new") {
        const { data, error: insErr } = await supabase
          .from("afore_afiliados")
          .insert([payload])
          .select("id_afiliado")
          .single();

        if (insErr) throw insErr;
        afiliadoId = data?.id_afiliado;
      } else {
        const { error: updErr } = await supabase
          .from("afore_afiliados")
          .update({ ...payload, updated_at: new Date().toISOString() })
          .eq("id_afiliado", afiliadoId);

        if (updErr) throw updErr;
      }

      // =========================
      // GUARDAR REFERENCIA (si llenó algo)
      // =========================
      const refTieneAlgo =
        referencia.nombre ||
        referencia.apellido_paterno ||
        referencia.apellido_materno ||
        referencia.telefono ||
        referencia.direccion;

      if (refTieneAlgo) {
        const { error: refErr } = await supabase.from("Refs_Afore").insert([
          {
            id_afiliado: afiliadoId,
            nombre: referencia.nombre || null,
            apellido_paterno: referencia.apellido_paterno || null,
            apellido_materno: referencia.apellido_materno || null,
            telefono: referencia.telefono || null,
            direccion: referencia.direccion || null,
          },
        ]);
        if (refErr) throw refErr;
      }

      // =========================
      // SUBIR ARCHIVOS BENEFICIARIO
      // =========================
      let beneficiario_foto_url = null;
      let beneficiario_documento_url = null;

      if (beneficiarioFoto) {
        const fName = `${Date.now()}-${beneficiarioFoto.name}`;
        const { error: bFotoErr } = await supabase.storage
          .from(BUCKET_BENEFICIARIOS)
          .upload(fName, beneficiarioFoto, { upsert: false });

        if (bFotoErr) throw bFotoErr;

        const { data } = supabase.storage.from(BUCKET_BENEFICIARIOS).getPublicUrl(fName);
        beneficiario_foto_url = data.publicUrl;
      }

      if (beneficiarioDoc) {
        const dName = `${Date.now()}-${beneficiarioDoc.name}`;
        const { error: bDocErr } = await supabase.storage
          .from(BUCKET_BENEFICIARIOS)
          .upload(dName, beneficiarioDoc, { upsert: false });

        if (bDocErr) throw bDocErr;

        const { data } = supabase.storage.from(BUCKET_BENEFICIARIOS).getPublicUrl(dName);
        beneficiario_documento_url = data.publicUrl;
      }

      // =========================
      // GUARDAR BENEFICIARIO (si llenó algo)
      // =========================
      const benTieneAlgo =
        beneficiario.nombre ||
        beneficiario.apellido_paterno ||
        beneficiario.apellido_materno ||
        beneficiario.telefono ||
        beneficiario.direccion ||
        beneficiarioFoto ||
        beneficiarioDoc;

      if (benTieneAlgo) {
        const { error: benErr } = await supabase.from("Beneficiarios_Afore").insert([
          {
            id_afiliado: afiliadoId,
            nombre: beneficiario.nombre || null,
            apellido_paterno: beneficiario.apellido_paterno || null,
            apellido_materno: beneficiario.apellido_materno || null,
            telefono: beneficiario.telefono || null,
            direccion: beneficiario.direccion || null,
            foto_url: beneficiario_foto_url,
            documento_url: beneficiario_documento_url,
          },
        ]);
        if (benErr) throw benErr;
      }

      if (onSaved) await onSaved();
      onClose();
    } catch (err) {
      setError(err?.message || "Error al guardar.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-6 z-50">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-5xl">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold text-slate-900">
              {modo === "edit" ? "Editar Afiliado AFORE" : "Registrar Nuevo Afiliado AFORE"}
            </h2>
            <p className="text-slate-500 mt-1">Todos los campos son obligatorios.</p>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-200 text-slate-800 rounded-xl hover:bg-slate-300 transition"
          >
            Cancelar
          </button>
        </div>

        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded-xl border border-red-200 mb-6">
            {error}
          </div>
        )}

        {/* =========================
            DATOS AFILIADO + FOTO
           ========================= */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input className={inputBase} name="nombre" placeholder="Nombre *" value={form.nombre} onChange={handleChange} />
          <input className={inputBase} name="apellido_paterno" placeholder="Apellido paterno *" value={form.apellido_paterno} onChange={handleChange} />
          <input className={inputBase} name="apellido_materno" placeholder="Apellido materno *" value={form.apellido_materno} onChange={handleChange} />
          <input className={inputBase} name="email" placeholder="Correo electrónico *" value={form.email} onChange={handleChange} />
          <input className={inputBase} type="password" name="contraseña" placeholder="Contraseña *" value={form.contraseña} onChange={handleChange} />
          <input className={inputBase} name="telefono" placeholder="Teléfono *" value={form.telefono} onChange={handleChange} />
          <input className={inputBase} name="direccion" placeholder="Dirección *" value={form.direccion} onChange={handleChange} />
          <input className={inputBase} name="cp" placeholder="Código Postal *" value={form.cp} onChange={handleChange} />

          <div>
            <div className={labelBase}>Fecha de nacimiento *</div>
            <input className={inputBase} type="date" name="fecha_nacimiento" value={form.fecha_nacimiento} onChange={handleChange} />
          </div>

          <div>
            <div className={labelBase}>Fecha de registro *</div>
            <input className={inputBase} type="date" name="miembro_desde" value={form.miembro_desde} onChange={handleChange} />
          </div>

          <div className="md:col-span-2">
            <div className={`${labelBase} font-semibold`}>Foto del afiliado *</div>
            <input
              className="block w-full"
              type="file"
              accept="image/*"
              onChange={(e) => setFoto(e.target.files?.[0] || null)}
            />
            {modo === "edit" && afiliado?.foto_url && (
              <p className="text-xs text-slate-500 mt-2">
                Si no eliges foto nueva, se conserva la actual.
              </p>
            )}
          </div>
        </div>

        {/* =========================
            REFERIDO
           ========================= */}
        <div className="mt-6 border-t pt-6">
          <div className="font-semibold mb-3">Referido</div>

          <div className="flex gap-6 mb-3">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                checked={form.es_referido === true}
                onChange={() => setForm((p) => ({ ...p, es_referido: true }))}
              />
              Sí
            </label>

            <label className="flex items-center gap-2">
              <input
                type="radio"
                checked={form.es_referido === false}
                onChange={() =>
                  setForm((p) => ({ ...p, es_referido: false, nombre_referido: "" }))
                }
              />
              No
            </label>
          </div>

          {form.es_referido && (
            <input
              className={inputBase}
              placeholder="Ingresa el Nombre completo de quien refiere"
              name="nombre_referido"
              value={form.nombre_referido}
              onChange={handleChange}
            />
          )}
        </div>

        {/* =========================
            REFERENCIAS PERSONALES
           ========================= */}
        <div className="mt-6 border-t pt-6">
          <div className="font-bold text-slate-900 mb-4">Referencias Personales</div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              className={inputBase}
              placeholder="Nombre"
              value={referencia.nombre}
              onChange={(e) => setReferencia((p) => ({ ...p, nombre: e.target.value }))}
            />
            <input
              className={inputBase}
              placeholder="Apellido Paterno"
              value={referencia.apellido_paterno}
              onChange={(e) => setReferencia((p) => ({ ...p, apellido_paterno: e.target.value }))}
            />
            <input
              className={inputBase}
              placeholder="Apellido Materno"
              value={referencia.apellido_materno}
              onChange={(e) => setReferencia((p) => ({ ...p, apellido_materno: e.target.value }))}
            />
            <input
              className={inputBase}
              placeholder="Teléfono"
              value={referencia.telefono}
              onChange={(e) => setReferencia((p) => ({ ...p, telefono: e.target.value }))}
            />
            <input
              className={`${inputBase} md:col-span-2`}
              placeholder="Dirección"
              value={referencia.direccion}
              onChange={(e) => setReferencia((p) => ({ ...p, direccion: e.target.value }))}
            />
          </div>
        </div>

        {/* =========================
            BENEFICIARIO
           ========================= */}
        <div className="mt-6 pt-6 border-t-2 border-blue-600">
          <div className="font-bold text-blue-600 mb-4">Beneficiario</div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              className={inputBase}
              placeholder="Nombre"
              value={beneficiario.nombre}
              onChange={(e) => setBeneficiario((p) => ({ ...p, nombre: e.target.value }))}
            />
            <input
              className={inputBase}
              placeholder="Apellido Paterno"
              value={beneficiario.apellido_paterno}
              onChange={(e) => setBeneficiario((p) => ({ ...p, apellido_paterno: e.target.value }))}
            />
            <input
              className={inputBase}
              placeholder="Apellido Materno"
              value={beneficiario.apellido_materno}
              onChange={(e) => setBeneficiario((p) => ({ ...p, apellido_materno: e.target.value }))}
            />
            <input
              className={inputBase}
              placeholder="Teléfono"
              value={beneficiario.telefono}
              onChange={(e) => setBeneficiario((p) => ({ ...p, telefono: e.target.value }))}
            />
            <input
              className={`${inputBase} md:col-span-2`}
              placeholder="Dirección"
              value={beneficiario.direccion}
              onChange={(e) => setBeneficiario((p) => ({ ...p, direccion: e.target.value }))}
            />

            <div className="md:col-span-2">
              <div className={labelBase}>Documento (opcional)</div>
              <input type="file" onChange={(e) => setBeneficiarioDoc(e.target.files?.[0] || null)} />
            </div>

            <div className="md:col-span-2">
              <div className={labelBase}>Foto (opcional)</div>
              <input type="file" accept="image/*" onChange={(e) => setBeneficiarioFoto(e.target.files?.[0] || null)} />
            </div>
          </div>
        </div>

        {/* =========================
            FOOTER
           ========================= */}
        <div className="flex justify-end gap-3 mt-8">
          <button
            onClick={onClose}
            className="px-5 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 transition"
          >
            Cancelar
          </button>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-xl shadow-md hover:bg-blue-700 transition-all"
          >
            {loading ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalRegistrarAfiliado;
