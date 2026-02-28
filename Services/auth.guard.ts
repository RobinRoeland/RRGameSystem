import { Injectable } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { LicenseService } from './license.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard {
  constructor(
    private licenseService: LicenseService,
    private router: Router
  ) {}

  canActivate: CanActivateFn = (route, state) => {
    if (this.licenseService.getIsAuthenticated()) {
      return true;
    }
    
    // Not authenticated, redirect to login
    this.router.navigate(['/login']);
    return false;
  };
}
