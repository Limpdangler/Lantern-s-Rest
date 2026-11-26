// ================= class signature abilities, feats, inspiration =================
SKILLS.sleight="dex";SKN.sleight="Sleight of Hand";CINFO.rogue.skills.push("sleight");
// ---------- rerolls: Inspiration (from companions you please) and the Lucky feat ----------
function canReroll(u){return u&&u.side==="h"&&(u.insp||(u.luck||0)>0);}
function spendReroll(u,what){if(u.insp){u.insp=false;log(`${esc(u.name)} spends Inspiration to reroll ${what}.`,"gold");float(u,"INSPIRED","#ffe060");}else{u.luck--;log(`${esc(u.name)} uses a Lucky point to reroll ${what}.`,"gold");float(u,"LUCKY","#ffe060");}hud();}
// ---------- feats instead of ability increases at levels 4 and 8 ----------
const FEAT_OPTS={asi:{name:"+2 to main ability",desc:"Raise your main ability score by 2 (better hits, saves and spells)."},
  alert:{name:"Alert",desc:"+5 initiative, and you can't be surprised."},lucky:{name:"Lucky",desc:"3 luck points per long rest: automatically reroll a failed d20."},
  sentinel:{name:"Sentinel",desc:"Enemies you hit with an opportunity attack stop moving."},tough:{name:"Tough",desc:"+2 max HP per level."},
  sharpshooter:{name:"Sharpshooter",desc:"Your ranged attacks ignore half cover, and +1 to hit with them."}};
const hasFeat=(u,f)=>!!(u&&u.feats&&u.feats.includes(f));
async function chooseFeats(){if(!G)return;const slots=(G.level>=4?1:0)+(G.level>=8?1:0);
  for(const h of G.party){if(h.dead||h.id==="beast")continue;h.feats=h.feats||[];h.picks=h.picks||0;
    while(h.picks<slots){const keys=Object.keys(FEAT_OPTS).filter(k=>k==="asi"||!h.feats.includes(k));
      const c=await choose(`The ${h.name} reached level ${G.level}! Choose an improvement:`,keys.map(k=>({t:FEAT_OPTS[k].name.toUpperCase(),sub:FEAT_OPTS[k].desc})));
      const k=keys[Math.max(0,c)];h.picks++;if(k!=="asi"){h.feats.push(k);h.featAsi=(h.featAsi||0)+1;if(k==="lucky")h.luck=3;}applyLevel(h,false);log(`${esc(h.name)} gains ${esc(FEAT_OPTS[k].name)}.`,"lv");}}
  $("tBox").hidden=true;hud();}
