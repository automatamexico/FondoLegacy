// src/components/ReportesModule.js
import React, { useEffect, useMemo, useState } from 'react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const SUPABASE_URL = 'https://ubfkhtkmlvutwdivmoff.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InViZmtodGttbHZ1dHdkaXZtb2ZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4MTc5NTUsImV4cCI6MjA2NjM5Mzk1NX0.c0iRma-dnlL29OR3ffq34nmZuj_ViApBTMG-6PEX_B4';

// Logo cuadrado solicitado
const LOGO_URL = 'https://ubfkhtkmlvutwdivmoff.supabase.co/storage/v1/object/public/Logos/logo_fondo_blanco.png';

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
  Number(p?.monto_prestamo ?? p?.monto ?? p?.principal ?? p?.cantidad ?? p?.monto_solicitado ?? 0);

// Helpers para PDF
const ymd = (d) => {
  const Y = d.getFullYear();
  const M = String(d.getMonth()+1).padStart(2,'0');
  const D = String(d.getDate()).padStart(2,'0');
  return `${Y}-${M}-${D}`;
};
const fetchJSON = async (path, options = {}) => {
  const r = await fetch(`${SUPABASE_URL}${path}`, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      ...options.headers
    },
    ...options
  });
  if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
  const ct = r.headers.get('content-type') || '';
  return ct.includes('application/json') ? r.json() : r.blob();
};
const blobToBase64 = (blob) =>
  new Promise((res) => {
    const reader = new FileReader();
    reader.onloadend = () => res(reader.result);
    reader.readAsDataURL(blob);
  });

