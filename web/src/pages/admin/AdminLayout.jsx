import { NavLink, Outlet } from 'react-router-dom';
import Icon from '../../components/Icon.jsx';

const LINKS = [
  { to: '/admin', label: 'Dasbor', icon: 'grid', end: true },
  { to: '/admin/contents', label: 'Konten', icon: 'film' },
  { to: '/admin/users', label: 'Pengguna & langganan', icon: 'users' },
  { to: '/admin/reviews', label: 'Moderasi ulasan', icon: 'message' },
  { to: '/admin/payments', label: 'Transaksi', icon: 'receipt' },
];

export default function AdminLayout() {
  return (
    <div className="page container admin">
      <aside className="admin-nav" aria-label="Menu admin">
        <p className="overline">Admin KELIR</p>
        {LINKS.map((l) => (
          <NavLink key={l.to} to={l.to} end={l.end} className="admin-link">
            <Icon name={l.icon} size={20} /> {l.label}
          </NavLink>
        ))}
      </aside>
      <div className="admin-main">
        <Outlet />
      </div>
    </div>
  );
}
