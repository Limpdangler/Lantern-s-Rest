# Batch 3 rules: parley attitudes, languages, surrender & questioning, calling for help, haggling, revivify, prepared spells.
import asyncio,os
from playwright.async_api import async_playwright
DIST=os.path.join(os.path.dirname(os.path.abspath(__file__)),"..","dist","lantern-crawl.html")
HOOK="""window.__t={get G(){return G},setC:v=>{C=v;},mkHero,mkMon,monByKey,parley,haggle,openShop,shopPrice,get shop(){return shopObj},prepareSpells,prepPool,prepCount,isPrepared,offerRevivify,monsterPreTurn,speakerFor,addItem,applyLevel,S:()=>S};requestAnimationFrame(loop);"""
CLICKER="""window.__want=null;setInterval(()=>{const bs=[...document.querySelectorAll('#chBtns button')].filter(b=>!b.disabled&&b.offsetParent);if(!bs.length)return;
  const b=(window.__want&&bs.find(x=>new RegExp(window.__want).test(x.textContent)))||bs[0];b.click();},30);"""
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(executable_path="/usr/bin/google-chrome");pg=await b.new_page();errs=[];pg.on("pageerror",lambda e:errs.append(str(e)))
    html=open(DIST).read();i=html.rindex("requestAnimationFrame(loop);");html=html[:i]+HOOK+html[i+28:]
    await pg.set_content("<body>"+html+"</body>");await pg.wait_for_timeout(300)
    await pg.click("#btnSetOut");await pg.click("#pick-cleric");await pg.click("#pick-race-dwarf");await pg.evaluate("window.__fast=0.01");await pg.wait_for_timeout(300)
    await pg.evaluate(CLICKER)
    r=await pg.evaluate("""(async()=>{const t=__t,G=t.G,L=G.party[0];const out={};const R=Math.random;
      // languages: a dwarf speaks Goblin
      const g1=t.mkMon(t.monByKey('goblin'),L.x+3,L.y,false);g1.gid=901;g1.parley=901;G.mons.push(g1);out.speaker=!!t.speakerFor(g1);
      // parley: a great persuasion roll makes them friendly and chatty
      G.traps.push({x:L.x+5,y:L.y+5,type:'darts',dc:12});Math.random=()=>0.99;window.__want='PERSUADE';await t.parley(g1);Math.random=R;
      out.friendly=!!g1.peace;out.trapsMarked=G.traps.every(q=>q.found||q.done);
      // haggling
      t.openShop({stock:['potion']});const before=t.shopPrice('potion');Math.random=()=>0.99;await t.haggle();Math.random=R;out.haggle=[before,t.shopPrice('potion'),t.shop.haggled];
      document.getElementById('ovShop').hidden=true;
      // prepared spells
      G.level=1;t.applyLevel(L,false);window.__want='DONE';L.prepared=null;await t.prepareSpells(L);out.prep=[t.prepPool(L).length,t.prepCount(L),L.prepared.length];
      const left=t.prepPool(L).filter(s=>!L.prepared.includes(s));out.unprepBlocked=left.length?!t.isPrepared(L,left[0]):true;
      // revivify with a scroll
      const f=t.mkHero(t.S().classes.find(c=>c.id==='fighter'),'human');f.x=L.x;f.y=L.y+1;G.party.push(f);f.dead=true;f.down=true;f.hp=0;t.addItem('scroll_revivify');window.__want='READ THE SCROLL';await t.offerRevivify();out.revived=[!f.dead,f.hp];
      // surrender: the last goblin standing, badly hurt
      const g2=t.mkMon(t.monByKey('goblin'),L.x+2,L.y+2,false);g2.gid=902;G.mons.push(g2);g2.inCombat=true;g2.hp=1;g2.called=true;
      t.setC({units:[L,g2],xp:0,round:1});Math.random=()=>0.1;window.__want='SPARE';const used=await t.monsterPreTurn(g2);Math.random=R;
      out.surrender=[used,!G.mons.includes(g2)];
      // calling for help
      G.mons=[];const g3=t.mkMon(t.monByKey('goblin'),L.x+2,L.y,false);g3.gid=903;g3.inCombat=true;g3.hp=g3.maxHp-1;G.mons.push(g3);
      const far=t.mkMon(t.monByKey('kobold'),L.x+8,L.y,false);far.gid=904;G.mons.push(far);const units=[L,g3];
      t.setC({units,xp:0,round:1});Math.random=()=>0.1;await t.monsterPreTurn(g3);Math.random=R;out.help=far.inCombat&&units.includes(far);t.setC(null);
      return out;})()""")
    print(r,errs)
    ok=not errs and r["speaker"] and r["friendly"] and r["trapsMarked"] and r["haggle"][1]<r["haggle"][0] and r["prep"][2]==min(r["prep"][0],r["prep"][1]) and r["unprepBlocked"] and r["revived"]==[True,1] and r["surrender"]==[True,True] and r["help"]
    print("PASS" if ok else "FAIL");await b.close()
asyncio.run(main())
