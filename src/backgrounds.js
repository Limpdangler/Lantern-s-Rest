// ================= backgrounds: what each hero did before the dungeon, told around the campfire =================
const BACKGROUNDS={
  medic:{name:"Combat Medic",sk:{medicine:2},story:"I followed a mercenary company for three years, stitching up whatever the swords left behind. You learn fast when the man on the table is screaming."},
  spy:{name:"Spy",sk:{persuasion:1,deception:1},story:"I spent four years at a duke's court pretending to be a wine steward. The wine was terrible. The secrets were excellent."},
  farmhand:{name:"Farmhand",sk:{athletics:2},story:"I grew up hauling hay bales and wrestling stubborn oxen. Dawn till dusk, every day. This is the first holiday I've had."},
  acrobat:{name:"Circus Acrobat",sk:{acrobatics:2},story:"I was the Flying Wren of Madame Orla's Travelling Circus. Forty feet up, no net. Dungeons don't scare me. Clowns, on the other hand..."},
  sailor:{name:"Sailor",sk:{athletics:1,perception:1},story:"Six years before the mast. Climbing rigging in a storm, watching for reefs in the dark. Then the ship sank and I swore off water."},
  hunter:{name:"Trapper",sk:{survival:2},story:"I trapped furs in the northern woods. Alone for months at a time. Honestly, all of you talking is still taking some getting used to."},
  acolyte:{name:"Temple Acolyte",sk:{religion:2},story:"I swept the floors of a great temple and memorised every prayer in its library. I left when I started asking the wrong questions."},
  scholar:{name:"Librarian's Apprentice",sk:{history:1,investigation:1},story:"I catalogued forgotten books in a university basement. Most of what I know about dungeons, I read. This is very different from reading."},
  urchin:{name:"Street Urchin",sk:{stealth:1,thieves:1},story:"I grew up on the streets of the docks. If it wasn't nailed down, it was mine. If it was nailed down, I had a crowbar."},
  guard:{name:"Town Guard",sk:{intimidation:1,perception:1},story:"Ten years on the night watch. Mostly drunks and lost goats. Once, a vampire. We don't talk about the vampire."},
  miner:{name:"Miner",sk:{athletics:1,investigation:1},story:"I dug silver in the deep shafts until the mine collapsed. I know how stone sounds before it falls. Listen... this place is fine. Probably."},
  apothecary:{name:"Apothecary's Assistant",sk:{medicine:1,arcana:1},story:"I ground herbs and mixed tinctures for a cranky old apothecary. Half his potions worked. The other half were very educational."},
  noble:{name:"Disgraced Noble",sk:{persuasion:2},story:"My family had a castle, a title and a great deal of money. Then my uncle lost all three in a single card game. So here I am."},
  gambler:{name:"Card Sharp",sk:{deception:1,insight:1},story:"I made my living in gambling dens, reading faces across the table. Funny you should mention that uncle... no, never mind."},
  herbalist:{name:"Village Herbalist",sk:{nature:2},story:"Every sickness in my village came to my door, and the forest had a cure for most of them. I came down here looking for a rare moss."},
  bouncer:{name:"Tavern Bouncer",sk:{intimidation:2},story:"I threw people out of the Rusty Flagon for six years. Most left when I asked nicely. I didn't ask nicely very often."},
  gravedigger:{name:"Gravedigger",sk:{religion:1,athletics:1},story:"I dug graves for a living. Quiet work, steady pay. Then some of my customers started digging themselves back out."},
  performer:{name:"Street Performer",sk:{persuasion:1,acrobatics:1},story:"I juggled, sang and tumbled for coins on market day. Tough crowds. Tougher than goblins, some of them."},
  shepherd:{name:"Shepherd",sk:{survival:1,perception:1},story:"I kept sheep on the high hills. Long days of watching for wolves. You'd be surprised how much you notice when nothing ever happens."},
  locksmith:{name:"Locksmith's Apprentice",sk:{thieves:2},story:"I made locks for rich merchants. Then I started wondering how good my locks really were. That's how I ended up leaving town quickly."}};
