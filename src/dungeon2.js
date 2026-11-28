// ================= a living dungeon: themed rooms, furniture to use in a fight, foes who flee and come back, chance events, rival adventurers =================
Object.assign(BLOCKERS,{table:1,pillar:1,fallen:1,crate:1,shelf:1,flasks:1,rack:1,cask:1,altar:1,bed:1,pew:1,cauldron:1,cage:1,toppled:1});
Object.assign(COVER,{table:1,pillar:1,fallen:1,crate:1,shelf:1,flasks:1,cask:1,altar:1,pew:1,cauldron:1,toppled:1});
Object.assign(WOODEN,{table:1,crate:1,shelf:1,rack:1,cask:1,bed:1,pew:1,straw:1,toppled:1});
Object.assign(BUMP_NAME,{table:"A table",pillar:"A stone pillar",fallen:"A fallen pillar",crate:"A crate",shelf:"A bookshelf",flasks:"A shelf of flasks",rack:"A weapon rack",cask:"A big cask",
  altar:"An altar",bed:"A bed",pew:"A pew",cauldron:"A cauldron",cage:"A cage",toppled:"A toppled bookshelf"});
// rival adventurers are drawn with the heroes' own sprites
for(const cls of ["fighter","rogue","wizard","cleric","ranger","barbarian","bard","druid","warlock","sorcerer","monk","paladin"]){HUMAN[cls]=1;
  if(!MON2[cls])MON2[cls]=()=>{const c=document.createElement("canvas");c.width=c.height=16;c.getContext("2d").drawImage(heroSpr(cls,"f"),0,2,16,16,0,0,16,16);return c;};}

// ---------- room themes ----------
const ROOM_THEMES={
  library:{name:"an old library",desc:"Dusty bookshelves line the walls. The air smells of mould and old paper.",min:[5,4]},
  storage:{name:"a storeroom",desc:"Crates and casks are stacked about. Somebody once kept supplies down here.",min:[4,3]},
  mess:{name:"a mess hall",desc:"Long tables and a big iron cauldron. The ghost of old stew hangs in the air.",min:[6,4]},
  sleeping:{name:"sleeping quarters",desc:"Rows of mouldering beds. Whoever slept here left in a hurry.",min:[5,4]},
  barracks:{name:"a barracks",desc:"Bunks, a weapon rack and a battered table. Soldiers were stationed here once.",min:[6,4]},
  cellar:{name:"a cellar",desc:"Damp stone and big wooden casks. Something drips in the corner.",min:[4,3]},
  chapel:{name:"a chapel",desc:"Pews face a stone altar. A faded holy symbol is carved above it.",min:[6,5]},
  prison:{name:"a prison",desc:"Rusted shackles hang from the walls, and there are cages here.",min:[5,4]},
  alchemy:{name:"an alchemist's lab",desc:"Shelves of strange flasks and a sharp chemical stink. Best keep fire well away.",min:[5,4]},
  hall:{name:"a pillared hall",desc:"Heavy stone pillars hold up the ceiling of this great hall. A strong shove might bring one down.",big:true}};
const d2free=(x,y)=>!reserved(x,y)&&!elevAt(x,y)&&!isRamp(x,y)&&!doorAt(x,y);
function edgeSpots(r,side){const out=[];
  if(side==="top"||side==="bottom"){const y=side==="top"?r.y:r.y+r.h-1,wy=side==="top"?y-1:y+1;for(let x=r.x;x<r.x+r.w;x++)if(isWall(x,wy)&&d2free(x,y)&&!nearDoorway(x,y))out.push({x,y});}
  else{const x=side==="left"?r.x:r.x+r.w-1,wx=side==="left"?x-1:x+1;for(let y=r.y;y<r.y+r.h;y++)if(isWall(wx,y)&&d2free(x,y)&&!nearDoorway(x,y))out.push({x,y});}
  return out;}
const allEdges=r=>edgeSpots(r,"top").concat(edgeSpots(r,"bottom"),edgeSpots(r,"left"),edgeSpots(r,"right"));
function longTable(r,add,y){let tid=++G.tid,len=0;for(let x=r.x+1;x<=r.x+r.w-2;x++){const gap=r.w>=9&&x===r.cx;
    const ok=!gap&&d2free(x,y)&&!isWall(x,y-1)&&!isWall(x,y+1)&&!nearDoorway(x,y)&&!blocksObj(x,y-1)&&!blocksObj(x,y+1);
    if(!ok){if(len)tid=++G.tid;len=0;continue;}add("table",x,y,{tid});len++;}}
const FURNISH={
  library(r,add){for(const p of edgeSpots(r,"top"))if(Math.random()<.85)add("shelf",p.x,p.y,{lore:Math.random()<.25});
    if(r.h>=5)for(const p of edgeSpots(r,"bottom"))if(Math.random()<.5)add("shelf",p.x,p.y,{lore:Math.random()<.2});const p=interiorFree(r,true);if(p)add("table",p.x,p.y,{tid:++G.tid});},
  alchemy(r,add){for(const p of shuffle(edgeSpots(r,"top")).slice(0,ri(2,3)))add("flasks",p.x,p.y);const b=interiorFree(r,true);if(b)add("alchemy",b.x,b.y);
    for(let i=0;i<ri(1,2);i++){const q=interiorFree(r,false);if(q)G.ground[q.y][q.x]=GROUND.acid;}},
  storage(r,add){for(const p of shuffle(allEdges(r)).slice(0,ri(3,6)))add(Math.random()<.75?"crate":"cask",p.x,p.y);const q=interiorFree(r,true);if(q)add("crate",q.x,q.y);
    if(Math.random()<.4){const b=interiorFree(r,true);if(b)add("barrel",b.x,b.y,{hp:4,deco:false});}},
  mess(r,add){longTable(r,add,r.cy);if(r.h>=7)longTable(r,add,r.cy-2);const c=pick(edgeSpots(r,"top").concat(edgeSpots(r,"bottom")));if(c)add("cauldron",c.x,c.y,{food:Math.random()<.6});},
  sleeping(r,add){for(const side of ["top","bottom"])for(const p of edgeSpots(r,side))if((p.x-r.x)%2===0)add("bed",p.x,p.y,{loot:Math.random()<.35});},
  barracks(r,add){for(const p of edgeSpots(r,"top"))if((p.x-r.x)%2===0)add("bed",p.x,p.y,{loot:Math.random()<.25});
    const s=edgeSpots(r,"left").concat(edgeSpots(r,"right"));if(s.length){const p=pick(s);add("rack",p.x,p.y);}const q=interiorFree(r,true);if(q)add("table",q.x,q.y,{tid:++G.tid});},
  cellar(r,add){const sp=shuffle(edgeSpots(r,"top").concat(edgeSpots(r,"left"),edgeSpots(r,"right")));for(const p of sp.slice(0,ri(2,4)))add("cask",p.x,p.y);
    for(const p of sp.slice(4,5+ri(0,1)))add("crate",p.x,p.y);if(Math.random()<.5)blob(r,GROUND.water,ri(2,4));},
  chapel(r,add){const top=edgeSpots(r,"top");const a=top.find(p=>p.x===r.cx)||top[Math.floor(top.length/2)];if(a)add("altar",a.x,a.y);
    for(const y of [r.cy,r.cy+2]){if(y>=r.y+r.h-1||y<=r.y)continue;for(let x=r.x+1;x<r.x+r.w-1;x++){if(x===r.cx)continue;if(!isWall(x,y-1)&&!isWall(x,y+1)&&!nearDoorway(x,y))add("pew",x,y);}}},
  prison(r,add){let k=0;for(const p of shuffle(edgeSpots(r,"top").concat(edgeSpots(r,"bottom"))).slice(0,ri(1,2))){const pr=!k&&Math.random()<.45;if(pr)k++;add("cage",p.x,p.y,{prisoner:pr,bones:!pr&&Math.random()<.6});}
    for(const p of shuffle(edgeSpots(r,"left").concat(edgeSpots(r,"right"))).slice(0,ri(1,3)))add("shackles",p.x,p.y);for(let i=0;i<2;i++){const q=interiorFree(r,false);if(q)add("straw",q.x,q.y);}},
  hall(r,add){for(const y of [r.y+1,r.y+r.h-2])for(let x=r.x+2;x<=r.x+r.w-3;x+=3)if(!nearDoorway(x,y))add("pillar",x,y);}};
// how many important spots (rooms, the ladder, chests, people...) the party can still walk to
function reachCount(){const sr=G.rooms.find(r=>r.role==="start")||G.rooms[0];const W=G.W;const sn=new Uint8Array(G.W*G.H);const st=[sr.cy*W+sr.cx];sn[st[0]]=1;
  while(st.length){const c=st.pop();const x=c%W,y=(c/W)|0;for(const [dx,dy] of DIRS4){const nx=x+dx,ny=y+dy;if(isWall(nx,ny))continue;const k=ny*W+nx;if(sn[k]||blocksObj(nx,ny))continue;sn[k]=1;st.push(k);}}
  const pts=[];for(const r of G.rooms)if(r.role!=="secret")pts.push([r.cx,r.cy]);if(G.stairs)pts.push([G.stairs.x,G.stairs.y]);
  for(const o of G.objs)if(!o.gone&&!o.deco&&o.type!=="door")pts.push([o.x,o.y]);for(const i of G.items)pts.push([i.x,i.y]);if(G.npc)pts.push([G.npc.x,G.npc.y]);for(const m of G.mons)pts.push([m.x,m.y]);
  let n=0;for(const [x,y] of pts)if(sn[y*W+x]||DIRS4.some(([dx,dy])=>inB(x+dx,y+dy)&&sn[(y+dy)*W+x+dx]))n++;return n;}
function themeRooms(){if(G.demo)return;G.tid=G.tid||0;const base=reachCount();const used=new Set();
  for(const r of G.rooms){if(r.role)continue;const added=[];const add=(type,x,y,extra)=>{if(!d2free(x,y))return null;const o=Object.assign({type,x,y,deco:true},extra||{});G.objs.push(o);added.push(o);return o;};
    let th=null;if(r.w>=10&&r.h>=7)th="hall";
    else if(Math.random()<.72){const fits=Object.keys(ROOM_THEMES).filter(k=>{const T=ROOM_THEMES[k];return !T.big&&T.min&&r.w>=T.min[0]&&r.h>=T.min[1]&&(k!=="alchemy"||G.floor>=2);});
      const fresh=fits.filter(k=>!used.has(k));const pool=fresh.length?fresh:fits;if(pool.length)th=pick(pool);}
    if(th){r.theme=th;used.add(th);FURNISH[th](r,add);if(th==="hall"&&Math.random()<.6){const sub=pick(["mess","chapel","barracks","library","storage"]);r.theme2=sub;FURNISH[sub](r,add);}}
    else{if(r.w>=7&&r.h>=5&&Math.random()<.35)for(const [x,y] of [[r.x+2,r.y+1],[r.x+r.w-3,r.y+r.h-2]])if(!nearDoorway(x,y))add("pillar",x,y);
      if(r.w>=5&&r.h>=4&&Math.random()<.3){const p=interiorFree(r,true);if(p)add("table",p.x,p.y,{tid:++G.tid});}}
    // never let furniture cut the party off from anything: take pieces back out until everything can be reached again
    while(added.length&&reachCount()<base){const o=added.pop();G.objs.splice(G.objs.indexOf(o),1);}
    if(th&&added.length<2){r.theme=null;r.theme2=null;}}}
{const base=placeDressing;placeDressing=function(){themeRooms();base();spawnRivals();};}

