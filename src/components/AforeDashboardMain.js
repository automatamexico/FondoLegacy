import React, { useEffect, useState } from 'react';

const SUPABASE_URL = 'https://ubfkhtkmlvutwdivmoff.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InViZmtodGttbHZ1dHdkaXZtb2ZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4MTc5NTUsImV4cCI6MjA2NjM5Mzk1NX0.c0iRma-dnlL29OR3ffq34nmZuj_ViApBTMG-6PEX_B4';

const AforeDashboardMain = () => {
  const [stats, setStats] = useState({
    afiliados: 0,
    ahorroAcumulado: 0,
    interesDia: 0,
    interesAcumulado: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 🔹 NUEVO: control del modal
  const [openModal, setOpenModal] = useState(false);
  const [foto, setFoto] = useState(null);

  const [form, setForm] = useState({
    nombre: '',
    apellido_paterno: '',
    apellido_materno: '',
    fecha_nacimiento: '',
    correo: '',
    telefono: '',
    direccion: '',
    codigo_postal: '',
    activo: true,
  });

  useEffect(() => {
    fetchAforeStats();
  }, []);

  const fetchJSON = async (url) => {
    const res = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
    });
    if (!res.ok) throw new Error('Error al consultar datos AFORE');
    return res.json();
  };

  const fetchAforeStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const afiliados = await fetchJSON(
        `${SUPABASE_URL}/rest/v1/afore_afiliados?select=id_afiliado`
      );

      const ahorros = await fetchJSON(
        `${SUPABASE_URL}/rest/v1/ahorro_afore?select=ahorro_aportado`
      );

      const totalAhorro = ahorros.reduce(
        (sum, row) => sum + (parseFloat(row.ahorro_aportado) || 0),
        0
      );

      setStats({
        afiliados: afiliados.length,
        ahorroAcumulado: totalAhorro,
        interesDia: 0,
        interesAcumulado: 0,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) =>
    new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(value || 0);

  const cards = [
    {
      title: 'Afiliados al Afore',
      value: stats.afiliados.toLocaleString(),
      color: 'bg-green-100 text-green-800',
    },
    {
      title: 'Ahorro Acumulado',
      value: formatCurrency(stats.ahorroAcumulado),
      color: 'bg-emerald-100 text-emerald-800',
    },
    {
      title: 'Interés al día',
      value: formatCurrency(stats.interesDia),
      color: 'bg-slate-100 text-slate-600',
    },
    {
      title: 'Interés acumulado',
      value: formatCurrency(stats.interesAcumulado),
      color: 'bg-slate-100 text-slate-600',
    },
  ];

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
  };

  const guardarAfiliado = async (e) => {
    e.preventDefault();

    let foto_url = null;

    if (foto) {
      const fileName = `${Date.now()}-${foto.name}`;
      const uploadRes = await fetch(
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

      if (uploadRes.ok) {
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
    email: form.correo,                 // 🔥 correo → email
    contraseña: form.contraseña || 'temporal123', // 🔥 requerido
    telefono: form.telefono || null,
    direccion: form.direccion || null,
    cp: form.codigo_postal || null,     // 🔥 codigo_postal → cp
    fecha_nacimiento: form.fecha_nacimiento || null,
    estatus: form.activo ? 'activo' : 'inactivo', // 🔥 boolean → texto
    foto_url: foto_url,
  }),
});


    setOpenModal(false);
    fetchAforeStats();
  };

  return (
    <div className="p-6 space-y-8 bg-slate-50 min-h-full">

      {/* 🔹 BOTÓN AFILIADOS */}
      <div className="flex justify-end">
        <button
          onClick={() => setOpenModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          + Registrar nuevo afiliado
        </button>
      </div>

      <div className="text-center">
        <h1 className="text-4xl font-extrabold text-slate-900 mb-2">
          Control de Afore
        </h1>
        <p className="text-xl text-slate-600">
          Tablero general de ahorro para el futuro
        </p>
      </div>

      {loading && (
        <div className="flex justify-center items-center h-48">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-green-500"></div>
          <p className="ml-4 text-slate-700 text-lg">Cargando datos...</p>
        </div>
      )}

      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {cards.map((card, i) => (
            <div
              key={i}
              className={`rounded-2xl shadow-lg p-6 hover:scale-105 transition ${card.color}`}
            >
              <h3 className="text-lg font-semibold mb-2">{card.title}</h3>
              <p className="text-4xl font-bold">{card.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* 🔹 MODAL */}
      {openModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-2xl p-6">
            <h2 className="text-xl font-bold mb-4">Registrar nuevo afiliado</h2>

            <form onSubmit={guardarAfiliado} className="grid grid-cols-2 gap-4">
              <input name="nombre" placeholder="Nombre" onChange={handleFormChange} required />
              <input name="apellido_paterno" placeholder="Apellido paterno" onChange={handleFormChange} required />
              <input name="apellido_materno" placeholder="Apellido materno" onChange={handleFormChange} />
              <input type="date" name="fecha_nacimiento" onChange={handleFormChange} />
              <input type="email" name="correo" placeholder="Correo electrónico" onChange={handleFormChange} />
              <input name="telefono" placeholder="Teléfono" onChange={handleFormChange} />
              <input name="direccion" placeholder="Dirección" onChange={handleFormChange} />
              <input name="codigo_postal" placeholder="Código Postal" onChange={handleFormChange} />

              <label className="col-span-2 flex items-center gap-2">
                <input type="checkbox" name="activo" checked={form.activo} onChange={handleFormChange} />
                Afiliado activo
              </label>

              <input
                type="file"
                accept="image/*"
                className="col-span-2"
                onChange={(e) => setFoto(e.target.files[0])}
              />

              <div className="col-span-2 flex justify-end gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setOpenModal(false)}
                  className="px-4 py-2 border rounded"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded"
                >
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

export default AforeDashboardMain;
