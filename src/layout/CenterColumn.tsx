import { MusicPlayer } from "../widgets/MainPlayer/index";
export default function CenterColumn() {
    return (
        <div className="main-player"
        data-aos="fade-up">
            <MusicPlayer />
        </div>
    );
}