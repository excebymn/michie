import LeftColumn from "./LeftColumn";
import CenterColumn from "./CenterColumn";
import RightColumn from "./RightColumn";
import { useLightModeStore } from "../stores/lightmodestore";

import "./layout.css";

export default function Grid() {
    const isLightMode = useLightModeStore((s) => s.isLightMode);

    return (
        <div className={"layout" + (isLightMode ? " layout--light" : "")}>
            <LeftColumn />
            <CenterColumn />
            <RightColumn />
        </div>
    );
}