// ═══════════════════════════════════════════════════════════
// Dopamine De-escalator v2.1.1 — background.js (TIMER FIX)
// Fixes: heartbeat SW lifecycle, alarm persistence, AbortSignal polyfill
// ═══════════════════════════════════════════════════════════

const DEFAULTS = {
  features: { rewrite: true, grayscale: true, dopameter: true, fatigue: true, scrollFriction: true, demoMode: false },
  settings: {
    ollamaEnabled: false,
    ollamaUrl: "http://127.0.0.1:11434",
    ollamaModel: "llama3.2",
    startDelay: 0,
    thresholdWarn: 10,
    thresholdFriction: 20,
    interventionThreshold: 30,
    frictionStrength: 40,
    scoreThreshold: 45
  },
  sessionData: { postsRewritten: 0, avgDopamineReduction: 0, fatigueLevel: 0, originalScore: 0, currentScore: 0 },
  ollamaStatus: "unchecked"
};

// ── State for tracking active requests & circuit breaker ──
let activeRewriteController = null;
let activePullController = null;
let lastOllamaFailureTime = 0;

// ── Social Media URL Detection ─────────────────────────────
// Used by the background timer to track time independently of content scripts
const SOCIAL_MEDIA_DOMAINS = [
  'x.com', 'twitter.com', 'reddit.com', 'instagram.com',
  'youtube.com', 'facebook.com', 'tiktok.com'
];

const CONTENT_SCRIPT_URL_PATTERNS = [
  "https://x.com/*", "https://reddit.com/*", "https://www.reddit.com/*",
  "https://instagram.com/*", "https://www.instagram.com/*",
  "https://youtube.com/*", "https://www.youtube.com/*",
  "https://facebook.com/*", "https://www.facebook.com/*",
  "https://tiktok.com/*", "https://www.tiktok.com/*"
];

function isSocialMediaUrl(url) {
  if (!url) return false;
  try {
    const hostname = new URL(url).hostname.replace('www.', '');
    return SOCIAL_MEDIA_DOMAINS.some(site => hostname.includes(site));
  } catch { return false; }
}

// Tracks last content script heartbeat to avoid double-counting with alarm timer
let lastHeartbeatTime = 0;


// ── Declarative Net Request rules for Ollama CORS bypass ──
async function setupOllamaRules() {
  if (typeof chrome === "undefined" || !chrome.declarativeNetRequest) return;
  try {
    const data = await chrome.storage.sync.get("settings");
    const settings = data.settings || {};
    const ollamaUrl = settings.ollamaUrl || DEFAULTS.settings.ollamaUrl;

    // Asynchronously fetch and cache available models
    updateAvailableModels(ollamaUrl);

    // Parse hostname and port
    let hostFilter = "";
    try {
      const parsed = new URL(ollamaUrl);
      const port = parsed.port || (parsed.protocol === "https:" ? "443" : "80");
      hostFilter = `*://${parsed.hostname}:${port}/*`;
    } catch {
      hostFilter = "*://127.0.0.1:11434/*";
    }

    const rules = [
      {
        id: 1,
        priority: 1,
        action: {
          type: "modifyHeaders",
          requestHeaders: [
            { header: "origin", operation: "remove" }
          ]
        },
        condition: {
          urlFilter: hostFilter,
          resourceTypes: ["xmlhttprequest"]
        }
      },
      {
        id: 2,
        priority: 1,
        action: {
          type: "modifyHeaders",
          requestHeaders: [
            { header: "origin", operation: "remove" }
          ]
        },
        condition: {
          urlFilter: "*://127.0.0.1:11434/*",
          resourceTypes: ["xmlhttprequest"]
        }
      },
      {
        id: 3,
        priority: 1,
        action: {
          type: "modifyHeaders",
          requestHeaders: [
            { header: "origin", operation: "remove" }
          ]
        },
        condition: {
          urlFilter: "*://localhost:11434/*",
          resourceTypes: ["xmlhttprequest"]
        }
      }
    ];

    const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
    const existingIds = existingRules.map(r => r.id);
    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: existingIds,
      addRules: rules
    });
  } catch (e) {
    console.error("DDE: Failed to setup declarative rules for Ollama:", e);
  }
}

