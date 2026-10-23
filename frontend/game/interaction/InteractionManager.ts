import * as THREE from 'three';
import { InteractionPrompt, InteractionType } from '../../../shared/types';

export interface RegisteredInteractable {
  id: string;
  name: string;
  type: InteractionType;
  position: THREE.Vector3;
  mesh?: THREE.Object3D | null;
  ignoreCollider?: THREE.Box3 | THREE.Box3[];
  radius?: number; // Maximum detection distance (defaults to 3.2m)
  priority?: number; // Higher number = higher evaluation priority (defaults to 10)
  promptText: string | (() => string);
  subText?: string | (() => string);
  isUnlocked?: () => boolean;
  onInteract?: () => void;
}

export interface InteractionDebugInfo {
  currentTarget: string | null;
  targetType: string | null;
  distance: number;
  isUnlocked: boolean;
  raycastHit: boolean;
  angleDot: number;
  lastKeyEvent: string;
}

export class InteractionManager {
  private interactables: Map<string, RegisteredInteractable> = new Map();
  private activeTarget: RegisteredInteractable | null = null;
  private activePrompt: InteractionPrompt | null = null;
  private raycaster = new THREE.Raycaster();
  private tempCamPos = new THREE.Vector3();
  private tempCamDir = new THREE.Vector3();
  private tempToItem = new THREE.Vector3();
  private tempRay = new THREE.Ray();
  private tempSphere = new THREE.Sphere();

  // Debug state tracking
  public debugInfo: InteractionDebugInfo = {
    currentTarget: null,
    targetType: null,
    distance: 0,
    isUnlocked: false,
    raycastHit: false,
    angleDot: 0,
    lastKeyEvent: 'none',
  };

  /**
   * Register an interactable item or world object.
   */
  public register(item: RegisteredInteractable): void {
    this.interactables.set(item.id, item);
  }

  /**
   * Remove a registered interactable (e.g. after collection).
   */
  public unregister(id: string): void {
    if (this.activeTarget?.id === id) {
      this.activeTarget = null;
      this.activePrompt = null;
    }
    this.interactables.delete(id);
  }

  /**
   * Clear all registered interactables.
   */
  public clear(): void {
    this.interactables.clear();
    this.activeTarget = null;
    this.activePrompt = null;
  }

  /**
   * Get interactable by ID.
   */
  public get(id: string): RegisteredInteractable | undefined {
    return this.interactables.get(id);
  }

  /**
   * Manually override active prompt (for legacy compatibility).
   */
  public setPrompt(prompt: InteractionPrompt | null): void {
    this.activePrompt = prompt;
  }

  /**
   * Get current prompt for HUD rendering.
   */
  public getPrompt(): InteractionPrompt | null {
    return this.activePrompt;
  }

  /**
   * Get currently detected interactable target.
   */
  public getCurrentTarget(): RegisteredInteractable | null {
    return this.activeTarget;
  }

  /**
   * Clear current prompt and target.
   */
  public clearPrompt(): void {
    this.activeTarget = null;
    this.activePrompt = null;
  }

  /**
   * Check if specific interaction type prompt is active.
   */
  public isPromptActive(type: InteractionType): boolean {
    return this.activePrompt?.type === type;
  }

  /**
   * Record debug key events.
   */
  public recordKeyEvent(info: string): void {
    this.debugInfo.lastKeyEvent = `${info} @ ${performance.now().toFixed(0)}ms`;
  }

