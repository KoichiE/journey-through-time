
"use strict";

/* =========================================
   HISTORY QUEST - ANCIENT EGYPT EDITION
========================================= */

const STORAGE_KEY = "historyQuestEgyptProgress";

const canvas = document.getElementById("game-canvas");
const ctx = canvas.getContext("2d");
const menuCanvas = document.getElementById("menu-canvas");
const menuCtx = menuCanvas.getContext("2d");
const dialogueBox = document.getElementById("dialogue-box");

const TILE = 40;
const COLS = 20;
const ROWS = 12;

const screens = document.querySelectorAll(".screen");

let currentWorld = "egypt";
let score = 0;
let lives = 3;
let quizCompleted = false;
let soundEnabled = true;
let gameActive = false;
let quizAnswered = false;
let dialogueAction = null;
let audioContext = null;

let player = { x: 3, y: 9 };

const npc = { x: 15, y: 8 };

/* =========================================
   MAP
   0 = sand
   1 = water
   2 = palm tree
   3 = stone path
   4 = temple
   5 = rock
========================================= */

const map = Array.from({ length: ROWS }, () =>
    Array(COLS).fill(0)
);

// Horizontal stone road
for (let x = 1; x < COLS - 1; x++) {
    map[9][x] = 3;
}

// Path leading to the guide
for (let y = 7; y <= 9; y++) {
    map[y][15] = 3;
}

// Palm trees
map[5][3] = 2;
map[7][6] = 2;
map[5][18] = 2;
map[8][18] = 2;
map[3][12] = 2;

// Rocks
map[8][2] = 5;
map[6][9] = 5;
map[10][17] = 5;

// Temple structure
map[3][7] = 4;
map[3][8] = 4;
map[3][9] = 4;
map[4][7] = 4;
map[4][8] = 4;
map[4][9] = 4;

/* =========================================
   HISTORICAL CONTENT
========================================= */

const historicalContent = {
    egypt: {
        label: "ANCIENT EGYPT",
        location: "THE NILE VALLEY",
        guideTitle: "HISTORICAL GUIDE",
        guideMessage:
            "Welcome, traveler! You have arrived in Ancient Egypt. This civilization grew along the Nile River, where farming, trade, architecture, and powerful pharaohs shaped its history. Are you ready for your first challenge?",
        question:
            "Which river was essential to the development of Ancient Egyptian civilization?",
        answers: [
            "The Amazon River",
            "The Nile River",
            "The Tigris River",
            "The Mississippi River"
        ],
        correct: 1,
        explanation:
            "The Nile River was essential to Ancient Egypt. Its annual floods deposited fertile soil, while its water supported farming, transportation, and settlements."
    },

    us: {
        label: "US HISTORY",
        location: "THE AMERICAN REVOLUTION",
        guideTitle: "HISTORICAL GUIDE",
        guideMessage:
            "Welcome, explorer! Before continuing your journey through American history, let's test your knowledge of the country's founding.",
        question:
            "In which year was the Declaration of Independence adopted?",
        answers: ["1492", "1776", "1812", "1865"],
        correct: 1,
        explanation:
            "The Declaration of Independence was adopted on July 4, 1776. It announced that the thirteen American colonies considered themselves independent from Great Britain."
    }
};

/* =========================================
   SCREEN NAVIGATION
========================================= */

function showScreen(id) {
    screens.forEach(screen => screen.classList.add("hidden"));

    const selected = document.getElementById(id);
    if (selected) selected.classList.remove("hidden");
}

document.getElementById("brand-home").addEventListener("click", event => {
    event.preventDefault();
    gameActive = false;
    showScreen("main-menu");
});

document.getElementById("new-game-btn").addEventListener("click", () => {
    playSound("click");
    showScreen("world-selection");
});

document.getElementById("continue-btn").addEventListener("click", () => {
    playSound("click");

    if (!loadProgress()) {
        showScreen("world-selection");
        return;
    }

    if (lives <= 0 || quizCompleted) {
        showScreen("world-selection");
        return;
    }

    startGame();
});

