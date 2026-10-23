import * as THREE from 'three';
import {
  BasementItemType,
  BasementPuzzleState,
  InventoryItem,
} from '../../../shared/types';
import { InteractionManager } from '../../game/interaction/InteractionManager';
import { horrorAudio } from '../../game/audio/HorrorAudioManager';
import { HumanSkeletonFactory } from '../../game/world/BasementInterior';

export class BasementPuzzleSystem {
  public scene: THREE.Scene;
  public interactionManager: InteractionManager;
  public group: THREE.Group = new THREE.Group();

  // Puzzle State
  public state: BasementPuzzleState = {
    pujaJugCollected: false,
    brokenBoneCollected: false,
    skullBoneCollected: false,
    pujaJugPlaced: false,
    brokenBonePlaced: false,
    skullBonePlaced: false,
    basementKeySpawned: false,
    hasBasementRoomKey: false,
    starDoorUnlocked: false,
    starDoorOpening: false,
    starDoorOpened: false,
  };

  // World Item Meshes (in discovery rooms)
  public pujaJugWorldMesh: THREE.Group | null = null;
  public brokenBoneWorldMesh: THREE.Group | null = null;
  public skullBoneWorldMesh: THREE.Group | null = null;

  // Placement Station & Placed Meshes (on the central pedestal)
  public stationPedestalMesh: THREE.Group | null = null;
  public placedPujaJugMesh: THREE.Group | null = null;
  public placedBrokenBoneMesh: THREE.Group | null = null;
  public placedSkullBoneMesh: THREE.Group | null = null;
  public keyMesh: THREE.Group | null = null;

  // Star-Marked Door & Collision
  public starDoorGroup: THREE.Group | null = null;
  public starDoorHinge: THREE.Group | null = null;
  public starDoorCollider: THREE.Box3 = new THREE.Box3();
  public stationCollider: THREE.Box3 = new THREE.Box3();

  // Elevation parameters matching BasementInterior
  private readonly floorY = -8.0;

  // Placement Station position in central corridor (near route to Doorway 4)
  public readonly stationPos = new THREE.Vector3(0.8, -8.0, -79.2);

  // Star Door location (at South Entrance to Room 5 Star Ritual Room: x = 0.0, z = -69.0)
  public readonly starDoorPos = new THREE.Vector3(0.0, -8.0, -69.0);

  // Door Opening Animation Progress (0 to 1)
  private starDoorOpenProgress = 0;

  // Callbacks
  public onStateChange: ((state: BasementPuzzleState) => void) | null = null;
  public onBanner: ((title: string, subtitle: string) => void) | null = null;

  // Shared PBR Materials
  private brassMat = new THREE.MeshStandardMaterial({
    color: 0xc69a42,
    roughness: 0.42,
    metalness: 0.75,
  });

  private darkBoneMat = new THREE.MeshStandardMaterial({
    color: 0x9e9382,
    roughness: 0.88,
    metalness: 0.04,
  });

  private ivoryBoneMat = new THREE.MeshStandardMaterial({
    color: 0xd6cbb8,
    roughness: 0.85,
    metalness: 0.04,
  });

  private darkWoodMat = new THREE.MeshStandardMaterial({
    color: 0x1b130f,
    roughness: 0.82,
    metalness: 0.06,
  });

  private ironMat = new THREE.MeshStandardMaterial({
    color: 0x221f1d,
    roughness: 0.70,
    metalness: 0.82,
  });

  private starEmblemMat = new THREE.MeshStandardMaterial({
    color: 0x860111,
    emissive: 0x450f10,
    emissiveIntensity: 0.55,
    roughness: 0.65,
    metalness: 0.35,
  });

  private stoneAltarMat = new THREE.MeshStandardMaterial({
    color: 0x201c1a,
    roughness: 0.90,
    metalness: 0.05,
  });

  constructor(scene: THREE.Scene, interactionManager: InteractionManager) {
    this.scene = scene;
    this.interactionManager = interactionManager;
    this.group.name = 'BasementPuzzleSystem';

    this.buildWorldItems();
    this.buildPlacementStation();
    this.buildStarMarkedDoor();
    this.registerInitialInteractions();

    this.scene.add(this.group);
  }

  // =========================================================================
  // 1. PROCEDURAL DETAILED 3D ITEM MESH BUILDERS
  // =========================================================================

