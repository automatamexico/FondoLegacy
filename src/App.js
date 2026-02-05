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

// ⬇️ NUEVO dashboard exclusivo AFORE
import AforeDashboardMain from './components/AforeDashboardMain';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [activeSection, setActiveSection] = useState('dashboard');

  // ⬇️ NUEVO: modo de trabajo
  const [workMode, setWorkMode] = useState(null); // 'fondo' | 'afore'

  useEffect(() => {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      setCurrentUser(user);
      setIsAuthenticated(true);
      if (user.role === 'usuario' && user.id_socio) {
        localStorage.setItem('id_socio', user.id_socio);
      }
    }
  }, []);

  const handleLogin = (user) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
    localStorage.setItem('currentUser', JSON.stringify(user));

    if (user.role === 'usuario' && user.id_socio) {
      localStorage.setItem('id_socio', user.id_socio);
    } else {
      localStorage.removeItem('id_socio');
    }

    // ⚠️ NO se define sección aquí, se elige después
    setActiveSection('dashboard');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    setWorkMode(null); // ⬅️ clave
    localStorage.removeItem('currentUser');
    localStorage.removeItem('id_socio');
    setActiveSection('dashboard');
  };

  const renderActiveSection = () => {
    // Vista de USUARIO (socio)
    if (currentUser && currentUser.role === 'usuario') {
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

    // Vista de ADMIN
    switch (activeSection) {
      case 'dashboard':
        return <DashboardMain />;
      case 'afore-dashboard':
        return <AforeDashboardMain />;
      case 'socios':
        return <SociosModule />;
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

  // ⬇️ PANTALLA DE SELECCIÓN (ANTES DEL DASHBOARD)
  if (isAuthenticated && !workMode) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white">
        <h1 className="text-4xl font-extrabold mb-12 text-black text-center">
          SELECCIONA EL MÓDULO DE<br />TRABAJO
        </h1>

        <div className="flex gap-20">
          <button
            onClick={() => {
              setWorkMode('afore');
              setActiveSection('afore-dashboard');
            }}
            className="w-80 h-44 bg-green-300 rounded-3xl text-4xl font-extrabold hover:scale-105 transition"
          >
            AFORE
          </button>

          <button
            onClick={() => {
              setWorkMode('fondo');
              setActiveSection('dashboard');
            }}
            className="w-80 h-44 bg-green-300 rounded-3xl text-4xl font-extrabold hover:scale-105 transition"
          >
            FONDO<br />DE AHORRO
          </button>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginForm onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <DashboardHeader user={currentUser} onLogout={handleLogout} />
      <div className="flex h-[calc(100vh-80px)]">
        <DashboardSidebar
          activeSection={activeSection}
  onSectionChange={setActiveSection}
  currentUser={currentUser}
  workMode={workMode}
        />
        <main className="flex-1 overflow-y-auto">
          {renderActiveSection()}
        </main>
      </div>
    </div>
  );
}

export default App;
