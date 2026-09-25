import { createSession, ALLOWED_EMAIL } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { credential, email: manualEmail } = await req.json();

    let authenticatedEmail = '';

    // 1. If Google credential token was provided, verify with Google
    if (credential) {
      const response = await fetch(
        `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`
      );

      if (!response.ok) {
        return Response.json(
          { error: 'Invalid Google credential token.' },
          { status: 400 }
        );
      }

      const tokenInfo = await response.json();
      authenticatedEmail = tokenInfo.email || '';
    } else if (manualEmail) {
      // In case owner signs in with manual verification
      authenticatedEmail = manualEmail;
    }

    if (!authenticatedEmail) {
      return Response.json(
        { error: 'No email found in credentials.' },
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
