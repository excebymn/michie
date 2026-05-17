I made this because i dont find a music player that not customizable and beauty enough for my arch and theres my plan


# Michie — Project Master Summary

**Tagline:**

> *The music player that you wanna marry.*

## Identity

Michie is not just another music player. Its goal is to become a music player that feels personal, beautiful, comfortable for everyday use, and customizable to fit each user's preferences.

Core principles:

* Offline-first
* Customizable but beautiful
* User feels emotionally attached to it
* Desktop Linux experience comes first
* Widget-based layout system
* Responsive across different window sizes (including tiling WMs like Hyprland)
* Long-term multi-platform support
---
# Initial Motivation
I couldn't find a Linux music player that truly felt right.

Applications I tried:

* Amberol → too little customization
* Elisa → UI feels boring and overly complicated
* MPV → too minimal
* Spotube → lacks a satisfying main/home music experience
* Spotify Linux → local music experience feels awkward

Reference I like:

PixelPlayer (Android)

Things I love about it:

* modern look
* clean interface
* beautiful design
* comfortable to use
* feels personal

But Michie wants to go further:

> customizable but beautiful

Not:

* beautiful but locked
* free but messy

---

# Main Vision

Users should be able to build their own music player experience.

Not rebuilding the UI entirely from scratch.

Instead:

Michie provides a base layout, then users can drag and arrange widgets.

Example widgets:

* Album Cover
* Lyrics
* Queue
* Playlist
* Visualizer
* Recently Played
* Favorite Songs
* Artist Info
* Equalizer
* Clock
* Weather
* Mini Stats

Flow:

```txt
Edit Mode
↓
Drag widget
↓
Resize
↓
Save Layout
```

---

# Layout System

Do NOT use absolute pixel positions.

Avoid:

```txt
x=400
width=700
```

Because it breaks on:

* resized windows
* Hyprland tiling
* ultrawide monitors
* small displays

Use:

**Responsive Grid System**

Examples:

```txt
[][][]
[][][]
```

or:

```txt
[][]
[][]
[][]
```

or:

```txt
[][][][][][]
```

Grid adapts dynamically.

Examples:

Large window:

```txt
6 columns
```

Medium:

```txt
4 columns
```

Small:

```txt
2 columns
```

Very narrow:

```txt
1 column
```

Widgets store:

```txt
w=2
h=2
```

instead of:

```txt
400px
700px
```

Goal:

Keep layouts clean even when users heavily customize them.

---

# Responsive Strategy

Use:

* adaptive grid
* breakpoints
* auto rearranging
* collapse behavior

Example:

Desktop:

```txt
Album | Lyrics
Queue | Playlist
```

Narrow:

```txt
Album
Lyrics
Queue
Playlist
```

If content becomes too large:

scrolling is allowed.

But:

scroll should NOT become the primary solution.

Avoid:

```txt
scroll inside scroll inside scroll
```

😭

---

# Theme System

Themes do not rebuild the UI entirely.

Logic:

```txt
Widgets stay
Appearance changes
```

Example:

```dart
PlayButton()
```

Can become:

* Material
* Cupertino / iPhone
* Fluent
* Gaming RGB
* Retro
* Minimal
* Glass

Things themes control:

* border radius
* blur
* shadows
* icons
* colors
* spacing
* card style
* animations

Avoid making everything image-based.

Mainly use:

Theme tokens / style systems

PNG assets should only support visuals.

---

# Planned Themes

Default possibilities:

* Material
* iPhone / Cupertino
* Fluent Windows
* Minimal
* Gaming RGB
* Retro Winamp
* Glassmorphism

Long-term:

Users can create and share their own themes.

---

# Technology

Chosen stack:

**Flutter + Dart**

Reasons:

Single codebase for:

* Windows
* Linux
* Android
* iOS

Fits Michie because:

* widget-centric architecture
* powerful theming
* supports drag layouts
* smooth animations
* desktop + mobile support

Editor:

VS Code

Extensions:

* Flutter
* Dart

Workflow:

```bash
flutter create michie
flutter run -d linux
```

Hot reload included.

---

# Architecture Structure

```txt
UI
↓
Widget System
↓
Theme Engine
↓
Layout Engine
↓
Music Engine
↓
API Layer
```

Separate logic from UI.

Avoid putting everything directly inside widgets.

---

# Initial Folder Structure

```txt
lib/

widgets/
pages/
services/
themes/
layouts/
models/
main.dart
```

Examples:

```txt
widgets/
AlbumCover.dart
LyricsWidget.dart
QueueWidget.dart
PlayerBar.dart
```

```txt
services/
MusicService.dart
ThemeService.dart
LayoutService.dart
ApiService.dart
```

---

# API Philosophy

APIs are not the core.

Priority:

```txt
Offline player first
↓
Online features later
```

Potential APIs:

Spotify:

* artist info
* metadata
* album covers

Lyrics:

* online lyrics

Album information:

* HD artwork

Artist widgets:

* genres
* popular tracks

Widgets should NEVER call APIs directly.

Use service layers.

---

# Roadmap

### Stage 1

* application runs
* local music playback
* folder scanning
* playlists
* queue
* album art

### Stage 2

* widget system
* grid layout
* drag support
* resize support
* save layouts

### Stage 3

* responsive engine
* breakpoints
* layout rules

### Stage 4

* theme engine
* Material
* iPhone
* desktop styles

### Stage 5

* APIs
* lyrics
* Spotify metadata

### Stage 6

* visualizer
* layout community
* theme export/import

---

# Design Philosophy

Goal is NOT:

> "the music player with the most features"

Goal:

> "a music player that truly feels like yours"

Keywords:

* beautiful
* customizable
* personal
* comfortable
* modular
* clean
* warm
* offline-first

---

# Final Name

# Michie

**Tagline:**

> *The music player that you wanna marry.*

Vibe:

* feels like a person's name
* warm
* personal
* easy to type
* easy to remember
* not overly technical

Repository example:

```txt
michie
The music player that you wanna marry.
```

Origin story:

Michie was born out of frustration after failing to find a Linux music player that truly felt right. 😭
