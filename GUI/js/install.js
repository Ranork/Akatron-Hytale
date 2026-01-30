
let isDownloading = false;

// Reusing the main UI elements
let playBtn;
let playText;
let playerNameInput;

export function setupInstallation() {
  playBtn = document.getElementById('playBtn');
  playText = document.getElementById('playText');
  playerNameInput = document.getElementById('playerName');

  if (playerNameInput) {
    playerNameInput.addEventListener('change', savePlayerName);
  }

  if (window.electronAPI && window.electronAPI.onProgressUpdate) {
    window.electronAPI.onProgressUpdate((data) => {
      if (!isDownloading) return;
      if (window.LauncherUI) {
        window.LauncherUI.updateProgress(data);
      }
    });
  }
}

export async function installGame() {
  if (isDownloading || (playBtn && playBtn.disabled)) return;
  
  const playerName = (playerNameInput ? playerNameInput.value.trim() : '') || 'Player';
  const installPath = ''; // Use default
  const selectedBranch = 'release'; // Force release
  
  console.log(`[Install] Installing game with branch: ${selectedBranch}`);
  
  if (window.LauncherUI) window.LauncherUI.showProgress();
  isDownloading = true;
  lockInstallForm();
  
  if (playBtn) {
    playBtn.disabled = true;
    if (playText) playText.textContent = window.i18n ? window.i18n.t('install.installing') : 'INSTALLING...';
  }
  
  try {
    if (window.electronAPI && window.electronAPI.installGame) {
      const result = await window.electronAPI.installGame(playerName, '', installPath, selectedBranch);
      
      if (result.success) {
        const successMsg = window.i18n ? window.i18n.t('progress.installationComplete') : 'Installation completed successfully!';
        if (window.LauncherUI) {
          window.LauncherUI.updateProgress({ message: successMsg });
          setTimeout(() => {
            window.LauncherUI.hideProgress();
            window.LauncherUI.showLauncherOrInstall(true); // Switches button to PLAY mode
            const input = document.getElementById('playerName');
            if (input) input.value = playerName;
            resetInstallButton(); // Actually just unlocks form
          }, 2000);
        }
      } else {
        throw new Error(result.error || 'Installation failed');
      }
    } else {
      simulateInstallation(playerName);
    }
  } catch (error) {
    const errorMsg = window.i18n ? window.i18n.t('progress.installationFailed').replace('{error}', error.message) : `Installation failed: ${error.message}`;
    
    // Reset button state and unlock form on error
    resetInstallButton();
    
    if (window.LauncherUI) {
      window.LauncherUI.updateProgress({ message: errorMsg });
    }
  }
}

function simulateInstallation(playerName) {
  // ... (keeping simulation for fallback/testing if needed, simplified)
  let progress = 0;
  const interval = setInterval(() => {
    progress += Math.random() * 5;
    if (progress > 100) progress = 100;
    
    if (window.LauncherUI) {
      window.LauncherUI.updateProgress({
        percent: progress,
        message: 'Installing...',
        speed: 1024 * 1024 * 10,
        downloaded: progress * 1024 * 1024,
        total: 1024 * 1024 * 100
      });
    }
    
    if (progress >= 100) {
      clearInterval(interval);
      if (window.LauncherUI) {
        window.LauncherUI.hideProgress();
        window.LauncherUI.showLauncherOrInstall(true);
        resetInstallButton();
      }
    }
  }, 100);
}

function resetInstallButton() {
  isDownloading = false;
  // We don't force text to 'INSTALL' here because success might have switched it to 'PLAY' via showLauncherOrInstall
  // We only unlock the button
  if (playBtn) {
    playBtn.disabled = false;
  }
  unlockInstallForm();
}

function lockInstallForm() {
  if (playerNameInput) playerNameInput.disabled = true;
}

function unlockInstallForm() {
  if (playerNameInput) playerNameInput.disabled = false;
}

export async function browseInstallPath() {
   // Removed but kept export to avoid import errors if referenced
}

async function savePlayerName() {
  try {
    if (window.electronAPI && window.electronAPI.saveUsername) {
        const playerName = (playerNameInput ? playerNameInput.value.trim() : '') || 'Player';
        await window.electronAPI.saveUsername(playerName);
    } else if (window.electronAPI && window.electronAPI.saveSettings) {
      const playerName = (playerNameInput ? playerNameInput.value.trim() : '') || 'Player';
      await window.electronAPI.saveSettings({ playerName });
    }
  } catch (error) {
    console.error('Error saving player name:', error);
  }
}

export async function checkGameStatusAndShowInterface() {
  try {
    if (window.electronAPI && window.electronAPI.isGameInstalled) {
      const installed = await window.electronAPI.isGameInstalled();
      if (window.LauncherUI) {
        window.LauncherUI.showLauncherOrInstall(installed);
      }
      if (installed) {
        await loadPlayerSettings();
      }
    } else {
      if (window.LauncherUI) {
        window.LauncherUI.showLauncherOrInstall(false);
      }
    }
  } catch (error) {
    console.error('Error checking game status:', error);
    if (window.LauncherUI) {
      window.LauncherUI.showLauncherOrInstall(false);
    }
  }
}

async function loadPlayerSettings() {
  try {
    if (window.electronAPI && window.electronAPI.loadSettings) {
      const settings = await window.electronAPI.loadSettings();
      if (settings) {
        const input = document.getElementById('playerName');
        if (settings.playerName && input) {
          input.value = settings.playerName;
        }
      }
    }
  } catch (error) {
    console.error('Error loading settings:', error);
  }
}

window.installGame = installGame;

document.addEventListener('DOMContentLoaded', async () => {
  setupInstallation();
  await checkGameStatusAndShowInterface();
});
