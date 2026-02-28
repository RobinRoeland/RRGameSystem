import { Component, HostBinding, OnInit, OnDestroy, HostListener, Inject, PLATFORM_ID } from '@angular/core';
import { RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { SettingsService } from '../../Services/settings.service';
import { GamesService, NavItem } from '../../Services/games.service';
import { LicenseService } from '../../Services/license.service';
import { AdminService } from '../../Services/admin.service';
import { AsyncPipe, isPlatformBrowser, CommonModule } from '@angular/common';
import { Observable, Subscription } from 'rxjs';
import { map, filter } from 'rxjs/operators';

@Component({
  selector: 'side-bar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, AsyncPipe, CommonModule],
  templateUrl: './side-bar.component.html',
  styleUrl: './side-bar.component.scss'
})
export class SideBarComponent implements OnInit, OnDestroy {
  isCollapsed = true; // Tracks sidebar state
  isAtTop = true; // Tracks if page is scrolled to top
  companyLogo$: Observable<string>;
  companyLogoSmall$: Observable<string>;
  navigationItems: NavItem[] = [];
  currentGameName: string = '';
  showGameNav: boolean = false;
  isAdminUser: boolean = false;
  private routerSubscription?: Subscription;
  private hoverTimeout?: number;
  private subscriptions: Subscription[] = [];

  @HostBinding('class.sidebar-collapsed')
  get collapsed() {
    return this.isCollapsed;
  }

  @HostBinding('class.at-top')
  get atTop() {
    return this.isAtTop;
  }

  constructor(
    private settingsService: SettingsService,
    private gamesService: GamesService,
    private router: Router,
    private licenseService: LicenseService,
    private adminService: AdminService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.companyLogo$ = this.settingsService.settings$.pipe(
      map(settings => settings.companyLogo)
    );
    this.companyLogoSmall$ = this.settingsService.settings$.pipe(
      map(settings => settings.companyLogoSmall)
    );
  }

  ngOnInit() {
    // Track admin status
    this.isAdminUser = this.adminService.getIsAdminLoggedIn();
    this.subscriptions.push(
      this.adminService.isAdminLoggedIn$.subscribe((isAdmin: boolean) => {
        this.isAdminUser = isAdmin;
      })
    );

    // Update navigation based on current route
    this.updateNavigation(this.router.url);

    // Close sidebar on navigation (mobile) and update nav items
    this.routerSubscription = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event) => {
      this.updateNavigation((event as NavigationEnd).url);
      if (this.isMobile()) {
        this.isCollapsed = true;
      }
    });
  }

  ngOnDestroy() {
    this.routerSubscription?.unsubscribe();
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.clearHoverTimeout();
  }

  // Listen for window resize to close sidebar on mobile
  @HostListener('window:resize')
  onResize() {
    if (this.isMobile() && !this.isCollapsed) {
      this.isCollapsed = true;
    }
  }

  onSidebarMouseEnter() {
    this.clearHoverTimeout();
    if (this.isCollapsed) {
      this.isCollapsed = false;
    }
  }

  onSidebarMouseLeave() {
    this.clearHoverTimeout();
    // Add a small delay before collapsing to prevent accidental collapse
    this.hoverTimeout = window.setTimeout(() => {
      if (!this.isMobile()) {
        this.isCollapsed = true;
      }
    }, 300);
  }

  onToggleClick() {
    // On mobile, clicking toggles the sidebar
    if (this.isMobile()) {
      this.isCollapsed = !this.isCollapsed;
    }
  }

  onNavClick(): void {
    if (this.isMobile()) {
      this.isCollapsed = true;
    }
  }

  async logout(): Promise<void> {
    // Log out both user and admin sessions
    this.licenseService.logout();
    await this.adminService.logoutAdmin();
    this.router.navigate(['/login']);
  }

  private clearHoverTimeout() {
    if (this.hoverTimeout) {
      clearTimeout(this.hoverTimeout);
      this.hoverTimeout = undefined;
    }
  }

  private isMobile(): boolean {
    if (isPlatformBrowser(this.platformId)) {
      return window.innerWidth <= 480;
    }
    return false;
  }

  private updateNavigation(url: string): void {
    // Check if we're on home page - clear game context
    if (url === '/' || url === '/home') {
      this.showGameNav = false;
      this.navigationItems = [];
      this.currentGameName = '';
      this.gamesService.setCurrentGame(null);
      return;
    }

    // If on settings page, keep the current game context (don't change anything)
    if (url === '/settings') {
      return;
    }

    // Find the game for the current route
    const game = this.gamesService.getGameByRoute(url);
    if (game) {
      // Check if user has access to this game (admins have permanent licenses with all access)
      const hasAccess = this.licenseService.hasGameAccess(game.id);
      
      if (!hasAccess) {
        // User shouldn't be here, clear game context
        this.showGameNav = false;
        this.navigationItems = [];
        this.currentGameName = '';
        this.gamesService.setCurrentGame(null);
        return;
      }
      
      this.showGameNav = true;
      this.currentGameName = game.name;
      // Filter out Settings from game nav items since it's always shown
      this.navigationItems = (game.navigationItems || []).filter(item => item.route !== '/settings');
      this.gamesService.setCurrentGame(game);
    } else {
      this.showGameNav = false;
      this.navigationItems = [];
      this.currentGameName = '';
      this.gamesService.setCurrentGame(null);
    }
  }
}
