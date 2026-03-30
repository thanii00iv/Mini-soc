"use client";

import { useState, useEffect } from "react";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/components/AuthProvider";
import Sidebar from "@/components/Sidebar";
import {
  Settings,
  Save,
  Bell,
  Shield,
  Server,
  Database,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Sun,
  Moon,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Globe,
  Clock,
  Filter,
  Download,
} from "lucide-react";

type NotificationSettings = {
  emailAlerts: boolean;
  criticalThreats: boolean;
  systemErrors: boolean;
  dailyReports: boolean;
  weeklyReports: boolean;
};

type SecuritySettings = {
  autoBlockIPs: boolean;
  autoBlockThreshold: number;
  sessionTimeout: number;
  requireTwoFactor: boolean;
  ipWhitelist: string[];
};

type SystemSettings = {
  logRetentionDays: number;
  maxLogSize: number;
  autoCleanup: boolean;
  backupFrequency: string;
};

export default function SettingsPage() {
  const { theme, toggleTheme, isDark } = useTheme();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"general" | "notifications" | "security" | "system">("general");
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Notification settings
  const [notifications, setNotifications] = useState<NotificationSettings>({
    emailAlerts: true,
    criticalThreats: true,
    systemErrors: true,
    dailyReports: false,
    weeklyReports: true,
  });

  // Security settings
  const [security, setSecurity] = useState<SecuritySettings>({
    autoBlockIPs: true,
    autoBlockThreshold: 5,
    sessionTimeout: 30,
    requireTwoFactor: false,
    ipWhitelist: [],
  });

  // System settings
  const [system, setSystem] = useState<SystemSettings>({
    logRetentionDays: 30,
    maxLogSize: 1000,
    autoCleanup: true,
    backupFrequency: "daily",
  });

  // Profile settings
  const [profile, setProfile] = useState({
    displayName: user?.email?.split("@")[0] || "",
    email: user?.email || "",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  });

  const [newWhitelistIP, setNewWhitelistIP] = useState("");

  // Load settings from localStorage
  useEffect(() => {
    const savedNotifications = localStorage.getItem("notificationSettings");
    const savedSecurity = localStorage.getItem("securitySettings");
    const savedSystem = localStorage.getItem("systemSettings");

    if (savedNotifications) {
      setNotifications(JSON.parse(savedNotifications));
    }
    if (savedSecurity) {
      setSecurity(JSON.parse(savedSecurity));
    }
    if (savedSystem) {
      setSystem(JSON.parse(savedSystem));
    }
  }, []);

  const saveSettings = async () => {
    setSaving(true);
    setSaveMessage(null);

    try {
      // Simulate API call - in production, this would save to backend
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Save to localStorage
      localStorage.setItem("notificationSettings", JSON.stringify(notifications));
      localStorage.setItem("securitySettings", JSON.stringify(security));
      localStorage.setItem("systemSettings", JSON.stringify(system));

      setSaveMessage({ type: "success", text: "Settings saved successfully!" });
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error) {
      setSaveMessage({ type: "error", text: "Failed to save settings" });
    } finally {
      setSaving(false);
    }
  };

  const addWhitelistIP = () => {
    if (newWhitelistIP && !security.ipWhitelist.includes(newWhitelistIP)) {
      setSecurity({
        ...security,
        ipWhitelist: [...security.ipWhitelist, newWhitelistIP],
      });
      setNewWhitelistIP("");
    }
  };

  const removeWhitelistIP = (ip: string) => {
    setSecurity({
      ...security,
      ipWhitelist: security.ipWhitelist.filter((i) => i !== ip),
    });
  };

  const tabs = [
    { id: "general" as const, label: "General", icon: User },
    { id: "notifications" as const, label: "Notifications", icon: Bell },
    { id: "security" as const, label: "Security", icon: Shield },
    { id: "system" as const, label: "System", icon: Server },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 font-inter flex">
      <Sidebar />
      <div className="flex-1 ml-20 p-6 transition-all duration-300">
        <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Settings className="w-6 h-6 text-blue-500" />
              Settings
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Configure your security log analyzer preferences
            </p>
          </div>
          <button
            onClick={saveSettings}
            disabled={saving}
            className="px-4 py-2 rounded-md bg-blue-500 text-white hover:bg-blue-600 transition flex items-center gap-2 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>

        {/* Save Message */}
        {saveMessage && (
          <div
            className={`p-4 rounded-md border flex items-center gap-2 ${
              saveMessage.type === "success"
                ? "bg-green-50 dark:bg-green-900/20 border-green-500 text-green-700 dark:text-green-400"
                : "bg-red-50 dark:bg-red-900/20 border-red-500 text-red-700 dark:text-red-400"
            }`}
          >
            {saveMessage.type === "success" ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            {saveMessage.text}
          </div>
        )}

        {/* Tabs */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex border-b border-zinc-200 dark:border-zinc-700">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 px-6 py-4 text-sm font-medium transition flex items-center justify-center gap-2 ${
                    activeTab === tab.id
                      ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-500"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* General Settings */}
            {activeTab === "general" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Profile Information
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Display Name
                      </label>
                      <input
                        type="text"
                        value={profile.displayName}
                        onChange={(e) => setProfile({ ...profile, displayName: e.target.value })}
                        className="w-full px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={profile.email}
                        disabled
                        className="w-full px-4 py-2 rounded-md border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 cursor-not-allowed"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Email cannot be changed
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Timezone
                      </label>
                      <select
                        value={profile.timezone}
                        onChange={(e) => setProfile({ ...profile, timezone: e.target.value })}
                        className="w-full px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="UTC">UTC</option>
                        <option value="America/New_York">Eastern Time</option>
                        <option value="America/Chicago">Central Time</option>
                        <option value="America/Denver">Mountain Time</option>
                        <option value="America/Los_Angeles">Pacific Time</option>
                        <option value="Europe/London">London</option>
                        <option value="Europe/Paris">Paris</option>
                        <option value="Asia/Tokyo">Tokyo</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Appearance</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border border-zinc-200 dark:border-zinc-700 rounded-md">
                      <div className="flex items-center gap-3">
                        {isDark ? (
                          <Moon className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
                        ) : (
                          <Sun className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
                        )}
                        <div>
                          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Theme</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            Current: {isDark ? "Dark" : "Light"}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={toggleTheme}
                        className="px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition text-gray-900 dark:text-white"
                      >
                        Switch to {isDark ? "Light" : "Dark"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Notifications Settings */}
            {activeTab === "notifications" && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                  Email Notifications
                </h3>
                <div className="space-y-4">
                  {[
                    { key: "emailAlerts" as const, label: "Enable Email Alerts", desc: "Receive email notifications for important events" },
                    { key: "criticalThreats" as const, label: "Critical Threats", desc: "Get notified immediately when critical threats are detected" },
                    { key: "systemErrors" as const, label: "System Errors", desc: "Receive alerts for system errors and failures" },
                    { key: "dailyReports" as const, label: "Daily Reports", desc: "Receive daily summary reports via email" },
                    { key: "weeklyReports" as const, label: "Weekly Reports", desc: "Receive weekly summary reports via email" },
                  ].map((item) => (
                    <div
                      key={item.key}
                      className="flex items-center justify-between p-4 border border-zinc-200 dark:border-zinc-700 rounded-md"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{item.label}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">{item.desc}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notifications[item.key]}
                          onChange={(e) =>
                            setNotifications({ ...notifications, [item.key]: e.target.checked })
                          }
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Security Settings */}
            {activeTab === "security" && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                  Security Configuration
                </h3>
                <div className="space-y-4">
                  <div className="p-4 border border-zinc-200 dark:border-zinc-700 rounded-md">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                          Auto-Block IPs
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Automatically block IPs that trigger multiple threats
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={security.autoBlockIPs}
                          onChange={(e) => setSecurity({ ...security, autoBlockIPs: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    {security.autoBlockIPs && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Auto-Block Threshold (threats per hour)
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="100"
                          value={security.autoBlockThreshold}
                          onChange={(e) =>
                            setSecurity({ ...security, autoBlockThreshold: parseInt(e.target.value) || 5 })
                          }
                          className="w-full px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      </div>
                    )}
                  </div>

                  <div className="p-4 border border-zinc-200 dark:border-zinc-700 rounded-md">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Session Timeout (minutes)
                    </label>
                    <input
                      type="number"
                      min="5"
                      max="480"
                      value={security.sessionTimeout}
                      onChange={(e) =>
                        setSecurity({ ...security, sessionTimeout: parseInt(e.target.value) || 30 })
                      }
                        className="w-full px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div className="p-4 border border-zinc-200 dark:border-zinc-700 rounded-md">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                          Two-Factor Authentication
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Require 2FA for account access
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={security.requireTwoFactor}
                          onChange={(e) =>
                            setSecurity({ ...security, requireTwoFactor: e.target.checked })
                          }
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>

                  <div className="p-4 border border-zinc-200 dark:border-zinc-700 rounded-md">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      IP Whitelist
                    </label>
                    <div className="flex gap-2 mb-3">
                      <input
                        type="text"
                        value={newWhitelistIP}
                        onChange={(e) => setNewWhitelistIP(e.target.value)}
                        placeholder="Enter IP address"
                        className="flex-1 px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                      <button
                        onClick={addWhitelistIP}
                        className="px-4 py-2 rounded-md bg-blue-500 text-white hover:bg-blue-600 transition"
                      >
                        Add
                      </button>
                    </div>
                        <div className="space-y-2">
                          {security.ipWhitelist.map((ip) => (
                            <div
                              key={ip}
                              className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-900 rounded-md"
                            >
                              <span className="text-sm text-gray-700 dark:text-gray-300">{ip}</span>
                          <button
                            onClick={() => removeWhitelistIP(ip)}
                            className="text-red-500 hover:text-red-700 dark:hover:text-red-400 text-sm"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                      {security.ipWhitelist.length === 0 && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">No whitelisted IPs</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* System Settings */}
            {activeTab === "system" && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                  System Configuration
                </h3>
                <div className="space-y-4">
                  <div className="p-4 border border-zinc-200 dark:border-zinc-700 rounded-md">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Log Retention Period (days)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="365"
                      value={system.logRetentionDays}
                      onChange={(e) =>
                        setSystem({ ...system, logRetentionDays: parseInt(e.target.value) || 30 })
                      }
                        className="w-full px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div className="p-4 border border-zinc-200 dark:border-zinc-700 rounded-md">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Maximum Log Size (MB)
                    </label>
                    <input
                      type="number"
                      min="100"
                      max="10000"
                      value={system.maxLogSize}
                      onChange={(e) =>
                        setSystem({ ...system, maxLogSize: parseInt(e.target.value) || 1000 })
                      }
                        className="w-full px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div className="p-4 border border-zinc-200 dark:border-zinc-700 rounded-md">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                          Auto Cleanup
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Automatically delete logs older than retention period
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={system.autoCleanup}
                          onChange={(e) => setSystem({ ...system, autoCleanup: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>

                  <div className="p-4 border border-zinc-200 dark:border-zinc-700 rounded-md">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Backup Frequency
                    </label>
                    <select
                      value={system.backupFrequency}
                      onChange={(e) => setSystem({ ...system, backupFrequency: e.target.value })}
                        className="w-full px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="hourly">Hourly</option>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}

