// ================= hidden places behind cracked walls =================
// ---------- new creatures ----------
const sprite16=draw=>()=>{const c=document.createElement("canvas");c.width=c.height=16;const x=c.getContext("2d");const f=(col,a,b,w,h)=>{x.fillStyle=col;x.fillRect(a,b,w,h);};draw(f,x);return c;};
MON2.lurker=sprite16(f=>{const K="#10181a";f(K,4,3,8,12);f("#2a5a5a",5,4,6,10);f("#3a7a6a",5,4,2,10);f("#1a3a3a",9,6,2,8);f("#e8e070",6,6,1,1);f("#e8e070",9,6,1,1);f(K,6,9,4,1);f("#f0f0e0",6,10,1,1);f("#f0f0e0",9,10,1,1);f("rgba(120,180,220,.55)",1,13,14,3);});
MON2.vampire=sprite16(f=>{const K="#140a10";f(K,3,1,10,15);f("#3a0a1a",3,6,10,10);f("#6a1028",4,7,3,8);f("#6a1028",9,7,3,8);f("#e8e0e8",5,2,6,5);f("#c0b8c8",5,6,6,1);f("#e02020",6,4,1,1);f("#e02020",9,4,1,1);f("#ffffff",7,6,1,1);f("#ffffff",8,6,1,1);f("#1a1018",5,1,6,2);f("#d8d0dc",7,8,2,6);});
MON2.ghost=sprite16(f=>{f("rgba(210,230,255,.55)",4,2,8,11);f("rgba(210,230,255,.45)",3,5,10,6);f("rgba(210,230,255,.35)",3,12,2,3);f("rgba(210,230,255,.35)",7,12,2,4);f("rgba(210,230,255,.35)",11,12,2,3);f("#1a2a4a",6,5,1,2);f("#1a2a4a",9,5,1,2);f("rgba(20,40,80,.6)",7,9,2,2);});
MON2.tentacle=sprite16(f=>{const K="#140a18";f(K,6,0,5,16);f("#6a2a7a",7,1,3,15);f("#9a4aaa",7,1,1,15);f("#d890e0",9,3,1,1);f("#d890e0",9,7,1,1);f("#d890e0",9,11,1,1);f(K,4,12,9,4);f("#4a1a5a",5,13,7,3);f("#6a2a7a",10,1,2,2);});
Object.assign(MTRAITS,{
  lurker:{atk:"Bite",type:"piercing",dv:true,mind:"beast",stealthy:true,abil:{str:3,dex:1,con:2,int:-4,wis:0,cha:-4}},
  vampire:{atk:"Claws",type:"slashing",dv:true,undead:true,resist:["necrotic"],immune:["poison"],mind:"smart",abil:{str:3,dex:3,con:3,int:0,wis:0,cha:1}},
  ghost:{atk:"Withering Touch",type:"necrotic",dv:true,undead:true,flyer:true,resist:["piercing","slashing","bludgeoning","acid","fire","lightning"],immune:["poison","necrotic"],mind:"mindless",abil:{str:-2,dex:1,con:0,int:0,wis:0,cha:3}},
  tentacle:{atk:"Lash",type:"bludgeoning",mind:"mindless",abil:{str:3,dex:1,con:2,int:-5,wis:-2,cha:-5}}});
const NEW_MONS={lurker:{name:"Pool Lurker",hp:22,ac:13,hit:5,dmg:"2d6+2",range:1,speed:5,xp:20,from:1,sprite:"lurker"},
  vampire:{name:"Vampire Spawn",hp:38,ac:15,hit:6,dmg:"2d6+3",range:1,speed:6,xp:60,from:1,sprite:"vampire"},
  ghost:{name:"Ghost",hp:28,ac:11,hit:5,dmg:"2d8",range:1,speed:6,xp:40,from:1,sprite:"ghost"},
  tentacle:{name:"Writhing Tentacle",hp:16,ac:12,hit:5,dmg:"1d8+2",range:1,speed:0,xp:12,from:1,sprite:"tentacle"}};
