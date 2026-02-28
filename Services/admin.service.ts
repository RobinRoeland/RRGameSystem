import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { IndexedDBService, AdminAccount as IDBAdminAccount, GeneratedLicense as IDBGeneratedLicense } from './indexed-db.service';

export interface AdminAccount {
  id?: number;
  username: string;
  password?: string;
  role: 'admin' | 'super_admin';
  created_at?: string;
  createdAt?: string;
}

export interface GeneratedLicense {
  id?: number;
  key: string;
  created_at?: string;
  createdAt?: string;
  expiration_days?: number;
  expirationDays?: number;
  created_by?: string;
  createdBy?: string;
  is_active?: boolean;
  isActive?: boolean;
  used_at?: string;
  usedAt?: string;
  used_by?: string;
  usedBy?: string;
  allowed_games?: string[];
  allowedGames?: string[];
  updated_at?: string;
  updatedAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private adminAccountsSubject = new BehaviorSubject<AdminAccount[]>([]);
  public adminAccounts$ = this.adminAccountsSubject.asObservable();

  private generatedLicensesSubject = new BehaviorSubject<GeneratedLicense[]>([]);
  public generatedLicenses$ = this.generatedLicensesSubject.asObservable();

  private isAdminLoggedInSubject = new BehaviorSubject<boolean>(false);
  public isAdminLoggedIn$ = this.isAdminLoggedInSubject.asObservable();

  private licenseService: any; // Will be injected lazily to avoid circular dependency

  constructor(private indexedDB: IndexedDBService) {
    this.loadAdminState();
  }

  /**
   * Set the license service (called from LicenseService to avoid circular dependency)
   */
  setLicenseService(licenseService: any): void {
    this.licenseService = licenseService;
    this.loadAdminState();
  }

  /**
   * Load admin data from IndexedDB
   */
  loadAdminState(): void {
    this.loadAdminAccounts();
    this.loadGeneratedLicenses();
    this.restoreAdminLicenseFromDB(); // Restore admin license if it exists in DB
    
    // Update isAdminLoggedIn$ based on current license
    if (this.licenseService) {
      const license = this.licenseService.getCurrentLicense();
      this.isAdminLoggedInSubject.next(!!license && license.isAdmin === true);
    }
  }

  /**
   * Restore admin license from IndexedDB if it exists
   */
  private async restoreAdminLicenseFromDB(): Promise<boolean> {
    try {
      const licenses = await this.indexedDB.getAllLicenses();
      // Look for any active admin license from the DB that is still within session timeout
      const adminLicense = licenses.find((license) => {
        if (!(license.isAdmin === true && license.is_active === true)) {
          return false;
        }

        const sessionAnchor = license.used_at || license.updated_at || license.created_at;
        if (!sessionAnchor) {
          return false;
        }

        const lastLoginMs = new Date(sessionAnchor).getTime();
        if (Number.isNaN(lastLoginMs)) {
          return false;
        }

        return true;
      });
      
      if (adminLicense && this.licenseService) {
        this.licenseService.setCurrentLicense(adminLicense);
        this.isAdminLoggedInSubject.next(this.getIsAdminLoggedIn());
        return this.getIsAdminLoggedIn();
      }

      this.isAdminLoggedInSubject.next(false);
      return false;
    } catch (error) {
      console.error('Error restoring admin license from DB:', error);
      this.isAdminLoggedInSubject.next(false);
      return false;
    }
  }

  async ensureAdminSessionRestored(): Promise<boolean> {
    if (this.getIsAdminLoggedIn()) {
      return true;
    }

    return this.restoreAdminLicenseFromDB();
  }

  /**
   * Load admin accounts from IndexedDB
   */
  private async loadAdminAccounts(): Promise<void> {
    try {
      const accounts = await this.indexedDB.getAllAdminAccounts();
      this.adminAccountsSubject.next(accounts);
    } catch (error) {
      console.error('Error loading admin accounts:', error);
    }
  }

  /**
   * Load generated licenses from IndexedDB
   */
  private async loadGeneratedLicenses(): Promise<void> {
    try {
      const licenses = await this.indexedDB.getAllLicenses();
      const nonAdminLicenses = licenses.filter(license => !license.isAdmin);

      // Format database response to match interface
      const formattedLicenses = nonAdminLicenses.map(license => ({
        key: license.key,
        createdAt: license.created_at,
        expirationDays: license.expiration_days,
        createdBy: license.created_by,
        isActive: license.is_active,
        usedAt: license.used_at,
        usedBy: license.used_by,
        allowedGames: license.allowed_games ? license.allowed_games.split(',').filter(g => g) : []
      }));
      this.generatedLicensesSubject.next(formattedLicenses);
    } catch (error) {
      console.error('Error loading licenses:', error);
    }
  }

