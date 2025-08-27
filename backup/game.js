// ===== Boot =====
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const hudScore = document.getElementById('score');
const hudLives = document.getElementById('lives');
const hudGate  = document.getElementById('gate');
const btnStart = document.getElementById('btnStart');
const overlay  = document.getElementById('overlay');
const ovTitle  = document.getElementById('ovTitle');
const ovMsg    = document.getElementById('ovMsg');
const ovBtn    = document.getElementById('ovBtn');

let level, game, lastT = 0;
btnStart.onclick = () => startLevel('level1.json');
ovBtn.onclick = () => { overlay.classList.add('hidden'); };

// ===== Input =====
const keys = {};
addEventListener('keydown', e => keys[e.code] = true);
addEventListener('keyup',   e => keys[e.code] = false);

// ===== Core types =====
class Rect { constructor(x,y,w,h){ this.x=x; this.y=y; this.w=w; this.h=h; } }
const AABB = (a,b)=> a.x<b.x+b.w && a.x+a.w>b.x && a.y<b.y+b.h && a.y+a.h>b.y;

// ===== World =====
async function startLevel(url){
  level = await fetch(url).then(r=>r.json());
  game = resetState(level);
  btnStart.disabled = true;
  overlay.classList.add('hidden');
  lastT = performance.now();
  requestAnimationFrame(loop);
}

function resetState(level){
  return {
    dist: 0,
    speed: level.speed,
    grav:  level.gravity,
    lanesY: level.lanesY,
    player: {
      x: level.player.x,
      y: level.lanesY[level.player.lane] - 32,
      vy: 0,
      lane: level.player.lane,
      box: new Rect(0,0,28,30),
      state: 'run', // run|jump|slide
      lives: level.player.lives,
      invuln: 0
    },
    objects: level.objects.map(o=>({...o, hit:false})),
    score: 0,
    gateText: '—',
    ended: false,
  };
}

// ===== Loop =====
function loop(t){
  const dt = Math.min(0.016, (t-lastT)/1000); lastT = t;
  update(dt);
  render();
  if (!game.ended) requestAnimationFrame(loop);
}

function update(dt){
  if (!game) return;

  // Scroll forward
  game.dist += game.speed * dt;

  // Player input
  const p = game.player;
  if ((keys.Space||keys.KeyW||keys.ArrowUp) && p.state==='run'){ p.vy = -620; p.state='jump'; }
  if ((keys.KeyS||keys.ArrowDown) && p.state==='run'){ p.state='slide'; setTimeout(()=>{ if(p.state==='slide') p.state='run'; }, 350); }
  if ((keys.KeyA||keys.ArrowLeft) && p.state==='run'){ laneChange(-1); }
  if ((keys.KeyD||keys.ArrowRight) && p.state==='run'){ laneChange(+1); }

  // Gravity
  p.vy += game.grav * dt;
  p.y  += p.vy * dt;
  const groundY = game.lanesY[p.lane] - 32;
  if (p.y >= groundY){ p.y = groundY; p.vy=0; if (p.state==='jump') p.state='run'; }

  // Update HUD
  hudScore.textContent = game.score;
  hudLives.textContent = p.lives;
  hudGate.textContent  = game.gateText;

  // Collisions with objects whose x has reached player window
  const viewX = game.dist; // world scroll
  const px = p.x + viewX;  // player world X
  const pbox = new Rect(p.x-14, p.y-2, 28, p.state==='slide'? 18 : 30);

  for (const o of game.objects){
    if (o.hit) continue;
    if (Math.abs(o.x - px) > 60) continue;         // only near the player
    if (o.lane !== p.lane) continue;

    const obox = new Rect(o.x - viewX, game.lanesY[o.lane]-30, 26, 26);
    if (o.type==='shard'){
      if (AABB(pbox, obox)){ o.hit=true; game.score += 100; }
    } else if (o.type==='obst'){
      if (AABB(pbox, obox)){ onHit(); o.hit=true; }
    } else if (o.type==='gate'){
      // Trigger hack mini-game when close; here we stub with a simple keypress check
      if (AABB(pbox, obox)){
        o.hit=true;
        game.gateText = `Hack ${o.id}: A-D-S-W`;
        runHack(['KeyA','KeyD','KeyS','KeyW'], 2.5)
          .then(()=> game.gateText = 'Gate OPEN')
          .catch(()=> onHit());
      }
    } else if (o.type==='end'){
      if (AABB(pbox, obox)) return win();
    }
  }

  // End if we scrolled past level length without reaching end (fallback)
  if (game.dist >= level.length) win();
}

