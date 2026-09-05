import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Linking, Switch, TextInput, Alert, Modal } from 'react-native';
import { Screen, PrimaryButton, Card, Chip, Eyebrow, ProBadge } from '../components/UI';
import { colors, radius, type, TextSize } from '../theme';
import { useApp } from '../store/AppContext';
import { restore } from '../services/billing';
import { TabProps } from '../navigation';
import { SITE } from './PaywallScreen';
import { formatTime } from '../logic';

function Row({ label, value, onPress, danger, pro }: { label: string; value?: string; onPress: () => void; danger?: boolean; pro?: boolean }) {
  return (
    <Pressable onPress={onPress} style={styles.row}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
        <Text style={[type.body, { fontWeight: '600' }, danger && { color: colors.danger }]}>{label}</Text>
        {pro && <ProBadge />}
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        {value ? <Text style={type.sub}>{value}</Text> : null}
        <Text style={{ color: colors.muted, fontSize: 18 }}>›</Text>
      </View>
    </Pressable>
  );
}

const MORNING_HOURS = [5, 6, 7, 8, 9, 10];
const EVENING_HOURS = [18, 19, 20, 21, 22, 23];
const MINUTES = [0, 15, 30, 45];
const SIZES: { value: TextSize; label: string }[] = [
  { value: 'small', label: 'Smaller' },
  { value: 'medium', label: 'Regular' },
  { value: 'large', label: 'Larger' },
];

