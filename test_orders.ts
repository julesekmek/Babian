import { createClient } from './src/infrastructure/supabase/client';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function check() {
  const client = createClient();
  const { data: sessions } = await client.from('market_sessions').select('*').eq('is_active', true);
  console.log('Active Sessions:', sessions);
  if (sessions && sessions.length > 0) {
    const sid = sessions[0].id;
    const cycle = sessions[0].current_cycle_number;
    const { data: orders } = await client.from('orders').select('*').eq('session_id', sid);
    console.log('Orders for session:', orders);
    const { data: currentOrders } = await client.from('orders').select('*').eq('session_id', sid).eq('cycle_number', cycle);
    console.log('Orders for current cycle:', currentOrders);
  }
}
check();
