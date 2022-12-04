//
// --------- CANVAS ----------
//

const canvas = document.getElementById('play');
const h = canvas.height;
const w = canvas.width;
let ctx = canvas.getContext('2d');

//
// --------- CUSTOM CLASSES ---------
//

// A point
class Point {
  constructor(h, w) {
    this.x = h;
    this.y = w;
  }
}

// Queue class
class Queue {

  constructor() {
    this.items = [];
  }

  enqueue(element) {
    this.items.push(element);
  }

  dequeue() {
    if (this.isEmpty()) return "Underflow";
    return this.items.shift();
  }

  front() {
    if (this.isEmpty()) return "No elements in Queue";
    return this.items[0];
  }

  isEmpty() {
    return this.items.length == 0;
  }
}

//
// --------- GAME CONSTANTS ---------
//

// Game default block/sprite size in pixels
const N = 32

// Sprite Codes and Sources
const spriteCodes = {
  1: './black.png',
  0: './white.png',
  selected: './selected.png'
}

// Game State
const gameState = {
  gameWindowStart: new Point(w / 128, h / 128),
  gridSize: 10,
  levelCount: 0,
  levelLayout: null,
  levelPar: null,
  score: 0,
  selected: null,
}

// Debug flag
const DEBUG = true;

// Bounding box for canvas areas to draw/update
const drawQueue = {
  levelScore: {
    toDraw: true,
    rectSize: {
      from: new Point(0, 0),
      to: new Point(w / 3, 65),
    },
  },
  grid: {
    toDraw: true,
    rectSize: {
      from: new Point(gameState.gameWindowStart.x * N, gameState.gameWindowStart.y * N),
      to: new Point((gameState.gameWindowStart.x + gameState.gridSize) * N, (gameState.gameWindowStart.y + gameState.gridSize) * N),
    }
  },
  background: {
    toDraw: true,
    rectSize: {
      from: new Point(0, 0),
      to: new Point(w, h),
    }
  }
};

//
// --------- CONTEXT DRAWING FUNCTIONS ---------
//

// Draw rectengle between to opposite corners
const drawRect = (ctx, p0, p1) => {
  ctx.beginPath();
  ctx.rect(p0.x, p0.y, p1.x - p0.x, p1.y - p0.y);
  ctx.stroke();
}

// Draw a line between 2 points
const drawLine = (ctx, p0, p1) => {
  ctx.moveTo(p0.x, p0.y);
  ctx.lineTo(p1.x, p1.y);
  ctx.stroke();
}

// Draw a circle of given radius with given point
const drawCircle = (ctx, point, radius) => {
  ctx.beginPath();
  ctx.arc(point.x, point.y, radius, 0, 2 * Math.PI);
  ctx.stroke();
}

// Draw a sprite at a given point with optional height and width arguments
// Will default to NxN if not specified
// Might not work as intended if the height and width are not consistent across all sprites
const drawSprite = (ctx, imgSrc, pos, height = N, width = N) => {
  let img = new Image();
  img.onload = () => {
    if (height && width) {
      ctx.drawImage(img, pos.x, pos.y, height, width);
    } else {
      ctx.drawImage(img, pos.x, pos.y);
    }
  }
  img.src = imgSrc;
}

//
// ---------- UTILITY FUNCTIONS ----------
//

// Get neighbors of a given cell
const getNeighbors = (i, j) => {
  return [
    new Point(i - 1, j),
    new Point(i + 1, j),
    new Point(i, j - 1),
    new Point(i, j + 1),
  ]
}

// Generate a level with given size
const getLevel = (n) => {
  let level, par;
  [level, par] = getJumbled(n - 2);
  arr = [];
  for (let i = 0; i < n; i++) {
    arr.push([]); // Make a row
    for (let j = 0; j < n; j++) {
      // Put 0 and 1 randomly in the row
      let spriteType = level[i][j];
      arr[i][j] = {
        _id: Math.round(Math.random() * 1e+6),
        type: spriteType,
        pastType: null,
        src: spriteCodes[spriteType]
      };
    }
  }
  return [arr, Math.round(par/2.5)];
}

// Return sprite type at position x, y
const getSpriteAtPos = (x, y) => {
  return gameState.levelLayout[Math.floor(y / N)][Math.floor(x / N)];
}

// check win condition
const evaluateWinCondition = () => {
  let total = 0;
  let known = []
  for (let i = 0; i < gameState.levelLayout.length; i++) {
    for (let j = 0; j < gameState.levelLayout.length; j++) {
      if (gameState.levelLayout[i][j].type == 1) {
        total++;
        known = [i, j];
      }
    }
  }

  // run flood fill on grid
  let visited = new Set();
  let ones = new Queue();

  i = known[0];
  j = known[1];

  ones.enqueue([i, j]);

  let c = 0;

  while (!ones.isEmpty()) {
    [i, j] = ones.dequeue();
    let id = gameState.levelLayout[i][j]._id;
    if (visited.has(id)) continue;
    visited.add(id);
    let nei = neighbors(i, j, gameState.levelLayout.length);
    for (let k = 0; k < nei.length; k++) {
      let p = nei[k];
      if (gameState.levelLayout[p[0]][p[1]].type == 1) {
        ones.enqueue([p[0], p[1]]);
      }
    }
  }
  c = visited.size;

  return total == c;
}

