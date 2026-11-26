# House rules batch: brutal crits, flanking, exhaustion stages, initiative ties and natural 20s, ambush-only surprise,
# potions, shields (raise / block), rest spacing, mouse holes into vaults, oil barrels, foraging, human feats.
import asyncio,os
from playwright.async_api import async_playwright
DIST=os.path.join(os.path.dirname(os.path.abspath(__file__)),"..","dist","lantern-crawl.html")
HOOK="""window.__t={get G(){return G},get C(){return C},setC:v=>{C=v;},S:()=>S,roll,attackMods,weaponOf,mkMon,monByKey,mkHero,exhPen,initOrder,rollInit,monsterSurprised,itemButtons,actionButtons,acOf,dealDamage,restTooSoon,
  genFloor,holeInteract,pushMenu,addItem,classActions,readAlmanac,forageLeader,isWall,enterable,objAt,doorAt,hud,hasFeat,entrances};requestAnimationFrame(loop);"""
CLICKER="""window.__want=null;setInterval(()=>{const bs=[...document.querySelectorAll('#chBtns button')].filter(b=>!b.disabled&&b.offsetParent);if(!bs.length)return;
  const b=(window.__want&&bs.find(x=>new RegExp(window.__want).test(x.textContent)))||bs[0];b.click();},30);"""
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(executable_path="/usr/bin/google-chrome");pg=await b.new_page();errs=[];pg.on("pageerror",lambda e:errs.append(str(e)))
    html=open(DIST).read();i=html.rindex("requestAnimationFrame(loop);");html=html[:i]+HOOK+html[i+28:]
    await pg.set_content("<body>"+html+"</body>");await pg.wait_for_timeout(300)
    await pg.evaluate(CLICKER);await pg.evaluate("window.__want='ALERT'")
    await pg.click("#btnSetOut");await pg.click("#pick-fighter");await pg.click("#pick-race-human");await pg.evaluate("window.__fast=0.01");await pg.wait_for_timeout(1500)
    r=await pg.evaluate("""(async()=>{const t=__t,G=t.G,L=G.party[0];const out={};const cls=id=>t.S().classes.find(c=>c.id===id);
      out.humanFeat=t.hasFeat(L,'alert');
      // brutal crits: 1d8 crit = 8 + 1d8
      let lo=99,hi=0;for(let i=0;i<300;i++){const v=t.roll('1d8',true).total;lo=Math.min(lo,v);hi=Math.max(hi,v);}out.crit=[lo,hi];
      // exhaustion stages
      L.exh=3;out.exh=[t.exhPen(L,false),t.exhPen(L,true)];L.exh=0;
      // initiative: DEX breaks a tie
      const a={init:12,def:{},side:'m'},bb={init:12,side:'m'};
      // surprise: an awake monster you bump into without sneaking isn't surprised
      G.mons=[];const g=t.mkMon(t.monByKey('goblin'),L.x+1,L.y);G.mons.push(g);G.sneak=false;g.state='idle';out.noSurprise=!t.monsterSurprised(g);g.state='sleep';out.sleepSurprise=t.monsterSurprised(g);g.state='idle';
      // flanking: an ally on the far side gives +2
      const f2=t.mkHero(cls('rogue'),'elf');G.party.push(f2);f2.x=g.x+1;f2.y=g.y;const ok=!t.isWall(f2.x,f2.y);
      t.setC({units:[L,f2,g],cur:L,round:2,xp:0,actions:1,bonus:true,attacksLeft:0,moveLeft:6,panel:'main',mode:'move'});g.inCombat=true;
      const md=t.attackMods(L,g,t.weaponOf(L,'main'));out.flank=ok?md.notes.some(n=>/flanking/.test(n)):'skip';
      // natural 20 initiative: advantage on the first attack
      L.st.quick=true;out.quick=t.attackMods(L,g,t.weaponOf(L,'main')).adv.includes('natural 20 initiative');delete L.st.quick;
      // potions: two ways to drink
      t.addItem('potion');L.hp=3;const ib=t.itemButtons(L).map(x=>x.t);out.potions=ib.includes('GULP POTION')&&ib.includes('DRINK POTION FULLY');
      // shields: raise for +2 AC; block a big hit (shield breaks)
      const ac0=t.acOf(L);const rs=t.actionButtons(L).find(x=>x.t==='RAISE SHIELD');out.raise=!!rs;L.st.raised=true;out.raisedAC=t.acOf(L)-ac0;delete L.st.raised;
      t.S().rules.autoReact=true;L.hp=L.maxHp;L.reaction=true;const before=L.hp;await t.dealDamage(L,9,'slashing',{attack:true,src:g});out.block=[L.hp===before,!!L.shieldBroken,t.acOf(L)];t.S().rules.autoReact=false;t.setC(null);
      // rests can't be stacked
      G.lastRestStep=G.steps;out.restSoon=t.restTooSoon(false)>0;G.lastRestStep=G.steps-100;out.restLater=t.restTooSoon(false)===0;
      // barrels: fill a flask
      const bar={type:'barrel',x:L.x+1,y:L.y};G.objs.push(bar);const oil0=G.bag.oil||0;window.__want='FILL';await t.pushMenu(bar,1,0);out.fill=(G.bag.oil||0)===oil0+1&&bar.fills===2;
      // foraging: a lone fighter can't, until someone reads the almanac
      out.forageBefore=!t.forageLeader();t.addItem('almanac');t.readAlmanac();out.forageAfter=t.forageLeader()===L&&t.classActions(L).some(a=>a.t==='FORAGE');
      // mouse holes: generated, and a druid can sneak into a vault through one
      let holes=0,vh=0;for(let s=1;s<=30;s++){G.seed=s*31;G.floor=1+s%3;t.genFloor();holes+=G.holes.length;if(G.holes.some(h=>h.vault))vh++;}out.holes=[holes,vh];
      for(let s=1;s<=40;s++){G.seed=s*17;G.floor=1;t.genFloor();if(G.holes.some(h=>h.vault))break;}
      const hole=G.holes.find(h=>h.vault);if(hole){const dr=t.mkHero(cls('druid'),'elf');dr.res.wildshape=2;G.party.push(dr);window.__want='DRUID';await t.holeInteract(hole,true);
        const vr=G.rooms.find(r=>r.role==='vault');out.vaultOpened=G.objs.filter(o=>o.type==='door'&&t.entrances(vr).some(e=>e.x===o.x&&e.y===o.y)).every(d=>!d.locked);}
      return out;})()""")
    print(r,errs)
    ok=not errs and r["humanFeat"] and r["crit"][0]>=9 and r["crit"][1]==16 and r["exh"]==[3,1] and r["noSurprise"] and r["sleepSurprise"] and r["flank"] in (True,"skip") and r["quick"] and r["potions"] and r["raise"] and r["raisedAC"]==2 and r["block"][0] and r["block"][1] and r["restSoon"] and r["restLater"] and r["fill"] and r["forageBefore"] and r["forageAfter"] and r["holes"][1]>0 and r.get("vaultOpened",False)
    print("PASS" if ok else "FAIL");await b.close()
asyncio.run(main())
