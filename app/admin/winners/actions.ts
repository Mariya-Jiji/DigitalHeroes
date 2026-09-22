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

export async function updateVerification(id: string, status: 'approved' | 'rejected') {
  const supabase = await getSupabaseAdmin()
  
  const { error } = await supabase
    .from('winnings')
    .update({ verification: status })
    .eq('id', id)

  if (error) {
    console.error('Update verification error:', error)
    return { error: 'Failed to update verification status' }
  }

  revalidatePath('/admin/winners')
  return { success: true }
}

export async function markPaid(id: string) {
  const supabase = await getSupabaseAdmin()
  
  // Verify it is approved first
  const { data: win } = await supabase
    .from('winnings')
    .select('verification')
    .eq('id', id)
    .single()
    
  if (win?.verification !== 'approved') {
    return { error: 'Cannot mark as paid until verification is approved' }
  }

  const { error } = await supabase
    .from('winnings')
    .update({ payment: 'paid' })
    .eq('id', id)

  if (error) {
    console.error('Update payment error:', error)
    return { error: 'Failed to update payment status' }
  }

  revalidatePath('/admin/winners')
  return { success: true }
}
