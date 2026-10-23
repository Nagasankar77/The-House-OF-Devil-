import { PostStoryHorrorScareDirector } from './PostStoryHorrorScareDirector';
import { GhostEntityFactory, DistortedGhostRig } from '../../game/effects/GhostEntity';

export class GhostSystem {
  private activeScare: boolean = false;

  public triggerHorrorEvent(): void {
    this.activeScare = true;
  }

  public isScareActive(): boolean {
    return this.activeScare;
  }
}

export * from './PostStoryHorrorScareDirector';
export { GhostEntityFactory };
export type { DistortedGhostRig };
