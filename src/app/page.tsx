"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Upload,
  Activity,
  Shield,
  AlertTriangle,
  FileText,
  Settings,
  Search,
  Bell,
  Sun,
  Moon,
  LogOut,
  Filter,
  Eye,
  Download,
  Play,
  Pause,
  TrendingUp,
  Server,
  Globe,
  Lock,
  Wifi,
  MoreVertical,
} from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import useUser from "@/utils/useUser";
import Sidebar from "@/components/Sidebar";

type DashboardApiData = {
  dashboard: {
    totalLogs: number;
    threatsDetected: number;
    blockedIPs: number;
    systemHealth: number;
  };
  metrics: Record<string, { value: number; unit: string }>;
  recentThreats: {
    id: string;
    type: string;
    severity: string;
    ip: string;
    time: string;
    status: string;
    description: string;
  }[];
};

export default function SecurityLogAnalyzer() {
  const pathname = usePathname();
  const { data: user, loading: userLoading } = useUser();
  const { theme, toggleTheme, isDark } = useTheme();

  const [selectedFilter, setSelectedFilter] = useState("Last 24h");
  const [isRealTimeActive, setIsRealTimeActive] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardApiData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);


  const logTypes = [
    { icon: Server, label: "Apache", count: 1247, status: "active" },
    { icon: Server, label: "Nginx", count: 892, status: "active" },
    { icon: Shield, label: "Firewall", count: 2156, status: "active" },
    { icon: Globe, label: "Windows Event", count: 634, status: "active" },
    { icon: Lock, label: "Auth Logs", count: 445, status: "warning" },
    { icon: Wifi, label: "Network", count: 1789, status: "active" },
  ];

  const filters = ["Last hour", "Last 24h", "Last 7d", "Last 30d", "Custom"];

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/logs/dashboard");
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      if (data.success) setDashboardData(data.data);
      else throw new Error(data.error || "Failed to fetch dashboard data");
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
      setError("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [selectedFilter, fetchDashboardData]);

  const metrics = dashboardData?.dashboard || {
    totalLogs: 0,
    threatsDetected: 0,
    blockedIPs: 0,
    systemHealth: 0,
  };

  const recentThreats = dashboardData?.recentThreats || [];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "text-red-600 bg-red-50";
      case "medium":
        return "text-yellow-600 bg-yellow-50";
      case "low":
        return "text-green-600 bg-green-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  if (userLoading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <p className="text-gray-600 dark:text-gray-400">Loading...</p>
      </div>
    );

  if (!user) {
    if (typeof window !== "undefined") window.location.href = "/account/signin";
    return null;
  }

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <p className="text-gray-600 dark:text-gray-400">Loading dashboard...</p>
      </div>
    );

  if (error)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchDashboardData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 font-inter flex">
      {/* Collapsible Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main className="flex-1 ml-20 transition-all duration-300">
        {/* Topbar */}
        <header className="fixed top-0 right-0 left-20 h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-6 z-10 transition-all duration-300">
          {/* Search */}
          <div className="relative w-96">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search logs, IPs, threats..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Controls */}
          <div className="flex items-center space-x-4">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <button
              onClick={() => setIsRealTimeActive(!isRealTimeActive)}
              className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium ${
                isRealTimeActive
                  ? "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
              }`}
            >
              {isRealTimeActive ? <Play size={14} className="mr-2" /> : <Pause size={14} className="mr-2" />}
              {isRealTimeActive ? "Live" : "Paused"}
            </button>

            <Bell size={18} className="text-gray-400" />

            {/* User */}
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm">
                {user?.email?.[0]?.toUpperCase() || "U"}
              </div>
              <span className="text-sm text-gray-800 dark:text-gray-100">{user?.email}</span>
              <Link
                href="/account/logout"
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                title="Sign Out"
              >
                <LogOut size={16} />
              </Link>
            </div>
          </div>
        </header>

        {/* Main Body */}
        <section className="pt-20 px-6 pb-10">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Security Dashboard</h1>
              <p className="text-gray-600 dark:text-gray-400">Monitor and analyze logs in real-time</p>
            </div>

            <div className="flex items-center space-x-3">
              {filters.map((filter) => (
                <button
                  key={filter}
                  onClick={() => setSelectedFilter(filter)}
                  className={`px-4 py-2 rounded-lg text-sm ${
                    selectedFilter === filter
                      ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
                      : "border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                  }`}
                >
                  {filter}
                </button>
              ))}
              <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
                <Download size={16} className="mr-2" />
                Export
              </button>
            </div>
          </div>

          {/* Stat Cards */}
          <div className="grid grid-cols-4 gap-6 mb-8">
            {[
              { title: "Total Logs", value: metrics.totalLogs, icon: FileText, color: "blue", change: "+12.5%" },
              { title: "Threats Detected", value: metrics.threatsDetected, icon: AlertTriangle, color: "red", change: `+${recentThreats.length}` },
              { title: "Blocked IPs", value: metrics.blockedIPs, icon: Shield, color: "yellow", change: "Active" },
              { title: "System Health", value: `${metrics.systemHealth}%`, icon: TrendingUp, color: "green", change: "Operational" },
            ].map((card) => (
              <div
                key={card.title}
                className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{card.title}</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{card.value}</p>
                    <p className={`text-sm mt-1 text-${card.color}-600 dark:text-${card.color}-400`}>{card.change}</p>
                  </div>
                  <div className={`w-12 h-12 bg-${card.color}-100 dark:bg-${card.color}-900 rounded-lg flex items-center justify-center`}>
                    <card.icon size={24} className={`text-${card.color}-600 dark:text-${card.color}-400`} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Recent Threats Table */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Threats</h3>
              <div className="flex space-x-2">
                <button className="flex items-center px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-700">
                  <Filter size={16} className="mr-2" /> Filter
                </button>
                <button className="flex items-center px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-700">
                  <Eye size={16} className="mr-2" /> View All
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 uppercase">
                  <tr>
                    <th className="px-6 py-3 text-left">Threat Type</th>
                    <th className="px-6 py-3 text-left">Severity</th>
                    <th className="px-6 py-3 text-left">Source IP</th>
                    <th className="px-6 py-3 text-left">Time</th>
                    <th className="px-6 py-3 text-left">Status</th>
                    <th className="px-6 py-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {recentThreats.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-gray-500 dark:text-gray-400">
                        No recent threats detected.
                      </td>
                    </tr>
                  ) : (
                    recentThreats.map((threat) => (
                      <tr key={threat.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4">{threat.type}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(threat.severity)}`}>
                            {threat.severity}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-mono">{threat.ip}</td>
                        <td className="px-6 py-4">{threat.time}</td>
                        <td className="px-6 py-4 capitalize">{threat.status}</td>
                        <td className="px-6 py-4 space-x-3">
                          <button className="text-blue-600 hover:underline">View</button>
                          <button className="text-red-600 hover:underline">Block</button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