// ---------- party-sheet abilities (out of combat) ----------
function classActions(h){const A=[];if(h.dead||h.down||mode!=="explore")return A;const L=G.party[0];
  if(h.id!=="ranger"&&forageLeader()===h)A.push({t:"FORAGE",sub:G.foraged===G.floor?"Already foraged this floor":`Survival: find food and firewood (takes time)${h.id==="druid"?"":" · learned from the almanac"}`,dis:G.foraged===G.floor,f:()=>rangerForage(h)});
  if(h.id==="ranger"){A.push({t:"TRACK",sub:G.tracked&&G.tracked.has(areaKey(L.x,L.y))?"Already read the tracks here":"Survival: what's been through here?",f:()=>rangerTrack(h)});
    A.push({t:"FORAGE",sub:G.foraged===G.floor?"Already foraged this floor":"Survival: find food and firewood (takes time)",dis:G.foraged===G.floor,f:()=>rangerForage(h)});
    if(!h.favored)A.push({t:"CHOOSE FAVOURED ENEMY",sub:"Auto lore + bonus damage against them",f:()=>chooseFavored(h)});}
  if(h.id==="wizard"){A.push({t:"SEND THE OWL TO SCOUT",sub:G.owlCd>G.steps?"The owl is resting":"Your familiar flies ahead: tap where",dis:G.owlCd>G.steps,f:()=>startOwl(h)});
    A.push({t:"DETECT MAGIC (RITUAL)",sub:"Takes time: shows where magic items are on this floor",f:()=>detectMagic(h)});
    const unk=Object.keys(G.bag).filter(id=>!isKnown(id));A.push({t:"IDENTIFY (RITUAL)",sub:unk.length?`Takes time: identifies ${ITEMS[unk[0]].unk}`:"Nothing to identify",dis:!unk.length,f:()=>identifyRitual(h)});}
  if(h.id==="cleric"){for(const t of G.party.filter(x=>!x.dead&&!x.down&&x.id!=="beast"))A.push({t:`GUIDANCE: ${t.name.toUpperCase()}`,sub:t.guided?"Already guided":"+1d4 to their next ability check",dis:!!t.guided||G.party.some(x=>x.guided),f:()=>{t.guided=true;toast(`The ${h.name} blesses the ${t.name}: +1d4 on their next check.`);renderMenu();hud();}});}
  if(h.id==="druid"){A.push({t:"GOODBERRY",sub:h.goodberry?"Already made since your last long rest":"Spend a spell slot: +1 day of food",dis:!!h.goodberry||!slotAvail(h,1),f:()=>{useSlot(h,1);h.goodberry=true;addItem("ration");toast("A handful of glowing berries: enough to feed the party for a day.");renderMenu();hud();}});
    if(!h.wild){const n=h.res.wildshape||0;A.push({t:"WILD SHAPE: RAT",sub:`Squeeze through rubble and cave-ins to scout beyond (${n} left)`,dis:n<=0,f:()=>{h.res.wildshape--;startWild(h,"rat");renderMenu();}});
      A.push({t:"WILD SHAPE: SPIDER",sub:`Climb any ledge without a check (${n} left)`,dis:n<=0,f:()=>{h.res.wildshape--;startWild(h,"spider");renderMenu();}});}}
  if(h.id==="rogue"){A.push({t:"THROW A PEBBLE",sub:"Make a noise somewhere to lure monsters away: tap where",f:()=>{G.pebble=h;closeMenu();toast("Tap a spot within 10 squares to throw the pebble.");}});}
  return A;}
// ---------- ranger ----------
async function rangerTrack(h){const L=G.party[0];const key=areaKey(L.x,L.y);G.tracked=G.tracked||new Set();closeMenu();
  if(G.tracked.has(key)){toast(G.trackMsg||"The tracks here tell you nothing more.");return;}G.tracked.add(key);busy=true;
  const r=await check(h,"survival",12);const groups=[...new Set(G.mons.filter(m=>m.hp>0&&!m.peace&&!seen(m.x,m.y)&&cheb(m,L)<=22).map(m=>m.gid))];let txt;
  if(!r.ok||!groups.length)txt=!groups.length?"Nothing fresh has passed this way.":"The ground is too churned up to read.";
  else{G.tracks=groups.map(g=>{const ms=G.mons.filter(m=>m.gid===g&&m.hp>0);return {x:ms[0].x,y:ms[0].y,n:ms.length,name:ms[0].name,until:G.steps+80};});
    const dir=t=>{const dx=t.x-L.x,dy=t.y-L.y;return (dy<-3?"north":dy>3?"south":"")+(dx<-3?"west":dx>3?"east":"")||"close by";};
    txt="Fresh tracks: "+G.tracks.map(t=>`${t.n} ${t.name}${t.n>1?"s":""} to the ${dir(t)}`).join("; ")+". (Marked on the map for a while.)";}
  G.trackMsg=txt;G.steps+=6;await say(`${txt} (${r.txt})`,2200,true);$("tBox").hidden=true;busy=false;}
async function rangerForage(h){closeMenu();busy=true;G.foraged=G.floor;const r=await check(h,"survival",13);G.steps+=25;burnFuel(25);let got=[];
  if(r.ok){addItem("ration");got.push("a day of food");addItem("firewood");got.push("firewood");if(r.total>=20){addItem("ration");got.push("extra food");}}
  await say(got.length?`The ${h.name} snares cave crickets and finds edible fungus: ${got.join(", ")}. (${r.txt})`:`Nothing edible down here today. (${r.txt})`,1800,true);$("tBox").hidden=true;busy=false;hud();}
const FAV={goblins:"Goblins and orcs",kobolds:"Kobolds",beasts:"Beasts",undead:"Undead"};
async function chooseFavored(h){const ks=Object.keys(FAV);const c=await choose("Which foe has the ranger hunted most?",ks.map(k=>({t:FAV[k].toUpperCase()})));if(c<0)return;h.favored=ks[c];
  toast(`Favoured enemy: ${FAV[h.favored]}. You know their ways, and hit them harder (+1d4).`);$("tBox").hidden=true;renderMenu();}
