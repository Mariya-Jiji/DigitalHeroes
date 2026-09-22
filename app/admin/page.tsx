import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Users, Trophy, Heart, Calendar } from 'lucide-react'

export default async function AdminDashboardPage() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )

  // 1. Total Users
  const { count: usersCount } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })

  // 2. Total Draws Run
  const { count: drawsCount } = await supabase
    .from('draws')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'published')

  // 3. Total Charity Contributions
  const { data: contributions } = await supabase
    .from('contributions')
    .select('amount')
  const totalContributions = contributions?.reduce((sum, c) => sum + Number(c.amount || 0), 0) || 0

  // 4. Active Prize Pool 
  // = Sum of unpaid winnings + rolled_out from latest draw
  const { data: unpaidWinnings } = await supabase
    .from('winnings')
    .select('amount')
    .neq('payment', 'paid')
  
  const unpaidSum = unpaidWinnings?.reduce((sum, w) => sum + Number(w.amount || 0), 0) || 0

  const { data: latestDraw } = await supabase
    .from('draws')
    .select('id')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  let latestRolledOut = 0
  if (latestDraw) {
    const { data: tier5Pool } = await supabase
      .from('prize_pools')
      .select('rolled_out')
      .eq('draw_id', latestDraw.id)
      .eq('tier', 5)
      .single()
    if (tier5Pool) {
      latestRolledOut = Number(tier5Pool.rolled_out || 0)
    }
  }

  const activePrizePool = unpaidSum + latestRolledOut

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Admin Dashboard</h1>
        <p className="text-white/60">Platform metrics and quick management links.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Metric 1 */}
        <div className="bg-black/20 border border-white/10 rounded-xl p-6 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white/60 font-medium">Total Users</h3>
            <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-400">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-bold text-white">{usersCount || 0}</p>
        </div>

        {/* Metric 2 */}
        <div className="bg-black/20 border border-white/10 rounded-xl p-6 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white/60 font-medium">Active Prize Pool</h3>
            <div className="p-2 bg-green-500/20 rounded-lg text-green-400">
              <Trophy className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-bold text-white">${activePrizePool.toFixed(2)}</p>
          {latestRolledOut > 0 && <p className="text-xs text-amber-400 mt-2">Includes ${latestRolledOut.toFixed(2)} Jackpot Rollover</p>}
        </div>

        {/* Metric 3 */}
        <div className="bg-black/20 border border-white/10 rounded-xl p-6 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white/60 font-medium">Total Contributions</h3>
            <div className="p-2 bg-pink-500/20 rounded-lg text-pink-400">
              <Heart className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-bold text-white">${totalContributions.toFixed(2)}</p>
        </div>

        {/* Metric 4 */}
        <div className="bg-black/20 border border-white/10 rounded-xl p-6 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white/60 font-medium">Published Draws</h3>
            <div className="p-2 bg-purple-500/20 rounded-lg text-purple-400">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-bold text-white">{drawsCount || 0}</p>
        </div>

      </div>
    </div>
  )
}
