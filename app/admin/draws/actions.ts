'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

/*
 * DOCUMENTED DESIGN DECISIONS:
 * 
 * 1. Numbers = Scores: A user's 5 retained scores (each 1-45) inherently serve as their 
 *    lottery numbers for that draw period. We snapshot them into draw_entries.
 * 2. Weighted Mode Formula: Frequencies are built by tallying all scores across eligible users. 
 *    To ensure no number has a 0% chance, all 45 numbers start with a baseline weight of 1.
 *    Numbers appearing more frequently in the population have a proportionally higher chance of being drawn.
 * 3. Prize Pool Contribution (30%): The total pool is calculated as 30% of the active subscriber revenue this period. 
 *    We assume $19.00/mo for monthly plans and $15.83/mo ($190/12) for yearly plans to determine the monthly equivalent.
 * 4. Rollover Chains: If the 5-match tier has 0 winners, its entire allocation becomes `rolled_out` 
 *    and is pulled forward into the next published draw's `rolled_in` 5-match tier, allowing rollovers to chain indefinitely.
 */

async function getSupabaseAdmin() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // Use service role for admin tasks spanning all users
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll() {}
      },
    }
  )
}

export async function createDraw(prevState: any, formData: FormData) {
  const supabase = await getSupabaseAdmin()
  const period = formData.get('period') as string
  const mode = formData.get('mode') as string
  
  if (!period || !period.match(/^\d{4}-\d{2}$/)) {
    return { error: 'Period must be in YYYY-MM format' }
  }
  
  const { error } = await supabase.from('draws').insert({
    period,
    mode,
    status: 'draft'
  })

  if (error) {
    if (error.code === '23505') {
      return { error: 'A draw for this period already exists' }
    }
    console.error('Error creating draw:', error)
    return { error: 'Failed to create draw' }
  }

  revalidatePath('/admin/draws')
  return { success: true }
}

export async function simulateDraw(drawId: string) {
  const supabase = await getSupabaseAdmin()

  // Verify draw exists and is not published
  const { data: draw, error: drawErr } = await supabase.from('draws').select('*').eq('id', drawId).single()
  if (drawErr || !draw) return { error: 'Draw not found' }
  if (draw.status === 'published') return { error: 'Cannot simulate a published draw' }

  // Safe re-run: delete existing draw_entries for this draw to avoid duplicates
  await supabase.from('draw_entries').delete().eq('draw_id', drawId)

  // 1. Fetch eligible users (active sub + exactly 5 scores)
  // Get active subscriptions
  const { data: subs } = await supabase.from('subscriptions').select('user_id, plan').eq('status', 'active')
  if (!subs || subs.length === 0) return { error: 'No active subscribers found' }
  const activeUserIds = subs.map(s => s.user_id)

  // Get scores for active users
  const { data: allScores } = await supabase.from('scores').select('user_id, value').in('user_id', activeUserIds)
  
  // Group by user
  const userScores: Record<string, number[]> = {}
  allScores?.forEach(s => {
    if (!userScores[s.user_id]) userScores[s.user_id] = []
    userScores[s.user_id].push(s.value)
  })

  // Filter to only those with exactly 5 scores
  const eligibleUsers = Object.entries(userScores).filter(([_, scores]) => scores.length === 5)
  if (eligibleUsers.length === 0) return { error: 'No active subscribers with exactly 5 scores found' }

  // 2. Generate 5 unique numbers (1-45)
  let drawnNumbers: number[] = []
  
  if (draw.mode === 'random') {
    const nums = Array.from({ length: 45 }, (_, i) => i + 1)
    for (let i = nums.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [nums[i], nums[j]] = [nums[j], nums[i]]
    }
    drawnNumbers = nums.slice(0, 5)
  } else if (draw.mode === 'weighted') {
    // Weighted Mode Formula
    // Baseline weight of 1 for all numbers
    const weights: Record<number, number> = {}
    for (let i = 1; i <= 45; i++) weights[i] = 1

    // Add frequencies from eligible users
    eligibleUsers.forEach(([_, scores]) => {
      scores.forEach(val => weights[val] += 1)
    })

    // Draw 5 without replacement
    const available = Array.from({ length: 45 }, (_, i) => i + 1)
    for (let i = 0; i < 5; i++) {
      let totalWeight = available.reduce((sum, num) => sum + weights[num], 0)
      let rand = Math.random() * totalWeight
      let selected = available[0]
      
      for (let num of available) {
        rand -= weights[num]
        if (rand <= 0) {
          selected = num
          break
        }
      }
      
      drawnNumbers.push(selected)
      // Remove from available
      const idx = available.indexOf(selected)
      if (idx > -1) available.splice(idx, 1)
    }
  }

  // 3. Compute match_count and write draw_entries
  const entriesToInsert = eligibleUsers.map(([userId, scores]) => {
    const matchCount = scores.filter(s => drawnNumbers.includes(s)).length
    return {
      draw_id: drawId,
      user_id: userId,
      numbers: scores,
      match_count: matchCount
    }
  })

  // Batch insert
  const { error: insertErr } = await supabase.from('draw_entries').insert(entriesToInsert)
  if (insertErr) {
    console.error('Insert entries error:', insertErr)
    return { error: 'Failed to insert draw entries' }
  }

  // Update draw status and drawn numbers
  await supabase.from('draws').update({
    drawn_numbers: drawnNumbers,
    status: 'simulated'
  }).eq('id', drawId)

  revalidatePath(`/admin/draws/${drawId}`)
  return { success: true }
}

