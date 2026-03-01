# BOTB Soundboard 2 — CLAUDE.md

## Stack
- React 19 + Vite 7 (requires Node >=20.19; Node 20.15 produces a non-blocking warning)
- Tailwind CSS v3 (dark mode `class` strategy)
- Firebase 12 — Auth (Google popup) + Firestore only (no Firebase Storage)
- Supabase — Storage for uploaded sounds (`sounds` bucket, public)
- vite-plugin-pwa v1.2 (Workbox generateSW mode)
- Web Audio API for synth sounds; plain HTML Audio for file playback (iOS-safe)

## Dev Commands
```bash
npm run dev      # Start dev server on localhost:5173
npm run build    # Production build (generates SW + workbox files)
npm run preview  # Preview production build
```

## Deployment
- GitHub: `https://github.com/vsalibrary/magicalminuteur` (account: vsalibrary)
- Netlify: `https://battleofthebooks.netlify.app` (auto-deploys from main branch; uses Netlify dashboard env vars)
- Firebase Hosting: `https://mr-mac-s-magical-minuteur.web.app` (auto-deploys from main via GitHub Actions)
- Firebase project: `mr-mac-s-magical-minuteur`
- Firestore rules: `firebase deploy --only firestore:rules --project mr-mac-s-magical-minuteur`
- Supabase project: `rfqijgnkucbmnaepxqzm` — `sounds` bucket must be Public with anon INSERT/SELECT/DELETE policies

## Environment Variables
Firebase and Supabase anon keys are public-by-design (security enforced server-side via Firestore rules + Auth).
- `.env` — local dev (gitignored)
- `.env.production` — committed to repo; used by Vite during `npm run build` (picked up by both Netlify and Firebase Hosting GitHub Actions)
- No GitHub secrets needed for `VITE_*` variables
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

## Key Architecture

### Hooks
- `useAuth` — Google sign-in via popup, returns `{ user, signIn, signOut }`
- `useSession(uid)` — Firestore-backed real-time sync for timer + scores; returns `{ timer, scores }`.
  - **Clock calibration**: on mount writes `{ _calibId: nonce, _calibAt: serverTimestamp() }` to Firestore,
    measures RTT on confirmed snapshot, stores `clockOffset = serverCalib + rtt/2 - localNow`.
    `serverNow() = Date.now() + clockOffset` used for all timer calculations.
  - **`confirmedStartedAtRef`**: interval uses `serverNow()` only once Firestore confirms the server timestamp
    for the current timer start; before that uses `Date.now()` so sender device stays stable.
  - **Sound sync**: `broadcastSound(url)` writes `{ pendingSound: { id, url } }` to Firestore.
    Remote devices detect new `pendingSound.id` and fire `remoteSoundEvent`. Sender ignores via nonce.
  - Timer fields in Firestore: `{ startedAt, originalTotal, isPaused, remainingOnPause, isActive }`.
    `endsAt` is deleted on start/resume (legacy field cleanup via `deleteField()`).
- `useAudio` — single shared AudioContext + GainNode (module-level singletons).
  - `playFile(url, fallback)` — plain HTML Audio (no Web Audio API), wrapped in try/catch for iOS safety.
    Reuses preloaded elements. Falls back to synth on error.
  - `playSimple(url)` — plain Audio for soundboard (fast, iOS-compatible).
  - `playCustom(url)` — Web Audio API via `createMediaElementSource`, used for user-assigned sounds.
  - `ensurePreloaded()` — preloads 7 default sounds on first render.
  - `stopCustom()` — stops any currently playing custom audio.
- `useUserData(uid)` — Firestore onSnapshot for settings/sounds/games; Supabase for file upload/delete.
  Returns `{ settings, sounds, games, uploadSound, deleteSound, assignSound, saveGame, deleteGame, deleteAllGames, uploading, uploadProgress }`.
  `saveGame` saves full `cells` object. Max 4 sounds enforced.
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

### Cross-Device Sync (requires sign-in on all devices)
- **Timer start/stop/pause/resume**: all write to `users/{uid}/session/main` via Firestore.
- **Correct button**: calls `onCorrect()` → `timer.reset()` FIRST (writes `isActive:false`), THEN `timer.broadcastSound(url)`.
  Order matters — reset must write to Firestore before broadcastSound to avoid snapshot race.
- **Incorrect button**: same pattern — `onIncorrect()` BEFORE `broadcastSound`.
- **Soundboard**: `onPlay(url)` → `timer.broadcastSound(url)`, `onStop()` → `timer.broadcastSound(null)`.
- **Remote sound playback**: `App.jsx` watches `timer.remoteSoundEvent?.key` → `audio.playSimple(url)`.

