// js/puzzles/circuitPatch.js
// HTML5-canvas "pipe connect" mini-game.
// Source: left edge -> goal: right edge. Rotate tiles to connect.
// Deterministic with seed; supports resume by passing { seed, rots }.

(function () {
  // ---- tiny PRNG (xorshift32) ----
  function RNG(seed) {
    let x = seed >>> 0;
    return () => {
      x ^= x << 13; x >>>= 0;
      x ^= x >>> 17; x >>>= 0;
      x ^= x << 5;  x >>>= 0;
      return x / 0xffffffff;
    };
  }

  // ---- tile model ----
  // Direction bits: 1=N, 2=E, 4=S, 8=W
  const N=1, E=2, S=4, W=8;
  const DIRS = [N, E, S, W];
  const OPP  = { [N]:S, [E]:W, [S]:N, [W]:E };

  function rotMask(mask, times) {
    // rotate 0..3 times 90° clockwise
    times &= 3;
    if (!times) return mask;
    let m = mask;
    for (let i=0;i<times;i++) {
      let n = 0;
      if (m & N) n |= E;
      if (m & E) n |= S;
      if (m & S) n |= W;
      if (m & W) n |= N;
      m = n;
    }
    return m;
  }

  function makeTile(baseMask, rot = 0) {
    return {
      base: baseMask & 15,
      rot:  rot & 3,
      get mask() { return rotMask(this.base, this.rot); }
    };
  }

  // Sample shapes: elbow(NE), straight(NS/EW), tee, cross.
  const SHAPES = [
    N|E, E|S, S|W, W|N,         // elbows
    N|S, E|W,                   // straights
    N|E|S, E|S|W, S|W|N, W|N|E, // tees
    N|E|S|W                      // cross
  ];

  function buildGrid(cols, rows, seed) {
    const rnd = RNG(seed);
    const g = [];
    for (let y=0;y<rows;y++) {
      const row = [];
      for (let x=0;x<cols;x++) {
        // bias toward elbows/straights (fun to rotate)
        const pick = (rnd()<0.65)
          ? (rnd()<0.5 ? (rnd()<0.5 ? N|E : E|S) : (rnd()<0.5 ? N|S : E|W))
          : (rnd()<0.85 ? (rnd()<0.5 ? (N|E|S) : (E|S|W)) : (N|E|S|W));
        const r = (rnd()*4)|0;
        row.push(makeTile(pick, r));
      }
      g.push(row);
    }
    return g;
  }

  // ---- BFS connectivity from LEFT edge to RIGHT edge ----
  function bfsConnected(grid) {
    const h = grid.length, w = grid[0].length;
    const q = [];
    const seen = Array.from({length:h},()=>Array(w).fill(false));
    const parent = Array.from({length:h},()=>Array(w).fill(null));

    // starting frontier: any tile in col 0 that has WEST open
    for (let y=0;y<h;y++) {
      if (grid[y][0].mask & W) { q.push([0,y]); seen[y][0]=true; }
    }

    let goal = null;
    while (q.length) {
      const [x, y] = q.shift();
      const m = grid[y][x].mask;

      // if we can go out EAST from the last column, we've solved
      if (x === w-1 && (m & E)) { goal = [x,y]; break; }

      // explore neighbors if both sides connect
      const tryStep = (nx, ny, needDir) => {
        if (nx<0||ny<0||nx>=w||ny>=h) return;
        if (seen[ny][nx]) return;
        const nm = grid[ny][nx].mask;
        if ((m & needDir) && (nm & OPP[needDir])) {
          seen[ny][nx]=true;
          parent[ny][nx]=[x,y];
          q.push([nx,ny]);
        }
      };

      tryStep(x, y-1, N);
      tryStep(x+1, y, E);
      tryStep(x, y+1, S);
      tryStep(x-1, y, W);
    }

    const path = new Set();
    if (goal) {
      let cur = goal;
      while (cur) {
        path.add(cur[0] + ',' + cur[1]);
        cur = parent[cur[1]][cur[0]];
      }
    }
    return { solved: !!goal, path };
  }

  // ---- rendering helpers ----
  function drawTile(ctx, x, y, size, mask, isOnPath) {
    const r = size*0.12;
    // plate
    ctx.fillStyle = '#0e1625';
    ctx.strokeStyle = isOnPath ? '#4cff8f' : '#223149';
    ctx.lineWidth = 2;
    roundRect(ctx, x, y, size, size, r, true, true);

    // conduits
    const cx = x + size/2, cy = y + size/2;
    const w = size*0.16, L = size/2 - size*0.12;

    ctx.lineCap = 'round';
    ctx.lineWidth = w;
    ctx.strokeStyle = isOnPath ? '#4cff8f' : '#6ea6ff';

    ctx.beginPath();
    if (mask & N) { ctx.moveTo(cx, cy); ctx.lineTo(cx, y + size*0.12); }
    if (mask & E) { ctx.moveTo(cx, cy); ctx.lineTo(x + size - size*0.12, cy); }
    if (mask & S) { ctx.moveTo(cx, cy); ctx.lineTo(cx, y + size - size*0.12); }
    if (mask & W) { ctx.moveTo(cx, cy); ctx.lineTo(x + size*0.12, cy); }
    ctx.stroke();

    // hub
    ctx.beginPath();
    ctx.arc(cx, cy, w*0.55, 0, Math.PI*2);
    ctx.fillStyle = isOnPath ? '#4cff8f' : '#9fd';
    ctx.fill();
  }

  function roundRect(ctx, x, y, w, h, r, fill, stroke) {
    ctx.beginPath();
    ctx.moveTo(x+r, y);
    ctx.arcTo(x+w, y,   x+w, y+h, r);
    ctx.arcTo(x+w, y+h, x,   y+h, r);
    ctx.arcTo(x,   y+h, x,   y,   r);
    ctx.arcTo(x,   y,   x+w, y,   r);
    ctx.closePath();
    if (fill) ctx.fill();
    if (stroke) ctx.stroke();
  }

  // ---------------- State ----------------
  const CircuitPatchState = {
    enter(data) {
      this.returnTo = data?.returnTo || 'sector1_explore';
      this.cols = 4; this.rows = 4;

      // resume if seed/rots provided
      this.seed = (data?.seed >>> 0) || (Math.random()*0xffffffff)>>>0;
      this.grid = buildGrid(this.cols, this.rows, this.seed);
      if (Array.isArray(data?.rots)) {
        for (let y=0;y<this.rows;y++) for (let x=0;x<this.cols;x++) {
          const r = (data.rots[y]?.[x] ?? this.grid[y][x].rot)|0;
          this.grid[y][x].rot = r & 3;
        }
      }

      this.solved = false;
      this.winTimer = 0;
      this.canvas = Game.canvas;
      this.ctx = Game.ctx;

      this.board = { x:0, y:0, size:0, cell:0 };
      this.pathSet = new Set();

      // mouse -> tile
      this.onClick = (e) => {
        if (this.solved) return;
        const rect = this.canvas.getBoundingClientRect();
        const px = (e.clientX - rect.left) * (this.canvas.width  / rect.width);
        const py = (e.clientY - rect.top)  * (this.canvas.height / rect.height);
        const b = this.board;
        if (px < b.x || py < b.y || px >= b.x+b.size || py >= b.y+b.size) return;
        const cx = Math.floor((px - b.x)/b.cell);
        const cy = Math.floor((py - b.y)/b.cell);
        const t  = this.grid[cy][cx];
        t.rot = (t.rot + 1) & 3;

        const res = bfsConnected(this.grid);
        this.pathSet = res.path;
        if (res.solved) {
          this.solved   = true;
          this.winTimer = 0;

          // optional checkpoint
          const user_id = +localStorage.getItem('user_id') || 0;
          if (user_id && typeof API?.saveCheckpoint === 'function') {
            const rots = this.grid.map(row => row.map(t => t.rot));
            API.saveCheckpoint({
              user_id, sector: 1, level_key: 'tram_gate', progress_pct: 100,
              state: { screen: 'alley_gate', puzzle: { circuit_patch: { solved: true, seed: this.seed, rots } } }
            }).catch(()=>{});
          }
        }
      };

      // ESC to cancel, R to rotate all
      this.onKey = (e) => {
        if (e.key === 'Escape') {
          Game.setState(this.returnTo, { screen: 'alley_gate', gateUnlocked:false });
        } else if (e.key === 'r' || e.key === 'R') {
          for (const row of this.grid) for (const t of row) t.rot = (t.rot + 1) & 3;
          const res = bfsConnected(this.grid);
          this.pathSet = res.path;
        }
      };

      this.canvas.addEventListener('click', this.onClick);
      window.addEventListener('keydown', this.onKey);

      // initial path
      this.pathSet = bfsConnected(this.grid).path;
    },

    exit() {
      this.canvas?.removeEventListener('click', this.onClick);
      window.removeEventListener('keydown', this.onKey);
    },

    update(dt) {
      if (this.solved) {
        this.winTimer += dt;
        if (this.winTimer > 0.7) {
          Game.setState(this.returnTo, { screen: 'alley_gate', gateUnlocked:true });
        }
      }
    },

    draw(ctx) {
      const w = ctx.canvas.width, h = ctx.canvas.height;
      ctx.fillStyle = '#08121f'; ctx.fillRect(0,0,w,h);

      // Title/hint
      ctx.fillStyle = '#8fe';
      ctx.font = '22px system-ui'; ctx.textAlign = 'center';
      ctx.fillText('Circuit Patch', w/2, 36);
      ctx.font = '16px system-ui'; ctx.fillStyle = '#cfe';
      ctx.fillText(this.solved ? 'Patched! Returning…' : 'Rotate pipes to connect left power to the right gate.', w/2, 62);

      // Board layout
      const boardSize = Math.min(w, h) * 0.7;
      const cell = boardSize / this.cols;
      const bx = (w - boardSize) / 2, by = (h - boardSize) / 2;
      this.board = { x:bx, y:by, size:boardSize, cell };

      // plate
      ctx.strokeStyle = '#23324b';
      ctx.lineWidth = 2;
      ctx.fillStyle = '#0b1320';
      roundRect(ctx, bx-10, by-10, boardSize+20, boardSize+20, 14, true, true);

      // draw tiles
      for (let y=0;y<this.rows;y++) {
        for (let x=0;x<this.cols;x++) {
          const t = this.grid[y][x];
          const mask = t.mask;
          const isOnPath = this.pathSet.has(x+','+y);
          drawTile(ctx, bx + x*cell, by + y*cell, cell, mask, isOnPath);
        }
      }

      // left "power" glyph and right "gate"
      // left
      ctx.fillStyle = '#4cff8f';
      ctx.beginPath();
      ctx.arc(bx - 24, by + boardSize/2, 8, 0, Math.PI*2); ctx.fill();
      // right
      ctx.strokeStyle = '#6ea6ff';
      ctx.lineWidth = 3;
      ctx.strokeRect(bx + boardSize + 12, by + boardSize/2 - 10, 20, 20);
    }
  };

  // Global export + optional self-registration
  window.CircuitPatchState = CircuitPatchState;
  if (typeof window.registerState === 'function') {
    registerState('circuit_patch', CircuitPatchState);
  }
})();