document.getElementById("settings-btn").addEventListener("click", () => {
    playSound("click");
    showScreen("settings-screen");
});

document.querySelectorAll("[data-screen]").forEach(button => {
    button.addEventListener("click", () => {
        playSound("click");
        showScreen(button.dataset.screen);
    });
});

document.querySelectorAll(".world-card").forEach(card => {
    card.addEventListener("click", () => {
        currentWorld = card.dataset.world;
        score = 0;
        lives = 3;
        quizCompleted = false;
        player = { x: 3, y: 9 };

        saveProgress();
        playSound("click");
        startGame();
    });
});

/* =========================================
   GAME INITIALIZATION
========================================= */

function startGame() {
    gameActive = true;
    quizAnswered = false;

    closeDialogue();
    document.getElementById("quiz-box").classList.add("hidden");
    document.getElementById("game-over-box").classList.add("hidden");

    const content = historicalContent[currentWorld];

    document.getElementById("world-label").textContent = content.label;
    document.getElementById("location-title").textContent = content.location;

    updateHUD();
    showScreen("game-screen");
    drawWorld();
    saveProgress();
}

document.getElementById("exit-game-btn").addEventListener("click", () => {
    gameActive = false;
    closeDialogue();
    document.getElementById("quiz-box").classList.add("hidden");
    document.getElementById("game-over-box").classList.add("hidden");

    saveProgress();
    playSound("click");
    showScreen("main-menu");
});

/* =========================================
   PIXEL ART DRAWING HELPERS
========================================= */

function pixel(context, x, y, width, height, color) {
    context.fillStyle = color;
    context.fillRect(Math.round(x), Math.round(y), width, height);
}

function drawPyramid(context, x, y, size) {
    const height = size * 0.7;

    context.fillStyle = "#bd894b";
    context.beginPath();
    context.moveTo(x, y);
    context.lineTo(x - size / 2, y + height);
    context.lineTo(x + size / 2, y + height);
    context.closePath();
    context.fill();

    context.fillStyle = "#e0b66d";
    context.beginPath();
    context.moveTo(x, y);
    context.lineTo(x, y + height);
    context.lineTo(x + size / 2, y + height);
    context.closePath();
    context.fill();

    context.fillStyle = "#9a6c3e";
    for (let row = 1; row < 5; row++) {
        const lineY = y + row * height / 5;
        const halfWidth = (row * size) / 10;

        context.fillRect(x - halfWidth, lineY, halfWidth * 2, 2);
    }
}

function drawPalm(context, x, y, scale = 1) {
    const trunkWidth = 12 * scale;
    const trunkHeight = 38 * scale;

    pixel(
        context,
        x - trunkWidth / 2,
        y,
        trunkWidth,
        trunkHeight,
        "#89552f"
    );

    const leafColor = "#3e7850";
    const lightLeaf = "#568d55";

    pixel(context, x - 7 * scale, y - 37 * scale, 14 * scale, 12 * scale, leafColor);
    pixel(context, x - 31 * scale, y - 31 * scale, 28 * scale, 9 * scale, leafColor);
    pixel(context, x + 3 * scale, y - 31 * scale, 28 * scale, 9 * scale, leafColor);
    pixel(context, x - 25 * scale, y - 45 * scale, 24 * scale, 9 * scale, lightLeaf);
    pixel(context, x + 1 * scale, y - 45 * scale, 24 * scale, 9 * scale, lightLeaf);
    pixel(context, x - 8 * scale, y - 51 * scale, 16 * scale, 9 * scale, leafColor);
}

/* =========================================
   MENU PIXEL ART
========================================= */

