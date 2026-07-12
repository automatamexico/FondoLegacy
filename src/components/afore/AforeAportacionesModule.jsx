import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../../supabaseClient";
import ModalRegistrarAportacion from "./ModalRegistrarAportacion";
import ModalHistorialAportaciones from "./ModalHistorialAportaciones";

const emptyForm = {
  id_afiliado: "",
  ahorro_aportado: "",
  fecha: new Date().toISOString().slice(0, 10),
  concepto: "Aportación",
  notas: "",
};

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
const AforeAportacionesModule = () => {
  const [afiliados, setAfiliados] = useState([]);
  const [aportaciones, setAportaciones] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  const [search, setSearch] = useState("");
  const [showRegister, setShowRegister] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedAffiliate, setSelectedAffiliate] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const loadData = async () => {
    setLoading(true);
    setError("");

    try {
      const [
        { data: affiliatesData, error: affiliatesError },
        { data: contributionsData, error: contributionsError },
      ] = await Promise.all([
        supabase
          .from("afore_afiliados")
          .select(
            "id_afiliado,nombre,apellido_paterno,apellido_materno,email,telefono,estatus,foto_url"
          )
          .order("nombre", { ascending: true }),

        supabase
          .from("ahorro_afore")
          .select("*")
          .order("fecha_hora", { ascending: false }),
      ]);

      if (affiliatesError) throw affiliatesError;
      if (contributionsError) throw contributionsError;

      setAfiliados(affiliatesData || []);
      setAportaciones(contributionsData || []);
    } catch (err) {
      console.error("Error cargando aportaciones AFORE:", err);
      setError(
        err?.message || "No se pudieron cargar las aportaciones AFORE."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!toast) return;

    const timer = setTimeout(() => setToast(""), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  const affiliateSummary = useMemo(() => {
    return afiliados.map((affiliate) => {
      const movements = aportaciones.filter(
        (item) =>
          String(item.id_afiliado) === String(affiliate.id_afiliado)
      );

      const total = movements.reduce(
        (sum, item) => sum + Number(item.ahorro_aportado || 0),
        0
      );

      return {
        ...affiliate,
        nombreCompleto: `${affiliate.nombre || ""} ${
          affiliate.apellido_paterno || ""
        } ${affiliate.apellido_materno || ""}`
          .replace(/\s+/g, " ")
          .trim(),
        total,
        movimientos: movements,
        ultimaAportacion: movements[0] || null,
      };
    });
  }, [afiliados, aportaciones]);

  const filteredAffiliates = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) return affiliateSummary;

    return affiliateSummary.filter((item) => {
      return (
        String(item.id_afiliado).includes(term) ||
        item.nombreCompleto.toLowerCase().includes(term) ||
        String(item.email || "").toLowerCase().includes(term)
      );
    });
  }, [affiliateSummary, search]);

  const totalSavings = useMemo(
    () =>
      aportaciones.reduce(
        (sum, item) => sum + Number(item.ahorro_aportado || 0),
        0
      ),
    [aportaciones]
  );

  const affiliatesWithSavings = useMemo(
    () => affiliateSummary.filter((item) => item.total !== 0).length,
    [affiliateSummary]
  );

  const openRegister = (affiliateId = "") => {
    setError("");

    setForm({
      ...emptyForm,
      id_afiliado: affiliateId ? String(affiliateId) : "",
      fecha: new Date().toISOString().slice(0, 10),
    });

    setShowRegister(true);
  };

  const closeRegister = () => {
    if (saving) return;

    setShowRegister(false);
    setForm(emptyForm);
    setError("");
  };

  const saveContribution = async () => {
    setError("");

    const amount = Number(form.ahorro_aportado);

    if (!form.id_afiliado) {
      setError("Selecciona un afiliado.");
      return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      setError("La aportación debe ser mayor a cero.");
      return;
    }

    if (!form.fecha) {
      setError("Selecciona la fecha de la aportación.");
      return;
    }

    setSaving(true);

    try {
     const ahora = new Date();

const horaLocal =
  `${String(ahora.getHours()).padStart(2, "0")}:` +
  `${String(ahora.getMinutes()).padStart(2, "0")}:` +
  `${String(ahora.getSeconds()).padStart(2, "0")}`;

const payload = {
  id_afiliado: Number(form.id_afiliado),
  ahorro_aportado: amount,
  fecha: form.fecha,
  fecha_hora: `${form.fecha}T${horaLocal}-06:00`,
  concepto: "Aportación",
  notas: form.notas.trim() || null,
};

      const { data, error: insertError } = await supabase
        .from("ahorro_afore")
        .insert([payload])
        .select("*")
        .single();

      if (insertError) throw insertError;

      setAportaciones((prev) => [data, ...prev]);
      setToast("Aportación registrada correctamente.");
      setShowRegister(false);
      setForm(emptyForm);
      setError("");
    } catch (err) {
      console.error("Error registrando aportación:", err);
      setError(err?.message || "No se pudo registrar la aportación.");
    } finally {
      setSaving(false);
    }
  };

  const openHistory = (affiliate) => {
    setSelectedAffiliate(affiliate);
    setShowHistory(true);
  };

  return (
    <div className="p-3 md:p-6 space-y-6 bg-slate-50 min-h-full">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900">
            Aportaciones AFORE
          </h2>

          <p className="text-slate-600 mt-1">
            Registra y consulta el ahorro de cada afiliado.
          </p>
        </div>

        <button
          type="button"
          onClick={() => openRegister()}
          className="w-full md:w-auto px-5 py-3 bg-emerald-600 text-white rounded-xl font-semibold shadow hover:bg-emerald-700"
        >
          + Registrar aportación
        </button>
      </div>

      {error && !showRegister && (
        <div className="bg-red-100 border border-red-200 text-red-700 p-3 rounded-xl">
          {error}
        </div>
      )}

      {toast && (
        <div className="fixed top-24 right-4 z-[9999] bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-xl">
          {toast}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <p className="text-sm text-slate-500">
            Afiliados con aportaciones
          </p>

          <p className="text-3xl font-bold text-emerald-600 mt-1">
            {affiliatesWithSavings}
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <p className="text-sm text-slate-500">
            Ahorro acumulado AFORE
          </p>

          <p className="text-3xl font-bold text-blue-600 mt-1">
            {money(totalSavings)}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-4 md:p-6 shadow-sm">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por ID, nombre o correo..."
          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />

        {loading ? (
          <div className="py-12 text-center text-slate-500">
            Cargando aportaciones...
          </div>
        ) : filteredAffiliates.length === 0 ? (
          <div className="py-12 text-center text-slate-500">
            No se encontraron afiliados.
          </div>
        ) : (
          <>
            <div className="md:hidden mt-5 space-y-3">
              {filteredAffiliates.map((affiliate) => (
                <div
                  key={affiliate.id_afiliado}
                  className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4"
                >
                 
<div className="space-y-3">
  <div>
    <p className="text-xs text-slate-500">
      ID de Afiliado
    </p>

    <p className="font-semibold text-slate-900">
      {affiliate.id_afiliado}
    </p>
  </div>

  <div>
    <p className="text-xs text-slate-500">
      Nombre
    </p>

    <p className="font-semibold text-slate-900">
      {affiliate.nombreCompleto}
    </p>
  </div>
</div>

                  <div>
                    <p className="text-xs text-slate-500">
                      Ahorro acumulado
                    </p>

                    <p className="text-2xl font-bold text-emerald-600">
                      {money(affiliate.total)}
                    </p>
                  </div>

                 <div>
  <p className="text-xs text-slate-500">
    Última aportación
  </p>

  {affiliate.ultimaAportacion ? (
    <div className="mt-1 space-y-1">
      <p className="font-semibold text-slate-900">
        {money(affiliate.ultimaAportacion.ahorro_aportado)}
      </p>

      <p className="text-sm text-slate-700">
        {affiliate.ultimaAportacion.fecha_hora
          ? dateTimeText(affiliate.ultimaAportacion.fecha_hora)
          : dateText(affiliate.ultimaAportacion.fecha)}
      </p>
    </div>
  ) : (
    <p className="font-medium text-slate-900">
      Sin aportaciones
    </p>
  )}
</div>
                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => openHistory(affiliate)}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg"
                    >
                      Ver historial
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        openRegister(affiliate.id_afiliado)
                      }
                      className="w-full px-4 py-2 bg-emerald-600 text-white rounded-lg"
                    >
                      Registrar aportación
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="hidden md:block mt-5 overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-700">
                    <th className="px-3 py-3">ID</th>
                    <th className="px-3 py-3">Nombre</th>
                    <th className="px-3 py-3">
                      Ahorro acumulado
                    </th>
                    <th className="px-3 py-3">
                      Última aportación
                    </th>
                    <th className="px-3 py-3">Acciones</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredAffiliates.map((affiliate) => (
                    <tr
                      key={affiliate.id_afiliado}
                      className="border-b border-slate-100"
                    >
                      <td className="px-3 py-3">
                        {affiliate.id_afiliado}
                      </td>

                      <td className="px-3 py-3 font-medium">
                        {affiliate.nombreCompleto}
                      </td>

                      <td className="px-3 py-3 font-bold text-emerald-600">
                        {money(affiliate.total)}
                      </td>

                      <td className="px-3 py-3">
                        {affiliate.ultimaAportacion
                          ? `${money(
                              affiliate.ultimaAportacion.ahorro_aportado
                            )} · ${dateText(
                              affiliate.ultimaAportacion.fecha
                            )}`
                          : "Sin aportaciones"}
                      </td>

                      <td className="px-3 py-3">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => openHistory(affiliate)}
                            className="px-3 py-2 bg-blue-600 text-white rounded-lg"
                          >
                            Ver historial
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              openRegister(affiliate.id_afiliado)
                            }
                            className="px-3 py-2 bg-emerald-600 text-white rounded-lg"
                          >
                            Registrar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {showRegister && (
        <ModalRegistrarAportacion
          afiliados={affiliateSummary}
          form={form}
          setForm={setForm}
          onClose={closeRegister}
          onSave={saveContribution}
          saving={saving}
          error={error}
        />
      )}

      {showHistory && selectedAffiliate && (
        <ModalHistorialAportaciones
          afiliado={selectedAffiliate}
          onClose={() => {
            setShowHistory(false);
            setSelectedAffiliate(null);
          }}
        />
      )}
    </div>
  );
};


export default AforeAportacionesModule;
