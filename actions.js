"use strict";

/* =========================================
   HISTORY QUEST - COMPLETE EDITION
   No external assets required.
========================================= */

const $ = id => document.getElementById(id);
const canvas = $("game-canvas");
const ctx = canvas.getContext("2d");
const menuCanvas = $("menu-canvas");
const mctx = menuCanvas.getContext("2d");

const TILE = 40;
const COLS = 20;
const ROWS = 12;
const SAVE_KEY = "historyQuestCompleteV1";

const screens = document.querySelectorAll(".screen");
const dialogue = $("dialogue");
const challenge = $("challenge");
const resultOverlay = $("result-overlay");

let world = "egypt";
let player = { x: 2, y: 9 };
let xp = 0;
let lives = 5;
let soundEnabled = true;
let gameActive = false;
let activeMission = 0;
let activeChallenge = null;
let challengeIndex = 0;
let challengeCorrect = 0;
let challengeAnswered = false;
let dialogueCallback = null;
let audioContext = null;
let completed = {};
let artifacts = {};
let collected = {};
let keysDown = new Set();

// Remembers the previous quiz order during this session.
const challengeShuffleHistory = {
  questionOrders: {},
  answerOrders: {}
};

const worlds = {
  egypt: {
    name: "ANCIENT EGYPT",
    mapName: "THE NILE VALLEY",
    guide: "Nefru",
    greeting: "Welcome, traveler! I am Nefru, a scholar of the Nile. Five adventures await you. Explore the valley, speak to its people, and learn how our civilization grew.",
    missions: [
      {
        name: "Gift of the Nile",
        description: "Discover why the Nile River made Egyptian civilization possible.",
        npc: { x: 5, y: 5, name: "Nefru" },
        artifact: { x: 3, y: 3, name: "Nile Scroll" },
        questions: [
          { q: "Which river was essential to Ancient Egypt?", a: ["Amazon", "Nile", "Tigris", "Danube"], c: 1, e: "The Nile provided water, transportation and fertile soil." },
          { q: "What did the annual Nile floods leave behind?", a: ["Gold", "Fertile soil", "Snow", "Salt"], c: 1, e: "Floodwaters deposited nutrient-rich silt on farmland." },
          { q: "Which activity depended heavily on the Nile?", a: ["Farming", "Arctic hunting", "Deep-sea fishing", "Mining ice"], c: 0, e: "Farmers used the river's water and fertile banks to grow crops." }
        ]
      },
      {
        name: "The Power of the Pharaohs",
        description: "Meet the ruler and learn how Ancient Egypt was governed.",
        npc: { x: 15, y: 4, name: "Royal Scribe" },
        artifact: { x: 17, y: 2, name: "Royal Seal" },
        questions: [
          { q: "What was a pharaoh?", a: ["A farmer", "A ruler of Egypt", "A merchant ship", "A soldier only"], c: 1, e: "The pharaoh was the king or queen who ruled Ancient Egypt." },
          { q: "What was one responsibility of a pharaoh?", a: ["Govern the kingdom", "Build Roman roads", "Elect senators", "Control the Atlantic"], c: 0, e: "Pharaohs led government, religion and major public projects." },
          { q: "Which symbol was associated with royal authority?", a: ["A crown", "A steam engine", "A printing press", "A compass"], c: 0, e: "Royal crowns and regalia represented the authority of Egyptian rulers." }
        ]
      },
      {
        name: "Builders of Eternity",
        description: "Explore the monuments and understand their purpose.",
        npc: { x: 7, y: 7, name: "Master Builder" },
        artifact: { x: 9, y: 2, name: "Builder's Plan" },
        questions: [
          { q: "What was the main purpose of many Egyptian pyramids?", a: ["Markets", "Royal tombs", "Schools", "Harbors"], c: 1, e: "Pyramids were monumental tombs built for Egyptian rulers." },
          { q: "Where are the famous pyramids of Giza?", a: ["Egypt", "Greece", "India", "Mexico"], c: 0, e: "The Giza pyramid complex is located in Egypt." },
          { q: "What material was commonly used in pyramid construction?", a: ["Stone blocks", "Plastic", "Steel frames", "Glass"], c: 0, e: "Large limestone and other stone blocks were used in construction." }
        ]
      },
      {
        name: "Gods and Beliefs",
        description: "Discover the religious beliefs of Ancient Egyptians.",
        npc: { x: 14, y: 8, name: "Temple Priest" },
        artifact: { x: 18, y: 5, name: "Sacred Amulet" },
        questions: [
          { q: "Ancient Egyptian religion was generally...", a: ["Monotheistic throughout", "Polytheistic", "Without gods", "Based on democracy"], c: 1, e: "Egyptians worshipped many gods and goddesses." },
          { q: "Who was associated with mummification and the afterlife?", a: ["Anubis", "Poseidon", "Zeus", "Mars"], c: 0, e: "Anubis was strongly associated with funerary practices." },
          { q: "Why did Egyptians preserve some bodies as mummies?", a: ["For the afterlife", "For sports", "For trade", "For farming"], c: 0, e: "Mummification was connected to beliefs about life after death." }
        ]
      },
      {
        name: "Life Along the Nile",
        description: "Learn about the work, trade and daily lives of Egyptians.",
        npc: { x: 10, y: 3, name: "Village Merchant" },
        artifact: { x: 2, y: 7, name: "Trade Ledger" },
        questions: [
          { q: "Which crop was important in Ancient Egyptian agriculture?", a: ["Wheat", "Coffee", "Potatoes", "Cocoa"], c: 0, e: "Wheat and barley were important crops." },
          { q: "What was papyrus used to make?", a: ["Writing material", "Iron tools", "Glass windows", "Coins"], c: 0, e: "Papyrus was processed into a writing material." },
          { q: "Which group was especially important for record keeping?", a: ["Scribes", "Gladiators", "Knights", "Senators"], c: 0, e: "Scribes recorded taxes, trade, administration and religious texts." }
        ]
      }
    ]
  },

  america: {
    name: "US HISTORY",
    mapName: "COLONIAL AMERICA",
    guide: "Samuel",
    greeting: "Welcome to colonial America! I am Samuel, a local guide. Explore the settlement, meet its residents and discover the events that shaped the United States.",
    missions: [
      {
        name: "The Thirteen Colonies",
        description: "Discover the beginnings of English settlement in North America.",
        npc: { x: 5, y: 5, name: "Colonial Guide" },
        artifact: { x: 3, y: 3, name: "Colonial Map" },
        questions: [
          { q: "How many colonies declared independence in 1776?", a: ["10", "13", "15", "20"], c: 1, e: "Thirteen British colonies declared independence." },
          { q: "Which European country controlled the thirteen colonies?", a: ["Spain", "France", "Great Britain", "Portugal"], c: 2, e: "The colonies were under British rule." },
          { q: "Which economic activity was important in many colonies?", a: ["Agriculture", "Space travel", "Computer design", "Oil drilling"], c: 0, e: "Agriculture was important, alongside trade and other industries." }
        ]
      },
      {
        name: "The Road to Independence",
        description: "Understand the tensions that led to the American Revolution.",
        npc: { x: 15, y: 4, name: "Colonial Journalist" },
        artifact: { x: 17, y: 2, name: "Liberty Pamphlet" },
        questions: [
          { q: "Which event involved colonists protesting British taxation in 1773?", a: ["Boston Tea Party", "Battle of Gettysburg", "Watergate", "Moon landing"], c: 0, e: "The Boston Tea Party was a protest against British tea policies." },
          { q: "What was a major colonial complaint?", a: ["Taxation without representation", "Too much voting", "Free university", "No trade at all"], c: 0, e: "Colonists objected to taxation without representation in Parliament." },
          { q: "When did the American Revolution begin?", a: ["1775", "1492", "1812", "1865"], c: 0, e: "The conflict began in 1775." }
        ]
      },
      {
        name: "Declaration of Independence",
        description: "Explore the document that announced American independence.",
        npc: { x: 7, y: 7, name: "Town Clerk" },
        artifact: { x: 9, y: 2, name: "Declaration Copy" },
        questions: [
          { q: "In which year was the Declaration adopted?", a: ["1776", "1787", "1812", "1861"], c: 0, e: "It was adopted on July 4, 1776." },
          { q: "Who was the principal author of the Declaration?", a: ["Thomas Jefferson", "George Washington", "Abraham Lincoln", "Benjamin Franklin"], c: 0, e: "Thomas Jefferson was the principal author." },
          { q: "What did the Declaration announce?", a: ["Independence from Britain", "The end of slavery", "The Constitution", "The end of all wars"], c: 0, e: "It announced that the colonies considered themselves independent." }
        ]
      },
      {
        name: "Creating a Constitution",
        description: "Learn how the new country organized its government.",
        npc: { x: 14, y: 8, name: "Convention Delegate" },
        artifact: { x: 18, y: 5, name: "Constitution Draft" },
        questions: [
          { q: "In which year was the US Constitution written?", a: ["1776", "1787", "1800", "1865"], c: 1, e: "The Constitutional Convention drafted it in 1787." },
          { q: "What are the three branches of the US federal government?", a: ["Executive, legislative, judicial", "Army, navy, air force", "North, south, west", "State, city, county"], c: 0, e: "The Constitution separates power among three branches." },
          { q: "What is the main role of the legislative branch?", a: ["Make laws", "Interpret laws", "Enforce laws", "Lead the military"], c: 0, e: "Congress, the legislative branch, makes federal laws." }
        ]
      },
      {
        name: "A Nation Divided",
        description: "Discover the causes and consequences of the Civil War.",
        npc: { x: 10, y: 3, name: "History Teacher" },
        artifact: { x: 2, y: 7, name: "Historical Newspaper" },
        questions: [
          { q: "In which year did the Civil War begin?", a: ["1776", "1812", "1861", "1865"], c: 2, e: "The Civil War began in 1861." },
          { q: "Which issue was central to the conflict?", a: ["Slavery", "Space exploration", "The internet", "The gold standard"], c: 0, e: "Slavery and its expansion were central causes of the conflict." },
          { q: "Who was president during the Civil War?", a: ["George Washington", "Abraham Lincoln", "Thomas Jefferson", "John Adams"], c: 1, e: "Abraham Lincoln was president during the Civil War." }
        ]
      }
    ]
  }
};

