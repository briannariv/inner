// Interactive natal wheel: tap a planet to fire onSelectPlanet. Degrees are
// laid out with 0° at the top going clockwise — a simplified orientation for
// v0. A real chart-wheel convention (Ascendant fixed at 9 o'clock, houses
// running counterclockwise) is a follow-up polish task, not required to
// prove the tap-for-interpretation interaction end-to-end.
import React from "react";
import { View } from "react-native";
import Svg, { Circle, Line, Text as SvgText } from "react-native-svg";
import type { Planet, PlanetPlacement } from "@inner/shared";
import { theme } from "../theme";

const PLANET_GLYPH: Record<Planet, string> = {
  Sun: "☉", Moon: "☽", Mercury: "☿", Venus: "♀", Mars: "♂",
  Jupiter: "♃", Saturn: "♄", Uranus: "♅", Neptune: "♆", Pluto: "♇",
  NorthNode: "☊", Chiron: "⚷",
};

function pointOnCircle(cx: number, cy: number, radius: number, degree: number) {
  const rad = ((degree - 90) * Math.PI) / 180;
  return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) };
}

interface Props {
  size?: number;
  placements: PlanetPlacement[];
  transitPlacements?: PlanetPlacement[];
  selectedPlanet?: Planet | null;
  onSelectPlanet: (planet: Planet) => void;
}

export function NatalWheel({ size = 320, placements, transitPlacements, selectedPlanet, onSelectPlanet }: Props) {
  const cx = size / 2;
  const cy = size / 2;
  const outerR = size / 2 - 24;
  const signRingR = outerR - 16;
  const natalRingR = signRingR - 28;
  const transitRingR = natalRingR - 26;

  const signTicks = Array.from({ length: 12 }, (_, i) => i * 30);

  return (
    <View>
      <Svg width={size} height={size}>
        <Circle cx={cx} cy={cy} r={outerR} stroke={theme.border} strokeWidth={1} fill="none" />
        <Circle cx={cx} cy={cy} r={signRingR} stroke={theme.border} strokeWidth={1} fill="none" />
        {transitPlacements && (
          <Circle cx={cx} cy={cy} r={transitRingR} stroke={theme.border} strokeWidth={1} fill="none" strokeDasharray="2,4" />
        )}

        {signTicks.map((deg) => {
          const inner = pointOnCircle(cx, cy, signRingR, deg);
          const outer = pointOnCircle(cx, cy, outerR, deg);
          return <Line key={deg} x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y} stroke={theme.border} strokeWidth={1} />;
        })}

        {placements.map((p) => {
          const pos = pointOnCircle(cx, cy, natalRingR, p.absoluteDegree);
          const isSelected = selectedPlanet === p.planet;
          return (
            <React.Fragment key={p.planet}>
              <Circle
                cx={pos.x}
                cy={pos.y}
                r={14}
                fill={isSelected ? theme.accent : theme.surface}
                stroke={theme.accent}
                strokeWidth={isSelected ? 2 : 1}
                onPress={() => onSelectPlanet(p.planet)}
              />
              <SvgText
                x={pos.x}
                y={pos.y + 5}
                fontSize={14}
                fill={isSelected ? theme.background : theme.text}
                textAnchor="middle"
                onPress={() => onSelectPlanet(p.planet)}
              >
                {PLANET_GLYPH[p.planet]}
              </SvgText>
            </React.Fragment>
          );
        })}

        {transitPlacements?.map((p) => {
          const pos = pointOnCircle(cx, cy, transitRingR, p.absoluteDegree);
          return (
            <Circle
              key={`transit-${p.planet}`}
              cx={pos.x}
              cy={pos.y}
              r={6}
              fill={theme.accentMuted}
              onPress={() => onSelectPlanet(p.planet)}
            />
          );
        })}
      </Svg>
    </View>
  );
}
