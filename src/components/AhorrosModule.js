import React, { useState, useEffect, useCallback } from 'react';
import { convertirFechaHoraLocal } from '../utils/dateFormatter';

const SUPABASE_URL = 'https://ubfkhtkmlvutwdivmoff.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InViZmtodGttbHZ1dHdkaXZtb2ZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4MTc5NTUsImV4cCI6MjA2NjM5Mzk1NX0.c0iRma-dnlL29OR3ffq34nmZuj_ViApBTMG-6PEX_B4';

const AhorrosModule = ({ idSocio: propIdSocio }) => {
  const [ahorrosList, setAhorrosList] = useState([]);
  const [sociosList, setSociosList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddAhorroModal, setShowAddAhorroModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedSocioAhorros, setSelectedSocioAhorros] = useState(null);
  const [editingAhorro, setEditingAhorro] = useState(null);
  const [newAhorro, setNewAhorro] = useState({
    id_socio: '',
    ahorro_aportado: '',
    multa_hoja_monto: '',
    afiliacion_papeleria_monto: ''
  });
  const [toastMessage, setToastMessage] = useState('');
  const [totalSociosConAhorro, setTotalSociosConAhorro] = useState(0);
  const [totalAhorroAcumulado, setTotalAhorroAcumulado] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredAhorrosBySocio, setFilteredAhorrosBySocio] = useState([]);
  const [showRetiroModal, setShowRetiroModal] = useState(false); // se mantiene (sin botón para abrir)
  const [retiroMonto, setRetiroMonto] = useState('');
  const [socioParaRetiro, setSocioParaRetiro] = useState(null);

  const currentUserRole = localStorage.getItem('currentUser') ? JSON.parse(localStorage.getItem('currentUser')).role : '';

  useEffect(() => {
    fetchGlobalAhorroStats();
    fetchSocios();

    if (currentUserRole === 'usuario' && propIdSocio) {
      fetchAhorrosForUser(propIdSocio);
    } else if (currentUserRole === 'admin') {
      fetchAhorrosForAllSocios();
    } else {
      setLoading(false);
      setError("No se pudo obtener el ID de socio o rol. Por favor, inicie sesión nuevamente.");
    }
  }, [propIdSocio, currentUserRole]);

  useEffect(() => {
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    const filtered = sociosList
      .filter(socio => {
        const fullName = `${socio.nombre} ${socio.apellido_paterno} ${socio.apellido_materno}`.toLowerCase();
        return (
          fullName.includes(lowerCaseSearchTerm) ||
          socio.id_socio.toString().includes(lowerCaseSearchTerm)
        );
      })
      .map(socio => {
        const socioAhorros = ahorrosList.filter(ahorro => ahorro.id_socio === socio.id_socio);
        const ahorroAcumuladoSocio = socioAhorros.reduce((sum, item) => sum + (parseFloat(item.ahorro_aportado) || 0), 0);
        return {
          id_socio: socio.id_socio,
          nombre_completo: `${socio.nombre} ${socio.apellido_paterno} ${socio.apellido_materno}`,
          ahorro_acumulado: ahorroAcumuladoSocio,
          ahorros_detalles: socioAhorros
        };
      });
    setFilteredAhorrosBySocio(filtered);
  }, [searchTerm, sociosList, ahorrosList]);

  const fetchGlobalAhorroStats = async () => {
    try {
      const sociosConAhorroResponse = await fetch(`${SUPABASE_URL}/rest/v1/ahorros?select=id_socio`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`
        }
      });
      if (!sociosConAhorroResponse.ok) {
        const errorData = await sociosConAhorroResponse.json();
        throw new Error(`Error al cargar socios con ahorro: ${sociosConAhorroResponse.statusText} - ${errorData.message || 'Error desconocido'}`);
      }
      const sociosConAhorroData = await sociosConAhorroResponse.json();
      const uniqueSociosIds = new Set(sociosConAhorroData.map(item => item.id_socio));
      setTotalSociosConAhorro(uniqueSociosIds.size);

      const sumResponse = await fetch(`${SUPABASE_URL}/rest/v1/ahorros?select=ahorro_aportado`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`
        }
      });
      if (!sumResponse.ok) {
        const errorData = await sumResponse.json();
        throw new Error(`Error al sumar ahorro aportado: ${sumResponse.statusText} - ${errorData.message || 'Error desconocido'}`);
      }
      const sumData = await sumResponse.json();
      const accumulatedSum = sumData.reduce((sum, item) => sum + (parseFloat(item.ahorro_aportado) || 0), 0);
      setTotalAhorroAcumulado(accumulatedSum);

    } catch (err) {
      console.error("Error al cargar estadísticas globales de ahorro:", err);
    }
  };

  const fetchAhorrosForUser = async (socioId) => {
    setLoading(true);
    setError(null);
    try {
      const url = `${SUPABASE_URL}/rest/v1/ahorros?id_socio=eq.${socioId}&select=*`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`
        }
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Error al cargar ahorros: ${response.statusText} - ${errorData.message || 'Error desconocido'}`);
      }
      const data = await response.json();
      setAhorrosList(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchAhorrosForAllSocios = async () => {
    setLoading(true);
    setError(null);
    try {
      const url = `${SUPABASE_URL}/rest/v1/ahorros?select=*`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`
        }
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Error al cargar ahorros: ${response.statusText} - ${errorData.message || 'Error desconocido'}`);
      }
      const data = await response.json();
      setAhorrosList(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchSocios = async () => {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/socios?select=id_socio,nombre,apellido_paterno,apellido_materno`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`
        }
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Error al cargar socios: ${response.statusText} - ${errorData.message || 'Error desconocido'}`);
      }
      const data = await response.json();
      setSociosList(data);
    } catch (err) {
      console.error("Error al cargar socios para el modal:", err);
    }
  };

  const handleAddInputChange = (e) => {
    const { name, value } = e.target;
    setNewAhorro(prev => ({ ...prev, [name]: value }));
  };

  const handleRegisterAhorro = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setToastMessage('');

    const { id_socio, ahorro_aportado, multa_hoja_monto, afiliacion_papeleria_monto } = newAhorro;

    if (!id_socio) {
      setError('Debe seleccionar un socio.');
      setLoading(false);
      return;
    }
    if (parseFloat(ahorro_aportado) <= 0 || isNaN(parseFloat(ahorro_aportado))) {
      setError('El "Ahorro aportado" debe ser un número mayor a cero.');
      setLoading(false);
      return;
    }

    const currentDate = new Date();
    const fecha = currentDate.toISOString().split('T')[0];
    const fecha_hora = currentDate.toISOString();

    try {
      const ahorroData = {
        id_socio: id_socio,
        ahorro_aportado: parseFloat(ahorro_aportado),
        fecha: fecha,
        fecha_hora: fecha_hora
      };

      const ahorroResponse = await fetch(`${SUPABASE_URL}/rest/v1/ahorros`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          Prefer: 'return=representation'
        },
        body: JSON.stringify(ahorroData)
      });

      if (!ahorroResponse.ok) {
        const errorData = await ahorroResponse.json();
        throw new Error(`Error al registrar ahorro: ${ahorroResponse.statusText} - ${errorData.message || 'Error desconocido'}`);
      }
      const addedAhorro = await ahorroResponse.json();
      const newAhorroId = addedAhorro[0].id_ahorro;

      const parsedMultaMonto = parseFloat(multa_hoja_monto);
      if (!isNaN(parsedMultaMonto) && parsedMultaMonto > 0) {
        const multaData = {
          id_socio: id_socio,
          monto_multa_hoja: parsedMultaMonto,
          multa_hoja: true,
          fecha_hora: fecha_hora
        };
        const multaResponse = await fetch(`${SUPABASE_URL}/rest/v1/pago_multas`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
            Prefer: 'return=representation'
          },
          body: JSON.stringify(multaData)
        });
        if (!multaResponse.ok) {
          const errorData = await multaResponse.json();
          console.error("Error al registrar multa:", errorData);
        } else {
          console.log("Multa registrada exitosamente:", multaData);
          alert("Multa registrada exitosamente (solo para prueba)");
        }
      }

      const parsedAfiliacionMonto = parseFloat(afiliacion_papeleria_monto);
      if (!isNaN(parsedAfiliacionMonto) && parsedAfiliacionMonto > 0) {
        const afiliacionData = {
          id_socio: id_socio,
          monto_afiliacion_papeleria: parsedAfiliacionMonto,
          afiliacion_papeleria: true,
          fecha_hora: fecha_hora
        };
        const afiliacionResponse = await fetch(`${SUPABASE_URL}/rest/v1/pago_afiliaciones`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
            Prefer: 'return=representation'
          },
          body: JSON.stringify(afiliacionData)
        });
        if (!afiliacionResponse.ok) {
          const errorData = await afiliacionResponse.json();
          console.error("Error al registrar afiliación:", errorData);
        } else {
          console.log("Afiliación registrada exitosamente:", afiliacionData);
          alert("Afiliación registrada exitosamente (solo para prueba)");
        }
      }

      setToastMessage('Ahorro registrado exitosamente');
      setShowAddAhorroModal(false);
      setNewAhorro({
        id_socio: '',
        ahorro_aportado: '',
        multa_hoja_monto: '',
        afiliacion_papeleria_monto: ''
      });
      fetchGlobalAhorroStats();
      if (currentUserRole === 'usuario' && propIdSocio) {
        fetchAhorrosForUser(propIdSocio);
      } else if (currentUserRole === 'admin') {
        fetchAhorrosForAllSocios();
      }

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setTimeout(() => setToastMessage(''), 3000);
    }
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditingAhorro(prev => ({ ...prev, [name]: value }));
  };

  const handleUpdateAhorro = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setToastMessage('');

    if (!editingAhorro.ahorro_aportado || parseFloat(editingAhorro.ahorro_aportado) <= 0 || isNaN(parseFloat(editingAhorro.ahorro_aportado))) {
      setError('El "Ahorro aportado" debe ser un número mayor a cero.');
      setLoading(false);
      return;
    }

    try {
      const updatedData = {
        ahorro_aportado: parseFloat(editingAhorro.ahorro_aportado),
        fecha: editingAhorro.fecha
      };

      const response = await fetch(`${SUPABASE_URL}/rest/v1/ahorros?id_ahorro=eq.${editingAhorro.id_ahorro}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          Prefer: 'return=representation'
        },
        body: JSON.stringify(updatedData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Error al actualizar ahorro: ${response.statusText} - ${errorData.message || 'Error desconocido'}`);
      }

      setToastMessage('Ahorro actualizado exitosamente');
      setShowEditModal(false);
      setEditingAhorro(null);
      fetchGlobalAhorroStats();
      if (currentUserRole === 'usuario' && propIdSocio) {
        fetchAhorrosForUser(propIdSocio);
      } else if (currentUserRole === 'admin') {
        fetchAhorrosForAllSocios();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setTimeout(() => setToastMessage(''), 3000);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value);
  };

  const handleVerDetalles = (socioAhorro) => {
    setSelectedSocioAhorros(socioAhorro);
    setShowDetailsModal(true);
  };

  const handleEditarAhorro = (ahorro) => {
    setEditingAhorro({
      id_ahorro: ahorro.id_ahorro,
      ahorro_aportado: ahorro.ahorro_aportado,
      fecha: ahorro.fecha
    });
    setShowEditModal(true);
  };

  // --- Flujos de retiro se mantienen (sin botón que los dispare) ---
  const handleRetirarAhorroClick = (socioAhorro) => {
    setSocioParaRetiro(socioAhorro);
    setRetiroMonto('');
    setShowRetiroModal(true);
  };
  const handleRetiroMontoChange = (e) => setRetiroMonto(e.target.value);

  const handleAplicarRetiro = async () => {
    const monto = parseFloat(retiroMonto);
    if (isNaN(monto) || monto <= 0) {
      alert('Por favor, ingrese un monto válido para retirar.');
      return;
    }
    if (monto > socioParaRetiro.ahorro_acumulado) {
      alert('El monto a retirar no puede ser mayor al ahorro acumulado.');
      return;
    }
    if (window.confirm(`¿Estás seguro que deseas retirar ${formatCurrency(monto)} del ahorro de ${socioParaRetiro.nombre_completo}?`)) {
      setLoading(true);
      setError(null);
      setToastMessage('');
      try {
        const currentDate = new Date();
        const fechaRetiro = currentDate.toISOString();

        const retiroData = {
          id_socio: socioParaRetiro.id_socio,
          monto_retirado: monto,
          fecha_retiro: fechaRetiro
        };
        const retiroResponse = await fetch(`${SUPABASE_URL}/rest/v1/retiros`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
            Prefer: 'return=representation'
          },
          body: JSON.stringify(retiroData)
        });
        if (!retiroResponse.ok) {
          const errorData = await retiroResponse.json();
          throw new Error(`Error al registrar retiro: ${retiroResponse.statusText} - ${errorData.message || 'Error desconocido'}`);
        }

        const nuevoAhorroRegistro = {
          id_socio: socioParaRetiro.id_socio,
          ahorro_aportado: -monto,
          fecha: currentDate.toISOString().split('T')[0],
          fecha_hora: currentDate.toISOString(),
          es_retiro: true
        };

        const nuevoAhorroResponse = await fetch(`${SUPABASE_URL}/rest/v1/ahorros`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
            Prefer: 'return=representation'
          },
          body: JSON.stringify(nuevoAhorroRegistro)
        });
        if (!nuevoAhorroResponse.ok) {
          const errorData = await nuevoAhorroResponse.json();
          throw new Error(`Error al registrar el retiro como ahorro negativo: ${nuevoAhorroResponse.statusText} - ${errorData.message || 'Error desconocido'}`);
        }

        setToastMessage('Retiro aplicado exitosamente.');
        setShowRetiroModal(false);
        fetchGlobalAhorroStats();
        if (currentUserRole === 'usuario' && propIdSocio) {
          fetchAhorrosForUser(propIdSocio);
        } else if (currentUserRole === 'admin') {
          fetchAhorrosForAllSocios();
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
        setTimeout(() => setToastMessage(''), 3000);
      }
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Ahorros</h2>
          <p className="text-slate-600">Consulta el detalle de las cuentas de los socios</p>
        </div>
        {currentUserRole === 'admin' && (
          <div className="flex space-x-4">
            <button
              onClick={() => setShowAddAhorroModal(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-medium"
            >
              Registrar nuevo ahorro
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Tarjeta: Total de Socios con Ahorro */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Total de Socios con Ahorro</h3>
              <p className="text-2xl font-bold text-green-600">{totalSociosConAhorro.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Tarjeta: Ahorro Acumulado */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2m0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Ahorro Acumulado</h3>
              <p className="text-2xl font-bold text-blue-600">{formatCurrency(totalAhorroAcumulado)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="mb-6">
          <input
            type="text"
            placeholder="Buscar por ID de Socio o Nombre Completo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>

        {loading && <p className="text-center text-slate-600">Cargando ahorros...</p>}
        {error && !loading && <p className="text-center text-red-500">Error: {error}</p>}

        {!loading && !error && filteredAhorrosBySocio.length === 0 && (
          <p className="text-center text-slate-600">No hay ahorros registrados para los criterios de búsqueda.</p>
        )}

        {!loading && !error && filteredAhorrosBySocio.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">ID Socio</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Nombre Completo</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Ahorro Acumulado</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredAhorrosBySocio.map((socioAhorro) => (
                  <tr key={socioAhorro.id_socio} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-4 px-4 text-slate-700">{socioAhorro.id_socio}</td>
                    <td className="py-4 px-4 font-medium text-slate-900">{socioAhorro.nombre_completo}</td>
                    <td className="py-4 px-4 font-bold text-slate-900">
                      {formatCurrency(socioAhorro.ahorro_acumulado)}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex space-x-2">
                        <button onClick={() => handleVerDetalles(socioAhorro)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          Ver Detalles
                        </button>
                        {socioAhorro.ahorros_detalles.length > 0 && (
                          <button onClick={() => handleEditarAhorro(socioAhorro.ahorros_detalles[0])} className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Editar
                          </button>
                        )}
                        {/* Botón "Retirar ahorro" eliminado */}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal para Registrar Nuevo Ahorro */}
      {showAddAhorroModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-slate-900 mb-4">Registrar Nuevo Ahorro</h3>
            <form onSubmit={handleRegisterAhorro} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Seleccionar Socio</label>
                <select
                  name="id_socio"
                  value={newAhorro.id_socio}
                  onChange={handleAddInputChange}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Seleccione un socio</option>
                  {sociosList.map(socio => (
                    <option key={socio.id_socio} value={socio.id_socio}>
                      {socio.nombre} {socio.apellido_paterno} {socio.apellido_materno}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Ahorro Aportado</label>
                <input
                  type="number"
                  name="ahorro_aportado"
                  value={newAhorro.ahorro_aportado}
                  onChange={handleAddInputChange}
                  placeholder="Ej: 100.00"
                  step="0.01"
                  min="0.01"
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Multa por Hoja (monto)</label>
                <input
                  type="number"
                  name="multa_hoja_monto"
                  value={newAhorro.multa_hoja_monto}
                  onChange={handleAddInputChange}
                  placeholder="Ej: 5.00"
                  step="0.01"
                  min="0"
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Afiliación Papelería (monto)</label>
                <input
                  type="number"
                  name="afiliacion_papeleria_monto"
                  value={newAhorro.afiliacion_papeleria_monto}
                  onChange={handleAddInputChange}
                  placeholder="Ej: 15.00"
                  step="0.01"
                  min="0"
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
              <div className="flex justify-end space-x-4 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddAhorroModal(false)}
                  className="px-5 py-2 bg-slate-200 text-slate-800 rounded-xl hover:bg-slate-300 transition-colors font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-medium"
                  disabled={loading}
                >
                  {loading ? 'Guardando...' : 'Guardar Ahorro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para Ver Detalles de Ahorros */}
      {showDetailsModal && selectedSocioAhorros && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-2xl w-full">
            <h3 className="text-xl font-bold text-slate-900 mb-4">Detalles de Ahorros para {selectedSocioAhorros.nombre_completo}</h3>
            <div className="overflow-x-auto mb-4">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-2 px-3 font-semibold text-slate-700">ID Ahorro</th>
                    <th className="text-left py-2 px-3 font-semibold text-slate-700">Monto</th>
                    <th className="text-left py-2 px-3 font-semibold text-slate-700">Fecha</th>
                    <th className="text-left py-2 px-3 font-semibold text-slate-700">Hora</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedSocioAhorros.ahorros_detalles.map(ahorro => {
                    const { fecha, hora } = convertirFechaHoraLocal(ahorro.fecha_hora);
                    const montoDisplay = ahorro.es_retiro ? `-${formatCurrency(Math.abs(ahorro.ahorro_aportado))}` : formatCurrency(ahorro.ahorro_aportado);
                    const montoColorClass = ahorro.es_retiro ? 'text-red-600' : 'text-slate-900';
                    return (
                      <tr key={ahorro.id_ahorro} className="border-b border-slate-100">
                        <td className="py-2 px-3 text-slate-700">{ahorro.id_ahorro}</td>
                        <td className={`py-2 px-3 font-bold ${montoColorClass}`}>{montoDisplay}</td>
                        <td className="py-2 px-3 text-slate-700">{fecha}</td>
                        <td className="py-2 px-3 text-slate-700">{hora}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="px-5 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para Editar Ahorro */}
      {showEditModal && editingAhorro && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-slate-900 mb-4">Editar Ahorro</h3>
            <form onSubmit={handleUpdateAhorro} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">ID Ahorro</label>
                <input
                  type="text"
                  value={editingAhorro.id_ahorro}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-slate-100"
                  disabled
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Ahorro Aportado</label>
                <input
                  type="number"
                  name="ahorro_aportado"
                  value={editingAhorro.ahorro_aportado}
                  onChange={handleEditInputChange}
                  placeholder="Ej: 100.00"
                  step="0.01"
                  min="0.01"
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Fecha</label>
                <input
                  type="date"
                  name="fecha"
                  value={editingAhorro.fecha}
                  onChange={handleEditInputChange}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
              <div className="flex justify-end space-x-4 mt-6">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-5 py-2 bg-slate-200 text-slate-800 rounded-xl hover:bg-slate-300 transition-colors font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-medium"
                  disabled={loading}
                >
                  {loading ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para Retirar Ahorro (sigue presente pero sin botón para abrirlo) */}
      {showRetiroModal && socioParaRetiro && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-slate-900 mb-4">Retirar Ahorro</h3>
            <form onSubmit={(e) => { e.preventDefault(); handleAplicarRetiro(); }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">ID del Socio</label>
                <input
                  type="text"
                  value={socioParaRetiro.id_socio}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-slate-100"
                  disabled
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nombre del Socio</label>
                <input
                  type="text"
                  value={socioParaRetiro.nombre_completo}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-slate-100"
                  disabled
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Monto a retirar</label>
                <input
                  type="number"
                  name="retiro_monto"
                  value={retiroMonto}
                  onChange={(e) => setRetiroMonto(e.target.value)}
                  placeholder="Ej: 50.00"
                  step="0.01"
                  min="0.01"
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
              <div className="flex justify-end space-x-4 mt-6">
                <button
                  type="button"
                  onClick={() => setShowRetiroModal(false)}
                  className="px-5 py-2 bg-slate-200 text-slate-800 rounded-xl hover:bg-slate-300 transition-colors font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium"
                  disabled={loading}
                >
                  {loading ? 'Aplicando...' : 'Aplicar Retiro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toastMessage && (
        <div className="fixed bottom-4 right-4 bg-green-500 text-white px-6 py-3 rounded-xl shadow-lg transition-opacity duration-300 z-50">
          {toastMessage}
        </div>
      )}
    </div>
  );
};

export default AhorrosModule;
