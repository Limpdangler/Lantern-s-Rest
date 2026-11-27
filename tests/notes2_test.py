# 27 Nov notes: taps clear messages, walking away from the ladder prompt, animal forms, kin talk, stomping fire, mimics in fires, recruits.
import asyncio,os
from playwright.async_api import async_playwright
DIST=os.path.join(os.path.dirname(os.path.abspath(__file__)),"..","dist","lantern-crawl.html")
HOOK="""window.__t={get G(){return G},get C(){return C},get choosing(){return choosing},get sayState(){return sayState},get mode(){return mode},say,stairsPrompt,doorInteract,startWild,mkMon,monByKey,isWall,objAt,unitAt,doorAt,scorch,stompFire,stompable,genFloor,S:()=>S,kinTalk,isKin};requestAnimationFrame(loop);"""
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(executable_path="/usr/bin/google-chrome");pg=await b.new_page(viewport={"width":412,"height":800});errs=[];pg.on("pageerror",lambda e:errs.append(str(e)))
    html=open(DIST).read();i=html.rindex("requestAnimationFrame(loop);");html=html[:i]+HOOK+html[i+28:]
    await pg.set_content("<body>"+html+"</body>");await pg.wait_for_timeout(300)
    await pg.evaluate("window.__skipIntro=true");await pg.click("#btnSetOut");await pg.click("#pick-druid");await pg.click("#pick-race-elf");await pg.wait_for_timeout(500);await pg.click("#kA");await pg.wait_for_timeout(300)
    out={}
    # a held message is cleared by tapping B, and the menu opens
    await pg.evaluate("__t.say('A long message you have not dismissed.',0,true);0");await pg.wait_for_timeout(700);await pg.click("#kB");await pg.wait_for_timeout(900)
    out["menuAfterMsg"]=await pg.evaluate("!document.getElementById('ovMenu').hidden");await pg.evaluate("document.getElementById('ovMenu').hidden=true")
    # ladder prompt: pressing a direction means "not yet" and you walk on
    pos=await pg.evaluate("""(()=>{const G=__t.G,L=G.party[0];L.x=G.stairs.x;L.y=G.stairs.y;L.dx=L.x*16;L.dy=L.y*16;__t.stairsPrompt();for(const [dx,dy,k] of [[1,0,'ArrowRight'],[-1,0,'ArrowLeft'],[0,1,'ArrowDown'],[0,-1,'ArrowUp']])if(!__t.isWall(L.x+dx,L.y+dy)&&!__t.objAt(L.x+dx,L.y+dy))return [L.x,L.y,k];})()""")
    await pg.wait_for_timeout(400);out["promptUp"]=await pg.evaluate("!!__t.choosing");await pg.keyboard.down(pos[2]);await pg.wait_for_timeout(450);await pg.keyboard.up(pos[2]);await pg.wait_for_timeout(300)
    out["walkedAway"]=await pg.evaluate(f"!__t.choosing&&(__t.G.party[0].x!=={pos[0]}||__t.G.party[0].y!=={pos[1]})")
    await pg.evaluate("window.__fast=0.01")
    r=await pg.evaluate("""(async()=>{const t=__t,G=t.G,L=G.party[0];const o={};
      // a wolf can't open doors
      L.res.wildshape=2;t.startWild(L,'wolf');const d={type:'door',x:1,y:1,open:false,locked:false,heard:true};await t.doorInteract(d);o.wolfDoor=!d.open;
      // wolves treat a wolf-shaped druid as kin
      G.mons=[];const w=t.mkMon(t.monByKey('wolf'),L.x+2,L.y);G.mons.push(w);o.kin=t.isKin(w);
      // stomping out a fire
      const k=(L.y)*G.W+L.x+1;G.fire.set(k,3);o.stompable=t.stompable(L.x+1,L.y);t.stompFire(L.x+1,L.y);o.stomped=!G.fire.has(k);
      // a mimic next to a fire reveals itself
      let spot=null;for(const [dx,dy] of [[2,0],[-2,0],[0,2],[0,-2]]){const x=L.x+dx,y=L.y+dy;if(!t.isWall(x,y)&&!t.objAt(x,y)&&!t.unitAt(x,y)){spot=[x,y];break;}}
      const ch={type:'chest',x:spot[0],y:spot[1],mimic:true,loot:[],opened:false};G.objs.push(ch);G.fire.set(spot[1]*G.W+spot[0]+1,3);await t.scorch();o.mimic=ch.gone&&G.mons.some(m=>/Mimic/.test(m.name));
      // recruits can be any class, including one already in the party
      const seen=new Set();for(let s=1;s<=60;s++){G.seed=s*7;G.floor=1;t.genFloor();if(G.npc)seen.add(G.npc.def.id);}o.recruitDruid=seen.has('druid');o.classes=seen.size;
      return o;})()""")
    out.update(r);print(out,errs)
    ok=not errs and out["menuAfterMsg"] and out["promptUp"] and out["walkedAway"] and r["wolfDoor"] and r["kin"] and r["stompable"] and r["stomped"] and r["mimic"] and r["recruitDruid"]
    print("PASS" if ok else "FAIL");await b.close()
asyncio.run(main())
