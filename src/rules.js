// ================= rules: stats, rolls, attacks, damage, conditions =================
function faceToward(u,dx,dy){if(Math.abs(dx)>=Math.abs(dy)&&dx!==0){u.face="s";u.flip=dx<0;}else if(dy!==0)u.face=dy<0?"b":"f";}
function float(u,text,col){fx.push({type:"float",x:u.x,y:u.y,text,col,t:now()});}
function dice(u,final,pair){fx.push({type:"dice",x:u.x,y:u.y,final,pair,t:now()});return wait(800);}

// ---------- units ----------
function mkHero(def,race){const L=G?G.level:1;
  const h={side:"h",id:def.id,name:def.name,def,info:CINFO[def.id],x:0,y:0,dx:0,dy:0,face:"f",flip:false,down:false,dead:false,stable:false,ds:{s:0,f:0},st:{},conc:null,wild:null,reaction:true,gear:[],res:{},slots:[],hdLeft:L,hdMax:L,wand:0,asi:{},race:race||"human",exh:0};
  applyLevel(h,true);h.hp=h.maxHp;restoreAll(h);return h;}
function mkMon(t,x,y,boss){const key=t.sprite;const tr=MTRAITS[key]||MTRAITS.goblin;
  return {side:"m",key,name:t.name,hp:t.hp,maxHp:t.hp,ac:t.ac,hit:t.hit,dmg:t.dmg,xp:t.xp,speed:t.speed,range:t.range,sprite:key,tr,x,y,dx:x*TS,dy:y*TS,boss:!!boss,
    state:"sleep",inCombat:false,st:{},reaction:true,bubble:0,webReady:true,healReady:true,phase:1};}
function score(h,a){const R=h.race&&RACES[h.race];let s=h.def[a]+(h.asi[a]||0)+(R&&R.asi[a]||0);const f=gearFx(h);if(f["set"+a])s=Math.max(s,f["set"+a]);return Math.min(30,s);}
function abm(u,a){if(u.side==="m")return (u.tr.abil&&u.tr.abil[a])||0;if(u.wild&&(a==="str"||a==="dex"||a==="con"))return (u.wild.form==="bear"?{str:4,dex:0,con:3}:{str:2,dex:2,con:1})[a];return amod(score(u,a));}
function prof(){return 2+Math.floor((G.level-1)/4);}
function applyLevel(h,init){const L=G?G.level:1;const n=Math.max(0,(h.picks===undefined?(L>=4?1:0)+(L>=8?1:0):h.picks)-(h.featAsi||0));h.asi={};const pa=h.info.primary;if(n)h.asi[pa]=Math.min(2*n,20-h.def[pa]);
  const con=amod(score(h,"con")),hd=h.def.hd;const max=Math.max(1,hd+con+(L-1)*(Math.floor(hd/2)+1+con))+(h.race==="dwarf"?L:0)+(hasFeat(h,"tough")?2*L:0);const old=h.maxHp||max;h.maxHp=max;
  if(!init&&!h.dead)h.hp=Math.min(h.maxHp,h.hp+Math.max(0,h.maxHp-old));h.hdMax=L;}
function slotMax(h){const cs=casterOf(h);const t=cs==="full"?SLOTS_FULL:cs==="half"?SLOTS_HALF:cs==="third"?SLOTS_THIRD:null;return t?t[Math.min(G.level,t.length)-1].slice():[];}
function featRes(h){const out=[];if(h.sub==="land")out.push("natrec");for(const f of featsOf(h)){const r=FEATS[f].res;if(r&&!out.includes(r))out.push(r);}if(h.info.arcaneRecovery)out.push("arcane");return out.filter((v,i)=>out.indexOf(v)===i);}
function restoreAll(h,keepHD){h.pins=2;if(hasFeat(h,"lucky"))h.luck=3;h.goodberry=false;h.sanct=false;h.slots=slotMax(h);for(const k of featRes(h))h.res[k]=RES[k].max(G.level);h.wand=gearFx(h).wand?3:0;if(!keepHD)h.hdLeft=h.hdMax;h.rebukeUsed=false;h.relentlessUsed=false;if(h.sub==="abjurer")h.ward=wardMax(h);}
function gearFx(h){const f={};for(const id of h.gear){const it=ITEMS[id];if(!it||!it.fx)continue;for(const k in it.fx){if(k.startsWith("set"))f[k]=Math.max(f[k]||0,it.fx[k]);else f[k]=(f[k]||0)+it.fx[k];}}return f;}
function acOf(u){if(u.side==="m")return u.ac;const curse=G.curseFloor===G.floor?1:0;if(u.wild)return (u.wild.form==="bear"?11:13)-curse;if(u.armourOff&&u.info.unarmAC)return u.info.unarmAC+(gearFx(u).ac||0)-curse;return u.def.ac+(gearFx(u).ac||0)+(u.st.shieldSpell?5:0)+(u.st.sof?2:0)+(u.st.raised?2:0)+(u.task==="kit"?1:0)-(u.shieldBroken?2:0)-curse;}
function speedOf(u){if(u.side==="m")return u.speed;if(overloaded()&&!u.wild)return Math.max(1,speedOf2(u)-2);return speedOf2(u);}
function speedOf2(u){let s=u.wild?8:u.def.speed+(gearFx(u).speed||0)+(hasFeat(u,"mobile")?2:0);s-=exhOf(u);if(u.st&&u.st.pinned)return 0;return Math.max(1,s);}
function saveBonus(u,a){if(u.side==="m")return abm(u,a)+(u.boss?3:0);return abm(u,a)+(u.info.saves.includes(a)?prof():0)+(gearFx(u).save||0)+(G.blessFloor===G.floor?1:0)+(prayerUp()?1:0)+loyalBonus(u);}
function skillBonus(u,sk){const a=SKILLS[sk];if(u.side==="m")return abm(u,a)+(sk==="perception"&&u.tr.keen?3:0)+(u.boss?2:0)+(sk==="athletics"&&u.tr.shover?2:0);
  let b=abm(u,a);const R=u.race&&RACES[u.race];if(u.info.skills.includes(sk)||(R&&R.skills&&R.skills.includes(sk))||(u.extraSkills&&u.extraSkills.includes(sk)))b+=prof()*((u.info.expertise||[]).includes(sk)?2:1);if(sk==="thieves")b+=gearFx(u).thieves||0;if(u.sub==="champion"&&!u.info.skills.includes(sk)&&(a==="str"||a==="dex"))b+=Math.ceil(prof()/2);return b;}