const SKILL_NAME=k=>k==="thieves"?"Lockpicking":k[0].toUpperCase()+k.slice(1);
const bgBonusText=k=>Object.entries(BACKGROUNDS[k].sk).map(([s,n])=>`+${n} ${SKILL_NAME(s)}`).join(", ");
{const base=skillBonus;skillBonus=function(u,sk){const b=base(u,sk);if(u&&u.side==="h"&&u.bg&&BACKGROUNDS[u.bg])return b+(BACKGROUNDS[u.bg].sk[sk]||0);return b;};}
const needsBg=h=>!h.dead&&h.id!=="beast"&&!h.rival&&!h.bg;
let campScene=null;
async function campfireTales(camp){const need=G.party.filter(needsBg);if(!need.length)return;
  const taken=()=>G.party.map(h=>h.bg).filter(Boolean);
  if(window.__skipIntro){for(const h of need){const pool=Object.keys(BACKGROUNDS).filter(k=>!taken().includes(k));h.bg=pick(pool.length?pool:Object.keys(BACKGROUNDS));}return;}
  const first=!G.party.some(h=>h.bg);const nm=h=>h.nick?`${h.nick} the ${h.name}`:`the ${h.name}`;
  campScene={fire:!camp||camp.type!=="cold",speaker:null};
  try{
    await say(first?`${camp&&camp.type==="cold"?"Huddled together in the dark":"Around the crackling fire"}, the party finally has a moment to breathe. Someone asks what everyone's been wondering: "So... what were you all doing before this?"`
      :`${camp&&camp.type==="cold"?"Huddled in the dark":"Around the fire"}, the others turn to ${need.length>1?"the newcomers":nm(need[0])}. "You've fought beside us. What's your story?"`,2200,true);
    for(const h of need){campScene.speaker=h;const pool=shuffle(Object.keys(BACKGROUNDS).filter(k=>!taken().includes(k))).slice(0,4);
      const c=await choose(`${cap(nm(h))} ${camp&&camp.type==="cold"?"pulls their cloak tighter":"stares into the flames"}. "Before all this, I was..."`,pool.map(k=>({t:BACKGROUNDS[k].name.toUpperCase(),sub:bgBonusText(k)})));
      const k=pool[Math.max(0,c)];h.bg=k;log(`${esc(h.nick||h.name)}'s background: ${esc(BACKGROUNDS[k].name)} (${esc(bgBonusText(k))}).`,"lv");
      await say(`"${BACKGROUNDS[k].story}" (${h.nick||h.name}: ${BACKGROUNDS[k].name}, ${bgBonusText(k)})`,2600,true);}
    if(need.length>1||first)await say("The stories run late into the night, until one by one the party drifts off to sleep.",1500,true);}
  finally{campScene=null;$("tBox").hidden=true;}}
{const base=applyLongRest;applyLongRest=async function(camp){if(G&&!G.demo&&G.party.some(needsBg))await campfireTales(camp);return base(camp);};}

