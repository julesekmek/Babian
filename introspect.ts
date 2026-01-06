import { createClient } from './src/infrastructure/supabase/client';

async function introspect() {
  const supabase = createClient();
  const { data, error } = await supabase.rpc('get_table_columns', { table_name: 'market_configs' });
  
  if (error) {
     // If RPC doesn't exist, try a direct query via maybe another way or just assume a standard query
     console.log("RPC failed, trying raw query...");
     const { data: rawData, error: rawError } = await supabase
       .from('market_configs')
       .select('*')
       .limit(1);
    
     if (rawError) {
       console.error("Failed to query market_configs:", rawError);
       return;
     }
     console.log("Current columns in market_configs:", Object.keys(rawData[0] || {}));
  } else {
    console.log("Columns:", data);
  }
}

introspect();
