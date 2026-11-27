// ================= 5e exploration: searching, stealth & surprise, lore, light, exhaustion, camping =================
// ---------- areas: you get one search per room (corridors are split into 6×6 chunks) ----------
function areaKey(x,y){const r=roomOf(x,y);if(r)return "r"+G.rooms.indexOf(r);return "c"+Math.floor(x/6)+","+Math.floor(y/6);}

// ---------- exhaustion (5e 2024: −2 to every d20 roll and −1 square of speed per level; level 6 is death) ----------
const exhOf=u=>u&&u.side==="h"?(u.exh||0):0;
async function addExh(h,n,why){if(!h||h.dead)return;h.exh=Math.min(6,(h.exh||0)+n);float(h,"EXHAUSTION "+h.exh,"#ffb070");
  log(`${esc(h.name)} gains exhaustion (${esc(why)}): level ${h.exh}/6.`,"hurt");
  if(h.exh>=6){await say(`${h.name} collapses from utter exhaustion and does not get up again.`,1500,true);await heroDies(h);}hud();}
function reduceExh(h){if(h.exh>0)h.exh--;}
async function partyWeary(){// called when weariness (G.fatigue) goes up
  if(!S.rules.fatigue)return;if(G.fatigue===3)toast("The party is Tired. You can make camp for a long rest now.");
  if(G.fatigue>=6){for(const h of G.party)if(!h.dead)await addExh(h,1,"pushing on without sleep");toast("You've gone too long without sleep. Everyone gains a level of exhaustion!");}}

// ---------- stealth & noticing ----------
const monPassive=m=>10+skillBonus(m,"perception");
const monStealth=m=>abm(m,"dex")+(m.tr.stealthy?4:0);
function heroDV(h){return !!(h&&h.race&&RACES[h.race]&&RACES[h.race].dv);}
// each hero rolls Stealth once per room while sneaking; the roll stands until you reach a new area
function rollSneak(){const L=G.party[0];G.sneakArea=areaKey(L.x,L.y);const bits=[];
  for(const h of heroesUp()){const adv=!!gearFx(h).stealth||h.sub==="gloom"||(h.id==="rogue"&&!litAt(h.x,h.y)),dis=!!(h.info.stealthDis&&!h.wild&&!h.armourOff);const d=d20(adv&&!dis,dis&&!adv);
    h.sneak=d.r+skillBonus(h,"stealth")-2*exhOf(h);bits.push(`${h.name} ${h.sneak}`);}
  log(`Sneaking. Stealth rolls: ${bits.map(esc).join(", ")}.`,"miss");}
function toggleSneak(force){if(!G||G.demo||G.over)return;if(mode!=="explore"||busy){if(force===undefined)return;}
  G.sneak=force!==undefined?force:!G.sneak;if(G.sneak)rollSneak();else for(const h of G.party)h.sneak=0;
  toast(G.sneak?"Sneaking: slower, quieter. Enemies must beat your Stealth with their Perception to notice you. Half the party has to pass.":"No longer sneaking.");hud();}
// does monster m notice the party right now?
function noticesParty(m){if(m.peace||m.hp<=0)return false;const up=heroesUp();const vis=up.filter(h=>monsterSees(m,h));if(!vis.length)return false;
  if(!G.sneak)return m.state!=="sleep"||vis.some(h=>cheb(h,m)<=1);
  const pp=monPassive(m)-(m.state==="sleep"?5:0);let pass=0;
  for(const h of up){if(!vis.includes(h)){pass++;continue;}const dark=!litAt(h.x,h.y)&&cheb(h,m)>1;if((h.sneak||0)>=pp-(dark?5:0))pass++;}
  return pass*2<up.length;}
// hidden lurkers: drawn only once someone's passive Perception beats their Stealth
function spotLurkers(){for(const m of G.mons){if(!m.lurk||m.spotted||m.hp<=0||!seen(m.x,m.y))continue;
    for(const h of heroesUp()){const pp=passive(h,"perception")-2*exhOf(h)-(!litAt(m.x,m.y)&&!heroDV(h)?5:0);if(pp>=m.hide||cheb(h,m)<=1){m.spotted=true;
      toast(`The ${h.name} spots ${aN(m.name)} lurking in the shadows!`);log(`${esc(h.name)} spots a hidden ${esc(m.name)} (Passive Perception ${pp} vs Stealth ${m.hide}).`,"gold");break;}}}}
