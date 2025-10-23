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


function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [activeSection, setActiveSection] = useState('dashboard');

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

    if (user.role === 'admin') {
      setActiveSection('dashboard');
    } else if (user.role === 'usuario') {
      setActiveSection('ahorros');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
    localStorage.removeItem('id_socio');
    setActiveSection('dashboard');
  };

  const renderActiveSection = () => {
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
        default:
          return <AhorrosModule idSocio={idSocio} />;
      }
    }

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
      default:
        return <DashboardMain />;
    }
  };

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
        />
        <main className="flex-1 overflow-y-auto">
          {renderActiveSection()}
        </main>
      </div>
    </div>
  );
}

export default App;




