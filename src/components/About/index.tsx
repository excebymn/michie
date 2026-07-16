import { lazy, Suspense } from "react";
import "./about.css";

// Tiap section di-lazy-load terpisah (bukan panel-nya secara keseluruhan),
// sesuai kebutuhan: konten About bisa nambah panjang ke depannya (changelog,
// credits, dll), dan tiap section punya kesempatan sendiri buat idle sampai
// benar-benar diminta render.
const ContactSection = lazy(() => import("./sections/ContactSection"));
const FeaturesSection = lazy(() => import("./sections/FeatureSection"));
const TechStackSection = lazy(() => import("./sections/TechStackSection"));

function SectionFallback() {
  return <div className="about-section-fallback michie-text-secondary">Loading…</div>;
}

export function AboutPanel() {
  return (
    <div className="about-panel flex flex-col gap-7 p-5">
      <header className="about-header flex flex-col gap-2">
        <h2 className="about-title michie-text-secondary">About Michie - The music player that you wanna marry</h2>
        <p className="about-tagline michie-text-secondary">
          A local, offline-first desktop music player built with care.
        </p>
      </header>

      <Suspense fallback={<SectionFallback />}>
        <ContactSection />
      </Suspense>

      <Suspense fallback={<SectionFallback />}>
        <FeaturesSection />
      </Suspense>

      <Suspense fallback={<SectionFallback />}>
        <TechStackSection />
      </Suspense>
    </div>
  );
}