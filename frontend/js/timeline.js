/**
 * Spider-Verse Animation Timeline & Frame Sequencer
 * Manages frame scrubbing, play/pause, 12fps "on the twos" rate switching,
 * and sequence export recording.
 */

class SpiderVerseTimeline {
  constructor(options = {}) {
    this.totalFrames = options.totalFrames || 48;
    this.currentFrame = 0;
    this.fps = 12; // Default 12fps (animating on the twos)
    this.isPlaying = true;
    this.isLooping = true;
    this.onFrameChange = options.onFrameChange || null;

    this.playBtn = document.getElementById("timeline-play-btn");
    this.scrubber = document.getElementById("timeline-scrubber");
    this.frameCounter = document.getElementById("frame-counter");
    this.fpsLabel = document.getElementById("timeline-fps-label");
    this.fpsSubLabel = document.getElementById("timeline-fps-sub");

    this.timer = null;
    this.init();
  }

  init() {
    if (this.scrubber) {
      this.scrubber.max = this.totalFrames - 1;
      this.scrubber.value = 0;
      this.scrubber.addEventListener("input", (e) => {
        this.seekFrame(parseInt(e.target.value, 10));
      });
    }

    if (this.playBtn) {
      this.playBtn.addEventListener("click", () => this.togglePlay());
    }

    const prevBtn = document.getElementById("timeline-prev-btn");
    if (prevBtn) {
      prevBtn.addEventListener("click", () => this.stepFrame(-1));
    }

    const nextBtn = document.getElementById("timeline-next-btn");
    if (nextBtn) {
      nextBtn.addEventListener("click", () => this.stepFrame(1));
    }

    this.updateUI();
    this.startPlayback();
  }

  setFps(fps) {
    this.fps = fps;
    this.updateUI();
    if (this.isPlaying) {
      this.stopPlayback();
      this.startPlayback();
    }
  }

  togglePlay() {
    if (this.isPlaying) {
      this.stopPlayback();
    } else {
      this.startPlayback();
    }
  }

  startPlayback() {
    this.isPlaying = true;
    if (this.playBtn) {
      this.playBtn.classList.add("playing");
      this.playBtn.innerHTML = `
        <svg viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
      `;
    }
    const intervalMs = 1000 / this.fps;
    this.timer = setInterval(() => {
      this.currentFrame++;
      if (this.currentFrame >= this.totalFrames) {
        if (this.isLooping) {
          this.currentFrame = 0;
        } else {
          this.stopPlayback();
          return;
        }
      }
      this.updateUI();
      if (this.onFrameChange) {
        this.onFrameChange(this.currentFrame, this.totalFrames);
      }
    }, intervalMs);
  }

  stopPlayback() {
    this.isPlaying = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    if (this.playBtn) {
      this.playBtn.classList.remove("playing");
      this.playBtn.innerHTML = `
        <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
      `;
    }
  }

  seekFrame(frameIndex) {
    this.currentFrame = Math.max(0, Math.min(this.totalFrames - 1, frameIndex));
    this.updateUI();
    if (this.onFrameChange) {
      this.onFrameChange(this.currentFrame, this.totalFrames);
    }
  }

  stepFrame(delta) {
    this.seekFrame(this.currentFrame + delta);
  }

  updateUI() {
    if (this.scrubber) {
      this.scrubber.value = this.currentFrame;
    }
    if (this.frameCounter) {
      const padCurrent = String(this.currentFrame + 1).padStart(2, "0");
      const padTotal = String(this.totalFrames).padStart(2, "0");
      this.frameCounter.textContent = `${padCurrent} / ${padTotal}`;
    }
    if (this.fpsLabel) {
      this.fpsLabel.textContent = `${this.fps} FPS`;
    }
    if (this.fpsSubLabel) {
      if (this.fps === 12) {
        this.fpsSubLabel.textContent = "ANIMATING ON THE TWOS";
        this.fpsSubLabel.style.color = "var(--spider-yellow)";
      } else if (this.fps === 8) {
        this.fpsSubLabel.textContent = "SPIDER-PUNK LOW-FI STUTTER";
        this.fpsSubLabel.style.color = "var(--preset-primary)";
      } else {
        this.fpsSubLabel.textContent = "ANIMATING ON ONES (SMOOTH)";
        this.fpsSubLabel.style.color = "var(--text-muted)";
      }
    }
  }
}

// Export to window
window.SpiderVerseTimeline = SpiderVerseTimeline;