const passive=(u,sk)=>10+skillBonus(u,sk)+((sk==="perception"||sk==="investigation")&&typeof hasFeat==="function"&&hasFeat(u,"observant")?5:0);
const castMod=u=>abm(u,u.info.castAbil||"int");
const spellAtk=u=>prof()+castMod(u);
const spellDC=u=>8+prof()+castMod(u)+(u.task==="herbs"?1:0);
const sneakDice=()=>`${Math.ceil(G.level/2)}d6`;
function slotAvail(h,lvl){for(let i=lvl-1;i<h.slots.length;i++)if(h.slots[i]>0)return i+1;return 0;}
function useSlot(h,lvl){const s=slotAvail(h,lvl);if(s)h.slots[s-1]--;return s;}
const canReact=u=>u.reaction&&!u.dead&&!u.down&&(u.side==="h"||u.hp>0)&&!u.st.surprised&&!u.st.turned;
function foesOf(u){return u.side==="h"?G.mons.filter(m=>m.hp>0&&(C?m.inCombat:true)):heroesUp();}
function friendsOf(u){return u.side==="h"?heroesUp().filter(h=>h!==u):G.mons.filter(m=>m.hp>0&&m!==u&&(C?m.inCombat:true));}

// ---------- d20 rolls ----------
function d20(adv,dis,u){const lucky=u&&u.side==="h"&&u.race==="halfling";const r1=()=>{let v=rnd(20);if(lucky&&v===1)v=rnd(20);return v;};const a=r1();if(adv&&!dis){const b=r1();return {r:Math.max(a,b),pair:[a,b]};}if(dis&&!adv){const b=r1();return {r:Math.min(a,b),pair:[a,b]};}return {r:a,pair:null};}
const hasTools=u=>u.side==="h"&&u.info.skills.includes("thieves");
const toolNote=u=>u&&!hasTools(u)?" (no thieves' tools: disadvantage, +5 DC)":"";
async function check(u,sk,dc,o){o=o||{};let adv=!!o.adv,dis=!!o.dis;if(sk==="thieves"&&u.side==="h"&&!hasTools(u)){dis=true;dc+=5;}
  if(u.side==="h"){if(u.st.poisoned)dis=true;if(sk==="athletics"&&(u.st.raging||u.st.giant))adv=true;if(sk==="stealth"&&gearFx(u).stealth)adv=true;}
  let d=d20(adv,dis,u);const gd=u.guided?rnd(4):0;if(u.guided){u.guided=false;log(`Guidance: +${gd}.`,"magic");}const b=skillBonus(u,sk)+(o.bonus||0)-exhPen(u,u.side==="h"&&u.info.skills.includes(sk))+gd;let tot=d.r+b;
  if(dc>0&&tot<dc&&canReroll(u)){spendReroll(u,"a check");d=d20(adv,dis,u);tot=d.r+b;}if(!o.quiet)await dice(u,d.r,d.pair);
  return {ok:tot>=dc,total:tot,r:d.r,txt:`${SKN[sk]} ${d.r}${sgn(b)} = ${tot} vs DC ${dc}`};}
function bestAt(sk){const up=heroesUp();const p=up.filter(h=>h.id!=="beast");return (p.length?p:up).slice().sort((a,b)=>skillBonus(b,sk)-skillBonus(a,sk))[0];}
function saveRoll(u,a,dc,o){o=o||{};let adv=!!o.adv,dis=!!o.dis;
  if(a==="dex"&&u.st.dodge)adv=true;if(a==="dex"&&u.side==="h"&&u.id==="barbarian"&&!u.wild)adv=true;if(o.fear&&u.race==="halfling")adv=true;if(a==="dex"&&u.st.restrained)dis=true;if(a==="str"&&(u.st.raging||u.st.giant))adv=true;
  let d=d20(adv,dis,u);const b=saveBonus(u,a)-exhPen(u,u.side==="h"&&u.info.saves.includes(a));const bless=u.st.blessed?rnd(4):0;let tot=d.r+b+bless;if(tot<dc&&canReroll(u)){spendReroll(u,"a save");d=d20(adv,dis,u);tot=d.r+b+bless;}
  return {ok:tot>=dc,total:tot,r:d.r,txt:`${ABN[a]} save ${d.r}${sgn(b)}${bless?"+"+bless:""} = ${tot} vs DC ${dc}`};}

// ---------- weapons & attack maths ----------
function weaponOf(u,which){
  if(u.side==="m")return {name:u.tr.atk,dice:u.dmg,type:u.tr.type,range:u.range,melee:u.range===1,spell:!!u.tr.spell};
  if(u.wild&&(u.wild.form==="rat"||u.wild.form==="spider"))return {name:"Bite",abil:"dex",dice:"1d4",type:"piercing",range:1,melee:true};
  if(u.wild)return u.wild.form==="bear"?{name:"Claws",abil:"str",dice:"2d6",type:"slashing",range:1,melee:true}:{name:"Bite",abil:"str",dice:"2d4",type:"piercing",range:1,melee:true,wolf:true};
  const base=which==="alt"?u.info.alt:u.info.atk;let dice=which==="alt"?base.dice:u.def.dmg;const range=which==="alt"?base.range:u.def.range;
  if(base.cantrip&&G.level>=5){const p=parseDice(dice);if(p)dice=`${p.n*2}d${p.d}${p.b?sgn(p.b):""}`;}
  return Object.assign({},base,{dice,range,melee:range===1});}
