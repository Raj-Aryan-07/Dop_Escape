const $ = (id) => document.getElementById(id);

function bindRange(sliderId, labelId) {
    const slider = document.getElementById(sliderId);
    const label = document.getElementById(labelId);

    if (!slider || !label) {
        console.error("Missing element:", sliderId, labelId);
        return;
    }

    // Initial value
    label.textContent = slider.value;

    // Update while dragging
    slider.addEventListener("input", function () {
        label.textContent = this.value;
    });

    // Update after release
    slider.addEventListener("change", function () {
        label.textContent = this.value;
    });
}

document.addEventListener("DOMContentLoaded", function () {

    bindRange("threshWarn", "warnVal");
    bindRange("threshFriction", "frictionVal");
    bindRange("threshFull", "fullVal");
    bindRange("frictionStrength", "frictionStrVal");
    bindRange("scoreThreshold", "scoreThreshVal");

    const ollamaEnabled = $("ollamaEnabled");
    const ollamaFields = $("ollamaFields");

    if (ollamaEnabled && ollamaFields) {
        ollamaEnabled.addEventListener("change", function (e) {
            ollamaFields.style.display =
                e.target.checked ? "block" : "none";
        });
    }
});