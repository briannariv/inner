// Simplified list/grid-style bodygraph, not a true 9-center diagram. A real
// bodygraph layout is a deliberately distinct visual design task (partly to
// stay clear of Jovian Archive's proprietary chart artwork — see SPEC.md
// §4/§6 IP flag). The 64-gate grid below is numeric/list-based for the same
// reason, while still surfacing every gate and its activation state.
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { HDChart, HDCenterName } from "@inner/shared";
import { theme } from "../theme";
import { GateGrid } from "./GateGrid";

interface Props {
  chart: HDChart;
  selectedCenter?: HDCenterName | null;
  onSelectCenter: (center: HDCenterName) => void;
  selectedGate?: number | null;
  onSelectGate: (gate: number) => void;
  onSelectChannel: (gates: [number, number]) => void;
}

export function Bodygraph({ chart, selectedCenter, onSelectCenter, selectedGate, onSelectGate, onSelectChannel }: Props) {
  const definedChannels = chart.channels.filter((c) => c.defined);

  return (
    <View>
      <View style={styles.summaryCard}>
        <Text style={styles.summaryType}>{chart.type}</Text>
        <Text style={styles.summaryLine}>{chart.profile} Profile · {chart.authority} Authority</Text>
        <Text style={styles.summaryStrategy}>Strategy: {chart.strategy}</Text>
      </View>

      <Text style={styles.sectionLabel}>Centers</Text>
      {chart.centers.map((center) => {
        const isSelected = selectedCenter === center.name;
        return (
          <Pressable
            key={center.name}
            onPress={() => onSelectCenter(center.name)}
            style={[styles.centerRow, isSelected && styles.centerRowSelected]}
          >
            <View
              style={[
                styles.dot,
                { backgroundColor: center.defined ? theme.definedCenter : theme.undefinedCenter },
              ]}
            />
            <Text style={styles.centerName}>{center.name}</Text>
            <Text style={styles.centerState}>{center.defined ? "Defined" : "Open"}</Text>
          </Pressable>
        );
      })}

      <Text style={styles.sectionLabel}>All 64 gates</Text>
      <GateGrid gates={chart.gates} selectedGate={selectedGate} onSelectGate={onSelectGate} />

      <Text style={styles.sectionLabel}>Defined channels ({definedChannels.length})</Text>
      <View style={styles.list}>
        {definedChannels.length === 0 && (
          <Text style={styles.emptyText}>
            No full channels defined — any activated gates you have aren't currently paired with their other half.
          </Text>
        )}
        {definedChannels.map((c) => (
          <Pressable key={c.gates.join("-")} style={styles.row} onPress={() => onSelectChannel(c.gates)}>
            <Text style={styles.rowText}>{c.name}</Text>
            <Text style={styles.rowMeta}>{c.gates[0]}–{c.gates[1]}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  summaryCard: {
    backgroundColor: theme.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  summaryType: { color: theme.text, fontSize: 20, fontWeight: "600" },
  summaryLine: { color: theme.textMuted, marginTop: 4 },
  summaryStrategy: { color: theme.accent, marginTop: 8 },
  sectionLabel: { color: theme.text, fontWeight: "700", fontSize: 14, marginTop: 20, marginBottom: 8 },
  centerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  centerRowSelected: { backgroundColor: theme.surface, borderRadius: 8 },
  dot: { width: 12, height: 12, borderRadius: 6, marginRight: 12 },
  centerName: { color: theme.text, flex: 1, fontSize: 16 },
  centerState: { color: theme.textMuted },
  list: { width: "100%", borderTopWidth: 1, borderTopColor: theme.border },
  emptyText: { color: theme.textMuted, fontSize: 13, paddingVertical: 12 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 11,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  rowText: { color: theme.text, fontSize: 13 },
  rowMeta: { color: theme.textMuted, fontSize: 12 },
});
