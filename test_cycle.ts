import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function trigger() {
  const res = await fetch('http://localhost:3000/api/market/cycle', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ barmanId: '63600e33-8e85-46bf-ac00-bee7f29bfc7c' })
  });
  console.log('API Response:', await res.json());
}
trigger();
