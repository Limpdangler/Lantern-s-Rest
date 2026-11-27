// ================= bats, the owl familiar you can fly, the Paladin, and the Gunslinger =================

// ---------- bats ----------
DEFAULTS.monsters.push({name:"Giant Bat",hp:9,ac:13,hit:4,dmg:"1d6+2",range:1,speed:8,xp:5,from:1,sprite:"bat"});
MTRAITS.bat={atk:"Bite",type:"piercing",dv:true,keen:true,flyer:true,flyby:true,pack:true,mind:"beast",abil:{str:-1,dex:3,con:0,int:-4,wis:1,cha:-3}};
GROUPS.push({from:1,list:["bat","bat","bat"],fac:"beasts"});if(typeof GROUP_FAC!=="undefined")GROUP_FAC.push("beasts");
LORE_SK.bat="nature";
MON2.bat=()=>{const P=P2(16,16);const b="#4a3a44",w="#6a5260";
  for(const s of [-1,1]){for(let i=0;i<6;i++){const x=8+s*(2+i),y=7+Math.round(Math.abs(i-2)*.6)+(i>3?1:0);cyl2(P,Math.min(x,x+s),y,2,4-Math.floor(i/2),w,{flat:1});}
    put2(P,8+s*7,11,"#3a2a34",2,2);put2(P,8+s*5,11,"#3a2a34",2,2);}
  ell2(P,8,9,2.6,3.2,b,{});ell2(P,8,6,2.2,2,b,{});put2(P,6,3,b,3,3);put2(P,10,3,b,3,3);put2(P,6,4,b,3,3);put2(P,10,4,b,3,3);
  px2(P,7,6,"#ff5030");px2(P,9,6,"#ff5030");px2(P,8,8,"#e8e0d0");return render2(P);};
// bats fly: water, pits, oil and ledges don't bother them, and dodging past them never provokes them
{const base=enterable;enterable=(u,x,y)=>{if(u&&u.side==="m"&&u.tr&&u.tr.flyer)return inB(x,y)&&!isWall(x,y)&&!(doorAt(x,y)&&!doorAt(x,y).open)&&!blocksObj(x,y);return base(u,x,y);};}

// ---------- the owl familiar: fly it around yourself ----------
function startOwl(h){if(G.owlCd>G.steps){toast("The owl is resting.");return;}closeMenu();G.scout={by:h,x:h.x,y:h.y,flown:0,max:30,next:0};G.owl={x:h.x,y:h.y,until:1e9};fov();
  toast("The owl takes off. Fly it with the D-pad (or tap a square it can see). Press A to call it back.");hud();}
function owlStep(dx,dy){const s=G.scout;if(!s)return;const t=performance.now();if(t<s.next)return;s.next=t+130;const nx=s.x+dx,ny=s.y+dy;
  if(!inB(nx,ny)||isWall(nx,ny)||(doorAt(nx,ny)&&!doorAt(nx,ny).open)){toast("The owl can't fly through that.");return;}
  if(cheb(s.by,{x:nx,y:ny})>20){toast("The owl won't fly any further from the wizard.");return;}
  s.x=nx;s.y=ny;s.flown++;G.owl.x=nx;G.owl.y=ny;fov();
  const m=G.mons.find(q=>q.hp>0&&!q.peace&&cheb(q,s)<=1&&q.state!=="sleep");if(m&&Math.random()<.25){float(m,"?","#ffe060");toast(`The ${m.name} swipes at the owl! Better bring it back soon.`);}
  if(s.flown>=s.max){recallOwl("The owl is tired and flies back to the wizard.");}}
function owlFlyTo(x,y){const s=G.scout;if(!s)return;if(!G.vis.has(y*G.W+x)||isWall(x,y)){toast("The owl can only fly to somewhere it can see.");return;}
  if(cheb(s.by,{x,y})>20){toast("Too far from the wizard.");return;}const d=cheb(s,{x,y});s.x=x;s.y=y;s.flown+=d;G.owl.x=x;G.owl.y=y;fov();if(s.flown>=s.max)recallOwl("The owl is tired and flies back to the wizard.");}
function recallOwl(msg){if(!G.scout)return;G.scout=null;G.owl=null;G.owlCd=G.steps+30;fov();toast(msg||"The owl glides back to the wizard's shoulder.");hud();}

