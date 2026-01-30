
let API_KEY = "$2a$10$bqk254NMZOWVTzLVJCcxEOmhcyUujKxA5xk.kQCN9q0KNYFJd5b32";
const CURSEFORGE_API = 'https://api.curseforge.com/v1';
const HYTALE_GAME_ID = 70216;

let installedMods = [];
let browseMods = [];
let searchQuery = '';
let modsPage = 0;
let modsPageSize = 20;
let modsTotalPages = 1;
let currentTab = 'browse'; // 'browse' or 'installed'

export async function initModsManager() {
    console.log('Initializing Mods Manager...');
    setupModsEventListeners();
    
    // Initial load
    // await loadInstalledMods(); // Load these when needed or in background
}

function setupModsEventListeners() {
    // Open Modal Button (to be added in index.html)
    const openBtn = document.getElementById('openModsBtn');
    if (openBtn) {
        openBtn.addEventListener('click', openModsModal);
    }

    // Close Modal Button
    const closeBtn = document.getElementById('closeModsModalBtn');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeModsModal);
    }

    // Modal Background Click
    const modal = document.getElementById('modsModal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModsModal();
        });
    }

    // Tabs
    const tabBrowse = document.getElementById('tabBrowse');
    const tabInstalled = document.getElementById('tabInstalled');

    if (tabBrowse) {
        tabBrowse.addEventListener('click', () => switchTab('browse'));
    }
    if (tabInstalled) {
        tabInstalled.addEventListener('click', () => switchTab('installed'));
    }

    // Search
    const searchInput = document.getElementById('modsSearchInput');
    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value.toLowerCase().trim();
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                modsPage = 0;
                refreshCurrentTab();
            }, 500);
        });
    }

    // Pagination
    const prevBtn = document.getElementById('prevPageBtn');
    const nextBtn = document.getElementById('nextPageBtn');

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (modsPage > 0) {
                modsPage--;
                loadBrowseMods();
            }
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            if (modsPage < modsTotalPages - 1) {
                modsPage++;
                loadBrowseMods();
            }
        });
    }
}

function openModsModal() {
    const modal = document.getElementById('modsModal');
    const modalContent = document.getElementById('modsModalContent');
    if (modal) {
        modal.classList.remove('hidden');
        // Small delay to allow display:block to apply before opacity transition
        setTimeout(() => {
            modal.classList.remove('opacity-0');
            if (modalContent) {
                modalContent.classList.remove('scale-95');
                modalContent.classList.add('scale-100');
            }
        }, 10);
        
        refreshCurrentTab();
    }
}

function closeModsModal() {
    const modal = document.getElementById('modsModal');
    const modalContent = document.getElementById('modsModalContent');
    if (modal) {
        modal.classList.add('opacity-0');
        if (modalContent) {
            modalContent.classList.remove('scale-100');
            modalContent.classList.add('scale-95');
        }
        
        setTimeout(() => {
            modal.classList.add('hidden');
        }, 300);
    }
}

function switchTab(tab) {
    currentTab = tab;
    
    // Update UI classes for tabs
    const tabBrowse = document.getElementById('tabBrowse');
    const tabInstalled = document.getElementById('tabInstalled');
    const pagination = document.getElementById('modsPagination');
    
    const activeClass = ['text-purple-600', 'border-b-2', 'border-purple-500', 'pb-0.5', 'font-bold'];
    const inactiveClass = ['text-gray-500', 'hover:text-gray-700'];

    if (tab === 'browse') {
        tabBrowse.classList.add(...activeClass);
        tabBrowse.classList.remove(...inactiveClass);
        
        tabInstalled.classList.remove(...activeClass);
        tabInstalled.classList.add(...inactiveClass);
        
        if (pagination) pagination.style.display = 'flex';
    } else {
        tabInstalled.classList.add(...activeClass);
        tabInstalled.classList.remove(...inactiveClass);
        
        tabBrowse.classList.remove(...activeClass);
        tabBrowse.classList.add(...inactiveClass);
        
        if (pagination) pagination.style.display = 'none';
    }

    refreshCurrentTab();
}

