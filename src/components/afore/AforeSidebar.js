import React from 'react';

const AforeSidebar = ({ activeSection, onSectionChange, onBackToHome }) => {
  const menuItems = [
    { id: 'afore-dashboard', name: 'Control de AFORE' },
    { id: 'afore-afiliados', name: 'Afiliados AFORE' },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 h-full">
      <nav className="p-4 space-y-3">
        <button
          onClick={onBackToHome}
          className="w-full flex items-center gap-2 px-4 py-3 rounded-xl text-left text-slate-700 hover:bg-slate-50"
        >
          <span className="text-xl">‹</span>
          <span className="font-medium">Regresar al Inicio</span>
        </button>

        <div className="pt-2 space-y-2">
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
      </nav>
    </aside>
  );
};

export default AforeSidebar;
