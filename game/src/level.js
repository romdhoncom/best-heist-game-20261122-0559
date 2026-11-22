// Level parsing and geometry: tiles, line of sight, cone ray casting.
// Tile kinds: 0 floor, 1 wall, 2 cover (desk), 3 shadow zone.
function parseLevel(def) {
  const tiles = [];
  let player = { x: 60, y: 60 };
  let loot = null;
  let exit = null;
  for (let r = 0; r < ROWS; r++) {
    const row = def.grid[r];
    tiles[r] = [];
    for (let c = 0; c < COLS; c++) {
      const ch = row[c];
      if (ch === "#") tiles[r][c] = 1;
      else if (ch === "D") tiles[r][c] = 2;
      else if (ch === "s") tiles[r][c] = 3;
      else tiles[r][c] = 0;
      if (ch === "@") player = { x: c * TILE + TILE / 2, y: r * TILE + TILE / 2 };
      if (ch === "L") loot = { x: c * TILE + TILE / 2, y: r * TILE + TILE / 2, col: c, row: r };
      if (ch === "E") exit = { x: c * TILE + TILE / 2, y: r * TILE + TILE / 2, col: c, row: r };
    }
  }
  return { name: def.name, lootName: def.lootName, tiles, player, loot, exit, def };
}

function tileAt(level, col, row) {
  if (col < 0 || row < 0 || col >= COLS || row >= ROWS) return 1;
  return level.tiles[row][col];
}

function solidAt(level, px, py) {
  const col = Math.floor(px / TILE), row = Math.floor(py / TILE);
  const t = tileAt(level, col, row);
  return t === 1 || t === 2;
}

function blocksSight(level, px, py) {
  return solidAt(level, px, py);
}

function onShadow(level, px, py) {
  const col = Math.floor(px / TILE), row = Math.floor(py / TILE);
  return tileAt(level, col, row) === 3;
}

// True when the straight segment between two points crosses no wall or cover.
function losClear(level, x1, y1, x2, y2) {
  const dx = x2 - x1, dy = y2 - y1;
  const dist = Math.hypot(dx, dy);
  const steps = Math.max(1, Math.ceil(dist / 6));
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    if (blocksSight(level, x1 + dx * t, y1 + dy * t)) return false;
  }
  return true;
}

// Distance from (x, y) along `angle` until a wall/cover tile, capped at maxDist.
function castRay(level, x, y, angle, maxDist) {
  const step = 5;
  const dx = Math.cos(angle) * step, dy = Math.sin(angle) * step;
  let px = x, py = y, d = 0;
  while (d < maxDist) {
    px += dx; py += dy; d += step;
    if (blocksSight(level, px, py)) return d;
  }
  return maxDist;
}

// Polygon of a vision cone, clipped by walls and cover.
function conePolygon(level, x, y, angle, halfAngle, range, rays) {
  const pts = [{ x, y }];
  for (let i = 0; i <= rays; i++) {
    const a = angle - halfAngle + (2 * halfAngle * i) / rays;
    const d = castRay(level, x, y, a, range);
    pts.push({ x: x + Math.cos(a) * d, y: y + Math.sin(a) * d });
  }
  return pts;
}

function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= 2 * Math.PI;
  while (d < -Math.PI) d += 2 * Math.PI;
  return Math.abs(d);
}

// Can a watcher at (x, y) facing `facing` with `range` and `halfAngle`
// see the player? Sneaking halves the effective range.
function watcherSees(level, x, y, facing, range, halfAngle, player) {
  const dx = player.x - x, dy = player.y - y;
  const dist = Math.hypot(dx, dy);
  const effRange = player.sneaking ? range / 2 : range;
  if (dist > effRange) return false;
  if (dist > 4 && angleDiff(Math.atan2(dy, dx), facing) > halfAngle) return false;
  if (onShadow(level, player.x, player.y)) return false;
  return losClear(level, x, y, player.x, player.y);
}

// Move a circle (radius r) by (dx, dy) with axis-separated tile collision.
function moveCircle(level, obj, dx, dy, r) {
  let nx = obj.x + dx;
  if (!circleHitsSolid(level, nx, obj.y, r)) obj.x = nx;
  let ny = obj.y + dy;
  if (!circleHitsSolid(level, obj.x, ny, r)) obj.y = ny;
}

function circleHitsSolid(level, x, y, r) {
  const c0 = Math.floor((x - r) / TILE), c1 = Math.floor((x + r) / TILE);
  const r0 = Math.floor((y - r) / TILE), r1 = Math.floor((y + r) / TILE);
  for (let row = r0; row <= r1; row++) {
    for (let col = c0; col <= c1; col++) {
      const t = tileAt(level, col, row);
      if (t === 1 || t === 2) {
        const bx = col * TILE, by = row * TILE;
        const cx = Math.max(bx, Math.min(x, bx + TILE));
        const cy = Math.max(by, Math.min(y, by + TILE));
        if ((x - cx) * (x - cx) + (y - cy) * (y - cy) < r * r) return true;
      }
    }
  }
  return false;
}
