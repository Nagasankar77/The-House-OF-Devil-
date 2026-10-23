import { RitualState } from '../../../shared/types';

export class LampRitualSystem {
  private state: {
    lamp1Lit: boolean;
    lamp2Lit: boolean;
    lamp3Revealed: boolean;
    lamp3Lit: boolean;
    ritualComplete: boolean;
  } = {
    lamp1Lit: false,
    lamp2Lit: false,
    lamp3Revealed: false,
    lamp3Lit: false,
    ritualComplete: false,
  };

  public canLightLamp1(): boolean {
    return !this.state.lamp1Lit;
  }

  public canLightLamp2(): boolean {
    return !this.state.lamp2Lit;
  }

  public canLightLamp3(): boolean {
    return this.state.lamp3Revealed && !this.state.lamp3Lit;
  }

  public lightLamp1(): boolean {
    if (this.state.lamp1Lit) return false;
    this.state.lamp1Lit = true;
    this.checkCompletion();
    return true;
  }

  public lightLamp2(): boolean {
    if (this.state.lamp2Lit) return false;
    this.state.lamp2Lit = true;
    this.checkCompletion();
    return true;
  }

  public revealLamp3(): void {
    this.state.lamp3Revealed = true;
  }

  public lightLamp3(): boolean {
    if (!this.state.lamp3Revealed || this.state.lamp3Lit) return false;
    this.state.lamp3Lit = true;
    this.checkCompletion();
    return true;
  }

  private checkCompletion(): void {
    if (this.state.lamp1Lit && this.state.lamp2Lit && !this.state.lamp3Revealed) {
      this.state.lamp3Revealed = true;
    }
    if (this.state.lamp1Lit && this.state.lamp2Lit && this.state.lamp3Lit) {
      this.state.ritualComplete = true;
    }
  }

  public isRitualComplete(): boolean {
    return this.state.ritualComplete;
  }

  public syncFromRitualState(ritual: RitualState): void {
    this.state.lamp1Lit = ritual.lamp1Lit;
    this.state.lamp2Lit = ritual.lamp2Lit;
    this.state.lamp3Revealed = ritual.lamp3Revealed;
    this.state.lamp3Lit = ritual.lamp3Lit;
    this.state.ritualComplete = Boolean(ritual.ritualComplete);
  }
}
