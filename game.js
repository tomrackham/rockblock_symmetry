const LEVELS = [
  {
    "name": "A",
    "rows": [
      "2000000000002",
      "2000000000002",
      "2000000000002",
      "2000456780002",
      "2000500070002",
      "2000601060002",
      "2000700050002",
      "2000876540002",
      "2000000000002",
      "2000000000002",
      "2000000000002"
    ]
  },
  {
    "name": "B",
    "rows": [
      "2000000000002",
      "2070707070702",
      "2006060606002",
      "2070505050702",
      "2006040406002",
      "2070501050702",
      "2006040406002",
      "2070505050702",
      "2006060606002",
      "2070707070702",
      "2000000000002"
    ]
  },
  {
    "name": "C",
    "rows": [
      "2000000000002",
      "2000000000002",
      "2002002002002",
      "2000760840002",
      "2000500060002",
      "2002001002002",
      "2000600050002",
      "2000480670002",
      "2002002002002",
      "2000000000002",
      "2000000000002"
    ]
  },
  {
    "name": "D",
    "rows": [
      "2000000000002",
      "2068500070502",
      "2000022020002",
      "2040000002402",
      "2002004000002",
      "2080061602702",
      "2002008000002",
      "2000000000002",
      "2002200202002",
      "2005057000602",
      "2000000000002"
    ]
  },
  {
    "name": "E",
    "rows": [
      "2000000000002",
      "2000006000002",
      "2008050707002",
      "2000040000802",
      "2074800000002",
      "2005001005002",
      "2070000400002",
      "2080000064502",
      "2000065000002",
      "2008000065602",
      "2000000000002"
    ]
  },
  {
    "name": "F",
    "rows": [
      "2000800080002",
      "2000700070002",
      "2000600060002",
      "2876545456782",
      "2000400040002",
      "2000501050002",
      "2000400040002",
      "2876545456782",
      "2000600060002",
      "2000700070002",
      "2000800080002"
    ]
  },
  {
    "name": "G",
    "rows": [
      "2008020000002",
      "2080006500072",
      "2000006008802",
      "2600560050052",
      "2007040000802",
      "2000401004002",
      "2070604000402",
      "2200700508202",
      "2000000000002",
      "2080046400602",
      "2070800000402"
    ]
  },
  {
    "name": "H",
    "rows": [
      "2002000080022",
      "2000400000402",
      "2080002000002",
      "2804000000702",
      "2000000000072",
      "2002001002002",
      "2000000000002",
      "2040000000702",
      "2200002000022",
      "2006000005002",
      "2202000002022"
    ]
  },
  {
    "name": "I",
    "rows": [
      "2000000000002",
      "2084806060002",
      "2000000000702",
      "2000040500002",
      "2040000008702",
      "2000001000002",
      "2050000000002",
      "2000800000602",
      "2040005070002",
      "2000076000802",
      "2000000000002"
    ]
  },
  {
    "name": "J",
    "rows": [
      "2220200020002",
      "2000050000022",
      "2200505050502",
      "2000000004002",
      "2200500000022",
      "2004041404022",
      "2000404000422",
      "2205050040002",
      "2200504050522",
      "2004040000002",
      "2000020020222"
    ]
  }
];


