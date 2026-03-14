import { Storage } from './storage.js';

/**
 * Checks open tabs every minute to see if any have exceeded the idle threshold.
 */
chrome.alarms.create('idleCheckAlarm', { periodInMinutes: 1 });

chrome.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name === 'idleCheckAlarm') {
        const thresholdMs = await Storage.get('idleThreshold', 60 * 60 * 1000); // Default 1 hour

        
        const tabsData = await Storage.get('tabActivity', {});
        const now = Date.now();
        const allTabs = await chrome.tabs.query({});
        
        for (const tab of allTabs) {
            // Protected tabs that should never get a toast
            if (tab.pinned || tab.active || tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
                continue;
            }
            
            let activity = tabsData[tab.id];
            
            // Handle missing timestamps gracefully gracefully (Fix #4)
            if (!activity || !activity.last_active) {
                activity = { last_active: now - thresholdMs - 1000 }; 
                tabsData[tab.id] = activity;
            }
            
            if (now - activity.last_active > thresholdMs) {
                if (activity.notified) continue;
                
                tabsData[tab.id].notified = true;
                await Storage.set('tabActivity', tabsData);

                console.log(`TabTracker: Tab ${tab.id} idle. Injecting toast...`);
                
                try {
                    // Injecting standalone Shadow DOM toast directly into the idle tab
                    await chrome.scripting.executeScript({
                        target: { tabId: tab.id },
                        func: injectToast,
                        args: [tab.id, tab.title || 'Unknown Tab', 'Uncategorized'] // Using 'Uncategorized' for MVP until AI is ready
                    });
                } catch (err) {
                    console.error(`TabTracker: Failed to inject script into ${tab.id}`, chrome.runtime.lastError, err);
                    tabsData[tab.id].notified = false; // Reset if injection failed
                    await Storage.set('tabActivity', tabsData);
                }
            }
        }
    }
});

// The fully self-contained script to be injected into the idle page
function injectToast(tabId, tabTitle, category) {
    // Prevent double-injection
    if (document.getElementById('tabulatrix-toast-root')) return;

    // Create host for Shadow DOM
    const host = document.createElement('div');
    host.id = 'tabulatrix-toast-root';
    host.style.position = 'fixed';
    host.style.bottom = '20px';
    host.style.right = '20px';
    host.style.zIndex = '2147483647'; // Max z-index
    document.body.appendChild(host);

    const shadow = host.attachShadow({ mode: 'open' });

    // Styles
    const style = document.createElement('style');
    style.textContent = `
        @font-face {
            font-family: 'Departure Mono';
            src: url('${chrome.runtime.getURL('assets/fonts/DepartureMono-Regular.woff2')}') format('woff2');
        }
        @font-face {
            font-family: 'Geist';
            src: url('${chrome.runtime.getURL('assets/fonts/Geist-Regular.woff2')}') format('woff2');
        }
        
        .toast {
            width: 320px;
            background: oklch(20% 0.02 250); /* --bg-card */
            border: 1px solid oklch(35% 0.02 250); /* --border */
            border-radius: 12px;
            padding: 16px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.5);
            font-family: 'Geist', sans-serif;
            color: oklch(98% 0.01 250); /* --text-primary */
            display: flex;
            flex-direction: column;
            gap: 12px;
            
            /* Initial Animation State */
            transform: translateY(20px);
            opacity: 0;
            transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.4s ease;
        }
        
        .toast.visible {
            transform: translateY(0);
            opacity: 1;
        }

        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .badge {
            background: oklch(15% 0.02 250); /* --bg */
            color: oklch(75% 0.15 250); /* --primary-light */
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
        }

        .countdown {
            font-family: 'Departure Mono', monospace;
            color: oklch(75% 0.15 70); /* Variable warning color if needed, or keep red-ish */
            font-weight: bold;
        }

        .title {
            margin: 0;
            font-size: 14px;
            font-weight: 600;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        
        .desc {
            margin: 0;
            font-size: 13px;
            color: oklch(75% 0.02 250); /* --text-secondary */
        }

        .actions {
            display: flex;
            gap: 8px;
            margin-top: 4px;
        }

        button {
            flex: 1;
            padding: 8px;
            border: 1px solid oklch(35% 0.02 250); /* --border */
            background: oklch(20% 0.02 250); /* --bg-card */
            color: oklch(98% 0.01 250); /* --text-primary */
            border-radius: 6px;
            font-family: inherit;
            font-size: 13px;
            cursor: pointer;
            transition: background 0.2s;
        }

        button:hover {
            background: oklch(25% 0.02 250); /* --bg-hover */
        }

        button.primary {
            background: oklch(65% 0.15 250); /* --primary */
            color: white;
            border: none;
            font-weight: 600;
        }

        button.primary:hover {
            background: oklch(45% 0.15 250); /* --primary-dark */
        }
    `;

    // Markup
    const wrapper = document.createElement('div');
    wrapper.className = 'toast';
    
    // Truncate title
    const safeTitle = tabTitle.length > 40 ? tabTitle.substring(0, 37) + '...' : tabTitle;

    wrapper.innerHTML = `
        <div class="header">
            <span class="badge">${category}</span>
            <span class="countdown" id="t-countdown">60s</span>
        </div>
        <h3 class="title">${safeTitle}</h3>
        <p class="desc">This tab has been idle. Closing soon to save memory.</p>
        <div class="actions">
            <button id="btnKeep">Keep Open</button>
            <button id="btnSnooze">Snooze 2h</button>
            <button id="btnClose" class="primary">Close Tab</button>
        </div>
    `;

    shadow.appendChild(style);
    shadow.appendChild(wrapper);

    // Trigger entrance animation
    setTimeout(() => wrapper.classList.add('visible'), 50);

    // Logic
    let timeLeft = 60;
    const countdownEl = shadow.getElementById('t-countdown');
    
    const sendMsg = (action) => {
        chrome.runtime.sendMessage({ action, tabId });
        host.remove(); // Remove toast from DOM
    };

    const timer = setInterval(() => {
        timeLeft--;
        countdownEl.textContent = `${timeLeft}s`;
        if (timeLeft <= 0) {
            clearInterval(timer);
            sendMsg('closeTab');
        }
    }, 1000);

    shadow.getElementById('btnKeep').addEventListener('click', () => {
        clearInterval(timer);
        sendMsg('keepTab');
    });

    shadow.getElementById('btnSnooze').addEventListener('click', () => {
        clearInterval(timer);
        sendMsg('snoozeTab');
    });
    
    shadow.getElementById('btnClose').addEventListener('click', () => {
        clearInterval(timer);
        sendMsg('closeTab');
    });
}
