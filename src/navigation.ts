import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps, NavigatorScreenParams } from '@react-navigation/native';
import { Period } from './theme';

export type TabParamList = {
  Today: undefined;
  Journal: undefined;
  Year: undefined;
  Settings: undefined;
};

export type RootStackParamList = {
  Tabs: NavigatorScreenParams<TabParamList> | undefined;
  /** Any day of the year; `period` picks which card opens first. */
  Reading: { month: number; day: number; period?: Period };
  /** The evening examen for a calendar date ("YYYY-MM-DD", defaults to today). */
  Examen: { date?: string } | undefined;
  Paywall: { fromOnboarding?: boolean } | undefined;
};

export type ScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<RootStackParamList, T>;

export type TabProps<T extends keyof TabParamList> = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, T>,
  NativeStackScreenProps<RootStackParamList>
>;
