// ================= fights the party walks into: sides (teams) in combat, skirmishes, aftermaths =================
// ---------- teams: monsters on different teams fight each other; a "neutral" team leaves the party alone ----------
function targetsOf(m){const out=m.neutral?[]:heroesUp().slice();if(C||m.team)for(const q of G.mons)if(q!==m&&q.hp>0&&(!C||q.inCombat)&&(q.team||"d")!==(m.team||"d")&&(q.team||m.team))out.push(q);return out;}
{const base=checkEnd;checkEnd=function(){if(mode==="combat"&&C){const live=C.units.filter(u=>u.side==="m"&&u.hp>0&&u.inCombat);
    if(live.length&&live.every(u=>u.neutral)&&heroesUp().length){for(const u of live){u.inCombat=false;u.state="idle";u.peace=true;}C.neutralLeft=live;}}
  return base();};}
// attacking someone who was leaving you alone makes their whole side hostile
function provoke(m,why){if(!m.neutral)return;for(const q of G.mons)if(q.team&&q.team===m.team){q.neutral=false;q.peace=false;if(C&&q.hp>0&&!q.inCombat&&cheb(q,m)<=10){q.inCombat=true;q.state="combat";rollInit(q,abm(q,"dex"));C.units.push(q);}}
  float(m,"BETRAYED!","#ff7a6a");log(`${esc(why||"You attacked them")}: the ${esc(m.name)}'s side turns on you!`,"hurt");if(C){C.units.sort(initOrder);renderStrip();}}
{const base=attack;attack=async function(a,t,w,o){if(a&&a.side==="h"&&t&&t.side==="m"&&t.neutral)provoke(t,`The ${a.name} attacked an ally of convenience`);return base(a,t,w,o);};}
// initiative already rolled for a fight that started before you arrived
{const base=rollInit;rollInit=function(u,bonus){if(u.keepInit!==undefined){u.init=u.keepInit;delete u.keepInit;return u.init;}return base(u,bonus);};}

// ---------- skirmishes ----------
const SK_MATCHES=[
  {a:{keys:["goblin","archer"],lang:"Goblin",label:"goblins"},b:{keys:["kobold"],lang:"Draconic",label:"kobolds"},w:3},
  {a:{keys:["wolf","rat","spider"],label:"beasts"},b:{adv:true,label:"adventurers"},w:3},
  {a:{bandit:true,label:"bandits"},b:{adv:true,label:"adventurers"},w:2},
  {a:{keys:["goblin","archer","shaman"],lang:"Goblin",label:"goblins"},b:{adv:true,label:"adventurers"},w:3},
  {a:{keys:["skeleton","bonearcher"],label:"the dead"},b:{keys:["goblin","archer"],lang:"Goblin",label:"goblins"},w:2},
  {a:{keys:["orc"],lang:"Orc",label:"orcs"},b:{keys:["wolf"],label:"wolves"},w:2}];
