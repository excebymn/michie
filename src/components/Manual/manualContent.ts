import homeScreenshot from "../../assets/manual/home.png";
import mainPlayerCloseUp from "../../assets/manual/main-player-close-up.png";
import topMainPlayer from "../../assets/manual/top-main-player.png";
import musicControl from "../../assets/manual/music-control.png";
import settingsCenter1 from "../../assets/manual/settings-center1.png";
import settingsCenter2 from "../../assets/manual/settings-center2.png";
import settingsCenter3 from "../../assets/manual/settings-center3.png";
import settingsCenter4 from "../../assets/manual/settings-center4.png";
import settingsCenter5 from "../../assets/manual/settings-center5.png";
import settingsCenter6 from "../../assets/manual/settings-center6.png";
import settingsCenter7 from "../../assets/manual/settings-center7.png";
import settingsCenter8 from "../../assets/manual/settings-center8.png";
import appearance from "../../assets/manual/appearance.png";
import shortcut from "../../assets/manual/shortcut.png";
import integration from "../../assets/manual/intregation.png";
import version from "../../assets/manual/version.png";
import workmode1 from "../../assets/manual/work-mode1.png";
import workmode2 from "../../assets/manual/work-mode2.png";
import widget1 from "../../assets/manual/widget1.png";
import widget2 from "../../assets/manual/widget2.png";
import widget3 from "../../assets/manual/widget3.png";

export interface ManualSection {
  id: string;
  title: string;
  // 1 or 2 paragraphs per section
  paragraphs: string[];
  // 1 or 2 screenshots per section (can be empty if the section doesn't need an image)
  images: string[];
}

export const manualSections: ManualSection[] = [
  {
    id: "welcome",
    title: "Welcome to Michie",
    paragraphs: [
      "Michie is a beautiful, highly flexible offline music player. To really get the most out of it, though, you'll need to get to know it a little first. Here's what Michie might look like the first time you open it.",
    ],
    images: [homeScreenshot],
  },
  {
    id: "closer-up-main-player",
    title: "Main player",
    paragraphs: [
      "This is the main player — where you control your music, and where every button leading to Michie's other features lives.",
    ],
    images: [mainPlayerCloseUp],
  },
  {
    id: "top-main-player",
    title: "Top of the main player",
    paragraphs: [
      "A closer look at the top of the main player: the app name, the volume control, the custom widget button, Settings Center, and Michie's window controls. Feel free to try each one out and see what it does.",
    ],
    images: [topMainPlayer],
  },
  {
    id: "music-control",
    title: "Music controls",
    paragraphs: [
      "This is the main music control area — album art, title, artist and album name, the progress slider, and the play/next/previous buttons among others. It's rounded out with your music file's bitrate info.",
    ],
    images: [musicControl],
  },
  {
    id: "settings-center",
    title: "Settings Center",
    paragraphs: [
      "This is the Settings Center, where you manage your music storage and a lot more. Take a look at the screenshots below, or just explore it yourself — trust me, it's genuinely fun.",
    ],
    images: [
      settingsCenter1,
      settingsCenter2,
      settingsCenter3,
      settingsCenter4,
      settingsCenter5,
      settingsCenter6,
      settingsCenter7,
      settingsCenter8,
    ],
  },
  {
    id: "appearance",
    title: "Appearance",
    paragraphs: [
      "This is one of the best parts — Appearance! Theme controls the overall layout, style, and fonts. Palette controls Michie's colors, and there's plenty to choose from: colors that follow your album art's tone, ready-made presets, or even a color of your own. And last but not least, you can of course customize the app's background with a color or an image.",
      "So Michie's look really does have literally unlimited potential. Mix and match colors and themes however you like, and make Michie truly your own.",
      "In the screenshot below I'm using the Denim theme — I'm not sure why, but I really love it.",
    ],
    images: [appearance],
  },
  {
    id: "shortcut",
    title: "Shortcuts",
    paragraphs: [
      "You can also control music and Michie with keyboard shortcuts — learn about them and customize your own on this page.",
    ],
    images: [shortcut],
  },
  {
    id: "work-mode",
    title: "Work mode",
    paragraphs: [
      "As this section explains, Work Mode shows only the parts of the app that are truly necessary for playing music. So turning Work Mode on cuts down on distractions and reduces your device's resource usage.",
    ],
    images: [workmode1, workmode2],
  },
  {
    id: "integration",
    title: "Integration",
    paragraphs: [
      "Michie also supports a few integrations. For now, it can connect to Discord and send your music status there. Reach out with suggestions if you'd like to see this feature grow.",
    ],
    images: [integration],
  },
  {
    id: "version",
    title: "Version",
    paragraphs: [
      "This is the Version panel, where you can see Michie's version info and check for updates.",
    ],
    images: [version],
  },
  {
    id: "widget",
    title: "Widget",
    paragraphs: [
      "This is honestly the best part — you can add whatever widgets you like to Michie. I don't even know what else to say. Just drag and drop, and boom! Beautiful, right?",
    ],
    images: [widget1, widget2, widget3],
  },
  {
    id: "bye1",
    title: "Thank you!",
    paragraphs: [
      "Thank you for using Michie — I hope you're enjoying it. I'll keep working on Michie, and I hope you'll keep using it too. See you in the next version!",
    ],
    images: [],
  },
  {
    id: "bye2",
    title: "Help Michie grow",
    paragraphs: [
      "Reach out if you find a bug, have an idea for a new feature, want to suggest a new widget, or just feel like chatting. I'd love to hear from you — find me on Instagram @excebymn!",
    ],
    images: [],
  },
];