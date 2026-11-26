// ================= monster behaviour, talking, haggling, revivify, prepared spells (5e rules, batch 3) =================
EVT.spare={kind:2,pious:1,ruthless:-1};EVT.finish={ruthless:2,kind:-2,pious:-1};EVT.haggle={greedy:2,pious:-1};EVT.revive={kind:1,pious:1};
ITEMS.scroll_revivify={name:"Scroll of Revivify",kind:"keep",price:150,floor:2,w:1,desc:"Brings back a hero who died within the last minute, with 1 HP. Offered right after a fight, or read it from the bag."};

// ---------- helpers ----------
function dirTo(a,b){const dx=b.x-a.x,dy=b.y-a.y;const ns=Math.abs(dy)>Math.abs(dx)/2?(dy<0?"north":"south"):"";const ew=Math.abs(dx)>Math.abs(dy)/2?(dx<0?"west":"east"):"";return ns&&ew?ns+"-"+ew:ns||ew||"nearby";}
// what a captured or friendly monster tells you: who has the key, where the traps are, the way down
async function shareSecret(who){const tips=[];const L=G.party[0];
  const own=who.find(q=>q.hasKey);if(own){own.hasKey=false;addItem("key");tips.push("hands over a rusty key");}
  else{const kh=G.mons.find(q=>q.hp>0&&q.hasKey&&!who.includes(q));if(kh)tips.push(`says the ${kh.name} to the ${dirTo(L,kh)} carries the key`);}
  const traps=G.traps.filter(t=>!t.found&&!t.done);if(traps.length){traps.forEach(t=>t.found=true);tips.push(`warns you about ${traps.length} hidden trap${traps.length>1?"s":""} (now marked)`);}
  const st=G.stairs;if(st&&!(G.explored[st.y]&&G.explored[st.y][st.x])){for(let y=st.y-1;y<=st.y+1;y++)for(let x=st.x-1;x<=st.x+1;x++)if(G.explored[y]&&x>=0&&x<G.W)G.explored[y][x]=true;tips.push(`points the way to the ladder down, to the ${dirTo(L,st)} (now on your map)`);}
  const name=who[0]?who[0].name:"creature";
  await say(tips.length?`The ${name} ${tips.slice(0,2).join(", and ")}.`:`The ${name} doesn't know anything useful.`,1500,true);}

// ---------- languages ----------
const MLANG={goblin:"Goblin",archer:"Goblin",shaman:"Goblin",goblinboss:"Goblin",kobold:"Draconic",orc:"Orc",ogre:"Giant",boss:"Giant"};
const RACE_LANG={dwarf:["Dwarvish","Goblin"],halforc:["Orc"],tiefling:["Infernal"],elf:["Elvish"],halfling:["Halfling"],human:["Orc"]};
const CLASS_LANG={wizard:["Draconic","Goblin"],druid:["Druidic"],rogue:["Thieves' Cant"],cleric:["Celestial"]};
function langsOf(h){return ["Common"].concat(RACE_LANG[h.race]||[],CLASS_LANG[h.id]||[]);}
function speakerFor(m){const l=MLANG[m.key];if(!l)return null;return heroesUp().find(h=>!h.wild&&h.id!=="beast"&&langsOf(h).includes(l))||null;}

// ---------- smarter monsters ----------
// clever monsters pile onto whoever is already badly hurt, and go after spellcasters holding a spell
{const base=threatScore;threatScore=(m,h,w)=>{const smart=m.tr&&m.tr.mind==="smart";return base(m,h,w)-(smart&&h.hp<=h.maxHp*.35?3:0)-(smart&&h.conc?1:0);};}
const isSmart=m=>m.side==="m"&&m.tr&&m.tr.mind==="smart"&&!m.boss;
// runs at the start of every monster's turn; returns true if the turn is used up
async function monsterPreTurn(m){if(!C||m.hp<=0)return false;
  // call for help: the first time a clever monster gets hurt or sees its friends fall, it may shout for the next group over
  if(isSmart(m)&&!m.called&&(m.hp<m.maxHp||C.units.some(u=>u.side==="m"&&u.gid===m.gid&&u.hp<=0))&&Math.random()<.4){m.called=true;
    const near=G.mons.filter(q=>q.hp>0&&!q.inCombat&&!q.peace&&q.gid!==m.gid&&cheb(q,m)<=14).sort((a,b)=>cheb(a,m)-cheb(b,m));
    if(near.length){const gid=near[0].gid;const come=near.filter(q=>q.gid===gid);float(m,"HELP!","#ffe060");await say(`The ${m.name} shouts for help! ${come.length>1?`${come.length} more creatures come`:"Something comes"} running from the ${dirTo(m,come[0])}.`,1100);
      for(const q of come){q.inCombat=true;q.state="combat";q.lurk=false;q.acted=false;q.bubble=now()+900;q.init=rnd(20)+abm(q,"dex");C.units.push(q);}renderStrip();}}
  // surrender: the last clever monster standing, badly hurt, may throw down its weapon
  if(isSmart(m)&&!m.yieldAsked&&m.hp<=m.maxHp*.35&&!C.units.some(u=>u.side==="m"&&u!==m&&u.hp>0&&u.inCombat)&&Math.random()<.6){m.yieldAsked=true;
    float(m,"MERCY!","#ffffff");const tongue=speakerFor(m);
    const c=await choose(`The ${m.name} throws down its weapon. "${tongue||!MLANG[m.key]?"Mercy! I yield! I'll tell you things!":"(It babbles in "+MLANG[m.key]+", hands raised.)"}"`,
      [{t:"SPARE & QUESTION",sub:"Full XP. It tells you what it knows, then runs"},{t:"FINISH IT",sub:"Full XP"},{t:"LET IT GO",sub:"Full XP, no questions"}]);
    if(c===1){approve("finish");await say(`No mercy.`,600);await dealDamage(m,m.hp+20,"piercing",{src:heroesUp()[0]});return true;}
    approve("spare");m.inCombat=false;m.peace=true;C.xp+=m.xp;const k=G.mons.indexOf(m);if(k>=0)G.mons.splice(k,1);
    if(c===0){if(!MLANG[m.key]||tongue)await shareSecret([m]);else await say(`Nobody in the party speaks ${MLANG[m.key]}, so its answers are just noise. It flees.`,1300);}
    else await say(`The ${m.name} scrambles away into the dark.`,900);
    renderStrip();return true;}
  return false;}