const monT=k=>NEW_MONS[k]||monByKey(k);
effect("tentacleGrab","Tentacles grab and hold whoever they hit",{onHit:async c=>{if(c.a&&c.a.key==="tentacle"&&c.t&&c.t.side==="h"&&!c.t.st.restrained&&!c.t.down){c.t.st.restrained={dc:12,by:"tentacle"};float(c.t,"GRABBED","#d890e0");}}});
// ---------- the walls with cracks ----------
const HIDDEN_KINDS=[["loot",3],["nest",3],["pool",3],["hideout",2],["lush",3],["forgotten",3],["bigpit",2],["crypt",3],["altar",2],["trapped",2],["tentacles",2],["office",1]];
Object.assign(ROOM_THEMES,{
  h_loot:{name:"a hidden treasure room",desc:"A hidden room, sealed off for who knows how long. Something glitters in the dark."},
  h_nest:{name:"a beast's nest",desc:"A reeking den of bones, fur and droppings. Something lives here."},
  h_pool:{name:"a hidden grotto",desc:"A still black pool fills most of this cave. Water drips from the ceiling."},
  h_hideout:{name:"a goblin hideout",desc:"Bedrolls, stolen trinkets and the stink of goblin. This is someone's secret hideout."},
  h_lush:{name:"a lush cave",desc:"Moss and glowing mushrooms carpet this damp little cave. It smells green and alive."},
  h_forgotten:{name:"a forgotten room",desc:"The doorway caved in long ago. Dust lies thick on everything; nobody has been here in an age."},
  h_bigpit:{name:"a sinkhole",desc:"Most of this cave is a single enormous pit. A narrow lip of rock runs along the edge."},
  h_crypt:{name:"a hidden crypt",desc:"Rows of old coffins, their lids carved with faces worn smooth. The air is cold."},
  h_altar:{name:"a dark shrine",desc:"Red runes form a star on the floor, ringed by skulls and unlit black candles. On the altar, something waits."},
  h_trapped:{name:"a sealed chamber",desc:"Faces turn towards your light: people have been trapped in here!"},
  h_tentacles:{name:"a writhing chamber",desc:"The floor is split with cracks, and from them rise slick purple tentacles, writhing and reaching."},
  h_office:{name:"...an office?",desc:"Damp yellow carpet. Yellow wallpaper. The buzz of lights you can't see. Endless, empty, wrong. This place should not exist."}});
function carveHidden(){if(G.demo)return;let n=Math.random()<.65?1:0;if(Math.random()<.3)n++;const kinds=[];
  for(let i=0;i<n;i++){for(let k=0;k<80;k++){const r=pick(G.rooms.filter(r=>!r.role||r.role==="stairs"));if(!r)return;const side=ri(0,3);const [dx,dy]=[[0,-1],[0,1],[-1,0],[1,0]][side];
      let wx,wy;if(dy){wx=ri(r.x+1,r.x+r.w-2);wy=dy<0?r.y-1:r.y+r.h;}else{wy=ri(r.y+1,r.y+r.h-2);wx=dx<0?r.x-1:r.x+r.w;}
      const px=Math.abs(dy),py=Math.abs(dx);const depth=ri(3,5),width=ri(4,7),off=ri(1,width-2);let ok=true;
      for(let d=0;d<=depth+1&&ok;d++)for(let s=-off-1;s<=width-off;s++){const x=wx+dx*d+px*s,y=wy+dy*d+py*s;if(x<1||y<1||x>G.W-2||y>G.H-2||G.t[y][x]!==1){ok=false;break;}}
      if(!ok||objAt(wx,wy)||doorAt(wx,wy))continue;
      const tiles=[];for(let d=1;d<=depth;d++)for(let s=-off;s<width-off;s++){const x=wx+dx*d+px*s,y=wy+dy*d+py*s;G.t[y][x]=0;tiles.push({x,y});}
      const xs=tiles.map(t=>t.x),ys=tiles.map(t=>t.y);const room={x:Math.min(...xs),y:Math.min(...ys),w:Math.max(...xs)-Math.min(...xs)+1,h:Math.max(...ys)-Math.min(...ys)+1,role:"secret",hidden:true};room.cx=room.x+(room.w>>1);room.cy=room.y+(room.h>>1);
      const fresh=HIDDEN_KINDS.filter(([k])=>!kinds.includes(k));const tot=fresh.reduce((a,[,w])=>a+w,0);let q=Math.random()*tot,kind=fresh[0][0];for(const [kk,w] of fresh){q-=w;if(q<=0){kind=kk;break;}}kinds.push(kind);
      room.theme="h_"+kind;G.rooms.push(room);G.objs.push({type:"crack",x:wx,y:wy,deco:true,found:false,dc:12+Math.floor(G.floor/2),kind,toward:{dx,dy}});
      fillHidden(kind,room,tiles,{x:wx+dx,y:wy+dy});break;}}}
