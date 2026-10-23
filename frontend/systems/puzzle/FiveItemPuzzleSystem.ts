import * as THREE from 'three';
import { FiveItemPuzzleState, InventoryItem, PuzzleItemType } from '../../../shared/types';
import { PuzzleItemsFactory } from '../../game/world/PuzzleItemsFactory';
import { horrorAudio } from '../../game/audio/HorrorAudioManager';

export interface PuzzleItemLocationDef {
  type: PuzzleItemType;
  id: string;
  name: string;
  roomName: string;
  position: THREE.Vector3;
  rotation: THREE.Euler;
  tablePosition: THREE.Vector3;
  tableRotation: THREE.Euler;
  description: string;
  details: string;
  iconType: InventoryItem['iconType'];
}

export const PUZZLE_ITEMS_CONFIG: PuzzleItemLocationDef[] = [
  {
    type: 'DIARY',
    id: 'PUZZLE_ITEM_DIARY',
    name: 'Diary',
    roomName: 'Master Bedroom',
    position: new THREE.Vector3(11.95, 6.225, -67.5),
    rotation: new THREE.Euler(0, 0.20, 0),
    tablePosition: new THREE.Vector3(2.50, 2.302, -65.65),
    tableRotation: new THREE.Euler(0, -Math.PI / 2 + 0.1, 0),
    description: 'An old diary with yellowed pages found in the master bedroom.',
    details: 'Old diary.',
    iconType: 'diary',
  },
  {
    type: 'WATCH',
    id: 'PUZZLE_ITEM_WATCH',
    name: 'Watch',
    roomName: 'Master Bedroom',
    position: new THREE.Vector3(-12.08, 6.13, -66.85),
    rotation: new THREE.Euler(0, 0.45, 0),
    tablePosition: new THREE.Vector3(2.50, 2.302, -65.95),
    tableRotation: new THREE.Euler(0, -Math.PI / 2, 0),
    description: 'A vintage wristwatch stopped at 3:17.',
    details: 'Stopped watch.',
    iconType: 'watch',
  },
  {
    type: 'PINK_FLOWER',
    id: 'PUZZLE_ITEM_PINK_FLOWER',
    name: 'Pink Flower',
    roomName: 'Living Room',
    position: new THREE.Vector3(-8.70, 1.90, -63.50),
    rotation: new THREE.Euler(0, 0.60, 0),
    tablePosition: new THREE.Vector3(2.50, 2.302, -66.25),
    tableRotation: new THREE.Euler(0, -Math.PI / 2, 0),
    description: 'A delicate pink rose blossom.',
    details: 'Preserved rose.',
    iconType: 'flower',
  },
  {
    type: 'BAG',
    id: 'PUZZLE_ITEM_BAG',
    name: 'Bag',
    roomName: 'Storage Room',
    position: new THREE.Vector3(-5.40, 2.27, -73.20),
    rotation: new THREE.Euler(0, 0.35, 0),
    tablePosition: new THREE.Vector3(2.50, 2.302, -66.55),
    tableRotation: new THREE.Euler(0, -Math.PI / 2, 0),
    description: 'A weathered personal leather bag.',
    details: 'Old leather bag.',
    iconType: 'bag',
  },
  {
    type: 'SPECTACLES',
    id: 'PUZZLE_ITEM_SPECTACLES',
    name: 'Spectacles',
    roomName: 'Dining Room',
    position: new THREE.Vector3(6.80, 2.305, -63.50),
    rotation: new THREE.Euler(0, -0.40, 0),
    tablePosition: new THREE.Vector3(2.50, 2.302, -66.85),
    tableRotation: new THREE.Euler(0, -Math.PI / 2, 0),
    description: 'A pair of round brass spectacles.',
    details: 'Wire spectacles.',
    iconType: 'spectacles',
  },
];

export class FiveItemPuzzleSystem {
  public scene: THREE.Scene;
  public state: FiveItemPuzzleState;

  // Central Puzzle Area 3D Elements
  public puzzleGroup: THREE.Group;
  public puzzleTableMesh: THREE.Mesh | null = null;
  public blackboardMesh: THREE.Mesh | null = null;
  public blackboardCanvas: HTMLCanvasElement;
  public blackboardTexture: THREE.CanvasTexture;
  public tableCollider: THREE.Box3;

  // Secret Door & Chamber
  public secretDoorGroup: THREE.Group;
  public secretDoorHinge: THREE.Group | null = null;
  public secretDoorPanel: THREE.Mesh | null = null;
  public secretDoorCollider: THREE.Box3;
  public chamberColliders: THREE.Box3[] = [];
  public isSecretDoorOpening = false;

  // Secret Passage 3 Steps & Floor Trap
  public trapdoorHinge: THREE.Group | null = null;
  public trapdoorMesh: THREE.Mesh | null = null;
  public isTrapdoorTriggered = false;
  public trapdoorProgress = 0;

  // Currently Active World Item
  public currentActiveItemMesh: THREE.Group | null = null;

  // Placed Item Meshes on the Table
  public placedTableMeshes: Map<PuzzleItemType, THREE.Group> = new Map();

  // Callbacks
  public onStateChange?: (state: FiveItemPuzzleState) => void;
  public onObjectiveBanner?: (title: string, subtitle: string) => void;

  // Dedicated Interaction Manager reference
  public interactionManager: any = null;

  // Bungalow Interior reference for shared world objects
  public bungalowInterior: any = null;

  public setInteractionManager(im: any): void {
    this.interactionManager = im;
    this.registerCurrentObjectiveItem();
  }

  public setBungalowInterior(interior: any): void {
    this.bungalowInterior = interior;
    this.cleanupOrphanDiaryMeshes();
    if (!this.currentActiveItemMesh && this.state.currentObjectiveItem) {
      this.spawnCurrentObjectiveItem();
    }
  }

  /**
   * Thoroughly cleans up any duplicate or orphaned meshes matching objective items.
   */
  public cleanupOrphanDiaryMeshes(): void {
    const strayMeshes: THREE.Object3D[] = [];
    this.scene.traverse((obj) => {
      if (
        obj.name === 'OLD_NOTEBOOK_DIARY_MESH' ||
        (this.state.collectedItems.includes('DIARY') && obj.name === 'PuzzleItem_DIARY')
      ) {
        strayMeshes.push(obj);
      }
    });

    if (this.bungalowInterior?.group) {
      this.bungalowInterior.group.traverse((obj: THREE.Object3D) => {
        if (
          obj.name === 'OLD_NOTEBOOK_DIARY_MESH' ||
          (this.state.collectedItems.includes('DIARY') && obj.name === 'PuzzleItem_DIARY')
        ) {
          strayMeshes.push(obj);
        }
      });
    }

    for (const stray of strayMeshes) {
      stray.visible = false;
      if (stray.parent) stray.parent.remove(stray);
      this.scene.remove(stray);
      stray.traverse((c) => {
        c.visible = false;
        if (c instanceof THREE.Light) c.intensity = 0;
        if ((c as THREE.Mesh).geometry) (c as THREE.Mesh).geometry.dispose();
      });
    }
  }

