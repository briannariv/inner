// The 64-gate grid, factored out of Bodygraph so Compatibility can show
// two people's full gate charts side by side without duplicating the grid
// logic/styles.
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { HDGateActivation } from "@inner/shared";
import { theme } from "../theme";

type GateState = "both" | "personality" | "design" | "inactive";

interface Props {
  gates: HDGateActivation[];
  selectedGate?: number | null;
  onSelectGate: (gate: number) => void;
  compact?: boolean;
}

export function GateGrid({ gates, selectedGate, onSelectGate, compact }: Props) {
  const activationsByGate = new Map<number, Set<"personality" | "design">>();
  for (const g of gates) {
    if (!activationsByGate.has(g.gate)) activationsByGate.set(g.gate, new Set());
    activationsByGate.get(g.gate)!.add(g.source);
  }

  return (
    <View>
      <View style={styles.legendRow}>
        <LegendItem swatchStyle={styles.gateBoth} label="Conscious + Unconscious" />
        <LegendItem swatchStyle={styles.gatePersonality} label="Conscious" />
        <LegendItem swatchStyle={styles.gateDesign} label="Unconscious" />
        <LegendItem swatchStyle={styles.gateInactive} label="Inactive" />
      </View>
      <View style={styles.gateGrid}>
        {Array.from({ length: 64 }, (_, i) => i + 1).map((gate) => {
          const sources = activationsByGate.get(gate);
          const state: GateState = !sources
            ? "inactive"
            : sources.size === 2
              ? "both"
              : sources.has("personality")
                ? "personality"
                : "design";
          return (
            <Pressable
              key={gate}
              onPress={() => onSelectGate(gate)}
              style={[
                styles.gateCell,
                compact && styles.gateCellCompact,
                GATE_STATE_STYLE[state],
                selectedGate === gate && styles.gateCellSelected,
              ]}
            >
              <Text
                style={[
                  styles.gateCellText,
                  compact && styles.gateCellTextCompact,
                  state === "both" && styles.gateCellTextOnAccent,
                  (state === "personality" || state === "design") && styles.gateCellTextActive,
                ]}
              >
                {gate}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function LegendItem({ swatchStyle, label }: { swatchStyle: object; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendSwatch, swatchStyle]} />
      <Text style={styles.legendLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  legendRow: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 10 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  legendSwatch: { width: 10, height: 10, borderRadius: 3 },
  legendLabel: { color: theme.textMuted, fontSize: 10 },
  gateGrid: { flexDirection: "row", flexWrap: "wrap" },
  gateCell: {
    width: 38,
    height: 38,
    borderRadius: 8,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    margin: 3,
  },
  gateCellCompact: { width: 26, height: 26, borderRadius: 6, margin: 2, borderWidth: 1 },
  gateCellSelected: { borderColor: theme.text, borderWidth: 2 },
  gateCellText: { color: theme.textMuted, fontSize: 12, fontWeight: "600" },
  gateCellTextCompact: { fontSize: 9 },
  gateCellTextActive: { color: theme.text },
  gateCellTextOnAccent: { color: theme.background },
  gateBoth: { backgroundColor: theme.accent, borderColor: theme.accent },
  gatePersonality: { backgroundColor: theme.surface, borderColor: theme.accent },
  gateDesign: { backgroundColor: theme.surface, borderColor: theme.accentMuted },
  gateInactive: { backgroundColor: theme.background, borderColor: theme.border },
});

const GATE_STATE_STYLE: Record<GateState, object> = {
  both: styles.gateBoth,
  personality: styles.gatePersonality,
  design: styles.gateDesign,
  inactive: styles.gateInactive,
};
