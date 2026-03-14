import { Storage } from './storage.js';

/**
 * Tracks the last active timestamp for each tab.
 */
chrome.tabs.onActivated.addListener(async (activeInfo) => {
    // Record the time the tab was focused
    const tabsData = await Storage.get('tabActivity', {});
    tabsData[activeInfo.tabId] = {
        last_active: Date.now()
    };
    await Storage.set('tabActivity', tabsData);
    console.log(`Tab ${activeInfo.tabId} focused. Recorded activity.`);
});

// Also handle when tabs are closed to cleanup tracking data
chrome.tabs.onRemoved.addListener(async (tabId) => {
    const tabsData = await Storage.get('tabActivity', {});
    if (tabsData[tabId]) {
        delete tabsData[tabId];
        await Storage.set('tabActivity', tabsData);
    }
});
