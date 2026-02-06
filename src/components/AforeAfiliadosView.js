import React, { useState } from 'react';
import AforeRegistrarAfiliadoModal from './AforeRegistrarAfiliadoModal';

const AforeAfiliadosView = () => {
  const [openModal, setOpenModal] = useState(false);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold text-slate-800">
        Afiliados AFORE
      </h1>

      <button
        onClick={() => setOpenModal(true)}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        + Registrar nuevo afiliado
      </button>

      <AforeRegistrarAfiliadoModal
        open={openModal}
        onClose={() => setOpenModal(false)}
      />
    </div>
  );
};

export default AforeAfiliadosView;
