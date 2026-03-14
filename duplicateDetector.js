import { Storage } from './storage.js';

/**
 * Normalizes a URL by stripping tracking parameters, trailing slashes, and www prefixes.
 */
function normalizeUrl(url) {
    if (!url) return '';
    try {
        const urlObj = new URL(url);
        // Stripping common tracking params
        const paramsToRemove = ['utm_source', 'utm_medium', 'utm_campaign', 'ref'];
        paramsToRemove.forEach(param => urlObj.searchParams.delete(param));
        
        let path = urlObj.pathname.replace(/\/$/, ''); // Remove trailing slash
        let host = urlObj.hostname.replace(/^www\./, ''); // Remove www
        
        return `${urlObj.protocol}//${host}${path}${urlObj.search}`;
    } catch {
        return url;
    }
}

/**
 * Detects duplicates across tabs and fires pre-close flow on the older one.
 */
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, currentTab) => {
    if (changeInfo.status === 'complete' && currentTab.url) {
        const normalizedCurrent = normalizeUrl(currentTab.url);
        
        // Find if this URL already exists in other tabs
        const allTabs = await chrome.tabs.query({});
        const duplicates = allTabs.filter(t => 
            t.id !== tabId && 
            normalizeUrl(t.url) === normalizedCurrent
        );

        if (duplicates.length > 0) {
            console.log(`Duplicate detected for URL: ${normalizedCurrent}`);
            // TODO: Trigger pre-close flow on the older tab(s)
            // For MVP, just log it.
        }
    }
});
