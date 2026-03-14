# Tabulatrix — Project Aim & Vision Document

## One-Line Definition
Tabulatrix is an AI-powered Chrome extension that acts as an intelligent browser manager — automatically cleaning, categorizing, and remembering your tabs so your browser reflects what actually matters to you.

---

## The Problem

Every developer, student, and knowledge worker lives with the same silent disease: tab overload.

It starts innocently. You open a Stack Overflow answer while debugging. A YouTube tutorial you'll "watch later." A GitHub repo that looked interesting. A half-filled form you need to come back to. A docs page you were reading. A news article. Another Stack Overflow tab — possibly the same one you already had open.

Before you know it, you have 40, 60, sometimes over 100 tabs open. Your browser slows down. Your mental overhead spikes every time you try to find something. The tabs you actually care about are buried under an avalanche of things you opened with good intentions and promptly forgot about. You close your laptop and reopen it the next day to the exact same chaos.

The worst part is not the clutter itself — it is what the clutter hides. Somewhere in those 60 tabs is a genuinely useful article you were going to read, a half-finished side project on localhost, an incomplete job application form, a library you were planning to explore. These things disappear into the noise, and you forget they exist until it is too late.

Existing solutions — tab grouping, bookmarks, reading lists — require you to actively manage your browser. They put the burden back on you. They assume you will remember to save something before it gets lost. You won't. Nobody does.

Tabulatrix flips this entirely. Instead of you managing your browser, your browser manages itself.

---

## What Tabulatrix Does

Tabulatrix is a Chrome extension that runs silently in the background and takes care of your tabs autonomously. It does not wait for you to act. It watches, learns, decides, and cleans — and it only interrupts you when something genuinely needs your input, like whether to schedule an important tab to your Google Calendar before closing it.

At its core, Tabulatrix does six things:

**1. Tracks tab activity in real time**
Every tab gets a timestamp every time it is focused. Tabulatrix knows exactly when you last looked at each tab, which ones you keep returning to, and which ones have been sitting untouched for hours. This activity data is the foundation of every decision the extension makes.

**2. Kills duplicates instantly**
The moment you open a URL you already have in another tab, Tabulatrix detects it, normalizes the URLs (stripping tracking parameters, trailing slashes, and www prefixes), and triggers the pre-close flow on the older copy. No silent auto-deletion — you get a popup asking whether to schedule it, snooze it, or close it. But the default behavior pushes toward a clean browser.

**3. Categorizes every tab intelligently**
Every open tab is assigned a category: Code, Video, Document, Form, Reading, Dev (localhost), or Other. This categorization runs in two modes depending on the user's setup. In rule-based mode, it uses URL pattern matching — GitHub is Code, YouTube watch pages are Video, localhost ports are Dev, and so on. In AI mode, it sends batches of tab titles and URLs to the Claude API and gets back a category, an importance score from 1 to 10, and a one-line summary of what the tab is about. The AI mode catches everything the rules miss — a random blog post about a performance optimization technique, a niche documentation page, a tool you have never seen before.

**4. Surfaces forgotten useful tabs**
This is the feature that makes Tabulatrix genuinely different from anything else on the market. After categorizing and scoring tabs, the Reminder Engine identifies tabs that are high-importance but have not been visited in a long time. A tab about a coding technique you were planning to implement, a document you started reading, a job application you have not submitted yet — these get surfaced in the popup dashboard under a dedicated "You forgot about these" section, highlighted so they are impossible to miss. The extension effectively acts as your browser's memory.

