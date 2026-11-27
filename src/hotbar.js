// ================= the hotbar: Baldur's Gate / Solasta-style combat buttons, and tappable status icons =================
// Every combat option is a square icon you can tap straight away (no sub-menus). A coloured corner shows what it costs:
// green circle = action, orange triangle = bonus action, purple diamond = reaction, grey = free, blue = movement.
// Hold a button to read what it does. Ongoing effects (Wild Shape, Rage, Concentration, conditions) show as small icons:
// tap them to end them or read about them.

// ---------- little pixel icons (12×12) ----------
const GLYPH_PAL={k:"#1b1420",w:"#ffffff",s:"#c8d0dc",S:"#8a94a4",g:"#f0c040",G:"#b08020",r:"#e04838",R:"#902828",o:"#f08a30",y:"#ffe070",b:"#58a8f0",B:"#2a5aa0",p:"#b070e0",P:"#6a3a98",e:"#58c858",E:"#2a7a3a",n:"#9a6a3a",N:"#5a3a20",c:"#a0f0ff",m:"#e0e0e0"};
const GLYPHS={
  sword:["..........ss","........ssws",".......swss.","......swss..",".....swss...","....swss....","..n.wss.....","...nss......","..GgN.......",".Gg..N......","Gg..........","g..........."],
  bow:["....nnN.....","...n..sN....","..n...s.N...","..n...s..N..",".n....s..N..",".n..kkskkkw>",".n....s..N..","..n...s..N..","..n...s.N...","...n..sN....","....nnN.....","............"],
  staff:["...cbbc.....","..cbwwbc....","..bwccwb....","..cbwwbc....","...cnnc.....","....nN......","....nN......","....nN......","....nN......","....nN......","....nN......","....NN......"],
  fire:[".....r......","....rr......","....ror.....","...roor..r..","..rooyor.r..","..royyoorr..",".roywyyor...",".royywyyor..",".royyyyyor..","..royyyor...","...rrrrr....","............"],
  heal:["............","..rr...rr...",".rwrr.rrrr..",".rwrrrrrrrr.",".rrrrrrrrrr.",".rrrrwwrrrr.","..rrrwwrrr..","...rwwwwr...","....rwwr....",".....rr.....","............","............"],
  shield:["............","..ssssssss..",".sbbbbbbbbs.",".sbbbgbbbbs.",".sbbggg bbs.",".sbbbgbbbbs.",".sbbbgbbbbs.","..sbbbbbbs..","..sbbbbbbs..","...sbbbbs...","....ssss....","............"],
  run:["......kk....","......kk....","....kkk.....","...k.kkk....","..k..kk.k...","....kk......","...k..k.....","..k....k....",".k......k...","............",".nnN..nnN...","............"],
  hand:["............","...n.n.n....","...n.n.n.n..","...n.n.n.n..","...nnnnnnn..",".n.nnnnnnn..","..nnnnnnnn..","..nnnnnnnn..","...nnnnnn...","....nnnn....","....nnnn....","............"],
  eye:["............","............","...kkkkkk...","..k..ww..k..",".k..wbbw..k.","k...wbkbw..k",".k..wbbw..k.","..k..ww..k..","...kkkkkk...","............","............","............"],
  push:["............","......k.....","......kk....","kkkkkkkkk...","kkkkkkkkkk..","kkkkkkkkk...","......kk....","......k.....","............","............","............","............"],
  paw:["............","..e.e.e.....",".eEeEeEe....","..e.e.e.....","............","..eeeee.....",".eEEEEEe....",".eEEEEEe....","..eeeee.....","............","............","............"],
  rage:["..r.r.r.r...",".rRrRrRrRr..","..rrrrrrr...","..rwkrwkr...","..rrrrrrr...","..rkkkkkr...","..rkwwwkr...","...rrrrr....","............","............","............","............"],
  star:[".....g......",".....g......","....gyg.....","gggggyggggg.",".ggyyyyygg..","..gyyyyyg...","..gyy.yyg...",".gyg...gyg..",".gg.....gg..","............","............","............"],
  bolt:["......yy....",".....yy.....","....yy......","...yy.......","..yyyyyy....","......yy....",".....yy.....","....yy......","...yy.......","..y.........","............","............"],
  skull:["............","...mmmmm....","..mmmmmmm...",".mmkkmkkmm..",".mmkkmkkmm..",".mmmmkmmmm..","..mmmmmmm...","...mkmkm....","...mmmmm....","............","............","............"],
  moon:["....bbb.....","...bwbb.....","..bwb.......","..bwb.......",".bwb........",".bwb........",".bwb........","..bwb.......","..bwbb..b...","...bwbbbb...","....bbbb....","............"],
  sun:[".....y......","..y..y..y...","...yyyyy....","..yygggyy...","yyyggwggyyy.","..yygggyy...","...yyyyy....","..y..y..y...",".....y......","............","............","............"],
  drop:[".....e......","....eEe.....","....eEe.....","...eEEEe....","...eEwEe....","..eEwEEEe...","..eEEEEEe...","..eEEEEEe...","...eEEEe....","....eee.....","............","............"],
  scroll:["............",".nnnnnnnnn..","n.mmmmmmm.n.",".nmkkkkkmn..","..mmmmmmm...","..mkkkkkm...","..mmmmmmm...","..mkkkkm....",".nmmmmmmmn..","n.nnnnnnn.n.","............","............"],
  potion:["....nn......","....ss......","....ss......","...s..s.....","..srrrrs....",".srrwrrrs...",".srrrrrrs...",".srrrrrrs...","..srrrrs....","...ssss.....","............","............"],
  bomb:[".......g....","......g.y...",".....n......","....kkk.....","...kkkkk....","..kkwkkkk...","..kkkkkkk...","..kkkkkkk...","...kkkkk....","....kkk.....","............","............"],
  hourglass:["..nnnnnnn...","...g...g....","...gyyyg....","....gyg.....",".....g......","....g.g.....","...g.y.g....","...gyyyg....","..nnnnnnn...","............","............","............"],
  jump:["......k.....",".....kkk....","....k.k.k...","......k.....","......k.....","...k..k.....","..k.k.......",".k...k......","k.....k.....","............","nnN...nnN...","............"],
  fist:["............","...nnnnn....","..nNnNnNn...","..nnnnnnnn..","..nnnnnnnn..","..nnnnnnn...","...nnnnn....","...nnnnn....","...NNNNN....","............","............","............"],
  web:["k....k....k.",".k...k...k..","..kkkkkkk...","..k..k..k...","kkk.kkk.kkk.","..k..k..k...","..kkkkkkk...",".k...k...k..","k....k....k.","............","............","............"],
  plus:["............",".....ee.....",".....ee.....",".....ee.....",".eeeeeeeeee.",".eeeeeeeeee.",".....ee.....",".....ee.....",".....ee.....","............","............","............"],
  lock:["....sss.....","...s...s....","...s...s....","..ggggggg...","..gGGGGGg...","..gGGkGGg...","..gGGkGGg...","..gGGGGGg...","..ggggggg...","............","............","............"],
  music:["......kkkk..","......k..k..","......k..k..","......k..k..","......k..k..","...kkkk.kk..","..kkkkkkkk..","..kkkk.kk...","............","............","............","............"],
  owl:["............","..n.....n...","..nnnnnnn...",".nwwnnnwwn..",".nwknnnwkn..",".nnnngnnnn..","..nnnnnnn...","..nmnmnmn...","...nnnnn....","....g.g.....","............","............"],
  end:["............","..kkkkkkk...","..k.....k...","..k.kkk.k...","..k.k.k.k...","..k.kkk.k...","..k.....k...","..kkkkkkk...","............","............","............","............"]};
