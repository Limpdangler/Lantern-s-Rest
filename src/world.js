// ================= world: map, features, light, sight, paths =================
let cv=$("screen"),ctx=cv.getContext("2d");ctx.imageSmoothingEnabled=false;
const SW=240,TS=16;let SH=160;// the screen is 240 pixels wide; on a tall phone it can show more rows (SH grows)
let G=null,C=null,mode="title",busy=false,camFocus=null;
const cam={x:0,y:0,shake:0};
const fx=[];
const BLOCKERS={boulder:1,barrel:1,chest:1,shrine:1,runes:1,merchant:1,wood:1,captive:1,relic:1,coffer:1};

const heroesUp=()=>G.party.filter(h=>!h.down&&!h.dead);
const living=()=>G.party.filter(h=>!h.dead);
const monAt=(x,y)=>G.mons.find(m=>m.x===x&&m.y===y&&m.hp>0);
const heroAt=(x,y)=>G.party.find(h=>h.x===x&&h.y===y&&!h.dead);
const unitAt=(x,y)=>heroAt(x,y)||monAt(x,y)||(G.npc&&G.npc.x===x&&G.npc.y===y?G.npc:null);
const objAt=(x,y)=>G.objs.find(o=>o.x===x&&o.y===y&&!o.gone);
const doorAt=(x,y)=>G.objs.find(o=>o.type==="door"&&o.x===x&&o.y===y&&!o.gone);
const trapAt=(x,y)=>G.traps.find(t=>t.x===x&&t.y===y&&!t.done);
const inB=(x,y)=>x>=0&&y>=0&&x<G.W&&y<G.H;
const isWall=(x,y)=>!inB(x,y)||G.t[y][x]===1;
const gnd=(x,y)=>inB(x,y)?G.ground[y][x]:0;
const elevAt=(x,y)=>inB(x,y)?G.elev[y][x]:0;
const isRamp=(x,y)=>G.ramp.has(y*G.W+x);
const fireAt=(x,y)=>G.fire.has(y*G.W+x);
const litAt=(x,y)=>!S.rules.darkness||(G.lit&&G.lit[y*G.W+x]===1);
function blocksSight(x,y){if(isWall(x,y))return true;if(G.smoke&&G.smoke.has(y*G.W+x))return true;const d=doorAt(x,y);return !!(d&&!d.open);}
function blocksObj(x,y){const o=objAt(x,y);return !!(o&&BLOCKERS[o.type]);}

// ---------- layout ----------
function genMap(W,H,n){
  for(let attempt=0;attempt<40;attempt++){
    const t=Array.from({length:H},()=>Array(W).fill(1));const rooms=[];
    for(let k=0;k<600&&rooms.length<n;k++){const sz=Math.random(),big=sz<.13&&rooms.length>1,small=sz>.8;const w=big?ri(10,13):small?ri(4,5):ri(5,9),h=big?ri(7,9):small?3:ri(4,7),x=ri(2,W-w-3),y=ri(3,H-h-3);
      if(rooms.some(r=>x<=r.x+r.w+2&&x+w+2>=r.x&&y<=r.y+r.h+2&&y+h+2>=r.y))continue;
      rooms.push({x,y,w,h,cx:x+(w>>1),cy:y+(h>>1)});for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++)t[yy][xx]=0;}
    if(rooms.length<4)continue;rooms.sort((a,b)=>a.cx-b.cx);
    for(let i=1;i<rooms.length;i++){const a=rooms[i-1],b=rooms[i];
      if(Math.random()<.5){hline(t,a.cx,b.cx,a.cy);vline(t,a.cy,b.cy,b.cx);}else{vline(t,a.cy,b.cy,a.cx);hline(t,a.cx,b.cx,b.cy);}}
    return {t,rooms};}
  return null;}
