import * as THREE from 'three';
import { horrorAudio } from '../audio/HorrorAudioManager';

export interface BungalowInteriorClue {
  id: string;
  name: string;
  room: string;
  position: THREE.Vector3;
  description: string;
  subtext: string;
}

/**
 * Real Old Two-Story Abandoned Family Bungalow Interior
 * 
 * Layout:
 * GROUND FLOOR (Elevation y = 1.45 to 5.45, ceiling height 4.0m):
 * - Central Entrance Hall (wide, gives immediate clear view of whole house layout)
 * - LEFT SIDE:
 *   - Left Room 1: Old Living / Family Room (fireplace, velvet armchairs, family portrait, gramophone)
 *   - Left Room 2: Old Study / Library (bookshelves, desk, typewriter, Yamini's handwritten letter clue)
 * - RIGHT SIDE:
 *   - Right Room 1: Old Dining Room (long banquet table, candelabra, porcelain cabinet, grandfather clock)
 *   - Right Room 2: Old Storage / Utility Room (pantry shelves, dusty crates, old trunk, iron keys, tool shelf)
 * - STRAIGHT AHEAD:
 *   - Grand Old Wooden Staircase (width 2.6m) connecting Ground Floor (y = 1.45) to Second Floor (y = 5.45)
 *
 * SECOND FLOOR (Elevation y = 5.45 to 9.25, ceiling height 3.8m):
 * - Central Staircase Landing & Gallery Hallway with wooden balustrade looking over the lower hall
 * - LEFT SIDE:
 *   - Large Family Master Bedroom (large 4-poster bed, vanity mirror, wardrobe, balcony window)
 * - RIGHT SIDE:
 *   - Large Story Room / Yamini's Abandoned Bedroom (rocking chair, music box, torn diary, family photograph)
 *
 * LIGHTING:
 * - NOT pitch black. Warm ceiling lamps, weak tungsten sconces, flickering wall lamps,
 *   moonlight streaming through windows, soft ambient fill to eliminate crushed blacks.
 */
export class BungalowInterior {
  public group: THREE.Group;
  public colliders: THREE.Box3[] = [];
  public interiorClues: BungalowInteriorClue[] = [];
  public flickeringLamps: THREE.PointLight[] = [];

  // Ambience audio timer
  private ambienceTimer = 0;
  private nextAmbienceSoundTime = 14.0;

  // Reusable materials
  private woodFloorMat: THREE.MeshStandardMaterial;
  private upperWoodFloorMat: THREE.MeshStandardMaterial;
  private wallpaperMat: THREE.MeshStandardMaterial;
  private studyWallMat: THREE.MeshStandardMaterial;
  private diningWallMat: THREE.MeshStandardMaterial;
  private bedroomWallMat: THREE.MeshStandardMaterial;
  private ceilingMat: THREE.MeshStandardMaterial;
  private darkTeakMat: THREE.MeshStandardMaterial;
  private oldFabricMat: THREE.MeshStandardMaterial;
  private wornCarpetMat: THREE.MeshStandardMaterial;
  private brassMat: THREE.MeshStandardMaterial;
  private dustyGlassMat: THREE.MeshStandardMaterial;
  private paperMat: THREE.MeshStandardMaterial;

  constructor(scene: THREE.Scene) {
    this.group = new THREE.Group();
    // Anchor bungalow interior coordinate space matching bungalowGroup at z = -66
    // Front entrance double door is at z = -58.95 (local z = 7.05).
    // Central hall extends inward from z = -59 to z = -79 (local z = 7 to -13).
    // Total width spans x = -13 to +13 (26m wide).
    this.group.position.set(0, 0, 0);

    // Initialize optimized, atmospheric materials
    this.woodFloorMat = new THREE.MeshStandardMaterial({
      color: 0x3a281c,
      roughness: 0.82,
      metalness: 0.08,
    });

    this.upperWoodFloorMat = new THREE.MeshStandardMaterial({
      color: 0x322216,
      roughness: 0.85,
      metalness: 0.05,
    });

    this.wallpaperMat = new THREE.MeshStandardMaterial({
      color: 0x5a5247,
      roughness: 0.9,
      metalness: 0.02,
    });

    this.studyWallMat = new THREE.MeshStandardMaterial({
      color: 0x3d423b,
      roughness: 0.92,
      metalness: 0.02,
    });

    this.diningWallMat = new THREE.MeshStandardMaterial({
      color: 0x523f38,
      roughness: 0.9,
      metalness: 0.03,
    });

    this.bedroomWallMat = new THREE.MeshStandardMaterial({
      color: 0x48424e,
      roughness: 0.9,
      metalness: 0.02,
    });

    this.ceilingMat = new THREE.MeshStandardMaterial({
      color: 0x2e2b28,
      roughness: 0.95,
      metalness: 0.0,
    });

    this.darkTeakMat = new THREE.MeshStandardMaterial({
      color: 0x241a12,
      roughness: 0.78,
      metalness: 0.1,
    });

    this.oldFabricMat = new THREE.MeshStandardMaterial({
      color: 0x4a2a24,
      roughness: 0.95,
      metalness: 0.0,
    });

    this.wornCarpetMat = new THREE.MeshStandardMaterial({
      color: 0x4b2d28,
      roughness: 0.96,
      metalness: 0.0,
    });

    this.brassMat = new THREE.MeshStandardMaterial({
      color: 0x6e5832,
      roughness: 0.55,
      metalness: 0.75,
    });

    this.dustyGlassMat = new THREE.MeshStandardMaterial({
      color: 0x223038,
      roughness: 0.25,
      metalness: 0.7,
      transparent: true,
      opacity: 0.65,
    });

    this.paperMat = new THREE.MeshStandardMaterial({
      color: 0x8a7f6c,
      roughness: 0.9,
      metalness: 0.0,
    });

    this.buildGroundFloor();
    this.buildGrandStaircase();
    this.buildSecondFloor();
    this.buildAtmosphericLighting();
    this.setupStoryClues();

    scene.add(this.group);
  }