const ICON_RULES=[[/FLURRY|MARTIAL/,"fist"],[/PATIENT/,"shield"],[/STEP OF THE WIND/,"run"],[/SHADOW STEP/,"eye"],[/ARMOUR/,"shield"],[/REVERT/,"paw"],[/WILD SHAPE/,"paw"],[/MOON/,"moon"],[/RAGE|FRENZY|RECKLESS/,"rage"],[/HEAL|CURE|SECOND WIND|PRESERVE|SPARE|MEDIC|POTION/,"heal"],[/SHIELD|PROTECT|DODGE|WARD/,"shield"],
  [/DASH/,"run"],[/DISENGAGE|ESCAPE/,"run"],[/HELP|OWL/,"owl"],[/SHOVE|PUSH|THUNDER/,"push"],[/HIDE|SIZE UP|INVISIB|FAERIE/,"eye"],[/FIRE|FLAM|BURN|HELLISH|DAWN/,"fire"],[/BOLT|MISSILE|LIGHTNING|ELDRITCH|RAY/,"bolt"],
  [/TURN UNDEAD|SICKNESS|SKULL/,"skull"],[/BLESS|GUID|SACRED|RADIANCE|LIGHT|SUN/,"sun"],[/POISON|ACID|ANTITOX/,"drop"],[/SCROLL|WAND/,"scroll"],[/FLASH|BOMB/,"bomb"],[/READY/,"hourglass"],[/JUMP|MISTY/,"jump"],
  [/GRAPPLE|GIANT|THROW/,"fist"],[/WEB|ENTANGLE|SPIKE|HOLD|SLEEP/,"web"],[/LOCK|DISARM|TRAP/,"lock"],[/VOLLEY|ARROW|PINNING|BOW|OFF-HAND/,"bow"],[/TRIP|MENAC|PRECIS|ATTACK|STRIKE|MARK/,"sword"],[/OIL|TORCH|SHAPE WATER|DOUSE/,"drop"],[/SURGE|SYMBIOTIC|INSPIR/,"star"]];
