import React, { useState, useEffect } from 'react';
import { convertirFechaHoraLocal } from '../utils/dateFormatter';

const SUPABASE_URL = 'https://ubfkhtkmlvutwdivmoff.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InViZmtodGttbHZ1dHdkaXZtb2ZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4MTc5NTUsImV4cCI6MjA2NjM5Mzk1NX0.c0iRma-dnlL29OR3ffq34nmZuj_ViApBTMG-6PEX_B4';

const PagoAfiliacionesModule = ({ idSocio }) => {
  const [afiliacionesList, setAfiliacionesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (idSocio) {
      fetchAfiliaciones();
    } else {
      setLoading(false);
      setError("No se pudo obtener el ID de socio. Por favor, inicie sesión nuevamente.");
    }
  }, [idSocio]);

  const fetchAfiliaciones = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/pago_afiliaciones?id_socio=eq.${idSocio}&select=*`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Error al cargar afiliaciones: ${response.statusText} - ${errorData.message || 'Error desconocido'}`);
      }
      const data = await response.json();
      setAfiliacionesList(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Pagos de Afiliaciones</h2>
          <p className="text-slate-600">Consulta el detalle de los pagos de afiliaciones y papelería</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        {loading && <p className="text-center text-slate-600">Cargando afiliaciones...</p>}
        {error && !loading && <p className="text-center text-red-500">Error: {error}</p>}

        {!loading && !error && afiliacionesList.length === 0 && (
          <p className="text-center text-slate-600">No hay pagos de afiliaciones registrados.</p>
        )}

        {!loading && !error && afiliacionesList.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">ID Afiliación</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">ID Socio</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Monto</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Fecha</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Hora</th>
                </tr>
              </thead>
              <tbody>
                {afiliacionesList.map((afiliacion) => {
                  const { fecha, hora } = convertirFechaHoraLocal(afiliacion.fecha_hora);
                  return (
                    <tr key={afiliacion.id_afiliacion} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-4 px-4 text-slate-700">{afiliacion.id_afiliacion}</td>
                      <td className="py-4 px-4 text-slate-700">{afiliacion.id_socio}</td>
                      <td className="py-4 px-4 font-bold text-slate-900">{formatCurrency(afiliacion.monto_afiliacion_papeleria)}</td>
                      <td className="py-4 px-4 text-slate-700">{fecha}</td>
                      <td className="py-4 px-4 text-slate-700">{hora}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default PagoAfiliacionesModule;