function fillHidden(kind,r,tiles,door){const f=G.floor;const gid=9500+(G.hidN=(G.hidN||0)+1);const free=()=>{const c=shuffle(tiles.slice()).find(t=>!reserved(t.x,t.y)&&!(t.x===door.x&&t.y===door.y));return c||null;};
  const deco=(type,extra)=>{const p=free();if(p)G.objs.push(Object.assign({type,x:p.x,y:p.y,deco:true},extra||{}));return p;};
  const mon=(key,extra)=>{const t=monT(key);if(!t)return null;const p=free();if(!p)return null;const m=mkMon(t,p.x,p.y);m.gid=gid;m.state="sleep";Object.assign(m,extra||{});G.mons.push(m);return m;};
  const chest=(rich)=>{const p=free();if(p){const c={type:"chest",x:p.x,y:p.y,loot:rollLoot(rich),opened:false};G.objs.push(c);kitChest(c);}};
  if(kind==="loot"){chest(true);if(Math.random()<.6)chest(false);for(let i=0;i<ri(1,3);i++){const p=free();if(p)G.items.push({x:p.x,y:p.y,gold:ri(5,15)*f});}deco("web");}
  else if(kind==="nest"){const pool=["rat","wolf","spider"].filter(k=>monByKey(k)&&monByKey(k).from<=f);for(let i=0;i<ri(2,3);i++)mon(pick(pool.length?pool:["rat"]));for(let i=0;i<3;i++)deco("animalbones");deco("skeleton",{loot:true});}
  else if(kind==="pool"){for(const t of tiles){const edge=t.x===r.x||t.x===r.x+r.w-1||t.y===r.y||t.y===r.y+r.h-1;if(!(t.x===door.x&&t.y===door.y)&&Math.abs(t.x-door.x)+Math.abs(t.y-door.y)>1)G.ground[t.y][t.x]=edge?GROUND.water:GROUND.deep;}
    const wetT=tiles.filter(t=>gnd(t.x,t.y)===GROUND.deep);const loot=Math.random()<.7;const lurk=!loot||Math.random()<.5;
    if(loot&&wetT.length){const p=pick(wetT);G.objs.push({type:"glint",x:p.x,y:p.y,deco:true,loot:rollLoot(Math.random()<.4)});}
    if(lurk&&wetT.length){const p=pick(wetT);const m=mkMon(NEW_MONS.lurker,p.x,p.y);m.gid=gid;m.state="idle";m.lurk=true;m.hide=rnd(20)+5;G.mons.push(m);}}
  else if(kind==="hideout"){const pool=["goblin","archer"].filter(k=>monByKey(k));const asleep=Math.random()<.5;for(let i=0;i<ri(2,3);i++)mon(pick(pool),{state:asleep?"sleep":"idle",fac:"goblins"});for(let i=0;i<2;i++)deco("straw");chest(false);deco("crate");}
  else if(kind==="lush"){for(let i=0;i<ri(3,5);i++)deco("fungus",{kind:pick(["food","heal","poison","mystery","mystery"])});for(let i=0;i<3;i++){const p=free();if(p)G.ground[p.y][p.x]=GROUND.water;}}
  else if(kind==="forgotten"){deco("skeleton",{loot:true});deco("furniture");deco("brokenweapons");deco("web");deco("web");if(Math.random()<.6)chest(Math.random()<.3);}
  else if(kind==="bigpit"){const lip=tiles.filter(t=>Math.abs(t.x-door.x)+Math.abs(t.y-door.y)<=1);const inner=tiles.filter(t=>!lip.includes(t));const lootAt=Math.random()<.6?pick(inner):null;
    for(const t of inner)G.objs.push({type:"abyss",x:t.x,y:t.y,deco:true,loot:lootAt&&t===lootAt?rollLoot(Math.random()<.5):null});}
  else if(kind==="crypt"){const n=Math.min(ri(3,5),tiles.length-2);for(let i=0;i<n;i++){const q=Math.random();const inside=q<.3?"loot":q<.55?"skeleton":q<.65&&f>=3?"vampire":q<.8?"ghost":"empty";deco("coffin",{inside});}}
  else if(kind==="altar"){for(const t of tiles)if(!(t.x===door.x&&t.y===door.y)&&!reserved(t.x,t.y))G.objs.push({type:"pentagram",x:t.x,y:t.y,deco:true,seen:true,rx:t.x-r.cx,ry:t.y-r.cy});
    const gear=Object.keys(ITEMS).filter(k=>ITEMS[k].kind==="gear"&&ITEMS[k].floor<=Math.max(f,2));const cursedG=gear.filter(k=>ITEMS[k].cursed);const cursed=cursedG.length&&Math.random()<.4;
    const item=cursed?pick(cursedG):pick(gear.filter(k=>!ITEMS[k].cursed));const p={x:r.cx,y:r.cy};G.objs=G.objs.filter(o=>!(o.type==="pentagram"&&o.x===p.x&&o.y===p.y));G.objs.push({type:"darkaltar",x:p.x,y:p.y,deco:true,item,risen:Math.random()<.4});
    for(let i=0;i<3;i++)deco("skullpile");}
  else if(kind==="trapped"){const n=ri(1,3);for(let i=0;i<n;i++)deco("survivor",{look:pick(["fighter","rogue","cleric","wizard","ranger"].filter(c=>S.classes.some(d=>d.id===c)))});deco("animalbones");}
  else if(kind==="tentacles"){for(let i=0;i<ri(3,4);i++)mon("tentacle",{state:"idle"});chest(Math.random()<.5);}
  else if(kind==="office"){for(const t of tiles)G.objs.push({type:"office",x:t.x,y:t.y,deco:true,seen:true});for(let i=0;i<ri(1,3);i++){const p=free();if(p){G.objs=G.objs.filter(o=>!(o.type==="office"&&o.x===p.x&&o.y===p.y));G.objs.push({type:"desk",x:p.x,y:p.y,deco:true});}}}}
{const base=placeDressing;placeDressing=function(){base();carveHidden();};}
Object.assign(BLOCKERS,{coffin:1,darkaltar:1,survivor:1,abyss:1,desk:1});Object.assign(COVER,{coffin:1,darkaltar:1,desk:1});Object.assign(WOODEN,{coffin:1,desk:1});
Object.assign(BUMP_NAME,{coffin:"A coffin",darkaltar:"A dark altar",survivor:"A trapped survivor",abyss:"A vast pit",desk:"A desk"});
const crackAt=(x,y)=>G.objs.find(o=>o.type==="crack"&&o.x===x&&o.y===y&&!o.gone);
// ---------- finding cracks ----------
function noticeCracks(){for(const o of G.objs){if(o.type!=="crack"||o.found||o.gone)continue;for(const h of heroesUp()){if(cheb(h,o)>2||h.id==="beast")continue;if(passive(h,"investigation")-2*exhOf(h)>=o.dc+2||passive(h,"perception")-2*exhOf(h)>=o.dc+4){
    o.found=true;toast(`The ${h.name} notices a crack in the wall to the ${dirTo(G.party[0],o)}. Cold air is breathing through it: there's a space behind!`);log("A crack in the wall with a draught behind it.","gold");break;}}}}
{const base=search;search=async function(){await base();if(!G||mode!=="explore")return;const L=G.party[0];const near=G.objs.filter(o=>o.type==="crack"&&!o.found&&!o.gone&&cheb(o,L)<=4);if(!near.length)return;
  const h=bestAt("investigation");for(const o of near){const r=rnd(20)+skillBonus(h,"investigation");if(r>=o.dc){o.found=true;toast(`Tapping along the walls, the ${h.name} finds a hollow-sounding crack to the ${dirTo(L,o)}. There's a space behind it!`);log("Found a crack in the wall.","gold");}}};}
{const base=d2Step;d2Step=async function(){await base();if(mode==="explore"&&G)noticeCracks();};}
{const base=aKind;aKind=function(x,y){const c=G&&crackAt(x,y);if(c&&c.found)return "bump";return base(x,y);};}
{const base=doMove;doMove=async function(dx,dy,act){const L=G&&G.party[0];if(L&&mode==="explore"){const c=crackAt(L.x+dx,L.y+dy);if(c&&c.found){if(!act){hintA("A crack in the wall. Something's behind it.");return;}await crackInteract(c);return;}}return base(dx,dy,act);};}
async function crackInteract(o){const at=bestAt("athletics");const barb=heroesUp().find(h=>h.id==="barbarian"&&(h.res.rage||0)>0&&!h.wild);const gun=heroesUp().find(h=>h.sub==="gunslinger"&&!h.wild);const dc=14+Math.floor(G.floor/2);
  const c=await choose("A jagged crack splits the wall. Cold air breathes through it: there's an open space on the other side.",[{t:"BREAK THROUGH",sub:o.fail?"You've tried; it won't give":`Athletics DC ${dc} · ${oddsTag(at,"athletics",dc)} · loud`,dis:!!o.fail},
    {t:"RAGE AND SMASH IT",sub:barb?`${barb.name}: uses a Rage · always works · loud`:"Needs a barbarian with Rage left",dis:!barb},
    {t:"BLAST IT WITH GUNPOWDER",sub:gun?((G.bag.bullets||0)>=3?"Uses the powder from 3 bullets · always works · VERY loud":"Needs 3 bullets' worth of powder"):"Needs a gunslinger",dis:!gun||(G.bag.bullets||0)<3},{t:"LEAVE IT"}]);$("tBox").hidden=true;
  if(c===0){G.steps+=6;makeNoise(o.x,o.y,14);const r=await check(at,"athletics",dc);if(!r.ok){o.fail=true;await say(`The ${at.name} slams into the wall again and again, but it holds. (${r.txt})`,1200,true);$("tBox").hidden=true;return;}await openCrack(o,`With a final heave, the ${at.name} breaks through! (${r.txt})`);}
  else if(c===1){barb.res.rage--;makeNoise(o.x,o.y,16);await openCrack(o,`The ${barb.name} roars and hurls themself at the wall. Rock explodes inward!`);}
  else if(c===2){takeItem("bullets",3);makeNoise(o.x,o.y,30);cam.shake=now();fx.push({type:"boom",x:o.x,y:o.y,t:now()});await openCrack(o,`The ${gun.name} packs powder into the crack, lights the fuse and... BOOM! The wall blows apart. That was heard across the whole floor.`);}}
