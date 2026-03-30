"use client";

import { useState, useEffect } from "react";
import {
  FileText,
  Download,
  Calendar,
  Filter,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Shield,
  Server,
  BarChart3,
  PieChart,
  Activity,
  Clock,
} from "lucide-react";
import Sidebar from "@/components/Sidebar";

type ReportData = {
  timeframe: string;
  totalLogs: number;
  totalThreats: number;
  threatsBySeverity: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  threatsByType: Record<string, number>;
  logsBySource: Record<string, number>;
  logsByLevel: Record<string, number>;
  topThreats: Array<{
    id: number;
    threat_type: string;
    severity: string;
    source_ip: string;
    detected_at: string;
    count: number;
  }>;
  topBlockedIPs: Array<{
    ip_address: string;
    count: number;
    reason: string;
  }>;
  timeline: Array<{
    date: string;
    logs: number;
    threats: number;
  }>;
};

export default function ReportsPage() {
  const [selectedTimeframe, setSelectedTimeframe] = useState("7d");
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const timeframes = [
    { value: "1h", label: "Last Hour" },
    { value: "24h", label: "Last 24 Hours" },
    { value: "7d", label: "Last 7 Days" },
    { value: "30d", label: "Last 30 Days" },
    { value: "90d", label: "Last 90 Days" },
  ];

  const fetchReportData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch threats
      const threatsResponse = await fetch(`/api/threats?timeframe=${selectedTimeframe}&limit=1000`);
      const threatsData = await threatsResponse.json();

      // Fetch dashboard data for metrics
      const dashboardResponse = await fetch("/api/logs/dashboard");
      const dashboardData = await dashboardResponse.json();

      // Fetch blocked IPs
      const blockedIPsResponse = await fetch("/api/blocked-ips?limit=100");
      const blockedIPsData = await blockedIPsResponse.json();

      if (threatsData.success && dashboardData.success) {
        const threats = threatsData.threats || [];

        // Aggregate data
        const threatsBySeverity = {
          critical: threats.filter((t: any) => t.severity === "critical").length,
          high: threats.filter((t: any) => t.severity === "high").length,
          medium: threats.filter((t: any) => t.severity === "medium").length,
          low: threats.filter((t: any) => t.severity === "low").length,
        };

        const threatsByType: Record<string, number> = {};
        threats.forEach((t: any) => {
          threatsByType[t.threat_type] = (threatsByType[t.threat_type] || 0) + 1;
        });

        // Top threats by IP
        const ipThreatCounts: Record<string, number> = {};
        threats.forEach((t: any) => {
          ipThreatCounts[t.source_ip] = (ipThreatCounts[t.source_ip] || 0) + 1;
        });

        const topThreats = Object.entries(ipThreatCounts)
          .map(([ip, count]) => {
            const threat = threats.find((t: any) => t.source_ip === ip);
            return {
              id: threat?.id || 0,
              threat_type: threat?.threat_type || "Unknown",
              severity: threat?.severity || "low",
              source_ip: ip,
              detected_at: threat?.detected_at || new Date().toISOString(),
              count,
            };
          })
          .sort((a, b) => b.count - a.count)
          .slice(0, 10);

        // Top blocked IPs
        const topBlockedIPs = (blockedIPsData.blockedIPs || []).slice(0, 10).map((ip: any) => ({
          ip_address: ip.ip_address,
          count: 1, // Could be enhanced with actual threat count
          reason: ip.reason,
        }));

        // Generate timeline (simplified)
        const timeline: Array<{ date: string; logs: number; threats: number }> = [];
        const days = selectedTimeframe === "1h" ? 1 : selectedTimeframe === "24h" ? 24 : selectedTimeframe === "7d" ? 7 : selectedTimeframe === "30d" ? 30 : 90;
        const hoursPerPoint = selectedTimeframe === "1h" ? 1 : selectedTimeframe === "24h" ? 1 : 1;

        for (let i = days - 1; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const dateStr = date.toISOString().split("T")[0];
          const dayThreats = threats.filter((t: any) => t.detected_at?.startsWith(dateStr)).length;
          timeline.push({
            date: dateStr,
            logs: Math.floor(Math.random() * 1000) + 500, // Mock data - would come from actual logs
            threats: dayThreats,
          });
        }

        setReportData({
          timeframe: selectedTimeframe,
          totalLogs: dashboardData.data?.dashboard?.totalLogs || 0,
          totalThreats: threats.length,
          threatsBySeverity,
          threatsByType,
          logsBySource: dashboardData.data?.logStats?.reduce((acc: any, stat: any) => {
            acc[stat.log_format] = stat.total_records || 0;
            return acc;
          }, {}) || {},
          logsByLevel: {}, // Would need logs API
          topThreats,
          topBlockedIPs,
          timeline,
        });
      }
    } catch (err: any) {
      console.error("Failed to fetch report data:", err);
      setError(err.message || "Failed to load report data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, [selectedTimeframe]);

  const exportReport = async () => {
    setExporting(true);
    try {
      const report = {
        generated_at: new Date().toISOString(),
        timeframe: selectedTimeframe,
        ...reportData,
      };

      const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `security-report-${selectedTimeframe}-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to export report:", err);
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 font-inter flex">
        <Sidebar />
        <div className="flex-1 ml-20 p-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center py-12 text-gray-600 dark:text-gray-400">Loading report data...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 font-inter flex">
        <Sidebar />
        <div className="flex-1 ml-20 p-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center py-12 text-red-600 dark:text-red-400">Error: {error}</div>
          </div>
        </div>
      </div>
    );
  }

  if (!reportData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 font-inter flex">
      <Sidebar />
      <div className="flex-1 ml-20 p-6 transition-all duration-300">
        <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <FileText className="w-6 h-6 text-blue-500" />
              Security Reports
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Historical analytics and security insights
            </p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={selectedTimeframe}
              onChange={(e) => setSelectedTimeframe(e.target.value)}
              className="px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white"
            >
              {timeframes.map((tf) => (
                <option key={tf.value} value={tf.value}>
                  {tf.label}
                </option>
              ))}
            </select>
            <button
              onClick={exportReport}
              disabled={exporting}
              className="px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm hover:bg-gray-50 dark:hover:bg-gray-600 transition flex items-center gap-2 text-gray-900 dark:text-white"
            >
              <Download className="w-4 h-4" />
              {exporting ? "Exporting..." : "Export Report"}
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Logs</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {reportData.totalLogs.toLocaleString()}
                </p>
              </div>
              <Server className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Threats</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {reportData.totalThreats.toLocaleString()}
                </p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">Critical Threats</p>
                <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mt-1">
                  {reportData.threatsBySeverity.critical}
                </p>
              </div>
              <Shield className="w-8 h-8 text-orange-500" />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">Blocked IPs</p>
                <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mt-1">
                  {reportData.topBlockedIPs.length}
                </p>
              </div>
              <Shield className="w-8 h-8 text-purple-500" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Threats by Severity */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <PieChart className="w-5 h-5" />
              Threats by Severity
            </h3>
            <div className="space-y-3">
              {Object.entries(reportData.threatsBySeverity).map(([severity, count]) => {
                const total = Object.values(reportData.threatsBySeverity).reduce((a, b) => a + b, 0);
                const percentage = total > 0 ? (count / total) * 100 : 0;
                const colors = {
                  critical: "bg-red-500",
                  high: "bg-orange-500",
                  medium: "bg-yellow-500",
                  low: "bg-blue-500",
                };
                return (
                  <div key={severity}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                        {severity}
                      </span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {count} ({percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className={`${colors[severity as keyof typeof colors]} h-2 rounded-full transition-all`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Threats by Type */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Threats by Type
            </h3>
            <div className="space-y-2">
              {Object.entries(reportData.threatsByType)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 8)
                .map(([type, count]) => {
                  const max = Math.max(...Object.values(reportData.threatsByType));
                  const percentage = max > 0 ? (count / max) * 100 : 0;
                  return (
                    <div key={type}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-700 dark:text-gray-300 truncate">{type}</span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">{count}</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>

        {/* Timeline Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Activity Timeline
            </h3>
            <div className="space-y-2">
              {reportData.timeline.map((point) => {
                const maxLogs = Math.max(...reportData.timeline.map((p) => p.logs));
                const maxThreats = Math.max(...reportData.timeline.map((p) => p.threats));
                return (
                  <div key={point.date} className="flex items-center gap-4">
                    <div className="w-24 text-xs text-gray-600 dark:text-gray-400">
                    {new Date(point.date).toLocaleDateString()}
                  </div>
                    <div className="flex-1 flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-4 relative">
                      <div
                        className="bg-blue-500 h-4 rounded-full"
                        style={{ width: `${(point.logs / maxLogs) * 100}%` }}
                      />
                      <span className="absolute left-2 text-xs text-white font-medium">
                        {point.logs.toLocaleString()} logs
                      </span>
                    </div>
                    <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-4 relative">
                      <div
                        className="bg-red-500 h-4 rounded-full"
                        style={{ width: `${maxThreats > 0 ? (point.threats / maxThreats) * 100 : 0}%` }}
                      />
                      <span className="absolute left-2 text-xs text-white font-medium">
                        {point.threats} threats
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Threats and Blocked IPs */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Threats */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Top Threat Sources
              </h3>
            </div>
            <div className="p-4">
              <div className="space-y-3">
                {reportData.topThreats.map((threat, idx) => (
                  <div
                    key={threat.id || idx}
                    className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-md"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm text-gray-900 dark:text-white">
                          {threat.source_ip}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded bg-red-500/20 text-red-600 dark:text-red-400">
                          {threat.severity}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">{threat.threat_type}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900 dark:text-white">{threat.count}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">threats</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Top Blocked IPs */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Blocked IP Addresses
              </h3>
            </div>
            <div className="p-4">
              <div className="space-y-3">
                {reportData.topBlockedIPs.map((ip, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-md"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-sm text-gray-900 dark:text-white mb-1">
                        {ip.ip_address}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 truncate">{ip.reason}</p>
                    </div>
                    <span className="text-xs px-2 py-1 rounded bg-red-500/20 text-red-600 dark:text-red-400">
                      Blocked
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}