function laneChange(dir){
  const p = game.player;
  const next = Math.max(0, Math.min(game.lanesY.length-1, p.lane + dir));
  p.lane = next;
}

function onHit(){
  const p = game.player;
  if (p.invuln > 0) return;
  p.lives -= 1;
  p.invuln = 1.2;
  setTimeout(()=> p.invuln=0, 1200);
  if (p.lives <= 0) lose('You crashed. Try again.');
}

function win(){
  game.ended = true;
  overlay.classList.remove('hidden');
  ovTitle.textContent = 'Level Complete';
  ovMsg.textContent   = 'Safehouse reached. (Next: story screens)';
  btnStart.disabled = false;
}

function lose(msg){
  game.ended = true;
  overlay.classList.remove('hidden');
  ovTitle.textContent = 'Runner Down';
  ovMsg.textContent   = msg || 'Mission failed.';
  btnStart.disabled = false;
}

// ===== Render =====
function render(){
  if (!game) return;
  const viewX = game.dist;

  // Background (placeholder gradient + parallax stripe)
  const g = ctx.createLinearGradient(0,0,0,canvas.height);
  g.addColorStop(0,'#0a0f1e'); g.addColorStop(1,'#08101a');
  ctx.fillStyle=g; ctx.fillRect(0,0,canvas.width,canvas.height);
  // parallax hint
  ctx.fillStyle='#112238';
  const ox = - (viewX * 0.2 % canvas.width);
  ctx.fillRect(ox, 160, canvas.width, 8);
  ctx.fillRect(ox+canvas.width, 160, canvas.width, 8);

  // Lanes
  ctx.strokeStyle='#1f2b3a'; ctx.lineWidth=2;
  for (const y of game.lanesY){ ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(canvas.width,y); ctx.stroke(); }

  // Objects
  for (const o of game.objects){
    if (o.hit && o.type!=='end') continue;
    const x = o.x - viewX, y = game.lanesY[o.lane]-30;
    if (x < -80 || x > canvas.width+80) continue;
    if (o.type==='shard'){ drawDiamond(x+8,y+8,'#a0ff6a'); }
    if (o.type==='obst') { drawRect(x,y,26,26,'#ff5d5d'); }
    if (o.type==='gate') { drawRect(x-2,y-4,32,34,'#ff2ed1'); }
    if (o.type==='end')  { drawRect(x-8,y-8,42,42,'#00e5ff'); }
  }

  // Player
  const p = game.player;
  drawRect(p.x-14, p.y-2, 28, p.state==='slide'?18:30, p.invuln>0 ? '#ffc857' : '#46e1ff');
}

function drawRect(x,y,w,h,color){ ctx.fillStyle=color; ctx.fillRect(Math.round(x),Math.round(y),w,h); }
function drawDiamond(x,y,color){
  ctx.fillStyle=color;
  ctx.beginPath();
  ctx.moveTo(x,   y-6);
  ctx.lineTo(x+6, y);
  ctx.lineTo(x,   y+6);
  ctx.lineTo(x-6, y);
  ctx.closePath(); ctx.fill();
}

// ===== Gate hack (stub mini-game) =====
// Shows a tiny prompt in HUD; succeed if sequence entered before timer ends.
function runHack(seq, seconds){
  return new Promise((resolve,reject)=>{
    let i=0; game.gateText = `Hack: ${seq.join('-')} (${seconds.toFixed(1)}s)`;
    const t0 = performance.now();
    const onKey = (e)=>{
      if (e.code === seq[i]) { i++; game.gateText = `Hack: ${seq.slice(i).join('-')} (${Math.max(0, seconds-(performance.now()-t0)/1000).toFixed(1)}s)`; }
      if (i>=seq.length){ cleanup(); resolve(); }
    };
    function tick(){
      if (!cleanup.done){
        const t = (performance.now()-t0)/1000;
        if (t>=seconds){ cleanup(); reject(); }
        else requestAnimationFrame(tick);
      }
    }
    function cleanup(){ cleanup.done=true; removeEventListener('keydown', onKey); game.gateText='—'; }
    addEventListener('keydown', onKey);
    requestAnimationFrame(tick);
  });
}
