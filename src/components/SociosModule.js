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
const textoMayusculas = (valor = '') =>
  String(valor || '').trim().toUpperCase();

const correoMinusculas = (valor = '') =>
  String(valor || '').trim().toLowerCase();

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


const PARENTESCOS_FAMILIARES = [
  'PAPÁ',
  'MAMÁ',
  'HERMANO (A)',
  'TÍO (A)',
  'ABUELO (A)',
  'PRIMO (A)',
  'SOBRINO (A)',
  'CUÑADO (A)',
  'COMPADRE (A)',
];


const PARENTESCOS_PERSONALES = [
  'VECINO (A)',
  'AMIGO (A)',
  'PATRÓN (A)',
];

const FormularioReferencia = ({
  titulo,
  datos,
  setDatos,
  opcionesParentesco,
}) => {

  const actualizar = (campo, valor) => {
    setDatos((prev) => ({
      ...prev,
      [campo]: valor,
    }));
  };

  return (
    <>
      <div className="col-span-full border-t-2 border-blue-600 pt-6 mt-6">
        <h4 className="font-bold text-slate-900 text-lg">
          {titulo}
        </h4>
      </div>

      <input
        type="text"
        placeholder="Nombre *"
        value={datos.nombre}
        onChange={(e) =>
          actualizar('nombre', e.target.value)
        }
        className="px-4 py-2 border border-slate-200 rounded-lg"
      />

      <input
        type="text"
        placeholder="Apellido Paterno *"
        value={datos.apellido_paterno}
        onChange={(e) =>
          actualizar(
            'apellido_paterno',
            e.target.value
          )
        }
        className="px-4 py-2 border border-slate-200 rounded-lg"
      />

      <input
        type="text"
        placeholder="Apellido Materno *"
        value={datos.apellido_materno}
        onChange={(e) =>
          actualizar(
            'apellido_materno',
            e.target.value
          )
        }
        className="px-4 py-2 border border-slate-200 rounded-lg"
      />

      <input
        type="tel"
        inputMode="numeric"
        pattern="[0-9]*"
        placeholder="Teléfono *"
        value={datos.telefono}
        onChange={(e) =>
          actualizar(
            'telefono',
            onlyDigitsMax(e.target.value, 15)
          )
        }
        className="px-4 py-2 border border-slate-200 rounded-lg"
      />

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Parentesco *
        </label>

        <select
          value={datos.parentesco}
          onChange={(e) =>
            actualizar(
              'parentesco',
              e.target.value
            )
          }
          className="w-full px-4 py-2 border border-slate-200 rounded-lg"
        >
          <option value="">
            Seleccione
          </option>

          {opcionesParentesco.map((opcion) => (
            <option
              key={opcion}
              value={opcion}
            >
              {opcion}
            </option>
          ))}
        </select>
      </div>


      <div className="col-span-full">
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          Tiempo de conocerlo
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

          <select
            value={datos.tiempo_conocer_anios}
            onChange={(e) =>
              actualizar(
                'tiempo_conocer_anios',
                e.target.value
              )
            }
            className="w-full px-4 py-2 border border-slate-200 rounded-lg"
          >
            <option value="">
              Años
            </option>

            {Array.from(
              { length: 50 },
              (_, i) => i + 1
            ).map((numero) => (
              <option
                key={numero}
                value={numero}
              >
                {numero} años
              </option>
            ))}
          </select>

          <select
            value={datos.tiempo_conocer_meses}
            onChange={(e) =>
              actualizar(
                'tiempo_conocer_meses',
                e.target.value
              )
            }
            className="w-full px-4 py-2 border border-slate-200 rounded-lg"
          >
            <option value="">
              Meses
            </option>

            {Array.from(
              { length: 11 },
              (_, i) => i + 1
            ).map((numero) => (
              <option
                key={numero}
                value={numero}
              >
                {numero} meses
              </option>
            ))}
          </select>

        </div>
      </div>


      <div className="col-span-full mt-2">
        <h5 className="font-semibold text-slate-800">
          Dirección completa
        </h5>
      </div>


      <input
        type="text"
        placeholder="Calle *"
        value={datos.domicilio_calle}
        onChange={(e) =>
          actualizar(
            'domicilio_calle',
            e.target.value
          )
        }
        className="px-4 py-2 border border-slate-200 rounded-lg"
      />

      <input
        type="text"
        placeholder="Número *"
        value={datos.domicilio_numero}
        onChange={(e) =>
          actualizar(
            'domicilio_numero',
            e.target.value
          )
        }
        className="px-4 py-2 border border-slate-200 rounded-lg"
      />

      <input
        type="text"
        placeholder="Edificio"
        value={datos.domicilio_edificio}
        onChange={(e) =>
          actualizar(
            'domicilio_edificio',
            e.target.value
          )
        }
        className="px-4 py-2 border border-slate-200 rounded-lg"
      />

      <input
        type="text"
        placeholder="Colonia *"
        value={datos.domicilio_colonia}
        onChange={(e) =>
          actualizar(
            'domicilio_colonia',
            e.target.value
          )
        }
        className="px-4 py-2 border border-slate-200 rounded-lg"
      />


      <select
        value={datos.domicilio_estado}
        onChange={(e) => {
          const estado = e.target.value;

          setDatos((prev) => ({
            ...prev,
            domicilio_estado: estado,

            domicilio_pais:
              estado === 'EXTRANJERO'
                ? prev.domicilio_pais
                : '',
          }));
        }}
        className="px-4 py-2 border border-slate-200 rounded-lg"
      >
        <option value="">
          Estado *
        </option>

        {ESTADOS_MEXICO.map((estado) => (
          <option
            key={estado}
            value={estado}
          >
            {estado}
          </option>
        ))}

        <option value="EXTRANJERO">
          Extranjero
        </option>
      </select>


      {datos.domicilio_estado ===
        'EXTRANJERO' && (
        <input
          type="text"
          placeholder="País *"
          value={datos.domicilio_pais}
          onChange={(e) =>
            actualizar(
              'domicilio_pais',
              e.target.value
            )
          }
          className="px-4 py-2 border border-slate-200 rounded-lg"
        />
      )}


      <input
        type="text"
        placeholder="Alcaldía o Municipio *"
        value={datos.domicilio_municipio}
        onChange={(e) =>
          actualizar(
            'domicilio_municipio',
            e.target.value
          )
        }
        className="px-4 py-2 border border-slate-200 rounded-lg"
      />

      <input
        type="tel"
        inputMode="numeric"
        pattern="[0-9]*"
        placeholder="Código Postal *"
        value={datos.domicilio_cp}
        onChange={(e) =>
          actualizar(
            'domicilio_cp',
            onlyDigitsMax(e.target.value, 5)
          )
        }
        className="px-4 py-2 border border-slate-200 rounded-lg"
      />


      <input
        type="text"
        placeholder="Entre Calles *"
        value={datos.domicilio_entre_calles}
        onChange={(e) =>
          actualizar(
            'domicilio_entre_calles',
            e.target.value
          )
        }
        className="col-span-full px-4 py-2 border border-slate-200 rounded-lg"
      />


      <textarea
        placeholder="Referencias del domicilio *"
        value={datos.domicilio_referencias}
        onChange={(e) =>
          actualizar(
            'domicilio_referencias',
            e.target.value
          )
        }
        rows={3}
        className="col-span-full px-4 py-2 border border-slate-200 rounded-lg"
      />
    </>
  );
};

