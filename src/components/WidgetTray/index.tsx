import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  widgetRegistry,
  WIDGET_CATEGORY_ORDER,
  type WidgetConfig,
} from "../../config/widgetRegistry";
import { slotRegistry } from "../../config/slotRegistry";
import { TraySlotPreview } from "./TraySlotPreview";
import { LazyWidgetPreview, type PreviewMode } from "./LazyWidgetPreview";
import { WIDGET_DRAG_MIME } from "./dragConstants";

export { WIDGET_DRAG_MIME };

interface WidgetTrayProps {
  onClose: () => void;
}

interface WidgetGroup {
  category: string;
  widgets: WidgetConfig[];
}

// Seberapa deket kursor ke tepi container slot (dalam px) sebelum auto-scroll
// mulai jalan, dan kecepatan maksimalnya pas kursor persis di tepi.
const AUTO_SCROLL_EDGE_PX = 56;
const AUTO_SCROLL_MAX_SPEED = 16;

export const WidgetTray: React.FC<WidgetTrayProps> = ({ onClose }) => {
  // Elemen drag-image custom yang lagi aktif, disimpan biar bisa di-cleanup
  // pas drag selesai (onDragEnd). Dibikin kecil supaya nggak nutupin
  // TraySlotPreview di belakangnya waktu kursor lewat di atasnya.
  const dragPreviewRef = useRef<HTMLDivElement | null>(null);

  // Default "hover" — cuma widget yang lagi ditunjuk kursor yang jalan,
  // paling ringan buat grid yang isinya banyak visualizer real-time.
  const [previewMode, setPreviewMode] = useState<PreviewMode>("hover");

  const [search, setSearch] = useState("");

  // --- Auto-scroll panel slot pas ada widget lagi di-drag deket tepinya.
  // Di layar lebar panel-nya kolom vertikal (scroll atas/bawah), di layar
  // sempit (lihat @container di bawah) dia jadi strip horizontal (scroll
  // kiri/kanan) — logic-nya sama, cuma ngecek axis mana yang aktif secara
  // scrollWidth/scrollHeight, jadi otomatis nyesuain ke layout yang lagi
  // aktif tanpa perlu tau mode apa yang sedang dipakai.
  const slotsContainerRef = useRef<HTMLDivElement | null>(null);
  const autoScrollVelocity = useRef({ x: 0, y: 0 });
  const autoScrollRaf = useRef<number | null>(null);

  const runAutoScrollLoop = () => {
    const container = slotsContainerRef.current;
    if (container) {
      container.scrollLeft += autoScrollVelocity.current.x;
      container.scrollTop += autoScrollVelocity.current.y;
    }
    autoScrollRaf.current = requestAnimationFrame(runAutoScrollLoop);
  };

  const stopAutoScroll = () => {
    if (autoScrollRaf.current !== null) {
      cancelAnimationFrame(autoScrollRaf.current);
      autoScrollRaf.current = null;
    }
    autoScrollVelocity.current = { x: 0, y: 0 };
  };

  // Jaga-jaga kalau tray ditutup di tengah drag.
  useEffect(() => stopAutoScroll, []);

  const handleSlotsDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    const container = slotsContainerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const canScrollX = container.scrollWidth > container.clientWidth;
    const canScrollY = container.scrollHeight > container.clientHeight;

    let vx = 0;
    let vy = 0;

    if (canScrollX) {
      const fromLeft = e.clientX - rect.left;
      const fromRight = rect.right - e.clientX;
      if (fromLeft < AUTO_SCROLL_EDGE_PX) {
        vx = -AUTO_SCROLL_MAX_SPEED * (1 - fromLeft / AUTO_SCROLL_EDGE_PX);
      } else if (fromRight < AUTO_SCROLL_EDGE_PX) {
        vx = AUTO_SCROLL_MAX_SPEED * (1 - fromRight / AUTO_SCROLL_EDGE_PX);
      }
    }

    if (canScrollY) {
      const fromTop = e.clientY - rect.top;
      const fromBottom = rect.bottom - e.clientY;
      if (fromTop < AUTO_SCROLL_EDGE_PX) {
        vy = -AUTO_SCROLL_MAX_SPEED * (1 - fromTop / AUTO_SCROLL_EDGE_PX);
      } else if (fromBottom < AUTO_SCROLL_EDGE_PX) {
        vy = AUTO_SCROLL_MAX_SPEED * (1 - fromBottom / AUTO_SCROLL_EDGE_PX);
      }
    }

    autoScrollVelocity.current = { x: vx, y: vy };

    if (vx !== 0 || vy !== 0) {
      if (autoScrollRaf.current === null) {
        autoScrollRaf.current = requestAnimationFrame(runAutoScrollLoop);
      }
    } else {
      stopAutoScroll();
    }
  };

  const handleSlotsDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    const container = slotsContainerRef.current;
    if (container && !container.contains(e.relatedTarget as Node)) {
      stopAutoScroll();
    }
  };

  // Kelompokkan widgetRegistry per category, lalu urutkan section-nya
  // sesuai WIDGET_CATEGORY_ORDER. Kategori yang gak ada di daftar itu
  // (lupa didaftarin) tetap muncul, cuma jatuh ke paling akhir.
  const widgetGroups = useMemo<WidgetGroup[]>(() => {
    const groups = new Map<string, WidgetConfig[]>();
    for (const widget of widgetRegistry) {
      const list = groups.get(widget.category) ?? [];
      list.push(widget);
      groups.set(widget.category, list);
    }

    const orderedCategories = [...groups.keys()].sort((a, b) => {
      const indexA = WIDGET_CATEGORY_ORDER.indexOf(a as (typeof WIDGET_CATEGORY_ORDER)[number]);
      const indexB = WIDGET_CATEGORY_ORDER.indexOf(b as (typeof WIDGET_CATEGORY_ORDER)[number]);
      const safeA = indexA === -1 ? Number.MAX_SAFE_INTEGER : indexA;
      const safeB = indexB === -1 ? Number.MAX_SAFE_INTEGER : indexB;
      return safeA - safeB;
    });

    return orderedCategories.map((category) => ({
      category,
      widgets: groups.get(category)!,
    }));
  }, []);

  // Filter berdasarkan search query (cocok ke nama widget ATAU nama
  // kategori). Kalau seluruh kategori cocok (mis. ketik "equalizer"),
  // semua widget di kategori itu ikut ditampilkan tanpa perlu namanya
  // masing-masing cocok juga. Kategori yang gak ada widget cocok otomatis
  // hilang dari daftar, bukan cuma dikosongin.
  const filteredGroups = useMemo<WidgetGroup[]>(() => {
    const query = search.trim().toLowerCase();
    if (!query) return widgetGroups;

    return widgetGroups
      .map((group) => {
        const categoryMatches = group.category.toLowerCase().includes(query);
        const widgets = categoryMatches
          ? group.widgets
          : group.widgets.filter((w) => w.label.toLowerCase().includes(query));
        return { category: group.category, widgets };
      })
      .filter((group) => group.widgets.length > 0);
  }, [widgetGroups, search]);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleDragStart = (
    e: React.DragEvent<HTMLDivElement>,
    widgetId: string,
    label: string
  ) => {
    e.dataTransfer.setData(WIDGET_DRAG_MIME, widgetId);
    e.dataTransfer.effectAllowed = "copy";

    // Bikin drag-image kecil sendiri (bukan snapshot tile gede yang isinya
    // preview widget), soalnya default drag-image = ukuran elemen draggable
    // itu sendiri dan itu bakal nutupin TraySlotPreview pas di-drag di atasnya.
    // Pakai className michie-box biar tampilannya ikut tema aplikasi, bukan
    // warna hardcoded.
    const dragEl = document.createElement("div");
    dragEl.textContent = label;
    dragEl.className = "michie-box michie-box--primary michie-text-secondary";
    dragEl.style.position = "fixed";
    dragEl.style.top = "-9999px";
    dragEl.style.left = "-9999px";
    dragEl.style.padding = "8px 14px";
    dragEl.style.fontSize = "0.8rem";
    dragEl.style.fontWeight = "600";
    dragEl.style.whiteSpace = "nowrap";
    dragEl.style.pointerEvents = "none";
    dragEl.style.boxSizing = "border-box";
    document.body.appendChild(dragEl);
    dragPreviewRef.current = dragEl;

    e.dataTransfer.setDragImage(
      dragEl,
      dragEl.offsetWidth / 2,
      dragEl.offsetHeight / 2
    );
  };

  const handleDragEnd = () => {
    if (dragPreviewRef.current) {
      dragPreviewRef.current.remove();
      dragPreviewRef.current = null;
    }
    stopAutoScroll();
  };

  return (
    <div
      onClick={handleBackdropClick}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        padding: "5vh 5vw",
        boxSizing: "border-box",
      }}
    >
      <div
        className="michie-box michie-box--secondary widget-tray-shell"
        style={{
          width: "90vw",
          height: "90vh",
          display: "flex",
          flexDirection: "column",
          boxSizing: "border-box",
          overflow: "hidden",
          padding: "40px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "16px",
          }}
        >
          <h2
            className="michie-text-primary"
            style={{ margin: 0, fontSize: "2.2rem", fontWeight: 600 }}
          >
            Widget Tray
          </h2>
          <button
            className="michie-box michie-box--primary michie-text-secondary"
            onClick={onClose}
            style={{
              border: "none",
              padding: "10px 18px",
              borderRadius: "14px",
              fontSize: "1rem",
              cursor: "pointer",
            }}
          >
            close
          </button>
        </div>

        {/* Body: slot drop-zone di kiri, widget picker (search + grid) di
           kanan. Ini baca/tulis ke store yang sama dengan slot asli, jadi
           begitu di-drop di sini, slot kiri/kanan aplikasi ikut ke-update
           otomatis. Di layar sempit (lihat @container di bawah) panel slot
           pindah ke atas jadi strip horizontal yang auto-scroll kalau
           widget di-drag deket tepinya. */}
        <div className="widget-tray-body">
          <div
            ref={slotsContainerRef}
            className="widget-tray-slots"
            onDragOver={handleSlotsDragOver}
            onDragLeave={handleSlotsDragLeave}
            onDrop={stopAutoScroll}
          >
            <span
              className="michie-text-primary"
              style={{
                fontSize: "0.75rem",
                opacity: 0.7,
                display: "block",
                marginBottom: "8px",
              }}
            >
              current layout, drop one of those widgets here :)
            </span>
            <div className="widget-tray-slots__list">
              {slotRegistry.map((slot) => (
                <TraySlotPreview key={slot.id} slot={slot} />
              ))}
            </div>
          </div>

          <div className="widget-tray-main">
            <div className="widget-tray-toolbar">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search widget..."
                className="michie-box michie-box--primary michie-text-primary widget-tray-search"
              />

              {/* Toggle mode preview: "all" mount semua tile yang keliatan
                 di layar, "hover" cuma mount tile yang lagi ditunjuk kursor. */}
              <div
                className="michie-box michie-box--primary"
                style={{
                  display: "inline-flex",
                  padding: "4px",
                  borderRadius: "12px",
                  gap: "4px",
                  flexShrink: 0,
                }}
              >
                <button
                  onClick={() => setPreviewMode("hover")}
                  className={
                    "michie-text-secondary" +
                    (previewMode === "hover" ? " michie-box michie-box--secondary" : "")
                  }
                  style={{
                    border: "none",
                    background: "none",
                    padding: "8px 14px",
                    borderRadius: "9px",
                    fontSize: "0.78rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    opacity: previewMode === "hover" ? 1 : 0.55,
                  }}
                >
                  Load on hover
                </button>
                <button
                  onClick={() => setPreviewMode("all")}
                  className={
                    "michie-text-secondary" +
                    (previewMode === "all" ? " michie-box michie-box--secondary" : "")
                  }
                  style={{
                    border: "none",
                    background: "none",
                    padding: "8px 14px",
                    borderRadius: "9px",
                    fontSize: "0.78rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    opacity: previewMode === "all" ? 1 : 0.55,
                  }}
                >
                  Load all
                </button>
              </div>
            </div>

            <div className="widget-tray-groups">
              {widgetRegistry.length === 0 && (
                <span className="michie-text-secondary" style={{ opacity: 0.6 }}>
                  no featured widget yet
                </span>
              )}

              {widgetRegistry.length > 0 && filteredGroups.length === 0 && (
                <span className="michie-text-secondary" style={{ opacity: 0.6 }}>
                  no widget matched &quot;{search}&quot;
                </span>
              )}

              {filteredGroups.map((group) => (
                <div key={group.category}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "baseline",
                      gap: "8px",
                      marginBottom: "10px",
                    }}
                  >
                    <span
                      className="michie-text-primary"
                      style={{
                        fontSize: "0.95rem",
                        fontWeight: 700,
                        letterSpacing: "0.02em",
                      }}
                    >
                      {group.category}
                    </span>
                    <span
                      className="michie-text-secondary"
                      style={{ fontSize: "0.72rem", opacity: 0.5 }}
                    >
                      {group.widgets.length}
                    </span>
                  </div>

                  <div className="widget-tray-grid">
                    {group.widgets.map((w) => {
                      const WidgetComponent = w.component;
                      return (
                        <div
                          key={w.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, w.id, w.label)}
                          onDragEnd={handleDragEnd}
                          className="michie-box michie-box--primary michie-text-secondary"
                          style={{
                            position: "relative",
                            display: "flex",
                            flexDirection: "column",
                            borderRadius: "14px",
                            cursor: "grab",
                            userSelect: "none",
                            overflow: "hidden",
                            boxSizing: "border-box",
                          }}
                          title={`Drag "${w.label}" to one of box above`}
                        >
                          {/* Area preview: render komponen widget asli, di-scale supaya
                             muat di tile kecil. pointerEvents none biar interaksi
                             internal widget (kalau ada) nggak nyolong event drag —
                             TAPI mode "hover" butuh mouseenter/leave di sini, makanya
                             pointer-events-nya ditaruh "auto" khusus di level ini. */}
                          <div
                            style={{
                              flex: 1,
                              position: "relative",
                              overflow: "hidden",
                              pointerEvents: previewMode === "hover" ? "auto" : "none",
                            }}
                          >
                            <LazyWidgetPreview component={WidgetComponent} mode={previewMode} />
                          </div>

                          <span
                            className="michie-text-secondary"
                            style={{
                              fontSize: "0.72rem",
                              textAlign: "center",
                              padding: "6px 8px",
                              opacity: 0.85,
                              flexShrink: 0,
                            }}
                          >
                            {w.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        /* container-type bikin breakpoint di bawah ini ngikutin lebar shell
           ini sendiri (bukan lebar window), jadi tetap akurat meskipun
           shell-nya cuma 90vw dari window, bukan 100%. */
        .widget-tray-shell {
          container-type: inline-size;
          container-name: widget-tray;
        }

        .widget-tray-body {
          flex: 1;
          min-height: 0;
          display: flex;
          flex-direction: row;
          gap: 20px;
          overflow: hidden;
        }

        /* Slot drop-zone: kolom vertikal di kiri secara default. Panel ini
           ikut tinggi penuh (sama kayak panel kanan), lalu ke-4 slot di
           dalamnya (lihat .widget-tray-slots__list > *) berbagi rata tinggi
           itu pakai flex — jadi keempatnya SELALU keliatan penuh, ukurannya
           yang nyesuain (ngecil kalau tinggi window terbatas), bukan
           di-scroll atau kepotong. */
        .widget-tray-slots {
          flex-shrink: 0;
          width: 210px;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          padding-right: 4px;
        }

        .widget-tray-slots__list {
          flex: 1;
          min-height: 0;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .widget-tray-slots__list > * {
          flex: 1;
          min-height: 0;
        }

        .widget-tray-main {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .widget-tray-toolbar {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .widget-tray-search {
          flex: 1;
          min-width: 160px;
          border: none;
          outline: none;
          padding: 10px 14px;
          border-radius: 12px;
          font-size: 0.85rem;
        }

        .widget-tray-groups {
          flex: 1;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .widget-tray-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
          grid-auto-rows: 150px;
          gap: 16px;
        }

        /* Layar sempit: slot panel pindah ke atas jadi baris horizontal.
           Ke-4 slot berbagi rata lebar baris itu (flex:1 dari aturan dasar
           di atas, sekarang jalan di axis horizontal karena flex-direction
           row) jadi keempatnya tetap keliatan penuh berjejer ke samping,
           ukurannya yang nyesuain — bukan discroll. */
        @container widget-tray (max-width: 720px) {
          .widget-tray-body {
            flex-direction: column;
          }

          .widget-tray-slots {
            width: auto;
            height: 150px;
            overflow: hidden;
            padding-right: 0;
            padding-bottom: 8px;
          }

          .widget-tray-slots__list {
            flex-direction: row;
          }

          .widget-tray-slots__list > * {
            min-width: 0;
          }

          .widget-tray-grid {
            grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
            grid-auto-rows: 130px;
          }
        }
      `}</style>
    </div>
  );
};