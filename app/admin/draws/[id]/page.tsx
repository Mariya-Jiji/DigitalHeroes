import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import Link from 'next/link'
import DrawControls from './DrawControls'

export default async function DrawDetailsPage({ params }: { params: { id: string } }) {
  const { id } = await params
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: { getAll() { return cookieStore.getAll() } }
    }
  )

  const { data: draw } = await supabase.from('draws').select('*').eq('id', id).single()

  if (!draw) return <div className="text-white p-8">Draw not found.</div>

  // Fetch entries if simulated or published
  let entries: any[] = []
  if (draw.status !== 'draft') {
    const { data } = await supabase.from('draw_entries').select('user_id, match_count, numbers').eq('draw_id', id)
    entries = data || []
  }

  const winners3 = entries.filter(e => e.match_count === 3)
  const winners4 = entries.filter(e => e.match_count === 4)
  const winners5 = entries.filter(e => e.match_count === 5)

  // Calculate estimated pool if simulated
  let estTier5 = 0, estTier4 = 0, estTier3 = 0, rolledInEst = 0
  if (draw.status === 'simulated') {
    const { data: subs } = await supabase.from('subscriptions').select('plan').eq('status', 'active')
    let totalRev = 0
    subs?.forEach(s => totalRev += s.plan === 'monthly' ? 19.00 : 15.83)
    const pool = totalRev * 0.30
    estTier5 = pool * 0.40
    estTier4 = pool * 0.35
    estTier3 = pool * 0.25

    const { data: lastDraw } = await supabase.from('draws').select('id').eq('status', 'published').order('published_at', { ascending: false }).limit(1).maybeSingle()
    if (lastDraw) {
      const { data: t5 } = await supabase.from('prize_pools').select('rolled_out').eq('draw_id', lastDraw.id).eq('tier', 5).single()
      if (t5 && t5.rolled_out) {
        rolledInEst = t5.rolled_out
        estTier5 += rolledInEst
      }
    }
  }

  // Fetch actual pools if published
  let actualPools: Record<number, any> = {}
  if (draw.status === 'published') {
    const { data: pools } = await supabase.from('prize_pools').select('*').eq('draw_id', id)
    pools?.forEach(p => actualPools[p.tier] = p)
  }

  return (
    <div className="space-y-8 max-w-4xl">
      <div className="flex items-center gap-4 text-white/60 text-sm mb-4">
        <Link href="/admin/draws" className="hover:text-white">&larr; Back to Draws</Link>
      </div>

      <div className="bg-black/20 border border-white/10 rounded-xl p-8 backdrop-blur-xl space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Draw: {draw.period}</h1>
            <p className="text-white/60 capitalize">Mode: {draw.mode}</p>
          </div>
          <span className={`px-3 py-1.5 rounded-full text-sm font-semibold ${
            draw.status === 'published' ? 'bg-green-500/20 text-green-400' :
            draw.status === 'simulated' ? 'bg-amber-500/20 text-amber-400' :
            'bg-white/10 text-white/60'
          }`}>
            {draw.status.toUpperCase()}
          </span>
        </div>

        {draw.status !== 'draft' && draw.drawn_numbers && (
          <div className="py-4 border-y border-white/10">
            <h3 className="text-sm font-medium text-white/60 mb-3">Drawn Numbers</h3>
            <div className="flex gap-3">
              {draw.drawn_numbers.map((n: number, i: number) => (
                <div key={i} className="w-12 h-12 rounded-full bg-indigo-500/20 border border-indigo-500/50 flex items-center justify-center text-xl font-bold text-indigo-200">
                  {n}
                </div>
              ))}
            </div>
          </div>
        )}

        {draw.status !== 'draft' && (
          <div>
            <h3 className="text-lg font-bold text-white mb-4">
              {draw.status === 'published' ? 'Final Payouts' : 'Estimated Payouts'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* Tier 5 */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold text-white">Match 5 (Jackpot)</span>
                  <span className="text-xs bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full">40%</span>
                </div>
                {draw.status === 'simulated' && rolledInEst > 0 && (
                  <div className="text-xs text-green-400 mb-2">Includes ${rolledInEst.toFixed(2)} rolled over!</div>
                )}
                {draw.status === 'published' && actualPools[5]?.rolled_in > 0 && (
                  <div className="text-xs text-green-400 mb-2">Includes ${actualPools[5].rolled_in.toFixed(2)} rolled over!</div>
                )}
                <div className="text-2xl font-bold text-white">
                  ${draw.status === 'published' ? (actualPools[5]?.amount || 0).toFixed(2) : estTier5.toFixed(2)}
                </div>
                <div className="text-sm text-white/60 mt-1">
                  {winners5.length} Winners 
                  {winners5.length > 0 && ` ($${((draw.status === 'published' ? actualPools[5]?.amount : estTier5) / winners5.length).toFixed(2)} each)`}
                </div>
                {draw.status === 'published' && actualPools[5]?.rolled_out > 0 && (
                  <div className="text-xs text-amber-400 mt-2">No winners. Rolled over to next draw!</div>
                )}
              </div>

              {/* Tier 4 */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold text-white">Match 4</span>
                  <span className="text-xs bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full">35%</span>
                </div>
                <div className="text-2xl font-bold text-white">
                  ${draw.status === 'published' ? (actualPools[4]?.amount || 0).toFixed(2) : estTier4.toFixed(2)}
                </div>
                <div className="text-sm text-white/60 mt-1">
                  {winners4.length} Winners
                  {winners4.length > 0 && ` ($${((draw.status === 'published' ? actualPools[4]?.amount : estTier4) / winners4.length).toFixed(2)} each)`}
                </div>
              </div>

              {/* Tier 3 */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold text-white">Match 3</span>
                  <span className="text-xs bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full">25%</span>
                </div>
                <div className="text-2xl font-bold text-white">
                  ${draw.status === 'published' ? (actualPools[3]?.amount || 0).toFixed(2) : estTier3.toFixed(2)}
                </div>
                <div className="text-sm text-white/60 mt-1">
                  {winners3.length} Winners
                  {winners3.length > 0 && ` ($${((draw.status === 'published' ? actualPools[3]?.amount : estTier3) / winners3.length).toFixed(2)} each)`}
                </div>
              </div>
            </div>
          </div>
        )}

        <DrawControls drawId={draw.id} status={draw.status} />
      </div>
    </div>
  )
}
