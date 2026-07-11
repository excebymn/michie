import React, { useEffect, useRef, useState } from 'react';
import { usePlayerStore } from '../../stores/playerStore';

interface Pipe {
  id: number;
  x: number; // px
  gapY: number; // px, posisi tengah celah
  passed: boolean;
}

const BIRD_SIZE = 28;
const BIRD_LEFT = 40; // px dari kiri, tetap
const GRAVITY = 0.5;
const FLAP_VELOCITY = -7.5;
const PIPE_WIDTH = 28;
const GAP_HEIGHT = 90;
const PIPE_SPEED = 2.4;

export const FlappyBirdWidget: React.FC = () => {
  const currentSong = usePlayerStore((state) => state.currentSong);

  const containerRef = useRef<HTMLDivElement>(null);

  const [birdY, setBirdY] = useState(100);
  const [pipes, setPipes] = useState<Pipe[]>([]);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [started, setStarted] = useState(false);

  const birdYRef = useRef(100);
  const velocityRef = useRef(0);
  const gameOverRef = useRef(false);
  const startedRef = useRef(false);
  const scoreRef = useRef(0);
  const nextId = useRef(0);

  const coverSrc = currentSong?.cover
    ? `asset://localhost/${currentSong.cover}`
    : currentSong?.path
    ? `asset://localhost/${currentSong.path}`
    : '';

  function resetGame(containerHeight: number) {
    birdYRef.current = containerHeight / 2;
    velocityRef.current = 0;
    gameOverRef.current = false;
    startedRef.current = false;
    scoreRef.current = 0;
    setBirdY(birdYRef.current);
    setPipes([]);
    setScore(0);
    setGameOver(false);
    setStarted(false);
  }

  function flap() {
    const container = containerRef.current;
    if (!container) return;

    if (gameOverRef.current) {
      resetGame(container.clientHeight);
      return;
    }
    startedRef.current = true;
    setStarted(true);
    velocityRef.current = FLAP_VELOCITY;
  }

  // Loop utama: dependency kosong, semua nilai cepat dibaca/ditulis via ref.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    birdYRef.current = container.clientHeight / 2;
    setBirdY(birdYRef.current);

    let animationFrameId: number;
    let spawnTimeoutId: ReturnType<typeof setTimeout>;

    const loop = () => {
      const height = container.clientHeight;
      const width = container.clientWidth;

      if (startedRef.current && !gameOverRef.current) {
        velocityRef.current += GRAVITY;
        birdYRef.current += velocityRef.current;

        if (birdYRef.current < 0) {
          birdYRef.current = 0;
          velocityRef.current = 0;
        }
        if (birdYRef.current > height - BIRD_SIZE) {
          birdYRef.current = height - BIRD_SIZE;
          gameOverRef.current = true;
          setGameOver(true);
          setBest((b) => Math.max(b, scoreRef.current));
        }
        setBirdY(birdYRef.current);

        setPipes((prev) => {
          const next: Pipe[] = [];
          let collided = false;
          let gained = 0;

          for (const pipe of prev) {
            const nx = pipe.x - PIPE_SPEED;
            if (nx < -PIPE_WIDTH) continue;

            const birdCenterY = birdYRef.current + BIRD_SIZE / 2;
            const withinPipeX = nx <= BIRD_LEFT + BIRD_SIZE && nx + PIPE_WIDTH >= BIRD_LEFT;
            const withinGapY =
              birdCenterY >= pipe.gapY - GAP_HEIGHT / 2 && birdCenterY <= pipe.gapY + GAP_HEIGHT / 2;

            if (withinPipeX && !withinGapY) {
              collided = true;
            }

            let passed = pipe.passed;
            if (!passed && nx + PIPE_WIDTH < BIRD_LEFT) {
              passed = true;
              gained += 1;
            }

            next.push({ ...pipe, x: nx, passed });
          }

          if (gained > 0) {
            scoreRef.current += gained;
            setScore(scoreRef.current);
          }

          if (collided) {
            gameOverRef.current = true;
            setGameOver(true);
            setBest((b) => Math.max(b, scoreRef.current));
          }

          return next;
        });
      }

      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);

    const scheduleSpawn = () => {
      const delay = 1500 + Math.random() * 400;
      spawnTimeoutId = setTimeout(() => {
        if (startedRef.current && !gameOverRef.current) {
          const margin = 40;
          const gapY = margin + Math.random() * (height() - margin * 2);
          setPipes((prev) => [...prev, { id: nextId.current++, x: width(), gapY, passed: false }]);
        }
        scheduleSpawn();
      }, delay);

      function height() {
        return container?.clientHeight ?? 200;
      }
      function width() {
        return container?.clientWidth ?? 260;
      }
    };
    scheduleSpawn();

    return () => {
      cancelAnimationFrame(animationFrameId);
      clearTimeout(spawnTimeoutId);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      onClick={flap}
      className="michie-box"
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        minHeight: '260px',
        cursor: 'pointer',
        userSelect: 'none'
      }}
    >
      {/* Skor */}
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
        SCORE: {score}
      </div>
      <div
        className="michie-text-secondary"
        style={{
          position: 'absolute',
          top: '12px',
          right: '14px',
          fontSize: '11px',
          zIndex: 10,
          opacity: 0.6,
          letterSpacing: '0.05em'
        }}
      >
        BEST: {best}
      </div>

      {/* Pipa */}
      {pipes.map((pipe) => (
        <React.Fragment key={pipe.id}>
          <div
            className="michie-bg-secondary michie-border-primary"
            style={{
              position: 'absolute',
              left: `${pipe.x}px`,
              top: 0,
              width: `${PIPE_WIDTH}px`,
              height: `${Math.max(0, pipe.gapY - GAP_HEIGHT / 2)}px`,
              borderWidth: '1px',
              borderStyle: 'solid',
              borderRadius: '3px'
            }}
          />
          <div
            className="michie-bg-secondary michie-border-primary"
            style={{
              position: 'absolute',
              left: `${pipe.x}px`,
              top: `${pipe.gapY + GAP_HEIGHT / 2}px`,
              bottom: 0,
              width: `${PIPE_WIDTH}px`,
              borderWidth: '1px',
              borderStyle: 'solid',
              borderRadius: '3px'
            }}
          />
        </React.Fragment>
      ))}

      {/* Burung (cover art) */}
      <div
        className="michie-circle michie-border-primary michie-box--secondary"
        style={{
          position: 'absolute',
          left: `${BIRD_LEFT}px`,
          top: `${birdY}px`,
          width: `${BIRD_SIZE}px`,
          height: `${BIRD_SIZE}px`,
          overflow: 'hidden',
          boxShadow: '0 4px 8px rgba(0,0,0,0.25)',
          transform: `rotate(${Math.max(-25, Math.min(45, velocityRef.current * 3))}deg)`,
          transition: 'transform 0.1s linear',
          filter: gameOver ? 'grayscale(1)' : 'none'
        }}
      >
        {coverSrc && (
          <img
            src={coverSrc}
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        )}
      </div>

      {!started && !gameOver && (
        <div
          className="michie-text-primary"
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            fontSize: '13px',
            fontWeight: 700,
            opacity: 0.9,
            pointerEvents: 'none'
          }}
        >
          Tap buat mulai terbang
        </div>
      )}

      {gameOver && (
        <div
          className="michie-text-primary"
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            fontSize: '13px',
            fontWeight: 700,
            opacity: 0.9,
            pointerEvents: 'none'
          }}
        >
          Nabrak — tap buat mulai lagi
        </div>
      )}
    </div>
  );
};

export default FlappyBirdWidget;