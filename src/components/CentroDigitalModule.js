// src/components/CentroDigitalModule.js
import React, { useMemo, useState, useEffect, useRef } from 'react';

const SUPABASE_URL = 'https://ubfkhtkmlvutwdivmoff.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InViZmtodGttbHZ1dHdkaXZtb2ZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4MTc5NTUsImV4cCI6MjA2NjM5Mzk1NX0.c0iRma-dnlL29OR3ffq34nmZuj_ViApBTMG-6PEX_B4';

// ====== utilidades ======
const headersJSON = () => ({
  'Content-Type': 'application/json',
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
});

const headersSB = {
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
};

const BUCKET_FONDO = 'fondo-documentos';

// Quita acentos, espacios dobles y caracteres problemáticos en keys del Storage.
function slugifyFilename(name) {
  const map = {
    á:'a', é:'e', í:'i', ó:'o', ú:'u', ü:'u', ñ:'n',
    Á:'A', É:'E', Í:'I', Ó:'O', Ú:'U', Ü:'U', Ñ:'N'
  };
  const cleaned = name
    .replace(/[áéíóúüñÁÉÍÓÚÜÑ]/g, m => map[m] || m)
    .replace(/[^\w.\- ()[\]]/g, '-') // permite letras, números, _, -, ., espacios y ()[]
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned;
}

// Dado un file, construye una ruta ordenada por fecha para el bucket
function buildObjectKey(file) {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const ts = Date.now();
  const safeName = slugifyFilename(file.name);
  // Carpeta por año/mes/día
  return `${yyyy}/${mm}/${dd}/${ts}_${safeName}`;
}

// SOLO previsualizables en navegador
function isPreviewable(name = '') {
  const n = name.toLowerCase();
  return (
    n.endsWith('.pdf') ||
    n.endsWith('.png') ||
    n.endsWith('.jpg') ||
    n.endsWith('.jpeg') ||
    n.endsWith('.gif') ||
    n.endsWith('.webp')
  );
}

function formatBytes(b) {
  if (!b && b !== 0) return '-';
  const units = ['B','KB','MB','GB','TB'];
  let i = 0; let v = b;
  while (v >= 1024 && i < units.length - 1) { v /= 1024; i++; }
  return `${v.toFixed(1)} ${units[i]}`;
}

