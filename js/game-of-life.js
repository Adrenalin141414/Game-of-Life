'use strict';

/* Colors */

const COLOR_BLACK = 'black';
const COLOR_BLUE = 'blue';
const COLOR_ORANGE = 'orange';
const COLOR_WHITE = 'white';
const COLOR_LIGHT_GREY = '#CCC';


/* Sizes (in pixels) */

const GRID_WIDTH = 1200; // default: 1200 (pixels)
const GRID_HEIGHT = 800; // default: 800 (pixels)
const CELL_SIZE = 10; // default: 10 (pixels)


/* Sizes (in cells) */

const CELLS_IN_ROW = Math.floor(GRID_WIDTH / CELL_SIZE);
const CELLS_IN_COL = Math.floor(GRID_HEIGHT / CELL_SIZE);
// Общее количество клеток на игровом поле (вообще всех, даже пустых)
const CELLS_ALL = CELLS_IN_ROW * CELLS_IN_COL;


/* Cells States Matrices */

// matrix of current cell generation 
let cellMatrix = new Uint8Array(CELLS_ALL);
// matrix of next cell generation
let nextMatrix = new Uint8Array(CELLS_ALL);


/* Generation history for current game */

// aliveCells -> array of matching generation objects with the same amount of alive cells: [{ generation: 0, matrix: [1, 0, 1, ..., 1] }, ...]
let generationsMap = new Map();


/* Pattern storage */

let patternStorage = {
  // initial pattern for current game (id changes when user selects a new pattern)
  initial: { id: null, aliveCells: 0, matrix: new Uint8Array() },
  // custom pattern for current game
  custom: { id: 'custom', aliveCells: 0, matrix: new Uint8Array(), cellsInRow: CELLS_IN_ROW, cellsInCol: CELLS_IN_COL },


  /* Figures */

  blinker: { id: 'blinker', aliveCells: 5, matrix: new Uint8Array([0, 1, 0, 0, 1, 0, 0, 1, 0]), cellsInRow: 3, cellsInCol: 3 },
  glider: { id: 'glider', aliveCells: 5, matrix: new Uint8Array([0, 1, 0, 0, 0, 1, 1, 1, 1]), cellsInRow: 3, cellsInCol: 3 },
  star: { id: 'star', aliveCells: 5, matrix: new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 1, 1, 0, 0, 0, 1, 0, 0, 0, 1, 1, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]), cellsInRow: 13, cellsInCol: 13 },
  cross: { id: 'cross', aliveCells: 5, matrix: new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1, 1, 1, 0, 0, 1, 1, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 1, 1, 0, 0, 1, 1, 1, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]), cellsInRow: 10, cellsInCol: 10 },
  'french-kiss': { id: 'french-kiss', aliveCells: 5, matrix: new Uint8Array([0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 1, 0, 1, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0, 1, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0]), cellsInRow: 9, cellsInCol: 10 },
};


// Alive Cells Counter
let aliveCells = 0;


// Game states
let gameStates = {
  init: 'creating initial pattern',
  isRunning: 'running',
  paused: 'paused',
  over: 'game over'
};

// Current game state
let gameState;


// 'Game over' reasons
let gameOverReasons = {
  noAliveCells: 'no alive cells', // для случая, когда клеток не было с самого начала
  cellsDied: 'all cells died',
  samePattern: 'the same pattern was already',
  samePatternShort: 'same pattern',
};


// Game Timer id
let gameTimerId;


// Delay (milliseconds)
let delay = 50; // default: 50
document.querySelector('#slider-delay').value = delay;
document.querySelector('#delay-value').innerHTML = `${ delay } ms`;


// Generation
let generation = 0;


/* Modal window (show game messages) */
let modal = document.querySelector('#modal');
let modalTitle = document.querySelector('#modal-title');
let modalContent = document.querySelector('#modal-content');


/* Helpful */

let customPattern;
let endlessGame = false;





