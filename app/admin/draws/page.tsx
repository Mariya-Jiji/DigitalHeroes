import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import Link from 'next/link'
import CreateDrawForm from './CreateDrawForm'

export default async function DrawsAdminPage() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() }
      }
    }
  )

  const { data: draws } = await supabase
    .from('draws')
    .select('*')
    .order('period', { ascending: false })

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Draw Management</h1>
          <p className="text-white/60">Create and publish monthly draws.</p>
        </div>
      </div>

      <CreateDrawForm />

      <div className="bg-black/20 border border-white/10 rounded-xl overflow-hidden backdrop-blur-xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/10 bg-white/5">
              <th className="p-4 text-white/60 font-medium text-sm">Period</th>
              <th className="p-4 text-white/60 font-medium text-sm">Mode</th>
              <th className="p-4 text-white/60 font-medium text-sm">Status</th>
              <th className="p-4 text-white/60 font-medium text-sm text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {draws?.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-8 text-center text-white/40">No draws created yet.</td>
              </tr>
            ) : draws?.map(draw => (
              <tr key={draw.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                <td className="p-4 text-white font-medium">{draw.period}</td>
                <td className="p-4 text-white/80 capitalize">{draw.mode}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    draw.status === 'published' ? 'bg-green-500/20 text-green-400' :
                    draw.status === 'simulated' ? 'bg-amber-500/20 text-amber-400' :
                    'bg-white/10 text-white/60'
                  }`}>
                    {draw.status.toUpperCase()}
                  </span>
                </td>
                <td className="p-4 text-right">
                  <Link 
                    href={`/admin/draws/${draw.id}`}
                    className="text-indigo-400 hover:text-indigo-300 font-medium text-sm"
                  >
                    View Details &rarr;
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
