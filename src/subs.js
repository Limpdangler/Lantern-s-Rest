// ================= subclasses (chosen at party level 3) =================
const SUBS={
  fighter:[
    {id:"champion",name:"Champion",desc:"Crits on 19–20. Remarkable Athlete: +half proficiency to STR, DEX and CON checks you aren't trained in (climbing, jumping, shoving, initiative)."},
    {id:"battlemaster",name:"Battle Master",desc:"4 Superiority Dice (d8, back on short rest). Arm a manoeuvre before attacking: Trip (knock prone), Push (shove 3 squares), Menace (frighten) or Precision (+d8 to hit). Each adds the die to damage.",feats:["mtrip","mpush","mmenace","mprecise"]},
    {id:"runeknight",name:"Rune Knight",desc:"Giant's Might (bonus action, a few times per long rest): grow huge for the fight. +1d6 weapon damage once a turn, advantage on STR checks and saves, and your shoves throw foes 2 squares.",feats:["giantsmight"]}],
  barbarian:[
    {id:"berserker",name:"Berserker",desc:"Frenzy: while raging, make an extra melee attack as a bonus action every turn. Afterwards the berserker gains a level of exhaustion.",feats:["frenzy"]},
    {id:"bear",name:"Path of the Bear",desc:"While raging, you resist ALL damage (fire, acid, poison, magic...), not just weapons. The ultimate tank."},
    {id:"wolf",name:"Path of the Wolf",desc:"While raging, allies get advantage on melee attacks against any enemy standing next to you. Perfect with a rogue."}],
  rogue:[
    {id:"thief",name:"Thief",desc:"Fast Hands: give potions, throw oil and torches, pick locks and disarm traps as a bonus action. Second-Story Work: climb ledges without a check."},
    {id:"assassin",name:"Assassin",desc:"Advantage against enemies that haven't had a turn yet this fight. Any hit on a surprised enemy is an automatic critical. Sneak in, strike first."},
    {id:"trickster",name:"Arcane Trickster",desc:"Learns magic (INT): Sleep and Magic Missile. Mage Hand lets you disarm traps and open chests from a distance, safely.",spells:["sleep","magicmissile"],caster:"third"}],
  ranger:[
    {id:"hunter",name:"Hunter",desc:"Colossus Slayer: once per turn, +1d8 damage against a target that's already hurt. Simple and strong."},
    {id:"beastmaster",name:"Beast Master",desc:"A loyal wolf joins the party as an extra member you control (bite knocks prone). If it dies, a new one comes after a long rest."},
    {id:"gloom",name:"Gloom Stalker",desc:"Add WIS to initiative. On the first turn of a fight: +2 speed and an extra attack with +1d8. In darkness, monsters with darkvision still can't see you."}],
  wizard:[
    {id:"evoker",name:"Evoker",desc:"Sculpt Spells: your Fireball and Thunderwave never hurt your own party. Blast freely."},
    {id:"abjurer",name:"Abjurer",desc:"Arcane Ward: a magical shield that soaks up damage (2 × level + INT). Restored by long rests and recharged whenever you cast Shield."},
    {id:"necro",name:"Necromancer",desc:"Grim Harvest: kill with a spell and heal (2 × spell level, 3 × for necromancy). Learns Ray of Sickness (poison bolt).",spells:["rayofsickness"]}],
  cleric:[
    {id:"life",name:"Life Domain",desc:"Healing spells heal 2 + spell level extra. Preserve Life (Channel Divinity): share out 5 × level HP among wounded allies.",feats:["preservelife"]},
    {id:"light",name:"Light Domain",desc:"Warding Flare: impose disadvantage on attacks against you (WIS times per long rest). Burning Hands spell, and Radiance of the Dawn (Channel Divinity) burns every enemy near you.",feats:["radiance"],spells:["burninghands"]},
    {id:"war",name:"War Domain",desc:"War Priest: extra weapon attack as a bonus action (WIS times per long rest). Guided Strike (Channel Divinity): +10 to one attack roll.",feats:["warpriest","guidedstrike"]}],
  druid:[
    {id:"moon",name:"Circle of the Moon",desc:"Wild Shape into a brown bear as well as a wolf (much tougher, two attacks). Spend spell slots to heal while transformed.",feats:["moonheal"]},
    {id:"land",name:"Circle of the Land",desc:"Natural Recovery: get spell slots back on a short rest. Learns Spike Growth: a big field of thorns that hurts anything that walks through it.",spells:["spikegrowth"]},
    {id:"spores",name:"Circle of Spores",desc:"Halo of Spores: enemies that start their turn next to you take necrotic damage. Symbiotic Entity (uses Wild Shape): temporary HP and extra necrotic damage on hits.",feats:["symbiotic"]}]
};
const subOf=h=>h&&h.sub?(SUBS[h.id]||[]).find(s=>s.id===h.sub):null;
const featsOf=h=>h.info.feats.concat((subOf(h)||{}).feats||[]);
const spellsOf=h=>{const s=h.info.spells.concat((subOf(h)||{}).spells||[],h.learned||[]);return s.filter((v,i)=>s.indexOf(v)===i);};
const casterOf=h=>h.info.caster||(subOf(h)||{}).caster||null;
const SLOTS_THIRD=[[],[],[2],[3],[3],[3],[4,2],[4,2],[4,2]];
Object.assign(RES,{natrec:{name:"Natural Recovery",rest:"lr",max:()=>1},superiority:{name:"Superiority Dice",rest:"sr",max:()=>4},giantsmight:{name:"Giant's Might",rest:"lr",max:l=>prof()},channel:{name:"Channel Divinity",rest:"sr",max:l=>l>=6?2:1},
  warpriest:{name:"War Priest",rest:"lr",max:()=>3},flare:{name:"Warding Flare",rest:"lr",max:()=>3}});
