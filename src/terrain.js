// ===== Fire Red-style cave terrain: painted per pixel once per floor (and again when the ground changes) =====
function rng(seed){return function(){seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
const OUT=BASE_PAL.k;
const PALS={
  earth:{style:"dirt",plates:1,roots:1,vines:1,pillars:1,floor:"#8c7a56",floorLt:"#a8946a",floorDk:"#5a4a44",crater:"#4e3e3c",top:"#3a2a2e",topLt:"#523c3c",topDk:"#1c1218",rim:"#56403a",face:"#6e4c42",faceDk:"#362430",faceLt:"#9a7462",peb:"#806a58",pebDk:"#4a3840",pebLt:"#a8927a",moss:"#4e6a2a",mossLt:"#7a9a3a",bones:1},
  ruin:{style:"flag",roots:1,vines:1,pillars:1,floor:"#8a7a62",floorLt:"#a6967a",floorDk:"#54483e",crater:"#48465a",top:"#2e2c38",topLt:"#46424e",topDk:"#18161e",rim:"#4a4656",face:"#6a6878",faceDk:"#2e2a3a",faceLt:"#9894a6",peb:"#6e6c78",pebDk:"#3c3848",pebLt:"#9a98a6",moss:"#46662a",mossLt:"#6e8e38",bones:1},
  crystal:{style:"dirt",plates:1,floor:"#4e6266",floorLt:"#6a8084",floorDk:"#2e3a42",crater:"#3a3450",top:"#241c34",topLt:"#3a2e4e",topDk:"#120c1c",rim:"#3e3256",face:"#5a4a78",faceDk:"#281e3c",faceLt:"#8a78aa",peb:"#5e5a70",pebDk:"#34304a",pebLt:"#8884a0",crystal:"#5ad0f0",crystalLt:"#d8f8ff"},
  ember:{style:"dirt",plates:1,pillars:1,floor:"#5e5654",floorLt:"#7c7270",floorDk:"#383034",crater:"#462c28",top:"#2a1618",topLt:"#42241e",topDk:"#140a0c",rim:"#4e2a24",face:"#7a4436",faceDk:"#341824",faceLt:"#a8684a",peb:"#6a4a3a",pebDk:"#3a261c",pebLt:"#94705a",lava:"#ff6a20",lavaLt:"#ffc050",bones:1}
};
const GROUND={none:0,water:1,rubble:2,oil:3,acid:4,crack:5};
function palFor(floor,last){return last?PALS.ember:[PALS.earth,PALS.ruin,PALS.crystal][(floor-1)%3];}
function hx(h){return [parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)];}
function mix(a,b,t){return [a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t];}
function hash(x,y,s){let h=Math.imul(x,374761393)+Math.imul(y,668265263)+Math.imul(s,1442695041)|0;h=Math.imul(h^(h>>>13),1274126177);return (h^(h>>>16))>>>0;}
function vnoise(x,y,s){const xi=Math.floor(x),yi=Math.floor(y),xf=x-xi,yf=y-yi;const r=(a,b)=>(hash(a,b,s)&1023)/1023;
  const u=xf*xf*(3-2*xf),v=yf*yf*(3-2*yf);return (r(xi,yi)*(1-u)+r(xi+1,yi)*u)*(1-v)+(r(xi,yi+1)*(1-u)+r(xi+1,yi+1)*u)*v;}
function vor(x,y,s,seed){const gx=Math.floor(x/s),gy=Math.floor(y/s);let d1=1e9,d2=1e9,fx=0,fy=0;
  for(let j=-1;j<=1;j++)for(let i=-1;i<=1;i++){const cx=gx+i,cy=gy+j;const h=hash(cx,cy,seed);const px=(cx+.15+(h&255)/255*.7)*s,py=(cy+.15+((h>>>8)&255)/255*.7)*s;
    const d=(x-px)*(x-px)+(y-py)*(y-py);if(d<d1){d2=d1;d1=d;fx=px;fy=py;}else if(d<d2)d2=d;}
  return {e:Math.sqrt(d2)-Math.sqrt(d1),dx:x-fx,dy:y-fy};}
function blur(src,W,H,r){const tmp=new Float32Array(W*H),out=new Float32Array(W*H),n=2*r+1;
  const cx=v=>v<0?0:v>=W?W-1:v,cy=v=>v<0?0:v>=H?H-1:v;
  for(let y=0;y<H;y++){const o=y*W;let s=0;for(let k=-r;k<=r;k++)s+=src[o+cx(k)];for(let x=0;x<W;x++){tmp[o+x]=s/n;s+=src[o+cx(x+r+1)]-src[o+cx(x-r)];}}
  for(let x=0;x<W;x++){let s=0;for(let k=-r;k<=r;k++)s+=tmp[cy(k)*W+x];for(let y=0;y<H;y++){out[y*W+x]=s/n;s+=tmp[cy(y+r+1)*W+x]-tmp[cy(y-r)*W+x];}}
  return out;}
function chamfer(mask,W,H){const N=W*H,d=new Float32Array(N).fill(99);
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x,m=mask[i];if((x>0&&mask[i-1]!==m)||(x<W-1&&mask[i+1]!==m)||(y>0&&mask[i-W]!==m)||(y<H-1&&mask[i+W]!==m))d[i]=0.5;}
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x;let v=d[i];if(x>0)v=Math.min(v,d[i-1]+1);if(y>0){v=Math.min(v,d[i-W]+1);if(x>0)v=Math.min(v,d[i-W-1]+1.4);if(x<W-1)v=Math.min(v,d[i-W+1]+1.4);}d[i]=v;}
  for(let y=H-1;y>=0;y--)for(let x=W-1;x>=0;x--){const i=y*W+x;let v=d[i];if(x<W-1)v=Math.min(v,d[i+1]+1);if(y<H-1){v=Math.min(v,d[i+W]+1);if(x<W-1)v=Math.min(v,d[i+W+1]+1.4);if(x>0)v=Math.min(v,d[i+W-1]+1.4);}d[i]=v;}
  return d;}
