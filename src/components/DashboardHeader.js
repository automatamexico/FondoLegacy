import React from 'react';

const DashboardHeader = ({ user, onLogout }) => {
  const displayName = user?.name || user?.nombre || user?.email || 'Usuario';
  const role = user?.role || user?.rol || '';

  return (
    <header className="bg-white border-b border-slate-200 px-3 md:px-6 py-3 md:py-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center space-x-3 min-w-0">
          <div
            className="w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: '#0ea15a' }}
          >
            <svg className="w-5 h-5 md:w-6 md:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
          </div>

          <div className="min-w-0">
            <h1 className="text-base md:text-xl font-bold text-slate-900 truncate">
              Fondo Legacy
            </h1>
            <p className="hidden sm:block text-xs md:text-sm text-slate-600 truncate">
              Sistema de Gestión Financiera
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-4 shrink-0">
          <div className="hidden sm:block text-right max-w-[180px] md:max-w-none">
            <p className="text-xs md:text-sm font-medium text-slate-900 truncate">
              {displayName}
            </p>
            <p className="text-[11px] md:text-xs text-slate-500 capitalize">
              {role}
            </p>
          </div>

          <div className="w-9 h-9 md:w-10 md:h-10 bg-slate-100 rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>

          <button
            onClick={onLogout}
            className="px-3 md:px-4 py-2 text-xs md:text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <span className="hidden sm:inline">Cerrar Sesión</span>
            <span className="sm:hidden">Salir</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
