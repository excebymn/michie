import Grid from "./Grid";
import { useModeStore } from "../stores/modeStore";
import { VideoPlayerMode } from "../components/VideoPlayerMode";

export default function MainLayout() {
  const mode = useModeStore((s) => s.mode);

  // Video Mode gantiin <Grid /> SEPENUHNYA (bukan CSS hide) — jadi
  // LeftColumn/CenterColumn/RightColumn/MainPlayer semuanya tidak ke-mount
  // sama sekali selagi video sedang diputar.
  if (mode === "video") {
    return <VideoPlayerMode />;
  }

  return <Grid />;
}