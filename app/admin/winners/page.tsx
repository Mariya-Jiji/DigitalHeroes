import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import WinnersList from './WinnersList'

export default async function AdminWinnersPage() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )

  const { data: winners } = await supabase
    .from('winnings')
    .select(`
      *,
      profiles:user_id(full_name),
      draws:draw_id(period)
    `)
    .order('id', { ascending: false })

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Winner Payouts</h1>
          <p className="text-white/60">Review proofs, approve verifications, and mark payouts as completed.</p>
        </div>
      </div>

      <WinnersList winners={winners || []} />
    </div>
  )
}