FEATS.turnundead.res="channel";
Object.assign(FEATS,{
  mtrip:{name:"Trip Attack",cost:"free",res:"superiority",desc:"Arm: next hit adds 1d8 and the target makes a STR save or falls prone."},
  mpush:{name:"Pushing Attack",cost:"free",res:"superiority",desc:"Arm: next hit adds 1d8 and pushes the target up to 3 squares (STR save)."},
  mmenace:{name:"Menacing Attack",cost:"free",res:"superiority",desc:"Arm: next hit adds 1d8 and frightens the target (WIS save)."},
  mprecise:{name:"Precision Attack",cost:"free",res:"superiority",desc:"Arm: add 1d8 to your next attack roll."},
  giantsmight:{name:"Giant's Might",cost:"bonus",res:"giantsmight",desc:"Bonus action: grow huge for this fight."},
  frenzy:{name:"Frenzy Attack",cost:"bonus",desc:"Bonus action while raging: one extra melee attack. Costs exhaustion after the fight."},
  preservelife:{name:"Preserve Life",cost:"action",res:"channel",desc:"Action: heal wounded allies within 6 squares, up to 5 × level HP in total."},
  radiance:{name:"Radiance of the Dawn",cost:"action",res:"channel",desc:"Action: every enemy within 6 squares takes 2d10 + level radiant (CON save for half)."},
  warpriest:{name:"War Priest Attack",cost:"bonus",res:"warpriest",desc:"Bonus action: one extra weapon attack."},
  guidedstrike:{name:"Guided Strike",cost:"free",res:"channel",desc:"Arm: +10 to your next attack roll."},
  moonheal:{name:"Moon Heal",cost:"bonus",desc:"Bonus action in beast form: spend a spell slot to heal 1d8 per slot level."},
  symbiotic:{name:"Symbiotic Entity",cost:"action",res:"wildshape",desc:"Action: gain 4 × level temporary HP; your Halo of Spores and melee hits deal extra necrotic damage."}
});
Object.assign(SPELLS,{
  sleep:{name:"Sleep",lvl:1,cost:"action",tgt:"area",range:18,radius:1,desc:"3×3 area: 5d8 HP worth of creatures fall asleep, weakest first. Hitting them wakes them."},
  rayofsickness:{name:"Ray of Sickness",lvl:1,cost:"action",tgt:"enemy",range:12,desc:"Spell attack: 2d8 poison, and CON save or poisoned."},
  burninghands:{name:"Burning Hands",lvl:1,cost:"action",tgt:"self",desc:"Everyone next to you: 3d6 fire, DEX save for half. Ignites oil. Hits allies too!"},
  spikegrowth:{name:"Spike Growth",lvl:2,cost:"action",tgt:"area",range:18,radius:2,conc:true,desc:"Concentration. 5×5 field of thorns: difficult terrain, and 2d4 piercing for every square anyone moves through it."}
});
// ---------- choosing ----------
async function chooseSubclasses(){if(!G||G.level<3)return;
  for(const h of G.party.slice()){if(h.dead||h.sub||!SUBS[h.id])continue;const opts=SUBS[h.id];
    const c=await choose(`The ${h.name} has grown in skill. Choose a path:`,opts.map(o=>({t:o.name.toUpperCase(),sub:o.desc})));const pick=opts[Math.max(0,c)];
    h.sub=pick.id;log(`${esc(h.name)} becomes a ${esc(pick.name)}.`,"lv");applySub(h,true);await say(`The ${h.name} is now a ${pick.name}!`,1100,true);}
  $("tBox").hidden=true;hud();}