const isHiddenMon=m=>m.lurk&&!m.spotted;
// when monsters strike first, heroes who don't notice them are surprised
function surpriseHeroes(mons){mons=mons||[];const unseen=mons;if(!unseen.length)return [];// only creatures lying in wait get here
  const best=Math.max(...unseen.map(m=>m.lurk?m.hide:rnd(20)+monStealth(m)));const out=[];
  for(const h of heroesUp()){const dark=unseen.every(m=>!litAt(m.x,m.y))&&!heroDV(h);const pp=passive(h,"perception")-exhPen(h,h.info.skills.includes("perception"))-(dark?5:0);
    if(pp<best&&!hasFeat(h,"alert")){h.st.surprised=true;out.push(h.name);}}
  log(`Surprise! Enemy Stealth ${best} vs your Passive Perception.${out.length?" Caught off guard: "+out.map(esc).join(", ")+".":" Nobody is caught off guard."}`,"hurt");return out;}

// ---------- monster lore: History, Nature, Religion or Arcana the first time you see a kind of monster ----------
const LORE_SK={rat:"nature",wolf:"nature",spider:"nature",ooze:"nature",mimic:"nature",kobold:"history",goblin:"history",archer:"history",shaman:"history",goblinboss:"history",orc:"history",ogre:"history",skeleton:"religion",bonearcher:"religion"};
function loreFacts(m){const t=m.tr,f=[];if(t.vuln)f.push("weak to "+t.vuln.join("/"));if(t.resist)f.push("resists "+t.resist.join("/"));if(t.immune)f.push("immune to "+t.immune.join("/"));
  if(t.pack)f.push("pack tactics (gangs up)");if(t.trip)f.push("bite knocks prone");if(t.web)f.push("spits webs");if(t.poison)f.push("venomous");if(t.split)f.push("splits when slashed");
  if(t.healer)f.push("heals allies");if(t.redirect)f.push("yanks minions in the way");if(t.morale)f.push("may flee when its leader falls");if(t.nimble)f.push("slips away without opportunity attacks");
  if(t.undead)f.push("undead: Turn Undead works");if(t.aggressive)f.push("charges");if(t.shover)f.push("shoves into hazards");if(t.dv)f.push("sees in the dark");if(t.keen)f.push("keen senses");if(t.stealthy)f.push("good at hiding");
  return f.length?f.join(", "):"nothing special";}
const loreKnown=m=>m.side==="m"&&G.lore&&G.lore[m.key]===true;
const loreBrief=m=>m.side!=="m"?"":loreKnown(m)?` Known: ${loreFacts(m)}.`:" (You don't know much about these.)";
async function loreCheck(){if(!G||G.demo||!G.lore)return;
  for(const m of G.mons){if(m.hp<=0||!seen(m.x,m.y)||isHiddenMon(m)||G.lore[m.key]!==undefined)continue;
    const rg=heroesUp().find(h=>h.favored&&h.favored===m.fac);if(rg){G.lore[m.key]=true;log(`The ${esc(rg.name)} knows ${esc(m.name)}s well (favoured enemy): ${esc(loreFacts(m))}.`,"magic");continue;}const sk=LORE_SK[m.key]||"arcana";const h=bestAt(sk);if(!h)return;
    const dc=10+Math.min(5,Math.floor(m.xp/5));const c=await check(h,sk,dc,{quiet:true,bonus:hasUp("library")?3:0});G.lore[m.key]=c.ok;
    if(c.ok){log(`${esc(h.name)} knows about ${esc(m.name)}s (${esc(c.txt)}): ${esc(loreFacts(m))}.`,"magic");toast(`${h.name} recalls: ${m.name} — ${loreFacts(m)}.`);}
    else log(`Nobody knows much about ${esc(m.name)}s (${esc(c.txt)}). You'll learn the hard way.`,"miss");}}
