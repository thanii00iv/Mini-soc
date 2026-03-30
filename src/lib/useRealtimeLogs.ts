"use client";
import { useEffect, useRef, useState } from "react";
import { getSupabaseClient } from "@/lib/supabaseClient";

export type LogRow = {
  id: string;
  ts: string;
  source: string;
  level: string;
  message: string;
  meta: Record<string, unknown>;
  ip?: string | null;
  user_agent?: string | null;
};

export function useRealtimeLogs(limit = 500, filters?: { level?: string }) {
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const newest = useRef<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadInitial() {
      setLoading(true);
      const supabase = getSupabaseClient();
      const { data, error } = (await supabase
        .from("logs")
        .select("*")
        .order("id", { ascending: false })
        .limit(limit)) as unknown as {
          data: Array<
            LogRow & {
              created_at?: string;
              inserted_at?: string;
              timestamp?: string;
            }
          > | null;
          error: any;
        };
      if (!mounted) return;
      if (error) {
        setLoading(false);
        return;
      }
      const normalized = (data ?? []).map((row) => ({
        ...row,
        ts:
          row.ts ??
          (row as any).created_at ??
          (row as any).inserted_at ??
          (row as any).timestamp ??
          new Date().toISOString(),
      }));
      setLogs(normalized);
      newest.current = normalized && normalized[0] ? normalized[0].id : null;
      setLoading(false);
    }

    loadInitial();

    const supabase = getSupabaseClient();
    const channel = supabase
      .channel("logs-changes")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "logs" }, (payload) => {
        const rowAny = payload.new as any;
        const row: LogRow = {
          id: rowAny.id,
          ts: rowAny.ts ?? rowAny.created_at ?? new Date().toISOString(),
          source: rowAny.source,
          level: rowAny.level,
          message: rowAny.message,
          meta: rowAny.meta ?? {},
          ip: rowAny.ip ?? null,
          user_agent: rowAny.user_agent ?? null,
        };
        if (filters?.level && row.level !== filters.level) return;
        setLogs((prev) => [row, ...prev].slice(0, limit));
      })
      .subscribe();

    return () => {
      mounted = false;
      getSupabaseClient().removeChannel(channel);
    };
  }, [limit, filters?.level]);

  return { logs, loading };
}