  /**
   * Realistic traditional Indian brass puja water vessel (Kalash / Lota / Kamandalu)
   */
  public createPujaJugMesh(): THREE.Group {
    const jug = new THREE.Group();
    jug.name = 'Item_PujaJug';

    // 1. Base pedestal ring
    const baseGeo = new THREE.CylinderGeometry(0.08, 0.09, 0.03, 16);
    const base = new THREE.Mesh(baseGeo, this.brassMat);
    base.position.y = 0.015;
    base.castShadow = true;
    jug.add(base);

    // 2. Bulbous pot body
    const bodyGeo = new THREE.SphereGeometry(0.14, 16, 12);
    bodyGeo.scale(1.0, 0.88, 1.0);
    const body = new THREE.Mesh(bodyGeo, this.brassMat);
    body.position.y = 0.12;
    body.castShadow = true;
    jug.add(body);

    // 3. Narrow tapering shoulder
    const shoulderGeo = new THREE.CylinderGeometry(0.068, 0.132, 0.09, 16);
    const shoulder = new THREE.Mesh(shoulderGeo, this.brassMat);
    shoulder.position.y = 0.21;
    jug.add(shoulder);

    // 4. Neck
    const neckGeo = new THREE.CylinderGeometry(0.056, 0.068, 0.08, 16);
    const neck = new THREE.Mesh(neckGeo, this.brassMat);
    neck.position.y = 0.27;
    jug.add(neck);

    // 5. Flared decorative lip & rim
    const rimGeo = new THREE.CylinderGeometry(0.105, 0.056, 0.035, 16);
    const rim = new THREE.Mesh(rimGeo, this.brassMat);
    rim.position.y = 0.32;
    jug.add(rim);

    // 6. Curved ceremonial handle
    const handleGeo = new THREE.TorusGeometry(0.09, 0.015, 8, 16, Math.PI * 0.95);
    const handle = new THREE.Mesh(handleGeo, this.brassMat);
    handle.position.set(-0.11, 0.20, 0);
    handle.rotation.z = Math.PI * 0.45;
    jug.add(handle);

    // 7. Engraved collar bands
    const collarGeo = new THREE.TorusGeometry(0.07, 0.008, 6, 16);
    collarGeo.rotateX(Math.PI / 2);
    const collar = new THREE.Mesh(collarGeo, this.brassMat);
    collar.position.y = 0.24;
    jug.add(collar);

    return jug;
  }

  /**
   * Realistic old fractured human bone with irregular broken end and marrow cavity
   */
  public createHalfBrokenBoneMesh(): THREE.Group {
    const bone = new THREE.Group();
    bone.name = 'Item_HalfBrokenBone';

    // 1. Intact femoral condyles (two rounded bone ends)
    const condyleGeo = new THREE.SphereGeometry(0.032, 8, 8);
    const condyle1 = new THREE.Mesh(condyleGeo, this.ivoryBoneMat);
    condyle1.position.set(-0.022, 0, -0.16);
    bone.add(condyle1);

    const condyle2 = new THREE.Mesh(condyleGeo, this.ivoryBoneMat);
    condyle2.position.set(0.022, 0, -0.16);
    bone.add(condyle2);

    // 2. Bone neck & transition
    const neckGeo = new THREE.CylinderGeometry(0.024, 0.032, 0.06, 8);
    neckGeo.rotateX(Math.PI / 2);
    const neck = new THREE.Mesh(neckGeo, this.ivoryBoneMat);
    neck.position.set(0, 0, -0.12);
    bone.add(neck);

    // 3. Cortical bone shaft
    const shaftGeo = new THREE.CylinderGeometry(0.022, 0.024, 0.22, 8);
    shaftGeo.rotateX(Math.PI / 2);
    const shaft = new THREE.Mesh(shaftGeo, this.ivoryBoneMat);
    shaft.position.set(0, 0, 0.02);
    shaft.castShadow = true;
    bone.add(shaft);

    // 4. Exposed dark marrow cavity at fracture point
    const marrowMat = new THREE.MeshStandardMaterial({
      color: 0x3d2b24,
      roughness: 0.95,
    });
    const marrowGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.04, 8);
    marrowGeo.rotateX(Math.PI / 2);
    const marrow = new THREE.Mesh(marrowGeo, marrowMat);
    marrow.position.set(0, 0, 0.135);
    bone.add(marrow);

    // 5. Irregular broken bone shards / splintered fracture spurs
    const shardGeo1 = new THREE.ConeGeometry(0.012, 0.05, 4);
    shardGeo1.rotateX(-Math.PI / 2);
    const shard1 = new THREE.Mesh(shardGeo1, this.ivoryBoneMat);
    shard1.position.set(0.012, 0.008, 0.155);
    bone.add(shard1);

    const shardGeo2 = new THREE.ConeGeometry(0.010, 0.035, 4);
    shardGeo2.rotateX(-Math.PI / 2);
    const shard2 = new THREE.Mesh(shardGeo2, this.ivoryBoneMat);
    shard2.position.set(-0.014, -0.006, 0.145);
    bone.add(shard2);