const favoredHit=(a,t)=>a.side==="h"&&a.favored&&t.side==="m"&&t.fac===a.favored;
// ---------- wizard ----------
function startOwl(h){G.owlPick=h;closeMenu();toast("Tap a spot within 14 squares for the owl to fly to.");}
async function owlFly(x,y){const L=G.party[0];G.owlPick=null;if(cheb(L,{x,y})>14||isWall(x,y)){toast("Too far, or solid rock.");return;}
  G.owl={x,y,until:G.steps+12};G.owlCd=G.steps+40;fov();
  const spotted=G.mons.filter(m=>m.hp>0&&seen(m.x,m.y));for(const m of spotted)if(Math.random()<.15&&m.state!=="sleep"){m.state="investigate";m.inv={x:L.x,y:L.y};}
  toast(`The owl circles over the spot.${spotted.length?" It sees "+spotted.length+" creature"+(spotted.length>1?"s":"")+".":" Nothing stirs there."}`);hud();}
async function detectMagic(h){closeMenu();busy=true;G.steps+=15;burnFuel(15);let n=0;
  for(const o of G.objs)if(o.type==="chest"&&!o.opened&&o.loot&&o.loot.items.some(id=>ITEMS[id].kind==="gear")){o.magic=true;n++;}
  for(const c of G.corpses||[])if(!c.searched&&c.loot.items.some(id=>ITEMS[id].kind==="gear")){c.magic=true;n++;}
  for(const it of G.items)if(it.item&&ITEMS[it.item].kind==="gear"){it.magic=true;n++;}
  await say(n?`The ${h.name} senses ${n} source${n>1?"s":""} of magic on this floor. They now shimmer faintly on your map.`:`No magic items anywhere on this floor.`,1600,true);$("tBox").hidden=true;busy=false;}
async function identifyRitual(h){const unk=Object.keys(G.bag).filter(id=>!isKnown(id));if(!unk.length)return;closeMenu();busy=true;G.steps+=20;burnFuel(20);const id=unk[0];G.known.add(id);
  await say(`After a long, careful ritual, the ${h.name} identifies the ${ITEMS[id].unk}: it's ${aN(ITEMS[id].name)}!`,1600,true);$("tBox").hidden=true;busy=false;}
const COPYABLE={scroll_mm:"magicmissile",scroll_fb:"fireball",scroll_sleep:"sleep",scroll_ray:"rayofsickness"};
// ---------- cleric: Speak with Dead ----------
async function speakWithDead(cl,c){if(!slotAvail(cl,1)){toast("The cleric has no spell slots left.");return;}useSlot(cl,1);c.spoken=true;const hints=[];
  const holder=G.mons.find(m=>m.hasKey&&m.hp>0);const keyCorpse=(G.corpses||[]).find(k=>!k.searched&&k.loot.items.includes("key"));
  if(holder)hints.push(`"The key... the ${holder.name} carries it."`);else if(keyCorpse&&keyCorpse!==c)hints.push(`"The key lies with the dead ${keyCorpse.name}."`);
  if(G.stairs&&!G.explored[G.stairs.y][G.stairs.x]){for(let y=G.stairs.y-2;y<=G.stairs.y+2;y++)for(let x=G.stairs.x-2;x<=G.stairs.x+2;x++)if(G.explored[y]&&G.explored[y][x]!==undefined)G.explored[y][x]=true;hints.push(`"The way down... I can show you." (The ladder is now on your map.)`);}
  const traps=G.traps.filter(t=>!t.found&&!t.done).sort((a,b)=>cheb(a,c)-cheb(b,c)).slice(0,2);for(const t of traps)t.found=true;if(traps.length)hints.push(`"Beware the floor... there, and there." (${traps.length} trap${traps.length>1?"s":""} revealed.)`);
  if(!hints.length)hints.push(`"I know nothing that would help you. Let me rest."`);
  await say(`The ${cl.name} lays a hand on the ${c.name}'s brow. Its jaw creaks: ${hints.join(" ")}`,2600,true);$("tBox").hidden=true;fov();hud();}