const glyphCache={};
function glyphCanvas(name){if(glyphCache[name])return glyphCache[name];const g=GLYPHS[name]||GLYPHS.star;const c=document.createElement("canvas");c.width=c.height=12;const x=c.getContext("2d");
  g.forEach((row,y)=>{for(let i=0;i<12;i++){const col=GLYPH_PAL[row[i]];if(col){x.fillStyle=col;x.fillRect(i,y,1,1);}}});glyphCache[name]=c;return c;}
function iconFor(o,u){if(o.icon)return o.icon;const t=(o.t||"").toUpperCase();if(o.weapon){const w=o.weapon;return w.spell?(/FLAME|FIRE/.test(t)?"fire":"bolt"):w.melee?"sword":"bow";}
  for(const [re,n] of ICON_RULES)if(re.test(t))return n;return "star";}
function costOf(o){if(o.cost)return o.cost;const s=(o.sub||"").toLowerCase();const first=s.split("·")[0];
  if(/bonus/.test(first))return "bonus";if(/reaction/.test(first))return "reaction";if(/^\s*free/.test(first))return "free";if(/movement|move/.test(first))return "move";if(/bonus action/.test(s))return "bonus";return "action";}
function shortLabel(t){return t.replace(/^✓ /,"").replace(/^SCROLL: /,"").replace(/^CUNNING: /,"").replace(/^WAND: /,"").replace(/ \(.*\)$/,"").replace("QUARTERSTAFF","STAFF").replace("THUNDERWAVE","THUNDER WAVE").replace("LIGHT CROSSBOW","CROSSBOW").replace("HEAVY CROSSBOW","CROSSBOW");}

