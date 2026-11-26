// ================= the living dungeon: themes & routes, noise, patrols, factions, goals, unknown items, puzzles, companions, town =================
// ---------- floor themes & choosing your route ----------
const THEMES={
  warrens:{name:"Goblin Warrens",desc:"Goblin and orc gangs. More gold, and merchants like it here.",fac:["goblins"],pal:"earth",merchant:.75,gold:2},
  crypt:{name:"Old Crypt",desc:"The restless dead. Shrines, old relics and puzzles.",fac:["undead"],pal:"ruin",shrine:.8,coffer:.7},
  flooded:{name:"Flooded Caves",desc:"Water everywhere, oozes and spiders. Slow going, but more potions.",fac:["beasts","none"],pal:"crystal",water:3,potions:2},
  den:{name:"Beast Den",desc:"Wolves, rats and spiders. Plenty of old timber for fires.",fac:["beasts"],pal:"earth",wood:2},
  mines:{name:"Kobold Mines",desc:"Kobold tunnels: extra traps, and the lamp oil they run on.",fac:["kobolds"],pal:"ruin",traps:3,oil:2}
};
const THEME_KEYS=Object.keys(THEMES);
const GROUP_FAC=["goblins","kobolds","beasts","beasts","beasts","undead","none","goblins"];
GROUPS.forEach((g,i)=>g.fac=GROUP_FAC[i]||"none");
function pickGroup(list){const th=THEMES[G.theme];const w=list.map(g=>th&&th.fac.includes(g.fac)?5:1);let q=Math.random()*w.reduce((a,b)=>a+b,0);for(let i=0;i<list.length;i++){q-=w[i];if(q<=0)return list[i];}return list[0];}
const HINTS={warrens:["Smoke, and the stink of unwashed bodies.","Distant cackling echoes up the shaft."],crypt:["Cold, still air. A faint smell of old incense.","Utter silence. Too silent."],
  flooded:["The sound of dripping water, everywhere.","The walls glisten wet in the lantern light."],den:["Deep claw marks score the rock.","A musky, animal smell drifts up."],mines:["Old cart rails vanish into the dark.","A sharp tang of lamp oil hangs in the air."]};
async function chooseRoute(){const opts=shuffle(THEME_KEYS.slice()).slice(0,2);
  const c=await choose(`Two tunnels lead down to floor ${G.floor+1}. Which way?`,opts.map((k,i)=>({t:i?"RIGHT TUNNEL":"LEFT TUNNEL",sub:pick(HINTS[k])})));
  G.theme=opts[Math.max(0,c)];log(`The party heads into the ${esc(THEMES[G.theme].name)}.`,"lv");}