const SociosModule = ({ currentUser }) => {
  const [sociosList, setSociosList] = useState([]);
  const [searchSocio, setSearchSocio] = useState('');
  const [filtroDocumentacion, setFiltroDocumentacion] = useState('todos');
const [socioConFaltantes, setSocioConFaltantes] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showConfirmRegistro, setShowConfirmRegistro] = useState(false);
  const [editingSocio, setEditingSocio] = useState(null);
 const [newSocio, setNewSocio] = useState({
  nombre: '',
  apellido_paterno: '',
  apellido_materno: '',

  tipo_documento_identidad: '',
  documento_identidad_path: '',

  estado_civil: '',
  nombre_pareja: '',
  dependientes_economicos: '',

  email: '',
  contrasena: '',
  telefono: '',

  domicilio_calle: '',
  domicilio_numero: '',
  domicilio_edificio: '',
  domicilio_estado: '',
domicilio_pais: '',
  domicilio_colonia: '',
  domicilio_municipio: '',
  domicilio_cp: '',
  domicilio_entre_calles: '',
  domicilio_referencias: '',

  tiempo_domicilio_anios: '',
  tiempo_domicilio_meses: '',

  tipo_vivienda: '',
  vivienda_detalle: '',

  red_social: '',
  red_social_otro: '',
  red_social_url: '',

  // Se conservan por compatibilidad
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
// ================= REFERENCIA PERSONAL =================
const [referencia, setReferencia] = useState({
  nombre: '',
  apellido_paterno: '',
  apellido_materno: '',
  telefono: '',

  parentesco: '',
  tiempo_conocer_anios: '',
  tiempo_conocer_meses: '',

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

  direccion: '',
});

const [referenciaId, setReferenciaId] = useState(null);


// ================= REFERENCIA FAMILIAR =================
const [referenciaFamiliar, setReferenciaFamiliar] = useState({
  nombre: '',
  apellido_paterno: '',
  apellido_materno: '',
  telefono: '',

  parentesco: '',
  tiempo_conocer_anios: '',
  tiempo_conocer_meses: '',

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

  direccion: '',
});

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
  const socioFormRef = useRef(null);

  // ================= DOCUMENTO IDENTIDAD =================
const [documentoIdentidadFile, setDocumentoIdentidadFile] = useState(null);
const [documentoIdentidadError, setDocumentoIdentidadError] = useState('');
const [documentoIdentidadUploading, setDocumentoIdentidadUploading] = useState(false);
const documentoIdentidadInputRef = useRef(null);

  // ================= CÁMARA DEL SOCIO =================
const [showCameraModal, setShowCameraModal] =
  useState(false);

const [cameraError, setCameraError] =
  useState('');

const [cameraFacingMode, setCameraFacingMode] =
  useState('user');

const [cameraStarting, setCameraStarting] =
  useState(false);

const videoRef = useRef(null);
const canvasRef = useRef(null);
const cameraStreamRef = useRef(null);

  // Ficha (modal de detalles)
  const [showFicha, setShowFicha] = useState(false);
  const [socioFicha, setSocioFicha] = useState(null);
  // ===== DATOS RELACIONADOS FICHA =====
const [refsFicha, setRefsFicha] = useState([]);
  const [refsFamiliaresFicha, setRefsFamiliaresFicha] = useState([]);
const [benefFicha, setBenefFicha] = useState([]);
const [bancoFicha, setBancoFicha] = useState([]);
  const [previewFile, setPreviewFile] = useState(null);
const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [permisosSocios, setPermisosSocios] = useState({
  puede_crear: false,
  puede_editar: false,
  puede_eliminar: false,
});

const isAdmin =
  currentUser?.rol === 'admin' ||
  currentUser?.role === 'admin' ||
  currentUser?.rol === 'administrador' ||
  currentUser?.role === 'administrador' ||
  currentUser?.rol === 'superadmin' ||
  currentUser?.role === 'superadmin';

const getCurrentUserId = () =>
  currentUser?.id_usuario || currentUser?.id || currentUser?.usuario_id || null;
const sociosFiltrados = sociosList.filter((socio) => {
  const texto = `
    ${socio.id_socio}
    ${socio.nombre || ''}
    ${socio.apellido_paterno || ''}
    ${socio.apellido_materno || ''}
  `.toLowerCase();

  const coincideBusqueda = texto.includes(searchSocio.toLowerCase());

  let coincideDocumentacion = true;

  if (filtroDocumentacion === 'incompletos') {
    coincideDocumentacion = !socio.documentacion_completa;
  }

  if (filtroDocumentacion === 'completos') {
    coincideDocumentacion = socio.documentacion_completa;
  }

  return coincideBusqueda && coincideDocumentacion;
});


  useEffect(() => {
    fetchSocios();
  }, []);

  useEffect(() => {
  return () => {
    detenerCamara();
  };
}, []);

  useEffect(() => {
  if (showCameraModal) {
    document.body.style.overflow =
      'hidden';
  } else {
    document.body.style.overflow = '';
  }

  return () => {
    document.body.style.overflow = '';
  };
}, [showCameraModal]);
  
  useEffect(() => {
  const resize = () => setIsMobile(window.innerWidth < 768);
  window.addEventListener('resize', resize);
  return () => window.removeEventListener('resize', resize);
}, []);
useEffect(() => {
  const cargarPermisosSocios = async () => {
    if (isAdmin) {
      setPermisosSocios({
        puede_crear: true,
        puede_editar: true,
        puede_eliminar: true,
      });
      return;
    }

    const idUsuario = getCurrentUserId();

    if (!idUsuario) return;

    try {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/permisos_modulos_fondo?id_usuario=eq.${idUsuario}&modulo=eq.socios&select=puede_crear,puede_editar,puede_eliminar`,
        {
          headers: {
            'Content-Type': 'application/json',
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          },
        }
      );

      if (!res.ok) return;

      const data = await res.json();

      if (data.length > 0) {
        setPermisosSocios({
          puede_crear: !!data[0].puede_crear,
          puede_editar: !!data[0].puede_editar,
          puede_eliminar: !!data[0].puede_eliminar,
        });
      }
    } catch (err) {
      console.error('Error cargando permisos socios:', err);
    }
  };

  cargarPermisosSocios();
}, [currentUser]);
 const fetchSocios = async (mostrarCarga = true) => {
  if (mostrarCarga) {
    setLoading(true);
  }

  setError(null);

  try {
    // ================= CARGAR SOCIOS =================
    const sociosRes = await fetch(
      `${SUPABASE_URL}/rest/v1/socios?select=*&order=id_socio.asc`,
      {
        headers: {
          'Content-Type': 'application/json',
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
      }
    );

    if (!sociosRes.ok) {
      const e = await sociosRes.json().catch(() => ({}));
      throw new Error(
        `Error al cargar socios: ${sociosRes.statusText} - ${
          e.message || 'Error desconocido'
        }`
      );
    }

    const sociosData = await sociosRes.json();

    // ================= CARGAR INFORMACIÓN RELACIONADA =================
    const [refsRes, beneficiariosRes, bancosRes] = await Promise.all([
      fetch(
        `${SUPABASE_URL}/rest/v1/refs_fondo?select=id_socio,nombre,telefono,direccion`,
        {
          headers: {
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          },
        }
      ),

      fetch(
        `${SUPABASE_URL}/rest/v1/beneficiarios_fondo?select=id_socio,nombre,telefono,direccion,foto_url,documentos_url`,
        {
          headers: {
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          },
        }
      ),

      fetch(
        `${SUPABASE_URL}/rest/v1/referencias_bancarias?select=id_socio,entidad_bancaria,titular_cuenta,numero_cuenta,cuenta_clave`,
        {
          headers: {
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          },
        }
      ),
    ]);

    const refsData = refsRes.ok ? await refsRes.json() : [];
    const beneficiariosData = beneficiariosRes.ok
      ? await beneficiariosRes.json()
      : [];
    if (!bancosRes.ok) {
  const errorBanco = await bancosRes.text();

  console.error(
    'ERROR CARGANDO REFERENCIAS BANCARIAS:',
    errorBanco
  );

  throw new Error(
    `No se pudieron cargar las referencias bancarias: ${errorBanco}`
  );
}

const bancosData = await bancosRes.json();

    // Crear mapas para localizar rápidamente la información
    const referenciasMap = new Map();
    refsData.forEach((item) => {
      referenciasMap.set(String(item.id_socio), item);
    });

    const beneficiariosMap = new Map();
    beneficiariosData.forEach((item) => {
      beneficiariosMap.set(String(item.id_socio), item);
    });

    const bancosMap = new Map();
    bancosData.forEach((item) => {
      bancosMap.set(String(item.id_socio), item);
    });

    // ================= DETECTAR INFORMACIÓN FALTANTE =================
    const sociosConEstado = sociosData.map((socio) => {
      const idSocio = String(socio.id_socio);
      const faltantes = [];

      const referencia = referenciasMap.get(idSocio);

      if (!referencia) {
        faltantes.push('Referencia personal');
      } else {
       if (!String(referencia.nombre || '').trim()) {
  faltantes.push('Nombre de referencia personal');
}

if (!String(referencia.telefono || '').trim()) {
  faltantes.push('Teléfono de referencia personal');
}

if (!String(referencia.direccion || '').trim()) {
  faltantes.push('Dirección de referencia personal');
}
      }

      const beneficiario = beneficiariosMap.get(idSocio);

      if (!beneficiario) {
        faltantes.push('Beneficiario');
        faltantes.push('Foto del beneficiario');
        faltantes.push('Documento PDF del beneficiario');
      } else {
        if (!String(beneficiario.nombre || '').trim()) {
  faltantes.push('Nombre del beneficiario');
}

if (!String(beneficiario.telefono || '').trim()) {
  faltantes.push('Teléfono del beneficiario');
}

if (!String(beneficiario.direccion || '').trim()) {
  faltantes.push('Dirección del beneficiario');
}

if (!String(beneficiario.foto_url || '').trim()) {
  faltantes.push('Foto del beneficiario');
}

if (!String(beneficiario.documentos_url || '').trim()) {
  faltantes.push('Documento PDF del beneficiario');
}
      }

      const banco = bancosMap.get(idSocio);

      if (!banco) {
        faltantes.push('Referencia bancaria');
      } else {
       if (!String(banco.entidad_bancaria || '').trim()) {
  faltantes.push('Entidad bancaria');
}

if (!String(banco.titular_cuenta || '').trim()) {
  faltantes.push('Titular de la cuenta');
}

if (!String(banco.numero_cuenta || '').trim()) {
  faltantes.push('Número de cuenta');
}

if (!String(banco.cuenta_clave || '').trim()) {
  faltantes.push('Cuenta CLABE');
}
      }

      return {
        ...socio,
        documentacion_completa: faltantes.length === 0,
        informacion_faltante: faltantes,
      };
    });

    setSociosList(sociosConEstado);
  } catch (err) {
  console.error('ERROR CARGANDO SOCIOS:', err);
  setError(err.message);
} finally {
  if (mostrarCarga) {
    setLoading(false);
  }
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

const validateDocumentoIdentidad = (file) => {
  if (!file) return '';

  const tiposPermitidos = [
    'application/pdf',
    'image/jpeg',
    'image/png',
  ];

  if (!tiposPermitidos.includes(file.type)) {
    return 'Formato inválido. Solo PDF, JPG o PNG.';
  }

  const maxMB = 10;

  if (file.size > maxMB * 1024 * 1024) {
    return `El archivo supera ${maxMB} MB.`;
  }

  return '';
};

const handleDocumentoIdentidadChange = (e) => {
  const file = e.target.files?.[0];

  if (!file) return;

  const validationError = validateDocumentoIdentidad(file);

  setDocumentoIdentidadError(validationError);

  if (validationError) {
    setDocumentoIdentidadFile(null);

    if (documentoIdentidadInputRef.current) {
      documentoIdentidadInputRef.current.value = '';
    }

    return;
  }

  setDocumentoIdentidadFile(file);
};
  
// ================= FUNCIONES DE CÁMARA =================

const detenerCamara = () => {
  if (cameraStreamRef.current) {
    cameraStreamRef.current
      .getTracks()
      .forEach((track) => track.stop());

    cameraStreamRef.current = null;
  }

  if (videoRef.current) {
    videoRef.current.srcObject = null;
  }
};

const iniciarCamara = async (
  facingMode = cameraFacingMode
) => {
  setCameraStarting(true);
  setCameraError('');

  try {
    if (
      !navigator.mediaDevices ||
      !navigator.mediaDevices.getUserMedia
    ) {
      throw new Error(
        'Este dispositivo o navegador no permite abrir la cámara directamente.'
      );
    }

    detenerCamara();

    const stream =
      await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: {
            ideal: facingMode,
          },
          width: {
            ideal: 1280,
          },
          height: {
            ideal: 960,
          },
        },
      });

    cameraStreamRef.current = stream;

    if (videoRef.current) {
      videoRef.current.srcObject = stream;

      await videoRef.current.play();
    }
  } catch (errorCamara) {
    console.error(
      'ERROR ACTIVANDO CÁMARA:',
      errorCamara
    );

    let mensaje =
      'No se pudo abrir la cámara.';

    if (
      errorCamara?.name ===
      'NotAllowedError'
    ) {
      mensaje =
        'El permiso de la cámara fue rechazado. Autorice el acceso desde el navegador.';
    } else if (
      errorCamara?.name ===
      'NotFoundError'
    ) {
      mensaje =
        'No se encontró ninguna cámara disponible.';
    } else if (
      errorCamara?.name ===
      'NotReadableError'
    ) {
      mensaje =
        'La cámara está siendo utilizada por otra aplicación.';
    } else if (
      errorCamara?.name ===
      'OverconstrainedError'
    ) {
      mensaje =
        'La cámara disponible no admite la configuración solicitada.';
    } else if (errorCamara?.message) {
      mensaje = errorCamara.message;
    }

    setCameraError(mensaje);
  } finally {
    setCameraStarting(false);
  }
};

const abrirCamara = () => {
  setCameraError('');
  setCameraFacingMode('user');
  setShowCameraModal(true);

  setTimeout(() => {
    iniciarCamara('user');
  }, 200);
};

const cerrarCamara = () => {
  detenerCamara();
  setShowCameraModal(false);
  setCameraError('');
  setCameraStarting(false);
};

const cambiarCamara = async () => {
  const nuevoModo =
    cameraFacingMode === 'user'
      ? 'environment'
      : 'user';

  setCameraFacingMode(nuevoModo);

  await iniciarCamara(nuevoModo);
};

const capturarFoto = () => {
  const video = videoRef.current;
  const canvas = canvasRef.current;

  if (!video || !canvas) {
    setCameraError(
      'No se pudo obtener la imagen de la cámara.'
    );
    return;
  }

  if (
    !video.videoWidth ||
    !video.videoHeight
  ) {
    setCameraError(
      'La cámara todavía está iniciando. Espere un momento e inténtelo nuevamente.'
    );
    return;
  }

  const maxWidth = 1280;

  const escala = Math.min(
    1,
    maxWidth / video.videoWidth
  );

  const width = Math.round(
    video.videoWidth * escala
  );

  const height = Math.round(
    video.videoHeight * escala
  );

  canvas.width = width;
  canvas.height = height;

  const context =
    canvas.getContext('2d');

  if (!context) {
    setCameraError(
      'No se pudo procesar la fotografía.'
    );
    return;
  }

  // Corregir la orientación de la cámara frontal
  if (cameraFacingMode === 'user') {
    context.translate(width, 0);
    context.scale(-1, 1);
  }

  context.drawImage(
    video,
    0,
    0,
    width,
    height
  );

  canvas.toBlob(
    (blob) => {
      if (!blob) {
        setCameraError(
          'No se pudo generar la fotografía.'
        );
        return;
      }

      const archivoFoto = new File(
        [blob],
        `foto_socio_${Date.now()}.jpg`,
        {
          type: 'image/jpeg',
        }
      );

      const errorValidacion =
        validatePhoto(archivoFoto);

      if (errorValidacion) {
        setCameraError(errorValidacion);
        return;
      }

      setPhotoFile(archivoFoto);

      setPhotoPreview(
        URL.createObjectURL(archivoFoto)
      );

      setPhotoError('');

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      cerrarCamara();
    },
    'image/jpeg',
    0.85
  );
};
  
  const handleChooseFile = () => fileInputRef.current?.click();

  const handleFileChange = (e) => {
  const file = e.target.files?.[0];

  if (!file) return;

  const validationError = validatePhoto(file);

  setPhotoError(validationError);

  if (validationError) {
    setPhotoFile(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    return;
  }

  setPhotoFile(file);
  setPhotoPreview(URL.createObjectURL(file));
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

  dropRef.current?.classList.remove(
    'ring-2',
    'ring-emerald-500'
  );

  const file = e.dataTransfer.files?.[0];

  if (!file) return;

  const validationError = validatePhoto(file);

  setPhotoError(validationError);

  if (validationError) {
    setPhotoFile(null);
    return;
  }

  setPhotoFile(file);
  setPhotoPreview(URL.createObjectURL(file));
};

  /** Subida a Supabase Storage y retorna URL pública */
  const uploadPhotoToSupabase = async (socioId) => {
  if (!photoFile) return null;

  setPhotoUploading(true);

  try {
    const extension =
      photoFile.name?.split('.').pop()?.toLowerCase() ||
      (photoFile.type === 'image/png' ? 'png' : 'jpg');

    const path = `socio_${socioId}.${extension}`;

    const uploadUrl =
      `${SUPABASE_URL}/storage/v1/object/fotos-socios/${encodeURIComponent(path)}`;

    const upRes = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': photoFile.type || 'image/jpeg',
        'x-upsert': 'true',
        'cache-control': '0',
      },
      body: photoFile,
    });

    if (!upRes.ok) {
      const errorText = await upRes.text();

      console.error('ERROR SUBIENDO FOTO DEL SOCIO:', errorText);

      throw new Error(
        `No se pudo subir la foto del socio: ${errorText}`
      );
    }

    return (
      `${SUPABASE_URL}/storage/v1/object/public/fotos-socios/` +
      `${encodeURIComponent(path)}?v=${Date.now()}`
    );
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

const uploadDocumentoIdentidad = async (socioId) => {
  if (!documentoIdentidadFile) {
    return newSocio.documento_identidad_path || null;
  }

  setDocumentoIdentidadUploading(true);

  try {
    const extension =
      documentoIdentidadFile.name
        ?.split('.')
        .pop()
        ?.toLowerCase() || 'pdf';

    const tipo = (
      newSocio.tipo_documento_identidad || 'documento'
    )
      .toLowerCase()
      .replace(/\s+/g, '_');

    const path =
      `socio_${socioId}/${tipo}_${Date.now()}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from('documentos-identidad-socios')
      .upload(
        path,
        documentoIdentidadFile,
        {
          contentType:
            documentoIdentidadFile.type ||
            'application/octet-stream',

          upsert: false,
        }
      );

    if (uploadError) {
      console.error(
        'ERROR SUBIENDO DOCUMENTO IDENTIDAD:',
        uploadError
      );

      throw new Error(
        `No se pudo subir el documento de identidad: ${uploadError.message}`
      );
    }

    return path;

  } finally {
    setDocumentoIdentidadUploading(false);
  }
};

// ================= CREAR USUARIO AUTOMÁTICO DEL SOCIO =================
const crearUsuarioSocio = async (socioId) => {
  const emailSocio = correoMinusculas(newSocio.email);

  if (!socioId) {
    throw new Error(
      'No se puede crear el usuario porque no se obtuvo el ID del socio.'
    );
  }

  if (!emailSocio) {
    throw new Error(
      'No se puede crear el usuario porque el socio no tiene correo electrónico.'
    );
  }

  if (!newSocio.contrasena) {
    throw new Error(
      'No se puede crear el usuario porque el socio no tiene contraseña.'
    );
  }

  // Verificar si ya existe usuario con ese ID de socio
  const verificarRes = await fetch(
    `${SUPABASE_URL}/rest/v1/usuarios_sistema?id_socio=eq.${socioId}&select=id_usuario,id_socio,email`,
    {
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
    }
  );

  if (!verificarRes.ok) {
    const errorText = await verificarRes.text();

    throw new Error(
      `No se pudo verificar si el socio ya tiene usuario: ${errorText}`
    );
  }

  const usuariosExistentes = await verificarRes.json();

  // Si ya existe, no duplicarlo
  if (usuariosExistentes.length > 0) {
    console.log(
      'El socio ya tiene usuario registrado:',
      usuariosExistentes[0]
    );

    return usuariosExistentes[0];
  }

  const nombreUsuario = [
    newSocio.nombre,
    newSocio.apellido_paterno,
    newSocio.apellido_materno,
  ]
    .filter(Boolean)
    .join(' ')
    .trim();

  const usuarioLogin =
    emailSocio.split('@')[0];

  const payloadUsuario = {
    nombre: textoMayusculas(nombreUsuario),
    usuario: usuarioLogin,
    email: emailSocio,
    contrasena: newSocio.contrasena,
    rol: 'usuario',
    id_socio: Number(socioId),
    activo: true,
  };

  console.log(
    'CREANDO USUARIO DEL SOCIO:',
    payloadUsuario
  );

  const usuarioRes = await fetch(
    `${SUPABASE_URL}/rest/v1/usuarios_sistema`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        Prefer: 'return=representation',
      },
      body: JSON.stringify(payloadUsuario),
    }
  );

  if (!usuarioRes.ok) {
    const errorText = await usuarioRes.text();

    console.error(
      'ERROR CREANDO USUARIO DEL SOCIO:',
      errorText
    );

    throw new Error(
      `El socio fue registrado, pero no se pudo crear su usuario: ${errorText}`
    );
  }

  const usuarioCreado = await usuarioRes.json();

  if (!usuarioCreado?.[0]) {
    throw new Error(
      'El socio fue registrado, pero Supabase no devolvió el usuario creado.'
    );
  }

  return usuarioCreado[0];
};
  
  const resetForm = () => {
 setNewSocio({
  nombre: '',
  apellido_paterno: '',
  apellido_materno: '',

  tipo_documento_identidad: '',
  documento_identidad_path: '',

  estado_civil: '',
  nombre_pareja: '',
  dependientes_economicos: '',

  email: '',
  contrasena: '',
  telefono: '',

  domicilio_calle: '',
  domicilio_numero: '',
  domicilio_edificio: '',
   domicilio_estado: '',
domicilio_pais: '',
  domicilio_colonia: '',
  domicilio_municipio: '',
  domicilio_cp: '',
  domicilio_entre_calles: '',
  domicilio_referencias: '',

  tiempo_domicilio_anios: '',
  tiempo_domicilio_meses: '',

  tipo_vivienda: '',
  vivienda_detalle: '',

  red_social: '',
  red_social_otro: '',
  red_social_url: '',

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

  parentesco: '',
  tiempo_conocer_anios: '',
  tiempo_conocer_meses: '',

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

  direccion: '',
});

setReferenciaFamiliar({
  nombre: '',
  apellido_paterno: '',
  apellido_materno: '',
  telefono: '',

  parentesco: '',
  tiempo_conocer_anios: '',
  tiempo_conocer_meses: '',

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

  direccion: '',
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
    if (fileInputRef.current) {
  fileInputRef.current.value = '';
}
setDocumentoIdentidadFile(null);
setDocumentoIdentidadError('');

if (documentoIdentidadInputRef.current) {
  documentoIdentidadInputRef.current.value = '';
}
  setEditingSocio(null);
  setShowForm(false);
};

 const handleAddOrUpdateSocio = async (e) => {
  e.preventDefault();

  setShowConfirmRegistro(false);
  setError(null);

  const required = [
  'nombre',
  'apellido_paterno',
  'apellido_materno',

  'tipo_documento_identidad',
  'estado_civil',
  'dependientes_economicos',

  'email',
  'contrasena',
  'telefono',

  'domicilio_calle',
  'domicilio_numero',
  'domicilio_colonia',
    'domicilio_estado',
  'domicilio_municipio',
  'domicilio_cp',
  'domicilio_entre_calles',
  'domicilio_referencias',

  'tiempo_domicilio_anios',
  'tiempo_domicilio_meses',

  'tipo_vivienda',
  'vivienda_detalle',

  'red_social',
];
  const missing = required.filter(
  (k) => !String(newSocio[k] ?? '').trim()
);

if (missing.length) {
  setError('Complete todos los campos obligatorios.');
  return;
}

const requierePareja =
  newSocio.estado_civil === 'CASADO' ||
  newSocio.estado_civil === 'UNION_LIBRE';
if (
  requierePareja &&
  !String(newSocio.nombre_pareja || '').trim()
) {
  setError(
    'Debe registrar el nombre de esposo(a), compañero(a) o pareja.'
  );
  return;
}

if (
  newSocio.red_social === 'OTRO' &&
  !String(newSocio.red_social_otro || '').trim()
) {
  setError('Debe escribir el nombre de la red social.');
  return;
}

if (
  newSocio.red_social !== 'NO' &&
  !String(newSocio.red_social_url || '').trim()
) {
  setError('Debe escribir la dirección de la red social.');
  return;
}
   
if (
  !editingSocio &&
  !documentoIdentidadFile
) {
  setError(
    'Debe cargar el archivo correspondiente al CURP, INE o Pasaporte.'
  );
  return;
}

if (
  editingSocio &&
  !documentoIdentidadFile &&
  !newSocio.documento_identidad_path
) {
  setError(
    'Debe cargar el archivo correspondiente al CURP, INE o Pasaporte.'
  );
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

const direccionCompleta = [
  newSocio.domicilio_calle &&
    `CALLE ${newSocio.domicilio_calle}`,

  newSocio.domicilio_numero &&
    `NÚM. ${newSocio.domicilio_numero}`,

  newSocio.domicilio_edificio &&
    `EDIFICIO ${newSocio.domicilio_edificio}`,

  newSocio.domicilio_colonia &&
    `COL. ${newSocio.domicilio_colonia}`,
newSocio.domicilio_estado &&
  (
    newSocio.domicilio_estado === 'EXTRANJERO'
      ? newSocio.domicilio_pais
      : newSocio.domicilio_estado
  ),
  newSocio.domicilio_municipio,

  newSocio.domicilio_cp &&
    `C.P. ${newSocio.domicilio_cp}`,

  newSocio.domicilio_entre_calles &&
    `ENTRE CALLES: ${newSocio.domicilio_entre_calles}`,

  newSocio.domicilio_referencias &&
    `REFERENCIAS: ${newSocio.domicilio_referencias}`,
]
  .filter(Boolean)
  .join(', ');

   // ================= DIRECCIÓN REFERENCIA PERSONAL =================
const direccionReferenciaPersonal = [
  referencia.domicilio_calle &&
    `CALLE ${referencia.domicilio_calle}`,

  referencia.domicilio_numero &&
    `NÚM. ${referencia.domicilio_numero}`,

  referencia.domicilio_edificio &&
    `EDIFICIO ${referencia.domicilio_edificio}`,

  referencia.domicilio_colonia &&
    `COL. ${referencia.domicilio_colonia}`,

  referencia.domicilio_estado === 'EXTRANJERO'
    ? referencia.domicilio_pais
    : referencia.domicilio_estado,

  referencia.domicilio_municipio,

  referencia.domicilio_cp &&
    `C.P. ${referencia.domicilio_cp}`,

  referencia.domicilio_entre_calles &&
    `ENTRE CALLES: ${referencia.domicilio_entre_calles}`,

  referencia.domicilio_referencias &&
    `REFERENCIAS: ${referencia.domicilio_referencias}`,
]
  .filter(Boolean)
  .join(', ');


// ================= DIRECCIÓN REFERENCIA FAMILIAR =================
const direccionReferenciaFamiliar = [
  referenciaFamiliar.domicilio_calle &&
    `CALLE ${referenciaFamiliar.domicilio_calle}`,

  referenciaFamiliar.domicilio_numero &&
    `NÚM. ${referenciaFamiliar.domicilio_numero}`,

  referenciaFamiliar.domicilio_edificio &&
    `EDIFICIO ${referenciaFamiliar.domicilio_edificio}`,

  referenciaFamiliar.domicilio_colonia &&
    `COL. ${referenciaFamiliar.domicilio_colonia}`,

  referenciaFamiliar.domicilio_estado === 'EXTRANJERO'
    ? referenciaFamiliar.domicilio_pais
    : referenciaFamiliar.domicilio_estado,

  referenciaFamiliar.domicilio_municipio,

  referenciaFamiliar.domicilio_cp &&
    `C.P. ${referenciaFamiliar.domicilio_cp}`,

  referenciaFamiliar.domicilio_entre_calles &&
    `ENTRE CALLES: ${referenciaFamiliar.domicilio_entre_calles}`,

  referenciaFamiliar.domicilio_referencias &&
    `REFERENCIAS: ${referenciaFamiliar.domicilio_referencias}`,
]
  .filter(Boolean)
  .join(', ');
   
  setSaving(true);

  try {
    let socioId;
    let socio;

    // ================= SOCIO =================
    if (editingSocio) {
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
          body: JSON.stringify({
  ...newSocio,

  nombre: textoMayusculas(newSocio.nombre),
  apellido_paterno: textoMayusculas(
    newSocio.apellido_paterno
  ),
  apellido_materno: textoMayusculas(
    newSocio.apellido_materno
  ),

  tipo_documento_identidad:
    newSocio.tipo_documento_identidad,

  estado_civil:
    newSocio.estado_civil,

  nombre_pareja:
    requierePareja
      ? textoMayusculas(newSocio.nombre_pareja)
      : null,

  dependientes_economicos:
    Number(newSocio.dependientes_economicos),

  email:
    correoMinusculas(newSocio.email),

  telefono:
    String(newSocio.telefono || '').trim(),

  domicilio_calle:
    textoMayusculas(newSocio.domicilio_calle),

  domicilio_numero:
    textoMayusculas(newSocio.domicilio_numero),

  domicilio_edificio:
    newSocio.domicilio_edificio
      ? textoMayusculas(newSocio.domicilio_edificio)
      : null,

  domicilio_colonia:
    textoMayusculas(newSocio.domicilio_colonia),
domicilio_estado:
  textoMayusculas(newSocio.domicilio_estado),

domicilio_pais:
  newSocio.domicilio_estado === 'EXTRANJERO'
    ? textoMayusculas(newSocio.domicilio_pais)
    : 'MÉXICO',
  domicilio_municipio:
    textoMayusculas(newSocio.domicilio_municipio),

  domicilio_cp:
    String(newSocio.domicilio_cp || '').trim(),

  domicilio_entre_calles:
    textoMayusculas(
      newSocio.domicilio_entre_calles
    ),

  domicilio_referencias:
    textoMayusculas(
      newSocio.domicilio_referencias
    ),

  tiempo_domicilio_anios:
    Number(newSocio.tiempo_domicilio_anios),

  tiempo_domicilio_meses:
    Number(newSocio.tiempo_domicilio_meses),

  tipo_vivienda:
    newSocio.tipo_vivienda,

  vivienda_detalle:
    textoMayusculas(newSocio.vivienda_detalle),

  red_social:
    newSocio.red_social,

  red_social_otro:
    newSocio.red_social === 'OTRO'
      ? textoMayusculas(newSocio.red_social_otro)
      : null,

 red_social_url:
  newSocio.red_social === 'NO'
    ? null
    : String(newSocio.red_social_url || '').trim(),

  // Compatibilidad con sistema anterior
  direccion:
    textoMayusculas(direccionCompleta),

  cp:
    String(newSocio.domicilio_cp || '').trim(),

  estatus:
    newSocio.estatus === 'activo',

  fecha_nacimiento:
    cleanDate(newSocio.fecha_nacimiento),
}),
        }
      );

      if (!res.ok) throw new Error('Error actualizando socio');

    const updated = await res.json();
socio = updated?.[0];

if (!socio) {
  throw new Error('Supabase no devolvió el socio actualizado.');
}

socioId = socio.id_socio;
  

    } else {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/socios`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          Prefer: 'return=representation',
        },
      body: JSON.stringify({
  ...newSocio,

  nombre: textoMayusculas(newSocio.nombre),
  apellido_paterno: textoMayusculas(
    newSocio.apellido_paterno
  ),
  apellido_materno: textoMayusculas(
    newSocio.apellido_materno
  ),

  tipo_documento_identidad:
    newSocio.tipo_documento_identidad,

  estado_civil:
    newSocio.estado_civil,

  nombre_pareja:
    requierePareja
      ? textoMayusculas(newSocio.nombre_pareja)
      : null,

  dependientes_economicos:
    Number(newSocio.dependientes_economicos),

  email:
    correoMinusculas(newSocio.email),

  telefono:
    String(newSocio.telefono || '').trim(),

  domicilio_calle:
    textoMayusculas(newSocio.domicilio_calle),

  domicilio_numero:
    textoMayusculas(newSocio.domicilio_numero),

  domicilio_edificio:
    newSocio.domicilio_edificio
      ? textoMayusculas(newSocio.domicilio_edificio)
      : null,

  domicilio_colonia:
    textoMayusculas(newSocio.domicilio_colonia),
domicilio_estado:
  textoMayusculas(newSocio.domicilio_estado),

domicilio_pais:
  newSocio.domicilio_estado === 'EXTRANJERO'
    ? textoMayusculas(newSocio.domicilio_pais)
    : 'MÉXICO',
  domicilio_municipio:
    textoMayusculas(newSocio.domicilio_municipio),

  domicilio_cp:
    String(newSocio.domicilio_cp || '').trim(),

  domicilio_entre_calles:
    textoMayusculas(
      newSocio.domicilio_entre_calles
    ),

  domicilio_referencias:
    textoMayusculas(
      newSocio.domicilio_referencias
    ),

  tiempo_domicilio_anios:
    Number(newSocio.tiempo_domicilio_anios),

  tiempo_domicilio_meses:
    Number(newSocio.tiempo_domicilio_meses),

  tipo_vivienda:
    newSocio.tipo_vivienda,

  vivienda_detalle:
    textoMayusculas(newSocio.vivienda_detalle),

  red_social:
    newSocio.red_social,

  red_social_otro:
    newSocio.red_social === 'OTRO'
      ? textoMayusculas(newSocio.red_social_otro)
      : null,

  red_social_url:
  newSocio.red_social === 'NO'
    ? null
    : String(newSocio.red_social_url || '').trim(),

  // Compatibilidad con sistema anterior
  direccion:
    textoMayusculas(direccionCompleta),

  cp:
    String(newSocio.domicilio_cp || '').trim(),

  estatus:
    newSocio.estatus === 'activo',

  fecha_nacimiento:
    cleanDate(newSocio.fecha_nacimiento),
}),
    });
      if (!res.ok) throw new Error('Error creando socio');

const inserted = await res.json();
socio = inserted?.[0];

if (!socio) {
  throw new Error(
    'Supabase no devolvió el socio registrado.'
  );
}

socioId = socio.id_socio;


// ================= CREAR USUARIO DEL SOCIO =================
await crearUsuarioSocio(socioId);


}
// ================= DOCUMENTO DE IDENTIDAD =================
if (
  documentoIdentidadFile ||
  newSocio.documento_identidad_path
) {
  const documentoPath =
    await uploadDocumentoIdentidad(socioId);

  if (documentoPath) {
    const updateDocumentoRes = await fetch(
      `${SUPABASE_URL}/rest/v1/socios?id_socio=eq.${socioId}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          Prefer: 'return=representation',
        },

        body: JSON.stringify({
          tipo_documento_identidad:
            newSocio.tipo_documento_identidad,

          documento_identidad_path:
            documentoPath,
        }),
      }
    );

    if (!updateDocumentoRes.ok) {
      const errorText =
        await updateDocumentoRes.text();

      console.error(
        'ERROR GUARDANDO DOCUMENTO IDENTIDAD:',
        errorText
      );

      throw new Error(
        `El documento se cargó, pero no se pudo registrar: ${errorText}`
      );
    }

    socio = {
      ...socio,
      documento_identidad_path:
        documentoPath,
    };
  }
}
    
// ================= FOTO DEL SOCIO =================
if (photoFile) {
  const fotoUrl = await uploadPhotoToSupabase(socioId);

  if (!fotoUrl) {
    throw new Error('No se obtuvo la URL de la foto del socio.');
  }

  const updateFotoRes = await fetch(
    `${SUPABASE_URL}/rest/v1/socios?id_socio=eq.${socioId}`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        Prefer: 'return=representation',
      },
      body: JSON.stringify({
        foto_url: fotoUrl,
      }),
    }
  );

  if (!updateFotoRes.ok) {
    const errorText = await updateFotoRes.text();

    console.error(
      'ERROR GUARDANDO URL DE FOTO DEL SOCIO:',
      errorText
    );

    throw new Error(
      `La foto se subió, pero no se pudo guardar su URL: ${errorText}`
    );
  }

  socio = {
    ...socio,
    foto_url: fotoUrl,
  };
}
// ================= REFERENCIA PERSONAL =================
if (referencia.nombre.trim() !== '') {

  const checkRef = await fetch(
    `${SUPABASE_URL}/rest/v1/refs_fondo?id_socio=eq.${socioId}&select=*`,
    {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
    }
  );

  if (!checkRef.ok) {
    const errorText = await checkRef.text();
    throw new Error(
      `No se pudo consultar la referencia personal: ${errorText}`
    );
  }

  const existingRef = await checkRef.json();

  const payloadReferencia = {
    nombre: textoMayusculas(referencia.nombre),

    apellido_paterno:
      textoMayusculas(referencia.apellido_paterno),

    apellido_materno:
      textoMayusculas(referencia.apellido_materno),

    telefono:
      String(referencia.telefono || '').trim(),

    parentesco:
      referencia.parentesco,

    tiempo_conocer_anios:
      referencia.tiempo_conocer_anios
        ? Number(referencia.tiempo_conocer_anios)
        : null,

    tiempo_conocer_meses:
      referencia.tiempo_conocer_meses
        ? Number(referencia.tiempo_conocer_meses)
        : null,

    domicilio_calle:
      textoMayusculas(referencia.domicilio_calle),

    domicilio_numero:
      textoMayusculas(referencia.domicilio_numero),

    domicilio_edificio:
      referencia.domicilio_edificio
        ? textoMayusculas(referencia.domicilio_edificio)
        : null,

    domicilio_colonia:
      textoMayusculas(referencia.domicilio_colonia),

    domicilio_estado:
      textoMayusculas(referencia.domicilio_estado),

    domicilio_pais:
      referencia.domicilio_estado === 'EXTRANJERO'
        ? textoMayusculas(referencia.domicilio_pais)
        : 'MÉXICO',

    domicilio_municipio:
      textoMayusculas(referencia.domicilio_municipio),

    domicilio_cp:
      String(referencia.domicilio_cp || '').trim(),

    domicilio_entre_calles:
      textoMayusculas(referencia.domicilio_entre_calles),

    domicilio_referencias:
      textoMayusculas(referencia.domicilio_referencias),

    direccion:
      textoMayusculas(direccionReferenciaPersonal),
  };

  if (existingRef?.length > 0) {

    const updateRef = await fetch(
      `${SUPABASE_URL}/rest/v1/refs_fondo?id_referencia=eq.${existingRef[0].id_referencia}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify(payloadReferencia),
      }
    );

    if (!updateRef.ok) {
      const errorText = await updateRef.text();

      throw new Error(
        `No se pudo actualizar la referencia personal: ${errorText}`
      );
    }

  } else {

    const insertRef = await fetch(
      `${SUPABASE_URL}/rest/v1/refs_fondo`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },

        body: JSON.stringify({
          id_socio: socioId,
          ...payloadReferencia,
        }),
      }
    );

    if (!insertRef.ok) {
      const errorText = await insertRef.text();

      throw new Error(
        `No se pudo registrar la referencia personal: ${errorText}`
      );
    }
  }
}


// ================= REFERENCIA FAMILIAR =================
if (referenciaFamiliar.nombre.trim() !== '') {

  const checkFamiliar = await fetch(
    `${SUPABASE_URL}/rest/v1/refs_familiares_fondo?id_socio=eq.${socioId}&select=*`,
    {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
    }
  );

  if (!checkFamiliar.ok) {
    const errorText = await checkFamiliar.text();

    throw new Error(
      `No se pudo consultar la referencia familiar: ${errorText}`
    );
  }

  const familiarExistente =
    await checkFamiliar.json();

  const payloadFamiliar = {
    nombre:
      textoMayusculas(referenciaFamiliar.nombre),

    apellido_paterno:
      textoMayusculas(
        referenciaFamiliar.apellido_paterno
      ),

    apellido_materno:
      textoMayusculas(
        referenciaFamiliar.apellido_materno
      ),

    telefono:
      String(
        referenciaFamiliar.telefono || ''
      ).trim(),

    parentesco:
      referenciaFamiliar.parentesco,

    tiempo_conocer_anios:
      referenciaFamiliar.tiempo_conocer_anios
        ? Number(
            referenciaFamiliar.tiempo_conocer_anios
          )
        : null,

    tiempo_conocer_meses:
      referenciaFamiliar.tiempo_conocer_meses
        ? Number(
            referenciaFamiliar.tiempo_conocer_meses
          )
        : null,

    domicilio_calle:
      textoMayusculas(
        referenciaFamiliar.domicilio_calle
      ),

    domicilio_numero:
      textoMayusculas(
        referenciaFamiliar.domicilio_numero
      ),

    domicilio_edificio:
      referenciaFamiliar.domicilio_edificio
        ? textoMayusculas(
            referenciaFamiliar.domicilio_edificio
          )
        : null,

    domicilio_colonia:
      textoMayusculas(
        referenciaFamiliar.domicilio_colonia
      ),

    domicilio_estado:
      textoMayusculas(
        referenciaFamiliar.domicilio_estado
      ),

    domicilio_pais:
      referenciaFamiliar.domicilio_estado ===
      'EXTRANJERO'
        ? textoMayusculas(
            referenciaFamiliar.domicilio_pais
          )
        : 'MÉXICO',

    domicilio_municipio:
      textoMayusculas(
        referenciaFamiliar.domicilio_municipio
      ),

    domicilio_cp:
      String(
        referenciaFamiliar.domicilio_cp || ''
      ).trim(),

    domicilio_entre_calles:
      textoMayusculas(
        referenciaFamiliar.domicilio_entre_calles
      ),

    domicilio_referencias:
      textoMayusculas(
        referenciaFamiliar.domicilio_referencias
      ),

    direccion:
      textoMayusculas(
        direccionReferenciaFamiliar
      ),
  };

  if (familiarExistente?.length > 0) {

    const updateFamiliar = await fetch(
      `${SUPABASE_URL}/rest/v1/refs_familiares_fondo?id_referencia_familiar=eq.${familiarExistente[0].id_referencia_familiar}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },

        body: JSON.stringify(payloadFamiliar),
      }
    );

    if (!updateFamiliar.ok) {
      const errorText =
        await updateFamiliar.text();

      throw new Error(
        `No se pudo actualizar la referencia familiar: ${errorText}`
      );
    }

  } else {

    const insertFamiliar = await fetch(
      `${SUPABASE_URL}/rest/v1/refs_familiares_fondo`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },

        body: JSON.stringify({
          id_socio: socioId,
          ...payloadFamiliar,
        }),
      }
    );

    if (!insertFamiliar.ok) {
      const errorText =
        await insertFamiliar.text();

      throw new Error(
        `No se pudo registrar la referencia familiar: ${errorText}`
      );
    }
  }
}

   // ================= BENEFICIARIO =================
