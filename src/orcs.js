// ================= orc camps, fights you hear from afar, "give us that one", the demon's bargain =================
// ---------- orc camps ----------
Object.assign(ROOM_THEMES,{orccamp:{name:"an orc camp",desc:"Hide tents, a crackling fire and the smell of roasting meat. An orc war band has made camp here."},
  h_orccamp:{name:"a hidden orc camp",desc:"Hide tents, a crackling fire and the smell of roasting meat. An orc war band has made camp in this hidden cave."},
  h_demon:{name:"a hellish chamber",desc:"The floor glows red through cracks. The air shimmers with heat and smells of sulphur. Something here is waiting for you."}});
HIDDEN_KINDS.push(["orccamp",2],["demon",2]);
const hasHalfOrc=()=>heroesUp().some(h=>h.race==="halforc");
function placeOrcCamp(r,tiles){const f=G.floor;const T=tiles||(()=>{const out=[];for(let y=r.y;y<r.y+r.h;y++)for(let x=r.x;x<r.x+r.w;x++)out.push({x,y});return out;})();
  const free=()=>shuffle(T.slice()).find(t=>!reserved(t.x,t.y)&&!elevAt(t.x,t.y))||null;const id=(G.campN=(G.campN||0)+1);const gid=9800+id;
  const hostile=Math.random()<.45;const camp={id,gid,floor:f,hostile,favour:0,met:false,friendly:false,stance:hostile?"hostile":"wary"};
  const fire=free();if(fire)G.objs.push({type:"orcfire",x:fire.x,y:fire.y,deco:true,seen:true});
  for(let i=0;i<2;i++){const p=free();if(p)G.objs.push({type:"tent",x:p.x,y:p.y,deco:true});}
  const n=ri(2,3)+(f>=4?1:0);const t=monByKey("orc");if(!t)return;
  for(let i=0;i<n;i++){const p=free();if(!p)continue;const m=mkMon(t,p.x,p.y);m.gid=gid;m.orcCamp=id;m.fac="orcs";m.state=Math.random()<.3?"sleep":"idle";m.peace=!hostile;
    if(i===0){m.name="Orc War Chief";m.hp=m.maxHp=Math.round(t.hp*1.8);m.ac=15;m.hit+=1;m.xp=t.xp*3;m.named=true;m.leader=true;}G.mons.push(m);}
  const ch=free();if(ch){const c={type:"chest",x:ch.x,y:ch.y,loot:rollLoot(Math.random()<.4),opened:false};c.loot.items.push("w_"+pick(["greataxe","javelin","battleaxe","handaxe"]));registerWeapon(c.loot.items[c.loot.items.length-1]);G.objs.push(c);kitChest(c);}
  G.orcCamps=(G.orcCamps||[]).filter(c=>c.floor===f);G.orcCamps.push(camp);r.theme=tiles?"h_orccamp":"orccamp";}
{const base=placeDressing;placeDressing=function(){base();if(G.demo||G.floor<2||!monByKey("orc")||Math.random()>.3)return;const sr=G.rooms.find(r=>r.role==="start")||G.rooms[0];
  const rooms=G.rooms.filter(r=>!r.role&&!r.theme&&r.w>=5&&r.h>=4&&cheb({x:r.cx,y:r.cy},{x:sr.cx,y:sr.cy})>=9&&!G.mons.some(m=>inRoom(r,m.x,m.y)));if(rooms.length)placeOrcCamp(pick(rooms),null);};}
{const base=fillHidden;fillHidden=function(kind,r,tiles,door){if(kind==="orccamp"){if(monByKey("orc"))placeOrcCamp(r,tiles);return;}if(kind==="demon"){placeDemon(r,tiles,door);return;}return base(kind,r,tiles,door);};}
const campOf=m=>m&&m.orcCamp&&(G.orcCamps||[]).find(c=>c.id===m.orcCamp);
const campOrcs=camp=>G.mons.filter(m=>m.orcCamp===camp.id&&m.hp>0);
const ORC_STOCK=()=>["ration","ration","ration","firewood","firewood","potion","arrows","w_greataxe","w_javelin","w_handaxe","w_battleaxe",G.floor>=3?randomWeaponId(true):"w_greatclub"];
async function orcTalk(camp,first){const orcs=campOrcs(camp);if(!orcs.length)return;const chief=orcs.find(m=>m.leader)||orcs[0];const tongue=speakerFor(chief);const kin=hasHalfOrc();
  for(const m of orcs){m.bubble=now()+900;if(m.state==="sleep")m.state="idle";}
  if(camp.friendly){const c=await choose(tongue?`"Ha! Friends of the fire. Sit. Trade?" the ${chief.name} grunts.`:`The orcs grin and wave you over to the fire.`,[{t:"TRADE"},{t:"ASK FOR NEWS",sub:camp.newsGiven?"They've told you what they know":"",dis:!!camp.newsGiven||!tongue},{t:"LEAVE"}]);$("tBox").hidden=true;
    if(c===0){const sh=camp.shop||(camp.shop={type:"merchant",stock:ORC_STOCK(),lang:"Orc",mult:kin?.8:1});sh.stock.forEach(registerWeapon);openShop(sh);}else if(c===1){camp.newsGiven=true;await shareSecret(orcs);}return;}
  const giftOK=(G.bag.ration||0)>=2||G.gold>=15*G.floor;const pers=bestAt("persuasion");const dc=kin?10:14;const ath=bestAt("athletics");
  const intro=first?(kin&&camp.hostile?`The orcs reach for their axes... then one of them spots the half-orc. "Hold! Kin walks with them." The ${chief.name} looks you over. "Speak, then. Quickly."`
      :tongue?`The ${chief.name} rises from the fire, axe in hand. "This is our camp, little ones. Turn around and go."`:`The orcs rise from their fire, growling in Orc and jabbing their axes back the way you came. The meaning is clear enough: leave.`)
    :tongue?`The ${chief.name} scowls. "You again."`:`The orcs growl at you again.`;
  const opts=[{t:"LEAVE THEM BE",k:"leave"},{t:"OFFER A GIFT",k:"gift",sub:giftOK?((G.bag.ration||0)>=2?"Two rations, laid by the fire":`${15*G.floor} gold`):"You have nothing they'd want",dis:!giftOK},
    {t:"WIN THEM OVER",k:"talk",sub:tongue?`Persuasion DC ${dc}${kin?" (kin: easier)":""} · ${oddsTag(pers,"persuasion",dc,{adv:kin})}`:"You don't speak Orc",dis:!tongue||camp.talkFail},
    {t:"CHALLENGE THEIR CHAMPION",k:"wrestle",sub:camp.wrestled?"Already done":`An arm-wrestle: ${ath.name}'s Athletics against the chief`,dis:!!camp.wrestled},{t:"ATTACK",k:"attack"}];
  const c=await choose(intro,opts);$("tBox").hidden=true;const k=(opts[c]||{}).k;
  if(k==="attack"){await campFight(camp,true);return;}
  if(k==="gift"){if((G.bag.ration||0)>=2)takeItem("ration",2);else G.gold-=15*G.floor;camp.favour+=kin?2:1;await say(`The orcs sniff the offering and grunt approvingly. They seem a little warmer towards you.`,1300,true);}
  else if(k==="talk"){const r=await check(pers,"persuasion",dc,{adv:kin});if(r.ok){camp.favour+=r.total>=dc+5?2:1;await say(`The ${chief.name} barks a laugh. "You have spirit." (${r.txt})`,1300,true);}else{camp.talkFail=true;camp.favour--;await say(`"Enough words." (${r.txt}) The orcs look less patient now.`,1200,true);}}
  else if(k==="wrestle"){camp.wrestled=true;const me=rnd(20)+skillBonus(ath,"athletics"),him=rnd(20)+5;await say(`The ${ath.name} and the ${chief.name} lock hands across a log. ${me} against ${him}...`,1300,true);
    if(me>=him){camp.favour+=2;await say(`The ${ath.name} slams the chief's hand down! The orcs roar with laughter and pound the ground. Respect earned.`,1500,true);}else{camp.favour--;await say(`The chief slams the ${ath.name}'s hand down and roars. The orcs jeer. Not a good look.`,1400,true);}}
  else{toast(tongue?`"Smart." The orcs watch you go.`:"The orcs watch you go.");}
  if(camp.favour>=2&&!camp.friendly){camp.friendly=true;await say(tongue?`The ${chief.name} slaps your back. "You may share our fire. And we trade, if you have coin."`:`The orcs make room for you by the fire and gesture at their goods. They want to trade.`,1500,true);}
  else if(camp.favour<=-2){await campFight(camp,false,`"Enough of you!" The orcs grab their axes!`);return;}
  $("tBox").hidden=true;}
