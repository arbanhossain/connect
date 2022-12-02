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
  constructor(h,w) {
    this.x = h;
    this.y = w;
  }
}

//
// --------- GAME CONSTANTS ---------
//

// Game default block/sprite size in pixels
const N = 32

// Sprite Codes and Sources
const spriteCodes = {
  0: './black.png',
  1: './white.png',
  selected: './selected.png'
}

// Game State
const gameState = {
  gameWindowStart: new Point(w/128, h/128),
  levelCount: 0,
  levelLayout: null,
  score: 0,
  selected: null,
}

//
// --------- CONTEXT DRAWING FUNCTIONS ---------
//

// Draw a line between 2 points
const drawLine = (ctx, p0, p1) => {
  ctx.moveTo(p0.x, p0.y);
  ctx.lineTo(p1.x, p1.y);
  ctx.stroke();
}

// Draw a circle of given radius with given point
const drawCircle = (ctx, point, radius) => {
  ctx.beginPath();
  ctx.arc(point.x, point.y, radius, 0, 2*Math.PI);
  ctx.stroke();
}

// Draw a sprite at a given point with optional height and width arguments
// Will default to NxN if not specified
// Might not work as intended if the height and width are not consistent across all sprites
const drawSprite = (ctx, imgSrc, pos, height=N, width=N) => {
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

// Generate a level with given size
const getLevel = (n) => {
  arr = [];
  for(let i = 0; i < n; i++) {
    arr.push([]); // Make a row
    for(let j = 0; j < n; j++) {
      // Put 0 and 1 randomly in the row
      let spriteType = Math.round(Math.random());
      arr[i][j] = {
        type: spriteType,
        pastType: null,
        src: spriteCodes[spriteType]
      };
    }
  }
  return arr;
}

// Return sprite type at position x, y
const getSpriteAtPos = (x, y) => {
  return gameState.levelLayout[Math.floor(y/N)][Math.floor(x/N)];
}

// Get the mouse position on the canvas AND decide what to do depending on the sprite selected
const getCursorPosition = (canvas, event) => {
  // Get mouse position
  const rect = canvas.getBoundingClientRect();
  let x = event.clientX - rect.left - gameState.gameWindowStart.x*N;
  let y = event.clientY - rect.top - gameState.gameWindowStart.y*N;

  // Get sprite at mouse position
  let sprite = gameState.levelLayout[Math.floor(y/N)][Math.floor(x/N)];

  if (sprite.type == 'selected') { // If the sprite is already selected, deselect it
    
    gameState.levelLayout[Math.floor(y/N)][Math.floor(x/N)] = {
      type: sprite.pastType,
      pastType: null,
      src: spriteCodes[sprite.pastType]
    };

    gameState.selectedPosition = null;
    gameState.selected = null;

  } else if (sprite.type == 0 || sprite.type == 1) { // If the sprite is not selected, and is of a selectable type
    if(gameState.selected != null) { // and if there is already a selected sprite, swap that with this one
      
      gameState.levelLayout[gameState.selectedPosition.y][gameState.selectedPosition.x] = sprite;

      gameState.levelLayout[Math.floor(y/N)][Math.floor(x/N)] = {
        type: gameState.selected.pastType,
        pastType: null,
        src: spriteCodes[gameState.selected.pastType]
      };

      gameState.selectedPosition = null;
      gameState.selected = null;

    } else { // and if there is no selected sprite, set this one as selected
      
      gameState.levelLayout[Math.floor(y/N)][Math.floor(x/N)] = {
        type: 'selected',
        pastType: sprite.type,
        src: spriteCodes['selected']
      };

      gameState.selectedPosition = new Point(Math.floor(x/N), Math.floor(y/N));
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
  //ctx.clearRect(0, 0, canvas.width, canvas.height);

  if(gameState.levelLayout == null) {
    gameState.levelLayout = getLevel(10);
    gameState.levelCount++;
  }
  
  // Draw the sprites in the level
  for(let i = 0; i < gameState.levelLayout.length; i++) {
    let y = i + gameState.gameWindowStart.y;
    for(let j = 0; j < gameState.levelLayout[i].length; j++) {
      let x = j + gameState.gameWindowStart.x;
      drawSprite(ctx, spriteCodes[gameState.levelLayout[i][j].type], new Point(x*N, y*N), N-1, N-1);
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