// ---------- ongoing effects ----------
const COND_INFO={poisoned:["drop","Poisoned","Disadvantage on attacks and checks."],prone:["push","Prone","Melee attacks against you have advantage. Standing up costs half your movement."],frightened:["skull","Frightened","Disadvantage while the source of fear is in sight."],
  restrained:["web","Restrained","Can't move. Attacks against you have advantage."],blessed:["sun","Blessed","+1d4 to attacks and saving throws."],hidden:["eye","Hidden","Unseen: your next attack has advantage."],dodge:["shield","Dodging","Attacks against you have disadvantage until your next turn."],
  blinded:["eye","Blinded","You can't see: your attacks have disadvantage, attacks on you have advantage."],invisible:["eye","Invisible","Attacks on you have disadvantage; yours have advantage. Attacking ends it."],paralysed:["web","Paralysed","Can't move or act. Hits from next to you are critical."],
  grappled:["fist","Grappled","Your speed is 0 until you break free."],giant:["fist","Giant's Might","You're huge: extra damage and advantage on Strength."],shieldOfFaith:["shield","Shield of Faith","+2 AC."],sof:["shield","Shield of Faith","+2 AC."]};
function effectsOf(h){const E=[];const myTurn=C&&C.cur===h&&mode==="combat"&&!busy;
  if(h.wild){const form=h.wild.form.toUpperCase();E.push({icon:"paw",label:C?form:form+" ↩",desc:`Wild Shape: ${h.name} is a ${h.wild.form} (${h.wild.hp}/${h.wild.max} HP).`,
    act:C?(myTurn?"Revert (bonus action)":null):"Tap to return to normal form",dis:C&&(!myTurn||!C.bonus),f:async()=>{if(C){if(!myTurn||!C.bonus){prompt("Reverting in a fight takes a bonus action on the druid's turn.");return;}busy=true;C.bonus=false;h.wild=null;computeLight();fov();hud();await say(`${h.name} returns to normal form.`,700);afterAction();}else{h.wild=null;computeLight();fov();hud();toast(`${h.name} returns to normal form.`);}}});}
  if(h.st.raging)E.push({icon:"rage",label:"RAGE",desc:"Raging: extra melee damage, resistance to weapon damage, advantage on Strength. Ends if you don't attack or get hit for a round."});
  if(h.conc){const nm=h.conc.name||(SPELLS[h.conc.type]&&SPELLS[h.conc.type].name)||({mark:"Hunter's Mark",bless:"Bless",entangle:"Entangle",web:"Web"}[h.conc.type])||"a spell";
    E.push({icon:"star",label:"CONC",desc:`Concentrating on ${nm}. Taking damage means a CON save to keep it.`,act:"Tap to drop it",f:async()=>{const c=await choose(`Stop concentrating on ${nm}?`,[{t:"DROP IT"},{t:"KEEP IT"}]);if(c===0){endConc(h);hud();if(C)buildPanel();}$("tBox").hidden=!C;}});}
  for(const k in COND_INFO)if(h.st[k]){const [ic,l,d]=COND_INFO[k];E.push({icon:ic,label:l.toUpperCase(),desc:`${l}: ${d}`});}
  if(h.coat)E.push({icon:"drop",label:h.coat.name.toUpperCase(),desc:`Your weapon is coated in ${h.coat.name}: extra damage on the next hit.`});
  if(h.task&&Object.values(TASKS).find(T=>T.id===h.task)){const T=Object.values(TASKS).find(T=>T.id===h.task);if(T.id!=="fletch"&&T.id!=="picks")E.push({icon:"star",label:T.fx.toUpperCase(),desc:`${T.name}: ${T.fx} until the next rest.`});}
  if(h.insp)E.push({icon:"star",label:"INSPIRED",desc:"Inspired: you'll reroll your next failed d20."});
  if(h.thp)E.push({icon:"shield",label:"TEMP "+h.thp,desc:`${h.thp} temporary hit points soak damage first.`});
  if(h.ward)E.push({icon:"shield",label:"WARD "+h.ward,desc:`Arcane Ward: soaks the next ${h.ward} damage.`});
  return E;}
function effectChip(h,e,withName){const b=document.createElement("button");b.type="button";b.className="fxchip"+(e.f?" act":"")+(e.dis?" dim":"");b.appendChild(glyphCanvas(e.icon).cloneNode());
  b.firstChild.getContext("2d").drawImage(glyphCanvas(e.icon),0,0);b.insertAdjacentHTML("beforeend",`<span>${withName?esc((h.nick||h.name).split(" ")[0])+": ":""}${esc(e.label)}</span>`);
  b.addEventListener("click",ev=>{ev.stopPropagation();if(e.f&&!e.dis&&!busy){e.f();return;}prompt(e.desc+(e.act?` (${e.act}.)`:""));});return b;}
