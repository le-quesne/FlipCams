import { NextResponse } from 'next/server';

// Deprecated endpoint. The app no longer uses server-side bootstrap-profile.
export async function POST() {
  return NextResponse.json({ error: 'deprecated' }, { status: 410 });
}
