# Hidden rooms behind cracked walls, and the new class abilities (holy water, illusions, produce flame, monk pits, paladin, snares, lightning in puddles).
import asyncio,os
from playwright.async_api import async_playwright
DIST=os.path.join(os.path.dirname(os.path.abspath(__file__)),"..","dist","lantern-crawl.html")
HOOK="""window.__t={get G(){return G},get C(){return C},setC:v=>{C=v;},get mode(){return mode},setMode:v=>{mode=v;busy=false;},S:()=>S,genFloor,mkHero,mkMon,monByKey,crackInteract,decoInteract,drawDeco,D2_ACT,classActions,dealDamage,
  noticeCracks,isWall,objAt,gnd,GROUND,triggerTrap,setSnare,speakerFor,MLANG:()=>MLANG,itemButtons,gunButtons,flameTargets,produceFlame};requestAnimationFrame(loop);"""
CLICKER="""window.__want=null;setInterval(()=>{const bs=[...document.querySelectorAll('#chBtns button')].filter(b=>!b.disabled&&b.offsetParent);if(!bs.length)return;
  const b=(window.__want&&bs.find(x=>new RegExp(window.__want).test(x.textContent)))||bs[0];b.click();},30);"""
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(executable_path="/usr/bin/google-chrome");pg=await b.new_page(viewport={"width":412,"height":860});errs=[];pg.on("pageerror",lambda e:errs.append(str(e)))
    html=open(DIST).read();i=html.rindex("requestAnimationFrame(loop);");html=html[:i]+HOOK+html[i+28:]
    await pg.set_content("<body>"+html+"</body>");await pg.wait_for_timeout(300);await pg.evaluate(CLICKER)
    await pg.evaluate("window.__skipIntro=true");await pg.click("#btnSetOut");await pg.click("#pick-barbarian");await pg.click("#pick-race-human");await pg.wait_for_timeout(600);await pg.evaluate("window.__fast=0.01")
    r=await pg.evaluate("""(async()=>{const t=__t,G=t.G,L=G.party[0];const o={};const R=Math.random;const kinds={};let cr=null,crSeed=0;
      for(let s=1;s<=60;s++){G.seed=s*17;G.floor=1+(s%5);t.genFloor();for(const c of G.objs.filter(q=>q.type==='crack')){kinds[c.kind]=(kinds[c.kind]||0)+1;if(!cr){cr=c;crSeed=s;}}}o.kinds=kinds;
      // draw every new thing
      for(const ty of ['coffin','darkaltar','pentagram','skullpile','survivor','glint','abyss','office','desk','crack'])t.drawDeco({type:ty,x:3,y:3,deco:true,found:true,rx:0,ry:0,loot:{gold:1,items:[]}},40,40,500);
      // find and break a crack (rage smash)
      G.seed=crSeed*17;G.floor=1+(crSeed%5);t.genFloor();G.mons=[];const c=G.objs.find(q=>q.type==='crack');const dx=c.toward.dx,dy=c.toward.dy;L.x=c.x-dx;L.y=c.y-dy;L.res.rage=2;
      o.wallBefore=t.isWall(c.x,c.y);c.found=true;window.__want='RAGE';await t.crackInteract(c);window.__want=null;o.opened=[!t.isWall(c.x,c.y),!!c.gone];
      // each kind of contents responds without errors
      L.hp=L.maxHp=999;G.bag.rope=1;
      for(const k of ['coffin','darkaltar','survivor','glint','abyss','office','desk','pentagram','skullpile']){t.setMode('explore');t.setC(null);G.mons=[];const ob={type:k,x:L.x+1,y:L.y,deco:true,inside:'loot',item:'ring',loot:{gold:5,items:['potion']},look:'fighter'};G.objs.push(ob);await t.D2_ACT[k](ob);ob.gone=true;}
      const fg={type:'fungus',kind:'mystery',x:L.x,y:L.y+1,deco:true};window.__want='EAT';await t.D2_ACT.fungus(fg);window.__want=null;o.fungus=!!fg.picked;
      t.setMode('explore');t.setC(null);
      // lightning through a puddle
      G.mons=[];let sp=null;for(let y=2;y<G.H-2&&!sp;y++)for(let x=2;x<G.W-6;x++)if([0,1,2,3,4].every(k=>!t.isWall(x+k,y))){sp=[x,y];break;}L.x=sp[0];L.y=sp[1];const a=t.mkMon(t.monByKey('goblin'),L.x+2,L.y),b2=t.mkMon(t.monByKey('goblin'),L.x+4,L.y);a.hp=a.maxHp=50;b2.hp=b2.maxHp=50;G.mons.push(a,b2);for(let x=L.x+2;x<=L.x+4;x++)if(!t.isWall(x,L.y))G.ground[L.y][x]=t.GROUND.water;
      await t.dealDamage(a,10,'lightning',{});o.zap=[50-a.hp,50-b2.hp];
      // party extras
      const add=id=>{const h=t.mkHero(t.S().classes.find(c=>c.id===id),'human');h.x=L.x;h.y=L.y;G.party.push(h);return h;};const cl=add('cleric'),wz=add('wizard'),dr=add('druid'),rg=add('ranger');add('paladin');add('monk');
      G.bag.bottle=1;G.ground[L.y][L.x]=t.GROUND.water;const bless=t.classActions(cl).find(a=>a.t==='BLESS WATER');await bless.f();o.holy=G.bag.holywater||0;
      o.wizAbil=t.classActions(wz).map(a=>a.t).includes('MINOR ILLUSION');o.druidAbil=t.classActions(dr).map(a=>a.t).includes('PRODUCE FLAME');
      const gob=t.mkMon(t.monByKey('goblin'),0,0);o.speak=!!t.speakerFor(gob);
      G.bag.firewood=2;L.face='s';L.flip=false;G.ground[L.y][L.x+1]=0;const n0=G.traps.length;await t.setSnare(rg);o.snare=G.traps.length-n0;
      return o;})()""")
    print(r,errs)
    k=r["kinds"]
    ok=(not errs and len(k)>=9 and r["wallBefore"] and r["opened"]==[True,True] and r["fungus"] and r["zap"][0]==15 and r["zap"][1]==5 and r["holy"]==1 and r["wizAbil"] and r["druidAbil"] and r["speak"] and r["snare"]==1)
    print("PASS" if ok else "FAIL");await b.close()
asyncio.run(main())
