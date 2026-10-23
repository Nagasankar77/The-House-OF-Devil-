# The House of Devil — Project Rules & Guidelines

To maintain clean code quality, scalability, and zero regression across future updates, adhere strictly to the following rules:

---

## 1. Directory Placement Rules

### Where New Code Belongs:

- **Frontend UI & Presentation**:
  - Reusable buttons, modals, overlays: `frontend/components/ui/`
  - Heads-up displays, counters, touch controls: `frontend/components/hud/`
  - Screens, title pages, pause menus: `frontend/screens/<ScreenName>/`
  - Inventories, clue viewers: `frontend/components/inventory/`
  - Custom React hooks: `frontend/hooks/`
  - Stylesheets & global animations: `frontend/styles/`

- **Game Engine & 3D World**:
  - Three.js setup & main render loops: `frontend/game/engine/`
  - Player controls, camera, gestures: `frontend/game/player/` & `frontend/game/camera/`
  - Terrains, houses, roads, props: `frontend/game/world/`
  - Atmospheric skies, fog, moons, trees: `frontend/game/environment/`
  - Particles, ghosts, characters, shaders: `frontend/game/effects/`
  - Audio managers and audio synthesizers: `frontend/game/audio/`

- **Gameplay Mechanics & Rules**:
  - Independent interactive quest loops: `frontend/systems/<system-name>/`
  - Example: gate locks, ritual puzzles, scares, inventory logic.

- **Backend & Server**:
  - Server endpoints: `backend/routes/`
  - External services, AI generators, database connectors: `backend/services/`
  - Request middleware (auth, logging, errors): `backend/middleware/`
  - Server entry point: `backend/server.ts`

- **Shared Types & Constants**:
  - Shared interfaces across front/back: `shared/types/`
  - Universal configurations & defaults: `shared/constants/`
  - Pure mathematical or formatting helpers: `shared/utils/`

---

## 2. Coding Standards

1. **Strict TypeScript**:
   - Do not use `any` unless absolutely unavoidable.
   - When `isolatedModules` is enabled in `tsconfig.json`, always use `export type { ... }` when re-exporting type-only symbols.

2. **No Per-Frame Allocations**:
   - Inside render loops (`requestAnimationFrame` or `useFrame`), never instantiate new `THREE.Vector3`, `THREE.Matrix4`, `THREE.Color`, or materials.
   - Re-use scratch vectors and update existing properties in-place.

3. **Audio Discipline**:
   - Never play raw uncompressed square or sawtooth waves at maximum volume.
   - Route all synthesizers through `HorrorAudioManager`'s master compressor and subsonic protection filter.
   - Guard against audio context autoplay blocking by unlocking on first user interaction.

4. **Single-Activation Flags**:
   - All interactive triggers (such as lighting lamps or breaking gate chains) must have an immediate guard:
     ```ts
     if (this.isActivated) return;
     this.isActivated = true;
     ```
   - Never allow repeated execution loops on button hold or collision overlap.

5. **Import Path Conventions**:
   - Use either relative imports within local feature folders or standard path aliases:
     - `@frontend/*`
     - `@backend/*`
     - `@shared/*`
     - `@game/*`
     - `@systems/*`
     - `@components/*`
     - `@screens/*`
