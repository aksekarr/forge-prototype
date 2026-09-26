// Edit these scene-relative positions to match changes to the artwork.
const SCENES = [
  { name: 'clearing', file: 'scene-clearing.png', creature: { x: 53, y: 75 }, ghost: { x: 85, y: 19 }, sword: { x: 16, y: 21 }, glowPoints: [{ x: 68, y: 84 }, { x: 81, y: 83 }, { x: 12, y: 73 }, { x: 7, y: 74 }, { x: 89, y: 51 }, { x: 95, y: 43 }, { x: 77, y: 34 }, { x: 10, y: 42 }, { x: 3, y: 52 }, { x: 16, y: 88 }, { x: 8, y: 90 }, { x: 7, y: 86 }], glintPoints: [{ x: 22, y: 52 }, { x: 14, y: 55 }, { x: 17, y: 49 }, { x: 16, y: 46 }, { x: 37, y: 38 }, { x: 38, y: 34 }] },
  { name: 'hollow', file: 'scene-hollow.png', creature: { x: 50, y: 75 }, ghost: { x: 78, y: 18 }, sword: { x: 14, y: 22 }, glowPoints: [{ x: 95, y: 54 }, { x: 85, y: 41 }, { x: 81, y: 43 }, { x: 93, y: 71 }, { x: 84, y: 81 }, { x: 77, y: 78 }, { x: 24, y: 82 }, { x: 18, y: 80 }, { x: 10, y: 57 }, { x: 14, y: 43 }, { x: 17, y: 45 }, { x: 58, y: 4 }, { x: 75, y: 4 }], glintPoints: [{ x: 28, y: 11 }, { x: 38, y: 16 }, { x: 32, y: 19 }, { x: 43, y: 26 }, { x: 31, y: 30 }, { x: 18, y: 79 }, { x: 26, y: 85 }, { x: 74, y: 85 }, { x: 90, y: 78 }, { x: 96, y: 56 }, { x: 91, y: 49 }] },
  { name: 'stream', file: 'scene-stream.png', creature: { x: 34, y: 63 }, ghost: { x: 82, y: 23 }, sword: { x: 15, y: 21 }, glowPoints: [{ x: 95, y: 89 }, { x: 95, y: 85 }, { x: 36, y: 79 }, { x: 41, y: 82 }, { x: 13, y: 68 }, { x: 3, y: 55 }, { x: 97, y: 37 }], glintPoints: [{ x: 74, y: 39 }, { x: 76, y: 34 }, { x: 96, y: 52 }, { x: 73, y: 47 }, { x: 84, y: 53 }, { x: 93, y: 61 }, { x: 91, y: 68 }, { x: 83, y: 63 }, { x: 71, y: 74 }, { x: 67, y: 35 }, { x: 93, y: 56 }, { x: 89, y: 48 }] },
];

const AMBIENT_CONFIG = {
  maxParticles: 60,
  fireflies: { count: 12, speed: 7, radius: 1.8, opacity: .82, colours: ['#ffd978', '#d7ecff'], blinkSpeed: [1.1, 2.3] },
  petals: { count: 10, speed: [9, 17], sway: 16, opacity: .78, colour: '#f2a3bd', size: [3, 2] },
  flowerGlows: { radius: 34, opacity: .24, pulseSpeed: .65, colour: '#ffdca0' },
  waterGlints: { interval: [500, 1200], radius: 22, opacity: .8, colour: '#d9f6ff', lifetime: .7 },
  shafts: { opacity: .13, pulseSpeed: .22, colour: '#fff4c8' },
  creatureSparks: { interval: [6000, 10000], count: [4, 6], speed: [18, 35], spread: 8, lifetime: 1.3, colours: ['#ffd76e', '#ffb65c'] },
  swordGlint: { interval: [7000, 10000], opacity: .85, colour: '#fff4b0', lifetime: .9 },
  ghostWisps: { interval: [2600, 4800], count: 2, spread: 7, lifetime: 1.3, colour: '#d9eff7', opacity: .38 },
  scenes: {
    clearing: { petals: true, shafts: true }, hollow: { petals: false, shafts: true }, stream: { petals: true, shafts: false },
  },
};

