import React, { useState, useEffect, useRef } from 'react';

const SUPABASE_URL = 'https://ubfkhtkmlvutwdivmoff.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InViZmtodGttbHZ1dHdkaXZtb2ZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4MTc5NTUsImV4cCI6MjA2NjM5Mzk1NX0.c0iRma-dnlL29OR3ffq34nmZuj_ViApBTMG-6PEX_B4';

/** Util para avatar de respaldo */
const avatarFallback = (s) => {
  const name = `${s?.nombre || ''} ${s?.apellido_paterno || ''}`.trim() || 'Socio';
  const bg = '0ea15a'; // tu verde
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${bg}&color=fff&size=128`;
};

// 👉 Helper: fecha bonita en español
const fmtFecha = (d) => {
  if (!d) return '-';
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return '-';
  return dt.toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' });
};

// 👉 Helper para inputs tipo date
const toDateInput = (d) => {
  if (!d) return '';
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return '';
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  const day = String(dt.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

// 👉 Normaliza fechas vacías a null
const cleanDate = (v) => (v && String(v).trim() ? v : null);

const SociosModule = () => {
  const [sociosList, setSociosList] = useState([]);
  const [showForm, setShowForm] = useState(false);
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
    // 👇 mantenemos fecha_nacimiento (agregada previamente)
    fecha_nacimiento: '',
    // NOTA: no tocamos miembro_desde en el form (no lo pediste). Solo lo mostramos en la ficha.
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

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
      const path = `socio_${socioId}.${ext}`; // archivo por id, se puede sobrescribir
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
    setEditingSocio(null);
    setPhotoFile(null);
    setPhotoPreview('');
    setPhotoError('');
    setShowForm(false);
  };

  const handleAddOrUpdateSocio = async (e) => {
    e.preventDefault();
    setError(null);

    // Validaciones mínimas (fecha_nacimiento NO es obligatoria)
    const required = ['nombre', 'apellido_paterno', 'apellido_materno', 'email', 'contrasena', 'telefono', 'direccion', 'cp'];
    const missing = required.filter((k) => !`${newSocio[k]}`.trim());
    if (missing.length) {
      setError('Complete los campos obligatorios.');
      return;
    }

    setSaving(true);
    try {
      let socioId;

      if (editingSocio) {
        // Update principal
        const patchBody = {
          ...newSocio,
          estatus: newSocio.estatus === 'activo',
          fecha_nacimiento: cleanDate(newSocio.fecha_nacimiento), // normaliza
        };

        const res = await fetch(`${SUPABASE_URL}/rest/v1/socios?id_socio=eq.${editingSocio.id_socio}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Prefer': 'return=representation',
          },
          body: JSON.stringify(patchBody),
        });
        if (!res.ok) {
          const e = await res.json().catch(() => ({}));
          throw new Error(`Error al actualizar socio: ${res.statusText} - ${e.message || ''}`);
        }
        const updated = await res.json();
        const socio = updated[0];
        socioId = socio.id_socio;

        // Si hay foto nueva, subir y guardar URL
        if (photoFile) {
          const url = await uploadPhotoToSupabase(socioId);
          if (url) {
            const r2 = await fetch(`${SUPABASE_URL}/rest/v1/socios?id_socio=eq.${socioId}`, {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Prefer': 'return=representation',
              },
              body: JSON.stringify({ foto_url: url }),
            });
            if (r2.ok) {
              const j2 = await r2.json();
              setSociosList((prev) => prev.map((s) => (s.id_socio === socioId ? j2[0] : s)));
            }
          }
        } else {
          // Actualiza en memoria sin tocar foto
          setSociosList((prev) => prev.map((s) => (s.id_socio === socioId ? socio : s)));
        }
      } else {
        // Crear socio (sin foto_url)
        const bodyToSend = {
          ...newSocio,
          estatus: newSocio.estatus === 'activo',
          fecha_nacimiento: cleanDate(newSocio.fecha_nacimiento),
        };
        const res = await fetch(`${SUPABASE_URL}/rest/v1/socios`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Prefer': 'return=representation',
          },
          body: JSON.stringify(bodyToSend),
        });
        if (!res.ok) {
          const e = await res.json().catch(() => ({}));
          if (e?.message?.toLowerCase?.().includes('duplicate') || e?.message?.includes('unique')) {
            throw new Error('El correo ya existe, por favor use otro.');
          }
          throw new Error(`Error al registrar socio: ${res.statusText} - ${e.message || ''}`);
        }
        const inserted = await res.json();
        const socio = inserted[0];
        const socioIdNew = socio.id_socio;

        // Subir foto si adjuntó
        if (photoFile) {
          const url = await uploadPhotoToSupabase(socioIdNew);
          if (url) {
            await fetch(`${SUPABASE_URL}/rest/v1/socios?id_socio=eq.${socioIdNew}`, {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Prefer': 'return=representation',
              },
              body: JSON.stringify({ foto_url: url }),
            });
            await fetchSocios();
          } else {
            setSociosList((prev) => [...prev, socio]);
          }
        } else {
          setSociosList((prev) => [...prev, socio]);
        }

        // Crea usuario de sistema
        const usernameFromEmail = newSocio.email.split('@')[0];
        const newUserSystem = {
          usuario: usernameFromEmail,
          email: newSocio.email,
          contrasena: newSocio.contrasena,
          rol: 'usuario',
          id_socio: socioIdNew,
        };
        const sysRes = await fetch(`${SUPABASE_URL}/rest/v1/usuarios_sistema`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Prefer': 'return=representation',
          },
          body: JSON.stringify(newUserSystem),
        });
        if (!sysRes.ok) {
          const e = await sysRes.json().catch(() => ({}));
          console.warn('Usuario de sistema no creado:', e?.message || sysRes.statusText);
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
  };

  const handleDeleteClick = (socio) => {
    setSocioToDelete(socio);
    setShowConfirmModal(true);
  };

  const confirmDelete = async () => {
    setShowConfirmModal(false);
    setLoading(true);
    setError(null);
    try {
      const socioId = socioToDelete.id_socio;

      await fetch(`${SUPABASE_URL}/rest/v1/usuarios_sistema?id_socio=eq.${socioId}`, {
        method: 'DELETE',
        headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` },
      });

      await fetch(`${SUPABASE_URL}/rest/v1/ahorros?id_socio=eq.${socioId}`, {
        method: 'DELETE',
        headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` },
      });

      await fetch(`${SUPABASE_URL}/rest/v1/prestamos?id_socio=eq.${socioId}`, {
        method: 'DELETE',
        headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` },
      });

      const response = await fetch(`${SUPABASE_URL}/rest/v1/socios?id_socio=eq.${socioId}`, {
        method: 'DELETE',
        headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` },
      });

      if (!response.ok) {
        const e = await response.json().catch(() => ({}));
        throw new Error(`Error al eliminar socio: ${response.statusText} - ${e.message || ''}`);
      }
      setSociosList((prev) => prev.filter((s) => s.id_socio !== socioId));
      setSocioToDelete(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const cancelDelete = () => {
    setShowConfirmModal(false);
    setSocioToDelete(null);
  };

  /** Ficha */
  const openFicha = (socio) => {
    setSocioFicha(socio);
    setShowFicha(true);
  };
  const closeFicha = () => {
    setShowFicha(false);
    setSocioFicha(null);
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
              type="text"
              name="telefono"
              value={newSocio.telefono}
              onChange={handleInputChange}
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
              type="text"
              name="cp"
              value={newSocio.cp}
              onChange={handleInputChange}
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

            {/* Subida de foto */}
            <div className="col-span-full">
              <label className="block text-sm font-medium text-slate-700 mb-1">Foto del socio (JPG o PNG)</label>

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

            <button
              type="submit"
              disabled={saving}
              className="col-span-full px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors font-medium"
            >
              {saving ? (editingSocio ? 'Actualizando…' : 'Registrando…') : (editingSocio ? 'Actualizar Socio' : 'Registrar Socio')}
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

      {/* Modal Ficha del socio — muestra Fecha de nacimiento y Miembro desde */}
      {showFicha && socioFicha && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-lg">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-xl font-bold text-slate-900">Ficha del socio</h3>
              <button onClick={closeFicha} className="text-slate-500 hover:text-slate-900">Cerrar</button>
            </div>

            <div className="flex items-center space-x-4 mb-4">
              <img
                src={socioFicha.foto_url || avatarFallback(socioFicha)}
                alt="foto"
                className="w-20 h-20 rounded-xl object-cover border"
              />
              <div>
                <div className="text-sm text-slate-500">ID Socio</div>
                <div className="text-lg font-semibold">{socioFicha.id_socio}</div>
                <div className="text-slate-900 font-medium">
                  {socioFicha.nombre} {socioFicha.apellido_paterno} {socioFicha.apellido_materno}
                </div>
                <div className="text-sm text-slate-600 mt-1">
                  Teléfono:{' '}
                  <span className="font-medium text-slate-900">
                    {socioFicha.telefono || '-'}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 bg-slate-50 rounded-lg">
                <div className="text-xs text-slate-500">Teléfono</div>
                <div className="font-medium">{socioFicha.telefono || '-'}</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <div className="text-xs text-slate-500">Código Postal</div>
                <div className="font-medium">{socioFicha.cp || '-'}</div>
              </div>

              {/* Fecha de nacimiento */}
              <div className="p-3 bg-slate-50 rounded-lg">
                <div className="text-xs text-slate-500">Fecha de nacimiento</div>
                <div className="font-medium">{fmtFecha(socioFicha.fecha_nacimiento)}</div>
              </div>

              {/* Miembro desde */}
              <div className="p-3 bg-slate-50 rounded-lg">
                <div className="text-xs text-slate-500">Miembro desde</div>
                <div className="font-medium">{fmtFecha(socioFicha.miembro_desde)}</div>
              </div>

              <div className="md:col-span-2 p-3 bg-slate-50 rounded-lg">
                <div className="text-xs text-slate-500">Dirección</div>
                <div className="font-medium">{socioFicha.direccion || '-'}</div>
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={closeFicha}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SociosModule;
