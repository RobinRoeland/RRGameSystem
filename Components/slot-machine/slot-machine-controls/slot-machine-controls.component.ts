import { Component, Input, Output, EventEmitter, PLATFORM_ID, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { StorageService } from '../../../Services/storage.service';
import { ArduinoService } from '../../../Services/arduino.service';
import { SettingsService } from '../../../Services/settings.service';
import { Item } from '../slot-machine-roller/slot-machine-roller.component';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'slot-machine-controls',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './slot-machine-controls.component.html',
  styleUrl: './slot-machine-controls.component.scss'
})
export class SlotMachineControlsComponent implements OnInit, OnDestroy {
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);
  private destroy$ = new Subject<void>();

  @Input() items: Item[] = [];
  @Output() rollStart = new EventEmitter<void>();

  isRolling: boolean = false;
  rollButtonDisabled: boolean = false;
  showArduinoInstruction: boolean = false;

  // Notification overlays
  showRollingNotification: boolean = false;
  showWinNotification: boolean = false;
  showAfterRollNotificationOverlay: boolean = false;
  isInWinState: boolean = false;
  rollingNotificationText: string = '';
  winNotificationText: string = '';
  afterRollNotificationText: string = '';

  // Button text from settings
  rollButtonText: string = '';
  arduinoInstructionText: string = '';
  
  // Settings flags and templates
  private notificationTextRolling: string = '';
  private notificationTextWin: string = '';
  private notificationTextAfterRoll: string = '';
  public showButtonTextRoll: boolean = true;
  private showNotificationRolling: boolean = true;
  private showNotificationWin: boolean = true;
  public showButtonTextArduino: boolean = true;
  private showAfterRollNotification: boolean = true;

  // Arduino Controller (if available)
  private arduinoController: any = null;
  private statusSubscription: any = null;

  constructor(
    private storage: StorageService,
    private arduinoService: ArduinoService,
    private settingsService: SettingsService
  ) {
    // constructor body intentionally empty
  }

  ngOnInit(): void {
    // Only run in browser environment
    if (!this.isBrowser) {
      return;
    }

    // Subscribe to button text settings
    this.settingsService.settings$
      .pipe(takeUntil(this.destroy$))
      .subscribe(settings => {
        this.showButtonTextRoll = settings.showButtonTextRoll;
        this.showNotificationRolling = settings.showNotificationRolling;
        this.showNotificationWin = settings.showNotificationWin;
        this.showButtonTextArduino = settings.showButtonTextArduino;
        this.rollButtonText = settings.buttonTextRoll;
        this.notificationTextRolling = settings.notificationRolling;
        this.notificationTextWin = settings.notificationWin;
        this.arduinoInstructionText = settings.buttonTextArduino;
        this.showAfterRollNotification = settings.showNotificationAfterRoll;
        this.notificationTextAfterRoll = settings.notificationAfterRoll;
      });

    // Check if Arduino control is enabled in settings using StorageService
    const arduinoEnabled = this.storage.getArduinoEnabled();

    if (arduinoEnabled) {
      // Subscribe to ArduinoService status to control instruction text
      this.statusSubscription = this.arduinoService.status$.subscribe(statusInfo => {
        this.showArduinoInstruction = statusInfo.status === 'connected';
      });

      // Subscribe to Arduino roll requests
      this.arduinoService.rollRequest$.pipe(takeUntil(this.destroy$)).subscribe(() => {
        if (!this.rollButtonDisabled && this.items && this.items.length > 0) {
          this.onRollClick();
        }
      });
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    
    if (this.statusSubscription && typeof this.statusSubscription.unsubscribe === 'function') {
      this.statusSubscription.unsubscribe();
    }
  }
  onRollClick(): void {
    if (this.rollButtonDisabled || !this.items || this.items.length === 0) {
      return;
    }

    // Disable button during roll
    this.rollButtonDisabled = true;
    this.isRolling = true;
    
    // Show rolling notification if enabled and has text
    if (this.showNotificationRolling && this.notificationTextRolling && this.notificationTextRolling.trim()) {
      this.rollingNotificationText = this.notificationTextRolling;
      this.showRollingNotification = true;
    }

    // Emit roll start event
    this.rollStart.emit();
  }

  handleWin(reward: string): void {
    this.isRolling = false;
    this.isInWinState = true;
    
    // Hide rolling notification
    this.showRollingNotification = false;
    
    // Show win notification if enabled and has text
    if (this.showNotificationWin && this.notificationTextWin && this.notificationTextWin.trim()) {
      this.winNotificationText = this.notificationTextWin.replace('{reward}', reward);
      this.showWinNotification = true;
      
      // Also show after-roll notification below win notification if enabled
      if (this.showAfterRollNotification && this.notificationTextAfterRoll && this.notificationTextAfterRoll.trim()) {
        this.afterRollNotificationText = this.notificationTextAfterRoll;
        this.showAfterRollNotificationOverlay = true;
      }
      
      // Hide both notifications and re-enable button after 10 seconds
      setTimeout(() => {
        this.showWinNotification = false;
        this.showAfterRollNotificationOverlay = false;
        this.isInWinState = false;
        this.rollButtonDisabled = false;
      }, 10000);
    } else if (this.showAfterRollNotification && this.notificationTextAfterRoll && this.notificationTextAfterRoll.trim()) {
      // No win notification but has after-roll notification
      this.afterRollNotificationText = this.notificationTextAfterRoll;
      this.showAfterRollNotificationOverlay = true;
      
      // Hide after 5 seconds and re-enable button
      setTimeout(() => {
        this.showAfterRollNotificationOverlay = false;
        this.isInWinState = false;
        this.rollButtonDisabled = false;
      }, 5000);
    } else {
      // No notifications, immediately reset
      this.isInWinState = false;
      this.rollButtonDisabled = false;
    }

    // Send win result to Arduino (prefer ArduinoService if available)
    if (this.arduinoService && (this.arduinoService as any).getConnectionStatus && (this.arduinoService as any).getConnectionStatus()) {
      this.arduinoService.sendResult(true, reward);
    } else if (this.arduinoController && this.arduinoController.isConnected) {
      this.arduinoController.sendResult(true, reward);
    }
  }

  handleLoss(): void {
    this.isRolling = false;

    // Hide rolling notification
    this.showRollingNotification = false;

    // Send lose result to Arduino (prefer ArduinoService if available)
    if (this.arduinoService && (this.arduinoService as any).getConnectionStatus && (this.arduinoService as any).getConnectionStatus()) {
      this.arduinoService.sendResult(false);
    } else if (this.arduinoController && this.arduinoController.isConnected) {
      this.arduinoController.sendResult(false);
    }

    // Show after-roll notification if enabled
    if (this.showAfterRollNotification && this.notificationTextAfterRoll && this.notificationTextAfterRoll.trim()) {
      this.afterRollNotificationText = this.notificationTextAfterRoll;
      this.showAfterRollNotificationOverlay = true;
      
      // Hide after 5 seconds and re-enable button
      setTimeout(() => {
        this.showAfterRollNotificationOverlay = false;
        this.rollButtonDisabled = false;
      }, 5000);
    } else {
      // No notification, immediately re-enable button
      this.rollButtonDisabled = false;
    }
  }
}