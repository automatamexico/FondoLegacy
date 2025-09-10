import React, { useEffect, useMemo, useState } from 'react';

const SUPABASE_URL = 'https://ubfkhtkmlvutwdivmoff.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InViZmtodGttbHZ1dHdkaXZtb2ZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4MTc5NTUsImV4cCI6MjA2NjM5Mzk1NX0.c0iRma-dnlL29OR3ffq34nmZuj_ViApBTMG-6PEX_B4';

/* Utilidades */
const fmtDate = (d) => {
  const dt = new Date(d);
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  const day = String(dt.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};
const todayStr = fmtDate(new Date());
const money = (n) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(Number(n || 0));

/* Config de buckets/carpetas (usa exactamente estos nombres) */
const BUCKET_FOTOS = 'fotos-socios';
const BUCKET_DOCS  = 'documentos-socios';
const BUCKET_AVAL  = 'Avales y Varios'; // con espacio; se codifica para la URL

/* Subida a Supabase Storage usando REST */
async function uploadToStorage({ bucket, path, file }) {
  const bucketEncoded = encodeURIComponent(bucket);
  // mantenemos las barras del path
  const pathEncoded = encodeURIComponent(path).replace(/%2F/g, '/');

  const res = await fetch(
    `${SUPABASE_URL}/storage/v1/object/${bucketEncoded}/${pathEncoded}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': file.type || 'application/octet-stream',
        'x-upsert': 'true',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: file
    }
  );
  if (!res.ok) {
    const t = await res.text().catch(() => '');
    throw new Error(`Error subiendo a Storage: ${res.status} ${t}`);
  }

  // URL pública (asumiendo bucket con política pública)
  const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${bucketEncoded}/${pathEncoded}`;
  return { publicUrl };
}

/* Registrar documento en tabla documentos_socios */
async function registrarDocumento({ id_socio, tipo, nombre, url }) {
  const body = {
    id_socio,
    tipo_documento: tipo,              // 'INE' | 'Comprobante' | 'Varios'
    nombre_documento: nombre,
    url_documento: url,
    fecha_subida: todayStr
  };
  const r = await fetch(`${SUPABASE_URL}/rest/v1/documentos_socios`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(body)
  });
  if (!r.ok) {
    const j = await r.json().catch(() => ({}));
    throw new Error(`No se pudo registrar el documento: ${r.status} ${j.message || ''}`);
  }
  return (await r.json())[0];
}

/* Actualizar foto_url del socio */
async function actualizarFotoSocio({ id_socio, url }) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/socios?id_socio=eq.${id_socio}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
    },
    body: JSON.stringify({ foto_url: url })
  });
  if (!r.ok) {
    const j = await r.json().catch(() => ({}));
    throw new Error(`No se pudo guardar la foto en el socio: ${r.status} ${j.message || ''}`);
  }
}

const DropBox = ({ title, accept, multiple=false, onFiles, hint }) => {
  const [drag, setDrag] = useState(false);
  const inputId = useMemo(() => `in-${Math.random().toString(36).slice(2)}`, []);

  const onDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDrag(false);
    const files = Array.from(e.dataTransfer.files || []);
    if (files.length) onFiles(files);
  };

  return (
    <div
      onDragOver={(e)=>{e.preventDefault(); setDrag(true);}}
      onDragLeave={()=>setDrag(false)}
      onDrop={onDrop}
      className={`border-2 border-dashed rounded-xl p-4 text-center transition ${drag ? 'border-blue-500 bg-blue-50' : 'border-slate-300'}`}
    >
      <p className="font-medium mb-2">{title}</p>
      <p className="text-sm text-slate-500 mb-3">{hint || 'Arrastra y suelta aquí o haz clic'}</p>
      <label htmlFor={inputId} className="px-3 py-1.5 bg-slate-800 text-white rounded-lg cursor-pointer inline-block">
        Elegir archivo{multiple ? 's' : ''}
      </label>
      <input id={inputId} type="file" className="hidden" accept={accept} multiple={multiple}
             onChange={(e)=> onFiles(Array.from(e.target.files || []))}/>
    </div>
  );
};