/*******************************
 * Управление мышью на канвасе *
 *******************************/


/* Canvas */

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

canvas.width = GRID_WIDTH + 1;
canvas.height = GRID_HEIGHT + 1;


/* Mouse events */

let isDrawing = false;
let isRemoving = false;


/**
 * Убираем контекстное меню по ПКМ на канвасе
 */
canvas.oncontextmenu = function (e) {
  e.preventDefault();
};

canvas.addEventListener('mousedown', function(e) {
  // Показываем сообщение о том, что в таком режиме рисовать вручную нельзя
  const showCantDrawModal = () => {
    showModal('Nice try!', `
      <p class="mb-10">Ha-ha! Nice try, my dear player 😄!</p>
      <p class="mb-10">But <strong>you can't draw in normal mode</strong>!</p>
      ${ gameState === gameStates.paused ? '<p class="mb-20">Yes, yes, you are playing right now, despite the fact that the game is paused.</p><p class="mb-10 blue">By the way, even if you do not start the game using the <strong>"Play/Pause"</strong> button,</p><p class="mb-20 blue">the game can start and immediately pause itself automatically when you press the <strong>"Next Gen"</strong> button.</p>' : '' }
      <p class="mb-10">The next time you want to draw, just check the <strong>"Endless game"</strong> checkbox before starting the game.</p>
      <p class="mt-20"><strong>❤️ [Your favorite developer] ❤️</strong></p>`
    );
  }

  switch(e.button) {
    case 0: // LMB
      // Если игра уже запущена в обычном (небесконечном) режиме — показываем сообщение о том, что в таком режиме рисовать вручную нельзя и просто выходим
      if (gameState !== gameStates.init && !endlessGame) { showCantDrawModal(); return; }

      isDrawing = true;
      isRemoving = false;
      drawCell(e);

      break;
    case 2: // RMB
      // Если игра уже запущена в обычном (небесконечном) режиме — показываем сообщение о том, что в таком режиме рисовать вручную нельзя и просто выходим
      if (gameState !== gameStates.init && !endlessGame) { showCantDrawModal(); return; }

      isDrawing = false;
      isRemoving = true;
      removeCell(e);

      break;
  }
});

canvas.addEventListener('mousemove', function(e) {
  if (isDrawing) drawCell(e);
  if (isRemoving) removeCell(e);
});

canvas.addEventListener('mouseup', function(e) {
  isDrawing = false;
  isRemoving = false;

  if (!aliveCells) document.querySelector('#pattern').value = 'empty'; // Pattern select -> set 'empty' pattern
  else saveCustomPattern();
});





/**
 * Инициализация игры (новая игра)
 */
function init() {
  clearTimeout(gameTimerId);
  generationsMap.clear();

  gameState = gameStates.init;
  aliveCells = 0;
  generation = 0;
  
  updateGameStats('game-state', gameState);
  updateGameStats('alive-cells', aliveCells);
  updateGameStats('gen', generation);

  document.getElementById('play-pause').innerHTML = '⏵'; // Play/Pause button -> set 'play' icon
  document.querySelector('#pattern').value = 'empty'; // Pattern select -> set 'empty' pattern
  enableControls('#pattern', '#next-gen', '#play-pause', '#endless-game'); // enable controls -> 'Pattern select', 'Next Gen', 'Play/Pause', 'Endless game'

  clearCanvas();
  drawGrid();
  enterTheMatrix();
};

init();


/**
 * Очищаем холст (канвас)
 */
function clearCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}


/**
 * Рисуем сетку
 */
function drawGrid() {
  ctx.beginPath();

  /* Рисуем вертикальные линии */
  for (let x = 0.5; x <= GRID_WIDTH + 1; x += CELL_SIZE) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, GRID_HEIGHT);
  }

  /* Рисуем горизонтальные линии */
  for (let x = 0.5; x <= GRID_HEIGHT + 1; x += CELL_SIZE) {
    ctx.moveTo(0, x);
    ctx.lineTo(GRID_WIDTH, x);
  }

  ctx.closePath();
  ctx.strokeStyle = COLOR_LIGHT_GREY; // COLOR_BLACK
  ctx.stroke();
}


