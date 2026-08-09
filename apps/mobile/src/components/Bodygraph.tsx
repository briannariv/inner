// Simplified list-style bodygraph, not a true 9-center diagram. A real
// bodygraph layout is a deliberately distinct visual design task (partly to
// stay clear of Jovian Archive's proprietary chart artwork — see SPEC.md
// §4/§6 IP flag), left as follow-up work once the interaction model here is
// validated.
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { HDChart, HDCenterName } from "@inner/shared";
import { theme } from "../theme";

interface Props {
  chart: HDChart;
  selectedCenter?: HDCenterName | null;
  onSelectCenter: (center: HDCenterName) => void;
}

export function Bodygraph({ chart, selectedCenter, onSelectCenter }: Props) {
  return (
    <View>
      <View style={styles.summaryCard}>
        <Text style={styles.summaryType}>{chart.type}</Text>
        <Text style={styles.summaryLine}>{chart.profile} Profile · {chart.authority} Authority</Text>
        <Text style={styles.summaryStrategy}>Strategy: {chart.strategy}</Text>
      </View>

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
});
