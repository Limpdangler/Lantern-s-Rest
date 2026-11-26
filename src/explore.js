// ================= exploring =================
function newRun(ci,race){clearRun();
  const seedIn=parseInt(($("seedIn")&&$("seedIn").value||"").replace(/\D/g,""),10);
  const seed=Number.isFinite(seedIn)?seedIn%1000000:Math.floor(NATIVE_RANDOM()*1000000);
  G={seed,party:[],bag:{potion:2,torch:1,oil:1,ration:3,firewood:2,arrows:20},gold:0,floor:1,level:1,xp:0,kills:0,over:false,fatigue:0,steps:0,fallen:[],
    light:true,fuel:FUEL_MAX,lightR:4,lore:{},sneak:false,coldUsed:false,shortRests:0,theme:THEME_KEYS[Math.floor(seededRandom(seed)()*THEME_KEYS.length)],known:new Set(KNOWN_START),idTried:new Set(),goal:null};
  if(hasUp("pack")){G.bag.ration+=2;G.bag.firewood+=2;}if(hasUp("lamp"))G.bag.oil+=2;if(hasUp("apoth"))G.bag.potion+=2;if(hasUp("yard"))G.level=2;
  if(hasUp("armoury")){const g=Object.keys(ITEMS).filter(k=>ITEMS[k].kind==="gear"&&!ITEMS[k].cursed&&ITEMS[k].floor<=2);const it=pick(g);addItem(it);G.known.add(it);}
  const hero=mkHero(S.classes[ci],race||"human");nameHero(hero);hero.isYou=true;G.party.push(hero);
  clearLog();log(`${esc(heroLabel(G.party[0]))} lights a lantern and steps into the ${esc(THEMES[G.theme].name)}.`,"lv");
  genFloor();mode="explore";busy=false;C=null;showCombatUI(false);hud();
  toast(`Floor 1: ${THEMES[G.theme].name}. Find the ladder down, and look for lost adventurers to join you.${G.goal?" Goal: "+G.goal.desc+".":""}`);}
async function tryMove(dx,dy){if(mode!=="explore"||busy||!G||G.over)return;busy=true;try{await doMove(dx,dy);}finally{if(mode==="explore")busy=false;}}
async function doMove(dx,dy){if(G.party[0].down){const i=G.party.findIndex(h=>!h.down&&!h.dead);if(i>0){const [h]=G.party.splice(i,1);G.party.unshift(h);hud();}}const L=G.party[0];L.face=dy<0?"b":dy>0?"f":"s";if(dx)L.flip=dx<0;const nx=L.x+dx,ny=L.y+dy;
  const m=monAt(nx,ny);if(m){
    if(isHiddenMon(m)){m.spotted=true;m.lurk=false;await say(`${cap(aN(m.name))} lunges out of the shadows!`,900,true);busy=false;startCombat({bumped:m,by:[m]});return;}
    if(m.peace){const c=await choose(`The ${m.name} watches you warily. They agreed to let you pass.`,[{t:"ATTACK THEM",sub:m.fooled?"They think you're friends: they'll be surprised":"They're watching you: no surprise"},{t:"LEAVE THEM BE"}]);
      if(c===0){for(const q of G.mons)if(q.gid===m.gid)q.peace=false;busy=false;startCombat({bumped:m,partyFirst:true});}return;}
    busy=false;startCombat({bumped:m,partyFirst:true});return;}
  if(G.npc&&G.npc.x===nx&&G.npc.y===ny){await recruit();return;}
  const d=doorAt(nx,ny);if(d&&!d.open){await doorInteract(d);return;}
  const o=objAt(nx,ny);
  if(o&&(o.type==="rubble"||o.type==="cavein")&&L.wild&&L.wild.form==="rat"){const bx=nx+dx,by=ny+dy;if(!isWall(bx,by)){G.owl={x:bx,y:by,until:G.steps+10};fov();if(o.type==="rubble")o.loose=true;
      toast(o.type==="rubble"?"The rat squeezes through the rocks and scouts the far side. It spots a loose stone: the rubble will be easier to shift now.":"The rat wriggles through a gap in the collapse and peers out the other side.");hud();return;}}
  if(o&&BLOCKERS[o.type]){await interact(o);return;}
  if(isWall(nx,ny))return;
  const up=elevAt(nx,ny)>elevAt(L.x,L.y),down=elevAt(nx,ny)<elevAt(L.x,L.y),noRamp=!isRamp(nx,ny)&&!isRamp(L.x,L.y);
  if(up&&noRamp){const c=L.sub==="thief"||(L.wild&&L.wild.form==="spider")?{ok:true}:await check(L,"athletics",10,{quiet:true});G.steps+=2;
    if(!c.ok){if(c.total<=5){toast(`The ${L.name} slips off the ledge and lands hard! (${c.txt})`);await dealDamage(L,rnd(4),"bludgeoning",{});}else toast(`The ${L.name} can't get a grip on the ledge. (${c.txt}) Try again, or use the ramp.`);return;}}
  if(down&&noRamp){const c=await check(L,"acrobatics",10,{quiet:true});if(!c.ok){toast(`The ${L.name} jumps down and lands badly. (${c.txt})`);await dealDamage(L,rnd(4),"bludgeoning",{});if(L.down)return;}}
  const t=trapAt(nx,ny);if(t&&t.found){const dz=bestAt("thieves"),iv=bestAt("investigation");
    const c=await choose(`${cap(aN(TRAPS[t.type].name))} lies ahead.${t.easy?" You've worked out how it works.":""}`,[{t:"DISARM IT",sub:t.disFail?"You already tried":`${oddsTag(dz,"thieves",t.dc,{adv:!!t.easy})}${toolNote(dz)}`},{t:"STUDY IT",sub:t.studied?"Already studied":`${oddsTag(iv,"investigation",t.dc)} · success makes disarming easier`},{t:"STEP ON IT",sub:"Set it off on purpose"},{t:"LEAVE IT"}].concat(heroesUp().some(h=>h.sub==="trickster")?[{t:"MAGE HAND",sub:"Arcane Trickster disarms it from a safe distance (a failure just sets it off harmlessly)"}]:[]));
    if(c===4){const tr=heroesUp().find(h=>h.sub==="trickster");const r=await check(tr,"thieves",t.dc,{adv:!!t.easy});t.done=true;if(r.ok){t.disarmed=true;await say(`A spectral hand dismantles the trap. (${r.txt}) +10 XP.`,1100,true);for(const m of gainXpNow(10))await say(m,1200,true);}else await say(`The spectral hand sets it off: it fires harmlessly into the air. (${r.txt})`,1200,true);$("tBox").hidden=true;hud();return;}
    if(c===0){if(t.disFail){toast(t.disFail);return;}await disarm(dz,t);hud();return;}
    if(c===1){if(t.studied){toast(t.easy?"You already know how it works.":"You still can't make sense of it.");return;}t.studied=true;const r=await check(iv,"investigation",t.dc);G.steps+=4;t.easy=r.ok;await say(r.ok?`The ${iv.name} figures out the mechanism. (${r.txt}) Disarming it will be easier.`:`The ${iv.name} can't make sense of it. (${r.txt})`,1200,true);$("tBox").hidden=true;return;}
    if(c!==2)return;}
  const f=G.party.find(h=>h!==L&&h.x===nx&&h.y===ny);
  if(f){f.x=L.x;f.y=L.y;faceToward(f,L.x-nx,L.y-ny);L.x=nx;L.y=ny;}
  else{const prev=G.party.map(h=>({x:h.x,y:h.y}));L.x=nx;L.y=ny;for(let i=1;i<G.party.length;i++){const h=G.party[i];const tp=prev[i-1];if(h.x===tp.x&&h.y===tp.y)continue;faceToward(h,tp.x-h.x,tp.y-h.y);h.x=tp.x;h.y=tp.y;}}
  const cost=(G.sneak?2:1)+(overloaded()?1:0);const before=G.steps;G.steps+=cost;burnFuel(cost);for(const h of G.party)if(!h.down&&h.st.prone)delete h.st.prone;
  if(S.rules.fatigue&&Math.floor(G.steps/120)>Math.floor(before/120)){G.fatigue++;await partyWeary();}
  if(G.steps%3===0&&G.fire.size)tickFire();
  if(G.sneak&&areaKey(L.x,L.y)!==G.sneakArea)rollSneak();
  fov();await onEnter(L,nx,ny,{});collectItems(L);
  await huntStep();if(G.sneak)await huntStep();wanderStep();if(Math.floor(G.steps/150)>Math.floor(before/150))wakeWanderers();await factionClash();if(mode!=="explore")return;
  if(G.stairs&&G.stairs.x===L.x&&G.stairs.y===L.y){await stairsPrompt();return;}
  passiveDetect();spotLurkers();fov();hud();autoSave();await loreCheck();if(G.level>=3&&G.party.some(h=>!h.dead&&!h.sub&&SUBS[h.id]))await chooseSubclasses();if(G.level>=4&&G.party.some(h=>!h.dead&&h.id!=="beast"&&(h.picks||0)<(G.level>=8?2:1)))await chooseFeats();await checkAwareness();}
