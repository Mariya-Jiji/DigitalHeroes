import Link from 'next/link';
import LogoutButton from './LogoutButton';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export default async function TopNav({ title, href }: { title: string, href: string }) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  );
  
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <nav className="w-full bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link href={href} className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
              Digital Heroes
            </Link>
            {title && (
              <span className="ml-4 pl-4 border-l border-white/20 text-white/50 text-sm font-medium tracking-wide uppercase">
                {title}
              </span>
            )}
          </div>
          <div className="flex items-center">
            {user ? (
              <LogoutButton />
            ) : (
              <Link href="/login" className="bg-white/10 hover:bg-white/20 text-white text-sm font-medium px-4 py-2 rounded-lg backdrop-blur-md border border-white/10 transition-all active:scale-95 shadow-sm">
                Log In
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
