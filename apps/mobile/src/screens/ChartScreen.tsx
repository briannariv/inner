import React, { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AstrocartographyLine, HDCenterName, Planet, PlanetPlacement, InterpretationResult } from "@inner/shared";
import type { RootStackParamList } from "../navigation";
import { getAstrocartography, getInterpretation, getTransits } from "../api/client";
import { NatalWheel } from "../components/NatalWheel";
import { Bodygraph } from "../components/Bodygraph";
import { AstrocartographyMap } from "../components/AstrocartographyMap";
import { InterpretationPanel } from "../components/InterpretationPanel";
import { theme } from "../theme";

type Props = NativeStackScreenProps<RootStackParamList, "Chart">;
type Tab = "astrology" | "humanDesign" | "astrocartography";

function describeAstrocartographyLine(line: AstrocartographyLine): string {
  return (
    `MC line at ${line.mcLongitude.toFixed(1)}° longitude — where ${line.planet} was culminating overhead ` +
    `at your birth moment. IC line at ${line.icLongitude.toFixed(1)}°, the opposite meridian. The curved AC/DC ` +
    `lines mark where ${line.planet} was rising and setting at each latitude. Living near a line is ` +
    `traditionally read as amplifying that planet's themes in daily life. Line math is real spherical ` +
    `astronomy computed from your chart; see apps/api/src/astro/astrocartography.ts.`
  );
}

export function ChartScreen({ route }: Props) {
  const { bundle } = route.params;
  const [tab, setTab] = useState<Tab>("astrology");
  const [transits, setTransits] = useState<PlanetPlacement[] | null>(null);
  const [transitsLoading, setTransitsLoading] = useState(false);

  const [selectedPlanet, setSelectedPlanet] = useState<Planet | null>(null);
  const [selectedCenter, setSelectedCenter] = useState<HDCenterName | null>(null);
  const [panelVisible, setPanelVisible] = useState(false);
  const [panelLoading, setPanelLoading] = useState(false);
  const [panelResult, setPanelResult] = useState<InterpretationResult | null>(null);

  const [astroLines, setAstroLines] = useState<AstrocartographyLine[] | null>(null);
  const [astroLoading, setAstroLoading] = useState(false);
  const [astroError, setAstroError] = useState<string | null>(null);
  const [selectedAstroPlanet, setSelectedAstroPlanet] = useState<Planet | null>(null);

  async function handleSelectPlanet(planet: Planet) {
    setSelectedPlanet(planet);
    setPanelVisible(true);
    setPanelLoading(true);
    try {
      const result = await getInterpretation({ chart: bundle, focus: { kind: "planet", planet } });
      setPanelResult(result);
    } finally {
      setPanelLoading(false);
    }
  }

  async function handleSelectCenter(center: HDCenterName) {
    setSelectedCenter(center);
    setPanelVisible(true);
    setPanelLoading(true);
    try {
      const result = await getInterpretation({ chart: bundle, focus: { kind: "hdCenter", center } });
      setPanelResult(result);
    } finally {
      setPanelLoading(false);
    }
  }

  async function toggleTransits() {
    if (transits) {
      setTransits(null);
      return;
    }
    setTransitsLoading(true);
    try {
      const snapshot = await getTransits(bundle.natal.birthData);
      setTransits(snapshot.placements);
    } finally {
      setTransitsLoading(false);
    }
  }

  async function openAstrocartographyTab() {
    setTab("astrocartography");
    if (astroLines || astroLoading) return;
    setAstroLoading(true);
    setAstroError(null);
    try {
      const result = await getAstrocartography(bundle.natal.birthData);
      setAstroLines(result.lines);
    } catch (e) {
      setAstroError(e instanceof Error ? e.message : "Couldn't load astrocartography lines.");
    } finally {
      setAstroLoading(false);
    }
  }

  function handleSelectAstroPlanet(planet: Planet) {
    setSelectedAstroPlanet(planet);
    const line = astroLines?.find((l) => l.planet === planet);
    if (!line) return;
    setPanelVisible(true);
    setPanelResult({ headline: `${planet} lines`, body: describeAstrocartographyLine(line) });
  }

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
        <TabButton label="Astrology" active={tab === "astrology"} onPress={() => setTab("astrology")} />
        <TabButton label="Human Design" active={tab === "humanDesign"} onPress={() => setTab("humanDesign")} />
        <TabButton label="Astrocartography" active={tab === "astrocartography"} onPress={openAstrocartographyTab} />
      </ScrollView>

      <ScrollView contentContainerStyle={styles.content}>
        {tab === "astrology" && (
          <>
            <View style={styles.wheelWrap}>
              <NatalWheel
                placements={bundle.natal.placements}
                transitPlacements={transits ?? undefined}
                selectedPlanet={selectedPlanet}
                onSelectPlanet={handleSelectPlanet}
              />
            </View>
            <Pressable style={styles.transitButton} onPress={toggleTransits}>
              <Text style={styles.transitButtonText}>
                {transitsLoading ? "Loading transits…" : transits ? "Hide today's transits" : "Show today's transits"}
              </Text>
            </Pressable>
            <Text style={styles.hint}>Tap a planet for a chart-aware description.</Text>
          </>
        )}
        {tab === "humanDesign" && (
          <Bodygraph
            chart={bundle.humanDesign}
            selectedCenter={selectedCenter}
            onSelectCenter={handleSelectCenter}
          />
        )}
        {tab === "astrocartography" && (
          <>
            {astroLoading && <ActivityIndicator color={theme.accent} style={styles.astroLoader} />}
            {astroError && <Text style={styles.astroError}>{astroError}</Text>}
            {astroLines && (
              <>
                <View style={styles.wheelWrap}>
                  <AstrocartographyMap
                    lines={astroLines}
                    birthLocation={bundle.natal.birthData.location}
                    selectedPlanet={selectedAstroPlanet}
                    onSelectPlanet={handleSelectAstroPlanet}
                  />
                </View>
                <Text style={styles.hint}>No coastlines yet — reference cities mark the grid. Tap a planet below.</Text>
                <View style={styles.astroList}>
                  {astroLines.map((line) => (
                    <Pressable
                      key={line.planet}
                      style={[styles.astroRow, selectedAstroPlanet === line.planet && styles.astroRowSelected]}
                      onPress={() => handleSelectAstroPlanet(line.planet)}
                    >
                      <Text style={styles.astroRowText}>{line.planet}</Text>
                      <Text style={styles.astroRowMeta}>MC {line.mcLongitude.toFixed(0)}°</Text>
                    </Pressable>
                  ))}
                </View>
              </>
            )}
          </>
        )}
      </ScrollView>

      <InterpretationPanel
        visible={panelVisible}
        loading={panelLoading}
        result={panelResult}
        onClose={() => setPanelVisible(false)}
      />
    </View>
  );
}