async function huntStep(){for(const m of G.mons){if(m.state!=="hunt"||m.hp<=0)continue;const dist=dijkstra(m,40);let best=null,bd=1e9;
    for(const h of G.party){if(h.dead)continue;for(const [ax,ay] of DIRS8){const k=(h.y+ay)*G.W+h.x+ax;const v=dist.get(k);if(v&&v.c<bd){bd=v.c;best=k;}}}
    if(best!==null){const p=pathTo(dist,best);const step=p.slice(0,1);if(step.length&&!unitAt(step[0]%G.W,(step[0]/G.W)|0)){m.x=step[0]%G.W;m.y=(step[0]/G.W)|0;}}}}
async function checkAwareness(){if(mode!=="explore"||!G||G.over)return;
  const aware=G.mons.filter(m=>m.hp>0&&!m.peace&&(m.state==="hunt"&&G.party.some(h=>!h.dead&&cheb(h,m)<=1)||noticesParty(m)));if(!aware.length)return;
  const p=aware.find(m=>m.parley&&m.state!=="hunt");if(p&&!aware.some(m=>!m.parley)){await parley(p);return;}
  const dr=heroesUp().find(h=>h.id==="druid"&&!h.wild);const gid=aware[0].gid;
  if(dr&&aware.every(m=>m.fac==="beasts"&&m.gid===gid)&&!G.spokeTo?.[gid]){G.spokeTo=G.spokeTo||{};G.spokeTo[gid]=1;busy=true;const grp=G.mons.filter(m=>m.gid===gid&&m.hp>0);
    const c=await choose(`${grp.length} ${grp[0].name}${grp.length>1?"s":""} bristle at you. The ${dr.name} could speak to them in the old tongue.`,[{t:"SPEAK WITH ANIMALS",sub:oddsTag(dr,"nature",12)},{t:"FIGHT"}]);
    busy=false;if(c===0&&await speakWithAnimals(dr,grp)){$("tBox").hidden=true;return;}$("tBox").hidden=true;}
  aware.forEach(m=>m.bubble=now()+900);busy=true;await wait(500);busy=false;startCombat({by:aware});}
