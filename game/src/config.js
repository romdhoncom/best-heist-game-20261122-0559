// The Midnight Vault — constants and level layouts.
// All art is drawn in code, all sound is synthesised; nothing is downloaded.
const TILE = 40, COLS = 28, ROWS = 15;
const CW = COLS * TILE, CH = ROWS * TILE; // canvas 1120 x 600

const CFG = {
  playerSpeed: 150,
  sneakSpeed: 75,
  playerRadius: 11,
  guardPatrol: 55,
  guardChase: 112,
  guardConeAngle: 70 * Math.PI / 180,
  guardConeRange: 160,
  camConeAngle: 60 * Math.PI / 180,
  camConeRange: 180,
  suspicionFill: 1.0,   // seconds of being seen before a guard alerts
  suspicionDecay: 2.0,  // suspicion lost per second when unseen
  camAlarmRate: 25,     // alarm % gained per second inside a camera cone
  laserAlarmRate: 30,   // alarm % gained per second inside a laser beam
  alarmDecay: 5,        // alarm % lost per second while hidden
  hackTime: 1.5,        // seconds to hack a camera at its panel
  alarmLockTime: 10,    // seconds the exit stays locked during a full alarm
  lootScore: 500,
};

// Grid legend: # wall, . floor, D desk (cover, blocks sight and movement),
// s shadow zone (hides the player), L loot, E exit, @ player start.
// Guards, cameras, panels and lasers are listed per level (tile coordinates).
// Note: every camera sits on a floor tile with a clear view down its cone —
// a desk directly below a camera would block its whole sweep.
const LEVELS = [
  {
    name: "The Gallery",
    lootName: "gold vault",
    grid: [
      "############################",
      "#@....D.......s....D.......#",
      "#.....D.......D....D....L..#",
      "#..........................#",
      "#.D.......s.......D....D...#",
      "#..........................#",
      "#....D......####......D....#",
      "#...........#..#...........#",
      "#.D....s....#..#....D...s..#",
      "#...........#..#...........#",
      "#....D......####......D....#",
      "#..........................#",
      "#.D.......s.......D....D...#",
      "#..........................#",
      "#############E##############",
    ],
    guards: [
      { path: [[3, 3], [24, 3]] },
      { path: [[24, 5], [24, 12]] },
    ],
    cameras: [
      { col: 10, row: 1, base: Math.PI / 2, sweep: 0.7, speed: 0.5 },
    ],
    panels: [
      { col: 12, row: 2, cam: 0 },
    ],
    lasers: [],
  },
  {
    name: "The Vault",
    lootName: "diamond",
    grid: [
      "############################",
      "#@...D......s......D.......#",
      "#....D.....D......D...D....#",
      "#..........................#",
      "#.D.....s.....D......D.....#",
      "#........####.####.........#",
      "#........#.......#.........#",
      "#..D.....#...L...#....D....#",
      "#........#.......#.........#",
      "#........####.####.........#",
      "#.D.....s.....D......D.....#",
      "#..........................#",
      "#....D.....D......D...D....#",
      "#...s......s......s........#",
      "#############E##############",
    ],
    guards: [
      { path: [[3, 3], [24, 3]] },
      { path: [[24, 4], [24, 12]] },
      { path: [[4, 11], [23, 11]] },
    ],
    cameras: [
      { col: 10, row: 1, base: Math.PI / 2, sweep: 0.7, speed: 0.55 },
      { col: 13, row: 5, base: Math.PI / 2, sweep: 0.5, speed: 0.7 },
    ],
    panels: [
      { col: 12, row: 2, cam: 0 },
      { col: 11, row: 4, cam: 1 },
    ],
    lasers: [],
  },
  {
    name: "The Penthouse",
    lootName: "crown",
    grid: [
      "############################",
      "#@...D......s......D.......#",
      "#....D.....D......D...D....#",
      "#..........................#",
      "#.D.....s.....D......D.....#",
      "#....D......s......D.......#",
      "#..........................#",
      "#.D......D.......D.....D...#",
      "#..........................#",
      "#....D......s......D.......#",
      "#..........................#",
      "#.D.....s.....D......D.....#",
      "#....D.....D......D...D....#",
      "#...s......s......s....L...#",
      "#############E##############",
    ],
    guards: [
      { path: [[3, 3], [24, 3]] },
      { path: [[24, 4], [24, 11]] },
      { path: [[4, 8], [23, 8]] },
      { path: [[6, 4], [6, 12]] },
    ],
    cameras: [
      { col: 10, row: 1, base: Math.PI / 2, sweep: 0.7, speed: 0.55 },
      { col: 7, row: 1, base: Math.PI / 2, sweep: 0.6, speed: 0.65 },
      { col: 21, row: 1, base: Math.PI / 2, sweep: 0.6, speed: 0.6 },
    ],
    panels: [
      { col: 12, row: 2, cam: 0 },
      { col: 4, row: 2, cam: 1 },
      { col: 19, row: 2, cam: 2 },
    ],
    lasers: [
      { col: 2, row: 8, base: 0, sweep: 0.6, speed: 0.8, range: 260 },
      { col: 26, row: 10, base: Math.PI, sweep: 0.6, speed: 0.9, range: 260 },
    ],
  },
];
