import { loadEnvConfig } from '@next/env';
import { createClient } from '@supabase/supabase-js';

// Load .env.local and .env
const projectDir = process.cwd();
loadEnvConfig(projectDir);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  }
});

async function seed() {
  console.log('Starting seed process...');

  // 1. Cleanup existing test data
  console.log('Cleaning up existing test users and charities...');
  const { data: usersData } = await supabase.auth.admin.listUsers();
  if (usersData?.users) {
    for (const u of usersData.users) {
      if (u.email === 'admin@test.com' || (u.email?.startsWith('sub') && u.email?.endsWith('@test.com'))) {
        await supabase.auth.admin.deleteUser(u.id);
      }
    }
  }
  await supabase.from('charities').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  // 2. Create 8 Charities
  console.log('Creating 8 charities...');
  const charitiesToInsert = Array.from({ length: 8 }).map((_, i) => ({
    name: `Charity Organization ${i + 1}`,
    slug: `charity-org-${i + 1}-${Date.now()}`, // append timestamp to avoid unique constraint issues if cleanup fails
    description: `This is a wonderful charity organization number ${i + 1} that helps make the world a better place.`,
    image_url: `https://picsum.photos/seed/charity${i}/400/300`,
    is_featured: i < 2 // mark the first 2 as featured
  }));

  const { data: charities, error: charitiesErr } = await supabase
    .from('charities')
    .insert(charitiesToInsert)
    .select();

  if (charitiesErr || !charities) {
    console.error('Failed to create charities', charitiesErr);
    return;
  }

  const credentials: any[] = [];

  // 3. Create Admin User
  console.log('Creating admin user...');
  const { data: adminAuth, error: adminErr } = await supabase.auth.admin.createUser({
    email: 'admin@test.com',
    password: 'password123',
    email_confirm: true,
    user_metadata: { full_name: 'System Admin' }
  });

  if (adminErr) {
    console.error('Failed to create admin:', adminErr);
  } else if (adminAuth.user) {
    // Update role to admin
    await supabase.from('profiles').update({ role: 'admin' }).eq('id', adminAuth.user.id);
    credentials.push({ email: 'admin@test.com', password: 'password123', role: 'admin' });
  }

  // 4. Create 6 Subscriber Users
  console.log('Creating 6 test subscribers...');
  for (let i = 1; i <= 6; i++) {
    const email = `sub${i}@test.com`;
    const password = 'password123';
    const charity = charities[i % charities.length]; // cycle through charities

    const { data: subAuth, error: subErr } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { 
        full_name: `Test Subscriber ${i}`,
        charity_id: charity.id,
        charity_pct: 15
      }
    });

    if (subErr || !subAuth.user) {
      console.error(`Failed to create subscriber ${email}:`, subErr);
      continue;
    }

    const userId = subAuth.user.id;

    // Wait a brief moment to ensure trigger created the profile
    await new Promise(r => setTimeout(r, 200));

    // Insert Subscription
    await supabase.from('subscriptions').insert({
      user_id: userId,
      plan: i % 2 === 0 ? 'yearly' : 'monthly',
      status: 'active',
      current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    });

    // Insert exactly 5 scores with distinct played_on dates in the last 30 days
    const scores = Array.from({ length: 5 }).map((_, j) => {
      const date = new Date();
      date.setDate(date.getDate() - (j * 2 + 1)); // 1, 3, 5, 7, 9 days ago
      
      return {
        user_id: userId,
        value: Math.floor(Math.random() * 45) + 1, // 1 to 45
        played_on: date.toISOString().split('T')[0],
      };
    });

    await supabase.from('scores').insert(scores);

    credentials.push({ email, password, role: 'user', plan: i % 2 === 0 ? 'yearly' : 'monthly' });
  }

  // 5. Print Credentials
  console.log('\n=============================================');
  console.log('✅ Seed completed successfully!');
  console.log('=============================================');
  console.log('Generated Accounts:\n');
  console.table(credentials);
}

seed().catch(console.error);
