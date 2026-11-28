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
// the equipment panel: one box per body slot with an icon, what's in it and what it does
const SLOT_ORDER=["weapon","armour","head","neck","cloak","hands","wrists","ring","feet","held"];
const SLOT_LABEL={weapon:"Weapon rune",armour:"Armour rune",head:"Head",neck:"Neck",cloak:"Cloak",hands:"Hands",wrists:"Wrists",ring:"Ring",feet:"Feet",held:"Held"};
function fxText(it){const f=it.fx||{};const out=[];if(f.ac)out.push(`${f.ac>0?"+":""}${f.ac} AC`);if(f.save)out.push(`${f.save>0?"+":""}${f.save} saves`);if(f.hit)out.push(`+${f.hit} to hit`);if(f.dmg)out.push(`+${f.dmg} damage`);
  if(f.rdmg)out.push(`+${f.rdmg} ranged damage`);if(f.speed)out.push(`${f.speed>0?"+":""}${f.speed} speed`);if(f.thieves)out.push(`+${f.thieves} lockpicking`);if(f.stealth)out.push("stealth advantage");
  for(const k of Object.keys(f))if(k.startsWith("set"))out.push(`${k.slice(3).toUpperCase()} ${f[k]}`);if(f.periapt)out.push("stable when downed");if(f.wand)out.push("Magic Missile charges");return out.join(" · ")||it.desc;}
const GEAR_ICONS={feet:x=>{x.fillStyle="#1a1216";x.fillRect(3,4,6,10);x.fillRect(3,11,11,4);x.fillStyle="#7a5030";x.fillRect(4,5,4,8);x.fillRect(4,12,9,2);},
  ring:x=>{x.fillStyle="#d8b040";x.fillRect(5,5,6,1);x.fillRect(5,11,6,1);x.fillRect(4,6,1,5);x.fillRect(11,6,1,5);x.fillStyle="#8ae0ff";x.fillRect(7,3,2,2);},
  cloak:x=>{x.fillStyle="#1a1216";x.fillRect(4,2,8,13);x.fillRect(3,8,10,7);x.fillStyle="#3a6a4a";x.fillRect(5,3,6,11);x.fillRect(4,9,8,5);x.fillStyle="#d8b040";x.fillRect(7,3,2,1);},
  hands:x=>{x.fillStyle="#1a1216";x.fillRect(4,3,8,11);x.fillStyle="#9a8a7a";x.fillRect(5,4,6,9);x.fillStyle="#6a5a4a";for(let i=0;i<4;i++)x.fillRect(5+i*2-(i?1:0)+1,4,1,4);},
  head:x=>{x.fillStyle="#c8ccd4";x.fillRect(3,7,10,2);x.fillStyle="#8ae0ff";x.fillRect(7,5,2,2);x.fillStyle="#8a929c";x.fillRect(3,9,10,1);},
  neck:x=>{x.fillStyle="#d8b040";x.fillRect(4,2,1,6);x.fillRect(11,2,1,6);x.fillRect(5,8,1,1);x.fillRect(10,8,1,1);x.fillRect(6,9,4,1);x.fillStyle="#d04050";x.fillRect(6,10,4,4);},
  wrists:x=>{x.fillStyle="#1a1216";x.fillRect(3,4,10,8);x.fillStyle="#8a5a30";x.fillRect(4,5,8,6);x.fillStyle="#d8b040";x.fillRect(4,7,8,1);},
  held:x=>{x.fillStyle="#6a4428";x.fillRect(4,11,8,2);x.fillRect(5,10,6,1);x.fillStyle="#d8c8a0";x.fillRect(7,2,2,9);x.fillStyle="#c8a0ff";x.fillRect(7,1,2,2);},
  weapon:x=>{x.fillStyle="#5a5a64";x.fillRect(3,4,10,9);x.fillStyle="#8ae0ff";x.fillRect(6,6,4,1);x.fillRect(7,7,2,3);},
  armour:x=>{x.fillStyle="#5a5a64";x.fillRect(3,4,10,9);x.fillStyle="#8ae0ff";x.fillRect(5,6,6,1);x.fillRect(5,6,1,4);x.fillRect(10,6,1,4);x.fillRect(5,10,6,1);}};