function applySub(h,fresh){if(h.sub==="abjurer")h.ward=wardMax(h);
  for(const k of featRes(h))if(h.res[k]===undefined)h.res[k]=RES[k].max(G.level);
  if(casterOf(h)&&fresh){h.slots=slotMax(h);}
  if(h.sub==="beastmaster"&&fresh)summonBeast(h);}
const wardMax=h=>2*G.level+abm(h,"int");
// ---------- beast companion ----------
const BEAST_DEF={id:"beast",name:"Wolf",str:12,dex:15,con:12,int:3,wis:12,cha:6,ac:13,hd:8,dmg:"2d4",range:1,speed:8};
CINFO.beast={atk:{name:"Bite",abil:"dex",type:"piercing",finesse:true,wolf:true},alt:{name:"Pounce",abil:"str",dice:"1d6",type:"piercing",range:1},saves:["str","dex"],skills:["perception","stealth","survival"],feats:[],spells:[],primary:"dex",
  blurb:"The ranger's loyal wolf. Its bite can knock enemies prone."};
RACES.beast={name:"Animal",asi:{},dv:true,desc:"",hidden:true};
function summonBeast(owner){if(G.party.some(h=>h.id==="beast"&&!h.dead))return;const b=mkHero(BEAST_DEF,"beast");b.owner=owner.id;const p=nearFree(owner.x,owner.y)||{x:owner.x,y:owner.y};b.x=p.x;b.y=p.y;b.dx=b.x*TS;b.dy=b.y*TS;G.party.push(b);
  log("A wolf pads out of the dark and joins the ranger.","lv");fov();hud();}