// Initialize rules on service worker load
setupOllamaRules();

// ── Background Timer Alarm ─────────────────────────────────
// Creates a 30-second alarm that tracks time on social media sites
// independently of content scripts. This is the RELIABLE fallback.
chrome.alarms.create("timerTick", { periodInMinutes: 0.5 });

// Update rules dynamically when storage settings change
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "sync" && changes.settings) {
    setupOllamaRules();
  }
});


// ── Polyfill for AbortSignal.timeout (Chrome < 103) ────────
function makeSignal(ms) {
  if (typeof AbortSignal.timeout === "function") return AbortSignal.timeout(ms);
  const controller = new AbortController();
  setTimeout(() => controller.abort(), ms);
  return controller.signal;
}

// ── Check & Perform Daily Reset ───────────────────────────
async function checkDailyReset() {
  const today = new Date().toLocaleDateString('en-US');
  try {
    const data = await chrome.storage.local.get(["lastResetDate"]);
    if (data.lastResetDate !== today) {
      await chrome.storage.local.set({
        sessionData: DEFAULTS.sessionData,
        sessionActiveTime: 0,
        sessionVirtualTime: 0,
        lastResetDate: today
      });
      console.log("DDE: Daily reset performed for " + today);
    }
  } catch (e) {
    console.error("DDE: Daily reset failed:", e);
  }
}

// Run check on startup/load
checkDailyReset();

// ── Install / Update ───────────────────────────────────────
// FIX: Only set DEFAULTS on initial install, not on every update
// FIX: Only create alarm once with guard
chrome.runtime.onInstalled.addListener(({ reason }) => {
  if (reason === "install") {
    const today = new Date().toLocaleDateString('en-US');

    // Save settings and features to sync storage
    chrome.storage.sync.set({
      features: DEFAULTS.features,
      settings: DEFAULTS.settings
    });

    // Save session data and timers to local storage
    chrome.storage.local.set({
      sessionData: DEFAULTS.sessionData,
      sessionActiveTime: 0,
      sessionVirtualTime: 0,
      lastResetDate: today,
      ollamaStatus: DEFAULTS.ollamaStatus
    });

    chrome.tabs.create({ url: chrome.runtime.getURL("settings.html") });
  }

  // Re-inject content scripts on update (old scripts die when extension reloads)
  if (reason === "update") {
    chrome.tabs.query({ url: CONTENT_SCRIPT_URL_PATTERNS }, tabs => {
      for (const tab of tabs) {
        // Reset the guard flag so the script can re-initialize
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => { window.__ddeLoaded = false; }
        }).then(() => {
          chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ["content.js"]
          });
          chrome.scripting.insertCSS({
            target: { tabId: tab.id },
            files: ["content-styles.css"]
          });
        }).catch(() => { });
      }
      console.log(`DDE: Re-injected content scripts into ${tabs.length} tabs`);
    });
  }

  // Always ensure alarms exist (install, update, or chrome_update)
  chrome.alarms.get("midnightReset", alarm => {
    if (!alarm) {
      chrome.alarms.create("midnightReset", { periodInMinutes: 60 });
      console.log("DDE: midnightReset alarm created on", reason);
    }
  });
  chrome.alarms.create("timerTick", { periodInMinutes: 0.5 });
});

// ── Browser Startup Reset ─────────────────────────────────
chrome.runtime.onStartup.addListener(() => {
  console.log("DDE: Browser startup. Resetting timers.");
  chrome.storage.local.set({
    sessionActiveTime: 0,
    sessionVirtualTime: 0
  });
  checkDailyReset();

  // Ensure alarm survives browser restart
  chrome.alarms.get("midnightReset", alarm => {
    if (!alarm) {
      chrome.alarms.create("midnightReset", { periodInMinutes: 60 });
      console.log("DDE: midnightReset alarm re-created on startup");
    }
  });
});

