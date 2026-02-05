import React from "react";
import { useNavigate } from "react-router-dom";

const SeleccionModuloPage = () => {
  const navigate = useNavigate();

  const go = (mod) => {
    localStorage.setItem("workModule", mod);
    if (mod === "fondo") navigate("/fondo");
    if (mod === "afore") navigate("/afore");
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6">
      <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 text-center tracking-wide">
        SELECCIONA EL MODULO DE
        <br />
        TRABAJO
      </h1>

      <div className="mt-16 w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-10">
        <button
          onClick={() => go("afore")}
          className="bg-green-300 hover:bg-green-400 transition-colors rounded-[2rem] border-2 border-slate-900 shadow-lg h-44 md:h-56 flex items-center justify-center"
        >
          <span className="text-5xl md:text-6xl font-extrabold text-black">AFORE</span>
        </button>

        <button
          onClick={() => go("fondo")}
          className="bg-green-300 hover:bg-green-400 transition-colors rounded-[2rem] border-2 border-slate-900 shadow-lg h-44 md:h-56 flex items-center justify-center text-center px-6"
        >
          <span className="text-5xl md:text-6xl font-extrabold text-black leading-tight">
            FONDO
            <br />
            DE
            <br />
            AHORRO
          </span>
        </button>
      </div>

      <button
        onClick={() => { localStorage.removeItem("workModule"); }}
        className="mt-10 text-sm text-slate-500 hover:text-slate-700"
        title="Por si luego quieres forzar la selección otra vez"
      >
        (Tip: para volver a ver esta pantalla, borra la selección)
      </button>
    </div>
  );
};

export default SeleccionModuloPage;
