import './storage.js';
import './tabTracker.js';
import './duplicateDetector.js';
import './idleMonitor.js';

console.log('Tabulatrix background service worker initialized.');

// On installation, open the onboarding wizard.
chrome.runtime.onInstalled.addListener(async (details) => {
    if (details.reason === 'install') {
        chrome.tabs.create({ url: 'onboarding/onboarding.html' });
    }
});
