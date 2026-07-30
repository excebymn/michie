import React, { useEffect, useRef, useState } from 'react';
import { usePlayerStore } from '../../stores/playerStore'; // Relatif dari src/widgets/
import { toAssetUrl } from '../../utils/assetURL';
import "./styles.css"

interface Position {
  x: number;
  y: number;
  dx: number;
  dy: number;
}

export const DVDBouncingWidget: React.FC = () => {
  // 1. Ambil data currentSong secara reaktif dari store asli Anda
  const currentSong = usePlayerStore((state) => state.currentSong);

  const containerRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);

  const [pos, setPos] = useState<Position>({ x: 0, y: 0, dx: 2, dy: 2 });

  // State untuk melacak tint warna aktif demi mematuhi aturan penamaan class
  const [isPrimaryTint, setIsPrimaryTint] = useState<boolean>(true);

  // Integrasi asset protocol berdasarkan path lagu asli
  const coverSrc = toAssetUrl(currentSong?.cover) ?? "";

  useEffect(() => {
    const container = containerRef.current;
    const logo = logoRef.current;
    if (!container || !logo) return;

    let animationFrameId: number;
    let currentX = pos.x;
    let currentY = pos.y;
    let currentDx = pos.dx;
    let currentDy = pos.dy;

    const updatePosition = () => {
      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;
      const logoWidth = logo.clientWidth;
      const logoHeight = logo.clientHeight;

      let hitWall = false;

      // Hitung langkah posisi berikutnya
      currentX += currentDx;
      currentY += currentDy;

      // Pantulan Horizontal (Kiri / Kanan)
      if (currentX + logoWidth >= containerWidth) {
        currentX = containerWidth - logoWidth;
        currentDx = -currentDx;
        hitWall = true;
      } else if (currentX <= 0) {
        currentX = 0;
        currentDx = -currentDx;
        hitWall = true;
      }

      // Pantulan Vertikal (Atas / Bawah)
      if (currentY + logoHeight >= containerHeight) {
        currentY = containerHeight - logoHeight;
        currentDy = -currentDy;
        hitWall = true;
      } else if (currentY <= 0) {
        currentY = 0;
        currentDy = -currentDy;
        hitWall = true;
      }

      // Trigger perubahan warna tint secara aman jika menabrak dinding
      if (hitWall) {
        setIsPrimaryTint((prev) => !prev);
      }

      // Gunakan translate3d demi akselerasi GPU 60fps tanpa memicu re-render siklus React
      logo.style.transform = `translate3d(${currentX}px, ${currentY}px, 0px)`;

      animationFrameId = requestAnimationFrame(updatePosition);
    };

    animationFrameId = requestAnimationFrame(updatePosition);

    return () => {
      cancelAnimationFrame(animationFrameId);
      // Simpan koordinat terakhir agar posisi tidak teleportasi/reset saat re-render internal terjadi
      setPos({ x: currentX, y: currentY, dx: currentDx, dy: currentDy });
    };
  }, [pos.dx, pos.dy]); // Dependency aman untuk inisialisasi awal frame arah

  // Tentukan class penamaan dinamis berdasarkan kondisi pantulan terakhir
  const circleClass = isPrimaryTint ? "michie-circle--primary shadow" : "michie-box--secondary";

  return (
    <div
      ref={containerRef}
      className="michie-box"
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        minHeight: '280px'
      }}
    >
      <div
        ref={logoRef}
        style={{
          position: 'absolute',
          width: '85px',
          height: '85px',
          willChange: 'transform',
        }}
      >
        {coverSrc ? (
          <div className={`michie-circle ${circleClass}`} style={{ width: '100%', height: '100%', padding: '4px' }}>
            <img
              src={coverSrc}
              // Menggunakan fallback aman agar tidak memicu error TypeScript pada tipe 'Songs'
              alt={(currentSong as any)?.title || (currentSong as any)?.name || "Album Art"}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                borderRadius: '50%'
              }}
            />
          </div>
        ) : (
          /* Fallback ketika tidak ada lagu aktif, memantulkan bentuk lingkaran solid bawaan tema */
          <div className={`michie-circle ${circleClass}`} style={{ width: '100%', height: '100%' }} />
        )}
      </div>
    </div>
  );
};

export default DVDBouncingWidget;