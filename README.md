# RRGameSystem 
**Check out a demo of my project at: [Github Pages](https://robinroeland.github.io/RRGameSystem/)!**

**Copyright © 2026 Robin Roeland. All rights reserved.**

~ (this is my personal project to learn and experiment)

---


This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 17.3.17.

**New to our project?** Please check out the wiki to get started!

### Features
- ✅ Control slot machine via Arduino (button press, sensors, etc.)
- ✅ Real-time serial communication using Web Serial API
- ✅ Win/loss results sent back to Arduino
- ✅ Browser-based connection (Chrome, Edge, Opera)
- ✅ Settings-based toggle for Arduino control

## 🏗️ Project Structure

### Services
The application uses a service-oriented architecture with the following core services:

- **ItemsService** - Manages slot items with reactive updates
- **ValidationService** - Centralizes validation logic
- **FileService** - Handles file import/export operations
- **PrizeService** - Manages prizes and prize calculations
- **OddsService** - Manages item odds and probabilities
- **SettingsService** - Application settings management
- **StorageService** - LocalStorage wrapper with observables

## Quick Start

For first-time setup:
```bash
npm run setup
```
This will install all dependencies and automatically start the development server.

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

## Further Help

To get more help on the Angular CLI use `ng help` or check out the [Angular CLI Overview and Command Reference](https://angular.io/cli) page.