const ANIMATION_TIMINGS = {
  forgePulse: 800, forgeCool: 600, strikeCharge: 600, strikeHold: 300, strikeDrive: 250,
  strikeHitStop: 120, strikeGlitch: 800, strikeFade: 250,
  hatchRock: 2000, hatchPause: 500, hatchJolt: 2500, hatchMotion: 5000, hatchFlash: 300, hatchLand: 700,
  evolveGather: 1500, evolveSilhouetteHold: 500, evolveFlicker: 3000, evolveFlash: 300, evolveReveal: 1700, evolveEmbers: 2000,
  sceneShake: 300,
  layoutGhostReturn: 1500,
  finalFlash: 420,
};
const FRAME_OPENING_INSETS = { top: 4.878, right: 6.442, bottom: 5.327, left: 6.442 };
const DEMO_OATH_SCROLL_DURATION = 2000;
const DEMO_OATH_FADE_DURATION = 1200;
Object.entries(ANIMATION_TIMINGS).forEach(([name, milliseconds]) => {
  document.documentElement.style.setProperty(`--${name.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`)}`, `${milliseconds}ms`);
});
Object.entries(FRAME_OPENING_INSETS).forEach(([edge, value]) => {
  document.documentElement.style.setProperty(`--frame-${edge}`, `${value}%`);
});
document.documentElement.style.setProperty('--demo-oath-fade-duration', `${DEMO_OATH_FADE_DURATION}ms`);

const TASKS = ['Warm-ups', 'Hey Joe practice', 'Logic session', 'Read'];
const DEMO_TASKS = ['Work out', 'Read 10 pages', 'Practise your craft'];
const STORAGE_KEY = 'seven-days-prototype';
const CREATURE_SCALE = 0.46;
const SWORD_REVEALS = [0, 22, 40, 70, 100];
const DEMO_SWORD_REVEALS = [0, 40, 70, 100];
const DEMO_STATE_VERSION = 1;
const STAGE_TWO_IDLE_SEQUENCE = Object.freeze([
  [1, 500], [2, 450], [1, 350], [4, 450], [1, 500],
  [2, 450], [3, 140], [1, 350], [4, 450],
]);
const STAGE_TWO_IDLE_FILES = Object.freeze(
  Array.from({ length: 4 }, (_, index) => `stage-2-idle-${index + 1}.png`),
);
const STAGE_TWO_IDLE_CANVAS_WIDTH = 418;
const STAGE_TWO_ORIGINAL_WIDTH = 509;
const STAGE_TWO_ORIGINAL_OPAQUE_HEIGHT = 532;
const STAGE_TWO_IDLE_OPAQUE_HEIGHT = 433;
const STAGE_TWO_IDLE_WIDTH_SCALE = (STAGE_TWO_ORIGINAL_OPAQUE_HEIGHT / STAGE_TWO_IDLE_OPAQUE_HEIGHT)
  * (STAGE_TWO_IDLE_CANVAS_WIDTH / STAGE_TWO_ORIGINAL_WIDTH);
const CREATURES = [
  { file: 'egg.png', width: 829 },
  ...Array.from({ length: 7 }, (_, index) => ({
    file: index === 1 ? STAGE_TWO_IDLE_FILES[0] : `stage-${index + 1}.png`,
    width: [456, STAGE_TWO_ORIGINAL_WIDTH * STAGE_TWO_IDLE_WIDTH_SCALE, 648, 919, 974, 1056, 1193][index],
  })),
];

const STAGE_ONE = CREATURES[1];
const EGG_WIDTH_PERCENT = ((STAGE_ONE.width / 1024) * CREATURE_SCALE * (442 / 456)) * (829 / 1033) * 100;

const params = new URLSearchParams(window.location.search);
const isLayoutMode = params.get('layout') === '1';
const isDemoMode = params.get('demo') === '1';
const ACTIVE_STORAGE_KEY = isDemoMode ? `${STORAGE_KEY}-demo` : STORAGE_KEY;
if (!isLayoutMode) document.querySelector('#layout-tools').remove();
if (!isDemoMode) {
  document.querySelector('#demo-panel').remove();
  document.querySelector('#demo-badge').remove();
  document.querySelector('#demo-oath').remove();
} else {
  document.querySelector('#oath-card').remove();
}
if (params.get('reset') === '1' && !isLayoutMode) {
  localStorage.removeItem(ACTIVE_STORAGE_KEY);
  window.location.replace(`${window.location.pathname}${params.has('today') ? `?today=${params.get('today')}` : ''}`);
}

function localDateString(date = new Date()) {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

const override = /^\d{4}-\d{2}-\d{2}$/.test(params.get('today') || '') ? params.get('today') : null;
const realToday = override || localDateString();

function loadState() {
  const stored = localStorage.getItem(ACTIVE_STORAGE_KEY);
  if (stored) {
    const parsed = JSON.parse(stored);
    const hasCurrentDemoTasks = parsed.demoStateVersion === DEMO_STATE_VERSION
      && Array.isArray(parsed.demoTaskStructure)
      && parsed.demoTaskStructure.length === DEMO_TASKS.length
      && parsed.demoTaskStructure.every((task, index) => task === DEMO_TASKS[index]);
    if (!isDemoMode || hasCurrentDemoTasks) return parsed;
  }
  const firstDay = isDemoMode ? localDateString() : realToday;
  const state = { firstDay, days: {}, ...(isDemoMode ? { simulatedDate: firstDay, demoStateVersion: DEMO_STATE_VERSION, demoTaskStructure: [...DEMO_TASKS] } : {}) };
  if (!isLayoutMode) localStorage.setItem(ACTIVE_STORAGE_KEY, JSON.stringify(state));
  return state;
}
let state = loadState();
let today = isDemoMode ? state.simulatedDate : realToday;
let activeSequence = null;
let layoutPoints = null;
let layoutSceneName = null;
let layoutPreview = null;
let layoutGlowPoints = [];
let layoutGlintPoints = [];
let layoutMode = 'sprites';
let layoutGhostCooldown = false;
let hasInitialPlacement = false;
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const stageTwoIdleFrames = STAGE_TWO_IDLE_FILES.map((file, index) => {
  const image = document.createElement('img');
  image.className = 'sprite creature stage-two stage-two-idle-frame';
  image.src = `assets/${file}`;
  image.alt = index === 0 ? 'Creature' : '';
  image.decoding = 'async';
  image.loading = 'eager';
  image.hidden = true;
  document.querySelector('#evolution-form').before(image);
  return image;
});
let stageTwoIdleStep = 0;
let stageTwoIdleTimer = null;

function showStageTwoIdleFrame(frameNumber) {
  stageTwoIdleFrames.forEach((frame, index) => { frame.hidden = index !== frameNumber - 1; });
}

function stopStageTwoIdleLoop() {
  if (stageTwoIdleTimer !== null) window.clearTimeout(stageTwoIdleTimer);
  stageTwoIdleTimer = null;
  stageTwoIdleStep = 0;
}

function runStageTwoIdleStep() {
  const [frameNumber, duration] = STAGE_TWO_IDLE_SEQUENCE[stageTwoIdleStep];
  showStageTwoIdleFrame(frameNumber);
  stageTwoIdleStep = (stageTwoIdleStep + 1) % STAGE_TWO_IDLE_SEQUENCE.length;
  stageTwoIdleTimer = window.setTimeout(() => {
    stageTwoIdleTimer = null;
    runStageTwoIdleStep();
  }, duration);
}

function updateStageTwoIdleLoop(showFrames, playLoop) {
  if (!showFrames) {
    stopStageTwoIdleLoop();
    stageTwoIdleFrames.forEach(frame => { frame.hidden = true; });
    return;
  }
  if (!playLoop || reduceMotion) {
    stopStageTwoIdleLoop();
    showStageTwoIdleFrame(1);
  } else if (stageTwoIdleTimer === null) {
    stageTwoIdleStep = 0;
    runStageTwoIdleStep();
  }
}

function visibleCreature() {
  return stageTwoIdleFrames.find(frame => !frame.hidden) || document.querySelector('#creature');
}

function save() { if (!isLayoutMode) localStorage.setItem(ACTIVE_STORAGE_KEY, JSON.stringify(state)); }
function dayOffset(date) {
  const [y, m, d] = date.split('-').map(Number);
  const [fy, fm, fd] = state.firstDay.split('-').map(Number);
  return Math.round((new Date(y, m - 1, d) - new Date(fy, fm - 1, fd)) / 86400000);
}
function todayTasks() { return state.days[today]?.tasks || {}; }
function currentTasks() { return isDemoMode ? DEMO_TASKS : TASKS; }
function currentSwordReveals() { return isDemoMode ? DEMO_SWORD_REVEALS : SWORD_REVEALS; }
function completedCount(tasks) { return currentTasks().filter(task => tasks[task]).length; }
function isComplete(tasks) { return completedCount(tasks) === currentTasks().length; }
function completedDays() { return Object.values(state.days).filter(day => isComplete(day.tasks || {})).length; }
function stage() { return Math.min(7, completedDays()); }
function recordDate(offset) {
  const [y, m, d] = state.firstDay.split('-').map(Number);
  const date = new Date(y, m - 1, d + offset);
  return localDateString(date);
}
function formatDate(date) {
  const [y, m, d] = date.split('-').map(Number);
  return new Intl.DateTimeFormat(undefined, { weekday: 'long', month: 'short', day: 'numeric' }).format(new Date(y, m - 1, d));
}

function addLocalDays(dateString, days) {
  const [year, month, day] = dateString.split('-').map(Number);
  return localDateString(new Date(year, month - 1, day + days));
}

function copyPoints(points) {
  return Object.fromEntries(Object.entries(points).map(([name, point]) => [name, { ...point }]));
}

function layoutConfigLiteral(sceneConfig) {
  const point = name => `{ x: ${Math.round(layoutPoints[name].x)}, y: ${Math.round(layoutPoints[name].y)} }`;
  const list = name => `[${(name === 'glowPoints' ? layoutGlowPoints : layoutGlintPoints).map(item => `{ x: ${Math.round(item.x)}, y: ${Math.round(item.y)} }`).join(', ')}]`;
  return `{ name: '${sceneConfig.name}', file: '${sceneConfig.file}', creature: ${point('creature')}, ghost: ${point('ghost')}, sword: ${point('sword')}, glowPoints: ${list('glowPoints')}, glintPoints: ${list('glintPoints')} }`;
}

function updateLayoutReadout(sceneConfig) {
  if (!isLayoutMode) return;
  document.querySelector('#layout-readout').textContent = `${sceneConfig.name}: creature (${Math.round(layoutPoints.creature.x)}, ${Math.round(layoutPoints.creature.y)}) · ghost (${Math.round(layoutPoints.ghost.x)}, ${Math.round(layoutPoints.ghost.y)}) · sword (${Math.round(layoutPoints.sword.x)}, ${Math.round(layoutPoints.sword.y)})`;
}

function applyPositions(sceneConfig) {
  const points = isLayoutMode ? layoutPoints : sceneConfig;
  const scene = document.querySelector('#scene');
  const bounds = scene.getBoundingClientRect();
  for (const name of ['creature', 'ghost', 'sword']) {
    scene.style.setProperty(`--${name}-x`, `${bounds.width * points[name].x / 100}px`);
    scene.style.setProperty(`--${name}-y`, `${bounds.height * points[name].y / 100}px`);
  }
  updateLayoutReadout(sceneConfig);
}

function recalculateScenePositions() {
  applyPositions(currentSceneConfig());
}

function currentSceneConfig() { return SCENES[Math.max(0, dayOffset(today)) % SCENES.length]; }
function wait(milliseconds) { return new Promise(resolve => window.setTimeout(resolve, reduceMotion ? Math.min(180, milliseconds) : milliseconds)); }
async function waitForVisualCompletion(elements) {
  const animations = elements.flatMap(element => element.getAnimations().filter(animation => animation.playState !== 'finished'));
  await Promise.all(animations.map(animation => animation.finished.catch(() => undefined)));
  await new Promise(resolve => requestAnimationFrame(resolve));
}
function particleBurst(x, y, count, star = false, kind = '', colours = [], upward = false) {
  if (reduceMotion) return;
  const layer = document.querySelector('#particles');
  for (let index = 0; index < count; index += 1) {
    const particle = document.createElement('i');
    const angle = upward ? Math.PI + Math.random() * Math.PI : kind === 'shell' ? Math.random() * Math.PI : Math.random() * Math.PI * 2;
    const distance = (star ? 22 : 12) + Math.random() * (star ? 48 : 26);
    particle.className = `spark${star ? ' star' : ''}${kind ? ` ${kind}` : ''}`;
    particle.style.setProperty('--x', `${x}%`);
    particle.style.setProperty('--y', `${y}%`);
    particle.style.setProperty('--dx', `${Math.cos(angle) * distance}px`);
    particle.style.setProperty('--dy', `${Math.sin(angle) * distance}px`);
    const life = kind === 'ember' ? 1.5 + Math.random() * .5 : kind === 'ghost-bit' ? .65 + Math.random() * .25 : kind === 'shell' ? .7 + Math.random() * .3 : star ? .6 + Math.random() * .35 : .35 + Math.random() * .3;
    particle.style.setProperty('--life', `${life}s`);
    if (colours.length) particle.style.color = particle.style.background = colours[Math.floor(Math.random() * colours.length)];
    layer.append(particle);
    particle.addEventListener('animationend', () => particle.remove(), { once: true });
  }
}

function swordEdgePoint(reveal) {
  const sceneBox = document.querySelector('#scene').getBoundingClientRect();
  const swordBox = document.querySelector('#sword').getBoundingClientRect();
  return {
    x: ((swordBox.left + swordBox.width / 2 - sceneBox.left) / sceneBox.width) * 100,
    y: ((swordBox.top + swordBox.height * (1 - reveal / 100) - sceneBox.top) / sceneBox.height) * 100,
  };
}

function swordSparkPoint(reveal) {
  const sceneBox = document.querySelector('#scene').getBoundingClientRect();
  const swordBox = document.querySelector('#sword').getBoundingClientRect();
  const visibleStart = swordBox.top + swordBox.height * (1 - reveal / 100);
  return {
    x: ((swordBox.left + swordBox.width * (.35 + Math.random() * .3) - sceneBox.left) / sceneBox.width) * 100,
    y: ((visibleStart + Math.random() * (swordBox.bottom - visibleStart) - sceneBox.top) / sceneBox.height) * 100,
  };
}

function setSwordShimmer(reveal) {
  const scene = document.querySelector('#scene');
  const sceneBox = scene.getBoundingClientRect();
  const swordBox = document.querySelector('#sword').getBoundingClientRect();
  const top = swordBox.top + swordBox.height * (1 - reveal / 100);
  scene.style.setProperty('--shimmer-x', `${((swordBox.left - sceneBox.left) / sceneBox.width) * 100}%`);
  scene.style.setProperty('--shimmer-y', `${((top - sceneBox.top) / sceneBox.height) * 100}%`);
  scene.style.setProperty('--shimmer-width', `${(swordBox.width / sceneBox.width) * 100}%`);
  scene.style.setProperty('--shimmer-height', `${((swordBox.bottom - top) / sceneBox.height) * 100}%`);
}

function swirlGather(x, y) {
  if (reduceMotion) return;
  const layer = document.querySelector('#particles');
  for (let index = 0; index < 16; index += 1) {
    const angle = (index / 16) * Math.PI * 2;
    const radius = 38 + Math.random() * 30;
    const particle = document.createElement('i');
    particle.className = 'spark gather';
    particle.style.setProperty('--x', `${x + Math.cos(angle) * 13}%`);
    particle.style.setProperty('--y', `${y + Math.sin(angle) * 9}%`);
    particle.style.setProperty('--dx', `${-Math.cos(angle) * radius}px`);
    particle.style.setProperty('--dy', `${-Math.sin(angle) * radius}px`);
    particle.style.setProperty('--life', `${.9 + Math.random() * .55}s`);
    layer.append(particle);
    particle.addEventListener('animationend', () => particle.remove(), { once: true });
  }
}

function creatureCenter() {
  const sceneBox = document.querySelector('#scene').getBoundingClientRect();
  const creatureBox = visibleCreature().getBoundingClientRect();
  return {
    x: ((creatureBox.left + creatureBox.width / 2 - sceneBox.left) / sceneBox.width) * 100,
    y: ((creatureBox.top + creatureBox.height / 2 - sceneBox.top) / sceneBox.height) * 100,
  };
}

function creatureGroundPoint() {
  const sceneBox = document.querySelector('#scene').getBoundingClientRect();
  const creatureBox = visibleCreature().getBoundingClientRect();
  return {
    x: ((creatureBox.left + creatureBox.width / 2 - sceneBox.left) / sceneBox.width) * 100,
    y: ((creatureBox.bottom - sceneBox.top) / sceneBox.height) * 100,
  };
}

function setEffectCenter(point) {
  const scene = document.querySelector('#scene');
  scene.style.setProperty('--effect-x', `${point.x}%`);
  scene.style.setProperty('--effect-y', `${point.y}%`);
}

function pulseSilhouette() {
  const visible = document.querySelector('#evolution-form').style.opacity === '1' ? document.querySelector('#evolution-form') : visibleCreature();
  visible.classList.remove('swap-pulse');
  void visible.offsetWidth;
  visible.classList.add('swap-pulse');
}

function showGhostGlitch() {
  const sceneBox = document.querySelector('#scene').getBoundingClientRect();
  const ghostBox = document.querySelector('#ghost').getBoundingClientRect();
  const glitch = document.querySelector('#ghost-glitch');
  const scene = document.querySelector('#scene');
  scene.style.setProperty('--glitch-x', `${((ghostBox.left + ghostBox.width / 2 - sceneBox.left) / sceneBox.width) * 100}%`);
  scene.style.setProperty('--glitch-y', `${((ghostBox.top + ghostBox.height / 2 - sceneBox.top) / sceneBox.height) * 100}%`);
  scene.style.setProperty('--glitch-width', `${(ghostBox.width / sceneBox.width) * 100}%`);
  scene.style.setProperty('--glitch-height', `${(ghostBox.height / sceneBox.height) * 100}%`);
  glitch.innerHTML = Array.from({ length: 6 }, (_, index) => `<i class="ghost-slice" style="--slice:${index};--delay:${index * 35}ms;top:${index * 16.7}%"></i>`).join('');
}
function clearGhostGlitch() { document.querySelector('#ghost-glitch').replaceChildren(); }

function playSceneShake() {
  const scene = document.querySelector('#scene');
  scene.classList.remove('scene-shake');
  void scene.offsetWidth;
  scene.classList.add('scene-shake');
}

const ambient = { particles: [], fireflies: [], petals: [], sceneName: '', last: 0, nextGlint: 0, nextCreature: 0, nextSword: 0, nextGhost: 0, frame: 0 };
const randomBetween = ([min, max]) => min + Math.random() * (max - min);

function ambientScenePoints(sceneConfig, name) {
  if (isLayoutMode) return name === 'glowPoints' ? layoutGlowPoints : layoutGlintPoints;
  return sceneConfig[name];
}

function resetAmbient(sceneConfig) {
  ambient.sceneName = sceneConfig.name;
  ambient.particles = [];
  ambient.fireflies = Array.from({ length: AMBIENT_CONFIG.fireflies.count }, () => ({
    x: 8 + Math.random() * 84, y: 8 + Math.random() * 72, phase: Math.random() * Math.PI * 2,
    drift: Math.random() * Math.PI * 2, colour: AMBIENT_CONFIG.fireflies.colours[Math.floor(Math.random() * AMBIENT_CONFIG.fireflies.colours.length)],
    blink: randomBetween(AMBIENT_CONFIG.fireflies.blinkSpeed),
  }));
  ambient.petals = AMBIENT_CONFIG.scenes[sceneConfig.name].petals ? Array.from({ length: AMBIENT_CONFIG.petals.count }, () => ({
    x: Math.random() * 100, y: Math.random() * 100, speed: randomBetween(AMBIENT_CONFIG.petals.speed), phase: Math.random() * Math.PI * 2,
  })) : [];
  const now = performance.now();
  ambient.nextGlint = now + randomBetween(AMBIENT_CONFIG.waterGlints.interval);
  ambient.nextCreature = now + randomBetween(AMBIENT_CONFIG.creatureSparks.interval);
  ambient.nextSword = now + randomBetween(AMBIENT_CONFIG.swordGlint.interval);
  ambient.nextGhost = now + randomBetween(AMBIENT_CONFIG.ghostWisps.interval);
}

function addAmbientParticle(particle) {
  if (ambient.particles.length >= AMBIENT_CONFIG.maxParticles - ambient.fireflies.length - ambient.petals.length) ambient.particles.shift();
  ambient.particles.push(particle);
}

function boxPoint(element) {
  const sceneBox = document.querySelector('#scene').getBoundingClientRect();
  const box = element.getBoundingClientRect();
  return { x: ((box.left + box.width / 2 - sceneBox.left) / sceneBox.width) * 100, y: ((box.top + box.height / 2 - sceneBox.top) / sceneBox.height) * 100 };
}

function drawAmbient(timestamp) {
  ambient.frame = 0;
  if (document.hidden) return;
  const scene = document.querySelector('#scene');
  const canvas = document.querySelector('#ambient-canvas');
  const sceneConfig = currentSceneConfig();
  const { rect, pixelRatio } = resizeAmbientCanvas();
  const context = canvas.getContext('2d');
  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  context.clearRect(0, 0, rect.width, rect.height);
  if (ambient.sceneName !== sceneConfig.name) resetAmbient(sceneConfig);
  const delta = Math.min(.05, (timestamp - ambient.last || 16) / 1000);
  ambient.last = timestamp;
  const time = timestamp / 1000;
  const toX = value => rect.width * value / 100;
  const toY = value => rect.height * value / 100;
  const drawGlow = (point, opacity = AMBIENT_CONFIG.flowerGlows.opacity) => {
    const radius = AMBIENT_CONFIG.flowerGlows.radius * (1 + Math.sin(time * AMBIENT_CONFIG.flowerGlows.pulseSpeed + point.x) * .13);
    const gradient = context.createRadialGradient(toX(point.x), toY(point.y), 0, toX(point.x), toY(point.y), radius);
    gradient.addColorStop(0, `${AMBIENT_CONFIG.flowerGlows.colour}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`);
    gradient.addColorStop(1, '#00000000'); context.fillStyle = gradient;
    context.fillRect(toX(point.x) - radius, toY(point.y) - radius, radius * 2, radius * 2);
  };
  for (const point of ambientScenePoints(sceneConfig, 'glowPoints')) drawGlow(point);
  if (!reduceMotion) {
    const sceneEffects = AMBIENT_CONFIG.scenes[sceneConfig.name];
    if (sceneEffects.shafts) {
      const strength = AMBIENT_CONFIG.shafts.opacity * (0.7 + Math.sin(time * AMBIENT_CONFIG.shafts.pulseSpeed) * .3);
      context.fillStyle = `${AMBIENT_CONFIG.shafts.colour}${Math.round(strength * 255).toString(16).padStart(2, '0')}`;
      context.beginPath(); context.moveTo(0, 0); context.lineTo(rect.width * .45, 0); context.lineTo(rect.width * .12, rect.height); context.lineTo(0, rect.height); context.fill();
    }
    for (const firefly of ambient.fireflies) {
      firefly.phase += delta * firefly.blink; firefly.drift += delta * AMBIENT_CONFIG.fireflies.speed / 18;
      const x = firefly.x + Math.cos(firefly.drift) * 2, y = firefly.y + Math.sin(firefly.drift * .7) * 1.4;
      context.globalAlpha = AMBIENT_CONFIG.fireflies.opacity * (.35 + .65 * Math.abs(Math.sin(firefly.phase)));
      context.fillStyle = firefly.colour; context.beginPath(); context.arc(toX(x), toY(y), AMBIENT_CONFIG.fireflies.radius, 0, Math.PI * 2); context.fill();
    }
    context.globalAlpha = AMBIENT_CONFIG.petals.opacity;
    for (const petal of ambient.petals) { petal.y += petal.speed * delta / rect.height * 100; if (petal.y > 105) { petal.y = -4; petal.x = Math.random() * 100; } petal.phase += delta; context.fillStyle = AMBIENT_CONFIG.petals.colour; context.beginPath(); context.ellipse(toX(petal.x + Math.sin(petal.phase) * 2), toY(petal.y), ...AMBIENT_CONFIG.petals.size, petal.phase, 0, Math.PI * 2); context.fill(); }
    if (timestamp >= ambient.nextGlint) { for (const point of ambientScenePoints(sceneConfig, 'glintPoints')) { const radius = AMBIENT_CONFIG.waterGlints.radius; addAmbientParticle({ type: 'glint', x: point.x + (Math.random() - .5) * 2 * radius / rect.width * 100, y: point.y + (Math.random() - .5) * 2 * radius / rect.height * 100, age: 0, life: AMBIENT_CONFIG.waterGlints.lifetime }); } ambient.nextGlint = timestamp + randomBetween(AMBIENT_CONFIG.waterGlints.interval); }
    const creature = visibleCreature();
    if (timestamp >= ambient.nextCreature && !creature.hidden) { const point = boxPoint(creature); for (let index = 0; index < Math.round(randomBetween(AMBIENT_CONFIG.creatureSparks.count)); index += 1) addAmbientParticle({ type: 'ember', x: point.x + (Math.random() - .5) * AMBIENT_CONFIG.creatureSparks.spread, y: point.y + (Math.random() - .5) * AMBIENT_CONFIG.creatureSparks.spread, age: 0, life: AMBIENT_CONFIG.creatureSparks.lifetime }); ambient.nextCreature = timestamp + randomBetween(AMBIENT_CONFIG.creatureSparks.interval); }
    const sword = document.querySelector('#sword');
    if (timestamp >= ambient.nextSword && !sword.hidden && parseFloat(sword.style.getPropertyValue('--sword-clip') || '100') < 100) { const point = boxPoint(sword); addAmbientParticle({ type: 'sword', x: point.x, y: point.y, age: 0, life: AMBIENT_CONFIG.swordGlint.lifetime }); ambient.nextSword = timestamp + randomBetween(AMBIENT_CONFIG.swordGlint.interval); }
    const ghost = document.querySelector('#ghost');
    if (timestamp >= ambient.nextGhost && !ghost.hidden) { const point = boxPoint(ghost); for (let index = 0; index < AMBIENT_CONFIG.ghostWisps.count; index += 1) addAmbientParticle({ type: 'wisp', x: point.x + (Math.random() - .5) * AMBIENT_CONFIG.ghostWisps.spread, y: point.y, age: 0, life: AMBIENT_CONFIG.ghostWisps.lifetime }); ambient.nextGhost = timestamp + randomBetween(AMBIENT_CONFIG.ghostWisps.interval); }
    ambient.particles = ambient.particles.filter(particle => {
      particle.age += delta; const progress = particle.age / particle.life; if (progress >= 1) return false;
      const x = toX(particle.x), y = toY(particle.y - (particle.type === 'ember' || particle.type === 'wisp' ? progress * 8 : 0));
      context.globalAlpha = (1 - progress) * (particle.type === 'wisp' ? AMBIENT_CONFIG.ghostWisps.opacity : 1);
      context.fillStyle = particle.type === 'ember' ? AMBIENT_CONFIG.creatureSparks.colours[0] : particle.type === 'wisp' ? AMBIENT_CONFIG.ghostWisps.colour : particle.type === 'glint' ? AMBIENT_CONFIG.waterGlints.colour : AMBIENT_CONFIG.swordGlint.colour;
      if (particle.type === 'sword') { context.fillRect(x - 1, y - rect.height * .08 * progress, 2, rect.height * .16); } else { context.beginPath(); context.arc(x, y, particle.type === 'glint' ? 2.2 : 1.8, 0, Math.PI * 2); context.fill(); } return true;
    });
  }
  context.globalAlpha = 1;
  ambient.frame = requestAnimationFrame(drawAmbient);
}

function startAmbient() { if (!ambient.frame && !document.hidden) ambient.frame = requestAnimationFrame(drawAmbient); }
document.addEventListener('visibilitychange', () => { if (!document.hidden) { ambient.last = 0; startAmbient(); } });

function resizeAmbientCanvas() {
  const scene = document.querySelector('#scene');
  const canvas = document.querySelector('#ambient-canvas');
  const rect = scene.getBoundingClientRect();
  const pixelRatio = window.devicePixelRatio || 1;
  const width = Math.round(rect.width * pixelRatio);
  const height = Math.round(rect.height * pixelRatio);
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
  return { rect, pixelRatio };
}

function recalculateSceneLayout() {
  recalculateScenePositions();
  resizeAmbientCanvas();
  ambient.last = 0;
  startAmbient();
}

function waitForImageDecode(image) {
  if (!image.currentSrc && !image.src) return Promise.resolve();
  const loaded = image.complete && image.naturalWidth
    ? Promise.resolve()
    : new Promise(resolve => {
      image.addEventListener('load', resolve, { once: true });
      image.addEventListener('error', resolve, { once: true });
    });
  return loaded.then(() => image.decode ? image.decode().catch(() => undefined) : undefined);
}

async function placeInitialScene() {
  const scene = document.querySelector('#scene');
  const currentSprites = ['#creature', '#sword', '#ghost']
    .map(selector => document.querySelector(selector));
  const evolutionForm = document.querySelector('#evolution-form');
  if (!evolutionForm.hidden) currentSprites.push(evolutionForm);
  await Promise.all([
    waitForImageDecode(document.querySelector('#scene-image')),
    waitForImageDecode(document.querySelector('.scene-frame')),
    ...currentSprites.map(waitForImageDecode),
    ...stageTwoIdleFrames.map(waitForImageDecode),
    document.fonts?.ready ?? Promise.resolve(),
  ]);
  await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  recalculateSceneLayout();
  hasInitialPlacement = true;
  scene.classList.add('sprites-positioned');
}

function renderAmbientMarkers() {
  const layer = document.querySelector('#ambient-markers');
  if (!isLayoutMode || layoutMode === 'sprites') { layer.replaceChildren(); return; }
  const points = layoutMode === 'glows' ? layoutGlowPoints : layoutGlintPoints;
  layer.innerHTML = points.map((point, index) => `<button class="ambient-marker ${layoutMode}" data-index="${index}" style="left:${point.x}%;top:${point.y}%" aria-label="Remove ${layoutMode.slice(0, -1)} point"></button>`).join('');
}

function render() {
  const offset = Math.max(0, dayOffset(today));
  const sceneConfig = SCENES[offset % SCENES.length];
  if (isLayoutMode && layoutSceneName !== sceneConfig.name) {
    layoutSceneName = sceneConfig.name;
    layoutPoints = copyPoints({ creature: sceneConfig.creature, ghost: sceneConfig.ghost, sword: sceneConfig.sword });
    layoutGlowPoints = sceneConfig.glowPoints.map(point => ({ ...point }));
    layoutGlintPoints = sceneConfig.glintPoints.map(point => ({ ...point }));
  }
  const tasks = todayTasks();
  const isTodayComplete = isComplete(tasks);
  const displayStage = activeSequence ? activeSequence.beforeStage : isLayoutMode ? (layoutPreview ?? stage()) : stage();
  const creatureConfig = CREATURES[displayStage];
  const scene = document.querySelector('#scene');
  const sceneImage = document.querySelector('#scene-image');
  const creature = document.querySelector('#creature');
  const sword = document.querySelector('#sword');
  const ghost = document.querySelector('#ghost');
  const evolutionForm = document.querySelector('#evolution-form');
  const isStageTwo = displayStage === 2;

  scene.className = `scene${hasInitialPlacement ? ' sprites-positioned' : ''}${isLayoutMode ? ` layout-mode${layoutMode === 'sprites' ? '' : ' layout-points'}` : ''}${activeSequence ? ` ${activeSequence.kind}` : ''}${isLayoutMode && activeSequence ? ' replaying' : ''}${reduceMotion ? ' reduced-motion' : ''}`;
  sceneImage.src = `assets/${sceneConfig.file}`;
  creature.src = `assets/${creatureConfig.file}`;
  creature.hidden = isStageTwo;
  creature.classList.toggle('stage-two', isStageTwo);
  const width = displayStage === 0 ? EGG_WIDTH_PERCENT : (creatureConfig.width / 1024) * CREATURE_SCALE * 100;
  creature.style.setProperty('--creature-width', `${width}%`);
  stageTwoIdleFrames.forEach(frame => frame.style.setProperty('--creature-width', `${width}%`));
  updateStageTwoIdleLoop(isStageTwo, !activeSequence);
  applyPositions(sceneConfig);
  resizeAmbientCanvas();
  renderAmbientMarkers();
  creature.classList.toggle('egg-idle', displayStage === 0 && !activeSequence && !isLayoutMode);
  creature.classList.toggle('idle', displayStage > 0 && displayStage !== 2 && !activeSequence && !isLayoutMode);
  const revealed = isLayoutMode ? 100 : activeSequence?.revealOverride ?? currentSwordReveals()[completedCount(tasks)];
  sword.style.setProperty('--sword-clip', `${100 - revealed}%`);
  sword.classList.toggle('partial', !activeSequence && !isLayoutMode && revealed > 0 && revealed < 100);
  ghost.hidden = (!isLayoutMode && isTodayComplete && !activeSequence) || Boolean(activeSequence?.ghostGone) || (isLayoutMode && layoutGhostCooldown);
  sword.hidden = Boolean(activeSequence?.swordGone);
  const showEvolution = activeSequence?.kind === 'evolving';
  evolutionForm.hidden = !showEvolution;
  if (showEvolution) {
    const target = CREATURES[activeSequence.targetStage];
    evolutionForm.src = `assets/${target.file}`;
    evolutionForm.classList.toggle('stage-two', activeSequence.targetStage === 2);
    const targetWidth = activeSequence.targetStage === 0 ? EGG_WIDTH_PERCENT : (target.width / 1024) * CREATURE_SCALE * 100;
    evolutionForm.style.setProperty('--creature-width', `${targetWidth}%`);
    evolutionForm.style.opacity = activeSequence.showNew ? '1' : '0';
    visibleCreature().style.opacity = activeSequence.showNew ? '0' : '1';
  } else {
    evolutionForm.classList.remove('stage-two');
    creature.style.opacity = '';
    stageTwoIdleFrames.forEach(frame => { frame.style.opacity = ''; });
  }

  document.querySelector('#day-number').textContent = offset + 1;
  document.querySelector('#date-label').textContent = formatDate(today);
  document.querySelector('#task-list').innerHTML = currentTasks().map(task => {
    const checked = Boolean(tasks[task]);
    return `<div class="task"><span>${task}</span><button class="tick" data-task="${task}" aria-pressed="${checked}" aria-label="${checked ? `Undo ${task}` : `Complete ${task}` }" ${activeSequence || isLayoutMode ? 'disabled' : ''}>✓</button></div>`;
  }).join('');
  document.querySelector('#record').innerHTML = Array.from({ length: 7 }, (_, index) => {
    const date = recordDate(index);
    const count = completedCount(state.days[date]?.tasks || {});
    return `<div class="record-cell ${date === today ? 'current' : ''}"><span class="record-day">Day ${index + 1}</span><span class="record-value">${count} / ${currentTasks().length}</span></div>`;
  }).join('');
  const nextDayButton = document.querySelector('#next-demo-day');
  if (isDemoMode && nextDayButton) nextDayButton.disabled = Boolean(activeSequence);
}

document.querySelector('#task-list').addEventListener('click', event => {
  const button = event.target.closest('.tick');
  if (!button || activeSequence || isLayoutMode) return;
  const task = button.dataset.task;
  const tasks = todayTasks();
  const countBefore = completedCount(tasks);
  const wasComplete = isComplete(tasks);
  if (!state.days[today]) state.days[today] = { tasks: {} };
  if (state.days[today].tasks[task]) delete state.days[today].tasks[task];
  else state.days[today].tasks[task] = new Date().toISOString();
  save();
  const nowComplete = isComplete(todayTasks());
  if (!wasComplete && nowComplete) runCompletion(countBefore);
  else if (completedCount(todayTasks()) > countBefore) runForge(countBefore, completedCount(todayTasks()), stage(), () => { activeSequence = null; render(); });
  else runRetract();
});

async function runForge(fromCount, toCount, beforeStage, done) {
  if (reduceMotion) {
    activeSequence = { kind: 'reduced-crossfade', beforeStage, revealOverride: currentSwordReveals()[toCount] };
    render();
    await wait(ANIMATION_TIMINGS.forgePulse);
    done();
    return;
  }
  activeSequence = { kind: 'forge-pulse', beforeStage, revealOverride: currentSwordReveals()[fromCount] };
  render();
  requestAnimationFrame(() => {
    const edge = swordEdgePoint(currentSwordReveals()[fromCount]);
    const scene = document.querySelector('#scene');
    scene.style.setProperty('--sword-edge-x', `${edge.x}%`);
    scene.style.setProperty('--sword-edge-y', `${edge.y}%`);
    setSwordShimmer(currentSwordReveals()[fromCount]);
    for (let index = 0; index < 8 + Math.floor(Math.random() * 5); index += 1) {
      const point = swordSparkPoint(currentSwordReveals()[fromCount]);
      particleBurst(point.x, point.y, 1);
    }
  });
  await waitForVisualCompletion([
    document.querySelector('#sword'),
    document.querySelector('#sword-shimmer'),
    document.querySelector('#sword-edge'),
  ]);
  activeSequence = { kind: 'forge-cool', beforeStage, revealOverride: currentSwordReveals()[toCount] };
  render();
  await waitForVisualCompletion([document.querySelector('#sword')]);
  done();
}

function runRetract() {
  activeSequence = { kind: 'retract', beforeStage: stage() };
  render();
  window.setTimeout(() => { activeSequence = null; render(); }, reduceMotion ? 100 : 220);
}

async function runCompletion(countBefore) {
  const completedAfter = completedDays();
  const afterStage = Math.min(7, completedAfter);
  const beforeStage = Math.min(7, completedAfter - 1);
  if (reduceMotion) {
    activeSequence = { kind: 'reduced-crossfade', beforeStage, revealOverride: 100 };
    render();
    await wait(ANIMATION_TIMINGS.finalFlash);
    activeSequence = null;
    render();
    return;
  }
  await runForge(countBefore, currentTasks().length, beforeStage, async () => {
    await runStrike(beforeStage);
    if (beforeStage === 7) { activeSequence = null; render(); return; }
    if (beforeStage === 0) await runHatch(0, 1);
    else await runEvolution(beforeStage, afterStage);
    activeSequence = null;
    render();
  });
}

function setStrikeVector() {
  const scene = document.querySelector('#scene');
  const swordBox = document.querySelector('#sword').getBoundingClientRect();
  const ghostBox = document.querySelector('#ghost').getBoundingClientRect();
  const dx = (ghostBox.left + ghostBox.width / 2) - (swordBox.left + swordBox.width / 2);
  const dy = (ghostBox.top + ghostBox.height / 2) - (swordBox.top + swordBox.height / 2);
  const angle = Math.atan2(dx, -dy) * 180 / Math.PI;
  const distance = Math.max(0, Math.hypot(dx, dy) - swordBox.height / 2 + swordBox.height * .15);
  scene.style.setProperty('--strike-angle', `${angle}deg`);
  scene.style.setProperty('--strike-dx', `${Math.sin(angle * Math.PI / 180) * distance}px`);
  scene.style.setProperty('--strike-dy', `${-Math.cos(angle * Math.PI / 180) * distance}px`);
}

function freezeGhostForStrike() {
  const sceneBox = document.querySelector('#scene').getBoundingClientRect();
  const ghost = document.querySelector('#ghost');
  const ghostBox = ghost.getBoundingClientRect();
  ghost.style.left = `${ghostBox.left + ghostBox.width / 2 - sceneBox.left}px`;
  ghost.style.top = `${ghostBox.top + ghostBox.height / 2 - sceneBox.top}px`;
}

function releaseGhostAfterStrike() {
  const ghost = document.querySelector('#ghost');
  ghost.style.left = '';
  ghost.style.top = '';
}

async function runStrike(beforeStage) {
  if (reduceMotion) {
    activeSequence = { kind: 'reduced-crossfade', beforeStage, revealOverride: 100 };
    render();
    await wait(ANIMATION_TIMINGS.strikeFade);
    return;
  }
  activeSequence = { kind: 'strike-measure', beforeStage, revealOverride: 100 };
  render();
  const sword = document.querySelector('#sword');
  await waitForVisualCompletion([sword, document.querySelector('#sword-shimmer'), document.querySelector('#sword-edge')]);
  setStrikeVector();
  freezeGhostForStrike();
  activeSequence.kind = 'strike-charge';
  render();
  await wait(ANIMATION_TIMINGS.strikeCharge);
  activeSequence.kind = 'strike-hold';
  render();
  await wait(ANIMATION_TIMINGS.strikeHold);
  activeSequence.kind = 'strike-drive';
  render();
  await wait(ANIMATION_TIMINGS.strikeDrive);
  activeSequence.kind = 'strike-hit-stop';
  render();
  await wait(ANIMATION_TIMINGS.strikeHitStop);
  activeSequence.kind = 'strike-glitch';
  render();
  requestAnimationFrame(showGhostGlitch);
  await wait(ANIMATION_TIMINGS.strikeGlitch);
  const ghostPoint = isLayoutMode ? layoutPoints.ghost : currentSceneConfig().ghost;
  particleBurst(ghostPoint.x, ghostPoint.y, 24, false, 'ghost-bit', ['#dce5ec', '#aebdca', '#708695', '#d3eef3'], true);
  activeSequence.kind = 'strike-fade';
  render();
  await wait(ANIMATION_TIMINGS.strikeFade);
  clearGhostGlitch();
  if (isLayoutMode) {
    layoutGhostCooldown = true;
    window.setTimeout(() => { releaseGhostAfterStrike(); layoutGhostCooldown = false; render(); }, ANIMATION_TIMINGS.layoutGhostReturn);
  } else releaseGhostAfterStrike();
}

async function runHatch(beforeStage, targetStage) {
  if (reduceMotion) {
    activeSequence = { kind: 'reduced-crossfade', beforeStage: targetStage, revealOverride: 100, ghostGone: true, swordGone: true };
    render();
    await wait(ANIMATION_TIMINGS.hatchLand);
    return;
  }
  activeSequence = { kind: 'hatching', beforeStage, targetStage, revealOverride: 100, ghostGone: true, swordGone: true };
  render();
  await wait(ANIMATION_TIMINGS.hatchRock + ANIMATION_TIMINGS.hatchPause);
  const joltCount = 6;
  for (let index = 0; index < joltCount; index += 1) {
    const eggPoint = creatureCenter();
    particleBurst(eggPoint.x, eggPoint.y, index + 2);
    await wait(ANIMATION_TIMINGS.hatchJolt / joltCount);
  }
  activeSequence.kind = 'hatch-flash';
  render();
  const shellPoint = creatureCenter();
  setEffectCenter(shellPoint);
  particleBurst(shellPoint.x, shellPoint.y, 16, false, 'shell', ['#f6b33e', '#f28a31', '#ffd36d', '#c96a2d']);
  await wait(ANIMATION_TIMINGS.hatchFlash);
  activeSequence = { kind: 'hatch-reveal', beforeStage: targetStage, revealOverride: 100, ghostGone: true, swordGone: true };
  render();
  const point = creatureCenter();
  setEffectCenter(point);
  particleBurst(point.x, point.y, 16, true);
  await wait(ANIMATION_TIMINGS.hatchLand);
  activeSequence = { kind: 'hatch-aftermath', beforeStage: targetStage, revealOverride: 100, ghostGone: true, swordGone: true };
  render();
  setEffectCenter(creatureGroundPoint());
  const landedPoint = creatureCenter();
  particleBurst(landedPoint.x, landedPoint.y, 8, false, 'ember', ['#ffd16a', '#f09a42', '#ffdc92'], true);
  await wait(ANIMATION_TIMINGS.evolveEmbers);
}

async function runEvolution(beforeStage, targetStage) {
  if (reduceMotion) {
    activeSequence = { kind: 'reduced-crossfade', beforeStage: targetStage, revealOverride: 100, ghostGone: true, swordGone: true };
    render();
    await wait(ANIMATION_TIMINGS.evolveReveal);
    return;
  }
  activeSequence = { kind: 'evolve-gather', beforeStage, targetStage, revealOverride: 100, ghostGone: true, swordGone: true };
  render();
  const point = creatureCenter();
  setEffectCenter(point);
  swirlGather(point.x, point.y);
  await wait(ANIMATION_TIMINGS.evolveGather);
  activeSequence = { kind: 'evolving', beforeStage, targetStage, revealOverride: 100, showNew: false, ghostGone: true, swordGone: true };
  render();
  if (!reduceMotion) {
    await wait(ANIMATION_TIMINGS.evolveSilhouetteHold);
    const start = performance.now();
    let showNew = false;
    while (performance.now() - start < ANIMATION_TIMINGS.evolveFlicker) {
      const progress = (performance.now() - start) / ANIMATION_TIMINGS.evolveFlicker;
      activeSequence.showNew = showNew = !showNew;
      visibleCreature().style.opacity = showNew ? '0' : '1';
      document.querySelector('#evolution-form').style.opacity = showNew ? '1' : '0';
      pulseSilhouette();
      await wait(500 - 450 * progress);
    }
    activeSequence.showNew = true;
    visibleCreature().style.opacity = '0';
    document.querySelector('#evolution-form').style.opacity = '1';
    pulseSilhouette();
  } else await wait(ANIMATION_TIMINGS.evolveSilhouetteHold + ANIMATION_TIMINGS.evolveFlicker);
  activeSequence = { kind: 'evolve-flash', beforeStage: targetStage, revealOverride: 100, ghostGone: true, swordGone: true };
  render();
  const revealPoint = creatureCenter();
  setEffectCenter(revealPoint);
  particleBurst(revealPoint.x, revealPoint.y, 20, true);
  particleBurst(revealPoint.x, revealPoint.y, 8, false, 'ember', ['#ffd16a', '#f09a42', '#ffdc92'], true);
  await wait(ANIMATION_TIMINGS.evolveFlash);
  activeSequence = { kind: 'evolve-reveal', beforeStage: targetStage, revealOverride: 100, ghostGone: true, swordGone: true };
  render();
  await wait(ANIMATION_TIMINGS.evolveReveal);
}

function setDraggedPoint(spriteName, clientX, clientY) {
  const bounds = document.querySelector('#scene').getBoundingClientRect();
  layoutPoints[spriteName] = {
    x: Math.max(0, Math.min(100, ((clientX - bounds.left) / bounds.width) * 100)),
    y: Math.max(0, Math.min(100, ((clientY - bounds.top) / bounds.height) * 100)),
  };
  applyPositions(SCENES[Math.max(0, dayOffset(today)) % SCENES.length]);
}

function setupLayoutTools() {
  if (!isLayoutMode) return;
  const tools = document.querySelector('#layout-tools');
  const preview = document.querySelector('#form-preview');
  const modeSelect = document.querySelector('#layout-mode');
  tools.hidden = false;
  preview.innerHTML = CREATURES.map((creature, index) => `<option value="${index}">${index === 0 ? 'Egg' : `Stage ${index}`}</option>`).join('');
  preview.value = stage();
  layoutPreview = Number(preview.value);
  modeSelect.addEventListener('change', () => { layoutMode = modeSelect.value; render(); });
  preview.addEventListener('change', () => { layoutPreview = Number(preview.value); render(); });
  const draggableSprites = [
    ...['creature', 'ghost', 'sword'].map(spriteName => [spriteName, document.querySelector(`#${spriteName}`)]),
    ...stageTwoIdleFrames.map(element => ['creature', element]),
  ];
  for (const [spriteName, element] of draggableSprites) {
    element.addEventListener('pointerdown', event => {
      if (layoutMode !== 'sprites') return;
      event.preventDefault();
      element.setPointerCapture(event.pointerId);
      setDraggedPoint(spriteName, event.clientX, event.clientY);
    });
    element.addEventListener('pointermove', event => {
      if (element.hasPointerCapture(event.pointerId)) setDraggedPoint(spriteName, event.clientX, event.clientY);
    });
  }
  document.querySelector('#copy-layout').addEventListener('click', async () => {
    const sceneConfig = SCENES[Math.max(0, dayOffset(today)) % SCENES.length];
    const value = layoutConfigLiteral(sceneConfig);
    try { await navigator.clipboard.writeText(value); }
    catch {
      const field = document.createElement('textarea');
      field.value = value;
      document.body.append(field);
      field.select();
      document.execCommand('copy');
      field.remove();
    }
    document.querySelector('#copy-layout').textContent = 'Copied';
  });
  document.querySelector('#scene').addEventListener('click', event => {
    if (layoutMode === 'sprites' || event.target.closest('.ambient-marker')) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const point = { x: ((event.clientX - bounds.left) / bounds.width) * 100, y: ((event.clientY - bounds.top) / bounds.height) * 100 };
    (layoutMode === 'glows' ? layoutGlowPoints : layoutGlintPoints).push(point);
    renderAmbientMarkers();
  });
  document.querySelector('#ambient-markers').addEventListener('click', event => {
    const marker = event.target.closest('.ambient-marker');
    if (!marker) return;
    event.stopPropagation();
    (layoutMode === 'glows' ? layoutGlowPoints : layoutGlintPoints).splice(Number(marker.dataset.index), 1);
    renderAmbientMarkers();
  });
  document.querySelector('.layout-replays').addEventListener('click', async event => {
    const button = event.target.closest('[data-replay]');
    if (!button || activeSequence) return;
    const before = Number(preview.value);
    const finish = () => { activeSequence = null; render(); };
    if (button.dataset.replay === 'forge') runForge(1, 2, before, finish);
    if (button.dataset.replay === 'strike') { await runStrike(before); finish(); }
    if (button.dataset.replay === 'hatch') { await runHatch(0, 1); finish(); }
    if (button.dataset.replay === 'evolve' && before < 7) { await runEvolution(before, before + 1); finish(); }
  });
}

