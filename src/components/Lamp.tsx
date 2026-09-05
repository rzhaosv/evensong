import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Platform, View } from 'react-native';
import Svg, { Circle, ClipPath, Defs, Path, RadialGradient, Rect, Stop } from 'react-native-svg';
import { colors } from '../theme';

/**
 * A small oil lamp that fills with light as the reading is scrolled. `progress` 0..1 sets the oil
 * level; at 1 the flame is lit and glows. The flame flickers gently unless `still` is set.
 */
export default function Lamp({
  size = 64,
  progress,
  lit,
  still = false,
  dark = false,
}: {
  size?: number;
  progress: number;
  lit?: boolean;
  still?: boolean;
  dark?: boolean;
}) {
  const p = Math.max(0, Math.min(1, progress));
  const isLit = lit ?? p >= 0.999;
  const flicker = useRef(new Animated.Value(0)).current;
  const native = Platform.OS !== 'web';

  useEffect(() => {
    if (still || !isLit) return;
    const seq = Animated.loop(
      Animated.sequence([
        Animated.timing(flicker, { toValue: 1, duration: 460, easing: Easing.inOut(Easing.quad), useNativeDriver: native }),
        Animated.timing(flicker, { toValue: 0.3, duration: 380, easing: Easing.inOut(Easing.quad), useNativeDriver: native }),
        Animated.timing(flicker, { toValue: 0.8, duration: 300, easing: Easing.inOut(Easing.quad), useNativeDriver: native }),
        Animated.timing(flicker, { toValue: 0, duration: 520, easing: Easing.inOut(Easing.quad), useNativeDriver: native }),
      ]),
    );
    seq.start();
    return () => seq.stop();
  }, [flicker, still, isLit, native]);

  const W = 100;
  const H = 100;
  const BOWL = 'M14 56 Q14 84 50 86 Q86 84 86 56 Q70 50 50 50 Q30 50 14 56 Z';
  const body = dark ? '#3A4157' : '#E4D6BC';
  const bodyLine = dark ? colors.gold : colors.accent;
  const oil = dark ? colors.gold : colors.accent;
  const flameOpacity = flicker.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] });
  const flameScale = flicker.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1.06] });

  // Lamp bowl: an ellipse-ish shape from x 14..86, y 52..84. Oil fills bottom-up.
  const bowlTop = 52;
  const bowlBottom = 84;
  const fillTop = bowlBottom - (bowlBottom - bowlTop) * p;

  return (
    <View style={{ width: size, height: size }}>
      {isLit && (
        <Animated.View
          style={{ position: 'absolute', left: 0, top: 0, width: size, height: size, opacity: flameOpacity, transform: [{ scale: flameScale }], pointerEvents: 'none' }}
        >
          <Svg width={size} height={size} viewBox={`0 0 ${W} ${H}`}>
            <Defs>
              <RadialGradient id="lampGlow" cx="50%" cy="50%" r="50%">
                <Stop offset="0%" stopColor={colors.gold} stopOpacity={dark ? 0.7 : 0.5} />
                <Stop offset="100%" stopColor={colors.gold} stopOpacity={0} />
              </RadialGradient>
            </Defs>
            <Circle cx={50} cy={34} r={34} fill="url(#lampGlow)" />
          </Svg>
        </Animated.View>
      )}
      <Svg width={size} height={size} viewBox={`0 0 ${W} ${H}`}>
        <Defs>
          <ClipPath id="lampBowl">
            <Path d={BOWL} />
          </ClipPath>
          <RadialGradient id="lampFlame" cx="50%" cy="70%" r="60%">
            <Stop offset="0%" stopColor="#FFF3D0" />
            <Stop offset="55%" stopColor={colors.gold} />
            <Stop offset="100%" stopColor="#E08A45" />
          </RadialGradient>
        </Defs>
        {/* bowl */}
        <Path d={BOWL} fill={body} />
        {/* oil level, clipped to the bowl */}
        {p > 0.01 && (
          <Rect x={14} y={fillTop} width={72} height={bowlBottom - fillTop + 2} fill={oil} opacity={0.92} clipPath="url(#lampBowl)" />
        )}
        <Path d={BOWL} fill="none" stroke={bodyLine} strokeWidth={2.5} />
        {/* spout + wick */}
        <Path d="M78 54 L94 48 L92 56 Z" fill={bodyLine} />
        <Rect x={47} y={40} width={6} height={12} rx={2} fill={bodyLine} />
        {/* base */}
        <Path d="M36 88 H64 L60 94 H40 Z" fill={bodyLine} />
        {/* flame */}
        {isLit && <Path d="M50 14 C40 26 38 32 44 40 Q50 46 56 40 C62 32 60 26 50 14 Z" fill="url(#lampFlame)" />}
        {!isLit && p > 0 && <Circle cx={50} cy={38} r={2.5} fill={bodyLine} opacity={0.35 + p * 0.5} />}
      </Svg>
    </View>
  );
}
