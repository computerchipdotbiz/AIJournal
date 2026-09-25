import { getSession, ALLOWED_EMAIL } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getSession();
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

  return Response.json({
    authenticated: Boolean(session),
    email: session?.email || null,
    allowedEmail: ALLOWED_EMAIL,
    googleClientId: googleClientId,
  });
}
