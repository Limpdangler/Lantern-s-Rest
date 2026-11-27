// ================= sprites =================
const sprCache={};
function paint(rows,pal,w,h){const c=document.createElement("canvas");c.width=w;c.height=h;const x=c.getContext("2d");
  const rgb=k=>{const v=pal[k];return v?[parseInt(v.slice(1,3),16),parseInt(v.slice(3,5),16),parseInt(v.slice(5,7),16)]:null;};
  for(let y=0;y<h;y++)for(let i=0;i<w;i++){const ch=rows[y][i];if(ch==="."||!pal[ch])continue;let col=pal[ch];
    if(ch==="k"){let r=0,g=0,b=0,n=0;for(const [a,bb] of [[1,0],[-1,0],[0,1],[0,-1]]){const yy=y+bb,xx=i+a;if(yy<0||yy>=h||xx<0||xx>=w)continue;const c2=rows[yy][xx];if(c2==="."||c2==="k"||c2==="e")continue;const v=rgb(c2);if(v){r+=v[0];g+=v[1];b+=v[2];n++;}}
      if(n){const f=.42;col=`rgb(${Math.round(r/n*f+14)},${Math.round(g/n*f+12)},${Math.round(b/n*f+20)})`;}else col="#3c3446";}
    x.fillStyle=col;x.fillRect(i,y,1,1);}return c;}
function heroSpr(cls,dir,frame,race){frame=frame||0;race=race&&RACES[race]&&!RACES[race].hidden?race:"";const k="h"+cls+dir+frame+race;
  if(cls==="beast"){if(!sprCache[k]){const c=document.createElement("canvas");c.width=16;c.height=CH_H;c.getContext("2d").drawImage(monSpr("wolf"),0,12-(frame===1?1:0));sprCache[k]=c;}return sprCache[k];}
  return sprCache[k]||(sprCache[k]=drawChar2(cls,dir,frame,race));}
const HUMAN={orc:1,skeleton:1,bonearcher:1,goblin:1,archer:1,shaman:1,goblinboss:1,kobold:1};
const walkFrame=u=>(u.dx!==u.x*TS||u.dy!==u.y*TS)?1+(Math.floor((u.dx+u.dy)/7)&1):0;
function monSpr(key,palOver){const k="m"+key+(palOver?JSON.stringify(palOver):"");if(MON2[key])return sprCache[k]||(sprCache[k]=MON2[key](palOver));return sprCache[k]||(sprCache[k]=paint(MON[MON_BASE[key]||key],Object.assign({k:BASE_PAL.k},MON_PAL[key]||{},palOver||{}),16,16));}
function boulderSpr(){const p=G.pal;return monSpr("boulder",{w:p.peb,L:p.pebLt,D:p.pebDk});}

// ================= text box, toasts, choices =================
let sayState=null,toastT=0;
function say(text,auto=1000,noLog){if(!noLog)log(esc(text),"say");note(text);const hold=mode!=="combat"&&!window.__fast;$("tBox").hidden=false;clearTimeout(toastT);
  return new Promise(res=>{const el=$("tText"),more=$("tMore");more.hidden=true;el.textContent="";let i=0;const st={typing:true,done:false,timer:0};sayState=st;
    const iv=setInterval(()=>{i+=2;el.textContent=text.slice(0,i);if(i>=text.length)finish();},Math.max(1,16*SPEED()));
    function finish(){clearInterval(iv);st.typing=false;st.at=performance.now();el.textContent=text;more.hidden=false;if(!hold)st.timer=setTimeout(adv,auto*SPEED());}
    function adv(){if(st.done)return;st.done=true;clearTimeout(st.timer);more.hidden=true;if(sayState===st)sayState=null;res();}
    st.skip=()=>{if(st.typing)finish();else if(!hold||performance.now()-st.at>350)adv();};});}
function prompt(text){sayState=null;$("tBox").hidden=false;$("tText").textContent=text;$("tMore").hidden=true;}
function toast(text){if(mode==="combat")return;if(!text){$("tBox").hidden=true;return;}prompt(text);clearTimeout(toastT);toastT=setTimeout(()=>{if(mode!=="combat"&&!sayState&&!choosing)$("tBox").hidden=true;},Math.max(3000,text.length*70));if(!/Press A|Nothing to use/.test(text))note(text);}
let choosing=null;
function choose(q,opts){return new Promise(res=>{const panel=$("chPanel");if(!$("ovMenu").hidden)show(null);
    prompt(q);clearTimeout(toastT);$("cPanel").hidden=true;$("controls").hidden=true;panel.hidden=false;const box=$("chBtns");box.innerHTML="";
    choosing={res};const shownAt=performance.now();
    opts.forEach((o,i)=>{const b=document.createElement("button");b.type="button";b.className="cb";b.id="ch-"+i;b.disabled=!!o.dis;b.innerHTML=`<b>${esc(o.t)}</b>${o.sub?`<small>${esc(o.sub)}</small>`:""}`;
      b.addEventListener("pointerdown",()=>{b._armed=true;});b.addEventListener("click",()=>{if(!b._armed&&performance.now()-shownAt<450)return;done(i);});// ignore the "ghost" tap from the finger that was already on the screen when the choices appeared
      box.appendChild(b);});
    function done(i){panel.hidden=true;const fight=mode==="combat"&&!!C;$("cPanel").hidden=!fight;$("controls").hidden=fight;$("tglRow").hidden=fight;choosing=null;res(i);}
    choosing.cancel=()=>done(-1);});}

// ================= HUD & log =================
function hud(){if(!G||G.demo)return;if(mode==="explore"&&!C&&!choosing){$("controls").hidden=false;$("tglRow").hidden=false;$("cPanel").hidden=true;$("chPanel").hidden=true;}const box=$("party");box.innerHTML="";
  for(let i=0;i<Math.max(S.dungeon.party,G.party.length);i++){const h=G.party[i];const d=document.createElement("div");
    if(!h){d.className="pc empty";d.textContent="empty";box.appendChild(d);continue;}
    d.className="pc"+(C&&C.cur===h?" cur":"")+(h.down?" down":"");
    const c=document.createElement("canvas");c.width=16;c.height=CH_H;const cx=c.getContext("2d");if(h.wild)cx.drawImage(wildSpr(h),0,10);else cx.drawImage(heroSpr(h.id,"f",0,h.race),0,0);d.appendChild(c);
    const hp=h.wild?h.wild.hp:h.hp,mx=h.wild?h.wild.max:h.maxHp;const p=Math.max(0,hp/mx);
    const tag=h.dead?"DEAD":h.down?(h.stable?"STABLE":S.rules.deathSaves?`DOWN ${h.ds.s}✓${h.ds.f}✗`:"DOWN"):`${hp}/${mx}${h.wild?" 🐺":""}`;
    const cond=[h.insp?"INSPIRED":"",h.luck?"LUCK "+h.luck:"",h.coat?h.coat.name.toUpperCase()+" BLADE":"",h.ward?"WARD "+h.ward:"",h.thp?"TEMP "+h.thp:"",h.st.giant?"GIANT":"",h.st.raging?"RAGE":"",h.st.poisoned?"PSN":"",h.st.restrained?"STUCK":"",h.st.prone?"PRONE":"",h.st.blessed?"BLESS":"",h.st.frightened?"FEAR":"",h.st.hidden?"HID":"",h.conc?"CONC":""].filter(Boolean).join(" ");
    d.addEventListener("click",()=>portraitTap(i));
    const ex=h.exh?` · EXH ${h.exh}`:"";
    d.insertAdjacentHTML("beforeend",`<div class="nm"${i===0&&mode==="explore"?' style="color:var(--gold)"':""}>${esc(h.name)}</div><div class="hb"><i style="width:${p*100}%;background:${p>.5?"var(--good)":p>.25?"var(--warn)":"var(--bad)"}"></i></div><div class="hp">${tag}${ex}${cond?" · "+cond:""}</div>`);
    box.appendChild(d);}
  const fat=!S.rules.fatigue?"":G.fatigue>=6?"Weary!":G.fatigue>=3?"Tired":"Fresh";
  $("glT").textContent=G.goal?(G.goal.done?"✓ ":G.goal.failed?"✗ ":"")+G.goal.desc:"–";$("fdT").textContent=G.bag.ration||0;$("wdT").textContent=G.bag.firewood||0;
  $("liT").textContent=G.light&&G.fuel>0?Math.ceil(G.fuel/FUEL_MAX*100)+"%":"OFF";
  $("tgSneak").classList.toggle("on",!!G.sneak);$("tgSneak").textContent=G.sneak?"SNEAKING":"SNEAK";
  $("tgLight").classList.toggle("on",!(G.light&&G.fuel>0));$("tgLight").textContent=G.light&&G.fuel>0?"LIGHT ON":"LIGHT OFF";
  $("flT").textContent=`${G.floor}/${S.dungeon.floors}`;$("lvT").textContent=`${G.level} (${G.xp}/${xpNeed()} XP)`;$("goT").textContent=G.gold;$("faT").textContent=fat;$("faW").hidden=!S.rules.fatigue;}
const logEl=$("log");
function log(html,cls){const p=document.createElement("p");p.innerHTML=html;if(cls)p.className=cls;logEl.appendChild(p);while(logEl.children.length>150)logEl.removeChild(logEl.firstChild);logEl.scrollTop=logEl.scrollHeight;}
function clearLog(){logEl.innerHTML="";}

// ================= battle panel =================
// buildPanel and tapAtk (the combat buttons) live in hotbar.js

// ================= drawing =================
let lastT=0;
function loop(t){requestAnimationFrame(loop);const dt=Math.min(50,t-(lastT||t));lastT=t;if(G&&G.terr)try{draw(t,dt);}catch(e){console.error(e);}}
function approach(a,b,sp){return Math.abs(b-a)<=sp?b:a+Math.sign(b-a)*sp;}
function drawImg(img,x,y,flip,w,h){w=w||img.width;h=h||img.height;x=Math.round(x);y=Math.round(y);
  if(flip){ctx.save();ctx.translate(x+w,y);ctx.scale(-1,1);ctx.drawImage(img,0,0,w,h);ctx.restore();}else ctx.drawImage(img,x,y,w,h);}