// ---------- using the furniture ----------
const tableSegs=o=>o.tid?G.objs.filter(q=>q.type==="table"&&q.tid===o.tid&&!q.gone):[o];
function flipTable(o){for(const s of tableSegs(o))s.flipped=true;makeNoise(o.x,o.y,5);fov();}
function canShove(o,dx,dy){const tx=o.x+dx,ty=o.y+dy;return !(dx&&dy)&&(dx||dy)&&!isWall(tx,ty)&&!blocksObj(tx,ty)&&!unitAt(tx,ty)&&!doorAt(tx,ty)&&!(G.stairs&&G.stairs.x===tx&&G.stairs.y===ty)&&elevAt(tx,ty)<=elevAt(o.x,o.y);}
function slideObj(o,dx,dy){const before=reachCount();o.x+=dx;o.y+=dy;if(reachCount()<before){o.x-=dx;o.y-=dy;toast("Pushing it there would block the way. It stays put.");return false;}makeNoise(o.x,o.y,4);fov();return true;}
// the squares a falling pillar lands on
function fallLine(p,dx,dy){if(!dx&&!dy)dx=1;const out=[];for(let i=1;i<=3;i++){const x=p.x+dx*i,y=p.y+dy*i;if(isWall(x,y)||doorAt(x,y))break;const o=objAt(x,y);if(o&&BLOCKERS[o.type])break;out.push([x,y]);}return out;}
async function topple(p,u,dx,dy){if(!dx&&!dy)dx=1;const line=fallLine(p,dx,dy);const before=reachCount();p.gone=true;G.ground[p.y][p.x]=GROUND.rubble;
  const hit=[];const laid=[];for(const [x,y] of line){const v=unitAt(x,y);if(v&&v!==u&&v.side!=="n")hit.push(v);
    if(!v&&!objAt(x,y)&&!G.items.some(i=>i.x===x&&i.y===y)){const o={type:"fallen",x,y,deco:true,vert:!dx};G.objs.push(o);laid.push(o);}else G.ground[y][x]=GROUND.rubble;}
  if(reachCount()<before)for(const o of laid){o.gone=true;G.ground[o.y][o.x]=GROUND.rubble;}
  cam.shake=now();makeNoise(p.x,p.y,14);fx.push({type:"boom",x:(line[1]||line[0]||[p.x])[0],y:(line[1]||line[0]||[0,p.y])[1],t:now()});buildTerrain();computeLight();fov();
  await say(`${u.side==="h"?"The "+u.name:"The "+u.name} topples the pillar! It crashes down in a roar of stone and dust.`,1100,!C);
  for(const v of hit){const s=await dodgeRoll(v,13);let d=roll("3d6").total;if(s.ok)d=Math.floor(d/2);else{v.st.prone=true;float(v,"PRONE","#ffffff");}
    log(`${esc(v.name)} is caught under the pillar: ${s.txt}.`,"hurt");await dealDamage(v,d,"bludgeoning",{});}
  // monsters who watch a pillar come down on their friends may lose their nerve
  if(C)for(const q of G.mons)if(q.inCombat&&q.hp>0&&q.tr.morale&&!q.fleeing&&!q.boss&&cheb(q,p)<=5&&hit.some(v=>v.side==="m")){if(!saveRoll(q,"wis",10).ok){q.fleeing=true;float(q,"FLEE!","#ffffff");}}
  return hit;}
async function tipShelf(o,u){const dx=Math.sign(o.x-u.x),dy=Math.sign(o.y-u.y);const tx=o.x+dx,ty=o.y+dy;const r=await check(u,"athletics",13);
  if(!r.ok){await say(`The ${u.name} heaves at the shelf, but it won't tip. (${r.txt})`,900);return;}
  const before=reachCount();o.gone=true;makeNoise(o.x,o.y,9);cam.shake=now();const v=unitAt(tx,ty);
  if(v){G.ground[ty][tx]=GROUND.rubble;buildTerrain();await say(`The ${u.name} tips the ${o.type==="flasks"?"shelf of flasks":"bookshelf"} over onto the ${v.name}! (${r.txt})`,1000);
    const s=await dodgeRoll(v,12);let d=roll("2d6").total;if(s.ok)d=Math.floor(d/2);else{v.st.prone=true;float(v,"PRONE","#ffffff");}log(`${esc(v.name)}: ${s.txt}.`,"hurt");await dealDamage(v,d,"bludgeoning",{});
    if(o.type==="flasks"&&v.hp>0)await dealDamage(v,roll("1d6").total,"acid",{});}
  else{const t={type:"toppled",x:tx,y:ty,deco:true,vert:!dx};G.objs.push(t);if(reachCount()<before){t.gone=true;G.ground[ty][tx]=GROUND.rubble;buildTerrain();}
    await say(`The ${u.name} tips the shelf over with a crash. (${r.txt})`,900);}
  fov();}
// alchemist's flasks go up in a ball of fire when flames reach them
function blowFlasks(o){o.blown=true;o.gone=true;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const x=o.x+dx,y=o.y+dy;if(!isWall(x,y))G.fire.set(y*G.W+x,3);const w=G.objs.find(q=>q.x===x&&q.y===y&&isWooden(q));if(w)setAlight(w);}
  fx.push({type:"boom",x:o.x,y:o.y,t:now()});cam.shake=now();makeNoise(o.x,o.y,12);log("The alchemist's flasks burst in a ball of green fire!","hurt");computeLight();}
{const base=burnObjects;burnObjects=function(){for(const o of G.objs)if(o.type==="flasks"&&!o.gone&&!o.blown&&[[0,0]].concat(DIRS8).some(([dx,dy])=>fireAt(o.x+dx,o.y+dy)))blowFlasks(o);base();
  for(const o of G.objs)if(o.type==="shelf"&&o.burn&&!o.gone)for(const q of G.objs)if(q!==o&&isWooden(q)&&!q.burn&&cheb(q,o)<=1&&Math.random()<.5)setAlight(q);};}

// buttons in a fight
function d2Buttons(u){const B=[];if(!C||u.wild||u.id==="beast")return B;const adj=(types,dirs)=>dirs.map(([dx,dy])=>objAt(u.x+dx,u.y+dy)).filter(o=>o&&types.includes(o.type));
  const tb=adj(["table"],DIRS8).find(o=>!o.flipped);
  if(tb)B.push({t:"FLIP THE TABLE",sub:"Bonus action · knock it on its side to hide behind",cost:"bonus",dis:!C.bonus,f:async()=>{busy=true;C.bonus=false;flipTable(tb);await say(`The ${u.name} flips the table onto its side: instant cover!`,800);afterAction();}});
  const pl=adj(["pillar"],DIRS8)[0];
  if(pl)B.push({t:"TOPPLE THE PILLAR",sub:`Action · Athletics DC 16 · ${oddsTag(u,"athletics",16)} · it falls away from you, crushing anyone in the way (3d6)`,cost:"action",dis:!hasAction()||C.attacksLeft>0,
    f:async()=>{busy=true;C.actions--;const r=await check(u,"athletics",16,{adv:!!u.st.raging});if(r.ok)await topple(pl,u,Math.sign(pl.x-u.x),Math.sign(pl.y-u.y));else await say(`The ${u.name} strains against the pillar, but it holds. (${r.txt})`,900);afterAction();}});
  const cr=adj(["crate","cask"],DIRS4).find(o=>canShove(o,Math.sign(o.x-u.x),Math.sign(o.y-u.y)));
  if(cr)B.push({t:`SHOVE THE ${cr.type==="cask"?"CASK":"CRATE"}`,sub:"Free (once per turn) · slide it one square away to make cover",dis:C.objUsed,f:()=>{C.objUsed=true;slideObj(cr,Math.sign(cr.x-u.x),Math.sign(cr.y-u.y));buildPanel();hud();}});
  const sh=adj(["shelf","flasks"],DIRS4).find(o=>{const tx=o.x+Math.sign(o.x-u.x),ty=o.y+Math.sign(o.y-u.y);return !isWall(tx,ty)&&!blocksObj(tx,ty)&&!doorAt(tx,ty);});
  if(sh)B.push({t:"TIP THE SHELF OVER",sub:`Action · Athletics DC 13 · ${oddsTag(u,"athletics",13)} · falls on whoever is behind it (2d6)`,cost:"action",dis:!hasAction()||C.attacksLeft>0,f:async()=>{busy=true;C.actions--;await tipShelf(sh,u);afterAction();}});
  return B;}
{const base=gunButtons;gunButtons=u=>base(u).concat(d2Buttons(u));}

// ---------- exploring: what each piece of furniture does ----------
async function findSome(what){const f=G.floor;let got=null;
  if(what==="gold"){const g=ri(2,8)*f;G.gold+=g;got=g+" gold";}
  else if(what==="supply"){const it=pick(["ration","torch","oil","firewood","arrows","arrows"]);const n=it==="arrows"?ri(4,8):1;addItem(it,n);got=(n>1?n+" ":"")+itemName(it);}
  else if(what==="item"){const it=rollItem(false);if(it){addItem(it);got=itemName(it);}}
  hud();return got;}
