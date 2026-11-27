// ===== JRPG-style shaded characters (16×28 canvas, ~10px wide figures) =====
// Each character is built from shaded body parts (ellipses and cylinders lit from the top-left),
// coloured with hue-shifted ramps (warm highlights, purple shadows) and given coloured outlines.
const C2W=16,C2H=28;
function hx2hsl(hex){const n=parseInt(hex.slice(1),16);let r=(n>>16&255)/255,g=(n>>8&255)/255,b=(n&255)/255;const mx=Math.max(r,g,b),mn=Math.min(r,g,b);let h=0,s=0,l=(mx+mn)/2;
  if(mx!==mn){const d=mx-mn;s=l>.5?d/(2-mx-mn):d/(mx+mn);h=mx===r?(g-b)/d+(g<b?6:0):mx===g?(b-r)/d+2:(r-g)/d+4;h*=60;}return [h,s,l];}
function hsl2hx(h,s,l){s=Math.max(0,Math.min(1,s));l=Math.max(0,Math.min(1,l));const k=n=>(n+h/30)%12,a=s*Math.min(l,1-l),f=n=>l-a*Math.max(-1,Math.min(k(n)-3,Math.min(9-k(n),1)));
  return "#"+[f(0),f(8),f(4)].map(v=>Math.round(v*255).toString(16).padStart(2,"0")).join("");}
const RAMPS={};
function ramp2(hex){if(RAMPS[hex])return RAMPS[hex];const [h,s,l]=hx2hsl(hex);const tw=(t,a)=>{const d=((t-h+540)%360)-180;return (h+d*a+360)%360;};
  return RAMPS[hex]=[hsl2hx(tw(262,.3),s+.06,l-.3),hsl2hx(tw(262,.15),s+.04,l-.15),hex,hsl2hx(tw(52,.12),s-.03,l+.11),hsl2hx(tw(52,.2),s-.08,l+.21),hsl2hx(tw(262,.35),s+.05,Math.max(.05,l-.45))];}
function shadeT(nx,ny,bias){const nz=Math.sqrt(Math.max(0,1-nx*nx-ny*ny));const d=nx*-.52+ny*-.58+nz*.63+(bias||0);return d>.8?4:d>.52?3:d>.2?2:d>-.08?1:0;}
function P2(w,h){w=w||C2W;h=h||C2H;return {px:Array.from({length:h},()=>Array(w).fill(null)),z:0,w,h};}
function put2(P,x,y,c,t,z){x=Math.floor(x);y=Math.floor(y);if(x<0||y<0||x>=P.w||y>=P.h)return;P.px[y][x]={c,t:Math.max(0,Math.min(4,t)),z};}
function ell2(P,cx,cy,rx,ry,c,o){o=o||{};const z=++P.z;for(let y=Math.floor(cy-ry);y<=Math.ceil(cy+ry);y++)for(let x=Math.floor(cx-rx);x<=Math.ceil(cx+rx);x++){
    const nx=(x+.5-cx)/rx,ny=(y+.5-cy)/ry;if(nx*nx+ny*ny>1||(o.clip&&!o.clip(x,y)))continue;put2(P,x,y,c,shadeT(nx*.85,ny*.85,o.bias),z);}}
function cyl2(P,x0,y0,w,h,c,o){o=o||{};const z=++P.z;for(let y=y0;y<y0+h;y++){const wi=o.taper?w+Math.round((y-y0)/(h-1||1)*o.taper):w;const xs=x0-(wi-w)/2;
    for(let x=Math.floor(xs);x<Math.floor(xs)+wi;x++){if(o.round&&(y===y0||y===y0+h-1)&&(x===Math.floor(xs)||x===Math.floor(xs)+wi-1))continue;if(o.clip&&!o.clip(x,y))continue;
      const nx=((x+.5)-(xs+wi/2))/(wi/2)*.92,ny=o.flat?-.1:-.35+(y-y0)/h*.7;put2(P,x,y,c,shadeT(nx,ny*.6,o.bias),z);}}}
