import React, { useEffect, useRef, useState } from 'react';
import { usePlayerStore } from '../../stores/playerStore';

const PADDLE_WIDTH = 50;
const PADDLE_HEIGHT = 8;
const BALL_SIZE = 20;
const PADDLE_MARGIN = 12;
const AI_SPEED = 2.6; // px per frame, sengaja dibatasi biar nggak sempurna/annoying

export const PongWidget: React.FC = () => {
  const currentSong = usePlayerStore((state) => state.currentSong);

  const containerRef = useRef<HTMLDivElement>(null);

  const [playerX, setPlayerX] = useState(50); // persen
  const [aiX, setAiX] = useState(50); // persen
  const [ball, setBall] = useState({ x: 50, y: 50 }); // persen
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);

  const playerXRef = useRef(50);
  const aiXRef = useRef(50);
  const ballRef = useRef({ x: 50, y: 50, vx: 0.55, vy: 0.7 });
  const scoreRef = useRef(0);

  const coverSrc = currentSong?.cover
    ? `asset://localhost/${currentSong.cover}`
    : currentSong?.path
    ? `asset://localhost/${currentSong.path}`
    : '';

  function resetRally(servingDown: boolean) {
    ballRef.current = {
      x: 50,
      y: 50,
      vx: (Math.random() < 0.5 ? -1 : 1) * (0.5 + Math.random() * 0.3),
      vy: (servingDown ? 1 : -1) * (0.55 + Math.random() * 0.25)
    };
  }

  // Loop fisika: dependency kosong, semua baca/tulis lewat ref (sama kayak
  // widget lain) biar drag paddle nggak nge-reset apa pun.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let animationFrameId: number;

    const loop = () => {
      const width = container.clientWidth;
      const height = container.clientHeight;

      // AI ngikutin bola dengan kecepatan terbatas -> nggak sempurna, masih ngalah kadang
      const aiTargetPx = (ballRef.current.x / 100) * width;
      const aiCurrentPx = (aiXRef.current / 100) * width;
      const aiDelta = aiTargetPx - aiCurrentPx;
      const aiMove = Math.max(-AI_SPEED, Math.min(AI_SPEED, aiDelta));
      aiXRef.current = Math.max(0, Math.min(100, aiXRef.current + (aiMove / width) * 100));
      setAiX(aiXRef.current);

      // Gerak bola
      const b = ballRef.current;
      b.x += b.vx;
      b.y += b.vy;

      // Pantul dinding kiri-kanan
      if (b.x <= 2 || b.x >= 98) {
        b.vx *= -1;
        b.x = Math.max(2, Math.min(98, b.x));
      }

      const ballAbsX = (b.x / 100) * width;
      const ballAbsY = (b.y / 100) * height;

      // Tabrakan paddle player (bawah)
      const playerAbsX = (playerXRef.current / 100) * width;
      const playerTopY = height - PADDLE_MARGIN - PADDLE_HEIGHT;
      if (
        b.vy > 0 &&
        ballAbsY + BALL_SIZE / 2 >= playerTopY &&
        ballAbsY <= playerTopY + PADDLE_HEIGHT &&
        ballAbsX >= playerAbsX - PADDLE_WIDTH / 2 - BALL_SIZE / 2 &&
        ballAbsX <= playerAbsX + PADDLE_WIDTH / 2 + BALL_SIZE / 2
      ) {
        b.vy *= -1;
        // Sentuhan di tepi paddle mantulin bola agak menyamping, biar ada skill element
        const offset = (ballAbsX - playerAbsX) / (PADDLE_WIDTH / 2);
        b.vx = Math.max(-1.1, Math.min(1.1, b.vx + offset * 0.25));
        scoreRef.current += 1;
        setScore(scoreRef.current);
      }

      // Tabrakan paddle AI (atas)
      const aiAbsX = (aiXRef.current / 100) * width;
      const aiBottomY = PADDLE_MARGIN + PADDLE_HEIGHT;
      if (
        b.vy < 0 &&
        ballAbsY - BALL_SIZE / 2 <= aiBottomY &&
        ballAbsY >= PADDLE_MARGIN &&
        ballAbsX >= aiAbsX - PADDLE_WIDTH / 2 - BALL_SIZE / 2 &&
        ballAbsX <= aiAbsX + PADDLE_WIDTH / 2 + BALL_SIZE / 2
      ) {
        b.vy *= -1;
      }

      // Lolos dari player (bawah) -> rally reset santai, skor sesi disimpan sbg best
      if (b.y > 102) {
        setBest((prev) => Math.max(prev, scoreRef.current));
        scoreRef.current = 0;
        setScore(0);
        resetRally(false);
      }
      // Lolos dari AI (atas) -> tetap dianggap poin buat player, rally lanjut turun
      if (b.y < -2) {
        resetRally(true);
      }

      setBall({ x: ballRef.current.x, y: ballRef.current.y });
      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  // Kontrol paddle: ngikutin posisi mouse selama kursor di dalam widget
  // (nggak perlu tahan klik — ini emang gaya kontrol klasik Pong, dan cursor-nya
  // tetap kelihatan normal jadi nggak ada masalah kayak yang di catcher game dulu).
  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    let percentX = ((e.clientX - rect.left) / rect.width) * 100;
    percentX = Math.max(0, Math.min(100, percentX));
    playerXRef.current = percentX;
    setPlayerX(percentX);
  }

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
        cursor: 'default'
      }}
    >
      {/* Skor */}
      <div
        className="michie-text-secondary"
        style={{
          position: 'absolute',
          bottom: '12px',
          left: '14px',
          fontSize: '13px',
          fontWeight: 'bold',
          zIndex: 10,
          opacity: 0.85,
          letterSpacing: '0.05em'
        }}
      >
        RALLY: {score}
      </div>
      <div
        className="michie-text-secondary"
        style={{
          position: 'absolute',
          bottom: '12px',
          right: '14px',
          fontSize: '11px',
          zIndex: 10,
          opacity: 0.6,
          letterSpacing: '0.05em'
        }}
      >
        BEST: {best}
      </div>

      {/* Garis tengah, biar kerasa lapangan */}
      <div
        className="michie-border-primary"
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: '50%',
          borderTopWidth: '1px',
          borderTopStyle: 'dashed',
          opacity: 0.2
        }}
      />

      {/* Paddle AI (atas) */}
      <div
        className="michie-box--secondary michie-border-primary"
        style={{
          position: 'absolute',
          top: `${PADDLE_MARGIN}px`,
          left: `calc(${aiX}% - ${PADDLE_WIDTH / 2}px)`,
          width: `${PADDLE_WIDTH}px`,
          height: `${PADDLE_HEIGHT}px`,
          borderRadius: '5px',
          borderWidth: '1.5px',
          borderStyle: 'solid',
          pointerEvents: 'none'
        }}
      />

      {/* Bola vinyl */}
      <div
        className="michie-circle michie-border-primary"
        style={{
          position: 'absolute',
          left: `calc(${ball.x}% - ${BALL_SIZE / 2}px)`,
          top: `calc(${ball.y}% - ${BALL_SIZE / 2}px)`,
          width: `${BALL_SIZE}px`,
          height: `${BALL_SIZE}px`,
          overflow: 'hidden',
          pointerEvents: 'none',
          boxShadow: '0 3px 6px rgba(0,0,0,0.25)',
          animation: 'pongSpin 1.2s linear infinite',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {coverSrc ? (
          <img
            src={coverSrc}
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
          />
        ) : (
          <div className="michie-bg-secondary" style={{ width: '35%', height: '35%', borderRadius: '50%' }} />
        )}
      </div>

      {/* Paddle player (bawah) */}
      <div
        className="michie-box--secondary michie-border-primary"
        style={{
          position: 'absolute',
          bottom: `${PADDLE_MARGIN}px`,
          left: `calc(${playerX}% - ${PADDLE_WIDTH / 2}px)`,
          width: `${PADDLE_WIDTH}px`,
          height: `${PADDLE_HEIGHT}px`,
          borderRadius: '5px',
          borderWidth: '1.5px',
          borderStyle: 'solid',
          boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
          pointerEvents: 'none'
        }}
      />

      <style>{`
        @keyframes pongSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default PongWidget;