function passiveDetect(){for(const h of heroesUp()){const pp=(x,y)=>passive(h,"perception")-2*exhOf(h)-(!litAt(x,y)&&!heroDV(h)?5:0);
    // traps are well hidden: only the hero walking in front, and only with very sharp eyes, notices one without searching
    if(h===G.party[0])for(const t of G.traps)if(!t.found&&!t.done&&cheb(h,t)<=1&&pp(t.x,t.y)>=t.dc+5){t.found=true;toast(`The ${h.name} spots ${aN(TRAPS[t.type].name)}!`);log(`${esc(h.name)} spots ${aN(TRAPS[t.type].name)} (Passive Perception).`,"gold");}
    if(G.secret&&!G.secret.found&&cheb(h,G.secret)<=2&&pp(G.secret.x,G.secret.y)>=15){revealSecret();toast(`The ${h.name} notices a hidden door in the rock!`);log("A secret door!","gold");}
    for(const o of G.objs){if(o.type!=="chest"||o.opened||cheb(h,o)>1)continue;
      if(o.mimic&&!o.suspicious&&pp(o.x,o.y)>=13){o.suspicious=true;toast(`The ${h.name} thinks that chest just... breathed?`);}
      if(o.trap&&!o.trapFound&&h===G.party[0]&&pp(o.x,o.y)>=o.trap.dc+5){o.trapFound=true;toast(`The ${h.name} notices a tiny needle in that chest's lock.`);}}}}
async function search(){if(mode!=="explore"||busy||!G)return;const L=G.party[0];const key=areaKey(L.x,L.y);
  if(G.searched.has(key)){toast(G.searchMsg[key]||"Nothing unusual, as far as you can tell.");return;}
  busy=true;G.searched.add(key);const h=bestAt("perception");const help=heroesUp().length>1;const dim=!litAt(L.x,L.y)&&!heroDV(h);toast("");
  await say(`The ${h.name} searches the area carefully${help?", with help from the others":""}${dim?" (in the dark: disadvantage)":""}...`,700,true);
  const c=await check(h,"perception",0,{adv:help,dis:dim});const found=[];const near=o=>cheb(L,o)<=6&&(areaKey(o.x,o.y)===key||los(L.x,L.y,o.x,o.y));
  for(const t of G.traps)if(!t.found&&!t.done&&near(t)&&c.total>=t.dc){t.found=true;found.push(TRAPS[t.type].name);}
  if(G.secret&&!G.secret.found&&near(G.secret)&&c.total>=15){revealSecret();found.push("a secret door");}
  for(const o of G.objs){if(o.type!=="chest"||o.opened||!near(o))continue;if(o.mimic&&!o.suspicious&&c.total>=13){o.suspicious=true;found.push("a chest that isn't a chest");}
    if(o.trap&&!o.trapFound&&c.total>=o.trap.dc){o.trapFound=true;found.push("a trapped chest");}}
  for(const m of G.mons)if(isHiddenMon(m)&&near(m)&&c.total>=m.hide){m.spotted=true;found.push(aN(m.name)+" hiding in the shadows");}
  G.steps+=10;burnFuel(10);await huntStep();
  G.searchMsg[key]=found.length?"Nothing else turns up here.":"Nothing unusual, as far as you can tell.";
  await say(`Perception ${c.total}. ${found.length?"Found: "+found.join(", ")+"!":"Nothing unusual, as far as you can tell."}`,1500,true);$("tBox").hidden=true;busy=false;hud();await checkAwareness();}
async function recruit(){await recruitInner();if(G.level>=3)await chooseSubclasses();}
async function recruitInner(){const n=G.npc;const h=mkHero(n.def,n.race||pick(RACE_KEYS));nameHero(h);h.x=n.x;h.y=n.y;h.dx=h.x*TS;h.dy=h.y*TS;G.npc=null;G.party.push(h);
  log(`The ${esc(h.name)} joins your party!`,"lv");hud();await say(`"A light, at last! Mind if I come along?" ${h.nick}, a ${RACES[h.race].name} ${h.name}, joins your party. (${TRAITS[h.trait].name}: likes ${TRAITS[h.trait].likes}; dislikes ${TRAITS[h.trait].dislikes}.)`,2000,true);$("tBox").hidden=true;fov();}
