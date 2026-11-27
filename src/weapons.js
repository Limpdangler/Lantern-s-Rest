// ================= weapons you can find: common ones, +1/+2 and special ones, and who is trained to use them =================
// name, damage, type, cat (simple/martial), wt (pack weight), price (gold), and properties
const WEAPONS={
  club:{name:"Club",dice:"1d4",type:"bludgeoning",cat:"simple",wt:1,price:1},
  dagger:{name:"Dagger",dice:"1d4",type:"piercing",cat:"simple",wt:1,price:2,finesse:true,thrown:4},
  greatclub:{name:"Greatclub",dice:"1d8",type:"bludgeoning",cat:"simple",wt:3,price:1},
  handaxe:{name:"Handaxe",dice:"1d6",type:"slashing",cat:"simple",wt:2,price:5,thrown:4},
  javelin:{name:"Javelin",dice:"1d6",type:"piercing",cat:"simple",wt:2,price:1,thrown:6},
  mace:{name:"Mace",dice:"1d6",type:"bludgeoning",cat:"simple",wt:2,price:5},
  quarterstaff:{name:"Quarterstaff",dice:"1d6",type:"bludgeoning",cat:"simple",wt:2,price:1},
  sickle:{name:"Sickle",dice:"1d4",type:"slashing",cat:"simple",wt:1,price:1},
  spear:{name:"Spear",dice:"1d6",type:"piercing",cat:"simple",wt:2,price:1,thrown:4},
  lightcrossbow:{name:"Light Crossbow",dice:"1d8",type:"piercing",cat:"simple",wt:3,price:25,ranged:16,dex:true},
  shortbow:{name:"Shortbow",dice:"1d6",type:"piercing",cat:"simple",wt:2,price:25,ranged:16,dex:true},
  sling:{name:"Sling",dice:"1d4",type:"bludgeoning",cat:"simple",wt:0.5,price:1,ranged:6,dex:true},
  battleaxe:{name:"Battleaxe",dice:"1d8",type:"slashing",cat:"martial",wt:3,price:10},
  flail:{name:"Flail",dice:"1d8",type:"bludgeoning",cat:"martial",wt:2,price:10},
  glaive:{name:"Glaive",dice:"1d10",type:"slashing",cat:"martial",wt:4,price:20,reach:true},
  greataxe:{name:"Greataxe",dice:"1d12",type:"slashing",cat:"martial",wt:4,price:30},
  greatsword:{name:"Greatsword",dice:"2d6",type:"slashing",cat:"martial",wt:4,price:50},
  halberd:{name:"Halberd",dice:"1d10",type:"slashing",cat:"martial",wt:4,price:20,reach:true},
  longsword:{name:"Longsword",dice:"1d8",type:"slashing",cat:"martial",wt:2,price:15},
  maul:{name:"Maul",dice:"2d6",type:"bludgeoning",cat:"martial",wt:5,price:10},
  morningstar:{name:"Morningstar",dice:"1d8",type:"piercing",cat:"martial",wt:3,price:15},
  pike:{name:"Pike",dice:"1d10",type:"piercing",cat:"martial",wt:5,price:5,reach:true},
  rapier:{name:"Rapier",dice:"1d8",type:"piercing",cat:"martial",wt:1,price:25,finesse:true},
  scimitar:{name:"Scimitar",dice:"1d6",type:"slashing",cat:"martial",wt:1,price:25,finesse:true},
  shortsword:{name:"Shortsword",dice:"1d6",type:"piercing",cat:"martial",wt:1,price:10,finesse:true},
  trident:{name:"Trident",dice:"1d6",type:"piercing",cat:"martial",wt:2,price:5,thrown:4},
  warhammer:{name:"Warhammer",dice:"1d8",type:"bludgeoning",cat:"martial",wt:2,price:15},
  whip:{name:"Whip",dice:"1d4",type:"slashing",cat:"martial",wt:1,price:2,finesse:true,reach:true},
  handcrossbow:{name:"Hand Crossbow",dice:"1d6",type:"piercing",cat:"martial",wt:1,price:75,ranged:6,dex:true},
  heavycrossbow:{name:"Heavy Crossbow",dice:"1d10",type:"piercing",cat:"martial",wt:4,price:50,ranged:20,dex:true},
  longbow:{name:"Longbow",dice:"1d8",type:"piercing",cat:"martial",wt:2,price:50,ranged:20,dex:true}};
