const { autoUpdater } = require('electron-updater');
const { app } = require('electron');
const logger = require('./logger');

class AppUpdater {
  constructor(mainWindow) {
    this.mainWindow = mainWindow;
    this.setupAutoUpdater();
  }

  setupAutoUpdater() {
    // Enable dev mode for testing (reads dev-app-update.yml)
    // Only enable in development, not in production builds
    if (process.env.NODE_ENV === 'development' || !app.isPackaged) {
      autoUpdater.forceDevUpdateConfig = true;
      console.log('Dev update mode enabled - using dev-app-update.yml');
    }

    // Configure logger for electron-updater
    // Create a compatible logger interface
    autoUpdater.logger = {
      info: (...args) => logger.info(...args),
      warn: (...args) => logger.warn(...args),
      error: (...args) => logger.error(...args),
      debug: (...args) => logger.log(...args)
    };

    // Auto download updates
    autoUpdater.autoDownload = true;
    // Auto install on quit (after download)
    autoUpdater.autoInstallOnAppQuit = true;

    // Event handlers
    autoUpdater.on('checking-for-update', () => {
      console.log('Checking for updates...');
      if (this.mainWindow && !this.mainWindow.isDestroyed()) {
        this.mainWindow.webContents.send('update-checking');
      }
    });

    autoUpdater.on('update-available', (info) => {
      console.log('Update available:', info.version);
      if (this.mainWindow && !this.mainWindow.isDestroyed()) {
        this.mainWindow.webContents.send('update-available', {
          version: info.version,
          releaseName: info.releaseName,
          releaseNotes: info.releaseNotes
        });
      }
    });

    autoUpdater.on('update-not-available', (info) => {
      console.log('Update not available. Current version is latest.');
      if (this.mainWindow && !this.mainWindow.isDestroyed()) {
        this.mainWindow.webContents.send('update-not-available', {
          version: info.version
        });
      }
    });

    autoUpdater.on('error', (err) => {
      console.error('Error in auto-updater:', err);
      if (this.mainWindow && !this.mainWindow.isDestroyed()) {
        this.mainWindow.webContents.send('update-error', {
          message: err.message
        });
      }
    });

    autoUpdater.on('download-progress', (progressObj) => {
      const message = `Download speed: ${progressObj.bytesPerSecond} - Downloaded ${progressObj.percent}% (${progressObj.transferred}/${progressObj.total})`;
      console.log(message);
      if (this.mainWindow && !this.mainWindow.isDestroyed()) {
        this.mainWindow.webContents.send('update-download-progress', {
          percent: progressObj.percent,
          bytesPerSecond: progressObj.bytesPerSecond,
          transferred: progressObj.transferred,
          total: progressObj.total
        });
      }
    });

    autoUpdater.on('update-downloaded', (info) => {
      console.log('Update downloaded:', info.version);
      if (this.mainWindow && !this.mainWindow.isDestroyed()) {
        this.mainWindow.webContents.send('update-downloaded', {
          version: info.version,
          releaseName: info.releaseName,
          releaseNotes: info.releaseNotes
        });
      }
    });
  }

  checkForUpdatesAndNotify() {
    // Check for updates and notify if available
    autoUpdater.checkForUpdatesAndNotify().catch(err => {
      console.error('Failed to check for updates:', err);
    });
  }

  checkForUpdates() {
    // Manual check for updates (returns promise)
    return autoUpdater.checkForUpdates();
  }

  quitAndInstall() {
    // Quit and install the update
    autoUpdater.quitAndInstall(false, true);
  }

  getUpdateInfo() {
    return {
      currentVersion: app.getVersion(),
      updateAvailable: false
    };
  }
}

module.exports = AppUpdater;