function shadow(x,y,w){w=w||10;x=Math.round(x)+8-w/2;y=Math.round(y);ctx.fillStyle="rgba(10,6,4,.35)";ctx.fillRect(x,y+13,w,2);ctx.fillRect(x-1,y+14,w+2,1);}
const flashing=(u,t)=>fx.some(f=>f.type==="flash"&&f.u===u&&t-f.t<420&&Math.floor((t-f.t)/60)%2===0);
function lungeOff(u,t){for(const f of fx)if(f.type==="lunge"&&f.u===u){const p=(t-f.t)/220;if(p<1)return [f.dx*Math.sin(p*Math.PI)*5,f.dy*Math.sin(p*Math.PI)*5];}return [0,0];}
function draw(t,dt){const sp=dt*TS/115;
  for(const u of G.party.concat(G.mons)){const k=(G.sneak&&u.side==="h"&&mode==="explore"?.6:1)*sp;u.dx=approach(u.dx,u.x*TS,k*(Math.abs(u.dx-u.x*TS)>48?6:1));u.dy=approach(u.dy,u.y*TS,k*(Math.abs(u.dy-u.y*TS)>48?6:1));}
  const focus=G.demo?null:(camFocus&&mode==="combat"?camFocus:C&&C.cur?C.cur:G.party[0]);
  if(focus){const tx=Math.max(0,Math.min(G.W*TS-SW,focus.dx-SW/2+8)),ty=Math.max(0,Math.min(G.H*TS-SH,focus.dy-SH/2+8+(mode==="combat"?14:0)));
    if(mode==="explore"){cam.x=tx;cam.y=ty;}else{cam.x+=(tx-cam.x)*.12;cam.y+=(ty-cam.y)*.12;}}
  let camX=Math.round(cam.x),camY=Math.round(cam.y);if(t-cam.shake<260){camX+=ri(-2,2);camY+=ri(-2,2);}
  ctx.fillStyle="#080706";ctx.fillRect(0,0,SW,SH);ctx.drawImage(G.terr,camX,camY,SW,SH,0,0,SW,SH);
  const x0=Math.floor(camX/TS),y0=Math.floor(camY/TS),x1=x0+SW/TS+1,y1=y0+SH/TS+1;const vis=(x,y)=>G.demo||seen(x,y);
  // fire
  for(const k of G.fire.keys()){const x=k%G.W,y=(k/G.W)|0;if(x<x0-1||x>x1||y<y0-1||y>y1||!G.explored[y][x])continue;drawFire(x*TS-camX,y*TS-camY,t,k);}
  // doors, torches, traps
  for(const o of G.objs)if(o.type==="door"&&!o.gone&&G.explored[o.y][o.x])drawDoor(o,o.x*TS-camX,o.y*TS-camY);
  for(const tc of G.torches)if(G.explored[tc.y]&&G.explored[tc.y][tc.x]||G.explored[tc.ly]&&G.explored[tc.ly][tc.lx])drawSconce(tc.x*TS-camX,tc.y*TS-camY,t,tc.out,tc.taken);
  for(const l of G.dropLights)if(G.explored[l.y][l.x])drawGroundTorch(l.x*TS-camX,l.y*TS-camY,t);
  for(const tr of G.traps)if(tr.found&&!tr.done&&G.explored[tr.y][tr.x])drawTrap(tr,tr.x*TS-camX,tr.y*TS-camY,t);
  // fog & darkness
  for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){if(!inB(x,y))continue;const sx=x*TS-camX,sy=y*TS-camY;
    if(G.demo)continue;if(!G.explored[y][x]){ctx.fillStyle="#080706";ctx.fillRect(sx,sy,16,16);}else if(!seen(x,y)){ctx.fillStyle="rgba(8,7,12,.66)";ctx.fillRect(sx,sy,16,16);}else if(!litAt(x,y)){ctx.fillStyle="rgba(6,6,14,.4)";ctx.fillRect(sx,sy,16,16);}}
  drawCombatGround(t,camX,camY);if(!G.demo)drawClassOverlays(camX,camY,t);
  // items
  const bob=Math.floor(t/300)%2;
  for(const it of G.items)if(vis(it.x,it.y)){const img=it.gold?monSpr("gold"):it.item==="potion"||it.item==="gpotion"?monSpr("potion"):null;const sx=it.x*TS-camX,sy=it.y*TS-camY;
    if(img)drawImg(img,sx,sy-(bob&&!it.gold?1:0));else drawIcon(it.item,sx,sy-(bob?1:0));}
  if(G.corpses)for(const c of G.corpses)if(G.explored[c.y][c.x]&&(vis(c.x,c.y)||mode==="explore"))drawCorpse(c,camX,camY);
  const ents=[];
  for(const o of G.objs){if(o.gone||o.type==="door"||!G.explored[o.y][o.x])continue;ents.push({y:o.deco&&!BLOCKERS[o.type]?-1e9:o.y*TS-1,f:()=>drawObj(o,o.x*TS-camX,o.y*TS-camY,t)});}
  if(G.npc&&vis(G.npc.x,G.npc.y)){const n=G.npc;ents.push({y:n.y*TS,f:()=>{const sx=n.x*TS-camX,sy=n.y*TS-camY-elevAt(n.x,n.y)*3;shadow(sx,sy);drawImg(heroSpr(n.def.id,"f",0,n.race),sx,sy-12-(bob?1:0));if(mode==="explore")qbubble(sx,sy-12,t);}});}
  for(const m of G.mons)if(vis(m.x,m.y)&&(G.demo||!isHiddenMon(m)))ents.push({y:m.dy,f:()=>drawMon(m,camX,camY,t)});
  if(!G.demo)for(const h of G.party)ents.push({y:h.dy+(h.down?-4:0),f:()=>drawHero(h,camX,camY,t)});
  ents.sort((a,b)=>a.y-b.y).forEach(e=>e.f());
  if(!G.demo){drawHoles(camX,camY);drawSmoke(camX,camY,t);}drawCombatMarkers(t,camX,camY);drawFx(t,camX,camY);}
function drawFire(sx,sy,t,k){const fl=["#ff4a20","#ff9a30","#ffe070"];for(let i=0;i<4;i++){const h=6+Math.abs(Math.sin(t/120+i*1.7+k))*7;const x=sx+2+i*3.5;
  ctx.fillStyle=fl[0];ctx.fillRect(Math.round(x),Math.round(sy+15-h),3,Math.round(h));ctx.fillStyle=fl[1];ctx.fillRect(Math.round(x)+1,Math.round(sy+15-h*.7),2,Math.round(h*.7));ctx.fillStyle=fl[2];ctx.fillRect(Math.round(x)+1,Math.round(sy+15-h*.35),1,Math.round(h*.35));}}
function drawFlames(sx,sy,t){const X=Math.round(sx),Y=Math.round(sy),fl=Math.floor(t/90)%2;ctx.fillStyle="#ff6a1a";ctx.fillRect(X+3,Y+4+fl,4,6);ctx.fillRect(X+9,Y+3-fl,4,7);ctx.fillStyle="#ffc040";ctx.fillRect(X+4,Y+6+fl,2,3);ctx.fillRect(X+10,Y+5-fl,2,3);ctx.fillStyle="rgba(60,50,50,.4)";ctx.fillRect(X+5,Y-3-fl,6,3);}
function drawDoor(o,sx,sy){if(o.burn){drawDoorInner(o,sx,sy);drawFlames(sx,sy,now());return;}drawDoorInner(o,sx,sy);}
function drawDoorInner(o,sx,sy){const vert=isWall(o.x-1,o.y)&&isWall(o.x+1,o.y);
  if(o.burnt){ctx.fillStyle="#1a1210";if(vert)ctx.fillRect(sx+2,sy+2,2,10);else ctx.fillRect(sx+2,sy+2,11,2);ctx.fillStyle="#a03a1a";ctx.fillRect(sx+3,sy+3,1,1);return;}
  if(o.iron&&!o.open){ctx.fillStyle="#1c1c24";ctx.fillRect(sx+1,sy,14,16);ctx.fillStyle="#5a5e6c";ctx.fillRect(sx+2,sy+1,12,14);ctx.fillStyle="#7a7e8c";ctx.fillRect(sx+2,sy+1,12,1);ctx.fillRect(sx+2,sy+1,1,14);
    ctx.fillStyle="#3a3c48";ctx.fillRect(sx+2,sy+5,12,1);ctx.fillRect(sx+2,sy+10,12,1);ctx.fillStyle="#a0a4b0";for(const [a,b] of [[3,3],[12,3],[3,8],[12,8],[3,13],[12,13]])ctx.fillRect(sx+a,sy+b,1,1);
    if(o.locked){ctx.fillStyle="#d0a030";ctx.fillRect(sx+7,sy+7,2,3);}return;}
  if(o.iron&&o.open){ctx.fillStyle="#3a3c48";if(vert)ctx.fillRect(sx+2,sy+1,2,12);else ctx.fillRect(sx+1,sy+2,12,2);return;}
  if(o.open){ctx.fillStyle="rgba(20,12,6,.35)";if(vert)ctx.fillRect(sx+2,sy,2,16);else ctx.fillRect(sx,sy+2,16,2);ctx.fillStyle="#7a4e2a";if(vert)ctx.fillRect(sx+2,sy+1,2,12);else ctx.fillRect(sx+1,sy+2,12,2);return;}
  ctx.fillStyle="#3a2414";ctx.fillRect(sx+1,sy,14,16);ctx.fillStyle="#8a5a30";ctx.fillRect(sx+2,sy+1,12,14);ctx.fillStyle="#a8743e";for(let i=0;i<3;i++)ctx.fillRect(sx+3+i*4,sy+1,2,14);
  ctx.fillStyle="#5a3a1e";ctx.fillRect(sx+2,sy+4,12,1);ctx.fillRect(sx+2,sy+11,12,1);
  if(o.locked){ctx.fillStyle="#f0c040";ctx.fillRect(sx+6,sy+7,4,4);ctx.fillStyle="#3a2414";ctx.fillRect(sx+7,sy+9,2,1);ctx.strokeStyle="#f0c040";ctx.lineWidth=1;ctx.strokeRect(sx+6.5,sy+5.5,3,2);}
  else{ctx.fillStyle="#e0c060";ctx.fillRect(sx+11,sy+8,1,2);}}
