// Deterministic staged states for screenshots, via ?shot=<name>&seed=1.
// The game boots, stages the state, renders one frame and freezes.
function stageShot(name) {
  const G = Game;
  if (name === "cover") {
    // Level 1 mid-heist: thief behind a desk, guard cone sweeping past,
    // camera cone on the other side, loot glowing, exit glowing, alarm 35%.
    G.loadLevel(0);
    G.screen = "playing";
    G.player.x = 3 * TILE + 20;
    G.player.y = 11 * TILE + 20;
    G.player.sneaking = true;
    const g0 = G.guards[0];
    g0.x = 8 * TILE + 20;
    g0.y = 3 * TILE + 20;
    g0.facing = Math.PI / 2 + 0.35;
    g0.state = "patrol";
    const g1 = G.guards[1];
    g1.x = 24 * TILE + 20;
    g1.y = 9 * TILE + 20;
    g1.facing = Math.PI;
    const cam = G.cameras[0];
    cam.angle = Math.PI / 2 + 0.5;
    G.alarm = 35;
    G.levelTime = 42;
    G.score = 100;
    G.loot = false;
    G.frozen = true;
    G.showOverlay(null);
  } else if (name === "start") {
    G.loadLevel(0);
    G.screen = "start";
    G.showOverlay("start");
    G.frozen = true;
  } else if (name === "alarm") {
    // Level 2, alarm at 80% with the exit locked by a full alarm:
    // guard alerted and chasing (red cone, "!"), camera cone flashing red,
    // thief slipping into a shadow zone, loot already secured.
    G.loadLevel(1);
    G.screen = "playing";
    G.loot = true;
    G.alarm = 80;
    G.alarmEvent = true;
    G.alarmT = 6;
    G.alarmTriggered = true;
    G.player.x = 8 * TILE + 20;
    G.player.y = 10 * TILE + 20;
    G.player.sneaking = true;
    const g0 = G.guards[0];
    g0.x = 13 * TILE + 20;
    g0.y = 6 * TILE + 20;
    g0.facing = Math.atan2(G.player.y - g0.y, G.player.x - g0.x);
    g0.state = "alerted";
    g0.suspicion = 1;
    const cam = G.cameras[1];
    cam.angle = Math.atan2(G.player.y - cam.y, G.player.x - cam.x);
    cam.spotting = true;
    G.levelTime = 73;
    G.score = 200;
    G.frozen = true;
    G.showOverlay(null);
  } else if (name === "win") {
    // Level 1 complete: 3 stars, score, Next level button, level behind.
    G.loadLevel(0);
    G.screen = "complete";
    G.stars = 3;
    G.score = 1740;
    G.loot = true;
    document.getElementById("complete-title").textContent = "The Gallery complete!";
    document.getElementById("complete-stars").textContent = "★★★";
    document.getElementById("complete-score").textContent = "Score 1740";
    document.getElementById("btn-next").textContent = "Next level";
    G.showOverlay("complete");
    G.frozen = true;
  }
  G.updateHUD();
}
