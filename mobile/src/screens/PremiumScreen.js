import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { api } from '../api';
import { useAuth } from '../AuthContext';
import { DarkScope, useTheme } from '../ThemeContext';
import { font, radius, space } from '../theme';
import { date, rupiah, SUB_LABEL } from '../format';
import { useAsync } from '../hooks';
import Icon from '../components/Icon';
import Logo from '../components/Logo';
import { Badge, Button, Checkbox, Panel, Sheet, StateView, T } from '../components/ui';

const BENEFITS = [
  ['film', 'Semua film dan serial Premium', 'Termasuk seluruh episode serial.'],
  ['sparkle', 'Konten eksklusif bila tersedia', 'Tayangan pilihan yang hanya ada di KELIR.'],
  ['eye', 'Kualitas video lebih tinggi', 'Bila sumber videonya mendukung.'],
  ['check', 'Tanpa iklan', 'Untuk konten Premium yang berlaku.'],
];

function Hero() {
  const { c } = useTheme();
  const { user } = useAuth();
  return (
    <View style={{ backgroundColor: c.bg, padding: space[4], paddingVertical: space[8], gap: 12 }}>
      <Logo variant="mark" size={56} ink={c.cream} window={c.ink} />
      <Badge tone="premium" icon="sparkle">KELIR Premium</Badge>
      <T variant="display">Semua cerita, tanpa kunci.</T>
      <T variant="bodyL" color={c.text2}>Tonton film dan serial Premium dari seluruh Nusantara dan dunia. Berhenti kapan saja.</T>
      {user ? <T color={c.text2}>Status akunmu: <Text style={{ fontFamily: font.bold, color: c.text }}>{SUB_LABEL[user.subscription.status]}</Text>{user.subscription.expiresAt && ['ACTIVE', 'CANCELLED'].includes(user.subscription.status) ? ` sampai ${date(user.subscription.expiresAt)}` : ''}</T> : null}
    </View>
  );
}