function meleeWeapon(u){if(u.side==="m")return u.range===1?weaponOf(u):null;if(u.wild)return weaponOf(u);const m=weaponOf(u,"main");if(m.melee)return m;const a=weaponOf(u,"alt");return a.melee?a:null;}
const canMelee=u=>!!meleeWeapon(u);
function wAbil(u,w){if(w.finesse)return abm(u,"dex")>=abm(u,"str")?"dex":"str";return w.abil||"str";}
function atkBonus(u,w){if(u.side==="m")return u.hit;let b=prof()+abm(u,wAbil(u,w))+(G.blessFloor===G.floor?1:0)+loyalBonus(u);if(!w.spell)b+=gearFx(u).hit||0;return b;}
function dmgBonus(u,w){if(u.side==="m"||w.cantrip)return 0;let b=abm(u,wAbil(u,w))+(gearFx(u).dmg||0);if(!w.melee&&!w.spell)b+=gearFx(u).rdmg||0;if(u.st.raging&&w.melee&&!w.spell)b+=2;return b;}
function lineBlocked(x0,y0,x1,y1,a,t){const steps=Math.ceil(Math.hypot(x1-x0,y1-y0)*4);
  for(let i=1;i<steps;i++){const px=x0+(x1-x0)*i/steps,py=y0+(y1-y0)*i/steps;const tx=Math.floor(px),ty=Math.floor(py);
    if((tx===a.x&&ty===a.y)||(tx===t.x&&ty===t.y))continue;if(blocksSight(tx,ty))return true;const o=objAt(tx,ty);if(o&&givesCover(o))return true;}return false;}
// things you can duck behind (more are added by the room furniture); a table only counts once it has been flipped on its side
const COVER={boulder:1,barrel:1,shrine:1,runes:1};
const givesCover=o=>!!COVER[o.type]&&(o.type!=="table"||!!o.flipped);
function coverOf(a,t){if(cheb(a,t)<=1)return 0;const cs=[[.05,.05],[.95,.05],[.05,.95],[.95,.95]];let best=4;
  for(const [ax,ay] of cs){let n=0;for(const [bx,by] of cs)if(lineBlocked(a.x+ax,a.y+ay,t.x+bx,t.y+by,a,t))n++;best=Math.min(best,n);if(!best)break;}
  let creature=false;const st=Math.max(Math.abs(t.x-a.x),Math.abs(t.y-a.y));for(let i=1;i<st;i++){const x=Math.round(a.x+(t.x-a.x)*i/st),y=Math.round(a.y+(t.y-a.y)*i/st);const o=unitAt(x,y);if(o&&o!==a&&o!==t&&o.side!=="n"&&o.side!==a.side&&!(o.side==="h"&&o.down)){creature=true;break;}}
  if(best===0)return creature?2:0;return best>=3?5:2;}
function attackMods(a,t,w,o){o=o||{};const adv=[],dis=[],notes=[];let bonus=atkBonus(a,w);const ranged=!w.melee;
  if(t.st.restrained)adv.push("target restrained");if(t.st.asleep)adv.push("target asleep");
  if(t.st.prone){if(cheb(a,t)<=1)adv.push("target prone");else dis.push("target prone, far away");}
  if(t.st.helped&&(!t.st.helpFor||t.st.helpFor===a))adv.push("ally helping");if(t.st.guided)adv.push("Guiding Bolt");if(t.st.reckless)adv.push("target reckless");
  if(a.st.hidden)adv.push("you're hidden");if(o.adv)adv.push(o.adv);
  if(a.side==="h"&&C&&C.cur===a&&C.reckless&&w.melee&&!w.spell)adv.push("reckless");
  if((a.side==="m"&&a.tr.pack)||(a.side==="h"&&a.wild)){if(friendsOf(a).some(f=>cheb(f,t)<=1&&!f.st.prone))adv.push("pack tactics");}
  if(!canSee(a,t))dis.push("can't see target in the dark");else if(cheb(a,t)>1&&!canSee(t,a))adv.push("attacking from the dark");
  if(t.st.dodge)dis.push("target dodging");if(t.st.hidden)dis.push("target hidden");
  if(a.st.poisoned)dis.push("poisoned");if(a.st.frightened)dis.push("frightened");if(a.st.prone)dis.push("you're prone");if(a.st.restrained)dis.push("restrained");
  if(ranged&&foesOf(a).some(f=>cheb(f,a)===1&&!(f.side==="h"&&f.down)))dis.push("enemy next to you");
  if(elevAt(a.x,a.y)>elevAt(t.x,t.y)){bonus+=2;notes.push("high ground +2");}
  if(exhOf(a)){bonus-=exhOf(a);notes.push(`exhaustion −${exhOf(a)}`);}
  let cover=(ranged&&!w.noCover)?coverOf(a,t):0;{const e=fire("attackMods",{a,t,w,o,adv,dis,notes,bonus,cover});bonus=e.bonus;cover=e.cover;}if(cover)notes.push(cover===2?"half cover +2 AC":"¾ cover +5 AC");
  const ac=acOf(t)+cover;const mode=adv.length&&!dis.length?1:dis.length&&!adv.length?-1:0;
  return {adv,dis,mode,bonus,ac,cover,notes,pct:hitPct(bonus+(a.st.blessed?2.5:0),ac,mode)};}
function hitPct(b,ac,mode){let p=Math.min(.95,Math.max(.05,(21-(ac-b))/20));if(mode>0)p=1-(1-p)*(1-p);else if(mode<0)p=p*p;return Math.round(p*100);}
function modsText(md){const bits=[];if(md.mode>0)bits.push("advantage: "+md.adv.join(", "));else if(md.mode<0)bits.push("disadvantage: "+md.dis.join(", "));
  else if(md.adv.length&&md.dis.length)bits.push("advantage and disadvantage cancel");bits.push(...md.notes);return bits.length?" ("+bits.join("; ")+")":"";}

