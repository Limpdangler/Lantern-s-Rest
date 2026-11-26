import asyncio,json
from playwright.async_api import async_playwright
HOOK="""window.__t={get G(){return G},get C(){return C},get mode(){return mode},get busy(){return busy},mkHero,mkMon,monByKey,fov,hud,startCombat,featButtons,actionButtons,itemButtons,validTarget,onTarget,cancelTarget,endHeroTurn,applySub,genFloor,SUBS,S:()=>S,heroesUp,chooseSubclasses,attack,weaponOf,reset:()=>{mode="explore";C=null;busy=false;showCombatUI(false);}};requestAnimationFrame(loop);"""
JS=r"""
window.__runSub=async function(cls,sub){const t=__t;const G=t.G;const W=ms=>new Promise(r=>setTimeout(r,ms));
  t.reset();await W(300);
  G.level=5;G.mons=[];const h=t.mkHero(t.S().classes.find(c=>c.id===cls),'human');h.sub=sub;const L=G.party[0];h.x=L.x;h.y=L.y;h.maxHp=200;h.hp=200;
  G.party=[h];t.applySub(h,true);if(cls==='druid'||cls==='barbarian'){}
  // place two goblins next to the hero
  const spots=[[1,0],[0,1],[-1,0],[0,-1],[1,1]].map(([a,b])=>[h.x+a,h.y+b]).filter(([x,y])=>G.t[y][x]!==1);
  for(const [x,y] of spots.slice(0,2)){const m=t.mkMon(t.monByKey('orc'),x,y,false);m.hp=m.maxHp=60;m.state='idle';m.gid=9;G.mons.push(m);}
  t.fov();t.startCombat({bumped:G.mons[0],partyFirst:true});
  for(let i=0;i<60&&!(t.C&&t.C.cur===h&&!t.busy);i++)await W(100);
  if(!(t.C&&t.C.cur===h))return 'never got turn';
  const used=[];
  for(let round=0;round<3;round++){
   const all=[...t.featButtons(h),...t.actionButtons(h)];
   for(const b of all){if(b.dis||!b.f||/REVERT|DASH|DODGE|DISENGAGE|HIDE|HELP|CLOSE|OPEN/.test(b.t))continue;
     try{const p=b.f(h);if(p&&p.then)await Promise.race([p,W(3000)]);}catch(e){used.push('ERR '+b.t+' '+e.message);continue;}
     await W(200);
     if(t.C&&t.C.mode==='target'){const s=t.C.tgt;let done=false;for(let y=h.y-s.range;y<=h.y+s.range&&!done;y++)for(let x=h.x-s.range;x<=h.x+s.range&&!done;x++)if(t.validTarget(s,x,y)){t.onTarget(x,y);await W(150);if(t.C&&t.C.mode==='target')t.onTarget(x,y);done=true;}
       if(!done)t.cancelTarget();}
     for(let i=0;i<50&&t.busy;i++)await W(100);
     used.push(b.t);if(!t.C||t.mode!=='combat')break;}
   if(!t.C||t.mode!=='combat')break;
   // attack once
   const m=G.mons.find(m=>m.hp>0);if(m&&t.C.cur===h){try{await t.attack(h,m,t.weaponOf(h,'main'),{});}catch(e){used.push('ERR atk '+e.message);}}
   t.endHeroTurn();for(let i=0;i<80&&!(t.C&&t.C.cur===h&&!t.busy);i++)await W(100);if(!t.C)break;}
  return used.join(',')+' | hp '+h.hp+' ward '+(h.ward||0)+' thp '+(h.thp||0)+' exh '+h.exh+' party '+G.party.map(x=>x.id).join();};
"""
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(executable_path="/usr/bin/google-chrome")
    pg=await b.new_page(viewport={"width":390,"height":800})
    errs=[];pg.on("pageerror",lambda e:errs.append(str(e)));pg.on("console",lambda m:errs.append("CON:"+m.text) if m.type=="error" and "ERR_TUNNEL" not in m.text else None)
    html=open(""+__import__("os").path.join(__import__("os").path.dirname(__file__),"..","dist","lantern-crawl.html")+"").read();i=html.rindex("requestAnimationFrame(loop);");html=html[:i]+HOOK+html[i+28:]
    await pg.set_content("<body>"+html+"<script>"+JS+"</script></body>")
    await pg.wait_for_timeout(300);await pg.click("#btnSetOut");await pg.click("#pick-fighter");await pg.click("#pick-race-human");await pg.evaluate("window.__fast=0.02")
    await pg.evaluate("setInterval(()=>{const bs=[...document.querySelectorAll('#chBtns button')].filter(x=>!x.disabled);if(!document.getElementById('chPanel').hidden&&bs.length){bs[0].click();}},150)")
    subs=await pg.evaluate("Object.entries(__t.SUBS).flatMap(([c,l])=>l.map(s=>[c,s.id]))")
    for c,s in subs:
      try: r=await asyncio.wait_for(pg.evaluate(f"window.__runSub('{c}','{s}')"),60)
      except Exception as e: r="TIMEOUT/ERR "+str(e)[:200]
      print(c,s,"->",r)
    print("errors",errs[:10])
    await b.close()
asyncio.run(main())
