import React from 'react';

const DashboardHeader = ({ user, onLogout }) => {
  const displayName = user?.name || user?.nombre || user?.email || 'Usuario';
  const role = user?.role || user?.rol || '';

  return (
    <header className="bg-white border-b border-slate-200 px-3 md:px-6 py-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center space-x-3 min-w-0">
          <div
            className="w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: '#0ea15a' }}
          >
            <span className="text-white font-bold">$</span>
          </div>

          <div className="min-w-0">
            <h1 className="text-sm md:text-xl font-bold text-slate-900 truncate">
              Fondo Legacy
            </h1>
            <p className="hidden md:block text-sm text-slate-600 truncate">
              Sistema de Gestión Financiera
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="hidden sm:block text-right max-w-[150px]">
            <p className="text-xs md:text-sm font-medium text-slate-900 truncate">
              {displayName}
            </p>
            <p className="text-[11px] text-slate-500 capitalize">
              {role}
            </p>
          </div>

          <div className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>

          <button
            onClick={onLogout}
            className="px-2 md:px-4 py-2 text-xs md:text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Salir
          </button>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
