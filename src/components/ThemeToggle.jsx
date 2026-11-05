import { useTheme } from '../context/ThemeContext';

/**
 * Light / Dark segmented control — public site + reusable.
 */
const ThemeToggle = ({ className = '', compact = false }) => {
  const { theme, isDark, setLightTheme, setDarkTheme } = useTheme();

  return (
    <div
      className={`inline-flex items-center rounded-lg border p-0.5 gap-0.5 ${className}`}
      style={{
        backgroundColor: isDark ? 'rgb(30 41 59)' : 'rgb(241 245 249)',
        borderColor: isDark ? 'rgb(51 65 85)' : 'rgb(226 232 240)',
      }}
      role="group"
      aria-label="Color theme"
    >
      <button
        type="button"
        onClick={setLightTheme}
        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-all"
        style={{
          backgroundColor: !isDark ? 'rgb(255 255 255)' : 'transparent',
          color: !isDark ? 'rgb(15 23 42)' : 'rgb(148 163 184)',
          boxShadow: !isDark ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
        }}
        aria-pressed={!isDark}
        title="Light theme"
      >
        <span aria-hidden>☀️</span>
        {!compact && <span className="hidden sm:inline">Light</span>}
      </button>
      <button
        type="button"
        onClick={setDarkTheme}
        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-all"
        style={{
          backgroundColor: isDark ? 'rgb(51 65 85)' : 'transparent',
          color: isDark ? 'rgb(241 245 249)' : 'rgb(100 116 139)',
          boxShadow: isDark ? '0 1px 2px rgba(0,0,0,0.2)' : 'none',
        }}
        aria-pressed={isDark}
        title="Dark theme"
      >
        <span aria-hidden>🌙</span>
        {!compact && <span className="hidden sm:inline">Dark</span>}
      </button>
      <span className="sr-only">Current theme: {theme}</span>
    </div>
  );
};

export default ThemeToggle;
