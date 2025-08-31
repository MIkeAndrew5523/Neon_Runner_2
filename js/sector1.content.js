// Content definition: items/NPCs/hazards/gate for Sector 1
window.S1 = window.S1 || {};
S1.EntityType = { ITEM:'item', NPC:'npc', HAZARD:'hazard', GATE:'gate' };

S1.entities = [
  { id:'credits_01', type:'item', x:120, y:220, sprite:'spr_credit', kind:'credit', amount:15, taken:false },
  { id:'keycard_A',  type:'item', x:420, y:180, sprite:'spr_keycard', kind:'keycard_A', taken:false },

  { id:'broker', type:'npc', x:320, y:260, sprite:'spr_broker', dialogueId:'dlg_broker_intro' },

  { id:'steam1', type:'hazard', x:220, y:140, w:48, h:48, pattern:{type:'timed', onMs:700, offMs:900}, t:0, active:false, damage:8 },

  { id:'substation_gate', type:'gate', x:640, y:160, w:48, h:64, requires:['keycard_A'], leadsTo:'substation_A', locked:true }
];

// Very light dialogue block; use your overlay to render when EventBus emits "dialogue:open".
S1.DLG = {
  dlg_broker_intro: [
    {speaker:'Broker', text:"Sector’s dark. Doors are dead. Maintenance keeps keycards."},
    {speaker:'Broker', text:"Find Substation A and patch the circuit. Move fast when power returns."}
  ],
  radio_broadcast_01: [
    {speaker:'Radio', text:"[Emergency] Power loss in Sector 1. Movement near Substation A..."}
  ]
};