async function doorInteract(d){
  if(d.burn){toast("The door is on fire! Give it time to burn through.");return;}
  if(d.wedged){d.wedged=false;toast("You kick the wedge out.");}
  if(!d.heard&&!d.open){const c0=await choose(`A closed ${d.iron?"iron":"wooden"} door${d.locked?", locked":""}.`,[{t:d.locked?"TRY IT":"OPEN IT"},{t:"LISTEN AT THE DOOR",sub:oddsTag(bestAt("perception"),"perception",d.iron?15:10)+" · hear what's on the other side"},{t:"LEAVE IT"}]);
    if(c0===1){await listenAtDoor(d);return;}if(c0!==0){$("tBox").hidden=true;return;}d.heard=d.heard||"skipped";$("tBox").hidden=true;}
  if(!d.locked){d.open=true;computeLight();fov();checkAwareness();return;}
  d.fail=d.fail||{};const hasKey=(G.bag.key||0)>0;const barb=heroesUp().find(h=>h.id==="barbarian"&&(h.res.rage||0)>0&&!h.wild);const th=bestAt("thieves"),st=bestAt("athletics");const fdc=d.iron?22:17;
  const canBurn=!d.iron&&((G.bag.oil||0)>0||(G.bag.torch||0)>0);
  const c=await choose(d.iron?"A heavy iron door, locked tight. It won't burn.":"A heavy wooden door, locked tight.",[{t:"USE KEY",sub:hasKey?"The rusty key":"You don't have a key",dis:!hasKey},
    {t:"PICK THE LOCK",sub:`${oddsTag(th,"thieves",15)}${toolNote(th)}`},
    {t:"FORCE IT",sub:`${oddsTag(st,"athletics",fdc)} · LOUD`},
    {t:"RAGE AND SMASH",sub:barb?`${barb.name}: uses a Rage · always works on wood · LOUD`:"Needs a barbarian with Rage left",dis:!barb||d.iron},{t:"BURN IT",sub:d.iron?"Iron doesn't burn":canBurn?"Uses an oil flask or torch · slow, smoky, draws attention":"You need an oil flask or a torch",dis:!canBurn},{t:"LEAVE IT"}]);
  if(c===0){takeItem("key");d.locked=false;d.open=true;toast("The key turns. The door swings open.");}
  else if(c===1){if(d.fail.pick){toast(d.fail.pick);return;}const r=await check(th,"thieves",15);G.steps+=5;
    if(r.ok){d.locked=false;d.open=true;toast(`Click! (${r.txt})`);}
    else{d.fail.pick=r.r===1?"The broken pick is still jammed in the lock. Nobody can pick it now.":"The lock won't budge.";toast(`${r.r===1?"SNAP! The pick breaks off inside the lock.":"The lock won't budge."} (${r.txt})`);}}
  else if(c===2){if(d.fail.force){toast(d.fail.force);return;}const r=await check(st,"athletics",fdc);
    if(r.r===1){d.fail.force="The door holds. Your shoulder still aches from last time.";alarm(d.x,d.y);await say(`The ${st.name} slams into the door, slips and crashes into a rack of old armour. The din echoes through the whole floor. Everything down here heard that. (${r.txt})`,2000,true);$("tBox").hidden=true;}
    else{makeNoise(d.x,d.y,12);if(r.ok){d.locked=false;d.open=true;toast(`CRASH! The door bursts open. (${r.txt}) Something may have heard that...`);}else{d.fail.force="The door shudders but holds.";toast(`The door shudders but holds. (${r.txt}) The noise echoes...`);}}}
  else if(c===3){barb.res.rage--;d.locked=false;d.open=true;d.burnt=true;makeNoise(d.x,d.y,14);cam.shake=now();await say(`The ${barb.name} ROARS and smashes the door to splinters!`,1300,true);$("tBox").hidden=true;}
  else if(c===4){if(G.bag.oil)takeItem("oil");else takeItem("torch");setAlight(d);toast("You douse the door and set it alight. It'll take a while to burn through, and the smoke and light will carry...");}
  computeLight();fov();hud();}
