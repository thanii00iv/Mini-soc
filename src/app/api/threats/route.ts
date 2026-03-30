import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

// Supabase client with anon key (RLS must allow API operations)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/* -------------------------------------------------------
   🟢 GET /api/threats — Filtering • Search • Pagination
-------------------------------------------------------- */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const timeframe = searchParams.get("timeframe") || "24h";
    const severity = searchParams.get("severity");
    const status = searchParams.get("status");
    const source_ip = searchParams.get("source_ip");
    const keyword = searchParams.get("q");
    const limit = parseInt(searchParams.get("limit") || "100", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    // Time window presets
    const timeRanges: Record<string, number> = {
      "1h": 1,
      "24h": 24,
      "7d": 24 * 7,
      "30d": 24 * 30,
    };

    const hours = timeRanges[timeframe] ?? 24;
    const fromTime = new Date(Date.now() - hours * 3600 * 1000).toISOString();

    // Base query
    let query = supabase
      .from("threats")
      .select("*", { count: "exact" })
      .gte("detected_at", fromTime)
      .order("detected_at", { ascending: false })
      .range(offset, offset + limit - 1);

    // Optional filters
    if (severity) query = query.eq("severity", severity);
    if (status) query = query.eq("status", status);
    if (source_ip) query = query.eq("source_ip", source_ip);

    // Global search (keyword)
    if (keyword) {
      query = query.or(
        `threat_type.ilike.%${keyword}%,description.ilike.%${keyword}%,target_info.ilike.%${keyword}%`
      );
    }

    const { data: threats, error, count } = await query;

    if (error) throw error;

    const now = Date.now();

    const enrichedThreats =
      threats?.map((t: any) => ({
        ...t,
        seconds_ago: Math.floor((now - new Date(t.detected_at).getTime()) / 1000),
      })) ?? [];

    return NextResponse.json({
      success: true,
      threats: enrichedThreats,
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: offset + limit < (count || 0),
      },
    });
  } catch (error) {
    console.error("Threats API error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch threats" },
      { status: 500 }
    );
  }
}

/* -------------------------------------------------------
   🟡 POST /api/threats — Create New Threat
-------------------------------------------------------- */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      threat_type,
      severity,
      confidence_score,
      source_ip,
      target_info,
      description,
      status = "active",
    } = body;

    // Validate required fields
    if (!threat_type || !severity || !source_ip) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: threat_type, severity, source_ip",
        },
        { status: 400 }
      );
    }

    const validSeverities = ["low", "medium", "high", "critical"];
    if (!validSeverities.includes(severity)) {
      return NextResponse.json(
        { success: false, error: "Invalid severity level" },
        { status: 400 }
      );
    }

    const validStatuses = ["active", "blocked", "monitored", "resolved"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: "Invalid status" },
        { status: 400 }
      );
    }

    const { data: newThreat, error } = await supabase
      .from("threats")
      .insert([
        {
          threat_type,
          severity,
          confidence_score: confidence_score ?? 0.0,
          source_ip,
          target_info: target_info || null,
          description: description || null,
          status,
          detected_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      threat: newThreat,
      message: "Threat created successfully",
    });
  } catch (error) {
    console.error("Create threat error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create threat" },
      { status: 500 }
    );
  }
}
