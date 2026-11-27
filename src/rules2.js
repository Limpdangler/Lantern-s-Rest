// ================= more 5e rules =================
// ---------- conditions: blinded, invisible, paralysed, grappled, outlined (Faerie Fire), Shield of Faith ----------
effect("conditions","Blinded, invisible, paralysed, outlined and grappled creatures",{attackMods:c=>{const a=c.a,t=c.t;
  if(a.st.blinded)c.dis.push("blinded");if(t.st.blinded)c.adv.push("target blinded");
  if(t.st.invisible&&!t.st.outlined)c.dis.push("target invisible");if(a.st.invisible&&!a.st.outlined)c.adv.push("you're invisible");
  if(t.st.paralysed)c.adv.push("target paralysed");if(t.st.outlined)c.adv.push("target outlined");if(t.st.grappled&&!c.w.melee)c.notes.push("target grappled");}});
effect("paralysedCrit","Melee hits on a paralysed creature are critical hits",{critCheck:c=>{if(c.hit&&c.t.st.paralysed&&cheb(c.a,c.t)<=1)c.crit=true;}});
effect("invisibleBreaks","Attacking ends Invisibility",{afterAttack:async c=>{if(c.a.st.invisible){delete c.a.st.invisible;if(c.a.conc&&c.a.conc.type==="invis")endConc(c.a);for(const h of G.party)if(h.conc&&h.conc.type==="invis"&&h.conc.target===c.a)endConc(h);}}});
// ---------- long range & arrows ----------
const isBow=w=>!!w&&!w.melee&&!w.spell&&!w.thrown&&/bow/i.test(w.name);
const longRange=w=>w&&w.gun?w.range*3:!w||w.melee||w.spell?(w?w.range:1):w.thrown?w.range*3:isBow(w)?Math.min(40,w.range*3):w.range;
effect("longRange","Ranged weapons can shoot past their normal range at disadvantage",{attackMods:c=>{if(!c.w.melee&&!c.w.spell&&cheb(c.a,c.t)>c.w.range)c.dis.push("long range");}});
function needsArrow(a,w){return a.side==="h"&&isBow(w);}
effect("arrows","Bows use arrows; half can be recovered after a fight",{afterAttack:async c=>{if(needsArrow(c.a,c.w)&&!c.noArrow){takeItem("arrows");if(C)C.arrowsUsed=(C.arrowsUsed||0)+1;}}});
async function recoverArrows(){if(!C||!C.arrowsUsed)return;const n=Math.floor(C.arrowsUsed/2);if(n){addItem("arrows",n);log(`You recover ${n} arrow${n>1?"s":""} from the battlefield.`,"miss");}}
// ---------- Ready action ----------
async function readiedStrike(m){for(const h of heroesUp()){if(!h.readied||!canReact(h)||m.hp<=0)continue;const w=weaponOf(h,h.readied);if(!inReachW(h,m,w))continue;
    h.readied=null;h.reaction=false;await say(`The ${h.name}'s readied attack fires as the ${m.name} comes into reach!`,850);await attack(h,m,w,{});if(m.hp<=0)return true;}return false;}
// ---------- legendary actions (bosses act between your turns) ----------
async function legendaryAction(){const b=G.mons.find(m=>m.boss&&m.inCombat&&m.hp>0&&!m.st.paralysed&&!m.st.asleep);if(!b||(b.legend||0)<=0)return;if(Math.random()<.35)return;b.legend--;
  const near=heroesUp().filter(h=>cheb(h,b)<=1);C.cur=b;renderStrip();
  if(near.length){const t=near.sort((a,c)=>a.hp-c.hp)[0];await say(`Legendary action! The ${b.name} lashes out between turns.`,800);await attack(b,t,weaponOf(b),{});}
  else{const t=heroesUp().sort((a,c)=>cheb(a,b)-cheb(c,b))[0];if(t){await say(`Legendary action! The ${b.name} stomps forward.`,700);const dist=dijkstra(b,2,{});let best=null,bd=99;for(const [k] of dist){const x=k%G.W,y=(k/G.W)|0;if(unitAt(x,y))continue;const d=cheb({x,y},t);if(d<bd){bd=d;best=k;}}if(best!==null)await walk(b,pathTo(dist,best),{});}}}
