// ================= combat engine =================
function showCombatUI(on){$("controls").hidden=on;$("tglRow").hidden=on;$("cPanel").hidden=!on;$("strip").hidden=!on;if(!on){$("tBox").hidden=true;}}
async function startCombat(o){o=o||{};if(mode==="combat"||mode==="combatEnd"||!G||G.over)return;busy=true;mode="combat";clearTimeout(toastT);
  const parts=new Set();if(o.bumped)parts.add(o.bumped);for(const m of o.extra||[])parts.add(m);
  for(const m of G.mons){if(m.peace||m.hp<=0)continue;if(m.state==="hunt")parts.add(m);
    if(G.party.some(h=>!h.dead&&!h.down&&(monsterSees(Object.assign({},m,{state:"idle"}),h)||(seen(m.x,m.y)&&cheb(m,h)<=S.dungeon.sight))))parts.add(m);}
  for(const m of [...parts])for(const q of G.mons)if(q.gid===m.gid&&!q.peace&&q.hp>0&&cheb(q,m)<=10)parts.add(q);
  C={units:[],idx:-1,round:1,cur:null,xp:0,moveLeft:0,actions:0,bonus:false,attacksLeft:0,disengaged:false,reckless:false,sneakUsed:false,objUsed:false,mode:"move",tgt:null,reach:null,sel:null,weapon:"main",panel:"main",pending:null};
  // surprise: monsters that hadn't noticed the party (asleep, fooled, out-sneaked) lose their first turn
  for(const m of parts)if(m.state==="sleep")m.st.asleep=true;
  let nSurp=0;if(o.partyFirst)for(const m of parts){if(m.state==="sleep"||m.fooled||(!noticesParty(m)&&m.state!=="hunt")){m.st.surprised=true;nSurp++;}}
  for(const h of G.party){h.acted=false;h.dreadDone=false;}
  for(const m of parts){m.acted=false;m.lurk=false;m.spotted=true;m.fooled=false;m.state="combat";m.inCombat=true;m.bubble=now()+900;m.init=rnd(20)+abm(m,"dex");C.units.push(m);}
  let caught=[];if(o.by&&!o.partyFirst)caught=surpriseHeroes(o.by.filter(m=>parts.has(m)));
  for(const h of G.party){if(h.dead)continue;h.init=rnd(20)+abm(h,"dex")-2*exhOf(h)+(h.sub==="gloom"?abm(h,"wis"):0)+(hasFeat(h,"alert")?5:0);if(hasFeat(h,"alert"))delete h.st.surprised;C.units.push(h);}
  C.units.sort((a,b)=>b.init-a.init);
  showCombatUI(true);renderStrip();hud();buildPanel();fov();
  log(`Initiative: ${C.units.map(u=>`${esc(u.name)} ${u.init}`).join(", ")}.`,"magic");
  const msg=o.ambush?(o.spotted?`Ambush! But the ${o.watch.name} spotted them coming and shouts a warning. Nobody is surprised, though the sleepers start prone.`:"Ambush! Monsters creep up on the camp. Everyone is caught by surprise!")
    :o.partyFirst?(nSurp?`You strike first! ${nSurp===parts.size?"The enemies are":nSurp+" of the enemies are"} caught by surprise and lose their first turn.`:"You attack, but they saw you coming. Roll initiative!")
    :caught.length?`Ambush! ${caught.join(", ")} ${caught.length>1?"are":"is"} caught by surprise!`:"Enemies spotted! Everyone rolls initiative...";
  await say(msg,1400);
  {const ms=[...parts];const cx=Math.round(ms.reduce((a,m)=>a+m.x,0)/ms.length),cy=Math.round(ms.reduce((a,m)=>a+m.y,0)/ms.length);makeNoise(cx,cy,o.partyFirst&&nSurp===parts.size?6:10);}
  if(o.partyFirst)approve(G.sneak&&nSurp?"sneakwin":"attackfirst");if(o.ambush&&!o.spotted)approve("ambushed");
  await loreCheck();
  nextTurn();}
function joinNew(){if(!C)return;fov();let n=0;for(const m of G.mons){if(m.inCombat||m.peace||m.hp<=0)continue;
    const sees=G.party.some(h=>!h.dead&&!h.down&&monsterSees(Object.assign({},m,{state:"idle"}),h));const seenBy=seen(m.x,m.y);
    if(sees||seenBy||m.state==="hunt"&&G.party.some(h=>cheb(h,m)<=10)){m.inCombat=true;m.state="combat";m.bubble=now()+900;m.init=rnd(20)+abm(m,"dex");C.units.push(m);n++;log(`A ${esc(m.name)} joins the fight!`,"hurt");}}
  if(n)renderStrip();return n;}
function loseTrack(){// enemies that can't see or reach the party for 3 rounds wander off, so a fight can't get stuck forever
  for(const m of G.mons){if(!m.inCombat||m.hp<=0)continue;const engaged=G.party.some(h=>!h.dead&&!h.down&&(cheb(h,m)<=1||seen(m.x,m.y)||monsterSees(Object.assign({},m,{state:"idle"}),h)));
    m.lost=engaged?0:(m.lost||0)+1;if(m.lost>=3){m.inCombat=false;m.state="idle";m.lost=0;log(`The ${esc(m.name)} loses track of you.`,"miss");}}renderStrip();}
function renderStrip(){const el=$("strip");el.innerHTML="";if(!C)return;
  const list=C.units.filter(u=>u.side==="h"?!u.dead:(u.hp>0&&u.inCombat));const ci=Math.max(0,list.indexOf(C.cur));
  for(let i=0;i<Math.min(list.length,9);i++){const u=list[(ci+i)%list.length];const c=document.createElement("canvas");c.width=c.height=16;const x=c.getContext("2d");
    if(u.side==="h"){if(u.wild)x.drawImage(wildSpr(u),0,0);else if(u.id==="beast")x.drawImage(monSpr("wolf"),0,0);else x.drawImage(heroSpr(u.id,"f",0,u.race),0,2,16,16,0,0,16,16);}else if(HUMAN[u.sprite])x.drawImage(heroSpr(u.sprite,"f"),0,SMALL[u.sprite]?7:2,16,16,0,0,16,16);else{const im=monSpr(u.sprite);x.drawImage(im,0,0,im.width,im.height,0,0,16,16);}
    c.className=(u.side==="m"?"m":"")+(i===0?" cur":"")+(u.down?" dn":"");el.appendChild(c);}}
function checkEnd(){if(mode!=="combat")return true;
  if(!C.units.some(u=>u.side==="m"&&u.hp>0&&u.inCombat)){victory();return true;}
  if(!heroesUp().length){defeat();return true;}return false;}
