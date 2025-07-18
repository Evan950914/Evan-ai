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
let gameLog = [];

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
  gameLog = [{ steps: [], result: null }];
  setStatus("遊戲開始！");
  if (aiPlayer === currentPlayer) setTimeout(aiMove, 500);
}

function initBoard() {
  board = Array(size).fill().map(() => Array(size).fill(0));
  board[3][3] = 1;
  board[4][4] = 1;
  board[3][4] = -1;
  board[4][3] = -1;
  history = [];
  aiLastMove = null;
}

function drawBoard() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const moves = getValidMoves(board, currentPlayer);
  for (let [x, y] of moves) {
    ctx.fillStyle = "rgba(255, 255, 0, 0.6)";
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
        // 畫穩定子邊框
        if (isStableDisc(board, x, y)) {
          ctx.strokeStyle = "red";
          ctx.lineWidth = 3;
          ctx.stroke();
          ctx.lineWidth = 1;
        }
      }
    }
  }
  if (aiLastMove) {
    ctx.strokeStyle = "blue";
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
      // 紀錄步驟
      gameLog[0].steps.push({ board: deepCopy(board), player: currentPlayer, move: [x, y] });
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
      const result = getWinner();
      setStatus("遊戲結束！" + result);
      // 紀錄結果
      gameLog[0].result = result;
      saveGameLog();
      return;
    } else {
      setStatus(`${currentPlayer === aiPlayer ? "AI" : "玩家"} 無合法移動，跳過回合`);
    }
  } else {
    setStatus(`${currentPlayer === aiPlayer ? "AI" : "玩家"} 行動中`);
  }
  if (currentPlayer === aiPlayer) setTimeout(aiMove, 300);
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
  // 紀錄步驟
  gameLog[0].steps.push({ board: deepCopy(board), player: aiPlayer, move: move });
  endTurn();
}

function evaluateBoard(bd, player) {
  // 權重矩陣
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

  // 穩定子計算
  const stableCount = countStableDiscs(bd, player);

  // 行動力
  const mobility = getValidMoves(bd, player).length - getValidMoves(bd, -player).length;

  let score = 0;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (bd[y][x] === player) {
        score += weights[y][x];
      } else if (bd[y][x] === -player) {
        score -= weights[y][x];
      }
    }
  }
  return score + 15 * stableCount + 10 * mobility;
}

function minimax(bd, depth, player, maximizingPlayer, alpha, beta) {
  // 檢查終局
  if (depth === 0 || isGameOver(bd)) {
    return evaluateBoard(bd, maximizingPlayer);
  }

  const key = JSON.stringify(bd) + player + depth;
  if (transpositionTable.has(key)) return transpositionTable.get(key);

  const validMoves = getValidMoves(bd, player);
  if (validMoves.length === 0) {
    // 沒有合法棋步，跳過回合或結束
    if (getValidMoves(bd, -player).length === 0) {
      return evaluateBoard(bd, maximizingPlayer);
    } else {
      const val = minimax(bd, depth, -player, maximizingPlayer, alpha, beta);
      transpositionTable.set(key, val);
      return val;
    }
  }

  if (player === maximizingPlayer) {
    let maxEval = -Infinity;
    for (let [x, y] of validMoves) {
      let newBoard = deepCopy(bd);
      makeMove(newBoard, x, y, player);
      let eval = minimax(newBoard, depth - 1, -player, maximizingPlayer, alpha, beta);
      maxEval = Math.max(maxEval, eval);
      alpha = Math.max(alpha, eval);
      if (beta <= alpha) break;
    }
    transpositionTable.set(key, maxEval);
    return maxEval;
  } else {
    let minEval = Infinity;
    for (let [x, y] of validMoves) {
      let newBoard = deepCopy(bd);
      makeMove(newBoard, x, y, player);
      let eval = minimax(newBoard, depth - 1, -player, maximizingPlayer, alpha, beta);
      minEval = Math.min(minEval, eval);
      beta = Math.min(beta, eval);
      if (beta <= alpha) break;
    }
    transpositionTable.set(key, minEval);
    return minEval;
  }
}

function getBestMove(bd, player) {
  const validMoves = getValidMoves(bd, player);

  // 用權重排序，優先搜索高價值位置
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
  validMoves.sort((a, b) => weights[b[1]][b[0]] - weights[a[1]][a[0]]);

  let bestScore = -Infinity;
  let bestMove = null;
  for (let [x, y] of validMoves) {
    let newBoard = deepCopy(bd);
    makeMove(newBoard, x, y, player);
    let score = minimax(newBoard, 6, -player, player, -Infinity, Infinity); // 深度 6 可調
    if (score > bestScore) {
      bestScore = score;
      bestMove = [x, y];
    }
  }
  return bestMove;
}

function undoMove() {
  if (history.length === 0) {
    setStatus("無法悔棋。");
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
      setStatus("悔棋成功。");
      return;
    }
  }
  setStatus("無法悔棋。");
}

// 判斷遊戲是否結束
function isGameOver(bd) {
  return getValidMoves(bd, 1).length === 0 && getValidMoves(bd, -1).length === 0;
}

// 判斷穩定子：簡易檢查角落連接的同色棋子
function isStableDisc(bd, x, y) {
  const player = bd[y][x];
  if (player === 0) return false;

  // 只有邊角才有可能穩定子
  if (!(x === 0 || x === 7 || y === 0 || y === 7)) return false;

  // 判斷連接角落的方向是否有同色連續棋子
  const corners = [
    [0,0], [7,0], [0,7], [7,7]
  ];

  for (const [cx, cy] of corners) {
    if (bd[cy][cx] === player) {
      // 簡易判斷是否在該角落方向的連續子
      if ((cx === 0 && x >= cx) || (cx === 7 && x <= cx)) {
        if ((cy === 0 && y >= cy) || (cy === 7 && y <= cy)) {
          // 簡單視為穩定子
          return true;
        }
      }
    }
  }
  return false;
}

// 計算穩定子數量
function countStableDiscs(bd, player) {
  let count = 0;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (bd[y][x] === player && isStableDisc(bd, x, y)) count++;
    }
  }
  return count;
}

function setStatus(text) {
  document.getElementById("status").innerText = text;
}

function saveGameLog() {
  let logs = JSON.parse(localStorage.getItem("game-log") || "[]");
  logs.unshift(gameLog[0]);
  if(logs.length > 50) logs.pop();
  localStorage.setItem("game-log", JSON.stringify(logs));
}

function renderHistory() {
  const logs = JSON.parse(localStorage.getItem("game-log") || "[]");
  const div = document.getElementById("history-log");
  if (logs.length === 0) {
    div.innerText = "尚無對戰紀錄。";
    return;
  }
  div.innerHTML = "<h3>對戰紀錄</h3>" + logs.map((g, i) => {
    return `<p>第 ${i + 1} 場 - 結果：${g.result}，共 ${g.steps.length} 步</p>`;
  }).join("");
}
