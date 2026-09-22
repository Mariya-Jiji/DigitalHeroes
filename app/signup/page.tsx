import { createClient } from '@/lib/supabase/server';
import SignupForm from './SignupForm';

export default async function SignupPage() {
  const supabase = await createClient();
  const { data: charities } = await supabase.from('charities').select('*');
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-900/40 via-[#0a0a0a] to-black p-4 relative overflow-hidden">
      {/* Decorative background blobs */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px] translate-y-1/2 -translate-x-1/3"></div>
      
      <div className="relative z-10 w-full max-w-md">
        <SignupForm charities={charities || []} />
      </div>
    </div>
  );
}
