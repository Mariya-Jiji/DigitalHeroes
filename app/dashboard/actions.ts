'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

async function getSupabase() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch (error) {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}

export async function addScore(prevState: any, formData: FormData) {
  const supabase = await getSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { error: 'Not authenticated' }
  }

  const valueStr = formData.get('value') as string
  const playedOnStr = formData.get('played_on') as string

  if (!valueStr || !playedOnStr) {
    return { error: 'Please provide both score and date' }
  }

  const value = parseInt(valueStr, 10)
  
  if (isNaN(value) || value < 1 || value > 45) {
    return { error: 'Score must be between 1 and 45' }
  }

  const playedOnDate = new Date(playedOnStr)
  const today = new Date()
  
  if (playedOnDate > today) {
    return { error: 'Date cannot be in the future' }
  }

  // Insert the score
  const { error } = await supabase
    .from('scores')
    .insert({
      user_id: user.id,
      value: value,
      played_on: playedOnStr
    })

  if (error) {
    // 23505 is the PostgreSQL error code for unique_violation
    if (error.code === '23505') {
      return { error: 'You already have a score for this date — edit it below instead' }
    }
    console.error('Error inserting score:', error)
    return { error: 'Failed to add score. Please try again.' }
  }

  revalidatePath('/dashboard')
  return { success: true }
}

export async function updateScore(id: string, value: number) {
  const supabase = await getSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { error: 'Not authenticated' }
  }

  if (isNaN(value) || value < 1 || value > 45) {
    return { error: 'Score must be between 1 and 45' }
  }

  const { error } = await supabase
    .from('scores')
    .update({ value })
    .eq('id', id)
    .eq('user_id', user.id) // Ensure user owns this score

  if (error) {
    console.error('Error updating score:', error)
    return { error: 'Failed to update score' }
  }

  revalidatePath('/dashboard')
  return { success: true }
}

export async function deleteScore(id: string) {
  const supabase = await getSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { error: 'Not authenticated' }
  }

  const { error } = await supabase
    .from('scores')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    console.error('Error deleting score:', error)
    return { error: 'Failed to delete score' }
  }

  revalidatePath('/dashboard')
  return { success: true }
}

export async function uploadProof(winningsId: string, formData: FormData) {
  const supabase = await getSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { error: 'Not authenticated' }
  }

  const file = formData.get('file') as File
  if (!file) {
    return { error: 'No file provided' }
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const fileName = `${winningsId}-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`

  // Create admin client to bypass storage RLS
  const adminSupabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll() { return [] }, setAll() {} } }
  )

  const { error: uploadError } = await adminSupabase.storage
    .from('winner-proofs')
    .upload(fileName, buffer, {
      contentType: file.type,
      upsert: true
    })

  if (uploadError) {
    console.error('Upload error:', uploadError)
    return { error: 'Failed to upload file' }
  }

  const { data: { publicUrl } } = adminSupabase.storage
    .from('winner-proofs')
    .getPublicUrl(fileName)

  // Update winnings row
  const { error: updateError } = await adminSupabase
    .from('winnings')
    .update({ proof_url: publicUrl })
    .eq('id', winningsId)
    .eq('user_id', user.id)

  if (updateError) {
    console.error('Update error:', updateError)
    return { error: 'Failed to save proof URL' }
  }

  revalidatePath('/dashboard')
  return { success: true }
}
