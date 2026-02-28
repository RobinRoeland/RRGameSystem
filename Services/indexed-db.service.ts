import { Injectable } from '@angular/core';

export interface AdminAccount {
  id?: number;
  username: string;
  password: string;
  role: 'admin' | 'super_admin';
  created_at: string;
  updated_at: string;
}

export interface GeneratedLicense {
  id?: number;
  key: string;
  created_at: string;
  expiration_days: number;
  created_by: string;
  is_active: boolean;
  used_at?: string;
  used_by?: string;
  allowed_games?: string;
  updated_at: string;
}

@Injectable({
  providedIn: 'root'
})
export class IndexedDBService {
  private dbName = 'RRGameSystemDB';
  private dbVersion = 1;
  private db: IDBDatabase | null = null;

  constructor() {
    this.initDatabase();
  }

  private async initDatabase(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        console.error('IndexedDB failed to open');
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        this.initializeDefaultData();
        resolve();
      };

      request.onupgradeneeded = (event: any) => {
        const db = event.target.result;

        // Create admin_accounts store
        if (!db.objectStoreNames.contains('admin_accounts')) {
          const adminStore = db.createObjectStore('admin_accounts', { 
            keyPath: 'id', 
            autoIncrement: true 
          });
          adminStore.createIndex('username', 'username', { unique: true });
        }

        // Create generated_licenses store
        if (!db.objectStoreNames.contains('generated_licenses')) {
          const licenseStore = db.createObjectStore('generated_licenses', { 
            keyPath: 'id', 
            autoIncrement: true 
          });
          licenseStore.createIndex('key', 'key', { unique: true });
        }
      };
    });
  }

  private async initializeDefaultData(): Promise<void> {
    // Check if default admin exists
    const admins = await this.getAllAdminAccounts();
    if (admins.length === 0) {
      // Create default admin account
      const defaultAdmin: AdminAccount = {
        username: 'admin',
        password: 'admin123',
        role: 'super_admin',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      await this.createAdminAccount(defaultAdmin);
    }

    // Check if demo license exists
    const licenses = await this.getAllLicenses();
    const demoExists = licenses.some(l => l.key === 'TEST-LICENSE-12345DEMO');
    if (!demoExists) {
      // Create demo license
      const demoLicense: GeneratedLicense = {
        key: 'TEST-LICENSE-12345DEMO',
        created_at: new Date().toISOString(),
        expiration_days: 365,
        created_by: 'system',
        is_active: true,
        allowed_games: '',
        updated_at: new Date().toISOString()
      };
      await this.createLicense(demoLicense);
    }
  }

  private async getDb(): Promise<IDBDatabase> {
    if (!this.db) {
      await this.initDatabase();
    }
    return this.db!;
  }

  // Admin Accounts Methods
  async getAllAdminAccounts(): Promise<AdminAccount[]> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['admin_accounts'], 'readonly');
      const store = transaction.objectStore('admin_accounts');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getAdminAccountByUsername(username: string): Promise<AdminAccount | undefined> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['admin_accounts'], 'readonly');
      const store = transaction.objectStore('admin_accounts');
      const index = store.index('username');
      const request = index.get(username);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async createAdminAccount(account: AdminAccount): Promise<AdminAccount> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['admin_accounts'], 'readwrite');
      const store = transaction.objectStore('admin_accounts');
      
      account.created_at = new Date().toISOString();
      account.updated_at = new Date().toISOString();
      
      const request = store.add(account);

      request.onsuccess = () => {
        account.id = request.result as number;
        resolve(account);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async deleteAdminAccount(username: string): Promise<void> {
    const db = await this.getDb();
    const account = await this.getAdminAccountByUsername(username);
    if (!account || !account.id) {
      throw new Error('Admin account not found');
    }

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['admin_accounts'], 'readwrite');
      const store = transaction.objectStore('admin_accounts');
      const request = store.delete(account.id!);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // License Methods
  async getAllLicenses(): Promise<GeneratedLicense[]> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['generated_licenses'], 'readonly');
      const store = transaction.objectStore('generated_licenses');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getLicenseByKey(key: string): Promise<GeneratedLicense | undefined> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['generated_licenses'], 'readonly');
      const store = transaction.objectStore('generated_licenses');
      const index = store.index('key');
      const request = index.get(key);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async createLicense(license: GeneratedLicense): Promise<GeneratedLicense> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['generated_licenses'], 'readwrite');
      const store = transaction.objectStore('generated_licenses');
      
      license.created_at = new Date().toISOString();
      license.updated_at = new Date().toISOString();
      
      const request = store.add(license);

      request.onsuccess = () => {
        license.id = request.result as number;
        resolve(license);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async updateLicense(license: GeneratedLicense): Promise<void> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['generated_licenses'], 'readwrite');
      const store = transaction.objectStore('generated_licenses');
      
      license.updated_at = new Date().toISOString();
      
      const request = store.put(license);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async revokeLicense(key: string): Promise<void> {
    const license = await this.getLicenseByKey(key);
    if (!license) {
      throw new Error('License not found');
    }
    license.is_active = false;
    await this.updateLicense(license);
  }

  async markLicenseAsUsed(key: string, username: string): Promise<void> {
    const license = await this.getLicenseByKey(key);
    if (!license) {
      throw new Error('License not found');
    }
    license.used_at = new Date().toISOString();
    license.used_by = username;
    await this.updateLicense(license);
  }
}
