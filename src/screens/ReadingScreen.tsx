import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { palettes, Period, type } from '../theme';
import { Segmented } from '../components/UI';
import ReadingView from '../components/ReadingView';
import { useApp } from '../store/AppContext';
import { ScreenProps } from '../navigation';
import { getReading, dateLabel } from '../content';
import { canOpen, dateKey, isToday } from '../logic';
import { demo } from '../dev/demo';

/** Any day of the year, opened from the calendar or from a bookmark. */
export default function ReadingScreen({ navigation, route }: ScreenProps<'Reading'>) {
  const { month, day } = route.params;
  const { state, isPro, markRead, toggleBookmark } = useApp();
  const [period, setPeriod] = useState<Period>(route.params.period ?? 'morning');
  const reading = getReading(month, day, period);
  const pal = palettes[period];
  const locked = !canOpen(reading, isPro);
  const today = isToday(month, day);

  const header = (
    <View style={styles.header}>
      <View style={styles.row}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
          <Text style={[styles.back, { color: pal.accent }]}>‹ Back</Text>
        </Pressable>
        <Text style={[type.h3, { color: pal.text }]}>{dateLabel(month, day)}</Text>
        <View style={{ width: 60 }} />
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
        onExamen={today ? () => navigation.navigate('Examen', { date: dateKey() }) : undefined}
        examenDone={today ? !!state.examen[dateKey()] : undefined}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 6, paddingTop: 4, paddingBottom: 16, gap: 14 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  back: { fontSize: 17, fontWeight: '600', width: 60 },
});