// ---------- attacks ----------
async function attack(a,t,w,o){try{return await attackInner(a,t,w,o);}finally{if(camFocus){await wait(250);camFocus=null;}}}
async function attackInner(a,t,w,o){o=o||{};const coat=a.coat&&!w.spell?a.coat:null;if(coat)a.coat=null;const done=async hit=>fireAsync("afterAttack",{a,t,w,hit,coat});
  const md=attackMods(a,t,w,o);faceToward(a,t.x-a.x,t.y-a.y);
  fx.push({type:"lunge",u:a,dx:Math.sign(t.x-a.x),dy:Math.sign(t.y-a.y),t:now()});
  if(!w.melee&&C){camFocus=a;await wait(380);camFocus=t;await wait(320);}
  if(!w.melee)fx.push({type:"shot",from:{x:a.x,y:a.y},to:{x:t.x,y:t.y},t:now(),col:w.type==="fire"?"#ff9a3a":w.type==="radiant"?"#fff0a0":w.type==="necrotic"?"#b080ff":"#f0e0c0"});
  let mode=md.mode;
  {const e=await fireAsync("beforeRoll",{a,t,w,mode});mode=e.mode;}
  let d=d20(mode>0,mode<0,a);await dice(t,d.r,d.pair);const extraRoll=attackRollBonus(a);
  if(a.side==="h"&&canReroll(a)&&d.r<20&&d.r+md.bonus+extraRoll<md.ac){spendReroll(a,"an attack");d=d20(mode>0,mode<0,a);await dice(t,d.r,d.pair);}
  const bless=a.st.blessed?rnd(4):0;const tot=d.r+md.bonus+bless+extraRoll;const hit0=d.r>=critMin(a)||(d.r!==1&&tot>=md.ac);
  let crit=fire("critCheck",{a,t,w,d:d.r,crit:false,hit:hit0}).crit;const hit=crit||(d.r!==1&&tot>=md.ac);
  if(!t.st.helpFor||t.st.helpFor===a){delete t.st.helped;delete t.st.helpFor;}delete t.st.guided;delete a.st.hidden;
  const nm=`${a.name}'s ${w.name}`;const how=mode>0?" with advantage":mode<0?" with disadvantage":"";const rl=`${d.r}${sgn(md.bonus)}${bless?"+"+bless+" bless":""}${extraRoll?"+"+extraRoll:""} = ${tot}`;
  if(hit){const bh=await fireAsync("beforeHit",{a,t,w,total:tot,ac:md.ac,crit,miss:false,msg:""});if(bh.miss){await say(`${nm}: ${rl}${how}. ${bh.msg}`,1000);await done(false);return {hit:false};}}
  if(!hit){float(t,"MISS","#ffffff");await say(`${nm}: ${rl}${acKnown(t)?" vs AC "+md.ac:""}${how}. ${d.r===1?"Fumble!":"Miss!"}`);await done(false);return {hit:false};}
  if(t.side==="m"&&t.tr.redirect&&canReact(t)){const sub=G.mons.find(m=>m!==t&&m.inCombat&&m.hp>0&&cheb(m,t)===1&&["goblin","archer","shaman","kobold"].includes(m.key));
    if(sub){t.reaction=false;const tx=t.x,ty=t.y;t.x=sub.x;t.y=sub.y;sub.x=tx;sub.y=ty;await say(`The ${t.name} yanks a ${sub.name} into the way!`,900);t=sub;}}
  if(crit)cam.shake=now();
  const dm=roll(w.dice,crit,dmgBonus(a,w));let total=dm.total;const parts=[dm.txt];
  {const e=await fireAsync("onHit",{a,t,w,crit,md,total,parts});total=e.total;}
  await say(`${nm}: ${rl}${acKnown(t)?" vs AC "+md.ac:""}${how}. ${crit?"CRITICAL HIT!":"Hit!"} ${total} ${w.type} damage (${parts.join(" ")}).`,950);
  await dealDamage(t,total,w.type,{src:a,attack:true,melee:w.melee,crit,spellLvl:w.spellLvl,necro:w.necro});
  await fireAsync("afterHit",{a,t,w,crit,coat});await done(true);
  if(a.side==="m"&&a.tr.extra&&!t.dead&&!t.down&&t.hp>0){const e=roll(a.tr.extra.dice,crit);await dealDamage(t,e.total,a.tr.extra.type,{src:a});}
  const alive=t.hp>0&&!t.down&&!t.dead;
  if(alive){
    const trip=(a.side==="m"&&a.tr.trip)||(w.wolf?11:0);
    if(trip&&!t.st.prone){const s=saveRoll(t,"str",trip);if(!s.ok){t.st.prone=true;float(t,"PRONE","#ffffff");await say(`The ${t.name} is knocked prone! (${s.txt})`,850);}}
    if(a.side==="m"&&a.tr.poison){const s=saveRoll(t,"con",a.tr.poison.dc);const pd=roll(a.tr.poison.dice).total;const amt=s.ok?Math.floor(pd/2):pd;
      if(!s.ok)t.st.poisoned=3;await say(`Venom! ${s.txt}: ${amt} poison damage${s.ok?"":" and poisoned"}.`,900);await dealDamage(t,amt,"poison",{src:a});}
    if(a.side==="m"&&a.tr.adhesive&&!t.st.restrained&&t.hp>0){t.st.restrained={dc:a.tr.adhesive,by:"mimic",src:a};float(t,"STUCK","#ffffff");await say(`The ${t.name} is stuck fast to the ${a.name}!`,850);}
    if(o.onHit)await o.onHit(t);}
  if(w.type==="fire"&&gnd(t.x,t.y)===GROUND.oil){igniteAt(t.x,t.y);await say("The oil bursts into flames!",800);await scorch();}
  return {hit:true,crit,dmg:total};}

