const backgrounds = [
    './img/bg-1.jpg',
    './img/bg-2.jpg',
    './img/bg-3.jpg',
    './img/bg-4.jpg'
];

// Configuration
const ROTATION_INTERVAL = 30000; // 10 seconds
const FADE_DURATION = 1000; // 1 second (must match CSS)

let currentBgIndex = -1;
let rotationTimer = null;

function getRandomIndex(excludeIndex) {
    if (backgrounds.length <= 1) return 0;
    
    let newIndex;
    do {
        newIndex = Math.floor(Math.random() * backgrounds.length);
    } while (newIndex === excludeIndex);
    
    return newIndex;
}

function preloadImages() {
    backgrounds.forEach(src => {
        const img = new Image();
        img.src = src;
    });
}

function rotateBackground() {
    const container = document.getElementById('bg-container');
    if (!container) return;

    // Pick next image
    const nextIndex = getRandomIndex(currentBgIndex);
    const nextSrc = backgrounds[nextIndex];
    currentBgIndex = nextIndex;

    // Create new image element
    const newImg = document.createElement('img');
    newImg.src = nextSrc;
    newImg.alt = 'Background';
    newImg.className = 'absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 opacity-0';
    newImg.style.zIndex = '0'; // Ensure it's behind content but we handle z-index by order usually
    
    // Position: We append it. Since it's absolute, it stacks on top of earlier children.
    // We want to fade it IN on top of the current one.
    container.appendChild(newImg);

    // Force reflow to ensure transition works
    void newImg.offsetWidth;
    
    // Fade in
    newImg.classList.remove('opacity-0');

    // Clean up old image after fade
    setTimeout(() => {
        const oldImages = container.querySelectorAll('img');
        if (oldImages.length > 1) {
            // Remove all but the last one (the new one)
            for (let i = 0; i < oldImages.length - 1; i++) {
                oldImages[i].remove();
            }
        }
    }, FADE_DURATION);
}

export function initBackgroundRotator() {
    console.log('[BG] Initializing background rotator...');
    
    // Start with a random one if we want specific initial randomness, 
    // but the HTML already has bg-1. Let's stick with that or randomize immediately?
    // User said "rasgele değişe değişe", so let's randomize start too if possible, 
    // but better to load fast. We will just start rotation.
    
    // Determine current index based on existing img if possible, or just -1
    // Actually, let's just start rotation loop.
    
    preloadImages();

    // Set initial random background
    const container = document.getElementById('bg-container');
    if (container) {
        const img = container.querySelector('img');
        if (img) {
            const startIndex = getRandomIndex(-1);
            img.src = backgrounds[startIndex];
            currentBgIndex = startIndex;
        }
    }

    // Start rotation
    rotationTimer = setInterval(rotateBackground, ROTATION_INTERVAL);
}

// Auto-init if DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBackgroundRotator);
} else {
    initBackgroundRotator();
}