/**
 * Инициализация матриц состояний клеток
 */
function enterTheMatrix() {
  for (let i = 0; i < CELLS_ALL; i++) {
    /* 0 - unpopulated, 1 - populated */
    cellMatrix[i] = nextMatrix[i] = 0;
  }
}


/**
 * Рисуем клетку
 */
function drawCell(event, props) {
  /* Вспомогательная функция, производящая отрисовку прямоугольника новой живой клетки с обновлением соответствующей ячейки матрицы состояний клеток и счетчика живых клеток */
  const drawer = (topLeftX, topLeftY, index) => {
    drawRect(topLeftX, topLeftY, CELL_SIZE, CELL_SIZE, COLOR_BLUE);
    cellMatrix[index] = 1; // alive
    aliveCells++;
  }

  if (event) { // добавление клетки игроком (клик ЛКМ или перемещение мыши с зажатой левой кнопкой [рисование])
    const coords = getRectCoords(event); // cell rectangle -> top left corner coordinates
    const index = getCellIndexByRectCoords(coords.x, coords.y);

    if (cellMatrix[index] === 0) {
      drawer(coords.x, coords.y, index);
      updateGameStats('alive-cells', aliveCells);
      if (gameState === gameStates.init) document.getElementById('pattern').value = 'custom';
    }
  } else if (props) { // добавление клетки программно
    const index = props.index;
    const colIndex = getColIndex(index);
    const rowIndex = getRowIndex(index);
    drawer(colIndex * CELL_SIZE, rowIndex * CELL_SIZE, index);
  }
}


/**
 * Удаляем (стираем) клетку
 */
function removeCell(event, props) {
  /* Вспомогательная функция, производящая удаление (стирание) прямоугольника живой клетки с обновлением информации о количестве оставшихся живых клеток */
  const eraser = (topLeftX, topLeftY, index) => {
    ctx.clearRect(topLeftX + 1, topLeftY + 1, CELL_SIZE - 1, CELL_SIZE - 1);
    cellMatrix[index] = 0; // dead
    aliveCells--;
  }

  if (event) { // удаление (стирание) клетки игроком (клик ПКМ или перемещение мыши с зажатой правой кнопкой [рисование])
    const coords = getRectCoords(event); // cell rectangle -> top left corner coordinates
    const index = getCellIndexByRectCoords(coords.x, coords.y);
    if (cellMatrix[index] === 1) {
      eraser(coords.x, coords.y, index);
      updateGameStats('alive-cells', aliveCells);
    }
  } else if (props) { // удаление (стирание) клетки программно
    const coords = Object.hasOwn(props, 'x') && Object.hasOwn(props, 'y') ? { x: props.x, y: props.y  } : getRectCoordsByCellIndex(index);
    const index = props.index;
    eraser(coords.x, coords.y, index);
  }
}


/**
 * Получаем позицию [координаты] курсора (при нажатии на клетку)
 */
function getCursorPosition(canvas, event) {
  const rect = canvas.getBoundingClientRect();
  const x = Math.abs(event.clientX - rect.left);
  const y = Math.abs(event.clientY - rect.top);

  return { x, y };
}


/**
 * Получаем координаты левого верхнего угла прямоугольника клетки по координатам курсора (при нажатии на клетку)
 */
function getRectCoords(event) {
  const cursorPosition = getCursorPosition(canvas, event);
  const x = cursorPosition.x - cursorPosition.x % CELL_SIZE;
  const y = cursorPosition.y - cursorPosition.y % CELL_SIZE;

  return { x, y };
}


/**
 * Получаем координаты левого верхнего угла прямоугольника клетки по ее индексу в матрице состояний клеток
 */
