import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ubfkhtkmlvutwdivmoff.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InViZmtodGttbHZ1dHdkaXZtb2ZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4MTc5NTUsImV4cCI6MjA2NjM5Mzk1NX0.c0iRma-dnlL29OR3ffq34nmZuj_ViApBTMG-6PEX_B4';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
/** Util para avatar de respaldo */
const avatarFallback = (s) => {
  const name = `${s?.nombre || ''} ${s?.apellido_paterno || ''}`.trim() || 'Socio';
  const bg = '0ea15a'; // tu verde
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${bg}&color=fff&size=128`;
};

/** ======== FECHAS SIN DESFASE (no restar 1 día) ======== */
/** Detecta 'YYYY-MM-DD' estrictamente */
const isYMD = (v) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v);
/** Convierte 'YYYY-MM-DD' a Date en zona local sin usar UTC implícito */
const dateFromYMDLocal = (ymd) => {
  if (!isYMD(ymd)) return null;
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(y, m - 1, d); // <-- local, sin zona
};
/** Formatea bonito en español SIN desfase */
const fmtFecha = (v) => {
  if (!v) return '-';

  const dt = new Date(v);
  if (isNaN(dt.getTime())) return '-';

  const fecha = dt.toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  return fecha.replace(/^\d{2}\s\w+/, (match) => {
    return match.charAt(0) + match.slice(1).replace(/\b\w/g, c => c.toUpperCase());
  });
};


/** Para inputs <input type="date"> SIN desfase */
const toDateInput = (v) => {
  if (!v) return '';
  if (isYMD(v)) return v;
  const dt = new Date(v);
  if (isNaN(dt.getTime())) return '';
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  const d = String(dt.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};
/** Normaliza fechas vacías a null */
const cleanDate = (v) => (v && String(v).trim() ? v : null);

const onlyDigits = (v = '') => String(v).replace(/\D/g, '');
const onlyDigitsMax = (v = '', max = 999) => onlyDigits(v).slice(0, max);

const SociosModule = () => {
  const [sociosList, setSociosList] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [showConfirmRegistro, setShowConfirmRegistro] = useState(false);
  const [editingSocio, setEditingSocio] = useState(null);
  const [newSocio, setNewSocio] = useState({
    nombre: '',
    apellido_paterno: '',
    apellido_materno: '',
    email: '',
    contrasena: '',
    telefono: '',
    direccion: '',
    cp: '',
    estatus: 'activo',
    fecha_nacimiento: '',
  });
  const [ahorroRetiro, setAhorroRetiro] = useState(false);
  const [montoAfiliacion, setMontoAfiliacion] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [errorMonto, setErrorMonto] = useState('');
// ================= REFERENCIAS =================
const [referencia, setReferencia] = useState({
  nombre: '',
  apellido_paterno: '',
  apellido_materno: '',
  telefono: '',
  direccion: ''
});

const [referenciaId, setReferenciaId] = useState(null);


// ================= BENEFICIARIO =================
const [beneficiario, setBeneficiario] = useState({
  nombre: '',
  apellido_paterno: '',
  apellido_materno: '',
  telefono: '',
  direccion: ''
});

const [beneficiarioFoto, setBeneficiarioFoto] = useState(null);
const [beneficiarioDocumento, setBeneficiarioDocumento] = useState(null);

 // ================= REFERENCIAS BANCARIAS =================
const [referenciaBancaria, setReferenciaBancaria] = useState({
  entidad_bancaria: '',
  titular_cuenta: '',
  numero_cuenta: '',
  cuenta_clave: '',
  pais: 'México',
  banco_otro: ''
});

const [showBancoModal, setShowBancoModal] = useState(false);
const [bancoPersonalizado, setBancoPersonalizado] = useState({
  nombre: '',
  pais: ''
});

  // Modal eliminar
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [socioToDelete, setSocioToDelete] = useState(null);

  // Foto (drag & drop / input)
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [photoError, setPhotoError] = useState('');
  const [photoUploading, setPhotoUploading] = useState(false);
  const dropRef = useRef(null);
  const fileInputRef = useRef(null);

  // Ficha (modal de detalles)
  const [showFicha, setShowFicha] = useState(false);
  const [socioFicha, setSocioFicha] = useState(null);
  // ===== DATOS RELACIONADOS FICHA =====
const [refsFicha, setRefsFicha] = useState([]);
const [benefFicha, setBenefFicha] = useState([]);
const [bancoFicha, setBancoFicha] = useState([]);


  useEffect(() => {
    fetchSocios();
  }, []);

  const fetchSocios = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/socios?select=*&order=id_socio.asc`, {
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(`Error al cargar socios: ${res.statusText} - ${e.message || 'Error desconocido'}`);
      }
      const data = await res.json();
      setSociosList(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  /** Validación rápida de foto */
  const validatePhoto = (file) => {
    if (!file) return '';
    const okTypes = ['image/jpeg', 'image/png'];
    if (!okTypes.includes(file.type)) return 'Formato inválido. Solo JPG o PNG.';
    const maxMB = 5;
    if (file.size > maxMB * 1024 * 1024) return `La imagen supera ${maxMB}MB.`;
    return '';
  };

  const handleChooseFile = () => fileInputRef.current?.click();

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const v = validatePhoto(f);
    setPhotoError(v);
    if (!v) {
      setPhotoFile(f);
      setPhotoPreview(URL.createObjectURL(f));
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    dropRef.current?.classList.add('ring-2', 'ring-emerald-500');
  };

  const handleDragLeave = () => {
    dropRef.current?.classList.remove('ring-2', 'ring-emerald-500');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    dropRef.current?.classList.remove('ring-2', 'ring-emerald-500');
    const f = e.dataTransfer.files?.[0];
    if (!f) return;
    const v = validatePhoto(f);
    setPhotoError(v);
    if (!v) {
      setPhotoFile(f);
      setPhotoPreview(URL.createObjectURL(f));
    }
  };

  /** Subida a Supabase Storage y retorna URL pública */
  const uploadPhotoToSupabase = async (socioId) => {
    if (!photoFile) return null;
    setPhotoUploading(true);
    try {
      const ext = photoFile.type === 'image/png' ? 'png' : 'jpg';
      const path = `socio_${socioId}.${ext}`;
      const uploadUrl = `${SUPABASE_URL}/storage/v1/object/fotos-socios/${encodeURIComponent(path)}?upsert=true`;

      const upRes = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': photoFile.type,
          'x-upsert': 'true',
          'cache-control': '3600',
        },
        body: photoFile,
      });

      if (!upRes.ok) {
        const e = await upRes.json().catch(() => ({}));
        throw new Error(`Error subiendo foto: ${upRes.statusText} - ${e.message || ''}`);
      }

      const publicURL = `${SUPABASE_URL}/storage/v1/object/public/fotos-socios/${encodeURIComponent(path)}`;
      return publicURL;
    } finally {
      setPhotoUploading(false);
    }
  };
  
