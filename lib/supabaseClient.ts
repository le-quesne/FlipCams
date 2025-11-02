// NOTE: Server-only Supabase client using the classic supabase-js SDK.
// Do NOT import `supabase` from this file in client components — that can bundle a second
// Supabase auth instance into the browser and trigger "Multiple GoTrueClient instances detected" warnings.
//
// Prefer using `createSupabaseServerClient` from `lib/supabase/server.ts` inside server routes
// (it uses @supabase/ssr and Next.js cookies). For browser-only code, use `lib/supabase/browser.ts`.

import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { persistSession: true, autoRefreshToken: true } }
);