// ---------- hostile factions ----------
function hostileFac(a,b){if(!a||!b||a===b||a==="none"||b==="none")return false;if(a==="undead"||b==="undead")return true;return (a==="goblins"&&b==="kobolds")||(a==="kobolds"&&b==="goblins");}
const avgDice=s=>{const p=parseDice(s);return p?p.n*(p.d+1)/2+p.b:3;};
async function factionClash(){if(mode!=="explore")return;const L=G.party[0];
  const gids=[...new Set(G.mons.filter(m=>m.hp>0&&!m.inCombat&&m.fac&&cheb(m,L)<=16).map(m=>m.gid))];
  for(let i=0;i<gids.length;i++)for(let j=i+1;j<gids.length;j++){const A=G.mons.filter(m=>m.gid===gids[i]&&m.hp>0),B=G.mons.filter(m=>m.gid===gids[j]&&m.hp>0);
    if(!A.length||!B.length||!hostileFac(A[0].fac,B[0].fac))continue;
    if(!A.some(a=>B.some(b=>cheb(a,b)<=5&&los(a.x,a.y,b.x,b.y))))continue;
    const seenIt=A.concat(B).some(m=>seen(m.x,m.y));
    for(let r=0;r<10&&A.some(m=>m.hp>0)&&B.some(m=>m.hp>0);r++){for(const [S1,S2] of [[A,B],[B,A]])for(const m of S1){if(m.hp<=0)continue;const t=pick(S2.filter(q=>q.hp>0));if(!t)break;if(Math.random()<.6){const d=Math.max(1,Math.round(avgDice(m.dmg)));t.hp-=d;if(seenIt)float(t,"-"+d,"#ffe060");}}}
    const dead=A.concat(B).filter(m=>m.hp<=0);for(const m of dead)makeCorpse(m);if(G.goal&&G.goal.target&&dead.includes(G.goal.target)&&!G.goal.done)G.goal.failed=true;for(const m of dead){const k=G.mons.indexOf(m);if(k>=0)G.mons.splice(k,1);if(m.hasKey)G.items.push({x:m.x,y:m.y,item:"key"});}
    const win=A.some(m=>m.hp>0)?A:B;for(const m of win){m.hp=Math.max(1,m.hp);m.state="idle";}
    if(seenIt){await say(`The ${A[0].name}s and the ${B[0].name}s are sworn enemies: they fall on each other! ${dead.length} die before the ${win[0].name}s win.`,1800,true);$("tBox").hidden=true;}
    else{toast("Somewhere nearby, the clash of a fight echoes and goes quiet...");log("You hear monsters fighting each other somewhere nearby.","miss");}
    makeNoise(win[0].x,win[0].y,8);return;}}
// ---------- noise, patrols & investigation ----------
function makeNoise(x,y,r){for(const m of G.mons){if(m.hp<=0||m.peace||m.inCombat||m.state==="hunt"||cheb(m,{x,y})>r)continue;
    if(m.state==="sleep"&&Math.random()<.4)continue;m.state="investigate";m.inv={x,y};m.lurk=false;m.bubble=now()+700;}}
function stepToward(m,gx,gy){const dist=dijkstra(m,30);let best=null,bd=1e9;for(const [k,v] of dist){const x=k%G.W,y=(k/G.W)|0;const d=Math.abs(x-gx)+Math.abs(y-gy)+v.c*.01;if(d<bd&&!unitAt(x,y)){bd=d;best=k;}}
  if(best===null)return;const p=pathTo(dist,best);const s=p[0];if(s===undefined)return;const x=s%G.W,y=(s/G.W)|0;if(unitAt(x,y)||objAt(x,y)&&BLOCKERS[objAt(x,y).type])return;faceToward(m,x-m.x,y-m.y);m.x=x;m.y=y;}
function wanderStep(){for(const m of G.mons){if(m.hp<=0||m.inCombat||m.peace)continue;
    if(m.state==="investigate"&&m.inv){stepToward(m,m.inv.x,m.inv.y);if(cheb(m,m.inv)<=1){m.state="patrol";m.inv=null;}}
    else if(m.state==="patrol"){if(!m.goal||cheb(m,m.goal)<=1){const r=pick(G.rooms.filter(r=>r.role!=="secret"&&r.role!=="vault"));m.goal={x:r.cx,y:r.cy};}if(Math.random()<.8)stepToward(m,m.goal.x,m.goal.y);}}}
function wakeWanderers(){if(floorCleared())return;const sleepers=[...new Set(G.mons.filter(m=>m.state==="sleep"&&!m.boss).map(m=>m.gid))];if(!sleepers.length)return;
  const gid=pick(sleepers);for(const m of G.mons)if(m.gid===gid){m.state="patrol";m.goal=null;}
  log("Somewhere in the dark, something wakes and starts to prowl...","miss");}
