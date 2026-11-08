import { forwardRef, useEffect, useId, useRef } from 'react';
import { Link } from 'react-router-dom';
import Icon from './Icon.jsx';
import { TYPE_BADGE, TYPE_LABEL } from '../lib/format.js';

const cx = (...c) => c.filter(Boolean).join(' ');

/** Button from the design system: primary (Dark Coral), secondary (Turquoise), tertiary (transparent), premium (Mango). */
export const Button = forwardRef(function Button({ variant = 'primary', size = 'md', icon, iconRight, block, to, href, className, children, busy, ...rest }, ref) {
  const cls = cx('btn', `btn-${variant}`, size !== 'md' && `btn-${size}`, block && 'btn-block', className);
  const iconSize = size === 'sm' ? 18 : size === 'lg' ? 22 : 20;
  const inner = (
    <>
      {busy ? <span className="spinner spinner-sm" aria-hidden /> : icon ? <Icon name={icon} size={iconSize} /> : null}
      {children != null && <span>{children}</span>}
      {iconRight ? <Icon name={iconRight} size={iconSize} /> : null}
    </>
  );
  if (to) return <Link ref={ref} to={to} className={cls} {...rest}>{inner}</Link>;
  if (href) return <a ref={ref} href={href} className={cls} {...rest}>{inner}</a>;
  return <button ref={ref} type="button" className={cls} disabled={busy || rest.disabled} {...rest}>{inner}</button>;
});

export function IconButton({ icon, label, className, size = 20, ...rest }) {
  return (
    <button type="button" className={cx('icon-btn', className)} aria-label={label} title={label} {...rest}>
      <Icon name={icon} size={size} />
    </button>
  );
}

export function Badge({ tone = 'neutral', icon, children, className }) {
  return (
    <span className={cx('badge', `badge-${tone}`, className)}>
      {icon && <Icon name={icon} size={14} />}
      {children}
    </span>
  );
}

export function TypeBadge({ type }) {
  return <Badge tone={TYPE_BADGE[type]}>{TYPE_LABEL[type]}</Badge>;
}

export function PremiumBadge({ locked = true }) {
  return <Badge tone="premium" icon={locked ? 'lock' : 'sparkle'}>Premium</Badge>;
}

export const TextField = forwardRef(function TextField({ label, hint, error, icon, className, id, as = 'input', ...rest }, ref) {
  const autoId = useId();
  const fieldId = id || autoId;
  const msgId = `${fieldId}-msg`;
  const Control = as;
  return (
    <div className={cx('field', error && 'field-invalid', icon && 'field-has-icon', className)}>
      {label && <label htmlFor={fieldId} className="field-label">{label}</label>}
      <div className="field-control">
        {icon && <Icon name={icon} size={20} className="field-icon" />}
        <Control ref={ref} id={fieldId} className={as === 'select' ? 'input select' : 'input'} aria-invalid={error ? true : undefined} aria-describedby={error || hint ? msgId : undefined} {...rest} />
      </div>
      {(error || hint) && (
        <p id={msgId} className={error ? 'field-error' : 'field-hint'}>
          {error && <Icon name="alert" size={16} />}
          {error || hint}
        </p>
      )}
    </div>
  );
});

export function Spinner({ label = 'Memuat…' }) {
  return (
    <div className="state" role="status">
      <span className="spinner" aria-hidden />
      <span>{label}</span>
    </div>
  );
}

export function ErrorState({ error, onRetry }) {
  return (
    <div className="state state-error" role="alert">
      <Icon name="alert" size={28} />
      <p>{error?.message || 'Terjadi kesalahan.'}</p>
      {onRetry && <Button variant="secondary" size="sm" icon="replay" onClick={onRetry}>Coba lagi</Button>}
    </div>
  );
}

export function EmptyState({ icon = 'sparkle', title, children, action }) {
  return (
    <div className="state state-empty">
      <span className="state-art" aria-hidden><Icon name={icon} size={28} /></span>
      <p className="state-title">{title}</p>
      {children && <p className="state-text">{children}</p>}
      {action}
    </div>
  );
}

