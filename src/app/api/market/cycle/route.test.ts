import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { POST } from './route';
import { NextRequest } from 'next/server';

// Mock dependencies to avoid actual DB calls or side effects
vi.mock('@/infrastructure/supabase/client', () => ({
  createClient: vi.fn(() => ({
    // Mock Supabase client methods if needed
    from: vi.fn(() => ({
        select: vi.fn().mockResolvedValue({ data: [], error: null }),
        insert: vi.fn().mockResolvedValue({ data: [], error: null }),
        update: vi.fn().mockResolvedValue({ data: [], error: null }),
    })),
  })),
}));

vi.mock('@/infrastructure/supabase/SupabaseMarketRepository', () => ({
  SupabaseMarketRepository: class {
    getActiveSession = vi.fn();
    getConfig = vi.fn();
    acquireCycleLock = vi.fn();
    getActiveEvents = vi.fn();
    savePriceHistory = vi.fn();
    incrementCycle = vi.fn();
  }
}));

vi.mock('@/infrastructure/supabase/SupabaseDrinkRepository', () => ({
  SupabaseDrinkRepository: class {
    getDrinksByOwner = vi.fn();
    updatePrices = vi.fn();
  }
}));

vi.mock('@/application/OrderService', () => ({
  OrderService: class {
    getOrderCountsSince = vi.fn();
  }
}));

vi.mock('@/application/MarketService', () => ({
  MarketService: class {
    processCycleEnd = vi.fn().mockResolvedValue(undefined);
  }
}));

describe('Market Cycle API Endpoint', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
    // Set necessary env vars for Supabase client creation
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-key';
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should return 500 if CRON_SECRET is not configured', async () => {
    delete process.env.CRON_SECRET;

    const req = new NextRequest('http://localhost/api/market/cycle', {
      method: 'POST',
      body: JSON.stringify({ barmanId: 'test-barman' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).toBe('Server Configuration Error: Missing CRON_SECRET');
  });

  it('should return 401 if x-api-key header is missing', async () => {
    process.env.CRON_SECRET = 'super-secret-key';

    const req = new NextRequest('http://localhost/api/market/cycle', {
      method: 'POST',
      body: JSON.stringify({ barmanId: 'test-barman' }),
      // No x-api-key header
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toBe('Unauthorized');
  });

  it('should return 401 if x-api-key header is invalid', async () => {
    process.env.CRON_SECRET = 'super-secret-key';

    const req = new NextRequest('http://localhost/api/market/cycle', {
      method: 'POST',
      body: JSON.stringify({ barmanId: 'test-barman' }),
      headers: {
        'x-api-key': 'wrong-key',
      },
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toBe('Unauthorized');
  });

  it('should proceed if x-api-key matches CRON_SECRET', async () => {
    process.env.CRON_SECRET = 'super-secret-key';

    const req = new NextRequest('http://localhost/api/market/cycle', {
      method: 'POST',
      body: JSON.stringify({ barmanId: 'test-barman' }),
      headers: {
        'x-api-key': 'super-secret-key',
      },
    });

    const res = await POST(req);
    // Expect 200 or whatever success response is returned
    // Since we mocked dependencies, it should work fine.
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
  });
});
