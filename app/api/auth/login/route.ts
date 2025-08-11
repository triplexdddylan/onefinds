// app/api/auth/login/route.ts
import { NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebaseAdmin';
import { SignJWT } from 'jose';

// Make sure this runs on the Node runtime (firebase-admin is not Edge-compatible)
export const runtime = 'nodejs';
// Avoid any caching of auth responses
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  // Basic guard: must have secret configured
  if (!process.env.ADMIN_JWT_SECRET) {
    return new NextResponse('Server misconfigured: ADMIN_JWT_SECRET missing', { status: 500 });
  }

  const isProd = process.env.NODE_ENV === 'production';

  // Parse body
  let idToken: string | undefined;
  try {
    const body = (await req.json()) as { idToken?: string };
    idToken = body?.idToken;
  } catch {
    // fall through to 400 below
  }
  if (!idToken) return NextResponse.json({ error: 'Missing idToken' }, { status: 400 });

  try {
    // Verify Firebase ID token and force refresh of revocation checks
    const decoded = await adminAuth.verifyIdToken(idToken, true);

    // Require admin claim
    if (!decoded.admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Issue a compact JWT the middleware can verify without hitting Firebase on every request
    const secret = new TextEncoder().encode(process.env.ADMIN_JWT_SECRET);
    const jwt = await new SignJWT({ admin: true, sub: decoded.uid })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(secret);

    const res = NextResponse.json({ ok: true }, { status: 200, headers: { 'Cache-Control': 'no-store' } });

    // IMPORTANT: secure=false on localhost so the cookie actually sets
    res.cookies.set('of_admin', jwt, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return res;
  } catch (err) {
    // Could be token expired/invalid, or admin not set, etc.
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: { 'Cache-Control': 'no-store' } });
  }
}
