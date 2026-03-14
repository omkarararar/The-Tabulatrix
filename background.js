import { Storage } from './storage.js';
import { initializeExistingTabs } from './tabTracker.js';
import './duplicateDetector.js';
import './idleMonitor.js';

console.log('Tabulatrix background service worker initialized.');

// Initialization
const startUp = async () => {
    chrome.alarms.create('idleCheckAlarm', { periodInMinutes: 1 });
    await initializeExistingTabs();
};

chrome.runtime.onStartup.addListener(startUp);

// Also run initialization directly when the service worker script loads 
// to catch mid-session wakes.
startUp().catch(console.error);

chrome.runtime.onInstalled.addListener(async (details) => {
    if (details.reason === 'install') {
        const hasOnboarded = await Storage.get('onboardingComplete', false);
        if (!hasOnboarded) {
            chrome.tabs.create({ url: 'onboarding/onboarding.html' });
        }
    }
    await startUp();
});

// Remove toast if a tab is navigated away to prevent dead visual states
chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
    if (changeInfo.status === 'loading') {
        // Reset notified state if user starts navigating so the timeout can recount
        Storage.get('tabActivity', {}).then(tabsData => {
            if (tabsData[tabId] && tabsData[tabId].notified) {
                tabsData[tabId].notified = false;
                Storage.set('tabActivity', tabsData);
            }
        });
    }
});

// Handle messages from the injected content script toast
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    /* 
     * Injected scripts don't always have a sender.tab if sent from an extension page,
     * but we pass message.tabId explicitly from the toast script just to be safe.
     */
    const targetTabId = message.tabId || sender.tab?.id;
    if (!targetTabId) return;

    if (message.action === 'closeTab') {
        chrome.tabs.remove(targetTabId).catch(err => console.error("Could not close tab:", err, chrome.runtime.lastError));
        sendResponse({ success: true });
    }
    
    if (message.action === 'snoozeTab') {
        // Reset the last_active time to now + 2 hours
        Storage.get('tabActivity', {}).then(tabsData => {
            if (tabsData[targetTabId]) {
                // Add 2 hours dynamically
                tabsData[targetTabId].last_active = Date.now() + (2 * 60 * 60 * 1000);
                tabsData[targetTabId].notified = false;
                Storage.set('tabActivity', tabsData);
            }
        });
        sendResponse({ success: true });
    }

    if (message.action === 'keepTab') {
        // Just reset to right now
        Storage.get('tabActivity', {}).then(tabsData => {
            if (tabsData[targetTabId]) {
                tabsData[targetTabId].last_active = Date.now();
                tabsData[targetTabId].notified = false;
                Storage.set('tabActivity', tabsData);
            }
        });
        sendResponse({ success: true });
    }
    
    return true; // Keep message channel open for async
});
