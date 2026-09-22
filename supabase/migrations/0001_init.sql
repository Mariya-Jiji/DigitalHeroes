-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Charities
create table if not exists public.charities (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text unique not null,
  description text,
  image_url text,
  is_featured boolean default false,
  events jsonb default '[]'::jsonb
);

-- Profiles
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  role text check (role in ('user','admin')) default 'user',
  full_name text,
  charity_id uuid references public.charities on delete set null,
  charity_pct numeric check (charity_pct >= 10) default 10,
  created_at timestamptz default now()
);

-- Subscriptions
create table if not exists public.subscriptions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles on delete cascade,
  plan text check (plan in ('monthly','yearly')),
  status text check (status in ('active','canceled','lapsed')),
  current_period_end timestamptz,
  stripe_customer_id text,
  stripe_subscription_id text
);

-- Scores
create table if not exists public.scores (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles on delete cascade,
  value int check (value between 1 and 45),
  played_on date not null,
  created_at timestamptz default now(),
  unique(user_id, played_on)
);

-- Draws
create table if not exists public.draws (
  id uuid primary key default uuid_generate_v4(),
  period text unique not null,
  mode text check (mode in ('random','weighted')),
  drawn_numbers int[],
  status text check (status in ('draft','simulated','published')) default 'draft',
  published_at timestamptz
);

-- Draw Entries
create table if not exists public.draw_entries (
  id uuid primary key default uuid_generate_v4(),
  draw_id uuid not null references public.draws on delete cascade,
  user_id uuid not null references public.profiles on delete cascade,
  numbers int[],
  match_count int,
  created_at timestamptz default now()
);

-- Prize Pools
create table if not exists public.prize_pools (
  id uuid primary key default uuid_generate_v4(),
  draw_id uuid not null references public.draws on delete cascade,
  tier int check (tier in (3,4,5)),
  amount numeric,
  rolled_in numeric default 0,
  rolled_out numeric default 0
);

-- Winnings
create table if not exists public.winnings (
  id uuid primary key default uuid_generate_v4(),
  draw_id uuid not null references public.draws on delete cascade,
  user_id uuid not null references public.profiles on delete cascade,
  tier int,
  amount numeric,
  proof_url text,
  verification text check (verification in ('pending','approved','rejected')) default 'pending',
  payment text check (payment in ('pending','paid')) default 'pending'
);

-- Contributions
create table if not exists public.contributions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles on delete cascade,
  charity_id uuid not null references public.charities on delete cascade,
  amount numeric,
  source text check (source in ('subscription','donation')),
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.charities enable row level security;
alter table public.profiles enable row level security;
alter table public.subscriptions enable row level security;
alter table public.scores enable row level security;
alter table public.draws enable row level security;
alter table public.draw_entries enable row level security;
alter table public.prize_pools enable row level security;
alter table public.winnings enable row level security;
alter table public.contributions enable row level security;

-- Admin helper function
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- Trigger: 5 scores limit
create or replace function public.enforce_score_limit()
returns trigger as $$
begin
  if (select count(*) from public.scores where user_id = NEW.user_id) > 5 then
    delete from public.scores
    where id = (
      select id from public.scores
      where user_id = NEW.user_id
      order by played_on asc
      limit 1
    );
  end if;
  return NEW;
end;
$$ language plpgsql;

create trigger scores_limit_trigger
after insert on public.scores
for each row execute function public.enforce_score_limit();

-- Trigger: handle new user
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, charity_id, charity_pct)
  values (
    NEW.id, 
    NEW.raw_user_meta_data->>'full_name',
    nullif(NEW.raw_user_meta_data->>'charity_id', '')::uuid,
    coalesce((NEW.raw_user_meta_data->>'charity_pct')::numeric, 10)
  );
  return NEW;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Trigger to prevent non-admins from updating winnings.verification/payment
create or replace function public.check_winnings_update()
returns trigger as $$
begin
  if (NEW.verification is distinct from OLD.verification or NEW.payment is distinct from OLD.payment) then
    if not public.is_admin() then
      raise exception 'Only administrators can update verification and payment status';
    end if;
  end if;
  return NEW;
end;
$$ language plpgsql security definer;

create trigger winnings_update_trigger
before update on public.winnings
for each row execute function public.check_winnings_update();

-- RLS Policies

-- Charities
create policy "Charities are viewable by everyone" on public.charities for select using (true);
create policy "Charities are manageable by admins" on public.charities for all using (public.is_admin());

-- Profiles
create policy "Users can view their own profile" on public.profiles for select using (auth.uid() = id or public.is_admin());
create policy "Users can insert their own profile" on public.profiles for insert with check (auth.uid() = id or public.is_admin());
create policy "Users can update their own profile" on public.profiles for update using (auth.uid() = id or public.is_admin());
create policy "Profiles are deletable by admins" on public.profiles for delete using (public.is_admin());

-- Subscriptions
create policy "Users can view their own subscriptions" on public.subscriptions for select using (auth.uid() = user_id or public.is_admin());
create policy "Users can insert their own subscriptions" on public.subscriptions for insert with check (auth.uid() = user_id or public.is_admin());
create policy "Users can update their own subscriptions" on public.subscriptions for update using (auth.uid() = user_id or public.is_admin());
create policy "Subscriptions deletable by admins" on public.subscriptions for delete using (public.is_admin());

-- Scores
create policy "Users can view their own scores" on public.scores for select using (auth.uid() = user_id or public.is_admin());
create policy "Users can insert their own scores" on public.scores for insert with check (auth.uid() = user_id or public.is_admin());
create policy "Users can update their own scores" on public.scores for update using (auth.uid() = user_id or public.is_admin());
create policy "Scores deletable by admins or owner" on public.scores for delete using (auth.uid() = user_id or public.is_admin());

-- Draws
create policy "Published draws viewable by everyone" on public.draws for select using (status = 'published' or public.is_admin());
create policy "Draws are manageable by admins" on public.draws for all using (public.is_admin());

-- Draw Entries
create policy "Users can view their own entries" on public.draw_entries for select using (auth.uid() = user_id or public.is_admin());
create policy "Users can insert their own entries" on public.draw_entries for insert with check (auth.uid() = user_id or public.is_admin());
create policy "Users can update their own entries" on public.draw_entries for update using (auth.uid() = user_id or public.is_admin());
create policy "Entries deletable by admins" on public.draw_entries for delete using (public.is_admin());

-- Prize Pools
create policy "Prize pools viewable if draw published" on public.prize_pools for select using (
  (select status from public.draws where id = draw_id) = 'published'
  or public.is_admin()
);
create policy "Prize pools manageable by admins" on public.prize_pools for all using (public.is_admin());

-- Winnings
create policy "Users can view their own winnings" on public.winnings for select using (auth.uid() = user_id or public.is_admin());
create policy "Users can insert their own winnings" on public.winnings for insert with check (auth.uid() = user_id or public.is_admin());
create policy "Users can update their own winnings" on public.winnings for update using (auth.uid() = user_id or public.is_admin());
create policy "Winnings deletable by admins" on public.winnings for delete using (public.is_admin());

-- Contributions
create policy "Users can view their own contributions" on public.contributions for select using (auth.uid() = user_id or public.is_admin());
create policy "Users can insert their own contributions" on public.contributions for insert with check (auth.uid() = user_id or public.is_admin());
create policy "Users can update their own contributions" on public.contributions for update using (auth.uid() = user_id or public.is_admin());
create policy "Contributions deletable by admins" on public.contributions for delete using (public.is_admin());
