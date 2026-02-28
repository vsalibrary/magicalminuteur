# BOTB Soundboard 2 — CLAUDE.md

## Stack
- React 19 + Vite 7 (requires Node >=20.19; Node 20.15 produces a non-blocking warning)
- Tailwind CSS v3 (dark mode `class` strategy)
- Firebase 12 — Auth (Google popup) + Firestore only (no Firebase Storage)
- Supabase — Storage for uploaded sounds (`sounds` bucket, public)
- vite-plugin-pwa v1.2 (Workbox generateSW mode)
- Web Audio API for all sounds

## Dev Commands
```bash
npm run dev      # Start dev server on localhost:5173
npm run build    # Production build (generates SW + workbox files)
npm run preview  # Preview production build
```

## Environment Variables (`.env`)
```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET   # still in Firebase app init (harmless)
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
VITE_SUPABASE_URL
VITE_SUPABASE_KEY              # publishable anon key
```

## Deployment
- GitHub: `https://github.com/vsalibrary/magicalminuteur` (account: vsalibrary)
- Netlify: `https://battleofthebooks.netlify.app` (auto-deploys from main branch)
- Firebase project: `mr-mac-s-magical-minuteur`
- Firestore rules deployed via: `firebase deploy --only firestore:rules --project mr-mac-s-magical-minuteur`
- Supabase project: `rfqijgnkucbmnaepxqzm` — `sounds` bucket must be Public with anon INSERT/SELECT/DELETE policies

## Key Architecture

### Hooks
- `useAuth` — Google sign-in via popup, returns `{ user, signIn, signOut }`
- `useSession(uid)` — Firestore-backed real-time sync for timer + scores; returns `{ timer, scores }`.
  Timer stored as `{ endsAt, originalTotal, isPaused, remainingOnPause, isActive }`.
  Scores stored as `{ cells, teamA, teamB, page }`. All state syncs across devices when logged in.
- `useAudio` — single shared AudioContext + GainNode (module-level singletons).
  Tracks `currentCustomAudio` module-level; exposes `stopCustom()` to stop any playing custom sound.
- `useUserData(uid)` — Firestore onSnapshot for settings/sounds/games; Supabase for file upload/delete.
  Enforces max 4 sounds. Returns `{ settings, sounds, games, uploadSound, deleteSound, assignSound, saveGame, uploading, uploadProgress }`.
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

### Firebase / Supabase Data Model
```
Firestore:
  users/{uid}/settings/main    — { correctSoundId, incorrectSoundId, volume }
  users/{uid}/sounds/{soundId} — { name, filename, storagePath, url, createdAt }
  users/{uid}/games/{gameId}   — { teamA, teamB, scoreA, scoreB, date }
  users/{uid}/session/main     — { endsAt, originalTotal, isPaused, remainingOnPause,
                                   isActive, cells, teamA, teamB, page }
Supabase Storage:
  bucket: sounds (public)
  path:   users/{uid}/sounds/{originalFilename}
```

### Layout
**Desktop:** two-column grid (Timer | Scoresheet) with Soundboard full-width below.
**Mobile:** single active panel, switched via bottom nav (Timer | Scores | Sounds*).
`*` Sounds tab only shown when logged in.
**Admin page:** full-screen overlay opened via ⚙ header button (logged-in only).
Contains: SoundLibrary (upload/delete/assign, max 4) + Past Games with Restore.

## CSS / Theming

### Dark/Light mode
CSS custom properties in `src/index.css` under `:root` (light) and `.dark` (dark).
Key vars: `--color-bg`, `--color-surface`, `--color-border`, `--color-text`, `--color-muted`, `--color-hover`, `--color-hover-strong`, `--color-ring-bg`, `--color-ripple`.

Use these vars in new components instead of hardcoded Tailwind white/opacity classes.

### CSS Classes (`src/index.css`)
`.card`, `.btn`, `.btn-primary`, `.btn-ghost`, `.btn-success`, `.btn-danger`, `.btn-action`, `.score-btn`, `.score-btn-active`, `.score-btn-warn`, `.score-btn-wrong`, `.section-label`, `.ripple`, `.confetti-wrap`, `.confetti-piece`

Utility helpers: `.text-muted`, `.border-subtle`, `.bg-subtle`

Score buttons auto-shrink on mobile (`max-width: 639px`) via CSS media query.

## Scoresheet Scoring
- 16 rounds: r1–r12 (regular), b1–b4 (bonus)
- Rounds alternate primary team: odd = Team A primary, even = Team B primary
- Cell data per round: `{ primary: null|2|3|'wrong', passover: null|2|'wrong' }`
  - `primary` = primary team's result (+3 author+title, +2 title only, 'wrong' = incorrect)
  - `passover` = other team's passover result (+2 or 'wrong'); only unlocked when primary === 'wrong'
- Score calc: primary team scores `primary` pts (if 2 or 3); if 'wrong' and passover === 2, other team gets 2 pts
- Active round: **auto-detected** via `useMemo` — first round where `primary === null` OR `(primary === 'wrong' && passover === null)`
- Active round row is highlighted; dot indicator: filled = complete, ring = active, faint = future
- Page auto-advances when active round changes (4 rounds per page, 4 pages)
- Score state lives in `useSession` (Firestore-synced); passed to `Scoresheet` as `scores` prop

## Soundboard
- 4 PlayStation-style square buttons (△ ○ × □) mapping to `sounds[0..3]`
- First press plays; second press stops (uses `audio.stopCustom()`)
- Correct/Incorrect buttons in Timer.jsx also stop-on-second-press for custom sounds
- Correct/Incorrect sounds assigned in Admin → Sound Library (correctSoundId / incorrectSoundId in settings)

## Timer Presets
- `Pass Over` = 10s (keyboard: `1`)
- `20s` = 20s (keyboard: `2`)
- Space = pause/resume, `R` = reset
- Timer top-aligned (not vertically centred) within its card

## Coding Conventions
- Prefer editing existing files over creating new ones
- Do not add comments unless logic is non-obvious
- Do not add error handling for impossible cases
- Use CSS vars (`var(--color-*)`) for theme-sensitive colors, not hardcoded values
- Keep Firebase/Supabase interactions in `useUserData`; keep audio in `useAudio`
- Keep timer + score real-time sync in `useSession`
