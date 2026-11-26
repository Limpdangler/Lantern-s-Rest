// ================= house rules & class interactions (Calvin's list, 26 Nov) =================
// Everything here applies to heroes and monsters alike unless it says otherwise.

// ---------- exhaustion in stages: −1/−2/−3…, and only half as bad on things you're proficient in ----------
function exhPen(u,prof){const e=exhOf(u);return prof?Math.floor(e/2):e;}

// ---------- initiative: DEX breaks ties; a natural 20 means your first attack has advantage ----------
function rollInit(u,bonus){const d=rnd(20);u.initD=d;u.init=d+bonus;if(d===20)u.st.quick=true;else delete u.st.quick;return u.init;}
function initOrder(a,b){return (b.init-a.init)||(abm(b,"dex")-abm(a,"dex"))||(Math.random()-.5);}
effect("quickStart","Natural 20 on initiative: advantage on your first attack",{attackMods:c=>{if(C&&c.a.st.quick)c.adv.push("natural 20 initiative");},afterAttack:async c=>{delete c.a.st.quick;}});

// ---------- flanking: an ally directly opposite you gives +2 to hit in melee ----------
function flanker(a,t){if(cheb(a,t)!==1)return null;const fx=2*t.x-a.x,fy=2*t.y-a.y;const f=unitAt(fx,fy);
  if(!f||f===a||f.side!==a.side||f.dead||f.down||(f.side==="m"&&(f.hp<=0||!f.inCombat))||f.st.asleep||f.st.paralysed||f.st.surprised&&C&&C.round===1)return null;return f;}
effect("flanking","Flanking: +2 to hit in melee with an ally on the opposite side",{attackMods:c=>{if(!C||!c.w.melee||c.w.spell)return;const f=flanker(c.a,c.t);if(f){c.bonus+=2;c.notes.push(`flanking with the ${f.name} +2`);}}});

// ---------- surprise only comes from an ambush ----------
// monsters are surprised if they're asleep, were tricked, or you were sneaking and they hadn't noticed you.
// heroes are only surprised by creatures that were lying in wait (hidden lurkers), never by bumping into each other.
function monsterSurprised(m){return m.state==="sleep"||!!m.fooled||(!!G.sneak&&m.state!=="hunt"&&!noticesParty(m));}

// ---------- shields: raise it for +2 AC, or sacrifice it to block a blow ----------
const SHIELD_USERS=["fighter","cleric"];
const hasShield=u=>u.side==="h"?SHIELD_USERS.includes(u.id)&&!u.wild&&!u.shieldBroken:!!(u.tr&&u.tr.shield)&&!u.shieldBroken;
ITEMS.shield={name:"Shield",kind:"keep",price:15,floor:1,w:0,desc:"A sturdy wooden shield. A fighter or cleric whose shield broke can strap this one on (you can only carry one spare)."};
WEIGHT.shield=3;
// goblins, goblin bosses and orcs carry shields
for(const k of ["goblin","goblinboss","orc"])if(MTRAITS[k])MTRAITS[k].shield=true;
effect("shieldBlock","Shield block: reaction to take no damage from one attack (the shield breaks)",{damageIn:async c=>{const u=c.u;if(!C||!c.o.attack||c.n<=0||!hasShield(u)||!canReact(u))return;
  const lethal=c.n>=(u.side==="h"?u.hp:u.hp);
  if(u.side==="h"){if(c.n<5&&!lethal)return;if(!await askReact(u,`Block the ${c.n} damage with your shield? You'll take none, but the shield breaks${hasFeat(u,"shieldmaster")?" (Shield Master: only half the time)":""}.`))return;}
  else if(!(lethal&&Math.random()<.6))return;
  u.reaction=false;c.n=0;fx.push({type:"ring",u,col:"#d0b080",t:now()});
  const keeps=hasFeat(u,"shieldmaster")&&Math.random()<.5;if(!keeps){u.shieldBroken=true;if(u.side==="m")u.ac-=2;delete u.st.raised;}
  float(u,keeps?"BLOCKED!":"SHIELD BREAKS!","#e0c090");await say(`The ${u.name} throws up a shield and takes the blow!${keeps?" The shield holds.":" The shield splinters apart."}`,950);}});
function shieldButtons(u){const B=[];if(!hasShield(u))return B;const free=hasFeat(u,"shieldmaster");
  B.push({t:"RAISE SHIELD",icon:"shield",sub:`${free?"Free (Shield Master)":"Bonus action"} · +2 AC until your next turn`,cost:free?"free":"bonus",dis:!!u.st.raised||(!free&&!C.bonus),
    f:async()=>{busy=true;if(!free)C.bonus=false;u.st.raised=true;float(u,"+2 AC","#d0e0ff");await say(`The ${u.name} raises a shield. (AC ${acOf(u)})`,700);afterAction();}});return B;}
