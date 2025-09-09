import React from 'react';

const LOGO_URL =
  'https://ubfkhtkmlvutwdivmoff.supabase.co/storage/v1/object/public/Logos/LOGO_OK.png';

const DashboardHeader = ({ user, onLogout }) => {
  return (
    <header className="bg-white border-b border-slate-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {/* Logo igual al del login */}
          <div className="w-10 h-10 rounded-xl bg-white ring-2 ring-[#0ea15a] flex items-center justify-center">
            <img
              src={LOGO_URL}
              alt="Fondo Legacy"
              className="w-8 h-8 object-contain"
            />
          </div>

          <div>
            <h1 className="text-xl font-bold text-slate-900">Fondo Legacy</h1>
            <p className="text-sm text-slate-600">Sistema de Gestión Financiera</p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="text-right">
            <p className="text-sm font-medium text-slate-900">{user.name}</p>
            <p className="text-xs text-slate-500 capitalize">{user.role}</p>
          </div>
          <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <button
            onClick={onLogout}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Cerrar Sesión
          </button>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;

