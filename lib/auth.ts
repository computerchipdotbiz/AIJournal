import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

export const ALLOWED_EMAIL = 'everythingfunny@gmail.com';
const JWT_SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || 'chipmind-secret-key-32-chars-long-secure-token!'
);
const COOKIE_NAME = 'chipmind_session';

export async function createSession(email: string) {
  if (email.toLowerCase() !== ALLOWED_EMAIL.toLowerCase()) {
    throw new Error('Unauthorized email address');
  }

  const token = await new SignJWT({ email: ALLOWED_EMAIL })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(JWT_SECRET);

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: '/',
  });

  return token;
}

export async function getSession() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;

    const { payload } = await jwtVerify(token, JWT_SECRET);
    if (payload.email === ALLOWED_EMAIL) {
      return { email: ALLOWED_EMAIL };
    }
    return null;
  } catch {
    return null;
  }
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function isAllowedUser(email: string) {
  return email.trim().toLowerCase() === ALLOWED_EMAIL.toLowerCase();
}
