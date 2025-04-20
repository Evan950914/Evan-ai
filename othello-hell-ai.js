
const BOARD_SIZE = 8;
let board = [];
let currentPlayer = 1; // 1: black, -1: white
let playerColor = 1;
let aiPlayer = -1;
let moveHistory = [];

const directions = [
  [-1, -1], [-1, 0], [-1, 1],
  [ 0, -1],          [ 0, 1],
  [ 1, -1], [ 1, 0], [ 1, 1],
];

function initBoard() {
  board = Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(0));
  board[3][3] = board[4][4] = -1;
  board[3][4] = board[4][3] = 1;
  moveHistory = [];
  drawBoard();
  updateScores();
  if (currentPlayer === aiPlayer) {
    setTimeout(aiMove, 200);
  }
}

function drawBoard() {
  const canvas = document.getElementById("board");
  const ctx = canvas.getContext("2d");
  const size = canvas.width / BOARD_SIZE;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = "#000";
  for (let i = 0; i <= BOARD_SIZE; i++) {
    ctx.beginPath();
    ctx.moveTo(i * size, 0);
    ctx.lineTo(i * size, canvas.height);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, i * size);
    ctx.lineTo(canvas.width, i * size);
    ctx.stroke();
  }

  for (let y = 0; y < BOARD_SIZE; y++) {
    for (let x = 0; x < BOARD_SIZE; x++) {
      if (board[y][x] !== 0) {
        ctx.beginPath();
        ctx.arc((x + 0.5) * size, (y + 0.5) * size, size / 2.5, 0, 2 * Math.PI);
        ctx.fillStyle = board[y][x] === 1 ? "black" : "white";
        ctx.fill();
      }
    }
  }
}

function updateScores() {
  let black = 0, white = 0;
  board.flat().forEach(cell => {
    if (cell === 1) black++;
    if (cell === -1) white++;
  });
  document.getElementById("black-score").innerText = `黑子: ${black}`;
  document.getElementById("white-score").innerText = `白子: ${white}`;
}

function isValidMove(x, y, player) {
  if (board[y][x] !== 0) return false;
  for (const [dx, dy] of directions) {
    let nx = x + dx, ny = y + dy, found = false;
    while (nx >= 0 && nx < BOARD_SIZE && ny >= 0 && ny < BOARD_SIZE && board[ny][nx] === -player) {
      nx += dx;
      ny += dy;
      found = true;
    }
    if (found && nx >= 0 && nx < BOARD_SIZE && ny >= 0 && ny < BOARD_SIZE && board[ny][nx] === player) {
      return true;
    }
  }
  return false;
}

function getValidMoves(player) {
  const moves = [];
  for (let y = 0; y < BOARD_SIZE; y++) {
    for (let x = 0; x < BOARD_SIZE; x++) {
      if (isValidMove(x, y, player)) {
        moves.push({ x, y });
      }
    }
  }
  return moves;
}

function applyMove(x, y, player) {
  const flipped = [];
  board[y][x] = player;
  for (const [dx, dy] of directions) {
    let nx = x + dx, ny = y + dy, temp = [];
    while (nx >= 0 && nx < BOARD_SIZE && ny >= 0 && ny < BOARD_SIZE && board[ny][nx] === -player) {
      temp.push([nx, ny]);
      nx += dx;
      ny += dy;
    }
    if (temp.length && nx >= 0 && nx < BOARD_SIZE && ny >= 0 && ny < BOARD_SIZE && board[ny][nx] === player) {
      flipped.push(...temp);
    }
  }
  for (const [fx, fy] of flipped) {
    board[fy][fx] = player;
  }
  moveHistory.push({ x, y, player, flipped });
  currentPlayer = -currentPlayer;
  drawBoard();
  updateScores();
  checkGameOver();
}

function undoMove() {
  const last = moveHistory.pop();
  if (!last) return;
  board[last.y][last.x] = 0;
  for (const [fx, fy] of last.flipped) {
    board[fy][fx] = -last.player;
  }
  currentPlayer = last.player;
  drawBoard();
  updateScores();
}

function restartGame() {
  location.reload();
}