// ---------- damage, healing, death ----------
async function dealDamage(u,amt,type,o){o=o||{};if(u.dead||(u.side==="m"&&(u.hp<=0||u._dead)))return 0;
  if(u.side==="h"&&u.down){if(S.rules.deathSaves&&amt>0&&!u.dead){u.ds.f+=(o.crit||(o.melee&&o.src&&cheb(o.src,u)<=1))?2:1;u.stable=false;float(u,"✗","#ff7a6a");
      await say(`${u.name} is hit while down! Death save failures: ${Math.min(3,u.ds.f)}/3.`,900);if(u.ds.f>=3)await heroDies(u);}return 0;}
  let n=amt;const tr=u.side==="m"?u.tr:null;
  if(tr&&tr.immune&&tr.immune.includes(type)){float(u,"IMMUNE","#ffffff");return 0;}
  if(tr&&tr.resist&&tr.resist.includes(type))n=Math.floor(n/2);
  if(tr&&tr.vuln&&tr.vuln.includes(type)){n*=2;float(u,"WEAK!","#ffe060");}
  {const e=await fireAsync("damageIn",{u,n,type,o});n=e.n;}
  if(u.st.asleep){delete u.st.asleep;if(n>0&&n<u.hp)float(u,"AWAKE!","#ffffff");}
  if(n<=0){float(u,"0","#ffffff");hud();return 0;}
  fx.push({type:"flash",u,t:now()});
  if(u.wild){u.wild.hp-=n;float(u,"-"+n,"#ff7a6a");hud();if(u.wild.hp<=0){const over=-u.wild.hp;u.wild=null;computeLight();await say(`${u.name} is forced out of wolf form!`,800);hud();if(over>0)return n+await dealDamage(u,over,type,Object.assign({},o,{attack:false}));}return n;}
  u.hp-=n;float(u,"-"+n,u.side==="h"?"#ff7a6a":"#ffe060");hud();
  await fireAsync("damageTaken",{u,n,type,o});
  if(u.conc&&u.hp>0){const s=saveRoll(u,"con",Math.max(10,Math.floor(n/2)));if(!s.ok){await say(`${u.name} loses concentration! (${s.txt})`,900);endConc(u);}else log(`${esc(u.name)} keeps concentration (${s.txt}).`,"magic");}
  if(u.hp<=0){if(u.side==="m")await monsterDies(u,o);else await heroDowned(u,-u.hp,o);}
  else if(u.side==="m"&&tr.split&&type==="slashing"&&u.hp>=10)await splitOoze(u);
  else if(u.side==="m")await moraleCheck(u);
  return n;}
async function heroDowned(h,over,o){h.hp=0;
  {const e=await fireAsync("wouldDrop",{h,over,saved:false});if(e.saved)return;}
  if(!C){h.down=true;h.stable=true;h.st={prone:true};h.ds={s:0,f:0};if(h.conc)endConc(h);h.wild=null;if(G.party[0]===h){const i=G.party.findIndex(q=>!q.down&&!q.dead);if(i>0){const q=G.party[i];[q.x,h.x]=[h.x,q.x];[q.y,h.y]=[h.y,q.y];G.party[i]=h;G.party[0]=q;}}hud();fov();
    if(!heroesUp().length){await say(`${h.name} collapses. With nobody left standing, the lantern gutters out...`,1600,true);G.over=true;showEnd(false,`Your party fell on floor ${G.floor}.`);}
    else await say(`${h.name} collapses, unconscious! Give them a potion or rest to bring them round.`,1300,true);return;}
  if(S.rules.deathSaves&&over>=h.maxHp){await heroDies(h,true);return;}
  h.down=true;h.st={prone:true};h.ds={s:0,f:0};h.stable=!!gearFx(h).periapt;if(h.conc)endConc(h);h.wild=null;
  await say(`${h.name} is down!${S.rules.deathSaves?" They'll make death saves until someone heals them.":" Heal them to get them back up."}`,1000);
  if(C)renderStrip();hud();fov();}
async function heroDies(h,massive){h.dead=true;h.down=true;h.hp=0;if(h.conc)endConc(h);
  await say(massive?`The blow is overwhelming. ${h.name} is killed outright!`:`${h.name} has died.`,1600);log(`☠ ${esc(h.name)} has died.`,"hurt");if(C)renderStrip();hud();fov();}
function heal(u,n){if(u.dead)return 0;const was=u.down;u.hp=Math.min(u.maxHp,u.hp+n);if(was&&u.hp>0){u.down=false;u.stable=false;u.ds={s:0,f:0};if(!C)delete u.st.prone;}float(u,"+"+n,"#8aff7a");fx.push({type:"heal",u,t:now()});hud();if(was){fov();if(C)renderStrip();}return n;}
async function deathSave(h){const r=rnd(20);await dice(h,r,null);
  if(r===20){h.down=false;h.hp=1;h.ds={s:0,f:0};await say(`${h.name} rolls a natural 20 and staggers back up with 1 HP!`);fov();hud();renderStrip();return;}
  if(r===1)h.ds.f+=2;else if(r>=10)h.ds.s++;else h.ds.f++;
  await say(`${h.name} death save: ${r}. ${r>=10?"Success":"Failure"} (${h.ds.s} ✓ / ${Math.min(3,h.ds.f)} ✗).`,1000);
  if(h.ds.f>=3)await heroDies(h);else if(h.ds.s>=3){h.stable=true;await say(`${h.name} is stable, but still unconscious.`,800);}}
async function monsterDies(m,o){if(m._dead)return;m._dead=true;learnByFighting(m);grimHarvest(m,o);if(m.named&&G.goal&&G.goal.target===m)G.goalPending=true;m.hp=0;m.inCombat=false;const i=G.mons.indexOf(m);if(i>=0)G.mons.splice(i,1);G.kills++;fx.push({type:"poof",x:m.x,y:m.y,t:now()});
  if(C)C.xp+=m.xp;else gainXpNow(m.xp);
  for(const h of G.party){if(h.conc&&h.conc.type==="mark"&&h.conc.target===m)h.conc.target=null;}
  await say(`The ${m.name} is defeated!`,750);
  noteKill(m);makeCorpse(m);
  if((m.tr.leader||m.boss)&&C){for(const f of G.mons.filter(q=>q.gid===m.gid&&q.inCombat&&q.tr.morale&&!q.fleeing)){const s=saveRoll(f,"wis",12);if(!s.ok){f.fleeing=true;float(f,"FLEE!","#ffffff");}}
    if(G.mons.some(q=>q.fleeing))await say(`With their leader down, some of them break and run!`,900);}
  if(C)renderStrip();}
