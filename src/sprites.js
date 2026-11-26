const mir=h=>h+h.split("").reverse().join("");
const BODY_F=["..khhhhh","..khssss","..khsess","..khsess","...ksssS","....kkSS","...kcccc","..kskccc","..kskcCc","..kskaaa","...kkccc","....kcCc","....kllk","....kllk","....kffk","....kkk."].map(mir);
const BODY_B=["..khhhhh","..khhhhh","..khhhhh","..khhHhh","...khhhh","....kkSS","...kcccc","..kskccc","..kskccc","..kskaaa","...kkccc","....kcCc","....kllk","....kllk","....kffk","....kkk."].map(mir);
const BODY_S=["..khhhhhhhhhk...","..khhhhhssssk...","..khhhhsssesk...","..khhhhssseskk..","...khhhsssssk...","....kkSSSSk.....","....kcccccck....","....kcccccck....","....kcsscCck....","....kaaaaaak....","....kcccCcck....","....kccCCcck....","....kllkllk.....","....kllkllk.....","....kffkffk.....","....kkkkkkk....."];
const HATS={
  fighter:["........","......kk","....kkMm","...kMmmm","..kMmmmm","..kmmmmm","..knnnnn","..kkkkkk"],
  barbarian:[".kk.....",".kbk....","..kbk.kk","..kbkkmm","...kkmMm","..kmmmmm","..knnnnn","..khhhhh"],
  rogue:["........",".....kkk","....kooo","...koooo","..koOooo","..koOooo","..koOooo","..koohhh"],
  ranger:["........","........","......kk","....kkoo","...koooo","..kooooo","kkoOOOOO",".kkkkkkk"],
  wizard:[".......k","......kw","......kw",".....kww","....kwWw","...kwwww","kkkwwwww",".kkkkkkk"],
  cleric:["........","........","......kk","....kkhh","...khhHh","..khhhhh","..kggggg","..khhhhh"],
  merchant:["........","........","........","....kkkk","...khhhh","..khHhhh","kkkhhhhh",".kkkkkkk"],
  druid:["..k.....",".kbk....","..kbk.k.","..kbkkgk","...kgGgg","..khgghh","..khhhhh","..khhhhh"]
};
const HERO_PAL={
  fighter:{h:"#8a5a34",H:"#b8804c",m:"#a8b0c0",M:"#eef2fa",n:"#5e6676",c:"#3a6ad0",C:"#2848a0",a:"#f0c040",l:"#384058",f:"#5a3a2a"},
  barbarian:{h:"#d0602a",H:"#f08848",b:"#f4ecd8",m:"#8a6a4a",M:"#c09a70",n:"#5a4030",c:"#b0402a",C:"#7a2a1a",a:"#5a3a22",l:"#6a5236",f:"#3a2a1a"},
  rogue:{h:"#3e3e50",H:"#5c5c74",o:"#3e3e50",O:"#26262f",c:"#4a4a5c",C:"#30303c",a:"#b04848",l:"#2a2a36",f:"#1e1e26"},
  ranger:{h:"#7a5030",H:"#a07040",o:"#3a7a3a",O:"#285a28",c:"#4a8a3a",C:"#2e6a28",a:"#8a5a2a",l:"#5a4a30",f:"#3a2a1a"},
  wizard:{h:"#a8783a",H:"#c8985a",w:"#5a48c8",W:"#9a8af0",c:"#5a48c8",C:"#3a2e90",a:"#f0c040",l:"#3a2e90",f:"#2a2050"},
  cleric:{h:"#e0b050",H:"#f8d880",g:"#f0c040",c:"#f2f2f6",C:"#b8b8cc",a:"#e0a020",l:"#c4c4d4",f:"#6a5a4a"},
  merchant:{h:"#7a3a8a",H:"#a060b8",c:"#d0a030",C:"#a07a20",a:"#7a3a8a",l:"#5a4630",f:"#3a2a1a"},
  druid:{h:"#5a8a3a",H:"#8ab858",b:"#d8bc8c",g:"#64b048",G:"#3a7a28",c:"#8a6a3a",C:"#5a4422",a:"#64b048",l:"#6a5030",f:"#3a2a1a"}
};
const BASE_PAL={k:"#282030",s:"#f8d0a8",S:"#d8a078",e:"#283040"};
function heroRows(cls,dir){const hat=HATS[cls].map(mir);const body=dir==="b"?BODY_B:dir==="s"?BODY_S:BODY_F;return hat.concat(body);}
const MON={
  rat:["................","................","................","................","..........kk....",".........kppk...",".....kkkkkrrkk..","....krrrrrrrrrk.","...krrrrrrrrkrk.","..krrrrrrrrrrrpk","..kRrrrrrrrrrrk.",".k.kRRRRRRRRRk..","k...kpk...kpk...",".k..............","................","................"],
  goblin:["................",".k............k.",".kgk..kkkk..kgk.","..kgkkggggkkgk..","...kggggggggk...","...kgykggykgk...","...kggggggggk...","...kgGkkkkGgk...","....kGGGGGGk....","...kkbbbbbbkk...","..kgkbbBBbbkgk..","..kgkbbbbbbkgk..","...kkBBBBBBkk...","....kgk..kgk....","....kgk..kgk....","...kkkk..kkkk..."],
  skeleton:["................",".....kkkkkk.....","....kwwwwwwk....","...kwwwwwwwwk...","...kwkkwwkkwk...","...kwkkwwkkwk...","...kWwwkkwwWk...","....kwkwkwk.....",".....kkkkk......","...kkkwwwkkk....","..kw.kwkwk.wk...","..kw.kwkwk.wk...",".....kwwwk......",".....kw.wk......","....kw...wk.....","...kkk...kkk...."],
  orc:["................","....kkkkkkkk....","...kooooooooook.","..kooooooooook..","..korroooorrok..","..kooooooooook..","..kotooooootok..","..kOtkkkkkktOk..","...kOOOOOOOOk...",".kkaaaaaaaaaakk.","kooaaaAAaaaaook.","kooaaaaaaaaaook.",".kkAAAAAAAAAAkk.","...kaaak.kaaak..","...koook.koook..","...kkkkk.kkkkk.."],
  wolf:["................","................","................","..kk.kk.........",".kgkkgk.........",".kgggggk........","kgeggggGk.......","kggggggggkkkkk..",".kkwggggggggggk.","..kwwgggggggGGkk","...kkggGGGGGGk..","....kgk.kgkkgk..","....kgk.kgk.kgk.","....kk..kk...kk.","................","................"],
  ogre:["....ky.ky.ky....","....kyyyyyyyyk..","...kkkkkkkkkkk..","..kmmmmmmmmmmmk.","..kmrrmmmmmrrmk.","..kmmmmmMmmmmmk.","..kmtmkkkkkmtmk.","..kMmmmmmmmmmMk.",".kkkMMMMMMMMMkkk","kmmmmmmmmmmmmmmk","kmmMmmmmmmmmMmmk","kmmkMMMMMMMMkmmk",".kkkccccccccckk.","...kmmmk.kmmmk..","...kmmmk.kmmmk..","..kkkkkk.kkkkkk."],
  potion:["................","......kkkk......","......kbbk......","......kkkk......","......kwwk......","......kwwk......",".....kwrrwk.....","....krrrrrrk....","...krwrrrrrrk...","...krwrrrrrrk...","...krrrrrrRrk...","...krrrrrrRrk...","....kRrrrRRk....",".....kkkkkk.....","................","................"],
  gold:["................","................","................","................","................","................","................","......kkkk......",".....kyyYyk.....","...kkkyyyykkk...","..kyyYkkkkkyYk..","..kyyyyykyyyyk..",".kkYYyykkyyYYkk.","kyyyyyyyyyyyyyyk","kYYYYYYYYYYYYYYk",".kkkkkkkkkkkkkk."]
};
const MON_PAL={
  rat:{r:"#a89480",R:"#7a6858",p:"#f0a0b0"},
  goblin:{g:"#7cc050",G:"#4f8a30",y:"#ffe14d",b:"#7a5530",B:"#55391f"},
  archer:{g:"#8cc060",G:"#5a8a38",y:"#ffe14d",b:"#3a6a8a",B:"#244a62"},
  skeleton:{w:"#eee8d6",W:"#b8ae96"},
  bonearcher:{w:"#d8d0e8",W:"#9a90b0"},
  orc:{o:"#6a9a48",O:"#476e2e",r:"#ff4d3d",t:"#fff6d0",a:"#6e6878",A:"#4a4552"},
  wolf:{g:"#8a8e9a",G:"#5e626e",e:"#ffd040",w:"#f0f0f0"},
  ogre:{y:"#f2c14e",m:"#c08a58",M:"#8e5e38",r:"#ff4d3d",t:"#fff6d0",c:"#7a3a2a"},
  potion:{b:"#8a5a2b",w:"#d8f0ff",r:"#e0436b",R:"#a8284a"},
  gold:{y:"#f6cf5a",Y:"#c8962a"}
};
const MON_BASE={rat:"rat",goblin:"goblin",archer:"goblin",skeleton:"skeleton",bonearcher:"skeleton",orc:"orc",wolf:"wolf",ogre:"ogre",potion:"potion",gold:"gold"};

