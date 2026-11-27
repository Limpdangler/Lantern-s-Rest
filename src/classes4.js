// ================= more things only certain classes can do =================
const wet=(x,y)=>gnd(x,y)===GROUND.water||gnd(x,y)===GROUND.deep;
const nearWater=u=>[[0,0]].concat(DIRS8).some(([dx,dy])=>wet(u.x+dx,u.y+dy));
// ---------- electricity and puddles: lightning arcs through water to everyone standing in or beside it ----------
function puddleFrom(x,y){const start=[[0,0]].concat(DIRS8).map(([dx,dy])=>[x+dx,y+dy]).filter(([a,b])=>inB(a,b)&&wet(a,b));const sn=new Set();const q=[];
  for(const [a,b] of start){const k=b*G.W+a;if(!sn.has(k)){sn.add(k);q.push(k);}}
  while(q.length){const k=q.pop();const cx=k%G.W,cy=(k/G.W)|0;for(const [dx,dy] of DIRS8){const nx=cx+dx,ny=cy+dy,nk=ny*G.W+nx;if(inB(nx,ny)&&!sn.has(nk)&&wet(nx,ny)){sn.add(nk);q.push(nk);}}}return sn;}
{const base=dealDamage;dealDamage=async function(u,amt,type,o){o=o||{};if(type!=="lightning"||o.chain||!G||!nearWater(u))return base(u,amt,type,o);
  const pool=puddleFrom(u.x,u.y);const touching=v=>[[0,0]].concat(DIRS8).some(([dx,dy])=>pool.has((v.y+dy)*G.W+v.x+dx));
  const others=G.party.concat(G.mons).filter(v=>v!==u&&!v.dead&&!(v.side==="m"&&v.hp<=0)&&!(v.side==="h"&&v.down)&&touching(v)&&(v.side==="h"||!C||v.inCombat||cheb(v,u)<=8));
  for(const k of pool){const x=k%G.W,y=(k/G.W)|0;if(Math.random()<.35)fx.push({type:"shot",from:{x,y},to:{x:x+ri(-1,1),y:y+ri(-1,1)},t:now(),col:"#c8f0ff"});}
  float(u,"ZAP!","#c8f0ff");log(`The lightning crackles through the water${others.length?`, shocking ${others.map(v=>esc(v.name)).join(", ")}`:""}!`,"magic");
  const r=await base(u,Math.ceil(amt*1.5),type,o);for(const v of others)await base(v,Math.max(1,Math.floor(amt/2)),"lightning",Object.assign({},o,{chain:true}));return r;};}
// the wizard's Shocking Grasp: the party's electric spell
{const base=gunButtons;gunButtons=u=>{const B=base(u);if(!C||u.id!=="wizard"||u.wild)return B;const ready=hasAction()&&C.attacksLeft===0;
  B.push({t:"SHOCKING GRASP",sub:`Action · cantrip · touch, 1d8 lightning${G.level>=5?" (2d8)":""} · arcs through any puddle the target stands in or next to`,cost:"action",dis:!ready,
    f:()=>targetMode({kind:"enemy",range:1,label:"Shocking Grasp: tap an enemy next to you.",onPick:async(x,y,t)=>{C.actions--;C.attacksLeft=0;busy=true;
      await attack(u,t,{name:"Shocking Grasp",abil:"int",dice:G.level>=5?"2d8":"1d8",type:"lightning",spell:true,cantrip:true,range:1,melee:true},{});afterAction();}})});return B;};}