// outside combat: a row of everything that's going on, for the whole party
function renderFxRow(){const row=$("fxRow");if(!row)return;row.innerHTML="";if(!G||G.demo||C){row.hidden=true;return;}
  for(const h of G.party){if(h.dead)continue;for(const e of effectsOf(h))row.appendChild(effectChip(h,e,G.party.length>1));}row.hidden=!row.children.length;}
{const base=hud;hud=function(){base();renderFxRow();};}

// ---------- the combat hotbar ----------
let holdT=0,held2=false;
function hotTile(o,u,enabled){const b=document.createElement("button");b.type="button";const cost=costOf(o);b.className="hot c-"+cost+(o.sel?" sel":"");b.disabled=false;if(!enabled||o.dis)b.classList.add("off");
  const ic=document.createElement("canvas");ic.width=ic.height=12;
  if(o.item){ic.width=ic.height=16;drawIconTo(ic,o.item);}else ic.getContext("2d").drawImage(glyphCanvas(iconFor(o,u)),0,0);b.appendChild(ic);
  b.insertAdjacentHTML("beforeend",`<i></i><span>${esc(shortLabel(o.t))}</span>${o.badge?`<em>${esc(o.badge)}</em>`:""}`);
  const info=()=>prompt(`${shortLabel(o.t)}: ${o.sub||""}${o.dis?" (Not available right now.)":""}`);
  b.addEventListener("pointerdown",()=>{held2=false;clearTimeout(holdT);holdT=setTimeout(()=>{held2=true;info();},450);});
  ["pointerup","pointerleave","pointercancel"].forEach(ev=>b.addEventListener(ev,()=>clearTimeout(holdT)));
  b.addEventListener("contextmenu",e=>e.preventDefault());
  b.addEventListener("click",()=>{if(held2){held2=false;return;}if(busy||!enabled)return;if(o.dis){info();return;}o.f&&o.f();});return b;}
