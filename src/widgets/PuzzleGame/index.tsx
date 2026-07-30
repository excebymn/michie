import React, { useEffect, useRef, useState } from 'react';
import { usePlayerStore } from '../../stores/playerStore';
import { toAssetUrl } from '../../utils/assetURL';

const GRID_SIZE = 3;
const TILE_COUNT = GRID_SIZE * GRID_SIZE;

// Bikin array 0..8 lalu diacak (Fisher-Yates), dijamin bukan urutan benar
// (kalau kebetulan hasil acaknya sudah urut, acak ulang sekali lagi).
function createShuffledTiles(): number[] {
  const values = Array.from({ length: TILE_COUNT }, (_, i) => i);

  const shuffle = (arr: number[]) => {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  };

  let shuffled = shuffle(values);
  const isSolved = shuffled.every((v, i) => v === i);
  if (isSolved) shuffled = shuffle(values);

  return shuffled;
}

// Hitung transform buat nge-crop potongan gambar yang benar di dalam tile,
// pakai <img> + transform (bukan CSS background-image) — supaya path cover
// yang mengandung spasi/karakter aneh nggak bikin gambar gagal render kayak
// yang kemarin kejadian waktu masih pakai `url(...)` tanpa quote.
function imageTransformFor(value: number): string {
  const col = value % GRID_SIZE;
  const row = Math.floor(value / GRID_SIZE);
  // Translate dalam persen RELATIF ke ukuran img sendiri (img-nya 300% dari
  // tile), jadi -33.333% × col/row = geser tepat satu petak per langkah,
  // berapa pun ukuran piksel aktual widget-nya.
  const shiftX = (col * 100) / GRID_SIZE;
  const shiftY = (row * 100) / GRID_SIZE;
  return `translate(-${shiftX}%, -${shiftY}%)`;
}

export const CoverArtPuzzleWidget: React.FC = () => {
  const currentSong = usePlayerStore((state) => state.currentSong);

  const [tiles, setTiles] = useState<number[]>(() => createShuffledTiles());
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [solvedCount, setSolvedCount] = useState<number>(0);
  const [justSolved, setJustSolved] = useState<boolean>(false);
  const [imgFailed, setImgFailed] = useState<boolean>(false);

  const reshuffleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const coverSrc = toAssetUrl(currentSong?.cover) ?? toAssetUrl(currentSong?.path) ?? '';

  // Ganti lagu -> puzzle baru dari cover yang baru, skor solve direset,
  // dan batalkan timer reshuffle lama kalau ada yang masih nunggu.
  useEffect(() => {
    setTiles(createShuffledTiles());
    setSelectedIndex(null);
    setSolvedCount(0);
    setJustSolved(false);
    setImgFailed(false);
    if (reshuffleTimeoutRef.current) clearTimeout(reshuffleTimeoutRef.current);
  }, [currentSong?.path]);

  useEffect(() => {
    return () => {
      if (reshuffleTimeoutRef.current) clearTimeout(reshuffleTimeoutRef.current);
    };
  }, []);

  function handleTileClick(index: number) {
    if (justSolved) return; // Lagi nunjukin hasil solved, tunda input dulu

    if (selectedIndex === null) {
      setSelectedIndex(index);
      return;
    }

    if (selectedIndex === index) {
      setSelectedIndex(null); // Klik tile yang sama = batal pilih
      return;
    }

    setTiles((prev) => {
      const next = [...prev];
      [next[selectedIndex], next[index]] = [next[index], next[selectedIndex]];

      const solved = next.every((v, i) => v === i);
      if (solved) {
        setSolvedCount((s) => s + 1);
        setJustSolved(true);
        reshuffleTimeoutRef.current = setTimeout(() => {
          setTiles(createShuffledTiles());
          setJustSolved(false);
        }, 1400);
      }

      return next;
    });

    setSelectedIndex(null);
  }

  return (
    <div
      className="michie-box"
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        minHeight: '260px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '14px',
        boxSizing: 'border-box',
        gap: '10px'
      }}
    >
      {/* Skor solve di pojok kiri atas, konsisten sama widget lain */}
      <div
        className="michie-text-primary"
        style={{
          position: 'absolute',
          top: '12px',
          left: '14px',
          fontSize: '13px',
          fontWeight: 'bold',
          zIndex: 10,
          opacity: 0.85,
          letterSpacing: '0.05em'
        }}
      >
        SOLVED: {solvedCount}
      </div>

      <div
        className="michie-border-primary"
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
          gridTemplateRows: `repeat(${GRID_SIZE}, 1fr)`,
          gap: '3px',
          width: '200px',
          height: '200px',
          maxWidth: '100%',
          borderRadius: '10px',
          borderWidth: '1.5px',
          borderStyle: 'solid',
          overflow: 'hidden',
          boxShadow: justSolved
            ? '0 0 0 3px rgba(255,255,255,0.35), 0 8px 20px -4px rgba(0,0,0,0.35)'
            : '0 6px 16px -4px rgba(0,0,0,0.25)',
          transition: 'box-shadow 0.3s ease'
        }}
      >
        {tiles.map((value, index) => {
          const isSelected = selectedIndex === index;
          return (
            <button
              key={index}
              onClick={() => handleTileClick(index)}
              className={isSelected ? 'michie-box--secondary michie-border-primary' : 'michie-box--secondary'}
              style={{
                position: 'relative',
                border: isSelected ? undefined : 'none',
                borderWidth: isSelected ? '2px' : undefined,
                borderStyle: isSelected ? 'solid' : undefined,
                padding: 0,
                overflow: 'hidden',
                cursor: justSolved ? 'default' : 'pointer',
                transform: isSelected ? 'scale(0.94)' : 'scale(1)',
                transition: 'transform 0.15s ease, filter 0.4s ease',
                filter: justSolved ? 'brightness(1.08)' : 'none',
                outline: 'none'
              }}
              aria-label={`potongan puzzle ${index + 1}`}
            >
              {coverSrc && !imgFailed ? (
                <img
                  src={coverSrc}
                  alt=""
                  onError={() => setImgFailed(true)}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: `${GRID_SIZE * 100}%`,
                    height: `${GRID_SIZE * 100}%`,
                    objectFit: 'cover',
                    transform: imageTransformFor(value),
                    pointerEvents: 'none'
                  }}
                />
              ) : (
                <span
                  className="michie-text-secondary"
                  style={{ fontSize: '11px', opacity: 0.6 }}
                >
                  {value + 1}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div
        className="michie-text-secondary"
        style={{ fontSize: '11px', opacity: 0.55, textAlign: 'center' }}
      >
        {justSolved ? 'Rapi! Puzzle baru sebentar lagi...' : 'Tap 2 potongan buat tukar posisinya'}
      </div>
    </div>
  );
};

export default CoverArtPuzzleWidget;