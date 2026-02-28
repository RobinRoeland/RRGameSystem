# RRGameSystem 
**Check out a demo of my project at: [Github Pages](https://robinroeland.github.io/RRGameSystem/)!**

**Copyright © 2026 Robin Roeland. All rights reserved.**

~ (this is my personal project to learn and experiment)

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

## Quick Start

### First-Time Setup

1. **Install and Start:**
   ```bash
   npm run setup
   ```
   This will install all dependencies and automatically start the development server.

2. **Login:**
   - Navigate to `http://localhost:4200/`
   - You'll be redirected to the login page
   
   **Option 1 - Admin Login:**
   
   **Option 2 - User License:**

3. **Admin Panel (Admin only):**
   - After admin login, click "Admin Panel" in the sidebar
   - Generate new licenses for users
   - Manage admin accounts
   - View all licenses and their status

## Development Server

Run `npm start` or `npm run dev` for a dev server. The app will automatically open at `http://localhost:4200/`. The application will automatically reload if you change any of the source files.

### Available Scripts

- `npm start` - Start development server and open browser
- `npm run dev` - Start development server
- `npm run build` - Build the project for production
- `npm run build:ghpages` - Build for GitHub Pages deployment
- `npm run watch` - Build and watch for changes
- `npm test` - Run unit tests
- `npm run setup` - Install dependencies and start server

## Code Scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `npm run build` to build the project. The build artifacts will be stored in the `dist/slot-machine/` directory.

## Testing

Run `npm test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Arduino Integration

This project supports Arduino control for triggering slot machine rolls and receiving results. For detailed setup instructions:

- **[Arduino Setup Guide](documentation/ARDUINO_SETUP.md)** - Complete setup instructions
- **[Arduino Quick Reference](documentation/ARDUINO_QUICK_REFERENCE.txt)** - Quick command reference

Key features:
- USB serial communication via Web Serial API
- Real-time win/loss feedback
- Browser-based connection (Chrome, Edge, Opera)
- Easy toggle in application settings

## 📦 Deployment

### GitHub Pages

This application is configured for GitHub Pages deployment:

```bash
npm run build:ghpages
```

This builds the application with the correct base href for GitHub Pages. The output will be in `dist/slot-machine/browser/`.

**Important Notes:**
- ✅ Works with client-side IndexedDB storage (no backend needed)
- ✅ Each user's browser maintains its own database
- ✅ Admin accounts and licenses are stored locally per browser
- ⚠️ Data is not shared between different browsers/devices
- ⚠️ Clearing browser data will reset to default credentials

### Server-Side Rendering (SSR)

For SSR deployment (optional):

```bash
npm run build
npm run serve:ssr:RRGameSystem
```

This uses Angular Universal for server-side rendering but is not required for GitHub Pages.

## 📚 Documentation

- **[IndexedDB Storage Guide](INDEXEDDB_STORAGE.md)** - Complete IndexedDB implementation details
- **[Arduino Setup Guide](documentation/ARDUINO_SETUP.md)** - Arduino integration setup
- **[Arduino Quick Reference](documentation/ARDUINO_QUICK_REFERENCE.txt)** - Quick command reference

## 🔒 Security Considerations

**Current Implementation (Client-Side Storage):**
- ✅ Suitable for demos, development, and GitHub Pages hosting
- ✅ No backend infrastructure required
- ⚠️ Data stored in browser IndexedDB (visible in DevTools)
- ⚠️ Passwords stored in plain text (not production-ready)
- ⚠️ Data is local to each browser (not synchronized)

**For Production Use:**

If you need enhanced security, consider:

1. **Backend Database**
   - Deploy to Vercel, Render, Railway, or AWS
   - Use PostgreSQL, MySQL, or MongoDB
   - Implement bcrypt password hashing
   - Add JWT-based authentication
   - Enable HTTPS/TLS

2. **Firebase/Supabase**
   - Cloud-based backend-as-a-service
   - Built-in authentication
   - Real-time database sync
   - Row-level security policies

3. **Environment Variables**
   - Store sensitive configuration separately
   - Never commit credentials to git
   - Use .env files for secrets

> **Current Use Case**: This client-side implementation is designed for GitHub Pages deployment where backend infrastructure is not available. It's suitable for demos, personal projects, and development environments.

## Further Help

To get more help on the Angular CLI use `ng help` or check out the [Angular CLI Overview and Command Reference](https://angular.io/cli) page.
