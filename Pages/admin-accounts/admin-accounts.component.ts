import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AdminService, AdminAccount } from '../../Services/admin.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-admin-accounts',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './admin-accounts.component.html',
  styleUrl: './admin-accounts.component.scss'
})
export class AdminAccountsComponent implements OnInit, OnDestroy {
  adminForm!: FormGroup;
  currentAdminUsername: string | null = null;
  adminAccounts: AdminAccount[] = [];
  successMessage = '';
  errorMessage = '';
  
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

    // Get current admin username
    this.currentAdminUsername = this.adminService.getCurrentAdminUsername();
    
    this.loadData();
    
    // Subscribe to admin accounts updates
    this.subscriptions.push(
      this.adminService.adminAccounts$.subscribe(accounts => {
        this.adminAccounts = accounts;
        
        // Verify current admin is still super_admin
        const currentAdmin = accounts.find(acc => acc.username.toUpperCase() === this.currentAdminUsername?.toUpperCase());
        if (!currentAdmin || currentAdmin.role !== 'super_admin') {
          this.router.navigate(['/home']);
          return;
        }
      })
    );

    this.initializeForm();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private initializeForm(): void {
    this.adminForm = this.formBuilder.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(5)]],
      role: ['admin', Validators.required]
    });
  }

  private loadData(): void {
    this.adminAccounts = this.adminService.getAdminAccounts();
  }

  get isCurrentAdminSuperAdmin(): boolean {
    const currentAdmin = this.adminAccounts.find(acc => acc.username.toLowerCase() === this.currentAdminUsername?.toLowerCase());
    return currentAdmin?.role === 'super_admin';
  }

  createAdminAccount(): void {
    if (this.adminForm.invalid) {
      this.errorMessage = 'Please fill in all fields correctly';
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

  getRoleLabel(role: string): string {
    return role === 'super_admin' ? 'Super Admin' : 'Admin';
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
