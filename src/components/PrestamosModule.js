import React, { useState, useEffect, useCallback } from 'react';
import { convertirFechaHoraLocal } from '../utils/dateFormatter';

const SUPABASE_URL = 'https://ubfkhtkmlvutwdivmoff.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InViZmtodGttbHZ1dHdkaXZtb2ZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4MTc5NTUsImV4cCI6MjA2NjM5Mzk1NX0.c0iRma-dnlL29OR3ffq34nmZuj_ViApBTMG-6PEX_B4';

const PrestamosModule = ({ idSocio }) => {
  const [prestamosList, setPrestamosList] = useState([]);
  const [sociosList, setSociosList] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalSociosConPrestamo, setTotalSociosConPrestamo] = useState(0);
  const [totalDineroPrestado, setTotalDineroPrestado] = useState(0);
  const [showAddPrestamoModal, setShowAddPrestamoModal] = useState(false);

  // === NUEVO: soporte de 3 tipos de plazo ===
  // mensual (como estaba), semanal (tasas 0.5..6 step 0.5), quincenal (2..8 step 0.5)
  const weeklyRateOptions = Array.from({ length: 12 }, (_, i) => (0.5 * (i + 1)));     // 0.5..6.0
  const biweeklyRateOptions = Array.from({ length: 13 }, (_, i) => 2 + 0.5 * i);       // 2.0..8.0

  const [newPrestamo, setNewPrestamo] = useState({
    id_socio: '',
    // mensual
    plazo_meses: '',
    tasa_interes_mensual: '',
    // NUEVO: tipo de plazo activo
    tipo_plazo: 'mensual', // 'mensual' | 'semanal' | 'quincenal'
    // semanal
    plazo_semanas: '',
    tasa_interes_semanal: '',
    // quincenal
    plazo_quincenas: '',
    tasa_interes_quincenal: '',
    // común
    monto_solicitado: ''
  });

  // Mantengo tus 3 estados (nombres “mensual”) pero ahora representan “por periodo” según el tipo elegido
  const [pagoMensual, setPagoMensual] = useState(0);
  const [abonoCapitalMensual, setAbonoCapitalMensual] = useState(0);
  const [interesMensualEstimado, setInteresMensualEstimado] = useState(0);

  const [showConfirmPrestamoModal, setShowConfirmPrestamoModal] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [sociosConPrestamosActivos, setSociosConPrestamosActivos] = useState([]);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedPrestamo, setSelectedPrestamo] = useState(null);
  const [showPrestamoHistorial, setShowPrestamoHistorial] = useState(false);
  const [historialPagosPrestamo, setHistorialPagosPrestamo] = useState([]);
  const [selectedSocioForHistorial, setSelectedSocioForHistorial] = useState(null);
  const [socioPrestamos, setSocioPrestamos] = useState([]);
  const [showEditPrestamosModal, setShowEditPrestamosModal] = useState(false);

  const currentUserRole = localStorage.getItem('currentUser') ? JSON.parse(localStorage.getItem('currentUser')).role : '';

  const plazoOpciones = Array.from({ length: 48 }, (_, i) => i + 1);  // meses (como antes)
  const tasaOpciones = Array.from({ length: 7 }, (_, i) => i + 2);    // % mensual (2..8) como tenías

  useEffect(() => {
    fetchGlobalPrestamoStats();
    fetchSocios();

    if (!idSocio) {
      fetchAllSociosConPrestamoActivo();
    } else {
      fetchPrestamosForUser(idSocio);
    }
  }, [idSocio]);

  const fetchGlobalPrestamoStats = async () => {
    try {
      const sociosConPrestamoResponse = await fetch(`${SUPABASE_URL}/rest/v1/prestamos?select=id_socio`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
      });
      if (!sociosConPrestamoResponse.ok) {
        const errorData = await sociosConPrestamoResponse.json();
        throw new Error(`Error al cargar socios con préstamo: ${sociosConPrestamoResponse.statusText} - ${errorData.message || 'Error desconocido'}`);
      }
      const sociosConPrestamoData = await sociosConPrestamoResponse.json();
      const uniqueSociosIds = new Set(sociosConPrestamoData.map(item => item.id_socio));
      setTotalSociosConPrestamo(uniqueSociosIds.size);

      const sumResponse = await fetch(`${SUPABASE_URL}/rest/v1/prestamos?select=monto_solicitado`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
      });
      if (!sumResponse.ok) {
        const errorData = await sumResponse.json();
        throw new Error(`Error al sumar monto prestado: ${sumResponse.statusText} - ${errorData.message || 'Error desconocido'}`);
      }
      const sumData = await sumResponse.json();
      const accumulatedSum = sumData.reduce((sum, item) => sum + (parseFloat(item.monto_solicitado) || 0), 0);
      setTotalDineroPrestado(accumulatedSum);

    } catch (err) {
      console.error("Error al cargar estadísticas globales de préstamo:", err);
    }
  };

  const fetchPrestamosForUser = async (socioId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/prestamos?id_socio=eq.${socioId}&select=*`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Error al cargar préstamos: ${response.statusText} - ${errorData.message || 'Error desconocido'}`);
      }
      const data = await response.json();
      setPrestamosList(data);
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
      console.error("Error al cargar socios para el modal:", err);
    }
  };

  const fetchAllSociosConPrestamoActivo = async () => {
    setLoading(true);
    setError(null);
    try {
      const prestamosActivosResponse = await fetch(`${SUPABASE_URL}/rest/v1/prestamos?select=id_socio&estatus=eq.activo`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
      });
      if (!prestamosActivosResponse.ok) {
        const errorData = await prestamosActivosResponse.json();
        throw new Error(`Error al cargar préstamos activos: ${prestamosActivosResponse.statusText} - ${errorData.message || 'Error desconocido'}`);
      }
      const prestamosActivosData = await prestamosActivosResponse.json();

      const uniqueSocioIds = [...new Set(prestamosActivosData.map(item => item.id_socio))];

      if (uniqueSocioIds.length === 0) {
        setSociosConPrestamosActivos([]);
        setLoading(false);
        return;
      }

      const sociosResponse = await fetch(`${SUPABASE_URL}/rest/v1/socios?id_socio=in.(${uniqueSocioIds.join(',')})&select=id_socio,nombre,apellido_paterno,apellido_materno`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
      });
      if (!sociosResponse.ok) {
        const errorData = await sociosResponse.json();
        throw new Error(`Error al cargar detalles de socios: ${sociosResponse.statusText} - ${errorData.message || 'Error desconocido'}`);
      }
      const sociosData = await sociosResponse.json();

      setSociosConPrestamosActivos(sociosData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value || 0);
  };

  const handleNewPrestamoInputChange = (e) => {
    const { name, value } = e.target;
    setNewPrestamo(prev => ({ ...prev, [name]: value }));
  };

  // === NUEVO: cálculo por tipo de plazo ===
  const calculatePrestamoDetails = useCallback(() => {
    const monto = parseFloat(newPrestamo.monto_solicitado);

    let periods = 0;
    let rate = 0; // % por periodo
    const tipo = newPrestamo.tipo_plazo;

    if (tipo === 'mensual') {
      periods = parseInt(newPrestamo.plazo_meses);
      rate = parseFloat(newPrestamo.tasa_interes_mensual);
    } else if (tipo === 'semanal') {
      periods = parseInt(newPrestamo.plazo_semanas);
      rate = parseFloat(newPrestamo.tasa_interes_semanal);
    } else if (tipo === 'quincenal') {
      periods = parseInt(newPrestamo.plazo_quincenas);
      rate = parseFloat(newPrestamo.tasa_interes_quincenal);
    }

    if (monto > 0 && periods > 0 && rate > 0) {
      const tasaDecimal = rate / 100;
      const cuotaCapitalPorPeriodo = monto / periods;
      const interesPorPeriodo = monto * tasaDecimal; // interés simple por periodo
      const pagoPorPeriodo = cuotaCapitalPorPeriodo + interesPorPeriodo;

      setPagoMensual(pagoPorPeriodo);            // ahora es “pago por periodo”
      setAbonoCapitalMensual(cuotaCapitalPorPeriodo);
      setInteresMensualEstimado(interesPorPeriodo);
    } else {
      setPagoMensual(0);
      setAbonoCapitalMensual(0);
      setInteresMensualEstimado(0);
    }
  }, [
    newPrestamo.monto_solicitado,
    newPrestamo.tipo_plazo,
    newPrestamo.plazo_meses,
    newPrestamo.tasa_interes_mensual,
    newPrestamo.plazo_semanas,
    newPrestamo.tasa_interes_semanal,
    newPrestamo.plazo_quincenas,
    newPrestamo.tasa_interes_quincenal
  ]);

  useEffect(() => {
    calculatePrestamoDetails();
  }, [calculatePrestamoDetails]);

  const handleConfirmPrestamo = async () => {
    setShowConfirmPrestamoModal(false);
    setLoading(true);
    setError(null);
    setToastMessage('');

    const {
      id_socio,
      monto_solicitado,
      plazo_meses,
      tasa_interes_mensual,
      tipo_plazo,
      plazo_semanas,
      tasa_interes_semanal,
      plazo_quincenas,
      tasa_interes_quincenal
    } = newPrestamo;

    // Validaciones básicas
    if (!id_socio || !monto_solicitado || !tipo_plazo) {
      setError('Todos los campos del préstamo son obligatorios.');
      setLoading(false);
      return;
    }

    // Determinar periodos y tasa según selección
    let periods = 0;
    let tasaSeleccionada = 0;
    let diasPorPeriodo = 30; // default mes (solo para fallback de fechas)
    if (tipo_plazo === 'mensual') {
      if (!plazo_meses || !tasa_interes_mensual) {
        setError('Completa plazo y tasa mensual.');
        setLoading(false);
        return;
      }
      periods = parseInt(plazo_meses);
      tasaSeleccionada = parseFloat(tasa_interes_mensual);
      diasPorPeriodo = 30; // no se usa para mensual (usamos addMonth)
    } else if (tipo_plazo === 'semanal') {
      if (!plazo_semanas || !tasa_interes_semanal) {
        setError('Completa semanas y tasa semanal.');
        setLoading(false);
        return;
      }
      periods = parseInt(plazo_semanas);
      tasaSeleccionada = parseFloat(tasa_interes_semanal);
      diasPorPeriodo = 7;
    } else if (tipo_plazo === 'quincenal') {
      if (!plazo_quincenas || !tasa_interes_quincenal) {
        setError('Completa quincenas y tasa quincenal.');
        setLoading(false);
        return;
      }
      periods = parseInt(plazo_quincenas);
      tasaSeleccionada = parseFloat(tasa_interes_quincenal);
      diasPorPeriodo = 14;
    }

    if (parseFloat(monto_solicitado) <= 0 || periods <= 0 || tasaSeleccionada <= 0) {
      setError('Verifica monto, plazo y tasa.');
      setLoading(false);
      return;
    }

    try {
      const currentDate = new Date();
      const fecha_solicitud = currentDate.toISOString().split('T')[0];
      const fecha_creacion = currentDate.toISOString();

      // Vencimiento según tipo de plazo
      let fechaVencimiento = new Date(currentDate);
      if (tipo_plazo === 'mensual') {
        fechaVencimiento.setMonth(currentDate.getMonth() + periods);
      } else if (tipo_plazo === 'semanal') {
        fechaVencimiento.setDate(currentDate.getDate() + periods * 7);
      } else if (tipo_plazo === 'quincenal') {
        fechaVencimiento.setDate(currentDate.getDate() + periods * 14);
      }
      const fecha_vencimiento_str = fechaVencimiento.toISOString().split('T')[0];

      // Cálculos finales (ya los tienes en estado, los uso)
      const pagoPorPeriodo = pagoMensual; // ya calculado; puede ser mensual/semanal/quincenal
      const montoAPagar = pagoPorPeriodo * periods;

      // Compatibilidad: tu tabla usa “plazo_meses” e “interes”.
      // Para semanal/quincenal transformo a meses aproximados (ceil).
      const plazo_meses_compat =
        tipo_plazo === 'mensual'
          ? periods
          : (tipo_plazo === 'semanal' ? Math.ceil(periods / 4) : Math.ceil(periods / 2));

      const prestamoData = {
        id_socio: id_socio,
        monto_solicitado: parseFloat(monto_solicitado),
        plazo_meses: plazo_meses_compat,          // compat
        interes: parseFloat(tasaSeleccionada),    // tasa por periodo elegido
        pago_mensual: pagoPorPeriodo,             // pago por periodo
        monto_a_pagar: montoAPagar,
        fecha_solicitud: fecha_solicitud,
        fecha_creacion: fecha_creacion,
        fecha_vencimiento: fecha_vencimiento_str,
        estatus: 'activo'
      };

      const prestamoResponse = await fetch(`${SUPABASE_URL}/rest/v1/prestamos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(prestamoData)
      });

      if (!prestamoResponse.ok) {
        const errorData = await prestamoResponse.json();
        throw new Error(`Error al registrar préstamo: ${prestamoResponse.statusText} - ${errorData.message || 'Error desconocido'}`);
      }
      const addedPrestamo = await prestamoResponse.json();
      const newPrestamoId = addedPrestamo[0].id_prestamo;

      // Programar pagos por periodo según tipo de plazo
      for (let i = 1; i <= periods; i++) {
        let fechaProgramada = new Date(fecha_solicitud);

        if (tipo_plazo === 'mensual') {
          fechaProgramada.setMonth(fechaProgramada.getMonth() + i);
        } else if (tipo_plazo === 'semanal') {
          fechaProgramada.setDate(fechaProgramada.getDate() + i * 7);
        } else if (tipo_plazo === 'quincenal') {
          fechaProgramada.setDate(fechaProgramada.getDate() + i * 14);
        }

        const pagoItem = {
          id_socio: id_socio,
          id_prestamo: newPrestamoId,
          numero_pago: i,
          monto_pago: pagoPorPeriodo,
          fecha_programada: fechaProgramada.toISOString().split('T')[0],
          estatus: 'pendiente',
          fecha_pago: null,
          monto_pagado: null,
          interes_pagado: null,
          capital_pagado: null,
          estado_pago: null
        };

        const pagoResponse = await fetch(`${SUPABASE_URL}/rest/v1/pagos_prestamos`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Prefer': 'return=representation'
          },
          body: JSON.stringify(pagoItem)
        });

        if (!pagoResponse.ok) {
          const errorData = await pagoResponse.json();
          console.error(`Error al registrar pago ${i}:`, errorData);
          throw new Error(`Error al registrar pago ${i}: ${pagoResponse.statusText} - ${errorData.message || 'Error desconocido'}`);
        }
      }

      setToastMessage('Préstamo registrado exitosamente');
      setShowAddPrestamoModal(false);
      setNewPrestamo({
        id_socio: '',
        monto_solicitado: '',
        plazo_meses: '',
        tasa_interes_mensual: '',
        tipo_plazo: 'mensual',
        plazo_semanas: '',
        tasa_interes_semanal: '',
        plazo_quincenas: '',
        tasa_interes_quincenal: ''
      });

      fetchGlobalPrestamoStats();
      if (!idSocio) {
        fetchAllSociosConPrestamoActivo();
      } else {
        fetchPrestamosForUser(idSocio);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setTimeout(() => setToastMessage(''), 3000);
    }
  };

  const handleVerHistorialPrestamosSocio = async (socio) => {
    setSelectedSocioForHistorial(socio);
    setLoading(true);
    setError(null);
    setShowPrestamoHistorial(true);

    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/prestamos?id_socio=eq.${socio.id_socio}&order=fecha_solicitud.desc&select=id_prestamo,monto_solicitado,fecha_solicitud,plazo_meses`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Error al cargar préstamos del socio: ${response.statusText} - ${errorData.message || 'Error desconocido'}`);
      }
      const data = await response.json();

      const prestamosConEstado = await Promise.all(data.map(async (prestamo) => {
        const totalPagosProgramadosResponse = await fetch(`${SUPABASE_URL}/rest/v1/pagos_prestamos?id_prestamo=eq.${prestamo.id_prestamo}&select=count`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Prefer': 'count=exact',
            'Range': '0-0',
            'Range-Unit': 'items'
          }
        });
        const totalPagosProgramados = parseInt(totalPagosProgramadosResponse.headers.get('content-range').split('/')[1], 10) || 0;

        const pagosPagadosResponse = await fetch(`${SUPABASE_URL}/rest/v1/pagos_prestamos?id_prestamo=eq.${prestamo.id_prestamo}&estatus=eq.pagado&select=count`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Prefer': 'count=exact',
            'Range': '0-0',
            'Range-Unit': 'items'
          }
        });
        const pagosPagados = parseInt(pagosPagadosResponse.headers.get('content-range').split('/')[1], 10) || 0;

        return {
          ...prestamo,
          isPaid: totalPagosProgramados > 0 && pagosPagados === totalPagosProgramados
        };
      }));
      setSocioPrestamos(prestamosConEstado);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditarPrestamosSocio = async (socio) => {
    setSelectedSocioForHistorial(socio);
    setLoading(true);
    setError(null);
    setShowEditPrestamosModal(true);

    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/prestamos?id_socio=eq.${socio.id_socio}&order=fecha_solicitud.desc&select=id_prestamo,monto_solicitado,fecha_solicitud,plazo_meses`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Error al cargar préstamos del socio para edición: ${response.statusText} - ${errorData.message || 'Error desconocido'}`);
      }
      const data = await response.json();

      const prestamosConEstadoYHabilitacion = await Promise.all(data.map(async (prestamo) => {
        const pagosRealizadosResponse = await fetch(`${SUPABASE_URL}/rest/v1/pagos_prestamos?id_prestamo=eq.${prestamo.id_prestamo}&monto_pagado=gt.0&select=count`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Prefer': 'count=exact',
            'Range': '0-0',
            'Range-Unit': 'items'
          }
        });
        const pagosRealizadosCount = parseInt(pagosRealizadosResponse.headers.get('content-range').split('/')[1], 10) || 0;

        const fechaSolicitud = new Date(prestamo.fecha_solicitud);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - fechaSolicitud.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        const canDelete = pagosRealizadosCount === 0 && diffDays <= 1;

        return {
          ...prestamo,
          canDelete: canDelete
        };
      }));
      setSocioPrestamos(prestamosConEstadoYHabilitacion);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePrestamo = async (prestamoId) => {
    if (window.confirm("¿Estás seguro de eliminar este préstamo? Al hacerlo, todo lo relacionado con este préstamo será eliminado y no hay manera de revertirlo.")) {
      setLoading(true);
      setError(null);
      setToastMessage('');
      try {
        const deletePagosResponse = await fetch(`${SUPABASE_URL}/rest/v1/pagos_prestamos?id_prestamo=eq.${prestamoId}`, {
          method: 'DELETE',
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
          }
        });
        if (!deletePagosResponse.ok) {
          const errorData = await deletePagosResponse.json();
          throw new Error(`Error al eliminar pagos relacionados: ${deletePagosResponse.statusText} - ${errorData.message || 'Error desconocido'}`);
        }

        const deletePrestamoResponse = await fetch(`${SUPABASE_URL}/rest/v1/prestamos?id_prestamo=eq.${prestamoId}`, {
          method: 'DELETE',
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
          }
        });
        if (!deletePrestamoResponse.ok) {
          const errorData = await deletePrestamoResponse.json();
          throw new Error(`Error al eliminar el préstamo: ${deletePrestamoResponse.statusText} - ${errorData.message || 'Error desconocido'}`);
        }

        setToastMessage('Préstamo eliminado exitosamente.');
        handleEditarPrestamosSocio(selectedSocioForHistorial);
        fetchGlobalPrestamoStats();
        if (!idSocio) {
          fetchAllSociosConPrestamoActivo();
        } else {
          fetchPrestamosForUser(idSocio);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
        setTimeout(() => setToastMessage(''), 3000);
      }
    }
  };

  const handleVerDetallesPrestamo = async (prestamo) => {
    setSelectedPrestamo(prestamo);
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/pagos_prestamos?id_prestamo=eq.${prestamo.id_prestamo}&monto_pagado=gt.0&order=fecha_pago.desc&select=monto_pagado,fecha_pago`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Error al cargar historial de pagos del préstamo: ${response.statusText} - ${errorData.message || 'Error desconocido'}`);
      }
      const data = await response.json();
      setHistorialPagosPrestamo(data);
      setShowDetailsModal(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToListadoPrestamos = () => {
    setShowDetailsModal(false);
    setSelectedPrestamo(null);
    setHistorialPagosPrestamo([]);
  };

  const handleBackToMainView = () => {
    setShowPrestamoHistorial(false);
    setShowEditPrestamosModal(false);
    setSelectedSocioForHistorial(null);
    setSocioPrestamos([]);
    setSearchTerm('');
    setSearchResults([]);
    setError(null);
  };

  const handleSearch = (e) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);
    if (sociosList) {
      const results = sociosList.filter(socio =>
        socio.id_socio.toString().includes(term) ||
        `${socio.nombre} ${socio.apellido_paterno} ${socio.apellido_materno}`.toLowerCase().includes(term)
      );
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Préstamos</h2>
          <p className="text-slate-600">Consulta el detalle de los préstamos de los socios</p>
        </div>
        {currentUserRole === 'admin' && (
          <button
            onClick={() => setShowAddPrestamoModal(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-medium"
          >
            Registrar nuevo préstamo
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Total de Socios con Préstamo</h3>
              <p className="text-2xl font-bold text-orange-600">{totalSociosConPrestamo.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Total de Dinero Prestado</h3>
              <p className="text-2xl font-bold text-purple-600">{formatCurrency(totalDineroPrestado)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Búsqueda */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h3 className="text-xl font-semibold text-slate-900 mb-4">Buscar Socio</h3>
        <input
          type="text"
          placeholder="Buscar por ID de Socio o Nombre Completo..."
          value={searchTerm}
          onChange={handleSearch}
          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {searchTerm && sociosList && searchResults.length > 0 && (
          <div className="mt-4 space-y-2">
            {searchResults.map(socio => (
              <div key={socio.id_socio} className="flex justify-between items-center p-3 bg-slate-100 rounded-lg">
                <span className="text-slate-800">ID: {socio.id_socio} - {socio.nombre} {socio.apellido_paterno} {socio.apellido_materno}</span>
                <div className="flex space-x-2">
                  <button onClick={() => handleVerHistorialPrestamosSocio(socio)} className="px-3 py-1 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600">Ver Historial de Préstamos</button>
                  <button onClick={() => handleEditarPrestamosSocio(socio)} className="px-3 py-1 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600">Editar</button>
                </div>
              </div>
            ))}
          </div>
        )}
        {searchTerm && sociosList && searchResults.length === 0 && (
          <p className="text-center text-slate-600 mt-4">No se encontraron resultados.</p>
        )}
      </div>

      {/* Listado de socios con préstamos activos (admin) */}
      {currentUserRole === 'admin' && sociosConPrestamosActivos.length > 0 && !showPrestamoHistorial && !showEditPrestamosModal && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h3 className="text-xl font-semibold text-slate-900 mb-4">Socios con Préstamos Activos</h3>
          {loading && <p className="text-center text-slate-600">Cargando socios con préstamos...</p>}
          {error && !loading && <p className="text-center text-red-500">Error: {error}</p>}
          {!loading && !error && sociosConPrestamosActivos.length === 0 && (
            <p className="text-center text-slate-600">No hay socios con préstamos activos.</p>
          )}
          {!loading && !error && sociosConPrestamosActivos.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">ID Socio</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Nombre Completo</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {sociosConPrestamosActivos.map(socio => (
                    <tr key={socio.id_socio} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-4 px-4 text-slate-700">{socio.id_socio}</td>
                      <td className="py-4 px-4 font-medium text-slate-900">{socio.nombre} {socio.apellido_paterno} {socio.apellido_materno}</td>
                      <td className="py-4 px-4">
                        <div className="flex space-x-2">
                          <button onClick={() => handleVerHistorialPrestamosSocio(socio)} className="px-3 py-1 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600">Ver Historial de Préstamos</button>
                          <button onClick={() => handleEditarPrestamosSocio(socio)} className="px-3 py-1 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600">Editar</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tabla préstamos del socio */}
      {!showPrestamoHistorial && !showEditPrestamosModal && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          {loading && <p className="text-center text-slate-600">Cargando préstamos...</p>}
          {error && !loading && <p className="text-center text-red-500">Error: {error}</p>}
          {!loading && !error && prestamosList.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">ID Préstamo</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Monto Original</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Saldo Restante</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Tasa</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Pago por periodo</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Vencimiento</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Estado</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {prestamosList.map((prestamo) => (
                    <tr key={prestamo.id_prestamo} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-4 px-4 text-slate-700">{prestamo.id_prestamo}</td>
                      <td className="py-4 px-4 font-bold text-slate-900">
                        {formatCurrency(parseFloat(prestamo.monto_solicitado) || 0)}
                      </td>
                      <td className="py-4 px-4 font-bold text-red-600">
                        {formatCurrency(parseFloat(prestamo.monto_restante) || 0)}
                      </td>
                      <td className="py-4 px-4 text-orange-600 font-medium">
                        {prestamo.interes}%
                      </td>
                      <td className="py-4 px-4 font-medium text-slate-900">
                        {formatCurrency(parseFloat(prestamo.pago_mensual) || 0)}
                      </td>
                      <td className="py-4 px-4 text-slate-700">
                        {prestamo.fecha_vencimiento}
                      </td>
                      <td className="py-4 px-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          prestamo.estatus === 'vigente' 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {prestamo.estatus}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex space-x-2">
                          <button onClick={() => handleVerDetallesPrestamo(prestamo)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                          <button className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Historial / Edición (secciones existentes) */}
      {showPrestamoHistorial && selectedSocioForHistorial && !showEditPrestamosModal ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h3 className="text-xl font-bold text-slate-900 mb-4">Historial de Préstamos de {selectedSocioForHistorial.nombre} {selectedSocioForHistorial.apellido_paterno}</h3>
          {loading && <p className="text-center text-slate-600">Cargando préstamos...</p>}
          {error && !loading && <p className="text-center text-red-500">Error: {error}</p>}
          {!loading && !error && socioPrestamos.length === 0 && (
            <p className="text-center text-slate-600">Este socio no tiene préstamos registrados.</p>
          )}
          {!loading && !error && socioPrestamos.length > 0 && (
            <div className="space-y-4">
              {socioPrestamos.map(prestamo => (
                <div key={prestamo.id_prestamo} className="p-4 border border-slate-200 rounded-lg flex justify-between items-center">
                  <div>
                    <p className="font-medium text-slate-900">Préstamo de {formatCurrency(prestamo.monto_solicitado)} solicitado el {convertirFechaHoraLocal(prestamo.fecha_solicitud).fecha}</p>
                    {prestamo.isPaid && <span className="ml-2 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">Préstamo Pagado</span>}
                  </div>
                  <button onClick={() => handleVerDetallesPrestamo(prestamo)} className="px-3 py-1 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600">Ver detalles</button>
                </div>
              ))}
              <div className="flex justify-center mt-6">
                <button onClick={handleBackToMainView} className="px-5 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium">
                  Volver
                </button>
              </div>
            </div>
          )}
        </div>
      ) : showEditPrestamosModal && selectedSocioForHistorial ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h3 className="text-xl font-bold text-slate-900 mb-4">Editar Préstamos de {selectedSocioForHistorial.nombre} {selectedSocioForHistorial.apellido_paterno}</h3>
          {loading && <p className="text-center text-slate-600">Cargando préstamos para edición...</p>}
          {error && !loading && <p className="text-center text-red-500">Error: {error}</p>}
          {!loading && !error && socioPrestamos.length === 0 && (
            <p className="text-center text-slate-600">Este socio no tiene préstamos registrados para editar.</p>
          )}
          {!loading && !error && socioPrestamos.length > 0 && (
            <div className="space-y-4">
              {socioPrestamos.map(prestamo => (
                <div key={prestamo.id_prestamo} className="p-4 border border-slate-200 rounded-lg flex justify-between items-center">
                  <div>
                    <p className="font-medium text-slate-900">Préstamo de {formatCurrency(prestamo.monto_solicitado)} solicitado el {convertirFechaHoraLocal(prestamo.fecha_solicitud).fecha}</p>
                  </div>
                  <button
                    onClick={() => handleDeletePrestamo(prestamo.id_prestamo)}
                    className={`px-3 py-1 bg-red-500 text-white rounded-lg text-sm transition-colors ${prestamo.canDelete ? 'hover:bg-red-600' : 'opacity-50 cursor-not-allowed'}`}
                    disabled={!prestamo.canDelete}
                  >
                    Eliminar
                  </button>
                </div>
              ))}
              <div className="flex justify-center mt-6">
                <button onClick={handleBackToMainView} className="px-5 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium">
                  Volver
                </button>
              </div>
            </div>
          )}
        </div>
      ) : null}

      {/* Modal: Registrar Nuevo Préstamo */}
      {showAddPrestamoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-slate-900 mb-4">Registrar Nuevo Préstamo</h3>
            <form onSubmit={(e) => { e.preventDefault(); setShowConfirmPrestamoModal(true); }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Seleccionar Socio</label>
                <select
                  name="id_socio"
                  value={newPrestamo.id_socio}
                  onChange={handleNewPrestamoInputChange}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Seleccione un socio</option>
                  {sociosList && sociosList.map(socio => (
                    <option key={socio.id_socio} value={socio.id_socio}>
                      {socio.nombre} {socio.apellido_paterno} {socio.apellido_materno}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Monto Solicitado</label>
                <input
                  type="number"
                  name="monto_solicitado"
                  value={newPrestamo.monto_solicitado}
                  onChange={handleNewPrestamoInputChange}
                  placeholder="Ej: 1000.00"
                  step="0.01"
                  min="0.01"
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* NUEVO: elección de tipo de plazo (solo uno activo) */}
              <div>
                <p className="block text-sm font-medium text-slate-700 mb-2">Tipo de plazo</p>
                <div className="flex gap-3">
                  {['mensual','semanal','quincenal'].map(tp => (
                    <label key={tp} className={`px-3 py-1.5 rounded-lg border cursor-pointer ${newPrestamo.tipo_plazo === tp ? 'bg-slate-100 font-semibold' : 'hover:bg-slate-50'}`}>
                      <input
                        type="radio"
                        name="tipo_plazo"
                        value={tp}
                        checked={newPrestamo.tipo_plazo === tp}
                        onChange={handleNewPrestamoInputChange}
                        className="mr-2"
                      />
                      {tp === 'mensual' ? 'Mensual' : tp === 'semanal' ? 'Semanal' : 'Quincenal'}
                    </label>
                  ))}
                </div>
              </div>

              {/* Controles condicionados por tipo de plazo */}
              {newPrestamo.tipo_plazo === 'mensual' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Plazo en meses</label>
                    <select
                      name="plazo_meses"
                      value={newPrestamo.plazo_meses}
                      onChange={handleNewPrestamoInputChange}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Seleccione plazo</option>
                      {plazoOpciones.map(plazo => (
                        <option key={plazo} value={plazo}>{plazo}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Tasa de interés mensual (%)</label>
                    <select
                      name="tasa_interes_mensual"
                      value={newPrestamo.tasa_interes_mensual}
                      onChange={handleNewPrestamoInputChange}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Seleccione tasa</option>
                      {tasaOpciones.map(tasa => (
                        <option key={tasa} value={tasa}>{tasa}%</option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              {newPrestamo.tipo_plazo === 'semanal' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Tasa semanal (%)</label>
                    <select
                      name="tasa_interes_semanal"
                      value={newPrestamo.tasa_interes_semanal}
                      onChange={handleNewPrestamoInputChange}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Seleccione tasa</option>
                      {weeklyRateOptions.map(r => (
                        <option key={r} value={r}>{r}%</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Plazo en semanas</label>
                    <input
                      type="number"
                      name="plazo_semanas"
                      value={newPrestamo.plazo_semanas}
                      onChange={handleNewPrestamoInputChange}
                      placeholder="Ej: 12"
                      step="1"
                      min="1"
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </>
              )}

              {newPrestamo.tipo_plazo === 'quincenal' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Tasa quincenal (%)</label>
                    <select
                      name="tasa_interes_quincenal"
                      value={newPrestamo.tasa_interes_quincenal}
                      onChange={handleNewPrestamoInputChange}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Seleccione tasa</option>
                      {biweeklyRateOptions.map(r => (
                        <option key={r} value={r}>{r}%</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Plazo en quincenas</label>
                    <input
                      type="number"
                      name="plazo_quincenas"
                      value={newPrestamo.plazo_quincenas}
                      onChange={handleNewPrestamoInputChange}
                      placeholder="Ej: 10"
                      step="1"
                      min="1"
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </>
              )}

              {/* Cálculos automáticos (por periodo) */}
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <label className="block text-sm font-medium text-slate-700 mb-1">Pago por periodo</label>
                <input
                  type="text"
                  value={formatCurrency(pagoMensual)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-slate-100 font-bold text-lg"
                  readOnly
                />
                <p className="text-sm text-slate-600 mt-2">
                  Abono a capital por periodo: <span className="font-semibold text-blue-600">{formatCurrency(abonoCapitalMensual)}</span>
                </p>
                <p className="text-sm text-slate-600">
                  Interés por periodo estimado: <span className="font-semibold text-red-600">{formatCurrency(interesMensualEstimado)}</span>
                </p>
              </div>

              {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
              <div className="flex justify-end space-x-4 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddPrestamoModal(false)}
                  className="px-5 py-2 bg-slate-200 text-slate-800 rounded-xl hover:bg-slate-300 transition-colors font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-medium"
                  disabled={loading}
                >
                  {loading ? 'Calculando...' : 'Aceptar Préstamo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Detalles del préstamo (historial pagos) */}
      {showDetailsModal && selectedPrestamo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-slate-900 mb-4">Historial de Pagos del Préstamo {selectedPrestamo.id_prestamo}</h3>
            {loading && <p className="text-center text-slate-600">Cargando historial de pagos...</p>}
            {error && !loading && <p className="text-center text-red-500">Error: {error}</p>}
            {!loading && !error && historialPagosPrestamo.length === 0 && (
              <p className="text-center text-slate-600">Aún no hay pagos registrados para este préstamo.</p>
            )}
            {!loading && !error && historialPagosPrestamo.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">Monto Pagado</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">Fecha Pago</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historialPagosPrestamo.map((pago, index) => {
                      const { fecha, hora } = convertirFechaHoraLocal(pago.fecha_pago);
                      return (
                        <tr key={index} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="py-4 px-4 font-bold text-slate-900">{formatCurrency(pago.monto_pagado)}</td>
                          <td className="py-4 px-4 text-slate-700">{fecha} {hora}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            <div className="flex justify-end mt-6">
              <button
                onClick={handleBackToListadoPrestamos}
                className="px-5 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
              >
                Volver
              </button>
            </div>
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

export default PrestamosModule;