  /**
   * Builds the Ground Floor:
   * - Central Entrance Hall (width 6m, length 18m, height 4.0m)
   * - Left Room 1 (Living Room): x: -11 to -3, z: -59 to -68
   * - Left Room 2 (Study / Library): x: -11 to -3, z: -68 to -77
   * - Right Room 1 (Dining Room): x: 3 to 11, z: -59 to -68
   * - Right Room 2 (Storage / Utility): x: 3 to 11, z: -68 to -77
   */
  private buildGroundFloor(): void {
    const floorY = 1.45;
    const ceilY = 5.45;
    const wallH = ceilY - floorY;

    // 1. Ground Floor Parquet/Wood Plank Flooring (spans x: -12.5 to +12.5, z: -58.5 to -78.5)
    const floorGeo = new THREE.BoxGeometry(25.0, 0.2, 20.0);
    const floorMesh = new THREE.Mesh(floorGeo, this.woodFloorMat);
    floorMesh.position.set(0, floorY - 0.1, -68.5);
    floorMesh.receiveShadow = true;
    this.group.add(floorMesh);

    // Decorative Damaged Runner Carpet along Central Hall
    const runnerGeo = new THREE.BoxGeometry(2.4, 0.02, 12.0);
    const runner = new THREE.Mesh(runnerGeo, this.wornCarpetMat);
    runner.position.set(0, floorY + 0.01, -65.0);
    runner.receiveShadow = true;
    this.group.add(runner);

    // 2. Ground Floor Ceiling (under second floor)
    // Center opening left for the staircase well (x: -2.0 to 2.0, z: -70.5 to -76.5)
    const ceilFrontGeo = new THREE.BoxGeometry(25.0, 0.2, 12.0);
    const ceilFront = new THREE.Mesh(ceilFrontGeo, this.ceilingMat);
    ceilFront.position.set(0, ceilY + 0.1, -64.5);
    this.group.add(ceilFront);

    const ceilLeftGeo = new THREE.BoxGeometry(10.5, 0.2, 8.0);
    const ceilLeft = new THREE.Mesh(ceilLeftGeo, this.ceilingMat);
    ceilLeft.position.set(-7.25, ceilY + 0.1, -74.5);
    this.group.add(ceilLeft);

    const ceilRightGeo = new THREE.BoxGeometry(10.5, 0.2, 8.0);
    const ceilRight = new THREE.Mesh(ceilRightGeo, this.ceilingMat);
    ceilRight.position.set(7.25, ceilY + 0.1, -74.5);
    this.group.add(ceilRight);

    // 3. Exterior Perimeter Walls (Enclosing ground floor)
    // Rear wall (z = -78.5)
    this.createWall(new THREE.Vector3(0, (floorY + ceilY) / 2, -78.5), new THREE.Vector3(25.0, wallH, 0.3), this.wallpaperMat);
    // Left outer wall (x = -12.5)
    this.createWall(new THREE.Vector3(-12.5, (floorY + ceilY) / 2, -68.5), new THREE.Vector3(0.3, wallH, 20.0), this.wallpaperMat);
    // Right outer wall (x = 12.5)
    this.createWall(new THREE.Vector3(12.5, (floorY + ceilY) / 2, -68.5), new THREE.Vector3(0.3, wallH, 20.0), this.wallpaperMat);

    // Front Facade Wall with Center Door Opening (z = -58.95)
    // Left wing of front wall: x: -12.5 to -1.5 (width 11.0)
    this.createWall(new THREE.Vector3(-7.0, (floorY + ceilY) / 2, -58.95), new THREE.Vector3(11.0, wallH, 0.3), this.wallpaperMat);
    // Right wing of front wall: x: 1.5 to 12.5 (width 11.0)
    this.createWall(new THREE.Vector3(7.0, (floorY + ceilY) / 2, -58.95), new THREE.Vector3(11.0, wallH, 0.3), this.wallpaperMat);
    // Over-door transom header
    this.createWall(new THREE.Vector3(0, ceilY - 0.4, -58.95), new THREE.Vector3(3.0, 0.8, 0.3), this.wallpaperMat, false);

    // 4. Central Hallway Partition Walls & Door Openings
    // LEFT HALLWAY WALL (x = -3.0, from z = -58.95 to -78.5)
    // Segment 1: front to door 1
    this.createWall(new THREE.Vector3(-3.0, (floorY + ceilY) / 2, -60.0), new THREE.Vector3(0.25, wallH, 2.0), this.wallpaperMat);
    // Doorway 1 (z = -62.5, width 1.4m, height 2.6m) -> OVERHEAD HEADER
    this.createWall(new THREE.Vector3(-3.0, ceilY - 0.7, -62.5), new THREE.Vector3(0.25, 1.4, 1.4), this.wallpaperMat, false);
    this.createDoorFrame(new THREE.Vector3(-3.0, floorY + 1.3, -62.5), 1.35, 2.6, true);
    // Segment 2: between door 1 and 2
    this.createWall(new THREE.Vector3(-3.0, (floorY + ceilY) / 2, -66.5), new THREE.Vector3(0.25, wallH, 5.0), this.wallpaperMat);
    // Doorway 2 (z = -71.5, width 1.4m, height 2.6m) -> OVERHEAD HEADER
    this.createWall(new THREE.Vector3(-3.0, ceilY - 0.7, -71.5), new THREE.Vector3(0.25, 1.4, 1.4), this.wallpaperMat, false);
    this.createDoorFrame(new THREE.Vector3(-3.0, floorY + 1.3, -71.5), 1.35, 2.6, true);
    // Segment 3: past door 2 to back wall
    this.createWall(new THREE.Vector3(-3.0, (floorY + ceilY) / 2, -75.5), new THREE.Vector3(0.25, wallH, 4.6), this.wallpaperMat);

    // RIGHT HALLWAY WALL (x = 3.0, from z = -58.95 to -78.5)
    // Segment 1: front to door 1
    this.createWall(new THREE.Vector3(3.0, (floorY + ceilY) / 2, -60.0), new THREE.Vector3(0.25, wallH, 2.0), this.wallpaperMat);
    // Doorway 1 (z = -62.5, width 1.4m, height 2.6m) -> OVERHEAD HEADER
    this.createWall(new THREE.Vector3(3.0, ceilY - 0.7, -62.5), new THREE.Vector3(0.25, 1.4, 1.4), this.wallpaperMat, false);
    this.createDoorFrame(new THREE.Vector3(3.0, floorY + 1.3, -62.5), 1.35, 2.6, true);
    // Segment 2: between door 1 and 2
    this.createWall(new THREE.Vector3(3.0, (floorY + ceilY) / 2, -66.5), new THREE.Vector3(0.25, wallH, 5.0), this.wallpaperMat);
    // Doorway 2 (z = -71.5, width 1.4m, height 2.6m) -> OVERHEAD HEADER
    this.createWall(new THREE.Vector3(3.0, ceilY - 0.7, -71.5), new THREE.Vector3(0.25, 1.4, 1.4), this.wallpaperMat, false);
    this.createDoorFrame(new THREE.Vector3(3.0, floorY + 1.3, -71.5), 1.35, 2.6, true);
    // Segment 3: past door 2 to back wall
    this.createWall(new THREE.Vector3(3.0, (floorY + ceilY) / 2, -75.5), new THREE.Vector3(0.25, wallH, 4.6), this.wallpaperMat);

    // 5. Room Dividing Walls (separating Room 1 and Room 2)
    // Dividing Left Room 1 & Left Room 2 (z = -68.0, x: -12.5 to -3.0)
    this.createWall(new THREE.Vector3(-7.75, (floorY + ceilY) / 2, -68.0), new THREE.Vector3(9.5, wallH, 0.25), this.studyWallMat);
    // Dividing Right Room 1 & Right Room 2 (z = -68.0, x: 3.0 to 12.5)
    this.createWall(new THREE.Vector3(7.75, (floorY + ceilY) / 2, -68.0), new THREE.Vector3(9.5, wallH, 0.25), this.diningWallMat);

    // 6. FURNISHINGS & DETAILS FOR GROUND FLOOR ROOMS
    this.populateLeftRoom1_LivingRoom(floorY);
    this.populateLeftRoom2_StudyLibrary(floorY);
    this.populateRightRoom1_DiningRoom(floorY);
    this.populateRightRoom2_StorageUtility(floorY);
    this.populateCentralEntranceHall(floorY);
  }

