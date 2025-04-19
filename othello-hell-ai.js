const canvas = document.getElementById('board');
const ctx = canvas.getContext('2d');
const size = 8;
const tileSize = canvas.width / size;

let board = [];
let currentPlayer = 1;
let aiPlayer = -1;

function startGame(first) {
  document.getElementById('start-screen').style.display = 'none';
  document.getElementById('game-screen').style.display = 'block';
  aiPlayer = first === 'ai' ? 1 : -1;
  currentPlayer = 1;
  initBoard();
  drawBoard();
  updateScores();
  if (aiPlayer === currentPlayer) setTimeout(aiMove, 500);
}

function initBoard() {
  board = Array(size).fill().map(() => Array(size).fill(0));
  board[3][3] = -1;
  board[4][4] = -1;
  board[3][4] = 1;
  board[4][3] = 1;
}

function drawBoard() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      ctx.strokeStyle = "#000";
      ctx.strokeRect(x * tileSize, y * tileSize, tileSize, tileSize);
      if (board[y][x] !== 0) {
        ctx.beginPath();
        ctx.arc(x * tileSize + tileSize / 2, y * tileSize + tileSize / 2, tileSize / 2.5, 0, Math.PI * 2);
        ctx.fillStyle = board[y][x] === 1 ? "black" : "white";
        ctx.fill();
      }
    }
  }
}

canvas.addEventListener("click", (e) => {
  if (currentPlayer !== aiPlayer) {
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / tileSize);
    const y = Math.floor((e.clientY - rect.top) / tileSize);
    if (isValidMove(board, x, y, currentPlayer)) {
      makeMove(board, x, y, currentPlayer);
      endTurn();
    }
  }
});

function isValidMove(bd, x, y, player) {
  if (bd[y][x] !== 0) return false;
  const directions = [
    [0, 1],[1, 0],[0, -1],[-1, 0],
    [1, 1],[-1, -1],[1, -1],[-1, 1]
  ];
  for (let [dx, dy] of directions) {
    let nx = x + dx, ny = y + dy, count = 0;
    while (nx >= 0 && nx < size && ny >= 0 && ny < size && bd[ny][nx] === -player) {
      nx += dx;
      ny += dy;
      count++;
    }
    if (count && nx >= 0 && nx < size && ny >= 0 && ny < size && bd[ny][nx] === player) {
      return true;
    }
  }
  return false;
}

function getValidMoves(bd, player) {
  let moves = [];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (isValidMove(bd, x, y, player)) moves.push([x, y]);
    }
  }
  return moves;
}

function makeMove(bd, x, y, player) {
  const directions = [
    [0, 1],[1, 0],[0, -1],[-1, 0],
    [1, 1],[-1, -1],[1, -1],[-1, 1]
  ];
  bd[y][x] = player;
  for (let [dx, dy] of directions) {
    let nx = x + dx, ny = y + dy, toFlip = [];
    while (nx >= 0 && nx < size && ny >= 0 && ny < size && bd[ny][nx] === -player) {
      toFlip.push([nx, ny]);
      nx += dx;
      ny += dy;
    }
    if (toFlip.length && nx >= 0 && nx < size && ny >= 0 && ny < size && bd[ny][nx] === player) {
      for (let [fx, fy] of toFlip) bd[fy][fx] = player;
    }
  }
}

function endTurn() {
  currentPlayer *= -1;
  drawBoard();
  updateScores();
  if (getValidMoves(board, currentPlayer).length === 0) {
    currentPlayer *= -1;
    if (getValidMoves(board, currentPlayer).length === 0) {
      document.getElementById("status").innerText = "遊戲結束！" + getWinner();
      return;
    }
  }
  if (currentPlayer === aiPlayer) setTimeout(aiMove, 500);
}

function updateScores() {
  let player = 0, ai = 0;
  for (let row of board) {
    for (let cell of row) {
      if (cell === aiPlayer) ai++;
      else if (cell === -aiPlayer) player++;
    }
  }
  document.getElementById("player-score").innerText = player;
  document.getElementById("ai-score").innerText = ai;
}

function getWinner() {
  let p = 0, a = 0;
  for (let row of board) {
    for (let cell of row) {
      if (cell === aiPlayer) a++;
      else if (cell === -aiPlayer) p++;
    }
  }
  if (a > p) return "AI 獲勝！";
  else if (p > a) return "玩家獲勝！";
  else return "平手！";
}

function aiMove() {
  let moves = getValidMoves(board, aiPlayer);
  if (moves.length === 0) {
    endTurn();
    return;
  }
  let bestMove = moves[0], bestScore = -Infinity;
  for (let [x, y] of moves) {
    let temp = board.map(row => row.slice());
    makeMove(temp, x, y, aiPlayer);
    let score = evaluateBoard(temp, aiPlayer);
    if (score > bestScore) {
      bestScore = score;
      bestMove = [x, y];
    }
  }
  makeMove(board, bestMove[0], bestMove[1], aiPlayer);
  endTurn();
}

function evaluateBoard(bd, player) {
  let score = 0;
  const weight = [
    [100, -20, 10, 5, 5, 10, -20, 100],
    [-20, -50, -2, -2, -2, -2, -50, -20],
    [10, -2, -1, -1, -1, -1, -2, 10],
    [5, -2, -1, -1, -1, -1, -2, 5],
    [5, -2, -1, -1, -1, -1, -2, 5],
    [10, -2, -1, -1, -1, -1, -2, 10],
    [-20, -50, -2, -2, -2, -2, -50, -20],
    [100, -20, 10, 5, 5, 10, -20, 100]
  ];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (bd[y][x] === player) score += weight[y][x];
    }
  }
  return score;
}