// Game Controller
class Game {
  constructor() {
    this.levelStates = {};
    this.levelIndex = null;
    this.grid = []; // 13x13 grid: 0 (empty), 2 (wall), 4..8 (rocks)
    this.player = { r: 0, c: 0 };
    this.pushes = 0;
    this.undoStack = [];
    this.isCompleted = false;
    
    // Preferences
    this.showSymmetryGuide = false;
    this.showShadowBlocks = false;
    this.showRockParity = false;
    this.completedLevels = JSON.parse(localStorage.getItem('rockblock_completed') || '[]');
    
    // DOM Elements
    this.boardEl = document.getElementById('game-board');
    this.levelGridEl = document.getElementById('level-grid');
    this.levelValEl = document.getElementById('level-val');
    this.pushesValEl = document.getElementById('pushes-val');
    this.rocksValEl = document.getElementById('rocks-val');
    
    this.victoryScreenEl = document.getElementById('victory-screen');
    
    // Settings toggles
    this.guideToggle = document.getElementById('symmetry-guide-toggle');
    this.shadowToggle = document.getElementById('shadow-blocks-toggle');
    
    // Action buttons
    this.undoBtn = document.getElementById('undo-btn');
    this.restartBtn = document.getElementById('restart-btn');
    
    // Symmetry Guide Lines
    this.symLineHoriz = document.querySelector('.symmetry-lines .horizontal');
    this.symLineVert = document.querySelector('.symmetry-lines .vertical');
    this.symLineDiagMain = document.querySelector('.symmetry-lines .diagonal-main');
    this.symLineDiagAnti = document.querySelector('.symmetry-lines .diagonal-anti');
    
    // Bind Event Listeners
    this.initEventListeners();
    this.buildLevelSelector();
    
    // Start game immediately
    this.loadLevel(0);
  }

  buildLevelSelector() {
    this.levelGridEl.innerHTML = '';
    LEVELS.forEach((level, idx) => {
      const btn = document.createElement('button');
      btn.className = 'btn-level';
      if (idx === this.levelIndex) btn.classList.add('active');
      if (this.completedLevels.includes(level.name)) btn.classList.add('completed');
      btn.textContent = level.name;
      btn.addEventListener('click', (e) => {
        this.loadLevel(idx);
        if (e.target) e.target.blur();
      });
      this.levelGridEl.appendChild(btn);
    });
  }

  updateLevelSelectorUI() {
    const buttons = this.levelGridEl.querySelectorAll('.btn-level');
    buttons.forEach((btn, idx) => {
      btn.classList.toggle('active', idx === this.levelIndex);
      btn.classList.toggle('completed', this.completedLevels.includes(LEVELS[idx].name));
    });
  }

  initEventListeners() {
    // Input handling
    this.konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
    this.konamiIndex = 0;

    document.addEventListener('keydown', (e) => {
      // Konami code check
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      if (key === this.konamiCode[this.konamiIndex].toLowerCase()) {
        this.konamiIndex++;
        if (this.konamiIndex === this.konamiCode.length) {
          this.showRockParity = !this.showRockParity;
          this.render();
          this.konamiIndex = 0;
        }
      } else {
        this.konamiIndex = 0;
      }

      if (this.isCompleted) return;

      const keyUpper = e.key.toUpperCase();
      
      // Level selection A-J
      if (keyUpper.length === 1 && keyUpper >= 'A' && keyUpper <= 'J') {
        const idx = keyUpper.charCodeAt(0) - 'A'.charCodeAt(0);
        if (idx < LEVELS.length) {
          this.loadLevel(idx);
          e.preventDefault();
        }
        return;
      }

      switch (e.key) {
        case 'ArrowUp':
          this.movePlayer(-1, 0);
          e.preventDefault();
          break;
        case 'ArrowDown':
          this.movePlayer(1, 0);
          e.preventDefault();
          break;
        case 'ArrowLeft':
          this.movePlayer(0, -1);
          e.preventDefault();
          break;
        case 'ArrowRight':
          this.movePlayer(0, 1);
          e.preventDefault();
          break;
        case 'Backspace':
          this.undo();
          e.preventDefault();
          break;
        case 'Escape':
          this.restartLevel();
          e.preventDefault();
          break;
      }
    });

    // Victory screen actions
    document.getElementById('next-level-btn').addEventListener('click', (e) => {
      this.victoryScreenEl.classList.remove('active');
      const nextIdx = (this.levelIndex + 1) % LEVELS.length;
      this.loadLevel(nextIdx);
      if (e.target) e.target.blur();
    });

    document.getElementById('close-btn').addEventListener('click', (e) => {
      this.victoryScreenEl.classList.remove('active');
      if (e.target) e.target.blur();
    });

    // Toggle events
    this.guideToggle.addEventListener('change', (e) => {
      this.showSymmetryGuide = e.target.checked;
      document.getElementById('symmetry-lines').classList.toggle('active', this.showSymmetryGuide);
      this.render();
      if (e.target) e.target.blur();
    });

    this.shadowToggle.addEventListener('change', (e) => {
      this.showShadowBlocks = e.target.checked;
      this.render();
      if (e.target) e.target.blur();
    });

    // Actions clicks
    this.undoBtn.addEventListener('click', (e) => {
      this.undo();
      if (e.target) e.target.blur();
    });
    
    this.restartBtn.addEventListener('click', (e) => {
      this.restartLevel();
      if (e.target) e.target.blur();
    });
  }

