import { Routes } from '@angular/router';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { ItemEditorComponent } from '../../Pages/item-editor/item-editor.component';
import { SlotMachineComponent } from '../../Components/slot-machine/slot-machine/slot-machine.component';
import { HomeComponent } from '../../Pages/home/home.component';
import { PrizesComponent } from '../../Pages/prizes/prizes.component';
import { OddsComponent } from '../../Pages/odds/odds.component';
import { SettingsComponent } from '../../Pages/settings/settings.component';
import { LoginComponent } from '../../Pages/login/login.component';
import { AdminLicensesComponent } from '../../Pages/admin-licenses/admin-licenses.component';
import { AdminAccountsComponent } from '../../Pages/admin-accounts/admin-accounts.component';
import { TestGameComponent } from '../../Pages/test-game/test-game.component';
import { LicenseService } from '../../Services/license.service';
import { AdminService } from '../../Services/admin.service';

const authGuard = async () => {
  const licenseService = inject(LicenseService);
  const adminService = inject(AdminService);
  const router = inject(Router);
  
  // Check if user has a valid license (including admins with permanent licenses)
  const isAuth = licenseService.getIsAuthenticated();

  if (isAuth) {
    return true;
  }

  // Attempt to restore admin session from IndexedDB before redirecting
  const adminRestored = await adminService.ensureAdminSessionRestored();
  if (adminRestored) {
    return true;
  }
  
  // Fallback: check localStorage directly
  const userAuth = localStorage.getItem('rr_game_authenticated') === 'true';
  const userLicense = localStorage.getItem('rr_game_license') !== null;
  
  if (userAuth && userLicense) {
    licenseService.loadAuthenticationState();
    return licenseService.getIsAuthenticated();
  }
  
  return router.parseUrl('/login');
};

const gameAccessGuard = (gameId: string) => {
  return async () => {
    const licenseService = inject(LicenseService);
    const adminService = inject(AdminService);
    const router = inject(Router);
    
    // Check if user is authenticated first
    if (!licenseService.getIsAuthenticated()) {
      const adminRestored = await adminService.ensureAdminSessionRestored();
      if (!adminRestored && !licenseService.getIsAuthenticated()) {
        return router.parseUrl('/login');
      }
    }
    
    // Check if user has access to this specific game (admins have permanent licenses with all access)
    const hasAccess = licenseService.hasGameAccess(gameId);
    
    if (!hasAccess) {
      return router.parseUrl('/home');
    }
    
    return true;
  };
};

const adminGuard = async () => {
  const adminService = inject(AdminService);
  
  // Check primary: admin service check
  if (adminService.getIsAdminLoggedIn()) {
    return true;
  }

  const restored = await adminService.ensureAdminSessionRestored();
  if (restored) {
    return true;
  }

  // Not logged in as admin
  const router = inject(Router);
  return router.parseUrl('/login');
};

export const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent,
    title: 'Login'
  },
  {
    path: 'admin-licenses',
    component: AdminLicensesComponent,
    title: 'Manage Licenses',
    canActivate: [adminGuard]
  },
  {
    path: 'admin-accounts',
    component: AdminAccountsComponent,
    title: 'Manage Admins',
    canActivate: [adminGuard]
  },
  {
    path: 'home',
    component: HomeComponent,
    title: 'Games',
    canActivate: [authGuard]
  },
  { 
    path: 'slotmachine', 
    component: SlotMachineComponent,
    title: 'Prize Machine',
    canActivate: [gameAccessGuard('slot-machine')]
  },
  { 
    path: 'test-game', 
    component: TestGameComponent,
    title: 'Test Game',
    canActivate: [gameAccessGuard('test-game')]
  },
  { 
    path: 'edit-items', 
    component: ItemEditorComponent,
    title: 'Edit Items',
    canActivate: [gameAccessGuard('slot-machine')]
  },
  {
    path: 'edit-prizes',
    component: PrizesComponent,
    title: 'Edit Prizes',
    canActivate: [gameAccessGuard('slot-machine')]
  },
  {
    path: 'edit-odds',
    component: OddsComponent,
    title: 'Edit Odds',
    canActivate: [gameAccessGuard('slot-machine')]
  },
  {
    path: 'settings',
    component: SettingsComponent,
    title: 'Settings',
    canActivate: [authGuard]
  },
  { 
    path: '', 
    redirectTo: '/home', 
    pathMatch: 'full' 
  }
];