function buildPanel(){if(!C)return;const u=C.cur;const my=!!(u&&u.side==="h"&&!busy&&mode==="combat");const st=$("cStat");
  // what's left this turn
  if(u&&u.side==="h"&&!u.down){const acts=C.attacksLeft?C.attacksLeft:C.actions;
    const slots=u.slots.length?u.slots.map((v,i)=>`<b class="slot" title="Level ${i+1} slots">${i+1}:${"◆".repeat(v)||"–"}</b>`).join(""):"";
    st.innerHTML=`<span class="pip a ${C.actions>0||C.attacksLeft>0?"":"spent"}" title="Action">${C.attacksLeft?C.attacksLeft+"×":acts>1?acts+"×":""}</span><span class="pip bn ${C.bonus?"":"spent"}" title="Bonus action"></span><span class="pip re ${u.reaction?"":"spent"}" title="Reaction"></span><span class="mv">MOVE ${C.moveLeft}</span>${slots}`;
    const fx=effectsOf(u);if(fx.length){const w=document.createElement("span");w.className="fxin";fx.forEach(e=>w.appendChild(effectChip(u,e,false)));st.appendChild(w);}}
  else st.innerHTML=`<span class="who">${u?esc(u.name)+"'s turn…":"Rolling initiative…"}</span>`;
  const box=$("cBtns");box.innerHTML="";box.className="hotbar";
  const tabs=document.createElement("div");tabs.className="hottabs";box.appendChild(tabs);
  const grid=document.createElement("div");grid.className="hotgrid";box.appendChild(grid);
  const endB=document.createElement("button");endB.type="button";endB.className="hotend";endB.textContent="END TURN";endB.disabled=!my;tabs.appendChild(endB);
  if(!u||u.side!=="h"||u.down){for(const t of ["ALL","CLASS","ACTIONS","ITEMS"]){const tb=document.createElement("button");tb.type="button";tb.className="htab";tb.textContent=t;tb.disabled=true;tabs.insertBefore(tb,endB);}return;}
  if(C.panel==="target"){tabs.innerHTML="";const cb=document.createElement("button");cb.type="button";cb.className="hotend cancel";cb.textContent="✕ CANCEL";cb.addEventListener("click",cancelTarget);tabs.appendChild(cb);grid.remove();return;}
  if(!["main","skills","actions","items"].includes(C.panel))C.panel="main";
  const TABS=[["main","ALL"],["skills","CLASS"],["actions","ACTIONS"],["items","ITEMS"]];
  for(const [k,l] of TABS){const tb=document.createElement("button");tb.type="button";tb.className="htab"+(C.panel===k?" on":"");tb.textContent=l;tb.addEventListener("click",()=>{C.panel=k;buildPanel();});tabs.insertBefore(tb,endB);}
  const nothing=C.moveLeft===0&&!canAttack()&&!C.bonus;if(nothing)endB.classList.add("pulse");endB.addEventListener("click",()=>{if(!busy)endHeroTurn();});
  const fb=featButtons(u),ab=actionButtons(u),ib=itemButtons(u);const info=u.info;const weapons=[];
  for(const k of (u.wild?["main"]:["main","alt"])){const w=weaponOf(u,k);
    if(k==="alt"&&info.alt.save){continue;}
    weapons.push({t:w.name.toUpperCase(),weapon:w,cost:"action",sub:`Attack · ${w.dice}${dmgBonus(u,w)?sgn(dmgBonus(u,w)):""} ${w.type} · ${w.melee?"melee":"range "+w.range}${attacksPer(u)>1&&!w.spell?" · 2 attacks":""}${u.coat?" · "+u.coat.name:""}`,dis:!canAttack(),sel:C.weapon===k&&C.mode==="move"&&canAttack(),f:()=>{C.weapon=k;tapAtk();}});}
  const itemTiles=ib.map(o=>Object.assign({item:itemIdFor(o.t)},o));
  const list=C.panel==="main"?weapons.concat(fb,ab):C.panel==="skills"?fb:C.panel==="actions"?weapons.concat(ab):itemTiles;
  for(const o of list)grid.appendChild(hotTile(o,u,my));
  if(!list.length)grid.insertAdjacentHTML("beforeend",`<p class="hotnone">${C.panel==="items"?"Nothing usable in the bag.":"Nothing here."}</p>`);}
function itemIdFor(t){t=t.toUpperCase();if(/GREATER/.test(t))return "gpotion";if(/POTION|DRINK/.test(t))return "potion";if(/ANTITOX/.test(t))return "antitoxin";if(/OIL/.test(t))return "oil";if(/FLASH/.test(t))return "flashpowder";if(/TORCH/.test(t))return "torch";
  if(/MISSILE/.test(t))return "scroll_mm";if(/FIREBALL/.test(t))return "scroll_fb";if(/CURE|SCROLL/.test(t))return "scroll_cure";if(/POISON/.test(t))return "poisonvial";return null;}
function tapAtk(){if(busy||!C||!C.cur||C.cur.side!=="h")return;C.mode="move";C.tgt=null;C.sel=null;C.panel=C.panel==="target"?"main":C.panel;buildPanel();const u=C.cur;const w=weaponOf(u,C.weapon);
  const t=foesOf(u).filter(f=>inReachW(u,f,w));prompt(t.length?"Tap a marked enemy to see your chance to hit, then tap it again to attack.":`No enemy in reach of your ${w.name}. Move closer first.`);}

// ---------- quick abilities outside combat (no need to open the party menu) ----------
async function quickAbilities(){if(mode!=="explore"||busy||!G||G.over)return;const all=[];
  for(const h of G.party)for(const a of classActions(h))all.push(Object.assign({},a,{t:`${h.name.toUpperCase()}: ${a.t}`}));
  if(!all.length){toast("Nobody has an ability to use right now.");return;}
  busy=true;let c;try{c=await choose("Use an ability:",all.concat([{t:"NEVER MIND"}]));}finally{busy=false;}
  $("tBox").hidden=true;if(c>=0&&c<all.length&&!all[c].dis)await all[c].f();hud();}

