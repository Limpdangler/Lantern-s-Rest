// ================= game data =================
const ABILS=["str","dex","con","int","wis","cha"];
const ABN={str:"STR",dex:"DEX",con:"CON",int:"INT",wis:"WIS",cha:"CHA"};
const SKILLS={athletics:"str",acrobatics:"dex",stealth:"dex",perception:"wis",insight:"wis",medicine:"wis",survival:"wis",investigation:"int",arcana:"int",history:"int",religion:"int",nature:"int",persuasion:"cha",deception:"cha",intimidation:"cha",thieves:"dex"};
const SKN={athletics:"Athletics",acrobatics:"Acrobatics",stealth:"Stealth",perception:"Perception",insight:"Insight",medicine:"Medicine",survival:"Survival",investigation:"Investigation",arcana:"Arcana",history:"History",religion:"Religion",nature:"Nature",persuasion:"Persuasion",deception:"Deception",intimidation:"Intimidation",thieves:"Thieves' Tools"};

const DEFAULTS={
  dungeon:{width:44,height:34,rooms:10,monsters:3,monstersPerFloor:2,potions:1,gold:3,floors:5,sight:7,party:4,traps:3,hazards:2},
  rules:{deathSaves:true,autoReact:true,darkness:true,fatigue:true},
  classes:[
    {id:"fighter",name:"Fighter",str:16,dex:12,con:15,int:9,wis:12,cha:10,ac:18,hd:10,dmg:"1d8",range:1,speed:6},
    {id:"barbarian",name:"Barbarian",str:16,dex:14,con:16,int:8,wis:12,cha:9,ac:15,hd:12,dmg:"1d12",range:1,speed:6},
    {id:"rogue",name:"Rogue",str:10,dex:16,con:13,int:12,wis:12,cha:14,ac:14,hd:8,dmg:"1d6",range:1,speed:6},
    {id:"ranger",name:"Ranger",str:12,dex:16,con:14,int:10,wis:14,cha:8,ac:15,hd:10,dmg:"1d8",range:20,speed:6},
    {id:"wizard",name:"Wizard",str:8,dex:14,con:14,int:16,wis:12,cha:10,ac:12,hd:6,dmg:"1d10",range:16,speed:6},
    {id:"cleric",name:"Cleric",str:14,dex:10,con:14,int:10,wis:16,cha:12,ac:16,hd:8,dmg:"1d6",range:1,speed:6},
    {id:"druid",name:"Druid",str:10,dex:14,con:14,int:12,wis:16,cha:10,ac:14,hd:8,dmg:"1d8",range:8,speed:6}
  ],
  monsters:[
    {name:"Giant Rat",hp:5,ac:11,hit:4,dmg:"1d4+2",range:1,speed:6,xp:3,from:1,sprite:"rat"},
    {name:"Kobold",hp:5,ac:12,hit:4,dmg:"1d4+2",range:1,speed:6,xp:3,from:1,sprite:"kobold"},
    {name:"Goblin",hp:7,ac:15,hit:4,dmg:"1d6+2",range:1,speed:6,xp:5,from:1,sprite:"goblin"},
    {name:"Goblin Archer",hp:7,ac:13,hit:4,dmg:"1d6+2",range:12,speed:6,xp:5,from:1,sprite:"archer"},
    {name:"Goblin Shaman",hp:10,ac:12,hit:4,dmg:"2d6",range:6,speed:6,xp:10,from:2,sprite:"shaman"},
    {name:"Wolf",hp:11,ac:13,hit:4,dmg:"2d4+2",range:1,speed:8,xp:7,from:2,sprite:"wolf"},
    {name:"Giant Spider",hp:18,ac:14,hit:5,dmg:"1d8+3",range:1,speed:6,xp:12,from:2,sprite:"spider"},
    {name:"Skeleton",hp:13,ac:13,hit:4,dmg:"1d6+2",range:1,speed:6,xp:8,from:2,sprite:"skeleton"},
    {name:"Bone Archer",hp:13,ac:13,hit:4,dmg:"1d6+2",range:8,speed:6,xp:8,from:3,sprite:"bonearcher"},
    {name:"Goblin Boss",hp:21,ac:17,hit:4,dmg:"1d6+2",range:1,speed:6,xp:15,from:3,sprite:"goblinboss"},
    {name:"Ochre Jelly",hp:24,ac:8,hit:4,dmg:"2d6+2",range:1,speed:3,xp:15,from:3,sprite:"ooze"},
    {name:"Orc",hp:15,ac:13,hit:5,dmg:"1d12+3",range:1,speed:6,xp:12,from:3,sprite:"orc"}
  ],
  boss:{name:"Ogre Chief",hp:80,ac:12,hit:6,dmg:"2d8+4",range:1,speed:6,xp:100,sprite:"ogre"}
};
const MIMIC={name:"Mimic",hp:25,ac:12,hit:5,dmg:"1d8+3",range:1,speed:3,xp:15,sprite:"mimic"};

