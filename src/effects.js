// ================= EFFECTS: the trigger system =================
// The core rules (attacks, damage, going down) announce moments ("an attack is being set up",
// "an attack hit", "damage is about to land"...). Every class, race, subclass, feat and item effect
// below registers what it does at those moments. To add a new ability, add an entry here:
// the core rules don't need to change.
//
// Moments (and what the handler gets in ctx):
//   attackMods(ctx)      a, t, w, adv[], dis[], notes[], bonus, cover          (sync: shown in hit-chance previews too)
//   beforeRoll(ctx)      a, t, w, mode                                          (async: reactions that change advantage)
//   critCheck(ctx)       a, t, w, d (die), crit, hit                            (sync)
//   beforeHit(ctx)       a, t, w, total, ac, crit, miss, msg                    (async: set ctx.miss to turn a hit into a miss)
//   onHit(ctx)           a, t, w, crit, md, total, parts[]                      (async: add extra damage dice)
//   afterHit(ctx)        a, t, w, crit                                          (async: riders after the damage landed)
//   afterAttack(ctx)     a, t, w, hit                                           (async: runs on hits and misses)
//   damageIn(ctx)        u, n, type, o                                          (async: resistances, shields, soaking damage)
//   damageTaken(ctx)     u, n, type, o                                          (async: reactions after being hurt)
//   wouldDrop(ctx)       h, over, saved                                         (async: set ctx.saved to stay up)
const EFFECTS=[];
function effect(id,desc,handlers){EFFECTS.push(Object.assign({id,desc},handlers));}
function fire(moment,ctx){for(const e of EFFECTS)if(e[moment])e[moment](ctx);return ctx;}
async function fireAsync(moment,ctx){for(const e of EFFECTS){if(e[moment])await e[moment](ctx);if(ctx.stop)break;}return ctx;}
const isHero=u=>u&&u.side==="h";
const weaponHit=w=>!w.spell;
const halve=(ctx,why)=>{ctx.n=Math.floor(ctx.n/2);if(why)ctx.why=(ctx.why||[]).concat(why);};

// ---------- subclass & class features ----------
effect("assassinate","Assassin: advantage on creatures that haven't acted yet",{attackMods:c=>{if(isHero(c.a)&&c.a.sub==="assassin"&&c.t.side==="m"&&C&&!c.t.acted)c.adv.push("assassinate");}});
effect("wolfTotem","Path of the Wolf: allies have advantage on melee attacks near the raging barbarian",{attackMods:c=>{if(isHero(c.a)&&c.w.melee&&heroesUp().some(f=>f!==c.a&&f.sub==="wolf"&&f.st.raging&&cheb(f,c.t)<=1))c.adv.push("wolf totem");}});
effect("sharpshooter","Sharpshooter feat: ranged attacks ignore half cover, +1 to hit",{attackMods:c=>{if(!c.w.melee&&hasFeat(c.a,"sharpshooter")){if(c.cover===2)c.cover=0;c.bonus+=1;}}});
effect("wardingFlare","Light Domain: reaction to give an attacker disadvantage",{beforeRoll:async c=>{const t=c.t,a=c.a;
  if(isHero(t)&&t.sub==="light"&&a.side==="m"&&canReact(t)&&(t.res.flare||0)>0&&c.mode>=0&&cheb(a,t)<=6&&await askReact(t,`Warding Flare against the ${a.name}'s attack?`)){
    t.reaction=false;t.res.flare--;c.mode=c.mode>0?0:-1;fx.push({type:"ring",u:t,col:"#fff0a0",t:now()});await say(`Warding Flare! A burst of light blinds the ${a.name} (disadvantage).`,850);}}});
