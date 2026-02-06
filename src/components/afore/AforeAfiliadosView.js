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

      // contraseña NO es obligatoria
      if (k === 'contraseña') return;

      if (!form[k] || String(form[k]).trim() === '') {
        faltantes.push(camposObligatorios[k]);
      }
    });

    setErrors(faltantes);
    return faltantes.length === 0;
  };

  const inputClass = (key) =>
    `border rounded px-3 py-2 w-full ${
      errors.includes(camposObligatorios[key]) ? 'border-red-500' : 'border-slate-300'
    }`;

  const subirFotoASupabase = async (file) => {
    // Nombre de archivo seguro
    const safeName = (file.name || 'foto')
      .replace(/\s+/g, '-')
      .replace(/[^a-zA-Z0-9.\-_]/g, '');

    const fileName = `${Date.now()}-${safeName}`;

    // ✅ URL CORRECTA DE SUBIDA (bucket = Foros-Afiliados)
    const uploadUrl = `${SUPABASE_URL}/storage/v1/object/${BUCKET_ID}/${fileName}`;

    const uploadRes = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: file,
    });

    if (!uploadRes.ok) {
      const t = await uploadRes.text().catch(() => '');
      throw new Error(`No se pudo subir la imagen. (${uploadRes.status}) ${t}`);
    }

    // ✅ URL PÚBLICA CORRECTA
    const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_ID}/${fileName}`;
    return publicUrl;
  };

  const guardarAfiliado = async (e) => {
    e.preventDefault();
    if (!validar()) return;

    setSaving(true);

    try {
      let foto_url = null;

      if (foto) {
        foto_url = await subirFotoASupabase(foto);
      }

      const payload = {
        nombre: form.nombre.trim(),
        apellido_paterno: form.apellido_paterno.trim(),
        apellido_materno: form.apellido_materno.trim(),
        email: form.correo.trim(),
        contraseña: form.contraseña && form.contraseña.trim() ? form.contraseña.trim() : 'temporal123',
        telefono: form.telefono.trim(),
        direccion: form.direccion.trim(),
        cp: form.codigo_postal.trim(),
        fecha_nacimiento: form.fecha_nacimiento || null,
        miembro_desde: form.miembro_desde, // requerido por tu tabla
        estatus: 'activo',
        foto_url,
      };

      const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/afore_afiliados`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          Prefer: 'return=minimal',
        },
        body: JSON.stringify(payload),
      });

      if (!insertRes.ok) {
        const t = await insertRes.text().catch(() => '');
        throw new Error(`No se pudo guardar el afiliado. (${insertRes.status}) ${t}`);
      }

      // Reset y cerrar
      setOpenModal(false);
      setErrors([]);
      setFoto(null);
      setForm({
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
    } catch (err) {
      console.error('❌ Error guardando afiliado:', err);
      setErrors([err.message || 'Error desconocido al guardar']);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-full">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-900">Afiliados AFORE</h1>

        <button
          onClick={() => setOpenModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          + Registrar nuevo afiliado
        </button>
      </div>

      {openModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-3xl p-6">
            <h2 className="text-xl font-bold mb-4">Registrar nuevo afiliado</h2>

            {errors.length > 0 && (
              <div className="mb-4 border border-red-400 bg-red-50 text-red-700 p-3 rounded">
                <strong>Estos campos son obligatorios:</strong>
                <ul className="list-disc list-inside">
                  {errors.map((e, i) => (
                    <li key={i}>{e}</li>
                  ))}
                </ul>
              </div>
            )}

            <form onSubmit={guardarAfiliado} className="grid grid-cols-2 gap-4">
              <input
                className={inputClass('nombre')}
                name="nombre"
                placeholder="Nombre"
                value={form.nombre}
                onChange={handleChange}
              />

              <input
                className={inputClass('apellido_paterno')}
                name="apellido_paterno"
                placeholder="Apellido paterno"
                value={form.apellido_paterno}
                onChange={handleChange}
              />

              <input
                className={inputClass('apellido_materno')}
                name="apellido_materno"
                placeholder="Apellido materno"
                value={form.apellido_materno}
                onChange={handleChange}
              />

              <input
                className={inputClass('correo')}
                type="email"
                name="correo"
                placeholder="Correo electrónico"
                value={form.correo}
                onChange={handleChange}
              />

              <input
                className="border rounded px-3 py-2 w-full border-slate-300 col-span-2"
                type="password"
                name="contraseña"
                placeholder="Genera una contraseña (opcional)"
                value={form.contraseña}
                onChange={handleChange}
              />

              <div>
                <label className="text-sm text-slate-700">Fecha de nacimiento</label>
                <input
                  className={inputClass('fecha_nacimiento')}
                  type="date"
                  name="fecha_nacimiento"
                  value={form.fecha_nacimiento}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label className="text-sm text-slate-700">Fecha de registro</label>
                <input
                  className={inputClass('miembro_desde')}
                  type="date"
                  name="miembro_desde"
                  value={form.miembro_desde}
                  onChange={handleChange}
                />
              </div>

              <input
                className={inputClass('telefono')}
                name="telefono"
                placeholder="Teléfono"
                value={form.telefono}
                onChange={handleChange}
              />

              <input
                className={inputClass('direccion')}
                name="direccion"
                placeholder="Dirección"
                value={form.direccion}
                onChange={handleChange}
              />

              <input
                className={inputClass('codigo_postal')}
                name="codigo_postal"
                placeholder="Código Postal"
                value={form.codigo_postal}
                onChange={handleChange}
              />

              <div className="col-span-2">
                <label className="text-sm text-slate-700 block mb-1">
                  Foto del afiliado
                </label>
                <input
                  type="file"
                  accept="image/*"
                  className={`w-full ${errors.includes('Foto del afiliado') ? 'text-red-600' : ''}`}
                  onChange={(e) => setFoto(e.target.files?.[0] || null)}
                />
              </div>

              <div className="col-span-2 flex justify-end gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setOpenModal(false)}
                  className="px-4 py-2 border rounded"
                  disabled={saving}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-60"
                  disabled={saving}
                >
                  {saving ? 'Guardando…' : 'Guardar afiliado'}
                </button>
              </div>
            </form>

            <p className="text-xs text-slate-500 mt-4">
              Bucket usado para fotos: <strong>{BUCKET_ID}</strong>
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AforeAfiliadosView;
