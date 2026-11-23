
"use strict";

document.addEventListener("DOMContentLoaded", () => {

    // =====================================
    // GAME CONFIGURATION
    // =====================================

    const canvas = document.getElementById("game-canvas");
    const ctx = canvas.getContext("2d");

    const TILE = 40;
    const WORLD_COLS = 20;
    const WORLD_ROWS = 12;

    const screens = {
        welcome: document.getElementById("welcome-screen"),
        selection: document.getElementById("world-selection-screen"),
        game: document.getElementById("game-screen"),
        settings: document.getElementById("settings-screen")
    };

    const gameState = {
        selectedWorld: null,
        score: 0,
        lives: 3,
        soundEnabled: true,
        quizCompleted: false,
        gameStarted: false,
        keys: {}
    };

    const player = {
        x: 2,
        y: 5,
        color: "#e8a34a",
        moving: false
    };

    // =====================================
    // WORLD MAP
    // 0 = Grass, 1 = Water, 2 = Tree,
    // 3 = Path, 4 = Building
    // =====================================

    const map = [
        [2,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,2],
        [2,0,0,0,0,0,3,3,3,3,0,0,0,0,0,0,0,0,0,2],
        [0,0,0,0,0,0,3,4,4,3,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,3,4,4,3,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,3,3,3,3,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2],
        [2,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,2,2,2]
    ];

    // =====================================
    // HISTORICAL CHARACTERS
    // =====================================

    const npc = {
        x: 11,
        y: 5,
        name: "HISTORICAL GUIDE"
    };

    // =====================================
    // QUESTIONS
    // =====================================

    const questions = {
        "US History": {
            question: "What document declared the American colonies independent from Great Britain in 1776?",
            options: [
                "The Constitution",
                "The Declaration of Independence",
                "The Bill of Rights",
                "The Emancipation Proclamation"
            ],
            answer: 1,
            explanation: "The Declaration of Independence was adopted on July 4, 1776. It announced that the thirteen colonies considered themselves independent from Great Britain."
        },

        "World History": {
            question: "Which ancient civilization developed along the Nile River?",
            options: [
                "Ancient Egypt",
                "Ancient Greece",
                "The Roman Empire",
                "Mesopotamia"
            ],
            answer: 0,
            explanation: "Ancient Egypt developed along the Nile River. Its water and fertile soil supported agriculture and the growth of Egyptian civilization."
        }
    };

    // =====================================
    // SCREEN NAVIGATION
    // =====================================

    function showScreen(screen) {
        Object.values(screens).forEach(item => {
            item.classList.remove("active");
        });

        screen.classList.add("active");
        window.scrollTo(0, 0);
    }

    // =====================================
    // SAVE AND LOAD
    // =====================================

    function saveProgress() {
        const progress = {
            selectedWorld: gameState.selectedWorld,
            score: gameState.score,
            lives: gameState.lives,
            quizCompleted: gameState.quizCompleted,
            playerX: player.x,
            playerY: player.y
        };

        localStorage.setItem(
            "historyQuestProgress",
            JSON.stringify(progress)
        );
    }

    function loadProgress() {
        const saved = localStorage.getItem("historyQuestProgress");

        if (!saved) return false;

        try {
            const progress = JSON.parse(saved);

            if (!questions[progress.selectedWorld]) return false;

            gameState.selectedWorld = progress.selectedWorld;
            gameState.score = Number(progress.score) || 0;
            gameState.lives = Math.max(0, Math.min(3, Number(progress.lives) || 0));
            gameState.quizCompleted = Boolean(progress.quizCompleted);

            player.x = Math.max(0, Math.min(WORLD_COLS - 1, Number(progress.playerX) || 2));
            player.y = Math.max(0, Math.min(WORLD_ROWS - 1, Number(progress.playerY) || 5));

            startGame();
            return true;

        } catch (error) {
            console.error("Save file could not be loaded:", error);
            return false;
        }
    }

    // =====================================
    // NEW GAME
    // =====================================

    document.getElementById("new-game-btn").addEventListener("click", () => {
        localStorage.removeItem("historyQuestProgress");

        gameState.score = 0;
        gameState.lives = 3;
        gameState.quizCompleted = false;
        gameState.selectedWorld = null;

        showScreen(screens.selection);
    });

    // =====================================
    // CONTINUE
    // =====================================

    document.getElementById("continue-btn").addEventListener("click", () => {
        if (!loadProgress()) {
            alert("No saved adventure found. Start a new game!");
        }
    });

    // =====================================
    // SETTINGS
    // =====================================

    document.getElementById("settings-btn").addEventListener("click", () => {
        showScreen(screens.settings);
    });

    document.getElementById("back-settings-btn").addEventListener("click", () => {
        showScreen(screens.welcome);
    });

    document.getElementById("sound-toggle-btn").addEventListener("click", (event) => {
        gameState.soundEnabled = !gameState.soundEnabled;
        event.target.textContent = gameState.soundEnabled ? "SOUND: ON" : "SOUND: OFF";
    });

    // =====================================
    // WORLD SELECTION
    // =====================================

    document.getElementById("us-history-btn").addEventListener("click", () => {
        selectWorld("US History");
    });

    document.getElementById("world-history-btn").addEventListener("click", () => {
        selectWorld("World History");
    });

    function selectWorld(world) {
        gameState.selectedWorld = world;
        gameState.score = 0;
        gameState.lives = 3;
        gameState.quizCompleted = false;

        player.x = 2;
        player.y = 5;

        startGame();
    }

    // =====================================
    // START GAME
    // =====================================

    function startGame() {
        gameState.gameStarted = true;

        document.getElementById("selected-world-title").textContent =
            gameState.selectedWorld.toUpperCase();

        document.getElementById("location-name").textContent =
            "THE HISTORICAL VILLAGE";

        document.getElementById("game-message").textContent =
            "Find the historical guide and press SPACE to interact!";

        updateHUD();
        showScreen(screens.game);
        drawWorld();
        saveProgress();
    }

    // =====================================
    // DRAW WORLD
    // =====================================

    function drawWorld() {

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        for (let y = 0; y < WORLD_ROWS; y++) {
            for (let x = 0; x < WORLD_COLS; x++) {

                const tile = map[y][x];
                const px = x * TILE;
                const py = y * TILE;

                if (tile === 0) {
                    ctx.fillStyle = "#72ae62";
                } else if (tile === 1) {
                    ctx.fillStyle = "#4a9bc0";
                } else if (tile === 2) {
                    ctx.fillStyle = "#477c43";
                } else if (tile === 3) {
                    ctx.fillStyle = "#c7a36c";
                } else if (tile === 4) {
                    ctx.fillStyle = "#b47b49";
                }

                ctx.fillRect(px, py, TILE, TILE);

                if (tile === 0) {
                    ctx.fillStyle = "#8bc879";
                    ctx.fillRect(px + 8, py + 10, 4, 4);
                    ctx.fillRect(px + 28, py + 28, 3, 3);
                }

                if (tile === 2) {
                    ctx.fillStyle = "#285b38";
                    ctx.fillRect(px + 5, py + 5, 30, 25);
                    ctx.fillStyle = "#76502e";
                    ctx.fillRect(px + 16, py + 25, 9, 15);
                }

                if (tile === 4) {
                    ctx.fillStyle = "#75462f";
                    ctx.fillRect(px + 5, py + 5, 30, 30);
                    ctx.fillStyle = "#e6bc75";
                    ctx.fillRect(px + 12, py + 12, 7, 9);
                    ctx.fillRect(px + 24, py + 12, 7, 9);
                }
            }
        }

        // Historical guide
        drawCharacter(npc.x, npc.y, "#4c7bd9");

        // Player
        drawCharacter(player.x, player.y, player.color);
    }

    // =====================================
    // DRAW PIXEL CHARACTER
    // =====================================

    function drawCharacter(x, y, color) {

        const px = x * TILE;
        const py = y * TILE;

        // Shadow
        ctx.fillStyle = "rgba(0,0,0,0.2)";
        ctx.fillRect(px + 8, py + 33, 25, 5);

        // Head
        ctx.fillStyle = "#e9b88d";
        ctx.fillRect(px + 12, py + 5, 17, 15);

        // Hair
        ctx.fillStyle = "#493125";
        ctx.fillRect(px + 11, py + 4, 19, 6);

        // Body
        ctx.fillStyle = color;
        ctx.fillRect(px + 9, py + 20, 24, 14);

        // Legs
        ctx.fillStyle = "#343d54";
        ctx.fillRect(px + 11, py + 33, 7, 7);
        ctx.fillRect(px + 24, py + 33, 7, 7);
    }

    // =====================================
    // PLAYER MOVEMENT
    // =====================================

    function isBlocked(x, y) {

        if (
            x < 0 || x >= WORLD_COLS ||
            y < 0 || y >= WORLD_ROWS
        ) return true;

        return [1, 2, 4].includes(map[y][x]);
    }

    function movePlayer(dx, dy) {

        if (!gameState.gameStarted) return;
        if (!screens.game.classList.contains("active")) return;
        if (!document.getElementById("dialogue-box").classList.contains("hidden")) return;
        if (!document.getElementById("quiz-box").classList.contains("hidden")) return;

        const nextX = player.x + dx;
        const nextY = player.y + dy;

        if (isBlocked(nextX, nextY)) return;

        player.x = nextX;
        player.y = nextY;

        drawWorld();
        saveProgress();
        checkNPCProximity();
    }

    document.addEventListener("keydown", (event) => {

        const key = event.key.toLowerCase();

        if (
            ["arrowup", "arrowdown", "arrowleft", "arrowright", " "]
            .includes(key)
        ) {
            event.preventDefault();
        }

        if (event.repeat) return;

        if (key === "w" || key === "arrowup") movePlayer(0, -1);
        if (key === "s" || key === "arrowdown") movePlayer(0, 1);
        if (key === "a" || key === "arrowleft") movePlayer(-1, 0);
        if (key === "d" || key === "arrowright") movePlayer(1, 0);

        if (key === " ") interactWithNPC();
    });

    // =====================================
    // NPC INTERACTION
    // =====================================

    function checkNPCProximity() {

        const distance =
            Math.abs(player.x - npc.x) +
            Math.abs(player.y - npc.y);

        if (distance <= 1) {
            document.getElementById("game-message").textContent =
                "Press SPACE or INTERACT to speak with the historical guide!";
        } else {
            document.getElementById("game-message").textContent =
                "Explore the area and find the historical guide!";
        }
    }

    function interactWithNPC() {

        const distance =
            Math.abs(player.x - npc.x) +
            Math.abs(player.y - npc.y);

        if (distance > 1) {
            document.getElementById("game-message").textContent =
                "You are too far away. Move closer to the historical guide!";
            return;
        }

        if (gameState.quizCompleted) {
            showDialogue(
                "HISTORICAL GUIDE",
                "Excellent work, explorer! You have already completed this historical challenge. Keep exploring!"
            );
            return;
        }

        showDialogue(
            "HISTORICAL GUIDE",
            "Welcome, explorer! History is full of important events and decisions. I have a challenge that will test your knowledge. Are you ready?"
        );

        document.getElementById("dialogue-close-btn").textContent =
            "START CHALLENGE";

        document.getElementById("dialogue-close-btn").onclick = () => {
            closeDialogue();
            startQuiz();
        };
    }

    document.getElementById("interact-btn").addEventListener("click", interactWithNPC);

    // =====================================
    // DIALOGUE
    // =====================================

    function showDialogue(title, message) {

        document.getElementById("dialogue-title").textContent = title;
        document.getElementById("dialogue-text").textContent = message;

        document.getElementById("dialogue-box").classList.remove("hidden");
    }

    function closeDialogue() {
        document.getElementById("dialogue-box").classList.add("hidden");

        document.getElementById("dialogue-close-btn").textContent = "CONTINUE";
        document.getElementById("dialogue-close-btn").onclick = closeDialogue;
    }

    document.getElementById("dialogue-close-btn").addEventListener("click", closeDialogue);

    // =====================================
    // HISTORICAL QUIZ
    // =====================================

    function startQuiz() {

        const data = questions[gameState.selectedWorld];

        document.getElementById("quiz-title").textContent =
            gameState.selectedWorld.toUpperCase() + " CHALLENGE";

        document.getElementById("quiz-question").textContent = data.question;

        document.getElementById("quiz-feedback").textContent = "";
        document.getElementById("quiz-close-btn").classList.add("hidden");

        const optionsContainer = document.getElementById("quiz-options");
        optionsContainer.innerHTML = "";

        data.options.forEach((option, index) => {

            const button = document.createElement("button");

            button.className = "quiz-option";
            button.textContent = `${String.fromCharCode(65 + index)}. ${option}`;

            button.addEventListener("click", () => checkAnswer(index));

            optionsContainer.appendChild(button);
        });

        document.getElementById("quiz-box").classList.remove("hidden");
    }

    function checkAnswer(selectedIndex) {

        const data = questions[gameState.selectedWorld];
        const buttons = document.querySelectorAll(".quiz-option");
        const feedback = document.getElementById("quiz-feedback");

        buttons.forEach(button => button.disabled = true);

        if (selectedIndex === data.answer) {

            gameState.score += 100;
            gameState.quizCompleted = true;

            feedback.textContent =
                "CORRECT! +100 POINTS. " + data.explanation;

            feedback.className = "feedback-correct";

        } else {

            gameState.lives = Math.max(0, gameState.lives - 1);

            feedback.textContent =
                "NOT QUITE! The correct answer is " +
                data.options[data.answer] + ". " + data.explanation;

            feedback.className = "feedback-wrong";
        }

        buttons[data.answer].style.borderColor = "#65d89b";

        updateHUD();
        saveProgress();

        document.getElementById("quiz-close-btn").classList.remove("hidden");

        document.getElementById("quiz-close-btn").textContent =
            "CONTINUE";
    }

    document.getElementById("quiz-close-btn").addEventListener("click", () => {

        document.getElementById("quiz-box").classList.add("hidden");

        if (gameState.quizCompleted) {
            document.getElementById("game-message").textContent =
                "MISSION COMPLETED! You earned 100 points!";
        } else {
            document.getElementById("game-message").textContent =
                "Keep learning! Explore and try again.";
        }

        saveProgress();
    });

    // =====================================
    // HUD
    // =====================================

    function updateHUD() {

        document.getElementById("score-display").textContent =
            "⭐ " + gameState.score;

        document.getElementById("lives-display").textContent =
            "❤️ ".repeat(gameState.lives) || "NO LIVES";
    }

    // =====================================
    // EXIT GAME
    // =====================================

    document.getElementById("game-back-btn").addEventListener("click", () => {
        saveProgress();
        showScreen(screens.welcome);
    });

    document.getElementById("back-menu-btn").addEventListener("click", () => {
        showScreen(screens.welcome);
    });

    // =====================================
    // INITIALIZATION
    // =====================================

    drawWorld();
    updateHUD();

    console.log("HISTORY QUEST - Game engine initialized!");

});