async function campFight(camp,ours,msg){const orcs=campOrcs(camp);for(const m of orcs){m.peace=false;m.state="hunt";}camp.hostile=true;camp.friendly=false;if(msg)await say(msg,1000,true);$("tBox").hidden=true;busy=false;await startCombat({extra:orcs,bumped:orcs[0],partyFirst:!!ours});}
async function orcTick(){const L=G.party[0];for(const camp of G.orcCamps||[]){if(camp.floor!==G.floor)continue;const orcs=campOrcs(camp);if(!orcs.length)continue;
    const near=orcs.some(m=>cheb(m,L)<=(camp.hostile?9:7)&&(seen(m.x,m.y)||camp.hostile&&los(m.x,m.y,L.x,L.y)));if(!near)continue;
    if(camp.hostile&&!camp.met&&hasHalfOrc()&&orcs.every(m=>!m.inCombat)){camp.met=true;for(const m of orcs){m.peace=true;m.state="idle";}await orcTalk(camp,true);return true;}
    if(!camp.hostile&&!camp.met){camp.met=true;if(await covetOffer(orcs,"orcs",camp,false))return true;await orcTalk(camp,true);return true;}}
  return false;}
{const base=doMove;doMove=async function(dx,dy,act){const L=G&&G.party[0];if(L&&mode==="explore"){const m=monAt(L.x+dx,L.y+dy);const camp=campOf(m);if(camp&&m.peace){if(!act){hintA(`The ${m.name} eyes you.`);return;}camp.met=true;await orcTalk(camp,false);return;}}return base(dx,dy,act);};}
D2_ACT.orcfire=async o=>toast("A crackling fire with a spitted boar roasting over it. It smells incredible.");
D2_ACT.tent=async o=>toast("A tent of stitched hides. It smells strongly of orc.");
Object.assign(D2_DRAW,{orcfire:(f,o,t)=>{const fl=Math.floor(t/90)%3;f("#5a5450",3,9,10,5);f("#2a2422",4,10,8,3);f("#ff6a1a",5,5+fl,6,6-fl);f("#ffc040",6,7+((fl+1)%3),4,4);f("#6a4428",2,4,12,1);f("#a05a3a",6,3,4,2);},
  tent:(f)=>{f("#1a1216",2,3,12,12);f("#8a6a4a",3,8,10,6);f("#a8845a",5,5,6,4);f("#7a5a3a",7,3,2,3);f("#3a2a1a",7,10,2,4);}});