function px2(P,x,y,col){put2(P,x,y,"="+col,2,999);}
function render2(P){const C2W=P.w,C2H=P.h;const cv=document.createElement("canvas");cv.width=C2W;cv.height=C2H;const g=cv.getContext("2d");const A=P.px;
  // inner separation: a pixel touching a part drawn in front of it gets darker, so parts read clearly
  const T=A.map(r=>r.map(p=>p&&p.t));
  for(let y=0;y<C2H;y++)for(let x=0;x<C2W;x++){const p=A[y][x];if(!p||p.c[0]==="=")continue;
    for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const q=A[y+dy]&&A[y+dy][x+dx];if(q&&q.c[0]!=="="&&q.z>p.z+1&&q.c!==p.c&&!q.noSep){T[y][x]=Math.min(T[y][x],dy<0?0:1);break;}}}
  for(let y=0;y<C2H;y++)for(let x=0;x<C2W;x++){const p=A[y][x];if(!p)continue;g.fillStyle=p.c[0]==="="?p.c.slice(1):ramp2(p.c)[T[y][x]];g.fillRect(x,y,1,1);}
  // coloured outline around the silhouette
  for(let y=0;y<C2H;y++)for(let x=0;x<C2W;x++){if(A[y][x])continue;let n=null;
    for(const [dx,dy] of [[0,1],[0,-1],[1,0],[-1,0]]){const q=A[y+dy]&&A[y+dy][x+dx];if(q){n=q;break;}}
    if(n){g.fillStyle=n.c[0]==="="?"#1c1420":ramp2(n.c)[5];g.fillRect(x,y,1,1);}}
  return cv;}
// ---------- character designs ----------
const LOOKS={
  fighter:{skin:"#f0c098",hair:"#7a4a26",hs:"short",eye:"#3a5aa0",top:"#3a5a9a",arm:"#3a5a9a",plate:"#7c889c",legs:"#4a3a34",boots:"#6a4228",cape:"#b03a34",belt:"#5a3420",wpn:"sword"},
  barbarian:{skin:"#d89868",hair:"#d0582a",hs:"wild",eye:"#5a8a3a",top:"#9a7448",fur:"#a89068",armSkin:1,legs:"#6a4a30",boots:"#5a3a22",belt:"#4a2e1a",wpn:"axe"},
  rogue:{skin:"#ecc0a0",hair:"#3a3048",hs:"short",hood:"#4a3e5a",eye:"#5a7aa8",top:"#3e3448",arm:"#3e3448",legs:"#2e2a36",boots:"#3a2a24",belt:"#6a2a3a",scarf:"#7a2a3e",wpn:"dagger"},
  ranger:{skin:"#e8b890",hair:"#8a5a2a",hs:"short",hood:"#4a7a3a",eye:"#3a7a4a",top:"#7a5a3a",arm:"#4a7a3a",legs:"#5a4a32",boots:"#5a3a22",belt:"#4a3020",cape:"#3e6a32",wpn:"bow"},
  wizard:{skin:"#f0c8a8",hair:"#c8ccd8",hs:"long",hat:"#3a3a8a",eye:"#4a6ad0",robe:"#3e3e92",arm:"#3e3e92",trim:"#e0b848",boots:"#3a2a40",belt:"#e0b848",wpn:"staff",orb:"#7ad8ff"},
  cleric:{skin:"#f4cca8",hair:"#e8c058",hs:"long",circlet:"#e8c048",eye:"#3a7ab0",robe:"#d2c4a4",arm:"#d2c4a4",trim:"#c89430",boots:"#7a5a3a",belt:"#d0a038",wpn:"mace",tabard:"#c04a4a"},
  druid:{skin:"#e8b888",hair:"#b0582e",hs:"long",leaves:"#6aa040",eye:"#4a8a3a",robe:"#6a7a3a",arm:"#6a7a3a",trim:"#b08a4a",boots:"#5a3e24",belt:"#8a6a3a",wpn:"branch"},
  merchant:{skin:"#e8b890",hair:"#5a3a2a",hs:"short",turban:"#8a3a7a",eye:"#3a3a3a",robe:"#c87a30",arm:"#c87a30",trim:"#f0d070",boots:"#5a3a22",belt:"#6a2a5a"},
  orc:{skin:"#7a9a4a",hair:"#201a1a",hs:"topknot",eye:"#e04020",top:"#6a4a30",arm:"skin",plate:"#7a7068",legs:"#4a3a2a",boots:"#3a2a1a",belt:"#3a2418",tusks:1,brow:1,wpn:"axe"},
  skeleton:{bone:1,skin:"#dcd4bc",eye:"#ff5030",top:"#5a4e44",plate:"#7a6a5a",legs:"bone",boots:"#5a4a3a",belt:"#4a3a2a",wpn:"sword"},
  bonearcher:{bone:1,skin:"#d4ccb2",eye:"#60d0ff",hood:"#4a3a32",top:"#4a3a32",legs:"bone",boots:"#5a4a3a",belt:"#4a3a2a",wpn:"bow"}
};
const RACE_LOOK={tiefling:{skin:"#c8685e",eye:"#ffd040"},halforc:{skin:"#98a878"},elf:{},dwarf:{},halfling:{}};
function drawChar2(key,dir,frame,race){const base=LOOKS[key]||LOOKS.fighter;if(base.small)return drawSmall2(key,dir,frame);
  if(race&&RACE_LOOK[race]){const L2=Object.assign({},base,RACE_LOOK[race]);const RL="__r";LOOKS[RL]=L2;const cv=drawChar2Inner(RL,dir,frame,race);delete LOOKS[RL];return raceShape(cv,race);}
  return drawChar2Inner(key,dir,frame,"");}
