import React, { useState } from 'react';

const AforeAfiliadosView = () => {
  const [open, setOpen] = useState(false);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Afiliados AFORE</h1>

      <button
        onClick={() => setOpen(true)}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg"
      >
        + Registrar nuevo afiliado
      </button>

      {open && (
        <div className="mt-6 p-6 border rounded-lg bg-white">
          <p>Aquí va el modal que ya construimos.</p>
        </div>
      )}
    </div>
  );
};

export default AforeAfiliadosView;
