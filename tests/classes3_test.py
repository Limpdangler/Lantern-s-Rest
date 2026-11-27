# Bats, flying the owl, the Paladin (smite), the Gunslinger (bullets, misfires, whip reach, powder), and sliding on the D-pad.
import asyncio,os
from playwright.async_api import async_playwright
DIST=os.path.join(os.path.dirname(os.path.abspath(__file__)),"..","dist","lantern-crawl.html")
HOOK="""window.__t={get G(){return G},get C(){return C},setC:v=>{C=v;},S:()=>S,mkHero,mkMon,monByKey,attack,weaponOf,chooseSubclasses,startOwl,tryMove,pressA,genFloor,enterable,layPowder,igniteAt,gnd,GROUND,isWall,objAt,unitAt,inReachW,slotAvail,startCombat};requestAnimationFrame(loop);"""
CLICKER="""window.__want=null;setInterval(()=>{const bs=[...document.querySelectorAll('#chBtns button')].filter(b=>!b.disabled&&b.offsetParent);if(!bs.length)return;
  const b=(window.__want&&bs.find(x=>new RegExp(window.__want).test(x.textContent)))||bs[0];b.click();},30);"""
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(executable_path="/usr/bin/google-chrome");pg=await b.new_page(viewport={"width":412,"height":860},has_touch=True);errs=[];pg.on("pageerror",lambda e:errs.append(str(e)))
    html=open(DIST).read();i=html.rindex("requestAnimationFrame(loop);");html=html[:i]+HOOK+html[i+28:]
    await pg.set_content("<body>"+html+"</body>");await pg.wait_for_timeout(300);await pg.evaluate(CLICKER)
    await pg.evaluate("window.__skipIntro=true");await pg.click("#btnSetOut");await pg.click("#pick-paladin");await pg.click("#pick-race-human");await pg.wait_for_timeout(500);await pg.evaluate("document.getElementById('kA').click()");await pg.wait_for_timeout(200)
    # D-pad: press right, slide up without lifting
    pad=await pg.evaluate("(()=>{const r=document.querySelector('.dpad').getBoundingClientRect();return [r.left,r.top,r.width,r.height];})()")
    cx,cy,w,h=pad[0]+pad[2]/2,pad[1]+pad[3]/2,pad[2],pad[3]
    await pg.evaluate(f"""(()=>{{const pad=document.querySelector('.dpad');const ev=(t,x,y)=>pad.dispatchEvent(new PointerEvent(t,{{bubbles:true,pointerId:7,clientX:x,clientY:y,pointerType:'touch'}}));
      ev('pointerdown',{cx+w*0.38},{cy});setTimeout(()=>ev('pointermove',{cx},{cy-h*0.38}),250);setTimeout(()=>ev('pointerup',{cx},{cy-h*0.38}),900);}})()""")
    await pg.wait_for_timeout(1200);out={"dragFace":await pg.evaluate("__t.G.party[0].face")}
    await pg.evaluate("window.__fast=0.01")
    r=await pg.evaluate("""(async()=>{const t=__t,G=t.G,L=G.party[0];const o={};const cls=id=>t.S().classes.find(c=>c.id===id);G.mons=[];
      o.classes=t.S().classes.map(c=>c.id).join(',');
      // paladin smite
      t.S().rules.autoReact=true;const g=t.mkMon(t.monByKey('skeleton'),L.x+1,L.y);g.hp=g.maxHp=60;g.inCombat=true;g.fac='undead';G.mons.push(g);
      t.setC({units:[L,g],cur:L,round:1,xp:0,actions:1,bonus:true,attacksLeft:1,moveLeft:6,panel:'main'});const R=Math.random;Math.random=()=>0.97;
      const s0=L.slots[0];await t.attack(L,g,t.weaponOf(L,'main'));Math.random=R;o.smite=[s0,L.slots[0],60-g.hp];
      // gunslinger
      const f=t.mkHero(cls('fighter'),'human');f.x=L.x;f.y=L.y+1;G.party.push(f);G.level=3;window.__want='GUNSLINGER|WHIP';await t.chooseSubclasses();window.__want=null;
      o.gs=[f.sub,f.look,G.bag.bullets,f.gsAlt,t.weaponOf(f,'main').name,t.weaponOf(f,'alt').reach];
      const far=t.mkMon(t.monByKey('goblin'),Math.min(G.W-2,f.x+25),f.y);far.state='idle';G.mons.push(far);
      t.setC({units:[f,g],cur:f,round:1,xp:0,actions:1,bonus:true,attacksLeft:1,moveLeft:6,panel:'main'});Math.random=()=>0.0;await t.attack(f,g,t.weaponOf(f,'main'));Math.random=R;
      o.shot=[G.bag.bullets,!!f.jammed,far.state];
      g.x=f.x+2;g.y=f.y;o.whipReach=t.inReachW(f,g,t.weaponOf(f,'alt'));t.setC(null);t.S().rules.autoReact=false;
      // owl
      const wz=t.mkHero(cls('wizard'),'elf');wz.x=L.x;wz.y=L.y;G.party.unshift(wz);G.mons=[];G.owlCd=0;t.startOwl(wz);const s=G.scout;let moved=0;
      for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const x0=s.x;s.next=0;await t.tryMove(dx,dy);if(s.x!==x0||s.y!==wz.y){moved++;break;}}o.owl=[!!s,moved,wz.x===L.x];await t.pressA();o.owlBack=!G.scout;
      // powder trail
      G.party=[f];f.face='s';f.flip=false;let ok=null;for(let y=1;y<G.H-1&&!ok;y++)for(let x=1;x<G.W-4;x++)if([1,2,3].every(k=>!t.isWall(x+k,y)&&!t.objAt(x+k,y)&&t.gnd(x+k,y)===0)&&!t.isWall(x,y)){ok=[x,y];break;}
      f.x=ok[0];f.y=ok[1];const b0=G.bag.bullets;t.layPowder(f);o.powder=[1,2,3].filter(k=>t.gnd(f.x+k,f.y)===t.GROUND.powder).length;t.igniteAt(f.x+1,f.y);await new Promise(r=>setTimeout(r,800));o.fuse=[1,2,3].filter(k=>t.gnd(f.x+k,f.y)===t.GROUND.powder).length;
      // bats
      let bats=0;for(let s2=1;s2<=40&&!bats;s2++){G.seed=s2*11;G.floor=1;t.genFloor();bats=G.mons.filter(m=>m.key==='bat').length;}o.bats=bats;
      const bat=G.mons.find(m=>m.key==='bat');let wet=null;for(let y=0;y<G.H&&!wet;y++)for(let x=0;x<G.W;x++)if(t.gnd(x,y)===t.GROUND.water){wet=[x,y];break;}o.batFlies=wet?t.enterable(bat,wet[0],wet[1]):'nowater';
      return o;})()""")
    out.update(r);print(out,errs)
    ok=not errs and out["dragFace"]=="b" and "paladin" in r["classes"] and r["smite"][1]<r["smite"][0] and r["gs"][0]=="gunslinger" and r["gs"][1]=="gunslinger" and r["gs"][2]==20 and r["gs"][4]=="Pistol" and r["gs"][5]==2 and r["shot"][0]==19 and r["shot"][1] and r["shot"][2]!="idle" and r["whipReach"] and r["owl"][1]==1 and r["owlBack"] and r["powder"]==3 and r["fuse"]==0 and r["bats"]>0 and r["batFlies"] in (True,"nowater")
    print("PASS" if ok else "FAIL");await b.close()
asyncio.run(main())
