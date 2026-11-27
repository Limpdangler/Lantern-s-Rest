// ================= chests: locks, iron bands, empty ones and junk, smashing and burning, all kinds of traps =================
const CHEST_TRAPS={needle:"a poison needle in the lock",dart:"a dart launcher behind the keyhole",fire:"a flask of alchemist's fire wired to the lid",gas:"a glass vial of poison gas under the lid",
  rocks:"a tripwire linked to loose stones in the ceiling",bells:"a string of bells wired to the hinges"};
const JUNK=["a moth-eaten cloak, a cracked compass and a jar of buttons","three left boots, none of which match","a stack of love letters, signed only 'B'","rusted cutlery and a chipped teapot",
  "a mouldy loaf that might once have been bread","a dozen wooden toy soldiers, most missing their heads","a broken lute with two strings","a bag of smooth river pebbles","an unfinished, very bad painting of a horse",
  "a rusty helmet with a hole right through it","a pile of rags and a dead rat","a ledger of debts, mostly unpaid"];
function kitChest(o){if(o.kitted||o.type!=="chest")return;o.kitted=true;const f=G.floor;
  if(o.vault){o.armoured=true;o.locked=Math.random()<.5;o.lockDc=14+Math.floor(f/2);return;}
  o.armoured=Math.random()<.22;o.locked=Math.random()<(o.armoured?.6:.3);o.lockDc=12+Math.floor(f/2)+(o.armoured?1:0);
  if(o.trap&&!o.trap.kind)o.trap.kind="needle";
  if(!o.trap&&!o.mimic&&Math.random()<(o.locked?.3:.18))o.trap={dc:12+Math.floor(f/2),kind:pick(Object.keys(CHEST_TRAPS))};
  else if(o.trap)o.trap.kind=pick(Object.keys(CHEST_TRAPS));
  if(o.mimic)return;const q=Math.random();
  if(o.locked){if(q<.08)o.loot={gold:0,items:[]};else if(q<.2){o.loot={gold:ri(0,3)*f,items:[]};o.junk=pick(JUNK);}
    else{o.loot=rollLoot(Math.random()<.35);o.loot.gold=Math.round(o.loot.gold*1.5);}}
  else{if(q<.15)o.loot={gold:0,items:[]};else if(q<.35){o.loot={gold:Math.random()<.5?ri(1,4)*f:0,items:[]};o.junk=pick(JUNK);}}}
{const base=placeDressing;placeDressing=function(){base();for(const o of G.objs)if(o.type==="chest")kitChest(o);};}
// ---------- traps ----------
async function chestTrap2(o,h){const t=o.trap;o.trap=null;o.trapFound=false;const dc=t.dc;const N=trapN();
  if(t.kind==="needle"||!t.kind){const s=saveRoll(h,"con",dc);const dm=roll(`${N+1}d4`).total;await say(`A needle jabs out of the lock! (${s.txt})`,1000,true);await dealDamage(h,s.ok?Math.floor(dm/2):dm,"poison",{});if(!s.ok&&!h.down)h.st.poisoned=3;}
  else if(t.kind==="dart"){const r=rnd(20)+4;fx.push({type:"shot",from:{x:o.x,y:o.y},to:{x:h.x,y:h.y},t:now(),col:"#d0d0d0"});await say(`A dart shoots out of the keyhole at the ${h.name}: ${r} vs AC ${acOf(h)}. ${r>=acOf(h)?"Hit!":"Miss!"}`,1000,true);
    if(r>=acOf(h)){await dealDamage(h,roll(`${N}d6`).total,"piercing",{trap:true});const s=saveRoll(h,"con",dc);if(!s.ok&&!h.down){h.st.poisoned=3;await say(`It was poisoned! (${s.txt})`,800,true);}}}
  else if(t.kind==="fire"){fx.push({type:"boom",x:o.x,y:o.y,t:now()});await say("WHOOMPH! Alchemist's fire bursts from under the lid!",1000,true);
    for(const v of heroesUp().filter(v=>cheb(v,o)<=1)){const s=await dodgeRoll(v,dc);const d=roll(`${N+1}d6`).total;log(`${esc(v.name)}: ${s.txt}.`,"hurt");await dealDamage(v,s.ok?Math.floor(d/2):d,"fire",{});}
    if(!o.armoured&&!o.burn)setAlight(o);}
  else if(t.kind==="gas"){await say("Glass cracks inside the lid, and a cloud of sickly green gas billows out!",1100,true);
    for(const v of heroesUp().filter(v=>cheb(v,o)<=2)){const s=saveRoll(v,"con",dc);log(`${esc(v.name)}: ${s.txt}.`,"hurt");await dealDamage(v,s.ok?Math.floor(roll(`${N}d6`).total/2):roll(`${N}d6`).total,"poison",{});if(!s.ok&&!v.down)v.st.poisoned=3;}}
  else if(t.kind==="rocks"){cam.shake=now();await say("Something twangs inside the chest, and stones crash down from the ceiling!",1000,true);const s=await dodgeRoll(h,dc);await dealDamage(h,s.ok?Math.floor(roll(`${N+1}d6`).total/2):roll(`${N+1}d6`).total,"bludgeoning",{});
    for(const [dx,dy] of DIRS4){const x=h.x+dx,y=h.y+dy;if(!isWall(x,y)&&!objAt(x,y)&&gnd(x,y)===0&&Math.random()<.5)G.ground[y][x]=GROUND.rubble;}buildTerrain();}
  else if(t.kind==="bells"){makeNoise(o.x,o.y,30);for(const m of G.mons)if(m.hp>0&&!m.peace&&cheb(m,o)<=20&&m.state==="sleep")m.state="investigate";await say("Bells jangle wildly inside the lid! The racket echoes through the whole floor. Everything nearby is awake now.",1400,true);}
  hud();}
