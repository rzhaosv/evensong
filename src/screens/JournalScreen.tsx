import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Screen, Card, Eyebrow, PrimaryButton, ProBadge } from '../components/UI';
import { colors, radius, type } from '../theme';
import { useApp } from '../store/AppContext';
import { TabProps } from '../navigation';
import { EXAMEN_SETS, getReadingById, dateLabel, periodLabel } from '../content';
import { dateKey, formatDateKey } from '../logic';

const LABELS = ['Gratitude', 'Fell short', 'For tomorrow'];

/** Past examen entries (newest first) and bookmarked readings. History is Pro; today is free. */
export default function JournalScreen({ navigation }: TabProps<'Journal'>) {
  const { state, isPro } = useApp();
  const today = dateKey();
  const dates = Object.keys(state.examen).sort().reverse();
  const visible = isPro ? dates : dates.filter((d) => d === today);
  const hidden = dates.length - visible.length;
  const bookmarks = [...state.bookmarks].reverse().map((id) => getReadingById(id)).filter((r): r is NonNullable<typeof r> => !!r);

  return (
    <Screen scroll>
      <View style={styles.top}>
        <Eyebrow>Journal</Eyebrow>
        <Text style={[type.h1, { marginTop: 6 }]}>What you have written</Text>
        <Text style={[type.bodySoft, { marginTop: 4 }]}>Evening examens and the readings you kept.</Text>
      </View>

      {visible.length === 0 && (
        <Card style={{ marginTop: 20, alignItems: 'center' }}>
          <Text style={[type.h3, { textAlign: 'center' }]}>Nothing here yet</Text>
          <Text style={[type.bodySoft, { textAlign: 'center', marginTop: 6 }]}>
            Tonight, after the evening reading, answer three short questions. They will be kept here.
          </Text>
          <PrimaryButton title="Tonight’s examen" onPress={() => navigation.navigate('Examen', { date: today })} style={{ marginTop: 14, height: 46, alignSelf: 'stretch' }} />
        </Card>
      )}

      {visible.map((d) => {
        const e = state.examen[d];
        const set = EXAMEN_SETS.find((s) => s.id === e.set) ?? EXAMEN_SETS[0];
        return (
          <Pressable key={d} onPress={() => navigation.navigate('Examen', { date: d })} style={({ pressed }) => [pressed && { opacity: 0.8 }]}>
            <Card style={{ marginTop: 14 }}>
              <Eyebrow>{d === today ? 'Tonight' : formatDateKey(d)}</Eyebrow>
              {e.answers.map((a, i) =>
                a.trim() ? (
                  <View key={i} style={{ marginTop: 12 }}>
                    <Text style={[type.caption, { color: colors.accent, fontWeight: '700' }]}>{LABELS[i]} · {set.questions[i]}</Text>
                    <Text style={[type.reading, { fontSize: 16, lineHeight: 24, marginTop: 4 }]}>{a}</Text>
                  </View>
                ) : null,
              )}
            </Card>
          </Pressable>
        );
      })}

      {!isPro && hidden > 0 && (
        <Card style={{ marginTop: 14, backgroundColor: colors.accentSoft, borderColor: colors.accentSoft }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <ProBadge />
            <Text style={[type.h3, { flex: 1 }]}>{hidden} earlier {hidden === 1 ? 'entry is' : 'entries are'} kept for you</Text>
          </View>
          <Text style={[type.bodySoft, { marginTop: 6 }]}>Your journal history opens with Evensong Pro. Nothing has been deleted.</Text>
          <PrimaryButton title="Start 7-day free trial" onPress={() => navigation.navigate('Paywall')} style={{ marginTop: 14, height: 46 }} />
        </Card>
      )}

      <View style={[styles.top, { marginTop: 32 }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Eyebrow>Bookmarked readings</Eyebrow>
          {!isPro && <ProBadge />}
        </View>
      </View>
      {bookmarks.length === 0 ? (
        <Text style={[type.bodySoft, { marginTop: 10 }]}>
          {isPro ? 'Tap “Bookmark this reading” under any reading to keep it here.' : 'Keep the readings that spoke to you. Bookmarks are part of Evensong Pro.'}
        </Text>
      ) : (
        <View style={styles.group}>
          {bookmarks.map((r, i) => (
            <Pressable
              key={r.id}
              onPress={() => (isPro ? navigation.navigate('Reading', { month: r.month, day: r.day, period: r.period }) : navigation.navigate('Paywall'))}
              style={[styles.row, i === bookmarks.length - 1 && { borderBottomWidth: 0 }]}
            >
              <View style={{ flex: 1 }}>
                <Text style={[type.h3, { fontFamily: type.h2.fontFamily }]}>{r.title}</Text>
                <Text style={[type.caption, { marginTop: 2 }]}>
                  {periodLabel(r.period)} · {dateLabel(r.month, r.day)} · {r.ref}
                </Text>
              </View>
              <Text style={{ color: colors.muted, fontSize: 18 }}>›</Text>
            </Pressable>
          ))}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: { paddingTop: 8 },
  group: { marginTop: 10, backgroundColor: colors.surface, borderRadius: radius.lg, paddingHorizontal: 16, borderWidth: 1, borderColor: colors.line },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
    gap: 10,
  },
});
