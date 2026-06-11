import MusicPlayer from '../components/music/MusicPlayer'

export default function MainLayout() {
  return (
    <div className="h-screen w-full grid layout">

      {/* LEFT */}
      <aside className="side left">
        <div className="slot top left-top">
          <span className="label">LEFT TOP</span>
        </div>
        <div className="slot bottom left-bottom">
          <span className="label">LEFT BOTTOM</span>
        </div>
      </aside>

      {/* CENTER */}
      <main className="side center">
        <div className="slot center-slot">
          <span className="label">MUSIC PLAYER</span>
          <MusicPlayer />
        </div>
      </main>

      {/* RIGHT */}
      <aside className="side right">
        <div className="slot top right-top">
          <span className="label">RIGHT TOP</span>
        </div>
        <div className="slot bottom right-bottom">
          <span className="label">RIGHT BOTTOM</span>
        </div>
      </aside>

      <style>{`
        /* 🧱 EQUAL WIDTH GRID */
        .layout {
          grid-template-columns: 1fr 1fr 1fr;
          gap: 12px;
          padding: 12px;
          height: 100vh;
          background: #0f0f14;
        }

        .side {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .slot {
          flex: 1;
          border-radius: 12px;
          border: 1px solid rgba(255,255,255,0.08);
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* 🎨 DEBUG COLORS */
        .left-top {
          background: rgba(255, 99, 132, 0.15);
        }

        .left-bottom {
          background: rgba(255, 159, 64, 0.15);
        }

        .center-slot {
          background: rgba(54, 162, 235, 0.12);
        }

        .right-top {
          background: rgba(75, 192, 192, 0.15);
        }

        .right-bottom {
          background: rgba(153, 102, 255, 0.15);
        }

        .label {
          position: absolute;
          top: 6px;
          left: 10px;
          font-size: 10px;
          opacity: 0.6;
          letter-spacing: 1px;
        }

        /* 📱 RESPONSIVE: collapse kanan dulu */
        @media (max-width: 1200px) {
          .layout {
            grid-template-columns: 1fr 1fr;
          }
          .right {
            display: none;
          }
        }

        /* 📱 RESPONSIVE: fokus center */
        @media (max-width: 800px) {
          .layout {
            grid-template-columns: 1fr;
          }
          .left {
            display: none;
          }
        }
      `}</style>

    </div>
  )
}