  /**
   * Performs real-time raycasting and distance detection against all registered items.
   * Checks:
   * 1. Item is unlocked & visible
   * 2. Player is within interaction distance
   * 3. Player is looking toward the item (angle dot & raycast)
   * 4. Line-of-sight is not blocked by solid room walls
   * 5. Strict priority sorting (e.g. puzzle items = priority 100)
   */
  public update(
    camera: THREE.PerspectiveCamera,
    playerPosition: THREE.Vector3,
    colliders: THREE.Box3[] = []
  ): RegisteredInteractable | null {
    camera.getWorldPosition(this.tempCamPos);
    camera.getWorldDirection(this.tempCamDir);

    this.raycaster.set(this.tempCamPos, this.tempCamDir);
    this.raycaster.far = 6.0;

    let bestCandidate: {
      item: RegisteredInteractable;
      dist: number;
      dot: number;
      rayHit: boolean;
      priority: number;
    } | null = null;

    for (const item of this.interactables.values()) {
      // 1. Check unlock condition
      const unlocked = item.isUnlocked ? item.isUnlocked() : true;
      if (!unlocked) continue;

      // 2. Distance check (use 3D distance to item)
      const maxRange = item.radius ?? 3.2;
      const dist = this.tempCamPos.distanceTo(item.position);
      const playerDist = playerPosition.distanceTo(item.position);

      // Must be within range of camera or player feet
      if (dist > maxRange && playerDist > maxRange) {
        continue;
      }

      // 3. Direction and angle check (using true camera world position)
      this.tempToItem.subVectors(item.position, this.tempCamPos).normalize();
      const dot = this.tempCamDir.dot(this.tempToItem);

      // 4. Raycast test against item mesh or bounding sphere
      let rayHit = false;
      if (item.mesh) {
        const intersects = this.raycaster.intersectObject(item.mesh, true);
        if (intersects.length > 0 && intersects[0].distance <= maxRange + 0.5) {
          rayHit = true;
        }
      }

      // Raycast test against item bounding sphere (radius ~0.45m around item position)
      if (!rayHit) {
        this.tempSphere.set(item.position, 0.45);
        this.tempRay.set(this.tempCamPos, this.tempCamDir);
        if (this.tempRay.intersectsSphere(this.tempSphere)) {
          rayHit = true;
        }
      }

      // Proximity & looking alignment requirements:
      // - If ray directly hits item/sphere: valid up to maxRange
      // - If close (< 1.6m): valid if player is facing general direction (dot > 0.15)
      // - If medium (1.6m - 3.2m): valid if looking toward item (dot > 0.45 or rayHit)
      const isFacing = rayHit || (dist <= 1.6 && dot > 0.15) || (dist <= maxRange && dot > 0.45);

      if (!isFacing) {
        continue;
      }

      // 5. Line-of-sight wall occlusion check:
      // Ensure no solid wall collider cuts between camera and the item
      let occluded = false;
      if (colliders.length > 0 && dist > 0.8) {
        this.tempRay.set(this.tempCamPos, this.tempToItem);
        const hitPoint = new THREE.Vector3();
        for (const box of colliders) {
          // Skip if this collider is the interactable's own ignored collider
          if (item.ignoreCollider) {
            if (Array.isArray(item.ignoreCollider)) {
              if (item.ignoreCollider.includes(box)) continue;
            } else if (box === item.ignoreCollider) {
              continue;
            }
          }

          // Skip small furniture colliders, check wall/door bounding boxes
          const boxSize = new THREE.Vector3();
          box.getSize(boxSize);
          if (boxSize.y >= 2.0 && (boxSize.x >= 1.5 || boxSize.z >= 1.5)) {
            if (this.tempRay.intersectBox(box, hitPoint)) {
              const hitDist = this.tempCamPos.distanceTo(hitPoint);
              // If wall hit is between camera and item (with small margin)
              if (hitDist > 0.35 && hitDist < dist - 0.4) {
                occluded = true;
                break;
              }
            }
          }
        }
      }

      if (occluded) continue;

      const priority = item.priority ?? 10;

      // Evaluation: Higher priority wins. Among same priority, highest alignment/closest distance
      if (
        !bestCandidate ||
        priority > bestCandidate.priority ||
        (priority === bestCandidate.priority && (rayHit || dot > bestCandidate.dot || dist < bestCandidate.dist))
      ) {
        bestCandidate = {
          item,
          dist,
          dot,
          rayHit,
          priority,
        };
      }
    }

    if (bestCandidate) {
      this.activeTarget = bestCandidate.item;
      const promptText = typeof bestCandidate.item.promptText === 'function'
        ? bestCandidate.item.promptText()
        : bestCandidate.item.promptText;
      const subText = typeof bestCandidate.item.subText === 'function'
        ? bestCandidate.item.subText()
        : bestCandidate.item.subText;

      this.activePrompt = {
        type: bestCandidate.item.type,
        promptText,
        subText,
        distance: bestCandidate.dist,
        puzzleItemId: bestCandidate.item.type === 'PUZZLE_ITEM_PICKUP' ? (bestCandidate.item.id as any) : undefined,
      };

      this.debugInfo = {
        currentTarget: bestCandidate.item.name,
        targetType: bestCandidate.item.type,
        distance: Number(bestCandidate.dist.toFixed(2)),
        isUnlocked: true,
        raycastHit: bestCandidate.rayHit,
        angleDot: Number(bestCandidate.dot.toFixed(2)),
        lastKeyEvent: this.debugInfo.lastKeyEvent,
      };

      return bestCandidate.item;
    }

    // Nothing detected in range/view: Clear prompt
    this.activeTarget = null;
    this.activePrompt = null;
    this.debugInfo.currentTarget = null;
    this.debugInfo.targetType = null;
    this.debugInfo.distance = 0;
    this.debugInfo.raycastHit = false;
    this.debugInfo.angleDot = 0;

    return null;
  }
}