async function interact(o){
  if(o.type==="boulder"){toast("A heavy boulder. Good cover from arrows.");return;}
  if(o.type==="barrel"){const c=await choose("An old barrel, sloshing with lamp oil.",[{t:"SMASH IT",sub:"Spill the oil on the floor"},{t:"LEAVE IT",sub:"It could be useful in a fight"}]);if(c===0)await breakBarrel(o,false,0,0);$("tBox").hidden=true;return;}
  if(o.type==="wood"){await woodInteract(o);return;}
  if(o.deco||o.type==="rubble"||o.type==="cavein"){await decoInteract(o);return;}
  if(o.type==="captive"){await captiveInteract(o);return;}
  if(o.type==="relic"){await relicInteract(o);return;}
  if(o.type==="coffer"){await cofferInteract(o);return;}
  if(o.type==="chest"){if(o.opened){toast("An empty chest.");return;}
    if(o.trap&&o.trapFound&&!o.mimic){const th=bestAt("thieves");const c=await choose("This chest's lock hides a poison needle.",[{t:"DISARM IT",sub:o.trapFail?"You already tried":`${oddsTag(th,"thieves",o.trap.dc)}${toolNote(th)}`},{t:"OPEN IT ANYWAY",sub:heroesUp().some(h=>h.sub==="trickster")?"With Mage Hand: from a safe distance":"Take the risk"},{t:"LEAVE IT"}]);
      if(c===1&&heroesUp().some(h=>h.sub==="trickster")){o.trap=null;await say("A spectral hand flips the lid. The needle stabs empty air.",1100,true);}
      if(c===2||c<0){$("tBox").hidden=true;return;}
      if(c===0&&o.trapFail){toast(o.trapFail);$("tBox").hidden=true;return;}if(c===0){const r=await check(th,"thieves",o.trap.dc);if(r.ok){o.trap=null;await say(`The needle is jammed. (${r.txt})`,900,true);}else if(r.total<=o.trap.dc-5){await say(`Oops. (${r.txt})`,600,true);await chestTrap(o,th);}else{o.trapFail="The mechanism is too fiddly. You can't disarm it.";await say(`Too fiddly. (${r.txt})`,900,true);$("tBox").hidden=true;return;}}}
    if(o.trap&&!o.mimic){await chestTrap(o,G.party[0]);}
    if(o.mimic){let c=0;if(o.suspicious){c=await choose("Something about this chest seems... alive.",[{t:"OPEN IT ANYWAY"},{t:"POKE IT",sub:"Reveal what it is, ready to fight"},{t:"LEAVE IT"}]);if(c===2)return;}
      o.gone=true;const mm=mkMon(MIMIC,o.x,o.y);mm.gid=999;mm.state="combat";G.mons.push(mm);fx.push({type:"flash",u:mm,t:now()});
      if(c===0){await say("The chest sprouts teeth and lunges! It's a MIMIC!",1200,true);G.party.forEach(h=>{if(!h.dead)h.st.surprised=true;});busy=false;startCombat({extra:[mm]});}
      else{await say("You prod the chest. It snarls and rears up: a MIMIC!",1100,true);busy=false;startCombat({extra:[mm]});}return;}
    o.opened=true;o.type="chest";const got=[];G.gold+=o.loot.gold;got.push(`${o.loot.gold} gold`);for(const id of o.loot.items){addItem(id);got.push(itemName(id));}if(o.loot.items.length)approve("chest");
    log(`Chest: ${got.map(esc).join(", ")}.`,"gold");await say(`Inside the chest: ${got.join(", ")}!`,1800,true);$("tBox").hidden=true;hud();return;}
  if(o.type==="shrine"){if(o.used){toast("The shrine's light has gone out.");return;}const h=bestAt("religion");
    const cursed=G.party.some(p=>!p.dead&&p.gear.some(id=>ITEMS[id].cursed));
    const c=await choose("An old shrine to a forgotten god. A faint blue light pulses inside.",[{t:"PRAY",sub:`${h.name}: Religion DC 12 · blessing or curse`},{t:"OFFER 25 GOLD",sub:"A sure blessing",dis:G.gold<25},{t:"LEAVE IT"}].concat(cursed?[{t:"LIFT CURSES",sub:"Ask the shrine to break your cursed items (uses the shrine)"}]:[]));
    if(c===3){o.used=true;for(const p of G.party){const bad=p.gear.filter(id=>ITEMS[id].cursed);p.gear=p.gear.filter(id=>!ITEMS[id].cursed);if(bad.length)applyLevel(p,false);}await say("The cursed items crumble to dust in the shrine's light.",1400,true);$("tBox").hidden=true;hud();return;}
    if(c===2||c<0)return;approve(c===0?"pray":"offer");o.used=true;let ok=true;if(c===0){const r=await check(h,"religion",12);ok=r.ok;log(`Shrine: ${r.txt}.`,"magic");}else G.gold-=25;
    if(ok){G.blessFloor=G.floor;for(const p of G.party){if(!p.dead){heal(p,Math.ceil(p.maxHp/2));}}await say("Warm light washes over the party: healed, and blessed with +1 to hit and saves on this floor.",1700,true);}
    else{G.curseFloor=G.floor;for(const p of heroesUp())p.hp=Math.max(1,p.hp-rnd(6));await say("The light turns cold. The party is cursed: −1 AC on this floor.",1600,true);}
    $("tBox").hidden=true;hud();return;}
  if(o.type==="runes"){if(o.used){toast("The runes have gone dark.");return;}const h=bestAt("arcana");
    const c=await choose("Strange runes glow on a standing stone.",[{t:"READ THEM",sub:`${h.name}: Arcana DC 13`},{t:"LEAVE THEM"}]);if(c!==0)return;o.used=true;const r=await check(h,"arcana",13);
    if(r.ok){for(let y=0;y<G.H;y++)for(let x=0;x<G.W;x++)if(!isWall(x,y))G.explored[y][x]=true;for(const t of G.traps)t.found=true;if(G.secret&&!G.secret.found)revealSecret();
      await say(`The runes are a map! (${r.txt}) The whole floor and every trap are revealed.`,1700,true);}
    else{await say(`The runes flare and zap the ${h.name}! (${r.txt})`,1200,true);await dealDamage(h,roll("1d6").total,"lightning",{});}
    $("tBox").hidden=true;hud();return;}
  if(o.type==="merchant"){openShop(o);return;}}