async function refreshCurrentTab() {
    if (currentTab === 'browse') {
        await loadBrowseMods();
    } else {
        await loadInstalledMods();
    }
}

// --- INSTALLED MODS ---

async function loadInstalledMods() {
    const container = document.getElementById('modsListContainer');
    if (!container) return;
    
    const loadingText = window.i18n ? window.i18n.t('mods.loadingInstalled') : 'Loading installed mods...';
    container.innerHTML = `<div class="col-span-full flex flex-col items-center justify-center h-64 text-gray-400">
        <i class="fas fa-spinner fa-spin text-2xl mb-2 text-purple-500"></i>
        <span>${loadingText}</span>
    </div>`;

    try {
        const modsPath = await window.electronAPI?.getModsPath();
        if (!modsPath) throw new Error("Mods path not found");
        
        const mods = await window.electronAPI?.loadInstalledMods(modsPath);
        installedMods = mods || [];
        
        // Filter locally if needed
        let filteredMods = installedMods;
        if (searchQuery) {
            filteredMods = installedMods.filter(m => m.name.toLowerCase().includes(searchQuery));
        }

        displayInstalledMods(filteredMods);
    } catch (error) {
        console.error('Error loading installed mods:', error);
        container.innerHTML = errorState(window.i18n ? window.i18n.t('mods.errorLoadInstalled') : 'Failed to load installed mods');
    }
}

function displayInstalledMods(mods) {
    const container = document.getElementById('modsListContainer');
    if (!container) return;

    if (mods.length === 0) {
        const title = window.i18n ? window.i18n.t('mods.emptyInstalledTitle') : 'No installed mods found';
        const desc = window.i18n ? window.i18n.t('mods.emptyInstalledDesc') : 'Go to Browse to find new mods!';
        container.innerHTML = emptyState(title, desc);
        return;
    }

    container.innerHTML = mods.map(mod => createInstalledModCard(mod)).join('');
    
    // Add event listeners
    mods.forEach(mod => {
        const toggleBtn = document.getElementById(`toggle-${mod.id}`);
        const deleteBtn = document.getElementById(`delete-${mod.id}`);
        const infoBtn = document.getElementById(`info-${mod.id}`);
        
        if (toggleBtn) toggleBtn.addEventListener('click', (e) => { e.stopPropagation(); toggleMod(mod.id); });
        if (deleteBtn) deleteBtn.addEventListener('click', (e) => { e.stopPropagation(); deleteMod(mod.id); });
        if (infoBtn) infoBtn.addEventListener('click', (e) => { e.stopPropagation(); viewModDetails(mod); });
    });
}

function createInstalledModCard(mod) {
    const isActive = mod.enabled;
    return `
    <div class="flex items-center justify-between p-3 rounded-lg hover:shadow-md transition-all group" 
         style="background-color: white; border: 1px solid #e5e7eb;">
        <div class="flex items-center gap-3 overflow-hidden">
            <div class="w-10 h-10 rounded-lg flex items-center justify-center text-purple-500 shrink-0 shadow-sm" style="background-color: #f3f4f6;">
                <i class="fas fa-cube text-lg"></i>
            </div>
            <div class="min-w-0">
                <div class="flex items-center gap-2">
                    <h3 class="text-sm font-bold text-gray-800 truncate group-hover:text-purple-700 transition-colors">${mod.name}</h3>
                    <span class="text-[10px] text-gray-500 font-mono px-1.5 py-0.5 rounded bg-gray-100 border border-gray-200">v${mod.version}</span>
                </div>
                <p class="text-xs text-gray-500 truncate w-64 mt-0.5">${mod.description || 'No description'}</p>
            </div>
        </div>
        
        <div class="flex items-center gap-3 shrink-0">
             <span class="text-[10px] uppercase font-bold tracking-wider ${isActive ? 'text-green-600 bg-green-50 border-green-100' : 'text-gray-400 bg-gray-50 border-gray-100'} px-2 py-1 rounded border">
                ${isActive ? 'Active' : 'Disabled'}
            </span>
            <div class="flex gap-2">
                <button id="info-${mod.id}" class="w-8 h-8 rounded-full flex items-center justify-center transition-colors shadow-sm bg-white border border-gray-200 text-gray-400 hover:text-purple-600 hover:border-purple-200"
                        title="View Details">
                    <i class="fas fa-info"></i>
                </button>
                <button id="toggle-${mod.id}" class="w-8 h-8 rounded-full flex items-center justify-center transition-colors shadow-sm" 
                        style="background-color: ${isActive ? '#f0fdf4' : '#f9fafb'}; color: ${isActive ? '#16a34a' : '#9ca3af'}; border: 1px solid ${isActive ? '#dcfce7' : '#e5e7eb'};"
                        title="${isActive ? 'Disable' : 'Enable'}">
                    <i class="fas fa-power-off text-xs"></i>
                </button>
                <button id="delete-${mod.id}" class="w-8 h-8 rounded-full flex items-center justify-center transition-colors shadow-sm"
                        style="background-color: #fef2f2; color: #ef4444; border: 1px solid #fee2e2;" 
                        title="Uninstall">
                    <i class="fas fa-trash-alt text-xs"></i>
                </button>
            </div>
        </div>
    </div>
    `;
}