function strapShield(h){if(!(G.bag.shield>0)||!h.shieldBroken)return;takeItem("shield");h.shieldBroken=false;hud();}

// ---------- healing potions: drink carefully (action) for the full amount, or gulp it (bonus action) and roll ----------
const potionMax=dice=>{const p=parseDice(dice);return p.n*p.d+p.b;};
function potionHeal(dice,full,who){return full||hasFeat(who,"healer")?potionMax(dice):roll(dice).total;}

// ---------- resting: no back-to-back rests ----------
const REST_GAP={short:40,long:120};
function restTooSoon(long){const last=long?G.lastLongStep:G.lastRestStep;if(last===undefined||last===null)return 0;const gap=long?REST_GAP.long:REST_GAP.short;const left=gap-(G.steps-last);return left>0?left:0;}

// ---------- feats: more of them, and humans start with one ----------
Object.assign(FEAT_OPTS,{observant:{name:"Observant",desc:"+5 to Passive Perception and Investigation: you spot traps, lurkers and secret doors more easily."},
  mobile:{name:"Mobile",desc:"+2 squares of movement, and Dash ignores difficult ground."},
  healer:{name:"Healer",desc:"Every healing potion or scroll you use heals the full amount, even when gulped as a bonus action."},
  shieldmaster:{name:"Shield Master",desc:"Fighters and clerics: Raise Shield is free, and blocking with your shield only breaks it half the time."}});
async function humanFeats(){if(!G)return;for(const h of G.party){if(h.dead||h.id==="beast"||h.race!=="human"||h.humanFeat)continue;h.feats=h.feats||[];h.humanFeat=true;
  const keys=Object.keys(FEAT_OPTS).filter(k=>k!=="asi"&&!h.feats.includes(k)&&(k!=="shieldmaster"||SHIELD_USERS.includes(h.id)));
  const c=await choose(`Humans are adaptable: the ${h.name} starts with a feat. Choose one:`,keys.map(k=>({t:FEAT_OPTS[k].name.toUpperCase(),sub:FEAT_OPTS[k].desc})));
  const k=keys[Math.max(0,c)];h.feats.push(k);if(k==="lucky")h.luck=3;applyLevel(h,false);log(`${esc(h.name)} takes the ${esc(FEAT_OPTS[k].name)} feat.`,"lv");}
  $("tBox").hidden=true;hud();}

// ---------- pushing barrels and boulders ----------
async function pushObj(o,dx,dy){const L=G.party[0];const tx=o.x+dx,ty=o.y+dy;const heavy=o.type==="boulder";
  if(isWall(tx,ty)||blocksObj(tx,ty)||unitAt(tx,ty)||doorAt(tx,ty)||(G.npc&&G.npc.x===tx&&G.npc.y===ty)||elevAt(tx,ty)>elevAt(o.x,o.y)){toast(`It won't go that way: something's behind it.`);return false;}
  const str=G.party.filter(h=>!h.dead&&!h.down&&cheb(h,o)<=2).sort((a,b)=>skillBonus(b,"athletics")-skillBonus(a,"athletics"))[0]||L;
  if(heavy){const r=await check(str,"athletics",13);G.steps+=2;makeNoise(o.x,o.y,6);if(!r.ok){toast(`The ${str.name} heaves, but the boulder won't budge. (${r.txt})`);return false;}}
  const ox=o.x,oy=o.y;o.x=tx;o.y=ty;
  const t=trapAt(tx,ty);if(t&&!t.done&&heavy&&t.type==="pit"){t.done=true;t.found=true;o.gone=true;G.ground[ty][tx]=GROUND.rubble;buildTerrain();toast("The boulder rolls into the hidden pit and fills it. Safe to cross now.");}
  else if(t&&!t.done){t.done=true;t.found=true;toast(`The ${heavy?"boulder":"barrel"} sets off a ${TRAPS[t.type]?TRAPS[t.type].name:"trap"}!`);}
  if(!unitAt(ox,oy)){await tryStepInto(ox,oy);}fov();computeLight();hud();return true;}
async function tryStepInto(x,y){const L=G.party[0];const dx=x-L.x,dy=y-L.y;if(Math.abs(dx)+Math.abs(dy)!==1)return;busy=false;await tryMove(dx,dy,false);busy=true;}