async function openCrack(o,msg){o.gone=true;G.t[o.y][o.x]=0;G.ground[o.y][o.x]=GROUND.rubble;cam.shake=now();buildTerrain();computeLight();fov();hud();await say(msg,1500,true);$("tBox").hidden=true;}
D2_DRAW.crack=(f,o)=>{if(!o.found)return;const K="#0a0608";f(K,7,1,1,3);f(K,6,4,1,3);f(K,7,7,1,2);f(K,8,9,1,3);f(K,7,12,1,3);f(K,5,5,1,1);f(K,9,10,1,1);f("rgba(140,200,255,.25)",6,4,3,8);};
// ---------- what's inside ----------
D2_ACT.coffin=async o=>{if(o.opened){toast("An open, empty coffin.");return;}const c=await choose("A stone coffin, its lid carved with a worn face.",[{t:"OPEN IT",sub:"Heave the lid aside"},{t:"LEAVE IT"}]);$("tBox").hidden=true;if(c!==0)return;
  o.opened=true;G.steps+=3;makeNoise(o.x,o.y,5);const L=G.party[0];
  if(o.inside==="loot"){const g=ri(10,25)*G.floor;G.gold+=g;const it=rollItem(Math.random()<.4);if(it)addItem(it);hud();await say(`Inside, a long-dead noble clutches their grave goods: ${g} gold${it?" and "+itemName(it):""}.`,1500,true);}
  else if(o.inside==="empty")await say("Empty. Not even bones. Someone got here first... or whoever was in it got up and left.",1400,true);
  else{const key=o.inside;const p=nearFree(o.x,o.y);if(!p){await say("Bones, nothing more.",900,true);return;}const t=monT(key);if(!t){await say("Dust and bones.",900,true);return;}const m=mkMon(t,p.x,p.y);m.gid=9600+(G.hidN=(G.hidN||0)+1);m.state="combat";G.mons.push(m);fx.push({type:"flash",u:m,t:now()});
    await say(key==="vampire"?"A pale hand shoots out of the coffin. A VAMPIRE SPAWN rises, eyes burning red and fangs bared!":key==="ghost"?"A cold mist pours out of the coffin and gathers into a shrieking GHOST!":"Bones rattle and a SKELETON sits up, then climbs out!",1500,true);$("tBox").hidden=true;busy=false;startCombat({extra:[m],bumped:m});}
  $("tBox").hidden=true;};
