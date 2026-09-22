'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

export default function SignupForm({ charities }: { charities: any[] }) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [charityId, setCharityId] = useState(charities[0]?.id || '');
  const [charityPct, setCharityPct] = useState(10);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const router = useRouter();
  const supabase = createClient();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          charity_id: charityId,
          charity_pct: Number(charityPct),
        },
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push('/dashboard');
      router.refresh();
    }
  };

  return (
    <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl w-full max-w-md">
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">Join Digital Heroes</h2>
        <p className="text-white/60">Play golf. Give back. Win big.</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-200 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSignup} className="space-y-5">
        <div>
          <label className="block text-white/80 text-sm font-medium mb-1.5">Full Name</label>
          <input 
            type="text" 
            required 
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            placeholder="Tiger Woods"
          />
        </div>

        <div>
          <label className="block text-white/80 text-sm font-medium mb-1.5">Email</label>
          <input 
            type="email" 
            required 
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            placeholder="tiger@example.com"
          />
        </div>

        <div>
          <label className="block text-white/80 text-sm font-medium mb-1.5">Password</label>
          <input 
            type="password" 
            required 
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            placeholder="••••••••"
          />
        </div>

        <div>
          <label className="block text-white/80 text-sm font-medium mb-1.5">Select a Charity</label>
          <select 
            required
            value={charityId}
            onChange={e => setCharityId(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all appearance-none [&>option]:bg-slate-800"
          >
            {charities.map(charity => (
              <option key={charity.id} value={charity.id}>{charity.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-white/80 text-sm font-medium mb-1.5">Charity Donation Percentage (%)</label>
          <input 
            type="number" 
            required 
            min="10"
            max="100"
            value={charityPct}
            onChange={e => setCharityPct(Number(e.target.value))}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
          />
          <p className="text-white/40 text-xs mt-1.5">Minimum 10% goes to your selected charity.</p>
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-3 rounded-xl transition-all shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:shadow-[0_0_25px_rgba(79,70,229,0.5)] active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100"
        >
          {loading ? 'Creating Account...' : 'Sign Up'}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-white/60 text-sm">
          Already have an account?{' '}
          <Link href="/login" className="text-indigo-400 hover:text-indigo-300 transition-colors font-medium">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
