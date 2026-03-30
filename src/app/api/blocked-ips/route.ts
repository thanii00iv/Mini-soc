import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Create a Supabase client (server-side)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface BlockedIP {
  id?: number;
  ip_address: string;
  reason: string;
  blocked_until?: string | null;
  auto_blocked?: boolean;
  created_by?: string;
  blocked_at?: string;
  blocked_seconds_ago?: number;
  block_status?: "permanent" | "active" | "expired";
}

/* -------------------------------------------------------
   🟢 GET — Fetch blocked IPs (with pagination & filtering)
-------------------------------------------------------- */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);
    const includeExpired = searchParams.get("includeExpired") === "true";

    // Fetch blocked IPs
    let query = supabase
      .from("blocked_ips")
      .select("*")
      .order("blocked_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (!includeExpired) {
      query = query.or("blocked_until.is.null,blocked_until.gt." + new Date().toISOString());
    }

    const { data: blockedIPs, error } = await query;

    if (error) {
      if ((error as any).code === "PGRST205") {
        console.warn("blocked_ips table not found; returning empty result set.");
        return NextResponse.json({
          success: true,
          blockedIPs: [],
          pagination: { total: 0, limit, offset, hasMore: false },
          warning: "blocked_ips table is not configured in this environment.",
        });
      }
      throw error;
    }

    // Fetch total count
    const { count, error: countError } = await supabase
      .from("blocked_ips")
      .select("*", { count: "exact", head: true });

    if (countError && (countError as any).code !== "PGRST205") {
      throw countError;
    }

    // Add computed fields
    const withStatus = (blockedIPs || []).map((ip) => {
      const blockedSecondsAgo = ip.blocked_at
        ? Math.floor((Date.now() - new Date(ip.blocked_at).getTime()) / 1000)
        : 0;

      let block_status: BlockedIP["block_status"] = "permanent";
      if (ip.blocked_until) {
        block_status =
          new Date(ip.blocked_until) > new Date() ? "active" : "expired";
      }

      return { ...ip, blocked_seconds_ago: blockedSecondsAgo, block_status };
    });

    return NextResponse.json({
      success: true,
      blockedIPs: withStatus,
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: offset + limit < (count || 0),
      },
    });
  } catch (error) {
    if ((error as any)?.code === "PGRST205") {
      console.warn("blocked_ips table not found (catch); returning empty dataset.");
      return NextResponse.json({
        success: true,
        blockedIPs: [],
        pagination: { total: 0, limit: 0, offset: 0, hasMore: false },
        warning: "blocked_ips table is not configured in this environment.",
      });
    }
    console.error("Blocked IPs API error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch blocked IPs" },
      { status: 500 }
    );
  }
}

/* -------------------------------------------------------
   🟡 POST — Block a new IP
-------------------------------------------------------- */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as BlockedIP;
    const {
      ip_address,
      reason,
      blocked_until,
      auto_blocked = false,
      created_by = "system",
    } = body;

    if (!ip_address || !reason) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: ip_address, reason" },
        { status: 400 }
      );
    }

    // Check if already blocked
    const { data: existing, error: existingError } = await supabase
      .from("blocked_ips")
      .select("*")
      .eq("ip_address", ip_address)
      .or("blocked_until.is.null,blocked_until.gt." + new Date().toISOString());

    if (existingError) {
      if ((existingError as any).code === "PGRST205") {
        return NextResponse.json(
          { success: false, error: "blocked_ips table is not configured in this environment." },
          { status: 503 }
        );
      }
      throw existingError;
    }

    if (existing && existing.length > 0) {
      return NextResponse.json(
        { success: false, error: "IP address is already blocked" },
        { status: 409 }
      );
    }

    // Insert new block
    const { data: newBlock, error: insertError } = await supabase
      .from("blocked_ips")
      .insert([
        {
          ip_address,
          reason,
          blocked_until: blocked_until || null,
          auto_blocked,
          created_by,
          blocked_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (insertError) {
      if ((insertError as any).code === "PGRST205") {
        return NextResponse.json(
          { success: false, error: "blocked_ips table is not configured in this environment." },
          { status: 503 }
        );
      }
      throw insertError;
    }

    // Update related threats
    const { error: threatError } = await supabase
      .from("threats")
      .update({
        status: "blocked",
        mitigation_action: "IP blocked automatically",
      })
      .eq("source_ip", ip_address)
      .neq("status", "resolved");

    if (threatError) throw threatError;

    return NextResponse.json({
      success: true,
      blockedIP: newBlock,
      message: "IP address blocked successfully",
    });
  } catch (error) {
    if ((error as any)?.code === "PGRST205") {
      console.warn("blocked_ips table not found (POST); returning service unavailable.");
      return NextResponse.json(
        { success: false, error: "blocked_ips table is not configured in this environment." },
        { status: 503 }
      );
    }
    console.error("Block IP error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to block IP address" },
      { status: 500 }
    );
  }
}

/* -------------------------------------------------------
   🔴 DELETE — Unblock IP
-------------------------------------------------------- */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ip_address = searchParams.get("ip");

    if (!ip_address) {
      return NextResponse.json(
        { success: false, error: "Missing IP address parameter" },
        { status: 400 }
      );
    }

    // Delete from blocked_ips
    const { data: removed, error: deleteError } = await supabase
      .from("blocked_ips")
      .delete()
      .eq("ip_address", ip_address)
      .select()
      .single();

    if (deleteError) {
      if ((deleteError as any).code === "PGRST205") {
        return NextResponse.json(
          { success: false, error: "blocked_ips table is not configured in this environment." },
          { status: 503 }
        );
      }
      throw deleteError;
    }

    if (!removed) {
      return NextResponse.json(
        { success: false, error: "IP address not found in blocked list" },
        { status: 404 }
      );
    }

    // Update related threats
    const { error: updateError } = await supabase
      .from("threats")
      .update({
        status: "active",
        mitigation_action: "IP unblocked",
      })
      .eq("source_ip", ip_address)
      .eq("status", "blocked")
      .is("resolved_at", null);

    if (updateError) throw updateError;

    return NextResponse.json({
      success: true,
      message: "IP address unblocked successfully",
    });
  } catch (error) {
    if ((error as any)?.code === "PGRST205") {
      console.warn("blocked_ips table not found (DELETE); returning service unavailable.");
      return NextResponse.json(
        { success: false, error: "blocked_ips table is not configured in this environment." },
        { status: 503 }
      );
    }
    console.error("Unblock IP error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to unblock IP address" },
      { status: 500 }
    );
  }
}
