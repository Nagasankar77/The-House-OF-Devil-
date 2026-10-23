import * as THREE from 'three';

export interface CameraShakeConfig {
  intensity: number;
  decay: number;
  duration: number;
}

export class CameraController {
  private camera: THREE.PerspectiveCamera;
  private shakeOffset = new THREE.Vector3();
  private shakeIntensity = 0;
  private shakeDecay = 0.95;

  constructor(camera: THREE.PerspectiveCamera) {
    this.camera = camera;
  }

  public triggerShake(intensity = 0.15, decay = 0.92): void {
    this.shakeIntensity = intensity;
    this.shakeDecay = decay;
  }

  public update(delta: number): void {
    if (this.shakeIntensity > 0.001) {
      this.shakeOffset.set(
        (Math.random() - 0.5) * this.shakeIntensity,
        (Math.random() - 0.5) * this.shakeIntensity,
        (Math.random() - 0.5) * this.shakeIntensity
      );
      this.shakeIntensity *= Math.pow(this.shakeDecay, delta * 60);
      this.camera.position.add(this.shakeOffset);
    }
  }

  public getCamera(): THREE.PerspectiveCamera {
    return this.camera;
  }
}
