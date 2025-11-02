import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

/**
 * Handler to receive Supabase client auth events from the browser
 * and let Supabase manage the cookies internally via setSession/signOut.
 */
export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient();
  const body = await req.json().catch(() => ({}));
  const { event, session } = body as { event?: string; session?: any };

  if (event === 'SIGNED_IN' && session) {
    const { error } = await supabase.auth.setSession(session);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  }

  if (event === 'SIGNED_OUT') {
    await supabase.auth.signOut();
    return NextResponse.json({ ok: true });
  }

  if (session) {
    const { error } = await supabase.auth.setSession(session);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: 'invalid payload' }, { status: 400 });
}