const prepareNext = () => {
  [gameState.levelLayout, gameState.levelPar] = getLevel(gameState.gridSize);
  gameState.score = 0;
  gameState.selected = null;
  gameState.levelCount++;
}

// Get the mouse position on the canvas AND decide what to do depending on the sprite selected
const getCursorPosition = (canvas, event) => {
  // Get mouse position
  const rect = canvas.getBoundingClientRect();
  let x = event.clientX - rect.left - gameState.gameWindowStart.x * N;
  let y = event.clientY - rect.top - gameState.gameWindowStart.y * N;

  // Get sprite at mouse position
  let sprite;
  try {
    sprite = gameState.levelLayout[Math.floor(y / N)][Math.floor(x / N)];
  } catch (e) {
    console.log('Not a sprite position');
    return null;
  }

  if (sprite.type == 'selected') { // If the sprite is already selected, deselect it

    gameState.levelLayout[Math.floor(y / N)][Math.floor(x / N)] = {
      _id: sprite._id,
      type: sprite.pastType,
      pastType: null,
      src: spriteCodes[sprite.pastType]
    };

    gameState.selectedPosition = null;
    gameState.selected = null;

  } else if (sprite.type == 0 || sprite.type == 1) { // If the sprite is not selected, and is of a selectable type
    if (gameState.selected != null) { // and if there is already a selected sprite

      let neighbors = getNeighbors(gameState.selectedPosition.y, gameState.selectedPosition.x); // get neighbors of the selected sprite

      for (let i = 0; i < neighbors.length; i++) { // loop over the neighbors
        let point = neighbors[i];
        if (point.x < 0 || point.y < 0 || point.x >= gameState.levelLayout.length || point.y >= gameState.levelLayout.length) {
          continue; // if the neighbor indices are out of bounds, continue
        }
        if (gameState.levelLayout[point.x][point.y]._id == sprite._id) { // if the sprite is matched to be a neighbor

          // swap the sprite with the selected one
          gameState.levelLayout[gameState.selectedPosition.y][gameState.selectedPosition.x] = sprite;

          gameState.levelLayout[Math.floor(y / N)][Math.floor(x / N)] = {
            _id: gameState.selected._id,
            type: gameState.selected.pastType,
            pastType: null,
            src: spriteCodes[gameState.selected.pastType]
          };

          gameState.selectedPosition = null;
          gameState.selected = null;

          gameState.score++;
          drawQueue.levelScore.toDraw = true;

          if(evaluateWinCondition()) prepareNext();

          break; // exit the loop
        }
      }


    } else { // and if there is no selected sprite, set this one as selected

      gameState.levelLayout[Math.floor(y / N)][Math.floor(x / N)] = {
        _id: sprite._id,
        type: 'selected',
        pastType: sprite.type,
        src: spriteCodes['selected']
      };

      gameState.selectedPosition = new Point(Math.floor(x / N), Math.floor(y / N));
      gameState.selected = gameState.levelLayout[gameState.selectedPosition.y][gameState.selectedPosition.x];

    }
  } else { // else do nothing
    console.log('nothing');
  }
}

//
// --------- GAME LOOP ---------
//

const gameLoop = () => {

  if (gameState.levelLayout == null) {
    [gameState.levelLayout, gameState.levelPar] = getLevel(gameState.gridSize);
    gameState.levelCount++;
  }

  // check if won
  // if (evaluateWinCondition()) {
  //   console.log('You won!');
  // }

  if (drawQueue.background.toDraw) {
    let rect = drawQueue.background.rectSize;
    ctx.fillStyle = "#ffeeb3";
    ctx.fillRect(rect.from.x, rect.from.y, rect.to.x, rect.to.y)
    drawQueue.background.toDraw = false;
  }

  if (drawQueue.levelScore.toDraw) {
    let rect = drawQueue.levelScore.rectSize;
    ctx.fillStyle = "#ffeeb3";
    ctx.fillRect(rect.from.x, rect.from.y, rect.to.x, rect.to.y);
    ctx.fillStyle = "black";
    ctx.font = '24px Notable';
    ctx.fillText(`Lv. ${gameState.levelCount} | Par: ${gameState.levelPar}`, 10, 25);
    ctx.fillText(`Moves: ${gameState.score}`, 10, 55);
    drawQueue.levelScore.toDraw = false;
  }

  // Draw the sprites in the level
  for (let i = 0; i < gameState.levelLayout.length; i++) {
    let y = i + gameState.gameWindowStart.y;
    for (let j = 0; j < gameState.levelLayout[i].length; j++) {
      let x = j + gameState.gameWindowStart.x;
      drawSprite(ctx, spriteCodes[gameState.levelLayout[i][j].type], new Point(x * N, y * N), N - 1, N - 1);
    }
  }

  if (DEBUG) {
    for (item in drawQueue) {
      ctx.strokeStyle = "red";
      drawRect(ctx, drawQueue[item].rectSize.from, drawQueue[item].rectSize.to);
    }
  }

  // Get next frame
  window.requestAnimationFrame(gameLoop);
}

//
// --------- EVENT LISTENERS ---------
//

// On click event listener
canvas.addEventListener('mousedown', (e) => {
  getCursorPosition(canvas, e);
})

// Start getting frames
window.requestAnimationFrame(gameLoop);