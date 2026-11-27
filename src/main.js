// ================= settings storage, controls, start-up =================
const KEY="lantern-crawl-settings-v4";
function loadSettings(){try{const raw=localStorage.getItem(KEY);if(raw){const s=JSON.parse(raw);
    if(s&&s.dungeon&&s.rules&&Array.isArray(s.classes)&&s.classes.length===DEFAULTS.classes.length&&Array.isArray(s.monsters)&&s.monsters.length===DEFAULTS.monsters.length&&s.boss){
      s.dungeon=Object.assign({},DEFAULTS.dungeon,s.dungeon);s.rules=Object.assign({},DEFAULTS.rules,s.rules);return s;}}}catch(e){}
  return clone(DEFAULTS);}
function saveSettings(){try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}}
let S=loadSettings();

let held=null;
function facingDir(L,dx,dy){if(dx)return L.face==="s"&&!!L.flip===(dx<0);return dy<0?L.face==="b":L.face==="f";}
// returns true if this press should only turn the leader (they weren't facing that way yet)
function turnFirst(dx,dy,fn){const L=G&&!G.demo&&G.party&&G.party[0];fn.wait=0;if(G&&G.scout)return false;if(L&&G.look&&mode==="explore"){faceToward(L,dx,dy);fn.wait=1e15;return true;}if(!L||mode!=="explore"||busy||choosing||sayState||facingDir(L,dx,dy))return false;
  faceToward(L,dx,dy);fn.wait=performance.now()+160;return true;}
function hold(el,fn,dir){const stop=()=>{if(held===fn)held=null;el.classList.remove("on");};
  el.addEventListener("pointerdown",e=>{e.preventDefault();el.classList.add("on");if(G)G.walkTo=null;const cleared=clearInterruptions();held=fn;if(cleared){fn.wait=0;return;}if(dir&&turnFirst(dir[0],dir[1],fn))return;fn();});
  ["pointerup","pointercancel","pointerleave"].forEach(ev=>el.addEventListener(ev,stop));el.addEventListener("contextmenu",e=>e.preventDefault());
  el.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();fn();}});}
// keep walking while a direction is held: take the next step just before the current one finishes, so there is no pause
(function heldLoop(){requestAnimationFrame(heldLoop);if(!held)return;if(!G||G.over||G.demo)return;if(sayState&&mode==="explore"){sayState.force();return;}if(choosing||mode!=="explore"){held=null;return;}
  if(busy||(held.wait&&performance.now()<held.wait))return;const L=G.party[0];if(L.dx===undefined||Math.abs(L.dx-L.x*TS)+Math.abs(L.dy-L.y*TS)<=5)held();})();
window.addEventListener("blur",()=>{held=null;});
const tap=(el,fn)=>{el.addEventListener("click",e=>{if(fn!==pressA&&(sayState||(choosing&&mode==="explore"))){if(clearInterruptions()){whenFree(()=>fn(e));return;}}fn(e);});el.addEventListener("contextmenu",e=>e.preventDefault());};
async function waitStep(){if(mode!=="explore"||busy||!G||G.over)return;busy=true;G.steps++;await huntStep();if(G.fire.size)tickFire();fov();busy=false;await checkAwareness();}
// the D-pad: press a direction, or slide your thumb across it to change direction without lifting
(function(){const pad=document.querySelector(".dpad");if(!pad)return;const KEYS={kU:[0,-1],kD:[0,1],kL:[-1,0],kR:[1,0]};let pid=null,cur=null;
  const dirAt=(x,y)=>{const r=pad.getBoundingClientRect();const cx=r.left+r.width/2,cy=r.top+r.height/2,dx=x-cx,dy=y-cy;if(Math.hypot(dx,dy)<r.width*.14)return null;return Math.abs(dx)>Math.abs(dy)?(dx<0?"kL":"kR"):(dy<0?"kU":"kD");};
  const light=id=>{for(const k in KEYS)$(k).classList.toggle("on",k===id);};
  function go(id,first){cur=id;light(id);const [dx,dy]=KEYS[id];const fn=()=>tryMove(dx,dy);fn.wait=0;if(G)G.walkTo=null;
    if(first){const cleared=clearInterruptions();held=fn;if(cleared)return;if(turnFirst(dx,dy,fn))return;fn();}else{held=fn;if(G&&G.party&&!G.scout&&!G.look&&!facingDir(G.party[0],dx,dy))faceToward(G.party[0],dx,dy);}}
  function stop(){pid=null;cur=null;light(null);held=null;}
  pad.addEventListener("pointerdown",e=>{const id=KEYS[e.target.id]?e.target.id:dirAt(e.clientX,e.clientY);if(!id)return;e.preventDefault();pid=e.pointerId;try{pad.setPointerCapture(pid);}catch(_){}go(id,true);});
  pad.addEventListener("pointermove",e=>{if(e.pointerId!==pid)return;const id=dirAt(e.clientX,e.clientY);if(id&&id!==cur)go(id,false);});
  for(const ev of ["pointerup","pointercancel","lostpointercapture"])pad.addEventListener(ev,e=>{if(e.pointerId===pid)stop();});
  for(const k in KEYS)$(k).addEventListener("contextmenu",e=>e.preventDefault());})();
