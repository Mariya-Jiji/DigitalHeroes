import TopNav from '@/components/TopNav';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <TopNav title="Admin Portal" href="/admin" />
      <main className="w-full h-full relative">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] translate-y-1/2 -translate-x-1/3 pointer-events-none"></div>
        <div className="relative z-10 max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          {/* Admin Navigation */}
          <nav className="flex space-x-6 mb-8 border-b border-white/10 pb-4">
            <a href="/admin" className="text-white/80 hover:text-white font-medium transition-colors">Dashboard</a>
            <a href="/admin/draws" className="text-white/80 hover:text-white font-medium transition-colors">Draws</a>
            <a href="/admin/winners" className="text-white/80 hover:text-white font-medium transition-colors">Winners</a>
            <a href="/admin/charities" className="text-white/80 hover:text-white font-medium transition-colors">Charities</a>
            <a href="/admin/users" className="text-white/80 hover:text-white font-medium transition-colors">Users</a>
          </nav>
          
          {children}
        </div>
      </main>
    </div>
  );
}
