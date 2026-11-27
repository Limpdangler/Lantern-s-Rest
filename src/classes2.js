// ================= the Monk, traits, rest tasks, jumping, throwing torches and fire outside combat =================

// ---------- the Monk ----------
DEFAULTS.classes.push({id:"monk",name:"Monk",str:10,dex:16,con:14,int:10,wis:15,cha:8,ac:15,hd:8,dmg:"1d6",range:1,speed:7});
CINFO.monk={atk:{name:"Unarmed Strike",abil:"dex",type:"bludgeoning",finesse:true},alt:{name:"Darts",abil:"dex",dice:"1d4",type:"piercing",range:8,thrown:true,finesse:true},
  saves:["str","dex"],skills:["acrobatics","stealth","insight","athletics"],armour:"none",feats:["martialarts","flurry","patient","stepwind"],spells:[],extra:true,primary:"dex",
  blurb:"Fast and unarmoured (AC from DEX + WIS). Martial Arts: a free extra punch as a bonus action after attacking. Ki powers Flurry of Blows, Patient Defence and Step of the Wind. Deflects arrows; Stunning Strike from level 5."};
LOOKS.monk={skin:"#e8b890",hair:"#2a2420",hs:"topknot",eye:"#4a3a2a",robe:"#d27a2a",arm:"#d27a2a",trim:"#8a3a1a",boots:"#6a4a2a",belt:"#5a2a1a",wpn:"staff"};
RES.ki={name:"Ki",rest:"sr",max:l=>Math.max(2,l)};
Object.assign(FEATS,{
  martialarts:{name:"Martial Arts",cost:"bonus",desc:"Bonus action after you attack: one extra unarmed strike."},
  flurry:{name:"Flurry of Blows",cost:"bonus",res:"ki",desc:"Bonus action after you attack, 1 ki: two extra unarmed strikes."},
  patient:{name:"Patient Defence",cost:"bonus",res:"ki",desc:"Bonus action, 1 ki: Dodge (attacks against you have disadvantage until your next turn)."},
  stepwind:{name:"Step of the Wind",cost:"bonus",res:"ki",desc:"Bonus action, 1 ki: Dash and Disengage at once."},
  shadowstep:{name:"Shadow Step",cost:"bonus",desc:"Bonus action: step from one patch of darkness to another up to 8 squares away; your next melee attack this turn has advantage."},
  handheal:{name:"Hand of Healing",cost:"bonus",res:"ki",desc:"Bonus action, 1 ki: touch an ally (or yourself) to heal 1d6 + WIS."}});
SUBS.monk=[
  {id:"openhand",name:"Way of the Open Hand",desc:"Every Flurry of Blows hit forces a DEX save or the target is knocked prone."},
  {id:"shadow",name:"Way of Shadow",desc:"Shadow Step: teleport between dark squares as a bonus action and strike with advantage. Monks of Shadow also hide well in the dark.",feats:["shadowstep"]},
  {id:"mercy",name:"Way of Mercy",desc:"Hand of Healing: spend ki to heal an ally you touch as a bonus action.",feats:["handheal"]}];
Object.assign(FEAT_RUN,{
  martialarts:async u=>{busy=true;C.bonus=false;C.attacksLeft++;C.weapon="main";await say(`Martial Arts: the ${u.name} follows up with a quick strike.`,650);afterAction();},
  flurry:async u=>{busy=true;C.bonus=false;u.res.ki--;C.attacksLeft+=2;C.weapon="main";C.flurry=true;await say(`Flurry of Blows! Two extra strikes.`,700);afterAction();},
  patient:async u=>{busy=true;C.bonus=false;u.res.ki--;u.st.dodge=true;await say(`Patient Defence: the ${u.name} focuses on dodging.`,700);afterAction();},
  stepwind:async u=>{busy=true;C.bonus=false;u.res.ki--;C.disengaged=true;C.moveLeft+=speedOf(u);refreshReach();await say(`Step of the Wind! ${C.moveLeft} squares of movement, and no opportunity attacks.`,800);afterAction();},
  shadowstep:u=>targetMode({kind:"tile",range:8,label:"Shadow Step: tap a dark, empty square within 8.",onPick:async(x,y)=>{
    if(litAt(x,y)||unitAt(x,y)||isWall(x,y)){prompt("You can only step into darkness, onto an empty square.");afterAction();return;}C.bonus=false;fx.push({type:"ring",u,col:"#6a5aa0",t:now()});u.x=x;u.y=y;u.dx=x*TS;u.dy=y*TS;u.st.shadowAdv=true;fov();await say(`The ${u.name} melts into the shadows and steps out somewhere else.`,800);}}),
  handheal:u=>targetMode({kind:"ally",range:1,label:"Hand of Healing: tap yourself or an ally next to you.",onPick:async(x,y,t)=>{C.bonus=false;u.res.ki--;const n=roll("1d6").total+abm(u,"wis");heal(t,Math.max(1,n));await say(`The ${u.name}'s touch heals the ${t.name} for ${n}.`,800);}})});
