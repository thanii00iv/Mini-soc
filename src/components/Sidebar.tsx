"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Upload,
  Activity,
  Shield,
  FileText,
  Settings,
  LucideIcon,
} from "lucide-react";

type NavItem = {
  icon: LucideIcon;
  label: string;
  path: string;
};

const navItems: NavItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: Upload, label: "Log Upload", path: "/upload" },
  { icon: Activity, label: "Real-time Monitor", path: "/monitor" },
  { icon: Shield, label: "Threat Analysis", path: "/threats" },
  { icon: FileText, label: "Reports", path: "/reports" },
  { icon: Settings, label: "Settings", path: "/settings" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-screen bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 z-30 transition-all duration-300 ease-in-out w-20 hover:w-60 group">
      <div className="px-4 pt-8 h-full overflow-hidden">
        {/* Logo */}
        <div className="flex items-center mb-8 justify-center group-hover:justify-start transition-all duration-300">
          <Shield size={24} className="text-blue-600 flex-shrink-0" />
          <span className="ml-3 text-lg font-bold text-gray-900 dark:text-white whitespace-nowrap transition-all duration-300 opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0 overflow-hidden w-0 group-hover:w-auto">
            SecureLog
          </span>
        </div>

        {/* Navigation */}
        <nav className="space-y-2">
          {navItems.map((item) => {
            const isActive = pathname === item.path;
            const Icon = item.icon;
            return (
              <Link key={item.path} href={item.path}>
                <div
                  className={`flex items-center cursor-pointer rounded-lg px-3 py-2.5 transition-all duration-200 justify-center group-hover:justify-start ${
                    isActive
                      ? "bg-blue-50 text-blue-600 font-semibold dark:bg-blue-900/40 dark:text-blue-300"
                      : "hover:bg-blue-50 hover:text-blue-600 text-gray-700 dark:text-gray-300 dark:hover:bg-gray-700"
                  }`}
                  title={item.label}
                >
                  <span
                    className={`h-5 w-1 rounded-full transition-all duration-200 mr-0 group-hover:mr-2 ${
                      isActive
                        ? "bg-blue-600"
                        : "bg-transparent group-hover:bg-blue-400"
                    }`}
                  />
                  <Icon
                    size={18}
                    className={`flex-shrink-0 mr-0 group-hover:mr-3 ${
                      isActive
                        ? "text-blue-600"
                        : "text-gray-500 dark:text-gray-400 group-hover:text-blue-600"
                    }`}
                  />
                  <span className="text-sm whitespace-nowrap transition-all duration-300 opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0 overflow-hidden w-0 group-hover:w-auto">
                    {item.label}
                  </span>
                </div>
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}