function learnByFighting(m){if(G.lore&&G.lore[m.key]===false){G.lore[m.key]=true;log(`Having fought one, you now know how ${esc(m.name)}s work: ${esc(loreFacts(m))}.`,"magic");}}

// ---------- light: the lantern burns oil, and you can put out your own light and wall torches ----------
const FUEL_MAX=500;
function burnFuel(n){if(!G.light||!G.fuel)return;G.fuel=Math.max(0,G.fuel-n);
  if(G.fuel===Math.floor(FUEL_MAX*.15))toast("The lantern is running low on oil.");
  if(G.fuel>0)return;
  if(G.bag.oil){takeItem("oil");G.fuel=FUEL_MAX;G.lightR=4;toast("The lantern gutters, so you refill it with an oil flask.");log("Refilled the lantern with an oil flask.","miss");}
  else if(G.bag.torch){takeItem("torch");G.fuel=Math.floor(FUEL_MAX*.4);G.lightR=3;toast("Out of lantern oil. You light a torch instead (smaller light).");log("Lit a torch (no lantern oil left).","miss");}
  else{G.light=false;toast("The light sputters out! You're in the dark. Find oil or a torch.");log("Your light has gone out.","hurt");}
  computeLight();fov();hud();}
function toggleLight(){if(!G||G.demo||G.over||mode!=="explore"||busy)return;
  if(G.light&&G.fuel>0)G.light=false;
  else{if(G.fuel<=0){if(G.bag.oil){takeItem("oil");G.fuel=FUEL_MAX;G.lightR=4;}else if(G.bag.torch){takeItem("torch");G.fuel=Math.floor(FUEL_MAX*.4);G.lightR=3;}else{toast("Nothing to light: you need lantern oil or a torch.");return;}}G.light=true;}
  toast(G.light?"Light on. Monsters can see it from far away.":"Light off. Monsters without darkvision can't see you, but you only see lit areas.");
  computeLight();fov();hud();}
async function torchInteract(tc){const L=G.party[0];const wz=heroesUp().find(h=>h.id==="wizard"&&cheb(h,tc)<=12&&(los(h.x,h.y,tc.x,tc.y+1)||los(h.x,h.y,tc.lx,tc.ly)));
  if(cheb(L,tc)>1){if(!wz){toast("You can't reach that torch from here.");return;}const c=await choose(`The ${wz.name} can ${tc.out?"light":"snuff"} that torch from here with a cantrip.`,[{t:tc.out?"LIGHT IT":"SNUFF IT"},{t:"LEAVE IT"}]);if(c===0){tc.out=!tc.out;toast(tc.out?"A flick of the fingers and the torch goes out.":"The torch flares to life.");}$("tBox").hidden=true;computeLight();fov();hud();return;}
  const c=await choose(tc.out?"A cold torch in a wall bracket.":"A torch burns in a wall bracket.",[{t:tc.out?"LIGHT IT":"PUT IT OUT",sub:tc.out?"Light the room":"Darken the room: harder to see, harder to be seen"},{t:"TAKE IT",sub:"Add a torch to your bag (the room goes dark)",dis:!!tc.taken},{t:"LEAVE IT"}]);
  if(c===0){tc.out=!tc.out;toast(tc.out?"You snuff out the torch.":"The torch flares back to life.");}
  else if(c===1){tc.out=true;tc.taken=true;addItem("torch");toast("You take the torch.");}
  $("tBox").hidden=true;computeLight();fov();hud();}
async function groundTorchInteract(l){const c=await choose("A torch you placed on the floor.",[{t:"PICK IT UP",sub:"Back into your bag"},{t:"LEAVE IT"}]);
  if(c===0){G.dropLights.splice(G.dropLights.indexOf(l),1);addItem("torch");toast("Picked up the torch.");}$("tBox").hidden=true;computeLight();fov();hud();}