/* TILE MAP: 0 ground, 1 water, 2 trees, 3 path, 4 building, 5 rock */
function createMap() {
  const map = Array.from({ length: ROWS }, () => Array(COLS).fill(0));

  if (world === "egypt") {
    for (let x = 0; x < COLS; x++) map[10][x] = 3;
    for (let y = 0; y < 10; y++) map[y][0] = 1;
    for (let y = 0; y < 10; y++) map[y][1] = 1;
    [[4,3],[8,6],[17,3],[18,8],[3,8],[11,2]].forEach(([x,y]) => map[y][x] = 2);
    [[7,2],[8,2],[9,2],[7,3],[8,3],[9,3]].forEach(([x,y]) => map[y][x] = 4);
    [[5,8],[12,7],[16,6],[6,5]].forEach(([x,y]) => map[y][x] = 5);
  } else {
    for (let x = 0; x < COLS; x++) map[10][x] = 3;
    for (let x = 0; x < COLS; x++) map[0][x] = 1;
    for (let y = 0; y < 10; y++) map[y][0] = 1;
    [[3,3],[4,3],[5,3],[3,4],[4,4],[5,4]].forEach(([x,y]) => map[y][x] = 4);
    [[13,2],[14,2],[15,2],[13,3],[14,3],[15,3]].forEach(([x,y]) => map[y][x] = 4);
    [[7,2],[10,5],[17,5],[3,8],[18,8],[11,8]].forEach(([x,y]) => map[y][x] = 2);
    [[8,7],[12,6],[16,8]].forEach(([x,y]) => map[y][x] = 5);
  }
  return map;
}