function drawMenuScene() {
    const c = menuCtx;

    c.clearRect(0, 0, 640, 420);

    // Sky
    pixel(c, 0, 0, 640, 420, "#d8ad69");
    pixel(c, 0, 0, 640, 205, "#83a3ad");
    pixel(c, 0, 180, 640, 45, "#a8b4a0");

    // Sun
    c.fillStyle = "#f7d16f";
    c.fillRect(465, 45, 64, 64);
    c.fillRect(481, 29, 32, 96);

    // Distant landscape
    pixel(c, 0, 205, 640, 55, "#c89b5a");
    drawPyramid(c, 180, 65, 300);
    drawPyramid(c, 370, 105, 205);
    drawPyramid(c, 515, 145, 120);

    // Sand
    pixel(c, 0, 260, 640, 160, "#d5a65f");

    // Nile
    pixel(c, 0, 290, 640, 46, "#477f94");
    pixel(c, 0, 300, 640, 4, "#7bb4ba");
    pixel(c, 40, 321, 65, 3, "#b0d0c4");
    pixel(c, 350, 314, 80, 3, "#b0d0c4");

    // Foreground sand
    pixel(c, 0, 340, 640, 80, "#bd8950");
    drawPalm(c, 75, 365, 1.25);
    drawPalm(c, 570, 368, 1.1);

    // Temple
    pixel(c, 240, 242, 170, 98, "#d9bb85");
    pixel(c, 225, 228, 200, 18, "#9d6241");
    pixel(c, 240, 218, 170, 12, "#d9bb85");
    pixel(c, 265, 275, 25, 65, "#79583f");
    pixel(c, 325, 275, 25, 65, "#79583f");
    pixel(c, 285, 280, 20, 60, "#4e5960");
    pixel(c, 295, 280, 10, 60, "#35424d");

    // Temple decoration
    for (let x = 248; x < 400; x += 25) {
        pixel(c, x, 250, 4, 6, "#9b764b");
    }

    // Ground details
    for (let x = 20; x < 620; x += 45) {
        pixel(c, x, 385 + (x % 3) * 4, 8, 3, "#e3bd78");
    }

    // Tiny character
    drawPixelCharacter(c, 465, 337, "player");
}

/* =========================================
   WORLD BACKGROUND
========================================= */

function drawWorldBackground() {
    // Sky
    pixel(ctx, 0, 0, 800, 480, "#d8b16f");
    pixel(ctx, 0, 0, 800, 160, "#83a5ad");

    // Sun
    pixel(ctx, 665, 35, 62, 62, "#f4ce70");
    pixel(ctx, 681, 19, 30, 94, "#f4ce70");

    // Distant dunes
    pixel(ctx, 0, 155, 800, 80, "#c99d61");
    drawPyramid(ctx, 160, 20, 240);
    drawPyramid(ctx, 410, 70, 180);
    drawPyramid(ctx, 710, 105, 110);

    // Distant desert
    pixel(ctx, 0, 235, 800, 245, "#d7ad68");
    pixel(ctx, 0, 240, 800, 12, "#c69858");

    // Nile river on the left
    pixel(ctx, 0, 275, 80, 205, "#477e91");
    pixel(ctx, 0, 285, 80, 5, "#86b9b8");
    pixel(ctx, 0, 330, 80, 4, "#8bbdb8");
    pixel(ctx, 0, 390, 80, 4, "#8bbdb8");

    // Distant palm trees
    drawPalm(ctx, 105, 280, 1.1);
    drawPalm(ctx, 750, 270, 1.0);

    // Pixel texture in sand
    for (let x = 100; x < 790; x += 73) {
        const y = 245 + ((x * 7) % 90);
        pixel(ctx, x, y, 7, 3, "#e9c77f");
        pixel(ctx, x + 24, y + 20, 4, 3, "#bd9153");
    }

    // Foreground ground texture
    for (let x = 0; x < 800; x += TILE) {
        pixel(ctx, x, 468, TILE, 12, "#b88b53");
    }
}

/* =========================================
   MAP TILES
========================================= */

