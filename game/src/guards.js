// Guards: patrol routes, vision cones, suspicion, alert and chase.
function makeGuard(def) {
  const pts = def.path.map(([c, r]) => ({ x: c * TILE + TILE / 2, y: r * TILE + TILE / 2 }));
  const g = {
    path: pts,
    wp: 1,
    dir: 1,
    x: pts[0].x,
    y: pts[0].y,
    facing: 0,
    speed: CFG.guardPatrol,
    suspicion: 0,
    state: "patrol", // patrol | suspicious | alerted
    chaseT: 0,
    loseT: 0,
    wasSeen: false,
  };
  if (pts.length > 1) {
    g.facing = Math.atan2(pts[1].y - pts[0].y, pts[1].x - pts[0].x);
  }
  return g;
}

function updateGuard(g, dt, level, player, game) {
  const seen = watcherSees(level, g.x, g.y, g.facing, CFG.guardConeRange, CFG.guardConeAngle / 2, player);

  if (g.state === "alerted") {
    // Chase the player; give up after 2 s without seeing them.
    if (seen) {
      g.loseT = 0;
      g.chaseT += dt;
    } else {
      g.loseT += dt;
      if (g.loseT > 2) {
        g.state = "patrol";
        g.suspicion = 0;
        g.loseT = 0;
      }
    }
    const dx = player.x - g.x, dy = player.y - g.y;
    const d = Math.hypot(dx, dy);
    if (d > 4) {
      g.facing = Math.atan2(dy, dx);
      moveCircle(level, g, (dx / d) * CFG.guardChase * dt, (dy / d) * CFG.guardChase * dt, 11);
    }
    if (d < 26) {
      game.onCaught();
      return;
    }
    return;
  }

  // Patrol: walk to the current waypoint, then turn around at the ends.
  const target = g.path[g.wp];
  const dx = target.x - g.x, dy = target.y - g.y;
  const d = Math.hypot(dx, dy);
  if (d < 4) {
    g.wp += g.dir;
    if (g.wp >= g.path.length) { g.wp = g.path.length - 2; g.dir = -1; }
    if (g.wp < 0) { g.wp = 1; g.dir = 1; }
  } else {
    const want = Math.atan2(dy, dx);
    let diff = want - g.facing;
    while (diff > Math.PI) diff -= 2 * Math.PI;
    while (diff < -Math.PI) diff += 2 * Math.PI;
    g.facing += Math.max(-3 * dt, Math.min(3 * dt, diff));
    moveCircle(level, g, Math.cos(g.facing) * g.speed * dt, Math.sin(g.facing) * g.speed * dt, 11);
  }

  // Suspicion: fills while the player is seen, drains while hidden.
  if (seen) {
    const before = g.suspicion;
    g.suspicion += dt / CFG.suspicionFill;
    if (before < 0.4 && g.suspicion >= 0.4) AudioSys.suspicion();
    if (g.suspicion >= 1) {
      g.state = "alerted";
      g.suspicion = 1;
      g.chaseT = 0;
      g.loseT = 0;
      game.onGuardAlert();
    } else if (g.suspicion > 0) {
      g.state = "suspicious";
    }
  } else {
    g.suspicion = Math.max(0, g.suspicion - dt * CFG.suspicionDecay);
    if (g.suspicion <= 0) g.state = "patrol";
  }
  g.wasSeen = seen;
}