async function nextTurn(){
  while(mode==="combat"){
    if(checkEnd())return;
    if(C.cur&&C.cur.st&&C.cur.st.pinned&&C.cur.st.pinned<=C.round)delete C.cur.st.pinned;
    C.idx++;if(C.idx>=C.units.length){C.idx=0;C.round++;tickFire();for(let i=0;i<4;i++)for(const m of G.mons)if(m.state==="investigate"&&!m.inCombat&&m.inv)stepToward(m,m.inv.x,m.inv.y);joinNew();loseTrack();}
    const u=C.units[C.idx];
    if(u.side==="m"&&(u.hp<=0||!u.inCombat))continue;if(u.side==="h"&&u.dead)continue;
    C.cur=u;C.sel=null;C.tgt=null;C.mode="move";C.panel="main";C.turnFlags={};C.armed=null;C.objUsed=false;renderStrip();hud();
    for(const x of G.mons.concat(G.party))if(x.st.helped===u)delete x.st.helped;
    u.reaction=true;delete u.st.dodge;delete u.st.shieldSpell;delete u.st.reckless;u.disengaged=false;
    if(u.side==="h"&&u.down){busy=true;buildPanel();if(S.rules.deathSaves&&!u.stable){await wait(250);await deathSave(u);}delete u.st.surprised;continue;}
    if(u.st.surprised){delete u.st.surprised;u.acted=true;busy=true;buildPanel();float(u,"!?","#ffffff");await say(`The ${u.name} is caught by surprise and loses this turn!`,750);continue;}
    u.acted=true;
    if(u.st.asleep&&!u.st.surprised&&C.round>=2&&Math.random()<.5){delete u.st.asleep;float(u,"AWAKE!","#ffffff");}
    if(u.st.asleep){busy=true;buildPanel();float(u,"ZZZ","#c0a0ff");await say(`The ${u.name} is fast asleep.`,600);continue;}
    if(u.side==="m"){busy=true;buildPanel();await sporesHalo(u);if(u.hp<=0)continue;}
    if(fireAt(u.x,u.y)){busy=true;buildPanel();await say(`The ${u.name} is standing in flames!`,600);await dealDamage(u,roll("2d4").total,"fire",{});}
    if(gnd(u.x,u.y)===GROUND.acid&&(u.side==="h"||u.hp>0)){busy=true;buildPanel();await say(`Acid eats at the ${u.name}!`,600);await dealDamage(u,roll("1d6+1").total,"acid",{});}
    if((u.side==="m"&&u.hp<=0)||u.down||u.dead)continue;
    if(u.st.poisoned){u.st.poisoned--;if(!u.st.poisoned){delete u.st.poisoned;log(`${esc(u.name)} is no longer poisoned.`,"miss");}}
    if(u.st.frightened){u.st.frightened--;if(!u.st.frightened)delete u.st.frightened;}
    if(u.st.turned){u.st.turned--;if(!u.st.turned){delete u.st.turned;log(`${esc(u.name)} stops fleeing.`,"miss");}}
    if(u.side==="m"){busy=true;buildPanel();await monsterTurn(u);delete u.disengaged;await wait(120);continue;}
    heroTurn(u);return;}}
function attacksPer(u){if(u.wild)return u.wild.form==="bear"?2:1;return u.info.extra&&G.level>=5?2:1;}
const canAttack=()=>C.attacksLeft>0||C.actions>0||C.extraAtk>0;
function useAttack(u){if(C.attacksLeft<=0&&C.actions<=0&&C.extraAtk>0){C.extraAtk--;C.dreadHit=true;return;}if(C.attacksLeft<=0){C.actions--;C.attacksLeft=attacksPer(u);}C.attacksLeft--;}
const hasAction=()=>C.actions>0;
function heroTurn(u){C.moveLeft=speedOf(u);C.actions=1;C.bonus=true;C.attacksLeft=0;C.disengaged=false;C.reckless=false;C.sneakUsed=false;C.objUsed=false;C.mode="move";C.tgt=null;C.sel=null;C.weapon="main";C.panel="main";C.pending=null;
  if(u.st.prone){delete u.st.prone;C.moveLeft=Math.floor(C.moveLeft/2);float(u,"STANDS UP","#ffffff");log(`${esc(u.name)} stands up (half movement).`,"miss");}
  C.extraAtk=0;if(u.sub==="gloom"&&!u.dreadDone){u.dreadDone=true;C.moveLeft+=2;C.extraAtk=1;log(`Dread Ambusher: ${esc(u.name)} gets +2 speed and an extra attack this turn.`,"magic");}
  if(u.st.restrained)C.moveLeft=0;
  refreshReach();busy=false;buildPanel();hud();renderStrip();
  prompt(`${u.name}'s turn! Tap a blue square to move, or tap an enemy to attack.${u.st.restrained?" You're restrained: use ACTIONS ▸ ESCAPE.":""}`);}
function refreshReach(){const u=C.cur;C.reach=dijkstra(u,C.moveLeft);}
function endHeroTurn(){if(busy||!C||!C.cur||C.cur.side!=="h"||mode!=="combat")return;busy=true;C.reach=null;C.tgt=null;C.sel=null;C.mode="move";nextTurn();}
function afterAction(){if(mode!=="combat")return;if(checkEnd())return;const u=C.cur;if(u.down||u.dead){busy=true;nextTurn();return;}
  C.mode="move";C.tgt=null;C.panel="main";refreshReach();busy=false;buildPanel();
  const left=[];if(C.moveLeft)left.push(`${C.moveLeft} movement`);if(C.attacksLeft)left.push(`${C.attacksLeft} more attack${C.attacksLeft>1?"s":""}`);else if(C.actions)left.push(C.actions>1?`${C.actions} actions`:"your action");if(C.bonus)left.push("a bonus action");
  prompt(left.length?`${u.name}: you still have ${left.join(", ")}.${canAttack()&&foesOf(u).some(f=>inReachW(u,f,weaponOf(u,C.weapon)))?" An enemy is in reach!":""}`:`${u.name} is done. Tap END TURN.`);}
function inReachW(a,t,w){const d=cheb(a,t);if(w.melee)return d<=1;return d<=w.range&&los(a.x,a.y,t.x,t.y);}
function pathWarnings(u,path){const out=[];let px=u.x,py=u.y;const dis=C.disengaged;
  for(const k of path){const x=k%G.W,y=(k/G.W)|0;
    if(!dis)for(const e of foesOf(u))if(Math.max(Math.abs(e.x-px),Math.abs(e.y-py))===1&&Math.max(Math.abs(e.x-x),Math.abs(e.y-y))>1&&canReact(e)&&canMelee(e)&&!e.fleeing){const s=`an opportunity attack from the ${e.name}`;if(!out.includes(s))out.push(s);}
    if(fireAt(x,y)&&!out.includes("fire"))out.push("fire");const g=gnd(x,y);
    if(g===GROUND.acid&&!out.includes("acid"))out.push("acid");if(g===GROUND.oil&&!fireAt(x,y)&&!out.includes("slippery oil"))out.push("slippery oil");if(g===GROUND.crack&&!out.includes("cracked floor"))out.push("cracked floor");
    px=x;py=y;}
  return out;}

// ---------- tapping the map ----------
async function onTile(x,y){const u=C.cur;if(C.mode==="target")return onTarget(x,y);
  const m=monAt(x,y),h=heroAt(x,y),o=objAt(x,y);
  if(m&&m.inCombat){const w=weaponOf(u,C.weapon);
    if(!canAttack()){prompt(`No attacks left this turn. ${m.name}: ${m.hp}/${m.maxHp} HP${acKnown(m)?", AC "+m.ac:""}.${loreBrief(m)}`);return;}
    if(!inReachW(u,m,w)){prompt(`The ${m.name} is ${cheb(u,m)} squares away: out of reach for your ${w.name} (${w.melee?"must stand next to it; the coloured squares show where everyone really stands":"range "+w.range+", needs a clear line"}). ${m.hp}/${m.maxHp} HP, AC ${m.ac}.`);return;}
    if(C.sel!==m){C.sel=m;const md=attackMods(u,m,w);prompt(`${w.name} vs ${m.name}: ${pctTxt(md,m)} to hit, ${dmgPreview(u,w,m)} damage${modsText(md)}. Tap again to attack.`);return;}
    busy=true;useAttack(u);C.sel=null;buildPanel();await attack(u,m,w);afterAction();return;}
  if(o&&o.type==="barrel"){const w=weaponOf(u,C.weapon);
    if(!canAttack()||!(w.melee?cheb(u,o)<=1:cheb(u,o)<=w.range&&los(u.x,u.y,o.x,o.y))){prompt("An oil barrel. Hit it with an attack to split it open, or shove it over from next to it.");return;}
    if(C.sel!==o){C.sel=o;prompt(`Smash the oil barrel with your ${w.name}?${w.type==="fire"?" Fire will set the oil ablaze!":" Oil will spill around it."} Tap again.`);return;}
    busy=true;useAttack(u);C.sel=null;fx.push({type:"lunge",u,dx:Math.sign(o.x-u.x),dy:Math.sign(o.y-u.y),t:now()});await breakBarrel(o,w.type==="fire",0,0);afterAction();return;}
  if(h&&h!==u){prompt(`${h.name}: ${h.down?"down":h.hp+"/"+h.maxHp+" HP"}, AC ${acOf(h)}${statusText(h)}.`);return;}
  if(m&&!m.inCombat){prompt(`That ${m.name} hasn't joined the fight.${loreBrief(m)}`);return;}
  const k=y*G.W+x;const r=C.reach&&C.reach.get(k);
  if(r&&r.c>0&&r.c<=C.moveLeft&&!unitAt(x,y)){const path=pathTo(C.reach,k);const warn=pathWarnings(u,path);
    if(warn.length&&C.pending!==k){C.pending=k;prompt(`Careful: this move risks ${warn.join(", ")}. Tap again to go anyway.`);return;}
    C.pending=null;busy=true;C.sel=null;buildPanel();const startC=C.reach;await walk(u,path);
    const done=startC.get(u.y*G.W+u.x);C.moveLeft=Math.max(0,C.moveLeft-(done?done.c:r.c));if(u.st.prone||u.st.restrained)C.moveLeft=0;
    fov();const n=joinNew();if(n)await say(n>1?"More enemies join the fight!":"Another enemy joins the fight!",900);afterAction();return;}
  if(C.reach&&!isWall(x,y))prompt(C.moveLeft?"You can't reach that square this turn.":"No movement left. Use ACTIONS ▸ DASH for more.");}