export default function PremiumScreen({ navigation }) {
  const { c } = useTheme();
  const { user, setUser, isPremium } = useAuth();
  const plans = useAsync(() => api.plans(), []);
  const history = useAsync(() => (user ? api.subscription() : Promise.resolve(null)), [user?.subscription?.expiresAt, user?.subscription?.status]);
  const [chosen, setChosen] = useState(null);
  const [confirmed, setConfirmed] = useState(false);
  const [status, setStatus] = useState({ busy: false, error: null, receipt: null });
  const choose = (p) => {
    if (!user) return navigation.navigate('Login');
    setChosen(p);
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
  const monthly = plans.data?.plans.find((p) => p.key === 'monthly');
  return (
    <ScrollView style={{ backgroundColor: c.bg }} contentContainerStyle={{ paddingBottom: space[12] }}>
      <DarkScope><Hero /></DarkScope>
      <View style={{ padding: space[4], gap: space[4] }}>
        {BENEFITS.map(([icon, title, text]) => (
          <View key={title} style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
            <View style={{ width: 40, height: 40, borderTopLeftRadius: 20, borderTopRightRadius: 20, borderBottomLeftRadius: 10, borderBottomRightRadius: 10, backgroundColor: c.softLavender, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name={icon} size={20} color={c.ink} />
            </View>
            <View style={{ flex: 1 }}>
              <T style={{ fontFamily: font.bold }}>{title}</T>
              <T variant="caption" color={c.text2}>{text}</T>
            </View>
          </View>
        ))}
        <T variant="h2" style={{ marginTop: space[4] }}>Pilih paket</T>
        {!plans.data ? <StateView loading={plans.loading} error={plans.error} /> : plans.data.plans.map((p) => {
          const best = p.key === 'annual';
          const saving = best && monthly ? Math.round((1 - p.price / (monthly.price * 12)) * 100) : 0;
          return (
            <View key={p.key} style={{ borderRadius: radius.xl, borderWidth: 2, borderColor: best ? c.mango : c.border, backgroundColor: c.surface, padding: space[4], gap: 6 }}>
              {saving ? <Badge tone="budaya">Hemat {saving}%</Badge> : null}
              <T variant="h3">{p.name}</T>
              <T><Text style={{ fontFamily: font.extrabold, fontSize: 28, color: c.text }}>{rupiah(p.price)}</Text> / {p.days === 365 ? 'tahun' : 'bulan'}</T>
              <T variant="caption" color={c.text2}>{best ? `Setara ${rupiah(Math.round(p.price / 12))} per bulan.` : 'Fleksibel, bisa berhenti kapan saja.'}</T>
              <Button title={isPremium ? 'Perpanjang' : 'Pilih paket'} variant={best ? 'premium' : 'secondary'} block onPress={() => choose(p)} style={{ marginTop: 8 }} />
            </View>
          );
        })}
        <View style={{ flexDirection: 'row', gap: 8, padding: 12, borderRadius: radius.lg, backgroundColor: c.softPeach }}>
          <Icon name="alert" size={18} color={c.darkCoral} />
          <T variant="caption" color={c.ink} style={{ flex: 1 }}>Pembayaran di KELIR adalah simulasi untuk keperluan proyek. Tidak ada kartu, rekening, atau uang yang diproses.</T>
        </View>
        {history.data?.history.length ? (
          <Panel>
            <T variant="h3">Riwayat langganan</T>
            {history.data.history.map((h) => (
              <View key={h.id} style={{ gap: 2, paddingBottom: 8, borderBottomWidth: 1, borderColor: c.border }}>
                <T style={{ fontFamily: font.bold }}>{h.kind === 'purchase' ? 'Pembelian (simulasi)' : h.kind === 'cancel' ? 'Perpanjangan dihentikan' : 'Diubah admin'}{h.amount ? ` · ${rupiah(h.amount)}` : ''}</T>
                <T variant="caption" color={c.text2}>{date(h.createdAt)} · {h.reference}</T>
              </View>
            ))}
          </Panel>
        ) : null}
      </View>
      <Sheet
        visible={Boolean(chosen)}
        onClose={() => setChosen(null)}
        title={status.receipt ? 'Premium aktif' : 'Konfirmasi pembayaran'}
        footer={status.receipt ? <Button title="Selesai" onPress={() => { setChosen(null); navigation.goBack(); }} /> : <><Button title="Batal" variant="tertiary" onPress={() => setChosen(null)} /><Button title={`Bayar ${chosen ? rupiah(chosen.price) : ''}`} variant="premium" disabled={!confirmed} busy={status.busy} onPress={pay} /></>}
      >
        {status.receipt ? (
          <View style={{ gap: 8 }}>
            <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: c.paleMint, alignItems: 'center', justifyContent: 'center' }}><Icon name="check" size={26} color={c.success} /></View>
            <T>Terima kasih! {chosen?.name} aktif sampai <Text style={{ fontFamily: font.bold }}>{date(status.receipt.periodEnd)}</Text>.</T>
            <T variant="caption" color={c.text2}>Referensi {status.receipt.reference} · Metode {status.receipt.method}</T>
          </View>
        ) : chosen ? (
          <View style={{ gap: 12 }}>
            <T>{chosen.name} · {chosen.days} hari · <Text style={{ fontFamily: font.bold }}>{rupiah(chosen.price)}</Text></T>
            <Checkbox checked={confirmed} onChange={setConfirmed}>
              <T>Saya mengerti ini <Text style={{ fontFamily: font.bold }}>pembayaran simulasi</Text> dan tidak ada uang yang ditarik.</T>
            </Checkbox>
            {status.error ? <T color={c.error}>{status.error.message}</T> : null}
          </View>
        ) : null}
      </Sheet>
    </ScrollView>
  );
}