// ---------- spell runners ----------
Object.assign(SPELL_RUN,{
  sleep:u=>targetMode({kind:"tile",range:18,area:1,label:"Sleep: tap a square to aim (3×3).",preview:(x,y)=>{const l=unitsIn(x,y,1,false).filter(m=>m.inCombat);return `Sleep here could knock out ${l.length} enem${l.length===1?"y":"ies"} (5d8 HP worth, weakest first). Tap again to cast.`;},
    onPick:async(x,y)=>{C.actions--;const lvl=useSlot(u,1);delete u.st.hidden;let pool=roll(`${3+2*lvl}d8`).total;const l=unitsIn(x,y,1,false).filter(m=>m.inCombat&&!m.tr.undead&&!m.st.asleep).sort((a,b)=>a.hp-b.hp);let n=0;
      fx.push({type:"ring",u:{x,y},col:"#c0a0ff",t:now()});for(const m of l){if(m.hp>pool)break;pool-=m.hp;m.st.asleep=true;m.st.prone=true;float(m,"ZZZ","#c0a0ff");n++;}
      await say(`Sleep! ${n} enem${n===1?"y slumps":"ies slump"} to the ground, fast asleep. Hits wake them up.`,1000);}}),
  rayofsickness:u=>targetMode({kind:"enemy",range:12,label:"Ray of Sickness: tap an enemy.",onPick:async(x,y,t)=>{C.actions--;const lvl=useSlot(u,1);delete u.st.hidden;
    await attack(u,t,{name:"Ray of Sickness",abil:"int",spell:true,spellLvl:lvl,necro:true,dice:`${1+lvl}d8`,type:"poison",range:12,melee:false},{onHit:async tt=>{if(tt.hp<=0)return;const s=saveRoll(tt,"con",spellDC(u));if(!s.ok){tt.st.poisoned=2;float(tt,"POISONED","#8aff7a");}}});}}),
  burninghands:async u=>{const list=unitsIn(u.x,u.y,1,true).filter(v=>v!==u);if(!list.length){prompt("Nobody is next to you. Burning Hands hits everything in the 8 squares around you.");return;}
    busy=true;C.actions--;const lvl=useSlot(u,1);delete u.st.hidden;fx.push({type:"boom",x:u.x,y:u.y,t:now()});await say("Burning Hands! A fan of flame roars out.",800);const dc=spellDC(u);const dm=roll(`${2+lvl}d6`).total;
    for(const [a,b] of areaTiles(u.x,u.y,1))if(gnd(a,b)===GROUND.oil)igniteAt(a,b);
    for(const v of list){if(v.dead||(v.side==="m"&&v.hp<=0))continue;const s=saveRoll(v,"dex",dc);log(`${esc(v.name)}: ${s.txt}.`,"magic");await dealDamage(v,s.ok?Math.floor(dm/2):dm,"fire",{src:u,spellLvl:lvl});}
    afterAction();},
  spikegrowth:u=>targetMode({kind:"tile",range:18,area:2,label:"Spike Growth: tap a square to aim (5×5).",preview:(x,y)=>areaPreview("Spike Growth",x,y,2,true),
    onPick:async(x,y)=>{C.actions--;useSlot(u,2);const tiles=areaTiles(x,y,2).map(([a,b])=>b*G.W+a);startConc(u,{type:"spikes",name:"Spike Growth",tiles});for(const k of tiles){G.entangle.add(k);G.spikes.add(k);}
      fx.push({type:"vines",x,y,t:now()});await say("Spike Growth! The floor bristles with thorns. Moving through it hurts.",1000);}})
});
// ---------- feat runners ----------
const arm=(u,k,label)=>{C.armed=k;buildPanel();prompt(`${label} armed: it triggers on your next hit.`);};
Object.assign(FEAT_RUN,{
  mtrip:u=>arm(u,"trip","Trip Attack"),mpush:u=>arm(u,"push","Pushing Attack"),mmenace:u=>arm(u,"menace","Menacing Attack"),mprecise:u=>arm(u,"precise","Precision Attack"),
  guidedstrike:u=>arm(u,"guided","Guided Strike"),
  giantsmight:async u=>{busy=true;C.bonus=false;u.res.giantsmight--;u.st.giant=true;fx.push({type:"ring",u,col:"#ffb070",t:now()});await say(`Giant's Might! The ${u.name} swells to giant size.`,900);afterAction();},
  frenzy:async u=>{if(!u.st.raging){prompt("Frenzy only works while raging.");return;}busy=true;C.bonus=false;u.frenzied=true;C.attacksLeft++;await say(`FRENZY! The ${u.name} gets an extra attack. (Exhaustion after the fight.)`,900);afterAction();},
  warpriest:async u=>{busy=true;C.bonus=false;u.res.warpriest--;C.attacksLeft++;await say(`War Priest: the ${u.name} gets an extra weapon attack.`,850);afterAction();},
  preservelife:async u=>{const hurt=heroesUp().concat(G.party.filter(h=>h.down&&!h.dead)).filter(h=>cheb(h,u)<=6&&h.hp<h.maxHp/2);if(!hurt.length){prompt("Nobody within 6 squares is below half HP.");return;}
    busy=true;C.actions--;u.res.channel--;let pool=5*G.level;const got=[];for(const h of hurt.sort((a,b)=>a.hp-b.hp)){const need=Math.ceil(h.maxHp/2)-h.hp;const n=Math.min(need,pool);if(n<=0)continue;pool-=n;heal(h,n);got.push(`${h.name} +${n}`);}
    fx.push({type:"ring",u,col:"#fff0a0",t:now()});await say(`Preserve Life! ${got.join(", ")}.`,1000);afterAction();},
  radiance:async u=>{const l=foesOf(u).filter(m=>cheb(m,u)<=6&&los(u.x,u.y,m.x,m.y));if(!l.length){prompt("No enemies within 6 squares.");return;}
    busy=true;C.actions--;u.res.channel--;fx.push({type:"wave",u,t:now()});await say("Radiance of the Dawn! Searing light bursts out.",900);const dm=roll("2d10").total+G.level;
    for(const m of l){const s=saveRoll(m,"con",spellDC(u));log(`${esc(m.name)}: ${s.txt}.`,"magic");await dealDamage(m,s.ok?Math.floor(dm/2):dm,"radiant",{src:u});}afterAction();},
  moonheal:async u=>{const lv=slotAvail(u,1);if(!lv){prompt("No spell slots left.");return;}busy=true;C.bonus=false;useSlot(u,1);const n=roll(`${lv}d8`).total;u.wild.hp=Math.min(u.wild.max,u.wild.hp+n);float(u,"+"+n,"#8aff7a");await say(`The beast's wounds knit: +${n}.`,800);hud();afterAction();},
  symbiotic:async u=>{busy=true;C.actions--;u.res.wildshape--;u.thp=Math.max(u.thp||0,4*G.level);u.st.symbiotic=true;fx.push({type:"ring",u,col:"#a0ff80",t:now()});await say(`Symbiotic Entity! Spores swarm around the ${u.name}: ${u.thp} temporary HP.`,1000);hud();afterAction();}
});
// ---------- passive hooks used by the core rules ----------
const critMin=a=>a.side==="h"&&a.sub==="champion"?19:20;
async function subOnHit(a,t,w,crit,parts){let extra=0;
  if(a.side!=="h")return 0;const once=k=>{if(!C)return true;C.turnFlags=C.turnFlags||{};const key=a.id+k;if(C.turnFlags[key])return false;C.turnFlags[key]=1;return true;};
  if(a.sub==="hunter"&&!w.spell&&t.hp<t.maxHp&&once("colossus")){const e=roll("1d8",crit).total;extra+=e;parts.push("+1d8 colossus");}
  if(a.st.giant&&!w.spell&&once("giant")){const e=roll("1d6",crit).total;extra+=e;parts.push("+1d6 giant");}
  if(a.sub==="gloom"&&C&&C.dreadHit){C.dreadHit=false;const e=roll("1d8",crit).total;extra+=e;parts.push("+1d8 dread");}
  if(a.st.symbiotic&&w.melee&&!w.spell){const e=roll("1d6",crit).total;extra+=e;parts.push("+1d6 spores");}
  if(C&&C.armed&&C.cur===a&&["trip","push","menace"].includes(C.armed)&&!w.spell){const e=roll("1d8",crit).total;extra+=e;parts.push("+1d8 manoeuvre");}
  return extra;}