Object.assign(BLOCKERS,{tent:1});Object.assign(WOODEN,{tent:1});BUMP_NAME.tent="A hide tent";

// ---------- fights you hear before you see ----------
function skHeard(sk){const L=G.party[0];const u=skUnits(sk);if(!u.length)return false;const d=Math.min(...u.map(m=>cheb(m,L)));return d>=7&&d<=18&&!u.some(m=>seen(m.x,m.y));}
{const base=skTick;skTick=async function(){for(const sk of G.skirmishes||[]){if(sk.floor!==G.floor||sk.state!=="pending"||sk.heard||sk.phase==="over")continue;if(!skHeard(sk))continue;sk.heard=true;const u=skUnits(sk);const L=G.party[0];
    const c=await choose(`Shouting, screams and the clash of steel echo from the ${dirTo(L,u[0])}. Somebody is fighting over there.`,[{t:"INVESTIGATE",sub:"Head towards the noise, carefully"},{t:"IGNORE IT",sub:"Not your fight"}]);$("tBox").hidden=true;
    if(c===0){G.autoWalk={x:u[0].x,y:u[0].y,sk:sk.id,n:0};setTimeout(autoWalkStep,200);}return true;}
  return base();};}
function walkPath(L,tx,ty,near){const W=G.W;const start=L.y*W+L.x;const prev=new Map([[start,-1]]);const q=[start];let goal=-1;
  while(q.length){const c=q.shift();const x=c%W,y=(c/W)|0;if(cheb({x,y},{x:tx,y:ty})<=near&&los(x,y,tx,ty)){goal=c;break;}
    for(const [dx,dy] of DIRS4){const nx=x+dx,ny=y+dy,k=ny*W+nx;if(prev.has(k)||isWall(nx,ny)||blocksObj(nx,ny)||unitAt(nx,ny)&&!heroAt(nx,ny)||(G.stairs&&G.stairs.x===nx&&G.stairs.y===ny))continue;const d=doorAt(nx,ny);if(d&&d.locked)continue;const t=trapAt(nx,ny);if(t&&t.found)continue;prev.set(k,c);q.push(k);}}
  if(goal<0)return null;const path=[];for(let c=goal;c!==start;c=prev.get(c))path.unshift(c);return path;}