### Firebase / Supabase Data Model
```
Firestore:
  users/{uid}/settings/main    — { correctSoundId, incorrectSoundId, timesUpSoundId,
                                   soundboardSlot0, soundboardSlot1, soundboardSlot2, soundboardSlot3,
                                   volume }
                                 All sound IDs default to 'default' (meaning use built-in sound)
  users/{uid}/sounds/{soundId} — { name, filename, storagePath, url, createdAt }
  users/{uid}/games/{gameId}   — { teamA, teamB, scoreA, scoreB, cells, date }
  users/{uid}/session/main     — { startedAt, originalTotal, isPaused, remainingOnPause,
                                   isActive, cells, teamA, teamB, page,
                                   pendingSound: { id, url },
                                   _calibId, _calibAt }
Supabase Storage:
  bucket: sounds (public)
  path:   users/{uid}/sounds/{originalFilename}
```

### Layout
**Desktop:** three-column grid `[1fr 1fr 128px]` — Timer | Scoresheet | Soundboard (narrow vertical).
**Mobile:** single active panel, switched via bottom nav (Timer | Scores | Sounds).
**Admin page:** full-screen overlay opened via ⚙ header button (logged-in only).
Contains: SoundLibrary (upload/delete/assign, max 4) + Past Games (restore + delete per game + delete all).

### iOS PWA Safe Area
- `index.html` viewport meta includes `viewport-fit=cover`
- Header uses `paddingTop: 'max(env(safe-area-inset-top, 0px), 12px)'` (inline style) so content
  sits below the iOS status bar. Bottom nav uses `paddingBottom: env(safe-area-inset-bottom, 0px)`.

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
- 16 rounds: r1–r12 (regular), b1–b4 (bonus); 4 rounds per page, 4 pages
- Rounds alternate primary team: odd = Team A primary, even = Team B primary
- Cell data per round: `{ primary: null|2|3|'wrong', passover: null|2|'wrong' }`
  - `primary` = primary team's result (+3 author+title, +2 title only, 'wrong' = incorrect)
  - `passover` = other team's passover result (+2 or 'wrong'); only unlocked when primary === 'wrong'
- Score calc: primary team scores `primary` pts (if 2 or 3); if 'wrong' and passover === 2, other team gets 2 pts
- Active round: **auto-detected** via `useMemo` — first round where `primary === null` OR `(primary === 'wrong' && passover === null)`
- Active round row is highlighted; dot indicator: filled = complete, ring = active, faint = future
- Page auto-advances when active round changes
- Score state lives in `useSession` (Firestore-synced); passed to `Scoresheet` as `scores` prop
- Saved games store full `cells` object; restore via Admin → Past Games → Restore button
  `restoreCells(null)` falls back to `initCells()` (blank) for old saves that predate cells storage

## Soundboard
- 4 PlayStation-style square buttons (△ ○ × □) mapping to `sounds[0..3]`
- First press plays; second press stops (uses `audio.stopCustom()`)
- Correct/Incorrect buttons in Timer.jsx also stop-on-second-press for custom sounds
- Correct/Incorrect sounds assigned in Admin → Sound Library (correctSoundId / incorrectSoundId in settings)
- Soundboard plays broadcast sound events received from other devices via `remoteSoundEvent`

## Timer Presets
- `Pass Over` = 10s (keyboard: `1`)
- `20s` = 20s (keyboard: `2`)
- Space = pause/resume, `R` = reset

## Coding Conventions
- Prefer editing existing files over creating new ones
- Do not add comments unless logic is non-obvious
- Do not add error handling for impossible cases
- Use CSS vars (`var(--color-*)`) for theme-sensitive colors, not hardcoded values
- Keep Firebase/Supabase interactions in `useUserData`; keep audio in `useAudio`
- Keep timer + score real-time sync in `useSession`
- When calling both `onCorrect/onIncorrect` and `timer.broadcastSound` in Timer.jsx,
  always call the reset callback FIRST so `isActive:false` reaches Firestore before the sound write

## Known TODOs
- **Safe area on Admin (settings) page**: AdminPage is a fixed fullscreen overlay; its internal header
  (`px-4 py-3`) needs the same `paddingTop: max(env(safe-area-inset-top), 12px)` treatment as the
  main Header so the "Admin" title isn't hidden behind the iOS status bar on PWA.