// ---------- the Paladin ----------
DEFAULTS.classes.push({id:"paladin",name:"Paladin",str:16,dex:10,con:14,int:8,wis:10,cha:15,ac:18,hd:10,dmg:"1d8",range:1,speed:6});
CINFO.paladin={atk:{name:"Longsword",abil:"str",type:"slashing"},alt:{name:"Javelin",abil:"str",dice:"1d6",type:"piercing",range:6,thrown:true},
  saves:["wis","cha"],skills:["athletics","insight","religion","persuasion"],armour:"heavy",stealthDis:true,unarmAC:11,caster:"half",castAbil:"cha",spells:["bless","curewounds","shieldoffaith"],
  feats:["layonhands"],extra:true,primary:"str",
  blurb:"Holy knight in heavy armour with a shield. Divine Smite: spend a spell slot when you hit to add radiant damage (more against undead). Lay on Hands heals from a pool. From level 6, an aura boosts nearby allies' saves."};
LOOKS.paladin={skin:"#f0c098",hair:"#e8c058",hs:"short",eye:"#3a6ab0",top:"#c8ccd8",arm:"#b0b8c8",plate:"#d8dce6",legs:"#5a5a6a",boots:"#6a5a4a",cape:"#3a5ab0",belt:"#c8a040",tabard:"#f2efe6",wpn:"sword"};
SHIELD_USERS.push("paladin");CLASS_LANG.paladin=["Celestial"];
RES.layonhands={name:"Lay on Hands",rest:"lr",max:l=>5*l};RES.channel={name:"Channel Divinity",rest:"sr",max:()=>1};
TASKS.paladin={id:"vows",name:"Vows recited",fx:"+1 to attack rolls",line:h=>`The ${h.name} kneels and recites their oath aloud (+1 to attack rolls until the next rest).`};
Object.assign(FEATS,{
  layonhands:{name:"Lay on Hands",cost:"action",res:"layonhands",desc:"Action: touch an ally (or yourself) and heal from your pool of 5 HP per level."},
  sacredweapon:{name:"Sacred Weapon",cost:"bonus",res:"channel",desc:"Bonus action, Channel Divinity: add your CHA to attack rolls for the rest of the fight, and your weapon glows."},
  vowenmity:{name:"Vow of Enmity",cost:"bonus",res:"channel",desc:"Bonus action, Channel Divinity: advantage on every attack against one enemy for the rest of the fight."},
  natureswrath:{name:"Nature's Wrath",cost:"action",res:"channel",desc:"Action, Channel Divinity: spectral vines grab an enemy within 2 squares (STR save or restrained)."}});
SUBS.paladin=[
  {id:"devotion",name:"Oath of Devotion",desc:"Sacred Weapon: once per short rest, add your Charisma to attack rolls for a whole fight.",feats:["sacredweapon"]},
  {id:"vengeance",name:"Oath of Vengeance",desc:"Vow of Enmity: once per short rest, swear to destroy one enemy and get advantage on every attack against it.",feats:["vowenmity"]},
  {id:"ancients",name:"Oath of the Ancients",desc:"Nature's Wrath: once per short rest, vines burst from the ground and hold an enemy fast.",feats:["natureswrath"]}];
Object.assign(FEAT_RUN,{
  layonhands:u=>targetMode({kind:"ally",range:1,label:"Lay on Hands: tap yourself or an ally next to you.",onPick:async(x,y,t)=>{const need=t.maxHp-t.hp;if(need<=0&&!t.st.poisoned){prompt("They're already at full health.");afterAction();return;}
    C.actions--;const n=Math.min(u.res.layonhands,Math.max(need,0));u.res.layonhands-=n;heal(t,n);if(t.st.poisoned&&u.res.layonhands>=5){u.res.layonhands-=5;delete t.st.poisoned;}
    await say(`The ${u.name} lays hands on the ${t.name}: +${n} HP. (${u.res.layonhands} left in the pool)`,900);}}),
  sacredweapon:async u=>{busy=true;C.bonus=false;u.res.channel--;u.st.sacred=true;fx.push({type:"ring",u,col:"#fff0a0",t:now()});await say(`Sacred Weapon! The ${u.name}'s blade blazes with holy light.`,900);afterAction();},
  vowenmity:u=>targetMode({kind:"enemy",range:12,label:"Vow of Enmity: which enemy?",onPick:async(x,y,t)=>{C.bonus=false;u.res.channel--;u.vow=t;float(t,"VOW","#ffd060");await say(`The ${u.name} swears to destroy the ${t.name}!`,850);}}),
  natureswrath:u=>targetMode({kind:"enemy",range:2,label:"Nature's Wrath: which enemy?",onPick:async(x,y,t)=>{C.actions--;u.res.channel--;const s=saveRoll(t,"str",spellDC(u));if(!s.ok){t.st.restrained={dc:spellDC(u),by:"vines",src:u};float(t,"TANGLED","#8aff7a");}
    await say(`Ghostly vines burst from the floor around the ${t.name}${s.ok?", but it tears free":" and hold it fast"} (${s.txt}).`,1000);}})});
