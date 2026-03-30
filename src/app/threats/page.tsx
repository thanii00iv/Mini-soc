"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Shield,
  AlertTriangle,
  Eye,
  Filter,
  Search,
  Download,
  Clock,
  MapPin,
  Activity,
  Ban,
  CheckCircle,
} from "lucide-react";
import Sidebar from "@/components/Sidebar";

export default function ThreatAnalysis() {
  const [threats, setThreats] = useState<any[]>([]);
  const [filteredThreats, setFilteredThreats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSeverity, setSelectedSeverity] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [timeFilter, setTimeFilter] = useState("24h");
  const pathname = usePathname();

  const severityFilters = [
    { value: "all", label: "All Severities", count: 0 },
    { value: "critical", label: "Critical", count: 0, color: "bg-red-600" },
    { value: "high", label: "High", count: 0, color: "bg-red-500" },
    { value: "medium", label: "Medium", count: 0, color: "bg-yellow-500" },
    { value: "low", label: "Low", count: 0, color: "bg-green-500" },
  ];

  const statusFilters = [
    { value: "all", label: "All Status" },
    { value: "active", label: "Active" },
    { value: "blocked", label: "Blocked" },
    { value: "monitored", label: "Monitored" },
    { value: "resolved", label: "Resolved" },
  ];

  const timeFilters = [
    { value: "1h", label: "Last Hour" },
    { value: "24h", label: "Last 24 Hours" },
    { value: "7d", label: "Last 7 Days" },
    { value: "30d", label: "Last 30 Days" },
  ];

  useEffect(() => {
    fetchThreats();
  }, [timeFilter]);

  useEffect(() => {
    filterThreats();
  }, [threats, selectedSeverity, selectedStatus, searchTerm]);

  const fetchThreats = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/threats?timeframe=${timeFilter}`);
      if (response.ok) {
        const data = await response.json();
        setThreats(data.threats || []);
      }
    } catch (error) {
      console.error("Failed to fetch threats:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterThreats = () => {
    let filtered = threats;

    if (selectedSeverity !== "all") {
      filtered = filtered.filter((threat) => threat.severity === selectedSeverity);
    }

    if (selectedStatus !== "all") {
      filtered = filtered.filter((threat) => threat.status === selectedStatus);
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (threat) =>
          threat.threat_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
          threat.source_ip.includes(searchTerm) ||
          threat.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredThreats(filtered);
  };

  const updateThreatStatus = async (threatId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/threats/${threatId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        setThreats((prev) =>
          prev.map((threat) =>
            threat.id === threatId ? { ...threat, status: newStatus } : threat
          )
        );
      }
    } catch (error) {
      console.error("Failed to update threat status:", error);
    }
  };

  const blockIP = async (ip: string) => {
    try {
      const response = await fetch("/api/blocked-ips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ip_address: ip,
          reason: "Blocked from threat analysis",
          auto_blocked: false,
        }),
      });

      if (response.ok) {
        setThreats((prev) =>
          prev.map((threat) =>
            threat.source_ip === ip ? { ...threat, status: "blocked" } : threat
          )
        );
      }
    } catch (error) {
      console.error("Failed to block IP:", error);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "text-red-700 bg-red-100 border-red-200";
      case "high":
        return "text-red-600 bg-red-50 border-red-200";
      case "medium":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "low":
        return "text-green-600 bg-green-50 border-green-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "text-red-600 bg-red-100";
      case "blocked":
        return "text-gray-600 bg-gray-100";
      case "monitored":
        return "text-yellow-600 bg-yellow-100";
      case "resolved":
        return "text-green-600 bg-green-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  const updatedSeverityFilters = severityFilters.map((filter) => ({
    ...filter,
    count:
      filter.value === "all"
        ? threats.length
        : threats.filter((t) => t.severity === filter.value).length,
  }));

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 font-inter flex">
      {/* Collapsible Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 ml-20 p-8 overflow-y-auto">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Threat Analysis</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Monitor and respond to security threats in real time
        </p>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 mb-6 flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-64">
            <Search
              size={18}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Search threats, IPs, descriptions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-10 pl-10 pr-4 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value)}
            className="h-10 px-3 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          >
            {timeFilters.map((filter) => (
              <option key={filter.value} value={filter.value}>
                {filter.label}
              </option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="h-10 px-3 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          >
            {statusFilters.map((filter) => (
              <option key={filter.value} value={filter.value}>
                {filter.label}
              </option>
            ))}
          </select>

          <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
            <Download size={16} className="mr-2" />
            Export
          </button>
        </div>

        {/* Threats Table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-5 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Security Threats ({filteredThreats.length})
            </h3>
            <button className="flex items-center px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-700">
              <Filter size={16} className="mr-2" />
              Advanced Filters
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                <tr>
                  <th className="px-6 py-3 text-left font-semibold text-gray-500">
                    Threat Details
                  </th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-500">
                    Severity
                  </th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-500">
                    Source IP
                  </th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-500">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-500">
                    Detected
                  </th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-gray-500 dark:text-gray-400">
                      Loading threats...
                    </td>
                  </tr>
                ) : filteredThreats.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-gray-500 dark:text-gray-400">
                      No threats found.
                    </td>
                  </tr>
                ) : (
                  filteredThreats.map((threat) => (
                    <tr key={threat.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-900 dark:text-white">
                          {threat.threat_type}
                        </p>
                        <p className="text-gray-500 dark:text-gray-400">{threat.description}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-block px-3 py-1 rounded-full border text-xs font-medium ${getSeverityColor(
                            threat.severity
                          )}`}
                        >
                          {threat.severity}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono text-gray-800 dark:text-gray-200">
                        {threat.source_ip}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                            threat.status
                          )}`}
                        >
                          {threat.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                        <Clock size={14} className="inline mr-1" />
                        {formatTimeAgo(threat.detected_at)}
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={threat.status}
                          onChange={(e) =>
                            updateThreatStatus(threat.id, e.target.value)
                          }
                          className="border border-gray-200 dark:border-gray-600 rounded px-2 py-1 text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500"
                        >
                          <option value="active">Active</option>
                          <option value="monitored">Monitor</option>
                          <option value="blocked">Block</option>
                          <option value="resolved">Resolve</option>
                        </select>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
