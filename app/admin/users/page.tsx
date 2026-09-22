import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export default async function AdminUsersPage() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )

  // Fetch profiles, subscriptions, and scores
  const { data: profiles } = await supabase
    .from('profiles')
    .select(`
      *,
      subscriptions(plan, status),
      scores(value)
    `)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">User Directory</h1>
        <p className="text-white/60">View all registered users, their subscription status, and their active scores.</p>
      </div>

      <div className="bg-black/20 border border-white/10 rounded-xl overflow-hidden backdrop-blur-xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/10 bg-white/5">
              <th className="p-4 text-white/60 font-medium text-sm">User</th>
              <th className="p-4 text-white/60 font-medium text-sm">Role</th>
              <th className="p-4 text-white/60 font-medium text-sm">Subscription</th>
              <th className="p-4 text-white/60 font-medium text-sm">Active Scores</th>
            </tr>
          </thead>
          <tbody>
            {!profiles || profiles.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-8 text-center text-white/40">No users found.</td>
              </tr>
            ) : profiles.map(profile => {
              const activeSub = profile.subscriptions?.find((s: any) => s.status === 'active')
              const scores = profile.scores?.map((s: any) => s.value) || []
              
              return (
                <tr key={profile.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="p-4">
                    <div className="text-white font-medium">{profile.full_name || 'Anonymous User'}</div>
                    <div className="text-white/40 text-xs font-mono">{profile.id}</div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      profile.role === 'admin' ? 'bg-purple-500/20 text-purple-400' : 'bg-white/10 text-white/60'
                    }`}>
                      {profile.role.toUpperCase()}
                    </span>
                  </td>
                  <td className="p-4">
                    {activeSub ? (
                      <div className="flex flex-col gap-1">
                        <span className="px-2 py-1 rounded text-xs font-semibold bg-green-500/20 text-green-400 w-max">
                          ACTIVE
                        </span>
                        <span className="text-white/60 text-xs capitalize">{activeSub.plan}</span>
                      </div>
                    ) : (
                      <span className="px-2 py-1 rounded text-xs font-semibold bg-red-500/20 text-red-400">
                        INACTIVE
                      </span>
                    )}
                  </td>
                  <td className="p-4">
                    {scores.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {scores.map((score: number, idx: number) => (
                          <div key={idx} className="w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-500/50 flex items-center justify-center text-sm font-bold text-indigo-300">
                            {score}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-white/40 text-sm">No scores</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
