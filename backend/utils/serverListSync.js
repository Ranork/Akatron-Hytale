const fs = require('fs');
const path = require('path');
const { getHytaleSavesDir } = require('../core/paths');



async function syncServerList() {
  try {
    const hytaleSavesDir = getHytaleSavesDir();
    const serverListPath = path.join(hytaleSavesDir, 'ServerList.json');
    
    // We no longer fetch from external URL to prevent unwanted servers
    // The "Akatron Hytale" server is managed by ensureAkatronServer in gameManager.js
    
    let localData = { SavedServers: [] };
    if (fs.existsSync(serverListPath)) {
      try {
        const localContent = fs.readFileSync(serverListPath, 'utf-8');
        localData = JSON.parse(localContent);
      } catch (parseError) {
        console.warn('[ServerListSync] Failed to parse local server list, creating new one:', parseError.message);
        localData = { SavedServers: [] };
      }
    }

    if (!localData.SavedServers) {
      localData.SavedServers = [];
    }

    // Filter out servers that were previously auto-added (starting with "@ ")
    // Keep user-added servers and the Akatron server (ID check or name check)
    // Note: ensureAkatronServer adds it as "Akatron Hytale" (no "@ ")
    
    const cleanedServers = localData.SavedServers.filter(server => {
      // If it starts with "@ ", it is a legacy auto-added server -> REMOVE
      if (server.Name && server.Name.startsWith("@ ")) {
        return false;
      }
      return true;
    });
    
    if (cleanedServers.length !== localData.SavedServers.length) {
        console.log('[ServerListSync] Removed', localData.SavedServers.length - cleanedServers.length, 'legacy auto-added servers');
        localData.SavedServers = cleanedServers;
        
        if (!fs.existsSync(hytaleSavesDir)) {
            fs.mkdirSync(hytaleSavesDir, { recursive: true });
        }
        
        fs.writeFileSync(serverListPath, JSON.stringify(localData, null, 2), 'utf-8');
        console.log('[ServerListSync] Server list cleaned up');
    } else {
        console.log('[ServerListSync] No cleanup needed');
    }

    return { success: true };
  } catch (error) {
    console.error('[ServerListSync] Failed to synchronize server list:', error.message);
    return { success: false, error: error.message };
  }
}

module.exports = {
  syncServerList
};
