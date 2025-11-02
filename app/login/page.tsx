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
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="bg-white/95 backdrop-blur-sm border border-gray-100 rounded-3xl shadow-2xl p-10">
          <div className="flex flex-col items-center space-y-4 mb-6">
            {/* simple camera-like icon */}
            <div className="p-3 bg-gradient-to-br from-gray-100 to-white rounded-2xl shadow-sm">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" aria-hidden>
                <rect x="2" y="5" width="20" height="14" rx="3" stroke="#111827" strokeOpacity="0.08" strokeWidth="1.2" />
                <circle cx="12" cy="12" r="3.5" stroke="#111827" strokeOpacity="0.12" strokeWidth="1.2" />
                <circle cx="12" cy="12" r="2.2" fill="#111827" fillOpacity="0.06" />
              </svg>
            </div>

            <h1 className="text-3xl font-extralight tracking-tight text-gray-900">Entrar</h1>
            <p className="text-sm text-gray-500">Accede a tus finanzas y movimientos</p>
          </div>

          <form onSubmit={signIn} className="space-y-4">
            <label className="sr-only" htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-200 focus:ring-opacity-60"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              aria-label="Email"
            />

            <label className="sr-only" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-200 focus:ring-opacity-60"
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
              className={`w-full flex items-center justify-center gap-3 px-5 py-3 rounded-full text-white transition-shadow ${
                loading ? 'bg-gray-400 shadow-none' : 'bg-gradient-to-r from-blue-600 to-blue-500 shadow-lg'
              }`}
            >
              {loading ? (
                <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.4)" strokeWidth="4"></circle>
                  <path d="M22 12a10 10 0 00-10-10" stroke="white" strokeWidth="4" strokeLinecap="round"></path>
                </svg>
              ) : null}
              <span className="font-medium">{loading ? 'Ingresando...' : 'Entrar'}</span>
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-500">
            <span>¿No tienes cuenta?</span>{' '}
            <a className="text-blue-600 hover:underline" href="/signup">Crear una</a>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-gray-400">FlipCams © {new Date().getFullYear()}</p>
      </div>
    </div>
  );
}