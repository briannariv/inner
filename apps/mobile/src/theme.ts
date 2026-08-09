// Matches the wireframe artifact's dark B&W palette (see the artifact's
// :root[data-theme="dark"] tokens) — deliberately no accent hue. "accent"
// here means the same thing it means there: near-white used for
// interactive/selected state, not a color identity. Swap these values
// (not the call sites) if/when a real brand palette replaces this MVP pass.
export const theme = {
  background: "#0A0A0A",
  surface: "#161616",
  border: "#2A2A2A",
  text: "#F2F2F2",
  textMuted: "#A0A0A0",
  accent: "#F2F2F2",
  accentMuted: "#656565",
  definedCenter: "#F2F2F2",
  undefinedCenter: "#2A2A2A",
};
