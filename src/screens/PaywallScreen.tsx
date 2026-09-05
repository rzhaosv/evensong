import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Alert, Linking, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { PurchasesPackage } from 'react-native-purchases';
import { colors, radius, type } from '../theme';
import { PrimaryButton } from '../components/UI';
import Lamp from '../components/Lamp';
import { getPackages, purchase, restore, isCancelledError } from '../services/billing';
import { useApp } from '../store/AppContext';
import { ScreenProps } from '../navigation';
import { demo } from '../dev/demo';

export const SITE = 'https://tryforma.app/evensong';

const BENEFITS: [string, string][] = [
  ['Every evening reading', 'Spurgeon’s 366 evenings, in the navy-and-candlelight card.'],
  ['The whole year, any day', 'Open any morning or evening from the calendar, past or future.'],
  ['Your journal, kept', 'Every examen and bookmarked reading, for as long as you like.'],
  ['Reminders and reading size', 'A morning and an evening nudge, and text sized the way you read.'],
];

type Plan = { id: string; title: string; sub: string; price: string; period: 'year' | 'month'; pkg: PurchasesPackage | null; best?: boolean };

export default function PaywallScreen({ navigation, route }: ScreenProps<'Paywall'>) {
  const { setPro } = useApp();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const fromOnboarding = route.params?.fromOnboarding;

  useEffect(() => {
    getPackages().then((p) => {
      const annual = p.find((x) => x.packageType === 'ANNUAL' || x.identifier === '$rc_annual');
      const monthly = p.find((x) => x.packageType === 'MONTHLY' || x.identifier === '$rc_monthly');
      const list: Plan[] = [];
      if (annual) list.push({ id: annual.identifier, title: 'Yearly', sub: '7-day free trial, then yearly', price: annual.product.priceString, period: 'year', pkg: demo ? null : annual, best: true });
      if (monthly) list.push({ id: monthly.identifier, title: 'Monthly', sub: '7-day free trial, then monthly', price: monthly.product.priceString, period: 'month', pkg: demo ? null : monthly });
      setPlans(list);
      setSelected(list[0]?.id ?? null);
      setLoaded(true);
    });
  }, []);

  const close = () => {
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.replace('Tabs');
  };

  const current = plans.find((p) => p.id === selected) ?? null;

  const onSubscribe = async () => {
    if (!current?.pkg) {
      Alert.alert('Not available yet', 'Plans could not be loaded right now. Please check your connection and try again.');
      return;
    }
    setBusy(true);
    try {
      const ok = await purchase(current.pkg);
      if (ok) {
        setPro(true);
        close();
      }
    } catch (e) {
      if (!isCancelledError(e)) Alert.alert('Purchase failed', 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const onRestore = async () => {
    setBusy(true);
    try {
      const ok = await restore();
      if (ok) {
        setPro(true);
        close();
      } else {
        Alert.alert('Nothing to restore', 'No active subscription was found for this Apple ID.');
      }
    } catch {
      Alert.alert('Restore failed', 'Please try again in a moment.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {!fromOnboarding && (
        <Pressable onPress={close} hitSlop={12} style={styles.close}>
          <Text style={{ color: colors.onNavyMuted, fontSize: 18, fontWeight: '600' }}>✕</Text>
        </Pressable>
      )}
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={{ alignItems: 'center' }}>
          <Lamp size={120} progress={1} lit still={!!demo?.snap} dark />
        </View>
        <Text style={[type.display, { textAlign: 'center', marginTop: 6, fontSize: 30, color: colors.onNavy }]}>Morning and evening,{'\n'}all year long</Text>
        <Text style={[type.bodySoft, { textAlign: 'center', marginTop: 10, color: '#D9D3C3' }]}>
          Two short readings a day and three honest questions at night. A year of them, kept in one quiet place.
        </Text>

        <View style={styles.benefits}>
          {BENEFITS.map(([label, sub]) => (
            <View key={label} style={styles.benefitRow}>
              <View style={styles.dot} />
              <View style={{ flex: 1 }}>
                <Text style={[type.h3, { color: colors.onNavy }]}>{label}</Text>
                <Text style={[type.sub, { marginTop: 2, color: colors.onNavyMuted }]}>{sub}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={{ gap: 12, marginTop: 4 }}>
          {!loaded ? (
            <Text style={[type.caption, { textAlign: 'center', color: colors.onNavyMuted }]}>Loading plans…</Text>
          ) : plans.length === 0 ? (
            <View style={styles.plan}>
              <Text style={[type.bodySoft, { textAlign: 'center', flex: 1, color: '#D9D3C3' }]}>
                Plans are not available right now. Today’s morning reading is always free; please try again later.
              </Text>
            </View>
          ) : (
            plans.map((p) => {
              const active = p.id === selected;
              return (
                <Pressable key={p.id} onPress={() => setSelected(p.id)} style={[styles.plan, active && styles.planActive]}>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Text style={[type.h3, { color: colors.onNavy }]}>{p.title}</Text>
                      {p.best && (
                        <View style={styles.badge}>
                          <Text style={styles.badgeText}>Best value</Text>
                        </View>
                      )}
                    </View>
                    <Text style={[type.caption, { marginTop: 3, color: colors.onNavyMuted }]}>{p.sub}</Text>
                  </View>
                  <Text style={[type.h3, { color: active ? colors.onNavy : '#D9D3C3' }]}>
                    {p.price}
                    <Text style={[type.caption, { color: colors.onNavyMuted }]}>/{p.period}</Text>
                  </Text>
                </Pressable>
              );
            })
          )}
        </View>

        <PrimaryButton
          title="Start my 7-day free trial"
          onPress={onSubscribe}
          loading={busy}
          disabled={!selected}
          color={colors.gold}
          textColor={colors.navy}
          style={{ marginTop: 20 }}
        />
        <Text style={[type.caption, { textAlign: 'center', marginTop: 12, lineHeight: 17, color: colors.onNavyMuted }]}>
          {current
            ? `Free for 7 days, then ${current.price}/${current.period}. Cancel anytime in Settings.`
            : 'Free for 7 days, then the plan price. Cancel anytime in Settings.'}
          {' '}Payment is charged to your Apple ID after the trial. Subscriptions auto-renew unless cancelled at least 24 hours
          before the end of the current period.
        </Text>

        <View style={styles.links}>
          <Pressable onPress={onRestore}><Text style={styles.link}>Restore</Text></Pressable>
          <Pressable onPress={() => Linking.openURL(`${SITE}/terms.html`)}><Text style={styles.link}>Terms</Text></Pressable>
          <Pressable onPress={() => Linking.openURL(`${SITE}/privacy.html`)}><Text style={styles.link}>Privacy</Text></Pressable>
        </View>

        <Pressable onPress={close} style={{ alignItems: 'center', marginTop: 18, paddingVertical: 8 }}>
          <Text style={[type.sub, { color: '#D9D3C3' }]}>Continue with today’s morning reading</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.navy },
  close: { position: 'absolute', top: 54, right: 20, zIndex: 5, padding: 6 },
  scroll: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 30 },
  benefits: { marginTop: 24, marginBottom: 22, gap: 14 },
  benefitRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.gold, marginTop: 7 },
  plan: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.navyLine,
    backgroundColor: colors.navy2,
    borderRadius: radius.lg,
    padding: 18,
    gap: 10,
  },
  planActive: { borderColor: colors.gold, backgroundColor: '#2C3550' },
  badge: { backgroundColor: colors.gold, borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { color: colors.navy, fontSize: 11, fontWeight: '800', letterSpacing: 0.3 },
  links: { flexDirection: 'row', justifyContent: 'center', gap: 22, marginTop: 20 },
  link: { color: colors.onNavyMuted, fontSize: 13, fontWeight: '600' },
});
