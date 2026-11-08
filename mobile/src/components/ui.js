import { forwardRef, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from './Icon';
import { useStyles, useTheme } from '../ThemeContext';
import { font, radius, space, type } from '../theme';
import { TYPE_BADGE, TYPE_LABEL } from '../format';

/* ---------- Text ---------- */
export function T({ variant = 'body', color, style, children, ...rest }) {
  const { c } = useTheme();
  return (
    <Text style={[type[variant], { color: color || c.text }, style]} {...rest}>
      {children}
    </Text>
  );
}

/* ---------- Buttons (design system) ---------- */
const BTN = (c) => ({
  primary: { bg: c.primary, fg: c.onPrimary, pressed: c.primaryHover },
  secondary: { bg: c.turquoise, fg: c.ink, pressed: c.turquoiseHover },
  tertiary: { bg: 'transparent', fg: c.text, pressed: c.surface2 },
  premium: { bg: c.mango, fg: c.ink, pressed: c.mangoHover },
});

export function Button({ title, onPress, variant = 'primary', size = 'md', icon, iconRight, busy, disabled, block, style, accessibilityLabel }) {
  const { c } = useTheme();
  const v = BTN(c)[variant];
  const h = size === 'sm' ? 36 : size === 'lg' ? 56 : 48;
  const fs = size === 'sm' ? 14 : size === 'lg' ? 18 : 16;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || busy}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
      accessibilityState={{ disabled: disabled || busy, busy }}
      style={({ pressed }) => [
        { height: h, paddingHorizontal: size === 'sm' ? 16 : 24, borderRadius: size === 'lg' ? radius.lg : radius.md, backgroundColor: pressed ? v.pressed : v.bg, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: disabled ? 0.5 : 1 },
        block && { alignSelf: 'stretch' },
        style,
      ]}
    >
      {busy ? <ActivityIndicator color={v.fg} /> : icon ? <Icon name={icon} size={fs + 4} color={v.fg} /> : null}
      {title ? <Text style={{ fontFamily: font.bold, fontSize: fs, color: v.fg }}>{title}</Text> : null}
      {iconRight ? <Icon name={iconRight} size={fs + 4} color={v.fg} /> : null}
    </Pressable>
  );
}

export function IconButton({ icon, label, onPress, color, size = 22, style, filled }) {
  const { c } = useTheme();
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} hitSlop={6} style={({ pressed }) => [{ width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: pressed ? c.surface2 : 'transparent' }, style]}>
      <Icon name={icon} size={size} color={color || c.text} filled={filled} />
    </Pressable>
  );
}

/* ---------- Badges ---------- */
export function Badge({ tone = 'neutral', icon, children, style }) {
  const { c } = useTheme();
  const bg = { neutral: c.surface2, film: c.coral, musik: c.lilac, dokumenter: c.turquoise, budaya: c.mango, serial: c.softPeach, premium: c.premiumBg }[tone];
  const fg = tone === 'premium' ? c.premiumFg : tone === 'neutral' ? c.text : c.ink;
  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center', gap: 4, height: 24, paddingHorizontal: 8, borderRadius: 999, backgroundColor: bg, alignSelf: 'flex-start' }, style]}>
      {icon ? <Icon name={icon} size={13} color={fg} /> : null}
      <Text style={[type.label, { color: fg }]}>{children}</Text>
    </View>
  );
}
export const TypeBadge = ({ type: t, style }) => <Badge tone={TYPE_BADGE[t]} style={style}>{TYPE_LABEL[t]}</Badge>;

/* ---------- Chips and tabs ---------- */
export function Chips({ options, value, onChange, multiple = false, scroll = false, label }) {
  const { c } = useTheme();
  const on = (v) => (multiple ? value.includes(v) : value === v);
  const toggle = (v) => (multiple ? onChange(on(v) ? value.filter((x) => x !== v) : [...value, v]) : onChange(value === v ? '' : v));
  const items = options.map((o) => {
    const active = on(o.value);
    return (
      <Pressable
        key={o.value}
        onPress={() => toggle(o.value)}
        accessibilityRole="button"
        accessibilityState={{ selected: active }}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 36, paddingHorizontal: 14, borderRadius: 999, borderWidth: 2, borderColor: active ? c.text : c.border, backgroundColor: active ? c.text : c.surface }}
      >
        {o.icon ? <Icon name={o.icon} size={15} color={active ? c.bg : c.text} /> : null}
        <Text style={{ fontFamily: font.semibold, fontSize: 14, color: active ? c.bg : c.text }}>{o.label}</Text>
        {o.count != null ? <Text style={{ fontFamily: font.bold, fontSize: 12, color: active ? c.bg : c.text2 }}>{o.count}</Text> : null}
      </Pressable>
    );
  });
  if (scroll) {
    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: space[4] }} accessibilityLabel={label}>
        {items}
      </ScrollView>
    );
  }
  return <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }} accessibilityLabel={label}>{items}</View>;
}