    const shardGeo3 = new THREE.ConeGeometry(0.009, 0.025, 4);
    shardGeo3.rotateX(-Math.PI / 2);
    const shard3 = new THREE.Mesh(shardGeo3, this.ivoryBoneMat);
    shard3.position.set(0.006, -0.012, 0.14);
    bone.add(shard3);

    return bone;
  }

  /**
   * Anatomically proportioned aged human skull with orbits and jaw
   */
  public createSkullBoneMesh(): THREE.Group {
    const skull = HumanSkeletonFactory.createSkull(0.95, true);
    skull.name = 'Item_SkullBone';
    return skull;
  }

  /**
   * Antique brass star key with 5-pointed star bow and notched bit
   */
  public createStarKeyMesh(): THREE.Group {
    const key = new THREE.Group();
    key.name = 'Item_StarKey';

    const keyMat = new THREE.MeshStandardMaterial({
      color: 0xc49a42,
      roughness: 0.45,
      metalness: 0.78,
    });

    // 1. Ornate Circular Bow Ring
    const bowRingGeo = new THREE.TorusGeometry(0.045, 0.008, 6, 16);
    const bowRing = new THREE.Mesh(bowRingGeo, keyMat);
    bowRing.position.set(0, 0, -0.08);
    key.add(bowRing);

    // 2. 5-Pointed Star Bow Center Emblem
    for (let i = 0; i < 5; i++) {
      const angle = (i * Math.PI * 2) / 5 - Math.PI / 2;
      const rayGeo = new THREE.ConeGeometry(0.012, 0.042, 4);
      const ray = new THREE.Mesh(rayGeo, keyMat);
      ray.position.set(Math.cos(angle) * 0.024, Math.sin(angle) * 0.024, -0.08);
      ray.rotation.z = angle - Math.PI / 2;
      key.add(ray);
    }

    // 3. Key Shaft / Barrel
    const stemGeo = new THREE.CylinderGeometry(0.009, 0.009, 0.16, 8);
    stemGeo.rotateX(Math.PI / 2);
    const stem = new THREE.Mesh(stemGeo, keyMat);
    stem.position.set(0, 0, 0.01);
    stem.castShadow = true;
    key.add(stem);

    // Decorative collar on shank
    const collarGeo = new THREE.TorusGeometry(0.014, 0.004, 6, 12);
    const collar = new THREE.Mesh(collarGeo, keyMat);
    collar.position.set(0, 0, -0.035);
    key.add(collar);

    // 4. Notched Bit Wards
    const bitGeo = new THREE.BoxGeometry(0.008, 0.036, 0.032);
    const bit = new THREE.Mesh(bitGeo, keyMat);
    bit.position.set(0, -0.018, 0.075);
    key.add(bit);

    const notch = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.014, 0.012), this.stoneAltarMat);
    notch.position.set(0, -0.012, 0.075);
    key.add(notch);

    return key;
  }

  // =========================================================================
  // 2. PLACE WORLD ITEMS IN EXISTING BASEMENT ROOMS
  // =========================================================================

  private buildWorldItems(): void {
    // 1. PUJA JUG: In Existing Puja Room (Room 3, Lower-Left)
    // Placed on the sacred red sandstone altar shelf
    this.pujaJugWorldMesh = this.createPujaJugMesh();
    this.pujaJugWorldMesh.position.set(-10.85, this.floorY + 0.58, -76.25);
    this.pujaJugWorldMesh.rotation.y = 0.45;
    this.group.add(this.pujaJugWorldMesh);

    // 2. HALF-BROKEN BONE: In Existing Skeleton Room 1 (Room 1, Upper-Left)
    // Placed on the stone floor near the mortuary slab and bones
    this.brokenBoneWorldMesh = this.createHalfBrokenBoneMesh();
    this.brokenBoneWorldMesh.position.set(-11.80, this.floorY + 0.03, -89.20);
    this.brokenBoneWorldMesh.rotation.set(0.08, 0.65, 0);
    this.group.add(this.brokenBoneWorldMesh);

    // 3. SKULL BONE: In Existing Skeleton Room 2 (Room 2, Upper-Right)
    // Placed on an accessible stone surface near the skeletons
    this.skullBoneWorldMesh = this.createSkullBoneMesh();
    this.skullBoneWorldMesh.position.set(12.50, this.floorY + 0.28, -89.50);
    this.skullBoneWorldMesh.rotation.set(0.12, -0.40, 0.15);
    this.group.add(this.skullBoneWorldMesh);
  }

  // =========================================================================
  // 3. RITUAL PLACEMENT STATION (CENTRAL BASEMENT CORRIDOR)
  // =========================================================================

  private buildPlacementStation(): void {
    this.stationPedestalMesh = new THREE.Group();
    this.stationPedestalMesh.position.copy(this.stationPos);

    // 1. Carved Stone Base Plinth
    const baseGeo = new THREE.BoxGeometry(1.42, 0.16, 0.76);
    const base = new THREE.Mesh(baseGeo, this.stoneAltarMat);
    base.position.y = 0.08;
    base.castShadow = true;
    base.receiveShadow = true;
    this.stationPedestalMesh.add(base);

    // 2. Pedestal Central Body with pilasters
    const bodyGeo = new THREE.BoxGeometry(1.26, 0.68, 0.62);
    const body = new THREE.Mesh(bodyGeo, this.stoneAltarMat);
    body.position.y = 0.16 + 0.34;
    body.castShadow = true;
    body.receiveShadow = true;
    this.stationPedestalMesh.add(body);

    // Occult Carved Inscription Relief on front
    const frontRelief = new THREE.Mesh(
      new THREE.BoxGeometry(0.96, 0.44, 0.03),
      new THREE.MeshStandardMaterial({
        color: 0x450f10,
        roughness: 0.82,
        metalness: 0.12,
      })
    );
    frontRelief.position.set(0, 0.50, 0.32);
    this.stationPedestalMesh.add(frontRelief);

    // 3. Top Altar Table Slab (surface at floorY + 0.92)
    const slabGeo = new THREE.BoxGeometry(1.46, 0.12, 0.82);
    const slab = new THREE.Mesh(slabGeo, this.stoneAltarMat);
    slab.position.y = 0.16 + 0.68 + 0.06;
    slab.castShadow = true;
    slab.receiveShadow = true;
    this.stationPedestalMesh.add(slab);

    const tableTopY = 0.96;

    // 4. THREE CARVED RITUAL PLACEMENT RECESSES
    // (A) Left Recess: Carved Brass Mandala Plate for Puja Jug (x = -0.42)
    const leftPlate = new THREE.Mesh(
      new THREE.CylinderGeometry(0.16, 0.16, 0.015, 16),
      this.brassMat
    );
    leftPlate.position.set(-0.42, tableTopY + 0.008, 0);
    this.stationPedestalMesh.add(leftPlate);

    // (B) Center Recess: Carved Shallow Bone Bed for Half-Broken Bone (x = 0)
    const centerBed = new THREE.Mesh(
      new THREE.BoxGeometry(0.38, 0.015, 0.14),
      new THREE.MeshStandardMaterial({ color: 0x14100e, roughness: 0.92 })
    );
    centerBed.position.set(0, tableTopY + 0.008, 0);
    this.stationPedestalMesh.add(centerBed);

    // (C) Right Recess: Carved Disc with Skull Mark for Skull Bone (x = +0.42)
    const rightPlate = new THREE.Mesh(
      new THREE.CylinderGeometry(0.15, 0.15, 0.015, 16),
      new THREE.MeshStandardMaterial({ color: 0x2a1c18, roughness: 0.85 })
    );
    rightPlate.position.set(0.42, tableTopY + 0.008, 0);
    this.stationPedestalMesh.add(rightPlate);

    // Placed 3D Models (Initially hidden, revealed upon placement)
    // 1. Placed Puja Jug
    this.placedPujaJugMesh = this.createPujaJugMesh();
    this.placedPujaJugMesh.position.set(-0.42, tableTopY + 0.01, 0);
    this.placedPujaJugMesh.visible = false;
    this.stationPedestalMesh.add(this.placedPujaJugMesh);

    // 2. Placed Half-Broken Bone
    this.placedBrokenBoneMesh = this.createHalfBrokenBoneMesh();
    this.placedBrokenBoneMesh.position.set(0, tableTopY + 0.025, 0);
    this.placedBrokenBoneMesh.rotation.set(0, Math.PI / 2, 0);
    this.placedBrokenBoneMesh.visible = false;
    this.stationPedestalMesh.add(this.placedBrokenBoneMesh);

    // 3. Placed Skull Bone
    this.placedSkullBoneMesh = this.createSkullBoneMesh();
    this.placedSkullBoneMesh.position.set(0.42, tableTopY + 0.01, 0);
    this.placedSkullBoneMesh.visible = false;
    this.stationPedestalMesh.add(this.placedSkullBoneMesh);

    // 4. Revealed Star Key (Initially hidden, spawns on center front ledge after all 3 placed)
    this.keyMesh = this.createStarKeyMesh();
    this.keyMesh.position.set(0, tableTopY + 0.015, 0.28);
    this.keyMesh.rotation.set(-Math.PI / 2, 0, 0.35);
    this.keyMesh.visible = false;
    this.stationPedestalMesh.add(this.keyMesh);

    this.group.add(this.stationPedestalMesh);

    // Solid Collider for Pedestal
    this.stationCollider.setFromCenterAndSize(
      new THREE.Vector3(this.stationPos.x, this.stationPos.y + 0.48, this.stationPos.z),
      new THREE.Vector3(1.50, 0.98, 0.85)
    );
  }

  // =========================================================================
  // 4. STAR-MARKED LOCKED DOOR (AT DOORWAY 4: X = 3.5, Z = -77.0)
  // =========================================================================

  private buildStarMarkedDoor(): void {
    this.starDoorGroup = new THREE.Group();
    this.starDoorGroup.name = 'StarMarkedDoorGroup';

    // Doorway opening spans x in [-1.0, 1.0] (2.0m wide) at z = -69.0, height = 2.8m
    // Hinge pivot at east edge: x = 0.95, z = -69.0
    this.starDoorHinge = new THREE.Group();
    this.starDoorHinge.name = 'StarDoorHingePivot';
    this.starDoorHinge.position.set(0.95, this.floorY, this.starDoorPos.z);

    const doorW = 1.90;
    const doorH = 2.72;
    const doorThick = 0.12;

    // Heavy aged hardwood door panel
    // In local hinge coordinates, door extends from x = 0 to x = -doorW (-1.90m)
    const doorGeo = new THREE.BoxGeometry(doorW, doorH, doorThick);
    const doorMesh = new THREE.Mesh(doorGeo, this.darkWoodMat);
    doorMesh.position.set(-doorW / 2, doorH / 2, 0);
    doorMesh.castShadow = true;
    doorMesh.receiveShadow = true;
    this.starDoorHinge.add(doorMesh);

    // Reinforced iron strap bands (3 horizontal bands)
    const bandGeo = new THREE.BoxGeometry(doorW + 0.04, 0.08, doorThick + 0.02);
    for (let b = 0; b < 3; b++) {
      const band = new THREE.Mesh(bandGeo, this.ironMat);
      band.position.set(-doorW / 2, 0.45 + b * 0.90, 0);
      this.starDoorHinge.add(band);
    }

    // Heavy iron lock plate and keyhole (on free side: near x = -doorW + 0.22)
    const lockPlate = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.22, doorThick + 0.03), this.ironMat);
    lockPlate.position.set(-doorW + 0.22, 1.25, 0);
    this.starDoorHinge.add(lockPlate);

    // PROMINENT 5-POINTED STAR EMBLEM IN DOOR CENTER (Eye level y = floorY + 1.65)
    const starCenterX = -doorW / 2;
    const starCenterY = 1.65;
    const starRingGeo = new THREE.TorusGeometry(0.25, 0.022, 8, 24);

    // Front Face Emblem (facing North toward corridor: -Z)
    const emblemFrontZ = -doorThick / 2 - 0.015;
    const starRingFront = new THREE.Mesh(starRingGeo, this.ironMat);
    starRingFront.position.set(starCenterX, starCenterY, emblemFrontZ);
    this.starDoorHinge.add(starRingFront);

    for (let i = 0; i < 5; i++) {
      const angle = (i * Math.PI * 2) / 5 - Math.PI / 2;
      const armGeo = new THREE.ConeGeometry(0.045, 0.22, 4);
      armGeo.rotateZ(angle - Math.PI / 2);
      const arm = new THREE.Mesh(armGeo, this.starEmblemMat);
      arm.position.set(
        starCenterX + Math.cos(angle) * 0.11,
        starCenterY + Math.sin(angle) * 0.11,
        emblemFrontZ - 0.01
      );
      this.starDoorHinge.add(arm);
    }

    const coreFront = new THREE.Mesh(
      new THREE.CylinderGeometry(0.065, 0.065, 0.03, 16),
      this.brassMat
    );
    coreFront.rotateX(Math.PI / 2);
    coreFront.position.set(starCenterX, starCenterY, emblemFrontZ - 0.012);
    this.starDoorHinge.add(coreFront);

    // Back Face Emblem (facing inside Room 5: +Z)
    const emblemBackZ = doorThick / 2 + 0.015;
    const starRingBack = new THREE.Mesh(starRingGeo, this.ironMat);
    starRingBack.position.set(starCenterX, starCenterY, emblemBackZ);
    this.starDoorHinge.add(starRingBack);

    for (let i = 0; i < 5; i++) {
      const angle = (i * Math.PI * 2) / 5 - Math.PI / 2;
      const armGeo = new THREE.ConeGeometry(0.045, 0.22, 4);
      armGeo.rotateZ(angle - Math.PI / 2);
      const arm = new THREE.Mesh(armGeo, this.starEmblemMat);
      arm.position.set(
        starCenterX + Math.cos(angle) * 0.11,
        starCenterY + Math.sin(angle) * 0.11,
        emblemBackZ + 0.01
      );
      this.starDoorHinge.add(arm);
    }

    const coreBack = new THREE.Mesh(
      new THREE.CylinderGeometry(0.065, 0.065, 0.03, 16),
      this.brassMat
    );
    coreBack.rotateX(Math.PI / 2);
    coreBack.position.set(starCenterX, starCenterY, emblemBackZ + 0.012);
    this.starDoorHinge.add(coreBack);

    this.starDoorGroup.add(this.starDoorHinge);
    this.group.add(this.starDoorGroup);

    // Solid Door Collider blocking passage while locked
    this.starDoorCollider.setFromCenterAndSize(
      new THREE.Vector3(0.0, this.floorY + doorH / 2, this.starDoorPos.z),
      new THREE.Vector3(2.05, doorH, 0.45)
    );
  }

  // =========================================================================
  // 5. REGISTER INTERACTION SYSTEM PROMPTS
  // =========================================================================

  private registerInitialInteractions(): void {
    // 1. PUJA JUG PICKUP
    this.interactionManager.register({
      id: 'BASEMENT_ITEM_PUJA_JUG',
      name: 'Puja Jug',
      type: 'BASEMENT_PUJA_JUG_PICKUP',
      position: new THREE.Vector3(-10.85, this.floorY + 0.65, -76.25),
      radius: 2.8,
      priority: 100,
      promptText: '[E] PICK UP PUJA JUG',
      subText: 'Puja Room Altar',
      isUnlocked: () => !this.state.pujaJugCollected,
    });

    // 2. HALF-BROKEN BONE PICKUP
    this.interactionManager.register({
      id: 'BASEMENT_ITEM_BROKEN_BONE',
      name: 'Half-Broken Bone',
      type: 'BASEMENT_BROKEN_BONE_PICKUP',
      position: new THREE.Vector3(-11.80, this.floorY + 0.35, -89.20),
      radius: 2.8,
      priority: 100,
      promptText: '[E] PICK UP BROKEN BONE',
      subText: 'Skeleton Room 1',
      isUnlocked: () => !this.state.brokenBoneCollected,
    });

    // 3. SKULL BONE PICKUP
    this.interactionManager.register({
      id: 'BASEMENT_ITEM_SKULL_BONE',
      name: 'Skull Bone',
      type: 'BASEMENT_SKULL_BONE_PICKUP',
      position: new THREE.Vector3(12.50, this.floorY + 0.50, -89.50),
      radius: 2.8,
      priority: 100,
      promptText: '[E] PICK UP SKULL BONE',
      subText: 'Skeleton Room 2',
      isUnlocked: () => !this.state.skullBoneCollected,
    });

    // 4. RITUAL PLACEMENT STATION (Shows [E] PLACE ITEM when carrying eligible item)
    this.interactionManager.register({
      id: 'BASEMENT_PLACEMENT_STATION',
      name: 'Ritual Pedestal',
      type: 'BASEMENT_STATION_PLACE',
      position: new THREE.Vector3(this.stationPos.x, this.floorY + 0.95, this.stationPos.z),
      radius: 2.6,
      priority: 80,
      promptText: '[E] PLACE ITEM',
      subText: 'Ritual Pedestal',
      isUnlocked: () => this.hasUnplacedCarriedItem(),
    });

    // 5. STAR-MARKED LOCKED DOOR
    this.interactionManager.register({
      id: 'BASEMENT_STAR_DOOR',
      name: 'Star-Marked Door',
      type: 'BASEMENT_STAR_DOOR_UNLOCK',
      position: new THREE.Vector3(0.0, this.floorY + 1.4, this.starDoorPos.z - 0.15),
      mesh: this.starDoorGroup,
      ignoreCollider: this.starDoorCollider,
      radius: 3.8,
      priority: 95,
      promptText: () => (this.state.hasBasementRoomKey ? '[E] UNLOCK STAR DOOR' : 'LOCKED — FIND THE KEY'),
      subText: () => (this.state.hasBasementRoomKey ? 'Sealed Chamber' : 'Star-Marked Door'),
      isUnlocked: () => !this.state.starDoorUnlocked && !this.state.starDoorOpened,
    });
  }

  // =========================================================================
  // 6. PUZZLE GAMEPLAY ACTIONS
  // =========================================================================

  /**
   * Checks if player carries any unplaced basement item
   */
  public hasUnplacedCarriedItem(): boolean {
    if (this.state.pujaJugCollected && !this.state.pujaJugPlaced) return true;
    if (this.state.brokenBoneCollected && !this.state.brokenBonePlaced) return true;
    if (this.state.skullBoneCollected && !this.state.skullBonePlaced) return true;
    return false;
  }

  /**
   * Gets the next eligible carried item to place
   */
  public getNextItemToPlace(): BasementItemType | null {
    if (this.state.pujaJugCollected && !this.state.pujaJugPlaced) return 'PUJA_JUG';
    if (this.state.brokenBoneCollected && !this.state.brokenBonePlaced) return 'HALF_BROKEN_BONE';
    if (this.state.skullBoneCollected && !this.state.skullBonePlaced) return 'SKULL_BONE';
    return null;
  }

  /**
   * Collects Puja Jug
   */
  public collectPujaJug(): InventoryItem | null {
    if (this.state.pujaJugCollected) return null;
    this.state.pujaJugCollected = true;

    if (this.pujaJugWorldMesh) {
      this.pujaJugWorldMesh.visible = false;
    }
    this.interactionManager.unregister('BASEMENT_ITEM_PUJA_JUG');
    horrorAudio.playItemPickup();

    this.notifyState();

    return {
      id: 'BASEMENT_ITEM_PUJA_JUG',
      name: 'Puja Jug',
      category: 'RELIC',
      description: 'An old traditional brass puja water vessel, slightly tarnished with aged sacred patina.',
      details: 'Ceremonial brass vessel found on the altar in the underground puja room.',
      iconType: 'puja_jug',
      quantity: 1,
      acquiredAt: 'Basement Puja Room',
    };
  }

  /**
   * Collects Half-Broken Bone
   */
  public collectBrokenBone(): InventoryItem | null {
    if (this.state.brokenBoneCollected) return null;
    this.state.brokenBoneCollected = true;

    if (this.brokenBoneWorldMesh) {
      this.brokenBoneWorldMesh.visible = false;
    }
    this.interactionManager.unregister('BASEMENT_ITEM_BROKEN_BONE');
    horrorAudio.playItemPickup();

    this.notifyState();

    return {
      id: 'BASEMENT_ITEM_BROKEN_BONE',
      name: 'Half-Broken Bone',
      category: 'RELIC',
      description: 'A realistic old fractured bone with an irregular jagged broken end and exposed hollow marrow.',
      details: 'Old bone found lying beside the mortuary slab in the first skeleton room.',
      iconType: 'broken_bone',
      quantity: 1,
      acquiredAt: 'Basement Skeleton Room 1',
    };
  }

  /**
   * Collects Skull Bone
   */
  public collectSkullBone(): InventoryItem | null {
    if (this.state.skullBoneCollected) return null;
    this.state.skullBoneCollected = true;

    if (this.skullBoneWorldMesh) {
      this.skullBoneWorldMesh.visible = false;
    }
    this.interactionManager.unregister('BASEMENT_ITEM_SKULL_BONE');
    horrorAudio.playItemPickup();

    this.notifyState();

    return {
      id: 'BASEMENT_ITEM_SKULL_BONE',
      name: 'Skull Bone',
      category: 'RELIC',
      description: 'A realistic human skull with weathered bone material and hollow eye sockets.',
      details: 'Ancient skull found resting on a stone surface in the second skeleton room.',
      iconType: 'skull_bone',
      quantity: 1,
      acquiredAt: 'Basement Skeleton Room 2',
    };
  }

  /**
   * Places an item onto the placement station pedestal
   */
  public placeItemOnStation(itemType: BasementItemType): boolean {
    if (itemType === 'PUJA_JUG') {
      if (this.state.pujaJugPlaced) return false;
      this.state.pujaJugPlaced = true;
      if (this.placedPujaJugMesh) this.placedPujaJugMesh.visible = true;
    } else if (itemType === 'HALF_BROKEN_BONE') {
      if (this.state.brokenBonePlaced) return false;
      this.state.brokenBonePlaced = true;
      if (this.placedBrokenBoneMesh) this.placedBrokenBoneMesh.visible = true;
    } else if (itemType === 'SKULL_BONE') {
      if (this.state.skullBonePlaced) return false;
      this.state.skullBonePlaced = true;
      if (this.placedSkullBoneMesh) this.placedSkullBoneMesh.visible = true;
    }

    horrorAudio.playItemPlacement();

    // Check if ALL THREE ITEMS ARE PLACED
    const placedCount = this.getPlacedItemsCount();
    if (placedCount === 3 && !this.state.basementKeySpawned) {
      this.triggerKeyReveal();
    } else {
      if (this.onBanner) {
        this.onBanner('BASEMENT RITUAL', `ITEM PLACED • PROGRESS: ${placedCount}/3`);
      }
    }

    this.notifyState();
    return true;
  }

  /**
   * Returns count of placed items (0 to 3)
   */
  public getPlacedItemsCount(): number {
    let count = 0;
    if (this.state.pujaJugPlaced) count++;
    if (this.state.brokenBonePlaced) count++;
    if (this.state.skullBonePlaced) count++;
    return count;
  }

  /**
   * Spawns the star key only after all three items are placed
   */
  private triggerKeyReveal(): void {
    if (this.state.basementKeySpawned) return;
    this.state.basementKeySpawned = true;

    // 1. Ominous mechanical and stone unlock sound
    horrorAudio.playSecretDoorUnlock();

    // 2. Make key visibly rest on the pedestal
    if (this.keyMesh) {
      this.keyMesh.visible = true;
    }

    // 3. Register Key Pickup interaction
    this.interactionManager.register({
      id: 'BASEMENT_STAR_KEY_PICKUP',
      name: 'Star Key',
      type: 'BASEMENT_KEY_PICKUP',
      position: new THREE.Vector3(this.stationPos.x, this.floorY + 1.05, this.stationPos.z + 0.28),
      radius: 2.6,
      priority: 110,
      promptText: '[E] PICK UP KEY',
      subText: 'Ritual Pedestal',
      isUnlocked: () => this.state.basementKeySpawned && !this.state.hasBasementRoomKey,
    });

    // 4. Banner notification
    if (this.onBanner) {
      this.onBanner('RITUAL COMPLETE', 'A KEY HAS BEEN REVEALED');
    }

    this.notifyState();
  }

  /**
   * Collects the revealed star key
   */
  public collectStarKey(): InventoryItem | null {
    if (!this.state.basementKeySpawned || this.state.hasBasementRoomKey) return null;
    this.state.hasBasementRoomKey = true;

    if (this.keyMesh) {
      this.keyMesh.visible = false;
    }
    this.interactionManager.unregister('BASEMENT_STAR_KEY_PICKUP');
    horrorAudio.playItemPickup();

    if (this.onBanner) {
      this.onBanner('KEY COLLECTED', 'STAR KEY OBTAINED — UNLOCK THE SEALED STAR DOOR');
    }

    this.notifyState();

    return {
      id: 'BASEMENT_STAR_KEY',
      name: 'Star Key',
      category: 'KEY',
      description: 'An ancient heavy brass key with an ornate 5-pointed star bow.',
      details: 'Formed through the completion of the underground ritual to open the sealed star-marked door.',
      iconType: 'star_key',
      quantity: 1,
      acquiredAt: 'Basement Ritual Pedestal',
    };
  }

  /**
   * Unlocks and begins opening the star-marked door
   */
  public unlockStarDoor(): boolean {
    if (this.state.starDoorUnlocked || this.state.starDoorOpened) return false;

    if (!this.state.hasBasementRoomKey) {
      // Locked rattle audio
      horrorAudio.playGateChainRattle(0.5);
      if (this.onBanner) {
        this.onBanner('LOCKED', 'FIND THE KEY');
      }
      return false;
    }

    // Has key: Unlock!
    this.state.starDoorUnlocked = true;
    this.state.starDoorOpening = true;

    // Clear door collision immediately
    this.starDoorCollider.min.set(0, 9999, 0);
    this.starDoorCollider.max.set(0, 9999, 0);

    // Play unlocking and heavy stone gate sounds
    horrorAudio.playGateUnlockAndOpen();

    if (this.onBanner) {
      this.onBanner('STAR DOOR UNLOCKED', 'THE SEAL IS BROKEN — ROOM REVEALED');
    }

    this.notifyState();
    return true;
  }

  public syncKeyFromInventory(items: InventoryItem[]): void {
    if (items.some((i) => i.id === 'BASEMENT_STAR_KEY')) {
      this.state.hasBasementRoomKey = true;
    }
  }

  private notifyState(): void {
    if (this.onStateChange) {
      this.onStateChange({ ...this.state });
    }
  }

  // =========================================================================
  // 7. PER-FRAME UPDATE LOOP
  // =========================================================================

  public update(delta: number): void {
    // Animate star door swinging slowly open into Room 5
    if (this.state.starDoorOpening && this.starDoorHinge) {
      this.starDoorOpenProgress = Math.min(1.0, this.starDoorOpenProgress + delta * 0.42); // Smooth ~2.4s swing

      // Clear collision so player is never blocked while walking
      this.starDoorCollider.min.set(0, 9999, 0);
      this.starDoorCollider.max.set(0, 9999, 0);

      const smoothP = THREE.MathUtils.smoothstep(this.starDoorOpenProgress, 0, 1);
      // Swings 90 degrees inward into Room 5 (+Z direction)
      this.starDoorHinge.rotation.y = Math.PI * 0.50 * smoothP;

      if (this.starDoorOpenProgress >= 1.0) {
        this.state.starDoorOpening = false;
        this.state.starDoorOpened = true;
        this.notifyState();
      }
    } else if (this.state.starDoorOpened && this.starDoorHinge) {
      this.starDoorHinge.rotation.y = Math.PI * 0.50;
      this.starDoorCollider.min.set(0, 9999, 0);
      this.starDoorCollider.max.set(0, 9999, 0);
    }
  }

  public dispose(): void {
    this.group.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        if (obj.geometry) obj.geometry.dispose();
      }
    });
  }
}
