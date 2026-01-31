import './ui.js';
import './install.js';
import './launcher.js';
import './news.js';
import './mods.js';
import './players.js';
import './settings.js';
import './logs.js';
import './bg_rotator.js';

let i18nInitialized = false;
(async () => {
  const savedLang = await window.electronAPI?.loadLanguage();
  await i18n.init(savedLang);
  i18nInitialized = true;
  
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    updateLanguageSelector();
  }
})();

async function checkDiscordPopup() {
  try {
    const config = await window.electronAPI?.loadConfig();
    if (!config || config.discordPopup === undefined || config.discordPopup === false) {
      const modal = document.getElementById('discordPopupModal');
      if (modal) {
        const buttons = modal.querySelectorAll('.discord-popup-btn');
        buttons.forEach(btn => btn.disabled = true);
        
        setTimeout(() => {
          modal.style.display = 'flex';
          modal.classList.add('active');
          
          setTimeout(() => {
            buttons.forEach(btn => btn.disabled = false);
          }, 2000);
        }, 1000);
      }
    }
  } catch (error) {
    console.error('Failed to check Discord popup:', error);
  }
}

window.closeDiscordPopup = function() {
  const modal = document.getElementById('discordPopupModal');
  if (modal) {
    modal.classList.remove('active');
    setTimeout(() => {
      modal.style.display = 'none';
    }, 300);
  }
};

window.joinDiscord = async function() {
  await window.electronAPI?.openExternal('https://discord.gg/hf2pdc');
  
  try {
    await window.electronAPI?.saveConfig({ discordPopup: true });
  } catch (error) {
    console.error('Failed to save Discord popup state:', error);
  }
  
  closeDiscordPopup();
};

function updateLanguageSelector() {
  const langSelect = document.getElementById('languageSelect');
  if (langSelect) {
    // Clear existing options
    langSelect.innerHTML = '';
    
    const languages = i18n.getAvailableLanguages();
    const currentLang = i18n.getCurrentLanguage();
    
    languages.forEach(lang => {
      const option = document.createElement('option');
      option.value = lang.code;
      option.textContent = lang.name;
      if (lang.code === currentLang) {
        option.selected = true;
      }
      langSelect.appendChild(option);
    });
    
    // Handle language change (add listener only once)
    if (!langSelect.hasAttribute('data-listener-added')) {
      langSelect.addEventListener('change', async (e) => {
        await i18n.setLanguage(e.target.value);
      });
      langSelect.setAttribute('data-listener-added', 'true');
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  if (i18nInitialized) {
    updateLanguageSelector();
  }
  
    checkDiscordPopup();

    // Username Set Modal Logic
    if (window.electronAPI && window.electronAPI.onRequestUsername) {
        window.electronAPI.onRequestUsername(() => {
            const modal = document.getElementById('setUsernameModal');
            const input = document.getElementById('welcomePlayerName');
            const confirmBtn = document.getElementById('confirmUsernameBtn');

            if (modal && input && confirmBtn) {
                // Show modal
                modal.classList.remove('hidden');
                // Small delay to allow display:block to apply before opacity transition
                setTimeout(() => {
                    modal.classList.remove('opacity-0');
                    modal.querySelector('.glass-panel').classList.remove('scale-95');
                    input.focus();
                }, 50);

                const saveAndClose = async () => {
                    const newName = input.value.trim();
                    if (newName && newName.length > 0) {
                        try {
                            await window.electronAPI.saveUsername(newName);
                            
                            // Visual feedback
                            const btnSpan = confirmBtn.querySelector('span');
                            if (btnSpan) btnSpan.textContent = "SAVED!";
                            confirmBtn.classList.replace('bg-purple-600', 'bg-green-600');
                            confirmBtn.classList.replace('hover:bg-purple-700', 'hover:bg-green-700');
                            
                            setTimeout(() => {
                                // Hide modal
                                modal.classList.add('opacity-0');
                                modal.querySelector('.glass-panel').classList.add('scale-95');
                                setTimeout(() => {
                                    modal.classList.add('hidden');
                                    // Update UI directly instead of reloading
                                    const nameDisplay = document.getElementById('playerNameDisplay');
                                    const settingsName = document.getElementById('settingsPlayerName');
                                    const nameInput = document.getElementById('playerName'); // The input in the top right
                                    
                                    if (nameDisplay) nameDisplay.textContent = newName;
                                    if (settingsName) settingsName.value = newName;
                                    if (nameInput) nameInput.value = newName;
                                }, 500);
                            }, 500);
                        } catch (err) {
                            console.error("Failed to save username:", err);
                        }
                    } else {
                        input.classList.add('border-red-500');
                        setTimeout(() => input.classList.remove('border-red-500'), 500);
                    }
                };

                confirmBtn.onclick = saveAndClose;
                
                input.onkeypress = (e) => {
                    if (e.key === 'Enter') saveAndClose();
                };
            }
        });
    }
});