// ---------- the campfire scene: everyone sitting around the fire, the speaker bobbing ----------
{const base=draw;draw=function(t,dt){if(!campScene)return base(t,dt);drawCampScene(t);};}
function drawCampScene(t){const W=SW,H=SH;ctx.fillStyle="#0b0809";ctx.fillRect(0,0,W,H);const cx=W/2,cy=Math.round(H*.58);const fire=campScene.fire;
  // stone floor speckles
  ctx.fillStyle="#1c1517";for(let i=0;i<70;i++){const x=(i*73)%W,y=(i*131)%H;ctx.fillRect(x,y,2,1);}
  // the glow
  const fl=fire?.85+.15*Math.sin(t/90)+.05*Math.sin(t/37):.35;const g=ctx.createRadialGradient(cx,cy,4,cx,cy,fire?95:45);g.addColorStop(0,`rgba(255,150,60,${.45*fl})`);g.addColorStop(1,"rgba(255,120,40,0)");ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
  const heroes=G.party.filter(h=>!h.dead);const n=heroes.length;const S2=n<=4?2:1;const rx=n<=4?70:62,ry=Math.max(n<=4?36:30,Math.round(H*.2));
  const spots=heroes.map((h,i)=>{const a=(n===2?0:n%2?-Math.PI/2:-Math.PI/2+Math.PI/n)+Math.PI*2*i/n;return {h,x:cx+Math.cos(a)*rx,y:cy+Math.sin(a)*ry,a};}).sort((p,q)=>p.y-q.y);
  const drawFire=()=>{ctx.fillStyle="#3a2a1a";ctx.fillRect(cx-12,cy+2,24,4);ctx.fillStyle="#5a3a22";ctx.fillRect(cx-10,cy,8,3);ctx.fillRect(cx+2,cy+1,9,3);ctx.fillStyle="#6a6460";for(const [dx,dy] of [[-14,4],[-9,7],[0,8],[9,7],[14,4],[-12,0],[12,0]])ctx.fillRect(cx+dx-1,cy+dy-1,3,2);
    if(fire){const f1=Math.floor(t/90)%3;ctx.fillStyle="#ff6a1a";ctx.fillRect(cx-6,cy-10+f1,12,12-f1);ctx.fillStyle="#ffa030";ctx.fillRect(cx-4,cy-14+((f1+1)%3),8,14);ctx.fillStyle="#ffe070";ctx.fillRect(cx-2,cy-8+((f1+2)%3),4,8);
      for(let i=0;i<3;i++){const p=((t/14+i*40)%60);ctx.fillStyle=`rgba(255,200,90,${1-p/60})`;ctx.fillRect(cx-4+((i*7+Math.floor(t/200))%9),cy-14-p,1,1);}}
    else{ctx.fillStyle=`rgba(255,90,30,${.4+.3*Math.sin(t/300)})`;ctx.fillRect(cx-3,cy+1,2,1);ctx.fillRect(cx+2,cy+2,1,1);}};
  let fireDrawn=false;
  for(const s of spots){if(!fireDrawn&&s.y>cy){drawFire();fireDrawn=true;}const h=s.h;const dx=cx-s.x,dy=cy-s.y;const dir=Math.abs(dx)>Math.abs(dy)*2.2?"s":dy>0?"f":"b";const flip=dir==="s"&&dx<0;
    const talking=campScene.speaker===h;const bob=talking?Math.round(Math.abs(Math.sin(t/160))*2):0;
    const img=h.wild?wildSpr(h):h.id==="beast"?monSpr("wolf"):heroSpr(h.look||h.id,dir,0,h.race);const w=img.width*S2,hh=img.height*S2;const x=Math.round(s.x-w/2),y=Math.round(s.y-hh+4-bob);
    ctx.fillStyle="rgba(0,0,0,.35)";ctx.fillRect(Math.round(s.x-6*S2),Math.round(s.y+2),12*S2,2*S2);
    ctx.save();if(flip){ctx.translate(x+w,y);ctx.scale(-1,1);ctx.drawImage(img,0,0,w,hh);}else ctx.drawImage(img,x,y,w,hh);ctx.restore();
    if(talking){const bx=Math.round(s.x)+(S2*6),by=y-8;ctx.fillStyle="#1a1216";ctx.fillRect(bx-1,by-1,16,10);ctx.fillStyle="#f4ecd8";ctx.fillRect(bx,by,14,8);ctx.fillRect(bx+2,by+8,3,2);
      ctx.fillStyle="#1a1216";const d=Math.floor(t/300)%4;for(let i=0;i<Math.min(3,d);i++)ctx.fillRect(bx+3+i*4,by+4,2,2);}}
  if(!fireDrawn)drawFire();}

