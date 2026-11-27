// ================= pits, darts, doors under pressure, sneaky door-openers, thaumaturgy =================
// ---------- pits: a sprung pit trap leaves a hole in the floor ----------
BLOCKERS.pit=1;BUMP_NAME.pit="A gaping pit";
const pitAt=(x,y)=>G.objs.find(o=>o.type==="pit"&&o.x===x&&o.y===y&&!o.gone);
function openPit(x,y){if(!pitAt(x,y))G.objs.push({type:"pit",x,y,deco:true,seen:true});if(gnd(x,y)){G.ground[y][x]=0;buildTerrain();}}
D2_DRAW.pit=(f)=>{f("#000000",0,0,16,16);f("#2a2224",0,0,16,2);f("#1a1416",0,2,16,2);f("#3a3234",0,0,1,16);f("#3a3234",15,0,1,16);f("#0a0809",2,4,12,10);};
async function climbOut(dx,dy){const L=G.party[0];const ath=L;const rope=(G.bag.rope||0)>0;
  const c=await choose(`The ${L.name} is stuck at the bottom of the pit.`,[{t:"CLIMB OUT",sub:`Athletics DC 12 · ${oddsTag(ath,"athletics",12)}`},{t:"HAUL OUT WITH THE ROPE",sub:rope?"Always works, but it's exhausting (the party grows wearier)":"You don't have any rope",dis:!rope},{t:"NOT YET"}]);$("tBox").hidden=true;
  if(c===2||c<0)return;let out=false;
  if(c===0){const r=await check(ath,"athletics",12);G.steps+=3;out=r.ok;await say(r.ok?`The ${L.name} scrambles up the crumbling wall and out. (${r.txt})`:`The ${L.name} slides back down. (${r.txt}) Try again?`,1000,true);}
  else{G.steps+=10;out=true;if(S.rules.fatigue){G.fatigue++;await partyWeary();}await say(G.party.length>1?`The others drop the rope and haul the ${L.name} up. Hard, sweaty work.`:`The ${L.name} hooks the rope on a jutting rock and drags themself out, panting.`,1300,true);}
  $("tBox").hidden=true;if(!out)return;delete L.st.prone;
  let p={x:L.x+dx,y:L.y+dy};if(isWall(p.x,p.y)||blocksObj(p.x,p.y)||unitAt(p.x,p.y)||doorAt(p.x,p.y))p=nearFree(L.x,L.y);if(!p)return;faceToward(L,dx,dy);L.x=p.x;L.y=p.y;fov();hud();}
{const base=doMove;doMove=async function(dx,dy,act){const L=G&&G.party[0];if(L&&pitAt(L.x,L.y)&&mode==="explore"){await climbOut(dx,dy);return;}return base(dx,dy,act);};}
D2_ACT.pit=async o=>{const L=G.party[0];let dx=Math.sign(o.x-L.x),dy=Math.sign(o.y-L.y);if(dx&&dy)dy=0;const far={x:o.x+dx,y:o.y+dy};
  const ok=!isWall(far.x,far.y)&&!blocksObj(far.x,far.y)&&!unitAt(far.x,far.y)&&!pitAt(far.x,far.y);const h=L;
  const c=await choose("A pit yawns in the floor, too dark to see the bottom.",[{t:"JUMP ACROSS",sub:ok?`Athletics DC 10 · ${oddsTag(h,"athletics",10)} · if you fall, you fall in`:"Nowhere to land on the other side",dis:!ok},
    {t:"CLIMB DOWN AND UP THE OTHER SIDE",sub:ok?"Always works, but it's slow and tiring (the party grows wearier)":"Nowhere to climb out on the other side",dis:!ok},{t:"LEAVE IT"}]);$("tBox").hidden=true;
  if(c===0){const r=await check(h,"athletics",10);if(r.ok){hop(L);L.x=far.x;L.y=far.y;faceToward(L,dx,dy);await say(`The ${L.name} takes a run-up and leaps across! The others follow. (${r.txt})`,1100,true);}
    else{L.x=o.x;L.y=o.y;L.st.prone=true;await say(`The ${L.name} jumps... and doesn't quite make it. (${r.txt})`,1000,true);await dealDamage(L,roll(`${trapN()}d6`).total,"bludgeoning",{fall:true});}}
  else if(c===1){G.steps+=15;if(S.rules.fatigue){G.fatigue++;await partyWeary();}L.x=far.x;L.y=far.y;await say("The party climbs down into the pit, helps each other up the far side and dusts off. That took a while.",1300,true);}
  $("tBox").hidden=true;fov();hud();};
