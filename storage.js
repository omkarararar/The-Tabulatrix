/**
 * Typed wrapper for chrome.storage.local
 */
export const Storage = {
    async get(key, defaultValue = null) {
        return new Promise((resolve) => {
            chrome.storage.local.get([key], (result) => {
                resolve(result[key] !== undefined ? result[key] : defaultValue);
            });
        });
    },

    async set(key, value) {
        return new Promise((resolve) => {
            chrome.storage.local.set({ [key]: value }, resolve);
        });
    },

    async remove(key) {
        return new Promise((resolve) => {
            chrome.storage.local.remove([key], resolve);
        });
    }
};