function skSideOK(s){if(s.adv||s.bandit)return true;return s.keys.some(k=>monByKey(k)&&monByKey(k).from<=G.floor);}
function spawnSkirmish(){if(G.demo||Math.random()>.4)return;const sr=G.rooms.find(r=>r.role==="start")||G.rooms[0];
  const rooms=G.rooms.filter(r=>!r.role&&r.w>=5&&r.h>=4&&cheb({x:r.cx,y:r.cy},{x:sr.cx,y:sr.cy})>=8&&!G.mons.some(m=>inRoom(r,m.x,m.y)));if(!rooms.length)return;const r=pick(rooms);
  const ms=SK_MATCHES.filter(m=>skSideOK(m.a)&&skSideOK(m.b));if(!ms.length)return;const tot=ms.reduce((a,m)=>a+m.w,0);let q=Math.random()*tot,mt=ms[0];for(const m of ms){q-=m.w;if(q<=0){mt=m;break;}}
  const id=(G.skN=(G.skN||0)+1);const sk={id,floor:G.floor,state:"pending",phase:pick(["start","start","middle","middle","end","over"]),sides:[]};
  const half=Math.floor(r.w/2);
  [mt.a,mt.b].forEach((S0,si)=>{const team=`sk${id}${si?"b":"a"}`;const gid=9000+id*2+si;const side={team,gid,label:S0.label,lang:S0.adv||S0.bandit?"Common":S0.lang||null,neutral:!!S0.adv,bandit:!!S0.bandit,adv:!!S0.adv};
    const co=S0.adv||S0.bandit?{id:-(id*2+si),gid,short:S0.bandit?"Bandit":pick(RIVAL_COS).short,name:S0.label,leader:pick(RIVAL_LEADERS)}:null;side.co=co;
    const n=ri(2,3);for(let i=0;i<n;i++){let p=null;for(let g=0;g<30&&!p;g++){const x=si?ri(r.x+half,r.x+r.w-1):ri(r.x,r.x+half-1),y=ri(r.y,r.y+r.h-1);if(!reserved(x,y)&&!elevAt(x,y))p={x,y};}if(!p)continue;
      let m;if(co){m=makeRival(pick(["fighter","rogue","ranger","cleric","wizard"].filter(c=>S.classes.some(d=>d.id===c))),co,p.x,p.y);m.rival=0;}
      else{const ks=S0.keys.filter(k=>monByKey(k)&&monByKey(k).from<=G.floor);m=mkMon(monByKey(pick(ks)),p.x,p.y);}
      m.gid=gid;m.team=team;m.skirmish=id;m.peace=true;m.state="idle";m.fac=null;G.mons.push(m);}
    sk.sides.push(side);});
  G.skirmishes=(G.skirmishes||[]).filter(s=>s.floor===G.floor);G.skirmishes.push(sk);}
{const base=placeDressing;placeDressing=function(){base();spawnSkirmish();};}
const skUnits=(sk,side)=>G.mons.filter(m=>m.skirmish===sk.id&&m.hp>0&&(!side||m.team===side.team));
const skSideOf=(sk,m)=>sk.sides.find(s=>s.team===m.team);
function skKill(sk,m){m.hp=0;makeCorpse(m);const c=G.corpses[G.corpses.length-1];if(c)c.claim=sk.id;const k=G.mons.indexOf(m);if(k>=0)G.mons.splice(k,1);}
function skHurt(m,f){m.hp=Math.max(1,Math.round(m.maxHp*(1-f)));}
// what has happened by the time the party arrives
function skApplyPhase(sk){const [A,B]=sk.sides;const loser=Math.random()<.5?A:B;const winner=loser===A?B:A;sk.loser=loser.team;sk.winner=winner.team;
  if(sk.phase==="middle"){for(const m of skUnits(sk))skHurt(m,.2+Math.random()*.35);for(const s of sk.sides){const u=skUnits(sk,s);if(u.length>1&&Math.random()<.35)skKill(sk,pick(u));}}
  else if(sk.phase==="end"){const lu=skUnits(sk,loser);lu.slice(1).forEach(m=>skKill(sk,m));if(lu[0])skHurt(lu[0],.7+Math.random()*.2);for(const m of skUnits(sk,winner))skHurt(m,.2+Math.random()*.4);}
  else if(sk.phase==="over"){for(const m of skUnits(sk,loser))skKill(sk,m);for(const m of skUnits(sk,winner))skHurt(m,.3+Math.random()*.45);}}
function skDescribe(sk){const [A,B]=sk.sides;const a=skUnits(sk,A),b=skUnits(sk,B);const ph=sk.phase;
  if(ph==="start")return `You stumble onto a fight that's only just begun: ${A.label} and ${B.label} are squaring off, steel out!`;
  if(ph==="middle")return `You stumble onto a running battle between ${A.label} and ${B.label}. Both sides are bloodied${G.corpses.some(c=>c.claim===sk.id)?", and bodies already lie on the floor":""}.`;
  const lo=sk.sides.find(s=>s.team===sk.loser),wi=sk.sides.find(s=>s.team===sk.winner);
  return `You stumble onto the tail end of a fight: the ${wi.label} have all but beaten the ${lo.label}. Only one of the ${lo.label} is still standing, and barely.`;}
