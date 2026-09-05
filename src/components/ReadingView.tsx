import React, { useMemo, useRef, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { colors, palettes, radius, type, TEXT_SCALE, TextSize } from '../theme';
import { Reading, dateLabel, periodLabel } from '../content';
import { Eyebrow, PrimaryButton, SecondaryButton, ProBadge } from './UI';
import Lamp from './Lamp';

/**
 * The reading itself: eyebrow, verse (large serif), Spurgeon's text, prayer, Lamp that fills as
 * you scroll, and Mark as read. Used by the Today tab and by the Reading screen for any day.
 */
export default function ReadingView({
  reading,
  locked,
  read,
  bookmarked,
  textSize,
  still,
  header,
  onMarkRead,
  onBookmark,
  onUnlock,
  onExamen,
  examenDone,
}: {
  reading: Reading;
  locked: boolean;
  read: boolean;
  bookmarked: boolean;
  textSize: TextSize;
  still?: boolean;
  /** Rendered above the card (toggle, greeting, back button…). */
  header?: React.ReactNode;
  onMarkRead: () => void;
  onBookmark: () => void;
  onUnlock: () => void;
  onExamen?: () => void;
  examenDone?: boolean;
}) {
  const pal = palettes[reading.period];
  const evening = reading.period === 'evening';
  const scale = TEXT_SCALE[textSize];
  const [scrollProgress, setScrollProgress] = useState(0);
  const finished = useRef(false);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, layoutMeasurement, contentSize } = e.nativeEvent;
    const total = Math.max(1, contentSize.height - layoutMeasurement.height);
    const p = Math.max(0, Math.min(1, contentOffset.y / total));
    if (p > scrollProgress) setScrollProgress(p);
    if (p >= 0.97) finished.current = true;
  };

  const progress = read ? 1 : locked ? 0 : scrollProgress;

  const paragraphs = useMemo(() => reading.body.split('\n\n'), [reading.body]);
  const teaser = locked ? paragraphs[0].split('. ').slice(0, 2).join('. ') + '.' : null;

  const verseStyle = { ...type.verse, color: pal.text, fontSize: type.verse.fontSize! * scale, lineHeight: type.verse.lineHeight! * scale };
  const bodyStyle = { ...type.reading, color: pal.text, fontSize: type.reading.fontSize! * scale, lineHeight: type.reading.lineHeight! * scale };
  const prayerStyle = { ...type.prayer, color: pal.soft, fontSize: type.prayer.fontSize! * scale, lineHeight: type.prayer.lineHeight! * scale };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: pal.bg }}
      contentContainerStyle={styles.scroll}
      showsVerticalScrollIndicator={false}
      onScroll={onScroll}
      scrollEventThrottle={48}
    >
      {header}

      <View style={[styles.card, { backgroundColor: pal.card, borderColor: pal.line }]}>
        <View style={styles.cardTop}>
          <View style={{ flex: 1 }}>
            <Eyebrow color={pal.accent}>
              {periodLabel(reading.period)} · {dateLabel(reading.month, reading.day)}
            </Eyebrow>
            <Text style={[type.h2, { color: pal.text, marginTop: 6 }]}>{reading.title}</Text>
          </View>
          <Lamp size={56} progress={progress} still={still} dark={evening} />
        </View>

        <Text style={[verseStyle, { marginTop: 18 }]}>“{reading.verse}”</Text>
        <Text style={[type.sub, { color: pal.accent, marginTop: 10, fontWeight: '700' }]}>
          {reading.ref}
          <Text style={{ color: pal.muted, fontWeight: '500' }}> · {reading.verseSource === 'WEB' ? 'World English Bible' : 'King James Version'}</Text>
        </Text>

        <View style={[styles.rule, { backgroundColor: pal.line }]} />

        {locked ? (
          <>
            <Text style={bodyStyle}>{teaser}</Text>
            <View style={[styles.lock, { borderColor: pal.line, backgroundColor: pal.accentSoft }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <ProBadge color={pal.accent} />
                <Text style={[type.h3, { color: pal.text, flex: 1 }]}>
                  {evening ? 'Evening readings are part of Evensong Pro' : 'The year’s archive is part of Evensong Pro'}
                </Text>
              </View>
              <Text style={[type.bodySoft, { color: pal.soft, marginTop: 8 }]}>
                Every morning and evening of the year, the journal, bookmarks and reminders. Today’s morning reading is always free.
              </Text>
              <PrimaryButton title="Start 7-day free trial" onPress={onUnlock} color={pal.accent} textColor={pal.onAccent} style={{ marginTop: 14, height: 50 }} />
            </View>
          </>
        ) : (
          <>
            {paragraphs.map((p, i) => (
              <Text key={i} style={[bodyStyle, i > 0 && { marginTop: 16 }]}>
                {p}
              </Text>
            ))}

            <View style={[styles.rule, { backgroundColor: pal.line }]} />
            <Eyebrow color={pal.accent}>A prayer for {evening ? 'tonight' : 'today'}</Eyebrow>
            <Text style={[prayerStyle, { marginTop: 8 }]}>{reading.prayer}</Text>

            <View style={{ marginTop: 26, gap: 10 }}>
              {read ? (
                <View style={[styles.doneRow, { backgroundColor: pal.accentSoft }]}>
                  <Lamp size={28} progress={1} lit still={still} dark={evening} />
                  <Text style={[type.sub, { color: pal.text, fontWeight: '700' }]}>Read · the lamp is lit</Text>
                </View>
              ) : (
                <PrimaryButton title="Mark as read" onPress={onMarkRead} color={pal.accent} textColor={pal.onAccent} />
              )}
              {evening && onExamen && (
                <SecondaryButton
                  title={examenDone ? 'Revisit tonight’s examen' : 'Evening examen · three questions'}
                  onPress={onExamen}
                  color={pal.text}
                  borderColor={evening ? 'rgba(244,238,223,0.3)' : colors.lineStrong}
                />
              )}
              <Pressable onPress={onBookmark} style={{ alignItems: 'center', paddingVertical: 10 }}>
                <Text style={[type.sub, { color: pal.muted }]}>{bookmarked ? '★ Bookmarked' : '☆ Bookmark this reading'}</Text>
              </Pressable>
            </View>
          </>
        )}
      </View>

      <Text style={[type.caption, { textAlign: 'center', marginTop: 18, color: pal.muted }]}>
        From C. H. Spurgeon’s “Morning and Evening” (1865), lightly modernized. Public domain.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 16, paddingBottom: 40 },
  card: { borderRadius: radius.xl, padding: 22, borderWidth: 1 },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  rule: { height: 1, marginVertical: 20 },
  lock: { marginTop: 18, borderRadius: radius.lg, padding: 18, borderWidth: 1 },
  doneRow: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: radius.pill, paddingVertical: 10, paddingHorizontal: 16, justifyContent: 'center' },
});