let map = createMap();

function tile(x,y) {
  return map[y]?.[x] ?? 1;
}

/* =========================================
   PIXEL DRAWING
========================================= */

function rect(c,x,y,w,h,color) {
  c.fillStyle = color;
  c.fillRect(Math.round(x),Math.round(y),w,h);
}

function pyramid(c,x,y,size) {
  c.fillStyle="#b98246";
  c.beginPath();
  c.moveTo(x,y);c.lineTo(x-size/2,y+size*.7);c.lineTo(x+size/2,y+size*.7);
  c.closePath();c.fill();
  c.fillStyle="#e3bc78";
  c.beginPath();
  c.moveTo(x,y);c.lineTo(x,y+size*.7);c.lineTo(x+size/2,y+size*.7);
  c.closePath();c.fill();
}

function tree(c,x,y) {
  rect(c,x-5,y-2,10,35,"#76502e");
  rect(c,x-23,y-12,46,9,"#397449");
  rect(c,x-17,y-23,34,11,"#4b8950");
  rect(c,x-7,y-32,14,10,"#65965a");
}

function person(c,x,y,kind="player") {
  const guide=kind==="guide";
  const skin=guide?"#a96c4a":"#d6a078";
  const clothes=world==="egypt"?(guide?"#eee0b5":"#345b7b"):(guide?"#c5c7c7":"#304f75");
  rect(c,x+5,y+34,30,5,"#0003");
  rect(c,x+12,y+4,17,16,skin);
  rect(c,x+10,y+2,21,7,guide?"#48372b":"#46382e");
  rect(c,x+16,y+12,3,3,"#252525");
  rect(c,x+24,y+12,3,3,"#252525");
  rect(c,x+8,y+20,25,14,clothes);
  rect(c,x+4,y+21,5,12,skin);
  rect(c,x+32,y+21,5,12,skin);
  rect(c,x+10,y+33,9,8,"#514033");
  rect(c,x+23,y+33,9,8,"#514033");
  if(guide && world==="egypt"){
    rect(c,x+9,y-2,23,5,"#eee0b5");
    rect(c,x+15,y-6,12,5,"#eee0b5");
  }
  if(guide && world==="america"){
    rect(c,x+8,y-2,26,7,"#514e55");
    rect(c,x+12,y-7,18,6,"#514e55");
  }
}

