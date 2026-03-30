import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

// Supabase client (API runs server-side)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/* -------------------------------------------------------
   🟢 GET — Fetch a single threat with joined log entry
-------------------------------------------------------- */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = Number(params.id);

    const { data: threat, error } = await supabase
      .from("threats")
      .select(
        `
        *,
        log_entries:log_entry_id (
          timestamp_entry,
          request_uri,
          user_agent,
          raw_log
        )
      `
      )
      .eq("id", id)
      .single();

    if (error) throw error;

    if (!threat) {
      return NextResponse.json(
        { success: false, error: "Threat not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, threat });
  } catch (error) {
    console.error("Get threat error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch threat" },
      { status: 500 }
    );
  }
}

/* -------------------------------------------------------
   🟡 PATCH — Update threat fields
-------------------------------------------------------- */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = Number(params.id);
    const body = await request.json();

    const allowedFields = [
      "status",
      "severity",
      "description",
      "mitigation_action",
    ] as const;

    const updates: Record<string, any> = {};

    // Accept only allowed fields
    for (const key of allowedFields) {
      if (body[key] !== undefined) {
        updates[key] = body[key];
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { success: false, error: "No valid fields to update" },
        { status: 400 }
      );
    }

    // Handle resolve/unresolve logic
    if (body.status === "resolved") {
      updates.resolved_at = new Date().toISOString();
    } else if (body.status) {
      updates.resolved_at = null;
    }

    updates.updated_at = new Date().toISOString();

    // Apply update
    const { data: updatedThreat, error } = await supabase
      .from("threats")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    if (!updatedThreat) {
      return NextResponse.json(
        { success: false, error: "Threat not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      threat: updatedThreat,
      message: "Threat updated successfully",
    });
  } catch (error) {
    console.error("Update threat error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update threat" },
      { status: 500 }
    );
  }
}

/* -------------------------------------------------------
   🔴 DELETE — Delete a threat
-------------------------------------------------------- */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = Number(params.id);

    const { data: deletedThreat, error } = await supabase
      .from("threats")
      .delete()
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    if (!deletedThreat) {
      return NextResponse.json(
        { success: false, error: "Threat not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Threat deleted successfully",
    });
  } catch (error) {
    console.error("Delete threat error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete threat" },
      { status: 500 }
    );
  }
}
