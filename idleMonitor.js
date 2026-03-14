import { Storage } from './storage.js';

/**
 * Checks open tabs every 5 minutes to see if any have exceeded the idle threshold.
 */
chrome.alarms.create('idleCheckAlarm', { periodInMinutes: 5 });

chrome.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name === 'idleCheckAlarm') {
        const thresholdMs = await Storage.get('idleThreshold', 30 * 60 * 1000); // Default 30 min
        const tabsData = await Storage.get('tabActivity', {});
        const now = Date.now();
        
        const allTabs = await chrome.tabs.query({});
        for (const tab of allTabs) {
            if (tab.pinned) continue; // Skip pinned
            
            const activity = tabsData[tab.id];
            if (activity && (now - activity.last_active > thresholdMs)) {
                console.log(`Tab ${tab.id} has been idle for over ${thresholdMs / 60000} mins. Triggering preclose flow...`);
                // TODO: Trigger pre-close UI
            }
        }
    }
});