async function skReveal(sk){sk.revealed=true;skApplyPhase(sk);const L=G.party[0];
  if(sk.phase==="over"){sk.state="done";await skAftermath(sk,true);return;}
  for(const m of skUnits(sk))m.bubble=now()+900;
  const c=await choose(skDescribe(sk)+" Nobody has noticed you yet.",[{t:"JOIN THE FIGHT",sub:"Roll initiative and jump into the order"},{t:"WAIT AND WATCH",sub:`Stay put and let it play out${G.sneak?" (you're sneaking)":" · they might spot you"}`},{t:"HANG BACK",sub:"Keep exploring; it carries on without you"},{t:"SLIP AWAY",sub:"Back off quietly"}]);
  $("tBox").hidden=true;if(c===0){await skJoin(sk);return;}sk.state="watching";if(c===1)await skWait(sk);else if(c===3)toast("You back away from the fight. The clash of steel echoes behind you.");}
// do they notice the party watching? Sneaking: a Stealth contest. Otherwise: a fair chance each round, more if you're close
async function skNotice(sk){const L=G.party[0];const watchers=skUnits(sk).filter(m=>!m.neutral&&!skSideOf(sk,m).neutral&&cheb(m,L)<=10&&los(m.x,m.y,L.x,L.y));if(!watchers.length)return false;
  let spotted=null;for(const m of watchers){if(G.sneak){const here=L.y*G.W+L.x;if(sk.hidAt!==here){sk.hidAt=here;sk.hideRoll=Math.min(...heroesUp().map(h=>rnd(20)+skillBonus(h,"stealth")));sk.checked=[];}
      if(!sk.checked.includes(m.id||m.name+m.x)){sk.checked.push(m.id||m.name+m.x);if(sk.hideRoll<10+abm(m,"wis")+(m.tr.dv?0:2)){spotted=m;break;}}}
    else if(Math.random()<(cheb(m,L)<=4?.15:.06)){spotted=m;break;}}
  if(!spotted)return false;spotted.bubble=now()+900;float(spotted,"!","#ffffff");await say(`The ${spotted.name} glances your way mid-swing... and spots you!`,1100,true);$("tBox").hidden=true;await skJoin(sk);return true;}
async function skWait(sk){let n=0;while(sk.state==="watching"&&n++<40&&mode==="explore"){if(await skNotice(sk))return;sk.noNotice=true;try{await skRound(sk);}finally{sk.noNotice=false;}G.steps+=1;await wait(350);}
  if(sk.state==="watching"&&mode==="explore")toast("The fight drags on. You stop watching.");}
async function skJoin(sk){if(sk.state==="joined"||sk.state==="done")return;sk.state="joined";const units=skUnits(sk);const order=[];
  for(const m of units){m.peace=false;m.state="combat";m.neutral=!!(skSideOf(sk,m)||{}).neutral;m.keepInit=rnd(20)+abm(m,"dex");order.push(m);}
  order.sort((a,b)=>b.keepInit-a.keepInit);log(`The fight is already under way. Their order: ${order.map(m=>`${esc(m.name)} ${m.keepInit}`).join(", ")}. The party rolls in.`,"magic");
  const ad=sk.sides.find(s=>s.neutral);if(ad)log(`The ${esc(ad.label)} are fighting on your side for now. They won't attack you unless you attack them.`,"lv");
  busy=false;await startCombat({extra:units});}
// one round of a fight you're watching from a distance
async function skRound(sk){const L=G.party[0];const units=skUnits(sk);let any=false;if(!sk.noNotice&&mode==="explore"&&await skNotice(sk))return;
  for(const m of units){if(m.hp<=0)continue;const foes=units.filter(q=>q.hp>0&&q.team!==m.team).sort((a,b)=>cheb(a,m)-cheb(b,m));const t=foes[0];if(!t)break;
    if(cheb(t,m)>1&&weaponOf(m).melee){stepToward(m,t.x,t.y);continue;}
    if(Math.random()<.6){const d=Math.max(1,Math.round(avgDice(m.dmg)));t.hp-=d;any=true;if(seen(t.x,t.y)){float(t,"-"+d,"#ffe060");m.bubble=0;}if(t.hp<=0){t.hp=1;skKill(sk,t);}}}
  if(any&&!units.some(m=>seen(m.x,m.y)))log("The sounds of fighting echo nearby.","miss");
  const alive=sk.sides.filter(s=>skUnits(sk,s).length);if(alive.length<=1){sk.state="done";sk.winner=alive[0]?alive[0].team:null;sk.loser=(sk.sides.find(s=>s.team!==sk.winner)||{}).team;
    if(alive.length&&skUnits(sk).some(m=>cheb(m,L)<=10&&seen(m.x,m.y)))await skAftermath(sk,false);else if(alive.length)sk.awaitTalk=true;}}
