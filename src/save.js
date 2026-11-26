// ===== saving and resuming a run =====
// The whole run lives in G. To save it we turn it into plain text (JSON). A few things need special care:
// - heroes and monsters referred to from elsewhere (a goal's target, a web's caster) are saved as references, not copies
// - lists that are Sets/Maps are converted to arrays, typed arrays to plain arrays
// - things that point at shared game data (a hero's class info, a monster's traits, the floor palette) are saved by name and re-linked on load
// - pictures (the painted terrain) are not saved; they're simply redrawn on load
const RUN_KEY="lantern-crawl-run-v1",SAVE_VERSION=1;
const SKIP_KEYS={terr:1,lit:1,vis:1,pebble:1,owlPick:1,info:1,tr:1,pal:1};
function packRun(){const units=new Map();G.party.forEach((u,i)=>units.set(u,{h:i}));G.mons.forEach((u,i)=>units.set(u,{m:i}));
  const walk=(v,top)=>{if(v===null||typeof v!=="object")return typeof v==="function"?undefined:v;
    if(!top&&units.has(v))return {__unit:units.get(v)};
    if(v instanceof Set)return {__set:[...v].map(x=>walk(x))};if(v instanceof Map)return {__map:[...v].map(([k,x])=>[walk(k),walk(x)])};
    if(ArrayBuffer.isView(v))return {__arr:Array.from(v)};if(typeof HTMLCanvasElement!=="undefined"&&v instanceof HTMLCanvasElement)return undefined;
    if(Array.isArray(v))return v.map(x=>walk(x));
    const o={};for(const k in v){if(SKIP_KEYS[k])continue;const w=walk(v[k]);if(w!==undefined)o[k]=w;}return o;};
  const out={};for(const k in G){if(SKIP_KEYS[k])continue;
    if(k==="party"||k==="mons")out[k]=G[k].map(u=>walk(u,true));else{const w=walk(G[k]);if(w!==undefined)out[k]=w;}}
  out.palName=Object.keys(PALS).find(k=>PALS[k]===G.pal)||"earth";return {v:SAVE_VERSION,when:Date.now(),G:out};}
function unpackRun(data){const raw=data.G;const party=raw.party,mons=raw.mons;
  const fix=v=>{if(v===null||typeof v!=="object")return v;if(Array.isArray(v))return v.map(fix);
    if(v.__set)return new Set(v.__set.map(fix));if(v.__map)return new Map(v.__map.map(([k,x])=>[fix(k),fix(x)]));if(v.__arr)return Uint8Array.from(v.__arr);
    if(v.__unit)return v.__unit;// resolved below, once every hero and monster exists
    for(const k in v)v[k]=fix(v[k]);return v;};
  const g={};for(const k in raw)g[k]=fix(raw[k]);
  for(const h of g.party)h.info=CINFO[h.def.id]||CINFO[h.id];for(const m of g.mons)m.tr=MTRAITS[m.key]||MTRAITS.goblin;
  const res=r=>r&&typeof r==="object"&&(r.h!==undefined||r.m!==undefined)&&Object.keys(r).length===1?(r.h!==undefined?g.party[r.h]:g.mons[r.m]):undefined;
  const link=v=>{if(v===null||typeof v!=="object")return v;if(v instanceof Set||v instanceof Map||ArrayBuffer.isView(v))return v;
    if(Array.isArray(v)){for(let i=0;i<v.length;i++){const u=res(v[i]);if(u)v[i]=u;else link(v[i]);}return v;}
    for(const k in v){const u=res(v[k]);if(u)v[k]=u;else link(v[k]);}return v;};
  for(const k in g)if(k!=="party"&&k!=="mons")link(g[k]);for(const u of g.party.concat(g.mons))for(const k in u){if(k==="def")continue;const r=res(u[k]);if(r)u[k]=r;else link(u[k]);}
  g.pal=PALS[raw.palName]||PALS.earth;delete g.palName;return g;}
function saveRun(){if(!G||G.demo||G.over||mode!=="explore"||busy)return false;try{localStorage.setItem(RUN_KEY,JSON.stringify(packRun()));return true;}catch(e){return false;}}
function clearRun(){try{localStorage.removeItem(RUN_KEY);}catch(e){}}
function peekRun(){try{const s=localStorage.getItem(RUN_KEY);if(!s)return null;const d=JSON.parse(s);if(d.v!==SAVE_VERSION)return null;return d;}catch(e){return null;}}
function resumeRun(){const d=peekRun();if(!d)return false;let g;try{g=unpackRun(d);}catch(e){console.error(e);clearRun();return false;}
  G=g;C=null;mode="explore";busy=false;camFocus=null;G.vis=new Set();G.lit=new Uint8Array(G.W*G.H);
  for(const u of G.party.concat(G.mons)){u.dx=u.x*TS;u.dy=u.y*TS;}
  show(null);showCombatUI(false);clearLog();buildTerrain();computeLight();fov();hud();
  log(`Welcome back. ${esc(heroLabel(G.party[0]))} picks up where they left off, floor ${G.floor}.`,"lv");toast(`Run resumed: floor ${G.floor}${G.goal?" · Goal: "+G.goal.desc:""}.`);return true;}
function runSummary(d){const g=d.G;const p=(g.party||[]).filter(h=>!h.dead).map(h=>h.nick||h.name).join(", ");return `Floor ${g.floor} · level ${g.level} · ${p}`;}
// save automatically: every few steps, on every new floor, after rests, and whenever the page is hidden or closed
let lastSaveStep=-1;
function autoSave(force){if(!G||G.demo||G.over)return;if(!force&&G.steps-lastSaveStep<8)return;if(saveRun())lastSaveStep=G.steps;}
document.addEventListener("visibilitychange",()=>{if(document.hidden)autoSave(true);});
window.addEventListener("pagehide",()=>autoSave(true));