function drawSconce(sx,sy,t,out,taken){const f=Math.sin(t/90)+Math.sin(t/53);ctx.fillStyle="#6a6a78";ctx.fillRect(sx+6,sy+8,4,2);if(taken)return;ctx.fillStyle="#4a3020";ctx.fillRect(sx+7,sy+9,2,5);
  if(out){ctx.fillStyle="#2a2018";ctx.fillRect(sx+6,sy+5,4,3);return;}
  ctx.fillStyle="#ff8a30";ctx.fillRect(sx+6,sy+3+Math.round(f*.5),4,5);ctx.fillStyle="#ffe070";ctx.fillRect(sx+7,sy+5+Math.round(f*.5),2,3);
  ctx.fillStyle="rgba(255,170,70,.09)";ctx.beginPath();ctx.arc(sx+8,sy+14,22+f,0,Math.PI*2);ctx.fill();ctx.fillStyle="rgba(255,190,90,.08)";ctx.beginPath();ctx.arc(sx+8,sy+14,12+f,0,Math.PI*2);ctx.fill();}
function drawGroundTorch(sx,sy,t){const f=Math.sin(t/80);ctx.fillStyle="#6a4426";ctx.fillRect(sx+5,sy+11,6,2);ctx.fillStyle="#ff8a30";ctx.fillRect(sx+9,sy+8+Math.round(f),3,4);ctx.fillStyle="#ffe070";ctx.fillRect(sx+10,sy+9+Math.round(f),1,2);}
function drawTrap(tr,sx,sy,t){const a=.75+.25*Math.sin(t/300);ctx.globalAlpha=a;
  if(tr.type==="darts"){ctx.fillStyle="#7a7a86";ctx.fillRect(sx+3,sy+3,10,10);ctx.fillStyle="#a8a8b4";ctx.fillRect(sx+4,sy+4,8,8);ctx.fillStyle="#4a4a56";for(const [a2,b] of [[6,6],[9,6],[6,9],[9,9]])ctx.fillRect(sx+a2,sy+b,1,1);}
  else if(tr.type==="pit"){ctx.fillStyle="#3a2a1a";ctx.fillRect(sx+2,sy+2,12,12);ctx.fillStyle="#6a5038";for(let i=0;i<4;i++)ctx.fillRect(sx+3+i*3,sy+3,1,10);}
  else if(tr.type==="fire"){ctx.fillStyle="#4a4048";ctx.fillRect(sx+3,sy+4,10,8);ctx.fillStyle="#ff7a30";for(let i=0;i<4;i++)ctx.fillRect(sx+4+i*2+ (i>1?1:0),sy+5,1,6);}
  else{ctx.fillStyle="#d8d0b0";ctx.fillRect(sx,sy+9,16,1);ctx.fillStyle="#d0a030";ctx.fillRect(sx+12,sy+5,3,4);ctx.fillRect(sx+13,sy+9,1,1);}
  ctx.globalAlpha=1;ctx.strokeStyle="rgba(255,70,50,.8)";ctx.lineWidth=1;ctx.strokeRect(sx+.5,sy+.5,15,15);}
function drawObj(o,sx,sy,t){
  if(o.type==="boulder"){shadow(sx,sy,14);drawImg(boulderSpr(),sx,sy);return;}
  if(o.type==="wood"){shadow(sx,sy,14);drawWood(sx,sy);if(o.burn)drawFlames(sx,sy,t);return;}
  if(o.deco||o.type==="rubble"||o.type==="cavein"){drawDeco(o,sx,sy,t);return;}
  if(o.burn&&o.type==="chest"){drawImg(monSpr("chest"),sx,sy);drawFlames(sx,sy,t);return;}
  if(o.type==="barrel"){shadow(sx,sy,12);drawImg(monSpr("barrel"),sx,sy-2);return;}
  if(o.type==="chest"){shadow(sx,sy,12);drawImg(monSpr(o.opened?"chestOpen":"chest"),sx,sy-1);if(o.suspicious&&!o.opened){ctx.fillStyle="#ff6a6a";ctx.fillRect(Math.round(sx)+13,Math.round(sy)+1,2,4);ctx.fillRect(Math.round(sx)+13,Math.round(sy)+6,2,1);}return;}
  if(o.type==="shrine"){shadow(sx,sy,12);drawImg(monSpr("shrine"),sx,sy-6);if(!o.used){ctx.fillStyle=`rgba(120,200,255,${.2+.15*Math.sin(t/200)})`;ctx.beginPath();ctx.arc(sx+8,sy-4,6,0,Math.PI*2);ctx.fill();}return;}
  if(o.type==="captive"){shadow(sx,sy);const bx=Math.round(sx),by=Math.round(sy);drawImg(heroSpr("merchant","f"),sx,sy-10);ctx.fillStyle="#8a8e9a";ctx.fillRect(bx+3,by+5,10,1);ctx.fillRect(bx+2,by+6,1,3);ctx.fillRect(bx+13,by+6,1,3);ctx.fillStyle="#c8ccd8";ctx.fillRect(bx+5,by+5,1,1);ctx.fillRect(bx+9,by+5,1,1);
    if(mode==="explore"){ctx.fillStyle="#f0c040";ctx.font="600 8px 'Pixelify Sans', sans-serif";ctx.textAlign="center";ctx.fillText("!",bx+8,by-12+Math.sin(t/200)*1.5);ctx.textAlign="left";}return;}
  if(o.type==="relic"){shadow(sx,sy,10);const bx=Math.round(sx),by=Math.round(sy);ctx.fillStyle="#1a1418";ctx.fillRect(bx+3,by+9,10,5);ctx.fillRect(bx+5,by+2,6,8);ctx.fillStyle="#6a6470";ctx.fillRect(bx+4,by+10,8,3);
    ctx.fillStyle="#3a8a5a";ctx.fillRect(bx+6,by+3,4,6);ctx.fillStyle="#d8b040";ctx.fillRect(bx+6,by+3,4,1);ctx.fillRect(bx+7,by+5,2,1);ctx.fillStyle="#9af0b0";ctx.fillRect(bx+6,by+4,1,2);
    ctx.fillStyle=`rgba(150,255,180,${.12+.1*Math.sin(t/220)})`;ctx.beginPath();ctx.arc(bx+8,by+6,7,0,Math.PI*2);ctx.fill();return;}
  if(o.type==="coffer"){shadow(sx,sy,14);const bx=Math.round(sx),by=Math.round(sy);ctx.fillStyle="#141016";ctx.fillRect(bx+1,by+4,14,11);ctx.fillStyle=o.opened?"#4a4650":"#6a6670";ctx.fillRect(bx+2,by+5,12,9);ctx.fillStyle="#8a8690";ctx.fillRect(bx+2,by+5,12,2);
    if(!o.opened){ctx.fillStyle="#d8b040";ctx.fillRect(bx+4,by+9,2,2);ctx.fillRect(bx+7,by+9,2,2);ctx.fillRect(bx+10,by+9,2,2);}else{ctx.fillStyle="#141016";ctx.fillRect(bx+3,by+6,10,3);}return;}
  if(o.type==="runes"){shadow(sx,sy,12);drawImg(monSpr("runes"),sx,sy-3);if(!o.used){ctx.fillStyle=`rgba(120,240,255,${.15+.12*Math.sin(t/250)})`;ctx.fillRect(sx+4,sy+1,8,10);}return;}
  if(o.type==="merchant"){shadow(sx,sy);drawImg(heroSpr("merchant","f"),sx,sy-12);if(mode==="explore"){ctx.fillStyle="#f0c040";ctx.font="600 8px 'Pixelify Sans', sans-serif";ctx.textAlign="center";outlined("$",sx+8,sy-12-Math.floor(t/400)%2,"#f0c040");}}}
function drawIcon(id,sx,sy){ctx.save();ctx.translate(Math.round(sx),Math.round(sy));drawIconBase(ctx,id);ctx.restore();}
function drawHero(h,camX,camY,t){const [ox,oy]=lungeOff(h,t);const e=elevAt(h.x,h.y)*3;const sx=h.dx-camX+ox,sy=h.dy-camY+oy-e;const isCur=C&&C.cur===h&&mode==="combat";
  if(h.down){ctx.save();ctx.globalAlpha=h.dead?.45:.75;ctx.translate(Math.round(sx)+8,Math.round(sy)+10);ctx.rotate(-Math.PI/2);ctx.drawImage(heroSpr(h.id,"f",0,h.race),-14,-8);ctx.restore();
    if(h.dead){ctx.fillStyle="#d8d0e0";ctx.fillRect(Math.round(sx)+7,Math.round(sy)-2,2,8);ctx.fillRect(Math.round(sx)+5,Math.round(sy),6,2);}return;}
  if(isCur){ctx.fillStyle="rgba(255,220,80,.55)";ctx.fillRect(Math.round(sx)+2,Math.round(sy)+12,12,4);}
  const moving=h.dx!==h.x*TS||h.dy!==h.y*TS;shadow(sx,sy);
  if(h.st.hidden)ctx.globalAlpha=.5;
  if(!flashing(h,t)){if(h.wild)drawImg(wildSpr(h),sx,sy-(moving&&Math.floor(t/120)%2?1:0),h.flip);else if(h.st.prone){ctx.save();ctx.translate(Math.round(sx)+8,Math.round(sy)+10);ctx.rotate(-Math.PI/2);ctx.drawImage(heroSpr(h.id,"f",0,h.race),-14,-8);ctx.restore();}
    else drawImg(heroSpr(h.id,h.face,walkFrame(h),h.race),sx,sy-12,h.face==="s"&&h.flip);}
  ctx.globalAlpha=1;
  if(h.st.raging){ctx.fillStyle=`rgba(255,60,30,${.18+.12*Math.sin(t/80)})`;ctx.fillRect(Math.round(sx)+2,Math.round(sy)-12,12,27);}
  statusIcons(h,sx,sy-(h.wild?0:12),t);
  if(isCur){const a=Math.round(sy)-(h.wild?7:19)-Math.round(Math.abs(Math.sin(t/200))*2);const bx=Math.round(sx);ctx.fillStyle=OUT;ctx.fillRect(bx+4,a-1,9,1);ctx.fillRect(bx+5,a,7,2);ctx.fillRect(bx+6,a+2,5,1);ctx.fillRect(bx+7,a+3,3,1);
    ctx.fillStyle="#ffe060";ctx.fillRect(bx+5,a,7,1);ctx.fillRect(bx+6,a+1,5,1);ctx.fillRect(bx+7,a+2,3,1);}}
