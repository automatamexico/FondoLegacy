import React from 'react';

const SeleccionModulo = ({ onSelect }) => {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6">
      <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 text-center mb-16">
        SELECCIONA EL MODULO DE
        <br />
        TRABAJO
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 w-full max-w-5xl">
        <button
          onClick={() => onSelect('afore')}
          className="bg-green-300 hover:bg-green-400 transition-colors rounded-[2rem] border-2 border-black shadow-lg h-48 flex items-center justify-center"
        >
          <span className="text-5xl font-extrabold text-black">AFORE</span>
        </button>

        <button
          onClick={() => onSelect('fondo')}
          className="bg-green-300 hover:bg-green-400 transition-colors rounded-[2rem] border-2 border-black shadow-lg h-48 flex items-center justify-center text-center"
        >
          <span className="text-5xl font-extrabold text-black leading-tight">
            FONDO
            <br />
            DE
            <br />
            AHORRO
          </span>
        </button>
      </div>
    </div>
  );
};

export default SeleccionModulo;
