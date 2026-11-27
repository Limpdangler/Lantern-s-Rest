// ================= magic gear: one item per body slot, up to 3 attuned, and attuning takes a rest =================
const GEAR_SLOTS={weapon:"Weapon",armour:"Armour",head:"Head",neck:"Neck",cloak:"Cloak",hands:"Hands",wrists:"Wrists",ring:"Ring",feet:"Feet",held:"Held"};
const SLOT_OF={wrune1:"weapon",wrune2:"weapon",arune:"armour",ring:"ring",ringcurse:"ring",cloak:"cloak",cloakcurse:"cloak",boots:"feet",gauntlets:"hands",gloves:"hands",
  headband:"head",amulet:"neck",periapt:"neck",bracers:"wrists",wand:"held"};
const MAX_ATTUNED=3;
const slotOf=id=>SLOT_OF[id]||"held";
const isPending=(h,id)=>!!(h.pending&&h.pending.includes(id));
function gearInSlot(h,slot){return h.gear.find(id=>slotOf(id)===slot)||null;}
// why this hero can't put the item on right now (or null if they can)
function wearBlock(h,id){const s=slotOf(id);const cur=gearInSlot(h,s);if(cur)return `Already wearing ${ITEMS[cur].name} (${GEAR_SLOTS[s]}). Take it off first.`;
  if(h.gear.length>=MAX_ATTUNED)return `Can only be attuned to ${MAX_ATTUNED} magic items at once.`;return null;}
function wearItem(h,id){const why=wearBlock(h,id);if(why)return why;takeItem(id);h.gear.push(id);h.pending=(h.pending||[]).concat([id]);
  return `${h.name} puts on the ${isKnown(id)?ITEMS[id].name:ITEMS[id].unk||ITEMS[id].name}. It will only work once they've rested with it (a short or long rest attunes it).`;}
function removeItem(h,id){if(ITEMS[id].cursed&&!isPending(h,id))return `The ${ITEMS[id].name} won't come off! Pray at a shrine to lift the curse.`;
  h.gear=h.gear.filter(x=>x!==id);if(h.pending)h.pending=h.pending.filter(x=>x!==id);addItem(id);if(id==="wand")h.wand=0;applyLevel(h,false);h.hp=Math.min(h.hp,h.maxHp);hud();return null;}
// called at the end of every rest
function attuneAll(){const lines=[];for(const h of G.party){if(h.dead||!h.pending||!h.pending.length)continue;
  for(const id of h.pending){const was=isKnown(id);G.known.add(id);if(id==="wand")h.wand=3;
    lines.push(ITEMS[id].cursed?`${h.name} attunes to the ${was?ITEMS[id].name:ITEMS[id].unk}... and feels a chill. It's a ${ITEMS[id].name}! CURSED: it won't come off.`:`${h.name} attunes to the ${was?ITEMS[id].name:ITEMS[id].unk}${was?"":`: it's ${aN(ITEMS[id].name)}!`} (${ITEMS[id].desc})`);}
  h.pending=[];applyLevel(h,false);}
  return lines;}
{const base=gearFx;gearFx=h=>{if(!h.pending||!h.pending.length)return base(h);const keep=h.gear;h.gear=h.gear.filter(id=>!h.pending.includes(id));try{return base(h);}finally{h.gear=keep;}};}
{const base=shortRest;shortRest=async function(){await base();const l=attuneAll();if(l.length)await say(l.join(" "),1800,true);};}
{const base=applyLongRest;applyLongRest=async camp=>{const out=await base(camp);return out.concat(attuneAll());};}
// the list of worn gear (character card and full sheet)
function renderGear(el,h,withWear){const box=document.createElement("div");box.className="gearlist";
  box.insertAdjacentHTML("beforeend",`<h3>EQUIPPED GEAR <span class="sm">${h.gear.length}/${MAX_ATTUNED} attunement</span></h3>`);
  box.insertAdjacentHTML("beforeend",`<p class="help gearbase">Always: ${esc(weaponOf(h,"main").name)}${h.info.alt&&!h.info.alt.save?" + "+esc(weaponOf(h,"alt").name):""} · ${h.info.armour==="heavy"?"heavy armour":h.info.armour==="none"?"no armour":h.info.armour==="medium"?"medium armour":"light armour"}${SHIELD_USERS.includes(h.id)?(h.shieldBroken?" · shield BROKEN":" · shield"):""}${h.armourOff?" (taken off)":""}</p>`);
  if(!h.gear.length)box.insertAdjacentHTML("beforeend",`<p class="help">No magic items worn.</p>`);
  for(const id of h.gear){const it=ITEMS[id];const pend=isPending(h,id);const nm=isKnown(id)?it.name:it.unk||it.name;const b=document.createElement("button");b.type="button";b.className="gslot"+(pend?" pend":"");
    b.innerHTML=`<span class="slotname">${GEAR_SLOTS[slotOf(id)]}</span><b>${esc(nm)}</b><small>${pend?"Not attuned yet: rest to make it work":isKnown(id)?esc(it.desc):""} · ${it.cursed&&!pend?"cursed: it won't come off":"tap to take off"}</small>`;
    b.addEventListener("click",()=>{const why=removeItem(h,id);if(why)alertMenu(why);else renderMenu();});box.appendChild(b);}
  if(withWear){const bagGear=Object.keys(G.bag).filter(id=>G.bag[id]>0&&ITEMS[id]&&ITEMS[id].kind==="gear");
    for(const id of bagGear){const why=wearBlock(h,id);const b=document.createElement("button");b.type="button";b.className="big alt";
      b.innerHTML=`PUT ON: ${esc(isKnown(id)?ITEMS[id].name:ITEMS[id].unk||ITEMS[id].name)}<br><small>${esc(GEAR_SLOTS[slotOf(id)])}${why?" · "+esc(why):" · works after a rest"}</small>`;b.disabled=!!why;
      b.addEventListener("click",()=>{const msg=wearItem(h,id);renderMenu();hud();alertMenu(msg);});box.appendChild(b);}}
  el.appendChild(box);}
