import React, { useEffect, useRef, useState } from 'react';
import { usePlayerStore } from '../../stores/playerStore';

interface FallingVinyl {
  id: number;
  x: number;
  y: number;
  speed: number;
  size: number;
}

interface CatchEffect {
  id: number;
  x: number; // posisi persen horizontal, buat nempatin efek "+1"
}

export const VinylCatcherWidget: React.FC = () => {
  // 1. Berlangganan ke State Player Utama untuk melacak pergantian lagu
  const currentSong = usePlayerStore((state) => state.currentSong);

  const containerRef = useRef<HTMLDivElement>(null);
  const catcherRef = useRef<HTMLDivElement>(null);

  // State Gameplay
  const [score, setScore] = useState<number>(0);
  const [vinyls, setVinyls] = useState<FallingVinyl[]>([]);
  const [catchEffects, setCatchEffects] = useState<CatchEffect[]>([]);
  const [catcherX, setCatcherX] = useState<number>(50); // Posisi dalam persen (%), buat render

  // Ref penampung posisi catcher terkini — dipakai di dalam game loop supaya
  // loop-nya TIDAK perlu re-subscribe tiap catcherX berubah (dulu ini bikin
  // spawner ke-reset tiap kali catcher digeser, makanya vinyl jarang muncul
  // pas lagi aktif main).
  const catcherXRef = useRef<number>(50);
  useEffect(() => {
    catcherXRef.current = catcherX;
  }, [catcherX]);

  // Ref penampung id increment unik untuk item piringan hitam & efek tangkap
  const nextId = useRef<number>(0);
  const nextEffectId = useRef<number>(0);

  // Ambil URL cover art (mengikuti konvensi protocol app-mu)
  const coverSrc = currentSong?.cover
    ? `asset://localhost/${currentSong.cover}`
    : currentSong?.path
    ? `asset://localhost/${currentSong.path}`
    : '';

  // 2. Mekanik Reset Skor Otomatis saat Lagu Berganti
  useEffect(() => {
    setScore(0);
    setVinyls([]);
    setCatchEffects([]);
  }, [currentSong?.path]); // Menggunakan path unik lagu sebagai trigger perubahan

  // 3. Game Loop & Spawning System — sekarang cuma jalan SEKALI (mount/unmount),
  // lepas total dari perubahan catcherX, biar spawner nggak ke-reset pas di-drag.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let animationFrameId: number;
    let spawnTimeoutId: ReturnType<typeof setTimeout>;

    // Fungsi update pergerakan piringan hitam jatuh (60fps)
    const updateGame = () => {
      setVinyls((prevVinyls) => {
        const containerHeight = container.clientHeight;
        const containerWidth = container.clientWidth;

        const catcherWidth = 70;
        const catcherHeight = 15;

        // Ambil posisi catcher terkini dari ref (bukan closure lama)
        const catcherAbsX = (catcherXRef.current / 100) * (containerWidth - catcherWidth);
        const catcherAbsY = containerHeight - catcherHeight - 10; // 10px offset dari dasar

        const caughtEffects: CatchEffect[] = [];

        const next = prevVinyls
          .map((vinyl) => ({ ...vinyl, y: vinyl.y + vinyl.speed }))
          .filter((vinyl) => {
            const vinylAbsX = (vinyl.x / 100) * (containerWidth - vinyl.size);

            const hitX = vinylAbsX + vinyl.size >= catcherAbsX && vinylAbsX <= catcherAbsX + catcherWidth;
            const hitY = vinyl.y + vinyl.size >= catcherAbsY && vinyl.y <= catcherAbsY + catcherHeight;

            if (hitX && hitY) {
              setScore((prevScore) => prevScore + 1);
              caughtEffects.push({ id: nextEffectId.current++, x: vinyl.x });
              return false; // Hapus dari layar
            }

            if (vinyl.y > containerHeight) {
              return false; // Lolos aja, santai — nggak ada penalti
            }

            return true;
          });

        if (caughtEffects.length > 0) {
          setCatchEffects((prev) => [...prev, ...caughtEffects]);
          // Efek "+1" dibuang otomatis setelah animasinya kelar
          caughtEffects.forEach((effect) => {
            setTimeout(() => {
              setCatchEffects((prev) => prev.filter((e) => e.id !== effect.id));
            }, 600);
          });
        }

        return next;
      });

      animationFrameId = requestAnimationFrame(updateGame);
    };

    animationFrameId = requestAnimationFrame(updateGame);

    // Spawner: interval acak (bukan tetap) + kadang muncul rombongan 2-3
    // sekaligus, biar ritme jatuhnya kerasa hidup, bukan mekanis satu-satu.
    const scheduleSpawn = () => {
      const delay = 500 + Math.random() * 700; // ~0.5–1.2 detik, jauh lebih rame dari 2.5 detik
      spawnTimeoutId = setTimeout(() => {
        const burst = Math.random() < 0.25 ? (Math.random() < 0.4 ? 3 : 2) : 1;

        const newVinyls: FallingVinyl[] = Array.from({ length: burst }).map(() => ({
          id: nextId.current++,
          x: Math.random() * 90,
          y: -50 - Math.random() * 80, // start ketinggian sedikit acak biar rombongan nggak nempel rapi
          speed: 1.6 + Math.random() * 2, // sedikit lebih variatif & gesit dari sebelumnya
          size: 38 + Math.random() * 14, // variasi ukuran 38–52px, biar nggak seragam
        }));

        setVinyls((prev) => [...prev, ...newVinyls]);
        scheduleSpawn();
      }, delay);
    };
    scheduleSpawn();

    return () => {
      cancelAnimationFrame(animationFrameId);
      clearTimeout(spawnTimeoutId);
    };
  }, []);

  // 4. Kontrol Menggeser Catcher Pakai Klik-Tahan (Drag)
  const [isDragging, setIsDragging] = useState(false);

  function moveCatcherTo(clientX: number) {
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const mouseX = clientX - rect.left;

    let percentageX = (mouseX / rect.width) * 100;
    if (percentageX < 0) percentageX = 0;
    if (percentageX > 100) percentageX = 100;

    setCatcherX(percentageX);
  }

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    moveCatcherTo(e.clientX);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    moveCatcherTo(e.clientX);
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleWindowMouseUp = () => setIsDragging(false);
    const handleWindowMouseMove = (e: MouseEvent) => moveCatcherTo(e.clientX);

    window.addEventListener('mouseup', handleWindowMouseUp);
    window.addEventListener('mousemove', handleWindowMouseMove);
    return () => {
      window.removeEventListener('mouseup', handleWindowMouseUp);
      window.removeEventListener('mousemove', handleWindowMouseMove);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDragging]);

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      className="michie-box"
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        minHeight: '260px',
        cursor: isDragging ? 'grabbing' : 'grab'
      }}
    >
      {/* Skor di Pojok Kiri Atas */}
      <div
        className="michie-text-secondary"
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
        CAUGHT: {score}
      </div>

      {/* Render Semua Piringan Hitam yang Sedang Jatuh */}
      {vinyls.map((vinyl) => (
        <div
          key={vinyl.id}
          className="michie-circle michie-border-primary"
          style={{
            position: 'absolute',
            left: `${vinyl.x}%`,
            top: `${vinyl.y}px`,
            width: `${vinyl.size}px`,
            height: `${vinyl.size}px`,
            overflow: 'hidden',
            pointerEvents: 'none',
            boxShadow: '0 4px 8px rgba(0,0,0,0.25)',
            animation: 'spin 4s linear infinite',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2px'
          }}
        >
          {coverSrc ? (
            <img
              src={coverSrc}
              alt="Vinyl Art"
              style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
            />
          ) : (
            <div className="michie-bg-secondary" style={{ width: '40%', height: '40%', borderRadius: '50%' }} />
          )}
        </div>
      ))}

      {/* Efek "+1" pas nangkep vinyl, biar kerasa responsif */}
      {catchEffects.map((effect) => (
        <div
          key={effect.id}
          className="michie-text-primary"
          style={{
            position: 'absolute',
            left: `${effect.x}%`,
            bottom: '32px',
            fontSize: '14px',
            fontWeight: 800,
            pointerEvents: 'none',
            animation: 'floatUp 0.6s ease-out forwards'
          }}
        >
          +1
        </div>
      ))}

      {/* Catcher: Meja Vinyl / Catcher Deck di Bagian Bawah */}
      <div
        ref={catcherRef}
        className="michie-box--secondary michie-border-primary"
        style={{
          position: 'absolute',
          bottom: '10px',
          left: `calc(${catcherX}% - 35px)`,
          width: '70px',
          height: '15px',
          borderRadius: '8px',
          borderWidth: '1.5px',
          borderStyle: 'solid',
          boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
          transition: 'transform 0.05s ease-out',
          pointerEvents: 'none'
        }}
      />

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes floatUp {
          0% { transform: translateY(0); opacity: 1; }
          100% { transform: translateY(-28px); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default VinylCatcherWidget;