// ---------- druid: Speak with Animals ----------
async function speakWithAnimals(dr,grp){const r=await check(dr,"nature",12);
  if(r.ok){for(const q of grp){q.peace=true;q.state="idle";}const others=[...new Set(G.mons.filter(m=>m.hp>0&&!m.peace&&!grp.includes(m)).map(m=>m.gid))].length;
    await say(`The ${dr.name} speaks softly in the old tongue. The ${grp[0].name}s settle and let you pass. (${r.txt}) They tell of ${others} other group${others===1?"":"s"} of creatures on this floor.`,2200,true);$("tBox").hidden=true;return true;}
  await say(`The ${grp[0].name}s won't listen. (${r.txt})`,1000,true);return false;}
// ---------- rogue: pickpocket, rearm, pebble ----------
async function pickpocket(rg,m){const pp=monPassive(m)-(m.state==="sleep"?5:0);const r=await check(rg,"sleight",pp);m.picked=true;
  if(r.ok){const got=[];if(m.hasKey){m.hasKey=false;addItem("key");got.push("a rusty key");}if(Math.random()<.6){const g=ri(2,8)*G.floor;G.gold+=g;got.push(g+" gold");}if(Math.random()<.15){const it=rollItem(false);if(it){addItem(it);got.push(itemName(it));}}
    await say(`Light fingers... (${r.txt}) ${got.length?"You lift "+got.join(", ")+".":"Its pockets are empty."} It never noticed.`,1600,true);$("tBox").hidden=true;hud();return;}
  await say(`The ${m.name} feels the tug and spins around! (${r.txt})`,1000,true);m.state="idle";busy=false;startCombat({by:[m]});}
async function rearmTrap(rg,t){const r=await check(rg,"thieves",t.dc);if(r.ok){t.done=false;t.disarmed=false;t.ours=true;t.found=true;await say(`The ${rg.name} resets the ${TRAPS[t.type].name}. The next monster to step here gets a nasty surprise. (${r.txt})`,1600,true);}
  else{t.rearmFail=true;await say(`It won't reset. (${r.txt})`,1000,true);}$("tBox").hidden=true;}
function throwPebble(x,y){const rg=G.pebble;G.pebble=null;if(cheb(rg,{x,y})>10||isWall(x,y)){toast("Too far, or into solid rock.");return;}
  makeNoise(x,y,9);fx.push({type:"shot",from:{x:rg.x,y:rg.y},to:{x,y},t:now(),col:"#c8c0b0"});toast("Clack... clatter. Anything nearby will go and look.");
  for(const m of G.mons)if(m.state==="investigate")m.inv={x,y};}
// ---------- fighter: size up ----------
async function sizeUp(u,m){C.bonus=false;busy=true;const r=await check(u,"insight",12);if(r.ok){m.sized=true;await say(`The ${u.name} sizes up the ${m.name}: AC ${m.ac}, ${m.hp}/${m.maxHp} HP. (${r.txt})`,1400);}else await say(`Hard to read. (${r.txt})`,900);afterAction();}
// ---------- barbarian: grapple & throw ----------
async function grappleThrow(u,t,x,y){C.actions--;busy=true;const a=await check(u,"athletics",0,{quiet:true});const dfs=Math.max(skillBonus(t,"athletics"),skillBonus(t,"acrobatics"));const d=rnd(20)+dfs;
  if(a.total<d){await say(`The ${t.name} wriggles free! (${a.total} vs ${d})`,900);afterAction();return;}
  const land=unitAt(x,y);let tx=x,ty=y;if(land&&land!==t){const p=nearFree(x,y);if(p){tx=p.x;ty=p.y;}}
  fx.push({type:"shot",from:{x:t.x,y:t.y},to:{x:tx,y:ty},t:now(),col:"#ffffff"});t.x=tx;t.y=ty;t.st.prone=true;cam.shake=now();
  await say(`The ${u.name} hoists the ${t.name} overhead and HURLS it! (${a.total} vs ${d})`,1000);await dealDamage(t,roll("1d6").total+abm(u,"str"),"bludgeoning",{src:u});
  if(land&&land!==t&&land.hp>0){land.st.prone=true;await dealDamage(land,roll("1d6").total,"bludgeoning",{src:u});}
  if(t.hp>0){const o=objAt(tx,ty);if(G.objs.some(q=>q.type==="web"&&!q.gone&&q.x===tx&&q.y===ty)){t.st.restrained={dc:12,by:"web"};float(t,"WEBBED","#ffffff");}await onEnter(t,tx,ty,{});}
  afterAction();}
