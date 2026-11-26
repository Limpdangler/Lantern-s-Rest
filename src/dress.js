// ===== set dressing & collapsed passages =====
Object.assign(BLOCKERS,{rubble:1,cavein:1,furniture:1,alchemy:1});
// flood fill: can the party still reach every room and the ladder?
function allReachable(block){const sr=G.rooms.find(r=>r.role==="start")||G.rooms[0];const start={x:sr.cx,y:sr.cy};const sn=new Set([start.y*G.W+start.x]);const q=[[start.x,start.y]];
  while(q.length){const [x,y]=q.pop();for(const [dx,dy] of DIRS4){const nx=x+dx,ny=y+dy,k=ny*G.W+nx;if(sn.has(k)||isWall(nx,ny)||(nx===block.x&&ny===block.y))continue;const o=objAt(nx,ny);if(o&&BLOCKERS[o.type])continue;sn.add(k);q.push([nx,ny]);}}
  const need=G.rooms.filter(r=>r.role!=="secret").map(r=>({x:r.cx,y:r.cy})).concat(G.stairs?[G.stairs]:[]);
  return need.every(p=>sn.has(p.y*G.W+p.x)||isWall(p.x,p.y)||objAt(p.x,p.y));}
function placeRubble(){const cands=[];for(let y=1;y<G.H-1;y++)for(let x=1;x<G.W-1;x++){if(isWall(x,y)||roomOf(x,y)||reserved(x,y)||doorAt(x,y)||elevAt(x,y))continue;
    const ns=isWall(x,y-1)&&isWall(x,y+1),ew=isWall(x-1,y)&&isWall(x+1,y);if(ns!==ew)cands.push({x,y});}
  const sr=G.rooms.find(r=>r.role==="start")||G.rooms[0];let n=ri(1,3);
  for(const c of shuffle(cands)){if(n<=0)break;if(cheb(c,{x:sr.cx,y:sr.cy})<5)continue;const spare=allReachable(c);
    if(spare&&Math.random()<.5)G.objs.push({type:"cavein",x:c.x,y:c.y});else G.objs.push({type:"rubble",x:c.x,y:c.y});n--;}}
const DECO_TEXT={
  skeleton:"A withered skeleton slumped against the wall, still wearing scraps of leather. Someone else's adventure ended here.",
  oldcamp:"The remains of another party's camp: a ring of blackened stones, a torn bedroll, a dented cup.",
  animalbones:"A scatter of small gnawed bones. Rats, mostly. Something has been eating well down here.",
  brokenweapons:"Snapped spear shafts and a notched, rusted sword. There was a fight here, long ago.",
  furniture:"A smashed table and broken chairs. Dry old wood.",
  alchemy:"A rickety bench covered in cracked flasks, dried residue and chalk runes that still faintly glow.",
  leak:"Water seeps from a crack in the wall and pools on the floor.",
  web:"Thick, dusty cobwebs. Sticky, and very flammable."};
function placeDressing(){const rooms=G.rooms.filter(r=>!r.role||r.role==="vault");if(!rooms.length)return;
  const put=(type,blocking,extra)=>{const r=pick(rooms);const p=interiorFree(r,blocking);if(p)G.objs.push(Object.assign({type,x:p.x,y:p.y,deco:true},extra||{}));};
  for(let i=0;i<ri(1,2);i++)put("skeleton",false,{loot:Math.random()<.45});
  if(Math.random()<.5)put("oldcamp",false,{loot:Math.random()<.5});
  for(let i=0;i<ri(1,3);i++)put("animalbones",false);
  if(Math.random()<.6)put("brokenweapons",false);
  for(let i=0;i<ri(0,2);i++)put("furniture",true);
  if(G.floor>=2&&Math.random()<.45)put("alchemy",true);
  // water leaking from a wall
  for(let i=0;i<ri(0,2);i++){const r=pick(rooms);for(let g=0;g<30;g++){const x=ri(r.x,r.x+r.w-1),y=r.y;if(!isWall(x,y-1)||reserved(x,y)||elevAt(x,y))continue;
      G.objs.push({type:"leak",x,y,deco:true});for(const [a,b] of [[0,0],[0,1],[1,1],[-1,1],[0,2]])if(!isWall(x+a,y+b)&&!reserved(x+a,y+b)&&gnd(x+a,y+b)===0&&Math.random()<.8)G.ground[y+b][x+a]=GROUND.water;break;}}
  // cobwebs in corners
  for(let i=0;i<ri(1,4);i++){const r=pick(rooms);const cs=[[r.x,r.y],[r.x+r.w-1,r.y],[r.x,r.y+r.h-1],[r.x+r.w-1,r.y+r.h-1]];const [x,y]=pick(cs);if(!reserved(x,y)&&!elevAt(x,y)){G.objs.push({type:"web",x,y,deco:true});G.entangle.add(y*G.W+x);}}
  placeRubble();}
