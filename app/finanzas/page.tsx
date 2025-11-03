"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Nav from "@/components/Nav";
import ProtectedPage from "@/components/ProtectedPage";
import UserHeader from "@/components/UserHeader";
import Toast from "@/components/Toast";
import ConfirmDialog from "@/components/ConfirmDialog";

type Movimiento = {
  id: string;
  tipo: string;
  monto: number;
  descripcion?: string | null;
  fecha: string;
};

type KpiData = {
  caja_actual?: number;
  capital?: number;
  utilidad?: number;
};

function KpiCards({ data }: { data: KpiData | null }) {
  if (!data) return null;
  const f = (n: number | undefined) => Number(n || 0).toLocaleString();

  return (
    <div className="grid sm:grid-cols-3 gap-4 mb-6">
      {[
        { label: "Caja", value: data.caja_actual },
        { label: "Capital", value: data.capital },
        { label: "Utilidad", value: data.utilidad },
      ].map((it) => (
        <div
          key={it.label}
          className="relative overflow-hidden rounded-2xl bg-white/60 dark:bg-gray-800/60 backdrop-blur-md border border-white/30 dark:border-white/10 p-5 shadow-lg"
        >
          <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">{it.label}</div>
          <div className="mt-2 text-3xl font-extrabold text-gray-900 dark:text-white">${f(it.value)}</div>
          <div className="absolute -right-6 -top-6 w-36 h-36 bg-gradient-to-br from-blue-200/30 dark:from-blue-400/10 to-transparent rounded-full opacity-60 pointer-events-none" />
        </div>
      ))}
    </div>
  );
}

const INITIAL_FORM = { tipo: "capital", monto: "", descripcion: "" };