function getRectCoordsByCellIndex(i) {
  const colIndex = getColIndex(i);
  const rowIndex = getRowIndex(i);
  const x = colIndex * CELL_SIZE;
  const y = rowIndex * CELL_SIZE;

  return { x, y };
}


/**
 * Получаем индекс клетки в матрице состояний клеток по координатам левого верхнего угла прямоугольника клетки
 */
function getCellIndexByRectCoords(topLeftX, topLeftY, cellsInRow = CELLS_IN_ROW) {
  const colIndex = Math.floor(topLeftX / CELL_SIZE);
  const rowIndex = Math.floor(topLeftY / CELL_SIZE);

  return cellsInRow * rowIndex + colIndex;
}


/**
 * Получаем индекс клетки в матрице состояний клеток по индексам строки и столбца
 */
function getCellIndex(colIndex, rowIndex, cellsInRow = CELLS_IN_ROW) {
  return cellsInRow * rowIndex + colIndex;
}


/**
 * Рисуем прямоугольник клетки
 */
function drawRect(x, y, width, height, color) {
  ctx.beginPath();
  ctx.rect(x + 1, y + 1, width - 1, height - 1);
  ctx.fillStyle = color;
  ctx.closePath();
  ctx.fill();
}


/**
 * Генерируем следующее поколение клеток согласно правилам игры
 */
function nextGen() {
  disableControls('#pattern', '#endless-game'); // disable controls -> 'Pattern select', 'Endless game'

  if (gameState === gameStates.init) {
    // если кнопка "Следующее поколение" нажата при создании начального игрового паттерна (поколение 0), то меняем состояние игры на "Приостановлена",
    // поскольку при этом функция nextGen сгенерирует первое поколение клеток игры (игра начнется и сразу поставится на паузу)
    gameState = gameStates.paused;
    updateGameStats('game-state', gameState);

    patternStorage.initial.aliveCells = aliveCells; // сохраняем начальное количество живых клеток
  }

  // если не стоит галка чекбокса 'Endless game' -> записываем текущее поколение в массив поколений, соответствующих текущему количеству живых клеток
  if (!endlessGame) {
    // Получаем массив поколений, содержащих такое же количество живых клеток, как и текущее
    const matchedGenerations = generationsMap.get(aliveCells) || [];

    // Кладем в конец этого массива текущее поколение
    matchedGenerations[matchedGenerations.length] = { generation, matrix: new Uint8Array(cellMatrix) };

    // обновляем generationsMap по соответствующему ключу (количеству живых клеток)
    generationsMap.set(aliveCells, matchedGenerations);
  }

  // применяем правила игры ко всем клеткам
  for (let i = 0; i < CELLS_ALL; i++) {
    applyRules(i);
  }

  clearCanvas();
  drawGrid(); // redraw grid
  drawAliveCells(nextMatrix);
  
  aliveCells = 0;
  cellMatrix = nextMatrix.map(item => {
    if (item === 1) {
      aliveCells++;
    }
  
    return item;
  });

  updateGameStats('alive-cells', aliveCells);
  generation++;
  updateGameStats('gen', generation);

  // если не стоит галка чекбокса 'Endless game' -> проверяем не пора ли завершить игру ('Game over') из-за определенных правилами условий
  if (!endlessGame) {
    const isGameOver = checkGameOver();
    if (isGameOver) {
      pause(isGameOver);
      disableControls('#play-pause', '#next-gen'); // disable controls -> 'Play/Pause', 'Next Gen'
    }
  }
}


/**
 * Применяем правила игры к конкретной клетке по ее индексу в матрице состояний клеток
 */
