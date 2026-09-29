import * as THREE from 'three';
import { CinematicMaterials } from './CinematicMaterials';

export class CinematicEnvironments {
  // 1. Childhood Rural Veranda & Courtyard
  public static buildChildhoodCourtyard(stage: THREE.Object3D): void {
    const woodMat = CinematicMaterials.wood();
    const stoneMat = CinematicMaterials.stoneWall();

    // Wooden veranda porch deck
    const deckGeo = new THREE.BoxGeometry(10, 0.4, 6);
    const deck = new THREE.Mesh(deckGeo, woodMat);
    deck.position.set(0, -0.2, 0);
    stage.add(deck);

    // Veranda wooden pillars
    const pillarGeo = new THREE.CylinderGeometry(0.12, 0.14, 3.6, 8);
    for (let x = -4.2; x <= 4.2; x += 2.8) {
      const pillar = new THREE.Mesh(pillarGeo, woodMat);
      pillar.position.set(x, 1.6, 2.7);
      stage.add(pillar);
    }

    // Rustic wall behind veranda
    const wallGeo = new THREE.BoxGeometry(10.5, 4, 0.5);
    const wall = new THREE.Mesh(wallGeo, stoneMat);
    wall.position.set(0, 1.8, -2.8);
    stage.add(wall);

    // Warm rural sunlit field in background
    const grassGeo = new THREE.PlaneGeometry(30, 20);
    const grassMat = new THREE.MeshStandardMaterial({ color: 0xd9b35b, roughness: 0.9 }); // Golden wheat tone
    const grass = new THREE.Mesh(grassGeo, grassMat);
    grass.rotation.x = -Math.PI / 2;
    grass.position.set(0, -0.3, 8);
    stage.add(grass);

    // Clay pots
    const potGeo = new THREE.CylinderGeometry(0.22, 0.14, 0.45, 8);
    const potMat = new THREE.MeshStandardMaterial({ color: 0xa8583b, roughness: 0.85 });
    [-3.8, 3.8].forEach((px) => {
      const pot = new THREE.Mesh(potGeo, potMat);
      pot.position.set(px, 0.22, 2.4);
      stage.add(pot);
    });

    // Sunlit Warm Ambient & Directional light
    const sunLight = new THREE.DirectionalLight(0xffeaad, 1.8);
    sunLight.position.set(8, 12, 10);
    stage.add(sunLight);

    const warmFill = new THREE.AmbientLight(0xffd59e, 0.7);
    stage.add(warmFill);
  }

  // 2. Sankar's Responsibility & Evening Home
  public static buildWorkAndHomeEnvironment(stage: THREE.Object3D): void {
    const woodMat = CinematicMaterials.wood();

    // Dark rustic wood plank floor
    const floorGeo = new THREE.PlaneGeometry(12, 12);
    const floor = new THREE.Mesh(floorGeo, woodMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    stage.add(floor);

    // Wooden study table
    const tableTop = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.08, 1.0), woodMat);
    tableTop.position.set(0, 0.8, 0);
    stage.add(tableTop);