MON.kobold=["................","................","....k......k....","....kk....kk....","....krkkkkrk....","...krrrrrrrrk...","...kryrrrryrk...","...krrrrrrrrk...","....kRbbbbRk....","....kkRRRRkk....","...kkcccccckk...","..krkcccccckrk..","..krkccCCcckrk..","...kkcccccckkkk.","....krk..krk.kk.","...kkkk..kkkk..."];
MON.spider=["................","................","................","..k....kk....k..",".k.k.kssssk.k.k.","k...kssSSssk...k",".kkkssSSSSsskkk.","k..kssrsSrsSk..k",".kkksSSSSSSskkk.","k..ksSSSSSSsk..k",".kk.kssssssk.kk.","k..k.kkkkkk.k..k","..k..........k..","................","................","................"];
MON.ooze=["................","................","................","................","................","................","......kkkk......","....kkoOOokk....","...koOOooooOk...","..koOoooeoooOk..","..koooooooooOk..",".koooOoooooooOk.",".kooooooooooOOk.","..kkOOOOOOOOkk..","....kkkkkkkk....","................"];
MON.mimic=["................","................","................","................","...kkkkkkkkkk...","..kwwwwwwwwwwk..","..kWWWWWWWWWWk..","..ktktktktktkk..","..kRRRRrrRRRRk..","..kktktktktktk..","..kwwwwwwwwwwk..","..kggggggggggk..","..kkkkkkkkkkkk..","...kk......kk...","................","................"];
MON.chest=["................","................","................","................","...kkkkkkkkkk...","..kwwwwwwwwwwk..","..kWWWWWWWWWWk..","..kgggggyggggk..","..kwwwwkkwwwwk..","..kwwwwwwwwwwk..","..kWWWWWWWWWWk..","..kggggggggggk..","..kkkkkkkkkkkk..","................","................","................"];
MON.chestOpen=["................","................","...kkkkkkkkkk...","..kWWWWWWWWWWk..","..kwwwwwwwwwwk..","..kkkkkkkkkkkk..","..kyYyyYyyYyyk..","..kggggggggggk..","..kwwwwwwwwwwk..","..kwwwwwwwwwwk..","..kWWWWWWWWWWk..","..kggggggggggk..","..kkkkkkkkkkkk..","................","................","................"];
MON.boulder=["................","................","......kkkk......","....kkLLwwkk....","...kLLwwwwwwk...","..kLwwwwwwwwwk..","..kLwwwwwwwwwk..",".kLwwwwwwwwwwDk.",".kwwwwwwwwwwDDk.",".kwwwwwwwwwDDDk.",".kDwwwwwwwDDDDk.","..kDDwwwwDDDDk..","..kkDDDDDDDDkk..","...kkkkkkkkkk...","................","................"];
MON.barrel=["................","....kkkkkkkk....","...kttttttttk...","...kbbbbbbbbk...","...kmmmmmmmmk...","..kbbbbBbbbbbk..","..kbbbbBbbbbbk..","..kbbbbBbbbbbk..","..kmmmmmmmmmmk..","..kbbbbBbbbbbk..","..kbbbbBbbbbbk..","...kbbbBbbbbk...","...kmmmmmmmmk...","....kkkkkkkk....","................","................"];
MON.shrine=["......kkkk......",".....kooOok.....",".....koOOok.....","......kkkk......",".....kSssSk.....","....kssssssk....",".....ksssSk.....",".....kssSSk.....",".....ksssSk.....",".....kssSSk.....",".....ksssSk.....","....kssssSSk....","...kSsssssSSk...","..kkkkkkkkkkkk..","..kDDDDDDDDDDk..","...kkkkkkkkkk..."];
MON.runes=["................","......kkkk......",".....kssssk.....","....kssssssk....","....ksgssgsk....","....ksssgssk....","....ksgsssSk....","....kssgssSk....","....ksgsgsSk....","....kssssSSk....","....ksssSSSk....","...kkssssSSkk...","..kDDkkkkkkDDk..","...kkkkkkkkkk...","................","................"];
Object.assign(MON_PAL,{
  kobold:{r:"#d86a3a",R:"#a04424",y:"#ffe14d",b:"#f0c890",c:"#7a5530",C:"#55391f"},
  spider:{s:"#5e4c70",S:"#3c2e4c",r:"#ff4848"},
  ooze:{o:"#d4a440",O:"#a07028",e:"#fff2a8"},
  mimic:{w:"#b07a44",W:"#8a5a30",t:"#f8f4e8",R:"#6a1a20",r:"#e05a6a",g:"#d0a040"},
  chest:{w:"#b07a44",W:"#8a5a30",g:"#d8b040",y:"#fff0a0"},
  chestOpen:{w:"#b07a44",W:"#8a5a30",g:"#d8b040",y:"#fff0a0",Y:"#c89020"},
  barrel:{t:"#2a2430",b:"#a0703c",B:"#7a5028",m:"#6a6a78"},
  shrine:{s:"#dcd4c4",S:"#a8a090",o:"#8ad8ff",O:"#3a90e0",D:"#7a7268"},
  runes:{s:"#a8a0b0",S:"#7a7488",g:"#7af0ff",D:"#6a7a5a"},
  goblinboss:{g:"#6aa840",G:"#457a2a",y:"#ffe14d",b:"#a83030",B:"#742020"},
  shaman:{g:"#8cc860",G:"#5a8a38",y:"#80f0ff",b:"#6a3aa0",B:"#48287a"},
  druidwolf:{g:"#7a8a58",G:"#56643c",e:"#c8ff60",w:"#e4ecc4"}
});
Object.assign(MON_BASE,{kobold:"kobold",spider:"spider",ooze:"ooze",mimic:"mimic",chest:"chest",chestOpen:"chestOpen",barrel:"barrel",shrine:"shrine",runes:"runes",boulder:"boulder",goblinboss:"goblin",shaman:"goblin",druidwolf:"wolf"});