function drawEgyptBackground(c) {
  rect(c,0,0,800,480,"#d6aa68");
  rect(c,0,0,800,160,"#85a5ad");
  rect(c,650,30,65,65,"#f6d37c");
  rect(c,0,150,800,90,"#c89a5b");
  pyramid(c,170,20,260);
  pyramid(c,430,75,180);
  pyramid(c,690,120,110);
  rect(c,0,250,800,230,"#d4a55f");
  rect(c,0,285,78,195,"#477f91");
  rect(c,0,298,78,4,"#9bc6c1");
  rect(c,0,355,78,4,"#9bc6c1");
  tree(c,110,245);tree(c,745,248);
}

function drawAmericaBackground(c) {
  rect(c,0,0,800,480,"#8fa8b1");
  rect(c,0,0,800,155,"#91b2bc");
  rect(c,650,35,60,60,"#f5d17d");
  rect(c,0,150,800,100,"#78926e");
  rect(c,0,250,800,230,"#b99a6d");
  rect(c,0,270,800,210,"#b79a72");
  for(let x=20;x<800;x+=85){
    rect(c,x,125,12,90,"#634c36");
    rect(c,x-19,95,50,43,"#41694e");
    rect(c,x-12,77,37,35,"#527a53");
  }
  rect(c,115,210,125,105,"#d8c5a1");
  rect(c,105,200,145,17,"#7d5140");
  rect(c,140,170,75,30,"#b79a73");
  rect(c,170,145,14,25,"#694b3c");
  rect(c,150,255,25,60,"#634a3a");
  rect(c,350,225,145,90,"#d8c5a1");
  rect(c,340,215,165,15,"#754c3c");
  rect(c,390,185,65,30,"#b79a73");
  rect(c,410,155,15,30,"#68483b");
  rect(c,395,260,30,55,"#634a3a");
}

function drawTile(x,y,type) {
  const px=x*TILE,py=y*TILE;
  if(type===3){
    rect(ctx,px,py,40,40,"#b49b78");
    rect(ctx,px+2,py+3,17,14,"#d1b78f");
    rect(ctx,px+21,py+3,17,14,"#9e8767");
    rect(ctx,px+2,py+21,17,16,"#9e8767");
    rect(ctx,px+21,py+21,17,16,"#d1b78f");
  }else if(type===1){
    rect(ctx,px,py,40,40,world==="egypt"?"#477f91":"#668f9d");
    rect(ctx,px+4,py+9,18,3,"#a1c8c4");
    rect(ctx,px+20,py+27,15,3,"#a1c8c4");
  }else if(type===2){
    rect(ctx,px,py,40,40,world==="egypt"?"#d5aa67":"#b99a72");
    tree(ctx,px+20,py+7);
  }else if(type===4){
    rect(ctx,px,py,40,40,world==="egypt"?"#d1b17b":"#d7c6a5");
    rect(ctx,px+3,py+3,34,8,"#80543e");
    rect(ctx,px+8,py+12,24,28,"#e3cfaa");
    rect(ctx,px+12,py+14,5,26,"#8c6748");
    rect(ctx,px+24,py+14,5,26,"#8c6748");
  }else if(type===5){
    rect(ctx,px,py,40,40,world==="egypt"?"#d5aa67":"#b99a72");
    rect(ctx,px+8,py+22,23,13,"#94816b");
    rect(ctx,px+14,py+15,14,9,"#b4a18a");
  }else{
    rect(ctx,px,py,40,40,world==="egypt"?"#d5aa67":"#b99a72");
    rect(ctx,px+8,py+11,3,3,"#c39455");
    rect(ctx,px+28,py+27,4,3,"#e4c27e");
  }
}

function currentMission() {
  return worlds[world].missions[activeMission];
}

function currentNPC() {
  return currentMission().npc;
}

function nearNPC() {
  const n=currentNPC();
  return Math.abs(player.x-n.x)+Math.abs(player.y-n.y)<=1;
}

