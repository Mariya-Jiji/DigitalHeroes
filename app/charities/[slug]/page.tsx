import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import Link from 'next/link'
import TopNav from '@/components/TopNav'
import { notFound } from 'next/navigation'
import { Calendar } from 'lucide-react'

export default async function CharityDetailsPage({ params }: { params: { slug: string } }) {
  const { slug } = await params
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )

  const { data: charity } = await supabase
    .from('charities')
    .select('*')
    .eq('slug', slug)
    .single()

  if (!charity) return notFound()

  // Parse events if it's JSON array
  let events = []
  if (Array.isArray(charity.events)) {
    events = charity.events
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <TopNav title="Charity Details" href="/charities" />
      
      <main className="w-full h-full relative pt-24 pb-16">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link href="/charities" className="inline-flex items-center text-white/60 hover:text-white mb-8 transition-colors">
            &larr; Back to Charities
          </Link>
          
          <div className="bg-black/20 border border-white/10 rounded-3xl overflow-hidden backdrop-blur-xl shadow-2xl">
            {charity.image_url && (
              <div className="h-64 md:h-80 w-full overflow-hidden">
                <img 
                  src={charity.image_url} 
                  alt={charity.name} 
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            
            <div className="p-8 md:p-12">
              <h1 className="text-4xl font-bold text-white mb-6">{charity.name}</h1>
              <p className="text-lg text-white/80 leading-relaxed mb-12">
                {charity.description}
              </p>
              
              <div className="border-t border-white/10 pt-10">
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                  <Calendar className="w-6 h-6 text-indigo-400" /> 
                  Upcoming Events
                </h2>
                
                {events.length === 0 ? (
                  <p className="text-white/40">No upcoming events listed for this charity.</p>
                ) : (
                  <ul className="space-y-4">
                    {events.map((event: any, i: number) => (
                      <li key={i} className="bg-white/5 border border-white/10 rounded-xl p-5 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                        <div>
                          <h3 className="font-semibold text-lg text-white">{event.name || event.title || 'Event'}</h3>
                          {event.description && <p className="text-white/60 text-sm mt-1">{event.description}</p>}
                        </div>
                        {event.date && (
                          <div className="bg-black/40 border border-white/5 px-4 py-2 rounded-lg whitespace-nowrap">
                            <span className="text-indigo-300 font-medium">{event.date}</span>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