// ---------- character card: tap a portrait ----------
function portraitTap(i){const h=G&&G.party[i];if(!h||G.demo)return;
  if(mode==="explore"){if(busy)return;openMenu("party",0,i);return;}
  if(mode==="combat"){const fx=effectsOf(h).map(e=>e.label.toLowerCase()).join(", ");const hp=h.wild?`${h.wild.hp}/${h.wild.max} HP (${h.wild.form})`:h.dead?"dead":h.down?"down":`${h.hp}/${h.maxHp} HP`;
    prompt(`${h.nick||h.name} the ${h.name}: ${hp}, AC ${acOf(h)}${fx?" · "+fx:""}.`);}}
function cardBtn(el,o){const b=document.createElement("button");b.type="button";b.className="big alt";b.innerHTML=`${esc(o.t)}${o.sub?`<br><small>${esc(o.sub)}</small>`:""}`;b.disabled=!!o.dis;
  b.addEventListener("click",async()=>{await o.f();if(!$("ovMenu").hidden)renderMenu();hud();});el.appendChild(b);}
function heroUses(h){const U=[];const n=id=>(G.bag[id]||0)>0;const hurt=h.hp<h.maxHp||h.down;
  if(h.dead){if(n("scroll_revivify"))U.push({t:"READ SCROLL OF REVIVIFY",sub:"Back with 1 HP",f:()=>{takeItem("scroll_revivify");revive(h,"a Scroll of Revivify");}});return U;}
  if(n("potion"))U.push({t:`HEALING POTION (${G.bag.potion})`,sub:hurt?"Heals the full 10 (no rush out of combat)":"Already at full health",dis:!hurt,f:()=>{takeItem("potion");heal(h,potionMax("2d4+2"));}});
  if(n("gpotion")&&isKnown("gpotion"))U.push({t:`GREATER HEALING (${G.bag.gpotion})`,sub:hurt?"Heals the full 20":"Already at full health",dis:!hurt,f:()=>{takeItem("gpotion");heal(h,potionMax("4d4+4"));}});
  if(n("scroll_cure")&&isKnown("scroll_cure"))U.push({t:"READ CURE WOUNDS SCROLL",sub:hurt?"Heals 2d8+3":"Already at full health",dis:!hurt,f:()=>{takeItem("scroll_cure");heal(h,roll("2d8+3").total);}});
  if(n("antitoxin")&&h.st.poisoned)U.push({t:"ANTITOXIN",sub:"Cures the poison",f:()=>{takeItem("antitoxin");delete h.st.poisoned;}});
  if(n("shield")&&h.shieldBroken)U.push({t:"STRAP ON THE SPARE SHIELD",sub:"Back to full AC",f:()=>strapShield(h)});
  if(n("poisonvial")&&h.id!=="beast")U.push({t:"COAT WEAPON IN POISON",sub:h.coat?`Already coated (${h.coat.name})`:"Extra poison damage on the next hit",dis:!!h.coat,f:()=>{takeItem("poisonvial");h.coat={name:"poison",type:"poison",dice:"2d4"};}});
  return U;}
function heroWild(h){const W=[];if(h.id!=="druid"||h.dead||h.down||mode!=="explore")return W;const n=h.res.wildshape||0;
  if(h.wild){W.push({t:"REVERT TO NORMAL FORM",sub:`Currently a ${h.wild.form}`,f:()=>{h.wild=null;computeLight();fov();}});return W;}
  W.push({t:"WILD SHAPE: WOLF",sub:`${n} left · fast, keen nose, pack tactics`,dis:n<=0,f:()=>{h.res.wildshape--;if(h.conc)endConc(h);startWild(h,"wolf");}});
  if(h.sub==="moon")W.push({t:"WILD SHAPE: BROWN BEAR",sub:`${n} left · tough, two claw attacks`,dis:n<=0,f:()=>{h.res.wildshape--;if(h.conc)endConc(h);startWild(h,"bear");}});
  return W;}
