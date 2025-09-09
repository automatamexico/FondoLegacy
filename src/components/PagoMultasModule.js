import React, { useState, useEffect } from 'react';
import { convertirFechaHoraLocal } from '../utils/dateFormatter';

const SUPABASE_URL = 'https://ubfkhtkmlvutwdivmoff.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InViZmtodGttbHZ1dHdkaXZtb2ZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4MTc5NTUsImV4cCI6MjA2NjM5Mzk1NX0.c0iRma-dnlL29OR3ffq34nmZuj_ViApBTMG-6PEX_B4';

const PagoMultasModule = ({ idSocio }) => {
  const [multasList, setMultasList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (idSocio) {
      fetchMultas();
    } else {
      setLoading(false);
      setError("No se pudo obtener el ID de socio. Por favor, inicie sesión nuevamente.");
    }
  }, [idSocio]);

  const fetchMultas = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/pago_multas?id_socio=eq.${idSocio}&select=*`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Error al cargar multas: ${response.statusText} - ${errorData.message || 'Error desconocido'}`);
      }
      const data = await response.json();
      setMultasList(data);
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
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Pagos de Multas</h2>
          <p className="text-slate-600">Consulta el detalle de los pagos de multas</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        {loading && <p className="text-center text-slate-600">Cargando multas...</p>}
        {error && !loading && <p className="text-center text-red-500">Error: {error}</p>}

        {!loading && !error && multasList.length === 0 && (
          <p className="text-center text-slate-600">No hay pagos de multas registrados.</p>
        )}

        {!loading && !error && multasList.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">ID Multa</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">ID Socio</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Monto</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Fecha</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Hora</th>
                </tr>
              </thead>
              <tbody>
                {multasList.map((multa) => {
                  const { fecha, hora } = convertirFechaHoraLocal(multa.fecha_hora);
                  return (
                    <tr key={multa.id_multa} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-4 px-4 text-slate-700">{multa.id_multa}</td>
                      <td className="py-4 px-4 text-slate-700">{multa.id_socio}</td>
                      <td className="py-4 px-4 font-bold text-slate-900">{formatCurrency(multa.monto_multa_hoja)}</td>
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

export default PagoMultasModule;