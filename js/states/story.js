const StoryState = {
  enter() {
    this.t = 0;
    this.duration = 3.0; // seconds; later replace with real text/anim
  },
  update(dt) {
    this.t += dt;
    if (this.t >= this.duration) {
      // TODO: switch to Sector 1 exploration when ready.
      // e.g., Game.setState("sector1_explore");
      // For now, loop back to title so you can see the flow.
      // Replace this line once Sector 1 is implemented.
      Game.setState("title");
    }
  },
  draw(ctx) {
    const w = ctx.canvas.width, h = ctx.canvas.height;
    ctx.fillStyle = "#0b1726"; ctx.fillRect(0,0,w,h);
    ctx.fillStyle = "#8fe";
    ctx.font = "24px system-ui";
    ctx.textAlign = "center";
    ctx.fillText("2145. The neon city is sealed.", w/2, h/2 - 20);
    ctx.fillText("Cipher must get the data crystal across the sectors…", w/2, h/2 + 20);
  }
};