const leadDir=o=>{const L=G.party[0];let dx=Math.sign(o.x-L.x),dy=Math.sign(o.y-L.y);if(dx&&dy)dy=0;return [dx,dy];};
const D2_ACT={
  async table(o){if(o.flipped){const c=await choose("A table tipped on its side. Good cover against arrows.",[{t:"SET IT BACK UPRIGHT"},{t:"BREAK IT UP FOR FIREWOOD",sub:"+1 firewood · noisy"},{t:"LEAVE IT"}]);
      if(c===0){for(const s of tableSegs(o))s.flipped=false;}else if(c===1){for(const s of tableSegs(o))s.gone=true;addItem("firewood");makeNoise(o.x,o.y,5);await say("You break the table down into firewood.",1000,true);}return;}
    const c=await choose("A sturdy old table.",[{t:"FLIP IT ON ITS SIDE",sub:"Makes cover to hide behind in a fight · a bit noisy"},{t:"SEARCH IT",sub:o.searched?"Already searched":"Someone may have left something",dis:!!o.searched},{t:"BREAK IT UP FOR FIREWOOD",sub:"+1 firewood · noisy"},{t:"LEAVE IT"}]);
    if(c===0){flipTable(o);toast("You tip the table onto its side. Arrows will have a harder time finding you behind it.");}
    else if(c===1){o.searched=true;G.steps+=2;const g=Math.random()<.4?await findSome(Math.random()<.6?"gold":"supply"):null;await say(g?`Among the clutter: ${g}.`:"Crumbs, wax drips and a broken cup. Nothing useful.",1100,true);}
    else if(c===2){for(const s of tableSegs(o))s.gone=true;addItem("firewood");makeNoise(o.x,o.y,5);await say("You break the table down into a bundle of firewood.",1000,true);}},
  async pillar(o){const h=bestAt("athletics");const [dx,dy]=leadDir(o);const line=fallLine(o,dx,dy);const mons=line.map(([x,y])=>monAt(x,y)).filter(Boolean);
    const c=await choose(`A thick stone pillar, cracked at the base. A strong shove would bring it down${mons.length?`, right on top of the ${mons[0].name}`:""}.`,[{t:"TOPPLE IT",sub:`Athletics DC 16 · ${oddsTag(h,"athletics",16)} · it falls away from you · very loud`},{t:"LEAVE IT"}]);
    if(c!==0)return;const r=await check(h,"athletics",16,{adv:!!h.st.raging});G.steps+=2;if(!r.ok){makeNoise(o.x,o.y,4);await say(`The ${h.name} strains against the pillar, but it holds. (${r.txt})`,1000,true);return;}
    const hit=await topple(o,h,dx,dy);const alive=hit.filter(v=>v.side==="m"&&v.hp>0);$("tBox").hidden=true;
    if(alive.length&&mode==="explore"){busy=false;startCombat({extra:alive,bumped:alive[0],partyFirst:true});}},
  async fallen(o){toast("A fallen stone pillar. You could crouch behind it in a fight.");},
  async toppled(o){toast("A toppled bookshelf, books spilled everywhere. Decent cover.");},
  async crate(o){const [dx,dy]=leadDir(o);const c=await choose("A wooden crate"+(o.searched?", already pried open.":", nailed shut."),[{t:"PRY IT OPEN",sub:o.searched?"Already done":"See what's inside · a little noisy",dis:!!o.searched},{t:"PUSH IT",sub:"Slide it one square away from you",dis:!canShove(o,dx,dy)},{t:"BREAK IT UP FOR FIREWOOD",sub:"+1 firewood · noisy"},{t:"LEAVE IT"}]);
    if(c===0){o.searched=true;makeNoise(o.x,o.y,3);G.steps+=2;const q=Math.random();const g=q<.55?await findSome("supply"):q<.65?await findSome("item"):q<.75?await findSome("gold"):null;await say(g?`Inside the crate: ${g}.`:"Inside: rotten straw and mouse droppings.",1100,true);}
    else if(c===1){$("tBox").hidden=true;if(slideObj(o,dx,dy))await tryStepInto(o.x-dx,o.y-dy);}
    else if(c===2){o.gone=true;addItem("firewood");makeNoise(o.x,o.y,5);await say("You smash the crate into firewood.",1000,true);}},
  async cask(o){const [dx,dy]=leadDir(o);const c=await choose("A big wooden cask"+(o.tapped?", tapped dry.":". Something sloshes inside."),[{t:"TAP IT",sub:o.tapped?"Nothing left":"Have a taste...",dis:!!o.tapped},{t:"ROLL IT",sub:"Push it one square away from you",dis:!canShove(o,dx,dy)},{t:"LEAVE IT"}]);
    if(c===0){o.tapped=true;const q=Math.random();
      if(q<.5){for(const h of heroesUp())h.thp=Math.max(h.thp||0,ri(2,4));await say("Old wine, and surprisingly good. Everyone takes a swig and feels braver (a few temporary HP each, until the next fight ends).",1600,true);}
      else if(q<.75){if((G.bag.bottle||0)>0){takeItem("bottle");addItem("oil");await say("It's lamp oil! You fill an empty bottle with it.",1100,true);}else{o.tapped=false;await say("It's lamp oil, but you've no empty bottle to carry it in. Drink a potion and come back.",1500,true);}}else await say("Vinegar. Everyone splutters.",900,true);}
    else if(c===1){$("tBox").hidden=true;if(slideObj(o,dx,dy))await tryStepInto(o.x-dx,o.y-dy);}},
  async shelf(o){const h=bestAt("investigation");const c=await choose("A tall bookshelf, sagging with mouldy books and scrolls. Dry paper: it would burn fast.",[{t:"SEARCH THE SHELVES",sub:o.searched?"Already searched":`Investigation DC 12 · ${oddsTag(h,"investigation",12)}`,dis:!!o.searched},{t:"LEAVE IT"}]);
    if(c!==0)return;o.searched=true;G.steps+=4;const r=await check(h,"investigation",12);
    if(!r.ok){if(r.r===1){makeNoise(o.x,o.y,6);await say(`A cloud of dust! The ${h.name} sneezes loudly. (${r.txt})`,1100,true);}else await say(`Rotten pages and nothing readable. (${r.txt})`,1000,true);return;}
    const q=Math.random();if(o.lore||q<.25){revealAround(o.x,o.y,11);await say(`Tucked in a book: a rough sketch of the nearby tunnels. (${r.txt}) Your map fills in around here.`,1500,true);}
    else if(q<.65){const xp=6*G.floor;await say(`The ${h.name} finds an old account of these tunnels and learns from it. (+${xp} XP) (${r.txt})`,1400,true);for(const m of gainXpNow(xp))await say(m,1500,true);}
    else{const g=await findSome("item")||await findSome("gold");await say(`Hidden behind the books: ${g}. (${r.txt})`,1300,true);}},
  async flasks(o){const h=bestAt("medicine");const c=await choose("Shelves of dusty flasks and jars, some still bubbling faintly. Volatile: fire would make them explode.",[{t:"SORT THROUGH THEM",sub:o.searched?"Already searched":`Medicine DC 12 · ${oddsTag(h,"medicine",12)}`,dis:!!o.searched},{t:"LEAVE IT"}]);
    if(c!==0)return;o.searched=true;const r=await check(h,"medicine",12);
    if(r.ok){const it=pick(["potion","potion","oil","antitoxin","poisonvial"].filter(k=>ITEMS[k]));addItem(it);await say(`The ${h.name} picks out something useful: ${itemName(it)}. (${r.txt})`,1300,true);hud();}
    else{const s=saveRoll(h,"dex",12);await say(`A jar cracks and hisses! (${r.txt})`,900,true);await dealDamage(h,s.ok?1:roll("1d6").total,"acid",{});}},
  async rack(o){const gun=G.party.some(h=>h.sub==="gunslinger"&&!h.dead)&&ITEMS.bullets;const c=await choose("A weapon rack. Most of it was taken long ago.",[{t:"TAKE WHAT'S LEFT",sub:o.searched?"It's empty now":"Ammunition, maybe",dis:!!o.searched},{t:"LEAVE IT"}]);
    if(c!==0)return;o.searched=true;if(gun&&Math.random()<.5){const n=ri(3,6);addItem("bullets",n);await say(`A pouch of lead shot and powder: ${n} bullets.`,1100,true);}else{const n=ri(4,10);addItem("arrows",n);await say(`A bundle of ${n} arrows, fletching a bit ragged.`,1100,true);}hud();},
  async bed(o){const c=await choose("A mouldering old bed.",[{t:"SEARCH UNDER THE MATTRESS",sub:o.searched?"Already searched":"People hide things in beds",dis:!!o.searched},{t:"LEAVE IT"}]);
    if(c!==0)return;o.searched=true;G.steps+=2;const g=o.loot?await findSome(Math.random()<.8?"gold":"item"):null;await say(g?`Under the mattress: ${g}.`:"Just fleas.",1000,true);},
  async altar(o){const h=bestAt("religion");const holy=G.party.some(x=>!x.dead&&(x.id==="cleric"||x.id==="paladin"));
    const c=await choose("A stone altar under a faded holy symbol. It feels like someone is still listening.",[{t:"PRAY",sub:o.used?"You've already prayed here":`Religion DC 12 · ${oddsTag(h,"religion",12,{adv:holy})}${holy?" (a holy hero helps)":""}`,dis:!!o.used},{t:"LEAVE IT"}]);
    if(c!==0)return;o.used=true;G.steps+=6;const r=await check(h,"religion",12,{adv:holy});
    if(r.ok){G.altarBless=true;for(const x of heroesUp())heal(x,roll("1d6").total);await say(`A warm light fills the chapel. Everyone is healed a little and BLESSED: +1 to hit until your next rest. (${r.txt})`,1600,true);}
    else await say(`Only silence answers. (${r.txt})`,1000,true);hud();},
  async pew(o){toast("A heavy wooden pew. Solid enough to duck behind.");},
  async cauldron(o){const c=await choose("A big iron cauldron on cold ashes."+(o.food&&!o.searched?" There's something left in the bottom.":""),[{t:"SCOOP OUT WHAT'S LEFT",sub:o.searched?"Nothing left":"Food is food",dis:!!o.searched},{t:"LEAVE IT"}]);
    if(c!==0)return;o.searched=true;if(o.food){addItem("ration",2);await say("Cold, thick stew. Not pretty, but it'll keep you going: +2 rations.",1300,true);hud();}else await say("Green mould. Nobody's that hungry.",900,true);},
  async cage(o){if(o.open){toast("An empty cage, its door hanging open.");return;}
    if(!o.prisoner){const c=await choose(o.bones?"A rusted cage. Old bones lie curled up inside.":"A rusted, empty cage.",[{t:"SEARCH IT",sub:o.searched?"Already searched":"",dis:!!o.searched||!o.bones},{t:"LEAVE IT"}]);
      if(c===0){o.searched=true;const g=Math.random()<.5?await findSome("gold"):null;await say(g?`Clutched in a bony hand: ${g}.`:"Nothing but bones.",1000,true);}return;}
    const th=bestAt("thieves"),at=bestAt("athletics");
    const c=await choose(`A ragged prisoner grips the bars. "Please! Get me out of here before they come back!"`,[{t:"PICK THE LOCK",sub:o.pickFail?"You couldn't do it":`Thieves' Tools DC 13 · ${oddsTag(th,"thieves",13)}`,dis:!!o.pickFail},{t:"BEND THE BARS",sub:o.bendFail?"They won't bend":`Athletics DC 16 · ${oddsTag(at,"athletics",16)} · noisy`,dis:!!o.bendFail},{t:"LEAVE THEM",sub:"They'll beg you to come back"}]);
    if(c===0){const r=await check(th,"thieves",13);if(!r.ok){o.pickFail=true;await say(`The lock is rusted solid. (${r.txt})`,1000,true);return;}await freePrisoner(o,`The lock clicks open. (${r.txt})`);}
    else if(c===1){const r=await check(at,"athletics",16);makeNoise(o.x,o.y,10);if(!r.ok){o.bendFail=true;await say(`The bars groan but hold. (${r.txt})`,1000,true);return;}await freePrisoner(o,`The ${at.name} wrenches the bars apart. (${r.txt})`);}},
  async shackles(o){if(o.searched){toast("Rusted shackles, bolted to the wall.");return;}o.searched=true;const g=Math.random()<.25?await findSome("gold"):null;toast(g?`Rusted shackles. Someone scratched a tally of days beside them, and hid ${g} in a crack.`:"Rusted shackles. Someone scratched a tally of days into the wall beside them.");},
  async straw(o){toast("A pile of filthy straw. Bone dry: it would go up in a flash.");}};
async function freePrisoner(o,how){o.open=true;o.prisoner=false;const full=G.party.filter(h=>h.id!=="beast").length>=S.dungeon.party;
  if(!full&&Math.random()<.35){const p=nearFree(o.x,o.y);if(p){await say(`${how} The prisoner stumbles out, rubbing their wrists.`,1200,true);G.npc={side:"n",def:pick(S.classes),race:pick(RACE_KEYS),x:p.x,y:p.y};$("tBox").hidden=true;await recruit();return;}}
  const q=Math.random();const L=G.party[0];
  if(q<.35){revealAround(o.x,o.y,10);await say(`${how} "Thank you, thank you!" The prisoner scratches a map of the nearby tunnels in the dust (your map fills in around here), then runs for the ladder.`,1800,true);}
  else if(q<.7){const poi=pointOfInterest();if(poi){revealAround(poi.x,poi.y,2);if(typeof note==="function")note(`A freed prisoner told you about ${poi.what} to the ${dirTo(L,poi)}.`);
      await say(`${how} "Bless you! Listen: there's ${poi.what} to the ${dirTo(L,poi)}. I saw it when they dragged me in." They point the way (it's marked on your map), then flee.`,1900,true);}
    else await say(`${how} The prisoner mumbles a thank-you and flees.`,1200,true);}
  else await say(`${how} The prisoner shoves past without a word and bolts into the dark. So much for gratitude.`,1500,true);hud();}
function revealAround(cx,cy,rad){for(let y=cy-rad;y<=cy+rad;y++)for(let x=cx-rad;x<=cx+rad;x++){if(!inB(x,y)||isWall(x,y)&&!DIRS8.some(([a,b])=>inB(x+a,y+b)&&!isWall(x+a,y+b)))continue;const r=roomOf(x,y);if(r&&r.role==="secret")continue;G.explored[y][x]=true;}}
function pointOfInterest(){const L=G.party[0];const c=[];const v=G.rooms.find(r=>r.role==="vault");if(v&&!G.explored[v.cy][v.cx])c.push({x:v.cx,y:v.cy,what:"a locked treasure vault"});
  for(const o of G.objs){if(o.gone||G.explored[o.y][o.x])continue;if(o.type==="chest"&&!o.opened&&!o.vault)c.push({x:o.x,y:o.y,what:o.mimic?"a chest that \"moved on its own\"":"a treasure chest"});
    else if(o.type==="merchant")c.push({x:o.x,y:o.y,what:"a travelling merchant"});else if(o.type==="shrine"&&!o.used)c.push({x:o.x,y:o.y,what:"an old shrine"});}
  if(G.stairs&&!G.explored[G.stairs.y][G.stairs.x])c.push({x:G.stairs.x,y:G.stairs.y,what:"the ladder down"});return c.length?pick(c):null;}
function revealFloor(){for(let y=0;y<G.H;y++)for(let x=0;x<G.W;x++){if(isWall(x,y))continue;const r=roomOf(x,y);if(r&&r.role==="secret")continue;G.explored[y][x]=true;}}
{const base=decoInteract;decoInteract=async function(o){if(D2_ACT[o.type]){o.seen=true;try{await D2_ACT[o.type](o);}finally{if(o.type==="mural")o.seen=!!o.read;if(o.type==="fungus")o.seen=!!o.picked;if(mode==="explore")$("tBox").hidden=true;hud();}return;}return base(o);};}

