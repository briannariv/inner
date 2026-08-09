// Written out explicitly (rather than `import "expo/AppEntry"`) because
// that shortcut resolves `../../App` relative to wherever `expo` itself is
// installed — which in an npm-workspaces monorepo is the hoisted root
// node_modules, not apps/mobile. Importing App directly here sidesteps that.
import { registerRootComponent } from "expo";
import App from "./App";

registerRootComponent(App);
