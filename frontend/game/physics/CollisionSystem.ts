import * as THREE from 'three';

export interface BoxCollider {
  min: THREE.Vector3;
  max: THREE.Vector3;
}

export class CollisionSystem {
  private colliders: BoxCollider[] = [];

  public addCollider(min: THREE.Vector3, max: THREE.Vector3): void {
    this.colliders.push({ min, max });
  }

  public checkCollision(pos: THREE.Vector3, radius = 0.5): boolean {
    for (const c of this.colliders) {
      if (
        pos.x + radius >= c.min.x &&
        pos.x - radius <= c.max.x &&
        pos.z + radius >= c.min.z &&
        pos.z - radius <= c.max.z
      ) {
        return true;
      }
    }
    return false;
  }
}
