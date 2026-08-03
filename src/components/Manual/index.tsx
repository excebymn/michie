import React from "react";
import { useManualStore } from "./manualStore";
import { manualSections } from "./manualContent";
import { ChevronLeftIcon, ChevronRightIcon } from "./icons";

// Panel "Manual" (cara pakai app), dipakai:
// 1. Sebagai salah satu panel di SettingsCenter (lihat SettingsRegistry.ts)
// 2. Di dalam ManualPopup.tsx, buat ditampilin otomatis saat first install
//
// Progress (section keberapa yang lagi dibuka) diambil dari useManualStore,
// BUKAN useState lokal — supaya kalau SettingsCenter ditutup lalu dibuka lagi,
// atau user pindah ke panel lain terus balik lagi ke Manual, section-nya
// tetap di posisi terakhir (gak reset ke section pertama).
export const ManualPanel: React.FC = () => {
  const activeIndex = useManualStore((state) => state.activeIndex);
  const next = useManualStore((state) => state.next);
  const previous = useManualStore((state) => state.previous);
  const goTo = useManualStore((state) => state.goTo);

  const section = manualSections[activeIndex];
  const isFirst = activeIndex === 0;
  const isLast = activeIndex === manualSections.length - 1;

  if (!section) {
    return (
      <p style={{ opacity: 0.7, fontSize: "1rem" }}>
        manual content not found. Please check the manualSections array in manualContent.tsx
      </p>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        minHeight: 0,
      }}
    >
      <div style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
        <h2
        className="michie-text-secondary"
          style={{
            margin: "0 0 16px 0",
            fontSize: "2rem",
            fontWeight: 600,
          }}
        >
          {section.title}
        </h2>

        {section.paragraphs.map((paragraph, i) => (
          <p
          className="michie-text-secondary"
            key={i}
            style={{
              margin: "0 0 16px 0",
              opacity: 0.85,
              fontSize: "1rem",
              lineHeight: "1.6",
              maxWidth: "600px",
            }}
          >
            {paragraph}
          </p>
        ))}

        {section.images.length > 0 && (
          <div
            style={{
              display: "flex",
              gap: "16px",
              flexWrap: "wrap",
              marginTop: "8px",
            }}
          >
            {section.images.map((src, i) => (
              <img
                key={i}
                src={src}
                alt={`${section.title} - screenshot ${i + 1}`}
                className="michie-box michie-box--primary"
                style={{
                  maxWidth: "100%",
                  width:
                    section.images.length > 1 ? "calc(50% - 8px)" : "100%",
                  borderRadius: "12px",
                  display: "block",
                }}
              />
            ))}
          </div>
        )}
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          paddingTop: "20px",
          flexShrink: 0,
        }}
      >
        <button
          className="michie-box michie-box--secondary michie-text-primary"
          onClick={previous}
          disabled={isFirst}
          style={{
            border: "none",
            padding: "10px 16px",
            borderRadius: "12px",
            cursor: isFirst ? "default" : "pointer",
            opacity: isFirst ? 0.4 : 1,
            display: "flex",
            alignItems: "center",
            gap: "6px",
            fontSize: "0.9rem",
          }}
        >
          <ChevronLeftIcon />
          previous
        </button>

        <div style={{ display: "flex", gap: "6px" }}>
          {manualSections.map((s, i) => (
            <button
              key={s.id}
              onClick={() => goTo(i)}
              aria-label={`to section ${i + 1}: ${s.title}`}
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                border: "none",
                padding: 0,
                cursor: "pointer",
                background:
                  i === activeIndex ? "currentColor" : "rgba(255,255,255,0.3)",
              }}
            />
          ))}
        </div>

        <button
          className="michie-box michie-box--secondary michie-text-primary"
          onClick={next}
          disabled={isLast}
          style={{
            border: "none",
            padding: "10px 16px",
            borderRadius: "12px",
            cursor: isLast ? "default" : "pointer",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            fontSize: "0.9rem",
          }}
        >
          next
          <ChevronRightIcon />
        </button>
      </div>
    </div>
  );
};