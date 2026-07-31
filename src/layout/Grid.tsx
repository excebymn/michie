import LeftColumn from "./LeftColumn";
import CenterColumn from "./CenterColumn";
import RightColumn from "./RightColumn";
import { useModeStore } from "../stores/modeStore";

import "./layout.css";

export default function Grid() {
  const isWorkMode = useModeStore((s) => s.mode === "work");

  return (
    <div className={"layout" + (isWorkMode ? " layout--light" : "")}>
      <LeftColumn />
      <CenterColumn />
      <RightColumn />
    </div>
  );
}