async function autoWalkStep(){const a=G&&G.autoWalk;if(!a)return;if(mode!=="explore"||G.over){G.autoWalk=null;return;}if(busy||choosing||sayState){setTimeout(autoWalkStep,250);return;}
  const sk=(G.skirmishes||[]).find(s=>s.id===a.sk);if(!sk||sk.revealed||a.n++>40){G.autoWalk=null;return;}const L=G.party[0];const p=walkPath(L,a.x,a.y,6);if(!p||!p.length){G.autoWalk=null;return;}
  const k=p[0];const dx=k%G.W-L.x,dy=((k/G.W)|0)-L.y;await tryMove(dx,dy,true);setTimeout(autoWalkStep,140);}
// orcs join the fights too
SK_MATCHES.push({a:{keys:["orc"],lang:"Orc",label:"orcs"},b:{adv:true,label:"adventurers"},w:2},{a:{keys:["orc"],lang:"Orc",label:"orcs"},b:{keys:["goblin","archer"],lang:"Goblin",label:"goblins"},w:2},{a:{keys:["orc"],lang:"Orc",label:"orcs"},b:{bandit:true,label:"bandits"},w:2});

// ---------- "give us that one and you can go" ----------
const COVET_WHY=["That one's strong. We could use them.","I like the look of that one.","That one's clever. Clever is useful.","That one. Pretty. We'll take them.","That one fights well. Join us, and the rest of you walk free."];
async function covetOffer(group,label,obj,hostile){if(!group.length||Math.random()>.1||obj.covetAsked)return false;obj.covetAsked=true;
  const cands=heroesUp().filter(h=>h.id!=="beast"&&!h.isYou&&!h.rival);if(!cands.length||heroesUp().length<2)return false;const h=pick(cands);const lead=group.find(m=>m.leader)||group[0];
  const speak=lead.rival!==undefined&&lead.cls?true:!!speakerFor(lead)||!MLANG[lead.key];if(!speak)return false;
  for(const m of group)m.bubble=now()+900;
  // sometimes it's a threat, sometimes they want to buy: gold, or something rare
  const buy=!hostile||Math.random()<.4;const gold=ri(40,80)*G.floor;const item=buy&&Math.random()<.5?randomWeaponId(true):null;const who=h.nick||"the "+h.name;
  const q=!buy?`The ${lead.name} points at ${who}. "${pick(COVET_WHY)} Hand them over, and there's no fight. The rest of you go free."`
    :item?`The ${lead.name} points at ${who}. "${pick(COVET_WHY)} I'll trade you this for them." They hold up ${aN(ITEMS[item].name)}.`
    :`The ${lead.name} points at ${who}. "${pick(COVET_WHY)} ${gold} gold says they come with us."`;
  const c=await choose(q,[{t:"REFUSE",sub:"Nobody gets left behind"},{t:!buy?`HAND OVER ${(h.nick||h.name).toUpperCase()}`:item?`TRADE ${(h.nick||h.name).toUpperCase()} FOR IT`:`SELL ${(h.nick||h.name).toUpperCase()} FOR ${gold} GOLD`,sub:`${item?ITEMS[item].desc+" · ":""}They leave your party for good`}]);$("tBox").hidden=true;
  if(c!==1)return false;if(buy){if(item)addItem(item);else G.gold+=gold;}G.party=G.party.filter(x=>x!==h);if(h.wpn)h.wpn=null;log(`${esc(h.nick||h.name)} the ${esc(h.name)} leaves the party with the ${esc(label)}.`,"hurt");approve("finish");
  for(const m of group){m.peace=true;m.state="idle";}await say(`${h.nick||"The "+h.name} looks back at you once, then walks over to the ${label}. They don't look back again.`,1700,true);$("tBox").hidden=true;
  for(const m of group){const k=G.mons.indexOf(m);if(k>=0)G.mons.splice(k,1);}hud();fov();return true;}
