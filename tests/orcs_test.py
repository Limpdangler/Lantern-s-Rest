# Weapons (common, magic, proficiency), orc camps (favour, half-orcs, trade), fights you hear, "hand them over", and the demon's bargain.
import asyncio,os
from playwright.async_api import async_playwright
DIST=os.path.join(os.path.dirname(os.path.abspath(__file__)),"..","dist","lantern-crawl.html")
HOOK="""window.__t={get G(){return G},get mode(){return mode},setMode:v=>{mode=v;busy=false;},setC:v=>{C=v;},S:()=>S,genFloor,mkHero,mkMon,monByKey,registerWeapon,equipWeapon,weaponOf,atkBonus,proficientWith,chestLoot,randomWeaponId,
  placeOrcCamp,orcTalk,campOrcs,covetOffer,D2_ACT,skTick,packLoad,packCap,itemName,packRun,unpackRun,saveBonus,heroDV};requestAnimationFrame(loop);"""
CLICKER="""window.__want=null;setInterval(()=>{const bs=[...document.querySelectorAll('#chBtns button')].filter(b=>!b.disabled&&b.offsetParent);if(!bs.length)return;
  const b=(window.__want&&bs.find(x=>new RegExp(window.__want).test(x.textContent)))||bs[0];b.click();},30);"""
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(executable_path="/usr/bin/google-chrome");pg=await b.new_page(viewport={"width":412,"height":860});errs=[];pg.on("pageerror",lambda e:errs.append(str(e)))
    html=open(DIST).read();i=html.rindex("requestAnimationFrame(loop);");html=html[:i]+HOOK+html[i+28:]
    await pg.set_content("<body>"+html+"</body>");await pg.wait_for_timeout(300);await pg.evaluate(CLICKER)
    await pg.evaluate("window.__skipIntro=true");await pg.click("#btnSetOut");await pg.click("#pick-wizard");await pg.click("#pick-race-halforc");await pg.wait_for_timeout(600);await pg.evaluate("window.__fast=0.01")
    r=await pg.evaluate("""(async()=>{const t=__t,G=t.G,L=G.party[0];const o={};const R=Math.random;
      // weapons
      t.registerWeapon('w_greatsword');t.registerWeapon('w_dagger');G.bag['w_greatsword']=1;G.bag['w_dagger']=1;
      const fi=t.mkHero(t.S().classes.find(c=>c.id==='fighter'),'human');fi.x=L.x;fi.y=L.y;G.party.push(fi);
      const b0=t.atkBonus(fi,t.weaponOf(fi,'main'));t.equipWeapon(fi,'w_greatsword');o.fighter=[t.weaponOf(fi,'main').name,t.weaponOf(fi,'main').dice,t.atkBonus(fi,t.weaponOf(fi,'main'))===b0];
      const wb=t.atkBonus(L,t.weaponOf(L,'alt'));t.registerWeapon('w_greatsword');G.bag['w_greatsword']=1;t.equipWeapon(L,'w_greatsword');o.wizard=[t.weaponOf(L,'main').name,t.weaponOf(L,'alt').name,t.weaponOf(L,'alt').noProf,t.proficientWith(L,'dagger')];
      const mid=t.randomWeaponId(true);o.magic=[mid,t.itemName(mid)];
      // common weapons in a chest ask first
      const ch={type:'chest',x:L.x+1,y:L.y,opened:false,kitted:true,loot:{gold:5,items:['w_maul']}};window.__want='LEAVE';await t.chestLoot(ch,0);window.__want=null;o.leftMaul=!G.bag['w_maul'];
      // magic weapons turn up on some floors only
      let floorsWithMagic=0;for(let s=1;s<=30;s++){G.seed=s*5;G.floor=3;t.genFloor();if(G.objs.some(q=>q.type==='chest'&&q.loot&&q.loot.items.some(id=>/_p\\d/.test(id))))floorsWithMagic++;}o.magicFloors=floorsWithMagic;
      // save + load keeps weapons
      const pk=t.packRun();o.saveOK=!!pk;
      // orc camp: half-orc in the party, win favour by gifts, then trade
      G.floor=3;t.genFloor();G.mons=[];G.orcCamps=[];const r0=G.rooms.find(r=>r.role!=='start')||G.rooms[0];t.placeOrcCamp(r0,null);const camp=G.orcCamps[0];G.bag.ration=6;
      window.__want='GIFT';await t.orcTalk(camp,true);await t.orcTalk(camp,false);window.__want=null;o.camp=[camp.favour,camp.friendly,t.campOrcs(camp).length];
      // covet: hand over a party member
      const grp=t.campOrcs(camp);const n0=G.party.length;Math.random=()=>0.01;window.__want='HAND OVER|SELL|TRADE';const took=await t.covetOffer(grp,'orcs',{});Math.random=R;window.__want=null;o.covet=[took,n0-G.party.length];
      // demon bargain
      const dm={type:'demon',x:L.x+1,y:L.y,deco:true};G.objs.push(dm);const asi0=JSON.stringify(L.demonAsi||{});window.__want='STRENGTH|SERPENT|IRON|SHARPER|SILVER|EYES|TONGUES|GOLD|WEAPON';await t.D2_ACT.demon(dm);window.__want=null;
      o.dbg=[JSON.stringify(L.asi),asi0,G.party.length,L.saveCurse,L.hpCurse];o.demon=[!!dm.gone,JSON.stringify(L.demonAsi||{})!==asi0||!!L.devilEyes||!!L.allTongues||!!L.saveCurse||!!L.hpCurse];
      return o;})()""")
    print(r,errs)
    ok=(not errs and r["fighter"][0]=="Greatsword" and r["fighter"][1]=="2d6" and r["fighter"][2] and r["wizard"][0]=="Fire Bolt" and r["wizard"][1]=="Greatsword" and r["wizard"][2] and r["wizard"][3]
      and "_p" in r["magic"][0] and r["leftMaul"] and 4<=r["magicFloors"]<=20 and r["saveOK"] and r["camp"][1] and r["covet"]==[True,1] and r["demon"]==[True,True])
    print("PASS" if ok else "FAIL");await b.close()
asyncio.run(main())
