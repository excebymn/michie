// Normalisasi KeyboardEvent -> string kombinasi shortcut, mis. "Ctrl+ArrowRight", "Space", "L".
// Pakai e.code (bukan e.key) supaya independen dari layout keyboard (QWERTY/AZERTY/dll).

const FRIENDLY_CODE: Record<string, string> = {
  Space: "Space",
  ArrowUp: "ArrowUp",
  ArrowDown: "ArrowDown",
  ArrowLeft: "ArrowLeft",
  ArrowRight: "ArrowRight",
  Escape: "Escape",
  Comma: ",",
  Period: ".",
  Slash: "/",
};

function mainKeyFromCode(code: string): string {
  if (FRIENDLY_CODE[code]) return FRIENDLY_CODE[code];
  if (code.startsWith("Key")) return code.slice(3); // KeyS -> S
  if (code.startsWith("Digit")) return code.slice(5); // Digit1 -> 1
  return code;
}

/**
 * Return null kalau event ini cuma modifier ditekan sendirian (masih nunggu
 * tombol utama), supaya proses "record kombinasi baru" gak nyimpen state
 * setengah jadi kayak cuma "Ctrl".
 */
export function eventToCombo(e: KeyboardEvent): string | null {
  if (["Control", "Shift", "Alt", "Meta"].includes(e.key)) return null;

  const parts: string[] = [];
  if (e.ctrlKey) parts.push("Ctrl");
  if (e.altKey) parts.push("Alt");
  if (e.shiftKey) parts.push("Shift");
  if (e.metaKey) parts.push("Meta");
  parts.push(mainKeyFromCode(e.code));

  return parts.join("+");
}

/** True kalau target event adalah input teks — dipakai buat skip global shortcut saat user lagi ngetik. */
export function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || target.isContentEditable;
}