// fixed class rules (not editable)
const CINFO={
  fighter:{atk:{name:"Longsword",abil:"str",type:"slashing"},alt:{name:"Handaxe",abil:"str",dice:"1d6",type:"slashing",range:4,thrown:true},
    saves:["str","con"],skills:["athletics","perception","intimidation","history"],armour:"heavy",stealthDis:true,unarmAC:11,feats:["secondwind","actionsurge"],spells:[],extra:true,primary:"str",
    blurb:"Tough frontliner in heavy armour. Second Wind heals; Action Surge grants a whole extra action."},
  barbarian:{atk:{name:"Greataxe",abil:"str",type:"slashing"},alt:{name:"Javelin",abil:"str",dice:"1d6",type:"piercing",range:6,thrown:true},
    saves:["str","con"],skills:["athletics","intimidation","perception","survival"],feats:["rage","reckless"],spells:[],extra:true,primary:"str",
    blurb:"Rage for extra damage and to shrug off half of physical hits. Reckless Attack trades defence for advantage."},
  rogue:{atk:{name:"Shortsword",abil:"dex",type:"piercing",finesse:true},alt:{name:"Shortbow",abil:"dex",dice:"1d6",type:"piercing",range:16,finesse:true},
    saves:["dex","int"],skills:["stealth","acrobatics","perception","investigation","persuasion","deception","insight","thieves"],expertise:["thieves","stealth"],feats:["cdash","cdisengage","chide"],spells:[],sneak:true,uncanny:true,primary:"dex",
    blurb:"Sneak Attack deals big extra damage when an ally is next to the target. Cunning Action: Dash, Disengage or Hide as a bonus action. Best at traps and locks."},
  ranger:{atk:{name:"Longbow",abil:"dex",type:"piercing",finesse:true},alt:{name:"Shortsword",abil:"dex",dice:"1d6",type:"piercing",range:1,finesse:true},
    saves:["str","dex"],skills:["perception","stealth","athletics","nature","survival"],caster:"half",castAbil:"wis",spells:["huntersmark","curewounds"],feats:["volley"],extra:true,primary:"dex",
    blurb:"Long-range archer. Hunter's Mark adds damage to one target; Volley shoots every enemy in an area."},
  wizard:{atk:{name:"Fire Bolt",abil:"int",type:"fire",spell:true,cantrip:true,ignite:true},alt:{name:"Quarterstaff",abil:"str",dice:"1d6",type:"bludgeoning",range:1},
    saves:["int","wis"],skills:["arcana","investigation","religion","history"],caster:"full",castAbil:"int",spells:["magicmissile","thunderwave","shield","fireball"],feats:[],arcaneRecovery:true,primary:"int",
    blurb:"Fragile but powerful. Magic Missile never misses, Thunderwave blasts enemies away, Shield blocks hits. Fireball at level 5."},
  cleric:{atk:{name:"Mace",abil:"str",type:"bludgeoning"},alt:{name:"Sacred Flame",save:"dex",dice:"1d8",type:"radiant",range:12,spell:true,cantrip:true,noCover:true},
    saves:["wis","cha"],skills:["religion","persuasion","insight","medicine"],armour:"medium",stealthDis:true,unarmAC:10,caster:"full",castAbil:"wis",spells:["curewounds","healingword","bless","guidingbolt"],feats:["turnundead"],primary:"wis",
    blurb:"Healer in armour. Cure Wounds and Healing Word bring allies back up, Bless boosts the party, Turn Undead sends skeletons fleeing."},
  druid:{atk:{name:"Produce Flame",abil:"wis",type:"fire",spell:true,cantrip:true,ignite:true},alt:{name:"Quarterstaff",abil:"str",dice:"1d6",type:"bludgeoning",range:1},
    saves:["int","wis"],skills:["nature","perception","arcana","medicine","survival"],caster:"full",castAbil:"wis",spells:["entangle","healingword","thunderwave"],feats:["wildshape"],light:2,primary:"wis",
    blurb:"Nature caster. Entangle pins enemies in place, Wild Shape turns you into a wolf, and your flame lights the dark."}
};
const RES={secondwind:{name:"Second Wind",rest:"sr",max:()=>1},actionsurge:{name:"Action Surge",rest:"sr",max:()=>1},rage:{name:"Rage",rest:"lr",max:l=>l>=3?3:2},
  volley:{name:"Volley",rest:"sr",max:()=>1},turnundead:{name:"Turn Undead",rest:"sr",max:()=>1},wildshape:{name:"Wild Shape",rest:"sr",max:()=>2},arcane:{name:"Arcane Recovery",rest:"lr",max:()=>1}};