// ---------- two-weapon fighting, jump, grapple, ready, flash powder, ammo checks ----------
const TWF={rogue:{name:"Off-hand Dagger",dice:"1d4"},ranger:{name:"Off-hand Shortsword",dice:"1d6"}};
effect("twfTrack","Remember a melee weapon attack this turn (for the off-hand attack)",{afterAttack:async c=>{if(C&&C.cur===c.a&&c.w.melee&&!c.w.spell)C.meleeAttacked=true;}});
function rules2Buttons(u){const B=[];const act=hasAction()&&C.attacksLeft===0;if(u.wild)return B;
  const tw=TWF[u.id];if(tw)B.push({t:"OFF-HAND ATTACK",sub:`Bonus action after a melee attack · ${tw.dice} (no ability bonus to damage)`,dis:!C.bonus||!C.meleeAttacked,f:()=>targetMode({kind:"enemy",range:1,label:"Off-hand attack: tap an adjacent enemy.",onPick:async(x,y,t)=>{C.bonus=false;busy=true;
      await attack(u,t,{name:tw.name,abil:"dex",dice:tw.dice,type:"piercing",range:1,melee:true,finesse:true,offhand:true},{});afterAction();}})});
  B.push({t:"READY AN ATTACK",sub:"Action · strike the first enemy that comes into reach before your next turn (uses your reaction)",dis:!act,f:async()=>{busy=true;C.actions--;u.readied=C.weapon||"main";await say(`The ${u.name} readies their ${weaponOf(u,u.readied).name}, waiting...`,800);afterAction();}});
  const jd=Math.max(1,Math.floor(score(u,"str")/5));B.push({t:"JUMP",sub:`Uses movement · leap up to ${jd} squares in a straight line, over pits, puddles and fire`,dis:C.moveLeft<2,f:()=>targetMode({kind:"tile",range:Math.min(jd,C.moveLeft),label:`Jump: tap a free square in a straight line, up to ${Math.min(jd,C.moveLeft)} away.`,onPick:async(x,y)=>{
      const dx=x-u.x,dy=y-u.y;if(!(dx===0||dy===0||Math.abs(dx)===Math.abs(dy))||isWall(x,y)||unitAt(x,y)||blocksObj(x,y)){prompt("You can only jump in a straight line to a free square.");return;}
      for(let i=1;i<cheb(u,{x,y});i++)if(isWall(u.x+Math.sign(dx)*i,u.y+Math.sign(dy)*i)){prompt("There's a wall in the way.");return;}
      busy=true;C.moveLeft-=cheb(u,{x,y});hop(u,cheb(u,{x,y}));await say(`The ${u.name} takes a running leap!`,600);await walk(u,[y*G.W+x],{});refreshReach();afterAction();}})});
  B.push({t:"GRAPPLE",sub:"Action · Athletics contest: the enemy can't move until it breaks free",dis:!act,f:()=>targetMode({kind:"enemy",range:1,label:"Grapple which enemy?",onPick:async(x,y,t)=>{if(t.tr&&t.tr.large){prompt("It's far too big to grapple.");return;}
      busy=true;C.actions--;const a=await check(u,"athletics",0,{quiet:true});const d=rnd(20)+Math.max(skillBonus(t,"athletics"),skillBonus(t,"acrobatics"));
      if(a.total>=d){t.st.grappled={by:u};float(t,"GRAPPLED","#ffffff");await say(`The ${u.name} grabs the ${t.name} and holds on! (${a.total} vs ${d})`,900);}else await say(`The ${t.name} slips out of reach. (${a.total} vs ${d})`,800);afterAction();}})});
  if((G.bag.flashpowder||0)>0)B.push({t:"THROW FLASH POWDER",sub:"Action · range 4 · CON save DC 12 or blinded until its next turn ends",dis:!act,f:()=>targetMode({kind:"enemy",range:4,label:"Throw flash powder at which enemy?",onPick:async(x,y,t)=>{busy=true;C.actions--;takeItem("flashpowder");
      fx.push({type:"boom",x:t.x,y:t.y,t:now()});const s=saveRoll(t,"con",12);if(!s.ok){t.st.blinded=C.round+1;float(t,"BLINDED","#ffffff");}await say(`A blinding flash! (${s.txt})`,800);afterAction();}})});
  return B;}
