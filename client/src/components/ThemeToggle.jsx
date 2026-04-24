import { useTheme } from '../context/useTheme';

const ThemeToggle = ({ compact = false }) => {
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-pressed={isDarkMode}
      className={`rounded-full border border-white/70 bg-white/70 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-white hover:text-ink dark:border-white/10 dark:bg-slate-900/70 dark:text-slate-100 dark:hover:bg-slate-900 ${
        compact ? 'px-3 py-2' : 'px-4 py-2'
      }`}
    >
      {isDarkMode ? 'Light' : 'Dark'}
    </button>
  );
};

export default ThemeToggle;