export async function publishDraw(drawId: string) {
  const supabase = await getSupabaseAdmin()

  const { data: draw, error: drawErr } = await supabase.from('draws').select('*').eq('id', drawId).single()
  if (drawErr || !draw) return { error: 'Draw not found' }
  if (draw.status !== 'simulated') return { error: 'Draw must be simulated before publishing' }

  // 1. Calculate Prize Pool
  const { data: subs } = await supabase.from('subscriptions').select('plan').eq('status', 'active')
  let totalRevenue = 0
  subs?.forEach(sub => {
    if (sub.plan === 'monthly') totalRevenue += 19.00
    if (sub.plan === 'yearly') totalRevenue += 15.83 // $190/12
  })
  
  // 30% goes to the prize pool
  const totalPool = totalRevenue * 0.30
  
  let poolTier5 = totalPool * 0.40
  const poolTier4 = totalPool * 0.35
  const poolTier3 = totalPool * 0.25

  // 2. Check for Rollover (Chain across months)
  // Fetch the most recent published draw
  const { data: lastDraw } = await supabase
    .from('draws')
    .select('id')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  let rolledInAmount = 0
  if (lastDraw) {
    const { data: lastTier5 } = await supabase
      .from('prize_pools')
      .select('rolled_out')
      .eq('draw_id', lastDraw.id)
      .eq('tier', 5)
      .single()
      
    if (lastTier5 && lastTier5.rolled_out > 0) {
      rolledInAmount = lastTier5.rolled_out
      poolTier5 += rolledInAmount // Add to this month's tier 5
    }
  }

  // 3. Determine winners
  const { data: entries } = await supabase
    .from('draw_entries')
    .select('user_id, match_count')
    .eq('draw_id', drawId)
    .gte('match_count', 3)

  const winners3 = entries?.filter(e => e.match_count === 3) || []
  const winners4 = entries?.filter(e => e.match_count === 4) || []
  const winners5 = entries?.filter(e => e.match_count === 5) || []

  // 4. Split and Insert Winnings & Prize Pools
  const prizePoolsToInsert = []
  const winningsToInsert: any[] = []

  // Tier 3
  if (winners3.length > 0) {
    const amountPerWinner = poolTier3 / winners3.length
    prizePoolsToInsert.push({ draw_id: drawId, tier: 3, amount: poolTier3, rolled_in: 0, rolled_out: 0 })
    winners3.forEach(w => {
      winningsToInsert.push({ draw_id: drawId, user_id: w.user_id, tier: 3, amount: amountPerWinner })
    })
  } else {
    // If no tier 3 winners, we assume it's lost or rolled out? The PRD only mentions tier 5 rolling over.
    // For now, we record it as rolled_out just in case, but usually only Jackpot (5) rolls over.
    // Assuming no rollover for tier 3/4 based on instructions, just keeping it in the house.
    prizePoolsToInsert.push({ draw_id: drawId, tier: 3, amount: poolTier3, rolled_in: 0, rolled_out: 0 })
  }

  // Tier 4
  if (winners4.length > 0) {
    const amountPerWinner = poolTier4 / winners4.length
    prizePoolsToInsert.push({ draw_id: drawId, tier: 4, amount: poolTier4, rolled_in: 0, rolled_out: 0 })
    winners4.forEach(w => {
      winningsToInsert.push({ draw_id: drawId, user_id: w.user_id, tier: 4, amount: amountPerWinner })
    })
  } else {
    prizePoolsToInsert.push({ draw_id: drawId, tier: 4, amount: poolTier4, rolled_in: 0, rolled_out: 0 })
  }

  // Tier 5 (Jackpot - Supports Rollover)
  if (winners5.length > 0) {
    const amountPerWinner = poolTier5 / winners5.length
    prizePoolsToInsert.push({ draw_id: drawId, tier: 5, amount: poolTier5, rolled_in: rolledInAmount, rolled_out: 0 })
    winners5.forEach(w => {
      winningsToInsert.push({ draw_id: drawId, user_id: w.user_id, tier: 5, amount: amountPerWinner })
    })
  } else {
    prizePoolsToInsert.push({ draw_id: drawId, tier: 5, amount: poolTier5, rolled_in: rolledInAmount, rolled_out: poolTier5 })
  }

  // Execute inserts
  if (prizePoolsToInsert.length > 0) {
    await supabase.from('prize_pools').insert(prizePoolsToInsert)
  }
  if (winningsToInsert.length > 0) {
    await supabase.from('winnings').insert(winningsToInsert)
  }

  // 5. Update draw status
  await supabase.from('draws').update({
    status: 'published',
    published_at: new Date().toISOString()
  }).eq('id', drawId)

  revalidatePath(`/admin/draws/${drawId}`)
  revalidatePath('/admin/draws')
  return { success: true }
}