// in a fight, getting out of a pit eats your movement
{const base=stepCost;stepCost=function(u,ax,ay,bx,by){return base(u,ax,ay,bx,by)+(pitAt(ax,ay)?3:0);};}
// someone in a pit is drawn lower down, half hidden
{const base=drawHero;drawHero=function(h,camX,camY,t){base(h,camX,camY-(pitAt(h.x,h.y)&&h.dx===h.x*TS&&h.dy===h.y*TS?6:0),t);};}
{const base=drawMon;drawMon=function(m,camX,camY,t){base(m,camX,camY-(pitAt(m.x,m.y)&&m.dx===m.x*TS&&m.dy===m.y*TS?6:0),t);};}

// ---------- a dart that misses sticks where it lands ----------
function dropDart(t,u){let x=u.x+1,y=u.y;if(isWall(x,y)||blocksObj(x,y)){x=u.x;y=u.y;}G.objs.push({type:"dart",x,y,deco:true,poison:Math.random()<.4});}
D2_ACT.dart=async o=>{o.gone=true;if(o.poison){addItem("poisonvial");toast("You pull the dart out of the floor. Its tip is still wet with poison: you scrape it into a vial (+1 Poison Vial).");}else toast("You pull a spent dart out of the floor. The poison has dried. Nasty.");hud();};
D2_DRAW.dart=(f)=>{f("#5a4a3a",5,9,6,1);f("#a8b0bc",4,10,2,1);f("#c84a4a",10,8,2,1);f("#c84a4a",10,10,2,1);};
BUMP_NAME.dart="A dart";

// ---------- doors under pressure ----------
const BREAKERS={orc:1,goblinboss:1,ogre:1};
const doorHumanoid=m=>FIREBUGS[m.key]||m.rival!==undefined&&m.cls||BREAKERS[m.key];
function alertParty(t){G.alertUntil=G.steps+25;if(t){toast(t);log(t,"hurt");}}
async function doorPressure(){const L=G.party[0];for(const d of G.objs){if(d.type!=="door"||d.gone||d.open||!(d.wedged||d.barred)||cheb(d,L)>14)continue;
    const near=G.mons.filter(m=>m.hp>0&&!m.peace&&!m.inCombat&&(m.state==="hunt"||m.state==="investigate")&&cheb(m,d)<=2&&cheb(m,L)>cheb(d,L));if(!near.length)continue;
    if(G.steps-(d.noiseAt||-99)>=8&&Math.random()<.35){d.noiseAt=G.steps;toast(`Something on the other side of the ${d.barred?"barricaded":"wedged"} door to the ${dirTo(L,d)} is scraping and shoving at it...`);log(`Something is trying to get through the door to the ${dirTo(L,d)}.`,"hurt");}
    const brute=near.find(m=>doorHumanoid(m));if(!brute)continue;
    if(brute.torch&&!d.iron&&!d.burn&&Math.random()<.12){brute.torch=false;setAlight(d);alertParty(`Smoke curls under the door to the ${dirTo(L,d)}: someone on the other side has set it on fire!`);return;}
    if(Math.random()<(BREAKERS[brute.key]?.12:.04)&&!d.iron){d.open=true;d.wedged=false;d.barred=false;d.locked=false;d.broken=true;makeNoise(d.x,d.y,14);cam.shake=now();computeLight();fov();
      alertParty(`CRASH! The door to the ${dirTo(L,d)} bursts open, splinters flying! Something is coming through.`);return;}}}
// a closed door opened by a monster: they may sneak it open, or you hear it
async function sneakyDoors(){const L=G.party[0];const pp=heroesUp().reduce((a,h)=>Math.max(a,passive(h,"perception")-2*exhOf(h)),0);
  for(const m of G.mons){if(m.hp<=0||m.inCombat)continue;const d=doorAt(m.x,m.y);if(!d||d.open)continue;d.open=true;computeLight();if(cheb(d,L)>12)continue;
    const st=rnd(20)+monStealth(m)+(m.state==="hunt"?-2:0);if(st>=pp)continue;
    alertParty(seen(d.x,d.y)?`The door to the ${dirTo(L,d)} swings open!`:`You hear a door creak open somewhere to the ${dirTo(L,d)}.`);fov();}}