function hline(t,x1,x2,y){for(let x=Math.min(x1,x2);x<=Math.max(x1,x2);x++)t[y][x]=0;}
function vline(t,y1,y2,x){for(let y=Math.min(y1,y2);y<=Math.max(y1,y2);y++)t[y][x]=0;}
const inRoom=(r,x,y)=>x>=r.x&&x<r.x+r.w&&y>=r.y&&y<r.y+r.h;
const roomOf=(x,y)=>G.rooms.find(r=>inRoom(r,x,y));
function entrances(r){const out=[];
  for(let x=r.x;x<r.x+r.w;x++){for(const y of [r.y-1,r.y+r.h])if(!isWall(x,y))out.push({x,y,door:isWall(x-1,y)&&isWall(x+1,y)&&!isWall(x,y+(y<r.y?-1:1))});}
  for(let y=r.y;y<r.y+r.h;y++){for(const x of [r.x-1,r.x+r.w])if(!isWall(x,y))out.push({x,y,door:isWall(x,y-1)&&isWall(x,y+1)&&!isWall(x+(x<r.x?-1:1),y)});}
  return out;}
function reserved(x,y){return isWall(x,y)||!!objAt(x,y)||!!unitAt(x,y)||G.items.some(i=>i.x===x&&i.y===y)||(G.stairs&&G.stairs.x===x&&G.stairs.y===y)||gnd(x,y)!==0||!!trapAt(x,y);}
function nearDoorway(x,y){return G.objs.some(o=>o.type==="door"&&cheb(o,{x,y})<=1)||G.rooms.some(r=>entrances(r).some(e=>cheb(e,{x,y})<=1));}
function interiorFree(r,blocking){const opts=[];for(let y=r.y+(blocking?1:0);y<r.y+r.h-(blocking?1:0);y++)for(let x=r.x+(blocking?1:0);x<r.x+r.w-(blocking?1:0);x++){
    if(reserved(x,y)||elevAt(x,y))continue;
    if(blocking){let ok=true;for(const [dx,dy] of DIRS8){const nx=x+dx,ny=y+dy;if(isWall(nx,ny)||blocksObj(nx,ny)||elevAt(nx,ny)){ok=false;break;}}if(!ok||nearDoorway(x,y))continue;}
    opts.push({x,y});}
  return opts.length?pick(opts):null;}