// ---------- cleric: blessing water into holy water ----------
ITEMS.holywater={name:"Holy Water",kind:"use",price:25,floor:9,w:0,desc:"Blessed by a cleric. Throw it at an undead creature (range 5) for 2d6 radiant damage. Ordinary creatures just get wet."};
{const base=classActions;classActions=h=>{const A=base(h);if(h.id!=="cleric"||h.dead||h.down||h.wild||mode!=="explore")return A;
  const ok=nearWater(G.party[0]);const used=(G.holyMade||0)>=2;
  A.push({t:"BLESS WATER",sub:!ok?"Stand in or next to a puddle":(G.bag.bottle||0)<1?"Needs an empty bottle to hold it":used?"You've blessed all the water you can until you rest":"Fill a bottle from the puddle and pray over it: Holy Water",dis:!ok||(G.bag.bottle||0)<1||used,
    f:async()=>{takeItem("bottle");addItem("holywater");G.holyMade=(G.holyMade||0)+1;G.steps+=6;toast(`The ${h.name} fills a bottle and murmurs a prayer over it. The water glows faintly: Holy Water.`);hud();}});return A;};}
{const base=applyLongRest;applyLongRest=async function(camp){const r=await base(camp);G.holyMade=0;return r;};}
{const base=itemButtons;itemButtons=u=>{const B=base(u);if(!(G.bag.holywater>0)||u.wild)return B;const fh=u.sub==="thief";const ok=fh?C.bonus:hasAction()&&C.attacksLeft===0;
  B.push({t:"THROW HOLY WATER",sub:`${fh?"Bonus action":"Action"} · range 5 · 2d6 radiant to undead · ${G.bag.holywater} left`,dis:!ok,f:()=>targetMode({kind:"enemy",range:5,label:"Throw the holy water: tap an enemy.",onPick:async(x,y,t)=>{
    if(fh)C.bonus=false;else C.actions--;busy=true;noBottle=true;takeItem("holywater");noBottle=false;fx.push({type:"shot",from:{x:u.x,y:u.y},to:{x:t.x,y:t.y},t:now(),col:"#f0f0ff"});await wait(220);
    if(t.tr&&(t.tr.undead||t.tr.fiend)){float(t,"SIZZLE!","#fff6b0");await say(`The holy water splashes the ${t.name} and burns like acid!`,800);await dealDamage(t,roll("2d6").total,"radiant",{src:u});}
    else await say(`The holy water splashes over the ${t.name}. It's just wet now.`,800);afterAction();}})});return B;};}

// ---------- wizard: Minor Illusion makes a noise somewhere else; Comprehend Languages ----------
{const base=classActions;classActions=h=>{const A=base(h);if(h.id!=="wizard"||h.dead||h.down||h.wild||mode!=="explore")return A;
  A.push({t:"MINOR ILLUSION",sub:"Cantrip: a noise somewhere else lures monsters away",f:()=>minorIllusion(h)});return A;};}
async function minorIllusion(h){const L=G.party[0];const opts=[];
  for(const [nm,dx,dy] of [["NORTH",0,-1],["SOUTH",0,1],["WEST",-1,0],["EAST",1,0]]){let x=L.x,y=L.y,n=0;while(n<8&&!isWall(x+dx,y+dy)){x+=dx;y+=dy;n++;}if(n>=2)opts.push({t:`THE ${nm}`,sub:`${n} squares away`,x,y});}
  if(!opts.length){toast("No room to throw your voice here.");return;}
  const c=await choose(`Where should the ${h.name}'s illusion sound from? (Clattering footsteps, a crash, a distant voice...)`,opts.concat([{t:"NEVER MIND"}]));$("tBox").hidden=true;const p=opts[c];if(!p)return;
  makeNoise(p.x,p.y,12);for(const m of G.mons)if(m.hp>0&&!m.peace&&!m.inCombat&&m.state==="hunt"&&cheb(m,p)<=14){m.state="investigate";m.inv={x:p.x,y:p.y};}
  G.steps+=1;toast(`A clatter of footsteps echoes from the ${opts[c].t.slice(4).toLowerCase()}. Anything listening will go and look.`);}
{const base=speakerFor;speakerFor=function(m){const s=base(m);if(s||!MLANG[m.key])return s;return heroesUp().find(h=>h.id==="wizard"&&!h.wild)||null;};}