function drawTile(x, y, type) {
    const px = x * TILE;
    const py = y * TILE;

    if (type === 3) {
        pixel(ctx, px, py, TILE, TILE, "#b79b73");
        pixel(ctx, px + 2, py + 3, 17, 13, "#d0b58b");
        pixel(ctx, px + 21, py + 3, 17, 13, "#a98a64");
        pixel(ctx, px + 2, py + 21, 17, 15, "#a98a64");
        pixel(ctx, px + 21, py + 21, 17, 15, "#d0b58b");
        pixel(ctx, px, py + 18, TILE, 2, "#8e795d");
        return;
    }

    if (type === 1) {
        pixel(ctx, px, py, TILE, TILE, "#477e91");
        pixel(ctx, px + 5, py + 9, 17, 3, "#8dbec0");
        pixel(ctx, px + 19, py + 26, 15, 3, "#8dbec0");
        return;
    }

    if (type === 2) {
        pixel(ctx, px, py, TILE, TILE, "#d3a663");
        drawPalm(ctx, px + 20, py + 39, 0.8);
        return;
    }

    if (type === 4) {
        pixel(ctx, px, py, TILE, TILE, "#d1b17b");
        pixel(ctx, px + 3, py + 3, 34, 7, "#96623e");
        pixel(ctx, px + 5, py + 11, 30, 29, "#d7bc8b");
        pixel(ctx, px + 12, py + 14, 5, 26, "#8c6748");
        pixel(ctx, px + 24, py + 14, 5, 26, "#8c6748");
        return;
    }

    if (type === 5) {
        pixel(ctx, px, py, TILE, TILE, "#d3a663");
        pixel(ctx, px + 9, py + 22, 21, 13, "#a48a6b");
        pixel(ctx, px + 14, py + 15, 13, 9, "#b8a080");
        return;
    }

    // Sand tile
    pixel(ctx, px, py, TILE, TILE, "#d5aa67");
    pixel(ctx, px + 7, py + 10, 3, 3, "#c49556");
    pixel(ctx, px + 29, py + 28, 4, 3, "#e5bf7b");
}

/* =========================================
   PIXEL CHARACTERS
========================================= */

function drawPixelCharacter(context, x, y, type) {
    const isGuide = type === "guide";

    const skin = isGuide ? "#b9794e" : "#d9a276";
    const clothes = isGuide ? "#f0d59b" : "#315b82";
    const hair = isGuide ? "#493326" : "#49372e";

    // Shadow
    pixel(context, x + 6, y + 34, 28, 5, "rgba(0,0,0,.2)");

    // Head
    pixel(context, x + 12, y + 4, 17, 16, skin);

    // Hair / head covering
    pixel(context, x + 10, y + 2, 21, 7, hair);
    pixel(context, x + 10, y + 7, 4, 12, hair);

    if (isGuide) {
        pixel(context, x + 9, y, 23, 5, "#e7d7ad");
        pixel(context, x + 14, y - 4, 13, 5, "#e7d7ad");
    }

    // Eyes
    pixel(context, x + 16, y + 12, 3, 3, "#252525");
    pixel(context, x + 24, y + 12, 3, 3, "#252525");

    // Body
    pixel(context, x + 8, y + 20, 25, 14, clothes);
    pixel(context, x + 13, y + 22, 14, 4, isGuide ? "#d3a45b" : "#4779a5");

    // Arms
    pixel(context, x + 4, y + 21, 5, 12, skin);
    pixel(context, x + 32, y + 21, 5, 12, skin);

    // Legs
    pixel(context, x + 10, y + 33, 9, 8, "#544237");
    pixel(context, x + 23, y + 33, 9, 8, "#544237");

    if (isGuide) {
        // Staff
        pixel(context, x + 36, y + 9, 3, 33, "#68482f");
        pixel(context, x + 34, y + 7, 7, 5, "#e8c66c");
    }
}

function drawPlayer() {
    drawPixelCharacter(
        ctx,
        player.x * TILE,
        player.y * TILE,
        "player"
    );
}

