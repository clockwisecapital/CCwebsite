/**
 * Cache Status API
 * 
 * GET /api/cache/status - Get cache stats
 * POST /api/cache/status - Trigger manual cache refresh via Inngest
 */

import { NextResponse } from "next/server";
import { inngest } from "@/inngest/client";
import { getAllCacheStats } from "@/lib/services/time-portfolio-cache";

export const dynamic = "force-dynamic";

// GET - Return cache stats
export async function GET() {
  try {
    const stats = await getAllCacheStats();
    
    return NextResponse.json({
      success: true,
      stats,
      message: stats.timePortfolio.isCached 
        ? `TIME portfolio cached (${stats.timePortfolio.ageMinutes} min ago)`
        : "TIME portfolio not cached",
    });
  } catch (error) {
    console.error("Cache stats error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to get cache stats" },
      { status: 500 }
    );
  }
}

// POST - Trigger cache refresh via Inngest
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type } = body;

    if (type === "time-portfolio" || type === "all") {
      await inngest.send({
        name: "inngest/function.invoked",
        data: {
          function_id: "refresh-time-portfolio-cache",
        },
      });
    }

    if (type === "volatility" || type === "all") {
      await inngest.send({
        name: "inngest/function.invoked",
        data: {
          function_id: "refresh-volatility-cache",
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: `Cache refresh triggered for: ${type}`,
    });
  } catch (error) {
    console.error("Cache refresh error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to trigger cache refresh" },
      { status: 500 }
    );
  }
}