// --- BROWSE MODS ---

async function loadBrowseMods() {
    const container = document.getElementById('modsListContainer');
    if (!container) return;

    const loadingText = window.i18n ? window.i18n.t('mods.loadingBrowse') : 'Fetching CurseForge mods...';
    container.innerHTML = `<div class="col-span-full flex flex-col items-center justify-center h-64 text-gray-400">
        <i class="fas fa-circle-notch fa-spin text-3xl mb-4 text-purple-500"></i>
        <span>${loadingText}</span>
    </div>`;

    try {
        if (!API_KEY) throw new Error("API Key logic missing");

        const offset = modsPage * modsPageSize;
        let url = `${CURSEFORGE_API}/mods/search?gameId=${HYTALE_GAME_ID}&pageSize=${modsPageSize}&sortOrder=desc&sortField=6&index=${offset}`;

        if (searchQuery) {
            url += `&searchFilter=${encodeURIComponent(searchQuery)}`;
        }

        const response = await fetch(url, {
            headers: { 'x-api-key': API_KEY, 'Accept': 'application/json' }
        });

        if (!response.ok) throw new Error(`API Error: ${response.status}`);

        const data = await response.json();
        
        browseMods = (data.data || []).map(mod => ({
            id: mod.id.toString(),
            name: mod.name,
            summary: mod.summary || (window.i18n ? window.i18n.t('mods.noDescription') : 'No description'),
            downloadCount: mod.downloadCount || 0,
            author: mod.authors?.[0]?.name || (window.i18n ? window.i18n.t('mods.unknown') : 'Unknown'),
            version: mod.latestFiles?.[0]?.displayName || (window.i18n ? window.i18n.t('mods.unknown') : 'Unknown'),
            thumbnailUrl: mod.logo?.thumbnailUrl || null,
            modId: mod.id,
            fileId: mod.latestFiles?.[0]?.id,
            fileName: mod.latestFiles?.[0]?.fileName,
            downloadUrl: mod.latestFiles?.[0]?.downloadUrl,
            websiteUrl: mod.links?.websiteUrl || null
        }));

        modsTotalPages = Math.ceil((data.pagination?.totalCount || 1) / modsPageSize);
        displayBrowseMods(browseMods);
        updatePaginationUI();

    } catch (error) {
        console.error('Error loading browse mods:', error);
        container.innerHTML = errorState(window.i18n ? window.i18n.t('mods.errorLoadBrowse') : 'Failed to connect to CurseForge');
    }
}

function displayBrowseMods(mods) {
    const container = document.getElementById('modsListContainer');
    if (!container) return;

    if (mods.length === 0) {
        const title = window.i18n ? window.i18n.t('mods.emptyBrowseTitle') : 'No mods found';
        const desc = window.i18n ? window.i18n.t('mods.emptyBrowseDesc') : 'Try searching for something else.';
        container.innerHTML = emptyState(title, desc);
        return;
    }

    container.innerHTML = mods.map(mod => createBrowseModCard(mod)).join('');
    
    mods.forEach(mod => {
        const installBtn = document.getElementById(`install-${mod.id}`);
        const infoBtn = document.getElementById(`info-browse-${mod.id}`);

        if (installBtn && !installBtn.disabled) {
            installBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                downloadAndInstallMod(mod);
            });
        }
        if (infoBtn) {
            infoBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                viewModDetails(mod);
            });
        }
    });
}