function drawNPC() {
    drawPixelCharacter(
        ctx,
        npc.x * TILE,
        npc.y * TILE,
        "guide"
    );

    // Interaction marker
    pixel(ctx, npc.x * TILE + 13, npc.y * TILE - 19, 15, 15, "#f4cf72");
    pixel(ctx, npc.x * TILE + 18, npc.y * TILE - 15, 5, 7, "#3b3330");
    pixel(ctx, npc.x * TILE + 18, npc.y * TILE - 5, 5, 3, "#3b3330");
}

/* =========================================
   DRAW GAME WORLD
========================================= */

function drawWorld() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawWorldBackground();

    for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
            drawTile(x, y, map[y][x]);
        }
    }

    drawNPC();
    drawPlayer();

    // Location label
    pixel(ctx, 12, 12, 205, 29, "rgba(27,35,44,.8)");
    ctx.fillStyle = "#f8e4b8";
    ctx.font = "bold 12px monospace";
    ctx.fillText(
        currentWorld === "egypt" ? "NILE VALLEY" : "HISTORICAL WORLD",
        22,
        31
    );

    // Nearby guide prompt
    if (isNearNPC()) {
        ctx.fillStyle = "#fff0bb";
        ctx.font = "bold 12px monospace";
        ctx.fillText("PRESS SPACE TO TALK", 540, 35);
    }
}

/* =========================================
   MOVEMENT
========================================= */

function isBlocked(x, y) {
    if (x < 0 || x >= COLS || y < 0 || y >= ROWS) {
        return true;
    }

    const tile = map[y][x];
    return tile === 1 || tile === 2 || tile === 4 || tile === 5;
}

function movePlayer(dx, dy) {
    if (!gameActive) return;

    if (!dialogueBox.classList.contains("hidden")) return;
    if (!document.getElementById("quiz-box").classList.contains("hidden")) return;
    if (!document.getElementById("game-over-box").classList.contains("hidden")) return;

    const nextX = player.x + dx;
    const nextY = player.y + dy;

    if (isBlocked(nextX, nextY)) return;

    // Do not walk through the guide
    if (nextX === npc.x && nextY === npc.y) return;

    player.x = nextX;
    player.y = nextY;

    playSound("move");
    drawWorld();
    saveProgress();
}

document.addEventListener("keydown", event => {
    if (!gameActive) return;

    const key = event.key.toLowerCase();

    if ([
        "arrowup", "arrowdown", "arrowleft",
        "arrowright", " "
    ].includes(key)) {
        event.preventDefault();
    }

    if (key === "w" || key === "arrowup") movePlayer(0, -1);
    if (key === "s" || key === "arrowdown") movePlayer(0, 1);
    if (key === "a" || key === "arrowleft") movePlayer(-1, 0);
    if (key === "d" || key === "arrowright") movePlayer(1, 0);

    if (key === " ") interactWithNPC();
});

document.getElementById("interact-btn").addEventListener("click", () => {
    interactWithNPC();
});

/* =========================================
   GUIDE INTERACTION
========================================= */

function isNearNPC() {
    const distance =
        Math.abs(player.x - npc.x) +
        Math.abs(player.y - npc.y);

    return distance <= 1;
}

function interactWithNPC() {
    if (!gameActive) return;

    if (!dialogueBox.classList.contains("hidden")) return;
    if (!document.getElementById("quiz-box").classList.contains("hidden")) return;
    if (!document.getElementById("game-over-box").classList.contains("hidden")) return;

    if (!isNearNPC()) {
        showDialogue(
            "HISTORICAL GUIDE",
            "Come closer, traveler! I have a historical challenge waiting for you. Follow the stone path to find me."
        );
        return;
    }

    if (quizCompleted) {
        showDialogue(
            "HISTORICAL GUIDE",
            "Excellent work! You have already completed this challenge. Keep exploring and discovering the past!"
        );
        return;
    }

    const content = historicalContent[currentWorld];

    showDialogue(content.guideTitle, content.guideMessage);

    document.getElementById("dialogue-close-btn").textContent =
        "START CHALLENGE →";

    dialogueAction = () => {
        closeDialogue();
        startQuiz();
    };
}

