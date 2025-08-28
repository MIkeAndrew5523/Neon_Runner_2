// js/sector1.js

// -------- Sector 1: Exploration --------
const Sector1Explore = {
  enter(data) {
    // three simple “screens”
    this.screen = data?.screen || 'alley_start'; // 'alley_start' | 'alley_junk' | 'alley_gate'
    this.gateUnlocked = !!data?.gateUnlocked;

    this.onClick = (e) => {
      const x = e.offsetX, w = e.target.width;
      if (this.screen === 'alley_start') this.screen = (x < w/2) ? 'alley_junk' : 'alley_gate';
      else if (this.screen === 'alley_junk') this.screen = 'alley_start';
      else if (this.screen === 'alley_gate') this.screen = 'alley_start';
    };

    this.onKey = (e) => {
      if (this.screen === 'alley_gate' && !this.gateUnlocked && (e.key === 'e' || e.key === 'E')) {
        // Enter the mini-game
        Game.setState('circuit_patch', { returnTo: 'sector1_explore' });
      }
      if (this.screen === 'alley_gate' && this.gateUnlocked && e.key === 'Enter') {
        // Tram repaired -> advance (for now just log; hook into save_progress later)
        console.log('Sector 1 complete → unlock tram');
        // Example: call a progress API, then go to next sector or a cutscene.
        // Game.setState('sector2_explore');
      }
    };

    document.getElementById('game').addEventListener('click', this.onClick);
    window.addEventListener('keydown', this.onKey);
  },

  exit() {
    document.getElementById('game').removeEventListener('click', this.onClick);
    window.removeEventListener('keydown', this.onKey);
  },

  update() {},

  draw(ctx) {
    const w = ctx.canvas.width, h = ctx.canvas.height;

    // background by screen
    ctx.fillStyle = (this.screen === 'alley_junk') ? '#141b2a'
                 : (this.screen === 'alley_gate') ? '#101826'
                 : '#0f1826';
    ctx.fillRect(0,0,w,h);

    // labels
    ctx.fillStyle = '#9fe';
    ctx.font = '20px system-ui';
    ctx.textAlign = 'center';
    const title = this.screen === 'alley_start' ? 'Sector 1 – Shattered Alley'
                 : this.screen === 'alley_junk' ? 'Scrap Piles'
                 : 'Tram Gate';
    ctx.fillText(title, w/2, 36);

    // instructions
    ctx.font = '16px system-ui';
    ctx.fillStyle = '#cfe';
    if (this.screen === 'alley_start') {
      ctx.fillText('Click left for Scrap, right for Gate.', w/2, 64);
    } else if (this.screen === 'alley_junk') {
      ctx.fillText('Scrap piles. Click to go back.', w/2, 64);
    } else if (this.screen === 'alley_gate') {
      if (!this.gateUnlocked) {
        ctx.fillText('Gate is powered down. Press E to patch the circuit.', w/2, 64);
      } else {
        ctx.fillText('Gate repaired! Press Enter to ride the tram to Sector 2.', w/2, 64);
      }
    }

    // simple “visuals”
    if (this.screen === 'alley_gate') {
      ctx.fillStyle = this.gateUnlocked ? '#4cff8f' : '#ff5a5a';
      ctx.fillRect(w/2 - 60, h/2 - 30, 120, 60); // gate block
    }
  }
};

// -------- Sector 1: Circuit Patch Mini-game (placeholder) --------
const CircuitPatchState = {
  enter(data) {
    this.returnTo = data?.returnTo || 'sector1_explore';
    this.t = 0;
    this.solved = false;

    this.onKey = (e) => {
      if (e.key === 'Enter') this.solve(); // quick manual solve
    };
    window.addEventListener('keydown', this.onKey);
  },

  exit() {
    window.removeEventListener('keydown', this.onKey);
  },

  update(dt) {
    this.t += dt;
    // auto-solve after 5 seconds to prove the flow
    if (!this.solved && this.t > 5) this.solve();
  },

  async solve() {
    this.solved = true;

    // optional: persist a checkpoint
    const user_id = +localStorage.getItem('user_id') || 0;
    if (user_id && typeof API?.saveCheckpoint === 'function') {
      try {
        await API.saveCheckpoint({
          user_id,
          sector: 1,
          level_key: 'tram_gate',
          progress_pct: 100,
          state: { screen: 'alley_gate', puzzle: { circuit_patch: { solved: true } } }
        });
      } catch (_) {}
    }

    // return to explore with gate unlocked
    Game.setState(this.returnTo, { screen: 'alley_gate', gateUnlocked: true });
  },

  draw(ctx) {
    const w = ctx.canvas.width, h = ctx.canvas.height;
    ctx.fillStyle = '#08121f'; ctx.fillRect(0,0,w,h);
    ctx.fillStyle = '#9fe';
    ctx.font = '22px system-ui'; ctx.textAlign = 'center';
    ctx.fillText('Circuit Patch – placeholder', w/2, h/2 - 20);
    ctx.font = '16px system-ui';
    ctx.fillText('Wait 5s or press Enter to solve.', w/2, h/2 + 14);
  }
};