const WSPECIAL={flaming:{name:"Flaming",desc:"wreathed in fire: +1d6 fire damage on a hit"},frost:{name:"Frost",desc:"rimed with ice: a hit slows the target"},vampiric:{name:"Vampiric",desc:"drinks blood: a hit heals you 1d4"}};
// who is trained with what
const WPROF={fighter:"all",barbarian:"all",paladin:"all",ranger:"all",rogue:["simple","handcrossbow","longsword","rapier","shortsword"],monk:["simple","shortsword"],cleric:["simple"],
  druid:["club","dagger","javelin","mace","quarterstaff","scimitar","sickle","sling","spear"],wizard:["dagger","quarterstaff","lightcrossbow","sling"]};
function proficientWith(h,key){const p=WPROF[h.id];if(!p)return true;if(p==="all")return true;const W=WEAPONS[key];return p.includes(key)||p.includes(W.cat);}
// item ids look like w_longsword, w_longsword_p1, w_longsword_p2_flaming
function parseWeapon(id){const m=/^w_([a-z]+)(?:_p(\d))?(?:_([a-z]+))?$/.exec(id||"");if(!m||!WEAPONS[m[1]])return null;return {key:m[1],plus:+(m[2]||0),special:m[3]||null};}
function registerWeapon(id){if(ITEMS[id])return ITEMS[id];const p=parseWeapon(id);if(!p)return null;const W=WEAPONS[p.key];const magic=p.plus||p.special;
  const name=`${p.special?WSPECIAL[p.special].name+" ":""}${W.name}${p.plus?" +"+p.plus:""}`;
  const props=[W.cat==="simple"?"simple":"martial",W.finesse?"finesse":"",W.reach?"reach (hits 2 squares away)":"",W.thrown?`can be thrown (range ${W.thrown})`:"",W.ranged?`ranged (${W.ranged})${/bow/i.test(W.name)?", uses arrows":""}`:""].filter(Boolean).join(", ");
  ITEMS[id]={name,kind:"weapon",price:magic?(p.plus>=2?800:p.plus?250:0)+(p.special?150:0):W.price,floor:99,w:0,wt:W.wt,
    desc:`${W.dice}${p.plus?"+"+p.plus:""} ${W.type} · ${props}${p.plus?` · +${p.plus} to hit and damage`:""}${p.special?" · "+WSPECIAL[p.special].desc:""}${magic?"":" · (common)"}`};return ITEMS[id];}
// saved games: make sure every weapon in the bag or in a hand is known again
function registerAllWeapons(){if(!G)return;for(const id of Object.keys(G.bag||{}))registerWeapon(id);for(const h of G.party||[])if(h.wpn)registerWeapon(h.wpn);}
function randomWeaponId(magic){const keys=Object.keys(WEAPONS);const k=pick(keys);if(!magic)return "w_"+k;const plus=Math.random()<.1?2:1;const sp=Math.random()<.35?pick(Object.keys(WSPECIAL)):null;
  const id=`w_${k}_p${plus}${sp?"_"+sp:""}`;registerWeapon(id);return id;}
// a weapon in someone's hands
function weaponFromItem(h,id){const p=parseWeapon(id);if(!p)return null;registerWeapon(id);const W=WEAPONS[p.key];const prof=proficientWith(h,p.key);
  const range=W.ranged||(W.thrown&&false)||1;return {name:ITEMS[id].name,abil:W.dex?"dex":"str",dice:W.dice,type:W.type,range,melee:!W.ranged,finesse:!!W.finesse,reach:W.reach?2:undefined,
    plus:p.plus,special:p.special,noProf:!prof,found:id};}
