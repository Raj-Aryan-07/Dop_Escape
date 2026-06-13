chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.sync.set({
        features: {rewrite: true, grayscale: false, dopameter: true, fatigue: true},
        settings: {interventionThreshold: 20},
        sessionData: {postsRewritten: 0, avgDopamineReduction: 0, fatigueLevel: 0}
    });
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
    if (changeInfo.status === 'complete') {
        chrome.storage.sync.get(['sessionStartTime'], data => {
            if (!data.sessionStartTime) {
                chrome.storage.sync.set({sessionStartTime: Date.now()});
            }
        });
    }
});

// Proxy listener for Ollama
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'rewriteWithOllama') {
        callOllama(request.text).then(sendResponse);
        return true; // Keep message channel open for async response
    }
});

async function callOllama(text) {
    try {
        const systemPrompt = "You are a dopamine reduction engine. Rewrite this social media post into neutral, factual language. Remove emotional amplifiers, clickbait, all caps, and emojis. Preserve facts. Output ONLY the rewritten text, no preamble or meta-commentary.";
        
        const response = await fetch('http://localhost:11434/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'phi3:mini', // Change this if you downloaded a different model
                prompt: `${systemPrompt}\n\nOriginal Post: ${text}`,
                stream: false
            })
        });

        const data = await response.json();
        return { success: true, rewrittenText: data.response.trim() };
    } catch (error) {
        console.error("Ollama API Error:", error);
        return { success: false, error: error.message };
    }
}