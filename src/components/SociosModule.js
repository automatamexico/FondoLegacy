import React, { useState, useEffect } from 'react';

const SUPABASE_URL = 'https://ubfkhtkmlvutwdivmoff.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InViZmtodGttbHZ1dHdkaXZtb2ZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4MTc5NTUsImV4cCI6MjA2NjM5Mzk1NX0.c0iRma-dnlL29OR3ffq34nmZuj_ViApBTMG-6PEX_B4';

const SociosModule = () => {
  const [sociosList, setSociosList] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingSocio, setEditingSocio] = useState(null);
  const [newSocio, setNewSocio] = useState({
    nombre: '', apellido_paterno: '', apellido_materno: '',
    email: '', contrasena: '', telefono: '', direccion: '',
    cp: '', estatus: 'activo', foto_url: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [socioToDelete, setSocioToDelete] = useState(null);

  useEffect(() => { fetchSocios(); }, []);

  const fetchSocios = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/socios?select=*`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Error al cargar socios: ${response.statusText} - ${errorData.message || 'Error desconocido'}`);
      }
      const data = await response.json();
      setSociosList(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewSocio(prev => ({ ...prev, [name]: value }));
  };

  const handleAddOrUpdateSocio = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (!newSocio.nombre || !newSocio.apellido_paterno || !newSocio.email || !newSocio.contrasena) {
        throw new Error('Los campos Nombre, Apellido Paterno, Email y Contraseña son obligatorios.');
      }
      const socioToSend = { ...newSocio };
      socioToSend.estatus = (newSocio.estatus === 'activo');

      let response;
      let addedOrUpdatedSocio;

      if (editingSocio) {
        response = await fetch(`${SUPABASE_URL}/rest/v1/socios?id_socio=eq.${editingSocio.id_socio}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Prefer': 'return=representation'
          },
          body: JSON.stringify(socioToSend)
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`Error al actualizar socio: ${response.statusText} - ${errorData.message || 'Error desconocido'}`);
        }
        addedOrUpdatedSocio = await response.json();
        setSociosList(prev => prev.map(s => s.id_socio === editingSocio.id_socio ? addedOrUpdatedSocio[0] : s));
      } else {
        response = await fetch(`${SUPABASE_URL}/rest/v1/socios`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Prefer': 'return=representation'
          },
          body: JSON.stringify(socioToSend)
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`Error al registrar socio: ${response.statusText} - ${errorData.message || 'Error desconocido'}`);
        }
        addedOrUpdatedSocio = await response.json();
        const newSocioId = addedOrUpdatedSocio[0].id_socio;

        if (!newSocio.email || !newSocio.contrasena) {
          throw new Error('Email y Contraseña son necesarios para crear el usuario del sistema.');
        }
        const usernameFromEmail = newSocio.email.split('@')[0];
        const newUserSystem = { usuario: usernameFromEmail, email: newSocio.email, contrasena: newSocio.contrasena, rol: 'usuario', id_socio: newSocioId };
        const userSystemResponse = await fetch(`${SUPABASE_URL}/rest/v1/usuarios_sistema`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Prefer': 'return=representation'
          },
          body: JSON.stringify(newUserSystem)
        });
        if (!userSystemResponse.ok) {
          const errorData = await userSystemResponse.json();
          throw new Error(`Error al registrar usuario en sistema: ${userSystemResponse.statusText} - ${errorData.message || 'Error desconocido'}`);
        }
        setSociosList(prev => [...prev, addedOrUpdatedSocio[0]]);
      }

      setNewSocio({ nombre: '', apellido_paterno: '', apellido_materno: '', email: '', contrasena: '', telefono: '', direccion: '', cp: '', estatus: 'activo', foto_url: '' });
      setEditingSocio(null);
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
      nombre: socio.nombre, apellido_paterno: socio.apellido_paterno, apellido_materno: socio.apellido_materno,
      email: socio.email, contrasena: socio.contrasena, telefono: socio.telefono, direccion: socio.direccion,
      cp: socio.cp, estatus: socio.estatus ? 'activo' : 'inactivo', foto_url: socio.foto_url
    });
    setShowForm(true);
  };

  const handleDeleteClick = (socio) => { setSocioToDelete(socio); setShowConfirmModal(true); };

  const confirmDelete = async () => {
    setLoading(true); setError(null); setShowConfirmModal(false);
    try {
      const socioId = socioToDelete.id_socio;
      await fetch(`${SUPABASE_URL}/rest/v1/usuarios_sistema?id_socio=eq.${socioId}`, { method: 'DELETE', headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` } });
      await fetch(`${SUPABASE_URL}/rest/v1/ahorros?id_socio=eq.${socioId}`, { method: 'DELETE', headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` } });
      await fetch(`${SUPABASE_URL}/rest/v1/prestamos?id_socio=eq.${socioId}`, { method: 'DELETE', headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` } });
      const response = await fetch(`${SUPABASE_URL}/rest/v1/socios?id_socio=eq.${socioId}`, { method: 'DELETE', headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` } });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Error al eliminar socio: ${response.statusText} - ${errorData.message || 'Error desconocido'}`);
      }
      setSociosList(prev => prev.filter(s => s.id_socio !== socioId));
      setSocioToDelete(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  const cancelDelete = () => { setShowConfirmModal(false); setSocioToDelete(null); };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Gestión de Socios</h2>
          <p className="text-slate-600">Administra la información de todos los socios</p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setEditingSocio(null); setNewSocio({ nombre: '', apellido_paterno: '', apellido_materno: '', email: '', contrasena: '', telefono: '', direccion: '', cp: '', estatus: 'activo', foto_url: '' }); }}
          className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
        >
          {showForm ? 'Cancelar' : 'Nuevo Socio'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 mb-6">
          <h3 className="text-xl font-semibold text-slate-900 mb-4">{editingSocio ? 'Editar Socio' : 'Registrar Nuevo Socio'}</h3>
          <form onSubmit={handleAddOrUpdateSocio} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {editingSocio && (
              <div className="col-span-full">
                <label className="block text-sm font-medium text-slate-700 mb-1">ID Socio</label>
                <input type="text" value={editingSocio.id_socio} className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-slate-100" disabled />
              </div>
            )}
            <input type="text" name="nombre" value={newSocio.nombre} onChange={handleInputChange} placeholder="Nombre" className="px-4 py-2 border border-slate-200 rounded-lg" required />
            <input type="text" name="apellido_paterno" value={newSocio.apellido_paterno} onChange={handleInputChange} placeholder="Apellido Paterno" className="px-4 py-2 border border-slate-200 rounded-lg" required />
            <input type="text" name="apellido_materno" value={newSocio.apellido_materno} onChange={handleInputChange} placeholder="Apellido Materno" className="px-4 py-2 border border-slate-200 rounded-lg" />
            <input type="email" name="email" value={newSocio.email} onChange={handleInputChange} placeholder="Email" className="px-4 py-2 border border-slate-200 rounded-lg" required />
            <input type="password" name="contrasena" value={newSocio.contrasena} onChange={handleInputChange} placeholder="Contraseña" className="px-4 py-2 border border-slate-200 rounded-lg" required />
            <input type="text" name="telefono" value={newSocio.telefono} onChange={handleInputChange} placeholder="Teléfono" className="px-4 py-2 border border-slate-200 rounded-lg" />
            <input type="text" name="direccion" value={newSocio.direccion} onChange={handleInputChange} placeholder="Dirección" className="px-4 py-2 border border-slate-200 rounded-lg" />
            <input type="text" name="cp" value={newSocio.cp} onChange={handleInputChange} placeholder="Código Postal" className="px-4 py-2 border border-slate-200 rounded-lg" />
            <input type="text" name="foto_url" value={newSocio.foto_url} onChange={handleInputChange} placeholder="URL de Foto (opcional)" className="px-4 py-2 border border-slate-200 rounded-lg" />
            <select name="estatus" value={newSocio.estatus} onChange={handleInputChange} className="px-4 py-2 border border-slate-200 rounded-lg">
              <option value="activo">Activo</option>
              <option value="inactivo">Inactivo</option>
            </select>
            <button type="submit" className="col-span-full px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-medium" disabled={loading}>
              {loading ? (editingSocio ? 'Actualizando...' : 'Registrando...') : (editingSocio ? 'Actualizar Socio' : 'Registrar Socio')}
            </button>
          </form>
          {error && <p className="text-red-500 mt-4">{error}</p>}
        </div>
      )}

      {loading && <p className="text-center text-slate-600">Cargando socios...</p>}
      {error && !loading && <p className="text-center text-red-500">Error: {error}</p>}

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
                      <div className="flex items-center space-x-3">
                        {socio.foto_url ? (
                          <img src={socio.foto_url} alt="" className="w-8 h-8 rounded-full object-cover border" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-slate-200" />
                        )}
                        <div className="font-medium text-slate-900">{socio.nombre} {socio.apellido_paterno} {socio.apellido_materno}</div>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-slate-700">{socio.email}</td>
                    <td className="py-4 px-4 text-slate-700">{socio.telefono}</td>
                    <td className="py-4 px-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${socio.estatus ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {socio.estatus ? 'activo' : 'inactivo'}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex space-x-2">
                        <button onClick={() => handleEditClick(socio)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button onClick={() => handleDeleteClick(socio)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
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

      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full text-center">
            <h3 className="text-xl font-bold text-slate-900 mb-4">Confirmar Eliminación</h3>
            <p className="text-slate-700 mb-6">¿Estás seguro de que deseas eliminar este socio? Esta acción es irreversible y se perderán todos los datos relacionados.</p>
            <div className="flex justify-center space-x-4">
              <button onClick={cancelDelete} className="px-5 py-2 bg-slate-200 text-slate-800 rounded-xl hover:bg-slate-300 transition-colors font-medium">Cancelar</button>
              <button onClick={confirmDelete} className="px-5 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium" disabled={loading}>
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

