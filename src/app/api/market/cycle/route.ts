import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { SupabaseMarketRepository } from "@/infrastructure/supabase/SupabaseMarketRepository";
import { SupabaseDrinkRepository } from "@/infrastructure/supabase/SupabaseDrinkRepository";
import { OrderService } from "@/application/OrderService";
import { MarketService } from "@/application/MarketService";

export async function POST(req: NextRequest) {
  try {
    // 🛡️ Sentinel: Security Check
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret) {
      console.error("CRITICAL: Missing CRON_SECRET environment variable");
      return NextResponse.json(
        { error: "Server Configuration Error: Missing CRON_SECRET" },
        { status: 500 }
      );
    }

    const apiKey = req.headers.get("x-api-key");
    if (apiKey !== cronSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const apiUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

    if (!serviceRoleKey || !apiUrl) {
      console.error("CRITICAL: Missing Supabase Environment Variables");
      console.error("NEXT_PUBLIC_SUPABASE_URL:", !!apiUrl);
      console.error("SUPABASE_SERVICE_ROLE_KEY:", !!serviceRoleKey);
      return NextResponse.json(
        { error: "Server Configuration Error: Missing Service Role Key" },
        { status: 500 }
      );
    }

    // Service Role Client (Bypasses RLS)
    const serviceRoleClient = createClient(apiUrl, serviceRoleKey);

    const { barmanId } = await req.json();
    console.log("Processing cycle for barmanId:", barmanId);

    if (!barmanId) {
      return NextResponse.json({ error: "Missing barmanId" }, { status: 400 });
    }

    // Initialize services with Admin Client
    const marketRepo = new SupabaseMarketRepository(serviceRoleClient);
    const drinkRepo = new SupabaseDrinkRepository(serviceRoleClient);
    const orderService = new OrderService(serviceRoleClient); 

    const marketService = new MarketService(drinkRepo, marketRepo, orderService);

    // Run the cycle logic
    await marketService.processCycleEnd(barmanId);

    return NextResponse.json({ success: true, message: "Cycle processed" });
  } catch (error: any) {
    console.error("Cycle API Error:", error);
    return NextResponse.json(
      { 
        error: error.message || "Internal Server Error",
        details: error.toString()
      },
      { status: 500 }
    );
  }
}
