export interface DrinkRow {
  id: string;
  name: string;
  base_price: string | number;
  current_price: string | number;
  min_price: string | number;
  max_price: string | number;
  image_url?: string;
  owner_id: string;
  is_active: boolean;
  market_price: string | number;
  created_at: string;
}

export interface MarketSessionRow {
  id: string;
  barman_id: string;
  is_active: boolean;
  current_cycle_number: number;
  started_at?: string;
  last_price_update_at: string;
  created_at: string;
}

export interface MarketConfigRow {
  id: string;
  barman_id: string;
  increase_per_order: string | number;
  decrease_others: string | number;
  cycle_duration_seconds: number;
  created_at: string;
  updated_at: string;
}

export interface MarketEventRow {
  id: string;
  barman_id: string;
  name: string;
  type: string;
  value: string | number;
  start_at: string;
  end_at: string;
  created_at: string;
}