// Each run has a seed: the same seed always builds the same floors (handy for reporting bugs, or racing a friend on the same dungeon).
function seededRandom(seed){let a=seed>>>0;return function(){a=a+0x6D2B79F5>>>0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296;};}
const NATIVE_RANDOM=Math.random;
function genFloor(){if(G&&G.seed!==undefined&&!G.demo){Math.random=seededRandom(G.seed*7919+G.floor*104729);try{genFloorInner();}finally{Math.random=NATIVE_RANDOM;}return;}genFloorInner();}
function genFloorInner(){
  const D=S.dungeon;const last=G.floor>=D.floors;let m=null;
  while(!m)m=genMap(D.width,D.height,D.rooms);
  Object.assign(G,{W:D.width,H:D.height,t:m.t,rooms:m.rooms,objs:[],traps:[],torches:[],dropLights:[],fire:new Map(),items:[],npc:null,mons:[],stairs:null,tseed:undefined,entangle:new Set(),spikes:new Set(),searched:new Set(),corpses:[],searchMsg:{},sneakArea:null,pendingRest:null});
  G.elev=Array.from({length:G.H},()=>Array(G.W).fill(0));G.ground=Array.from({length:G.H},()=>Array(G.W).fill(0));G.ramp=new Set();
  G.explored=Array.from({length:G.H},()=>Array(G.W).fill(false));G.vis=new Set();G.lit=null;
  const rooms=G.rooms;const start=pick(rooms);start.role="start";
  let far=rooms[0],fd=-1;for(const r of rooms){const d=Math.abs(r.cx-start.cx)+Math.abs(r.cy-start.cy);if(d>fd){fd=d;far=r;}}far.role=last?"boss":"stairs";
  if(!last)G.stairs={x:far.cx,y:far.cy};
  // party
  for(const h of G.party){h.x=-9;h.y=-9;}
  const L=G.party[0];L.x=start.cx;L.y=start.cy;
  for(let i=1;i<G.party.length;i++){const p=nearFree(start.cx,start.cy);G.party[i].x=p.x;G.party[i].y=p.y;}
  // doors
  for(const r of rooms)for(const e of entrances(r))if(e.door&&!doorAt(e.x,e.y)&&Math.random()<.3){const iron=G.floor>=2&&Math.random()<.25;G.objs.push({type:"door",x:e.x,y:e.y,open:false,locked:!iron&&Math.random()<.18,iron});}
  // vault: a room whose every entrance can hold a door
  // ...and only a dead end: locking it must never cut the way to the ladder (or any other room)
  const deadEnd=v=>{const blocked=new Set(entrances(v).map(e=>e.y*G.W+e.x));const W2=G.W;const s0=start.cy*W2+start.cx;const seenT=new Set([s0]);const q=[s0];
    while(q.length){const c=q.pop();const cx=c%W2,cy=(c/W2)|0;for(const [dx,dy] of DIRS4){const nx=cx+dx,ny=cy+dy,k=ny*W2+nx;if(seenT.has(k)||blocked.has(k)||isWall(nx,ny))continue;seenT.add(k);q.push(k);}}
    return rooms.every(r=>r===v||seenT.has(r.cy*W2+r.cx));};
  const vc=rooms.filter(r=>!r.role&&entrances(r).length>0&&entrances(r).every(e=>e.door)&&deadEnd(r));
  if(vc.length&&G.floor>=1){const v=pick(vc);v.role="vault";for(const e of entrances(v)){let d=doorAt(e.x,e.y);if(!d){d={type:"door",x:e.x,y:e.y,open:false};G.objs.push(d);}d.locked=true;d.iron=Math.random()<.6;}}
  trySecretRoom();
  // features per room
  const hz=D.hazards/2;
  for(const r of rooms){
    if(r.role!=="start"&&r.w>=7&&r.h>=5&&Math.random()<.35)placeLedge(r);
    if(r.role==="start")continue;
    if(Math.random()<.3)blob(r,GROUND.water,ri(3,6));
    if(Math.random()<.3)scatter(r,GROUND.rubble,ri(2,4));
    if(Math.random()<.12*hz)blob(r,GROUND.oil,ri(1,3));
    if(Math.random()<.08*hz)blob(r,GROUND.acid,ri(1,2));
    if(Math.random()<.12*hz)scatter(r,GROUND.crack,ri(1,2));
    if(Math.random()<.15*hz){const p=interiorFree(r,true);if(p)G.objs.push({type:"barrel",x:p.x,y:p.y,hp:4});}
    if(Math.random()<.45){const n=ri(1,3);for(let i=0;i<n;i++){const p=interiorFree(r,true);if(p)G.objs.push({type:"boulder",x:p.x,y:p.y});}}
  }
  // light: torches on the wall above some rooms (start, boss and vault rooms are always lit)
  for(const r of rooms){if(!(r.role==="start"||r.role==="boss"||r.role==="vault"||Math.random()<.45))continue;
    const xs=r.w>=7?[r.x+1,r.x+r.w-2]:[r.cx];for(const x of xs)if(isWall(x,r.y-1)&&!isWall(x,r.y))G.torches.push({x,y:r.y-1,lx:x,ly:r.y});}
  // stairs room ledge etc done; events
  const normal=rooms.filter(r=>!r.role);
  const place=(r,obj)=>{const p=interiorFree(r,true);if(p){obj.x=p.x;obj.y=p.y;G.objs.push(obj);return obj;}return null;};
  if(normal.length&&Math.random()<.4)place(pick(normal),{type:"shrine",used:false});
  if(normal.length&&Math.random()<.35)place(pick(normal),{type:"runes",used:false});
  if(!last&&normal.length&&Math.random()<.45)place(pick(normal),{type:"merchant",stock:shopStock()});
  const nChests=1+(Math.random()<.5?1:0);for(let i=0;i<nChests;i++){const r=pick(rooms.filter(r=>r.role!=="start"&&r.role!=="vault"));
    const ch=place(r,{type:"chest",loot:rollLoot(false),mimic:G.floor>=2&&Math.random()<.15,opened:false});if(ch&&!ch.mimic&&Math.random()<.25)ch.trap={dc:12+Math.floor(G.floor/2)};}
  // firewood piles
  const nWood=ri(1,2);for(let i=0;i<nWood&&normal.length;i++)place(pick(normal),{type:"wood"});
  const vault=rooms.find(r=>r.role==="vault");if(vault)place(vault,{type:"chest",loot:rollLoot(true),opened:false,vault:true});
  // recruit
  if(G.party.filter(h=>h.id!=="beast").length<D.party){const opts=S.classes.slice();// any class at all, duplicates included
    const rr=rooms.filter(r=>!r.role);if(opts.length&&rr.length){const p=interiorFree(pick(rr),false);if(p)G.npc={side:"n",def:pick(opts),race:pick(RACE_KEYS),x:p.x,y:p.y};}}
  // monsters in themed groups
  let left=D.monsters+D.monstersPerFloor*(G.floor-1);const mrooms=rooms.filter(r=>r.role!=="start"&&r.role!=="boss");let gid=0;
  if(last){const b=mkMon(S.boss,far.cx,far.cy,true);b.gid=++gid;G.mons.push(b);for(let i=0;i<2;i++){const p=nearFree(far.cx,far.cy);if(p){const e=mkMon(monByKey(pick(["orc","goblin","archer"]))||S.monsters[2],p.x,p.y);e.gid=gid;G.mons.push(e);}}}
  let guard=0;while(left>0&&mrooms.length&&guard++<50){const r=pick(mrooms);const themes=GROUPS.filter(g=>g.from<=G.floor&&g.list.some(k=>monByKey(k)&&monByKey(k).from<=G.floor));if(!themes.length)break;
    const th=pickGroup(themes);const n=Math.min(left,ri(1,3));gid++;const parley=th.parley&&Math.random()<.35;const asleep=Math.random()<.6;
    const members=[];for(let i=0;i<n;i++){let k=th.list[i%th.list.length];if(!monByKey(k)||monByKey(k).from>G.floor)k=th.list.find(q=>monByKey(q)&&monByKey(q).from<=G.floor);members.push(k);}
    if(th.lead){for(const [k,f] of th.lead)if(G.floor>=f&&monByKey(k)&&Math.random()<.5){members.push(k);break;}}
    const lurk=!asleep&&!parley&&Math.random()<.45&&members.every(k=>MTRAITS[k]&&MTRAITS[k].stealthy);const treach=parley&&Math.random()<.3;
    for(const k of members){const p=interiorFree(r,false);if(!p)continue;const mm=mkMon(monByKey(k),p.x,p.y);mm.gid=gid;mm.fac=th.fac;mm.state=asleep?"sleep":"idle";if(parley){mm.parley=gid;mm.treach=treach;}
      if(lurk){mm.lurk=true;mm.hide=rnd(20)+monStealth(mm);}G.mons.push(mm);}
    left-=n;}
  // vault key
  if(vault){const holders=G.mons.filter(m=>!m.boss&&!(roomOf(m.x,m.y)&&roomOf(m.x,m.y).role==="vault"));const ch=G.objs.filter(o=>o.type==="chest"&&!o.vault&&!o.mimic);
    if(holders.length&&Math.random()<.6)pick(holders).hasKey=true;else if(ch.length)pick(ch).loot.items.push("key");else{const p=interiorFree(pick(normal.length?normal:rooms),false);if(p)G.items.push({x:p.x,y:p.y,item:"key"});}}
  // floor pickups
  for(let i=0;i<D.potions;i++){const p=interiorFree(pick(rooms),false);if(p)G.items.push({x:p.x,y:p.y,item:"potion"});}
  for(let i=0;i<D.gold;i++){const p=interiorFree(pick(rooms),false);if(p)G.items.push({x:p.x,y:p.y,gold:ri(4,12)*G.floor});}
  if(Math.random()<.5){const p=interiorFree(pick(rooms),false);if(p)G.items.push({x:p.x,y:p.y,item:pick(["torch","oil"])});}
  // traps: corridors and rooms (never the start room or next to the stairs)
  const nT=D.traps+G.floor-1;const tw=Object.entries(TRAPS);const tot=tw.reduce((a,[,v])=>a+v.w,0);
  for(let i=0,g2=0;i<nT&&g2<300;g2++){const x=ri(1,G.W-2),y=ri(1,G.H-2);if(isWall(x,y)||reserved(x,y)||doorAt(x,y)||elevAt(x,y))continue;
    const rr=roomOf(x,y);if(rr&&(rr.role==="start"))continue;if(cheb({x,y},start)<4)continue;if(G.stairs&&cheb({x,y},G.stairs)<=1)continue;
    let q=Math.random()*tot,type="darts";for(const [k,v] of tw){q-=v.w;if(q<=0){type=k;break;}}
    G.traps.push({x,y,type,dc:11+Math.ceil(G.floor/2),found:false,done:false});i++;}
  G.pal=palFor(G.floor,last);floorExtras(last);
  for(const h of G.party){h.dx=h.x*TS;h.dy=h.y*TS;}
  buildTerrain();computeLight();fov();}