async function decoInteract(o){const L=G.party[0];if(!BLOCKERS[o.type])o.seen=true;
  if(o.type==="rubble"){const h=bestAt("athletics");const c=await choose("Fallen rock half-blocks the passage. It might shift with enough muscle.",[{t:"HEAVE IT ASIDE",sub:o.fail?"You already tried":`${oddsTag(h,"athletics",13,{adv:!!o.loose})}${o.loose?" (loosened)":""} · noisy`},{t:"DIG THROUGH",sub:"Slow, tiring work, but it always works (the party grows wearier)"},{t:"RAGE AND SMASH",sub:"Barbarian: uses a Rage, instant, loud",dis:!heroesUp().some(b=>b.id==="barbarian"&&(b.res.rage||0)>0)},{t:"LEAVE IT"}]);
    if(c===1){o.gone=true;G.steps+=60;burnFuel(60);if(S.rules.fatigue){G.fatigue++;await partyWeary();}await say("Stone by stone, the party clears a way through. It takes a long, sweaty while.",1500,true);$("tBox").hidden=true;computeLight();fov();hud();return;}
    if(c===2){const b=heroesUp().find(b=>b.id==="barbarian"&&(b.res.rage||0)>0);b.res.rage--;o.gone=true;makeNoise(o.x,o.y,12);cam.shake=now();await say(`The ${b.name} roars and smashes straight through the rubble!`,1200,true);$("tBox").hidden=true;computeLight();fov();return;}
    if(c!==0){$("tBox").hidden=true;return;}if(o.fail){toast(o.fail);$("tBox").hidden=true;return;}const r=await check(h,"athletics",13,{adv:!!o.loose});makeNoise(o.x,o.y,7);G.steps+=6;
    if(r.ok){o.gone=true;await say(`The ${h.name} heaves the rocks aside with a grinding crash. (${r.txt})`,1300,true);}else{o.fail="The rocks won't move with brute strength alone.";await say(`It won't budge. (${r.txt})`,1100,true);}$("tBox").hidden=true;computeLight();fov();return;}
  if(o.type==="cavein"){toast("The tunnel has completely collapsed here. There's no getting through.");return;}
  if(o.type==="furniture"){const sv=bestAt("survival");const c=await choose(DECO_TEXT.furniture,[{t:"BREAK IT UP FOR FIREWOOD",sub:"+1 firewood · a bit noisy"},{t:"LEAVE IT"}]);
    if(c===0){o.gone=true;addItem("firewood");makeNoise(o.x,o.y,5);G.steps+=6;await say("You break the furniture down into a bundle of firewood.",1100,true);}$("tBox").hidden=true;hud();return;}
  if(o.type==="alchemy"){if(o.done){await say(o.msg||"The bench has nothing more to give.",0,true);$("tBox").hidden=true;return;}const h=bestAt("arcana");
    const c=await choose(DECO_TEXT.alchemy,[{t:"STUDY THE RUNES",sub:oddsTag(h,"arcana",13)},{t:"LEAVE IT"}]);if(c!==0){$("tBox").hidden=true;return;}
    o.done=true;const r=await check(h,"arcana",13);
    if(r.ok){const unk=Object.keys(G.bag).filter(id=>!isKnown(id));let txt;if(unk.length){G.known.add(unk[0]);txt=`Using the bench's reagents, the ${h.name} identifies the ${ITEMS[unk[0]].unk}: it's ${aN(ITEMS[unk[0]].name)}!`;}else{addItem("potion");txt=`The ${h.name} salvages a working healing potion from the mess.`;}
      o.msg=`You've learned all the bench can teach you. (Last time: ${txt})`;await say(`${txt} (${r.txt})`,1700,true);}
    else{o.msg="The runes still make no sense.";if(r.r===1){const s=saveRoll(h,"dex",12);await say(`A flask bursts in a puff of acrid smoke! (${r.txt})`,1000,true);await dealDamage(h,s.ok?2:roll("1d6").total,"acid",{});}else await say(`The runes make no sense. (${r.txt})`,1100,true);}
    $("tBox").hidden=true;hud();return;}
  if(o.type==="skeleton"||o.type==="oldcamp"){if(o.searched){await say(o.msg,0,true);$("tBox").hidden=true;return;}const c=await choose(DECO_TEXT[o.type],[{t:"SEARCH IT"},{t:"LEAVE IT"}]);if(c!==0){$("tBox").hidden=true;return;}
    o.searched=true;G.steps+=4;let got=[];if(o.loot){if(o.type==="skeleton"){const g=ri(3,12)*G.floor;G.gold+=g;got.push(g+" gold");if(Math.random()<.4){const it=rollItem(false);if(it){addItem(it);got.push(itemName(it));}}}
      else{const it=pick(["firewood","torch","oil","ration"]);addItem(it);got.push(itemName(it));}}
    o.msg=got.length?"You've already taken what was there.":"Nothing useful here.";await say(got.length?`You find: ${got.join(", ")}.`:"Nothing useful.",1200,true);$("tBox").hidden=true;hud();return;}
  toast(DECO_TEXT[o.type]||"");}
