// Keyboard and mouse input. Classic script, one shared Keys object.
const Keys = {
  down: {},
  interactPressed: false,

  init() {
    window.addEventListener("keydown", (e) => {
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)) {
        e.preventDefault();
      }
      const k = e.key.toLowerCase();
      if (!this.down[k]) {
        if (k === "e") this.interactPressed = true;
        if (k === "m") Game.toggleMute();
        if (k === "escape" || k === "p") Game.togglePause();
        if (k === "r") Game.restartLevel();
      }
      this.down[k] = true;
      AudioSys.ensure();
    });
    window.addEventListener("keyup", (e) => {
      this.down[e.key.toLowerCase()] = false;
    });
    window.addEventListener("blur", () => {
      this.down = {};
    });
  },

  axis() {
    let x = 0, y = 0;
    if (this.down["a"] || this.down["arrowleft"]) x -= 1;
    if (this.down["d"] || this.down["arrowright"]) x += 1;
    if (this.down["w"] || this.down["arrowup"]) y -= 1;
    if (this.down["s"] || this.down["arrowdown"]) y += 1;
    if (x !== 0 && y !== 0) { x *= Math.SQRT1_2; y *= Math.SQRT1_2; }
    return { x, y };
  },

  sneaking() {
    return !!this.down["shift"];
  },

  consumeInteract() {
    const v = this.interactPressed;
    this.interactPressed = false;
    return v;
  },
};
