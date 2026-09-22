import Link from 'next/link';
import LogoutButton from './LogoutButton';

export default function TopNav({ title, href }: { title: string, href: string }) {
  return (
    <nav className="w-full bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link href={href} className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
              Digital Heroes
            </Link>
            <span className="ml-4 pl-4 border-l border-white/20 text-white/50 text-sm font-medium tracking-wide uppercase">
              {title}
            </span>
          </div>
          <div className="flex items-center">
            <LogoutButton />
          </div>
        </div>
      </div>
    </nav>
  );
}
