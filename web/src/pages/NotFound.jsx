import { EmptyState, Button } from '../components/ui.jsx';
import { useDocumentTitle } from '../lib/hooks.js';

export default function NotFound() {
  useDocumentTitle('Halaman tidak ditemukan');
  return (
    <div className="page container">
      <EmptyState icon="explore" title="Halaman ini tidak ada" action={<Button to="/">Kembali ke Home</Button>}>
        Mungkin tautannya salah ketik. Cerita lain menunggu di Explore.
      </EmptyState>
    </div>
  );
}