// ---------- the menu ----------
function chestDesc(o){let d=o.armoured?"A heavy chest bound in iron bands.":"A wooden chest.";if(o.locked&&!o.picked)d+=" It's locked.";if(o.suspicious)d+=" Something about it seems... alive.";
  if(o.trapFound&&o.trap)d+=` You've spotted ${CHEST_TRAPS[o.trap.kind]||"a trap"}.`;else if(o.checked)d+=" You checked it for traps and found nothing.";return d;}
async function chestInteract(o){kitChest(o);const th=bestAt("thieves"),inv=bestAt("investigation");const fuel=(G.bag.oil||0)>0||(G.bag.torch||0)>0;
  const locked=o.locked&&!o.picked;
  const opts=[];
  opts.push(locked?{t:"PICK THE LOCK",k:"pick",sub:o.pickFail?"Too tricky for you":`Thieves' Tools DC ${o.lockDc} · ${oddsTag(th,"thieves",o.lockDc)}${toolNote(th)}`,dis:!!o.pickFail}:{t:"OPEN IT",k:"open"});
  if(!o.checked)opts.push({t:"CHECK FOR TRAPS",k:"check",sub:`Investigation · ${inv.name}`});
  if(o.trapFound&&o.trap)opts.push({t:"DISARM THE TRAP",k:"disarm",sub:o.trapFail?"You already tried":`Thieves' Tools DC ${o.trap.dc} · ${oddsTag(th,"thieves",o.trap.dc)}${toolNote(th)}`,dis:!!o.trapFail});
  if(!o.armoured){opts.push({t:"SMASH IT OPEN",k:"smash",sub:"Very loud · anything fragile inside may break"});opts.push({t:"BURN IT",k:"burn",sub:fuel?"Uses a torch or oil · smoke and light draw attention · most of what's inside will burn":"Needs a torch or oil",dis:!fuel});}
  opts.push({t:"LEAVE IT",k:"leave"});
  const c=await choose(chestDesc(o),opts);$("tBox").hidden=true;const k=(opts[c]||{}).k;if(!k||k==="leave")return;
  if(k==="check"){o.checked=true;G.steps+=2;const r=await check(inv,"investigation",o.trap?o.trap.dc:12);
    if(o.trap&&r.ok){o.trapFound=true;await say(`The ${inv.name} finds ${CHEST_TRAPS[o.trap.kind]}! (${r.txt})`,1400,true);}else await say(`The ${inv.name} runs careful fingers over the lid and lock, and finds nothing. (${r.txt})`,1300,true);
    $("tBox").hidden=true;return chestInteract(o);}
  if(k==="disarm"){const r=await check(th,"thieves",o.trap.dc);if(r.ok){o.trap=null;o.trapFound=false;await say(`Disarmed. (${r.txt})`,900,true);}
    else if(r.total<=o.trap.dc-5){await say(`Oops. (${r.txt})`,600,true);await chestTrap2(o,th);}else{o.trapFail=true;await say(`Too fiddly. You daren't keep trying. (${r.txt})`,1000,true);}$("tBox").hidden=true;return;}
  if(k==="pick"){if(o.mimic){await mimicWakes(o,"As the pick scrapes inside the lock, the keyhole bites down. The chest sprouts teeth: a MIMIC!");return;}
    const r=await check(th,"thieves",o.lockDc);G.steps+=3;if(!r.ok){o.pickFail=true;await say(`The lock won't give. (${r.txt})`,1000,true);if(o.trap&&r.total<=o.lockDc-5){await chestTrap2(o,th);}$("tBox").hidden=true;return;}
    o.picked=true;await say(`Click. The lock opens. (${r.txt})`,900,true);$("tBox").hidden=true;return chestInteract(o);}
  if(k==="open"){if(o.mimic){await mimicWakes(o,"The chest sprouts teeth and lunges! It's a MIMIC!",true);return;}if(o.trap)await chestTrap2(o,G.party[0]);if(G.party[0].dead)return;await chestLoot(o,0);return;}
  if(k==="smash"){if(o.mimic){await mimicAmbushed(o);return;}makeNoise(o.x,o.y,16);cam.shake=now();G.steps+=3;await say("CRASH! You smash the chest apart. The noise echoes down the tunnels.",1100,true);
    if(o.trap&&Math.random()<.5)await chestTrap2(o,G.party[0]);else o.trap=null;await chestLoot(o,.6);o.gone=true;return;}
  if(k==="burn"){if(G.bag.oil)takeItem("oil");else takeItem("torch");if(o.mimic){G.fire.set(o.y*G.W+o.x,3);computeLight();await scorchMimics();return;}
    o.trap=null;setAlight(o);o.burning=true;toast("The chest catches. It'll take a little while to burn through. Smoke and light spread through the dark...");hud();return;}}
