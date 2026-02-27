# BOTB Soundboard 2 — CLAUDE.md

## Stack
- React 19 + Vite 7 (requires Node >=20.19; Node 20.15 produces a non-blocking warning)
- Tailwind CSS v3 (dark mode `class` strategy)
- Firebase 12 — Auth (Google popup), Firestore, Storage
- vite-plugin-pwa v1.2 (Workbox generateSW mode)
- Web Audio API for all sounds

## Dev Commands
```bash
npm run dev      # Start dev server on localhost:5173
npm run build    # Production build (generates SW + workbox files)
npm run preview  # Preview production build
```

## Firebase Setup
1. Copy `.env.example` → `.env` and fill in Firebase project credentials
2. Deploy Firestore security rules (users can only read/write their own data)
3. Deploy Storage security rules (same pattern)
4. Replace `public/icon-192.png` and `public/icon-512.png` with proper icons

## Key Architecture

### Hooks
- `useAuth` — Google sign-in via popup, returns `{ user, signIn, signOut }`
- `useTimer` — interval-based (50ms tick), Date.now() accuracy; exposes `justFiveSec` and `justFinished` boolean pulses
- `useAudio` — single shared AudioContext + GainNode (module-level singletons)
- `useUserData` — Firestore onSnapshot listeners + Firebase Storage uploads
- `useVisualizer` — rAF loop on AnalyserNode, returns Float32Array(30)
- `useTheme` — localStorage-backed dark/light toggle; sets `dark` class on `<html>`

### Overlay Event System
`App.jsx` uses **incrementing counter keys** (not booleans) to trigger overlays:
```js
setTimesUpKey(k => k + 1)  // triggers Time's Up overlay
setFiveSecKey(k => k + 1)  // triggers 5-second warning
setConfettiKey(k => k + 1) // triggers confetti
```
`Overlay.jsx` effects use `if (key === 0) return` guards so cleanup never cancels pending hide-timers.

### Firebase Data Model
```
users/{uid}/settings/main   — { correctSoundId, incorrectSoundId, volume }
users/{uid}/sounds/{soundId} — { name, filename, storagePath, url, createdAt }
users/{uid}/games/{gameId}   — { teamA, teamB, scoreA, scoreB, date }
Storage: users/{uid}/sounds/{originalFilename}
```

## CSS / Theming

### Dark/Light mode
CSS custom properties in `src/index.css` under `:root` (light) and `.dark` (dark).
Key vars: `--color-bg`, `--color-surface`, `--color-border`, `--color-text`, `--color-muted`, `--color-hover`, `--color-hover-strong`, `--color-ring-bg`, `--color-ripple`.

Use these vars in new components instead of hardcoded Tailwind white/opacity classes.

### CSS Classes (`src/index.css`)
`.card`, `.btn`, `.btn-primary`, `.btn-ghost`, `.btn-success`, `.btn-danger`, `.btn-action`, `.score-btn`, `.score-btn-active`, `.section-label`, `.ripple`, `.confetti-wrap`, `.confetti-piece`

Utility helpers: `.text-muted`, `.border-subtle`, `.bg-subtle`

## Scoresheet Scoring
- 16 rounds: r1–r12 (regular), b1–b4 (bonus)
- Rounds alternate primary team: odd = Team A primary, even = Team B primary
- Cell data per round: `{ primary: null|2|3|'wrong', passover: null|2|'wrong' }`
  - `primary` = primary team's result (+3 author+title, +2 title only, 'wrong' = incorrect)
  - `passover` = other team's passover result (+2 or 'wrong'); only unlocked when primary === 'wrong'
- Score calc: primary team scores `primary` pts (if 2 or 3); if 'wrong' and passover === 2, other team gets 2 pts
- Active round: radio button highlights the current round row
- Active answering team: derived from round state (primary null → primary team lit; primary wrong + passover null → passover team lit)

## Timer Presets
- `Pass Over` = 10s (keyboard: `1`)
- `20s` = 20s (keyboard: `2`)
- Space = pause/resume, `R` = reset

## Coding Conventions
- Prefer editing existing files over creating new ones
- Do not add comments unless logic is non-obvious
- Do not add error handling for impossible cases
- Use CSS vars (`var(--color-*)`) for theme-sensitive colors, not hardcoded values
- Keep Firebase interactions in `useUserData`; keep audio in `useAudio`
