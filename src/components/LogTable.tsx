"use client";
import { LogRow } from "@/lib/useRealtimeLogs";
import { cn } from "@/lib/utils";

export function LogTable({ logs }: { logs: LogRow[] }) {
  return (
    <div className="overflow-auto">
      <table className="min-w-full text-sm">
        <thead className="sticky top-0 z-10 bg-white/90 text-left text-xs uppercase tracking-wide text-zinc-500 backdrop-blur dark:bg-black/60">
          <tr>
            <th className="px-3 py-2 font-medium">Time</th>
            <th className="px-3 py-2 font-medium">Level</th>
            <th className="px-3 py-2 font-medium">Source</th>
            <th className="px-3 py-2 font-medium">Message</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-black/5 dark:divide-white/10">
          {logs.map((l) => (
            <tr key={l.id} className="hover:bg-zinc-50/80 dark:hover:bg-white/5">
              <td className="whitespace-nowrap px-3 py-2 text-zinc-600 dark:text-zinc-400">{new Date(l.ts).toLocaleTimeString()}</td>
              <td className="px-3 py-2"><span className={cn("rounded px-1.5 py-0.5 text-xs", levelClass(l.level))}>{l.level}</span></td>
              <td className="px-3 py-2 text-zinc-700 dark:text-zinc-300">{l.source}</td>
              <td className="px-3 py-2 text-zinc-900 dark:text-zinc-100">
                <div className="line-clamp-2">
                  {l.message}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function levelClass(level: string) {
  switch (level) {
    case "error":
      return "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300";
    case "warn":
    case "warning":
      return "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300";
    case "debug":
      return "bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-300";
    default:
      return "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300";
  }
}


