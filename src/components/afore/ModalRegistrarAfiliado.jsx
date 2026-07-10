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
  const [cobroAfiliacion, setCobroAfiliacion] = useState(false);
  const [montoAfiliacion, setMontoAfiliacion] = useState("");
const [referenciaBancaria, setReferenciaBancaria] = useState({
  entidad_bancaria: "",
  banco_otro: "",
  titular_cuenta: "",
  numero_cuenta: "",
  cuenta_clabe: "",
  pais: "México",
});

const [referenciaBancariaId, setReferenciaBancariaId] = useState(null);

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
  const cargarReferenciaBancaria = async () => {
  const { data, error } = await supabase
    .from("referencias_bancarias_afore")
    .select("*")
    .eq("id_afiliado", afiliado.id_afiliado)
    .maybeSingle();

  if (error) {
    console.error("Error cargando referencia bancaria:", error);
    return;
  }

  if (data) {
    setReferenciaBancariaId(data.id_referencia_bancaria);

    setReferenciaBancaria({
      entidad_bancaria: data.entidad_bancaria || "",
      banco_otro: data.banco_otro || "",
      titular_cuenta: data.titular_cuenta || "",
      numero_cuenta: data.numero_cuenta || "",
      cuenta_clabe: data.cuenta_clabe || "",
      pais: data.pais || "México",
    });
  }
};

cargarReferenciaBancaria();

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

            // 🔹 Guardar referencia personal
      if (referencia.nombre) {
        const { error: refError } = await supabase
          .from("refs_afore")
          .insert([
            {
              ...referencia,
              id_afiliado: afiliadoId,
              created_at: new Date().toISOString(),
            },
          ]);

        if (refError) throw refError;
      }

      // 🔹 Guardar beneficiario
      if (beneficiario.nombre) {
        let foto_url = null;
        let doc_url = null;

        if (beneficiarioFoto) {
          const fileName = `${Date.now()}-${beneficiarioFoto.name}`;
          const { error: uploadFotoError } = await supabase.storage
            .from(BUCKET_BENEFICIARIOS)
            .upload(fileName, beneficiarioFoto);

          if (uploadFotoError) throw uploadFotoError;

          const { data } = supabase.storage
            .from(BUCKET_BENEFICIARIOS)
            .getPublicUrl(fileName);

          foto_url = data.publicUrl;
        }

        if (beneficiarioDoc) {
          const fileName = `${Date.now()}-${beneficiarioDoc.name}`;
          const { error: uploadDocError } = await supabase.storage
            .from(BUCKET_BENEFICIARIOS)
            .upload(fileName, beneficiarioDoc);

          if (uploadDocError) throw uploadDocError;

          const { data } = supabase.storage
            .from(BUCKET_BENEFICIARIOS)
            .getPublicUrl(fileName);

          doc_url = data.publicUrl;
        }

        const { error: benError } = await supabase
          .from("beneficiarios_afore")
          .insert([
            {
              ...beneficiario,
              id_afiliado: afiliadoId,
              foto_url,
              documento_url: doc_url,
              created_at: new Date().toISOString(),
            },
          ]);

        if (benError) throw benError;
      }
// 🔹 Guardar referencia bancaria AFORE
const tieneDatosBancarios =
  referenciaBancaria.entidad_bancaria ||
  referenciaBancaria.titular_cuenta ||
  referenciaBancaria.numero_cuenta ||
  referenciaBancaria.cuenta_clabe;