export function Tabs({ tabs, value, onChange }) {
  const { c } = useTheme();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: space[4], gap: 4 }} style={{ borderBottomWidth: 1, borderColor: c.border, flexGrow: 0 }}>
      {tabs.map((t) => {
        const active = value === t.value;
        return (
          <Pressable key={t.value} onPress={() => onChange(t.value)} accessibilityRole="tab" accessibilityState={{ selected: active }} style={{ height: 44, paddingHorizontal: 12, justifyContent: 'center', borderBottomWidth: 3, borderColor: active ? c.primary : 'transparent', flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={{ fontFamily: font.bold, fontSize: 15, color: active ? c.text : c.text2 }}>{t.label}</Text>
            {t.count != null ? <Text style={{ fontFamily: font.bold, fontSize: 12, color: c.text2 }}>{t.count}</Text> : null}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

/* ---------- Fields ---------- */
export const TextField = forwardRef(function TextField({ label, hint, error, icon, style, multiline, ...rest }, ref) {
  const { c } = useTheme();
  const [focused, setFocused] = useState(false);
  return (
    <View style={[{ gap: 8 }, style]}>
      {label ? <Text style={{ fontFamily: font.bold, fontSize: 13, color: c.text }}>{label}</Text> : null}
      <View style={{ flexDirection: 'row', alignItems: 'center', minHeight: 48, borderRadius: radius.md, borderWidth: 2, borderColor: error ? c.error : focused ? c.focus : c.borderStrong, backgroundColor: c.surface, paddingHorizontal: 16, gap: 8 }}>
        {icon ? <Icon name={icon} size={20} color={c.text2} /> : null}
        <TextInput
          ref={ref}
          placeholderTextColor={c.text2}
          onFocus={() => setFocused(true)}
          onBlur={(e) => {
            setFocused(false);
            rest.onBlur?.(e);
          }}
          multiline={multiline}
          accessibilityLabel={label}
          style={{ flex: 1, fontFamily: font.regular, fontSize: 16, color: c.text, paddingVertical: multiline ? 10 : 0, minHeight: multiline ? 88 : 44, textAlignVertical: multiline ? 'top' : 'center' }}
          {...rest}
        />
      </View>
      {error || hint ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          {error ? <Icon name="alert" size={15} color={c.error} /> : null}
          <Text style={[type.caption, { color: error ? c.error : c.text2, flex: 1 }]}>{error || hint}</Text>
        </View>
      ) : null}
    </View>
  );
});

/* ---------- Stars ---------- */
export function Stars({ value = 0, size = 14 }) {
  const { c } = useTheme();
  const n = Math.round(value);
  return (
    <View style={{ flexDirection: 'row', gap: 1 }} accessibilityLabel={`Rating ${value} dari 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Icon key={i} name="star" size={size} filled={i <= n} color={i <= n ? c.highlight : c.borderStrong} />
      ))}
    </View>
  );
}
export function StarInput({ value, onChange }) {
  const { c } = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: 4 }} accessibilityRole="adjustable" accessibilityLabel={`Rating ${value || 0} dari 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Pressable key={i} onPress={() => onChange(i)} hitSlop={4} accessibilityRole="button" accessibilityLabel={`${i} bintang`}>
          <Icon name="star" size={34} filled={i <= value} color={i <= value ? c.highlight : c.borderStrong} />
        </Pressable>
      ))}
    </View>
  );
}

/* ---------- Avatar ---------- */
export const AVATAR_TONES = ['coral', 'mango', 'turquoise', 'lilac', 'ink', 'peach', 'mint', 'lavender'];
export function Avatar({ user, size = 40 }) {
  const { c } = useTheme();
  const bg = { coral: c.coral, mango: c.mango, turquoise: c.turquoise, lilac: c.lilac, ink: c.ink, peach: c.softPeach, mint: c.paleMint, lavender: c.softLavender }[user?.avatar || 'coral'];
  const initials = (user?.name || '?').split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
  return (
    <View style={{ width: size, height: size, borderTopLeftRadius: size / 2, borderTopRightRadius: size / 2, borderBottomRightRadius: size / 2, borderBottomLeftRadius: size * 0.16, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontFamily: font.extrabold, fontSize: size * 0.38, color: user?.avatar === 'ink' ? c.cream : c.ink }}>{initials}</Text>
    </View>
  );
}

/* ---------- Layout ---------- */
export function SectionHeader({ title, subtitle, action, onAction }) {
  const { c } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingHorizontal: space[4], marginBottom: space[4], gap: 8 }}>
      <View style={{ flex: 1 }}>
        <T variant="h2" accessibilityRole="header">{title}</T>
        {subtitle ? <T variant="caption" color={c.text2} style={{ marginTop: 2 }}>{subtitle}</T> : null}
      </View>
      {action ? <Button title={action} variant="tertiary" size="sm" iconRight="chevron-right" onPress={onAction} style={{ paddingHorizontal: 8 }} /> : null}
    </View>
  );
}

