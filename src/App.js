import React, { useState } from "react";
import DashboardHeader from "./components/DashboardHeader";
import DashboardSidebar from "./components/DashboardSidebar";
import DashboardMain from "./components/DashboardMain";
import SociosModule from "./components/SociosModule";
import AhorrosModule from "./components/AhorrosModule";
import PrestamosModule from "./components/PrestamosModule";
import CentroDigitalModule from "./components/CentroDigitalModule";
import UsuariosModule from "./components/UsuariosModule";
import PagosModule from "./components/PagosModule";
import LoginForm from "./components/LoginForm";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [activeSection, setActiveSection] = useState("dashboard");

  const handleLogin = (user) => {
    setIsAuthenticated(true);
    setCurrentUser(user);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
  };

  const renderActive = () => {
    switch (activeSection) {
      case "socios":
        return <SociosModule />;
      case "ahorros":
        return <AhorrosModule />;
      case "prestamos":
        return <PrestamosModule />;
      case "centro":
        return <CentroDigitalModule />;
      case "usuarios":
        return <UsuariosModule />;
      case "pagos":
        return <PagosModule />;
      default:
        return <DashboardMain />;
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen grid place-items-center bg-slate-100">
        <LoginForm onSuccess={handleLogin} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <DashboardHeader user={currentUser} onLogout={handleLogout} />
      <div className="flex flex-1">
        <DashboardSidebar
          activeSection={activeSection}
          onSectionChange={setActiveSection}
        />
        <main className="flex-1 p-6">{renderActive()}</main>
      </div>
    </div>
  );
}

export default App;
