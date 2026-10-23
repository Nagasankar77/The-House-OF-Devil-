import * as THREE from 'three';

export class LightingManager {
  private moonlight: THREE.DirectionalLight | null = null;
  private bungalowWindowLight: THREE.PointLight | null = null;
  private ambientLight: THREE.AmbientLight | null = null;

  public setMoonlight(light: THREE.DirectionalLight): void {
    this.moonlight = light;
  }

  public setBungalowWindowLight(light: THREE.PointLight): void {
    this.bungalowWindowLight = light;
  }

  public setAmbientLight(light: THREE.AmbientLight): void {
    this.ambientLight = light;
  }

  public updateFlicker(time: number): void {
    if (this.bungalowWindowLight) {
      const flicker = 0.8 + 0.2 * Math.sin(time * 12.0) * Math.cos(time * 7.5);
      this.bungalowWindowLight.intensity = Math.max(0.2, flicker);
    }
  }
}