const uploadPhotoToAforeBucket = async (socioId) => {
  if (!photoFile) return null;

  const ext = photoFile.type === 'image/png' ? 'png' : 'jpg';
  const path = `afiliado_${socioId}.${ext}`;
  const uploadUrl = `${SUPABASE_URL}/storage/v1/object/Fotos-Afiliados/${encodeURIComponent(path)}?upsert=true`;

  const upRes = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': photoFile.type,
      'x-upsert': 'true',
    },
    body: photoFile,
  });

  if (!upRes.ok) {
    const e = await upRes.json().catch(() => ({}));
    throw new Error(`Error subiendo foto a AFORE: ${e.message || upRes.statusText}`);
  }

  return `${SUPABASE_URL}/storage/v1/object/public/Fotos-Afiliados/${encodeURIComponent(path)}`;
};

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewSocio((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
  setNewSocio({
    nombre: '',
    apellido_paterno: '',
    apellido_materno: '',
    email: '',
    contrasena: '',
    telefono: '',
    direccion: '',
    cp: '',
    estatus: 'activo',
    fecha_nacimiento: '',
  });

  // 🔹 Limpiar referencia personal
  setReferencia({
    nombre: '',
    apellido_paterno: '',
    apellido_materno: '',
    telefono: '',
    direccion: ''
  });

  // 🔹 Limpiar beneficiario
  setBeneficiario({
    nombre: '',
    apellido_paterno: '',
    apellido_materno: '',
    telefono: '',
    direccion: ''
  });

  setBeneficiarioFoto(null);
  setBeneficiarioDocumento(null);

  // 🔹 Limpiar referencia bancaria
  setReferenciaBancaria({
    entidad_bancaria: '',
    banco_otro: '',
    titular_cuenta: '',
    numero_cuenta: '',
    cuenta_clave: '',
    pais: 'México'
  });

  // 🔹 Limpiar pago afiliación
  setMontoAfiliacion('');
  setErrorMonto('');

  // 🔹 Reset ahorro retiro
  setAhorroRetiro(false);

  // 🔹 Reset foto socio
  setPhotoFile(null);
  setPhotoPreview('');
  setPhotoError('');

  setEditingSocio(null);
  setShowForm(false);
};

  const handleAddOrUpdateSocio = async (e) => {
  e.preventDefault();
  setError(null);

  const required = ['nombre', 'apellido_paterno', 'apellido_materno', 'email', 'contrasena', 'telefono', 'direccion', 'cp'];
  const missing = required.filter((k) => !`${newSocio[k]}`.trim());
  if (missing.length) {
    setError('Complete los campos obligatorios.');
    return;
  }

  if (!editingSocio) {
    if (!montoAfiliacion || parseFloat(montoAfiliacion) <= 0) {
      setErrorMonto('Debe registrar el pago de afiliación.');
      return;
    } else {
      setErrorMonto('');
    }
  }

  setSaving(true);

  try {
    let socioId;
    let socio;

    // ================= SOCIO =================
    if (editingSocio) {

      const patchBody = {
        ...newSocio,
        estatus: newSocio.estatus === 'activo',
        fecha_nacimiento: cleanDate(newSocio.fecha_nacimiento),
      };

      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/socios?id_socio=eq.${editingSocio.id_socio}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
            Prefer: 'return=representation',
          },
          body: JSON.stringify(patchBody),
        }
      );

      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.message || res.statusText);
      }

      const updated = await res.json();
      socio = updated[0];
      socioId = socio.id_socio;

      setSociosList(prev =>
        prev.map(s => (s.id_socio === socioId ? socio : s))
      );

    } else {

      const bodyToSend = {
        ...newSocio,
        estatus: newSocio.estatus === 'activo',
        fecha_nacimiento: cleanDate(newSocio.fecha_nacimiento),
      };

      const res = await fetch(`${SUPABASE_URL}/rest/v1/socios`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          Prefer: 'return=representation',
        },
        body: JSON.stringify(bodyToSend),
      });

      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.message || res.statusText);
      }

      const inserted = await res.json();
      socio = inserted[0];
      socioId = socio.id_socio;

      setSociosList(prev => [...prev, socio]);
    }
