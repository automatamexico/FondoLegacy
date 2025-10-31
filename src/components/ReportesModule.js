// src/components/ReportesModule.js
import React, { useEffect, useMemo, useState } from 'react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const SUPABASE_URL = 'https://ubfkhtkmlvutwdivmoff.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InViZmtodGttbHZ1dHdkaXZtb2ZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4MTc5NTUsImV4cCI6MjA2NjM5Mzk1NX0.c0iRma-dnlL29OR3ffq34nmZuj_ViApBTMG-6PEX_B4';

const LOGO_URL = 'https://ubfkhtkmlvutwdivmoff.supabase.co/storage/v1/object/public/Logos/LOGO_OK.png';
const BRAND = '#0ea15a'; // verde solicitado

const monthNames = [
  'Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'
];
const fmtMoney = (n) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(Number(n || 0));
const fmtFechaLarga = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d)) return '';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = monthNames[d.getMonth()] || '';
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

// intenta leer un campo de fecha válido del préstamo
const getFechaPrestamo = (p) =>
  p?.fecha_prestamo || p?.fecha_otorgamiento || p?.fecha_desembolso || p?.fecha_inicio || p?.fecha || null;

// intenta leer el monto principal del préstamo
const getMontoPrestamo = (p) =>
  Number(p?.monto_prestamo ?? p?.monto ?? p?.principal ?? p?.cantidad ?? 0);