  loadLevel(idx, forceFresh = false) {
    // Save current level state if we're switching away
    if (this.levelIndex !== null && this.levelIndex !== idx) {
      this.levelStates[this.levelIndex] = {
        grid: this.grid.map(row => [...row]),
        player: { ...this.player },
        pushes: this.pushes,
        undoStack: this.undoStack.map(state => ({
          grid: state.grid.map(row => [...row]),
          player: { ...state.player },
          pushes: state.pushes
        }))
      };
    }

    this.levelIndex = idx;
    
    if (!forceFresh && this.levelStates[idx]) {
      // Restore saved state
      const saved = this.levelStates[idx];
      this.grid = saved.grid.map(row => [...row]);
      this.player = { ...saved.player };
      this.pushes = saved.pushes;
      this.undoStack = saved.undoStack.map(state => ({
        grid: state.grid.map(row => [...row]),
        player: { ...state.player },
        pushes: state.pushes
      }));
      this.isCompleted = false;
    } else {
      // Fresh load
      const level = LEVELS[idx];
      
      // Initialize 13x13 grid with walls on boundaries
      this.grid = Array(13).fill(null).map(() => Array(13).fill(2));
      
      // Copy the 11 rows to rows 1 to 11
      for (let r = 1; r <= 11; r++) {
        const rowStr = level.rows[r - 1];
        for (let c = 0; c < 13; c++) {
          const val = rowStr[c] || '2';
          this.grid[r][c] = val === '1' ? '1' : parseInt(val, 10);
        }
      }
      
      // Locate player start before modifying values
      this.player = null;
      for (let r = 0; r < 13; r++) {
        for (let c = 0; c < 13; c++) {
          if (this.grid[r][c] === '1') {
            this.player = { r, c };
            this.grid[r][c] = 0; // Replace player spot with empty cell
          }
        }
      }

      // Default player position if not found
      if (!this.player) {
        let bestDist = Infinity;
        let startR = 6, startC = 6;
        for (let r = 0; r < 13; r++) {
          for (let c = 0; c < 13; c++) {
            if (this.grid[r][c] === 0) {
              let dist = Math.abs(r - 6) + Math.abs(c - 6);
              if (dist < bestDist) {
                bestDist = dist;
                startR = r;
                startC = c;
              }
            }
          }
        }
        this.player = { r: startR, c: startC };
      }

      this.pushes = 0;
      this.undoStack = [];
      this.isCompleted = false;
    }

    this.updateStatsUI();
    this.updateLevelSelectorUI();
    this.victoryScreenEl.classList.remove('active');
    
    this.render();
  }

  restartLevel() {
    delete this.levelStates[this.levelIndex];
    this.loadLevel(this.levelIndex, true);
  }

  saveHistoryState() {
    const gridCopy = this.grid.map(row => [...row]);
    this.undoStack.push({
      grid: gridCopy,
      player: { ...this.player },
      pushes: this.pushes
    });
  }

  undo() {
    if (this.undoStack.length === 0 || this.isCompleted) return;
    const previous = this.undoStack.pop();
    this.grid = previous.grid;
    this.player = previous.player;
    this.pushes = previous.pushes;
    
    this.updateStatsUI();
    this.render();
  }

  movePlayer(dr, dc) {
    // Save state for undo
    this.saveHistoryState();

    let moveVal = { dr, dc };
    let canMove = this.checkMoveValidity(this.player, moveVal);

    if (canMove) {
      let pushOccurred = false;
      let conversionOccurred = false;
      let lastConvertedVal = 0;

      // Execute player move
      const pResult = this.executeMove(this.player, moveVal);
      if (pResult.pushed) {
        pushOccurred = true;
        if (pResult.converted) {
          conversionOccurred = true;
        }
        lastConvertedVal = pResult.val;
      }

      // Update UI and check completion
      if (pushOccurred) {
        this.pushes++;
      }
      this.updateStatsUI();
      this.render();
      this.checkCompletion();
    } else {
      // Discard saved history state if no movement was possible
      this.undoStack.pop();
    }
  }

