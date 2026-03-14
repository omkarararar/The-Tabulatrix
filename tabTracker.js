import { Storage } from './storage.js';

/**
 * Ensures all existing tabs are tracked on startup or reload.
 */
export const initializeExistingTabs = async () => {
    const tabsData = await Storage.get('tabActivity', {});
    const allTabs = await chrome.tabs.query({});
    let changed = false;
    
    for (const tab of allTabs) {
        if (!tabsData[tab.id]) {
            tabsData[tab.id] = { 
                tabId: tab.id,
                url: tab.url,
                title: tab.title,
                last_active: Date.now() 
            };
            changed = true;
        }
    }
    
    if (changed) {
        await Storage.set('tabActivity', tabsData);
        console.log('TabTracker: Initialized tracking for untracked tabs.');
    }
};

/**
 * Tracks the last active timestamp for each tab.
 */
const recordActivity = async (tab) => {
    if (!tab || !tab.id) return;
    
    const tabsData = await Storage.get('tabActivity', {});
    tabsData[tab.id] = {
        tabId: tab.id,
        url: tab.url || tabsData[tab.id]?.url,
        title: tab.title || tabsData[tab.id]?.title,
        last_active: Date.now()
    };
    await Storage.set('tabActivity', tabsData);
    console.log(`Tab ${tab.id} activity recorded.`);
};

// Listeners
chrome.tabs.onActivated.addListener(async (activeInfo) => {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    await recordActivity(tab);
});

chrome.tabs.onCreated.addListener(async (tab) => {
    await recordActivity(tab);
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    // Treat any meaningful change as activity preventing premature idle flag
    if (changeInfo.status === 'complete' || changeInfo.url) {
        await recordActivity(tab);
    }
});

// Also handle when tabs are closed to cleanup tracking data
chrome.tabs.onRemoved.addListener(async (tabId) => {
    const tabsData = await Storage.get('tabActivity', {});
    if (tabsData[tabId]) {
        delete tabsData[tabId];
        await Storage.set('tabActivity', tabsData);
    }
});