// ---------- after the fight: the winners and the party ----------
function skSpeaks(side,m){if(side.lang==="Common")return true;return !!speakerFor(m);}
function skLooks(side,us){const r=rnd(20)+(us.length>1?2:0)+Math.max(0,...us.map(m=>abm(m,"cha"),0));// rolled in secret: how they come across, not how strong they are
  return r>=13?`They look formidable: blood on their blades, steady on their feet, eyes on you.`:`They try to look tough, puffing up and rattling their weapons, but it isn't very convincing.`;}
function skReadMood(m,hurt,hostile){const ins=heroesUp().filter(h=>h.id!=="beast").sort((a,b)=>skillBonus(b,"insight")-skillBonus(a,"insight"))[0]||heroesUp()[0];const ok=rnd(20)+skillBonus(ins,"insight")>=12;
  if(!ok)return `The ${ins.name} can't read them at all.`;return hurt?`The ${ins.name} reads their body language: they're scared and want this to be over.`:hostile?`The ${ins.name} reads their body language: they're spoiling for another fight.`:`The ${ins.name} reads their body language: wary, but not looking for trouble.`;}
async function skAftermath(sk,arrived){const side=sk.sides.find(s=>s.team===sk.winner);if(!side)return;const us=skUnits(sk,side);if(!us.length)return;const L=G.party[0];
  sk.awaitTalk=false;sk.talked=true;const hurt=us.reduce((a,m)=>a+m.hp/m.maxHp,0)/us.length<.5;const hostile=!side.neutral;const lead=us[0];const speak=skSpeaks(side,lead);
  for(const m of us){m.bubble=now()+900;faceToward(m,Math.sign(L.x-m.x),Math.sign(L.y-m.y));}
  const scene=arrived?`You come upon the aftermath of a fight: ${side.label} stand over the bodies of the ${sk.sides.find(s=>s.team===sk.loser).label}. They spot you.`:`The fight is over: the ${side.label} won. They turn to face you, breathing hard.`;
  const looks=skLooks(side,us);
  if(!speak){const mood=skReadMood(lead,hurt,hostile);
    const c=await choose(`${scene} ${looks} They shout something in ${side.lang||"snarls and growls"}. Nobody understands a word. ${mood}`,[{t:"ATTACK",sub:"While they're still catching their breath"},{t:"BACK AWAY SLOWLY"},{t:"STAND YOUR GROUND",sub:"See what they do"}]);$("tBox").hidden=true;
    if(c===0){await skFight(sk,side,true);return;}
    if(c===1||!hostile||hurt){skCalm(us);toast(hurt?"They watch you go, clutching their wounds.":"They let you go.");return;}
    await skFight(sk,side,false,"They come at you!");return;}
  if(hostile&&!hurt){const c=await choose(`${scene} ${looks} "${side.bandit?"Well, well. More pockets to empty.":"More meat!"}" they shout.`,[{t:"FIGHT",sub:"They're coming either way"},{t:"INTIMIDATE THEM",sub:`${oddsTag(bestAt("intimidation"),"intimidation",13)} · make them think twice`}]);$("tBox").hidden=true;
    if(c===1){const r=await check(bestAt("intimidation"),"intimidation",13);if(r.ok){skCalm(us);await say(`They exchange a look and decide you're not worth it. They back off. (${r.txt})`,1300,true);return;}await skFight(sk,side,false,`They laugh. (${r.txt}) Here they come!`);return;}
    await skFight(sk,side,true);return;}
  if(hostile&&hurt){const bribe=ri(5,12)*G.floor;const c=await choose(`${scene} ${looks} But they're badly hurt. "${side.bandit?"Easy, easy! No need for more blood. Here, take this and walk away.":"Wait! No more fighting! Take this, let us go!"}" They hold out a pouch: ${bribe} gold.`,
      [{t:"TAKE THE GOLD",sub:"And let them go"},{t:"ATTACK",sub:"Finish them while they're weak"},{t:"DEMAND MORE",sub:`${oddsTag(bestAt("intimidation"),"intimidation",13)}`},{t:"LET THEM GO",sub:"Keep your hands clean"}]);$("tBox").hidden=true;
    if(c===0){G.gold+=bribe;hud();skCalm(us);await say(`You pocket ${bribe} gold. They slink away from the bodies.`,1200,true);return;}
    if(c===1){approve("finish");await skFight(sk,side,true);return;}
    if(c===2){const r=await check(bestAt("intimidation"),"intimidation",13);if(r.ok){const g=bribe*2;G.gold+=g;hud();skCalm(us);await say(`They empty their pockets: ${g} gold. (${r.txt})`,1200,true);return;}await skFight(sk,side,false,`"That's all we've got!" They grab their weapons. (${r.txt})`);return;}
    approve("spare");skCalm(us);await say("You wave them off. They limp away gratefully.",1100,true);return;}
  // adventurers: they claim the spoils, or beg for help
  if(hurt&&(G.bag.potion||0)>0){const pay=ri(15,25)*G.floor;const c=await choose(`${scene} ${looks} "Please, you wouldn't have any healing on you? We'll pay ${pay} gold."`,[{t:"GIVE THEM A POTION",sub:`+${pay} gold`},{t:"REFUSE"},{t:"ATTACK THEM",sub:"They're in no shape to fight"}]);$("tBox").hidden=true;
    if(c===0){noBottle=true;takeItem("potion");noBottle=false;G.gold+=pay;hud();approve("spare");skCalm(us);sk.friendly=true;await say(`They gulp it down and pay up. "We owe you. The bodies are yours if you want them."`,1500,true);return;}
    if(c===2){approve("finish");await skFight(sk,side,true);return;}}
  const c=await choose(`${scene} ${looks} "Back off, these spoils are ours."`,[{t:"LEAVE THEM BE"},{t:"OFFER TO SPLIT THE LOOT",sub:`${oddsTag(bestAt("persuasion"),"persuasion",12)}`},{t:"INTIMIDATE THEM",sub:`${oddsTag(bestAt("intimidation"),"intimidation",14)} · make them leave it`},{t:"ATTACK THEM"}]);$("tBox").hidden=true;
  if(c===1){const r=await check(bestAt("persuasion"),"persuasion",12);if(r.ok){sk.friendly=true;skCalm(us);await say(`"Fair enough. Take what you like from that lot." (${r.txt})`,1200,true);return;}await say(`"No chance." (${r.txt})`,900,true);}
  if(c===2){const r=await check(bestAt("intimidation"),"intimidation",14);if(r.ok){sk.friendly=true;skCalm(us);for(const m of us){const p=nearFree(m.x+ri(-6,6),m.y+ri(-6,6));if(p&&!seen(p.x,p.y)){m.x=p.x;m.y=p.y;m.dx=m.x*TS;m.dy=m.y*TS;}}await say(`They grab their gear and back off, leaving the bodies. (${r.txt})`,1300,true);return;}
    await say(`They don't budge. (${r.txt})`,900,true);}
  if(c===3){await skFight(sk,side,true);return;}
  skCalm(us);}