function nearArtifact() {
  const a=currentMission().artifact;
  return player.x===a.x && player.y===a.y;
}

function drawGame() {
  if(world==="egypt")drawEgyptBackground(ctx);
  else drawAmericaBackground(ctx);

  for(let y=0;y<ROWS;y++){
    for(let x=0;x<COLS;x++)drawTile(x,y,tile(x,y));
  }

  const mission=currentMission();
  const npc=mission.npc;
  const artifact=mission.artifact;

  person(ctx,npc.x*TILE,npc.y*TILE,"guide");

  if(!artifacts[artifactKey()]){
    rect(ctx,artifact.x*TILE+12,artifact.y*TILE+15,16,16,"#f3cf6f");
    rect(ctx,artifact.x*TILE+15,artifact.y*TILE+10,10,6,"#fff0ad");
    rect(ctx,artifact.x*TILE+17,artifact.y*TILE+18,6,9,"#a16d32");
  }

  person(ctx,player.x*TILE,player.y*TILE,"player");

  rect(ctx,12,12,220,30,"#192332cc");
  ctx.fillStyle="#fff0c4";
  ctx.font="bold 12px monospace";
  ctx.fillText(world==="egypt"?"ANCIENT EGYPT":"UNITED STATES",22,32);

  if(nearNPC()){
    ctx.fillStyle="#fff1b5";
    ctx.font="bold 12px monospace";
    ctx.fillText("SPACE: TALK",630,32);
  }else if(nearArtifact()){
    ctx.fillStyle="#fff1b5";
    ctx.font="bold 12px monospace";
    ctx.fillText("SPACE: COLLECT",610,32);
  }
}

/* MENU ART */
function drawMenuArt(){
  rect(mctx,0,0,640,420,"#d5a968");
  rect(mctx,0,0,640,190,"#85a7b0");
  rect(mctx,470,40,65,65,"#f4d178");
  pyramid(mctx,170,45,280);
  pyramid(mctx,380,100,190);
  rect(mctx,0,255,640,165,"#477f91");
  rect(mctx,0,300,640,120,"#d2a25e");
  tree(mctx,75,250);tree(mctx,565,255);
  rect(mctx,220,210,180,100,"#d7bb88");
  rect(mctx,210,198,200,17,"#95613e");
  rect(mctx,255,255,30,55,"#634b38");
  rect(mctx,335,255,30,55,"#634b38");
  person(mctx,455,280,"player");
}

/* =========================================
   NAVIGATION AND WORLD START
========================================= */

function showScreen(id){
  screens.forEach(s=>s.classList.add("hidden"));
  $(id).classList.remove("hidden");
}

$("home-link").addEventListener("click",e=>{
  e.preventDefault();
  gameActive=false;
  closeOverlays();
  showScreen("main-menu");
});

$("new-game").addEventListener("click",()=>{
  playSound("click");
  showScreen("world-screen");
});

$("continue-game").addEventListener("click",()=>{
  if(!loadGame()){
    showScreen("world-screen");
    return;
  }
  startGame();
});

$("open-settings").addEventListener("click",()=>showScreen("settings-screen"));

document.querySelectorAll(".back-menu").forEach(b=>b.addEventListener("click",()=>showScreen("main-menu")));

document.querySelectorAll("[data-world]").forEach(button=>{
  button.addEventListener("click",()=>{
    world=button.dataset.world;
    player={x:2,y:9};
    xp=0;lives=5;activeMission=0;
    completed={};artifacts={};collected={};
    map=createMap();
    saveGame();
    startGame();
  });
});

function startGame(){
  map=createMap();
  gameActive=true;
  closeOverlays();
  updateUI();
  showScreen("game-screen");
  drawGame();
}

$("exit-game").addEventListener("click",()=>{
  gameActive=false;
  saveGame();
  closeOverlays();
  showScreen("main-menu");
});

/* =========================================
   MOVEMENT
========================================= */

function blocked(x,y){
  if(x<0||x>=COLS||y<0||y>=ROWS)return true;
  return [1,2,4,5].includes(tile(x,y));
}

function move(dx,dy){
  if(!gameActive||!dialogue.classList.contains("hidden")||
     !challenge.classList.contains("hidden")||
     !resultOverlay.classList.contains("hidden"))return;

  const nx=player.x+dx,ny=player.y+dy;
  if(blocked(nx,ny))return;
  const npc=currentNPC();
  if(nx===npc.x&&ny===npc.y)return;

  player.x=nx;player.y=ny;
  playSound("move");
  if(nearArtifact())collectArtifact();
  drawGame();
  saveGame();
}