tap($("kW"),waitStep);tap($("tgSneak"),()=>toggleSneak());tap($("tgLight"),toggleLight);tap($("kA"),pressA);tap($("tgSearch"),search);tap($("tgSkills"),quickAbilities);tap($("lookBtn"),()=>toggleLook());tap($("btnMap"),openMap);tap($("mapClose"),()=>show(null));tap($("mapCv"),()=>show(null));tap($("kB"),()=>openMenu());
function tileFromEvent(e){const r=cv.getBoundingClientRect();const sx=(e.clientX-r.left)/r.width*SW,sy=(e.clientY-r.top)/r.height*SH;const wx=sx+cam.x,wy=sy+cam.y;
  for(const u of G.party.concat(G.mons)){if(u.dead)continue;const e2=elevAt(u.x,u.y)*3;if(wx>=u.x*TS&&wx<u.x*TS+TS&&wy>=u.y*TS-(u.side==="h"||HUMAN[u.sprite]?12:0)-e2&&wy<u.y*TS+TS-e2)return {x:u.x,y:u.y};}
  return {x:Math.floor(wx/TS),y:Math.floor(wy/TS)};}
cv.addEventListener("pointerdown",e=>{if(!G||G.demo)return;if(sayState&&mode!=="explore"){sayState.skip();return;}if(sayState||(choosing&&mode==="explore")){const {x,y}=tileFromEvent(e);if(clearInterruptions())whenFree(()=>exploreTap(x,y));return;}if(choosing)return;const {x,y}=tileFromEvent(e);
  if(mode==="combat"){if(busy||!C||!C.cur||C.cur.side!=="h")return;onTile(x,y);}else if(mode==="explore")exploreTap(x,y);});
$("screenWrap").addEventListener("pointerdown",e=>{if(e.target!==cv&&sayState)sayState.skip();});
document.addEventListener("keydown",e=>{if(e.target.tagName==="INPUT")return;const k=e.key.toLowerCase();
  if(sayState&&(k===" "||k==="enter")){e.preventDefault();sayState.skip();return;}
  {const mp={arrowup:1,w:1,arrowdown:1,s:1,arrowleft:1,a:1,arrowright:1,d:1};if(mp[k]&&choosing&&mode==="explore"&&choosing.opts&&choosing.opts.some(o=>WALK_AWAY.test(o.t))){const dir={arrowup:[0,-1],w:[0,-1],arrowdown:[0,1],s:[0,1],arrowleft:[-1,0],a:[-1,0],arrowright:[1,0],d:[1,0]}[k];if(clearInterruptions()){e.preventDefault();const f=()=>tryMove(...dir);f._k=k;f.wait=0;held=f;}return;}}
  if(choosing){const n=parseInt(k,10);if(n>=1&&n<=6){const b=$("ch-"+(n-1));if(b&&!b.disabled)b.click();}if(k==="escape")choosing.cancel();return;}
  if(mode==="combat"){if(k==="e")endHeroTurn();if(k==="escape")cancelTarget();const n=k==="0"?10:parseInt(k,10);if(n>=1&&n<=10){const tiles=[...document.querySelectorAll("#cBtns .hot")];const t=tiles[n-1];if(t)t.click();}return;}
  const map={arrowup:[0,-1],w:[0,-1],arrowdown:[0,1],s:[0,1],arrowleft:[-1,0],a:[-1,0],arrowright:[1,0],d:[1,0]};
  if(map[k]&&(sayState||(choosing&&mode==="explore"))){if(clearInterruptions()){e.preventDefault();const f=()=>tryMove(...map[k]);f._k=k;f.wait=0;held=f;}return;}
  if(map[k]){e.preventDefault();if(e.shiftKey){if(G&&!G.demo&&mode==="explore")faceToward(G.party[0],...map[k]);return;}if(!e.repeat){const f=()=>tryMove(...map[k]);f._k=k;held=f;if(!turnFirst(...map[k],f))f();}}else if(k==="e"||k==="enter"||k===" "){e.preventDefault();pressA();}else if(k==="v")toggleLook();else if(k==="f")search();else if(k==="m")openMap();else if(k==="q")toggleSneak();else if(k==="l")toggleLight();else if(k==="b"||k==="i"||k==="tab"){e.preventDefault();openMenu("party");}else if(k===".")waitStep();});
