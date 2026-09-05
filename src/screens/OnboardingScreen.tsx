import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, type } from '../theme';
import { PrimaryButton, GhostButton, Chip, ProgressDots, Eyebrow } from '../components/UI';
import Lamp from '../components/Lamp';
import { useApp } from '../store/AppContext';
import { formatTime } from '../logic';
import { requestPermission } from '../services/notifications';

const STEPS = 3;
const MORNING_TIMES = ['05:30', '06:00', '06:30', '07:00', '07:30', '08:00', '09:00'];
const EVENING_TIMES = ['19:30', '20:00', '20:30', '21:00', '21:30', '22:00', '22:30'];

export default function OnboardingScreen({ onDone, initialStep, still }: { onDone: () => void; initialStep?: number; still?: boolean }) {
  const { completeOnboarding } = useApp();
  const [step, setStep] = useState(initialStep ?? 0);
  const [morning, setMorning] = useState('07:00');
  const [evening, setEvening] = useState('21:00');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);

  const finish = async () => {
    setBusy(true);
    // Ask for notification permission here so the reminders can be scheduled; the free tier
    // gets the morning reminder, Pro adds the evening one (AppContext handles the split).
    const granted = await requestPermission().catch(() => false);
    completeOnboarding({ morningTime: morning, eveningTime: evening, remindersEnabled: granted, name: name.trim() });
    setBusy(false);
    onDone();
  };

  const next = () => (step < STEPS - 1 ? setStep(step + 1) : finish());
  const back = () => step > 0 && setStep(step - 1);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={styles.top}>
          <ProgressDots count={STEPS} index={step} />
        </View>
        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {step === 0 && (
            <>
              <View style={{ alignItems: 'center', marginTop: 20 }}>
                <Lamp size={140} progress={1} lit still={still} />
              </View>
              <Eyebrow style={{ textAlign: 'center', marginTop: 18 }}>Evensong</Eyebrow>
              <Text style={[type.display, { textAlign: 'center', marginTop: 8 }]}>Two readings a day,{'\n'}for a whole year</Text>
              <Text style={[type.bodySoft, { textAlign: 'center', marginTop: 14, fontSize: 16, lineHeight: 25 }]}>
                A verse and a few minutes with Charles Spurgeon’s “Morning and Evening” — 366 mornings, 366 evenings — with a short prayer,
                and three quiet questions before you sleep.
              </Text>
              <View style={styles.pillRow}>
                <Chip text="Morning · a verse & a reading" small />
                <Chip text="Evening · reading & examen" small />
                <Chip text="Nothing leaves your phone" small />
              </View>
            </>
          )}

          {step === 1 && (
            <>
              <Eyebrow>Reminders</Eyebrow>
              <Text style={styles.q}>When would you like to read?</Text>
              <Text style={[type.bodySoft, { marginTop: 6 }]}>
                Two gentle reminders a day. You can change these any time in Settings.
              </Text>

              <Text style={[type.h3, { marginTop: 26 }]}>Morning · {formatTime(morning)}</Text>
              <View style={styles.chips}>
                {MORNING_TIMES.map((t) => (
                  <Chip key={t} text={formatTime(t)} selected={morning === t} onPress={() => setMorning(t)} />
                ))}
              </View>

              <Text style={[type.h3, { marginTop: 24 }]}>Evening · {formatTime(evening)}</Text>
              <View style={styles.chips}>
                {EVENING_TIMES.map((t) => (
                  <Chip key={t} text={formatTime(t)} selected={evening === t} onPress={() => setEvening(t)} />
                ))}
              </View>
            </>
          )}

          {step === 2 && (
            <>
              <Eyebrow>Last thing</Eyebrow>
              <Text style={styles.q}>What should we call you?</Text>
              <Text style={[type.bodySoft, { marginTop: 6 }]}>Optional. Only used to say good morning.</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Your first name"
                placeholderTextColor={colors.muted}
                style={styles.input}
                autoCapitalize="words"
                returnKeyType="done"
                onSubmitEditing={next}
              />
              <View style={[styles.note, { marginTop: 26 }]}>
                <Lamp size={44} progress={0.6} still={still} />
                <Text style={[type.bodySoft, { flex: 1 }]}>
                  Today’s morning reading is ready. It takes about four minutes, and the lamp fills as you read.
                </Text>
              </View>
            </>
          )}
        </ScrollView>

        <View style={styles.footer}>
          <PrimaryButton title={step === STEPS - 1 ? 'Begin' : 'Continue'} onPress={next} loading={busy} />
          {step > 0 ? <GhostButton title="Back" onPress={back} /> : <View style={{ height: 48 }} />}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  top: { paddingTop: 12, paddingBottom: 4 },
  body: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 24 },
  q: { ...type.h1, marginTop: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginTop: 24 },
  input: {
    marginTop: 20,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: colors.ink,
    fontSize: 18,
    fontWeight: '600',
  },
  note: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.line,
  },
  footer: { paddingHorizontal: 24, paddingBottom: 8, gap: 4 },
});