async function parley(m){const gid=m.gid;const grp=G.mons.filter(q=>q.gid===gid&&q.hp>0);grp.forEach(q=>q.bubble=now()+900);const toll=10*G.floor;
  const per=bestAt("persuasion"),inti=bestAt("intimidation"),dec=bestAt("deception");const roarB=heroesUp().find(h=>h.id==="barbarian"&&(h.res.rage||0)>0&&!h.wild);let liar=grp.some(q=>q.treach);
  const tongue=speakerFor(m),lang=MLANG[m.key];const talk={adv:!!tongue};
  const ins=heroesUp().slice().sort((a,b)=>passive(b,"insight")-passive(a,"insight"))[0];const sensed=liar&&(!!tongue||passive(ins,"insight")-2*exhOf(ins)>=13);
  if(liar){if(tongue)log(`${esc(tongue.name)} understands the ${esc(lang)} they mutter to each other: they plan to attack once you've paid.`,"miss");else log(`${esc(ins.name)}'s Passive Insight ${passive(ins,"insight")} vs their Deception 13: ${sensed?"sees through them":"doesn't notice anything off"}.`,"miss");}
  const calm=f=>{for(const q of grp){q.peace=true;q.parley=0;q.state="idle";if(f)q.fooled=true;}};
  const fight=async(t)=>{await say(t,1000,true);grp.forEach(q=>{q.parley=0;q.peace=false;});busy=false;startCombat({by:grp});};
  const flee=async(r,t)=>{for(const q of grp){G.mons.splice(G.mons.indexOf(q),1);}const xp=Math.floor(grp.reduce((a,q)=>a+q.xp,0)/2);await say(`${t} (${r.txt}) +${xp} XP.`,1200,true);for(const msg of gainXpNow(xp))await say(msg,1300,true);};
  let att=0;// attitude: 0 hostile, 1 indifferent (they'll haggle), 2 friendly
  for(let turn=0;;turn++){
    if(turn>=4){await fight(`"Enough talking!" They lose patience and attack!`);return;}
    const price=att===1?Math.ceil(toll/2):toll;const pdc=liar?16:13;
    const who=`${grp.length>1?`${grp.length} ${m.name}s`:`A ${m.name}`}`;
    const q=(att===0?`${who} block${grp.length>1?"":"s"} the way: "Halt! Pay ${toll} gold or turn back!"`:`${grp.length>1?`The ${m.name}s look at each other`:`The ${m.name} thinks it over`}. "Fine... ${price} gold and you can pass." (They're Indifferent now: talk them round and they may become Friendly.)`)
      +(tongue?` The ${tongue.name} speaks ${lang}, so talking to them has advantage.`:lang?` They speak ${lang}; nobody in the party does.`:"")
      +(sensed?` (They're lying: they'll attack once you've paid.)`:"");
    const c=await choose(q,[{t:"PAY",sub:`${price} gold`,dis:G.gold<price},{t:"PERSUADE",sub:`${oddsTag(per,"persuasion",pdc)} · win big and they turn Friendly`},{t:"DECEIVE",sub:`${oddsTag(dec,"deception",14)} · "We work for your boss." If it works, they'll never see you coming`},{t:"INTIMIDATE",sub:oddsTag(inti,"intimidation",14)},{t:"ROAR",sub:roarB?`${roarB.name}: uses a Rage · Intimidation with advantage`:"Needs a barbarian with Rage left",dis:!roarB},{t:"ATTACK",sub:"They're ready for you"}]);
    approve(["toll","persuade","deceive","intimidate","intimidate","attackfirst"][c]||"");
    if(c===0){G.gold-=price;hud();if(liar){await fight("They pocket the gold... and draw their blades. \"Thanks, fools!\"");return;}calm();await say("They pocket the gold and wave you through.",1200,true);break;}
    else if(c===1){const r=await check(per,"persuasion",pdc,talk);
      if(r.ok){att=Math.min(2,att+(r.total>=pdc+5?2:1));
        if(att===2){calm();grp.forEach(q=>q.treach=false);await say(`"Alright, alright, friend. Go on through." (${r.txt}) They're Friendly now, and chatty...`,1300,true);await shareSecret(grp);break;}
        await say(`"Hmm. Maybe we can work something out." (${r.txt})`,1100,true);continue;}
      if(att>0){att=0;await say(`"Now you're just wasting our time." (${r.txt}) They're back to the full price.`,1200,true);continue;}
      await fight(`"Nice try!" (${r.txt}) They attack!`);return;}
    else if(c===2){const r=await check(dec,"deception",14,talk);if(r.ok){calm(true);await say(`"Oh! Sorry, boss's orders, go right ahead." (${r.txt}) They buy it completely.`,1300,true);break;}else{await fight(`"Liar!" (${r.txt}) They attack!`);return;}}
    else if(c===4&&roarB){roarB.res.rage--;const r=await check(roarB,"intimidation",14,{adv:true});await say("The barbarian lets out a bone-shaking ROAR!",900,true);if(r.ok){await flee(r,"They flee for their lives!");break;}else{await fight(`They hold their ground. (${r.txt}) Attack!`);return;}}
    else if(c===3){const r=await check(inti,"intimidation",14,talk);if(r.ok){await flee(r,"They scatter in terror!");break;}else{await fight(`They laugh at you. (${r.txt}) Attack!`);return;}}
    else{grp.forEach(q=>q.parley=0);busy=false;startCombat({by:grp});return;}}
  $("tBox").hidden=true;hud();}
async function stairsPrompt(){const c=await choose(`A ladder leads down to floor ${G.floor+1}. The party can camp safely at the bottom.`,[{t:"CLIMB DOWN"},{t:"NOT YET",sub:"Keep exploring this floor"}]);
  if(c!==0)return;if(G.goal&&G.goal.type==="relic"&&!G.goal.done&&G.bag.relic){takeItem("relic");await goalDone("You hand the idol to a waiting scout.");}
  if(!await ladderRest()){$("tBox").hidden=true;return;}await checkDeserters();if(!G.party.length)return;
  if(G.floor+1<S.dungeon.floors)await chooseRoute();G.floor++;genFloor();hud();lastSaveStep=-1;autoSave(true);
  toast(`Floor ${G.floor}${G.floor>=S.dungeon.floors?". The ground shakes. Something huge is down here.":": "+THEMES[G.theme].name+"."}${G.goal?" Goal: "+G.goal.desc+".":""}`);
  log(`Floor ${G.floor}. The party rests at the foot of the ladder.`,"lv");}