effect("monkCombat","Monk: Shadow Step advantage, stunned targets, Open Hand flurries",{
  attackMods:c=>{if(c.a.st.shadowAdv&&c.w.melee)c.adv.push("from the shadows");if(c.t.st.stunned)c.adv.push("stunned");},
  afterAttack:async c=>{if(c.w.melee)delete c.a.st.shadowAdv;},
  afterHit:async c=>{const a=c.a,t=c.t;if(!isHero(a)||a.id!=="monk"||!c.w.melee||c.w.spell||t.hp<=0||t.dead)return;const dc=8+prof()+abm(a,"wis");
    if(a.sub==="openhand"&&C&&C.flurry&&!t.st.prone){const s=saveRoll(t,"dex",dc);if(!s.ok){t.st.prone=true;float(t,"PRONE","#ffffff");}log(`Open Hand: the ${esc(t.name)} ${s.ok?"keeps its feet":"is knocked prone"} (${s.txt}).`,"hit");}
    if(G.level>=5&&(a.res.ki||0)>0&&!t.st.stunned&&t.side==="m"&&C&&!C.stunTried&&await askReact(a,`Stunning Strike on the ${t.name}? (1 ki: CON save or it loses its next turn)`)){C.stunTried=true;a.res.ki--;const s=saveRoll(t,"con",dc);if(!s.ok){t.st.stunned=true;float(t,"STUNNED","#ffe060");}await say(`Stunning Strike! The ${t.name} ${s.ok?"shrugs it off":"is stunned"} (${s.txt}).`,850);}}});
effect("deflectMissiles","Monk: reaction to knock aside an arrow or bolt",{damageIn:async c=>{const u=c.u,src=c.o.src;if(!isHero(u)||u.id!=="monk"||u.wild||!c.o.attack||!src||cheb(src,u)<=1||!canReact(u)||c.n<=0)return;
  if(!await askReact(u,`Deflect Missiles: knock the ${src.name}'s shot aside? (reduces ${c.n} damage by 1d10 + DEX + level)`))return;u.reaction=false;const r=roll("1d10").total+abm(u,"dex")+G.level;c.n=Math.max(0,c.n-r);float(u,c.n?"DEFLECT -"+r:"CAUGHT IT!","#d0e0ff");}});
{const base=conditionTurn;conditionTurn=async u=>{if(u.st.stunned){delete u.st.stunned;float(u,"STUNNED","#ffe060");await say(`The ${u.name} is stunned and loses its turn!`,800);return true;}return base(u);};}

// ---------- traits: small innate perks every hero starts with ----------
const PERKS={
  springheel:{name:"Springheel",desc:"Half damage from falls, bad landings and pit traps; advantage when jumping."},
  reflexes:{name:"Quick Reflexes",desc:"+1 to initiative."},
  lighteater:{name:"Light Eater",desc:"Half the time, a long rest's meal doesn't use up a ration."},
  packmule:{name:"Pack Mule",desc:"The party can carry 5 more."},
  stamina:{name:"Stamina",desc:"The party tires more slowly (a longer walk before each step of fatigue)."},
  keeneyes:{name:"Keen Eyes",desc:"+2 to Perception (spotting traps, lurkers and secret doors)."},
  lightsleeper:{name:"Light Sleeper",desc:"Wakes at the slightest sound: the party is never caught asleep by a camp ambush."},
  thickskin:{name:"Thick Skin",desc:"Take 2 less damage from traps and falls."},
  ironstomach:{name:"Iron Stomach",desc:"Poison damage is halved."},
  quickhands:{name:"Quick Hands",desc:"+2 to picking locks and disarming traps."},
  surefooted:{name:"Surefooted",desc:"Climbing ledges and jumping down never need a check."},
  brave:{name:"Brave",desc:"Shakes off fear at the start of each turn."},
  hardy:{name:"Hardy",desc:"+1 HP per level."},
  fleetfoot:{name:"Fleet of Foot",desc:"+1 square of movement."},
  haggler:{name:"Haggler",desc:"Shops charge 10% less."},
  scholar:{name:"Scholar",desc:"+2 to Arcana, History, Religion and Investigation."}};
