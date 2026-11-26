// ===== JRPG-style shaded monsters =====
// small humanoids (goblins, kobolds) share the character system; beasts and blobs get their own drawings.
Object.assign(LOOKS,{
  goblin:{small:1,skin:"#6a9e3e",eye:"#ffd840",top:"#7a5432",legs:"#5a4030",boots:"#3e2c20",belt:"#4a3020",ears:1,wpn:"scimitar"},
  archer:{small:1,skin:"#78a848",eye:"#ffd840",top:"#4a6a5a",cap:"#5a4a3a",legs:"#4a4038",boots:"#3e2c20",belt:"#3a2a20",ears:1,wpn:"bow"},
  shaman:{small:1,skin:"#7ab050",eye:"#80f0ff",robe:"#5a3a7a",trim:"#c8a050",boots:"#3e2c20",belt:"#c8a050",ears:1,feathers:1,wpn:"skullstaff"},
  goblinboss:{small:1,skin:"#5e9234",eye:"#ff5a30",top:"#8a2e26",plate:"#6e6870",legs:"#4a3428",boots:"#2e2420",belt:"#3a2418",ears:1,horns:1,wpn:"cleaver"},
  kobold:{small:1,skin:"#c4623a",belly:"#e8b070",eye:"#ffe040",top:"#6a4a2e",legs:"#c4623a",boots:"#8a3a22",belt:"#4a3020",snout:1,tail:1,wpn:"spear"}
});
const SMALL={goblin:1,archer:1,shaman:1,goblinboss:1,kobold:1};
function drawSmall2(key,dir,frame){const L=LOOKS[key];const P=P2();const side=dir==="s",back=dir==="b";const step=frame===1?1:frame===2?-1:0;
  const hx=8,hy=14,skin=L.skin,topc=L.top||L.robe;
  // back layer
  if(L.tail&&(back||side))cyl2(P,side?2:7,22,side?4:2,back?5:2,skin,{bias:-.1});
  if(L.tail&&!side&&!back)cyl2(P,11,23,3,2,skin,{bias:-.2});
  if(L.wpn==="bow"&&(back||side))for(let i=0;i<9;i++)put2(P,back?4+i*.8:4,16+i,"#8a5a2a",2,++P.z);
  // legs / robe
  if(L.robe){cyl2(P,5,26,3,2,L.boots,{round:1});cyl2(P,8,26,3,2,L.boots,{round:1});cyl2(P,5,21,6,6,L.robe,{taper:2});}
  else if(side){cyl2(P,6-step,23,2,3,L.legs,{bias:-.25});cyl2(P,5-step,25,3,3,L.boots,{round:1,bias:-.2});cyl2(P,8+step,23,2,3,L.legs,{});cyl2(P,8+step,25,3,3,L.boots,{round:1});}
  else{const lu=step>0?1:0,ru=step<0?1:0;cyl2(P,5,23,3,3-lu,L.legs,{});cyl2(P,8,23,3,3-ru,L.legs,{});cyl2(P,4,25-lu,4,3,L.boots,{round:1});cyl2(P,8,25-ru,4,3,L.boots,{round:1});}
  // torso
  cyl2(P,side?6:5,18,side?5:6,5,topc,{round:1});
  if(L.belly&&!back)cyl2(P,side?8:6,19,side?2:4,4,L.belly,{round:1,bias:.1});
  if(L.plate)cyl2(P,side?6:5,18,side?5:6,3,L.plate,{round:1,bias:.1});
  if(L.belt){for(let x=4;x<12;x++)if(P.px[22]&&P.px[22][x])put2(P,x,22,L.belt,1,++P.z);if(!back&&!side)put2(P,8,22,"#d8b040",3,P.z);}
  // arms
  if(side){cyl2(P,8,19,2,3,skin,{round:1});ell2(P,9+step*.5,22,1.1,1.1,skin,{});}
  else{cyl2(P,3,19,2,3,L.plate||skin,{round:1});cyl2(P,11,19,2,3,L.plate||skin,{round:1,bias:-.1});ell2(P,4,22.3,1.1,1.1,skin,{});ell2(P,12,22.3,1.1,1.1,skin,{});}
  // head: wide and low, big ears
  if(L.ears){const z=++P.z;if(side){for(const [x,y,t] of [[3,11,3],[4,12,2],[4,13,2],[5,12,2],[5,13,1],[5,14,1]])put2(P,x,y,skin,t,z);}
    else for(const [x,y,t] of [[1,13,3],[2,13,3],[2,14,2],[3,14,2],[3,15,1],[14,13,2],[13,13,2],[13,14,1],[12,14,1],[12,15,0]])put2(P,x,y,skin,t,z);}
  ell2(P,side?8.6:hx,hy,side?4.2:4.7,3.9,skin,{bias:.06});
  if(L.snout&&!back){if(side)ell2(P,12.4,15.2,2,1.4,L.belly||skin,{});else ell2(P,8,16,2.2,1.4,L.belly||skin,{bias:.1});}
  if(L.horns){const z=++P.z;for(const [x,y] of (side?[[6,9],[7,10],[5,8]]:[[4,10],[3,9],[3,8],[12,10],[13,9],[13,8]]))put2(P,x,y,"#e8dcc0",3,z);}
  if(L.cap)ell2(P,side?8:hx,hy-2.3,side?4.2:4.8,2.2,L.cap,{clip:(x,y)=>y<=hy-1});
  if(L.plate&&L.horns)ell2(P,side?8:hx,hy-2.2,side?4.3:4.9,2.4,L.plate,{clip:(x,y)=>y<=hy-1});
  if(L.feathers){const z=++P.z;for(const [x,y,c] of (side?[[6,8,"#d04030"],[7,7,"#e8c050"],[5,9,"#40a0d0"]]:[[6,8,"#d04030"],[8,7,"#e8c050"],[10,8,"#40a0d0"],[7,9,"#d04030"],[9,9,"#40a0d0"]]))put2(P,x,y,c,3,z);}
  if(!back){if(side){px2(P,10,13,L.eye);px2(P,11,13,"#20182a");px2(P,side&&L.snout?13:11,16,"#3a1a1a");if(!L.snout)px2(P,10,16,"#3a1a1a");}
    else{px2(P,5,14,L.eye);px2(P,6,14,"#20182a");px2(P,10,14,"#20182a");px2(P,11,14,L.eye);for(const x of [7,8,9])px2(P,x,17,"#3a1a1a");px2(P,8,17,"#f0ead0");
      if(!L.snout)px2(P,8,15,ramp2(skin)[1]);else{px2(P,7,15,"#3a1a1a");px2(P,9,15,"#3a1a1a");}}}
  // weapons
  if(!back){
    if(L.wpn==="scimitar"){const x=side?11:13;for(const [a,b,t] of [[0,16,4],[0,17,3],[1,18,3],[1,19,2],[1,20,2],[0,21,1]])put2(P,x+a,b,"#c0c8d4",t,++P.z);put2(P,x,22,"#7a4a2a",2,P.z);}
    if(L.wpn==="cleaver"){const x=side?11:12;cyl2(P,x,15,3,5,"#a8b0bc",{bias:.1});cyl2(P,x+1,20,1,3,"#6a4a2a",{});}
    if(L.wpn==="spear"){const x=side?12:13;cyl2(P,x,11,1,17,"#8a6a3a",{});put2(P,x,9,"#c8d0dc",4,++P.z);put2(P,x,10,"#a8b0bc",2,P.z);}
    if(L.wpn==="bow"&&!side){for(let i=0;i<10;i++)put2(P,2+Math.round(Math.sin(i/9*Math.PI)*-1.4)+1,16+i,"#9a6a32",2,++P.z);for(let y=17;y<25;y++)put2(P,3,y,"#e8e0d0",4,P.z);}
    if(L.wpn==="skullstaff"){const x=side?12:13;cyl2(P,x,11,1,17,"#6a4a2a",{});ell2(P,x+.5,10,1.8,1.6,"#e0d8c0",{bias:.1});px2(P,x,10,"#2a1a1a");px2(P,x+1,10,"#2a1a1a");}}
  return render2(P);}
