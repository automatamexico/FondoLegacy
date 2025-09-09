export function convertirFechaHoraLocal(fechaUTC) {
  try {
    const dateString = fechaUTC.endsWith('Z') || fechaUTC.includes('+') || fechaUTC.includes('-') ? fechaUTC : `${fechaUTC}Z`;
    const utcDate = new Date(dateString);

    const opcionesFecha = {
      timeZone: 'America/Mexico_City',
      year: 'numeric',
      month: 'long',
      day: '2-digit'
    };

    const opcionesHora = {
      timeZone: 'America/Mexico_City',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false // Asegura el formato de 24 horas
    };

    const fechaFormateada = new Intl.DateTimeFormat('es-MX', opcionesFecha).format(utcDate);
    const horaFormateada = new Intl.DateTimeFormat('es-MX', opcionesHora).format(utcDate);

    // Reorganizar para "dd/Mes/yyyy"
    const partesFecha = fechaFormateada.split(' ');
    const dia = partesFecha[0].replace('.', ''); // Eliminar el punto si existe
    const mes = partesFecha[2]; // El mes ya viene como nombre
    const anio = partesFecha[4];

    return {
      fecha: `${dia}/${mes}/${anio}`,
      hora: horaFormateada
    };
  } catch (error) {
    console.error('Error al convertir fecha y hora local:', fechaUTC, error);
    return {
      fecha: '--/--/----',
      hora: '--:--:--'
    };
  }
}