function createOathScroll(oath) {
  let oathScrollFrame = null;
  let removeOathScrollListeners = () => {};
  const stopOathScroll = () => {
    if (oathScrollFrame === null) return;
    cancelAnimationFrame(oathScrollFrame);
    oathScrollFrame = null;
    removeOathScrollListeners();
  };
  return () => {
    stopOathScroll();
    const heading = oath.querySelector('h2');
    const target = Math.max(0, window.scrollY + heading.getBoundingClientRect().top - 72);
    if (reduceMotion) {
      window.scrollTo(0, target);
      return;
    }
    const start = window.scrollY;
    const abortEvents = ['wheel', 'touchstart', 'pointerdown', 'keydown'];
    abortEvents.forEach(type => window.addEventListener(type, stopOathScroll, { passive: true }));
    removeOathScrollListeners = () => {
      abortEvents.forEach(type => window.removeEventListener(type, stopOathScroll));
      removeOathScrollListeners = () => {};
    };
    const startedAt = performance.now();
    const step = now => {
      const progress = Math.min(1, (now - startedAt) / DEMO_OATH_SCROLL_DURATION);
      const eased = progress < .5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;
      const position = start + (target - start) * eased;
      window.scrollTo(0, position);
      if (progress < 1) oathScrollFrame = requestAnimationFrame(step);
      else {
        oathScrollFrame = null;
        removeOathScrollListeners();
      }
    };
    oathScrollFrame = requestAnimationFrame(step);
  };
}

