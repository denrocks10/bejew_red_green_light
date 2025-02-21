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
let gameStarted = false; // Track if game has started

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

// Initialize grid
function initGrid() {
    for (let i = 0; i < gridSize; i++) {
        grid[i] = [];
        for (let j = 0; j < gridSize; j++) {
            grid[i][j] = colors[Math.floor(Math.random() * colors.length)];
        }
    }
    removeMatches();
}

// Draw the grid
function drawGrid() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < gridSize; i++) {
        for (let j = 0; j < gridSize; j++) {
            ctx.fillStyle = grid[i][j];
            ctx.fillRect(i * tileSize, j * tileSize, tileSize - 2, tileSize - 2);
            if (selectedTile && selectedTile.x === i && selectedTile.y === j) {
                ctx.strokeStyle = 'white';
                ctx.lineWidth = 4;
                ctx.strokeRect(i * tileSize, j * tileSize, tileSize - 2, tileSize - 2);
            }
        }
    }
}

// Handle clicks on canvas
canvas.addEventListener('click', (event) => {
    if (!gameStarted) return; // Ignore clicks until game starts

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
                scoreDisplay.textContent = score;
                matchSound.play();
                removeMatches();
            }
        }
        selectedTile = null;
    }
    drawGrid();
});

// Check if tiles are adjacent
function isAdjacent(tile1, tile2) {
    const dx = Math.abs(tile1.x - tile2.x);
    const dy = Math.abs(tile1.y - tile2.y);
    return (dx === 1 && dy === 0) || (dx === 0 && dy === 1);
}

// Swap two tiles
function swapTiles(x1, y1, x2, y2) {
    [grid[x1][y1], grid[x2][y2]] = [grid[x2][y2], grid[x1][y1]];
}

// Check for matches
function checkMatches() {
    let hasMatches = false;
    for (let y = 0; y < gridSize; y++) {
        for (let x = 0; x < gridSize - 2; x++) {
            if (grid[x][y] === grid[x + 1][y] && grid[x][y] === grid[x + 2][y]) {
                hasMatches = true;
            }
        }
    }
    for (let x = 0; x < gridSize; x++) {
        for (let y = 0; y < gridSize - 2; y++) {
            if (grid[x][y] === grid[x][y + 1] && grid[x][y] === grid[x][y + 2]) {
                hasMatches = true;
            }
        }
    }
    return hasMatches;
}

// Remove matches and fill gaps
function removeMatches() {
    let changed = false;
    for (let y = 0; y < gridSize; y++) {
        for (let x = 0; x < gridSize - 2; x++) {
            if (grid[x][y] === grid[x + 1][y] && grid[x][y] === grid[x + 2][y]) {
                grid[x][y] = grid[x + 1][y] = grid[x + 2][y] = null;
                changed = true;
            }
        }
    }
    for (let x = 0; x < gridSize; x++) {
        for (let y = 0; y < gridSize - 2; y++) {
            if (grid[x][y] === grid[x][y + 1] && grid[x][y] === grid[x][y + 2]) {
                grid[x][y] = grid[x][y + 1] = grid[x][y + 2] = null;
                changed = true;
            }
        }
    }
    for (let x = 0; x < gridSize; x++) {
        for (let y = gridSize - 1; y >= 0; y--) {
            if (grid[x][y] === null) {
                for (let k = y - 1; k >= 0; k--) {
                    if (grid[x][k] !== null) {
                        grid[x][y] = grid[x][k];
                        grid[x][k] = null;
                        break;
                    }
                }
                if (grid[x][y] === null) {
                    grid[x][y] = colors[Math.floor(Math.random() * colors.length)];
                }
            }
        }
    }
    if (changed) removeMatches();
}

// Game loop
function update() {
    if (!gameStarted) return; // Don’t update until game starts

    lightTimer += 1 / 60;
    if (lightTimer >= 5) {
        const oldState = lightState;
        lightState = lightState === 'green' ? 'red' : 'green';
        lightDisplay.textContent = lightState;
        lightDisplay.style.color = lightState;
        if (oldState !== lightState) {
            if (lightState === 'green') greenLightSound.play();
            else redLightSound.play();
        }
        lightTimer = 0;
    }

    gameTime -= 1 / 60;
    timerDisplay.textContent = Math.ceil(gameTime);
    if (gameTime <= 0) {
        alert(`Game Over! Score: ${score}`);
        gameTime = 60;
        score = 0;
        scoreDisplay.textContent = score;
        initGrid();
        gameStarted = false; // Reset to start screen
        startScreen.style.display = 'flex'; // Show start screen again
    }

    drawGrid();
    requestAnimationFrame(update);
}

// Start game on button click
startButton.addEventListener('click', () => {
    gameStarted = true;
    startScreen.style.display = 'none'; // Hide start screen
    update(); // Start the game loop
});

// Initialize the game but don’t start it
initGrid();
drawGrid(); // Draw initial grid as a preview