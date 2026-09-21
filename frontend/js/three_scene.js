/**
 * Spider-Verse 3D CGI & WebGL Animation Viewport
 * Implements procedural Spider-Hero 3D character, dynamic animation clips (Web Swing,
 * Rooftop Crouch, Leap Dive), city environment, and custom Spider-Verse WebGL post-processing.
 * Features the signature "Animating on the Twos" (12fps stepped character mesh updates).
 */

class SpiderVerseThreeScene {
  constructor(canvasElement) {
    this.canvas = canvasElement;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.heroGroup = null;
    this.cityGroup = null;
    this.webLine = null;

    // Animation states
    this.animationMode = "swing"; // "swing", "crouch", "leap"
    this.isPlaying = true;
    this.clock = null;
    this.animTime = 0;

    // Stepped 12fps "Animating on the Twos" clock
    this.targetFps = 12; // 12fps (twos) or 24fps (ones)
    this.lastStepTime = 0;
    this.steppedPoseTime = 0;

    // Multiverse Shader settings
    this.presetKey = "earth-1610";
    this.shaderParams = {
      halftoneScale: 10.0,
      halftoneContrast: 1.6,
      inkWeight: 2.2,
      glitchIntensity: 6.0,
      enableShaders: true
    };

    this.init();
  }

  init() {
    const width = this.canvas.clientWidth || 800;
    const height = this.canvas.clientHeight || 600;

    // Scene setup
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x080912);
    this.scene.fog = new THREE.FogExp2(0x080912, 0.018);

    // Camera setup
    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    this.camera.position.set(0, 3, 14);

    // Renderer setup
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      preserveDrawingBuffer: true
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Controls
    if (typeof THREE.OrbitControls !== "undefined") {
      this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
      this.controls.enableDamping = true;
      this.controls.dampingFactor = 0.05;
      this.controls.maxPolarAngle = Math.PI / 2 + 0.1;
      this.controls.minDistance = 4;
      this.controls.maxDistance = 30;
    }

    // Lighting
    this.setupLighting();

    // Environment (Stylized Brooklyn Skyscrapers & Dimensional Portal)
    this.buildCityEnvironment();

    // 3D Procedural Spider-Hero Character Rig
    this.buildSpiderHero();

    // Window resize handler
    window.addEventListener("resize", () => this.onResize());

