window.UI = window.UI || {};
UI.Quest = {
  steps: [
    {id:'find_maint', label:'Find Maintenance (North Walkway)', done:false},
    {id:'get_keycard', label:'Acquire Keycard A', done:false},
    {id:'reach_sub', label:'Reach Substation A', done:false},
    {id:'patch', label:'Patch the Circuit', done:false},
  ],
  update(){
    this.steps[0].done = Progress.flags.heard_broadcast;
    this.steps[1].done = Progress.flags.keycard_A;
    this.steps[3].done = Progress.flags.power_restored;
  },
  draw(ctx){
    this.update();
    const x = 720, y = 14;
    ctx.save(); ctx.globalAlpha = 0.9;
    ctx.fillStyle = 'rgba(8,12,22,0.7)'; ctx.fillRect(x-10,y-10,230,110);
    ctx.fillStyle = '#9fe8ff'; ctx.fillText('Sector 1 Objectives', x, y);
    ctx.fillStyle = '#e6f0ff';
    let yy = y+16;
    for (const s of this.steps){
      const mark = s.done ? '✔ ' : '• ';
      ctx.fillText(mark + s.label, x, (yy+=16));
    }
    ctx.restore();
  }
};
