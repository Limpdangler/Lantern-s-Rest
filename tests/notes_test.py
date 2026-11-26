# Calvin's notes (26 Nov): bump hint with an A badge, map, carrying capacity, trap damage, Reckless Attack timing, Help picks an ally, no AWAKE on a killing blow.
import asyncio,os
from playwright.async_api import async_playwright
SP="/tmp/claude-0/-home-claude/e4be4f78-7f4f-54ca-8cba-52dad9108be2/scratchpad/"
DOCS=os.path.join(os.path.dirname(os.path.abspath(__file__)),"..","docs","index.html")
HOOK="""window.__t={get G(){return G},get C(){return C},setC:v=>{C=v;},tryMove,isWall,enterable,doorAt,objAt,packCap,trapN:()=>trapN(),featButtons,mkMon,monByKey,dealDamage,openMap,mkHero,S:()=>S,hud,heroTurn,useAttack,actionButtons};requestAnimationFrame(loop);"""
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(executable_path="/usr/bin/google-chrome");ctx=await b.new_context(viewport={"width":412,"height":800},device_scale_factor=2,is_mobile=True,has_touch=True);pg=await ctx.new_page();errs=[];pg.on("pageerror",lambda e:errs.append(str(e)))
    html=open(DOCS).read();i=html.rindex("requestAnimationFrame(loop);");html=html[:i]+HOOK+html[i+28:]
    await pg.set_content(html);await pg.wait_for_timeout(300)
    await pg.click("#btnSetOut");await pg.click("#pick-barbarian");await pg.click("#pick-race-human");await pg.wait_for_timeout(400);await pg.click("#kA");await pg.wait_for_timeout(400);await pg.evaluate("window.__fast=0.01")
    out=await pg.evaluate("""(async()=>{const t=__t,G=t.G,L=G.party[0];const out={};G.mons=[];
      const o=G.objs.find(o=>o.type==='door'&&!o.open);for(const [dx,dy] of [[0,1],[0,-1],[1,0],[-1,0]]){const x=o.x+dx,y=o.y+dy;if(!t.isWall(x,y)&&!t.doorAt(x,y)&&!t.objAt(x,y)&&t.enterable(L,x,y)){L.x=x;L.y=y;await t.tryMove(-dx,-dy);break;}}
      out.hint=document.getElementById('tText').innerHTML;out.cap=t.packCap();G.floor=1;out.trap1=t.trapN();G.floor=5;out.trap5=t.trapN();G.floor=1;
      // a sleeping goblin killed in one blow shows no AWAKE
      const m=t.mkMon(t.monByKey('goblin'),L.x+1,L.y);m.st.asleep=true;G.mons.push(m);window.__floats=[];await t.dealDamage(m,50,'slashing',{src:L});
      out.awakeShown=!!(window.__fx||[]).length;
      // reckless: only before the first attack
      t.setC({units:[L],cur:L,round:1,xp:0,actions:1,bonus:true,attacksLeft:0,moveLeft:6,panel:'main',mode:'move'});t.heroTurn&&0;const C=t.C;C.attackedOnce=false;C.reckless=false;
      const rb=()=>t.featButtons(L).find(x=>/RECKLESS/.test(x.t));out.recklessBefore=!rb().dis;t.useAttack(L);out.recklessAfter=!rb().dis;t.setC(null);
      return out;})()""")
    await pg.wait_for_timeout(200);await pg.screenshot(path=SP+"hint.png")
    await pg.evaluate("__t.G.explored.forEach(r=>r.fill(true));__t.openMap()");await pg.wait_for_timeout(300);await pg.screenshot(path=SP+"map.png")
    out["mapShown"]=await pg.evaluate("!document.getElementById('ovMap').hidden")
    print(out,errs)
    ok=not errs and 'abadge' in out["hint"] and out["cap"]>=20 and out["trap1"]==1 and out["trap5"]==3 and out["recklessBefore"] and not out["recklessAfter"] and out["mapShown"]
    print("PASS" if ok else "FAIL");await b.close()
asyncio.run(main())
