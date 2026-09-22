import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import ScoreManager from '@/components/ScoreManager';
import WinnerProofUpload from './WinnerProofUpload';

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  let scores: any[] = [];
  let pendingWinId = null;

  if (user) {
    const { data: scoresData } = await supabase
      .from('scores')
      .select('id, value, played_on')
      .eq('user_id', user.id)
      .order('played_on', { ascending: false });
    
    if (scoresData) scores = scoresData;

    // Check for pending winnings without proof
    const { data: winnings } = await supabase
      .from('winnings')
      .select('id')
      .eq('user_id', user.id)
      .eq('verification', 'pending')
      .is('proof_url', null)
      .limit(1)
      .maybeSingle();

    if (winnings) {
      pendingWinId = winnings.id;
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">Your Dashboard</h1>
        <p className="text-white/60 text-lg">Manage your scores to participate in the upcoming draws.</p>
      </div>

      {pendingWinId && (
        <div className="mb-8">
          <WinnerProofUpload winningId={pendingWinId} />
        </div>
      )}

      <ScoreManager initialScores={scores} />
    </div>
  );
}