if (beneficiario.nombre.trim() !== '') {
  // Verificar si ya existe beneficiario para este socio
  const checkBen = await fetch(
    `${SUPABASE_URL}/rest/v1/beneficiarios_fondo?id_socio=eq.${socioId}&select=*`,
    {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
    }
  );

  if (!checkBen.ok) {
    const errorText = await checkBen.text();
    console.error('ERROR CONSULTANDO BENEFICIARIO:', errorText);
    throw new Error('No se pudo consultar el beneficiario.');
  }

  const existingBen = await checkBen.json();
  const beneficiarioExistente = existingBen?.[0] || null;

  // Mantener archivos anteriores si no se seleccionan nuevos
  let fotoUrl = beneficiarioExistente?.foto_url || null;
  let documentoUrl = beneficiarioExistente?.documentos_url || null;

  // ================= SUBIR FOTO BENEFICIARIO =================
  if (beneficiarioFoto) {
    const extensionFoto =
      beneficiarioFoto.name?.split('.').pop()?.toLowerCase() ||
      (beneficiarioFoto.type === 'image/png' ? 'png' : 'jpg');

    const pathFoto =
      `socio_${socioId}_beneficiario_foto_${Date.now()}.${extensionFoto}`;

    const uploadFotoRes = await fetch(
      `${SUPABASE_URL}/storage/v1/object/beneficiarios_fondo/${encodeURIComponent(pathFoto)}?upsert=true`,
      {
        method: 'POST',
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': beneficiarioFoto.type || 'image/jpeg',
          'x-upsert': 'true',
        },
        body: beneficiarioFoto,
      }
    );

    if (!uploadFotoRes.ok) {
      const errorText = await uploadFotoRes.text();
      console.error('ERROR SUBIENDO FOTO BENEFICIARIO:', errorText);
      throw new Error('No se pudo subir la foto del beneficiario.');
    }

    fotoUrl =
      `${SUPABASE_URL}/storage/v1/object/public/beneficiarios_fondo/${encodeURIComponent(pathFoto)}`;
  }

  // ================= SUBIR PDF BENEFICIARIO =================
  if (beneficiarioDocumento) {
    const extensionDocumento =
      beneficiarioDocumento.name?.split('.').pop()?.toLowerCase() || 'pdf';

    const pathDocumento =
      `socio_${socioId}_beneficiario_documento_${Date.now()}.${extensionDocumento}`;

    const uploadDocumentoRes = await fetch(
      `${SUPABASE_URL}/storage/v1/object/beneficiarios_fondo/${encodeURIComponent(pathDocumento)}?upsert=true`,
      {
        method: 'POST',
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': beneficiarioDocumento.type || 'application/pdf',
          'x-upsert': 'true',
        },
        body: beneficiarioDocumento,
      }
    );

    if (!uploadDocumentoRes.ok) {
      const errorText = await uploadDocumentoRes.text();
      console.error('ERROR SUBIENDO PDF BENEFICIARIO:', errorText);
      throw new Error('No se pudo subir el documento del beneficiario.');
    }

    documentoUrl =
      `${SUPABASE_URL}/storage/v1/object/public/beneficiarios_fondo/${encodeURIComponent(pathDocumento)}`;
  }

  const beneficiarioPayload = {
  nombre: textoMayusculas(beneficiario.nombre),
  apellido_paterno: textoMayusculas(beneficiario.apellido_paterno),
  apellido_materno: textoMayusculas(beneficiario.apellido_materno),
  telefono: String(beneficiario.telefono || '').trim(),
  direccion: textoMayusculas(beneficiario.direccion),
  foto_url: fotoUrl,
  documentos_url: documentoUrl,
};

  // ================= ACTUALIZAR BENEFICIARIO =================
  if (beneficiarioExistente) {
    const updateBenRes = await fetch(
      `${SUPABASE_URL}/rest/v1/beneficiarios_fondo?id_beneficiario=eq.${beneficiarioExistente.id_beneficiario}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          Prefer: 'return=representation',
        },
        body: JSON.stringify(beneficiarioPayload),
      }
    );

    if (!updateBenRes.ok) {
      const errorText = await updateBenRes.text();
      console.error('ERROR ACTUALIZANDO BENEFICIARIO:', errorText);
      throw new Error('No se pudo actualizar el beneficiario.');
    }
  } else {
    // ================= CREAR BENEFICIARIO =================
    const insertBenRes = await fetch(
      `${SUPABASE_URL}/rest/v1/beneficiarios_fondo`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          Prefer: 'return=representation',
        },
        body: JSON.stringify({
          id_socio: socioId,
          ...beneficiarioPayload,
        }),
      }
    );

    if (!insertBenRes.ok) {
      const errorText = await insertBenRes.text();
      console.error('ERROR CREANDO BENEFICIARIO:', errorText);
      throw new Error('No se pudo registrar el beneficiario.');
    }
  }
}

  // ================= REFERENCIA BANCARIA =================
const entidadSeleccionada = String(
  referenciaBancaria.entidad_bancaria || ''
).trim();

if (entidadSeleccionada !== '') {
  const bancoFinal =
  entidadSeleccionada === 'OTRO'
    ? textoMayusculas(referenciaBancaria.banco_otro)
    : textoMayusculas(entidadSeleccionada);

  if (!bancoFinal) {
    throw new Error('Debe indicar el nombre de la entidad bancaria.');
  }

 const bancoPayload = {
  id_socio: Number(socioId),
  entidad_bancaria: bancoFinal,
  titular_cuenta: textoMayusculas(
    referenciaBancaria.titular_cuenta
  ),
  numero_cuenta: String(
    referenciaBancaria.numero_cuenta || ''
  ).trim(),
  cuenta_clave: String(
    referenciaBancaria.cuenta_clave || ''
  ).trim(),
  pais: textoMayusculas(
    referenciaBancaria.pais || 'México'
  ),
};

  console.log('GUARDANDO BANCO:', bancoPayload);

  const { data: bancoExistente, error: errorConsultaBanco } =
    await supabase
      .from('referencias_bancarias')
      .select('id_referencia_bancaria')
      .eq('id_socio', socioId)
      .maybeSingle();

  if (errorConsultaBanco) {
    console.error(
      'ERROR CONSULTANDO REFERENCIA BANCARIA:',
      errorConsultaBanco
    );

    throw new Error(
      `No se pudo consultar la referencia bancaria: ${
        errorConsultaBanco.message
      }`
    );
  }

  if (bancoExistente?.id_referencia_bancaria) {
    const { error: errorActualizarBanco } = await supabase
      .from('referencias_bancarias')
      .update({
        entidad_bancaria: bancoPayload.entidad_bancaria,
        titular_cuenta: bancoPayload.titular_cuenta,
        numero_cuenta: bancoPayload.numero_cuenta,
        cuenta_clave: bancoPayload.cuenta_clave,
        pais: bancoPayload.pais,
      })
      .eq(
        'id_referencia_bancaria',
        bancoExistente.id_referencia_bancaria
      );

    if (errorActualizarBanco) {
      console.error(
        'ERROR ACTUALIZANDO REFERENCIA BANCARIA:',
        errorActualizarBanco
      );

      throw new Error(
        `No se pudo actualizar la referencia bancaria: ${
          errorActualizarBanco.message
        }`
      );
    }
  } else {
    const { error: errorInsertarBanco } = await supabase
      .from('referencias_bancarias')
      .insert([bancoPayload]);

    if (errorInsertarBanco) {
      console.error(
        'ERROR INSERTANDO REFERENCIA BANCARIA:',
        errorInsertarBanco
      );

      throw new Error(
        `No se pudo registrar la referencia bancaria: ${
          errorInsertarBanco.message
        }`
      );
    }
  }
}

await fetchSocios(false);
resetForm();

 } catch (err) {
  console.error('ERROR GUARDANDO SOCIO:', err);
  setError(err.message);
  } finally {
    setSaving(false);
  }
};
const handleEditClick = async (socio) => {
  setEditingSocio(socio);

  setNewSocio({
  nombre:
    socio.nombre || '',

  apellido_paterno:
    socio.apellido_paterno || '',

  apellido_materno:
    socio.apellido_materno || '',

  tipo_documento_identidad:
    socio.tipo_documento_identidad || '',

  documento_identidad_path:
    socio.documento_identidad_path || '',

  estado_civil:
    socio.estado_civil || '',

  nombre_pareja:
    socio.nombre_pareja || '',

  dependientes_economicos:
    socio.dependientes_economicos ?? '',

  email:
    socio.email || '',

  contrasena:
    socio.contrasena || '',

  telefono:
    socio.telefono || '',

  domicilio_calle:
    socio.domicilio_calle || '',

  domicilio_numero:
    socio.domicilio_numero || '',

  domicilio_edificio:
    socio.domicilio_edificio || '',

  domicilio_colonia:
    socio.domicilio_colonia || '',
domicilio_estado:
  socio.domicilio_estado || '',

domicilio_pais:
  socio.domicilio_pais || '',
  domicilio_municipio:
    socio.domicilio_municipio || '',

  domicilio_cp:
    socio.domicilio_cp ||
    socio.cp ||
    '',

  domicilio_entre_calles:
    socio.domicilio_entre_calles || '',

  domicilio_referencias:
    socio.domicilio_referencias || '',

  tiempo_domicilio_anios:
    socio.tiempo_domicilio_anios ?? '',

  tiempo_domicilio_meses:
    socio.tiempo_domicilio_meses ?? '',

  tipo_vivienda:
    socio.tipo_vivienda || '',

  vivienda_detalle:
    socio.vivienda_detalle || '',

  red_social:
    socio.red_social || '',

  red_social_otro:
    socio.red_social_otro || '',

  red_social_url:
    socio.red_social_url || '',

  // Compatibilidad
  direccion:
    socio.direccion || '',

  cp:
    socio.cp || '',

  estatus:
    socio.estatus
      ? 'activo'
      : 'inactivo',

  fecha_nacimiento:
    toDateInput(socio.fecha_nacimiento),
});

  setPhotoFile(null);
  setPhotoPreview(socio.foto_url || '');
  setPhotoError('');
  setDocumentoIdentidadFile(null);
setDocumentoIdentidadError('');

if (documentoIdentidadInputRef.current) {
  documentoIdentidadInputRef.current.value = '';
}
  setMontoAfiliacion('');
  setErrorMonto('');

  try {
    const { data: refs } = await supabase
      .from('refs_fondo')
      .select('*')
      .eq('id_socio', socio.id_socio)
      .limit(1);

    const { data: beneficiarios } = await supabase
      .from('beneficiarios_fondo')
      .select('*')
      .eq('id_socio', socio.id_socio)
      .limit(1);

    const { data: bancos } = await supabase
      .from('referencias_bancarias')
      .select('*')
      .eq('id_socio', socio.id_socio)
      .limit(1);

    const ref = refs?.[0];

    setReferencia({
      nombre: ref?.nombre || '',
      apellido_paterno: ref?.apellido_paterno || '',
      apellido_materno: ref?.apellido_materno || '',
      telefono: ref?.telefono || '',
      direccion: ref?.direccion || '',
    });

    setReferenciaId(ref?.id_referencia || null);

    const ben = beneficiarios?.[0];

    setBeneficiario({
      nombre: ben?.nombre || '',
      apellido_paterno: ben?.apellido_paterno || '',
      apellido_materno: ben?.apellido_materno || '',
      telefono: ben?.telefono || '',
      direccion: ben?.direccion || '',
    });

    const banco = bancos?.[0];

    setReferenciaBancaria({
  entidad_bancaria: banco?.entidad_bancaria || '',
  titular_cuenta: String(banco?.titular_cuenta || ''),
  numero_cuenta: String(banco?.numero_cuenta || ''),
  cuenta_clave: String(banco?.cuenta_clave || ''),
  pais: banco?.pais || 'México',
  banco_otro: '',
});
  } catch (err) {
    console.error('Error cargando información del socio:', err);
  }

 setShowFicha(false);
setShowForm(true);

if (window.innerWidth >= 768) {
  setTimeout(() => {
    socioFormRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }, 150);
}
};

/** Ficha */
const openFicha = async (socio) => {

  setSocioFicha({ ...socio }); // importante: nuevo objeto
  setShowFicha(true);

  try {
    const { data: refs } = await supabase
      .from("refs_fondo")
      .select("*")
      .eq("id_socio", socio.id_socio);

    const { data: refsFamiliares } = await supabase
  .from("refs_familiares_fondo")
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
    setRefsFamiliaresFicha(refsFamiliares || []);
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
  setRefsFamiliaresFicha([]);
  setBenefFicha([]);
  setBancoFicha([]);
};

const abrirDocumentoIdentidadSocio = async (path) => {
  try {
    if (!path) {
      setError('Este socio no tiene documento cargado.');
      return;
    }

    const { data, error } = await supabase.storage
      .from('documentos-identidad-socios')
      .createSignedUrl(path, 300);

    if (error) {
      console.error('ERROR GENERANDO URL DOCUMENTO:', error);
      throw error;
    }

    if (!data?.signedUrl) {
      throw new Error('Supabase no devolvió una URL válida.');
    }

    const extension =
      path.split('.').pop()?.toLowerCase();

    const type =
      extension === 'pdf'
        ? 'pdf'
        : 'image';

    setPreviewFile({
      type,
      url: data.signedUrl,
    });

  } catch (err) {
    console.error(
      'ERROR ABRIENDO DOCUMENTO DEL SOCIO:',
      err
    );

    setError(
      `No se pudo abrir el documento del socio: ${
        err?.message || 'Error desconocido'
      }`
    );
  }
};
  
  return (
    <div className="p-3 md:p-6 space-y-6">
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
  <div>
    <h2 className="text-2xl font-bold text-slate-900 mb-2">Gestión de Socios</h2>
  </div>

{(permisosSocios.puede_crear || showForm) && (
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

          tipo_documento_identidad: '',
          documento_identidad_path: '',

          estado_civil: '',
          nombre_pareja: '',
          dependientes_economicos: '',

          email: '',
          contrasena: '',
          telefono: '',

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

          tiempo_domicilio_anios: '',
          tiempo_domicilio_meses: '',

          tipo_vivienda: '',
          vivienda_detalle: '',

          red_social: '',
          red_social_otro: '',
          red_social_url: '',

          direccion: '',
          cp: '',

          estatus: 'activo',
          fecha_nacimiento: '',
        });

        setDocumentoIdentidadFile(null);
        setDocumentoIdentidadError('');

        if (documentoIdentidadInputRef.current) {
          documentoIdentidadInputRef.current.value = '';
        }

        setPhotoFile(null);
        setPhotoPreview('');
        setPhotoError('');
      }
    }}
    className="w-full md:w-auto px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors font-medium"
  >
    {showForm ? 'Cancelar' : 'Nuevo Socio'}
  </button>
)}
</div>
    {/* Formulario */}
{showForm && (
  <>
    {/* Fondo oscuro solo al editar en móvil */}
    {editingSocio && (
      <div
        className="fixed inset-0 z-40 bg-black/50 md:hidden"
        onClick={resetForm}
      />
    )}

    <div
      className={`bg-white rounded-2xl shadow-lg border border-slate-200 p-4 md:p-6 mb-6 ${
        editingSocio
          ? 'fixed inset-3 z-50 max-h-[94vh] overflow-y-auto md:static md:max-h-none md:overflow-visible'
          : ''
      }`}
    >
      {/* Encabezado del modal móvil */}
      {editingSocio && (
        <div className="md:hidden sticky top-0 z-10 flex items-center justify-between bg-white border-b border-slate-200 -mx-4 px-4 pb-3 mb-4">
          <h3 className="text-lg font-semibold text-slate-900">
            Editar Socio
          </h3>

          <button
            type="button"
            onClick={resetForm}
            className="px-3 py-2 bg-slate-100 text-slate-700 rounded-lg font-medium"
          >
            Cerrar
          </button>
        </div>
      )}

      <h3
        className={`text-xl font-semibold text-slate-900 mb-4 ${
          editingSocio ? 'hidden md:block' : ''
        }`}
      >
        {editingSocio ? 'Editar Socio' : 'Registrar Nuevo Socio'}
      </h3>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

       <form
  ref={socioFormRef}
  onSubmit={handleAddOrUpdateSocio}
 className="grid grid-cols-1 md:grid-cols-2 gap-4 scroll-mt-24"
>
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
              {/* ================= DOCUMENTO DE IDENTIDAD ================= */}

<div className="col-span-full border-t border-slate-200 pt-4 mt-2">
  <label className="block text-sm font-semibold text-slate-700 mb-2">
    CURP / INE / Pasaporte *
  </label>

  <select
    name="tipo_documento_identidad"
    value={newSocio.tipo_documento_identidad}
    onChange={handleInputChange}
    className="w-full px-4 py-2 border border-slate-200 rounded-lg"
    required
  >
    <option value="">
      Seleccione documento
    </option>

    <option value="CURP">
      CURP
    </option>

    <option value="INE">
      INE
    </option>

    <option value="PASAPORTE">
      Pasaporte
    </option>
  </select>
</div>


<div className="col-span-full">
  <label className="block text-sm font-medium text-slate-700 mb-2">
    Cargar archivo *
  </label>

  <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">

    <button
      type="button"
      onClick={() =>
        documentoIdentidadInputRef.current?.click()
      }
      className="px-4 py-2 bg-slate-800 text-white rounded-xl hover:bg-slate-900 font-medium"
    >
      📎 Cargar archivo
    </button>

    <input
      ref={documentoIdentidadInputRef}
      type="file"
      accept="application/pdf,image/jpeg,image/png"
      onChange={handleDocumentoIdentidadChange}
      className="hidden"
    />

    <div className="text-sm text-slate-600">

      {documentoIdentidadFile ? (
        <span className="font-medium text-emerald-700">
          {documentoIdentidadFile.name}
        </span>
      ) : newSocio.documento_identidad_path ? (
        <span className="font-medium text-emerald-700">
          Documento actualmente cargado
        </span>
      ) : (
        <span>
          PDF, JPG o PNG. Máximo 10 MB.
        </span>
      )}

    </div>

  </div>

  {documentoIdentidadError && (
    <p className="text-sm text-red-600 mt-2">
      {documentoIdentidadError}
    </p>
  )}

  {documentoIdentidadUploading && (
    <p className="text-sm text-blue-600 mt-2">
      Subiendo documento...
    </p>
  )}
</div>  
  {/* ================= ESTADO CIVIL ================= */}

<div>
  <label className="block text-sm font-medium text-slate-700 mb-1">
    Estado Civil *
  </label>

  <select
    name="estado_civil"
    value={newSocio.estado_civil}
    onChange={(e) => {
      const value = e.target.value;

      setNewSocio((prev) => ({
        ...prev,
        estado_civil: value,

        nombre_pareja:
          value === 'CASADO' ||
          value === 'UNION_LIBRE'
            ? prev.nombre_pareja
            : '',
      }));
    }}
    className="w-full px-4 py-2 border border-slate-200 rounded-lg"
    required
  >
    <option value="">
      Seleccione estado civil
    </option>

    <option value="SOLTERO">
      Soltero (a)
    </option>

    <option value="CASADO">
      Casado (a)
    </option>

    <option value="VIUDO">
      Viudo (a)
    </option>

    <option value="DIVORCIADO">
      Divorciado (a)
    </option>

    <option value="UNION_LIBRE">
      Unión Libre
    </option>
  </select>
</div>
      {(
  newSocio.estado_civil === 'CASADO' ||
  newSocio.estado_civil === 'UNION_LIBRE'
) && (
  <div>
    <label className="block text-sm font-medium text-slate-700 mb-1">
      Nombre esposo(a), compañero(a), pareja(a) *
    </label>

    <input
      type="text"
      name="nombre_pareja"
      value={newSocio.nombre_pareja}
      onChange={handleInputChange}
      placeholder="Nombre completo"
      className="w-full px-4 py-2 border border-slate-200 rounded-lg"
      required
    />
  </div>
)}
  <div>
  <label className="block text-sm font-medium text-slate-700 mb-1">
    Dependientes económicos *
  </label>

  <select
    name="dependientes_economicos"
    value={newSocio.dependientes_economicos}
    onChange={handleInputChange}
    className="w-full px-4 py-2 border border-slate-200 rounded-lg"
    required
  >
    <option value="">
      Seleccione
    </option>

    {Array.from(
      { length: 10 },
      (_, i) => i + 1
    ).map((numero) => (
      <option
        key={numero}
        value={numero}
      >
        {numero}
      </option>
    ))}
  </select>
</div>
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
             placeholder="Genere una contraseña para el acceso a su app *"
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
{/* ================= FOTO DEL SOCIO ================= */}
<div className="col-span-full">
  <label className="block text-sm font-semibold text-slate-700 mb-2">
    Foto del socio
  </label>

  <div
    ref={dropRef}
    onDragOver={handleDragOver}
    onDragLeave={handleDragLeave}
    onDrop={handleDrop}
    className="
      w-full
      border-2
      border-dashed
      border-slate-300
      rounded-2xl
      bg-slate-50
      p-5
      flex
      flex-col
      md:flex-row
      items-center
      gap-5
    "
  >
    <div className="shrink-0">
      <img
        src={photoPreview || avatarFallback(newSocio)}
        alt="Vista previa del socio"
        className="
          w-24
          h-24
          rounded-full
          object-cover
          border-4
          border-white
          shadow
        "
      />
    </div>

    <div className="flex-1 w-full text-center md:text-left">
      <p className="font-semibold text-slate-800">
        {photoFile
          ? photoFile.name
          : photoPreview
            ? 'Foto actual del socio'
            : 'No se ha seleccionado ninguna foto'}
      </p>

      <p className="text-sm text-slate-500 mt-1">
        Formatos permitidos: JPG y PNG. Tamaño máximo: 5 MB.
      </p>

      <p className="hidden md:block text-sm text-slate-500 mt-1">
        También puedes arrastrar una imagen a esta área.
      </p>

      <div className="mt-4 flex flex-col sm:flex-row gap-2 justify-center md:justify-start">
        <button
  type="button"
  onClick={abrirCamara}
  disabled={
    photoUploading ||
    saving
  }
  className="
    w-full
    sm:w-auto
    px-4
    py-2.5
    bg-blue-600
    text-white
    rounded-xl
    hover:bg-blue-700
    disabled:opacity-50
    font-medium
  "
>
  📷 Tomar foto
</button>
        <button
          type="button"
          onClick={handleChooseFile}
          disabled={photoUploading || saving}
          className="
            w-full
            sm:w-auto
            px-4
            py-2.5
            bg-slate-800
            text-white
            rounded-xl
            hover:bg-slate-900
            disabled:opacity-50
            font-medium
          "
        >
          {photoPreview ? 'Cambiar foto' : 'Seleccionar foto'}
        </button>

        {photoFile && (
          <button
            type="button"
            onClick={() => {
              setPhotoFile(null);

              setPhotoPreview(
                editingSocio?.foto_url || ''
              );

              setPhotoError('');

              if (fileInputRef.current) {
                fileInputRef.current.value = '';
              }
            }}
            className="
              w-full
              sm:w-auto
              px-4
              py-2.5
              bg-slate-200
              text-slate-700
              rounded-xl
              hover:bg-slate-300
              font-medium
            "
          >
            Cancelar selección
          </button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png"
        className="hidden"
        onChange={handleFileChange}
      />

      {photoError && (
        <p className="mt-3 text-sm font-medium text-red-600">
          {photoError}
        </p>
      )}

      {photoUploading && (
        <p className="mt-3 text-sm font-medium text-blue-600">
          Subiendo foto del socio...
        </p>
      )}
    </div>
  </div>
</div>
{/* ================= DOMICILIO ================= */}

<div className="col-span-full border-t-2 border-emerald-600 pt-6 mt-4">
  <h4 className="text-lg font-semibold text-slate-800">
    Dirección completa donde vive
  </h4>

  <p className="text-sm text-slate-500 mt-1">
    Todos los campos son obligatorios excepto Edificio.
  </p>
</div>


<div>
  <label className="block text-sm font-medium text-slate-700 mb-1">
    Calle *
  </label>

  <input
    type="text"
    name="domicilio_calle"
    value={newSocio.domicilio_calle}
    onChange={handleInputChange}
    className="w-full px-4 py-2 border border-slate-200 rounded-lg"
    required
  />
</div>


<div>
  <label className="block text-sm font-medium text-slate-700 mb-1">
    Número *
  </label>

  <input
    type="text"
    name="domicilio_numero"
    value={newSocio.domicilio_numero}
    onChange={handleInputChange}
    className="w-full px-4 py-2 border border-slate-200 rounded-lg"
    required
  />
</div>


<div>
  <label className="block text-sm font-medium text-slate-700 mb-1">
    Edificio
  </label>

  <input
    type="text"
    name="domicilio_edificio"
    value={newSocio.domicilio_edificio}
    onChange={handleInputChange}
    placeholder="Opcional"
    className="w-full px-4 py-2 border border-slate-200 rounded-lg"
  />
</div>


<div>
  <label className="block text-sm font-medium text-slate-700 mb-1">
    Colonia *
  </label>

  <input
    type="text"
    name="domicilio_colonia"
    value={newSocio.domicilio_colonia}
    onChange={handleInputChange}
    className="w-full px-4 py-2 border border-slate-200 rounded-lg"
    required
  />
</div>

{/* ================= ESTADO / PAÍS ================= */}

<div>
  <label className="block text-sm font-medium text-slate-700 mb-1">
    Estado *
  </label>

  <select
    name="domicilio_estado"
    value={newSocio.domicilio_estado}
    onChange={(e) => {
      const value = e.target.value;

      setNewSocio((prev) => ({
        ...prev,
        domicilio_estado: value,

        // Si deja de ser extranjero, limpiamos el país
        domicilio_pais:
          value === 'EXTRANJERO'
            ? prev.domicilio_pais
            : '',
      }));
    }}
    className="w-full px-4 py-2 border border-slate-200 rounded-lg"
    required
  >
    <option value="">
      Seleccione estado
    </option>

    <option value="AGUASCALIENTES">Aguascalientes</option>
    <option value="BAJA CALIFORNIA">Baja California</option>
    <option value="BAJA CALIFORNIA SUR">Baja California Sur</option>
    <option value="CAMPECHE">Campeche</option>
    <option value="CHIAPAS">Chiapas</option>
    <option value="CHIHUAHUA">Chihuahua</option>
    <option value="CIUDAD DE MÉXICO">Ciudad de México</option>
    <option value="COAHUILA">Coahuila</option>
    <option value="COLIMA">Colima</option>
    <option value="DURANGO">Durango</option>
    <option value="ESTADO DE MÉXICO">Estado de México</option>
    <option value="GUANAJUATO">Guanajuato</option>
    <option value="GUERRERO">Guerrero</option>
    <option value="HIDALGO">Hidalgo</option>
    <option value="JALISCO">Jalisco</option>
    <option value="MICHOACÁN">Michoacán</option>
    <option value="MORELOS">Morelos</option>
    <option value="NAYARIT">Nayarit</option>
    <option value="NUEVO LEÓN">Nuevo León</option>
    <option value="OAXACA">Oaxaca</option>
    <option value="PUEBLA">Puebla</option>
    <option value="QUERÉTARO">Querétaro</option>
    <option value="QUINTANA ROO">Quintana Roo</option>
    <option value="SAN LUIS POTOSÍ">San Luis Potosí</option>
    <option value="SINALOA">Sinaloa</option>
    <option value="SONORA">Sonora</option>
    <option value="TABASCO">Tabasco</option>
    <option value="TAMAULIPAS">Tamaulipas</option>
    <option value="TLAXCALA">Tlaxcala</option>
    <option value="VERACRUZ">Veracruz</option>
    <option value="YUCATÁN">Yucatán</option>
    <option value="ZACATECAS">Zacatecas</option>

    <option value="EXTRANJERO">
      Extranjero
    </option>
  </select>
</div>


{newSocio.domicilio_estado === 'EXTRANJERO' && (
  <div>
    <label className="block text-sm font-medium text-slate-700 mb-1">
      País *
    </label>

    <input
      type="text"
      name="domicilio_pais"
      value={newSocio.domicilio_pais}
      onChange={handleInputChange}
      placeholder="Escriba el país"
      className="w-full px-4 py-2 border border-slate-200 rounded-lg"
      required
    />
  </div>
)}
<div>
  <label className="block text-sm font-medium text-slate-700 mb-1">
    Alcaldía o Municipio *
  </label>

  <input
    type="text"
    name="domicilio_municipio"
    value={newSocio.domicilio_municipio}
    onChange={handleInputChange}
    className="w-full px-4 py-2 border border-slate-200 rounded-lg"
    required
  />
</div>


<div>
  <label className="block text-sm font-medium text-slate-700 mb-1">
    Código Postal *
  </label>

  <input
    type="tel"
    inputMode="numeric"
    pattern="[0-9]*"
    name="domicilio_cp"
    value={newSocio.domicilio_cp}
    onChange={(e) =>
      setNewSocio((prev) => ({
        ...prev,
        domicilio_cp:
          onlyDigitsMax(e.target.value, 5),
      }))
    }
    className="w-full px-4 py-2 border border-slate-200 rounded-lg"
    required
  />
</div>


<div className="col-span-full">
  <label className="block text-sm font-medium text-slate-700 mb-1">
    Entre Calles *
  </label>

  <input
    type="text"
    name="domicilio_entre_calles"
    value={newSocio.domicilio_entre_calles}
    onChange={handleInputChange}
    placeholder="Ej. Avenida Juárez y Calle Hidalgo"
    className="w-full px-4 py-2 border border-slate-200 rounded-lg"
    required
  />
</div>


<div className="col-span-full">
  <label className="block text-sm font-medium text-slate-700 mb-1">
    Referencias *
  </label>

  <textarea
    name="domicilio_referencias"
    value={newSocio.domicilio_referencias}
    onChange={handleInputChange}
    placeholder="Describa referencias para localizar el domicilio"
    rows={3}
    className="w-full px-4 py-2 border border-slate-200 rounded-lg"
    required
  />
</div>
<div className="col-span-full mt-3">
  <label className="block text-sm font-semibold text-slate-700 mb-2">
    Tiempo viviendo en ese domicilio *
  </label>
</div>


<div>
  <label className="block text-sm text-slate-600 mb-1">
    Años
  </label>

  <select
    name="tiempo_domicilio_anios"
    value={newSocio.tiempo_domicilio_anios}
    onChange={handleInputChange}
    className="w-full px-4 py-2 border border-slate-200 rounded-lg"
    required
  >
    <option value="">
      Seleccione años
    </option>

    {Array.from(
      { length: 30 },
      (_, i) => i + 1
    ).map((numero) => (
      <option
        key={numero}
        value={numero}
      >
        {numero}
      </option>
    ))}
  </select>
</div>


<div>
  <label className="block text-sm text-slate-600 mb-1">
    Meses
  </label>

  <select
    name="tiempo_domicilio_meses"
    value={newSocio.tiempo_domicilio_meses}
    onChange={handleInputChange}
    className="w-full px-4 py-2 border border-slate-200 rounded-lg"
    required
  >
    <option value="">
      Seleccione meses
    </option>

    {Array.from(
      { length: 11 },
      (_, i) => i + 1
    ).map((numero) => (
      <option
        key={numero}
        value={numero}
      >
        {numero}
      </option>
    ))}
  </select>
</div>
<div className="col-span-full mt-3">
  <label className="block text-sm font-semibold text-slate-700 mb-2">
    La vivienda es propia, rentada, de un familiar o paga hipoteca *
  </label>
</div>


<div>
  <select
    name="tipo_vivienda"
    value={newSocio.tipo_vivienda}
    onChange={handleInputChange}
    className="w-full px-4 py-2 border border-slate-200 rounded-lg"
    required
  >
    <option value="">
      Seleccione
    </option>

    <option value="PROPIA">
      Propia
    </option>

    <option value="RENTADA">
      Rentada
    </option>

    <option value="FAMILIAR">
      De un familiar
    </option>

    <option value="HIPOTECA">
      Paga hipoteca
    </option>
  </select>
</div>


<div>
  <input
    type="text"
    name="vivienda_detalle"
    value={newSocio.vivienda_detalle}
    onChange={handleInputChange}
    maxLength={250}
    placeholder="Especifique detalles de la vivienda *"
    className="w-full px-4 py-2 border border-slate-200 rounded-lg"
    required
  />
</div>
{/* ================= REDES SOCIALES ================= */}

<div className="col-span-full border-t border-slate-200 pt-5 mt-4">
  <h4 className="font-semibold text-slate-800 mb-3">
    Redes Sociales
  </h4>
</div>


<div>
  <label className="block text-sm font-medium text-slate-700 mb-1">
    Red Social *
  </label>

  <select
    name="red_social"
    value={newSocio.red_social}
   onChange={(e) => {
  const value = e.target.value;

  setNewSocio((prev) => ({
    ...prev,
    red_social: value,

    red_social_otro:
      value === 'OTRO'
        ? prev.red_social_otro
        : '',

    red_social_url:
      value === 'NO'
        ? ''
        : prev.red_social_url,
  }));
}}
    className="w-full px-4 py-2 border border-slate-200 rounded-lg"
    required
  >
    <option value="">
      Seleccione
    </option>

    <option value="FACEBOOK">
      Facebook
    </option>

    <option value="INSTAGRAM">
      Instagram
    </option>

    <option value="TIKTOK">
      TikTok
    </option>

    <option value="OTRO">
      Otro
    </option>
      <option value="NO">
  No
</option>
  </select>
</div>


{newSocio.red_social === 'OTRO' && (
  <div>
    <label className="block text-sm font-medium text-slate-700 mb-1">
      Escriba el nombre de la red social *
    </label>

    <input
      type="text"
      name="red_social_otro"
      value={newSocio.red_social_otro}
      onChange={handleInputChange}
      className="w-full px-4 py-2 border border-slate-200 rounded-lg"
      required
    />
  </div>
)}


{newSocio.red_social !== 'NO' && (
  <div className="col-span-full">
    <label className="block text-sm font-medium text-slate-700 mb-1">
      Dirección de la red social *
    </label>

    <input
      type="text"
      name="red_social_url"
      value={newSocio.red_social_url}
      onChange={handleInputChange}
      placeholder="Ej. https://facebook.com/usuario o @usuario"
      className="w-full px-4 py-2 border border-slate-200 rounded-lg"
      required
    />
  </div>
)}
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



{/* ================= REFERENCIA FAMILIAR ================= */}
<FormularioReferencia
  titulo="Referencias Familiares"
  datos={referenciaFamiliar}
  setDatos={setReferenciaFamiliar}
  opcionesParentesco={PARENTESCOS_FAMILIARES}
/>


{/* ================= REFERENCIA PERSONAL ================= */}
<FormularioReferencia
  titulo="Referencias Personales"
  datos={referencia}
  setDatos={setReferencia}
  opcionesParentesco={PARENTESCOS_PERSONALES}
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
      </>
    )}

{/* Tabla principal */}
{loading && (
  <p className="text-center text-slate-600">
    Cargando socios...
  </p>
)}

{error && !loading && !showForm && (
  <p className="text-center text-red-500">
    Error: {error}
  </p>
)}

{!loading && !error && sociosList.length === 0 && (
  <p className="text-center text-slate-600">
    No hay socios registrados.
  </p>
)}

{!loading && !error && sociosList.length > 0 && (
  <div className="bg-white rounded-2xl border border-slate-200 p-4 md:p-6">
    <h3 className="text-xl font-semibold text-slate-900 mb-4">
      Todos los Socios
    </h3>

    <div className="mb-4 grid grid-cols-1 md:grid-cols-[1fr_260px] gap-3">
  <input
    type="text"
    value={searchSocio}
    onChange={(e) => setSearchSocio(e.target.value)}
    placeholder="Buscar por ID o nombre del socio..."
    className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
  />

  <select
    value={filtroDocumentacion}
    onChange={(e) => setFiltroDocumentacion(e.target.value)}
    className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-500"
  >
    <option value="todos">Todos los socios</option>
    <option value="incompletos">⚠ Información incompleta</option>
    <option value="completos">✓ Información completa</option>
  </select>
</div>

    {/* Vista móvil */}
    <div className="md:hidden space-y-3">
      {sociosFiltrados.map((socio) => (
        <div
          key={socio.id_socio}
          onClick={() => openFicha(socio)}
          className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4 cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <img
              src={socio.foto_url || avatarFallback(socio)}
              alt="avatar"
              className="w-14 h-14 rounded-full object-cover border shrink-0"
            />

                {!socio.documentacion_completa && (
  <button
    type="button"
    onClick={(e) => {
      e.stopPropagation();
      setSocioConFaltantes(socio);
    }}
    className="shrink-0 text-amber-500"
    aria-label="Ver información faltante"
  >
    <svg
      className="w-7 h-7"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12.87 3.5a1 1 0 0 0-1.74 0L2.4 18.5A1 1 0 0 0 3.27 20h17.46a1 1 0 0 0 .87-1.5L12.87 3.5ZM12 8a1 1 0 0 1 1 1v4a1 1 0 1 1-2 0V9a1 1 0 0 1 1-1Zm0 9a1.25 1.25 0 1 1 0-2.5A1.25 1.25 0 0 1 12 17Z" />
    </svg>
  </button>
)}

            <div className="min-w-0">
              <p className="text-xs text-slate-500">
                Socio #{socio.id_socio}
              </p>

              <p className="font-semibold text-slate-900 break-words">
                {socio.nombre} {socio.apellido_paterno}{' '}
                {socio.apellido_materno}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <div>
              <p className="text-xs text-slate-500">Correo electrónico</p>
              <p className="text-sm font-medium text-slate-800 break-all">
                {socio.email || '-'}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-500">Teléfono</p>
              <p className="text-sm font-medium text-slate-800">
                {socio.telefono || '-'}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-500">Estatus</p>

              <span
                className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-medium ${
                  socio.estatus
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                }`}
              >
                {socio.estatus ? 'Activo' : 'Inactivo'}
              </span>
            </div>
          </div>

          {(permisosSocios.puede_editar ||
            permisosSocios.puede_eliminar) && (
            <div className="flex flex-col gap-2 pt-2">
              {permisosSocios.puede_editar && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditClick(socio);
                  }}
                  className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors"
                >
                  Editar
                </button>
              )}

              {permisosSocios.puede_eliminar && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteClick(socio);
                  }}
                  className="w-full px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors"
                >
                  Eliminar
                </button>
              )}
            </div>
          )}
        </div>
      ))}
    </div>

    {/* Vista escritorio */}
    <div className="hidden md:block overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-200">
            <th className="text-left py-3 px-4 font-semibold text-slate-700">
              Foto
            </th>

            <th className="text-left py-3 px-4 font-semibold text-slate-700">
              ID
            </th>

            <th className="text-left py-3 px-4 font-semibold text-slate-700">
              Nombre Completo
            </th>

            <th className="text-left py-3 px-4 font-semibold text-slate-700">
              Email
            </th>

            <th className="text-left py-3 px-4 font-semibold text-slate-700">
              Teléfono
            </th>

            <th className="text-left py-3 px-4 font-semibold text-slate-700">
              Estatus
            </th>

            <th className="text-left py-3 px-4 font-semibold text-slate-700">
              Acciones
            </th>
          </tr>
        </thead>

        <tbody>
          {sociosFiltrados.map((socio) => (
            <tr
              key={socio.id_socio}
              className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer"
              onClick={() => openFicha(socio)}
            >
             <td className="py-3 px-4">
  <div className="flex items-center gap-2">
    <img
      src={socio.foto_url || avatarFallback(socio)}
      alt="avatar"
      className="w-10 h-10 rounded-full object-cover border"
    />

    {!socio.documentacion_completa && (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setSocioConFaltantes(socio);
        }}
       title={`Información pendiente: ${(socio.informacion_faltante || []).join(', ')}`}
        className="shrink-0 text-amber-500 hover:text-amber-600"
      >
        <svg
          className="w-6 h-6"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M12.87 3.5a1 1 0 0 0-1.74 0L2.4 18.5A1 1 0 0 0 3.27 20h17.46a1 1 0 0 0 .87-1.5L12.87 3.5ZM12 8a1 1 0 0 1 1 1v4a1 1 0 1 1-2 0V9a1 1 0 0 1 1-1Zm0 9a1.25 1.25 0 1 1 0-2.5A1.25 1.25 0 0 1 12 17Z" />
        </svg>
      </button>
    )}
  </div>
</td>

              <td className="py-3 px-4 text-slate-700">
                {socio.id_socio}
              </td>

              <td className="py-3 px-4">
                <div className="font-medium text-slate-900">
                  {socio.nombre} {socio.apellido_paterno}{' '}
                  {socio.apellido_materno}
                </div>
              </td>

              <td className="py-3 px-4 text-slate-700">
                {socio.email}
              </td>

              <td className="py-3 px-4 text-slate-700">
                {socio.telefono}
              </td>

              <td className="py-3 px-4">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    socio.estatus
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {socio.estatus ? 'activo' : 'inactivo'}
                </span>
              </td>

              <td className="py-3 px-4">
                <div className="flex space-x-2">
                  {permisosSocios.puede_editar && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditClick(socio);
                      }}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Editar"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                    </button>
                  )}

                  {permisosSocios.puede_eliminar && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteClick(socio);
                      }}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Eliminar"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  )}
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

  if (socioFormRef.current) {
    socioFormRef.current.requestSubmit();
  }
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
           const nombre = textoMayusculas(bancoPersonalizado.nombre);
