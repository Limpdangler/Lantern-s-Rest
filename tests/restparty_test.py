# Solo wording, spotted pits become holes, fights that move on while you wait, and parties found resting.
import asyncio,os
from playwright.async_api import async_playwright
DIST=os.path.join(os.path.dirname(os.path.abspath(__file__)),"..","dist","lantern-crawl.html")
HOOK="""window.__t={get G(){return G},get C(){return C},setC:v=>{C=v;},get mode(){return mode},setMode:v=>{mode=v;busy=false;},S:()=>S,genFloor,soloize,openFoundPits,pitAt,skUnits,skReveal,spawnRivals,rivalMembers,restingMeet,wakeRest,isWall,mkHero};requestAnimationFrame(loop);"""
CLICKER="""window.__want=null;setInterval(()=>{const bs=[...document.querySelectorAll('#chBtns button')].filter(b=>!b.disabled&&b.offsetParent);if(!bs.length)return;
  const b=(window.__want&&bs.find(x=>new RegExp(window.__want).test(x.textContent)))||bs[0];b.click();},30);"""
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(executable_path="/usr/bin/google-chrome");pg=await b.new_page(viewport={"width":412,"height":860});errs=[];pg.on("pageerror",lambda e:errs.append(str(e)))
    html=open(DIST).read();i=html.rindex("requestAnimationFrame(loop);");html=html[:i]+HOOK+html[i+28:]
    await pg.set_content("<body>"+html+"</body>");await pg.wait_for_timeout(300);await pg.evaluate(CLICKER)
    await pg.evaluate("window.__skipIntro=true");await pg.click("#btnSetOut");await pg.click("#pick-rogue");await pg.click("#pick-race-human");await pg.wait_for_timeout(600);await pg.evaluate("window.__fast=0.01")
    r=await pg.evaluate("""(async()=>{const t=__t,G=t.G,L=G.party[0];const o={};const R=Math.random;
      o.solo=[t.soloize("Vinegar. Everyone splutters."),t.soloize("The X drops into a shallow pit and has to be hauled out.")];
      const h2=t.mkHero(t.S().classes.find(c=>c.id==='fighter'),'human');G.party.push(h2);o.group=t.soloize("Vinegar. Everyone splutters.");G.party.pop();
      // a found pit trap becomes a hole
      let sp=null;for(let y=2;y<G.H-2&&!sp;y++)for(let x=2;x<G.W-2;x++)if(!t.isWall(x,y)&&!G.objs.some(q=>q.x===x&&q.y===y)&&!(x===L.x&&y===L.y)){sp={x,y};break;}
      G.traps.push({x:sp.x,y:sp.y,type:'pit',dc:12,found:true,done:false});t.openFoundPits();o.pit=!!t.pitAt(sp.x,sp.y);
      // a fight heard long ago: arrive to the aftermath
      let sk=null;for(let s=1;s<200&&!sk;s++){G.seed=s*7;G.floor=2;t.genFloor();G.rivals=[];G.orcCamps=[];G.npc=null;sk=(G.skirmishes||[]).find(q=>q.floor===G.floor&&t.skUnits(q).length&&q.sides.some(sd=>sd.adv||sd.bandit));}
      if(sk){sk.heard=true;sk.heardAt=G.steps-200;sk.phase='start';await t.skReveal(sk);o.long=[sk.state,sk.phase,G.corpses.filter(c=>c.loot&&(c.loot.gold||c.loot.items.length)&&c.claim===null&&false).length];}else o.long='none';
      // resting adventurers: every mood works
      const moods=[];for(const mood of ['hostile','wary','friendly','false']){t.setMode('explore');t.setC(null);G.mons=[];G.rivals=[];G.floor=3;let co=null;for(let k=0;k<40&&!co;k++){t.spawnRivals();co=G.rivals.find(c=>c.floor===G.floor&&!c.hostile);if(!co){G.rivals=[];G.mons=[];}}
        if(!co){moods.push('none');continue;}co.met=true;window.__want=mood==='friendly'||mood==='false'?'WISH':'GO YOUR|LEAVE|IGNORE';await t.wakeRest(co,mood);window.__want=null;await new Promise(r=>setTimeout(r,300));
        moods.push([mood,t.mode,(G.grudges||[]).some(g=>g.betray)]);t.setMode('explore');t.setC(null);}
      o.moods=moods;return o;})()""")
    print(r,errs)
    m=r["moods"]
    ok=(not errs and r["solo"][0]=="Vinegar. You splutter." and "climb out" in r["solo"][1] and r["group"].endswith("Everyone splutters.") and r["pit"] and r["long"]!="none" and r["long"][0]=="done"
      and m[0][1] in("combat","combatEnd") and m[3][2])
    print("PASS" if ok else "FAIL");await b.close()
asyncio.run(main())
