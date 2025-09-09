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

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [activeSection, setActiveSection] = useState('dashboard');

  // Cargar el usuario desde localStorage al inicio
  useEffect(() => {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      setCurrentUser(user);
      setIsAuthenticated(true);
      // Si el usuario es 'usuario' y tiene id_socio, guardarlo en localStorage
      if (user.role === 'usuario' && user.id_socio) {
        localStorage.setItem('id_socio', user.id_socio);
      }
    }
  }, []);

  const handleLogin = (user) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
    localStorage.setItem('currentUser', JSON.stringify(user)); // Guardar en localStorage

    // Si el usuario es 'usuario', guardar su id_socio en localStorage
    if (user.role === 'usuario' && user.id_socio) {
      localStorage.setItem('id_socio', user.id_socio);
    } else {
      localStorage.removeItem('id_socio'); // Asegurarse de que no quede id_socio si no es usuario
    }

    // Redirigir según el rol
    if (user.role === 'admin') {
      setActiveSection('dashboard'); // O la sección por defecto para admin
    } else if (user.role === 'usuario') {
      setActiveSection('ahorros'); // Redirigir a ahorros para usuarios
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    localStorage.removeItem('currentUser'); // Limpiar localStorage
    localStorage.removeItem('id_socio'); // Limpiar id_socio de localStorage
    setActiveSection('dashboard');
  };

  const renderActiveSection = () => {
    // Si el usuario no es admin, restringir acceso a ciertos módulos
    if (currentUser && currentUser.role === 'usuario') {
      const idSocio = localStorage.getItem('id_socio');
      if (!idSocio) {
        // Si no hay id_socio en localStorage para un usuario, redirigir al login
        handleLogout(); // Forzar logout para que se muestre el login
        return null; // No renderizar nada hasta que se redirija
      }

      switch (activeSection) {
        case 'ahorros':
          return <AhorrosModule idSocio={idSocio} />;
        case 'prestamos':
          return <PrestamosModule idSocio={idSocio} />;
        case 'digital':
          return <CentroDigitalModule idSocio={idSocio} />; // Si CentroDigital también necesita filtrar por socio
        case 'pagos':
          return <PagosModule idSocio={idSocio} />; // Si Pagos también necesita filtrar por socio
        default:
          return <AhorrosModule idSocio={idSocio} />; // Redirigir a una vista permitida
      }
    }

    // Para admin o si no hay restricciones de rol
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
          currentUser={currentUser} // Pasar el usuario actual al sidebar para control de visibilidad
        />
        <main className="flex-1 overflow-y-auto">
          {renderActiveSection()}
        </main>
      </div>
    </div>
  );
}

export default App;