// ── Alarm Handler ─────────────────────────────────────────
chrome.alarms.onAlarm.addListener(alarm => {
  if (alarm.name === "midnightReset") {
    checkDailyReset();
    return;
  }

  // ── Background Timer Tick (30-second interval) ──────────
  // This is the RELIABLE timer that works even without content scripts.
  // If content script heartbeats are active, we skip to avoid double-counting.
  if (alarm.name === "timerTick") {
    // Content script heartbeats provide 1-second granularity — use those if active
    if (Date.now() - lastHeartbeatTime < 35000) return;

    // Check if the active tab in the focused window is a social media site
    chrome.tabs.query({ active: true, lastFocusedWindow: true }, async tabs => {
      if (!tabs[0] || !isSocialMediaUrl(tabs[0].url)) return;

      // Verify the window is actually focused (user isn't in another app)
      try {
        const win = await chrome.windows.get(tabs[0].windowId);
        if (!win.focused) return;
      } catch { return; }

      // Increment timer by 30 seconds (the alarm interval)
      chrome.storage.local.get(["sessionActiveTime", "sessionVirtualTime"], data => {
        const newActive = (data.sessionActiveTime || 0) + 30;
        const newVirtual = (data.sessionVirtualTime || 0) + 30;
        chrome.storage.local.set({
          sessionActiveTime: newActive,
          sessionVirtualTime: newVirtual
        });
        console.log(`DDE: Background timer tick → ${newActive}s active`);
      });
    });
    return;
  }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === "complete") {
    checkDailyReset();
  }
});

// ── Message Router ─────────────────────────────────────────
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === "rewritePost") {
    handleRewrite(msg.text, msg.hash)
      .then(result => sendResponse(result))
      .catch(() => sendResponse({ success: false, text: msg.text }));
    return true;
  }
  if (msg.action === "checkOllama") {
    checkOllama(msg.url, msg.model)
      .then(result => sendResponse(result))
      .catch(() => sendResponse({ ok: false, error: "unreachable" }));
    return true;
  }
  if (msg.action === "listOllamaModels") {
    listOllamaModels(msg.url)
      .then(models => sendResponse({ models }))
      .catch(() => sendResponse({ models: [] }));
    return true;
  }
  if (msg.action === "pullOllamaModel") {
    pullOllamaModel(msg.url, msg.model)
      .then(r => sendResponse(r))
      .catch(e => sendResponse({ ok: false, error: e.message }));
    return true;
  }
  if (msg.action === "heartbeat") {
    // Track that content script is alive — background timer will yield to it
    lastHeartbeatTime = Date.now();

    // return true + sendResponse to keep SW alive until storage write completes
    chrome.storage.local.get(["sessionActiveTime", "sessionVirtualTime"], data => {
      let active = data.sessionActiveTime || 0;
      let virtual = data.sessionVirtualTime || 0;
      active++;
      virtual += msg.scrolled ? 1 : 2.5;
      chrome.storage.local.set({
        sessionActiveTime: active,
        sessionVirtualTime: virtual
      }, () => {
        sendResponse({ ok: true, active, virtual });
      });
    });
    return true;
  }
  if (msg.action === "getActiveTime") {
    chrome.storage.local.get(["sessionActiveTime", "sessionVirtualTime"], data => {
      sendResponse({
        sessionActiveTime: data.sessionActiveTime || 0,
        sessionVirtualTime: data.sessionVirtualTime || 0
      });
    });
    return true;
  }
  if (msg.action === "resetActiveTime") {
    chrome.storage.local.set({ sessionActiveTime: 0, sessionVirtualTime: 0 }, () => {
      sendResponse({ success: true });
    });
    return true;
  }
});

// ── Rewrite Handler ────────────────────────────────────────
const rewriteCache = new Map();
const CACHE_TTL = 24 * 3600 * 1000;
let availableModels = [];

async function updateAvailableModels(baseUrl) {
  try {
    availableModels = await listOllamaModels(baseUrl);
  } catch {
    availableModels = [];
  }
}

