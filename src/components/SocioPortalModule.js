import React, { useEffect, useMemo, useState } from 'react';
import AhorrosModule from './AhorrosModule';
import PrestamosModule from './PrestamosModule';

const SUPABASE_URL = 'https://ubfkhtkmlvutwdivmoff.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InViZmtodGttbHZ1dHdkaXZtb2ZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4MTc5NTUsImV4cCI6MjA2NjM5Mzk1NX0.c0iRma-dnlL29OR3ffq34nmZuj_ViApBTMG-6PEX_B4';

const headers = {
  'Content-Type': 'application/json',
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
};

const money = (value) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(Number(value || 0));

const dateText = (value) => {
  if (!value) return 'Sin información';
  const raw = String(value).length <= 10 ? `${value}T00:00:00` : value;
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return 'Sin información';
  return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' });
};

const avatarFallback = (socio) => {
  const name = `${socio?.nombre || ''} ${socio?.apellido_paterno || ''}`.trim() || 'Socio';
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0f766e&color=fff&size=160`;
};

const SocioPortalModule = ({ currentUser, onLogout }) => {
  const idSocio = currentUser?.id_socio || localStorage.getItem('id_socio');
  const [active, setActive] = useState('inicio');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [socio, setSocio] = useState(null);
  const [ahorros, setAhorros] = useState([]);
  const [prestamos, setPrestamos] = useState([]);
  const [pagos, setPagos] = useState([]);
  const [afore, setAfore] = useState(null);

  useEffect(() => {
    const cargar = async () => {
      if (!idSocio) {
        setError('No se encontró el número de socio asociado a esta cuenta.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const socioRes = await fetch(
          `${SUPABASE_URL}/rest/v1/socios?id_socio=eq.${idSocio}&select=*`,
          { headers }
        );
        const socioData = await socioRes.json();
        const socioActual = socioData?.[0] || null;
        setSocio(socioActual);

        const [ahorrosRes, prestamosRes] = await Promise.all([
          fetch(`${SUPABASE_URL}/rest/v1/ahorros?id_socio=eq.${idSocio}&select=*&order=fecha.desc`, { headers }),
          fetch(`${SUPABASE_URL}/rest/v1/prestamos?id_socio=eq.${idSocio}&select=*&order=id_prestamo.desc`, { headers }),
        ]);

        const ahorrosData = await ahorrosRes.json();
        const prestamosData = await prestamosRes.json();
        setAhorros(Array.isArray(ahorrosData) ? ahorrosData : []);
        setPrestamos(Array.isArray(prestamosData) ? prestamosData : []);

        const idsPrestamos = (prestamosData || []).map((p) => p.id_prestamo).filter(Boolean);
        if (idsPrestamos.length > 0) {
          const pagosRes = await fetch(
            `${SUPABASE_URL}/rest/v1/pagos_prestamos?id_prestamo=in.(${idsPrestamos.join(',')})&select=*&order=fecha_programada.desc`,
            { headers }
          );
          const pagosData = await pagosRes.json();
          setPagos(Array.isArray(pagosData) ? pagosData : []);
        } else {
          setPagos([]);
        }

        if (socioActual?.email) {
          const aforeRes = await fetch(
            `${SUPABASE_URL}/rest/v1/afore_afiliados?email=eq.${encodeURIComponent(socioActual.email)}&select=*`,
            { headers }
          );
          const aforeData = await aforeRes.json();
          setAfore(aforeData?.[0] || null);
        }
      } catch (e) {
        setError('No fue posible cargar tu información. Intenta nuevamente.');
      } finally {
        setLoading(false);
      }
    };

    cargar();
  }, [idSocio]);

  const saldoAhorro = useMemo(
    () => ahorros.reduce((sum, item) => sum + Number(item.ahorro_aportado || 0), 0),
    [ahorros]
  );

  const prestamosActivos = useMemo(
    () => prestamos.filter((p) => !['liquidado', 'cancelado'].includes(String(p.estatus || '').toLowerCase())),
    [prestamos]
  );

  const proximoPago = useMemo(() => {
    return pagos
      .filter((p) => String(p.estatus || '').toLowerCase() !== 'pagado')
      .sort((a, b) => String(a.fecha_programada || '').localeCompare(String(b.fecha_programada || '')))[0] || null;
  }, [pagos]);

  const ultimoAhorro = ahorros[0] || null;
  const nombreCompleto = socio
    ? `${socio.nombre || ''} ${socio.apellido_paterno || ''} ${socio.apellido_materno || ''}`.replace(/\s+/g, ' ').trim()
    : currentUser?.name || 'Socio';

  const navItems = [
    { id: 'inicio', label: 'Inicio', icon: '⌂' },
    { id: 'ahorros', label: 'Ahorros', icon: '💰' },
    { id: 'prestamos', label: 'Préstamos', icon: '💳' },
    { id: 'pagos', label: 'Pagos', icon: '✓' },
    ...(afore ? [{ id: 'afore', label: 'AFORE', icon: '📈' }] : []),
    { id: 'perfil', label: 'Perfil', icon: '👤' },
  ];

  if (loading) {
    return <div className="min-h-screen bg-slate-100 flex items-center justify-center text-slate-600">Cargando tu portal…</div>;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-red-200 p-6 text-center max-w-md w-full">
          <p className="text-red-600 font-semibold">{error}</p>
          <button onClick={onLogout} className="mt-4 px-4 py-2 rounded-xl bg-slate-900 text-white">Cerrar sesión</button>
        </div>
      </div>
    );
  }

  const Inicio = () => (
    <div className="space-y-5">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-950 via-teal-900 to-emerald-700 text-white p-5 md:p-8 shadow-xl">
        <div className="absolute -right-16 -top-16 w-56 h-56 rounded-full bg-white/10" />
        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex items-center gap-4">
            <img src={socio?.foto_url || avatarFallback(socio)} alt="Socio" className="w-20 h-20 rounded-2xl object-cover border-2 border-white/40 shadow-lg" />
            <div>
              <p className="text-emerald-100 text-sm">Bienvenido a tu cuenta</p>
              <h1 className="text-2xl md:text-3xl font-bold">{nombreCompleto}</h1>
              <div className="mt-2 flex flex-wrap gap-2 text-sm">
                <span className="px-3 py-1 rounded-full bg-white/15">Socio #{socio?.id_socio}</span>
                <span className="px-3 py-1 rounded-full bg-white/15">Miembro desde {dateText(socio?.miembro_desde)}</span>
              </div>
            </div>
          </div>
          <div className="md:text-right">
            <p className="text-emerald-100 text-sm">Ahorro acumulado</p>
            <p className="text-3xl md:text-4xl font-extrabold">{money(saldoAhorro)}</p>
            <p className="text-emerald-100 text-xs mt-1">Saldo informativo de tu cuenta</p>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button onClick={() => setActive('ahorros')} className="text-left bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between"><span className="text-2xl">💰</span><span className="text-emerald-600">Ver →</span></div>
          <p className="mt-4 text-sm text-slate-500">Mi ahorro</p>
          <p className="text-2xl font-bold text-slate-900">{money(saldoAhorro)}</p>
          <p className="text-xs text-slate-500 mt-1">Última aportación: {ultimoAhorro ? money(ultimoAhorro.ahorro_aportado) : 'Sin movimientos'}</p>
        </button>

        <button onClick={() => setActive('prestamos')} className="text-left bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between"><span className="text-2xl">💳</span><span className="text-blue-600">Ver →</span></div>
          <p className="mt-4 text-sm text-slate-500">Préstamos activos</p>
          <p className="text-2xl font-bold text-slate-900">{prestamosActivos.length}</p>
          <p className="text-xs text-slate-500 mt-1">Consulta montos, plazos y estatus</p>
        </button>

        <button onClick={() => setActive('pagos')} className="text-left bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between"><span className="text-2xl">📅</span><span className="text-amber-600">Ver →</span></div>
          <p className="mt-4 text-sm text-slate-500">Próximo pago</p>
          <p className="text-2xl font-bold text-slate-900">{proximoPago ? money(proximoPago.monto_pago) : 'Sin pendientes'}</p>
          <p className="text-xs text-slate-500 mt-1">{proximoPago ? dateText(proximoPago.fecha_programada) : 'Tu cuenta está al corriente'}</p>
        </button>
      </div>

      {afore && (
        <button onClick={() => setActive('afore')} className="w-full text-left bg-gradient-to-r from-indigo-950 to-blue-800 text-white rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between gap-4">
            <div><p className="text-blue-200 text-sm">Tu AFORE</p><p className="text-xl font-bold">Consulta tu información para el retiro</p></div>
            <span className="text-2xl">→</span>
          </div>
        </button>
      )}
    </div>
  );

  const Pagos = () => (
    <div className="space-y-4">
      <div><h2 className="text-2xl font-bold text-slate-900">Mis pagos</h2><p className="text-slate-600">Historial y próximos pagos de tus préstamos.</p></div>
      {pagos.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center text-slate-500">No tienes pagos registrados.</div>
      ) : (
        <div className="space-y-3">
          {pagos.map((p) => {
            const pagado = String(p.estatus || '').toLowerCase() === 'pagado';
            return (
              <div key={p.id_pago} className="bg-white rounded-2xl border border-slate-200 p-4 md:p-5">
                <div className="flex items-start justify-between gap-3">
                  <div><p className="text-xs text-slate-500">Pago #{p.numero_pago}</p><p className="font-bold text-slate-900">{money(p.monto_pago)}</p></div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${pagado ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{pagado ? 'Pagado' : 'Pendiente'}</span>
                </div>
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                  <div><p className="text-slate-500">Fecha programada</p><p className="font-medium">{dateText(p.fecha_programada)}</p></div>
                  <div><p className="text-slate-500">Fecha de pago</p><p className="font-medium">{p.fecha_pago ? dateText(p.fecha_pago) : '—'}</p></div>
                  <div><p className="text-slate-500">Forma de pago</p><p className="font-medium">{p.forma_pago || '—'}</p></div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  const Perfil = () => (
    <div className="space-y-4">
      <div><h2 className="text-2xl font-bold text-slate-900">Mi perfil</h2><p className="text-slate-600">Información asociada a tu cuenta.</p></div>
      <div className="bg-white rounded-2xl border border-slate-200 p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
        {[['Número de socio', socio?.id_socio], ['Nombre completo', nombreCompleto], ['Correo', socio?.email], ['Teléfono', socio?.telefono], ['Dirección', socio?.direccion], ['Código postal', socio?.cp], ['Fecha de nacimiento', dateText(socio?.fecha_nacimiento)], ['Miembro desde', dateText(socio?.miembro_desde)]].map(([label, value]) => (
          <div key={label}><p className="text-xs text-slate-500">{label}</p><p className="font-semibold text-slate-900 break-words">{value || 'Sin información'}</p></div>
        ))}
      </div>
    </div>
  );

  const Afore = () => (
    <div className="space-y-4">
      <div><h2 className="text-2xl font-bold text-slate-900">Mi AFORE</h2><p className="text-slate-600">Información de tu afiliación para el retiro.</p></div>
      <div className="bg-white rounded-2xl border border-slate-200 p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
        {afore ? Object.entries({ 'Número de afiliado': afore.id_afiliado, 'Nombre': `${afore.nombre || ''} ${afore.apellido_paterno || ''} ${afore.apellido_materno || ''}`, 'Correo': afore.email, 'Teléfono': afore.telefono, 'Estatus': afore.estatus }).map(([label, value]) => (
          <div key={label}><p className="text-xs text-slate-500">{label}</p><p className="font-semibold text-slate-900">{value || 'Sin información'}</p></div>
        )) : <p className="text-slate-500">No tienes una afiliación AFORE asociada.</p>}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-bold">FL</div><div><p className="font-bold text-slate-900 leading-tight">Fondo Legacy</p><p className="text-xs text-slate-500">Portal del socio</p></div></div>
          <button onClick={onLogout} className="px-3 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100">Salir</button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto flex">
        <aside className="hidden md:block w-64 shrink-0 p-5">
          <div className="bg-white rounded-2xl border border-slate-200 p-3 sticky top-20">
            {navItems.map((item) => <button key={item.id} onClick={() => setActive(item.id)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left mb-1 ${active === item.id ? 'bg-emerald-50 text-emerald-800 font-semibold' : 'text-slate-600 hover:bg-slate-50'}`}><span>{item.icon}</span>{item.label}</button>)}
          </div>
        </aside>

        <main className="flex-1 min-w-0 p-4 md:p-6 pb-24 md:pb-8">
          {active === 'inicio' && <Inicio />}
          {active === 'ahorros' && <AhorrosModule idSocio={idSocio} />}
          {active === 'prestamos' && <PrestamosModule idSocio={idSocio} />}
          {active === 'pagos' && <Pagos />}
          {active === 'afore' && <Afore />}
          {active === 'perfil' && <Perfil />}
        </main>
      </div>

      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-slate-200 px-2 py-2 shadow-2xl">
        <div className="flex justify-around overflow-x-auto">
          {navItems.map((item) => <button key={item.id} onClick={() => setActive(item.id)} className={`min-w-[64px] px-2 py-1 rounded-xl text-center ${active === item.id ? 'text-emerald-700 bg-emerald-50' : 'text-slate-500'}`}><span className="block text-lg">{item.icon}</span><span className="text-[10px] font-medium">{item.label}</span></button>)}
        </div>
      </nav>
    </div>
  );
};

export default SocioPortalModule;
