// js/game.js — robust central registration

(() => {
  const cvs = document.getElementById('game');
  if (!cvs) { console.error('Canvas #game not found'); return; }
  const ctx = cvs.getContext('2d');

  // ---- Core engine ----
  const Game = (window.Game = {
    canvas: cvs,
    ctx,
    state: null,
    states: {},
    _stateName: null,
    isPaused: false,

    setState(name, data) {
      const next = this.states[name];
      if (!next) {
        console.error('Unknown state:', name, 'Registered:', Object.keys(this.states));
        return;
      }
      try { this.state?.exit?.(); } catch (e) { console.error('exit() error in', this._stateName, e); }
      this._stateName = name;
      this.state = next;
      try { this.state?.enter?.(data); } catch (e) { console.error('enter() error in', name, e); }
    },
  });

  // global helper other files can call too
  window.registerState = function registerState(name, obj) {
    if (!obj) return;
    Game.states[name] = obj;
  };

  // ---- Main loop ----
  let last = performance.now();
  function loop(now = performance.now()) {
    if (Game.isPaused) { last = now; return requestAnimationFrame(loop); }
    const dt = Math.min(0.05, (now - last) / 1000); // clamp 50ms
    try { Game.state?.update?.(dt); } catch (e) { console.error('update() failed in', Game._stateName, e); }
    try {
      ctx.clearRect(0, 0, cvs.width, cvs.height);
      Game.state?.draw?.(ctx);
    } catch (e) { console.error('draw() failed in', Game._stateName, e); }
    last = now;
    requestAnimationFrame(loop);
  }

  document.addEventListener('visibilitychange', () => { Game.isPaused = document.hidden; });

  // ---- Boot ----
  (function boot() {
    // Central registration that works with `const` globals.
    // Each try/catch will no-op if the variable doesn’t exist yet.
    try { registerState('title',            TitleState); }         catch {}
    try { registerState('avatar',           AvatarState); }        catch {}
    try { registerState('story',            StoryState); }         catch {}
    try { registerState('sector1_explore',  Sector1Explore); }     catch {}
  try { registerState('circuit_patch',    window.CircuitPatchState); }  catch {}

    const user_id = +localStorage.getItem('user_id') || 0;
    const backstorySeen = localStorage.getItem('backstory_seen') === '1';

    let start = 'title';
    if (user_id && backstorySeen && Game.states['sector1_explore']) {
      start = 'sector1_explore';
    }

    Game.setState(start);
    requestAnimationFrame(loop);
  })();
})();
