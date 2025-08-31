// Single source of truth for story/sector gates.
// Mirrors columns in schema: sector flags + story_flags JSON.
window.Progress = {
  flags: {
    heard_broadcast:false, spoke_broker:false, keycard_A:false, power_restored:false
  },
  sector: 1,
  has(k){ return this.flags[k] === true; },
  toJSON(){ return { sector: this.sector, story_flags: this.flags }; },
  fromJSON(o){ if (!o) return; this.sector = o.sector ?? this.sector; this.flags = {...this.flags, ...(o.story_flags||{})}; }
};

// Persist to localStorage for instant resume; also sync to PHP when convenient.
Progress.saveLocal = () => localStorage.setItem('progress_flags', JSON.stringify(Progress.toJSON()));
Progress.loadLocal = () => {
  const s = localStorage.getItem('progress_flags'); if (!s) return;
  try { Progress.fromJSON(JSON.parse(s)); } catch {}
};
