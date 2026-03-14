import autoAnimate from '../assets/lib/auto-animate.js';

document.addEventListener('DOMContentLoaded', async () => {
    console.log('Popup initialized.');
    
    // Enable auto-animate for tab lists
    const forgottenList = document.getElementById('forgottenList');
    if (forgottenList) {
        autoAnimate(forgottenList);
    }

    const categoryCards = document.getElementById('categoryCards');
    if (categoryCards) {
        autoAnimate(categoryCards);
    }
    
    // Settings Navigation
    document.getElementById('settingsBtn')?.addEventListener('click', () => {
        chrome.runtime.openOptionsPage();
    });

    // Run Cleanup
    document.getElementById('runCleanupBtn')?.addEventListener('click', () => {
        // Trigger idle cleanup manually
    });
});