function dmgPreview(u,w,t){let s=w.dice;const b=dmgBonus(u,w);if(b)s+=sgn(b);if(u.conc&&u.conc.type==="mark"&&u.conc.target===t&&!w.spell)s+=" +1d6";
  if(u.info.sneak&&!C.sneakUsed&&(w.finesse||!w.melee)){const md=attackMods(u,t,w);if(md.mode>=0&&(md.mode>0||friendsOf(u).some(f=>cheb(f,t)===1)))s+=` +${sneakDice()} sneak`;}
  if(t.side==="m"&&!loreKnown(t))return s+" (unknown creature)";if(t.tr&&t.tr.vuln&&t.tr.vuln.includes(w.type))s+=" (×2 weakness)";if(t.tr&&t.tr.resist&&t.tr.resist.includes(w.type))s+=" (halved, resists)";if(t.tr&&t.tr.immune&&t.tr.immune.includes(w.type))s+=" (immune!)";return s;}
function statusText(u){const b=[];const s=u.st;if(s.asleep)b.push("asleep");if(s.giant)b.push("giant-sized");if(s.prone)b.push("prone");if(s.poisoned)b.push("poisoned");if(s.restrained)b.push("restrained");if(s.frightened)b.push("frightened");if(s.turned)b.push("turned");
  if(s.dodge)b.push("dodging");if(s.hidden)b.push("hidden");if(s.blessed)b.push("blessed");if(s.raging)b.push("raging");if(s.guided)b.push("glowing");if(u.conc)b.push("concentrating: "+u.conc.name);if(u.wild)b.push("wolf form");return b.length?" · "+b.join(", "):"";}

// ---------- targeting ----------
function targetMode(spec){C.mode="target";C.tgt=spec;C.sel=null;C.panel="target";buildPanel();prompt(spec.label);}
function validTarget(spec,x,y){const u=C.cur;if(!inB(x,y))return false;const d=cheb(u,{x,y});if(d>(spec.range||1))return false;
  if(spec.kind==="enemy"){const m=monAt(x,y);return !!(m&&m.inCombat&&(seen(x,y))&&(d<=1||los(u.x,u.y,x,y)));}
  if(spec.kind==="ally"){const h=heroAt(x,y);return !!(h&&!h.dead&&(d<=1||los(u.x,u.y,x,y)));}
  if(spec.kind==="adjfoe"){const m=monAt(x,y);if(m&&m.inCombat)return d<=1;const o=objAt(x,y);return !!(spec.barrel&&o&&o.type==="barrel"&&d<=1);}
  if(spec.kind==="tile"){if(isWall(x,y))return false;if(spec.empty&&(unitAt(x,y)||blocksObj(x,y)))return false;return d<=1||los(u.x,u.y,x,y);}
  return false;}
async function onTarget(x,y){const spec=C.tgt;const u=C.cur;
  if(!validTarget(spec,x,y)){prompt(spec.bad||spec.label);return;}
  if(spec.area){if(!C.area||C.area.x!==x||C.area.y!==y){C.area={x,y};prompt(spec.preview?spec.preview(x,y):"Tap again to confirm.");return;}}
  else if(spec.confirm&&C.sel!==y*G.W+x){C.sel=y*G.W+x;prompt(spec.confirm(x,y));return;}
  const unit=spec.kind==="ally"?heroAt(x,y):spec.kind==="tile"?null:(monAt(x,y)||objAt(x,y));
  C.area=null;C.sel=null;C.mode="move";busy=true;buildPanel();
  try{await spec.onPick(x,y,unit);}catch(e){console.error(e);}
  afterAction();}
function cancelTarget(){if(!C)return;C.mode="move";C.tgt=null;C.area=null;C.sel=null;C.panel="main";buildPanel();afterAction();}
const areaTiles=(x,y,r)=>{const out=[];for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++)if(inB(x+dx,y+dy)&&!isWall(x+dx,y+dy))out.push([x+dx,y+dy]);return out;};
function unitsIn(x,y,r,heroesToo){const u=[];for(const m of G.mons)if(m.hp>0&&Math.abs(m.x-x)<=r&&Math.abs(m.y-y)<=r)u.push(m);
  if(heroesToo)for(const h of G.party)if(!h.dead&&!h.down&&Math.abs(h.x-x)<=r&&Math.abs(h.y-y)<=r)u.push(h);return u;}
function areaPreview(name,x,y,r,heroes){const l=unitsIn(x,y,r,heroes);const e=l.filter(v=>v.side==="m").length,a=l.filter(v=>v.side==="h").length;
  return `${name} here hits ${e} enem${e===1?"y":"ies"}${a?` and ${a} of YOUR party!`:""}. Tap again to cast.`;}

