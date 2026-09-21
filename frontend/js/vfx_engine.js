/**
 * Spider-Verse Dynamic 2D Canvas VFX & Sound Burst Engine
 * Implements real-time comic onomatopoeia stickers ("THWIP!", "BOOM!"),
 * radial action speedlines, dimensional glitch tears, Kirby krackle dots,
 * and venom blast electric arcs.
 */

class SpiderVerseVFXEngine {
  constructor(canvasElement) {
    this.canvas = canvasElement;
    this.ctx = canvasElement.getContext("2d");
    this.particles = [];
    this.onomatopoeiaList = [];
    this.speedlinesActive = false;
    this.speedlinesTimer = 0;
    this.speedlinesColor = "#ffffff";
    this.glitchActive = false;
    this.glitchTimer = 0;
    this.presetKey = "earth-1610";

    this.onResize();
    window.addEventListener("resize", () => this.onResize());
    this.setupInteractivity();
    this.loop();
  }

  onResize() {
    this.width = this.canvas.parentElement.clientWidth;
    this.height = this.canvas.parentElement.clientHeight;
    this.canvas.width = this.width;
    this.canvas.height = this.height;
  }

  setupInteractivity() {
    // Click on canvas to spawn comic action FX
    this.canvas.parentElement.addEventListener("pointerdown", (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const words = ["THWIP!", "BOOM!", "POW!", "ZAP!", "KRAK!"];
      const randomWord = words[Math.floor(Math.random() * words.length)];
      this.triggerOnomatopoeia(randomWord, x, y);
      this.triggerVenomBlast(x, y);
    });
  }

  setPreset(key) {
    this.presetKey = key;
  }

  // 1. Comic Onomatopoeia Sticker
  triggerOnomatopoeia(word = "THWIP!", x = null, y = null, color = "#ffe600") {
    const px = x !== null ? x : this.width * (0.35 + Math.random() * 0.3);
    const py = y !== null ? y : this.height * (0.25 + Math.random() * 0.4);

    this.onomatopoeiaList.push({
      text: word,
      x: px,
      y: py,
      scale: 0.1,
      targetScale: 1.0 + Math.random() * 0.4,
      rotation: (Math.random() - 0.5) * 0.5,
      opacity: 1.0,
      life: 0,
      maxLife: 60, // frames
      color: color,
      burstPoints: this.generateBurstPoints(12, 60, 110)
    });
  }

  generateBurstPoints(spikes, rMin, rMax) {
    const pts = [];
    for (let i = 0; i < spikes * 2; i++) {
      const angle = (i * Math.PI) / spikes;
      const r = i % 2 === 0 ? rMax : rMin;
      pts.push({ angle, r: r * (0.85 + Math.random() * 0.3) });
    }
    return pts;
  }

  // 2. Action Speedlines
  triggerSpeedlines(durationFrames = 45, color = "#ffffff") {
    this.speedlinesActive = true;
    this.speedlinesTimer = durationFrames;
    this.speedlinesColor = color;
  }

  // 3. Dimensional Glitch Tear
  triggerDimensionalTear(durationFrames = 40) {
    this.glitchActive = true;
    this.glitchTimer = durationFrames;

    // Spawn polygon shard particles
    for (let i = 0; i < 20; i++) {
      this.particles.push({
        type: "shard",
        x: this.width * 0.5 + (Math.random() - 0.5) * 200,
        y: this.height * 0.5 + (Math.random() - 0.5) * 200,
        vx: (Math.random() - 0.5) * 12,
        vy: (Math.random() - 0.5) * 12,
        size: 8 + Math.random() * 24,
        rot: Math.random() * Math.PI * 2,
        vrot: (Math.random() - 0.5) * 0.2,
        color: Math.random() > 0.5 ? "#00f0ff" : "#ff0055",
        life: 1.0,
        decay: 0.025
      });
    }
  }

  // 4. Kirby Krackle Energy Dots
  triggerKirbyKrackle(cx = null, cy = null) {
    const x = cx || this.width * 0.5;
    const y = cy || this.height * 0.5;

    for (let i = 0; i < 45; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 6.5;
      this.particles.push({
        type: "krackle",
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 4 + Math.random() * 12,
        haloColor: Math.random() > 0.5 ? "#ff0055" : "#00f0ff",
        life: 1.0,
        decay: 0.02 + Math.random() * 0.02
      });
    }
  }

