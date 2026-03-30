import Papa from "papaparse";

export type NormalizedLog = {
  ts: string; // ISO string
  source: string;
  level: string;
  message: string;
  meta: Record<string, unknown>;
  raw?: string;
  ip?: string;
  user_agent?: string;
};

const isISODate = (v: unknown) => typeof v === "string" && /\d{4}-\d{2}-\d{2}T/.test(v);

export function parseJsonLine(line: string, defaults: Partial<NormalizedLog> = {}): NormalizedLog | null {
  try {
    const obj = JSON.parse(line);
    const ts = isISODate(obj.timestamp) ? obj.timestamp : isISODate(obj.ts) ? obj.ts : new Date().toISOString();
    const level = (obj.level || obj.severity || defaults.level || "info").toString().toLowerCase();
    const source = (obj.source || obj.app || obj.host || defaults.source || "unknown").toString();
    const message = (obj.message || obj.msg || "").toString();
    const meta: Record<string, unknown> = { ...obj };
    delete (meta as any).timestamp;
    delete (meta as any).ts;
    delete (meta as any).level;
    delete (meta as any).severity;
    delete (meta as any).source;
    delete (meta as any).app;
    delete (meta as any).host;
    delete (meta as any).message;
    delete (meta as any).msg;
    return { ts, level, source, message, meta, raw: line };
  } catch {
    return null;
  }
}

// Very small syslog parser (RFC3164-ish)
const SYSLOG_RE = /^(?:<(\d+)>\d?\s*)?(\w{3}\s+\d{1,2}\s+\d{2}:\d{2}:\d{2})\s+(\S+)\s+(\S+)(?:\[(\d+)\])?:\s*(.*)$/;
export function parseSyslog(line: string, defaults: Partial<NormalizedLog> = {}): NormalizedLog | null {
  const m = SYSLOG_RE.exec(line);
  if (!m) return null;
  const [, pri, date, host, tag, , msg] = m as unknown as [string, string, string, string, string, string, string];
  const nowYear = new Date().getFullYear();
  const ts = new Date(`${date} ${nowYear}`).toISOString();
  const levelMap: Record<string, string> = {
    "0": "emerg",
    "1": "alert",
    "2": "crit",
    "3": "error",
    "4": "warn",
    "5": "notice",
    "6": "info",
    "7": "debug",
  };
  const level = pri ? levelMap[String(Number(pri) % 8)] || "info" : "info";
  const source = defaults.source || host || tag || "syslog";
  return { ts, level, source, message: msg, meta: { host, tag }, raw: line };
}

// Common Log Format (web server)
const CLF_RE = /^(\S+) (\S+) (\S+) \[(.+?)\] "([A-Z]+) (.*?) (HTTP\/\d\.\d)" (\d{3}) (\d+|-)"?(.*?)"?"?(.*?)"?$/;
export function parseCommonLog(line: string, defaults: Partial<NormalizedLog> = {}): NormalizedLog | null {
  const m = CLF_RE.exec(line);
  if (!m) return null;
  const [_, ip, ident, user, datetime, method, path, http, status, size, ref, ua] = m;
  const ts = new Date(datetime.replace(/:\d{2} /, " ")).toISOString();
  const level = Number(status) >= 500 ? "error" : Number(status) >= 400 ? "warn" : "info";
  const source = defaults.source || "web";
  const message = `${method} ${path} ${status}`;
  return { ts, level, source, message, ip, user_agent: ua, meta: { ident, user, http, size, ref, method, path, status }, raw: line };
}

export function parseCsv(text: string, defaults: Partial<NormalizedLog> = {}): NormalizedLog[] {
  const res = Papa.parse<Record<string, string>>(text, { header: true, skipEmptyLines: true });
  const out: NormalizedLog[] = [];
  for (const row of res.data) {
    const ts = row.timestamp || row.ts || new Date().toISOString();
    const level = (row.level || row.severity || defaults.level || "info").toLowerCase();
    const source = (row.source || row.app || defaults.source || "unknown");
    const message = row.message || row.msg || "";
    const { ip, user_agent, ...rest } = row;
    out.push({ ts: new Date(ts).toISOString(), level, source, message, ip, user_agent, meta: rest });
  }
  return out;
}

export function parseAny(text: string, defaults: Partial<NormalizedLog> = {}): NormalizedLog[] {
  const lines = text.split(/\r?\n/).filter(Boolean);
  const out: NormalizedLog[] = [];
  // Try JSONL/syslog/CLF line by line
  for (const line of lines) {
    const asJson = parseJsonLine(line, defaults);
    if (asJson) { out.push(asJson); continue; }
    const asSys = parseSyslog(line, defaults);
    if (asSys) { out.push(asSys); continue; }
    const asClf = parseCommonLog(line, defaults);
    if (asClf) { out.push(asClf); continue; }
    // Fallback
    out.push({ ts: new Date().toISOString(), level: defaults.level || "info", source: defaults.source || "unknown", message: line, meta: {}, raw: line });
  }
  return out;
}