// ---------- marching order ----------
async function marchMenu(i){if(!G||G.demo||G.over||mode!=="explore"||busy)return;const h=G.party[i];if(!h)return;busy=true;const last=G.party.length-1;
  const c=await choose(`${h.name} is #${i+1} in the marching order. The leader walks in front: first to spot things, first to spring traps.`,
    [{t:"MAKE LEADER",dis:i===0},{t:"MOVE UP",dis:i===0},{t:"MOVE DOWN",dis:i===last},{t:"CANCEL"}]);
  const sw=(a,b)=>{const A=G.party[a],B=G.party[b];[A.x,B.x]=[B.x,A.x];[A.y,B.y]=[B.y,A.y];G.party[a]=B;G.party[b]=A;};
  if(c===0)for(let k=i;k>0;k--)sw(k,k-1);else if(c===1)sw(i,i-1);else if(c===2)sw(i,i+1);
  $("tBox").hidden=true;busy=false;fov();hud();}

// ---------- after a fight: dying heroes need stabilising (Medicine DC 10) ----------
async function tendTheDying(){if(!S.rules.deathSaves){for(const h of G.party)if(h.down&&!h.dead){h.down=false;h.hp=1;h.ds={s:0,f:0};h.stable=false;log(`${esc(h.name)} staggers back up with 1 HP.`,"miss");}return;}
  for(const h of G.party){if(!h.down||h.dead)continue;let guard=0;
    while(!h.stable&&!h.dead&&guard++<12){const medic=heroesUp().filter(x=>x!==h).sort((a,b)=>skillBonus(b,"medicine")-skillBonus(a,"medicine"))[0];if(!medic)break;
      const c=await check(medic,"medicine",10,{quiet:true});
      if(c.ok){h.stable=true;await say(`The ${medic.name} stabilises the ${h.name}. (${c.txt})`,1100,true);}
      else{await say(`The ${medic.name} struggles to stop the bleeding. (${c.txt})`,900,true);await deathSave(h);}}
    if(h.stable&&!h.dead){h.down=false;h.hp=1;h.ds={s:0,f:0};h.stable=false;G.steps+=20;log(`${esc(h.name)} comes round with 1 HP after a while.`,"miss");}}
  $("tBox").hidden=true;hud();}

// ---------- camping ----------
const armoured=h=>!h.dead&&h.info.armour&&!h.wild;
const floorCleared=()=>!G.mons.some(m=>m.hp>0&&!m.peace);
function campRisk(type){const n=G.mons.filter(m=>!m.peace&&m.hp>0).length;if(!n)return 0;if(type==="short")return Math.min(.35,.05*n);const base=Math.min(.8,.2+.07*n);return type==="fire"?base:base*.45;}
async function campFlow(atLadder){// returns the camp settings, or null if cancelled
  const up=heroesUp(),food=G.bag.ration||0,wood=G.bag.firewood||0;
  const hungry=food?"":` · NO FOOD: exhaustion, HP only back to half${(G.hungry||0)>=1?", and you are STARVING (extra exhaustion)":""}`;
  const c1=await choose(atLadder?"At the foot of the ladder, the party makes camp. It's safe here.":"Make camp here?",[
    {t:"FIRE CAMP",sub:wood?`Full rest · uses 1 firewood${food?" + 1 ration":""}${atLadder?"":" · fire draws attention ("+Math.round(campRisk("fire")*100)+"% ambush)"}${hungry}`:"You have no firewood",dis:!wood},
    {t:"COLD CAMP",sub:`No fire: HP only back to half, no Hit Dice or exhaustion recovered${G.coldUsed?" · ALREADY COLD-CAMPED: everyone gains exhaustion":""}${atLadder?"":" · "+Math.round(campRisk("cold")*100)+"% ambush"}${hungry}`},
    {t:atLadder?"DON'T REST":"CANCEL"}]);
  if(c1<0||c1===2)return null;const camp={type:c1===0?"fire":"cold",atLadder};approve(camp.type==="fire"?"firecamp":"coldcamp");
  if(!atLadder&&up.length>1){const opts=up.map(h=>{const pp=passive(h,"perception")-2*exhOf(h)-(camp.type==="cold"&&!heroDV(h)?5:0);return {t:h.name.toUpperCase(),sub:`Passive Perception ${pp}${camp.type==="cold"&&!heroDV(h)?" (dark: −5)":""}${h.race==="elf"?" · elves only need 4 hours' trance":""}`};});
    const w=await choose("Who keeps watch? Their Passive Perception decides whether an ambush is spotted in time.",opts);camp.watch=up[Math.max(0,w)];}
  else camp.watch=up[0];
  const cl=up.find(h=>h.id==="cleric"&&slotAvail(h,1));if(cl&&!atLadder){const c4=await choose("The cleric can sanctify the camp with a prayer (uses a spell slot): monsters are far less likely to find you, and everyone regains an extra Hit Die.",[{t:"SANCTIFY THE CAMP"},{t:"DON'T BOTHER"}]);if(c4===0){useSlot(cl,1);camp.sanct=true;}}
  if(G.party.some(armoured)){const c3=await choose("Sleep in armour? Medium and heavy armour make for a poor rest.",[{t:"TAKE IT OFF",sub:"Rest properly, but lower AC if attacked tonight"},{t:"KEEP IT ON",sub:"Armoured heroes regain fewer Hit Dice and no exhaustion"}]);camp.armourOff=c3!==1;}
  $("tBox").hidden=true;return camp;}
