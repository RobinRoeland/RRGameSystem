import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AdminService, GeneratedLicense, AdminAccount } from '../../Services/admin.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-admin-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './admin-panel.component.html',
  styleUrl: './admin-panel.component.scss'
})
export class AdminPanelComponent implements OnInit, OnDestroy {
  licenseForm!: FormGroup;
  adminForm!: FormGroup;

  currentAdminUsername: string | null = null;
  generatedLicenses: GeneratedLicense[] = [];
  adminAccounts: AdminAccount[] = [];
  
  activeTab: 'licenses' | 'admins' = 'licenses';
  successMessage = '';
  errorMessage = '';
  copiedLicenseKey = '';
  
  private subscriptions: Subscription[] = [];

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private adminService: AdminService
  ) {}

  ngOnInit(): void {
    // Check if admin is logged in
    if (!this.adminService.getIsAdminLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }

    this.currentAdminUsername = this.adminService.getCurrentAdminUsername();
    this.initializeForms();
    this.loadData();

    // Subscribe to updates
    this.subscriptions.push(
      this.adminService.generatedLicenses$.subscribe(licenses => {
        this.generatedLicenses = licenses;
      }),
      this.adminService.adminAccounts$.subscribe(accounts => {
        this.adminAccounts = accounts;
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private initializeForms(): void {
    // License generation form
    this.licenseForm = this.formBuilder.group({
      expirationDays: [30, [Validators.required, Validators.min(1), Validators.max(365)]]
    });

    // New admin form
    this.adminForm = this.formBuilder.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(5)]],
      role: ['admin', Validators.required]
    });
  }

  private loadData(): void {
    this.generatedLicenses = this.adminService.getGeneratedLicenses();
    this.adminAccounts = this.adminService.getAdminAccounts();
  }

  switchTab(tab: 'licenses' | 'admins'): void {
    this.activeTab = tab;
    this.errorMessage = '';
    this.successMessage = '';
  }

  get isCurrentAdminSuperAdmin(): boolean {
    const currentAdmin = this.adminAccounts.find(acc => acc.username === this.currentAdminUsername);
    return currentAdmin?.role === 'super_admin';
  }

  generateLicense(): void {
    if (this.licenseForm.invalid) {
      this.errorMessage = 'Please enter a valid expiration days value (1-365)';
      return;
    }

    const expirationDays = this.licenseForm.get('expirationDays')?.value;
    this.adminService.generateLicense(expirationDays)
      .then(() => {
        this.successMessage = `License created successfully! Days: ${expirationDays}`;
        this.errorMessage = '';
        this.licenseForm.reset({ expirationDays: 30 });
        
        // Clear success message after 5 seconds
        setTimeout(() => {
          this.successMessage = '';
        }, 5000);
      })
      .catch((error) => {
        this.errorMessage = 'Failed to generate license. Please try again.';
        this.successMessage = '';
        console.error('Error generating license:', error);
      });
  }

  copyToClipboard(licenseKey: string): void {
    navigator.clipboard.writeText(licenseKey).then(() => {
      this.copiedLicenseKey = licenseKey;
      setTimeout(() => {
        this.copiedLicenseKey = '';
      }, 2000);
    });
  }

  revokeLicense(key: string): void {
    if (confirm('Are you sure you want to revoke this license? Users with this license won\'t be able to login anymore.')) {
      this.adminService.revokeLicense(key);
      this.successMessage = 'License revoked successfully';
      this.errorMessage = '';
      
      setTimeout(() => {
        this.successMessage = '';
      }, 3000);
    }
  }

  createAdminAccount(): void {
    if (this.adminForm.invalid) {
      this.errorMessage = 'Please fill in all fields correctly';
      return;
    }

    const currentAdmin = this.adminAccounts.find(acc => acc.username === this.currentAdminUsername);
    if (!currentAdmin || currentAdmin.role !== 'super_admin') {
      this.errorMessage = 'Only super admins can create new admin accounts';
      return;
    }

    const username = this.adminForm.get('username')?.value.trim();
    const password = this.adminForm.get('password')?.value;
    const role = this.adminForm.get('role')?.value;

    this.adminService.createAdminAccount(username, password, role)
      .then((success) => {
        if (success) {
          this.successMessage = `Admin account "${username}" created successfully!`;
          this.errorMessage = '';
          this.adminForm.reset({ role: 'admin' });
          
          setTimeout(() => {
            this.successMessage = '';
          }, 5000);
        } else {
          this.errorMessage = 'Failed to create admin account. Username may already exist.';
          this.successMessage = '';
        }
      })
      .catch((error) => {
        this.errorMessage = 'Failed to create admin account. Please try again.';
        this.successMessage = '';
        console.error('Error creating admin account:', error);
      });
  }

  deleteAdminAccount(username: string): void {
    if (!confirm(`Are you sure you want to delete the admin account "${username}"?`)) {
      return;
    }

    this.adminService.deleteAdminAccount(username)
      .then((success) => {
        if (success) {
          this.successMessage = `Admin account "${username}" deleted successfully`;
          this.errorMessage = '';
          
          setTimeout(() => {
            this.successMessage = '';
          }, 3000);
        } else {
          this.errorMessage = 'Failed to delete admin account. You may not have permission.';
          this.successMessage = '';
        }
      })
      .catch((error) => {
        this.errorMessage = 'Failed to delete admin account. Please try again.';
        this.successMessage = '';
        console.error('Error deleting admin account:', error);
      });
  }

  logout(): void {
    this.adminService.logoutAdmin();
    this.router.navigate(['/login']);
  }

  getUsageStatus(license: GeneratedLicense): string {
    if (!license.usedAt) {
      return 'Not Used';
    }
    return license.usedBy ? `Used by: ${license.usedBy}` : 'Used';
  }

  getRoleLabel(role: string): string {
    return role === 'super_admin' ? 'Super Admin' : 'Admin';
  }

  get expirationDaysControl() {
    return this.licenseForm.get('expirationDays');
  }

  get usernameControl() {
    return this.adminForm.get('username');
  }

  get passwordControl() {
    return this.adminForm.get('password');
  }

  get roleControl() {
    return this.adminForm.get('role');
  }
}