const pais = textoMayusculas(bancoPersonalizado.pais);

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

{/* MODAL INFORMACIÓN FALTANTE */}
{socioConFaltantes && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[9999]">
    <div className="bg-white rounded-2xl shadow-xl p-5 md:p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
            <svg
              className="w-7 h-7"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12.87 3.5a1 1 0 0 0-1.74 0L2.4 18.5A1 1 0 0 0 3.27 20h17.46a1 1 0 0 0 .87-1.5L12.87 3.5ZM12 8a1 1 0 0 1 1 1v4a1 1 0 1 1-2 0V9a1 1 0 0 1 1-1Zm0 9a1.25 1.25 0 1 1 0-2.5A1.25 1.25 0 0 1 12 17Z" />
            </svg>
          </div>

          <div>
            <h3 className="text-lg font-bold text-slate-900">
              Información pendiente
            </h3>

            <p className="text-sm text-slate-600">
              {socioConFaltantes.nombre}{' '}
              {socioConFaltantes.apellido_paterno}{' '}
              {socioConFaltantes.apellido_materno}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setSocioConFaltantes(null)}
          className="text-slate-500 hover:text-slate-800 text-xl"
        >
          ✕
        </button>
      </div>

      <p className="text-sm text-slate-600 mb-3">
        Debe completar los siguientes datos:
      </p>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <ul className="space-y-2">
         {(socioConFaltantes.informacion_faltante || []).map((dato) => (
            <li
              key={dato}
              className="flex items-start gap-2 text-sm text-slate-800"
            >
              <span className="text-amber-500 font-bold">⚠</span>
              <span>{dato}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-col md:flex-row justify-end gap-3 mt-5">
        <button
          type="button"
          onClick={() => setSocioConFaltantes(null)}
          className="w-full md:w-auto px-4 py-2 bg-slate-200 text-slate-800 rounded-xl font-medium"
        >
          Cerrar
        </button>

        {permisosSocios.puede_editar && (
          <button
            type="button"
            onClick={() => {
              const socio = socioConFaltantes;
              setSocioConFaltantes(null);
              handleEditClick(socio);
            }}
            className="w-full md:w-auto px-4 py-2 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700"
          >
            Completar información
          </button>
        )}
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
       <div className="bg-white rounded-2xl shadow-xl p-5 md:p-8 max-w-4xl w-full relative max-h-[90vh] overflow-y-auto text-base">

 
            <button
              onClick={closeFicha}
              className="absolute top-3 right-3 text-slate-500 hover:text-slate-800"
            >
              ✕
            </button>

            <div className="flex items-center gap-4 mb-4">
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 text-sm md:text-base">

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
  <span className="font-semibold">
    Documento:
  </span>

  <p>
    {socioFicha.tipo_documento_identidad || '-'}
  </p>

  {socioFicha.documento_identidad_path && (
    <button
      type="button"
      onClick={() =>
        abrirDocumentoIdentidadSocio(
          socioFicha.documento_identidad_path
        )
      }
      className="
        inline-block
        mt-2
        px-3
        py-1.5
        bg-emerald-600
        hover:bg-emerald-700
        text-white
        rounded-lg
        text-xs
        font-medium
        w-full
        sm:w-auto
      "
    >
      Ver Documento
    </button>
  )}
</div>


<div>
  <span className="font-semibold">
    Estado Civil:
  </span>

  <p>
    {socioFicha.estado_civil || '-'}
  </p>
</div>


{(
  socioFicha.estado_civil === 'CASADO' ||
  socioFicha.estado_civil === 'UNION_LIBRE'
) && (
  <div className="col-span-full">
    <span className="font-semibold">
      Esposo(a) / Pareja:
    </span>

    <p>
      {socioFicha.nombre_pareja || '-'}
    </p>
  </div>
)}


<div>
  <span className="font-semibold">
    Dependientes económicos:
  </span>

  <p>
    {socioFicha.dependientes_economicos ?? '-'}
  </p>
</div>


<div className="col-span-full mt-4">
  <h4 className="font-bold text-slate-900 text-lg">
    Dirección completa donde vive
  </h4>
</div>


<div>
  <span className="font-semibold">
    Calle:
  </span>

  <p>
    {socioFicha.domicilio_calle || '-'}
  </p>
</div>


<div>
  <span className="font-semibold">
    Número:
  </span>

  <p>
    {socioFicha.domicilio_numero || '-'}
  </p>
</div>


<div>
  <span className="font-semibold">
    Edificio:
  </span>

  <p>
    {socioFicha.domicilio_edificio || '-'}
  </p>
</div>


<div>
  <span className="font-semibold">
    Colonia:
  </span>

  <p>
    {socioFicha.domicilio_colonia || '-'}
  </p>
</div>


<div>
  <span className="font-semibold">
    Alcaldía / Municipio:
  </span>

  <p>
    {socioFicha.domicilio_municipio || '-'}
  </p>
</div>


<div>
  <span className="font-semibold">
    Código Postal:
  </span>

  <p>
    {socioFicha.domicilio_cp ||
      socioFicha.cp ||
      '-'}
  </p>
</div>


<div className="col-span-full">
  <span className="font-semibold">
    Entre Calles:
  </span>

  <p>
    {socioFicha.domicilio_entre_calles || '-'}
  </p>
</div>


<div className="col-span-full">
  <span className="font-semibold">
    Referencias:
  </span>

  <p>
    {socioFicha.domicilio_referencias || '-'}
  </p>
</div>


<div>
  <span className="font-semibold">
    Tiempo en domicilio:
  </span>

  <p>
    {socioFicha.tiempo_domicilio_anios || '-'} años,{' '}
    {socioFicha.tiempo_domicilio_meses || '-'} meses
  </p>
</div>


<div>
  <span className="font-semibold">
    Tipo de vivienda:
  </span>

  <p>
    {socioFicha.tipo_vivienda || '-'}
  </p>
</div>


<div className="col-span-full">
  <span className="font-semibold">
    Detalles de vivienda:
  </span>

  <p>
    {socioFicha.vivienda_detalle || '-'}
  </p>
</div>


<div>
  <span className="font-semibold">
    Red Social:
  </span>

  <p>
    {socioFicha.red_social === 'OTRO'
      ? socioFicha.red_social_otro
      : socioFicha.red_social || '-'}
  </p>
</div>


<div>
  <span className="font-semibold">
    Dirección de Red Social:
  </span>

  <p className="break-all">
    {socioFicha.red_social_url || '-'}
  </p>
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

{/* REFERENCIAS FAMILIARES */}
{refsFamiliaresFicha.length > 0 && (
  <div className="mt-4 border-t border-slate-200 pt-4">

    <h4 className="font-bold text-slate-900 text-lg mb-3">
      Referencias Familiares
    </h4>

    {refsFamiliaresFicha.map((r) => (
      <div
        key={r.id_referencia_familiar}
        className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-sm md:text-base"
      >

        <div className="col-span-full">
          <strong>Nombre:</strong>{' '}
          {r.nombre} {r.apellido_paterno} {r.apellido_materno}
        </div>

        <div>
          <strong>Teléfono:</strong>{' '}
          {r.telefono || '-'}
        </div>

        <div>
          <strong>Parentesco:</strong>{' '}
          {r.parentesco || '-'}
        </div>

        <div>
          <strong>Tiempo de conocerlo:</strong>{' '}
          {r.tiempo_conocer_anios || '-'} años,{' '}
          {r.tiempo_conocer_meses || '-'} meses
        </div>

        <div className="col-span-full mt-2">
          <strong>Dirección completa:</strong>
        </div>

        <div>
          <strong>Calle:</strong>{' '}
          {r.domicilio_calle || '-'}
        </div>

        <div>
          <strong>Número:</strong>{' '}
          {r.domicilio_numero || '-'}
        </div>

        <div>
          <strong>Edificio:</strong>{' '}
          {r.domicilio_edificio || '-'}
        </div>

        <div>
          <strong>Colonia:</strong>{' '}
          {r.domicilio_colonia || '-'}
        </div>

        <div>
          <strong>Estado:</strong>{' '}
          {r.domicilio_estado || '-'}
        </div>

        {r.domicilio_estado === 'EXTRANJERO' && (
          <div>
            <strong>País:</strong>{' '}
            {r.domicilio_pais || '-'}
          </div>
        )}

        <div>
          <strong>Alcaldía / Municipio:</strong>{' '}
          {r.domicilio_municipio || '-'}
        </div>

        <div>
          <strong>Código Postal:</strong>{' '}
          {r.domicilio_cp || '-'}
        </div>

        <div className="col-span-full">
          <strong>Entre Calles:</strong>{' '}
          {r.domicilio_entre_calles || '-'}
        </div>

        <div className="col-span-full">
          <strong>Referencias:</strong>{' '}
          {r.domicilio_referencias || '-'}
        </div>

      </div>
    ))}
  </div>
)}

{/* REFERENCIAS PERSONALES */}
{refsFicha.length > 0 && (
  <div className="mt-4 border-t border-slate-200 pt-4">

    <h4 className="font-bold text-slate-900 text-lg mb-3">
      Referencias Personales
    </h4>

    {refsFicha.map((r) => (
      <div
        key={r.id_referencia}
        className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-sm md:text-base"
      >

        <div className="col-span-full">
          <strong>Nombre:</strong>{' '}
          {r.nombre} {r.apellido_paterno} {r.apellido_materno}
        </div>

        <div>
          <strong>Teléfono:</strong>{' '}
          {r.telefono || '-'}
        </div>

        <div>
          <strong>Relación:</strong>{' '}
          {r.parentesco || '-'}
        </div>

        <div>
          <strong>Tiempo de conocerlo:</strong>{' '}
          {r.tiempo_conocer_anios || '-'} años,{' '}
          {r.tiempo_conocer_meses || '-'} meses
        </div>

        <div className="col-span-full mt-2">
          <strong>Dirección completa:</strong>
        </div>

        <div>
          <strong>Calle:</strong>{' '}
          {r.domicilio_calle || '-'}
        </div>

        <div>
          <strong>Número:</strong>{' '}
          {r.domicilio_numero || '-'}
        </div>

        <div>
          <strong>Edificio:</strong>{' '}
          {r.domicilio_edificio || '-'}
        </div>

        <div>
          <strong>Colonia:</strong>{' '}
          {r.domicilio_colonia || '-'}
        </div>

        <div>
          <strong>Estado:</strong>{' '}
          {r.domicilio_estado || '-'}
        </div>

        {r.domicilio_estado === 'EXTRANJERO' && (
          <div>
            <strong>País:</strong>{' '}
            {r.domicilio_pais || '-'}
          </div>
        )}

        <div>
          <strong>Alcaldía / Municipio:</strong>{' '}
          {r.domicilio_municipio || '-'}
        </div>

        <div>
          <strong>Código Postal:</strong>{' '}
          {r.domicilio_cp || '-'}
        </div>

        <div className="col-span-full">
          <strong>Entre Calles:</strong>{' '}
          {r.domicilio_entre_calles || '-'}
        </div>

        <div className="col-span-full">
          <strong>Referencias:</strong>{' '}
          {r.domicilio_referencias || '-'}
        </div>

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
  isMobile ? (
    <button
      type="button"
      onClick={() => setPreviewFile({ type: 'image', url: b.foto_url })}
      className="inline-block mt-2 mr-2 px-3 py-1 bg-blue-600 text-white rounded-lg text-xs"
    >
      Ver Foto
    </button>
  ) : (
    <a
      href={b.foto_url}
      target="_blank"
      rel="noreferrer"
      className="inline-block mt-2 mr-2 px-3 py-1 bg-blue-600 text-white rounded-lg text-xs"
    >
      Ver Foto
    </a>
  )
)}

{b.documentos_url && (
  isMobile ? (
    <button
      type="button"
      onClick={() => setPreviewFile({ type: 'pdf', url: b.documentos_url })}
      className="inline-block mt-2 px-3 py-1 bg-emerald-600 text-white rounded-lg text-xs"
    >
      Ver Documento
    </button>
  ) : (
    <a
      href={b.documentos_url}
      target="_blank"
      rel="noreferrer"
      className="inline-block mt-2 px-3 py-1 bg-emerald-600 text-white rounded-lg text-xs"
    >
      Ver Documento
    </a>
  )
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

{/* ================= MODAL DE CÁMARA ================= */}
{showCameraModal && (
  <div className="fixed inset-0 bg-black/70 z-[10000] flex items-center justify-center p-2 md:p-4">
    <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[96vh] overflow-hidden flex flex-col">
      {/* Encabezado */}
      <div className="flex items-center justify-between gap-3 p-4 border-b border-slate-200">
        <div>
          <h3 className="text-lg font-bold text-slate-900">
            Tomar foto del socio
          </h3>

          <p className="text-sm text-slate-500">
            Coloque el rostro dentro del encuadre
          </p>
        </div>

        <button
          type="button"
          onClick={cerrarCamara}
          className="shrink-0 px-3 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200"
        >
          Cerrar
        </button>
      </div>

      {/* Cámara */}
      <div className="relative bg-black flex-1 min-h-[320px] md:min-h-[500px] flex items-center justify-center overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`
            w-full
            h-full
            object-contain
            ${
              cameraFacingMode === 'user'
                ? 'scale-x-[-1]'
                : ''
            }
          `}
        />

        {/* Guía del rostro */}
        {!cameraError && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="w-52 h-64 md:w-64 md:h-80 rounded-[50%] border-4 border-white/70 shadow-lg" />
          </div>
        )}

        {cameraStarting && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <p className="text-white font-medium">
              Activando cámara...
            </p>
          </div>
        )}

        {cameraError && (
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center p-6">
            <div className="max-w-md text-center">
              <p className="text-red-300 font-semibold">
                {cameraError}
              </p>

              <button
                type="button"
                onClick={() =>
                  iniciarCamara(
                    cameraFacingMode
                  )
                }
                className="mt-4 px-4 py-2 bg-white text-slate-900 rounded-lg"
              >
                Intentar nuevamente
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Canvas invisible */}
      <canvas
        ref={canvasRef}
        className="hidden"
      />

      {/* Acciones */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-4 border-t border-slate-200">
        <button
          type="button"
          onClick={cambiarCamara}
          disabled={
            cameraStarting ||
            !!cameraError
          }
          className="w-full px-4 py-2.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 disabled:opacity-50"
        >
          🔄 Cambiar cámara
        </button>

        <button
          type="button"
          onClick={capturarFoto}
          disabled={
            cameraStarting ||
            !!cameraError
          }
          className="w-full px-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 font-semibold"
        >
          📸 Capturar foto
        </button>

        <button
          type="button"
          onClick={cerrarCamara}
          className="w-full px-4 py-2.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
        >
          Cancelar
        </button>
      </div>
    </div>
  </div>
)}

      {/* MODAL PREVIEW SOLO MÓVIL */}
      {previewFile && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-3 z-[9999]">
          <div className="bg-white rounded-2xl shadow-xl w-full h-[90vh] relative overflow-hidden">

            <button
              type="button"
              onClick={() => setPreviewFile(null)}
              className="absolute top-3 right-3 z-10 bg-red-600 text-white w-9 h-9 rounded-full font-bold"
            >
              ✕
            </button>

            {previewFile.type === "image" && (
              <div className="w-full h-full flex items-center justify-center bg-slate-100 p-4">
                <img
                  src={previewFile.url}
                  alt=""
                  className="max-w-full max-h-full object-contain"
                />
              </div>
            )}

            {previewFile.type === "pdf" && (
              <iframe
                src={previewFile.url}
                title="Documento"
                className="w-full h-full"
              />
            )}

          </div>
        </div>
      )}

    </div>

  );
};

export default SociosModule;

