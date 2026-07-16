export interface ShortcutDef {
  id: string;
  label: string;
  defaultCombo: string;
  // false = fixed; the shortcut can't be customized in the Shortcuts panel.
  customizable: boolean;
  group: string;
}

export const shortcutsRegistry: ShortcutDef[] = [
  {
    id: "play_pause",
    label: "Play / Pause",
    defaultCombo: "Space",
    customizable: true,
    group: "Playback",
  },
  {
    id: "next_song",
    label: "Next track",
    defaultCombo: "Ctrl+ArrowRight",
    customizable: true,
    group: "Playback",
  },
  {
    id: "previous_song",
    label: "Previous track",
    defaultCombo: "Ctrl+ArrowLeft",
    customizable: true,
    group: "Playback",
  },
  {
    id: "seek_forward",
    label: "Seek forward 10 seconds",
    defaultCombo: "ArrowRight",
    customizable: true,
    group: "Playback",
  },
  {
    id: "seek_backward",
    label: "Seek backward 10 seconds",
    defaultCombo: "ArrowLeft",
    customizable: true,
    group: "Playback",
  },
  {
    id: "volume_up",
    label: "Volume up",
    defaultCombo: "ArrowUp",
    customizable: true,
    group: "Playback",
  },
  {
    id: "volume_down",
    label: "Volume down",
    defaultCombo: "ArrowDown",
    customizable: true,
    group: "Playback",
  },
  {
    id: "toggle_shuffle",
    label: "Toggle shuffle",
    defaultCombo: "S",
    customizable: true,
    group: "Playback",
  },
  {
    id: "cycle_repeat",
    label: "Cycle repeat mode",
    defaultCombo: "R",
    customizable: true,
    group: "Playback",
  },
  {
    id: "toggle_favorite",
    label: "Like / Unlike current track",
    defaultCombo: "L",
    customizable: true,
    group: "Playback",
  },
  {
    id: "open_settings",
    label: "Open / Close Settings",
    defaultCombo: "Ctrl+,",
    customizable: true,
    group: "Navigation",
  },
  {
    id: "open_widget_tray",
    label: "Open / Close Widget Tray",
    defaultCombo: "Ctrl+.",
    customizable: true,
    group: "Navigation",
  },
  {
    id: "close_overlay",
    label: "Close the active panel",
    defaultCombo: "Escape",
    customizable: false,
    group: "Navigation",
  },
];