function nearFree(x0,y0){for(let r=1;r<8;r++)for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){const x=x0+dx,y=y0+dy;if(!isWall(x,y)&&!unitAt(x,y)&&!blocksObj(x,y)&&!doorAt(x,y)&&gnd(x,y)===0&&!(G.stairs&&G.stairs.x===x&&G.stairs.y===y))return {x,y};}return null;}
function monByKey(k){return S.monsters.find(m=>m.sprite===k);}
function blob(r,code,n){const p=interiorFree(r,false);if(!p)return;const cells=[p];G.ground[p.y][p.x]=code;
  for(let k=0;k<40&&cells.length<n;k++){const c=pick(cells);const [dx,dy]=pick(DIRS4);const x=c.x+dx,y=c.y+dy;
    if(!inRoom(r,x,y)||reserved(x,y)||elevAt(x,y)||nearDoorway(x,y))continue;G.ground[y][x]=code;cells.push({x,y});}}
function scatter(r,code,n){for(let i=0;i<n;i++){const p=interiorFree(r,false);if(p&&!nearDoorway(p.x,p.y))G.ground[p.y][p.x]=code;}}
function placeLedge(r){const len=ri(3,Math.min(5,r.w-2));const a=r.x+ri(0,r.w-len);const tiles=[];
  for(let y=r.y;y<r.y+2;y++)for(let x=a;x<a+len;x++)tiles.push({x,y});
  const ents=entrances(r);if(tiles.some(t=>ents.some(e=>cheb(e,t)<=1)||reserved(t.x,t.y)))return;
  for(const t of tiles)G.elev[t.y][t.x]=1;
  const rx=Math.random()<.5?a:a+len-1;G.ramp.add((r.y+1)*G.W+rx);}
