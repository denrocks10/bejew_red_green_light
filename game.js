// Canvas setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const gridSize = 8;
const tileSize = canvas.width / gridSize;
const colors = ['red', 'blue', 'green', 'yellow', 'purple'];

// Game state
let grid = [];
let score = 0;
let selectedTile = null;
let gameTime = 60;
let lightState = 'green';
let lightTimer = 0;
let gameStarted = false;
let explodingTiles = [];

// Display elements
const scoreDisplay = document.getElementById('score');
const timerDisplay = document.getElementById('timer');
const lightDisplay = document.getElementById('light');
const startScreen = document.getElementById('startScreen');
const startButton = document.getElementById('startButton');

// Sound elements
const matchSound = document.getElementById('matchSound');
const greenLightSound = document.getElementById('greenLightSound');
const redLightSound = document.getElementById('redLightSound');
const bombSound = document.getElementById('bombSound');

// Initialize grid with colors and bombs
function initGrid() {
    grid = []; // Ensure grid is reset
    for (let i = 0; i < gridSize; i++) {
        grid[i] = [];
        for (let j = 0; j < gridSize; j++) {
            grid[i][j] = {
                color: colors[Math.floor(Math.random() * colors.length)],
                hasBomb: Math.random() < 0.1
            };
        }
    }
    console.log('Grid initialized:', grid); // Debug log
    removeMatches();
}

// Draw the grid
function drawGrid() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < gridSize; i++) {
        for (let j = 0; j < gridSize; j++) {
            if (!grid[i] || !grid[i][j]) {
                console.error('Grid missing at', i, j); // Debug if grid is broken
                continue;
            }
            ctx.fillStyle = grid[i][j].color || 'gray';
            ctx.fillRect(i * tileSize, j * tileSize, tileSize - 2, tileSize - 2);

            if (grid[i][j].hasBomb) {
                ctx.beginPath();
                ctx.arc(
                    i * tileSize + tileSize / 2,
                    j * tileSize + tileSize / 2,
                    tileSize / 4,
                    0, 2 * Math.PI
                );
                ctx.fillStyle = 'black';
                ctx.fill();
                ctx.closePath();
            }

            if (selectedTile && selectedTile.x === i && selectedTile.y === j) {
                ctx.strokeStyle = 'white';
                ctx.lineWidth = 4;
                ctx.strokeRect(i * tileSize, j * tileSize, tileSize - 2, tileSize - 2);
            }
        }
    }

    // Draw explosion effects
    for (let i = explodingTiles.length - 1; i >= 0; i--) {
        const tile = explodingTiles[i];
        const size = tileSize * (1 + tile.opacity);
        ctx.fillStyle = `rgba(255, 255, 0, ${tile.opacity})`;
        ctx.fillRect(
            tile.x * tileSize - (size - tileSize) / 2,
            tile.y * tileSize - (size - tileSize) / 2,
            size - 2,
            size - 2
        );
        tile.opacity -= 0.02;
        if (tile.opacity <= 0) explodingTiles.splice(i, 1);
    }
}

//
