import * as THREE from 'three';
import { horrorAudio } from '../../audio/HorrorAudioManager';

export interface BatEntity {
  group: THREE.Group;
  leftWing: THREE.Group;
  rightWing: THREE.Group;
  startPos: THREE.Vector3;
  targetDir: THREE.Vector3;
  speed: number;
  flapFreq: number;
  phaseOffset: number;
  swayAmp: number;
}

/**
 * BatSwarm:
 * Triggers a short, cinematic, realistic bat scare when the main gate opens.
 * 6 dark, silhouetted bats fly rapidly from inside the bungalow entrance,
 * swooping down the haunted pathway past the player and dispersing into the dark night sky.
 * Once the flight completes, all bat meshes are completely removed and disposed.
 */
export class BatSwarm {
  private scene: THREE.Scene;
  private bats: BatEntity[] = [];
  private rootGroup: THREE.Group;
  private isTriggered = false;
  private isFinished = false;
  private elapsed = 0;
  private flightDuration = 2.4;
  private materials: THREE.Material[] = [];
  private geometries: THREE.BufferGeometry[] = [];
  public onCompleted?: () => void;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.rootGroup = new THREE.Group();
    this.rootGroup.name = 'BatSwarmGroup';
    this.buildBats();
  }

  private buildBats(): void {
    // Dark silhouette material for bats under moonlight
    const batMat = new THREE.MeshStandardMaterial({
      color: 0x141416,
      roughness: 0.92,
      metalness: 0.08,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.95,
    });
    this.materials.push(batMat);

    const batCount = 6;
    for (let i = 0; i < batCount; i++) {
      const batGroup = new THREE.Group();

      // 1. Torso / Body
      const bodyGeo = new THREE.BoxGeometry(0.08, 0.05, 0.18);
      this.geometries.push(bodyGeo);
      const body = new THREE.Mesh(bodyGeo, batMat);
      body.castShadow = true;
      batGroup.add(body);

      // Head
      const headGeo = new THREE.ConeGeometry(0.045, 0.08, 5);
      this.geometries.push(headGeo);
      const head = new THREE.Mesh(headGeo, batMat);
      head.rotation.x = -Math.PI / 2;
      head.position.set(0, 0.015, 0.12);
      batGroup.add(head);

      // Small pointed ears
      const earGeo = new THREE.ConeGeometry(0.015, 0.04, 3);
      this.geometries.push(earGeo);
      const earL = new THREE.Mesh(earGeo, batMat);
      earL.position.set(-0.025, 0.045, 0.11);
      earL.rotation.z = -0.2;
      batGroup.add(earL);

      const earR = new THREE.Mesh(earGeo, batMat);
      earR.position.set(0.025, 0.045, 0.11);
      earR.rotation.z = 0.2;
      batGroup.add(earR);

      // 2. Articulated Left Wing
      const leftWingGroup = new THREE.Group();
      leftWingGroup.position.set(-0.04, 0.01, 0);

      // Main wing membrane
      const wingShape = new THREE.Shape();
      wingShape.moveTo(0, 0);
      wingShape.lineTo(-0.24, 0.08);
      wingShape.lineTo(-0.42, 0.02);
      wingShape.lineTo(-0.35, -0.14);
      wingShape.lineTo(-0.18, -0.11);
      wingShape.lineTo(0, -0.06);
      wingShape.closePath();

      const wingGeo = new THREE.ShapeGeometry(wingShape);
      this.geometries.push(wingGeo);
      const wingL = new THREE.Mesh(wingGeo, batMat);
      wingL.rotation.x = -Math.PI / 2;
      leftWingGroup.add(wingL);
      batGroup.add(leftWingGroup);

      // 3. Articulated Right Wing
      const rightWingGroup = new THREE.Group();
      rightWingGroup.position.set(0.04, 0.01, 0);

      const rightWingShape = new THREE.Shape();
      rightWingShape.moveTo(0, 0);
      rightWingShape.lineTo(0.24, 0.08);
      rightWingShape.lineTo(0.42, 0.02);
      rightWingShape.lineTo(0.35, -0.14);
      rightWingShape.lineTo(0.18, -0.11);
      rightWingShape.lineTo(0, -0.06);
      rightWingShape.closePath();

      const rightWingGeo = new THREE.ShapeGeometry(rightWingShape);
      this.geometries.push(rightWingGeo);
      const wingR = new THREE.Mesh(rightWingGeo, batMat);
      wingR.rotation.x = -Math.PI / 2;
      rightWingGroup.add(wingR);
      batGroup.add(rightWingGroup);

      // Initial resting position inside the bungalow doorway (z = -57.5)
      const startX = (Math.random() - 0.5) * 1.4;
      const startY = 2.4 + Math.random() * 0.9;
      const startZ = -57.5 + (Math.random() - 0.5) * 1.2;
      const startPos = new THREE.Vector3(startX, startY, startZ);
      batGroup.position.copy(startPos);
      batGroup.visible = false;

      // Trajectory vector heading forward down the corridor towards z = -10, rising into tree canopy
      const endX = (Math.random() - 0.5) * 7.5;
      const endY = 6.5 + Math.random() * 3.5;
      const endZ = -10.0 + (Math.random() - 0.5) * 4.0;
      const targetDir = new THREE.Vector3(endX - startX, endY - startY, endZ - startZ).normalize();

      this.bats.push({
        group: batGroup,
        leftWing: leftWingGroup,
        rightWing: rightWingGroup,
        startPos,
        targetDir,
        speed: 21.0 + Math.random() * 5.0,
        flapFreq: 32.0 + Math.random() * 6.0,
        phaseOffset: Math.random() * Math.PI * 2,
        swayAmp: 0.35 + Math.random() * 0.3,
      });

      this.rootGroup.add(batGroup);
    }
  }

  /**
   * Triggers the bat scare: plays fluttering/screech audio and initiates rapid flight.
   */
  public trigger(): void {
    if (this.isTriggered) return;
    this.isTriggered = true;
    this.elapsed = 0;

    this.scene.add(this.rootGroup);
    for (const b of this.bats) {
      b.group.visible = true;
    }

    horrorAudio.playBatSwarmFlock();
  }

  public update(delta: number): void {
    if (!this.isTriggered || this.isFinished) return;

    this.elapsed += delta;
    const progress = Math.min(1.0, this.elapsed / this.flightDuration);

    for (let i = 0; i < this.bats.length; i++) {
      const bat = this.bats[i];
      // Fast forward flight along trajectory
      const dist = bat.speed * this.elapsed;
      const currentPos = bat.startPos.clone().addScaledVector(bat.targetDir, dist);

      // Realistic chaotic lateral & vertical flight swoops
      const swayTime = this.elapsed * 4.5 + bat.phaseOffset;
      currentPos.x += Math.sin(swayTime) * bat.swayAmp;
      currentPos.y += Math.cos(swayTime * 0.8) * (bat.swayAmp * 0.5);

      bat.group.position.copy(currentPos);

      // Orient forward in direction of motion with bank angle
      const lookTarget = currentPos.clone().add(bat.targetDir);
      lookTarget.x += Math.cos(swayTime) * 0.4;
      bat.group.lookAt(lookTarget);
      bat.group.rotation.z = Math.cos(swayTime) * 0.35;

      // Realistic rapid wing flapping (~15-18 flaps per second)
      const flapAngle = Math.sin(this.elapsed * bat.flapFreq + bat.phaseOffset) * 0.78;
      bat.leftWing.rotation.z = flapAngle;
      bat.rightWing.rotation.z = -flapAngle;

      // Fade out opacity during last 25% of flight
      if (progress > 0.75) {
        const fade = (1.0 - progress) / 0.25;
        for (const mat of this.materials) {
          (mat as THREE.MeshStandardMaterial).opacity = Math.max(0, 0.95 * fade);
        }
      }
    }

    if (progress >= 1.0) {
      this.dispose();
      this.isFinished = true;
      if (this.onCompleted) {
        this.onCompleted();
      }
    }
  }

  public dispose(): void {
    if (this.rootGroup.parent) {
      this.rootGroup.parent.remove(this.rootGroup);
    }
    for (const b of this.bats) {
      b.group.visible = false;
    }
    for (const geo of this.geometries) {
      geo.dispose();
    }
    for (const mat of this.materials) {
      mat.dispose();
    }
    this.bats = [];
  }
}