// ---------- drawing the furniture ----------
const D2_DRAW={
  table(f,o){if(o.flipped){f(K2,1,1,14,14);f("#6a4428",2,2,12,12);f("#8a5c34",2,2,12,1);f("#4a2e1a",2,6,12,1);f("#4a2e1a",2,10,12,1);f("#5a3a22",3,-1,2,3);f("#5a3a22",11,-1,2,3);return;}
    const L=!tableSegs(o).some(s=>s.x===o.x-1&&s.y===o.y),R=!tableSegs(o).some(s=>s.x===o.x+1&&s.y===o.y);f(K2,L?1:0,4,16-(L?1:0)-(R?1:0),9);f("#7a5030",L?2:0,5,16-(L?2:0)-(R?2:0),5);f("#9a6a40",L?2:0,5,16-(L?2:0)-(R?2:0),1);
    if(L)f("#4a2e1a",2,10,2,4);if(R)f("#4a2e1a",12,10,2,4);if(Math.abs(o.x*7+o.y*3)%3===0){f("#d8d0c0",6,6,3,2);f("#a89070",10,6,2,2);}},
  pillar(f){f(K2,3,-9,10,24);f("#8a8478",4,-6,8,19);f("#a8a294",4,-6,2,19);f("#6a645a",10,-6,2,19);f("#9a9488",2,-9,12,3);f("#b8b2a4",2,-9,12,1);f("#6a645a",2,12,12,3);f(K2,7,2,1,4);f(K2,8,5,1,3);},
  fallen(f,o){if(o.vert){f(K2,4,0,8,16);f("#8a8478",5,0,6,16);f("#a8a294",5,0,2,16);f("#6a645a",9,0,2,16);f(K2,5,7,6,1);return;}
    f(K2,0,6,16,8);f("#8a8478",0,7,16,6);f("#a8a294",0,7,16,2);f("#6a645a",0,11,16,2);f(K2,7,7,1,6);},
  crate(f){f(K2,2,2,12,13);f("#9a6a3a",3,3,10,11);f("#b8844a",3,3,10,1);f("#6a4422",3,8,10,1);f("#6a4422",3,3,1,11);f("#6a4422",12,3,1,11);f("#7a5230",4,4,8,1);},
  cask(f){f(K2,1,4,14,11);f("#7a4a28",2,5,12,9);f("#9a6438",2,5,12,2);f("#4a4a50",4,5,1,9);f("#4a4a50",11,5,1,9);f("#a07040",6,8,4,3);f("#c8a040",7,12,2,2);},
  shelf(f,o){f(K2,1,-7,14,22);f("#5a3a22",2,-6,12,20);const cols=["#8a2a2a","#2a5a8a","#3a7a3a","#8a7a2a","#6a3a7a","#a06030"];
    for(const [row,hh] of [[-5,4],[0,4],[5,4],[10,3]]){f("#3a2414",2,row+hh,12,1);for(let i=0;i<6;i++)if(!o.searched||i%2)f(cols[(i+row+o.x)%6],3+i*2,row+(i%3===1?1:0),1,hh-(i%3===1?1:0));}},
  flasks(f,o,t){f(K2,1,-7,14,22);f("#4a3a2a",2,-6,12,20);const g=.55+.45*Math.sin(t/300+o.x);
    for(const [row,hh] of [[-5,4],[0,4],[5,4],[10,3]]){f("#2a2018",2,row+hh,12,1);for(let i=0;i<4;i++){const c=["#6ad060","#c84a8a","#82e0ff","#e0c040"][(i+row+o.x+40)%4];f(c,3+i*3,row+1,2,hh-1);}}
    f(`rgba(130,240,160,${g*.5})`,3,-4,10,2);},
  rack(f){f(K2,1,-3,14,17);f("#5a3a22",2,-2,2,15);f("#5a3a22",12,-2,2,15);f("#6a4428",2,1,12,2);f("#6a4428",2,9,12,1);f("#a8b0bc",5,-3,1,12);f("#d0d8e0",5,-4,1,2);f("#8a6a3a",8,-1,1,11);f("#a8b0bc",8,-2,1,2);f("#8a6a3a",10,0,1,10);},
  bed(f){f(K2,1,1,14,14);f("#5a3a22",2,2,12,12);f("#8a7a5a",3,3,10,10);f("#c8c0a8",4,3,8,3);f("#5a4a7a",3,7,10,6);f("#6a5a8a",3,7,10,1);},
  altar(f,o,t){f(K2,1,3,14,12);f("#8a8478",2,4,12,10);f("#b8b2a4",2,4,12,2);f("#a83a30",5,4,6,10);f("#d8a040",7,7,2,3);
    if(!o.used){const fl=Math.floor(t/150)%2;f("#e8e0cc",3,1,1,3);f("#e8e0cc",12,1,1,3);f("#ffd040",3,0-fl,1,1);f("#ffd040",12,0-fl,1,1);}},
  pew(f){f(K2,0,5,16,9);f("#6a4428",0,6,16,4);f("#8a5c34",0,6,16,1);f("#4a2e1a",0,10,16,3);f("#3a2414",2,13,2,1);f("#3a2414",12,13,2,1);},
  cauldron(f,o){f(K2,2,4,12,11);f("#3a3a40",3,5,10,9);f("#5a5a62",3,5,10,1);if(o.food&&!o.searched)f("#6a5a2a",4,6,8,2);f("#2a2a30",4,14,2,1);f("#2a2a30",10,14,2,1);},
  cage(f,o){f(K2,1,-5,14,20);f("rgba(10,8,12,.55)",2,-4,12,18);
    if(o.prisoner){f("#c89a70",6,0,4,3);f("#7a6a5a",5,3,6,7);f("#c89a70",4,4,1,3);f("#c89a70",11,4,1,3);f(K2,7,1,1,1);}
    else if(o.bones&&!o.searched){f("#cfc6ae",4,10,4,1);f("#e0d8c4",9,9,3,2);f("#cfc6ae",6,12,5,1);}
    for(let i=0;i<5;i++)if(!(o.open&&(i===2||i===3)))f("#8a8a90",2+i*3,-4,1,18);f("#6a6a70",1,-5,14,2);f("#6a6a70",1,13,14,2);},
  shackles(f){f("#6a6a70",4,0,1,6);f("#6a6a70",11,0,1,6);f("#8a8a90",3,6,3,2);f("#8a8a90",10,6,3,2);f("#4a4a50",5,1,1,1);f("#4a4a50",10,2,1,1);},
  straw(f){f("#9a8040",2,8,12,5);f("#c8a850",3,8,4,1);f("#d8c070",8,9,4,1);f("#b89a48",5,11,6,1);f("#8a7038",2,12,3,1);},
  toppled(f,o){if(o.vert){f(K2,3,0,10,16);f("#5a3a22",4,0,8,16);f("#8a2a2a",5,2,2,3);f("#2a5a8a",9,6,2,3);f("#3a7a3a",5,10,2,3);return;}
    f(K2,0,5,16,10);f("#5a3a22",0,6,16,8);f("#8a2a2a",2,7,3,2);f("#2a5a8a",7,9,3,2);f("#3a7a3a",11,7,3,2);f("#d8d0c0",5,12,3,1);}};
const K2="#1a1216";
{const base=drawDeco;drawDeco=function(o,sx,sy,t){const D=D2_DRAW[o.type];if(!D)return base(o,sx,sy,t);const X=Math.round(sx),Y=Math.round(sy);const f=(c,a,b,w,h)=>{ctx.fillStyle=c;ctx.fillRect(X+a,Y+b,w,h);};
  if(BLOCKERS[o.type])shadow(sx,sy,12);D(f,o,t);
  if(o.burn){const fl=Math.floor(t/90)%2;f("#ff7a1a",4,3+fl,3,4);f("#ffd040",5,4+fl,1,2);f("#ff7a1a",9,4-fl,3,4);f("#ffd040",10,5-fl,1,2);}};}

// ---------- monsters: flanking, cover, kicking over tables, morale ----------
function flankSpot(m,h,x,y){const a=unitAt(2*h.x-x,2*h.y-y);return !!(a&&a!==m&&a.side==="m"&&a.hp>0&&a.inCombat);}
function coverScore(x,y){let s=0;for(const h of heroesUp()){if(cheb(h,{x,y})>12||!los(h.x,h.y,x,y))continue;const c=coverOf(h,{x,y,side:"m"});s+=c>=5?3:c>=2?1.5:0;}return Math.min(s,6);}
async function d2PreTurn(m){if(!C||m.hp<=0||m.fleeing||m.st.asleep||m.boss)return false;
  // losing half the group shakes the nerve of anything that can feel fear
  if(m.tr.morale&&!m.halfDone){const grp=C.units.filter(u=>u.side==="m"&&u.gid===m.gid);if(grp.length>=2&&grp.filter(u=>u.hp<=0).length*2>=grp.length){m.halfDone=true;const s=saveRoll(m,"wis",isSmart(m)?12:10);
      if(!s.ok){m.fleeing=true;float(m,"FLEE!","#ffffff");await say(`Half its friends are down: the ${m.name} loses its nerve and runs! (${s.txt})`,950);return false;}}}
  if(!isSmart(m))return false;const w=weaponOf(m);
  // a clever archer next to a table kicks it over and ducks behind it
  if(!w.melee&&!m.tableDone){const tb=DIRS8.map(([dx,dy])=>objAt(m.x+dx,m.y+dy)).find(o=>o&&o.type==="table"&&!o.flipped);if(tb&&Math.random()<.65){m.tableDone=true;flipTable(tb);float(m,"COVER!","#ffffff");await say(`The ${m.name} kicks the table over and ducks behind it!`,850);}}
  // a brute next to a pillar may bring it down on the heroes
  if(m.tr.shover||m.tr.aggressive){for(const [dx,dy] of DIRS8){const p=objAt(m.x+dx,m.y+dy);if(!p||p.type!=="pillar")continue;const line=fallLine(p,dx,dy);
      if(line.some(([x,y])=>{const u=unitAt(x,y);return u&&u.side==="h"&&!u.down;})&&Math.random()<.5){await say(`The ${m.name} throws its weight against the pillar...`,800);if(rnd(20)+((m.tr.abil&&m.tr.abil.str)||0)+2>=16)await topple(p,m,dx,dy);else await say("...but it holds.",600);return true;}}}
  return false;}
{const base=monsterPreTurn;monsterPreTurn=async function(m){if(await d2PreTurn(m))return true;return base(m);};}

// ---------- foes who run away and come back ----------
function noteGrudge(m){if(!G||m.boss||m.key==="mimic"||!m.tr||!(m.tr.morale||m.tr.mind==="smart"||m.rival))return;G.grudges=G.grudges||[];
  let g=G.grudges.find(q=>q.gid===m.gid&&q.floor===G.floor&&!q.done);
  if(!g){g={gid:m.gid,floor:G.floor,list:[],at:G.steps+ri(35,90),back:Math.random()<.75,name:m.name,fac:m.fac||null,rival:m.rival||0};G.grudges.push(g);}
  g.list.push({key:m.key,cls:m.cls||null,name:m.name});
  if(m.rival){const co=(G.rivals||[]).find(c=>c.id===m.rival);if(co){co.history="fled";rememberRivals(co);}}}
// when everything still fighting is running away, the fight is over
{const base=checkEnd;checkEnd=function(){if(mode==="combat"&&C&&!C.routed&&heroesUp().length){const act=C.units.filter(u=>u.side==="m"&&u.hp>0&&u.inCombat);
    if(act.length&&act.every(u=>u.fleeing&&!u.boss)){C.routed=act.map(m=>m.name);for(const m of act){noteGrudge(m);m.inCombat=false;const k=G.mons.indexOf(m);if(k>=0)G.mons.splice(k,1);C.xp+=Math.floor(m.xp/2);}}}
  return base();};}
{const base=victory;victory=async function(){if(C&&C.routed){const n=C.routed.length;await say(`${n>1?"The rest of them scatter":"The "+C.routed[0]+" flees"} into the dark. The fight is over... but they may be back.`,1300);}return base();};}
function spawnSpots(L,minD,maxD){const out=[];for(const [k,v] of dijkstra(L,maxD+4)){const x=k%G.W,y=(k/G.W)|0;const d=cheb({x,y},L);if(d<minD||d>maxD||seen(x,y))continue;
    if(isWall(x,y)||unitAt(x,y)||blocksObj(x,y)||doorAt(x,y)||gnd(x,y)!==0)continue;out.push({x,y});}return out;}
