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