const perkOf=(u,k)=>u&&u.side==="h"&&u.perk===k&&!u.dead;
const anyPerk=k=>G&&G.party.some(h=>perkOf(h,k));
{const base=skillBonus;skillBonus=(u,sk)=>{let b=base(u,sk);if(u.side!=="h")return b;
  if(sk==="perception"&&perkOf(u,"keeneyes"))b+=2;if(sk==="thieves"&&perkOf(u,"quickhands"))b+=2;if(["arcana","history","religion","investigation"].includes(sk)&&perkOf(u,"scholar"))b+=2;
  if(sk==="arcana"&&u.task==="study")b+=1;return b;};}
{const base=packCap;packCap=()=>base()+5*G.party.filter(h=>perkOf(h,"packmule")).length;}
{const base=speedOf2;speedOf2=u=>base(u)+(perkOf(u,"fleetfoot")?1:0);}
{const base=rollInit;rollInit=(u,b)=>base(u,b+(perkOf(u,"reflexes")?1:0)+(u.task==="meditate"?1:0));}
{const base=shopPrice;shopPrice=id=>Math.max(1,Math.round(base(id)*(anyPerk("haggler")?.9:1)));}
{const base=applyLevel;applyLevel=(h,init)=>{const before=h.maxHp;base(h,init);if(perkOf(h,"hardy")){h.maxHp+=G.level;if(!init&&!h.dead&&before)h.hp=Math.min(h.maxHp,h.hp+G.level);else if(init)h.hp=h.maxHp;}};}
const fatigueStep=()=>120+20*Math.min(2,G.party.filter(h=>perkOf(h,"stamina")).length);
effect("perkDamage","Traits: Springheel, Thick Skin, Iron Stomach",{damageIn:async c=>{const u=c.u;if(!isHero(u))return;
  if((c.o.fall||c.o.trap)&&perkOf(u,"springheel")&&c.o.fall)halve(c,"springheel");if((c.o.fall||c.o.trap)&&perkOf(u,"thickskin"))c.n=Math.max(0,c.n-2);
  if(c.type==="poison"&&perkOf(u,"ironstomach"))halve(c,"iron stomach");}});
async function chooseTraits(){if(!G)return;for(const h of G.party){if(h.dead||h.id==="beast"||h.perk)continue;const keys=Object.keys(PERKS);
  const c0=await choose(`Every hero has a small trait of their own. How should the ${h.nick||h.name} the ${h.name} get theirs?`,[{t:"ROLL ONE AT RANDOM"},{t:"CHOOSE IT"}]);
  let k;if(c0===1){const c=await choose(`Choose a trait for the ${h.name}:`,keys.map(k=>({t:PERKS[k].name.toUpperCase(),sub:PERKS[k].desc})));k=keys[Math.max(0,c)];}else k=pick(keys);
  h.perk=k;applyLevel(h,false);log(`${esc(h.nick||h.name)} the ${esc(h.name)}: trait <b>${esc(PERKS[k].name)}</b>. ${esc(PERKS[k].desc)}`,"lv");if(c0!==1)toast(`${h.name}'s trait: ${PERKS[k].name}. ${PERKS[k].desc}`);}
  $("tBox").hidden=true;hud();}
async function newHeroPrompts(){await humanFeats();await chooseTraits();for(const h of G.party)if(h.id==="ranger"&&!h.favored&&!h.dead)await chooseFavored(h);}

