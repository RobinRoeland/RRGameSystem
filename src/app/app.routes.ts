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

const authGuard = () => {
  const licenseService = inject(LicenseService);
  const router = inject(Router);
  
  // Check if user has a valid license (including admins with permanent licenses)
  const isAuth = licenseService.getIsAuthenticated();
  console.log('Auth guard: License state =', isAuth);
  
  if (isAuth) {
    console.log('Guard: Access granted');
    return true;
  }
  
  // Fallback: check localStorage directly
  const userAuth = localStorage.getItem('rr_game_authenticated') === 'true';
  const userLicense = localStorage.getItem('rr_game_license') !== null;
  
  console.log('Auth guard: localStorage check - auth:', userAuth, 'license:', userLicense ? 'exists' : 'missing');
  
  if (userAuth && userLicense) {
    console.log('Guard: Reloading service state from localStorage');
    licenseService.loadAuthenticationState();
    return true;
  }
  
  console.log('Guard: Access denied, redirecting to login');
  router.navigate(['/login']);
  return false;
};

const gameAccessGuard = (gameId: string) => {
  return () => {
    const licenseService = inject(LicenseService);
    const router = inject(Router);
    
    // Check if user is authenticated first
    if (!licenseService.getIsAuthenticated()) {
      console.log('Game access guard: User not authenticated');
      router.navigate(['/login']);
      return false;
    }
    
    // Check if user has access to this specific game (admins have permanent licenses with all access)
    const hasAccess = licenseService.hasGameAccess(gameId);
    console.log(`Game access guard: User access to '${gameId}' =`, hasAccess);
    
    if (!hasAccess) {
      console.log('Game access guard: Access denied, redirecting to home');
      router.navigate(['/home']);
      return false;
    }
    
    return true;
  };
};

const adminGuard = () => {
  const adminService = inject(AdminService);
  const router = inject(Router);
  
  // Check if admin (admin status is now stored in the license with isAdmin flag)
  const isAdmin = adminService.getIsAdminLoggedIn();
  console.log('Admin guard: Admin status =', isAdmin);
  
  if (isAdmin) {
    console.log('Guard: Admin authenticated');
    return true;
  }
  
  console.log('Guard: Not an admin, redirecting to login');
  router.navigate(['/login']);
  return false;
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
    canActivate: [gameAccessGuard('slot-machine')]
  },
  { 
    path: '', 
    redirectTo: '/home', 
    pathMatch: 'full' 
  }
];