document.addEventListener("keydown",e=>{
  if(!gameActive)return;
  const key=e.key.toLowerCase();
  if(["arrowup","arrowdown","arrowleft","arrowright"," "].includes(key))e.preventDefault();

  if(key===" "){
    if(!dialogue.classList.contains("hidden")||
       !challenge.classList.contains("hidden")||
       !resultOverlay.classList.contains("hidden"))return;
    interact();
    return;
  }

  const directions={
    w:[0,-1],arrowup:[0,-1],
    s:[0,1],arrowdown:[0,1],
    a:[-1,0],arrowleft:[-1,0],
    d:[1,0],arrowright:[1,0]
  };
  if(directions[key])move(...directions[key]);
});

$("interact").addEventListener("click",interact);

/* =========================================
   NPC AND ARTIFACT INTERACTION
========================================= */

function interact(){
  if(!gameActive||!dialogue.classList.contains("hidden")||
     !challenge.classList.contains("hidden")||
     !resultOverlay.classList.contains("hidden"))return;

  if(nearArtifact()){
    collectArtifact();
    return;
  }

  if(!nearNPC()){
    showDialogue("EXPLORER","Explore the map! Find the character marked by a golden symbol. You can also search for the glowing artifact.",()=>{});
    return;
  }

  const mission=currentMission();
  if(completed[missionKey()]){
    showDialogue(mission.npc.name,"You have already completed this mission. Explore the world and continue your journey!",()=>{});
    return;
  }

  showDialogue(
    mission.npc.name,
    `${mission.description} Are you ready for the challenge?`,
    startChallenge
  );
}

function showDialogue(title,message,callback){
  $("dialogue-title").textContent=title;
  $("dialogue-text").textContent=message;
  $("dialogue-role").textContent=worlds[world].name+" · HISTORICAL CHARACTER";
  dialogue.classList.remove("hidden");
  dialogueCallback=callback;
  playSound("dialogue");
}

function closeOverlays(){
  dialogue.classList.add("hidden");
  challenge.classList.add("hidden");
  resultOverlay.classList.add("hidden");
  dialogueCallback=null;
}

$("dialogue-action").addEventListener("click",()=>{
  const action=dialogueCallback;
  dialogueCallback=null;
  dialogue.classList.add("hidden");
  if(action)action();
});

function artifactKey(){
  return `${world}-${activeMission}`;
}
function missionKey(){
  return `${world}-${activeMission}`;
}

function collectArtifact(){
  const key=artifactKey();
  if(artifacts[key])return;
  artifacts[key]=true;
  xp+=50;
  playSound("collect");
  updateUI();
  saveGame();
  showDialogue("ARTIFACT DISCOVERED!",`You found the ${currentMission().artifact.name}! You earned 50 XP. This object represents an important part of the historical world.`,()=>{});
  drawGame();
}

/* =========================================
   CHALLENGES
========================================= */

// Shuffles an array while avoiding the exact same order as last time.
function shuffleDifferent(items, getKey, previousOrder){
  if(items.length<2)return [...items];

  const signature=list=>list.map(getKey).join("\u001f");
  let shuffled=[...items];

  for(let attempt=0;attempt<20;attempt++){
    shuffled=[...items];

    for(let i=shuffled.length-1;i>0;i--){
      const j=Math.floor(Math.random()*(i+1));
      [shuffled[i],shuffled[j]]=[shuffled[j],shuffled[i]];
    }

    if(signature(shuffled)!==previousOrder)return shuffled;
  }

  return [...items.slice(1),items[0]];
}

function startChallenge(){
  const mission=currentMission();
  const historyKey=`${world}-${activeMission}`;

  const shuffledQuestions=shuffleDifferent(
    mission.questions,
    question=>question.q,
    challengeShuffleHistory.questionOrders[historyKey]
  );

  challengeShuffleHistory.questionOrders[historyKey]=
    shuffledQuestions.map(question=>question.q).join("\u001f");

  activeChallenge=shuffledQuestions.map(question=>{
    const shuffledAnswers=shuffleDifferent(
      question.a.map((answer,index)=>({
        answer,
        correct:index===question.c
      })),
      option=>option.answer,
      challengeShuffleHistory.answerOrders[question.q]
    );

    challengeShuffleHistory.answerOrders[question.q]=
      shuffledAnswers.map(option=>option.answer).join("\u001f");

    return {
      ...question,
      a:shuffledAnswers.map(option=>option.answer),
      c:shuffledAnswers.findIndex(option=>option.correct)
    };
  });

  challengeIndex=0;
  challengeCorrect=0;
  showQuestion();
}

