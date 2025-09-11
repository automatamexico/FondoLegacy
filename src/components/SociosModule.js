import React, { useState, useEffect } from 'react';

const SUPABASE_URL = 'https://ubfkhtkmlvutwdivmoff.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InViZmtodGttbHZ1dHdkaXZtb2ZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4MTc5NTUsImV4cCI6MjA2NjM5Mzk1NX0.c0iRma-dnlL29OR3ffq34nmZuj_ViApBTMG-6PEX_B4';

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
    foto_url: '' // opcional, no requerido
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState({});
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [socioToDelete, setSocioToDelete] = useState(null);

  useEffect(() => {
    fetchSocios();
  }, []);

  const fetchSocios = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/socios?select=*`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`
        }
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          `Error al cargar socios: ${response.statusText} - ${errorData.message || 'Error desconocido'}`
        );
      }
      const data = await response.json();
      setSociosList(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // -------------------------
  // Validaciones
  // -------------------------
  const isEmpty = (v) => !v || String(v).trim() === '';

  const validateForm = () => {
    const errs = {};

    if (isEmpty(newSocio.nombre)) errs.nombre = 'Campo obligatorio';
    if (isEmpty(newSocio.apellido_paterno)) errs.apellido_paterno = 'Campo obligatorio';
    if (isEmpty(newSocio.apellido_materno)) errs.apellido_materno = 'Campo obligatorio';

    if (isEmpty(newSocio.email)) {
      errs.email = 'Campo obligatorio';
    } else {
      const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newSocio.email.trim());
      if (!emailOk) errs.email = 'Correo inválido';
    }

    if (isEmpty(newSocio.contrasena)) errs.contrasena = 'Campo obligatorio';
    if (isEmpty(newSocio.telefono)) errs.telefono = 'Campo obligatorio';
    if (isEmpty(newSocio.direccion)) errs.direccion = 'Campo obligatorio';
    if (isEmpty(newSocio.cp)) errs.cp = 'Campo obligatorio';

    return errs;
  };

  // Checar duplicado de correo en socios (excluye el socio en edición)
  const checkEmailExists = async () => {
    const emailEncoded = encodeURIComponent(newSocio.email.trim());
    let url = `${SUPABASE_URL}/rest/v1/socios?select=id_socio&email=eq.${emailEncoded}`;
    if (editingSocio?.id_socio) {
      url += `&id_socio=neq.${editingSocio.id_socio}`;
    }
    const r = await fetch(url, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`
      }
    });
    if (!r.ok) {
      // en caso de error de red, no bloquear, pero registra en consola
      console.warn('No se pudo validar el email en Supabase');
      return false;
    }
    const rows = await r.json();
    return rows && rows.length > 0; // existe otro socio con ese email
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewSocio((prev) => ({ ...prev, [name]: value }));
    setValidationErrors((prev) => ({ ...prev, [name]: undefined })); // limpia error de ese campo
    setError('');
  };

  const handleAddOrUpdateSocio = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 1) Validar campos obligatorios
      const errs = validateForm();
      if (Object.keys(errs).length > 0) {
        setValidationErrors(errs);
        setError('Complete los campos obligatorios');
        setLoading(false);
        return;
      }

      // 2) Verificar correo duplicado
      const duplicated = await checkEmailExists();
      if (duplicated) {
        setValidationErrors((prev) => ({
          ...prev,
          email: 'El correo ya existe, por favor use otro'
        }));
        setError('El correo ya existe, por favor use otro');
        setLoading(false);
        return;
      }

      // preparar payload
      const socioToSend = { ...newSocio };
      socioToSend.estatus = newSocio.estatus === 'activo'; // boolean en DB

      let response;
      let addedOrUpdatedSocio;

      if (editingSocio) {
        // UPDATE
        response = await fetch(
          `${SUPABASE_URL}/rest/v1/socios?id_socio=eq.${editingSocio.id_socio}`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              apikey: SUPABASE_ANON_KEY,
              Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
              Prefer: 'return=representation'
            },
            body: JSON.stringify(socioToSend)
          }
        );
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            `Error al actualizar socio: ${response.statusText} - ${errorData.message || 'Error desconocido'}`
          );
        }
        addedOrUpdatedSocio = await response.json();
        setSociosList((prev) =>
          prev.map((s) => (s.id_socio === editingSocio.id_socio ? addedOrUpdatedSocio[0] : s))
        );
      } else {
        // INSERT
        response = await fetch(`${SUPABASE_URL}/rest/v1/socios`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
            Prefer: 'return=representation'
          },
          body: JSON.stringify(socioToSend)
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            `Error al registrar socio: ${response.statusText} - ${errorData.message || 'Error desconocido'}`
          );
        }
        addedOrUpdatedSocio = await response.json();
        const newSocioId = addedOrUpdatedSocio[0].id_socio;

        // Crear usuario del sistema (usa email+contrasena del socio)
        const usernameFromEmail = newSocio.email.split('@')[0];
        const newUserSystem = {
          usuario: usernameFromEmail,
          email: newSocio.email,
          contrasena: newSocio.contrasena,
          rol: 'usuario',
          id_socio: newSocioId
        };
        const userSystemResponse = await fetch(`${SUPABASE_URL}/rest/v1/usuarios_sistema`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
            Prefer: 'return=representation'
          },
          body: JSON.stringify(newUserSystem)
        });
        if (!userSystemResponse.ok) {
          const errorData = await userSystemResponse.json();
          throw new Error(
            `Error al registrar usuario en sistema: ${userSystemResponse.statusText} - ${
              errorData.message || 'Error desconocido'
            }`
          );
        }

        setSociosList((prev) => [...prev, addedOrUpdatedSocio[0]]);
      }

      // Reset
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
        foto_url: ''
      });
      setEditingSocio(null);
      setValidationErrors({});
      setShowForm(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
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
      foto_url: socio.foto_url || ''
    });
    setValidationErrors({});
    setError('');
    setShowForm(true);
  };

  const handleDeleteClick = (socio) => {
    setSocioToDelete(socio);
    setShowConfirmModal(true);
  };

  const confirmDelete = async () => {
    setLoading(true);
    setError('');
    setShowConfirmModal(false);
    try {
      const socioId = socioToDelete.id_socio;

      await fetch(`${SUPABASE_URL}/rest/v1/usuarios_sistema?id_socio=eq.${socioId}`, {
        method: 'DELETE',
        headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` }
      });

      await fetch(`${SUPABASE_URL}/rest/v1/ahorros?id_socio=eq.${socioId}`, {
        method: 'DELETE',
        headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` }
      });

      await fetch(`${SUPABASE_URL}/rest/v1/prestamos?id_socio=eq.${socioId}`, {
        method: 'DELETE',
        headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` }
      });

      const response = await fetch(`${SUPABASE_URL}/rest/v1/socios?id_socio=eq.${socioId}`, {
        method: 'DELETE',
        headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          `Error al eliminar socio: ${response.statusText} - ${errorData.message || 'Error desconocido'}`
        );
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

  const label = (text, required = false) => (
    <label className="block text-sm font-medium text-slate-700 mb-1">
      {text} {required && <span className="text-red-600">*</span>}
    </label>
  );

  const inputClass = (field) =>
    `px-4 py-2 border rounded-lg w-full ${
      validationErrors[field] ? 'border-red-500 bg-red-50' : 'border-slate-200'
    }`;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Gestión de Socios</h2>
          <p className="text-slate-600">Administra la información de todos los socios</p>
        </div>
        <button
          onClick={() => {
            setShowForm(!showForm);
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
              foto_url: ''
            });
            setValidationErrors({});
            setError('');
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
        >
          {showForm ? 'Cancelar' : 'Nuevo Socio'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 mb-6">
          <h3 className="text-xl font-semibold text-slate-900 mb-4">
            {editingSocio ? 'Editar Socio' : 'Registrar Nuevo Socio'}
          </h3>

          {/* Mensaje general de error */}
          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleAddOrUpdateSocio} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {editingSocio && (
              <div className="col-span-full">
                {label('ID Socio')}
                <input
                  type="text"
                  value={editingSocio.id_socio}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-slate-100"
                  disabled
                />
              </div>
            )}

            <div>
              {label('Nombre', true)}
              <input
                name="nombre"
                value={newSocio.nombre}
                onChange={handleInputChange}
                className={inputClass('nombre')}
                placeholder="Nombre"
              />
              {validationErrors.nombre && (
                <p className="mt-1 text-xs text-red-600">{validationErrors.nombre}</p>
              )}
            </div>

            <div>
              {label('Apellido Paterno', true)}
              <input
                name="apellido_paterno"
                value={newSocio.apellido_paterno}
                onChange={handleInputChange}
                className={inputClass('apellido_paterno')}
                placeholder="Apellido Paterno"
              />
              {validationErrors.apellido_paterno && (
                <p className="mt-1 text-xs text-red-600">{validationErrors.apellido_paterno}</p>
              )}
            </div>

            <div>
              {label('Apellido Materno', true)}
              <input
                name="apellido_materno"
                value={newSocio.apellido_materno}
                onChange={handleInputChange}
                className={inputClass('apellido_materno')}
                placeholder="Apellido Materno"
              />
              {validationErrors.apellido_materno && (
                <p className="mt-1 text-xs text-red-600">{validationErrors.apellido_materno}</p>
              )}
            </div>

            <div>
              {label('Correo electrónico', true)}
              <input
                type="email"
                name="email"
                value={newSocio.email}
                onChange={handleInputChange}
                className={inputClass('email')}
                placeholder="correo@ejemplo.com"
              />
              {validationErrors.email && (
                <p className="mt-1 text-xs text-red-600">{validationErrors.email}</p>
              )}
            </div>

            <div>
              {label('Contraseña', true)}
              <input
                type="password"
                name="contrasena"
                value={newSocio.contrasena}
                onChange={handleInputChange}
                className={inputClass('contrasena')}
                placeholder="Contraseña"
              />
              {validationErrors.contrasena && (
                <p className="mt-1 text-xs text-red-600">{validationErrors.contrasena}</p>
              )}
            </div>

            <div>
              {label('Teléfono', true)}
              <input
                name="telefono"
                value={newSocio.telefono}
                onChange={handleInputChange}
                className={inputClass('telefono')}
                placeholder="Teléfono"
              />
              {validationErrors.telefono && (
                <p className="mt-1 text-xs text-red-600">{validationErrors.telefono}</p>
              )}
            </div>

            <div>
              {label('Dirección', true)}
              <input
                name="direccion"
                value={newSocio.direccion}
                onChange={handleInputChange}
                className={inputClass('direccion')}
                placeholder="Dirección"
              />
              {validationErrors.direccion && (
                <p className="mt-1 text-xs text-red-600">{validationErrors.direccion}</p>
              )}
            </div>

            <div>
              {label('Código Postal', true)}
              <input
                name="cp"
                value={newSocio.cp}
                onChange={handleInputChange}
                className={inputClass('cp')}
                placeholder="Código Postal"
              />
              {validationErrors.cp && <p className="mt-1 text-xs text-red-600">{validationErrors.cp}</p>}
            </div>

            {/* Campo opcional: URL de Foto (no obligatorio) */}
            <div className="md:col-span-2">
              {label('URL de Foto (opcional)')}
              <input
                name="foto_url"
                value={newSocio.foto_url}
                onChange={handleInputChange}
                className="px-4 py-2 border border-slate-200 rounded-lg w-full"
                placeholder="https://..."
              />
            </div>

            <div className="md:col-span-2">
              {label('Estatus')}
              <select
                name="estatus"
                value={newSocio.estatus}
                onChange={handleInputChange}
                className="px-4 py-2 border border-slate-200 rounded-lg w-full"
              >
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo</option>
              </select>
            </div>

            <button
              type="submit"
              className="col-span-full px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-medium"
              disabled={loading}
            >
              {loading
                ? editingSocio
                  ? 'Actualizando...'
                  : 'Registrando...'
                : editingSocio
                ? 'Actualizar Socio'
                : 'Registrar Socio'}
            </button>
          </form>
        </div>
      )}

      {loading && !showForm && <p className="text-center text-slate-600">Cargando socios...</p>}
      {error && !showForm && (
        <p className="text-center text-red-500">Error: {error}</p>
      )}

      {!loading && !error && sociosList.length === 0 && (
        <p className="text-center text-slate-600">No hay socios registrados.</p>
      )}

      {/* Tabla principal de todos los socios */}
      {!loading && !error && sociosList.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h3 className="text-xl font-semibold text-slate-900 mb-4">Todos los Socios</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
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
                  <tr key={socio.id_socio} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-4 px-4 text-slate-700">{socio.id_socio}</td>
                    <td className="py-4 px-4">
                      <div className="font-medium text-slate-900">
                        {socio.nombre} {socio.apellido_paterno} {socio.apellido_materno}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-slate-700">{socio.email}</td>
                    <td className="py-4 px-4 text-slate-700">{socio.telefono}</td>
                    <td className="py-4 px-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          socio.estatus ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {socio.estatus ? 'activo' : 'inactivo'}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEditClick(socio)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteClick(socio)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
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

      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full text-center">
            <h3 className="text-xl font-bold text-slate-900 mb-4">Confirmar Eliminación</h3>
            <p className="text-slate-700 mb-6">
              ¿Estás seguro de que deseas eliminar este socio? Esta acción es irreversible y se perderán todos
              los datos relacionados con este socio, incluyendo préstamos y ahorros vinculados.
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
                {loading ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SociosModule;