export default function ReportesModule() {
  // ========= NUEVO: Selector de tipo de reporte =========
  const [activeReport, setActiveReport] = useState('control-prestamos'); // 'control-prestamos' | 'corrida-pdf'

  // ========= (EXISTENTE) Control de préstamos (Excel/Tabla) =========
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [selectedSocio, setSelectedSocio] = useState(null);
  const [rows, setRows] = useState([]);
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
          return String(s.id_socio).includes(t) || full.includes(t);
        })
        .slice(0, 15);

      setSuggestions(filtered);
    } catch (e) {
      setSuggestions([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handlePickSocio = async (s) => {
    setSelectedSocio(s);
    setSuggestions([]);
    setSearchTerm(`ID: ${s.id_socio} — ${s.nombre} ${s.apellido_paterno ?? ''} ${s.apellido_materno ?? ''}`.trim());
    await cargarControlPrestamos(s.id_socio, s);
  };

  const cargarControlPrestamos = async (idSocio) => {
    setLoadingRows(true);
    setErrorRows('');
    setRows([]);
    try {
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
            totalPagado: fmtMoney(0)
          });
          continue;
        }

        pagosDeEste.forEach((pg) => {
          const abonoCap = Number(pg.capital_pagado || 0);
          const montoPagado = Number(pg.monto_pagado || 0);

          totalPagadoAcum += montoPagado;
          saldo = Math.max(0, saldo - abonoCap);

          outRows.push({
            no: pg.numero_pago ?? '',
            fechaPrestamo: fmtFechaLarga(fechaPrestamo),
            prestamo: fmtMoney(montoPrestamo),
            fechaAbono: fmtFechaLarga(pg.fecha_pago),
            abonoCapital: fmtMoney(abonoCap),
            saldo: fmtMoney(saldo),
            totalPagado: fmtMoney(totalPagadoAcum)
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

  // ========= NUEVO: Corrida de préstamo (PDF) =========
  const [termPdf, setTermPdf] = useState('');
  const [sugPdf, setSugPdf] = useState([]);
  const [socioPdf, setSocioPdf] = useState(null);
  const [prestamosPdf, setPrestamosPdf] = useState([]);
  const [prestamoSelPdf, setPrestamoSelPdf] = useState(null);
  const [pagosPdf, setPagosPdf] = useState([]);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [errPdf, setErrPdf] = useState('');

  useEffect(() => {
    const run = async () => {
      const t = (termPdf || '').trim().toLowerCase();
      if (!t) { setSugPdf([]); return; }
      try {
        const all = await fetchJSON(`/rest/v1/socios?select=id_socio,nombre,apellido_paterno,apellido_materno`);
        const fil = (all || []).filter(s =>
          String(s.id_socio).includes(t) ||
          `${s.nombre} ${s.apellido_paterno} ${s.apellido_materno}`.toLowerCase().includes(t)
        ).slice(0, 15);
        setSugPdf(fil);
      } catch {
        setSugPdf([]);
      }
    };
    run();
  }, [termPdf]);

  const seleccionarSocioPdf = async (s) => {
    setSocioPdf(s);
    setTermPdf(`ID: ${s.id_socio} — ${s.nombre} ${s.apellido_paterno} ${s.apellido_materno}`);
    setSugPdf([]);
    const prs = await fetchJSON(`/rest/v1/prestamos?id_socio=eq.${s.id_socio}&select=id_prestamo,monto_solicitado,numero_plazos,interes,tipo_plazo,fecha_solicitud,estatus&order=id_prestamo.desc`).catch(() => []);
    setPrestamosPdf(prs || []);
    setPrestamoSelPdf(null);
    setPagosPdf([]);
    setErrPdf('');
  };

  const cargarPagosPdf = async (id_prestamo) => {
    setPagosPdf([]);
    setErrPdf('');
    if (!id_prestamo) return;
    setLoadingPdf(true);
    try {
      const rows = await fetchJSON(`/rest/v1/pagos_prestamos?id_prestamo=eq.${id_prestamo}&select=numero_pago,fecha_programada,fecha_pago,fecha_hora_pago,monto_pago,monto_pagado,interes_pagado,capital_pagado,estatus&order=numero_pago.asc`);
      setPagosPdf(rows || []);
    } catch (e) {
      setErrPdf('No se pudo cargar la corrida (pagos programados).');
    } finally {
      setLoadingPdf(false);
    }
  };

  const totalesPdf = useMemo(() => {
    const totPagado = pagosPdf.reduce((s, r) => s + Number(r.monto_pagado || 0), 0);
    const totInteres = pagosPdf.reduce((s, r) => s + Number(r.interes_pagado || 0), 0);
    const totCapital = pagosPdf.reduce((s, r) => s + Number(r.capital_pagado || 0), 0);
    return { totPagado, totInteres, totCapital };
  }, [pagosPdf]);

  const getLogoDataURL = async () => {
    try {
      const blob = await (await fetch(LOGO_URL)).blob();
      return await blobToBase64(blob);
    } catch {
      return null;
    }
  };

  const generarPDF = async () => {
    if (!socioPdf || !prestamoSelPdf) { alert('Selecciona socio y préstamo.'); return; }

    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const primary = '#0ea15a';  // verde solicitado
    const dark = '#0F172A';     // slate-900
    const gray = '#64748B';     // slate-500

    // Header
    doc.setFillColor(primary);
    doc.rect(0, 0, 595, 80, 'F');

    // Logo cuadrado (ancho=alto para no deformar)
    try {
      const dataUrl = await getLogoDataURL();
      const LOGO_SIZE = 50; // cuadrado, se ve bien en el header
      if (dataUrl) doc.addImage(dataUrl, 'PNG', 30, 15, LOGO_SIZE, LOGO_SIZE);
      else {
        doc.setFont('helvetica','bold'); doc.setFontSize(18); doc.setTextColor('#FFFFFF');
        doc.text('TU LOGO', 30, 50);
      }
    } catch {
      doc.setFont('helvetica','bold'); doc.setFontSize(18); doc.setTextColor('#FFFFFF');
      doc.text('TU LOGO', 30, 50);
    }

    doc.setFont('helvetica','bold'); doc.setFontSize(18); doc.setTextColor('#FFFFFF');
    doc.text('Reporte de Corrida de Préstamo', 565, 50, { align: 'right' });

    // Datos
    let y = 110;
    doc.setFont('helvetica','bold'); doc.setFontSize(12); doc.setTextColor(dark);
    doc.text('Datos del socio', 30, y); y += 8;
    doc.setDrawColor(primary); doc.setLineWidth(1); doc.line(30, y, 200, y); y += 14;

    doc.setFont('helvetica','normal'); doc.setFontSize(11); doc.setTextColor(gray);
    const socioLine1 = `ID: ${socioPdf.id_socio}   Nombre: ${socioPdf.nombre} ${socioPdf.apellido_paterno || ''} ${socioPdf.apellido_materno || ''}`;
    doc.text(socioLine1, 30, y); y += 16;

    doc.setFont('helvetica','bold'); doc.setFontSize(12); doc.setTextColor(dark);
    doc.text('Datos del préstamo', 30, y); y += 8;
    doc.setDrawColor(primary); doc.setLineWidth(1); doc.line(30, y, 200, y); y += 14;

    const p = prestamoSelPdf;
    doc.setFont('helvetica','normal'); doc.setFontSize(11); doc.setTextColor(gray);
    doc.text(`Préstamo #${p.id_prestamo} — Estatus: ${String(p.estatus || '').toUpperCase()}`, 30, y); y += 16;
    doc.text(`Fecha de solicitud: ${p.fecha_solicitud ? fmtFechaLarga(p.fecha_solicitud) : ''}`, 30, y); y += 16;
    doc.text(`Monto solicitado: ${fmtMoney(p.monto_solicitado)}  ·  Plazo: ${p.numero_plazos} ${p.tipo_plazo || 'plazos'}  ·  Interés: ${p.interes}%`, 30, y); y += 24;

    // === Tabla (sin "Interés" ni "Capital") + Firma ===
    const columns = [
      { header: 'No', dataKey: 'no' },
      { header: 'F. Programada', dataKey: 'fp' },
      { header: 'F. Pago', dataKey: 'fpago' },
      { header: 'Estatus', dataKey: 'st' },
      { header: 'Monto', dataKey: 'monto' },
      { header: 'Pagado', dataKey: 'pagado' },
      { header: 'Firma', dataKey: 'firma' },
    ];

    const rowsPdf = (pagosPdf || []).map(r => {
      const estatus = String(r.estatus || '').toUpperCase();
      const fpProg = r.fecha_programada ? fmtFechaLarga(r.fecha_programada) : '';
      const fpago  = r.fecha_hora_pago ? fmtFechaLarga(r.fecha_hora_pago) : (r.fecha_pago ? fmtFechaLarga(r.fecha_pago) : '');
      const pagado = (r.monto_pagado != null) ? fmtMoney(r.monto_pagado) : '';
      const firma  = (estatus === 'PAGADO') ? 'VALIDADO' : '';

      return {
        no: r.numero_pago ?? '',
        fp: fpProg,
        fpago,
        st: estatus,
        monto: fmtMoney(r.monto_pago),
        pagado,
        firma
      };
    });

    doc.autoTable({
      startY: y,
      headStyles: { fillColor: primary, textColor: '#ffffff', fontStyle: 'bold' },
      bodyStyles: { textColor: '#0F172A' },
      alternateRowStyles: { fillColor: '#F8FAFC' },
      styles: { fontSize: 10, cellPadding: 6 },
      columns,
      body: rowsPdf
    });

    const endY = doc.lastAutoTable.finalY || (y + 20);

    // Totales (se conservan)
    doc.setFont('helvetica','bold'); doc.setFontSize(12); doc.setTextColor('#0F172A');
    doc.text('Totales', 30, endY + 24);
    doc.setDrawColor(primary); doc.setLineWidth(1); doc.line(30, endY + 28, 100, endY + 28);

    doc.setFont('helvetica','normal'); doc.setFontSize(11); doc.setTextColor('#64748B');
    doc.text(`Total pagado: ${fmtMoney(totalesPdf.totPagado)}`, 30, endY + 46);
    doc.text(`Intereses pagados: ${fmtMoney(totalesPdf.totInteres)}`, 30, endY + 64);
    doc.text(`Capital pagado: ${fmtMoney(totalesPdf.totCapital)}`, 30, endY + 82);

    // Pie
    doc.setFont('helvetica','normal'); doc.setFontSize(9); doc.setTextColor('#94A3B8');
    const hoy = new Date();
    doc.text(`Generado el ${fmtFechaLarga(hoy)} · ${ymd(hoy)}`, 30, 820);

    doc.save(`Corrida_Socio_${socioPdf.id_socio}_Prestamo_${p.id_prestamo}.pdf`);
  };

  // ========= RENDER =========
  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Reportes</h2>
        <p className="text-slate-600">Selecciona tu tipo de reporte y genera la salida correspondiente</p>
      </div>

      {/* Selección de tipo de reporte */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={() => setActiveReport('control-prestamos')}
          className={`text-left rounded-2xl border p-5 transition-all ${
            activeReport === 'control-prestamos'
              ? 'border-green-300 bg-green-50'
              : 'border-slate-200 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h18M3 9h18M3 15h18M3 21h18" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Control de préstamos (Tabla/Excel)</h3>
              <p className="text-sm text-slate-600">Consulta y exporta el control por préstamo.</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => setActiveReport('corrida-pdf')}
          className={`text-left rounded-2xl border p-5 transition-all ${
            activeReport === 'corrida-pdf'
              ? 'border-sky-300 bg-sky-50'
              : 'border-slate-200 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-sky-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 3h10a2 2 0 012 2v11l-4 4H7a2 2 0 01-2-2V5a2 2 0 012-2z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Corrida de préstamo (PDF)</h3>
              <p className="text-sm text-slate-600">Genera un PDF elegante con logo, tabla y totales.</p>
            </div>
          </div>
        </button>
      </div>

      {/* ===== VISTA: CONTROL DE PRÉSTAMOS (EXISTENTE) ===== */}
      {activeReport === 'control-prestamos' && (
        <div className="bg-white rounded-2xl border border-slate-200">
          <div className="p-6 space-y-4">
            <h4 className="text-lg font-semibold text-slate-900">Parámetros del reporte</h4>

            {/* Buscador de socio */}
            <div className="relative">
              <input
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Buscar ID de socio o Nombre completo"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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

            {/* Seleccionado */}
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
                  <button
                    className="text-sm text-blue-600 hover:underline"
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
              ) : (
                <p className="text-slate-500">Aún no has seleccionado un socio.</p>
              )}
            </div>

            {/* Resultados */}
            <div className="pt-4">
              <h5 className="text-sm font-medium text-slate-700 mb-2">
                {selectedSocio ? `Préstamos de ${selectedSocio.nombre}` : 'Resultados'}
              </h5>

              {loadingRows && <p className="text-slate-600">Cargando información…</p>}
              {!loadingRows && errorRows && <p className="text-red-600">{errorRows}</p>}
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
          </div>
        </div>
      )}

      {/* ===== VISTA: CORRIDA DE PRÉSTAMO (PDF) ===== */}
      {activeReport === 'corrida-pdf' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6">
          <div>
            <h4 className="text-lg font-semibold text-slate-900">Corrida de préstamo (PDF)</h4>
            <p className="text-slate-600">Genera un PDF con encabezado, logo, tabla de pagos y totales.</p>
          </div>

          {/* Buscar socio */}
          <div className="relative">
            <input
              value={termPdf}
              onChange={(e) => setTermPdf(e.target.value)}
              placeholder="Buscar ID de socio o Nombre completo"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
            {sugPdf.length > 0 && (
              <div className="absolute z-10 mt-2 w-full bg-white border border-slate-200 rounded-xl shadow-lg max-h-72 overflow-auto">
                {sugPdf.map((s) => (
                  <button
                    key={s.id_socio}
                    onClick={() => seleccionarSocioPdf(s)}
                    className="w-full text-left px-4 py-2 hover:bg-slate-50"
                  >
                    #{s.id_socio} — {s.nombre} {s.apellido_paterno} {s.apellido_materno}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Préstamos del socio */}
          {socioPdf && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h5 className="font-semibold text-slate-900">
                  Préstamos del socio seleccionado
                </h5>
                <span className="text-sm text-slate-500">Socio: <strong>#{socioPdf.id_socio}</strong></span>
              </div>

              {prestamosPdf.length === 0 ? (
                <p className="text-slate-500">El socio no tiene préstamos.</p>
              ) : (
                <div className="grid gap-2">
                  {prestamosPdf.map(p => (
                    <label key={p.id_prestamo} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border">
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="prestamoPdf"
                          checked={prestamoSelPdf?.id_prestamo === p.id_prestamo}
                          onChange={() => { setPrestamoSelPdf(p); cargarPagosPdf(p.id_prestamo); }}
                        />
                        <span className="font-medium">
                          #{p.id_prestamo} — {fmtMoney(p.monto_solicitado)} · {p.numero_plazos} {p.tipo_plazo || 'plazos'} · {p.interes}% · {p.estatus}
                        </span>
                      </div>
                      <span className="text-xs text-slate-500">
                        Solicitado: {p.fecha_solicitud ? fmtFechaLarga(p.fecha_solicitud) : '—'}
                      </span>
                    </label>
                  ))}
                </div>
              )}

              {errPdf && <p className="text-red-600 mt-3">{errPdf}</p>}

              <div className="mt-4 flex items-center gap-3">
                <button
                  onClick={generarPDF}
                  disabled={!prestamoSelPdf || loadingPdf}
                  className={`px-4 py-2 rounded-xl text-white ${prestamoSelPdf && !loadingPdf ? 'bg-sky-600 hover:bg-sky-700' : 'bg-slate-400 cursor-not-allowed'}`}
                >
                  {loadingPdf ? 'Cargando corrida…' : 'Exportar PDF'}
                </button>
                {prestamoSelPdf && pagosPdf.length > 0 && (
                  <span className="text-sm text-slate-500">
                    Registros en la corrida: <strong>{pagosPdf.length}</strong> · Total pagado: <strong>{fmtMoney(totalesPdf.totPagado)}</strong>
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
