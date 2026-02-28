import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AdminService, GeneratedLicense } from '../../Services/admin.service';
import { GamesService, Game } from '../../Services/games.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-admin-licenses',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './admin-licenses.component.html',
  styleUrl: './admin-licenses.component.scss'
})
export class AdminLicensesComponent implements OnInit, OnDestroy {
  licenseForm!: FormGroup;
  generatedLicenses: GeneratedLicense[] = [];
  availableGames: Game[] = [];
  selectedGames: Set<string> = new Set();
  successMessage = '';
  errorMessage = '';
  copiedLicenseKey = '';
  
  private subscriptions: Subscription[] = [];

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private adminService: AdminService,
    private gamesService: GamesService
  ) {}

  ngOnInit(): void {
    // Check if admin is logged in
    if (!this.adminService.getIsAdminLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }

    this.initializeForm();
    this.loadData();

    // Subscribe to updates
    this.subscriptions.push(
      this.adminService.generatedLicenses$.subscribe(licenses => {
        this.generatedLicenses = licenses;
      })
    );

    // Load available games
    this.subscriptions.push(
      this.gamesService.games$.subscribe(games => {
        this.availableGames = games;
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private initializeForm(): void {
    this.licenseForm = this.formBuilder.group({
      expirationDays: [30, [Validators.required, Validators.min(1), Validators.max(365)]]
    });
  }

  private loadData(): void {
    this.generatedLicenses = this.adminService.getGeneratedLicenses();
  }

  generateLicense(): void {
    if (this.licenseForm.invalid) {
      this.errorMessage = 'Please enter a valid expiration days value (1-365)';
      return;
    }

    try {
      const expirationDays = this.licenseForm.get('expirationDays')?.value;
      const allowedGames = this.selectedGames.size > 0 ? Array.from(this.selectedGames) : undefined;
      const newLicense = this.adminService.generateLicense(expirationDays, allowedGames);
      
      const gameAccess = allowedGames ? `${allowedGames.length} game(s)` : 'All games';
      this.successMessage = `License created successfully! Days: ${expirationDays}, Access: ${gameAccess}`;
      this.errorMessage = '';
      this.licenseForm.reset({ expirationDays: 30 });
      this.selectedGames.clear();
      
      setTimeout(() => {
        this.successMessage = '';
      }, 5000);
    } catch (error) {
      this.errorMessage = 'Failed to generate license. Please try again.';
      this.successMessage = '';
    }
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

  getUsageStatus(license: GeneratedLicense): string {
    if (!license.usedAt) {
      return 'Not Used';
    }
    return license.usedBy ? `Used by: ${license.usedBy}` : 'Used';
  }

  toggleGameSelection(gameId: string): void {
    if (this.selectedGames.has(gameId)) {
      this.selectedGames.delete(gameId);
    } else {
      this.selectedGames.add(gameId);
    }
  }

  isGameSelected(gameId: string): boolean {
    return this.selectedGames.has(gameId);
  }

  getGameAccessDisplay(license: GeneratedLicense): string {
    if (!license.allowedGames || license.allowedGames.length === 0) {
      return 'All Games';
    }
    
    const gameNames = license.allowedGames
      .map(gameId => {
        const game = this.availableGames.find(g => g.id === gameId);
        return game ? game.name : gameId;
      })
      .join(', ');
    
    return gameNames || 'Unknown';
  }

  get expirationDaysControl() {
    return this.licenseForm.get('expirationDays');
  }
}
