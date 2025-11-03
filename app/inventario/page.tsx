"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Nav from "@/components/Nav";
import ProtectedPage from "@/components/ProtectedPage";
import UserHeader from "@/components/UserHeader";

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
    const costoNumber = Number(form.costo);
    if (!Number.isFinite(costoNumber) || costoNumber < 0) {
      return alert("Ingresa un costo válido");
    }
    if (!form.titulo.trim()) {
      return alert("El título es requerido");
    }

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
    } else {
      const err = await res.json().catch(() => ({ error: "Error" }));
      alert(err.error || "Error al guardar");
    }
  }

  async function submitEdit(e: any) {
    e.preventDefault();
    if (!editingId) return;
    const costoNumber = Number(editForm.costo);
    if (!Number.isFinite(costoNumber) || costoNumber < 0) {
      return alert("Ingresa un costo válido");
    }
    if (!editForm.titulo.trim()) {
      return alert("El título es requerido");
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
      return alert(err.error || "Error al guardar cambios");
    }
    setEditOpen(false);
    setEditingId(null);
    setEditRecord(null);
    await load();
  }

  async function deleteItem() {
    if (!editingId) return;
    const confirmed = window.confirm("¿Eliminar este item? Esta acción no se puede deshacer.");
    if (!confirmed) return;
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
      return alert(err.error || "No se pudo eliminar");
    }
    setEditOpen(false);
    setEditingId(null);
    setEditRecord(null);
    await load();
  }

  return (
    <ProtectedPage>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <Nav />
        <header className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-3xl md:text-4xl font-extralight text-gray-900 dark:text-white">Inventario</h1>
              <p className="mt-1 text-gray-500 dark:text-gray-400">Gestiona tus cámaras y productos — FlipCams</p>
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
              placeholder="0.00"
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
              placeholder="0.00"
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

            <button className="mt-2 w-full py-3 rounded-full bg-gradient-to-r from-blue-600 to-blue-500 text-white font-medium shadow-md">
              {editingId ? "Guardar cambios" : "Agregar item"}
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
                          className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                        >
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
                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                    >
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
              placeholder="0.00"
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
              placeholder="0.00"
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