function applyRules(i) {
  const aliveNeighbours = getAliveNeighbours(i);

  // Стандартные правила игры (B3/S23)
  if (cellMatrix[i] === 0) {
    if (aliveNeighbours === 3) {
      nextMatrix[i] = 1; // alive
    }
  }
  else {
    if (aliveNeighbours === 2 || aliveNeighbours === 3) {
      nextMatrix[i] = 1; // alive
    }
    else {
      nextMatrix[i] = 0; // dead
    }
  }

  // Измененные правила игры (тест)
  // if (cellMatrix[i] === 0) {
  //   if (aliveNeighbours === 3) {
  //     nextMatrix[i] = 1; // alive
  //   }
  // }
  // else {
  //   if (aliveNeighbours >= 2 && aliveNeighbours <= 4) {
  //     nextMatrix[i] = 1; // alive
  //   }
  //   else {
  //    nextMatrix[i] = 0; // dead
  //   }
  // }
}


/**
 * Рисуем живые (выжившие) клетки согласно матрице состояний клеток
 */
function drawAliveCells(matrix, pattern) {
  if (matrix.length === cellMatrix.length) { // если размеры матриц совпадают — просто рисуем соответствующие единицам клетки
    for (let i = 0; i < matrix.length; i++) {
      if (matrix[i] === 1) {      
        drawCell(null, { index: i });
      }
    }
  } else { // если размеры матриц не совпадают — определяем размеры переданной матрицы по объекту, содержащему данные о размерах ее паттерна
    if (pattern && pattern.cellsInRow) {
      const cellsInRow = pattern.cellsInRow;

      for (let i = 0; i < matrix.length; i++) {
        if (matrix[i] === 1) {
          const colIndex = getColIndex(i, cellsInRow);
          const rowIndex = getRowIndex(i, cellsInRow);
          const cellIndex = getCellIndex(colIndex, rowIndex);
          drawCell(null, { index: cellIndex });
        }
      }
    } else { // если объект паттерна не передан или в нем отсутствуют свойства, определяющие разрешение матрицы в клетках — выводим сообщение пользователю о том, что невозможно нарисовать паттерн
      showModal('Need sizes!', `
        <p class="blue mb-10">Unable to draw pattern with different cell resolution!</p>
        <p>Requires a pattern object with <strong>pattern.cellsInRow</strong> and <strong>pattern.cellsInCol</strong> properties defined.</p>`
      );
    }
  }
}


/**
 * Получаем индекс строки определенной клетки игрового поля по индексу этой клетки в матрице состояний клеток
 */
function getRowIndex(cellIndex, cellsInRow = CELLS_IN_ROW) {
  return Math.floor(cellIndex / cellsInRow);
}


/**
 * Получаем индекс столбца определенной клетки игрового поля по индексу этой клетки в матрице состояний клеток
 */
function getColIndex(cellIndex, cellsInRow = CELLS_IN_ROW) {
  return cellIndex % cellsInRow;
}


/**
 * Функция-обработчик для элемента select, предоставляющего возможность выбора игрового паттерна
 */
async function onPatternChange() {
  const selectedPatternId = document.getElementById("pattern").value;
  patternStorage.initial.id = selectedPatternId;
  await drawPattern(selectedPatternId);
}


/**
 * Функция-обработчик для элементов input[type="checkbox"]
 */
function onCheckboxChange(id, checked) {
  switch(id) {
    case 'endless-game':
      endlessGame = checked;
      break;
  }
}


/**
 * Рисуем выбранный пользователем паттерн (при выборе 'Random Cells' клетки на поле генерируются случайным образом)
 */
async function drawPattern(id) {
  await toggleLoader('ON');

  clearCanvas();
  drawGrid();
  enterTheMatrix();
  aliveCells = 0;

  switch (id) {
    case 'empty':
      // выше идет очистка канваса, перерисовка сетки, заполнение матриц нулями, и сброс количества живых клеток,
      // выполняющиеся перед отрисовкой любого паттерна, включая 'Empty', поэтому просто выходим
      break;
    case 'custom':
      drawCustom();
      break;
    case 'random-cells':
      drawRandomCells();
      break;
    default:
      drawAliveCells(patternStorage[id].matrix, patternStorage[id]);
  }

  updateGameStats('alive-cells', aliveCells);
  await toggleLoader('OFF');
}