// heard them coming: nobody in the party is caught by surprise
{const base=startCombat;startCombat=async function(o){if(G&&G.alertUntil>=G.steps&&o&&(o.by||G.mons.some(m=>m.ambusher))){o=Object.assign({},o);delete o.by;for(const m of G.mons){m.ambusher=false;if(m.lurk)m.spotted=true;}log("You heard them coming: nobody is caught by surprise.","lv");}return base(o);};}
{const base=d2Step;d2Step=async function(){await base();if(mode!=="explore"||!G||G.over)return;await sneakyDoors();await doorPressure();};}

// ---------- tieflings: thaumaturgy lights or snuffs a torch they can see ----------
function thaumTargets(h){const out=[];for(const t of G.torches){const fx0=t.lx!==undefined?t.lx:t.x,fy0=t.ly!==undefined?t.ly:t.y;if(cheb(h,{x:fx0,y:fy0})>12||!G.explored[fy0][fx0]||!los(h.x,h.y,fx0,fy0))continue;out.push({kind:"wall",o:t,x:fx0,y:fy0,lit:!t.out});}
  for(const l of G.dropLights)if(cheb(h,l)<=12&&los(h.x,h.y,l.x,l.y))out.push({kind:"ground",o:l,x:l.x,y:l.y,lit:true});
  for(const l of G.deadLights||[])if(cheb(h,l)<=12&&los(h.x,h.y,l.x,l.y))out.push({kind:"dead",o:l,x:l.x,y:l.y,lit:false});
  return out.sort((a,b)=>cheb(a,h)-cheb(b,h)).slice(0,6);}
async function thaumaturgy(h,inFight){const ts=thaumTargets(h);if(!ts.length){toast("No torches in sight.");return false;}
  const c=await choose(`${h.nick||"The "+h.name}'s eyes flash with hellfire. Which flame?`,ts.map(t=>({t:`${t.lit?"SNUFF":"LIGHT"} THE TORCH ${t.x===h.x&&t.y===h.y?"HERE":"TO THE "+dirTo(h,t).toUpperCase()}`,sub:`${cheb(h,t)} squares away${t.kind==="ground"||t.kind==="dead"?" · on the floor":" · on the wall"}`})).concat([{t:"NEVER MIND"}]));
  if(!inFight)$("tBox").hidden=true;if(c<0||c>=ts.length)return false;const t=ts[c];
  if(t.kind==="wall")t.o.out=t.lit;else if(t.kind==="ground"){G.dropLights.splice(G.dropLights.indexOf(t.o),1);(G.deadLights=G.deadLights||[]).push({x:t.o.x,y:t.o.y});}
  else{G.deadLights.splice(G.deadLights.indexOf(t.o),1);G.dropLights.push({x:t.o.x,y:t.o.y});}
  fx.push({type:"shot",from:{x:h.x,y:h.y},to:{x:t.x,y:t.y},t:now(),col:"#ff5a3a"});computeLight();fov();hud();
  const msg=t.lit?"With a flick of the wrist, the flame dies.":"The torch roars back to life.";if(inFight)await say(msg,700);else toast(msg);return true;}
{const base=classActions;classActions=h=>{const A=base(h);if(h.race==="tiefling"&&!h.dead&&!h.down&&!h.wild&&mode==="explore")A.push({t:"THAUMATURGY",sub:"Cantrip: light or snuff a torch you can see",f:()=>thaumaturgy(h,false)});return A;};}
{const base=gunButtons;gunButtons=u=>{const B=base(u);if(C&&u.race==="tiefling"&&!u.wild&&thaumTargets(u).length)B.push({t:"THAUMATURGY",sub:"Action · light or snuff a torch you can see",cost:"action",dis:!hasAction()||C.attacksLeft>0,f:async()=>{busy=true;if(await thaumaturgy(u,true))C.actions--;afterAction();}});return B;};}
