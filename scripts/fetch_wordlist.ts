import catalog from "../data/word-catalog.json";

const words = (catalog as any).words;
const threeLetterWords = words.filter((e: any) => e.word.length === 3).map((e: any) => e.word);
console.log(JSON.stringify(threeLetterWords));