effect("paladin","Paladin: Divine Smite, Sacred Weapon, Vow of Enmity, recited vows",{
  attackMods:c=>{const a=c.a;if(!isHero(a))return;if(a.st.sacred&&!c.w.spell){const b=Math.max(1,abm(a,"cha"));c.bonus+=b;c.notes.push(`sacred weapon +${b}`);}
    if(a.vow&&a.vow===c.t)c.adv.push("vow of enmity");if(a.task==="vows"&&!c.w.spell){c.bonus+=1;c.notes.push("vows +1");}},
  onHit:async c=>{const a=c.a,t=c.t;if(!isHero(a)||a.id!=="paladin"||!c.w.melee||c.w.spell||a.wild)return;let lvl=0;for(let i=1;i<=a.slots.length;i++)if(slotAvail(a,i)){lvl=i;break;}if(!lvl)return;
    const undead=t.fac==="undead";const dice=`${Math.min(5,1+lvl+(undead?1:0))}d8`;
    if(!await askReact(a,`Divine Smite? Spend a level ${lvl} slot for +${dice} radiant damage${undead?" (more against undead)":""}.`))return;
    useSlot(a,lvl);const r=roll(dice,c.crit).total;c.total+=r;c.parts.push(`+${r} smite`);fx.push({type:"pillar",x:t.x,y:t.y,t:now()});float(t,"SMITE","#fff0a0");}});
{const base=saveBonus;saveBonus=(u,a)=>{let b=base(u,a);if(u.side==="h"&&G.level>=6){const p=heroesUp().find(h=>h.id==="paladin"&&!h.wild&&cheb(h,u)<=2);if(p)b+=Math.max(1,abm(p,"cha"));}return b;};}
// Divine Sense (outside combat): feel where the undead are
function divineSense(h){const near=G.mons.filter(m=>m.hp>0&&m.fac==="undead"&&cheb(m,h)<=12);if(!near.length){toast("Divine Sense: no undead within 12 squares.");return;}
  for(const m of near)G.explored[m.y][m.x]=true;const dirs=[...new Set(near.map(m=>dirTo(h,m)))];toast(`Divine Sense: ${near.length} undead nearby, to the ${dirs.join(" and ")}.`);}

// ---------- the Gunslinger (a fighter path) ----------
SUBS.fighter.push({id:"gunslinger",name:"Gunslinger",desc:"Trades the sword for a pistol: 1d10, range 6, but deafeningly loud and it can misfire on a 1. Grit fuels trick shots (Deadeye, Dazing, Disarming, Forceful, Winging, Piercing); you get grit back on crits and kills. No penalty for shooting at close range. Comes with 20 bullets and a whip or shortsword.",
  feats:[]});
ITEMS.bullets={name:"Bullets",kind:"keep",price:15,floor:1,w:0,pack:10,desc:"Lead shot and powder for a pistol. Can also be poured out as a gunpowder trail (1 bullet = 3 squares)."};WEIGHT.bullets=.05;
LOOKS.gunslinger=Object.assign({},LOOKS.fighter,{cowboy:"#6a4426",top:"#7a5a3a",arm:"#8a6a44",plate:null,cape:"#8a3a2a",belt:"#3a2414",wpn:"dagger"});
RES.grit={name:"Grit",rest:"sr",max:l=>l>=7?4:l>=5?3:2};
const isGun=w=>!!(w&&w.gun);
{const base=weaponOf;weaponOf=(u,which)=>{if(u.side==="h"&&u.sub==="gunslinger"&&!u.wild){
    if(which!=="alt")return {name:"Pistol",abil:"dex",finesse:true,dice:"1d10",type:"piercing",range:6,gun:true,melee:false};
    return u.gsAlt==="whip"?{name:"Whip",abil:"dex",finesse:true,dice:"1d4",type:"slashing",range:1,reach:2,melee:true,whip:true}:{name:"Shortsword",abil:"dex",finesse:true,dice:"1d6",type:"piercing",range:1,melee:true};}
  return base(u,which);};}
