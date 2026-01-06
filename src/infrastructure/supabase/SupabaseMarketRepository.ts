import { createClient } from './client';
import { MarketSession, MarketConfig, MarketEvent } from '../../domain/types';
import { IMarketSessionRepository } from '../../domain/repositories/IMarketSessionRepository';
import { MarketSessionRow, MarketConfigRow } from './types';

export class SupabaseMarketRepository implements IMarketSessionRepository {
  private client = createClient();

  async getActiveSession(barmanId: string): Promise<MarketSession | null> {
    const { data, error } = await this.client
      .from('market_sessions')
      .select('*')
      .eq('barman_id', barmanId)
      .eq('is_active', true)
      .maybeSingle();

    if (error) throw error;
    return data ? this.mapSession(data) : null;
  }

  async createSession(barmanId: string): Promise<MarketSession> {
    const { data, error } = await this.client
      .from('market_sessions')
      .insert({
        barman_id: barmanId,
        is_active: true,
        current_cycle_number: 1,
        last_price_update_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return this.mapSession(data);
  }

  async incrementCycle(sessionId: string): Promise<number> {
    const { data, error } = await this.client.rpc('increment_cycle', {
      session_id: sessionId
    });

    if (error) throw error;
    return data;
  }

  async getConfig(barmanId: string): Promise<MarketConfig | null> {
    const { data, error } = await this.client
      .from('market_configs')
      .select('*')
      .eq('barman_id', barmanId)
      .maybeSingle();

    if (error) throw error;
    return data ? this.mapConfig(data) : null;
  }

  async updateConfig(config: MarketConfig): Promise<void> {
    const { error } = await this.client
      .from('market_configs')
      .upsert({
        barman_id: config.barmanId,
        increase_per_order: config.increasePerOrder,
        decrease_others: config.decreaseOthers,
        cycle_duration_seconds: config.cycleDurationSeconds
      }, { onConflict: 'barman_id' });

    if (error) throw error;
  }

  async getEvents(barmanId: string): Promise<MarketEvent[]> {
    const { data, error } = await this.client
      .from('market_events')
      .select('*, event_drinks(drink_id)')
      .eq('barman_id', barmanId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data.map(this.mapEvent);
  }

  async getActiveEvents(barmanId: string): Promise<MarketEvent[]> {
    const now = new Date().toISOString();
    const { data, error } = await this.client
      .from('market_events')
      .select('*, event_drinks(drink_id)')
      .eq('barman_id', barmanId)
      .lte('start_at', now)
      .gte('end_at', now);

    if (error) throw error;
    return data.map(this.mapEvent);
  }

  async createEvent(event: Omit<MarketEvent, 'id'>): Promise<MarketEvent> {
    // 1. Insert event
    const { data: eventData, error: eventError } = await this.client
      .from('market_events')
      .insert({
        barman_id: event.barmanId,
        name: event.name,
        type: event.type,
        value: event.value,
        start_at: event.startAt.toISOString(),
        end_at: event.endAt.toISOString()
      })
      .select()
      .single();

    if (eventError) throw eventError;

    // 2. Insert associations if any
    if (event.drinkIds.length > 0) {
      const { error: joinError } = await this.client
        .from('event_drinks')
        .insert(event.drinkIds.map((drinkId: string) => ({
          event_id: eventData.id,
          drink_id: drinkId
        })));
      if (joinError) throw joinError;
    }

    return {
      ...event,
      id: eventData.id
    };
  }

  async deleteEvent(eventId: string): Promise<void> {
    const { error } = await this.client
      .from('market_events')
      .delete()
      .eq('id', eventId);

    if (error) throw error;
  }

  async closeSession(sessionId: string): Promise<void> {
    const { error } = await this.client
      .from('market_sessions')
      .update({ is_active: false })
      .eq('id', sessionId);

    if (error) throw error;
  }

  private mapSession(row: MarketSessionRow): MarketSession {
    return {
      id: row.id,
      barmanId: row.barman_id,
      isActive: row.is_active,
      currentCycleNumber: row.current_cycle_number,
      startedAt: row.started_at ? new Date(row.started_at) : undefined,
      lastPriceUpdateAt: new Date(row.last_price_update_at)
    };
  }

  private mapConfig(row: MarketConfigRow): MarketConfig {
    return {
      barmanId: row.barman_id,
      increasePerOrder: Number(row.increase_per_order),
      decreaseOthers: Number(row.decrease_others),
      cycleDurationSeconds: row.cycle_duration_seconds
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapEvent(row: any): MarketEvent {
    // Row includes event_drinks due to .select('*, event_drinks(drink_id)')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const drinkIds = row.event_drinks ? (row.event_drinks as any[]).map((ed: any) => ed.drink_id) : [];
    
    return {
      id: row.id,
      barmanId: row.barman_id,
      name: row.name,
      type: row.type as any,
      value: Number(row.value),
      startAt: new Date(row.start_at),
      endAt: new Date(row.end_at),
      drinkIds
    };
  }
}
