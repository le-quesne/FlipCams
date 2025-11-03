"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Nav from "@/components/Nav";
import ProtectedPage from "@/components/ProtectedPage";
import UserHeader from "@/components/UserHeader";
import Toast from "@/components/Toast";
import ConfirmDialog from "@/components/ConfirmDialog";

type InventarioItem = {
  id: string;
  titulo: string;
  marca?: string | null;
  modelo?: string | null;
  estado: string;
  costo: number;
  precio_venta?: number | null;
  fecha_ingreso: string;
  fecha_venta?: string | null;
  notas?: string | null;
};

const INITIAL_FORM = {
  titulo: "",
  marca: "",
  modelo: "",
  estado: "en_stock",
  costo: "",
  precio_venta: "",
  notas: "",
};

export default function Page() {
  const router = useRouter();
  const [items, setItems] = useState<InventarioItem[]>([]);
  const [form, setForm] = useState({ ...INITIAL_FORM });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({ ...INITIAL_FORM });
  const [editRecord, setEditRecord] = useState<InventarioItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "warning" | "info" } | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; onConfirm: () => void } | null>(null);

  const load = async () => {
    try {
      const r = await fetch("/api/inventario", { credentials: "include" });
      if (r.status === 401 || r.status === 403) {
        router.replace("/login");
        return;
      }
      if (!r.ok) throw new Error("Error al cargar inventario");
      const j = await r.json();
      setItems(j.data || []);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    load();
  }, []);

  async function submit(e: any) {
    e.preventDefault();
    if (isSubmitting) return; // Prevenir doble clic
    
    const costoNumber = Number(form.costo);
    if (!Number.isFinite(costoNumber) || costoNumber < 0) {
      setToast({ message: "Ingresa un costo válido", type: "error" });
      return;
    }
    if (!form.titulo.trim()) {
      setToast({ message: "El título es requerido", type: "error" });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: any = {
        titulo: form.titulo.trim(),
        marca: form.marca.trim() || null,
        modelo: form.modelo.trim() || null,
        estado: form.estado,
        costo: costoNumber,
        notas: form.notas.trim() || null,
      };
      if (form.precio_venta.trim()) {
        const precio = Number(form.precio_venta);
        if (Number.isFinite(precio) && precio >= 0) {
          payload.precio_venta = precio;
        }
      }

      const endpoint = "/api/inventario";
      const method = editingId ? "PUT" : "POST";
      const body = editingId ? { id: editingId, ...payload } : payload;

      // 💡 El trigger de Supabase registrará automáticamente:
      // - POST: movimiento de "compra" en finanzas
      // - PUT (si cambió costo): movimiento de "gasto" por el delta
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
        await load();
        setToast({ message: "Item agregado exitosamente", type: "success" });
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
    const costoNumber = Number(editForm.costo);
    if (!Number.isFinite(costoNumber) || costoNumber < 0) {
      setToast({ message: "Ingresa un costo válido", type: "error" });
      return;
    }
    if (!editForm.titulo.trim()) {
      setToast({ message: "El título es requerido", type: "error" });
      return;
    }

    const payload: any = {
      id: editingId,
      titulo: editForm.titulo.trim(),
      marca: editForm.marca.trim() || null,
      modelo: editForm.modelo.trim() || null,
      estado: editForm.estado,
      costo: costoNumber,
      notas: editForm.notas.trim() || null,
    };
    if (editForm.precio_venta.trim()) {
      const precio = Number(editForm.precio_venta);
      if (Number.isFinite(precio) && precio >= 0) {
        payload.precio_venta = precio;
      } else {
        payload.precio_venta = null;
      }
    } else {
      payload.precio_venta = null;
    }

    // Si el estado es 'vendido', agregar fecha de venta automáticamente
    if (payload.estado === 'vendido' && editRecord?.estado !== 'vendido') {
      payload.fecha_venta = new Date().toISOString();
    }

    // 💡 El trigger de Supabase registrará automáticamente:
    // - Si estado cambió a 'vendido': movimiento de "venta" en finanzas
    // - Si cambió el costo: movimiento de "gasto" por el delta
    const res = await fetch("/api/inventario", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
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
    await load();
    setToast({ message: "Cambios guardados exitosamente", type: "success" });
  }

  async function deleteItem() {
    if (!editingId) return;
    
    setConfirmDialog({
      open: true,
      onConfirm: async () => {
        setConfirmDialog(null);
        const res = await fetch("/api/inventario", {
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
        await load();
        setToast({ message: "Item eliminado exitosamente", type: "success" });
      },
    });
  }

  return (
    <ProtectedPage>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <Nav />
        <header className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-3xl md:text-4xl font-extralight text-gray-900 dark:text-white">Inventario</h1>
              <p className="mt-1 text-gray-500 dark:text-gray-400">Gestiona tus cámaras y productos — South Sensor Cams</p>
            </div>
            <UserHeader />
          </div>
        </header>

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        <form
          onSubmit={submit}
          className="lg:col-span-1 p-4 rounded-2xl bg-white/60 dark:bg-gray-800/60 backdrop-blur-md border border-white/30 dark:border-white/10 shadow-lg"
        >
          <div className="flex flex-col space-y-3">
            <label className="text-xs text-gray-500 dark:text-gray-400 uppercase">Título</label>
            <input
              className="p-3 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-900/60 text-gray-900 dark:text-gray-100"
              placeholder="Nombre del producto"
              value={form.titulo}
              onChange={(e) => setForm((f) => ({ ...f, titulo: e.target.value }))}
            />

            <label className="text-xs text-gray-500 dark:text-gray-400 uppercase">Marca (opcional)</label>
            <input
              className="p-3 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-900/60 text-gray-900 dark:text-gray-100"
              placeholder="Canon, Sony, etc."
              value={form.marca}
              onChange={(e) => setForm((f) => ({ ...f, marca: e.target.value }))}
            />

            <label className="text-xs text-gray-500 dark:text-gray-400 uppercase">Modelo (opcional)</label>
            <input
              className="p-3 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-900/60 text-gray-900 dark:text-gray-100"
              placeholder="EOS R5, A7 III, etc."
              value={form.modelo}
              onChange={(e) => setForm((f) => ({ ...f, modelo: e.target.value }))}
            />

            <label className="text-xs text-gray-500 dark:text-gray-400 uppercase">Costo</label>
            <input
              className="p-3 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-900/60 text-gray-900 dark:text-gray-100"
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              placeholder="$1000"
              value={form.costo}
              onChange={(e) => setForm((f) => ({ ...f, costo: e.target.value }))}
            />

            <label className="text-xs text-gray-500 dark:text-gray-400 uppercase">Precio de venta (opcional)</label>
            <input
              className="p-3 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-900/60 text-gray-900 dark:text-gray-100"
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              placeholder="$1000"
              value={form.precio_venta}
              onChange={(e) => setForm((f) => ({ ...f, precio_venta: e.target.value }))}
            />

            <label className="text-xs text-gray-500 dark:text-gray-400 uppercase">Estado</label>
            <select
              className="p-3 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-900/60 text-gray-900 dark:text-gray-100"
              value={form.estado}
              onChange={(e) => setForm((f) => ({ ...f, estado: e.target.value }))}
            >
              <option value="en_stock">En Stock</option>
              <option value="reservado">Reservado</option>
              <option value="pendiente">Pendiente</option>
              <option value="vendido">Vendido</option>
            </select>

            <label className="text-xs text-gray-500 dark:text-gray-400 uppercase">Notas (opcional)</label>
            <textarea
              className="p-3 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-900/60 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 resize-none"
              rows={2}
              placeholder="Detalles adicionales"
              value={form.notas}
              onChange={(e) => setForm((f) => ({ ...f, notas: e.target.value }))}
            />

            <div className="mt-2 relative overflow-hidden rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-500/10 dark:to-indigo-500/10 border border-blue-100 dark:border-blue-500/20 p-3">
              <div className="flex items-start gap-2">
                <div className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-500 dark:bg-blue-400 flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-xs text-blue-800 dark:text-blue-200 leading-relaxed">
                  Al agregar un item, se registra automáticamente la <strong>compra</strong> en Finanzas
                </p>
              </div>
            </div>

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
                editingId ? "Guardar cambios" : "Agregar item"
              )}
            </button>
          </div>
        </form>

        <div className="lg:col-span-2">
          {/* Desktop / tablet table */}
          <div className="hidden md:block bg-white dark:bg-gray-900/60 rounded-2xl shadow overflow-hidden border border-gray-100 dark:border-white/10">
            <div className="p-4 border-b border-gray-100 dark:border-white/10">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Items en inventario</h2>
                <div className="text-sm text-gray-500 dark:text-gray-400">{items.length} items</div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 dark:bg-white/5">
                    <th className="p-3 text-left text-xs text-gray-500 dark:text-gray-400">Título</th>
                    <th className="p-3 text-left text-xs text-gray-500 dark:text-gray-400">Marca/Modelo</th>
                    <th className="p-3 text-left text-xs text-gray-500 dark:text-gray-400">Estado</th>
                    <th className="p-3 text-right text-xs text-gray-500 dark:text-gray-400">Costo</th>
                    <th className="p-3 text-right text-xs text-gray-500 dark:text-gray-400">Precio venta</th>
                    <th className="p-3 text-right text-xs text-gray-500 dark:text-gray-400">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((m) => (
                    <tr
                      key={m.id}
                      className={`border-t border-gray-100 dark:border-white/10 transition-colors ${editingId === m.id ? "bg-blue-50/40 dark:bg-blue-500/10" : "hover:bg-gray-50 dark:hover:bg-white/5"}`}
                    >
                      <td className="p-3 align-top font-medium text-gray-800 dark:text-gray-100">{m.titulo}</td>
                      <td className="p-3 align-top text-gray-600 dark:text-gray-300">
                        {m.marca && m.modelo ? `${m.marca} ${m.modelo}` : m.marca || m.modelo || "—"}
                      </td>
                      <td className="p-3 align-top">
                        <span
                          className={`inline-block px-2 py-1 text-xs rounded-full ${
                            m.estado === "en_stock"
                              ? "bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-300"
                              : m.estado === "reservado"
                              ? "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300"
                              : m.estado === "pendiente"
                              ? "bg-yellow-50 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-300"
                              : "bg-gray-50 text-gray-700 dark:bg-gray-500/10 dark:text-gray-300"
                          }`}
                        >
                          {m.estado === "en_stock" ? "En Stock" : m.estado.charAt(0).toUpperCase() + m.estado.slice(1)}
                        </span>
                      </td>
                      <td className="p-3 align-top text-right text-gray-900 dark:text-gray-100">
                        ${Number(m.costo).toLocaleString()}
                      </td>
                      <td className="p-3 align-top text-right text-gray-900 dark:text-gray-100">
                        {m.precio_venta ? `$${Number(m.precio_venta).toLocaleString()}` : "—"}
                      </td>
                      <td className="p-3 align-top text-right">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(m.id);
                            setEditRecord(m);
                            setEditForm({
                              titulo: m.titulo,
                              marca: m.marca ?? "",
                              modelo: m.modelo ?? "",
                              costo: String(m.costo),
                              precio_venta: m.precio_venta ? String(m.precio_venta) : "",
                              estado: m.estado,
                              notas: m.notas ?? "",
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
                <h2 className="text-base font-semibold text-gray-900 dark:text-white">Inventario</h2>
                <div className="text-xs text-gray-500 dark:text-gray-400">{items.length} items</div>
              </div>
            </div>
            <ul className="space-y-3">
              {items.map((m) => (
                <li key={m.id} className={`rounded-2xl bg-white dark:bg-gray-900/60 shadow border border-gray-100 dark:border-white/10 p-4 ${editingId === m.id ? "ring-2 ring-blue-200 dark:ring-blue-400/30" : ""}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="font-medium text-gray-800 dark:text-gray-100">{m.titulo}</div>
                      {(m.marca || m.modelo) && (
                        <div className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                          {m.marca && m.modelo ? `${m.marca} ${m.modelo}` : m.marca || m.modelo}
                        </div>
                      )}
                      <div className="mt-2 flex items-center gap-2">
                        <span
                          className={`inline-block px-2 py-1 text-xs rounded-full ${
                            m.estado === "en_stock"
                              ? "bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-300"
                              : m.estado === "reservado"
                              ? "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300"
                              : m.estado === "pendiente"
                              ? "bg-yellow-50 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-300"
                              : "bg-gray-50 text-gray-700 dark:bg-gray-500/10 dark:text-gray-300"
                          }`}
                        >
                          {m.estado === "en_stock" ? "En Stock" : m.estado.charAt(0).toUpperCase() + m.estado.slice(1)}
                        </span>
                      </div>
                      <div className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                        <div>Costo: ${Number(m.costo).toLocaleString()}</div>
                        {m.precio_venta ? (
                          <div>Venta: ${Number(m.precio_venta).toLocaleString()}</div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(m.id);
                        setEditRecord(m);
                        setEditForm({
                          titulo: m.titulo,
                          marca: m.marca ?? "",
                          modelo: m.modelo ?? "",
                          costo: String(m.costo),
                          precio_venta: m.precio_venta ? String(m.precio_venta) : "",
                          estado: m.estado,
                          notas: m.notas ?? "",
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
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Editar item</h3>
          {editRecord ? (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">ID: {editRecord.id}</p>
          ) : null}
        </div>

        <form onSubmit={submitEdit} className="space-y-3">
          <div>
            <label className="text-xs text-gray-500 dark:text-gray-400 uppercase">Título</label>
            <input
              className="mt-1 w-full p-3 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-900/60 text-gray-900 dark:text-gray-100"
              placeholder="Nombre del producto"
              value={editForm.titulo}
              onChange={(e) => setEditForm((f) => ({ ...f, titulo: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 dark:text-gray-400 uppercase">Marca</label>
            <input
              className="mt-1 w-full p-3 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-900/60 text-gray-900 dark:text-gray-100"
              placeholder="Canon, Sony, etc."
              value={editForm.marca}
              onChange={(e) => setEditForm((f) => ({ ...f, marca: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 dark:text-gray-400 uppercase">Modelo</label>
            <input
              className="mt-1 w-full p-3 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-900/60 text-gray-900 dark:text-gray-100"
              placeholder="EOS R5, A7 III, etc."
              value={editForm.modelo}
              onChange={(e) => setEditForm((f) => ({ ...f, modelo: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 dark:text-gray-400 uppercase">Costo</label>
            <input
              className="mt-1 w-full p-3 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-900/60 text-gray-900 dark:text-gray-100"
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              placeholder="$1000"
              value={editForm.costo}
              onChange={(e) => setEditForm((f) => ({ ...f, costo: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 dark:text-gray-400 uppercase">Precio de venta</label>
            <input
              className="mt-1 w-full p-3 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-900/60 text-gray-900 dark:text-gray-100"
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              placeholder="$1000"
              value={editForm.precio_venta}
              onChange={(e) => setEditForm((f) => ({ ...f, precio_venta: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 dark:text-gray-400 uppercase">Estado</label>
            <select
              className="mt-1 w-full p-3 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-900/60 text-gray-900 dark:text-gray-100"
              value={editForm.estado}
              onChange={(e) => setEditForm((f) => ({ ...f, estado: e.target.value }))}
            >
              <option value="en_stock">En Stock</option>
              <option value="reservado">Reservado</option>
              <option value="pendiente">Pendiente</option>
              <option value="vendido">Vendido</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 dark:text-gray-400 uppercase">Notas</label>
            <textarea
              className="mt-1 w-full p-3 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-900/60 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 resize-none"
              rows={2}
              placeholder="Detalles adicionales"
              value={editForm.notas}
              onChange={(e) => setEditForm((f) => ({ ...f, notas: e.target.value }))}
            />
          </div>

          {/* Botón especial para marcar como vendido */}
          {editRecord && editRecord.estado !== 'vendido' && (
            <div className="pt-3 border-t border-gray-200 dark:border-white/10">
              <div className="mb-3 relative overflow-hidden rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-500/10 dark:to-emerald-500/10 border border-green-100 dark:border-green-500/20 p-2.5">
                <div className="flex items-start gap-2">
                  <div className="flex-shrink-0 w-4 h-4 rounded-full bg-green-500 dark:bg-green-400 flex items-center justify-center">
                    <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <p className="text-xs text-green-800 dark:text-green-200 leading-relaxed">
                    Marcar como vendido registrará automáticamente la venta en Finanzas
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={async () => {
                  const precioVenta = editForm.precio_venta.trim();
                  if (!precioVenta || Number(precioVenta) <= 0) {
                    setToast({ message: "Ingresa un precio de venta válido", type: "error" });
                    return;
                  }
                  setEditForm((f) => ({ ...f, estado: 'vendido' }));
                  // Esperar un tick para que el estado se actualice
                  setTimeout(() => {
                    const submitBtn = document.querySelector('form button[type="submit"]') as HTMLButtonElement;
                    if (submitBtn) submitBtn.click();
                  }, 0);
                }}
                className="w-full px-4 py-2 rounded-full bg-gradient-to-r from-green-600 to-green-500 text-white shadow-md text-sm font-medium"
              >
                ✓ Marcar como Vendido
              </button>
            </div>
          )}

          <div className="flex items-center justify-between pt-3">
            <button
              type="button"
              onClick={deleteItem}
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
          message="¿Estás seguro de que deseas eliminar este item? Esta acción no se puede deshacer."
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

// Modal component
function Modal({ open, onClose, children }: { open: boolean; onClose: () => void; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md mx-auto rounded-2xl bg-white dark:bg-gray-900 shadow-2xl border border-gray-100 dark:border-white/10 p-6 max-h-[90vh] overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
