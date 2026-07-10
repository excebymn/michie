// mountScheduler.ts
// Modul singleton (bukan hook) yang ngatur berapa banyak widget preview yang
// boleh "hidup" (mounted & jalan) bersamaan di WidgetTray. Widget preview di
// sini kebanyakan visualizer yang narik audio real-time dari Rust TapSource
// + punya canvas render loop sendiri-sendiri — kalau semua tile yang
// kelihatan di layar langsung di-mount serentak, itu jadi N canvas loop + N
// audio tap subscriber nyala bareng, padahal yang user lihat dalam sekali
// pandang cuma sebagian kecil dari grid.
//
// Aturan main:
// - Maksimal MAX_CONCURRENT tile yang boleh mounted bersamaan (nge-cap
//   beban steady-state, bukan cuma nunda beban puncak).
// - Antrian FIFO biasa buat tile yang baru masuk viewport.
// - Hover "motong antrian" (prioritas) supaya widget yang lagi ditunjuk user
//   kerasa instan, gak nunggu giliran.
// - Begitu slot kosong (ada yang release karena keluar viewport/unmount),
//   request paling depan di antrian langsung dikasih giliran.

type Listener = () => void;

const MAX_CONCURRENT = 3;
const STAGGER_MS = 220; // jeda minimal antar-grant biar gak mount serentak

const active = new Set<string>();
const queue: string[] = [];
const waiters = new Map<string, Listener[]>();
let lastGrantAt = 0;
let timerId: ReturnType<typeof setTimeout> | null = null;

function notify(id: string) {
  const cbs = waiters.get(id);
  if (!cbs) return;
  waiters.delete(id);
  cbs.forEach((cb) => cb());
}

function scheduleProcess() {
  if (timerId) return;
  const elapsed = Date.now() - lastGrantAt;
  const delay = Math.max(0, STAGGER_MS - elapsed);
  timerId = setTimeout(() => {
    timerId = null;
    processQueue();
  }, delay);
}

function processQueue() {
  if (active.size >= MAX_CONCURRENT) return;
  const nextId = queue.shift();
  if (!nextId) return;
  active.add(nextId);
  lastGrantAt = Date.now();
  notify(nextId);
  if (queue.length > 0) scheduleProcess();
}

// Minta giliran mount untuk `id`. Resolve begitu slot tersedia (bisa
// langsung, bisa nunggu antrian). `priority=true` (dipakai hover) majuin
// posisi ke depan antrian kalau belum dapat giliran.
export function requestMount(id: string, priority = false): Promise<void> {
  return new Promise((resolve) => {
    if (active.has(id)) {
      resolve();
      return;
    }

    const idx = queue.indexOf(id);
    if (idx === -1) {
      if (priority) queue.unshift(id);
      else queue.push(id);
    } else if (priority && idx > 0) {
      queue.splice(idx, 1);
      queue.unshift(id);
    }

    const cbs = waiters.get(id) ?? [];
    cbs.push(resolve);
    waiters.set(id, cbs);
    scheduleProcess();
  });
}

// Lepas slot/antrian punya `id` — dipanggil pas tile keluar viewport atau
// unmount, supaya slotnya langsung dikasih ke tile lain yang nunggu.
export function releaseMount(id: string) {
  active.delete(id);
  const idx = queue.indexOf(id);
  if (idx !== -1) queue.splice(idx, 1);
  waiters.delete(id);
  scheduleProcess();
}