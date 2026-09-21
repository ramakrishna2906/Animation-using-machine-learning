/**
 * Spider-Verse Studio - Shared Accessibility (A11Y) System
 * Provides:
 * - High-visibility keyboard focus management
 * - Screen reader announcements (aria-live polite region)
 * - Accessible Modal Dialog (Keyboard guide & preferences)
 * - Accessibility Settings (Reduced Motion, High Contrast, Large Text)
 * - Global Keyboard Shortcuts (P: Play/Pause, 1-6: Multiverse Presets, Space: Action, ?: Help)
 */

class SpiderVerseA11Y {
  constructor() {
    this.announcer = null;
    this.modal = null;
    this.settings = {
      reducedMotion: false,
      highContrast: false,
      largeText: false
    };

    this.init();
  }

  init() {
    this.createAnnouncer();
    this.loadSettings();
    this.createA11yModal();
    this.bindGlobalShortcuts();
    this.bindA11yButtons();
  }

  // Screen Reader Live Region
  createAnnouncer() {
    let el = document.getElementById("a11y-announcer");
    if (!el) {
      el = document.createElement("div");
      el.id = "a11y-announcer";
      el.setAttribute("role", "status");
      el.setAttribute("aria-live", "polite");
      el.setAttribute("aria-atomic", "true");
      el.className = "sr-only";
      document.body.appendChild(el);
    }
    this.announcer = el;
  }

  announce(message) {
    if (!this.announcer) return;
    // Clear and set to trigger screen reader readout
    this.announcer.textContent = "";
    setTimeout(() => {
      this.announcer.textContent = message;
    }, 50);
  }

  // Settings Management
  loadSettings() {
    // Check OS preference for reduced motion
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const saved = localStorage.getItem("spiderverse_a11y_settings");

    if (saved) {
      try {
        this.settings = Object.assign(this.settings, JSON.parse(saved));
      } catch (e) {
        // ignore
      }
    } else if (prefersReducedMotion) {
      this.settings.reducedMotion = true;
    }

    this.applySettings();
  }

  saveSettings() {
    localStorage.setItem("spiderverse_a11y_settings", JSON.stringify(this.settings));
    this.applySettings();
  }

  applySettings() {
    const root = document.documentElement;

    if (this.settings.reducedMotion) {
      root.classList.add("reduced-motion");
    } else {
      root.classList.remove("reduced-motion");
    }

    if (this.settings.highContrast) {
      root.classList.add("high-contrast");
    } else {
      root.classList.remove("high-contrast");
    }

    if (this.settings.largeText) {
      root.classList.add("large-text");
    } else {
      root.classList.remove("large-text");
    }
  }

