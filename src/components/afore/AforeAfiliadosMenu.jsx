import React from "react";

const AforeAfiliadosMenu = ({ onNuevoAfiliado }) => {
  return (
    <div className="flex justify-end mb-6">
      <button
        onClick={onNuevoAfiliado}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
      >
        + Registrar nuevo afiliado
      </button>
    </div>
  );
};

export default AforeAfiliadosMenu;
