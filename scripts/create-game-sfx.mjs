import { mkdirSync, writeFileSync } from "node:fs";

const sampleRate = 44100;
const outDir = new URL("../assets/sounds/", import.meta.url);
mkdirSync(outDir, { recursive: true });

function wave({ name, duration, notes, noise = 0, gain = 0.36 }) {
  const frames = Math.floor(sampleRate * duration);
  const data = Buffer.alloc(frames * 2);
  for (let frame = 0; frame < frames; frame += 1) {
    const time = frame / sampleRate;
    let sample = 0;
    for (const note of notes) {
      if (time < note.start || time > note.start + note.length) continue;
      const local = time - note.start;
      const envelope = Math.min(1, local / 0.012) * Math.max(0, 1 - local / note.length) ** 1.75;
      sample += Math.sin(Math.PI * 2 * note.frequency * local) * envelope * (note.gain ?? 1);
      sample += Math.sin(Math.PI * 2 * note.frequency * 2.01 * local) * envelope * 0.14 * (note.gain ?? 1);
    }
    if (noise && time < 0.05) sample += (Math.sin(frame * 12.9898) * 43758.5453 % 1 - 0.5) * noise;
    const value = Math.max(-1, Math.min(1, sample * gain));
    data.writeInt16LE(Math.round(value * 32767), frame * 2);
  }
  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + data.length, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write("data", 36);
  header.writeUInt32LE(data.length, 40);
  writeFileSync(new URL(`${name}.wav`, outDir), Buffer.concat([header, data]));
}

wave({ name: "select", duration: 0.12, notes: [{ start: 0, length: 0.11, frequency: 660 }], gain: 0.16 });
wave({ name: "accepted", duration: 0.42, notes: [{ start: 0, length: 0.17, frequency: 740 }, { start: 0.12, length: 0.27, frequency: 1047 }], gain: 0.27 });
wave({ name: "rejected", duration: 0.32, notes: [{ start: 0, length: 0.15, frequency: 310 }, { start: 0.13, length: 0.17, frequency: 208 }], noise: 0.05, gain: 0.25 });
wave({ name: "victory", duration: 0.95, notes: [{ start: 0, length: 0.25, frequency: 523 }, { start: 0.14, length: 0.28, frequency: 659 }, { start: 0.3, length: 0.3, frequency: 784 }, { start: 0.48, length: 0.43, frequency: 1047 }], gain: 0.25 });
