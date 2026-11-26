# Tapping a far torch walks the leader over before snuffing it; the A button uses what the leader is facing.
import asyncio,os
from playwright.async_api import async_playwright
DIST=os.path.join(os.path.dirname(os.path.abspath(__file__)),"..","dist","lantern-crawl.html")
HOOK="""window.__t={get G(){return G},exploreTap,pressA,walkUpTo,isWall,enterable,doorAt};requestAnimationFrame(loop);"""
CLICKER="""window.__want=null;setInterval(()=>{const bs=[...document.querySelectorAll('#chBtns button')].filter(b=>!b.disabled&&b.offsetParent);if(!bs.length)return;
  const b=(window.__want&&bs.find(x=>new RegExp(window.__want).test(x.textContent)))||bs[0];b.click();},30);"""
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(executable_path="/usr/bin/google-chrome");pg=await b.new_page();errs=[];pg.on("pageerror",lambda e:errs.append(str(e)))
    html=open(DIST).read();i=html.rindex("requestAnimationFrame(loop);");html=html[:i]+HOOK+html[i+28:]
    await pg.set_content("<body>"+html+"</body>");await pg.wait_for_timeout(300)
    await pg.click("#btnSetOut");await pg.click("#pick-fighter");await pg.click("#pick-race-human");await pg.evaluate("window.__fast=0.01");await pg.wait_for_timeout(300);await pg.evaluate(CLICKER)
    r=await pg.evaluate("""(async()=>{const t=__t,G=t.G,L=G.party[0];const out={};
      for(let y=0;y<G.H;y++)for(let x=0;x<G.W;x++)G.explored[y][x]=true;G.mons=G.mons.filter(m=>Math.max(Math.abs(m.x-L.x),Math.abs(m.y-L.y))>25);
      // the torch whose wall is reachable and farthest from the leader (but not crazy far)
      const tcs=G.torches.filter(tc=>!tc.out).map(tc=>({tc,d:Math.max(Math.abs(tc.x-L.x),Math.abs(tc.y-L.y))})).filter(o=>o.d>=3&&o.d<=15).sort((a,b)=>a.d-b.d);
      out.torchDist=tcs.length?tcs[0].d:null;
      if(tcs.length){const tc=tcs[0].tc;out.tc=[tc.x,tc.y,L.x,L.y,t.isWall(tc.x,tc.y)];window.__want='PUT IT OUT';await t.exploreTap(tc.x,tc.y);await new Promise(r=>setTimeout(r,300));const L2=G.party[0];out.torchOut=!!tc.out;out.msg=document.getElementById('tText').textContent;out.endDist=Math.max(Math.abs(tc.x-L2.x),Math.abs(tc.y-L2.y));}
      // A button: stand next to a closed door, face it, press A
      const d=G.objs.find(o=>o.type==='door'&&!o.open&&!o.locked);if(d){const L3=G.party[0];for(const [dx,dy] of [[0,1],[0,-1],[1,0],[-1,0]]){const x=d.x+dx,y=d.y+dy;if(!t.isWall(x,y)&&!t.doorAt(x,y)&&t.enterable(L3,x,y)){L3.x=x;L3.y=y;L3.face=dy>0?'b':dy<0?'f':'s';L3.flip=dx>0;break;}}
        window.__want='OPEN';await t.pressA();await new Promise(r=>setTimeout(r,300));out.doorOpened=!!d.open;}
      return out;})()""")
    a_label=await pg.evaluate("document.querySelector('#kA+span').textContent");s_btn=await pg.locator("#tgSearch").count()
    print(r,a_label,s_btn,errs);ok=not errs and (r["torchDist"] is None or (r["torchOut"] and r["endDist"]<=1) or "reach" in r.get("msg","") or "way over" in r.get("msg","")) and r.get("doorOpened",True) and a_label=="INTERACT" and s_btn==1
    print("PASS" if ok else "FAIL");await b.close()
asyncio.run(main())
