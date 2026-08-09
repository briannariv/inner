import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { HDCenterName, Planet, PlanetPlacement, InterpretationResult } from "@inner/shared";
import type { RootStackParamList } from "../navigation";
import { getInterpretation, getTransits } from "../api/client";
import { NatalWheel } from "../components/NatalWheel";
import { Bodygraph } from "../components/Bodygraph";
import { InterpretationPanel } from "../components/InterpretationPanel";
import { theme } from "../theme";

type Props = NativeStackScreenProps<RootStackParamList, "Chart">;
type Tab = "astrology" | "humanDesign";

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

  return (
    <View style={styles.container}>
      <View style={styles.tabs}>
        <TabButton label="Astrology" active={tab === "astrology"} onPress={() => setTab("astrology")} />
        <TabButton label="Human Design" active={tab === "humanDesign"} onPress={() => setTab("humanDesign")} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {tab === "astrology" ? (
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
        ) : (
          <Bodygraph
            chart={bundle.humanDesign}
            selectedCenter={selectedCenter}
            onSelectCenter={handleSelectCenter}
          />
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
  hint: { color: theme.textMuted, marginTop: 16, fontSize: 13 },
});