const GUN_NOISE=30;
function gunshot(u){makeNoise(u.x,u.y,GUN_NOISE);cam.shake=now();if(C&&typeof joinNew==="function")joinNew();}
effect("gunslinger","Gunslinger: bullets, noise, misfires, grit, close-quarters shooting, the whip",{
  attackMods:c=>{if(isGun(c.w)){const i=c.dis.indexOf("enemy next to you");if(i>=0)c.dis.splice(i,1);}},
  critCheck:c=>{if(isGun(c.w))c.a._d=c.d;},
  afterHit:async c=>{const a=c.a,t=c.t;if(c.w.whip&&t.hp>0&&!t.dead){t.st.slowed=2;float(t,"SLOWED","#d0c0a0");}
    if(isGun(c.w)&&isHero(a)&&(c.crit||t.hp<=0)&&a.res.grit<RES.grit.max(G.level)){a.res.grit++;float(a,"+1 GRIT","#ffd060");}},
  afterAttack:async c=>{const a=c.a;if(!isGun(c.w)||!isHero(a)||c.w.noAmmo)return;takeItem("bullets");gunshot(a);
    if(a._d===1&&a.task!=="clean"){a.jammed=true;float(a,"MISFIRE!","#ff9060");log(`The ${esc(a.name)}'s pistol misfires and jams! (Use CLEAR THE JAM.)`,"miss");}}});
// trick shots: each costs 1 grit and is one of your attacks
const TRICKS=[
  {k:"deadeye",t:"DEADEYE SHOT",sub:"advantage on this shot"},
  {k:"dazing",t:"DAZING SHOT",sub:"on a hit, CON save or it has disadvantage on attacks next turn"},
  {k:"disarming",t:"DISARMING SHOT",sub:"on a hit, STR save or its attacks do half damage for the fight"},
  {k:"forceful",t:"FORCEFUL SHOT",sub:"on a hit, STR save or it's knocked 3 squares back"},
  {k:"winging",t:"WINGING SHOT",sub:"on a hit, DEX save or it's knocked prone"},
  {k:"piercing",t:"PIERCING SHOT",sub:"the bullet goes through: attack everyone in a line"}];
function gunButtons(u){const B=[];if(u.sub!=="gunslinger"||u.wild)return B;const w=weaponOf(u,"main");const ammo=G.bag.bullets||0;
  if(u.jammed){B.push({t:"CLEAR THE JAM",icon:"lock",sub:"Action · fix the misfired pistol",cost:"action",dis:!hasAction()||C.attacksLeft>0,f:async()=>{busy=true;C.actions--;u.jammed=false;await say(`The ${u.name} clears the jammed pistol.`,700);afterAction();}});return B;}
  for(const T of TRICKS)B.push({t:T.t,icon:"bow",sub:`1 grit (${u.res.grit||0} left) · uses an attack · ${T.sub}`,cost:"action",dis:!canAttack()||(u.res.grit||0)<=0||ammo<=0,
    f:()=>targetMode({kind:"enemy",range:longRange(w),label:`${T.t}: which enemy?`,onPick:async(x,y,t)=>{u.res.grit--;useAttack(u);const dc=8+prof()+abm(u,"dex");
      if(T.k==="piercing"){const dx=Math.sign(t.x-u.x),dy=Math.sign(t.y-u.y);const hit=[];for(let i=1;i<=w.range;i++){const m=monAt(u.x+dx*i,u.y+dy*i);if(isWall(u.x+dx*i,u.y+dy*i))break;if(m&&m.inCombat&&m.hp>0)hit.push(m);}
        if(!hit.includes(t))hit.unshift(t);for(const m of hit)if(m.hp>0)await attack(u,m,Object.assign({},w,{noAmmo:true}));takeItem("bullets");gunshot(u);return;}
      await attack(u,t,w,{adv:T.k==="deadeye"?"deadeye shot":undefined,onHit:async tt=>{if(tt.hp<=0)return;
        if(T.k==="dazing"){const s=saveRoll(tt,"con",dc);if(!s.ok){tt.st.dazed=true;float(tt,"DAZED","#ffe060");}}
        if(T.k==="disarming"){const s=saveRoll(tt,"str",dc);if(!s.ok){tt.st.disarmed=true;float(tt,"DISARMED","#ffffff");}}
        if(T.k==="winging"){const s=saveRoll(tt,"dex",dc);if(!s.ok){tt.st.prone=true;float(tt,"PRONE","#ffffff");}}
        if(T.k==="forceful"){const s=saveRoll(tt,"str",dc);if(!s.ok){const dx=Math.sign(tt.x-u.x),dy=Math.sign(tt.y-u.y);for(let i=0;i<3;i++){const nx=tt.x+dx,ny=tt.y+dy;if(isWall(nx,ny)||unitAt(nx,ny)||blocksObj(nx,ny))break;tt.x=nx;tt.y=ny;}float(tt,"KNOCKED BACK","#ffffff");}}}});}})});
  B.push({t:"SHOOT OUT A LIGHT",icon:"bow",sub:"Uses an attack and a bullet · snuff a wall torch",cost:"action",dis:!canAttack()||ammo<=0,f:()=>targetMode({kind:"tile",range:w.range*3,torchOK:true,label:"Shoot which torch?",onPick:async(x,y)=>{
    if(!litTorchAt(x,y)){prompt("Tap a lit torch on a wall.");afterAction();return;}useAttack(u);takeItem("bullets");gunshot(u);G.torches.find(q=>q.x===x&&q.y===y).out=true;computeLight();fov();await say("BANG! The torch is blown out.",700);}})});
  return B;}
