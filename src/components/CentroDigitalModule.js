import React, { useState, useEffect } from 'react';

const SUPABASE_URL = 'https://ubfkhtkmlvutwdivmoff.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InViZmtodGttbHZ1dHdkaXZtb2ZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4MTc5NTUsImV4cCI6MjA2NjM5Mzk1NX0.c0iRma-dnlL29OR3ffq34nmZuj_ViApBTMG-6PEX_B4';

const CentroDigitalModule = ({ idSocio }) => { // Recibe idSocio como prop
  const [activeTab, setActiveTab] = useState('documentos');
  const [documentosList, setDocumentosList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (activeTab === 'documentos') {
      if (idSocio) { // Si es usuario, filtrar por id_socio
        fetchDocumentos(idSocio);
      } else { // Si es admin, cargar todos los documentos
        fetchDocumentos();
      }
    }
  }, [activeTab, idSocio]);

  const fetchDocumentos = async (socioId = null) => {
    setLoading(true);
    setError(null);
    try {
      let url = `${SUPABASE_URL}/rest/v1/documentos_socios?select=*`;
      if (socioId) {
        url += `&id_socio=eq.${socioId}`;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Error al cargar documentos: ${response.statusText} - ${errorData.message || 'Error desconocido'}`);
      }
      const data = await response.json();
      setDocumentosList(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const servicios = [
    { id: 1, nombre: 'Consulta de Saldos', descripcion: 'Verificar saldos de ahorros y préstamos', activo: true },
    { id: 2, nombre: 'Transferencias', descripcion: 'Realizar transferencias entre cuentas', activo: true },
    { id: 3, nombre: 'Pagos en Línea', descripcion: 'Pagar cuotas de préstamos online', activo: false },
    { id: 4, nombre: 'Solicitud de Préstamos', descripcion: 'Solicitar préstamos digitalmente', activo: true }
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Centro Digital</h2>
        <p className="text-slate-600">Gestiona servicios digitales y documentos</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200">
        <div className="border-b border-slate-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('documentos')}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'documentos'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              Documentos
            </button>
            <button
              onClick={() => setActiveTab('servicios')}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'servicios'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              Servicios Digitales
            </button>
            <button
              onClick={() => setActiveTab('configuracion')}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'configuracion'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              Configuración
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'documentos' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900">Biblioteca de Documentos</h3>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium">
                  Subir Documento
                </button>
              </div>

              {loading && <p className="text-center text-slate-600">Cargando documentos...</p>}
              {error && !loading && <p className="text-center text-red-500">Error: {error}</p>}

              {!loading && !error && documentosList.length === 0 && (
                <p className="text-center text-slate-600">No hay documentos registrados.</p>
              )}

              {!loading && !error && documentosList.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {documentosList.map((doc) => (
                    <div key={doc.id_documento} className="border border-slate-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                          <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-slate-900">{doc.nombre_documento}</h4>
                          <p className="text-sm text-slate-500">Socio ID: {doc.id_socio} • Tipo: {doc.tipo_documento}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500">Subido: {doc.fecha_subida}</span>
                        <div className="flex space-x-2">
                          <a href={doc.url_documento} target="_blank" rel="noopener noreferrer" className="p-1 text-blue-600 hover:bg-blue-50 rounded">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </a>
                          <button className="p-1 text-slate-600 hover:bg-slate-50 rounded">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'servicios' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900">Servicios Digitales</h3>
                <button className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-medium">
                  Nuevo Servicio
                </button>
              </div>

              <div className="space-y-4">
                {servicios.map((servicio) => (
                  <div key={servicio.id} className="border border-slate-200 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className={`w-3 h-3 rounded-full ${
                          servicio.activo ? 'bg-green-500' : 'bg-red-500'
                        }`}></div>
                        <div>
                          <h4 className="font-medium text-slate-900">{servicio.nombre}</h4>
                          <p className="text-sm text-slate-600">{servicio.descripcion}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          servicio.activo 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {servicio.activo ? 'Activo' : 'Inactivo'}
                        </span>
                        <button className="p-2 text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'configuracion' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-slate-900">Configuración del Sistema</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium text-slate-900">Configuración General</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                      <span className="text-sm font-medium text-slate-700">Mantenimiento Programado</span>
                      <button className="w-12 h-6 bg-slate-300 rounded-full relative transition-colors">
                        <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 left-0.5 transition-transform"></div>
                      </button>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                      <span className="text-sm font-medium text-slate-700">Notificaciones Email</span>
                      <button className="w-12 h-6 bg-blue-500 rounded-full relative transition-colors">
                        <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 right-0.5 transition-transform"></div>
                      </button>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                      <span className="text-sm font-medium text-slate-700">Backup Automático</span>
                      <button className="w-12 h-6 bg-blue-500 rounded-full relative transition-colors">
                        <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 right-0.5 transition-transform"></div>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium text-slate-900">Seguridad</h4>
                  <div className="space-y-3">
                    <div className="p-3 bg-slate-50 rounded-xl">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-slate-700">Último Backup</span>
                        <span className="text-xs text-green-600">Exitoso</span>
                      </div>
                      <p className="text-xs text-slate-500">Hace 2 horas</p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-slate-700">Certificado SSL</span>
                        <span className="text-xs text-green-600">Válido</span>
                      </div>
                      <p className="text-xs text-slate-500">Expira en 89 días</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CentroDigitalModule;