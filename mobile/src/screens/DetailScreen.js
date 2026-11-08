import { useEffect, useLayoutEffect, useState } from 'react';
import { Linking, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { api } from '../api';
import { useAuth } from '../AuthContext';
import { useTheme } from '../ThemeContext';
import { font, radius, space, type } from '../theme';
import { date, duration, metaLine, rating, REGIONS, remaining } from '../format';
import { useAsync, useReloadOnFocus } from '../hooks';
import Artwork from '../components/Artwork';
import Icon from '../components/Icon';
import { Rail } from '../components/Cards';
import LibraryActions from '../components/LibraryActions';
import TrailerView from '../components/TrailerView';
import { Avatar, Badge, Button, Panel, StarInput, Stars, StateView, T, TextField, TypeBadge } from '../components/ui';

const CREATOR = { film: 'Sutradara', series: 'Kreator', documentary: 'Sutradara', music: 'Artis' };

function PlayActions({ content, me, navigation }) {
  const { user, isPremium } = useAuth();
  const verb = content.type === 'music' ? 'Dengarkan' : 'Tonton';
  if (!content.playable) return null;
  if (!user) return <Button title={`Masuk untuk ${verb.toLowerCase()}`} icon="play" size="lg" block onPress={() => navigation.navigate('Login')} />;
  if (content.access === 'premium' && !isPremium) {
    const free = content.episodes.find((e) => e.access === 'free');
    return (
      <View style={{ gap: 8 }}>
        {free ? <Button title={`Tonton Episode ${free.number} gratis`} icon="play" size="lg" block onPress={() => navigation.navigate('Player', { slug: content.slug, episode: free.number })} /> : null}
        <Button title="Buka dengan Premium" icon="lock" variant="premium" size="lg" block onPress={() => navigation.navigate('Premium')} />
      </View>
    );
  }
  const p = me?.progress;
  if (p && !p.completed) {
    return <Button title={`Lanjutkan${p.episode ? ` Ep. ${p.episode}` : ''} · ${remaining(p.remainingSeconds)}`} icon="play" size="lg" block onPress={() => navigation.navigate('Player', { slug: content.slug, episode: p.episode || undefined })} />;
  }
  return <Button title={content.episodes.length ? `${verb} Episode 1` : `${verb} Sekarang`} icon="play" size="lg" block onPress={() => navigation.navigate('Player', { slug: content.slug })} />;
}

function Reviews({ content, me, onChanged }) {
  const { c } = useTheme();
  const { user } = useAuth();
  const list = useAsync(() => api.reviews(content.slug), [content.slug, me?.review?.updatedAt]);
  const [form, setForm] = useState({ rating: me?.review?.rating || 0, comment: me?.review?.comment || '' });
  const [status, setStatus] = useState({ busy: false, error: null, saved: false });
  useEffect(() => {
    setForm({ rating: me?.review?.rating || 0, comment: me?.review?.comment || '' });
  }, [me?.review]);
  const save = async () => {
    if (!form.rating) return setStatus({ busy: false, error: 'Pilih 1 sampai 5 bintang dulu.', saved: false });
    setStatus({ busy: true, error: null, saved: false });
    try {
      await api.saveReview(content.slug, form);
      setStatus({ busy: false, error: null, saved: true });
      onChanged();
    } catch (err) {
      setStatus({ busy: false, error: err.message, saved: false });
    }
  };
  const remove = async () => {
    await api.deleteReview(content.slug);
    onChanged();
  };
  return (
    <View style={{ gap: space[4] }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <T variant="h2" accessibilityRole="header">Ulasan</T>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={{ fontFamily: font.extrabold, fontSize: 22, color: c.text }}>{content.ratingCount ? rating(content.ratingAvg) : '–'}</Text>
          <Stars value={content.ratingAvg} />
          <T variant="caption" color={c.text2}>{content.ratingCount}</T>
        </View>
      </View>
      {user ? (
        <Panel>
          <T variant="label">{me?.review ? 'Ulasanmu' : 'Beri rating dan ulasan'}</T>
          <StarInput value={form.rating} onChange={(r) => setForm((f) => ({ ...f, rating: r }))} />
          <TextField multiline maxLength={1000} placeholder="Apa yang paling kamu ingat? (opsional)" value={form.comment} onChangeText={(t) => setForm((f) => ({ ...f, comment: t }))} accessibilityLabel="Ulasan" />
          {status.error ? <T variant="caption" color={c.error}>{status.error}</T> : null}
          {status.saved ? <T variant="caption" color={c.success}>Tersimpan</T> : null}
          <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
            <Button title={me?.review ? 'Simpan perubahan' : 'Kirim ulasan'} busy={status.busy} onPress={save} />
            {me?.review ? <Button title="Hapus" variant="tertiary" icon="trash" onPress={remove} /> : null}
          </View>
        </Panel>
      ) : (
        <T color={c.text2}>Masuk untuk memberi rating dan ulasan.</T>
      )}
      {list.data?.items.map((r) => (
        <View key={r.id} style={{ flexDirection: 'row', gap: 12 }}>
          <Avatar user={r.user} size={36} />
          <View style={{ flex: 1, gap: 2 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <T style={{ fontFamily: font.bold }}>{r.user.name}</T>
              <Stars value={r.rating} size={12} />
            </View>
            <T variant="caption" color={c.text2}>{date(r.updatedAt)}</T>
            {r.comment ? <T>{r.comment}</T> : null}
          </View>
        </View>
      ))}
      {list.data && !list.data.items.length ? <T color={c.text2}>Belum ada ulasan. Jadilah yang pertama.</T> : null}
    </View>
  );
}

export default function DetailScreen({ route, navigation }) {
  const { c } = useTheme();
  const { width } = useWindowDimensions();
  const { user, isPremium } = useAuth();
  const { slug } = route.params;
  const detail = useAsync(() => api.content(slug), [slug, user?.id, isPremium]);
  const related = useAsync(() => api.related(slug), [slug]);
  useReloadOnFocus(detail.reload);
  useLayoutEffect(() => {
    navigation.setOptions({ title: detail.data?.content.title || route.params.title || '' });
  }, [navigation, detail.data, route.params.title]);

  if (!detail.data) return <View style={{ flex: 1, backgroundColor: c.bg }}><StateView loading={detail.loading} error={detail.error} onRetry={detail.reload} /></View>;
  const { content, me } = detail.data;
  const shape = content.type === 'music' ? 'square' : 'poster';
  const region = REGIONS.find((r) => r.key === content.region);
  const tint = region ? { coral: c.softPeach, mango: c.warmSand, turquoise: c.paleMint, lilac: c.softLavender }[region.art] : null;
  const facts = [
    ['Tahun', content.year ?? 'Tradisional'],
    [content.episodes.length ? 'Episode' : 'Durasi', content.episodes.length ? `${content.episodes.length} episode` : duration(content.durationMinutes)],
    ['Bahasa', content.language],
    ['Negara', content.country],
    ['Jaringan', content.network],
    ['Album', content.album],
    ['Genre', content.genres.join(', ')],
  ].filter(([, v]) => v);

  return (
    <ScrollView style={{ backgroundColor: c.bg }} contentContainerStyle={{ paddingBottom: space[12] }}>
      <View style={{ backgroundColor: c.surface, padding: space[4], gap: space[4], borderBottomWidth: 1, borderColor: c.border }}>
        <View style={{ flexDirection: 'row', gap: space[4] }}>
          <Artwork content={content} shape={shape} width={shape === 'square' ? 128 : 120} />
          <View style={{ flex: 1, gap: 8 }}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              <TypeBadge type={content.type} />
              {content.categories.includes('budaya') ? <Badge tone="budaya">Budaya</Badge> : null}
              {content.access === 'premium' ? <Badge tone="premium" icon="lock">Premium</Badge> : <Badge>Gratis</Badge>}
            </View>
            <T variant="h1" accessibilityRole="header">{content.title}</T>
            {content.originalTitle ? <T variant="caption" color={c.text2} style={{ fontStyle: 'italic' }}>{content.originalTitle}</T> : null}
            <T variant="caption" color={c.text2}>{metaLine(content)}</T>
            {content.ratingCount ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Icon name="star" size={15} filled color={c.highlight} />
                <T variant="caption">{rating(content.ratingAvg)} ({content.ratingCount} ulasan)</T>
              </View>
            ) : null}
          </View>
        </View>
        <T variant="caption">{CREATOR[content.type]}: <Text style={{ fontFamily: font.bold }}>{content.creator}</Text></T>
        <T variant="bodyL">{content.synopsis}</T>
        <PlayActions content={content} me={me} navigation={navigation} />
        <LibraryActions content={content} />
        {content.officialWatch ? (
          <Text onPress={() => Linking.openURL(content.officialWatch.url)} accessibilityRole="link" style={{ fontFamily: font.bold, color: c.secondary }}>
            ↗ {content.officialWatch.label}
          </Text>
        ) : null}
      </View>

      <View style={{ padding: space[4], gap: space[8] }}>
        {content.episodes.length ? (
          <View style={{ gap: 8 }}>
            <T variant="h2" accessibilityRole="header">Episode</T>
            {content.episodes.map((e) => {
              const locked = e.access === 'premium' && !isPremium;
              return (
                <View key={`${e.season}-${e.number}`} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: radius.lg, borderWidth: 1, borderColor: c.border, backgroundColor: c.surface }}>
                  <Text style={{ fontFamily: font.extrabold, fontSize: 24, color: c.primary, width: 28, textAlign: 'center' }}>{e.number}</Text>
                  <View style={{ flex: 1 }}>
                    <T style={{ fontFamily: font.bold }}>{e.title}</T>
                    <T variant="caption" color={c.text2}>Musim {e.season}{e.durationMinutes ? ` · ${duration(e.durationMinutes)}` : ''} · {e.access === 'free' ? 'Gratis' : 'Premium'}</T>
                  </View>
                  {locked ? (
                    <Button title="Buka" variant="premium" size="sm" icon="lock" onPress={() => navigation.navigate('Premium')} />
                  ) : (
                    <Button title="Putar" variant="secondary" size="sm" icon="play" accessibilityLabel={`Putar episode ${e.number}`} onPress={() => (user ? navigation.navigate('Player', { slug: content.slug, episode: e.number }) : navigation.navigate('Login'))} />
                  )}
                </View>
              );
            })}
          </View>
        ) : null}

        <View style={{ gap: 8 }}>
          <T variant="h2" accessibilityRole="header">{content.type === 'music' ? 'Video' : 'Trailer'}</T>
          <TrailerView content={content} width={width - space[4] * 2} />
        </View>

        {region ? (
          <View style={{ backgroundColor: tint, borderRadius: radius.xl, padding: space[4], gap: 6 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Icon name="map-pin" size={15} color={c.ink} />
              <T variant="label" color={c.ink}>ASAL DAERAH</T>
            </View>
            <T variant="h2" color={c.ink}>{content.regionName}</T>
            {content.regionDetail && content.regionDetail !== content.regionName ? <T color={c.ink} style={{ fontFamily: font.bold }}>{content.regionDetail}</T> : null}
            <T variant="caption" color={c.ink}>Dasar: {content.regionBasis}</T>
            <Button title={`Cerita lain dari ${content.regionName}`} variant="tertiary" size="sm" iconRight="chevron-right" style={{ alignSelf: 'flex-start', paddingHorizontal: 0 }} onPress={() => navigation.navigate('Tabs', { screen: 'Explore', params: { region: content.region } })} />
          </View>
        ) : null}

        <Panel>
          {facts.map(([k, v]) => (
            <View key={k} style={{ flexDirection: 'row', gap: 12 }}>
              <T variant="caption" color={c.text2} style={{ width: 80 }}>{k}</T>
              <T style={{ flex: 1, fontFamily: font.semibold }}>{v}</T>
            </View>
          ))}
          {content.cast.length ? (
            <View style={{ gap: 8 }}>
              <T variant="label">Pemeran</T>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                {content.cast.map((name) => <Badge key={name}>{name}</Badge>)}
              </View>
            </View>
          ) : null}
        </Panel>

        <Reviews content={content} me={me} onChanged={detail.reload} />
      </View>

      {related.data?.items.length ? (
        <View style={{ gap: space[4] }}>
          <T variant="h2" style={{ paddingHorizontal: space[4] }}>Mungkin kamu suka</T>
          <Rail items={related.data.items} />
        </View>
      ) : null}
    </ScrollView>
  );
}