effect("trickConditions","Dazed and disarmed monsters",{attackMods:c=>{if(c.a.st.dazed)c.dis.push("dazed");},afterAttack:async c=>{delete c.a.st.dazed;},
  damageIn:async c=>{if(c.o.src&&c.o.src.st&&c.o.src.st.disarmed&&c.o.attack)c.n=Math.floor(c.n/2);}});
// no shooting without bullets, or with a jammed pistol
async function gunReady(u,w){if(!isGun(w))return true;if(u.jammed){prompt("The pistol is jammed! Use CLEAR THE JAM first.");return false;}if(!(G.bag.bullets>0)){prompt("Out of bullets! Switch to your other weapon, or buy more from a merchant.");return false;}return true;}
// becoming a gunslinger: bullets, a hat, and a choice of sidearm
{const base=chooseSubclasses;chooseSubclasses=async()=>{await base();for(const h of G.party){if(h.sub==="gunslinger"&&!h.gsAlt){h.look="gunslinger";addItem("bullets",20);
  const c=await choose(`The ${h.name} takes up the pistol (and a hat). Pick a sidearm:`,[{t:"WHIP",sub:"1d4, reaches 2 squares; a hit slows the target"},{t:"SHORTSWORD",sub:"1d6, finesse"}]);h.gsAlt=c===0?"whip":"sword";
  if(h.res.grit===undefined)h.res.grit=RES.grit.max(G.level);$("tBox").hidden=true;hud();}}};}
{const base=featRes;featRes=h=>{const r=base(h);if(h.sub==="gunslinger"&&!r.includes("grit"))r.push("grit");if(h.id==="paladin"&&h.sub&&!r.includes("channel"))r.push("channel");return r;};}
// the gunslinger's rest task: cleaning the gun (no misfires until the next rest)
{const base=doTask;doTask=h=>{if(h.sub==="gunslinger"&&!h.dead&&!h.wild){h.task="clean";h.jammed=false;return `The ${h.name} strips and cleans the pistol (no misfires until the next rest).`;}return base(h);};}
TASKS.gunslingerShow={id:"clean",name:"Gun cleaned",fx:"no misfires"};
// shooting a lock off, out of combat
async function shootLock(d,u){if(!(G.bag.bullets>0)){toast("No bullets left.");return false;}takeItem("bullets");gunshot(u);const r=rnd(20)+abm(u,"dex")+prof();const ok=r>=(d.iron?18:15);
  await say(ok?`BANG! The lock bursts apart. (${r} vs ${d.iron?18:15})`:`BANG! The bullet smashes into the lock but it holds. (${r} vs ${d.iron?18:15}) Every creature on this floor heard that.`,1300,true);$("tBox").hidden=true;
  if(ok){d.locked=false;d.open=true;computeLight();fov();}return ok;}
