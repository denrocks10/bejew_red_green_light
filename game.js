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
        ctx.fillStyle = `rgba(255, 255, 0, ${tile.opacity})`; // Yellow flash
        ctx.fillRect(
            tile.x * tileSize,
            tile.y * tileSize,
            tileSize - 2,
            tileSize - 2
        );
        tile.opacity -= 0.05; // Fade out
        if (tile.opacity <= 0) explodingTiles.splice(i, 1); // Remove when faded
    }
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
                matchSound.play(); // Play match sound first
                setTimeout(() => {
                    handleBombs(); // Handle bombs after delay
                }, 300); // Delay bomb processing to separate sounds
                scoreDisplay.textContent = score;
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
            if (
                grid[x][y].color === grid[x + 1][y].color &&
                grid[x][y].color === grid[x + 2][y].color
            ) {
                hasMatches = true;
            }
        }
    }
    for (let x = 0; x < gridSize; x++) {
        for (let y = 0; y < gridSize - 2; y++) {
            if (
                grid[x][y].color === grid[x][y + 1].color &&
                grid[x][y].color === grid[x][y + 2].color
            ) {
                hasMatches = true;
            }
        }
    }
    return hasMatches;
}

// Handle bomb explosions
function handleBombs() {
    for (let y = 0; y < gridSize; y++) {
        for (let x = 0; x < gridSize; x++) {
            if (grid[x][y].hasBomb && grid[x][y].color === null) {
                explodeBomb(x, y);
            }
        }
    }
}

// Explode bomb and clear surrounding tiles
function explodeBomb(x, y) {
    bombSound.play(); // Play bomb sound (delayed by setTimeout)
    const directions = [
        [-1, -1], [-1, 0], [-1, 1],
        [0, -1],           [0, 1],
        [1, -1],  [1, 0],  [1, 1]
    ];
    for (const [dx, dy] of directions) {
        const newX = x + dx;
        const newY = y + dy;
        if (newX >= 0 && newX < gridSize && newY >= 0 && newY < gridSize) {
            explodingTiles.push({ x: newX, y: newY, opacity: 1 }); // Add to explosion animation
            grid[newX][newY] = { color: null, hasBomb: false };
            score += 5;
        }
    }
    explodingTiles.push({ x, y, opacity: 1 }); // Include bomb tile in animation
    score += 20;
}

// Remove matches and fill gaps
function removeMatches() {
    let changed = false;
    for (let y = 0; y < gridSize; y++) {
        for (let x = 0; x < gridSize - 2; x++) {
            if (
                grid[x][y].color === grid[x + 1][y].color &&
                grid[x][y].color === grid[x + 2][y].color
            ) {
                explodingTiles.push({ x: x, y: y, opacity: 0.7 }); // Subtle fade for regular matches
                explodingTiles.push({ x: x + 1, y: y, opacity: 0.7 });
                explodingTiles.push({ x: x + 2, y: y, opacity: 0.7 });
                grid[x][y].color = null;
                grid[x + 1][y].color = null;
                grid[x + 2][y].color = null;
                changed = true;
            }
        }
    }
    for (let x = 0; x < gridSize; x++) {
        for (let y = 0; y < gridSize - 2; y++) {
            if (
                grid[x][y].color === grid[x][y + 1].color &&
                grid[x][y].color === grid[x][y + 2].color
            ) {
                explodingTiles.push({ x: x, y: y, opacity: 0.7 });
                explodingTiles.push({ x: x, y: y + 1, opacity: 0.7 });
                explodingTiles.push({ x: x, y: y + 2, opacity: 0.7 });
                grid[x][y].color = null;
                grid[x][y + 1].color = null;
                grid[x][y + 2].color = null;
                changed = true;
            }
        }
    }
    for (let x = 0; x < gridSize; x++) {
        for (let y = gridSize - 1; y >= 0; y--) {
            if (grid[x][y].color === null) {
                for (let k = y - 1; k >= 0; k--) {
                    if (grid[x][k].color !== null) {
                        grid[x][y] = { color: grid[x][k].color, hasBomb: grid[x][k].hasBomb };
                        grid[x][k] = { color: null, hasBomb: false };
                        break;
                    }
                }
                if (grid[x][y].color === null) {
                    grid[x][y] = {
                        color: colors[Math.floor(Math.random() * colors.length)],
                        hasBomb: Math.random() < 0.1
                    };
                }
            }
        }
    }
    if (changed) {
        handleBombs();
        removeMatches();
    }
}

// Game loop
function update() {
    if (!gameStarted) return;

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
        gameStarted = false;
        startScreen.style.display = 'flex';
    }

    drawGrid();
    requestAnimationFrame(update);
}

// Start game on button click
startButton.addEventListener('click', () => {
    gameStarted = true;
    startScreen.style.display = 'none';
    update();
});

// Initialize the game but don’t start it
initGrid();
drawGrid();