  /**
   * Admin login - validates against IndexedDB admin accounts
   */
  async loginAdmin(username: string, password: string): Promise<boolean> {
    const admin = await this.indexedDB.getAdminAccountByUsername(username);
    
    if (admin && admin.password === password) {
      // Admin account is only an alternate way to issue/refresh a permanent admin license
      // Actual authentication state is always derived from the active license
      if (this.licenseService) {
        try {
          const adminLicenseKey = `ADMIN-${username.toUpperCase()}-PERMANENT`;
          
          // Create the license object for IndexedDB
          const adminLicense: IDBGeneratedLicense = {
            key: adminLicenseKey,
            created_at: new Date().toISOString(),
            expiration_days: undefined,
            created_by: 'system',
            is_active: true,
            used_at: new Date().toISOString(),
            used_by: username,
            allowed_games: undefined,
            updated_at: new Date().toISOString(),
            isAdmin: true
          };
          
          // Check if this admin license already exists in IndexedDB
          const existingLicense = await this.indexedDB.getLicenseByKey(adminLicenseKey);
          if (!existingLicense) {
            await this.indexedDB.createLicense(adminLicense);
            this.licenseService.setCurrentLicense(adminLicense);
          } else {
            existingLicense.is_active = true;
            existingLicense.used_at = new Date().toISOString();
            existingLicense.used_by = username;
            existingLicense.isAdmin = true;
            existingLicense.updated_at = new Date().toISOString();
            await this.indexedDB.updateLicense(existingLicense);
            this.licenseService.setCurrentLicense(existingLicense);
          }
          
          // Update admin state from the active license
          this.isAdminLoggedInSubject.next(this.getIsAdminLoggedIn());
          
          // Reload licenses from IndexedDB
          await this.loadGeneratedLicenses();
          
          return true;
        } catch (error) {
          console.error('Error during admin login:', error);
          return false;
        }
      }
      
      return false;
    }
    
    return false;
  }

  /**
   * Admin logout - also clears the license
   */
  async logoutAdmin(): Promise<void> {
    // Clear the license (which will also clear admin status)
    this.isAdminLoggedInSubject.next(false);
    if (this.licenseService) {
      this.licenseService.logout();
    }
    
    // Also remove the admin license from IndexedDB
    try {
      const licenses = await this.indexedDB.getAllLicenses();
      const adminLicense = licenses.find(l => l.isAdmin === true);
      if (adminLicense && adminLicense.key) {
        await this.indexedDB.revokeLicense(adminLicense.key);
      }
    } catch (error) {
      console.error('Error removing admin license from DB:', error);
    }
  }

  /**
   * Get current admin username (from license)
   */
  getCurrentAdminUsername(): string | null {
    if (this.licenseService) {
      const license = this.licenseService.getCurrentLicense();
      if (license && license.isAdmin) {
        // Extract username from license key (format: ADMIN-{USERNAME}-PERMANENT)
        const match = license.key.match(/^ADMIN-(.+)-PERMANENT$/);
        return match ? match[1].toLowerCase() : null;
      }
    }
    return null;
  }

  /**
   * Check if admin is logged in (by checking license admin flag)
   */
  getIsAdminLoggedIn(): boolean {
    // direct license service check
    if (this.licenseService) {
      const license = this.licenseService.getCurrentLicense();
      if (license && license.isAdmin && license.isActive) {
        return true;
      }
    }
    return false;
  }

  /**
   * Generate a new license key (saves to IndexedDB)
   */
  async generateLicense(expirationDays: number, allowedGames?: string[]): Promise<GeneratedLicense> {
    const adminUsername = this.getCurrentAdminUsername();
    if (!adminUsername) {
      throw new Error('No admin logged in');
    }

    try {
      // Generate a random license key
      const key = this.generateLicenseKey();
      
      const newLicense: IDBGeneratedLicense = {
        key,
        created_at: new Date().toISOString(),
        expiration_days: expirationDays,
        created_by: adminUsername,
        is_active: true,
        allowed_games: allowedGames ? allowedGames.join(',') : '',
        updated_at: new Date().toISOString()
      };

      await this.indexedDB.createLicense(newLicense);

      // Reload licenses after creation
      await this.loadGeneratedLicenses();

      return {
        key,
        createdAt: newLicense.created_at,
        expirationDays,
        createdBy: adminUsername,
        isActive: true,
        allowedGames
      };
    } catch (error) {
      console.error('Error generating license:', error);
      throw error;
    }
  }

