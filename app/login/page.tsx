'use client';
import { useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const supabase = createSupabaseBrowserClient();

    // intentamos iniciar sesión y dejamos que Supabase maneje la sesión vía cookies
    const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
    if (error) {
      setLoading(false);
      return alert(error.message);
    }

    setLoading(false);
    router.refresh();
    router.push('/finanzas'); // a tu dashboard
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-6">
      <div className="w-full max-w-sm text-center">
        <h1 className="text-4xl font-light tracking-tight text-gray-900">Flip Cam</h1>
        <p className="text-sm text-gray-400 mt-1">Adrian & Diego</p>

        <form onSubmit={signIn} className="mt-8 space-y-3">
          <label className="sr-only" htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            aria-label="Email"
          />

          <label className="sr-only" htmlFor="password">Contraseña</label>
          <input
            id="password"
            type="password"
            className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200"
            placeholder="Contraseña"
            value={pass}
            onChange={e => setPass(e.target.value)}
            required
            aria-label="Contraseña"
          />

          <button
            type="submit"
            disabled={loading}
            aria-busy={loading}
            className="w-full px-5 py-3 rounded-full bg-black text-white transition-opacity disabled:opacity-50"
          >
            {loading ? 'Ingresando…' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}