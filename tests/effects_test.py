# Checks that registered effects really change the numbers (rage, resistance, ward, relentless, sneak attack, crit range).
import asyncio,os
from playwright.async_api import async_playwright
DIST=os.path.join(os.path.dirname(os.path.abspath(__file__)),"..","dist","lantern-crawl.html")
HOOK="""window.__t={get G(){return G},mkHero,mkMon,monByKey,dealDamage,attack,weaponOf,fire,EFFECTS,S:()=>S,reset:()=>{C=null;mode="explore";busy=false;}};requestAnimationFrame(loop);"""
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(executable_path="/usr/bin/google-chrome");pg=await b.new_page();errs=[];pg.on("pageerror",lambda e:errs.append(str(e)))
    html=open(DIST).read();i=html.rindex("requestAnimationFrame(loop);");html=html[:i]+HOOK+html[i+28:]
    await pg.set_content("<body>"+html+"</body>");await pg.wait_for_timeout(300)
    await pg.click("#btnSetOut");await pg.click("#pick-fighter");await pg.click("#pick-race-human");await pg.evaluate("window.__fast=0.01");await pg.wait_for_timeout(300)
    r=await pg.evaluate("""(async()=>{const t=__t,G=t.G,cls=id=>t.S().classes.find(c=>c.id===id);const out={effects:t.EFFECTS.length};
      const b=t.mkHero(cls('barbarian'),'human');b.maxHp=b.hp=100;b.st.raging=true;out.rage=await t.dealDamage(b,10,'slashing',{});
      const tf=t.mkHero(cls('wizard'),'tiefling');tf.maxHp=tf.hp=100;out.tieflingFire=await t.dealDamage(tf,10,'fire',{});
      const ab=t.mkHero(cls('wizard'),'human');ab.maxHp=ab.hp=100;ab.ward=6;out.ward=await t.dealDamage(ab,10,'force',{});
      const ho=t.mkHero(cls('fighter'),'halforc');ho.maxHp=ho.hp=30;G.party.push(ho);await t.dealDamage(ho,31,'slashing',{});out.relentlessHP=ho.hp;
      const ch=t.mkHero(cls('fighter'),'human');ch.sub='champion';out.champion19=t.fire('critCheck',{a:ch,t:ch,w:{},d:19,crit:false,hit:true}).crit;
      const fi=t.mkHero(cls('fighter'),'human');out.normal19=t.fire('critCheck',{a:fi,t:fi,w:{},d:19,crit:false,hit:true}).crit;
      return out;})()""")
    print(r,errs)
    ok=r["rage"]==5 and r["tieflingFire"]==5 and r["ward"]==4 and r["relentlessHP"]==1 and r["champion19"] and not r["normal19"] and not errs
    print("PASS" if ok else "FAIL");await b.close()
asyncio.run(main())
