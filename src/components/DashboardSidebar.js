import React from 'react';

const DashboardSidebar = ({ activeSection, onSectionChange, workMode }) => {
  const itemsFondo = [
    { id: 'dashboard', name: 'Tablero' },
    { id: 'socios', name: 'Socios' },
    { id: 'prestamos', name: 'Préstamos' },
    { id: 'pagos', name: 'Pagos' },
  ];

  const itemsAfore = [
    { id: 'afore-dashboard', name: 'Control de AFORE' },
    { id: 'afore-afiliados', name: 'Afiliados AFORE' },
  ];

  const menuItems = workMode === 'afore' ? itemsAfore : itemsFondo;

  return (
    <aside className="w-64 bg-white border-r h-full">
      <nav className="p-4 space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onSectionChange(item.id)}
            className={`w-full text-left px-4 py-3 rounded-xl transition ${
              activeSection === item.id
                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            {item.name}
          </button>
        ))}
      </nav>
    </aside>
  );
};

export default DashboardSidebar;