  // 5. Venom Blast Lightning Arcs
  triggerVenomBlast(x = null, y = null) {
    const startX = x || this.width * 0.5;
    const startY = y || this.height * 0.5;

    for (let b = 0; b < 6; b++) {
      const targetAngle = (b / 6) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
      const length = 70 + Math.random() * 130;
      const boltPts = [{ x: startX, y: startY }];
      const segments = 8;

      let curX = startX;
      let curY = startY;
      for (let s = 1; s <= segments; s++) {
        const segDist = length / segments;
        curX += Math.cos(targetAngle) * segDist + (Math.random() - 0.5) * 26;
        curY += Math.sin(targetAngle) * segDist + (Math.random() - 0.5) * 26;
        boltPts.push({ x: curX, y: curY });
      }

      this.particles.push({
        type: "lightning",
        points: boltPts,
        color: Math.random() > 0.3 ? "#ffe600" : "#00f0ff",
        life: 1.0,
        decay: 0.08
      });
    }
  }

  update() {
    // 1. Update Onomatopoeia
    for (let i = this.onomatopoeiaList.length - 1; i >= 0; i--) {
      const o = this.onomatopoeiaList[i];
      o.life++;
      // Elastic pop scale in
      if (o.scale < o.targetScale) {
        o.scale += (o.targetScale - o.scale) * 0.35;
      }
      // Fade out towards end
      if (o.life > o.maxLife - 15) {
        o.opacity = (o.maxLife - o.life) / 15;
      }
      if (o.life >= o.maxLife) {
        this.onomatopoeiaList.splice(i, 1);
      }
    }

    // 2. Update Speedlines
    if (this.speedlinesActive) {
      this.speedlinesTimer--;
      if (this.speedlinesTimer <= 0) {
        this.speedlinesActive = false;
      }
    }

    // 3. Update Glitch
    if (this.glitchActive) {
      this.glitchTimer--;
      if (this.glitchTimer <= 0) {
        this.glitchActive = false;
      }
    }

    // 4. Update Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= p.decay;

      if (p.type === "shard") {
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vrot;
      } else if (p.type === "krackle") {
        p.x += p.vx;
        p.y += p.vy;
        p.radius *= 0.96;
      }

      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  draw() {
    this.ctx.clearRect(0, 0, this.width, this.height);

    // 1. Draw Speedlines
    if (this.speedlinesActive) {
      this.drawSpeedlines();
    }

    // 2. Draw Dimensional Glitch Slices
    if (this.glitchActive) {
      this.drawGlitchSlices();
    }

    // 3. Draw Particles (Krackle, Lightning, Shards)
    this.drawParticles();

    // 4. Draw Comic Onomatopoeia Stickers
    this.drawOnomatopoeia();
  }

  drawSpeedlines() {
    const cx = this.width * 0.5;
    const cy = this.height * 0.45;
    const maxR = Math.hypot(this.width, this.height);
    const innerR = Math.min(this.width, this.height) * 0.22;

    this.ctx.save();
    this.ctx.fillStyle = this.speedlinesColor;

    for (let i = 0; i < 36; i++) {
      const angle = (i / 36) * Math.PI * 2 + (Math.random() - 0.5) * 0.03;
      const wedge = 0.02 + Math.random() * 0.03;
      const rStart = innerR * (0.9 + Math.random() * 0.4);
      const rEnd = maxR;

      this.ctx.globalAlpha = 0.4 + Math.random() * 0.5;
      this.ctx.beginPath();
      this.ctx.moveTo(cx + rStart * Math.cos(angle - wedge), cy + rStart * Math.sin(angle - wedge));
      this.ctx.lineTo(cx + rEnd * Math.cos(angle - wedge * 0.5), cy + rEnd * Math.sin(angle - wedge * 0.5));
      this.ctx.lineTo(cx + rEnd * Math.cos(angle + wedge * 0.5), cy + rEnd * Math.sin(angle + wedge * 0.5));
      this.ctx.lineTo(cx + rStart * Math.cos(angle + wedge), cy + rStart * Math.sin(angle + wedge));
      this.ctx.closePath();
      this.ctx.fill();
    }
    this.ctx.restore();
  }

  drawGlitchSlices() {
    this.ctx.save();
    const numSlices = 6;
    for (let i = 0; i < numSlices; i++) {
      const y = Math.random() * this.height;
      const h = 4 + Math.random() * 24;
      const offset = (Math.random() - 0.5) * 36;

      // Cyan / Magenta slice bars
      this.ctx.fillStyle = Math.random() > 0.5 ? "rgba(0, 240, 255, 0.4)" : "rgba(255, 0, 85, 0.4)";
      this.ctx.fillRect(0, y, this.width, h);

      this.ctx.strokeStyle = "#ffe600";
      this.ctx.lineWidth = 1.5;
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.width, y + offset);
      this.ctx.stroke();
    }
    this.ctx.restore();
  }