if (tieneDatosBancarios) {
  const bancoPayload = {
    id_afiliado: afiliadoId,
    entidad_bancaria: referenciaBancaria.entidad_bancaria,
    banco_otro:
      referenciaBancaria.entidad_bancaria === "OTRO"
        ? referenciaBancaria.banco_otro
        : null,
    titular_cuenta: referenciaBancaria.titular_cuenta,
    numero_cuenta: referenciaBancaria.numero_cuenta,
    cuenta_clabe: referenciaBancaria.cuenta_clabe,
    pais: referenciaBancaria.pais || "México",
  };

  if (referenciaBancariaId) {
    const { error: bancoError } = await supabase
      .from("referencias_bancarias_afore")
      .update(bancoPayload)
      .eq("id_referencia_bancaria", referenciaBancariaId);

    if (bancoError) throw bancoError;
  } else {
    const { data: bancoData, error: bancoError } = await supabase
      .from("referencias_bancarias_afore")
      .insert([bancoPayload])
      .select("id_referencia_bancaria")
      .single();

    if (bancoError) throw bancoError;

    setReferenciaBancariaId(
      bancoData?.id_referencia_bancaria || null
    );
  }
}
      // 🔹 Guardar pago de afiliación
      if (cobroAfiliacion && montoAfiliacion) {
        const { error: pagoError } = await supabase
          .from("pago_afiliaciones")
          .insert([
            {
              id_socio: afiliadoId,
              afiliacion_papeleria: true,
              monto_afiliacion_papeleria: parseFloat(montoAfiliacion),
              fecha_hora: new Date().toISOString(),
              estatus: "PENDIENTE",
            },
          ]);

        if (pagoError) throw pagoError;
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
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-5xl max-h-[90vh] overflow-y-auto">
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
{/* REFERENCIAS BANCARIAS */}
<div className="mt-6 border-t-4 border-blue-600 pt-4">
  <div className="font-bold mb-3">
    Referencias Bancarias
  </div>

  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <select
      className={inputStyle + " md:col-span-2"}
      value={referenciaBancaria.entidad_bancaria}
      onChange={(e) =>
        setReferenciaBancaria((prev) => ({
          ...prev,
          entidad_bancaria: e.target.value,
          banco_otro:
            e.target.value === "OTRO"
              ? prev.banco_otro
              : "",
        }))
      }
    >
      <option value="">
        Seleccione entidad bancaria
      </option>

      <option value="BBVA México">BBVA México</option>
      <option value="Banco Santander México">
        Banco Santander México
      </option>
      <option value="Banco Mercantil del Norte (Banorte)">
        Banco Mercantil del Norte (Banorte)
      </option>
      <option value="Banco Nacional de México (Citibanamex)">
        Banco Nacional de México (Citibanamex)
      </option>
      <option value="HSBC México">HSBC México</option>
      <option value="Scotiabank Inverlat">
        Scotiabank Inverlat
      </option>
      <option value="Banco Inbursa">
        Banco Inbursa
      </option>
      <option value="Banco Azteca">
        Banco Azteca
      </option>
      <option value="BanCoppel">BanCoppel</option>
      <option value="Banco del Bajío">
        Banco del Bajío
      </option>
      <option value="Nubank (Nu México)">
        Nubank (Nu México)
      </option>
      <option value="SPIN By OXXO">
        SPIN By OXXO
      </option>
      <option value="OTRO">Otro</option>
    </select>

    {referenciaBancaria.entidad_bancaria === "OTRO" && (
      <input
        className={inputStyle + " md:col-span-2"}
        placeholder="Nombre del banco"
        value={referenciaBancaria.banco_otro}
        onChange={(e) =>
          setReferenciaBancaria((prev) => ({
            ...prev,
            banco_otro: e.target.value,
          }))
        }
      />
    )}

    <input
      className={inputStyle}
      placeholder="Titular de la cuenta"
      value={referenciaBancaria.titular_cuenta}
      onChange={(e) =>
        setReferenciaBancaria((prev) => ({
          ...prev,
          titular_cuenta: e.target.value,
        }))
      }
    />

    <input
      className={inputStyle}
      type="tel"
      inputMode="numeric"
      placeholder="Número de cuenta"
      value={referenciaBancaria.numero_cuenta}
      onChange={(e) =>
        setReferenciaBancaria((prev) => ({
          ...prev,
          numero_cuenta: e.target.value.replace(/\D/g, ""),
        }))
      }
    />

    <input
      className={inputStyle}
      type="tel"
      inputMode="numeric"
      maxLength={18}
      placeholder="Cuenta CLABE"
      value={referenciaBancaria.cuenta_clabe}
      onChange={(e) =>
        setReferenciaBancaria((prev) => ({
          ...prev,
          cuenta_clabe: e.target.value
            .replace(/\D/g, "")
            .slice(0, 18),
        }))
      }
    />

    <input
      className={inputStyle}
      placeholder="País"
      value={referenciaBancaria.pais}
      onChange={(e) =>
        setReferenciaBancaria((prev) => ({
          ...prev,
          pais: e.target.value,
        }))
      }
    />
  </div>
</div>
        {/* COBRO AFILIACION */}
<div className="mt-6 border-t-4 border-blue-600 pt-4">
  <div className="font-bold mb-3">Cobro Afiliación</div>

  <div className="flex gap-6 mb-3">
    <label>
      <input
        type="radio"
        checked={cobroAfiliacion}
        onChange={() => setCobroAfiliacion(true)}
      />{" "}
      Sí
    </label>

    <label>
      <input
        type="radio"
        checked={!cobroAfiliacion}
        onChange={() => {
          setCobroAfiliacion(false);
          setMontoAfiliacion("");
        }}
      />{" "}
      No
    </label>
  </div>

  {cobroAfiliacion && (
    <input
      type="number"
      step="0.01"
      placeholder="Monto cobrado"
      value={montoAfiliacion}
      onChange={(e) => setMontoAfiliacion(e.target.value)}
      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
  )}
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
