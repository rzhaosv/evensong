import React from 'react';
import { View, Text, Pressable, StyleSheet, ViewStyle, TextStyle, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, type } from '../theme';

export function Screen({
  children,
  scroll,
  contentStyle,
  bg,
  edges = ['top'],
}: {
  children: React.ReactNode;
  scroll?: boolean;
  contentStyle?: ViewStyle;
  bg?: string;
  edges?: ('top' | 'bottom')[];
}) {
  return (
    <SafeAreaView style={[styles.safe, bg ? { backgroundColor: bg } : null]} edges={edges}>
      {scroll ? (
        <ScrollView contentContainerStyle={[styles.scroll, contentStyle]} showsVerticalScrollIndicator={false}>
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.body, contentStyle]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

export function Header({
  title,
  onBack,
  right,
  backLabel = '‹ Back',
  color,
}: {
  title?: string;
  onBack?: () => void;
  right?: React.ReactNode;
  backLabel?: string;
  color?: string;
}) {
  return (
    <View style={styles.header}>
      <View style={{ width: 80 }}>
        {onBack && (
          <Pressable onPress={onBack} hitSlop={12}>
            <Text style={[styles.back, color ? { color } : null]}>{backLabel}</Text>
          </Pressable>
        )}
      </View>
      <Text style={[type.h3, { flex: 1, textAlign: 'center' }, color ? { color } : null]} numberOfLines={1}>
        {title ?? ''}
      </Text>
      <View style={{ width: 80, alignItems: 'flex-end' }}>{right}</View>
    </View>
  );
}

export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Eyebrow({ children, color, style }: { children: React.ReactNode; color?: string; style?: TextStyle }) {
  return <Text style={[type.eyebrow, color ? { color } : null, style]}>{children}</Text>;
}

export function PrimaryButton({
  title,
  onPress,
  loading,
  disabled,
  style,
  color,
  textColor,
}: {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  color?: string;
  textColor?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.primary,
        color ? { backgroundColor: color } : null,
        (disabled || loading) && { opacity: 0.5 },
        pressed && { transform: [{ scale: 0.98 }] },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor ?? colors.onAccent} />
      ) : (
        <Text style={[styles.primaryText, textColor ? { color: textColor } : null]}>{title}</Text>
      )}
    </Pressable>
  );
}

export function SecondaryButton({
  title,
  onPress,
  style,
  disabled,
  color,
  borderColor,
}: {
  title: string;
  onPress: () => void;
  style?: ViewStyle;
  disabled?: boolean;
  color?: string;
  borderColor?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.secondary,
        borderColor ? { borderColor } : null,
        disabled && { opacity: 0.5 },
        pressed && { opacity: 0.7 },
        style,
      ]}
    >
      <Text style={[styles.secondaryText, color ? { color } : null]}>{title}</Text>
    </Pressable>
  );
}

export function GhostButton({ title, onPress, style, color }: { title: string; onPress: () => void; style?: ViewStyle; color?: string }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.ghost, pressed && { opacity: 0.6 }, style]}>
      <Text style={[styles.ghostText, color ? { color } : null]}>{title}</Text>
    </Pressable>
  );
}

export function Chip({ text, selected, onPress, small }: { text: string; selected?: boolean; onPress?: () => void; small?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={[styles.chip, small && { paddingHorizontal: 12, paddingVertical: 7 }, selected && styles.chipActive]}
    >
      <Text style={[styles.chipText, small && { fontSize: 13 }, selected && { color: colors.onAccent }]}>{text}</Text>
    </Pressable>
  );
}

/** Two-way toggle (Morning / Evening). */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  activeColor,
  inactiveText,
  track,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  activeColor?: string;
  inactiveText?: string;
  track?: string;
}) {
  return (
    <View style={[styles.segTrack, track ? { backgroundColor: track } : null]}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            style={[styles.seg, active && { backgroundColor: activeColor ?? colors.accent }]}
          >
            <Text style={[styles.segText, { color: active ? colors.onAccent : inactiveText ?? colors.soft }]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function ProgressDots({ count, index }: { count: number; index: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 6, justifyContent: 'center' }}>
      {Array.from({ length: count }).map((_, i) => (
        <View
          key={i}
          style={{
            width: i === index ? 22 : 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: i <= index ? colors.accent : colors.lineStrong,
          }}
        />
      ))}
    </View>
  );
}

export function ProBadge({ color }: { color?: string }) {
  return (
    <View style={[styles.proBadge, color ? { backgroundColor: color } : null]}>
      <Text style={styles.proBadgeText}>Pro</Text>
    </View>
  );
}

export function StatTile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <View style={styles.tile}>
      <Text style={[type.caption, { marginBottom: 6 }]}>{label}</Text>
      <Text style={[type.num, { fontSize: 22 }]} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      {sub ? <Text style={[type.caption, { marginTop: 2 }]}>{sub}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  body: { flex: 1, paddingHorizontal: 20 },
  scroll: { paddingHorizontal: 20, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  back: { color: colors.accent, fontSize: 17, fontWeight: '600' },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.line,
  },
  primary: {
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  primaryText: { color: colors.onAccent, fontSize: 17, fontWeight: '800', letterSpacing: 0.2 },
  secondary: {
    backgroundColor: 'transparent',
    borderRadius: radius.pill,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    borderWidth: 1.5,
    borderColor: colors.lineStrong,
  },
  secondaryText: { color: colors.ink, fontSize: 15, fontWeight: '700' },
  ghost: { height: 48, alignItems: 'center', justifyContent: 'center' },
  ghostText: { color: colors.soft, fontSize: 15, fontWeight: '600' },
  chip: {
    backgroundColor: colors.surface2,
    borderRadius: radius.pill,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.line,
  },
  chipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipText: { color: colors.ink, fontSize: 14, fontWeight: '700' },
  segTrack: { flexDirection: 'row', backgroundColor: colors.surface2, borderRadius: radius.pill, padding: 3 },
  seg: { flex: 1, height: 36, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  segText: { fontSize: 14, fontWeight: '700' },
  proBadge: { backgroundColor: colors.accent, borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 2 },
  proBadgeText: { color: colors.onAccent, fontSize: 11, fontWeight: '800', letterSpacing: 0.4 },
  tile: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.line,
  },
});
