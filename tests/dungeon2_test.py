# Themed rooms & furniture, flipping tables for cover, toppling pillars, routed foes who come back, rival adventurers.
import asyncio,os
from playwright.async_api import async_playwright
DIST=os.path.join(os.path.dirname(os.path.abspath(__file__)),"..","dist","lantern-crawl.html")
HOOK="""window.__t={get G(){return G},get mode(){return mode},setMode:v=>{mode=v;busy=false;},get C(){return C},setC:v=>{C=v;},S:()=>S,mkMon,monByKey,genFloor,coverOf,flipTable,topple,checkEnd,grudgeTick,spawnRivals,rivalJoin,rivalSplit,rivalMembers,
  burnObjects,setAlight,objAt,isWall,blocksObj,reachCount,d2Buttons,heroesUp,isWooden,drawDeco,ROOM_THEMES,enterable,attackMods,weaponOf,monsterFire,barricade,allyTurn,rivalBetray,heroTurn,nextTurn,G2:()=>G,throwOil,igniteAt,GROUND,gnd,wrapAttack:()=>{const ab=attack;window.__sw=0;attack=async(...a)=>{window.__sw++;return ab(...a);};}};requestAnimationFrame(loop);"""
CLICKER="""window.__want=null;setInterval(()=>{const bs=[...document.querySelectorAll('#chBtns button')].filter(b=>!b.disabled&&b.offsetParent);if(!bs.length)return;
  const b=(window.__want&&bs.find(x=>new RegExp(window.__want).test(x.textContent)))||bs[0];b.click();},30);"""
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(executable_path="/usr/bin/google-chrome");pg=await b.new_page(viewport={"width":412,"height":860},has_touch=True);errs=[];pg.on("pageerror",lambda e:errs.append(str(e)))
    html=open(DIST).read();i=html.rindex("requestAnimationFrame(loop);");html=html[:i]+HOOK+html[i+28:]
    await pg.set_content("<body>"+html+"</body>");await pg.wait_for_timeout(300);await pg.evaluate(CLICKER)
    await pg.evaluate("window.__skipIntro=true");await pg.click("#btnSetOut");await pg.click("#pick-fighter");await pg.click("#pick-race-human");await pg.wait_for_timeout(500);await pg.evaluate("document.getElementById('kA').click()");await pg.wait_for_timeout(200)
    await pg.evaluate("window.__fast=0.01")
    r=await pg.evaluate("""(async()=>{const t=__t,G=t.G;const o={};
      // themes over many floors
      const themes={},types={};let rivals=0,big=0;for(let s=1;s<=40;s++){G.seed=s*31;G.floor=1+(s%4);t.genFloor();for(const r of G.rooms){if(r.theme)themes[r.theme]=(themes[r.theme]||0)+1;if(r.w>=10)big++;}
        for(const ob of G.objs)types[ob.type]=(types[ob.type]||0)+1;if(G.mons.some(m=>m.rival))rivals++;}
      o.themes=Object.keys(themes).length;o.types=['table','pillar','crate','shelf','cask','bed','pew','altar','cage','flasks'].filter(k=>types[k]);o.rivals=rivals;o.big=big;
      // draw every new piece once
      for(const ty of ['table','pillar','fallen','crate','shelf','flasks','rack','cask','altar','bed','pew','cauldron','cage','shackles','straw','toppled'])t.drawDeco({type:ty,x:3,y:3,deco:true,tid:0,prisoner:true},40,40,1000);
      // a flipped table gives cover
      const L=G.party[0];let spot=null;for(let sd=7;sd<60&&!spot;sd++){G.seed=sd;G.floor=2;t.genFloor();G.mons=[];G.npc=null;
      for(let y=2;y<G.H-2&&!spot;y++)for(let x=2;x<G.W-8;x++){let ok=true;for(let k=-1;k<=6;k++)for(let dy=-1;dy<=1;dy++)if(t.isWall(x+k,y+dy)||t.objAt(x+k,y+dy))ok=false;if(ok){spot=[x,y];break;}}}
      const [sx,sy]=spot;L.x=sx;L.y=sy;const g=t.mkMon(t.monByKey('archer'),sx+5,sy);G.mons.push(g);const tb={type:'table',x:sx+1,y:sy,deco:true,tid:99};G.objs.push(tb);
      o.cover0=t.coverOf(g,L);t.flipTable(tb);o.cover1=t.coverOf(g,L);o.wood=t.isWooden(tb);
      // toppling a pillar onto a goblin
      tb.gone=true;const pil={type:'pillar',x:sx+1,y:sy,deco:true};G.objs.push(pil);const gob=t.mkMon(t.monByKey('goblin'),sx+2,sy);gob.hp=gob.maxHp=40;gob.inCombat=true;G.mons.push(gob);
      t.setC({units:[L,gob,g],cur:L,round:1,xp:0,actions:1,bonus:true,attacksLeft:0,moveLeft:6,panel:'main',objUsed:false});
      o.btns=t.d2Buttons(L).map(b=>b.t).join('|');
      const hit=await t.topple(pil,L,1,0);o.topple=[hit.length,40-gob.hp,G.objs.filter(q=>q.type==='fallen'&&!q.gone).length];
      // everyone left is running: the fight ends and they hold a grudge
      G.mons=[gob];gob.fleeing=true;gob.tr=Object.assign({},gob.tr,{morale:true});window.__fastVic=1;
      t.setC({units:[L,gob],cur:L,round:1,xp:0,actions:1,bonus:true,attacksLeft:0,moveLeft:6,panel:'main'});t.setMode('combat');t.checkEnd();await new Promise(r=>setTimeout(r,1500));
      o.routed=[t.mode,G.mons.length,(G.grudges||[]).length];
      const gr=G.grudges[0];gr.back=true;gr.at=0;t.setMode('explore');t.setC(null);const ok=await t.grudgeTick();await new Promise(r=>setTimeout(r,300));o.ambush=[ok,t.mode,G.mons.filter(m=>m.grudge).length];
      return o;})()""")
    await pg.wait_for_timeout(500)
    r2=await pg.evaluate("""(async()=>{const t=__t,G=t.G;const o={};t.setMode('explore');t.setC(null);
      // rivals: force a party onto this floor, team up, then split the gold at the ladder
      G.mons=[];G.floor=3;let n=0;const R=Math.random;Math.random=()=>0.1;t.spawnRivals();Math.random=R;const co=G.rivals.find(c=>c.floor===G.floor);o.spawned=co?t.rivalMembers(co).length:0;
      if(co){const p0=G.party.length;await t.rivalJoin(co);o.joined=G.party.length-p0;G.gold+=100;window.__want='PAY';await t.rivalSplit();window.__want=null;o.split=[G.party.length,p0,co.gold0+100-G.gold];}
      // flasks burst into flame when fire reaches them
      const L=G.party[0];const fl={type:'flasks',x:L.x+2,y:L.y,deco:true};G.objs.push(fl);G.fire.set(L.y*G.W+L.x+3,3);t.burnObjects();o.blown=[!!fl.blown,G.fire.size>=5];
      return o;})()""")
    await pg.wait_for_timeout(500)
    r3=await pg.evaluate("""(async()=>{const t=__t,G=t.G;const o={};t.setMode('explore');t.setC(null);G.mons=[];G.party=G.party.filter(h=>!h.rival);const L=G.party[0];L.hp=L.maxHp;L.down=false;L.dead=false;L.st={};
      let spot=null;for(let sd=3;sd<80&&!spot;sd++){G.seed=sd;G.floor=2;t.genFloor();G.mons=[];G.npc=null;G.party=G.party.slice(0,1);
        for(let y=2;y<G.H-2&&!spot;y++)for(let x=2;x<G.W-8;x++){let ok=true;for(let k=-1;k<=6;k++)for(let dy=-1;dy<=1;dy++)if(t.isWall(x+k,y+dy)||t.objAt(x+k,y+dy)||t.gnd(x+k,y+dy))ok=false;if(ok){spot=[x,y];break;}}}
      const [sx,sy]=spot;L.x=sx;L.y=sy;
      // climbing a table in a fight
      const tb={type:'table',x:sx+1,y:sy,deco:true,tid:77};G.objs.push(tb);const gob=t.mkMon(t.monByKey('goblin'),sx+3,sy);gob.inCombat=true;G.mons.push(gob);
      o.climbOut=t.enterable(L,sx+1,sy);t.setC({units:[L,gob],cur:L,round:1,xp:0,actions:1,bonus:true,attacksLeft:0,moveLeft:6,panel:'main'});o.climbIn=t.enterable(L,sx+1,sy);
      L.x=sx+1;const m1=t.attackMods(L,gob,t.weaponOf(L,'main'));const m2=t.attackMods(gob,L,t.weaponOf(gob));o.tableMods=[m1.notes.join(';'),m2.notes.join(';')];L.x=sx;tb.gone=true;
      // a goblin with a torch sets the oil under a hero alight
      for(const [a,b] of [[0,0],[1,0],[0,1],[1,1]])G.ground[sy+b][sx+a]=t.GROUND.oil;gob.kit=true;gob.torch=true;const R=Math.random;Math.random=()=>0.1;const used=await t.monsterFire(gob);Math.random=R;o.torch=[used,G.fire.size>0,!!gob.torch];
      G.fire.clear();for(let a=0;a<2;a++)for(let b=0;b<2;b++)G.ground[sy+b][sx+a]=0;
      // a kobold throws oil
      const kb=t.mkMon(t.monByKey('kobold'),sx+4,sy);kb.kit=true;kb.oil=1;kb.inCombat=true;G.mons=[kb];Math.random=()=>0.1;const u2=await t.monsterFire(kb);Math.random=R;o.oil=[u2,t.gnd(sx,sy)===t.GROUND.oil];
      for(let a=-1;a<3;a++)for(let b=-1;b<3;b++)if(G.ground[sy+b]&&G.ground[sy+b][sx+a]===t.GROUND.oil)G.ground[sy+b][sx+a]=0;
      t.setC(null);t.setMode('explore');
      // barricade
      const d={type:'door',x:sx+5,y:sy,open:true};G.objs.push(d);const cr={type:'crate',x:sx+2,y:sy,deco:true};G.objs.push(cr);await t.barricade(cr,d);
      o.bar=[d.barred,d.wedged,cr.gone,t.enterable(kb,sx+5,sy)];d.gone=true;
      // rival ally fights on their own, then betrays
      G.mons=[];G.floor=3;Math.random=()=>0.1;t.spawnRivals();Math.random=R;const co=G.rivals.find(c=>c.floor===G.floor);await t.rivalJoin(co);
      const al=G.party.find(h=>h.rival);const foe=t.mkMon(t.monByKey('goblin'),al.x+1,al.y);foe.hp=foe.maxHp=200;foe.inCombat=true;G.mons.push(foe);
      t.setC({units:[al,foe],cur:al,round:1,xp:0,actions:1,bonus:true,attacksLeft:0,moveLeft:6,panel:'main',idx:0});t.setMode('combat');
      const hp0=foe.hp;t.wrapAttack();t.heroTurn(al);await new Promise(r=>setTimeout(r,1500));o.ally=window.__sw;
      t.setC(null);t.setMode('explore');G.mons=[];const n0=G.party.length;await t.rivalBetray(co);await new Promise(r=>setTimeout(r,500));o.betray=[n0-G.party.length,G.mons.filter(m=>m.rival&&!m.peace).length,t.mode,(G.rivalPast||[]).length];
      return o;})()""")
    print(r3)
    out={**r,**r2,**r3};print(out,errs)
    ok=(not errs and r["themes"]>=8 and len(r["types"])>=9 and r["rivals"]>=3 and r["big"]>=3 and r["cover0"]==0 and r["cover1"]>=2 and r["wood"]
      and "FLIP" not in r["btns"] and "TOPPLE" in r["btns"] and r["topple"][0]==1 and r["topple"][1]>0 and r["topple"][2]>=1
      and r["routed"][1]==0 and r["routed"][2]==1 and r["ambush"][0] and r["ambush"][1]=="combat" and r["ambush"][2]>=2
      and r2["spawned"]>=2 and r2["joined"]==r2["spawned"] and r2["split"][0]==r2["split"][1] and r2["split"][2]==50 and r2["blown"][0] and r2["blown"][1])
    ok=ok and r3["climbIn"] and not r3["climbOut"] and "table" in r3["tableMods"][0] and "table" in r3["tableMods"][1] and r3["torch"][0] and r3["torch"][1] and not r3["torch"][2] and r3["oil"][0] and r3["oil"][1] and r3["bar"][0]=="crate" and r3["bar"][1] and r3["bar"][2] and not r3["bar"][3] and r3["ally"]>=1 and r3["betray"][0]>=1 and r3["betray"][1]>=1
    print("PASS" if ok else "FAIL");await b.close()
asyncio.run(main())
