import React, { useEffect, useRef, useState } from 'react';
import { usePlayerStore } from '../../stores/playerStore';

interface FallingVinyl {
  id: number;
  x: number;
  y: number;
  speed: number;
}

export const VinylCatcherWidget: React.FC = () => {
  // 1. Berlangganan ke State Player Utama untuk melacak pergantian lagu
  const currentSong = usePlayerStore((state) => state.currentSong);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const catcherRef = useRef<HTMLDivElement>(null);

  // State Gameplay
  const [score, setScore] = useState<number>(0);
  const [vinyls, setVinyls] = useState<FallingVinyl[]>([]);
  const [catcherX, setCatcherX] = useState<number>(50); // Posisi dalam persen (%)

  // Ref penampung id increment unik untuk item piringan hitam
  const nextId = useRef<number>(0);

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
  }, [currentSong?.path]); // Menggunakan path unik lagu sebagai trigger perubahan

  // 3. Game Loop & Spawning System (Menggunakan requestAnimationFrame & Interval)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let animationFrameId: number;

    // Fungsi update pergerakan piringan hitam jatuh (60fps)
    const updateGame = () => {
      setVinyls((prevVinyls) => {
        const containerHeight = container.clientHeight;
        const containerWidth = container.clientWidth;
        
        // Ukuran catcher & piringan dalam hitungan px aktual demi deteksi tabrakan presisi
        const catcherWidth = 70; 
        const catcherHeight = 15;
        const vinylSize = 45;

        // Hitung posisi X absolut catcher dari nilai persentase state
        const catcherAbsX = (catcherX / 100) * (containerWidth - catcherWidth);
        const catcherAbsY = containerHeight - catcherHeight - 10; // 10px offset dari dasar

        return prevVinyls
          .map((vinyl) => ({ ...vinyl, y: vinyl.y + vinyl.speed }))
          .filter((vinyl) => {
            // Hitung posisi X absolut piringan hitam
            const vinylAbsX = (vinyl.x / 100) * (containerWidth - vinylSize);

            // Deteksi tabrakan (Collision Detection)
            const hitX = vinylAbsX + vinylSize >= catcherAbsX && vinylAbsX <= catcherAbsX + catcherWidth;
            const hitY = vinyl.y + vinylSize >= catcherAbsY && vinyl.y <= catcherAbsY + catcherHeight;

            if (hitX && hitY) {
              setScore((prevScore) => prevScore + 1); // Tambah skor jika tertangkap
              return false; // Hapus dari layar
            }

            // Hapus jika piringan sudah lolos melewati batas bawah container
            if (vinyl.y > containerHeight) {
              return false;
            }

            return true;
          });
      });

      animationFrameId = requestAnimationFrame(updateGame);
    };

    animationFrameId = requestAnimationFrame(updateGame);

    // Pembuat (Spawner) piringan hitam jatuh berkala setiap 2.5 detik
    const spawnInterval = setInterval(() => {
      // Hanya spawn jika player sedang memutar lagu
      const newVinyl: FallingVinyl = {
        id: nextId.current++,
        x: Math.random() * 90, // Posisi acak horizontal (0% - 90%)
        y: -50,                // Mulai di atas container (sembunyi)
        speed: 1.5 + Math.random() * 1.5, // Variasi kecepatan santai
      };
      setVinyls((prev) => [...prev, newVinyl]);
    }, 2500);

    return () => {
      cancelAnimationFrame(animationFrameId);
      clearInterval(spawnInterval);
    };
  }, [catcherX]);

  // 4. Kontrol Menggeser Catcher Menggunakan Mouse
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const mouseX = e.clientX - rect.left; // Posisi mouse relatif terhadap widget kotak
    
    // Konversi posisi mouse ke nilai persentase (0 - 100)
    let percentageX = (mouseX / rect.width) * 100;
    
    // Batasi pergeseran agar catcher tidak keluar tembok kanan/kiri widget
    if (percentageX < 0) percentageX = 0;
    if (percentageX > 100) percentageX = 100;

    setCatcherX(percentageX);
  };

  return (
    <div 
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="michie-box"
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        minHeight: '260px',
        cursor: 'none' // Sembunyikan cursor asli agar ilusi menggeser deck vinyl terasa mulus
      }}
    >
      {/* Skor di Pojok Kiri Atas */}
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
            width: '45px',
            height: '45px',
            overflow: 'hidden',
            pointerEvents: 'none', // Mencegah interaksi mouse mengganggu pergeseran catcher
            boxShadow: '0 4px 8px rgba(0,0,0,0.25)',
            transform: 'rotate(0deg)',
            animation: 'spin 4s linear infinite', // Animasi piringan berputar pelan saat jatuh
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
            /* Lapisan tengah vinyl hitam klasik jika cover kosong */
            <div className="michie-bg-secondary" style={{ width: '40%', height: '40%', borderRadius: '50%' }} />
          )}
        </div>
      ))}

      {/* Catcher: Meja Vinyl / Catcher Deck di Bagian Bawah */}
      <div
        ref={catcherRef}
        className="michie-box--secondary michie-border-primary"
        style={{
          position: 'absolute',
          bottom: '10px',
          left: `calc(${catcherX}% - 35px)`, // Center alignment berdasarkan lebar catcher (70px / 2 = 35px)
          width: '70px',
          height: '15px',
          borderRadius: '8px',
          borderWidth: '1.5px',
          borderStyle: 'solid',
          boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
          transition: 'transform 0.05s ease-out', // Efek elastisitas tipis saat digeser cepat
          pointerEvents: 'none'
        }}
      />

      {/* Inject CSS global inline khusus untuk animasi rotasi piringan hitam */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default VinylCatcherWidget;