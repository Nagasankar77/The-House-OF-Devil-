# The House of Devil — Game Systems

This document describes the mechanics, flow, and state transitions of each gameplay system.

---

## 1. Iron Gate System (`frontend/systems/gate`)

- **Location**: Located at `z = -18.0` along the main path.
- **Phases**:
  1. `GATE_CLOSED`: Bound by heavy chains and rusted lock.
  2. `HIT_1` / `HIT_2` / `HIT_3`: Incremental impacts delivered via the heavy iron hammer.
  3. `UNLOCKING` / `OPENING`: Chains snap with metallic stress audio; hinges swing open outward.
  4. `GATE_OPEN`: Gate barrier disabled; passage unlocked.
- **Audio Cues**: Metallic chain tension, deep creaking that scales inversely with distance to the gate, and impact clangs.

---

## 2. Three-Lamp Ritual System (`frontend/systems/lamps`)

- **Objective**: Unseal the passage to the bungalow grounds.
- **Mechanic**:
  - Three oil lamps placed strategically along the perimeter.
  - Lamp 1 & Lamp 2 are accessible first.
  - Upon lighting Lamp 1 and Lamp 2, Lamp 3 is revealed with an eerie audio sting and red bungalow window flicker.
  - Lighting Lamp 3 completes the ritual, dissipating dense barrier mist and unlocking subsequent clues.
- **Performance Guard**:
  - Each lamp has a strict single-activation flag (`lampActivated = true`).
  - Lighting transitions smooth intensity from 0 to target intensity without reallocating materials or creating lights per frame.

---

## 3. Hammer & Door Strike System (`frontend/systems/hammer`)

- **Objective**: Break through barricaded obstacles.
- **Director**: `BungalowHammerDirector` handles the strike sequence:
  - First-person hammer swing animation.
  - Impact recoil applied to the camera with `CameraController.triggerShake()`.
  - Splinter debris particle burst and procedural wood creak audio.
  - On the 3rd hit, the door yields and swings open.

---

## 4. Ghost & Psychological Scare System (`frontend/systems/ghost`)

- **Entity**: `GhostEntityFactory` builds a tall (2.4m), elongated, pale supernatural figure with drooping arms and distorted proportions.
- **Sequence**:
  - Stalking steps trigger behind player when looking away.
  - Sudden lightning flash reveals the silhouette against the bungalow facade.
  - Audio dissonance chord with rapid stereo panning.

---

## 5. Inventory System (`frontend/systems/inventory`)

- **Categories**:
  - `KEY`: Gate keys, interior brass keys.
  - `TOOL`: Heavy iron hammer, lighter.
  - `SUPPLY`: Flashlight spare batteries.
  - `DOCUMENT`: Torn journal pages, colonial notices, letters.
- **Modal View**: `InventoryModal` provides 3D inspection and detailed lore reading.

---

## 6. Story Cinematic System (`frontend/systems/story`)

- **Director**: `InGameStoryDirector` seamlessly switches between active first-person exploration and scripted third-person narrative memories.
- **HUD**: `StoryCinematicHUD` renders subtitles with character portraits, typing animation, and skip functionality.

---

## 7. Five-Item Sequential Collection Puzzle (`frontend/systems/puzzle`)

- **Location**: Central Foyer Hallway before the Grand Staircase (`x: 2.50, z: -66.25`).
- **Elements**:
  - **The Blackboard**: Dynamically rendered high-resolution chalkboard canvas texture displaying the mission inscription poem and a live objectives checklist with status indicators.
  - **The Central Table**: Colonial dark teak table with a maroon runner where collected belongings are placed.
  - **Concealed Secret Door & Passage**: Seamlessly built into the right hallway wall segment. Unlocks and slides open outward once all five items are placed on the table, revealing a hidden stone cellar corridor and an occult altar with a blood-red devil candle.
- **The Five Belongings (Sequential Progression)**:
  1. `DIARY` (Study Room): Aged leather journal with yellowed parchment pages.
  2. `WATCH` (Master Bedroom): Antique gold wristwatch stopped at 3:17.
  3. `PINK_FLOWER` (Living Room): Preserved pink rose blossom resting on the parlor coffee table.
  4. `BAG` (Storage Room): Weathered leather traveler's satchel on a tool crate.
  5. `SPECTACLES` (Dining Room): Wire-rimmed reading glasses on the colonial dining table.
- **Spawning Rules**:
  - **Strictly One Active Item at a Time**: Only the current objective item exists physically in the world with a subtle breathing glint. Future items are completely hidden until the previous item is collected.
  - **Placement**: Once collected into the player's satchel, items can be placed onto the central table, rendering realistic 3D models resting in designated slots.
  - **Unsealing**: When the 5th item is placed, a mechanical stone rumbling sound triggers as the secret wall shifts, giving access to the hidden chamber.

