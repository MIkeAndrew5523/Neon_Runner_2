const cvs = document.getElementById("game");
const ctx = cvs.getContext("2d");
let last = performance.now();

const Game = {
  state: null,
  states: {},                     // registry
  setState(name, data) {
    if (this.state && this.state.exit) this.state.exit();
    this.state = this.states[name];
    if (!this.state) throw new Error("Unknown state: " + name);
    if (this.state.enter) this.state.enter(data);
  },
};

function registerState(name, obj) { Game.states[name] = obj; }

function loop(now = performance.now()) {
  const dt = (now - last) / 1000;
  if (Game.state && Game.state.update) Game.state.update(dt);
  if (Game.state && Game.state.draw) {
    ctx.clearRect(0, 0, cvs.width, cvs.height);
    Game.state.draw(ctx);
  }
  last = now;
  requestAnimationFrame(loop);
}

// --- Boot: decide where to start ---
(async function boot() {
  // restore user if present
  const user_id = +localStorage.getItem("user_id") || 0;

  // Register states (from individual files)
  registerState("title", TitleState);
  registerState("avatar", AvatarState);
  registerState("story", StoryState);

  // decide initial state
  if (!user_id) {
    Game.setState("title");
  } else {
    // optional: look for a checkpoint and skip straight to gameplay later
    Game.setState("title"); // keep simple for first run
  }

  loop();
})();
