/**
 * ThemeToggle Component
 * Allows users to switch between light and dark modes
 */

import React, { useEffect, useState } from 'react';

// Helper function to get effective theme (outside component to avoid hook dependency issues)
const getEffectiveTheme = (theme: 'light' | 'dark' | 'system'): 'light' | 'dark' => {
  if (theme === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return theme;
};

export const ThemeToggle: React.FC = () => {
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(() => {
    // Initialize from localStorage on first render
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('kalifinder-theme') as 'light' | 'dark' | 'system';
      return savedTheme || 'system';
    }
    return 'system';
  });

  // Apply theme to document whenever theme changes
  useEffect(() => {
    const root = document.documentElement;
    const effectiveTheme = getEffectiveTheme(theme);

    // Remove both classes first
    root.classList.remove('light', 'dark');

    // Add the effective theme class
    root.classList.add(effectiveTheme);

    // Set data attribute for CSS
    root.setAttribute('data-theme', effectiveTheme);

    // Save to localStorage
    localStorage.setItem('kalifinder-theme', theme);
  }, [theme]);

  // Listen to system theme changes
  useEffect(() => {
    if (theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      const root = document.documentElement;
      const effectiveTheme = getEffectiveTheme(theme);
      root.classList.remove('light', 'dark');
      root.classList.add(effectiveTheme);
      root.setAttribute('data-theme', effectiveTheme);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  const cycleTheme = () => {
    setTheme((current) => {
      if (current === 'light') return 'dark';
      if (current === 'dark') return 'system';
      return 'light';
    });
  };

  const effectiveTheme = getEffectiveTheme(theme);

  return (
    <button
      onClick={cycleTheme}
      className="hover:bg-muted focus-visible:ring-primary rounded-lg p-2 transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
      aria-label={`Current theme: ${theme}. Click to cycle between light, dark, and system themes`}
      title={`Theme: ${theme === 'system' ? `System (${effectiveTheme})` : theme}`}
    >
      {effectiveTheme === 'dark' ? (
        // Moon icon (dark mode)
        <svg
          className="h-5 w-5 text-yellow-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
          />
        </svg>
      ) : (
        // Sun icon (light mode)
        <svg
          className="h-5 w-5 text-orange-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
      )}

      {/* System indicator */}
      {theme === 'system' && <span className="sr-only">(Following system preference)</span>}
    </button>
  );
};

export default ThemeToggle;