async function grudgeTick(){const L=G.party[0];const g=(G.grudges||[]).find(q=>!q.done&&q.floor===G.floor&&G.steps>=q.at);if(!g)return false;g.done=true;if(!g.back)return false;
  const spots=spawnSpots(L,4,8);if(!spots.length){g.done=false;g.at=G.steps+15;return false;}
  const s0=pick(spots);const gid=7000+(G.gidN=(G.gidN||0)+1);const out=[];const co=g.rival?(G.rivals||[]).find(c=>c.id===g.rival):null;
  const spawn=(src,x,y)=>{let m=null;if(src.cls&&co)m=makeRival(src.cls,co,x,y);else{const t=monByKey(src.key);if(!t)return;m=mkMon(t,x,y);m.fac=g.fac;}
    m.gid=gid;m.peace=false;m.state="hunt";m.ambusher=true;m.grudge=true;G.mons.push(m);out.push(m);};
  for(const src of g.list){const p=out.length?nearFree(s0.x,s0.y):s0;if(p)spawn(src,p.x,p.y);}
  // reinforcements: friends of the same kind
  const n=ri(1,2);const grp=GROUPS.find(q=>q.list.includes(g.list[0].key));
  for(let i=0;i<n;i++){const p=nearFree(s0.x,s0.y);if(!p)break;if(co)spawn({cls:pick(["fighter","rogue","ranger","wizard","cleric"].filter(c=>S.classes.some(d=>d.id===c)))},p.x,p.y);
    else{const opts=grp?grp.list.filter(k=>monByKey(k)&&monByKey(k).from<=G.floor):[];spawn({key:opts.length?pick(opts):g.list[0].key},p.x,p.y);}}
  if(!out.length)return false;const extra=out.length-g.list.length;if(co)G.rivalPast=(G.rivalPast||[]).filter(c=>c.name!==co.name);
  await say(`Footsteps rush out of the dark to the ${dirTo(L,s0)}: the ${g.name} that fled earlier is back${extra>0?`, and it has brought ${extra===1?"a friend":extra+" friends"}`:""}!`,1400,true);
  $("tBox").hidden=true;busy=false;startCombat({extra:out,by:out});return true;}

