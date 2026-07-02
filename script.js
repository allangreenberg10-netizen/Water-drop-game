// Variables to control game state
let gameRunning = false; // Keeps track of whether game is active or not
let dropMaker; // Will store our timer that creates drops regularly
let countdown;
const GAME_DURATION = 30;
let timeLeft = GAME_DURATION;
let score = 0; // Track the player's score
let timerElement = null;
let scoreElement = null;
let bubblesCreated = false;

function initElements() {
  if (!timerElement) timerElement = document.getElementById("timer");
  if (!scoreElement) scoreElement = document.getElementById("score");
  createBackgroundBubbles(12);
}

function createBackgroundBubbles(count = 10) {
  if (bubblesCreated) return;
  const container = document.getElementById('game-container');
  if (!container) return;
  bubblesCreated = true;
  for (let i = 0; i < count; i++) {
    const b = document.createElement('div');
    b.className = 'bg-bubble';
    const size = 60 + Math.random() * 220; // varied sizes
    b.style.width = b.style.height = `${size}px`;
    b.style.left = Math.random() * 100 + '%';
    b.style.top = Math.random() * 100 + '%';
    const duration = 18 + Math.random() * 28;
    b.style.animationDuration = `${duration}s`;
    b.style.opacity = 0.06 + Math.random() * 0.14;
    container.appendChild(b);
  }
}

// Update vertical progress bar based on score (target 20)
function updateProgress() {
  const fill = document.getElementById('progress-fill');
  if (!fill) return;
  const percent = Math.min(100, Math.round((score / 20) * 100));
  fill.style.height = percent + '%';
}

// Replace native alert with an in-game banner so any leftover alerts render as overlay
function _replaceAlertWithBanner(msg) {
  try {
    // remove any existing global banner
    const existing = document.querySelector('.banner-overlay');
    if (existing) existing.remove();

    const banner = document.createElement('div');
    banner.className = 'banner-overlay win';
    const inner = document.createElement('div');
    inner.className = 'banner-message';
    inner.textContent = msg;
    const closeBtn = document.createElement('button');
    closeBtn.className = 'banner-close';
    closeBtn.textContent = 'Close';
    closeBtn.addEventListener('click', () => banner.remove());
    banner.appendChild(inner);
    banner.appendChild(closeBtn);
    document.body.appendChild(banner);
  } catch (e) {
    console.log('alert:', msg);
  }
}
window.alert = _replaceAlertWithBanner;

// Winning and losing messages
const winningMessages = [
  "You're a water-saving hero! 💧",
  "Fantastic catch! Help us save water!",
  "Amazing! You've made a difference!",
  "You crushed it! Keep up the great work!",
  "Outstanding! You're a water drop champion!"
];

const losingMessages = [
  "Try again! Every drop counts! 💧",
  "Don't worry, you can do better next time!",
  "Keep practicing! You'll get there!",
  "Almost there! Give it another shot!",
  "Keep trying! Every effort helps!"
];

// Function to generate a clean, procedural popping sound
function playPopSound() {
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const oscillator = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();

  oscillator.type = "sine";
  // Start with a short pitch slide upward for a crisp "pop"
  oscillator.frequency.setValueAtTime(400, audioCtx.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.05);

  // Fast volume fade out so it sounds like a quick click/pop
  gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.08);

  oscillator.connect(gainNode);
  gainNode.connect(audioCtx.destination);

  oscillator.start();
  oscillator.stop(audioCtx.currentTime + 0.08);
}

// Attach start button handler: attach immediately if present, otherwise fall back to DOMContentLoaded
const _attachStartHandler = () => {
  const startBtn = document.getElementById("start-btn");
  if (startBtn) {
    startBtn.addEventListener("click", startGame);
    return true;
  }
  return false;
};

if (!_attachStartHandler()) {
  document.addEventListener('DOMContentLoaded', () => {
    if (!_attachStartHandler()) console.warn('Start button not found after DOMContentLoaded');
  });
}

function startGame() {
  console.log('startGame invoked, gameRunning=', gameRunning);
  initElements();
  // Prevent multiple games from running at once
  if (gameRunning) return;

  gameRunning = true;
  score = 0; // Reset score at start of new game
  scoreElement.textContent = score;
  timeLeft = GAME_DURATION;
  timerElement.textContent = timeLeft;

  // Reset progress bar
  const fill = document.getElementById('progress-fill');
  if (fill) fill.style.height = '0%';

  // Remove any existing global banner from previous games
  const oldBanner = document.querySelector('.banner-overlay');
  if (oldBanner) oldBanner.remove();

  // Create new drops more frequently so game is easier to win
  // Now spawning every 500ms instead of 1000ms
  dropMaker = setInterval(createDrop, 500);

  countdown = setInterval(() => {
    timeLeft--;
    timerElement.textContent = timeLeft;

    if (timeLeft <= 0) {
      clearInterval(countdown);
      endGame();
    }
  }, 1000);
}