// ================= REFERENCIA PERSONAL =================
if (referencia.nombre.trim() !== '') {

  if (referenciaId) {

    // ACTUALIZAR por ID real
    await fetch(
      `${SUPABASE_URL}/rest/v1/refs_fondo?id_referencia=eq.${referenciaId}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          Prefer: 'return=representation'
        },
        body: JSON.stringify({
          ...referencia
        }),
      }
    );

  } else {

    // INSERTAR nuevo
    const resRef = await fetch(`${SUPABASE_URL}/rest/v1/refs_fondo`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        Prefer: 'return=representation'
      },
      body: JSON.stringify({
        id_socio: socioId,
        ...referencia
      }),
    });

    const insertedRef = await resRef.json();
    if (insertedRef?.length > 0) {
      setReferenciaId(insertedRef[0].id_referencia);
    }
  }
}
    // ================= BENEFICIARIO =================
    if (beneficiario.nombre.trim() !== '') {

      const checkRes = await fetch(
        `${SUPABASE_URL}/rest/v1/beneficiarios_fondo?id_socio=eq.${socioId}`,
        {
          headers: {
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          },
        }
      );

      const existing = await checkRes.json();

      if (existing && existing.length > 0) {

        await fetch(
          `${SUPABASE_URL}/rest/v1/beneficiarios_fondo?id_socio=eq.${socioId}`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              apikey: SUPABASE_ANON_KEY,
              Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
            },
            body: JSON.stringify({
              ...beneficiario
            }),
          }
        );

      } else {

        await fetch(`${SUPABASE_URL}/rest/v1/beneficiarios_fondo`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            id_socio: socioId,
            ...beneficiario
          }),
        });

      }
    }

    resetForm();

  } catch (err) {
    setError(err.message);
  } finally {
    setSaving(false);
  }
};

 const handleEditClick = (socio) => {
  setEditingSocio(socio);
  setNewSocio({
    nombre: socio.nombre || '',
    apellido_paterno: socio.apellido_paterno || '',
    apellido_materno: socio.apellido_materno || '',
    email: socio.email || '',
    contrasena: socio.contrasena || '',
    telefono: socio.telefono || '',
    direccion: socio.direccion || '',
    cp: socio.cp || '',
    estatus: socio.estatus ? 'activo' : 'inactivo',
    fecha_nacimiento: toDateInput(socio.fecha_nacimiento) || '',
  });

  setPhotoFile(null);
  setPhotoPreview(socio.foto_url || '');
  setPhotoError('');
  setShowForm(true);

  // REFERENCIAS
  fetch(`${SUPABASE_URL}/rest/v1/refs_fondo?id_socio=eq.${socio.id_socio}`, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
  })
    .then(res => res.json())
   .then(data => {
  if (data?.length > 0) {
    setReferencia(data[0]);
    setReferenciaId(data[0].id_referencia);
  } else {
    setReferenciaId(null);
  }
});

  // BENEFICIARIO
  fetch(`${SUPABASE_URL}/rest/v1/beneficiarios_fondo?id_socio=eq.${socio.id_socio}`, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
  })
    .then(res => res.json())
    .then(data => {
      if (data?.length > 0) setBeneficiario(data[0]);
    });

  // BANCO
  fetch(`${SUPABASE_URL}/rest/v1/referencias_bancarias?id_socio=eq.${socio.id_socio}`, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
  })
    .then(res => res.json())
    .then(data => {
      if (data?.length > 0) setReferenciaBancaria(data[0]);
    });

};   // ✅ AQUÍ TERMINA


 /** Ficha */
const openFicha = async (socio) => {

  setSocioFicha({ ...socio }); // importante: nuevo objeto
  setShowFicha(true);

  try {
    const { data: refs } = await supabase
      .from("refs_fondo")
      .select("*")
      .eq("id_socio", socio.id_socio);

    const { data: benef } = await supabase
      .from("beneficiarios_fondo")
      .select("*")
      .eq("id_socio", socio.id_socio);

    const { data: bancos } = await supabase
      .from("referencias_bancarias")
      .select("*")
      .eq("id_socio", socio.id_socio);

    setRefsFicha(refs || []);
    setBenefFicha(benef || []);
    setBancoFicha(bancos || []);

  } catch (error) {
    console.error("ERROR OPEN FICHA:", error);
  }
};

  const closeFicha = () => {
  setShowFicha(false);
  setSocioFicha(null);
  setRefsFicha([]);
  setBenefFicha([]);
  setBancoFicha([]);
};
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Gestión de Socios</h2>
        </div>
        <button
          onClick={() => {
            if (showForm) {
              resetForm();
            } else {
              setShowForm(true);
              setEditingSocio(null);
              setNewSocio({
                nombre: '',
                apellido_paterno: '',
                apellido_materno: '',
                email: '',
                contrasena: '',
                telefono: '',
                direccion: '',
                cp: '',
                estatus: 'activo',
                fecha_nacimiento: '',
              });
              setPhotoFile(null);
              setPhotoPreview('');
              setPhotoError('');
            }
          }}
          className="px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors font-medium"
        >
          {showForm ? 'Cancelar' : 'Nuevo Socio'}
        </button>
      </div>

      {/* Formulario */}
      {showForm && (
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 mb-6">
          <h3 className="text-xl font-semibold text-slate-900 mb-4">
            {editingSocio ? 'Editar Socio' : 'Registrar Nuevo Socio'}
          </h3>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleAddOrUpdateSocio} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {editingSocio && (
              <div className="col-span-full">
                <label className="block text-sm font-medium text-slate-700 mb-1">ID Socio</label>
                <input
                  type="text"
                  value={editingSocio.id_socio}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-slate-100"
                  disabled
                />
              </div>
            )}

            {/* Datos */}
            <input
              type="text"
              name="nombre"
              value={newSocio.nombre}
              onChange={handleInputChange}
              placeholder="Nombre *"
              className="px-4 py-2 border border-slate-200 rounded-lg"
              required
            />
            <input
              type="text"
              name="apellido_paterno"
              value={newSocio.apellido_paterno}
              onChange={handleInputChange}
              placeholder="Apellido Paterno *"
              className="px-4 py-2 border border-slate-200 rounded-lg"
              required
            />
            <input
              type="text"
              name="apellido_materno"
              value={newSocio.apellido_materno}
              onChange={handleInputChange}
              placeholder="Apellido Materno *"
              className="px-4 py-2 border border-slate-200 rounded-lg"
              required
            />
            <input
              type="email"
              name="email"
              value={newSocio.email}
              onChange={handleInputChange}
              placeholder="Correo electrónico *"
              className="px-4 py-2 border border-slate-200 rounded-lg"
              required
            />
            <input
              type="password"
              name="contrasena"
              value={newSocio.contrasena}
              onChange={handleInputChange}
              placeholder="Contraseña *"
              className="px-4 py-2 border border-slate-200 rounded-lg"
              required
            />
           <input
  type="tel"
  inputMode="numeric"
  pattern="[0-9]*"
  name="telefono"
  value={newSocio.telefono}
  onChange={(e) =>
    setNewSocio((prev) => ({ ...prev, telefono: onlyDigitsMax(e.target.value, 15) }))
  }
  placeholder="Teléfono *"
  className="px-4 py-2 border border-slate-200 rounded-lg"
  required
/>

            <input
              type="text"
              name="direccion"
              value={newSocio.direccion}
              onChange={handleInputChange}
              placeholder="Dirección *"
              className="px-4 py-2 border border-slate-200 rounded-lg"
              required
            />
            <input
  type="tel"
  inputMode="numeric"
  pattern="[0-9]*"
  name="cp"
  value={newSocio.cp}
  onChange={(e) =>
    setNewSocio((prev) => ({ ...prev, cp: onlyDigitsMax(e.target.value, 5) }))
  }
  placeholder="Código Postal *"
  className="px-4 py-2 border border-slate-200 rounded-lg"
  required
/>


            {/* Estatus */}
            <select
              name="estatus"
              value={newSocio.estatus}
              onChange={handleInputChange}
              className="px-4 py-2 border border-slate-200 rounded-lg"
            >
              <option value="activo">Activo</option>
              <option value="inactivo">Inactivo</option>
            </select>

            {/* Fecha de nacimiento */}
            <div className="col-span-full">
              <label className="block text-sm font-medium text-slate-700 mb-1">Fecha de nacimiento</label>
              <input
                type="date"
                name="fecha_nacimiento"
                value={newSocio.fecha_nacimiento}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg"
              />
              <p className="text-xs text-slate-500 mt-1">Opcional</p>
            </div>

{/* Ahorro para el retiro */}
<div className="col-span-full mt-4">
  <label className="block text-sm font-medium text-slate-700 mb-2">
    ¿Ahorro para el retiro?
  </label>
  <div className="flex gap-6">
    <label>
      <input
        type="radio"
        checked={ahorroRetiro}
        onChange={() => setAhorroRetiro(true)}
      />{" "}
      Sí
    </label>
    <label>
      <input
        type="radio"
        checked={!ahorroRetiro}
        onChange={() => setAhorroRetiro(false)}
      />{" "}
      No
    </label>
  </div>
</div>

{/* Pago Afiliación */}
{!editingSocio && (
  <div className="col-span-full mt-4">
    <label className="block text-sm font-medium text-slate-700 mb-2">
      Pago Afiliación
    </label>

    <input
      type="number"
      step="0.01"
      value={montoAfiliacion}
      onChange={(e) => {
        setMontoAfiliacion(e.target.value);
        if (errorMonto) setErrorMonto('');
      }}
      placeholder="Ingrese monto pagado"
      className={`w-full px-4 py-2 border rounded-lg ${
        errorMonto ? 'border-red-500 focus:ring-red-500' : 'border-slate-200'
      }`}
      required
    />

    {errorMonto && (
      <p className="text-sm text-red-600 mt-1">
        {errorMonto}
      </p>
    )}
  </div>
)}


{/* Subida de foto */}
<div className="col-span-full">
  <label className="block text-sm font-medium text-slate-700 mb-1">
    Foto del socio (JPG o PNG)
  </label>

  <div
    ref={dropRef}
    onDragOver={handleDragOver}
    onDragLeave={handleDragLeave}
    onDrop={handleDrop}
    className="border-2 border-dashed border-slate-300 rounded-xl p-4 flex flex-col md:flex-row items-center gap-4"
  >
    <img
      src={photoPreview || avatarFallback(newSocio)}
      alt="preview"
      className="w-20 h-20 rounded-full object-cover border"
    />
    <div className="flex-1 text-slate-600">
      <p className="font-medium">Arrastra y suelta la foto aquí</p>
      <p className="text-sm">o</p>
      <button
        type="button"
        onClick={handleChooseFile}
        className="mt-2 px-3 py-1.5 bg-slate-800 text-white rounded-lg hover:bg-slate-900"
      >
        Elegir archivo
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg"
        className="hidden"
        onChange={handleFileChange}
      />
      {photoError && <p className="text-sm text-red-600 mt-2">{photoError}</p>}
      {photoUploading && <p className="text-sm text-slate-500 mt-2">Subiendo foto…</p>}
    </div>
  </div>
</div>

{/* ================= REFERENCIAS PERSONALES ================= */}
<div className="col-span-full border-t-2 border-blue-600 pt-6 mt-6">
  <h4 className="font-semibold text-slate-800 mb-4">
    Referencias Personales
  </h4>
</div>

<input
  type="text"
  placeholder="Nombre"
  className="px-4 py-2 border border-slate-200 rounded-lg"
  value={referencia.nombre}
  onChange={(e) => setReferencia({ ...referencia, nombre: e.target.value })}
/>

<input
  type="text"
  placeholder="Apellido Paterno"
  className="px-4 py-2 border border-slate-200 rounded-lg"
  value={referencia.apellido_paterno}
  onChange={(e) => setReferencia({ ...referencia, apellido_paterno: e.target.value })}
/>

<input
  type="text"
  placeholder="Apellido Materno"
  className="px-4 py-2 border border-slate-200 rounded-lg"
  value={referencia.apellido_materno}
  onChange={(e) => setReferencia({ ...referencia, apellido_materno: e.target.value })}
/>

<input
  type="tel"
  inputMode="numeric"
  pattern="[0-9]*"
  placeholder="Teléfono"
  className="px-4 py-2 border border-slate-200 rounded-lg"
  value={referencia.telefono}
  onChange={(e) =>
    setReferencia({ ...referencia, telefono: onlyDigitsMax(e.target.value, 15) })
  }
/>


<input
  type="text"
  placeholder="Dirección"
  className="col-span-full px-4 py-2 border border-slate-200 rounded-lg"
  value={referencia.direccion}
  onChange={(e) => setReferencia({ ...referencia, direccion: e.target.value })}
/>

{/* ================= BENEFICIARIO ================= */}
<div className="col-span-full border-t-2 border-blue-600 pt-6 mt-6">
  <h4 className="font-semibold text-slate-800 mb-4">
    Beneficiario
  </h4>
</div>

<input
  type="text"
  placeholder="Nombre"
  className="px-4 py-2 border border-slate-200 rounded-lg"
  value={beneficiario.nombre}
  onChange={(e) => setBeneficiario({ ...beneficiario, nombre: e.target.value })}
/>

<input
  type="text"
  placeholder="Apellido Paterno"
  className="px-4 py-2 border border-slate-200 rounded-lg"
  value={beneficiario.apellido_paterno}
  onChange={(e) => setBeneficiario({ ...beneficiario, apellido_paterno: e.target.value })}
/>

<input
  type="text"
  placeholder="Apellido Materno"
  className="px-4 py-2 border border-slate-200 rounded-lg"
  value={beneficiario.apellido_materno}
  onChange={(e) => setBeneficiario({ ...beneficiario, apellido_materno: e.target.value })}
/>

<input
  type="tel"
  inputMode="numeric"
  pattern="[0-9]*"
  placeholder="Teléfono"
  className="px-4 py-2 border border-slate-200 rounded-lg"
  value={beneficiario.telefono}
  onChange={(e) =>
    setBeneficiario({ ...beneficiario, telefono: onlyDigitsMax(e.target.value, 15) })
  }
/>

<input
  type="text"
  placeholder="Dirección"
  className="col-span-full px-4 py-2 border border-slate-200 rounded-lg"
  value={beneficiario.direccion}
  onChange={(e) => setBeneficiario({ ...beneficiario, direccion: e.target.value })}
/>

<div className="col-span-full">
  <label className="block text-sm font-medium text-slate-700 mb-1">
    Foto beneficiario
  </label>
  <input
    type="file"
    accept="image/png,image/jpeg"
    onChange={(e) => setBeneficiarioFoto(e.target.files[0])}
  />
</div>

<div className="col-span-full">
  <label className="block text-sm font-medium text-slate-700 mb-1">
    Documento beneficiario (PDF)
  </label>
  <input
    type="file"
    accept="application/pdf"
    onChange={(e) => setBeneficiarioDocumento(e.target.files[0])}
  />
</div>

      {/* ================= REFERENCIAS BANCARIAS ================= */}
<div className="col-span-full border-t-2 border-blue-600 pt-6 mt-6">
  <h4 className="font-semibold text-slate-800 mb-4">
    Referencias Bancarias
  </h4>
</div>
<select
  className="col-span-full px-4 py-2 border border-slate-200 rounded-lg"
  value={referenciaBancaria.entidad_bancaria}
  onChange={(e) => {
    const value = e.target.value;

    if (value === "OTRO") {
      setShowBancoModal(true);
      return;
    }

    setReferenciaBancaria((prev) => ({
      ...prev,
      entidad_bancaria: value,
      pais: "México",
      banco_otro: ""
    }));
  }}
>
  <option value="">Seleccione entidad bancaria</option>

  <option value="BBVA México">BBVA México</option>
  <option value="Banco Santander México">Banco Santander México</option>
  <option value="Banco Mercantil del Norte (Banorte)">Banco Mercantil del Norte (Banorte)</option>
  <option value="Banco Nacional de México (Citibanamex)">Banco Nacional de México (Citibanamex)</option>
  <option value="HSBC México">HSBC México</option>
  <option value="Scotiabank Inverlat">Scotiabank Inverlat</option>
  <option value="Banco Inbursa">Banco Inbursa</option>
  <option value="Banco Azteca">Banco Azteca</option>
  <option value="BanCoppel">BanCoppel</option>
  <option value="Banco del Bajío">Banco del Bajío</option>
  <option value="Banca Afirme">Banca Afirme</option>
  <option value="Banca Mifel">Banca Mifel</option>
  <option value="Banco Ve por Más (BX+)">Banco Ve por Más (BX+)</option>
  <option value="Banco Monex">Banco Monex</option>
  <option value="Banco Actinver">Banco Actinver</option>
  <option value="Intercam Banco">Intercam Banco</option>
  <option value="Banco Multiva">Banco Multiva</option>
  <option value="Banco Sabadell">Banco Sabadell</option>
  <option value="CIBanco">CIBanco</option>
  <option value="Banco Base">Banco Base</option>
  <option value="Nubank (Nu México)">Nubank (Nu México)</option>
  <option value="Banco Bineo">Banco Bineo</option>
  <option value="SPIN By OXXO">SPIN By OXXO</option>

  <option value="OTRO">Otro</option>
</select>


<input
  type="text"
  placeholder="Titular de la cuenta"
  className="px-4 py-2 border border-slate-200 rounded-lg"
  value={referenciaBancaria.titular_cuenta}
  onChange={(e) =>
    setReferenciaBancaria({
      ...referenciaBancaria,
      titular_cuenta: e.target.value
    })
  }
/>

<input
  type="tel"
  inputMode="numeric"
  pattern="[0-9]*"
  placeholder="Número de cuenta"
  className="px-4 py-2 border border-slate-200 rounded-lg"
  value={referenciaBancaria.numero_cuenta}
  onChange={(e) =>
    setReferenciaBancaria({
      ...referenciaBancaria,
      numero_cuenta: onlyDigitsMax(e.target.value, 20),
    })
  }
/>


<input
  type="tel"
  inputMode="numeric"
  pattern="[0-9]*"
  placeholder="Cuenta Clave"
  className="px-4 py-2 border border-slate-200 rounded-lg"
  value={referenciaBancaria.cuenta_clave}
  onChange={(e) =>
    setReferenciaBancaria({
      ...referenciaBancaria,
      cuenta_clave: onlyDigitsMax(e.target.value, 18),
    })
  }
/>


      
<button
  type="button"
  onClick={() => setShowConfirmRegistro(true)}
  disabled={saving}
  className="col-span-full px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors font-medium"
>
  {saving
    ? (editingSocio ? 'Actualizando…' : 'Registrando…')
    : (editingSocio ? 'Actualizar Socio' : 'Registrar Socio')}
</button>
          </form>
        </div>
      )}



      {/* Tabla principal */}
      {loading && <p className="text-center text-slate-600">Cargando socios...</p>}
      {error && !loading && !showForm && (
        <p className="text-center text-red-500">Error: {error}</p>
      )}

      {!loading && !error && sociosList.length === 0 && (
        <p className="text-center text-slate-600">No hay socios registrados.</p>
      )}

      {!loading && !error && sociosList.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h3 className="text-xl font-semibold text-slate-900 mb-4">Todos los Socios</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Foto</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">ID</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Nombre Completo</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Email</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Teléfono</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Estatus</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {sociosList.map((socio) => (
                  <tr
                    key={socio.id_socio}
                    className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer"
                    onClick={() => openFicha(socio)}
                  >
                    <td className="py-3 px-4">
                      <img
                        src={socio.foto_url || avatarFallback(socio)}
                        alt="avatar"
                        className="w-10 h-10 rounded-full object-cover border"
                      />
                    </td>
                    <td className="py-3 px-4 text-slate-700">{socio.id_socio}</td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-900">
                        {socio.nombre} {socio.apellido_paterno} {socio.apellido_materno}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-700">{socio.email}</td>
                    <td className="py-3 px-4 text-slate-700">{socio.telefono}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          socio.estatus ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {socio.estatus ? 'activo' : 'inactivo'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditClick(socio);
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteClick(socio);
                          }}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Eliminar"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {/* Modal Confirmar Registro */}
      {showConfirmRegistro && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full text-center">
            <h3 className="text-lg font-bold text-slate-900 mb-4">
              ¿La información capturada es correcta?
            </h3>

            <div className="flex justify-center gap-4">
              <button
                onClick={() => {
                  setShowConfirmRegistro(false);
                  document.querySelector('form')?.dispatchEvent(
                    new Event('submit', { cancelable: true, bubbles: true })
                  );
                }}
                className="px-5 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium"
              >
                Sí
              </button>

              <button
                onClick={() => setShowConfirmRegistro(false)}
                className="px-5 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 font-medium"
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}
{/* Modal Banco Otro */}
{showBancoModal && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
    <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full">
      <h3 className="text-lg font-bold text-slate-900 mb-4">
        Ingresa el nombre del banco
      </h3>

      <input
        type="text"
        placeholder="Nombre del banco"
        className="w-full px-4 py-2 border border-slate-200 rounded-lg mb-3"
        value={bancoPersonalizado.nombre}
        onChange={(e) =>
          setBancoPersonalizado((prev) => ({ ...prev, nombre: e.target.value }))
        }
      />

      <input
        type="text"
        placeholder="País"
        className="w-full px-4 py-2 border border-slate-200 rounded-lg mb-4"
        value={bancoPersonalizado.pais}
        onChange={(e) =>
          setBancoPersonalizado((prev) => ({ ...prev, pais: e.target.value }))
        }
      />

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={() => {
            setShowBancoModal(false);
            setBancoPersonalizado({ nombre: "", pais: "" });
            // Regresar select a vacío para evitar que se quede en "OTRO" sin datos
            setReferenciaBancaria((prev) => ({
              ...prev,
              entidad_bancaria: "",
              banco_otro: "",
              pais: "México",
            }));
          }}
          className="px-4 py-2 bg-slate-200 text-slate-800 rounded-xl hover:bg-slate-300 font-medium"
        >
          Cancelar
        </button>

        <button
          type="button"
          onClick={() => {
            const nombre = (bancoPersonalizado.nombre || "").trim();
            const pais = (bancoPersonalizado.pais || "").trim();

            if (!nombre || !pais) return;

            setReferenciaBancaria((prev) => ({
              ...prev,
              entidad_bancaria: "OTRO",
              banco_otro: nombre,
              pais,
            }));

            setShowBancoModal(false);
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium"
        >
          Guardar
        </button>
      </div>
    </div>
  </div>
)}

      {/* Modal confirmar eliminación */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full text-center">
            <h3 className="text-xl font-bold text-slate-900 mb-4">Confirmar Eliminación</h3>
            <p className="text-slate-700 mb-6">
              ¿Estás seguro de eliminar al socio <strong>{socioToDelete?.nombre} {socioToDelete?.apellido_paterno}</strong>?
              Esta acción es irreversible.
            </p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={cancelDelete}
                className="px-5 py-2 bg-slate-200 text-slate-800 rounded-xl hover:bg-slate-300 transition-colors font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                className="px-5 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium"
                disabled={loading}
              >
                {loading ? 'Eliminando…' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
     {/* ================= FICHA DEL SOCIO ================= */}
{showFicha && socioFicha && (

        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-4xl w-full relative max-h-[90vh] overflow-y-auto text-base">

 
            <button
              onClick={closeFicha}
              className="absolute top-3 right-3 text-slate-500 hover:text-slate-800"
            >
              ✕
            </button>

            <div className="flex items-center gap-4 mb-6">
              <img
                src={socioFicha.foto_url || avatarFallback(socioFicha)}
                alt="avatar"
                className="w-20 h-20 rounded-full object-cover border"
              />
              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  {socioFicha.nombre} {socioFicha.apellido_paterno} {socioFicha.apellido_materno}
                </h3>
                <p className="text-slate-600">{socioFicha.email}</p>
              </div>
            </div>

          <div className="grid grid-cols-2 gap-6 text-lg">

  <div>
    <span className="font-semibold">ID Socio:</span>
    <p>{socioFicha.id_socio}</p>
  </div>

  <div>
  <span className="font-semibold">Miembro desde:</span>
 <p>{fmtFecha(socioFicha?.miembro_desde)}</p>


</div>



  <div>
    <span className="font-semibold">Teléfono:</span>
    <p>{socioFicha.telefono}</p>
  </div>

  <div>
    <span className="font-semibold">Código Postal:</span>
    <p>{socioFicha.cp}</p>
  </div>

  <div className="col-span-full">
    <span className="font-semibold">Dirección:</span>
    <p>{socioFicha.direccion}</p>
  </div>

  <div>
    <span className="font-semibold">Fecha de nacimiento:</span>
    <p>{fmtFecha(socioFicha?.fecha_nacimiento)}</p>


  </div>

  <div>
    <span className="font-semibold">Estatus:</span>
    <p>{socioFicha.estatus ? 'Activo' : 'Inactivo'}</p>
  </div>

</div>

{/* REFERENCIAS PERSONALES */}
{refsFicha.length > 0 && (
  <div className="mt-6">
   <h4 className="font-semibold text-slate-800 text-lg mb-3 mt-6">Referencias Personales</h4>
    {refsFicha.map((r) => (
      <div key={r.id_referencia} className="mb-3">
        <p><strong>Nombre:</strong> {r.nombre} {r.apellido_paterno} {r.apellido_materno}</p>
        <p><strong>Teléfono:</strong> {r.telefono}</p>
        <p><strong>Dirección:</strong> {r.direccion}</p>
      </div>
    ))}
  </div>
)}

{/* BENEFICIARIO */}
{benefFicha.length > 0 && (
  <div className="mt-6">
    <h4 className="font-semibold text-slate-800 text-lg mb-3 mt-6">Beneficiario</h4>
    {benefFicha.map((b) => (
      <div key={b.id_beneficiario} className="mb-3">
        <p><strong>Nombre:</strong> {b.nombre} {b.apellido_paterno} {b.apellido_materno}</p>
        <p><strong>Teléfono:</strong> {b.telefono}</p>
        <p><strong>Dirección:</strong> {b.direccion}</p>

        {b.foto_url && (
          <a href={b.foto_url} target="_blank" rel="noreferrer"
            className="inline-block mt-2 mr-2 px-3 py-1 bg-blue-600 text-white rounded-lg text-xs">
            Ver Foto
          </a>
        )}

        {b.documentos_url && (
          <a href={b.documentos_url} target="_blank" rel="noreferrer"
            className="inline-block mt-2 px-3 py-1 bg-emerald-600 text-white rounded-lg text-xs">
            Ver Documento
          </a>
        )}
      </div>
    ))}
  </div>
)}

{/* REFERENCIAS BANCARIAS */}
{bancoFicha.length > 0 && (
  <div className="mt-6">
    <h4 className="font-semibold text-slate-800 text-lg mb-3 mt-6">
      Referencias Bancarias
    </h4>

    {bancoFicha.map((b) => (
      <div key={b.id_referencia_bancaria} className="mb-3">
        <p><strong>Entidad:</strong> {b.entidad_bancaria}</p>
        <p><strong>País:</strong> {b.pais}</p>
        <p><strong>Titular:</strong> {b.titular_cuenta}</p>
        <p><strong>Número de cuenta:</strong> {b.numero_cuenta}</p>
        <p><strong>Cuenta CLABE:</strong> {b.cuenta_clave}</p>
      </div>
    ))}
  </div>
)}

                    </div>
        </div>
      )}

    </div>

  );
};

export default SociosModule;


