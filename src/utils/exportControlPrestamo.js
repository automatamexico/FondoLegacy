// src/utils/exportControlPrestamo.js
const SUPABASE_URL = 'https://ubfkhtkmlvutwdivmoff.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InViZmtodGttbHZ1dHdkaXZtb2ZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4MTc5NTUsImV4cCI6MjA2NjM5Mzk1NX0.c0iRma-dnlL29OR3ffq34nmZuj_ViApBTMG-6PEX_B4';

// Meses en español para "01/Enero/2025"
const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
function fechaLarga(d) {
  if (!d) return "";
  const dt = new Date(d);
  const dia = String(dt.getDate()).padStart(2,'0');
  const mes = MESES[dt.getMonth()];
  const anio = dt.getFullYear();
  return `${dia}/${mes}/${anio}`;
}

function toMoney(n) {
  const v = Number(n || 0);
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(v);
}

async function getJSON(url) {
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`
    }
  });
  if (!res.ok) {
    const e = await res.text();
    throw new Error(`HTTP ${res.status} - ${e}`);
  }
  return res.json();
}

/**
 * Exporta un Excel con el formato de "control de préstamos e intereses"
 * para un id_prestamo específico.
 */
export async function exportControlPrestamoXLSX(id_prestamo) {
  if (!window.XLSX) {
    alert('No se encontró XLSX. Asegúrate de incluir el script CDN en index.html');
    return;
  }

  // 1) Prestamo
  const [prestamo] = await getJSON(`${SUPABASE_URL}/rest/v1/prestamos?id_prestamo=eq.${id_prestamo}&select=*`);
  if (!prestamo) throw new Error(`No existe el préstamo ${id_prestamo}`);

  // 2) Socio
  const [socio] = await getJSON(`${SUPABASE_URL}/rest/v1/socios?id_socio=eq.${prestamo.id_socio}&select=id_socio,nombre,apellido_paterno,apellido_materno`);
  const nombreCompleto = socio ? `${socio.nombre} ${socio.apellido_paterno || ''} ${socio.apellido_materno || ''}`.trim() : '—';

  // 3) Pagos programados/realizados
  const pagos = await getJSON(
    `${SUPABASE_URL}/rest/v1/pagos_prestamos?id_prestamo=eq.${id_prestamo}&select=numero_pago,fecha_programada,fecha_pago,monto_pago,monto_pagado,interes_pagado,capital_pagado,estatus,frecuencia,nota&order=numero_pago.asc`
  );

  const montoPrestado = Number(prestamo.monto_solicitado || 0);
  const tasaMensual = Number(prestamo.interes || prestamo.tasa_interes_mensual || 0) / 100;

  let saldo = montoPrestado;
  const fechaPrestamo = prestamo.fecha_solicitud || prestamo.fecha_creacion || prestamo.created_at || prestamo.fecha_prestamo;

  // Cabecera
  const header = [
    ["FONDO DE INVERSIÓN, AHORRO Y PRÉSTAMO LEGACY", "", "", "", "", "", "", ""],
    ["CONTROL DE PRESTAMOS E INTERESES", "", "", "", "", "", "", ""],
    [`NOMBRE: ${nombreCompleto}      No. Préstamo: ${id_prestamo}      ID Socio: ${prestamo.id_socio}`, "", "", "", "", "", "", ""],
    ["Fecha de vencimiento pagaré", "", "", "", "", "", "", ""],
    ["No.", "FECHA PRESTAMO", "MONTO PRESTADO", "FECHA", "INTERÉS", "SALDO", "Total pagado", "FIRMA DE RECIBIDO"]
  ];

  // Primera fila con el desembolso
  const rows = [[
    "",                         // No.
    fechaLarga(fechaPrestamo),  // FECHA PRESTAMO
    toMoney(montoPrestado),     // MONTO PRESTADO
    "",                         // FECHA
    "",                         // INTERÉS
    toMoney(saldo),             // SALDO
    "",                         // Total pagado
    ""                          // FIRMA
  ]];

  pagos.forEach(p => {
    const interesCalc = (p.interes_pagado != null)
      ? Number(p.interes_pagado)
      : (Number(p.monto_pago || 0) - Number(p.capital_pagado || 0)) || (saldo * tasaMensual);

    const abonoCapital = (p.capital_pagado != null)
      ? Number(p.capital_pagado)
      : Number(p.monto_pago || 0) - interesCalc;

    saldo = Math.max(0, saldo - (isFinite(abonoCapital) ? abonoCapital : 0));

    const fechaMostrar = p.fecha_pago || p.fecha_programada;
    const totalPagado = p.monto_pagado != null ? Number(p.monto_pagado) : 0;

    rows.push([
      p.numero_pago,
      "",
      "",
      fechaLarga(fechaMostrar),
      toMoney(interesCalc),
      toMoney(saldo),
      toMoney(totalPagado),
      ""
    ]);
  });

  // Construir hoja
  const aoa = [...header, ...rows];
  const ws = window.XLSX.utils.aoa_to_sheet(aoa);

  // Anchos
  ws['!cols'] = [
    { wch: 6 }, { wch: 18 }, { wch: 18 }, { wch: 18 },
    { wch: 14 }, { wch: 14 }, { wch: 18 }, { wch: 24 }
  ];

  const wb = window.XLSX.utils.book_new();
  window.XLSX.utils.book_append_sheet(wb, ws, "Hoja1");
  window.XLSX.writeFile(wb, `control_prestamo_${id_prestamo}.xlsx`);
}