  /**
   * Left Room 1: Old Living / Family Room
   */
  private populateLeftRoom1_LivingRoom(floorY: number): void {
    const rx = -7.5;
    const rz = -63.5;

    // Stone Fireplace & Chimney Hearth against west outer wall
    const fpGeo = new THREE.BoxGeometry(0.8, 2.2, 2.6);
    const fpMesh = new THREE.Mesh(fpGeo, this.wallpaperMat);
    fpMesh.position.set(-12.1, floorY + 1.1, rz);
    this.group.add(fpMesh);
    this.addBoxCollider(fpMesh.position, new THREE.Vector3(1.0, 2.5, 2.8));

    // Fireplace Mantle & Hearth opening
    const mantleGeo = new THREE.BoxGeometry(0.9, 0.1, 2.8);
    const mantle = new THREE.Mesh(mantleGeo, this.darkTeakMat);
    mantle.position.set(-12.05, floorY + 2.2, rz);
    this.group.add(mantle);

    // Pair of dusty velvet wingback armchairs angled toward fireplace
    this.createArmchair(new THREE.Vector3(-9.2, floorY, rz - 1.2), 0.45);
    this.createArmchair(new THREE.Vector3(-9.2, floorY, rz + 1.2), -0.45);

    // Weathered round tea table between chairs
    const tableGeo = new THREE.CylinderGeometry(0.65, 0.65, 0.06, 12);
    const tableTop = new THREE.Mesh(tableGeo, this.darkTeakMat);
    tableTop.position.set(-9.2, floorY + 0.65, rz);
    this.group.add(tableTop);

    const legGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.65, 8);
    const leg = new THREE.Mesh(legGeo, this.darkTeakMat);
    leg.position.set(-9.2, floorY + 0.325, rz);
    this.group.add(leg);
    this.addBoxCollider(new THREE.Vector3(-9.2, floorY + 0.5, rz), new THREE.Vector3(1.4, 1.0, 1.4));

    // Vintage Gramophone with brass horn on small corner stand
    const gramoGeo = new THREE.BoxGeometry(0.45, 0.25, 0.45);
    const gramo = new THREE.Mesh(gramoGeo, this.darkTeakMat);
    gramo.position.set(-11.6, floorY + 0.95, -60.2);
    this.group.add(gramo);

    const hornGeo = new THREE.ConeGeometry(0.24, 0.45, 12, 1, true);
    const horn = new THREE.Mesh(hornGeo, this.brassMat);
    horn.rotation.x = -Math.PI / 2.8;
    horn.rotation.y = 0.5;
    horn.position.set(-11.5, floorY + 1.3, -60.2);
    this.group.add(horn);