// ---------- new spells ----------
Object.assign(SPELLS,{
  shieldoffaith:{name:"Shield of Faith",lvl:1,cost:"bonus",tgt:"ally",range:12,conc:true,desc:"Bonus action, concentration: an ally gets +2 AC."},
  faeriefire:{name:"Faerie Fire",lvl:1,cost:"action",tgt:"area",range:12,radius:1,conc:true,desc:"Concentration. 3×3 area, DEX save: failures glow, so attacks against them have advantage and they can't hide or turn invisible."},
  holdperson:{name:"Hold Person",lvl:2,cost:"action",tgt:"enemy",range:12,conc:true,desc:"Concentration. A humanoid makes a WIS save or is paralysed (it repeats the save each turn). Melee hits on it are critical."},
  invisibility:{name:"Invisibility",lvl:2,cost:"action",tgt:"ally",range:1,conc:true,desc:"Concentration. A touched ally turns invisible until they attack."},
  mistystep:{name:"Misty Step",lvl:2,cost:"bonus",tgt:"tile",range:6,desc:"Bonus action: teleport to a free square you can see within 6. No opportunity attacks."}});
CINFO.cleric.spells.push("shieldoffaith","holdperson");CINFO.wizard.spells.push("holdperson","invisibility","mistystep");CINFO.druid.spells.push("faeriefire");
const HUMANOID={goblin:1,archer:1,shaman:1,goblinboss:1,kobold:1,orc:1};
Object.assign(SPELL_RUN,{
  shieldoffaith:u=>targetMode({kind:"ally",range:12,label:"Shield of Faith: tap an ally.",onPick:async(x,y,t)=>{C.bonus=false;useSlot(u,1);startConc(u,{type:"sof",name:"Shield of Faith",target:t});t.st.sof=true;fx.push({type:"ring",u:t,col:"#fff0a0",t:now()});await say(`A shimmering field surrounds the ${t.name}: +2 AC.`,800);hud();}}),
  faeriefire:u=>targetMode({kind:"tile",range:12,area:1,label:"Faerie Fire: tap the centre of a 3×3 area.",preview:(x,y)=>areaPreview("Faerie Fire",x,y,1,true),onPick:async(x,y)=>{C.actions--;useSlot(u,1);const list=unitsIn(x,y,1,true).filter(v=>v.side==="m");const lit=[];
      for(const m of list){const s=saveRoll(m,"dex",spellDC(u));if(!s.ok){m.st.outlined=true;delete m.st.invisible;delete m.st.hidden;lit.push(m);float(m,"OUTLINED","#d0a0ff");}}
      startConc(u,{type:"faerie",name:"Faerie Fire",targets:lit});await say(`Violet light rims ${lit.length} enem${lit.length===1?"y":"ies"}: attacks against them have advantage.`,1000);}}),
  holdperson:u=>targetMode({kind:"enemy",range:12,label:"Hold Person: tap a humanoid enemy.",onPick:async(x,y,t)=>{if(!HUMANOID[t.key]){prompt(`Hold Person only works on humanoids. The ${t.name} isn't one.`);return;}
      C.actions--;useSlot(u,2);const s=saveRoll(t,"wis",spellDC(u));if(!s.ok){t.st.paralysed={dc:spellDC(u),by:u};startConc(u,{type:"hold",name:"Hold Person",target:t});float(t,"PARALYSED","#d0a0ff");await say(`The ${t.name} freezes rigid! (${s.txt}) Melee hits on it are critical.`,1000);}
      else await say(`The ${t.name} shrugs it off. (${s.txt})`,800);}}),
  invisibility:u=>targetMode({kind:"ally",range:1,label:"Invisibility: tap yourself or an adjacent ally.",onPick:async(x,y,t)=>{C.actions--;useSlot(u,2);t.st.invisible=true;startConc(u,{type:"invis",name:"Invisibility",target:t});float(t,"INVISIBLE","#c0e0ff");await say(`The ${t.name} fades from sight.`,800);hud();}}),
  mistystep:u=>targetMode({kind:"tile",range:6,label:"Misty Step: tap a free square you can see.",onPick:async(x,y)=>{if(isWall(x,y)||unitAt(x,y)||blocksObj(x,y)||!seen(x,y)){prompt("Pick a free square you can see.");return;}
      C.bonus=false;useSlot(u,2);fx.push({type:"ring",u,col:"#c0e0ff",t:now()});u.x=x;u.y=y;u.dx=x*TS;u.dy=y*TS;await say("Misty Step! A blink of silver mist.",700);refreshReach();}})});
