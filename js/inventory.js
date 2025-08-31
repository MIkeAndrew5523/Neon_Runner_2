window.Inventory = {
  map: {}, // { item_key: qty }
  add(key, qty=1){ this.map[key] = (this.map[key]||0)+qty; this._saveLocal(); },
  has(key){ return (this.map[key]||0) > 0; },
  take(key, qty=1){ if(!this.has(key)) return false; this.map[key]-=qty; this._saveLocal(); return true; },
  _saveLocal(){ localStorage.setItem('inv', JSON.stringify(this.map)); },
  _loadLocal(){ const s = localStorage.getItem('inv'); if (s) this.map = JSON.parse(s); }
};
Inventory._loadLocal();