  checkMoveValidity(player, move) {
    const targetR = player.r + move.dr;
    const targetC = player.c + move.dc;

    // Boundary check
    if (targetR < 0 || targetR >= 13 || targetC < 0 || targetC >= 13) return false;

    const cellVal = this.grid[targetR][targetC];

    // Wall or permanent wall
    if (cellVal === 2) return false;

    // Rock push check
    if (cellVal >= 4 && cellVal <= 8) {
      const behindR = targetR + move.dr;
      const behindC = targetC + move.dc;
      
      if (behindR < 0 || behindR >= 13 || behindC < 0 || behindC >= 13) return false;

      const behindVal = this.grid[behindR][behindC];
      // Can only push into empty space (0)
      return behindVal === 0;
    }

    // Empty space
    return cellVal === 0;
  }

  executeMove(player, move) {
    const targetR = player.r + move.dr;
    const targetC = player.c + move.dc;
    const cellVal = this.grid[targetR][targetC];

    let result = { pushed: false, converted: false, val: 0 };

    if (cellVal >= 4 && cellVal <= 8) {
      // Push rock
      const behindR = targetR + move.dr;
      const behindC = targetC + move.dc;
      
      let nextVal = cellVal + 1;
      if (nextVal > 8) {
        nextVal = 2; // Converts to solid wall
        result.converted = true;
      }
      
      this.grid[behindR][behindC] = nextVal;
      this.grid[targetR][targetC] = 0; // Clear rock's original cell
      
      result.pushed = true;
      result.val = nextVal;
      
      // Store conversion info for visual highlighting
      if (result.converted) {
        this.lastConvertedCell = { r: behindR, c: behindC };
      }
    }

    // Move player
    player.r = targetR;
    player.c = targetC;

    return result;
  }

  checkCompletion() {
    if (this.isCompleted) return;
    
    // 1. All rocks must be converted to walls (no values 4..8 left on grid)
    let hasRocks = false;
    for (let r = 0; r < 13; r++) {
      for (let c = 0; c < 13; c++) {
        const val = this.grid[r][c];
        if (val >= 4 && val <= 8) {
          hasRocks = true;
          break;
        }
      }
      if (hasRocks) break;
    }

    if (hasRocks) return;

    // 2. The wall layout must be fully symmetric under D4 (reflectional & rotational symmetry)
    const wallGrid = this.grid.map(row => row.map(cell => cell === 2 ? 1 : 0));
    
    let isSymmetric = true;
    for (let r = 0; r < 13; r++) {
      for (let c = 0; c < 13; c++) {
        const val = wallGrid[r][c];
        if (wallGrid[r][12 - c] !== val ||       // Horizontal
            wallGrid[12 - r][c] !== val ||       // Vertical
            wallGrid[c][r] !== val ||            // Diagonal 1
            wallGrid[12 - c][12 - r] !== val) {  // Diagonal 2
          isSymmetric = false;
          break;
        }
      }
      if (!isSymmetric) break;
    }

    if (isSymmetric) {
      this.levelCleared();
    }
  }

  levelCleared() {
    this.isCompleted = true;
    
    // Save completion
    const lvlName = LEVELS[this.levelIndex].name;
    if (!this.completedLevels.includes(lvlName)) {
      this.completedLevels.push(lvlName);
      localStorage.setItem('rockblock_completed', JSON.stringify(this.completedLevels));
    }
    
    this.updateLevelSelectorUI();
    
    // Trigger Victory Screen overlay
    setTimeout(() => {
      this.victoryScreenEl.classList.add('active');
    }, 600);
  }