  drawParticles() {
    this.ctx.save();
    for (const p of this.particles) {
      if (p.type === "shard") {
        this.ctx.save();
        this.ctx.translate(p.x, p.y);
        this.ctx.rotate(p.rot);
        this.ctx.globalAlpha = p.life;
        this.ctx.fillStyle = p.color;
        this.ctx.strokeStyle = "#ffffff";
        this.ctx.lineWidth = 2;

        this.ctx.beginPath();
        this.ctx.moveTo(0, -p.size);
        this.ctx.lineTo(p.size * 0.8, p.size * 0.6);
        this.ctx.lineTo(-p.size * 0.6, p.size * 0.8);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();
        this.ctx.restore();

      } else if (p.type === "krackle") {
        this.ctx.globalAlpha = p.life;

        // Radiant Halo
        this.ctx.fillStyle = p.haloColor;
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.radius + 3, 0, Math.PI * 2);
        this.ctx.fill();

        // Dark Solid Comic Core
        this.ctx.fillStyle = "#06070a";
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        this.ctx.fill();

      } else if (p.type === "lightning") {
        this.ctx.globalAlpha = p.life;
        this.ctx.strokeStyle = p.color;
        this.ctx.lineWidth = 3.5;
        this.ctx.shadowColor = p.color;
        this.ctx.shadowBlur = 12;

        this.ctx.beginPath();
        for (let i = 0; i < p.points.length; i++) {
          const pt = p.points[i];
          if (i === 0) this.ctx.moveTo(pt.x, pt.y);
          else this.ctx.lineTo(pt.x, pt.y);
        }
        this.ctx.stroke();
      }
    }
    this.ctx.restore();
  }

  drawOnomatopoeia() {
    for (const o of this.onomatopoeiaList) {
      this.ctx.save();
      this.ctx.translate(o.x, o.y);
      this.ctx.scale(o.scale, o.scale);
      this.ctx.rotate(o.rotation);
      this.ctx.globalAlpha = o.opacity;

      // 1. Starburst Explosion Backdrop
      this.ctx.save();
      // Drop shadow
      this.ctx.fillStyle = "#000000";
      this.ctx.beginPath();
      for (let i = 0; i < o.burstPoints.length; i++) {
        const pt = o.burstPoints[i];
        const bx = (pt.r + 6) * Math.cos(pt.angle) + 6;
        const by = (pt.r + 6) * Math.sin(pt.angle) + 6;
        if (i === 0) this.ctx.moveTo(bx, by);
        else this.ctx.lineTo(bx, by);
      }
      this.ctx.closePath();
      this.ctx.fill();

      // Main starburst fill
      this.ctx.fillStyle = "#ff0055";
      this.ctx.strokeStyle = "#ffffff";
      this.ctx.lineWidth = 4;
      this.ctx.beginPath();
      for (let i = 0; i < o.burstPoints.length; i++) {
        const pt = o.burstPoints[i];
        const bx = pt.r * Math.cos(pt.angle);
        const by = pt.r * Math.sin(pt.angle);
        if (i === 0) this.ctx.moveTo(bx, by);
        else this.ctx.lineTo(bx, by);
      }
      this.ctx.closePath();
      this.ctx.fill();
      this.ctx.stroke();
      this.ctx.restore();

      // 2. Comic Typography Lettering
      this.ctx.font = "900 52px 'Bangers', cursive, impact, sans-serif";
      this.ctx.textAlign = "center";
      this.ctx.textBaseline = "middle";

      // 3D Extrusion Black Shadow
      this.ctx.fillStyle = "#090a12";
      for (let s = 7; s > 0; s--) {
        this.ctx.fillText(o.text, s, s);
      }

      // Thick White Comic Stroke Outline
      this.ctx.strokeStyle = "#ffffff";
      this.ctx.lineWidth = 8;
      this.ctx.strokeText(o.text, 0, 0);

      // Face Color Fill
      this.ctx.fillStyle = o.color;
      this.ctx.fillText(o.text, 0, 0);

      this.ctx.restore();
    }
  }

  loop() {
    this.update();
    this.draw();
    requestAnimationFrame(() => this.loop());
  }
}

// Export to window
window.SpiderVerseVFXEngine = SpiderVerseVFXEngine;
