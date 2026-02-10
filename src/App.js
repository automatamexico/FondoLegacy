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

// AFORE
import AforeDashboardMain from './components/AforeDashboardMain';
import AforeSidebar from './components/afore/AforeSidebar';
import AforeAfiliadosView from './components/afore/AforeAfiliadosView';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [activeSection, setActiveSection] = useState('dashboard');
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

    setWorkMode(null);
    setActiveSection('dashboard');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    setWorkMode(null);
    localStorage.removeItem('currentUser');
    localStorage.removeItem('id_socio');
    setActiveSection('dashboard');
  };

  const backToHomeSelect = () => {
    setWorkMode(null);
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

      // AFORE (aislado)
      case 'afore-dashboard':
        return <AforeDashboardMain />;
      case 'afore-afiliados':
        return <AforeAfiliadosView />;

      // Fondo (intacto)
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

  // Login
  if (!isAuthenticated) {
    return <LoginForm onLogin={handleLogin} />;
  }

  // Pantalla de selección de módulo
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
            className="px-10 py-6 rounded-2xl bg-green-600 text-white text-2xl font-bold hover:bg-green-700"
          >
            AFORE
          </button>

          <button
            onClick={() => {
              setWorkMode('fondo');
              setActiveSection('dashboard');
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

      <div className="flex h-[calc(100vh-80px)]">
        {workMode === 'afore' ? (
          <AforeSidebar
            activeSection={activeSection}
            onSectionChange={setActiveSection}
            onBackToHome={backToHomeSelect}
          />
        ) : (
          <DashboardSidebar
            activeSection={activeSection}
            onSectionChange={setActiveSection}
            currentUser={currentUser}
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
