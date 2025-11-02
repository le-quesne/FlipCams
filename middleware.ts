// middleware.ts (en la raíz)
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(_req: NextRequest) {
  // solo deja pasar la request
  return NextResponse.next();
}

// evita correr en assets estáticos
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
