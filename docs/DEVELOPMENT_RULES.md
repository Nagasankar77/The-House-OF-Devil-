# Development Rules & Future File Placement Guidelines

To maintain architectural integrity, scalability, and zero regression across future updates of **The House of Devil**, every developer and automated agent must follow these rules:

---

## 1. Core Placement Rules

- **"If a future file controls browser/game functionality, place it inside frontend/."**
- **"If a future file controls server functionality, place it inside backend/."**
- **"If a type, constant, or utility is genuinely shared by frontend and backend, place it inside shared/."**

---

## 2. Quick Directory Placement Reference & Examples

| File Type / Purpose | Target Directory | Concrete Example |
| :--- | :--- | :--- |
| **New player movement file** | `frontend/game/player/` | `frontend/game/player/CrouchSprintController.ts` |
| **New room/house file** | `frontend/game/world/` | `frontend/game/world/BasementDungeon.ts` |
| **New lighting system** | `frontend/game/lighting/` | `frontend/game/lighting/VolumetricCandleLighting.ts` |
| **New camera system** | `frontend/game/camera/` | `frontend/game/camera/CinematicShakeCamera.ts` |
| **New environment element** | `frontend/game/environment/` | `frontend/game/environment/BloodMoonSky.ts` |
| **New ghost behavior** | `frontend/systems/ghost/` | `frontend/systems/ghost/AtticJumpscareDirector.ts` |
| **New lamp mechanic** | `frontend/systems/lamps/` | `frontend/systems/lamps/CursedCandleRitual.ts` |
| **New hammer / weapon mechanic** | `frontend/systems/hammer/` | `frontend/systems/hammer/CrowbarPrySystem.ts` |
| **New gate / door system** | `frontend/systems/gate/` | `frontend/systems/gate/PadlockPuzzleSystem.ts` |
| **New story / event logic** | `frontend/systems/story/` | `frontend/systems/story/ChapterTwoDialogue.ts` |
| **New UI screen** | `frontend/screens/` | `frontend/screens/CreditsScreen/CreditsScreen.tsx` |
| **New HUD element** | `frontend/components/hud/` | `frontend/components/hud/HeartbeatStressHUD.tsx` |
| **New menu component** | `frontend/components/menu/` | `frontend/components/menu/SaveLoadMenu.tsx` |
| **New generic UI modal/button** | `frontend/components/ui/` | `frontend/components/ui/AncientScrollModal.tsx` |
| **New inventory UI or item viewer** | `frontend/components/inventory/` | `frontend/components/inventory/DiaryPageReader.tsx` |
| **New React hook** | `frontend/hooks/` | `frontend/hooks/useGamepadControls.ts` |
| **New API endpoint** | `backend/api/` or `backend/routes/` | `backend/routes/leaderboard.router.ts` |
| **New server service** | `backend/services/` | `backend/services/cloudSaveService.ts` |
| **New server middleware** | `backend/middleware/` | `backend/middleware/rateLimiter.ts` |
| **Shared TypeScript interface** | `shared/types/` | `shared/types/ritual.ts` (re-exported via `shared/types/index.ts`) |
| **Shared constant** | `shared/constants/` | `shared/constants/gameBalance.ts` |
| **Shared pure utility function** | `shared/utils/` | `shared/utils/mathHelpers.ts` |

---

## 3. Classification Decision Matrix

### FRONTEND (`frontend/`):
Anything that runs in the browser or directly controls the game client belongs in `frontend/`.
- Three.js scenes, meshes, materials, and canvas rendering
- React components, screens, modals, overlays, HUD, and menus
- Player movement, input controllers, FPP camera, bobbing, collision checks
- House geometry, bungalow floor plans, doors, exterior roads, graveyard props
- Dynamic lighting, shadows, candle flickers, flashlights
- Moon shaders, volumetric fog, particle systems, rain, dust motes
- Ghost AI routines, patrol behavior, jumpscare timings
- Hammer swing mechanics, one-strike gate breaker logic
- Lamp ritual state machines, flame ignition feedback
- Inventory state, clue viewer overlays
- Audio synthesis, Web Audio API soundscapes, footstep triggers

### BACKEND (`backend/`):
Anything that runs on the Node/Express server belongs in `backend/`.
- HTTP server configuration (`backend/server.ts`)
- REST/JSON API endpoints (`/api/lore`, `/api/health`, etc.)
- Server routing definitions
- Server-side services (Gemini LLM lore generation, persistence integrations)
- Express middleware (request logging, error handling, CORS, rate limiting)
- Server-side data processing and analytics

### SHARED (`shared/`):
Code genuinely required by **both** frontend and backend belongs in `shared/`.
- Universal data interfaces and types (`GameSettings`, `HorrorLoreRequest`, `RitualState`)
- Game balance constants, volume presets, key maps
- Pure, platform-agnostic math and formatting utilities

**Anti-Patterns to avoid:**
- ❌ Do NOT put browser-only game code in `backend/`.
- ❌ Do NOT put server-only code (Node fs, express, secret keys) in `frontend/`.
- ❌ Do NOT import backend modules from frontend code.

---

## 4. Coding & Architecture Guardrails

1. **Import Safety & Path Aliases**:
   Use path aliases configured in `vite.config.ts` and `tsconfig.json`:
   - `@/*` -> `./frontend/*`
   - `@components/*` -> `./frontend/components/*`
   - `@game/*` -> `./frontend/game/*`
   - `@systems/*` -> `./frontend/systems/*`
   - `@screens/*` -> `./frontend/screens/*`
   - `@assets/*` -> `./frontend/assets/*`
   - `@shared/*` -> `./shared/*`
   - `@backend/*` -> `./backend/*`

2. **No Gameplay Regressions**:
   - Never alter gate opening mechanics, hammer strike count, lamp ritual count, ghost behavior, or house layout during structural refactors.
   - Separate concerns cleanly without breaking single-activation flags, audio volume curves, or collision meshes.

3. **Performance in Three.js Render Loops**:
   - Re-use vectors (`THREE.Vector3`), matrices (`THREE.Matrix4`), and Euler objects.
   - Never instantiate garbage-collected objects inside `update()` / per-frame loops.
