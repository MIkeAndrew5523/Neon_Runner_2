// Story beats that naturally funnel the player to the Substation/circuit mini-game
window.S1 = window.S1 || {};

S1.applyTriggers = (player) => {
  if (!Progress.flags.heard_broadcast && player.x > 200){
    Progress.flags.heard_broadcast = true; Progress.saveLocal();
    EventBus.emit('dialogue:open','radio_broadcast_01');
  }
  EventBus.on('nav:goto', (area) => {
    if (area === 'substation_A'){
      // Push your existing mini-game state; your FSM handles it.
      EventBus.emit('state:push','circuit_patch',{returnTo:'sector1'});
    }
  });
};

// Call this from circuitPatch.js on success:
window.onCircuitSolved = () => {
  Progress.flags.power_restored = true; Progress.saveLocal();
  EventBus.emit('world:power_restored');
  EventBus.emit('state:pop'); // back to sector1
  EventBus.emit('toast','Power rerouted. Sector rebooting…');
};
