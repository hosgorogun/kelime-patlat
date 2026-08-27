const { spawn } = require("child_process");

console.log("[Launcher] Proje geliştirme ortamı başlatılıyor...");

// Sunucu sürecini başlat (girdi kilitlemesini önlemek için stdin yoksayılır)
const server = spawn(process.platform === "win32" ? "npm.cmd" : "npm", ["run", "dev:server"], {
  stdio: ["ignore", "inherit", "inherit"],
  shell: true,
});

const isAndroid = process.argv.includes("--android");
const metroArgs = isAndroid
  ? ["expo", "start", "--android"]
  : ["expo", "start", "--web", "--port", "8082"];

// Metro/Expo sürecini başlat
const metro = spawn(process.platform === "win32" ? "npx.cmd" : "npx", metroArgs, {
  stdio: "inherit",
  shell: true,
});

const cleanExit = () => {
  try {
    server.kill("SIGINT");
  } catch (e) {}
  try {
    metro.kill("SIGINT");
  } catch (e) {}
  process.exit();
};

process.on("SIGINT", cleanExit);
process.on("SIGTERM", cleanExit);

server.on("exit", (code) => {
  if (code !== 0 && code !== null) {
    cleanExit();
  }
});

metro.on("exit", (code) => {
  if (code !== 0 && code !== null) {
    cleanExit();
  }
});