// ---------- class features ----------
function featButtons(u){const B=[];const info=u.info;
  if(u.wild){if(u.sub==="moon")B.push({t:"MOON HEAL",sub:`Bonus action · spend a slot: heal 1d8 per level`,dis:!C.bonus||!slotAvail(u,1)||u.wild.hp>=u.wild.max,f:()=>FEAT_RUN.moonheal(u)});
    B.push({t:"REVERT",sub:"Bonus action: leave beast form",dis:!C.bonus,f:async()=>{busy=true;C.bonus=false;u.wild=null;computeLight();fov();await say(`${u.name} returns to normal form.`,700);afterAction();}});return B;}
  if(info.alt.save)B.push({t:"SACRED FLAME",sub:"Cantrip · action · DEX save · ignores cover",dis:!hasAction()||C.attacksLeft>0,f:()=>targetMode({kind:"enemy",range:12,label:"Sacred Flame: tap an enemy within 12 squares.",onPick:async(x,y,t)=>{C.actions--;await sacredFlame(u,t);}})});
  for(const f of featsOf(u)){const F=FEATS[f];const left=F.res?u.res[F.res]||0:null;const costOK=F.cost==="bonus"?C.bonus:F.cost==="action"?hasAction()&&C.attacksLeft===0:true;
    let dis=!costOK||(F.res&&left<=0);if(f==="reckless")dis=C.reckless;if(f==="frenzy")dis=dis||!u.st.raging;if(f==="giantsmight")dis=dis||!!u.st.giant;if(f==="symbiotic")dis=dis||!!u.st.symbiotic;
    if(F.cost==="free"&&F.res&&f!=="actionsurge"){const armedK={mtrip:"trip",mpush:"push",mmenace:"menace",mprecise:"precise",guidedstrike:"guided"}[f];if(armedK){if(C.armed===armedK){B.push({t:"✓ "+F.name.toUpperCase(),sub:"armed for your next attack · tap to disarm",sel:true,f:()=>{C.armed=null;buildPanel();}});continue;}dis=dis||!canAttack();}}if(f==="secondwind")dis=dis||u.hp>=u.maxHp;if(f==="rage")dis=dis||u.st.raging;
    B.push({t:F.name.toUpperCase(),sub:`${F.cost==="free"?"free":F.cost==="bonus"?"bonus action":"action"}${left!==null?` · ${left} left`:""}`,dis,f:()=>FEAT_RUN[f](u)});}
  for(const s of spellsOf(u)){const sp=SPELLS[s];const maxLvl=u.slots.length;
    if(s==="shield"){B.push({t:"SHIELD",sub:"Reaction · used automatically when hit",dis:true});continue;}
    if(sp.lvl>maxLvl){B.push({t:sp.name.toUpperCase(),sub:`Unlocks at party level ${sp.lvl===3?5:3}`,dis:true});continue;}
    if(s==="huntersmark"&&u.conc&&u.conc.type==="mark"&&!u.conc.target){B.push({t:"MOVE MARK",sub:"Bonus action · no slot",dis:!C.bonus,f:()=>targetMode({kind:"enemy",range:18,label:"Move Hunter's Mark: tap an enemy.",onPick:async(x,y,t)=>{C.bonus=false;u.conc.target=t;await say(`The Ranger marks the ${t.name}.`,800);}})});continue;}
    const costOK=sp.cost==="bonus"?C.bonus:hasAction()&&C.attacksLeft===0;const slot=slotAvail(u,sp.lvl);
    B.push({t:sp.name.toUpperCase(),sub:`${sp.cost==="bonus"?"bonus action":"action"} · ${slot?"level "+slot+" slot":"no slots"}${sp.conc?" · concentration":""}`,dis:!costOK||!slot||u.st.raging,f:()=>SPELL_RUN[s](u)});}
  if(u.wand>0)B.push({t:"WAND: MAGIC MISSILE",sub:`action · ${u.wand} charges`,dis:!hasAction()||C.attacksLeft>0,f:()=>SPELL_RUN.magicmissile(u,{wand:true})});
  return B;}
const FEAT_RUN={
  secondwind:async u=>{if(u.hp>=u.maxHp){prompt("You're already at full health.");return;}busy=true;C.bonus=false;u.res.secondwind--;const d=roll(`1d10+${G.level}`);heal(u,d.total);await say(`Second Wind! The ${u.name} recovers ${d.total} HP.`,900);afterAction();},
  actionsurge:async u=>{busy=true;u.res.actionsurge--;C.actions++;fx.push({type:"ring",u,col:"#ffe060",t:now()});await say(`Action Surge! The ${u.name} gets an extra action this turn.`,900);afterAction();},
  rage:async u=>{busy=true;C.bonus=false;u.res.rage--;u.st.raging=true;if(u.conc)endConc(u);fx.push({type:"rage",u,t:now()});hud();await say(`The Barbarian flies into a RAGE! +2 melee damage and half damage from physical hits.`,1000);afterAction();},
  reckless:async u=>{C.reckless=true;u.st.reckless=true;buildPanel();prompt("Reckless Attack: your melee attacks have advantage this turn, but enemies get advantage against you until your next turn.");},
  cdash:async u=>{busy=true;C.bonus=false;C.moveLeft+=speedOf(u);await say(`Cunning Action: Dash! ${C.moveLeft} movement left.`,700);afterAction();},
  cdisengage:async u=>{busy=true;C.bonus=false;C.disengaged=true;await say(`Cunning Action: Disengage. Moving won't provoke opportunity attacks this turn.`,800);afterAction();},
  chide:async u=>{busy=true;C.bonus=false;await tryHide(u);afterAction();},
  volley:u=>targetMode({kind:"tile",range:weaponOf(u,"main").range,area:1,label:"Volley: tap a square in range. Every enemy within 1 square of it gets shot.",
    preview:(x,y)=>areaPreview("Volley",x,y,1,false),onPick:async(x,y)=>{C.actions--;u.res.volley--;const w=weaponOf(u,"main");const list=unitsIn(x,y,1,false).filter(m=>m.inCombat);
      await say(`Volley! The ${u.name} looses a hail of arrows.`,700);for(const m of list){if(m.hp>0)await attack(u,m,w);}}}),
  turnundead:async u=>{const und=G.mons.filter(m=>m.inCombat&&m.hp>0&&m.tr.undead&&cheb(m,u)<=6&&los(u.x,u.y,m.x,m.y));
    if(!und.length){prompt("No undead within 6 squares can see you.");return;}busy=true;C.actions--;u.res.turnundead--;fx.push({type:"ring",u,col:"#fff0a0",t:now()});
    await say(`The Cleric raises a holy symbol: "Begone!"`,800);for(const m of und){const s=saveRoll(m,"wis",spellDC(u));if(!s.ok){m.st.turned=3;float(m,"TURNED","#fff0a0");}log(`${esc(m.name)}: ${s.txt} — ${s.ok?"resists":"turned"}.`,"magic");}
    await say(`${und.filter(m=>m.st.turned).length} of ${und.length} undead flee in terror!`,900);afterAction();},
  wildshape:async u=>{let bear=false;if(u.sub==="moon"){const c=await choose("Which beast?",[{t:"BROWN BEAR",sub:`${wildHP(u,"bear")} HP · AC 11 · two claw attacks 2d6+4`},{t:"WOLF",sub:`${wildHP(u,"wolf")} HP · AC 13 · bite knocks prone`},{t:"CANCEL"}]);if(c<0||c===2){buildPanel();return;}bear=c===0;}
    busy=true;C.bonus=false;u.res.wildshape--;if(u.conc)endConc(u);startWild(u,bear?"bear":"wolf");fx.push({type:"ring",u,col:"#8aff7a",t:now()});
    await say(bear?`Wild Shape! The ${u.name} becomes a brown bear: ${u.wild.hp} HP, two claw attacks.`:`Wild Shape! The ${u.name} becomes a wolf: ${u.wild.hp} HP, bite 2d4+2 that can knock foes prone, speed 8.`,1100);C.moveLeft+=Math.max(0,8-speedOf(Object.assign({},u,{wild:null})));afterAction();}
};
async function tryHide(u){const watchers=foesOf(u).filter(e=>los(e.x,e.y,u.x,u.y)&&cheb(e,u)<=10);
  if(foesOf(u).some(e=>cheb(e,u)===1)){await say("You can't hide with an enemy right next to you.",900);return;}
  const shade=!litAt(u.x,u.y);const exposed=watchers.filter(e=>{const dark=shade&&(!(e.tr&&e.tr.dv)||u.id==="rogue");return !dark&&coverOf(e,u)<2;});
  if(exposed.length){await say(`The ${exposed[0].name} can see you clearly. Get into darkness or behind cover first.`,1000);return;}
  const dc=Math.max(10,...watchers.map(e=>passive(e,"perception")));const c=await check(u,"stealth",dc,{adv:shade&&u.id==="rogue"});
  if(c.ok){u.st.hidden=true;await say(`Hidden! (${c.txt}) Your next attack has advantage.`,950);}else await say(`Spotted. (${c.txt})`,850);}