function skCalm(us){for(const m of us){m.peace=true;m.state="idle";m.inCombat=false;}}
async function skFight(sk,side,ours,msg){const us=skUnits(sk,side);for(const m of us){m.peace=false;m.neutral=false;m.state="hunt";}sk.friendly=false;if(msg)await say(msg,1000,true);$("tBox").hidden=true;busy=false;await startCombat({extra:us,bumped:us[0],partyFirst:!!ours});}
// looting bodies that someone else just killed
{const base=corpseInteract;corpseInteract=async function(c){const sk=c.claim&&(G.skirmishes||[]).find(s=>s.id===c.claim);
  if(sk&&!sk.friendly&&!c.searched){const side=sk.sides.find(s=>s.team===sk.winner);const us=side?skUnits(sk,side).filter(m=>m.peace&&cheb(m,c)<=8):[];
    if(us.length){const speak=skSpeaks(side,us[0]);for(const m of us)m.bubble=now()+900;
      const q=speak?`"Oi! Hands off, that's ours!" The ${side.label} reach for their weapons.`:`The ${side.label} start shouting at you in ${side.lang||"snarls and growls"} and reach for their weapons. ${skReadMood(us[0],false,true)}`;
      const pay=ri(5,10)*G.floor;const ch=await choose(q,[{t:"BACK OFF"},{t:`PAY THEM ${pay} GOLD`,sub:speak?"Buy the right to search":"Hold out coins and hope they get it",dis:G.gold<pay},{t:"INTIMIDATE THEM",sub:`${oddsTag(bestAt("intimidation"),"intimidation",14)}`},{t:"SEARCH IT ANYWAY",sub:"They will fight"}]);$("tBox").hidden=true;
      if(ch===0||ch<0)return;if(ch===1){G.gold-=pay;hud();sk.friendly=true;}
      else if(ch===2){const r=await check(bestAt("intimidation"),"intimidation",14);if(r.ok){sk.friendly=true;await say(`They back down, grumbling. (${r.txt})`,1000,true);}else{await skFight(sk,side,false,`"Wrong move." (${r.txt})`);return;}}
      else{await skFight(sk,side,false,"They draw steel!");return;}}}
  return base(c);};}
