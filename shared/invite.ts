export function normalizeRoomCode(value: unknown) {
  if (typeof value !== "string") return null;
  const code = value.trim().toUpperCase();
  return /^[A-Z0-9]{5}$/.test(code) ? code : null;
}

export function inviteMessage(code: string, url: string) {
  return `Kelime Patlat'ta benimle düelloya katıl. Oda kodu: ${code}\n${url}`;
}
