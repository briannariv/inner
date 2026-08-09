// Self-contained: owns its own person-B form + result state so ChartScreen
// only has to wire in "who am I" and "where should tapped details go."
// No persisted friends list yet (SPEC.md's social layer isn't built) — this
// is ad-hoc, one birth data set at a time, same pattern as electional
// astrology's "just enter a moment" flow.
import React, { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import type { BirthData, CompatibilityResult, HDConnectionChannel } from "@inner/shared";
import { getHDGateProfile } from "@inner/shared";
import { getCompatibility, getInterpretation } from "../api/client";
import { theme } from "../theme";
import { GateGrid } from "./GateGrid";
import { PrimaryButton } from "./PrimaryButton";

const CONNECTION_TYPE_LABEL: Record<HDConnectionChannel["type"], string> = {
  electromagnetic: "Electromagnetic",
  companionship: "Companionship",
  dominance: "Dominance",
};

const CONNECTION_TYPE_EXPLANATION: Record<HDConnectionChannel["type"], string> = {
  electromagnetic:
    "Neither of you has this channel alone — together your two gates complete it. The classic signature of " +
    "magnetic attraction: a connection that only exists between you.",
  companionship:
    "You both carry this full channel independently. Comfortable, shared ground — you don't need each other " +
    "to access this energy, but you both bring the same thing to the table.",
  dominance:
    "One of you has this channel fully defined; the other has neither gate. The energy runs one direction — " +
    "one of you consistently supplies it for the pair.",
};

function describeConnection(nameA: string, nameB: string, c: HDConnectionChannel): string {
  const [gateA, gateB] = c.gates;
  const profileA = getHDGateProfile(gateA);
  const profileB = getHDGateProfile(gateB);
  const gateClause = profileA && profileB
    ? `Gate ${gateA} (${profileA.name}) and Gate ${gateB} (${profileB.name}) together. `
    : "";
  const who = c.type === "dominance" ? (c.dominantPerson === "A" ? nameA : nameB) : null;
  const dominanceClause = who ? ` In this pairing, that's ${who}.` : "";
  return `${gateClause}${CONNECTION_TYPE_EXPLANATION[c.type]}${dominanceClause}`;
}

interface Props {
  myName: string;
  myBirthData: BirthData;
  onShowDetail: (headline: string, body: string) => void;
}

export function CompatibilityView({ myName, myBirthData, onShowDetail }: Props) {
  const [name, setName] = useState("Kat");
  const [date, setDate] = useState("1998-05-14");
  const [time, setTime] = useState("09:11");
  const [locationName, setLocationName] = useState("Gołdap, Poland");
  const [lat, setLat] = useState("54.3325");
  const [lon, setLon] = useState("22.3053");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CompatibilityResult | null>(null);
  const [selectedGateA, setSelectedGateA] = useState<number | null>(null);
  const [selectedGateB, setSelectedGateB] = useState<number | null>(null);

  async function handleCalculate() {
    setError(null);
    const parsedLat = Number(lat);
    const parsedLon = Number(lon);
    if (!name.trim()) {
      setError("Enter a name.");
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      setError("Date must be YYYY-MM-DD.");
      return;
    }
    if (!/^\d{2}:\d{2}$/.test(time)) {
      setError("Time must be HH:MM (24h).");
      return;
    }
    if (Number.isNaN(parsedLat) || Number.isNaN(parsedLon)) {
      setError("Latitude/longitude must be numbers.");
      return;
    }

    setLoading(true);
    try {
      const res = await getCompatibility({
        personA: { name: myName, birthData: myBirthData },
        personB: {
          name: name.trim(),
          birthData: { date, time, location: { name: locationName || name.trim(), lat: parsedLat, lon: parsedLon } },
        },
      });
      setResult(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't calculate compatibility.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSelectGate(who: "A" | "B", gate: number) {
    if (!result) return;
    const chart = who === "A" ? result.personA.chart : result.personB.chart;
    (who === "A" ? setSelectedGateA : setSelectedGateB)(gate);
    onShowDetail("Loading…", "");
    const interp = await getInterpretation({ chart, focus: { kind: "hdGate", gate } });
    const whoName = who === "A" ? result.personA.name : result.personB.name;
    onShowDetail(`${whoName} — ${interp.headline}`, interp.body);
  }

  if (result) {
    const harmonious = result.synastryAspects.filter((a) => a.type === "trine" || a.type === "sextile").length;
    const challenging = result.synastryAspects.filter((a) => a.type === "square" || a.type === "opposition").length;

    return (
      <View style={styles.full}>
        <Pressable
          style={styles.summaryCard}
          onPress={() => onShowDetail(result.summary.headline, result.summary.body)}
        >
          <Text style={styles.summaryTitle}>{result.summary.headline}</Text>
          <Text style={styles.summaryMeta}>
            {result.synastryAspects.length} aspects · {harmonious} flowing · {challenging} friction · {result.hdConnections.length} HD connections
          </Text>
          <Text style={styles.summaryTap}>Tap for full read →</Text>
        </Pressable>

        <Text style={styles.sectionLabel}>Human Design connections</Text>
        <View style={styles.list}>
          {result.hdConnections.length === 0 && (
            <Text style={styles.emptyText}>No direct HD channel connections between you.</Text>
          )}
          {result.hdConnections.map((c) => (
            <Pressable
              key={c.gates.join("-")}
              style={styles.row}
              onPress={() =>
                onShowDetail(
                  `${c.name} — ${CONNECTION_TYPE_LABEL[c.type]}`,
                  describeConnection(result.personA.name, result.personB.name, c)
                )
              }
            >
              <Text style={styles.rowText}>{c.name}</Text>
              <Text style={styles.rowMeta}>{CONNECTION_TYPE_LABEL[c.type]}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.sectionLabel}>Synastry aspects</Text>
        <View style={styles.list}>
          {result.synastryAspects.map((a, i) => (
            <View key={`${a.a}-${a.b}-${i}`} style={styles.row}>
              <Text style={styles.rowText}>{a.a} · {a.type} · {a.b}</Text>
              <Text style={styles.rowMeta}>{a.orb.toFixed(1)}°</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionLabel}>{result.personA.name}'s full gate chart</Text>
        <GateGrid gates={result.personA.chart.humanDesign.gates} selectedGate={selectedGateA} onSelectGate={(g) => handleSelectGate("A", g)} compact />

        <Text style={[styles.sectionLabel, styles.secondGridLabel]}>{result.personB.name}'s full gate chart</Text>
        <GateGrid gates={result.personB.chart.humanDesign.gates} selectedGate={selectedGateB} onSelectGate={(g) => handleSelectGate("B", g)} compact />

        <Pressable style={styles.resetButton} onPress={() => setResult(null)}>
          <Text style={styles.resetButtonText}>Check compatibility with someone else</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.full}>
      <Text style={styles.hint}>Enter their birth data to run real synastry + Human Design connection analysis against your chart.</Text>
      <Field label="Name" value={name} onChangeText={setName} placeholder="Their name" />
      <Field label="Birth date (YYYY-MM-DD)" value={date} onChangeText={setDate} />
      <Field label="Birth time (24h, HH:MM)" value={time} onChangeText={setTime} />
      <Field label="Birth place" value={locationName} onChangeText={setLocationName} />
      <View style={styles.row2}>
        <View style={styles.half}>
          <Field label="Latitude" value={lat} onChangeText={setLat} keyboardType="numeric" />
        </View>
        <View style={styles.half}>
          <Field label="Longitude" value={lon} onChangeText={setLon} keyboardType="numeric" />
        </View>
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
      {loading ? (
        <ActivityIndicator color={theme.accent} style={styles.loader} />
      ) : (
        <PrimaryButton label="Calculate compatibility" onPress={handleCalculate} />
      )}
    </View>
  );
}

function Field(props: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: "default" | "numeric";
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{props.label}</Text>
      <TextInput
        style={styles.input}
        value={props.value}
        onChangeText={props.onChangeText}
        placeholder={props.placeholder}
        placeholderTextColor={theme.textMuted}
        keyboardType={props.keyboardType}
        autoCapitalize="none"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  full: { width: "100%" },
  hint: { color: theme.textMuted, fontSize: 13, marginBottom: 16, textAlign: "center" },
  field: { marginBottom: 14 },
  fieldLabel: { color: theme.textMuted, marginBottom: 6, fontSize: 12 },
  input: {
    backgroundColor: theme.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.border,
    color: theme.text,
    padding: 11,
    fontSize: 15,
  },
  row2: { flexDirection: "row", gap: 12 },
  half: { flex: 1 },
  errorText: { color: "#FF8080", marginBottom: 12, fontSize: 13 },
  loader: { marginTop: 8 },
  summaryCard: {
    backgroundColor: theme.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  summaryTitle: { color: theme.text, fontSize: 18, fontWeight: "700" },
  summaryMeta: { color: theme.textMuted, marginTop: 6, fontSize: 12 },
  summaryTap: { color: theme.accent, marginTop: 10, fontSize: 11 },
  sectionLabel: { color: theme.text, fontWeight: "700", fontSize: 14, marginBottom: 6, alignSelf: "flex-start" },
  secondGridLabel: { marginTop: 16 },
  list: { width: "100%", borderTopWidth: 1, borderTopColor: theme.border, marginBottom: 20 },
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
  resetButton: { alignSelf: "center", marginTop: 20, marginBottom: 20 },
  resetButtonText: { color: theme.accent, fontSize: 13 },
});