async function moraleCheck(m){if(!m.tr.morale||m.fleeing||m.moraleDone||!C)return;if(m.hp>m.maxHp*(m.tr.mind==="smart"&&!m.boss?.5:.35))return;m.moraleDone=true;
  const s=saveRoll(m,"wis",10);if(!s.ok){m.fleeing=true;float(m,"FLEE!","#ffffff");await say(`The ${m.name} panics and tries to run! (${s.txt})`,850);}}
async function splitOoze(m){const p=nearFree(m.x,m.y);if(!p||cheb(p,m)>2)return;const half=Math.floor(m.hp/2);if(half<1)return;m.hp-=half;m.maxHp=Math.max(m.hp,Math.floor(m.maxHp/2));
  const n=mkMon(Object.assign({},monByKey("ooze")||m,{hp:half}),p.x,p.y);n.maxHp=m.maxHp;n.hp=half;n.state="combat";n.gid=m.gid;n.xp=Math.ceil(m.xp/2);
  G.mons.push(n);if(C){n.inCombat=true;n.init=m.init;C.units.splice(C.units.indexOf(m)+1,0,n);renderStrip();}
  await say(`The slash splits the ${m.name} in two!`,900);}
function gainXpNow(n){G.xp+=n;const msgs=[];while(G.xp>=xpNeed()){G.xp-=xpNeed();const old=G.party.map(h=>slotMax(h));G.level++;
    G.party.forEach((h,i)=>{if(h.dead)return;applyLevel(h,false);const nm=slotMax(h);h.slots=nm.map((v,j)=>Math.min(v,(h.slots[j]||0)+Math.max(0,v-(old[i][j]||0))));
      for(const k of featRes(h)){const gain=RES[k].max(G.level)-RES[k].max(G.level-1);if(gain>0)h.res[k]=(h.res[k]||0)+gain;}h.hdLeft++;});
    msgs.push(`The party reaches level ${G.level}! More HP${G.level%4===1?", a bigger proficiency bonus":""}${G.level===4||G.level===8?", +2 to each hero's main ability":""}${G.level===3?", 2nd-level spell slots":""}${G.level===5?", Extra Attack for fighters, barbarians and rangers, stronger cantrips and Fireball":""}.`);
    log(`LEVEL UP! Party level ${G.level}.`,"lv");}
  hud();return msgs;}
const xpNeed=()=>G.level*20;

// ---------- concentration ----------
function startConc(u,data){if(u.conc)endConc(u);u.conc=data;}
function endConc(u){const c=u.conc;if(!c)return;u.conc=null;endConcExtra(u,c);
  if(c.type==="bless")for(const t of c.targets)delete t.st.blessed;
  if(c.type==="spikes"){for(const k of c.tiles){G.entangle.delete(k);G.spikes.delete(k);}}
  if(c.type==="entangle"){for(const k of c.tiles)G.entangle.delete(k);for(const m of G.mons.concat(G.party))if(m.st.restrained&&m.st.restrained.by==="entangle"&&m.st.restrained.src===u)delete m.st.restrained;}
  log(`${esc(u.name)}'s ${c.name} ends.`,"magic");}

// ---------- hazards, traps, fire ----------
async function onEnter(u,x,y,o){o=o||{};const res={stop:false};
  const t=trapAt(x,y);if(t){res.stop=await triggerTrap(t,u)||res.stop;if(u.hp<=0||u.down)return {stop:true};}
  const g=gnd(x,y);
  if(g===GROUND.crack){G.ground[y][x]=GROUND.rubble;buildTerrain();const s=saveRoll(u,"dex",12);
    if(s.ok)await say(`The cracked floor gives way, but the ${u.name} scrambles clear! (${s.txt})`,900);
    else{u.st.prone=true;await say(`The floor collapses under the ${u.name}! (${s.txt})`,900);await dealDamage(u,roll("2d6").total,"bludgeoning",{});res.stop=true;}}
  if(g===GROUND.oil&&!fireAt(x,y)&&!(u.side==="m"&&u.tr.mind==="mindless"&&u.key==="ooze")){const s=saveRoll(u,"dex",10);if(!s.ok){u.st.prone=true;float(u,"SLIP!","#ffffff");await say(`The ${u.name} slips on the oil and falls prone! (${s.txt})`,850);res.stop=true;}}
  if(fireAt(x,y)){await say(`The ${u.name} walks through burning oil!`,600);await dealDamage(u,roll("2d4").total,"fire",{});}
  if(g===GROUND.acid){await say(`Acid burns the ${u.name}!`,600);await dealDamage(u,roll("1d6+1").total,"acid",{});}
  if(u.side==="h"&&!C)collectItems(u);
  return res;}
const trapN=()=>1+Math.floor((((G&&G.floor)||1)-1)/2);// trap damage dice: 1 on floors 1-2, 2 on 3-4, 3 on 5+
async function triggerTrap(t,u){t.found=true;t.done=true;const who=u.side==="h"?`The ${u.name}`:`The ${u.name}`;{const r=await triggerNewTrap(t,u);if(r!==null)return r;}
  if(t.type==="darts"){const r=rnd(20)+5;const hit=r>=acOf(u);fx.push({type:"shot",from:{x:t.x-2,y:t.y},to:{x:t.x,y:t.y},t:now(),col:"#d0d0d0"});
    await say(`Click! Darts fly from the walls at ${who}: ${r} vs AC ${acOf(u)}. ${hit?"Hit!":"Miss!"}`,950);
    if(hit){await dealDamage(u,roll(`${trapN()}d4`).total,"piercing",{trap:true});if(u.hp>0&&!u.down&&!(u.tr&&u.tr.immune&&u.tr.immune.includes("poison"))){const s=saveRoll(u,"con",11);if(!s.ok){u.st.poisoned=3;await say(`The darts were poisoned! (${s.txt})`,800);}}}return false;}
  if(t.type==="pit"){G.ground[t.y][t.x]=GROUND.rubble;buildTerrain();const s=saveRoll(u,"dex",t.dc);
    if(s.ok){await say(`A pit trap! ${who} leaps clear as the floor drops. (${s.txt})`,950);return false;}
    u.st.prone=true;await say(`A pit trap! ${who} falls in. (${s.txt})`,950);await dealDamage(u,roll(`${trapN()}d6`).total,"bludgeoning",{trap:true,fall:true});return true;}
  if(t.type==="fire"){const s=saveRoll(u,"dex",t.dc);const dm=roll(`${trapN()}d6`).total;fx.push({type:"boom",x:t.x,y:t.y,t:now()});
    await say(`Flames roar from a vent under ${who}! (${s.txt})`,950);await dealDamage(u,s.ok?Math.floor(dm/2):dm,"fire",{});
    for(const [dx,dy] of DIRS8)if(gnd(t.x+dx,t.y+dy)===GROUND.oil)igniteAt(t.x+dx,t.y+dy);return false;}
  if(t.type==="alarm"){await say(`${who} snaps a hidden wire. Bells clang through the dungeon!`,1100);alarm(t.x,t.y);return false;}
  return false;}
