import React, { useState } from "react";
import AforeAfiliadoModal from "./AforeAfiliadoModal";

const AforeAfiliadosView = () => {
  const [openModal, setOpenModal] = useState(false);

  return (
    <div className="p-6 bg-slate-50 min-h-full">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-slate-800">
          Afiliados AFORE
        </h1>

        <button
          onClick={() => setOpenModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl font-medium shadow"
        >
          + Registrar nuevo afiliado
        </button>
      </div>

      {/* Aquí luego irá la tabla/listado de afiliados */}
      <div className="bg-white rounded-xl shadow p-6 text-slate-500">
        Aquí se mostrará el listado de afiliados AFORE.
      </div>

      {/* Modal */}
      {openModal && (
        <AforeAfiliadoModal
          onClose={() => setOpenModal(false)}
        />
      )}
    </div>
  );
};

export default AforeAfiliadosView;
