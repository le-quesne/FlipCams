import Link from "next/link";

export const metadata = {
  title: "Flip Cam",
  description: "Control simple de caja y movimientos. Hecho por Adrian & Diego.",
};

export default function HomePage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-white px-6">
      <div className="text-center max-w-md mx-auto">
        <h1 className="text-5xl font-light tracking-tight text-gray-900">Flip Cam</h1>
        <p className="text-sm text-gray-400 mt-1">Adrian & Diego</p>
        <p className="mt-4 text-gray-500 text-sm">
          Controla tu caja y movimientos: registra compras, ventas, gastos y retiros; mira KPIs al instante.
        </p>
        <Link
          href="/login"
          className="mt-8 inline-flex items-center justify-center rounded-full bg-black text-white px-6 py-3"
        >
          Login
        </Link>
      </div>
    </main>
  );
}
