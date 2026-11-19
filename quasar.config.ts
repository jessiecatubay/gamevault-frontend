import { configure } from "quasar/wrappers";

export default configure(() => ({
  boot: ["api"],
  css: ["app.scss"],
  extras: ["material-icons"],
  build: {
    target: {
      browser: ["es2022", "edge115", "firefox115", "chrome115", "safari14"],
      node: "node20",
    },
    typescript: {
      strict: true,
      vueShim: true,
    },
  },
  devServer: {
    open: true,
    port: 9000,
  },
  framework: {
    config: {
      dark: true,
      brand: {
        primary: "#7c83ff",
        secondary: "#36c6a8",
        accent: "#ffc857",
        dark: "#0d1117",
        positive: "#42d392",
        negative: "#ff6b7a",
        info: "#60a5fa",
        warning: "#ffc857",
      },
    },
    plugins: ["Notify", "Dialog"],
  },
  animations: [],
}));
