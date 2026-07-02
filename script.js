// Variables to control game state
let gameRunning = false;
let dropMaker;
let countdown;
const GAME_DURATION = 30;
let timeLeft = GAME_DURATION;
let score = 0;
let timerElement = null;
let scoreElement = null;
let bubblesCreated = false;

// Difficulty / gameplay tuning variables
let difficulty = 'normal';
let spawnIntervalMs = 500;
let dropFallDuration = 4; // seconds
let badDropChance = 0.25;

function initElements() {
  if (!timerElement) timerElement = document.getElementById('timer');
  if (!scoreElement) scoreElement = document.getElementById('score');
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
    const size = 60 + Math.random() * 220;
    b.style.width = b.style.height = `${size}px`;
    b.style.left = Math.random() * 100 + '%';
    b.style.top = Math.random() * 100 + '%';
    const duration = 18 + Math.random() * 28;
    b.style.animationDuration = `${duration}s`;
    b.style.opacity = 0.06 + Math.random() * 0.14;
    container.appendChild(b);
  }
}

function updateProgress() {
  const fill = document.getElementById('progress-fill');
  if (!fill) return;
  const percent = Math.min(100, Math.round((score / 20) * 100));
  fill.style.height = percent + '%';
}

function _replaceAlertWithBanner(msg) {
  try {
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

function playPopSound() {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(400, audioCtx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.05);
    gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.08);
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.08);
  } catch (e) {
    // ignore audio issues
  }
}

// Attach start/reset handlers (safe to call multiple times)
const _attachStartHandler = () => {
  const startBtn = document.getElementById('start-btn');
  if (startBtn) {
    startBtn.addEventListener('click', startGame);
    return true;
  }
  return false;
};

const _attachResetHandler = () => {
  const resetBtn = document.getElementById('reset-btn');
  if (resetBtn) {
    resetBtn.addEventListener('click', resetGame);
    return true;
  }
  return false;
};

function resetGame() {
  initElements();
  if (typeof dropMaker !== 'undefined') {
    clearInterval(dropMaker);
    dropMaker = undefined;
  }
  if (typeof countdown !== 'undefined') {
    clearInterval(countdown);
    countdown = undefined;
  }
  gameRunning = false;
  score = 0;
  timeLeft = GAME_DURATION;
  if (scoreElement) scoreElement.textContent = score;
  if (timerElement) timerElement.textContent = timeLeft;
  document.querySelectorAll('#game-container .water-drop, #game-container .red-drop, #game-container .splash-particle').forEach(el => el.remove());
  const fill = document.getElementById('progress-fill');
  if (fill) fill.style.height = '0%';
  const banner = document.querySelector('.banner-overlay');
  if (banner) banner.remove();
}

function startGame() {
  initElements();
  if (gameRunning) return;
  gameRunning = true;
  score = 0;
  if (scoreElement) scoreElement.textContent = score;
  timeLeft = GAME_DURATION;
  if (timerElement) timerElement.textContent = timeLeft;
  const fill = document.getElementById('progress-fill');
  if (fill) fill.style.height = '0%';
  const oldBanner = document.querySelector('.banner-overlay');
  if (oldBanner) oldBanner.remove();
  dropMaker = setInterval(createDrop, spawnIntervalMs);
  countdown = setInterval(() => {
    timeLeft--;
    if (timerElement) timerElement.textContent = timeLeft;
    if (timeLeft <= 0) {
      clearInterval(countdown);
      endGame();
    }
  }, 1000);
}

