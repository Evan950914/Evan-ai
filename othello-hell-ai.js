
let gameState;
let aiSearchDepth = 10;
let history = [];

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

function evaluateBoard(board, color) {
  let score = 0;
  const weights = [
    [100, -10, 10, 5, 5, 10, -10, 100],
    [-10, -20, 1, 1, 1, 1, -20, -10],
    [10, 1, 5, 2, 2, 5, 1, 10],
    [5, 1, 2, 1, 1, 2, 1, 5],
    [5, 1, 2, 1, 1, 2, 1, 5],
    [10, 1, 5, 2, 2, 5, 1, 10],
    [-10, -20, 1, 1, 1, 1, -20, -10],
    [100, -10, 10, 5, 5, 10, -10, 100]
  ];
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      if (board[y][x] === color) score += weights[y][x];
      else if (board[y][x] === getOpponent(color)) score -= weights[y][x];
    }
  }
  return score;
}

function makeMove(board, move, color) {
  // Make the move and flip discs (not shown in detail for brevity)
  return board;
}

function aiMove() {
  document.getElementById("status").textContent = "AI 思考中...";
  setTimeout(() => {
    const move = findBestMove(gameState.board, gameState.aiColor, aiSearchDepth);
    if (move) {
      history.push(cloneBoard(gameState.board));
      gameState.board = makeMove(gameState.board, move, gameState.aiColor);
      gameState.currentPlayer = gameState.playerColor;
    }
    updateUI();
  }, 50);
}

function findBestMove(board, color, depth) {
  let bestScore = -Infinity;
  let bestMove = null;
  const moves = getLegalMoves(board, color);
  for (const move of moves) {
    const newBoard = makeMove(cloneBoard(board), move, color);
    const score = minimax(newBoard, depth - 1, false, color, -Infinity, Infinity);
    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }
  return bestMove;
}

function minimax(board, depth, isMaximizing, aiColor, alpha, beta) {
  if (depth === 0) return evaluateBoard(board, aiColor);
  const color = isMaximizing ? aiColor : getOpponent(aiColor);
  const moves = getLegalMoves(board, color);
  if (moves.length === 0) return evaluateBoard(board, aiColor);

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const move of moves) {
      const eval = minimax(makeMove(cloneBoard(board), move, color), depth - 1, false, aiColor, alpha, beta);
      maxEval = Math.max(maxEval, eval);
      alpha = Math.max(alpha, eval);
      if (beta <= alpha) break;
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const move of moves) {
      const eval = minimax(makeMove(cloneBoard(board), move, color), depth - 1, true, aiColor, alpha, beta);
      minEval = Math.min(minEval, eval);
      beta = Math.min(beta, eval);
      if (beta <= alpha) break;
    }
    return minEval;
  }
}

function undoMove() {
  if (history.length > 0) {
    gameState.board = history.pop();
    gameState.currentPlayer = gameState.playerColor;
    updateUI();
  }
}