// bumping into a calm skirmisher afterwards
{const base=doMove;doMove=async function(dx,dy,act){const L=G&&G.party[0];if(L&&mode==="explore"){const m=monAt(L.x+dx,L.y+dy);const sk=m&&m.skirmish&&(G.skirmishes||[]).find(s=>s.id===m.skirmish);
    if(sk&&m.peace){if(!act){hintA(`The ${m.name} watches you warily.`);return;}
      if(sk.state==="watching"||sk.state==="pending"){if(sk.state==="pending"){sk.revealed=true;skApplyPhase(sk);}await skJoin(sk);return;}
      if(sk.state==="done"&&!sk.talked){await skAftermath(sk,false);return;}
      const c=await choose(`The ${m.name} eyes you warily.`,[{t:"ATTACK",sub:"They're watching you"},{t:"LEAVE THEM BE"}]);$("tBox").hidden=true;if(c===0){const side=skSideOf(sk,m);await skFight(sk,side,true);}return;}}
  return base(dx,dy,act);};}
// every step: notice fights, watch them play out
async function skTick(){const L=G.party[0];for(const sk of G.skirmishes||[]){if(sk.floor!==G.floor)continue;const units=skUnits(sk);if(!units.length)continue;
    if(sk.state==="pending"&&units.some(m=>cheb(m,L)<=9&&seen(m.x,m.y))){await skReveal(sk);return true;}
    if(sk.state==="watching"){await skRound(sk);return mode!=="explore";}
    if(sk.state==="done"&&sk.awaitTalk&&units.some(m=>cheb(m,L)<=8&&seen(m.x,m.y))){await skAftermath(sk,false);return true;}}
  return false;}
{const base=d2Step;d2Step=async function(){if(mode==="explore"&&G&&!G.over&&!G.demo&&G.party.length){if(await skTick())return;}return base();};}
// a fight that ended with you in it: neutral survivors go back to minding their own business
{const base=victory;victory=async function(){const left=C&&C.neutralLeft;const r=await base();if(left&&left.length&&mode==="explore"){for(const m of left)m.bubble=now()+900;
    const sk=(G.skirmishes||[]).find(s=>s.id===left[0].skirmish);if(sk){sk.state="done";sk.winner=left[0].team;sk.friendly=true;sk.talked=true;}
    await say(`The surviving ${sk?sk.sides.find(s=>s.team===left[0].team).label:"fighters"} nod to you, breathing hard. "Thanks for the help. Take what you want from the bodies."`,1600,true);$("tBox").hidden=true;}return r;};}

// attack a sleeping creature and its sleeping friends wake up
{const base=attack;attack=async function(a,t,w,o){if(t&&t.side==="m"){for(const q of G.mons)if(q!==t&&q.gid===t.gid&&q.hp>0&&cheb(q,t)<=12&&(q.st.asleep||q.state==="sleep")){delete q.st.asleep;if(q.state==="sleep")q.state=C&&q.inCombat?"combat":"hunt";q.st.surprised=false;float(q,"AWAKE!","#ffffff");}}return base(a,t,w,o);};}
