import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { LicenseService } from '../../Services/license.service';
import { AdminService } from '../../Services/admin.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit {
  userForm: FormGroup;
  adminForm: FormGroup;
  
  activeTab: 'user' | 'admin' = 'user';
  isLoading = false;
  errorMessage = '';

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private licenseService: LicenseService,
    private adminService: AdminService
  ) {
    // Initialize forms in constructor to avoid template binding errors
    this.userForm = this.formBuilder.group({
      licenseKey: ['', [Validators.required, Validators.minLength(10)]]
    });

    this.adminForm = this.formBuilder.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(5)]]
    });
  }

  ngOnInit(): void {
    // If already authenticated as user, redirect to home
    if (this.licenseService.getIsAuthenticated()) {
      this.router.navigate(['/home']);
      return;
    }

    // If admin is logged in, redirect to home (admin panel is in sidebar)
    if (this.adminService.getIsAdminLoggedIn()) {
      this.router.navigate(['/home']);
      return;
    }
  }

  switchTab(tab: 'user' | 'admin'): void {
    this.activeTab = tab;
    this.errorMessage = '';
  }

  async onUserLogin(): Promise<void> {
    if (this.userForm.invalid) {
      this.errorMessage = 'Please enter a valid license key';
      return;
    }

    this.setLoading(true);
    this.errorMessage = '';

    const licenseKey = this.userForm.get('licenseKey')?.value.trim();
    console.log('=== USER LOGIN ATTEMPT ===');
    console.log('License key entered:', licenseKey);

    // Validate license
    const loginResult = this.licenseService.login(licenseKey);
    console.log('License validation result:', loginResult);
    
    if (!loginResult) {
      this.errorMessage = 'Invalid license key. Please check and try again.';
      this.setLoading(false);
      console.error('License validation failed for key:', licenseKey);
      return;
    }

    // Check state after login
    console.log('After login:');
    console.log('- Service authenticated:', this.licenseService.getIsAuthenticated());
    console.log('- localStorage rr_game_authenticated:', localStorage.getItem('rr_game_authenticated'));
    console.log('- localStorage rr_game_license exists:', localStorage.getItem('rr_game_license') !== null);

    // License valid, attempt navigation
    try {
      console.log('Navigating to /home...');
      const navigated = await this.router.navigate(['/home']);
      console.log('Navigation result:', navigated);
      
      if (!navigated) {
        this.errorMessage = 'Navigation blocked by auth guard. Please refresh the page.';
        this.setLoading(false);
        console.error('Navigation was blocked. Auth status:', this.licenseService.getIsAuthenticated());
      }
    } catch (error) {
      console.error('Navigation error:', error);
      this.errorMessage = 'An error occurred during login. Please try again.';
      this.setLoading(false);
    }
  }

  async onAdminLogin(): Promise<void> {
    if (this.adminForm.invalid) {
      this.errorMessage = 'Please enter username and password';
      return;
    }

    this.setLoading(true);
    this.errorMessage = '';

    const username = this.adminForm.get('username')?.value.trim();
    const password = this.adminForm.get('password')?.value;
    console.log('=== ADMIN LOGIN ATTEMPT ===');
    console.log('Username entered:', username);

    // Validate admin credentials (now async)
    const loginResult = await this.adminService.loginAdmin(username, password);
    console.log('Admin login result:', loginResult);
    
    if (!loginResult) {
      this.errorMessage = 'Invalid admin credentials. Please try again.';
      this.setLoading(false);
      console.error('Admin login failed for username:', username);
      return;
    }

    // Check state after login
    console.log('After admin login:');
    console.log('- Service authenticated:', this.adminService.getIsAdminLoggedIn());
    console.log('- localStorage rr_game_current_admin exists:', localStorage.getItem('rr_game_current_admin') !== null);

    // Credentials valid, attempt navigation
    try {
      console.log('Navigating to /home...');
      const navigated = await this.router.navigate(['/home']);
      console.log('Navigation result:', navigated);
      
      if (!navigated) {
        this.errorMessage = 'Navigation blocked by auth guard. Please refresh the page.';
        this.setLoading(false);
        console.error('Navigation was blocked. Admin status:', this.adminService.getIsAdminLoggedIn());
      }
    } catch (error) {
      console.error('Navigation error:', error);
      this.errorMessage = 'An error occurred during login. Please try again.';
      this.setLoading(false);
    }
  }

  private setLoading(loading: boolean): void {
    this.isLoading = loading;
    const licenseKeyControl = this.userForm.get('licenseKey');
    const usernameControl = this.adminForm.get('username');
    const passwordControl = this.adminForm.get('password');

    if (loading) {
      licenseKeyControl?.disable();
      usernameControl?.disable();
      passwordControl?.disable();
    } else {
      licenseKeyControl?.enable();
      usernameControl?.enable();
      passwordControl?.enable();
    }
  }

  get licenseKeyControl() {
    return this.userForm.get('licenseKey');
  }

  get usernameControl() {
    return this.adminForm.get('username');
  }

  get passwordControl() {
    return this.adminForm.get('password');
  }
}