/**
 * Рисуем паттерн, созданный пользователем
 */
function drawCustom() {
  // load custom pattern from pattern storage
  const customPattern = patternStorage.custom;
  if (customPattern.matrix.length) drawAliveCells(customPattern.matrix);
  else { // load custom pattern from local storage
    const customPatternFromLS = JSON.parse(localStorage.getItem('custom-pattern'));
    if (customPatternFromLS && customPatternFromLS.matrix && customPatternFromLS.matrix.length) {
      if (customPatternFromLS.cellsInRow === CELLS_IN_ROW && customPatternFromLS.cellsInCol === CELLS_IN_COL) {
        drawAliveCells(customPatternFromLS.matrix);
      } else {
        showModal('Different sizes!', `
          <p class="mb-10">Custom pattern from localStorage can't be loaded because it has a different resolution.</p>
          <p class="mb-10">Pattern resolution (width x height) in cells: ${ customPatternFromLS.cellsInRow }&times;${ customPatternFromLS.cellsInCol }</p>
          <p class="mb-10 blue">Current game field resolution (width x height) in cells: ${ CELLS_IN_ROW }&times;${ CELLS_IN_COL }</p>
          <p class="mt-20"><strong>❤️ [Your favorite developer] ❤️</strong></p>`
        );
      }
    }
  }
}


/**
 * Получаем количество живых клеток среди 8-ми соседних окружающих [текущую клетку] клеток по индексу текущей клетки.
 */
function getAliveNeighbours(cellIndex) {
  const colIndex = getColIndex(cellIndex);
  const rowIndex = getRowIndex(cellIndex);

  // Массив индексов 8-ми соседних окружающих [текущую клетку] клеток
  const neighbourIndexes = [
    // top left neighbour index
    rowIndex === 0 ? (colIndex === 0 ? CELLS_ALL - 1 : CELLS_ALL - CELLS_IN_ROW + cellIndex - 1) : colIndex === 0 ? cellIndex - 1 : cellIndex - CELLS_IN_ROW - 1,
    // top neighbour index
    rowIndex === 0 ? CELLS_ALL - CELLS_IN_ROW + cellIndex : cellIndex - CELLS_IN_ROW,
    // top right neighbour index
    rowIndex === 0 ? (colIndex === CELLS_IN_ROW - 1 ? CELLS_ALL - CELLS_IN_ROW : CELLS_ALL - CELLS_IN_ROW + cellIndex + 1) : colIndex === CELLS_IN_ROW - 1 ? cellIndex - (CELLS_IN_ROW << 1) + 1 : cellIndex - CELLS_IN_ROW + 1,
    // left neighbour index
    colIndex === 0 ? cellIndex + CELLS_IN_ROW - 1 : cellIndex - 1,
    // right neighbour index
    colIndex === CELLS_IN_ROW - 1 ? cellIndex - CELLS_IN_ROW + 1 : cellIndex + 1,
    // bottom left neighbour index
    rowIndex === CELLS_IN_COL - 1 ? (colIndex === 0 ? cellIndex - CELLS_ALL + (CELLS_IN_ROW << 1) - 1 : cellIndex - (CELLS_ALL - CELLS_IN_ROW) - 1) : colIndex === 0 ? cellIndex + (CELLS_IN_ROW << 1) - 1 : cellIndex + CELLS_IN_ROW - 1,
    // bottom neighbour index
    rowIndex === CELLS_IN_COL - 1 ? cellIndex - (CELLS_ALL - CELLS_IN_ROW) : cellIndex + CELLS_IN_ROW,
    // bottom right neighbour index
    rowIndex === CELLS_IN_COL - 1 ? (colIndex === CELLS_IN_ROW - 1 ? 0 : cellIndex - (CELLS_ALL - CELLS_IN_ROW) + 1 ) : colIndex === CELLS_IN_ROW - 1 ? cellIndex + 1 : cellIndex + CELLS_IN_ROW + 1
  ];

  // Массив состояний (1 - alive, 0 - dead) 8-ми соседних окружающих [текущую клетку] клеток (состояния записываются слева направо сверху вниз).
  // Например: const neighbourStates = [1,0,1,1,0,0,1,1]; // [<topLeft>, <top>, <topRight>, <left>, <right>, <bottomLeft>, <bottom>, <bottomRight>].
  const neighbourStates = [
    cellMatrix[neighbourIndexes[0]],
    cellMatrix[neighbourIndexes[1]],
    cellMatrix[neighbourIndexes[2]],
    cellMatrix[neighbourIndexes[3]],
    cellMatrix[neighbourIndexes[4]],
    cellMatrix[neighbourIndexes[5]],
    cellMatrix[neighbourIndexes[6]],
    cellMatrix[neighbourIndexes[7]]
  ];
  
  let aliveNeighboursCount = 0;
  
  for (let state of neighbourStates) {
    if (state === 1) {
      aliveNeighboursCount++;
    }
  }
  
  return aliveNeighboursCount;
}