function showQuestion(){
  if(!activeChallenge)return;
  challengeAnswered=false;
  const q=activeChallenge[challengeIndex];

  $("challenge-type").textContent=
    `MISSION ${activeMission+1} · QUESTION ${challengeIndex+1}/${activeChallenge.length}`;
  $("challenge-title").textContent=q.q;
  $("challenge-description").textContent="Choose the best answer.";
  $("challenge-feedback").textContent="";
  $("challenge-feedback").className="";
  $("challenge-next").classList.add("hidden");

  const options=$("challenge-options");
  options.innerHTML="";

  q.a.forEach((answer,index)=>{
    const button=document.createElement("button");
    button.className="answer";
    button.textContent=answer;
    button.addEventListener("click",()=>answerQuestion(index));
    options.appendChild(button);
  });

  challenge.classList.remove("hidden");
}

function answerQuestion(index){
  if(challengeAnswered)return;
  challengeAnswered=true;

  const q=activeChallenge[challengeIndex];
  const buttons=document.querySelectorAll(".answer");

  buttons.forEach((b,i)=>{
    b.disabled=true;
    if(i===q.c)b.classList.add("correct");
    if(i===index&&index!==q.c)b.classList.add("wrong");
  });

  const feedback=$("challenge-feedback");

  if(index===q.c){
    challengeCorrect++;
    xp+=30;
    feedback.textContent="CORRECT! +30 XP. "+q.e;
    feedback.classList.add("good");
    playSound("correct");
  }else{
    lives=Math.max(0,lives-1);
    feedback.textContent="NOT QUITE. "+q.e;
    feedback.classList.add("bad");
    playSound("wrong");
  }

  updateUI();
  saveGame();
  $("challenge-next").classList.remove("hidden");
}

$("challenge-next").addEventListener("click",()=>{
  if(!activeChallenge)return;

  if(lives<=0){
    activeChallenge=null;
    challenge.classList.add("hidden");
    showResult("OUT OF LIVES","Your adventure is paused. You can restart this world from the world selection screen.");
    return;
  }

  challengeIndex++;

  if(challengeIndex<activeChallenge.length){
    showQuestion();
  }else{
    finishMission();
  }
});

function finishMission(){
  const total=activeChallenge.length;
  const passed=challengeCorrect>=2;
  activeChallenge=null;
  challenge.classList.add("hidden");

  if(passed){
    completed[missionKey()]=true;
    xp+=100;
    playSound("complete");

    if(activeMission===worlds[world].missions.length-1){
      saveGame();
      updateUI();
      const bothWorldsDone = ["egypt","america"].every(id =>
        worlds[id].missions.every((m,i)=>completed[`${id}-${i}`])
      );
      const completionTitle = bothWorldsDone ? "HISTORY QUEST COMPLETED!" : "WORLD COMPLETED!";
      const completionText = bothWorldsDone
        ? `Incredible work! You completed all ten missions across Ancient Egypt and US History. Your final score is ${xp} XP. You can revisit either world from the destination screen.`
        : `Amazing work! You completed all five missions in ${worlds[world].name}. You earned ${xp} XP. Return to the destination screen to explore the other historical world.`;
      showResult(completionTitle,completionText,()=>{
        gameActive=false;
        closeOverlays();
        showScreen(bothWorldsDone?"main-menu":"world-screen");
      });
      return;
    }

    showResult(
      "MISSION COMPLETE!",
      `You answered ${challengeCorrect} out of ${total} questions correctly. You earned 100 bonus XP. The next mission is now unlocked!`,
      true
    );
  }else{
    showResult(
      "MISSION NOT COMPLETED",
      `You answered ${challengeCorrect} out of ${total} questions correctly. You need at least two correct answers. Review the information and try again.`
    );
  }

  updateUI();
  saveGame();
}

function showResult(title,message,unlock=false){
  $("result-title").textContent=title;
  $("result-text").textContent=message;
  $("result-button").textContent=typeof unlock==="function"?"CONTINUE":"CONTINUE";
  resultOverlay.classList.remove("hidden");

  $("result-button").onclick=()=>{
    resultOverlay.classList.add("hidden");

    if(typeof unlock==="function"){
      unlock();
      saveGame();
      return;
    }

    if(unlock){
      activeMission=Math.min(activeMission+1,worlds[world].missions.length-1);
      player={x:2,y:9};
      map=createMap();
    }

    if(lives<=0){
      gameActive=false;
      showScreen("world-screen");
      return;
    }

    updateUI();
    drawGame();
    saveGame();
  };
}