function endGame() {
  if (typeof dropMaker !== 'undefined') clearInterval(dropMaker);
  gameRunning = false;
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

function showBanner(message, type = 'win') {
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
  banner.addEventListener('click', (ev) => { if (ev.target === banner) banner.remove(); });
  document.body.appendChild(banner);
}

function createDrop() {
  const drop = document.createElement('div');
  const isBad = Math.random() < badDropChance;
  if (isBad) {
    drop.classList.add('red-drop');
    drop.dataset.bad = 'true';
  } else {
    drop.classList.add('water-drop');
    drop.dataset.bad = 'false';
  }
  const initialSize = 60;
  const sizeMultiplier = Math.random() * 0.8 + 0.5;
  const size = initialSize * sizeMultiplier;
  drop.style.width = drop.style.height = `${size}px`;
  const container = document.getElementById('game-container');
  if (!container) return;
  const gameWidth = container.offsetWidth;
  const xPosition = Math.random() * (gameWidth - size);
  drop.style.left = xPosition + 'px';
  drop.style.animationDuration = `${dropFallDuration}s`;
  drop.addEventListener('click', () => {
    if (!drop.classList.contains('burst')) {
      if (drop.dataset.bad === 'true') score = Math.max(0, score - 1);
      else score++;
      if (scoreElement) scoreElement.textContent = score;
      updateProgress();
      if (score >= 20 && gameRunning) {
        if (typeof dropMaker !== 'undefined') clearInterval(dropMaker);
        if (typeof countdown !== 'undefined') clearInterval(countdown);
        gameRunning = false;
        document.querySelectorAll('#game-container .water-drop, #game-container .red-drop').forEach(d => d.remove());
        const winIndex = Math.floor(Math.random() * winningMessages.length);
        const winMessage = `🎉 ${winningMessages[winIndex]} Final Score: ${score}`;
        const fillEl = document.getElementById('progress-fill'); if (fillEl) fillEl.style.height = '100%';
        showBanner(winMessage, 'win');
        return;
      }
      playPopSound();
      const dropRect = drop.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      const centerX = dropRect.left - containerRect.left + dropRect.width / 2;
      const centerY = dropRect.top - containerRect.top + dropRect.height / 2;
      const particleCount = 8;
      for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.classList.add('splash-particle');
        particle.style.background = drop.classList.contains('red-drop') ? '#ff4d4d' : '#74ccf4';
        particle.style.left = centerX + 'px';
        particle.style.top = centerY + 'px';
        const angle = (i / particleCount) * Math.PI * 2 + Math.random() * 0.5;
        const distance = 30 + Math.random() * 40;
        const x = Math.cos(angle) * distance;
        const y = Math.sin(angle) * distance;
        particle.style.setProperty('--x', `${x}px`);
        particle.style.setProperty('--y', `${y}px`);
        container.appendChild(particle);
        setTimeout(() => particle.remove(), 400);
      }
      drop.classList.add('burst');
      setTimeout(() => drop.remove(), 200);
    }
  });
  container.appendChild(drop);
  drop.addEventListener('animationend', () => drop.remove());
}

function applyDifficulty(selected) {
  difficulty = selected;
  if (difficulty === 'easy') {
    spawnIntervalMs = 800; dropFallDuration = 5; badDropChance = 0.15;
  } else if (difficulty === 'hard') {
    spawnIntervalMs = 350; dropFallDuration = 3.2; badDropChance = 0.35;
  } else { spawnIntervalMs = 500; dropFallDuration = 4; badDropChance = 0.25; }
  if (gameRunning) {
    if (typeof dropMaker !== 'undefined') clearInterval(dropMaker);
    dropMaker = setInterval(createDrop, spawnIntervalMs);
  }
}

function attachDifficultyHandlers() {
  const buttons = document.querySelectorAll('.difficulty-btn');
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      const sel = btn.dataset.difficulty;
      applyDifficulty(sel);
      buttons.forEach(b => { b.classList.toggle('active', b === btn); b.setAttribute('aria-selected', b === btn ? 'true' : 'false'); });
        const colorMap = { easy: 'rgba(79,203,83,0.36)', normal: 'rgba(46,157,247,0.34)', hard: 'rgba(245,64,44,0.32)' };
        pressButtonVisual(btn);
        const c = colorMap[sel] || 'rgba(46,157,247,0.34)';
        flashScreen(c, 420);
        showDifficultyFlash(sel.toUpperCase(), c);
    });
  });
}

// Visual helpers
function flashScreen(color = 'rgba(46,157,247,0.15)', duration = 360) {
  const flash = document.createElement('div'); flash.className = 'screen-flash'; flash.style.background = color; document.body.appendChild(flash);
  setTimeout(() => flash.remove(), duration + 40);
}
function pressButtonVisual(btn) { if (!btn) return; btn.classList.add('btn-press'); setTimeout(() => btn.classList.remove('btn-press'), 240); }

// Show a centered difficulty label briefly
function showDifficultyFlash(text, bg) {
  const el = document.createElement('div');
  el.className = 'difficulty-flash';
  el.textContent = text;
  el.style.background = bg || 'rgba(46,157,247,0.34)';
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 600);
}

// Init handlers on load (run immediately if possible, fallback to DOMContentLoaded)
function initUI() {
  _attachStartHandler();
  _attachResetHandler();
  attachDifficultyHandlers();
  applyDifficulty(difficulty);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initUI);
} else {
  initUI();
}
