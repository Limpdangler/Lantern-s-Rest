# Real-speed checks (no fast mode): walking into a door with the D-pad only shows a hint; messages wait for a tap; NOTES keeps them.
import asyncio,os
from playwright.async_api import async_playwright
DIST=os.path.join(os.path.dirname(os.path.abspath(__file__)),"..","dist","lantern-crawl.html")
HOOK="""window.__t={get G(){return G},tryMove,say,get choosing(){return choosing},get sayState(){return sayState},isWall,enterable,doorAt,openMenu};requestAnimationFrame(loop);"""
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(executable_path="/usr/bin/google-chrome");pg=await b.new_page(viewport={"width":412,"height":730});errs=[];pg.on("pageerror",lambda e:errs.append(str(e)))
    html=open(DIST).read();i=html.rindex("requestAnimationFrame(loop);");html=html[:i]+HOOK+html[i+28:]
    await pg.set_content("<body>"+html+"</body>");await pg.wait_for_timeout(300)
    await pg.click("#btnSetOut");await pg.click("#pick-fighter");await pg.click("#pick-race-human");await pg.wait_for_timeout(500)
    out=await pg.evaluate("""(async()=>{const t=__t,G=t.G;const out={};G.mons=[];
      const d=G.objs.find(o=>o.type==='door'&&!o.open);const L=G.party[0];let dir=null;
      for(const [dx,dy] of [[0,1],[0,-1],[1,0],[-1,0]]){const x=d.x+dx,y=d.y+dy;if(!t.isWall(x,y)&&!t.doorAt(x,y)&&t.enterable(L,x,y)){L.x=x;L.y=y;dir=[-dx,-dy];break;}}
      await t.tryMove(dir[0],dir[1]);out.dpadChoice=!!t.choosing;out.hint=document.getElementById('tText').textContent;
      t.say('The runes are a map!',500,true);await new Promise(r=>setTimeout(r,2500));out.stillShowing=!!t.sayState&&!document.getElementById('tBox').hidden;
      return out;})()""")
    await pg.wait_for_timeout(500);await pg.click("#kA");await pg.wait_for_timeout(300)
    out["closedAfterTap"]=await pg.evaluate("!__t.sayState")
    await pg.click("#kB");await pg.wait_for_timeout(300);await pg.click("#tab-notes");await pg.wait_for_timeout(200)
    out["notes"]=await pg.evaluate("document.getElementById('menuBody').textContent.includes('The runes are a map!')")
    await pg.screenshot(path="/tmp/claude-0/-home-claude/e4be4f78-7f4f-54ca-8cba-52dad9108be2/scratchpad/notes.png")
    print(out,errs);ok=not errs and not out["dpadChoice"] and "Press A" in out["hint"] and out["stillShowing"] and out["closedAfterTap"] and out["notes"]
    print("PASS" if ok else "FAIL");await b.close()
asyncio.run(main())
