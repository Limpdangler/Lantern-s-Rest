// ===== taller, more grounded character sprites (16x28) =====
const CH_H=28;
const CF=["........","........","......kk","....kkhh","...khhHh","...khhhh","...khsss","...khses","...kSsss","....kSss",".....kSS","...kkkcc","..kcCccc",".kcCccca",".kcCcccc",".kcCcccc",".kcCcccc",".ksCbbbb",".kskcccc","..kkcccC","...kcccC","...kllLk","...kllLk","...kllLk","...kllLk","...kffFk","..kfffFk","..kkkkkk"];
const CB=CF.slice();CB[6]="...khhhh";CB[7]="...khhHh";CB[8]="...khhhh";CB[9]="....khhh";CB[13]=".kcCcccc";
const CS=["................","................",".....kkkk.......","....khhhhk......","...khhHhhhk.....","...khhhhhhk.....","...khhhsssk.....","...khhssesk.....","...khhsssssk....","....khSsssk.....",".....kSSSk......","....kkcccck.....","....kcccCck.....","....kcccCck.....","....kcsscCk.....","....kcsscCk.....","....kcsscCk.....","....kbsbbbk.....","....kcccCck.....","....kcccCck.....","....kccCck......","....kllLk.......","....kllLk.......","....kllLk.......","....kllLk.......","....kffFk.......","....kfffFk......","....kkkkkk......"];
const CS_WALK=["....kllLk.......","...kllkLLk......","...kllkLLk......","..kllk.kLLk.....","..kffk.kFFk.....",".kfffk.kfFFk....",".kkkkk.kkkkk...."];
const CF_WALK=["...kffFkkLllk...","..kfffFkkffFk...","..kkkkkk.kkkkk.."];
const ROBE_F=["..kccccC","..kccccC","..kcccCC","..kcccCC",".kcccCCC",".kccCCCC",".kcCCCCC",".kkkkkkk","...kfFk."];
const ROBE_S=["....kcccCck.....","...kccccCck.....","...kccccCCk.....","...kcccCCCk.....","..kccccCCCk.....","..kcccCCCCk.....","..kccCCCCCk.....","..kkkkkkkkk.....","...kfFkfFk......"];
const HAT2={
  fighter:{1:"......kk",2:"....kkMm",3:"...kMmmm",4:"...kmmmm",5:"...knnnn",6:"...knsss"},
  barbarian:{0:"........",1:".kk.....",2:"kbbk..kk",3:".kbkkhhh",4:"..kkhhHh",5:"..khhhhh",8:"..khSsss",9:"..khkSss"},
  rogue:{1:".....kkk",2:"....kooo",3:"...koooo",4:"..koOooo",5:"..koOooo",6:"..koOsss",7:"..koOses",8:"..kOkSss",9:"...kkkSs"},
  ranger:{2:"......kk",3:"....kkoo",4:"...koooo",5:"kkoOOOOO"},
  wizard:{0:".......k",1:"......kw",2:".....kww",3:"....kwWw",4:"...kwwww",5:"kkkwwwww",9:"....khhh",10:".....khh"},
  cleric:{5:"...kgggg"},
  druid:{0:"..k.....",1:".kbk....",2:"..kbk.kk",3:"...kkghh",4:"...kgGgh",5:"...khhhh"},
  merchant:{2:"........",3:"....kkkk",4:"...khhhh",5:"kkkhhhhh"},
  orc:{9:"....kSts",10:".....kSS"},
  skeleton:{2:"......kk",3:"....kkss",4:"...kssss",5:"...kssss",6:"...ksss.",7:"...ksee.",8:"...kssss",9:"....kSkS",10:".....kSS",17:".ksCcccc",18:".kskcccc"},
};
HAT2.bonearcher=HAT2.skeleton;
const ROBED={wizard:1,cleric:1,druid:1,merchant:1};
const PAL2={
  fighter:{h:"#5a3e28",H:"#7a5636",m:"#8a92a0",M:"#c8d0da",n:"#4e5460",c:"#4a5a78",C:"#2e3a52",a:"#a8883a",b:"#5a3e26",l:"#3e3a40",L:"#2a262c",f:"#4a3424",F:"#2e2018"},
  barbarian:{h:"#8a3a1e",H:"#b05a2e",b:"#d8ccb0",c:"#7a5a3a",C:"#4e3622",a:"#3a2a1c",l:"#5a4630",L:"#3a2c1e",f:"#3a2a1a",F:"#24180e",s:"#d09a70",S:"#a06a48"},
  rogue:{h:"#2e2e36",H:"#46464f",o:"#2e2e36",O:"#1c1c22",c:"#3a3440",C:"#24202a",a:"#6a2a2a",b:"#2a2020",l:"#2a2830",L:"#1a181e",f:"#1e1a18",F:"#100e0c"},
  ranger:{h:"#5a3a22",H:"#7a5232",o:"#3e5a2e",O:"#28401e",c:"#4a5e32",C:"#2e3e1e",a:"#6a4a2a",b:"#4a3420",l:"#4a3e2c",L:"#2e2618",f:"#3a2a1a",F:"#22180e"},
  wizard:{h:"#8a8a8a",H:"#b0b0b0",w:"#3e3a6a",W:"#5e5a90",c:"#3e3a6a",C:"#26223e",a:"#b09040",b:"#6a5030",f:"#2a2440",F:"#18142a"},
  cleric:{h:"#b08a40",H:"#d0aa5a",g:"#c8a040",c:"#c8c4b8",C:"#8e8a80",a:"#b08a30",b:"#7a5a30",l:"#7a7a80",L:"#4e4e56",f:"#4a3a2a",F:"#2e2418"},
  druid:{h:"#4e5e2e",H:"#6e7e3e",b:"#b8a070",g:"#5a7a2e",G:"#3a5420",c:"#6a5a36",C:"#463a22",a:"#5a7a2e",f:"#3a2a1a",F:"#22180e"},
  merchant:{h:"#5a2e4a",H:"#7a4664",c:"#8a6a2a",C:"#5e461a",a:"#5a2e4a",b:"#4a3420",l:"#4a3a2a",L:"#2e2418",f:"#3a2a1a",F:"#22180e"},
  orc:{s:"#6a7a3e",S:"#4a5a2a",h:"#1e1a16",H:"#3a322a",c:"#5a4632",C:"#3a2c1e",a:"#7a7a80",b:"#3a2a1a",l:"#4a3e30",L:"#2e261c",f:"#2e2218",F:"#1a120c",t:"#e8e0c8",e:"#c03020"},
  skeleton:{s:"#d8d0b8",S:"#a09884",h:"#d8d0b8",H:"#eee8d8",e:"#100c0c",c:"#3a3a40",C:"#26262a",a:"#5a5a60",b:"#2a2420",l:"#d8d0b8",L:"#a09884",f:"#a09884",F:"#6a6458"},
  bonearcher:{s:"#cfc6ae",S:"#968e7a",h:"#cfc6ae",H:"#e6e0d0",e:"#100c0c",c:"#4a3a2a",C:"#2e241a",a:"#6a5a3a",b:"#2a2420",l:"#cfc6ae",L:"#968e7a",f:"#968e7a",F:"#5e584c"}
};
const BASE2={k:"#1a1418",s:"#e0b490",S:"#b0805e",e:"#1e1a20"};
const mirr=h=>h+h.split("").reverse().join("");
// frame: 0 standing, 1/2 walking
function charRows(key,dir,frame){const hat=HAT2[key]||{};const robed=ROBED[key];let rows;
  if(dir==="s"){rows=CS.slice();if(robed)for(let i=0;i<9;i++)rows[19+i]=ROBE_S[i];else if(frame)for(let i=0;i<7;i++)rows[21+i]=CS_WALK[i];
    for(const k in hat){const i=+k;if(i<=5){const full=mirr(hat[k]);rows[i]=full.slice(1)+".";}}}
  else{const base=(dir==="b"?CB:CF).slice();for(const k in hat){const i=+k;if(dir==="b"&&i>=6&&i<=9&&!(key==="skeleton"||key==="bonearcher"))continue;base[i]=hat[k];}
    if(robed)for(let i=0;i<9;i++)base[19+i]=ROBE_F[i];rows=base.map(mirr);
    if(frame&&!robed){const w=frame===1?CF_WALK:CF_WALK.map(r=>r.split("").reverse().join(""));for(let i=0;i<3;i++)rows[25+i]=w[i];}}
  return rows;}