D2_ACT.darkaltar=async o=>{if(o.taken){toast("A bare altar ringed by guttering black candles.");return;}const nm=ITEMS[o.item]?(isKnown(o.item)?ITEMS[o.item].name:ITEMS[o.item].unk||"a strange item"):"something";
  const c=await choose(`On the altar, inside the star of red runes, lies ${aN(nm.toLowerCase())}. It hums faintly. The candles around it are unlit, waiting.`,[{t:"TAKE IT",sub:"Who knows what it does. Or who it belonged to."},{t:"LEAVE IT"}]);$("tBox").hidden=true;if(c!==0)return;
  o.taken=true;o.lit=true;addItem(o.item);hud();await say("As you lift it, every black candle in the room bursts alight with a red flame. A whisper passes through the room... then silence.",1600,true);
  if(o.risen){const out=[];for(const sk of G.objs.filter(q=>q.type==="skullpile"&&!q.gone).slice(0,2)){const p=nearFree(sk.x,sk.y);if(!p)continue;const m=mkMon(monByKey("skeleton")||S.monsters[0],p.x,p.y);m.gid=9700;m.state="combat";G.mons.push(m);out.push(m);sk.gone=true;}
    if(out.length){await say("The skulls around the altar grind together and pull themselves up out of the bones: the guardians have woken!",1400,true);$("tBox").hidden=true;busy=false;startCombat({extra:out,bumped:out[0]});return;}}
  $("tBox").hidden=true;};