function setupOathReveal(button, oath) {
  const scrollToOath = createOathScroll(oath);
  button.addEventListener('click', () => {
    const firstReveal = oath.hidden;
    oath.hidden = false;
    if (firstReveal && !reduceMotion) oath.classList.add('demo-oath-revealing');
    requestAnimationFrame(scrollToOath);
  });
}

function setupNormalOath() {
  if (isDemoMode) return;
  setupOathReveal(document.querySelector('#read-oath'), document.querySelector('#shared-oath'));
}

function setupDemoMode() {
  if (!isDemoMode) return;
  document.body.classList.add('demo-mode');
  document.querySelector('#demo-panel').hidden = false;
  document.querySelector('#demo-badge').hidden = false;
  const demoOath = document.querySelector('#demo-oath');
  const oathCopy = document.querySelector('#shared-oath .oath-panel').cloneNode(true);
  oathCopy.removeAttribute('aria-labelledby');
  oathCopy.setAttribute('aria-label', 'The Oath');
  oathCopy.querySelector('[id="oath-title"]').removeAttribute('id');
  demoOath.append(oathCopy);
  document.querySelector('#next-demo-day').addEventListener('click', () => {
    if (activeSequence) return;
    today = addLocalDays(today, 1);
    state.simulatedDate = today;
    save();
    render();
  });
  document.querySelector('#reset-demo').addEventListener('click', () => {
    localStorage.removeItem(ACTIVE_STORAGE_KEY);
    const firstDay = localDateString();
    state = { firstDay, simulatedDate: firstDay, days: {}, demoStateVersion: DEMO_STATE_VERSION, demoTaskStructure: [...DEMO_TASKS] };
    today = firstDay;
    save();
    render();
  });
  setupOathReveal(document.querySelector('#read-demo-oath'), demoOath);
}

if (override) {
  const banner = document.querySelector('#date-override');
  banner.hidden = false;
  banner.textContent = `Testing date: ${override}`;
}
setupLayoutTools();
setupNormalOath();
setupDemoMode();
render();
new ResizeObserver(() => recalculateSceneLayout()).observe(document.querySelector('#scene'));
placeInitialScene();
startAmbient();
