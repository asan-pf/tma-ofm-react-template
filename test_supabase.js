const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read .env from backend to get the key
const envPath = path.join(__dirname, 'backend', '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const keyMatch = envContent.match(/LOCAL_SUPABASE_ANON_KEY=(.+)/);
const key = keyMatch ? keyMatch[1].trim() : null;

if (!key) {
  console.error('Key not found in .env');
  process.exit(1);
}

const supabase = createClient('http://localhost:8000', key, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false
  }
});

async function test() {
  console.log('Testing connection to http://localhost:8000 with key:', key.substring(0, 10) + '...');
  const { data, error } = await supabase.from('locations').select('*');
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Success:', data);
  }
}

test();
