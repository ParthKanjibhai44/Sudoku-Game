document.addEventListener("DOMContentLoaded", () => {
  // --- Constants and Global Variables ---
  const GRID_SIZE = 9;
  const BOX_SIZE = 3;
  const EMPTY_CELL = 0;
  const MAX_ATTEMPTS = 3;

  const gridElement = document.getElementById("sudoku-grid");
  const newGameBtn = document.getElementById("new-game-btn");
  const checkBtn = document.getElementById("check-btn");
  const solveBtn = document.getElementById("solve-btn");
  const messageBox = document.getElementById("message-box");
  const attemptsContainer = document.getElementById("attempts-container");
  const hintBtn = document.getElementById("hint-btn");
  const difficultyTabs = document.getElementById("difficulty-tabs");
  const timerEl = document.getElementById("timer");

  let board = [];
  let solution = [];
  let failureAttempts = MAX_ATTEMPTS;
  let isGameOver = false;
  let currentDifficulty = "Medium";
  const MAX_HINTS = 3;
  let remainingHints = MAX_HINTS;
  let timerInterval = null;
  let elapsedSeconds = 0;

  const DIFFICULTY_SETTINGS = {
    Easy: 35,
    Medium: 45,
    Hard: 55,
    Extreme: 60,
  };

  // --- Board Generation ---

  function generatePuzzle() {
    board = Array.from({ length: GRID_SIZE }, () =>
      Array(GRID_SIZE).fill(EMPTY_CELL)
    );
    solution = Array.from({ length: GRID_SIZE }, () =>
      Array(GRID_SIZE).fill(EMPTY_CELL)
    );

    solveSudoku(board); // Generate a full solution

    // Copy the full solution before poking holes
    for (let i = 0; i < GRID_SIZE; i++) {
      solution[i] = [...board[i]];
    }

    // Remove numbers according to selected difficulty
    pokeHoles(DIFFICULTY_SETTINGS[currentDifficulty] || 45);
  }

  function solveSudoku(grid) {
    const findEmpty = () => {
      for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
          if (grid[r][c] === EMPTY_CELL) return [r, c];
        }
      }
      return null;
    };

    const emptySpot = findEmpty();
    if (!emptySpot) return true; // Solved
    const [row, col] = emptySpot;

    const nums = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);

    for (let num of nums) {
      if (isValid(grid, row, col, num)) {
        grid[row][col] = num;
        if (solveSudoku(grid)) return true;
        grid[row][col] = EMPTY_CELL; // Backtrack
      }
    }
    return false;
  }

  function isValid(grid, row, col, num) {
    // Check row, column, and 3x3 box
    for (let i = 0; i < GRID_SIZE; i++) {
      if (grid[row][i] === num && i !== col) return false;
      if (grid[i][col] === num && i !== row) return false;
    }
    const startRow = Math.floor(row / BOX_SIZE) * BOX_SIZE;
    const startCol = Math.floor(col / BOX_SIZE) * BOX_SIZE;
    for (let r = 0; r < BOX_SIZE; r++) {
      for (let c = 0; c < BOX_SIZE; c++) {
        if (
          grid[startRow + r][startCol + c] === num &&
          (startRow + r !== row || startCol + c !== col)
        ) {
          return false;
        }
      }
    }
    return true;
  }

  function pokeHoles(holes) {
    let removed = 0;
    while (removed < holes) {
      const row = Math.floor(Math.random() * GRID_SIZE);
      const col = Math.floor(Math.random() * GRID_SIZE);
      if (board[row][col] !== EMPTY_CELL) {
        board[row][col] = EMPTY_CELL;
        removed++;
      }
    }
  }

  function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  // --- UI Interaction ---

  function createGrid() {
    gridElement.innerHTML = "";
    for (let r = 0; r < GRID_SIZE; r++) {
      const rowDiv = document.createElement("div");
      rowDiv.className = "row flex";
      for (let c = 0; c < GRID_SIZE; c++) {
        const cell = document.createElement("input");
        cell.type = "number";
        cell.className =
          "sudoku-cell flex items-center justify-center rounded-none";
        cell.dataset.row = r;
        cell.dataset.col = c;

        if (board[r][c] !== EMPTY_CELL) {
          cell.value = board[r][c];
          cell.readOnly = true;
          cell.classList.add("pre-filled");
        }

        cell.addEventListener("input", handleInput);
        cell.addEventListener("focus", handleFocus);
        cell.addEventListener("keydown", handleKeyDown);
        rowDiv.appendChild(cell);
      }
      gridElement.appendChild(rowDiv);
    }
  }

  function updateDifficultyTabsUI() {
    const buttons = difficultyTabs.querySelectorAll("button[data-difficulty]");
    buttons.forEach((btn) => {
      const isActive = btn.dataset.difficulty === currentDifficulty;
      btn.classList.toggle("bg-white", isActive);
      btn.classList.toggle("text-gray-800", isActive);
      btn.classList.toggle("shadow", isActive);
      btn.classList.toggle("text-gray-600", !isActive);
      btn.classList.toggle("hover:text-gray-800", !isActive);
      btn.setAttribute("aria-selected", String(isActive));
    });
  }

  function handleInput(e) {
    if (isGameOver) {
      e.target.value = "";
      return;
    }
    const cell = e.target;
    const value = cell.value;
    const row = parseInt(cell.dataset.row);
    const col = parseInt(cell.dataset.col);

    // Clear previous incorrect styling
    cell.classList.remove("incorrect");

    // Allow only single digits from 1-9
    if (!/^[1-9]$/.test(value)) {
      cell.value = "";
      return;
    }

    // Check if the entered number is correct and apply styling
    const enteredNum = parseInt(value);
    if (enteredNum !== solution[row][col]) {
      cell.classList.add("incorrect");
      // Penalize immediately for a wrong input and clear the cell
      penalizeMistake();
      cell.value = "";
    }
  }

  function handleKeyDown(e) {
    const cell = e.target;
    const row = parseInt(cell.dataset.row);
    const col = parseInt(cell.dataset.col);

    switch (e.key) {
      case "ArrowUp":
        e.preventDefault();
        if (row > 0) getCell(row - 1, col).focus();
        break;
      case "ArrowDown":
        e.preventDefault();
        if (row < GRID_SIZE - 1) getCell(row + 1, col).focus();
        break;
      case "ArrowLeft":
        e.preventDefault();
        if (col > 0) getCell(row, col - 1).focus();
        break;
      case "ArrowRight":
        e.preventDefault();
        if (col < GRID_SIZE - 1) getCell(row, col + 1).focus();
        break;
    }
  }

  function handleFocus(e) {
    highlightCells(
      parseInt(e.target.dataset.row),
      parseInt(e.target.dataset.col)
    );
  }

  function highlightCells(row, col) {
    document
      .querySelectorAll(".sudoku-cell")
      .forEach((c) => c.classList.remove("highlight", "selected"));
    for (let i = 0; i < GRID_SIZE; i++) {
      getCell(row, i).classList.add("highlight");
      getCell(i, col).classList.add("highlight");
    }
    const startRow = Math.floor(row / BOX_SIZE) * BOX_SIZE;
    const startCol = Math.floor(col / BOX_SIZE) * BOX_SIZE;
    for (let r = 0; r < BOX_SIZE; r++) {
      for (let c = 0; c < BOX_SIZE; c++) {
        getCell(startRow + r, startCol + c).classList.add("highlight");
      }
    }
    getCell(row, col).classList.add("selected");
  }

  function getCell(row, col) {
    return document.querySelector(`[data-row='${row}'][data-col='${col}']`);
  }

  function showMessage(text, type) {
    messageBox.textContent = text;
    messageBox.className =
      "mt-4 text-center text-lg font-medium p-3 rounded-lg opacity-0 transform scale-95";
    const typeClasses = {
      success: "bg-green-100 text-green-800",
      error: "bg-red-100 text-red-800",
      info: "bg-blue-100 text-blue-800",
    };
    messageBox.classList.add(
      ...(typeClasses[type] || typeClasses.info).split(" ")
    );

    setTimeout(
      () => messageBox.classList.replace("opacity-0", "opacity-100"),
      10
    );
    setTimeout(
      () => messageBox.classList.replace("opacity-100", "opacity-0"),
      3000
    );
  }

  function updateAttemptsUI() {
    const used = MAX_ATTEMPTS - failureAttempts;
    attemptsContainer.innerHTML = `Attempts: ${used}/${MAX_ATTEMPTS}`;
  }

  function updateHintUI() {
    hintBtn.textContent = `Hint (${remainingHints})`;
    hintBtn.disabled = isGameOver || remainingHints <= 0;
    if (hintBtn.disabled) {
      hintBtn.classList.add("opacity-60", "cursor-not-allowed");
    } else {
      hintBtn.classList.remove("opacity-60", "cursor-not-allowed");
    }
  }

  // --- Game Logic ---

  function penalizeMistake() {
    if (isGameOver) return;
    failureAttempts--;
    updateAttemptsUI();
    if (failureAttempts > 0) {
      showMessage(
        `Wrong number. You have ${failureAttempts} attempts left.`,
        "error"
      );
    } else {
      showMessage("3 mistakes made. Restarting game...", "error");
      startNewGame();
    }
  }

  // --- Timer Logic ---
  function formatTime(totalSeconds) {
    const m = Math.floor(totalSeconds / 60)
      .toString()
      .padStart(2, "0");
    const s = (totalSeconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  }

  function startTimer() {
    stopTimer();
    elapsedSeconds = 0;
    timerEl.textContent = "00:00";
    timerInterval = setInterval(() => {
      elapsedSeconds += 1;
      timerEl.textContent = formatTime(elapsedSeconds);
    }, 1000);
  }

  function stopTimer() {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
  }

  function checkSolution() {
    if (isGameOver) return;

    let isComplete = true;
    let isCorrect = true;

    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        const cell = getCell(r, c);
        const cellValue = parseInt(cell.value) || EMPTY_CELL;

        if (cellValue === EMPTY_CELL) isComplete = false;
        if (cellValue !== solution[r][c]) isCorrect = false;
      }
    }

    if (!isComplete) {
      showMessage("The board is not completely filled yet.", "info");
      return;
    }

    if (isCorrect) {
      showMessage("Congratulations! You solved it correctly!", "success");
      isGameOver = true;
      checkBtn.disabled = true;
      stopTimer();
    } else {
      failureAttempts--;
      updateAttemptsUI();
      if (failureAttempts > 0) {
        showMessage(
          `Not quite right. You have ${failureAttempts} attempts left.`,
          "error"
        );
      } else {
        showMessage("Game Over! Better luck next time.", "error");
        gameOver();
      }
    }
  }

  function solvePuzzle() {
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        const cell = getCell(r, c);
        if (!cell.readOnly) {
          cell.value = solution[r][c];
          cell.classList.remove("incorrect");
          cell.classList.add("text-blue-600", "font-bold");
        }
      }
    }
    showMessage("Here is the solution!", "info");
    gameOver();
    stopTimer();
  }

  function giveHint() {
    if (isGameOver) return;
    if (remainingHints <= 0) {
      showMessage("No hints left.", "error");
      updateHintUI();
      return;
    }
    // Find selected cell
    const selected = document.querySelector(".sudoku-cell.selected");
    if (!selected) {
      showMessage("Select a cell to get a hint.", "info");
      return;
    }
    const row = parseInt(selected.dataset.row);
    const col = parseInt(selected.dataset.col);
    if (selected.readOnly) {
      showMessage("This cell is pre-filled.", "info");
      return;
    }
    // Fill the correct value without consuming attempts
    selected.value = solution[row][col];
    selected.classList.remove("incorrect");
    selected.classList.add("text-blue-600", "font-bold");
    showMessage("Hint applied to the selected cell.", "info");
    remainingHints--;
    updateHintUI();
  }

  function gameOver() {
    isGameOver = true;
    document
      .querySelectorAll(".sudoku-cell:not(.pre-filled)")
      .forEach((cell) => (cell.readOnly = true));
    checkBtn.disabled = true;
    updateHintUI();
    stopTimer();
  }

  function startNewGame() {
    isGameOver = false;
    failureAttempts = MAX_ATTEMPTS;
    checkBtn.disabled = false;
    updateAttemptsUI();
    remainingHints = MAX_HINTS;
    generatePuzzle();
    createGrid();
    showMessage("New game started. Good luck!", "info");
    updateHintUI();
    startTimer();
  }

  // --- Event Listeners ---
  newGameBtn.addEventListener("click", startNewGame);
  checkBtn.addEventListener("click", checkSolution);
  solveBtn.addEventListener("click", solvePuzzle);
  hintBtn.addEventListener("click", giveHint);
  difficultyTabs.addEventListener("click", (e) => {
    const target = e.target;
    if (target && target.matches("button[data-difficulty]")) {
      currentDifficulty = target.dataset.difficulty;
      updateDifficultyTabsUI();
      startNewGame();
    }
  });

  // --- Initial Load ---
  updateDifficultyTabsUI();
  startNewGame();
});