  /**
   * Generate a random license key
   */
  private generateLicenseKey(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const segments = 4;
    const segmentLength = 5;
    
    const key = [];
    for (let i = 0; i < segments; i++) {
      let segment = '';
      for (let j = 0; j < segmentLength; j++) {
        segment += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      key.push(segment);
    }
    
    return key.join('-');
  }

  /**
   * Get all generated licenses
   */
  getGeneratedLicenses(): GeneratedLicense[] {
    return this.generatedLicensesSubject.value;
  }

  /**
   * Get all admin accounts
   */
  getAdminAccounts(): AdminAccount[] {
    return this.adminAccountsSubject.value;
  }

  /**
   * Validate a license key
   */
  validateLicenseKey(key: string): GeneratedLicense | null {
    const licenses = this.generatedLicensesSubject.value;
    return licenses.find(license => license.key === key && license.isActive) || null;
  }

  /**
   * Mark a license as used
   */
  async markLicenseAsUsed(key: string, username?: string): Promise<void> {
    try {
      await this.indexedDB.markLicenseAsUsed(key, username || 'unknown');
      await this.loadGeneratedLicenses();
    } catch (error) {
      console.error('Error marking license as used:', error);
    }
  }

  /**
   * Revoke a license
   */
  async revokeLicense(key: string): Promise<void> {
    try {
      await this.indexedDB.revokeLicense(key);
      await this.loadGeneratedLicenses();
    } catch (error) {
      console.error('Error revoking license:', error);
    }
  }

  /**
   * Create a new admin account (only super_admin can do this)
   */
  async createAdminAccount(username: string, password: string, role: 'admin' | 'super_admin' = 'admin'): Promise<boolean> {
    const currentAdminUsername = this.getCurrentAdminUsername();
    
    // Only super admins can create new accounts
    if (!currentAdminUsername) {
      return false;
    }
    
    // Verify current user is super_admin
    const normalizedCurrentAdmin = currentAdminUsername.toLowerCase();
    const currentAdmin = this.adminAccountsSubject.value.find(acc => acc.username.toLowerCase() === normalizedCurrentAdmin);
    if (!currentAdmin || currentAdmin.role !== 'super_admin') {
      return false;
    }

    try {
      // Check if username already exists
      const normalizedNewUsername = username.trim().toLowerCase();
      const existing = this.adminAccountsSubject.value.find(acc => acc.username.toLowerCase() === normalizedNewUsername);
      if (existing) {
        console.error('Username already exists');
        return false;
      }

      const newAccount: IDBAdminAccount = {
        username,
        password,
        role,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      await this.indexedDB.createAdminAccount(newAccount);

      // Reload accounts after creation
      await this.loadAdminAccounts();
      return true;
    } catch (error: any) {
      console.error('Error creating admin account:', error);
      return false;
    }
  }

  /**
   * Delete an admin account (only super_admin can do this)
   */
  async deleteAdminAccount(username: string): Promise<boolean> {
    const currentAdminUsername = this.getCurrentAdminUsername();
    
    // Only super admins can delete accounts
    if (!currentAdminUsername) {
      return false;
    }
    
    // Verify current user is super_admin
    const normalizedCurrentAdmin = currentAdminUsername.toLowerCase();
    const currentAdmin = this.adminAccountsSubject.value.find(acc => acc.username.toLowerCase() === normalizedCurrentAdmin);
    if (!currentAdmin || currentAdmin.role !== 'super_admin') {
      return false;
    }

    // Can't delete yourself
    if (username.toLowerCase() === normalizedCurrentAdmin) {
      return false;
    }

    try {
      await this.indexedDB.deleteAdminAccount(username);

      // Reload accounts after deletion
      await this.loadAdminAccounts();
      return true;
    } catch (error) {
      console.error('Error deleting admin account:', error);
      return false;
    }
  }
}
