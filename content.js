class ContentRewriter {
    constructor() {
        this.postsRewritten = 0;
        this.sessionStartTime = Date.now();
        this.init();
    }

    async init() {
        await this.loadSettings();
        this.setupObserver();
        this.listenForMessages();
        setTimeout(() => this.rewriteContent(), 500);
    }

    loadSettings() {
        return new Promise(resolve => {
            chrome.storage.sync.get(['features', 'settings', 'sessionStartTime'], data => {
                this.features = data.features || {rewrite: true, grayscale: false, dopameter: true, fatigue: true};
                this.settings = data.settings || {interventionThreshold: 20};
                if (!data.sessionStartTime) {
                    chrome.storage.sync.set({sessionStartTime: this.sessionStartTime});
                }
                resolve();
            });
        });
    }

    setupObserver() {
        new MutationObserver(() => {
            if (this.features.rewrite) this.rewriteContent();
        }).observe(document.body, {childList: true, subtree: true});
    }

    rewriteContent() {
        const selectors = ['article', '[role="article"]', '.post', '[data-testid="tweet"]'];
        selectors.forEach(sel => {
            try {
                document.querySelectorAll(sel).forEach(el => {
                    // Prevent re-processing elements that are currently waiting for the API
                    if (!el.dataset.rewritten && !el.dataset.processing) {
                        const text = el.innerText || el.textContent;
                        if (text && text.trim().length > 10) {
                            const score = this.calcScore(text);
                            if (score > 40) {
                                el.dataset.processing = 'true';
                                el.style.opacity = '0.5'; // Visual indicator of processing
                                
                                // Send to Background script (Ollama)
                                chrome.runtime.sendMessage({ action: 'rewriteWithOllama', text: text }, response => {
                                    if (response && response.success) {
                                        el.innerText = response.rewrittenText;
                                    } else {
                                        // Fallback if Ollama is offline
                                        el.innerText = this.fallbackRewrite(text); 
                                    }
                                    el.dataset.rewritten = 'true';
                                    el.style.opacity = '1';
                                    this.postsRewritten++;
                                    this.updateStats();
                                });
                            }
                        }
                    }
                });
            } catch (e) {}
        });
    }

    // Advanced scoring algorithm from the Blueprint Appendix
    calcScore(text) {
        let score = 0;
        const t = text || '';
        
        // Emoji density
        const emojiCount = (t.match(/\p{Emoji}/gu) || []).length;
        score += Math.min(25, emojiCount * 5);
        
        // ALL CAPS ratio
        const words = t.split(/\s+/).filter(w => w.length > 3);
        const capsRatio = words.filter(w => w === w.toUpperCase()).length / (words.length || 1);
        score += Math.min(20, Math.round(capsRatio * 40));
        
        // Exclamation marks
        const excl = (t.match(/!/g) || []).length;
        score += Math.min(15, excl * 5);
        
        // Clickbait phrases
        const clickbait = ["you won't believe", "this changes everything", "breaking", "shocking", "must see", "going viral", "everyone is talking"];
        const cb = clickbait.filter(p => t.toLowerCase().includes(p)).length;
        score += Math.min(20, cb * 7);
        
        // Sentiment amplifiers
        const amplifiers = ["amazing", "incredible", "devastating", "terrifying", "insane", "unbelievable", "explosive"];
        const amp = amplifiers.filter(a => t.toLowerCase().includes(a)).length;
        score += Math.min(20, amp * 5);
        
        return Math.min(100, score);
    }

    fallbackRewrite(text) {
        text = text.replace(/!+/g, '.').replace(/\?{2,}/g, '?');
        text = text.replace(/\b([A-Z]{3,})\b/g, m => m.charAt(0) + m.slice(1).toLowerCase());
        const map = {'shocking': 'notable', 'viral': 'circulating', 'amazing': 'notable', 'incredible': 'reported'};
        Object.entries(map).forEach(([old, neu]) => {text = text.replace(new RegExp(old, 'gi'), neu);});
        return text;
    }

    updateStats() {
        const duration = (Date.now() - this.sessionStartTime) / 1000 / 60;
        const fatigue = duration > 20 ? Math.min(100, (duration / 20) * 50) : 0;
        chrome.storage.sync.set({
            sessionData: {
                postsRewritten: this.postsRewritten,
                avgDopamineReduction: Math.round(this.postsRewritten * 1.5),
                fatigueLevel: Math.round(fatigue)
            }
        });
    }

    listenForMessages() {
        chrome.runtime.onMessage.addListener((req, sender, send) => {
            if (req.action === 'toggleFeature') {
                this.features[req.feature] = req.enabled;
                if (req.feature === 'grayscale') {
                    document.documentElement.style.filter = req.enabled ? 'grayscale(100%)' : '';
                }
                send({success: true});
            }
        });
    }
}

new ContentRewriter();