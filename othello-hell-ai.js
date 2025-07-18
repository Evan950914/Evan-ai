const transpositionTable = new Map();


const canvas = document.getElementById('board');
const ctx = canvas.getContext('2d');
const size = 8;
const tileSize = canvas.width / size;

let board = [];
let aiLastMove = null;
let currentPlayer = 1;
let aiPlayer = -1;
let history = [];

function deepCopy(obj) {
  return JSON.parse(JSON.stringify(obj));
}

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
  board[3][3] = 1;
  board[4][4] = 1;
  board[3][4] = -1;
  board[4][3] = -1;
  history = [];
}

function drawBoard() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const moves = getValidMoves(board, currentPlayer);
  for (let [x, y] of moves) {
    ctx.fillStyle = "rgba(255, 255, 0, 0.8)";
    ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
  }
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
  if (aiLastMove) {
    ctx.strokeStyle = "red";
    ctx.lineWidth = 3;
    ctx.strokeRect(aiLastMove[0] * tileSize, aiLastMove[1] * tileSize, tileSize, tileSize);
    ctx.lineWidth = 1;
  }
}

canvas.addEventListener("click", (e) => {
  if (currentPlayer !== aiPlayer) {
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / tileSize);
    const y = Math.floor((e.clientY - rect.top) / tileSize);
    if (isValidMove(board, x, y, currentPlayer)) {
      history.push({ board: deepCopy(board), player: currentPlayer });
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
  let move = getBestMove(board, aiPlayer);
  if (!move) {
    endTurn();
    return;
  }
  history.push({ board: deepCopy(board), player: aiPlayer });
  aiLastMove = move;
  makeMove(board, move[0], move[1], aiPlayer);
  endTurn();
}

function evaluateBoard(board, player) {
  const weights = [
    [120, -20, 20, 5, 5, 20, -20, 120],
    [-20, -60, -10, -5, -5, -10, -60, -20],
    [20, -10, 15, 3, 3, 15, -10, 20],
    [5, -5, 3, 3, 3, 3, -5, 5],
    [5, -5, 3, 3, 3, 3, -5, 5],
    [20, -10, 15, 3, 3, 15, -10, 20],
    [-20, -60, -10, -5, -5, -10, -60, -20],
    [120, -20, 20, 5, 5, 20, -20, 120]
  ];
  let score = 0;
  let stable = 0;
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      if (board[y][x] === player) {
        score += weights[y][x];
        if ((x === 0 || x === 7) && (y === 0 || y === 7)) stable += 1;
      } else if (board[y][x] === -player) {
        score -= weights[y][x];
      }
    }
  }
  const mobility = getValidMoves(board, player).length - getValidMoves(board, -player).length;
  return score + 10 * mobility + 15 * stable;
}

function minimax(board, depth, player, maximizingPlayer, alpha, beta) {
  if (depth === 0) {
    return evaluateBoard(board, maximizingPlayer);
  }
  const validMoves = getValidMoves(board, player);
  if (validMoves.length === 0) {
    return evaluateBoard(board, maximizingPlayer);
  }

  if (player === maximizingPlayer) {
    let maxEval = -Infinity;
    for (let [x, y] of validMoves) {
      let newBoard = JSON.parse(JSON.stringify(board));
      makeMove(newBoard, x, y, player);
      let eval = minimax(newBoard, depth - 1, -player, maximizingPlayer, alpha, beta);
      maxEval = Math.max(maxEval, eval);
      alpha = Math.max(alpha, eval);
      if (beta <= alpha) break;
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (let [x, y] of validMoves) {
      let newBoard = JSON.parse(JSON.stringify(board));
      makeMove(newBoard, x, y, player);
      let eval = minimax(newBoard, depth - 1, -player, maximizingPlayer, alpha, beta);
      minEval = Math.min(minEval, eval);
      beta = Math.min(beta, eval);
      if (beta <= alpha) break;
    }
    return minEval;
  }
}

function getBestMove(board, player) {
  const validMoves = getValidMoves(board, player);
  validMoves.sort((a, b) => {
    const w = [
      [120, -20, 20, 5, 5, 20, -20, 120],
      [-20, -60, -10, -5, -5, -10, -60, -20],
      [20, -10, 15, 3, 3, 15, -10, 20],
      [5, -5, 3, 3, 3, 3, -5, 5],
      [5, -5, 3, 3, 3, 3, -5, 5],
      [20, -10, 15, 3, 3, 15, -10, 20],
      [-20, -60, -10, -5, -5, -10, -60, -20],
      [120, -20, 20, 5, 5, 20, -20, 120]
    ];
    return w[b[1]][b[0]] - w[a[1]][a[0]];
  });

  let bestScore = -Infinity;
  let bestMove = null;
  for (let [x, y] of validMoves) {
    let newBoard = JSON.parse(JSON.stringify(board));
    makeMove(newBoard, x, y, player);
    let score = minimax(newBoard, 8, -player, player, -Infinity, Infinity);
    if (score > bestScore) {
      bestScore = score;
      bestMove = [x, y];
    }
  }
  return bestMove;
}

function undoMove() {
  if (history.length === 0) {
    document.getElementById("status").innerText = "無法悔棋。";
    return;
  }

  while (history.length > 0) {
    const last = history.pop();
    if (last.player !== aiPlayer) {
      board = deepCopy(last.board);
      currentPlayer = last.player;
      aiLastMove = null;
      drawBoard();
      updateScores();
      document.getElementById("status").innerText = "悔棋成功。";
      return;
    }
  }

  document.getElementById("status").innerText = "無法悔棋。";
}