const SLOTS_FULL=[[2],[3],[4,2],[4,3],[4,3,2],[4,3,3],[4,3,3,1],[4,3,3,2],[4,3,3,3,1]];
const SLOTS_HALF=[[2],[2],[3],[3],[4,2],[4,2],[4,3],[4,3],[4,3,2]];
const SPELLS={
  magicmissile:{name:"Magic Missile",lvl:1,cost:"action",tgt:"enemy",range:24,desc:"3 darts of 1d4+1 force that never miss (+1 dart per higher slot)."},
  thunderwave:{name:"Thunderwave",lvl:1,cost:"action",tgt:"self",desc:"Everyone next to you: CON save or 2d8 thunder and pushed 2 squares. Hits allies too!"},
  shield:{name:"Shield",lvl:1,cost:"reaction",tgt:"none",desc:"Reaction: +5 AC against a hit that would land. Used automatically."},
  fireball:{name:"Fireball",lvl:3,cost:"action",tgt:"area",range:12,radius:2,desc:"8d6 fire in a 5×5 area, DEX save for half. Burns allies too!"},
  curewounds:{name:"Cure Wounds",lvl:1,cost:"action",tgt:"ally",range:1,desc:"Touch: heal 2d8 + modifier. Revives a downed ally."},
  healingword:{name:"Healing Word",lvl:1,cost:"bonus",tgt:"ally",range:12,desc:"Bonus action, 12 squares: heal 2d4 + modifier. Revives a downed ally."},
  bless:{name:"Bless",lvl:1,cost:"action",tgt:"self",conc:true,desc:"Concentration. You and 2 nearby allies add 1d4 to attacks and saves."},
  guidingbolt:{name:"Guiding Bolt",lvl:1,cost:"action",tgt:"enemy",range:24,desc:"Spell attack, 4d6 radiant. The next attack against the target has advantage."},
  huntersmark:{name:"Hunter's Mark",lvl:1,cost:"bonus",tgt:"enemy",range:18,conc:true,desc:"Concentration. Your weapon hits on the marked enemy deal +1d6."},
  entangle:{name:"Entangle",lvl:1,cost:"action",tgt:"area",range:18,radius:1,conc:true,desc:"Concentration. 3×3 area: STR save or restrained. The area becomes difficult terrain."}
};
const FEATS={
  secondwind:{name:"Second Wind",cost:"bonus",res:"secondwind",desc:"Bonus action: heal 1d10 + level."},
  actionsurge:{name:"Action Surge",cost:"free",res:"actionsurge",desc:"Free: gain one extra action this turn."},
  rage:{name:"Rage",cost:"bonus",res:"rage",desc:"Bonus action: +2 melee damage, half damage from physical hits, advantage on STR checks. Lasts the fight."},
  reckless:{name:"Reckless Attack",cost:"free",desc:"Free: your melee attacks this turn have advantage, but attacks against you do too until your next turn."},
  cdash:{name:"Cunning: Dash",cost:"bonus",desc:"Bonus action: double your movement."},
  cdisengage:{name:"Cunning: Disengage",cost:"bonus",desc:"Bonus action: moving won't provoke opportunity attacks this turn."},
  chide:{name:"Cunning: Hide",cost:"bonus",desc:"Bonus action: Stealth check. If hidden, your next attack has advantage and enemies struggle to hit you."},
  volley:{name:"Volley",cost:"action",res:"volley",desc:"Shoot every enemy within 1 square of a point in range."},
  turnundead:{name:"Turn Undead",cost:"action",res:"turnundead",desc:"Undead within 6 squares: WIS save or flee in terror for 3 rounds."},
  wildshape:{name:"Wild Shape",cost:"bonus",res:"wildshape",desc:"Bonus action: become a wolf (own HP pool, bite that knocks prone, speed 8)."}
};
// monster rules by sprite key (not editable)
const MTRAITS={
  rat:{stealthy:true,atk:"Bite",type:"piercing",dv:true,pack:true,mind:"beast",abil:{str:-2,dex:2,con:0,int:-4,wis:0,cha:-4}},
  kobold:{stealthy:true,atk:"Dagger",type:"piercing",dv:true,pack:true,mind:"smart",morale:true,abil:{str:-2,dex:2,con:-1,int:-1,wis:-2,cha:-1}},
  goblin:{stealthy:true,atk:"Scimitar",type:"slashing",dv:true,nimble:true,mind:"smart",morale:true,abil:{str:-1,dex:2,con:0,int:0,wis:-1,cha:-1}},
  archer:{stealthy:true,atk:"Shortbow",type:"piercing",dv:true,nimble:true,mind:"smart",morale:true,abil:{str:-1,dex:2,con:0,int:0,wis:-1,cha:-1}},
  shaman:{atk:"Hex Bolt",type:"necrotic",spell:true,healer:true,dv:true,nimble:true,mind:"smart",morale:true,abil:{str:-1,dex:1,con:0,int:1,wis:2,cha:0}},
  goblinboss:{atk:"Scimitar",type:"slashing",multi:2,redirect:true,leader:true,dv:true,nimble:true,mind:"smart",shover:true,abil:{str:0,dex:2,con:0,int:0,wis:-1,cha:0}},
  wolf:{stealthy:true,atk:"Bite",type:"piercing",pack:true,trip:11,mind:"beast",abil:{str:1,dex:2,con:1,int:-4,wis:1,cha:-2},keen:true},
  spider:{stealthy:true,atk:"Bite",type:"piercing",dv:true,web:true,poison:{dc:11,dice:"2d8"},mind:"beast",abil:{str:2,dex:3,con:1,int:-4,wis:0,cha:-3}},
  skeleton:{atk:"Shortsword",type:"piercing",dv:true,undead:true,vuln:["bludgeoning"],immune:["poison"],mind:"mindless",abil:{str:0,dex:2,con:2,int:-2,wis:-1,cha:-3}},
  bonearcher:{atk:"Shortbow",type:"piercing",dv:true,undead:true,vuln:["bludgeoning"],immune:["poison"],mind:"mindless",abil:{str:0,dex:2,con:2,int:-2,wis:-1,cha:-3}},
  ooze:{atk:"Pseudopod",type:"bludgeoning",extra:{dice:"1d6",type:"acid"},dv:true,split:true,resist:["acid"],mind:"mindless",abil:{str:2,dex:-2,con:2,int:-4,wis:-2,cha:-5}},
  orc:{atk:"Greataxe",type:"slashing",dv:true,aggressive:true,mind:"smart",shover:true,abil:{str:3,dex:1,con:3,int:-2,wis:0,cha:0}},
  ogre:{atk:"Greatclub",type:"bludgeoning",dv:true,multi:2,boss:true,shover:true,large:true,mind:"smart",abil:{str:4,dex:-1,con:3,int:-3,wis:-2,cha:-2}},
  mimic:{stealthy:true,atk:"Sticky Bite",type:"piercing",adhesive:13,mind:"beast",abil:{str:3,dex:1,con:2,int:-3,wis:1,cha:-3}}
};
const GROUPS=[
  {from:1,list:["goblin","goblin","archer"],lead:[["shaman",2],["goblinboss",3]],parley:true},
  {from:1,list:["kobold","kobold","kobold"]},
  {from:1,list:["rat","rat","rat"]},
  {from:2,list:["wolf","wolf"]},
  {from:2,list:["spider","rat"]},
  {from:2,list:["skeleton","skeleton","bonearcher"]},
  {from:3,list:["ooze"]},
  {from:3,list:["orc","orc","goblin"],parley:true}
];
// items
const ITEMS={
  potion:{name:"Potion of Healing",kind:"use",price:50,floor:1,w:10,desc:"Heals 2d4+2. Bonus action to drink, action to give to an adjacent ally."},
  gpotion:{unk:"Bright Red Potion",name:"Greater Healing Potion",kind:"use",price:150,floor:3,w:4,desc:"Heals 4d4+4."},
  antitoxin:{name:"Antitoxin",kind:"use",price:30,floor:1,w:4,desc:"Cures poison."},
  oil:{name:"Oil Flask",kind:"use",price:10,floor:1,w:5,desc:"Throw up to 4 squares to make a slick oil puddle. Fire ignites it."},
  torch:{name:"Torch",kind:"use",price:5,floor:1,w:5,desc:"Place or throw it to light an area. Ignites oil."},
  scroll_mm:{unk:"Unread Scroll",name:"Scroll of Magic Missile",kind:"use",price:60,floor:1,w:4,desc:"Anyone can read it: 3 darts of 1d4+1 that never miss."},
  scroll_cure:{unk:"Unread Scroll",name:"Scroll of Cure Wounds",kind:"use",price:60,floor:1,w:4,desc:"Anyone can read it: heal an adjacent ally 2d8+3."},
  scroll_fb:{unk:"Unread Scroll",name:"Scroll of Fireball",kind:"use",price:250,floor:3,w:2,desc:"Anyone can read it: 8d6 fire in a 5×5 area (DC 15)."},
  ration:{name:"Rations",kind:"supply",price:5,floor:1,w:0,desc:"A day's food for the whole party. Eaten at every long rest; sleeping hungry causes exhaustion."},
  firewood:{name:"Firewood",kind:"supply",price:5,floor:1,w:8,desc:"Enough for one camp fire. A fire camp gives a full long rest."},
  ringcurse:{unk:"Strange Ring",name:"Ring of Clumsiness",kind:"gear",cursed:true,price:20,floor:1,w:2,desc:"CURSED: −1 AC and −1 to saves. It won't come off until a shrine lifts the curse.",fx:{ac:-1,save:-1}},
  cloakcurse:{unk:"Dusty Cloak",name:"Cloak of the Lost",kind:"gear",cursed:true,price:20,floor:1,w:2,desc:"CURSED: −2 speed. It won't come off until a shrine lifts the curse.",fx:{speed:-2}},
  relic:{name:"Jade Idol",kind:"quest",price:0,floor:99,w:0,desc:"The relic your goal asks for. Bring it to the ladder down."},
  poisonvial:{name:"Poison Vial",kind:"use",price:25,floor:1,w:0,desc:"Drained from a dart trap. Coat a weapon: the next attack deals +2d4 poison and may poison the target (CON save). Rogues do it as a bonus action."},
  key:{name:"Rusty Key",kind:"key",price:0,floor:99,w:0,desc:"Opens a locked vault door on this floor."},
  wrune1:{unk:"Rune-Carved Stone",name:"Weapon Rune +1",kind:"gear",price:200,floor:1,w:3,desc:"+1 to weapon attack and damage rolls.",fx:{hit:1,dmg:1}},
  wrune2:{unk:"Rune-Carved Stone",name:"Weapon Rune +2",kind:"gear",price:500,floor:4,w:1,desc:"+2 to weapon attack and damage rolls.",fx:{hit:2,dmg:2}},
  arune:{unk:"Rune-Carved Stone",name:"Armour Rune +1",kind:"gear",price:250,floor:1,w:3,desc:"+1 AC.",fx:{ac:1}},
  ring:{unk:"Strange Ring",name:"Ring of Protection",kind:"gear",price:300,floor:2,w:2,desc:"+1 AC and +1 to all saving throws.",fx:{ac:1,save:1}},
  cloak:{unk:"Dusty Cloak",name:"Cloak of Elvenkind",kind:"gear",price:200,floor:1,w:2,desc:"Advantage on Stealth checks (hiding).",fx:{stealth:1}},
  boots:{unk:"Worn Boots",name:"Boots of Striding",kind:"gear",price:200,floor:1,w:2,desc:"+2 speed.",fx:{speed:2}},
  gauntlets:{unk:"Heavy Gauntlets",name:"Gauntlets of Ogre Power",kind:"gear",price:400,floor:2,w:1,desc:"Strength becomes 19.",fx:{setstr:19}},
  headband:{unk:"Silver Circlet",name:"Headband of Intellect",kind:"gear",price:400,floor:2,w:1,desc:"Intelligence becomes 19.",fx:{setint:19}},
  amulet:{unk:"Old Amulet",name:"Amulet of Health",kind:"gear",price:500,floor:4,w:1,desc:"Constitution becomes 19.",fx:{setcon:19}},
  bracers:{unk:"Leather Bracers",name:"Bracers of Archery",kind:"gear",price:250,floor:1,w:2,desc:"+2 damage with ranged weapons.",fx:{rdmg:2}},
  periapt:{unk:"Bloodstone Pendant",name:"Periapt of Wound Closure",kind:"gear",price:250,floor:2,w:2,desc:"Automatically stable when downed; Hit Dice heal double.",fx:{periapt:1}},
  wand:{unk:"Carved Wand",name:"Wand of Magic Missiles",kind:"gear",price:300,floor:2,w:2,desc:"3 charges per long rest: cast Magic Missile.",fx:{wand:1}},
  gloves:{unk:"Thin Gloves",name:"Gloves of Thievery",kind:"gear",price:150,floor:1,w:2,desc:"+5 to Thieves' Tools (traps and locks).",fx:{thieves:5}}
};
const TRAPS={
  darts:{name:"dart trap",w:35},pit:{name:"pit trap",w:30},fire:{name:"fire jet",w:20},alarm:{name:"alarm wire",w:15}
};

