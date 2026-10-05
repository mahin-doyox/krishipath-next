import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

const LOGIN_REQUIRED = ['/my-crops', '/crop-chat', '/crop-disease', '/profile'];

export async function middleware(request) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(list) {
          list.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser(); // also refreshes the session cookie
  const path = request.nextUrl.pathname;

  const needsLogin = LOGIN_REQUIRED.some((p) => path.startsWith(p)) || path.startsWith('/admin');
  if (needsLogin && !user) {
    const url = request.nextUrl.clone();
    url.pathname = '/auth';
    url.search = `?mode=login&redirect=${encodeURIComponent(path)}`;
    return NextResponse.redirect(url);
  }

  // Real admin check on the server (the page's own check is only cosmetic)
  if (path.startsWith('/admin')) {
    const { data: p } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
    if (p?.role !== 'admin') return NextResponse.redirect(new URL('/', request.url));
  }
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icon-.*|manifest.json|.*\\.(?:svg|png|jpg|jpeg|webp|ico)$).*)'],
};