function TabButton({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable style={[styles.tabButton, active && styles.tabButtonActive]} onPress={onPress}>
      <Text style={[styles.tabButtonText, active && styles.tabButtonTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background, paddingTop: 56 },
  tabs: { flexDirection: "row", paddingHorizontal: 24, gap: 12, marginBottom: 12 },
  tabButton: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, backgroundColor: theme.surface },
  tabButtonActive: { backgroundColor: theme.accent },
  tabButtonText: { color: theme.textMuted, fontWeight: "600" },
  tabButtonTextActive: { color: theme.background },
  content: { padding: 24, alignItems: "center" },
  wheelWrap: { marginBottom: 16 },
  transitButton: {
    borderWidth: 1,
    borderColor: theme.accentMuted,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  transitButtonText: { color: theme.accent },
  hint: { color: theme.textMuted, marginTop: 16, fontSize: 13, textAlign: "center" },
  astroLoader: { marginTop: 40 },
  astroError: { color: "#FF8080", marginTop: 24, textAlign: "center", paddingHorizontal: 16 },
  astroList: { width: "100%", marginTop: 20, borderTopWidth: 1, borderTopColor: theme.border },
  astroRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  astroRowSelected: { backgroundColor: theme.surface },
  astroRowText: { color: theme.text, fontSize: 14 },
  astroRowMeta: { color: theme.textMuted, fontSize: 12 },
});