async function handleRewrite(text, hash) {
  // 1. Memory cache
  if (hash && rewriteCache.has(hash)) {
    const entry = rewriteCache.get(hash);
    if (Date.now() - entry.ts < CACHE_TTL) return { success: true, text: entry.text, cached: true };
  }

  // 2. Storage cache
  if (hash) {
    const stored = await chrome.storage.local.get(`rwc_${hash}`);
    if (stored[`rwc_${hash}`]) {
      const e = stored[`rwc_${hash}`];
      if (Date.now() - e.ts < CACHE_TTL) {
        rewriteCache.set(hash, e);
        return { success: true, text: e.text, cached: true };
      }
    }
  }

  // 3. Check settings
  const { settings } = await chrome.storage.sync.get("settings");
  const cfg = settings || DEFAULTS.settings;

  let rewritten;
  if (cfg.ollamaEnabled) {
    // 30-second circuit breaker cool-off
    if (Date.now() - lastOllamaFailureTime > 30000) {
      let modelToUse = cfg.ollamaModel || "llama3.2";

      // If availableModels cache is empty, try to populate it dynamically
      if (availableModels.length === 0) {
        await updateAvailableModels(cfg.ollamaUrl);
      }

      // Auto-select first available model if configured model is missing
      if (availableModels.length > 0) {
        const hasConfigured = availableModels.some(m => m.startsWith(modelToUse.split(":")[0]));
        if (!hasConfigured) {
          modelToUse = availableModels[0];
          console.log(`DDE: Configured model not found. Auto-selected: ${modelToUse}`);
          // Save auto-selected model back to settings
          cfg.ollamaModel = modelToUse;
          await chrome.storage.sync.set({ settings: cfg });
        }
      }

      rewritten = await ollamaRewrite(text, cfg.ollamaUrl, modelToUse);
      if (!rewritten) {
        lastOllamaFailureTime = Date.now();
        console.warn("DDE: Ollama request failed, cooling off for 30s");
      }
    } else {
      console.log("DDE: Ollama in cool-off period, using fallback");
    }
  }

  // 4. Fallback
  if (!rewritten) rewritten = ruleBasedRewrite(text);

  // 5. Cache
  if (hash && rewritten) {
    const entry = { text: rewritten, ts: Date.now() };
    rewriteCache.set(hash, entry);
    chrome.storage.local.set({ [`rwc_${hash}`]: entry });
  }

  return { success: true, text: rewritten || text };
}