  constructor(scene: THREE.Scene, bungalowInterior?: any, interactionManager?: any) {
    this.scene = scene;
    this.bungalowInterior = bungalowInterior || null;
    this.interactionManager = interactionManager || null;

    this.puzzleGroup = new THREE.Group();
    this.puzzleGroup.name = 'FiveItemPuzzleGroup';
    this.secretDoorGroup = new THREE.Group();
    this.secretDoorGroup.name = 'SecretDoorGroup';

    this.tableCollider = new THREE.Box3();
    this.secretDoorCollider = new THREE.Box3();

    // Initial Puzzle State
    this.state = {
      currentObjectiveItem: 'DIARY',
      collectedItems: [],
      placedItems: [],
      carriedItems: [],
      secretDoorUnlocked: false,
      secretDoorOpenProgress: 0,
      secretDoorOpened: false,
    };

    // Prepare dynamic blackboard canvas
    this.blackboardCanvas = document.createElement('canvas');
    this.blackboardCanvas.width = 1024;
    this.blackboardCanvas.height = 640;
    this.blackboardTexture = new THREE.CanvasTexture(this.blackboardCanvas);
    this.blackboardTexture.colorSpace = THREE.SRGBColorSpace;
    this.blackboardTexture.anisotropy = 8;

    // Build 3D Central Area & Secret Door
    this.buildCentralPuzzleArea();
    this.buildSecretPassage();

    // Spawn Initial Item (DIARY only) if bungalowInterior is already provided
    if (this.bungalowInterior) {
      this.spawnCurrentObjectiveItem();
    }

    // Render Initial Blackboard Text
    this.updateBlackboardTexture();

    this.scene.add(this.puzzleGroup);
    this.scene.add(this.secretDoorGroup);
  }