// shorter folk: drop a few body rows so dwarves and halflings stand lower
function raceShape(cv,race){const drop=race==="dwarf"?[15,16]:race==="halfling"?[15,16,22,6]:[];if(!drop.length)return cv;
  const out=document.createElement("canvas");out.width=cv.width;out.height=cv.height;const g=out.getContext("2d");let dy=cv.height-1;
  for(let y=cv.height-1;y>=0;y--){if(drop.includes(y))continue;g.drawImage(cv,0,y,cv.width,1,0,dy,cv.width,1);dy--;}return out;}
function drawChar2Inner(key,dir,frame,race){const L=LOOKS[key]||LOOKS.fighter;const P=P2();frame=frame||0;const side=dir==="s",back=dir==="b";
  const bob=0,hx=8,hy=8+bob;const skin=L.skin;const bone=!!L.bone;
  const step=frame===1?1:frame===2?-1:0;
  const robe=L.robe;const topc=L.top||L.robe;const armc=L.arm==="skin"||L.armSkin?skin:(L.arm||topc);
  // --- back layer: cape / long hair behind body / bow on back ---
  if(L.cape&&!side)cyl2(P,4,13,8,back?11:10,L.cape,{taper:2,bias:-.15});
  if(L.cape&&side)cyl2(P,4,13,3,10,L.cape,{taper:1,bias:-.2});
  if(L.hs==="long"&&!L.hat&&!L.hood)cyl2(P,back?4:4,9,8,back?9:8,L.hair,{taper:1,bias:.05});
  if(L.hs==="long"&&L.hat)cyl2(P,4,9,8,7,L.hair,{taper:1});
  if(L.wpn==="bow"&&(back||side)){for(let i=0;i<11;i++){const x=back?3+i*.85:3+Math.round(Math.sin(i/10*Math.PI)*-2)+1,y=back?11+i:12+i;put2(P,x,y,"#8a5a2a",2,++P.z);}}
  if(L.wpn==="axe"&&back){cyl2(P,11,7,1,14,"#6a4a2a",{});const z=++P.z;for(const [a,b,t] of [[1,7,3],[1,8,2],[2,8,2],[1,9,1],[2,9,1],[-1,8,2]])put2(P,11+a,b,"#9aa4b4",t,z);}
  if(race==="tiefling"){const z=++P.z;const tail=side?[[4,20],[3,21],[2,22],[2,23],[1,24],[1,23]]:back?[[8,20],[9,21],[10,22],[11,23],[12,24],[13,23],[12,25]]:[[12,22],[13,23],[13,24],[14,25]];for(const [x,y] of tail)put2(P,x,y,"#a04a48",2,z);}
  // --- legs & boots ---
  const legc=L.legs==="bone"?skin:(L.legs||L.robe||topc);
  if(!robe){
    if(side){const a=step,bk=-step;cyl2(P,6+bk,20,2,5,legc,{bias:-.25});cyl2(P,5+bk,24,3,3,L.boots,{round:1,bias:-.25});
      cyl2(P,8+a,20,2,5,legc,{});cyl2(P,8+a,24,3,3,L.boots,{round:1});}
    else{const lu=step>0?1:0,ru=step<0?1:0;
      cyl2(P,5,20,3,5-lu,legc,{});cyl2(P,8,20,3,5-ru,legc,{});
      cyl2(P,5,24-lu,3,3,L.boots,{round:1});cyl2(P,8,24-ru,3,3,L.boots,{round:1});
      if(bone){for(const x of [5,7,8,10])for(let y=21;y<24;y++)P.px[y][x]=null;}}}
  else{ // robes: a flared skirt to the ankles, feet peeking out
    if(side){cyl2(P,5+(step>0?1:0),25,3,2,L.boots,{round:1});cyl2(P,8+(step<0?-1:0),25,3,2,L.boots,{round:1});cyl2(P,5,19,6,7,robe,{taper:2});}
    else{cyl2(P,5-(step>0?0:0),25-(step>0?1:0),3,2,L.boots,{round:1});cyl2(P,8,25-(step<0?1:0),3,2,L.boots,{round:1});cyl2(P,5,19,6,7,robe,{taper:3});
      if(L.trim){for(let x=3;x<13;x++)if(P.px[25][x])put2(P,x,25,L.trim,3,P.z);}}}
  // --- torso ---
  const tw=side?5:6,tx=side?5:5;
  cyl2(P,tx,13,tw,7,bone?"#bcb4a0":topc,{round:1});
  if(bone&&!L.hood){for(let y=14;y<19;y+=2)for(let x=tx+1;x<tx+tw-1;x++)put2(P,x,y,"=#4a4040",0,P.z);}
  if(L.plate&&!side){cyl2(P,5,13,6,4,L.plate,{round:1,bias:.1});}
  if(L.plate&&side){cyl2(P,6,13,4,4,L.plate,{round:1,bias:.1});}
  if(L.tabard&&!back){cyl2(P,7,14,2,10,L.tabard,{flat:1});}
  if(L.fur){ell2(P,8,13.5,side?3.2:4.4,2.2,L.fur,{bias:.1});}
  if(L.scarf&&!back){cyl2(P,5,12,6,2,L.scarf,{round:1});if(!side)cyl2(P,9,13,2,3,L.scarf,{});}
  if(L.belt){const y=19;for(let x=tx;x<tx+tw;x++)if(P.px[y][x])put2(P,x,y,L.belt,1,++P.z);if(!back&&!side&&!robe)put2(P,8,19,"#e8c050",3,P.z);if(!back&&!side&&robe&&L.trim)put2(P,8,19,L.trim,4,P.z);}
  // --- arms ---
  const swing=step;
  if(side){cyl2(P,7,14+(swing>0?0:0),2,5,armc,{round:1});ell2(P,8+swing*.6,19.5,1.2,1.2,skin,{});}
  else{cyl2(P,3,14,2,5+(swing>0?0:0),armc,{round:1,bias:.05});cyl2(P,11,14,2,5,armc,{round:1,bias:-.1});
    ell2(P,4,19.4-(swing>0?1:0),1.1,1.1,skin,{});ell2(P,12,19.4-(swing<0?1:0),1.1,1.1,skin,{});
    if(L.plate&&!bone){ell2(P,4,14,1.8,1.6,L.plate,{bias:.1});ell2(P,12,14,1.8,1.6,L.plate,{bias:.1});}
    if(L.fur){ell2(P,4,14,1.6,1.4,L.fur,{});ell2(P,12,14,1.6,1.4,L.fur,{});}}
  // --- head ---
  const face=(x,y)=>true;
  ell2(P,side?8.6:hx,hy+.5,side?3.9:4.1,4.2,skin,{bias:.08});
  if(!back){ // face details
    if(side){if(!bone){px2(P,10,9,"#20182a");px2(P,10,10,L.eye);put2(P,11,10,skin,2,P.z+5);px2(P,9,11,ramp2(skin)[1]);}else{px2(P,9,9,"#20182a");px2(P,10,9,"#20182a");px2(P,10,10,L.eye);px2(P,10,12,"#5a5048");}}
    else if(bone){px2(P,6,9,"#20182a");px2(P,6,10,"#20182a");px2(P,9,9,"#20182a");px2(P,9,10,"#20182a");px2(P,7,10,L.eye);px2(P,10,10,L.eye);px2(P,8,11,"#3a3030");for(let x=6;x<11;x+=2)px2(P,x,12,"#5a5048");}
    else{px2(P,6,9,"#20182a");px2(P,6,10,L.eye);px2(P,10,9,"#20182a");px2(P,10,10,L.eye);px2(P,5,11,ramp2("#e88a7a")[2]);px2(P,11,11,ramp2("#e88a7a")[2]);
      if(L.tusks){px2(P,6,12,"#f0ead0");px2(P,10,12,"#f0ead0");}
      if(L.brow){px2(P,5,8,"#2a2a1a");px2(P,6,8,"#2a2a1a");px2(P,10,8,"#2a2a1a");px2(P,11,8,"#2a2a1a");}}}
  // --- hair ---
  const H=L.hair;
  if(H&&!L.hood){const top=hy-1.2;
    if(back){ell2(P,hx,hy,4.5,4.6,H,{bias:.05});}
    else if(side){ell2(P,7.6,top+.6,4.3,3.6,H,{clip:(x,y)=>y<=hy-1||x<=8});ell2(P,6.6,hy+1,2.3,3.2,H,{});}
    else{ell2(P,hx,top,4.6,3.7,H,{clip:(x,y)=>y<=hy-2||x<=4||x>=11});
      for(const [x,y] of [[5,hy-1],[7,hy-1],[9,hy-1],[11,hy-1],[4,hy],[12,hy],[4,hy+1],[12,hy+1]])put2(P,x,y,H,1,P.z);}
    if(L.hs==="wild"){for(const [x,y] of (side?[[4,4],[5,3],[7,2],[9,3],[3,7],[3,9]]:[[3,5],[4,3],[6,2],[9,2],[11,3],[12,5],[2,8],[13,8],[3,10],[12,10]]))put2(P,x,y,H,3,P.z);}
    if(L.hs==="topknot"){ell2(P,side?7:hx,2.5,1.4,1.6,H,{});}
    // shine on the hair
    if(!back&&L.hs!=="topknot"){const s=side?[6,5]:[6,5];px2(P,s[0],s[1],ramp2(H)[4]);px2(P,s[0]+1,s[1],ramp2(H)[4]);}}
  if(L.circlet&&!back){for(let x=5;x<12;x++)if(P.px[7][x])put2(P,x,7,L.circlet,3,P.z+1);if(!side)px2(P,8,7,"#7ad8ff");}
  if(L.leaves){for(const [x,y] of (side?[[5,4],[7,3],[9,4],[6,3]]:[[4,5],[5,4],[7,3],[9,3],[11,4],[12,5],[8,3]]))put2(P,x,y,L.leaves,3,P.z+1);px2(P,side?8:8,4,"#e8d070");}
  if(L.hood)hood2(P,L,dir,H);
  if(L.cowboy){const hc=L.cowboy;ell2(P,side?8:hx,hy-1,side?7.2:7.6,1.5,hc,{bias:-.15});cyl2(P,side?5:Math.round(hx-3.5),hy-5,side?6:7,4,hc,{taper:.2});
    for(let x=0;x<16;x++)if(P.px[hy-2]&&P.px[hy-2][x]&&P.px[hy-2][x].c===hc)put2(P,x,hy-2,"#3a2414",3,P.z+1);}
  if(L.hat){const hc=L.hat;ell2(P,side?8:hx,hy-2.5,side?5.6:6.2,1.7,hc,{bias:-.1});
    for(let y=-3;y<5;y++){const w=Math.max(1,Math.round((y+3)*.55)+1);const cx=(side?7:hx)+(y<0?-1-(y+3)*.5:0);cyl2(P,Math.round(cx-w/2),hy-3-(5-y)+1,w,1,hc,{flat:1});}
    for(let x=4;x<13;x++)if(P.px[hy-3]&&P.px[hy-3][x]&&P.px[hy-3][x].c===hc)put2(P,x,hy-3,L.trim||"#e0b848",3,P.z+1);}
  if(L.turban){ell2(P,side?7.6:hx,hy-3.4,4.8,3.2,L.turban,{});px2(P,side?9:8,hy-4,"#f0d070");}
  // --- race features ---
  if(race==="elf"&&!L.hood&&!L.hat){const z=P.z+50;if(side)for(const [x,y,t] of [[5,8,3],[4,7,3],[5,9,2]])put2(P,x,y,skin,t,z);else if(!back||true)for(const [x,y,t] of [[3,9,3],[2,8,3],[13,9,2],[14,8,2]])put2(P,x,y,skin,t,z);}
  if(race==="tiefling"){const z=P.z+50;const hc="#4e3a4c";const pts=side?[[6,4],[5,3],[5,2],[6,1],[9,4],[9,3]]:[[5,4],[4,3],[4,2],[5,1],[11,4],[12,3],[12,2],[11,1]];for(const [x,y] of pts)put2(P,x,y,hc,y<3?3:1,z);
    if(!back)for(const [x,y] of (side?[[10,10]]:[[6,10],[10,10]]))px2(P,x,y,"#ffd040");}
  if(race==="halforc"&&!back){if(side)px2(P,10,12,"#f0ead0");else{px2(P,6,12,"#f0ead0");px2(P,10,12,"#f0ead0");}}
  if(race==="dwarf"&&!back&&L.hair){const bc=L.hair==="#c8ccd8"?L.hair:L.hair;if(side)ell2(P,9.6,12.6,2.2,2.6,bc,{bias:.05});else{ell2(P,8,12.8,3.6,2.8,bc,{bias:.05});px2(P,7,12,ramp2(bc)[0]);px2(P,9,12,ramp2(bc)[0]);}}
  if(race==="halfling"&&!L.hood&&!L.hat&&L.hair){const z=P.z+50;for(const [x,y] of (side?[[4,6],[6,3],[9,3]]:[[3,6],[5,3],[8,2],[11,3],[13,6]]))put2(P,x,y,L.hair,3,z);}
  // --- weapons in front ---
  if(!back){
    if(L.wpn==="sword"){if(side){cyl2(P,4,17,1,6,"#c8d0dc",{});put2(P,3,17,"#8a6a2a",2,++P.z);put2(P,5,17,"#8a6a2a",2,P.z);}else{cyl2(P,2,15,1,9,"#c8d0dc",{bias:.2});put2(P,1,15,"#c09a3a",3,++P.z);put2(P,2,15,"#c09a3a",3,P.z);put2(P,3,15,"#c09a3a",3,P.z);put2(P,2,14,"#6a4a2a",2,P.z);}}
    if(L.wpn==="axe"){const x=side?10:13;cyl2(P,x,9,1,12,"#6a4a2a",{});const z=++P.z;for(const [a,b,t] of [[1,9,3],[1,10,2],[2,10,3],[1,11,2],[2,11,2],[2,12,1],[1,12,1],[1,13,1],[-1,10,2],[-1,11,1]])put2(P,x+a,b,"#9aa4b4",t,z);}
    if(L.wpn==="dagger"){if(side)cyl2(P,10,19,1,3,"#d0d8e0",{});else{cyl2(P,12,19,1,3,"#d0d8e0",{bias:.2});put2(P,12,18,"#6a3a2a",2,++P.z);}}
    if(L.wpn==="bow"&&!side){for(let i=0;i<12;i++){const x=2+Math.round(Math.sin(i/11*Math.PI)*-1.6)+1,y=12+i;put2(P,x,y,"#9a6a32",2+(i<4?1:0),++P.z);}for(let y=13;y<23;y++)put2(P,3,y,"#e8e0d0",4,P.z);}
    if(L.wpn==="staff"){const x=side?11:13;cyl2(P,x,6,1,21,"#8a5a30",{});ell2(P,x+.5,5,1.6,1.6,L.orb||"#7ad8ff",{bias:.25});}
    if(L.wpn==="branch"){const x=side?11:13;cyl2(P,x,5,1,22,"#7a5230",{});for(const [a,b] of [[-1,4],[1,5],[0,3],[1,3]])put2(P,x+a,b,"#6aa040",3,++P.z);}
    if(L.wpn==="mace"){if(side){cyl2(P,10,18,1,4,"#7a5a3a",{});ell2(P,10.5,17.5,1.5,1.5,"#c8b060",{});}else{cyl2(P,13,17,1,5,"#7a5a3a",{});ell2(P,13.5,16.3,1.6,1.6,"#c8b060",{bias:.1});}}}
  return render2(P);}

