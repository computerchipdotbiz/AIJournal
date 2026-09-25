import { createSession, ALLOWED_EMAIL } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { credential, password } = await req.json();

    let authenticatedEmail = '';

    // 1. Authenticate via Google Cryptographic ID Token
    if (credential) {
      const response = await fetch(
        `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`
      );

      if (!response.ok) {
        return Response.json(
          { error: 'Invalid or expired Google credential token.' },
          { status: 400 }
        );
      }

      const tokenInfo = await response.json();
      authenticatedEmail = tokenInfo.email || '';
    } else if (password) {
      // 2. Authenticate via Owner Secret Password
      const ownerPassword = process.env.OWNER_PASSWORD;
      if (!ownerPassword) {
        return Response.json(
          { error: 'Password login is disabled. Please sign in with Google or set OWNER_PASSWORD.' },
          { status: 400 }
        );
      }

      if (password !== ownerPassword) {
        return Response.json(
          { error: 'Incorrect owner password. Access denied.' },
          { status: 401 }
        );
      }

      authenticatedEmail = ALLOWED_EMAIL;
    } else {
      return Response.json(
        { error: 'Missing authentication credentials. Please sign in with Google or enter your password.' },
        { status: 400 }
      );
    }

    // 2. Strict Whitelist Check
    if (authenticatedEmail.toLowerCase() !== ALLOWED_EMAIL.toLowerCase()) {
      return Response.json(
        {
          error: `Access restricted. ChipMind is a private personal journal exclusively for ${ALLOWED_EMAIL}. Your account (${authenticatedEmail}) is not authorized.`,
          unauthorized: true,
        },
        { status: 403 }
      );
    }

    // 3. Create 30-day session
    await createSession(authenticatedEmail);

    return Response.json({
      success: true,
      email: authenticatedEmail,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Authentication failed';
    console.error('Google Auth Error:', error);
    return Response.json({ error: message }, { status: 500 });
  }
}