/**
 * Генерируем клетки случайным образом
 */
function drawRandomCells() {
  for (let i = 0; i < CELLS_ALL; i++) {
    if (getRandomInt(0, 2) === 1) {
      const colIndex = getColIndex(i);
      const rowIndex = getRowIndex(i);
      drawCell(null, { x: colIndex * CELL_SIZE, y: rowIndex * CELL_SIZE, index: i });
    }
  }
}


/**
 * Получаем случайное целое число из заданного диапазона [min, max]
 */
function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}


/**
 * Обновляем игровую статистику
 */
function updateGameStats(elementId, value) {
  let label;
  switch (elementId) {
    case 'game-state':
      label = 'Game state';
      break;
    case 'alive-cells':
      label = 'Alive cells';
      break;
    case 'gen':
      label = 'Generation';
      break;
  };

  document.getElementById(elementId).innerHTML = `<strong>${ label }:</strong> ${ value }`;
}


/**
 * Обновляем задержку игрового таймера [см. setTimeout в функции playpause] (меняем скорость игры)
 */
function updateDelay(milliseconds) {
  delay = milliseconds;
  document.querySelector('#delay-value').innerHTML = `${ delay } ms`;
}


/**
 * Отображаем/скрываем лоадер
 */
async function toggleLoader(state) {
  const loader = document.getElementById('loader');
  loader.style.visibility = state === 'ON' ? 'visible' : 'hidden';
  await sleep(1);
}


/**
 * Сохраняем начальный паттерн, нарисованный пользователем
 */
function saveCustomPattern() {
  patternStorage.custom.matrix = new Uint8Array(cellMatrix);
  patternStorage.custom.aliveCells = aliveCells;
  localStorage.setItem('custom-pattern', JSON.stringify({ ...patternStorage.custom, matrix: [...cellMatrix] }));
}


/**
 * Play
 */
function play() {
  disableControls('#pattern', '#endless-game'); // disable controls -> 'Pattern select', 'Endless game',
  patternStorage.initial.aliveCells = aliveCells; // сохраняем начальное количество живых клеток
  gameState = gameStates.isRunning;
  document.getElementById('play-pause').innerHTML = '⏸'; // Pause
  updateGameStats('game-state', gameState);
  gameTimerId = setTimeout(function tick() {
    nextGen();
    if (gameState !== gameStates.over) gameTimerId = setTimeout(tick, delay);
  }, delay);
}


/**
 * Pause
 */
function pause(isGameOver) {
  disableControls('#pattern'); // pattern select -> disabled
  if (!isGameOver) gameState = gameStates.paused;
  document.getElementById('play-pause').innerHTML = '⏵'; // Play
  if (!isGameOver) updateGameStats('game-state', gameState);
  clearTimeout(gameTimerId);
}


