import React, { useState, useEffect } from 'react';

const SUPABASE_URL = 'https://ubfkhtkmlvutwdivmoff.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFhcyIsInJlZiI6InViZmtodGttbHZ1dHdkaXZtb2ZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4MTc5NTUsImV4cCI6MjA2NjM5Mzk1NX0.c0iRma-dnlL29OR3ffq34nmZuj_ViApBTMG-6PEX_B4';

const MODULOS = [
  { id: 'dashboard', name: 'Tablero' },
  { id: 'socios', name: 'Socios' },
  { id: 'ahorros', name: 'Ahorros' },
  { id: 'prestamos', name: 'Préstamos' },
  { id: 'pagos', name: 'Pagos' },
  { id: 'retiros', name: 'Retiros' },
  { id: 'reportes', name: 'Reportes' },
  { id: 'digital', name: 'Centro Digital' },
  { id: 'multas-renovaciones', name: 'Multas y Renovaciones' },
  { id: 'usuarios', name: 'Control Usuarios' },
  { id: 'afore-dashboard', name: 'AFORE Dashboard' },
  { id: 'afore-afiliados', name: 'AFORE Afiliados' },
];

const defaultForm = {
  nombre: '',
  usuario: '',
  email: '',
  contrasena: '',
  rol: 'usuario',
  id_socio: '',
  activo: true,
};