// ---------- floor goals ----------
const EPITHETS=["the Cruel","Bonebreaker","the Hungry","One-Eye","the Butcher","Gutripper","the Pale","Ironhide"];
const BOSSNAMES=["Grukk","Snarl","Vex","Mogra","Skarr","Ulda","Rikkit","Hollow Tom"];
function setupGoal(last){if(last){G.goal={type:"boss",desc:`Defeat the ${S.boss.name}`,done:false};return;}
  const type=pick(["rescue","relic","named"]);const rooms=G.rooms.filter(r=>!r.role);
  if(type==="named"){const c=G.mons.filter(m=>!m.boss&&["orc","goblinboss","wolf","spider","skeleton","goblin","kobold"].includes(m.key));if(c.length){const m=pick(c);
      m.name=`${pick(BOSSNAMES)} ${pick(EPITHETS)}`;m.named=true;m.hp=m.maxHp=Math.round(m.maxHp*1.8)+4;m.ac+=1;m.hit+=1;m.xp*=3;m.state=m.state==="sleep"?"idle":m.state;m.lurk=false;
      G.goal={type,desc:`Slay ${m.name}`,done:false,target:m};return;}}
  if(type==="rescue"&&rooms.length){const held=G.mons.length?roomOf(pick(G.mons).x,pick(G.mons).y):null;const r=held&&!held.role?held:pick(rooms);const p=interiorFree(r,true);
    if(p){G.objs.push({type:"captive",x:p.x,y:p.y});G.goal={type,desc:"Free the captive",done:false};return;}}
  if(rooms.length){const far=rooms.slice().sort((a,b)=>cheb(b,G.party[0])-cheb(a,G.party[0]))[0];const p=interiorFree(far,true);
    if(p){G.objs.push({type:"relic",x:p.x,y:p.y});G.goal={type:"relic",desc:"Recover the relic and bring it to the ladder",done:false};return;}}
  G.goal=null;}
async function goalDone(extra){if(!G.goal||G.goal.done)return;G.goal.done=true;const gold=25*G.floor,xp=15*G.floor;G.gold+=gold;
  const gear=Object.keys(ITEMS).filter(k=>ITEMS[k].kind==="gear"&&!ITEMS[k].cursed&&ITEMS[k].floor<=G.floor);const it=pick(gear);addItem(it);
  log(`Goal complete: ${esc(G.goal.desc)}. +${gold} gold, +${xp} XP, and ${esc(itemName(it))}.`,"gold");
  await say(`Goal complete! ${extra||""} Reward: ${gold} gold, ${xp} XP and ${aN(itemName(it))}.`,1800,true);for(const m of gainXpNow(xp))await say(m,1300,true);$("tBox").hidden=true;hud();}
async function captiveInteract(o){const th=bestAt("thieves"),at=bestAt("athletics");
  const c=await choose("A prisoner in chains, gagged and terrified. They plead with their eyes.",[{t:"PICK THE LOCKS",sub:`${oddsTag(th,"thieves",12)}${toolNote(th)} · quiet`},{t:"BREAK THE CHAINS",sub:`${oddsTag(at,"athletics",14)} · loud!`},{t:"LEAVE THEM"}]);
  if(c===2||c<0){$("tBox").hidden=true;return;}if(o.fail&&o.fail[c]){toast(o.fail[c]);$("tBox").hidden=true;return;}const r=c===0?await check(th,"thieves",12):await check(at,"athletics",14);if(c===1)makeNoise(o.x,o.y,10);G.steps+=5;
  if(!r.ok){o.fail=o.fail||{};o.fail[c]=c===0?"The locks won't give.":"The chains hold fast.";await say(`${o.fail[c]} (${r.txt})`,1000,true);$("tBox").hidden=true;return;}
  o.gone=true;approve("rescue");await goalDone(`"Bless you! I'll find my own way out." (${r.txt})`);}
async function relicInteract(o){const c=await choose("An ancient idol of gold and jade on a little plinth. This is what the goal is about.",[{t:"TAKE IT"},{t:"LEAVE IT"}]);
  if(c!==0){$("tBox").hidden=true;return;}o.gone=true;addItem("relic");await say("You wrap the idol carefully. Bring it to the ladder down.",1300,true);$("tBox").hidden=true;hud();}