function tileMask(W,H,fn){const m=new Float32Array(W*H);for(let y=0;y<H;y++){const ty=y>>4;for(let x=0;x<W;x++)m[y*W+x]=fn(x>>4,ty)?1:0;}return m;}
function buildTerrain(){
  const P={};for(const k in G.pal)if(typeof G.pal[k]==="string"&&G.pal[k][0]==="#")P[k]=hx(G.pal[k]);
  if(G.tseed===undefined)G.tseed=(Math.random()*1e6)|0;
  const seed=G.tseed,W=G.W*TS,H=G.H*TS,N=W*H;
  const gnd=(tx,ty)=>G.ground?G.ground[ty][tx]:0;
  let f=tileMask(W,H,(tx,ty)=>G.t[ty][tx]===1);
  f=blur(f,W,H,5);f=blur(f,W,H,4);
  const rock=new Uint8Array(N);
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x,tv=G.t[y>>4][x>>4],lx=x&15,ly=y&15;
    let r=f[i]+(vnoise(x/6,y/6,seed)-.5)*.32>.5;
    if(tv===0&&lx>=3&&lx<=12&&ly>=3&&ly<=12)r=false;if(tv===1&&lx>=4&&lx<=11&&ly>=4&&ly<=11)r=true;
    if(tv===0&&isDoorTile(x>>4,y>>4))r=doorRock(x>>4,y>>4,lx,ly);
    rock[i]=r?1:0;}
  const dist=chamfer(rock,W,H);
  const run=new Uint16Array(N),endF=new Uint8Array(N);
  for(let x=0;x<W;x++)for(let y=H-1;y>=0;y--){const i=y*W+x;if(!rock[i])continue;if(y===H-1){run[i]=1;continue;}const b=i+W;if(!rock[b]){run[i]=1;endF[i]=1;}else{run[i]=run[b]+1;endF[i]=endF[b];}}
  // ground feature masks (soft rounded pools)
  const soft=(code,r)=>{let m=tileMask(W,H,(tx,ty)=>gnd(tx,ty)===code);if(!m.some(v=>v))return null;m=blur(m,W,H,r);m=blur(m,W,H,r-2);for(let i=0;i<m.length;i++)m[i]+=(vnoise((i%W)/5,((i/W)|0)/5,seed+50)-.5)*.18;return m;};
  const water=soft(GROUND.water,6),oil=soft(GROUND.oil,5),acid=soft(GROUND.acid,5);
  // ledges (raised floor)
  let ledge=null;if(G.elev&&G.elev.some(r=>r.some(v=>v))){ledge=blur(tileMask(W,H,(tx,ty)=>G.elev[ty][tx]>0),W,H,3);}
  const ledgeAt=(x,y)=>ledge&&x>=0&&y>=0&&x<W&&y<H&&ledge[y*W+x]>.5&&!rock[y*W+x];
  const cvs=document.createElement("canvas");cvs.width=W;cvs.height=H;const c2=cvs.getContext("2d");const img=c2.createImageData(W,H);const d=img.data;
  const put=(i,c)=>{d[i*4]=c[0];d[i*4+1]=c[1];d[i*4+2]=c[2];d[i*4+3]=255;};
  const WATER=[hx("#2e5a6a"),hx("#6a9eb0"),hx("#1a3644")],OIL=[hx("#1c181c"),hx("#4a4250"),hx("#0e0b0e")],ACID=[hx("#5a8a26"),hx("#b0e068"),hx("#30541a")];
  const BY=[0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5];
  const t4=(T,v,x,y)=>{let k=Math.round(v*3+(BY[(y&3)*4+(x&3)]/16-.5)*.95);return T[k<0?0:k>3?3:k];};
  // hue-shifted ramps: warm highlights, purple shadows (Sword of Mana style)
  const RR=h=>ramp2(h).map(hx);const RF=RR(G.pal.floor),RK=RR(G.pal.face),RT=RR(G.pal.top),RM=G.pal.moss?RR(G.pal.moss):null;
  const F4=[RF[0],RF[1],RF[2],RF[3]];
  const tone=(R,v,x,y)=>{let k=Math.round(v*4+(BY[(y&3)*4+(x&3)]/16-.5)*.7);return R[k<0?0:k>4?4:k];};
  const sphere=(dx,dy,r)=>{const nx=Math.max(-1,Math.min(1,dx/r)),ny=Math.max(-1,Math.min(1,dy/r));const nz=Math.sqrt(Math.max(0,1-nx*nx-ny*ny));return Math.max(0,Math.min(1,(nx*-.55+ny*-.6+nz*.6+.35)/1.3));};
  const fbm=(x,y,s)=>.55*vnoise(x/14,y/14,s)+.3*vnoise(x/6,y/6,s+1)+.15*vnoise(x/2.5,y/2.5,s+2);
  const flag=G.pal.style==="flag";
  const crackAt=(x,y)=>{const col=Math.floor(x/11);if(hash(col,3,seed+90)%5!==0)return false;const cx=col*11+5+Math.round((vnoise(1,y/5,seed+91+col)-.5)*6);return Math.abs(x-cx)<.6;};
  const RP=RR(G.pal.pillar||"#8a8478"),RO=RR("#5e3e26"),RV=RR("#4e7a30");
  // pillars, roots and vines on the cliff faces
  const wallFeature=(x,y,k,fh)=>{const yb=y+k-1,tx=x>>4,lx=x&15,tb=yb>>4;
    if(G.pal.pillars&&hash(tx,tb,seed+80)%6===0){const cap=k>=fh-3,base=k<=4;const half=cap||base?4:3;const dx=lx+.5-8;
      if(Math.abs(dx)<=half){if(k===fh||k===1||(cap&&k===fh-3)||(base&&k===4))return RP[5];let v=.5-dx/half*.38+(fbm(x,y,seed+81)-.5)*.15;if(!cap&&!base&&(lx===7))v-=.3;return tone(RP,v,x,y);}
      if(Math.abs(dx)<=half+1)return RP[5];}
    if(G.pal.roots){const col=Math.floor(x/13);const h=hash(col,tb,seed+82);if(h%3===0){const len=4+h%Math.max(4,fh-6);const top=fh-k;if(top<len){const cx=col*13+6+Math.round(Math.sin((yb-k)/4+col)*1.5+Math.sin(top/3+col)*1.2);
        if(Math.abs(x-cx)<=(top<3?1:0))return top<2?RO[1]:RO[(x-cx)<0?3:1];if(Math.abs(x-cx)===1&&top<len-1)return RO[5];
        if(top%6===3&&x===cx+(h%2?2:-2))return RO[2];}}}
    if(G.pal.vines){const col=Math.floor(x/9);const h=hash(col,tb,seed+84);if(h%4===1){const len=3+h%9;const top=fh-k;if(top<len){const cx=col*9+4+((top>>1)&1);
        if(x===cx)return RV[1];if((x===cx-1||x===cx+1)&&(top%3===(x<cx?0:1)))return RV[top<2?3:2];if(top===len-1&&Math.abs(x-cx)<=1)return RV[3];}}}
    return null;};
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x;let c;
    if(rock[i]){const fh=16+Math.floor(vnoise(x/9,.5,seed+3)*6);
      if(endF[i]&&run[i]<=fh){const k=run[i];const up=k/fh;
        if(flag){// dressed stone blocks with bevelled edges
          const row=Math.floor((y+2)/6),ox=(row&1)*6,bx=Math.floor((x+ox)/12),lx=(x+ox)%12,ly=(y+2)%6;const hv=(hash(bx,row,seed+60)%100)/100-.5;
          let v=.45+hv*.22+(fbm(x,y,seed+61)-.5)*.25+up*.25;if(ly===0||lx===0)c=RK[5];else{if(ly===1||lx===1)v+=.28;else if(ly===5||lx===11)v-=.3;c=tone(RK,v,x,y);}
          if(k<=2)c=RK[5];else if(k>=fh-1)c=RK[4];
          if(RM&&k>fh-7&&vnoise(x/4,y/3,seed+62)>.6)c=tone(RM,vnoise(x/2,y/2,seed+63)*.9,x,y);}
        else{// rounded boulder clumps
          const cl=vor(x,y*1.15,6.5,seed+21);let v=sphere(cl.dx,cl.dy*1.15,4.2)*.75+up*.35-.05+(fbm(x,y,seed+23)-.5)*.15;
          if(cl.e<.8)c=RK[5];else{if(cl.e<1.5)v-=.25;c=tone(RK,v,x,y);}
          if(k<=2)c=RK[5];else if(k>=fh-1)c=k===fh?RK[4]:RK[3];
          if(P.crystal&&k<=6&&k>2&&vnoise(x/3,9,seed+25)>.74)c=k<=4?P.crystal:P.crystalLt;
          if(RM&&G.pal.bones&&k>fh-5&&vnoise(x/5,y/3,seed+62)>.7)c=tone(RM,vnoise(x/2,y/2,seed+63),x,y);}
        if(k>3&&k<fh-2&&crackAt(x,y))c=RK[5];
        const wf=wallFeature(x,y,k,fh);if(wf)c=wf;}
      else if(endF[i]&&run[i]<=fh+2)c=RT[4];
      else{// the rocky mass above: big shaded boulders sinking into shadow
        const cl=vor(x,y,9,seed+27);const edge=dist[i];let v=sphere(cl.dx,cl.dy,6)*.7+(fbm(x,y,seed+28)-.5)*.2;
        if(edge<=3)v+=.3-edge*.08;v-=Math.min(.35,Math.max(0,edge-6)*.03);
        c=cl.e<1?RT[5]:tone(RT,v,x,y);}}
    else{let v;
      if(flag){const row=Math.floor(y/8),ox=((row&1)*5+hash(row,1,seed+70)%4),sx=Math.floor((x+ox)/11),lx=(x+ox)%11,ly=y%8;const hv=(hash(sx,row,seed+71)%100)/100-.5;
        v=.5+hv*.3+(fbm(x,y,seed+72)-.5)*.3;if(lx===0||ly===0)c=RF[5];else{if(lx===1||ly===1)v+=.2;else if(lx===10||ly===7)v-=.22;
        if(hash(sx,row,seed+73)%9===0&&Math.abs((lx-1)-(ly-1)*1.3)<.7)v=.02;c=tone(RF,v,x,y);}
        if(RM&&(lx===0||ly===0)&&vnoise(x/5,y/5,seed+74)>.62)c=RM[1];}
      else{v=(.62*vnoise(x/16,y/16,seed+9)+.38*vnoise(x/7,y/7,seed+19))*.75+.1;if(vnoise(x/22,y/22,seed+12)>.6)v+=.22;// lighter dusty patches
        const v2=vor(x,y,4,seed+10);if(v2.e<.6&&vnoise(x/8,y/8,seed+11)>.45)v-=.2;else if(v2.e>2.2&&(v2.dx+v2.dy)<-1.5)v+=.12;
        if(G.pal.plates){const pl=vor(x,y,11,seed+15);if(pl.e<.45)v-=.35;else if(pl.e<1.2&&pl.dx+pl.dy<0)v+=.1;}
        c=tone(RF,v,x,y);
        if(RM&&dist[i]<5&&vnoise(x/4,y/4,seed+13)>.68)c=tone(RM,vnoise(x/2,y/2,seed+14)*.8,x,y);}
      const isLedge=ledgeAt(x,y);
      if(isLedge){c=mix(c,RF[4],.25);
        if(!ledgeAt(x,y-1)||!ledgeAt(x,y-2))c=RF[4];
        else if(!ledgeAt(x-1,y)||!ledgeAt(x+1,y)||!ledgeAt(x-2,y)||!ledgeAt(x+2,y))c=mix(c,RK[5],.4);
        let k=0;for(let j=1;j<=8;j++){if(y+j<H&&!rock[i+j*W]&&!ledgeAt(x,y+j)){k=j;break;}}
        if(k){const tx=x>>4,ty=y>>4;
          if(G.ramp&&G.ramp.has(ty*G.W+tx)){const band=Math.floor((8-k)/2);c=band%2===0?RF[3]:RK[1];if((x&15)<2||(x&15)>13)c=RK[5];}
          else{const cl=vor(x,y,4,seed+29);let v2=sphere(cl.dx,cl.dy,3)*.6+.4*((8-k)/8);if(cl.e<.7)c=RK[5];else c=tone(RK,v2,x,y);if(k<=1)c=RK[5];}}}
      let above=0;for(let k=1;k<=5;k++){if(y-k>=0&&(rock[i-k*W]||(!isLedge&&ledgeAt(x,y-k)))){above=k;break;}}
      if(above)c=mix(c,RF[5],[0,.7,.55,.4,.25,.12][above]);
      if(G.pal.vines&&above>=1&&above<=3){const h=hash(x>>2,y>>2,seed+86);if(h%11===0&&((x+y)&1))c=RV[above===1?1:3];}else if(dist[i]<=2)c=mix(c,RF[5],.35);
      const liquid=(m,PAL,kind)=>{if(!m||m[i]<=.5)return;const edge=m[i]<.62;
        if(kind==="water"){const wave=Math.sin(x/3.2+Math.sin(y/2.5)*1.6+seed)>.86&&(y%3===0);c=edge?PAL[2]:wave?PAL[1]:t4([PAL[2],mix(PAL[2],PAL[0],.5),PAL[0],mix(PAL[0],PAL[1],.4)],fbm(x,y,seed+40)*.9,x,y);}
        else if(kind==="oil"){const gl=vnoise(x/3,y/3,seed+41);c=edge?PAL[2]:gl>.72?PAL[1]:PAL[0];}
        else{const bb=hash(x>>1,y>>1,seed+42)%19===0;c=edge?PAL[2]:bb?PAL[1]:t4([PAL[2],mix(PAL[2],PAL[0],.5),PAL[0],PAL[1]],fbm(x,y,seed+43)*.8,x,y);}};
      liquid(water,WATER,"water");liquid(oil,OIL,"oil");liquid(acid,ACID,"acid");}
    put(i,c);}
  const floorPx=(x,y)=>x>=0&&y>=0&&x<W&&y<H&&!rock[y*W+x];
  const r=rng(seed);
  const pebble=(cx,cy,rx)=>{const ry=rx*.8;for(let y=Math.floor(cy-ry-1);y<=cy+ry+2;y++)for(let x=Math.floor(cx-rx-1);x<=cx+rx+1;x++){if(!floorPx(x,y))continue;const dx=(x-cx)/rx,dy=(y-cy)/ry,e=dx*dx+dy*dy;const i=y*W+x;
    if(e<=1){put(i,dy>.45?P.pebDk:(dx+dy<-.6?P.pebLt:P.peb));}else if(e<=1.9&&y>cy+ry*.5){put(i,mix([d[i*4],d[i*4+1],d[i*4+2]],P.faceDk,.35));}}};
  for(let ty=0;ty<G.H;ty++)for(let tx=0;tx<G.W;tx++){if(G.t[ty][tx]!==0)continue;const g=gnd(tx,ty);const q=r();
    if(g===GROUND.rubble){for(let k=0;k<6;k++)pebble(tx*TS+2+r()*12,ty*TS+3+r()*11,1.4+r()*1.8);continue;}
    if(g===GROUND.crack){const ctx2=[];let x=tx*TS+8,y=ty*TS+8;for(let a=0;a<3;a++){let px=x,py=y;const ang=a*2.1+r();for(let s=0;s<9;s++){px+=Math.cos(ang)+(r()-.5);py+=Math.sin(ang)+(r()-.5);const ix=Math.round(px),iy=Math.round(py);if(floorPx(ix,iy)){put(iy*W+ix,mix(P.faceDk,[20,16,12],.3));if(floorPx(ix+1,iy+1))put((iy+1)*W+ix+1,mix(P.floorDk,P.faceDk,.3));}}}continue;}
    if(g||(G.stairs&&G.stairs.x===tx&&G.stairs.y===ty)||(G.elev&&G.elev[ty][tx]))continue;
    if(P.lava&&q<.05){let x=tx*TS+3+r()*10,y=ty*TS+3+r()*10;for(let s=0;s<10;s++){x+=r()*2-1;y+=r()*1.6-.3;const ix=Math.round(x),iy=Math.round(y);if(floorPx(ix,iy)){put(iy*W+ix,s%3?P.lava:P.lavaLt);if(floorPx(ix,iy+1))put((iy+1)*W+ix,mix(P.lava,P.floorDk,.5));}}continue;}
    if(G.pal.bones&&q>.955){const cx=Math.round(tx*TS+4+r()*7),cy=Math.round(ty*TS+5+r()*6);const B=[200,190,164],D=[130,122,104];
      if(r()<.5){for(const [a2,b2,cc] of [[0,0,B],[1,0,B],[2,0,B],[0,1,B],[1,1,D],[2,1,B],[0,2,D],[2,2,D],[1,3,D]])if(floorPx(cx+a2,cy+b2))put((cy+b2)*W+cx+a2,cc);}
      else{for(let s=0;s<6;s++){if(floorPx(cx+s,cy+s%2))put((cy+s%2)*W+cx+s,B);if(floorPx(cx+5-s,cy+3-(s%2)))put((cy+3-(s%2))*W+cx+5-s,s===0||s===5?B:D);}}continue;}
    if(q<.035){const cx=tx*TS+4+r()*8,cy=ty*TS+4+r()*8,rad=2.5+r()*2.5;
      for(let y=Math.floor(cy-rad-1);y<=cy+rad+1;y++)for(let x=Math.floor(cx-rad-1);x<=cx+rad+1;x++){if(!floorPx(x,y))continue;const dx=x-cx,dy=(y-cy)*1.15,dd=Math.hypot(dx,dy);if(dd>rad)continue;
        const i=y*W+x;let c=P.crater;if(dx+dy<-rad*.4)c=mix(P.crater,P.faceDk,.25);if(dd>rad-1.2&&dx+dy>0)c=mix(P.crater,P.floorLt,.4);put(i,c);}}
    else if(q<.09){const n=2+(r()*3|0);const bx=tx*TS+3+r()*10,by=ty*TS+4+r()*9;for(let k=0;k<n;k++)pebble(bx+(r()-.5)*9,by+(r()-.5)*6,2+r()*2.2);}}
  c2.putImageData(img,0,0);
  if(G.stairs){const px=G.stairs.x*TS,py=G.stairs.y*TS;
    c2.fillStyle=G.pal.floorDk;c2.beginPath();c2.ellipse(px+8,py+10,7,5,0,0,Math.PI*2);c2.fill();
    c2.fillStyle="#1a1410";c2.beginPath();c2.ellipse(px+8,py+10,6,4,0,0,Math.PI*2);c2.fill();
    c2.fillStyle="#6e4626";c2.fillRect(px+4,py+1,2,11);c2.fillRect(px+10,py+1,2,11);
    c2.fillStyle="#b07a44";c2.fillRect(px+4,py+1,1,10);c2.fillRect(px+10,py+1,1,10);
    for(let k=0;k<4;k++){c2.fillStyle="#c8905a";c2.fillRect(px+5,py+2+k*3,6,1);c2.fillStyle="#6e4626";c2.fillRect(px+5,py+3+k*3,6,1);}}
  G.terr=cvs;}
// doors sit in a one-tile gap: keep the gap's sides rocky so the door frame reads clearly
function isDoorTile(x,y){return !!(G.objs&&G.objs.some(o=>o.type==="door"&&o.x===x&&o.y===y));}
function doorRock(tx,ty,lx,ly){const vert=G.t[ty][tx-1]===1&&G.t[ty][tx+1]===1;return vert?(lx<2||lx>13):(ly<2||ly>13);}
