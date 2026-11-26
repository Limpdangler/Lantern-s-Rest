import asyncio
from playwright.async_api import async_playwright
HOOK="""window.__t={get G(){return G},get mode(){return mode},mkMon,monByKey,monsterDies,corpseInteract,decoInteract,doorInteract,tickFire,setAlight,fov,startCombat,heroSpr};requestAnimationFrame(loop);"""
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(executable_path="/usr/bin/google-chrome")
    pg=await b.new_page(viewport={"width":390,"height":800},device_scale_factor=2)
    errs=[];pg.on("pageerror",lambda e:errs.append(str(e)))
    html=open(""+__import__("os").path.join(__import__("os").path.dirname(__file__),"..","dist","lantern-crawl.html")+"").read();i=html.rindex("requestAnimationFrame(loop);");html=html[:i]+HOOK+html[i+28:]
    await pg.set_content("<!doctype html><html><head><meta name=viewport content='width=device-width,initial-scale=1'></head><body>"+html+"</body></html>")
    await pg.wait_for_timeout(300);await pg.click("#btnSetOut");await pg.click("#pick-rogue");await pg.click("#pick-race-tiefling");await pg.evaluate("window.__fast=0.02")
    await pg.evaluate("setInterval(()=>{const bs=[...document.querySelectorAll('#chBtns button')].filter(x=>!x.disabled);if(!document.getElementById('chPanel').hidden&&bs.length)bs[0].click();},150)")
    await pg.wait_for_timeout(800)
    async def run(n,code):
      try:print("OK",n,await asyncio.wait_for(pg.evaluate("(async()=>{const t=__t,G=t.G,L=G.party[0];const W=ms=>new Promise(r=>setTimeout(r,ms));"+code+"})()"),30))
      except Exception as e:print("ERR",n,str(e)[:300])
    await run("dressing count","return G.objs.filter(o=>o.deco).map(o=>o.type).join(',')+' | rubble '+G.objs.filter(o=>o.type==='rubble'||o.type==='cavein').map(o=>o.type).join(',')+' | iron doors '+G.objs.filter(o=>o.type==='door'&&o.iron).length")
    await run("corpse","const m=t.mkMon(t.monByKey('goblin'),L.x+1,L.y,false);m.hasKey=true;G.mons.push(m);await t.monsterDies(m,{});const c=G.corpses[G.corpses.length-1];await t.corpseInteract(c);await W(300);const k=G.bag.key;await t.corpseInteract(c);return 'corpses '+G.corpses.length+' key '+k+' msg '+c.msg")
    await run("door burn","const d={type:'door',x:L.x,y:L.y-1,open:false,locked:true};G.objs.push(d);t.setAlight(d);for(let i=0;i<8;i++)t.tickFire();return 'burnt '+d.burnt+' open '+d.open")
    await run("deco interact","const o=G.objs.find(o=>o.type==='skeleton');if(!o)return 'no skel';await t.decoInteract(o);await W(200);await t.decoInteract(o);return o.msg")
    await run("kill 3 goblins AC","for(let i=0;i<3;i++){const m=t.mkMon(t.monByKey('goblin'),L.x+1,L.y,false);G.mons.push(m);await t.monsterDies(m,{});}return JSON.stringify(G.killCount)")
    await pg.wait_for_timeout(500);await pg.screenshot(path="/tmp/shots/f5.png")
    print("errors",errs);await b.close()
asyncio.run(main())
