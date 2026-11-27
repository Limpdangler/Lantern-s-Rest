# Backgrounds and the extra skill checks: carvings (History), mushrooms (Nature), Acrobatics dodges, hidden rival backgrounds.
import asyncio
from playwright.async_api import async_playwright
import os
DIST=os.path.join(os.path.dirname(os.path.abspath(__file__)),"..","dist","lantern-crawl.html")
HOOK="""window.__t={get G(){return G},genFloor,decoInteract,EVENTS,rivalJoin,spawnRivals,skillBonus,dodgeRoll,mkHero,S:()=>S,setMode:v=>{mode=v;busy=false;},get mode(){return mode}};requestAnimationFrame(loop);"""
CLICKER="""window.__want=null;setInterval(()=>{const bs=[...document.querySelectorAll('#chBtns button')].filter(b=>!b.disabled&&b.offsetParent);if(!bs.length)return;
  const b=(window.__want&&bs.find(x=>new RegExp(window.__want).test(x.textContent)))||bs[0];b.click();},30);"""
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(executable_path="/usr/bin/google-chrome");pg=await b.new_page(viewport={"width":412,"height":860});errs=[];pg.on("pageerror",lambda e:errs.append(str(e)))
    html=open(DIST).read();i=html.rindex("requestAnimationFrame(loop);");html=html[:i]+HOOK+html[i+28:]
    await pg.set_content("<body>"+html+"</body>");await pg.wait_for_timeout(300);await pg.evaluate(CLICKER)
    await pg.evaluate("window.__skipIntro=true");await pg.click("#btnSetOut");await pg.click("#pick-rogue");await pg.click("#pick-race-human");await pg.wait_for_timeout(600);await pg.evaluate("window.__fast=0.01")
    r=await pg.evaluate("""(async()=>{const t=__t,G=t.G;const o={};let mur=0,fun=0;for(let s=1;s<=30;s++){G.seed=s*7;G.floor=2;t.genFloor();mur+=G.objs.filter(q=>q.type==='mural').length;fun+=G.objs.filter(q=>q.type==='fungus').length;}o.counts=[mur,fun];
      const L=G.party[0];L.bg='acrobat';o.acro=t.skillBonus(L,'acrobatics');
      const m={type:'mural',x:L.x+1,y:L.y,deco:true};G.objs.push(m);await t.decoInteract(m);o.mural=[m.read,m.seen];
      const f={type:'fungus',x:L.x,y:L.y+1,deco:true,kind:'food'};G.objs.push(f);const r0=G.bag.ration||0;window.__want='IDENTIFY';const R=Math.random;Math.random=()=>0.95;await t.decoInteract(f);Math.random=R;window.__want=null;o.fungus=[(G.bag.ration||0)-r0,f.seen];
      for(const e of t.EVENTS.slice(-3)){t.setMode('explore');if(!e.cond||e.cond())await e.run(L);}o.mode=t.mode;
      const d=await t.dodgeRoll(L,10);o.dodge=d.txt.slice(0,12);
      t.setMode('explore');G.mons=[];G.floor=3;Math.random=()=>0.1;t.spawnRivals();Math.random=R;const co=G.rivals.find(c=>c.floor===G.floor);co.treach=false;await t.rivalJoin(co);o.rivalBg=G.party.filter(h=>h.rival).map(h=>[h.bg,h.bgHidden]);
      return o;})()""")
    print(r,errs);ok=not errs and r["counts"][0]>5 and r["counts"][1]>5 and r["acro"]>=2 and r["mural"]==[True,True] and r["fungus"]==[1,True] and r["dodge"].startswith("Acrobatics") and len(r["rivalBg"])>=2 and all(x[1] for x in r["rivalBg"])
    print("PASS" if ok else "FAIL");await b.close()
asyncio.run(main())