$("btnNew").addEventListener("click",()=>{if(G&&!G.over&&!G.demo)autoSave(true);showTown(G&&!G.over&&!G.demo&&peekRun()?"Your run is saved. Continue it any time.":"");});
$("btnContinue").addEventListener("click",()=>{if(!resumeRun())showTown("That saved run couldn't be loaded, sorry.");});
$("btnSetOut").addEventListener("click",()=>{buildClassCards();show("ovClass");});$("btnTownSettings").addEventListener("click",()=>{buildSettings();show("ovSettings");});
$("btnSettings").addEventListener("click",()=>{buildSettings();show("ovSettings");});
$("btnEndSettings").addEventListener("click",()=>{buildSettings();show("ovSettings");});
$("btnAgain").addEventListener("click",()=>showTown());
$("btnCancel").addEventListener("click",()=>{if(G&&!G.over&&!G.demo)show(null);else showTown();});
$("btnReset").addEventListener("click",()=>{S=clone(DEFAULTS);buildSettings();$("setMsg").textContent="Defaults loaded. Press Save to use them.";});
$("btnSave").addEventListener("click",()=>{const ns=readSettings();if(!ns){$("setMsg").textContent="Some boxes need fixing (shown in red). Damage must look like 1d8+3 or 2d6.";return;}
  S=ns;saveSettings();buildClassCards();showTown("Settings saved.");});
["party","bag","notes","rest"].forEach(t=>$("tab-"+t).addEventListener("click",()=>{menuTab=t;menuHero=null;renderMenu();}));
$("menuClose").addEventListener("click",closeMenu);$("shopClose").addEventListener("click",()=>{show(null);hud();});

buildClassCards();renderTown();
(function demo(){const D=S.dungeon;let m=null;while(!m)m=genMap(D.width,D.height,D.rooms);
  G={demo:true,over:true,party:[],floor:1,level:1,fatigue:0,W:D.width,H:D.height,t:m.t,rooms:m.rooms,objs:[],traps:[],torches:[],dropLights:[],fire:new Map(),items:[],mons:[],npc:null,stairs:null,entangle:new Set(),
    elev:Array.from({length:D.height},()=>Array(D.width).fill(0)),ground:Array.from({length:D.height},()=>Array(D.width).fill(0)),ramp:new Set(),explored:m.t.map(r=>r.map(()=>true)),vis:new Set(),bag:{}};
  for(let y=0;y<G.H;y++)for(let x=0;x<G.W;x++)G.vis.add(y*G.W+x);const r=m.rooms[0];cam.x=Math.max(0,r.cx*TS-SW/2);cam.y=Math.max(0,r.cy*TS-SH/2);
  G.mons.push(mkMon(DEFAULTS.monsters[2],r.x,r.y,false));G.items.push({x:r.x+r.w-1,y:r.y,item:"potion"});G.pal=PALS.earth;G.lit=new Uint8Array(G.W*G.H).fill(1);buildTerrain();})();
document.addEventListener("keyup",e=>{if(held&&held._k===e.key.toLowerCase())held=null;});
requestAnimationFrame(loop);

