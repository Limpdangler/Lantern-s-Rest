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