// races: ability bonuses, darkvision and a signature trait
const RACES={
  human:{name:"Human",asi:{str:1,dex:1,con:1,int:1,wis:1,cha:1},skills:["perception"],desc:"+1 to every ability score and an extra skill. Versatile, but no darkvision."},
  elf:{name:"Elf",asi:{dex:2},dv:true,skills:["perception"],desc:"+2 DEX, darkvision and keen senses. Trance: +5 Passive Perception when keeping watch."},
  dwarf:{name:"Dwarf",asi:{con:2},dv:true,resist:["poison"],toughness:true,desc:"+2 CON, darkvision, resists poison and +1 HP per level."},
  halfling:{name:"Halfling",asi:{dex:2},lucky:true,brave:true,desc:"+2 DEX. Lucky: reroll natural 1s. Brave: advantage against fear. No darkvision."},
  halforc:{name:"Half-Orc",asi:{str:2,con:1},dv:true,skills:["intimidation"],relentless:true,savage:true,desc:"+2 STR, +1 CON, darkvision. Once per long rest drop to 1 HP instead of 0. Extra damage die on melee crits."},
  tiefling:{name:"Tiefling",asi:{cha:2,int:1},dv:true,resist:["fire"],rebuke:true,desc:"+2 CHA, +1 INT, darkvision, resists fire. Hellish Rebuke: once per long rest, burns whoever hurts them (2d10 fire)."}
};
const RACE_KEYS=Object.keys(RACES);
