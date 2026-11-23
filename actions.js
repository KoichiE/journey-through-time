
"use strict";

// =====================================
// HISTORY QUEST - GAME ENGINE
// =====================================

document.addEventListener("DOMContentLoaded", () => {

    // GAME CONFIGURATION

    const gameConfig = {
        title: "HISTORY QUEST",
        version: "1.0.0",
        playerLives: 3,
        playerScore: 0
    };

    // SCREEN REFERENCES

    const screens = {
        welcome: document.getElementById("welcome-screen"),
        worldSelection: document.getElementById("world-selection-screen"),
        game: document.getElementById("game-screen"),
        settings: document.getElementById("settings-screen")
    };

    // GAME STATE

    let soundEnabled = true;
    let selectedWorld = null;

    // NAVIGATION FUNCTION

    function showScreen(screen) {

        Object.values(screens).forEach(item => {
            item.classList.remove("active");
        });

        screen.classList.add("active");

        window.scrollTo(0, 0);
    }

    // =====================================
    // NEW GAME
    // =====================================

    document.getElementById("new-game-btn").addEventListener("click", () => {

        localStorage.removeItem("historyQuestProgress");

        selectedWorld = null;

        showScreen(screens.worldSelection);

    });

    // =====================================
    // CONTINUE GAME
    // =====================================

    document.getElementById("continue-btn").addEventListener("click", () => {

        const savedProgress = localStorage.getItem("historyQuestProgress");

        if (!savedProgress) {
            alert("No saved game found. Start a new adventure!");
            return;
        }

        try {

            const progress = JSON.parse(savedProgress);

            selectedWorld = progress.selectedWorld || null;

            if (!selectedWorld) {
                alert("Your saved game is incomplete. Start a new adventure.");
                return;
            }

            document.getElementById("selected-world-title").textContent =
                selectedWorld.toUpperCase();

            document.getElementById("selected-world-description").textContent =
                "Welcome back to your historical adventure!";

            showScreen(screens.game);

        } catch (error) {

            console.error("Could not load saved game:", error);
            alert("There was a problem loading your saved game.");

        }

    });

    // =====================================
    // SETTINGS
    // =====================================

    document.getElementById("settings-btn").addEventListener("click", () => {
        showScreen(screens.settings);
    });

    // =====================================
    // WORLD SELECTION
    // =====================================

    function selectWorld(world) {

        selectedWorld = world;

        document.getElementById("selected-world-title").textContent =
            world.toUpperCase();

        document.getElementById("selected-world-description").textContent =
            "Your journey through " + world + " begins here!";

        const progress = {
            selectedWorld: world,
            score: gameConfig.playerScore,
            lives: gameConfig.playerLives
        };

        localStorage.setItem(
            "historyQuestProgress",
            JSON.stringify(progress)
        );

        showScreen(screens.game);

    }

    document.getElementById("us-history-btn").addEventListener("click", () => {
        selectWorld("US History");
    });

    document.getElementById("world-history-btn").addEventListener("click", () => {
        selectWorld("World History");
    });

    // =====================================
    // BACK BUTTONS
    // =====================================

    document.getElementById("back-menu-btn").addEventListener("click", () => {
        showScreen(screens.welcome);
    });

    document.getElementById("game-back-btn").addEventListener("click", () => {
        showScreen(screens.welcome);
    });

    document.getElementById("back-settings-btn").addEventListener("click", () => {
        showScreen(screens.welcome);
    });

    // =====================================
    // SOUND SETTINGS
    // =====================================

    const soundButton = document.getElementById("sound-toggle-btn");

    soundButton.addEventListener("click", () => {

        soundEnabled = !soundEnabled;

        soundButton.textContent = soundEnabled
            ? "SOUND: ON"
            : "SOUND: OFF";

    });

    // INITIALIZATION

    console.log("HISTORY QUEST initialized successfully!");

});
