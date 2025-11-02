import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function GET(req: Request) {
  const supabase = await createSupabaseServerClient();
  // require authenticated session
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const { data, error } = await supabase
    .from('movimientos')
    .select('*')
    .order('fecha', { ascending: false })
    .limit(100);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient();
  // require authenticated session
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const body = await req.json();
  // validate input: only allow expected fields
  const allowed = ['tipo', 'monto', 'descripcion', 'fecha', 'equipo_id', 'metadata'];
  const payload: any = {};
  for (const k of allowed) {
    if (body[k] !== undefined) payload[k] = body[k];
  }

  // basic validation
  const tipos = ['capital', 'compra', 'venta', 'gasto', 'retiro'];
  if (!tipos.includes(payload.tipo)) return NextResponse.json({ error: 'Invalid tipo' }, { status: 400 });
  if (typeof payload.monto !== 'number' || isNaN(payload.monto) || payload.monto <= 0)
    return NextResponse.json({ error: 'Invalid monto' }, { status: 400 });

  // Do NOT set creado_por here — the DB trigger will stamp auth.uid() server-side.
  const { data, error } = await supabase.from('movimientos').insert([payload]).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ data }, { status: 201 });
}

export async function PUT(req: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const body = await req.json();
  const { id, ...rest } = body || {};
  if (!id || typeof id !== 'string') {
    return NextResponse.json({ error: 'Missing movimiento id' }, { status: 400 });
  }

  const allowed = ['tipo', 'monto', 'descripcion', 'fecha', 'equipo_id', 'metadata'];
  const payload: any = {};
  for (const key of allowed) {
    if (rest[key] !== undefined) payload[key] = rest[key];
  }
  if (Object.keys(payload).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  }

  const tipos = ['capital', 'compra', 'venta', 'gasto', 'retiro'];
  if (payload.tipo && !tipos.includes(payload.tipo)) {
    return NextResponse.json({ error: 'Invalid tipo' }, { status: 400 });
  }
  if (payload.monto !== undefined) {
    if (typeof payload.monto !== 'number' || isNaN(payload.monto) || payload.monto <= 0) {
      return NextResponse.json({ error: 'Invalid monto' }, { status: 400 });
    }
  }
  if (payload.descripcion === '') {
    payload.descripcion = null;
  }

  const { data, error } = await supabase
    .from('movimientos')
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  if (!data) return NextResponse.json({ error: 'Movimiento no encontrado' }, { status: 404 });

  return NextResponse.json({ data });
}

export async function DELETE(req: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  let body: any = null;
  try {
    body = await req.json();
  } catch (e) {
    // allow empty/invalid JSON to be handled below
  }
  const id = body?.id;
  if (!id || typeof id !== 'string') {
    return NextResponse.json({ error: 'Missing movimiento id' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('movimientos')
    .delete()
    .eq('id', id)
    .select()
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  if (!data) return NextResponse.json({ ok: true }); // already deleted or not found

  return NextResponse.json({ data });
}
