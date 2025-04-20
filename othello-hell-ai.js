
let gameState;

function createInitialBoard() {
  const board = Array(8).fill(null).map(() => Array(8).fill(null));
  board[3][3] = 'white';
  board[3][4] = 'black';
  board[4][3] = 'black';
  board[4][4] = 'white';
  return board;
}

function cloneBoard(board) {
  return board.map(row => row.slice());
}

function getOpponent(color) {
  return color === 'black' ? 'white' : 'black';
}

function isOnBoard(x, y) {
  return x >= 0 && x < 8 && y >= 0 && y < 8;
}

function getLegalMoves(board, color) {
  const moves = [];
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      if (board[y][x] !== null) continue;
      if (capturesAny(board, x, y, color)) moves.push({x, y});
    }
  }
  return moves;
}

function capturesAny(board, x, y, color) {
  const opponent = getOpponent(color);
  const directions = [-1, 0, 1];
  for (let dx of directions) {
    for (let dy of directions) {
      if (dx === 0 && dy === 0) continue;
      let nx = x + dx, ny = y + dy, found = false;
      while (isOnBoard(nx, ny) && board[ny][nx] === opponent) {
        nx += dx;
        ny += dy;
        found = true;
      }
      if (found && isOnBoard(nx, ny) && board[ny][nx] === color) return true;
    }
  }
  return false;
}

function applyMove(board, move, color) {
  board[move.y][move.x] = color;
  const opponent = getOpponent(color);
  const directions = [-1, 0, 1];
  for (let dx of directions) {
    for (let dy of directions) {
      if (dx === 0 && dy === 0) continue;
      let nx = move.x + dx, ny = move.y + dy, captured = [];
      while (isOnBoard(nx, ny) && board[ny][nx] === opponent) {
        captured.push([nx, ny]);
        nx += dx;
        ny += dy;
      }
      if (isOnBoard(nx, ny) && board[ny][nx] === color) {
        for (let [cx, cy] of captured) board[cy][cx] = color;
      }
    }
  }
  return board;
}

function renderBoard() {
  const canvas = document.getElementById('board');
  const ctx = canvas.getContext('2d');
  const size = canvas.width / 8;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      ctx.strokeRect(x * size, y * size, size, size);
      if (gameState.board[y][x]) {
        ctx.beginPath();
        ctx.arc(x * size + size / 2, y * size + size / 2, size / 2.5, 0, 2 * Math.PI);
        ctx.fillStyle = gameState.board[y][x];
        ctx.fill();
      }
    }
  }
}

function updateScores() {
  let player = 0, ai = 0;
  for (let row of gameState.board) {
    for (let cell of row) {
      if (cell === gameState.playerColor) player++;
      else if (cell === gameState.aiColor) ai++;
    }
  }
  document.getElementById('player-score').textContent = player;
  document.getElementById('ai-score').textContent = ai;
}

function evaluateBoard(board, aiColor) {
  const weights = [
    [100, -20, 10,  5,  5, 10, -20, 100],
    [-20, -50, -2, -2, -2, -2, -50, -20],
    [10,  -2,  -1, -1, -1, -1,  -2,  10],
    [5,   -2,  -1, -1, -1, -1,  -2,   5],
    [5,   -2,  -1, -1, -1, -1,  -2,   5],
    [10,  -2,  -1, -1, -1, -1,  -2,  10],
    [-20, -50, -2, -2, -2, -2, -50, -20],
    [100, -20, 10,  5,  5, 10, -20, 100]
  ];
  let score = 0;
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      if (board[y][x] === aiColor) score += weights[y][x];
      else if (board[y][x] === getOpponent(aiColor)) score -= weights[y][x];
    }
  }
  return score;
}

function minimax(board, depth, maximizing, aiColor, alpha, beta) {
  if (depth === 0 || isGameOver(board)) return evaluateBoard(board, aiColor);
  const currentColor = maximizing ? aiColor : getOpponent(aiColor);
  const legalMoves = getLegalMoves(board, currentColor);
  if (legalMoves.length === 0) return evaluateBoard(board, aiColor);

  if (maximizing) {
    let maxEval = -Infinity;
    for (let move of legalMoves) {
      const newBoard = cloneBoard(board);
      applyMove(newBoard, move, currentColor);
      const eval = minimax(newBoard, depth - 1, false, aiColor, alpha, beta);
      maxEval = Math.max(maxEval, eval);
      alpha = Math.max(alpha, eval);
      if (beta <= alpha) break;
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (let move of legalMoves) {
      const newBoard = cloneBoard(board);
      applyMove(newBoard, move, currentColor);
      const eval = minimax(newBoard, depth - 1, true, aiColor, alpha, beta);
      minEval = Math.min(minEval, eval);
      beta = Math.min(beta, eval);
      if (beta <= alpha) break;
    }
    return minEval;
  }
}

function aiMove() {
  const depth = parseInt(document.getElementById('search-depth').value) || 6;
  const aiColor = gameState.aiColor;
  const legalMoves = getLegalMoves(gameState.board, aiColor);
  let bestMove = null, bestValue = -Infinity;

  for (let move of legalMoves) {
    const testBoard = cloneBoard(gameState.board);
    applyMove(testBoard, move, aiColor);
    const value = minimax(testBoard, depth - 1, false, aiColor, -Infinity, Infinity);
    if (value > bestValue) {
      bestValue = value;
      bestMove = move;
    }
  }

  if (bestMove) {
    applyMove(gameState.board, bestMove, aiColor);
    gameState.currentPlayer = gameState.playerColor;
    renderBoard();
    updateScores();
    checkGameOver();
  }
}

function isGameOver(board) {
  return getLegalMoves(board, 'black').length === 0 && getLegalMoves(board, 'white').length === 0;
}

function checkGameOver() {
  if (isGameOver(gameState.board)) {
    const status = document.getElementById('status');
    const player = gameState.playerColor;
    const ai = gameState.aiColor;
    let playerCount = 0, aiCount = 0;
    for (let row of gameState.board) {
      for (let cell of row) {
        if (cell === player) playerCount++;
        else if (cell === ai) aiCount++;
      }
    }
    status.textContent = playerCount > aiCount ? "你贏了！" : playerCount < aiCount ? "你輸了！" : "平手！";
  }
}

function startGame(whoStarts) {
  const colorInput = document.querySelector('input[name="player-color"]:checked');
  const playerColor = colorInput ? colorInput.value : 'black';
  const aiColor = getOpponent(playerColor);

  gameState = {
    board: createInitialBoard(),
    currentPlayer: whoStarts === 'player' ? playerColor : aiColor,
    playerColor,
    aiColor
  };

  document.getElementById('start-screen').style.display = 'none';
  document.getElementById('game-screen').style.display = 'block';

  renderBoard();
  updateScores();

  if (whoStarts === 'ai') {
    setTimeout(aiMove, 200);
  }
}