effect("protect","Fighter: reaction to protect an adjacent ally (disadvantage on the attack)",{beforeRoll:async c=>{const t=c.t,a=c.a;if(!(isHero(t)&&a.side==="m"&&c.mode>=0))return;
  const f=heroesUp().find(h=>h.id==="fighter"&&h!==t&&!h.wild&&cheb(h,t)<=1&&canReact(h));
  if(f&&await askReact(f,`Protect the ${t.name} from the ${a.name}'s attack? (uses the ${f.name}'s reaction: disadvantage)`)){f.reaction=false;c.mode=c.mode>0?0:-1;await say(`The ${f.name} steps in to protect the ${t.name}! (disadvantage)`,800);}}});
effect("critRange","Champion crits on 19–20; sleeping and surprised-by-assassin targets take crits",{critCheck:c=>{
  if(c.d>=critMin(c.a))c.crit=true;
  if(c.hit&&isHero(c.a)&&c.a.sub==="assassin"&&c.t.st.surprised)c.crit=true;}});
effect("shield","Wizard: Shield reaction (+5 AC) can turn a hit into a miss",{beforeHit:async c=>{const t=c.t;
  if(!c.crit&&isHero(t)&&t.id==="wizard"&&!t.wild&&isPrepared(t,"shield")&&canReact(t)&&slotAvail(t,1)&&c.total<c.ac+5&&await askReact(t,`The ${c.a.name} rolled ${c.total} against the Wizard's AC ${c.ac}. Cast Shield (+5 AC, uses a level 1 slot) to make it miss?`)){
    useSlot(t,1);t.reaction=false;t.st.shieldSpell=true;fx.push({type:"ring",u:t,col:"#9fd0ff",t:now()});if(t.sub==="abjurer")t.ward=Math.min(wardMax(t),(t.ward||0)+2);
    c.miss=true;c.msg=`The Wizard casts Shield! AC ${c.ac} → ${c.ac+5}. Miss!`;}}});
effect("subclassDamage","Colossus Slayer, Giant's Might, Dread Ambusher, Symbiotic Entity, manoeuvres",{onHit:async c=>{c.total+=await subOnHit(c.a,c.t,c.w,c.crit,c.parts);}});
effect("favoredEnemy","Ranger: +1d4 against the favoured enemy",{onHit:async c=>{if(favoredHit(c.a,c.t)){c.total+=roll("1d4",c.crit).total;c.parts.push("+1d4 favoured enemy");}}});
effect("savageAttacks","Half-Orc: an extra weapon die on melee crits",{onHit:async c=>{if(c.crit&&isHero(c.a)&&c.a.race==="halforc"&&c.w.melee&&!c.w.spell){const p=parseDice(c.w.dice);if(p){const e=rnd(p.d);c.total+=e;c.parts.push(`+${e} savage`);}}}});
effect("huntersMark","Hunter's Mark: +1d6 on weapon hits against the marked target",{onHit:async c=>{const a=c.a;if(isHero(a)&&weaponHit(c.w)&&a.conc&&a.conc.type==="mark"&&a.conc.target===c.t){c.total+=roll("1d6",c.crit).total;c.parts.push("+1d6 mark");}}});
effect("sneakAttack","Rogue: Sneak Attack once per turn with advantage or an ally next to the target",{onHit:async c=>{const a=c.a,t=c.t,md=c.md;
  if(isHero(a)&&weaponHit(c.w)&&a.info.sneak&&(c.w.finesse||!c.w.melee)&&C&&!C.sneakUsed&&md.mode>=0&&(md.mode>0||friendsOf(a).some(f=>cheb(f,t)===1))){const sd=sneakDice();c.total+=roll(sd,c.crit).total;C.sneakUsed=true;c.parts.push(`+${sd} sneak attack`);}}});