// ---------- rest tasks: what each class does while the others rest ----------
// On a long rest everyone does theirs. On a short rest, only heroes healthy enough not to need a Hit Die do (the rest are busy bandaging).
// The benefit lasts until the next rest.
const TASKS={fighter:{id:"kit",name:"Kit maintained",fx:"+1 AC",line:h=>`The ${h.name} oils and tightens every strap of their armour (+1 AC until the next rest).`},
  barbarian:{id:"hone",name:"Weapon honed",fx:"+1 melee damage",line:h=>`The ${h.name} hones their weapon to a wicked edge (+1 melee damage until the next rest).`},
  wizard:{id:"study",name:"Studied",fx:"+1 spell attacks & Arcana",line:h=>`The ${h.name} pores over their spellbook (+1 to spell attacks and Arcana until the next rest).`},
  druid:{id:"herbs",name:"Components gathered",fx:"+1 spell save DC",line:h=>`The ${h.name} gathers fresh moss, bark and bone for their spells (+1 spell save DC until the next rest).`},
  ranger:{id:"fletch",name:"Arrows fletched",fx:"new arrows",line:(h,n)=>`The ${h.name} fletches ${n} new arrows.`},
  cleric:{id:"pray",name:"Prayed",fx:"party +1 to saves",line:h=>`The ${h.name} kneels in prayer (the whole party gets +1 to saving throws until the next rest).`},
  rogue:{id:"picks",name:"Lockpick made",fx:"spare lockpick",line:h=>`The ${h.name} files a spare lockpick out of a bent nail (one extra try on a lock that beat you).`},
  monk:{id:"meditate",name:"Meditated",fx:"+1 ki, +1 initiative",line:h=>`The ${h.name} meditates (+1 ki and +1 initiative until the next rest).`}};
ITEMS.lockpick={name:"Spare Lockpick",kind:"keep",price:5,floor:1,w:0,desc:"Lets you try a lock again after a failed attempt."};WEIGHT.lockpick=0;
function doTask(h){const T=TASKS[h.id];if(!T||h.dead||h.wild)return null;h.task=T.id;
  if(T.id==="fletch"){const n=rnd(4)+2;addItem("arrows",n);return T.line(h,n);}
  if(T.id==="picks"){if((G.bag.lockpick||0)<2)addItem("lockpick");}
  if(T.id==="meditate")h.res.ki=(h.res.ki||0)+1;return T.line(h);}
{const base=shortRest;shortRest=async function(){const before=new Map(G.party.map(h=>[h,h.hdLeft]));for(const h of G.party)h.task=null;await base();
  const lines=[];for(const h of G.party){if(h.dead||h.down)continue;if(h.hdLeft===before.get(h)){const l=doTask(h);if(l)lines.push(l);}}
  if(lines.length)await say(lines.join(" "),1800,true);};}
{const base=applyLongRest;applyLongRest=async camp=>{for(const h of G.party)h.task=null;const out=await base(camp);for(const h of G.party){const l=doTask(h);if(l)out.push(l);}return out;};}
effect("taskBuffs","Rest tasks: honed weapons and studied spells",{onHit:async c=>{if(isHero(c.a)&&c.a.task==="hone"&&c.w.melee&&!c.w.spell){c.total+=1;c.parts.push("+1 honed");}},
  attackMods:c=>{if(isHero(c.a)&&c.a.task==="study"&&c.w.spell){c.bonus+=1;c.notes.push("studied +1");}}});
const prayerUp=()=>G&&G.party.some(h=>h.task==="pray"&&!h.dead&&!h.down);

// ---------- armour off: put it back on in a fight instead of your action ----------
function armourButtons(u){if(!u.armourOff||u.wild)return [];return [{t:"PUT ARMOUR ON",icon:"shield",sub:"Action · back to full AC",cost:"action",dis:!hasAction()||C.attacksLeft>0,f:async()=>{busy=true;C.actions--;u.armourOff=false;await say(`The ${u.name} hauls their armour on and buckles up. (AC ${acOf(u)})`,850);afterAction();}}];}

// ---------- resting behind a closed door is safer ----------
function roomOfParty(){const L=G.party[0];return G.rooms.find(r=>L.x>=r.x&&L.x<r.x+r.w&&L.y>=r.y&&L.y<r.y+r.h)||null;}
function doorSafety(){const r=roomOfParty();if(!r)return {mult:1,why:""};const ent=entrances(r);if(!ent.length)return {mult:1,why:""};
  const doors=ent.map(e=>doorAt(e.x,e.y));if(doors.some(d=>!d||d.open||d.burnt))return {mult:1,why:""};
  const locked=doors.every(d=>d.locked||d.wedged);return locked?{mult:.3,why:"behind locked doors"}:{mult:.5,why:"behind closed doors"};}
{const base=campRisk;campRisk=type=>base(type)*doorSafety().mult;}

