export interface LrcLine {
  time: number; // dalam detik
  text: string;
}

const TIME_TAG = /\[(\d{1,3}):(\d{2}(?:\.\d{1,3})?)\]/g;

export function parseLrc(raw: string): LrcLine[] {
  const lines: LrcLine[] = [];
  const rawLines = raw.split(/\r?\n/);

  for (const line of rawLines) {
    const tags = [...line.matchAll(TIME_TAG)];
    if (tags.length === 0) continue;

    const text = line.replace(TIME_TAG, "").trim();
    for (const tag of tags) {
      const minutes = parseInt(tag[1], 10);
      const seconds = parseFloat(tag[2]);
      lines.push({ time: minutes * 60 + seconds, text });
    }
  }

  return lines.sort((a, b) => a.time - b.time);
}