// ═══════════════════════════════════════════════════════════
// Dopamine De-escalator v2.0 — popup.js
// ═══════════════════════════════════════════════════════════

// ── Helpers ────────────────────────────────────────────────
function $(id) { return document.getElementById(id); }
function getStorage(keys) { return new Promise(r => chrome.storage.sync.get(keys, r)); }
function setStorage(obj) { return new Promise(r => chrome.storage.sync.set(obj, r)); }

function toast(msg, color = "#0d9488") {
  const el = document.createElement("div");
  el.className = "dde-toast";
  el.style.background = color;
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2600);
}

// ── Exporter ───────────────────────────────────────────────
const Exporter = {
  async getData() {
    const data = await getStorage(["sessionData", "settings", "ollamaStatus"]);
    return {
      exportDate: new Date().toISOString(),
      extension: "Dopamine De-escalator",
      version: "2.0.0",
      aiEngine: data.settings?.ollamaEnabled ? `Ollama (${data.settings.ollamaModel})` : "Rule-based fallback",
      ollamaStatus: data.ollamaStatus || "unchecked",
      metrics: data.sessionData || {},
      settings: data.settings || {},
    };
  },

  download(content, filename, mime) {
    const a = Object.assign(document.createElement("a"), {
      href: URL.createObjectURL(new Blob([content], { type: mime })),
      download: filename,
    });
    document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 200);
  },

  async json() {
    const d = await this.getData();
    this.download(JSON.stringify(d, null, 2), "dde-report.json", "application/json");
    toast("✅ JSON exported");
  },

  async csv() {
    const d = await this.getData();
    let csv = "Metric,Value\n";
    csv += `Export Date,${d.exportDate}\nAI Engine,${d.aiEngine}\n`;
    Object.entries(d.metrics).forEach(([k, v]) => csv += `"${k}","${v}"\n`);
    this.download(csv, "dde-report.csv", "text/csv");
    toast("✅ CSV exported");
  },

  async html() {
    const d = await this.getData();
    const rows = Object.entries(d.metrics).map(([k, v]) =>
      `<tr><td>${k}</td><td><strong>${v}</strong></td></tr>`).join("");
    const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">
<title>DDE Report — ${new Date().toLocaleDateString()}</title>
<style>
  body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#0f1b2d;color:#f8fafc;padding:40px;margin:0}
  h1{color:#0d9488;font-size:28px}p{color:#94a3b8;font-size:13px}
  table{width:100%;border-collapse:collapse;margin-top:24px}
  th,td{padding:12px 16px;text-align:left;border-bottom:1px solid #2d4a7a;font-size:13px}
  th{background:#1e3154;color:#0d9488;font-size:11px;text-transform:uppercase;letter-spacing:.06em}
  td strong{color:#0d9488}
</style></head><body>
<h1>⬡ Dopamine De-escalator Report</h1>
<p>Generated: ${new Date().toLocaleString()} · AI Engine: <strong>${d.aiEngine}</strong></p>
<table><tr><th>Metric</th><th>Value</th></tr>${rows}</table>
</body></html>`;
    this.download(html, "dde-report.html", "text/html");
    toast("✅ HTML exported");
  },

  async xml() {
    const d = await this.getData();
    const safe = s => s.replace(/[^a-zA-Z0-9_]/g, "_");
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<DopamineDeescalator>\n`;
    xml += `  <exportDate>${d.exportDate}</exportDate>\n`;
    xml += `  <aiEngine>${d.aiEngine}</aiEngine>\n`;
    Object.entries(d.metrics).forEach(([k, v]) => xml += `  <${safe(k)}>${v}</${safe(k)}>\n`);
    xml += `</DopamineDeescalator>`;
    this.download(xml, "dde-report.xml", "application/xml");
    toast("✅ XML exported");
  },

  async txt() {
    const d = await this.getData();
    let t = `DOPAMINE DE-ESCALATOR REPORT\nGenerated: ${new Date().toLocaleString()}\nAI Engine: ${d.aiEngine}\n${"=".repeat(50)}\n\nMETRICS\n`;
    Object.entries(d.metrics).forEach(([k, v]) => t += `${k}: ${v}\n`);
    this.download(t, "dde-report.txt", "text/plain");
    toast("✅ TXT exported");
  },

  async pdf() {
    // PDF is generated as a styled HTML — user can print-to-PDF from browser
    const d = await this.getData();
    const rows = Object.entries(d.metrics).map(([k, v]) =>
      `<tr><td>${k}</td><td>${v}</td></tr>`).join("");
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
<title>DDE Report</title>
<style>
  @media print { @page { margin: 20mm; } }
  body{font-family:Arial,sans-serif;padding:30px;color:#111}
  h1{font-size:24px;color:#0d9488;border-bottom:2px solid #0d9488;padding-bottom:8px}
  p{font-size:12px;color:#666}table{width:100%;border-collapse:collapse;margin-top:20px}
  th,td{padding:10px 12px;text-align:left;border-bottom:1px solid #ddd;font-size:12px}
  th{background:#0d9488;color:white}
</style></head><body>
<h1>⬡ Dopamine De-escalator Report</h1>
<p>Generated: ${new Date().toLocaleString()}</p>
<p><em>Open this file in a browser and use File → Print → Save as PDF</em></p>
<table><tr><th>Metric</th><th>Value</th></tr>${rows}</table>
</body></html>`;
    this.download(html, "dde-report-printable.html", "text/html");
    toast("✅ Open file → Print → Save as PDF");
  },
};

// ── PopupManager ───────────────────────────────────────────
class PopupManager {
  constructor() {
    this.setupToggles();
    this.setupExports();
    this.setupActions();
    this.loadSettings();
    this.refreshUI();
    this.startTimer();
    this.checkOllamaStatus();
    setInterval(() => this.refreshUI(), 3000);
  }

  setupToggles() {
    ["rewrite","grayscale","dopameter","fatigue","scrollFriction"].forEach(feat => {
      $(`${feat}Toggle`)?.addEventListener("change", e => this.toggleFeature(feat, e.target.checked));
    });
  }

  setupExports() {
    $("exportJSON")?.addEventListener("click", () => Exporter.json());
    $("exportCSV")?.addEventListener("click",  () => Exporter.csv());
    $("exportHTML")?.addEventListener("click", () => Exporter.html());
    $("exportXML")?.addEventListener("click",  () => Exporter.xml());
    $("exportTXT")?.addEventListener("click",  () => Exporter.txt());
    $("exportPDF")?.addEventListener("click",  () => Exporter.pdf());
  }

  setupActions() {
    $("openDashboard")?.addEventListener("click", () =>
      chrome.tabs.create({ url: chrome.runtime.getURL("dashboard.html") }));

    $("openSettings")?.addEventListener("click", () =>
      chrome.tabs.create({ url: chrome.runtime.getURL("settings.html") }));

    $("resetStats")?.addEventListener("click", () => {
      if (confirm("Reset all statistics?")) {
        chrome.storage.sync.set({
          sessionData: { postsRewritten: 0, avgDopamineReduction: 0, fatigueLevel: 0, originalScore: 0, currentScore: 0 },
          sessionStartTime: Date.now(),
        });
        this.refreshUI();
        toast("Stats reset");
      }
    });
  }

  loadSettings() {
    getStorage(["features"]).then(data => {
      if (!data.features) return;
      const f = data.features;
      ["rewrite","grayscale","dopameter","fatigue","scrollFriction"].forEach(feat => {
        const el = $(`${feat}Toggle`);
        if (el && f[feat] !== undefined) el.checked = f[feat];
      });
    });
  }

  toggleFeature(feature, enabled) {
    getStorage(["features"]).then(data => {
      const features = data.features || {};
      features[feature] = enabled;
      setStorage({ features });
      chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
        if (tabs[0]) {
          chrome.tabs.sendMessage(tabs[0].id, { action: "toggleFeature", feature, enabled }).catch(() => {});
        }
      });
    });
  }

  refreshUI() {
    getStorage(["sessionData"]).then(data => {
      const s = data.sessionData || {};
      $("postsRewritten").textContent = s.postsRewritten || 0;
      $("avgDopamineReduction").textContent = (s.avgDopamineReduction || 0) + "%";
      $("fatigueStats").textContent = (s.fatigueLevel || 0) + "%";
      $("originalScore").textContent = s.originalScore || "--";
      $("currentScore").textContent = s.postsRewritten > 0 ? (s.currentScore || 8) : "--";

      const fatigue = s.fatigueLevel || 0;
      $("fatigueLevel").textContent = fatigue + "%";
      $("fatigueBar").style.width = fatigue + "%";
      $("fatigueBar").style.background =
        fatigue >= 70 ? "#ef4444" : fatigue >= 40 ? "#f59e0b" : "#0d9488";
    });
  }

  startTimer() {
    const tick = () => {
      getStorage(["sessionStartTime"]).then(data => {
        if (!data.sessionStartTime) return;
        const elapsed = Math.floor((Date.now() - data.sessionStartTime) / 1000);
        const h = Math.floor(elapsed / 3600);
        const m = Math.floor((elapsed % 3600) / 60);
        const s = elapsed % 60;
        $("sessionTime").textContent =
          `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
      });
    };
    tick();
    setInterval(tick, 1000);
  }

  checkOllamaStatus() {
    getStorage(["settings", "ollamaStatus"]).then(data => {
      const cfg = data.settings || {};
      const st = $("ollamaStatus");
      const eng = $("engineLabel");

      if (!cfg.ollamaEnabled) {
        st.className = "badge-grey"; st.textContent = "Not enabled";
        eng.textContent = "Rule-based (fallback)";
        return;
      }

      eng.textContent = `Ollama · ${cfg.ollamaModel || "llama3.2"}`;

      // Ping Ollama
      chrome.runtime.sendMessage(
        { action: "checkOllama", url: cfg.ollamaUrl, model: cfg.ollamaModel },
        res => {
          if (res && res.ok) {
            st.className = "badge-ok"; st.textContent = "Connected ✓";
            eng.textContent = `Ollama · ${cfg.ollamaModel} ✓`;
          } else {
            st.className = "badge-err"; st.textContent = "Not running";
            eng.textContent = "Rule-based (Ollama offline)";
          }
        }
      );
    });
  }
}

window.addEventListener("DOMContentLoaded", () => new PopupManager());