// ---------- safety net: never stay stuck ----------
// "busy" means "something is happening, ignore taps". If it's ever left switched on by mistake
// (nothing on screen, no message, no choice waiting) the game would freeze. This watchdog notices and frees it.
let busySince=0;
setInterval(()=>{if(!busy||!G||G.demo){busySince=0;return;}if(!busySince){busySince=Date.now();return;}
  const idle=!sayState&&!choosing&&$("chPanel").hidden&&!document.querySelector(".ov:not([hidden])");
  if(idle&&mode==="explore"&&Date.now()-busySince>8000){busy=false;busySince=0;console.warn("Watchdog: cleared a stuck 'busy' state");hud();}},1000);
// ---------- fit everything on one phone screen ----------
// The game screen shrinks or grows so the buttons, menus and choices underneath always fit without scrolling.
const WIDE_TOP=46,WIDE_BOTTOM=232,PORT_ROW=40,PORT_BOTTOM=176;// PC layout: space kept above the screen (turn order) and below it (choices, action bar)
(function(){const LOG_MIN=44;let queued=false;
  function fitScreen(){queued=false;const app=$("app"),bz=document.querySelector(".bezel");if(!app||!bz)return;
    if(app.classList.contains("port")){// tall phone: the screen fills the width and grows taller to use the free space (it shows more of the dungeon)
      const bs=getComputedStyle(bz);const padX=parseFloat(bs.paddingLeft)+parseFloat(bs.paddingRight),padY=parseFloat(bs.paddingTop)+parseFloat(bs.paddingBottom);
      const cs=getComputedStyle(app);const gap=parseFloat(cs.rowGap)||0;let used=parseFloat(cs.paddingTop)+parseFloat(cs.paddingBottom);
      for(const id of ["party","fxRow","rail"]){const e=$(id);if(e&&!e.hidden)used+=e.offsetHeight+gap;}
      used+=document.querySelector(".top").offsetHeight+gap+document.querySelector(".hud").offsetHeight+gap+PORT_ROW+gap+PORT_BOTTOM+gap;
      const full=app.clientWidth-parseFloat(cs.paddingLeft)-parseFloat(cs.paddingRight);const sc=(full-padX)/240;const avail=app.clientHeight-used-padY;
      if(avail>=160*sc){setScreenRows(avail/sc);bz.style.minWidth="0";bz.style.width=full+"px";return;}
      setScreenRows(160);bz.style.minWidth="0";bz.style.width=Math.max(150,Math.min(full,Math.floor(avail*1.5+padX)))+"px";return;}
    setScreenRows(160);
    if(app.classList.contains("land")){const col=$("colC");const bs=getComputedStyle(bz);const padX=parseFloat(bs.paddingLeft)+parseFloat(bs.paddingRight),padY=parseFloat(bs.paddingTop)+parseFloat(bs.paddingBottom);
      const sc=Math.min((col.clientWidth-padX)/240,(col.clientHeight-padY)/160);bz.style.minWidth="0";bz.style.width=Math.max(120,Math.floor(240*sc+padX))+"px";return;}
    if(app.classList.contains("wide")){const col=$("colL");const bs=getComputedStyle(bz);const padX=parseFloat(bs.paddingLeft)+parseFloat(bs.paddingRight),padY=parseFloat(bs.paddingTop)+parseFloat(bs.paddingBottom);
      const sh=WIDE_TOP+WIDE_BOTTOM;const w=col.clientWidth-padX,h=col.clientHeight-sh-padY;let sc=Math.min(w/240,h/160);if(sc>=3)sc=Math.floor(sc);
      bz.style.minWidth="0";bz.style.width=Math.max(150,Math.floor(240*sc+padX))+"px";return;}
    const cs=getComputedStyle(app);const gap=parseFloat(cs.rowGap)||0;let used=parseFloat(cs.paddingTop)+parseFloat(cs.paddingBottom),n=0;
    for(const el of app.children){if(el===bz||el.hidden)continue;const st=getComputedStyle(el);if(st.display==="none"||st.position==="absolute"||st.position==="fixed")continue;
      n++;used+=(el.classList.contains("log")?LOG_MIN:el.offsetHeight)+parseFloat(st.marginTop)+parseFloat(st.marginBottom);}
    const bs=getComputedStyle(bz);const pad=parseFloat(bs.paddingTop)+parseFloat(bs.paddingBottom),padX=parseFloat(bs.paddingLeft)+parseFloat(bs.paddingRight);
    const screenH=app.clientHeight-used-gap*n-pad;const full=app.clientWidth-parseFloat(cs.paddingLeft)-parseFloat(cs.paddingRight);
    const w=Math.max(150,Math.min(full,Math.floor(screenH*1.5+padX)));bz.style.minWidth="0";bz.style.width=w+"px";}
  const queue=()=>{if(!queued){queued=true;requestAnimationFrame(fitScreen);}};
  window.addEventListener("resize",queue);if(window.visualViewport)visualViewport.addEventListener("resize",queue);
  if(document.fonts&&document.fonts.ready)document.fonts.ready.then(queue);
  if(window.ResizeObserver){const ro=new ResizeObserver(queue);const app=$("app");if(app){ro.observe(app);for(const el of app.children)if(!el.classList.contains("bezel")&&!el.classList.contains("log"))ro.observe(el);}}
  queue();})();

