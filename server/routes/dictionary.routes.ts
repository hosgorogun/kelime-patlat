import { Router } from "express";
import { getWordDefinition } from "../../shared/dictionary";
import { normalizeTr, normalizeTrUpper } from "../../shared/tr-utils";

export const dictionaryRouter = Router();

const MAX_DICTIONARY_CACHE = 2000;
const serverDictionaryCache = new Map<string, any>();

function setDictionaryCache(key: string, data: any) {
  if (serverDictionaryCache.size >= MAX_DICTIONARY_CACHE) {
    const oldestKey = serverDictionaryCache.keys().next().value;
    if (oldestKey) serverDictionaryCache.delete(oldestKey);
  }
  serverDictionaryCache.set(key, data);
}

dictionaryRouter.get("/:word", async (req, res) => {
  try {
    const rawWord = req.params.word;
    if (!rawWord || typeof rawWord !== "string") {
      return res.status(400).json({ error: "Kelime belirtilmedi" });
    }
    const clean = rawWord.trim();
    const trUpper = normalizeTrUpper(clean);

    if (serverDictionaryCache.has(trUpper)) {
      return res.json(serverDictionaryCache.get(trUpper));
    }

    // TDK GTS API sorgusu
    try {
      const tdkUrl = `https://sozluk.gov.tr/gts?ara=${encodeURIComponent(normalizeTr(clean))}`;
      const tdkRes = await fetch(tdkUrl, { headers: { "User-Agent": "KelimePatlat/1.0" } });
      if (tdkRes.ok) {
        const data = await tdkRes.json();
        if (Array.isArray(data) && data[0]?.anlamlarListe && data[0].anlamlarListe.length > 0) {
          const item = data[0];
          const definitions: string[] = item.anlamlarListe.map((a: any, idx: number) => {
            const type = a.ozelliklerListe?.[0]?.tam_adi ? `(${a.ozelliklerListe[0].tam_adi}) ` : "";
            return item.anlamlarListe.length > 1 ? `${idx + 1}. ${type}${a.anlam}` : `${type}${a.anlam}`;
          });
          const firstType = item.anlamlarListe[0]?.ozelliklerListe?.[0]?.tam_adi;
          const firstExample = item.anlamlarListe.find((a: any) => a.orneklerListe?.[0]?.ornek)?.orneklerListe?.[0]?.ornek;
          const fullDef = definitions.join("\n");

          const result = {
            word: trUpper,
            definition: fullDef,
            definitions,
            type: firstType,
            example: firstExample,
            source: "TDK",
          };
          setDictionaryCache(trUpper, result);
          return res.json(result);
        }
      }
    } catch {
      // TDK servisine ulaşılamadıysa yerel tanıma düş
    }

    const localDef = getWordDefinition(clean);
    const fallbackResult = {
      word: trUpper,
      definition: localDef,
      definitions: [localDef],
      source: "Yerel",
    };
    setDictionaryCache(trUpper, fallbackResult);
    return res.json(fallbackResult);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || "Sözlük hatası" });
  }
});
