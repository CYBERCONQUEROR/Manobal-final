import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type ThemeKey = 'light' | 'dark' | 'purple-dark' | 'blue-light'; // Expanded theme options

interface ThemeContextType {
  theme: ThemeKey;
  setTheme: (theme: ThemeKey) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setTheme] = useState<ThemeKey>('light');

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as ThemeKey;
    if (savedTheme) {
      setTheme(savedTheme);
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark');
    }
  }, []);

  useEffect(() => {
    // Remove existing theme classes
    document.documentElement.classList.remove('light', 'dark', 'purple-dark', 'blue-light');
    // Add the new theme class
    document.documentElement.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Removed toggleTheme, now directly setting the theme

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}