// rivals and bandits may covet a hero too
{const base=rivalMeet;rivalMeet=async function(co,first){if(first&&!co.covetAsked){const mem=rivalMembers(co);if(await covetOffer(mem,co.name,co,co.stance==="threat"||co.stance==="revenge")){co.gone=true;return;}}return base(co,first);};}
async function banditCovet(){const L=G.party[0];for(const co of G.rivals||[]){if(!co.hostile||co.covetAsked||co.floor!==G.floor)continue;const mem=rivalMembers(co).filter(m=>!m.inCombat);if(!mem.length)continue;
    if(!mem.some(m=>cheb(m,L)<=7&&seen(m.x,m.y)))continue;if(await covetOffer(mem,"bandits",co,true)){co.gone=true;return true;}co.covetAsked=true;}return false;}
{const base=skAftermath;skAftermath=async function(sk,arrived){const side=sk.sides.find(s=>s.team===sk.winner);const us=side?skUnits(sk,side):[];if(side&&us.length&&(side.lang==="Common"||speakerFor(us[0]))&&await covetOffer(us,side.label,sk,!side.neutral)){for(const m of us){const k=G.mons.indexOf(m);if(k>=0)G.mons.splice(k,1);}sk.state="done";sk.talked=true;return;}return base(sk,arrived);};}

// ---------- the demon's bargain ----------
function placeDemon(r,tiles,door){for(const t of tiles)if(!(t.x===door.x&&t.y===door.y))G.objs.push({type:"hellfloor",x:t.x,y:t.y,deco:true,seen:true});
  const p={x:r.cx,y:r.cy};G.objs=G.objs.filter(o=>!(o.type==="hellfloor"&&o.x===p.x&&o.y===p.y));G.objs.push({type:"demon",x:p.x,y:p.y,deco:true});}
const BOONS=[{t:"STRENGTH OF TEN",sub:"+2 Strength, forever",f:h=>{h.demonAsi=h.demonAsi||{};h.demonAsi.str=(h.demonAsi.str||0)+2;}},{t:"THE SERPENT'S SPEED",sub:"+2 Dexterity, forever",f:h=>{h.demonAsi=h.demonAsi||{};h.demonAsi.dex=(h.demonAsi.dex||0)+2;}},
  {t:"IRON FLESH",sub:"+2 Constitution, forever",f:h=>{h.demonAsi=h.demonAsi||{};h.demonAsi.con=(h.demonAsi.con||0)+2;}},{t:"A SHARPER MIND",sub:"+2 Intelligence, forever",f:h=>{h.demonAsi=h.demonAsi||{};h.demonAsi.int=(h.demonAsi.int||0)+2;}},
  {t:"A SILVER TONGUE",sub:"+2 Charisma, forever",f:h=>{h.demonAsi=h.demonAsi||{};h.demonAsi.cha=(h.demonAsi.cha||0)+2;}},{t:"EYES OF THE PIT",sub:"See in the dark",f:h=>{h.devilEyes=true;}},
  {t:"THE GIFT OF TONGUES",sub:"Speak every language",f:h=>{h.allTongues=true;}},{t:"GOLD",sub:"More than you can carry... almost",f:h=>{G.gold+=100*G.floor;}},
  {t:"A WEAPON OF FIRE",sub:"A blade that burns",f:h=>{const id=`w_${pick(["longsword","greatsword","scimitar","warhammer","rapier"])}_p1_flaming`;registerWeapon(id);addItem(id);}}];
