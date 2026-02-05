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

// ⬇️ NUEVO
import SeleccionModulo from './components/SeleccionModulo';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [activeSection, setActiveSection] = useState('dashboard');
  const [workModule, setWorkModule] = useState(null); // ⬅️ NUEVO

  useEffect(() => {
    const storedUser = localStorage.getItem('currentUser');
    const storedModule = localStorage.getItem('workModule');

    if (storedUser) {
      const user = JSON.parse(storedUser);
      setCurrentUser(user);
      setIsAuthenticated(true);
      setWorkModule(storedModule);

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

    // ⬇️ NO seleccionamos módulo aquí, se fuerza pantalla de selección
    setActiveSection('dashboard');
    setWorkModule(null);
    localStorage.removeItem('workModule');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
    localStorage.removeItem('id_socio');
    localStorage.removeItem('workModule');
    setActiveSection('dashboard');
    setWorkModule(null);
  };

  const handleSelectModule = (module) => {
    localStorage.setItem('workModule', module);
    setWorkModule(module);

    // comportamiento inicial
    if (module === 'fondo') {
      setActiveSection(currentUser?.role === 'usuario' ? 'ahorros' : 'dashboard');
    }

    if (module === 'afore') {
      setActiveSection('dashboard'); // después aquí entra tu módulo AFORE
    }
  };

  const renderActiveSection = () => {
    // Vista de USUARIO
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

    // Vista ADMIN
    switch (activeSection) {
      case 'dashboard':
        return <DashboardMain />;
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

  if (!isAuthenticated) {
    return <LoginForm onLogin={handleLogin} />;
  }

  // ⬇️ NUEVO: si ya inició sesión pero NO eligió módulo
  if (!workModule) {
    return <SeleccionModulo onSelect={handleSelectModule} />;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <DashboardHeader user={currentUser} onLogout={handleLogout} />
      <div className="flex h-[calc(100vh-80px)]">
        <DashboardSidebar
          activeSection={activeSection}
          onSectionChange={setActiveSection}
          currentUser={currentUser}
        />
        <main className="flex-1 overflow-y-auto">
          {renderActiveSection()}
        </main>
      </div>
    </div>
  );
}

export default App;
