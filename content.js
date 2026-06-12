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
                    if (!el.dataset.rewritten) {
                        const text = el.innerText || el.textContent;
                        if (text && text.length > 0) {
                            const score = this.calcScore(text);
                            if (score > 40) {
                                el.innerText = this.rewriteText(text);
                                el.dataset.rewritten = 'true';
                                this.postsRewritten++;
                                this.updateStats();
                            }
                        }
                    }
                });
            } catch (e) {}
        });
    }

    calcScore(text) {
        let score = 0;
        score += (text.match(/!/g) || []).length * 5;
        score += (text.match(/\?/g) || []).length * 5;
        score += (text.match(/[A-Z]{2,}/g) || []).length * 5;
        const phrases = ['shocking', 'viral', 'trending', 'amazing', 'incredible'];
        phrases.forEach(p => {if (text.toLowerCase().includes(p)) score += 15;});
        return Math.min(100, score);
    }

    rewriteText(text) {
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