async function applyLongRest(camp){const food=(G.bag.ration||0)>0;const light=anyPerk("lighteater")&&Math.random()<.5;if(food&&!light)takeItem("ration");if(food&&light)log("A light eater makes the meal stretch: no ration used.","lv");if(camp.type==="fire")takeItem("firewood");
  const lines=[];
  for(const h of G.party){if(h.dead)continue;const heavy=armoured(h)&&!camp.armourOff;
    h.down=false;h.st={};h.wild=null;h.conc=null;h.armourOff=false;h.ds={s:0,f:0};h.stable=false;
    const slotsBefore=h.slots.slice();restoreAll(h,true);
    if(camp.type==="fire"){h.hp=h.maxHp;const gain=heavy?Math.max(1,Math.floor(h.hdMax/4)):Math.max(1,Math.floor(h.hdMax/2));h.hdLeft=Math.min(h.hdMax,(h.hdLeft||0)+gain);if(!heavy&&food)reduceExh(h);}
    else{h.hp=Math.max(h.hp,Math.ceil(h.maxHp/2),1);}
    h.relentlessUsed=false;if(camp.sanct)h.hdLeft=Math.min(h.hdMax,h.hdLeft+1);}
  for(const h of G.party)if(h.sub==="beastmaster"&&!h.dead&&!G.party.some(b=>b.id==="beast"&&!b.dead))summonBeast(h);
  G.party=G.party.filter(h=>!(h.id==="beast"&&h.dead));
  if(!food){for(const h of G.party)if(!h.dead)await addExh(h,1,"went to sleep hungry");lines.push("No food: everyone gains exhaustion.");}
  if(camp.type==="cold"){if(G.coldUsed){for(const h of G.party)if(!h.dead)await addExh(h,1,"another cold, miserable night");lines.push("A second cold night in a row: everyone gains exhaustion.");}G.coldUsed=true;}
  else G.coldUsed=false;
  G.fatigue=0;G.shortRests=0;if(G.idTried)G.idTried.clear();hud();return lines;}