    // Large Gilded Family Portrait on the mantle
    this.createPainting(new THREE.Vector3(-12.35, floorY + 2.9, rz), new THREE.Vector2(1.8, 1.2), 'THE DEVIL FAMILY — 1924', true);
  }

  /**
   * Left Room 2: Old Study / Library
   */
  private populateLeftRoom2_StudyLibrary(floorY: number): void {
    const rx = -7.5;
    const rz = -73.0;

    // Massive floor-to-ceiling wooden bookshelves against back and side walls
    this.createBookshelf(new THREE.Vector3(-12.1, floorY + 1.8, rz - 2.0), 3.4, 3.2, 0.6, true);
    this.createBookshelf(new THREE.Vector3(-7.5, floorY + 1.8, -78.1), 4.2, 3.2, 0.6, false);

    // Heavy mahogany writing desk in center of study
    const deskGeo = new THREE.BoxGeometry(2.2, 0.1, 1.2);
    const deskTop = new THREE.Mesh(deskGeo, this.darkTeakMat);
    deskTop.position.set(rx, floorY + 0.78, rz);
    this.group.add(deskTop);

    // Desk drawers pedestal legs
    const pedGeo = new THREE.BoxGeometry(0.5, 0.75, 1.1);
    const pedL = new THREE.Mesh(pedGeo, this.darkTeakMat);
    pedL.position.set(rx - 0.8, floorY + 0.38, rz);
    this.group.add(pedL);
    const pedR = new THREE.Mesh(pedGeo, this.darkTeakMat);
    pedR.position.set(rx + 0.8, floorY + 0.38, rz);
    this.group.add(pedR);
    this.addBoxCollider(new THREE.Vector3(rx, floorY + 0.5, rz), new THREE.Vector3(2.4, 1.1, 1.4));

    // Vintage mechanical typewriter on desk
    const twGeo = new THREE.BoxGeometry(0.42, 0.16, 0.38);
    const tw = new THREE.Mesh(twGeo, this.brassMat);
    tw.position.set(rx - 0.2, floorY + 0.9, rz);
    this.group.add(tw);

    // Old Bankers Brass Desk Lamp with green glass shade
    const lampBaseGeo = new THREE.CylinderGeometry(0.1, 0.12, 0.04);
    const lBase = new THREE.Mesh(lampBaseGeo, this.brassMat);
    lBase.position.set(rx + 0.65, floorY + 0.82, rz - 0.3);
    this.group.add(lBase);

    const shadeGeo = new THREE.CylinderGeometry(0.14, 0.14, 0.26, 8);
    shadeGeo.rotateZ(Math.PI / 2);
    const shadeMat = new THREE.MeshStandardMaterial({ color: 0x1f4a2c, roughness: 0.3, emissive: 0x112818, emissiveIntensity: 0.6 });
    const shade = new THREE.Mesh(shadeGeo, shadeMat);
    shade.position.set(rx + 0.65, floorY + 1.15, rz - 0.3);
    this.group.add(shade);

    // Desk chair
    this.createChair(new THREE.Vector3(rx, floorY, rz + 0.85), Math.PI);
  }

  /**
   * Right Room 1: Old Dining Room
   */
  private populateRightRoom1_DiningRoom(floorY: number): void {
    const rx = 7.5;
    const rz = -63.5;

    // Long banquet dining table
    const dtGeo = new THREE.BoxGeometry(2.0, 0.08, 4.4);
    const dtTop = new THREE.Mesh(dtGeo, this.darkTeakMat);
    dtTop.position.set(rx, floorY + 0.8, rz);
    this.group.add(dtTop);

    // Table legs
    const tLegGeo = new THREE.CylinderGeometry(0.06, 0.05, 0.8, 8);
    const legOffsets: [number, number][] = [[-0.85, -1.9], [0.85, -1.9], [-0.85, 1.9], [0.85, 1.9]];
    for (const [lx, lz] of legOffsets) {
      const tl = new THREE.Mesh(tLegGeo, this.darkTeakMat);
      tl.position.set(rx + lx, floorY + 0.4, rz + lz);
      this.group.add(tl);
    }
    this.addBoxCollider(new THREE.Vector3(rx, floorY + 0.5, rz), new THREE.Vector3(2.4, 1.1, 4.8));

    // Dining chairs around the table
    for (let c = -1.5; c <= 1.5; c += 1.0) {
      this.createChair(new THREE.Vector3(rx - 1.35, floorY, rz + c), Math.PI / 2);
      this.createChair(new THREE.Vector3(rx + 1.35, floorY, rz + c), -Math.PI / 2);
    }

    // Heavy Victorian Grandfather Clock ticking in the corner
    const gcGeo = new THREE.BoxGeometry(0.7, 2.6, 0.5);
    const gc = new THREE.Mesh(gcGeo, this.darkTeakMat);
    gc.position.set(12.0, floorY + 1.3, -59.5);
    this.group.add(gc);
    this.addBoxCollider(gc.position, new THREE.Vector3(0.9, 2.7, 0.7));

    // Brass clock face
    const cfGeo = new THREE.CircleGeometry(0.2, 16);
    const cf = new THREE.Mesh(cfGeo, this.brassMat);
    cf.position.set(11.95, floorY + 2.1, -59.24);
    this.group.add(cf);

    // Old China Cabinet along east outer wall
    const cabGeo = new THREE.BoxGeometry(0.6, 2.4, 2.8);
    const cab = new THREE.Mesh(cabGeo, this.darkTeakMat);
    cab.position.set(12.1, floorY + 1.2, rz);
    this.group.add(cab);
    this.addBoxCollider(cab.position, new THREE.Vector3(0.8, 2.5, 3.0));

    // Glass panel on china cabinet
    const cpGeo = new THREE.BoxGeometry(0.04, 1.5, 2.4);
    const cp = new THREE.Mesh(cpGeo, this.dustyGlassMat);
    cp.position.set(11.78, floorY + 1.4, rz);
    this.group.add(cp);
  }

  /**
   * Right Room 2: Old Storage / Utility Room
   */
  private populateRightRoom2_StorageUtility(floorY: number): void {
    const rx = 7.5;
    const rz = -73.0;

    // Heavy utility / pantry shelving with dust and aged wooden boxes
    this.createBookshelf(new THREE.Vector3(12.1, floorY + 1.6, rz), 3.2, 2.8, 0.7, true);

    // Overturned and stacked wooden crates
    const crateMat = new THREE.MeshStandardMaterial({ color: 0x3d2d1e, roughness: 0.95 });
    const crateGeo = new THREE.BoxGeometry(0.85, 0.65, 0.85);

    const c1 = new THREE.Mesh(crateGeo, crateMat);
    c1.position.set(rx + 1.2, floorY + 0.325, rz - 2.5);
    c1.rotation.y = 0.25;
    this.group.add(c1);

    const c2 = new THREE.Mesh(crateGeo, crateMat);
    c2.position.set(rx + 1.1, floorY + 0.975, rz - 2.6);
    c2.rotation.y = -0.15;
    this.group.add(c2);

    const c3 = new THREE.Mesh(crateGeo, crateMat);
    c3.position.set(rx + 2.0, floorY + 0.325, rz - 2.2);
    c3.rotation.y = 0.55;
    this.group.add(c3);
    this.addBoxCollider(new THREE.Vector3(rx + 1.5, floorY + 0.6, rz - 2.4), new THREE.Vector3(2.2, 1.5, 2.2));

    // Abandoned metal steamer trunk
    const trunkGeo = new THREE.BoxGeometry(1.2, 0.55, 0.75);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x22262a, roughness: 0.7, metalness: 0.6 });
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.set(rx - 1.5, floorY + 0.275, -77.8);
    this.group.add(trunk);
    this.addBoxCollider(trunk.position, new THREE.Vector3(1.4, 0.7, 0.9));
  }

  /**
   * Central Entrance Hall:
   * Provides immediate visual clarity when entering the front door.
   * Player sees 2 doors on left, 2 doors on right, and grand staircase straight ahead.
   */
  private populateCentralEntranceHall(floorY: number): void {
    // Vintage Console Table along hall wall
    const cTableGeo = new THREE.BoxGeometry(0.45, 0.85, 1.6);
    const cTable = new THREE.Mesh(cTableGeo, this.darkTeakMat);
    cTable.position.set(-2.7, floorY + 0.425, -60.8);
    this.group.add(cTable);
    this.addBoxCollider(cTable.position, new THREE.Vector3(0.6, 1.0, 1.8));

    // Brass key dish and candelabra on console table
    const dishGeo = new THREE.CylinderGeometry(0.14, 0.1, 0.05, 12);
    const dish = new THREE.Mesh(dishGeo, this.brassMat);
    dish.position.set(-2.7, floorY + 0.88, -60.8);
    this.group.add(dish);

    // Large Victorian Foyer Mirror above console table
    this.createPainting(new THREE.Vector3(-2.84, floorY + 2.1, -60.8), new THREE.Vector2(1.2, 1.6), 'DUSTY TARNISHED MIRROR', false);

    // Coat & Hat Rack stand near entrance
    const rackPoleGeo = new THREE.CylinderGeometry(0.04, 0.06, 2.1, 8);
    const rack = new THREE.Mesh(rackPoleGeo, this.darkTeakMat);
    rack.position.set(2.4, floorY + 1.05, -60.2);
    this.group.add(rack);
    this.addBoxCollider(rack.position, new THREE.Vector3(0.6, 2.2, 0.6));
  }

  /**
   * Grand Old Wooden Staircase:
   * Begins at center hall (x = 0, z = -68.5, y = 1.45) and climbs smoothly
   * upward straight ahead to second floor landing (x = 0, z = -75.5, y = 5.45).
   * Width: 2.6m. Steps: 20 physical wooden steps with handrails, spindles, and dust.
   */
  private buildGrandStaircase(): void {
    const startZ = -68.5;
    const endZ = -75.5;
    const startY = 1.45;
    const endY = 5.45;
    const stepCount = 20;
    const stepWidth = 2.6;
    const dz = (endZ - startZ) / stepCount;
    const dy = (endY - startY) / stepCount;

    const treadGeo = new THREE.BoxGeometry(stepWidth, 0.08, Math.abs(dz) * 1.15);
    const riserGeo = new THREE.BoxGeometry(stepWidth, dy * 1.05, 0.04);

    for (let s = 0; s < stepCount; s++) {
      const curY = startY + (s + 0.5) * dy;
      const curZ = startZ + (s + 0.5) * dz;

      // Tread
      const tread = new THREE.Mesh(treadGeo, this.darkTeakMat);
      tread.position.set(0, curY + dy * 0.5, curZ);
      tread.receiveShadow = true;
      this.group.add(tread);

      // Riser
      const riser = new THREE.Mesh(riserGeo, this.wallpaperMat);
      riser.position.set(0, curY, curZ + Math.abs(dz) * 0.5);
      this.group.add(riser);

      // Spindles & Handrails on both sides (x = -1.25 and x = 1.25)
      if (s % 2 === 0) {
        const spinGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.95);
        const spinL = new THREE.Mesh(spinGeo, this.darkTeakMat);
        spinL.position.set(-1.25, curY + dy * 0.5 + 0.48, curZ);
        this.group.add(spinL);

        const spinR = new THREE.Mesh(spinGeo, this.darkTeakMat);
        spinR.position.set(1.25, curY + dy * 0.5 + 0.48, curZ);
        this.group.add(spinR);
      }
    }

    // Continuous angled handrails
    const railLength = Math.sqrt(Math.pow(endZ - startZ, 2) + Math.pow(endY - startY, 2));
    const railAngle = Math.atan2(endY - startY, Math.abs(endZ - startZ));
    const railGeo = new THREE.BoxGeometry(0.08, 0.08, railLength);

    const railL = new THREE.Mesh(railGeo, this.darkTeakMat);
    railL.position.set(-1.25, (startY + endY) / 2 + 0.95, (startZ + endZ) / 2);
    railL.rotation.x = railAngle;
    this.group.add(railL);

    const railR = new THREE.Mesh(railGeo, this.darkTeakMat);
    railR.position.set(1.25, (startY + endY) / 2 + 0.95, (startZ + endZ) / 2);
    railR.rotation.x = railAngle;
    this.group.add(railR);

    // Staircase side barrier colliders to prevent falling off the sides while climbing
    const colLength = Math.abs(endZ - startZ);
    this.addBoxCollider(new THREE.Vector3(-1.35, (startY + endY) / 2 + 0.5, (startZ + endZ) / 2), new THREE.Vector3(0.2, endY - startY + 1.2, colLength));
    this.addBoxCollider(new THREE.Vector3(1.35, (startY + endY) / 2 + 0.5, (startZ + endZ) / 2), new THREE.Vector3(0.2, endY - startY + 1.2, colLength));
  }

  /**
   * Builds the Second Floor:
   * Exactly TWO LARGE ROOMS + Central Stair Landing / Hallway:
   * - Center: Staircase landing / hallway (x: -3.0 to 3.0, z: -58.95 to -78.5)
   * - Left: ONE Large Master Family Bedroom (x: -12.5 to -3.0, z: -58.95 to -78.5, size: 9.5m x 19.5m)
   * - Right: ONE Large Abandoned Story Bedroom / Yamini's Room (x: 3.0 to 12.5, z: -58.95 to -78.5, size: 9.5m x 19.5m)
   */
  private buildSecondFloor(): void {
    const floorY = 5.45;
    const ceilY = 9.25;
    const wallH = ceilY - floorY;

    // 1. Second Floor Upper Ceiling / Roof Beam structure
    const ceilGeo = new THREE.BoxGeometry(25.0, 0.2, 20.0);
    const upperCeil = new THREE.Mesh(ceilGeo, this.ceilingMat);
    upperCeil.position.set(0, ceilY + 0.1, -68.5);
    this.group.add(upperCeil);

    // 2. Central Landing Floor & Walkway (connecting top of stairs to front balcony hall)
    const landingGeo = new THREE.BoxGeometry(5.8, 0.2, 10.0);
    const landing = new THREE.Mesh(landingGeo, this.upperWoodFloorMat);
    landing.position.set(0, floorY - 0.1, -64.0);
    landing.receiveShadow = true;
    this.group.add(landing);

    // Rear landing platform at the top of the stairs
    const topStairPlatformGeo = new THREE.BoxGeometry(5.8, 0.2, 3.2);
    const topPlatform = new THREE.Mesh(topStairPlatformGeo, this.upperWoodFloorMat);
    topPlatform.position.set(0, floorY - 0.1, -76.8);
    topPlatform.receiveShadow = true;
    this.group.add(topPlatform);

    // Left and Right walkways flanking the stairwell opening
    const walkLGeo = new THREE.BoxGeometry(1.6, 0.2, 6.0);
    const walkL = new THREE.Mesh(walkLGeo, this.upperWoodFloorMat);
    walkL.position.set(-2.1, floorY - 0.1, -72.0);
    this.group.add(walkL);

    const walkR = new THREE.Mesh(walkLGeo, this.upperWoodFloorMat);
    walkR.position.set(2.1, floorY - 0.1, -72.0);
    this.group.add(walkR);

    // Second Floor Left Room Floor (Entire left wing: 9.5m x 19.5m)
    const lRoomFloorGeo = new THREE.BoxGeometry(9.5, 0.2, 19.5);
    const lFloor = new THREE.Mesh(lRoomFloorGeo, this.upperWoodFloorMat);
    lFloor.position.set(-7.75, floorY - 0.1, -68.7);
    lFloor.receiveShadow = true;
    this.group.add(lFloor);

    // Second Floor Right Room Floor (Entire right wing: 9.5m x 19.5m)
    const rRoomFloorGeo = new THREE.BoxGeometry(9.5, 0.2, 19.5);
    const rFloor = new THREE.Mesh(rRoomFloorGeo, this.upperWoodFloorMat);
    rFloor.position.set(7.75, floorY - 0.1, -68.7);
    rFloor.receiveShadow = true;
    this.group.add(rFloor);

    // 3. Second Floor Exterior Walls
    this.createWall(new THREE.Vector3(0, (floorY + ceilY) / 2, -78.5), new THREE.Vector3(25.0, wallH, 0.3), this.wallpaperMat);
    this.createWall(new THREE.Vector3(-12.5, (floorY + ceilY) / 2, -68.5), new THREE.Vector3(0.3, wallH, 20.0), this.bedroomWallMat);
    this.createWall(new THREE.Vector3(12.5, (floorY + ceilY) / 2, -68.5), new THREE.Vector3(0.3, wallH, 20.0), this.bedroomWallMat);
    this.createWall(new THREE.Vector3(0, (floorY + ceilY) / 2, -58.95), new THREE.Vector3(25.0, wallH, 0.3), this.wallpaperMat);

    // 4. Central Hall Dividing Walls
    // Left Wall separating Left Large Bedroom from Hallway (x = -3.0)
    // Segment 1: front
    this.createWall(new THREE.Vector3(-3.0, (floorY + ceilY) / 2, -61.5), new THREE.Vector3(0.25, wallH, 5.0), this.bedroomWallMat);
    // Doorway into Left Large Bedroom (z = -65.5, width 1.6m, height 2.6m)
    this.createWall(new THREE.Vector3(-3.0, ceilY - 0.6, -65.5), new THREE.Vector3(0.25, 1.2, 1.6), this.bedroomWallMat, false);
    this.createDoorFrame(new THREE.Vector3(-3.0, floorY + 1.3, -65.5), 1.5, 2.6, true);
    // Segment 2: middle & back
    this.createWall(new THREE.Vector3(-3.0, (floorY + ceilY) / 2, -72.5), new THREE.Vector3(0.25, wallH, 12.0), this.bedroomWallMat);

    // Right Wall separating Right Large Room from Hallway (x = 3.0)
    // Segment 1: front
    this.createWall(new THREE.Vector3(3.0, (floorY + ceilY) / 2, -61.5), new THREE.Vector3(0.25, wallH, 5.0), this.bedroomWallMat);
    // Doorway into Right Large Room (z = -65.5, width 1.6m, height 2.6m)
    this.createWall(new THREE.Vector3(3.0, ceilY - 0.6, -65.5), new THREE.Vector3(0.25, 1.2, 1.6), this.bedroomWallMat, false);
    this.createDoorFrame(new THREE.Vector3(3.0, floorY + 1.3, -65.5), 1.5, 2.6, true);
    // Segment 2: middle & back
    this.createWall(new THREE.Vector3(3.0, (floorY + ceilY) / 2, -72.5), new THREE.Vector3(0.25, wallH, 12.0), this.bedroomWallMat);

    // 5. Protective Wooden Balustrade around Staircase Well (z: -68.5 to -75.5)
    this.createBalustrade(new THREE.Vector3(-1.3, floorY + 0.5, -68.5), new THREE.Vector3(1.3, floorY + 0.5, -68.5));
    this.createBalustrade(new THREE.Vector3(-1.3, floorY + 0.5, -68.5), new THREE.Vector3(-1.3, floorY + 0.5, -75.5));
    this.createBalustrade(new THREE.Vector3(1.3, floorY + 0.5, -68.5), new THREE.Vector3(1.3, floorY + 0.5, -75.5));

    // 6. FURNISHINGS & DETAILS FOR SECOND FLOOR
    this.populateSecondFloorLeft_MasterBedroom(floorY);
    this.populateSecondFloorRight_YaminiRoom(floorY);
  }

  /**
   * Second Floor Left: Large Master Family Bedroom
   */
  private populateSecondFloorLeft_MasterBedroom(floorY: number): void {
    const rx = -7.5;
    const rz = -68.5;

    // Grand Four-Poster Mahogany Bed against west wall
    const bedGeo = new THREE.BoxGeometry(2.4, 0.45, 2.6);
    const bed = new THREE.Mesh(bedGeo, this.oldFabricMat);
    bed.position.set(-10.8, floorY + 0.45, rz);
    this.group.add(bed);
    this.addBoxCollider(bed.position, new THREE.Vector3(2.6, 1.2, 2.8));

    // Four tall bed posts
    const postGeo = new THREE.CylinderGeometry(0.05, 0.05, 2.6, 8);
    const postOffsets: [number, number][] = [[-1.1, -1.2], [1.1, -1.2], [-1.1, 1.2], [1.1, 1.2]];
    for (const [px, pz] of postOffsets) {
      const p = new THREE.Mesh(postGeo, this.darkTeakMat);
      p.position.set(-10.8 + px, floorY + 1.3, rz + pz);
      this.group.add(p);
    }

    // Antique Dressing Table / Vanity Mirror
    const vanityGeo = new THREE.BoxGeometry(0.6, 0.8, 1.6);
    const vanity = new THREE.Mesh(vanityGeo, this.darkTeakMat);
    vanity.position.set(-12.1, floorY + 0.4, -62.5);
    this.group.add(vanity);
    this.addBoxCollider(vanity.position, new THREE.Vector3(0.8, 1.0, 1.8));

    // Oval mirror on vanity
    const mirGeo = new THREE.CircleGeometry(0.45, 16);
    const mir = new THREE.Mesh(mirGeo, this.dustyGlassMat);
    mir.rotation.y = Math.PI / 2;
    mir.position.set(-11.78, floorY + 1.35, -62.5);
    this.group.add(mir);

    // Large carved teak Wardrobe / Armoire against south wall
    const armGeo = new THREE.BoxGeometry(1.8, 2.8, 0.7);
    const arm = new THREE.Mesh(armGeo, this.darkTeakMat);
    arm.position.set(-7.5, floorY + 1.4, -59.5);
    this.group.add(arm);
    this.addBoxCollider(arm.position, new THREE.Vector3(2.0, 2.9, 0.9));

    // Large worn Persian carpet
    const carpetGeo = new THREE.BoxGeometry(5.0, 0.02, 6.0);
    const carpet = new THREE.Mesh(carpetGeo, this.wornCarpetMat);
    carpet.position.set(rx, floorY + 0.01, rz);
    this.group.add(carpet);
  }

  /**
   * Second Floor Right: Yamini's Abandoned Room (Key Story Room)
   */
  private populateSecondFloorRight_YaminiRoom(floorY: number): void {
    const rx = 7.5;
    const rz = -68.5;

    // Small abandoned wrought-iron single bed with tangled covers
    const sBedGeo = new THREE.BoxGeometry(1.4, 0.4, 2.2);
    const sBed = new THREE.Mesh(sBedGeo, this.oldFabricMat);
    sBed.position.set(11.2, floorY + 0.35, -74.5);
    this.group.add(sBed);
    this.addBoxCollider(sBed.position, new THREE.Vector3(1.6, 0.9, 2.4));

    // Creepy wooden rocking chair near the window facing into the room
    const chairSeatGeo = new THREE.BoxGeometry(0.65, 0.06, 0.6);
    const cSeat = new THREE.Mesh(chairSeatGeo, this.darkTeakMat);
    cSeat.position.set(6.8, floorY + 0.48, -62.5);
    cSeat.rotation.y = -0.45;
    this.group.add(cSeat);
    this.addBoxCollider(new THREE.Vector3(6.8, floorY + 0.5, -62.5), new THREE.Vector3(1.0, 1.2, 1.0));

    // Curved wooden rockers on the floor
    const rockerGeo = new THREE.TorusGeometry(0.75, 0.03, 6, 16, Math.PI / 3);
    const rocker = new THREE.Mesh(rockerGeo, this.darkTeakMat);
    rocker.rotation.x = Math.PI / 2;
    rocker.rotation.y = -0.45;
    rocker.position.set(6.8, floorY + 0.08, -62.5);
    this.group.add(rocker);

    // Small bedside nightstand with brass music box and oil candle
    const standGeo = new THREE.BoxGeometry(0.55, 0.65, 0.55);
    const stand = new THREE.Mesh(standGeo, this.darkTeakMat);
    stand.position.set(11.8, floorY + 0.325, -72.0);
    this.group.add(stand);
    this.addBoxCollider(stand.position, new THREE.Vector3(0.7, 0.8, 0.7));

    // Brass Music Box on nightstand
    const mboxGeo = new THREE.BoxGeometry(0.2, 0.12, 0.15);
    const mbox = new THREE.Mesh(mboxGeo, this.brassMat);
    mbox.position.set(11.8, floorY + 0.71, -72.0);
    this.group.add(mbox);

    // Old Broken Doll on the floor near the rocking chair
    const dollGeo = new THREE.BoxGeometry(0.22, 0.45, 0.14);
    const dollMat = new THREE.MeshStandardMaterial({ color: 0x887766, roughness: 0.85 });
    const doll = new THREE.Mesh(dollGeo, dollMat);
    doll.position.set(7.5, floorY + 0.08, -63.2);
    doll.rotation.z = 1.35;
    this.group.add(doll);

    // Torn Diary with loose aged pages on a study table
    const dDeskGeo = new THREE.BoxGeometry(1.6, 0.08, 0.9);
    const dDesk = new THREE.Mesh(dDeskGeo, this.darkTeakMat);
    dDesk.position.set(11.4, floorY + 0.75, -67.5);
    this.group.add(dDesk);
    this.addBoxCollider(dDesk.position, new THREE.Vector3(1.8, 1.0, 1.1));

    // Diary book
    const diaryGeo = new THREE.BoxGeometry(0.35, 0.04, 0.45);
    const diary = new THREE.Mesh(diaryGeo, this.paperMat);
    diary.position.set(11.4, floorY + 0.81, -67.5);
    diary.rotation.y = 0.2;
    this.group.add(diary);
  }

  /**
   * Atmospheric Interior Lighting:
   * Carefully tuned weak tungsten lights, wall sconces, subtle flickering lamps,
   * and soft blue moonlight fill entering through windows to completely prevent crushed blacks.
   */
  private buildAtmosphericLighting(): void {
    // 1. Soft interior ambient fill light (prevents pure pitch-black shadows)
    const interiorAmbient = new THREE.AmbientLight(0x28231e, 0.65);
    this.group.add(interiorAmbient);

    // 2. Central Entrance Hallway Chandelier (Weak warm tungsten, y = 4.8)
    const hallChandelier = new THREE.PointLight(0xffb866, 1.8, 14.0, 1.8);
    hallChandelier.position.set(0, 4.4, -63.0);
    this.group.add(hallChandelier);
    this.flickeringLamps.push(hallChandelier);

    // Chandelier hanging fixture
    this.createHangingLampFixture(new THREE.Vector3(0, 4.4, -63.0), 5.45);

    // 3. Staircase & Landing Illumination (y = 5.8)
    const stairLamp = new THREE.PointLight(0xf5a242, 1.5, 12.0, 1.8);
    stairLamp.position.set(0, 5.8, -72.0);
    this.group.add(stairLamp);
    this.flickeringLamps.push(stairLamp);
    this.createHangingLampFixture(new THREE.Vector3(0, 5.8, -72.0), 9.25);

    // 4. Ground Floor Rooms Warm Sconces
    // Left Room 1 (Living Room)
    const lr1Lamp = new THREE.PointLight(0xeda358, 1.4, 9.5, 2.0);
    lr1Lamp.position.set(-7.5, 3.4, -63.5);
    this.group.add(lr1Lamp);

    // Left Room 2 (Study)
    const lr2Lamp = new THREE.PointLight(0xe8994a, 1.4, 9.5, 2.0);
    lr2Lamp.position.set(-7.5, 3.4, -73.0);
    this.group.add(lr2Lamp);

    // Right Room 1 (Dining Room)
    const rr1Lamp = new THREE.PointLight(0xeda358, 1.4, 9.5, 2.0);
    rr1Lamp.position.set(7.5, 3.4, -63.5);
    this.group.add(rr1Lamp);

    // Right Room 2 (Storage)
    const rr2Lamp = new THREE.PointLight(0xd99043, 1.1, 8.5, 2.0);
    rr2Lamp.position.set(7.5, 3.4, -73.0);
    this.group.add(rr2Lamp);

    // 5. Second Floor Rooms Illumination
    // Left Master Bedroom (Soft warm moonlight + weak bedside lamp)
    const ubLeftLamp = new THREE.PointLight(0xe0a568, 1.4, 12.0, 1.8);
    ubLeftLamp.position.set(-7.5, 7.2, -68.5);
    this.group.add(ubLeftLamp);

    // Right Yamini Bedroom (Pale eerie amber glow)
    const ubRightLamp = new THREE.PointLight(0xf59a45, 1.6, 12.0, 1.8);
    ubRightLamp.position.set(7.5, 7.2, -68.5);
    this.group.add(ubRightLamp);
    this.flickeringLamps.push(ubRightLamp);

    // 6. Soft Cold Moonlight shafts entering through high colonial windows
    const moonSplayLeft = new THREE.DirectionalLight(0x405872, 0.45);
    moonSplayLeft.position.set(-16.0, 8.0, -68.5);
    moonSplayLeft.target.position.set(0, 3.0, -68.5);
    this.group.add(moonSplayLeft);
    this.group.add(moonSplayLeft.target);

    const moonSplayRight = new THREE.DirectionalLight(0x405872, 0.45);
    moonSplayRight.position.set(16.0, 8.0, -68.5);
    moonSplayRight.target.position.set(0, 3.0, -68.5);
    this.group.add(moonSplayRight);
    this.group.add(moonSplayRight.target);
  }

  /**
   * Environmental Story Clues about Yamini
   */
  private setupStoryClues(): void {
    this.interiorClues = [
      {
        id: 'CLUE_LIVING_ROOM_PORTRAIT',
        name: 'The Devil Family Portrait (1924)',
        room: 'Ground Floor — Living Room',
        position: new THREE.Vector3(-11.5, 2.8, -63.5),
        description: 'An old framed portrait of the wealthy family. Yamini stands in the center wearing a silver locket, her eyes scratched out with violent needle marks.',
        subtext: 'A dark smear stains the corner of the frame: "She never left the house."',
      },
      {
        id: 'CLUE_STUDY_LETTER',
        name: "Doctor's Handwritten Note",
        room: 'Ground Floor — Study & Library',
        position: new THREE.Vector3(-7.5, 2.2, -73.0),
        description: 'Faded parchment dated November 14, 1948: "The fits are worsening. Yamini claims someone whispers to her from inside the walls at 3 AM."',
        subtext: '"We have barred the doors... God forgive us."',
      },
      {
        id: 'CLUE_DINING_CLOCK',
        name: 'Stopped Grandfather Clock',
        room: 'Ground Floor — Dining Room',
        position: new THREE.Vector3(11.8, 2.6, -59.5),
        description: 'The pendulum hangs motionless. The hands are permanently frozen at 3:17.',
        subtext: 'Deep scratch marks line the glass pendulum casing from within.',
      },
      {
        id: 'CLUE_STORAGE_LOG',
        name: 'Estate Inventory Ledger',
        room: 'Ground Floor — Utility Storage',
        position: new THREE.Vector3(7.5, 2.1, -73.0),
        description: 'Water-damaged household ledger listing the family possessions before the sudden evacuation in the winter of 1952.',
        subtext: 'Final entry scribbled hurriedly: "Leave everything. Do not look into the mirrors."',
      },
      {
        id: 'CLUE_UPPER_BEDROOM_DIARY',
        name: "Yamini's Torn Diary",
        room: "Second Floor — Yamini's Bedroom",
        position: new THREE.Vector3(11.4, 6.2, -67.5),
        description: 'A delicate leather-bound diary with scorched edges. The final page reads: "The footsteps came up the stairs tonight... it is not my mother."',
        subtext: 'A pressed withered white oleander flower is taped between the pages.',
      },
      {
        id: 'CLUE_UPPER_ROCKING_CHAIR',
        name: 'The Rocking Chair',
        room: "Second Floor — Yamini's Bedroom",
        position: new THREE.Vector3(6.8, 6.0, -62.5),
        description: 'An old carved teak rocking chair facing toward the center of the dark room. The wood is worn smooth at the armrests.',
        subtext: 'The chair continues to sway ever so faintly with the chill draft.',
      },
    ];
  }

  // =========================================================================
  // HELPER MESH GENERATORS
  // =========================================================================

  private createWall(pos: THREE.Vector3, size: THREE.Vector3, mat: THREE.Material, addCollider = true): THREE.Mesh {
    const geo = new THREE.BoxGeometry(size.x, size.y, size.z);
    const wall = new THREE.Mesh(geo, mat);
    wall.position.copy(pos);
    wall.castShadow = true;
    wall.receiveShadow = true;
    this.group.add(wall);

    if (addCollider) {
      this.addBoxCollider(pos, size);
    }
    return wall;
  }

  private createDoorFrame(pos: THREE.Vector3, width: number, height: number, openAjar: boolean): void {
    // Outer wooden frame
    const frameMat = this.darkTeakMat;
    const postGeo = new THREE.BoxGeometry(0.12, height, 0.28);
    const postL = new THREE.Mesh(postGeo, frameMat);
    postL.position.set(pos.x, pos.y, pos.z - width / 2);
    this.group.add(postL);

    const postR = new THREE.Mesh(postGeo, frameMat);
    postR.position.set(pos.x, pos.y, pos.z + width / 2);
    this.group.add(postR);

    const topGeo = new THREE.BoxGeometry(0.12, 0.12, width);
    const top = new THREE.Mesh(topGeo, frameMat);
    top.position.set(pos.x, pos.y + height / 2, pos.z);
    this.group.add(top);

    // Weathered wooden door wing swung slightly ajar
    const doorGeo = new THREE.BoxGeometry(0.06, height - 0.08, width - 0.12);
    const door = new THREE.Mesh(doorGeo, frameMat);
    if (openAjar) {
      door.rotation.y = 0.55;
      door.position.set(pos.x + 0.35, pos.y, pos.z - 0.2);
    } else {
      door.position.copy(pos);
    }
    this.group.add(door);
  }

  private createBalustrade(p1: THREE.Vector3, p2: THREE.Vector3): void {
    const len = p1.distanceTo(p2);
    const dir = new THREE.Vector3().subVectors(p2, p1).normalize();
    const mid = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);

    // Top Handrail
    const railGeo = new THREE.BoxGeometry(0.08, 0.08, len);
    const rail = new THREE.Mesh(railGeo, this.darkTeakMat);
    rail.position.set(mid.x, mid.y + 0.45, mid.z);
    if (Math.abs(dir.x) > 0.5) rail.rotation.y = Math.PI / 2;
    this.group.add(rail);

    // Bottom Rail
    const bRail = new THREE.Mesh(railGeo, this.darkTeakMat);
    bRail.position.set(mid.x, mid.y - 0.45, mid.z);
    if (Math.abs(dir.x) > 0.5) bRail.rotation.y = Math.PI / 2;
    this.group.add(bRail);

    // Vertical spindles
    const spinCount = Math.floor(len / 0.35);
    const spinGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.88);
    for (let i = 0; i <= spinCount; i++) {
      const sp = new THREE.Mesh(spinGeo, this.darkTeakMat);
      const frac = spinCount > 0 ? i / spinCount : 0.5;
      sp.position.lerpVectors(p1, p2, frac);
      this.group.add(sp);
    }

    // Balustrade safety box collider
    const colSize = Math.abs(dir.x) > 0.5 ? new THREE.Vector3(len, 1.1, 0.25) : new THREE.Vector3(0.25, 1.1, len);
    this.addBoxCollider(mid, colSize);
  }

  private createArmchair(pos: THREE.Vector3, rotY: number): void {
    const chairGroup = new THREE.Group();
    chairGroup.position.copy(pos);
    chairGroup.rotation.y = rotY;

    // Cushion
    const seatGeo = new THREE.BoxGeometry(0.85, 0.35, 0.85);
    const seat = new THREE.Mesh(seatGeo, this.oldFabricMat);
    seat.position.y = 0.35;
    chairGroup.add(seat);

    // High Backrest
    const backGeo = new THREE.BoxGeometry(0.85, 0.95, 0.18);
    const back = new THREE.Mesh(backGeo, this.oldFabricMat);
    back.position.set(0, 0.85, -0.38);
    chairGroup.add(back);

    // Armrests
    const armGeo = new THREE.BoxGeometry(0.16, 0.35, 0.85);
    const armL = new THREE.Mesh(armGeo, this.darkTeakMat);
    armL.position.set(-0.46, 0.55, 0);
    chairGroup.add(armL);
    const armR = new THREE.Mesh(armGeo, this.darkTeakMat);
    armR.position.set(0.46, 0.55, 0);
    chairGroup.add(armR);

    this.group.add(chairGroup);
    this.addBoxCollider(new THREE.Vector3(pos.x, pos.y + 0.6, pos.z), new THREE.Vector3(1.1, 1.2, 1.1));
  }

  private createChair(pos: THREE.Vector3, rotY: number): void {
    const chair = new THREE.Group();
    chair.position.copy(pos);
    chair.rotation.y = rotY;

    // Seat
    const sGeo = new THREE.BoxGeometry(0.5, 0.05, 0.5);
    const s = new THREE.Mesh(sGeo, this.darkTeakMat);
    s.position.y = 0.45;
    chair.add(s);

    // Back
    const bGeo = new THREE.BoxGeometry(0.5, 0.55, 0.04);
    const b = new THREE.Mesh(bGeo, this.darkTeakMat);
    b.position.set(0, 0.72, -0.23);
    chair.add(b);

    // Legs
    const lGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.45);
    const offsets: [number, number][] = [[-0.2, -0.2], [0.2, -0.2], [-0.2, 0.2], [0.2, 0.2]];
    for (const [lx, lz] of offsets) {
      const leg = new THREE.Mesh(lGeo, this.darkTeakMat);
      leg.position.set(lx, 0.225, lz);
      chair.add(leg);
    }

    this.group.add(chair);
  }

  private createBookshelf(pos: THREE.Vector3, width: number, height: number, depth: number, facingX: boolean): void {
    const bsGeo = new THREE.BoxGeometry(facingX ? depth : width, height, facingX ? width : depth);
    const bs = new THREE.Mesh(bsGeo, this.darkTeakMat);
    bs.position.copy(pos);
    bs.castShadow = true;
    bs.receiveShadow = true;
    this.group.add(bs);

    // Stacked book blocks across shelves
    const bookColors = [0x5c2b29, 0x2d4334, 0x47392a, 0x1f2e3d];
    const shelfCount = 4;
    for (let s = 0; s < shelfCount; s++) {
      const shelfY = pos.y - height / 2 + 0.4 + s * (height / shelfCount);
      const bGeo = new THREE.BoxGeometry(
        facingX ? depth * 0.7 : width * 0.85,
        height / shelfCount * 0.65,
        facingX ? width * 0.85 : depth * 0.7
      );
      const bMat = new THREE.MeshStandardMaterial({
        color: bookColors[s % bookColors.length],
        roughness: 0.9,
      });
      const books = new THREE.Mesh(bGeo, bMat);
      books.position.set(
        pos.x + (facingX ? (Math.random() - 0.5) * 0.05 : 0),
        shelfY,
        pos.z + (!facingX ? (Math.random() - 0.5) * 0.05 : 0)
      );
      this.group.add(books);
    }

    this.addBoxCollider(pos, new THREE.Vector3(facingX ? depth + 0.2 : width + 0.2, height, facingX ? width + 0.2 : depth + 0.2));
  }

  private createPainting(pos: THREE.Vector3, size: THREE.Vector2, title: string, ornateFrame = true): void {
    const fMat = ornateFrame ? this.brassMat : this.darkTeakMat;
    const frameGeo = new THREE.BoxGeometry(size.x + 0.2, size.y + 0.2, 0.05);
    const frame = new THREE.Mesh(frameGeo, fMat);
    frame.position.copy(pos);
    this.group.add(frame);

    const canMat = new THREE.MeshStandardMaterial({ color: 0x3d352b, roughness: 0.8 });
    const canGeo = new THREE.BoxGeometry(size.x, size.y, 0.06);
    const canvas = new THREE.Mesh(canGeo, canMat);
    canvas.position.copy(pos);
    this.group.add(canvas);
  }

  private createHangingLampFixture(pos: THREE.Vector3, ceilingY: number): void {
    const chainH = ceilingY - pos.y;
    const chainGeo = new THREE.CylinderGeometry(0.015, 0.015, chainH, 6);
    const chain = new THREE.Mesh(chainGeo, this.brassMat);
    chain.position.set(pos.x, pos.y + chainH / 2, pos.z);
    this.group.add(chain);

    // Lamp cage / bowl
    const bowlGeo = new THREE.SphereGeometry(0.24, 8, 8);
    const bowl = new THREE.Mesh(bowlGeo, this.brassMat);
    bowl.position.copy(pos);
    this.group.add(bowl);
  }

  private addBoxCollider(center: THREE.Vector3, size: THREE.Vector3): void {
    const box = new THREE.Box3();
    box.setFromCenterAndSize(center, size);
    this.colliders.push(box);
  }

  /**
   * Updates subtle environmental horror ambience inside the house
   */
  public update(delta: number, playerPos: THREE.Vector3): void {
    // 1. Subtle realistic light flickering on selected lamps
    for (let i = 0; i < this.flickeringLamps.length; i++) {
      const lamp = this.flickeringLamps[i];
      if (Math.random() < 0.015) {
        lamp.intensity = THREE.MathUtils.lerp(lamp.intensity, 0.8 + Math.random() * 1.2, 0.4);
      }
    }

    // 2. Environmental psychological audio cues inside bungalow
    // Only triggers if player is actually inside the house (z <= -58.5)
    if (playerPos.z <= -58.5) {
      this.ambienceTimer += delta;
      if (this.ambienceTimer >= this.nextAmbienceSoundTime) {
        this.ambienceTimer = 0;
        this.nextAmbienceSoundTime = 16.0 + Math.random() * 18.0;

        const pick = Math.random();
        if (pick < 0.3) {
          horrorAudio.playWallCreak(Math.random() > 0.5 ? 0.6 : -0.6);
        } else if (pick < 0.55) {
          horrorAudio.playPassageWindGust();
        } else if (pick < 0.8) {
          horrorAudio.playTreeBranchSnap(Math.random() > 0.5 ? 0.7 : -0.7);
        } else {
          horrorAudio.playSubtleWhisper('BEHIND');
        }
      }
    }
  }
}