// ── Ollama: Rewrite ────────────────────────────────────────
// FIX: Use makeSignal() instead of AbortSignal.timeout()
async function ollamaRewrite(text, baseUrl, model) {
  const url = (baseUrl || "http://localhost:11434").replace(/\/$/, "");
  const prompt = `You are a dopamine reduction engine. Rewrite the following social media post into neutral, factual language.

Rules:
1. Remove all emotional amplifiers (shocking, amazing, terrifying, etc.)
2. Remove clickbait phrases (you won't believe, this changes everything, etc.)
3. Remove exclamation marks and ALL CAPS
4. Remove emojis completely
5. Remove urgency language (BREAKING, MUST SEE, RIGHT NOW)
6. Remove social proof manipulation (going viral, everyone is talking)
7. Preserve all factual content and data
8. Be concise — match the original length roughly
9. Output only the rewritten text, nothing else

Post to rewrite:
${text}`;

  try {
    const resp = await fetch(`${url}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: model || "llama3.2",
        prompt,
        stream: false,
        options: { temperature: 0.2, num_predict: 256 }
      }),
      signal: makeSignal(15000)
    });

    if (!resp.ok) return null;
    const data = await resp.json();
    const result = (data.response || "").trim();
    return result.length > 5 ? result : null;
  } catch {
    return null;
  }
}

// ── Ollama: Check ──────────────────────────────────────────
async function checkOllama(baseUrl, model) {
  const url = (baseUrl || "http://localhost:11434").replace(/\/$/, "");
  try {
    const r = await fetch(`${url}/api/tags`, { signal: makeSignal(4000) });
    if (!r.ok) {
      await chrome.storage.local.set({ ollamaStatus: "error" });
      return { ok: false, error: "Ollama responded with error" };
    }
    const data = await r.json();
    const models = (data.models || []).map(m => m.name);

    // Update cache
    availableModels = models;

    let modelToUse = model;
    let modelAvailable = false;
    if (models.length > 0) {
      if (model) {
        modelAvailable = models.some(m => m.startsWith(model.split(":")[0]));
      }
      if (!modelAvailable) {
        // Auto-select first model
        modelToUse = models[0];
        modelAvailable = true;
        // Save to storage settings
        const syncData = await chrome.storage.sync.get("settings");
        const settings = syncData.settings || {};
        settings.ollamaModel = modelToUse;
        await chrome.storage.sync.set({ settings });
        console.log(`DDE: Auto-selected and saved model: ${modelToUse}`);
      }
    }

    await chrome.storage.local.set({ ollamaStatus: "ok" });
    return { ok: true, models, modelAvailable, autoSelectedModel: modelToUse };
  } catch (e) {
    await chrome.storage.local.set({ ollamaStatus: "error" });
    return { ok: false, error: "Ollama not running at " + url };
  }
}

async function listOllamaModels(baseUrl) {
  const url = (baseUrl || "http://localhost:11434").replace(/\/$/, "");
  try {
    const r = await fetch(`${url}/api/tags`, { signal: makeSignal(4000) });
    if (!r.ok) return [];
    const data = await r.json();
    return (data.models || []).map(m => m.name);
  } catch { return []; }
}

// ── Ollama: Pull ───────────────────────────────────────────
// FIX: Handle both streaming NDJSON and JSON responses
// Ollama /api/pull always streams — no stream:false support
async function pullOllamaModel(baseUrl, model) {
  const url = (baseUrl || "http://localhost:11434").replace(/\/$/, "");
  try {
    const r = await fetch(`${url}/api/pull`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: model }),
      signal: makeSignal(300000) // 5 min timeout
    });

    if (!r.ok) return { ok: false, error: `HTTP ${r.status}` };

    const contentType = r.headers.get("content-type") || "";

    // Check if response is a single JSON object or NDJSON stream
    if (contentType.includes("application/json")) {
      // Try single JSON response first
      try {
        const data = await r.json();
        return { ok: data.status === "success" || !data.error };
      } catch (e) {
        // Fall through to stream handling
      }
    }

    // Handle NDJSON streaming response (most Ollama versions)
    const reader = r.body.getReader();
    const decoder = new TextDecoder();
    let lastStatus = "";
    let hasError = false;
    let errorMsg = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const text = decoder.decode(value);
      const lines = text.split("\n").filter(line => line.trim());

      for (const line of lines) {
        try {
          const obj = JSON.parse(line);
          if (obj.status) lastStatus = obj.status;
          if (obj.error) {
            hasError = true;
            errorMsg = obj.error;
          }
        } catch (e) {
          // Partial line or malformed JSON — skip
        }
      }
    }

    if (!hasError) {
      updateAvailableModels(url);
    }

    return {
      ok: !hasError,
      status: lastStatus,
      error: errorMsg || undefined
    };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

// ── Rule-Based Fallback ────────────────────────────────────
function ruleBasedRewrite(text) {
  let t = text;
  t = t.replace(/\p{Emoji_Presentation}/gu, "").trim();
  t = t.replace(/!+/g, ".").replace(/\?{2,}/g, "?").replace(/\.{2,}/g, ".");
  t = t.replace(/\b([A-Z]{4,})\b/g, w => w[0] + w.slice(1).toLowerCase());

  const map = {
    "shocking": "notable", "shocked": "surprised", "viral": "circulating",
    "trending": "currently discussed", "amazing": "notable", "incredible": "reported",
    "mind-blowing": "significant", "mind blowing": "significant",
    "unbelievable": "notable", "explosive": "significant", "bombshell": "revelation",
    "devastating": "damaging", "terrifying": "concerning", "outrageous": "controversial",
    "you won't believe": "notably", "this changes everything": "this is significant",
    "breaking": "update", "must see": "view", "game changer": "significant development",
    "insane": "unusual", "epic": "significant", "catastrophic": "severe",
  };

  Object.entries(map).forEach(([old, neu]) => {
    t = t.replace(new RegExp(old, "gi"), neu);
  });

  ["^breaking[:\\s!]+", "^update[:\\s!]+"].forEach(re => {
    t = t.replace(new RegExp(re, "i"), "");
  });

  t = t.trim();
  if (!t) return null;
  t = t[0].toUpperCase() + t.slice(1);
  if (!/[.?!]$/.test(t)) t += ".";
  return t;
}
