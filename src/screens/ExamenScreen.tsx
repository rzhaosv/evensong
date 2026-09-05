import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, KeyboardAvoidingView, Platform, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { colors, palettes, radius, type } from '../theme';
import { PrimaryButton, Eyebrow } from '../components/UI';
import Lamp from '../components/Lamp';
import { useApp } from '../store/AppContext';
import { ScreenProps } from '../navigation';
import { examenSetFor } from '../content';
import { dateKey, formatDateKey } from '../logic';
import { demo } from '../dev/demo';

const LABELS = ['Gratitude', 'Where I fell short', 'One thing for tomorrow'];
const PLACEHOLDERS = ['Something small counts.', 'Be honest; nobody else reads this.', 'Make it doable before noon.'];

/**
 * The evening examen: three questions (gratitude / where I fell short / one thing for tomorrow)
 * with short text answers, saved to the journal under today's date. Free for everyone.
 */
export default function ExamenScreen({ navigation, route }: ScreenProps<'Examen'>) {
  const { state, saveExamen } = useApp();
  const date = route.params?.date ?? dateKey();
  const [y, m, d] = date.split('-').map(Number);
  const set = examenSetFor(m, d);
  const existing = state.examen[date];
  const [answers, setAnswers] = useState<[string, string, string]>(
    existing?.answers ?? (demo?.name === 'examen' ? ['The light on the kitchen table at breakfast, and that nobody was in a hurry.', '', ''] : ['', '', '']),
  );
  const [saved, setSaved] = useState(false);
  const pal = palettes.evening;
  const filled = answers.filter((a) => a.trim()).length;

  const onSave = () => {
    saveExamen(date, { set: set.id, answers, at: new Date().toISOString() });
    setSaved(true);
  };

  const setAnswer = (i: number, v: string) => {
    const next = [...answers] as [string, string, string];
    next[i] = v;
    setAnswers(next);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <StatusBar style="light" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={styles.top}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={{ width: 60 }}>
            <Text style={[styles.back, { color: pal.accent }]}>‹ Back</Text>
          </Pressable>
          <Text style={[type.h3, { color: pal.text }]}>Evening examen</Text>
          <View style={{ width: 60 }} />
        </View>
        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={{ alignItems: 'center', marginTop: 6 }}>
            <Lamp size={72} progress={saved ? 1 : filled / 3} lit={saved} still={!!demo?.snap} dark />
          </View>
          <Eyebrow color={pal.accent} style={{ textAlign: 'center', marginTop: 12 }}>
            {formatDateKey(date)}
          </Eyebrow>
          <Text style={[type.h1, { color: pal.text, textAlign: 'center', marginTop: 6 }]}>Three questions before sleep</Text>
          <Text style={[type.bodySoft, { color: pal.soft, textAlign: 'center', marginTop: 8 }]}>
            Look back over the day with God. A sentence or two for each is plenty.
          </Text>

          {set.questions.map((q, i) => (
            <View key={i} style={[styles.card, { backgroundColor: pal.card, borderColor: pal.line }]}>
              <Eyebrow color={pal.accent}>
                {i + 1} · {LABELS[i]}
              </Eyebrow>
              <Text style={[type.reading, { color: pal.text, fontSize: 18, lineHeight: 27, marginTop: 8 }]}>{q}</Text>
              <TextInput
                value={answers[i]}
                onChangeText={(v) => setAnswer(i, v)}
                placeholder={PLACEHOLDERS[i]}
                placeholderTextColor={pal.muted}
                multiline
                style={[styles.input, { color: pal.text, borderColor: pal.line }]}
              />
            </View>
          ))}

          {saved ? (
            <View style={[styles.done, { backgroundColor: pal.accentSoft }]}>
              <Text style={[type.h3, { color: pal.text }]}>Saved to your journal</Text>
              <Text style={[type.bodySoft, { color: pal.soft, marginTop: 4, textAlign: 'center' }]}>
                Rest well. The morning reading will be waiting.
              </Text>
              <PrimaryButton title="Done" onPress={() => navigation.goBack()} color={pal.accent} textColor={pal.onAccent} style={{ marginTop: 14, height: 48, alignSelf: 'stretch' }} />
            </View>
          ) : (
            <PrimaryButton
              title={existing ? 'Update tonight’s examen' : 'Save to journal'}
              onPress={onSave}
              disabled={filled === 0}
              color={pal.accent}
              textColor={pal.onAccent}
              style={{ marginTop: 22 }}
            />
          )}
          <Text style={[type.caption, { color: pal.muted, textAlign: 'center', marginTop: 14 }]}>
            Everything you write stays on this phone.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.navy },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 10 },
  back: { fontSize: 17, fontWeight: '600' },
  body: { paddingHorizontal: 20, paddingBottom: 30 },
  card: { marginTop: 18, borderRadius: radius.lg, padding: 18, borderWidth: 1 },
  input: {
    marginTop: 12,
    minHeight: 72,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 12,
    fontSize: 16,
    lineHeight: 22,
    textAlignVertical: 'top',
  },
  done: { marginTop: 22, borderRadius: radius.lg, padding: 18, alignItems: 'center' },
});
