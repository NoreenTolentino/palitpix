import { LogoMark } from './Icons.jsx';
import ThemeToggle from './ThemeToggle.jsx';

export default function Header({ theme, onToggleTheme }) {
  return (
    <header className="site-header">
      <a className="brand" href="./" aria-label="PalitPix home">
        <LogoMark />
        <span className="brand-name">PalitPix</span>
      </a>
      <ThemeToggle theme={theme} onToggle={onToggleTheme} />
    </header>
  );
}
