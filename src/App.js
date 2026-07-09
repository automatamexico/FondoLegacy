import React, { useState, useEffect } from 'react';
import LoginForm from './components/LoginForm';
import DashboardHeader from './components/DashboardHeader';
import DashboardSidebar from './components/DashboardSidebar';
import DashboardMain from './components/DashboardMain';
import SociosModule from './components/SociosModule';
import AhorrosModule from './components/AhorrosModule';
import PrestamosModule from './components/PrestamosModule';
import CentroDigitalModule from './components/CentroDigitalModule';
import UsuariosModule from './components/UsuariosModule';
import PagosModule from './components/PagosModule';
import ReportesModule from './components/ReportesModule';
import RetirosModule from './components/RetirosModule';
import MultasRenovacionesModule from './components/MultasRenovacionesModule';

import AforeDashboardMain from './components/AforeDashboardMain';
import AforeSidebar from './components/afore/AforeSidebar';
import AforeAfiliadosModule from './components/afore/AforeAfiliadosModule';

const SUPABASE_URL = 'https://ubfkhtkmlvutwdivmoff.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InViZmtodGttbHZ1dHdkaXZtb2ZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4MTc5NTUsImV4cCI6MjA2NjM5Mzk1NX0.c0iRma-dnlL29OR3ffq34nmZuj_ViApBTMG-6PEX_B4';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [activeSection, setActiveSection] = useState('dashboard');
  const [workMode, setWorkMode] = useState(null);
  const [userPermissions, setUserPermissions] = useState([]);

  const getUserRole = (user) => user?.role || user?.rol || '';
  const getUserId = (user) =>
    user?.id_usuario || user?.id || user?.usuario_id || user?.id_user || null;

  const isAdminUser = (user) => {
    const role = getUserRole(user);
    return role === 'admin' || role === 'administrador' || role === 'superadmin';
  };

  const loadUserPermissions = async (user) => {
    if (!user) return [];

    if (isAdminUser(user)) {
      setUserPermissions(['*']);
      return ['*'];
    }

    try {
      let userId = getUserId(user);

      if (!userId && user.email) {
        const userRes = await fetch(
          `${SUPABASE_URL}/rest/v1/usuarios_sistema?email=eq.${encodeURIComponent(user.email)}&select=id_usuario`,
          {
            headers: {
              'Content-Type': 'application/json',
              apikey: SUPABASE_ANON_KEY,
              Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
            },
          }
        );

        const userData = await userRes.json();

        if (userData?.length > 0) {
          userId = userData[0].id_usuario;

          const updatedUser = {
            ...user,
            id_usuario: userId,
          };

          setCurrentUser(updatedUser);
          localStorage.setItem('currentUser', JSON.stringify(updatedUser));
        }
      }

      if (!userId) {
        setUserPermissions([]);
        return [];
      }

      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/permisos_modulos_fondo?id_usuario=eq.${userId}&puede_ver=eq.true&select=modulo`,
        {
          headers: {
            'Content-Type': 'application/json',
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          },
        }
      );

      if (!res.ok) {
        setUserPermissions([]);
        return [];
      }

      const data = await res.json();
      const permisos = data.map((p) => p.modulo);

      setUserPermissions(permisos);

      if (permisos.length > 0 && !permisos.includes(activeSection)) {
        setActiveSection(permisos[0]);
      }

      return permisos;
    } catch (err) {
      console.error('Error cargando permisos:', err);
      setUserPermissions([]);
      return [];
    }
  };

  const canAccess = (moduleId) => {
    if (!currentUser) return false;
    if (isAdminUser(currentUser)) return true;
    if (userPermissions.includes('*')) return true;
    return userPermissions.includes(moduleId);
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('currentUser');

    if (storedUser) {
      const user = JSON.parse(storedUser);
      setCurrentUser(user);
      setIsAuthenticated(true);

      if (getUserRole(user) === 'usuario' && user.id_socio) {
        localStorage.setItem('id_socio', user.id_socio);
      }

      loadUserPermissions(user);
    }
  }, []);

  const handleLogin = async (user) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
    localStorage.setItem('currentUser', JSON.stringify(user));

    if (getUserRole(user) === 'usuario' && user.id_socio) {
      localStorage.setItem('id_socio', user.id_socio);
    } else {
      localStorage.removeItem('id_socio');
    }

    const permisos = await loadUserPermissions(user);

    setWorkMode(null);
    setActiveSection(permisos?.[0] || 'dashboard');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    setUserPermissions([]);
    setWorkMode(null);
    localStorage.removeItem('currentUser');
    localStorage.removeItem('id_socio');
    setActiveSection('dashboard');
  };

  const backToHomeSelect = () => {
    setWorkMode(null);
    setActiveSection('dashboard');
  };

  const AccessDenied = () => (
    <div className="p-8">
      <div className="bg-white rounded-2xl border border-red-200 p-6 text-center">
        <h2 className="text-xl font-bold text-red-600 mb-2">Acceso no autorizado</h2>
        <p className="text-slate-600">No tienes permiso para ver este módulo.</p>
      </div>
    </div>
  );

  const renderActiveSection = () => {
    const role = getUserRole(currentUser);

    if (currentUser && role === 'usuario') {
      const idSocio = localStorage.getItem('id_socio');
      if (!idSocio) {
        handleLogout();
        return null;
      }

      switch (activeSection) {
        case 'ahorros':
          return <AhorrosModule idSocio={idSocio} />;
        case 'prestamos':
          return <PrestamosModule idSocio={idSocio} />;
        case 'digital':
          return <CentroDigitalModule idSocio={idSocio} />;
        case 'pagos':
          return <PagosModule idSocio={idSocio} />;
        case 'multas-renovaciones':
          return <MultasRenovacionesModule idSocio={idSocio} />;
        default:
          return <AhorrosModule idSocio={idSocio} />;
      }
    }

    if (!canAccess(activeSection)) {
      return <AccessDenied />;
    }

    switch (activeSection) {
      case 'dashboard':
        return <DashboardMain />;
      case 'afore-dashboard':
        return <AforeDashboardMain />;
      case 'afore-afiliados':
        return <AforeAfiliadosModule />;
      case 'socios':
        return <SociosModule currentUser={currentUser} />;
      case 'ahorros':
        return <AhorrosModule />;
      case 'prestamos':
        return <PrestamosModule />;
      case 'digital':
        return <CentroDigitalModule />;
      case 'usuarios':
        return <UsuariosModule />;
      case 'pagos':
        return <PagosModule />;
      case 'retiros':
        return <RetirosModule />;
      case 'reportes':
        return <ReportesModule />;
      case 'multas-renovaciones':
        return <MultasRenovacionesModule />;
      default:
        return <DashboardMain />;
    }
  };

  if (!isAuthenticated) {
    return <LoginForm onLogin={handleLogin} />;
  }

  if (isAuthenticated && !workMode) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white px-4">
        <h1 className="text-3xl md:text-4xl font-extrabold mb-12 text-black text-center">
          SELECCIONA EL MÓDULO DE<br />TRABAJO
        </h1>

        <div className="flex flex-col md:flex-row gap-6 md:gap-20 w-full md:w-auto max-w-md md:max-w-none">
          <button
            onClick={() => {
              setWorkMode('afore');
              setActiveSection('afore-dashboard');
            }}
            className="px-10 py-6 rounded-2xl bg-green-600 text-white text-2xl font-bold hover:bg-green-700"
          >
            AFORE
          </button>

          <button
            onClick={() => {
              setWorkMode('fondo');
              setActiveSection(userPermissions?.[0] || 'dashboard');
            }}
            className="px-10 py-6 rounded-2xl bg-blue-600 text-white text-2xl font-bold hover:bg-blue-700"
          >
            FONDO DE AHORRO
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      <DashboardHeader user={currentUser} onLogout={handleLogout} />

      <div className="flex h-[calc(100vh-72px)]">
        {workMode === 'afore' ? (
          <AforeSidebar
            activeSection={activeSection}
            onSectionChange={setActiveSection}
            onBackToHome={backToHomeSelect}
            currentUser={currentUser}
            userPermissions={userPermissions}
          />
        ) : (
          <DashboardSidebar
            activeSection={activeSection}
            onSectionChange={setActiveSection}
            currentUser={currentUser}
            userPermissions={userPermissions}
          />
        )}

        <main className="flex-1 overflow-y-auto">
          {renderActiveSection()}
        </main>
      </div>
    </div>
  );
}

export default App;
