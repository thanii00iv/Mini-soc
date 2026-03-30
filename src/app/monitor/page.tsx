"use client";

import { useState, useEffect, useRef } from "react";
import { useRealtimeLogs, type LogRow } from "@/lib/useRealtimeLogs";
import { getSupabaseClient } from "@/lib/supabaseClient";
import Sidebar from "@/components/Sidebar";
import {
  Activity,
  AlertTriangle,
  Shield,
  Wifi,
  Server,
  Clock,
  Play,
  Pause,
  Filter,
  Download,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Eye,
  EyeOff,
} from "lucide-react";

type Threat = {
  id: number;
  threat_type: string;
  severity: "low" | "medium" | "high" | "critical";
  source_ip: string;
  detected_at: string;
  status: string;
  description: string;
  seconds_ago: number;
};

type Metric = {
  metric_name: string;
  metric_value: number;
  metric_unit: string;
  recorded_at: string;
};

export default function RealTimeMonitorPage() {
  const [isPaused, setIsPaused] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const [threats, setThreats] = useState<Threat[]>([]);
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());
  const threatsRef = useRef<HTMLDivElement>(null);
  const metricsIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Use real-time logs hook
  const { logs, loading: logsLoading } = useRealtimeLogs(500, selectedLevel ? { level: selectedLevel } : undefined);

  // Filter logs by source if selected
  const filteredLogs = selectedSource
    ? logs.filter((log) => log.source === selectedSource)
    : logs;

  // Fetch recent threats
  const fetchThreats = async () => {
    try {
      const response = await fetch("/api/threats?timeframe=1h&limit=50");
      const data = await response.json();
      if (data.success) {
        setThreats(data.threats || []);
      }
    } catch (error) {
      console.error("Failed to fetch threats:", error);
    }
  };

  // Fetch system metrics
  const fetchMetrics = async () => {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from("system_metrics")
        .select("*")
        .limit(50);

      if (!error && data) {
        setMetrics(data as any[]);
      }
    } catch (error) {
      console.error("Failed to fetch metrics:", error);
    }
  };

  // Subscribe to real-time threats
  useEffect(() => {
    fetchThreats();
    fetchMetrics();

    const supabase = getSupabaseClient();
    const threatsChannel = supabase
      .channel("threats-monitor")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "threats" },
        () => {
          if (!isPaused) {
            fetchThreats();
          }
        }
      )
      .subscribe();

    // Auto-refresh metrics
    if (autoRefresh) {
      metricsIntervalRef.current = setInterval(fetchMetrics, 5000);
    }

    return () => {
      supabase.removeChannel(threatsChannel);
      if (metricsIntervalRef.current) {
        clearInterval(metricsIntervalRef.current);
      }
    };
  }, [isPaused, autoRefresh]);

  // Auto-scroll to latest threat
  useEffect(() => {
    if (threatsRef.current && threats.length > 0 && !isPaused) {
      threatsRef.current.scrollTop = 0;
    }
  }, [threats.length, isPaused]);

  // Get unique sources and levels from logs
  const uniqueSources = Array.from(new Set(logs.map((log) => log.source))).sort();
  const uniqueLevels = Array.from(new Set(logs.map((log) => log.level))).sort();

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-500/20 text-red-400 border-red-500/50";
      case "high":
        return "bg-orange-500/20 text-orange-400 border-orange-500/50";
      case "medium":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/50";
      case "low":
        return "bg-blue-500/20 text-blue-400 border-blue-500/50";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/50";
    }
  };

  const getLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case "error":
      case "critical":
        return "text-red-400";
      case "warn":
      case "warning":
        return "text-yellow-400";
      case "info":
        return "text-blue-400";
      default:
        return "text-gray-400";
    }
  };

  const formatTimeAgo = (seconds: number) => {
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    return `${Math.floor(seconds / 3600)}h ago`;
  };

  const toggleLogExpand = (logId: string) => {
    setExpandedLogs((prev) => {
      const next = new Set(prev);
      if (next.has(logId)) {
        next.delete(logId);
      } else {
        next.add(logId);
      }
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 font-inter flex">
      {/* Collapsible Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 ml-20 p-6 transition-all duration-300">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Activity className="w-6 h-6 text-blue-500" />
              Real-Time Monitor
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Live monitoring of security logs, threats, and system metrics
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`px-4 py-2 rounded-md border text-sm transition ${
                autoRefresh
                  ? "bg-green-500/10 border-green-500/50 text-green-600 dark:text-green-400"
                  : "bg-gray-100 border-gray-300 dark:bg-gray-800 dark:border-gray-700 text-gray-600 dark:text-gray-400"
              }`}
            >
              <RefreshCw className={`w-4 h-4 inline mr-2 ${autoRefresh ? "animate-spin" : ""}`} />
              Auto-refresh
            </button>
            <button
              onClick={() => setIsPaused(!isPaused)}
              className={`px-4 py-2 rounded-md border text-sm transition ${
                isPaused
                  ? "bg-orange-500/10 border-orange-500/50 text-orange-600 dark:text-orange-400"
                  : "bg-blue-500/10 border-blue-500/50 text-blue-600 dark:text-blue-400"
              }`}
            >
              {isPaused ? (
                <>
                  <Play className="w-4 h-4 inline mr-2" />
                  Resume
                </>
              ) : (
                <>
                  <Pause className="w-4 h-4 inline mr-2" />
                  Pause
                </>
              )}
            </button>
            <button
              onClick={() => {
                fetchThreats();
                fetchMetrics();
              }}
              className="px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm hover:bg-gray-50 dark:hover:bg-gray-600 transition text-gray-900 dark:text-white"
            >
              <RefreshCw className="w-4 h-4 inline mr-2" />
              Refresh
            </button>
          </div>
          </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Active Threats</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {threats.filter((t) => t.status === "active").length}
                </p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Logs Processed</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {logs.length.toLocaleString()}
                </p>
              </div>
              <Server className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Sources</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {uniqueSources.length}
                </p>
              </div>
              <Wifi className="w-8 h-8 text-green-500" />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {isPaused ? "Paused" : "Live"}
                </p>
              </div>
              <Activity className={`w-8 h-8 ${isPaused ? "text-gray-500" : "text-green-500 animate-pulse"}`} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Live Logs */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Server className="w-5 h-5" />
                Live Logs ({filteredLogs.length})
              </h2>
              <div className="flex items-center gap-2">
                <select
                  value={selectedSource || ""}
                  onChange={(e) => setSelectedSource(e.target.value || null)}
                  className="px-3 py-1.5 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">All Sources</option>
                  {uniqueSources.map((source) => (
                    <option key={source} value={source}>
                      {source}
                    </option>
                  ))}
                </select>
                <select
                  value={selectedLevel || ""}
                  onChange={(e) => setSelectedLevel(e.target.value || null)}
                  className="px-3 py-1.5 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">All Levels</option>
                  {uniqueLevels.map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="p-4 max-h-[600px] overflow-y-auto">
              {logsLoading ? (
                <div className="text-center py-8 text-gray-600 dark:text-gray-400">Loading logs...</div>
              ) : filteredLogs.length === 0 ? (
                <div className="text-center py-8 text-gray-600 dark:text-gray-400">No logs available</div>
              ) : (
                <div className="space-y-2">
                  {filteredLogs.slice(0, 100).map((log) => (
                    <div
                      key={log.id}
                      className="border border-gray-200 dark:border-gray-700 rounded-md p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-xs font-semibold ${getLevelColor(log.level)}`}>
                              {log.level.toUpperCase()}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">{log.source}</span>
                            {log.ip && (
                              <span className="text-xs text-gray-500 dark:text-gray-400">IP: {log.ip}</span>
                            )}
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {new Date(log.ts).toLocaleTimeString()}
                            </span>
                          </div>
                          <p className="text-sm text-gray-900 dark:text-white break-words">{log.message}</p>
                          {expandedLogs.has(log.id) && (
                            <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                              <pre className="text-xs text-gray-600 dark:text-gray-400 overflow-x-auto">
                                {JSON.stringify(log.meta, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => toggleLogExpand(log.id)}
                          className="ml-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                        >
                          {expandedLogs.has(log.id) ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Live Threats */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Recent Threats ({threats.length})
              </h2>
            </div>
            <div ref={threatsRef} className="p-4 max-h-[600px] overflow-y-auto">
              {threats.length === 0 ? (
                <div className="text-center py-8 text-gray-600 dark:text-gray-400">No threats detected</div>
              ) : (
                <div className="space-y-3">
                  {threats.map((threat) => (
                    <div
                      key={threat.id}
                      className={`border rounded-lg p-4 ${getSeverityColor(threat.severity)}`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-sm">{threat.threat_type}</span>
                            <span className="text-xs px-2 py-0.5 rounded bg-white/20 dark:bg-black/20">
                              {threat.severity}
                            </span>
                          </div>
                          <p className="text-xs text-gray-300 dark:text-gray-400 mb-2">{threat.description}</p>
                          <div className="flex items-center gap-4 text-xs">
                            <span className="flex items-center gap-1">
                              <Wifi className="w-3 h-3" />
                              {threat.source_ip}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatTimeAgo(threat.seconds_ago)}
                            </span>
                            <span className="px-2 py-0.5 rounded bg-white/20 dark:bg-black/20">
                              {threat.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* System Metrics */}
        {metrics.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                System Metrics
              </h2>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {metrics.slice(0, 8).map((metric) => (
                  <div
                    key={metric.metric_name}
                    className="border border-gray-200 dark:border-gray-700 rounded-md p-3"
                  >
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">{metric.metric_name}</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      {metric.metric_value} {metric.metric_unit}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}

