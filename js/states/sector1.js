// js/sector1.js

// -------- Sector 1: Exploration --------
const Sector1Explore = {
  enter(data) {
    // three simple “screens”
    this.screen = data?.screen || 'alley_start'; // 'alley_start' | 'alley_junk' | 'alley_gate'
    this.gateUnlocked = !!data?.gateUnlocked;

    // cache canvas
    this.canvas = Game.canvas || document.getElementById('game');

    // Click navigation (also lets you click the gate to open the puzzle)
    this.onClick = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const px = (e.clientX - rect.left) * (this.canvas.width / rect.width);
      const py = (e.clientY - rect.top)  * (this.canvas.height / rect.height);

      if (this.screen === 'alley_start') {
        this.screen = (px < this.canvas.width / 2) ? 'alley_junk' : 'alley_gate';
        return;
      }

      if (this.screen === 'alley_junk') {
        this.screen = 'alley_start';
        return;
      }

      if (this.screen === 'alley_gate') {
        // gate rectangle (must match draw())
        const gx = this.canvas.width/2 - 60, gy = this.canvas.height/2 - 30, gw = 120, gh = 60;
        const insideGate = (px >= gx && px <= gx+gw && py >= gy && py <= gy+gh);

        if (insideGate && !this.gateUnlocked) {
          Game.setState('circuit_patch', { returnTo: 'sector1_explore' });
          return;
        }

        if (insideGate && this.gateUnlocked) {
          // Tram repaired -> advance (hook into save_progress later)
          console.log('Sector 1 complete → unlock tram');
          // Game.setState('sector2_explore');
          return;
        }

        // click elsewhere on this screen returns to start
        this.screen = 'alley_start';
      }
    };

    // Keyboard shortcuts
    this.onKey = (e) => {
      if (this.screen === 'alley_gate' && !this.gateUnlocked && e.code === 'KeyE') {
        Game.setState('circuit_patch', { returnTo: 'sector1_explore' });
      }
      if (this.screen === 'alley_gate' && this.gateUnlocked && e.code === 'Enter') {
        console.log('Sector 1 complete → unlock tram');
        // Game.setState('sector2_explore');
      }
    };

    this.canvas.addEventListener('click', this.onClick);
    window.addEventListener('keydown', this.onKey);
  },

  exit() {
    (this.canvas || document.getElementById('game'))?.removeEventListener('click', this.onClick);
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
        ctx.fillText('Gate is powered down. Press E or click gate to patch the circuit.', w/2, 64);
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

// Register only the exploration state here.
// The real puzzle registers from js/puzzles/circuitPatch.js
registerState('sector1_explore', Sector1Explore);
