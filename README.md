# RRGameSystem 
**Check out a demo of my project at: [Github Pages](https://robinroeland.github.io/RRGameSystem/)!**

**Copyright © 2026 Robin Roeland. All rights reserved.**
- `No unauthorized use, distribution or modification`

- this is my personal project to learn and experiment

---


This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 17.3.17.

**New to our project?** Please check out the wiki to get started!

### Features
- ✅ **License-based authentication system** - Secure access control with temporary licenses
- ✅ **Admin panel** - Create admin accounts, generate licenses, manage users
- ✅ **IndexedDB storage** - Client-side persistent storage (GitHub Pages compatible)
- ✅ **Game access control** - Restrict game access per license
- ✅ Control slot machine via Arduino (button press, sensors, etc.)
- ✅ Real-time serial communication using Web Serial API
- ✅ Win/loss results sent back to Arduino
- ✅ Browser-based connection (Chrome, Edge, Opera)
- ✅ Settings-based toggle for Arduino control

## 🔐 Authentication & Licensing

This application uses a license-based authentication system with admin capabilities:

### Admin Features

Admins can:
- ✅ Generate time-limited licenses for users
- ✅ Create and manage admin accounts
- ✅ Revoke licenses
- ✅ View all generated licenses and their status
- ✅ Access all games automatically

### User Features

Users can:
- ✅ Log in with a license key
- ✅ Access games allowed by their license
- ✅ Use license until expiration

## 🏗️ Project Structure

### Services
The application uses a service-oriented architecture with the following core services:

**Core Services:**
- **LicenseService** - Manages user authentication and license validation
- **AdminService** - Handles admin accounts and license generation
- **IndexedDBService** - Manages IndexedDB storage
- **ItemsService** - Manages slot items with reactive updates
- **ValidationService** - Centralizes validation logic
- **FileService** - Handles file import/export operations
- **PrizeService** - Manages prizes and prize calculations
- **OddsService** - Manages item odds and probabilities
- **SettingsService** - Application settings management
- **StorageService** - LocalStorage wrapper with observables
- **ArduinoService** - Handles Arduino serial communication

**Guards:**
- **AuthGuard** - Protects routes requiring user authentication
- **AdminGuard** - Protects admin-only routes

### Browser Requirements

**Recommended Browsers:**
- ✅ Google Chrome 87+ (Full support)
- ✅ Microsoft Edge 87+ (Full support)
- ✅ Opera 73+ (Full support)

**Required Features:**
- IndexedDB support (for data storage)
- Web Serial API support (for Arduino integration)

> **Note**: Firefox and Safari have limited or no Web Serial API support. Use Chrome, Edge, or Opera for full Arduino functionality.

## Arduino Integration

This project supports Arduino control for triggering slot machine rolls and receiving results. For detailed setup instructions:

- **[Arduino Setup Guide](documentation/ARDUINO_SETUP.md)** - Complete setup instructions
- **[Arduino Quick Reference](documentation/ARDUINO_QUICK_REFERENCE.txt)** - Quick command reference

Key features:
- USB serial communication via Web Serial API
- Real-time win/loss feedback
- Browser-based connection (Chrome, Edge, Opera)
- Easy toggle in application settings

### GitHub Pages

This application is configured for GitHub Pages deployment

**Important Notes:**
- ✅ Works with client-side IndexedDB storage (no backend needed)
- ✅ Each user's browser maintains its own database
- ✅ Admin accounts and licenses are stored locally per browser
- ⚠️ Data is not shared between different browsers/devices
- ⚠️ Clearing browser data will reset to default credentials

## 📚 Documentation

- **[Arduino Setup Guide](documentation/ARDUINO_SETUP.md)** - Arduino integration setup
- **[Arduino Quick Reference](documentation/ARDUINO_QUICK_REFERENCE.txt)** - Quick command reference
