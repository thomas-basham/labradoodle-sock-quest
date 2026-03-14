# Ray's Sock Quest

Ray's Sock Quest is a stylized 3D browser game built with Vite and Three.js. You play as Ray, a sock-obsessed labradoodle, sprinting around a series of backyard scenarios to recover missing socks, dodge hazards, outplay a robot vacuum, and return the laundry to Becca's porch hamper.

## Overview

- Three replayable backyard variants with level progression.
- Round-based sock recovery loop with score, combos, and best-time tracking.
- Sniff-sense guidance, backyard hazards, Becca reactions, and optional robot vacuum interference.
- Desktop and mobile-friendly controls with persistent settings.

## Run

### Requirements

- Node.js 18+ recommended
- npm 9+ recommended

### Development

```bash
npm install
npm run dev
```

Open the local Vite URL shown in the terminal.

### Production Build

```bash
npm run build
```

The build output is written to `dist/`.

## Controls

### Desktop

- `WASD` or `Arrow Keys`: Move Ray
- `Shift`: Sprint
- Mouse drag: Look around
- `Space`: Sniff
- `Escape`: Pause / close sub-panels

### Mobile

- Left joystick: Move Ray
- Drag outside controls: Look around
- `Sprint` button: Sprint
- `Sniff` button: Sniff
- `Menu` button: Pause

## Architecture

The codebase is organized around a small set of focused modules:

- `src/main.js`
  Bootstraps the game safely and shows a fallback message if the app mount is missing.
- `src/game/`
  Runtime orchestration, config, state, settings persistence, scoring, and level progression.
- `src/entities/`
  Ray, Becca, socks, and the robot vacuum enemy.
- `src/world/`
  Environment construction and hazard generation/behavior.
- `src/input/`
  Keyboard and touch control wiring.
- `src/ui/`
  HUD and overlay/menu rendering.
- `src/camera/`
  Follow camera behavior and smoothing.
- `src/effects/` and `src/audio/`
  Lightweight juice, particles, and audio systems.

The game loop is centered in `src/game/Game.js`, while specialized systems own their own logic so future features can be added without turning the project back into a single-file prototype.

## Release Notes

- Settings are persisted in `localStorage`.
- Best times and high scores are stored locally per browser.
- The robot vacuum is enabled only in later levels by default and can be disabled in Settings.

## TODO / Roadmap

- Add real audio assets to replace the current synth-first placeholders.
- Add saveable campaign progression or unlock-based difficulty.
- Add more backyard layouts and optional challenge modifiers.
- Add better enemy variety beyond the robot vacuum.
- Add automated smoke tests for key game-state transitions.

## Future Ideas

- More dog abilities, including bark distractions or temporary speed boosts.
- Multiple collectible types beyond socks.
- Dynamic owner requests and side objectives.
- Photo mode or replay camera for completed runs.
- Accessibility options such as larger HUD scale and reduced camera motion.

## Verification

Release polish was verified with:

```bash
npm run build
```

The current build completes successfully and outputs production assets to `dist/`.