// ---------- puzzle coffers ----------
const SYMS=["SUN","MOON","STAR","FLAME","WAVE","CROWN"];
const RIDDLES=[{ans:["SUN","MOON","STAR"],text:"First the lord of the day, then the lady of the night, and last her thousand children."},
  {ans:["WAVE","FLAME","CROWN"],text:"The sea came first. Then fire swallowed the land. Only then did a king rise from the ash."},
  {ans:["STAR","WAVE","SUN"],text:"Sailors trust the little lights, ride the tide home, and rest when dawn breaks."},
  {ans:["CROWN","SUN","FLAME"],text:"Kneel to the king, then to the sky's bright eye, and burn whatever is left."},
  {ans:["MOON","WAVE","STAR"],text:"She pulls the sea, and the sea holds up a mirror to her children."},
  {ans:["FLAME","STAR","MOON"],text:"The hearth is lit at dusk; the sky fills with sparks; at last the pale one climbs."}];
async function cofferInteract(o){if(o.opened){toast("The coffer is empty.");return;}const R=o.riddle;const sage=bestAt("history");
  const c=await choose(`A stone coffer with three dials: ${SYMS.join(", ")}. Carved on the lid: "${R.text}"${o.hint?` (The ${o.hint} worked it out: ${R.ans.join(", ")}.)`:""}`,
    [{t:"TURN THE DIALS",sub:"Wrong answers fire a hidden dart"},{t:"STUDY THE CARVING",sub:o.studied?"Already studied":oddsTag(sage,"history",13)},{t:"LEAVE IT"}]);
  if(c===1&&o.studied){toast(o.hint?`The order is ${R.ans.join(", ")}.`:"Nobody can place the story.");$("tBox").hidden=true;return;}if(c===1){o.studied=true;const r=await check(sage,"history",13);if(r.ok)o.hint=sage.name;await say(r.ok?`The ${sage.name} knows this old tale! (${r.txt}) The order is ${R.ans.join(", ")}.`:`The ${sage.name} can't place the story. (${r.txt}) You'll have to work out the riddle yourself.`,1600,true);$("tBox").hidden=true;return;}
  if(c!==0){$("tBox").hidden=true;return;}
  const seq=[];for(let i=0;i<3;i++){const k=await choose(`Dial ${i+1} of 3${seq.length?" (so far: "+seq.join(", ")+")":""}:`,SYMS.map(s=>({t:s})));if(k<0){$("tBox").hidden=true;return;}seq.push(SYMS[k]);}
  if(seq.join()===R.ans.join()){o.opened=true;const loot=rollLoot(true);G.gold+=loot.gold;for(const id of loot.items)addItem(id);approve("puzzle");
    await say(`Click... click... CLUNK. The lid grinds open! Inside: ${loot.gold} gold, ${loot.items.map(itemName).join(", ")}.`,1800,true);}
  else{const h=G.party[0];const s=saveRoll(h,"dex",13);const dm=roll(`1d6+${G.floor}`).total;await say(`Wrong! A dart shoots from the lid. (${s.txt})`,1000,true);await dealDamage(h,s.ok?Math.floor(dm/2):dm,"piercing",{});}
  $("tBox").hidden=true;hud();}
// ---------- unidentified items ----------
const KNOWN_START=["potion","antitoxin","oil","torch","ration","firewood","key","relic"];
const itemName=id=>!ITEMS[id]?id:(G&&G.known&&!G.known.has(id)&&ITEMS[id].unk)?ITEMS[id].unk:ITEMS[id].name;
const itemDesc=id=>(G&&G.known&&!G.known.has(id)&&ITEMS[id].unk)?(ITEMS[id].kind==="gear"?"Unidentified. Equip it to find out (risky), or identify it with Arcana.":"Unidentified. Identify it first."):ITEMS[id].desc;
const isKnown=id=>!ITEMS[id].unk||(G.known&&G.known.has(id));
async function identify(id,how){const pot=ITEMS[id].kind==="use"&&!id.startsWith("scroll");const sk=pot?"medicine":"arcana";const h=bestAt(sk);
  if(G.idTried.has(id)){alertMenu(G.idMsg&&G.idMsg[id]||"You can't work out what it is.");return;}
  G.idTried.add(id);const r=await check(h,sk,12,{quiet:true});if(r.ok){G.known.add(id);alertMenu(`${h.name} identifies it: ${ITEMS[id].name}! (${r.txt})`);}else{G.idMsg=G.idMsg||{};G.idMsg[id]=`${h.name} can't work out what it is.`;alertMenu(`${h.name} can't work out what it is. (${r.txt})`);}}
