// ═══════════════════════════════════════════════════════════
// Dopamine De-escalator — settings.js (FIXED v2.1)
// All button listeners now wired: Check, Pull, Save, Close
// ═══════════════════════════════════════════════════════════

const $ = (id) => document.getElementById(id);

// ── AbortSignal polyfill for older Chrome ─────────────────
function makeSignal(ms) {
  if (typeof AbortSignal.timeout === "function") return AbortSignal.timeout(ms);
  const c = new AbortController();
  setTimeout(() => c.abort(), ms);
  return c.signal;
}

// ── Range binding ─────────────────────────────────────────
function bindRange(sliderId, labelId) {
  const slider = document.getElementById(sliderId);
  const label = document.getElementById(labelId);
  if (!slider || !label) return;
  label.textContent = slider.value;
  slider.addEventListener("input", function () { label.textContent = this.value; });
  slider.addEventListener("change", function () { label.textContent = this.value; });
}

// ── DOMContentLoaded ──────────────────────────────────────
document.addEventListener("DOMContentLoaded", function () {

  // Bind all range sliders
  bindRange("threshWarn", "warnVal");
  bindRange("threshFriction", "frictionVal");
  bindRange("threshFull", "fullVal");
  bindRange("frictionStrength", "frictionStrVal");
  bindRange("scoreThreshold", "scoreThreshVal");

  // ── Ollama toggle ─────────────────────────────────────
  const ollamaEnabled = $("ollamaEnabled");
  const ollamaFields = $("ollamaFields");
  if (ollamaEnabled && ollamaFields) {
    ollamaEnabled.addEventListener("change", function (e) {
      ollamaFields.style.display = e.target.checked ? "block" : "none";
    });
  }

  // ── Load saved settings on page load ──────────────────
  chrome.storage.sync.get(["settings"], (data) => {
    if (!data.settings) return;
    const s = data.settings;
    if (s.ollamaEnabled !== undefined) $("ollamaEnabled").checked = s.ollamaEnabled;
    if (s.ollamaUrl) $("ollamaUrl").value = s.ollamaUrl;
    if (s.ollamaModel) $("ollamaModel").value = s.ollamaModel;
    if (s.thresholdWarn) {
      $("threshWarn").value = s.thresholdWarn;
      $("warnVal").textContent = s.thresholdWarn;
    }
    if (s.thresholdFriction) {
      $("threshFriction").value = s.thresholdFriction;
      $("frictionVal").textContent = s.thresholdFriction;
    }
    if (s.interventionThreshold) {
      $("threshFull").value = s.interventionThreshold;
      $("fullVal").textContent = s.interventionThreshold;
    }
    if (s.frictionStrength) {
      $("frictionStrength").value = s.frictionStrength;
      $("frictionStrVal").textContent = s.frictionStrength;
    }
    if (s.scoreThreshold) {
      $("scoreThreshold").value = s.scoreThreshold;
      $("scoreThreshVal").textContent = s.scoreThreshold;
    }
    if (s.ollamaEnabled && ollamaFields) {
      ollamaFields.style.display = "block";
    }
  });

  // ── CHECK OLLAMA BUTTON ────────────────────────────────
  $("btnCheck")?.addEventListener("click", async function () {
    const url = $("ollamaUrl").value.trim();
    const model = $("ollamaModel").value.trim();

    $("btnCheck").textContent = "Checking…";
    $("btnCheck").disabled = true;
    $("statusPanel").classList.add("show");
    $("srvStatus").textContent = "…";
    $("modelStatus").textContent = "…";

    chrome.runtime.sendMessage(
      { action: "checkOllama", url, model },
      (res) => {
        $("btnCheck").textContent = "Check";
        $("btnCheck").disabled = false;

        if (chrome.runtime.lastError) {
          $("srvStatus").textContent = "✗ SW error";
          $("srvStatus").className = "err";
          $("modelStatus").textContent = "—";
          return;
        }

        if (res && res.ok) {
          $("srvStatus").textContent = "✓ Running";
          $("srvStatus").className = "ok";
          $("modelStatus").textContent = res.modelAvailable ? "✓ Available" : "⚠ Not installed";
          $("modelStatus").className = res.modelAvailable ? "ok" : "warn";

          if (res.models && res.models.length > 0) {
            const listWrap = $("modelListWrap");
            const list = $("modelList");
            listWrap.style.display = "block";
            list.innerHTML = "";
            res.models.forEach((m) => {
              const tag = document.createElement("span");
              tag.className =
                "model-tag" + (m.startsWith(model.split(":")[0]) ? " active" : "");
              tag.textContent = m;
              tag.style.cursor = "pointer";
              tag.onclick = () => {
                document
                  .querySelectorAll(".model-tag")
                  .forEach(t => t.classList.remove("active"));

                tag.classList.add("active");

                $("ollamaModel").value = m;

                console.log("Selected model:", m);
              };
              list.appendChild(tag);
            });
          }
        } else {
          $("srvStatus").textContent = "✗ Not running";
          $("srvStatus").className = "err";
          $("modelStatus").textContent = "—";
        }
      }
    );
  });

  // ── PULL MODEL BUTTON ──────────────────────────────────
  $("btnPull")?.addEventListener("click", async function () {
    const url = $("ollamaUrl").value.trim();
    const model = $("ollamaModel").value.trim();

    if (!model) {
      $("pullStatus").textContent = "✗ Enter model name";
      return;
    }

    $("pullStatus").textContent = `Pulling ${model}… (may take minutes)`;
    $("btnPull").disabled = true;

    chrome.runtime.sendMessage(
      { action: "pullOllamaModel", url, model },
      (res) => {
        $("btnPull").disabled = false;

        if (chrome.runtime.lastError) {
          $("pullStatus").textContent = "✗ Service worker error";
          return;
        }

        if (res && res.ok) {
          $("pullStatus").textContent = `✓ ${model} pulled successfully!`;
          $("ollamaModel").value = model;
        } else {
          $("pullStatus").textContent = `✗ ${res?.error || "Pull failed"}`;
        }
      }
    );
  });

  // ── SAVE SETTINGS BUTTON ───────────────────────────────
  $("btnSave")?.addEventListener("click", function () {
    const settings = {
      ollamaEnabled: $("ollamaEnabled").checked,
      ollamaUrl: $("ollamaUrl").value.trim(),
      ollamaModel: $("ollamaModel").value.trim(),
      thresholdWarn: parseInt($("threshWarn").value) || 10,
      thresholdFriction: parseInt($("threshFriction").value) || 20,
      interventionThreshold: parseInt($("threshFull").value) || 30,
      frictionStrength: parseInt($("frictionStrength").value) || 40,
      scoreThreshold: parseInt($("scoreThreshold").value) || 45,
    };

    chrome.storage.sync.set({ settings }, () => {
      const t = $("savedToast");
      if (!t) return;
      t.classList.add("show");
      setTimeout(() => t.classList.remove("show"), 2200);
    });
  });

  // ── CLOSE BUTTON ───────────────────────────────────────
  $("btnClose")?.addEventListener("click", function () {
    chrome.tabs.getCurrent((tab) => {
      if (tab) {
        chrome.tabs.remove(tab.id);
      } else {
        window.close();
      }
    });
  });

});
