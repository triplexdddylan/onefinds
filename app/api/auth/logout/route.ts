// app/api/auth/logout/route.ts
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST() {
  const isProd = process.env.NODE_ENV === 'production';

  const res = new NextResponse(null, {
    status: 204,
    headers: { 'Cache-Control': 'no-store' },
  });

  // Clear the cookie
  res.cookies.set('of_admin', '', {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });

  return res;
}