// ---------- companions: names, personalities and approval ----------
const NAMES={human:["Bram","Elsa","Tomas","Mira","Corin","Hild","Osric"],elf:["Aelar","Shava","Thia","Ivellios","Naeris","Sariel"],dwarf:["Thrain","Hilda","Dagnal","Vistra","Orsik","Brenna"],
  halfling:["Pip","Rosie","Merric","Callie","Finn","Lavinia"],halforc:["Grisha","Thokk","Ront","Shump","Volen","Engong"],tiefling:["Ash","Mordai","Nemeia","Kallista","Damakos","Rieta"],beast:["Fang","Shadow","Ash","Grey","Bramble"]};
const TRAITS={brave:{name:"Brave",likes:"attacking first, fighting fair",dislikes:"paying off enemies, cowering"},
  cautious:{name:"Cautious",likes:"sneaking, careful rests",dislikes:"reckless fights, fires at camp"},
  greedy:{name:"Greedy",likes:"treasure, lies that pay",dislikes:"giving gold away"},
  pious:{name:"Pious",likes:"prayer, offerings, honesty",dislikes:"deceit"},
  kind:{name:"Kind",likes:"mercy, rescuing people",dislikes:"bullying"},
  ruthless:{name:"Ruthless",likes:"intimidation, wiping out enemies",dislikes:"mercy"}};
const TRAIT_KEYS=Object.keys(TRAITS);
const EVT={toll:{greedy:-2,kind:1,brave:-2},intimidate:{ruthless:2,kind:-2},persuade:{kind:2,ruthless:-1,pious:1},deceive:{pious:-2,ruthless:1,greedy:1},
  attackfirst:{brave:1,cautious:-1},sneakwin:{cautious:2,brave:-1},pray:{pious:2,greedy:-1},offer:{pious:1,greedy:-2},chest:{greedy:1},ambushed:{cautious:-2,brave:1},
  firecamp:{cautious:-1},coldcamp:{cautious:1,brave:-1},rescue:{kind:3,pious:1,greedy:-1},puzzle:{greedy:1,cautious:1},cleared:{brave:1,ruthless:1,cautious:1},shortrest:{cautious:1,brave:-1}};
const LINES={brave:["\"Now THAT's how it's done!\"","\"Cowardice. I didn't come down here to hide.\""],cautious:["\"Good. Careful keeps us alive.\"","\"That was reckless. Someone's going to die.\""],
  greedy:["\"Ha! Shiny.\"","\"That was OUR gold!\""],pious:["\"The gods smile on us.\"","\"The gods see our lies.\""],kind:["\"That was the right thing to do.\"","\"Was that really necessary?\""],ruthless:["\"Good. Show no mercy.\"","\"Soft. You're too soft.\""]};
function nameHero(h){h.nick=pick(NAMES[h.race]||NAMES.human);if(h.id!=="beast")h.trait=pick(TRAIT_KEYS);h.appr=0;}
function approve(ev){const e=EVT[ev];if(!e||!G)return;let best=null,bd=0;
  for(const h of G.party){if(h.dead||h.isYou||!h.trait)continue;const d=e[h.trait]||0;if(!d)continue;const was=h.appr||0;h.appr=Math.max(-10,Math.min(10,was+d));
    if(Math.abs(d)>bd){bd=Math.abs(d);best={h,d};}if(d>=2&&!h.insp){h.insp=true;log(`${esc(h.nick||h.name)} is inspired! (They'll reroll their next failed d20.)`,"gold");}
    if(was<5&&h.appr>=5)log(`${esc(h.nick)} is now Loyal: +1 to attacks and saves.`,"gold");
    if(was>-5&&h.appr<=-5)log(`${esc(h.nick)} is unhappy with how things are going.`,"hurt");}
  if(best){toast(`${best.h.nick} (${TRAITS[best.h.trait].name}): ${LINES[best.h.trait][best.d>0?0:1]}`);}}
