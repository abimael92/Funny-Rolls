// middleware.ts
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
	// 1. Create an initial response
	let response = NextResponse.next({
		request: {
			headers: request.headers,
		},
	});

	// 2. Initialize Supabase Client
	const supabase = createServerClient(
		process.env.NEXT_PUBLIC_SUPABASE_URL!,
		process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
		{
			cookies: {
				get(name: string) {
					return request.cookies.get(name)?.value;
				},
				set(name: string, value: string, options: any) {
					// Sync cookies to both request and response
					request.cookies.set({ name, value, ...options });
					response = NextResponse.next({
						request: {
							headers: request.headers,
						},
					});
					response.cookies.set({ name, value, ...options });
				},
				remove(name: string, options: any) {
					request.cookies.set({ name, value: '', ...options });
					response = NextResponse.next({
						request: {
							headers: request.headers,
						},
					});
					response.cookies.set({ name, value: '', ...options });
				},
			},
		},
	);

	// 3. Refresh/Get User
	const {
		data: { user },
	} = await supabase.auth.getUser();

	const isProtectedRoute =
		request.nextUrl.pathname.startsWith('/admin') ||
		request.nextUrl.pathname.startsWith('/kitchen');
	const isAuthRoute = request.nextUrl.pathname.startsWith('/login');

	// 4. Redirect Logic
	if (!user && isProtectedRoute) {
		const url = new URL('/login', request.url);
		url.searchParams.set('redirectedFrom', request.nextUrl.pathname);
		return NextResponse.redirect(url);
	}

	if (user && isAuthRoute) {
		return NextResponse.redirect(new URL('/admin/dashboard', request.url));
	}

	return response;
}

export const config = {
	matcher: [
		'/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
	],
};
