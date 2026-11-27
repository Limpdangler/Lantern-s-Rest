# Listening at doors, deep water, smoke, the new traps and carrying capacity.
import asyncio,os
from playwright.async_api import async_playwright
DIST=os.path.join(os.path.dirname(os.path.abspath(__file__)),"..","dist","lantern-crawl.html")
HOOK="""window.__t={get G(){return G},mkHero,mkMon,monByKey,listenAtDoor,triggerTrap,addSmoke,los,packLoad,packCap,overloaded,speedOf,enterable,addItem,S:()=>S,buildTerrain};requestAnimationFrame(loop);"""
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(executable_path="/usr/bin/google-chrome");pg=await b.new_page();errs=[];pg.on("pageerror",lambda e:errs.append(str(e)))
    html=open(DIST).read();i=html.rindex("requestAnimationFrame(loop);");html=html[:i]+HOOK+html[i+28:]
    await pg.set_content("<body>"+html+"</body>");await pg.wait_for_timeout(300)
    await pg.evaluate("window.__skipIntro=true");await pg.click("#btnSetOut");await pg.click("#pick-fighter");await pg.click("#pick-race-human");await pg.evaluate("window.__fast=0.01");await pg.wait_for_timeout(300)
    r=await pg.evaluate("""(async()=>{const t=__t,G=t.G,L=G.party[0];const out={};
      const d=G.objs.find(o=>o.type==='door')||{type:'door',x:L.x+2,y:L.y,open:false};const m=t.mkMon(t.monByKey('goblin'),d.x+3,d.y,false);G.mons.push(m);await t.listenAtDoor(d);out.heard=d.heard;
      G.ground[L.y][L.x+1]=6;out.heavyCanSwim=t.enterable(L,L.x+1,L.y);L.armourOff=true;out.unarmouredCanSwim=t.enterable(L,L.x+1,L.y);L.armourOff=false;G.ground[L.y][L.x+1]=0;
      t.addSmoke(L.x+2,L.y,3);G.smoke.set(L.y*G.W+L.x+2,3);out.smokeBlocks=!t.los(L.x,L.y,L.x+4,L.y);G.smoke.clear();
      L.maxHp=L.hp=200;const gas={x:L.x,y:L.y,type:'gas',dc:12};await t.triggerTrap(gas,L);out.afterGas=L.hp;const ceil={x:L.x,y:L.y,type:'ceiling',dc:12};await t.triggerTrap(ceil,L);out.afterCeiling=L.hp;out.rubble=G.ground[L.y][L.x]===2;
      out.load=t.packLoad();out.cap=t.packCap();const sp=t.speedOf(L);t.addItem('firewood',30);out.over=t.overloaded();out.speedDrop=sp-t.speedOf(L);return out;})()""")
    print(r,errs);ok=not errs and r["heavyCanSwim"]==False and r["unarmouredCanSwim"]==True and r["smokeBlocks"] and r["afterCeiling"]<200 and r["over"] and r["speedDrop"]==2
    print("PASS" if ok else "FAIL");await b.close()
asyncio.run(main())
