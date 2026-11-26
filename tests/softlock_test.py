# No soft locks: on many generated floors the ladder is reachable without going through a locked door,
# and a locked door that resisted always offers a slow-but-certain way through.
import asyncio,os
from playwright.async_api import async_playwright
DIST=os.path.join(os.path.dirname(os.path.abspath(__file__)),"..","dist","lantern-crawl.html")
HOOK="""window.__t={get G(){return G},genFloor,doorInteract,isWall,DIRS4};requestAnimationFrame(loop);"""
CLICKER="""window.__want=null;setInterval(()=>{const bs=[...document.querySelectorAll('#chBtns button')].filter(b=>!b.disabled&&b.offsetParent);if(!bs.length)return;
  const b=(window.__want&&bs.find(x=>new RegExp(window.__want).test(x.textContent)))||bs[bs.length-1];b.click();},30);"""
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(executable_path="/usr/bin/google-chrome");pg=await b.new_page();errs=[];pg.on("pageerror",lambda e:errs.append(str(e)))
    html=open(DIST).read();i=html.rindex("requestAnimationFrame(loop);");html=html[:i]+HOOK+html[i+28:]
    await pg.set_content("<body>"+html+"</body>");await pg.wait_for_timeout(300)
    await pg.click("#btnSetOut");await pg.click("#pick-rogue");await pg.click("#pick-race-human");await pg.evaluate("window.__fast=0.01");await pg.wait_for_timeout(300)
    r=await pg.evaluate("""(()=>{const t=__t;let bad=0,tried=0,vaults=0;
      for(let s=1;s<=50;s++)for(let f=1;f<=3;f++){const G=t.G;G.seed=s*13;G.floor=f;t.genFloor();if(!G.stairs)continue;tried++;
        if(G.objs.some(o=>o.type==='door'&&o.locked))vaults++;
        const L=G.party[0],W=G.W;const seen=new Set([L.y*W+L.x]);const q=[L.y*W+L.x];
        while(q.length){const c=q.pop();const x=c%W,y=(c/W)|0;for(const [dx,dy] of t.DIRS4){const nx=x+dx,ny=y+dy,k=ny*W+nx;if(seen.has(k)||t.isWall(nx,ny))continue;if(G.objs.some(o=>o.type==='door'&&o.locked&&o.x===nx&&o.y===ny))continue;seen.add(k);q.push(k);}}
        if(!seen.has(G.stairs.y*W+G.stairs.x))bad++;}
      return {tried,vaults,bad};})()""")
    await pg.evaluate(CLICKER)
    r2=await pg.evaluate("""(async()=>{const t=__t,G=t.G;const d={type:'door',x:1,y:1,locked:true,iron:true,open:false,heard:true,fail:{pick:'The lock won\\'t budge.',force:'The door shudders but holds.'}};
      window.__want='HINGES';await t.doorInteract(d);return {open:d.open,locked:d.locked};})()""")
    print(r,r2,errs);ok=not errs and r["bad"]==0 and r["vaults"]>0 and r2["open"] and not r2["locked"]
    print("PASS" if ok else "FAIL");await b.close()
asyncio.run(main())
