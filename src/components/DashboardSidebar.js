import React from 'react';

const DashboardSidebar = ({ activeSection, onSectionChange, workMode }) => {
  const menuItems = [
    {
      id: 'dashboard',
      name: workMode === 'afore' ? 'Control de AFORE' : 'Tablero',
    },
  ];

  // 🔹 Submenú SOLO para AFORE
  if (workMode === 'afore') {
    menuItems.push({
      id: 'afore-afiliados',
      name: 'Afiliados AFORE',
    });
  }

  return (
    <aside className="w-64 bg-white border-r border-slate-200 h-full">
      <nav className="p-4 space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onSectionChange(item.id)}
            className={`w-full flex items-center px-4 py-3 rounded-xl text-left transition-all ${
              activeSection === item.id
                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <span className="font-medium">{item.name}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
};

export default DashboardSidebar;
