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
    <>
      {/* Escritorio */}
      <aside className="hidden md:block w-64 bg-white border-r border-slate-200 h-full">
        <nav className="p-4 space-y-2">
          {visibleItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left transition-all ${
                activeSection === item.id
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="font-medium">{item.name}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Móvil */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 shadow-lg">
        <div className="flex overflow-x-auto px-2 py-2 gap-2">
          {visibleItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              className={`min-w-[78px] flex flex-col items-center justify-center px-2 py-2 rounded-xl text-xs transition-all ${
                activeSection === item.id
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'text-slate-600'
              }`}
            >
              <span className="text-lg leading-none">{item.icon}</span>
              <span className="mt-1 font-medium truncate max-w-[70px]">
                {item.name}
              </span>
            </button>
          ))}
        </div>
      </nav>
    </>
  );
};

export default DashboardSidebar;
