import type { Metadata } from "next";
import Image from "next/image";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import ClientHeader from "@/components/ClientHeader";
import { ThemeProvider } from "@/context/ThemeContext";

export const metadata: Metadata = {
  title: "Security Log Analyzer",
  description: "Realtime log analysis powered by Supabase & AI",
  icons: {
    icon: "/logo.jpg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const stored = localStorage.getItem('theme');
                  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  const theme = stored === 'dark' || stored === 'light'
                    ? stored
                    : (prefersDark ? 'dark' : 'light');
                  const root = document.documentElement;
                  const body = document.body;

                  if (theme === 'dark') {
                    root.classList.add('dark');
                    body?.classList?.add('dark');
                  } else {
                    root.classList.remove('dark');
                    body?.classList?.remove('dark');
                  }

                  root.setAttribute('data-theme', theme);
                  root.style.colorScheme = theme;
                } catch (e) {
                  console.error('Error setting initial theme:', e);
                }
              })();
            `,
          }}
        />
      </head>

      <body className="antialiased bg-gray-50 text-gray-900 dark:bg-gray-900 dark:text-gray-100 transition-colors duration-200">
        <ThemeProvider>
          <AuthProvider>
            
            {/* ✅ Header (NOT sticky anymore) */}
            <header className="border-b border-black/5 bg-white dark:border-white/10 dark:bg-black/60">
              <div className="container-responsive flex h-16 items-center justify-between px-4">
                
                {/* Logo + App Name */}
                <div className="flex items-center gap-3">
                  <Image
                    src="/logo.jpg"
                    alt="SecLog Analyzer Logo"
                    width={36}
                    height={36}
                    priority
                    className="rounded-md object-contain"
                  />
                  <span className="text-lg font-semibold tracking-tight text-gray-900 dark:text-white">
                    SecLog Analyzer
                  </span>
                </div>

                {/* Right controls */}
                <ClientHeader />
              </div>
            </header>

            {/* Main content */}
            <main className="min-h-screen">{children}</main>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
