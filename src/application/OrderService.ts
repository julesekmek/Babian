import { createClient } from '../infrastructure/supabase/client';
import { SupabaseClient } from '@supabase/supabase-js';

export class OrderService {
  private client: SupabaseClient;

  constructor(client?: SupabaseClient) {
    this.client = client || createClient();
  }

  async placeOrder(drinkId: string, sessionId: string, cycleNumber?: number): Promise<void> {
    const { error } = await this.client
      .from('orders')
      .insert({
        drink_id: drinkId,
        session_id: sessionId,
        cycle_number: cycleNumber || 1 // Always provide a fallback for now
      });

    if (error) throw error;
  }

  async getOrderCountsForCycle(sessionId: string, cycleNumber: number): Promise<Record<string, number>> {
    // Count orders per drink for the given cycle
    const { data, error } = await this.client
      .from('orders')
      .select('drink_id')
      .eq('session_id', sessionId)
      .eq('cycle_number', cycleNumber);

    if (error) throw error;

    const counts: Record<string, number> = {};
    data?.forEach((o: { drink_id: string }) => {
      counts[o.drink_id] = (counts[o.drink_id] || 0) + 1;
    });

    return counts;
  }

  async getOrderCountsSince(sessionId: string, since: Date): Promise<Record<string, number>> {
    // Count orders per drink created since the last price update
    const { data, error } = await this.client
      .from('orders')
      .select('drink_id')
      .eq('session_id', sessionId)
      .gt('created_at', since.toISOString());

    if (error) throw error;

    const counts: Record<string, number> = {};
    data?.forEach((o: { drink_id: string }) => {
      counts[o.drink_id] = (counts[o.drink_id] || 0) + 1;
    });

    return counts;
  }

  async getSessionOrderCounts(sessionId: string): Promise<Record<string, number>> {
    const { data, error } = await this.client
      .from('orders')
      .select('drink_id')
      .eq('session_id', sessionId);

    if (error) throw error;

    const counts: Record<string, number> = {};
    data?.forEach((o: { drink_id: string }) => {
      counts[o.drink_id] = (counts[o.drink_id] || 0) + 1;
    });

    return counts;
  }
}
