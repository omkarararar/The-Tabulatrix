import { Storage } from './storage.js';

/**
 * Classifies tabs into categories.
 * For Phase 1 MVP, uses rule-based classification based on URL/title patterns.
 */
export const Classifier = {
    async classify(url, title) {
        // Placeholder rules for MVP
        const lowerUrl = url.toLowerCase();
        if (lowerUrl.includes('github.com') || lowerUrl.includes('stackoverflow.com')) return 'Code';
        if (lowerUrl.includes('youtube.com')) return 'Video';
        if (lowerUrl.includes('docs') || lowerUrl.includes('notion.so')) return 'Document';
        if (lowerUrl.includes('localhost') || lowerUrl.includes('127.0.0.1')) return 'Dev';
        if (lowerUrl.includes('form') || lowerUrl.includes('typeform')) return 'Form';
        if (lowerUrl.includes('medium.com') || lowerUrl.includes('blog')) return 'Reading';
        return 'Other';
    }
};
