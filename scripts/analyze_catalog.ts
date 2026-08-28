import catalog from "../data/word-catalog.json";

const words = (catalog as any).words;
console.log("Total words in catalog:", words.length);

const difficulties: Record<string, number> = {};
const lengths: Record<number, number> = {};
const weights: Record<number, number> = {};

for (const entry of words) {
  difficulties[entry.difficulty] = (difficulties[entry.difficulty] || 0) + 1;
  const len = entry.word.length;
  lengths[len] = (lengths[len] || 0) + 1;
  weights[entry.weight] = (weights[entry.weight] || 0) + 1;
}

console.log("Difficulties:", difficulties);
console.log("Lengths:", lengths);
console.log("Weights:", weights);
