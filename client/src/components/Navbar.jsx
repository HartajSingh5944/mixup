import { Link, NavLink } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';
import { useAuth } from '../context/useAuth';

const navClass = ({ isActive }) =>
  `nav-pill rounded-full px-4 py-2 text-sm font-semibold transition ${
    isActive ? 'nav-pill-active bg-ink text-white shadow-[inset_0_1px_0_rgba(255,255,255,.2),0_10px_30px_rgba(17,24,39,.18)]' : ''
  }`;

const Navbar = () => {
  const { logout, user } = useAuth();

  return (
    <header className="sticky top-0 z-[1000] px-3 py-3 sm:px-4">
      <nav className="liquid-glass mx-auto flex max-w-6xl items-center justify-between gap-3 rounded-[1.75rem] px-4 py-3 sm:px-5">
        <Link to="/map" className="shrink-0 text-xl font-black tracking-normal text-ink">
          MixUp
        </Link>
        <div className="scrollbar-none flex min-w-0 items-center gap-1 overflow-x-auto">
          <NavLink to="/" className={navClass}>
            Home
          </NavLink>
          <NavLink to="/map" className={navClass}>
            Map
          </NavLink>
          <NavLink to="/match" className={navClass}>
            Match
          </NavLink>
          <NavLink to="/chat" className={navClass}>
            Chat
          </NavLink>
          <NavLink to="/events/create" className={navClass}>
            Host Event
          </NavLink>
          {user?.role === 'admin' && (
            <NavLink to="/admin/reports" className={navClass}>
              Reports
            </NavLink>
          )}
          <NavLink to="/profile" className={navClass}>
            Profile
          </NavLink>
        </div>
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <span className="hidden text-sm text-slate-600 sm:inline">{user?.name}</span>
          <ThemeToggle compact />
          <button
            type="button"
            onClick={logout}
            className="rounded-full border border-white/70 bg-white/70 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-white hover:text-ink"
          >
            Log out
          </button>
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