function createBrowseModCard(mod) {
    const isInstalled = installedMods.some(m => 
        (m.curseForgeId && m.curseForgeId.toString() === mod.id) || 
        (m.name.toLowerCase() === mod.name.toLowerCase())
    );
    
    // Safety check for URL
    const openUrlScript = mod.websiteUrl ? `onclick="window.open('${mod.websiteUrl}', '_blank')"` : '';

    return `
    <div class="flex items-center justify-between p-3 rounded-lg hover:shadow-md transition-all group"
         style="background-color: white; border: 1px solid #e5e7eb;">
        <div class="flex items-center gap-3 overflow-hidden">
             <!-- Icon -->
            <div class="w-10 h-10 rounded-lg flex items-center justify-center text-gray-400 shrink-0 relative overflow-hidden shadow-sm" style="background-color: #f3f4f6;">
                 ${mod.thumbnailUrl 
                    ? `<img src="${mod.thumbnailUrl}" class="w-full h-full object-cover opacity-90" alt="">`
                    : `<i class="fas fa-puzzle-piece text-lg"></i>`
                }
            </div>
            
            <div class="min-w-0 flex flex-col justify-center">
                 <div class="flex items-center gap-2">
                    <h3 class="text-sm font-bold text-gray-800 truncate group-hover:text-purple-600 transition-colors">${mod.name}</h3>
                    <div class="flex items-center text-[10px] text-gray-500 gap-2">
                        <span>by ${mod.author}</span>
                        <span class="flex items-center gap-1 text-gray-400"><i class="fas fa-download text-[9px]"></i> ${formatNumber(mod.downloadCount)}</span>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="flex items-center gap-2 shrink-0">
             <button id="info-browse-${mod.id}" class="w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:text-purple-600 hover:bg-white border border-transparent hover:border-gray-200 transition-colors" title="View Details">
                 <i class="fas fa-info-circle"></i>
             </button>

             ${mod.websiteUrl ? `
                <button ${openUrlScript} class="w-7 h-7 rounded-md flex items-center justify-center text-gray-400 hover:text-purple-600 hover:bg-purple-50 transition-colors" title="View Page" style="border: 1px solid transparent;">
                    <i class="fas fa-external-link-alt text-xs"></i>
                </button>
             ` : ''}

             ${isInstalled 
                ? `<span class="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-1 rounded border border-green-100"><i class="fas fa-check mr-1"></i>INSTALLED</span>`
                : `<button id="install-${mod.id}" class="px-3 py-1.5 rounded-md text-white text-xs font-bold transition-all flex items-center gap-1 shadow-sm hover:shadow"
                     style="background-color: #9333ea; border: 1px solid #7e22ce;">
                     <i class="fas fa-download text-[10px]"></i> ${window.i18n ? window.i18n.t('mods.get') : 'GET'}
                   </button>`
            }
        </div>
    </div>
    `;
}

// --- ACTIONS ---