/* =========================================
   USER INTERFACE
========================================= */

function updateUI(){
  const missions=worlds[world].missions;
  const finished=missions.filter((m,i)=>completed[`${world}-${i}`]).length;
  const artifactTotal=missions.filter((m,i)=>artifacts[`${world}-${i}`]).length;

  $("world-name").textContent=worlds[world].name;
  $("map-name").textContent=worlds[world].mapName;
  $("lives").textContent=lives>0?"♥ ".repeat(lives).trim():"0";
  $("xp").textContent=String(xp).padStart(4,"0")+" XP";
  $("mission-count").textContent=`${finished} / 5`;
  $("artifact-count").textContent=`${artifactTotal} / 5`;

  const mission=missions[activeMission];
  $("mission-title").textContent=mission.name;
  $("mission-description").textContent=mission.description;
  $("progress-fill").style.width=`${finished/5*100}%`;
  $("progress-label").textContent=`${Math.round(finished/5*100)}% COMPLETE`;

  $("mission-list").innerHTML="";
  missions.forEach((m,i)=>{
    const row=document.createElement("div");
    row.className="mission-entry"+(completed[`${world}-${i}`]?" done":"");
    const status=completed[`${world}-${i}`]?"✓":i===activeMission?"▶":"🔒";
    row.innerHTML=`<span class="status">${status}</span><span>${m.name}</span>`;
    $("mission-list").appendChild(row);
  });
}

/* =========================================
   SAVE / LOAD
========================================= */

function saveGame(){
  const data={
    world,player,xp,lives,activeMission,
    completed,artifacts,collected
  };
  try{
    localStorage.setItem(SAVE_KEY,JSON.stringify(data));
  }catch(e){
    console.warn("Could not save progress",e);
  }
}

function loadGame(){
  const raw=localStorage.getItem(SAVE_KEY);
  if(!raw)return false;

  try{
    const data=JSON.parse(raw);
    world=data.world==="america"?"america":"egypt";
    xp=Math.max(0,Number(data.xp)||0);
    lives=Math.max(0,Math.min(5,Number(data.lives)||0));
    activeMission=Math.max(0,Math.min(4,Number(data.activeMission)||0));
    completed=data.completed||{};
    artifacts=data.artifacts||{};
    collected=data.collected||{};

    const x=Number(data.player?.x),y=Number(data.player?.y);
    player={
      x:Number.isInteger(x)&&x>=0&&x<COLS?x:2,
      y:Number.isInteger(y)&&y>=0&&y<ROWS?y:9
    };

    map=createMap();
    if(blocked(player.x,player.y))player={x:2,y:9};

    const next=worlds[world].missions.findIndex((m,i)=>!completed[`${world}-${i}`]);
    activeMission=next===-1?0:next;

    return true;
  }catch(e){
    console.warn("Saved game could not be loaded",e);
    return false;
  }
}

$("reset-game").addEventListener("click",()=>{
  if(!confirm("Reset all your History Quest progress?"))return;
  localStorage.removeItem(SAVE_KEY);
  world="egypt";player={x:2,y:9};xp=0;lives=5;
  activeMission=0;completed={};artifacts={};collected={};
  updateUI();
  showScreen("main-menu");
});

/* =========================================
   SOUND EFFECTS
========================================= */

function playSound(type){
  if(!soundEnabled)return;
  try{
    const Audio=window.AudioContext||window.webkitAudioContext;
    if(!Audio)return;
    if(!audioContext)audioContext=new Audio();
    if(audioContext.state==="suspended")audioContext.resume();

    const notes={
      click:[440,.06],
      move:[260,.04],
      dialogue:[520,.12],
      correct:[740,.16],
      wrong:[180,.18],
      collect:[920,.16],
      complete:[880,.28]
    };
    const [frequency,duration]=notes[type]||notes.click;
    const osc=audioContext.createOscillator();
    const gain=audioContext.createGain();
    osc.type="square";
    osc.frequency.value=frequency;
    gain.gain.setValueAtTime(.035,audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(.001,audioContext.currentTime+duration);
    osc.connect(gain);
    gain.connect(audioContext.destination);
    osc.start();
    osc.stop(audioContext.currentTime+duration);
  }catch(e){
    console.warn("Audio unavailable",e);
  }
}

$("sound-toggle").addEventListener("change",e=>{
  soundEnabled=e.target.checked;
  if(soundEnabled)playSound("click");
});

/* =========================================
   INITIALIZATION
========================================= */

drawMenuArt();
map=createMap();
showScreen("main-menu");
updateUI();