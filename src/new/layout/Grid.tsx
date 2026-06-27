import LeftColumn from "./LeftColumn";
import CenterColumn from "./CenterColumn";
import RightColumn from "./RightColumn";

import "./layout.css";

export default function Grid() {
    return (
        <div className="layout">
            <LeftColumn />
            <CenterColumn />
            <RightColumn />
        </div>
    );
}