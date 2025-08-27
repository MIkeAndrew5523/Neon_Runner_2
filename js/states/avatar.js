const AvatarState = {
  enter() {
    this.form = document.getElementById("avatarForm");
    this.form.classList.remove("hidden");
    this.onSubmit = this.handleSubmit.bind(this);
    this.form.addEventListener("submit", this.onSubmit);
    document.getElementById("username").focus();
  },
  exit() {
    this.form.removeEventListener("submit", this.onSubmit);
    this.form.classList.add("hidden");
  },
  async handleSubmit(e) {
    e.preventDefault();
    const fd = new FormData(this.form);
    const username = (fd.get("username") || "").toString().trim();
    const avatar_key = fd.get("avatar_key") || "runner_f";
    if (!username) return;

    const res = await API.saveUser(username, avatar_key);
    if (res && res.ok) {
      localStorage.setItem("user_id", String(res.user_id));
      localStorage.setItem("username", username);
      localStorage.setItem("avatar_key", avatar_key);
      Game.setState("story");
    } else {
      alert("Could not save user.");
    }
  },
  update() {},
  draw(ctx) {
    // Dimmed canvas behind the overlay
    ctx.fillStyle = "rgba(0,0,0,0.4)";
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.fillStyle = "#9fd";
    ctx.font = "18px system-ui";
    ctx.textAlign = "center";
    ctx.fillText("Create your runner to continue…", ctx.canvas.width/2, 40);
  }
};