// ---------- beasts & blobs (16×16, facing left like the old sprites) ----------
function line2(P,x0,y0,x1,y1,c,t,z){const n=Math.max(Math.abs(x1-x0),Math.abs(y1-y0))||1;for(let i=0;i<=n;i++)put2(P,Math.round(x0+(x1-x0)*i/n),Math.round(y0+(y1-y0)*i/n),c,t,z);}
const MON2={
  rat:()=>{const P=P2(16,16);const f="#8a7c6c";for(const [x,y] of [[13,12],[14,11],[15,10],[15,9],[14,8]])put2(P,x,y,"#d89090",2,1);
    cyl2(P,5,13,2,2,"#6a5c50",{});cyl2(P,10,13,2,2,"#6a5c50",{});ell2(P,9,10.5,4.6,3.2,f,{});ell2(P,4.5,10.5,2.7,2.3,f,{bias:.05});
    ell2(P,6,7.8,1.4,1.4,f,{});px2(P,6,8,"#e09aa0");px2(P,4,10,"#ff3a3a");px2(P,2,11,"#e07a8a");px2(P,3,12,ramp2(f)[0]);return render2(P);},
  wolf:(pal)=>{const P=P2(16,16);const bear=!!pal;const fur=bear?"#6a4a30":pal===null?"#7a7e8c":"#7a7e8c",bel=bear?"#8a6a4a":"#b4b6c0";
    const legs=[[4,11],[6,11],[11,11],[13,11]];legs.forEach(([x,y],i)=>cyl2(P,x,y,2,bear?4:5,fur,{bias:i%2?-.25:0}));
    if(!bear)ell2(P,14.6,7,2,1.2,fur,{bias:.1});
    ell2(P,9.5,9.2,bear?5.8:5.2,bear?4:3.2,fur,{});ell2(P,5.5,9.8,2.6,bear?3.4:3,bel,{bias:.05});
    ell2(P,4,6.8,bear?3:2.6,bear?2.6:2.4,fur,{bias:.08});ell2(P,1.9,8.2,1.7,1.2,bear?bel:fur,{});
    const z=++P.z;if(bear){ell2(P,5.2,4.2,1.1,1.1,fur,{});}else for(const [x,y] of [[4,4],[5,4],[5,5],[3,5]])put2(P,x,y,fur,3,z);
    px2(P,3,7,bear?"#2a1a10":"#ffd040");px2(P,1,8,"#201820");return render2(P);},
  druidwolf:(pal)=>{if(pal)return MON2.wolf(pal);const P=P2(16,16);const fur="#6e7e52",bel="#a8b888";
    [[4,11],[6,11],[11,11],[13,11]].forEach(([x,y],i)=>cyl2(P,x,y,2,5,fur,{bias:i%2?-.25:0}));ell2(P,14.6,7,2,1.2,fur,{bias:.1});
    ell2(P,9.5,9.2,5.2,3.2,fur,{});ell2(P,5.5,9.8,2.6,3,bel,{bias:.05});ell2(P,4,6.8,2.6,2.4,fur,{bias:.08});ell2(P,1.9,8.2,1.7,1.2,fur,{});
    const z=++P.z;for(const [x,y] of [[4,4],[5,4],[5,5],[3,5]])put2(P,x,y,fur,3,z);for(const [x,y] of [[9,6],[11,6],[13,7]])put2(P,x,y,"#8ad048",4,z);
    px2(P,3,7,"#c8ff60");px2(P,1,8,"#201820");return render2(P);},
  spider:()=>{const P=P2(16,16);const c="#4e4060";const z=++P.z;
    for(const [kx,ky,tx,ty] of [[3,5,1,8],[3,7,0,11],[5,8,2,14],[7,9,5,15],[13,5,15,8],[13,7,15,11],[11,8,14,14],[9,9,11,15]]){line2(P,8,10,kx,ky,c,1,z);line2(P,kx,ky,tx,ty,c,0,z);}
    ell2(P,10,8,4.3,3.6,c,{bias:.05});ell2(P,5,10.5,2.7,2.3,c,{bias:.1});
    for(const [x,y] of [[10,6],[9,7],[10,7],[11,7],[10,8]])px2(P,x,y,y===7?"#ff3a3a":"#c02a2a");px2(P,3,10,"#ff4040");px2(P,4,9,"#ff4040");px2(P,3,11,"#a02020");return render2(P);},
  ooze:()=>{const P=P2(16,16);const c="#c49a34";ell2(P,8,11,6.6,4.4,c,{bias:.1});ell2(P,8,8.5,4,3,c,{bias:.15});cyl2(P,3,14,1,2,c,{});cyl2(P,12,14,1,2,c,{});
    px2(P,5,6,"#fff4c0");px2(P,6,6,"#fff4c0");px2(P,5,7,"#f8e8a0");px2(P,11,12,ramp2(c)[4]);px2(P,10,13,ramp2(c)[4]);
    px2(P,6,10,"#2a1a0a");px2(P,10,10,"#2a1a0a");px2(P,6,9,"#fff8e0");px2(P,10,9,"#fff8e0");for(const x of [7,8,9])px2(P,x,12,"#6a4810");return render2(P);},
  chest:()=>chest2(false,false),chestOpen:()=>chest2(true,false),mimic:()=>chest2(false,true),
  ogre:()=>{const P=P2(32,32);const sk="#b88a58",lo="#6a4a2e";
    cyl2(P,10,26,5,4,"#7a6250",{});cyl2(P,17,26,5,4,"#7a6250",{});cyl2(P,9,29,6,3,"#4a3424",{round:1});cyl2(P,17,29,6,3,"#4a3424",{round:1});
    ell2(P,16,19,8.4,7,sk,{});cyl2(P,9,22,14,5,lo,{taper:2});for(let x=8;x<25;x++)if(P.px[22][x])put2(P,x,22,"#3a2618",1,++P.z);
    cyl2(P,3,12,5,11,sk,{round:1,bias:.05});cyl2(P,24,12,5,11,sk,{round:1,bias:-.1});ell2(P,5.5,24,3,2.6,sk,{});ell2(P,26.5,24,3,2.6,sk,{});
    cyl2(P,27,4,3,20,"#7a5634",{bias:.05});ell2(P,28.5,6,3.4,4.6,"#6a4a2c",{});for(const [x,y] of [[25,4],[31,6],[26,9],[31,2]])px2(P,x,y,"#d8d0c0");
    ell2(P,16,9,6,5.4,sk,{bias:.08});ell2(P,16,4.6,2,1.6,"#2a2018",{});
    for(let x=11;x<21;x++)px2(P,x,8,ramp2(sk)[0]);px2(P,13,9,"#ff4030");px2(P,18,9,"#ff4030");px2(P,12,9,"#201010");px2(P,19,9,"#201010");
    for(let x=13;x<20;x++)px2(P,x,12,"#3a1a14");px2(P,13,11,"#f0e8d0");px2(P,18,11,"#f0e8d0");px2(P,15,10,ramp2(sk)[1]);px2(P,16,10,ramp2(sk)[1]);
    for(const [x,y] of [[11,15],[13,16],[16,16.5],[19,16],[21,15]])ell2(P,x,y,.9,.9,"#e8e0c8",{});return render2(P);}
};
function chest2(open,mimic){const P=P2(16,16);const w="#9a6838",band="#c8a040";
  cyl2(P,2,8,12,6,w,{round:1});for(const x of [4,11])for(let y=8;y<14;y++)put2(P,x,y,band,y===8?4:2,P.z+1);
  if(open){cyl2(P,2,3,12,4,ramp2(w)[1],{round:1});for(let x=3;x<13;x++)px2(P,x,8,"#2a1810");for(const x of [5,8,10])px2(P,x,7,"#ffe070");}
  else if(mimic){ell2(P,8,7,6.2,2.6,w,{clip:(x,y)=>y<=7});for(let x=3;x<13;x++){px2(P,x,8,"#5a1018");if(x%2)px2(P,x,9,"#f4f0e0");else px2(P,x,7,"#f4f0e0");}
    px2(P,6,10,"#c03040");px2(P,7,10,"#c03040");px2(P,5,5,"#ffd040");px2(P,10,5,"#ffd040");}
  else{ell2(P,8,7.6,6.2,2.6,w,{clip:(x,y)=>y<=8});for(const x of [4,11])for(let y=5;y<9;y++)if(P.px[y][x])put2(P,x,y,band,3,P.z+1);px2(P,8,10,"#e8c850");px2(P,8,11,"#2a1810");}
  return render2(P);}
