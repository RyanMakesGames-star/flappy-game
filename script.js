const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const restartBtn = document.getElementById("restartBtn");
const jumpSound = document.getElementById("jumpSound");
const hitSound = document.getElementById("hitSound");

// Resize for fullscreen/mobile
function resizeCanvas() {
  canvas.width = Math.min(window.innerWidth, 400);
  canvas.height = Math.min(window.innerHeight * 0.8, 500);
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

// Bird image
const birdImg = new Image();
birdImg.src = "Bird.png"; // YOUR uploaded bird

let bird, pipes, pipeSpeed, score, highScore, gameOver, frameCount;
let paused = false;

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

// Controls
document.addEventListener("keydown", e => {
  if (e.code === "Space") jump();
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

// Pipes
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

// 🎮 GAMEPAD SUPPORT
function handleGamepad() {
  const gp = navigator.getGamepads()[0];
  if (!gp) return;

  // A button = Jump (button 0)
  if (gp.buttons[0].pressed) {
    jump();
  }

  // B button = Pause (button 1)
  if (gp.buttons[1].pressed) {
    paused = !paused;

    // simple debounce
    setTimeout(() => {}, 200);
  }
}

function update() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 🎮 Read controller
  handleGamepad();

  // Controller Debug (BIG + BRIGHT)
  const gp = navigator.getGamepads()[0];
  ctx.fillStyle = "yellow";
  ctx.font = "20px Arial";
  ctx.fillText(
    gp ? "Controller: ON" : "Controller: OFF",
    10,
    100
  );

  if (paused && !gameOver) {
    ctx.fillStyle = "orange";
    ctx.font = "36px Arial";
    ctx.fillText("PAUSED", canvas.width / 2 - 70, canvas.height / 2);
    requestAnimationFrame(update);
    return;
  }

  if (!gameOver) {
    frameCount++;

    // Harder over time 😈
    if (frameCount % 600 === 0) {
      pipeSpeed += 0.5;
    }

    // Bird physics
    bird.velocity += bird.gravity;
    bird.y += bird.velocity;

    // Draw bird
    ctx.drawImage(birdImg, bird.x, bird.y, bird.size, bird.size);

    // Ground / ceiling
    if (bird.y < 0 || bird.y + bird.size > canvas.height) {
      endGame();
    }

    // Pipes
    for (let p of pipes) {
      p.x -= pipeSpeed;

      ctx.fillStyle = "green";
      ctx.fillRect(p.x, 0, 50, p.top);
      ctx.fillRect(p.x, p.bottom, 50, canvas.height - p.bottom);

      // Collision
      if (
        bird.x < p.x + 50 &&
        bird.x + bird.size > p.x &&
        (bird.y < p.top || bird.y + bird.size > p.bottom)
      ) {
        endGame();
      }

      // Score
      if (!p.scored && p.x + 50 < bird.x) {
        p.scored = true;
        score++;
      }
    }
  } else {
    ctx.fillStyle = "red";
    ctx.font = "36px Arial";
    ctx.fillText("Game Over", canvas.width / 2 - 90, canvas.height / 2);
    ctx.font = "18px Arial";
    ctx.fillText("Tap Restart", canvas.width / 2 - 50, canvas.height / 2 + 30);
  }

  // Score text
  ctx.fillStyle = "black";
  ctx.font = "18px Arial";
  ctx.fillText("Score: " + score, 10, 25);
  ctx.fillText("High: " + highScore, 10, 50);

  requestAnimationFrame(update);
}

setInterval(() => {
  if (!gameOver && !paused) addPipe();
}, 2000);

update();