const castsMain=h=>!!(h.info&&h.info.atk&&h.info.atk.spell);
{const base=weaponOf;weaponOf=function(u,which){if(u&&u.side==="h"&&u.wpn&&!u.wild&&((which||"main")===(castsMain(u)?"alt":"main"))){const w=weaponFromItem(u,u.wpn);if(w)return w;}return base(u,which);};}
// special weapon effects
effect("specialWeapons","Flaming, Frost and Vampiric weapons",{onHit:async c=>{const s=c.w&&c.w.special;if(!s||!c.t)return;
  if(s==="flaming"){const d=roll("1d6").total;c.total+=d;if(c.parts)c.parts.push(`${d} fire`);}
  else if(s==="frost"){if(c.t.side==="m"){c.t.st.slowed=2;float(c.t,"SLOWED","#a8e0ff");}}
  else if(s==="vampiric"){const d=roll("1d4").total;heal(c.a,d);float(c.a,"+"+d,"#8aff7a");}}});
// equipping from the bag
function equipWeapon(h,id){registerWeapon(id);if(h.wpn)addItem(h.wpn);takeItem(id);h.wpn=id;applyLevel(h,false);hud();
  const p=parseWeapon(id);return proficientWith(h,p.key)?`The ${h.name} takes up the ${ITEMS[id].name}.`:`The ${h.name} takes up the ${ITEMS[id].name}, but isn't trained with it: no proficiency bonus on attacks with it.`;}
function unequipWeapon(h){if(!h.wpn)return;addItem(h.wpn);h.wpn=null;hud();}
// ---------- where weapons turn up ----------
const CORPSE_WEAPONS={goblin:["scimitar","shortbow"],archer:["shortbow","scimitar"],goblinboss:["scimitar","javelin"],kobold:["dagger","sling","spear"],orc:["greataxe","javelin"],skeleton:["shortsword","shortbow"],bonearcher:["shortbow"],
  fighter:["longsword","greatsword","halberd"],rogue:["rapier","dagger","shortsword","handcrossbow"],ranger:["longbow","shortsword"],cleric:["mace","warhammer"],wizard:["quarterstaff","dagger"],barbarian:["greataxe","maul"],paladin:["longsword","glaive"],monk:["quarterstaff","spear"]};
{const base=makeCorpse;makeCorpse=function(m){base(m);const c=G.corpses[G.corpses.length-1];if(!c||!c.loot)return;const opts=CORPSE_WEAPONS[m.key]||(m.cls&&CORPSE_WEAPONS[m.cls]);
  if(opts&&Math.random()<.35){const id="w_"+pick(opts);registerWeapon(id);c.loot.items.push(id);}};}
{const base=rollLoot;rollLoot=function(rich){const L=base(rich);if(Math.random()<.22){const id="w_"+pick(Object.keys(WEAPONS));registerWeapon(id);L.items.push(id);}return L;};}
// magic weapons: not every floor. Roughly one floor in three hides one, in a rich chest or a vault
{const base=placeDressing;placeDressing=function(){base();if(G.demo)return;const chests=G.objs.filter(o=>o.type==="chest"&&!o.mimic&&o.loot);
  if(chests.length&&Math.random()<.33){const best=chests.find(o=>o.vault)||chests.find(o=>o.locked)||pick(chests);best.loot.items.push(randomWeaponId(true));}};}
// common weapons are heavy and cheap: ask before picking one up
async function offerCommon(ids,where){const kept=[];for(const id of ids){registerWeapon(id);const it=ITEMS[id];
    const c=await choose(`${where}: ${aN(it.name.toLowerCase())} (common). ${it.desc}. Worth about ${Math.max(1,Math.floor(it.price/2))} gold to a merchant. Weighs ${it.wt}. Pack: ${packLoad()}/${packCap()}.`,[{t:"TAKE IT"},{t:"LEAVE IT"}]);
    if(c===0){addItem(id);kept.push(it.name);}}$("tBox").hidden=true;hud();return kept;}
