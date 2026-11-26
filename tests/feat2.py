import asyncio
from playwright.async_api import async_playwright
HOOK="""window.__t={get G(){return G},get C(){return C},get mode(){return mode},mkHero,mkMon,S:()=>S,fov,hud,unitAt,isWall,interact,parley,doorInteract,revealSecret,doRest,monByKey,heroesUp,search,exploreTap,tryMove,rollLoot,shopStock,openShop};requestAnimationFrame(loop);"""
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(executable_path="/usr/bin/google-chrome")
    pg=await b.new_page(viewport={"width":390,"height":800},device_scale_factor=2)
    errs=[];pg.on("pageerror",lambda e:errs.append(str(e)))
    html=open(""+__import__("os").path.join(__import__("os").path.dirname(__file__),"..","dist","lantern-crawl.html")+"").read();i=html.rindex("requestAnimationFrame(loop);");html=html[:i]+HOOK+html[i+28:]
    await pg.set_content("<!doctype html><html><head><meta name=viewport content='width=device-width,initial-scale=1'></head><body>"+html+"</body></html>")
    await pg.wait_for_timeout(400)
    await pg.click("#btnSetOut");await pg.click("#pick-rogue");await pg.click("#pick-race-elf" if 'feat2.py'=="bot.py" else "#pick-race-human");await pg.evaluate("window.__fast=0.02");await pg.wait_for_timeout(200)
    await pg.evaluate("window.__pick=0;setInterval(()=>{const bs=[...document.querySelectorAll('#chBtns button')].filter(x=>!x.disabled);if(!document.getElementById('chPanel').hidden&&bs.length){(bs[Math.min(window.__pick,bs.length-1)]).click();}},120)")
    async def run(name,code,pickIdx=0):
      await pg.evaluate(f"window.__pick={pickIdx}")
      try:
        r=await asyncio.wait_for(pg.evaluate("(async()=>{const t=__t,G=t.G;const L=G.party[0];"+code+"})()"),timeout=40)
        print("OK ",name,r if r is not None else "")
      except Exception as e: print("ERR",name,str(e)[:300])
      await pg.wait_for_timeout(300)
    await run("chest", "const o={type:'chest',x:L.x+1,y:L.y,loot:t.rollLoot(true),opened:false};G.objs.push(o);await t.interact(o);return JSON.stringify(G.bag)+' gold '+G.gold")
    await run("shrine pray","const o={type:'shrine',x:L.x+1,y:L.y,used:false};await t.interact(o);return 'bless '+G.blessFloor+' curse '+G.curseFloor")
    await run("runes","const o={type:'runes',x:L.x+1,y:L.y,used:false};await t.interact(o);return 'traps found '+G.traps.filter(x=>x.found).length+'/'+G.traps.length")
    await run("locked door pick","const d={type:'door',x:L.x+1,y:L.y,open:false,locked:true};G.objs.push(d);await t.doorInteract(d);return 'locked '+d.locked",1)
    await run("search","t.search();await new Promise(r=>setTimeout(r,1500));return 'ok'")
    await run("short rest","await t.doRest(false);return t.mode+' rests '+G.shortRests")
    await run("long rest tired","G.fatigue=3;await t.doRest(true);return t.mode+' fatigue '+G.fatigue")
    await pg.wait_for_timeout(1500)
    print("mode after rests:",await pg.evaluate("__t.mode"))
    await run("parley","if(t.mode!=='explore')return 'in combat';const g=t.mkMon(t.monByKey('goblin'),L.x+2,L.y);g.gid=77;g.parley=77;g.state='idle';G.mons.push(g);await t.parley(g);return 'peace '+g.peace+' mode '+t.mode",0)
    await run("merchant","t.openShop({type:'merchant',stock:t.shopStock()});document.querySelector('#shopBody button').click();return JSON.stringify(G.bag)")
    await run("mimic","if(t.mode!=='explore')return 'skip';const o={type:'chest',x:L.x,y:L.y+1,loot:t.rollLoot(false),mimic:true,opened:false,suspicious:true};G.objs.push(o);await t.interact(o);return t.mode",1)
    print("errors:",errs[:10])
    await pg.screenshot(path="/tmp/shots/feat2.png")
    await b.close()
asyncio.run(main())