effect("manoeuvreRiders","Battle Master: trip / push / menace after a hit",{afterHit:async c=>{await subAfterHit(c.a,c.t,c.w);}});
effect("coatedWeapon","Poison or acid on a weapon: used up by the next attack",{
  afterHit:async c=>{const coat=c.coat;const t=c.t;if(!coat||t.hp<=0||t.dead||t.down)return;const cd=roll(coat.dice,c.crit).total;float(t,coat.type.toUpperCase(),coat.type==="acid"?"#b0f060":"#8aff7a");
    let msg=`The ${coat.name} burns into the wound: ${cd} ${coat.type}`;if(coat.type==="poison"){const s=saveRoll(t,"con",12);if(!s.ok&&!(t.tr&&t.tr.immune&&t.tr.immune.includes("poison"))){t.st.poisoned=2;msg+=" and it's poisoned";}msg+=` (${s.txt})`;}
    await say(msg+".",900);await dealDamage(t,cd,coat.type,{src:c.a});},
  afterAttack:async c=>{if(c.coat&&!c.hit)log(`The ${esc(c.coat.name)} on ${esc(c.a.name)}'s ${esc(c.w.name)} is wasted on the miss.`,"miss");}});
// ---------- damage taken ----------
effect("rage","Barbarian rage: resist weapon damage (Bear totem: all but psychic)",{damageIn:async c=>{const u=c.u;if(!isHero(u)||!u.st.raging)return;const phys=["slashing","piercing","bludgeoning"].includes(c.type);
  if(phys||(u.sub==="bear"&&c.type!=="psychic"))halve(c,"rage");}});
effect("raceResist","Dwarf (poison) and Tiefling (fire) resistance",{damageIn:async c=>{const u=c.u;if(isHero(u)&&!u.wild&&u.race&&RACES[u.race].resist&&RACES[u.race].resist.includes(c.type))halve(c,"resistance");}});
effect("uncannyDodge","Rogue: reaction to halve an attack's damage",{damageIn:async c=>{const u=c.u;if(isHero(u)&&u.info.uncanny&&c.o.attack&&canReact(u)&&c.n>=4&&await askReact(u,`Uncanny Dodge: halve this ${c.n} damage?`)){u.reaction=false;halve(c);float(u,"UNCANNY DODGE","#9fd0ff");}}});
effect("arcaneWard","Abjurer: the ward soaks damage first",{damageIn:async c=>{const u=c.u;if(isHero(u)&&u.ward>0&&c.n>0){const a=Math.min(u.ward,c.n);u.ward-=a;c.n-=a;float(u,"WARD -"+a,"#9fd0ff");}}});
effect("tempHP","Temporary hit points soak damage",{damageIn:async c=>{const u=c.u;if(isHero(u)&&u.thp>0&&c.n>0){const a=Math.min(u.thp,c.n);u.thp-=a;c.n-=a;float(u,"TEMP -"+a,"#a0ff80");}}});
effect("hellishRebuke","Tiefling: once per long rest, burn whoever hurt you",{damageTaken:async c=>{const u=c.u,o=c.o;
  if(isHero(u)&&u.race==="tiefling"&&!u.rebukeUsed&&u.hp>0&&C&&o.src&&o.src.side==="m"&&o.src.hp>0&&canReact(u)&&await askReact(u,`Hellish Rebuke the ${o.src.name}?`)){
    u.rebukeUsed=true;u.reaction=false;const src=o.src;const s=saveRoll(src,"dex",8+prof()+abm(u,"cha"));const dm=roll("2d10").total;
    fx.push({type:"pillar",x:src.x,y:src.y,t:now()});await say(`Hellish Rebuke! The ${u.name} wreathes the ${src.name} in hellfire (${s.txt}).`,950);await dealDamage(src,s.ok?Math.floor(dm/2):dm,"fire",{src:u});}}});
effect("relentless","Half-Orc: once per long rest, drop to 1 HP instead of 0",{wouldDrop:async c=>{const h=c.h;
  if(h.race==="halforc"&&!h.relentlessUsed&&!(S.rules.deathSaves&&c.over>=h.maxHp)){h.relentlessUsed=true;h.hp=1;c.saved=true;float(h,"RELENTLESS","#ffb070");await say(`Relentless Endurance! The ${h.name} refuses to fall and stays up with 1 HP.`,1000);hud();}}});
