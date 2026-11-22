// The Midnight Vault — game state, main loop, HUD and overlays.
const Game = {
  canvas: null,
  ctx: null,
  screen: "start", // start | playing | paused | complete | caught | win
  levelIndex: 0,
  level: null,
  player: null,
  guards: [],
  cameras: [],
  lasers: [],
  panels: [],
  lives: 3,
  score: 0,
  alarm: 0,
  alarmEvent: false,
  alarmT: 0,
  alarmTriggered: false,
  loot: false,
  time: 0,
  levelTime: 0,
  spotted: false,
  laserHit: false,
  hackT: 0,
  nearPanel: null,
  toast: "",
  toastT: 0,
  frozen: false,
  stars: 0,
  stepT: 0,

  init() {
    this.canvas = document.getElementById("game");
    this.ctx = this.canvas.getContext("2d");
    Keys.init();
    this.loadLevel(0);
    this.wireButtons();
    this.showOverlay("start");
    this.updateHUD();
    Render.draw(this.ctx, this);
    requestAnimationFrame((ts) => this.loop(ts));
  },

  loadLevel(index) {
    this.levelIndex = index;
    this.gen = (this.gen || 0) + 1;
    const def = LEVELS[index];
    this.level = parseLevel(def);
    this.player = {
      x: this.level.player.x,
      y: this.level.player.y,
      sneaking: false,
    };
    this.guards = def.guards.map(makeGuard);
    this.cameras = def.cameras.map(makeCamera);
    this.lasers = def.lasers.map(makeLaser);
    this.panels = def.panels.map((p) => ({
      x: p.col * TILE + TILE / 2,
      y: p.row * TILE + TILE / 2,
      cam: p.cam,
    }));
    this.alarm = 0;
    this.alarmEvent = false;
    this.alarmT = 0;
    this.alarmTriggered = false;
    this.loot = false;
    this.levelTime = 0;
    this.hackT = 0;
    this.toast = "";
    this.toastT = 0;
    this.updateHUD();
  },

  wireButtons() {
    const bind = (id, fn) => {
      const el = document.getElementById(id);
      if (el) el.addEventListener("click", () => { AudioSys.ensure(); fn(); });
    };
    bind("btn-play", () => this.startGame());
    bind("btn-resume", () => this.togglePause());
    bind("btn-next", () => this.nextLevel());
    bind("btn-retry", () => this.retryLevel());
    bind("btn-again", () => this.restartGame());
    bind("btn-sound", () => this.toggleMute());
  },

  startGame() {
    this.screen = "playing";
    this.showOverlay(null);
  },

  restartGame() {
    this.score = 0;
    this.lives = 3;
    this.loadLevel(0);
    this.screen = "playing";
    this.showOverlay(null);
  },

  retryLevel() {
    this.lives = 3;
    this.loadLevel(this.levelIndex);
    this.screen = "playing";
    this.showOverlay(null);
  },

  restartLevel() {
    if (this.screen !== "playing") return;
    this.loadLevel(this.levelIndex);
  },

  nextLevel() {
    if (this.levelIndex + 1 >= LEVELS.length) {
      this.screen = "win";
      this.showOverlay("win");
      document.getElementById("win-score").textContent = this.score;
      AudioSys.winFanfare();
      return;
    }
    this.loadLevel(this.levelIndex + 1);
    this.screen = "playing";
    this.showOverlay(null);
  },

  togglePause() {
    if (this.screen === "playing") {
      this.screen = "paused";
      this.showOverlay("pause");
    } else if (this.screen === "paused") {
      this.screen = "playing";
      this.showOverlay(null);
    }
  },

  toggleMute() {
    AudioSys.ensure();
    const muted = AudioSys.toggleMute();
    document.getElementById("btn-sound").textContent = muted ? "Muted" : "Sound";
  },

  showOverlay(name) {
    for (const id of ["ov-start", "ov-pause", "ov-complete", "ov-caught", "ov-win"]) {
      const el = document.getElementById(id);
      if (el) el.style.display = "none";
    }
    if (name) {
      const el = document.getElementById("ov-" + name);
      if (el) el.style.display = "flex";
    }
  },

  onGuardAlert() {
    this.alarm = Math.min(100, this.alarm + 15);
    AudioSys.alert();
    this.updateHUD();
  },

  onCaught() {
    this.lives -= 1;
    AudioSys.caught();
    if (this.lives <= 0) {
      this.screen = "caught";
      this.showOverlay("caught");
      this.updateHUD();
      return;
    }
    const keptLoot = this.loot;
    const wasAlarm = this.alarmEvent;
    this.loadLevel(this.levelIndex);
    this.loot = keptLoot;
    this.alarm = wasAlarm ? 50 : 0;
    this.toast = "Caught! " + this.lives + (this.lives === 1 ? " life" : " lives") + " left";
    this.toastT = 2.5;
    this.updateHUD();
  },

  triggerAlarm() {
    this.alarm = 100;
    this.alarmEvent = true;
    this.alarmT = CFG.alarmLockTime;
    this.alarmTriggered = true;
    for (const g of this.guards) {
      g.state = "alerted";
      g.loseT = 0;
    }
    AudioSys.alert();
  },

  completeLevel() {
    this.stars = this.alarmTriggered ? 2 : 3;
    const timeBonus = Math.max(0, 300 - Math.floor(this.levelTime) * 2);
    this.score += CFG.lootScore + timeBonus + this.stars * 100;
    this.screen = "complete";
    document.getElementById("complete-title").textContent = this.level.name + " complete!";
    document.getElementById("complete-stars").textContent = "★".repeat(this.stars) + "☆".repeat(3 - this.stars);
    document.getElementById("complete-score").textContent = "Score " + this.score;
    document.getElementById("btn-next").textContent =
      this.levelIndex + 1 >= LEVELS.length ? "See your haul" : "Next level";
    this.showOverlay("complete");
    AudioSys.fanfare();
    this.updateHUD();
  },

  updateHUD() {
    document.getElementById("hud-level").textContent = this.level ? this.level.name : "";
    document.getElementById("hud-loot").textContent = this.loot ? "◆ Loot secured" : "◇ Loot: " + (this.level ? this.level.lootName : "");
    document.getElementById("hud-lives").textContent = "♥".repeat(Math.max(0, this.lives)) + "♡".repeat(Math.max(0, 3 - this.lives));
    document.getElementById("hud-time").textContent = fmtTime(this.levelTime);
    document.getElementById("hud-score").textContent = "Score " + this.score;
    const fill = document.getElementById("alarm-fill");
    fill.style.width = Math.round(this.alarm) + "%";
    fill.style.background = this.alarm >= 70 ? "#ef4444" : this.alarm >= 40 ? "#f59e0b" : "#22c55e";
    document.getElementById("alarm-label").textContent = "ALARM " + Math.round(this.alarm) + "%";
  },

  loop(ts) {
    requestAnimationFrame((t) => this.loop(t));
    const dt = 0.016;
    if (this.screen === "playing" && !this.frozen) this.update(dt);
    if (this.screen === "playing" || this.screen === "start") {
      Render.draw(this.ctx, this);
      if (this.screen === "playing") this.updateHUD();
    }
  },

  update(dt) {
    this.time += dt;
    this.levelTime += dt;
    this.spotted = false;
    this.laserHit = false;

    // Player movement.
    const p = this.player;
    const axis = Keys.axis();
    p.sneaking = Keys.sneaking();
    const speed = p.sneaking ? CFG.sneakSpeed : CFG.playerSpeed;
    const hacking = this.hackT > 0;
    if (axis.x !== 0 || axis.y !== 0) {
      if (!hacking) {
        moveCircle(this.level, p, axis.x * speed * dt, axis.y * speed * dt, CFG.playerRadius);
        this.stepT += dt;
        if (this.stepT > 0.32) { this.stepT = 0; if (!p.sneaking) AudioSys.footstep(); }
      }
    }

    // Hacking a camera at a panel.
    updateHack(this, dt);

    // Guards and cameras (stop if a catch reloaded the level mid-frame).
    const gen = this.gen;
    for (const g of this.guards) { updateGuard(g, dt, this.level, p, this); if (this.gen !== gen) return; }
    for (const cam of this.cameras) updateCamera(cam, this.time, dt, this.level, p, this);
    for (const laser of this.lasers) updateLaser(laser, this.time, dt, this.level, p, this);

    // Alarm: decays while hidden, trips at 100%.
    if (!this.spotted && !this.alarmEvent) {
      this.alarm = Math.max(0, this.alarm - CFG.alarmDecay * dt);
    }
    if (this.alarm >= 100 && !this.alarmEvent) this.triggerAlarm();
    if (this.alarmEvent) {
      this.alarmT -= dt;
      if (this.alarmT <= 0) {
        this.alarmEvent = false;
        this.alarm = 50;
        for (const g of this.guards) { g.state = "patrol"; g.suspicion = 0; }
      }
    }

    // Loot pickup.
    if (!this.loot) {
      const l = this.level.loot;
      if (Math.hypot(p.x - l.x, p.y - l.y) < 26) {
        this.loot = true;
        AudioSys.chime();
        this.toast = "Loot secured — reach the green door";
        this.toastT = 2.5;
      }
    }

    // Exit: locked until the loot is taken (and during a full alarm).
    const e = this.level.exit;
    if (Math.hypot(p.x - e.x, p.y - e.y) < 26) {
      if (!this.loot) {
        this.toast = "Locked — grab the loot first";
        this.toastT = 1.2;
      } else if (this.alarmEvent) {
        this.toast = "Locked — wait out the alarm";
        this.toastT = 1.2;
      } else {
        this.completeLevel();
      }
    }

    if (this.toastT > 0) this.toastT -= dt;
  },
};

function fmtTime(s) {
  const m = Math.floor(s / 60), sec = Math.floor(s % 60);
  return String(m).padStart(2, "0") + ":" + String(sec).padStart(2, "0");
}

window.addEventListener("DOMContentLoaded", () => Game.init());
window.__game = Game;
