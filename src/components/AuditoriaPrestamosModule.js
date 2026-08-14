import React, { useState } from 'react';

const SUPABASE_URL =
  'https://ubfkhtkmlvutwdivmoff.supabase.co';

const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InViZmtodGttbHZ1dHdkaXZtb2ZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4MTc5NTUsImV4cCI6MjA2NjM5Mzk1NX0.c0iRma-dnlL29OR3ffq34nmZuj_ViApBTMG-6PEX_B4';


const AuditoriaPrestamosModule = () => {

  // ======================================================
  // ==================== USUARIO ==========================
  // ======================================================

  const currentUser = (() => {

    try {

      return JSON.parse(
        localStorage.getItem('currentUser')
      ) || {};

    } catch {

      return {};

    }

  })();


  const currentUserId =
    currentUser?.id_usuario ||
    currentUser?.id ||
    null;


  // ======================================================
  // ===================== ESTADOS =========================
  // ======================================================

  const [pin, setPin] =
    useState('');

  const [autorizado, setAutorizado] =
    useState(false);

  const [terminoBuscar, setTerminoBuscar] =
  useState('');

  const [movimientos, setMovimientos] =
    useState([]);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState('');

  const [busquedaRealizada, setBusquedaRealizada] =
    useState(false);

  const [movimientoDetalle, setMovimientoDetalle] =
    useState(null);

  const [filtroAccion, setFiltroAccion] =
    useState('TODOS');


  // ================= RESTAURAR PRÉSTAMO =================

const [showRestaurarModal, setShowRestaurarModal] =
  useState(false);

const [prestamoRestaurar, setPrestamoRestaurar] =
  useState(null);

const [pinRestaurar, setPinRestaurar] =
  useState('');

const [motivoRestaurar, setMotivoRestaurar] =
  useState('');

const [restaurando, setRestaurando] =
  useState(false);

const [errorRestaurar, setErrorRestaurar] =
  useState('');

  // ======================================================
  // ===================== HELPERS =========================
  // ======================================================

  const formatCurrency = (valor) => {

    const numero =
      Number(valor);

    if (
      valor === null ||
      valor === undefined ||
      valor === '' ||
      Number.isNaN(numero)
    ) {
      return '—';
    }

    return new Intl.NumberFormat(
      'es-MX',
      {
        style: 'currency',
        currency: 'MXN',
      }
    ).format(numero);

  };


  const formatFechaHora = (valor) => {

    if (!valor) {
      return '—';
    }

    const fecha =
      new Date(valor);

    if (
      Number.isNaN(
        fecha.getTime()
      )
    ) {
      return valor;
    }

    return new Intl.DateTimeFormat(
      'es-MX',
      {
        timeZone:
          'America/Mexico_City',

        weekday:
          'long',

        day:
          '2-digit',

        month:
          'long',

        year:
          'numeric',

        hour:
          '2-digit',

        minute:
          '2-digit',

        second:
          '2-digit',

        hour12:
          true,
      }
    ).format(fecha);

  };


  const nombreSocio = (mov) => {

    return [
      mov.socio_nombre,
      mov.socio_apellido_paterno,
      mov.socio_apellido_materno,
    ]
      .filter(Boolean)
      .join(' ') ||
      `Socio ${mov.id_socio}`;

  };


  const textoAccion = (accion) => {

    switch (
      String(accion || '')
        .toUpperCase()
    ) {

      case 'MODIFICADO_CORRIDA':
        return 'Modificación de corrida';

      case 'CANCELADO':
        return 'Préstamo cancelado';

      case 'RESTAURADO':
        return 'Préstamo restaurado';

      default:
        return accion || 'Movimiento';

    }

  };


  const clasesAccion = (accion) => {

    switch (
      String(accion || '')
        .toUpperCase()
    ) {

      case 'MODIFICADO_CORRIDA':
        return 'bg-amber-100 text-amber-800';

      case 'CANCELADO':
        return 'bg-red-100 text-red-700';

      case 'RESTAURADO':
        return 'bg-emerald-100 text-emerald-700';

      default:
        return 'bg-slate-100 text-slate-700';

    }

  };


  // ======================================================
  // ===== NORMALIZAR EL JSON ANTERIOR / NUEVO ============
  // ======================================================

  const obtenerPrestamoAnterior = (mov) => {

    const datos =
      mov?.datos_anteriores;

    if (!datos) return {};

    return datos.prestamo ||
      datos ||
      {};

  };


  const obtenerPrestamoNuevo = (mov) => {

    const datos =
      mov?.datos_nuevos;

    if (!datos) return {};

    return datos.prestamo ||
      datos ||
      {};

  };


  const obtenerCorridaAnterior = (mov) => {

    return Array.isArray(
      mov?.datos_anteriores?.corrida
    )
      ? mov.datos_anteriores.corrida
      : [];

  };


  const obtenerCorridaNueva = (mov) => {

    return Array.isArray(
      mov?.datos_nuevos?.corrida
    )
      ? mov.datos_nuevos.corrida
      : [];

  };


  // ======================================================
  // ================= CAMPOS AUDITABLES ==================
  // ======================================================

  const camposComparacion = [

    {
      key: 'monto_solicitado',
      label: 'Monto solicitado',
      format: formatCurrency,
    },

    {
      key: 'numero_plazos',
      label: 'Número de plazos',
    },

    {
      key: 'tipo_plazo',
      label: 'Tipo de plazo',
    },

    {
      key: 'interes',
      label: 'Interés por periodo',
      suffix: '%',
    },

    {
      key: 'pago_requerido',
      label: 'Pago requerido',
      format: formatCurrency,
    },

    {
      key: 'fecha_vencimiento',
      label: 'Fecha de vencimiento',
    },

    {
      key: 'estatus',
      label: 'Estatus',
    },

    {
      key: 'eliminado',
      label: 'Cancelado',
      boolean: true,
    },

  ];


  const mostrarValor = (
    campo,
    valor
  ) => {

    if (
      valor === null ||
      valor === undefined ||
      valor === ''
    ) {
      return '—';
    }

    if (campo.boolean) {

      return valor
        ? 'Sí'
        : 'No';

    }

    if (campo.format) {

      return campo.format(
        valor
      );

    }

    if (campo.suffix) {

      return `${valor}${campo.suffix}`;

    }

    return String(valor);

  };


  const obtenerCambios = (mov) => {

    const antes =
      obtenerPrestamoAnterior(mov);

    const despues =
      obtenerPrestamoNuevo(mov);


    return camposComparacion
      .map((campo) => {

        const valorAntes =
          antes?.[campo.key];

        const valorDespues =
          despues?.[campo.key];


        if (
          JSON.stringify(valorAntes) ===
          JSON.stringify(valorDespues)
        ) {
          return null;
        }


        return {

          ...campo,

          antes:
            valorAntes,

          despues:
            valorDespues,

        };

      })
      .filter(Boolean);

  };

// ======================================================
// ===== SABER SI EL PRÉSTAMO SIGUE CANCELADO ===========
// ======================================================

const prestamoSigueCancelado = (mov) => {

  if (
    String(mov?.accion || '').toUpperCase() !==
    'CANCELADO'
  ) {
    return false;
  }

  // Los movimientos vienen ordenados
  // del más reciente al más antiguo.
  const ultimoMovimientoPrestamo =
    movimientos.find(
      (item) =>
        Number(item.id_prestamo) ===
        Number(mov.id_prestamo)
    );

  return (
    String(
      ultimoMovimientoPrestamo?.accion || ''
    ).toUpperCase() ===
    'CANCELADO'
  );

};

// ======================================================
// ============ ABRIR RESTAURAR PRÉSTAMO ================
// ======================================================

const abrirRestaurarPrestamo = (mov) => {

  if (!prestamoSigueCancelado(mov)) {

    alert(
      'Este préstamo ya no se encuentra cancelado.'
    );

    return;
  }

  setPrestamoRestaurar(mov);

  setPinRestaurar('');

  setMotivoRestaurar('');

  setErrorRestaurar('');

  setShowRestaurarModal(true);

};

// ======================================================
// =========== CONFIRMAR RESTAURACIÓN ===================
// ======================================================

const confirmarRestaurarPrestamo = async () => {

  if (!prestamoRestaurar?.id_prestamo) {

    setErrorRestaurar(
      'No se encontró el préstamo a restaurar.'
    );

    return;
  }


  const pinLimpio =
    String(pinRestaurar || '').trim();


  if (!/^\d{6}$/.test(pinLimpio)) {

    setErrorRestaurar(
      'Ingrese un PIN administrativo válido de 6 dígitos.'
    );

    return;
  }


  const motivoLimpio =
    String(motivoRestaurar || '').trim();


  if (motivoLimpio.length < 5) {

    setErrorRestaurar(
      'Debe indicar el motivo de la restauración.'
    );

    return;
  }


  setRestaurando(true);

  setErrorRestaurar('');


  try {

    const response =
      await fetch(

        `${SUPABASE_URL}/rest/v1/rpc/restaurar_prestamo_seguro`,

        {

          method: 'POST',

          headers: {

            'Content-Type':
              'application/json',

            apikey:
              SUPABASE_ANON_KEY,

            Authorization:
              `Bearer ${SUPABASE_ANON_KEY}`,

          },

          body:
            JSON.stringify({

              p_id_prestamo:
                prestamoRestaurar.id_prestamo,

              p_usuario_ref:
                String(currentUserId),

              p_pin:
                pinLimpio,

              p_motivo:
                motivoLimpio,

            }),

        }

      );


    if (!response.ok) {

      const texto =
        await response.text();


      let mensaje =
        'No se pudo restaurar el préstamo.';


      try {

        const obj =
          JSON.parse(texto);

        mensaje =
          obj?.message ||
          mensaje;

      } catch {
        // mensaje general
      }


      throw new Error(
        mensaje
      );

    }


    setShowRestaurarModal(false);

    setPrestamoRestaurar(null);

    setPinRestaurar('');

    setMotivoRestaurar('');

    setErrorRestaurar('');


    // Recargar toda la auditoría.
    await consultarAuditoria(
      null,
      pin
    );


  } catch (err) {

    setErrorRestaurar(
      err.message ||
      'No se pudo restaurar el préstamo.'
    );

  } finally {

    setRestaurando(false);

  }

};
  
  // ======================================================
  // ================= CONSULTAR RPC =======================
  // ======================================================

  const consultarAuditoria =
    async (
      idSocio = null,
      pinAUsar = pin
    ) => {

      if (!currentUserId) {

        setError(
          'No se pudo identificar al usuario que inició sesión.'
        );

        return false;

      }


      const pinLimpio =
        String(pinAUsar || '')
          .trim();


      if (
        !/^\d{6}$/.test(
          pinLimpio
        )
      ) {

        setError(
          'Ingrese un PIN válido de 6 dígitos.'
        );

        return false;

      }


      setLoading(true);
      setError('');


      try {

        const response =
          await fetch(

            `${SUPABASE_URL}/rest/v1/rpc/consultar_auditoria_prestamos`,

            {

              method:
                'POST',

              headers: {

                'Content-Type':
                  'application/json',

                apikey:
                  SUPABASE_ANON_KEY,

                Authorization:
                  `Bearer ${SUPABASE_ANON_KEY}`,

              },

              body:
                JSON.stringify({

                  p_usuario_ref:
                    String(
                      currentUserId
                    ),

                  p_pin:
                    pinLimpio,

                  p_id_socio:
                    idSocio
                      ? Number(idSocio)
                      : null,

                  p_limite:
                    500,

                }),

            }

          );


        if (!response.ok) {

          const texto =
            await response.text();

          let mensaje =
            'No se pudo consultar la auditoría.';


          try {

            const obj =
              JSON.parse(texto);

            mensaje =
              obj?.message ||
              mensaje;

          } catch {
            // mensaje general
          }


          throw new Error(
            mensaje
          );

        }


        const data =
          await response.json();


        setMovimientos(
          Array.isArray(data)
            ? data
            : []
        );


        setBusquedaRealizada(
          true
        );


        setAutorizado(
          true
        );


        return true;


      } catch (err) {

        setError(
          err.message ||
          'Error consultando auditoría.'
        );

        return false;


      } finally {

        setLoading(false);

      }

    };


  // ======================================================
  // ================ AUTORIZAR MÓDULO ====================
  // ======================================================

  const autorizarModulo =
    async () => {

      const ok =
        await consultarAuditoria(
          null,
          pin
        );


      if (ok) {

  // consultarAuditoria(null, pin)
  // ya devolvió todos los movimientos.
  setBusquedaRealizada(true);

  setFiltroAccion('TODOS');

}

    };


  // ======================================================
  // ====================== BUSCAR =========================
  // ======================================================


  const limpiarBusqueda = () => {

  setTerminoBuscar('');

  setFiltroAccion('TODOS');

  setError('');

};


  // ======================================================
  // ================= FILTRO LOCAL ========================
  // ======================================================

  const movimientosFiltrados =
  movimientos.filter((mov) => {

    // ================= FILTRO ACCIÓN =================

    const coincideAccion =
      filtroAccion === 'TODOS' ||
      String(mov.accion || '').toUpperCase() ===
        filtroAccion;


    // ================= FILTRO BÚSQUEDA =================

    const termino =
      String(terminoBuscar || '')
        .trim()
        .toLowerCase();


    if (!termino) {
      return coincideAccion;
    }


    const textoSocio = [
      mov.id_socio,
      mov.socio_nombre,
      mov.socio_apellido_paterno,
      mov.socio_apellido_materno,
    ]
      .filter(
        (valor) =>
          valor !== null &&
          valor !== undefined
      )
      .join(' ')
      .toLowerCase();


    const coincideBusqueda =
      textoSocio.includes(termino);


    return (
      coincideAccion &&
      coincideBusqueda
    );

  });


  // ======================================================
  // ================= PANTALLA PIN ========================
  // ======================================================

  if (!autorizado) {

    return (

      <div className="p-4 md:p-6">

        <div className="max-w-md mx-auto bg-white border border-slate-200 rounded-2xl shadow-sm p-6">

          <div className="text-center mb-6">

            <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-2xl flex items-center justify-center text-3xl">

              🛡️

            </div>

            <h2 className="text-2xl font-bold text-slate-900">

              Auditoría de Préstamos

            </h2>

            <p className="text-sm text-slate-500 mt-2">

              Ingrese su PIN administrativo para consultar la bitácora.

            </p>

          </div>


          <label className="block text-sm font-semibold text-slate-700 mb-1">

            PIN de administrador

          </label>


          <input
            type="password"
            inputMode="numeric"
            maxLength={6}
            value={pin}
            onChange={(e) => {

              setPin(
                e.target.value
                  .replace(/\D/g, '')
                  .slice(0, 6)
              );

              setError('');

            }}
            onKeyDown={(e) => {

              if (
                e.key === 'Enter'
              ) {

                autorizarModulo();

              }

            }}
            placeholder="••••••"
            className="w-full border border-slate-300 rounded-xl px-4 py-3 text-center text-xl tracking-[0.35em]"
          />


          {error && (

            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">

              ⚠ {error}

            </div>

          )}


          <button
            type="button"
            onClick={autorizarModulo}
            disabled={loading}
            className="w-full mt-5 px-4 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50"
          >

            {loading
              ? 'Validando...'
              : 'Ingresar a Auditoría'}

          </button>

        </div>

      </div>

    );

  }


  // ======================================================
  // ================== PANTALLA PRINCIPAL =================
  // ======================================================

  return (

    <div className="p-4 md:p-6 space-y-6">


      {/* ENCABEZADO */}

      <div>

        <h2 className="text-2xl md:text-3xl font-bold text-slate-900">

          Auditoría de Préstamos

        </h2>

        <p className="text-sm text-slate-500 mt-1">

          Historial de modificaciones, cancelaciones y restauraciones de préstamos.

        </p>

      </div>


     {/* BUSCADOR */}

<div className="bg-white border border-slate-200 rounded-2xl p-4 md:p-6">

  <label className="block text-sm font-semibold text-slate-700 mb-2">

    Buscar socio

  </label>

  <p className="text-xs text-slate-500 mb-3">

    Puede buscar por ID de socio, nombre o apellidos.

  </p>


  <div className="flex flex-col md:flex-row gap-3">

    <input
      type="text"
      value={terminoBuscar}
      onChange={(e) => {

        setTerminoBuscar(
          e.target.value
        );

        setError('');

      }}
      placeholder="Ejemplo: 35, Enrique, Peña Nieto..."
      className="flex-1 border border-slate-300 rounded-xl px-4 py-3"
    />


    <button
      type="button"
      onClick={limpiarBusqueda}
      className="px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200"
    >

      Limpiar

    </button>

  </div>


  <div className="mt-3 text-xs text-slate-500">

    Mostrando{' '}
    <strong>
      {movimientosFiltrados.length}
    </strong>{' '}
    de{' '}
    <strong>
      {movimientos.length}
    </strong>{' '}
    movimientos.

  </div>

</div>

      {/* FILTROS */}

      {busquedaRealizada &&
       movimientos.length > 0 && (

        <div className="flex gap-2 flex-wrap">

          {[
            ['TODOS', 'Todos'],
            ['MODIFICADO_CORRIDA', 'Modificaciones'],
            ['CANCELADO', 'Cancelaciones'],
            ['RESTAURADO', 'Restauraciones'],
          ].map(([valor, texto]) => (

            <button
              key={valor}
              type="button"
              onClick={() =>
                setFiltroAccion(valor)
              }
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                filtroAccion === valor
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >

              {texto}

            </button>

          ))}

        </div>

      )}


      {/* SIN RESULTADOS */}

      {busquedaRealizada &&
       movimientos.length === 0 && (

        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center">

          <div className="text-4xl mb-3">
            🔍
          </div>

          <p className="font-semibold text-slate-800">

            No existen movimientos de auditoría para este socio.

          </p>

        </div>

      )}


      {/* HISTORIAL */}

      {movimientosFiltrados.length > 0 && (

        <div className="space-y-4">

          {movimientosFiltrados.map((mov) => {

            const cambios =
              obtenerCambios(mov);

            return (

              <div
                key={mov.id_auditoria}
                className="bg-white border border-slate-200 rounded-2xl p-4 md:p-5 shadow-sm"
              >

                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">


                  <div className="min-w-0">

                    <div className="flex flex-wrap items-center gap-2 mb-2">

                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${clasesAccion(
                          mov.accion
                        )}`}
                      >

                        {textoAccion(
                          mov.accion
                        )}

                      </span>


                      <span className="text-xs text-slate-500">

                        Auditoría #{mov.id_auditoria}

                      </span>

                    </div>


                    <h3 className="font-bold text-slate-900 text-lg">

                      {nombreSocio(mov)}

                    </h3>


                    <p className="text-sm text-slate-600 mt-1">

                      ID Socio: <strong>{mov.id_socio}</strong>
                      {' · '}
                      Préstamo No.{' '}
                      <strong>
                        {mov.numero_prestamo_socio ?? '—'}
                      </strong>

                    </p>


                    <p className="text-sm text-slate-500 mt-2">

                      {formatFechaHora(
                        mov.fecha_hora
                      )}

                    </p>


                    <p className="text-sm text-slate-600 mt-1 break-all">

                      Realizado por:{' '}
                      <strong>
                        {mov.usuario_nombre || mov.usuario_ref || '—'}
                      </strong>

                    </p>


                    {mov.motivo && (

                      <p className="text-sm text-slate-600 mt-2">

                        Motivo:{' '}
                        <strong>
                          {mov.motivo}
                        </strong>

                      </p>

                    )}


                    {cambios.length > 0 && (

                      <p className="text-xs text-slate-500 mt-2">

                        {cambios.length}{' '}
                        {cambios.length === 1
                          ? 'campo modificado'
                          : 'campos modificados'}

                      </p>

                    )}

                  </div>


                 <div className="w-full md:w-auto flex flex-col sm:flex-row gap-2">

  <button
    type="button"
    onClick={() =>
      setMovimientoDetalle(mov)
    }
    className="w-full md:w-auto px-5 py-3 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800"
  >

    Ver detalles

  </button>


  {prestamoSigueCancelado(mov) && (

    <button
      type="button"
      onClick={() =>
        abrirRestaurarPrestamo(mov)
      }
      className="w-full md:w-auto px-5 py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700"
    >

      Restaurar préstamo

    </button>

  )}

</div>

                </div>

              </div>

            );

          })}

        </div>

      )}

{/* ====================================================== */}
{/* ============== RESTAURAR PRÉSTAMO ==================== */}
{/* ====================================================== */}

{showRestaurarModal && prestamoRestaurar && (

  <div className="fixed inset-0 bg-black/60 z-[10000] flex items-center justify-center p-3">

    <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden">


      {/* ENCABEZADO */}
      <div className="p-5 border-b border-slate-200">

        <h3 className="text-xl font-bold text-slate-900">

          Restaurar Préstamo No.{' '}
          {prestamoRestaurar.numero_prestamo_socio}

        </h3>


        <p className="text-sm text-slate-500 mt-1">

          {nombreSocio(
            prestamoRestaurar
          )}

        </p>

      </div>


      {/* CUERPO */}
      <div className="p-5 space-y-5">


        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">

          <p className="font-semibold text-emerald-800">

            ¿Está seguro de restaurar este préstamo?

          </p>


          <p className="text-sm text-emerald-700 mt-2">

            El préstamo volverá a formar parte de la operación normal
            y este movimiento quedará registrado en Auditoría.

          </p>

        </div>


        {/* PIN */}
        <div>

          <label className="block text-sm font-semibold text-slate-700 mb-1">

            PIN de administrador *

          </label>


          <input
            type="password"
            inputMode="numeric"
            maxLength={6}
            value={pinRestaurar}
            onChange={(e) => {

              setPinRestaurar(
                e.target.value
                  .replace(/\D/g, '')
                  .slice(0, 6)
              );

              setErrorRestaurar('');

            }}
            placeholder="••••••"
            className="w-full border border-slate-300 rounded-xl px-4 py-3 text-center text-xl tracking-[0.4em]"
          />

        </div>


        {/* MOTIVO */}
        <div>

          <label className="block text-sm font-semibold text-slate-700 mb-1">

            Motivo de la restauración *

          </label>


          <textarea
            rows={4}
            value={motivoRestaurar}
            onChange={(e) => {

              setMotivoRestaurar(
                e.target.value
              );

              setErrorRestaurar('');

            }}
            placeholder="Ejemplo: El socio aceptó finalmente las condiciones del préstamo."
            className="w-full border border-slate-300 rounded-xl px-4 py-3 resize-none"
          />

        </div>


        {/* ERROR */}
        {errorRestaurar && (

          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">

            ⚠ {errorRestaurar}

          </div>

        )}

      </div>


      {/* BOTONES */}
      <div className="p-4 border-t border-slate-200 flex flex-col sm:flex-row gap-3">

        <button
          type="button"
          disabled={restaurando}
          onClick={() => {

            setShowRestaurarModal(false);

            setPrestamoRestaurar(null);

            setPinRestaurar('');

            setMotivoRestaurar('');

            setErrorRestaurar('');

          }}
          className="w-full px-4 py-3 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 disabled:opacity-50"
        >

          No, regresar

        </button>


        <button
          type="button"
          disabled={restaurando}
          onClick={confirmarRestaurarPrestamo}
          className="w-full px-4 py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 disabled:opacity-50"
        >

          {restaurando
            ? 'Restaurando...'
            : 'Sí, restaurar préstamo'}

        </button>

      </div>

    </div>

  </div>

)}

      {/* ================================================= */}
      {/* =============== MODAL DETALLES ================== */}
      {/* ================================================= */}

      {movimientoDetalle && (() => {

        const mov =
          movimientoDetalle;

        const cambios =
          obtenerCambios(mov);

        const corridaAnterior =
          obtenerCorridaAnterior(mov);

        const corridaNueva =
          obtenerCorridaNueva(mov);


        return (

          <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-2 md:p-4">

            <div className="bg-white w-full max-w-6xl max-h-[96vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col">


              {/* CABECERA */}

              <div className="p-4 md:p-6 border-b border-slate-200 flex justify-between items-start gap-3">

                <div>

                  <h3 className="text-xl md:text-2xl font-bold text-slate-900">

                    Detalle de Auditoría

                  </h3>

                  <p className="text-sm text-slate-500 mt-1">

                    Movimiento #{mov.id_auditoria}

                  </p>

                </div>


                <button
                  type="button"
                  onClick={() =>
                    setMovimientoDetalle(null)
                  }
                  className="w-10 h-10 rounded-full bg-red-600 text-white font-bold"
                >

                  ✕

                </button>

              </div>


              {/* CONTENIDO */}

              <div className="p-4 md:p-6 overflow-y-auto space-y-6">


                {/* RESUMEN */}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

                  <Info
                    label="Socio"
                    value={nombreSocio(mov)}
                  />

                  <Info
                    label="ID Socio"
                    value={mov.id_socio}
                  />

                  <Info
                    label="Préstamo"
                    value={`No. ${mov.numero_prestamo_socio ?? '—'}`}
                  />

                  <Info
                    label="Acción"
                    value={textoAccion(mov.accion)}
                  />

                  <Info
                    label="Fecha y hora"
                    value={formatFechaHora(mov.fecha_hora)}
                  />

                  <Info
                    label="Administrador"
                    value={mov.usuario_nombre || mov.usuario_ref}
                  />

                  <Info
                    label="Rol"
                    value={mov.usuario_rol || '—'}
                  />

                  <Info
                    label="Usuario ID"
                    value={mov.usuario_ref || '—'}
                  />

                  <Info
                    label="Correo"
                    value={mov.usuario_correo || '—'}
                  />

                </div>


                {/* MOTIVO */}

                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">

                  <p className="text-xs font-semibold text-blue-700 uppercase">

                    Motivo / Nota

                  </p>

                  <p className="text-slate-900 mt-1">

                    {mov.motivo || 'Sin motivo registrado.'}

                  </p>

                </div>


                {/* CAMBIOS */}

                <div>

                  <h4 className="text-lg font-bold text-slate-900 mb-3">

                    Cambios realizados

                  </h4>


                  {cambios.length === 0 ? (

                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-slate-600">

                      Este movimiento no contiene cambios comparables de corrida.

                    </div>

                  ) : (

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">

                      <table className="w-full min-w-[650px]">

                        <thead className="bg-slate-50">

                          <tr>

                            <th className="text-left px-4 py-3 text-sm">
                              Campo
                            </th>

                            <th className="text-left px-4 py-3 text-sm">
                              Antes
                            </th>

                            <th className="text-left px-4 py-3 text-sm">
                              Después
                            </th>

                          </tr>

                        </thead>

                        <tbody>

                          {cambios.map((campo) => (

                            <tr
                              key={campo.key}
                              className="border-t border-slate-200"
                            >

                              <td className="px-4 py-3 font-medium text-slate-800">

                                {campo.label}

                              </td>

                              <td className="px-4 py-3 text-red-700 bg-red-50/40">

                                {mostrarValor(
                                  campo,
                                  campo.antes
                                )}

                              </td>

                              <td className="px-4 py-3 text-emerald-700 bg-emerald-50/40">

                                {mostrarValor(
                                  campo,
                                  campo.despues
                                )}

                              </td>

                            </tr>

                          ))}

                        </tbody>

                      </table>

                    </div>

                  )}

                </div>


                {/* CORRIDAS */}

                {(corridaAnterior.length > 0 ||
                  corridaNueva.length > 0) && (

                  <div>

                    <h4 className="text-lg font-bold text-slate-900 mb-3">

                      Comparación de corridas

                    </h4>


                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">


                      <CorridaTable
                        titulo="Corrida anterior"
                        datos={corridaAnterior}
                        formatCurrency={formatCurrency}
                      />


                      <CorridaTable
                        titulo="Corrida nueva"
                        datos={corridaNueva}
                        formatCurrency={formatCurrency}
                      />

                    </div>

                  </div>

                )}


                {/* JSON COMPLETO */}

                <details className="border border-slate-200 rounded-xl">

                  <summary className="cursor-pointer p-4 font-semibold text-slate-700">

                    Ver datos técnicos completos

                  </summary>

                  <div className="p-4 border-t border-slate-200 grid grid-cols-1 xl:grid-cols-2 gap-4">

                    <div>

                      <p className="font-semibold mb-2">
                        Antes
                      </p>

                      <pre className="bg-slate-900 text-slate-100 rounded-xl p-4 text-xs overflow-auto max-h-96">

                        {JSON.stringify(
                          mov.datos_anteriores,
                          null,
                          2
                        )}

                      </pre>

                    </div>


                    <div>

                      <p className="font-semibold mb-2">
                        Después
                      </p>

                      <pre className="bg-slate-900 text-slate-100 rounded-xl p-4 text-xs overflow-auto max-h-96">

                        {JSON.stringify(
                          mov.datos_nuevos,
                          null,
                          2
                        )}

                      </pre>

                    </div>

                  </div>

                </details>

              </div>


              {/* PIE */}

              <div className="p-4 border-t border-slate-200">

                <button
                  type="button"
                  onClick={() =>
                    setMovimientoDetalle(null)
                  }
                  className="w-full md:w-auto px-6 py-3 bg-slate-900 text-white rounded-xl font-medium"
                >

                  Cerrar

                </button>

              </div>

            </div>

          </div>

        );

      })()}

    </div>

  );

};


// ======================================================
// ================= COMPONENTE INFO =====================
// ======================================================

const Info = ({
  label,
  value,
}) => (

  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">

    <p className="text-xs text-slate-500 uppercase">
      {label}
    </p>

    <p className="font-semibold text-slate-900 mt-1 break-words">
      {value ?? '—'}
    </p>

  </div>

);


// ======================================================
// ================= TABLA CORRIDA =======================
// ======================================================

const CorridaTable = ({
  titulo,
  datos,
  formatCurrency,
}) => (

  <div className="border border-slate-200 rounded-xl overflow-hidden">

    <div className="bg-slate-50 p-3 font-semibold text-slate-800">

      {titulo}

    </div>


    {datos.length === 0 ? (

      <p className="p-4 text-sm text-slate-500">

        Sin información.

      </p>

    ) : (

      <div className="overflow-x-auto">

        <table className="w-full min-w-[480px] text-sm">

          <thead>

            <tr className="border-b border-slate-200">

              <th className="text-left px-3 py-2">
                No.
              </th>

              <th className="text-left px-3 py-2">
                Fecha
              </th>

              <th className="text-left px-3 py-2">
                Monto
              </th>

              <th className="text-left px-3 py-2">
                Estatus
              </th>

            </tr>

          </thead>

          <tbody>

            {datos.map((pago, index) => (

              <tr
                key={
                  pago.id_pago ||
                  `${pago.numero_pago}-${index}`
                }
                className="border-b border-slate-100"
              >

                <td className="px-3 py-2">
                  {pago.numero_pago ?? index + 1}
                </td>

                <td className="px-3 py-2">
                  {pago.fecha_programada || '—'}
                </td>

                <td className="px-3 py-2">
                  {formatCurrency(pago.monto_pago)}
                </td>

                <td className="px-3 py-2">
                  {pago.estatus || '—'}
                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

    )}

  </div>

);


export default AuditoriaPrestamosModule;
