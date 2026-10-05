import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Google login redirects here. Your auth page already points to /auth/callback,
// but the route was missing from the zip, so Google sign-in would 404.
export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  let next = searchParams.get('next') ?? '/';
  if (!next.startsWith('/') || next.startsWith('//')) next = '/'; // block open redirects

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  }
  return NextResponse.redirect(`${origin}/auth?mode=login&error=oauth`);
}