// ---------- rests (see ex5e.js for camping) ----------
function enemiesNear(){return G.mons.some(m=>m.hp>0&&!m.peace&&!isHiddenMon(m)&&(m.state==="hunt"||seen(m.x,m.y)));}
function ambushSpot(){const L=G.party[0];for(let r=4;r<=7;r++)for(let k=0;k<30;k++){const x=L.x+ri(-r,r),y=L.y+ri(-r,r);if(inB(x,y)&&!isWall(x,y)&&!unitAt(x,y)&&!blocksObj(x,y)&&!doorAt(x,y)&&cheb({x,y},L)>=3)return {x,y};}return nearFree(L.x,L.y);}
// ---------- tap to walk & tap to ambush ----------
async function exploreTap(x,y){if(mode!=="explore"||busy||!G||G.over)return;
  if(G.pebble){throwPebble(x,y);return;}
  if(!G.owlPick&&needsReach(x,y)&&cheb(G.party[0],{x,y})>1){const ok=await walkUpTo(x,y);const torch=G.torches.some(t=>t.x===x&&t.y===y);if(!ok&&!torch){if(mode==="explore")toast("You can't find a way over there.");return;}if(mode!=="explore"||busy||G.over)return;}
  {const d=doorAt(x,y);const L=G.party[0];if(d&&d.open&&!d.burnt&&cheb(L,d)===1&&!unitAt(x,y)){const ft=heroesUp().find(h=>h.id==="fighter");busy=true;try{
      const c=await choose("An open door.",[{t:"CLOSE IT"},{t:"WEDGE IT SHUT",sub:ft?`${ft.name}: jams it so monsters can't open it (you can kick it free)`:"Needs a fighter",dis:!ft},{t:"LEAVE IT OPEN"}]);
      if(c===0||c===1){d.open=false;if(c===1){d.wedged=true;toast("The fighter jams a spike under the door. Nothing's getting through from the other side.");}computeLight();fov();}$("tBox").hidden=true;}finally{busy=false;}return;}}if(G.owlPick){await owlFly(x,y);return;}
  {const t=G.traps.find(q=>q.x===x&&q.y===y&&q.disarmed&&!q.rearmFail);const rg=heroesUp().find(h=>h.id==="rogue");if(t&&rg&&cheb(G.party[0],t)<=1){busy=true;try{const c=await choose(`A disarmed ${TRAPS[t.type].name}. The ${rg.name} could reset it as a trap for monsters.`,[{t:"REARM IT",sub:oddsTag(rg,"thieves",t.dc)},{t:"LEAVE IT"}]);if(c===0)await rearmTrap(rg,t);else $("tBox").hidden=true;}finally{busy=false;}return;}}
  {const bo=G.objs.find(o=>o.burn&&o.x===x&&o.y===y)||(G.fire.has(y*G.W+x)?{x,y}:null);const dr=heroesUp().find(h=>h.id==="druid");if(bo&&dr&&cheb(G.party[0],bo)<=2){busy=true;try{const c=await choose("Flames crackle here. The druid could call water from the stone to put them out.",[{t:"DOUSE THE FLAMES"},{t:"LET IT BURN"}]);if(c===0)await douse(dr,x,y);$("tBox").hidden=true;}finally{busy=false;}return;}}
  const tc=G.torches.find(t=>t.x===x&&t.y===y);if(tc&&G.explored[y]&&G.explored[y][x]){busy=true;try{await torchInteract(tc);}finally{busy=false;}return;}
  const gl=G.dropLights.find(l=>l.x===x&&l.y===y);if(gl&&cheb(G.party[0],gl)<=1){busy=true;try{await groundTorchInteract(gl);}finally{busy=false;}return;}
  const dc=G.objs.find(o=>!o.gone&&o.x===x&&o.y===y&&(o.deco||o.type==="rubble"||o.type==="cavein"));if(dc&&cheb(G.party[0],dc)<=1&&(BLOCKERS[dc.type]||!dc.seen)){busy=true;try{await decoInteract(dc);}finally{busy=false;}return;}
  const cp=(G.corpses||[]).find(c=>c.x===x&&c.y===y);if(cp&&(!cp.searched||(!cp.spoken&&cp.kind==="body"&&heroesUp().some(h=>h.id==="cleric")))&&!monAt(x,y)&&cheb(G.party[0],cp)<=1){busy=true;try{await corpseInteract(cp);}finally{busy=false;}return;}
  if(gnd(x,y)===GROUND.acid&&cheb(G.party[0],{x,y})<=1&&!monAt(x,y)){const opts=heroesUp().filter(h=>!h.coat&&h.id!=="beast");if(opts.length){busy=true;try{
      const c=await choose("A hissing puddle of acid. Someone could dip a weapon in it (one attack's worth before it wears off).",opts.map(h=>({t:h.name.toUpperCase(),sub:`Coat the ${weaponOf(h,"main").name}`})).concat([{t:"LEAVE IT"}]));
      if(c>=0&&c<opts.length){opts[c].coat={name:"acid",type:"acid",dice:"2d4"};toast(`The ${opts[c].name}'s weapon hisses with acid. It'll last for one attack.`);}$("tBox").hidden=true;}finally{busy=false;}return;}}
  const m=monAt(x,y);if(m&&seen(x,y)&&!isHiddenMon(m)){if(m.peace){toast(`The ${m.name} let you pass. Walk into them to start a fight.`);return;}
    const unaware=!noticesParty(m);const rg=heroesUp().find(h=>h.id==="rogue"&&cheb(h,m)<=1);const canPick=rg&&unaware&&!m.picked;
    const c=await choose(`Attack the ${m.name}? ${m.state==="sleep"?"It's asleep: it'll be surprised.":unaware?"It hasn't noticed you: it'll be surprised.":"It's seen you, so no surprise."}${loreBrief(m)}`,[{t:"ATTACK!"},{t:"NOT NOW"}].concat(canPick?[{t:"PICKPOCKET",sub:`${oddsTag(rg,"sleight",monPassive(m)-(m.state==="sleep"?5:0))} · if it notices, it attacks`}]:[]));
    if(c===0){startCombat({bumped:m,partyFirst:true});}else if(c===2&&canPick){busy=true;try{await pickpocket(rg,m);}finally{busy=false;}}else $("tBox").hidden=true;return;}
  const L=G.party[0];if(x===L.x&&y===L.y)return;
  if(!G.explored[y]||!G.explored[y][x]||isWall(x,y))return;
  // 4-way path for the leader
  const W=G.W,start=L.y*W+L.x,goal=y*W+x;const prev=new Map([[start,-1]]);const q=[start];
  while(q.length){const c=q.shift();if(c===goal)break;const cx=c%W,cy=(c/W)|0;for(const [dx,dy] of DIRS4){const nx=cx+dx,ny=cy+dy,k=ny*W+nx;if(prev.has(k)||!inB(nx,ny)||!G.explored[ny][nx])continue;
      const isGoal=k===goal;const dd=doorAt(nx,ny);if(!isGoal&&((!enterable(L,nx,ny)&&!(dd&&!dd.locked))||monAt(nx,ny)||(dd&&dd.locked)))continue;prev.set(k,c);q.push(k);}}
  if(!prev.has(goal))return;const path=[];let k=goal;while(k!==start){path.unshift(k);k=prev.get(k);}
  G.walkTo=goal;for(const s of path){if(mode!=="explore"||G.walkTo!==goal||G.over)break;const sx=s%W,sy=(s/W)|0;const L2=G.party[0];
    await tryMove(sx-L2.x,sy-L2.y);await wait(40);const d2=doorAt(sx,sy);if(d2&&d2.open&&(G.party[0].x!==sx||G.party[0].y!==sy)&&mode==="explore"){await tryMove(sx-G.party[0].x,sy-G.party[0].y);await wait(40);}if(G.party[0].x!==sx||G.party[0].y!==sy)break;}
  G.walkTo=null;}
