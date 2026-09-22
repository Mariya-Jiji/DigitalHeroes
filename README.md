# Digital Heroes Platform — Level 1 PRD Implementation

A subscription-driven web platform combining golf performance tracking, monthly
draw-based prize pools, and charitable giving. Built as a take-home assignment
against the Digital Heroes Level 1 PRD.

**Live URL:** https://digital-heroes-vert.vercel.app/

---

## Tech Stack

- **Frontend/Backend:** Next.js 15 (App Router), TypeScript, Tailwind CSS
- **Database & Auth:** Supabase (Postgres, Auth, Storage, Row-Level Security)
- **Payments:** Stripe (test mode) — Checkout Sessions + Webhooks
- **Deployment:** Vercel

---

## Test Credentials

| Role  | Email             | Password    |
|-------|-------------------|-------------|
| Admin | admin@test.com    | password123 |
| User  | sub1@test.com      | password123 |
| User  | sub2@test.com – sub6@test.com | password123 |

Seeded users have active subscriptions (mixed monthly/yearly) and 5 sample scores
each. Run `npx tsx scripts/seed.ts` against a fresh database to regenerate this data.

---

## Resolved Ambiguities & Design Decisions

The PRD intentionally leaves several mechanics unspecified. Rather than guess
silently, each of these was resolved explicitly and documented in code comments
at the point of implementation:

**1. What are a user's "lottery numbers"?**
The PRD ties score entry (1–45, Stableford format, 5 retained scores) directly to
a monthly draw that also produces 5 numbers in the same 1–45 range. We treat a
user's 5 currently-retained scores as their draw numbers for that period. This is
the only interpretation that gives the score-entry system a functional purpose
inside the draw mechanic as described.

**2. How does "weighted by score frequency" work?**
For weighted-mode draws, we tally how often each number (1–45) appears across all
eligible users' current scores, then run a weighted random draw without
replacement using those frequencies. Every number starts with a baseline weight
of 1 before frequencies are added, so a number nobody has played still has a
nonzero (if small) chance of being drawn — avoiding a permanently-dead number in
the pool.

**3. What portion of subscription revenue funds the prize pool?**
The PRD specifies "a fixed portion" without a number. We use **30%** of total
active-subscriber revenue for the period, calculated from plan price constants
($19.00/mo, $190/yr → $15.83/mo equivalent) rather than live Stripe invoice
queries, to keep the calculation deterministic and auditable.

**4. How does jackpot rollover behave across multiple unclaimed months?**
If the 5-match tier has zero winners, its full allocated amount (including any
amount already rolled in from a prior month) becomes `rolled_out` and is carried
forward into the next *published* draw's 5-match tier as `rolled_in`. This chains
indefinitely — an unclaimed jackpot keeps compounding until someone matches all 5.
Unclaimed amounts at 4- and 3-match tiers are not rolled over; only the 5-match
jackpot behaves this way, per the PRD's explicit mention of jackpot rollover.

**5. What counts as "active prize pool" for the admin dashboard metric?**
Defined as: sum of all `winnings` not yet marked `paid`, plus the rolled-over
jackpot amount from the most recently published draw. This reflects money either
owed to a confirmed winner or waiting in the pool for a future winner, rather than
a raw historical sum across all draws ever run.

**6. Draw simulation is idempotent.**
Re-running "Simulate" on the same draft draw wipes and regenerates that draw's
entries rather than appending duplicates, so an admin can freely re-simulate
(e.g., to compare random vs. weighted mode) before committing to Publish.

---

## Notable Implementation Choices

- **Payouts are manual/offline.** The admin verifies a winner's uploaded proof and
  marks payment as completed by hand. No automated payout gateway (Stripe
  Connect, PayPal Payouts) is integrated — out of scope for a 2-day MVP and not
  required by the PRD's evaluation checklist.
- **Winner proof uploads route through a server action using the Supabase
  service-role key**, rather than exposing client-side Storage RLS policies. This
  keeps the storage bucket fully locked down from direct client access.
- **Admin analytics are 4 real-time stat tiles**, not time-series charts — chosen
  to avoid pulling in an external charting library for a metric set this small.
- **Charity search is client-side filtering** on an already-small charity list,
  rather than server-side full-text search or pagination — prioritizes instant
  response time over scale that isn't needed at this size.
- **Stripe is live and fully wired** (Checkout Sessions + webhooks) in test mode.
  The Stripe account is registered under Australia rather than India, since
  Stripe onboarding for India-based accounts is currently invite-only; this has
  no effect on functionality since the entire integration runs in test mode with
  no real business verification or payouts involved.

---

## Database Schema

Core tables: `profiles`, `charities`, `subscriptions`, `scores`, `draws`,
`draw_entries`, `prize_pools`, `winnings`, `contributions`. Full schema, RLS
policies, and triggers (rolling-5-score enforcement, one-score-per-date
constraint, auto-provisioning a profile on signup) live in
`supabase/migrations/0001_init.sql`.

---

## Local Setup

```bash
npm install
cp .env.example .env.local   # fill in Supabase + Stripe keys
npx supabase db push          # or paste 0001_init.sql into the Supabase SQL Editor
npx tsx scripts/stripe-setup.ts   # creates Stripe prices, prints IDs for .env.local
npx tsx scripts/seed.ts       # seeds charities, admin, and test subscribers
npm run dev
```

For local Stripe webhook testing, run `stripe listen --forward-to
localhost:3000/api/webhooks/stripe` in a separate terminal and copy the printed
`whsec_...` value into `STRIPE_WEBHOOK_SECRET`.

---

## Known Limitations

- Payout execution is manual, not automated.
- No email notifications (subscription confirmation, draw results, winner
  approval) — out of scope for this version.
- Charity "events" are stored as a simple JSON array rather than a full CRUD
  module.