export default function Page() {
  const router = useRouter();
  const [items, setItems] = useState<Movimiento[]>([]);
  const [form, setForm] = useState({ ...INITIAL_FORM });
  const [kpi, setKpi] = useState<KpiData | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({ tipo: "compra", monto: "", descripcion: "" });
  const [editRecord, setEditRecord] = useState<Movimiento | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "warning" | "info" } | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; onConfirm: () => void } | null>(null);

  const load = async () => {
    try {
      const r = await fetch("/api/movimientos", { credentials: "include" });
      if (r.status === 401 || r.status === 403) {
        router.replace("/login");
        return;
      }
      if (!r.ok) throw new Error("Error al cargar movimientos");
      const j = await r.json();
      setItems(j.data || []);
    } catch (error) {
      console.error(error);
    }
  };

  const loadKpis = async () => {
    try {
      const r = await fetch("/api/kpis", { credentials: "include" });
      if (r.status === 401 || r.status === 403) {
        router.replace("/login");
        return;
      }
      if (!r.ok) throw new Error("Error al cargar KPIs");
      const j = await r.json();
      setKpi(j.data || null);
    } catch (error) {
      console.error(error);
    }
  };

  const refreshData = async () => {
    await Promise.all([load(), loadKpis()]);
  };

  useEffect(() => {
    refreshData();
  }, []);

  async function submit(e: any) {
    e.preventDefault();
    if (isSubmitting) return; // Prevenir doble clic
    
    const montoNumber = Number(form.monto);
    if (!Number.isFinite(montoNumber) || montoNumber <= 0) {
      setToast({ message: "Ingresa un monto válido", type: "error" });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        tipo: form.tipo,
        monto: montoNumber,
        descripcion: form.descripcion.trim() ? form.descripcion.trim() : null,
      };

      const endpoint = "/api/movimientos";
      const method = editingId ? "PUT" : "POST";
      const body = editingId ? { id: editingId, ...payload } : payload;

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      if (res.status === 401 || res.status === 403) {
        router.replace("/login");
        return;
      }
      if (res.ok) {
        setForm({ ...INITIAL_FORM });
        setEditingId(null);
        await refreshData();
        setToast({ message: "Movimiento agregado exitosamente", type: "success" });
      } else {
        const err = await res.json().catch(() => ({ error: "Error" }));
        setToast({ message: err.error || "Error al guardar", type: "error" });
      }
    } finally {
      // Pequeño delay antes de permitir otro submit
      setTimeout(() => setIsSubmitting(false), 500);
    }
  }

  async function submitEdit(e: any) {
    e.preventDefault();
    if (!editingId) return;
    const montoNumber = Number(editForm.monto);
    if (!Number.isFinite(montoNumber) || montoNumber <= 0) {
      setToast({ message: "Ingresa un monto válido", type: "error" });
      return;
    }
    const body = {
      id: editingId,
      tipo: editForm.tipo,
      monto: montoNumber,
      descripcion: editForm.descripcion.trim() ? editForm.descripcion.trim() : null,
    };
    const res = await fetch("/api/movimientos", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(body),
    });
    if (res.status === 401 || res.status === 403) {
      router.replace("/login");
      return;
    }
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Error" }));
      setToast({ message: err.error || "Error al guardar cambios", type: "error" });
      return;
    }
    setEditOpen(false);
    setEditingId(null);
    setEditRecord(null);
    await refreshData();
    setToast({ message: "Cambios guardados exitosamente", type: "success" });
  }

  async function deleteMovimiento() {
    if (!editingId) return;
    
    setConfirmDialog({
      open: true,
      onConfirm: async () => {
        setConfirmDialog(null);
        const res = await fetch("/api/movimientos", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ id: editingId }),
        });
        if (res.status === 401 || res.status === 403) {
          router.replace("/login");
          return;
        }
        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: "Error" }));
          setToast({ message: err.error || "No se pudo eliminar", type: "error" });
          return;
        }
        setEditOpen(false);
        setEditingId(null);
        setEditRecord(null);
        await refreshData();
        setToast({ message: "Movimiento eliminado exitosamente", type: "success" });
      },
    });
  }

  return (
    <ProtectedPage>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <Nav />
        <header className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-3xl md:text-4xl font-extralight text-gray-900 dark:text-white">Finanzas</h1>
              <p className="mt-1 text-gray-500 dark:text-gray-400">Controla la caja y los movimientos — FlipCams</p>
            </div>
            <UserHeader />
          </div>
        </header>

  <KpiCards data={kpi} />

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        <form
          onSubmit={submit}
          className="lg:col-span-1 p-4 rounded-2xl bg-white/60 dark:bg-gray-800/60 backdrop-blur-md border border-white/30 dark:border-white/10 shadow-lg"
        >
          <div className="flex flex-col space-y-3">
            <label className="text-xs text-gray-500 uppercase">Tipo</label>
            <select
              className="p-3 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-900/60 text-gray-900 dark:text-gray-100"
              value={form.tipo}
              onChange={(e) => setForm((f) => ({ ...f, tipo: e.target.value }))}
            >
              <option value="capital">Capital</option>
              <option value="gasto">Gasto</option>
              <option value="retiro">Retiro</option>
            </select>
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-500/10 dark:to-pink-500/10 border border-purple-100 dark:border-purple-500/20 p-2.5">
              <div className="flex items-start gap-2">
                <div className="flex-shrink-0 w-4 h-4 rounded-full bg-purple-500 dark:bg-purple-400 flex items-center justify-center">
                  <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-xs text-purple-800 dark:text-purple-200 leading-relaxed">
                  Compra/Venta se registran automáticamente desde Inventario
                </p>
              </div>
            </div>

            <label className="text-xs text-gray-500 uppercase">Monto</label>
            <input
              className="p-3 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-900/60 text-gray-900 dark:text-gray-100"
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              placeholder="$1000"
              value={form.monto}
              onChange={(e) => setForm((f) => ({ ...f, monto: e.target.value }))}
            />

            <label className="text-xs text-gray-500 uppercase">Descripción</label>
            <input
              className="p-3 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-900/60 text-gray-900 dark:text-gray-100 placeholder:text-gray-400"
              placeholder="Descripción opcional"
              value={form.descripcion}
              onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
            />

            <button 
              disabled={isSubmitting}
              className="mt-2 w-full py-3 rounded-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-medium shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Guardando...
                </span>
              ) : (
                editingId ? "Guardar cambios" : "Agregar movimiento"
              )}
            </button>
          </div>
        </form>

        <div className="lg:col-span-2">
          {/* Desktop / tablet table */}
          <div className="hidden md:block bg-white dark:bg-gray-900/60 rounded-2xl shadow overflow-hidden border border-gray-100 dark:border-white/10">
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Movimientos recientes</h2>
                <div className="text-sm text-gray-500 dark:text-gray-400">{items.length} items</div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 dark:bg-white/5">
                    <th className="p-3 text-left text-xs text-gray-500 dark:text-gray-400">Fecha</th>
                    <th className="p-3 text-left text-xs text-gray-500 dark:text-gray-400">Tipo</th>
                    <th className="p-3 text-left text-xs text-gray-500 dark:text-gray-400">Descripción</th>
                    <th className="p-3 text-right text-xs text-gray-500 dark:text-gray-400">Monto</th>
                    <th className="p-3 text-right text-xs text-gray-500 dark:text-gray-400">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((m) => (
                    <tr
                      key={m.id}
                      className={`border-t border-gray-100 dark:border-white/10 transition-colors ${editingId === m.id ? "bg-blue-50/40 dark:bg-blue-500/10" : "hover:bg-gray-50 dark:hover:bg-white/5"}`}
                    >
                      <td className="p-3 align-top text-gray-600 dark:text-gray-300">{new Date(m.fecha).toLocaleString()}</td>
                      <td className="p-3 align-top capitalize font-medium text-gray-800 dark:text-gray-100">{m.tipo}</td>
                      <td className="p-3 align-top text-gray-600 dark:text-gray-300">{m.descripcion || "—"}</td>
                      <td className="p-3 align-top text-right font-semibold text-gray-900 dark:text-gray-100">${Number(m.monto).toLocaleString()}</td>
                      <td className="p-3 align-top text-right">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(m.id);
                            setEditRecord(m);
                            setEditForm({
                              tipo: m.tipo,
                              monto: String(m.monto ?? ""),
                              descripcion: m.descripcion ?? "",
                            });
                            setEditOpen(true);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white text-xs font-medium shadow-sm hover:shadow-md transition-all duration-200 transform hover:scale-105"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Editar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile list */}
          <div className="md:hidden">
            <div className="mb-3">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-gray-900 dark:text-white">Movimientos</h2>
                <div className="text-xs text-gray-500 dark:text-gray-400">{items.length} items</div>
              </div>
            </div>
            <ul className="space-y-3">
              {items.map((m) => (
                <li key={m.id} className={`rounded-2xl bg-white dark:bg-gray-900/60 shadow border border-gray-100 dark:border-white/10 p-4 ${editingId === m.id ? "ring-2 ring-blue-200 dark:ring-blue-400/30" : ""}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{new Date(m.fecha).toLocaleString()}</div>
                      <div className="mt-0.5 capitalize font-medium text-gray-800 dark:text-gray-100">{m.tipo}</div>
                      <div className="mt-1 text-sm text-gray-600 dark:text-gray-300">{m.descripcion || "—"}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-base font-semibold text-gray-900 dark:text-gray-100">${Number(m.monto).toLocaleString()}</div>
                    </div>
                  </div>
                  <div className="mt-3 flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(m.id);
                        setEditRecord(m);
                        setEditForm({
                          tipo: m.tipo,
                          monto: String(m.monto ?? ""),
                          descripcion: m.descripcion ?? "",
                        });
                        setEditOpen(true);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white text-xs font-medium shadow-sm hover:shadow-md transition-all duration-200 transform hover:scale-105"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Editar
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <Modal
        open={editOpen}
        onClose={() => {
          setEditOpen(false);
          setEditingId(null);
          setEditRecord(null);
        }}
     >
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Editar movimiento</h3>
          {editRecord ? (
            <p className="text-xs text-gray-500 mt-1">ID: {editRecord.id}</p>
          ) : null}
        </div>

        <form onSubmit={submitEdit} className="space-y-3">
          <div>
            <label className="text-xs text-gray-500 uppercase">Tipo</label>
            <select
              className="mt-1 w-full p-3 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-900/60 text-gray-900 dark:text-gray-100"
              value={editForm.tipo}
              onChange={(e) => setEditForm((f) => ({ ...f, tipo: e.target.value }))}
            >
              <option value="capital">Capital</option>
              <option value="gasto">Gasto</option>
              <option value="retiro">Retiro</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 uppercase">Monto</label>
            <input
              className="mt-1 w-full p-3 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-900/60 text-gray-900 dark:text-gray-100"
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              placeholder="$1000"
              value={editForm.monto}
              onChange={(e) => setEditForm((f) => ({ ...f, monto: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 uppercase">Descripción</label>
            <input
              className="mt-1 w-full p-3 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-900/60 text-gray-900 dark:text-gray-100 placeholder:text-gray-400"
              placeholder="Descripción opcional"
              value={editForm.descripcion}
              onChange={(e) => setEditForm((f) => ({ ...f, descripcion: e.target.value }))}
            />
          </div>

          <div className="flex items-center justify-between pt-3">
            <button
              type="button"
              onClick={deleteMovimiento}
              className="px-4 py-2 rounded-full bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 dark:bg-red-500/10 dark:text-red-300 dark:border-red-500/20 dark:hover:bg-red-500/20 text-sm"
            >
              Eliminar
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setEditOpen(false);
                  setEditingId(null);
                  setEditRecord(null);
                }}
                className="px-4 py-2 rounded-full border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5 text-sm"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-full bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-md text-sm"
              >
                Guardar cambios
              </button>
            </div>
          </div>
        </form>
      </Modal>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {confirmDialog && (
        <ConfirmDialog
          open={confirmDialog.open}
          title="Confirmar eliminación"
          message="¿Estás seguro de que deseas eliminar este movimiento? Esta acción no se puede deshacer."
          confirmText="Eliminar"
          cancelText="Cancelar"
          type="danger"
          onConfirm={confirmDialog.onConfirm}
          onCancel={() => setConfirmDialog(null)}
        />
      )}
      </div>
    </ProtectedPage>
  );
}

// Modal component (simple, local)
function Modal({ open, onClose, children }: { open: boolean; onClose: () => void; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md mx-auto rounded-2xl bg-white dark:bg-gray-900 shadow-2xl border border-gray-100 dark:border-white/10 p-6">
        {children}
      </div>
    </div>
  );
}