// ================= more chances for every skill to matter =================
// History: old carvings in chapels, halls and libraries
D2_ACT.mural=async o=>{const h=bestAt("history");if(o.read){toast(o.msg||"Faded carvings you've already studied.");return;}
  const c=await choose("Old carvings cover the wall: kings, battles, and what might be a map.",[{t:"STUDY THE CARVINGS",sub:`History DC 12 · ${oddsTag(h,"history",12)}`},{t:"LEAVE THEM"}]);if(c!==0)return;o.read=true;G.steps+=4;
  const r=await check(h,"history",12);if(!r.ok){o.msg="Carvings too worn to make sense of.";await say(`Too worn to make sense of. (${r.txt})`,1000,true);return;}
  const poi=pointOfInterest();const L=G.party[0];
  if(poi&&Math.random()<.6){revealAround(poi.x,poi.y,2);o.msg=`The carvings showed ${poi.what} to the ${dirTo(o,poi)}.`;if(typeof note==="function")note(o.msg);
    await say(`The ${h.name} recognises the style: these are builders' plans. They show ${poi.what} to the ${dirTo(L,poi)} (marked on your map). (${r.txt})`,1800,true);}
  else{const xp=5*G.floor;o.msg="An old tale of the people who dug these halls.";await say(`The ${h.name} pieces together the story of the people who built this place. (+${xp} XP) (${r.txt})`,1500,true);for(const m of gainXpNow(xp))await say(m,1500,true);}};
D2_DRAW.mural=(f,o)=>{f("#4a4440",1,0,14,7);f("#6a6460",2,1,12,5);f("#8a8478",3,2,3,3);f("#8a8478",8,2,2,1);f("#8a8478",11,2,2,3);f("#5a5450",7,4,4,1);f("#3a3430",1,7,14,1);};
BUMP_NAME.mural="Old carvings";
// Nature: strange fungus that might be food, medicine or poison
D2_ACT.fungus=async o=>{if(o.picked){toast("Picked clean.");return;}const h=bestAt("nature");
  const c=await choose("A cluster of pale, faintly glowing mushrooms.",[{t:"IDENTIFY THEM",sub:`Nature DC 12 · ${oddsTag(h,"nature",12)}`},{t:"JUST EAT ONE",sub:"Feeling lucky?"},{t:"LEAVE THEM"}]);if(c===2||c<0)return;o.picked=true;
  if(c===0){const r=await check(h,"nature",12);
    if(!r.ok){await say(`The ${h.name} can't tell what they are. Better not risk it. (${r.txt})`,1100,true);return;}
    if(o.kind==="poison"){addItem("poisonvial");await say(`Deathcap! The ${h.name} carefully squeezes the juice into a vial: weapon poison. (${r.txt})`,1500,true);}
    else if(o.kind==="heal"){for(const x of heroesUp())heal(x,roll("1d4+1").total);await say(`Healer's cap: the ${h.name} brews them into a quick tea. Everyone heals a little. (${r.txt})`,1500,true);}
    else{addItem("ration");await say(`Cave oyster mushrooms: good eating. +1 ration. (${r.txt})`,1300,true);}hud();return;}
  const L=G.party[0];if(o.kind==="poison"){await say(`The ${L.name} takes a bite... and turns green.`,1000,true);await dealDamage(L,roll("2d4").total,"poison",{});}
  else if(o.kind==="heal"){heal(L,roll("1d4+1").total);await say(`Bitter, but the ${L.name} feels better for it.`,1100,true);}else await say("Chewy. Tastes of mud. Probably fine.",1000,true);hud();};
D2_DRAW.fungus=(f,o,t)=>{const g=.5+.5*Math.sin(t/400+o.x*3);const c=o.kind==="poison"?"#d0c8a0":o.kind==="heal"?"#a0d8b0":"#d8c8b0";
  for(const [x,y,s] of [[3,9,3],[8,7,4],[11,11,2],[6,12,2]]){f("#8a7a6a",x+Math.floor(s/2),y+s-1,1,3);f(c,x,y,s,Math.ceil(s/2)+1);f(`rgba(180,255,220,${.25*g})`,x,y,s,1);}};
