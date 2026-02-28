import { Component } from '@angular/core';
import { SideBarComponent } from '../../Components/side-bar/side-bar.component'
import { RouterOutlet, Router, NavigationEnd, ActivatedRoute } from "@angular/router";
import { filter, map, merge } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../../Services/theme.service';
import { SettingsService } from '../../Services/settings.service';
import { TutorialService } from '../../Services/tutorial.service';
import { GamesService } from '../../Services/games.service';
import { TutorialModalComponent } from '../../Components/tutorial-modal/tutorial-modal.component';
import { LicenseService } from '../../Services/license.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    SideBarComponent,
    RouterOutlet,
    TutorialModalComponent
],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  pageTitle: string = '';
  showTutorial: boolean = false;
  isAuthenticated$: Observable<boolean>;

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private themeService: ThemeService,
    private settingsService: SettingsService,
    private tutorialService: TutorialService,
    private gamesService: GamesService,
    private licenseService: LicenseService
  ) {
    // Get authentication state - admins have permanent licenses with all access
    this.isAuthenticated$ = this.licenseService.isAuthenticated$;

    const settings = this.settingsService.getSettings();
    if (settings.colorTheme === 'custom' && settings.customTheme.gradientColors && settings.customTheme.gradientColors.length > 0) {
      // Apply saved custom theme with all colors
      this.themeService.applyCustomTheme({
        gradientColors: settings.customTheme.gradientColors,
        primaryColor: settings.customTheme.primaryColor,
        secondaryColor: settings.customTheme.secondaryColor,
        textPrimaryColor: settings.customTheme.textPrimaryColor,
        textSecondaryColor: settings.customTheme.textSecondaryColor,
        cardBackgroundColor: settings.customTheme.cardBackgroundColor,
        borderColor: settings.customTheme.borderColor
      });
    } else {
      this.themeService.applyTheme(settings.colorTheme);
    }

    // Subscribe to tutorial modal visibility
    this.tutorialService.showModal$.subscribe(show => {
      this.showTutorial = show;
    });

    // Subscribe to router events to get the current route's title
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      map(() => {
        let route = this.activatedRoute;
        while (route.firstChild) {
          route = route.firstChild;
        }
        return route;
      }),
      map(route => route.snapshot.data['title'] || route.snapshot.title || '')
    ).subscribe(title => {
      this.pageTitle = title;
      this.autoShowTutorialForCurrentRoute();
    });
  }

  ngOnInit() {
    // Set initial title
    let route = this.activatedRoute;
    while (route.firstChild) {
      route = route.firstChild;
    }
    this.pageTitle = route.snapshot.data['title'] || route.snapshot.title || '';

    this.autoShowTutorialForCurrentRoute();
  }

  private autoShowTutorialForCurrentRoute(): void {
    const currentUrl = this.router.url;
    
    // Don't auto-show tutorial on non-game routes
    const nonGameRoutes = ['/settings', '/home', '/login', '/admin-licenses', '/admin-accounts'];
    if (nonGameRoutes.some(route => currentUrl.startsWith(route))) {
      return;
    }

    const game = this.gamesService.getGameByRoute(currentUrl);

    // Auto-show only when tutorial exists for current game and tutorial isn't completed
    this.tutorialService.autoShowForGame(game?.id);
  }

  closeTutorial() {
    this.tutorialService.hideTutorialModal();
  }
}