function trySecretRoom(){for(let k=0;k<40;k++){const r=pick(G.rooms);const side=ri(0,3);let dx=0,dy=0,dxp,dyp;
    let wx,wy;if(side===0){wx=ri(r.x+1,r.x+r.w-2);wy=r.y-1;dy=-1;}else if(side===1){wx=ri(r.x+1,r.x+r.w-2);wy=r.y+r.h;dy=1;}else if(side===2){wy=ri(r.y+1,r.y+r.h-2);wx=r.x-1;dx=-1;}else{wy=ri(r.y+1,r.y+r.h-2);wx=r.x+r.w;dx=1;}
    // 3x3 room centred two steps beyond the wall
    const cx=wx+dx*2,cy=wy+dy*2;let ok=true;for(let y=cy-2;y<=cy+2&&ok;y++)for(let x=cx-2;x<=cx+2;x++){if(x<1||y<1||x>=G.W-1||y>=G.H-1||G.t[y][x]!==1){ok=false;break;}}
    if(!ok||G.t[wy][wx]!==1)continue;
    for(let y=cy-1;y<=cy+1;y++)for(let x=cx-1;x<=cx+1;x++)G.t[y][x]=0;
    const sr={x:cx-1,y:cy-1,w:3,h:3,cx,cy,role:"secret"};G.rooms.push(sr);
    G.secret={x:wx,y:wy,found:false};G.objs.push({type:"chest",x:cx,y:cy,loot:rollLoot(true),opened:false,vault:true});return;}}
function revealSecret(){const s=G.secret;if(!s||s.found)return;s.found=true;G.t[s.y][s.x]=0;G.objs.push({type:"door",x:s.x,y:s.y,open:false,locked:false,wasSecret:true});buildTerrain();computeLight();fov();}

// ---------- loot ----------
function rollItem(rich){const pool=Object.entries(ITEMS).filter(([k,v])=>v.floor<=G.floor&&v.w>0&&(rich?true:v.kind!=="gear"||Math.random()<.35));
  const tot=pool.reduce((a,[,v])=>a+v.w*(rich&&v.kind==="gear"?3:1),0);let q=Math.random()*tot;for(const [k,v] of pool){q-=v.w*(rich&&v.kind==="gear"?3:1);if(q<=0)return k;}return "potion";}
