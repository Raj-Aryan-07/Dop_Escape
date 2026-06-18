
// ═══════════════════════════════════════════════════════════
// Dopamine De-escalator v2.1 — content.js (FIXED)
// Fixes: storage.onChanged listener, observerPaused usage
// ═══════════════════════════════════════════════════════════

(function () {
  "use strict";
  if (window.__ddeLoaded) return;
  window.__ddeLoaded = true;

  // ── Site Selectors ───────────────────────────────────────
  const SELECTORS = {
    "twitter.com": ['[data-testid="tweetText"]', 'article [lang]'],
    "x.com": ['[data-testid="tweetText"]', 'article [lang]'],
    "reddit.com": ['h1', '[data-click-id="text"] p', 'shreddit-post', '.Post h3', '[slot="title"]'],
    "instagram.com": ['._aacl._aaco._aacu', 'h1', 'span[dir="auto"]'],
    "youtube.com": ['#video-title', '#title yt-formatted-string', '#description-text'],
    "facebook.com": ['[data-ad-comet-preview="message"]', '[dir="auto"] span'],
    "tiktok.com": ['[data-e2e="video-desc"]', '.tiktok-j2a19r-SpanText', 'span[class*="SpanText"]'],
  };

  const FEED_SELECTORS = {
    "twitter.com": '[data-testid="primaryColumn"]',
    "x.com": '[data-testid="primaryColumn"]',
    "reddit.com": '.ListingLayout-backgroundContainer, #main-content',
    "instagram.com": 'main',
    "youtube.com": '#primary',
    "facebook.com": '[role="main"]',
    "tiktok.com": '#main-content-homepage_hot, #app',
  };

  // ── State ────────────────────────────────────────────────
  const site = detectSite();
  let features = { rewrite: true, grayscale: false, dopameter: true, fatigue: true, scrollFriction: true };
  let settings = {
    thresholdWarn: 10,
    thresholdFriction: 20,
    interventionThreshold: 30,
    frictionStrength: 40,
    scoreThreshold: 45
  };
  let sessionActiveTime = 0;
  let sessionVirtualTime = 0;
  let postsRewritten = 0;
  let allScores = [];
  let scrollFrictionActive = false;
  let grayscaleLevel = 0;
  let observerPaused = false;
  let scrolledInLastSecond = false;

  // Adaptive watching/scrolling state
  let scrollDistance = 0;
  let lastScrollY = window.scrollY;
  let watchingTicks = 0; // Number of 8-second intervals where user is active but not scrolling
  let activeTicks = 0;   // Number of 8-second intervals where page is active/focused

  // ── Boot ─────────────────────────────────────────────────
  async function init() {
    const data = await getStorage(["features", "settings", "sessionActiveTime", "sessionVirtualTime"]);
    if (data.features) features = data.features;
    if (data.settings) settings = data.settings;
    if (data.sessionActiveTime !== undefined) sessionActiveTime = data.sessionActiveTime;
    if (data.sessionVirtualTime !== undefined) sessionVirtualTime = data.sessionVirtualTime;

    injectHUD();
    setupObserver();
    setupStorageListener(); // FIX: Listen for settings changes

    // Setup 1-second active heartbeat
    setInterval(() => {
      if (document.visibilityState === "visible" && document.hasFocus()) {
        chrome.runtime.sendMessage({
          action: "heartbeat",
          scrolled: scrolledInLastSecond
        }).catch(() => {});
        scrolledInLastSecond = false;
      }
    }, 1000);

    // Listen to scroll events to monitor scroll activity (scrolling vs. watching)
    window.addEventListener("scroll", () => {
      scrolledInLastSecond = true;
      scrollDistance += Math.abs(window.scrollY - lastScrollY);
      lastScrollY = window.scrollY;
    }, { passive: true });

    setTimeout(scanPage, 600);
    startSessionLoop();
    chrome.runtime.onMessage.addListener(onMessage);
  }

  // ── Storage helper ────────────────────────────────────────
  function getStorage(keys) {
    return new Promise(r => chrome.storage.sync.get(keys, r));
  }

  // ── FIX: Storage change listener ──────────────────────────
  function setupStorageListener() {
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== "sync") return;
      if (changes.settings) {
        const newSettings = changes.settings.newValue;
        if (newSettings) {
          settings = { ...settings, ...newSettings };
        }
      }
      if (changes.features) {
        const newFeatures = changes.features.newValue;
        if (newFeatures) {
          features = { ...features, ...newFeatures };
        }
      }
    });
  }

  // ── Detect site ──────────────────────────────────────────
  function detectSite() {
    const h = location.hostname.replace("www.", "");
    return Object.keys(SELECTORS).find(s => h.includes(s)) || null;
  }

  // ── Dopamine Scorer (local — zero cost) ──────────────────
  function calcScore(text) {
    if (!text || text.trim().length < 8) return 0;
    let score = 0;
    const t = text;

    const emojis = (t.match(/\p{Emoji_Presentation}/gu) || []).length;
    score += Math.min(22, emojis * 4);

    const words = t.split(/\s+/).filter(w => w.length > 3);
    if (words.length) {
      const capsRatio = words.filter(w => w === w.toUpperCase() && /[A-Z]/.test(w)).length / words.length;
      score += Math.min(18, Math.round(capsRatio * 36));
    }

    score += Math.min(14, ((t.match(/!/g) || []).length) * 4);

    const clickbait = [
      "you won't believe", "this changes everything", "breaking", "must see", "going viral",
      "everyone is talking", "share before", "deleted soon", "they don't want you",
      "exposed", "shocking truth", "will blow your mind", "you need to see", "this is huge",
      "game changer", "mind blowing", "thread", "🚨", "‼️"
    ];
    score += Math.min(22, clickbait.filter(p => t.toLowerCase().includes(p)).length * 6);

    const amps = [
      "amazing", "incredible", "devastating", "terrifying", "insane", "unbelievable",
      "explosive", "bombshell", "epic", "catastrophic", "outrageous", "infuriating",
      "disgusting", "heartbreaking", "stunning", "shocking", "alarming", "furious",
    ];
    score += Math.min(18, amps.filter(a => t.toLowerCase().includes(a)).length * 4);

    return Math.min(100, Math.round(score));
  }

  // ── Simple hash (for caching) ─────────────────────────────
  function hashText(str) {
    let h = 0;
    for (let i = 0; i < Math.min(str.length, 180); i++) {
      h = Math.imul(31, h) + str.charCodeAt(i) | 0;
    }
    return Math.abs(h).toString(36);
  }

  // ── Scan & process posts ──────────────────────────────────
  const DONE = "data-dde-done";
  const rewriteQueue = [];
  let qTimer = null;

  function scanPage() {
    if (!site) return;
    const sels = SELECTORS[site] || [];
    sels.forEach(sel => {
      document.querySelectorAll(`${sel}:not([${DONE}])`).forEach(el => {
        const text = (el.innerText || el.textContent || "").trim();
        if (text.length < 10) return;
        el.setAttribute(DONE, "1");

        const score = calcScore(text);
        allScores.push(score);

        if (features.dopameter) attachBadge(el, score);

        if (features.rewrite && score >= (settings.scoreThreshold || 45)) {
          el.setAttribute("data-dde-oscore", score);
          queueRewrite(el, text, score);
        }
      });
    });
  }

  // ── Badge ─────────────────────────────────────────────────
  function attachBadge(el, score) {
    if (el.parentNode && el.parentNode.querySelector(".dde-badge")) return;
    const color = score >= 70 ? "#ef4444" : score >= 40 ? "#f59e0b" : "#22c55e";
    const badge = document.createElement("span");
    badge.className = "dde-badge";
    badge.style.cssText = `
      display:inline-block;margin:0 6px 2px 0;padding:2px 7px;
      border-radius:99px;font-size:10px;font-weight:700;
      background:${color}22;color:${color};border:1px solid ${color}55;
      cursor:default;vertical-align:middle;
    `;
    badge.textContent = `DS:${score}`;
    badge.title = `Dopamine Score: ${score}/100`;
    try { el.parentNode.insertBefore(badge, el); } catch { el.prepend(badge); }
  }

  // ── Rewrite queue (batched by 1.5s debounce) ──────────────
  function queueRewrite(el, text, score) {
    rewriteQueue.push({ el, text, score, hash: hashText(text) });
    clearTimeout(qTimer);
    qTimer = setTimeout(flushQueue, 1500);
  }

  async function flushQueue() {
    if (!rewriteQueue.length) return;
    const batch = rewriteQueue.splice(0, 10);
    for (const item of batch) {
      try {
        const res = await chrome.runtime.sendMessage({
          action: "rewritePost",
          text: item.text,
          hash: item.hash
        });
        if (res && res.success && res.text && res.text !== item.text) {
          applyRewrite(item.el, res.text, item.score);
        }
      } catch { /* extension context may be gone */ }
    }
  }

  function applyRewrite(el, newText, oldScore) {
    el.setAttribute("data-dde-original", el.innerText || el.textContent);
    el.style.transition = "opacity 0.35s ease";
    el.style.opacity = "0.3";

    // FIX: Pause observer during rewrite to avoid mutation loops
    observerPaused = true;

    setTimeout(() => {
      try {
        el.innerText = newText;
      } catch {
        el.textContent = newText;
      }
      el.style.opacity = "1";
      el.setAttribute("data-rewritten", "true");
      el.setAttribute("data-dde-done", "rewritten");

      const badge = el.parentNode && el.parentNode.querySelector(".dde-badge");
      if (badge) {
        badge.style.background = "#22c55e22";
        badge.style.color = "#22c55e";
        badge.style.borderColor = "#22c55e55";
        badge.textContent = `DS:8 ✓`;
        badge.title = `AI-rewritten. Original score: ${oldScore}/100`;
      }

      postsRewritten++;
      updateStats(oldScore);

      // Resume observer
      observerPaused = false;
    }, 320);
  }

  // ── Stats ─────────────────────────────────────────────────
  function updateStats(lastOriginalScore) {
    const duration = sessionActiveTime / 60;
    const fatigue = duration > 20 ? Math.min(100, Math.round((duration / 20) * 50)) : 0;
    const avg = allScores.length ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length) : 0;
    chrome.storage.sync.set({
      sessionData: {
        postsRewritten,
        avgDopamineReduction: Math.round(postsRewritten * 1.8),
        fatigueLevel: fatigue,
        originalScore: lastOriginalScore || avg,
        currentScore: 8,
        avgFeedScore: avg,
      }
    });
  }

  // ── HUD overlay ───────────────────────────────────────────
  function injectHUD() {
    if (document.getElementById("dde-hud")) return;
    const hud = document.createElement("div");
    hud.id = "dde-hud";
    hud.innerHTML = `<span id="dde-hud-icon">⬡</span> <span id="dde-hud-text">DDE</span>`;
    hud.title = "Dopamine De-escalator active";
    document.body.appendChild(hud);
  }

  function updateHUD(minutes, avgScore) {
    const txt = document.getElementById("dde-hud-text");
    if (!txt) return;
    const level = minutes >= 30 ? "🔴" : minutes >= 20 ? "🟡" : minutes >= 10 ? "🟠" : "🟢";
    txt.textContent = `${level} ${minutes}m · DS:${avgScore}`;
  }

  // ── Session loop ──────────────────────────────────────────
  function startSessionLoop() {
    setInterval(async () => {
      // Fetch latest accumulated timer values from storage
      const data = await getStorage(["sessionActiveTime", "sessionVirtualTime"]);
      if (data.sessionActiveTime !== undefined) sessionActiveTime = data.sessionActiveTime;
      if (data.sessionVirtualTime !== undefined) sessionVirtualTime = data.sessionVirtualTime;

      const activeMinutes = Math.floor(sessionActiveTime / 60);
      const virtualMinutes = Math.floor(sessionVirtualTime / 60);

      const isVisible = document.visibilityState === "visible" && document.hasFocus();
      if (isVisible) {
        activeTicks++;
        // If they scrolled less than 150 pixels in 8 seconds, they are "watching/reading"
        if (scrollDistance < 150) {
          watchingTicks++;
        }
      }

      // Reset scroll distance for the next interval
      scrollDistance = 0;

      // Use settings for thresholds
      const threshWarn = settings.thresholdWarn !== undefined ? settings.thresholdWarn : 10;
      const threshFriction = settings.thresholdFriction !== undefined ? settings.thresholdFriction : 20;
      const threshFull = settings.interventionThreshold !== undefined ? settings.interventionThreshold : 30;
      const frictionStrength = settings.frictionStrength !== undefined ? settings.frictionStrength : 40;

      if (features.grayscale) {
        const level = virtualMinutes >= threshFull ? 100 : virtualMinutes >= threshFriction ? 60 : virtualMinutes >= threshWarn ? 30 : 0;
        applyGrayscale(level);
      }

      if (features.scrollFriction) {
        let friction = 0;
        if (activeMinutes >= threshFull) {
          friction = Math.min(0.95, (frictionStrength * 1.375) / 100); // e.g., 55% for 40% strength
        } else if (activeMinutes >= threshFriction) {
          friction = Math.min(0.95, (frictionStrength * 0.875) / 100); // e.g., 35% for 40% strength
        }

        // Reduce friction if they are watching more than scrolling
        if (friction > 0 && activeTicks > 0) {
          const watchRatio = watchingTicks / activeTicks;
          // Scale down friction by up to 40% if watchRatio is high
          const reductionFactor = 1 - (watchRatio * 0.4);
          friction = friction * reductionFactor;
        }

        setFriction(friction);
      } else {
        setFriction(0);
      }

      if (activeMinutes >= threshFull && activeMinutes % 10 === 0) maybeBreakPrompt(activeMinutes);

      updateHUD(virtualMinutes, allScores.length ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length) : 0);
    }, 8000);
  }

  // ── Grayscale ─────────────────────────────────────────────
  function applyGrayscale(pct) {
    if (pct === grayscaleLevel) return;
    grayscaleLevel = pct;
    const feed = document.querySelector(FEED_SELECTORS[site] || "body");
    if (!feed) return;
    feed.style.transition = "filter 2s ease";
    feed.style.filter = pct > 0 ? `grayscale(${pct}%)` : "";
  }

  // Helper to find the nearest scrollable ancestor in the vertical direction
  function findScrollableElement(target, deltaY) {
    let el = target;
    while (el && el !== document.documentElement && el !== document.body) {
      const style = window.getComputedStyle(el);
      const overflowY = style.overflowY || style.overflow || '';
      const isScrollable = overflowY === 'auto' || overflowY === 'scroll';

      if (isScrollable) {
        // Check if the element has scrollable content and can be scrolled in the desired direction
        if (deltaY > 0 && el.scrollHeight > el.clientHeight && el.scrollTop < el.scrollHeight - el.clientHeight) {
          return el;
        }
        if (deltaY < 0 && el.scrollTop > 0) {
          return el;
        }
      }
      el = el.parentElement;
    }
    return window;
  }

  // ── Scroll friction ───────────────────────────────────────
  let _frictionLevel = 0;
  function setFriction(level) {
    if (level === _frictionLevel) return;
    _frictionLevel = level;
    if (level > 0 && !scrollFrictionActive) {
      scrollFrictionActive = true;
      window.addEventListener("wheel", onWheel, { passive: false });
    } else if (level === 0 && scrollFrictionActive) {
      scrollFrictionActive = false;
      window.removeEventListener("wheel", onWheel);
    }
  }
  function onWheel(e) {
    if (_frictionLevel === 0) return;

    // Only apply friction if there is a vertical scroll component
    if (Math.abs(e.deltaY) < 0.1) return;

    e.preventDefault();

    const scrollTarget = findScrollableElement(e.target, e.deltaY);
    const scrollAmountY = e.deltaY * (1 - _frictionLevel);

    if (scrollTarget === window) {
      window.scrollBy({ top: scrollAmountY, left: e.deltaX, behavior: "auto" });
    } else {
      scrollTarget.scrollBy({ top: scrollAmountY, left: e.deltaX, behavior: "auto" });
    }
  }

  // ── Break prompt ──────────────────────────────────────────
  let lastPrompt = 0;
  function maybeBreakPrompt(minutes) {
    if (Date.now() - lastPrompt < 9 * 60 * 1000) return;
    lastPrompt = Date.now();
    const el = document.createElement("div");
    el.id = "dde-break";
    el.innerHTML = `
      <div id="dde-break-box">
        <div style="font-size:32px;margin-bottom:8px">⬡</div>
        <h2>You've been scrolling ${minutes} minutes</h2>
        <p>Your brain would appreciate a break right now.</p>
        <div style="display:flex;gap:12px;justify-content:center;margin-top:18px">
          <button id="dde-break-yes">Take a break</button>
          <button id="dde-break-no">Keep scrolling</button>
        </div>
      </div>`;
    document.body.appendChild(el);
    document.getElementById("dde-break-yes").onclick = () => {
      el.remove();
      sessionActiveTime = 0;
      sessionVirtualTime = 0;
      chrome.runtime.sendMessage({ action: "resetActiveTime" }).catch(() => {});
    };
    document.getElementById("dde-break-no").onclick = () => el.remove();
  }

  // ── MutationObserver ──────────────────────────────────────
  function setupObserver() {
    const obs = new MutationObserver(() => {
      if (observerPaused) return;
      clearTimeout(window.__ddeScanTimer);
      window.__ddeScanTimer = setTimeout(scanPage, 500);
    });
    obs.observe(document.body, { childList: true, subtree: true });
  }

  // ── Message handler ───────────────────────────────────────
  function onMessage(req, _sender, send) {
    if (req.action === "toggleFeature") {
      features[req.feature] = req.enabled;
      if (req.feature === "grayscale" && !req.enabled) applyGrayscale(0);
      if (req.feature === "scrollFriction" && !req.enabled) setFriction(0);
      send({ success: true });
    }
    if (req.action === "getStatus") {
      const minutes = Math.floor(sessionActiveTime / 60);
      const avg = allScores.length ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length) : 0;
      send({ minutes, avgScore: avg, postsRewritten, site });
    }
  }

  init();
})();
