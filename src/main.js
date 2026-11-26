// ================= settings storage, controls, start-up =================
const KEY="lantern-crawl-settings-v4";
function loadSettings(){try{const raw=localStorage.getItem(KEY);if(raw){const s=JSON.parse(raw);
    if(s&&s.dungeon&&s.rules&&Array.isArray(s.classes)&&s.classes.length===DEFAULTS.classes.length&&Array.isArray(s.monsters)&&s.monsters.length===DEFAULTS.monsters.length&&s.boss){
      s.dungeon=Object.assign({},DEFAULTS.dungeon,s.dungeon);s.rules=Object.assign({},DEFAULTS.rules,s.rules);return s;}}}catch(e){}
  return clone(DEFAULTS);}
function saveSettings(){try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}}
let S=loadSettings();

let held=null;
function hold(el,fn){const stop=()=>{if(held===fn)held=null;el.classList.remove("on");};
  el.addEventListener("pointerdown",e=>{e.preventDefault();el.classList.add("on");if(G)G.walkTo=null;held=fn;fn();});
  ["pointerup","pointercancel","pointerleave"].forEach(ev=>el.addEventListener(ev,stop));el.addEventListener("contextmenu",e=>e.preventDefault());
  el.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();fn();}});}
// keep walking while a direction is held: take the next step just before the current one finishes, so there is no pause
(function heldLoop(){requestAnimationFrame(heldLoop);if(!held)return;if(sayState||choosing||!G||G.over||G.demo||mode!=="explore"){if(mode!=="explore"||sayState||choosing)held=null;return;}
  if(busy)return;const L=G.party[0];if(L.dx===undefined||Math.abs(L.dx-L.x*TS)+Math.abs(L.dy-L.y*TS)<=5)held();})();
window.addEventListener("blur",()=>{held=null;});
const tap=(el,fn)=>{el.addEventListener("click",fn);el.addEventListener("contextmenu",e=>e.preventDefault());};
async function waitStep(){if(mode!=="explore"||busy||!G||G.over)return;busy=true;G.steps++;await huntStep();if(G.fire.size)tickFire();fov();busy=false;await checkAwareness();}
hold($("kU"),()=>tryMove(0,-1));hold($("kD"),()=>tryMove(0,1));hold($("kL"),()=>tryMove(-1,0));hold($("kR"),()=>tryMove(1,0));
tap($("kW"),waitStep);tap($("tgSneak"),()=>toggleSneak());tap($("tgLight"),toggleLight);tap($("kA"),search);tap($("kB"),()=>openMenu());
function tileFromEvent(e){const r=cv.getBoundingClientRect();const sx=(e.clientX-r.left)/r.width*SW,sy=(e.clientY-r.top)/r.height*SH;const wx=sx+cam.x,wy=sy+cam.y;
  for(const u of G.party.concat(G.mons)){if(u.dead)continue;const e2=elevAt(u.x,u.y)*3;if(wx>=u.x*TS&&wx<u.x*TS+TS&&wy>=u.y*TS-(u.side==="h"||HUMAN[u.sprite]?12:0)-e2&&wy<u.y*TS+TS-e2)return {x:u.x,y:u.y};}
  return {x:Math.floor(wx/TS),y:Math.floor(wy/TS)};}
cv.addEventListener("pointerdown",e=>{if(!G||G.demo)return;if(sayState){sayState.skip();return;}if(choosing)return;const {x,y}=tileFromEvent(e);
  if(mode==="combat"){if(busy||!C||!C.cur||C.cur.side!=="h")return;onTile(x,y);}else if(mode==="explore")exploreTap(x,y);});
$("screenWrap").addEventListener("pointerdown",e=>{if(e.target!==cv&&sayState)sayState.skip();});
document.addEventListener("keydown",e=>{if(e.target.tagName==="INPUT")return;const k=e.key.toLowerCase();
  if(sayState&&(k===" "||k==="enter")){e.preventDefault();sayState.skip();return;}
  if(choosing){const n=parseInt(k,10);if(n>=1&&n<=6){const b=$("ch-"+(n-1));if(b&&!b.disabled)b.click();}if(k==="escape")choosing.cancel();return;}
  if(mode==="combat"){if(k==="e")endHeroTurn();if(k==="escape")cancelTarget();return;}
  const map={arrowup:[0,-1],w:[0,-1],arrowdown:[0,1],s:[0,1],arrowleft:[-1,0],a:[-1,0],arrowright:[1,0],d:[1,0]};
  if(map[k]){e.preventDefault();if(!e.repeat){const f=()=>tryMove(...map[k]);f._k=k;held=f;f();}}else if(k==="f")search();else if(k==="q")toggleSneak();else if(k==="l")toggleLight();else if(k==="m")openMenu();else if(k===".")waitStep();});
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
["party","bag","rest"].forEach(t=>$("tab-"+t).addEventListener("click",()=>{menuTab=t;renderMenu();}));
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
(function(){const LOG_MIN=44;let queued=false;
  function fitScreen(){queued=false;const app=$("app"),bz=document.querySelector(".bezel");if(!app||!bz)return;
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
