const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const restartBtn = document.getElementById("restartBtn");
const jumpSound = document.getElementById("jumpSound");
const hitSound = document.getElementById("hitSound");

// ==================
// XBOX SUPPORT
// ==================
let paused = false;
let flapPressed = false;
let bWasPressed = false;

window.addEventListener("gamepadconnected", () => {
  console.log("Xbox Controller connected!");
});

// Resize for fullscreen/mobile
function resizeCanvas() {
  canvas.width = Math.min(window.innerWidth, 400);
  canvas.height = Math.min(window.innerHeight * 0.8, 500);
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

// Bird image
const birdImg = new Image();
birdImg.src = "Bird.png";

let bird, pipes, pipeSpeed, score, highScore, gameOver, frameCount;

highScore = localStorage.getItem("highScore") || 0;

function resetGame() {
  bird = {
    x: 50,
    y: canvas.height / 2,
    size: 32,
    velocity: 0,
    gravity: 0.6,
    jump: -10
  };

  pipes = [];
  pipeSpeed = 2;
  score = 0;
  gameOver = false;
  frameCount = 0;
  paused = false;
}

resetGame();

// ==================
// CONTROLS
// ==================
document.addEventListener("keydown", e => {
  if (e.code === "Space") jump();
  if (e.code === "Escape") paused = !paused;
});
canvas.addEventListener("mousedown", jump);
canvas.addEventListener("touchstart", jump);

function jump() {
  if (gameOver || paused) return;
  bird.velocity = bird.jump;
  jumpSound.currentTime = 0;
  jumpSound.play();
}

restartBtn.addEventListener("click", resetGame);

// ==================
// XBOX GAMEPAD LOOP
// ==================
setInterval(() => {
  const gp = navigator.getGamepads()[0];
  if (!gp) return;

  // A = Flap
  const aPressed = gp.buttons[0]?.pressed;
  if (aPressed && !flapPressed && !paused) {
    jump();
  }
  flapPressed = aPressed;

  // Left stick UP = Flap
  if (gp.axes[1] < -0.5 && !paused) {
    jump();
  }

  // B = Pause
  const bPressed = gp.buttons[1]?.pressed;
  if (bPressed && !bWasPressed) {
    paused = !paused;
  }
  bWasPressed = bPressed;

  // Start = Restart
  if (gp.buttons[9]?.pressed && gameOver) {
    resetGame();
  }

}, 100);

// ==================
// PIPES
// ==================
function addPipe() {
  let gap = 140;
  let topHeight = Math.random() * (canvas.height - gap - 100) + 20;

  pipes.push({
    x: canvas.width,
    top: topHeight,
    bottom: topHeight + gap,
    scored: false
  });
}

function endGame() {
  if (!gameOver) {
    gameOver = true;
    hitSound.currentTime = 0;
    hitSound.play();

    if (score > highScore) {
      highScore = score;
      localStorage.setItem("highScore", highScore);
    }
  }
}

// ==================
// GAME LOOP
// ==================
function update() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (!gameOver && !paused) {
    frameCount++;

    if (frameCount % 600 === 0) {
      pipeSpeed += 0.5;
    }

    // Bird physics
    bird.velocity += bird.gravity;
    bird.y += bird.velocity;

    ctx.drawImage(birdImg, bird.x, bird.y, bird.size, bird.size);

    if (bird.y < 0 || bird.y + bird.size > canvas.height) {
      endGame();
    }

    for (let p of pipes) {
      p.x -= pipeSpeed;

      ctx.fillStyle = "green";
      ctx.fillRect(p.x, 0, 50, p.top);
      ctx.fillRect(p.x, p.bottom, 50, canvas.height - p.bottom);

      if (
        bird.x < p.x + 50 &&
        bird.x + bird.size > p.x &&
        (bird.y < p.top || bird.y + bird.size > p.bottom)
      ) {
        endGame();
      }

      if (!p.scored && p.x + 50 < bird.x) {
        p.scored = true;
        score++;
      }
    }
  }

  // PAUSED
  if (paused && !gameOver) {
    ctx.fillStyle = "blue";
    ctx.font = "36px Arial";
    ctx.fillText("PAUSED", canvas.width / 2 - 80, canvas.height / 2);
  }

  // GAME OVER
  if (gameOver) {
    ctx.fillStyle = "red";
    ctx.font = "36px Arial";
    ctx.fillText("Game Over", canvas.width / 2 - 90, canvas.height / 2);
    ctx.font = "18px Arial";
    ctx.fillText("A / Restart", canvas.width / 2 - 50, canvas.height / 2 + 30);
  }

  // Score
  ctx.fillStyle = "black";
  ctx.font = "18px Arial";
  ctx.fillText("Score: " + score, 10, 25);
  ctx.fillText("High: " + highScore, 10, 50);

  // Controller Debug
  const gp = navigator.getGamepads()[0];
  ctx.fillText(gp ? "Controller: ON" : "Controller: OFF", 10, 75);

  requestAnimationFrame(update);
}

setInterval(() => {
  if (!gameOver && !paused) addPipe();
}, 2000);

update();