// ---------- spells ----------
const SPELL_RUN={
  magicmissile:(u,o)=>{o=o||{};targetMode({kind:"enemy",range:24,label:"Magic Missile: tap an enemy you can see.",onPick:async(x,y,t)=>{C.actions--;let lvl=1;
    if(o.wand)u.wand--;else if(o.scroll)takeItem("scroll_mm");else lvl=useSlot(u,1);delete u.st.hidden;
    const n=2+lvl;await say(`Magic Missile! ${n} glowing darts streak out.`,700);fx.push({type:"missile",from:u,to:t,n,t:now()});await wait(450);
    for(let i=0;i<n;i++){let tg=t.hp>0?t:foesOf(u).filter(m=>seen(m.x,m.y)).sort((a,b)=>cheb(a,u)-cheb(b,u))[0];if(!tg)break;await dealDamage(tg,roll("1d4+1").total,"force",{src:u,spellLvl:o.wand||o.scroll?0:lvl});}}});},
  thunderwave:async u=>{const list=unitsIn(u.x,u.y,1,u.sub!=="evoker").filter(v=>v!==u);const allies=list.filter(v=>v.side==="h").length;const barrels=G.objs.filter(o=>o.type==="barrel"&&!o.gone&&cheb(o,u)===1);
    if(!list.length&&!barrels.length){prompt("Nobody is next to you. Thunderwave hits everything in the 8 squares around you.");return;}
    const c=await choose(`Thunderwave hits ${list.length-allies} enem${list.length-allies===1?"y":"ies"}${allies?` and ${allies} ALL${allies>1?"IES":"Y"}`:""} next to you, pushing them 2 squares.`,[{t:"CAST IT"},{t:"CANCEL"}]);if(c!==0){buildPanel();return;}
    busy=true;C.actions--;const lvl=useSlot(u,1);delete u.st.hidden;makeNoise(u.x,u.y,14);fx.push({type:"wave",u,t:now()});await say("THUNDERWAVE! A boom of force rolls outward.",800);const dc=spellDC(u);
    for(const b of barrels)await breakBarrel(b,false,Math.sign(b.x-u.x),Math.sign(b.y-u.y));
    for(const v of list){if(v.dead||(v.side==="m"&&v.hp<=0))continue;const s=saveRoll(v,"con",dc);const dm=roll(`${1+lvl}d8`).total;log(`${esc(v.name)}: ${s.txt}.`,"magic");
      await dealDamage(v,s.ok?Math.floor(dm/2):dm,"thunder",{src:u,spellLvl:lvl});if(!s.ok&&!v.dead&&!v.down&&(v.side==="h"||v.hp>0))await pushUnit(v,Math.sign(v.x-u.x),Math.sign(v.y-u.y),2);}
    afterAction();},
  fireball:(u,o)=>{o=o||{};targetMode({kind:"tile",range:12,area:2,label:"Fireball: tap a square within 12 to aim (5×5 blast).",preview:(x,y)=>areaPreview("Fireball",x,y,2,!(u.sub==="evoker"&&!o.scroll)),
    onPick:async(x,y)=>{C.actions--;let lvl=3,dc=15;if(o.scroll)takeItem("scroll_fb");else{lvl=useSlot(u,3);dc=spellDC(u);}delete u.st.hidden;await castFireball(u,x,y,lvl,dc);}});},
  curewounds:(u,o)=>{o=o||{};targetMode({kind:"ally",range:1,label:"Cure Wounds: tap yourself or an ally right next to you.",onPick:async(x,y,t)=>{C.actions--;let lvl=1,mod=3;
    if(o.scroll)takeItem("scroll_cure");else{lvl=useSlot(u,1);mod=castMod(u);}const was=t.down;const n=roll(`${1+lvl}d8+${mod}`).total+(u.sub==="life"&&!o.scroll?2+lvl:0);heal(t,n);
    await say(was?`Cure Wounds! The ${t.name} gets back up with ${t.hp} HP!`:`Cure Wounds! The ${t.name} recovers ${n} HP.`,950);}});},
  healingword:u=>targetMode({kind:"ally",range:12,label:"Healing Word: tap an ally within 12 squares.",onPick:async(x,y,t)=>{C.bonus=false;const lvl=useSlot(u,1);const was=t.down;const n=roll(`${lvl*2}d4+${castMod(u)}`).total+(u.sub==="life"?2+lvl:0);heal(t,n);
    await say(was?`Healing Word! The ${t.name} gets back up with ${t.hp} HP!`:`Healing Word! The ${t.name} recovers ${n} HP.`,950);}}),
  bless:async u=>{busy=true;C.actions--;useSlot(u,1);const tg=[u].concat(heroesUp().filter(h=>h!==u&&cheb(h,u)<=6).sort((a,b)=>cheb(a,u)-cheb(b,u)).slice(0,2));
    startConc(u,{type:"bless",name:"Bless",targets:tg});for(const t of tg){t.st.blessed=true;fx.push({type:"ring",u:t,col:"#fff0a0",t:now()});}
    await say(`Bless! ${tg.map(t=>t.name).join(", ")} add 1d4 to attacks and saves while the Cleric concentrates.`,1100);afterAction();},
  guidingbolt:u=>targetMode({kind:"enemy",range:24,label:"Guiding Bolt: tap an enemy you can see.",onPick:async(x,y,t)=>{C.actions--;const lvl=useSlot(u,1);delete u.st.hidden;
    await attack(u,t,{name:"Guiding Bolt",abil:u.info.castAbil,spell:true,dice:`${3+lvl}d6`,type:"radiant",range:24,melee:false},{onHit:async tt=>{tt.st.guided=true;float(tt,"GLOWING","#fff0a0");}});}}),
  huntersmark:u=>targetMode({kind:"enemy",range:18,label:"Hunter's Mark: tap an enemy you can see.",onPick:async(x,y,t)=>{C.bonus=false;useSlot(u,1);startConc(u,{type:"mark",name:"Hunter's Mark",target:t});
    await say(`The Ranger marks the ${t.name}. Weapon hits on it deal +1d6.`,900);}}),
  entangle:u=>targetMode({kind:"tile",range:18,area:1,label:"Entangle: tap a square to aim (3×3).",preview:(x,y)=>areaPreview("Entangle",x,y,1,true),
    onPick:async(x,y)=>{C.actions--;useSlot(u,1);const tiles=areaTiles(x,y,1).map(([a,b])=>b*G.W+a);startConc(u,{type:"entangle",name:"Entangle",tiles});for(const k of tiles)G.entangle.add(k);
      fx.push({type:"vines",x,y,t:now()});await wait(300);const dc=spellDC(u);let n=0;const list=unitsIn(x,y,1,true);
      for(const v of list){const s=saveRoll(v,"str",dc);if(!s.ok){v.st.restrained={dc,by:"entangle",src:u};n++;float(v,"TANGLED","#8aff7a");}else float(v,"SAVED","#ffffff");log(`${esc(v.name)}: ${s.txt}.`,"magic");}
      await say(`Entangle! ${n} of ${list.length} caught in the vines. The area is now difficult terrain.`,1000);}})
};
async function sacredFlame(u,t){delete u.st.hidden;const s=saveRoll(t,"dex",spellDC(u));fx.push({type:"pillar",x:t.x,y:t.y,t:now()});const dm=roll(G.level>=5?"2d8":"1d8").total;
  await say(`Sacred Flame! The ${t.name} ${s.ok?"dodges the radiance":"is engulfed in holy light"} (${s.txt}).`,900);if(!s.ok)await dealDamage(t,dm,"radiant",{src:u});}