const loyalBonus=u=>u&&u.side==="h"&&(u.appr||0)>=5?1:0;
async function checkDeserters(){for(const h of G.party.slice()){if(h.dead||h.isYou||!h.trait||(h.appr||0)>-8)continue;
    await say(`${h.nick} the ${h.name} has had enough: "I'm done. Find someone else to drag through the dark." They leave the party.`,2000,true);
    for(const id of h.gear)addItem(id);G.party.splice(G.party.indexOf(h),1);log(`${esc(h.nick)} left the party.`,"hurt");}
  $("tBox").hidden=true;hud();}
const heroLabel=h=>h.nick&&h.id!=="beast"?`${h.nick} the ${h.name}`:h.nick?`${h.nick} the wolf`:h.name;
// ---------- the town between runs ----------
const TOWN_KEY="lantern-crawl-town-v1";
const TOWN_UP=[{id:"pack",name:"Quartermaster",desc:"Start every run with +2 rations and +2 firewood.",cost:60},
  {id:"lamp",name:"Lamplighter",desc:"Start with 2 extra oil flasks for your lantern.",cost:50},
  {id:"apoth",name:"Apothecary",desc:"Start with 2 extra healing potions.",cost:80},
  {id:"library",name:"Sage's Library",desc:"+3 to every monster lore check (History, Nature, Religion, Arcana).",cost:90},
  {id:"healer",name:"Healer's Hut",desc:"3 short rests between long rests instead of 2.",cost:110},
  {id:"armoury",name:"Armoury",desc:"Start each run with a random magic item, already identified.",cost:150},
  {id:"yard",name:"Training Yard",desc:"Start every run at party level 2.",cost:220}];
function loadTown(){try{const t=JSON.parse(localStorage.getItem(TOWN_KEY)||"null");if(t&&typeof t.coins==="number")return Object.assign({coins:0,up:{},fallen:[],runs:0,best:0},t);}catch(e){}return {coins:0,up:{},fallen:[],runs:0,best:0};}
function saveTown(){try{localStorage.setItem(TOWN_KEY,JSON.stringify(TOWN))}catch(e){}}
let TOWN=loadTown();
const hasUp=k=>!!TOWN.up[k];
function bankRun(won){if(!G||G.banked||G.demo)return 0;G.banked=true;const n=Math.floor(G.gold/2)+G.kills*2+(G.floor-1)*15+(won?150:0);TOWN.coins+=n;TOWN.runs++;TOWN.best=Math.max(TOWN.best,G.floor);
  const lost=(G.fallen||[]).concat(won?[]:G.party);for(const h of lost)TOWN.fallen.unshift(`${heroLabel(h)} (${RACES[h.race]?RACES[h.race].name:""}), fell on floor ${G.floor}`);TOWN.fallen=TOWN.fallen.slice(0,12);saveTown();return n;}
function renderTown(msg){const el=$("townBody");el.innerHTML="";
  el.insertAdjacentHTML("beforeend",`${msg?`<p class="msg">${msg}</p>`:""}<p>Lantern's Rest, the last village before the dark. Coins earned on every run (won or lost) stay here and buy lasting help.</p>
    <p><b>Town coins: ${TOWN.coins}</b> · runs ${TOWN.runs} · deepest floor ${TOWN.best||"–"}</p>`);
  for(const u of TOWN_UP){const d=document.createElement("div");d.className="item";d.style.gridTemplateColumns="1fr auto";const own=hasUp(u.id);
    d.insertAdjacentHTML("beforeend",`<div><b>${esc(u.name)}</b>${own?" ✓":""}<br><span class="sm">${esc(u.desc)}</span></div>`);
    const b=document.createElement("button");b.type="button";b.className="chip";b.textContent=own?"BUILT":`BUILD ${u.cost}`;b.disabled=own||TOWN.coins<u.cost;b.addEventListener("click",()=>{TOWN.coins-=u.cost;TOWN.up[u.id]=1;saveTown();renderTown();});d.appendChild(b);el.appendChild(d);}
  if(TOWN.fallen.length)el.insertAdjacentHTML("beforeend",`<h3>THE MEMORIAL</h3><p class="sm">${TOWN.fallen.map(esc).join("<br>")}</p>`);}
