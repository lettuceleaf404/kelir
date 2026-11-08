import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import Logo from './Logo.jsx';
import Icon from './Icon.jsx';
import { Avatar, Badge, Button } from './ui.jsx';
import { useAuth } from '../auth/AuthContext.jsx';

export const NAV = [
  { to: '/', label: 'Home', icon: 'home', end: true },
  { to: '/explore', label: 'Explore', icon: 'explore' },
  { to: '/watch', label: 'Watch', icon: 'watch' },
  { to: '/collection', label: 'Collection', icon: 'collection' },
  { to: '/profile', label: 'Profile', icon: 'profile' },
];

function SearchBox() {
  const navigate = useNavigate();
  const location = useLocation();
  const [q, setQ] = useState('');
  useEffect(() => {
    if (location.pathname === '/explore') setQ(new URLSearchParams(location.search).get('q') || '');
  }, [location]);
  const submit = (e) => {
    e.preventDefault();
    const params = new URLSearchParams(location.pathname === '/explore' ? location.search : '');
    if (q.trim()) params.set('q', q.trim());
    else params.delete('q');
    navigate(`/explore?${params.toString()}`);
  };
  return (
    <form role="search" className="nav-search" onSubmit={submit}>
      <Icon name="search" size={20} className="nav-search-icon" />
      <label htmlFor="global-search" className="sr-only">Cari</label>
      <input id="global-search" className="input" type="search" placeholder="Cari judul, kreator, pemeran, daerah" value={q} onChange={(e) => setQ(e.target.value)} />
    </form>
  );
}

export default function Navbar() {
  const { user, isAdmin, isPremium } = useAuth();
  return (
    <header className="navbar">
      <div className="navbar-inner container">
        <Link to="/" className="nav-brand" aria-label="KELIR, ke Home">
          <Logo size={30} />
        </Link>
        <nav className="nav-links" aria-label="Navigasi utama">
          {NAV.slice(0, 4).map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className="nav-link">
              <Icon name={item.icon} size={20} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <SearchBox />
        <div className="nav-right">
          {isAdmin && <Button variant="tertiary" size="sm" to="/admin" icon="settings">Admin</Button>}
          {user ? (
            <>
              {!isPremium && <Button variant="premium" size="sm" to="/premium" className="hide-sm">Premium</Button>}
              <NavLink to="/profile" className="nav-profile" aria-label={`Profile ${user.name}`}>
                <Avatar user={user} size={36} />
                {isPremium && <Badge tone="premium" className="nav-premium-dot">P</Badge>}
              </NavLink>
            </>
          ) : (
            <>
              <Button variant="tertiary" size="sm" to="/login">Masuk</Button>
              <Button variant="primary" size="sm" to="/register">Daftar</Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

/** Bottom tab bar on small screens: the five destinations from the brief, always labelled. */
export function TabBar() {
  return (
    <nav className="tabbar" aria-label="Navigasi utama">
      {NAV.map((item) => (
        <NavLink key={item.to} to={item.to} end={item.end} className="tabbar-item">
          <span className="tabbar-icon"><Icon name={item.icon} size={22} /></span>
          <span className="tabbar-label">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

export function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <div>
          <Logo size={26} />
          <p className="footer-tag">Satu Ruang, Sejuta Cerita.</p>
        </div>
        <p className="footer-note">
          Proyek kuliah. Metadata dari sumber publik; video yang diputar adalah aset demo berlisensi Creative Commons
          (Blender Foundation) dan klip buatan KELIR, bukan film aslinya. Pembayaran hanya simulasi.
        </p>
      </div>
    </footer>
  );
}