const BANES=[h=>{const ab=pick(["str","dex","con","int","wis","cha"].filter(a=>a!==h.demonBoon));h.demonAsi=h.demonAsi||{};h.demonAsi[ab]=(h.demonAsi[ab]||0)-2;},h=>{h.saveCurse=(h.saveCurse||0)+1;},h=>{h.hpCurse=(h.hpCurse||0)+5;}];
D2_ACT.demon=async o=>{if(o.gone)return;const offers=shuffle(BOONS.slice()).slice(0,3);
  const c=await choose(`A towering figure of smoke and embers unfolds from the cracks in the floor. Its smile is far too wide. "Mortals. I can give you what you desire. One gift. No price you'd notice." `,offers.map(b=>({t:b.t,sub:b.sub})).concat([{t:"REFUSE",sub:"Back away slowly"}]));
  if(c<0||c>=offers.length){$("tBox").hidden=true;await say(`"Another time, then." The figure sinks back into the floor, still smiling.`,1300,true);$("tBox").hidden=true;return;}
  const up=heroesUp().filter(h=>h.id!=="beast");const w=await choose("Who takes the bargain?",up.map(h=>({t:(h.nick||h.name).toUpperCase(),sub:`the ${h.name}`})));const h=up[Math.max(0,w)];
  const pre=Object.assign({},h.demonAsi||{});offers[c].f(h);h.demonBoon=Object.keys(h.demonAsi||{}).find(a=>(h.demonAsi[a]||0)>(pre[a]||0))||null;pick(BANES)(h);applyLevel(h,false);h.hp=Math.min(h.hp,h.maxHp);o.gone=true;G.objs.filter(q=>q.type==="hellfloor").forEach(q=>q.dim=true);
  log(`${esc(h.nick||h.name)} accepted the demon's gift: ${esc(offers[c].t.toLowerCase())}.`,"magic");
  await say(`The figure laughs, a sound like a forge, and touches ${h.nick||"the "+h.name}'s brow. Heat floods through them. "Done." Then it is gone, and the cracks in the floor go dark.`,1800,true);$("tBox").hidden=true;hud();};
{const base=applyLevel;applyLevel=function(h,init){const r=base(h,init);if(h.hpCurse){h.maxHp=Math.max(1,h.maxHp-h.hpCurse);h.hp=Math.min(h.hp,h.maxHp);}return r;};}
{const base=score;score=function(h,a){const v=base(h,a);return h&&h.demonAsi&&h.demonAsi[a]?Math.max(1,Math.min(30,v+h.demonAsi[a])):v;};}
{const base=saveBonus;saveBonus=function(u,a){return base(u,a)-(u.saveCurse||0);};}
{const base=heroDV;heroDV=function(h){return base(h)||!!(h&&h.devilEyes);};}
{const base=langsOf;langsOf=function(h){const l=base(h);return h.allTongues?l.concat(Object.values(MLANG)):l;};}
Object.assign(BLOCKERS,{demon:1});BUMP_NAME.demon="A shape of smoke and fire";
Object.assign(D2_DRAW,{hellfloor:(f,o,t)=>{const g=o.dim?.15:.35+.2*Math.sin(t/300+o.x+o.y);f(`rgba(200,40,20,${g})`,0,0,16,16);f(`rgba(255,120,40,${g})`,(o.x*7)%12,(o.y*5)%12,4,1);f(`rgba(255,120,40,${g})`,(o.y*3)%10+3,(o.x*9)%12,1,4);},
  demon:(f,o,t)=>{const b=Math.round(Math.sin(t/300)*1);f("rgba(40,10,10,.8)",2,-8+b,12,22);f("#5a1010",3,-6+b,10,18);f("#8a2010",4,-4+b,8,8);f("#ffd040",5,-2+b,2,1);f("#ffd040",9,-2+b,2,1);f("#1a0808",6,1+b,4,1);
    f("#3a0808",2,-10+b,2,4);f("#3a0808",12,-10+b,2,4);f(`rgba(255,100,30,${.3+.2*Math.sin(t/150)})`,1,12,14,3);}});
// d2Step: orcs and bandits get a look at you first
{const base=d2Step;d2Step=async function(){if(mode==="explore"&&G&&!G.over&&!G.demo&&G.party.length){if(await orcTick())return;if(await banditCovet())return;}return base();};}
