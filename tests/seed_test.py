# Two runs with the same seed must build identical floors.
import asyncio,os
from playwright.async_api import async_playwright
DIST=os.path.join(os.path.dirname(os.path.abspath(__file__)),"..","dist","lantern-crawl.html")
HOOK="""window.__t={get G(){return G}};requestAnimationFrame(loop);"""
async def floor_sig(b,seed):
  pg=await b.new_page();errs=[];pg.on("pageerror",lambda e:errs.append(str(e)))
  html=open(DIST).read();i=html.rindex("requestAnimationFrame(loop);");html=html[:i]+HOOK+html[i+28:]
  await pg.set_content("<body>"+html+"</body>");await pg.wait_for_timeout(300)
  await pg.fill("#seedIn",str(seed));await pg.click("#btnSetOut");await pg.click("#pick-fighter");await pg.click("#pick-race-human");await pg.wait_for_timeout(300)
  sig=await pg.evaluate("(()=>{const G=__t.G;return JSON.stringify([G.seed,G.theme,G.t,G.objs.map(o=>[o.type,o.x,o.y]),G.mons.map(m=>[m.key,m.x,m.y]),G.traps.map(t=>[t.x,t.y,t.type])])})()")
  await pg.close();return sig,errs
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(executable_path="/usr/bin/google-chrome")
    a,e1=await floor_sig(b,4242);c,e2=await floor_sig(b,4242);d,e3=await floor_sig(b,777)
    print("same seed identical:",a==c,"| different seed differs:",a!=d,"| errors:",e1+e2+e3)
    print("PASS" if a==c and a!=d and not (e1+e2+e3) else "FAIL");await b.close()
asyncio.run(main())
