/**
 * Static asset bindings for store items and cosmetic equipment.
 * Kept in components/ presentation layer to protect shared/ domain logic
 * from bundler dependencies and Node test runner execution.
 */

let STORE_ASSETS: Record<string, any> = {};

try {
  STORE_ASSETS = {
    lives: require("../assets/store-assets/lives.jpg"),
    radar: require("../assets/store-assets/radar.jpg"),
    shield: require("../assets/store-assets/shield.jpg"),
    xp: require("../assets/store-assets/xp.jpg"),
    effect_pulse: require("../assets/store-assets/effect_pulse.jpg"),
    effect_glitch: require("../assets/store-assets/effect_glitch.jpg"),
    effect_flare: require("../assets/store-assets/effect_flare.jpg"),
    effect_lightning: require("../assets/store-assets/effect_lightning.jpg"),
    effect_fireworks: require("../assets/store-assets/effect_fireworks.jpg"),
    skin_grid: require("../assets/store-assets/skin_grid.jpg"),
    skin_night: require("../assets/store-assets/skin_night.jpg"),
    skin_ember: require("../assets/store-assets/skin_ember.jpg"),
    skin_gold_grid: require("../assets/store-assets/skin_gold_grid.jpg"),
  };
} catch {
  // Safe fallback for Node.js / Vitest unit test environments
  STORE_ASSETS = {};
}

export { STORE_ASSETS };
