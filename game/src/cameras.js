// Security cameras, hacking panels and laser grids.
function makeCamera(def) {
  return {
    x: def.col * TILE + TILE / 2,
    y: def.row * TILE + TILE / 2,
    base: def.base,
    sweep: def.sweep,
    speed: def.speed,
    angle: def.base,
    disabled: false,
    spotting: false,
    flash: 0,
  };
}

function updateCamera(cam, t, dt, level, player, game) {
  if (cam.disabled) { cam.spotting = false; return; }
  cam.angle = cam.base + Math.sin(t * cam.speed) * cam.sweep;
  const seen = watcherSees(level, cam.x, cam.y, cam.angle, CFG.camConeRange, CFG.camConeAngle / 2, player);
  cam.spotting = seen;
  if (seen) {
    game.alarm = Math.min(100, game.alarm + CFG.camAlarmRate * dt);
    game.spotted = true;
    cam.flash += dt;
    if (Math.floor(cam.flash * 6) !== Math.floor((cam.flash - dt) * 6)) AudioSys.cameraBeep();
  }
}

function makeLaser(def) {
  return {
    x: def.col * TILE + TILE / 2,
    y: def.row * TILE + TILE / 2,
    base: def.base,
    sweep: def.sweep,
    speed: def.speed,
    range: def.range,
    angle: def.base,
  };
}

function updateLaser(laser, t, dt, level, player, game) {
  laser.angle = laser.base + Math.sin(t * laser.speed) * laser.sweep;
  // The beam is a thin line from the emitter; crossing it trips the alarm.
  const dx = player.x - laser.x, dy = player.y - laser.y;
  const dist = Math.hypot(dx, dy);
  if (dist > laser.range || dist < 6) return;
  const ang = Math.atan2(dy, dx);
  if (angleDiff(ang, laser.angle) > 0.05) return;
  if (!losClear(level, laser.x, laser.y, player.x, player.y)) return;
  game.alarm = Math.min(100, game.alarm + CFG.laserAlarmRate * dt);
  game.spotted = true;
  game.laserHit = true;
}

// Hacking: stand by a panel and hold E through the channel.
function nearestPanel(game, level) {
  const p = game.player;
  for (const panel of game.panels) {
    const d = Math.hypot(p.x - panel.x, p.y - panel.y);
    if (d < 48) return panel;
  }
  return null;
}

function updateHack(game, dt) {
  const panel = nearestPanel(game, game.level);
  game.nearPanel = panel;
  if (!panel) { game.hackT = 0; return; }
  const cam = game.cameras[panel.cam];
  if (cam.disabled) { game.hackT = 0; return; }
  if (Keys.down["e"]) {
    game.hackT += dt;
    if (game.hackT >= CFG.hackTime) {
      cam.disabled = true;
      game.hackT = 0;
      AudioSys.hackBlip();
      game.toast = "Camera disabled";
      game.toastT = 2;
    }
  } else {
    game.hackT = 0;
  }
}
