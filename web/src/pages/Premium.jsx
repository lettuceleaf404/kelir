import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../auth/AuthContext.jsx';
import { useAsync, useDocumentTitle } from '../lib/hooks.js';
import { date, rupiah, SUB_LABEL } from '../lib/format.js';
import Icon from '../components/Icon.jsx';
import Logo from '../components/Logo.jsx';
import { Badge, Button, Modal, Spinner } from '../components/ui.jsx';

const BENEFITS = [
  ['film', 'Semua film dan serial Premium', 'Termasuk seluruh episode serial, bukan hanya episode pertama.'],
  ['sparkle', 'Konten eksklusif bila tersedia', 'Tayangan pilihan yang hanya ada di KELIR.'],
  ['eye', 'Kualitas video lebih tinggi', 'Bila sumber videonya mendukung.'],
  ['check', 'Tanpa iklan', 'Untuk konten Premium yang berlaku.'],
];

export default function Premium() {
  useDocumentTitle('Premium');
  const { user, setUser, isPremium } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const plans = useAsync(() => api.plans(), []);
  const sub = useAsync(() => (user ? api.subscription() : Promise.resolve(null)), [user?.id, user?.subscription?.expiresAt, user?.subscription?.status]);
  const [chosen, setChosen] = useState(null);
  const [confirmed, setConfirmed] = useState(false);
  const [status, setStatus] = useState({ busy: false, error: null, receipt: null });

  const choose = (plan) => {
    if (!user) return navigate('/login', { state: { from: '/premium' } });
    setChosen(plan);
    setConfirmed(false);
    setStatus({ busy: false, error: null, receipt: null });
  };
  const pay = async () => {
    setStatus({ busy: true, error: null, receipt: null });
    try {
      const res = await api.checkout(chosen.key);
      setUser(res.user);
      setStatus({ busy: false, error: null, receipt: res.payment });
    } catch (error) {
      setStatus({ busy: false, error, receipt: null });
    }
  };
  const back = location.state?.from;
  const monthly = plans.data?.plans.find((p) => p.key === 'monthly');

  return (
    <div className="page premium-page">
      <section className="premium-hero" data-theme="dark">
        <div className="container premium-hero-inner">
          <div>
            <Badge tone="premium" icon="sparkle">KELIR Premium</Badge>
            <h1 className="t-display">Semua cerita, tanpa kunci.</h1>
            <p className="t-body-l">Tonton film dan serial Premium dari seluruh Nusantara dan dunia. Berhenti kapan saja.</p>
            {user && (
              <p className="premium-status">
                Status akunmu: <strong>{SUB_LABEL[user.subscription.status]}</strong>
                {user.subscription.expiresAt && ['ACTIVE', 'CANCELLED'].includes(user.subscription.status) && ` sampai ${date(user.subscription.expiresAt)}`}
              </p>
            )}
          </div>
          <Logo variant="mark" size={160} className="premium-mark" />
        </div>
      </section>

      <div className="container">
        <ul className="benefits">
          {BENEFITS.map(([icon, title, text]) => (
            <li key={title}>
              <span className="benefit-icon"><Icon name={icon} size={22} /></span>
              <strong>{title}</strong>
              <span className="muted">{text}</span>
            </li>
          ))}
        </ul>

        <h2 className="t-h2 section-title">Pilih paket</h2>
        {plans.loading ? <Spinner /> : (
          <div className="plans">
            {plans.data.plans.map((p) => {
              const perMonth = p.key === 'annual' ? Math.round(p.price / 12) : p.price;
              const saving = p.key === 'annual' && monthly ? Math.round((1 - p.price / (monthly.price * 12)) * 100) : 0;
              return (
                <article key={p.key} className={`plan ${p.key === 'annual' ? 'plan-best' : ''}`}>
                  {saving > 0 && <Badge tone="budaya" className="plan-tag">Hemat {saving}%</Badge>}
                  <h3 className="t-h3">{p.name}</h3>
                  <p className="plan-price"><strong>{rupiah(p.price)}</strong> / {p.days === 365 ? 'tahun' : 'bulan'}</p>
                  <p className="muted">{p.key === 'annual' ? `Setara ${rupiah(perMonth)} per bulan.` : 'Fleksibel, bisa berhenti kapan saja.'}</p>
                  <Button variant={p.key === 'annual' ? 'premium' : 'secondary'} block onClick={() => choose(p)}>
                    {isPremium ? 'Perpanjang' : 'Pilih paket'}
                  </Button>
                </article>
              );
            })}
          </div>
        )}
        <p className="notice"><Icon name="alert" size={18} /> Pembayaran di KELIR adalah <strong>simulasi</strong> untuk keperluan proyek. Tidak ada kartu, rekening, atau uang yang diproses.</p>

        {sub.data?.history.length > 0 && (
          <section className="section" aria-labelledby="history">
            <h2 className="t-h3" id="history">Riwayat langganan</h2>
            <table className="table">
              <thead><tr><th>Tanggal</th><th>Keterangan</th><th>Paket</th><th>Jumlah</th><th>Referensi</th></tr></thead>
              <tbody>
                {sub.data.history.map((h) => (
                  <tr key={h.id}>
                    <td>{date(h.createdAt)}</td>
                    <td>{h.kind === 'purchase' ? 'Pembelian (simulasi)' : h.kind === 'cancel' ? 'Perpanjangan dihentikan' : 'Diubah admin'}</td>
                    <td>{h.plan === 'annual' ? 'Tahunan' : h.plan === 'monthly' ? 'Bulanan' : '—'}</td>
                    <td>{h.amount ? rupiah(h.amount) : '—'}</td>
                    <td><code>{h.reference}</code></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}
      </div>

      <Modal
        open={Boolean(chosen)}
        onClose={() => setChosen(null)}
        title={status.receipt ? 'Premium aktif' : 'Konfirmasi pembayaran'}
        footer={status.receipt ? (
          <>
            {back && <Button variant="secondary" to={back}>Kembali ke tontonan</Button>}
            <Button onClick={() => setChosen(null)}>Selesai</Button>
          </>
        ) : (
          <>
            <Button variant="tertiary" onClick={() => setChosen(null)}>Batal</Button>
            <Button variant="premium" disabled={!confirmed} busy={status.busy} onClick={pay}>Bayar {chosen ? rupiah(chosen.price) : ''} (simulasi)</Button>
          </>
        )}
      >
        {status.receipt ? (
          <div className="receipt">
            <span className="receipt-icon"><Icon name="check" size={28} /></span>
            <p>Terima kasih! {chosen?.name} aktif sampai <strong>{date(status.receipt.periodEnd)}</strong>.</p>
            <p className="muted small">Referensi <code>{status.receipt.reference}</code> · Metode {status.receipt.method}</p>
          </div>
        ) : chosen && (
          <div className="stack">
            <dl className="summary">
              <div><dt>Paket</dt><dd>{chosen.name}</dd></div>
              <div><dt>Masa aktif</dt><dd>{chosen.days} hari{isPremium ? ', ditambahkan setelah masa aktif sekarang' : ''}</dd></div>
              <div><dt>Total</dt><dd><strong>{rupiah(chosen.price)}</strong></dd></div>
            </dl>
            <label className="check-row">
              <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} />
              <span>Saya mengerti ini <strong>pembayaran simulasi</strong> dan tidak ada uang yang ditarik.</span>
            </label>
            {status.error && <p className="field-error">{status.error.message}</p>}
          </div>
        )}
      </Modal>
      {!user && <p className="container muted">Sudah punya akun? <Link to="/login" state={{ from: '/premium' }}>Masuk</Link> untuk berlangganan.</p>}
    </div>
  );
}
