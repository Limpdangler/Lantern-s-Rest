import asyncio,sys,json
from playwright.async_api import async_playwright
HOOK="window.__t={get G(){return G},get C(){return C},get mode(){return mode},get busy(){return busy},get choosing(){return choosing},get S(){return S},featButtons,actionButtons,itemButtons,onTile,onTarget,validTarget,endHeroTurn,exploreTap,inReachW,weaponOf,foesOf,heroesUp,isWall,inB,seen,canAttack,objAt,monAt,trapAt,doRest,startCombat,genFloor,buildFloor:genFloor,cancelTarget};requestAnimationFrame(loop);"
BOT=r"""
window.__step=async function(){const t=__t;const G=t.G;if(!G||G.demo)return 'nogame';
 if(!document.getElementById('ovEnd').hidden)return 'end';
 if(t.choosing){const bs=[...document.querySelectorAll('#chBtns button')].filter(b=>!b.disabled);const q=document.getElementById('tText').textContent;
   let pick=bs[0];if(/Ambush/.test(q))pick=bs[0];if(/ladder/.test(q))pick=bs[0];if(/Halt|path|Which beast/.test(q))pick=bs[Math.floor(Math.random()*bs.length)];if(/Fallen rock/.test(q)){const dg=bs.find(b=>/DIG/.test(b.textContent));if(dg)pick=dg;}if(/Thunderwave/.test(q))pick=bs[0];
   if(pick)pick.click();return 'choice';}
 if(t.busy)return 'busy';
 if(t.mode==='combat'){const C=t.C;if(!C||!C.cur||C.cur.side!=='h')return 'wait';const u=C.cur;
   if(C.mode==='target'){const s=C.tgt;const cands=[];for(let y=u.y-s.range;y<=u.y+s.range;y++)for(let x=u.x-s.range;x<=u.x+s.range;x++)if(t.validTarget(s,x,y))cands.push([x,y]);
     if(!cands.length){t.cancelTarget();return 'cancel';}let best=cands[0];if(s.kind==='tile'){let bs=-1;for(const c of cands){const n=G.mons.filter(m=>m.inCombat&&Math.abs(m.x-c[0])<=(s.area||0)&&Math.abs(m.y-c[1])<=(s.area||0)).length;if(n>bs){bs=n;best=c;}}}
     t.onTarget(best[0],best[1]);if(t.C&&t.C.mode==='target'&&!t.busy)t.onTarget(best[0],best[1]);return 'target';}
   const r=Math.random();
   if(r<.25){const pool=[...t.featButtons(u),...t.actionButtons(u),...t.itemButtons(u)].filter(b=>!b.dis&&b.f);if(pool.length){const b=pool[Math.floor(Math.random()*pool.length)];window.__used=(window.__used||{});window.__used[b.t]=(window.__used[b.t]||0)+1;b.f();return 'skill:'+b.t;}}
   const w=t.weaponOf(u,C.weapon);const foes=t.foesOf(u).filter(f=>t.seen(f.x,f.y));const inR=foes.filter(f=>t.inReachW(u,f,w));
   if(t.canAttack()&&inR.length){t.onTile(inR[0].x,inR[0].y);if(t.C&&t.C.sel)t.onTile(inR[0].x,inR[0].y);return 'atk';}
   if(C.moveLeft>0&&foes.length&&C.reach){let best=null,bd=1e9;for(const [k,v] of C.reach){if(v.c===0||v.c>C.moveLeft)continue;const x=k%G.W,y=(k/G.W)|0;if(G.party.some(h=>h.x===x&&h.y===y&&!h.dead)||G.mons.some(m=>m.x===x&&m.y===y))continue;
       const d=Math.min(...foes.map(f=>Math.max(Math.abs(f.x-x),Math.abs(f.y-y))));const want=w.melee?1:Math.min(4,w.range);const sc=Math.abs(d-want);if(sc<bd){bd=sc;best=[x,y];}}
     if(best&&!(best[0]===u.x&&best[1]===u.y)&&!window.__moved){window.__moved=1;t.onTile(best[0],best[1]);if(t.C&&t.C.pending!=null)t.onTile(best[0],best[1]);return 'move';}}
   window.__moved=0;t.endHeroTurn();return 'end turn';}
 if(t.mode==='explore'){const L=G.party[0];
   const tgts=[];if(G.npc&&G.explored[G.npc.y][G.npc.x])tgts.push([G.npc.x,G.npc.y,'npc']);
   for(const o of G.objs)if(!o.gone&&G.explored[o.y][o.x]&&((o.type==='chest'&&!o.opened)||(o.type==='shrine'&&!o.used)||(o.type==='runes'&&!o.used)||(o.type==='door'&&o.locked)||o.type==='rubble'))tgts.push([o.x,o.y,o.type]);
   for(const it of G.items)if(G.explored[it.y][it.x])tgts.push([it.x,it.y,'item']);
   for(const m of G.mons)if(t.seen(m.x,m.y)&&!m.peace)tgts.push([m.x,m.y,'mon']);
   if(!tgts.length){ // frontier
     let best=null,bd=1e9;for(let y=1;y<G.H-1;y++)for(let x=1;x<G.W-1;x++){if(!G.explored[y][x]||t.isWall(x,y))continue;if([[1,0],[-1,0],[0,1],[0,-1]].some(([a,b])=>!G.explored[y+b][x+a])){const d=Math.abs(x-L.x)+Math.abs(y-L.y)+Math.random()*3;if(d<bd&&d>0){bd=d;best=[x,y,'frontier'];}}}
     if(best&&!(window.__lastF&&window.__lastF[0]===best[0]&&window.__lastF[1]===best[1]&&window.__fc>3))tgts.push(best);}
   if(G.stairs&&G.explored[G.stairs.y][G.stairs.x]&&(tgts.length===0||window.__stuck>8))tgts.unshift([G.stairs.x,G.stairs.y,'stairs']);
   if(!tgts.length){return 'idle';}
   window.__ign=window.__ign||new Set();for(let q=tgts.length-1;q>=0;q--)if(window.__ign.has(tgts[q][0]+','+tgts[q][1]))tgts.splice(q,1);if(!tgts.length){window.__ign.clear();window.__stuck=99;return 'idle';}tgts.sort((a,b)=>(Math.abs(a[0]-L.x)+Math.abs(a[1]-L.y))-(Math.abs(b[0]-L.x)+Math.abs(b[1]-L.y)));const g=tgts[0];
   const before=L.x+','+L.y;
   if(g[2]==='frontier'){if(window.__lastF&&window.__lastF[0]===g[0]&&window.__lastF[1]===g[1])window.__fc=(window.__fc||0)+1;else window.__fc=0;window.__lastF=g;}
   if(['npc','chest','shrine','runes','door','mon','rubble'].includes(g[2])){ // step next to it then bump
     const adj=[[1,0],[-1,0],[0,1],[0,-1]].map(([a,b])=>[g[0]+a,g[1]+b]).filter(([x,y])=>!t.isWall(x,y)&&G.explored[y][x]).sort((p,q)=>(Math.abs(p[0]-L.x)+Math.abs(p[1]-L.y))-(Math.abs(q[0]-L.x)+Math.abs(q[1]-L.y)));
     if(g[2]==='mon'){t.exploreTap(g[0],g[1]);return 'ambush';}
     if(adj.length&&!(L.x===adj[0][0]&&L.y===adj[0][1])&&Math.abs(L.x-g[0])+Math.abs(L.y-g[1])!==1)t.exploreTap(adj[0][0],adj[0][1]);
     const L2=G.party[0];if(Math.abs(L2.x-g[0])+Math.abs(L2.y-g[1])===1){await new Promise(r=>{const ev=new KeyboardEvent('keydown',{key:g[0]>L2.x?'ArrowRight':g[0]<L2.x?'ArrowLeft':g[1]>L2.y?'ArrowDown':'ArrowUp'});document.dispatchEvent(ev);setTimeout(r,50);});}
   } else t.exploreTap(g[0],g[1]);
   const after=G.party[0].x+','+G.party[0].y;window.__stuck=before===after?(window.__stuck||0)+1:0;
   if(window.__stuck>5){window.__ign.add(g[0]+','+g[1]);}if(window.__stuck>14){for(const o of G.objs)if(o.type==='door'&&o.locked){o.locked=false;}window.__stuck=0;}
   return 'explore:'+g[2];}
 return t.mode;}
"""
async def main():
  cls=sys.argv[1] if len(sys.argv)>1 else "fighter"
  steps=int(sys.argv[2]) if len(sys.argv)>2 else 1500
  async with async_playwright() as p:
    b=await p.chromium.launch(executable_path="/usr/bin/google-chrome")
    pg=await b.new_page(viewport={"width":390,"height":800},device_scale_factor=2)
    errs=[];pg.on("pageerror",lambda e:errs.append("PAGE:"+str(e)));pg.on("console",lambda m:errs.append("CON:"+m.text) if m.type=="error" else None)
    html=open(""+__import__("os").path.join(__import__("os").path.dirname(__file__),"..","dist","lantern-crawl.html")+"").read()
    i=html.rindex("requestAnimationFrame(loop);");html=html[:i]+HOOK+html[i+len("requestAnimationFrame(loop);"):]
    await pg.set_content("<!doctype html><html><head><meta name=viewport content='width=device-width,initial-scale=1'></head><body>"+html+"<script>"+BOT+"</script></body></html>")
    await pg.wait_for_timeout(600)
    await pg.screenshot(path=f"/tmp/shots/b_{cls}_0.png")
    await pg.click("#btnSetOut");await pg.click(f"#pick-{cls}");await pg.click("#pick-race-elf" if 'bot.py'=="bot.py" else "#pick-race-human");await pg.evaluate("window.__fast=0.03");await pg.wait_for_timeout(200);await pg.evaluate("__t.G.party.forEach(h=>{h.maxHp*=3;h.hp=h.maxHp})")
    last="";hist={};shots=0;floor=1
    for i in range(steps):
      try:
        r=await asyncio.wait_for(pg.evaluate("window.__step()"),timeout=60)
      except Exception as e:
        errs.append("STEP TIMEOUT/ERR "+str(e)[:200]);break
      k=r.split(':')[0];hist[k]=hist.get(k,0)+1
      if i>300 and i%100==0: print('at',i,r,await pg.evaluate('JSON.stringify([__t.G.party[0].x,__t.G.party[0].y,__t.mode,__t.busy])'))
      fl=await pg.evaluate("__t.G&&__t.G.floor")
      if fl!=floor: floor=fl;await pg.screenshot(path=f"/tmp/shots/b_{cls}_f{fl}.png")
      if r in("atk","target") and shots<3 and i>30:
        await pg.screenshot(path=f"/tmp/shots/b_{cls}_c{shots}.png");shots+=1
      if r=="end":
        runs=runs+1 if 'runs' in dir() else 1
        print("run ended: floor",await pg.evaluate("__t.G.floor"),"lvl",await pg.evaluate("__t.G.level"),"kills",await pg.evaluate("__t.G.kills"))
        await pg.click("#btnAgain");await pg.wait_for_timeout(100);await pg.click("#btnSetOut");await pg.click(f"#pick-{cls}");await pg.click("#pick-race-elf" if 'bot.py'=="bot.py" else "#pick-race-human");await pg.wait_for_timeout(100)
        await pg.evaluate("__t.G.party.forEach(h=>{h.maxHp*=3;h.hp=h.maxHp})")
        continue
      await pg.wait_for_timeout(15 if r!='busy' else 40)
    await pg.screenshot(path=f"/tmp/shots/b_{cls}_last.png")
    info=await pg.evaluate("({floor:__t.G.floor,level:__t.G.level,party:__t.G.party.map(h=>h.name+':'+h.hp+'/'+h.maxHp).join(','),kills:__t.G.kills,mode:__t.mode,used:window.__used,subs:__t.G.party.map(h=>h.id+`:`+h.sub).join(),light:__t.G.light,fuel:__t.G.fuel,bag:__t.G.bag,fat:__t.G.fatigue,exh:__t.G.party.map(h=>h.exh+(h.down?`D`:``)+(h.stable?`S`:``)).join(),busy:__t.busy,ch:!!__t.choosing,steps:__t.G.steps,unexpl:(()=>{let n=0;for(const r of __t.G.explored)for(const v of r)if(!v)n++;return n})()})")
    print(cls,"steps",i,"hist",hist);print("info",json.dumps(info))
    print("state:",json.dumps(await pg.evaluate("__t.C?{cur:__t.C.cur.name,units:__t.C.units.map(u=>({n:u.name,x:u.x,y:u.y,hp:u.hp,inC:u.inCombat,fl:!!u.fleeing,st:Object.keys(u.st),state:u.state})),round:__t.C.round}:null")))
    print("log:"," | ".join(await pg.evaluate("[...document.querySelectorAll('#log p')].slice(-10).map(p=>p.textContent)")))
    print("errors:",len(errs));[print("  ",e[:300]) for e in errs[:12]]
    await b.close()
asyncio.run(main())