**5. Auto-closes idle tabs with a safety net**
When a tab crosses the user-configured idle threshold — 30 minutes, 2 hours, 1 day, or a custom value — Tabulatrix does not just close it silently. It fires a pre-close popup notification with three options: Schedule for Later (create a Google Calendar event with the tab's URL and AI-generated summary), Snooze for 2 Hours (reset the idle timer), or Close Now. If the user ignores the notification for 60 seconds, the tab closes automatically. This flow means the user never loses something important — they always get a chance to save it — but the default trajectory is always toward a cleaner browser.

**6. Integrates with Google Calendar for scheduled reading**
When a user chooses to schedule a tab, Tabulatrix creates a Google Calendar event titled with the page's title, with the URL and a Claude-generated one-line summary in the description, and a 30-minute reminder before the event. The user picks the date and time from a small inline date picker in the pre-close popup. This transforms "I'll look at this later" from a lie you tell yourself into an actual scheduled commitment. The tab closes. The calendar event exists. You will actually come back to it.

---

## Architecture Overview

Tabulatrix is built as a Manifest V3 Chrome extension with the following components:

**Service Worker (background.js)** — the brain of the extension. Runs persistently in the background, listens to all Chrome tab events (created, updated, activated, removed), manages alarms for idle detection, and coordinates all other modules. Never touches the DOM — purely logic and storage.

**Tab Tracker (tabTracker.js)** — writes a last_active timestamp to chrome.storage.local every time a tab gains focus. This is the raw data source for all idle and importance calculations.

**Duplicate Detector (duplicateDetector.js)** — fires on every chrome.tabs.onCreated event. Normalizes incoming URLs and checks against all existing tabs. Triggers the pre-close flow on the older duplicate immediately.

**Idle Monitor (idleMonitor.js)** — a chrome.alarms alarm fires every 5 minutes. Scans all open tabs, computes time since last active for each, and queues any tab that has exceeded the threshold for the pre-close flow. Skips pinned tabs and any domain on the user's protected list.

**Classifier (classifier.js)** — runs in two modes. Rule-based mode uses URL and title pattern matching to assign categories. AI mode batches tab metadata and sends it to the Claude API, receiving back category, importance score, and summary for each tab. The AI call is rate-limited and cached — a tab that has already been classified is not re-classified unless its URL changes.

**Reminder Engine (reminderEngine.js)** — scores all tabs by importance and recency. Any tab with importance ≥ 7 and last active > 6 hours ago and a category of Code, Document, or Form is flagged as a reminder candidate. Updates the popup badge count with the number of forgotten high-value tabs.

**Calendar Sync (calendarSync.js)** — handles Google OAuth2 via chrome.identity.launchWebAuthFlow. On "Schedule for Later" action, creates a Calendar event via the Google Calendar API with the tab's title, URL, Claude summary, and user-selected datetime. Handles token refresh and error states gracefully.

**Popup Dashboard (popup/)** — the main UI. Shows tabs grouped by category with counts. Highlights forgotten useful tabs at the top. Offers one-click actions: close all videos, close all duplicates, snooze all idle tabs, run full cleanup. Shows stats: tabs closed today, categories breakdown, estimated memory freed.

**Pre-close Popup (preclose/)** — a small notification-style window that appears before any tab is closed. Contains the tab title, URL, category, AI summary (if available), and three action buttons: Schedule, Snooze, Close. Has a 60-second countdown after which the tab closes automatically.

**Settings Page (settings/)** — full configuration UI. Exposes every parameter: Anthropic API key, idle threshold, protected domains, category rules, Calendar integration toggle, notification style, AI mode toggle. Accessible from the popup and from chrome://extensions.

**First-Run Setup Wizard (onboarding/)** — opens automatically on first install. Walks the user through: enabling AI (API key entry with a test call), setting idle threshold, connecting Google Calendar, defining any protected domains. All choices are pre-filled with sensible defaults. Takes under 2 minutes to complete.

**Storage Layer (storage.js)** — a typed wrapper around chrome.storage.local. Stores tab metadata, classification results, user preferences, saved-for-later list, and cleanup history. All reads and writes go through this module so the rest of the codebase never touches chrome.storage directly.

---

## Tech Stack

- **Runtime**: Chrome Extension Manifest V3
- **Language**: Vanilla JavaScript (no build step, no framework)
- **Background**: Service Worker via chrome.alarms, chrome.tabs, chrome.storage, chrome.identity, chrome.notifications
- **UI**: HTML + CSS + minimal vanilla JS for popup, preclose, settings, and onboarding pages
- **AI**: Anthropic Claude API (claude-sonnet-4-20250514) for tab classification, importance scoring, and one-line summarization — optional, user-configured
- **Integration**: Google Calendar API via OAuth2 (chrome.identity.launchWebAuthFlow)
- **Storage**: chrome.storage.local for all persistent data
- **Icons**: SVG-based, designed around the Tabulatrix brand identity

---

## User Experience Philosophy

Tabulatrix is built around one principle: **it should feel like it is doing nothing, until you realize everything is under control.**

The extension should be invisible during normal use. No constant notifications. No popups demanding attention. No badges screaming at you. It runs, it watches, it cleans. The only time it surfaces is when it genuinely needs your input — a tab is about to close and it wants to know if you'd like to save it — and even then it gives you 60 seconds before it makes the decision for you.

The popup dashboard should feel like opening a cockpit, not a settings menu. At a glance, you should know exactly what is open, what matters, what you forgot about, and what can safely go. Every action should be one click. The user should never feel like they are managing a tool — they should feel like the tool is managing their browser on their behalf.

The pre-close flow is the moment of highest friction in the entire extension, and it is designed to be as frictionless as possible. Three buttons. A countdown. A calendar picker if they want it. Done. The tab is gone, the important information is saved, and the browser is cleaner.

---

## Configuration Philosophy

Everything in Tabulatrix is configurable, but nothing requires configuration to work.

Out of the box, with no API key and no Google Calendar connected, Tabulatrix still works: it tracks activity, detects duplicates, closes idle tabs using rule-based classification, and reminds you about forgotten tabs using importance heuristics. It is useful on day one without any setup beyond the 2-minute wizard.

As the user adds their Anthropic API key, the classification becomes dramatically smarter — tabs get meaningful categories even for obscure URLs, importance scores become reliable, and the AI-generated summaries in pre-close popups give real context. As they connect Google Calendar, the "schedule for later" flow becomes genuinely powerful. As they define protected domains and custom rules, the extension molds itself precisely to their workflow.

The design principle: **progressive enhancement**. Basic version is good. Each additional configuration makes it significantly better. No configuration is required to get value, but every configuration option is worth using.

---

## What Makes Tabulatrix Different

**vs. OneTab / Tab Suspender** — Those tools require manual action. You click a button and it saves your tabs. Tabulatrix is fully autonomous — it makes decisions and acts on them without you needing to initiate anything.

**vs. Chrome's built-in tab groups** — Tab groups are organizational, not intelligent. They do not track activity, detect duplicates, score importance, or close anything. They are a filing cabinet. Tabulatrix is a chief of staff.

**vs. Bookmarks / Reading List** — Same problem as tab groups. Passive storage that requires you to actively save things. Tabulatrix catches things you would never have thought to save.

**vs. Session managers** — Session managers save and restore entire windows. They are a snapshot tool, not an ongoing manager. They do not close idle tabs, do not detect duplicates in real time, and do not surface forgotten important content.

**The unique angle**: Tabulatrix is the only tab manager that combines real-time activity tracking, AI-powered importance scoring, autonomous cleanup with a safety net, and calendar-based deferred reading into a single fully automatic system. It does not ask you to manage your browser. It manages it for you.

---

## Planned Phases

**Phase 1 — Core Extension (MVP)**
Service worker, tab tracker, duplicate detector, idle monitor, rule-based classifier, pre-close popup, basic popup dashboard, chrome.storage, first-run wizard, settings page. Fully functional without any API keys. Deployable to Chrome Web Store.

**Phase 2 — AI Layer**
Claude API integration in classifier, importance scoring, one-line summaries, reminder engine using AI scores, AI summary in pre-close popup. Requires Anthropic API key, fully optional.

**Phase 3 — Calendar Integration**
Google OAuth2 flow, Calendar event creation, date picker in pre-close popup, token management, error handling and retry logic.

**Phase 4 — Dashboard & Analytics**
Expanded popup with charts: tabs closed over time, category breakdown history, memory freed estimate, most-forgotten domains. Gives users a sense of how much cognitive overhead Tabulatrix is handling for them.

**Phase 5 — Power Features**
Custom rule builder in settings UI (add your own URL patterns → categories), snooze presets (2hr, tonight, next week), tab session snapshots before bulk cleanup, optional Notion integration as alternative to Google Calendar, keyboard shortcuts for all major actions.

---

## Name & Identity

**Name**: Tabulatrix

Derived from the Latin *tabula* (tablet, clean slate) and the suffix *-trix* (feminine Latin agent noun, meaning "one who performs"). Tabulatrix literally means *she who organizes the slate* — an active, intelligent agent that maintains order.

**Tagline**: *Open less. Miss nothing.*

**Brand personality**: Quietly powerful. Precise. Trustworthy. The extension that works hardest when you are not thinking about it.

---

## Success Metrics

A successful Tabulatrix install means:
- The user's average open tab count drops within the first week
- At least one "forgotten useful tab" is surfaced and acted on per session
- Zero instances of a user saying "I lost something important because the extension closed it"
- The pre-close → schedule flow is used at least once per week per active user
- The user never feels the need to manually manage their tabs again