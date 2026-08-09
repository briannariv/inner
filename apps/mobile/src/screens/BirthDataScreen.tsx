// The first-screen slice from SPEC.md: enter birth data -> see your
// interactive chart. Location entry is a plain lat/lon text form for now —
// a real city-search/geocoding field is a follow-up task, not needed to
// prove the end-to-end flow.
import React, { useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation";
import { getChartBundle } from "../api/client";
import { theme } from "../theme";
import { PrimaryButton } from "../components/PrimaryButton";

type Props = NativeStackScreenProps<RootStackParamList, "BirthData">;

export function BirthDataScreen({ navigation }: Props) {
  const [date, setDate] = useState("1994-03-21");
  const [time, setTime] = useState("14:30");
  const [timeUnknown, setTimeUnknown] = useState(false);
  const [locationName, setLocationName] = useState("Barcelona, Spain");
  const [lat, setLat] = useState("41.38");
  const [lon, setLon] = useState("2.17");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setError(null);
    const parsedLat = Number(lat);
    const parsedLon = Number(lon);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      setError("Date must be in YYYY-MM-DD format.");
      return;
    }
    if (!timeUnknown && !/^\d{2}:\d{2}$/.test(time)) {
      setError("Time must be in HH:MM (24h) format, or toggle 'unknown time'.");
      return;
    }
    if (Number.isNaN(parsedLat) || Number.isNaN(parsedLon)) {
      setError("Latitude/longitude must be numbers.");
      return;
    }

    setLoading(true);
    try {
      const bundle = await getChartBundle({
        date,
        time: timeUnknown ? null : time,
        location: { name: locationName, lat: parsedLat, lon: parsedLon },
      });
      navigation.navigate("Chart", { bundle });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong generating your chart.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Your birth data</Text>
      <Text style={styles.subtitle}>Used to generate your natal chart and Human Design bodygraph together.</Text>

      <Field label="Birth date (YYYY-MM-DD)" value={date} onChangeText={setDate} placeholder="1994-03-21" />

      <View style={styles.row}>
        <Text style={styles.switchLabel}>I don't know my exact birth time</Text>
        <Switch value={timeUnknown} onValueChange={setTimeUnknown} />
      </View>
      {!timeUnknown && (
        <Field label="Birth time (24h, HH:MM)" value={time} onChangeText={setTime} placeholder="14:30" />
      )}

      <Field label="Birth place" value={locationName} onChangeText={setLocationName} placeholder="City, Country" />
      <View style={styles.row}>
        <View style={styles.half}>
          <Field label="Latitude" value={lat} onChangeText={setLat} keyboardType="numeric" />
        </View>
        <View style={styles.half}>
          <Field label="Longitude" value={lon} onChangeText={setLon} keyboardType="numeric" />
        </View>
      </View>

      {error && <Text style={styles.error}>{error}</Text>}

      {loading ? (
        <ActivityIndicator color={theme.accent} style={styles.loader} />
      ) : (
        <PrimaryButton label="Generate my chart" onPress={handleSubmit} />
      )}
    </ScrollView>
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
      <Text style={styles.label}>{props.label}</Text>
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
  container: { flex: 1, backgroundColor: theme.background },
  content: { padding: 24, paddingTop: 64 },
  title: { color: theme.text, fontSize: 28, fontWeight: "700" },
  subtitle: { color: theme.textMuted, marginTop: 8, marginBottom: 24, fontSize: 15 },
  field: { marginBottom: 16, flex: 1 },
  label: { color: theme.textMuted, marginBottom: 6, fontSize: 13 },
  input: {
    backgroundColor: theme.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.border,
    color: theme.text,
    padding: 12,
    fontSize: 16,
  },
  row: { flexDirection: "row", alignItems: "center", marginBottom: 16, gap: 12 },
  half: { flex: 1 },
  switchLabel: { color: theme.text, flex: 1 },
  error: { color: "#FF8080", marginBottom: 16 },
  loader: { marginTop: 12 },
});