// ---------- mouse holes: a druid in rat form can squeeze through ----------
function placeMouseHoles(){G.holes=[];const W=G.W;const floorAt=(x,y)=>inB(x,y)&&!isWall(x,y);
  const vault=G.rooms.find(r=>r.role==="vault");const inRoom=(r,x,y)=>r&&x>=r.x&&x<r.x+r.w&&y>=r.y&&y<r.y+r.h;
  const cands=[];for(let y=1;y<G.H-1;y++)for(let x=1;x<W-1;x++){if(!isWall(x,y)||doorAt(x,y))continue;
    for(const [a,b] of [[[0,-1],[0,1]],[[-1,0],[1,0]]]){const p={x:x+a[0],y:y+a[1]},q={x:x+b[0],y:y+b[1]};if(!floorAt(p.x,p.y)||!floorAt(q.x,q.y))continue;
      const vp=inRoom(vault,p.x,p.y),vq=inRoom(vault,q.x,q.y);cands.push({x,y,a:p,b:q,vault:vp!==vq?(vp?p:q):null});}}
  const vc=cands.filter(c=>c.vault);if(vc.length&&Math.random()<.75)G.holes.push(pick(vc));
  const other=cands.filter(c=>!c.vault&&!G.holes.some(h=>cheb(h,c)<6));if(other.length&&Math.random()<.6)G.holes.push(pick(other));}
async function holeInteract(hole,act){const L=G.party[0];const ratL=L.wild&&L.wild.form==="rat";
  const druid=heroesUp().find(h=>h.id==="druid"&&!h.wild&&(h.res.wildshape||0)>0);
  if(!act){hintA("A small hole at the bottom of the wall.");return;}
  const far=cheb(L,hole.a)<=cheb(L,hole.b)?hole.b:hole.a;
  if(!ratL&&!druid){toast("A hole at the base of the wall, far too small for any of you. Something rat-sized could fit through.");return;}
  const c=await choose(`A small hole at the base of the wall, just big enough for a rat.${hole.vault?" It leads into the locked room.":""}`,[{t:ratL?"SQUEEZE THROUGH":"DRUID: BECOME A RAT AND SQUEEZE THROUGH",sub:ratL?"Scurry through to the other side":`Uses a Wild Shape (${druid.res.wildshape} left)`},{t:"LEAVE IT"}]);
  $("tBox").hidden=true;if(c!==0)return;const who=ratL?L:druid;if(!ratL)druid.res.wildshape--;
  const vr0=G.rooms.find(r=>r.role==="vault");const inVault=vr0&&L.x>=vr0.x&&L.x<vr0.x+vr0.w&&L.y>=vr0.y&&L.y<vr0.y+vr0.h;
  if(hole.vault&&!inVault){const doors=G.objs.filter(o=>o.type==="door"&&o.locked);const vr=G.rooms.find(r=>r.role==="vault");
    const vd=doors.filter(d=>entrances(vr).some(e=>e.x===d.x&&e.y===d.y));vd.forEach(d=>{d.locked=false;d.open=true;});
    await say(`The ${who.name} squeezes through as a rat, scampers across the locked room, turns back into ${who.nick||"themselves"} inside... and lifts the bar off the door from the inside. Click.`,2200,true);$("tBox").hidden=true;}
  else{G.owl={x:far.x,y:far.y,until:G.steps+10};await say(`The rat scurries through the hole and peers around the other side.`,1100,true);$("tBox").hidden=true;}
  computeLight();fov();hud();}
function drawHoles(camX,camY){if(!G||!G.holes)return;for(const h of G.holes){if(!G.explored[h.y]||!G.explored[h.y][h.x])continue;const sx=h.x*TS-camX,sy=h.y*TS-camY;
  ctx.fillStyle="#0a0608";ctx.fillRect(sx+5,sy+11,6,5);ctx.fillRect(sx+6,sy+10,4,1);ctx.fillStyle="rgba(0,0,0,.35)";ctx.fillRect(sx+4,sy+15,8,1);}}

// ---------- foraging: rangers and druids know what's safe to eat; a book can teach anyone ----------
ITEMS.almanac={name:"Forager's Almanac",kind:"keep",price:40,floor:1,w:2,desc:"A battered field guide to edible fungi and roots. Read it and the whole party learns to forage safely."};
WEIGHT.almanac=1;
function forageLeader(){const up=heroesUp().filter(h=>h.id!=="beast"&&!h.wild);const nat=up.filter(h=>h.id==="ranger"||h.id==="druid");
  if(nat.length)return nat.sort((a,b)=>skillBonus(b,"survival")-skillBonus(a,"survival"))[0];if(G.lore&&G.lore.forage)return up.sort((a,b)=>skillBonus(b,"survival")-skillBonus(a,"survival"))[0]||null;return null;}
function readAlmanac(){if(!(G.bag.almanac>0))return;takeItem("almanac");G.lore=G.lore||{};G.lore.forage=true;
  return "You pore over the almanac's drawings of mushrooms, roots and mosses. Now anyone in the party can forage safely (it's on the ABILITIES list).";}

// mouse holes are dug when each floor is built
{const base=genFloorInner;genFloorInner=function(){base();placeMouseHoles();};}
