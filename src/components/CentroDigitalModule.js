// src/components/CentroDigitalModule.js
import React, { useMemo, useState } from 'react';

const SUPABASE_URL = 'https://ubfkhtkmlvutwdivmoff.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InViZmtodGttbHZ1dHdkaXZtb2ZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4MTc5NTUsImV4cCI6MjA2NjM5Mzk1NX0.c0iRma-dnlL29OR3ffq34nmZuj_ViApBTMG-6PEX_B4';

const CentroDigitalModule = () => {
  // --- búsqueda y selección de socio ---
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedSocio, setSelectedSocio] = useState(null);

  // --- listado de documentos consultados ---
  const [docsLoading, setDocsLoading] = useState(false);
  const [docsError, setDocsError] = useState('');
  const [documentosSocio, setDocumentosSocio] = useState([]);
  const [fotoUrlSocio, setFotoUrlSocio] = useState('');

  // --- modal subida ---
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const authHeaders = useMemo(
    () => ({
      'Content-Type': 'application/json',
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    }),
    []
  );

  const formatFechaCorta = (iso) => {
    if (!iso) return '-';
    const d = new Date(iso);
    return d.toLocaleString('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // -------------------------------------------------------
  // Búsqueda de socios (sugerencias)
  // -------------------------------------------------------
  const handleSearch = async (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    setSelectedSocio(null);
    // limpiar documentos mostrados del socio anterior
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
    // limpiar resultados previos
    setDocumentosSocio([]);
    setFotoUrlSocio('');
    setDocsError('');
  };

  // -------------------------------------------------------
  // Consultar documentación del socio seleccionado
  // -------------------------------------------------------
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

  // -------------------------------------------------------
  // Subida a Storage y registro en DB
  // -------------------------------------------------------
  const subirArchivo = async (file, tipo) => {
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

      // Ruta destino por bucket
      let bucket = '';
      let path = '';
      if (tipo === 'foto') {
        bucket = 'fotos-socios';
        path = `socio_${selectedSocio.id_socio}/${Date.now()}_${file.name}`;
      } else if (tipo === 'ine' || tipo === 'comprobante') {
        bucket = 'documentos-socios';
        path = `socio_${selectedSocio.id_socio}/${tipo}_${Date.now()}_${file.name}`;
      } else {
        bucket = 'avales-y-varios';
        path = `socio_${selectedSocio.id_socio}/${Date.now()}_${file.name}`;
      }

      // Subir a Storage
      const uploadResp = await fetch(
        `${SUPABASE_URL}/storage/v1/object/${bucket}/${encodeURIComponent(path)}`,
        {
          method: 'POST',
          headers: {
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
            'x-upsert': 'true',
          },
          body: file,
        }
      );
      if (!uploadResp.ok) {
        const e = await uploadResp.json().catch(() => ({}));
        throw new Error(`Error subiendo a Storage: ${uploadResp.status} ${e.message || ''}`);
      }

      // URL pública
      const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${encodeURIComponent(
        path
      )}`;

      if (tipo === 'foto') {
        // Guardar url en tabla socios
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
        // Registrar metadatos en documentos_socios
        const ins = await fetch(`${SUPABASE_URL}/rest/v1/documentos_socios`, {
          method: 'POST',
          headers: { ...authHeaders, Prefer: 'return=representation' },
          body: JSON.stringify({
            id_socio: selectedSocio.id_socio,
            tipo_documento: tipo, // 'ine' | 'comprobante' | 'varios'
            nombre_documento: file.name,
            url_documento: publicUrl,
            fecha_subida: new Date().toISOString(),
          }),
        });
        if (!ins.ok) {
          const e = await ins.json().catch(() => ({}));
          throw new Error(`No se pudo registrar el documento: ${ins.status} ${e.message || ''}`);
        }
        // actualizar lista si estamos viendo este socio
        consultarDocumentacion();
      }
    } catch (err) {
      setUploadError(err.message || 'Error desconocido al subir.');
    }
  };

  // -------------------------------------------------------
  // UI (solo Documentos)
  // -------------------------------------------------------
  return (
    <div className="p-6 space-y-6">
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

      {/* Modal subir archivos */}
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
                      if (file) subirArchivo(file, 'foto');
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
                      if (file) subirArchivo(file, 'ine');
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
                      if (file) subirArchivo(file, 'comprobante');
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
                        await subirArchivo(f, 'varios');
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
    </div>
  );
};

export default CentroDigitalModule;

