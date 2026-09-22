'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

async function getSupabaseAdmin() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() }, setAll() {} } }
  )
}

export async function createCharity(prevState: any, formData: FormData) {
  const supabase = await getSupabaseAdmin()
  const name = formData.get('name') as string
  const slug = formData.get('slug') as string
  const description = formData.get('description') as string
  const image_url = formData.get('image_url') as string
  const is_featured = formData.get('is_featured') === 'true'

  if (!name || !slug) return { error: 'Name and slug are required' }

  const { error } = await supabase.from('charities').insert({
    name, slug, description, image_url, is_featured, events: []
  })

  if (error) {
    if (error.code === '23505') return { error: 'A charity with this slug already exists' }
    return { error: 'Failed to create charity' }
  }

  revalidatePath('/admin/charities')
  revalidatePath('/charities')
  return { success: true }
}

export async function updateCharity(prevState: any, formData: FormData) {
  const supabase = await getSupabaseAdmin()
  const id = formData.get('id') as string
  const name = formData.get('name') as string
  const slug = formData.get('slug') as string
  const description = formData.get('description') as string
  const image_url = formData.get('image_url') as string
  const is_featured = formData.get('is_featured') === 'true'

  if (!id || !name || !slug) return { error: 'Missing required fields' }

  const { error } = await supabase.from('charities').update({
    name, slug, description, image_url, is_featured
  }).eq('id', id)

  if (error) return { error: 'Failed to update charity' }

  revalidatePath('/admin/charities')
  revalidatePath('/charities')
  return { success: true }
}

export async function deleteCharity(id: string) {
  const supabase = await getSupabaseAdmin()
  const { error } = await supabase.from('charities').delete().eq('id', id)
  
  if (error) return { error: 'Failed to delete charity (ensure no users are linked)' }
  
  revalidatePath('/admin/charities')
  revalidatePath('/charities')
  return { success: true }
}
