import * as THREE from 'three';
import { PuzzleItemType } from '../../../shared/types';

/**
 * Procedural Realistic 3D Item Factory for the 5 Lost Objects:
 * 1. DIARY: An old, aged diary with worn pages and embossed leather binding.
 * 2. WATCH: An old wristwatch with detailed face, glass crystal, and leather strap.
 * 3. PINK FLOWER: A realistic pink flower with visible petals, sepals, and curved stem.
 * 4. BAG: An old, weathered personal leather satchel bag with brass buckles and handle.
 * 5. SPECTACLES: A realistic pair of spectacles with wire frames and translucent lenses.
 */
export class PuzzleItemsFactory {
  /**
   * Builds the Aged Diary 3D Mesh
   */
  public static createDiaryMesh(): THREE.Group {
    const group = new THREE.Group();
    group.name = 'PuzzleItem_DIARY';

    // 1. Leather Book Cover Materials
    const coverMat = new THREE.MeshStandardMaterial({
      color: 0x3d2417, // Aged deep leather
      roughness: 0.68,
      metalness: 0.12,
    });

    const goldTrimMat = new THREE.MeshStandardMaterial({
      color: 0xc89e42,
      roughness: 0.35,
      metalness: 0.75,
    });

    const pageMat = new THREE.MeshStandardMaterial({
      color: 0xdfd4bc, // Yellowed, aged parchment pages
      roughness: 0.90,
      metalness: 0.02,
    });

    const ribbonMat = new THREE.MeshStandardMaterial({
      color: 0x721418, // Classic deep maroon velvet ribbon
      roughness: 0.55,
      metalness: 0.10,
    });

    // 2. Thick Parchment Paper Block
    const blockWidth = 0.24;
    const blockHeight = 0.042;
    const blockDepth = 0.32;
    const paperBlock = new THREE.Mesh(
      new THREE.BoxGeometry(blockWidth, blockHeight, blockDepth),
      pageMat
    );
    paperBlock.position.set(0, blockHeight / 2, 0);
    paperBlock.castShadow = true;
    paperBlock.receiveShadow = true;
    group.add(paperBlock);

    // 3. Bottom Cover
    const coverThickness = 0.005;
    const bottomCover = new THREE.Mesh(
      new THREE.BoxGeometry(blockWidth + 0.012, coverThickness, blockDepth + 0.016),
      coverMat
    );
    bottomCover.position.set(0.002, coverThickness / 2, 0);
    bottomCover.castShadow = true;
    group.add(bottomCover);

    // 4. Top Cover (slightly angled as if partially unsealed)
    const topCover = new THREE.Mesh(
      new THREE.BoxGeometry(blockWidth + 0.012, coverThickness, blockDepth + 0.016),
      coverMat
    );
    topCover.position.set(0.002, blockHeight + coverThickness / 2, 0);
    topCover.castShadow = true;
    group.add(topCover);

    // 5. Rounded Spine along left edge
    const spine = new THREE.Mesh(
      new THREE.CylinderGeometry(blockHeight / 2 + 0.004, blockHeight / 2 + 0.004, blockDepth + 0.016, 12, 1, false, 0, Math.PI),
      coverMat
    );
    spine.rotation.x = Math.PI / 2;
    spine.rotation.z = Math.PI / 2;
    spine.position.set(-blockWidth / 2 - 0.004, blockHeight / 2, 0);
    spine.castShadow = true;
    group.add(spine);

    // 6. Gold Embossed Corner Protectors
    const cornerGeo = new THREE.BoxGeometry(0.035, 0.006, 0.035);
    const c1 = new THREE.Mesh(cornerGeo, goldTrimMat);
    c1.position.set(blockWidth / 2 - 0.012, blockHeight + coverThickness, blockDepth / 2 - 0.012);
    group.add(c1);

    const c2 = new THREE.Mesh(cornerGeo, goldTrimMat);
    c2.position.set(blockWidth / 2 - 0.012, blockHeight + coverThickness, -blockDepth / 2 + 0.012);
    group.add(c2);

    // 7. Ribbon Bookmark trailing from between the pages
    const ribbonCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.02, blockHeight * 0.6, -blockDepth / 2),
      new THREE.Vector3(0.04, blockHeight * 0.4, -blockDepth / 2 - 0.03),
      new THREE.Vector3(0.08, 0.008, -blockDepth / 2 - 0.07),
      new THREE.Vector3(0.12, 0.002, -blockDepth / 2 - 0.10),
    ]);
    const ribbonGeo = new THREE.TubeGeometry(ribbonCurve, 12, 0.006, 6, false);
    const ribbonMesh = new THREE.Mesh(ribbonGeo, ribbonMat);
    group.add(ribbonMesh);

    // 8. Subtle Procedural Cover Plate / Script Decal
    const labelCanvas = document.createElement('canvas');
    labelCanvas.width = 256;
    labelCanvas.height = 256;
    const lctx = labelCanvas.getContext('2d')!;
    lctx.fillStyle = '#2d180f';
    lctx.fillRect(0, 0, 256, 256);
    lctx.strokeStyle = '#c49a45';
    lctx.lineWidth = 4;
    lctx.strokeRect(16, 16, 224, 224);
    lctx.strokeRect(24, 24, 208, 208);
    lctx.fillStyle = '#c49a45';
    lctx.font = 'bold 22px serif';
    lctx.textAlign = 'center';
    lctx.fillText('DIARY', 128, 80);
    lctx.font = 'italic 16px serif';
    lctx.fillText('1924', 128, 120);
    lctx.fillText('— • —', 128, 150);
    lctx.font = '12px serif';
    lctx.fillText('Family Records', 128, 190);

    const labelTex = new THREE.CanvasTexture(labelCanvas);
    const labelMat = new THREE.MeshStandardMaterial({
      map: labelTex,
      roughness: 0.5,
      metalness: 0.2,
    });
    const labelMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 0.12), labelMat);
    labelMesh.rotation.x = -Math.PI / 2;
    labelMesh.position.set(0.01, blockHeight + coverThickness + 0.001, 0);
    group.add(labelMesh);

    return group;
  }

  /**
   * Builds the Old Wristwatch 3D Mesh
   */
  public static createWatchMesh(): THREE.Group {
    const group = new THREE.Group();
    group.name = 'PuzzleItem_WATCH';

    const goldCaseMat = new THREE.MeshStandardMaterial({
      color: 0xc89b3c, // Tarnished vintage gold
      roughness: 0.32,
      metalness: 0.85,
    });

    const strapMat = new THREE.MeshStandardMaterial({
      color: 0x24150d, // Dark weathered stitched leather
      roughness: 0.72,
      metalness: 0.10,
    });

    const glassMat = new THREE.MeshStandardMaterial({
      color: 0xe6edf5,
      roughness: 0.10,
      metalness: 0.15,
      transparent: true,
      opacity: 0.55,
    });

    // 1. Circular Watch Case
    const caseRadius = 0.052;
    const caseHeight = 0.018;
    const caseMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(caseRadius, caseRadius, caseHeight, 24),
      goldCaseMat
    );
    caseMesh.position.set(0, caseHeight / 2, 0);
    caseMesh.castShadow = true;
    group.add(caseMesh);

    // Bezel ring
    const bezel = new THREE.Mesh(
      new THREE.TorusGeometry(caseRadius * 0.95, 0.005, 8, 24),
      goldCaseMat
    );
    bezel.rotation.x = Math.PI / 2;
    bezel.position.set(0, caseHeight, 0);
    group.add(bezel);

    // 2. Watch Face Canvas Texture (Roman numerals, ticking hands)
    const dialCanvas = document.createElement('canvas');
    dialCanvas.width = 256;
    dialCanvas.height = 256;
    const dctx = dialCanvas.getContext('2d')!;
    dctx.fillStyle = '#ede6d4'; // Aged enamel off-white
    dctx.beginPath();
    dctx.arc(128, 128, 120, 0, Math.PI * 2);
    dctx.fill();

    // Minute track and hour ticks
    dctx.strokeStyle = '#2a221b';
    dctx.lineWidth = 3;
    dctx.stroke();

    dctx.fillStyle = '#1c1510';
    dctx.font = 'bold 22px serif';
    dctx.textAlign = 'center';
    dctx.textBaseline = 'middle';
    const numerals = ['XII', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];
    for (let i = 0; i < 12; i++) {
      const angle = (i * Math.PI) / 6 - Math.PI / 2;
      const nx = 128 + Math.cos(angle) * 88;
      const ny = 128 + Math.sin(angle) * 88;
      dctx.fillText(numerals[i], nx, ny);
    }

    // Hands stopped at 3:17
    dctx.strokeStyle = '#1a1008';
    dctx.lineWidth = 4;
    dctx.beginPath();
    dctx.moveTo(128, 128);
    dctx.lineTo(128 + Math.cos(0.2) * 55, 128 + Math.sin(0.2) * 55); // Hour hand
    dctx.stroke();

    dctx.lineWidth = 2.5;
    dctx.beginPath();
    dctx.moveTo(128, 128);
    dctx.lineTo(128 + Math.cos(1.2) * 80, 128 + Math.sin(1.2) * 80); // Minute hand
    dctx.stroke();

    // Center pin
    dctx.fillStyle = '#b88628';
    dctx.beginPath();
    dctx.arc(128, 128, 6, 0, Math.PI * 2);
    dctx.fill();

    const dialTex = new THREE.CanvasTexture(dialCanvas);
    const dialMesh = new THREE.Mesh(
      new THREE.CircleGeometry(caseRadius * 0.88, 24),
      new THREE.MeshStandardMaterial({ map: dialTex, roughness: 0.6 })
    );
    dialMesh.rotation.x = -Math.PI / 2;
    dialMesh.position.set(0, caseHeight + 0.001, 0);
    group.add(dialMesh);

    // 3. Glass Crystal
    const glass = new THREE.Mesh(
      new THREE.CylinderGeometry(caseRadius * 0.88, caseRadius * 0.88, 0.004, 24),
      glassMat
    );
    glass.position.set(0, caseHeight + 0.003, 0);
    group.add(glass);

    // 4. Winding Crown on the side
    const crown = new THREE.Mesh(
      new THREE.CylinderGeometry(0.008, 0.008, 0.012, 10),
      goldCaseMat
    );
    crown.rotation.z = Math.PI / 2;
    crown.position.set(caseRadius + 0.006, caseHeight / 2, 0);
    group.add(crown);

    // 5. Leather Watch Straps (North and South)
    const strapWidth = 0.038;
    const strapLength = 0.12;
    const strapThickness = 0.006;

    // Top strap curving gently
    const strapTop = new THREE.Mesh(
      new THREE.BoxGeometry(strapWidth, strapThickness, strapLength),
      strapMat
    );
    strapTop.position.set(0, strapThickness / 2 + 0.002, -caseRadius - strapLength / 2 + 0.01);
    strapTop.castShadow = true;
    group.add(strapTop);

    // Bottom strap with brass buckle
    const strapBottom = new THREE.Mesh(
      new THREE.BoxGeometry(strapWidth, strapThickness, strapLength),
      strapMat
    );
    strapBottom.position.set(0, strapThickness / 2 + 0.002, caseRadius + strapLength / 2 - 0.01);
    strapBottom.castShadow = true;
    group.add(strapBottom);

    // Buckle
    const buckle = new THREE.Mesh(
      new THREE.BoxGeometry(strapWidth + 0.008, 0.008, 0.014),
      goldCaseMat
    );
    buckle.position.set(0, strapThickness / 2 + 0.003, caseRadius + strapLength - 0.01);
    group.add(buckle);

    return group;
  }

  /**
   * Builds the Realistic Pink Flower 3D Mesh
   */
  public static createPinkFlowerMesh(): THREE.Group {
    const group = new THREE.Group();
    group.name = 'PuzzleItem_PINK_FLOWER';

    const stemMat = new THREE.MeshStandardMaterial({
      color: 0x1f3820, // Dark organic stem green
      roughness: 0.75,
      metalness: 0.05,
    });

    const petalCoreMat = new THREE.MeshStandardMaterial({
      color: 0xd65b82, // Vibrant deep antique rose pink
      roughness: 0.55,
      metalness: 0.04,
      side: THREE.DoubleSide,
    });

    const petalOuterMat = new THREE.MeshStandardMaterial({
      color: 0xeb8da9, // Soft delicate blush pink
      roughness: 0.52,
      metalness: 0.03,
      side: THREE.DoubleSide,
    });

    const leafMat = new THREE.MeshStandardMaterial({
      color: 0x274328,
      roughness: 0.65,
      metalness: 0.05,
      side: THREE.DoubleSide,
    });

    // 1. Curved Natural Stem resting on surface
    const stemCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.16, 0.01, 0.08),
      new THREE.Vector3(-0.08, 0.014, 0.04),
      new THREE.Vector3(0.00, 0.022, 0.00),
      new THREE.Vector3(0.08, 0.038, -0.04),
      new THREE.Vector3(0.14, 0.055, -0.07),
    ]);
    const stemGeo = new THREE.TubeGeometry(stemCurve, 16, 0.005, 8, false);
    const stemMesh = new THREE.Mesh(stemGeo, stemMat);
    stemMesh.castShadow = true;
    group.add(stemMesh);

    // 2. Green Leaves along the stem
    const leafGeo = new THREE.PlaneGeometry(0.065, 0.032);
    const leaf1 = new THREE.Mesh(leafGeo, leafMat);
    leaf1.position.set(-0.06, 0.016, 0.05);
    leaf1.rotation.set(-0.2, 0.6, -0.15);
    leaf1.castShadow = true;
    group.add(leaf1);

    const leaf2 = new THREE.Mesh(leafGeo, leafMat);
    leaf2.position.set(0.03, 0.026, -0.02);
    leaf2.rotation.set(0.3, -0.7, 0.2);
    leaf2.castShadow = true;
    group.add(leaf2);

    // 3. Flower Blossom Center (Receptacle & Calyx)
    const flowerPos = new THREE.Vector3(0.14, 0.055, -0.07);
    const calyx = new THREE.Mesh(
      new THREE.ConeGeometry(0.018, 0.03, 8),
      stemMat
    );
    calyx.position.copy(flowerPos);
    calyx.rotation.z = -Math.PI / 3;
    group.add(calyx);

    // 4. Multi-Layered Rose/Peony Petals
    const flowerHead = new THREE.Group();
    flowerHead.position.copy(flowerPos);
    flowerHead.rotation.set(0.4, 0.6, 0.2);

    // Inner bud center
    const innerBud = new THREE.Mesh(
      new THREE.SphereGeometry(0.024, 12, 10),
      petalCoreMat
    );
    flowerHead.add(innerBud);

    // Petal Layer 1 (Tight inner core, 6 petals)
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI * 2) / 6;
      const petal = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 8, 0, Math.PI, 0, Math.PI * 0.7), petalCoreMat);
      petal.scale.set(0.65, 1.1, 0.35);
      petal.position.set(Math.cos(angle) * 0.015, Math.sin(angle) * 0.015, 0.012);
      petal.rotation.z = angle + Math.PI / 2;
      petal.rotation.x = 0.5;
      flowerHead.add(petal);
    }

    // Petal Layer 2 (Middle cup, 8 petals)
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI * 2) / 8 + 0.3;
      const petal = new THREE.Mesh(new THREE.SphereGeometry(0.038, 8, 8, 0, Math.PI, 0, Math.PI * 0.75), petalOuterMat);
      petal.scale.set(0.85, 1.25, 0.45);
      petal.position.set(Math.cos(angle) * 0.028, Math.sin(angle) * 0.028, 0.008);
      petal.rotation.z = angle + Math.PI / 2;
      petal.rotation.x = 0.85;
      flowerHead.add(petal);
    }

    // Petal Layer 3 (Outer blooming guard petals, 10 petals)
    for (let i = 0; i < 10; i++) {
      const angle = (i * Math.PI * 2) / 10 + 0.15;
      const petal = new THREE.Mesh(new THREE.SphereGeometry(0.052, 8, 8, 0, Math.PI, 0, Math.PI * 0.8), petalOuterMat);
      petal.scale.set(1.0, 1.4, 0.5);
      petal.position.set(Math.cos(angle) * 0.044, Math.sin(angle) * 0.044, 0.002);
      petal.rotation.z = angle + Math.PI / 2;
      petal.rotation.x = 1.25;
      flowerHead.add(petal);
    }

    flowerHead.castShadow = true;
    group.add(flowerHead);

    return group;
  }

  /**
   * Builds the Weathered Personal Bag 3D Mesh
   */
  public static createBagMesh(): THREE.Group {
    const group = new THREE.Group();
    group.name = 'PuzzleItem_BAG';

    const leatherMat = new THREE.MeshStandardMaterial({
      color: 0x362115, // Weathered dark brown leather
      roughness: 0.78,
      metalness: 0.08,
    });

    const buckleMat = new THREE.MeshStandardMaterial({
      color: 0xb58c38, // Antique brass hardware
      roughness: 0.38,
      metalness: 0.80,
    });

    const strapLeatherMat = new THREE.MeshStandardMaterial({
      color: 0x2a170d,
      roughness: 0.82,
      metalness: 0.06,
    });

    // 1. Main Bag Body (Slightly tapered rectangular satchel)
    const bagW = 0.36;
    const bagH = 0.28;
    const bagD = 0.16;
    const mainBody = new THREE.Mesh(
      new THREE.BoxGeometry(bagW, bagH, bagD),
      leatherMat
    );
    mainBody.position.set(0, bagH / 2, 0);
    mainBody.castShadow = true;
    mainBody.receiveShadow = true;
    group.add(mainBody);

    // Rounded bottom edge
    const bottomBevel = new THREE.Mesh(
      new THREE.CylinderGeometry(bagD / 2, bagD / 2, bagW, 12),
      leatherMat
    );
    bottomBevel.rotation.z = Math.PI / 2;
    bottomBevel.position.set(0, bagD / 2, 0);
    group.add(bottomBevel);

    // 2. Front Flap Cover
    const flapGeo = new THREE.BoxGeometry(bagW + 0.015, 0.18, bagD + 0.02);
    const flap = new THREE.Mesh(flapGeo, leatherMat);
    flap.position.set(0, bagH - 0.04, 0.01);
    flap.castShadow = true;
    group.add(flap);

    // 3. Twin Front Buckle Straps
    for (let s = -1; s <= 1; s += 2) {
      const strapX = s * 0.11;
      const vStrap = new THREE.Mesh(
        new THREE.BoxGeometry(0.024, 0.22, 0.012),
        strapLeatherMat
      );
      vStrap.position.set(strapX, bagH * 0.45, bagD / 2 + 0.012);
      vStrap.castShadow = true;
      group.add(vStrap);

      // Brass Buckle
      const buckle = new THREE.Mesh(
        new THREE.BoxGeometry(0.036, 0.038, 0.016),
        buckleMat
      );
      buckle.position.set(strapX, bagH * 0.32, bagD / 2 + 0.016);
      group.add(buckle);
    }

    // 4. Rolled Leather Top Carry Handle
    const handleCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.07, bagH, 0),
      new THREE.Vector3(-0.05, bagH + 0.065, 0),
      new THREE.Vector3(0.00, bagH + 0.075, 0),
      new THREE.Vector3(0.05, bagH + 0.065, 0),
      new THREE.Vector3(0.07, bagH, 0),
    ]);
    const handleGeo = new THREE.TubeGeometry(handleCurve, 12, 0.012, 8, false);
    const handleMesh = new THREE.Mesh(handleGeo, strapLeatherMat);
    handleMesh.castShadow = true;
    group.add(handleMesh);

    // 5. Shoulder Strap draped naturally to the side
    const shoulderCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-bagW / 2, bagH * 0.75, 0),
      new THREE.Vector3(-bagW / 2 - 0.06, bagH * 0.35, 0.06),
      new THREE.Vector3(-bagW / 2 - 0.08, 0.012, 0.10),
      new THREE.Vector3(-bagW / 2 - 0.02, 0.008, 0.16),
    ]);
    const shoulderGeo = new THREE.TubeGeometry(shoulderCurve, 12, 0.015, 6, false);
    const shoulderMesh = new THREE.Mesh(shoulderGeo, strapLeatherMat);
    group.add(shoulderMesh);

    return group;
  }

  /**
   * Builds the Realistic Spectacles 3D Mesh
   */
  public static createSpectaclesMesh(): THREE.Group {
    const group = new THREE.Group();
    group.name = 'PuzzleItem_SPECTACLES';

    const frameMat = new THREE.MeshStandardMaterial({
      color: 0x826431, // Antique horn / brass wire frame
      roughness: 0.38,
      metalness: 0.70,
    });

    const lensMat = new THREE.MeshStandardMaterial({
      color: 0xeef5fc, // Clear glass with subtle cool refraction
      roughness: 0.05,
      metalness: 0.15,
      transparent: true,
      opacity: 0.40,
    });

    const lensRadius = 0.038;
    const lensSpacing = 0.048;

    // 1. Left & Right Lens Rims
    for (let side of [-1, 1]) {
      const cx = side * lensSpacing;

      // Circular Wire Rim
      const rim = new THREE.Mesh(
        new THREE.TorusGeometry(lensRadius, 0.0035, 8, 24),
        frameMat
      );
      rim.rotation.x = Math.PI / 2;
      rim.position.set(cx, 0.008, 0);
      rim.castShadow = true;
      group.add(rim);

      // Glass Lens
      const lens = new THREE.Mesh(
        new THREE.CylinderGeometry(lensRadius * 0.98, lensRadius * 0.98, 0.002, 24),
        lensMat
      );
      lens.position.set(cx, 0.008, 0);
      group.add(lens);
    }

    // 2. Arched Nose Bridge
    const bridgeCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-lensSpacing + lensRadius * 0.95, 0.008, 0),
      new THREE.Vector3(0, 0.016, 0.004),
      new THREE.Vector3(lensSpacing - lensRadius * 0.95, 0.008, 0),
    ]);
    const bridgeMesh = new THREE.Mesh(
      new THREE.TubeGeometry(bridgeCurve, 8, 0.003, 6, false),
      frameMat
    );
    group.add(bridgeMesh);

    // 3. Folded Temple Arms resting backwards along the surface
    const armLength = 0.13;
    for (let side of [-1, 1]) {
      const cx = side * (lensSpacing + lensRadius);

      // Hinge mount
      const hinge = new THREE.Mesh(
        new THREE.SphereGeometry(0.0045, 6, 6),
        frameMat
      );
      hinge.position.set(cx, 0.008, 0);
      group.add(hinge);

      // Folded arm extending diagonally backwards
      const armCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(cx, 0.008, 0),
        new THREE.Vector3(cx * 0.92, 0.008, armLength * 0.65),
        new THREE.Vector3(cx * 0.85, 0.015, armLength), // curved ear hook
      ]);
      const armMesh = new THREE.Mesh(
        new THREE.TubeGeometry(armCurve, 10, 0.0025, 6, false),
        frameMat
      );
      armMesh.castShadow = true;
      group.add(armMesh);
    }

    return group;
  }

  /**
   * Helper to create any of the 5 items by item type
   */
  public static createItemMesh(type: PuzzleItemType): THREE.Group {
    switch (type) {
      case 'DIARY':
        return this.createDiaryMesh();
      case 'WATCH':
        return this.createWatchMesh();
      case 'PINK_FLOWER':
        return this.createPinkFlowerMesh();
      case 'BAG':
        return this.createBagMesh();
      case 'SPECTACLES':
        return this.createSpectaclesMesh();
    }
  }
}
