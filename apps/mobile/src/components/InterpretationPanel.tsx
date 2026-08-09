import React from "react";
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import type { InterpretationResult } from "@inner/shared";
import { theme } from "../theme";

interface Props {
  visible: boolean;
  loading: boolean;
  result: InterpretationResult | null;
  onClose: () => void;
}

export function InterpretationPanel({ visible, loading, result, onClose }: Props) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          {loading || !result ? (
            <ActivityIndicator color={theme.accent} />
          ) : (
            <>
              <Text style={styles.headline}>{result.headline}</Text>
              <Text style={styles.body}>{result.body}</Text>
            </>
          )}
          <Pressable style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Close</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  sheet: {
    backgroundColor: theme.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    minHeight: 180,
  },
  headline: { color: theme.text, fontSize: 20, fontWeight: "600", marginBottom: 12 },
  body: { color: theme.textMuted, fontSize: 16, lineHeight: 22 },
  closeButton: { marginTop: 20, alignSelf: "flex-start" },
  closeButtonText: { color: theme.accent, fontSize: 16 },
});
