import { Injectable } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AdminService } from './admin.service';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard {
  constructor(
    private adminService: AdminService,
    private router: Router
  ) {}

  canActivate: CanActivateFn = (route, state) => {
    if (this.adminService.getIsAdminLoggedIn()) {
      return true;
    }
    
    // Not authenticated as admin, redirect to login
    this.router.navigate(['/login']);
    return false;
  };
}
