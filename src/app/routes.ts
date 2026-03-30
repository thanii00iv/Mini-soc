import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { NormalizedLog, parseAny, parseCsv, parseJsonLine } from "@/lib/logParsers";

const IngestQuery = z.object({
  source: z.string().optional(),
  level: z.string().optional(),
});

async function insertLogs(rows: NormalizedLog[]) {
  if (!rows.length) return { count: 0 };
  const supabase = getSupabaseClient();
  const { error, count } = await supabase.from("logs").insert(rows, { count: "exact" });
  if (error) throw error;
  return { count: count ?? rows.length };
}

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";
    const query = IngestQuery.parse({
      source: req.nextUrl.searchParams.get("source") || undefined,
      level: req.nextUrl.searchParams.get("level") || undefined,
    });

    // Capture context
    const ip = req.headers.get("x-forwarded-for") || undefined;
    const user_agent = req.headers.get("user-agent") || undefined;

    let logs: NormalizedLog[] = [];
    const text = await req.text();

    if (contentType.includes("application/json")) {
      // Could be a single object, array, or JSONL
      try {
        const obj = JSON.parse(text);
        if (Array.isArray(obj)) {
          logs = obj.map((o) => parseJsonLine(JSON.stringify(o), query)).filter(Boolean) as NormalizedLog[];
        } else if (typeof obj === "object") {
          const one = parseJsonLine(JSON.stringify(obj), query);
          logs = one ? [one] : [];
        }
      } catch {
        // Fallback to JSONL per line
        logs = text.split(/\r?\n/).map((l) => parseJsonLine(l, query)).filter(Boolean) as NormalizedLog[];
      }
    } else if (contentType.includes("text/csv")) {
      logs = parseCsv(text, query);
    } else if (contentType.includes("text/plain") || contentType.includes("application/log")) {
      logs = parseAny(text, query);
    } else {
      // Unknown -> try best effort
      logs = parseAny(text, query);
    }

    logs = logs.map((l) => ({ ...l, ip, user_agent }));

    const { count } = await insertLogs(logs);
    return NextResponse.json({ ok: true, ingested: count });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message ?? "ingest_failed" }, { status: 400 });
  }
}