const UsuariosModule = () => {
  const [usersList, setUsersList] = useState([]);
  const [permissions, setPermissions] = useState({});
  const [selectedPerms, setSelectedPerms] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form, setForm] = useState(defaultForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const headers = {
    'Content-Type': 'application/json',
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
  };

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/usuarios_sistema?select=*&order=id_usuario.asc`, {
        headers,
      });

      if (!response.ok) throw new Error('Error al cargar usuarios');

      const data = await response.json();
      setUsersList(data);

      const permRes = await fetch(`${SUPABASE_URL}/rest/v1/permisos_modulos_fondo?select=*`, {
        headers,
      });

      if (permRes.ok) {
        const permData = await permRes.json();
        const grouped = {};

        permData.forEach((p) => {
          if (!grouped[p.id_usuario]) grouped[p.id_usuario] = {};
          grouped[p.id_usuario][p.modulo] = p;
        });

        setPermissions(grouped);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm(defaultForm);
    setSelectedPerms({});
    setEditingUser(null);
    setShowForm(false);
    setError(null);
  };

  const openNewForm = () => {
    resetForm();
    setShowForm(true);
  };

  const openEditForm = (user) => {
    setEditingUser(user);
    setForm({
      nombre: user.nombre || '',
      usuario: user.usuario || '',
      email: user.email || '',
      contrasena: user.contrasena || '',
      rol: user.rol || 'usuario',
      id_socio: user.id_socio || '',
      activo: user.activo !== false,
    });

    const userPerms = permissions[user.id_usuario] || {};
    const loaded = {};

    MODULOS.forEach((m) => {
      loaded[m.id] = {
        puede_ver: userPerms[m.id]?.puede_ver || false,
        puede_crear: userPerms[m.id]?.puede_crear || false,
        puede_editar: userPerms[m.id]?.puede_editar || false,
        puede_eliminar: userPerms[m.id]?.puede_eliminar || false,
      };
    });

    setSelectedPerms(loaded);
    setShowForm(true);
  };

  const togglePerm = (modulo, permiso) => {
    setSelectedPerms((prev) => ({
      ...prev,
      [modulo]: {
        puede_ver: false,
        puede_crear: false,
        puede_editar: false,
        puede_eliminar: false,
        ...(prev[modulo] || {}),
        [permiso]: !(prev[modulo]?.[permiso] || false),
      },
    }));
  };

  const savePermissions = async (idUsuario) => {
    await fetch(`${SUPABASE_URL}/rest/v1/permisos_modulos_fondo?id_usuario=eq.${idUsuario}`, {
      method: 'DELETE',
      headers,
    });

    const rows = Object.entries(selectedPerms)
      .filter(([, p]) => p.puede_ver || p.puede_crear || p.puede_editar || p.puede_eliminar)
      .map(([modulo, p]) => ({
        id_usuario: idUsuario,
        modulo,
        puede_ver: !!p.puede_ver,
        puede_crear: !!p.puede_crear,
        puede_editar: !!p.puede_editar,
        puede_eliminar: !!p.puede_eliminar,
      }));

    if (rows.length === 0) return;

    await fetch(`${SUPABASE_URL}/rest/v1/permisos_modulos_fondo`, {
      method: 'POST',
      headers: {
        ...headers,
        Prefer: 'return=minimal',
      },
      body: JSON.stringify(rows),
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const payload = {
        nombre: form.nombre || null,
        usuario: form.usuario || form.email.split('@')[0],
        email: form.email,
        contrasena: form.contrasena,
        rol: form.rol,
        id_socio: form.id_socio || null,
        activo: form.activo,
      };

      let idUsuario;

      if (editingUser) {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/usuarios_sistema?id_usuario=eq.${editingUser.id_usuario}`, {
          method: 'PATCH',
          headers: {
            ...headers,
            Prefer: 'return=representation',
          },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.message || 'No se pudo actualizar usuario');
        }

        const data = await res.json();
        idUsuario = data[0].id_usuario;
      } else {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/usuarios_sistema`, {
          method: 'POST',
          headers: {
            ...headers,
            Prefer: 'return=representation',
          },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.message || 'No se pudo crear usuario');
        }

        const data = await res.json();
        idUsuario = data[0].id_usuario;
      }

      await savePermissions(idUsuario);
      await fetchUsers();
      resetForm();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const deleteUser = async (user) => {
    if (!window.confirm(`¿Eliminar usuario ${user.email}?`)) return;

    setSaving(true);
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/permisos_modulos_fondo?id_usuario=eq.${user.id_usuario}`, {
        method: 'DELETE',
        headers,
      });

      await fetch(`${SUPABASE_URL}/rest/v1/usuarios_sistema?id_usuario=eq.${user.id_usuario}`, {
        method: 'DELETE',
        headers,
      });

      await fetchUsers();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const filteredUsers = usersList.filter((user) =>
    `${user.email || ''} ${user.rol || ''} ${user.nombre || ''}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 md:p-6 space-y-6 bg-slate-50 min-h-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900">Control de Usuarios</h2>
          <p className="text-slate-600 mt-1">Gestiona usuarios, roles y permisos por módulo.</p>
        </div>

        <button
          onClick={showForm ? resetForm : openNewForm}
          className="px-5 py-3 bg-purple-600 text-white rounded-xl shadow-md hover:bg-purple-700 transition-all font-medium"
        >
          {showForm ? 'Cancelar' : 'Nuevo Usuario'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-5 md:p-6 mb-6">
          <h3 className="text-xl font-semibold text-slate-900 mb-4">
            {editingUser ? 'Editar Usuario' : 'Registrar Nuevo Usuario'}
          </h3>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Nombre"
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                className="px-4 py-3 border border-slate-200 rounded-xl"
              />

              <input
                type="text"
                placeholder="Usuario"
                value={form.usuario}
                onChange={(e) => setForm({ ...form, usuario: e.target.value })}
                className="px-4 py-3 border border-slate-200 rounded-xl"
              />

              <input
                type="email"
                placeholder="Correo electrónico"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="px-4 py-3 border border-slate-200 rounded-xl"
                required
              />

              <input
                type="text"
                placeholder="Contraseña"
                value={form.contrasena}
                onChange={(e) => setForm({ ...form, contrasena: e.target.value })}
                className="px-4 py-3 border border-slate-200 rounded-xl"
                required
              />

              <select
                value={form.rol}
                onChange={(e) => setForm({ ...form, rol: e.target.value })}
                className="px-4 py-3 border border-slate-200 rounded-xl"
              >
                <option value="admin">Admin</option>
                <option value="supervisor">Supervisor</option>
                <option value="capturista">Capturista</option>
                <option value="usuario">Usuario / Socio</option>
              </select>

              <input
                type="number"
                placeholder="ID Socio (opcional)"
                value={form.id_socio}
                onChange={(e) => setForm({ ...form, id_socio: e.target.value })}
                className="px-4 py-3 border border-slate-200 rounded-xl"
              />

              <label className="flex items-center gap-3 px-4 py-3 border border-slate-200 rounded-xl">
                <input
                  type="checkbox"
                  checked={form.activo}
                  onChange={(e) => setForm({ ...form, activo: e.target.checked })}
                />
                Usuario activo
              </label>
            </div>

            <div>
              <h4 className="font-semibold text-slate-800 mb-3">Permisos por módulo</h4>

              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="text-left p-3">Módulo</th>
                      <th className="p-3">Ver</th>
                      <th className="p-3">Crear</th>
                      <th className="p-3">Editar</th>
                      <th className="p-3">Eliminar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {MODULOS.map((m) => (
                      <tr key={m.id} className="border-t border-slate-100">
                        <td className="p-3 font-medium text-slate-700">{m.name}</td>
                        {['puede_ver', 'puede_crear', 'puede_editar', 'puede_eliminar'].map((perm) => (
                          <td key={perm} className="p-3 text-center">
                            <input
                              type="checkbox"
                              checked={!!selectedPerms[m.id]?.[perm]}
                              onChange={() => togglePerm(m.id, perm)}
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full md:w-auto px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 font-medium"
            >
              {saving ? 'Guardando...' : editingUser ? 'Actualizar Usuario' : 'Registrar Usuario'}
            </button>
          </form>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-5 md:p-6">
        <div className="mb-6">
          <input
            type="text"
            placeholder="Buscar por email, nombre o rol..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl"
          />
        </div>

        {loading && <p className="text-center text-slate-600">Cargando usuarios...</p>}
        {error && !loading && <p className="text-center text-red-500">Error: {error}</p>}

        {!loading && !error && filteredUsers.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-200 text-slate-700">
                  <th className="py-3 px-4">ID</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Rol</th>
                  <th className="py-3 px-4">Activo</th>
                  <th className="py-3 px-4">ID Socio</th>
                  <th className="py-3 px-4">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id_usuario} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-4 px-4">{user.id_usuario}</td>
                    <td className="py-4 px-4 font-medium">{user.email}</td>
                    <td className="py-4 px-4">{user.rol}</td>
                    <td className="py-4 px-4">{user.activo === false ? 'No' : 'Sí'}</td>
                    <td className="py-4 px-4">{user.id_socio || 'N/A'}</td>
                    <td className="py-4 px-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEditForm(user)}
                          className="px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => deleteUser(user)}
                          className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && !error && filteredUsers.length === 0 && (
          <p className="text-center text-slate-600">No hay usuarios registrados.</p>
        )}
      </div>
    </div>
  );
};

export default UsuariosModule;