// ---------- PC layout: the game screen in the middle (Solasta-style), menu icons down the left, party and log on the right ----------
Object.assign(GLYPHS,{
  bag:["....nnnn....","...n....n...","..nnnnnnnn..",".nNnnnnnnNn.",".nnnngGnnnn.",".nnnnGGnnnn.",".nnnnnnnnnn.",".nnnnnnnnnn.",".nNnnnnnnNn.","..nnnnnnnn..","............","............"],
  map:["............",".mmm.mmm.mm.",".mmm.mmm.mm.",".mrmm.mmmmm.",".mmmmmr.mm.",".mm.mmmmrmm.",".mmmm.mmmmm.",".mmmmmmm.mm.",".mm.mmmmmmm.","............","............","............"],
  book:["............",".nnnnnnnnn..",".nmmmmmmmn..",".nmkkkkkmn..",".nmmmmmmmn..",".nmkkkkmmn..",".nmmmmmmmn..",".nmkkkkkmn..",".nnnnnnnnn..","............","............","............"],
  people:["............","...ss..ss...","..ssss.ss...","...ss..ss...",".bbbbbbbbb..",".bbbbbbbbb..",".bbbbbbbbb..",".bb.bb.bb...","............","............","............","............"],
  camp:[".....r......","....ror.....","....ror.....","...roor.....","...ryyr.....","..nnnnnnn...",".n.n.n.n.n..","............","............","............","............","............"]});
