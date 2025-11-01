'use client';
import { useEffect, useState } from 'react';

function KpiCards() {
  const [k,setK]=useState<any>(null);
  useEffect(()=>{ fetch('/api/kpis').then(r=>r.json()).then(j=>setK(j.data)); },[]);
  if(!k) return null;
  const f=(n:number)=>Number(n||0).toLocaleString();
  return (
    <div className="grid sm:grid-cols-3 gap-3 mb-4">
      <div className="p-4 bg-white rounded shadow"><div className="text-sm text-gray-500">Caja</div><div className="text-2xl font-bold">${f(k.caja_actual)}</div></div>
      <div className="p-4 bg-white rounded shadow"><div className="text-sm text-gray-500">Capital</div><div className="text-2xl font-bold">${f(k.capital)}</div></div>
      <div className="p-4 bg-white rounded shadow"><div className="text-sm text-gray-500">Utilidad</div><div className="text-2xl font-bold">${f(k.utilidad)}</div></div>
    </div>
  );
}

export default function Page(){
  const [items,setItems]=useState<any[]>([]);
  const [form,setForm]=useState({tipo:'compra',monto:'',descripcion:''});
  const load=()=>fetch('/api/movimientos').then(r=>r.json()).then(j=>setItems(j.data||[]));
  useEffect(()=>{ load(); },[]);
  async function submit(e:any){
    e.preventDefault();
    const res=await fetch('/api/movimientos',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...form,monto:+form.monto})});
    if(res.ok){ setForm({tipo:'compra',monto:'',descripcion:''}); load(); } else { alert('Error'); }
  }
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Finanzas — FlipCams</h1>
      <KpiCards />
      <form onSubmit={submit} className="p-4 bg-white rounded border grid sm:grid-cols-4 gap-3 mb-4">
        <select className="border p-2 rounded" value={form.tipo} onChange={e=>setForm(f=>({...f,tipo:e.target.value}))}>
          <option value="capital">Capital</option><option value="compra">Compra</option>
          <option value="venta">Venta</option><option value="gasto">Gasto</option><option value="retiro">Retiro</option>
        </select>
        <input className="border p-2 rounded" type="number" placeholder="Monto" value={form.monto} onChange={e=>setForm(f=>({...f,monto:e.target.value}))}/>
        <input className="border p-2 rounded" placeholder="Descripción" value={form.descripcion} onChange={e=>setForm(f=>({...f,descripcion:e.target.value}))}/>
        <button className="bg-blue-600 text-white rounded px-4">Agregar</button>
      </form>
      <div className="bg-white rounded shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="bg-gray-50">
            <th className="p-2 text-left">Fecha</th><th className="p-2 text-left">Tipo</th><th className="p-2 text-left">Descripción</th><th className="p-2 text-right">Monto</th>
          </tr></thead>
          <tbody>
            {items.map(m=>(
              <tr key={m.id} className="border-t">
                <td className="p-2">{new Date(m.fecha).toLocaleDateString()}</td>
                <td className="p-2 capitalize">{m.tipo}</td>
                <td className="p-2">{m.descripcion||'—'}</td>
                <td className="p-2 text-right">${Number(m.monto).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