function endConcExtra(u,c){if(!c)return;if(c.type==="sof"&&c.target)delete c.target.st.sof;if(c.type==="hold"&&c.target)delete c.target.st.paralysed;if(c.type==="invis"&&c.target)delete c.target.st.invisible;if(c.type==="faerie")for(const m of c.targets||[])delete m.st.outlined;}
// ---------- start-of-turn conditions for monsters (paralysed, grappled) ----------
async function conditionTurn(u){// returns true if the creature loses its turn
  if(u.st.paralysed){const p=u.st.paralysed;const s=saveRoll(u,"wis",p.dc);if(s.ok){delete u.st.paralysed;if(p.by&&p.by.conc&&p.by.conc.type==="hold")p.by.conc=null;float(u,"FREE","#ffffff");await say(`The ${u.name} breaks the hold! (${s.txt})`,800);return true;}
    float(u,"PARALYSED","#d0a0ff");await say(`The ${u.name} strains against the spell but can't move. (${s.txt})`,800);return true;}
  if(u.st.grappled){const g=u.st.grappled.by;if(!g||g.down||g.dead||cheb(g,u)>1){delete u.st.grappled;return false;}
    if(Math.random()<.45){const a=await check(u,Math.random()<.5?"athletics":"acrobatics",0,{quiet:true});const d=rnd(20)+skillBonus(g,"athletics");
      if(a.total>=d){delete u.st.grappled;await say(`The ${u.name} wrenches free of the ${g.name}'s grip!`,800);}else await say(`The ${u.name} struggles against the ${g.name}'s grip.`,700);return true;}}
  return false;}

// ================= exploration & environment =================
GROUND.deep=6;
Object.assign(TRAPS,{gas:{name:"poison gas vent",w:15},ceiling:{name:"collapsing ceiling",w:10}});
const inDeep=u=>gnd(u.x,u.y)===GROUND.deep;
effect("swimming","Fighting while swimming in deep water: melee at disadvantage",{attackMods:c=>{if(c.w.melee&&inDeep(c.a)&&!(c.a.tr&&c.a.tr.swim))c.dis.push("swimming");}});
const tooHeavyToSwim=u=>u.side==="h"&&u.info.armour==="heavy"&&!u.armourOff&&!u.wild;
// ---------- smoke from fires blocks sight ----------
function addSmoke(x,y,n){G.smoke=G.smoke||new Map();for(const [dx,dy] of [[0,0]].concat(DIRS8)){const k=(y+dy)*G.W+(x+dx);if(inB(x+dx,y+dy)&&!isWall(x+dx,y+dy)&&Math.random()<.7)G.smoke.set(k,Math.max(G.smoke.get(k)||0,n));}}
function tickSmoke(){if(!G.smoke)return;for(const [k,v] of [...G.smoke]){if(v<=1)G.smoke.delete(k);else G.smoke.set(k,v-1);}}
const smokeAt=(x,y)=>!!(G.smoke&&G.smoke.has(y*G.W+x));
function drawSmoke(camX,camY,t){if(!G.smoke)return;for(const k of G.smoke.keys()){const x=k%G.W,y=(k/G.W)|0;if(!G.explored[y][x])continue;const sx=x*TS-camX,sy=y*TS-camY,o=Math.sin(t/400+x*1.7+y)*2;
    ctx.fillStyle="rgba(70,66,72,.55)";ctx.beginPath();ctx.arc(sx+8+o,sy+7,7,0,Math.PI*2);ctx.fill();ctx.fillStyle="rgba(110,104,110,.35)";ctx.beginPath();ctx.arc(sx+5-o,sy+5,4,0,Math.PI*2);ctx.fill();}}