function alarm(x,y){for(const m of G.mons)if(m.hp>0&&!m.peace&&Math.abs(m.x-x)+Math.abs(m.y-y)<=20&&m.state!=="combat"){m.state="hunt";m.bubble=now()+900;}}
function igniteAt(x,y){if(!inB(x,y))return;const k=y*G.W+x;if(gnd(x,y)===GROUND.oil){const q=[k],sn=new Set([k]);while(q.length){const c=q.shift();G.fire.set(c,3);const cx=c%G.W,cy=(c/G.W)|0;
      for(const [dx,dy] of DIRS8){const nx=cx+dx,ny=cy+dy,nk=ny*G.W+nx;if(inB(nx,ny)&&!sn.has(nk)&&gnd(nx,ny)===GROUND.oil){sn.add(nk);q.push(nk);}}}
    fx.push({type:"boom",x,y,t:now()});computeLight();if(G.vis)fov();}
  const o=G.objs.find(q=>q.x===x&&q.y===y&&!q.gone&&isWooden(q));if(o)setAlight(o);}
const WOODEN={wood:1,furniture:1,web:1};// more are added by the room furniture
const isWooden=o=>!o.burnt&&!o.gone&&((o.type==="door"&&!o.iron&&!o.open)||(o.type==="chest"&&!o.mimic)||!!WOODEN[o.type]);
function setAlight(o){if(o.burn||!isWooden(o))return;o.burn=o.type==="web"?1:o.type==="door"?6:4;G.fire.set(o.y*G.W+o.x,o.burn+1);makeNoise(o.x,o.y,8);
  log(`${o.type==="door"?"The door":o.type==="chest"?"A chest":o.type==="web"?"A web":"The wood"} catches fire! Smoke and light spread through the dark.`,"hurt");computeLight();}
function burnObjects(){for(const o of G.objs){if(!o.burn||o.gone)continue;o.burn--;G.fire.set(o.y*G.W+o.x,Math.max(2,o.burn+1));
    if(o.burn<=0){o.burn=0;if(o.type==="door"){o.burnt=true;o.open=true;o.locked=false;log("The door burns through and collapses into embers.","miss");}
      else{o.gone=true;if(o.type==="web")G.entangle.delete(o.y*G.W+o.x);if(o.type==="chest"&&!o.opened&&o.loot&&o.loot.gold)G.items.push({x:o.x,y:o.y,gold:o.loot.gold});log(`The ${o.type==="chest"?"chest burns away, and everything inside but the coins is ash":o.type==="web"?"web shrivels away":"wood burns to ash"}.`,"miss");}}}
  // flames jump to wooden things next to a fire
  for(const k of [...G.fire.keys()]){const x=k%G.W,y=(k/G.W)|0;for(const o of G.objs)if(isWooden(o)&&!o.burn&&cheb(o,{x,y})<=1&&(o.x!==x||o.y!==y)&&Math.random()<(o.type==="web"?.9:.3))setAlight(o);}}
async function scorch(){for(const u of G.party.concat(G.mons.slice())){if(u.dead||u.hp<=0&&u.side==="m")continue;if(fireAt(u.x,u.y)&&u._scorch!==(C?C.round:-1)){u._scorch=C?C.round:-1;await dealDamage(u,roll("2d4").total,"fire",{});}}}
function tickFire(){burnObjects();{const lit=[];for(const k of G.fire.keys()){const x=k%G.W,y=(k/G.W)|0;for(const [a,b] of DIRS8){const nx=x+a,ny=y+b;if(inB(nx,ny)&&gnd(nx,ny)===GROUND.oil&&!G.fire.has(ny*G.W+nx))lit.push([nx,ny]);}}for(const [x,y] of lit)igniteAt(x,y);}tickSmoke();for(const o of G.objs)if(o.burn&&!o.gone)addSmoke(o.x,o.y,3);let burnt=false;for(const [k,v] of [...G.fire]){if(v<=1){G.fire.delete(k);const x=k%G.W,y=(k/G.W)|0;if(gnd(x,y)===GROUND.oil){G.ground[y][x]=0;burnt=true;}}else G.fire.set(k,v-1);}
  if(burnt)buildTerrain();computeLight();}
function spill(cx,cy,tiles){for(const [x,y] of tiles){if(!inB(x,y)||isWall(x,y)||gnd(x,y)===GROUND.water||blocksObj(x,y)&&!(x===cx&&y===cy))continue;if(gnd(x,y)===0||gnd(x,y)===GROUND.rubble)G.ground[y][x]=GROUND.oil;}buildTerrain();}
async function breakBarrel(o,fire,dx,dy){o.gone=true;const tiles=[[o.x,o.y]];
  for(const [ax,ay] of DIRS8)tiles.push([o.x+ax,o.y+ay]);// always a 3x3 puddle
  spill(o.x,o.y,tiles);await say(fire?"The barrel bursts and the oil goes up in flames!":"The barrel splits open. Oil floods the floor!",900);
  if(fire){igniteAt(o.x,o.y);await scorch();}}