// ---------- jumping over a hazard (acid, a trap) ----------
async function jumpOver(dx,dy){const L=G.party[0];const hx=L.x+dx,hy=L.y+dy,tx=L.x+2*dx,ty=L.y+2*dy;
  const free=(x,y)=>inB(x,y)&&!isWall(x,y)&&!unitAt(x,y)&&!blocksObj(x,y)&&!(doorAt(x,y)&&!doorAt(x,y).open)&&gnd(x,y)!==GROUND.acid&&!(trapAt(x,y)&&!trapAt(x,y).done&&trapAt(x,y).found)&&elevAt(x,y)===elevAt(L.x,L.y)&&gnd(x,y)!==GROUND.deep;
  if(!free(tx,ty)){toast("There's nowhere safe to land on the other side.");return;}
  const W=G.W;const near=[];const seenT=new Set([ty*W+tx,hy*W+hx]);const q=[[tx,ty]];
  while(q.length&&near.length<G.party.length+2){const [x,y]=q.shift();for(const [a,b] of DIRS4){const nx=x+a,ny=y+b,k=ny*W+nx;if(seenT.has(k))continue;seenT.add(k);if(free(nx,ny)){near.push([nx,ny]);q.push([nx,ny]);}}}
  const hazardTrap=trapAt(hx,hy);const lines=[];let k=0;
  for(const h of G.party){if(h.dead)continue;if(h.down){toast("You can't jump with someone who's down.");return;}}
  for(const h of G.party){if(h.dead)continue;const sure=perkOf(h,"surefooted")||(h.wild&&["wolf","spider","cat"].includes(h.wild.form));const adv=perkOf(h,"springheel");
    const r=sure?{ok:true,txt:"surefooted"}:await check(h,"athletics",10,{quiet:true,adv});const [px,py]=h===L?[tx,ty]:(near[k++]||[tx,ty]);
    if(r.ok){h.x=px;h.y=py;}else{h.x=hx;h.y=hy;lines.push(`The ${h.name} comes up short and lands in it! (${r.txt})`);}
    h.dx=h.x*TS;h.dy=h.y*TS;}
  fov();computeLight();hud();
  for(const h of G.party){if(h.dead||h.x!==hx||h.y!==hy)continue;
    if(hazardTrap&&!hazardTrap.done){await triggerTrap(hazardTrap,h);}else if(gnd(hx,hy)===GROUND.acid){await dealDamage(h,roll("1d6").total,"acid",{});}
    const spot=near[k++];if(spot&&!h.dead&&!h.down){h.x=spot[0];h.y=spot[1];h.dx=h.x*TS;h.dy=h.y*TS;}}
  await say(lines.length?lines.join(" "):`The party leaps over it, one by one.`,1100,true);$("tBox").hidden=true;G.steps+=1;fov();hud();}

// ---------- aiming outside combat: throwing a torch, or a wizard's Fire Bolt ----------
async function fireOnTile(x,y,by){let what=[];
  for(const o of G.objs){if(o.gone||o.x!==x||o.y!==y)continue;if(o.type==="barrel"){await breakBarrel(o,true,0,0);what.push("the barrel bursts into flames");}else if(isWooden(o)&&!o.burn){setAlight(o);what.push(`the ${o.type==="door"?"door":o.type==="web"?"web":"wood"} catches fire`);}}
  if(gnd(x,y)===GROUND.oil){igniteAt(x,y);what.push("the oil goes up");}
  if(what.length)await scorch();
  const t=G.torches.find(q=>q.x===x&&q.y===y);if(t&&t.out){t.out=false;what.push("the wall torch flares back to life");}
  return what;}
