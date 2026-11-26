import asyncio
from playwright.async_api import async_playwright
HOOK="""window.__t={get G(){return G},get mode(){return mode},mkHero,mkMon,monByKey,monsterDies,corpseInteract,fov,rangerTrack,rangerForage,owlFly,detectMagic,identifyRitual,classActions,throwPebble,pickpocket,rearmTrap,speakWithDead,speakWithAnimals,chooseFeats,startWild,doMove,makeCorpse,S:()=>S,addItem,check,heroesUp,reset:()=>{mode="explore";C=null;busy=false;showCombatUI(false);}};requestAnimationFrame(loop);"""
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(executable_path="/usr/bin/google-chrome")
    pg=await b.new_page(viewport={"width":390,"height":800})
    errs=[];pg.on("pageerror",lambda e:errs.append(str(e)))
    html=open(""+__import__("os").path.join(__import__("os").path.dirname(__file__),"..","dist","lantern-crawl.html")+"").read();i=html.rindex("requestAnimationFrame(loop);");html=html[:i]+HOOK+html[i+28:]
    await pg.set_content("<body>"+html+"</body>")
    await pg.wait_for_timeout(300);await pg.click("#btnSetOut");await pg.click("#pick-ranger");await pg.click("#pick-race-elf");await pg.evaluate("window.__fast=0.02")
    await pg.evaluate("setInterval(()=>{const bs=[...document.querySelectorAll('#chBtns button')].filter(x=>!x.disabled);if(!document.getElementById('chPanel').hidden&&bs.length)bs[0].click();},150)")
    await pg.wait_for_timeout(800)
    async def run(n,code):
      try:print("OK",n,await asyncio.wait_for(pg.evaluate("(async()=>{const t=__t,G=t.G;var L=G.party[0];const W=ms=>new Promise(r=>setTimeout(r,ms));"+code+"})()"),40))
      except Exception as e:print("ERR",n,str(e)[:300])
    await run("party","for(const id of ['wizard','cleric','druid']){const h=t.mkHero(t.S().classes.find(c=>c.id===id),'human');h.x=L.x;h.y=L.y;G.party.push(h);}const r=t.mkHero(t.S().classes.find(c=>c.id==='rogue'),'halfling');r.x=L.x;r.y=L.y;G.party.push(r);t.fov();return G.party.map(h=>h.id+':'+t.classActions(h).length).join(',')")
    await run("track","await t.rangerTrack(G.party[0]);return G.trackMsg")
    await run("forage","const b=G.bag.ration;await t.rangerForage(G.party[0]);return 'rations '+b+'->'+G.bag.ration")
    await run("owl","await t.owlFly(L.x+3,L.y);return JSON.stringify(G.owl)")
    await run("detect","await t.detectMagic(G.party[1]);return 'ok'")
    await run("identify","t.addItem('ring');await t.identifyRitual(G.party[1]);return 'known '+G.known.has('ring')")
    await run("pebble","G.pebble=G.party[4];t.throwPebble(L.x+2,L.y);return 'ok'")
    await run("pickpocket","const m=t.mkMon(t.monByKey('goblin'),L.x+1,L.y,false);m.state='sleep';m.hasKey=true;G.mons.push(m);await t.pickpocket(G.party[4],m);await W(500);return 'mode '+t.mode+' key '+(G.bag.key||0)")
    await run("reset","t.reset();G.mons=[];return t.mode")
    await run("speak dead","const m=t.mkMon(t.monByKey('orc'),L.x+1,L.y,false);t.makeCorpse(m);const c=G.corpses[G.corpses.length-1];await t.speakWithDead(G.party[2],c);return 'spoken '+c.spoken")
    await run("speak animals","const g=[t.mkMon(t.monByKey('wolf'),L.x+3,L.y,false)];g[0].gid=77;G.mons.push(g[0]);const ok=await t.speakWithAnimals(G.party[3],g);G.mons=[];return 'calmed '+ok")
    await run("rat form","t.startWild(G.party[3],'rat');return JSON.stringify(G.party[3].wild)")
    await run("feats","G.level=4;await t.chooseFeats();return G.party.map(h=>h.id+':'+(h.feats||[]).join('/')+':'+h.picks).join(',')")
    await run("guidance","const c=G.party[0];c.guided=true;const r=await t.check(c,'survival',10,{quiet:true});return r.txt+' guided now '+c.guided")
    print("errors",errs);await b.close()
asyncio.run(main())
