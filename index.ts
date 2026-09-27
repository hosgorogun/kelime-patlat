import { registerRootComponent } from "expo";
import App from "./App";

// Development-only, fixture-based review; the normal application keeps its auth flow.
const Root =
  __DEV__ &&
  typeof location !== "undefined" &&
  new URLSearchParams(location.search).get("preview") === "design"
    ? require("./components/design-preview").default
    : App;
registerRootComponent(Root);