// ---------- spare the dying / douse / flaming shot ----------
async function douse(u,x,y){let n=0;for(let yy=y-2;yy<=y+2;yy++)for(let xx=x-2;xx<=x+2;xx++){const k=yy*G.W+xx;if(G.fire.delete(k))n++;}for(const o of G.objs)if(o.burn&&cheb(o,{x,y})<=2){o.burn=0;n++;}
  computeLight();await say(n?`The ${u.name} calls water from the stone and smothers the flames.`:"Nothing is burning there.",1000);}
// ---------- reactions: automatic, or ask the player ----------
async function askReact(h,text){if(S.rules.autoReact)return true;const c=await choose(`${text}`,[{t:"YES, REACT"},{t:"NO, SAVE IT"}]);$("tBox").hidden=true;return c===0;}
const NEW_SCROLLS={scroll_sleep:{unk:"Unread Scroll",name:"Spell Scroll: Sleep",kind:"use",price:50,floor:1,w:2,desc:"Only a wizard can use this: copy it into the spellbook to learn Sleep."},
  scroll_ray:{unk:"Unread Scroll",name:"Spell Scroll: Ray of Sickness",kind:"use",price:50,floor:2,w:2,desc:"Only a wizard can use this: copy it into the spellbook to learn Ray of Sickness."}};
Object.assign(ITEMS,NEW_SCROLLS);
// ---------- combat buttons for class signatures ----------
function classCombatButtons(u){const B=[];if(u.wild)return B;const act=hasAction()&&C.attacksLeft===0;
  if(u.id==="fighter")B.push({t:"SIZE UP",sub:"Bonus action · Insight: learn an enemy's AC and HP",dis:!C.bonus,f:()=>targetMode({kind:"enemy",range:12,label:"Size up which enemy?",onPick:async(x,y,t)=>sizeUp(u,t)})});
  if(u.id==="barbarian")B.push({t:"GRAPPLE & THROW",sub:"Action · Athletics contest · hurl an adjacent enemy up to 3 squares",dis:!act,f:()=>targetMode({kind:"enemy",range:1,label:"Grab which enemy?",onPick:async(x,y,t)=>{
      if(t.tr&&t.tr.large){prompt(`The ${t.name} is far too big to throw.`);return;}
      targetMode({kind:"tile",range:3,label:`Throw the ${t.name} where? Tap a square within 3 (into acid, fire, a web, a ledge or another enemy!)`,onPick:async(x2,y2)=>{if(isWall(x2,y2)||blocksObj(x2,y2)||(x2===u.x&&y2===u.y)){prompt("You can't throw it there.");return;}await grappleThrow(u,t,x2,y2);}});}})});
  if(u.id==="ranger"){const left=u.pins===undefined?2:u.pins;B.push({t:"PINNING SHOT",sub:`Action · on a hit the target can't move until its next turn ends (${left} left this rest)`,dis:!act||left<=0,f:()=>{const w=weaponOf(u,"main");targetMode({kind:"enemy",range:w.range,label:"Pin which enemy?",onPick:async(x,y,t)=>{C.actions--;u.pins=left-1;
      await attack(u,t,Object.assign({},w,{name:"Pinning Shot"}),{onHit:async tt=>{if(tt.hp>0){tt.st.pinned=C.round+1;float(tt,"PINNED","#ffffff");}}});afterAction();}});}});}
  if(u.id==="wizard")B.push({t:"OWL: HELP",sub:"Bonus action · your familiar harries an enemy: the next attack on it has advantage",dis:!C.bonus,f:()=>targetMode({kind:"enemy",range:12,label:"Which enemy should the owl harry?",onPick:async(x,y,t)=>{C.bonus=false;t.st.helped=true;float(t,"OWL!","#ffe060");await say(`The owl swoops at the ${t.name}'s face!`,700);afterAction();}})});
  if(u.id==="cleric"){const dy=G.party.filter(a=>a.down&&!a.dead&&!a.stable&&cheb(a,u)<=3);for(const a of dy)B.push({t:`SPARE THE DYING: ${a.name.toUpperCase()}`,sub:"Action · cantrip, range 3 · stabilises automatically",dis:!act,f:async()=>{busy=true;C.actions--;a.stable=true;a.ds={s:0,f:0};float(a,"STABLE","#8aff7a");await say(`A soft light settles on the ${a.name}. Stable.`,800);hud();afterAction();}});}
  if(u.id==="druid"&&G.fire.size)B.push({t:"SHAPE WATER: DOUSE",sub:"Action · put out fires in a 5×5 area within 6",dis:!act,f:()=>targetMode({kind:"tile",range:6,label:"Douse where?",onPick:async(x,y)=>{C.actions--;busy=true;await douse(u,x,y);afterAction();}})});
  const rw=["main","alt"].map(k=>weaponOf(u,k)).find(w=>!w.melee&&!w.spell&&!w.thrown);
  if(rw&&(G.bag.oil||0)>0)B.push({t:"FLAMING ARROW",sub:`Action · uses an oil flask · ${rw.name}: +1d6 fire and sets the spot alight (webs, oil, wood)`,dis:!act,f:()=>targetMode({kind:"tile",range:rw.range,label:"Tap an enemy or a spot to set alight.",onPick:async(x,y)=>{C.actions--;takeItem("oil");busy=true;const t=monAt(x,y);
      if(t&&t.inCombat){await attack(u,t,Object.assign({},rw,{name:"Flaming "+rw.name}),{onHit:async tt=>{if(tt.hp>0)await dealDamage(tt,roll("1d6").total,"fire",{src:u});}});}else fx.push({type:"shot",from:{x:u.x,y:u.y},to:{x,y},t:now(),col:"#ff9a3a"});
      igniteAt(x,y);if(!G.fire.has(y*G.W+x)&&gnd(x,y)!==GROUND.water)G.fire.set(y*G.W+x,2);computeLight();await scorch();afterAction();}})});
  return B;}