async function doRest(long){if(mode!=="explore"||busy)return;
  if(enemiesNear()){toast("You can't rest with enemies nearby.");return;}
  if(!long&&G.shortRests>=maxShort()){toast("You've used up your short rests. You need a long rest.");return;}
  if(long&&S.rules.fatigue&&G.fatigue<3){toast("The party isn't tired enough to sleep yet.");return;}
  {const soon=restTooSoon(long);if(soon){toast(long?`You slept not long ago. Nobody can sleep again yet (explore about ${soon} more steps).`:`You have only just rested. Push on a little first (about ${soon} more steps).`);return;}}
  closeMenu();busy=true;
  let camp;if(long){camp=await campFlow(false);if(!camp){busy=false;return;}}else camp={type:"short",watch:G.party.find(h=>!h.dead&&!h.down)};
  G.lastRestStep=G.steps;if(long)G.lastLongStep=G.steps;
  await say(long?(camp.type==="fire"?"The party lights a small fire and beds down...":"The party huddles together in the dark, no fire..."):"The party rests for an hour, binding wounds...",1300,true);
  const risk=campRisk(camp.type)*(camp.sanct?.4:1);
  if(Math.random()<risk){const near=G.mons.filter(m=>m.hp>0&&!m.peace).sort((a,b)=>cheb(a,G.party[0])-cheb(b,G.party[0]));const gid=near[0].gid;
    const list=near.filter(m=>m.gid===gid).slice(0,4);
    for(const m of list){const p=ambushSpot();if(p){m.x=p.x;m.y=p.y;m.dx=p.x*TS;m.dy=p.y*TS;}m.state="hunt";m.lurk=false;}
    const st=Math.max(...list.map(m=>rnd(20)+monStealth(m)));const w=camp.watch;const pp=w?passive(w,"perception")-2*exhOf(w)-(camp.type==="cold"&&!heroDV(w)?5:0):0;
    const spotted=(w&&pp>=st)||anyPerk("lightsleeper");
    for(const h of G.party){if(h.dead||h.down)continue;if(long&&h!==w)h.st.prone=true;if(long&&camp.armourOff&&armoured(h))h.armourOff=true;if(!spotted&&!hasFeat(h,"alert"))h.st.surprised=true;}
    log(`Ambush! Enemy Stealth ${st} vs ${w?esc(w.name)+"'s":"your"} Passive Perception ${pp}.`,"hurt");
    if(long)G.pendingRest=camp;fov();busy=false;
    startCombat({ambush:true,spotted,watch:w,extra:list});return;}
  if(long){const lines=await applyLongRest(camp);
    await say(camp.type==="fire"?`Morning comes. HP, spells and skills restored, half your Hit Dice back.${lines.length?" "+lines.join(" "):""}`:`A cold, uneasy night. Spells and skills restored, HP back to at least half.${lines.length?" "+lines.join(" "):""}`,1900,true);}
  else await shortRest();
  $("tBox").hidden=true;busy=false;hud();autoSave(true);}
async function shortRest(){G.shortRests++;const lines=[];for(const h of G.party){if(h.dead)continue;if(h.down){h.down=false;h.hp=1;h.stable=false;delete h.st.prone;}let healed=0;const con=abm(h,"con");
    while(h.hp<h.maxHp*.75&&h.hdLeft>0){h.hdLeft--;const r=(rnd(h.def.hd)+con)*(gearFx(h).periapt?2:1);h.hp=Math.min(h.maxHp,h.hp+Math.max(1,r));healed+=Math.max(1,r);}
    for(const k of featRes(h))if(RES[k].rest==="sr")h.res[k]=RES[k].max(G.level);
    h.pins=2;if(h.sub==="land"&&h.res.natrec>0){let budget=Math.ceil(G.level/2);const mx=slotMax(h);for(let i=0;i<h.slots.length&&budget>0;i++){while(h.slots[i]<mx[i]&&budget>=i+1){h.slots[i]++;budget-=i+1;}}h.res.natrec--;}
    if(h.info.arcaneRecovery&&h.res.arcane>0){let budget=Math.ceil(G.level/2);const mx=slotMax(h);for(let i=0;i<h.slots.length&&budget>0;i++){while(h.slots[i]<mx[i]&&budget>=i+1){h.slots[i]++;budget-=i+1;}}h.res.arcane--;}
    if(healed)lines.push(`${h.name} +${healed}`);}
  approve("shortrest");const unk=Object.keys(G.bag).filter(id=>!isKnown(id));if(unk.length){const id=unk[0];const sk=ITEMS[id].kind==="gear"||id.startsWith("scroll")?"arcana":"medicine";const h=bestAt(sk);const r=await check(h,sk,12,{quiet:true});if(r.ok){G.known.add(id);lines.push(`${h.name} studies the ${ITEMS[id].unk}: it's ${aN(ITEMS[id].name)}`);}}
  await say(`Short rest done (${G.shortRests}/${maxShort()} before you need sleep). ${lines.length?"Hit Dice spent: "+lines.join(", ")+".":""} Short-rest skills recharged.`,1800,true);}
