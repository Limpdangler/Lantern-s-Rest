# Oil: 2x2 flasks, 3x3 barrels, torch splashes, fire spreading between puddles; looking ahead moves the view.
import asyncio,os
from playwright.async_api import async_playwright
DIST=os.path.join(os.path.dirname(os.path.abspath(__file__)),"..","dist","lantern-crawl.html")
HOOK="""window.__t={get G(){return G},throwOil,breakBarrel,tickFire,gnd,GROUND,isWall,objAt,unitAt,toggleLook,get cam(){return cam},spill};requestAnimationFrame(loop);"""
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(executable_path="/usr/bin/google-chrome");pg=await b.new_page();errs=[];pg.on("pageerror",lambda e:errs.append(str(e)))
    html=open(DIST).read();i=html.rindex("requestAnimationFrame(loop);");html=html[:i]+HOOK+html[i+28:]
    await pg.set_content("<body>"+html+"</body>");await pg.wait_for_timeout(300)
    await pg.evaluate("window.__skipIntro=true");await pg.click("#btnSetOut");await pg.click("#pick-fighter");await pg.click("#pick-race-dwarf");await pg.evaluate("window.__fast=0.01");await pg.wait_for_timeout(500)
    r=await pg.evaluate("""(async()=>{const t=__t,G=t.G,L=G.party[0];const o={};G.mons=[];
      const open=(x,y,n)=>{for(let a=-n;a<=n;a++)for(let b=-n;b<=n;b++){const X=x+a,Y=y+b;if(t.isWall(X,Y)||t.objAt(X,Y)||t.unitAt(X,Y)||t.gnd(X,Y)!==0)return false;}return true;};
      let s=null;for(let y=2;y<G.H-2&&!s;y++)for(let x=2;x<G.W-2;x++)if(open(x,y,1)&&Math.max(Math.abs(x-L.x),Math.abs(y-L.y))>3){s=[x,y];break;}
      const cnt=()=>{let n=0;for(let y=0;y<G.H;y++)for(let x=0;x<G.W;x++)if(t.gnd(x,y)===t.GROUND.oil)n++;return n;};
      const c0=cnt();await t.throwOil(s[0],s[1],L);o.flask=cnt()-c0;
      // a barrel somewhere else: 3x3
      let s2=null;for(let y=2;y<G.H-2&&!s2;y++)for(let x=2;x<G.W-2;x++)if(open(x,y,1)&&Math.max(Math.abs(x-s[0]),Math.abs(y-s[1]))>4){s2=[x,y];break;}
      const bar={type:'barrel',x:s2[0],y:s2[1]};G.objs.push(bar);const c1=cnt();await t.breakBarrel(bar,false,1,0);o.barrel=cnt()-c1;
      // fire spreads to a diagonal neighbour puddle
      G.fire.set(s[1]*G.W+s[0],3);const dk=(s[1]-1)*G.W+(s[0]-1);G.ground[s[1]-1][s[0]-1]=t.GROUND.oil;t.tickFire();o.spread=G.fire.has(dk);
      // oil thrown at a lit wall torch goes up at once
      const tc=G.torches.find(q=>!q.out&&[[0,1],[0,-1],[1,0],[-1,0]].some(([a,b])=>!t.isWall(q.x+a,q.y+b)&&!t.objAt(q.x+a,q.y+b)));o.torchFound=!!tc;
      if(tc){await t.throwOil(tc.x,tc.y,L);o.torchFire=[[0,1],[0,-1],[1,0],[-1,0]].some(([a,b])=>G.fire.has((tc.y+b)*G.W+tc.x+a));}
      // looking ahead slides the camera
      L.face='s';L.flip=false;const x0=t.cam.x;t.toggleLook(true);await new Promise(r=>setTimeout(r,900));o.look=t.cam.x-x0;t.toggleLook(false);
      return o;})()""")
    print(r,errs);ok=not errs and r["flask"]==4 and r["barrel"]==9 and r["spread"] and (not r["torchFound"] or r["torchFire"]) and r["look"]!=0
    print("PASS" if ok else "FAIL");await b.close()
asyncio.run(main())
