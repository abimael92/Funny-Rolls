import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createServerAuthClient() {
	const cookieStore = await cookies();

	return createServerClient(
		process.env.NEXT_PUBLIC_SUPABASE_URL!,
		process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
		{
			cookies: {
				get(name: string) {
					return cookieStore.get(name)?.value;
				},
				set() {
					// Server components cannot set cookies
				},
				remove() {
					// Server components cannot remove cookies
				},
			},
		},
	);
}