function drawMon(m,camX,camY,t){const [ox,oy]=lungeOff(m,t);const e=elevAt(m.x,m.y)*3;const sx=m.dx-camX+ox,sy=m.dy-camY+oy-e;
  if(C&&C.cur===m&&mode==="combat"){ctx.fillStyle="rgba(255,90,60,.5)";ctx.fillRect(Math.round(sx)+1,Math.round(sy)+12,14,4);}
  const moving=m.dx!==m.x*TS||m.dy!==m.y*TS;shadow(sx,sy,m.boss?16:10);
  const h0=G.demo?null:G.party.filter(h=>!h.down&&!h.dead).sort((a,b)=>cheb(a,m)-cheb(b,m))[0];const flip=!!(h0&&h0.x>m.x);
  const hum=HUMAN[m.sprite];let mdir="f";if(hum&&h0){const ddx=h0.x-m.x,ddy=h0.y-m.y;mdir=Math.abs(ddx)>Math.abs(ddy)?"s":ddy<0?"b":"f";}
  if(!flashing(m,t)){if(m.st.prone){ctx.save();ctx.translate(Math.round(sx)+8,Math.round(sy)+10);ctx.rotate(Math.PI/2);if(hum)ctx.drawImage(heroSpr(m.sprite,"f"),-14,-8);else ctx.drawImage(monSpr(m.sprite),-8,-8);ctx.restore();}
    else if(hum)drawImg(heroSpr(m.sprite,mdir,walkFrame(m)),sx,sy-12,mdir==="s"&&!flip);
    else if(m.boss)drawImg(monSpr(m.sprite),sx-8,sy-16,flip,32,32);else drawImg(monSpr(m.sprite),sx,sy-(moving&&Math.floor(t/120)%2?1:0),flip);}
  if(m.inCombat&&mode!=="explore"){const top=Math.round(sy)-(m.boss?19:hum?16:4);ctx.fillStyle=OUT;ctx.fillRect(Math.round(sx)+1,top,14,3);ctx.fillStyle="#a83a30";ctx.fillRect(Math.round(sx)+2,top+1,12,1);ctx.fillStyle="#5ae04a";ctx.fillRect(Math.round(sx)+2,top+1,Math.max(1,Math.round(12*m.hp/m.maxHp)),1);}
  statusIcons(m,sx,sy-(m.boss?16:hum?14:0),t);
  if(!G.demo&&G.party.some(h=>h.conc&&h.conc.type==="mark"&&h.conc.target===m)){ctx.fillStyle="#ffe060";const cx=Math.round(sx)+14,cy=Math.round(sy)+2;ctx.fillRect(cx-2,cy,5,1);ctx.fillRect(cx,cy-2,1,5);}
  if(m.bubble>now())bubble(sx,sy-(m.boss?16:hum?12:0));else if(m.state==="sleep"&&!m.inCombat)zzz(sx,sy,t);
  if(m.peace&&mode==="explore"){ctx.fillStyle="#ffffff";ctx.fillRect(Math.round(sx)+12,Math.round(sy)-5,3,3);}}
function statusIcons(u,sx,sy,t){const s=u.st;let x=Math.round(sx)+1;const y=Math.round(sy)-6;const dot=(c)=>{ctx.fillStyle=OUT;ctx.fillRect(x-1,y-1,5,5);ctx.fillStyle=c;ctx.fillRect(x,y,3,3);x+=5;};
  if(s.poisoned)dot("#6ad04a");if(s.restrained){ctx.strokeStyle=s.restrained.by==="web"?"rgba(240,240,240,.8)":"#4a9a3a";ctx.lineWidth=1;for(let i=0;i<4;i++){ctx.beginPath();ctx.moveTo(Math.round(sx)+2+i*4,Math.round(sy)+20);ctx.lineTo(Math.round(sx)+4+i*3,Math.round(sy)+(u.side==="h"?10:8));ctx.stroke();}}
  if(s.frightened||s.turned)dot("#f0f0f0");if(s.blessed)dot("#ffe060");if(s.dodge)dot("#7ab8ff");if(s.guided)dot("#fff0a0");if(u.conc)dot("#9fb4ff");if(s.helped)dot("#ffffff");}
function ring(x,y,col,t){ctx.strokeStyle=col;ctx.globalAlpha=.5+.3*Math.sin(t/120);ctx.lineWidth=1;ctx.strokeRect(Math.round(x)+.5,Math.round(y)+.5,15,15);ctx.globalAlpha=1;}
function brackets(x,y,col,t){x=Math.round(x);y=Math.round(y);const o=Math.floor(t/250)%2;ctx.fillStyle=col;const L=4;
  ctx.fillRect(x-o,y-o,L,1);ctx.fillRect(x-o,y-o,1,L);ctx.fillRect(x+16+o-L,y-o,L,1);ctx.fillRect(x+15+o,y-o,1,L);ctx.fillRect(x-o,y+15+o,L,1);ctx.fillRect(x-o,y+16+o-L,1,L);ctx.fillRect(x+16+o-L,y+15+o,L,1);ctx.fillRect(x+15+o,y+16+o-L,1,L);}
function outlined(text,x,y,col){x=Math.round(x);y=Math.round(y);ctx.fillStyle=OUT;for(const [a,b] of [[-1,0],[1,0],[0,-1],[0,1]])ctx.fillText(text,x+a,y+b);ctx.fillStyle=col;ctx.fillText(text,x,y);}
function bubble(x,y){x=Math.round(x);y=Math.round(y)-14;ctx.fillStyle=OUT;ctx.fillRect(x+3,y,10,12);ctx.fillStyle="#fff";ctx.fillRect(x+4,y+1,8,10);ctx.fillStyle="#e03030";ctx.fillRect(x+7,y+2,2,5);ctx.fillRect(x+7,y+8,2,2);}
function qbubble(x,y,t){x=Math.round(x);y=Math.round(y)-14-Math.floor(t/400)%2;ctx.fillStyle=OUT;ctx.fillRect(x+3,y,10,12);ctx.fillStyle="#fff";ctx.fillRect(x+4,y+1,8,10);ctx.fillStyle="#3a6ad0";
  ctx.fillRect(x+6,y+2,4,1);ctx.fillRect(x+9,y+3,1,2);ctx.fillRect(x+8,y+5,1,1);ctx.fillRect(x+7,y+6,1,1);ctx.fillRect(x+7,y+8,1,2);}
function zzz(x,y,t){const o=Math.floor(t/400)%3;ctx.fillStyle="#e8f0ff";const zx=Math.round(x)+11+o,zy=Math.round(y)-4-o*2;ctx.fillRect(zx,zy,4,1);ctx.fillRect(zx+2,zy+1,1,1);ctx.fillRect(zx+1,zy+2,1,1);ctx.fillRect(zx,zy+3,4,1);}
function drawFootprints(camX,camY){if(mode!=="combat"||!C)return;for(const u of C.units){if(u.side==="m"&&(u.hp<=0||!u.inCombat))continue;if(u.side==="h"&&u.dead)continue;if(!seen(u.x,u.y))continue;
    const sx=u.x*TS-camX,sy=u.y*TS-camY-elevAt(u.x,u.y)*3;ctx.fillStyle=u.side==="h"?"rgba(110,170,255,.45)":"rgba(255,90,70,.5)";ctx.fillRect(sx+1,sy+1,14,1);ctx.fillRect(sx+1,sy+14,14,1);ctx.fillRect(sx+1,sy+1,1,14);ctx.fillRect(sx+14,sy+1,1,14);}}
function drawCombatGround(t,camX,camY){drawFootprints(camX,camY);if(!(C&&C.cur&&C.cur.side==="h"&&!busy&&mode==="combat"&&!choosing))return;const u=C.cur;
  if(C.mode==="move"&&C.reach){for(const [k,v] of C.reach){if(v.c===0||v.c>C.moveLeft)continue;const x=k%G.W,y=(k/G.W)|0;if(unitAt(x,y)||!G.explored[y][x])continue;const sx=x*TS-camX,sy=y*TS-camY;
      const hz=fireAt(x,y)||gnd(x,y)===GROUND.acid||gnd(x,y)===GROUND.oil||gnd(x,y)===GROUND.crack;ctx.fillStyle=hz?"rgba(255,140,40,.25)":"rgba(90,150,255,.2)";ctx.fillRect(sx+1,sy+1,14,14);
      ctx.fillStyle="rgba(235,245,255,.55)";ctx.fillRect(sx+1,sy+1,14,1);ctx.fillRect(sx+1,sy+1,1,14);ctx.fillStyle="rgba(60,100,200,.35)";ctx.fillRect(sx+1,sy+14,14,1);ctx.fillRect(sx+14,sy+1,1,14);}
    if(C.pending!=null){const x=C.pending%G.W,y=(C.pending/G.W)|0;ring(x*TS-camX,y*TS-camY,"#ff5040",t);}}
  if(C.mode==="target"&&C.tgt){const s=C.tgt;
    if(s.kind==="tile"){for(let y=u.y-s.range;y<=u.y+s.range;y++)for(let x=u.x-s.range;x<=u.x+s.range;x++){if(!inB(x,y)||!seen(x,y)||!validTarget(s,x,y))continue;ctx.fillStyle="rgba(255,210,80,.13)";ctx.fillRect(x*TS-camX,y*TS-camY,16,16);}
      if(C.area&&s.area){const pulse=.3+.15*Math.sin(t/120);for(const [x,y] of areaTiles(C.area.x,C.area.y,s.area)){ctx.fillStyle=`rgba(255,120,40,${pulse})`;ctx.fillRect(x*TS-camX+1,y*TS-camY+1,14,14);}}}
    else{const list=s.kind==="ally"?G.party.filter(h=>!h.dead):G.mons.filter(m=>m.inCombat);for(const v of list)if(validTarget(s,v.x,v.y))ring(v.x*TS-camX,v.y*TS-camY,s.kind==="ally"?"#8aff7a":"#ffe060",t);
      if(s.barrel)for(const o of G.objs)if(o.type==="barrel"&&!o.gone&&cheb(o,u)<=1)ring(o.x*TS-camX,o.y*TS-camY,"#ffe060",t);}}}
