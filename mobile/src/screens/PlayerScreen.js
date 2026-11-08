import { useEffect, useRef, useState } from 'react';
import { ScrollView, View, useWindowDimensions } from 'react-native';
import { useEvent } from 'expo';
import { useVideoPlayer, VideoView } from 'expo-video';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '../api';
import { useAuth } from '../AuthContext';
import { DarkScope, useTheme } from '../ThemeContext';
import { radius, space } from '../theme';
import { clock, rupiah } from '../format';
import Icon from '../components/Icon';
import { Button, IconButton, StateView, T } from '../components/ui';

const SAVE_EVERY_MS = 10000;

function Gate({ error, navigation, slug }) {
  const { c } = useTheme();
  const premium = error.code === 'PREMIUM_REQUIRED';
  return (
    <View style={{ margin: space[4], padding: space[6], borderRadius: radius.xl, backgroundColor: c.surface, gap: space[4] }}>
      <View style={{ width: 64, height: 64, borderTopLeftRadius: 32, borderTopRightRadius: 32, borderBottomLeftRadius: 14, borderBottomRightRadius: 14, backgroundColor: c.mango, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={premium ? 'lock' : 'profile'} size={28} color={c.ink} />
      </View>
      <T variant="h1">{premium ? 'Konten ini khusus Premium' : 'Masuk dulu, yuk'}</T>
      <T variant="bodyL" color={c.text2}>
        {premium ? `Langganan KELIR Premium mulai ${rupiah(49000)} per bulan untuk menonton semua film dan serial Premium.` : 'Akun gratis sudah cukup untuk menonton semua konten bertanda Gratis.'}
      </T>
      {premium ? <Button title="Lihat paket Premium" variant="premium" icon="sparkle" size="lg" onPress={() => navigation.replace('Premium')} /> : <Button title="Masuk" size="lg" onPress={() => navigation.replace('Login')} />}
      <Button title="Kembali ke detail" variant="tertiary" onPress={() => navigation.goBack()} />
    </View>
  );
}

function Player({ data, navigation }) {
  const { c } = useTheme();
  const { width } = useWindowDimensions();
  const { user } = useAuth();
  const viewRef = useRef(null);
  const usedFallback = useRef(false);
  const resumed = useRef(false);
  const lastSaved = useRef(0);
  const [fallback, setFallback] = useState(false);
  const { content, episode, nextEpisode, source, resumeAt } = data;

  const player = useVideoPlayer({ uri: source.src }, (p) => {
    p.timeUpdateEventInterval = 1;
    p.play();
  });
  const { status } = useEvent(player, 'statusChange', { status: player.status });
  const { isPlaying } = useEvent(player, 'playingChange', { isPlaying: player.playing });
  const time = useEvent(player, 'timeUpdate', { currentTime: 0 });
  const { muted } = useEvent(player, 'mutedChange', { muted: player.muted });

  // Resume where the user stopped; switch to KELIR's own clip if the CC film cannot load.
  useEffect(() => {
    if (status === 'readyToPlay' && !resumed.current) {
      resumed.current = true;
      if (resumeAt && resumeAt < player.duration - 5) player.currentTime = resumeAt;
    }
    if (status === 'error' && !usedFallback.current && source.fallbackSrc) {
      usedFallback.current = true;
      resumed.current = false;
      setFallback(true);
      player.replace({ uri: source.fallbackSrc });
      player.play();
    }
  }, [status, player, resumeAt, source.fallbackSrc]);

  const save = (force) => {
    const now = Date.now();
    if (!user || !player.duration || (!force && now - lastSaved.current < SAVE_EVERY_MS)) return;
    lastSaved.current = now;
    api.saveProgress(content.id, { episode: episode?.number ?? null, positionSeconds: player.currentTime, durationSeconds: player.duration }).catch(() => {});
  };
  useEffect(() => {
    save(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [time.currentTime]);
  useEffect(() => {
    if (!isPlaying) save(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying]);
  useEffect(() => () => save(true), // save when leaving
  // eslint-disable-next-line react-hooks/exhaustive-deps
  []);

  const height = Math.round((width * 9) / 16);
  return (
    <ScrollView contentContainerStyle={{ paddingBottom: space[12] }}>
      <View style={{ width, height, backgroundColor: '#000' }}>
        <VideoView ref={viewRef} player={player} style={{ width, height }} nativeControls allowsFullscreen allowsPictureInPicture contentFit="contain" />
        {status === 'loading' ? <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }} pointerEvents="none"><StateView loading /></View> : null}
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: space[2], paddingVertical: space[2], borderBottomWidth: 1, borderColor: c.border }}>
        <IconButton icon={isPlaying ? 'pause' : 'play'} label={isPlaying ? 'Jeda' : 'Putar'} onPress={() => (isPlaying ? player.pause() : player.play())} />
        <IconButton icon="replay" label="Mundur 10 detik" onPress={() => player.seekBy(-10)} />
        <IconButton icon={muted ? 'volume-off' : 'volume'} label={muted ? 'Bunyikan' : 'Bisukan'} onPress={() => (player.muted = !player.muted)} />
        <T variant="caption" color={c.text2} style={{ flex: 1 }}>{clock(time.currentTime)} / {clock(player.duration)}</T>
        <IconButton icon="fullscreen" label="Layar penuh" onPress={() => viewRef.current?.enterFullscreen()} />
      </View>
      <View style={{ padding: space[4], gap: space[4] }}>
        <View style={{ gap: 4 }}>
          <T variant="h2" accessibilityRole="header">{content.title}</T>
          {episode ? <T variant="caption" color={c.text2}>Musim {episode.season} · Episode {episode.number}{episode.title !== `Episode ${episode.number}` ? `: ${episode.title}` : ''}</T> : null}
        </View>
        {nextEpisode ? <Button title={`Episode ${nextEpisode}`} icon="skip" variant="secondary" style={{ alignSelf: 'flex-start' }} onPress={() => navigation.replace('Player', { slug: content.slug, episode: nextEpisode })} /> : null}
        <View style={{ flexDirection: 'row', gap: 8, padding: 12, borderRadius: radius.md, backgroundColor: c.surface }}>
          <Icon name="alert" size={18} color={c.warning} />
          <T variant="caption" style={{ flex: 1 }}>
            <T variant="caption" style={{ fontFamily: 'PlusJakartaSans_700Bold' }}>Aset demo, bukan {content.type === 'music' ? 'rekaman' : 'film'} aslinya. </T>
            {fallback ? 'Klip demo KELIR (cadangan karena video utama tidak termuat).' : source.credit}
          </T>
        </View>
        <T variant="caption" color={c.text2}>Posisi tontonan tersimpan otomatis dan muncul di “Lanjutkan Menonton”.</T>
      </View>
    </ScrollView>
  );
}

export default function PlayerScreen({ route, navigation }) {
  const { slug, episode } = route.params;
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [state, setState] = useState({ loading: true, error: null, data: null });
  useEffect(() => {
    let active = true;
    api.play(slug, episode).then((data) => active && setState({ loading: false, error: null, data })).catch((error) => active && setState({ loading: false, error, data: null }));
    return () => {
      active = false;
    };
  }, [slug, episode, user?.id]);

  return (
    <DarkScope>
      <PlayerBody insets={insets} state={state} navigation={navigation} />
    </DarkScope>
  );
}

function PlayerBody({ insets, state, navigation }) {
  const { c } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: c.bg, paddingTop: insets.top }}>
      <StatusBar style="light" />
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: space[2], height: 52 }}>
        <IconButton icon="arrow-left" label="Kembali" onPress={() => navigation.goBack()} />
        <T variant="h3" numberOfLines={1} style={{ flex: 1 }}>{state.data?.content.title || 'Menonton'}</T>
      </View>
      {state.loading ? <StateView loading /> : state.error ? (
        ['PREMIUM_REQUIRED', 'AUTH_REQUIRED'].includes(state.error.code) ? <Gate error={state.error} navigation={navigation} /> : <StateView error={state.error} />
      ) : (
        <Player data={state.data} navigation={navigation} />
      )}
    </View>
  );
}