// a proper cowl: pointed peak, drapes onto the shoulders, and a pointed-arch opening with the face in its shadow
function hood2(P,L,dir,H){const hc=L.hood,z=++P.z;const side=dir==="s",back=dir==="b";
  if(!side){const hw={2:.6,3:1.6,4:2.7,5:3.6,6:4.3,7:4.8,8:5,9:5.1,10:5.2,11:5.4,12:5.9,13:6.3};
    const open={7:.7,8:1.9,9:2.9,10:3,11:3.1,12:3.2};// the face opening: a pointed arch
    for(let y=2;y<=13;y++)for(let x=0;x<16;x++){const dx=x+.5-8.2;if(Math.abs(dx)>hw[y])continue;if(!back&&open[y]&&Math.abs(dx+.2)<open[y])continue;
      let t=shadeT(dx/(hw[y]+.4)*.9,(y-7)/8,y<5?.12:0);if(!back&&open[y]&&Math.abs(dx+.2)<open[y]+1)t=dx<0?3:1;// rim of the opening catches the light on one side
      if(back&&x===8&&y>2&&y<12)t=Math.max(0,t-2);// back seam
      if(!back&&y<=6&&Math.abs(dx)<.9&&y>2)t=Math.min(4,t+1);// crease down the front of the peak
      put2(P,x,y,hc,t,z);}
    if(!back){for(let y=8;y<=12;y++)for(let x=0;x<16;x++){const p=P.px[y][x];if(p&&p.c===L.skin&&y<=8)p.t=0;}// face in shadow
      if(H)for(const x of [6,7,8,9])if(P.px[8][x]&&P.px[8][x].c===L.skin)put2(P,x,8,H,0,z+1);
      px2(P,6,9,"#20182a");px2(P,6,10,L.eye);px2(P,10,9,"#20182a");px2(P,10,10,L.eye);}}
  else{// side view, facing right: the peak tips backwards, the opening is at the front
    const rows={2:[4,6],3:[3,8],4:[3,9],5:[3,10],6:[3,11],7:[3,11],8:[3,11],9:[3,11],10:[3,11],11:[3,11],12:[3,11],13:[4,10]};
    const open={7:[11,11],8:[9,11],9:[9,11],10:[9,11],11:[9,11],12:[10,11]};
    for(let y=2;y<=13;y++){const [a,b]=rows[y];for(let x=a;x<=b;x++){if(open[y]&&x>=open[y][0]&&x<=open[y][1])continue;
      let t=shadeT((x-6.5)/5,(y-7)/8,y<5?.1:0);if(open[y]&&x===open[y][0]-1)t=3;put2(P,x,y,hc,t,z);}}
    for(let y=8;y<=9;y++)for(let x=9;x<=11;x++){const p=P.px[y][x];if(p&&p.c===L.skin)p.t=y===8?0:1;}
    px2(P,10,9,"#20182a");px2(P,10,10,L.eye);}}