  updateStatsUI() {
    if (this.levelValEl) {
      this.levelValEl.textContent = LEVELS[this.levelIndex].name;
    }
    
    // Count active rocks
    let activeRocks = 0;
    for (let r = 0; r < 13; r++) {
      for (let c = 0; c < 13; c++) {
        const val = this.grid[r][c];
        if (val >= 4 && val <= 8) activeRocks++;
      }
    }
    if (this.rocksValEl) {
      this.rocksValEl.textContent = activeRocks;
    }
  }

  render() {
    this.boardEl.innerHTML = '';
    
    // Render static background grid cells
    for (let r = 0; r < 13; r++) {
      for (let c = 0; c < 13; c++) {
        const cell = document.createElement('div');
        cell.className = 'grid-cell';
        
        if (this.showShadowBlocks && this.grid[r][c] !== 2) {
          if (this.grid[12 - r][c] === 2 ||
              this.grid[r][12 - c] === 2 ||
              this.grid[12 - r][12 - c] === 2 ||
              this.grid[c][r] === 2 ||
              this.grid[12 - c][r] === 2 ||
              this.grid[c][12 - r] === 2 ||
              this.grid[12 - c][12 - r] === 2) {
            cell.classList.add('symmetry-hint');
          }
        }
        
        this.boardEl.appendChild(cell);
      }
    }


    // Render entities
    for (let r = 0; r < 13; r++) {
      for (let c = 0; c < 13; c++) {
        const val = this.grid[r][c];
        
        if (val === 2) {
          // Wall
          const el = document.createElement('div');
          el.className = 'entity entity-wall';
          el.style.transform = `translate(calc(${c} * 100%), calc(${r} * 100%))`;
          
          // Flash animation for newly converted walls
          if (this.lastConvertedCell && this.lastConvertedCell.r === r && this.lastConvertedCell.c === c) {
            el.classList.add('converted');
          }
          
          this.boardEl.appendChild(el);
        } else if (val >= 4 && val <= 8) {
          // Rock
          const el = document.createElement('div');
          const colorClass = ['purple', 'blue', 'green', 'yellow', 'red'][val - 4];
          el.className = `entity rock-${colorClass}`;
          el.style.transform = `translate(calc(${c} * 100%), calc(${r} * 100%))`;
          
          if (this.showRockParity) {
             const finalParity = (r + c + (9 - val)) % 2;
             el.classList.add(finalParity === 0 ? 'parity-white' : 'parity-black');
          }
          
          this.boardEl.appendChild(el);
        }
      }
    }

    // Clear last converted cell check to avoid repeating conversions
    this.lastConvertedCell = null;

    // Render Player
    if (this.player) {
      const p1El = document.createElement('div');
      p1El.className = 'entity entity-player';
      p1El.style.transform = `translate(calc(${this.player.c} * 100%), calc(${this.player.r} * 100%))`;
      
      this.boardEl.appendChild(p1El);
    }
    
    // Update symmetry lines
    if (this.showSymmetryGuide) {
      let isHoriz = true, isVert = true, isDiagM = true, isDiagA = true;
      for (let r = 0; r < 13; r++) {
        for (let c = 0; c < 13; c++) {
          const w1 = this.grid[r][c] === 2;
          if (w1 !== (this.grid[12 - r][c] === 2)) isHoriz = false;
          if (w1 !== (this.grid[r][12 - c] === 2)) isVert = false;
          if (w1 !== (this.grid[c][r] === 2)) isDiagM = false;
          if (w1 !== (this.grid[12 - c][12 - r] === 2)) isDiagA = false;
        }
      }
      this.symLineHoriz.className = 'line horizontal ' + (isHoriz ? 'line-sym-yes' : 'line-sym-no');
      this.symLineVert.className = 'line vertical ' + (isVert ? 'line-sym-yes' : 'line-sym-no');
      this.symLineDiagMain.className = 'line diagonal-main ' + (isDiagM ? 'line-sym-yes' : 'line-sym-no');
      this.symLineDiagAnti.className = 'line diagonal-anti ' + (isDiagA ? 'line-sym-yes' : 'line-sym-no');
    }
  }
}

// Start Game
window.addEventListener('DOMContentLoaded', () => {
  new Game();
});
