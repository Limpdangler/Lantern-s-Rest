// ================= utilities =================
const $=id=>document.getElementById(id);
const now=()=>performance.now();
const SPEED=()=>(window.__fast||1);
const wait=ms=>new Promise(r=>setTimeout(r,ms*SPEED()));
const rnd=n=>1+Math.floor(Math.random()*n);
const ri=(a,b)=>a+Math.floor(Math.random()*(b-a+1));
const pick=a=>a[Math.floor(Math.random()*a.length)];
const sgn=n=>n>=0?"+"+n:""+n;
const clone=o=>JSON.parse(JSON.stringify(o));
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const cheb=(a,b)=>Math.max(Math.abs(a.x-b.x),Math.abs(a.y-b.y));
const amod=s=>Math.floor((s-10)/2);
const DIRS8=[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];
const DIRS4=[[1,0],[-1,0],[0,1],[0,-1]];
const cap=s=>s.charAt(0).toUpperCase()+s.slice(1);
function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function parseDice(s){const m=String(s).replace(/\s/g,"").match(/^(\d*)d(\d+)([+-]\d+)?$/i);
  if(!m){const n=parseInt(s,10);return isNaN(n)?null:{n:0,d:0,b:n};}return {n:+(m[1]||1),d:+m[2],b:+(m[3]||0)};}
function validDice(s){const p=parseDice(s);return !!p&&p.n<=20&&p.d<=100&&(p.n>0?p.d>0:true);}
// roll("2d6+3",crit) -> {total,txt}
function roll(s,crit,extraBonus){const p=parseDice(s)||{n:1,d:4,b:0};const n=crit?p.n*2:p.n;const rs=[];for(let i=0;i<n;i++)rs.push(rnd(p.d));
  const b=p.b+(extraBonus||0);const total=Math.max(0,rs.reduce((a,c)=>a+c,0)+b);
  return {total,txt:`${n?n+"d"+p.d:""}${b?sgn(b):""}`};}
function diceStr(n,d,b){return `${n}d${d}${b?sgn(b):""}`;}
// tiny binary heap for path finding
class Heap{constructor(){this.a=[];}
  push(v,p){const a=this.a;a.push([p,v]);let i=a.length-1;while(i>0){const j=(i-1)>>1;if(a[j][0]<=a[i][0])break;[a[i],a[j]]=[a[j],a[i]];i=j;}}
  pop(){const a=this.a;const top=a[0];const last=a.pop();if(a.length){a[0]=last;let i=0;for(;;){const l=i*2+1,r=l+1;let m=i;if(l<a.length&&a[l][0]<a[m][0])m=l;if(r<a.length&&a[r][0]<a[m][0])m=r;if(m===i)break;[a[i],a[m]]=[a[m],a[i]];i=m;}}return top[1];}
  get size(){return this.a.length;}}
const aN=w=>(/^[aeiou]/i.test(w)?"an ":"a ")+w;