  /**
   * Builds the Table and Blackboard in the central hallway area before the grand staircase.
   * Placed at x: 2.50, z: -66.25 (against the right hallway wall segment).
   */
  private buildCentralPuzzleArea(): void {
    const floorY = 1.45;
    const tableX = 2.50;
    const tableZ = -66.25;
    const tableTopY = floorY + 0.85; // 2.30

    // 1. Colonial Dark Teak Puzzle Table
    const tableGeo = new THREE.BoxGeometry(0.70, 0.85, 1.70);
    const tableMat = new THREE.MeshStandardMaterial({
      color: 0x2e1d13, // Aged dark teak
      roughness: 0.65,
      metalness: 0.15,
    });
    this.puzzleTableMesh = new THREE.Mesh(tableGeo, tableMat);
    this.puzzleTableMesh.position.set(tableX, floorY + 0.425, tableZ);
    this.puzzleTableMesh.castShadow = true;
    this.puzzleTableMesh.receiveShadow = true;
    this.puzzleGroup.add(this.puzzleTableMesh);

    // Table runner cloth
    const runnerGeo = new THREE.BoxGeometry(0.60, 0.005, 1.60);
    const runnerMat = new THREE.MeshStandardMaterial({
      color: 0x4a1215, // Muted dark maroon cloth runner
      roughness: 0.85,
      metalness: 0.05,
    });
    const runner = new THREE.Mesh(runnerGeo, runnerMat);
    runner.position.set(tableX, tableTopY + 0.003, tableZ);
    this.puzzleGroup.add(runner);

    // Box collider for table
    this.tableCollider.setFromCenterAndSize(
      new THREE.Vector3(tableX, floorY + 0.425, tableZ),
      new THREE.Vector3(0.75, 0.90, 1.75)
    );

    // 2. Vintage Framed Blackboard mounted on the wall above the table
    // Wall surface is at x = 2.88, facing -X into hallway
    const boardW = 1.85;
    const boardH = 1.15;
    const boardD = 0.06;
    const boardY = floorY + 1.45; // 2.90m center height

    // Mahogany Outer Frame
    const frameMat = new THREE.MeshStandardMaterial({
      color: 0x28190e,
      roughness: 0.70,
      metalness: 0.12,
    });
    const frameMesh = new THREE.Mesh(
      new THREE.BoxGeometry(boardD, boardH, boardW),
      frameMat
    );
    frameMesh.position.set(2.88, boardY, tableZ);
    frameMesh.castShadow = true;
    this.puzzleGroup.add(frameMesh);

    // Chalkboard Face Plane
    const chalkFaceGeo = new THREE.PlaneGeometry(boardW - 0.08, boardH - 0.08);
    const chalkFaceMat = new THREE.MeshStandardMaterial({
      map: this.blackboardTexture,
      roughness: 0.85,
      metalness: 0.05,
    });
    this.blackboardMesh = new THREE.Mesh(chalkFaceGeo, chalkFaceMat);
    this.blackboardMesh.rotation.y = -Math.PI / 2; // Faces hallway (-X)
    this.blackboardMesh.position.set(2.845, boardY, tableZ);
    this.puzzleGroup.add(this.blackboardMesh);

    // Chalk tray at bottom of blackboard
    const trayGeo = new THREE.BoxGeometry(0.08, 0.025, boardW);
    const tray = new THREE.Mesh(trayGeo, frameMat);
    tray.position.set(2.86, boardY - boardH / 2 - 0.012, tableZ);
    this.puzzleGroup.add(tray);

    // Pieces of broken chalk on tray
    const chalkMat = new THREE.MeshStandardMaterial({ color: 0xedebe4, roughness: 0.9 });
    for (let c = 0; c < 3; c++) {
      const chalk = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.04, 8), chalkMat);
      chalk.rotation.z = Math.PI / 2;
      chalk.position.set(2.84, boardY - boardH / 2 + 0.008, tableZ - 0.3 + c * 0.25);
      this.puzzleGroup.add(chalk);
    }

    // Atmospheric warm wall lamp illuminating the blackboard and table
    const puzzleLamp = new THREE.PointLight(0xe89e52, 0.95, 8.5, 1.8);
    puzzleLamp.position.set(2.40, boardY + 0.75, tableZ);
    puzzleLamp.castShadow = true;
    puzzleLamp.shadow.mapSize.set(512, 512);
    this.puzzleGroup.add(puzzleLamp);
  }

  /**
   * Builds the Concealed Secret Door with dedicated Hinge Pivot and authentic 3D Hidden Passage
   * EXACTLY beneath the grand staircase, in the wall between Storage Room and Bathroom.
   */
  private buildSecretPassage(): void {
    const floorY = 1.45;
    const doorX = 0.0;
    const doorZ = -78.48;
    const doorW = 1.45;
    const doorH = 2.45;
    const doorThickness = 0.10;

    // Materials for the Concealed Secret Door
    const doorMat = new THREE.MeshStandardMaterial({
      color: 0x1c1210, // Dark maroon-black aged teak wood
      roughness: 0.86,
      metalness: 0.08,
    });
    const trimMat = new THREE.MeshStandardMaterial({
      color: 0x120a08, // Subtle darker stained border
      roughness: 0.90,
      metalness: 0.04,
    });
    const ironHingeMat = new THREE.MeshStandardMaterial({
      color: 0x181818, // Weathered blackened wrought iron
      roughness: 0.55,
      metalness: 0.90,
    });

    // 1. DEDICATED HINGE PIVOT GROUP:
    // Pinned at the left doorjamb (x = doorX - doorW / 2 = -0.725, z = doorZ)
    // When this group rotates around Y, the door panel swings cleanly inward into the passage
    this.secretDoorHinge = new THREE.Group();
    this.secretDoorHinge.name = 'SecretDoorHingePivot';
    this.secretDoorHinge.position.set(doorX - doorW / 2, floorY + doorH / 2, doorZ);

    // Door Panel Container (centered at local x = +doorW / 2 relative to the hinge pivot)
    const doorPanelGroup = new THREE.Group();
    doorPanelGroup.name = 'ConcealedSecretDoorPanel';
    doorPanelGroup.position.set(doorW / 2, 0, 0);

    // Main door slab
    const doorSlab = new THREE.Mesh(
      new THREE.BoxGeometry(doorW - 0.02, doorH - 0.02, doorThickness),
      doorMat
    );
    doorSlab.castShadow = true;
    doorSlab.receiveShadow = true;
    doorPanelGroup.add(doorSlab);
    this.secretDoorPanel = doorSlab;

    // Wainscoting stiles (vertical border panels)
    const stileGeo = new THREE.BoxGeometry(0.12, doorH - 0.02, 0.02);
    const stileL = new THREE.Mesh(stileGeo, trimMat);
    stileL.position.set(-doorW / 2 + 0.07, 0, doorThickness / 2 + 0.01);
    doorPanelGroup.add(stileL);

    const stileR = new THREE.Mesh(stileGeo, trimMat);
    stileR.position.set(doorW / 2 - 0.07, 0, doorThickness / 2 + 0.01);
    doorPanelGroup.add(stileR);

    // Wainscoting rails (horizontal border panels)
    const railGeo = new THREE.BoxGeometry(doorW - 0.28, 0.12, 0.02);
    const railTop = new THREE.Mesh(railGeo, trimMat);
    railTop.position.set(0, doorH / 2 - 0.12, doorThickness / 2 + 0.01);
    doorPanelGroup.add(railTop);

    const railMid = new THREE.Mesh(railGeo, trimMat);
    railMid.position.set(0, -0.05, doorThickness / 2 + 0.01);
    doorPanelGroup.add(railMid);

    const railBot = new THREE.Mesh(railGeo, trimMat);
    railBot.position.set(0, -doorH / 2 + 0.14, doorThickness / 2 + 0.01);
    doorPanelGroup.add(railBot);

    // Realistic heavy blackened iron strap hinges mounted on the left side
    const strapGeo = new THREE.BoxGeometry(0.32, 0.065, 0.025);
    const strapUpper = new THREE.Mesh(strapGeo, ironHingeMat);
    strapUpper.position.set(-doorW / 2 + 0.16, 0.65, doorThickness / 2 + 0.015);
    doorPanelGroup.add(strapUpper);

    const strapLower = new THREE.Mesh(strapGeo, ironHingeMat);
    strapLower.position.set(-doorW / 2 + 0.16, -0.65, doorThickness / 2 + 0.015);
    doorPanelGroup.add(strapLower);

    // Cylindrical hinge pins right along the hinge axis (local x = -doorW / 2 in panel group = 0 in hinge group)
    const pinGeo = new THREE.CylinderGeometry(0.022, 0.022, 0.11, 10);
    const pinUpper = new THREE.Mesh(pinGeo, ironHingeMat);
    pinUpper.position.set(-doorW / 2 + 0.015, 0.65, doorThickness / 2 + 0.015);
    doorPanelGroup.add(pinUpper);

    const pinLower = new THREE.Mesh(pinGeo, ironHingeMat);
    pinLower.position.set(-doorW / 2 + 0.015, -0.65, doorThickness / 2 + 0.015);
    doorPanelGroup.add(pinLower);

    // Vintage cast-iron door handle and backplate on right side
    const handlePlate = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.22, 0.015), ironHingeMat);
    handlePlate.position.set(doorW / 2 - 0.11, -0.05, doorThickness / 2 + 0.015);
    doorPanelGroup.add(handlePlate);

    const handleRing = new THREE.Mesh(new THREE.TorusGeometry(0.035, 0.010, 8, 16), ironHingeMat);
    handleRing.position.set(doorW / 2 - 0.11, -0.07, doorThickness / 2 + 0.035);
    doorPanelGroup.add(handleRing);

    // Attach panel to hinge, and hinge to secretDoorGroup
    this.secretDoorHinge.add(doorPanelGroup);
    this.secretDoorGroup.add(this.secretDoorHinge);

    // Doorway casing trim framing the opening in the bungalow wall
    const casingMat = new THREE.MeshStandardMaterial({
      color: 0x180f0c,
      roughness: 0.88,
      metalness: 0.06,
    });
    const jambGeo = new THREE.BoxGeometry(0.09, doorH + 0.10, 0.09);
    const jambL = new THREE.Mesh(jambGeo, casingMat);
    jambL.position.set(doorX - doorW / 2 - 0.045, floorY + doorH / 2, doorZ + 0.02);
    this.secretDoorGroup.add(jambL);

    const jambR = new THREE.Mesh(jambGeo, casingMat);
    jambR.position.set(doorX + doorW / 2 + 0.045, floorY + doorH / 2, doorZ + 0.02);
    this.secretDoorGroup.add(jambR);

    const lintelCasing = new THREE.Mesh(new THREE.BoxGeometry(doorW + 0.26, 0.09, 0.09), casingMat);
    lintelCasing.position.set(doorX, floorY + doorH + 0.045, doorZ + 0.02);
    this.secretDoorGroup.add(lintelCasing);

    // Stone threshold on floor
    const threshold = new THREE.Mesh(
      new THREE.BoxGeometry(doorW + 0.08, 0.04, 0.22),
      new THREE.MeshStandardMaterial({ color: 0x221e1c, roughness: 0.92 })
    );
    threshold.position.set(doorX, floorY + 0.02, doorZ);
    this.secretDoorGroup.add(threshold);

    // Secret door collider blocks walking through wall before unlocked
    this.secretDoorCollider.setFromCenterAndSize(
      new THREE.Vector3(doorX, floorY + doorH / 2, doorZ),
      new THREE.Vector3(doorW, doorH, 0.28)
    );

    // 2. REAL SUBTERRANEAN SECRET PASSAGE (z in [-78.48, -87.0])
    // The passage connects continuously to the house interior with believable depth and architecture
    const passageLen = 8.5;
    const passageW = 1.85; // Clean 1.85m corridor, allows full perspective and comfortable walking
    const passageH = 2.65; // Clear 2.65m headroom
    const passageFloorY = floorY; // 1.45: perfectly continuous with ground floor
    const passageCeilY = floorY + passageH; // 4.10
    const passageCenterZ = doorZ - passageLen / 2; // -82.73

    // Authentic damp colonial stone materials
    const cellarStoneMat = new THREE.MeshStandardMaterial({
      color: 0x26211e, // Weathered damp stone masonry
      roughness: 0.88,
      metalness: 0.08,
    });
    const cellarFloorMat = new THREE.MeshStandardMaterial({
      color: 0x1c1816, // Dark flagstone cellar floor with subtle damp sheen
      roughness: 0.72,
      metalness: 0.12,
    });
    const timberBeamMat = new THREE.MeshStandardMaterial({
      color: 0x160e0a, // Heavy blackened colonial timber rafters
      roughness: 0.92,
      metalness: 0.04,
    });

    // (A) Three Visible Stone Steps and Concealed Floor Trapdoor
    // 1. Upper entrance landing flush with bungalow ground floor (y = 1.45)
    const entFloor = new THREE.Mesh(new THREE.BoxGeometry(passageW, 0.16, 1.12), cellarFloorMat);
    entFloor.position.set(0, 1.45 - 0.08, doorZ - 0.56);
    entFloor.receiveShadow = true;
    this.secretDoorGroup.add(entFloor);

    // 2. Exactly THREE visible stone steps descending into the passage
    // Step 1: z in [-79.60, -80.10], top at y = 1.23
    const step1 = new THREE.Mesh(new THREE.BoxGeometry(passageW, 0.22, 0.50), cellarFloorMat);
    step1.position.set(0, 1.23 - 0.11, -79.85);
    step1.receiveShadow = true;
    this.secretDoorGroup.add(step1);

    // Step 2: z in [-80.10, -80.60], top at y = 1.01
    const step2 = new THREE.Mesh(new THREE.BoxGeometry(passageW, 0.22, 0.50), cellarFloorMat);
    step2.position.set(0, 1.01 - 0.11, -80.35);
    step2.receiveShadow = true;
    this.secretDoorGroup.add(step2);

    // Step 3: z in [-80.60, -81.10], top at y = 0.79
    const step3 = new THREE.Mesh(new THREE.BoxGeometry(passageW, 0.22, 0.50), cellarFloorMat);
    step3.position.set(0, 0.79 - 0.11, -80.85);
    step3.receiveShadow = true;
    this.secretDoorGroup.add(step3);

    // Step lip trims for crisp visual definition
    const nosingGeo = new THREE.BoxGeometry(passageW, 0.04, 0.04);
    const nosing1 = new THREE.Mesh(nosingGeo, timberBeamMat);
    nosing1.position.set(0, 1.23 - 0.02, -79.60);
    this.secretDoorGroup.add(nosing1);

    const nosing2 = new THREE.Mesh(nosingGeo, timberBeamMat);
    nosing2.position.set(0, 1.01 - 0.02, -80.10);
    this.secretDoorGroup.add(nosing2);

    const nosing3 = new THREE.Mesh(nosingGeo, timberBeamMat);
    nosing3.position.set(0, 0.79 - 0.02, -80.60);
    this.secretDoorGroup.add(nosing3);

    // 3. Pre-trapdoor stone threshold (z in [-81.10, -81.40])
    const preTrapFloor = new THREE.Mesh(new THREE.BoxGeometry(passageW, 0.16, 0.30), cellarFloorMat);
    preTrapFloor.position.set(0, 0.79 - 0.08, -81.25);
    preTrapFloor.receiveShadow = true;
    this.secretDoorGroup.add(preTrapFloor);

    // 4. CONCEALED STONE TRAPDOOR SLAB (Hinged at z = -81.40, top flush at y = 0.79)
    this.trapdoorHinge = new THREE.Group();
    this.trapdoorHinge.name = 'SecretFloorTrapdoorHinge';
    this.trapdoorHinge.position.set(0, 0.79, -81.40);

    const trapSlabGeo = new THREE.BoxGeometry(1.42, 0.10, 1.60);
    const trapSlab = new THREE.Mesh(trapSlabGeo, cellarFloorMat);
    trapSlab.position.set(0, -0.05, -0.80);
    trapSlab.receiveShadow = true;
    trapSlab.castShadow = true;
    this.trapdoorHinge.add(trapSlab);

    // Weathered iron strap reinforcements on trapdoor
    const trapStrapGeo = new THREE.BoxGeometry(1.38, 0.02, 0.08);
    const strap1 = new THREE.Mesh(trapStrapGeo, ironHingeMat);
    strap1.position.set(0, 0.01, -0.35);
    this.trapdoorHinge.add(strap1);

    const strap2 = new THREE.Mesh(trapStrapGeo, ironHingeMat);
    strap2.position.set(0, 0.01, -1.25);
    this.trapdoorHinge.add(strap2);

    this.secretDoorGroup.add(this.trapdoorHinge);
    this.trapdoorMesh = trapSlab;

    // Flanking stone margins on left and right of trapdoor opening
    const borderGeo = new THREE.BoxGeometry(0.20, 0.16, 1.60);
    const borderL = new THREE.Mesh(borderGeo, cellarFloorMat);
    borderL.position.set(-passageW / 2 + 0.10, 0.79 - 0.08, -82.20);
    this.secretDoorGroup.add(borderL);

    const borderR = new THREE.Mesh(borderGeo, cellarFloorMat);
    borderR.position.set(passageW / 2 - 0.10, 0.79 - 0.08, -82.20);
    this.secretDoorGroup.add(borderR);

    // 5. Vertical Masonry Chute Shaft beneath trapdoor down to basement ceiling (y = -4.0)
    const shaftH = 0.79 - (-4.0); // 4.79m
    const shaftMidY = (-4.0 + 0.79) / 2; // -1.60m
    const shaftWallGeoZ = new THREE.BoxGeometry(0.18, shaftH, 1.60);
    const shaftWallGeoX = new THREE.BoxGeometry(1.42, shaftH, 0.18);

    const shaftWest = new THREE.Mesh(shaftWallGeoZ, cellarStoneMat);
    shaftWest.position.set(-1.42 / 2 - 0.09, shaftMidY, -82.20);
    this.secretDoorGroup.add(shaftWest);

    const shaftEast = new THREE.Mesh(shaftWallGeoZ, cellarStoneMat);
    shaftEast.position.set(1.42 / 2 + 0.09, shaftMidY, -82.20);
    this.secretDoorGroup.add(shaftEast);

    const shaftNorth = new THREE.Mesh(shaftWallGeoX, cellarStoneMat);
    shaftNorth.position.set(0, shaftMidY, -83.0 - 0.09);
    this.secretDoorGroup.add(shaftNorth);

    const shaftSouth = new THREE.Mesh(shaftWallGeoX, cellarStoneMat);
    shaftSouth.position.set(0, shaftMidY, -81.4 + 0.09);
    this.secretDoorGroup.add(shaftSouth);

    // 6. Rear corridor floor extending past the trapdoor to the occult altar (z in [-83.0, -86.98])
    const backFloorLen = passageLen - (83.0 - 78.48); // ~3.98m
    const chFloorBack = new THREE.Mesh(new THREE.BoxGeometry(passageW, 0.16, backFloorLen), cellarFloorMat);
    chFloorBack.position.set(0, 0.79 - 0.08, -83.0 - backFloorLen / 2);
    chFloorBack.receiveShadow = true;
    this.secretDoorGroup.add(chFloorBack);

    // (B) Passage Ceiling with heavy timber rafters
    const chCeil = new THREE.Mesh(new THREE.BoxGeometry(passageW, 0.16, passageLen), timberBeamMat);
    chCeil.position.set(0, passageCeilY + 0.08, passageCenterZ);
    this.secretDoorGroup.add(chCeil);

    // (C) Left Corridor Wall (West: x = -passageW / 2 = -0.925)
    const chWest = new THREE.Mesh(new THREE.BoxGeometry(0.20, passageH, passageLen), cellarStoneMat);
    chWest.position.set(-passageW / 2 - 0.10, passageFloorY + passageH / 2, passageCenterZ);
    chWest.receiveShadow = true;
    this.secretDoorGroup.add(chWest);

    // (D) Right Corridor Wall (East: x = passageW / 2 = 0.925)
    const chEast = new THREE.Mesh(new THREE.BoxGeometry(0.20, passageH, passageLen), cellarStoneMat);
    chEast.position.set(passageW / 2 + 0.10, passageFloorY + passageH / 2, passageCenterZ);
    chEast.receiveShadow = true;
    this.secretDoorGroup.add(chEast);

    // (E) Front Return Flanks connecting the 1.45m doorframe to the 1.85m corridor at z = doorZ
    const returnFlankW = (passageW - doorW) / 2; // 0.20m
    const chSouthL = new THREE.Mesh(new THREE.BoxGeometry(returnFlankW, passageH, 0.16), cellarStoneMat);
    chSouthL.position.set(-doorW / 2 - returnFlankW / 2, passageFloorY + passageH / 2, doorZ - 0.08);
    this.secretDoorGroup.add(chSouthL);

    const chSouthR = new THREE.Mesh(new THREE.BoxGeometry(returnFlankW, passageH, 0.16), cellarStoneMat);
    chSouthR.position.set(doorW / 2 + returnFlankW / 2, passageFloorY + passageH / 2, doorZ - 0.08);
    this.secretDoorGroup.add(chSouthR);

    // (F) North Far End Crypt Wall (z = doorZ - passageLen = -86.98)
    const chNorth = new THREE.Mesh(new THREE.BoxGeometry(passageW + 0.40, passageH, 0.25), cellarStoneMat);
    chNorth.position.set(0, passageFloorY + passageH / 2, doorZ - passageLen - 0.125);
    this.secretDoorGroup.add(chNorth);

    // (G) Heavy Architectural Timber Arch Ribs along the passage for realistic perspective & depth
    const ribZPositions = [doorZ - 2.0, doorZ - 4.5, doorZ - 7.0];
    const postGeo = new THREE.BoxGeometry(0.12, passageH, 0.12);
    const beamGeo = new THREE.BoxGeometry(passageW, 0.16, 0.16);
    const braceGeo = new THREE.BoxGeometry(0.08, 0.35, 0.08);

    for (const rz of ribZPositions) {
      // Left vertical post
      const postL = new THREE.Mesh(postGeo, timberBeamMat);
      postL.position.set(-passageW / 2 + 0.06, passageFloorY + passageH / 2, rz);
      this.secretDoorGroup.add(postL);

      // Right vertical post
      const postR = new THREE.Mesh(postGeo, timberBeamMat);
      postR.position.set(passageW / 2 - 0.06, passageFloorY + passageH / 2, rz);
      this.secretDoorGroup.add(postR);

      // Overhead crossbeam
      const beam = new THREE.Mesh(beamGeo, timberBeamMat);
      beam.position.set(0, passageCeilY - 0.08, rz);
      this.secretDoorGroup.add(beam);

      // Left corner diagonal brace
      const braceL = new THREE.Mesh(braceGeo, timberBeamMat);
      braceL.rotation.z = Math.PI / 4;
      braceL.position.set(-passageW / 2 + 0.18, passageCeilY - 0.18, rz);
      this.secretDoorGroup.add(braceL);

      // Right corner diagonal brace
      const braceR = new THREE.Mesh(braceGeo, timberBeamMat);
      braceR.rotation.z = -Math.PI / 4;
      braceR.position.set(passageW / 2 - 0.18, passageCeilY - 0.18, rz);
      this.secretDoorGroup.add(braceR);
    }

    // (H) Hanging Rusted Iron Chains with Shackles
    const chainMat = new THREE.MeshStandardMaterial({ color: 0x221a16, roughness: 0.8, metalness: 0.85 });
    const chainL = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.85, 6), chainMat);
    chainL.position.set(-passageW / 2 + 0.14, passageCeilY - 0.45, doorZ - 5.5);
    this.secretDoorGroup.add(chainL);

    const shackleL = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.012, 8, 12), chainMat);
    shackleL.position.set(-passageW / 2 + 0.14, passageCeilY - 0.88, doorZ - 5.5);
    this.secretDoorGroup.add(shackleL);

    // (I) Mid-passage Warm Flickering Iron Torch Wall Sconce (casts warm amber light down hallway)
    const torchGroup = new THREE.Group();
    const torchBracket = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.26, 0.16), ironHingeMat);
    torchBracket.position.set(passageW / 2 - 0.08, passageFloorY + 1.65, doorZ - 3.2);
    torchGroup.add(torchBracket);

    const torchSconce = new THREE.PointLight(0xe07424, 1.25, 7.5, 1.8);
    torchSconce.position.set(passageW / 2 - 0.18, passageFloorY + 1.80, doorZ - 3.2);
    (torchSconce as any).userData = { baseIntensity: 1.25 };
    torchGroup.add(torchSconce);
    this.secretDoorGroup.add(torchGroup);

    // (J) Occult Subterranean Altar at the far end of the passage (z = -85.8)
    const altarZ = doorZ - passageLen + 1.2; // -85.78
    const altarDais = new THREE.Mesh(
      new THREE.BoxGeometry(1.20, 0.22, 1.10),
      cellarStoneMat
    );
    altarDais.position.set(0, passageFloorY + 0.11, altarZ);
    this.secretDoorGroup.add(altarDais);

    const altarBlock = new THREE.Mesh(
      new THREE.BoxGeometry(0.92, 0.75, 0.75),
      cellarStoneMat
    );
    altarBlock.position.set(0, passageFloorY + 0.22 + 0.375, altarZ);
    altarBlock.castShadow = true;
    altarBlock.receiveShadow = true;
    this.secretDoorGroup.add(altarBlock);

    // Ancient Occult Grimoire on the altar
    const bookCover = new THREE.Mesh(
      new THREE.BoxGeometry(0.26, 0.045, 0.34),
      new THREE.MeshStandardMaterial({ color: 0x420d12, roughness: 0.75 })
    );
    bookCover.position.set(-0.14, passageFloorY + 0.985, altarZ);
    bookCover.rotation.y = 0.22;
    this.secretDoorGroup.add(bookCover);

    // Devil Candelabra with blood-red candle flames
    const candelabraBase = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.09, 0.28, 8),
      ironHingeMat
    );
    candelabraBase.position.set(0.18, passageFloorY + 0.97 + 0.14, altarZ);
    this.secretDoorGroup.add(candelabraBase);

    const candle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.025, 0.03, 0.22, 8),
      new THREE.MeshStandardMaterial({ color: 0x780f14, emissive: 0x860111, emissiveIntensity: 2.2, roughness: 0.55 })
    );
    candle.position.set(0.18, passageFloorY + 0.97 + 0.28 + 0.11, altarZ);
    this.secretDoorGroup.add(candle);

    // (K) Chamber Wall Colliders: solid boundaries strictly flanking corridor and back altar wall
    // leaves the 1.45m doorway opening COMPLETELY CLEAR for continuous walking
    this.chamberColliders = [
      // Left corridor wall
      new THREE.Box3(
        new THREE.Vector3(-passageW / 2 - 0.35, passageFloorY, doorZ - passageLen - 0.2),
        new THREE.Vector3(-passageW / 2, passageCeilY, doorZ + 0.1)
      ),
      // Right corridor wall
      new THREE.Box3(
        new THREE.Vector3(passageW / 2, passageFloorY, doorZ - passageLen - 0.2),
        new THREE.Vector3(passageW / 2 + 0.35, passageCeilY, doorZ + 0.1)
      ),
      // North back crypt wall
      new THREE.Box3(
        new THREE.Vector3(-passageW / 2, passageFloorY, doorZ - passageLen - 0.35),
        new THREE.Vector3(passageW / 2, passageCeilY, doorZ - passageLen)
      ),
      // Altar structure at far end
      new THREE.Box3(
        new THREE.Vector3(-0.62, passageFloorY, altarZ - 0.55),
        new THREE.Vector3(0.62, passageFloorY + 1.15, altarZ + 0.55)
      ),
      // Front left return flank (beside doorway)
      new THREE.Box3(
        new THREE.Vector3(-passageW / 2 - 0.15, passageFloorY, doorZ - 0.18),
        new THREE.Vector3(-doorW / 2, passageCeilY, doorZ + 0.05)
      ),
      // Front right return flank (beside doorway)
      new THREE.Box3(
        new THREE.Vector3(doorW / 2, passageFloorY, doorZ - 0.18),
        new THREE.Vector3(passageW / 2 + 0.15, passageCeilY, doorZ + 0.05)
      ),
    ];
  }

  /**
   * Spawns ONLY the current active objective item in its predetermined room.
   * Future items remain strictly hidden and unspawned.
   */
  /**
   * Registers the currently active objective item with the interaction system.
   */
  public registerCurrentObjectiveItem(): void {
    if (!this.interactionManager) return;

    // Remove any previous puzzle item from interaction system
    for (const item of PUZZLE_ITEMS_CONFIG) {
      this.interactionManager.unregister(item.id);
    }

    if (!this.state.currentObjectiveItem) return;

    const config = PUZZLE_ITEMS_CONFIG.find((c) => c.type === this.state.currentObjectiveItem);
    if (!config) return;

    this.interactionManager.register({
      id: config.id,
      name: config.name,
      type: 'PUZZLE_ITEM_PICKUP',
      position: config.position,
      mesh: this.currentActiveItemMesh,
      radius: 3.2,
      priority: 100, // Top priority: strictly overrides all examine clues
      promptText: `[E] PICK UP ${config.name.toUpperCase()}`,
      subText: `${config.roomName} • Relic`,
      isUnlocked: () => this.state.currentObjectiveItem === config.type,
      onInteract: () => {
        this.collectCurrentItem();
      },
    });
  }

  /**
   * Spawns ONLY the current active objective item in its predetermined room.
   * Future items remain strictly hidden and unspawned.
   */
  public spawnCurrentObjectiveItem(): void {
    // Clean up any previously spawned active world item thoroughly
    if (this.currentActiveItemMesh) {
      if (this.currentActiveItemMesh !== this.bungalowInterior?.upperBedroomDiaryMesh) {
        this.currentActiveItemMesh.visible = false;
        if (this.currentActiveItemMesh.parent) {
          this.currentActiveItemMesh.parent.remove(this.currentActiveItemMesh);
        }
        this.scene.remove(this.currentActiveItemMesh);
        this.currentActiveItemMesh.traverse((child) => {
          child.visible = false;
          if (child instanceof THREE.Light) child.intensity = 0;
          if ((child as THREE.Mesh).geometry) (child as THREE.Mesh).geometry.dispose();
        });
      }
      this.currentActiveItemMesh = null;
    }

    // If all items collected or no active objective, do not spawn anything
    if (!this.state.currentObjectiveItem) {
      this.registerCurrentObjectiveItem();
      return;
    }

    // Prevent spawning an item that has already been collected
    if (this.state.collectedItems.includes(this.state.currentObjectiveItem)) {
      this.registerCurrentObjectiveItem();
      return;
    }

    const config = PUZZLE_ITEMS_CONFIG.find((c) => c.type === this.state.currentObjectiveItem);
    if (!config) return;

    // Remove any pre-existing mesh of this item type
    this.cleanupOrphanDiaryMeshes();
    const preExisting = this.scene.getObjectByName(`PuzzleItem_${config.type}`);
    if (preExisting) {
      preExisting.visible = false;
      if (preExisting.parent) preExisting.parent.remove(preExisting);
      this.scene.remove(preExisting);
    }

    const mesh = PuzzleItemsFactory.createItemMesh(config.type);
    mesh.name = `PuzzleItem_${config.type}`;
    mesh.position.copy(config.position);
    mesh.rotation.copy(config.rotation);

    // Subtle breathing highlight glow so it's discoverable upon entering the room
    const subtleGlint = new THREE.PointLight(0xffeedd, 0.35, 2.5, 2.0);
    subtleGlint.name = 'PuzzleItemGlint';
    subtleGlint.position.set(0, 0.12, 0);
    mesh.add(subtleGlint);

    this.currentActiveItemMesh = mesh;
    this.scene.add(this.currentActiveItemMesh);

    // Automatically register newly spawned item with interaction system
    this.registerCurrentObjectiveItem();
  }

  /**
   * Collects the currently active item when player presses [E].
   * Completely removes the physical 3D object from the world,
   * adds it to inventory exactly once, updates objective progress,
   * and spawns the next sequential item.
   */
  public collectCurrentItem(): InventoryItem | null {
    if (!this.state.currentObjectiveItem) return null;

    const currentType = this.state.currentObjectiveItem;
    const config = PUZZLE_ITEMS_CONFIG.find((c) => c.type === currentType);
    if (!config) return null;

    // Strict guard against duplicate pickup events
    if (this.state.collectedItems.includes(currentType)) {
      return null;
    }

    // 1. Remove stale reference from interaction system immediately
    if (this.interactionManager) {
      this.interactionManager.unregister(config.id);
    }

    // 2. Remove physical 3D object from the world immediately and permanently
    // (a) If collecting DIARY, remove the Master Bedroom notebook mesh instance
    if (currentType === 'DIARY') {
      if (this.bungalowInterior) {
        this.bungalowInterior.removeUpperBedroomDiaryMesh();
      }
      this.cleanupOrphanDiaryMeshes();
    }

    // (b) Remove active item mesh instance from the scene/parent
    if (this.currentActiveItemMesh) {
      const active = this.currentActiveItemMesh;
      active.visible = false;
      if (active.parent) {
        active.parent.remove(active);
      }
      this.scene.remove(active);
      active.traverse((child) => {
        child.visible = false;
        if (child instanceof THREE.Light) {
          child.intensity = 0;
        }
        if ((child as THREE.Mesh).geometry) {
          (child as THREE.Mesh).geometry.dispose();
        }
      });
      this.currentActiveItemMesh = null;
    }

    // (c) Thorough sweep: find and remove any residual mesh instances matching this item
    const residualMeshes: THREE.Object3D[] = [];
    this.scene.traverse((obj) => {
      if (
        obj.name === `PuzzleItem_${currentType}` ||
        (currentType === 'DIARY' && obj.name === 'OLD_NOTEBOOK_DIARY_MESH') ||
        (obj.name && obj.name.includes(`PuzzleItem_${currentType}`))
      ) {
        residualMeshes.push(obj);
      } else if (
        obj.position &&
        obj.position.distanceTo(config.position) < 0.4 &&
        obj !== this.puzzleGroup &&
        (obj instanceof THREE.Mesh || obj instanceof THREE.Group) &&
        (obj.name.startsWith('PuzzleItem_') || obj.name === 'OLD_NOTEBOOK_DIARY_MESH')
      ) {
        residualMeshes.push(obj);
      }
    });

    if (this.bungalowInterior?.group) {
      this.bungalowInterior.group.traverse((obj: THREE.Object3D) => {
        if (
          obj.name === `PuzzleItem_${currentType}` ||
          (currentType === 'DIARY' && obj.name === 'OLD_NOTEBOOK_DIARY_MESH')
        ) {
          residualMeshes.push(obj);
        }
      });
    }

    for (const residual of residualMeshes) {
      residual.visible = false;
      if (residual.parent) residual.parent.remove(residual);
      this.scene.remove(residual);
      residual.traverse((c) => {
        c.visible = false;
        if (c instanceof THREE.Light) c.intensity = 0;
        if ((c as THREE.Mesh).geometry) (c as THREE.Mesh).geometry.dispose();
      });
    }

    // 3. Play subtle pickup sound
    horrorAudio.playItemPickup('DEFAULT');

    // 4. Update puzzle state: Add to collected items exactly once
    this.state.collectedItems.push(currentType);
    this.state.carriedItems = this.state.collectedItems.filter(
      (type) => !this.state.placedItems.includes(type)
    );

    // 5. Determine the next sequential item
    // DIARY -> WATCH -> PINK FLOWER -> BAG -> SPECTACLES
    const currentIndex = PUZZLE_ITEMS_CONFIG.findIndex((c) => c.type === currentType);
    const nextIndex = currentIndex + 1;
    if (nextIndex < PUZZLE_ITEMS_CONFIG.length) {
      this.state.currentObjectiveItem = PUZZLE_ITEMS_CONFIG[nextIndex].type;
    } else {
      this.state.currentObjectiveItem = null; // All 5 collected!
    }

    // 6. Spawn the next item in the sequence (only after pickup succeeds)
    this.spawnCurrentObjectiveItem();

    // 7. Re-render blackboard with updated checkmarks
    this.updateBlackboardTexture();

    // 8. Fire notifications
    if (this.onStateChange) this.onStateChange(this.state);
    if (this.onObjectiveBanner) {
      if (this.state.currentObjectiveItem) {
        const nextCfg = PUZZLE_ITEMS_CONFIG[nextIndex];
        this.onObjectiveBanner(
          `COLLECTED: ${config.name.toUpperCase()}`,
          `NEXT OBJECTIVE: SEARCH ${nextCfg.roomName.toUpperCase()} FOR ${nextCfg.name.toUpperCase()}`
        );
      } else {
        this.onObjectiveBanner(
          'ALL 5 BELONGINGS COLLECTED',
          'RETURN TO THE CENTRAL TABLE UNDER THE BLACKBOARD'
        );
      }
    }

    // 9. Return InventoryItem to add to player satchel
    return {
      id: config.id,
      name: config.name,
      category: 'RELIC',
      description: config.description,
      details: config.details,
      iconType: config.iconType,
      acquiredAt: config.roomName,
      placedOnTable: false,
    };
  }

  /**
   * Places an eligible collected item onto the central puzzle table.
   * Transfers the item from carried inventory to the table's placed-items state.
   * Keeps exactly one visible 3D copy resting on the table.
   */
  public placeItemOnTable(itemType: PuzzleItemType, deferMeshVisibility = false): boolean {
    // Guard against placing items not yet collected or already placed
    if (!this.state.collectedItems.includes(itemType)) return false;
    if (this.state.placedItems.includes(itemType)) return false;

    const config = PUZZLE_ITEMS_CONFIG.find((c) => c.type === itemType);
    if (!config) return false;

    // Check if a mesh for this item already exists on the table to ensure exactly one visible copy
    let itemMesh = this.placedTableMeshes.get(itemType);
    if (!itemMesh) {
      itemMesh = PuzzleItemsFactory.createItemMesh(itemType);
      itemMesh.position.copy(config.tablePosition);
      itemMesh.rotation.copy(config.tableRotation);
      this.puzzleGroup.add(itemMesh);
      this.placedTableMeshes.set(itemType, itemMesh);
    }

    if (deferMeshVisibility) {
      itemMesh.visible = false;
    } else {
      itemMesh.visible = true;
      horrorAudio.playItemPlacement();
    }

    // Add to placedItems and immediately remove from carriedItems
    this.state.placedItems.push(itemType);
    this.state.carriedItems = this.state.collectedItems.filter(
      (type) => !this.state.placedItems.includes(type)
    );

    // Update blackboard with placed status
    this.updateBlackboardTexture();

    if (this.onStateChange) this.onStateChange(this.state);

    // Check if ALL 5 ITEMS are placed on the table!
    if (this.state.placedItems.length === 5) {
      this.triggerSecretDoorUnlock();
    } else {
      if (this.onObjectiveBanner) {
        this.onObjectiveBanner(
          `PLACED ${config.name.toUpperCase()} ON TABLE`,
          `RESTORED: ${this.state.placedItems.length}/5 • CARRIED: ${this.state.carriedItems.length}/5`
        );
      }
    }

    return true;
  }

  /**
   * Reveals the placed item mesh on the table and plays placement sound.
   */
  public revealPlacedItemMesh(itemType: PuzzleItemType): void {
    const mesh = this.placedTableMeshes.get(itemType);
    if (mesh) {
      mesh.visible = true;
      horrorAudio.playItemPlacement();
    }
  }

  /**
   * Unlocks and begins opening the secret door beneath the staircase.
   */
  public triggerSecretDoorUnlock(): void {
    if (this.state.secretDoorUnlocked && this.state.secretDoorOpened) return;
    this.state.secretDoorUnlocked = true;
    this.isSecretDoorOpening = true;

    // Clear door collision so player can walk freely into the passage
    this.secretDoorCollider.min.set(0, 9999, 0);
    this.secretDoorCollider.max.set(0, 9999, 0);

    // 1. Play ominous secret door horror SFX (secret door.mpeg) and stone grinding rumble
    horrorAudio.playSecretDoorSfx();
    horrorAudio.playSecretDoorUnlock();

    // 2. Banner notification
    if (this.onObjectiveBanner) {
      this.onObjectiveBanner(
        'ALL 5 BELONGINGS RESTORED',
        'THE CONCEALED WALL SHIFTS — SECRET PASSAGE UNSEALED'
      );
    }

    // 3. Update blackboard
    this.updateBlackboardTexture();

    if (this.onStateChange) this.onStateChange(this.state);
  }

  /**
   * Direct interaction method to open the secret door if approached.
   */
  public openSecretDoor(): void {
    if (this.state.placedItems.length < 5) return; // Strict guard: never open or play before puzzle is completed
    if (this.state.secretDoorOpened && !this.isSecretDoorOpening) return;
    this.state.secretDoorUnlocked = true;
    this.isSecretDoorOpening = true;

    // Clear door collision so player can walk freely into the passage
    this.secretDoorCollider.min.set(0, 9999, 0);
    this.secretDoorCollider.max.set(0, 9999, 0);

    horrorAudio.playSecretDoorSfx();
    horrorAudio.playSecretDoorUnlock();

    if (this.onObjectiveBanner) {
      this.onObjectiveBanner(
        'CONCEALED DOOR OPENS',
        'THE SECRET SUBTERRANEAN PASSAGE HAS BEEN REVEALED'
      );
    }

    this.updateBlackboardTexture();
    if (this.onStateChange) this.onStateChange(this.state);
  }

  /**
   * Updates animations and state per frame.
   */
  public update(delta: number, player?: any, onBanner?: (title: string, sub: string) => void): void {
    // Secret door opening animation
    if (this.isSecretDoorOpening && this.secretDoorHinge) {
      this.state.secretDoorOpenProgress += delta * 0.45; // Smooth opening over ~2.2 seconds

      // Clear collision immediately once motion begins so player is never blocked
      this.secretDoorCollider.min.set(0, 9999, 0);
      this.secretDoorCollider.max.set(0, 9999, 0);

      if (this.state.secretDoorOpenProgress >= 1.0) {
        this.state.secretDoorOpenProgress = 1.0;
        this.isSecretDoorOpening = false;
        this.state.secretDoorOpened = true;
        if (this.onStateChange) this.onStateChange(this.state);
      }

      // Smooth natural hinge rotation: swings open inward into the secret passage (-Z direction) on left hinges
      // Swings by 90 degrees (Math.PI * 0.50), resting flat against the passage left wall and completely clearing the doorway
      const p = this.state.secretDoorOpenProgress;
      const smoothP = THREE.MathUtils.smoothstep(p, 0, 1);
      const maxSwing = Math.PI * 0.50;
      this.secretDoorHinge.rotation.y = maxSwing * smoothP;
    } else if (this.state.secretDoorOpened && this.secretDoorHinge) {
      this.secretDoorHinge.rotation.y = Math.PI * 0.50;
      this.secretDoorCollider.min.set(0, 9999, 0);
      this.secretDoorCollider.max.set(0, 9999, 0);
    }

    // Floor Trapdoor collapse animation
    if (this.isTrapdoorTriggered && this.trapdoorHinge) {
      this.trapdoorProgress = Math.min(1.0, this.trapdoorProgress + delta * 4.5);
      this.trapdoorHinge.rotation.x = -Math.PI * 0.48 * THREE.MathUtils.smoothstep(this.trapdoorProgress, 0, 1);
    }

    // Detect player stepping onto the floor trap beneath the 3 stone steps
    if (
      player &&
      !this.isTrapdoorTriggered &&
      (this.state.secretDoorOpened || this.state.secretDoorOpenProgress > 0.4) &&
      player.currentFloorZone !== 'BASEMENT' &&
      !player.isFallingToBasement
    ) {
      const px = player.position.x;
      const pz = player.position.z;
      // Floor trap zone at bottom of 3 stone steps (z in [-81.2, -83.5], |x| <= 1.05)
      if (pz <= -81.2 && pz >= -83.5 && Math.abs(px) <= 1.05) {
        this.isTrapdoorTriggered = true;
        horrorAudio.playTrapdoorCollapse();

        const bannerFn = this.onObjectiveBanner || onBanner;
        if (bannerFn) {
          bannerFn('CONCEALED FLOOR TRAP', 'THE STONE FOUNDATION CRUMBLES BENEATH YOU');
        }

        player.startBasementFallSequence(-8.0, () => {
          horrorAudio.startBasementDrone();
          if (bannerFn) {
            bannerFn('UNDERGROUND BASEMENT', 'AN ANCIENT UNDERGROUND COMPLEX BENEATH THE BUNGALOW');
          }
        });
      }
    }

    // Subtle breathing glow animation on active world item
    if (this.currentActiveItemMesh) {
      const glint = this.currentActiveItemMesh.children.find(
        (c) => c instanceof THREE.PointLight
      ) as THREE.PointLight | undefined;
      if (glint) {
        glint.intensity = 0.30 + Math.sin(performance.now() * 0.003) * 0.15;
      }
    }
  }

  /**
   * Re-renders the high-resolution Blackboard chalk texture.
   */
  public updateBlackboardTexture(): void {
    const ctx = this.blackboardCanvas.getContext('2d');
    if (!ctx) return;

    const w = 1024;
    const h = 640;

    // 1. Dark aged slate background with chalk smudges
    ctx.fillStyle = '#111516';
    ctx.fillRect(0, 0, w, h);

    // Chalk dust texture & antique smudges
    for (let i = 0; i < 180; i++) {
      const sx = Math.random() * w;
      const sy = Math.random() * h;
      const sr = 15 + Math.random() * 65;
      const grad = ctx.createRadialGradient(sx, sy, 2, sx, sy, sr);
      grad.addColorStop(0, 'rgba(235, 238, 240, 0.04)');
      grad.addColorStop(1, 'rgba(17, 21, 22, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(sx, sy, sr, 0, Math.PI * 2);
      ctx.fill();
    }

    // Outer double chalk border
    ctx.strokeStyle = 'rgba(230, 230, 225, 0.35)';
    ctx.lineWidth = 3;
    ctx.strokeRect(28, 28, w - 56, h - 56);
    ctx.strokeStyle = 'rgba(230, 230, 225, 0.18)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(36, 36, w - 72, h - 72);

    // 2. Title Header
    ctx.textAlign = 'center';
    ctx.fillStyle = '#f0efe9';
    ctx.font = 'bold 40px "Cinzel", "Georgia", serif';
    ctx.fillText('FIND FIVE OBJECTS', w / 2, 95);

    // Faded underline
    ctx.strokeStyle = 'rgba(220, 215, 205, 0.45)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(w / 2 - 180, 115);
    ctx.lineTo(w / 2 + 180, 115);
    ctx.stroke();

    // 3. Five Items List
    const items = PUZZLE_ITEMS_CONFIG;
    const startY = 185;
    const lineHeight = 56;
    ctx.textAlign = 'left';

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const isCompleted = this.state.placedItems.includes(item.type) || this.state.collectedItems.includes(item.type);
      const isPlaced = this.state.placedItems.includes(item.type);
      const y = startY + i * lineHeight;

      if (isPlaced) {
        ctx.fillStyle = '#8fbc8f';
        ctx.font = 'bold 28px monospace';
        ctx.fillText(`✓  ${i + 1}. ${item.name}`, 310, y);
      } else if (isCompleted) {
        ctx.fillStyle = '#f0e68c';
        ctx.font = 'bold 28px monospace';
        ctx.fillText(`✓  ${i + 1}. ${item.name}`, 310, y);
      } else {
        ctx.fillStyle = 'rgba(220, 215, 205, 0.75)';
        ctx.font = '28px monospace';
        ctx.fillText(`   ${i + 1}. ${item.name}`, 310, y);
      }
    }

    // 4. Instructions Footer
    ctx.textAlign = 'center';
    ctx.fillStyle = '#e5dfd3';
    ctx.font = '22px "Cinzel", "Georgia", serif';
    ctx.fillText('Find each object and place all five on the table to reveal', w / 2, 515);
    ctx.fillText('the secret door.', w / 2, 550);

    if (this.state.secretDoorUnlocked) {
      ctx.fillStyle = '#4ade80';
      ctx.font = 'bold 24px "Cinzel", serif';
      ctx.fillText('✦ THE SECRET DOOR IS UNLOCKED ✦', w / 2, 600);
    }

    this.blackboardTexture.needsUpdate = true;
  }
}