function rollLoot(rich){const items=[];const n=rich?2:ri(1,2);for(let i=0;i<n;i++)items.push(rollItem(rich));
  if(rich&&!items.some(k=>ITEMS[k].kind==="gear")){const g=Object.keys(ITEMS).filter(k=>ITEMS[k].kind==="gear"&&ITEMS[k].floor<=G.floor);items[0]=pick(g);}
  return {gold:ri(8,20)*G.floor*(rich?2:1),items};}
function shopStock(){const s=["potion","potion","oil","oil","torch","rope","firewood","firewood","arrows","arrows","flashpowder","antitoxin","scroll_cure","scroll_mm","shield"];if(G.party.some(h=>h.sub==="gunslinger"))s.push("bullets","bullets");if(!(G.lore&&G.lore.forage)&&Math.random()<.5)s.push("almanac");if(G.floor>=3)s.push("gpotion","scroll_fb");
  const gear=Object.keys(ITEMS).filter(k=>ITEMS[k].kind==="gear"&&ITEMS[k].floor<=G.floor);shuffle(gear);return s.concat(gear.slice(0,2));}

// ---------- light & sight ----------
function los(x0,y0,x1,y1){let dx=Math.abs(x1-x0),dy=-Math.abs(y1-y0),sx=x0<x1?1:-1,sy=y0<y1?1:-1,err=dx+dy,x=x0,y=y0;
  for(let g=0;g<200;g++){if(x===x1&&y===y1)return true;if(!(x===x0&&y===y0)&&blocksSight(x,y))return false;const e2=2*err;if(e2>=dy){err+=dy;x+=sx;}if(e2<=dx){err+=dx;y+=sy;}}return false;}
function lightSources(){const s=[];for(const t of G.torches)if(!t.out)s.push({x:t.lx,y:t.ly,r:5});for(const l of G.dropLights)s.push({x:l.x,y:l.y,r:3});
  for(const k of G.fire.keys())s.push({x:k%G.W,y:(k/G.W)|0,r:2});
  const L=G.party.find(h=>!h.dead);const on=G.demo||G.light===undefined||(G.light&&G.fuel>0);if(L&&on)s.push({x:L.x,y:L.y,r:G.lightR||4});
  if(on)for(const h of G.party)if(!h.dead&&!h.down&&h.id==="druid"&&!h.wild)s.push({x:h.x,y:h.y,r:2});
  return s;}
function computeLight(){const N=G.W*G.H;G.lit=new Uint8Array(N);if(!S.rules.darkness){G.lit.fill(1);return;}
  for(const s of lightSources())for(let dy=-s.r;dy<=s.r;dy++)for(let dx=-s.r;dx<=s.r;dx++){if(dx*dx+dy*dy>s.r*s.r+1)continue;const x=s.x+dx,y=s.y+dy;if(!inB(x,y))continue;const k=y*G.W+x;if(G.lit[k])continue;if(los(s.x,s.y,x,y))G.lit[k]=1;}}
function owlSight(){if(!G.owl||G.owl.until<=G.steps)return;const o=G.owl;for(let y=o.y-6;y<=o.y+6;y++)for(let x=o.x-6;x<=o.x+6;x++){if(x<0||y<0||x>=G.W||y>=G.H)continue;if((x-o.x)**2+(y-o.y)**2>40)continue;if(los(o.x,o.y,x,y)){G.vis.add(y*G.W+x);G.explored[y][x]=true;}}}
function fov(){computeLight();G.vis.clear();const r=S.dungeon.sight;
  for(const h of G.party){if(h.dead||h.down)continue;
    for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){if(dx*dx+dy*dy>r*r+r)continue;const x=h.x+dx,y=h.y+dy;if(!inB(x,y))continue;const k=y*G.W+x;
      if(G.vis.has(k))continue;const dv=heroDV(h)&&dx*dx+dy*dy<=37;if((G.lit[k]||dv||Math.max(Math.abs(dx),Math.abs(dy))<=1)&&los(h.x,h.y,x,y)){G.vis.add(k);G.explored[y][x]=true;}}}owlSight();}
const seen=(x,y)=>G.vis.has(y*G.W+x);
function monsterSees(m,h){if(h.dead)return false;const d=cheb(m,h);const range=m.state==="sleep"?2:8;if(d>range||!los(m.x,m.y,h.x,h.y))return false;
  if(h.st&&h.st.hidden)return false;if(h.sub==="gloom"&&!litAt(h.x,h.y)&&d>1)return false;return m.tr.dv||litAt(h.x,h.y)||d<=1;}