async function castFireball(u,x,y,lvl,dc){makeNoise(x,y,14);fx.push({type:"boom",x,y,big:true,t:now()});await wait(350);const dm=roll(`${5+lvl}d6`).total;const list=unitsIn(x,y,2,u.sub!=="evoker");
  await say(`FIREBALL! ${dm} fire damage. Everyone in the blast makes a DEX save (DC ${dc}) to halve it.`,1100);
  for(const [a,b] of areaTiles(x,y,2))if(gnd(a,b)===GROUND.oil)igniteAt(a,b);
  for(const v of list){if(v.dead||(v.side==="m"&&v.hp<=0))continue;const s=saveRoll(v,"dex",dc);log(`${esc(v.name)}: ${s.txt}.`,"magic");await dealDamage(v,s.ok?Math.floor(dm/2):dm,"fire",{src:u,spellLvl:lvl});}
  for(const b of G.objs.filter(o=>o.type==="barrel"&&!o.gone&&Math.abs(o.x-x)<=2&&Math.abs(o.y-y)<=2))await breakBarrel(b,true,0,0);}

// ---------- general actions ----------
function actionButtons(u){const B=[];const act=hasAction()&&C.attacksLeft===0;
  B.push({t:"DASH",sub:"Action: double movement",dis:!act,f:async()=>{busy=true;C.actions--;C.moveLeft+=speedOf(u);await say(`Dash! ${C.moveLeft} movement left.`,700);afterAction();}});
  B.push({t:"DODGE",sub:"Action: attacks vs you get disadvantage",dis:!act,f:async()=>{busy=true;C.actions--;u.st.dodge=true;fx.push({type:"ring",u,col:"#9fd0ff",t:now()});await say(`The ${u.name} focuses on dodging. Attacks against them have disadvantage until their next turn.`,950);afterAction();}});
  B.push({t:"DISENGAGE",sub:"Action: move without opportunity attacks",dis:!act||C.disengaged,f:async()=>{busy=true;C.actions--;C.disengaged=true;await say("Disengage: moving won't provoke opportunity attacks this turn.",850);afterAction();}});
  B.push({t:"HELP",sub:"Action: next ally attack vs an adjacent foe has advantage",dis:!act,f:()=>targetMode({kind:"adjfoe",range:1,label:"Help: tap an enemy next to you.",onPick:async(x,y,t)=>{C.actions--;t.st.helped=u;float(t,"DISTRACTED","#ffffff");await say(`The ${u.name} distracts the ${t.name}. The next ally attack against it has advantage.`,950);}})});
  B.push({t:"SHOVE",sub:"Uses an attack: push 1 square or knock prone",dis:!canAttack(),f:()=>targetMode({kind:"adjfoe",range:1,barrel:true,label:"Shove: tap an enemy (or an oil barrel) next to you. Push them into hazards, traps or off ledges!",
    onPick:async(x,y,t)=>{useAttack(u);await shove(u,t);}})});
  B.push({t:"HIDE",sub:"Action: Stealth check in darkness or behind cover",dis:!act,f:async()=>{busy=true;C.actions--;await tryHide(u);afterAction();}});
  if(u.st.restrained)B.push({t:"ESCAPE",sub:`Action: break free (DC ${u.st.restrained.dc})`,dis:!act,f:async()=>{busy=true;C.actions--;const sk=skillBonus(u,"athletics")>=skillBonus(u,"acrobatics")?"athletics":"acrobatics";const c=await check(u,sk,u.st.restrained.dc);
    if(c.ok){delete u.st.restrained;await say(`Free! (${c.txt})`,800);}else await say(`Still stuck. (${c.txt})`,800);afterAction();}});
  for(const a of G.party)if(a!==u&&a.down&&!a.dead&&!a.stable&&cheb(a,u)<=1)B.push({t:`STABILIZE ${a.name.toUpperCase()}`,sub:"Action · Medicine DC 10 · stops death saves",dis:!act,f:async()=>{busy=true;C.actions--;const c=await check(u,"medicine",10);
    if(c.ok){a.stable=true;a.ds={s:0,f:0};await say(`The ${u.name} stops the bleeding. The ${a.name} is stable. (${c.txt})`,1000);}else await say(`The ${u.name} can't stop the bleeding. (${c.txt})`,900);hud();afterAction();}});
  B.push(...snuffButtons(u),...classCombatButtons(u));
  {const fast=u.id==="rogue";const ok=fast?C.bonus:hasAction()&&C.attacksLeft===0;const spend=()=>{if(fast)C.bonus=false;else C.actions--;};const cost=fast?"Bonus action (rogue)":"Action";
    if((G.bag.poisonvial||0)>0&&!u.coat&&!u.wild)B.push({t:"POISON YOUR WEAPON",sub:`${cost} · next attack +2d4 poison, CON save or poisoned`,dis:!ok,f:async()=>{busy=true;spend();takeItem("poisonvial");u.coat={name:"poison",type:"poison",dice:"2d4"};await say(`The ${u.name} smears poison along the weapon.`,800);afterAction();}});
    const acid=[[0,0]].concat(DIRS8).some(([dx,dy])=>gnd(u.x+dx,u.y+dy)===GROUND.acid);
    if(acid&&!u.coat&&!u.wild)B.push({t:"DIP WEAPON IN ACID",sub:`${cost} · next attack +2d4 acid`,dis:!ok,f:async()=>{busy=true;spend();u.coat={name:"acid",type:"acid",dice:"2d4"};await say(`The ${u.name} dips the weapon in the hissing puddle.`,800);afterAction();}});}
  for(const [dx,dy] of DIRS8){const d=doorAt(u.x+dx,u.y+dy);if(!d)continue;
    if(d.locked){const fh=u.sub==="thief";d.tried=d.tried||{pick:[],force:[]};const done=d.tried.pick.includes(u.id);B.push({t:"PICK LOCK",sub:done?"You've already tried this lock":`${fh?"Bonus action":"Action"} · Thieves' Tools DC 15${toolNote(u)}`,dis:done||(fh?!C.bonus:!act),f:async()=>{busy=true;d.tried.pick.push(u.id);if(fh)C.bonus=false;else C.actions--;const c=await check(u,"thieves",15);if(c.ok){d.locked=false;d.open=true;computeLight();fov();}await say(c.ok?`Click. The lock opens. (${c.txt})`:`The lock holds. (${c.txt})`,850);afterAction();}});}
    else B.push({t:d.open?"CLOSE DOOR":"OPEN DOOR",sub:"Free once per turn",dis:C.objUsed||(d.open&&!!unitAt(d.x,d.y)),f:async()=>{C.objUsed=true;d.open=!d.open;computeLight();fov();afterAction();}});}
  for(const [dx,dy] of DIRS8){const t=trapAt(u.x+dx,u.y+dy);if(t&&t.found){const fh=u.sub==="thief";B.push({t:"DISARM TRAP",sub:`${fh?"Bonus action":"Action"} · Thieves' Tools DC ${t.dc}${toolNote(u)}`,dis:fh?!C.bonus:!act,f:async()=>{busy=true;if(fh)C.bonus=false;else C.actions--;await disarm(u,t);afterAction();}});}}
  return B;}