async function subAfterHit(a,t,w){if(!C||C.cur!==a||!C.armed)return;const k=C.armed;if(!["trip","push","menace"].includes(k))return;C.armed=null;a.res.superiority--;
  if(t.hp<=0||t.dead||t.down)return;const dc=8+prof()+Math.max(abm(a,"str"),abm(a,"dex"));
  if(k==="trip"){const s=saveRoll(t,"str",dc);if(!s.ok&&!(t.tr&&t.tr.large)){t.st.prone=true;float(t,"PRONE","#ffffff");}await say(`Trip Attack: ${s.ok?"it keeps its footing":"knocked prone"}! (${s.txt})`,850);}
  if(k==="push"){const s=saveRoll(t,"str",dc);if(!s.ok){await say(`Pushing Attack! (${s.txt})`,700);await pushUnit(t,Math.sign(t.x-a.x),Math.sign(t.y-a.y),3);}else await say(`Pushing Attack: it braces. (${s.txt})`,800);}
  if(k==="menace"){const s=saveRoll(t,"wis",dc);if(!s.ok){t.st.frightened=2;float(t,"FRIGHTENED","#ffffff");}await say(`Menacing Attack: ${s.ok?"it isn't impressed":"it's terrified"}! (${s.txt})`,850);}}
function attackRollBonus(a){if(!C||C.cur!==a||!C.armed)return 0;if(C.armed==="precise"){C.armed=null;a.res.superiority--;return rnd(8);}if(C.armed==="guided"){C.armed=null;a.res.channel--;return 10;}return 0;}
async function sporesHalo(m){if(!C)return;for(const h of heroesUp()){if(h.sub!=="spores"||!canReact(h)||cheb(h,m)>1)continue;h.reaction=false;const s=saveRoll(m,"con",spellDC(h));const dm=roll(h.st.symbiotic?"2d4":"1d4").total;
    float(m,"SPORES","#a0ff80");log(`Halo of Spores: ${esc(m.name)} ${s.txt}.`,"magic");if(!s.ok)await dealDamage(m,dm,"necrotic",{src:h});return;}}
function grimHarvest(m,o){const src=o&&o.src;if(!src||src.side!=="h"||src.sub!=="necro"||!o.spellLvl||src.down||src.dead)return;const n=(o.necro?3:2)*o.spellLvl;heal(src,n);float(src,"+"+n,"#b080ff");log(`Grim Harvest: ${esc(src.name)} drains ${n} HP.`,"magic");}

function wildHP(u,form){return form==="bear"?20+G.level*5:form==="rat"||form==="spider"?4+G.level:11+G.level*2;}
function startWild(u,form){const hp=wildHP(u,form);u.wild={hp,max:hp,form};computeLight();fov();hud();}
const wildPal=h=>h&&h.wild&&h.wild.form==="bear"?{g:"#6a4a30",G:"#46301e",e:"#ffd040",w:"#9a7a5a"}:null;
const wildSpr=h=>h&&h.wild&&h.wild.form==="rat"?monSpr("rat"):h&&h.wild&&h.wild.form==="spider"?monSpr("spider"):monSpr("druidwolf",wildPal(h));
