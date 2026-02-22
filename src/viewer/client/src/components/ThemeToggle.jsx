import { useTheme } from '../hooks/useTheme.js';

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  return (
    <select
      className="form-select theme-toggle"
      value={theme}
      onChange={(e) => setTheme(e.target.value)}
    >
      <option value="system">System</option>
      <option value="light">Light</option>
      <option value="dark">Dark</option>
    </select>
  );
}
