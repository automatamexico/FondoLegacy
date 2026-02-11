import React, { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";

const BUCKET_BENEFICIARIOS = "Beneficiarios-Afore";

const AforeExtrasSection = ({ afiliado }) => {
  const [refs, setRefs] = useState([]);
  const [beneficiarios, setBeneficiarios] = useState([]);

  const [newRef, setNewRef] = useState({
    nombre: "",
    apellido_paterno: "",
    apellido_materno: "",
    telefono: "",
    direccion: "",
  });

  const [newBen, setNewBen] = useState({
    nombre: "",
    apellido_paterno: "",
    apellido_materno: "",
    telefono: "",
    direccion: "",
  });

  const [foto, setFoto] = useState(null);
  const [documento, setDocumento] = useState(null);

  useEffect(() => {
    if (!afiliado?.id_afiliado) return;
    cargarReferencias();
    cargarBeneficiarios();
  }, [afiliado]);

  const cargarReferencias = async () => {
    const { data } = await supabase
      .from("refs_afore")
      .select("*")
      .eq("id_afiliado", afiliado.id_afiliado);

    setRefs(data || []);
  };

  const cargarBeneficiarios = async () => {
    const { data } = await supabase
      .from("beneficiarios_afore")
      .select("*")
      .eq("id_afiliado", afiliado.id_afiliado);

    setBeneficiarios(data || []);
  };

  const guardarReferencia = async () => {
    if (!newRef.nombre || !newRef.apellido_paterno || !newRef.apellido_materno)
      return;

    await supabase.from("refs_afore").insert([
      {
        ...newRef,
        id_afiliado: afiliado.id_afiliado,
      },
    ]);

    setNewRef({
      nombre: "",
      apellido_paterno: "",
      apellido_materno: "",
      telefono: "",
      direccion: "",
    });

    cargarReferencias();
  };

  const guardarBeneficiario = async () => {
    if (!newBen.nombre || !newBen.apellido_paterno || !newBen.apellido_materno)
      return;

    let foto_url = null;
    let documento_url = null;

    if (foto) {
      const fileName = `foto-${Date.now()}-${foto.name}`;
      await supabase.storage
        .from(BUCKET_BENEFICIARIOS)
        .upload(fileName, foto);
      const { data } = supabase.storage
        .from(BUCKET_BENEFICIARIOS)
        .getPublicUrl(fileName);
      foto_url = data.publicUrl;
    }

    if (documento) {
      const fileName = `doc-${Date.now()}-${documento.name}`;
      await supabase.storage
        .from(BUCKET_BENEFICIARIOS)
        .upload(fileName, documento);
      const { data } = supabase.storage
        .from(BUCKET_BENEFICIARIOS)
        .getPublicUrl(fileName);
      documento_url = data.publicUrl;
    }

    await supabase.from("beneficiarios_afore").insert([
      {
        ...newBen,
        id_afiliado: afiliado.id_afiliado,
        foto_url,
        documento_url,
      },
    ]);

    setNewBen({
      nombre: "",
      apellido_paterno: "",
      apellido_materno: "",
      telefono: "",
      direccion: "",
    });

    setFoto(null);
    setDocumento(null);

    cargarBeneficiarios();
  };

  return (
    <div className="mt-8 space-y-8">
      {/* Línea Azul */}
      <div className="h-1 bg-blue-600 rounded-full"></div>

      <h3 className="text-xl font-bold text-slate-900">
        Referencias Personales
      </h3>

      <div className="grid md:grid-cols-2 gap-4">
        <input placeholder="Nombre"
          value={newRef.nombre}
          onChange={(e) =>
            setNewRef({ ...newRef, nombre: e.target.value })
          }
          className="input-style" />
        <input placeholder="Apellido Paterno"
          value={newRef.apellido_paterno}
          onChange={(e) =>
            setNewRef({ ...newRef, apellido_paterno: e.target.value })
          }
          className="input-style" />
        <input placeholder="Apellido Materno"
          value={newRef.apellido_materno}
          onChange={(e) =>
            setNewRef({ ...newRef, apellido_materno: e.target.value })
          }
          className="input-style" />
        <input placeholder="Teléfono"
          value={newRef.telefono}
          onChange={(e) =>
            setNewRef({ ...newRef, telefono: e.target.value })
          }
          className="input-style" />
        <input placeholder="Dirección"
          value={newRef.direccion}
          onChange={(e) =>
            setNewRef({ ...newRef, direccion: e.target.value })
          }
          className="input-style md:col-span-2" />
      </div>

      <button
        onClick={guardarReferencia}
        className="px-4 py-2 bg-blue-600 text-white rounded-xl"
      >
        Agregar Referencia
      </button>

      <div className="h-1 bg-blue-600 rounded-full mt-8"></div>

      <h3 className="text-xl font-bold text-slate-900">Beneficiarios</h3>

      <div className="grid md:grid-cols-2 gap-4">
        <input placeholder="Nombre"
          value={newBen.nombre}
          onChange={(e) =>
            setNewBen({ ...newBen, nombre: e.target.value })
          }
          className="input-style" />
        <input placeholder="Apellido Paterno"
          value={newBen.apellido_paterno}
          onChange={(e) =>
            setNewBen({ ...newBen, apellido_paterno: e.target.value })
          }
          className="input-style" />
        <input placeholder="Apellido Materno"
          value={newBen.apellido_materno}
          onChange={(e) =>
            setNewBen({ ...newBen, apellido_materno: e.target.value })
          }
          className="input-style" />
        <input placeholder="Teléfono"
          value={newBen.telefono}
          onChange={(e) =>
            setNewBen({ ...newBen, telefono: e.target.value })
          }
          className="input-style" />
        <input placeholder="Dirección"
          value={newBen.direccion}
          onChange={(e) =>
            setNewBen({ ...newBen, direccion: e.target.value })
          }
          className="input-style md:col-span-2" />

        <input type="file" onChange={(e) => setFoto(e.target.files[0])} />
        <input type="file" onChange={(e) => setDocumento(e.target.files[0])} />
      </div>

      <button
        onClick={guardarBeneficiario}
        className="px-4 py-2 bg-green-600 text-white rounded-xl"
      >
        Agregar Beneficiario
      </button>
    </div>
  );
};

export default AforeExtrasSection;
