import { GatePhase, GateState } from '../../../shared/types';

export class GateSystem {
  private phase: GatePhase = 'GATE_CLOSED';
  private hits: number = 0;
  private isUnlocked: boolean = false;
  private isOpening: boolean = false;
  private isFullyOpen: boolean = false;

  public getPhase(): GatePhase {
    return this.phase;
  }

  public getGateState(distanceToGate: number): GateState {
    return {
      distanceToGate,
      canInspect: distanceToGate <= 4.0,
      isInspecting: false,
      creakIntensity: Math.max(0, 1 - distanceToGate / 10),
      message: this.isFullyOpen
        ? 'The gate stands wide open.'
        : this.isUnlocked
        ? 'The chain is broken. Push the gate.'
        : 'The iron gate is bound by a heavy rusted chain.',
    };
  }

  public registerHit(): GatePhase {
    this.hits++;
    if (this.hits === 1) this.phase = 'HIT_1';
    else if (this.hits === 2) this.phase = 'HIT_2';
    else if (this.hits >= 3) {
      this.phase = 'UNLOCKING';
      this.isUnlocked = true;
    }
    return this.phase;
  }

  public startOpening(): void {
    this.isOpening = true;
    this.phase = 'OPENING';
  }

  public setFullyOpen(): void {
    this.isOpening = false;
    this.isFullyOpen = true;
    this.phase = 'GATE_OPEN';
  }

  public isGateOpen(): boolean {
    return this.isFullyOpen;
  }
}
