// All drawing: floor, walls, cover, shadows, cones, guards, cameras,
// lasers, loot, exit, player and the alarm flash. Canvas 2D only.
const Render = {
  draw(ctx, game) {
    const level = game.level;
    const t = game.time;
    ctx.clearRect(0, 0, CW, CH);

    // Floor: navy checker.
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const k = level.tiles[r][c];
        ctx.fillStyle = (r + c) % 2 === 0 ? "#1a2436" : "#16202f";
        ctx.fillRect(c * TILE, r * TILE, TILE, TILE);
        if (k === 3) {
          ctx.fillStyle = "rgba(8, 16, 38, 0.55)";
          ctx.fillRect(c * TILE, r * TILE, TILE, TILE);
        }
      }
    }

    // Walls with a warm gold top edge; desks as solid brown blocks.
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const k = level.tiles[r][c];
        if (k === 1) {
          ctx.fillStyle = "#3a3f4a";
          ctx.fillRect(c * TILE, r * TILE, TILE, TILE);
          ctx.fillStyle = "#c9a227";
          ctx.fillRect(c * TILE, r * TILE, TILE, 4);
        } else if (k === 2) {
          ctx.fillStyle = "#6b4f2a";
          ctx.fillRect(c * TILE + 3, r * TILE + 3, TILE - 6, TILE - 6);
          ctx.strokeStyle = "#8a6a3a";
          ctx.lineWidth = 2;
          ctx.strokeRect(c * TILE + 3, r * TILE + 3, TILE - 6, TILE - 6);
          ctx.beginPath();
          ctx.moveTo(c * TILE + 8, r * TILE + 8);
          ctx.lineTo(c * TILE + TILE - 8, r * TILE + TILE - 8);
          ctx.moveTo(c * TILE + TILE - 8, r * TILE + 8);
          ctx.lineTo(c * TILE + 8, r * TILE + TILE - 8);
          ctx.stroke();
        }
      }
    }

    // Exit: glowing green door (grey + LOCKED while the loot is missing
    // or while a full alarm locks it).
    const exit = level.exit;
    const exitLocked = !game.loot || game.alarmEvent;
    ctx.save();
    ctx.shadowColor = exitLocked ? "#888888" : "#22c55e";
    ctx.shadowBlur = 18;
    ctx.fillStyle = exitLocked ? "#4b5563" : "#16a34a";
    ctx.fillRect(exit.x - 16, exit.y - 16, 32, 32);
    ctx.restore();
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 11px 'Trebuchet MS', Verdana, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(exitLocked ? "LOCKED" : "EXIT", exit.x, exit.y - 22);

    // Loot: a glowing gold shape (vault, diamond or crown by level).
    if (!game.loot) this.drawLoot(ctx, level.loot, game.levelIndex, t);

    // Hack panels: small wall boxes with a blinking light.
    for (const panel of game.panels) {
      const cam = game.cameras[panel.cam];
      ctx.fillStyle = cam.disabled ? "#374151" : "#0ea5e9";
      ctx.fillRect(panel.x - 10, panel.y - 12, 20, 24);
      ctx.fillStyle = cam.disabled ? "#9ca3af" : "#ffffff";
      ctx.font = "bold 10px 'Trebuchet MS', Verdana, sans-serif";
      ctx.fillText(cam.disabled ? "OFF" : "PANEL", panel.x, panel.y - 16);
    }

    // Camera cones (blue; red and flashing while spotting).
    for (const cam of game.cameras) {
      if (cam.disabled) continue;
      const pts = conePolygon(level, cam.x, cam.y, cam.angle, CFG.camConeAngle / 2, CFG.camConeRange, 22);
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
      ctx.closePath();
      const flashing = cam.spotting && Math.floor(t * 6) % 2 === 0;
      ctx.fillStyle = flashing ? "rgba(239, 68, 68, 0.45)" : "rgba(59, 130, 246, 0.28)";
      ctx.fill();
    }

    // Guard cones (yellow; orange while suspicious, red while alerted).
    for (const g of game.guards) {
      const pts = conePolygon(level, g.x, g.y, g.facing, CFG.guardConeAngle / 2, CFG.guardConeRange, 22);
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
      ctx.closePath();
      ctx.fillStyle = g.state === "alerted" ? "rgba(239, 68, 68, 0.45)"
        : g.state === "suspicious" ? "rgba(249, 115, 22, 0.4)"
        : "rgba(250, 204, 21, 0.28)";
      ctx.fill();
    }

    // Laser beams: thin red lines sweeping from their emitters.
    for (const laser of game.lasers) {
      const d = castRay(level, laser.x, laser.y, laser.angle, laser.range);
      const ex = laser.x + Math.cos(laser.angle) * d;
      const ey = laser.y + Math.sin(laser.angle) * d;
      ctx.strokeStyle = game.laserHit ? "#ff2222" : "rgba(239, 68, 68, 0.75)";
      ctx.lineWidth = game.laserHit ? 4 : 2;
      ctx.beginPath();
      ctx.moveTo(laser.x, laser.y);
      ctx.lineTo(ex, ey);
      ctx.stroke();
      ctx.fillStyle = "#7f1d1d";
      ctx.fillRect(laser.x - 8, laser.y - 8, 16, 16);
    }

    // Cameras: small wall units; grey with OFF once hacked.
    for (const cam of game.cameras) {
      ctx.fillStyle = cam.disabled ? "#4b5563" : "#94a3b8";
      ctx.beginPath();
      ctx.arc(cam.x, cam.y, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = cam.disabled ? "#9ca3af" : "#1e293b";
      ctx.beginPath();
      ctx.arc(cam.x + Math.cos(cam.angle) * 5, cam.y + Math.sin(cam.angle) * 5, 4, 0, Math.PI * 2);
      ctx.fill();
      if (cam.disabled) {
        ctx.fillStyle = "#d1d5db";
        ctx.font = "bold 9px 'Trebuchet MS', Verdana, sans-serif";
        ctx.fillText("OFF", cam.x, cam.y - 14);
      }
    }

    // Guards: dark uniform, lighter cap, direction tick, ? / ! and suspicion bar.
    for (const g of game.guards) {
      ctx.fillStyle = "#1f2937";
      ctx.beginPath();
      ctx.arc(g.x, g.y, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#e5e7eb";
      ctx.beginPath();
      ctx.arc(g.x, g.y, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#e5e7eb";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(g.x, g.y);
      ctx.lineTo(g.x + Math.cos(g.facing) * 18, g.y + Math.sin(g.facing) * 18);
      ctx.stroke();
      if (g.state === "suspicious" || g.state === "alerted") {
        ctx.fillStyle = g.state === "alerted" ? "#ef4444" : "#f97316";
        ctx.font = "bold 18px 'Trebuchet MS', Verdana, sans-serif";
        ctx.fillText(g.state === "alerted" ? "!" : "?", g.x, g.y - 18);
      }
      if (g.suspicion > 0 && g.state !== "alerted") {
        ctx.fillStyle = "#111827";
        ctx.fillRect(g.x - 12, g.y - 26, 24, 4);
        ctx.fillStyle = "#f97316";
        ctx.fillRect(g.x - 12, g.y - 26, 24 * g.suspicion, 4);
      }
    }

    // Player: a hooded shape with a soft light ring; dimmer in shadow.
    const p = game.player;
    const inShadow = onShadow(level, p.x, p.y);
    ctx.save();
    ctx.globalAlpha = inShadow ? 0.6 : 1;
    const glow = ctx.createRadialGradient(p.x, p.y, 4, p.x, p.y, 44);
    glow.addColorStop(0, "rgba(250, 204, 21, 0.3)");
    glow.addColorStop(1, "rgba(250, 204, 21, 0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 44, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#0f172a";
    ctx.beginPath();
    ctx.arc(p.x, p.y, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.75)";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = "#facc15";
    ctx.beginPath();
    ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Hack progress ring over the player.
    if (game.hackT > 0) {
      ctx.strokeStyle = "#0ea5e9";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 20, -Math.PI / 2, -Math.PI / 2 + (game.hackT / CFG.hackTime) * Math.PI * 2);
      ctx.stroke();
    }

    // Toast text (hints such as "Camera disabled" or "Locked").
    if (game.toastT > 0) {
      ctx.fillStyle = "rgba(17, 24, 39, 0.85)";
      ctx.fillRect(CW / 2 - 130, 12, 260, 26);
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 13px 'Trebuchet MS', Verdana, sans-serif";
      ctx.fillText(game.toast, CW / 2, 30);
    }

    // Full-alarm flashing border.
    if (game.alarmEvent) {
      ctx.strokeStyle = Math.floor(t * 4) % 2 === 0 ? "rgba(239, 68, 68, 0.9)" : "rgba(239, 68, 68, 0.3)";
      ctx.lineWidth = 8;
      ctx.strokeRect(4, 4, CW - 8, CH - 8);
      ctx.fillStyle = "#ef4444";
      ctx.font = "bold 20px 'Trebuchet MS', Verdana, sans-serif";
      ctx.fillText("ALARM — EXIT LOCKED", CW / 2, 44);
    }
  },

  drawLoot(ctx, loot, levelIndex, t) {
    const pulse = 1 + Math.sin(t * 4) * 0.12;
    ctx.save();
    ctx.translate(loot.x, loot.y);
    ctx.scale(pulse, pulse);
    ctx.shadowColor = "#facc15";
    ctx.shadowBlur = 16;
    ctx.fillStyle = "#facc15";
    if (levelIndex === 0) {
      // Gold vault: a small safe with a dial.
      ctx.fillRect(-13, -11, 26, 22);
      ctx.fillStyle = "#78350f";
      ctx.beginPath();
      ctx.arc(0, 0, 6, 0, Math.PI * 2);
      ctx.fill();
    } else if (levelIndex === 1) {
      // Diamond.
      ctx.beginPath();
      ctx.moveTo(0, -13);
      ctx.lineTo(11, 0);
      ctx.lineTo(0, 13);
      ctx.lineTo(-11, 0);
      ctx.closePath();
      ctx.fill();
    } else {
      // Crown.
      ctx.beginPath();
      ctx.moveTo(-12, 10);
      ctx.lineTo(-12, -6);
      ctx.lineTo(-6, 2);
      ctx.lineTo(0, -10);
      ctx.lineTo(6, 2);
      ctx.lineTo(12, -6);
      ctx.lineTo(12, 10);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  },
};