const CentroDigitalModule = ({ idSocio }) => {
  const [socios, setSocios] = useState([]);
  const [term, setTerm] = useState('');
  const [selSocio, setSelSocio] = useState(null);

  const [docs, setDocs] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [uploadMsg, setUploadMsg] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    // precarga lista de socios para búsqueda local
    fetch(`${SUPABASE_URL}/rest/v1/socios?select=id_socio,nombre,apellido_paterno,apellido_materno,foto_url`, {
      headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` }
    }).then(r => r.json()).then(setSocios).catch(()=>setSocios([]));
  }, []);

  useEffect(() => {
    if (!selSocio) return;
    (async () => {
      setLoadingDocs(true);
      const r = await fetch(`${SUPABASE_URL}/rest/v1/documentos_socios?id_socio=eq.${selSocio.id_socio}&select=*&order=fecha_subida.desc`, {
        headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` }
      });
      const j = await r.json().catch(()=>[]);
      setDocs(Array.isArray(j) ? j : []);
      setLoadingDocs(false);
    })();
  }, [selSocio]);

  useEffect(() => { // si viene por prop (usuario)
    if (!idSocio) return;
    const s = socios.find(x => x.id_socio === idSocio);
    if (s) setSelSocio(s);
  }, [idSocio, socios]);

  const results = useMemo(() => {
    const t = term.trim().toLowerCase();
    if (!t) return [];
    return socios.filter(s =>
      String(s.id_socio).includes(t) ||
      `${s.nombre} ${s.apellido_paterno} ${s.apellido_materno}`.toLowerCase().includes(t)
    ).slice(0, 20);
  }, [term, socios]);

  /* HANDLERS DE SUBIDA */
  const doUpload = async (kind, files) => {
    if (!selSocio) { alert('Selecciona un socio primero.'); return; }
    setBusy(true);
    setUploadMsg('Subiendo…');

    try {
      for (const file of files) {
        const ext = (file.name.split('.').pop() || '').toLowerCase();
        const ts = Date.now();
        const basePath = `${selSocio.id_socio}`;
        let bucket = '';
        let path = '';
        let tipoDoc = '';
        let nombreDoc = file.name;

        if (kind === 'foto') {
          if (!['jpg', 'jpeg', 'png'].includes(ext)) throw new Error('La foto debe ser JPG o PNG.');
          bucket = BUCKET_FOTOS;
          path = `${basePath}/foto-${ts}.${ext}`;
        } else if (kind === 'ine') {
          if (ext !== 'pdf') throw new Error('El INE debe ser PDF.');
          bucket = BUCKET_DOCS;
          path = `${basePath}/INE-${ts}.pdf`;
          tipoDoc = 'INE';
          nombreDoc = `INE ${selSocio.id_socio}`;
        } else if (kind === 'comprobante') {
          if (ext !== 'pdf') throw new Error('El comprobante debe ser PDF.');
          bucket = BUCKET_DOCS;
          path = `${basePath}/Comprobante-${ts}.pdf`;
          tipoDoc = 'Comprobante';
          nombreDoc = `Comprobante ${selSocio.id_socio}`;
        } else if (kind === 'varios') {
          if (ext !== 'pdf') throw new Error('Los “varios” deben ser PDF.');
          bucket = BUCKET_AVAL;
          path = `${basePath}/Varios-${ts}-${file.name.replace(/\s+/g,'_')}`;
          tipoDoc = 'Varios';
        }

        const { publicUrl } = await uploadToStorage({ bucket, path, file });

        // Si es foto -> guardamos URL en el socio
        if (kind === 'foto') {
          await actualizarFotoSocio({ id_socio: selSocio.id_socio, url: publicUrl });
          // refrescamos en memoria
          setSelSocio(prev => ({ ...prev, foto_url: publicUrl }));
          setSocios(prev => prev.map(s => s.id_socio === selSocio.id_socio ? { ...s, foto_url: publicUrl } : s));
        } else {
          // registramos documento en la tabla
          await registrarDocumento({
            id_socio: selSocio.id_socio,
            tipo: tipoDoc,
            nombre: nombreDoc,
            url: publicUrl
          });
        }
      }
      setUploadMsg('¡Archivos subidos correctamente!');
      // refrescar documentos
      const rr = await fetch(`${SUPABASE_URL}/rest/v1/documentos_socios?id_socio=eq.${selSocio.id_socio}&select=*&order=fecha_subida.desc`, {
        headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` }
      });
      setDocs(await rr.json());
    } catch (e) {
      setUploadMsg(`Error: ${e.message}`);
    } finally {
      setBusy(false);
      setTimeout(()=>setUploadMsg(''), 3000);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Cargar información del Socio</h2>
        <p className="text-slate-600">Foto (JPG/PNG), INE y comprobante (PDF), y archivos varios (PDF).</p>
      </div>

      {/* Buscador */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <label className="block text-sm font-medium text-slate-700 mb-2">Buscar ID de socio o Nombre completo</label>
        <input
          type="text"
          value={term}
          onChange={(e)=>setTerm(e.target.value)}
          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Ej: 12 o Juan Pérez"
        />

        {results.length > 0 && (
          <div className="mt-4 space-y-2">
            {results.map(s => (
              <div key={s.id_socio} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  {s.foto_url ? (
                    <img src={s.foto_url} alt="" className="w-9 h-9 rounded-full object-cover border" />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-slate-200" />
                  )}
                  <span className="text-slate-800">ID: {s.id_socio} — {s.nombre} {s.apellido_paterno} {s.apellido_materno}</span>
                </div>
                <button
                  onClick={() => { setSelSocio(s); setShowModal(true); }}
                  className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Subir
                </button>
              </div>
            ))}
          </div>
        )}

        {selSocio && (
          <div className="mt-6">
            <h4 className="font-semibold text-slate-900 mb-2">Documentos del socio seleccionado</h4>
            {loadingDocs ? (
              <p className="text-slate-600">Cargando documentos…</p>
            ) : docs.length === 0 ? (
              <p className="text-slate-600">Aún no hay documentos registrados para este socio.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {docs.map(doc => (
                  <div key={doc.id_documento} className="border border-slate-200 rounded-xl p-4">
                    <div className="font-medium">{doc.nombre_documento}</div>
                    <div className="text-sm text-slate-500">Tipo: {doc.tipo_documento} • {doc.fecha_subida}</div>
                    <a href={doc.url_documento} target="_blank" rel="noreferrer" className="inline-block mt-2 text-blue-600 hover:underline">Ver archivo</a>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODAL SUBIDA */}
      {showModal && selSocio && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl shadow-xl">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">Subir archivos — ID {selSocio.id_socio} — {selSocio.nombre} {selSocio.apellido_paterno}</h3>
              <button className="px-3 py-1 rounded-lg bg-slate-100" onClick={()=>setShowModal(false)}>Cerrar</button>
            </div>

            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[70vh] overflow-y-auto">
              <DropBox
                title="Foto del socio"
                hint="JPG o PNG"
                accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                onFiles={(files)=>!busy && doUpload('foto', [files[0]])}
              />
              <DropBox
                title="INE (PDF)"
                hint="Solo PDF"
                accept=".pdf,application/pdf"
                onFiles={(files)=>!busy && doUpload('ine', [files[0]])}
              />
              <DropBox
                title="Comprobante de domicilio (PDF)"
                hint="Solo PDF"
                accept=".pdf,application/pdf"
                onFiles={(files)=>!busy && doUpload('comprobante', [files[0]])}
              />
              <DropBox
                title="Avales y varios (PDF)"
                hint="Puedes subir varios PDFs"
                multiple
                accept=".pdf,application/pdf"
                onFiles={(files)=>!busy && doUpload('varios', files)}
              />
            </div>

            <div className="px-5 pb-5">
              {uploadMsg && (
                <div className={`mt-3 text-sm ${uploadMsg.startsWith('Error') ? 'text-red-600' : 'text-emerald-600'}`}>
                  {uploadMsg}
                </div>
              )}
              {busy && <div className="text-sm text-slate-500">Procesando…</div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CentroDigitalModule;
