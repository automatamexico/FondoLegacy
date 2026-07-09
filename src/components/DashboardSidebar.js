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
    { id: 'multas-renovaciones', name: 'Multas', icon: '📅' },
    { id: 'ahorros', name: 'Ahorros', icon: '💰' },
    { id: 'prestamos', name: 'Préstamos', icon: '💳' },
    { id: 'pagos', name: 'Pagos', icon: '🏦' },
    { id: 'retiros', name: 'Retiros', icon: '📤' },
    { id: 'digital', name: 'Digital', icon: '💻' },
    { id: 'reportes', name: 'Reportes', icon: '📄' },
    { id: 'usuarios', name: 'Usuarios', icon: '⚙️' }
  ];

  const visibleItems = menuItems.filter((item) => canView(item.id));

  return (
    <aside className="w-20 md:w-64 bg-white border-r border-slate-200 h-full overflow-y-auto shrink-0">
      <nav className="p-2 md:p-4 space-y-2">
        {visibleItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onSectionChange(item.id)}
            className={`w-full flex flex-col md:flex-row items-center md:space-x-3 px-2 md:px-4 py-3 rounded-xl text-center md:text-left transition-all ${
              activeSection === item.id
                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <span className="text-lg">{item.icon}</span>
            <span className="font-medium text-[11px] md:text-base leading-tight mt-1 md:mt-0">
              {item.name}
            </span>
          </button>
        ))}
      </nav>
    </aside>
  );
};

export default DashboardSidebar;