export function StateView({ loading, error, onRetry, empty, emptyIcon = 'sparkle', emptyTitle, emptyText, action }) {
  const { c } = useTheme();
  if (loading) {
    return (
      <View style={{ padding: 48, alignItems: 'center', gap: 12 }} accessibilityRole="progressbar">
        <ActivityIndicator color={c.primary} size="large" />
        <T variant="caption" color={c.text2}>Memuat…</T>
      </View>
    );
  }
  if (error) {
    return (
      <View style={{ padding: 32, alignItems: 'center', gap: 12 }}>
        <Icon name="alert" size={28} color={c.error} />
        <T color={c.error} style={{ textAlign: 'center' }}>{error.message}</T>
        {onRetry ? <Button title="Coba lagi" variant="secondary" size="sm" icon="replay" onPress={onRetry} /> : null}
      </View>
    );
  }
  if (empty) {
    return (
      <View style={{ margin: space[4], padding: 32, alignItems: 'center', gap: 12, borderWidth: 2, borderStyle: 'dashed', borderColor: c.border, borderRadius: radius.xl }}>
        <View style={{ width: 64, height: 64, borderTopLeftRadius: 32, borderTopRightRadius: 32, borderBottomLeftRadius: 12, borderBottomRightRadius: 12, backgroundColor: c.softLavender, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name={emptyIcon} size={28} color={c.ink} />
        </View>
        <T variant="h3" style={{ textAlign: 'center' }}>{emptyTitle}</T>
        {emptyText ? <T color={c.text2} style={{ textAlign: 'center' }}>{emptyText}</T> : null}
        {action}
      </View>
    );
  }
  return null;
}

/** Bottom sheet on top of RN Modal. */
export function Sheet({ visible, onClose, title, children, footer }) {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Tutup">
        <View style={{ flex: 1, backgroundColor: 'rgba(25,25,39,0.6)' }} />
      </Pressable>
      <View style={{ marginTop: 'auto', maxHeight: '88%', backgroundColor: c.surface, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, paddingBottom: insets.bottom + 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingLeft: 24, paddingRight: 8, paddingTop: 8 }}>
          <T variant="h3" accessibilityRole="header">{title}</T>
          <IconButton icon="close" label="Tutup" onPress={onClose} />
        </View>
        <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 8, gap: 16 }} keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
        {footer ? <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8, paddingHorizontal: 24, paddingTop: 12, borderTopWidth: 1, borderColor: c.border }}>{footer}</View> : null}
      </View>
    </Modal>
  );
}

export function Panel({ children, style }) {
  const s = useStyles(panelStyles);
  return <View style={[s.panel, style]}>{children}</View>;
}
const panelStyles = (c) => StyleSheet.create({ panel: { backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, borderRadius: radius.xl, padding: space[4], gap: space[4] } });

export function Checkbox({ checked, onChange, children }) {
  const { c } = useTheme();
  return (
    <Pressable onPress={() => onChange(!checked)} accessibilityRole="checkbox" accessibilityState={{ checked }} style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
      <View style={{ width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: checked ? c.primary : c.borderStrong, backgroundColor: checked ? c.primary : c.surface, alignItems: 'center', justifyContent: 'center', marginTop: 1 }}>
        {checked ? <Icon name="check" size={16} color={c.onPrimary} strokeWidth={3} /> : null}
      </View>
      <View style={{ flex: 1 }}>{children}</View>
    </Pressable>
  );
}
