# Plays a few steps, reloads the page, resumes the saved run and checks it matches.
import asyncio,os,subprocess,time,sys
from playwright.async_api import async_playwright
ROOT=os.path.dirname(os.path.abspath(__file__));DIST=os.path.join(ROOT,"..","dist","lantern-crawl.html")
HOOK="""window.__t={get G(){return G},get mode(){return mode},tryMove,saveRun,mkMon,monByKey,startConc:typeof startConc!=='undefined'?startConc:null};requestAnimationFrame(loop);"""
async def main():
  html=open(DIST).read();i=html.rindex("requestAnimationFrame(loop);");html=html[:i]+HOOK+html[i+28:]
  os.makedirs("/tmp/srv",exist_ok=True);open("/tmp/srv/index.html","w").write(html)
  srv=subprocess.Popen([sys.executable,"-m","http.server","8765","-d","/tmp/srv"],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1)
  try:
    async with async_playwright() as p:
      b=await p.chromium.launch(executable_path="/usr/bin/google-chrome");ctx=await b.new_context();pg=await ctx.new_page()
      errs=[];pg.on("pageerror",lambda e:errs.append(str(e)))
      await pg.goto("http://localhost:8765/index.html");await pg.wait_for_timeout(500)
      await pg.evaluate("window.__skipIntro=true");await pg.evaluate("setInterval(()=>{const bs=[...document.querySelectorAll('#chBtns button')].filter(b=>!b.disabled&&b.offsetParent);if(bs.length)bs[bs.length-1].click();},40)");await pg.click("#btnSetOut");await pg.click("#pick-wizard");await pg.click("#pick-race-elf");await pg.evaluate("window.__fast=0.02")
      await pg.wait_for_timeout(600);await pg.mouse.click(195,150);await pg.wait_for_timeout(200)
      before=await pg.evaluate("""(async()=>{const t=__t,G=t.G;for(const [dx,dy] of [[1,0],[0,1],[-1,0],[0,-1],[1,0],[0,1]]){await t.tryMove(dx,dy);await new Promise(r=>setTimeout(r,150));}
        const m=G.mons[0];if(m){G.goal={type:'named',desc:'test',done:false,target:m};}G.searched.add('r0');G.fire.set(5,2);const ok=t.saveRun();const L=G.party[0];
        return {ok,floor:G.floor,x:L.x,y:L.y,hp:L.hp,mons:G.mons.length,gold:G.gold,objs:G.objs.length,steps:G.steps,goalIsMon:G.goal&&G.goal.target===G.mons[0],name:L.nick};})()""")
      await pg.reload();await pg.wait_for_timeout(600)
      label=await pg.inner_text("#btnContinue");await pg.click("#btnContinue");await pg.wait_for_timeout(500)
      after=await pg.evaluate("""(()=>{const G=__t.G;const L=G.party[0];return {floor:G.floor,x:L.x,y:L.y,hp:L.hp,mons:G.mons.length,gold:G.gold,objs:G.objs.length,steps:G.steps,goalIsMon:G.goal&&G.goal.target===G.mons[0],name:L.nick,
        sets:G.searched instanceof Set&&G.searched.has('r0'),fire:G.fire instanceof Map&&G.fire.get(5)===2,info:!!L.info,tr:G.mons.every(m=>!!m.tr),terr:!!G.terr,mode:__t.mode};})()""")
      moved=await pg.evaluate("(async()=>{const G=__t.G;const s=G.steps;for(const d of [[1,0],[-1,0],[0,1],[0,-1]])await __t.tryMove(...d);return G.steps-s;})()")
      await pg.screenshot(path="/tmp/shots/resumed.png")
      print("continue button:",label.replace("\n"," "));print("before",before);print("after ",after);print("steps after resume",moved);print("errors",errs)
      ok=all(before[k]==after[k] for k in ["floor","x","y","hp","mons","gold","objs","steps","goalIsMon","name"]) and after["sets"] and after["fire"] and after["info"] and after["tr"] and not errs
      print("PASS" if ok else "FAIL");await b.close()
  finally:srv.terminate()
asyncio.run(main())