  // Accessible Modal for Settings & Shortcuts
  createA11yModal() {
    let modal = document.getElementById("a11y-modal");
    if (modal) return;

    modal = document.createElement("div");
    modal.id = "a11y-modal";
    modal.className = "a11y-modal-backdrop";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-labelledby", "a11y-modal-title");
    modal.setAttribute("hidden", "true");

    modal.innerHTML = `
      <div class="a11y-modal-content">
        <div class="a11y-modal-header">
          <h2 id="a11y-modal-title" class="a11y-modal-title">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 2c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm9 7h-6v13h-2v-6h-2v6H9V9H3V7h18v2z"/>
            </svg>
            Accessibility & Keyboard Shortcuts
          </h2>
          <button type="button" class="a11y-close-btn" id="a11y-close-btn" aria-label="Close Accessibility Settings">
            &times;
          </button>
        </div>

        <div class="a11y-modal-body">
          <section class="a11y-section">
            <h3 class="a11y-section-title">Display & Sensory Preferences</h3>
            <div class="a11y-toggle-row">
              <div>
                <label for="toggle-reduced-motion" class="a11y-label">Reduce Motion / Calm Mode</label>
                <div class="a11y-subtext">Disables camera swings, glitch flashing, and rapid particles for vestibular comfort.</div>
              </div>
              <input type="checkbox" id="toggle-reduced-motion" class="a11y-checkbox">
            </div>

            <div class="a11y-toggle-row">
              <div>
                <label for="toggle-high-contrast" class="a11y-label">High Contrast Mode</label>
                <div class="a11y-subtext">Enhances borders, text contrast, and panel backgrounds to WCAG AAA levels.</div>
              </div>
              <input type="checkbox" id="toggle-high-contrast" class="a11y-checkbox">
            </div>

            <div class="a11y-toggle-row">
              <div>
                <label for="toggle-large-text" class="a11y-label">Enhanced Legibility & Large Text</label>
                <div class="a11y-subtext">Scales typography and increases button hit targets for better readability.</div>
              </div>
              <input type="checkbox" id="toggle-large-text" class="a11y-checkbox">
            </div>
          </section>

          <section class="a11y-section">
            <h3 class="a11y-section-title">Keyboard Navigation & Shortcuts</h3>
            <div class="a11y-shortcuts-grid">
              <div class="shortcut-item"><kbd>P</kbd> or <kbd>Space</kbd> <span>Play / Pause Animation</span></div>
              <div class="shortcut-item"><kbd>&larr;</kbd> / <kbd>&rarr;</kbd> <span>Step 1 Frame Backward / Forward</span></div>
              <div class="shortcut-item"><kbd>1</kbd> - <kbd>6</kbd> <span>Switch Multiverse Preset (Miles, Gwen, 2099...)</span></div>
              <div class="shortcut-item"><kbd>T</kbd> <span>Trigger "THWIP!" Comic Sound Burst</span></div>
              <div class="shortcut-item"><kbd>B</kbd> <span>Trigger "BOOM!" Comic Explosion</span></div>
              <div class="shortcut-item"><kbd>S</kbd> <span>Render Neural Spider-Verse Frame</span></div>
              <div class="shortcut-item"><kbd>C</kbd> <span>Toggle Before / After Split Compare</span></div>
              <div class="shortcut-item"><kbd>?</kbd> <span>Open this Accessibility Guide</span></div>
              <div class="shortcut-item"><kbd>Esc</kbd> <span>Close Modals / Overlays</span></div>
            </div>
          </section>
        </div>

        <div class="a11y-modal-footer">
          <button type="button" class="export-btn" id="a11y-save-btn">Done</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    this.modal = modal;

    // Connect form inputs
    const motionCheck = document.getElementById("toggle-reduced-motion");
    const contrastCheck = document.getElementById("toggle-high-contrast");
    const textCheck = document.getElementById("toggle-large-text");

    if (motionCheck) {
      motionCheck.checked = this.settings.reducedMotion;
      motionCheck.addEventListener("change", (e) => {
        this.settings.reducedMotion = e.target.checked;
        this.saveSettings();
        this.announce(e.target.checked ? "Reduced motion enabled" : "Reduced motion disabled");
      });
    }

    if (contrastCheck) {
      contrastCheck.checked = this.settings.highContrast;
      contrastCheck.addEventListener("change", (e) => {
        this.settings.highContrast = e.target.checked;
        this.saveSettings();
        this.announce(e.target.checked ? "High contrast mode enabled" : "High contrast mode disabled");
      });
    }

    if (textCheck) {
      textCheck.checked = this.settings.largeText;
      textCheck.addEventListener("change", (e) => {
        this.settings.largeText = e.target.checked;
        this.saveSettings();
        this.announce(e.target.checked ? "Large text mode enabled" : "Large text mode disabled");
      });
    }

    const closeBtn = document.getElementById("a11y-close-btn");
    const saveBtn = document.getElementById("a11y-save-btn");
    if (closeBtn) closeBtn.addEventListener("click", () => this.closeModal());
    if (saveBtn) saveBtn.addEventListener("click", () => this.closeModal());

    modal.addEventListener("click", (e) => {
      if (e.target === modal) this.closeModal();
    });
  }

  openModal() {
    if (!this.modal) return;
    this.modal.removeAttribute("hidden");
    this.modal.classList.add("open");
    const closeBtn = document.getElementById("a11y-close-btn");
    if (closeBtn) closeBtn.focus();
    this.announce("Accessibility and keyboard shortcuts dialog opened.");
  }

  closeModal() {
    if (!this.modal) return;
    this.modal.setAttribute("hidden", "true");
    this.modal.classList.remove("open");
    const trigger = document.getElementById("a11y-toggle-btn");
    if (trigger) trigger.focus();
    this.announce("Accessibility dialog closed.");
  }

  bindA11yButtons() {
    const trigger = document.getElementById("a11y-toggle-btn");
    if (trigger) {
      trigger.addEventListener("click", () => {
        this.openModal();
      });
    }
  }

  bindGlobalShortcuts() {
    window.addEventListener("keydown", (e) => {
      // Don't trigger shortcuts if user is typing into text inputs
      const tag = e.target.tagName.toLowerCase();
      if (tag === "input" && e.target.type === "text") return;
      if (tag === "textarea") return;

      if (e.key === "?" || (e.shiftKey && e.key === "/")) {
        e.preventDefault();
        this.openModal();
      } else if (e.key === "Escape") {
        this.closeModal();
      } else if (e.key === "p" || e.key === "P") {
        e.preventDefault();
        const playBtn = document.getElementById("timeline-play-btn");
        if (playBtn) playBtn.click();
      } else if (e.key === "t" || e.key === "T") {
        const thwipBtn = document.getElementById("vfx-btn-thwip");
        if (thwipBtn) thwipBtn.click();
      } else if (e.key === "b" || e.key === "B") {
        const boomBtn = document.getElementById("vfx-btn-boom");
        if (boomBtn) boomBtn.click();
      } else if (e.key === "s" || e.key === "S") {
        const stylizeBtn = document.getElementById("btn-run-ml-stylize");
        if (stylizeBtn) stylizeBtn.click();
      } else if (e.key === "c" || e.key === "C") {
        const splitBtn = document.getElementById("split-compare-btn");
        if (splitBtn) splitBtn.click();
      } else if (e.key >= "1" && e.key <= "6") {
        const presets = ["earth-1610", "earth-65", "earth-2099", "earth-90214", "earth-138", "earth-14512"];
        const chosen = presets[parseInt(e.key, 10) - 1];
        if (chosen && window.app && window.app.applyPreset) {
          window.app.applyPreset(chosen);
        }
      }
    });
  }
}

// Attach globally
window.SpiderVerseA11Y = new SpiderVerseA11Y();