const isCommonWeapon=id=>{const p=parseWeapon(id);return !!(p&&!p.plus&&!p.special);};
{const base=chestLoot;chestLoot=async function(o,brk){const common=(o.loot.items||[]).filter(isCommonWeapon);o.loot.items=(o.loot.items||[]).filter(id=>!isCommonWeapon(id));for(const id of o.loot.items)if(parseWeapon(id))registerWeapon(id);
  await base(o,brk);if(common.length)await offerCommon(common,"There's also");};}
{const base=corpseInteract;corpseInteract=async function(c){const before=c.searched;const common=c.loot?(c.loot.items||[]).filter(isCommonWeapon):[];if(c.loot)c.loot.items=c.loot.items.filter(id=>!isCommonWeapon(id));
  await base(c);if(!before&&c.searched&&common.length)await offerCommon(common,"The body also has");else if(!c.searched&&common.length&&c.loot)c.loot.items.push(...common);};}
// the bag shows equip buttons for weapons; the character card shows what each hero is holding
{const base=renderMenu;renderMenu=function(...a){registerAllWeapons();const r=base(...a);try{if(menuTab==="bag"){const items=[...document.querySelectorAll("#menuBody .item")];
    for(const d of items){const name=(d.querySelector("b")||{}).textContent||"";const id=Object.keys(G.bag).find(k=>ITEMS[k]&&ITEMS[k].kind==="weapon"&&name.startsWith(ITEMS[k].name+" ×"));if(!id)continue;
      const acts=d.querySelector(".acts")||d;const p=parseWeapon(id);
      for(const h of G.party.filter(h=>!h.dead&&h.id!=="beast")){const b=document.createElement("button");b.type="button";b.className="chip";const pro=proficientWith(h,p.key);
        b.textContent=`EQUIP: ${h.name.toUpperCase()}${pro?"":" (not trained: no proficiency bonus)"}`;b.addEventListener("click",()=>{const msg=equipWeapon(h,id);renderMenu();alertMenu(msg);});acts.appendChild(b);}}}}catch(e){console.warn(e);}return r;};}
function heldWeaponLine(h){if(!h.wpn)return "";registerWeapon(h.wpn);const p=parseWeapon(h.wpn);return `Holding: ${ITEMS[h.wpn].name}${proficientWith(h,p.key)?"":" (not trained: no proficiency bonus)"}${castsMain(h)?" (as their second weapon)":""}`;}
{const base=renderGear;renderGear=function(el,h,withWear){base(el,h,withWear);if(!h.wpn)return;const box=el.lastElementChild;const b=document.createElement("button");b.type="button";b.className="gslot";
  b.innerHTML=`<span class="slotname">Weapon</span><b>${esc(ITEMS[h.wpn].name)}</b><small>${esc(heldWeaponLine(h))} · tap to put it back in the bag</small>`;b.addEventListener("click",()=>{unequipWeapon(h);renderMenu();});(box||el).appendChild(b);};}
// loading a save
{const base=unpackRun;unpackRun=function(...a){const r=base(...a);try{registerAllWeapons();}catch(e){}return r;};}
// weapon icons in the bag and shop
{const base=drawIconTo;drawIconTo=function(canvas,id){const p=parseWeapon(id);if(!p)return base(canvas,id);const x=canvas.getContext("2d");const W=WEAPONS[p.key];const metal=p.special==="flaming"?"#ff9a3a":p.special==="frost"?"#a8e0ff":p.special==="vampiric"?"#d04050":p.plus?"#e8d070":"#b8c0c8";
  x.fillStyle="#1a1216";if(W.ranged){x.fillRect(4,2,2,12);x.fillStyle="#8a5a30";x.fillRect(5,2,1,12);x.fillStyle="#e8e0d0";x.fillRect(9,3,1,10);x.fillStyle=metal;x.fillRect(6,7,6,1);}
  else{x.fillRect(7,1,3,12);x.fillStyle=metal;x.fillRect(8,1,1,10);x.fillStyle="#6a4428";x.fillRect(5,11,7,2);x.fillRect(8,13,1,3);if(W.reach){x.fillStyle="#6a4428";x.fillRect(8,6,1,10);}}};}
