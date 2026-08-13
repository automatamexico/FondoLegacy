// src/components/PrestamosModule.js
import React, { useState, useEffect } from 'react';
import { convertirFechaHoraLocal } from '../utils/dateFormatter';

const SUPABASE_URL = 'https://ubfkhtkmlvutwdivmoff.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InViZmtodGttbHZ1dHdkaXZtb2ZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4MTc5NTUsImV4cCI6MjA2NjM5Mzk1NX0.c0iRma-dnlL29OR3ffq34nmZuj_ViApBTMG-6PEX_B4';

const ESTADOS_MEXICO = [
  'AGUASCALIENTES',
  'BAJA CALIFORNIA',
  'BAJA CALIFORNIA SUR',
  'CAMPECHE',
  'CHIAPAS',
  'CHIHUAHUA',
  'CIUDAD DE MÉXICO',
  'COAHUILA',
  'COLIMA',
  'DURANGO',
  'ESTADO DE MÉXICO',
  'GUANAJUATO',
  'GUERRERO',
  'HIDALGO',
  'JALISCO',
  'MICHOACÁN',
  'MORELOS',
  'NAYARIT',
  'NUEVO LEÓN',
  'OAXACA',
  'PUEBLA',
  'QUERÉTARO',
  'QUINTANA ROO',
  'SAN LUIS POTOSÍ',
  'SINALOA',
  'SONORA',
  'TABASCO',
  'TAMAULIPAS',
  'TLAXCALA',
  'VERACRUZ',
  'YUCATÁN',
  'ZACATECAS',
];

const PrestamosModule = ({ idSocio }) => {
  const [prestamosList, setPrestamosList] = useState([]);
  const [sociosList, setSociosList] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [totalSociosConPrestamo, setTotalSociosConPrestamo] = useState(0);
  const [totalDineroPrestado, setTotalDineroPrestado] = useState(0);

  const [showAddPrestamoModal, setShowAddPrestamoModal] = useState(false);
  const [showConfirmPrestamoModal, setShowConfirmPrestamoModal] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [sociosConPrestamosActivos, setSociosConPrestamosActivos] = useState([]);

  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedPrestamo, setSelectedPrestamo] = useState(null);
  const [historialPagosPrestamo, setHistorialPagosPrestamo] = useState([]);

// ================= EXPEDIENTE DEL PRÉSTAMO =================
const [showExpedientePrestamo, setShowExpedientePrestamo] =
  useState(false);

const [expedientePrestamo, setExpedientePrestamo] =
  useState(null);

const [evaluacionExpediente, setEvaluacionExpediente] =
  useState(null);

const [avalExpediente, setAvalExpediente] =
  useState(null);

const [garantiasExpediente, setGarantiasExpediente] =
  useState([]);

const [loadingExpediente, setLoadingExpediente] =
  useState(false);
  
  const [showPrestamoHistorial, setShowPrestamoHistorial] = useState(false);
  const [selectedSocioForHistorial, setSelectedSocioForHistorial] = useState(null);
  const [socioPrestamos, setSocioPrestamos] = useState([]);
  const [showEditPrestamosModal, setShowEditPrestamosModal] = useState(false);
  
// Pago desde el historial del préstamo
const [showPagoPrestamoModal, setShowPagoPrestamoModal] =
  useState(false);

const [showConfirmPagoPrestamo, setShowConfirmPagoPrestamo] =
  useState(false);

const [pagoPrestamoTarget, setPagoPrestamoTarget] =
  useState(null);

const [montoPagoPrestamo, setMontoPagoPrestamo] =
  useState('');

const [formaPagoPrestamo, setFormaPagoPrestamo] =
  useState('');

const [formaPagoPrestamoError, setFormaPagoPrestamoError] =
  useState('');

const [notaPagoPrestamo, setNotaPagoPrestamo] =
  useState('');

const [multaHojaPrestamo, setMultaHojaPrestamo] =
  useState('no');

const [montoMultaPrestamo, setMontoMultaPrestamo] =
  useState('');

const [guardandoPagoPrestamo, setGuardandoPagoPrestamo] =
  useState(false);
  
  const [submitting, setSubmitting] = useState(false);

  const currentUserRole = localStorage.getItem('currentUser')
    ? (JSON.parse(localStorage.getItem('currentUser')).role || 'admin')
    : 'admin';

 const [newPrestamo, setNewPrestamo] = useState({
  id_socio: '',

  // ================= DATOS LABORALES =================
  tipo_fuente_ingreso: '',

  // EMPLEADO
  empleado_nombre_empresa: '',

  empleado_empresa_calle: '',
  empleado_empresa_numero: '',
  empleado_empresa_edificio: '',
  empleado_empresa_colonia: '',
  empleado_empresa_estado: '',
  empleado_empresa_pais: '',
  empleado_empresa_municipio: '',
  empleado_empresa_cp: '',
  empleado_empresa_entre_calles: '',
  empleado_empresa_referencias: '',

  empleado_ocupacion: '',
  empleado_tiempo_anios: '',
  empleado_tiempo_meses: '',
  empleado_tipo_contrato: '',
  empleado_ingreso_mensual_neto: '',
  empleado_comprueba_ingresos: '',
  empleado_tipo_comprobante: '',

  // NEGOCIO PROPIO
  negocio_tipo: '',
  negocio_tiempo_anios: '',
  negocio_tiempo_meses: '',

  negocio_calle: '',
  negocio_numero: '',
  negocio_edificio: '',
  negocio_colonia: '',
  negocio_estado: '',
  negocio_pais: '',
  negocio_municipio: '',
  negocio_cp: '',
  negocio_entre_calles: '',
  negocio_referencias: '',

  negocio_formal: '',
  negocio_num_empleados: '',
  negocio_gastos_mensuales: '',
  negocio_utilidad_aproximada: '',

  // ================= PRÉSTAMO =================
  monto_solicitado: '',
  numero_plazos: '',
  tipo_plazo: 'mensual',
  interes: '',
  fecha_solicitud: ''
});

// ================= EVALUACIÓN CREDITICIA =================
const [evaluacionCrediticia, setEvaluacionCrediticia] = useState({
  capacidad_pago_periodicidad: '',
  capacidad_pago_monto: '',

  destino_dinero: '',
  uso_generara_ingresos: '',
  tiempo_recuperacion: '',
  riesgo_si_no_funciona: '',

  otros_ingresos: '',
  accion_si_no_puede_pagar: '',
  accion_si_sin_ingresos_mes: '',
  accion_emergencia_fuerte: '',

  fuente_pago_prestamo: '',

  cuenta_con_aval: false,

  tiene_redes_sociales: '',
  redes_sociales_detalle: '',

  tiene_automovil: '',
  tiene_propiedades: '',

  garantia_declarada: '',
});


// ================= AVAL =================
const [avalPrestamo, setAvalPrestamo] = useState({
  nombre: '',
  edad: '',
  celular: '',
  ocupacion: '',

  domicilio_calle: '',
  domicilio_numero: '',
  domicilio_edificio: '',
  domicilio_colonia: '',
  domicilio_estado: '',
  domicilio_pais: '',
  domicilio_municipio: '',
  domicilio_cp: '',
  domicilio_entre_calles: '',
  domicilio_referencias: '',

  tiene_redes_sociales: '',
  redes_sociales_detalle: '',
});

// ================= GARANTÍAS DEL PRÉSTAMO =================
const [garantiasPrestamo, setGarantiasPrestamo] = useState({
  propiedad_pertenece_a: 'SOLICITANTE',
  vehiculo_pertenece_a: 'SOLICITANTE',
  otro_pertenece_a: 'SOLICITANTE',

  propiedad_calle: '',
  propiedad_numero: '',
  propiedad_edificio: '',
  propiedad_colonia: '',
  propiedad_estado: '',
  propiedad_pais: '',
  propiedad_municipio: '',
  propiedad_cp: '',
  propiedad_entre_calles: '',
  propiedad_referencias: '',
  propiedad_tipo: '',
  propiedad_valor_estimado: '',
  propiedad_documentacion: '',
  propiedad_gravamenes: '',

  vehiculo_marca: '',
  vehiculo_modelo: '',
  vehiculo_anio: '',
  vehiculo_valor_estimado: '',
  vehiculo_documentacion: '',
  vehiculo_gravamenes: '',

  tiene_otro_activo: '',
  otro_tipo: '',
  otro_descripcion: '',
  otro_valor_estimado: '',
});

// ================= ARCHIVOS AVAL / GARANTÍAS =================
const [archivoIdentificacionAval, setArchivoIdentificacionAval] =
  useState(null);

const [archivoDocumentoPropiedad, setArchivoDocumentoPropiedad] =
  useState(null);

  const [archivoDocumentoVehiculo, setArchivoDocumentoVehiculo] =
  useState(null);

  // ================= ERRORES FORMULARIO =================
