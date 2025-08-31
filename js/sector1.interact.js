// Movement-agnostic interaction loop; call from states/sector1.js update()
window.S1 = window.S1 || {};
const _near = (a,b,r)=> (a.x-b.x)**2 + (a.y-b.y)**2 <= r*r;
const _over = (a,b)=> Math.abs(a.x-b.x) < 24 && Math.abs(a.y-b.y) < 24;

function _tickHazard(h, dt){
  h.t += dt;
  if (h.pattern?.type === 'timed'){
    const cycle = h.pattern.onMs + h.pattern.offMs;
    h.active = ((h.t % cycle) < h.pattern.onMs);
  } else { h.active = true; }
}

S1.handleInteractions = (player, entities, dt) => {
  for (const e of entities){
    if (e.type === 'item' && !e.taken && _over(player,e)){
      e.taken = true; Inventory.add(e.kind, e.amount ?? 1);
      if (e.kind === 'keycard_A') Progress.flags.keycard_A = true;
      EventBus.emit('toast', `Picked up ${e.kind}`);
      Progress.saveLocal();
    }
    if (e.type === 'npc' && player.interact && _near(player,e,28)){
      EventBus.emit('dialogue:open', e.dialogueId);
      Progress.flags.spoke_broker = true; Progress.saveLocal();
    }
    if (e.type === 'hazard'){
      _tickHazard(e, dt);
      if (e.active && _over(player,e)) player.hp = Math.max(1, player.hp - 1);
    }
    if (e.type === 'gate' && player.interact && _near(player,e,22)){
      const ok = (e.requires||[]).every(r => Progress.has(r) || Inventory.has(r));
      if (!ok) EventBus.emit('toast','Access denied: missing requirement.');
      else { e.locked=false; EventBus.emit('toast','Gate unlocked.'); EventBus.emit('nav:goto', e.leadsTo); }
    }
  }
};
