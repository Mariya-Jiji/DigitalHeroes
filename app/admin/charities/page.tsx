import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import CharitiesListClient from './CharitiesListClient'

export default async function AdminCharitiesPage() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )

  const { data: charities } = await supabase
    .from('charities')
    .select('*')
    .order('name')

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Charity Management</h1>
        <p className="text-white/60">Add, edit, or remove partner charities.</p>
      </div>

      <CharitiesListClient charities={charities || []} />
    </div>
  )
}
