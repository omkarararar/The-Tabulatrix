import { Storage } from './storage.js';

/**
 * Identifies high-importance tabs that have not been visited recently.
 * For Phase 1, uses basic heuristics.
 */
export const ReminderEngine = {
    async getForgottenTabs() {
        const tabsData = await Storage.get('tabActivity', {});
        const now = Date.now();
        const forgotten = [];
        
        const allTabs = await chrome.tabs.query({});
        for (const tab of allTabs) {
            const activity = tabsData[tab.id];
            if (!activity) continue;
            
            // Heuristic for Phase 1: Not visited in > 6 hours
            if (now - activity.last_active > 6 * 60 * 60 * 1000) {
                // If it's a domain we typically care about, mark as forgotten
                if (tab.url.includes('github') || tab.url.includes('docs')) {
                    forgotten.push(tab);
                }
            }
        }
        
        return forgotten;
    }
};
