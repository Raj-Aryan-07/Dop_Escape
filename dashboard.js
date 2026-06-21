const fatigueHistory = [];

function fmt(secs) {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  return `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

function update() {
  chrome.storage.local.get(['sessionData','sessionActiveTime','ollamaStatus'], localData => {
    chrome.storage.sync.get(['settings'], syncData => {
      const s = localData.sessionData || {};
      const cfg = syncData.settings || {};

      document.getElementById('postsVal').textContent = s.postsRewritten || 0;
      document.getElementById('dopVal').textContent = (s.avgDopamineReduction || 0) + '%';
      document.getElementById('fatigueVal').textContent = (s.fatigueLevel || 0) + '%';
      document.getElementById('origScoreVal').textContent = s.originalScore || '--';
      document.getElementById('curScoreVal').textContent = s.postsRewritten > 0 ? (s.currentScore || 8) : '--';

      const elapsed = localData.sessionActiveTime || 0;
      document.getElementById('sessionVal').textContent = fmt(elapsed);

      // AI status
      const badge = document.getElementById('aiStatusBadge');
      const card  = document.getElementById('aiCard');
      const title = document.getElementById('aiCardTitle');
      const desc  = document.getElementById('aiCardDesc');
      if (cfg.ollamaEnabled) {
        if (localData.ollamaStatus === 'ok') {
          badge.textContent = '🤖 Ollama: connected'; badge.style.color = '#22c55e';
          card.style.display = 'flex'; card.className = 'ai-card';
          title.textContent = 'Ollama AI Connected';
          desc.textContent = `Model: ${cfg.ollamaModel || 'llama3.2'} · Rewriting locally`;
        } else {
          badge.textContent = '⚠ Ollama: offline'; badge.style.color = '#f59e0b';
          card.style.display = 'flex'; card.className = 'ai-card ai-warn';
          title.textContent = 'Ollama Offline';
          desc.textContent = 'Using rule-based fallback. Start Ollama to enable AI rewrites.';
        }
      } else {
        badge.textContent = 'AI: rule-based'; badge.style.color = '#94a3b8';
        card.style.display = 'none';
      }

      // Bar chart
      const fatigue = s.fatigueLevel || 0;
      fatigueHistory.push(fatigue);
      if (fatigueHistory.length > 12) fatigueHistory.shift();
      const chart = document.getElementById('barChart');
      const max = Math.max(...fatigueHistory, 1);
      chart.innerHTML = fatigueHistory.map((v, i) => `
        <div class="bar-wrap">
          <div class="bar" style="height:${Math.max(4, Math.round((v/max)*110))}px;background:${v>=70?'#ef4444':v>=40?'#f59e0b':'linear-gradient(180deg,#0d9488,#2563eb)'}"></div>
          <div class="bar-val">${v}%</div>
          <div class="bar-label">${i===fatigueHistory.length-1?'now':'-'+(fatigueHistory.length-1-i)*5+'s'}</div>
        </div>`).join('');

      document.getElementById('lastUpdated').textContent = 'Last updated: ' + new Date().toLocaleTimeString();
    });
  });
}

document.getElementById('btnReset').addEventListener('click', () => {
  if (confirm('Reset all stats?')) {
    chrome.storage.local.set({
      sessionData: {postsRewritten:0,avgDopamineReduction:0,fatigueLevel:0,originalScore:0,currentScore:0},
      sessionActiveTime: 0,
      sessionVirtualTime: 0
    }, () => {
      chrome.runtime.sendMessage({ action: "resetActiveTime" });
      update();
    });
  }
});

update();
setInterval(update, 5000);

// Fast timer-only update every second for smooth ticking
setInterval(() => {
  chrome.storage.local.get(['sessionActiveTime'], data => {
    document.getElementById('sessionVal').textContent = fmt(data.sessionActiveTime || 0);
  });
}, 1000);

// Reactive: update timer instantly on storage change
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.sessionActiveTime) {
    document.getElementById('sessionVal').textContent = fmt(changes.sessionActiveTime.newValue || 0);
  }
});