async function downloadAndInstallMod(modInfo) {
    const btn = document.getElementById(`install-${modInfo.id}`);
    if (btn) {
        const readingText = window.i18n ? window.i18n.t('mods.reading') : 'READING...';
        btn.innerHTML = `<i class="fas fa-circle-notch fa-spin"></i> ${readingText}`;
        btn.disabled = true;
        btn.classList.add('opacity-75');
    }

    try {
        const result = await window.electronAPI?.downloadMod(modInfo); // Assume this API exists from legacy
        
        if (result?.success) {
            // Optimistic Update
            installedMods.push({
                id: result.modInfo?.id || Date.now(),
                name: modInfo.name,
                version: modInfo.version,
                enabled: true,
                curseForgeId: modInfo.modId
            });
            
            if (btn) {
                btn.classList.remove('bg-purple-600', 'hover:bg-purple-500', 'text-white', 'shadow-purple-600/20');
                btn.classList.add('bg-green-600', 'text-white');
                const doneText = window.i18n ? window.i18n.t('mods.done') : 'DONE';
                btn.innerHTML = `<i class="fas fa-check"></i> ${doneText}`;
                setTimeout(() => { refreshCurrentTab(); }, 1000);
            }
        } else {
            throw new Error(result?.error || 'Download failed');
        }
    } catch (e) {
        console.error(e);
        if (btn) {
             const errorText = window.i18n ? window.i18n.t('mods.error') : 'ERROR';
             btn.innerHTML = `<i class="fas fa-times"></i> ${errorText}`;
             btn.classList.add('bg-red-600');
             const retryText = window.i18n ? window.i18n.t('mods.retry') : 'RE-TRY';
             setTimeout(() => { 
                btn.innerHTML = `<i class="fas fa-download"></i> ${retryText}`; 
                btn.disabled = false; 
                btn.classList.remove('bg-red-600', 'opacity-75');
                btn.classList.add('bg-purple-600');
            }, 3000);
        }
    }
}


async function toggleMod(modId) {
    // Assuming backend toggle API
    const modsPath = await window.electronAPI?.getModsPath();
    const result = await window.electronAPI?.toggleMod(modId, modsPath);
    if (result?.success) {
        await loadInstalledMods();
    }
}

async function deleteMod(modId) {
    if (!confirm('Are you sure you want to delete this mod?')) return;
    
    const modsPath = await window.electronAPI?.getModsPath();
    const result = await window.electronAPI?.uninstallMod(modId, modsPath);
    if (result?.success) {
        await loadInstalledMods();
    }
}


// --- DETAILS ---

async function viewModDetails(mod) {
    const listContainer = document.getElementById('modsListContainer');
    const detailsContainer = document.getElementById('modDetailsContainer');
    const pagination = document.getElementById('modsPagination');
    const searchDiv = document.querySelector('#modsModalContent .relative'); // Search bar container

    if (listContainer) listContainer.style.display = 'none';
    if (pagination) pagination.style.display = 'none';
    if (searchDiv) searchDiv.style.visibility = 'hidden';

    if (detailsContainer) {
        detailsContainer.style.display = 'flex';
        detailsContainer.innerHTML = `
            <div class="flex-1 flex flex-col items-center justify-center text-gray-400">
                <i class="fas fa-sync fa-spin text-3xl mb-3 text-purple-500"></i>
                <p>Loading details...</p>
            </div>
        `;

        // Fetch Description
        let descriptionHtml = '<p class="text-gray-500 italic">No description available.</p>';
        try {
            const modId = mod.curseForgeId || mod.modId;
            if (modId) {
                const response = await fetch(`${CURSEFORGE_API}/mods/${modId}/description`, {
                    headers: { 'x-api-key': API_KEY, 'Accept': 'application/json' }
                });
                if (response.ok) {
                    const data = await response.json();
                    if (data.data) descriptionHtml = data.data;
                }
            }
        } catch (e) {
            console.error("Error fetching description", e);
            descriptionHtml = '<p class="text-red-400">Failed to load description.</p>';
        }

        const isInstalled = installedMods.some(m => m.name === mod.name); // Simple check

        detailsContainer.innerHTML = `
            <!-- Details Header -->
            <div class="p-6 bg-white border-b border-gray-200 shrink-0 flex gap-5 items-start">
                <div class="w-20 h-20 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400 overflow-hidden shadow-sm shrink-0">
                    ${mod.thumbnailUrl ? `<img src="${mod.thumbnailUrl}" class="w-full h-full object-cover">` : '<i class="fas fa-cube text-3xl"></i>'}
                </div>
                <div class="flex-1 min-w-0">
                    <h2 class="text-2xl font-bold text-gray-800 truncate">${mod.name}</h2>
                    <div class="flex items-center gap-3 text-sm text-gray-500 mt-1">
                        <span class="bg-gray-100 px-2 py-0.5 rounded border border-gray-200"><i class="fas fa-user mr-1"></i> ${mod.author}</span>
                        <span class="bg-gray-100 px-2 py-0.5 rounded border border-gray-200"><i class="fas fa-download mr-1"></i> ${formatNumber(mod.downloadCount)}</span>
                    </div>
                    <p class="text-sm text-gray-600 mt-2 line-clamp-2">${mod.summary || mod.description || ''}</p>
                </div>
                <div class="flex flex-col gap-2 shrink-0">
                     <button onclick="closeModDetails()" class="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold text-xs transition-colors mb-2">
                        <i class="fas fa-arrow-left mr-1"></i> ${window.i18n ? window.i18n.t('mods.back') : 'BACK'}
                    </button>
                    ${!isInstalled ? `
                    <button id="detail-install-btn" class="px-5 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm shadow-md transition-all active:scale-95">
                        ${window.i18n ? window.i18n.t('mods.install') : 'INSTALL'}
                    </button>` : `
                    <button class="px-5 py-2 rounded-lg bg-green-50 text-green-600 border border-green-200 font-bold text-sm cursor-default">
                        ${window.i18n ? window.i18n.t('mods.installed') : 'INSTALLED'}
                    </button>
                    `}
                </div>
            </div>
            <!-- HTML Content -->
            <div class="p-6 text-gray-700 prose prose-sm max-w-none prose-purple leading-relaxed">
                ${descriptionHtml}
            </div>
        `;
        
        // Bind install button in details view
        const detailInstallBtn = document.getElementById('detail-install-btn');
        if(detailInstallBtn) {
             detailInstallBtn.addEventListener('click', () => {
                 downloadAndInstallMod(mod);
                 detailInstallBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
                 setTimeout(() => closeModDetails(), 1000); 
             });
        }
    }
}

