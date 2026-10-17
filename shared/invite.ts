export function normalizeRoomCode(value: unknown) {
  if (typeof value !== "string") return null;
  const code = value.trim().replace(/i/g, "I").replace(/ı/g, "I").replace(/İ/g, "I").toUpperCase();
  return /^[A-Z0-9]{5}$/.test(code) ? code : null;
}

export function inviteMessage(code: string, url: string) {
  return `Kelime Patlat'ta benimle düelloya katıl! 💥\nÖzel Oda Kodum: ${code}\nKatılmak için tıkla: ${url}\n(Uygulama açıldığında oda kodunu girerek de doğrudan katılabilirsin!)`;
}
