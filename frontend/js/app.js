/**
 * Spider-Verse ML Animation & VFX Studio - Main Application Controller
 * Orchestrates 3D Three.js viewport, 2D VFX Canvas, Timeline controller,
 * and calls the FastAPI Machine Learning backend for neural stylization.
 */

class SpiderVerseStudioApp {
  constructor() {
    this.threeScene = null;
    this.vfxEngine = null;
    this.timeline = null;

    this.presets = {};
    this.currentPresetKey = "earth-1610";
    this.apiBase = window.location.origin;

    // View mode: "3d", "image", "compare"
    this.viewMode = "3d";
    this.customImageBase64 = null;
    this.stylizedResultBase64 = null;

    // Split Compare State
    this.isSplitActive = false;
    this.splitPos = 0.5;

    this.init();
  }

  async init() {
    // 1. Initialize 3D CGI Scene
    const threeCanvas = document.getElementById("three-canvas");
    if (threeCanvas) {
      this.threeScene = new window.SpiderVerseThreeScene(threeCanvas);
    }

    // 2. Initialize 2D Comic VFX Engine
    const vfxCanvas = document.getElementById("vfx-overlay-canvas");
    if (vfxCanvas) {
      this.vfxEngine = new window.SpiderVerseVFXEngine(vfxCanvas);
    }

    // 3. Initialize Animation Timeline
    this.timeline = new window.SpiderVerseTimeline({
      totalFrames: 48,
      onFrameChange: (frame, total) => {
        // Telemetry update
        const frameEl = document.getElementById("telemetry-frame");
        if (frameEl) frameEl.textContent = `${frame + 1} / ${total}`;
      }
    });

    // 4. Fetch Multiverse Presets from Backend API
    await this.loadPresets();

    // 5. Setup UI Event Listeners
    this.bindEvents();
    this.bindSliders();
    this.bindVFXButtons();
    this.bindSplitSlider();
    this.bindExportButtons();

    // Apply default preset (Earth-1610 Miles Morales)
    this.applyPreset("earth-1610");
  }

  async loadPresets() {
    try {
      const res = await fetch(`${this.apiBase}/api/presets`);
      const data = await res.json();
      if (data && data.presets) {
        this.presets = data.presets;
        this.renderPresetCards();
      }
    } catch (err) {
      console.warn("Backend API not reachable directly, using local presets fallback.", err);
      // Fallback local preset definitions
      this.presets = {
        "earth-1610": {
          name: "Miles Morales (Earth-1610)",
          subtitle: "Brooklyn Neon & Venom Shock",
          primary_color: "#ff0055",
          secondary_color: "#00f0ff",
          accent_color: "#ffe600",
          halftone_scale: 10,
          halftone_contrast: 1.6,
          ink_weight: 2.2,
          glitch_intensity: 6.0,
          color_levels: 6,
          stepped_fps: 12
        }
      };
    }
  }

  renderPresetCards() {
    const grid = document.getElementById("preset-grid");
    const pillsContainer = document.getElementById("header-pills");
    if (!grid) return;

    grid.innerHTML = "";
    if (pillsContainer) pillsContainer.innerHTML = "";

    Object.keys(this.presets).forEach((key) => {
      const p = this.presets[key];

      // 1. Sidebar Card
      const card = document.createElement("div");
      card.className = `preset-card ${key === this.currentPresetKey ? "active" : ""}`;
      card.setAttribute("data-preset", key);
      card.style.setProperty("--card-color", p.primary_color);
      card.innerHTML = `
        <div class="preset-card-title">${p.name.split("(")[0]}</div>
        <div class="preset-card-universe">${key.toUpperCase()}</div>
        <div class="preset-swatches">
          <span class="swatch-dot" style="background:${p.primary_color}"></span>
          <span class="swatch-dot" style="background:${p.secondary_color}"></span>
          <span class="swatch-dot" style="background:${p.accent_color}"></span>
        </div>
      `;
      card.addEventListener("click", () => this.applyPreset(key));
      grid.appendChild(card);

      // 2. Header Pill
      if (pillsContainer) {
        const pill = document.createElement("button");
        pill.className = `pill-btn ${key === this.currentPresetKey ? "active" : ""}`;
        pill.setAttribute("data-preset", key);
        pill.innerHTML = `
          <span class="pill-dot" style="color:${p.primary_color}"></span>
          ${key.replace("earth-", "Earth-")}
        `;
        pill.addEventListener("click", () => this.applyPreset(key));
        pillsContainer.appendChild(pill);
      }
    });
  }

