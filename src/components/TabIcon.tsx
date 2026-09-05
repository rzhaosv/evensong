import React from 'react';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';

export type TabIconName = 'today' | 'journal' | 'year' | 'settings';

/** Simple line icons for the tab bar; no icon packages. */
export default function TabIcon({ name, color, size = 24 }: { name: TabIconName; color: string; size?: number }) {
  const sw = 1.9;
  switch (name) {
    case 'today':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Circle cx={12} cy={12} r={4} stroke={color} strokeWidth={sw} />
          {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => {
            const r1 = 7;
            const r2 = 9.5;
            const rad = (a * Math.PI) / 180;
            return (
              <Line
                key={a}
                x1={12 + r1 * Math.cos(rad)}
                y1={12 + r1 * Math.sin(rad)}
                x2={12 + r2 * Math.cos(rad)}
                y2={12 + r2 * Math.sin(rad)}
                stroke={color}
                strokeWidth={sw}
                strokeLinecap="round"
              />
            );
          })}
        </Svg>
      );
    case 'journal':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M5 4.5h9a3 3 0 0 1 3 3v12H8a3 3 0 0 0-3 3z" stroke={color} strokeWidth={sw} strokeLinejoin="round" />
          <Line x1={8.5} y1={9} x2={13.5} y2={9} stroke={color} strokeWidth={sw} strokeLinecap="round" />
          <Line x1={8.5} y1={12.5} x2={13.5} y2={12.5} stroke={color} strokeWidth={sw} strokeLinecap="round" />
        </Svg>
      );
    case 'year':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          {[0, 1, 2].map((r) =>
            [0, 1, 2].map((c) => (
              <Rect key={`${r}${c}`} x={4 + c * 6} y={4 + r * 6} width={4} height={4} rx={1.2} stroke={color} strokeWidth={sw * 0.8} />
            )),
          )}
        </Svg>
      );
    case 'settings':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Circle cx={12} cy={12} r={3} stroke={color} strokeWidth={sw} />
          <Path
            d="M12 3.5v2.2M12 18.3v2.2M3.5 12h2.2M18.3 12h2.2M6 6l1.6 1.6M16.4 16.4L18 18M6 18l1.6-1.6M16.4 7.6L18 6"
            stroke={color}
            strokeWidth={sw}
            strokeLinecap="round"
          />
        </Svg>
      );
  }
}
