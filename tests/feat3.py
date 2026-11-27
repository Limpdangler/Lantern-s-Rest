import asyncio
from playwright.async_api import async_playwright
HOOK="""window.__t={get G(){return G},get C(){return C},get mode(){return mode},get busy(){return busy},mkHero,mkMon,monByKey,fov,hud,tryMove,search,exploreTap,toggleSneak,toggleLight,noticesParty,doRest,marchMenu,startCombat,stairsPrompt,actionButtons,spotLurkers,loreCheck,heroesUp,torchInteract,S:()=>S};requestAnimationFrame(loop);"""
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(executable_path="/usr/bin/google-chrome")
    pg=await b.new_page(viewport={"width":390,"height":800},device_scale_factor=2)
    errs=[];pg.on("pageerror",lambda e:errs.append(str(e)))
    html=open(""+__import__("os").path.join(__import__("os").path.dirname(__file__),"..","dist","lantern-crawl.html")+"").read();i=html.rindex("requestAnimationFrame(loop);");html=html[:i]+HOOK+html[i+28:]
    await pg.set_content("<!doctype html><html><head><meta name=viewport content='width=device-width,initial-scale=1'></head><body>"+html+"</body></html>")
    await pg.wait_for_timeout(400)
    await pg.evaluate("window.__skipIntro=true");await pg.click("#btnSetOut");await pg.click("#pick-fighter");await pg.wait_for_timeout(100);await pg.screenshot(path="/tmp/shots/race.png");await pg.click("#pick-race-dwarf")
    await pg.evaluate("window.__fast=0.02");await pg.wait_for_timeout(200)
    await pg.evaluate("window.__pick=0;setInterval(()=>{const bs=[...document.querySelectorAll('#chBtns button')].filter(x=>!x.disabled);if(!document.getElementById('chPanel').hidden&&bs.length){(bs[Math.min(window.__pick,bs.length-1)]).click();}},120)")
    async def run(name,code,pickIdx=0):
      await pg.evaluate(f"window.__pick={pickIdx}")
      try:
        r=await asyncio.wait_for(pg.evaluate("(async()=>{const t=__t,G=t.G;var L=G.party[0];const W=ms=>new Promise(r=>setTimeout(r,ms));"+code+"})()"),timeout=40)
        print("OK ",name,r if r is not None else "")
      except Exception as e: print("ERR",name,str(e)[:300])
      await pg.wait_for_timeout(300)
    await run("race","return L.race+' dv '+(L.race==='dwarf')+' maxhp '+L.maxHp+' con '+L.def.con")
    await run("add party","for(const id of ['rogue','cleric','wizard']){const h=t.mkHero(t.S().classes.find(c=>c.id===id),'elf');h.x=L.x;h.y=L.y;G.party.push(h);}G.mons=[];t.fov();t.hud();return G.party.map(h=>h.name).join()")
    await run("march","t.marchMenu(2);await W(800);return G.party.map(h=>h.name).join()",0)
    await run("sneak notice","L=G.party[0];t.toggleSneak(true);const m=t.mkMon(t.monByKey('goblin'),L.x+3,L.y,false);m.state='idle';G.mons.push(m);t.fov();const n=t.noticesParty(m);const rolls=G.party.map(h=>h.sneak).join();t.toggleSneak(false);const n2=t.noticesParty(m);G.mons=[];return 'sneaking noticed='+n+' rolls '+rolls+' pp '+(10+(-1))+' | not sneaking noticed='+n2")
    await run("search once","await t.search();await W(300);const a=G.searched.size;await t.search();return 'searched areas '+a+' after second '+G.searched.size")
    await run("light off","t.toggleLight();t.fov();const v1=G.vis.size;t.toggleLight();t.fov();return 'vis off '+v1+' on '+G.vis.size+' fuel '+G.fuel")
    await run("torch","L=G.party[0];const tc=G.torches[0];if(!tc)return 'no torch';L.x=tc.x;L.y=tc.y+1;t.fov();await t.torchInteract(tc);return 'out '+tc.out",0)
    await run("lurker spot","const m=t.mkMon(t.monByKey('spider'),L.x+2,L.y,false);m.state='idle';m.lurk=true;m.hide=5;G.mons.push(m);t.fov();t.spotLurkers();return 'spotted '+m.spotted+' (may be false if not visible)'")
    await run("lore","G.lore={};await t.loreCheck();return JSON.stringify(G.lore)")
    await run("ambush surprise","G.mons=[];const m=t.mkMon(t.monByKey('goblin'),L.x+2,L.y,false);m.state='sleep';G.mons.push(m);t.startCombat({bumped:m,partyFirst:true});await W(2500);return 'goblin surprised? '+(m.st.surprised||'(used)')+' mode '+t.mode")
    await pg.wait_for_timeout(3000)
    await run("end combat","for(const m of G.mons)m.hp=0;G.mons=[];return t.mode")
    await pg.wait_for_timeout(3000)
    await run("camp","G.mons=[];G.fatigue=3;for(const h of G.party)h.hp=1;await t.doRest(true);await W(3000);return 'mode '+t.mode+' hp '+G.party.map(h=>h.hp+'/'+h.maxHp+' hd'+h.hdLeft).join()+' bag '+JSON.stringify(G.bag)+' cold '+G.coldUsed",1)
    await run("camp ambush","G.fatigue=3;for(let i=0;i<3;i++){const m=t.mkMon(t.monByKey('goblin'),L.x+8,L.y+i,false);m.state='idle';m.gid=55;G.mons.push(m);}Math.random=()=>0.01;await t.doRest(true);await W(2500);return 'mode '+t.mode+' st '+G.party.map(h=>JSON.stringify(h.st)).join(' ')",0)
    await pg.screenshot(path="/tmp/shots/f3.png")
    print("errors",errs)
    await b.close()
asyncio.run(main())