function slotIcon(id,draw){const c=document.createElement("canvas");c.width=c.height=16;c.className="gicon";try{const x=c.getContext("2d");if(id&&ITEMS[id]&&ITEMS[id].kind==="gear"&&GEAR_ICONS[slotOf(id)])GEAR_ICONS[slotOf(id)](x);else if(id)drawIconTo(c,id);else if(draw)draw(x);}catch(e){}return c;}
const ICON_SWORD=x=>{x.fillStyle="#1a1216";x.fillRect(7,1,3,12);x.fillStyle="#b8c0c8";x.fillRect(8,1,1,10);x.fillStyle="#6a4428";x.fillRect(5,11,7,2);x.fillRect(8,13,1,3);};
const ICON_ARMOUR=x=>{x.fillStyle="#1a1216";x.fillRect(3,2,10,13);x.fillStyle="#8a929c";x.fillRect(4,3,8,11);x.fillStyle="#b8c0c8";x.fillRect(4,3,8,2);x.fillStyle="#5a626c";x.fillRect(7,5,2,9);};
const ICON_SHIELD=x=>{x.fillStyle="#1a1216";x.fillRect(3,2,10,12);x.fillRect(5,14,6,1);x.fillStyle="#7a5030";x.fillRect(4,3,8,10);x.fillStyle="#b8c0c8";x.fillRect(7,3,2,10);x.fillRect(4,7,8,2);};
function renderGear(el,h,withWear){const box=document.createElement("div");box.className="gearlist";
  box.insertAdjacentHTML("beforeend",`<h3>EQUIPMENT <span class="sm">${h.gear.length}/${MAX_ATTUNED} magic items attuned</span></h3>`);
  const grid=document.createElement("div");grid.className="slotgrid";box.appendChild(grid);
  const tile=(label,icon,name,info,cls,onTap)=>{const b=document.createElement(onTap?"button":"div");if(onTap)b.type="button";b.className="gtile "+(cls||"");b.appendChild(icon);
    const t=document.createElement("div");t.className="gtxt";t.innerHTML=`<span class="slotname">${label}</span><b>${esc(name)}</b>${info?`<small>${esc(info)}</small>`:""}`;b.appendChild(t);if(onTap)b.addEventListener("click",onTap);grid.appendChild(b);};
  // what they fight with
  const mw=weaponOf(h,"main"),aw=h.info.alt&&!h.info.alt.save?weaponOf(h,"alt"):null;
  if(h.wpn){registerWeapon(h.wpn);const p=parseWeapon(h.wpn);tile("Wielding",slotIcon(h.wpn),ITEMS[h.wpn].name,`${ITEMS[h.wpn].desc.split(" · ")[0]}${proficientWith(h,p.key)?"":" · NOT TRAINED: no proficiency bonus"} · tap to unequip`,"",()=>{unequipWeapon(h);renderMenu();});}
  else tile("Wielding",slotIcon(null,ICON_SWORD),mw.name,`${mw.dice} ${mw.type}${aw?" · also "+aw.name:""}`,"base");
  // armour and shield
  tile("Body",slotIcon(null,ICON_ARMOUR),h.armourOff?"Armour off":h.info.armour==="heavy"?"Heavy armour":h.info.armour==="medium"?"Medium armour":h.info.armour==="none"?"No armour":"Light armour",`AC ${acOf(h)}`,"base");
  if(SHIELD_USERS.includes(h.id))tile("Shield",slotIcon(null,ICON_SHIELD),h.shieldBroken?"Shield (BROKEN)":"Shield",h.shieldBroken?"−2 AC until repaired":"+2 AC (in the AC above)","base");
  // magic item slots
  for(const s of SLOT_ORDER){const id=gearInSlot(h,s);if(!id){tile(SLOT_LABEL[s],slotIcon(null,x=>{x.strokeStyle="rgba(200,220,220,.25)";x.strokeRect(2.5,2.5,11,11);}),"—","","empty");continue;}
    const it=ITEMS[id];const pend=isPending(h,id);const known=isKnown(id);
    tile(SLOT_LABEL[s],slotIcon(id),known?it.name:it.unk||it.name,pend?"Not attuned yet: rest to make it work":known?fxText(it):"Unidentified",`${pend?"pend":""}${it.cursed&&known?" cursed":""}`,()=>{const why=removeItem(h,id);if(why)alertMenu(why);else renderMenu();});}
  // the totals
  const fx=gearFx(h);const tot=[`AC ${acOf(h)}`,`Attack ${(atkBonus(h,mw)>=0?"+":"")+atkBonus(h,mw)} (${mw.name})`,`Speed ${speedOf(h)}`];if(fx.save)tot.push(`${fx.save>0?"+":""}${fx.save} to all saves`);
  box.insertAdjacentHTML("beforeend",`<p class="help gtot">${tot.map(esc).join(" · ")}</p>`);
  if(withWear){const bagGear=Object.keys(G.bag).filter(id=>G.bag[id]>0&&ITEMS[id]&&ITEMS[id].kind==="gear");
    for(const id of bagGear){const why=wearBlock(h,id);const b=document.createElement("button");b.type="button";b.className="big alt";
      b.innerHTML=`PUT ON: ${esc(isKnown(id)?ITEMS[id].name:ITEMS[id].unk||ITEMS[id].name)}<br><small>${esc(SLOT_LABEL[slotOf(id)])} slot${why?" · "+esc(why):" · works after a rest"}</small>`;b.disabled=!!why;
      b.addEventListener("click",()=>{const msg=wearItem(h,id);renderMenu();hud();alertMenu(msg);});box.appendChild(b);}}
  el.appendChild(box);}