async function ladderRest(){const camp=await campFlow(true);if(!camp)return false;const lines=await applyLongRest(camp);
  log(`The party camps at the foot of the ladder (${camp.type==="fire"?"fire":"cold"} camp).`,"lv");if(lines.length)toast(lines.join(" "));return true;}

// ---------- firewood piles ----------
async function woodInteract(o){const sv=bestAt("survival");const c=await choose("Broken crates and old timber. Good firewood.",[{t:"GATHER WOOD",sub:`+1 firewood · ${sv.name}: Survival DC 12 to find more`},{t:"LEAVE IT"}]);
  if(c!==0){$("tBox").hidden=true;return;}o.gone=true;const r=await check(sv,"survival",12,{quiet:true});const n=r.ok?2:1;addItem("firewood",n);G.steps+=8;
  await say(`You gather ${n} bundle${n>1?"s":""} of firewood. (${r.txt})`,1200,true);$("tBox").hidden=true;hud();}

// ---------- chest traps ----------
async function chestTrap(o,h){const t=o.trap;o.trap=null;const s=saveRoll(h,"con",t.dc);const dm=roll("2d4").total;
  await say(`A needle jabs out of the lock! ${s.txt}.`,1000,true);await dealDamage(h,s.ok?Math.floor(dm/2):dm,"poison",{});if(!s.ok&&!h.down)h.st.poisoned=3;}

const maxShort=()=>hasUp("healer")?3:2;

// ---------- odds instead of DCs, learned armour, corpses ----------
function chanceOf(h,sk,dc,o){o=o||{};let need=dc-skillBonus(h,sk)+2*exhOf(h);let p=Math.min(.95,Math.max(.05,(21-need)/20));
  if(sk==="thieves"&&h.side==="h"&&!hasTools(h)){need+=5;p=Math.min(.95,Math.max(.05,(21-need)/20));p=p*p;}else if(o.adv)p=1-(1-p)*(1-p);else if(o.dis)p=p*p;return p;}
function oddsWord(h,sk,dc,o){const p=chanceOf(h,sk,dc,o);return p>=.85?"almost certain":p>=.65?"good odds":p>=.45?"a coin flip":p>=.25?"risky":p>=.1?"a long shot":"hopeless";}
const oddsTag=(h,sk,dc,o)=>`${h.name}: ${oddsWord(h,sk,dc,o)}`;
const acKnown=m=>!m||m.side!=="m"||!!m.sized||!!(G&&G.killCount&&(G.killCount[m.key]||0)>=3);
const pctTxt=(md,t)=>acKnown(t)?md.pct+"%":"?%";
function noteKill(m){G.killCount=G.killCount||{};const n=(G.killCount[m.key]||0)+1;G.killCount[m.key]=n;
  if(n===3)log(`You've fought enough ${esc(m.name)}s to judge their armour: AC ${m.ac}. Hit chances now show for them.`,"magic");}
function makeCorpse(m){G.corpses=G.corpses||[];const smart=["goblin","archer","shaman","goblinboss","kobold","orc","ogre","skeleton","bonearcher"].includes(m.key);
  const loot={gold:0,items:[]};if(m.hasKey)loot.items.push("key");
  if(smart&&!m.picked&&Math.random()<.4)loot.gold=ri(2,8)*G.floor;
  if((m.fac==="goblins"||m.fac==="kobolds")&&Math.random()<.15)loot.items.push("ration");
  if(smart&&Math.random()<.12){const it=rollItem(false);if(it)loot.items.push(it);}
  if(m.boss||m.named){loot.gold+=ri(15,30)*G.floor;const it=rollItem(true);if(it)loot.items.push(it);}
  G.corpses.push({x:m.x,y:m.y,sprite:m.sprite,name:m.name,kind:m.key==="ooze"?"puddle":m.tr.undead?"bones":"body",loot,searched:false,big:!!m.boss,hum:!!HUMAN[m.sprite]});}