// ---------- druid: Produce Flame lights anything flammable they can see ----------
function flameTargets(h){const out=[];for(const t of thaumTargets(h))if(!t.lit)out.push({k:"torch",t,x:t.x,y:t.y,label:`LIGHT THE TORCH TO THE ${dirTo(h,t).toUpperCase()}`});
  const seenOil=new Set();for(let y=h.y-8;y<=h.y+8;y++)for(let x=h.x-8;x<=h.x+8;x++){if(!inB(x,y)||gnd(x,y)!==GROUND.oil||fireAt(x,y)||!seen(x,y)||!los(h.x,h.y,x,y))continue;const key=[...puddleOil(x,y)][0];if(seenOil.has(key))continue;seenOil.add(key);out.push({k:"oil",x,y,label:`IGNITE THE OIL TO THE ${dirTo(h,{x,y}).toUpperCase()}`});}
  for(const o of G.objs)if(isWooden(o)&&!o.burn&&o.type!=="door"&&cheb(o,h)<=6&&cheb(o,h)>=1&&seen(o.x,o.y)&&los(h.x,h.y,o.x,o.y))out.push({k:"wood",o,x:o.x,y:o.y,label:`SET FIRE TO THE ${(BUMP_NAME[o.type]||"wood").replace(/^An? /,"").toUpperCase()}`});
  return out.sort((a,b)=>cheb(a,h)-cheb(b,h)).slice(0,6);}
function puddleOil(x,y){const sn=new Set([y*G.W+x]);const q=[y*G.W+x];while(q.length){const k=q.pop();const cx=k%G.W,cy=(k/G.W)|0;for(const [dx,dy] of DIRS8){const nx=cx+dx,ny=cy+dy,nk=ny*G.W+nx;if(inB(nx,ny)&&!sn.has(nk)&&gnd(nx,ny)===GROUND.oil){sn.add(nk);q.push(nk);}}}return [Math.min(...sn)];}
async function produceFlame(h,inFight){const ts=flameTargets(h);if(!ts.length){toast("Nothing in sight that would burn.");return false;}
  const c=await choose(`A flame flickers to life in the ${h.name}'s palm. What should it light?`,ts.map(t=>({t:t.label,sub:`${cheb(h,t)} squares away`})).concat([{t:"NEVER MIND"}]));if(!inFight)$("tBox").hidden=true;const t=ts[c];if(!t)return false;
  fx.push({type:"shot",from:{x:h.x,y:h.y},to:{x:t.x,y:t.y},t:now(),col:"#ffa040"});await wait(220);
  if(t.k==="torch")t.t.o.out=false;else if(t.k==="oil"){igniteAt(t.x,t.y);if(C)await scorch();}else setAlight(t.o);computeLight();fov();hud();return true;}
{const base=classActions;classActions=h=>{const A=base(h);if(h.id!=="druid"||h.dead||h.down||h.wild||mode!=="explore")return A;A.push({t:"PRODUCE FLAME",sub:"Cantrip: light a torch, oil or wood you can see",f:()=>produceFlame(h,false)});return A;};}
{const base=gunButtons;gunButtons=u=>{const B=base(u);if(C&&u.id==="druid"&&!u.wild&&flameTargets(u).length)B.push({t:"PRODUCE FLAME",sub:"Action · light a torch, oil or wood you can see",cost:"action",dis:!hasAction()||C.attacksLeft>0,f:async()=>{busy=true;if(await produceFlame(u,true))C.actions--;afterAction();}});return B;};}

// ---------- monk: runs along the wall across pits, never gets stuck in one ----------
{const base=D2_ACT.pit;D2_ACT.pit=async o=>{const monk=heroesUp().find(h=>h.id==="monk"&&!h.wild);if(!monk)return base(o);const L=G.party[0];let dx=Math.sign(o.x-L.x),dy=Math.sign(o.y-L.y);if(dx&&dy)dy=0;const far={x:o.x+dx,y:o.y+dy};
  if(isWall(far.x,far.y)||blocksObj(far.x,far.y)||unitAt(far.x,far.y)){return base(o);}
  const c=await choose("A pit yawns in the floor.",[{t:"THE MONK RUNS THE WALL",sub:"Sprints along the wall, ties off a rope on the far side and helps everyone across · no roll, no fuss"},{t:"OTHER WAYS ACROSS"},{t:"LEAVE IT"}]);$("tBox").hidden=true;
  if(c===1)return base(o);if(c!==0)return;hop(L);L.x=far.x;L.y=far.y;G.steps+=4;await say(`The ${monk.name} runs three steps along the wall, flips over the pit and has a rope across before anyone blinks.`,1300,true);$("tBox").hidden=true;fov();hud();};}
{const base=climbOut;climbOut=async function(dx,dy){const L=G.party[0];if(L.id!=="monk")return base(dx,dy);delete L.st.prone;let p={x:L.x+dx,y:L.y+dy};if(isWall(p.x,p.y)||blocksObj(p.x,p.y)||unitAt(p.x,p.y))p=nearFree(L.x,L.y);if(!p)return;
  L.x=p.x;L.y=p.y;await say(`The ${L.name} kicks off the walls and springs out of the pit.`,900,true);$("tBox").hidden=true;fov();hud();};}

