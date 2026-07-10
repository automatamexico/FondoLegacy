import React from 'react';

const AforeSidebar = ({ activeSection, onSectionChange, onBackToHome }) => {
  const menuItems = [
    { id: 'afore-dashboard', name: 'Control de AFORE' },
    { id: 'afore-afiliados', name: 'Afiliados AFORE' },
  ];

  return (
    <aside className="w-full md:w-64 bg-white md:border-r border-slate-200 md:h-full shrink-0">
      <nav className="p-4">

        <button
          onClick={onBackToHome}
          className="w-full flex items-center gap-2 px-4 py-3 rounded-xl text-left text-slate-700 hover:bg-slate-50 mb-4"
        >
          <span className="text-xl">‹</span>
          <span className="font-medium">Regresar al Inicio</span>
        </button>

        {/* Escritorio */}
        <div className="hidden md:flex flex-col gap-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              className={`w-full px-4 py-3 rounded-xl text-left transition-all ${
                activeSection === item.id
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <span className="font-medium">{item.name}</span>
            </button>
          ))}
        </div>

        {/* Móvil */}
        <div className="grid grid-cols-2 gap-2 md:hidden">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              className={`px-3 py-3 rounded-xl text-center text-sm transition-all ${
                activeSection === item.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-700'
              }`}
            >
              {item.name}
            </button>
          ))}
        </div>

      </nav>
    </aside>
  );
};

export default AforeSidebar;
