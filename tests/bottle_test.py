# Drinking a potion leaves an empty bottle; barrels only fill bottles you have.
import asyncio
from playwright.async_api import async_playwright
HOOK="""window.__t={get G(){return G},takeItem,pushMenu,packLoad,addItem};requestAnimationFrame(loop);"""
CLICKER="""window.__want=null;setInterval(()=>{const bs=[...document.querySelectorAll('#chBtns button')].filter(b=>!b.disabled&&b.offsetParent);if(!bs.length)return;
  const b=(window.__want&&bs.find(x=>new RegExp(window.__want).test(x.textContent)))||bs[bs.length-1];b.click();},30);"""
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(executable_path="/usr/bin/google-chrome");pg=await b.new_page(viewport={"width":412,"height":860});errs=[];pg.on("pageerror",lambda e:errs.append(str(e)))
    html=open(__import__("os").path.join(__import__("os").path.dirname(__import__("os").path.abspath(__file__)),"..","dist","lantern-crawl.html")).read();i=html.rindex("requestAnimationFrame(loop);");html=html[:i]+HOOK+html[i+28:]
    await pg.set_content("<body>"+html+"</body>");await pg.wait_for_timeout(300);await pg.evaluate(CLICKER)
    await pg.evaluate("window.__skipIntro=true");await pg.click("#btnSetOut");await pg.click("#pick-rogue");await pg.click("#pick-race-human");await pg.wait_for_timeout(600);await pg.evaluate("window.__fast=0.01")
    r=await pg.evaluate("""(async()=>{const t=__t,G=t.G,L=G.party[0];const o={};const bar={type:'barrel',x:L.x+1,y:L.y,hp:4};
      window.__want='FILL';const oil0=G.bag.oil||0;await t.pushMenu(bar,1,0);o.noBottle=[(G.bag.oil||0)-oil0,bar.fills];
      const w0=t.packLoad();t.takeItem('potion');o.bottle=[G.bag.bottle,t.packLoad()-w0];
      await t.pushMenu(bar,1,0);window.__want=null;o.filled=[(G.bag.oil||0)-oil0,G.bag.bottle||0,bar.fills];return o;})()""")
    print(r,errs);print("PASS" if not errs and r["noBottle"]==[0,3] and r["bottle"][0]==1 and r["filled"]==[1,0,2] else "FAIL");await b.close()
asyncio.run(main())
