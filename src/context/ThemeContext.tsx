"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

type ThemeMode = 'light' | 'dark';

type ThemeContextValue = {
  theme: ThemeMode;
  toggleTheme: () => void;
  setLightTheme: () => void;
  setDarkTheme: () => void;
  isDark: boolean;
  isLight: boolean;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export const useTheme = (): ThemeContextValue => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setTheme] = useState<ThemeMode>(() => {
    if (typeof window === 'undefined') return 'light';
    const saved = localStorage.getItem('theme');
    if (saved === 'dark' || saved === 'light') return saved;
    const system = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    return system;
  });

  const applyTheme = (nextTheme: ThemeMode) => {
    try {
      if (typeof window === 'undefined') return;
      
      const root = document.documentElement;
      
      // Tailwind uses 'dark' class for dark mode
      // Remove 'dark' class if switching to light mode
      if (nextTheme === 'dark') {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
      
      // Mirror on body as well
      const body = document.body;
      if (body) {
        if (nextTheme === 'dark') {
          body.classList.add('dark');
        } else {
          body.classList.remove('dark');
        }
      }
      
      // Set data attribute for custom styles
      root.setAttribute('data-theme', nextTheme);
      
      // Save to localStorage
      localStorage.setItem('theme', nextTheme);
      
      // Force a repaint to ensure all components update
      document.documentElement.style.colorScheme = nextTheme;
    } catch (e) {
      console.error('Error applying theme:', e);
    }
  };

  // Apply theme on mount and whenever theme changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      applyTheme(theme);
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => {
      const next: ThemeMode = prevTheme === 'light' ? 'dark' : 'light';
      // Apply immediately to avoid any flicker
      if (typeof window !== 'undefined') {
        applyTheme(next);
      }
      return next;
    });
  };

  const setLightTheme = () => setTheme('light');
  const setDarkTheme = () => setTheme('dark');

  return (
    <ThemeContext.Provider value={{ 
      theme, 
      toggleTheme, 
      setLightTheme, 
      setDarkTheme,
      isDark: theme === 'dark',
      isLight: theme === 'light'
    }}>
      {children}
    </ThemeContext.Provider>
  );
};