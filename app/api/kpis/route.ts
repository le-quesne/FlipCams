import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  // Obtener KPIs actuales
  const { data, error } = await supabase.from('v_kpis').select('*').single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Obtener items NO vendidos para proyecciones
  const { data: inventarioNoVendido } = await supabase
    .from('inventario')
    .select('costo, precio_venta, estado')
    .neq('estado', 'vendido');

  // Calcular proyecciones basadas en items pendientes
  let inversion_en_inventario = 0;
  let ventas_potenciales_pendientes = 0;

  // Solo calcular para items NO vendidos
  if (inventarioNoVendido) {
    inventarioNoVendido.forEach((item) => {
      const costo = Number(item.costo || 0);
      inversion_en_inventario += costo;
      
      // Si tiene precio de venta definido, sumarlo
      if (item.precio_venta) {
        const precio_venta = Number(item.precio_venta);
        ventas_potenciales_pendientes += precio_venta;
      }
    });
  }

  // Utilidad proyectada = Utilidad actual + Precios de venta de items pendientes
  const utilidad_actual = Number(data.utilidad || 0);
  const utilidad_proyectada_total = utilidad_actual + ventas_potenciales_pendientes;

  // Cash proyectado = caja actual + ventas potenciales de items pendientes
  const cash_proyectado = (data.caja_actual || 0) + ventas_potenciales_pendientes;

  // Calcular ROI: (Utilidad actual / Capital invertido) * 100
  const capital = Number(data.capital || 0);
  const roi = capital > 0 ? (utilidad_actual / capital) * 100 : 0;

  // ROI Proyectado basado en utilidad proyectada total
  const roi_proyectado = capital > 0 ? (utilidad_proyectada_total / capital) * 100 : 0;

  return NextResponse.json({ 
    data: {
      ...data,
      roi,
      roi_proyectado,
      cash_proyectado,
      utilidad_proyectada: utilidad_proyectada_total,
      inversion_en_inventario,
      ventas_potenciales_pendientes,
    }
  });
}