    // Table legs
    const legGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.8, 8);
    [
      [-0.8, 0.4, -0.4],
      [0.8, 0.4, -0.4],
      [-0.8, 0.4, 0.4],
      [0.8, 0.4, 0.4],
    ].forEach(([x, y, z]) => {
      const leg = new THREE.Mesh(legGeo, woodMat);
      leg.position.set(x, y, z);
      stage.add(leg);
    });

    // Open books & notebooks
    const bookGeo = new THREE.BoxGeometry(0.35, 0.04, 0.26);
    const bookMat = new THREE.MeshStandardMaterial({ color: 0xf4eedb, roughness: 0.6 });
    const book1 = new THREE.Mesh(bookGeo, bookMat);
    book1.position.set(-0.25, 0.86, 0.05);
    book1.rotation.y = 0.15;
    stage.add(book1);

    // Plate with food
    const plateGeo = new THREE.CylinderGeometry(0.2, 0.15, 0.03, 16);
    const plateMat = new THREE.MeshStandardMaterial({ color: 0xe6e6e6, roughness: 0.3 });
    const plate = new THREE.Mesh(plateGeo, plateMat);
    plate.position.set(0.35, 0.85, 0.1);
    stage.add(plate);

    // Warm brass desk lamp / oil lantern
    const lampBase = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.05, 8), woodMat);
    lampBase.position.set(-0.6, 0.85, -0.25);
    const lampStem = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.35, 8), woodMat);
    lampStem.position.set(-0.6, 1.05, -0.25);
    const lampShade = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.16, 12, 1, true), CinematicMaterials.yaminiSweater());
    lampShade.position.set(-0.6, 1.22, -0.25);
    stage.add(lampBase, lampStem, lampShade);

    // Warm point light radiating from lamp
    const lampLight = new THREE.PointLight(0xffa844, 2.5, 6, 1.5);
    lampLight.position.set(-0.6, 1.25, -0.25);
    stage.add(lampLight);

    const nightAmbient = new THREE.AmbientLight(0x281a14, 0.5);
    stage.add(nightAmbient);
  }

  // 3. Indian College Campus
  public static buildCollegeCampus(stage: THREE.Object3D): void {
    // Green manicured lawn
    const quadGeo = new THREE.PlaneGeometry(36, 36);
    const quadMat = new THREE.MeshStandardMaterial({ color: 0x3e4f32, roughness: 0.88 });
    const lawn = new THREE.Mesh(quadGeo, quadMat);
    lawn.rotation.x = -Math.PI / 2;
    lawn.position.y = 0;
    stage.add(lawn);

    // Paved stone college pathway
    const pathGeo = new THREE.PlaneGeometry(3.5, 36);
    const pathMat = new THREE.MeshStandardMaterial({ color: 0x8a8479, roughness: 0.75 });
    const path = new THREE.Mesh(pathGeo, pathMat);
    path.rotation.x = -Math.PI / 2;
    path.position.set(0, 0.01, 0);
    stage.add(path);

    // Brick college hall building in distance
    const buildingGeo = new THREE.BoxGeometry(26, 9, 6);
    const buildingMat = new THREE.MeshStandardMaterial({ color: 0x824d3b, roughness: 0.85 });
    const building = new THREE.Mesh(buildingGeo, buildingMat);
    building.position.set(0, 4.5, -12);
    stage.add(building);

    // College pillars
    const pillarGeo = new THREE.CylinderGeometry(0.3, 0.35, 6, 8);
    const pillarMat = new THREE.MeshStandardMaterial({ color: 0xd8d4cb, roughness: 0.7 });
    for (let x = -8; x <= 8; x += 4) {
      const p = new THREE.Mesh(pillarGeo, pillarMat);
      p.position.set(x, 3, -8.8);
      stage.add(p);
    }

    // Majestic shade tree
    const trunkGeo = new THREE.CylinderGeometry(0.35, 0.5, 4.5, 8);
    const trunkMat = CinematicMaterials.wood();
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.set(5.5, 2.25, 3);

    const foliageGeo = new THREE.SphereGeometry(3.2, 10, 10);
    const foliageMat = new THREE.MeshStandardMaterial({ color: 0x2b4f24, roughness: 0.8 });
    const foliage = new THREE.Mesh(foliageGeo, foliageMat);
    foliage.position.set(5.5, 5.2, 3);
    stage.add(trunk, foliage);

    // Sunlight
    const daylight = new THREE.DirectionalLight(0xfff6db, 1.6);
    daylight.position.set(10, 15, 8);
    stage.add(daylight);

    const skyLight = new THREE.AmbientLight(0x7da4d4, 0.8);
    stage.add(skyLight);
  }

  // 4. Truth or Dare Gathering Room
  public static buildTruthOrDareRoom(stage: THREE.Object3D): void {
    // Warm polished wooden floorboards
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(12, 12), CinematicMaterials.wood());
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    stage.add(floor);

    // Center hardcover book on which bottle rests
    const book = new THREE.Mesh(
      new THREE.BoxGeometry(0.45, 0.05, 0.35),
      new THREE.MeshStandardMaterial({ color: 0x4a2a22, roughness: 0.6 })
    );
    book.position.set(0, 0.025, 0);
    stage.add(book);

    // Glass bottle (Truth or Dare spinner)
    const bottleGroup = new THREE.Group();
    bottleGroup.name = 'SPINNING_BOTTLE';
    bottleGroup.position.set(0, 0.07, 0);

    const bottleBody = new THREE.Mesh(
      new THREE.CylinderGeometry(0.045, 0.045, 0.22, 12),
      CinematicMaterials.glassBottle()
    );
    bottleBody.rotation.z = Math.PI / 2;

    const bottleNeck = new THREE.Mesh(
      new THREE.CylinderGeometry(0.018, 0.025, 0.12, 8),
      CinematicMaterials.glassBottle()
    );
    bottleNeck.position.set(0.16, 0, 0);
    bottleNeck.rotation.z = Math.PI / 2;

    bottleGroup.add(bottleBody, bottleNeck);
    stage.add(bottleGroup);

    // Circular overhead warm lighting focused on the game circle
    const centerSpot = new THREE.SpotLight(0xffcf78, 3.5, 10, Math.PI / 4, 0.3);
    centerSpot.position.set(0, 4.5, 0);
    centerSpot.target = bottleGroup;
    stage.add(centerSpot);

    const dimAmb = new THREE.AmbientLight(0x221a14, 0.6);
    stage.add(dimAmb);
  }

  // 5. Abandoned Haunted Approach & Devil's Bungalow
  public static buildHauntedApproach(stage: THREE.Object3D): void {
    // Wet asphalt road
    const road = new THREE.Mesh(new THREE.PlaneGeometry(14, 85), CinematicMaterials.wetGround());
    road.rotation.x = -Math.PI / 2;
    road.position.set(0, 0, -25);
    stage.add(road);

    // Twisted barren dead trees lining the path
    const treeGeo = new THREE.CylinderGeometry(0.2, 0.45, 8.5, 6);
    const treeMat = new THREE.MeshStandardMaterial({ color: 0x141210, roughness: 0.95 });

    [-5.5, 5.5].forEach((sideX) => {
      for (let z = 5; z >= -65; z -= 11) {
        const tree = new THREE.Mesh(treeGeo, treeMat);
        tree.position.set(sideX + (Math.sin(z) * 0.8), 4.2, z);
        tree.rotation.z = (Math.random() - 0.5) * 0.25;
        tree.rotation.x = (Math.random() - 0.5) * 0.2;
        stage.add(tree);
      }
    });

    // Wrought iron gate
    const gateColGeo = new THREE.BoxGeometry(1.2, 5.5, 1.2);
    const gateColMat = CinematicMaterials.stoneWall();
    const colL = new THREE.Mesh(gateColGeo, gateColMat);
    colL.position.set(-3.2, 2.7, -42);
    const colR = new THREE.Mesh(gateColGeo, gateColMat);
    colR.position.set(3.2, 2.7, -42);
    stage.add(colL, colR);

    // Abandoned House Silhouette in the misty background
    const mansionBody = new THREE.Mesh(
      new THREE.BoxGeometry(22, 14, 18),
      new THREE.MeshStandardMaterial({ color: 0x101318, roughness: 0.92 })
    );
    mansionBody.position.set(0, 7, -68);

    const roofGeo = new THREE.ConeGeometry(16, 7, 4);
    roofGeo.rotateY(Math.PI / 4);
    const roof = new THREE.Mesh(roofGeo, new THREE.MeshStandardMaterial({ color: 0x08090b, roughness: 0.9 }));
    roof.position.set(0, 17.5, -68);
    stage.add(mansionBody, roof);

    // Cold blue eerie moonlight
    const moon = new THREE.DirectionalLight(0x406085, 1.4);
    moon.position.set(-15, 25, 5);
    stage.add(moon);

    const coldFogAmb = new THREE.AmbientLight(0x182433, 0.7);
    stage.add(coldFogAmb);
  }

  // 6. Decaying Mansion Foyer (Yamini's Disappearance)
  public static buildMansionFoyer(stage: THREE.Object3D): void {
    // Wet decayed flagstone floor
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(12, 26), CinematicMaterials.stoneWall());
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, 0, -5);
    stage.add(floor);

    // Decayed walls
    const wallMat = CinematicMaterials.stoneWall();
    const wallL = new THREE.Mesh(new THREE.BoxGeometry(0.5, 9, 26), wallMat);
    wallL.position.set(-5.5, 4.5, -5);
    const wallR = new THREE.Mesh(new THREE.BoxGeometry(0.5, 9, 26), wallMat);
    wallR.position.set(5.5, 4.5, -5);
    stage.add(wallL, wallR);

    // Massive Front Double Doors
    const doorGroup = new THREE.Group();
    doorGroup.name = 'DOUBLE_DOORS';
    doorGroup.position.set(0, 3.2, 5.8);

    const doorLeafGeo = new THREE.BoxGeometry(1.8, 6.4, 0.2);
    const doorMat = CinematicMaterials.darkWood();

    const doorL = new THREE.Mesh(doorLeafGeo, doorMat);
    doorL.name = 'DOOR_LEFT';
    doorL.position.set(-0.9, 0, 0);

    const doorR = new THREE.Mesh(doorLeafGeo, doorMat);
    doorR.name = 'DOOR_RIGHT';
    doorR.position.set(0.9, 0, 0);

    doorGroup.add(doorL, doorR);
    stage.add(doorGroup);

    // Glowing dropped smartphone on floor
    const phoneGeo = new THREE.BoxGeometry(0.12, 0.02, 0.22);
    const phoneMat = new THREE.MeshStandardMaterial({
      color: 0x111111,
      emissive: 0x5599ff,
      emissiveIntensity: 1.8,
    });
    const droppedPhone = new THREE.Mesh(phoneGeo, phoneMat);
    droppedPhone.name = 'DROPPED_PHONE';
    droppedPhone.position.set(0.35, 0.01, -1.5);
    droppedPhone.rotation.y = 0.45;
    stage.add(droppedPhone);

    const phoneLight = new THREE.PointLight(0x55aaff, 1.8, 3.5, 2);
    phoneLight.position.set(0.35, 0.25, -1.5);
    stage.add(phoneLight);

    // Cold moonlight through cracked transom
    const moonShaft = new THREE.SpotLight(0x3a5477, 2.5, 18, Math.PI / 6, 0.4);
    moonShaft.position.set(0, 7.5, 7);
    moonShaft.target = droppedPhone;
    stage.add(moonShaft);

    const darkAmb = new THREE.AmbientLight(0x0a1018, 0.4);
    stage.add(darkAmb);
  }

  // 7. Sankar's Dining Table - Morning Realization
  public static buildMorningDiningTable(stage: THREE.Object3D): void {
    const woodMat = CinematicMaterials.darkWood();

    // Floor
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(12, 12), CinematicMaterials.wood());
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    stage.add(floor);

    // Dining table
    const tableTop = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.08, 1.2), woodMat);
    tableTop.position.set(0, 0.8, 0);
    stage.add(tableTop);

    // 4 legs
    const legGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.8, 8);
    [
      [-1.0, 0.4, -0.45],
      [1.0, 0.4, -0.45],
      [-1.0, 0.4, 0.45],
      [1.0, 0.4, 0.45],
    ].forEach(([x, y, z]) => {
      const leg = new THREE.Mesh(legGeo, woodMat);
      leg.position.set(x, y, z);
      stage.add(leg);
    });

    // Vintage mechanical alarm clock
    const clockBody = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.08, 0.06, 16),
      new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.8, roughness: 0.3 })
    );
    clockBody.position.set(0.65, 0.88, 0);
    clockBody.rotation.x = Math.PI / 2;
    stage.add(clockBody);

    // Untouched breakfast plate
    const plate = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.14, 0.02, 16),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 })
    );
    plate.position.set(-0.4, 0.85, 0.1);
    stage.add(plate);

    // Smartphone showing failed call
    const phone = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, 0.015, 0.18),
      new THREE.MeshStandardMaterial({ color: 0x111111, emissive: 0xcc2222, emissiveIntensity: 1.2 })
    );
    phone.position.set(0.15, 0.85, 0.12);
    phone.rotation.y = 0.2;
    stage.add(phone);

    // Morning overcast window light
    const windowLight = new THREE.DirectionalLight(0xb4c5d9, 1.8);
    windowLight.position.set(-6, 5, 4);
    stage.add(windowLight);

    const roomAmb = new THREE.AmbientLight(0x384452, 0.6);
    stage.add(roomAmb);
  }
}
