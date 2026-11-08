import { Link } from 'react-router-dom';
import Logo from '../components/Logo.jsx';

export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="auth">
      <div className="auth-art" aria-hidden>
        <div className="auth-stage">
          <span className="auth-window w1" />
          <span className="auth-window w2" />
          <span className="auth-window w3" />
          <span className="auth-lamp" />
        </div>
        <p className="auth-tag">Satu Ruang,<br />Sejuta Cerita.</p>
      </div>
      <div className="auth-panel">
        <Link to="/" className="auth-logo" aria-label="KELIR, ke Home"><Logo size={36} /></Link>
        <h1 className="t-h1">{title}</h1>
        {subtitle && <p className="page-sub">{subtitle}</p>}
        {children}
        {footer && <div className="auth-footer">{footer}</div>}
      </div>
    </div>
  );
}
