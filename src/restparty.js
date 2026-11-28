// ================= solo wording, revealed pits, fights that move on without you, parties found resting =================
// ---------- a lone hero doesn't get "everyone" and "the others" ----------
const isSolo=()=>G&&G.party&&G.party.filter(h=>!h.dead&&h.id!=="beast").length===1;
const SOLO_TEXT=[[/Everyone takes a swig and feels braver \(a few temporary HP each, until the next fight ends\)/,"You take a swig and feel braver (a few temporary HP, until the next fight ends)"],
  [/Everyone splutters\./,"You splutter."],[/Everyone is healed a little/,"You're healed a little"],[/Everyone heals a little/,"You heal a little"],[/Everyone's worn out/,"You're worn out"],
  [/Nobody in the party understands a word\./,"You can't understand a word."],[/Nobody in the party speaks/,"You don't speak"],[/nobody in the party speaks/,"you don't speak"],
  [/has to be hauled out/,"has to climb out, scraped and bruised"],[/ The others follow\./,""],[/, with help from the others/,""],
  [/The party climbs down into the pit, helps each other up the far side and dusts off\./,"You climb down into the pit, scramble up the far side and dust yourself off."],
  [/The party jumps\.\.\. and lands hard on the rocks below\./,"You jump... and land hard on the rocks below."],
  [/ The others wait, not very patiently, for them to wake\./," Some time passes before they wake."],
  [/everyone sleeps off their tiredness, but nobody heals/,"you sleep off your tiredness, but don't heal"],[/everyone loses a little HP/,"you lose a little HP"],
  [/Chip by chip, the party breaks/,"Chip by chip, you break"],[/The party rests at the foot of the ladder/,"You rest at the foot of the ladder"],
  [/everyone sitting|everyone across/,"you across"]];
function soloize(t){if(typeof t!=="string"||!isSolo())return t;for(const [a,b] of SOLO_TEXT)t=t.replace(a,b);return t;}
{const base=say;say=function(text,...a){return base(soloize(text),...a);};}
{const base=toast;toast=function(text){return base(soloize(text));};}
{const base=choose;choose=function(q,opts){return base(soloize(q),opts);};}
// alone at the campfire: no circle of friends to ask the question
{const base=campfireTales;campfireTales=async function(camp){if(!isSolo()||window.__skipIntro)return base(camp);const h=G.party.find(x=>!x.dead&&x.id!=="beast");if(!needsBg(h))return;
  campScene={fire:!camp||camp.type!=="cold",speaker:h};try{const pool=shuffle(Object.keys(BACKGROUNDS)).slice(0,4);
    const c=await choose(`Alone by the ${camp&&camp.type==="cold"?"cold dark":"fire"}, ${h.nick||"the "+h.name} thinks back to the life before all this. "Before the dungeon, I was..."`,pool.map(k=>({t:BACKGROUNDS[k].name.toUpperCase(),sub:bgBonusText(k)})));
    const k=pool[Math.max(0,c)];h.bg=k;log(`${esc(h.nick||h.name)}'s background: ${esc(BACKGROUNDS[k].name)} (${esc(bgBonusText(k))}).`,"lv");await say(`"${BACKGROUNDS[k].story}" (${BACKGROUNDS[k].name}, ${bgBonusText(k)})`,2600,true);}
  finally{campScene=null;$("tBox").hidden=true;}};}

// ---------- a spotted pit trap shows as a hole in the floor ----------
function openFoundPits(){let any=false;for(const t of G.traps||[])if(t.type==="pit"&&t.found&&!t.done&&!unitAt(t.x,t.y)){t.done=true;openPit(t.x,t.y);any=true;}if(any){computeLight();fov();}}
{const base=d2Step;d2Step=async function(){openFoundPits();await base();if(G)openFoundPits();};}
{const base=search;search=async function(){await base();if(G)openFoundPits();};}

// ---------- fights carry on while you dither ----------
const SK_PHASES=["start","middle","end","over"];
{const base=skTick;skTick=async function(){for(const sk of G.skirmishes||[])if(sk.heard&&sk.heardAt===undefined)sk.heardAt=G.steps;return base();};}
{const base=skReveal;skReveal=async function(sk){if(sk.heardAt!==undefined&&!sk.revealed){const el=G.steps-sk.heardAt;const i=SK_PHASES.indexOf(sk.phase)+Math.floor(el/15);
    if(i>=5){sk.phase="over";sk.revealed=true;skApplyPhase(sk);await skLongOver(sk);return;}sk.phase=SK_PHASES[Math.min(3,i)];}
  return base(sk);};}
async function skLongOver(sk){sk.state="done";sk.talked=true;const win=sk.sides.find(s=>s.team===sk.winner),lose=sk.sides.find(s=>s.team===sk.loser);const us=win?skUnits(sk,win):[];const human=win&&(win.adv||win.bandit);
  const gone=human?Math.random()<.75:Math.random()<.5;let robbed=false;
  if(human){const ctr=us[0]||G.corpses.find(c=>c.claim===sk.id);for(const c of G.corpses)if(c.claim===sk.id&&c.loot&&(c.loot.gold||c.loot.items.length)){c.loot={gold:0,items:[]};robbed=true;}
    if(ctr)for(const o of G.objs)if(o.type==="chest"&&!o.opened&&!o.gone&&!o.mimic&&cheb(o,ctr)<=6){o.opened=true;o.robbed=true;o.loot={gold:0,items:[]};robbed=true;}}
  for(const c of G.corpses)if(c.claim===sk.id)c.claim=null;
  if(gone)for(const m of us){const k=G.mons.indexOf(m);if(k>=0)G.mons.splice(k,1);}
  const who=gone?"Whoever won is long gone.":`The ${win?win.label:"winners"} are still here, resting among the bodies.`;
  await say(`You've arrived far too late: the fight is long over. Bodies lie everywhere${lose?`, mostly ${lose.label}`:""}. ${who}${robbed?" The bodies, and everything else here, have been picked clean.":""}`,2000,true);$("tBox").hidden=true;
  if(!gone&&us.length){for(const m of us){m.peace=true;m.state="idle";}await skAftermath(sk,true);}fov();}

// ---------- adventurers caught resting ----------
D2_DRAW.restfire=D2_DRAW.orcfire;D2_ACT.restfire=async o=>toast("A small campfire, still warm. Bedrolls lie around it.");
{const base=spawnRivals;spawnRivals=function(){const n0=(G.rivals||[]).length;base();const co=(G.rivals||[]).find(c=>c.floor===G.floor);if(!co||co.hostile||co.returning||co.resting||Math.random()>.1)return;
  const mem=rivalMembers(co);if(!mem.length)return;co.resting=true;for(const m of mem){m.state="sleep";}const p=nearFree(mem[0].x,mem[0].y);if(p)G.objs.push({type:"restfire",x:p.x,y:p.y,deco:true,seen:true});};}
{const base=rivalWalk;rivalWalk=function(co,mem){if(co.resting)return;return base(co,mem);};}
{const base=rivalTick;rivalTick=async function(){const L=G.party[0];for(const co of G.rivals||[]){if(!co.resting||co.met||co.gone||co.floor!==G.floor)continue;const mem=rivalMembers(co);if(!mem.length)continue;
    if(mem.some(m=>cheb(m,L)<=7&&seen(m.x,m.y))){co.met=true;await restingMeet(co);return true;}}return base();};}
const RESTING_STOCK=()=>["potion","ration","ration","arrows","oil","torch","bottle","w_"+pick(Object.keys(WEAPONS))];
async function restingMeet(co){const mem=rivalMembers(co);const L=G.party[0];let hidden=false;
  if(G.sneak){const st=Math.min(...heroesUp().map(h=>rnd(20)+skillBonus(h,"stealth")));hidden=st>=Math.max(...mem.map(m=>12+abm(m,"wis")));}
  if(hidden){const th=bestAt("thieves");
    const c=await choose(`${cap(co.name)} are camped around a small fire, fast asleep. The one meant to be keeping watch is snoring too.`,[{t:"SNEAK PAST",sub:"Leave them sleeping"},
      {t:"ROB THEM",sub:`Thieves' Tools DC 13 · ${oddsTag(th,"thieves",13)} · if it goes wrong, they wake up`},{t:"ATTACK WHILE THEY SLEEP"},{t:"WAKE THEM",sub:"Clear your throat, loudly"}]);$("tBox").hidden=true;
    if(c===0){toast("You tiptoe past the sleeping adventurers.");return;}
    if(c===1){const r=await check(th,"thieves",13);if(r.ok){const g=co.pot+ri(8,20)*G.floor;co.pot=0;G.gold+=g;const it=Math.random()<.4?rollItem(false):null;if(it)addItem(it);hud();co.robbed=true;
        await say(`Light fingers through packs and pouches: ${g} gold${it?" and "+aN(itemName(it)):""}. Nobody stirs. (${r.txt})`,1500,true);$("tBox").hidden=true;return;}
      await say(`A buckle clinks. An eye opens. "THIEF!" (${r.txt})`,1000,true);await wakeRest(co,"hostile");return;}
    if(c===2){for(const m of mem){m.peace=false;m.st.asleep=true;m.state="sleep";}$("tBox").hidden=true;busy=false;await startCombat({extra:mem,partyFirst:true});return;}
    await wakeRest(co,null);return;}
  await say(`${cap(co.name)} are resting around a small fire. ${G.sneak?"The one on watch spots you":"Your footsteps wake them"}, and they scramble up, grabbing for weapons!`,1500,true);$("tBox").hidden=true;await wakeRest(co,null);}
async function wakeRest(co,forced){const mem=rivalMembers(co);co.resting=false;for(const m of mem){m.state="idle";delete m.st.asleep;m.bubble=now()+900;}
  const q=Math.random();const mood=forced||(co.bandit?"false":q<.25?"hostile":q<.6?"wary":q<.85?"friendly":"false");
  if(mood==="hostile"){await say(`"Ambush! Get them!" ${cap(co.name)} come at you.`,1000,true);await rivalFight(co);return;}
  if(mood==="wary"){co.stance=Math.random()<.5?"threat":"bribe";co.introOverride=`${co.leader} levels a blade at you, still bleary-eyed. "Easy there. What's your business?"`;await rivalMeet(co,true);return;}
  if(mood==="false"){co.treach=true;co.falseFriend=true;}
  const pal=co.treach&&liarSense();
  while(true){const c=await choose(`${co.leader} lowers their weapon and grins. "Fellow delvers! Sit, sit. We've spare supplies if you're buying. Or... fancy working this floor together?"${pal?` The ${pal.name} feels it like a cold hand on the neck: every word is a lie.`:""}`,
      [{t:"TRADE"},{t:"TEAM UP",sub:"They fight beside you until the ladder, then take half the gold you find"},{t:"WISH THEM WELL AND MOVE ON"}]);$("tBox").hidden=true;
    if(c===0){const sh=co.shop||(co.shop={type:"merchant",stock:RESTING_STOCK(),lang:"Common"});sh.stock.forEach(id=>{if(parseWeapon(id))registerWeapon(id);});openShop(sh);return;}
    if(c===1){co.stance="teamup";await rivalJoin(co);if(co.allied)return;continue;}
    break;}
  toast(`"Safe travels!" ${cap(co.name)} wave you off.`);
  // the false friends follow you, and strike when you least expect it
  if(co.falseFriend&&!co.allied){const list=mem.map(m=>({key:m.key,cls:m.cls,name:m.name}));for(const m of mem){const k=G.mons.indexOf(m);if(k>=0)G.mons.splice(k,1);}co.gone=false;
    G.grudges=G.grudges||[];G.grudges.push({gid:co.gid,floor:G.floor,list,at:G.steps+ri(25,55),back:true,betray:true,name:cap(co.name),fac:"rival",rival:co.id});}}
// trading is done in the shop: when it closes, the false friends still slip away (shop closes back into exploring)
{const base=closeMenu;closeMenu=function(...a){const r=base(...a);try{for(const co of G.rivals||[])if(co.falseFriend&&!co.allied&&!co.betrayScheduled&&co.shop&&rivalMembers(co).length&&mode==="explore"){co.betrayScheduled=true;const mem=rivalMembers(co);
    const list=mem.map(m=>({key:m.key,cls:m.cls,name:m.name}));for(const m of mem){const k=G.mons.indexOf(m);if(k>=0)G.mons.splice(k,1);}G.grudges=G.grudges||[];G.grudges.push({gid:co.gid,floor:G.floor,list,at:G.steps+ri(25,55),back:true,betray:true,name:cap(co.name),fac:"rival",rival:co.id});toast(`"Pleasure doing business!" ${cap(co.name)} pack up and head off.`);}}catch(e){}return r;};}
