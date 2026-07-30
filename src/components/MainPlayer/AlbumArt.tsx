// AlbumArt.tsx
// Menampilkan cover art dan info lagu (judul, artist, album).
// Membaca: currentSong dari playerStore.
//
// Mode mini/overlay: header & footer di-render MENUMPUK DI ATAS art (bukan di
// bawah/atasnya seperti layout normal). Elemen di dalamnya (michie-circle,
// michie-box, dst) TETAP pakai warna tema asli apa adanya — itu bagian dari
// identitas tema yang dipilih user, jangan dipaksa putih. Yang overlay-spesifik
// cuma scrim gradient tipis di belakang, buat bantu elemen POLOS (teks/icon
// yang tidak dibungkus michie-box/circle solid) tetap kebaca di atas foto
// sembarang — elemen yang sudah solid dari tema nggak butuh bantuan itu sama sekali.
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { usePlayerStore } from "../../stores/playerStore";
import { toAssetUrl } from "../../utils/assetURL";

interface AlbumArtProps {
  mini?: boolean;
  header?: ReactNode;
  footer?: ReactNode;
}

export function AlbumArt({ mini = false, header, footer }: AlbumArtProps) {
  const currentSong = usePlayerStore((s) => s.currentSong);
  const [artFailed, setArtFailed] = useState(false);

  // Reset flag error setiap kali cover berganti (lagu baru / cover baru),
  // supaya kegagalan load pada satu lagu tidak "nempel" ke lagu berikutnya.
  useEffect(() => {
    setArtFailed(false);
  }, [currentSong?.cover]);

  const artSrc = toAssetUrl(currentSong?.cover);
  const showArt = !!artSrc && !artFailed;

  return (
    <>
      <div className={`mpw-art michie-box michie-box--secondary ${mini ? "mpw-art--mini" : ""}`}>
        {showArt ? (
          <img
            key={currentSong?.cover}
            src={artSrc}
            alt={currentSong?.album ?? "Album art"}
            className="mpw-art-img"
            onError={() => setArtFailed(true)}
          />
        ) : (
          <div className="mpw-art-placeholder michie-text-primary">♪</div>
        )}

        {header && (
          <div className="mpw-art-overlay mpw-art-overlay--top">
            <div className="mpw-art-scrim mpw-art-scrim--top" />
            <div className="mpw-art-overlay-content">{header}</div>
          </div>
        )}

        {footer && (
          <div className="mpw-art-overlay mpw-art-overlay--bottom">
            <div className="mpw-art-scrim mpw-art-scrim--bottom" />
            <div className="mpw-art-overlay-content">{footer}</div>
          </div>
        )}
      </div>

      {!mini && (
        <div className="mpw-info">
          <p className="mpw-info-title michie-text-secondary">
            {currentSong?.name ?? "No song selected"}
          </p>
          <p className="mpw-info-sub michie-text-secondary">
            {currentSong?.artist ?? currentSong?.album_artist ?? "—"}
            {currentSong?.album ? ` · ${currentSong.album}` : ""}
          </p>
        </div>
      )}

      <style>{`
        .mpw-art {
          position: relative;
          width: 100%;
          aspect-ratio: 1;
          /* Batasi tinggi maksimum relatif terhadap TINGGI SLOT (cqh), bukan cuma
             lebar. Sebelumnya art selalu jadi kotak selebar penuh apapun tinggi
             slot-nya — kalau slot dipendekkan, art tetap maksa persegi lebar-penuh
             dan mendorong progress bar + controls keluar (itu yang kelihatan
             "kepotong" di widget sempit). Dengan max-height ini, art ikut
             mengecil begitu tinggi slot terbatas, ruang untuk kontrol tetap ada. */
          max-height: 55cqh;
          max-width: 55cqh;
          margin-inline: auto;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 1;
          min-height: 0;
        }
        .mpw-art--mini {
          aspect-ratio: unset;
          flex: 1;
          border-radius: 0;
          max-height: none;
          max-width: none;
        }
        .mpw-art-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .mpw-art-placeholder {
          font-size: clamp(20px, 14cqh, 48px);
          user-select: none;
        }

        .mpw-art-overlay {
          position: absolute;
          left: 0;
          right: 0;
          z-index: 2;
        }
        .mpw-art-overlay--top { top: 0; }
        .mpw-art-overlay--bottom { bottom: 0; }

        /* Cuma bantuan kontras buat elemen POLOS di dalam overlay (teks judul,
           label format, garis progress tipis) — bukan pengganti warna tema.
           Elemen yang sudah punya background solid dari michie-box/circle
           nggak kepengaruh sama sekali sama scrim ini.
           Pakai backdrop-filter blur, BUKAN cuma gradient warna — gradient warna
           doang bisa kalah kontras kalau kebetulan album art-nya senada sama
           --color-primary. Blur netral terhadap warna foto apa pun di belakangnya.
           Tint tipis di atasnya masih ikut var(--color-primary) (sama pola
           color-mix currentColor di PlayerControls.tsx) supaya tetap kerasa
           "milik tema", bukan cuma kaca buram generik.
           -webkit-backdrop-filter WAJIB ada — webkit2gtk (webview Linux) butuh
           prefix ini, beda sama Chromium/WebView2 di Windows yang udah otomatis. */
        .mpw-art-scrim {
          position: absolute;
          inset: 0;
          pointer-events: none;
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
        }
        .mpw-art-scrim--top {
          background: color-mix(in srgb, var(--color-primary) 35%, transparent);
          mask-image: linear-gradient(to bottom, black 60%, transparent);
          -webkit-mask-image: linear-gradient(to bottom, black 60%, transparent);
        }
        .mpw-art-scrim--bottom {
          background: color-mix(in srgb, var(--color-primary) 45%, transparent);
          mask-image: linear-gradient(to top, black 70%, transparent);
          -webkit-mask-image: linear-gradient(to top, black 70%, transparent);
        }
        .mpw-art-overlay-content {
          position: relative;
          z-index: 1;
          padding: 12px 14px;
        }

        .mpw-info {
          text-align: center;
          width: 100%;
          min-width: 0;
        }
        .mpw-info-title {
          margin: 0;
          /* clamp berbasis cqw: judul ikut mengecil sesuai lebar slot, bukan
             cuma dipotong ellipsis di ukuran tetap. */
          font-size: clamp(0.72rem, 3.4cqw, 0.95rem);
          font-weight: 600;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .mpw-info-sub {
          margin: 3px 0 0;
          font-size: clamp(0.62rem, 2.6cqw, 0.78rem);
          opacity: 0.55;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
      `}</style>
    </>
  );
}