/**
 * Play / Pause
 */
function playpause() {
  gameState === gameStates.isRunning ? pause() : play();
}


/**
 * Проверяем окончена ли игра и в случае, если это действительно так, выполняем определенные действия в зависимости от причины ее завершения.
 */
function checkGameOver() {
  const showGameOverModal = (gameOverReason, gameOverReasonShort) => {
    gameState = gameStates.over;
    updateGameStats('game-state', `${ gameStates.over } (${ gameOverReasonShort || gameOverReason })`);
    showModal('Game over!', `
      <p><strong>${ capitalizeFirstLetter(gameOverReason) }!<strong></p>`);
  };

  // не осталось живых клеток
  if (!aliveCells) {
    const gameOverReason = !patternStorage.initial.aliveCells ? gameOverReasons.noAliveCells : gameOverReasons.cellsDied;
    showGameOverModal(gameOverReason);
    return true;
  } else { // проверка на тот же самый паттерн
    const samePatternGen = getGenerationWithSamePattern(cellMatrix);
    if (!samePatternGen) return false;

    const gameOverReason = `${ gameOverReasons.samePattern } in generation ${ samePatternGen.generation }`;
    const gameOverReasonShort = gameOverReasons.samePatternShort;
    showGameOverModal(gameOverReason, gameOverReasonShort);
    return true;
  }

  return false;
}


/**
 * Проверяем сложившийся игровой паттерн текущего поколения клеток на совпадение с одним из паттернов предыдущих поколений с тем же
 * количеством живых клеток и возвращаем объект найденного поколения при его наличии.
 */
function getGenerationWithSamePattern(matrix) {
  let matchedGenerations = generationsMap.get(aliveCells) || [];
  for (let gen of matchedGenerations) {
    let isSameMatrix = true; // наивно предполагаем, что проверяемая на текущей итерации матрица — это та же самая матрица, что и в текущем поколении клеток
    
    for (let i = 0; i < CELLS_ALL; i++) {
      // при первом же несовпадении -> понимаем, что это не та же самая матрица, поэтому прекращаем ее проверять на полное совпадение с матрицей текущего поколения клеток
      if (gen.matrix[i] !== matrix[i]) { isSameMatrix = false; break; }
    }

    if (isSameMatrix) return gen;
  }
}


/* Отключаем определенные элементы управления (например, на время выполнения игры) */
function disableControls() {
  for (let selector of arguments) {
    document.querySelector(selector).disabled = true; // control -> disabled
  }
}


/* Включаем определенные элементы управления (например, при запуске новой игры после 'Game over') */
function enableControls() {
  for (let selector of arguments) {
    document.querySelector(selector).disabled = false; // control -> enabled
  }
}


/**
 * Закрываем модальное окно, если пользователь нажал в свободную от него область
 */
window.onclick = function(event) {
  if (event.target == modal) {
    closeModal();
  }
}


/**
 * Закрываем модальное окно по клавише ESC (escape)
 */
document.onkeydown = function(evt) {
  evt = evt || window.event;
  let isEscape = false;
  if ('key' in evt) {
    isEscape = (evt.key === 'Escape' || evt.key === 'Esc');
  } else {
    isEscape = (evt.keyCode === 27);
  }
  if (isEscape) {
    closeModal();
  }
};


/**
 * Показываем модальное окно
 */
function showModal(title, htmlContent) {
  modalTitle.innerHTML = title;
  modalContent.innerHTML = htmlContent;
  modal.style.display = 'flex';
}


/**
 * Закрываем модальное окно
 */
function closeModal() {
  modal.style.display = 'none';
}


/*********
 * UTILS *
 *********/

/**
 * Делаем первую букву строки заглавной (переводим первую букву строки в верхний регистр [UPPERCASE]).
 * @param str Строка, первую букву которой хотим сделать заглавной.
 */
function capitalizeFirstLetter(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}


/**
 * Задержка выполнения
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
