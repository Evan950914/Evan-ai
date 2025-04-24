let board = Array(8).fill().map(() => Array(8).fill(0));
let currentPlayer = 1;
let playerColor = 1;
let aiPlayer = -1;
let history = [];
let aiLastMove = null;
let qTable = loadQTable();
let learnData = [];
let selfPlayMode = false;

// 初始盤面
function initBoard() {
  board = Array(8).fill().map(() => Array(8).fill(0));
  board[3][3] = 1; board[3][4] = -1;
  board[4][3] = -1; board[4][4] = 1;
  history = [];
  aiLastMove = null;
  learnData = [];
}

// 儲存 qTable 到 localStorage
function saveQTable() {
  localStorage.setItem("qTable", JSON.stringify(qTable));
}

// 載入 qTable
function loadQTable() {
  const raw = localStorage.getItem("qTable");
  return raw ? JSON.parse(raw) : {};
}

// 清除學習
function resetLearn() {
  qTable = {};
  saveQTable();
  alert("AI 記憶已清除！");
}

// 開始遊戲
function startGame(mode) {
  selfPlayMode = (mode === "selfplay");
  currentPlayer = 1;
  playerColor = 1;
  aiPlayer = -1;
  initBoard();
  drawBoard();
  document.getElementById("start-screen").style.display = "none";
  document.getElementById("game-screen").style.display = "block";
  if (selfPlayMode || currentPlayer === aiPlayer) {
    setTimeout(aiMove, 300);
  }
}
function encodeBoard(b, player) {
  return b.flat().join("") + "_" + player;
}

function getValidMoves(b, player) {
  const moves = [];
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      if (isValidMove(b, x, y, player)) moves.push([x, y]);
    }
  }
  return moves;
}

function isValidMove(b, x, y, player) {
  if (b[y][x] !== 0) return false;
  const dirs = [-1, 0, 1];
  for (let dx of dirs) for (let dy of dirs) {
    if (dx === 0 && dy === 0) continue;
    let nx = x + dx, ny = y + dy, seen = false;
    while (nx >= 0 && ny >= 0 && nx < 8 && ny < 8) {
      if (b[ny][nx] === -player) seen = true;
      else if (b[ny][nx] === player && seen) return true;
      else break;
      nx += dx; ny += dy;
    }
  }
  return false;
}

function makeMove(x, y, player) {
  board[y][x] = player;
  const dirs = [-1, 0, 1];
  for (let dx of dirs) for (let dy of dirs) {
    if (dx === 0 && dy === 0) continue;
    let nx = x + dx, ny = y + dy, flips = [];
    while (nx >= 0 && ny >= 0 && nx < 8 && ny < 8 && board[ny][nx] === -player) {
      flips.push([nx, ny]);
      nx += dx; ny += dy;
    }
    if (nx >= 0 && ny >= 0 && nx < 8 && ny < 8 && board[ny][nx] === player)
      for (const [fx, fy] of flips) board[fy][fx] = player;
  }
  history.push(JSON.parse(JSON.stringify(board)));
}

function undoMove() {
  if (history.length >= 2) {
    history.pop(); board = history.pop();
    currentPlayer = playerColor;
    aiLastMove = null;
    drawBoard();
  }
}

function aiMove() {
  const key = encodeBoard(board, currentPlayer);
  const moves = getValidMoves(board, currentPlayer);
  if (moves.length === 0) {
    currentPlayer *= -1;
    if (selfPlayMode || currentPlayer === aiPlayer) {
      setTimeout(aiMove, 300);
    }
    return;
  }

  let move = null;
  if (qTable[key]) {
    let best = -Infinity;
    for (let m in qTable[key]) {
      if (qTable[key][m] > best) {
        best = qTable[key][m];
        move = m.split(",").map(Number);
      }
    }
  }
  if (!move) {
    move = moves[Math.floor(Math.random() * moves.length)];
  }

  const moveKey = move.join(",");
  if (!qTable[key]) qTable[key] = {};
  if (!qTable[key][moveKey]) qTable[key][moveKey] = 0;
  qTable[key][moveKey] += 1;

  saveQTable();
  makeMove(move[0], move[1], currentPlayer);
  aiLastMove = move;
  currentPlayer *= -1;
  drawBoard();

  if (selfPlayMode || currentPlayer === aiPlayer) {
    setTimeout(aiMove, 300);
  }
}

function drawBoard() {
  const canvas = document.getElementById("board");
  const ctx = canvas.getContext("2d");
  const tileSize = canvas.width / 8;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      ctx.strokeRect(x * tileSize, y * tileSize, tileSize, tileSize);
      if (board[y][x] !== 0) {
        ctx.beginPath();
        ctx.arc(x * tileSize + tileSize / 2, y * tileSize + tileSize / 2, tileSize / 2.5, 0, Math.PI * 2);
        ctx.fillStyle = board[y][x] === 1 ? "black" : "white";
        ctx.fill();
      }
    }
  }

  for (const [x, y] of getValidMoves(board, currentPlayer)) {
    ctx.fillStyle = "rgba(255,255,0,0.6)";
    ctx.beginPath();
    ctx.arc(x * tileSize + tileSize / 2, y * tileSize + tileSize / 2, tileSize / 6, 0, Math.PI * 2);
    ctx.fill();
  }

  if (aiLastMove) {
    const [x, y] = aiLastMove;
    ctx.strokeStyle = "red";
    ctx.lineWidth = 4;
    ctx.strokeRect(x * tileSize + 2, y * tileSize + 2, tileSize - 4, tileSize - 4);
  }

  updateScores();
  checkGameOver();
}

function updateScores() {
  let black = 0, white = 0;
  for (let row of board) {
    for (let cell of row) {
      if (cell === 1) black++;
      else if (cell === -1) white++;
    }
  }
  document.getElementById("player-score").textContent = playerColor === 1 ? black : white;
  document.getElementById("ai-score").textContent = aiPlayer === 1 ? black : white;
}

function checkGameOver() {
  const blackMoves = getValidMoves(board, 1);
  const whiteMoves = getValidMoves(board, -1);
  if (blackMoves.length === 0 && whiteMoves.length === 0) {
    let b = 0, w = 0;
    for (let row of board) {
      for (let cell of row) {
        if (cell === 1) b++; else if (cell === -1) w++;
      }
    }
    const result = b > w ? "黑子獲勝！" : b < w ? "白子獲勝！" : "平手！";
    document.getElementById("status").textContent = "遊戲結束：" + result;
  }
}
