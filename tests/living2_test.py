# Parley without a shared language, pits, darts, doors under pressure, thaumaturgy, bandits, and fights you walk into.
import asyncio,os
from playwright.async_api import async_playwright
DIST=os.path.join(os.path.dirname(os.path.abspath(__file__)),"..","dist","lantern-crawl.html")
HOOK="""window.__t={get G(){return G},get C(){return C},setC:v=>{C=v;},get mode(){return mode},setMode:v=>{mode=v;busy=false;},S:()=>S,mkMon,mkHero,monByKey,genFloor,triggerTrap,objAt,isWall,gnd,pitAt,tryMove,
  doorPressure,sneakyDoors,thaumTargets,thaumaturgy,spawnRivals,spawnSkirmish,skUnits,skReveal,skRound,skAftermath,skApplyPhase,targetsOf,monsterTurn,checkEnd,startCombat,corpseInteract,rivalJoin,rivalBetray,victory};requestAnimationFrame(loop);"""
CLICKER="""window.__want=null;setInterval(()=>{const bs=[...document.querySelectorAll('#chBtns button')].filter(b=>!b.disabled&&b.offsetParent);if(!bs.length)return;
  const b=(window.__want&&bs.find(x=>new RegExp(window.__want).test(x.textContent)))||bs[0];b.click();},30);"""
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(executable_path="/usr/bin/google-chrome");pg=await b.new_page(viewport={"width":412,"height":860});errs=[];pg.on("pageerror",lambda e:errs.append(str(e)))
    html=open(DIST).read();i=html.rindex("requestAnimationFrame(loop);");html=html[:i]+HOOK+html[i+28:]
    await pg.set_content("<body>"+html+"</body>");await pg.wait_for_timeout(300);await pg.evaluate(CLICKER)
    await pg.evaluate("window.__skipIntro=true");await pg.click("#btnSetOut");await pg.click("#pick-fighter");await pg.click("#pick-race-tiefling");await pg.wait_for_timeout(600);await pg.evaluate("window.__fast=0.01")
    r=await pg.evaluate("""(async()=>{const t=__t,G=t.G,L=G.party[0];const o={};const R=Math.random;
      let spot=null;for(let sd=3;sd<80&&!spot;sd++){G.seed=sd;G.floor=2;t.genFloor();G.mons=[];G.npc=null;G.skirmishes=[];G.rivals=[];
        for(let y=3;y<G.H-3&&!spot;y++)for(let x=3;x<G.W-8;x++){let ok=true;for(let k=-2;k<=6;k++)for(let dy=-2;dy<=2;dy++)if(t.isWall(x+k,y+dy)||t.objAt(x+k,y+dy)||t.gnd(x+k,y+dy))ok=false;if(ok){spot=[x,y];break;}}}
      const [sx,sy]=spot;L.x=sx;L.y=sy;
      // pit: fall in, climb out with the rope
      const tr={x:sx+1,y:sy,type:'pit',dc:30,found:false,done:false};G.traps.push(tr);L.x=sx+1;Math.random=()=>0.01;await t.triggerTrap(tr,L);Math.random=R;o.pit=[!!t.pitAt(sx+1,sy),L.x===sx+1];
      G.bag.rope=1;window.__want='ROPE';const f0=G.fatigue;await t.tryMove(1,0,true);window.__want=null;o.climb=[L.x!==sx+1||L.y!==sy,G.fatigue>f0||!t.S().rules.fatigue];
      L.x=sx;L.y=sy;
      // dart that misses leaves a dart
      const dt={x:sx+3,y:sy+1,type:'darts',dc:12,found:false,done:false};const n0=G.objs.length;L.x=sx+3;L.y=sy+1;Math.random=()=>0.0;await t.triggerTrap(dt,L);Math.random=R;o.dart=G.objs.slice(n0).some(q=>q.type==='dart');L.x=sx;L.y=sy;
      // a wedged door with an orc behind it
      const d={type:'door',x:sx+4,y:sy-2,open:false,wedged:true};G.objs.push(d);const orc=t.mkMon(t.monByKey('orc')||t.monByKey('goblin'),sx+5,sy-2);orc.state='hunt';G.mons=[orc];
      Math.random=()=>0.01;await t.doorPressure();Math.random=R;o.door=[d.open,G.alertUntil>=G.steps];
      // a goblin sneaking through a closed door
      G.alertUntil=-1;const d2={type:'door',x:sx+6,y:sy,open:false};G.objs.push(d2);const gb=t.mkMon(t.monByKey('goblin'),sx+6,sy);gb.state='patrol';G.mons=[gb];Math.random=()=>0.99;await t.sneakyDoors();Math.random=R;o.sneak=[d2.open,G.alertUntil>=G.steps];
      // thaumaturgy
      G.torches.push({x:sx+2,y:sy-3,lx:sx+2,ly:sy-2});const tgs=t.thaumTargets(L);o.thaum=tgs.length;const out0=G.torches.filter(q=>q.out).length+(G.deadLights||[]).length;window.__want="SNUFF";await t.thaumaturgy(L,false);window.__want=null;o.thaumOut=G.torches.filter(q=>q.out).length+(G.deadLights||[]).length>out0;
      G.mons=[];G.objs=G.objs.filter(q=>q!==d&&q!==d2);
      // bandits
      let hostile=0,disguised=0;for(let i=0;i<60;i++){G.rivals=[];G.mons=[];G.floor=3;t.spawnRivals();const co=G.rivals[0];if(!co)continue;if(co.hostile)hostile++;if(co.bandit)disguised++;}o.bandits=[hostile,disguised];
      return o;})()""")
    r2=await pg.evaluate("""(async()=>{const t=__t,G=t.G,L=G.party[0];const o={};const R=Math.random;t.setMode('explore');t.setC(null);
      // skirmish: walk into a running fight and join it
      let sk=null;for(let s=1;s<80&&!sk;s++){G.seed=s*13;G.floor=2;t.genFloor();G.mons=G.mons.filter(m=>m.skirmish);G.rivals=[];G.npc=null;sk=(G.skirmishes||[]).find(q=>q.floor===G.floor&&q.sides.some(sd=>sd.neutral));}
      o.found=!!sk;if(!sk)return o;sk.phase='middle';const u=t.skUnits(sk);const p=u[0];L.x=p.x-3;L.y=p.y;for(const h of G.party){h.x=L.x;h.y=L.y;}
      window.__want='JOIN';await t.skReveal(sk);window.__want=null;await new Promise(r=>setTimeout(r,400));o.joined=[t.mode,sk.state];
      const C=t.C;o.units=C?C.units.length:0;const hostile=t.skUnits(sk).find(m=>!m.neutral);const neutral=t.skUnits(sk).find(m=>m.neutral);
      o.targets=hostile?[t.targetsOf(hostile).some(q=>q.side==='h'),t.targetsOf(hostile).some(q=>q.neutral)]:null;o.neutralTargetsHeroes=neutral?t.targetsOf(neutral).some(q=>q.side==='h'):null;
      t.setC(null);t.setMode('explore');
      // watching a fight play out, then an aftermath with hurt bandits
      sk.state='watching';for(const m of t.skUnits(sk)){m.peace=true;m.inCombat=false;m.state='idle';}L.x=2;L.y=2;let rounds=0;while(sk.state==='watching'&&rounds<60){await t.skRound(sk);rounds++;}o.watch=[sk.state,rounds<60];
      return o;})()""")
    print(r,r2,errs)
    ok=(not errs and r["pit"]==[True,True] and r["climb"][0] and r["climb"][1] and r["dart"] and r["door"][0] and r["door"][1] and r["sneak"][0] and not r["sneak"][1] and r["thaum"]>=1 and r["thaumOut"]
      and r["bandits"][0]>=1 and r["bandits"][1]>=1 and r2["found"] and r2["joined"][0]=="combat" and r2["units"]>=3 and r2["targets"]==[True,True] and r2["neutralTargetsHeroes"]==False and r2["watch"][0]=="done")
    print("PASS" if ok else "FAIL");await b.close()
asyncio.run(main())
