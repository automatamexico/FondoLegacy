import React from "react";

const money = (value) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(Number(value || 0));

const dateText = (value) => {
  if (!value) return "—";

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split("-").map(Number);

    return new Date(year, month - 1, day).toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? String(value)
    : date.toLocaleDateString("es-MX", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });
};

const dateTimeText = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? String(value)
    : date.toLocaleString("es-MX", {
        day: "2-digit",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
};

const ModalHistorialAportaciones = ({ afiliado, onClose }) => {
  if (!afiliado) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-3 md:p-6">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl max-h-[92vh] overflow-hidden">

        <div className="flex items-start justify-between gap-4 p-5 border-b border-slate-200">
          <div>
            <h3 className="text-xl font-bold text-slate-900">
              Historial de aportaciones
            </h3>

            <div className="mt-2 text-sm text-slate-600 space-y-1">
              <div>
                <span className="font-semibold">ID de Afiliado:</span>{" "}
                {afiliado.id_afiliado}
              </div>

              <div>
                <span className="font-semibold">Nombre:</span>{" "}
                {afiliado.nombreCompleto}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-3 py-2 bg-slate-100 rounded-lg shrink-0"
          >
            Cerrar
          </button>
        </div>

        <div className="p-4 max-h-[75vh] overflow-y-auto">
          {afiliado.movimientos.length === 0 ? (
            <p className="text-center text-slate-500 py-10">
              No tiene aportaciones registradas.
            </p>
          ) : (
            <div className="space-y-3">
              {afiliado.movimientos.map((mov, index) => (
                <div
                  key={
                    mov.id_ahorro_afore ||
                    mov.id_ahorro ||
                    `${mov.id_afiliado}-${mov.fecha_hora}-${index}`
                  }
                  className="bg-slate-50 border border-slate-200 rounded-xl p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs text-slate-500">
                        {mov.concepto || "Aportación"}
                      </p>

                      <p className="text-xl font-bold text-emerald-600">
                        {money(mov.ahorro_aportado)}
                      </p>
                    </div>

                    <span className="text-sm font-medium text-slate-700 text-right">
                      {mov.fecha_hora
                        ? dateTimeText(mov.fecha_hora)
                        : dateText(mov.fecha)}
                    </span>
                  </div>

                  {mov.notas && (
                    <p className="text-sm text-slate-600 mt-3">
                      {mov.notas}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default ModalHistorialAportaciones;