export function Stars({ value = 0, size = 16, label }) {
  const rounded = Math.round(value);
  return (
    <span className="stars" role="img" aria-label={label || `Rating ${value} dari 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Icon key={n} name="star" size={size} filled={n <= rounded} className={n <= rounded ? 'star-on' : 'star-off'} />
      ))}
    </span>
  );
}

/** Radio-group star input: arrow keys and clicks both work. */
export function StarInput({ value, onChange, name = 'rating' }) {
  return (
    <fieldset className="star-input">
      <legend className="sr-only">Rating</legend>
      {[1, 2, 3, 4, 5].map((n) => (
        <label key={n} className={n <= value ? 'on' : ''}>
          <input type="radio" name={name} value={n} checked={value === n} onChange={() => onChange(n)} className="sr-only" />
          <Icon name="star" size={28} filled={n <= value} />
          <span className="sr-only">{n} bintang</span>
        </label>
      ))}
    </fieldset>
  );
}

export const AVATAR_TONES = ['coral', 'mango', 'turquoise', 'lilac', 'ink', 'peach', 'mint', 'lavender'];
export function Avatar({ user, size = 40 }) {
  const initials = (user?.name || '?').split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
  return (
    <span className={cx('avatar', `avatar-${user?.avatar || 'coral'}`)} style={{ width: size, height: size, fontSize: size * 0.38 }} aria-hidden>
      {initials}
    </span>
  );
}

/** Accessible dialog on top of <dialog>: Escape and the close button both close it. */
export function Modal({ open, onClose, title, children, footer, size = 'md' }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);
  return (
    <dialog ref={ref} className={cx('modal', `modal-${size}`)} onClose={onClose} onCancel={(e) => { e.preventDefault(); onClose(); }}>
      {open && (
        <div className="modal-body">
          <header className="modal-head">
            <h2 className="t-h3">{title}</h2>
            <IconButton icon="close" label="Tutup" onClick={onClose} />
          </header>
          <div className="modal-content">{children}</div>
          {footer && <footer className="modal-foot">{footer}</footer>}
        </div>
      )}
    </dialog>
  );
}

export function SectionHeader({ title, subtitle, to, linkLabel = 'Lihat semua', id }) {
  return (
    <div className="section-head">
      <div>
        <h2 className="t-h2" id={id}>{title}</h2>
        {subtitle && <p className="section-sub">{subtitle}</p>}
      </div>
      {to && <Button variant="tertiary" size="sm" to={to} iconRight="chevron-right">{linkLabel}</Button>}
    </div>
  );
}

export function Chips({ options, value, onChange, label, multiple = false }) {
  const isOn = (v) => (multiple ? value.includes(v) : value === v);
  const toggle = (v) => {
    if (!multiple) return onChange(value === v ? '' : v);
    onChange(isOn(v) ? value.filter((x) => x !== v) : [...value, v]);
  };
  return (
    <div className="chips" role="group" aria-label={label}>
      {options.map((o) => (
        <button key={o.value} type="button" className={cx('chip', isOn(o.value) && 'chip-on')} aria-pressed={isOn(o.value)} onClick={() => toggle(o.value)}>
          {o.icon && <Icon name={o.icon} size={16} />}
          {o.label}
          {o.count != null && <span className="chip-count">{o.count}</span>}
        </button>
      ))}
    </div>
  );
}

export function Tabs({ tabs, value, onChange, label }) {
  return (
    <div className="tabs" role="tablist" aria-label={label}>
      {tabs.map((t) => (
        <button key={t.value} role="tab" type="button" aria-selected={value === t.value} className={cx('tab', value === t.value && 'tab-on')} onClick={() => onChange(t.value)}>
          {t.icon && <Icon name={t.icon} size={18} />}
          {t.label}
          {t.count != null && <span className="tab-count">{t.count}</span>}
        </button>
      ))}
    </div>
  );
}
