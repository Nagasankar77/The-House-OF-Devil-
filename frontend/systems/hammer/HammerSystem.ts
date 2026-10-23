import { BungalowHammerDirector } from './BungalowHammerDirector';

export interface HammerState {
  isRevealed: boolean;
  isCollected: boolean;
  doorHits: number;
  requiredHits: number;
}

export class HammerSystem {
  private state: HammerState = {
    isRevealed: false,
    isCollected: false,
    doorHits: 0,
    requiredHits: 3,
  };

  public getState(): HammerState {
    return { ...this.state };
  }

  public revealHammer(): void {
    this.state.isRevealed = true;
  }

  public collectHammer(): void {
    this.state.isCollected = true;
  }

  public registerDoorHit(): number {
    this.state.doorHits = Math.min(this.state.requiredHits, this.state.doorHits + 1);
    return this.state.doorHits;
  }

  public isDoorBroken(): boolean {
    return this.state.doorHits >= this.state.requiredHits;
  }
}

export * from './BungalowHammerDirector';
