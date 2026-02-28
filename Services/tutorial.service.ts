import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { StorageService } from './storage.service';

export interface TutorialStep {
  title: string;
  content: string;
  action?: string | null;  // Optional - will be auto-generated based on actionType if not provided
  route?: string;  // Route to navigate to
  targetSelector?: string;  // CSS selector for element to highlight
  goalSelector?: string;  // CSS selector for element to wait for action on (if different from targetSelector)
  placement?: 'top' | 'right' | 'bottom' | 'left' | 'center';  // Where to place the tooltip
  waitForAction?: boolean;  // Wait for user to perform action
  actionType?: 'click' | 'navigate' | 'input' | 'hover' | 'scroll' | 'none';  // Type of action expected
}

export type TutorialStepsProvider = () => TutorialStep[];

/**
 * Service to manage the tutorial/onboarding experience
 */
@Injectable({
  providedIn: 'root'
})
export class TutorialService {
  private readonly TUTORIAL_COMPLETED_KEY = 'tutorial_completed';
  
  private tutorialCompletedSubject: BehaviorSubject<boolean>;
  public tutorialCompleted$: Observable<boolean>;

  // Tutorial modal visibility state
  private showModalSubject = new BehaviorSubject<boolean>(false);
  public showModal$ = this.showModalSubject.asObservable();

  // Current tutorial steps (dynamically loaded based on game/context)
  public steps: TutorialStep[] = [];
  
  // Current game ID
  public currentGameId: string | undefined;

  // Tutorial providers for different games/contexts
  private tutorialProviders: Map<string, TutorialStepsProvider> = new Map();

  constructor(private storage: StorageService) {
    const completed = this.storage.getItem<boolean>(this.TUTORIAL_COMPLETED_KEY, false);
    this.tutorialCompletedSubject = new BehaviorSubject<boolean>(completed || false);
    this.tutorialCompleted$ = this.tutorialCompletedSubject.asObservable();
  }

  /**
   * Register a tutorial for a specific game
   */
  registerTutorial(gameId: string, provider: TutorialStepsProvider): void {
    this.tutorialProviders.set(gameId, provider);
  }

  /**
   * Load tutorial steps for a specific game
   */
  loadTutorialForGame(gameId: string): boolean {
    const provider = this.tutorialProviders.get(gameId);
    if (provider) {
      this.steps = provider();
      this.currentGameId = gameId;
      return true;
    }
    this.steps = [];
    this.currentGameId = undefined;
    return false;
  }

  /**
   * Check whether a tutorial exists for the given game ID
   */
  hasTutorialForGame(gameId: string | undefined): boolean {
    if (!gameId) {
      return false;
    }

    return this.tutorialProviders.has(gameId);
  }

  /**
   * Auto-show tutorial if not completed and a tutorial exists for this game.
   * Returns true when modal is shown.
   */
  autoShowForGame(gameId: string | undefined): boolean {
    if (this.isTutorialCompleted() || !gameId) {
      return false;
    }

    const loaded = this.loadTutorialForGame(gameId);
    if (!loaded || this.steps.length === 0) {
      return false;
    }

    this.showTutorialModal();
    return true;
  }

  /**
   * Check if the tutorial has been completed or skipped
   */
  isTutorialCompleted(): boolean {
    return this.tutorialCompletedSubject.value;
  }

  /**
   * Mark the tutorial as completed
   */
  completeTutorial(): void {
    this.storage.setItem(this.TUTORIAL_COMPLETED_KEY, true);
    this.tutorialCompletedSubject.next(true);
  }

  /**
   * Reset the tutorial (allows user to see it again)
   */
  resetTutorial(): void {
    this.storage.setItem(this.TUTORIAL_COMPLETED_KEY, false);
    this.tutorialCompletedSubject.next(false);
  }

  /**
   * Get total number of steps
   */
  getTotalSteps(): number {
    return this.steps.length;
  }

  /**
   * Show the tutorial modal
   */
  showTutorialModal(): void {
    this.showModalSubject.next(true);
  }

  /**
   * Hide the tutorial modal
   */
  hideTutorialModal(): void {
    this.showModalSubject.next(false);
  }
}