D2_ACT.survivor=async o=>{const c=await choose(`"You found us! We've been stuck in here for days since the tunnel collapsed!" A filthy, starving ${o.look||"traveller"} grabs your hand.`,[{t:"HELP THEM OUT",sub:"Share some food and point them to the ladder"},{t:"NOT NOW"}]);$("tBox").hidden=true;if(c!==0)return;
  const others=G.objs.filter(q=>q.type==="survivor"&&!q.gone);for(const q of others)q.gone=true;approve("spare");const full=G.party.filter(h=>h.id!=="beast").length>=S.dungeon.party;const q=Math.random();
  if(!full&&q<.3){const p=nearFree(o.x,o.y);if(p){await say(`"I owe you my life. If you'll have me, I'll fight at your side."`,1300,true);G.npc={side:"n",def:S.classes.find(d=>d.id===o.look)||pick(S.classes),race:pick(RACE_KEYS),x:p.x,y:p.y};$("tBox").hidden=true;await recruit();return;}}
  if(q<.6){const g=ri(10,20)*G.floor;G.gold+=g;await say(`"Take this. It's all we have." They press ${g} gold into your hands and hurry off towards the ladder.`,1500,true);}
  else if(q<.85){const it=rollItem(false)||"potion";addItem(it);await say(`"Here, I won't need this where I'm going: home." They give you ${aN(itemName(it))}.`,1500,true);}
  else await say("They weep with relief, thank you over and over, and stumble off towards the ladder.",1400,true);hud();$("tBox").hidden=true;};
D2_ACT.glint=async o=>{if(o.taken){toast("Just black water now.");return;}const h=bestAt("athletics");const c=await choose("Something glints at the bottom of the pool, deep and cold.",[{t:"DIVE FOR IT",sub:`Athletics DC 12 · ${oddsTag(h,"athletics",12)}`},{t:"LEAVE IT"}]);$("tBox").hidden=true;if(c!==0)return;
  const r=await check(h,"athletics",12);G.steps+=4;makeNoise(o.x,o.y,4);if(!r.ok){await say(`The ${h.name} dives, but the cold drives them back up, gasping. (${r.txt})`,1200,true);await dealDamage(h,roll("1d4").total,"bludgeoning",{});$("tBox").hidden=true;return;}
  o.taken=true;o.gone=true;const got=[];if(o.loot.gold){G.gold+=o.loot.gold;got.push(o.loot.gold+" gold");}for(const id of o.loot.items){addItem(id);got.push(itemName(id));}hud();await say(`The ${h.name} surfaces with a fistful of treasure: ${got.join(", ")}! (${r.txt})`,1600,true);$("tBox").hidden=true;
  const lur=G.mons.find(m=>m.key==="lurker"&&m.hp>0&&cheb(m,o)<=6);if(lur&&!lur.inCombat){lur.lurk=false;lur.spotted=true;await say("Something huge moves under the water. The Pool Lurker has noticed you!",1200,true);$("tBox").hidden=true;busy=false;startCombat({extra:[lur],bumped:lur});}};
