import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { palettes, Period, type } from '../theme';
import { Segmented } from '../components/UI';
import ReadingView from '../components/ReadingView';
import { useApp } from '../store/AppContext';
import { TabProps } from '../navigation';
import { getReading } from '../content';
import { canOpen, dateKey, greeting, periodNow, streak, todayParts } from '../logic';
import { demo } from '../dev/demo';

/**
 * Today: the morning card until 3pm local, the evening card after; both reachable with the toggle.
 * Free users can always read this morning's reading; the evening is Pro.
 */
export default function TodayScreen({ navigation }: TabProps<'Today'>) {
  const { state, isPro, markRead, toggleBookmark } = useApp();
  const [period, setPeriod] = useState<Period>(demo?.period ?? periodNow());
  const { month, day } = todayParts();
  const reading = getReading(month, day, period);
  const pal = palettes[period];
  const locked = !canOpen(reading, isPro);
  const s = streak(state.readIds);
  const examenDone = !!state.examen[dateKey()];

  const header = (
    <View style={styles.header}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <View style={{ flex: 1 }}>
          <Text style={[type.h1, { color: pal.text }]}>{greeting(state.name, period)}</Text>
          <Text style={[type.sub, { color: pal.muted, marginTop: 4 }]}>
            {s > 1 ? `${s} days in a row · ` : ''}
            {period === 'morning' ? 'A verse and a few minutes before the day begins.' : 'A reading and three questions before you sleep.'}
          </Text>
        </View>
      </View>
      <Segmented
        options={[
          { value: 'morning', label: 'Morning' },
          { value: 'evening', label: 'Evening' },
        ]}
        value={period}
        onChange={setPeriod}
        activeColor={pal.accent}
        inactiveText={pal.muted}
        track={period === 'evening' ? 'rgba(244,238,223,0.10)' : undefined}
      />
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: pal.bg }} edges={['top']}>
      <StatusBar style={period === 'evening' ? 'light' : 'dark'} />
      <ReadingView
        key={reading.id}
        reading={reading}
        locked={locked}
        read={!!state.readIds[reading.id]}
        bookmarked={state.bookmarks.includes(reading.id)}
        textSize={isPro ? state.textSize : 'medium'}
        still={!!demo?.snap}
        header={header}
        onMarkRead={() => markRead(reading.id)}
        onBookmark={() => (isPro ? toggleBookmark(reading.id) : navigation.navigate('Paywall'))}
        onUnlock={() => navigation.navigate('Paywall')}
        onExamen={() => navigation.navigate('Examen', { date: dateKey() })}
        examenDone={examenDone}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 6, paddingTop: 8, paddingBottom: 16, gap: 16 },
});