function showTown(msg){renderTown(msg);show("ovTown");}
// ---------- floor extras that depend on the theme / goals ----------
function floorExtras(last){const th=THEMES[G.theme]||{};const normal=G.rooms.filter(r=>!r.role);const place=(r,obj)=>{const p=interiorFree(r,true);if(p){obj.x=p.x;obj.y=p.y;G.objs.push(obj);return obj;}return null;};
  if(!normal.length)return;
  for(let i=0;i<(th.water||0);i++)blob(pick(normal),GROUND.water,ri(3,7));
  for(let i=0;i<(th.wood||0);i++)place(pick(normal),{type:"wood"});
  for(let i=0;i<(th.potions||0);i++){const p=interiorFree(pick(G.rooms),false);if(p)G.items.push({x:p.x,y:p.y,item:"potion"});}
  for(let i=0;i<(th.rations||0);i++){const p=interiorFree(pick(G.rooms),false);if(p)G.items.push({x:p.x,y:p.y,item:"ration"});}
  for(let i=0;i<(th.oil||0);i++){const p=interiorFree(pick(G.rooms),false);if(p)G.items.push({x:p.x,y:p.y,item:"oil"});}
  if(th.gold)for(let i=0;i<2;i++){const p=interiorFree(pick(G.rooms),false);if(p)G.items.push({x:p.x,y:p.y,gold:ri(6,14)*G.floor});}
  if(!last&&th.merchant&&!G.objs.some(o=>o.type==="merchant")&&Math.random()<th.merchant)place(pick(normal),{type:"merchant",stock:shopStock()});
  if(th.shrine&&!G.objs.some(o=>o.type==="shrine")&&Math.random()<th.shrine)place(pick(normal),{type:"shrine",used:false});
  if(!last&&(G.floor>=2||th.coffer)&&Math.random()<(th.coffer||.35))place(pick(normal),{type:"coffer",riddle:pick(RIDDLES),opened:false});
  if(th.traps){const tw=Object.keys(TRAPS);for(let i=0,g=0;i<th.traps&&g<200;g++){const x=ri(1,G.W-2),y=ri(1,G.H-2);if(isWall(x,y)||reserved(x,y)||doorAt(x,y)||elevAt(x,y)||trapAt(x,y)||objAt(x,y))continue;const rr=roomOf(x,y);if(rr&&rr.role==="start")continue;if(cheb({x,y},G.party[0])<5)continue;G.traps.push({x,y,type:pick(tw),dc:11+Math.ceil(G.floor/2),found:false,done:false});i++;}}
  // food is rare: only creatures that actually live down here keep larders
  for(const gid of new Set(G.mons.filter(m=>m.fac==="goblins"||m.fac==="kobolds").map(m=>m.gid))){if(Math.random()>.4)continue;const m=G.mons.find(q=>q.gid===gid);const r=roomOf(m.x,m.y);if(!r)continue;const p=interiorFree(r,false);if(p)G.items.push({x:p.x,y:p.y,item:"ration"});}
  // one group starts out patrolling
  const awake=[...new Set(G.mons.filter(m=>m.state==="idle"&&!m.lurk&&!m.parley&&!m.boss).map(m=>m.gid))];if(awake.length){const gid=pick(awake);for(const m of G.mons)if(m.gid===gid)m.state="patrol";}
  placeDressing();setupGoal(last);
  if(G.theme&&THEMES[G.theme].pal&&!last)G.pal=PALS[THEMES[G.theme].pal];}
