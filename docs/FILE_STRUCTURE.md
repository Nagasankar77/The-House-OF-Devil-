# The House of Devil — File Structure

Complete map of the project architecture and file tree:

```
/
├── frontend/
│   ├── components/
│   │   ├── ui/
│   │   │   ├── AtmosphericCanvas2D.tsx   # 2D fallback atmospheric canvas
│   │   │   ├── CinematicOverlay.tsx      # Vignette, lightning flash, breathing overlays
│   │   │   ├── WebGLFallbackModal.tsx    # Hardware acceleration troubleshooting modal
│   │   │   └── index.ts
│   │   ├── menu/
│   │   │   ├── MainMenu.tsx              # In-game menu overlay
│   │   │   ├── SettingsModal.tsx         # Volume, sensitivity, and graphics quality options
│   │   │   └── index.ts
│   │   ├── hud/
│   │   │   ├── GameHUD.tsx               # Reticle, flashlight status, objective text, prompts
│   │   │   ├── MobileControls.tsx        # Virtual dual thumbsticks for mobile touchscreens
│   │   │   ├── PerformanceHUD.tsx        # FPS, draw call, and triangle counter
│   │   │   ├── StoryCinematicHUD.tsx     # Cinematic subtitle display and scene skipper
│   │   │   └── index.ts
│   │   └── inventory/
│   │       ├── ClueInspectModal.tsx      # Inspect documents, missing poster notices
│   │       ├── InventoryModal.tsx        # Grid inventory display & item inspect
│   │       └── index.ts
│   │
│   ├── game/
│   │   ├── engine/
│   │   │   ├── GameEngine.ts             # 3D engine coordinator (Three.js scene/camera/renderer)
│   │   │   └── index.ts
│   │   ├── world/
│   │   │   ├── BungalowInterior.ts       # Colonial bungalow interior, rooms, furniture, teak doors
│   │   │   ├── StoryPosters.ts           # Procedural poster textures, notes, missing notices
│   │   │   └── index.ts
│   │   ├── player/
│   │   │   ├── PlayerController.ts       # FPP movement, smooth mouse look, head bobbing, footstep sounds
│   │   │   └── index.ts
│   │   ├── camera/
│   │   │   ├── CameraController.ts       # Trauma camera shake, viewport damping
│   │   │   └── index.ts
│   │   ├── environment/
│   │   │   ├── Environment.ts            # Outdoor terrain, trees, iron gate, ritual lamps, fog, road
│   │   │   ├── MoonTexture.ts            # High-fidelity astronomical full moon procedural generator
│   │   │   ├── CinematicEnvironments.ts  # Scripted story environments (courtyard, school, veranda)
│   │   │   └── index.ts
│   │   ├── lighting/
│   │   │   ├── LightingManager.ts        # Moonlight, red window flicker, and ambient balance
│   │   │   └── index.ts
│   │   ├── audio/
│   │   │   ├── HorrorAudioManager.ts     # Real-time Web Audio API procedural horror sound system
│   │   │   └── index.ts
│   │   ├── physics/
│   │   │   ├── CollisionSystem.ts        # Bounding box colliders for gate and trees
│   │   │   └── index.ts
│   │   ├── interaction/
│   │   │   ├── InteractionManager.ts     # Raycast prompt detector & distance calculator
│   │   │   └── index.ts
│   │   └── effects/
│   │       ├── BatSwarm.ts               # 3D bat flocking particles
│   │       ├── CinematicCharacters.ts    # Scripted character rigs for narrative cinematics
│   │       ├── CinematicMaterials.ts     # Dark horror materials (wood, stone, blood, cloth)
│   │       ├── GhostEntity.ts            # Distorted tall supernatural horror apparition
│   │       └── index.ts
│   │
│   ├── systems/
│   │   ├── gate/
│   │   │   ├── GateSystem.ts             # Gate phase progression, creak audio, chain unlock
│   │   │   └── index.ts
│   │   ├── lamps/
│   │   │   ├── LampRitualSystem.ts       # Three-lamp ritual sequence and completion check
│   │   │   └── index.ts
│   │   ├── hammer/
│   │   │   ├── BungalowHammerDirector.ts # Door strike horror sequence with camera shake
│   │   │   ├── HammerSystem.ts           # Hammer pickup and strike tally
│   │   │   └── index.ts
│   │   ├── ghost/
│   │   │   ├── PostStoryHorrorScareDirector.ts # Scare sequence orchestrator
│   │   │   ├── GhostSystem.ts            # Supernatural events manager
│   │   │   └── index.ts
│   │   ├── inventory/
│   │   │   ├── InventorySystem.ts        # Item collection, keys, tools, documents
│   │   │   └── index.ts
│   │   └── story/
│   │       ├── InGameStoryDirector.ts    # Multi-scene narrative memory sequence director
│   │       ├── StorySystem.ts            # Narrative progress tracking
│   │       └── index.ts
│   │
│   ├── screens/
│   │   ├── OpeningScreen/
│   │   │   ├── OpeningScreen.tsx         # Atmospheric 2D/3D title sequence & audio unlock
│   │   │   └── index.ts
│   │   ├── MainMenu/
│   │   │   ├── MainMenu.tsx              # Main menu screen
│   │   │   └── index.ts
│   │   ├── Settings/
│   │   │   ├── SettingsModal.tsx         # Audio and graphics configurations
│   │   │   └── index.ts
│   │   └── Game/
│   │       ├── Game.tsx                  # Core gameplay coordinator and UI orchestrator
│   │       └── index.ts
│   │
│   ├── hooks/
│   │   ├── useKeyboardControls.ts        # Keyboard input hook
│   │   └── index.ts
│   ├── utils/
│   │   └── index.ts                      # WebGL detector, fullscreen helper, math utils
│   ├── types/
│   │   └── index.ts                      # Re-exported shared types
│   ├── constants/
│   │   └── index.ts                      # Re-exported shared constants
│   ├── styles/
│   │   └── index.css                     # Tailwind CSS v4, custom glitch keyframes
│   ├── assets/
│   │   ├── images/
│   │   ├── textures/
│   │   ├── models/
│   │   ├── audio/
│   │   └── fonts/
│   │
│   ├── App.tsx                           # Root React application component
│   └── main.tsx                          # Vite React DOM entry point
│
├── backend/
│   ├── api/
│   │   └── index.ts                      # API exports
│   ├── routes/
│   │   └── api.router.ts                 # /api/health and /api/horror/lore routes
│   ├── services/
│   │   └── loreService.ts                # Gemini 2.5 Flash & procedural horror whisper generator
│   ├── middleware/
│   │   └── index.ts                      # Request logger and error handler
│   ├── utils/
│   │   └── index.ts                      # Backend environment and server helpers
│   ├── types/
│   │   └── index.ts                      # API request and response types
│   └── server.ts                         # Express server with Vite middleware integration
│
├── shared/
│   ├── types/
│   │   └── index.ts                      # Universal TypeScript interfaces
│   ├── constants/
│   │   └── index.ts                      # Universal game configuration and defaults
│   └── utils/
│       └── index.ts                      # Clamp, lerp, and ground distance helpers
│
├── public/
│   └── favicon/
│       └── favicon.svg                   # Atmospheric horror SVG favicon
│
├── docs/
│   ├── ARCHITECTURE.md                   # System architecture and data flow
│   ├── GAME_SYSTEMS.md                   # Mechanics specification for gate, lamps, hammer, ghost
│   ├── PROJECT_RULES.md                  # Development rules and coding standards
│   └── FILE_STRUCTURE.md                 # Complete file structure documentation
│
├── index.html                            # HTML5 root with meta tags and typography
├── server.ts                             # Root server entry delegating to backend/server.ts
├── vite.config.ts                        # Vite configuration with @frontend, @backend, @shared aliases
├── tsconfig.json                         # TypeScript configuration with path mappings
└── package.json                          # Dependencies and npm scripts
```
