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
let explodingTiles = []; // Track tiles for explosion animation

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
    for (let i = 0; i < gridSize; i++) {
        grid[i] = [];
        for (let j = 0; j < gridSize; j++) {
            grid[i][j] = {
                color: colors[Math.floor(Math.random() * colors.length)],
                hasBomb: Math.random() < 0.1
            };
        }
    }
    removeMatches();
}

// Draw the grid
function drawGrid() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < gridSize; i++) {
        for (let j = 0; j < gridSize; j++) {
            ctx.fillStyle = grid[i][j].color || 'gray'; // Gray for empty tiles during animation
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
        const size = tileSize * (1 + tile.opacity); // Grow effect
        ctx.fillStyle = `rgba(255, 255, 0, ${tile.opacity})`; // Bright yellow
        ctx.fillRect(
            tile.x * tileSize - (size - tileSize) / 2,
            tile.y * tileSize - (size - tileSize) / 2,
            size - 2,
            size - 2
        );
        tile.opacity -= 0.02; // Slower fade for more visibility
        if (tile.opacity <= 0) explodingTiles.splice(i, 1);
    }
}

// Check if a match includes a bomb
function hasBombInMatch() {
    for (let y = 0; y < gridSize; y++) {
        for (let x = 0; x < gridSize - 2; x++) {
            if (
                grid[x][y].color === grid[x + 1][y].color &&
                grid[x][y].color === grid[x + 2][y].color &&
                (grid[x][y].hasBomb || grid[x + 1][y].hasBomb || grid[x + 2][y].hasBomb)
            ) {
                return true;
            }
        }
    }
    for (let x = 0; x < gridSize; x++) {
        for (let y = 0; y < gridSize - 2; y++) {
            if (
                grid[x][y].color === grid[x][y + 1].color &&
                grid[x][y].color === grid[x][y + 2].color &&
                (grid[x][y].hasBomb || grid[x][y + 1].hasBomb || grid[x][y + 2].hasBomb)
            ) {
                return true;
            }
        }
    }
    return false;
}

// Handle clicks on canvas
canvas.addEventListener('click', (event) => {
    if (!gameStarted) return;

    if (lightState !== 'green') return;

    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((event.clientX - rect.left) / tileSize);
    const y = Math.floor((event.clientY - rect.top) / tileSize);

    if (!selectedTile) {
        selectedTile = { x, y };
    } else {
        if (isAdjacent(selectedTile, { x, y })) {
            swapTiles(selectedTile.x, selectedTile.y, x, y);
            if (!checkMatches()) {
                setTimeout(() => swapTiles(selectedTile.x, selectedTile.y, x, y), 300);
            } else {
                score += 10;
                if (hasBombInMatch()) {
                    bomb