(function(){const app=$("app");if(!app)return;
  const el={top:document.querySelector(".top"),bezel:document.querySelector(".bezel"),strip:$("strip"),party:$("party"),hud:document.querySelector(".hud"),fxRow:$("fxRow"),tglRow:$("tglRow"),log:$("log"),controls:$("controls"),cPanel:$("cPanel"),chPanel:$("chPanel")};
  const mk=(id,tag)=>{const d=document.createElement(tag||"div");d.id=id;return d;};
  const rail=mk("rail","nav"),colL=mk("colL"),colR=mk("colR"),colA=mk("colA"),colB=mk("colB"),colC=mk("colC");
  const toggleLog=()=>{app.classList.toggle("showlog");const b=$("railLog");if(b)b.classList.toggle("on",app.classList.contains("showlog"));const lg=$("log");if(lg)lg.scrollTop=lg.scrollHeight;};
  const RAIL=[["people","PARTY",()=>openMenu("party")],["bag","BAG",()=>openMenu("bag")],["map","MAP",()=>openMap()],["scroll","LOG",toggleLog,"railLog"],["book","NOTES",()=>openMenu("notes")],["camp","REST",()=>openMenu("rest")]];
  for(const [g,label,f,id] of RAIL){const b=document.createElement("button");b.type="button";b.className="railbtn";if(id)b.id=id;b.title=label;const c=document.createElement("canvas");c.width=c.height=12;c.getContext("2d").drawImage(glyphCanvas(g),0,0);b.appendChild(c);b.insertAdjacentHTML("beforeend",`<span>${label}</span>`);
    b.addEventListener("click",()=>{if(f===toggleLog){f();return;}if(mode!=="explore")return;if(sayState||choosing){clearInterruptions();whenFree(f);return;}if(!busy)f();});rail.appendChild(b);}
  // tapping the log (when it's floating over the game) closes it
  el.log.addEventListener("click",()=>{if(app.classList.contains("showlog"))toggleLog();});
  const keys=document.createElement("p");keys.className="keyhelp";keys.innerHTML="<b>Keys:</b> arrows/WASD move · E/Space use · B menu · F search · Q sneak · L light · M map · V look · <b>in fights</b> 1–9 actions, E end turn, Esc cancel";
  const LAYOUTS={// which element goes where, in order
    pc:[[rail,[]],[colL,["strip","bezel","fxRow","tglRow","cPanel","chPanel"]],[colR,["party","hud","log","controls"]]],
    land:[[colA,["party","hud","fxRow"]],[colC,["strip","bezel"]],[colB,[]],[null,["tglRow","controls","cPanel","chPanel","log"]]],
    port:[[null,["bezel","strip","party","hud","fxRow","tglRow"]],[null,[]],[null,["log","controls","cPanel","chPanel"]]]};
  function pickLayout(){const w=innerWidth,h=innerHeight;const touch=matchMedia("(pointer:coarse)").matches;
    if(w>h*1.15&&h<620)return "land";if(w>=900&&w/h>=1.15&&!(touch&&h<620))return "pc";return "port";}
  let cur=null;
  function setLayout(){const L=pickLayout();if(L===cur)return;cur=L;const firstOv=app.querySelector(".ov");
    for(const c of [rail,colL,colR,colA,colB,colC,keys])c.remove();for(const k in el)if(k!=="top")el[k].remove();
    app.classList.remove("wide","land","port");app.classList.add(L==="pc"?"wide":L);
    const put=(parent,names)=>{for(const n of names){if(parent)parent.appendChild(el[n]);else app.insertBefore(el[n],firstOv);}};
    if(L==="pc"){app.insertBefore(rail,firstOv);app.insertBefore(colL,firstOv);app.insertBefore(colR,firstOv);put(colL,LAYOUTS.pc[1][1]);put(colR,LAYOUTS.pc[2][1]);colR.appendChild(keys);}
    else if(L==="land"){for(const c of [colA,colC,colB])app.insertBefore(c,firstOv);put(colA,LAYOUTS.land[0][1]);put(colC,LAYOUTS.land[1][1]);colB.appendChild(rail);put(null,LAYOUTS.land[3][1]);}
    else{put(null,["bezel","strip","party","hud","fxRow","tglRow"]);app.insertBefore(rail,firstOv);put(null,["log","controls","cPanel","chPanel"]);}
    el.bezel.style.width="";$("btnFull").hidden=L!=="pc"||!document.documentElement.requestFullscreen;window.dispatchEvent(new Event("resize"));}
  addEventListener("resize",setLayout);addEventListener("orientationchange",()=>setTimeout(setLayout,200));setLayout();
  $("btnFull").addEventListener("click",()=>{try{if(document.fullscreenElement)document.exitFullscreen();else document.documentElement.requestFullscreen().catch(()=>toast("Full screen isn't allowed here: try F11."));}catch(e){toast("Full screen isn't allowed here: try F11.");}});
  document.addEventListener("fullscreenchange",()=>{$("btnFull").textContent=document.fullscreenElement?"EXIT FULL":"FULL SCREEN";});
  if(window.ResizeObserver){const ro=new ResizeObserver(()=>window.dispatchEvent(new Event("resize")));for(const c of [colL,colC])ro.observe(c);for(const id of ["strip","fxRow","tglRow","cPanel","chPanel"])ro.observe($(id));}})();
// Phones throw away big off-screen pictures (like the pre-drawn map) while the tab is in the background,
// which left the screen black on return. Redraw them whenever the game comes back into view.
function redrawCaches(){try{for(const k in sprCache)delete sprCache[k];for(const k in glyphCache)delete glyphCache[k];
  if(G&&G.t&&G.pal){buildTerrain();computeLight();fov();}hud();}catch(e){console.warn(e);}}
document.addEventListener("visibilitychange",()=>{if(!document.hidden)redrawCaches();});
window.addEventListener("pageshow",e=>{if(e.persisted)redrawCaches();});
window.addEventListener("focus",()=>redrawCaches());
cv.addEventListener("contextrestored",()=>{ctx.imageSmoothingEnabled=false;redrawCaches();});