async function mimicWakes(o,msg,surprise){o.gone=true;const mm=mkMon(MIMIC,o.x,o.y);mm.gid=999;mm.state="combat";G.mons.push(mm);fx.push({type:"flash",u:mm,t:now()});
  await say(msg,1200,true);if(surprise)G.party.forEach(h=>{if(!h.dead)h.st.surprised=true;});busy=false;startCombat({extra:[mm]});}
const RUIN={potion:"shatters",gpotion:"shatters",oil:"shatters",antitoxin:"shatters",poisonvial:"shatters",scroll:"is torn to shreds"};
async function chestLoot(o,breakChance){o.opened=true;const got=[],lost=[];if(o.loot.gold){G.gold+=o.loot.gold;got.push(`${o.loot.gold} gold`);}
  for(const id of o.loot.items){if(Math.random()<breakChance){lost.push(`the ${itemName(id).toLowerCase()} ${RUIN[id]||(/^scroll/.test(id)?"is torn to shreds":ITEMS[id].kind==="gear"?"is smashed beyond use":"is ruined")}`);continue;}addItem(id);got.push(itemName(id));}
  if(o.loot.items.length&&got.length)approve("chest");let txt;
  if(!o.loot.gold&&!o.loot.items.length&&!o.junk)txt=pick(["Empty. Just dust and a dead spider.","Empty. Someone cleaned it out long ago.","Nothing inside but a smell of old cheese."]);
  else txt=`${o.junk?`Inside: ${o.junk}. Worthless.`:""}${got.length?` ${o.junk?"Also":"Inside the chest"}: ${got.join(", ")}!`:""}${lost.length?` Sadly, ${lost.join(", ")}.`:""}`.trim();
  if(got.length)log(`Chest: ${got.map(esc).join(", ")}.`,"gold");await say(txt,1800,true);$("tBox").hidden=true;hud();}
{const base=interact;interact=async function(o){if(o.type==="chest"&&!o.opened&&!o.burn&&!noHands()){await chestInteract(o);return;}if(o.type==="chest"&&o.burn){toast("The chest is burning. Wait for it to burn through.");return;}return base(o);};}
// a burning chest: some of what's inside might survive the flames
{const base=burnObjects;burnObjects=function(){for(const o of G.objs){if(o.type!=="chest"||!o.burn||o.gone||o.burn>1||o.opened)continue;const L=G.party[0];
    const keep=(o.loot&&o.loot.items||[]).filter(()=>Math.random()<.2);for(const id of keep){const p=[[0,0]].concat(DIRS8).map(([a,b])=>({x:o.x+a,y:o.y+b})).find(q=>!isWall(q.x,q.y)&&!blocksObj(q.x,q.y)||q.x===o.x&&q.y===o.y);G.items.push({x:p.x,y:p.y,item:id});}
    if(keep.length)log(`Something survived the burning chest: ${keep.map(itemName).map(esc).join(", ")}.`,"gold");else if(o.loot&&o.loot.items.length)log("Whatever was in the chest burned away.","miss");}
  base();};}
// iron bands and padlocks are drawn on the chest
{const base=drawObj;drawObj=function(o,sx,sy,t){base(o,sx,sy,t);if(o.type!=="chest"||o.opened||o.burn||o.gone)return;const X=Math.round(sx),Y=Math.round(sy);
  if(o.armoured){ctx.fillStyle="#5a5a64";ctx.fillRect(X+3,Y+4,2,10);ctx.fillRect(X+11,Y+4,2,10);ctx.fillStyle="#8a8a96";ctx.fillRect(X+3,Y+4,1,10);ctx.fillRect(X+11,Y+4,1,10);}
  if(o.locked&&!o.picked){ctx.fillStyle="#1a1216";ctx.fillRect(X+6,Y+7,4,5);ctx.fillStyle="#d8b040";ctx.fillRect(X+7,Y+8,2,3);ctx.fillStyle="#1a1216";ctx.fillRect(X+7,Y+9,2,1);}};}