// ---------- paladin: lies ring false ----------
function liarSense(){return heroesUp().find(h=>h.id==="paladin"&&!h.wild)||null;}
{const base=rivalJoin;rivalJoin=async function(co){const pal=liarSense();if(pal&&co.treach===undefined)co.treach=Math.random()<(co.stance==="teamup"&&!co.returning?.25:.15);
  if(pal&&co.treach&&!co.warned){co.warned=true;const c=await choose(`The ${pal.name} feels it like a cold hand on the neck: ${co.leader} is lying. Whatever they're promising, they don't mean it.`,[{t:"TEAM UP ANYWAY",sub:"Keep a hand on your sword"},{t:"CALL IT OFF"}]);$("tBox").hidden=true;if(c===1){toast(`You refuse the deal. ${cap(co.name)} shrug and move on.`);return;}}
  return base(co);};}
// bandits faking an injury don't fool a paladin
{const ev=EVENTS.find(e=>String(e.run).includes("wounded traveller"));if(ev){const run=ev.run;ev.run=async L=>{const pal=liarSense();if(pal){await say(`A figure slumps against the wall, groaning for help. The ${pal.name} stops the party: "They're lying. That's an ambush." You give them a wide berth, and hear muttered cursing behind you.`,1800,true);return;}return run(L);};}}

// ---------- ranger: snares (they use up firewood for stakes and spring-poles) ----------
TRAPS.snare={name:"snare",w:0};
{const base=classActions;classActions=h=>{const A=base(h);if(h.id!=="ranger"||h.dead||h.down||h.wild||mode!=="explore")return A;const L=G.party[0];
  A.push({t:"SET A SNARE",sub:(G.bag.firewood||0)<1?"Needs 1 firewood for the stakes and spring-pole":"Uses 1 firewood · traps the next creature to step there in front of you",dis:(G.bag.firewood||0)<1,f:()=>setSnare(h)});return A;};}
function snareSpot(){const L=G.party[0];const fd=L.face==="b"?[0,-1]:L.face==="f"?[0,1]:[L.flip?-1:1,0];const x=L.x+fd[0],y=L.y+fd[1];
  if(isWall(x,y)||blocksObj(x,y)||unitAt(x,y)||doorAt(x,y)||trapAt(x,y)||gnd(x,y)!==0||pitAt(x,y))return null;return {x,y};}
async function setSnare(h){const p=snareSpot();if(!p){toast("Face an open square of floor to set the snare there.");return;}takeItem("firewood");G.steps+=6;
  G.traps.push({x:p.x,y:p.y,type:"snare",dc:12+Math.floor(G.level/2),found:true,done:false,ours:true});toast(`The ${h.name} whittles stakes from the firewood and sets a hidden snare.`);hud();}
{const base=triggerNewTrap;triggerNewTrap=async function(t,u){if(t.type!=="snare")return base(t,u);
  if(u.side==="h"){t.done=false;return false;}
  t.done=true;u.st.restrained={dc:t.dc,by:"snare"};float(u,"SNARED!","#ffffff");makeNoise(t.x,t.y,4);
  if(C)await say(`The ${u.name} steps in the snare and is yanked off its feet! (Escape DC ${t.dc})`,900);else alertParty(`Somewhere ${dirTo(G.party[0],t)}, a snare snaps shut and something yelps!`);return true;};}
// monsters wandering about outside a fight can blunder into snares too
{const base=d2Step;d2Step=async function(){await base();if(mode!=="explore"||!G)return;for(const m of G.mons){if(m.hp<=0||m.inCombat||m.peace)continue;const t=trapAt(m.x,m.y);if(t&&t.type==="snare"&&!t.done)await triggerNewTrap(t,m);}};}