async function aimAt(x,y){const a=G.aim;G.aim=null;const h=a.by;const range=a.kind==="torch"?6:12;
  if(cheb(h,{x,y})>range||!los(h.x,h.y,x,y)){toast("You can't hit that from here.");return;}
  if(monAt(x,y)&&!monAt(x,y).peace){toast("To attack a creature, tap it to start a fight.");return;}
  busy=true;try{if(a.kind==="torch"){takeItem("torch");fx.push({type:"shot",from:{x:h.x,y:h.y},to:{x,y},t:now(),col:"#ffb040"});await wait(250);G.dropLights.push({x,y});
      const what=await fireOnTile(x,y,h);if(what.length)G.dropLights.pop();makeNoise(x,y,4);await say(what.length?`The torch tumbles end over end and lands: ${what.join(", ")}. The torch burns away with them.`:"The torch tumbles end over end and lands, lighting up the floor.",1200,true);}
    else{fx.push({type:"shot",from:{x:h.x,y:h.y},to:{x,y},t:now(),col:"#ff8030"});await wait(250);const what=await fireOnTile(x,y,h);makeNoise(x,y,6);
      await say(what.length?`Fire Bolt! ${cap(what.join(", "))}.`:"The Fire Bolt splashes harmlessly against the stone.",1100,true);}
  }finally{busy=false;}$("tBox").hidden=true;computeLight();fov();hud();}
function aimButtons(h){const A=[];if(G.party[0]!==h)return A;
  if((G.bag.torch||0)>0)A.push({t:"THROW A TORCH",sub:`Light up a spot up to 6 squares away; sets oil, wood and webs alight · ${G.bag.torch} left`,f:()=>{G.aim={kind:"torch",by:h};closeMenu();toast("Tap where to throw the torch (up to 6 squares).");}});
  return A;}
function wizardFire(h){if(h.id!=="wizard"||h.wild)return [];return [{t:"FIRE BOLT",sub:"Cantrip: set fire to a door, barrel, web or oil, or relight a torch, up to 12 squares away",f:()=>{G.aim={kind:"firebolt",by:h};closeMenu();toast("Tap what to set alight (up to 12 squares).");}}];}
{const base=classActions;classActions=h=>{const A=base(h);if(h.dead||h.down||mode!=="explore")return A;return A.concat(wizardFire(h),aimButtons(h));};}

// ---------- stomping out fire ----------
const stompable=(x,y)=>G.fire.has(y*G.W+x)&&!G.objs.some(o=>!o.gone&&o.burn&&o.x===x&&o.y===y);
function stompFire(x,y){G.fire.delete(y*G.W+x);if(gnd(x,y)===GROUND.oil){G.ground[y][x]=0;buildTerrain();}computeLight();fov();}
function stompButtons(u){if(!DIRS8.some(([a,b])=>stompable(u.x+a,u.y+b))&&!stompable(u.x,u.y))return [];
  return [{t:"STOMP OUT FIRE",icon:"fire",sub:"Action · put out a burning square next to you",cost:"action",dis:!hasAction()||C.attacksLeft>0,f:()=>targetMode({kind:"tile",range:1,empty:false,label:"Stomp out which burning square?",onPick:async(x,y)=>{if(!stompable(x,y)){prompt("That square isn't burning (or it's a burning object you can't stomp).");afterAction();return;}C.actions--;stompFire(x,y);await say(`The ${u.name} stamps the flames out.`,700);}})}];}
// ---------- mimics caught in a fire reveal themselves ----------
async function scorchMimics(){for(const o of G.objs){if(o.type!=="chest"||!o.mimic||o.gone)continue;if(![[0,0]].concat(DIRS8).some(([a,b])=>G.fire.has((o.y+b)*G.W+(o.x+a))))continue;
  o.gone=true;const mm=mkMon(MIMIC,o.x,o.y);mm.gid=999;mm.state="combat";G.mons.push(mm);fx.push({type:"flash",u:mm,t:now()});
  await say("The chest shrieks as the flames lick at it and sprouts teeth: it's a MIMIC!",1200,true);await dealDamage(mm,roll("2d6").total,"fire",{});
  if(mm.hp>0){if(C){mm.inCombat=true;rollInit(mm,abm(mm,"dex"));C.units.push(mm);renderStrip();}else{busy=false;startCombat({extra:[mm]});}}}}
{const base=scorch;scorch=async()=>{await base();await scorchMimics();};}

function saveOdds(u,a,dc){const need=dc-saveBonus(u,a);const p=Math.max(5,Math.min(95,(21-need)*5));return `${p}% chance`;}