// ---------- movement, opportunity attacks, shoving ----------
async function walk(u,path,o){o=o||{};
  for(const k of path){const x=k%G.W,y=(k/G.W)|0;
    if(C&&!o.noOA){const dis=(C.cur===u&&C.disengaged)||u.disengaged;
      if(!dis){const threats=foesOf(u).filter(e=>cheb(e,u)===1&&cheb(e,{x,y})>1&&canReact(e)&&canMelee(e)&&!e.fleeing&&!e.st.prone&&!(e.side==="h"&&e.down)&&!(u.tr&&u.tr.flyby));// prone creatures can't make opportunity attacks
        for(const e of threats){if(e.side==="h"&&!await askReact(e,`The ${u.name} is moving away from the ${e.name}. Take an opportunity attack?`))continue;e.reaction=false;await say(`The ${e.name} lashes out as the ${u.name} moves away!`,650);const r=await attack(e,u,meleeWeapon(e),{});if(u.hp<=0&&u.side==="m"||u.down||u.dead)return false;
          if(r&&r.hit&&(hasFeat(e,"sentinel")||(e.side==="h"&&e.id==="fighter"))){await say(`The ${e.name} holds the line: the ${u.name} is stopped in its tracks!`,850);return false;}}}}
    const d=doorAt(x,y);if(d&&!d.open){d.open=true;computeLight();}
    faceToward(u,x-u.x,y-u.y);u.x=x;u.y=y;await wait(110);
    if(C&&u.side==="m"&&await readiedStrike(u))return false;
    if(G.spikes&&G.spikes.has(y*G.W+x)&&(u.side==="h"||u.hp>0)){float(u,"THORNS","#8aff7a");await dealDamage(u,roll("2d4").total,"piercing",{});if(u.hp<=0&&u.side==="m"||u.down||u.dead)return false;}
    if(u.side==="h"||C)fov();
    const r=await onEnter(u,x,y,{});if(r.stop||u.hp<=0||u.down||u.dead)return false;}
  return true;}
async function pushUnit(u,dx,dy,n){for(let i=0;i<n;i++){const nx=u.x+dx,ny=u.y+dy;
    const o=objAt(nx,ny);if(o&&o.type==="barrel"){await breakBarrel(o,false,dx,dy);return;}
    if(!enterable(u,nx,ny)||unitAt(nx,ny)){float(u,"THUD","#ffffff");return;}
    const fe=elevAt(u.x,u.y);u.x=nx;u.y=ny;await wait(150);fov();
    if(fe>elevAt(nx,ny)&&!isRamp(nx,ny)){u.st.prone=true;await say(`The ${u.name} is knocked off the ledge!`,750);await dealDamage(u,roll("1d6").total,"bludgeoning",{fall:true});}
    const r=await onEnter(u,nx,ny,{forced:true});if(r.stop||u.hp<=0||u.down||u.dead)return;}}
function pushResult(t,dx,dy){const nx=t.x+dx,ny=t.y+dy;if(!inB(nx,ny))return "wall";const o=objAt(nx,ny);if(o&&o.type==="barrel")return "barrel";
  if(!enterable(t,nx,ny)||unitAt(nx,ny))return "blocked";const bits=[];const tr=trapAt(nx,ny);if(tr&&tr.found)bits.push(TRAPS[tr.type].name);
  if(fireAt(nx,ny))bits.push("fire");const g=gnd(nx,ny);if(g===GROUND.acid)bits.push("acid");if(g===GROUND.oil)bits.push("oil");if(g===GROUND.crack)bits.push("cracked floor");
  if(elevAt(t.x,t.y)>elevAt(nx,ny)&&!isRamp(nx,ny))bits.push("off the ledge");return bits.join(", ")||"clear";}
async function shove(a,t,choice){
  if(t.type==="barrel"){await say(`The ${a.name} topples the oil barrel!`,700);await breakBarrel(t,false,Math.sign(t.x-a.x),Math.sign(t.y-a.y));return true;}
  const da=d20(!!a.st.raging,!!a.st.poisoned,a);const ra=da.r+skillBonus(a,"athletics");
  const tsk=skillBonus(t,"athletics")>=skillBonus(t,"acrobatics")?"athletics":"acrobatics";const rt=rnd(20)+skillBonus(t,tsk)+(t.tr&&t.tr.large?3:0);
  await dice(t,da.r,da.pair);
  if(ra<rt){await say(`The ${a.name} tries to shove the ${t.name}: ${ra} vs ${rt}. It holds its ground!`,950);return false;}
  if(!choice)choice=await choose(`Shove succeeded (${ra} vs ${rt})! What now?`,[{t:"PUSH AWAY",sub:"1 square: "+pushResult(t,Math.sign(t.x-a.x),Math.sign(t.y-a.y))},{t:"KNOCK PRONE",sub:"Melee attacks against it get advantage"}])===0?"push":"prone";
  if(choice==="prone"){t.st.prone=true;float(t,"PRONE","#ffffff");await say(`The ${a.name} knocks the ${t.name} to the ground!`,850);return true;}
  await say(`The ${a.name} shoves the ${t.name} back!`,650);await pushUnit(t,Math.sign(t.x-a.x),Math.sign(t.y-a.y),a.st.giant?2:1);return true;}
async function collectItems(h){for(const it of G.items.filter(i=>i.x===h.x&&i.y===h.y)){G.items.splice(G.items.indexOf(it),1);
  if(it.gold){G.gold+=it.gold;toast(`Found ${it.gold} gold!`);log(`Found ${it.gold} gold.`,"gold");}else{addItem(it.item,it.n||1);toast(`Found ${it.n>1?it.n+" ":""}${itemName(it.item)}!`);log(`Found ${esc(itemName(it.item))}.`,"gold");}}hud();}
function addItem(id,n){G.bag[id]=(G.bag[id]||0)+(n||1);}
function takeItem(id,n){if(!G.bag[id])return false;G.bag[id]-=Math.min(G.bag[id],n||1);if(!G.bag[id])delete G.bag[id];return true;}