export default function ReportesModule() {
  // Nuevo selector de tipo de reporte: 'tabla' o 'pdf'
  const [reportType, setReportType] = useState('pdf'); // por defecto PDF para que lo veas de inmediato

  // Buscador
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [suggestions, setSuggestions] = useState([]);

  // Selección socio y resultados
  const [selectedSocio, setSelectedSocio] = useState(null);
  const [rows, setRows] = useState([]); // filas de la tabla final (también las usa el PDF)
  const [loadingRows, setLoadingRows] = useState(false);
  const [errorRows, setErrorRows] = useState('');

  const headers = useMemo(
    () => [
      { key: 'no', label: 'No' },
      { key: 'fechaPrestamo', label: 'Fecha préstamo' },
      { key: 'prestamo', label: 'Préstamo' },
      { key: 'fechaAbono', label: 'Fecha de abono' },
      { key: 'abonoCapital', label: 'Abono a capital préstamo' },
      { key: 'saldo', label: 'Saldo' },
      { key: 'totalPagado', label: 'Total pagado' }
    ],
    []
  );

  // Buscar socios (solo ID + nombre completo en sugerencias)
  const handleSearch = async (term) => {
    setSearchTerm(term);
    setSelectedSocio(null);
    setRows([]);
    setErrorRows('');
    if (!term || term.trim().length < 1) {
      setSuggestions([]);
      return;
    }
    setIsSearching(true);
    try {
      const resp = await fetch(
        `${SUPABASE_URL}/rest/v1/socios?select=id_socio,nombre,apellido_paterno,apellido_materno`,
        {
          headers: {
            'Content-Type': 'application/json',
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`
          }
        }
      );
      if (!resp.ok) throw new Error('No se pudo buscar socios');
      const data = await resp.json();

      const t = term.toLowerCase();
      const filtered = data
        .filter((s) => {
          const full = `${s.nombre || ''} ${s.apellido_paterno || ''} ${s.apellido_materno || ''}`.trim().toLowerCase();
          return (
            String(s.id_socio).includes(t) ||
            full.includes(t)
          );
        })
        .slice(0, 15);

      setSuggestions(filtered);
    } catch (e) {
      setSuggestions([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Al seleccionar un socio en las sugerencias
  const handlePickSocio = async (s) => {
    setSelectedSocio(s);
    setSuggestions([]);
    setSearchTerm(`ID: ${s.id_socio} — ${s.nombre} ${s.apellido_paterno ?? ''} ${s.apellido_materno ?? ''}`.trim());
    await cargarControlPrestamos(s.id_socio, s);
  };

  // Cargar préstamos y pagos -> armar filas
  const cargarControlPrestamos = async (idSocio, socioObj) => {
    setLoadingRows(true);
    setErrorRows('');
    setRows([]);
    try {
      // 1) préstamos del socio
      const rPrest = await fetch(
        `${SUPABASE_URL}/rest/v1/prestamos?select=*&id_socio=eq.${idSocio}`,
        {
          headers: {
            'Content-Type': 'application/json',
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`
          }
        }
      );
      if (!rPrest.ok) throw new Error('No se pudieron cargar los préstamos del socio');
      const prestamos = await rPrest.json();

      if (!prestamos || prestamos.length === 0) {
        setRows([]);
        setErrorRows('Este socio no tiene préstamos registrados.');
        setLoadingRows(false);
        return;
      }

      const prestIds = prestamos.map((p) => p.id_prestamo).filter(Boolean);
      if (prestIds.length === 0) {
        setRows([]);
        setErrorRows('No se encontraron IDs de préstamo válidos.');
        setLoadingRows(false);
        return;
      }

      // 2) pagos de esos préstamos (ordenados)
      const idsIn = `(${prestIds.join(',')})`;
      const rPagos = await fetch(
        `${SUPABASE_URL}/rest/v1/pagos_prestamos?select=id_prestamo,numero_pago,fecha_programada,fecha_pago,monto_pagado,capital_pagado,estatus&order=id_prestamo.asc&order=numero_pago.asc&id_prestamo=in.${idsIn}`,
        {
          headers: {
            'Content-Type': 'application/json',
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`
          }
        }
      );
      if (!rPagos.ok) throw new Error('No se pudieron cargar los pagos de los préstamos');
      const pagos = await rPagos.json();

      // 3) agrupar pagos por préstamo para calcular saldos y acumulados
      const pagosByPrestamo = new Map();
      pagos.forEach((p) => {
        if (!pagosByPrestamo.has(p.id_prestamo)) pagosByPrestamo.set(p.id_prestamo, []);
        pagosByPrestamo.get(p.id_prestamo).push(p);
      });

      const outRows = [];
      for (const prest of prestamos) {
        const prestamoId = prest.id_prestamo;
        const montoPrestamo = getMontoPrestamo(prest);
        const fechaPrestamo = getFechaPrestamo(prest);

        let saldo = montoPrestamo;
        let totalPagadoAcum = 0;

        const pagosDeEste = pagosByPrestamo.get(prestamoId) || [];
        if (pagosDeEste.length === 0) {
          outRows.push({
            no: '-',
            fechaPrestamo: fmtFechaLarga(fechaPrestamo),
            prestamo: fmtMoney(montoPrestamo),
            fechaAbono: '',
            abonoCapital: fmtMoney(0),
            saldo: fmtMoney(montoPrestamo),
            totalPagado: fmtMoney(0),
            _estatus: '',
            _fPago: ''
          });
          continue;
        }

        pagosDeEste.forEach((pg) => {
          const abonoCap = Number(pg.capital_pagado || 0);
          const montoPagado = Number(pg.monto_pagado || 0);

          totalPagadoAcum += montoPagado;
          saldo = Math.max(0, saldo - abonoCap);

          const estatusLc = String(pg.estatus || '').toLowerCase();
          const estatusPdf = estatusLc === 'pagado' ? 'PAGADO' : ''; // blanco si NO es pagado
          const fechaPagoPdf = pg.fecha_pago ? fmtFechaLarga(pg.fecha_pago) : ''; // blanco si no hay fecha

          outRows.push({
            no: pg.numero_pago ?? '',
            fechaPrestamo: fmtFechaLarga(fechaPrestamo),
            prestamo: fmtMoney(montoPrestamo),
            fechaAbono: fmtFechaLarga(pg.fecha_pago),
            abonoCapital: fmtMoney(abonoCap),
            saldo: fmtMoney(saldo),
            totalPagado: fmtMoney(totalPagadoAcum),
            _estatus: estatusPdf,
            _fPago: fechaPagoPdf
          });
        });
      }

      setRows(outRows);
    } catch (err) {
      setRows([]);
      setErrorRows('Ocurrió un error al generar el control de préstamos.');
    } finally {
      setLoadingRows(false);
    }
  };

  // ---------- Exportar PDF ----------
  const loadImageAsDataURL = async (url) => {
    const res = await fetch(url, { mode: 'cors' });
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const fr = new FileReader();
      fr.onload = () => resolve(fr.result);
      fr.readAsDataURL(blob);
    });
  };

  const handleExportPDF = async () => {
    if (!selectedSocio || rows.length === 0) {
      alert('Selecciona un socio y genera el reporte antes de exportar a PDF.');
      return;
    }

    const doc = new jsPDF({ unit: 'mm', format: 'letter', compress: true });

    // Header con logo
    try {
      const dataUrl = await loadImageAsDataURL(LOGO_URL);
      doc.addImage(dataUrl, 'PNG', 16, 10, 28, 28);
    } catch {}

    // Título y datos
    doc.setTextColor(BRAND);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('Reporte de Control de Préstamos', 48, 18);

    doc.setFontSize(10);
    doc.setTextColor('#111111');
    doc.setFont('helvetica', 'normal');
    doc.text(
      `Socio: ID ${selectedSocio.id_socio} — ${selectedSocio.nombre} ${selectedSocio.apellido_paterno ?? ''} ${selectedSocio.apellido_materno ?? ''}`,
      48, 25
    );

    const fechaStr = new Date().toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' });
    doc.text(`Generado: ${fechaStr}`, 48, 31);

    // Separador verde
    doc.setDrawColor(BRAND);
    doc.setLineWidth(0.6);
    doc.line(16, 42, 200, 42);

    // Tabla PDF con columnas solicitadas (incluye "F. Pago", "Pagado" y "Firma")
    const head = [[
      'No',
      'Fecha préstamo',
      'Préstamo',
      'F. Pago',
      'Abono a capital',
      'Saldo',
      'Total pagado',
      'Pagado',
      'Firma'
    ]];

    const body = rows.map((r) => {
      const firma = r._estatus === 'PAGADO' ? 'VALIDADO' : '';
      return [
        r.no,
        r.fechaPrestamo || '',
        r.prestamo || '',
        r._fPago || '',
        r.abonoCapital || '',
        r.saldo || '',
        r.totalPagado || '',
        r._estatus || '',
        firma
      ];
    });

    doc.autoTable({
      startY: 48,
      head,
      body,
      theme: 'grid',
      styles: { font: 'helvetica', fontSize: 9, cellPadding: 2.5 },
      headStyles: { fillColor: BRAND, textColor: '#ffffff', lineColor: BRAND, halign: 'center', fontStyle: 'bold' },
      bodyStyles: { lineColor: '#dddddd' },
      columnStyles: {
        0: { halign: 'center', cellWidth: 12 },
        1: { cellWidth: 28 },
        2: { cellWidth: 25 },
        3: { halign: 'center', cellWidth: 22 },
        4: { halign: 'right', cellWidth: 28 },
        5: { halign: 'right', cellWidth: 22 },
        6: { halign: 'right', cellWidth: 26 },
        7: { halign: 'center', cellWidth: 18 },
        8: { halign: 'center', cellWidth: 20 }
      },
      didDrawPage: () => {
        const pageSize = doc.internal.pageSize;
        const pageWidth = pageSize.getWidth();
        const pageHeight = pageSize.getHeight();
        doc.setFontSize(8);
        doc.setTextColor('#666666');
        doc.text(`Página ${doc.internal.getNumberOfPages()}`, pageWidth - 30, pageHeight - 10);
      }
    });

    // Descargar
    const safeName = `reporte_prestamos_socio_${selectedSocio.id_socio}.pdf`;
    doc.save(safeName);
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Reportes</h2>
        <p className="text-slate-600">Selecciona tu tipo de reporte y genera la salida.</p>
      </div>

      {/* Selector de tipo de reporte */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={() => setReportType('tabla')}
          className={`text-left rounded-2xl border p-5 transition-all ${
            reportType === 'tabla'
              ? 'border-emerald-300 bg-emerald-50'
              : 'border-slate-200 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h18M3 9h18M3 15h18M3 21h18" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Control (tabla)</h3>
              <p className="text-sm text-slate-600">Vista en tabla del control de préstamos.</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => setReportType('pdf')}
          className={`text-left rounded-2xl border p-5 transition-all ${
            reportType === 'pdf'
              ? 'border-emerald-300 bg-emerald-50'
              : 'border-slate-200 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v8m-4-4h8M5 5h14v14H5z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">PDF: Control de préstamos</h3>
              <p className="text-sm text-slate-600">Genera un PDF con colores y logo.</p>
            </div>
          </div>
        </button>
      </div>

      {/* Parámetros (idénticos para ambos tipos) */}
      <div className="bg-white rounded-2xl border border-slate-200">
        <div className="p-6 space-y-4">
          <h4 className="text-lg font-semibold text-slate-900">Parámetros del reporte</h4>

          {/* Buscador de socio */}
          <div className="relative">
            <input
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Buscar ID de socio o Nombre completo"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
            {isSearching && (
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-500">
                Buscando…
              </span>
            )}

            {/* Sugerencias */}
            {suggestions.length > 0 && (
              <div className="absolute z-10 mt-2 w-full bg-white border border-slate-200 rounded-xl shadow-lg max-h-72 overflow-auto">
                {suggestions.map((s) => {
                  const full = `${s.nombre || ''} ${s.apellido_paterno || ''} ${s.apellido_materno || ''}`.trim();
                  return (
                    <button
                      key={s.id_socio}
                      onClick={() => handlePickSocio(s)}
                      className="w-full text-left px-4 py-2 hover:bg-slate-50"
                    >
                      <span className="font-medium text-slate-800">ID: {s.id_socio}</span>
                      <span className="text-slate-600"> — {full}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Seleccionado + acción (si PDF, muestra botón Exportar PDF) */}
          <div className="pt-2">
            <h5 className="text-sm font-medium text-slate-700 mb-2">Selecciona un socio</h5>
            {selectedSocio ? (
              <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
                <div className="text-slate-800">
                  <span className="font-semibold">
                    ID {selectedSocio.id_socio} — {selectedSocio.nombre} {selectedSocio.apellido_paterno}{' '}
                    {selectedSocio.apellido_materno}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  {reportType === 'pdf' && (
                    <button
                      className="px-3 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60"
                      onClick={handleExportPDF}
                      disabled={!rows.length}
                    >
                      Exportar PDF
                    </button>
                  )}
                  <button
                    className="text-sm text-emerald-700 hover:underline"
                    onClick={() => {
                      setSelectedSocio(null);
                      setRows([]);
                      setSearchTerm('');
                      setSuggestions([]);
                      setErrorRows('');
                    }}
                  >
                    Limpiar selección
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-slate-500">Aún no has seleccionado un socio.</p>
            )}
          </div>

          {/* Resultados (la tabla sólo es relevante cuando está en modo 'tabla') */}
          {reportType === 'tabla' && (
            <div className="pt-4">
              <h5 className="text-sm font-medium text-slate-700 mb-2">
                {selectedSocio ? `Préstamos de ${selectedSocio.nombre}` : 'Resultados'}
              </h5>

              {loadingRows && <p className="text-slate-600">Cargando información…</p>}
              {!loadingRows && errorRows && (
                <p className="text-red-600">{errorRows}</p>
              )}
              {!loadingRows && !errorRows && rows.length === 0 && selectedSocio && (
                <p className="text-slate-600">No hay información que mostrar.</p>
              )}

              {!loadingRows && !errorRows && rows.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-200">
                        {headers.map((h) => (
                          <th key={h.key} className="text-left py-3 px-4 font-semibold text-slate-700">
                            {h.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((r, idx) => (
                        <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="py-3 px-4 text-slate-800">{r.no}</td>
                          <td className="py-3 px-4 text-slate-800">{r.fechaPrestamo}</td>
                          <td className="py-3 px-4 text-slate-800">{r.prestamo}</td>
                          <td className="py-3 px-4 text-slate-800">{r.fechaAbono}</td>
                          <td className="py-3 px-4 text-slate-800">{r.abonoCapital}</td>
                          <td className="py-3 px-4 text-slate-800">{r.saldo}</td>
                          <td className="py-3 px-4 text-slate-800">{r.totalPagado}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* En modo PDF no mostramos nada extra; el botón “Exportar PDF” ya está arriba */}
        </div>
      </div>
    </div>
  );
}