function canSee(a,t){ // can attacker a see target t well enough to attack normally?
  if(cheb(a,t)>1&&!los(a.x,a.y,t.x,t.y))return false;
  if(a.side==="m")return (t.sub==="gloom"&&!litAt(t.x,t.y)&&cheb(a,t)>1)?false:(a.tr.dv||litAt(t.x,t.y));
  return litAt(t.x,t.y)||(heroDV(a)&&cheb(a,t)<=6)||cheb(a,t)<=1||(a.wild&&cheb(a,t)<=6);}

// ---------- movement & paths ----------
function canOpenDoors(u){return u.side==="h"||(u.tr&&u.tr.mind==="smart");}
function enterable(u,x,y){if(isWall(x,y))return false;if(gnd(x,y)===GROUND.deep&&tooHeavyToSwim(u))return false;const d=doorAt(x,y);if(d&&!d.open&&(d.locked||!canOpenDoors(u)||(d.wedged&&u.side==="m")))return false;if(blocksObj(x,y))return false;if(G.npc&&G.npc.x===x&&G.npc.y===y)return false;return true;}
function stepCost(u,ax,ay,bx,by){let c=1;const g=gnd(bx,by);if(g===GROUND.water||g===GROUND.rubble)c++;if(g===GROUND.deep)c+=2;if(G.entangle.has(by*G.W+bx))c++;
  if(elevAt(bx,by)>elevAt(ax,ay)&&!isRamp(bx,by)&&!isRamp(ax,ay))c+=2;const d=doorAt(bx,by);if(d&&!d.open)c++;return c;}
function hazardPenalty(u,x,y){if(u.side==="h")return 0;const mind=u.tr.mind;let p=0;const g=gnd(x,y);if(g===GROUND.deep)p+=3;
  if(fireAt(x,y))p+=mind==="mindless"?0:10;if(g===GROUND.acid)p+=mind==="mindless"?0:8;if(g===GROUND.oil)p+=mind==="smart"?2:0;if(g===GROUND.crack)p+=mind==="smart"?3:0;
  const t=trapAt(x,y);if(t&&!t.ours&&(mind==="smart"||t.found&&mind==="beast"))p+=40;return p;}
function dijkstra(u,maxCost,opts){opts=opts||{};const W=G.W,start=u.y*W+u.x;const best=new Map([[start,{c:0,w:0,p:-1}]]);const h=new Heap();h.push(start,0);
  while(h.size){const cur=h.pop();const node=best.get(cur);const cx=cur%W,cy=(cur/W)|0;
    for(const [ax,ay] of DIRS8){const nx=cx+ax,ny=cy+ay;if(!enterable(u,nx,ny))continue;if(ax&&ay&&(isWall(cx+ax,cy)||isWall(cx,cy+ay)))continue;
      const o=unitAt(nx,ny);if(o&&o!==u){if(o.side==="n")continue;if(o.side!==u.side&&!(o.side==="h"&&o.down&&u.side==="h"))continue;if(o.side==="m"&&u.side==="m"&&(o.team||"d")!==(u.team||"d"))continue;if(u.side==="h"&&o.side==="m")continue;}
      if(u.side==="h"&&!opts.allowTraps){const t=trapAt(nx,ny);if(t&&t.found)continue;}
      const sc=stepCost(u,cx,cy,nx,ny);const c=node.c+sc;if(c>maxCost)continue;const w=node.w+sc+hazardPenalty(u,nx,ny)+(opts.penalty?opts.penalty(nx,ny):0);
      const k=ny*W+nx;const prev=best.get(k);if(prev&&prev.w<=w)continue;best.set(k,{c,w,p:cur});h.push(k,w);}}
  return best;}
function pathTo(dist,k){const p=[];while(k!==-1&&dist.has(k)){p.unshift(k);k=dist.get(k).p;}return p.slice(1);}

function setScreenRows(h){h=Math.max(160,Math.min(420,Math.round(h)));if(h===SH)return;SH=h;cv.height=SH;ctx.imageSmoothingEnabled=false;cv.style.aspectRatio=`240/${SH}`;}