// ---------- map overlays: tracks, owl, magic shimmer, your own traps ----------
function drawClassOverlays(camX,camY,t){
  if(G.tracks)for(const k of G.tracks){if(k.until<G.steps)continue;const sx=k.x*TS-camX,sy=k.y*TS-camY;ctx.fillStyle="rgba(230,200,140,.85)";for(const [a,b] of [[4,10],[7,7],[10,10],[13,7]])ctx.fillRect(sx+a,sy+b,2,3);
    ctx.font="600 7px 'Pixelify Sans',sans-serif";ctx.textAlign="center";ctx.fillStyle="#f0d890";ctx.fillText(`${k.n}`,sx+8,sy+5);ctx.textAlign="left";}
  if(G.owl&&G.owl.until>G.steps){const sx=G.owl.x*TS-camX,sy=G.owl.y*TS-camY-6+Math.sin(t/200)*2;ctx.fillStyle="#3a2a1a";ctx.fillRect(sx+4,sy+4,8,6);ctx.fillStyle="#9a7a50";ctx.fillRect(sx+5,sy+4,6,5);ctx.fillStyle="#d8c098";ctx.fillRect(sx+6,sy+6,4,3);
    ctx.fillStyle="#ffd040";ctx.fillRect(sx+6,sy+5,1,1);ctx.fillRect(sx+9,sy+5,1,1);const w=Math.floor(t/150)%2;ctx.fillStyle="#6a5030";ctx.fillRect(sx+1,sy+5+w,3,2);ctx.fillRect(sx+12,sy+5+w,3,2);}
  const sh=(x,y)=>{if(!G.explored[y][x])return;const sx=x*TS-camX,sy=y*TS-camY,p=(t/180+x+y)%6;ctx.fillStyle="rgba(170,140,255,.9)";ctx.fillRect(sx+3+p*2%10,sy+2+(p*3)%9,1,1);ctx.fillRect(sx+11-(p*2)%8,sy+5+(p*5)%8,1,1);};
  for(const o of G.objs)if(o.magic&&!o.opened&&!o.gone)sh(o.x,o.y);for(const c of G.corpses||[])if(c.magic&&!c.searched)sh(c.x,c.y);for(const it of G.items)if(it.magic)sh(it.x,it.y);
  for(const tr of G.traps)if(tr.ours&&!tr.done&&G.explored[tr.y][tr.x]){const sx=tr.x*TS-camX,sy=tr.y*TS-camY;ctx.strokeStyle="rgba(120,220,120,.7)";ctx.strokeRect(sx+2.5,sy+2.5,11,11);}}
