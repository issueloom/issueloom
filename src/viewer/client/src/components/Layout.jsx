import { NavLink, Outlet } from 'react-router-dom';
import ThemeToggle from './ThemeToggle.jsx';

function navClass({ isActive }) {
  return `app-nav__link${isActive ? ' app-nav__link--active' : ''}`;
}

export default function Layout() {
  return (
    <>
      <header className="app-header">
        <div className="app-header__left">
          <span className="app-header__title">IssueLoom</span>
          <nav className="app-nav">
            <NavLink to="/" end className={navClass}>Dashboard</NavLink>
            <NavLink to="/issues" className={navClass}>Issues</NavLink>
          </nav>
        </div>
        <ThemeToggle />
      </header>
      <main className="app-main">
        <Outlet />
      </main>
    </>
  );
}