  applyPreset(key) {
    const p = this.presets[key];
    if (!p) return;

    this.currentPresetKey = key;

    // Update CSS root variables
    const root = document.documentElement;
    root.style.setProperty("--preset-primary", p.primary_color);
    root.style.setProperty("--preset-secondary", p.secondary_color);
    root.style.setProperty("--preset-accent", p.accent_color);

    // Update Universe tag in header
    const tag = document.getElementById("universe-header-tag");
    if (tag) tag.textContent = key.toUpperCase();

    // Update active classes on cards and pills
    document.querySelectorAll(".preset-card").forEach((c) => {
      c.classList.toggle("active", c.getAttribute("data-preset") === key);
    });
    document.querySelectorAll(".pill-btn").forEach((b) => {
      b.classList.toggle("active", b.getAttribute("data-preset") === key);
    });

    // Update sliders with preset defaults
    this.setSliderValue("slider-halftone-scale", p.halftone_scale);
    this.setSliderValue("slider-halftone-contrast", p.halftone_contrast);
    this.setSliderValue("slider-ink-weight", p.ink_weight);
    this.setSliderValue("slider-glitch-intensity", p.glitch_intensity);
    this.setSliderValue("slider-color-levels", p.color_levels);

    // Update FPS
    this.setFps(p.stepped_fps || 12);

    // Notify 3D scene & VFX engine
    if (this.threeScene) {
      this.threeScene.setPreset(key, p);
    }
    if (this.vfxEngine) {
      this.vfxEngine.setPreset(key);
    }

    this.showToast(`Multiverse Shifted: ${p.name}`);
  }

  setSliderValue(sliderId, val) {
    const slider = document.getElementById(sliderId);
    if (!slider) return;
    slider.value = val;
    const valDisplay = document.getElementById(`${sliderId}-val`);
    if (valDisplay) valDisplay.textContent = val;
  }

  bindSliders() {
    const sliders = [
      "slider-halftone-scale",
      "slider-halftone-contrast",
      "slider-ink-weight",
      "slider-glitch-intensity",
      "slider-color-levels"
    ];

    sliders.forEach((id) => {
      const slider = document.getElementById(id);
      const display = document.getElementById(`${id}-val`);
      if (!slider) return;

      slider.addEventListener("input", (e) => {
        if (display) display.textContent = e.target.value;
      });
    });
  }

