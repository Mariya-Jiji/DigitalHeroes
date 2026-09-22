'use client';

import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function LogoutButton() {
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <button
      onClick={handleLogout}
      className="bg-white/10 hover:bg-white/20 text-white text-sm font-medium px-4 py-2 rounded-lg backdrop-blur-md border border-white/10 transition-all active:scale-95 shadow-sm"
    >
      Log Out
    </button>
  );
}
