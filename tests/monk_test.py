# Monk, traits, rest tasks, jumping hazards, fire outside combat, armour, safer rests.
import asyncio,os
from playwright.async_api import async_playwright
DIST=os.path.join(os.path.dirname(os.path.abspath(__file__)),"..","dist","lantern-crawl.html")
HOOK="""window.__t={get G(){return G},get C(){return C},setC:v=>{C=v;},S:()=>S,mkHero,mkMon,monByKey,featButtons,actionButtons,useAttack,acOf,dealDamage,conditionTurn,shortRest,jumpOver,fireOnTile,packCap,isWall,enterable,objAt,doorAt,unitAt,trapAt,gnd,GROUND,armourButtons,doorSafety,campRisk,PERKS,elevAt};requestAnimationFrame(loop);"""
CLICKER="""window.__want=null;setInterval(()=>{const bs=[...document.querySelectorAll('#chBtns button')].filter(b=>!b.disabled&&b.offsetParent);if(!bs.length)return;
  const b=(window.__want&&bs.find(x=>new RegExp(window.__want).test(x.textContent)))||bs[0];b.click();},30);"""
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(executable_path="/usr/bin/google-chrome");pg=await b.new_page();errs=[];pg.on("pageerror",lambda e:errs.append(str(e)))
    html=open(DIST).read();i=html.rindex("requestAnimationFrame(loop);");html=html[:i]+HOOK+html[i+28:]
    await pg.set_content("<body>"+html+"</body>");await pg.wait_for_timeout(300)
    await pg.evaluate(CLICKER)
    await pg.click("#btnSetOut");await pg.click("#pick-monk");await pg.click("#pick-race-elf");await pg.evaluate("window.__fast=0.01");await pg.wait_for_timeout(1800)
    r=await pg.evaluate("""(async()=>{const t=__t,G=t.G,L=G.party[0];const out={};const cls=id=>t.S().classes.find(c=>c.id===id);
      out.monk=[L.id,t.acOf(L),L.res.ki,!!L.perk];
      // martial arts needs an attack first
      G.mons=[];const g=t.mkMon(t.monByKey('goblin'),L.x+1,L.y);G.mons.push(g);g.inCombat=true;
      t.setC({units:[L,g],cur:L,round:1,xp:0,actions:1,bonus:true,attacksLeft:0,moveLeft:7,panel:'main',mode:'move',attackedOnce:false});
      const ma=()=>t.featButtons(L).find(x=>x.t==='MARTIAL ARTS');out.maBefore=!ma().dis;t.useAttack(L);out.maAfter=!ma().dis;
      out.feats=t.featButtons(L).map(x=>x.t).filter(x=>/FLURRY|PATIENT|STEP/.test(x)).length;
      // deflect missiles
      t.S().rules.autoReact=true;const archer=t.mkMon(t.monByKey('goblin'),L.x+5,L.y);L.reaction=true;L.hp=L.maxHp;const hp0=L.hp;await t.dealDamage(L,6,'piercing',{attack:true,src:archer});out.deflect=hp0-L.hp<6;t.S().rules.autoReact=false;
      // stunned monsters lose a turn
      g.st.stunned=true;out.stunned=await t.conditionTurn(g);t.setC(null);
      // rest tasks: a hero at full health does their task on a short rest
      const f=t.mkHero(cls('fighter'),'dwarf');f.x=L.x;f.y=L.y+1;G.party.push(f);f.hp=f.maxHp;const ac0=t.acOf(f);L.hp=1;G.shortRests=0;await t.shortRest();out.task=[f.task,t.acOf(f)-ac0,L.task||null];
      // traits
      const cap0=t.packCap();f.perk='packmule';out.packmule=t.packCap()-cap0;out.nPerks=Object.keys(t.PERKS).length;
      // armour off: put it back on in a fight
      f.armourOff=true;t.setC({units:[f],cur:f,round:1,xp:0,actions:1,bonus:true,attacksLeft:0,moveLeft:6,panel:'main'});out.armour=t.armourButtons(f).length===1;t.setC(null);f.armourOff=false;
      // fire outside combat sets a barrel off
      let spot=null;for(let y=1;y<G.H-1&&!spot;y++)for(let x=1;x<G.W-3;x++){if([0,1,2].every(k=>!t.isWall(x+k,y)&&!t.unitAt(x+k,y)&&!t.objAt(x+k,y)&&!t.doorAt(x+k,y)&&!t.trapAt(x+k,y)&&t.gnd(x+k,y)===t.GROUND.none&&t.elevAt(x+k,y)===t.elevAt(x,y))){spot=[x,y];break;}}
      const bar={type:'barrel',x:spot[0]+2,y:spot[1]};G.objs.push(bar);const what=await t.fireOnTile(bar.x,bar.y,L);out.fire=what.length>0;
      // jumping over a found trap
      G.party=G.party.filter(h=>h===L);let s2=null;for(let y=1;y<G.H-1&&!s2;y++)for(let x=1;x<G.W-3;x++){if([0,1,2].every(k=>!t.isWall(x+k,y)&&!t.unitAt(x+k,y)&&!t.objAt(x+k,y)&&!t.doorAt(x+k,y)&&!t.trapAt(x+k,y)&&t.gnd(x+k,y)===t.GROUND.none&&t.elevAt(x+k,y)===t.elevAt(x,y))&&!G.fire.has(y*G.W+x)){s2=[x,y];break;}}
      L.x=s2[0];L.y=s2[1];const trap={x:s2[0]+1,y:s2[1],type:'darts',dc:12,found:true};G.traps.push(trap);const R=Math.random;Math.random=()=>0.95;await t.jumpOver(1,0);Math.random=R;out.jump=[L.x-s2[0],trap.done||false];
      out.safety=typeof t.doorSafety().mult==='number';
      return out;})()""")
    print(r,errs)
    ok=not errs and r["monk"][0]=="monk" and r["monk"][1]==15 and r["monk"][2]>=2 and r["monk"][3] and not r["maBefore"] and r["maAfter"] and r["feats"]==3 and r["deflect"] and r["stunned"] and r["task"][0]=="kit" and r["task"][1]==1 and r["task"][2] is None and r["packmule"]==5 and r["nPerks"]>=16 and r["armour"] and r["fire"] and r["jump"][0]==2 and r["safety"]
    print("PASS" if ok else "FAIL");await b.close()
asyncio.run(main())