    // Start animation loop
    this.clock = new THREE.Clock();
    this.animate();
  }

  setupLighting() {
    // Ambient fill
    const ambientLight = new THREE.AmbientLight(0x222638, 1.2);
    this.scene.add(ambientLight);

    // Key Light (Hot Magenta rim light)
    this.keyLight = new THREE.DirectionalLight(0xff0055, 2.5);
    this.keyLight.position.set(10, 15, 10);
    this.keyLight.castShadow = true;
    this.scene.add(this.keyLight);

    // Fill Light (Electric Cyan from opposite side)
    this.fillLight = new THREE.DirectionalLight(0x00f0ff, 2.2);
    this.fillLight.position.set(-12, 8, -8);
    this.scene.add(this.fillLight);

    // Top Rim / Multiverse Portal Glow
    this.portalLight = new THREE.PointLight(0xffe600, 3.0, 40);
    this.portalLight.position.set(0, 18, 0);
    this.scene.add(this.portalLight);
  }

  buildCityEnvironment() {
    this.cityGroup = new THREE.Group();

    // Stylized building geometry
    const buildingMat = new THREE.MeshStandardMaterial({
      color: 0x0f1322,
      roughness: 0.8,
      metalness: 0.2
    });

    const windowColors = [0x00f0ff, 0xff0055, 0xffe600, 0xffffff];

    // Procedural Skyscrapers
    for (let i = 0; i < 28; i++) {
      const bw = 3 + Math.random() * 4;
      const bh = 14 + Math.random() * 26;
      const bd = 3 + Math.random() * 4;

      const geom = new THREE.BoxGeometry(bw, bh, bd);
      const building = new THREE.Mesh(geom, buildingMat);

      const angle = (i / 28) * Math.PI * 2;
      const radius = 18 + Math.random() * 16;
      building.position.x = Math.cos(angle) * radius;
      building.position.z = Math.sin(angle) * radius;
      building.position.y = bh / 2 - 10;
      building.receiveShadow = true;

      // Add glowing windows
      const winCount = 6 + Math.floor(Math.random() * 10);
      for (let w = 0; w < winCount; w++) {
        const winGeom = new THREE.PlaneGeometry(0.6, 0.9);
        const winCol = windowColors[Math.floor(Math.random() * windowColors.length)];
        const winMat = new THREE.MeshBasicMaterial({ color: winCol });
        const winMesh = new THREE.Mesh(winGeom, winMat);
        winMesh.position.set(
          (Math.random() - 0.5) * (bw - 0.8),
          (Math.random() - 0.5) * (bh * 0.7),
          bd / 2 + 0.05
        );
        building.add(winMesh);
      }

      this.cityGroup.add(building);
    }

    // Multiverse Dimensional Portal Ring in Sky
    const portalGeom = new THREE.TorusGeometry(12, 0.4, 16, 64);
    const portalMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      wireframe: true
    });
    this.portalRing = new THREE.Mesh(portalGeom, portalMat);
    this.portalRing.position.set(0, 20, -10);
    this.portalRing.rotation.x = Math.PI / 4;
    this.cityGroup.add(this.portalRing);

    // Ground Plane with grid
    const grid = new THREE.GridHelper(80, 40, 0x00f0ff, 0x1f2438);
    grid.position.y = -6;
    this.cityGroup.add(grid);

    this.scene.add(this.cityGroup);
  }

  buildSpiderHero() {
    this.heroGroup = new THREE.Group();

    // Stylized Materials (Toon Shading / Cel Shader look)
    this.suitRedMat = new THREE.MeshStandardMaterial({
      color: 0xe6004c,
      roughness: 0.35,
      metalness: 0.1
    });

    this.suitBlueMat = new THREE.MeshStandardMaterial({
      color: 0x112277,
      roughness: 0.4,
      metalness: 0.1
    });

    this.eyeWhiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    this.eyeRimMat = new THREE.MeshBasicMaterial({ color: 0x0a0a14 });

    // 1. Torso
    const torsoGeom = new THREE.CylinderGeometry(0.85, 0.6, 2.2, 16);
    this.torso = new THREE.Mesh(torsoGeom, this.suitRedMat);
    this.torso.position.y = 2.4;
    this.torso.castShadow = true;
    this.heroGroup.add(this.torso);

    // Spider emblem on chest
    const emblemGeom = new THREE.OctahedronGeometry(0.35, 0);
    const emblemMat = new THREE.MeshBasicMaterial({ color: 0x0a0a14 });
    const emblem = new THREE.Mesh(emblemGeom, emblemMat);
    emblem.position.set(0, 0.3, 0.82);
    emblem.scale.set(1.4, 1.8, 0.2);
    this.torso.add(emblem);

    // 2. Pelvis / Hips
    const pelvisGeom = new THREE.SphereGeometry(0.7, 16, 16);
    this.pelvis = new THREE.Mesh(pelvisGeom, this.suitBlueMat);
    this.pelvis.position.y = -1.1;
    this.pelvis.scale.set(1, 0.8, 0.9);
    this.torso.add(this.pelvis);

    // 3. Head & Mask
    this.headGroup = new THREE.Group();
    this.headGroup.position.set(0, 1.6, 0);
    this.torso.add(this.headGroup);

    const headGeom = new THREE.SphereGeometry(0.8, 20, 20);
    headGeom.scale(0.85, 1.15, 0.95);
    this.head = new THREE.Mesh(headGeom, this.suitRedMat);
    this.head.castShadow = true;
    this.headGroup.add(this.head);

    // Iconic Comic Eyes
    const createEye = (isLeft) => {
      const eyeGroup = new THREE.Group();
      // Black comic rim
      const rimGeom = new THREE.TorusGeometry(0.28, 0.06, 8, 24, Math.PI * 1.6);
      const rim = new THREE.Mesh(rimGeom, this.eyeRimMat);
      rim.rotation.z = isLeft ? 0.3 : -0.3;
      eyeGroup.add(rim);

      // White expressive lens
      const lensGeom = new THREE.CircleGeometry(0.25, 24);
      const lens = new THREE.Mesh(lensGeom, this.eyeWhiteMat);
      eyeGroup.add(lens);

      eyeGroup.position.set(isLeft ? -0.32 : 0.32, 0.1, 0.72);
      eyeGroup.rotation.y = isLeft ? -0.35 : 0.35;
      eyeGroup.rotation.x = -0.08;
      return eyeGroup;
    };

    this.leftEye = createEye(true);
    this.rightEye = createEye(false);
    this.headGroup.add(this.leftEye);
    this.headGroup.add(this.rightEye);

    // 4. Arms (Upper Arm, Lower Arm, Hand)
    this.leftArm = this.buildArm(true);
    this.rightArm = this.buildArm(false);
    this.torso.add(this.leftArm.root);
    this.torso.add(this.rightArm.root);

    // 5. Legs (Thigh, Shin, Boot)
    this.leftLeg = this.buildLeg(true);
    this.rightLeg = this.buildLeg(false);
    this.pelvis.add(this.leftLeg.root);
    this.pelvis.add(this.rightLeg.root);

    // 6. Dynamic Web Line
    const webGeom = new THREE.BufferGeometry();
    const webMat = new THREE.LineBasicMaterial({
      color: 0xffffff,
      linewidth: 3,
      transparent: true,
      opacity: 0.9
    });
    this.webLine = new THREE.Line(webGeom, webMat);
    this.scene.add(this.webLine);

    this.scene.add(this.heroGroup);
  }

  buildArm(isLeft) {
    const root = new THREE.Group();
    root.position.set(isLeft ? -1.0 : 1.0, 0.85, 0);

    // Shoulder joint
    const upperGeom = new THREE.CylinderGeometry(0.28, 0.24, 1.2, 12);
    const upper = new THREE.Mesh(upperGeom, this.suitBlueMat);
    upper.position.y = -0.6;
    upper.castShadow = true;
    root.add(upper);

    // Elbow & Forearm (Red gauntlet)
    const elbow = new THREE.Group();
    elbow.position.y = -0.6;
    upper.add(elbow);

    const lowerGeom = new THREE.CylinderGeometry(0.24, 0.2, 1.1, 12);
    const lower = new THREE.Mesh(lowerGeom, this.suitRedMat);
    lower.position.y = -0.55;
    lower.castShadow = true;
    elbow.add(lower);

    // Hand / Web Shooter
    const handGeom = new THREE.SphereGeometry(0.22, 10, 10);
    const hand = new THREE.Mesh(handGeom, this.suitRedMat);
    hand.position.y = -0.6;
    lower.add(hand);

    return { root, upper, elbow, lower, hand };
  }

  buildLeg(isLeft) {
    const root = new THREE.Group();
    root.position.set(isLeft ? -0.45 : 0.45, -0.2, 0);

    // Thigh (Blue)
    const thighGeom = new THREE.CylinderGeometry(0.35, 0.28, 1.4, 12);
    const thigh = new THREE.Mesh(thighGeom, this.suitBlueMat);
    thigh.position.y = -0.7;
    thigh.castShadow = true;
    root.add(thigh);

    // Knee
    const knee = new THREE.Group();
    knee.position.y = -0.7;
    thigh.add(knee);

    // Shin & Boot (Red boot)
    const shinGeom = new THREE.CylinderGeometry(0.28, 0.22, 1.4, 12);
    const shin = new THREE.Mesh(shinGeom, this.suitRedMat);
    shin.position.y = -0.7;
    shin.castShadow = true;
    knee.add(shin);

    // Foot
    const footGeom = new THREE.BoxGeometry(0.3, 0.25, 0.7);
    const foot = new THREE.Mesh(footGeom, this.suitRedMat);
    foot.position.set(0, -0.7, 0.2);
    shin.add(foot);

    return { root, thigh, knee, shin, foot };
  }

  setAnimationMode(mode) {
    this.animationMode = mode;
  }

  setPreset(presetKey, presetData) {
    this.presetKey = presetKey;
    if (!presetData) return;

    // Update lights to match universe color palette
    if (this.keyLight && presetData.primary_color) {
      this.keyLight.color.set(presetData.primary_color);
    }
    if (this.fillLight && presetData.secondary_color) {
      this.fillLight.color.set(presetData.secondary_color);
    }
    if (this.portalRing && presetData.accent_color) {
      this.portalRing.material.color.set(presetData.accent_color);
    }

    // Update suit colors for specific multiverse variants
    if (presetKey === "earth-65") {
      // Spider-Gwen: White hood/torso, black limbs, pink accents
      this.suitRedMat.color.set(0xf5f5f5);
      this.suitBlueMat.color.set(0x181024);
      this.eyeRimMat.color.set(0xff529a);
    } else if (presetKey === "earth-2099") {
      // Miguel O'Hara: Deep obsidian navy with glowing laser red
      this.suitRedMat.color.set(0xff0033);
      this.suitBlueMat.color.set(0x060814);
      this.eyeRimMat.color.set(0x00f0ff);
    } else if (presetKey === "earth-90214") {
      // Noir: Trenchcoat dark monochrome
      this.suitRedMat.color.set(0x222222);
      this.suitBlueMat.color.set(0x111111);
      this.eyeWhiteMat.color.set(0xdddddd);
    } else if (presetKey === "earth-138") {
      // Punk: Pink, cyan, acid lime
      this.suitRedMat.color.set(0xf92672);
      this.suitBlueMat.color.set(0x1a1a2e);
      this.eyeRimMat.color.set(0xa6e22e);
    } else {
      // Miles Morales Earth-1610 standard
      this.suitRedMat.color.set(0xe6004c);
      this.suitBlueMat.color.set(0x112277);
      this.eyeRimMat.color.set(0x0a0a14);
      this.eyeWhiteMat.color.set(0xffffff);
    }
  }

  setFps(fps) {
    this.targetFps = fps;
  }

  updatePose(t) {
    if (this.animationMode === "swing") {
      // Dynamic Web-Swinging motion
      const swingSpeed = 2.2;
      const angle = Math.sin(t * swingSpeed) * 0.75;

      // Group position swings along a pendulum arc
      this.heroGroup.position.x = Math.sin(angle) * 5.0;
      this.heroGroup.position.y = 2.0 + Math.cos(angle) * 3.5;
      this.heroGroup.position.z = Math.sin(t * swingSpeed * 0.5) * 1.5;

      this.heroGroup.rotation.z = -angle * 0.85;
      this.heroGroup.rotation.x = Math.sin(t * swingSpeed) * 0.2;

      // Right arm shoots web up towards sky skyscraper
      this.rightArm.root.rotation.z = 2.5 + Math.sin(t * swingSpeed) * 0.2;
      this.rightArm.root.rotation.x = 0.5;
      this.rightArm.elbow.rotation.x = 0.4;

      // Left arm trails back for balance
      this.leftArm.root.rotation.z = -0.8 + Math.cos(t * swingSpeed) * 0.3;
      this.leftArm.root.rotation.x = -0.6;

      // Legs tuck dynamically
      this.leftLeg.root.rotation.x = 0.6 + Math.sin(t * swingSpeed) * 0.4;
      this.leftLeg.knee.rotation.x = -1.2;
      this.rightLeg.root.rotation.x = 0.2 + Math.cos(t * swingSpeed) * 0.3;
      this.rightLeg.knee.rotation.x = -0.8;

      // Head looks towards swing apex
      this.headGroup.rotation.y = -angle * 0.4;
      this.headGroup.rotation.x = 0.2;

      // Update Web Line connection
      const handPos = new THREE.Vector3();
      this.rightArm.hand.getWorldPosition(handPos);
      const skyAnchor = new THREE.Vector3(0, 18, -4);
      const lineGeom = new THREE.BufferGeometry().setFromPoints([handPos, skyAnchor]);
      this.webLine.geometry.dispose();
      this.webLine.geometry = lineGeom;
      this.webLine.visible = true;

    } else if (this.animationMode === "crouch") {
      // Rooftop gargoyle crouch with breathing & scanning
      this.heroGroup.position.set(0, -1.2, 0);
      this.heroGroup.rotation.set(0, 0, 0);

      const breath = Math.sin(t * 2.0) * 0.08;
      this.torso.position.y = 1.4 + breath;
      this.torso.rotation.x = 0.7;

      // Deep squat
      this.leftLeg.root.rotation.x = -1.4;
      this.leftLeg.knee.rotation.x = 2.2;
      this.rightLeg.root.rotation.x = -1.4;
      this.rightLeg.knee.rotation.x = 2.2;

      // Arms resting forward on rooftop ledge
      this.leftArm.root.rotation.set(0.6, 0.4, -0.4);
      this.rightArm.root.rotation.set(0.6, -0.4, 0.4);

      // Mask eyes squint & head scans
      this.headGroup.rotation.y = Math.sin(t * 1.2) * 0.5;
      this.headGroup.rotation.x = -0.4;

      this.webLine.visible = false;

    } else if (this.animationMode === "leap") {
      // Leap / Skyfall dive pose (iconic Miles "What's Up Danger" leap)
      this.heroGroup.position.y = 1.5 + Math.sin(t * 1.5) * 0.6;
      this.heroGroup.position.x = 0;
      this.heroGroup.rotation.x = Math.PI - 0.4; // inverted dive
      this.heroGroup.rotation.z = Math.sin(t * 1.2) * 0.15;

      this.leftArm.root.rotation.set(-1.8, 0, -1.2);
      this.rightArm.root.rotation.set(-1.8, 0, 1.2);

      this.leftLeg.root.rotation.set(0.5, 0, -0.3);
      this.rightLeg.root.rotation.set(0.8, 0, 0.3);

      this.headGroup.rotation.x = 0.6;
      this.webLine.visible = false;
    }

    // Portal ring rotation
    if (this.portalRing) {
      this.portalRing.rotation.z = t * 0.4;
    }
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    const delta = this.clock.getDelta();
    const now = performance.now();

    if (this.isPlaying) {
      this.animTime += delta;

      // "ANIMATING ON THE TWOS":
      // Recreates the revolutionary Spider-Verse technique:
      // Character pose updates at targetFps (e.g. 12 fps), while camera and particles move at 60 fps!
      const stepIntervalMs = 1000 / this.targetFps;
      if (now - this.lastStepTime >= stepIntervalMs) {
        this.steppedPoseTime = this.animTime;
        this.lastStepTime = now;
        this.updatePose(this.steppedPoseTime);
      }
    }

    // Camera controls update smoothly at 60 fps
    if (this.controls) {
      this.controls.update();
    }

    this.renderer.render(this.scene, this.camera);
  }

  setCameraDirector(view) {
    if (!this.camera) return;
    if (view === "action") {
      this.camera.position.set(4, 2, 8);
    } else if (view === "rooftop") {
      this.camera.position.set(0, 8, 12);
    } else if (view === "close") {
      this.camera.position.set(0, 3.2, 4);
    } else {
      this.camera.position.set(0, 3, 14);
    }
    if (this.controls) {
      this.controls.target.set(0, 2, 0);
    }
  }

  captureFrameBase64() {
    return this.renderer.domElement.toDataURL("image/png");
  }

  onResize() {
    if (!this.renderer || !this.camera) return;
    const width = this.canvas.parentElement.clientWidth;
    const height = this.canvas.parentElement.clientHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }
}

// Export to window
window.SpiderVerseThreeScene = SpiderVerseThreeScene;
