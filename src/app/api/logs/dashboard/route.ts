import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Helper function to create Supabase client safely
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }

  return createClient(supabaseUrl, serviceRoleKey);
}

export async function GET(_request: Request) {
  try {
    // Validate environment variables and create client
    const supabase = getSupabaseClient();

    // 1️⃣ Fetch metrics (be robust to schema variations)
    let metrics: any[] = [];
    const { data: metricsData, error: metricsError } = await supabase
      .from("system_metrics")
      .select("metric_name, metric_value, metric_unit")
      .limit(100);
    if (metricsError) {
      console.error("System metrics query error:", metricsError);
    } else {
      metrics = metricsData || [];
    }

    // 2️⃣ Fetch recent threats (last 24 hours)
    let recentThreats: any[] = [];
    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: threatsData, error: threatsError } = await supabase
      .from("threats")
      .select("*")
      .gte("detected_at", since24h)
      .order("detected_at", { ascending: false })
      .limit(10);

    if (threatsError) {
      if (threatsError.code === "42703") {
        console.warn("Threats query skipped: expected columns are missing in the current schema.");
      } else {
        console.error("Threats query error:", threatsError);
      }
    } else {
      recentThreats = threatsData || [];
    }

    // 3️⃣ Fetch log stats (last 7 days)
    let logStats: any[] = [];
    const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: logStatsData, error: logError } = await supabase
      .from("log_files")
      .select("log_format, record_count, threats_found")
      .gte("upload_date", since7d);

    if (logError) {
      if (logError.code === "PGRST205") {
        console.warn("Log stats query skipped: 'log_files' table is not present in this environment.");
      } else {
        console.error("Log stats query error:", logError);
      }
    } else {
      logStats = logStatsData || [];
    }

    // Aggregate log stats manually (Supabase lacks GROUP BY aggregation client-side)
    const logMap: Record<string, { file_count: number; total_records: number; total_threats: number }> = {};
    for (const log of logStats) {
      const { log_format, record_count, threats_found } = log;
      if (!logMap[log_format]) {
        logMap[log_format] = { file_count: 0, total_records: 0, total_threats: 0 };
      }
      logMap[log_format].file_count += 1;
      logMap[log_format].total_records += record_count || 0;
      logMap[log_format].total_threats += threats_found || 0;
    }

    const groupedLogStats = Object.entries(logMap).map(([format, stats]) => ({
      log_format: format,
      ...stats,
    }));

    // Format metrics into a usable structure
    const metricsMap: Record<string, { value: number; unit: string }> = {};
    for (const m of metrics) {
      if (m?.metric_name && m?.metric_value !== undefined) {
        const parsedValue = parseFloat(m.metric_value);
        if (!isNaN(parsedValue)) {
          metricsMap[m.metric_name] = {
            value: parsedValue,
            unit: m.metric_unit || "",
          };
        }
      }
    }

    // Format threats with human-readable time
    const formattedThreats = recentThreats.map((threat) => {
      const detectedAt =
        threat.detected_at ||
        threat.created_at ||
        threat.inserted_at ||
        threat.timestamp ||
        new Date().toISOString();
      const secondsAgo = Math.floor((Date.now() - new Date(detectedAt).getTime()) / 1000);
      let timeAgo: string;
      if (secondsAgo < 60) timeAgo = `${secondsAgo}s ago`;
      else if (secondsAgo < 3600) timeAgo = `${Math.floor(secondsAgo / 60)}m ago`;
      else if (secondsAgo < 86400) timeAgo = `${Math.floor(secondsAgo / 3600)}h ago`;
      else timeAgo = `${Math.floor(secondsAgo / 86400)}d ago`;

      return {
        id: threat.id,
        type: threat.threat_type || threat.type || threat.category || "unknown",
        severity: threat.severity || threat.level || "unknown",
        ip: threat.source_ip || threat.ip || threat.origin_ip || "unknown",
        time: timeAgo,
        status: threat.status || threat.state || "unknown",
        description: threat.description || threat.details || threat.message || "",
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        metrics: metricsMap,
        recentThreats: formattedThreats,
        logStats: groupedLogStats,
        dashboard: {
          totalLogs: metricsMap.logs_processed_today?.value || 0,
          threatsDetected: metricsMap.threats_detected_today?.value || 0,
          blockedIPs: metricsMap.blocked_ips_total?.value || 0,
          systemHealth: metricsMap.system_health?.value || 0,
        },
      },
    });
  } catch (error: any) {
    console.error("Dashboard API error:", error);
    
    // Provide more specific error messages
    let errorMessage = "Failed to fetch dashboard data";
    let statusCode = 500;

    if (error?.message?.includes("Missing Supabase environment variables")) {
      errorMessage = "Server configuration error: Missing Supabase credentials";
      statusCode = 500;
    } else if (error?.message?.includes("Invalid API key") || error?.code === "PGRST301") {
      errorMessage = "Authentication error: Invalid Supabase credentials";
      statusCode = 401;
    } else if (error?.code === "PGRST116" || error?.message?.includes("relation") || error?.message?.includes("does not exist")) {
      errorMessage = "Database schema error: Required tables may not exist";
      statusCode = 500;
    } else if (error?.message) {
      errorMessage = error.message;
    }

    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage,
        details: process.env.NODE_ENV === "development" ? error?.message : undefined
      },
      { status: statusCode }
    );
  }
}