D2_ACT.abyss=async o=>{const L=G.party[0];const pitLoot=G.objs.find(q=>q.type==="abyss"&&q.loot&&!q.lootTaken&&cheb(q,o)<=8);const rope=(G.bag.rope||0)>0;
  const c=await choose(`The floor simply ends. The pit drops away into blackness${pitLoot?". Far below, something catches your light":""}.`,[{t:"CLIMB DOWN WITH THE ROPE",sub:rope?"Safe but exhausting (the party grows wearier)":"You need rope",dis:!rope},{t:"JUMP DOWN",sub:"It's a long way. It will hurt."},{t:"BACK AWAY"}]);$("tBox").hidden=true;if(c===2||c<0)return;
  if(c===1){for(const h of heroesUp()){const s=await dodgeRoll(h,13);await dealDamage(h,s.ok?Math.floor(roll(`${trapN()+1}d6`).total/2):roll(`${trapN()+1}d6`).total,"bludgeoning",{fall:true});}await say("The party jumps... and lands hard on the rocks below.",1200,true);}
  G.steps+=25;if(S.rules.fatigue){G.fatigue++;await partyWeary();}
  if(pitLoot){pitLoot.lootTaken=true;const got=[];if(pitLoot.loot.gold){G.gold+=pitLoot.loot.gold;got.push(pitLoot.loot.gold+" gold");}for(const id of pitLoot.loot.items){addItem(id);got.push(itemName(id));}
    await say(`At the bottom, among the bones of those who fell, you find: ${got.join(", ")}. Then the long climb back up.`,1700,true);}
  else await say("At the bottom: bones, rubble, and nothing worth the climb. It's a long way back up.",1500,true);hud();$("tBox").hidden=true;};
D2_ACT.office=async o=>{toast(pick(["The carpet squelches. It smells like old rain.","The lights buzz. You can't see where they are.","This room goes on further than it should.","You have been here before. Haven't you?"]));};
D2_ACT.desk=async o=>{if(o.searched){toast("An empty desk. Somehow it's always been here.");return;}o.searched=true;toast(pick(["In the drawer: a stapler, and a mug that reads WORLD'S OKAYEST WIZARD.","A sticky note: 'DO NOT GO DEEPER'. The handwriting looks like yours.","Paperwork. Endless, meaningless paperwork.","A phone of some strange make. When you lift it, it's dial tone, then nothing."]));};
D2_ACT.pentagram=async o=>toast("Red runes, painted in something that isn't paint.");
D2_ACT.skullpile=async o=>toast("A heap of human skulls. Their empty eyes all face the altar.");
// mysterious mushrooms
{const base=D2_ACT.fungus;D2_ACT.fungus=async o=>{if(o.kind!=="mystery"||o.picked)return base(o);const h=bestAt("nature");const L=G.party[0];
  const c=await choose("A cluster of mushrooms unlike any you know: spiralled caps that shift colour as you watch.",[{t:"EXAMINE THEM",sub:`Nature DC 15 · ${oddsTag(h,"nature",15)}`},{t:"EAT ONE",sub:"Who knows?"},{t:"LEAVE THEM"}]);$("tBox").hidden=true;if(c===2||c<0)return;
  if(c===0){const r=await check(h,"nature",15);if(!r.ok){await say(`Nobody has ever written about these. (${r.txt})`,1000,true);$("tBox").hidden=true;return;}await say(`The ${h.name} has read about these: "wandercaps". Unpredictable. Usually harmless. Usually. (${r.txt})`,1500,true);$("tBox").hidden=true;return;}
  o.picked=true;o.seen=true;const e=ri(0,5);const who=L;
  if(e===0){who.hp=who.maxHp;await say(`The ${who.name} feels warmth spread through every limb. Fully healed!`,1300,true);}
  else if(e===1){reduceExh(who);await say(`A rush of energy! The ${who.name} feels less weary.`,1200,true);}
  else if(e===2){G.steps+=20;await say(`The ${who.name} sits down, giggles, and falls fast asleep. The others wait, not very patiently, for them to wake.`,1500,true);}
  else if(e===3){makeNoise(who.x,who.y,12);await say(`The ${who.name} bursts into uncontrollable, echoing laughter. Everything nearby heard that.`,1400,true);}
  else if(e===4){revealAround(who.x,who.y,16);await say(`The walls turn transparent. For a dizzy moment the ${who.name} sees the tunnels all around... and remembers them. (Your map fills in nearby.)`,1700,true);}
  else{who.thp=Math.max(who.thp||0,ri(4,8));await say(`The ${who.name}'s skin goes hard and grey as stone for a while. (Temporary HP.)`,1300,true);}
  hud();$("tBox").hidden=true;};}
