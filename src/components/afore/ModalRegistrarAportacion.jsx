import React from "react";

const ModalRegistrarAportacion = ({
  afiliados = [],
  form,
  setForm,
  onClose,
  onSave,
  saving = false,
  error = "",
}) => {
  return (
    <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-3 md:p-6">
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl max-h-[92vh] overflow-y-auto">
        <div className="sticky top-0 z-10 bg-white flex items-center justify-between gap-4 p-5 border-b border-slate-200">
          <h3 className="text-xl font-bold text-slate-900">
            Registrar aportación AFORE
          </h3>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-3 py-2 bg-slate-100 rounded-lg disabled:opacity-50"
          >
            Cerrar
          </button>
        </div>

        <div className="p-5 space-y-4">
          {error && (
            <div className="bg-red-100 border border-red-200 text-red-700 p-3 rounded-xl">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm text-slate-700 mb-1">
              Afiliado
            </label>

            <select
              value={form.id_afiliado}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  id_afiliado: e.target.value,
                }))
              }
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl"
            >
              <option value="">Selecciona un afiliado...</option>

              {afiliados.map((item) => (
                <option
                  key={item.id_afiliado}
                  value={item.id_afiliado}
                >
                  #{item.id_afiliado} — {item.nombreCompleto}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-slate-700 mb-1">
              Monto de la aportación
            </label>

            <input
              type="number"
              min="0.01"
              step="0.01"
              inputMode="decimal"
              value={form.ahorro_aportado}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  ahorro_aportado: e.target.value,
                }))
              }
              placeholder="0.00"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-700 mb-1">
              Fecha de aportación
            </label>

            <input
              type="date"
              value={form.fecha}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  fecha: e.target.value,
                }))
              }
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-700 mb-1">
              Concepto
            </label>

            <input
              type="text"
              value={form.concepto}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  concepto: e.target.value,
                }))
              }
              placeholder="Aportación"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-700 mb-1">
              Notas
            </label>

            <textarea
              rows={3}
              value={form.notas}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  notas: e.target.value,
                }))
              }
              placeholder="Opcional"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 rounded-xl disabled:opacity-50"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={onSave}
              disabled={saving}
              className="flex-1 px-4 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-60"
            >
              {saving ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalRegistrarAportacion;