function closeModDetails() {
    const listContainer = document.getElementById('modsListContainer');
    const detailsContainer = document.getElementById('modDetailsContainer');
    const pagination = document.getElementById('modsPagination');
    const searchDiv = document.querySelector('#modsModalContent .relative');

    if (detailsContainer) {
        detailsContainer.style.display = 'none';
        detailsContainer.innerHTML = ''; // Clear to save memory
    }

    if (listContainer) listContainer.style.display = 'flex'; // Restore flex
    if (searchDiv) searchDiv.style.visibility = 'visible';
    
    // Restore pagination only if we are in Browse tab
    if (currentTab === 'browse' && pagination) {
        pagination.style.display = 'flex';
    }
}

window.closeModDetails = closeModDetails; // Expose to global for button onclick

// --- UTILS ---

function updatePaginationUI() {
    const pageInfo = document.getElementById('addPageInfo');
    const prevBtn = document.getElementById('prevPageBtn');
    const nextBtn = document.getElementById('nextPageBtn');

    if (pageInfo) pageInfo.innerText = `${modsPage + 1}/${modsTotalPages}`;
    
    if (prevBtn) {
        prevBtn.disabled = modsPage === 0;
        prevBtn.style.opacity = modsPage === 0 ? '0.3' : '1';
    }
    if (nextBtn) {
        nextBtn.disabled = modsPage >= modsTotalPages - 1;
        nextBtn.style.opacity = modsPage >= modsTotalPages - 1 ? '0.3' : '1';
    }
}

function emptyState(title, subtitle) {
    return `
    <div class="col-span-full flex flex-col items-center justify-center h-64 text-gray-400 text-center">
        <i class="fas fa-ghost text-4xl mb-3 text-gray-300"></i>
        <h3 class="text-lg font-bold text-gray-600">${title}</h3>
        <p class="text-sm text-gray-400">${subtitle}</p>
    </div>`;
}

function errorState(msg) {
    return `
    <div class="col-span-full flex flex-col items-center justify-center h-64 text-red-400 text-center">
        <i class="fas fa-exclamation-triangle text-3xl mb-3"></i>
        <p>${msg}</p>
    </div>`;
}

function formatNumber(num) {
    if (!num) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
}

window.initModsManager = initModsManager;
