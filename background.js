// ═══════════════════════════════════════════════════════════
// Dopamine De-escalator v2.0 — background.js (Service Worker)
// Handles: Ollama API calls, rewrite cache, session tracking
// ═══════════════════════════════════════════════════════════

// ── Defaults ──────────────────────────────────────────────
const DEFAULTS = {
  features: { rewrite: true, grayscale: false, dopameter: true, fatigue: true, scrollFriction: true },
  settings: {
    interventionThreshold: 20,
    ollamaEnabled: false,
    ollamaUrl: "http://localhost:11434",
    ollamaModel: "llama3.2",
    scoreThreshold: 45,
    frictionStrength: 40   // % scroll speed reduction
  },
  sessionData: { postsRewritten: 0, avgDopamineReduction: 0, fatigueLevel: 0, originalScore: 0, currentScore: 0 },
  ollamaStatus: "unchecked"  // "ok" | "error" | "unchecked"
};

// ── Install / Update ───────────────────────────────────────
chrome.runtime.onInstalled.addListener(({ reason }) => {
  chrome.storage.sync.set(DEFAULTS);
  if (reason === "install") {
    chrome.tabs.create({ url: chrome.runtime.getURL("settings.html") });
  }
});

// ── Alarm: daily reset ────────────────────────────────────
chrome.alarms.create("midnightReset", { periodInMinutes: 60 });
chrome.alarms.onAlarm.addListener(alarm => {
  if (alarm.name === "midnightReset" && new Date().getHours() === 0) {
    chrome.storage.sync.set({
      sessionData: DEFAULTS.sessionData,
      sessionStartTime: Date.now()
    });
  }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === "complete") {
    chrome.storage.sync.get(["sessionStartTime"], data => {
      if (!data.sessionStartTime) {
        chrome.storage.sync.set({ sessionStartTime: Date.now() });
      }
    });
  }
});

// ── Message Router ─────────────────────────────────────────
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {

  // --- Rewrite a single post via Ollama ---
  if (msg.action === "rewritePost") {
    handleRewrite(msg.text, msg.hash)
      .then(result => sendResponse(result))
      .catch(() => sendResponse({ success: false, text: msg.text }));
    return true; // async
  }

  // --- Check if Ollama is running ---
  if (msg.action === "checkOllama") {
    checkOllama(msg.url, msg.model)
      .then(result => sendResponse(result))
      .catch(() => sendResponse({ ok: false, error: "unreachable" }));
    return true;
  }

  // --- List available Ollama models ---
  if (msg.action === "listOllamaModels") {
    listOllamaModels(msg.url)
      .then(models => sendResponse({ models }))
      .catch(() => sendResponse({ models: [] }));
    return true;
  }

  // --- Pull a model ---
  if (msg.action === "pullOllamaModel") {
    pullOllamaModel(msg.url, msg.model)
      .then(r => sendResponse(r))
      .catch(e => sendResponse({ ok: false, error: e.message }));
    return true;
  }
});

// ── Rewrite Handler ────────────────────────────────────────
const rewriteCache = new Map();   // in-memory (survives tab nav)
const CACHE_TTL = 24 * 3600 * 1000;

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
    rewritten = await ollamaRewrite(text, cfg.ollamaUrl, cfg.ollamaModel);
  }

  // 4. Fallback: rule-based
  if (!rewritten) rewritten = ruleBasedRewrite(text);

  // 5. Cache result
  if (hash && rewritten) {
    const entry = { text: rewritten, ts: Date.now() };
    rewriteCache.set(hash, entry);
    chrome.storage.local.set({ [`rwc_${hash}`]: entry });
  }

  return { success: true, text: rewritten || text };
}

// ── Ollama API Calls ───────────────────────────────────────
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
      signal: AbortSignal.timeout(15000)
    });

    if (!resp.ok) return null;
    const data = await resp.json();
    const result = (data.response || "").trim();
    return result.length > 5 ? result : null;
  } catch {
    return null;
  }
}

async function checkOllama(baseUrl, model) {
  const url = (baseUrl || "http://localhost:11434").replace(/\/$/, "");
  try {
    // Check tags endpoint
    const r = await fetch(`${url}/api/tags`, { signal: AbortSignal.timeout(4000) });
    if (!r.ok) { await chrome.storage.sync.set({ ollamaStatus: "error" }); return { ok: false, error: "Ollama responded but with error" }; }
    const data = await r.json();
    const models = (data.models || []).map(m => m.name);
    const modelAvailable = model ? models.some(m => m.startsWith(model.split(":")[0])) : models.length > 0;
    await chrome.storage.sync.set({ ollamaStatus: "ok" });
    return { ok: true, models, modelAvailable };
  } catch (e) {
    await chrome.storage.sync.set({ ollamaStatus: "error" });
    return { ok: false, error: "Ollama not running at " + url };
  }
}

async function listOllamaModels(baseUrl) {
  const url = (baseUrl || "http://localhost:11434").replace(/\/$/, "");
  try {
    const r = await fetch(`${url}/api/tags`, { signal: AbortSignal.timeout(4000) });
    if (!r.ok) return [];
    const data = await r.json();
    return (data.models || []).map(m => m.name);
  } catch { return []; }
}

async function pullOllamaModel(baseUrl, model) {
  const url = (baseUrl || "http://localhost:11434").replace(/\/$/, "");
  try {
    const r = await fetch(`${url}/api/pull`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: model, stream: false }),
      signal: AbortSignal.timeout(300000) // 5 min for pull
    });
    if (!r.ok) return { ok: false, error: "Pull failed" };
    return { ok: true };
  } catch (e) { return { ok: false, error: e.message }; }
}

// ── Rule-Based Fallback Rewrite ────────────────────────────
function ruleBasedRewrite(text) {
  let t = text;
  // Strip emojis
  t = t.replace(/\p{Emoji_Presentation}/gu, "").trim();
  // Normalise punctuation
  t = t.replace(/!+/g, ".").replace(/\?{2,}/g, "?").replace(/\.{2,}/g, ".");
  // Lowercase CAPS words (4+ chars)
  t = t.replace(/\b([A-Z]{4,})\b/g, w => w[0] + w.slice(1).toLowerCase());
  // Word replacements
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
  // Remove opener patterns
  ["^breaking[:\\s!]+", "^update[:\\s!]+"].forEach(re => {
    t = t.replace(new RegExp(re, "i"), "");
  });
  t = t.trim();
  if (!t) return null;
  t = t[0].toUpperCase() + t.slice(1);
  if (!/[.?!]$/.test(t)) t += ".";
  return t;
}
