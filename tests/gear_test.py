# Magic gear: one item per slot, max 3, and it only works after a rest.
import asyncio,os
from playwright.async_api import async_playwright
DIST=os.path.join(os.path.dirname(os.path.abspath(__file__)),"..","docs","index.html")
SP="/tmp/claude-0/-home-claude/e4be4f78-7f4f-54ca-8cba-52dad9108be2/scratchpad/"
HOOK="""window.__t={get G(){return G},addItem,wearItem,removeItem,wearBlock,acOf,shortRest,isKnown,hud};requestAnimationFrame(loop);"""
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(executable_path="/usr/bin/google-chrome");ctx=await b.new_context(viewport={"width":412,"height":800},device_scale_factor=2,is_mobile=True,has_touch=True);pg=await ctx.new_page();errs=[];pg.on("pageerror",lambda e:errs.append(str(e)))
    html=open(DIST).read();i=html.rindex("requestAnimationFrame(loop);");html=html[:i]+HOOK+html[i+28:]
    await pg.set_content(html);await pg.wait_for_timeout(300)
    await pg.evaluate("window.__skipIntro=true");await pg.click("#btnSetOut");await pg.click("#pick-rogue");await pg.click("#pick-race-elf");await pg.wait_for_timeout(400);await pg.click("#kA");await pg.evaluate("window.__fast=0.01")
    r=await pg.evaluate("""(async()=>{const t=__t,G=t.G,h=G.party[0];const out={};
      t.addItem('ring');t.addItem('ringcurse');t.addItem('cloakcurse');t.addItem('boots');const ac0=t.acOf(h);
      t.wearItem(h,'ring');out.notYet=t.acOf(h)===ac0;out.secondRing=!!t.wearBlock(h,'ringcurse');
      t.wearItem(h,'cloakcurse');out.cursedOffBefore=t.removeItem(h,'cloakcurse')===null;t.wearItem(h,'cloakcurse');
      h.hp=h.maxHp;G.shortRests=0;await t.shortRest();out.after=t.acOf(h)-ac0;out.known=t.isKnown('ring');
      out.cursedStuck=t.removeItem(h,'cloakcurse')!==null;out.thirdOK=!t.wearBlock(h,'boots');t.wearItem(h,'boots');t.addItem('gloves');out.fourthBlocked=!!t.wearBlock(h,'gloves');t.hud();return out;})()""")
    await pg.click("#party .pc >> nth=0");await pg.wait_for_timeout(400);await pg.evaluate("document.querySelector('.gearlist').scrollIntoView()");await pg.wait_for_timeout(200);await pg.screenshot(path=SP+"gear.png")
    print(r,errs);ok=not errs and r["notYet"] and r["secondRing"] and r["cursedOffBefore"] and r["after"]==1 and r["known"] and r["cursedStuck"] and r["thirdOK"] and r["fourthBlocked"]
    print("PASS" if ok else "FAIL");await b.close()
asyncio.run(main())