function heroCardTop(el,i){const h=G.party[i];const N=G.party.length;
  const nav=document.createElement("div");nav.className="cardnav";
  const mk=(t,f,dis)=>{const b=document.createElement("button");b.type="button";b.className="chip";b.textContent=t;b.disabled=!!dis;b.addEventListener("click",f);return b;};
  nav.appendChild(mk("◀",()=>{menuHero=(i-1+N)%N;renderMenu();},N<2));
  const mid=document.createElement("div");mid.className="cardwho";const c=document.createElement("canvas");c.width=16;c.height=CH_H;const cx=c.getContext("2d");if(h.wild)cx.drawImage(wildSpr(h),0,10);else cx.drawImage(heroSpr(h.look||h.id,"f",0,h.race),0,0);mid.appendChild(c);
  const hp=h.wild?`${h.wild.hp}/${h.wild.max} HP as a ${h.wild.form}`:h.dead?"Dead":h.down?"Down":`${h.hp}/${h.maxHp} HP`;
  mid.insertAdjacentHTML("beforeend",`<div><b>${esc(h.nick||h.name)}</b><br><span class="sm">${esc(RACES[h.race||"human"].name)} ${esc(h.name)}${subOf(h)?" · "+esc(subOf(h).name):""} · ${hp} · AC ${acOf(h)}${i===0?" · LEADER":""}${h.perk&&PERKS[h.perk]?`<br>Trait: ${esc(PERKS[h.perk].name)} (${esc(PERKS[h.perk].desc)})`:""}${h.bg&&typeof BACKGROUNDS!=="undefined"&&BACKGROUNDS[h.bg]?`<br>Background: ${esc(BACKGROUNDS[h.bg].name)} (${esc(bgBonusText(h.bg))})`:""}</span></div>`);nav.appendChild(mid);
  nav.appendChild(mk("▶",()=>{menuHero=(i+1)%N;renderMenu();},N<2));el.appendChild(nav);
  const fx=effectsOf(h);if(fx.length){const row=document.createElement("div");row.className="fxrow cardfx";fx.forEach(e=>row.appendChild(effectChip(h,e,false)));el.appendChild(row);}
  const abil=heroWild(h).concat(classActions(h));
  if(abil.length){el.insertAdjacentHTML("beforeend","<h3>ABILITIES</h3>");for(const a of abil)cardBtn(el,a);}
  const uses=heroUses(h);if(uses.length){el.insertAdjacentHTML("beforeend",`<h3>USE AN ITEM ON ${esc((h.nick||h.name).toUpperCase())}</h3>`);for(const u of uses)cardBtn(el,u);}
  if(!abil.length&&!uses.length)el.insertAdjacentHTML("beforeend",`<p class="help">Nothing to use right now.</p>`);
  if(h.id!=="beast")renderGear(el,h,true);}
function heroCardBottom(el,i){const N=G.party.length;if(N<2)return;const row=document.createElement("div");row.className="march";
  row.insertAdjacentHTML("beforeend",`<span>Marching order: #${i+1} of ${N}</span>`);
  const sw=(a,b)=>{const A=G.party[a],B=G.party[b];[A.x,B.x]=[B.x,A.x];[A.y,B.y]=[B.y,A.y];G.party[a]=B;G.party[b]=A;};
  const mk=(t,f,dis)=>{const b=document.createElement("button");b.type="button";b.className="chip";b.textContent=t;b.disabled=!!dis;b.addEventListener("click",()=>{f();fov();hud();renderMenu();});row.appendChild(b);};
  mk("MAKE LEADER",()=>{for(let k=i;k>0;k--)sw(k,k-1);menuHero=0;},i===0);mk("▲",()=>{sw(i,i-1);menuHero=i-1;},i===0);mk("▼",()=>{sw(i,i+1);menuHero=i+1;},i===N-1);el.appendChild(row);}