const [erroresFormulario, setErroresFormulario] = useState({});

  const validarArchivoPrestamo = (file) => {
  if (!file) {
    return 'Debe seleccionar un archivo.';
  }

  const tiposPermitidos = [
    'application/pdf',
    'image/jpeg',
    'image/png',
  ];

  if (!tiposPermitidos.includes(file.type)) {
    return 'Solo se permiten archivos PDF, JPG o PNG.';
  }

  const maxSize = 10 * 1024 * 1024;

  if (file.size > maxSize) {
    return 'El archivo supera el tamaño máximo permitido de 10 MB.';
  }

  return '';
};
  
  const [pagoPeriodo, setPagoPeriodo] = useState(0);
  const [abonoCapitalPeriodo, setAbonoCapitalPeriodo] = useState(0);
  const [interesPeriodoEstimado, setInteresPeriodoEstimado] = useState(0);

  useEffect(() => {
    fetchGlobalPrestamoStats();
    fetchSocios();
    if (!idSocio) fetchAllSociosConPrestamoActivo();
    else fetchPrestamosForUser(idSocio);
  }, [idSocio]);

  // --- Utils ---
  const formatCurrency = (value) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value || 0);

  const formatFechaSolo = (fecha) => {
  if (!fecha) return '—';

  const soloFecha = String(fecha).slice(0, 10);
  const partes = soloFecha.split('-');

  if (partes.length !== 3) {
    return fecha;
  }

  const [anio, mes, dia] = partes;

  return `${dia}/${mes}/${anio}`;
};

  const calcularPagoRequerido = (monto, tasaPctPorPeriodo, nPlazos) => {
    const P = Number(monto) || 0;
    const i = (Number(tasaPctPorPeriodo) || 0) / 100;
    const n = Number(nPlazos) || 0;
    if (P <= 0 || n <= 0) return 0;
    if (i <= 0) return P / n; // sin interés
    return (P * i) / (1 - Math.pow(1 + i, -n));
  };

  // Normaliza string fecha a YYYY-MM-DD para Supabase
 const toISODate = (val) => {
   const now = new Date();
now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  if (!val) {
  const hoy = now;
    const y = hoy.getFullYear();
    const m = String(hoy.getMonth() + 1).padStart(2, '0');
    const d = String(hoy.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val;

  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(val)) {
    const [d, m, y] = val.split('/').map(n => parseInt(n, 10));
    const dt = new Date(y, m - 1, d);
    const mm = String(dt.getMonth() + 1).padStart(2, '0');
    const dd = String(dt.getDate()).padStart(2, '0');
    return `${dt.getFullYear()}-${mm}-${dd}`;
  }

  const dt = new Date(val);
  if (!isNaN(dt.getTime())) {
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, '0');
    const d = String(dt.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  const hoy = now;
  const y = hoy.getFullYear();
  const m = String(hoy.getMonth() + 1).padStart(2, '0');
  const d = String(hoy.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const addPeriod = (dateISO, tipo, k) => {
  const d = new Date(`${dateISO}T00:00:00`);

  if (tipo === 'semanal') d.setDate(d.getDate() + 7 * k);
  else if (tipo === 'quincenal') d.setDate(d.getDate() + 14 * k);
  else d.setMonth(d.getMonth() + k);

  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');

  return `${y}-${m}-${day}`;
};

const localPlainDateTime = () => {
  const d = new Date();

  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const h = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  const sec = String(d.getSeconds()).padStart(2, '0');

  return `${y}-${m}-${day}T${h}:${min}:${sec}`;
};
  
  // --- RLS helper: marcar liquidado si corresponde ---
  const checkAndMarkLiquidado = async (id_prestamo) => {
    try {
      const totalResp = await fetch(
        `${SUPABASE_URL}/rest/v1/pagos_prestamos?id_prestamo=eq.${id_prestamo}&select=count`,
        { headers: { 'Content-Type': 'application/json', apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}`, Prefer: 'count=exact', Range: '0-0', 'Range-Unit': 'items' } }
      );
      const totalRange = totalResp.headers.get('content-range') || '0/0';
      const totalPagos = parseInt(totalRange.split('/')[1], 10) || 0;

      const pagadosResp = await fetch(
        `${SUPABASE_URL}/rest/v1/pagos_prestamos?id_prestamo=eq.${id_prestamo}&estatus=eq.pagado&select=count`,
        { headers: { 'Content-Type': 'application/json', apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}`, Prefer: 'count=exact', Range: '0-0', 'Range-Unit': 'items' } }
      );
      const pagadosRange = pagadosResp.headers.get('content-range') || '0/0';
      const pagosPagados = parseInt(pagadosRange.split('/')[1], 10) || 0;

      if (totalPagos > 0 && pagosPagados === totalPagos) {
        const patchResp = await fetch(
          `${SUPABASE_URL}/rest/v1/prestamos?id_prestamo=eq.${id_prestamo}`,
          {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}`, Prefer: 'return=representation' },
            body: JSON.stringify({ estatus: 'LIQUIDADO' })
          }
        );
        if (patchResp.ok) {
          setPrestamosList(prev => prev.map(p => p.id_prestamo === id_prestamo ? { ...p, estatus: 'LIQUIDADO' } : p));
        }
      }
    } catch (e) {
      console.error('checkAndMarkLiquidado error:', e);
    }
  };

  // --- Fetches ---
  const fetchGlobalPrestamoStats = async () => {
    try {
      const sociosConPrestamoResponse = await fetch(
        `${SUPABASE_URL}/rest/v1/prestamos?select=id_socio`,
        { headers: { 'Content-Type': 'application/json', apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } }
      );
      const sociosConPrestamoData = await sociosConPrestamoResponse.json();
      const uniqueSociosIds = new Set(sociosConPrestamoData.map((item) => item.id_socio));
      setTotalSociosConPrestamo(uniqueSociosIds.size);

      const sumPrestamosResp = await fetch(
        `${SUPABASE_URL}/rest/v1/prestamos?select=monto_solicitado`,
        { headers: { 'Content-Type': 'application/json', apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } }
      );
      const prestamosRows = await sumPrestamosResp.json();
      const totalPrestado = prestamosRows.reduce((s, x) => s + (parseFloat(x.monto_solicitado) || 0), 0);

      const sumCapitalResp = await fetch(
        `${SUPABASE_URL}/rest/v1/pagos_prestamos?select=capital_pagado&capital_pagado=not.is.null`,
        { headers: { 'Content-Type': 'application/json', apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } }
      );
      const capitalRows = await sumCapitalResp.json();
      const totalCapitalPagado = capitalRows.reduce((s, x) => s + (parseFloat(x.capital_pagado) || 0), 0);

      const netoAdeudado = Math.max(0, totalPrestado - totalCapitalPagado);
      setTotalDineroPrestado(netoAdeudado);
    } catch (err) {
      console.error('Error KPIs préstamos:', err);
      setTotalSociosConPrestamo(0);
      setTotalDineroPrestado(0);
    }
  };

  const fetchPrestamosForUser = async (socioId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/prestamos?id_socio=eq.${socioId}&select=*`,
        { headers: { 'Content-Type': 'application/json', apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } }
      );
      if (!response.ok) throw new Error('Error al cargar préstamos del socio');
      const data = await response.json();
      setPrestamosList(data);
      await Promise.all((data || []).map(p => checkAndMarkLiquidado(p.id_prestamo)));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchSocios = async () => {
    try {
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/socios?select=id_socio,nombre,apellido_paterno,apellido_materno`,
        { headers: { 'Content-Type': 'application/json', apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } }
      );
      if (!response.ok) throw new Error('Error al cargar socios');
      const data = await response.json();
      setSociosList(data);
    } catch (err) {
      console.error('Error al cargar socios:', err);
    }
  };

  const fetchAllSociosConPrestamoActivo = async () => {
    setLoading(true);
    setError(null);
    try {
      const prestamosActivosResponse = await fetch(
        `${SUPABASE_URL}/rest/v1/prestamos?select=id_socio&estatus=eq.activo`,
        { headers: { 'Content-Type': 'application/json', apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } }
      );
      if (!prestamosActivosResponse.ok) throw new Error('Error al cargar préstamos activos');
      const prestamosActivosData = await prestamosActivosResponse.json();
      const uniqueSocioIds = [...new Set(prestamosActivosData.map((item) => item.id_socio))];

      if (uniqueSocioIds.length === 0) {
        setSociosConPrestamosActivos([]);
        setLoading(false);
        return;
      }

      const sociosResponse = await fetch(
        `${SUPABASE_URL}/rest/v1/socios?id_socio=in.(${uniqueSocioIds.join(',')})&select=id_socio,nombre,apellido_paterno,apellido_materno`,
        { headers: { 'Content-Type': 'application/json', apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } }
      );
      if (!sociosResponse.ok) throw new Error('Error al cargar detalles de socios');
      const sociosData = await sociosResponse.json();
      setSociosConPrestamosActivos(sociosData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // --- Navegación/acciones ---
  const handleVerHistorialPrestamosSocio = async (socio) => {
    setSelectedSocioForHistorial(socio);
    setShowEditPrestamosModal(false);
    setShowPrestamoHistorial(true);
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/prestamos?id_socio=eq.${socio.id_socio}&order=fecha_solicitud.desc&select=id_prestamo,monto_solicitado,fecha_solicitud,numero_plazos,tipo_plazo,interes`,
        { headers: { 'Content-Type': 'application/json', apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } }
      );
      if (!response.ok) throw new Error('Error al cargar préstamos del socio');

      const data = await response.json();
      const prestamosConEstado = await Promise.all(
        data.map(async (prestamo) => {
          const totalPagosProgramadosResponse = await fetch(
            `${SUPABASE_URL}/rest/v1/pagos_prestamos?id_prestamo=eq.${prestamo.id_prestamo}&select=count`,
            { headers: { 'Content-Type': 'application/json', apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}`, Prefer: 'count=exact', Range: '0-0', 'Range-Unit': 'items' } }
          );
          const totalRange = totalPagosProgramadosResponse.headers.get('content-range') || '0/0';
          const totalPagosProgramados = parseInt(totalRange.split('/')[1], 10) || 0;

          const pagosPagadosResponse = await fetch(
            `${SUPABASE_URL}/rest/v1/pagos_prestamos?id_prestamo=eq.${prestamo.id_prestamo}&estatus=eq.pagado&select=count`,
            { headers: { 'Content-Type': 'application/json', apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}`, Prefer: 'count=exact', Range: '0-0', 'Range-Unit': 'items' } }
          );
          const pagadosRange = pagosPagadosResponse.headers.get('content-range') || '0/0';
          const pagosPagados = parseInt(pagadosRange.split('/')[1], 10) || 0;

          return { ...prestamo, isPaid: totalPagosProgramados > 0 && pagosPagados === totalPagosProgramados };
        })
      );

      setSocioPrestamos(prestamosConEstado);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditarPrestamosSocio = async (socio) => {
    setSelectedSocioForHistorial(socio);
    setShowPrestamoHistorial(false);
    setShowEditPrestamosModal(true);
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/prestamos?id_socio=eq.${socio.id_socio}&order=fecha_solicitud.desc&select=id_prestamo,monto_solicitado,fecha_solicitud,numero_plazos`,
        { headers: { 'Content-Type': 'application/json', apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } }
      );
      if (!response.ok) throw new Error('Error al cargar préstamos para edición');

      const data = await response.json();
      const prestamosConEstadoYHabilitacion = await Promise.all(
        data.map(async (prestamo) => {
          const pagosRealizadosResponse = await fetch(
            `${SUPABASE_URL}/rest/v1/pagos_prestamos?id_prestamo=eq.${prestamo.id_prestamo}&monto_pagado=gt.0&select=count`,
            { headers: { 'Content-Type': 'application/json', apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}`, Prefer: 'count=exact', Range: '0-0', 'Range-Unit': 'items' } }
          );
          const range = pagosRealizadosResponse.headers.get('content-range') || '0/0';
          const pagosRealizadosCount = parseInt(range.split('/')[1], 10) || 0;

          const fechaSolicitud = new Date(prestamo.fecha_solicitud);
          const now = new Date();
          const diffTime = Math.abs(now.getTime() - fechaSolicitud.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          const canDelete = pagosRealizadosCount === 0 && diffDays <= 1;
          return { ...prestamo, canDelete };
        })
      );
      setSocioPrestamos(prestamosConEstadoYHabilitacion);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerDetallesPrestamo = async (prestamo) => {
    setSelectedPrestamo(prestamo);
    setShowDetailsModal(true);
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
       `${SUPABASE_URL}/rest/v1/pagos_prestamos?id_prestamo=eq.${prestamo.id_prestamo}&order=fecha_programada.asc&select=id_pago,id_prestamo,numero_pago,fecha_programada,monto_pago,fecha_pago,fecha_hora_pago,monto_pagado,interes_pagado,capital_pagado,estatus,forma_pago,nota`,
        { headers: { 'Content-Type': 'application/json', apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } }
      );
      if (!response.ok) throw new Error('Error al cargar historial de pagos del préstamo');
      const data = await response.json();
      setHistorialPagosPrestamo(data);
      await checkAndMarkLiquidado(prestamo.id_prestamo);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ======================================================
// ============== VER EXPEDIENTE PRÉSTAMO ==============
// ======================================================

const handleVerExpedientePrestamo = async (prestamo) => {
  if (!prestamo?.id_prestamo) {
    alert('No se encontró el ID del préstamo.');
    return;
  }

  setLoadingExpediente(true);

  setExpedientePrestamo(null);
  setEvaluacionExpediente(null);
  setAvalExpediente(null);
  setGarantiasExpediente([]);

  try {
    const idPrestamo = prestamo.id_prestamo;

    // ================= PRÉSTAMO COMPLETO =================
    const prestamoResp = await fetch(
      `${SUPABASE_URL}/rest/v1/prestamos?id_prestamo=eq.${idPrestamo}&select=*`,
      {
        headers: {
          'Content-Type': 'application/json',
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
      }
    );

    if (!prestamoResp.ok) {
      const detalle = await prestamoResp.text();

      throw new Error(
        `No se pudo cargar el préstamo. Detalle: ${detalle}`
      );
    }

    const prestamoData = await prestamoResp.json();


    // ================= EVALUACIÓN CREDITICIA =================
    const evaluacionResp = await fetch(
      `${SUPABASE_URL}/rest/v1/evaluaciones_crediticias?id_prestamo=eq.${idPrestamo}&select=*`,
      {
        headers: {
          'Content-Type': 'application/json',
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
      }
    );

    if (!evaluacionResp.ok) {
      const detalle = await evaluacionResp.text();

      throw new Error(
        `No se pudo cargar la evaluación crediticia. Detalle: ${detalle}`
      );
    }

    const evaluacionData =
      await evaluacionResp.json();


    // ================= AVAL =================
    const avalResp = await fetch(
      `${SUPABASE_URL}/rest/v1/avales_prestamos?id_prestamo=eq.${idPrestamo}&select=*`,
      {
        headers: {
          'Content-Type': 'application/json',
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
      }
    );

    if (!avalResp.ok) {
      const detalle = await avalResp.text();

      throw new Error(
        `No se pudo cargar el aval. Detalle: ${detalle}`
      );
    }

    const avalData =
      await avalResp.json();


    // ================= GARANTÍAS =================
    const garantiasResp = await fetch(
      `${SUPABASE_URL}/rest/v1/garantias_prestamos?id_prestamo=eq.${idPrestamo}&order=id_garantia.asc&select=*`,
      {
        headers: {
          'Content-Type': 'application/json',
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
      }
    );

    if (!garantiasResp.ok) {
      const detalle = await garantiasResp.text();

      throw new Error(
        `No se pudieron cargar las garantías. Detalle: ${detalle}`
      );
    }

    const garantiasData =
      await garantiasResp.json();


    // ================= GUARDAR EN ESTADOS =================

    setExpedientePrestamo(
      prestamoData?.[0] || prestamo
    );

    setEvaluacionExpediente(
      evaluacionData?.[0] || null
    );

    setAvalExpediente(
      avalData?.[0] || null
    );

    setGarantiasExpediente(
      garantiasData || []
    );

    setShowExpedientePrestamo(true);

  } catch (err) {

    console.error(
      'ERROR CARGANDO EXPEDIENTE DEL PRÉSTAMO:',
      err
    );

    alert(
      err.message ||
        'No se pudo cargar el expediente del préstamo.'
    );

  } finally {

    setLoadingExpediente(false);

  }
};

const abrirPagoDesdePrestamo = (pago) => {
  if (
    String(pago?.estatus || '').toLowerCase() ===
    'pagado'
  ) {
    return;
  }

  setPagoPrestamoTarget(pago);
  setMontoPagoPrestamo(pago.monto_pago || '');
  setFormaPagoPrestamo('');
  setFormaPagoPrestamoError('');
  setNotaPagoPrestamo('');
  setMultaHojaPrestamo('no');
  setMontoMultaPrestamo('');
  setShowPagoPrestamoModal(true);
};

const validarPagoDesdePrestamo = () => {
  if (
    !montoPagoPrestamo ||
    Number(montoPagoPrestamo) <= 0
  ) {
    alert('Indique un monto válido.');
    return;
  }

  if (!formaPagoPrestamo) {
    setFormaPagoPrestamoError(
      'Debe seleccionar una forma de pago.'
    );
    return;
  }

  if (
    multaHojaPrestamo === 'si' &&
    !(Number(montoMultaPrestamo) > 0)
  ) {
    alert('Indique el monto de la multa por hoja.');
    return;
  }

  setShowConfirmPagoPrestamo(true);
};

const confirmarPagoDesdePrestamo = async () => {
  if (
    !pagoPrestamoTarget?.id_pago ||
    !selectedPrestamo
  ) {
    alert(
      'No se encontró la información necesaria del pago.'
    );
    return;
  }

  setGuardandoPagoPrestamo(true);

  try {
    const monto = Number(montoPagoPrestamo);

    const montoPrestamo = Number(
      selectedPrestamo.monto_solicitado || 0
    );

    const numeroPlazos = Number(
      selectedPrestamo.numero_plazos || 1
    );

    const interesPrestamo = Number(
      selectedPrestamo.interes || 0
    );

    const capitalEstimado =
      montoPrestamo / numeroPlazos;

    const interesEstimado =
      montoPrestamo * (interesPrestamo / 100);

    const interesPagado = Math.min(
      monto,
      interesEstimado
    );

    const capitalPagado = Math.max(
      monto - interesPagado,
      0
    );

    const fechaHoraLocal = localPlainDateTime();
    const soloFecha = fechaHoraLocal.slice(0, 10);

    const bodyPago = {
      fecha_pago: soloFecha,
      fecha_hora_pago: fechaHoraLocal,
      estatus: 'pagado',
      monto_pagado: monto,
      interes_pagado: interesPagado,
      capital_pagado: capitalPagado,
      forma_pago: formaPagoPrestamo,
      nota:
        String(notaPagoPrestamo || '')
          .trim()
          .toUpperCase() || null,
    };

    const pagoResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/pagos_prestamos?id_pago=eq.${pagoPrestamoTarget.id_pago}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify(bodyPago),
      }
    );

    if (!pagoResponse.ok) {
      const detalle = await pagoResponse.text();

      throw new Error(
        `No se pudo registrar el pago: ${detalle}`
      );
    }

    // Registrar multa por hoja, cuando corresponda
    if (
      multaHojaPrestamo === 'si' &&
      Number(montoMultaPrestamo) > 0 &&
      selectedSocioForHistorial?.id_socio
    ) {
      const multaBody = {
        id_socio:
          selectedSocioForHistorial.id_socio,
        multa_hoja: true,
        monto_multa_hoja: Number(
          montoMultaPrestamo
        ),
        fecha_hora: fechaHoraLocal,
      };

      const multaResponse = await fetch(
        `${SUPABASE_URL}/rest/v1/pago_multas`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
            Prefer: 'return=representation',
          },
          body: JSON.stringify(multaBody),
        }
      );

      if (!multaResponse.ok) {
        console.warn(
          'El pago se registró, pero no se pudo registrar la multa.'
        );
      }
    }

    setShowConfirmPagoPrestamo(false);
    setShowPagoPrestamoModal(false);
    setPagoPrestamoTarget(null);
    setMontoPagoPrestamo('');
    setFormaPagoPrestamo('');
    setNotaPagoPrestamo('');
    setMultaHojaPrestamo('no');
    setMontoMultaPrestamo('');

    // Recargar el historial del mismo préstamo
    await handleVerDetallesPrestamo(
      selectedPrestamo
    );

    await fetchGlobalPrestamoStats();

    setToastMessage(
      'Pago registrado correctamente.'
    );

    setTimeout(
      () => setToastMessage(''),
      3000
    );
  } catch (errorPago) {
    console.error(
      'ERROR REGISTRANDO PAGO DESDE PRÉSTAMOS:',
      errorPago
    );

    alert(
      errorPago.message ||
        'No se pudo registrar el pago.'
    );
  } finally {
    setGuardandoPagoPrestamo(false);
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

  const handleDeletePrestamo = async (prestamoId) => {
    if (!window.confirm('¿Eliminar este préstamo? Esta acción no se puede deshacer.')) return;
    setLoading(true);
    setError(null);
    setToastMessage('');
    try {
      const deletePagosResponse = await fetch(
        `${SUPABASE_URL}/rest/v1/pagos_prestamos?id_prestamo=eq.${prestamoId}`,
        { method: 'DELETE', headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } }
      );
      if (!deletePagosResponse.ok) throw new Error('Error al eliminar pagos relacionados');

      const deletePrestamoResponse = await fetch(
        `${SUPABASE_URL}/rest/v1/prestamos?id_prestamo=eq.${prestamoId}`,
        { method: 'DELETE', headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } }
      );
      if (!deletePrestamoResponse.ok) throw new Error('Error al eliminar el préstamo');

      setToastMessage('Préstamo eliminado exitosamente.');
      if (selectedSocioForHistorial) {
        if (showEditPrestamosModal) await handleEditarPrestamosSocio(selectedSocioForHistorial);
        if (showPrestamoHistorial) await handleVerHistorialPrestamosSocio(selectedSocioForHistorial);
      }
      fetchGlobalPrestamoStats();
      if (!idSocio) fetchAllSociosConPrestamoActivo();
      else fetchPrestamosForUser(idSocio);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setTimeout(() => setToastMessage(''), 3000);
    }
  };

  // --- Modal: reacciones/calculadora ---
  useEffect(() => {
    const pago = calcularPagoRequerido(
      newPrestamo.monto_solicitado,
      newPrestamo.interes,
      newPrestamo.numero_plazos
    );
    setPagoPeriodo(pago);
    const interesEst = (Number(newPrestamo.monto_solicitado || 0) * (Number(newPrestamo.interes || 0) / 100));
    setInteresPeriodoEstimado(interesEst);
    setAbonoCapitalPeriodo(Math.max(0, pago - interesEst));
  }, [newPrestamo.monto_solicitado, newPrestamo.interes, newPrestamo.numero_plazos]);

  useEffect(() => {
    if (idSocio && sociosList && sociosList.length) {
      setNewPrestamo((prev) => ({ ...prev, id_socio: idSocio }));
    }
  }, [idSocio, sociosList]);

// ======================================================
// =============== SUBIR DOCUMENTO ======================
// ======================================================

const subirDocumentoPrestamo = async ({
  file,
  idPrestamo,
  carpeta,
  prefijo,
}) => {
  if (!file) return null;

  const tiposPermitidos = [
    'application/pdf',
    'image/jpeg',
    'image/png',
  ];

  if (!tiposPermitidos.includes(file.type)) {
    throw new Error(
      'Solo se permiten archivos PDF, JPG o PNG.'
    );
  }

  const maxSize = 10 * 1024 * 1024;

  if (file.size > maxSize) {
    throw new Error(
      'El archivo no puede superar los 10 MB.'
    );
  }

  const extension =
    file.name.split('.').pop()?.toLowerCase() || 'bin';

  const nombreArchivo =
    `${prefijo}_${Date.now()}.${extension}`;

  const path =
    `prestamo_${idPrestamo}/${carpeta}/${nombreArchivo}`;

  const response = await fetch(
    `${SUPABASE_URL}/storage/v1/object/documentos-prestamos/${path}`,
    {
      method: 'POST',

      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type':
          file.type || 'application/octet-stream',

        'x-upsert': 'false',
      },

      body: file,
    }
  );

  if (!response.ok) {
    const detalle = await response.text();

    throw new Error(
      `No se pudo subir el documento. Detalle: ${detalle}`
    );
  }

  return path;
};
  
  const resetNuevoPrestamo = () => {
 setNewPrestamo({
  id_socio: idSocio || '',

  tipo_fuente_ingreso: '',

  empleado_nombre_empresa: '',

  empleado_empresa_calle: '',
  empleado_empresa_numero: '',
  empleado_empresa_edificio: '',
  empleado_empresa_colonia: '',
  empleado_empresa_estado: '',
  empleado_empresa_pais: '',
  empleado_empresa_municipio: '',
  empleado_empresa_cp: '',
  empleado_empresa_entre_calles: '',
  empleado_empresa_referencias: '',

  empleado_ocupacion: '',
  empleado_tiempo_anios: '',
  empleado_tiempo_meses: '',
  empleado_tipo_contrato: '',
  empleado_ingreso_mensual_neto: '',
  empleado_comprueba_ingresos: '',
  empleado_tipo_comprobante: '',

  negocio_tipo: '',
  negocio_tiempo_anios: '',
  negocio_tiempo_meses: '',

  negocio_calle: '',
  negocio_numero: '',
  negocio_edificio: '',
  negocio_colonia: '',
  negocio_estado: '',
  negocio_pais: '',
  negocio_municipio: '',
  negocio_cp: '',
  negocio_entre_calles: '',
  negocio_referencias: '',

  negocio_formal: '',
  negocio_num_empleados: '',
  negocio_gastos_mensuales: '',
  negocio_utilidad_aproximada: '',

  monto_solicitado: '',
  numero_plazos: '',
  tipo_plazo: 'mensual',
  interes: '',
  fecha_solicitud: ''
});

setEvaluacionCrediticia({
  capacidad_pago_periodicidad: '',
  capacidad_pago_monto: '',

  destino_dinero: '',
  uso_generara_ingresos: '',
  tiempo_recuperacion: '',
  riesgo_si_no_funciona: '',

  otros_ingresos: '',
  accion_si_no_puede_pagar: '',
  accion_si_sin_ingresos_mes: '',
  accion_emergencia_fuerte: '',

  fuente_pago_prestamo: '',

  cuenta_con_aval: false,

  tiene_redes_sociales: '',
  redes_sociales_detalle: '',

  tiene_automovil: '',
  tiene_propiedades: '',

  garantia_declarada: '',
});

setAvalPrestamo({
  nombre: '',
  edad: '',
  celular: '',
  ocupacion: '',

  domicilio_calle: '',
  domicilio_numero: '',
  domicilio_edificio: '',
  domicilio_colonia: '',
  domicilio_estado: '',
  domicilio_pais: '',
  domicilio_municipio: '',
  domicilio_cp: '',
  domicilio_entre_calles: '',
  domicilio_referencias: '',

  tiene_redes_sociales: '',
  redes_sociales_detalle: '',
});

setGarantiasPrestamo({
  propiedad_pertenece_a: 'SOLICITANTE',
  vehiculo_pertenece_a: 'SOLICITANTE',
  otro_pertenece_a: 'SOLICITANTE',

  propiedad_calle: '',
  propiedad_numero: '',
  propiedad_edificio: '',
  propiedad_colonia: '',
  propiedad_estado: '',
  propiedad_pais: '',
  propiedad_municipio: '',
  propiedad_cp: '',
  propiedad_entre_calles: '',
  propiedad_referencias: '',
  propiedad_tipo: '',
  propiedad_valor_estimado: '',
  propiedad_documentacion: '',
  propiedad_gravamenes: '',

  vehiculo_marca: '',
  vehiculo_modelo: '',
  vehiculo_anio: '',
  vehiculo_valor_estimado: '',
  vehiculo_documentacion: '',
  vehiculo_gravamenes: '',

  tiene_otro_activo: '',
  otro_tipo: '',
  otro_descripcion: '',
  otro_valor_estimado: '',
});

setArchivoIdentificacionAval(null);
setArchivoDocumentoPropiedad(null);
    setArchivoDocumentoVehiculo(null);

    setErroresFormulario({});
    
    setPagoPeriodo(0);
    setInteresPeriodoEstimado(0);
    setAbonoCapitalPeriodo(0);
  };

  const handleCreatePrestamo = async () => {
    if (!newPrestamo.id_socio) return alert('Selecciona un socio.');
    if (!newPrestamo.tipo_fuente_ingreso) {
  return alert(
    'Seleccione si el socio es empleado o tiene negocio propio.'
  );
}

if (newPrestamo.tipo_fuente_ingreso === 'EMPLEADO') {
  if (!newPrestamo.empleado_nombre_empresa.trim()) {
    return alert('Indique el nombre de la empresa.');
  }

  if (!newPrestamo.empleado_ocupacion.trim()) {
    return alert('Indique la ocupación actual.');
  }

  if (!newPrestamo.empleado_ingreso_mensual_neto) {
    return alert('Indique el ingreso mensual neto.');
  }

  if (!newPrestamo.empleado_comprueba_ingresos) {
    return alert('Indique si puede comprobar ingresos.');
  }

  if (
    newPrestamo.empleado_comprueba_ingresos === 'SI' &&
    !newPrestamo.empleado_tipo_comprobante.trim()
  ) {
    return alert('Indique el tipo de comprobante.');
  }
}

if (newPrestamo.tipo_fuente_ingreso === 'NEGOCIO_PROPIO') {
  if (!newPrestamo.negocio_tipo.trim()) {
    return alert('Indique el tipo de negocio.');
  }

  if (!newPrestamo.negocio_formal) {
    return alert('Indique si el negocio es formal.');
  }

  if (!newPrestamo.negocio_num_empleados) {
    return alert('Indique cuántos empleados tiene.');
  }

  if (!newPrestamo.negocio_utilidad_aproximada) {
    return alert('Indique la utilidad aproximada.');
  }
}

// ================= VALIDACIÓN EVALUACIÓN CREDITICIA =================
if (!evaluacionCrediticia.capacidad_pago_periodicidad) {
  return alert(
    'Seleccione la periodicidad del pago máximo que puede realizar.'
  );
}

if (
  !evaluacionCrediticia.capacidad_pago_monto ||
  Number(evaluacionCrediticia.capacidad_pago_monto) <= 0
) {
  return alert(
    'Indique el monto máximo que puede pagar sin atrasarse.'
  );
}

if (!evaluacionCrediticia.destino_dinero.trim()) {
  return alert('Indique para qué necesita el dinero.');
}

if (!evaluacionCrediticia.uso_generara_ingresos) {
  return alert(
    'Indique si el uso del préstamo generará ingresos.'
  );
}

if (!evaluacionCrediticia.riesgo_si_no_funciona.trim()) {
  return alert(
    'Indique qué pasaría si el negocio, plan o proyecto no funciona.'
  );
}

if (!evaluacionCrediticia.accion_si_no_puede_pagar.trim()) {
  return alert(
    'Indique qué haría si no puede pagar una mensualidad.'
  );
}

if (!evaluacionCrediticia.accion_si_sin_ingresos_mes.trim()) {
  return alert(
    'Indique qué pasaría si deja de recibir dinero un mes.'
  );
}

if (!evaluacionCrediticia.accion_emergencia_fuerte.trim()) {
  return alert(
    'Indique cómo resolvería una emergencia fuerte.'
  );
}

if (!evaluacionCrediticia.fuente_pago_prestamo.trim()) {
  return alert(
    'Debe indicar exactamente de dónde saldrá el dinero para pagar el préstamo.'
  );
}


// ================= VALIDACIÓN AVAL =================
if (evaluacionCrediticia.cuenta_con_aval) {
  if (!avalPrestamo.nombre.trim()) {
    return alert('Indique el nombre del aval.');
  }

  if (!avalPrestamo.edad) {
    return alert('Indique la edad del aval.');
  }

  if (!avalPrestamo.celular.trim()) {
    return alert('Indique el celular del aval.');
  }

  if (!avalPrestamo.ocupacion.trim()) {
    return alert('Indique a qué se dedica el aval.');
  }
if (!archivoIdentificacionAval) {
  return alert(
    'Debe adjuntar una copia de la identificación del aval.'
  );
}
}  

// ================= VALIDACIÓN GARANTÍAS =================

// PROPIEDAD
if (evaluacionCrediticia.tiene_propiedades === 'SI') {

  if (!garantiasPrestamo.propiedad_tipo) {
    return alert(
      'Seleccione el tipo de propiedad.'
    );
  }

  if (!garantiasPrestamo.propiedad_calle.trim()) {
    return alert(
      'Indique la dirección de la propiedad.'
    );
  }

  if (
    !garantiasPrestamo.propiedad_valor_estimado ||
    Number(garantiasPrestamo.propiedad_valor_estimado) <= 0
  ) {
    return alert(
      'Indique el valor estimado de la propiedad.'
    );
  }
  if (!archivoDocumentoPropiedad) {
  return alert(
    'Debe adjuntar el documento que acredita la propiedad.'
  );
}
}


// VEHÍCULO
if (evaluacionCrediticia.tiene_automovil === 'SI') {

  if (!garantiasPrestamo.vehiculo_marca.trim()) {
    return alert(
      'Indique la marca del vehículo.'
    );
  }

  if (!garantiasPrestamo.vehiculo_modelo.trim()) {
    return alert(
      'Indique el modelo del vehículo.'
    );
  }

  if (!garantiasPrestamo.vehiculo_anio) {
    return alert(
      'Indique el año del vehículo.'
    );
  }

  if (
    !garantiasPrestamo.vehiculo_valor_estimado ||
    Number(garantiasPrestamo.vehiculo_valor_estimado) <= 0
  ) {
    return alert(
      'Indique el valor estimado del vehículo.'
    );
  }
if (!archivoDocumentoVehiculo) {
  return alert(
    'Debe adjuntar el documento que acredita la propiedad del vehículo.'
  );
}
  
}


// OTRO ACTIVO
if (garantiasPrestamo.tiene_otro_activo === 'SI') {

  if (!garantiasPrestamo.otro_tipo.trim()) {
    return alert(
      'Indique qué tipo de activo dejará en garantía.'
    );
  }

  if (!garantiasPrestamo.otro_descripcion.trim()) {
    return alert(
      'Describa el activo que dejará en garantía.'
    );
  }

  if (
    !garantiasPrestamo.otro_valor_estimado ||
    Number(garantiasPrestamo.otro_valor_estimado) <= 0
  ) {
    return alert(
      'Indique el valor estimado del activo.'
    );
  }
}
    
    if (!newPrestamo.monto_solicitado || Number(newPrestamo.monto_solicitado) <= 0) return alert('Monto inválido.');
    if (!newPrestamo.numero_plazos || Number(newPrestamo.numero_plazos) <= 0) return alert('Plazos inválidos.');
    if (newPrestamo.interes === '' || Number(newPrestamo.interes) < 0) return alert('Interés por periodo inválido.');

    // ======================================================
// ========= VALIDACIÓN FINAL DE DOCUMENTOS =============
// ======================================================

const erroresArchivos = {};

if (evaluacionCrediticia.cuenta_con_aval) {
  const errorAval = validarArchivoPrestamo(
    archivoIdentificacionAval
  );

  if (errorAval) {
    erroresArchivos.identificacionAval = errorAval;
  }
}

if (evaluacionCrediticia.tiene_propiedades === 'SI') {
  const errorPropiedad = validarArchivoPrestamo(
    archivoDocumentoPropiedad
  );

  if (errorPropiedad) {
    erroresArchivos.documentoPropiedad = errorPropiedad;
  }
}

if (evaluacionCrediticia.tiene_automovil === 'SI') {
  const errorVehiculo = validarArchivoPrestamo(
    archivoDocumentoVehiculo
  );

  if (errorVehiculo) {
    erroresArchivos.documentoVehiculo = errorVehiculo;
  }
}

if (Object.keys(erroresArchivos).length > 0) {
  setErroresFormulario((prev) => ({
    ...prev,
    ...erroresArchivos,
  }));

  alert(
    'Hay documentos pendientes o incorrectos. Revise los campos marcados en rojo.'
  );

  return;
}

    const fechaSolicitudISO = toISODate(newPrestamo.fecha_solicitud);
    const nPlazos = Number(newPrestamo.numero_plazos);
    const pagoRequerido = Number(pagoPeriodo.toFixed(2));
    const fechaVencimientoISO = addPeriod(fechaSolicitudISO, newPrestamo.tipo_plazo, nPlazos);

let idPrestamoCreado = null;
    
    setSubmitting(true);
    try {
      // 1) Insert préstamo (incluye fecha_vencimiento si tu tabla la usa)
     const bodyPrestamo = {
  id_socio: Number(newPrestamo.id_socio),

  // ================= INFORMACIÓN LABORAL =================
  tipo_fuente_ingreso:
    newPrestamo.tipo_fuente_ingreso,

  // ================= EMPLEADO =================
  empleado_nombre_empresa:
    newPrestamo.tipo_fuente_ingreso === 'EMPLEADO'
      ? newPrestamo.empleado_nombre_empresa.trim().toUpperCase()
      : null,

  empleado_empresa_calle:
    newPrestamo.tipo_fuente_ingreso === 'EMPLEADO'
      ? newPrestamo.empleado_empresa_calle.trim().toUpperCase()
      : null,

  empleado_empresa_numero:
    newPrestamo.tipo_fuente_ingreso === 'EMPLEADO'
      ? newPrestamo.empleado_empresa_numero.trim().toUpperCase()
      : null,

  empleado_empresa_edificio:
    newPrestamo.tipo_fuente_ingreso === 'EMPLEADO'
      ? newPrestamo.empleado_empresa_edificio.trim().toUpperCase() || null
      : null,

  empleado_empresa_colonia:
    newPrestamo.tipo_fuente_ingreso === 'EMPLEADO'
      ? newPrestamo.empleado_empresa_colonia.trim().toUpperCase()
      : null,

  empleado_empresa_estado:
    newPrestamo.tipo_fuente_ingreso === 'EMPLEADO'
      ? newPrestamo.empleado_empresa_estado
      : null,

  empleado_empresa_pais:
    newPrestamo.tipo_fuente_ingreso === 'EMPLEADO'
      ? (
          newPrestamo.empleado_empresa_estado === 'EXTRANJERO'
            ? newPrestamo.empleado_empresa_pais.trim().toUpperCase()
            : 'MÉXICO'
        )
      : null,

  empleado_empresa_municipio:
    newPrestamo.tipo_fuente_ingreso === 'EMPLEADO'
      ? newPrestamo.empleado_empresa_municipio.trim().toUpperCase()
      : null,

  empleado_empresa_cp:
    newPrestamo.tipo_fuente_ingreso === 'EMPLEADO'
      ? newPrestamo.empleado_empresa_cp
      : null,

  empleado_empresa_entre_calles:
    newPrestamo.tipo_fuente_ingreso === 'EMPLEADO'
      ? newPrestamo.empleado_empresa_entre_calles.trim().toUpperCase()
      : null,

  empleado_empresa_referencias:
    newPrestamo.tipo_fuente_ingreso === 'EMPLEADO'
      ? newPrestamo.empleado_empresa_referencias.trim().toUpperCase()
      : null,

  empleado_ocupacion:
    newPrestamo.tipo_fuente_ingreso === 'EMPLEADO'
      ? newPrestamo.empleado_ocupacion.trim().toUpperCase()
      : null,

  empleado_tiempo_anios:
    newPrestamo.tipo_fuente_ingreso === 'EMPLEADO' &&
    newPrestamo.empleado_tiempo_anios
      ? Number(newPrestamo.empleado_tiempo_anios)
      : null,

  empleado_tiempo_meses:
    newPrestamo.tipo_fuente_ingreso === 'EMPLEADO' &&
    newPrestamo.empleado_tiempo_meses
      ? Number(newPrestamo.empleado_tiempo_meses)
      : null,

  empleado_tipo_contrato:
    newPrestamo.tipo_fuente_ingreso === 'EMPLEADO'
      ? newPrestamo.empleado_tipo_contrato.trim().toUpperCase()
      : null,

  empleado_ingreso_mensual_neto:
    newPrestamo.tipo_fuente_ingreso === 'EMPLEADO'
      ? Number(newPrestamo.empleado_ingreso_mensual_neto || 0)
      : null,

  empleado_comprueba_ingresos:
    newPrestamo.tipo_fuente_ingreso === 'EMPLEADO'
      ? newPrestamo.empleado_comprueba_ingresos
      : null,

  empleado_tipo_comprobante:
    newPrestamo.tipo_fuente_ingreso === 'EMPLEADO' &&
    newPrestamo.empleado_comprueba_ingresos === 'SI'
      ? newPrestamo.empleado_tipo_comprobante.trim().toUpperCase()
      : null,


  // ================= NEGOCIO PROPIO =================
  negocio_tipo:
    newPrestamo.tipo_fuente_ingreso === 'NEGOCIO_PROPIO'
      ? newPrestamo.negocio_tipo.trim().toUpperCase()
      : null,

  negocio_tiempo_anios:
    newPrestamo.tipo_fuente_ingreso === 'NEGOCIO_PROPIO' &&
    newPrestamo.negocio_tiempo_anios
      ? Number(newPrestamo.negocio_tiempo_anios)
      : null,

  negocio_tiempo_meses:
    newPrestamo.tipo_fuente_ingreso === 'NEGOCIO_PROPIO' &&
    newPrestamo.negocio_tiempo_meses
      ? Number(newPrestamo.negocio_tiempo_meses)
      : null,

  negocio_calle:
    newPrestamo.tipo_fuente_ingreso === 'NEGOCIO_PROPIO'
      ? newPrestamo.negocio_calle.trim().toUpperCase()
      : null,

  negocio_numero:
    newPrestamo.tipo_fuente_ingreso === 'NEGOCIO_PROPIO'
      ? newPrestamo.negocio_numero.trim().toUpperCase()
      : null,

  negocio_edificio:
    newPrestamo.tipo_fuente_ingreso === 'NEGOCIO_PROPIO'
      ? newPrestamo.negocio_edificio.trim().toUpperCase() || null
      : null,

  negocio_colonia:
    newPrestamo.tipo_fuente_ingreso === 'NEGOCIO_PROPIO'
      ? newPrestamo.negocio_colonia.trim().toUpperCase()
      : null,

  negocio_estado:
    newPrestamo.tipo_fuente_ingreso === 'NEGOCIO_PROPIO'
      ? newPrestamo.negocio_estado
      : null,

  negocio_pais:
    newPrestamo.tipo_fuente_ingreso === 'NEGOCIO_PROPIO'
      ? (
          newPrestamo.negocio_estado === 'EXTRANJERO'
            ? newPrestamo.negocio_pais.trim().toUpperCase()
            : 'MÉXICO'
        )
      : null,

  negocio_municipio:
    newPrestamo.tipo_fuente_ingreso === 'NEGOCIO_PROPIO'
      ? newPrestamo.negocio_municipio.trim().toUpperCase()
      : null,

  negocio_cp:
    newPrestamo.tipo_fuente_ingreso === 'NEGOCIO_PROPIO'
      ? newPrestamo.negocio_cp
      : null,

  negocio_entre_calles:
    newPrestamo.tipo_fuente_ingreso === 'NEGOCIO_PROPIO'
      ? newPrestamo.negocio_entre_calles.trim().toUpperCase()
      : null,

  negocio_referencias:
    newPrestamo.tipo_fuente_ingreso === 'NEGOCIO_PROPIO'
      ? newPrestamo.negocio_referencias.trim().toUpperCase()
      : null,

  negocio_formal:
    newPrestamo.tipo_fuente_ingreso === 'NEGOCIO_PROPIO'
      ? newPrestamo.negocio_formal
      : null,

  negocio_num_empleados:
    newPrestamo.tipo_fuente_ingreso === 'NEGOCIO_PROPIO'
      ? newPrestamo.negocio_num_empleados
      : null,

  negocio_gastos_mensuales:
    newPrestamo.tipo_fuente_ingreso === 'NEGOCIO_PROPIO'
      ? newPrestamo.negocio_gastos_mensuales.trim().toUpperCase()
      : null,

  negocio_utilidad_aproximada:
    newPrestamo.tipo_fuente_ingreso === 'NEGOCIO_PROPIO'
      ? Number(newPrestamo.negocio_utilidad_aproximada || 0)
      : null,


  // ================= PRÉSTAMO ACTUAL =================
  monto_solicitado:
    Number(newPrestamo.monto_solicitado),

  numero_plazos:
    nPlazos,

  tipo_plazo:
    newPrestamo.tipo_plazo,

  interes:
    Number(newPrestamo.interes),

  fecha_solicitud:
    fechaSolicitudISO,

  fecha_vencimiento:
    fechaVencimientoISO,

  pago_requerido:
    pagoRequerido,

  estatus:
    'activo'
};

      const rPrest = await fetch(`${SUPABASE_URL}/rest/v1/prestamos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          Prefer: 'return=representation'
        },
        body: JSON.stringify(bodyPrestamo)
      });

      if (!rPrest.ok) {
        const msg = await rPrest.text();
        throw new Error(`No se pudo registrar el préstamo. Detalle: ${msg}`);
      }

      const prestInsert = await rPrest.json();
      const prestamo = prestInsert[0];
      const id_prestamo = prestamo?.id_prestamo;
      
      idPrestamoCreado = id_prestamo;

if (!id_prestamo) {
  throw new Error(
    'El préstamo fue registrado pero no se obtuvo su ID.'
  );
}

// ======================================================
// ============== SUBIR ARCHIVOS ========================
// ======================================================

let identificacionAvalPath = null;
let documentoPropiedadPath = null;
let documentoVehiculoPath = null;

// Identificación del aval
if (
  evaluacionCrediticia.cuenta_con_aval &&
  archivoIdentificacionAval
) {
  identificacionAvalPath =
    await subirDocumentoPrestamo({
      file: archivoIdentificacionAval,
      idPrestamo: id_prestamo,
      carpeta: 'aval',
      prefijo: 'identificacion_aval',
    });
}

// Documento de propiedad
if (
  evaluacionCrediticia.tiene_propiedades === 'SI' &&
  archivoDocumentoPropiedad
) {
  documentoPropiedadPath =
    await subirDocumentoPrestamo({
      file: archivoDocumentoPropiedad,
      idPrestamo: id_prestamo,
      carpeta: 'propiedad',
      prefijo: 'documento_propiedad',
    });
}

// Documento del vehículo
if (
  evaluacionCrediticia.tiene_automovil === 'SI' &&
  archivoDocumentoVehiculo
) {
  documentoVehiculoPath =
    await subirDocumentoPrestamo({
      file: archivoDocumentoVehiculo,
      idPrestamo: id_prestamo,
      carpeta: 'vehiculo',
      prefijo: 'documento_vehiculo',
    });
}
      
// ======================================================
// ============ GUARDAR EVALUACIÓN CREDITICIA ==========
// ======================================================

const evaluacionBody = {
  id_prestamo,
  id_socio: Number(newPrestamo.id_socio),

  capacidad_pago_periodicidad:
    evaluacionCrediticia.capacidad_pago_periodicidad,

  capacidad_pago_monto:
    Number(
      evaluacionCrediticia.capacidad_pago_monto
    ),

  destino_dinero:
    evaluacionCrediticia.destino_dinero
      .trim()
      .toUpperCase(),

  uso_generara_ingresos:
    evaluacionCrediticia.uso_generara_ingresos === 'SI',

  tiempo_recuperacion:
    evaluacionCrediticia.uso_generara_ingresos === 'SI'
      ? evaluacionCrediticia.tiempo_recuperacion
          .trim()
          .toUpperCase() || null
      : null,

  riesgo_si_no_funciona:
    evaluacionCrediticia.riesgo_si_no_funciona
      .trim()
      .toUpperCase(),

  otros_ingresos:
    evaluacionCrediticia.otros_ingresos
      .trim()
      .toUpperCase() || null,

  accion_si_no_puede_pagar:
    evaluacionCrediticia.accion_si_no_puede_pagar
      .trim()
      .toUpperCase(),

  accion_si_sin_ingresos_mes:
    evaluacionCrediticia.accion_si_sin_ingresos_mes
      .trim()
      .toUpperCase(),

  accion_emergencia_fuerte:
    evaluacionCrediticia.accion_emergencia_fuerte
      .trim()
      .toUpperCase(),

  fuente_pago_prestamo:
    evaluacionCrediticia.fuente_pago_prestamo
      .trim()
      .toUpperCase(),

  cuenta_con_aval:
    evaluacionCrediticia.cuenta_con_aval,

  tiene_redes_sociales:
    evaluacionCrediticia.tiene_redes_sociales === 'SI'
      ? true
      : evaluacionCrediticia.tiene_redes_sociales === 'NO'
      ? false
      : null,

  redes_sociales_detalle:
    evaluacionCrediticia.tiene_redes_sociales === 'SI'
      ? evaluacionCrediticia.redes_sociales_detalle
          .trim()
          .toUpperCase() || null
      : null,

  tiene_automovil:
    evaluacionCrediticia.tiene_automovil === 'SI'
      ? true
      : evaluacionCrediticia.tiene_automovil === 'NO'
      ? false
      : null,

  tiene_propiedades:
    evaluacionCrediticia.tiene_propiedades === 'SI'
      ? true
      : evaluacionCrediticia.tiene_propiedades === 'NO'
      ? false
      : null,

  garantia_declarada:
    evaluacionCrediticia.garantia_declarada
      .trim()
      .toUpperCase() || null,
};


const rEvaluacion = await fetch(
  `${SUPABASE_URL}/rest/v1/evaluaciones_crediticias`,
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      Prefer: 'return=minimal',
    },
    body: JSON.stringify(evaluacionBody),
  }
);

if (!rEvaluacion.ok) {
  const detalle =
    await rEvaluacion.text();

  throw new Error(
    `El préstamo se creó, pero no se pudo guardar la evaluación crediticia. Detalle: ${detalle}`
  );
}


// ======================================================
// ================= GUARDAR AVAL =======================
// ======================================================

if (evaluacionCrediticia.cuenta_con_aval) {

  const avalBody = {
    id_prestamo,
    id_socio: Number(newPrestamo.id_socio),
    identificacion_path:
  identificacionAvalPath,

    nombre:
      avalPrestamo.nombre
        .trim()
        .toUpperCase(),

    edad:
      Number(avalPrestamo.edad),

    celular:
      avalPrestamo.celular.trim(),

    ocupacion:
      avalPrestamo.ocupacion
        .trim()
        .toUpperCase(),

    domicilio_calle:
      avalPrestamo.domicilio_calle
        .trim()
        .toUpperCase(),

    domicilio_numero:
      avalPrestamo.domicilio_numero
        .trim()
        .toUpperCase(),

    domicilio_edificio:
      avalPrestamo.domicilio_edificio
        .trim()
        .toUpperCase() || null,

    domicilio_colonia:
      avalPrestamo.domicilio_colonia
        .trim()
        .toUpperCase(),

    domicilio_estado:
      avalPrestamo.domicilio_estado || null,

    domicilio_pais:
      avalPrestamo.domicilio_estado === 'EXTRANJERO'
        ? avalPrestamo.domicilio_pais
            .trim()
            .toUpperCase()
        : 'MÉXICO',

    domicilio_municipio:
      avalPrestamo.domicilio_municipio
        .trim()
        .toUpperCase(),

    domicilio_cp:
      avalPrestamo.domicilio_cp.trim(),

    domicilio_entre_calles:
      avalPrestamo.domicilio_entre_calles
        .trim()
        .toUpperCase() || null,

    domicilio_referencias:
      avalPrestamo.domicilio_referencias
        .trim()
        .toUpperCase() || null,

    tiene_redes_sociales:
      avalPrestamo.tiene_redes_sociales === 'SI'
        ? true
        : avalPrestamo.tiene_redes_sociales === 'NO'
        ? false
        : null,

    redes_sociales_detalle:
      avalPrestamo.tiene_redes_sociales === 'SI'
        ? avalPrestamo.redes_sociales_detalle
            .trim()
            .toUpperCase() || null
        : null,
  };


  const rAval = await fetch(
    `${SUPABASE_URL}/rest/v1/avales_prestamos`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        Prefer: 'return=minimal',
      },
      body: JSON.stringify(avalBody),
    }
  );

  if (!rAval.ok) {
    const detalle =
      await rAval.text();

    throw new Error(
      `El préstamo se creó, pero no se pudo guardar el aval. Detalle: ${detalle}`
    );
  }
}

// ======================================================
// =============== GUARDAR GARANTÍAS ===================
// ======================================================

const garantiasParaGuardar = [];

// PROPIEDAD
if (evaluacionCrediticia.tiene_propiedades === 'SI') {
  garantiasParaGuardar.push({
    id_prestamo,
    id_socio: Number(newPrestamo.id_socio),

    pertenece_a: garantiasPrestamo.propiedad_pertenece_a,
    tipo_garantia: 'PROPIEDAD',

    documento_path:
  documentoPropiedadPath,

    descripcion:
      `PROPIEDAD ${garantiasPrestamo.propiedad_tipo}`,

    valor_estimado:
      Number(garantiasPrestamo.propiedad_valor_estimado),

    propiedad_calle:
      garantiasPrestamo.propiedad_calle.trim().toUpperCase(),

    propiedad_numero:
      garantiasPrestamo.propiedad_numero.trim().toUpperCase(),

    propiedad_edificio:
      garantiasPrestamo.propiedad_edificio.trim().toUpperCase() || null,

    propiedad_colonia:
      garantiasPrestamo.propiedad_colonia.trim().toUpperCase(),

    propiedad_estado:
      garantiasPrestamo.propiedad_estado || null,

    propiedad_pais:
      garantiasPrestamo.propiedad_estado === 'EXTRANJERO'
        ? garantiasPrestamo.propiedad_pais.trim().toUpperCase()
        : 'MÉXICO',

    propiedad_municipio:
      garantiasPrestamo.propiedad_municipio.trim().toUpperCase(),

    propiedad_cp:
      garantiasPrestamo.propiedad_cp.trim(),

    propiedad_entre_calles:
      garantiasPrestamo.propiedad_entre_calles.trim().toUpperCase() || null,

    propiedad_referencias:
      garantiasPrestamo.propiedad_referencias.trim().toUpperCase() || null,

    propiedad_tipo:
      garantiasPrestamo.propiedad_tipo,

    propiedad_documentacion:
      garantiasPrestamo.propiedad_documentacion.trim().toUpperCase() || null,

    propiedad_gravamenes:
      garantiasPrestamo.propiedad_gravamenes.trim().toUpperCase() || null,

    vehiculo_marca: null,
    vehiculo_modelo: null,
    vehiculo_anio: null,
    vehiculo_documentacion: null,
    vehiculo_gravamenes: null,

    otro_tipo: null,
    otro_descripcion: null,
  });
}

// VEHÍCULO
if (evaluacionCrediticia.tiene_automovil === 'SI') {
  garantiasParaGuardar.push({
    id_prestamo,
    id_socio: Number(newPrestamo.id_socio),

    pertenece_a: garantiasPrestamo.vehiculo_pertenece_a,
    tipo_garantia: 'VEHICULO',
    documento_path:
  documentoVehiculoPath,

    descripcion:
      `${garantiasPrestamo.vehiculo_marca} ${garantiasPrestamo.vehiculo_modelo}`
        .trim()
        .toUpperCase(),

    valor_estimado:
      Number(garantiasPrestamo.vehiculo_valor_estimado),

    propiedad_calle: null,
    propiedad_numero: null,
    propiedad_edificio: null,
    propiedad_colonia: null,
    propiedad_estado: null,
    propiedad_pais: null,
    propiedad_municipio: null,
    propiedad_cp: null,
    propiedad_entre_calles: null,
    propiedad_referencias: null,
    propiedad_tipo: null,
    propiedad_documentacion: null,
    propiedad_gravamenes: null,

    vehiculo_marca:
      garantiasPrestamo.vehiculo_marca.trim().toUpperCase(),

    vehiculo_modelo:
      garantiasPrestamo.vehiculo_modelo.trim().toUpperCase(),

    vehiculo_anio:
      Number(garantiasPrestamo.vehiculo_anio),

    vehiculo_documentacion:
      garantiasPrestamo.vehiculo_documentacion.trim().toUpperCase() || null,

    vehiculo_gravamenes:
      garantiasPrestamo.vehiculo_gravamenes.trim().toUpperCase() || null,

    otro_tipo: null,
    otro_descripcion: null,
  });
}

// OTRO ACTIVO
if (garantiasPrestamo.tiene_otro_activo === 'SI') {
  garantiasParaGuardar.push({
    id_prestamo,
    id_socio: Number(newPrestamo.id_socio),

    pertenece_a: garantiasPrestamo.otro_pertenece_a,
    tipo_garantia: 'OTRO',
    documento_path: null,

    descripcion:
      garantiasPrestamo.otro_descripcion.trim().toUpperCase(),

    valor_estimado:
      Number(garantiasPrestamo.otro_valor_estimado),

    propiedad_calle: null,
    propiedad_numero: null,
    propiedad_edificio: null,
    propiedad_colonia: null,
    propiedad_estado: null,
    propiedad_pais: null,
    propiedad_municipio: null,
    propiedad_cp: null,
    propiedad_entre_calles: null,
    propiedad_referencias: null,
    propiedad_tipo: null,
    propiedad_documentacion: null,
    propiedad_gravamenes: null,

    vehiculo_marca: null,
    vehiculo_modelo: null,
    vehiculo_anio: null,
    vehiculo_documentacion: null,
    vehiculo_gravamenes: null,

    otro_tipo:
      garantiasPrestamo.otro_tipo.trim().toUpperCase(),

    otro_descripcion:
      garantiasPrestamo.otro_descripcion.trim().toUpperCase(),
  });
}

if (garantiasParaGuardar.length > 0) {
  const rGarantias = await fetch(
    `${SUPABASE_URL}/rest/v1/garantias_prestamos`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        Prefer: 'return=minimal',
      },
      body: JSON.stringify(garantiasParaGuardar),
    }
  );

  if (!rGarantias.ok) {
    const detalle = await rGarantias.text();

    throw new Error(
      `El préstamo se creó, pero no se pudieron guardar las garantías. Detalle: ${detalle}`
    );
  }
}
      
      // 2) Generar corrida
      const pagos = [];
      for (let k = 1; k <= nPlazos; k++) {
        const fecha_programada = addPeriod(fechaSolicitudISO, newPrestamo.tipo_plazo, k);
        pagos.push({
          id_prestamo,
          numero_pago: k,
          fecha_programada,
          monto_pago: pagoRequerido,
          fecha_pago: null,
          fecha_hora_pago: null,
          monto_pagado: null,
          interes_pagado: null,
          capital_pagado: null,
          estatus: 'pendiente'
        });
      }

      const rPagos = await fetch(`${SUPABASE_URL}/rest/v1/pagos_prestamos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          Prefer: 'return=minimal'
        },
        body: JSON.stringify(pagos)
      });
      if (!rPagos.ok) {
        const msg = await rPagos.text();
        throw new Error(`Préstamo creado, pero no se pudo generar la corrida. Detalle: ${msg}`);
      }

      setToastMessage('Préstamo creado correctamente.');
      setShowAddPrestamoModal(false);
      resetNuevoPrestamo();

      fetchGlobalPrestamoStats();
      if (!idSocio) fetchAllSociosConPrestamoActivo();
      else fetchPrestamosForUser(idSocio);
  } catch (e) {

  console.error('ERROR CREANDO PRÉSTAMO:', e);

  if (idPrestamoCreado) {
    try {
      const headersDelete = {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      };

      await fetch(
        `${SUPABASE_URL}/rest/v1/pagos_prestamos?id_prestamo=eq.${idPrestamoCreado}`,
        {
          method: 'DELETE',
          headers: headersDelete,
        }
      );

      await fetch(
        `${SUPABASE_URL}/rest/v1/garantias_prestamos?id_prestamo=eq.${idPrestamoCreado}`,
        {
          method: 'DELETE',
          headers: headersDelete,
        }
      );

      await fetch(
        `${SUPABASE_URL}/rest/v1/avales_prestamos?id_prestamo=eq.${idPrestamoCreado}`,
        {
          method: 'DELETE',
          headers: headersDelete,
        }
      );

      await fetch(
        `${SUPABASE_URL}/rest/v1/evaluaciones_crediticias?id_prestamo=eq.${idPrestamoCreado}`,
        {
          method: 'DELETE',
          headers: headersDelete,
        }
      );

      await fetch(
        `${SUPABASE_URL}/rest/v1/prestamos?id_prestamo=eq.${idPrestamoCreado}`,
        {
          method: 'DELETE',
          headers: headersDelete,
        }
      );

    } catch (rollbackError) {
      console.error(
        'ERROR REVERTIENDO PRÉSTAMO INCOMPLETO:',
        rollbackError
      );
    }
  }

  alert(
  e.message ||
    'No se pudo guardar el préstamo. Los datos capturados permanecen para que pueda corregirlos.'
);

} finally {

  setSubmitting(false);
  setTimeout(() => setToastMessage(''), 3000);

}

};

  // ============================
  // Render
  // ============================
  return (
 <div className="p-4 md:p-6 space-y-5 md:space-y-6">
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
        <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-1 md:mb-2">Préstamos</h2>
          <p className="text-slate-600">Consulta el detalle de los préstamos de los socios</p>
        </div>
        {currentUserRole === 'admin' && (
          <button
            onClick={() => setShowAddPrestamoModal(true)}
          className="w-full md:w-auto px-4 py-3 md:py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-medium"
          >
            Registrar nuevo préstamo
          </button>
        )}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 md:p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Total de Socios con Préstamo</h3>
              <p className="text-xl md:text-2xl font-bold text-orange-600">{totalSociosConPrestamo.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 md:p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Total de Dinero Prestado</h3>
              <p className="text-xl md:text-2xl font-bold text-purple-600">{formatCurrency(totalDineroPrestado)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Búsqueda */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 md:p-6">
      <h3 className="text-lg md:text-xl font-semibold text-slate-900 mb-4">Buscar Socio</h3>
        <input
          type="text"
          placeholder="Buscar por ID de Socio o Nombre Completo..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value.toLowerCase())}
          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {searchTerm && sociosList && (sociosList.filter(
          s => s.id_socio.toString().includes(searchTerm) ||
          `${s.nombre} ${s.apellido_paterno} ${s.apellido_materno}`.toLowerCase().includes(searchTerm)
        )).length > 0 && (
          <div className="mt-4 space-y-2">
            {sociosList.filter(
              s => s.id_socio.toString().includes(searchTerm) ||
              `${s.nombre} ${s.apellido_paterno} ${s.apellido_materno}`.toLowerCase().includes(searchTerm)
            ).map((socio) => (
            <div key={socio.id_socio} className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 p-3 bg-slate-100 rounded-lg">
            <span className="text-slate-800 text-sm md:text-base">
                  ID: {socio.id_socio} - {socio.nombre} {socio.apellido_paterno} {socio.apellido_materno}
                </span>
             <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                  <button
                    onClick={() => handleVerHistorialPrestamosSocio(socio)}
                    className="px-3 py-1 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600"
                  >
                    Ver Historial de Préstamos
                  </button>
                  <button
                    onClick={() => handleEditarPrestamosSocio(socio)}
                    className="px-3 py-1 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600"
                  >
                    Editar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        {searchTerm && sociosList && (sociosList.filter(
          s => s.id_socio.toString().includes(searchTerm) ||
          `${s.nombre} ${s.apellido_paterno} ${s.apellido_materno}`.toLowerCase().includes(searchTerm)
        )).length === 0 && (
          <p className="text-center text-slate-600 mt-4">No se encontraron resultados.</p>
        )}
      </div>

      {/* Socios con préstamos activos (admin) */}
{currentUserRole === 'admin' &&
  sociosConPrestamosActivos.length > 0 &&
  !showPrestamoHistorial &&
  !showEditPrestamosModal && (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 md:p-6">
      <h3 className="text-lg md:text-xl font-semibold text-slate-900 mb-4">
        Socios con Préstamos Activos
      </h3>

      {loading && <p className="text-center text-slate-600">Cargando socios con préstamos...</p>}
      {error && !loading && <p className="text-center text-red-500">Error: {error}</p>}

      {!loading && !error && sociosConPrestamosActivos.length === 0 && (
        <p className="text-center text-slate-600">No hay socios con préstamos activos.</p>
      )}

      {!loading && !error && sociosConPrestamosActivos.length > 0 && (
        <>
          {/* Vista móvil */}
          <div className="md:hidden space-y-3">
            {sociosConPrestamosActivos.map((socio) => (
              <div
                key={socio.id_socio}
                className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3"
              >
                <div>
                  <p className="text-xs text-slate-500">ID Socio</p>
                  <p className="font-semibold text-slate-900">{socio.id_socio}</p>
                </div>

                <div>
                  <p className="text-xs text-slate-500">Nombre Completo</p>
                  <p className="font-semibold text-slate-900">
                    {socio.nombre} {socio.apellido_paterno} {socio.apellido_materno}
                  </p>
                </div>

                <div className="flex flex-col gap-2 pt-2">
                  <button
                    onClick={() => handleVerHistorialPrestamosSocio(socio)}
                    className="w-full px-3 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600"
                  >
                    Ver Historial de Préstamos
                  </button>

                  <button
                    onClick={() => handleEditarPrestamosSocio(socio)}
                    className="w-full px-3 py-2 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600"
                  >
                    Editar
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Vista escritorio */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">ID Socio</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Nombre Completo</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Acciones</th>
                </tr>
              </thead>

              <tbody>
                {sociosConPrestamosActivos.map((socio) => (
                  <tr key={socio.id_socio} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-4 px-4 text-slate-700">{socio.id_socio}</td>
                    <td className="py-4 px-4 font-medium text-slate-900">
                      {socio.nombre} {socio.apellido_paterno} {socio.apellido_materno}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleVerHistorialPrestamosSocio(socio)}
                          className="px-3 py-1 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600"
                        >
                          Ver Historial de Préstamos
                        </button>

                        <button
                          onClick={() => handleEditarPrestamosSocio(socio)}
                          className="px-3 py-1 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600"
                        >
                          Editar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )}

      {/* Tabla de préstamos del socio */}
      {!showPrestamoHistorial && !showEditPrestamosModal && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 md:p-6">
          {loading && <p className="text-center text-slate-600">Cargando préstamos...</p>}
          {error && !loading && <p className="text-center text-red-500">Error: {error}</p>}
          {!loading && !error && prestamosList.length > 0 && (
           <div className="overflow-x-auto -mx-4 md:mx-0">
          <table className="w-full min-w-[640px]">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">ID Préstamo</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Monto Original</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Pago por periodo</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Tasa</th>
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
                      <td className="py-4 px-4 font-medium text-slate-900">
                        {formatCurrency(parseFloat(prestamo.pago_requerido) || 0)}
                      </td>
                      <td className="py-4 px-4 text-orange-600 font-medium">{prestamo.interes}%</td>
                      <td className="py-4 px-4 text-slate-700">{prestamo.fecha_vencimiento}</td>
                      <td className="py-4 px-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            prestamo.estatus === 'activo'
                              ? 'bg-green-100 text-green-700'
                              : prestamo.estatus === 'LIQUIDADO'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {prestamo.estatus}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                    <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                          <button
                            onClick={() => handleVerDetallesPrestamo(prestamo)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
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

      {/* Historial de préstamos del socio */}
      {showPrestamoHistorial && selectedSocioForHistorial && !showEditPrestamosModal && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 md:p-6">
          <h3 className="text-xl font-bold text-slate-900 mb-4">
            Historial de Préstamos de {selectedSocioForHistorial.nombre} {selectedSocioForHistorial.apellido_paterno}
          </h3>
          {loading && <p className="text-center text-slate-600">Cargando préstamos...</p>}
          {error && !loading && <p className="text-center text-red-500">Error: {error}</p>}
          {!loading && !error && socioPrestamos.length === 0 && (
            <p className="text-center text-slate-600">Este socio no tiene préstamos registrados.</p>
          )}
         {!loading && !error && socioPrestamos.length > 0 && (
  <div className="space-y-4">
    {socioPrestamos.map((prestamo) => (
      <div
        key={prestamo.id_prestamo}
        className="p-4 border border-slate-200 rounded-lg flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3"
      >
                  <div>
                    <p className="font-medium text-slate-900">
                      Préstamo de {formatCurrency(prestamo.monto_solicitado)} solicitado el{' '}
                      {formatFechaSolo(prestamo.fecha_solicitud)}
                    </p>
                    {prestamo.isPaid && (
                      <span className="inline-block mt-2 px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-700">
                        Pagos completados
                      </span>
                    )}
                  </div>
                 <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">

  <button
    onClick={() => handleVerDetallesPrestamo(prestamo)}
    className="w-full sm:w-auto px-3 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600"
  >
    Ver detalles
  </button>

  <button
    onClick={() => handleVerExpedientePrestamo(prestamo)}
    disabled={loadingExpediente}
    className="
      w-full
      sm:w-auto
      px-3
      py-2
      bg-indigo-600
      text-white
      rounded-lg
      text-sm
      hover:bg-indigo-700
      disabled:opacity-50
      disabled:cursor-not-allowed
    "
  >
    {loadingExpediente
      ? 'Cargando...'
      : 'Ver expediente'}
  </button>

</div>
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
      )}

      {/* Edición de préstamos del socio */}
      {showEditPrestamosModal && selectedSocioForHistorial && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 md:p-6">
          <h3 className="text-xl font-bold text-slate-900 mb-4">
            Editar Préstamos de {selectedSocioForHistorial.nombre} {selectedSocioForHistorial.apellido_paterno}
          </h3>
          {loading && <p className="text-center text-slate-600">Cargando préstamos para edición...</p>}
          {error && !loading && <p className="text-center text-red-500">Error: {error}</p>}
          {!loading && !error && socioPrestamos.length === 0 && (
            <p className="text-center text-slate-600">Este socio no tiene préstamos registrados para editar.</p>
          )}
          {!loading && !error && socioPrestamos.length > 0 && (
            <div className="space-y-4">
              {socioPrestamos.map((prestamo) => (
                <div key={prestamo.id_prestamo} className="p-4 border border-slate-200 rounded-lg flex justify-between items-center">
                  <div>
                    <p className="font-medium text-slate-900">
                      Préstamo de {formatCurrency(prestamo.monto_solicitado)} solicitado el{' '}
                      {formatFechaSolo(prestamo.fecha_solicitud)}
                    </p>
                    {!prestamo.canDelete && (
                      <p className="text-xs text-slate-500 mt-1">No se puede eliminar (tiene pagos o supera 1 día).</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleDeletePrestamo(prestamo.id_prestamo)}
                    className={`px-3 py-1 bg-red-500 text-white rounded-lg text-sm transition-colors ${
                      prestamo.canDelete ? 'hover:bg-red-600' : 'opacity-50 cursor-not-allowed'
                    }`}
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
      )}

{/* ====================================================== */}
{/* ============== MODAL EXPEDIENTE PRÉSTAMO ============ */}
{/* ====================================================== */}

{showExpedientePrestamo && expedientePrestamo && (
  <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-2 sm:p-4">

    <div className="bg-white w-full max-w-6xl max-h-[96vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col">

      {/* ENCABEZADO */}
      <div className="flex items-start justify-between gap-3 p-4 md:p-6 border-b border-slate-200">

        <div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-900">
            Expediente del Préstamo #{expedientePrestamo.id_prestamo}
          </h2>

          <p className="text-sm text-slate-500 mt-1">
            Información capturada al momento de la solicitud.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setShowExpedientePrestamo(false);
            setExpedientePrestamo(null);
            setEvaluacionExpediente(null);
            setAvalExpediente(null);
            setGarantiasExpediente([]);
          }}
          className="shrink-0 w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center text-xl"
        >
          ×
        </button>

      </div>


      {/* CONTENIDO */}
      <div className="overflow-y-auto p-4 md:p-6 space-y-6">


        {/* ====================================================== */}
        {/* ================= RESUMEN PRÉSTAMO =================== */}
        {/* ====================================================== */}

        <section className="border border-slate-200 rounded-xl overflow-hidden">

          <div className="bg-slate-100 px-4 py-3">
            <h3 className="font-bold text-slate-900">
              Resumen del Préstamo
            </h3>
          </div>

          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

            <div>
              <p className="text-xs text-slate-500">
                ID Préstamo
              </p>
              <p className="font-semibold">
                {expedientePrestamo.id_prestamo || '—'}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-500">
                Monto solicitado
              </p>
              <p className="font-semibold">
                {formatCurrency(expedientePrestamo.monto_solicitado)}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-500">
                Número de plazos
              </p>
              <p className="font-semibold">
                {expedientePrestamo.numero_plazos || '—'}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-500">
                Periodicidad
              </p>
              <p className="font-semibold uppercase">
                {expedientePrestamo.tipo_plazo || '—'}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-500">
                Interés por periodo
              </p>
              <p className="font-semibold">
                {expedientePrestamo.interes ?? '—'}%
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-500">
                Fecha de solicitud
              </p>
              <p className="font-semibold">
             {formatFechaSolo(expedientePrestamo.fecha_solicitud)}
              </p>
            </div>

          </div>

        </section>


        {/* ====================================================== */}
        {/* ================= PERFIL ECONÓMICO ==================== */}
        {/* ====================================================== */}

        <section className="border border-slate-200 rounded-xl overflow-hidden">

          <div className="bg-slate-100 px-4 py-3">
            <h3 className="font-bold text-slate-900">
              Perfil Económico
            </h3>
          </div>

          <div className="p-4 space-y-4">

            <div>
              <p className="text-xs text-slate-500">
                Fuente de ingresos
              </p>

              <p className="font-semibold">
                {expedientePrestamo.tipo_fuente_ingreso === 'EMPLEADO'
                  ? 'Empleado'
                  : expedientePrestamo.tipo_fuente_ingreso === 'NEGOCIO_PROPIO'
                  ? 'Negocio propio'
                  : '—'}
              </p>
            </div>


            {/* EMPLEADO */}
            {expedientePrestamo.tipo_fuente_ingreso === 'EMPLEADO' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

                <div>
                  <p className="text-xs text-slate-500">
                    Empresa
                  </p>
                  <p className="font-medium">
                    {expedientePrestamo.empleado_nombre_empresa || '—'}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-500">
                    Ocupación
                  </p>
                  <p className="font-medium">
                    {expedientePrestamo.empleado_ocupacion || '—'}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-500">
                    Tiempo trabajando
                  </p>
                  <p className="font-medium">
                    {expedientePrestamo.empleado_tiempo_anios || 0} años{' '}
                    {expedientePrestamo.empleado_tiempo_meses || 0} meses
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-500">
                    Tipo de contrato
                  </p>
                  <p className="font-medium">
                    {expedientePrestamo.empleado_tipo_contrato || '—'}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-500">
                    Ingreso mensual neto
                  </p>
                  <p className="font-medium">
                    {formatCurrency(
                      expedientePrestamo.empleado_ingreso_mensual_neto
                    )}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-500">
                    ¿Comprueba ingresos?
                  </p>
                  <p className="font-medium">
                    {expedientePrestamo.empleado_comprueba_ingresos || '—'}
                  </p>
                </div>

                {expedientePrestamo.empleado_tipo_comprobante && (
                  <div>
                    <p className="text-xs text-slate-500">
                      Tipo de comprobante
                    </p>
                    <p className="font-medium">
                      {expedientePrestamo.empleado_tipo_comprobante}
                    </p>
                  </div>
                )}

              </div>
            )}


            {/* NEGOCIO PROPIO */}
            {expedientePrestamo.tipo_fuente_ingreso === 'NEGOCIO_PROPIO' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

                <div>
                  <p className="text-xs text-slate-500">
                    Tipo de negocio
                  </p>
                  <p className="font-medium">
                    {expedientePrestamo.negocio_tipo || '—'}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-500">
                    Antigüedad
                  </p>
                  <p className="font-medium">
                    {expedientePrestamo.negocio_tiempo_anios || 0} años{' '}
                    {expedientePrestamo.negocio_tiempo_meses || 0} meses
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-500">
                    ¿Es formal?
                  </p>
                  <p className="font-medium">
                    {expedientePrestamo.negocio_formal || '—'}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-500">
                    Número de empleados
                  </p>
                  <p className="font-medium">
                    {expedientePrestamo.negocio_num_empleados || '—'}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-500">
                    Gastos mensuales
                  </p>
                  <p className="font-medium">
                    {expedientePrestamo.negocio_gastos_mensuales || '—'}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-500">
                    Utilidad aproximada
                  </p>
                  <p className="font-medium">
                    {formatCurrency(
                      expedientePrestamo.negocio_utilidad_aproximada
                    )}
                  </p>
                </div>

              </div>
            )}

          </div>

        </section>


        {/* ====================================================== */}
        {/* =============== EVALUACIÓN CREDITICIA ================= */}
        {/* ====================================================== */}

        <section className="border border-slate-200 rounded-xl overflow-hidden">

          <div className="bg-indigo-50 px-4 py-3">
            <h3 className="font-bold text-indigo-900">
              Evaluación Crediticia
            </h3>
          </div>


          {!evaluacionExpediente ? (
            <div className="p-4 text-sm text-slate-500">
              Este préstamo no tiene evaluación crediticia registrada.
            </div>
          ) : (
            <div className="p-4 space-y-4">

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                <div>
                  <p className="text-xs text-slate-500">
                    Pago máximo sin atrasarse
                  </p>

                  <p className="font-semibold">
                    {formatCurrency(
                      evaluacionExpediente.capacidad_pago_monto
                    )}{' '}
                    /{' '}
                    {evaluacionExpediente.capacidad_pago_periodicidad || '—'}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-500">
                    ¿El uso generará ingresos?
                  </p>

                  <p className="font-semibold">
                    {evaluacionExpediente.uso_generara_ingresos
                      ? 'Sí'
                      : 'No'}
                  </p>
                </div>

              </div>


              <div>
                <p className="text-xs text-slate-500">
                  ¿Para qué necesita el dinero?
                </p>

                <p className="font-medium whitespace-pre-wrap">
                  {evaluacionExpediente.destino_dinero || '—'}
                </p>
              </div>


              {evaluacionExpediente.tiempo_recuperacion && (
                <div>
                  <p className="text-xs text-slate-500">
                    Tiempo para recuperar la inversión
                  </p>

                  <p className="font-medium">
                    {evaluacionExpediente.tiempo_recuperacion}
                  </p>
                </div>
              )}


              <div>
                <p className="text-xs text-slate-500">
                  ¿Qué pasaría si el negocio, plan o proyecto no funciona?
                </p>

                <p className="font-medium whitespace-pre-wrap">
                  {evaluacionExpediente.riesgo_si_no_funciona || '—'}
                </p>
              </div>


              <div>
                <p className="text-xs text-slate-500">
                  Otros ingresos
                </p>

                <p className="font-medium whitespace-pre-wrap">
                  {evaluacionExpediente.otros_ingresos || '—'}
                </p>
              </div>


              <div>
                <p className="text-xs text-slate-500">
                  ¿Qué haría si no puede pagar una mensualidad?
                </p>

                <p className="font-medium whitespace-pre-wrap">
                  {evaluacionExpediente.accion_si_no_puede_pagar || '—'}
                </p>
              </div>


              <div>
                <p className="text-xs text-slate-500">
                  ¿Qué pasaría si deja de recibir dinero un mes?
                </p>

                <p className="font-medium whitespace-pre-wrap">
                  {evaluacionExpediente.accion_si_sin_ingresos_mes || '—'}
                </p>
              </div>


              <div>
                <p className="text-xs text-slate-500">
                  Si hoy tuviera una emergencia fuerte, ¿cómo la resolvería?
                </p>

                <p className="font-medium whitespace-pre-wrap">
                  {evaluacionExpediente.accion_emergencia_fuerte || '—'}
                </p>
              </div>


              <div className="border-2 border-amber-300 bg-amber-50 rounded-xl p-4">

                <p className="text-xs font-bold uppercase text-amber-700">
                  Fuente principal de pago
                </p>

                <p className="text-sm font-bold text-slate-900 mt-1">
                  Explíqueme exactamente de dónde saldrá el dinero para pagar este préstamo
                </p>

                <p className="mt-2 whitespace-pre-wrap text-slate-800">
                  {evaluacionExpediente.fuente_pago_prestamo || '—'}
                </p>

              </div>

            </div>
          )}

        </section>


        {/* ====================================================== */}
        {/* ======================= AVAL ========================== */}
        {/* ====================================================== */}

        <section className="border border-slate-200 rounded-xl overflow-hidden">

          <div className="bg-slate-100 px-4 py-3">
            <h3 className="font-bold text-slate-900">
              Aval
            </h3>
          </div>


          {!avalExpediente ? (
            <div className="p-4 text-sm text-slate-500">
              Este préstamo no tiene Aval registrado.
            </div>
          ) : (
            <div className="p-4 space-y-4">

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

                <div>
                  <p className="text-xs text-slate-500">Nombre</p>
                  <p className="font-semibold">
                    {avalExpediente.nombre || '—'}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-500">Edad</p>
                  <p className="font-semibold">
                    {avalExpediente.edad || '—'}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-500">Celular</p>
                  <p className="font-semibold">
                    {avalExpediente.celular || '—'}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-500">
                    Ocupación
                  </p>
                  <p className="font-semibold">
                    {avalExpediente.ocupacion || '—'}
                  </p>
                </div>

              </div>


              <div>
                <p className="text-xs text-slate-500">
                  Domicilio
                </p>

                <p className="font-medium">
                  {[
                    avalExpediente.domicilio_calle,
                    avalExpediente.domicilio_numero,
                    avalExpediente.domicilio_edificio,
                    avalExpediente.domicilio_colonia,
                    avalExpediente.domicilio_municipio,
                    avalExpediente.domicilio_estado,
                    avalExpediente.domicilio_cp,
                    avalExpediente.domicilio_pais,
                  ]
                    .filter(Boolean)
                    .join(', ') || '—'}
                </p>
              </div>

            </div>
          )}

        </section>


        {/* ====================================================== */}
        {/* ===================== GARANTÍAS ======================= */}
        {/* ====================================================== */}

        <section className="border border-slate-200 rounded-xl overflow-hidden">

          <div className="bg-slate-100 px-4 py-3">
            <h3 className="font-bold text-slate-900">
              Garantías
            </h3>
          </div>


          {garantiasExpediente.length === 0 ? (
            <div className="p-4 text-sm text-slate-500">
              Este préstamo no tiene garantías registradas.
            </div>
          ) : (
            <div className="p-4 space-y-4">

              {garantiasExpediente.map((garantia) => (

                <div
                  key={garantia.id_garantia}
                  className="border border-slate-200 rounded-xl p-4"
                >

                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">

                    <div>
                      <p className="text-xs text-slate-500">
                        Tipo de garantía
                      </p>

                      <h4 className="font-bold text-slate-900">
                        {garantia.tipo_garantia || '—'}
                      </h4>
                    </div>

                    <span className="inline-flex self-start px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-xs font-semibold">
                      {garantia.pertenece_a || '—'}
                    </span>

                  </div>


                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                    <div>
                      <p className="text-xs text-slate-500">
                        Descripción
                      </p>

                      <p className="font-medium">
                        {garantia.descripcion || '—'}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-500">
                        Valor estimado
                      </p>

                      <p className="font-semibold">
                        {formatCurrency(garantia.valor_estimado)}
                      </p>
                    </div>

                  </div>


                  {/* PROPIEDAD */}
                  {garantia.tipo_garantia === 'PROPIEDAD' && (
                    <div className="mt-4 space-y-3">

                      <div>
                        <p className="text-xs text-slate-500">
                          Tipo de propiedad
                        </p>

                        <p className="font-medium">
                          {garantia.propiedad_tipo || '—'}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-slate-500">
                          Dirección
                        </p>

                        <p className="font-medium">
                          {[
                            garantia.propiedad_calle,
                            garantia.propiedad_numero,
                            garantia.propiedad_edificio,
                            garantia.propiedad_colonia,
                            garantia.propiedad_municipio,
                            garantia.propiedad_estado,
                            garantia.propiedad_cp,
                            garantia.propiedad_pais,
                          ]
                            .filter(Boolean)
                            .join(', ') || '—'}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-slate-500">
                          Documentación
                        </p>

                        <p className="font-medium">
                          {garantia.propiedad_documentacion || '—'}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-slate-500">
                          Gravámenes
                        </p>

                        <p className="font-medium">
                          {garantia.propiedad_gravamenes || '—'}
                        </p>
                      </div>

                    </div>
                  )}


                  {/* VEHÍCULO */}
                  {garantia.tipo_garantia === 'VEHICULO' && (
                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">

                      <div>
                        <p className="text-xs text-slate-500">
                          Marca
                        </p>
                        <p className="font-medium">
                          {garantia.vehiculo_marca || '—'}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-slate-500">
                          Modelo
                        </p>
                        <p className="font-medium">
                          {garantia.vehiculo_modelo || '—'}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-slate-500">
                          Año
                        </p>
                        <p className="font-medium">
                          {garantia.vehiculo_anio || '—'}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-slate-500">
                          Documentación
                        </p>
                        <p className="font-medium">
                          {garantia.vehiculo_documentacion || '—'}
                        </p>
                      </div>

                      <div className="sm:col-span-2">
                        <p className="text-xs text-slate-500">
                          Gravámenes / préstamos pendientes
                        </p>
                        <p className="font-medium">
                          {garantia.vehiculo_gravamenes || '—'}
                        </p>
                      </div>

                    </div>
                  )}


                  {/* OTRO */}
                  {garantia.tipo_garantia === 'OTRO' && (
                    <div className="mt-4">

                      <p className="text-xs text-slate-500">
                        Tipo de activo
                      </p>

                      <p className="font-medium">
                        {garantia.otro_tipo || '—'}
                      </p>

                      <p className="text-xs text-slate-500 mt-3">
                        Descripción
                      </p>

                      <p className="font-medium whitespace-pre-wrap">
                        {garantia.otro_descripcion || '—'}
                      </p>

                    </div>
                  )}

                </div>

              ))}

            </div>
          )}

        </section>


      </div>


      {/* PIE */}
      <div className="border-t border-slate-200 p-4 flex justify-end">

        <button
          type="button"
          onClick={() => {
            setShowExpedientePrestamo(false);
            setExpedientePrestamo(null);
            setEvaluacionExpediente(null);
            setAvalExpediente(null);
            setGarantiasExpediente([]);
          }}
          className="w-full sm:w-auto px-5 py-2.5 bg-slate-800 text-white rounded-xl hover:bg-slate-900 font-medium"
        >
          Cerrar
        </button>

      </div>

    </div>

  </div>
)}

    {/* Modal de Detalles */}
{showDetailsModal && selectedPrestamo && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-3 md:p-4 z-50">
    <div className="bg-white rounded-2xl shadow-xl w-full max-w-6xl max-h-[94vh] overflow-hidden">
      {/* Encabezado */}
      <div className="flex items-start justify-between gap-3 p-4 md:p-6 border-b border-slate-200">
        <div>
          <h3 className="text-lg md:text-xl font-bold text-slate-900">
            Historial de Pagos del Préstamo{' '}
            {selectedPrestamo.id_prestamo}
          </h3>

          <p className="text-sm text-slate-500 mt-1">
            Monto original:{' '}
            {formatCurrency(
              selectedPrestamo.monto_solicitado
            )}
          </p>
        </div>

        <button
          type="button"
          onClick={handleBackToListadoPrestamos}
          className="shrink-0 px-3 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200"
        >
          Cerrar
        </button>
      </div>

      <div className="p-4 md:p-6 max-h-[78vh] overflow-y-auto">
        {loading && (
          <p className="text-center text-slate-600">
            Cargando historial de pagos...
          </p>
        )}

        {error && !loading && (
          <p className="text-center text-red-500">
            Error: {error}
          </p>
        )}

        {!loading &&
          !error &&
          historialPagosPrestamo.length === 0 && (
            <p className="text-center text-slate-600">
              Aún no hay pagos registrados para este préstamo.
            </p>
          )}

        {!loading &&
          !error &&
          historialPagosPrestamo.length > 0 && (
            <>
              {/* ================= MÓVIL ================= */}
              <div className="md:hidden space-y-3">
                {historialPagosPrestamo.map(
                  (pago) => {
                    const pagado =
                      String(
                        pago.estatus || ''
                      ).toLowerCase() === 'pagado';

                    const programada =
                      pago.fecha_programada || '';

                    const fechaShow =
                      pago.fecha_hora_pago
                        ? `${
                            convertirFechaHoraLocal(
                              pago.fecha_hora_pago
                            ).fecha
                          } ${
                            convertirFechaHoraLocal(
                              pago.fecha_hora_pago
                            ).hora
                          }`
                        : programada;

                    return (
                      <div
                        key={pago.id_pago}
                        className="border border-slate-200 rounded-xl bg-slate-50 p-4 space-y-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-xs text-slate-500">
                              Número de pago
                            </p>

                            <p className="font-bold text-slate-900">
                              #{pago.numero_pago}
                            </p>
                          </div>

                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              pagado
                                ? 'bg-green-100 text-green-700'
                                : 'bg-yellow-100 text-yellow-700'
                            }`}
                          >
                            {pagado
                              ? 'Pagado'
                              : 'Pendiente'}
                          </span>
                        </div>

                        <div>
                          <p className="text-xs text-slate-500">
                            Fecha
                          </p>

                          <p className="font-medium text-slate-900">
                            {fechaShow || '—'}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-slate-500">
                            Monto programado
                          </p>

                          <p className="text-lg font-bold text-blue-600">
                            {formatCurrency(
                              pago.monto_pago
                            )}
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <p className="text-xs text-slate-500">
                              Pagado
                            </p>

                            <p className="font-medium text-slate-900">
                              {pago.monto_pagado != null
                                ? formatCurrency(
                                    pago.monto_pagado
                                  )
                                : '—'}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs text-slate-500">
                              Interés
                            </p>

                            <p className="font-medium text-slate-900">
                              {pago.interes_pagado !=
                              null
                                ? formatCurrency(
                                    pago.interes_pagado
                                  )
                                : '—'}
                            </p>
                          </div>
                        </div>

                        <div>
                          <p className="text-xs text-slate-500">
                            Capital
                          </p>

                          <p className="font-medium text-slate-900">
                            {pago.capital_pagado != null
                              ? formatCurrency(
                                  pago.capital_pagado
                                )
                              : '—'}
                          </p>
                        </div>

                        {!pagado && (
                          <button
                            type="button"
                            onClick={() =>
                              abrirPagoDesdePrestamo(
                                pago
                              )
                            }
                            className="w-full px-4 py-2.5 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700"
                          >
                            Pagar
                          </button>
                        )}
                      </div>
                    );
                  }
                )}
              </div>

              {/* ================= WEB ================= */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-3 px-3">
                        #
                      </th>

                      <th className="text-left py-3 px-3">
                        Fecha
                      </th>

                      <th className="text-left py-3 px-3">
                        Programado
                      </th>

                      <th className="text-left py-3 px-3">
                        Pagado
                      </th>

                      <th className="text-left py-3 px-3">
                        Interés
                      </th>

                      <th className="text-left py-3 px-3">
                        Capital
                      </th>

                      <th className="text-left py-3 px-3">
                        Estatus
                      </th>

                      <th className="text-left py-3 px-3">
                        Acción
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {historialPagosPrestamo.map(
                      (pago) => {
                        const pagado =
                          String(
                            pago.estatus || ''
                          ).toLowerCase() ===
                          'pagado';

                        const programada =
                          pago.fecha_programada || '';

                        const fechaShow =
                          pago.fecha_hora_pago
                            ? `${
                                convertirFechaHoraLocal(
                                  pago.fecha_hora_pago
                                ).fecha
                              } ${
                                convertirFechaHoraLocal(
                                  pago.fecha_hora_pago
                                ).hora
                              }`
                            : programada;

                        return (
                          <tr
                            key={pago.id_pago}
                            className="border-b border-slate-100 hover:bg-slate-50"
                          >
                            <td className="py-3 px-3">
                              {pago.numero_pago}
                            </td>

                            <td className="py-3 px-3">
                              {fechaShow || '—'}
                            </td>

                            <td className="py-3 px-3">
                              {formatCurrency(
                                pago.monto_pago
                              )}
                            </td>

                            <td className="py-3 px-3">
                              {pago.monto_pagado != null
                                ? formatCurrency(
                                    pago.monto_pagado
                                  )
                                : '—'}
                            </td>

                            <td className="py-3 px-3">
                              {pago.interes_pagado !=
                              null
                                ? formatCurrency(
                                    pago.interes_pagado
                                  )
                                : '—'}
                            </td>

                            <td className="py-3 px-3">
                              {pago.capital_pagado != null
                                ? formatCurrency(
                                    pago.capital_pagado
                                  )
                                : '—'}
                            </td>

                            <td className="py-3 px-3">
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-medium ${
                                  pagado
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-yellow-100 text-yellow-700'
                                }`}
                              >
                                {pagado
                                  ? 'Pagado'
                                  : 'Pendiente'}
                              </span>
                            </td>

                            <td className="py-3 px-3">
                              {!pagado ? (
                                <button
                                  type="button"
                                  onClick={() =>
                                    abrirPagoDesdePrestamo(
                                      pago
                                    )
                                  }
                                  className="px-3 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700"
                                >
                                  Pagar
                                </button>
                              ) : (
                                <span className="text-slate-400">
                                  —
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      }
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}

        <div className="flex justify-end mt-6">
          <button
            type="button"
            onClick={handleBackToListadoPrestamos}
            className="w-full md:w-auto px-5 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium"
          >
            Volver
          </button>
        </div>
      </div>
    </div>
  </div>
)}

{/* MODAL: REALIZAR PAGO DESDE PRÉSTAMOS */}
{showPagoPrestamoModal &&
  pagoPrestamoTarget && (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl p-5 max-h-[92vh] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4">
          Realizar pago — #
          {pagoPrestamoTarget.numero_pago}
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-slate-700 mb-1">
              Monto a pagar
            </label>

            <input
              type="number"
              min="0"
              step="0.01"
              className="w-full px-3 py-2 border rounded-lg"
              value={montoPagoPrestamo}
              onChange={(e) =>
                setMontoPagoPrestamo(
                  e.target.value
                )
              }
            />
          </div>

          <div>
            <p className="text-sm text-slate-700 mb-2">
              Seleccione la forma de pago
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="forma_pago_prestamo"
                  value="Efectivo"
                  checked={
                    formaPagoPrestamo ===
                    'Efectivo'
                  }
                  onChange={(e) => {
                    setFormaPagoPrestamo(
                      e.target.value
                    );

                    setFormaPagoPrestamoError(
                      ''
                    );
                  }}
                />

                Efectivo
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="forma_pago_prestamo"
                  value="Transferencia"
                  checked={
                    formaPagoPrestamo ===
                    'Transferencia'
                  }
                  onChange={(e) => {
                    setFormaPagoPrestamo(
                      e.target.value
                    );

                    setFormaPagoPrestamoError(
                      ''
                    );
                  }}
                />

                Transferencia
              </label>
            </div>

            {formaPagoPrestamoError && (
              <p className="text-red-600 text-sm mt-1">
                {formaPagoPrestamoError}
              </p>
            )}
          </div>

          <div>
            <p className="text-sm text-slate-700 mb-2">
              Multa por hoja
            </p>

            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="multa_prestamo"
                  value="no"
                  checked={
                    multaHojaPrestamo === 'no'
                  }
                  onChange={(e) => {
                    setMultaHojaPrestamo(
                      e.target.value
                    );

                    setMontoMultaPrestamo('');
                  }}
                />

                No
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="multa_prestamo"
                  value="si"
                  checked={
                    multaHojaPrestamo === 'si'
                  }
                  onChange={(e) =>
                    setMultaHojaPrestamo(
                      e.target.value
                    )
                  }
                />

                Sí
              </label>
            </div>

            {multaHojaPrestamo === 'si' && (
              <input
                type="number"
                min="0"
                step="0.01"
                className="w-full mt-3 px-3 py-2 border rounded-lg"
                placeholder="Monto de la multa"
                value={montoMultaPrestamo}
                onChange={(e) =>
                  setMontoMultaPrestamo(
                    e.target.value
                  )
                }
              />
            )}
          </div>

          <div>
            <label className="block text-sm text-slate-700 mb-1">
              Nota (opcional)
            </label>

            <textarea
              rows="3"
              className="w-full px-3 py-2 border rounded-lg"
              value={notaPagoPrestamo}
              onChange={(e) =>
                setNotaPagoPrestamo(
                  e.target.value
                )
              }
            />
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2">
            <button
              type="button"
              className="w-full sm:w-auto px-4 py-2 bg-slate-100 rounded-lg"
              onClick={() => {
                setShowPagoPrestamoModal(
                  false
                );

                setPagoPrestamoTarget(null);
              }}
            >
              Cancelar
            </button>

            <button
              type="button"
              className="w-full sm:w-auto px-4 py-2 bg-emerald-600 text-white rounded-lg"
              onClick={validarPagoDesdePrestamo}
            >
              Aplicar pago
            </button>
          </div>
        </div>
      </div>
    </div>
  )}

{/* CONFIRMACIÓN DEL PAGO */}
{showConfirmPagoPrestamo && (
  <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4">
    <div className="bg-white rounded-2xl w-full max-w-md shadow-xl p-5 text-center">
      <h3 className="text-lg font-semibold mb-3">
        ¿Está seguro que desea aplicar el pago?
      </h3>

      <p className="text-slate-700 mb-5">
        Se registrará el pago por{' '}
        {formatCurrency(
          Number(montoPagoPrestamo)
        )}
        .
      </p>

      <div className="flex flex-col-reverse sm:flex-row justify-center gap-3">
        <button
          type="button"
          className="w-full sm:w-auto px-4 py-2 bg-slate-100 rounded-lg"
          onClick={() =>
            setShowConfirmPagoPrestamo(false)
          }
          disabled={guardandoPagoPrestamo}
        >
          Cancelar
        </button>

        <button
          type="button"
          className={`w-full sm:w-auto px-4 py-2 rounded-lg text-white ${
            guardandoPagoPrestamo
              ? 'bg-emerald-400 cursor-wait'
              : 'bg-emerald-600 hover:bg-emerald-700'
          }`}
          onClick={confirmarPagoDesdePrestamo}
          disabled={guardandoPagoPrestamo}
        >
          {guardandoPagoPrestamo
            ? 'Aplicando...'
            : 'Aceptar'}
        </button>
      </div>
    </div>
  </div>
)}

      {/* === MODAL: Registrar nuevo préstamo === */}
      {showAddPrestamoModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl max-h-[94vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">Registrar nuevo préstamo</h3>
              <button
                className="px-3 py-1 rounded-lg bg-slate-100"
                onClick={() => { setShowAddPrestamoModal(false); resetNuevoPrestamo(); }}
                disabled={submitting}
              >
                Cerrar
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Socio */}
              <div>
                <label className="block text-sm text-slate-700 mb-1">Socio</label>
                <select
                  className="w-full px-3 py-2 border rounded-lg"
                  value={newPrestamo.id_socio}
                  onChange={(e) => setNewPrestamo((p) => ({ ...p, id_socio: e.target.value }))}
                  disabled={!!idSocio}
                >
                  <option value="">Selecciona un socio…</option>
                  {(sociosList || []).map(s => (
                    <option key={s.id_socio} value={s.id_socio}>
                      #{s.id_socio} — {s.nombre} {s.apellido_paterno} {s.apellido_materno}
                    </option>
                  ))}
                </select>
              </div>

{/* ================= INFORMACIÓN LABORAL ================= */}
<div className="border-t border-slate-200 pt-4">

  <label className="block text-sm font-semibold text-slate-700 mb-2">
    ¿Es empleado o tiene negocio propio?
  </label>

  <select
    value={newPrestamo.tipo_fuente_ingreso}
    onChange={(e) => {
      const value = e.target.value;

      setNewPrestamo((p) => ({
        ...p,
        tipo_fuente_ingreso: value,
      }));
    }}
    className="w-full px-3 py-2 border rounded-lg"
  >
    <option value="">
      Seleccione una opción...
    </option>

    <option value="EMPLEADO">
      Empleado
    </option>

    <option value="NEGOCIO_PROPIO">
      Negocio propio
    </option>
  </select>
</div>


{/* ====================================================== */}
{/* ===================== EMPLEADO ======================= */}
{/* ====================================================== */}

{newPrestamo.tipo_fuente_ingreso === 'EMPLEADO' && (
  <div className="space-y-4 border border-slate-200 rounded-xl p-4 bg-slate-50">

    <h4 className="font-semibold text-slate-900">
      Información laboral
    </h4>


    {/* NOMBRE EMPRESA */}
    <div>
      <label className="block text-sm text-slate-700 mb-1">
        ¿Nombre de la empresa?
      </label>

      <input
        type="text"
        value={newPrestamo.empleado_nombre_empresa}
        onChange={(e) =>
          setNewPrestamo((p) => ({
            ...p,
            empleado_nombre_empresa: e.target.value,
          }))
        }
        className="w-full px-3 py-2 border rounded-lg"
        placeholder="Nombre de la empresa"
      />
    </div>


    {/* DIRECCIÓN EMPRESA */}
    <div>
      <h5 className="font-semibold text-slate-800 mb-3">
        Dirección de la empresa
      </h5>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

        <input
          type="text"
          placeholder="Calle"
          value={newPrestamo.empleado_empresa_calle}
          onChange={(e) =>
            setNewPrestamo((p) => ({
              ...p,
              empleado_empresa_calle: e.target.value,
            }))
          }
          className="px-3 py-2 border rounded-lg"
        />

        <input
          type="text"
          placeholder="Número"
          value={newPrestamo.empleado_empresa_numero}
          onChange={(e) =>
            setNewPrestamo((p) => ({
              ...p,
              empleado_empresa_numero: e.target.value,
            }))
          }
          className="px-3 py-2 border rounded-lg"
        />

        <input
          type="text"
          placeholder="Edificio (opcional)"
          value={newPrestamo.empleado_empresa_edificio}
          onChange={(e) =>
            setNewPrestamo((p) => ({
              ...p,
              empleado_empresa_edificio: e.target.value,
            }))
          }
          className="px-3 py-2 border rounded-lg"
        />

        <input
          type="text"
          placeholder="Colonia"
          value={newPrestamo.empleado_empresa_colonia}
          onChange={(e) =>
            setNewPrestamo((p) => ({
              ...p,
              empleado_empresa_colonia: e.target.value,
            }))
          }
          className="px-3 py-2 border rounded-lg"
        />


        <select
          value={newPrestamo.empleado_empresa_estado}
          onChange={(e) => {
            const estado = e.target.value;

            setNewPrestamo((p) => ({
              ...p,
              empleado_empresa_estado: estado,
              empleado_empresa_pais:
                estado === 'EXTRANJERO'
                  ? p.empleado_empresa_pais
                  : '',
            }));
          }}
          className="px-3 py-2 border rounded-lg"
        >
          <option value="">Estado</option>

          {ESTADOS_MEXICO.map((estado) => (
            <option key={estado} value={estado}>
              {estado}
            </option>
          ))}

          <option value="EXTRANJERO">
            Extranjero
          </option>
        </select>


        {newPrestamo.empleado_empresa_estado ===
          'EXTRANJERO' && (
          <input
            type="text"
            placeholder="País"
            value={newPrestamo.empleado_empresa_pais}
            onChange={(e) =>
              setNewPrestamo((p) => ({
                ...p,
                empleado_empresa_pais: e.target.value,
              }))
            }
            className="px-3 py-2 border rounded-lg"
          />
        )}


        <input
          type="text"
          placeholder="Alcaldía o Municipio"
          value={newPrestamo.empleado_empresa_municipio}
          onChange={(e) =>
            setNewPrestamo((p) => ({
              ...p,
              empleado_empresa_municipio: e.target.value,
            }))
          }
          className="px-3 py-2 border rounded-lg"
        />

        <input
          type="text"
          inputMode="numeric"
          placeholder="Código Postal"
          value={newPrestamo.empleado_empresa_cp}
          onChange={(e) =>
            setNewPrestamo((p) => ({
              ...p,
              empleado_empresa_cp:
                e.target.value.replace(/\D/g, '').slice(0, 5),
            }))
          }
          className="px-3 py-2 border rounded-lg"
        />

        <input
          type="text"
          placeholder="Entre Calles"
          value={newPrestamo.empleado_empresa_entre_calles}
          onChange={(e) =>
            setNewPrestamo((p) => ({
              ...p,
              empleado_empresa_entre_calles: e.target.value,
            }))
          }
          className="md:col-span-2 px-3 py-2 border rounded-lg"
        />

        <textarea
          rows="2"
          placeholder="Referencias del domicilio"
          value={newPrestamo.empleado_empresa_referencias}
          onChange={(e) =>
            setNewPrestamo((p) => ({
              ...p,
              empleado_empresa_referencias: e.target.value,
            }))
          }
          className="md:col-span-2 px-3 py-2 border rounded-lg"
        />

      </div>
    </div>


    {/* OCUPACIÓN */}
    <div>
      <label className="block text-sm text-slate-700 mb-1">
        ¿Ocupación actual?
      </label>

      <input
        type="text"
        value={newPrestamo.empleado_ocupacion}
        onChange={(e) =>
          setNewPrestamo((p) => ({
            ...p,
            empleado_ocupacion: e.target.value,
          }))
        }
        className="w-full px-3 py-2 border rounded-lg"
      />
    </div>


    {/* TIEMPO TRABAJANDO */}
    <div>
      <label className="block text-sm text-slate-700 mb-2">
        ¿Cuánto tiempo lleva trabajando ahí?
      </label>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

        <select
          value={newPrestamo.empleado_tiempo_anios}
          onChange={(e) =>
            setNewPrestamo((p) => ({
              ...p,
              empleado_tiempo_anios: e.target.value,
            }))
          }
          className="px-3 py-2 border rounded-lg"
        >
          <option value="">Años</option>

          {Array.from({ length: 50 }, (_, i) => i + 1).map(
            (n) => (
              <option key={n} value={n}>
                {n} años
              </option>
            )
          )}
        </select>

        <select
          value={newPrestamo.empleado_tiempo_meses}
          onChange={(e) =>
            setNewPrestamo((p) => ({
              ...p,
              empleado_tiempo_meses: e.target.value,
            }))
          }
          className="px-3 py-2 border rounded-lg"
        >
          <option value="">Meses</option>

          {Array.from({ length: 11 }, (_, i) => i + 1).map(
            (n) => (
              <option key={n} value={n}>
                {n} meses
              </option>
            )
          )}
        </select>

      </div>
    </div>


    {/* CONTRATO */}
    <div>
      <label className="block text-sm text-slate-700 mb-1">
        ¿Tiene contrato fijo o temporal?
      </label>

      <input
        type="text"
        value={newPrestamo.empleado_tipo_contrato}
        onChange={(e) =>
          setNewPrestamo((p) => ({
            ...p,
            empleado_tipo_contrato: e.target.value,
          }))
        }
        className="w-full px-3 py-2 border rounded-lg"
        placeholder="Ej. Fijo, temporal, eventual..."
      />
    </div>


    {/* INGRESO */}
    <div>
      <label className="block text-sm text-slate-700 mb-1">
        Ingreso mensual neto
      </label>

      <p className="text-xs text-slate-500 mb-2">
        Después de deducciones, descuentos, créditos, etc.
      </p>

      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600">
          $
        </span>

        <input
          type="number"
          min="0"
          step="0.01"
          value={newPrestamo.empleado_ingreso_mensual_neto}
          onChange={(e) =>
            setNewPrestamo((p) => ({
              ...p,
              empleado_ingreso_mensual_neto: e.target.value,
            }))
          }
          className="w-full pl-8 pr-3 py-2 border rounded-lg"
          placeholder="0.00"
        />
      </div>
    </div>


    {/* COMPROBANTE */}
    <div>
      <label className="block text-sm text-slate-700 mb-1">
        ¿Puede comprobar ingresos?
      </label>

      <select
        value={newPrestamo.empleado_comprueba_ingresos}
        onChange={(e) => {
          const value = e.target.value;

          setNewPrestamo((p) => ({
            ...p,
            empleado_comprueba_ingresos: value,
            empleado_tipo_comprobante:
              value === 'SI'
                ? p.empleado_tipo_comprobante
                : '',
          }));
        }}
        className="w-full px-3 py-2 border rounded-lg"
      >
        <option value="">Seleccione</option>
        <option value="SI">Sí</option>
        <option value="NO">No</option>
      </select>
    </div>


    {newPrestamo.empleado_comprueba_ingresos === 'SI' && (
      <div>
        <label className="block text-sm text-slate-700 mb-1">
          Tipo de comprobante
        </label>

        <input
          type="text"
          value={newPrestamo.empleado_tipo_comprobante}
          onChange={(e) =>
            setNewPrestamo((p) => ({
              ...p,
              empleado_tipo_comprobante: e.target.value,
            }))
          }
          className="w-full px-3 py-2 border rounded-lg"
          placeholder="Ej. Recibo de nómina, estado de cuenta..."
        />
      </div>
    )}

  </div>
)}


{/* ====================================================== */}
{/* ================= NEGOCIO PROPIO ====================== */}
{/* ====================================================== */}

{newPrestamo.tipo_fuente_ingreso ===
  'NEGOCIO_PROPIO' && (
  <div className="space-y-4 border border-slate-200 rounded-xl p-4 bg-slate-50">

    <h4 className="font-semibold text-slate-900">
      Información del negocio
    </h4>


    <div>
      <label className="block text-sm text-slate-700 mb-1">
        ¿Qué tipo de negocio tiene?
      </label>

      <input
        type="text"
        value={newPrestamo.negocio_tipo}
        onChange={(e) =>
          setNewPrestamo((p) => ({
            ...p,
            negocio_tipo: e.target.value,
          }))
        }
        className="w-full px-3 py-2 border rounded-lg"
      />
    </div>


    {/* TIEMPO NEGOCIO */}
    <div>
      <label className="block text-sm text-slate-700 mb-2">
        ¿Cuánto tiempo lleva con el negocio?
      </label>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

        <select
          value={newPrestamo.negocio_tiempo_anios}
          onChange={(e) =>
            setNewPrestamo((p) => ({
              ...p,
              negocio_tiempo_anios: e.target.value,
            }))
          }
          className="px-3 py-2 border rounded-lg"
        >
          <option value="">Años</option>

          {Array.from({ length: 50 }, (_, i) => i + 1).map(
            (n) => (
              <option key={n} value={n}>
                {n} años
              </option>
            )
          )}
        </select>

        <select
          value={newPrestamo.negocio_tiempo_meses}
          onChange={(e) =>
            setNewPrestamo((p) => ({
              ...p,
              negocio_tiempo_meses: e.target.value,
            }))
          }
          className="px-3 py-2 border rounded-lg"
        >
          <option value="">Meses</option>

          {Array.from({ length: 11 }, (_, i) => i + 1).map(
            (n) => (
              <option key={n} value={n}>
                {n} meses
              </option>
            )
          )}
        </select>

      </div>
    </div>


    {/* DOMICILIO NEGOCIO */}
    <div>
      <h5 className="font-semibold text-slate-800 mb-3">
        Domicilio del Negocio
      </h5>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

        <input
          type="text"
          placeholder="Calle"
          value={newPrestamo.negocio_calle}
          onChange={(e) =>
            setNewPrestamo((p) => ({
              ...p,
              negocio_calle: e.target.value,
            }))
          }
          className="px-3 py-2 border rounded-lg"
        />

        <input
          type="text"
          placeholder="Número"
          value={newPrestamo.negocio_numero}
          onChange={(e) =>
            setNewPrestamo((p) => ({
              ...p,
              negocio_numero: e.target.value,
            }))
          }
          className="px-3 py-2 border rounded-lg"
        />

        <input
          type="text"
          placeholder="Edificio (opcional)"
          value={newPrestamo.negocio_edificio}
          onChange={(e) =>
            setNewPrestamo((p) => ({
              ...p,
              negocio_edificio: e.target.value,
            }))
          }
          className="px-3 py-2 border rounded-lg"
        />

        <input
          type="text"
          placeholder="Colonia"
          value={newPrestamo.negocio_colonia}
          onChange={(e) =>
            setNewPrestamo((p) => ({
              ...p,
              negocio_colonia: e.target.value,
            }))
          }
          className="px-3 py-2 border rounded-lg"
        />


        <select
          value={newPrestamo.negocio_estado}
          onChange={(e) => {
            const estado = e.target.value;

            setNewPrestamo((p) => ({
              ...p,
              negocio_estado: estado,
              negocio_pais:
                estado === 'EXTRANJERO'
                  ? p.negocio_pais
                  : '',
            }));
          }}
          className="px-3 py-2 border rounded-lg"
        >
          <option value="">Estado</option>

          {ESTADOS_MEXICO.map((estado) => (
            <option key={estado} value={estado}>
              {estado}
            </option>
          ))}

          <option value="EXTRANJERO">
            Extranjero
          </option>
        </select>


        {newPrestamo.negocio_estado === 'EXTRANJERO' && (
          <input
            type="text"
            placeholder="País"
            value={newPrestamo.negocio_pais}
            onChange={(e) =>
              setNewPrestamo((p) => ({
                ...p,
                negocio_pais: e.target.value,
              }))
            }
            className="px-3 py-2 border rounded-lg"
          />
        )}


        <input
          type="text"
          placeholder="Alcaldía o Municipio"
          value={newPrestamo.negocio_municipio}
          onChange={(e) =>
            setNewPrestamo((p) => ({
              ...p,
              negocio_municipio: e.target.value,
            }))
          }
          className="px-3 py-2 border rounded-lg"
        />

        <input
          type="text"
          inputMode="numeric"
          placeholder="Código Postal"
          value={newPrestamo.negocio_cp}
          onChange={(e) =>
            setNewPrestamo((p) => ({
              ...p,
              negocio_cp:
                e.target.value.replace(/\D/g, '').slice(0, 5),
            }))
          }
          className="px-3 py-2 border rounded-lg"
        />

        <input
          type="text"
          placeholder="Entre Calles"
          value={newPrestamo.negocio_entre_calles}
          onChange={(e) =>
            setNewPrestamo((p) => ({
              ...p,
              negocio_entre_calles: e.target.value,
            }))
          }
          className="md:col-span-2 px-3 py-2 border rounded-lg"
        />

        <textarea
          rows="2"
          placeholder="Referencias del domicilio"
          value={newPrestamo.negocio_referencias}
          onChange={(e) =>
            setNewPrestamo((p) => ({
              ...p,
              negocio_referencias: e.target.value,
            }))
          }
          className="md:col-span-2 px-3 py-2 border rounded-lg"
        />

      </div>
    </div>


    {/* FORMAL */}
    <div>
      <label className="block text-sm text-slate-700 mb-1">
        ¿Su negocio es formal?
      </label>

      <select
        value={newPrestamo.negocio_formal}
        onChange={(e) =>
          setNewPrestamo((p) => ({
            ...p,
            negocio_formal: e.target.value,
          }))
        }
        className="w-full px-3 py-2 border rounded-lg"
      >
        <option value="">Seleccione</option>
        <option value="SI">Sí</option>
        <option value="NO">No</option>
      </select>
    </div>


    {/* EMPLEADOS */}
    <div>
      <label className="block text-sm text-slate-700 mb-1">
        ¿Cuántos empleados tiene?
      </label>

      <select
        value={newPrestamo.negocio_num_empleados}
        onChange={(e) =>
          setNewPrestamo((p) => ({
            ...p,
            negocio_num_empleados: e.target.value,
          }))
        }
        className="w-full px-3 py-2 border rounded-lg"
      >
        <option value="">Seleccione</option>
        <option value="0">0</option>
        <option value="1_A_2">1 a 2</option>
        <option value="MAS_DE_2">Más de 2</option>
        <option value="MAS_DE_10">Más de 10</option>
        <option value="MAS_DE_50">Más de 50</option>
      </select>
    </div>


    {/* GASTOS */}
    <div>
      <label className="block text-sm text-slate-700 mb-1">
        ¿Cuáles son sus gastos mensuales del negocio?
      </label>

      <input
        type="text"
        value={newPrestamo.negocio_gastos_mensuales}
        onChange={(e) =>
          setNewPrestamo((p) => ({
            ...p,
            negocio_gastos_mensuales: e.target.value,
          }))
        }
        className="w-full px-3 py-2 border rounded-lg"
        placeholder="Describa los gastos mensuales"
      />
    </div>


    {/* UTILIDAD */}
    <div>
      <label className="block text-sm text-slate-700 mb-1">
        ¿Cuál es su utilidad aproximada?
      </label>

      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600">
          $
        </span>

        <input
          type="number"
          min="0"
          step="0.01"
          value={newPrestamo.negocio_utilidad_aproximada}
          onChange={(e) =>
            setNewPrestamo((p) => ({
              ...p,
              negocio_utilidad_aproximada: e.target.value,
            }))
          }
          className="w-full pl-8 pr-3 py-2 border rounded-lg"
          placeholder="0.00"
        />
      </div>
    </div>

  </div>
)}

{/* ====================================================== */}
{/* ============== EVALUACIÓN CREDITICIA ================= */}
{/* ====================================================== */}

<div className="border-t-2 border-indigo-500 pt-5 mt-5">
  <h4 className="text-lg font-bold text-slate-900 mb-1">
    Evaluación Crediticia
  </h4>

  <p className="text-sm text-slate-500">
    Capacidad de pago, destino del crédito y contingencias.
  </p>
</div>


{/* CAPACIDAD MÁXIMA */}
<div>
  <label className="block text-sm font-semibold text-slate-700 mb-2">
    ¿Cuál es el pago máximo que podría hacer sin atrasarse?
  </label>

  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

    <select
      value={evaluacionCrediticia.capacidad_pago_periodicidad}
      onChange={(e) =>
        setEvaluacionCrediticia((p) => ({
          ...p,
          capacidad_pago_periodicidad: e.target.value,
        }))
      }
      className="w-full px-3 py-2 border rounded-lg"
    >
      <option value="">Periodicidad</option>
      <option value="SEMANAL">Semanal</option>
      <option value="QUINCENAL">Quincenal</option>
      <option value="MENSUAL">Mensual</option>
    </select>

    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600">
        $
      </span>

      <input
        type="number"
        min="0"
        step="0.01"
        value={evaluacionCrediticia.capacidad_pago_monto}
        onChange={(e) =>
          setEvaluacionCrediticia((p) => ({
            ...p,
            capacidad_pago_monto: e.target.value,
          }))
        }
        className="w-full pl-8 pr-3 py-2 border rounded-lg"
        placeholder="Monto máximo"
      />
    </div>

  </div>
</div>


{/* DESTINO DEL DINERO */}
<div>
  <label className="block text-sm text-slate-700 mb-1">
    ¿Para qué necesita el dinero?
  </label>

  <textarea
    rows="2"
    value={evaluacionCrediticia.destino_dinero}
    onChange={(e) =>
      setEvaluacionCrediticia((p) => ({
        ...p,
        destino_dinero: e.target.value,
      }))
    }
    className="w-full px-3 py-2 border rounded-lg"
  />
</div>


{/* GENERARÁ INGRESOS */}
<div>
  <label className="block text-sm text-slate-700 mb-1">
    ¿Ese uso generará ingresos?
  </label>

  <select
    value={evaluacionCrediticia.uso_generara_ingresos}
    onChange={(e) =>
      setEvaluacionCrediticia((p) => ({
        ...p,
        uso_generara_ingresos: e.target.value,
      }))
    }
    className="w-full px-3 py-2 border rounded-lg"
  >
    <option value="">Seleccione</option>
    <option value="SI">Sí</option>
    <option value="NO">No</option>
  </select>
</div>


{evaluacionCrediticia.uso_generara_ingresos === 'SI' && (
  <div>
    <label className="block text-sm text-slate-700 mb-1">
      ¿En cuánto tiempo recuperará la inversión?
    </label>

    <input
      type="text"
      value={evaluacionCrediticia.tiempo_recuperacion}
      onChange={(e) =>
        setEvaluacionCrediticia((p) => ({
          ...p,
          tiempo_recuperacion: e.target.value,
        }))
      }
      className="w-full px-3 py-2 border rounded-lg"
      placeholder="Ej. 6 meses, 1 año..."
    />
  </div>
)}


{/* RIESGO */}
<div>
  <label className="block text-sm text-slate-700 mb-1">
    ¿Qué pasaría si el negocio, plan o proyecto no funciona?
  </label>

  <textarea
    rows="3"
    value={evaluacionCrediticia.riesgo_si_no_funciona}
    onChange={(e) =>
      setEvaluacionCrediticia((p) => ({
        ...p,
        riesgo_si_no_funciona: e.target.value,
      }))
    }
    className="w-full px-3 py-2 border rounded-lg"
  />
</div>


{/* OTROS INGRESOS */}
<div>
  <label className="block text-sm text-slate-700 mb-1">
    Otros ingresos
  </label>

  <textarea
    rows="2"
    value={evaluacionCrediticia.otros_ingresos}
    onChange={(e) =>
      setEvaluacionCrediticia((p) => ({
        ...p,
        otros_ingresos: e.target.value,
      }))
    }
    className="w-full px-3 py-2 border rounded-lg"
    placeholder="Indique otros ingresos, si existen"
  />
</div>


{/* NO PUEDE PAGAR */}
<div>
  <label className="block text-sm text-slate-700 mb-1">
    ¿Qué haría si no puede pagar una mensualidad?
  </label>

  <textarea
    rows="2"
    value={evaluacionCrediticia.accion_si_no_puede_pagar}
    onChange={(e) =>
      setEvaluacionCrediticia((p) => ({
        ...p,
        accion_si_no_puede_pagar: e.target.value,
      }))
    }
    className="w-full px-3 py-2 border rounded-lg"
  />
</div>


{/* SIN INGRESOS UN MES */}
<div>
  <label className="block text-sm text-slate-700 mb-1">
    ¿Qué pasaría si deja de recibir dinero un mes?
  </label>

  <textarea
    rows="2"
    value={evaluacionCrediticia.accion_si_sin_ingresos_mes}
    onChange={(e) =>
      setEvaluacionCrediticia((p) => ({
        ...p,
        accion_si_sin_ingresos_mes: e.target.value,
      }))
    }
    className="w-full px-3 py-2 border rounded-lg"
  />
</div>


{/* EMERGENCIA */}
<div>
  <label className="block text-sm text-slate-700 mb-1">
    Si hoy tuviera una emergencia fuerte, ¿cómo la resolvería?
  </label>

  <textarea
    rows="2"
    value={evaluacionCrediticia.accion_emergencia_fuerte}
    onChange={(e) =>
      setEvaluacionCrediticia((p) => ({
        ...p,
        accion_emergencia_fuerte: e.target.value,
      }))
    }
    className="w-full px-3 py-2 border rounded-lg"
  />
</div>


{/* PREGUNTA PRINCIPAL */}
<div className="border-2 border-amber-400 bg-amber-50 rounded-xl p-4">
  <p className="text-xs font-bold text-amber-700 uppercase mb-1">
    Pregunta más importante de la entrevista
  </p>

  <label className="block text-sm font-bold text-slate-900 mb-2">
    Explíqueme exactamente de dónde saldrá el dinero para pagar este préstamo
  </label>

  <textarea
    rows="4"
    value={evaluacionCrediticia.fuente_pago_prestamo}
    onChange={(e) =>
      setEvaluacionCrediticia((p) => ({
        ...p,
        fuente_pago_prestamo: e.target.value,
      }))
    }
    className="w-full px-3 py-2 border rounded-lg bg-white"
  />
</div>


{/* ====================================================== */}
{/* ======================= AVAL ========================== */}
{/* ====================================================== */}

<div className="border-t-2 border-indigo-500 pt-5 mt-5">

  <label className="block text-sm font-bold text-slate-900 mb-2">
    ¿Cuenta con Aval?
  </label>

  <div className="flex gap-6">

    <label className="flex items-center gap-2">
      <input
        type="radio"
        name="cuenta_con_aval"
        checked={evaluacionCrediticia.cuenta_con_aval === true}
        onChange={() =>
          setEvaluacionCrediticia((p) => ({
            ...p,
            cuenta_con_aval: true,
          }))
        }
      />
      Sí
    </label>

    <label className="flex items-center gap-2">
      <input
        type="radio"
        name="cuenta_con_aval"
        checked={evaluacionCrediticia.cuenta_con_aval === false}
        onChange={() =>
          setEvaluacionCrediticia((p) => ({
            ...p,
            cuenta_con_aval: false,
          }))
        }
      />
      No
    </label>

  </div>
</div>


{evaluacionCrediticia.cuenta_con_aval && (
  <div className="space-y-4 border border-slate-200 rounded-xl p-4 bg-slate-50">

    <h4 className="font-bold text-slate-900">
      Datos del Aval
    </h4>


    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

      <input
        type="text"
        placeholder="Nombre completo"
        value={avalPrestamo.nombre}
        onChange={(e) =>
          setAvalPrestamo((p) => ({
            ...p,
            nombre: e.target.value,
          }))
        }
        className="px-3 py-2 border rounded-lg"
      />

      <input
        type="number"
        min="18"
        max="120"
        placeholder="Edad"
        value={avalPrestamo.edad}
        onChange={(e) =>
          setAvalPrestamo((p) => ({
            ...p,
            edad: e.target.value,
          }))
        }
        className="px-3 py-2 border rounded-lg"
      />

      <input
        type="tel"
        inputMode="numeric"
        placeholder="Celular"
        value={avalPrestamo.celular}
        onChange={(e) =>
          setAvalPrestamo((p) => ({
            ...p,
            celular: e.target.value
              .replace(/\D/g, '')
              .slice(0, 15),
          }))
        }
        className="px-3 py-2 border rounded-lg"
      />

      <input
        type="text"
        placeholder="¿A qué se dedica?"
        value={avalPrestamo.ocupacion}
        onChange={(e) =>
          setAvalPrestamo((p) => ({
            ...p,
            ocupacion: e.target.value,
          }))
        }
        className="px-3 py-2 border rounded-lg"
      />

    </div>
    {/* ================= IDENTIFICACIÓN DEL AVAL ================= */}
    <div
  className={`border rounded-xl p-4 ${
    erroresFormulario.identificacionAval
      ? 'border-red-500 bg-red-50'
      : 'border-slate-200 bg-white'
  }`}
>

      <label className="block text-sm font-semibold text-slate-800 mb-2">
        Copia de identificación del Aval *
      </label>

      <p className="text-xs text-slate-500 mb-3">
        Adjunte INE, pasaporte u otra identificación oficial.
        PDF, JPG o PNG. Máximo 10 MB.
      </p>

  {erroresFormulario.identificacionAval && (
  <p className="mb-3 text-sm font-semibold text-red-600">
    ⚠ {erroresFormulario.identificacionAval}
  </p>
)}

      <label
        className="
          flex
          items-center
          justify-center
          gap-2
          w-full
          sm:w-auto
          sm:inline-flex
          px-4
          py-3
          sm:py-2
          bg-indigo-600
          text-white
          rounded-xl
          cursor-pointer
          hover:bg-indigo-700
          transition-colors
          font-medium
          text-sm
        "
      >
        <span>📎</span>

        <span>
          {archivoIdentificacionAval
            ? 'Cambiar archivo'
            : 'Adjuntar identificación'}
        </span>

        <input
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
          onChange={(e) => {
  const file = e.target.files?.[0] || null;

  const errorArchivo = validarArchivoPrestamo(file);

  if (errorArchivo) {
    setArchivoIdentificacionAval(null);

    setErroresFormulario((prev) => ({
      ...prev,
      identificacionAval: errorArchivo,
    }));

    e.target.value = '';
    return;
  }

  setArchivoIdentificacionAval(file);

  setErroresFormulario((prev) => ({
    ...prev,
    identificacionAval: '',
  }));
}}
          className="hidden"
        />
      </label>

      {archivoIdentificacionAval && (
        <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">

          <div className="flex items-start justify-between gap-3">

            <div className="min-w-0">
              <p className="text-sm font-medium text-emerald-800">
                Archivo seleccionado
              </p>

              <p className="text-xs text-emerald-700 break-all mt-1">
                {archivoIdentificacionAval.name}
              </p>

              <p className="text-xs text-slate-500 mt-1">
                {(archivoIdentificacionAval.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>

            <button
              type="button"
              onClick={() => setArchivoIdentificacionAval(null)}
              className="shrink-0 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100"
            >
              Quitar
            </button>

          </div>

        </div>
      )}

    </div>

    <h5 className="font-semibold text-slate-800">
      Domicilio del Aval
    </h5>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

      <input
        type="text"
        placeholder="Calle"
        value={avalPrestamo.domicilio_calle}
        onChange={(e) =>
          setAvalPrestamo((p) => ({
            ...p,
            domicilio_calle: e.target.value,
          }))
        }
        className="px-3 py-2 border rounded-lg"
      />

      <input
        type="text"
        placeholder="Número"
        value={avalPrestamo.domicilio_numero}
        onChange={(e) =>
          setAvalPrestamo((p) => ({
            ...p,
            domicilio_numero: e.target.value,
          }))
        }
        className="px-3 py-2 border rounded-lg"
      />

      <input
        type="text"
        placeholder="Edificio (opcional)"
        value={avalPrestamo.domicilio_edificio}
        onChange={(e) =>
          setAvalPrestamo((p) => ({
            ...p,
            domicilio_edificio: e.target.value,
          }))
        }
        className="px-3 py-2 border rounded-lg"
      />

      <input
        type="text"
        placeholder="Colonia"
        value={avalPrestamo.domicilio_colonia}
        onChange={(e) =>
          setAvalPrestamo((p) => ({
            ...p,
            domicilio_colonia: e.target.value,
          }))
        }
        className="px-3 py-2 border rounded-lg"
      />


      <select
        value={avalPrestamo.domicilio_estado}
        onChange={(e) => {
          const estado = e.target.value;

          setAvalPrestamo((p) => ({
            ...p,
            domicilio_estado: estado,
            domicilio_pais:
              estado === 'EXTRANJERO'
                ? p.domicilio_pais
                : '',
          }));
        }}
        className="px-3 py-2 border rounded-lg"
      >
        <option value="">Estado</option>

        {ESTADOS_MEXICO.map((estado) => (
          <option key={estado} value={estado}>
            {estado}
          </option>
        ))}

        <option value="EXTRANJERO">
          Extranjero
        </option>
      </select>


      {avalPrestamo.domicilio_estado === 'EXTRANJERO' && (
        <input
          type="text"
          placeholder="País"
          value={avalPrestamo.domicilio_pais}
          onChange={(e) =>
            setAvalPrestamo((p) => ({
              ...p,
              domicilio_pais: e.target.value,
            }))
          }
          className="px-3 py-2 border rounded-lg"
        />
      )}


      <input
        type="text"
        placeholder="Alcaldía o Municipio"
        value={avalPrestamo.domicilio_municipio}
        onChange={(e) =>
          setAvalPrestamo((p) => ({
            ...p,
            domicilio_municipio: e.target.value,
          }))
        }
        className="px-3 py-2 border rounded-lg"
      />

      <input
        type="text"
        inputMode="numeric"
        placeholder="Código Postal"
        value={avalPrestamo.domicilio_cp}
        onChange={(e) =>
          setAvalPrestamo((p) => ({
            ...p,
            domicilio_cp: e.target.value
              .replace(/\D/g, '')
              .slice(0, 5),
          }))
        }
        className="px-3 py-2 border rounded-lg"
      />

      <input
        type="text"
        placeholder="Entre Calles"
        value={avalPrestamo.domicilio_entre_calles}
        onChange={(e) =>
          setAvalPrestamo((p) => ({
            ...p,
            domicilio_entre_calles: e.target.value,
          }))
        }
        className="md:col-span-2 px-3 py-2 border rounded-lg"
      />

      <textarea
        rows="2"
        placeholder="Referencias del domicilio"
        value={avalPrestamo.domicilio_referencias}
        onChange={(e) =>
          setAvalPrestamo((p) => ({
            ...p,
            domicilio_referencias: e.target.value,
          }))
        }
        className="md:col-span-2 px-3 py-2 border rounded-lg"
      />

    </div>


    <div>
      <label className="block text-sm text-slate-700 mb-1">
        ¿Tiene redes sociales?
      </label>

      <select
        value={avalPrestamo.tiene_redes_sociales}
        onChange={(e) =>
          setAvalPrestamo((p) => ({
            ...p,
            tiene_redes_sociales: e.target.value,
            redes_sociales_detalle:
              e.target.value === 'SI'
                ? p.redes_sociales_detalle
                : '',
          }))
        }
        className="w-full px-3 py-2 border rounded-lg"
      >
        <option value="">Seleccione</option>
        <option value="SI">Sí</option>
        <option value="NO">No</option>
      </select>
    </div>


    {avalPrestamo.tiene_redes_sociales === 'SI' && (
      <input
        type="text"
        placeholder="Red social / usuario / enlace"
        value={avalPrestamo.redes_sociales_detalle}
        onChange={(e) =>
          setAvalPrestamo((p) => ({
            ...p,
            redes_sociales_detalle: e.target.value,
          }))
        }
        className="w-full px-3 py-2 border rounded-lg"
      />
    )}

  </div>
)}

{/* ===================================================== */}
{/* ===================== GARANTÍAS ====================== */}
{/* ===================================================== */}

<div className="border-t-2 border-indigo-500 pt-5 mt-5 space-y-5">

  <div>
    <h4 className="text-lg font-bold text-slate-900">
      Garantías
    </h4>
    <p className="text-sm text-slate-500">
      Información sobre activos que pueden respaldar el préstamo.
    </p>
  </div>

  {/* ================= PROPIEDAD ================= */}

  <div className="border border-slate-200 rounded-xl p-4 space-y-4 bg-slate-50">

    <div>
      <label className="block text-sm font-semibold text-slate-800 mb-2">
        ¿Tiene propiedades?
      </label>

      <select
        value={evaluacionCrediticia.tiene_propiedades}
        onChange={(e) =>
          setEvaluacionCrediticia((p) => ({
            ...p,
            tiene_propiedades: e.target.value,
          }))
        }
        className="w-full px-3 py-2 border rounded-lg bg-white"
      >
        <option value="">Seleccione</option>
        <option value="SI">Sí</option>
        <option value="NO">No</option>
      </select>
    </div>

    {evaluacionCrediticia.tiene_propiedades === 'SI' && (
      <div className="space-y-4">

        <h5 className="font-bold text-slate-900">
          Datos de la propiedad
        </h5>

        <div>
          <label className="block text-sm text-slate-700 mb-1">
            ¿A quién pertenece la propiedad?
          </label>

          <select
            value={garantiasPrestamo.propiedad_pertenece_a}
            onChange={(e) =>
              setGarantiasPrestamo((p) => ({
                ...p,
                propiedad_pertenece_a: e.target.value,
              }))
            }
            className="w-full px-3 py-2 border rounded-lg bg-white"
          >
            <option value="SOLICITANTE">Solicitante</option>
            <option value="AVAL">Aval</option>
          </select>
        </div>

        <div>
          <label className="block text-sm text-slate-700 mb-1">
            Tipo de propiedad
          </label>

          <select
            value={garantiasPrestamo.propiedad_tipo}
            onChange={(e) =>
              setGarantiasPrestamo((p) => ({
                ...p,
                propiedad_tipo: e.target.value,
              }))
            }
            className="w-full px-3 py-2 border rounded-lg bg-white"
          >
            <option value="">Seleccione</option>
            <option value="CASA">Casa</option>
            <option value="DEPARTAMENTO">Departamento</option>
            <option value="TERRENO">Terreno</option>
            <option value="LOCAL">Local comercial</option>
            <option value="BODEGA">Bodega</option>
            <option value="OTRO">Otro</option>
          </select>
        </div>

        <div>
          <h6 className="font-semibold text-slate-800 mb-2">
            Dirección de la propiedad
          </h6>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

            <input
              type="text"
              placeholder="Calle"
              value={garantiasPrestamo.propiedad_calle}
              onChange={(e) =>
                setGarantiasPrestamo((p) => ({
                  ...p,
                  propiedad_calle: e.target.value,
                }))
              }
              className="px-3 py-2 border rounded-lg"
            />

            <input
              type="text"
              placeholder="Número"
              value={garantiasPrestamo.propiedad_numero}
              onChange={(e) =>
                setGarantiasPrestamo((p) => ({
                  ...p,
                  propiedad_numero: e.target.value,
                }))
              }
              className="px-3 py-2 border rounded-lg"
            />

            <input
              type="text"
              placeholder="Edificio"
              value={garantiasPrestamo.propiedad_edificio}
              onChange={(e) =>
                setGarantiasPrestamo((p) => ({
                  ...p,
                  propiedad_edificio: e.target.value,
                }))
              }
              className="px-3 py-2 border rounded-lg"
            />

            <input
              type="text"
              placeholder="Colonia"
              value={garantiasPrestamo.propiedad_colonia}
              onChange={(e) =>
                setGarantiasPrestamo((p) => ({
                  ...p,
                  propiedad_colonia: e.target.value,
                }))
              }
              className="px-3 py-2 border rounded-lg"
            />

            <select
              value={garantiasPrestamo.propiedad_estado}
              onChange={(e) =>
                setGarantiasPrestamo((p) => ({
                  ...p,
                  propiedad_estado: e.target.value,
                  propiedad_pais:
                    e.target.value === 'EXTRANJERO'
                      ? p.propiedad_pais
                      : '',
                }))
              }
              className="px-3 py-2 border rounded-lg bg-white"
            >
              <option value="">Estado</option>

              {ESTADOS_MEXICO.map((estado) => (
                <option key={estado} value={estado}>
                  {estado}
                </option>
              ))}

              <option value="EXTRANJERO">Extranjero</option>
            </select>

            {garantiasPrestamo.propiedad_estado === 'EXTRANJERO' && (
              <input
                type="text"
                placeholder="País"
                value={garantiasPrestamo.propiedad_pais}
                onChange={(e) =>
                  setGarantiasPrestamo((p) => ({
                    ...p,
                    propiedad_pais: e.target.value,
                  }))
                }
                className="px-3 py-2 border rounded-lg"
              />
            )}

            <input
              type="text"
              placeholder="Alcaldía / Municipio"
              value={garantiasPrestamo.propiedad_municipio}
              onChange={(e) =>
                setGarantiasPrestamo((p) => ({
                  ...p,
                  propiedad_municipio: e.target.value,
                }))
              }
              className="px-3 py-2 border rounded-lg"
            />

            <input
              type="text"
              inputMode="numeric"
              placeholder="Código Postal"
              value={garantiasPrestamo.propiedad_cp}
              onChange={(e) =>
                setGarantiasPrestamo((p) => ({
                  ...p,
                  propiedad_cp: e.target.value
                    .replace(/\D/g, '')
                    .slice(0, 5),
                }))
              }
              className="px-3 py-2 border rounded-lg"
            />

            <input
              type="text"
              placeholder="Entre calles"
              value={garantiasPrestamo.propiedad_entre_calles}
              onChange={(e) =>
                setGarantiasPrestamo((p) => ({
                  ...p,
                  propiedad_entre_calles: e.target.value,
                }))
              }
              className="px-3 py-2 border rounded-lg"
            />

            <input
              type="text"
              placeholder="Referencias"
              value={garantiasPrestamo.propiedad_referencias}
              onChange={(e) =>
                setGarantiasPrestamo((p) => ({
                  ...p,
                  propiedad_referencias: e.target.value,
                }))
              }
              className="px-3 py-2 border rounded-lg"
            />

          </div>
        </div>

        <div>
          <label className="block text-sm text-slate-700 mb-1">
            Valor estimado de la propiedad
          </label>

          <div className="relative">
            <span className="absolute left-3 top-2 text-slate-500">
              $
            </span>

            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={garantiasPrestamo.propiedad_valor_estimado}
              onChange={(e) =>
                setGarantiasPrestamo((p) => ({
                  ...p,
                  propiedad_valor_estimado: e.target.value,
                }))
              }
              className="w-full pl-7 pr-3 py-2 border rounded-lg"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm text-slate-700 mb-1">
            Escritura o título de propiedad
          </label>

          <textarea
            rows="2"
            placeholder="Indique la documentación que acredita la propiedad"
            value={garantiasPrestamo.propiedad_documentacion}
            onChange={(e) =>
              setGarantiasPrestamo((p) => ({
                ...p,
                propiedad_documentacion: e.target.value,
              }))
            }
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>
        {/* ================= DOCUMENTO DE LA PROPIEDAD ================= */}
       <div
  className={`border rounded-xl p-4 ${
    erroresFormulario.documentoPropiedad
      ? 'border-red-500 bg-red-50'
      : 'border-slate-200 bg-white'
  }`}
>
          <label className="block text-sm font-semibold text-slate-800 mb-2">
            Documento que acredita la propiedad *
          </label>

         <p className="text-xs text-slate-500 mb-3">
  Adjunte escritura, título de propiedad u otro documento
  que acredite legalmente la propiedad.
  PDF, JPG o PNG. Máximo 10 MB.
</p>

{erroresFormulario.documentoPropiedad && (
  <p className="mb-3 text-sm font-semibold text-red-600">
    ⚠ {erroresFormulario.documentoPropiedad}
  </p>
)}

          <label
            className="
              flex
              items-center
              justify-center
              gap-2
              w-full
              sm:w-auto
              sm:inline-flex
              px-4
              py-3
              sm:py-2
              bg-indigo-600
              text-white
              rounded-xl
              cursor-pointer
              hover:bg-indigo-700
              transition-colors
              font-medium
              text-sm
            "
          >
            <span>📎</span>

            <span>
              {archivoDocumentoPropiedad
                ? 'Cambiar documento'
                : 'Adjuntar documento'}
            </span>

            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
             onChange={(e) => {
  const file = e.target.files?.[0] || null;

  const errorArchivo = validarArchivoPrestamo(file);

  if (errorArchivo) {
    setArchivoDocumentoPropiedad(null);

    setErroresFormulario((prev) => ({
      ...prev,
      documentoPropiedad: errorArchivo,
    }));

    e.target.value = '';
    return;
  }

  setArchivoDocumentoPropiedad(file);

  setErroresFormulario((prev) => ({
    ...prev,
    documentoPropiedad: '',
  }));
}}
              className="hidden"
            />
          </label>

          {archivoDocumentoPropiedad && (
            <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">

              <div className="flex items-start justify-between gap-3">

                <div className="min-w-0">
                  <p className="text-sm font-medium text-emerald-800">
                    Documento seleccionado
                  </p>

                  <p className="text-xs text-emerald-700 break-all mt-1">
                    {archivoDocumentoPropiedad.name}
                  </p>

                  <p className="text-xs text-slate-500 mt-1">
                    {(archivoDocumentoPropiedad.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setArchivoDocumentoPropiedad(null)}
                  className="shrink-0 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100"
                >
                  Quitar
                </button>

              </div>

            </div>
          )}

        </div>
        <div>
          <label className="block text-sm text-slate-700 mb-1">
            Hipotecas o gravámenes existentes
          </label>

          <textarea
            rows="2"
            placeholder="Indique montos y entidades si aplica"
            value={garantiasPrestamo.propiedad_gravamenes}
            onChange={(e) =>
              setGarantiasPrestamo((p) => ({
                ...p,
                propiedad_gravamenes: e.target.value,
              }))
            }
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>

      </div>
    )}

  </div>


  {/* ================= VEHÍCULO ================= */}

  <div className="border border-slate-200 rounded-xl p-4 space-y-4 bg-slate-50">

    <div>
      <label className="block text-sm font-semibold text-slate-800 mb-2">
        ¿Tiene automóvil?
      </label>

      <select
        value={evaluacionCrediticia.tiene_automovil}
        onChange={(e) =>
          setEvaluacionCrediticia((p) => ({
            ...p,
            tiene_automovil: e.target.value,
          }))
        }
        className="w-full px-3 py-2 border rounded-lg bg-white"
      >
        <option value="">Seleccione</option>
        <option value="SI">Sí</option>
        <option value="NO">No</option>
      </select>
    </div>

    {evaluacionCrediticia.tiene_automovil === 'SI' && (
      <div className="space-y-4">

        <h5 className="font-bold text-slate-900">
          Datos del vehículo
        </h5>

        <div>
          <label className="block text-sm text-slate-700 mb-1">
            ¿A quién pertenece el vehículo?
          </label>

          <select
            value={garantiasPrestamo.vehiculo_pertenece_a}
            onChange={(e) =>
              setGarantiasPrestamo((p) => ({
                ...p,
                vehiculo_pertenece_a: e.target.value,
              }))
            }
            className="w-full px-3 py-2 border rounded-lg bg-white"
          >
            <option value="SOLICITANTE">Solicitante</option>
            <option value="AVAL">Aval</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

          <input
            type="text"
            placeholder="Marca"
            value={garantiasPrestamo.vehiculo_marca}
            onChange={(e) =>
              setGarantiasPrestamo((p) => ({
                ...p,
                vehiculo_marca: e.target.value,
              }))
            }
            className="px-3 py-2 border rounded-lg"
          />

          <input
            type="text"
            placeholder="Modelo"
            value={garantiasPrestamo.vehiculo_modelo}
            onChange={(e) =>
              setGarantiasPrestamo((p) => ({
                ...p,
                vehiculo_modelo: e.target.value,
              }))
            }
            className="px-3 py-2 border rounded-lg"
          />

          <input
            type="number"
            min="1900"
            max="2100"
            placeholder="Año de fabricación"
            value={garantiasPrestamo.vehiculo_anio}
            onChange={(e) =>
              setGarantiasPrestamo((p) => ({
                ...p,
                vehiculo_anio: e.target.value,
              }))
            }
            className="px-3 py-2 border rounded-lg"
          />

          <div className="relative">
            <span className="absolute left-3 top-2 text-slate-500">
              $
            </span>

            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="Valor estimado"
              value={garantiasPrestamo.vehiculo_valor_estimado}
              onChange={(e) =>
                setGarantiasPrestamo((p) => ({
                  ...p,
                  vehiculo_valor_estimado: e.target.value,
                }))
              }
              className="w-full pl-7 pr-3 py-2 border rounded-lg"
            />
          </div>

        </div>

        <div>
          <label className="block text-sm text-slate-700 mb-1">
            Documentación de propiedad
          </label>

          <textarea
            rows="2"
            placeholder="Título, factura, tarjeta de circulación, etc."
            value={garantiasPrestamo.vehiculo_documentacion}
            onChange={(e) =>
              setGarantiasPrestamo((p) => ({
                ...p,
                vehiculo_documentacion: e.target.value,
              }))
            }
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>

{/* ================= DOCUMENTO DEL VEHÍCULO ================= */}
<div
  className={`border rounded-xl p-4 ${
    erroresFormulario.documentoVehiculo
      ? 'border-red-500 bg-red-50'
      : 'border-slate-200 bg-white'
  }`}
>

  <label className="block text-sm font-semibold text-slate-800 mb-2">
    Documento que acredita la propiedad del vehículo *
  </label>

<p className="text-xs text-slate-500 mb-3">
  Adjunte factura, título del vehículo, carta factura u otro documento
  que acredite la propiedad. PDF, JPG o PNG. Máximo 10 MB.
</p>

{erroresFormulario.documentoVehiculo && (
  <p className="mb-3 text-sm font-semibold text-red-600">
    ⚠ {erroresFormulario.documentoVehiculo}
  </p>
)}


  <label
    className="
      flex
      items-center
      justify-center
      gap-2
      w-full
      sm:w-auto
      sm:inline-flex
      px-4
      py-3
      sm:py-2
      bg-indigo-600
      text-white
      rounded-xl
      cursor-pointer
      hover:bg-indigo-700
      transition-colors
      font-medium
      text-sm
    "
  >
    <span>📎</span>

    <span>
      {archivoDocumentoVehiculo
        ? 'Cambiar documento'
        : 'Adjuntar documento'}
    </span>

    <input
      type="file"
      accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
     onChange={(e) => {
  const file = e.target.files?.[0] || null;

  const errorArchivo = validarArchivoPrestamo(file);

  if (errorArchivo) {
    setArchivoDocumentoVehiculo(null);

    setErroresFormulario((prev) => ({
      ...prev,
      documentoVehiculo: errorArchivo,
    }));

    e.target.value = '';
    return;
  }

  setArchivoDocumentoVehiculo(file);

  setErroresFormulario((prev) => ({
    ...prev,
    documentoVehiculo: '',
  }));
}}
      className="hidden"
    />
  </label>

  {archivoDocumentoVehiculo && (
    <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">

      <div className="flex items-start justify-between gap-3">

        <div className="min-w-0">
          <p className="text-sm font-medium text-emerald-800">
            Documento seleccionado
          </p>

          <p className="text-xs text-emerald-700 break-all mt-1">
            {archivoDocumentoVehiculo.name}
          </p>

          <p className="text-xs text-slate-500 mt-1">
            {(archivoDocumentoVehiculo.size / 1024 / 1024).toFixed(2)} MB
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            setArchivoDocumentoVehiculo(null)
          }
          className="shrink-0 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100"
        >
          Quitar
        </button>

      </div>

    </div>
  )}

</div>
              
        <div>
          <label className="block text-sm text-slate-700 mb-1">
            Gravámenes o préstamos pendientes
          </label>

          <textarea
            rows="2"
            placeholder="Indique si existe algún financiamiento o gravamen"
            value={garantiasPrestamo.vehiculo_gravamenes}
            onChange={(e) =>
              setGarantiasPrestamo((p) => ({
                ...p,
                vehiculo_gravamenes: e.target.value,
              }))
            }
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>

      </div>
    )}

  </div>


  {/* ================= OTROS ACTIVOS ================= */}

  <div className="border border-slate-200 rounded-xl p-4 space-y-4 bg-slate-50">

    <div>
      <label className="block text-sm font-semibold text-slate-800 mb-2">
        ¿Cuenta con otro activo que pueda dejar como garantía?
      </label>

      <select
        value={garantiasPrestamo.tiene_otro_activo}
        onChange={(e) =>
          setGarantiasPrestamo((p) => ({
            ...p,
            tiene_otro_activo: e.target.value,
          }))
        }
        className="w-full px-3 py-2 border rounded-lg bg-white"
      >
        <option value="">Seleccione</option>
        <option value="SI">Sí</option>
        <option value="NO">No</option>
      </select>
    </div>

    {garantiasPrestamo.tiene_otro_activo === 'SI' && (
      <div className="space-y-4">

        <h5 className="font-bold text-slate-900">
          Otro activo
        </h5>

        <div>
          <label className="block text-sm text-slate-700 mb-1">
            ¿A quién pertenece?
          </label>

          <select
            value={garantiasPrestamo.otro_pertenece_a}
            onChange={(e) =>
              setGarantiasPrestamo((p) => ({
                ...p,
                otro_pertenece_a: e.target.value,
              }))
            }
            className="w-full px-3 py-2 border rounded-lg bg-white"
          >
            <option value="SOLICITANTE">Solicitante</option>
            <option value="AVAL">Aval</option>
          </select>
        </div>

        <div>
          <label className="block text-sm text-slate-700 mb-1">
            Tipo de activo
          </label>

          <input
            type="text"
            placeholder="Ej. joyas, maquinaria, equipo, objetos de valor..."
            value={garantiasPrestamo.otro_tipo}
            onChange={(e) =>
              setGarantiasPrestamo((p) => ({
                ...p,
                otro_tipo: e.target.value,
              }))
            }
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>

        <div>
          <label className="block text-sm text-slate-700 mb-1">
            Descripción del activo
          </label>

          <textarea
            rows="3"
            placeholder="Describa detalladamente el activo"
            value={garantiasPrestamo.otro_descripcion}
            onChange={(e) =>
              setGarantiasPrestamo((p) => ({
                ...p,
                otro_descripcion: e.target.value,
              }))
            }
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>

        <div>
          <label className="block text-sm text-slate-700 mb-1">
            Valor estimado
          </label>

          <div className="relative">
            <span className="absolute left-3 top-2 text-slate-500">
              $
            </span>

            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={garantiasPrestamo.otro_valor_estimado}
              onChange={(e) =>
                setGarantiasPrestamo((p) => ({
                  ...p,
                  otro_valor_estimado: e.target.value,
                }))
              }
              className="w-full pl-7 pr-3 py-2 border rounded-lg"
            />
          </div>
        </div>

      </div>
    )}

  </div>

</div>

              {/* Monto / Plazos */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-700 mb-1">Monto solicitado</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border rounded-lg"
                    value={newPrestamo.monto_solicitado}
                    onChange={(e) => setNewPrestamo((p) => ({ ...p, monto_solicitado: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-700 mb-1">Número de plazos</label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    className="w-full px-3 py-2 border rounded-lg"
                    value={newPrestamo.numero_plazos}
                    onChange={(e) => setNewPrestamo((p) => ({ ...p, numero_plazos: e.target.value }))}
                  />
                </div>
              </div>

{/* Tipo de plazo / Interés */}
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  <div>
    <label className="block text-sm text-slate-700 mb-1">
      Tipo de plazo
    </label>

    <select
      className="w-full px-3 py-2 border rounded-lg"
      value={newPrestamo.tipo_plazo}
      onChange={(e) =>
        setNewPrestamo((p) => ({
          ...p,
          tipo_plazo: e.target.value
        }))
      }
    >
      <option value="mensual">Mensual</option>
      <option value="quincenal">Quincenal</option>
      <option value="semanal">Semanal</option>
    </select>
  </div>

  <div>
    <label className="block text-sm text-slate-700 mb-1">
      Interés por periodo (%)
    </label>

    {/* Escritorio */}
    <input
      type="number"
      min="0"
      step="0.01"
      className="hidden md:block w-full px-3 py-2 border rounded-lg"
      value={newPrestamo.interes}
      onChange={(e) =>
        setNewPrestamo((p) => ({
          ...p,
          interes: e.target.value
        }))
      }
    />

    {/* Móvil */}
    <div className="flex md:hidden items-stretch gap-2">
      <button
        type="button"
        className="w-11 shrink-0 rounded-lg border border-slate-200 bg-slate-100 text-lg font-semibold text-slate-700 active:bg-slate-200"
        onClick={() =>
          setNewPrestamo((p) => ({
            ...p,
            interes: String(
              Math.max(
                0,
                (parseFloat(p.interes) || 0) - 0.5
              ).toFixed(2)
            )
          }))
        }
      >
        −
      </button>

      <input
        type="number"
        min="0"
        step="0.01"
        inputMode="decimal"
        className="min-w-0 flex-1 px-3 py-2 border rounded-lg text-center"
        value={newPrestamo.interes}
        onChange={(e) =>
          setNewPrestamo((p) => ({
            ...p,
            interes: e.target.value
          }))
        }
      />

      <button
        type="button"
        className="w-11 shrink-0 rounded-lg border border-slate-200 bg-slate-100 text-lg font-semibold text-slate-700 active:bg-slate-200"
        onClick={() =>
          setNewPrestamo((p) => ({
            ...p,
            interes: String(
              ((parseFloat(p.interes) || 0) + 0.5).toFixed(2)
            )
          }))
        }
      >
        +
      </button>
    </div>
  </div>
</div>

              {/* Fecha de solicitud + Resumen */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-700 mb-1">Fecha de solicitud</label>
                 <input
  type="date"
  className="w-full px-3 py-2 border rounded-lg"
  value={
    /^\d{4}-\d{2}-\d{2}$/.test(newPrestamo.fecha_solicitud)
      ? newPrestamo.fecha_solicitud
      : ''
  }
  onFocus={(e) => {
    if (e.target.showPicker) e.target.showPicker();
  }}
  onClick={(e) => {
    if (e.target.showPicker) e.target.showPicker();
  }}
  onChange={(e) =>
    setNewPrestamo((p) => ({
      ...p,
      fecha_solicitud: e.target.value
    }))
  }
/>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                  <div className="text-sm text-slate-700">
                    <div><span className="font-medium">Pago por periodo:</span> {formatCurrency(pagoPeriodo)}</div>
                    <div><span className="font-medium">Interés (1er periodo aprox.):</span> {formatCurrency(interesPeriodoEstimado)}</div>
                    <div><span className="font-medium">Abono a capital (1er periodo aprox.):</span> {formatCurrency(abonoCapitalPeriodo)}</div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  className="px-4 py-2 rounded-lg bg-slate-100"
                  onClick={() => { setShowAddPrestamoModal(false); resetNuevoPrestamo(); }}
                  disabled={submitting}
                >
                  Cancelar
                </button>
                <button
                  className="px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60"
                  onClick={handleCreatePrestamo}
                  disabled={submitting}
                >
                  {submitting ? 'Guardando…' : 'Guardar'}
                </button>
              </div>
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
