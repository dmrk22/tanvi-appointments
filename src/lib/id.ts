// no 0/O/1/I
const ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

export function ticketId() {
  let s = "";
  for (let i = 0; i < 4; i++) s += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  return `LOVE-${s}`;
}
