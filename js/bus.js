// Minimal event bus (decouples states/overlays/net)
window.EventBus = (() => {
  const map = new Map();
  return {
    on(ev, fn){ if(!map.has(ev)) map.set(ev, []); map.get(ev).push(fn); },
    emit(ev, payload){ (map.get(ev)||[]).forEach(fn => fn(payload)); }
  };
})();
