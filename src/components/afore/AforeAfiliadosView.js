import React, { useState } from 'react';

const SUPABASE_URL = 'https://ubfkhtkmlvutwdivmoff.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InViZmtodGttbHZ1dHdkaXZtb2ZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4MTc5NTUsImV4cCI6MjA2NjM5Mzk1NX0.c0iRma-dnlL29OR3ffq34nmZuj_ViApBTMG-6PEX_B4';

const BUCKET_ID = 'Foros-Afiliados';

const AforeAfiliadosView = () => {
  const [openModal, setOpenModal] = useState(false);
  const [foto, setFoto] = useState(null);
  const [errors, setErrors] = useState([]);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    nombre: '',
    apellido_paterno: '',
    apellido_materno: '',
    correo: '',
    contraseña: '',
    telefono: '',
    direccion: '',
    codigo_postal: '',
    fecha_nacimiento: '',
    miembro_desde: '',
  });

  const camposObligatorios = {
    nombre: 'Nombre',
    apellido_paterno: 'Apellido paterno',
    apellido_materno: 'Apellido materno',
    correo: 'Correo electrónico',
    telefono: 'Teléfono',
    direccion: 'Dirección',
    codigo_postal: 'Código Postal',
    fecha_nacimiento: 'Fecha de nacimiento',
    miembro_desde: 'Fecha de registro',
    foto: 'Foto del afiliado',
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const validar = () => {
    const faltantes = [];
    Object.keys(camposObligatorios).forEach((k) => {
      if (k === 'foto') {
        if (!foto) faltantes.push(camposObligatorios[k]);
        return;
      }
      if (!form[k] || String(form[k]).trim() === '') {
        faltantes.push(camposObligatorios[k]);
      }
    });
    setErrors(faltantes);
    return faltantes.length === 0;
  };

  const subirFotoASupabase = async (file) => {
    const safeName = file.name.replace(/\s+/g, '-');
    const filePath = `${Date.now()}-${safeName}`;

    const uploadUrl = `${SUPABASE_URL}/storage/v1/object/upload/${BUCKET_ID}/${filePath}`;

    const uploadRes = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: file,
    });

    if (!uploadRes.ok) {
      const t = await uploadRes.text();
      throw new Error(`No se pudo subir la imagen (${uploadRes.status}): ${t}`);
    }

    return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_ID}/${filePath}`;
  };

  const guardarAfiliado = async (e) => {
    e.preventDefault();
    if (!validar()) return;

    setSaving(true);

    try {
      const foto_url = await subirFotoASupabase(foto);

      const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/afore_afiliados`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          Prefer: 'return=minimal',
        },
        body: JSON.stringify({
          nombre: form.nombre,
          apellido_paterno: form.apellido_paterno,
          apellido_materno: form.apellido_materno,
          email: form.correo,
          contraseña: form.contraseña || 'temporal123',
          telefono: form.telefono,
          direccion: form.direccion,
          cp: form.codigo_postal,
          fecha_nacimiento: form.fecha_nacimiento,
          miembro_desde: form.miembro_desde,
          estatus: 'activo',
          foto_url,
        }),
      });

      if (!insertRes.ok) {
        const t = await insertRes.text();
        throw new Error(`Error al guardar afiliado: ${t}`);
      }

      setOpenModal(false);
      setErrors([]);
      setFoto(null);
    } catch (err) {
      console.error(err);
      setErrors([err.message]);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6">
      <button
        onClick={() => setOpenModal(true)}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        + Registrar nuevo afiliado
      </button>

      {openModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center">
          <div className="bg-white p-6 rounded-xl w-full max-w-3xl">
            <h2 className="text-xl font-bold mb-4">Registrar nuevo afiliado</h2>

            {errors.length > 0 && (
              <div className="bg-red-50 border border-red-400 text-red-700 p-3 mb-4 rounded">
                <strong>Estos campos son obligatorios:</strong>
                <ul className="list-disc list-inside">
                  {errors.map((e, i) => (
                    <li key={i}>{e}</li>
                  ))}
                </ul>
              </div>
            )}

            <form onSubmit={guardarAfiliado} className="grid grid-cols-2 gap-4">
              <input name="nombre" placeholder="Nombre" onChange={handleChange} />
              <input name="apellido_paterno" placeholder="Apellido paterno" onChange={handleChange} />
              <input name="apellido_materno" placeholder="Apellido materno" onChange={handleChange} />
              <input name="correo" placeholder="Correo electrónico" onChange={handleChange} />
              <input type="password" name="contraseña" placeholder="Contraseña opcional" onChange={handleChange} />

              <input type="date" name="fecha_nacimiento" onChange={handleChange} />
              <input type="date" name="miembro_desde" onChange={handleChange} />

              <input name="telefono" placeholder="Teléfono" onChange={handleChange} />
              <input name="direccion" placeholder="Dirección" onChange={handleChange} />
              <input name="codigo_postal" placeholder="Código Postal" onChange={handleChange} />

              <input type="file" accept="image/*" onChange={(e) => setFoto(e.target.files[0])} />

              <div className="col-span-2 flex justify-end gap-2">
                <button type="button" onClick={() => setOpenModal(false)}>
                  Cancelar
                </button>
                <button type="submit" disabled={saving}>
                  {saving ? 'Guardando…' : 'Guardar afiliado'}
                </button>
              </div>
            </form>

            <p className="text-xs text-slate-500 mt-2">
              Bucket usado: <strong>{BUCKET_ID}</strong>
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AforeAfiliadosView;
