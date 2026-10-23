import { InGameStoryDirector, StorySubtitleData } from './InGameStoryDirector';

export interface StoryProgressState {
  isTriggered: boolean;
  isActive: boolean;
  isCompleted: boolean;
  currentScene: number;
}

export class StorySystem {
  private progress: StoryProgressState = {
    isTriggered: false,
    isActive: false,
    isCompleted: false,
    currentScene: 0,
  };

  public getProgress(): StoryProgressState {
    return { ...this.progress };
  }

  public setStoryActive(active: boolean): void {
    this.progress.isActive = active;
    if (active) this.progress.isTriggered = true;
  }

  public markStoryCompleted(): void {
    this.progress.isActive = false;
    this.progress.isCompleted = true;
  }
}

export * from './InGameStoryDirector';