async function corpseInteract(c){if(c.kind==="puddle"){toast("Just a drying smear of ooze.");return;}if(noHands()){toast("Paws and claws are no good for searching bodies. Change back first.");return;}
  const cl=heroesUp().find(h=>h.id==="cleric");const canSpeak=cl&&!c.spoken&&c.kind==="body";
  if(c.searched&&!canSpeak){toast(c.msg||"You've already searched that.");return;}
  const ch=await choose(`The ${c.kind==="bones"?"scattered bones":"body"} of ${aN(c.name)}.`,[{t:"SEARCH IT",sub:c.searched?"Already searched":"Takes a moment",dis:!!c.searched},{t:"LEAVE IT"}].concat(canSpeak?[{t:"SPEAK WITH DEAD",sub:`${cl.name}: uses a spell slot · ask it what it knew`,dis:!slotAvail(cl,1)}]:[]));
  if(ch===2&&canSpeak){await speakWithDead(cl,c);return;}
  if(ch!==0){$("tBox").hidden=true;return;}c.searched=true;G.steps+=3;const got=[];if(c.loot.gold){G.gold+=c.loot.gold;got.push(c.loot.gold+" gold");}
  for(const id of c.loot.items){addItem(id);got.push(itemName(id));}
  c.msg=got.length?`You've already taken everything from the ${c.name}.`:`Nothing of value on the ${c.name}.`;
  await say(got.length?`You find: ${got.join(", ")}.`:`Nothing of value.`,1300,true);$("tBox").hidden=true;hud();}
function drawCorpse(c,camX,camY){const sx=Math.round(c.x*TS-camX),sy=Math.round(c.y*TS-camY-elevAt(c.x,c.y)*3);
  if(c.kind==="puddle"){ctx.fillStyle="rgba(150,110,40,.55)";ctx.fillRect(sx+3,sy+10,10,3);ctx.fillRect(sx+5,sy+9,6,5);return;}
  if(c.kind==="bones"){ctx.fillStyle="#1c1418";ctx.fillRect(sx+3,sy+9,10,5);ctx.fillStyle="#cfc6ae";for(const [a,b,w,h] of [[4,10,4,1],[8,11,4,1],[6,12,5,1],[10,9,2,2]])ctx.fillRect(sx+a,sy+b,w,h);ctx.fillStyle="#e8e0cc";ctx.fillRect(sx+4,sy+9,3,2);ctx.fillStyle="#2a2020";ctx.fillRect(sx+5,sy+10,1,1);return;}
  ctx.save();ctx.filter="brightness(0.5) saturate(0.55)";ctx.globalAlpha=.9;
  if(c.hum){ctx.translate(sx+8,sy+11);ctx.rotate(Math.PI/2);ctx.drawImage(heroSpr(c.sprite,"f"),-14,-8);}
  else{const im=monSpr(c.sprite);const s=c.big?28:16;ctx.translate(sx+8,sy+12);ctx.scale(1,-1);ctx.drawImage(im,0,0,im.width,im.height,-s/2,-s/2+2,s,s*.7);}
  ctx.restore();ctx.fillStyle="rgba(110,20,20,.45)";ctx.fillRect(sx+4,sy+13,8,2);}
// ---------- rogues and the dark ----------
function snuffButtons(u){const B=[];if(!C||C.objUsed)return B;
  const tc=G.torches.find(t=>!t.out&&(cheb(u,{x:t.x,y:t.y+1})<=1||cheb(u,t)<=1||(u.id==="wizard"&&cheb(u,t)<=12&&los(u.x,u.y,t.lx,t.ly))));
  if(tc)B.push({t:"SNUFF THE TORCH",sub:"Free (once per turn) · darkness hides you from eyes without darkvision",f:()=>{tc.out=true;C.objUsed=true;computeLight();fov();buildPanel();prompt("You snuff the torch. Darkness falls over this part of the room.");}});
  const gl=G.dropLights.find(l=>cheb(u,l)<=1);if(gl)B.push({t:"STAMP OUT TORCH",sub:"Free (once per turn)",f:()=>{G.dropLights.splice(G.dropLights.indexOf(gl),1);C.objUsed=true;computeLight();fov();buildPanel();}});
  return B;}