function itemButtons(u){const B=[];const n=id=>G.bag[id]||0;const fh=u.sub==="thief";const act=fh?C.bonus:hasAction()&&C.attacksLeft===0;const spend=()=>{if(fh)C.bonus=false;else C.actions--;};const AC=fh?"Bonus action (Fast Hands)":"Action";
  for(const id of ["potion","gpotion"]){if(!n(id))continue;const it=ITEMS[id];const dice=id==="potion"?"2d4+2":"4d4+4";
    B.push({t:`DRINK ${id==="potion"?"POTION":"GREATER"}`,sub:`Bonus action · ${dice} · ${n(id)} left`,dis:!C.bonus||u.hp>=u.maxHp,f:async()=>{busy=true;C.bonus=false;takeItem(id);const h=roll(dice).total;heal(u,h);await say(`The ${u.name} drinks a potion: +${h} HP.`,850);afterAction();}});
    B.push({t:`GIVE ${id==="potion"?"POTION":"GREATER"}`,sub:`${AC} · adjacent ally (revives the downed)`,dis:!act,f:()=>targetMode({kind:"ally",range:1,label:"Tap an ally next to you.",onPick:async(x,y,t)=>{spend();takeItem(id);const was=t.down;const h=roll(dice).total;heal(t,h);await say(was?`The ${u.name} pours a potion down the ${t.name}'s throat. They're back up!`:`The ${t.name} drinks: +${h} HP.`,900);}})});}
  if(n("antitoxin"))B.push({t:"ANTITOXIN",sub:`${AC} · cures poison`,dis:!act||!u.st.poisoned,f:async()=>{busy=true;spend();takeItem("antitoxin");delete u.st.poisoned;await say("The poison fades.",700);afterAction();}});
  if(n("oil"))B.push({t:"THROW OIL",sub:`${AC} · range 4 · ${n("oil")} left`,dis:!act,f:()=>targetMode({kind:"tile",range:4,label:"Throw the oil flask: tap a square within 4.",onPick:async(x,y)=>{spend();takeItem("oil");
    spill(x,y,[[x,y],[x+1,y],[x-1,y],[x,y+1],[x,y-1]]);await say("The flask shatters. Slick oil spreads across the floor!",850);if(fireAt(x,y)||[[1,0],[-1,0],[0,1],[0,-1]].some(([a,b])=>fireAt(x+a,y+b))){igniteAt(x,y);await scorch();}}})});
  if(n("torch")){B.push({t:"PLACE TORCH",sub:"Free · lights an adjacent square",dis:C.objUsed,f:()=>targetMode({kind:"tile",range:1,empty:false,label:"Place a torch: tap a square next to you.",onPick:async(x,y)=>{C.objUsed=true;takeItem("torch");G.dropLights.push({x,y});if(gnd(x,y)===GROUND.oil){igniteAt(x,y);await say("The torch lands in the oil. FWOOSH!",800);await scorch();}fov();}})});
    B.push({t:"THROW TORCH",sub:`${AC} · range 4 · lights & ignites oil`,dis:!act,f:()=>targetMode({kind:"tile",range:4,label:"Throw a torch: tap a square within 4.",onPick:async(x,y)=>{spend();takeItem("torch");G.dropLights.push({x,y});
      if(gnd(x,y)===GROUND.oil){igniteAt(x,y);await say("The torch lands in the oil. FWOOSH!",800);await scorch();}else await say("The torch lights up the area.",600);fov();joinNew();}})});}
  if(["scroll_mm","scroll_cure","scroll_fb"].some(id=>n(id)&&!isKnown(id)))B.push({t:"UNREAD SCROLL",sub:"Identify it in the bag first",dis:true});
  if(n("scroll_mm")&&isKnown("scroll_mm"))B.push({t:"SCROLL: MISSILE",sub:"Action · 3 darts of 1d4+1",dis:!(hasAction()&&C.attacksLeft===0),f:()=>SPELL_RUN.magicmissile(u,{scroll:true})});
  if(n("scroll_cure")&&isKnown("scroll_cure"))B.push({t:"SCROLL: CURE",sub:"Action · touch · 2d8+3",dis:!(hasAction()&&C.attacksLeft===0),f:()=>SPELL_RUN.curewounds(u,{scroll:true})});
  if(n("scroll_fb")&&isKnown("scroll_fb"))B.push({t:"SCROLL: FIREBALL",sub:"Action · 8d6 · DC 15",dis:!(hasAction()&&C.attacksLeft===0),f:()=>SPELL_RUN.fireball(u,{scroll:true})});
  if(!B.length)B.push({t:"BAG IS EMPTY",sub:"Find potions, oil and scrolls in chests and shops",dis:true});
  return B;}
async function disarm(u,t){const c=await check(u,"thieves",t.dc,{adv:!!t.easy});
  if(c.ok){t.done=true;t.disarmed=true;await say(`Disarmed! (${c.txt}) +10 XP.`,900);if(t.type==="darts"){addItem("poisonvial");await say("You carefully drain the poison from the dart reservoir: +1 Poison Vial.",1100);}if(C)C.xp+=10;else for(const m of gainXpNow(10))await say(m,1200);return true;}
  if(c.total<=t.dc-5){await say(`The ${u.name} slips. (${c.txt})`,700);const old={x:u.x,y:u.y};await triggerTrap(t,u);u.x=old.x;u.y=old.y;return false;}
  t.disFail="You can't work out how to disarm it.";await say(`Not quite. (${c.txt}) You can't work out how to disarm it.`,900);return false;}

// ---------- monster AI ----------
function threatScore(m,h,w){return (h.hp/h.maxHp)*4+(h.conc?-2:0)+(h.st.hidden?6:0)+(acOf(h)-13)*.35+(h.st.prone&&w.melee?-1.5:0)+(h.st.dodge?2:0);}
function truncatePath(dist,path,budget){const out=[];for(const k of path){const n=dist.get(k);if(!n||n.c>budget)break;out.push(k);}while(out.length){const k=out[out.length-1];if(!unitAt(k%G.W,(k/G.W)|0))break;out.pop();}return out;}
async function monsterTurn(m){const T=m.tr;await wait(200);
  let move=m.speed;if(m.st.prone){delete m.st.prone;move=Math.floor(move/2);float(m,"STANDS","#ffffff");}
  if(m.st.restrained){const w=weaponOf(m);const near=heroesUp().filter(h=>inReachW(m,h,w));
    if(!near.length||Math.random()<.5){const c=await check(m,"athletics",m.st.restrained.dc,{quiet:true});if(c.ok){const by=m.st.restrained.by;delete m.st.restrained;await say(`The ${m.name} tears free of the ${by==="web"?"webbing":"vines"}!`,750);}
      else{await say(`The ${m.name} struggles against the ${m.st.restrained.by==="web"?"webbing":"vines"}.`,700);return;}}
    move=m.st.restrained?0:move;}
  if(m.boss&&m.phase===1&&m.hp<=m.maxHp/2){m.phase=2;await bossPhase(m);}
  if(T.healer){if(m.healReady){const ally=friendsOf(m).filter(a=>a.hp<a.maxHp*.5&&cheb(a,m)<=6&&los(m.x,m.y,a.x,a.y)).sort((a,b)=>a.hp-b.hp)[0];
      if(ally){m.healReady=false;const n=roll("2d4+2").total;ally.hp=Math.min(ally.maxHp,ally.hp+n);float(ally,"+"+n,"#8aff7a");fx.push({type:"heal",u:ally,t:now()});await say(`The ${m.name} chants and heals the ${ally.name} for ${n}!`,900);}}else m.healReady=true;}
  if(T.web&&!m.webReady&&rnd(6)>=5)m.webReady=true;
  if(m.fleeing||m.st.turned){await fleeTurn(m,move);return;}
  const targets=heroesUp();if(!targets.length)return;
  if(T.aggressive&&!targets.some(h=>cheb(h,m)===1)){move+=m.speed;float(m,"CHARGE!","#ffe060");}
  if(T.web&&m.webReady){const t=targets.filter(h=>!h.st.restrained&&cheb(h,m)<=6&&cheb(h,m)>1&&los(m.x,m.y,h.x,h.y)).sort((a,b)=>cheb(a,m)-cheb(b,m))[0];
    if(t){m.webReady=false;fx.push({type:"shot",from:{x:m.x,y:m.y},to:{x:t.x,y:t.y},t:now(),col:"#ffffff"});const r=rnd(20)+5;await dice(t,r-5,null);
      if(r>=acOf(t)){t.st.restrained={dc:12,by:"web",src:m};float(t,"WEBBED","#ffffff");await say(`The ${m.name} spits a web: ${r} vs AC ${acOf(t)}. The ${t.name} is stuck! (Escape DC 12)`,1000);}
      else await say(`The ${m.name} spits a web at the ${t.name}, but misses.`,800);return;}}
  const w=weaponOf(m);
  if(w.melee){let adj=targets.filter(h=>cheb(h,m)===1);
    if(!adj.length&&move>0){const dist=dijkstra(m,80);let best=null,bs=1e9;
      for(const [k,v] of dist){const x=k%G.W,y=(k/G.W)|0;const occ=unitAt(x,y);if(occ&&occ!==m)continue;for(const h of targets){if(Math.max(Math.abs(h.x-x),Math.abs(h.y-y))!==1)continue;const sc=v.w+threatScore(m,h,w)*2;if(sc<bs){bs=sc;best=k;}}}
      if(best!==null){const path=truncatePath(dist,pathTo(dist,best),move);if(path.length)await walk(m,path);if(m.hp<=0||!m.inCombat)return;}
      adj=heroesUp().filter(h=>cheb(h,m)===1);}
    if(!adj.length)return;
    if(T.shover){for(const h of adj){const res=pushResult(h,Math.sign(h.x-m.x),Math.sign(h.y-m.y));
      if(/fire|acid|ledge|trap|crack|oil/.test(res)&&Math.random()<.6){await say(`The ${m.name} tries to shove the ${h.name} ${res.includes("ledge")?"off the ledge":"toward the "+res}!`,850);await shove(m,h,"push");if(!T.multi)return;break;}}}
    const n=T.multi||1;for(let i=0;i<n;i++){const t=heroesUp().filter(h=>cheb(h,m)===1).sort((a,b)=>threatScore(m,a,w)-threatScore(m,b,w))[0];if(!t)break;await attack(m,t,w,{});if(!heroesUp().length||m.hp<=0)break;}
    return;}
  // ranged
  const shoot=(x,y)=>targets.filter(h=>Math.max(Math.abs(h.x-x),Math.abs(h.y-y))<=w.range&&los(x,y,h.x,h.y));
  const adjAt=(x,y)=>targets.some(h=>Math.max(Math.abs(h.x-x),Math.abs(h.y-y))===1);
  if(!(shoot(m.x,m.y).length&&!adjAt(m.x,m.y))&&move>0){const dist=dijkstra(m,80);let best=null,bs=-1e9;
    for(const [k,v] of dist){const x=k%G.W,y=(k/G.W)|0;const occ=unitAt(x,y);if(occ&&occ!==m)continue;const sh=shoot(x,y);const near=Math.min(...targets.map(h=>Math.max(Math.abs(h.x-x),Math.abs(h.y-y))));
      let sc=sh.length?20:0;sc+=(adjAt(x,y)?-40:0)+Math.min(near,5)*2-(v.c>move?(v.c-move)*3:0)-v.w*.3+(elevAt(x,y)?3:0);if(!sh.length)sc-=near;if(sc>bs){bs=sc;best=k;}}
    if(best!==null){if(T.nimble&&adjAt(m.x,m.y))m.disengaged=true;const path=truncatePath(dist,pathTo(dist,best),move);if(path.length)await walk(m,path);if(m.hp<=0||!m.inCombat)return;}}
  const inR=heroesUp().filter(h=>inReachW(m,h,w)).sort((a,b)=>threatScore(m,a,w)-threatScore(m,b,w));
  if(inR.length){const n=T.multi||1;for(let i=0;i<n;i++){const t=inR.find(h=>!h.down&&!h.dead);if(!t)break;await attack(m,t,w,{});}}}