// ---------- chance events while exploring ----------
const EVENTS=[
  {w:3,run:async L=>{const v=pick(heroesUp());const s=await dodgeRoll(v,11);cam.shake=now();for(const [dx,dy] of shuffle(DIRS8.slice()).slice(0,2)){const x=L.x+dx*2,y=L.y+dy*2;if(!isWall(x,y)&&!objAt(x,y)&&gnd(x,y)===0&&!(G.stairs&&G.stairs.x===x&&G.stairs.y===y))G.ground[y][x]=GROUND.rubble;}buildTerrain();
    await say(`The floor shudders. Dust and stones rain from the ceiling!${s.ok?` The ${v.name} dives clear. (${s.txt})`:` A rock clips the ${v.name}. (${s.txt})`}`,1400,true);if(!s.ok)await dealDamage(v,roll("1d6").total,"bludgeoning",{});}},
  {w:2,run:async L=>{const sl=G.mons.filter(m=>m.hp>0&&m.state==="sleep"&&!m.peace).sort((a,b)=>cheb(a,L)-cheb(b,L))[0];if(sl)for(const m of G.mons)if(m.gid===sl.gid)m.state="patrol";
    await say(`A scream echoes through the tunnels${sl?` from the ${dirTo(L,sl)}`:""}, then silence.${sl?" Something nearby is awake now.":""}`,1400,true);}},
  {w:2,cond:()=>G.light&&G.fuel>30,run:async()=>{burnFuel(20);await say("A cold draft gusts down the passage and the lantern gutters. Keeping it alight burns through extra oil.",1300,true);}},
  {w:2,run:async()=>{const g=ri(3,10)*G.floor;G.gold+=g;hud();await say(`Something clinks under a boot: a lost coin purse with ${g} gold.`,1200,true);}},
  {w:2,cond:()=>G.stairs&&!G.explored[G.stairs.y][G.stairs.x],run:async L=>{await say(`Chalk marks on the wall, left by another party: an arrow and the word LADDER, pointing ${dirTo(L,G.stairs)}.`,1500,true);if(typeof note==="function")note(`Chalk marks: the ladder lies ${dirTo(L,G.stairs)}.`);}},
  {w:1,run:async L=>{const h=bestAt("medicine");const big=G.mons.filter(m=>m.hp>0&&!m.peace).sort((a,b)=>b.maxHp-a.maxHp)[0];const r=await check(h,"medicine",12);
    if(r.ok){addItem("potion");hud();await say(`A wounded adventurer lies propped against the wall. The ${h.name} patches them up. (${r.txt}) "Thank you. Take this potion...${big?` and stay away from the ${dirTo(L,big)}. There's a ${big.name} there.`:""}" They limp off toward the ladder.`,2000,true);}
    else{const g=ri(4,10)*G.floor;G.gold+=g;hud();await say(`A wounded adventurer lies against the wall. The ${h.name} tries to help, but it's too late. (${r.txt}) Their purse holds ${g} gold.`,1700,true);}}},
  {w:2,cond:()=>monByKey("rat")||(G.floor>=2&&monByKey("bat")),run:async L=>{const ks=["rat"].concat(G.floor>=2?["bat"]:[]).filter(k=>monByKey(k));if(!ks.length)return;const key=pick(ks);const sp=spawnSpots(L,2,5);if(!sp.length)return;
    const s0=pick(sp);const gid=7000+(G.gidN=(G.gidN||0)+1);const out=[];for(let i=0;i<ri(2,3);i++){const p=i?nearFree(s0.x,s0.y):s0;if(!p)break;const m=mkMon(monByKey(key),p.x,p.y);m.gid=gid;m.state="hunt";G.mons.push(m);out.push(m);}
    await say(key==="bat"?"A shrieking cloud of bats pours out of a crack in the ceiling!":"The walls are squeaking... a swarm of giant rats bursts out of a crack!",1300,true);$("tBox").hidden=true;busy=false;startCombat({extra:out});}},
  {w:2,run:async()=>{wakeWanderers();await say("Marching footsteps echo somewhere close, then fade. A patrol is on the move.",1300,true);}}];
async function eventTick(){if(G.steps<(G.nextEvt||(G.nextEvt=G.steps+ri(70,130))))return false;G.nextEvt=G.steps+ri(110,200);if(Math.random()<.3)return false;
  const L=G.party[0];const r=roomOf(L.x,L.y);if(r&&r.role==="start"&&G.floor===1)return false;const ok=EVENTS.filter(e=>!e.cond||e.cond());const tot=ok.reduce((a,e)=>a+e.w,0);let q=Math.random()*tot;
  for(const e of ok){q-=e.w;if(q<=0){await e.run(L);if(mode==="explore")$("tBox").hidden=true;return true;}}return false;}

// ---------- rival adventurers ----------
const RIVAL_COS=[{name:"the Red Hands",short:"Red Hand"},{name:"the Gilded Blades",short:"Gilded"},{name:"the Mudlarks",short:"Mudlark"},{name:"the Ashwalkers",short:"Ashwalker"},{name:"the Lucky Sevens",short:"Lucky"}];
const RIVAL_LEADERS=["Vexa","Brannoc","Isolde","Garrick","Moll","Taveth","Rook","Sabine"];
const RANGED_CLS={ranger:"Longbow",wizard:"Fire Bolt",sorcerer:"Fire Bolt",warlock:"Eldritch Blast",bard:"Shortbow"};
const rivalCo=m=>(G.rivals||[]).find(c=>c.id===m.rival)||{name:"Rival adventurers",leader:"Their leader",short:"Rival"};
const rivalMembers=co=>G.mons.filter(m=>m.rival===co.id&&m.hp>0);
function rivalTraits(cls){const rg=RANGED_CLS[cls];return {atk:rg||(cls==="rogue"?"Rapier":cls==="cleric"?"Mace":cls==="barbarian"?"Greataxe":"Longsword"),
  type:rg?(rg==="Fire Bolt"?"fire":rg==="Eldritch Blast"?"force":"piercing"):cls==="cleric"?"bludgeoning":cls==="rogue"?"piercing":"slashing",spell:rg==="Fire Bolt"||rg==="Eldritch Blast",
  mind:"smart",morale:true,rival:true,abil:{str:rg||cls==="rogue"?0:2,dex:rg||cls==="rogue"?3:1,con:1,int:0,wis:1,cha:0}};}
function makeRival(cls,co,x,y){const d=S.classes.find(c=>c.id===cls);const rg=RANGED_CLS[cls];const f=G.floor;
  const t={name:`${co.short} ${d?d.name:"Sellsword"}`,hp:8+f*5,ac:rg?13:15,hit:3+Math.ceil(f/2),dmg:rg?`1d8+${1+(f>>1)}`:`1d8+${2+(f>>1)}`,range:rg?8:1,speed:6,xp:8*f,from:1,sprite:cls};
  const m=mkMon(t,x,y);m.tr=rivalTraits(cls);m.rival=co.id;m.cls=cls;m.fac="rival";m.peace=true;m.state="idle";m.gid=co.gid;m.race=pick(RACE_KEYS);return m;}
function spawnRivals(){if(G.demo||G.floor<2||Math.random()>.45)return;const sr=G.rooms.find(r=>r.role==="start")||G.rooms[0];
  const rooms=G.rooms.filter(r=>!r.role&&cheb({x:r.cx,y:r.cy},{x:sr.cx,y:sr.cy})>=9&&!G.mons.some(m=>inRoom(r,m.x,m.y)));if(!rooms.length)return;const r=pick(rooms);
  const pool=["fighter","rogue","ranger","wizard","cleric","barbarian","bard","warlock","paladin","monk","sorcerer","druid"].filter(c=>S.classes.some(d=>d.id===c));if(!pool.length)return;
  const last=G.floor>=S.dungeon.floors;const nasty=last||G.mons.some(m=>m.boss||m.maxHp>=20);const q=Math.random();
  const past=(G.rivalPast||[]).filter(c=>c.floor<G.floor);const old=past.length&&Math.random()<.6?pick(past):null;const fresh=RIVAL_COS.filter(c=>!(G.rivalPast||[]).some(p=>p.name===c.name));const C0=old||pick(fresh.length?fresh:RIVAL_COS);
  const co={id:G.floor,gid:8000+G.floor,floor:G.floor,name:C0.name,short:C0.short,leader:old?old.leader:pick(RIVAL_LEADERS),pot:0,met:false,allied:false,gone:false,
    stance:nasty?(q<.55?"teamup":q<.8?"bribe":"threat"):(q<.4?"threat":q<.7?"bribe":"teamup")};
  if(old){co.history=old.history;co.returning=true;G.rivalPast=G.rivalPast.filter(c=>c!==old);
    co.stance=old.history==="allied"?"teamup":old.history==="paid"?"bribe":old.history==="met"?co.stance:"revenge";if(old.history==="paid")co.bribe=Math.ceil((old.bribe||12*G.floor)*1.5);}
  // some "adventurers" are really bandits: a few act friendly and plan to rob you; others don't bother pretending
  if(!old){const qb=Math.random();if(qb<.18){co.bandit=true;co.treach=true;if(co.stance==="threat")co.stance=Math.random()<.5?"teamup":"bribe";}
    else if(qb<.33){co.hostile=true;co.name="a gang of bandits";co.short="Bandit";co.leader=pick(["Scar","One-Eye Jory","Mags","the Knife"]);}}
  const n=(G.floor>=4?ri(3,4):ri(2,3))+(co.stance==="revenge"?1:0);let k=0;for(const cls of shuffle(pool).slice(0,n)){const p=interiorFree(r,false);if(!p)continue;const m=makeRival(cls,co,p.x,p.y);if(!k++)m.leader=true;if(co.hostile){m.peace=false;m.state=Math.random()<.5?"idle":"patrol";}G.mons.push(m);}
  if(k){G.rivals=(G.rivals||[]).filter(c=>c.floor!==G.floor);G.rivals.push(co);}}
// rivals saved in an older save get their traits back
function relinkRivals(){for(const m of G.mons)if(m.rival&&!(m.tr&&m.tr.rival))m.tr=rivalTraits(m.cls||m.sprite);}
async function rivalMeet(co,first){const mem=rivalMembers(co);if(!mem.length)return;const f=G.floor;for(const m of mem)m.bubble=now()+900;
  const bribe=co.bribe||(co.bribe=(12+ri(0,8))*f);const st=co.stance;
  const rev=st==="revenge";if(rev)co.bribe=bribe*2;const toll=co.bribe;
  const intro=!first?`${co.leader} of ${co.name} eyes you. "Well? Changed your mind about something?"`
    :rev?`It's ${co.leader} and ${co.name} again, with fresh blood in their ranks. "${co.history==="paid"?"Your coin ran out fast. Pay again":"Remember us? We owe you one"}," ${co.leader} snarls. "${toll} gold, or we take it off your corpses."`
    :co.returning&&co.history==="paid"?`${co.leader} of ${co.name} again, grinning wider than ever. "You paid last time. Toll's gone up: ${bribe} gold."`
    :co.returning&&co.history==="allied"&&st==="teamup"?`${co.leader} of ${co.name} waves. "Partners! Fancy working together again? Same deal: half the gold."`
    :st==="threat"?`${co.leader}, leader of ${co.name}, steps out with a hand on a sword. "This floor's ours. Turn around and crawl back up, or we'll make you."`
    :st==="bribe"?`${co.leader} of ${co.name} blocks the way, grinning. "Toll's ${bribe} gold. Pay up and we'll clear off and leave this floor to you."`
    :`${co.leader}, leader of ${co.name}, raises an open hand. "Easy! There's something nasty down here, worse than both of us. Team up? We split the gold down the middle."`;
  const ps=bestAt("persuasion"),sk=bestAt("intimidation");const dcP=12+f,dcI=11+f;const easy=st==="teamup";
  const dI=dcI+(rev?3:0);const pay=rev?toll:bribe;
  const opts=[{t:`PAY THEM ${pay} GOLD`,sub:G.gold>=pay?"They say they'll leave this floor to you":`You only have ${G.gold} gold`,dis:G.gold<pay},
    {t:easy?"TEAM UP":"PROPOSE A TEAM-UP",sub:rev?"They're not interested":easy?"They fight beside you on this floor; at the ladder they take half the gold you find from now on":co.triedTeam?"They already said no":`Persuasion DC ${dcP} · ${oddsTag(ps,"persuasion",dcP)} · they'd take half the gold at the ladder`,dis:rev||!easy&&!!co.triedTeam},
    {t:"SCARE THEM OFF",sub:co.triedScare?"They're not falling for that again":`Intimidation DC ${dI} · ${oddsTag(sk,"intimidation",dI)}`,dis:!!co.triedScare},
    {t:"ATTACK THEM",sub:"They're watching you: no surprise"},
    {t:rev&&first?"REFUSE":st==="threat"&&first?"IGNORE THE THREAT":"GO YOUR SEPARATE WAYS",sub:rev&&first?"They'll attack":st==="threat"&&first?"They might not take that well":"They'll keep looting this floor: race them to the chests"},
    {t:"LIE TO THEM",sub:co.triedLie?"They won't fall for it twice":`Deception DC ${dcP+(rev?2:0)} · ${oddsTag(bestAt("deception"),"deception",dcP+(rev?2:0))} · "This floor's picked clean, and there's a troll..."`,dis:!!co.triedLie}];
  const c=await choose(intro,opts);$("tBox").hidden=true;
  if(c===0){G.gold-=pay;hud();await say(`${co.leader} pockets the coins. "Pleasure doing business." ${cap(co.name)} head off up the tunnels and are gone.`,1500,true);rivalLeave(co,"paid");}
  else if(c===1){if(!easy){co.triedTeam=true;const r=await check(ps,"persuasion",dcP);if(!r.ok){await say(`"Share with you lot? Not a chance." (${r.txt})`,1200,true);$("tBox").hidden=true;return;}
      await say(`${co.leader} thinks it over. "...Fine. Together, then. But we split the gold." (${r.txt})`,1300,true);}await rivalJoin(co);}
  else if(c===2){co.triedScare=true;const r=await check(sk,"intimidation",dI);
    if(r.ok){await say(`The ${sk.name} stares ${co.leader} down until they look away. "Not worth it. Come on." ${cap(co.name)} back off and leave the floor. (${r.txt})`,1600,true);rivalLeave(co,"scared");}
    else{await say(`${co.leader} just laughs. (${r.txt})`,1000,true);if(st==="threat"||rev){await rivalFight(co);return;}}}
  else if(c===3){await rivalFight(co);return;}
  else if(c===5){co.triedLie=true;const dv=bestAt("deception");const r=await check(dv,"deception",dcP+(rev?2:0));
    if(r.ok){await say(`The ${dv.name} spins a grim tale: the floor's been stripped bare, and something huge is nesting by the ladder. ${co.leader} goes pale. "...Right. We're off." ${cap(co.name)} leave the floor. (${r.txt})`,1800,true);rivalLeave(co,"fooled");}
    else{await say(`${co.leader} squints. "Nice try." (${r.txt})`,1000,true);if(st==="threat"||rev){await rivalFight(co);return;}}}
  else{if(rev||st==="threat"&&first&&Math.random()<.5){await say(`"Wrong answer." ${cap(co.name)} draw their weapons!`,1100,true);await rivalFight(co);return;}
    toast(`${cap(co.name)} watch you go. Best find the treasure before they do.`);}
  $("tBox").hidden=true;hud();}
async function rivalTalk(m){const co=rivalCo(m);const first=!co.met;co.met=true;await rivalMeet(co,first);}
function rivalLeave(co,why){for(const m of rivalMembers(co))G.mons.splice(G.mons.indexOf(m),1);co.gone=true;co.history=why||co.history;rememberRivals(co);fov();hud();}
// rivals who survive meeting you may turn up again, deeper down
function rememberRivals(co){if(!co.history)return;G.rivalPast=(G.rivalPast||[]).filter(c=>c.name!==co.name);G.rivalPast.push({name:co.name,short:co.short,leader:co.leader,history:co.history,bribe:co.bribe||0,floor:G.floor});}
async function rivalFight(co){const mem=rivalMembers(co);co.history="fought";for(const m of mem){m.peace=false;m.state="hunt";}$("tBox").hidden=true;busy=false;startCombat({extra:mem,bumped:mem[0]});}
async function rivalJoin(co){if(co.treach===undefined)co.treach=Math.random()<(co.stance==="teamup"&&!co.returning?.25:.15);
  if(co.treach&&!co.warned){co.warned=true;const ins=heroesUp().filter(h=>h.id!=="beast").sort((a,b)=>skillBonus(b,"insight")-skillBonus(a,"insight"))[0];
    if(ins&&passive(ins,"insight")>=12+G.floor){const c=await choose(`(Insight ${passive(ins,"insight")}) Something is off. ${co.leader}'s smile never reaches their eyes, and they keep glancing at your coin purse. The ${ins.name} doesn't trust them.`,[{t:"TEAM UP ANYWAY",sub:"Keep a hand on your sword"},{t:"CALL IT OFF",sub:"Go your separate ways"}]);
      $("tBox").hidden=true;if(c===1){toast(`You back away from the deal. ${cap(co.name)} shrug and move on.`);return;}}}
  const mem=rivalMembers(co);const names=[];
  for(const m of mem){const def=S.classes.find(c=>c.id===m.cls)||S.classes[0];const h=mkHero(def,m.race||"human");nameHero(h);if(m.leader)h.nick=co.leader;
    h.rival=co.id;h.perk=h.perk||pick(Object.keys(PERKS));if(typeof BACKGROUNDS!=="undefined"){h.bg=pick(Object.keys(BACKGROUNDS));h.bgHidden=true;}h.humanFeat=true;h.feats=[];h.picks=9;if(G.level>=3&&SUBS[h.id]){const ss=SUBS[h.id].filter(s=>s.id!=="gunslinger");if(ss.length)h.sub=pick(ss).id;}
    applyLevel(h,false);h.hp=h.maxHp;h.x=m.x;h.y=m.y;h.dx=h.x*TS;h.dy=h.y*TS;G.mons.splice(G.mons.indexOf(m),1);G.party.push(h);names.push(`${h.nick} the ${h.name}`);}
  co.allied=true;co.gold0=G.gold;co.fights=0;if(co.treach===undefined)co.treach=Math.random()<(co.stance==="teamup"&&!co.returning?.25:.15);log(`${esc(cap(co.name))} join the party for this floor: ${esc(names.join(", "))}.`,"lv");hud();
  await say(`${cap(co.name)} join you: ${names.join(", ")}. They'll fight under your command until the ladder, then take half of any gold found from now on (you have ${G.gold} now).`,2000,true);$("tBox").hidden=true;}
async function rivalSplit(){const allies=G.party.filter(h=>h.rival&&!h.dead);if(!allies.length)return;const co=(G.rivals||[]).find(c=>c.id===allies[0].rival)||{name:"your allies",leader:allies[0].nick,gold0:G.gold};
  if(G.party.every(h=>h.rival||h.dead)){for(const h of allies)delete h.rival;co.allied=false;await say(`With no one else left, ${co.leader} shrugs. "Guess we're your party now." ${cap(co.name)} stay with you.`,1600,true);$("tBox").hidden=true;return;}
  const share=Math.max(0,Math.floor((G.gold-(co.gold0||0))/2));
  if(share<=0)await say(`At the ladder, ${co.leader} shrugs. "Nothing much to split. Good fighting with you." ${cap(co.name)} head off their own way.`,1500,true);
  else{const ps=bestAt("persuasion");const c=await choose(`At the ladder, ${co.leader} holds out a hand. "Our half: ${share} gold. That was the deal."`,[{t:`PAY ${share} GOLD`,sub:"Keep your word"},{t:"REFUSE",sub:`Persuasion DC 15 · ${oddsTag(ps,"persuasion",15)} · they won't like it`}]);
    if(c!==1){G.gold-=share;co.history="allied";await say(`${co.leader} counts the coins and nods. "A pleasure. Maybe see you deeper down." ${cap(co.name)} head off their own way.`,1500,true);}
    else{const r=await check(ps,"persuasion",15);co.history="cheated";if(r.ok)await say(`The ${ps.name} talks fast and talks well. ${co.leader} spits on the floor. "Don't let us catch you down there." (${r.txt})`,1600,true);
      else{const take=Math.min(G.gold,Math.ceil(share*1.5));G.gold-=take;await say(`"Thought you might try that." Steel comes out, and ${co.name} help themselves to ${take} gold before storming off. (${r.txt})`,1700,true);}}}
  if(!co.history)co.history="allied";G.party=G.party.filter(h=>!h.rival);co.allied=false;co.gone=true;rememberRivals(co);$("tBox").hidden=true;hud();}
{const base=checkDeserters;checkDeserters=async function(){await rivalSplit();return base();};}
async function rivalTick(){const L=G.party[0];for(const co of G.rivals||[]){if(co.floor!==G.floor||co.allied||co.gone)continue;const mem=rivalMembers(co);if(!mem.length)continue;
    const calm=mem.every(m=>m.peace);
    if(calm&&!co.met&&mem.some(m=>cheb(m,L)<=6&&seen(m.x,m.y))){co.met=true;await rivalMeet(co,true);return true;}
    if(co.stance==="revenge"&&!co.met&&mem.some(m=>cheb(m,L)<=8&&seen(m.x,m.y))){co.met=true;await rivalMeet(co,true);return true;}
    if(calm&&G.steps%2===0)rivalWalk(co,mem);}
  return false;}
// a rival party heads for the nearest unopened chest, loots it, then goes after the next one (or wanders room to room)
function rivalWalk(co,mem){const lead=mem.find(m=>m.leader)||mem[0];const L=G.party[0];
  const chests=G.objs.filter(o=>o.type==="chest"&&!o.gone&&!o.opened&&!o.vault&&!(co.skip||[]).includes(o.x+","+o.y));
  let tgt=co.tgt&&chests.find(o=>o.x===co.tgt.x&&o.y===co.tgt.y);
  if(!tgt&&chests.length){tgt=chests.sort((a,b)=>cheb(a,lead)-cheb(b,lead))[0];co.stuck=0;}
  if(tgt){co.tgt={x:tgt.x,y:tgt.y};if(cheb(tgt,lead)<=1){rivalLootChest(co,mem,tgt);co.tgt=null;return;}}
  else{if(!co.tgt||cheb(co.tgt,lead)<=1){const r=pick(G.rooms.filter(r=>r.role!=="secret"));co.tgt={x:r.cx,y:r.cy};co.stuck=0;}}
  const bx=lead.x,by=lead.y;stepToward(lead,co.tgt.x,co.tgt.y);lead.dx=lead.dx;
  if(lead.x===bx&&lead.y===by){co.stuck=(co.stuck||0)+1;if(co.stuck>6){if(tgt)(co.skip=co.skip||[]).push(tgt.x+","+tgt.y);co.tgt=null;co.stuck=0;}}else{faceToward(lead,lead.x-bx,lead.y-by);}
  for(const m of mem)if(m!==lead&&cheb(m,lead)>1)stepToward(m,lead.x,lead.y);}
function rivalLootChest(co,mem,o){const L=G.party[0];const vis=seen(o.x,o.y)||mem.some(m=>seen(m.x,m.y));
  if(o.mimic){const v=mem.find(m=>cheb(m,o)<=1)||mem[0];G.mons.splice(G.mons.indexOf(v),1);makeCorpse(v);o.suspicious=true;
    if(vis)toast(`The ${v.name} opens the chest... and it OPENS BACK. A mimic! It drags them down screaming.`);else toast("A scream echoes through the dark, then a horrible crunching...");
    log(`One of ${esc(co.name)} opened a mimic${vis?"":" to the "+dirTo(L,o)}.`,"hurt");(co.skip=co.skip||[]).push(o.x+","+o.y);return;}
  o.opened=true;o.robbed=true;co.pot+=(o.loot&&o.loot.gold||0)+ri(5,15)*G.floor;o.loot={gold:0,items:[]};o.trap=null;
  if(vis){toast(`${cap(co.name)} crack open a chest right in front of you and scoop out the loot!`);log(`${esc(cap(co.name))} looted a chest.`,"miss");}
  else{toast(`Somewhere to the ${dirTo(L,o)}, a lid creaks open and someone laughs. ${cap(co.name)} are getting to the treasure first!`);log(`${esc(cap(co.name))} looted a chest to the ${dirTo(L,o)}.`,"miss");}}
// rivals fight the dungeon's monsters too
{const base=hostileFac;hostileFac=function(a,b){if(a&&b&&a!==b&&(a==="rival"||b==="rival"))return true;return base(a,b);};}
{const base=makeCorpse;makeCorpse=function(m){base(m);if(!m.rival)return;const co=(G.rivals||[]).find(c=>c.id===m.rival);const c=G.corpses[G.corpses.length-1];if(!co||!c)return;
  const alive=rivalMembers(co).filter(q=>q!==m).length;const share=alive?Math.floor(co.pot/(alive+1)):co.pot;co.pot-=share;c.loot.gold+=share+ri(3,8)*G.floor;if(Math.random()<.35){const it=rollItem(false);if(it)c.loot.items.push(it);}};}

// ---------- every step while exploring ----------
async function dodgeRoll(v,dc){if(v.side==="h"&&!v.down&&skillBonus(v,"acrobatics")>saveBonus(v,"dex")){const r=await check(v,"acrobatics",dc);return {ok:r.ok,txt:"Acrobatics: "+r.txt};}return saveRoll(v,"dex",dc);}
async function d2Step(){if(mode!=="explore"||!G||G.over||G.demo||!G.party.length)return;const L=G.party[0];relinkRivals();
  const r=roomOf(L.x,L.y);if(r&&r.theme&&!r.themeSeen){r.themeSeen=true;const T=ROOM_THEMES[r.theme];log(`You enter ${T.name}. ${T.desc}`,"miss");toast(T.desc);}
  if(await grudgeTick())return;if(mode!=="explore")return;if(await rivalTick())return;if(mode!=="explore")return;await eventTick();}
{const base=factionClash;factionClash=async function(){await base();if(mode==="explore")await d2Step();};}
// fled foes may follow the party down the ladder
{const base=genFloor;genFloor=function(){if(G&&!G.demo)for(const co of G.rivals||[])if(!co.allied&&!co.gone&&co.met&&co.floor<G.floor&&rivalMembers(co).length){co.history=co.history||"met";rememberRivals(co);}
  base();if(!G||G.demo)return;for(const g of G.grudges||[])if(!g.done&&g.floor===G.floor-1){if(g.back&&Math.random()<.4){g.floor=G.floor;g.at=G.steps+ri(40,110);}else g.done=true;}
  G.grudges=(G.grudges||[]).filter(g=>!g.done);G.rivals=(G.rivals||[]).filter(c=>c.allied||c.floor===G.floor);};}

// ---------- rival allies think for themselves in a fight ----------
{const base=heroTurn;heroTurn=function(u){base(u);if(u.rival&&mode==="combat"&&C&&C.cur===u)allyTurn(u);};}
async function allyTurn(u){busy=true;buildPanel();await wait(300);
  try{const foes=()=>G.mons.filter(m=>m.hp>0&&m.inCombat);if(!foes().length)return;const w=weaponOf(u,"main");
    const canHit=f=>inReachW(u,f,w)&&(w.melee||los(u.x,u.y,f.x,f.y));
    // a wounded ally drinks one of their own potions (they carry one each)
    if(u.hp<u.maxHp*.35&&!u.potUsed){u.potUsed=true;const h=roll("2d4+2").total;heal(u,h);await say(`${u.nick||"The "+u.name} gulps down a potion: +${h} HP.`,800);}
    if(!C||mode!=="combat"||C.cur!==u)return;
    if(!foes().some(canHit)&&C.moveLeft>0){const dist=dijkstra(u,C.moveLeft);let best=null,bs=1e9;
      for(const [k,v] of dist){const x=k%G.W,y=(k/G.W)|0;const occ=unitAt(x,y);if(occ&&occ!==u)continue;const fs=foes();const near=Math.min(...fs.map(f=>cheb(f,{x,y})));
        let sc=v.w*.3;if(w.melee)sc+=near===1?0:near*3;else{const shoot=fs.some(f=>cheb(f,{x,y})<=w.range&&los(x,y,f.x,f.y));sc+=shoot?0:20;if(near<=1)sc+=8;sc-=coverScore(x,y)*.5;}
        if(sc<bs){bs=sc;best=k;}}
      if(best!==null&&best!==u.y*G.W+u.x){const path=truncatePath(dist,pathTo(dist,best),C.moveLeft);if(path.length){await walk(u,path);if(C)C.moveLeft=0;}}}
    if(u.down||u.dead||mode!=="combat"||!C||C.cur!==u)return;
    for(let i=0;i<attacksPer(u);i++){const t=foes().filter(canHit).sort((a,b)=>a.hp-b.hp)[0];if(!t)break;await attack(u,t,w,{});if(mode!=="combat"||!C||C.cur!==u)return;}}
  finally{if(mode==="combat"&&C&&C.cur===u){busy=true;nextTurn();}}}
// ...and some were only ever using you
{const base=victory;victory=async function(){await base();if(mode!=="explore"||G.over)return;const co=(G.rivals||[]).find(c=>c.allied&&c.floor===G.floor);if(!co)return;co.fights=(co.fights||0)+1;
  const big=G.mons.some(m=>m.hp>0&&(m.boss||m.maxHp>=20));if(co.treach&&!co.betrayed&&(co.bandit||(co.fights>=2||!big)&&Math.random()<.6))await rivalBetray(co);};}
// bandits in disguise never make it to the ladder with you
{const base=stairsPrompt;stairsPrompt=async function(){const co=(G.rivals||[]).find(c=>c.allied&&c.bandit&&!c.betrayed&&c.floor===G.floor);if(co&&G.party.some(h=>h.rival===co.id&&!h.dead&&!h.down)){await rivalBetray(co);return;}return base();};}
async function rivalBetray(co){const allies=G.party.filter(h=>h.rival===co.id&&!h.dead&&!h.down);if(!allies.length)return;co.betrayed=true;co.allied=false;co.history="betrayer";const wasName=co.name;if(co.bandit){co.short="Bandit";}
  const mem=[];for(const h of allies){const m=makeRival(h.id,co,h.x,h.y);m.hp=Math.max(1,Math.round(m.maxHp*h.hp/h.maxHp));m.peace=false;m.state="hunt";m.ambusher=true;if(h.nick===co.leader)m.leader=true;mem.push(m);}
  G.party=G.party.filter(h=>h.rival!==co.id);for(const m of mem)G.mons.push(m);hud();
  await say(co.bandit?`${co.leader} whistles, and the others step away from you, weapons out. "${cap(wasName)}? Never heard of 'em. We're just bandits, friend. Hand over the gold." It was a setup all along!`:`${co.leader} wipes their blade and smiles. "Thanks for the help. We'll take it from here... and your gold with it." ${cap(co.name)} turn on you!`,1800,true);$("tBox").hidden=true;busy=false;startCombat({extra:mem,by:mem});}

// ---------- standing on tables: +2 to hit, but you're easier to hit too ----------
const tableAt=(x,y)=>G.objs.find(o=>o.type==="table"&&o.x===x&&o.y===y&&!o.gone&&!o.flipped);
const onTable=u=>!!(u&&tableAt(u.x,u.y));
{const base=enterable;enterable=function(u,x,y){{const d=doorAt(x,y);if(d&&d.barred&&!d.open)return false;}if(C&&u&&tableAt(x,y)&&!(u.tr&&u.tr.flyer)&&u.id!=="beast"&&!(u.side==="m"&&u.tr&&u.tr.mind==="beast")){const d=doorAt(x,y);return !isWall(x,y)&&!d;}return base(u,x,y);};}
{const base=stepCost;stepCost=function(u,ax,ay,bx,by){return base(u,ax,ay,bx,by)+(C&&tableAt(bx,by)&&!tableAt(ax,ay)?1:0);};}
effect("tabletop","Up on a table: +2 to hit, but enemies get +2 to hit you too",{attackMods:c=>{if(!C)return;
  if(onTable(c.a)){c.bonus+=2;c.notes.push("up on a table +2");}if(onTable(c.t)){c.bonus+=2;c.notes.push(`the ${c.t.name} is up on a table +2`);}}});
{const base=flipTable;flipTable=function(o){if(tableSegs(o).some(s=>unitAt(s.x,s.y)))return false;base(o);return true;};}
// units on a table are drawn a little higher
{const base=drawMon;drawMon=function(m,camX,camY,t){base(m,camX,camY+(onTable(m)?4:0),t);if(m.torch&&m.hp>0){const fl=Math.floor(t/110)%2;const X=Math.round(m.dx-camX)+13,Y=Math.round(m.dy-camY)-(HUMAN[m.sprite]?6:0)-(onTable(m)?4:0);
  ctx.fillStyle="#6a4428";ctx.fillRect(X,Y+3,1,5);ctx.fillStyle="#ff7a1a";ctx.fillRect(X-1,Y+fl,3,3);ctx.fillStyle="#ffd040";ctx.fillRect(X,Y+1+fl,1,1);}};}
{const base=drawHero;drawHero=function(h,camX,camY,t){base(h,camX,camY+(onTable(h)?4:0),t);};}
// nobody stays perched on furniture once the fight is over
{const base=victory;victory=async function(){for(const h of G.party)if(onTable(h)&&!h.dead){const p=nearFree(h.x,h.y);if(p){h.x=p.x;h.y=p.y;h.dx=h.x*TS;h.dy=h.y*TS;}}return base();};}

// ---------- goblins and their kind play with fire ----------
const FIREBUGS={goblin:1,archer:1,shaman:1,goblinboss:1,kobold:1,orc:1};
function fireKit(m){if(m.kit)return;m.kit=true;if(!FIREBUGS[m.key])return;const kob=m.key==="kobold";if(Math.random()<(kob?.45:.22))m.oil=1;if(Math.random()<.2)m.torch=true;}
async function monsterFire(m){if(!FIREBUGS[m.key]||m.fleeing)return false;fireKit(m);const foes=heroesUp().filter(h=>cheb(h,m)<=7);if(!foes.length)return false;
  // grab a burning torch off the wall
  if(!m.torch){const tc=G.torches.find(t=>!t.out&&cheb(t,m)<=1);if(tc&&Math.random()<.5){const target=fireTarget(m);if(target){tc.out=true;m.torch=true;computeLight();await say(`The ${m.name} yanks a burning torch off the wall!`,800);}}}
  if(m.torch){const tg=fireTarget(m);if(tg&&Math.random()<.75){m.torch=false;fx.push({type:"shot",from:{x:m.x,y:m.y},to:{x:tg.x,y:tg.y},t:now(),col:"#ff9a3a"});await wait(220);
      await say(`The ${m.name} hurls its torch ${tg.what}!`,850);if(tg.obj)setAlight(tg.obj);else igniteAt(tg.x,tg.y);computeLight();await scorch();return true;}}
  // throw a flask of oil at the heroes to make the floor a trap
  if(m.oil>0&&Math.random()<.5){const h=foes.filter(h=>cheb(h,m)>=2&&cheb(h,m)<=5&&los(m.x,m.y,h.x,h.y)&&gnd(h.x,h.y)!==GROUND.oil).sort((a,b)=>DIRS8.filter(([dx,dy])=>heroAt(b.x+dx,b.y+dy)).length-DIRS8.filter(([dx,dy])=>heroAt(a.x+dx,a.y+dy)).length)[0];
    if(h){m.oil--;await say(`The ${m.name} hurls a flask of oil at the ${h.name}!`,800);await throwOil(h.x,h.y,m);return true;}}
  return false;}
// the best thing to set on fire: oil under (or next to) heroes, or burnable furniture they are hiding behind
function fireTarget(m){let best=null,bs=0;const inR=(x,y)=>cheb(m,{x,y})<=6&&los(m.x,m.y,x,y);
  for(const k of new Set(heroesUp().flatMap(h=>[[0,0]].concat(DIRS8).map(([dx,dy])=>(h.y+dy)*G.W+h.x+dx)))){const x=k%G.W,y=(k/G.W)|0;if(!inB(x,y)||!inR(x,y))continue;
    if(gnd(x,y)===GROUND.oil&&!fireAt(x,y)){const n=heroesUp().filter(h=>cheb(h,{x,y})<=1).length-G.mons.filter(q=>q.hp>0&&cheb(q,{x,y})<=1).length;if(n>bs){bs=n;best={x,y,what:"into the oil"};}}
    const o=G.objs.find(q=>q.x===x&&q.y===y&&isWooden(q)&&!q.burn&&q.type!=="door"&&q.type!=="chest");if(o){const n=heroesUp().filter(h=>cheb(h,o)<=1).length*.6;if(n>bs){bs=n;best={x,y,obj:o,what:`at the ${BUMP_NAME[o.type]?BUMP_NAME[o.type].replace(/^An? /,"").toLowerCase():"wood"}`};}}}
  return best;}

// ---------- cornered and running: some beg for mercy ----------
async function cornered(m){if(!m.fleeing||!isSmart(m)||m.yieldAsked||!C)return false;const adj=heroesUp().filter(h=>cheb(h,m)<=1);if(!adj.length)return false;
  const dist=dijkstra(m,m.speed||6);let out=false;for(const [k] of dist){const x=k%G.W,y=(k/G.W)|0;if(!unitAt(x,y)&&heroesUp().every(h=>cheb(h,{x,y})>=3)){out=true;break;}}
  if(out||Math.random()>.65)return false;m.yieldAsked=true;float(m,"MERCY!","#ffffff");const tongue=speakerFor(m);
  const c=await choose(`Cornered, the ${m.name} throws down its weapon. "${tongue||!MLANG[m.key]?"Mercy! I yield! I'll tell you things!":"(It babbles in "+MLANG[m.key]+", hands raised.)"}"`,
    [{t:"SPARE & QUESTION",sub:"Full XP. It tells you what it knows, then runs"},{t:"FINISH IT",sub:"Full XP"},{t:"LET IT GO",sub:"Full XP, no questions"}]);
  if(c===1){approve("finish");await say("No mercy.",600);await dealDamage(m,m.hp+20,"piercing",{src:adj[0]});return true;}
  approve("spare");m.inCombat=false;m.peace=true;C.xp+=m.xp;const k=G.mons.indexOf(m);if(k>=0)G.mons.splice(k,1);
  if(c===0){if(!MLANG[m.key]||tongue)await shareSecret([m]);else await say(`Nobody in the party speaks ${MLANG[m.key]}, so its answers are just noise. It flees.`,1300);}
  else await say(`The ${m.name} scrambles away into the dark.`,900);renderStrip();return true;}
{const base=d2PreTurn;d2PreTurn=async function(m){if(!C||m.hp<=0)return false;if(await cornered(m))return true;return base(m);};}
{const base=monsterPreTurn;monsterPreTurn=async function(m){if(await base(m))return true;if(!C||m.hp<=0||m.st.asleep||m.hp<=m.maxHp*.35)return false;return monsterFire(m);};}

// ---------- the altar's blessing lasts until the next rest ----------
effect("altarbless","Blessed at an altar: +1 to hit until the next rest",{attackMods:c=>{if(G.altarBless&&c.a.side==="h"){c.bonus+=1;c.notes.push("altar blessing +1");}}});
{const base=shortRest;shortRest=async function(){await base();G.altarBless=false;};}
{const base=applyLongRest;applyLongRest=async function(camp){const out=await base(camp);G.altarBless=false;return out;};}

// ---------- barricading doors with furniture ----------
const BARRICADE={crate:"crate",cask:"cask",table:"table",bed:"bed",pew:"pew"};
function nearDoorToBar(o){return G.objs.filter(d=>d.type==="door"&&!d.gone&&!d.burnt&&!d.barred&&!d.locked&&cheb(d,o)<=4&&!unitAt(d.x,d.y)).sort((a,b)=>cheb(a,o)-cheb(b,o))[0]||null;}
async function barricade(o,d){const what=BARRICADE[o.type];if(o.type==="table")for(const s of tableSegs(o))s.gone=true;else o.gone=true;d.open=false;d.barred=what;d.wedged=true;G.steps+=6;makeNoise(d.x,d.y,6);
  computeLight();fov();await say(`You drag the ${what} across and jam it against the door. Nothing is getting through from the other side (and camping nearby will be safer).`,1500,true);}
{const base=decoInteract;decoInteract=async function(o){if(BARRICADE[o.type]&&!o.gone&&mode==="explore"){const d=nearDoorToBar(o);
    if(d){const c=await choose(`The ${BARRICADE[o.type]} could be used to barricade the door to the ${dirTo(o,d)}.`,[{t:"BARRICADE THE DOOR",sub:"Monsters can't get through it · a bit noisy"},{t:"SOMETHING ELSE",sub:"Search it, push it..."},{t:"LEAVE IT"}]);
      if(c===0){await barricade(o,d);$("tBox").hidden=true;return;}if(c!==1){$("tBox").hidden=true;return;}}}
  return base(o);};}
{const base=doorInteract;doorInteract=async function(d){if(!d.barred)return base(d);
  const c=await choose(`This door is barricaded with a ${d.barred}.`,[{t:"CLEAR THE BARRICADE",sub:"Drag it aside so the door can open"},{t:"LEAVE IT"}]);$("tBox").hidden=true;
  if(c!==0)return;const L=G.party[0];const p=nearFree(L.x,L.y);const t=Object.keys(BARRICADE).find(k=>BARRICADE[k]===d.barred);if(p&&t)G.objs.push({type:t,x:p.x,y:p.y,deco:true,tid:t==="table"?++G.tid:undefined,searched:true});
  d.barred=false;d.wedged=false;makeNoise(d.x,d.y,5);toast("You drag the barricade aside.");fov();hud();};}
{const base=drawDoor;drawDoor=function(o,sx,sy){base(o,sx,sy);if(!o.barred||o.open)return;const X=Math.round(sx),Y=Math.round(sy);ctx.fillStyle="#1a1216";ctx.fillRect(X,Y+3,16,4);ctx.fillRect(X,Y+9,16,4);
  ctx.fillStyle="#8a5c34";ctx.fillRect(X+1,Y+4,14,2);ctx.fillRect(X+1,Y+10,14,2);ctx.fillStyle="#5a3a22";ctx.fillRect(X+3,Y+4,1,2);ctx.fillRect(X+12,Y+10,1,2);};}

// ---------- hunger: sleeping on an empty stomach ----------
{const base=applyLongRest;applyLongRest=async function(camp){const hungry=!((G.bag.ration||0)>0);const before=new Map(G.party.map(h=>[h,h.hp]));const out=await base(camp);
  if(!hungry){G.hungry=0;}
  else{G.hungry=(G.hungry||0)+1;for(const h of G.party)if(!h.dead&&before.has(h))h.hp=Math.min(h.maxHp,before.get(h));out.push("No food: everyone sleeps off their tiredness, but nobody heals.");
    if(G.hungry>=2){for(const h of G.party)if(!h.dead&&!h.down){const d=Math.min(h.hp-1,ri(1,3)+G.hungry-2);if(d>0){h.hp-=d;}}out.push(`STARVING (${G.hungry} nights without food): everyone loses a little HP.`);}
    let grumble=false;for(const h of G.party)if(!h.dead&&!h.isYou&&h.trait){h.appr=Math.max(-10,(h.appr||0)-1);grumble=true;}if(grumble)out.push("Your companions grumble about their empty bellies (they like you a little less).");}
  hud();return out;};}

// ---------- a fire camp leaves its ashes behind ----------
{const base=applyLongRest;applyLongRest=async function(camp){const out=await base(camp);if(camp&&camp.type==="fire"&&!camp.atLadder&&G.party[0]){const L=G.party[0];
    const spot=[[0,0]].concat(DIRS8).map(([dx,dy])=>({x:L.x+dx,y:L.y+dy})).find(p=>!isWall(p.x,p.y)&&!objAt(p.x,p.y)&&!doorAt(p.x,p.y)&&gnd(p.x,p.y)===0&&!(G.stairs&&G.stairs.x===p.x&&G.stairs.y===p.y)&&!heroAt(p.x,p.y))||
      [[0,0]].concat(DIRS8).map(([dx,dy])=>({x:L.x+dx,y:L.y+dy})).find(p=>!isWall(p.x,p.y)&&!objAt(p.x,p.y)&&!doorAt(p.x,p.y)&&gnd(p.x,p.y)===0);
    if(spot)G.objs.push({type:"campfire",x:spot.x,y:spot.y,deco:true,seen:true,lit:G.steps,floor:G.floor});}
  return out;};}
D2_ACT.campfire=async o=>{const warm=G.steps-o.lit<120;toast(warm?"The remains of your campfire. The embers are still warm.":"A ring of stones around cold ashes: your old campsite.");};
D2_DRAW.campfire=(f,o,t)=>{const warm=G.steps-o.lit<120;f("#5a5450",3,7,10,7);f("#2a2422",4,8,8,5);f("#6a6460",3,7,2,1);f("#6a6460",11,12,2,1);f("#7a7470",8,7,2,1);
  f("#3a2a1a",5,10,6,1);f("#4a3020",6,9,1,3);f("#4a3020",9,9,1,3);f("#888078",6,11,4,1);
  if(warm){const g=.5+.5*Math.sin(t/260+o.x);f(`rgba(255,110,30,${.45+.35*g})`,6,10,1,1);f(`rgba(255,160,40,${.3+.4*(1-g)})`,8,11,1,1);f(`rgba(255,90,20,${.4*g})`,9,10,1,1);}};
BUMP_NAME.campfire="Your old campfire";

// ---------- make the toggle buttons' words always fit ----------
function fitChips(){for(const b of document.querySelectorAll("#tglRow .chip")){b.style.fontSize="";let fs=parseFloat(getComputedStyle(b).fontSize)||10;let n=0;
  while(b.scrollWidth>b.clientWidth+1&&fs>6&&n++<12){fs-=.5;b.style.fontSize=fs+"px";}
  // still too big (some phones enlarge text): use a shorter word
  if(b.scrollWidth>b.clientWidth+1){const SHORT={"LIGHT ON":"LIGHT","LIGHT OFF":"DARK","ABILITIES":"ABILITY"};if(SHORT[b.textContent])b.textContent=SHORT[b.textContent];}}}
{const base=hud;hud=function(...a){const r=base(...a);try{const L=$("tgLight");if(L&&L.dataset.t!==L.textContent){fitChips();L.dataset.t=L.textContent;}}catch(e){}return r;};}
window.addEventListener("resize",()=>setTimeout(fitChips,50));setTimeout(fitChips,300);
