class Exporter {
    static async getExportData() {
        return new Promise(resolve => {
            chrome.storage.sync.get(['sessionData', 'settings'], data => {
                const exportData = {
                    exportDate: new Date().toISOString(),
                    extension: 'Dopamine De-escalator',
                    version: '1.0.0',
                    metrics: data.sessionData || {},
                    settings: data.settings || {}
                };
                resolve(exportData);
            });
        });
    }

    static downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    }

    static showNotification(message) {
        const div = document.createElement('div');
        div.textContent = message;
        div.style.cssText = `position:fixed;top:20px;right:20px;background:#4CAF50;color:white;padding:15px 20px;border-radius:4px;z-index:10000`;
        document.body.appendChild(div);
        setTimeout(() => div.remove(), 3000);
    }

    static async exportJSON() {
        const data = await this.getExportData();
        this.downloadFile(JSON.stringify(data, null, 2), 'dopamine-data.json', 'application/json');
        this.showNotification('✅ JSON exported!');
    }

    static async exportCSV() {
        const data = await this.getExportData();
        let csv = 'Metric,Value\n';
        Object.entries(data.metrics).forEach(([k, v]) => csv += `"${k}","${v}"\n`);
        this.downloadFile(csv, 'dopamine-data.csv', 'text/csv');
        this.showNotification('✅ CSV exported!');
    }

    static async exportPDF() {
        const data = await this.getExportData();
        let txt = `DOPAMINE DE-ESCALATOR REPORT\nGenerated: ${new Date().toLocaleString()}\n${'='.repeat(50)}\n\nMETRICS\n`;
        Object.entries(data.metrics).forEach(([k, v]) => txt += `${k}: ${v}\n`);
        this.downloadFile(txt, 'dopamine-report.pdf', 'text/plain');
        this.showNotification('✅ PDF exported!');
    }

    static async exportHTML() {
        const data = await this.getExportData();
        const html = `<!DOCTYPE html><html><head><style>body{font-family:sans-serif;background:#f0f0f0;padding:40px}table{width:100%;border-collapse:collapse}th,td{padding:12px;text-align:left;border-bottom:1px solid #ddd}th{background:#667eea;color:white}</style></head><body><h1>Dopamine De-escalator Report</h1><p>Generated: ${new Date().toLocaleString()}</p><table><tr><th>Metric</th><th>Value</th></tr>${Object.entries(data.metrics).map(([k,v]) => `<tr><td>${k}</td><td>${v}</td></tr>`).join('')}</table></body></html>`;
        this.downloadFile(html, 'dopamine-report.html', 'text/html');
        this.showNotification('✅ HTML exported!');
    }

    static async exportXML() {
        const data = await this.getExportData();
        let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<DopamineDeescalator>\n';
        Object.entries(data.metrics).forEach(([k, v]) => {
            xml += `  <${k.replace(/[^a-zA-Z0-9_]/g, '_')}>${v}</${k.replace(/[^a-zA-Z0-9_]/g, '_')}>\n`;
        });
        xml += '</DopamineDeescalator>';
        this.downloadFile(xml, 'dopamine-data.xml', 'application/xml');
        this.showNotification('✅ XML exported!');
    }

    static async exportTXT() {
        const data = await this.getExportData();
        let txt = `DOPAMINE DE-ESCALATOR REPORT\nGenerated: ${new Date().toLocaleString()}\n${'='.repeat(50)}\n\n`;
        Object.entries(data.metrics).forEach(([k, v]) => txt += `${k}: ${v}\n`);
        this.downloadFile(txt, 'dopamine-report.txt', 'text/plain');
        this.showNotification('✅ TXT exported!');
    }
}

class PopupManager {
    constructor() {
        this.setupEventListeners();
        this.loadSettings();
        this.updateUI();
        this.startTimer();
    }

    setupEventListeners() {
        document.getElementById('rewriteToggle')?.addEventListener('change', e => this.toggleFeature('rewrite', e.target.checked));
        document.getElementById('grayscaleToggle')?.addEventListener('change', e => this.toggleFeature('grayscale', e.target.checked));
        document.getElementById('dopameterToggle')?.addEventListener('change', e => this.toggleFeature('dopameter', e.target.checked));
        document.getElementById('fatigueToggle')?.addEventListener('change', e => this.toggleFeature('fatigue', e.target.checked));

        document.getElementById('exportJSON')?.addEventListener('click', () => Exporter.exportJSON());
        document.getElementById('exportCSV')?.addEventListener('click', () => Exporter.exportCSV());
        document.getElementById('exportPDF')?.addEventListener('click', () => Exporter.exportPDF());
        document.getElementById('exportHTML')?.addEventListener('click', () => Exporter.exportHTML());
        document.getElementById('exportXML')?.addEventListener('click', () => Exporter.exportXML());
        document.getElementById('exportTXT')?.addEventListener('click', () => Exporter.exportTXT());

        document.getElementById('openDashboard')?.addEventListener('click', () => chrome.tabs.create({url: chrome.runtime.getURL('dashboard.html')}));
        document.getElementById('resetStats')?.addEventListener('click', () => {
            if (confirm('Reset all statistics?')) {
                chrome.storage.sync.set({sessionData: {postsRewritten: 0, avgDopamineReduction: 0, fatigueLevel: 0}});
                this.updateUI();
            }
        });
    }

    loadSettings() {
        chrome.storage.sync.get(['features'], data => {
            if (data.features) {
                Object.entries(data.features).forEach(([k, v]) => {
                    const el = document.getElementById(k + 'Toggle');
                    if (el) el.checked = v;
                });
            }
        });
    }

    toggleFeature(feature, enabled) {
        chrome.storage.sync.get(['features'], data => {
            const features = data.features || {};
            features[feature] = enabled;
            chrome.storage.sync.set({features});
            chrome.tabs.query({active: true, currentWindow: true}, tabs => {
                if (tabs[0]) chrome.tabs.sendMessage(tabs[0].id, {action: 'toggleFeature', feature, enabled}).catch(() => {});
            });
        });
    }

    updateUI() {
        chrome.storage.sync.get(['sessionData'], data => {
            if (data.sessionData) {
                const s = data.sessionData;
                document.getElementById('postsRewritten').textContent = s.postsRewritten || 0;
                document.getElementById('avgDopamineReduction').textContent = (s.avgDopamineReduction || 0) + '%';
                document.getElementById('fatigueStats').textContent = (s.fatigueLevel || 0) + '%';
                document.getElementById('originalScore').textContent = s.originalScore || '--';
                document.getElementById('currentScore').textContent = s.currentScore || '--';
                document.getElementById('fatigueLevel').textContent = (s.fatigueLevel || 0) + '%';
            }
        });
    }

    startTimer() {
        setInterval(() => {
            chrome.storage.sync.get(['sessionStartTime'], data => {
                if (data.sessionStartTime) {
                    const e = Math.floor((Date.now() - data.sessionStartTime) / 1000);
                    const h = Math.floor(e / 3600);
                    const m = Math.floor((e % 3600) / 60);
                    const s = e % 60;
                    document.getElementById('sessionTime').textContent = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
                }
            });
        }, 1000);
    }
}

window.addEventListener('DOMContentLoaded', () => new PopupManager());