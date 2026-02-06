import React, { useState } from 'react';

const SUPABASE_URL = 'https://ubfkhtkmlvutwdivmoff.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InViZmtodGttbHZ1dHdkaXZtb2ZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4MTc5NTUsImV4cCI6MjA2NjM5Mzk1NX0.c0iRma-dnlL29OR3ffq34nmZuj_ViApBTMG-6PEX_B4';

const AforeAfiliadosView = () => {
  const [openModal, setOpenModal] = useState(false);
  const [foto, setFoto] = useState(null);
  const [errors, setErrors] = useState([]);

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
    setForm({ ...form, [name]: value });
  };

  const validar = () => {
    const faltantes = [];
    Object.keys(camposObligatorios).forEach((k) => {
      if (k === 'foto') {
        if (!foto) faltantes.push(camposObligatorios[k]);
      } else if (!form[k]) {
        // contraseña NO es obligatoria
        if (k === 'contraseña') return;
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

  const guardarAfiliado = async (e) => {
    e.preventDefault();
    if (!validar()) return;

    let foto_url = null;

    if (foto) {
      const fileName = `${Date.now()}-${foto.name}`;
      const upload = await fetch(
        `${SUPABASE_URL}/storage/v1/object/Fotos Afiliados/${fileName}`,
        {
          method: 'POST',
          headers: {
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          },
          body: foto,
        }
      );

      if (upload.ok) {
        foto_url = `${SUPABASE_URL}/storage/v1/object/public/Fotos Afiliados/${fileName}`;
      }
    }

    await fetch(`${SUPABASE_URL}/rest/v1/afore_afiliados`, {
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

    setOpenModal(false);
    setErrors([]);
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
              <input className={inputClass('nombre')} name="nombre" placeholder="Nombre" onChange={handleChange} />
              <input className={inputClass('apellido_paterno')} name="apellido_paterno" placeholder="Apellido paterno" onChange={handleChange} />
              <input className={inputClass('apellido_materno')} name="apellido_materno" placeholder="Apellido materno" onChange={handleChange} />
              <input className={inputClass('correo')} type="email" name="correo" placeholder="Correo electrónico" onChange={handleChange} />

              <input
                className="border rounded px-3 py-2 w-full border-slate-300"
                type="password"
                name="contraseña"
                placeholder="Genera una contraseña (opcional)"
                onChange={handleChange}
              />

              <div>
                <label className="text-sm text-slate-700">Fecha de nacimiento</label>
                <input className={inputClass('fecha_nacimiento')} type="date" name="fecha_nacimiento" onChange={handleChange} />
              </div>

              <div>
                <label className="text-sm text-slate-700">Fecha de registro</label>
                <input className={inputClass('miembro_desde')} type="date" name="miembro_desde" onChange={handleChange} />
              </div>

              <input className={inputClass('telefono')} name="telefono" placeholder="Teléfono" onChange={handleChange} />
              <input className={inputClass('direccion')} name="direccion" placeholder="Dirección" onChange={handleChange} />
              <input className={inputClass('codigo_postal')} name="codigo_postal" placeholder="Código Postal" onChange={handleChange} />

              <input
                type="file"
                className={`col-span-2 ${errors.includes('Foto del afiliado') ? 'text-red-600' : ''}`}
                accept="image/*"
                onChange={(e) => setFoto(e.target.files[0])}
              />

              <div className="col-span-2 flex justify-end gap-3 mt-4">
                <button type="button" onClick={() => setOpenModal(false)} className="px-4 py-2 border rounded">
                  Cancelar
                </button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">
                  Guardar afiliado
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AforeAfiliadosView;