// ---------- walking up to things, and the A (interact) button ----------
// things you have to be next to before you can use them: tapping one from afar walks the leader over first
function needsReach(x,y){if(!G.explored[y]||!G.explored[y][x])return false;
  if(G.torches.some(t=>t.x===x&&t.y===y)||G.dropLights.some(l=>l.x===x&&l.y===y))return true;
  if(G.traps.some(q=>q.x===x&&q.y===y&&q.disarmed&&!q.rearmFail)&&heroesUp().some(h=>h.id==="rogue"))return true;
  if(G.objs.some(o=>!o.gone&&o.x===x&&o.y===y&&(o.deco||o.type==="rubble"||o.type==="cavein")&&(BLOCKERS[o.type]||!o.seen)))return true;
  if((G.corpses||[]).some(c=>c.x===x&&c.y===y&&!c.searched)&&!monAt(x,y))return true;
  return gnd(x,y)===GROUND.acid&&!monAt(x,y);}
// walk the leader to a square next to (x,y); returns true once they're there
async function walkUpTo(x,y){const L=G.party[0];if(cheb(L,{x,y})<=1)return true;const W=G.W;const start=L.y*W+L.x;const prev=new Map([[start,-1]]);const q=[start];let goal=-1;
  while(q.length){const c=q.shift();const cx=c%W,cy=(c/W)|0;if(c!==start&&Math.max(Math.abs(cx-x),Math.abs(cy-y))<=1&&!(cx===x&&cy===y)){goal=c;break;}
    for(const [dx,dy] of DIRS4){const nx=cx+dx,ny=cy+dy,k=ny*W+nx;if(prev.has(k)||!inB(nx,ny)||!G.explored[ny][nx]||(nx===x&&ny===y))continue;const dd=doorAt(nx,ny);
      if((!enterable(L,nx,ny)&&!(dd&&!dd.locked))||monAt(nx,ny)||(dd&&dd.locked)||gnd(nx,ny)===GROUND.acid||(trapAt(nx,ny)&&trapAt(nx,ny).found))continue;prev.set(k,c);q.push(k);}}
  if(goal<0)return false;const path=[];let k=goal;while(k!==start){path.unshift(k);k=prev.get(k);}
  G.walkTo=goal;for(const s of path){if(mode!=="explore"||G.walkTo!==goal||G.over)break;const sx=s%W,sy=(s/W)|0;const L2=G.party[0];
    await tryMove(sx-L2.x,sy-L2.y);await wait(40);if(G.party[0].x!==sx||G.party[0].y!==sy)break;}
  G.walkTo=null;const L3=G.party[0];if(mode!=="explore"||cheb(L3,{x,y})>1)return false;faceToward(L3,x-L3.x,y-L3.y);return true;}
// what pressing A would do with the square at (x,y): "bump" = walk into it (doors, chests, monsters...), "tap" = use it in place
function aKind(x,y){if(!inB(x,y))return null;const m=monAt(x,y);if(m&&seen(x,y)&&!isHiddenMon(m))return "bump";
  if(G.npc&&G.npc.x===x&&G.npc.y===y)return "bump";const d=doorAt(x,y);if(d&&!d.open)return "bump";if(d&&d.open&&!d.burnt&&!unitAt(x,y))return "tap";
  if(needsReach(x,y))return "tap";const o=objAt(x,y);if(o&&BLOCKERS[o.type])return "bump";const t=trapAt(x,y);if(t&&t.found&&!t.done&&!t.disarmed)return "bump";return null;}
async function pressA(){if(sayState){sayState.skip();return;}if(mode!=="explore"||busy||choosing||!G||G.over||G.demo)return;const L=G.party[0];
  if(G.stairs&&G.stairs.x===L.x&&G.stairs.y===L.y){busy=true;try{await stairsPrompt();}finally{if(mode==="explore")busy=false;}return;}
  const fd=L.face==="b"?[0,-1]:L.face==="f"?[0,1]:[L.flip?-1:1,0];
  const dirs=[fd].concat(DIRS8.filter(d=>d[0]!==fd[0]||d[1]!==fd[1]));
  for(const [dx,dy] of dirs){const x=L.x+dx,y=L.y+dy;const k=aKind(x,y);if(!k)continue;if(k==="bump"&&dx&&dy){if(monAt(x,y)){await exploreTap(x,y);return;}continue;}
    if(k==="bump")await tryMove(dx,dy);else{faceToward(L,dx,dy);await exploreTap(x,y);}return;}
  toast("Nothing to use here. Face a door, chest, torch, body or creature and press A. (SEARCH looks for hidden things.)");}
