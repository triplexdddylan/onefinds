import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const PUBLIC_ADMIN_PATHS = ['/admin/login'];
const PUBLIC_PREFIXES = ['/_next', '/favicon.ico', '/robots.txt', '/sitemap.xml', '/api/auth'];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Only consider /admin paths
  if (!pathname.startsWith('/admin')) return NextResponse.next();

  // Allow public admin routes (login) and public prefixes (auth API & assets)
  if (PUBLIC_ADMIN_PATHS.includes(pathname) || PUBLIC_PREFIXES.some(p => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Require cookie for everything else under /admin
  const token = req.cookies.get('of_admin')?.value;
  if (!token) return NextResponse.redirect(new URL('/admin/login', req.url));

  try {
    const secret = new TextEncoder().encode(process.env.ADMIN_JWT_SECRET!);
    const { payload } = await jwtVerify(token, secret);
    if (payload?.admin === true) return NextResponse.next();
  } catch {
    // fall through to redirect
  }
  return NextResponse.redirect(new URL('/admin/login', req.url));
}

export const config = {
  matcher: ['/admin/:path*', '/api/:path*'], // needed so /api/auth stays reachable
};
