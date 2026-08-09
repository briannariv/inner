// Equirectangular graticule map — deliberately no coastline data (none is
// bundled and hand-authoring an accurate world outline from memory risks
// getting it wrong), so a handful of reference cities anchor the grid
// geographically instead. Line math (MC/IC meridians, AC/DC horizon curves)
// comes straight from the API's real spherical-astronomy computation in
// apps/api/src/astro/astrocartography.ts.
import React from "react";
import { View } from "react-native";
import Svg, { Circle, Line, Path, Text as SvgText } from "react-native-svg";
import type { AstrocartographyLine, GeoLocation, Planet } from "@inner/shared";
import { theme } from "../theme";

const PLANET_GLYPH: Record<Planet, string> = {
  Sun: "☉", Moon: "☽", Mercury: "☿", Venus: "♀", Mars: "♂",
  Jupiter: "♃", Saturn: "♄", Uranus: "♅", Neptune: "♆", Pluto: "♇",
  NorthNode: "☊", Chiron: "⚷",
};

const REFERENCE_CITIES: { name: string; lat: number; lon: number }[] = [
  { name: "New York", lat: 40.7128, lon: -74.006 },
  { name: "London", lat: 51.5074, lon: -0.1278 },
  { name: "Tokyo", lat: 35.6762, lon: 139.6503 },
  { name: "Sydney", lat: -33.8688, lon: 151.2093 },
];

function project(lat: number, lon: number, width: number, height: number) {
  return { x: ((lon + 180) / 360) * width, y: ((90 - lat) / 180) * height };
}

interface Props {
  lines: AstrocartographyLine[];
  birthLocation: GeoLocation;
  selectedPlanet: Planet | null;
  onSelectPlanet: (planet: Planet) => void;
  size?: number;
}

export function AstrocartographyMap({ lines, birthLocation, selectedPlanet, onSelectPlanet, size = 300 }: Props) {
  const width = size;
  const height = size;

  return (
    <View>
      <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <Line x1={0} y1={0} x2={width} y2={0} stroke={theme.border} strokeWidth={1} />
        <Line x1={0} y1={height} x2={width} y2={height} stroke={theme.border} strokeWidth={1} />
        <Line x1={0} y1={0} x2={0} y2={height} stroke={theme.border} strokeWidth={1} />
        <Line x1={width} y1={0} x2={width} y2={height} stroke={theme.border} strokeWidth={1} />

        {Array.from({ length: 13 }, (_, i) => -180 + i * 30).map((lon) => {
          const p1 = project(90, lon, width, height);
          const p2 = project(-90, lon, width, height);
          return (
            <Line key={`lon-${lon}`} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
              stroke={theme.border} strokeWidth={lon === 0 ? 1 : 0.5} />
          );
        })}
        {Array.from({ length: 7 }, (_, i) => -90 + i * 30).map((lat) => {
          const p1 = project(lat, -180, width, height);
          const p2 = project(lat, 180, width, height);
          return (
            <Line key={`lat-${lat}`} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
              stroke={theme.border} strokeWidth={lat === 0 ? 1 : 0.5} />
          );
        })}

        {lines.map((line) => {
          const isSelected = selectedPlanet === line.planet;
          const stroke = isSelected ? theme.accent : theme.border;
          const strokeWidth = isSelected ? 1.6 : 0.6;

          const mcP1 = project(90, line.mcLongitude, width, height);
          const mcP2 = project(-90, line.mcLongitude, width, height);
          const icP1 = project(90, line.icLongitude, width, height);
          const icP2 = project(-90, line.icLongitude, width, height);

          const acPath = line.acPoints
            .map((pt, i) => `${i === 0 ? "M" : "L"} ${project(pt.lat, pt.lon, width, height).x} ${project(pt.lat, pt.lon, width, height).y}`)
            .join(" ");
          const dcPath = line.dcPoints
            .map((pt, i) => `${i === 0 ? "M" : "L"} ${project(pt.lat, pt.lon, width, height).x} ${project(pt.lat, pt.lon, width, height).y}`)
            .join(" ");

          return (
            <React.Fragment key={line.planet}>
              <Line x1={mcP1.x} y1={mcP1.y} x2={mcP2.x} y2={mcP2.y} stroke={stroke} strokeWidth={strokeWidth}
                onPress={() => onSelectPlanet(line.planet)} />
              <Line x1={icP1.x} y1={icP1.y} x2={icP2.x} y2={icP2.y} stroke={stroke} strokeWidth={strokeWidth}
                onPress={() => onSelectPlanet(line.planet)} />
              {line.acPoints.length > 1 && (
                <Path d={acPath} fill="none" stroke={stroke} strokeWidth={strokeWidth} onPress={() => onSelectPlanet(line.planet)} />
              )}
              {line.dcPoints.length > 1 && (
                <Path d={dcPath} fill="none" stroke={stroke} strokeWidth={strokeWidth} onPress={() => onSelectPlanet(line.planet)} />
              )}
            </React.Fragment>
          );
        })}

        {REFERENCE_CITIES.map((city) => {
          const pos = project(city.lat, city.lon, width, height);
          return (
            <React.Fragment key={city.name}>
              <Circle cx={pos.x} cy={pos.y} r={2} fill={theme.textMuted} />
              <SvgText x={pos.x + 4} y={pos.y - 3} fontSize={7} fill={theme.textMuted}>{city.name}</SvgText>
            </React.Fragment>
          );
        })}
        {(() => {
          const pos = project(birthLocation.lat, birthLocation.lon, width, height);
          return (
            <React.Fragment>
              <Circle cx={pos.x} cy={pos.y} r={3} fill={theme.accent} />
              <SvgText x={pos.x + 4} y={pos.y - 3} fontSize={7} fill={theme.accent}>{birthLocation.name} (birth)</SvgText>
            </React.Fragment>
          );
        })()}

        {selectedPlanet && (() => {
          const line = lines.find((l) => l.planet === selectedPlanet);
          if (!line) return null;
          const pos = project(85, line.mcLongitude, width, height);
          return (
            <SvgText x={pos.x} y={pos.y + 10} fontSize={11} fill={theme.accent} textAnchor="middle">
              {PLANET_GLYPH[selectedPlanet]}
            </SvgText>
          );
        })()}
      </Svg>
    </View>
  );
}