// ---------- drawing ----------
function drawDeco(o,sx,sy,t){const X=Math.round(sx),Y=Math.round(sy);const f=(c,a,b,w,h)=>{ctx.fillStyle=c;ctx.fillRect(X+a,Y+b,w,h);};const K="#1a1216";
  switch(o.type){
  case "skeleton":f(K,2,6,12,9);f("#bdb49c",3,10,9,1);f("#bdb49c",4,12,7,1);f("#bdb49c",9,8,2,6);f("#d8d0b8",3,6,4,4);f("#e8e0cc",3,6,3,2);f(K,4,8,1,1);f(K,6,8,1,1);f("#5a4a3a",8,9,4,4);f("#bdb49c",12,13,2,1);f("#bdb49c",2,13,2,1);break;
  case "oldcamp":f(K,1,8,9,7);f("#5a5450",2,9,7,5);f("#2a2422",3,10,5,3);f("#6a6460",2,9,2,1);f("#6a6460",7,12,2,1);f("#141010",4,11,3,1);f("#7a3a2a",10,9,5,6);f("#9a4a36",10,9,5,1);f("#5a2a20",11,13,4,1);f("#8a8a90",12,6,2,2);break;
  case "animalbones":f("#cfc6ae",3,10,3,1);f("#cfc6ae",8,12,4,1);f("#e0d8c4",6,8,1,3);f("#cfc6ae",11,9,2,1);f("#b0a890",9,11,1,1);f("#e8e0cc",4,13,2,1);break;
  case "brokenweapons":f(K,2,7,12,8);f("#6a4a2a",3,12,8,1);f("#8a6a3a",3,12,6,1);f("#7a8090",8,8,1,6);f("#a8b0bc",8,8,1,3);f("#6a5a3a",7,13,3,1);f("#5a5450",11,10,3,1);f("#8a6a3a",4,9,1,3);break;
  case "furniture":f(K,1,5,14,10);f("#6a4428",2,6,12,3);f("#8a5c34",2,6,12,1);f("#5a3a22",3,9,2,5);f("#5a3a22",11,9,2,5);f("#7a5030",6,11,5,2);f("#4a2e1a",7,13,1,2);if(o.burn)f("#ff8a2a",5,4,5,2);break;
  case "alchemy":{f(K,1,5,14,10);f("#5a3e2a",2,9,12,2);f("#7a5636",2,9,12,1);f("#4a3020",3,11,2,4);f("#4a3020",11,11,2,4);
    const g=.55+.45*Math.sin(t/300);f(`rgba(130,240,255,${g})`,3,7,2,2);f("#c84a8a",7,6,2,3);f("#e8e0d0",7,5,2,1);f("#6ad060",10,7,2,2);f(`rgba(160,120,255,${g*.6})`,4,13,8,1);break;}
  case "leak":{const d=Math.floor(t/140)%8;f("#2a3a4a",7,0,2,3);f("#6aa0c8",7,1,1,2);if(d<5)f("#a8d8f0",7,3+d,1,1);break;}
  case "web":{ctx.strokeStyle="rgba(220,220,230,.55)";ctx.lineWidth=1;ctx.beginPath();for(let i=0;i<5;i++){ctx.moveTo(X+8,Y+8);ctx.lineTo(X+8+Math.cos(i*1.25)*8,Y+8+Math.sin(i*1.25)*8);}ctx.stroke();
    ctx.beginPath();ctx.arc(X+8,Y+8,3.5,0,Math.PI*2);ctx.arc(X+8,Y+8,6,0,Math.PI*2);ctx.stroke();break;}
  case "rubble":f(K,0,4,16,11);f("#6a6058",1,6,6,5);f("#7a7068",7,5,7,5);f("#5a5048",4,10,8,4);f("#8a8278",2,6,3,1);f("#948a80",8,5,3,1);f("#4a4038",11,10,3,3);break;
  case "cavein":f(K,0,0,16,16);f("#4a4240",1,1,14,14);f("#5e5650",2,2,6,5);f("#625a54",9,3,5,6);f("#544c46",3,8,7,6);f("#706860",3,2,3,1);f("#706860",10,3,2,1);f("#3a3230",8,9,1,5);f("#3a3230",2,7,5,1);break;}
  if(o.burn){const fl=Math.floor(t/90)%2;f("#ff7a1a",4,3+fl,3,4);f("#ffd040",5,4+fl,1,2);f("#ff7a1a",9,4-fl,3,4);f("#ffd040",10,5-fl,1,2);}}