async function fleeTurn(m,move){const dist=dijkstra(m,move);let best=null,bs=-1e9;
  for(const [k,v] of dist){const x=k%G.W,y=(k/G.W)|0;const occ=unitAt(x,y);if(occ&&occ!==m)continue;const near=Math.min(...heroesUp().map(h=>Math.max(Math.abs(h.x-x),Math.abs(h.y-y))));const sc=near*3-v.w*.2;if(sc>bs){bs=sc;best=k;}}
  if(m.tr.nimble)m.disengaged=true;
  if(best!==null){const path=pathTo(dist,best);if(path.length)await walk(m,path);if(m.hp<=0)return;}
  if(!heroesUp().some(h=>cheb(h,m)<=7&&los(h.x,h.y,m.x,m.y))){m.inCombat=false;G.mons.splice(G.mons.indexOf(m),1);C.xp+=Math.floor(m.xp/2);await say(`The ${m.name} escapes into the dark!`,800);renderStrip();return;}
  if(!m.st.turned){const t=heroesUp().find(h=>cheb(h,m)===1);if(t&&best===null)await attack(m,t,weaponOf(m),{});}}
async function bossPhase(m){fx.push({type:"wave",u:m,t:now()});await say(`The ${m.name} ROARS with fury!`,1000);
  for(const h of heroesUp().filter(h=>cheb(h,m)<=6)){const s=saveRoll(h,"wis",13,{fear:true});if(!s.ok){h.st.frightened=2;float(h,"FRIGHTENED","#ffffff");}log(`${esc(h.name)}: ${s.txt}.`,"magic");}
  const p=parseDice(m.dmg);if(p)m.dmg=`${p.n}d${p.d}${sgn(p.b+2)}`;
  let n=0;for(let i=0;i<2;i++){const spot=nearFree(m.x,m.y);if(!spot)break;const g=mkMon(monByKey(pick(["goblin","archer"]))||S.monsters[2],spot.x,spot.y);g.gid=m.gid;g.inCombat=true;g.state="combat";g.init=rnd(20)+2;G.mons.push(g);C.units.push(g);n++;}
  renderStrip();await say(`It's enraged (+2 damage)${n?` and ${n} goblins rush in to help!`:"!"}`,1100);}

// ---------- end of combat ----------
async function victory(){mode="combatEnd";busy=true;buildPanel();const xp=C.xp;
  await say(`Victory! The party earns ${xp} XP.`,1200);for(const msg of gainXpNow(xp))await say(msg,1500);
  for(const h of G.party){if(h.conc)endConc(h);const keep=h.st.poisoned;h.st={};if(keep)h.st.poisoned=keep;h.thp=0;}
  for(const h of G.party)if(h.frenzied&&!h.dead){h.frenzied=false;await addExh(h,1,"the frenzy wears off");}
  if(G.party.some(h=>h.down&&!h.dead)&&heroesUp().length)await tendTheDying();
  const fallen=G.party.filter(h=>h.dead);G.fallen=(G.fallen||[]).concat(fallen);G.party=G.party.filter(h=>!h.dead);
  for(const m of G.mons){m.st={};if(m.state==="combat")m.state="idle";}G.entangle.clear();G.spikes.clear();
  C=null;mode="explore";showCombatUI(false);fov();hud();
  if(S.rules.fatigue){G.fatigue++;await partyWeary();}
  if(G.pendingRest&&!G.over&&G.party.length){const camp=G.pendingRest;G.pendingRest=null;const lines=await applyLongRest(camp);await say(`With the attackers dealt with, the party finishes its rest.${lines.length?" "+lines.join(" "):""}`,1600,true);$("tBox").hidden=true;}
  for(const h of G.party)h.armourOff=false;await chooseSubclasses();await chooseFeats();autoSave(true);busy=false;hud();
  if(!G.party.length){G.over=true;showEnd(false,"Every hero has fallen.");return;}
  if(G.floor>=S.dungeon.floors&&!G.mons.some(m=>m.boss)){G.over=true;showEnd(true,`You defeated the ${esc(S.boss.name)}!`);return;}
  if(G.goalPending){G.goalPending=false;await goalDone(`${G.goal.target.name} is dead.`);}
  if(floorCleared()&&!G.clearedFloor){G.clearedFloor=G.floor;approve("cleared");toast("This floor is clear. It's safe to rest anywhere now.");}
  checkAwareness();}
async function defeat(){mode="combatEnd";busy=true;buildPanel();await say("The last hero falls. The lantern gutters out...",1600);G.over=true;showCombatUI(false);showEnd(false,`Your party fell on floor ${G.floor}.`);}
