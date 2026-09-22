import Link from 'next/link'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import TopNav from '@/components/TopNav'
import { Heart, Trophy, ArrowRight, ArrowRightCircle } from 'lucide-react'

export default async function HomePage() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )

  // Fetch featured charities
  const { data: featuredCharities } = await supabase
    .from('charities')
    .select('*')
    .eq('is_featured', true)
    .limit(4)

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white selection:bg-indigo-500/30">
      <TopNav title="" href="/" />
      
      <main className="w-full relative overflow-hidden">
        {/* Abstract Background Orbs */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
        <div className="absolute top-[40%] left-0 w-[500px] h-[500px] bg-purple-600/15 rounded-full blur-[120px] -translate-x-1/2 pointer-events-none"></div>
        <div className="absolute bottom-0 right-1/4 w-[700px] h-[700px] bg-pink-600/10 rounded-full blur-[150px] translate-y-1/3 pointer-events-none"></div>

        {/* 1. Hero Section */}
        <section className="relative z-10 pt-32 pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-sm font-medium mb-8">
            <Heart className="w-4 h-4" /> Supporting causes globally
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white via-indigo-100 to-purple-200 leading-tight">
            Play for the Jackpot. <br className="hidden md:block" />
            Win for the World.
          </h1>
          <p className="text-xl md:text-2xl text-white/60 mb-10 max-w-3xl leading-relaxed">
            Turn your everyday scores into winning lottery numbers while automatically funding the charities you care about most. 
          </p>
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <Link 
              href="/subscribe" 
              className="group relative px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-lg transition-all shadow-[0_0_30px_rgba(79,70,229,0.4)] hover:shadow-[0_0_40px_rgba(79,70,229,0.6)] flex items-center justify-center gap-2"
            >
              Start Playing Today <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link 
              href="/charities" 
              className="px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl font-bold text-lg transition-colors flex items-center justify-center"
            >
              Explore Charities
            </Link>
          </div>
        </section>

        {/* 2. How It Works */}
        <section className="relative z-10 py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-white/5">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">How It Works</h2>
            <p className="text-white/60 text-lg">Three simple steps to make a difference.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connecting line for desktop */}
            <div className="hidden md:block absolute top-1/2 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-y-1/2 z-0"></div>

            {/* Step 1 */}
            <div className="relative z-10 bg-[#0f0f0f]/80 backdrop-blur-xl border border-white/10 p-8 rounded-3xl text-center group hover:bg-[#1a1a1a]/80 transition-colors">
              <div className="w-16 h-16 mx-auto bg-indigo-500/20 text-indigo-400 rounded-2xl flex items-center justify-center mb-6 border border-indigo-500/30 group-hover:scale-110 transition-transform">
                <span className="text-2xl font-black">1</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Enter Your Scores</h3>
              <p className="text-white/60">Log your recent sports or gaming scores to generate your unique lottery numbers.</p>
            </div>

            {/* Step 2 */}
            <div className="relative z-10 bg-[#0f0f0f]/80 backdrop-blur-xl border border-white/10 p-8 rounded-3xl text-center group hover:bg-[#1a1a1a]/80 transition-colors">
              <div className="w-16 h-16 mx-auto bg-purple-500/20 text-purple-400 rounded-2xl flex items-center justify-center mb-6 border border-purple-500/30 group-hover:scale-110 transition-transform">
                <span className="text-2xl font-black">2</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Join the Draw</h3>
              <p className="text-white/60">Your active subscription enters those numbers into our massive monthly jackpot.</p>
            </div>

            {/* Step 3 */}
            <div className="relative z-10 bg-[#0f0f0f]/80 backdrop-blur-xl border border-white/10 p-8 rounded-3xl text-center group hover:bg-[#1a1a1a]/80 transition-colors">
              <div className="w-16 h-16 mx-auto bg-pink-500/20 text-pink-400 rounded-2xl flex items-center justify-center mb-6 border border-pink-500/30 group-hover:scale-110 transition-transform">
                <span className="text-2xl font-black">3</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Support Causes</h3>
              <p className="text-white/60">A portion of every subscription goes directly to your selected featured charity.</p>
            </div>
          </div>
        </section>

        {/* 3. Featured Charities */}
        {featuredCharities && featuredCharities.length > 0 && (
          <section className="relative z-10 py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-white/5">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
              <div>
                <h2 className="text-3xl md:text-5xl font-bold mb-4">Featured Charities</h2>
                <p className="text-white/60 text-lg max-w-2xl">Meet some of the incredible organizations our community is supporting this month.</p>
              </div>
              <Link href="/charities" className="text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-2 group whitespace-nowrap">
                View all charities <ArrowRightCircle className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredCharities.map((charity) => (
                <Link href={`/charities/${charity.slug}`} key={charity.id} className="group block">
                  <div className="bg-black/20 border border-white/10 rounded-3xl overflow-hidden backdrop-blur-xl transition-all hover:bg-white/5 hover:border-white/20 h-full flex flex-col">
                    {charity.image_url ? (
                      <div className="h-48 w-full overflow-hidden bg-white/5">
                        <img 
                          src={charity.image_url} 
                          alt={charity.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                    ) : (
                      <div className="h-48 w-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center">
                        <Heart className="w-12 h-12 text-white/20" />
                      </div>
                    )}
                    <div className="p-6 flex flex-col flex-grow">
                      <h3 className="font-bold text-lg text-white mb-2 line-clamp-1">{charity.name}</h3>
                      <p className="text-white/60 text-sm line-clamp-3 mb-4">{charity.description}</p>
                      <div className="mt-auto text-indigo-400 text-sm font-medium flex items-center gap-1 group-hover:text-indigo-300">
                        Learn more <ArrowRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* 4. Closing CTA */}
        <section className="relative z-10 py-32 px-4 sm:px-6 lg:px-8">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-indigo-900/20 pointer-events-none"></div>
          <div className="max-w-4xl mx-auto text-center relative z-10 bg-black/40 border border-white/10 backdrop-blur-2xl rounded-[3rem] p-12 md:p-20 shadow-2xl">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Ready to make an impact?</h2>
            <p className="text-xl text-white/60 mb-10 max-w-2xl mx-auto">
              Join thousands of heroes turning their playtime into real-world positive change. Subscribe now and secure your spot in the next monthly draw.
            </p>
            <Link 
              href="/subscribe" 
              className="inline-flex items-center gap-2 px-10 py-5 bg-white text-black hover:bg-gray-200 rounded-2xl font-bold text-xl transition-transform hover:scale-105 active:scale-95"
            >
              Get Started <Trophy className="w-6 h-6" />
            </Link>
          </div>
        </section>

      </main>
    </div>
  )
}
