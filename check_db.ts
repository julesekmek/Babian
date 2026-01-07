import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function check() {
  const supabase = createClient(supabaseUrl, supabaseKey);
  const sid = '17c2caaf-0231-4cea-8ec3-ec8800db1db2';
  
  const { data: orders } = await supabase.from('orders').select('*');
  console.log('Total orders in table:', orders?.length);
  
  const { data: sessionOrders } = await supabase.from('orders').select('*').eq('session_id', sid);
  console.log('Orders for session 17c2caaf:', sessionOrders);
}
check();
