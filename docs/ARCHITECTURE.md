# The House of Devil — System Architecture

## Overview

"The House of Devil" is a 3D first-person psychological horror web experience built with **React 19**, **Three.js**, **Web Audio API**, and **Express / TypeScript**.

The application is structured into decoupled domains:
1. **Frontend (`/frontend`)**: Presentation, Three.js 3D world rendering, player camera, UI HUDs, audio synthesis, and cinematic scenes.
2. **Backend (`/backend`)**: Express server, Vite middleware handling, health reporting, and procedural / Gemini 2.5 Flash horror lore API routes.
3. **Shared (`/shared`)**: Type definitions, constants, and math/formatting utilities shared seamlessly across client and server.
4. **Systems (`/frontend/systems`)**: Independent game gameplay loop systems (Gate, Lamp ritual, Hammer strike, Ghost scare, Inventory, Story progression).

---

## High-Level Architecture Diagram

```
+-----------------------------------------------------------------------------------+
|                                  BROWSER CLIENT                                   |
|                                                                                   |
|  +-----------------------------------------------------------------------------+  |
|  |                             React Presentation Layer                        |  |
|  |  OpeningScreen | MainMenu | SettingsModal | GameHUD | ClueInspect | Invent. |  |
|  +---------------------------------------+-------------------------------------+  |
|                                          |                                        |
|  +---------------------------------------v-------------------------------------+  |
|  |                           Gameplay Screen (Game.tsx)                        |  |
|  |      - Active interaction prompts & raycasting                               |  |
|  |      - Ritual state & objective synchronization                             |  |
|  |      - FPP keyboard / mobile touch controls                                  |  |
|  +--------+------------------------------+------------------------------+------+  |
|           |                              |                              |         |
|  +--------v--------+           +---------v----------+          +--------v------+  |
|  |   GameEngine    |           |   HorrorAudio      |          |  Game Systems |  |
|  | - Three.js scene|           | - Web Audio API    |          | - GateSystem  |  |
|  | - PerspectiveCam|           | - Procedural wind  |          | - LampRitual  |  |
|  | - WebGLRenderer |           | - Footsteps, jumps |          | - HammerSys   |  |
|  | - Environment   |           | - Heartbeat scale  |          | - GhostSystem |  |
|  | - BungalowWorld |           | - Zero-clipping    |          | - StoryDirector| |
|  +-----------------+           +--------------------+          +---------------+  |
+------------------------------------------+----------------------------------------+
                                           | Fetch / API Calls
+------------------------------------------v----------------------------------------+
|                                EXPRESS BACKEND SERVER                             |
|                                                                                   |
|  +--------------------+        +---------------------+      +------------------+  |
|  |   Vite Middleware  |        |     API Routes      |      |   LoreService    |  |
|  |   (Development)    |        |   /api/health       |      | - Gemini 2.5     |  |
|  |   or Static Dist   |        |   /api/horror/lore  |----->| - Procedural     |  |
|  |   (Production)     |        +---------------------+      |   Fallbacks      |  |
|  +--------------------+                                     +------------------+  |
+-----------------------------------------------------------------------------------+
```

---

## Key Subsystems

### 1. Rendering Pipeline
- **Scene**: Contains terrain, the outer road, iron gate, dead trees, the abandoned bungalow, the photo-realistic astronomical full moon, dynamic lighting, and volumetric mist particles.
- **Player Camera**: Perspective camera anchored at player eye height (1.70m), equipped with a smooth head bobbing algorithm and flashlight spotlight.
- **Lighting**: Realistic full-moon directional light, ambient colonial dark tones, red bungalow window light with subtle randomized flickering, and oil lamp flames with additive billboard sprites.

### 2. Audio Engine (`HorrorAudioManager`)
- Synthesizes 100% real-time audio through the browser's Web Audio API without needing large external sound files.
- Includes equal-power loop crossfading, a 32Hz subsonic protection filter, 40ms lookahead master compression to prevent clipping, and 3D positional panning relative to player orientation.

### 3. Story & Scare Directors
- **InGameStoryDirector**: Controls multi-scene camera movements, character animations, audio cues, and dialogue subtitles.
- **BungalowHammerDirector**: Orchestrates the 3-strike gate/door hit sequence with camera recoil and dust particles.
- **PostStoryHorrorScareDirector**: Triggers the sudden apparition of the distorted tall ghost entity.