function drawCombatMarkers(t,camX,camY){if(!(C&&C.cur&&C.cur.side==="h"&&!busy&&mode==="combat"&&C.mode==="move"&&canAttack()&&!choosing))return;const u=C.cur;const w=weaponOf(u,C.weapon);
  ctx.font="600 8px 'Pixelify Sans', sans-serif";ctx.textAlign="center";
  for(const m of foesOf(u)){if(!seen(m.x,m.y)||!inReachW(u,m,w))continue;const sx=m.dx-camX,sy=m.dy-camY-elevAt(m.x,m.y)*3;brackets(sx,sy,m===C.sel?"#ffe060":"#ff4a3a",t);
    const md=attackMods(u,m,w);ctx.textAlign="left";outlined(pctTxt(md,m),sx+(m.boss?18:15),sy+11,m===C.sel?"#ffe060":md.mode>0?"#8aff7a":md.mode<0?"#ffb0a0":"#ffffff");}}
function drawFx(t,camX,camY){for(let i=fx.length-1;i>=0;i--){const f=fx[i];const p=t-f.t;if(p>2200){fx.splice(i,1);continue;}
    if(f.type==="float"&&p<1000){ctx.font="600 9px 'Pixelify Sans', sans-serif";ctx.textAlign="center";outlined(f.text,f.x*TS-camX+8,f.y*TS-camY-10-p/45,f.col);}
    if(f.type==="dice"&&p<1100){const rolling=p<420;const vals=f.pair||[f.final];vals.forEach((v,j)=>{const cx=f.x*TS-camX+8+(vals.length>1?(j?9:-9):0),cy=f.y*TS-camY-22-(rolling?Math.abs(Math.sin(p/60))*4:0);
      drawD20(cx,cy,rolling?rnd(20):v,!rolling&&vals.length>1&&v!==f.final,!rolling&&v===20,!rolling&&v===1);});}
    if(f.type==="shot"&&p<260){const q=p/260;const x=(f.from.x+(f.to.x-f.from.x)*q)*TS-camX+8,y=(f.from.y+(f.to.y-f.from.y)*q)*TS-camY+4;ctx.fillStyle=f.col;ctx.fillRect(Math.round(x)-1,Math.round(y)-1,3,3);}
    if(f.type==="missile"&&p<600){for(let j=0;j<f.n;j++){const q=Math.min(1,Math.max(0,(p-j*70)/380));const x=(f.from.x+(f.to.x-f.from.x)*q)*TS-camX+8+Math.sin(q*Math.PI+j)*10,y=(f.from.y+(f.to.y-f.from.y)*q)*TS-camY+2;ctx.fillStyle="#c8d4ff";ctx.fillRect(Math.round(x)-2,Math.round(y)-2,4,4);ctx.fillStyle="#6f86ff";ctx.fillRect(Math.round(x)-1,Math.round(y)-1,2,2);}}
    if(f.type==="boom"&&p<700){const r=(f.big?10:6)+p/700*(f.big?40:22);ctx.globalAlpha=1-p/700;ctx.fillStyle="#ffb040";ctx.beginPath();ctx.arc(f.x*TS-camX+8,f.y*TS-camY+8,r,0,Math.PI*2);ctx.fill();ctx.fillStyle="#fff0a0";ctx.beginPath();ctx.arc(f.x*TS-camX+8,f.y*TS-camY+8,r*.5,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;}
    if(f.type==="wave"&&p<600){ctx.strokeStyle=`rgba(220,230,255,${1-p/600})`;ctx.lineWidth=2;ctx.beginPath();ctx.arc(f.u.dx-camX+8,f.u.dy-camY+6,4+p/14,0,Math.PI*2);ctx.stroke();}
    if(f.type==="pillar"&&p<600){ctx.fillStyle=`rgba(255,240,170,${.8*(1-p/600)})`;ctx.fillRect(f.x*TS-camX+4,f.y*TS-camY-30,8,46);}
    if(f.type==="ring"&&p<700){ctx.strokeStyle=f.col;ctx.globalAlpha=1-p/700;ctx.lineWidth=2;ctx.beginPath();ctx.arc(f.u.dx-camX+8,f.u.dy-camY+4,5+p/50,0,Math.PI*2);ctx.stroke();ctx.globalAlpha=1;}
    if(f.type==="vines"&&p<800){ctx.fillStyle=`rgba(80,180,60,${1-p/800})`;for(let k=0;k<14;k++){const x=(f.x-1)*TS-camX+((k*13)%46),y=(f.y-1)*TS-camY+((k*29)%44);ctx.fillRect(x,Math.round(y-p/80),2,6);}}
    if(f.type==="heal"&&p<900){ctx.fillStyle="#9dff8a";for(let k=0;k<6;k++){const a=k*1.05+p/180;ctx.fillRect(Math.round(f.u.dx-camX+8+Math.cos(a)*9),Math.round(f.u.dy-camY+6-((p/12+k*7)%24)),2,2);}}
    if(f.type==="rage"&&p<700){ctx.strokeStyle=`rgba(255,80,40,${1-p/700})`;ctx.lineWidth=2;ctx.beginPath();ctx.arc(f.u.dx-camX+8,f.u.dy-camY+4,6+p/40,0,Math.PI*2);ctx.stroke();}
    if(f.type==="poof"&&p<500){ctx.fillStyle=`rgba(255,255,255,${1-p/500})`;for(let k=0;k<6;k++){const a=k*1.05;ctx.fillRect(Math.round(f.x*TS-camX+8+Math.cos(a)*p/40),Math.round(f.y*TS-camY+8+Math.sin(a)*p/40),3,3);}}}}
function drawD20(x,y,n,dim,crit,fum){x=Math.round(x);y=Math.round(y);const r=8;ctx.save();ctx.globalAlpha=dim?.45:1;ctx.beginPath();for(let i=0;i<6;i++){const a=Math.PI/3*i-Math.PI/2;ctx.lineTo(x+Math.cos(a)*r,y+Math.sin(a)*r);}ctx.closePath();
  ctx.fillStyle=crit?"#ffd84a":fum?"#ff7060":"#f4f0e2";ctx.fill();ctx.lineWidth=1.5;ctx.strokeStyle=OUT;ctx.stroke();ctx.fillStyle=OUT;ctx.font="600 8px 'Pixelify Sans', sans-serif";ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText(String(n),x,y+.5);ctx.restore();ctx.textBaseline="alphabetic";}

// ================= overlays =================
function show(id){["ovTown","ovClass","ovEnd","ovSettings","ovMenu","ovShop","ovMap"].forEach(o=>$(o).hidden=o!==id);}
function showEnd(won,line){$("endTitle").textContent=won?"Victory!":"Your party fell";
  const coins=bankRun(won);clearRun();const seedTxt=`<br><span class="sm">Dungeon seed: ${G.seed}</span>`;$("endStats").innerHTML=`${line}<br>Party: ${G.party.concat(G.fallen||[]).map(h=>esc(heroLabel(h))+(h.dead?" (fell)":"")).join(", ")}<br><b>+${coins} coins for the town</b> (you have ${TOWN.coins})${seedTxt}<br>Level ${G.level} · floor ${G.floor} of ${S.dungeon.floors}<br>Monsters defeated: ${G.kills}<br>Gold: ${G.gold}`;
  setTimeout(()=>show("ovEnd"),500);}
function spriteCanvas(id,w,h,race){const c=document.createElement("canvas");c.width=16;c.height=CH_H;c.getContext("2d").drawImage(heroSpr(id,"f",0,race),0,0);if(w){c.style.width=w+"px";c.style.height=h+"px";}return c;}
function buildClassCards(){const box=$("classCards");box.innerHTML="";
  S.classes.forEach((c,i)=>{const info=CINFO[c.id];const d=document.createElement("div");d.className="card";d.appendChild(spriteCanvas(c.id));
    const ab=ABILS.map(a=>`${ABN[a]} ${c[a]}`).join(" · ");
    d.insertAdjacentHTML("beforeend",`<div class="nm">${esc(c.name.toUpperCase())}</div><div class="st">HP ${c.hd+amod(c.con)} · AC ${c.ac} · ${esc(info.atk.name)} ${esc(c.dmg)} · ${c.range>1?"range "+c.range:"melee"}</div><div class="ab2"><span class="sm">${ab}</span><br>${esc(info.blurb)}</div>`);
    const b=document.createElement("button");b.className="big";b.type="button";b.id="pick-"+c.id;b.textContent="START AS "+c.name.toUpperCase();b.addEventListener("click",()=>buildRaceCards(i));d.appendChild(b);box.appendChild(d);});}
function buildRaceCards(ci){const box=$("classCards");box.innerHTML="";const c=S.classes[ci];
  box.insertAdjacentHTML("beforeend",`<p class="help" style="grid-column:1/-1">Choose your ${esc(c.name)}'s people. Darkvision lets you see without light (only within 6 squares, in grey shades), which matters a lot when you put your lantern out.</p>`);
  for(const k of RACE_KEYS){const R=RACES[k];const d=document.createElement("div");d.className="card";
    d.insertAdjacentHTML("beforeend",`<div class="nm">${esc(R.name.toUpperCase())}${R.dv?" · DARKVISION":""}</div><div class="ab2">${esc(R.desc)}</div>`);
    const b=document.createElement("button");b.className="big";b.type="button";b.id="pick-race-"+k;b.textContent=`${R.name.toUpperCase()} ${c.name.toUpperCase()}`;b.addEventListener("click",()=>{show(null);newRun(ci,k);});d.appendChild(b);box.appendChild(d);}
  const back=document.createElement("button");back.className="big alt";back.type="button";back.textContent="BACK";back.addEventListener("click",buildClassCards);box.appendChild(back);}
// ---------- party / bag / rest menu ----------
let menuTab="party";
let menuHero=null;// when set, the PARTY tab shows just this hero as a character card
function openMenu(tab,tries,hero){if(!G||G.demo||mode!=="explore")return;if(busy){if((tries||0)<20)setTimeout(()=>openMenu(tab,(tries||0)+1,hero),60);return;}menuTab=tab||menuTab;menuHero=hero===undefined?null:hero;renderMenu();show("ovMenu");}
function closeMenu(){show(null);}
function renderMenu(){const el=$("menuBody");["party","bag","notes","rest"].forEach(t=>$("tab-"+t).classList.toggle("on",menuTab===t));el.innerHTML="";
  if(menuTab==="party"){const focus=menuHero!==null&&G.party[menuHero]?menuHero:null;if(focus!==null)heroCardTop(el,focus);
    G.party.forEach((h,idx)=>{if(focus!==null&&idx!==focus)return;const d=document.createElement("div");d.className="sheet";d.appendChild(spriteCanvas(h.id,0,0,h.race));
      const w=weaponOf(h,"main"),a=weaponOf(h,"alt");const fxg=gearFx(h);
      const abl=ABILS.map(k=>`<div><b>${ABN[k]}</b>${score(h,k)}<i>${sgn(abm(h,k))}</i></div>`).join("");
      const sk=h.info.skills.map(s=>`${SKN[s]} ${sgn(skillBonus(h,s))}`).join(", ");
      const res=featRes(h).map(k=>`${RES[k].name} ${h.res[k]||0}/${RES[k].max(G.level)}`).join(" · ");
      const slots=h.slots.length?`Spell slots: ${h.slots.map((v,i)=>`L${i+1} ${v}/${slotMax(h)[i]}`).join(" · ")}`:"";
      d.insertAdjacentHTML("beforeend",`<div class="sh-h"><b>${h.nick?esc(h.nick)+", ":""}${esc(RACES[h.race||"human"].name)} ${esc(h.name)}${subOf(h)?" · "+esc(subOf(h).name):""}</b>${h.trait?`<br><span class="sm">${TRAITS[h.trait].name} (likes ${TRAITS[h.trait].likes}; dislikes ${TRAITS[h.trait].dislikes}) · mood: ${(h.appr||0)>=5?"Loyal (+1 to hit and saves)":(h.appr||0)<=-5?"Unhappy (might leave!)":(h.appr||0)>0?"Content":(h.appr||0)<0?"Grumbling":"Neutral"}</span>`:h.isYou?'<br><span class="sm">That\'s you.</span>':""} Lv ${G.level}${h.exh?` <span class="tag">EXHAUSTION ${h.exh}</span>`:""}${idx===0?' <span class="tag">LEADER</span>':""}<br><span class="sm">HP ${h.hp}/${h.maxHp} · AC ${acOf(h)} · Speed ${speedOf(h)} · Hit Dice ${h.hdLeft}/${h.hdMax} (d${h.def.hd}) · Prof +${prof()}</span></div>
        <div class="abl">${abl}</div>
        <p class="sm"><b>${esc(w.name)}</b> ${sgn(atkBonus(h,w))} to hit, ${esc(w.dice)}${dmgBonus(h,w)?sgn(dmgBonus(h,w)):""} ${w.type}${w.melee?"":", range "+w.range}${a.save?"":` · <b>${esc(a.name)}</b> ${sgn(atkBonus(h,a))}, ${esc(a.dice)}${dmgBonus(h,a)?sgn(dmgBonus(h,a)):""}`}<br>
        Saves: ${h.info.saves.map(s=>ABN[s]+" "+sgn(saveBonus(h,s))).join(", ")} · Passive Perception ${passive(h,"perception")}<br>Skills: ${sk}<br>${res}${res&&slots?"<br>":""}${slots}</p>`);
      if(focus===null)renderGear(d,h,false);
      if(focus===null)for(const a of classActions(h)){const b=document.createElement("button");b.type="button";b.className="big alt";b.innerHTML=`${esc(a.t)}<br><small>${esc(a.sub||"")}</small>`;b.disabled=!!a.dis;b.addEventListener("click",a.f);d.appendChild(b);}
      if(focus===null&&h.id==="druid"&&!h.dead&&!h.down&&mode==="explore"){const b=document.createElement("button");b.type="button";b.className="big alt";
        if(h.wild){b.textContent="REVERT TO NORMAL FORM";b.addEventListener("click",()=>{h.wild=null;computeLight();fov();renderMenu();hud();});}
        else{const n=h.res.wildshape||0;b.textContent=`WILD SHAPE: WOLF (${n} left)`;b.disabled=n<=0;b.addEventListener("click",()=>{h.res.wildshape--;if(h.conc)endConc(h);startWild(h,"wolf");renderMenu();});
          if(h.sub==="moon"){const b2=document.createElement("button");b2.type="button";b2.className="big alt";b2.textContent=`WILD SHAPE: BROWN BEAR (${n} left)`;b2.disabled=n<=0;b2.addEventListener("click",()=>{h.res.wildshape--;if(h.conc)endConc(h);startWild(h,"bear");renderMenu();});d.appendChild(b2);}}
        d.appendChild(b);}
      if(idx>0&&focus===null){const b=document.createElement("button");b.type="button";b.className="big alt";b.textContent="MAKE LEADER";b.addEventListener("click",()=>{G.party.splice(idx,1);G.party.unshift(h);renderMenu();hud();fov();});d.appendChild(b);}
      if(focus!==null){const det=document.createElement("details");det.className="fullsheet";det.innerHTML="<summary>FULL CHARACTER SHEET</summary>";det.appendChild(d);el.appendChild(det);heroCardBottom(el,focus);}else el.appendChild(d);});}
  if(menuTab==="bag"){const ld=packLoad(),cp=packCap();el.insertAdjacentHTML("beforeend",`<p>Gold: <b>${G.gold}</b> · Pack: <b${ld>cp?' style="color:#ff8a6a"':""}>${ld} / ${cp}</b>${ld>cp?" OVERLOADED: slower in combat, and every step takes longer. Drop something.":""}</p><p class="help">Firewood weighs 2, rations, oil and torches 1 each, gear 1, small things ½. Stronger heroes carry more.</p>`);const ids=Object.keys(G.bag);if(!ids.length)el.insertAdjacentHTML("beforeend","<p class='help'>Your bag is empty.</p>");
    for(const id of ids){const it=ITEMS[id];const d=document.createElement("div");d.className="item";const ic=document.createElement("canvas");ic.width=ic.height=16;d.appendChild(ic);
      const saved=ctx;drawIconTo(ic,id);d.insertAdjacentHTML("beforeend",`<div><b>${esc(itemName(id))} ×${G.bag[id]}</b><br><span class="sm">${esc(itemDesc(id))}</span></div>`);
      const acts=document.createElement("div");acts.className="acts";
      const btn=(t,f,dis)=>{const b=document.createElement("button");b.type="button";b.className="chip";b.textContent=t;b.disabled=!!dis;b.addEventListener("click",f);acts.appendChild(b);};
      if(mode==="explore"&&id!=="relic")btn(id==="arrows"?"DROP 10":"DROP ONE",()=>{const n=id==="arrows"?Math.min(10,G.bag[id]):1;takeItem(id,n);const L=G.party[0];if(id==="arrows")G.items.push({x:L.x,y:L.y,item:id,n});else G.items.push({x:L.x,y:L.y,item:id});renderMenu();hud();});
      if(!isKnown(id)){const pot=it.kind==="use"&&!id.startsWith("scroll");btn(pot?"TASTE IT (MEDICINE)":"IDENTIFY (ARCANA)",async()=>{await identify(id);const msg=$("menuBody").querySelector(".msg");const keep=msg?msg.textContent:"";renderMenu();if(keep)alertMenu(keep);},G.idTried.has(id));}
      if(it.kind==="gear")for(const h of G.party.filter(h=>!h.dead&&h.id!=="beast")){const why=wearBlock(h,id);btn(`PUT ON: ${h.name.toUpperCase()}`,()=>{const msg=wearItem(h,id);renderMenu();hud();alertMenu(msg);},!!why);}
      if(id==="potion"||id==="gpotion"&&isKnown(id))for(const h of G.party)btn(`GIVE: ${h.name.toUpperCase()}`,()=>{takeItem(id);heal(h,roll(id==="potion"?"2d4+2":"4d4+4").total);renderMenu();hud();},h.hp>=h.maxHp&&!h.down);
      if(COPYABLE[id]&&isKnown(id)){const wz=G.party.find(h=>h.id==="wizard"&&!h.dead);if(wz)btn(`COPY INTO SPELLBOOK (25g)`,()=>{if(G.gold<25){alertMenu("You need 25 gold for the special inks.");return;}const sp=COPYABLE[id];wz.learned=wz.learned||[];if(spellsOf(wz).includes(sp)){alertMenu("The wizard already knows that spell.");return;}G.gold-=25;takeItem(id);wz.learned.push(sp);renderMenu();hud();alertMenu(`The ${wz.name} copies ${SPELLS[sp].name} into the spellbook. It's theirs to cast now.`);});}
      if(id==="poisonvial")for(const h of G.party.filter(h=>!h.dead&&!h.down&&h.id!=="beast"))btn(`COAT: ${h.name.toUpperCase()}`,()=>{takeItem(id);h.coat={name:"poison",type:"poison",dice:"2d4"};renderMenu();alertMenu(`The ${h.name}'s weapon is coated in poison for one attack.`);},!!h.coat);
      if(id==="scroll_revivify")for(const h of G.party.filter(q=>q.dead&&q.id!=="beast"))btn(`READ ON: ${h.name.toUpperCase()}`,()=>{takeItem(id);revive(h,"a Scroll of Revivify");renderMenu();});
      if(id==="scroll_cure"&&isKnown(id))for(const h of G.party)btn(`READ ON: ${h.name.toUpperCase()}`,()=>{takeItem(id);heal(h,roll("2d8+3").total);renderMenu();hud();},h.hp>=h.maxHp);
      if(id==="antitoxin")for(const h of G.party)if(h.st.poisoned)btn(`GIVE: ${h.name.toUpperCase()}`,()=>{takeItem(id);delete h.st.poisoned;renderMenu();hud();});
      if(id==="shield")for(const h of G.party.filter(q=>q.shieldBroken&&!q.dead))btn(`STRAP ON: ${h.name.toUpperCase()}`,()=>{strapShield(h);renderMenu();});
      if(id==="almanac")btn("READ IT",()=>{const t=readAlmanac();renderMenu();if(t)alertMenu(t);});
      if(id==="torch")btn("PLACE HERE",()=>{takeItem(id);const L=G.party[0];G.dropLights.push({x:L.x,y:L.y});fov();renderMenu();});
      d.appendChild(acts);el.appendChild(d);}}
  if(G&&G.seed!==undefined)el.insertAdjacentHTML("beforeend",`<p class="sm">Dungeon seed: ${G.seed} (type it on the town screen to replay this dungeon)</p>`);
  if(menuTab==="notes"){const ns=(G.notes||[]).slice().reverse();el.insertAdjacentHTML("beforeend",`<p class="help">Everything you've been told on this run, newest first.</p>`);
    if(!ns.length)el.insertAdjacentHTML("beforeend","<p class='help'>Nothing yet.</p>");let fl=null;
    for(const n of ns){if(n.f!==fl){fl=n.f;el.insertAdjacentHTML("beforeend",`<h3>FLOOR ${n.f}</h3>`);}el.insertAdjacentHTML("beforeend",`<p class="note">${esc(n.t)}</p>`);}}
  if(menuTab==="rest"){const fat=G.fatigue>=6?"Weary: everyone gains exhaustion as you push on":G.fatigue>=3?"Tired: you can make camp":"Fresh";
    const ex=G.party.filter(h=>!h.dead&&h.exh).map(h=>`${esc(h.name)} ${h.exh}`).join(", ");
    el.insertAdjacentHTML("beforeend",`<p><b>Fatigue:</b> ${S.rules.fatigue?fat:"off in settings"} · <b>Exhaustion:</b> ${ex||"none"}</p>
      <p><b>Supplies:</b> ${G.bag.ration||0} rations · ${G.bag.firewood||0} firewood · lantern ${G.light&&G.fuel>0?Math.ceil(G.fuel/FUEL_MAX*100)+"% oil":"off"} · ${G.bag.oil||0} oil flasks</p>
      <p class="help"><b>Short rest</b> (2 between long rests): spend Hit Dice to heal, recharge short-rest skills. <b>Long rest</b> (only when Tired): eat a ration, then either a <b>fire camp</b> (needs firewood: full HP, half your Hit Dice back, −1 exhaustion, but the fire draws monsters) or a <b>cold camp</b> (safer, but HP only back to half and no Hit Dice or exhaustion recovered; two cold nights in a row cause exhaustion). Pick a watch: their Passive Perception decides if an ambush is spotted. On a cleared floor nobody comes. The ladder down is always safe.</p>
      <p class="help"><b>Exhaustion:</b> each level is −1 to every d20 roll (only half that on skills and saves you're proficient in) and −1 square of speed. You can't rest again straight after resting. Level 6 is death. A fed fire camp removes one level.</p>`);
    const mk=(t,sub,f,dis)=>{const b=document.createElement("button");b.type="button";b.className="big";b.innerHTML=`${t}<br><small>${sub}</small>`;b.disabled=!!dis;b.addEventListener("click",f);el.appendChild(b);};
    const cl=floorCleared();
    mk("SHORT REST",`${maxShort()-G.shortRests} left · ${cl?"floor cleared: safe":"ambush risk "+Math.round(campRisk("short")*100)+"%"+(doorSafety().why?" ("+doorSafety().why+")":"")}`,()=>doRest(false),G.shortRests>=maxShort()||restTooSoon(false)>0);
    mk("MAKE CAMP (LONG REST)",`${S.rules.fatigue&&G.fatigue<3?"Only when Tired":cl?"Floor cleared: safe":"Fire "+Math.round(campRisk("fire")*100)+"% / cold "+Math.round(campRisk("cold")*100)+"% ambush risk"}`,()=>doRest(true),S.rules.fatigue&&G.fatigue<3||restTooSoon(true)>0);}}
function alertMenu(t){const el=$("menuBody");el.querySelectorAll(".msg").forEach(m=>m.remove());el.insertAdjacentHTML("afterbegin",`<p class="msg">${esc(t)}</p>`);}
function drawIconTo(canvas,id){const c2=canvas.getContext("2d");if(id==="potion"||id==="gpotion"){c2.drawImage(monSpr("potion",id==="gpotion"?{r:"#4a7ae0",R:"#2a4aa0"}:null),0,0);return;}drawIconBase(c2,id);}
function drawIconBase(c,id){const sx=0,sy=0;const it=ITEMS[id]||{};
  if(id==="key"){c.fillStyle="#d8b040";c.fillRect(3,6,4,4);c.fillRect(7,7,7,2);c.fillRect(11,9,1,2);c.fillRect(13,9,1,2);c.fillStyle="#3c3446";c.fillRect(4,7,2,2);return;}
  if(id==="torch"){c.fillStyle="#7a4e2a";c.fillRect(7,6,2,8);c.fillStyle="#ff8a30";c.fillRect(6,2,4,5);c.fillStyle="#ffe070";c.fillRect(7,4,2,2);return;}
  if(id==="oil"){c.fillStyle="#3c3446";c.fillRect(6,3,4,2);c.fillStyle="#5a5070";c.fillRect(4,5,8,9);c.fillStyle="#8a80a0";c.fillRect(5,6,2,4);return;}
  if(id.startsWith("scroll")){c.fillStyle="#e8dcb8";c.fillRect(3,4,10,8);c.fillStyle="#c0a878";c.fillRect(2,3,2,10);c.fillRect(12,3,2,10);c.fillStyle="#8a6a4a";for(let i=0;i<3;i++)c.fillRect(5,6+i*2,6,1);return;}
  if(id==="antitoxin"){c.fillStyle="#3c3446";c.fillRect(6,2,4,2);c.fillStyle="#6ad04a";c.fillRect(5,4,6,10);c.fillStyle="#c8f8a0";c.fillRect(6,5,1,5);return;}
  if(it.kind==="gear"){c.fillStyle="#3c3446";c.fillRect(3,3,10,10);c.fillStyle="#d8b040";c.fillRect(4,4,8,8);c.fillStyle="#7af0ff";c.fillRect(6,6,4,4);return;}
  if(id==="ration"){c.fillStyle="#3c2a1c";c.fillRect(3,6,10,7);c.fillStyle="#8a6a3a";c.fillRect(4,7,8,5);c.fillStyle="#c8a060";c.fillRect(5,4,6,3);c.fillStyle="#e8d0a0";c.fillRect(6,5,2,1);return;}
  if(id==="firewood"){c.fillStyle="#2a1a10";c.fillRect(2,9,12,4);c.fillRect(3,5,10,4);c.fillStyle="#7a5232";c.fillRect(3,10,10,2);c.fillRect(4,6,8,2);c.fillStyle="#b08050";c.fillRect(3,10,1,2);c.fillRect(4,6,1,2);return;}
  c.fillStyle="#d8b040";c.fillRect(5,5,6,6);}
function drawWood(sx,sy){sx=Math.round(sx);sy=Math.round(sy);const K="#1a120c";ctx.fillStyle=K;ctx.fillRect(sx+1,sy+7,14,8);ctx.fillRect(sx+3,sy+4,10,4);
  ctx.fillStyle="#5a3c24";ctx.fillRect(sx+2,sy+8,12,2);ctx.fillRect(sx+2,sy+11,12,3);ctx.fillRect(sx+4,sy+5,8,2);ctx.fillStyle="#8a6038";ctx.fillRect(sx+2,sy+8,12,1);ctx.fillRect(sx+2,sy+11,12,1);ctx.fillRect(sx+4,sy+5,8,1);
  ctx.fillStyle="#c09060";ctx.fillRect(sx+2,sy+8,1,2);ctx.fillRect(sx+2,sy+11,1,3);ctx.fillRect(sx+4,sy+5,1,2);ctx.fillStyle="#3a2616";ctx.fillRect(sx+7,sy+12,1,2);ctx.fillRect(sx+10,sy+9,1,1);}
// ---------- shop ----------
let shopObj=null;
function openShop(o){shopObj=o;renderShop();show("ovShop");}
function renderShop(){const el=$("shopBody");el.innerHTML=`<p>"Lamp oil, rope, bombs? Ah, no bombs. Take a look!" · You have <b>${G.gold}</b> gold.</p><h3>BUY</h3>`;
  const row=(id,price,label,f,dis)=>{const it=ITEMS[id];const d=document.createElement("div");d.className="item";const ic=document.createElement("canvas");ic.width=ic.height=16;d.appendChild(ic);drawIconTo(ic,id);
    d.insertAdjacentHTML("beforeend",`<div><b>${esc(label.startsWith("BUY")?it.name:itemName(id))}</b><br><span class="sm">${esc(label.startsWith("BUY")?it.desc:itemDesc(id))}</span></div>`);const b=document.createElement("button");b.type="button";b.className="chip";b.textContent=`${label} ${price}g`;b.disabled=!!dis;b.addEventListener("click",f);d.appendChild(b);el.appendChild(d);};
  if(shopObj.haggleMsg)el.insertAdjacentHTML("beforeend",`<p class="help">${esc(shopObj.haggleMsg)}</p>`);
  else{const hb=document.createElement("button");hb.type="button";hb.className="chip";hb.textContent=`HAGGLE · ${oddsTag(bestAt("persuasion"),"persuasion",13)}`;hb.addEventListener("click",()=>haggle());el.appendChild(hb);}
  shopObj.stock.forEach((id,i)=>{const pr=shopPrice(id);row(id,pr,id==="arrows"?"BUY 10":"BUY",()=>{G.gold-=pr;addItem(id,id==="arrows"?10:1);G.known.add(id);shopObj.stock.splice(i,1);renderShop();hud();},G.gold<pr||(id==="shield"&&(G.bag.shield||0)>=1));});
  el.insertAdjacentHTML("beforeend","<h3>SELL</h3>");const ids=Object.keys(G.bag).filter(id=>ITEMS[id].price>0);if(!ids.length)el.insertAdjacentHTML("beforeend","<p class='help'>Nothing to sell.</p>");
  for(const id of ids){const p=Math.floor(ITEMS[id].price/2);row(id,p,`SELL (${G.bag[id]})`,()=>{takeItem(id);G.gold+=p;shopObj.stock.push(id);renderShop();hud();});
    if(!isKnown(id))row(id,20,"IDENTIFY",()=>{G.gold-=20;G.known.add(id);renderShop();hud();},G.gold<20);}}
// ---------- settings ----------
const DFIELDS=[["width","Map width",34,80],["height","Map height",26,60],["rooms","Rooms per floor",4,20],["monsters","Monsters on floor 1",0,30],["monstersPerFloor","Extra monsters each floor",0,10],
  ["potions","Potions lying around",0,10],["gold","Gold piles per floor",0,20],["traps","Traps per floor",0,20],["hazards","Hazards (0–3)",0,3],["floors","Floors to win",1,20],["sight","How far you can see",3,12],["party","Max party size",1,4]];
const RFIELDS=[["deathSaves","Death saves and permanent death","Downed heroes roll each turn: 3 failures and they're gone for good."],["autoReact","Automatic reactions","Shield, Uncanny Dodge, Protect, opportunity attacks and the like fire on their own. Untick to be asked each time."],["darkness","Darkness","Unlit areas hide things and give disadvantage to attacks against targets in the dark."],["fatigue","Fatigue","Fights and walking tire the party. Long rests need you to be Tired."]];
const CCOLS=[["name","NAME","t"],["str","STR","n",3,20],["dex","DEX","n",3,20],["con","CON","n",3,20],["int","INT","n",3,20],["wis","WIS","n",3,20],["cha","CHA","n",3,20],["ac","AC","n",5,25],["hd","HIT DIE","n",4,12],["dmg","DAMAGE","dc"],["range","RANGE","n",1,12],["speed","SPEED","n",3,12]];
const MCOLS=[["name","NAME","t"],["hp","HP","n",1,500],["ac","AC","n",1,30],["hit","HIT","n",-5,20],["dmg","DAMAGE","dc"],["range","RANGE","n",1,12],["speed","SPEED","n",1,12],["xp","XP","n",0,999],["from","FROM","n",1,20]];
function inp(id,val,kind){return `<input id="${id}" class="${kind}" type="${kind==="n"?"number":"text"}" ${kind==="n"?'inputmode="numeric"':""} value="${esc(val)}">`;}
function buildSettings(){
  $("setDungeon").innerHTML=DFIELDS.map(([k,l])=>`<label for="sd-${k}">${l}${inp("sd-"+k,S.dungeon[k],"n")}</label>`).join("");
  $("setRules").innerHTML=RFIELDS.map(([k,l,h])=>`<label class="chk" for="sr-${k}"><input type="checkbox" id="sr-${k}" ${S.rules[k]?"checked":""}><span><b>${l}</b><br><small>${h}</small></span></label>`).join("");
  $("setClasses").innerHTML=`<tr>${CCOLS.map(c=>`<th>${c[1]}</th>`).join("")}</tr>`+S.classes.map((c,i)=>`<tr>${CCOLS.map(([k,,kind])=>`<td>${inp(`sc-${i}-${k}`,c[k],kind)}</td>`).join("")}</tr>`).join("");
  const rows=S.monsters.map((m,i)=>`<tr>${MCOLS.map(([k,,kind])=>`<td>${inp(`sm-${i}-${k}`,m[k],kind)}</td>`).join("")}</tr>`).join("");
  const boss=`<tr>${MCOLS.map(([k,,kind])=>k==="from"?`<td><span class="tag">BOSS</span></td>`:`<td>${inp(`sb-${k}`,S.boss[k],kind)}</td>`).join("")}</tr>`;
  $("setMonsters").innerHTML=`<tr>${MCOLS.map(c=>`<th>${c[1]}</th>`).join("")}</tr>`+rows+boss;$("setMsg").textContent="";}
function readSettings(){const ns=clone(S);let errs=0;
  const num=(id,lo,hi)=>{const el=$(id);let v=parseInt(el.value,10);if(isNaN(v)){el.classList.add("err");errs++;return lo;}el.classList.remove("err");v=Math.max(lo,Math.min(hi,v));el.value=v;return v;};
  const txt=id=>{const el=$(id);const v=el.value.trim().slice(0,20);if(!v){el.classList.add("err");errs++;}else el.classList.remove("err");return v||"?";};
  const dice=id=>{const el=$(id);const v=el.value.trim();if(!validDice(v)){el.classList.add("err");errs++;return "1d4";}el.classList.remove("err");return v;};
  for(const [k,,lo,hi] of DFIELDS)ns.dungeon[k]=num("sd-"+k,lo,hi);for(const [k] of RFIELDS)ns.rules[k]=$("sr-"+k).checked;
  const read=(obj,prefix,cols)=>{for(const [k,,kind,lo,hi] of cols){if(kind==="n")obj[k]=num(prefix+k,lo,hi);else if(kind==="dc")obj[k]=dice(prefix+k);else obj[k]=txt(prefix+k);}};
  ns.classes.forEach((c,i)=>read(c,`sc-${i}-`,CCOLS));ns.monsters.forEach((m,i)=>read(m,`sm-${i}-`,MCOLS));read(ns.boss,"sb-",MCOLS.filter(c=>c[0]!=="from"));
  return errs?null:ns;}

// every message shown outside combat is kept in the NOTES tab, so nothing you learn is lost
function note(text){if(!G||G.demo||mode==="combat"||!text)return;G.notes=G.notes||[];const last=G.notes[G.notes.length-1];if(last&&last.t===text)return;G.notes.push({f:G.floor,t:text});if(G.notes.length>200)G.notes.shift();}
const BUMP_NAME={barrel:"A barrel",chest:"A chest",shrine:"A shrine",runes:"A rune stone",merchant:"A merchant",wood:"A wooden barricade",captive:"A captive",relic:"The relic",coffer:"A coffer",rubble:"Fallen rock",cavein:"A cave-in",furniture:"Old furniture",alchemy:"An alchemy bench"};

// a short "you could interact with this" hint: the text plus a little A button symbol, and the real A button glows
function hintA(text){if(mode==="combat")return;toast(text);const t=$("tText");if(t&&!t.querySelector(".abadge"))t.insertAdjacentHTML("beforeend",' <span class="abadge">A</span>');
  const k=$("kA");if(k){k.classList.remove("glow");void k.offsetWidth;k.classList.add("glow");}}

// ---------- the map: everything you've explored on this floor ----------
function openMap(){if(!G||G.demo||mode!=="explore"||busy)return;const cv=$("mapCv");const S2=Math.max(3,Math.min(8,Math.floor(Math.min(innerWidth-48,560)/G.W)));cv.width=G.W*S2;cv.height=G.H*S2;const x=cv.getContext("2d");
  x.fillStyle="#0a0810";x.fillRect(0,0,cv.width,cv.height);const P={floor:"#8c8070",wall:"#3c3646",water:"#3a6ab0",deep:"#24467a",rubble:"#6a5a48",acid:"#7ab040",oil:"#4a3a2a",crack:"#8c8070"};
  for(let y=0;y<G.H;y++)for(let X=0;X<G.W;X++){if(!G.explored[y][X])continue;let c;
    if(isWall(X,y)){const nearFloor=DIRS8.some(([a,b])=>inB(X+a,y+b)&&!isWall(X+a,y+b)&&G.explored[y+b][X+a]);if(!nearFloor)continue;c=P.wall;}
    else{const g=gnd(X,y);c=g===GROUND.water?P.water:g===GROUND.deep?P.deep:g===GROUND.rubble?P.rubble:g===GROUND.acid?P.acid:g===GROUND.oil?P.oil:P.floor;}
    x.fillStyle=c;x.fillRect(X*S2,y*S2,S2,S2);}
  const dot=(X,y,c,r)=>{x.fillStyle=c;x.fillRect(X*S2+(S2-r)/2,y*S2+(S2-r)/2,r,r);};
  for(const o of G.objs){if(o.gone||!G.explored[o.y][o.x])continue;if(o.type==="door")dot(o.x,o.y,o.locked?"#c0a040":o.open?"#7a5030":"#b07040",S2);else if(o.type==="chest"&&!o.opened)dot(o.x,o.y,"#f0c040",S2-1);else if(o.type==="shrine")dot(o.x,o.y,"#a0e0ff",S2-1);else if(o.type==="merchant")dot(o.x,o.y,"#e0a0ff",S2-1);}
  for(const t of G.traps)if((t.found||t.done)&&G.explored[t.y][t.x])dot(t.x,t.y,t.done||t.disarmed?"#7a4a4a":"#ff4040",Math.max(2,S2-2));
  for(const t of G.torches)if(G.explored[t.y][t.x]&&!t.out)dot(t.x,t.y,"#ffb040",Math.max(2,S2-3));
  const st=G.stairs;if(st&&G.explored[st.y][st.x]){x.fillStyle="#fff";x.fillRect(st.x*S2-1,st.y*S2-1,S2+2,S2+2);dot(st.x,st.y,"#40d0a0",S2);}
  for(const m of G.mons)if(m.hp>0&&seen(m.x,m.y)&&!isHiddenMon(m))dot(m.x,m.y,m.peace?"#c0c0c0":"#ff6060",S2);
  G.party.forEach((h,i)=>{if(!h.dead)dot(h.x,h.y,i===0?"#ffffff":"#f0e080",S2);});
  $("mapTitle").textContent=`MAP · FLOOR ${G.floor}`;$("mapKey").innerHTML='<span style="color:#fff">■</span> leader &nbsp;<span style="color:#f0e080">■</span> party &nbsp;<span style="color:#40d0a0">■</span> ladder down &nbsp;<span style="color:#b07040">■</span> door &nbsp;<span style="color:#f0c040">■</span> chest &nbsp;<span style="color:#ffb040">■</span> torch &nbsp;<span style="color:#ff4040">■</span> trap &nbsp;<span style="color:#ff6060">■</span> enemy in sight';
  show("ovMap");}
