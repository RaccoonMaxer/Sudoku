const boardElement = document.getElementById('board');
const statusElement = document.getElementById('status');
const difficultySelect = document.getElementById('difficulty');
const newGameButton = document.getElementById('new-game');
const hintButton = document.getElementById('hint');
const showSolutionButton = document.getElementById('show-solution');

const difficultyClues = {
  easy: 40,
  medium: 32,
  hard: 26,
  expert: 22,
};

let currentPuzzle = [];
let currentSolution = [];

function createEmptyBoard() {
  return Array.from({ length: 9 }, () => Array(9).fill(0));
}

function shuffle(values) {
  for (let i = values.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [values[i], values[j]] = [values[j], values[i]];
  }
  return values;
}

function isValidMove(board, row, col, num) {
  for (let i = 0; i < 9; i += 1) {
    if (board[row][i] === num || board[i][col] === num) {
      return false;
    }
  }

  const boxRow = Math.floor(row / 3) * 3;
  const boxCol = Math.floor(col / 3) * 3;

  for (let r = boxRow; r < boxRow + 3; r += 1) {
    for (let c = boxCol; c < boxCol + 3; c += 1) {
      if (board[r][c] === num) {
        return false;
      }
    }
  }

  return true;
}

function fillBoard(board) {
  for (let row = 0; row < 9; row += 1) {
    for (let col = 0; col < 9; col += 1) {
      if (board[row][col] === 0) {
        const numbers = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);

        for (const num of numbers) {
          if (isValidMove(board, row, col, num)) {
            board[row][col] = num;
            if (fillBoard(board)) {
              return true;
            }
            board[row][col] = 0;
          }
        }

        return false;
      }
    }
  }

  return true;
}

function removeCells(solution, clues) {
  const puzzle = solution.map((row) => [...row]);
  let cellsToRemove = 81 - clues;

  while (cellsToRemove > 0) {
    const row = Math.floor(Math.random() * 9);
    const col = Math.floor(Math.random() * 9);

    if (puzzle[row][col] !== 0) {
      puzzle[row][col] = 0;
      cellsToRemove -= 1;
    }
  }

  return puzzle;
}

function generatePuzzle(difficulty) {
  const solution = createEmptyBoard();
  fillBoard(solution);
  const puzzle = removeCells(solution, difficultyClues[difficulty]);
  return { puzzle, solution };
}

function setStatus(message, tone = 'normal') {
  statusElement.textContent = message;
  statusElement.style.color = tone === 'success' ? '#117a2c' : '#1d2433';
}

function getLiveBoard() {
  const values = createEmptyBoard();
  const inputs = boardElement.querySelectorAll('input');

  inputs.forEach((input) => {
    const row = Number(input.dataset.row);
    const col = Number(input.dataset.col);
    values[row][col] = Number(input.value) || 0;
  });

  return values;
}

function markConflicts() {
  const inputs = boardElement.querySelectorAll('input');
  inputs.forEach((input) => input.parentElement.classList.remove('conflict'));

  const liveBoard = getLiveBoard();

  for (let row = 0; row < 9; row += 1) {
    for (let col = 0; col < 9; col += 1) {
      const value = liveBoard[row][col];
      if (!value) {
        continue;
      }

      liveBoard[row][col] = 0;
      if (!isValidMove(liveBoard, row, col, value)) {
        const cell = boardElement.querySelector(`input[data-row="${row}"][data-col="${col}"]`);
        if (cell) {
          cell.parentElement.classList.add('conflict');
        }
      }
      liveBoard[row][col] = value;
    }
  }
}

function checkCompletion() {
  const inputs = boardElement.querySelectorAll('input');

  for (const input of inputs) {
    const row = Number(input.dataset.row);
    const col = Number(input.dataset.col);
    if (Number(input.value) !== currentSolution[row][col]) {
      return;
    }
  }

  setStatus('Great job! Loading another puzzle...', 'success');
  setTimeout(() => startGame(difficultySelect.value), 800);
}

function getEditableEmptyCells() {
  const emptyCells = [];
  const inputs = boardElement.querySelectorAll('input');
  inputs.forEach((input) => {
    if (!input.readOnly && !input.value) {
      emptyCells.push(input);
    }
  });
  return emptyCells;
}

function fillCellWithSolution(input) {
  const row = Number(input.dataset.row);
  const col = Number(input.dataset.col);
  input.value = currentSolution[row][col];
}

function giveHint() {
  const emptyCells = getEditableEmptyCells();
  if (emptyCells.length === 0) {
    setStatus('No empty cells left. Check your entries!', 'success');
    checkCompletion();
    return;
  }

  const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
  fillCellWithSolution(randomCell);
  markConflicts();
  setStatus('Hint used: one correct number was revealed.');
  checkCompletion();
}

function revealSolution() {
  const inputs = boardElement.querySelectorAll('input');
  inputs.forEach((input) => {
    if (!input.readOnly) {
      fillCellWithSolution(input);
    }
  });
  markConflicts();
  setStatus('Solution shown. Starting a new puzzle...', 'success');
  setTimeout(() => startGame(difficultySelect.value), 1200);
}

function renderBoard(puzzle) {
  boardElement.innerHTML = '';

  for (let row = 0; row < 9; row += 1) {
    for (let col = 0; col < 9; col += 1) {
      const cell = document.createElement('div');
      cell.className = 'cell';

      const input = document.createElement('input');
      input.type = 'text';
      input.inputMode = 'numeric';
      input.maxLength = 1;
      input.dataset.row = row;
      input.dataset.col = col;

      if (puzzle[row][col] !== 0) {
        input.value = puzzle[row][col];
        input.readOnly = true;
        cell.classList.add('given');
      } else {
        input.addEventListener('input', (event) => {
          const clean = event.target.value.replace(/[^1-9]/g, '');
          event.target.value = clean;
          markConflicts();
          checkCompletion();
        });
      }

      cell.appendChild(input);
      boardElement.appendChild(cell);
    }
  }
}

function startGame(difficulty) {
  const { puzzle, solution } = generatePuzzle(difficulty);
  currentPuzzle = puzzle;
  currentSolution = solution;
  renderBoard(currentPuzzle);
  setStatus(`Difficulty: ${difficulty[0].toUpperCase()}${difficulty.slice(1)}. Good luck!`);
}

newGameButton.addEventListener('click', () => startGame(difficultySelect.value));
difficultySelect.addEventListener('change', () => startGame(difficultySelect.value));
hintButton.addEventListener('click', giveHint);
showSolutionButton.addEventListener('click', revealSolution);

startGame(difficultySelect.value);