// ---------- drawing ----------
Object.assign(D2_DRAW,{
  coffin:(f,o)=>{f("#1a1216",2,1,12,14);f("#6a6460",3,2,10,12);f("#8a8478",3,2,10,2);f("#4a4440",7,4,2,8);f("#4a4440",5,6,6,2);if(o.opened){f("#0a0608",4,4,8,8);f("#cfc6ae",6,7,4,1);}},
  darkaltar:(f,o,t)=>{f("#1a1216",1,4,14,11);f("#3a2a2e",2,5,12,9);f("#5a3a3e",2,5,12,2);if(!o.taken){f("#c8a0ff",7,2,2,3);f(`rgba(200,140,255,${.4+.3*Math.sin(t/200)})`,6,1,4,5);}
    for(const [x,y] of [[1,1],[13,1],[1,13],[13,13]]){f("#1a1014",x,y,2,3);if(o.lit){const g=Math.floor(t/120)%2;f("#ff3a2a",x,y-1-g,2,2);}}},
  pentagram:(f,o)=>{const c="rgba(200,30,30,.55)";const a=(o.rx+o.ry)&1;if(a)f(c,0,7,16,2);else f(c,7,0,2,16);f(c,3,3,2,2);f(c,11,11,2,2);},
  skullpile:(f)=>{f("#cfc6ae",3,9,4,4);f("#e0d8c4",8,8,5,5);f("#1a1216",4,10,1,1);f("#1a1216",6,10,1,1);f("#1a1216",9,10,1,1);f("#1a1216",11,10,1,1);f("#b0a890",5,13,6,2);},
  survivor:(f,o,t)=>{const b=Math.floor(t/400)%2;f("#1a1216",4,2-b,8,14);f("#c89a70",5,3-b,6,4);f("#7a6a5a",5,7-b,6,8);f("#1a1216",6,4-b,1,1);f("#1a1216",9,4-b,1,1);f("#5a4a3a",5,2-b,6,1);},
  glint:(f,o,t)=>{if(o.taken)return;const g=.5+.5*Math.sin(t/180+o.x);f(`rgba(255,230,120,${.3+.5*g})`,7,7,2,2);f(`rgba(255,250,200,${.6*g})`,8,6,1,1);},
  abyss:(f)=>{f("#000000",0,0,16,16);f("#0a0608",2,2,12,12);},
  office:(f,o,t)=>{f("#c8b45a",0,0,16,16);f("#b8a44a",0,0,16,1);f("#b8a44a",0,8,16,1);f("#a8943e",(o.x*5+o.y*3)%14,(o.x*3+o.y*7)%14,2,2);if(Math.floor(t/1700+o.x)%9===0)f("rgba(255,255,220,.15)",0,0,16,16);},
  desk:(f)=>{f("#1a1216",1,4,14,10);f("#9a8a6a",2,5,12,4);f("#b8a888",2,5,12,1);f("#6a5a4a",3,9,2,4);f("#6a5a4a",11,9,2,4);f("#d8d8d0",4,6,3,2);f("#5a5a68",9,5,3,2);}});
// things rooted to the floor stay where they are
{const base=d2Step;d2Step=async function(){for(const m of G.mons)if(m.speed===0&&!m.anchor)m.anchor={x:m.x,y:m.y};await base();if(!G)return;for(const m of G.mons)if(m.speed===0&&m.anchor&&!m.inCombat){m.x=m.anchor.x;m.y=m.anchor.y;m.dx=m.x*TS;m.dy=m.y*TS;}};}
{const base=stepToward;stepToward=function(m,gx,gy){if(m.speed===0)return;return base(m,gx,gy);};}
