import React, {
  useEffect,
  useRef,
  useState,
} from 'react';

const CameraCaptureModal = ({
  open,
  onClose,
  onCapture,
  title = 'Tomar fotografía',
}) => {
  const [cameraError, setCameraError] =
    useState('');

  const [cameraStarting, setCameraStarting] =
    useState(false);

  const [cameraFacingMode, setCameraFacingMode] =
    useState('user');

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const cameraStreamRef = useRef(null);

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

      let stream = null;

      try {
        stream =
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
                ideal: 720,
              },
            },
          });
      } catch (primerError) {
        console.warn(
          'Primer intento de cámara falló:',
          primerError
        );
      }

      if (!stream) {
        stream =
          await navigator.mediaDevices.getUserMedia({
            audio: false,
            video: true,
          });
      }

      cameraStreamRef.current = stream;

      const video = videoRef.current;

      if (!video) {
        throw new Error(
          'No se encontró el visor de la cámara.'
        );
      }

      video.srcObject = stream;

      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(
            new Error(
              'La cámara tardó demasiado en iniciar.'
            )
          );
        }, 12000);

        video.onloadedmetadata = () => {
          clearTimeout(timeout);
          resolve();
        };

        video.onerror = () => {
          clearTimeout(timeout);

          reject(
            new Error(
              'No se pudo mostrar la imagen de la cámara.'
            )
          );
        };
      });

      await video.play();
    } catch (errorCamara) {
      detenerCamara();

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
          'El permiso de la cámara fue rechazado. Autorice el acceso desde el navegador o la aplicación.';
      } else if (
        errorCamara?.name ===
        'NotFoundError'
      ) {
        mensaje =
          'No se encontró ninguna cámara disponible.';
      } else if (
        errorCamara?.name ===
          'NotReadableError' ||
        String(errorCamara?.message || '')
          .toLowerCase()
          .includes('video source')
      ) {
        mensaje =
          'La cámara no pudo iniciar. Cierre cualquier programa que esté usando la cámara y vuelva a intentarlo.';
      } else if (
        errorCamara?.name ===
        'OverconstrainedError'
      ) {
        mensaje =
          'La cámara no admite la configuración solicitada.';
      } else if (errorCamara?.message) {
        mensaje = errorCamara.message;
      }

      setCameraError(mensaje);
    } finally {
      setCameraStarting(false);
    }
  };

  const cerrarCamara = () => {
    detenerCamara();
    setCameraError('');
    setCameraStarting(false);

    onClose?.();
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
        'La cámara todavía está iniciando. Espere un momento.'
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

    context.save();

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

    context.restore();

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
          `foto_${Date.now()}.jpg`,
          {
            type: 'image/jpeg',
          }
        );

        detenerCamara();

        onCapture?.(archivoFoto);
      },
      'image/jpeg',
      0.85
    );
  };

  useEffect(() => {
    if (!open) {
      detenerCamara();
      return;
    }

    setCameraError('');
    setCameraFacingMode('user');

    const timer = setTimeout(() => {
      iniciarCamara('user');
    }, 200);

    document.body.style.overflow = 'hidden';

    return () => {
      clearTimeout(timer);
      detenerCamara();
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/70 z-[10000] flex items-center justify-center p-2 md:p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[96vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between gap-3 p-4 border-b border-slate-200">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              {title}
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

        <canvas
          ref={canvasRef}
          className="hidden"
        />

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
  );
};

export default CameraCaptureModal;