// ---------- haggling ----------
function shopPrice(id){const base=id==="arrows"?10:ITEMS[id].price;return Math.max(1,Math.round(base*((shopObj&&shopObj.mult)||1)));}
async function haggle(){if(!shopObj||shopObj.haggled)return;shopObj.haggled=true;const h=bestAt("persuasion");const r=await check(h,"persuasion",13,{quiet:true,adv:!!(shopObj.lang&&langsOf(h).includes(shopObj.lang))});approve("haggle");
  shopObj.mult=r.ok?0.8:1.1;shopObj.haggleMsg=r.ok?`The ${h.name} talks the merchant down: everything is 20% cheaper. (${r.txt})`:`The merchant takes offence and puts the prices up 10%. (${r.txt})`;renderShop();}

// ---------- revivify ----------
function revive(h,how){h.dead=false;h.down=false;h.stable=false;h.hp=1;h.ds={s:0,f:0};h.st={};approve("revive");float(h,"REVIVED","#fff0a0");fx.push({type:"heal",u:h,t:now()});log(`✦ ${esc(h.name)} is brought back by ${how}.`,"lv");hud();fov();if(C)renderStrip();}
async function offerRevivify(){if(!G)return;for(const h of G.party.filter(q=>q.dead&&q.id!=="beast"&&!q.revAsked)){
    const cl=G.party.find(c=>c.id==="cleric"&&!c.dead&&!c.down&&slotAvail(c,3));const sc=(G.bag.scroll_revivify||0)>0;if(!cl&&!sc)continue;h.revAsked=true;
    const c=await choose(`${h.name} died moments ago. Revivify can still bring them back, but only within the minute.`,[
      {t:"READ THE SCROLL",sub:sc?"Uses the Scroll of Revivify":"You don't have one",dis:!sc},
      {t:"CLERIC CASTS REVIVIFY",sub:cl?`Uses a level 3 spell slot and 100 gold of diamond dust`:"Needs a cleric with a level 3 slot",dis:!cl||G.gold<100},
      {t:"LET THEM REST"}]);
    if(c===0){takeItem("scroll_revivify");revive(h,"a Scroll of Revivify");await say(`The scroll crumbles to light. ${h.name} gasps back to life with 1 HP!`,1500,true);}
    else if(c===1){useSlot(cl,3);G.gold-=100;revive(h,"the cleric's Revivify");await say(`The ${cl.name} presses glittering diamond dust to the wound. ${h.name} gasps back to life with 1 HP!`,1500,true);}}}
{const base=heroDies;heroDies=async(h,massive)=>{await base(h,massive);if(!C&&mode==="explore")await offerRevivify();};}

// ---------- prepared spells (cleric, druid, wizard) ----------
const PREP_CLASSES=["cleric","druid","wizard"];
const alwaysReady=(h,s)=>((subOf(h)||{}).spells||[]).includes(s);
function prepPool(h){return spellsOf(h).filter(s=>SPELLS[s]&&SPELLS[s].lvl<=h.slots.length&&!alwaysReady(h,s));}
function prepCount(h){return Math.max(1,G.level+abm(h,h.info.castAbil||"wis"));}
function isPrepared(h,s){if(!h||h.side!=="h"||!PREP_CLASSES.includes(h.id)||!h.prepared||alwaysReady(h,s))return true;return h.prepared.includes(s);}
async function prepareSpells(h){const pool=prepPool(h),n=prepCount(h);if(pool.length<=n){h.prepared=pool.slice();return;}
  let sel=(h.prepared||pool).filter(s=>pool.includes(s)).slice(0,n);
  for(let i=0;i<24;i++){const opts=[{t:"DONE",sub:`${sel.length} of ${n} prepared`}].concat(pool.map(s=>({t:(sel.includes(s)?"✓ ":"")+SPELLS[s].name.toUpperCase(),sub:`Level ${SPELLS[s].lvl}${sel.includes(s)?" · prepared, tap to drop":""}`,dis:!sel.includes(s)&&sel.length>=n})));
    const c=await choose(`The ${h.name} prepares today's spells: ${n} from ${pool.length} (level + ${(h.info.castAbil||"wis").toUpperCase()} modifier). ${subOf(h)&&subOf(h).spells?"Subclass spells are always ready. ":""}Tap a spell to add or drop it.`,opts);
    if(c<=0)break;const s=pool[c-1];if(sel.includes(s))sel=sel.filter(x=>x!==s);else if(sel.length<n)sel.push(s);}
  h.prepared=sel;log(`${esc(h.name)} prepared: ${sel.map(s=>SPELLS[s].name).join(", ")}.`,"magic");}
{const base=applyLongRest;applyLongRest=async camp=>{const lines=await base(camp);for(const h of G.party)if(!h.dead&&PREP_CLASSES.includes(h.id))await prepareSpells(h);return lines;};}