// ---------- the two new traps ----------
async function triggerNewTrap(t,u){
  if(t.type==="gas"){await say(`Hiss! A cloud of green gas billows up around the ${u.name}!`,900);G.smoke=G.smoke||new Map();addSmoke(t.x,t.y,3);
    for(const v of G.party.concat(G.mons))if(!v.dead&&!(v.side==="m"&&v.hp<=0)&&!(v.side==="h"&&v.down)&&cheb(v,t)<=1){const s=saveRoll(v,"con",12);const dm=roll(`${trapN()}d6`).total;if(!s.ok&&!(v.tr&&v.tr.immune&&v.tr.immune.includes("poison")))v.st.poisoned=3;
      log(`${esc(v.name)}: ${s.txt}.`,"hurt");await dealDamage(v,s.ok?Math.floor(dm/2):dm,"poison",{});}return true;}
  if(t.type==="ceiling"){const s=saveRoll(u,"dex",13);const dm=roll(`${trapN()}d8`).total;cam.shake=now();makeNoise(t.x,t.y,12);await say(`CRACK! The ceiling caves in on the ${u.name}! (${s.txt})`,1000);
    G.ground[t.y][t.x]=GROUND.rubble;buildTerrain();await dealDamage(u,s.ok?Math.floor(dm/2):dm,"bludgeoning",{});return true;}
  return null;}
// ---------- listening at doors ----------
const SOUNDS={goblins:"guttural chatter and the scrape of blades",kobolds:"high-pitched yipping",beasts:"panting, claws on stone",undead:"a dry rattling, like bones",none:"a wet, slow squelching"};
async function listenAtDoor(d){const h=bestAt("perception");const dc=d.iron?15:10;const r=await check(h,"perception",dc);
  const beyond=G.mons.filter(m=>m.hp>0&&!m.peace&&cheb(m,d)<=8&&!seen(m.x,m.y));let msg;
  if(!r.ok)msg="You press an ear to the door but hear nothing.";
  else if(!beyond.length)msg="Silence on the other side.";
  else{const facs=[...new Set(beyond.map(m=>m.fac||"none"))];const n=beyond.length;const asleep=beyond.every(m=>m.state==="sleep");
    msg=`You hear ${r.total>=dc+5?`about ${n} creature${n>1?"s":""}`:"something"}: ${facs.map(f=>SOUNDS[f]||SOUNDS.none).join("; ")}${asleep?" ...and snoring":""}.`;}
  d.heard=msg;G.steps+=2;await say(`${msg} (${r.txt})`,1700,true);$("tBox").hidden=true;}
// ---------- carrying capacity ----------
const WEIGHT={bottle:0,firewood:2,ration:1,oil:1,torch:1,relic:2,key:0,arrows:.05};
const itemWeight=id=>ITEMS[id]&&ITEMS[id].wt!==undefined?ITEMS[id].wt:WEIGHT[id]!==undefined?WEIGHT[id]:ITEMS[id]&&ITEMS[id].kind==="gear"?1:.5;
function packLoad(){let w=0;for(const id in G.bag)w+=itemWeight(id)*(G.bag[id]||0);return Math.round(w*10)/10;}
function packCap(){return 12+heroesUp().filter(h=>h.id!=="beast").reduce((a,h)=>a+Math.max(4,Math.floor(score(h,"str")/2)+Math.max(0,abm(h,"con"))*2),0);}// 12 + each hero: half their STR + 2 per CON bonus
const overloaded=()=>!!(G&&G.bag&&!G.demo&&packLoad()>packCap());
