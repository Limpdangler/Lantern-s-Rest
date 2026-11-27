# Chests: locks, iron bands, junk and empty ones, trap checks, every trap kind, smashing and burning.
import asyncio,os
from playwright.async_api import async_playwright
DIST=os.path.join(os.path.dirname(os.path.abspath(__file__)),"..","dist","lantern-crawl.html")
HOOK="""window.__t={get G(){return G},genFloor,kitChest,chestInteract,chestTrap2,chestLoot,burnObjects,isWooden,drawObj,CHEST_TRAPS,setMode:v=>{mode=v;busy=false;}};requestAnimationFrame(loop);"""
CLICKER="""window.__want=null;setInterval(()=>{const bs=[...document.querySelectorAll('#chBtns button')].filter(b=>!b.disabled&&b.offsetParent);if(!bs.length)return;
  const b=(window.__want&&bs.find(x=>new RegExp(window.__want).test(x.textContent)))||bs.find(x=>/LEAVE/.test(x.textContent))||bs[0];b.click();},30);"""
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(executable_path="/usr/bin/google-chrome");pg=await b.new_page(viewport={"width":412,"height":860});errs=[];pg.on("pageerror",lambda e:errs.append(str(e)))
    html=open(DIST).read();i=html.rindex("requestAnimationFrame(loop);");html=html[:i]+HOOK+html[i+28:]
    await pg.set_content("<body>"+html+"</body>");await pg.wait_for_timeout(300);await pg.evaluate(CLICKER)
    await pg.evaluate("window.__skipIntro=true");await pg.click("#btnSetOut");await pg.click("#pick-rogue");await pg.click("#pick-race-human");await pg.wait_for_timeout(600);await pg.evaluate("window.__fast=0.01")
    r=await pg.evaluate("""(async()=>{const t=__t,G=t.G,L=G.party[0];const o={};const R=Math.random;
      const st={locked:0,armoured:0,trap:0,empty:0,junk:0,n:0};for(let s=1;s<=60;s++){G.seed=s*3;G.floor=3;t.genFloor();for(const c of G.objs.filter(q=>q.type==='chest'&&!q.vault&&!q.mimic)){st.n++;if(c.locked)st.locked++;if(c.armoured)st.armoured++;if(c.trap)st.trap++;if(c.junk)st.junk++;if(!c.junk&&!c.loot.gold&&!c.loot.items.length)st.empty++;}}o.st=st;
      const mk=x=>Object.assign({type:'chest',x:L.x+1,y:L.y,opened:false,kitted:true,loot:{gold:10,items:['potion','potion','potion','potion','potion','potion']}},x);
      o.wood=[t.isWooden(mk({})),t.isWooden(mk({armoured:true}))];
      // pick a locked chest then open it
      let c=mk({locked:true,lockDc:2});G.objs.push(c);window.__want='PICK|OPEN';const g0=G.gold;await t.chestInteract(c);window.__want=null;o.picked=[c.picked,c.opened,G.gold-g0];c.gone=true;
      // check finds a trap
      c=mk({trap:{dc:1,kind:'gas'}});G.objs.push(c);window.__want='CHECK';await t.chestInteract(c);window.__want=null;o.found=c.trapFound;c.gone=true;
      // every trap kind fires without errors
      L.hp=L.maxHp=500;for(const k of Object.keys(t.CHEST_TRAPS)){const cc=mk({trap:{dc:10,kind:k}});await t.chestTrap2(cc,L);}o.traps='ok';
      // smashing breaks some potions
      G.bag.potion=0;c=mk({});G.objs.push(c);await t.chestLoot(c,.6);o.smash=G.bag.potion||0;
      // burning: the chest burns away, coins and a few items may survive
      c=mk({});G.objs.push(c);c.burn=1;const n0=G.items.length;Math.random=()=>0.1;t.burnObjects();Math.random=R;o.burn=[c.gone,G.items.length-n0];
      for(const x of [mk({armoured:true,locked:true}),mk({})])t.drawObj(x,40,40,0);
      return o;})()""")
    print(r,errs);s=r["st"]
    ok=(not errs and s["locked"]>s["n"]*.15 and s["armoured"]>s["n"]*.1 and s["trap"]>s["n"]*.1 and s["empty"]>0 and s["junk"]>0 and r["wood"]==[True,False]
      and r["picked"][0] and r["picked"][1] and r["picked"][2]>=10 and r["found"] and r["traps"]=="ok" and 0<r["smash"]<6 and r["burn"][0] and r["burn"][1]>=6)
    print("PASS" if ok else "FAIL");await b.close()
asyncio.run(main())
