import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Screen, Eyebrow, StatTile, ProBadge } from '../components/UI';
import { colors, radius, type } from '../theme';
import { useApp } from '../store/AppContext';
import { TabProps } from '../navigation';
import { MONTH_DAYS, MONTH_NAMES, TOTAL_DAYS } from '../content';
import { canOpenDay, dayRead, isFuture, isToday, readCount, streak } from '../logic';

const DOT = 18;
const GAP = 6;

/** 366 dots, one per day of the book; filled as you read. Tap a day to open it (Pro beyond today). */
export default function YearScreen({ navigation }: TabProps<'Year'>) {
  const { state, isPro } = useApp();
  const total = readCount(state);
  const daysTouched = MONTH_DAYS.reduce((acc, n, mi) => {
    let c = 0;
    for (let d = 1; d <= n; d++) if (dayRead(state, mi + 1, d) > 0) c++;
    return acc + c;
  }, 0);

  const open = (month: number, day: number) => {
    if (!canOpenDay(month, day, isPro)) return navigation.navigate('Paywall');
    navigation.navigate('Reading', { month, day, period: isToday(month, day) ? undefined : 'morning' });
  };

  return (
    <Screen scroll>
      <View style={{ paddingTop: 8 }}>
        <Eyebrow>The year</Eyebrow>
        <Text style={[type.h1, { marginTop: 6 }]}>366 mornings, 366 evenings</Text>
        <Text style={[type.bodySoft, { marginTop: 4 }]}>Each dot is a day. Half-filled means one reading, full means both.</Text>
      </View>

      <View style={{ flexDirection: 'row', gap: 10, marginTop: 18 }}>
        <StatTile label="Days read" value={`${daysTouched}`} sub={`of ${TOTAL_DAYS}`} />
        <StatTile label="Readings" value={`${total}`} sub={`of ${TOTAL_DAYS * 2}`} />
        <StatTile label="In a row" value={`${streak(state.readIds)}`} sub={`best ${state.longestStreak}`} />
      </View>

      {!isPro && (
        <View style={styles.proNote}>
          <ProBadge />
          <Text style={[type.sub, { flex: 1 }]}>Today is open. The rest of the year opens with Evensong Pro.</Text>
        </View>
      )}

      {MONTH_NAMES.map((name, mi) => {
        const month = mi + 1;
        return (
          <View key={name} style={styles.month}>
            <Text style={[type.h3, { fontFamily: type.h2.fontFamily, marginBottom: 8 }]}>{name}</Text>
            <View style={styles.grid}>
              {Array.from({ length: MONTH_DAYS[mi] }).map((_, di) => {
                const day = di + 1;
                const r = dayRead(state, month, day);
                const today = isToday(month, day);
                const future = isFuture(month, day);
                const openable = canOpenDay(month, day, isPro);
                return (
                  <Pressable
                    key={day}
                    onPress={() => open(month, day)}
                    hitSlop={2}
                    style={[
                      styles.dot,
                      r === 2 && styles.dotFull,
                      r === 1 && styles.dotHalf,
                      future && r === 0 && { opacity: 0.45 },
                      today && styles.dotToday,
                      !openable && r === 0 && !today && { opacity: 0.3 },
                    ]}
                  >
                    {r === 1 && <View style={styles.half} />}
                  </Pressable>
                );
              })}
            </View>
          </View>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  proNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 14,
    backgroundColor: colors.accentSoft,
    borderRadius: radius.md,
    padding: 12,
  },
  month: { marginTop: 22 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: GAP },
  dot: {
    width: DOT,
    height: DOT,
    borderRadius: DOT / 2,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    overflow: 'hidden',
  },
  dotFull: { backgroundColor: colors.accent, borderColor: colors.accent },
  dotHalf: { borderColor: colors.accent },
  half: { position: 'absolute', left: 0, top: 0, bottom: 0, width: DOT / 2, backgroundColor: colors.accent },
  dotToday: { borderWidth: 2.5, borderColor: colors.ink },
});