  bindEvents() {
    // 3D Animation Pose Buttons (Web Swing, Crouch, Leap)
    document.querySelectorAll(".pose-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        document.querySelectorAll(".pose-btn").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        const pose = btn.getAttribute("data-pose");
        if (this.threeScene) {
          this.threeScene.setAnimationMode(pose);
        }
        this.showToast(`Animation Pose: ${pose.toUpperCase()}`);
      });
    });

    // FPS Stepper Buttons (8fps, 12fps, 24fps)
    document.querySelectorAll(".fps-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const fps = parseInt(btn.getAttribute("data-fps"), 10);
        this.setFps(fps);
      });
    });

    // Camera Director Buttons (Action Cam, Rooftop Cam, Close Cam, Orbit)
    document.querySelectorAll(".cam-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".cam-btn").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        const cam = btn.getAttribute("data-cam");
        if (this.threeScene) {
          this.threeScene.setCameraDirector(cam);
        }
        this.showToast(`Camera: ${cam.toUpperCase()}`);
      });
    });

    // Media Tabs (3D CGI, Custom Upload, Sample Scene)
    const tab3d = document.getElementById("tab-source-3d");
    const tabUpload = document.getElementById("tab-source-upload");
    const tabSample = document.getElementById("tab-source-sample");

    if (tab3d) {
      tab3d.addEventListener("click", () => {
        this.setMediaMode("3d");
      });
    }
    if (tabUpload) {
      tabUpload.addEventListener("click", () => {
        this.setMediaMode("upload");
      });
    }
    if (tabSample) {
      tabSample.addEventListener("click", () => {
        this.loadSampleScene();
      });
    }

    // File Upload Handler
    const fileInput = document.getElementById("media-file-input");
    const dropZone = document.getElementById("upload-drop-zone");

    if (dropZone && fileInput) {
      dropZone.addEventListener("click", () => fileInput.click());
      fileInput.addEventListener("change", (e) => {
        if (e.target.files && e.target.files[0]) {
          this.handleFileUpload(e.target.files[0]);
        }
      });

      dropZone.addEventListener("dragover", (e) => {
        e.preventDefault();
        dropZone.style.borderColor = "var(--preset-secondary)";
      });
      dropZone.addEventListener("dragleave", () => {
        dropZone.style.borderColor = "";
      });
      dropZone.addEventListener("drop", (e) => {
        e.preventDefault();
        dropZone.style.borderColor = "";
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
          this.handleFileUpload(e.dataTransfer.files[0]);
        }
      });
    }

    // Split Compare Toggle
    const splitBtn = document.getElementById("split-compare-btn");
    if (splitBtn) {
      splitBtn.addEventListener("click", () => {
        this.toggleSplitCompare();
      });
    }

    // Neural Stylize Current Frame Button
    const stylizeBtn = document.getElementById("btn-run-ml-stylize");
    if (stylizeBtn) {
      stylizeBtn.addEventListener("click", () => {
        this.runMLStylization();
      });
    }
  }

  setFps(fps) {
    document.querySelectorAll(".fps-btn").forEach((b) => {
      b.classList.toggle("active", parseInt(b.getAttribute("data-fps"), 10) === fps);
    });
    if (this.timeline) this.timeline.setFps(fps);
    if (this.threeScene) this.threeScene.setFps(fps);

    const fpsBadge = document.getElementById("telemetry-fps");
    if (fpsBadge) fpsBadge.textContent = `${fps} FPS`;
  }

  bindVFXButtons() {
    const vfxActions = [
      { id: "vfx-btn-thwip", word: "THWIP!" },
      { id: "vfx-btn-boom", word: "BOOM!" },
      { id: "vfx-btn-pow", word: "POW!" },
      { id: "vfx-btn-zap", word: "ZAAAP!" }
    ];

    vfxActions.forEach(({ id, word }) => {
      const btn = document.getElementById(id);
      if (!btn) return;
      btn.addEventListener("click", () => {
        if (this.vfxEngine) {
          const color = this.presets[this.currentPresetKey]?.accent_color || "#ffe600";
          this.vfxEngine.triggerOnomatopoeia(word, null, null, color);
        }
      });
    });

    const speedBtn = document.getElementById("vfx-btn-speedlines");
    if (speedBtn) {
      speedBtn.addEventListener("click", () => {
        if (this.vfxEngine) {
          this.vfxEngine.triggerSpeedlines(50, "#ffffff");
        }
      });
    }

    const tearBtn = document.getElementById("vfx-btn-tear");
    if (tearBtn) {
      tearBtn.addEventListener("click", () => {
        if (this.vfxEngine) {
          this.vfxEngine.triggerDimensionalTear(45);
        }
      });
    }

    const krackleBtn = document.getElementById("vfx-btn-krackle");
    if (krackleBtn) {
      krackleBtn.addEventListener("click", () => {
        if (this.vfxEngine) {
          this.vfxEngine.triggerKirbyKrackle();
        }
      });
    }

    const venomBtn = document.getElementById("vfx-btn-venom");
    if (venomBtn) {
      venomBtn.addEventListener("click", () => {
        if (this.vfxEngine) {
          this.vfxEngine.triggerVenomBlast();
        }
      });
    }
  }

  bindSplitSlider() {
    const splitContainer = document.getElementById("split-slider-container");
    const splitLine = document.getElementById("split-line");
    if (!splitContainer || !splitLine) return;

    let isDragging = false;

    const updateSplit = (clientX) => {
      const rect = splitContainer.getBoundingClientRect();
      const pos = Math.max(0.05, Math.min(0.95, (clientX - rect.left) / rect.width));
      this.splitPos = pos;
      splitLine.style.left = `${pos * 100}%`;

      const stylizedImg = document.getElementById("split-image-stylized");
      if (stylizedImg) {
        stylizedImg.style.clipPath = `polygon(${pos * 100}% 0, 100% 0, 100% 100%, ${pos * 100}% 100%)`;
      }
    };

    splitLine.addEventListener("pointerdown", () => {
      isDragging = true;
    });

    window.addEventListener("pointermove", (e) => {
      if (isDragging) updateSplit(e.clientX);
    });

    window.addEventListener("pointerup", () => {
      isDragging = false;
    });
  }

  toggleSplitCompare() {
    this.isSplitActive = !this.isSplitActive;
    const splitContainer = document.getElementById("split-slider-container");
    const splitBtn = document.getElementById("split-compare-btn");

    if (splitContainer) {
      splitContainer.classList.toggle("active", this.isSplitActive);
    }
    if (splitBtn) {
      splitBtn.classList.toggle("active", this.isSplitActive);
    }

    if (this.isSplitActive && !this.stylizedResultBase64) {
      // Auto-run stylization if not yet run
      this.runMLStylization();
    }
  }

  async runMLStylization() {
    const stylizeBtn = document.getElementById("btn-run-ml-stylize");
    if (stylizeBtn) {
      stylizeBtn.innerHTML = `<span>STYLIZING...</span>`;
      stylizeBtn.disabled = true;
    }

    // Grab input frame base64
    let inputBase64 = this.customImageBase64;
    if (!inputBase64 && this.threeScene) {
      inputBase64 = this.threeScene.captureFrameBase64();
    }

    if (!inputBase64) {
      this.showToast("No frame available to stylize.");
      if (stylizeBtn) {
        stylizeBtn.innerHTML = `<span>RENDER SPIDER-VERSE FRAME</span>`;
        stylizeBtn.disabled = false;
      }
      return;
    }

    const payload = {
      image_base64: inputBase64,
      preset: this.currentPresetKey,
      halftone_scale: parseFloat(document.getElementById("slider-halftone-scale")?.value || 10),
      halftone_contrast: parseFloat(document.getElementById("slider-halftone-contrast")?.value || 1.6),
      ink_weight: parseFloat(document.getElementById("slider-ink-weight")?.value || 2.2),
      glitch_intensity: parseFloat(document.getElementById("slider-glitch-intensity")?.value || 6.0),
      color_levels: parseInt(document.getElementById("slider-color-levels")?.value || 6, 10),
      stepped_fps: 12
    };

    try {
      const res = await fetch(`${this.apiBase}/api/stylize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (data.success && data.image_base64) {
        this.stylizedResultBase64 = data.image_base64;

        // Update telemetry
        const msEl = document.getElementById("telemetry-latency");
        if (msEl) msEl.textContent = `${data.elapsed_ms}ms`;

        // Update split compare images
        const origImg = document.getElementById("split-image-original");
        const styledImg = document.getElementById("split-image-stylized");
        if (origImg) origImg.src = inputBase64;
        if (styledImg) {
          styledImg.src = data.image_base64;
          styledImg.style.clipPath = `polygon(${this.splitPos * 100}% 0, 100% 0, 100% 100%, ${this.splitPos * 100}% 100%)`;
        }

        // Auto-show split view if not visible
        if (!this.isSplitActive) {
          this.toggleSplitCompare();
        }

        this.showToast(`Neural Stylized in ${data.elapsed_ms}ms!`);
      }
    } catch (err) {
      console.error("ML Stylization failed:", err);
      this.showToast("Stylization failed - check server.");
    } finally {
      if (stylizeBtn) {
        stylizeBtn.innerHTML = `<span>RENDER SPIDER-VERSE FRAME</span>`;
        stylizeBtn.disabled = false;
      }
    }
  }

  async loadSampleScene() {
    this.showToast("Loading Brooklyn Rooftop Multiverse Sample...");
    try {
      const res = await fetch(`${this.apiBase}/api/sample-frame?preset=${this.currentPresetKey}`);
      const data = await res.json();
      if (data.original_base64 && data.stylized_base64) {
        this.customImageBase64 = data.original_base64;
        this.stylizedResultBase64 = data.stylized_base64;

        const origImg = document.getElementById("split-image-original");
        const styledImg = document.getElementById("split-image-stylized");
        if (origImg) origImg.src = data.original_base64;
        if (styledImg) {
          styledImg.src = data.stylized_base64;
          styledImg.style.clipPath = `polygon(${this.splitPos * 100}% 0, 100% 0, 100% 100%, ${this.splitPos * 100}% 100%)`;
        }

        if (!this.isSplitActive) {
          this.toggleSplitCompare();
        }
        this.showToast("Sample Scene Loaded!");
      }
    } catch (err) {
      console.error("Failed to load sample scene:", err);
    }
  }

  handleFileUpload(file) {
    if (!file.type.startsWith("image/")) {
      this.showToast("Please upload an image file (PNG/JPG).");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      this.customImageBase64 = e.target.result;
      this.showToast(`Image loaded: ${file.name}`);
      this.runMLStylization();
    };
    reader.readAsDataURL(file);
  }

  setMediaMode(mode) {
    this.viewMode = mode;
    document.querySelectorAll(".media-tab-btn").forEach((b) => b.classList.remove("active"));
    const activeTab = document.getElementById(`tab-source-${mode}`);
    if (activeTab) activeTab.classList.add("active");

    const threeCanvas = document.getElementById("three-canvas");
    const uploadArea = document.getElementById("upload-drop-zone");

    if (mode === "3d") {
      if (threeCanvas) threeCanvas.style.display = "block";
      if (uploadArea) uploadArea.style.display = "none";
      this.customImageBase64 = null;
    } else if (mode === "upload") {
      if (uploadArea) uploadArea.style.display = "block";
    }
  }

  bindExportButtons() {
    // 1. Export Single Frame PNG
    const exportFrameBtn = document.getElementById("btn-export-frame");
    if (exportFrameBtn) {
      exportFrameBtn.addEventListener("click", () => {
        this.exportCurrentFrame();
      });
    }

    // 2. Export Animation Sequence
    const exportSeqBtn = document.getElementById("btn-export-seq");
    if (exportSeqBtn) {
      exportSeqBtn.addEventListener("click", () => {
        this.exportAnimationSequence();
      });
    }

    // 3. Download Project JSON
    const exportJsonBtn = document.getElementById("btn-export-json");
    if (exportJsonBtn) {
      exportJsonBtn.addEventListener("click", () => {
        this.exportProjectConfig();
      });
    }
  }

  exportCurrentFrame() {
    // Composite 3D WebGL + 2D VFX overlay
    const width = this.threeScene.canvas.width;
    const height = this.threeScene.canvas.height;

    const compCanvas = document.createElement("canvas");
    compCanvas.width = width;
    compCanvas.height = height;
    const ctx = compCanvas.getContext("2d");

    // If split view active, draw stylized image
    if (this.stylizedResultBase64 && this.isSplitActive) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, width, height);
        ctx.drawImage(this.vfxEngine.canvas, 0, 0, width, height);
        this.downloadCanvas(compCanvas, `spiderverse_${this.currentPresetKey}_frame.png`);
      };
      img.src = this.stylizedResultBase64;
    } else {
      ctx.drawImage(this.threeScene.canvas, 0, 0);
      ctx.drawImage(this.vfxEngine.canvas, 0, 0);
      this.downloadCanvas(compCanvas, `spiderverse_${this.currentPresetKey}_frame.png`);
    }

    this.showToast("Frame Render Exported!");
  }

  async exportAnimationSequence() {
    this.showToast("Capturing 12fps Stepped Animation Sequence...");
    const frames = [];
    const numFrames = 12; // 1 full second at 12fps

    for (let i = 0; i < numFrames; i++) {
      if (this.timeline) this.timeline.seekFrame(i * 2);
      await new Promise((r) => setTimeout(r, 60));
      frames.push(this.threeScene.captureFrameBase64());
    }

    this.showToast("Processing sequence through ML backend...");

    try {
      const res = await fetch(`${this.apiBase}/api/process-sequence`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          frames: frames,
          preset: this.currentPresetKey,
          target_fps: 12,
          source_fps: 24
        })
      });
      const data = await res.json();
      if (data.success && data.frames) {
        this.showToast(`Rendered ${data.total_output_frames} frames in ${data.elapsed_ms}ms!`);

        // Playback stylized sequence in a loop
        let fIdx = 0;
        const styledImg = document.getElementById("split-image-stylized");
        const loopTimer = setInterval(() => {
          if (styledImg && data.frames[fIdx]) {
            styledImg.src = data.frames[fIdx];
          }
          fIdx = (fIdx + 1) % data.frames.length;
        }, 1000 / 12);

        setTimeout(() => clearInterval(loopTimer), 12000); // 12 second preview
      }
    } catch (err) {
      console.error("Sequence render error:", err);
      this.showToast("Export failed.");
    }
  }

  exportProjectConfig() {
    const config = {
      project: "Spider-Verse ML Animation & VFX Studio",
      timestamp: new Date().toISOString(),
      preset: this.currentPresetKey,
      preset_data: this.presets[this.currentPresetKey],
      settings: {
        halftone_scale: document.getElementById("slider-halftone-scale")?.value,
        halftone_contrast: document.getElementById("slider-halftone-contrast")?.value,
        ink_weight: document.getElementById("slider-ink-weight")?.value,
        glitch_intensity: document.getElementById("slider-glitch-intensity")?.value,
        color_levels: document.getElementById("slider-color-levels")?.value,
        fps: this.timeline ? this.timeline.fps : 12
      }
    };

    const blob = new Blob([JSON.stringify(config, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `spiderverse_${this.currentPresetKey}_project.json`;
    a.click();
    URL.revokeObjectURL(url);
    this.showToast("Project Config JSON Exported!");
  }

  downloadCanvas(canvas, filename) {
    const link = document.createElement("a");
    link.download = filename;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  showToast(msg) {
    let toast = document.querySelector(".comic-toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.className = "comic-toast";
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.classList.add("show");
    setTimeout(() => {
      toast.classList.remove("show");
    }, 2500);
  }
}

// Initialize on DOM load
window.addEventListener("DOMContentLoaded", () => {
  window.app = new SpiderVerseStudioApp();
});
