import React from 'react';

const DashboardSidebar = ({
  activeSection,
  onSectionChange,
  currentUser,
  userPermissions = []
}) => {
  const role = currentUser?.role || currentUser?.rol || '';

  const isAdmin =
    role === 'admin' ||
    role === 'administrador' ||
    role === 'superadmin';

  const canView = (moduleId) => {
    if (isAdmin) return true;
    if (userPermissions.includes('*')) return true;
    return userPermissions.includes(moduleId);
  };

  const menuItems = [
    { id: 'dashboard', name: 'Tablero', icon: '📊' },
    { id: 'socios', name: 'Socios', icon: '👥' },
    { id: 'multas-renovaciones', name: 'Multas y Renovaciones', icon: '📅' },
    { id: 'ahorros', name: 'Ahorros', icon: '💰' },
    { id: 'prestamos', name: 'Préstamos', icon: '💳' },
    { id: 'pagos', name: 'Pagos', icon: '🏦' },
    { id: 'retiros', name: 'Retiros', icon: '📤' },
    { id: 'digital', name: 'Centro Digital', icon: '💻' },
    { id: 'reportes', name: 'Reportes', icon: '📄' },
    { id: 'usuarios', name: 'Control Usuarios', icon: '⚙️' }
  ];

  const visibleItems = menuItems.filter((item) => canView(item.id));

  return (
    <aside className="w-full md:w-64 bg-white border-b md:border-b-0 md:border-r border-slate-200 md:h-full">
      <nav className="p-3 md:p-4 flex md:block gap-2 md:space-y-2 overflow-x-auto md:overflow-x-visible">
        {visibleItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onSectionChange(item.id)}
            className={`min-w-max md:min-w-0 md:w-full flex items-center space-x-2 md:space-x-3 px-4 py-3 rounded-xl text-left transition-all ${
              activeSection === item.id
                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <span className="text-lg">{item.icon}</span>
            <span className="font-medium text-sm md:text-base">{item.name}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
};

export default DashboardSidebar;