// gunpowder trails
GROUND.powder=7;
function layPowder(h){if(!(G.bag.bullets>0)){toast("You need a bullet's worth of powder.");return;}const dx=h.face==="s"?(h.flip?-1:1):0,dy=h.face==="b"?-1:h.face==="f"?1:0;const tiles=[];
  for(let i=1;i<=3;i++){const x=h.x+dx*i,y=h.y+dy*i;if(!inB(x,y)||isWall(x,y)||blocksObj(x,y)||gnd(x,y)===GROUND.water)break;tiles.push([x,y]);}
  if(!tiles.length){toast("No room to lay powder that way. Face an open floor.");return;}takeItem("bullets");for(const [x,y] of tiles)if(gnd(x,y)===0||gnd(x,y)===GROUND.rubble)G.ground[y][x]=GROUND.powder;
  closeMenu();toast(`You pour a thin line of gunpowder across ${tiles.length} square${tiles.length>1?"s":""}. Any flame will set it off.`);}
{const base=igniteAt;igniteAt=(x,y)=>{if(inB(x,y)&&gnd(x,y)===GROUND.powder){G.ground[y][x]=0;G.fire.set(y*G.W+x,1);fx.push({type:"boom",x,y,t:now()});computeLight();
    setTimeout(()=>{if(!G)return;for(const [a,b] of DIRS8){const nx=x+a,ny=y+b;if(!inB(nx,ny))continue;const g=gnd(nx,ny);if(g===GROUND.powder||g===GROUND.oil)igniteAt(nx,ny);const o=G.objs.find(q=>!q.gone&&q.x===nx&&q.y===ny);if(o&&o.type==="barrel")breakBarrel(o,true,0,0);else if(o&&isWooden(o))setAlight(o);}scorch();},160);return;}
  base(x,y);};}
function drawPowder(camX,camY){if(!G||!G.ground)return;ctx.fillStyle="#2a2624";for(let y=Math.max(0,Math.floor(camY/TS));y<Math.min(G.H,Math.ceil((camY+SH)/TS)+1);y++)for(let x=Math.max(0,Math.floor(camX/TS));x<Math.min(G.W,Math.ceil((camX+SW)/TS)+1);x++){
  if(G.ground[y][x]!==GROUND.powder||!G.explored[y][x])continue;const sx=x*TS-camX,sy=y*TS-camY;for(let i=0;i<7;i++)ctx.fillRect(sx+2+((i*5+x*3)%12),sy+5+((i*7+y)%6),1,1);ctx.fillRect(sx+1,sy+8,14,1);}}
// outside combat: the gunslinger's abilities
function gunExploreButtons(h){if(h.sub!=="gunslinger"||h.wild)return [];const A=[];
  A.push({t:"SHOOT",sub:`Shoot out a torch or burst a barrel up to 18 squares away · ${G.bag.bullets||0} bullets · VERY LOUD`,dis:!(G.bag.bullets>0)||h.jammed,f:()=>{G.aim={kind:"shoot",by:h};closeMenu();toast("Tap a torch or barrel to shoot.");}});
  A.push({t:"LAY A POWDER TRAIL",sub:"Pour out a bullet's powder as a 3-square fuse in front of you",dis:!(G.bag.bullets>0),f:()=>layPowder(h)});
  if(h.jammed)A.push({t:"CLEAR THE JAM",sub:"Fix the misfired pistol",f:()=>{h.jammed=false;toast("The pistol is working again.");}});
  return A;}
{const base=classActions;classActions=h=>{const A=base(h);if(h.dead||h.down||mode!=="explore")return A;
  if(h.id==="paladin"&&!h.wild)A.push({t:"DIVINE SENSE",sub:"Feel for undead within 12 squares",f:()=>{closeMenu();divineSense(h);}});return A.concat(gunExploreButtons(h));};}
{const base=aimAt;aimAt=async(x,y)=>{const a=G.aim;if(!a||a.kind!=="shoot")return base(x,y);G.aim=null;const h=a.by;if(cheb(h,{x,y})>18){toast("Too far for a pistol.");return;}
  const torch=G.torches.find(q=>q.x===x&&q.y===y&&!q.out);const bar=G.objs.find(o=>!o.gone&&o.type==="barrel"&&o.x===x&&o.y===y);
  if(!torch&&!bar){toast("Tap a lit torch or a barrel.");return;}busy=true;try{takeItem("bullets");gunshot(h);fx.push({type:"shot",from:{x:h.x,y:h.y},to:{x,y},t:now(),col:"#f0e0c0"});await wait(200);
    if(torch){torch.out=true;computeLight();fov();await say("BANG! The torch is blown out. (Everything on this floor heard that.)",1200,true);}
    else{await breakBarrel(bar,false,0,0);await say("BANG! The barrel bursts and oil gushes across the floor.",1100,true);}}finally{busy=false;}$("tBox").hidden=true;hud();};}