BUMP_NAME.fungus="Glowing mushrooms";
{const fb=(k,extra)=>{const base=FURNISH[k];FURNISH[k]=function(r,add){base(r,add);extra(r,add);};};
  const mural=(r,add)=>{const sp=edgeSpots(r,"top").filter(p=>!G.objs.some(o=>o.x===p.x&&o.y===p.y));if(sp.length&&Math.random()<.75){const p=pick(sp);add("mural",p.x,p.y);}};
  fb("chapel",mural);fb("hall",mural);fb("library",mural);fb("prison",(r,add)=>{if(Math.random()<.3)mural(r,add);});
  fb("cellar",(r,add)=>{for(let i=0;i<ri(1,2);i++){const q=interiorFree(r,false);if(q)add("fungus",q.x,q.y,{kind:pick(["food","heal","poison"])});}});}
{const base=themeRooms;themeRooms=function(){base();if(G.demo)return;for(let i=0;i<ri(0,2);i++){const r=pick(G.rooms.filter(r=>!r.role||r.role==="stairs"));if(!r)break;const q=interiorFree(r,false);if(q)G.objs.push({type:"fungus",x:q.x,y:q.y,deco:true,kind:pick(["food","heal","poison"])});}};}
// Acrobatics: slick oil underfoot
{const base=onEnter;onEnter=async function(u,x,y,o){if(mode==="explore"&&G&&u===G.party[0]&&gnd(x,y)===GROUND.oil&&!fireAt(x,y)&&!G.sneak){G.slipped=G.slipped||[];const k=y*G.W+x;
    if(!G.slipped.includes(k)){G.slipped.push(k);const r=await check(u,"acrobatics",10);if(!r.ok){makeNoise(x,y,6);await say(`The ${u.name} skids on the oil and goes down with a clatter! (${r.txt})`,1100,true);await dealDamage(u,1,"bludgeoning",{});$("tBox").hidden=true;}}}
  return base(u,x,y,o);};}
// more chance events
EVENTS.push(
  {w:2,run:async L=>{const r=await check(L,"acrobatics",12);if(r.ok)await say(`The floor gives way under the ${L.name}'s foot, but they twist and roll clear as the stones drop into the dark. (${r.txt})`,1500,true);
    else{makeNoise(L.x,L.y,8);await say(`The floor crumbles! The ${L.name} drops into a shallow pit and has to be hauled out. (${r.txt})`,1400,true);await dealDamage(L,roll("1d6").total,"bludgeoning",{});}}},
  {w:1,run:async()=>{const h=bestAt("history");const r=await check(h,"history",12);const g=ri(3,8)*G.floor;
    if(r.ok){G.gold+=g*3;await say(`A handful of strange old coins lies in the dust. The ${h.name} recognises them: imperial crowns, worth far more to a collector. (${g*3} gold) (${r.txt})`,1600,true);}
    else{G.gold+=g;await say(`A handful of strange old coins lies in the dust. Worth ${g} gold for the metal, at least. (${r.txt})`,1400,true);}hud();}},
  {w:1,cond:()=>G.floor>=2,run:async L=>{const h=bestAt("insight");const r=await check(h,"insight",13);
    if(r.ok){await say(`A figure slumps against the wall, groaning for help. But the ${h.name} notices their boots are clean and their hand is near a knife. A trap! You give them a wide berth. (${r.txt})`,1800,true);return;}
    const sp=spawnSpots(L,2,4);if(!sp.length)return;const co={id:-1,gid:7600+(G.gidN=(G.gidN||0)+1),short:"Bandit",name:"bandits",leader:"The bandit"};const out=[];
    for(const cls of ["rogue","fighter"]){const p=out.length?nearFree(sp[0].x,sp[0].y):sp[0];if(!p)break;const m=makeRival(cls,co,p.x,p.y);m.peace=false;m.state="hunt";m.ambusher=true;m.rival=0;m.hp=m.maxHp=Math.max(6,m.maxHp-6);G.mons.push(m);out.push(m);}
    await say(`A wounded traveller begs for help. As the ${L.name} leans in, they draw a knife, and a second bandit leaps from the shadows! (${r.txt})`,1600,true);$("tBox").hidden=true;busy=false;startCombat({extra:out,by:out});}});