function showDialogue(title, message) {
    document.getElementById("dialogue-title").textContent = title;
    document.getElementById("dialogue-message").textContent = message;

    document.getElementById("dialogue-box").classList.remove("hidden");

    document.getElementById("dialogue-close-btn").textContent =
        "CONTINUE →";

    dialogueAction = closeDialogue;
    playSound("dialogue");
}

function closeDialogue() {
    document.getElementById("dialogue-box").classList.add("hidden");
    dialogueAction = null;
}

document.getElementById("dialogue-close-btn").addEventListener("click", () => {
    if (typeof dialogueAction !== "function") return;

    const action = dialogueAction;
    dialogueAction = null;
    action();
});

/* =========================================
   QUIZ
========================================= */

function startQuiz() {
    if (!gameActive || quizCompleted) return;

    const content = historicalContent[currentWorld];

    quizAnswered = false;

    document.getElementById("quiz-question").textContent =
        content.question;

    const feedback = document.getElementById("quiz-feedback");
    feedback.textContent = "";
    feedback.className = "";

    document.getElementById("quiz-continue-btn").classList.add("hidden");

    const options = document.getElementById("quiz-options");
    options.innerHTML = "";

    content.answers.forEach((answer, index) => {
        const button = document.createElement("button");

        button.className = "quiz-option";
        button.textContent = answer;

        button.addEventListener("click", () => {
            answerQuestion(index);
        });

        options.appendChild(button);
    });

    document.getElementById("quiz-box").classList.remove("hidden");
    playSound("click");
}

function answerQuestion(selectedIndex) {
    if (quizAnswered) return;

    quizAnswered = true;

    const content = historicalContent[currentWorld];
    const buttons = document.querySelectorAll(".quiz-option");
    const feedback = document.getElementById("quiz-feedback");

    buttons.forEach((button, index) => {
        button.disabled = true;

        if (index === content.correct) {
            button.classList.add("correct");
        }

        if (index === selectedIndex && selectedIndex !== content.correct) {
            button.classList.add("incorrect");
        }
    });

    if (selectedIndex === content.correct) {
        score += 100;
        quizCompleted = true;

        feedback.textContent = "CORRECT! " + content.explanation;
        feedback.classList.add("success");

        playSound("correct");
    } else {
        lives = Math.max(0, lives - 1);

        feedback.textContent = "NOT QUITE! " + content.explanation;
        feedback.classList.add("error");

        playSound("wrong");
    }

    updateHUD();
    saveProgress();

    document.getElementById("quiz-continue-btn").classList.remove("hidden");
}

document.getElementById("quiz-continue-btn").addEventListener("click", () => {
    document.getElementById("quiz-box").classList.add("hidden");

    if (lives <= 0) {
        finishGame(false);
    } else if (quizCompleted) {
        finishGame(true);
    } else {
        drawWorld();
    }

    playSound("click");
});

/* =========================================
   RESULTS
========================================= */

function finishGame(success) {
    gameActive = false;

    const title = document.getElementById("game-over-title");
    const message = document.getElementById("game-over-message");

    if (success) {
        title.textContent = "MISSION COMPLETE!";
        message.textContent =
            `Well done, explorer! You completed your historical challenge and earned ${score} XP. Your journey through history continues!`;

        playSound("complete");
    } else {
        title.textContent = "MISSION ENDED";
        message.textContent =
            "You have used all your lives. Review what you learned and try again!";
    }

    document.getElementById("game-over-box").classList.remove("hidden");
    saveProgress();
}

document.getElementById("play-again-btn").addEventListener("click", () => {
    score = 0;
    lives = 3;
    quizCompleted = false;
    player = { x: 3, y: 9 };

    playSound("click");
    startGame();
});

