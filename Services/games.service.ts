import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { TutorialService } from './tutorial.service';
import { GameTutorialService } from './game-tutorial.service';
import { getSlotMachineTutorialSteps, checkSlotMachineCompletion } from './tutorials/slot-machine-tutorial';
import { getSlotMachineSettings } from './settings/slot-machine-settings';

export interface NavItem {
  label: string;
  route: string;
  icon?: string;
  category?: 'game' | 'general';
}

export interface GameSettings {
  id: string;
  label: string;
  description: string;
  type: 'toggle' | 'text' | 'number' | 'select';
  value?: any;
  options?: Array<{ label: string; value: any }>;
  group?: string;
}

export interface Game {
  id: string;
  name: string;
  description: string;
  route: string;
  icon: string;
  lastPlayed?: Date;
  playCount: number;
  navigationItems?: NavItem[];
  gameSettings?: GameSettings[];
}

@Injectable({
  providedIn: 'root'
})
export class GamesService {
  private games: Game[] = [
    {
      id: 'slot-machine',
      name: 'Prize Machine',
      description: 'A customizable slot machine game with prizes, odds, and Arduino integration',
      route: '/slotmachine',
      icon: '🎰',
      playCount: 0,
      navigationItems: [
        { label: 'Play', route: '/slotmachine', icon: '🎮', category: 'game' },
        { label: 'Edit Items', route: '/edit-items', icon: '🎨', category: 'game' },
        { label: 'Edit Odds', route: '/edit-odds', icon: '📊', category: 'game' },
        { label: 'Edit Prizes', route: '/edit-prizes', icon: '🏆', category: 'game' }
      ],
      gameSettings: getSlotMachineSettings()
    },
    {
      id: 'test-game',
      name: 'Test Game',
      description: 'A test game for demonstrating license-based game access control',
      route: '/test-game',
      icon: '🎮',
      playCount: 0,
      navigationItems: [
        { label: 'Play', route: '/test-game', icon: '🎮', category: 'game' }
      ]
    }
  ];

  private gamesSubject = new BehaviorSubject<Game[]>(this.games);
  public games$ = this.gamesSubject.asObservable();
  
  private currentGameSubject = new BehaviorSubject<Game | null>(null);
  public currentGame$ = this.currentGameSubject.asObservable();

  constructor(
    private tutorialService: TutorialService,
    private gameTutorialService: GameTutorialService
  ) {
    this.loadGameStats();
    this.registerGameTutorials();
    this.loadGameSettings();
  }

  /**
   * Register tutorials for all games
   */
  private registerGameTutorials(): void {
    // Register slot machine tutorial
    this.tutorialService.registerTutorial('slot-machine', getSlotMachineTutorialSteps);
    this.gameTutorialService.registerCompletionChecker('slot-machine', checkSlotMachineCompletion);
  }

  /**
   * Load saved game settings from localStorage
   */
  private loadGameSettings(): void {
    this.games.forEach(game => {
      if (game.gameSettings) {
        const savedSettings = this.getGameSettingsFromStorage(game.id);
        if (savedSettings) {
          // Merge saved settings with defaults
          game.gameSettings = game.gameSettings.map(setting => ({
            ...setting,
            value: savedSettings[setting.id] !== undefined ? savedSettings[setting.id] : setting.value
          }));
        }
      }
    });
    this.gamesSubject.next([...this.games]);
  }

  /**
   * Get game settings from localStorage
   */
  private getGameSettingsFromStorage(gameId: string): Record<string, any> | null {
    try {
      const key = `game_settings_${gameId}`;
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error(`Error loading settings for game ${gameId}:`, error);
      return null;
    }
  }

  /**
   * Save game settings to localStorage
   */
  saveGameSettings(gameId: string, settingId: string, value: any): void {
    const game = this.games.find(g => g.id === gameId);
    if (!game || !game.gameSettings) return;

    // Update the setting value in memory
    const setting = game.gameSettings.find(s => s.id === settingId);
    if (setting) {
      setting.value = value;
    }

    // Save all settings for this game to localStorage
    const key = `game_settings_${gameId}`;
    const settingsToSave: Record<string, any> = {};
    game.gameSettings.forEach(s => {
      settingsToSave[s.id] = s.value;
    });

    try {
      localStorage.setItem(key, JSON.stringify(settingsToSave));
      this.gamesSubject.next([...this.games]);
    } catch (error) {
      console.error(`Error saving settings for game ${gameId}:`, error);
    }
  }

  /**
   * Get a specific setting value for a game
   */
  getGameSetting(gameId: string, settingId: string): any {
    const game = this.games.find(g => g.id === gameId);
    if (!game || !game.gameSettings) return undefined;

    const setting = game.gameSettings.find(s => s.id === settingId);
    return setting?.value;
  }

  getGames(): Game[] {
    return [...this.games];
  }

  getGames$(): Observable<Game[]> {
    return this.games$;
  }

  getGame(id: string): Game | undefined {
    return this.games.find(game => game.id === id);
  }

  setCurrentGame(game: Game | null): void {
    this.currentGameSubject.next(game);
  }

  getCurrentGame(): Game | null {
    return this.currentGameSubject.value;
  }

  recordGamePlayed(gameId: string): void {
    const game = this.games.find(g => g.id === gameId);
    if (game) {
      game.lastPlayed = new Date();
      this.saveGameStats();
      this.gamesSubject.next([...this.games]);
    }
  }

  private loadGameStats(): void {
    const statsJson = localStorage.getItem('game-stats');
    if (statsJson) {
      try {
        const stats = JSON.parse(statsJson);
        this.games.forEach(game => {
          const savedStats = stats[game.id];
          if (savedStats) {
            game.playCount = savedStats.playCount || 0;
            game.lastPlayed = savedStats.lastPlayed ? new Date(savedStats.lastPlayed) : undefined;
          }
        });
        this.gamesSubject.next([...this.games]);
      } catch (error) {
        console.error('Error loading game stats:', error);
      }
    }
  }

  private saveGameStats(): void {
    const stats: Record<string, { playCount: number; lastPlayed?: string }> = {};
    this.games.forEach(game => {
      stats[game.id] = {
        playCount: game.playCount,
        lastPlayed: game.lastPlayed?.toISOString()
      };
    });
    localStorage.setItem('game-stats', JSON.stringify(stats));
  }

  getGameByRoute(route: string): Game | undefined {
    let game = this.games.find(g => route.startsWith(g.route));
    
    if (!game) {
      game = this.games.find(g => 
        g.navigationItems?.some(item => item.route === route || route.startsWith(item.route))
      );
    }
    
    return game;
  }

  getNavigationItems(gameId: string): NavItem[] {
    const game = this.games.find(g => g.id === gameId);
    return game?.navigationItems || [];
  }
}