export default function SettingsScreen({ navigation }: TabProps<'Settings'>) {
  const { state, isPro, setPro, update, setReminders, setReminderTimes, setTextSize, resetAll } = useApp();
  const [nameOpen, setNameOpen] = useState(false);
  const [draft, setDraft] = useState(state.name);
  const [timeOpen, setTimeOpen] = useState<'morning' | 'evening' | null>(null);
  const [aboutOpen, setAboutOpen] = useState(false);

  const gate = (fn: () => void) => () => (isPro ? fn() : navigation.navigate('Paywall'));

  const onReminders = async (v: boolean) => {
    const ok = await setReminders(v);
    if (v && !ok) Alert.alert('Notifications are off', 'Enable notifications for Evensong in iOS Settings to get daily reminders.');
  };

  const onReset = () =>
    Alert.alert('Reset everything?', 'This clears your reading history, journal and settings. It cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reset', style: 'destructive', onPress: () => resetAll() },
    ]);

  const current = timeOpen === 'evening' ? state.eveningTime : state.morningTime;
  const [h, m] = current.split(':').map(Number);
  const setTime = (hour: number, minute: number) => {
    const hhmm = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    if (timeOpen === 'evening') setReminderTimes(state.morningTime, hhmm);
    else setReminderTimes(hhmm, state.eveningTime);
  };

  return (
    <Screen scroll>
      <View style={{ paddingTop: 8 }}>
        <Eyebrow>Settings</Eyebrow>
        <Text style={[type.h1, { marginTop: 6 }]}>Evensong</Text>
      </View>

      <Card style={{ marginTop: 16 }}>
        <Text style={type.label}>Plan</Text>
        <Text style={[type.h2, { marginTop: 6 }]}>{isPro ? 'Evensong Pro · the whole year' : 'Free · today’s morning reading'}</Text>
        {!isPro && (
          <>
            <Text style={[type.bodySoft, { marginTop: 6 }]}>Evenings, the year’s archive, journal history, bookmarks, text size and reminders.</Text>
            <PrimaryButton title="Start 7-day free trial" onPress={() => navigation.navigate('Paywall')} style={{ marginTop: 14, height: 46 }} />
          </>
        )}
      </Card>

      <Text style={[type.caption, { marginTop: 20, marginBottom: 6 }]}>YOU</Text>
      <View style={styles.group}>
        <Row
          label="Name"
          value={state.name || 'Not set'}
          onPress={() => {
            setDraft(state.name);
            setNameOpen(true);
          }}
        />
        <Row label="Reading text size" value={SIZES.find((s) => s.value === state.textSize)?.label} onPress={gate(() => {})} pro={!isPro} />
        {isPro && (
          <View style={[styles.row, { borderBottomWidth: 0, paddingTop: 4 }]}>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {SIZES.map((s) => (
                <Chip key={s.value} text={s.label} small selected={state.textSize === s.value} onPress={() => setTextSize(s.value)} />
              ))}
            </View>
          </View>
        )}
      </View>

      <Text style={[type.caption, { marginTop: 20, marginBottom: 6 }]}>REMINDERS</Text>
      <View style={styles.group}>
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={[type.body, { fontWeight: '600' }]}>Daily reminders</Text>
            <Text style={type.caption}>{isPro ? 'Morning and evening, at your times' : 'Morning reading · evening is part of Pro'}</Text>
          </View>
          <Switch value={state.remindersEnabled} onValueChange={onReminders} trackColor={{ true: colors.accent, false: colors.surface2 }} thumbColor="#fff" />
        </View>
        <Row label="Morning" value={formatTime(state.morningTime)} onPress={() => setTimeOpen('morning')} />
        <Row label="Evening" value={formatTime(state.eveningTime)} onPress={gate(() => setTimeOpen('evening'))} pro={!isPro} />
      </View>

      <Text style={[type.caption, { marginTop: 20, marginBottom: 6 }]}>SUBSCRIPTION</Text>
      <View style={styles.group}>
        <Row
          label="Restore purchases"
          onPress={async () => {
            const ok = await restore().catch(() => false);
            if (ok) setPro(true);
            else Alert.alert('Nothing to restore', 'No active subscription was found for this Apple ID.');
          }}
        />
        <Row label="Manage subscription" onPress={() => Linking.openURL('https://apps.apple.com/account/subscriptions')} />
        <Row label="Privacy policy" onPress={() => Linking.openURL(`${SITE}/privacy.html`)} />
        <Row label="Terms of use" onPress={() => Linking.openURL(`${SITE}/terms.html`)} />
        <Row label="Support" onPress={() => Linking.openURL('mailto:ray@thezenithlabs.com?subject=Evensong%20support')} />
      </View>

      <Text style={[type.caption, { marginTop: 20, marginBottom: 6 }]}>ABOUT</Text>
      <View style={styles.group}>
        <Row label="About the readings" onPress={() => setAboutOpen(true)} />
      </View>

      <Text style={[type.caption, { marginTop: 20, marginBottom: 6 }]}>DANGER ZONE</Text>
      <View style={styles.group}>
        <Row label="Reset everything" onPress={onReset} danger />
      </View>

      <Text style={[type.caption, { marginTop: 20, lineHeight: 17 }]}>
        Everything you read and write stays on this phone. Evensong has no accounts and sends nothing anywhere except to Apple for
        subscriptions.
      </Text>

      <Modal visible={nameOpen} transparent animationType="fade" onRequestClose={() => setNameOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setNameOpen(false)} />
        <View style={styles.sheet}>
          <Text style={type.h3}>Your name</Text>
          <TextInput value={draft} onChangeText={setDraft} autoFocus style={styles.input} placeholder="Optional" placeholderTextColor={colors.muted} />
          <PrimaryButton
            title="Save"
            onPress={() => {
              update({ name: draft.trim() });
              setNameOpen(false);
            }}
            style={{ marginTop: 14 }}
          />
          <Pressable onPress={() => setNameOpen(false)} style={{ alignItems: 'center', paddingVertical: 14 }}>
            <Text style={type.sub}>Cancel</Text>
          </Pressable>
        </View>
      </Modal>

      <Modal visible={timeOpen !== null} transparent animationType="fade" onRequestClose={() => setTimeOpen(null)}>
        <Pressable style={styles.backdrop} onPress={() => setTimeOpen(null)} />
        <View style={styles.sheet}>
          <Text style={type.h3}>
            {timeOpen === 'evening' ? 'Evening' : 'Morning'} reminder · {formatTime(current)}
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
            {(timeOpen === 'evening' ? EVENING_HOURS : MORNING_HOURS).map((hh) => (
              <Chip key={hh} text={formatTime(`${String(hh).padStart(2, '0')}:00`).replace(':00', '')} selected={h === hh} onPress={() => setTime(hh, m)} />
            ))}
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
            {MINUTES.map((mm) => (
              <Chip key={mm} text={`:${String(mm).padStart(2, '0')}`} selected={m === mm} onPress={() => setTime(h, mm)} />
            ))}
          </View>
          <PrimaryButton title="Done" onPress={() => setTimeOpen(null)} style={{ marginTop: 18 }} />
        </View>
      </Modal>

      <Modal visible={aboutOpen} transparent animationType="fade" onRequestClose={() => setAboutOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setAboutOpen(false)} />
        <View style={styles.sheet}>
          <Text style={type.h2}>About the readings</Text>
          <Text style={[type.body, { marginTop: 12 }]}>
            The daily readings are Charles Haddon Spurgeon’s “Morning and Evening” (1865), one for each morning and evening of the
            year. The text is in the public domain; Evensong lightly modernizes older pronouns and verb endings (thee, thou, hath)
            and leaves the rest as Spurgeon wrote it.
          </Text>
          <Text style={[type.body, { marginTop: 12 }]}>
            Verses are quoted from the World English Bible, a public-domain translation, except where a verse is not part of that
            text and the King James Version Spurgeon quoted is used instead. The evening examen questions were written for Evensong.
          </Text>
          <PrimaryButton title="Close" onPress={() => setAboutOpen(false)} style={{ marginTop: 18 }} />
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  group: { backgroundColor: colors.surface, borderRadius: radius.lg, paddingHorizontal: 16, borderWidth: 1, borderColor: colors.line },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
    gap: 10,
  },
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: colors.overlay },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: 22,
    paddingBottom: 30,
  },
  input: {
    marginTop: 12,
    backgroundColor: colors.bg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: colors.ink,
    fontSize: 18,
    fontWeight: '600',
  },
});