function aiMove() {
  const depth = 10;
  const best = minimax(board, depth, aiPlayer, -Infinity, Infinity).move;
  if (best) {
    applyMove(best.x, best.y, aiPlayer);
    if (getValidMoves(playerColor).length === 0 && getValidMoves(aiPlayer).length !== 0) {
      setTimeout(aiMove, 200);
    }
  }
}

function minimax(boardState, depth, player, alpha, beta) {
  const validMoves = getValidMoves(player);
  if (depth === 0 || validMoves.length === 0) {
    return { score: evaluateBoard(boardState) };
  }

  let bestMove = null;
  if (player === aiPlayer) {
    let maxEval = -Infinity;
    for (const move of validMoves) {
      const newBoard = boardState.map(row => row.slice());
      const flipped = simulateMove(newBoard, move.x, move.y, player);
      const result = minimax(newBoard, depth - 1, -player, alpha, beta);
      if (result.score > maxEval) {
        maxEval = result.score;
        bestMove = move;
      }
      alpha = Math.max(alpha, result.score);
      if (beta <= alpha) break;
    }
    return { score: maxEval, move: bestMove };
  } else {
    let minEval = Infinity;
    for (const move of validMoves) {
      const newBoard = boardState.map(row => row.slice());
      const flipped = simulateMove(newBoard, move.x, move.y, player);
      const result = minimax(newBoard, depth - 1, -player, alpha, beta);
      if (result.score < minEval) {
        minEval = result.score;
        bestMove = move;
      }
      beta = Math.min(beta, result.score);
      if (beta <= alpha) break;
    }
    return { score: minEval, move: bestMove };
  }
}

function simulateMove(boardState, x, y, player) {
  const flipped = [];
  boardState[y][x] = player;
  for (const [dx, dy] of directions) {
    let nx = x + dx, ny = y + dy, temp = [];
    while (nx >= 0 && nx < BOARD_SIZE && ny >= 0 && ny < BOARD_SIZE && boardState[ny][nx] === -player) {
      temp.push([nx, ny]);
      nx += dx;
      ny += dy;
    }
    if (temp.length && nx >= 0 && nx < BOARD_SIZE && ny >= 0 && ny < BOARD_SIZE && boardState[ny][nx] === player) {
      for (const [fx, fy] of temp) {
        boardState[fy][fx] = player;
        flipped.push([fx, fy]);
      }
    }
  }
  return flipped;
}

function evaluateBoard(boardState) {
  let score = 0;
  for (let y = 0; y < BOARD_SIZE; y++) {
    for (let x = 0; x < BOARD_SIZE; x++) {
      score += boardState[y][x];
    }
  }
  const mobility = getValidMoves(aiPlayer).length - getValidMoves(playerColor).length;
  return score * aiPlayer + 2 * mobility;
}

function checkGameOver() {
  const playerMoves = getValidMoves(playerColor);
  const aiMoves = getValidMoves(aiPlayer);
  if (playerMoves.length === 0 && aiMoves.length === 0) {
    const total = board.flat().reduce((acc, val) => acc + val, 0);
    const result = total === 0 ? "平手" : (total > 0 ? "黑子勝利" : "白子勝利");
    document.getElementById("status").innerText = `遊戲結束：${result}`;
  } else {
    document.getElementById("status").innerText =
      currentPlayer === playerColor ? "請選擇一個位置下子" : "AI 思考中...";
  }
}

document.getElementById("board").addEventListener("click", (e) => {
  if (currentPlayer !== playerColor) return;
  const size = e.target.width / BOARD_SIZE;
  const x = Math.floor(e.offsetX / size);
  const y = Math.floor(e.offsetY / size);
  if (isValidMove(x, y, currentPlayer)) {
    applyMove(x, y, currentPlayer);
    if (getValidMoves(aiPlayer).length > 0) {
      setTimeout(aiMove, 200);
    }
  }
});

function startGame(playerIsFirst, playerIsBlack) {
  document.getElementById("start-screen").style.display = "none";
  document.getElementById("game-screen").style.display = "block";
  aiPlayer = (playerIsBlack === playerIsFirst) ? -1 : 1;
  currentPlayer = playerIsFirst ? 1 : -1;
  playerColor = playerIsBlack ? 1 : -1;
  initBoard();
}
