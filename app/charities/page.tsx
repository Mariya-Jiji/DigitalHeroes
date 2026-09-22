import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import TopNav from '@/components/TopNav'
import CharityDirectory from './CharityDirectory'

export default async function CharitiesPage() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: { getAll() { return cookieStore.getAll() } }
    }
  )

  const { data: charities } = await supabase
    .from('charities')
    .select('id, name, slug, description, image_url')
    .order('name')

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <TopNav title="Charities" href="/" />
      
      <main className="w-full h-full relative pt-24 pb-16">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[150px] translate-y-1/3 -translate-x-1/3 pointer-events-none" />
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">Our Charity Partners</h1>
            <p className="text-xl text-white/60 max-w-2xl mx-auto">
              Discover the incredible organizations supported by the Digital Heroes community.
            </p>
          </div>

          <CharityDirectory charities={charities || []} />
        </div>
      </main>
    </div>
  )
}