document.getElementById("game-menu-btn").addEventListener("click", () => {
    gameActive = false;
    playSound("click");
    showScreen("main-menu");
});

/* =========================================
   HUD
========================================= */

function updateHUD() {
    document.getElementById("score-value").textContent =
        String(score).padStart(4, "0") + " XP";

    document.getElementById("lives-value").textContent =
        lives > 0 ? "♥ ".repeat(lives).trim() : "0";

    document.getElementById("mission-value").textContent =
        quizCompleted ? "1 / 1" : "0 / 1";
}

/* =========================================
   SAVE AND LOAD
========================================= */

function saveProgress() {
    const progress = {
        currentWorld,
        score,
        lives,
        quizCompleted,
        playerX: player.x,
        playerY: player.y
    };

    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch (error) {
        console.warn("Progress could not be saved:", error);
    }
}

function loadProgress() {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (!saved) return false;

    try {
        const data = JSON.parse(saved);

        currentWorld = data.currentWorld === "us" ? "us" : "egypt";

        score = Number.isFinite(Number(data.score))
            ? Math.max(0, Number(data.score)) : 0;

        lives = Number.isFinite(Number(data.lives))
            ? Math.max(0, Math.min(3, Number(data.lives))) : 3;

        quizCompleted = Boolean(data.quizCompleted);

        const x = Number(data.playerX);
        const y = Number(data.playerY);

        player.x = Number.isInteger(x) && x >= 0 && x < COLS ? x : 3;
        player.y = Number.isInteger(y) && y >= 0 && y < ROWS ? y : 9;

        if (isBlocked(player.x, player.y) ||
            (player.x === npc.x && player.y === npc.y)) {
            player = { x: 3, y: 9 };
        }

        updateHUD();
        return true;
    } catch (error) {
        console.warn("Saved progress could not be loaded:", error);
        return false;
    }
}

/* =========================================
   RESET PROGRESS
========================================= */

document.getElementById("reset-progress-btn").addEventListener("click", () => {
    const confirmed = window.confirm(
        "Are you sure you want to reset your saved game progress?"
    );

    if (!confirmed) return;

    localStorage.removeItem(STORAGE_KEY);

    currentWorld = "egypt";
    score = 0;
    lives = 3;
    quizCompleted = false;
    player = { x: 3, y: 9 };

    updateHUD();
    playSound("click");

    window.alert("Your game progress has been reset.");
});

/* =========================================
   SOUND EFFECTS
========================================= */

function playSound(type) {
    if (!soundEnabled) return;

    try {
        const AudioContextClass =
            window.AudioContext || window.webkitAudioContext;

        if (!AudioContextClass) return;

        if (!audioContext) {
            audioContext = new AudioContextClass();
        }

        if (audioContext.state === "suspended") {
            audioContext.resume();
        }

        const sounds = {
            click: [440, 0.07],
            move: [260, 0.045],
            dialogue: [520, 0.12],
            correct: [740, 0.18],
            wrong: [180, 0.2],
            complete: [880, 0.3]
        };

        const [frequency, duration] = sounds[type] || sounds.click;

        const oscillator = audioContext.createOscillator();
        const gain = audioContext.createGain();

        oscillator.type = "square";
        oscillator.frequency.value = frequency;

        gain.gain.setValueAtTime(0.04, audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(
            0.001,
            audioContext.currentTime + duration
        );

        oscillator.connect(gain);
        gain.connect(audioContext.destination);

        oscillator.start();
        oscillator.stop(audioContext.currentTime + duration);
    } catch (error) {
        console.warn("Sound could not be played:", error);
    }
}

document.getElementById("sound-toggle").addEventListener("change", event => {
    soundEnabled = event.target.checked;

    if (soundEnabled) playSound("click");
});

/* =========================================
   INITIALIZATION
========================================= */

drawMenuScene();
updateHUD();
showScreen("main-menu");
