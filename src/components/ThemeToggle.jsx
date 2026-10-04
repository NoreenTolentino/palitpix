import { MoonIcon, SunIcon } from './Icons.jsx';

// Switches between light and dark mode. The icon shows the mode you will switch to.
export default function ThemeToggle({ theme, onToggle }) {
  const isDark = theme === 'dark';
  const label = isDark ? 'Switch to light mode' : 'Switch to dark mode';

  return (
    <button type="button" className="icon-button theme-toggle" onClick={onToggle} aria-label={label} title={label}>
      {isDark ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}