function endGame() {
  // Stop creating new drops.
  if (typeof dropMaker !== "undefined") {
    clearInterval(dropMaker);
  }

  gameRunning = false;
  
  // Determine if player won (20 or more points) and show appropriate banner
  let message;
  let type;
  if (score >= 20) {
    const randomIndex = Math.floor(Math.random() * winningMessages.length);
    message = `🎉 ${winningMessages[randomIndex]} Final Score: ${score}`;
    type = 'win';
  } else {
    const randomIndex = Math.floor(Math.random() * losingMessages.length);
    message = `${losingMessages[randomIndex]} Final Score: ${score}`;
    type = 'lose';
  }

  showBanner(message, type);
}

// Show a styled banner inside the game container
function showBanner(message, type = 'win') {
  // global banner appended to body so it covers full viewport
  const existing = document.querySelector('.banner-overlay');
  if (existing) existing.remove();
  const banner = document.createElement('div');
  banner.className = `banner-overlay ${type}`;
  const msg = document.createElement('div');
  msg.className = 'banner-message';
  msg.textContent = message;
  const closeBtn = document.createElement('button');
  closeBtn.className = 'banner-close';
  closeBtn.textContent = 'Close';
  closeBtn.addEventListener('click', () => banner.remove());
  banner.appendChild(msg);
  banner.appendChild(closeBtn);
  // clicking outside the message (backdrop) closes the banner
  banner.addEventListener('click', (ev) => {
    if (ev.target === banner) banner.remove();
  });
  document.body.appendChild(banner);
}

function createDrop() {
  // Create a new div element that will be our water drop
  const drop = document.createElement("div");

  // Some drops are "bad" (remove points) — give them a red style.
  // ~25% chance to be a bad drop
  const isBad = Math.random() < 0.25;
  if (isBad) {
    drop.classList.add("red-drop");
    drop.dataset.bad = "true";
  } else {
    drop.classList.add("water-drop");
    drop.dataset.bad = "false";
  }

  // Make drops different sizes for visual variety
  const initialSize = 60;
  const sizeMultiplier = Math.random() * 0.8 + 0.5;
  const size = initialSize * sizeMultiplier;
  drop.style.width = drop.style.height = `${size}px`;

  // Position the drop randomly across the game width
  const container = document.getElementById("game-container");
  const gameWidth = container.offsetWidth;
  const xPosition = Math.random() * (gameWidth - size);
  drop.style.left = xPosition + "px";

  // Make drops fall for 4 seconds
  drop.style.animationDuration = "4s";

  // Click: play pop sound, spawn splash particles, burst animation, then remove drop
  drop.addEventListener("click", (e) => {
    // Only handle click if not already burst (prevent double-clicking)
    if (!drop.classList.contains("burst")) {
      // If it's a bad drop, subtract a point; otherwise add a point
      if (drop.dataset.bad === "true") {
        score = Math.max(0, score - 1);
      } else {
        score++;
      }

      scoreElement.textContent = score; // Update score display
      updateProgress();

      // If player reaches 20 points while the game is running, immediately win
      if (score >= 20 && gameRunning) {
        // Stop drop creation and countdown
        if (typeof dropMaker !== "undefined") clearInterval(dropMaker);
        if (typeof countdown !== "undefined") clearInterval(countdown);
        gameRunning = false;

        // Clear remaining drops
        document.querySelectorAll('#game-container .water-drop, #game-container .red-drop').forEach(d => d.remove());

        // Pick a random winning message and show as banner (include final score)
        const winIndex = Math.floor(Math.random() * winningMessages.length);
        const winMessage = `🎉 ${winningMessages[winIndex]} Final Score: ${score}`;
        // fill progress to 100% then show banner
        const fillEl = document.getElementById('progress-fill');
        if (fillEl) fillEl.style.height = '100%';
        showBanner(winMessage, 'win');
        return;
      }

      if (typeof playPopSound === "function") playPopSound();

      // Create splash particles inside the game container so coordinates are relative
      const dropRect = drop.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();

      // Compute center of the clicked drop relative to the container
      const centerX = dropRect.left - containerRect.left + dropRect.width / 2;
      const centerY = dropRect.top - containerRect.top + dropRect.height / 2;

      const particleCount = 8;
      for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement("div");
        particle.classList.add("splash-particle");

        // Match the color of the parent drop
        if (drop.classList.contains("red-drop")) {
          particle.style.background = "#ff4d4d";
        } else {
          particle.style.background = "#74ccf4";
        }

        // Position particle at the center of the clicked drop (relative to container)
        particle.style.left = centerX + "px";
        particle.style.top = centerY + "px";

        // Calculate a random circular direction to shoot outward
        const angle = (i / particleCount) * Math.PI * 2 + Math.random() * 0.5;
        const distance = 30 + Math.random() * 40; // Distance traveled in pixels
        const x = Math.cos(angle) * distance;
        const y = Math.sin(angle) * distance;

        // Pass these coordinates directly to the CSS animation
        particle.style.setProperty("--x", `${x}px`);
        particle.style.setProperty("--y", `${y}px`);

        // Add particle to the game container and delete it once the animation finishes
        container.appendChild(particle);
        setTimeout(() => particle.remove(), 400);
      }

      drop.classList.add("burst");

      setTimeout(() => {
        drop.remove();
      }, 200);
    }
  });

  // Add the new drop to the game screen
  container.appendChild(drop);

  // Remove drops that reach the bottom (weren't clicked)
  drop.addEventListener("animationend", () => {
    drop.remove(); // Clean up drops that weren't caught
  });
}
