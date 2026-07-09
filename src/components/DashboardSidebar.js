import React from 'react';

const DashboardSidebar = ({
  activeSection,
  onSectionChange,
  currentUser,
  userPermissions = [],
  mobileMenuOpen = false,
  onCloseMobileMenu
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

  const MenuContent = () => (
    <nav className="p-4 space-y-2">
      {visibleItems.map((item) => (
        <button
          key={item.id}
          onClick={() => onSectionChange(item.id)}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${
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
  );

  return (
    <>
      {/* Escritorio */}
      <aside className="hidden md:block w-64 bg-white border-r border-slate-200 h-full overflow-y-auto shrink-0">
        <MenuContent />
      </aside>

      {/* Fondo oscuro móvil */}
      {mobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black bg-opacity-40 z-40"
          onClick={onCloseMobileMenu}
        />
      )}

      {/* Menú móvil */}
      <aside
        className={`md:hidden fixed top-0 left-0 h-full w-72 bg-white z-50 shadow-2xl transform transition-transform duration-300 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-5 py-5 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Fondo Legacy</h2>
            <p className="text-xs text-slate-500">Menú principal</p>
          </div>

          <button
            onClick={onCloseMobileMenu}
            className="w-9 h-9 rounded-xl hover:bg-slate-100 text-slate-600"
          >
            ✕
          </button>
        </div>

        <MenuContent />
      </aside>
    </>
  );
};

export default DashboardSidebar;