function formatFechaCorta(iso) {
  if (!iso) return '-';
  const d = new Date(iso);
  return d.toLocaleString('es-MX', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

// === Helper: BORRAR objeto en Storage vía REST ===
async function borrarObjetoStorage({ bucketId, keyOrPublicUrl }) {
  if (!bucketId || !keyOrPublicUrl) throw new Error('bucketId y keyOrPublicUrl son requeridos');

  let objectKey = keyOrPublicUrl;
  const marker = `/storage/v1/object/public/${bucketId}/`;
  const idx = keyOrPublicUrl.indexOf(marker);
  if (idx !== -1) {
    objectKey = decodeURIComponent(keyOrPublicUrl.substring(idx + marker.length));
  }
  const url = `${SUPABASE_URL}/storage/v1/object/${bucketId}/${encodeURIComponent(objectKey)}`;
  const resp = await fetch(url, { method: 'DELETE', headers: headersSB });
  if (!resp.ok) {
    let msg = `${resp.status} ${resp.statusText}`;
    try { const j = await resp.json(); if (j?.message) msg = j.message; } catch {}
    throw new Error(`No se pudo borrar "${objectKey}": ${msg}`);
  }
}

const CentroDigitalModule = () => {
  // --- búsqueda y selección de socio ---
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedSocio, setSelectedSocio] = useState(null);

  // --- listado de documentos consultados de un socio (SECCIÓN EXISTENTE) ---
  const [docsLoading, setDocsLoading] = useState(false);
  const [docsError, setDocsError] = useState('');
  const [documentosSocio, setDocumentosSocio] = useState([]);
  const [fotoUrlSocio, setFotoUrlSocio] = useState('');

  // --- modal subida (SECCIÓN EXISTENTE) ---
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const authHeaders = useMemo(() => headersJSON(), []);

  // ====== NUEVA SECCIÓN: "Documentos y contratos del Fondo" ======
  const [fondoFiles, setFondoFiles] = useState([]); // [{ name, id?, updated_at, created_at, metadata:{size, ...} }]
  const [fondoLoading, setFondoLoading] = useState(false);
  const [fondoError, setFondoError] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const dropZoneRef = useRef(null);

  // ====================== Funciones EXISTENTES (no tocar lógica previa) ======================
  const handleSearch = async (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    setSelectedSocio(null);
    setDocumentosSocio([]);
    setFotoUrlSocio('');
    setDocsError('');

    if (!term || term.trim().length < 1) {
      setSearchResults([]);
      return;
    }

    try {
      const resp = await fetch(
        `${SUPABASE_URL}/rest/v1/socios?select=id_socio,nombre,apellido_paterno,apellido_materno`,
        { headers: authHeaders }
      );
      if (!resp.ok) throw new Error('No se pudieron buscar socios');
      const all = await resp.json();

      const lower = term.toLowerCase();
      const filtered = all.filter(
        (s) =>
          s.id_socio.toString().includes(lower) ||
          `${s.nombre} ${s.apellido_paterno} ${s.apellido_materno}`
            .toLowerCase()
            .includes(lower)
      );
      setSearchResults(filtered.slice(0, 10));
    } catch {
      setSearchResults([]);
    }
  };

  const handleSelectSocio = (socio) => {
    setSelectedSocio(socio);
    setSearchTerm(`ID: ${socio.id_socio} — ${socio.nombre} ${socio.apellido_paterno} ${socio.apellido_materno}`);
    setSearchResults([]);
    setDocumentosSocio([]);
    setFotoUrlSocio('');
    setDocsError('');
  };

  const consultarDocumentacion = async () => {
    if (!selectedSocio) return;
    setDocsLoading(true);
    setDocsError('');
    setDocumentosSocio([]);
    setFotoUrlSocio('');

    try {
      // Foto
      const socioResp = await fetch(
        `${SUPABASE_URL}/rest/v1/socios?id_socio=eq.${selectedSocio.id_socio}&select=foto_url`,
        { headers: authHeaders }
      );
      if (!socioResp.ok) {
        const e = await socioResp.json();
        throw new Error(e.message || 'Error consultando socio');
      }
      const socioJson = await socioResp.json();
      setFotoUrlSocio(socioJson?.[0]?.foto_url || '');

      // Documentos
      const resp = await fetch(
        `${SUPABASE_URL}/rest/v1/documentos_socios?id_socio=eq.${selectedSocio.id_socio}&order=fecha_subida.desc&select=id_documento,tipo_documento,nombre_documento,url_documento,fecha_subida`,
        { headers: authHeaders }
      );
      if (!resp.ok) {
        const e = await resp.json();
        throw new Error(e.message || 'Error consultando documentos');
      }
      const docs = await resp.json();
      setDocumentosSocio(docs);
    } catch (err) {
      setDocsError(err.message || 'Ocurrió un error al consultar la documentación.');
    } finally {
      setDocsLoading(false);
    }
  };

  const subirArchivoSocio = async (file, tipo) => {
    setUploadError('');
    if (!selectedSocio) {
      setUploadError('Selecciona primero un socio.');
      return;
    }
    try {
      const isImage = file.type === 'image/png' || file.type === 'image/jpeg';
      const isPdf = file.type === 'application/pdf';

      if (tipo === 'foto' && !isImage) throw new Error('La foto debe ser JPG o PNG');
      if (tipo !== 'foto' && !isPdf) throw new Error('Los documentos deben ser PDF');

      let bucket = '';
      let path = '';
      if (tipo === 'foto') {
        bucket = 'fotos-socios';
        path = `socio_${selectedSocio.id_socio}/${Date.now()}_${slugifyFilename(file.name)}`;
      } else if (tipo === 'ine' || tipo === 'comprobante') {
        bucket = 'documentos-socios';
        path = `socio_${selectedSocio.id_socio}/${tipo}_${Date.now()}_${slugifyFilename(file.name)}`;
      } else {
        bucket = 'avales-y-varios';
        path = `socio_${selectedSocio.id_socio}/${Date.now()}_${slugifyFilename(file.name)}`;
      }

      const uploadResp = await fetch(
        `${SUPABASE_URL}/storage/v1/object/${bucket}/${encodeURIComponent(path)}`,
        {
          method: 'POST',
          headers: { ...headersSB, 'x-upsert': 'true' },
          body: file,
        }
      );
      if (!uploadResp.ok) {
        const e = await uploadResp.json().catch(() => ({}));
        throw new Error(`Error subiendo a Storage: ${uploadResp.status} ${e.message || ''}`);
      }

      const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${encodeURIComponent(path)}`;

      if (tipo === 'foto') {
        const patch = await fetch(
          `${SUPABASE_URL}/rest/v1/socios?id_socio=eq.${selectedSocio.id_socio}`,
          {
            method: 'PATCH',
            headers: { ...authHeaders, Prefer: 'return=representation' },
            body: JSON.stringify({ foto_url: publicUrl }),
          }
        );
        if (!patch.ok) {
          const e = await patch.json().catch(() => ({}));
          throw new Error(`No se pudo actualizar la foto del socio: ${e.message || patch.statusText}`);
        }
        setFotoUrlSocio(publicUrl);
      } else {
        const ins = await fetch(`${SUPABASE_URL}/rest/v1/documentos_socios`, {
          method: 'POST',
          headers: { ...authHeaders, Prefer: 'return=representation' },
          body: JSON.stringify({
            id_socio: selectedSocio.id_socio,
            tipo_documento: tipo,
            nombre_documento: file.name,
            url_documento: publicUrl,
            fecha_subida: new Date().toISOString(),
          }),
        });
        if (!ins.ok) {
          const e = await ins.json().catch(() => ({}));
          throw new Error(`No se pudo registrar el documento: ${ins.status} ${e.message || ''}`);
        }
        consultarDocumentacion();
      }
    } catch (err) {
      setUploadError(err.message || 'Error desconocido al subir.');
    }
  };

  // ====================== NUEVA SECCIÓN: Fondo (bucket global) ======================

  // Listar archivos del bucket con POST /object/list/{bucket}
  const listarFondoDocumentos = async () => {
    setFondoLoading(true);
    setFondoError('');
    setSelectedFile(null);
    try {
      const resp = await fetch(
        `${SUPABASE_URL}/storage/v1/object/list/${BUCKET_FONDO}`,
        {
          method: 'POST',
          headers: headersJSON(),
          body: JSON.stringify({
            prefix: '', // raíz
            limit: 1000,
            offset: 0,
            sortBy: { column: 'updated_at', order: 'desc' },
          }),
        }
      );
      if (!resp.ok) {
        const e = await resp.json().catch(() => ({}));
        throw new Error(e.message || `Error al listar: ${resp.statusText}`);
      }
      const files = await resp.json(); // array
      const onlyFiles = (files || []).filter((x) => !!x.name && !x.id?.endsWith('/'));
      setFondoFiles(onlyFiles);
    } catch (e) {
      setFondoError(e.message || 'No se pudieron listar los archivos del fondo.');
      setFondoFiles([]);
    } finally {
      setFondoLoading(false);
    }
  };

  useEffect(() => {
    listarFondoDocumentos();
  }, []);

  // Subir uno o varios archivos al bucket del fondo
  const subirFondoArchivos = async (fileList) => {
    const files = Array.from(fileList || []);
    if (!files.length) return;

    for (const file of files) {
      try {
        const key = buildObjectKey(file);
        const resp = await fetch(
          `${SUPABASE_URL}/storage/v1/object/${BUCKET_FONDO}/${encodeURIComponent(key)}`,
          {
            method: 'POST',
            headers: { ...headersSB, 'x-upsert': 'true' },
            body: file,
          }
        );
        if (!resp.ok) {
          const j = await resp.json().catch(() => ({}));
          throw new Error(`Error subiendo "${file.name}": ${j?.message || resp.statusText}`);
        }
      } catch (e) {
        alert(e.message);
      }
    }
    await listarFondoDocumentos();
  };

  // Drag & drop handlers
  const onDropOver = (e) => {
    e.preventDefault();
    dropZoneRef.current?.classList.add('ring-2', 'ring-blue-500');
  };
  const onDropLeave = () => {
    dropZoneRef.current?.classList.remove('ring-2', 'ring-blue-500');
  };
  const onDrop = async (e) => {
    e.preventDefault();
    dropZoneRef.current?.classList.remove('ring-2', 'ring-blue-500');
    await subirFondoArchivos(e.dataTransfer.files);
  };

  // Eliminar archivo seleccionado
  const confirmarBorrado = async () => {
    if (!selectedFile) return;
    try {
      await borrarObjetoStorage({
        bucketId: BUCKET_FONDO,
        keyOrPublicUrl: selectedFile.name, // pasamos la key (name) directa
      });
      setShowConfirmDelete(false);
      setSelectedFile(null);
      await listarFondoDocumentos();
    } catch (e) {
      alert(e.message || 'No se pudo borrar el archivo.');
    }
  };

  // Construir URL pública de un objeto
  const publicUrlFor = (name) =>
    `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_FONDO}/${encodeURIComponent(name)}`;

  // ====================== UI ======================
  return (
    <div className="p-6 space-y-6">
      {/* ======= SECCIÓN EXISTENTE: Centro Digital (Socios) ======= */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Centro Digital</h2>
        <p className="text-slate-600">Cargar información del socio y consultar documentación</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        {/* Búsqueda + acciones */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Buscar ID de socio o Nombre completo
          </label>
          <input
            value={searchTerm}
            onChange={handleSearch}
            placeholder="Ej. 12 o 'Juan Pérez'"
            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {/* Sugerencias */}
          {searchResults.length > 0 && (
            <div className="mt-2 max-h-56 overflow-auto rounded-xl border border-slate-200 bg-white">
              {searchResults.map((s) => (
                <button
                  key={s.id_socio}
                  onClick={() => handleSelectSocio(s)}
                  className="w-full text-left px-4 py-2 hover:bg-slate-50"
                >
                  ID: {s.id_socio} — {s.nombre} {s.apellido_paterno} {s.apellido_materno}
                </button>
              ))}
            </div>
          )}

          <div className="flex items-center gap-3 mt-3">
            <button
              className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-medium disabled:opacity-50"
              disabled={!selectedSocio}
              onClick={() => setShowUploadModal(true)}
            >
              Subir
            </button>
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
              disabled={!selectedSocio}
              onClick={consultarDocumentacion}
            >
              Consultar documentación del socio
            </button>
            {selectedSocio && (
              <span className="text-sm text-slate-500">
                Seleccionado: <strong>
                  ID {selectedSocio.id_socio} — {selectedSocio.nombre} {selectedSocio.apellido_paterno}
                </strong>
              </span>
            )}
          </div>
        </div>

        {/* Resultado de consulta */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 mt-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Documentación del socio</h3>

          {docsLoading && <p className="text-slate-600">Cargando documentos...</p>}
          {docsError && <p className="text-red-600">{docsError}</p>}

          {!docsLoading && !docsError && !selectedSocio && (
            <p className="text-slate-500">Selecciona un socio y pulsa “Consultar documentación del socio”.</p>
          )}

          {!docsLoading && !docsError && selectedSocio && documentosSocio.length === 0 && !fotoUrlSocio && (
            <p className="text-slate-500">Este socio aún no tiene documentos registrados.</p>
          )}

          {!docsLoading && !docsError && (fotoUrlSocio || documentosSocio.length > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Foto del socio */}
              {fotoUrlSocio && (
                <div className="border border-slate-200 rounded-xl p-4">
                  <div className="flex items-center mb-3">
                    <div className="w-10 h-10 bg-slate-100 rounded-lg overflow-hidden mr-3">
                      <img src={fotoUrlSocio} alt="Foto del socio" className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <h4 className="font-medium text-slate-900">Foto del socio</h4>
                      <p className="text-xs text-slate-500">Vista rápida</p>
                    </div>
                  </div>
                  <a
                    href={fotoUrlSocio}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center px-3 py-1.5 text-sm rounded-lg bg-slate-100 hover:bg-slate-200"
                  >
                    Abrir imagen
                  </a>
                </div>
              )}

              {/* Documentos */}
              {documentosSocio.map((doc) => (
                <div key={doc.id_documento} className="border border-slate-200 rounded-xl p-4 hover:shadow-sm">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-slate-900">{doc.nombre_documento || 'Documento'}</h4>
                      <p className="text-xs text-slate-500">
                        Tipo: <span className="uppercase">{doc.tipo_documento}</span> • Subido: {formatFechaCorta(doc.fecha_subida)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href={doc.url_documento}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                    >
                      Abrir
                    </a>
                    <a
                      href={doc.url_documento}
                      download
                      className="px-3 py-1.5 text-sm rounded-lg bg-slate-100 hover:bg-slate-200"
                    >
                      Descargar
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal subir archivos (SECCIÓN EXISTENTE de socios) */}
      {showUploadModal && selectedSocio && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                Subir archivos — ID {selectedSocio.id_socio} — {selectedSocio.nombre} {selectedSocio.apellido_paterno}
              </h3>
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setUploadError('');
                }}
                className="text-slate-600 hover:text-slate-900"
              >
                Cerrar
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Foto */}
              <div className="border-2 border-dashed rounded-xl p-4 text-center">
                <h4 className="font-medium mb-2">Foto del socio</h4>
                <p className="text-xs text-slate-500 mb-3">JPG o PNG</p>
                <label className="inline-block px-4 py-2 bg-slate-100 rounded-lg cursor-pointer hover:bg-slate-200">
                  Elegir archivo
                  <input
                    type="file"
                    accept="image/png,image/jpeg"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) subirArchivoSocio(file, 'foto');
                    }}
                  />
                </label>
              </div>

              {/* INE */}
              <div className="border-2 border-dashed rounded-xl p-4 text-center">
                <h4 className="font-medium mb-2">INE (PDF)</h4>
                <p className="text-xs text-slate-500 mb-3">Solo PDF</p>
                <label className="inline-block px-4 py-2 bg-slate-100 rounded-lg cursor-pointer hover:bg-slate-200">
                  Elegir archivo
                  <input
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) subirArchivoSocio(file, 'ine');
                    }}
                  />
                </label>
              </div>

              {/* Comprobante */}
              <div className="border-2 border-dashed rounded-xl p-4 text-center">
                <h4 className="font-medium mb-2">Comprobante de domicilio (PDF)</h4>
                <p className="text-xs text-slate-500 mb-3">Solo PDF</p>
                <label className="inline-block px-4 py-2 bg-slate-100 rounded-lg cursor-pointer hover:bg-slate-200">
                  Elegir archivo
                  <input
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) subirArchivoSocio(file, 'comprobante');
                    }}
                  />
                </label>
              </div>

              {/* Varios */}
              <div className="border-2 border-dashed rounded-xl p-4 text-center">
                <h4 className="font-medium mb-2">Avales y varios (PDF)</h4>
                <p className="text-xs text-slate-500 mb-3">Puedes subir varios PDFs</p>
                <label className="inline-block px-4 py-2 bg-slate-100 rounded-lg cursor-pointer hover:bg-slate-200">
                  Elegir archivos
                  <input
                    type="file"
                    accept="application/pdf"
                    multiple
                    className="hidden"
                    onChange={async (e) => {
                      const files = Array.from(e.target.files || []);
                      for (const f of files) {
                        await subirArchivoSocio(f, 'varios');
                      }
                    }}
                  />
                </label>
              </div>
            </div>

            {uploadError && <p className="text-red-600 mt-4">Error: {uploadError}</p>}
          </div>
        </div>
      )}

      {/* ======= NUEVA SECCIÓN: Documentos y contratos del Fondo ======= */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h3 className="text-xl font-semibold text-slate-900 mb-1">Documentos y contratos del Fondo</h3>
        <p className="text-slate-600 mb-4">
          Sube imágenes, PDFs, Word, Excel, PowerPoint, TXT, CSV, ZIP. A la derecha verás el explorador de archivos.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Subida (drag & drop + botón) */}
          <div
            ref={dropZoneRef}
            onDragOver={onDropOver}
            onDragLeave={onDropLeave}
            onDrop={onDrop}
            className="border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center bg-slate-50"
          >
            <div className="text-5xl mb-3">⬆️</div>
            <p className="text-slate-700 font-medium">Arrastra y suelta tus archivos aquí</p>
            <p className="text-sm text-slate-500 mb-4">o</p>
            <label className="inline-block px-4 py-2 bg-slate-800 text-white rounded-lg cursor-pointer hover:bg-slate-900">
              Seleccionar archivos
              <input
                type="file"
                multiple
                className="hidden"
                onChange={(e) => subirFondoArchivos(e.target.files)}
                accept="
                  image/*,
                  application/pdf,
                  application/msword,
                  application/vnd.openxmlformats-officedocument.wordprocessingml.document,
                  application/vnd.ms-excel,
                  application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,
                  application/vnd.ms-powerpoint,
                  application/vnd.openxmlformats-officedocument.presentationml.presentation,
                  text/plain,
                  text/csv,
                  application/zip,
                  application/x-zip-compressed
                "
              />
            </label>

            {fondoError && <p className="text-red-600 mt-4">{fondoError}</p>}
          </div>

          {/* Explorador */}
          <div className="border border-slate-200 rounded-2xl p-4 max-h-[460px] overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-slate-900">Archivos del fondo</h4>
              <button
                onClick={listarFondoDocumentos}
                className="px-3 py-1.5 text-sm rounded-lg bg-slate-100 hover:bg-slate-200"
              >
                Actualizar
              </button>
            </div>

            {fondoLoading && <p className="text-slate-600">Cargando...</p>}
            {!fondoLoading && fondoFiles.length === 0 && (
              <p className="text-slate-500">Aún no hay archivos.</p>
            )}

            {!fondoLoading && fondoFiles.length > 0 && (
              <div className="space-y-2">
                {fondoFiles.map((f) => {
                  const url = publicUrlFor(f.name);
                  const size = f?.metadata?.size;
                  const previewable = isPreviewable(f.name);
                  return (
                    <div
                      key={f.id || f.name}
                      className={`p-3 rounded-xl border flex items-center justify-between ${selectedFile?.name === f.name ? 'bg-blue-50 border-blue-200' : 'bg-white border-slate-200 hover:bg-slate-50'}`}
                      onClick={() => setSelectedFile(f)}
                    >
                      <div className="min-w-0">
                        <div className="font-medium text-slate-900 truncate">{f.name.split('/').slice(-1)[0]}</div>
                        <div className="text-xs text-slate-500">
                          {formatFechaCorta(f.updated_at || f.created_at)} • {size ? formatBytes(size) : '-'}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                        {/* Solo mostrar "Abrir" si es previsualizable en navegador */}
                        {previewable && (
                          <a
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                            className="px-3 py-1.5 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                            onClick={(e) => e.stopPropagation()}
                          >
                            Abrir
                          </a>
                        )}
                        <a
                          href={url}
                          download
                          className="px-3 py-1.5 text-sm rounded-lg bg-slate-100 hover:bg-slate-200"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Descargar
                        </a>
                        <button
                          className="px-3 py-1.5 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700"
                          onClick={(e) => { e.stopPropagation(); setSelectedFile(f); setShowConfirmDelete(true); }}
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirmación de borrado */}
      {showConfirmDelete && selectedFile && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold mb-2">Confirmar eliminación</h3>
            <p className="text-slate-700">
              ¿Está seguro que desea borrar el archivo<br />
              <span className="font-medium">{selectedFile.name.split('/').slice(-1)[0]}</span>?
            </p>
            <div className="flex justify-end gap-2 mt-5">
              <button
                onClick={() => setShowConfirmDelete(false)}
                className="px-4 py-2 rounded-lg bg-slate-100"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarBorrado}
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
              >
                Aceptar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CentroDigitalModule;
