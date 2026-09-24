// Edit these scene-relative positions to match changes to the artwork.
const SCENES = [
  { name: 'clearing', file: 'scene-clearing.png', creature: { x: 53, y: 75 }, ghost: { x: 85, y: 19 }, sword: { x: 16, y: 21 }, glowPoints: [], glintPoints: [] },
  { name: 'hollow', file: 'scene-hollow.png', creature: { x: 50, y: 75 }, ghost: { x: 78, y: 18 }, sword: { x: 14, y: 22 }, glowPoints: [], glintPoints: [] },
  { name: 'stream', file: 'scene-stream.png', creature: { x: 34, y: 63 }, ghost: { x: 82, y: 23 }, sword: { x: 15, y: 21 }, glowPoints: [], glintPoints: [] },
];

const AMBIENT_CONFIG = {
  maxParticles: 60,
  fireflies: { count: 12, speed: 7, radius: 1.8, opacity: .82, colours: ['#ffd978', '#d7ecff'], blinkSpeed: [1.1, 2.3] },
  petals: { count: 10, speed: [9, 17], sway: 16, opacity: .78, colour: '#f2a3bd', size: [3, 2] },
  flowerGlows: { radius: 34, opacity: .24, pulseSpeed: .65, colour: '#ffdca0' },
  waterGlints: { interval: [500, 1200], radius: 22, opacity: .8, colour: '#d9f6ff', lifetime: .7 },
  shafts: { opacity: .13, pulseSpeed: .22, colour: '#fff4c8' },
  mist: { opacity: .12, speed: 5, colour: '#e6eef0' },
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
  layoutGhostReturn: 1500,
  finalFlash: 420,
};
Object.entries(ANIMATION_TIMINGS).forEach(([name, milliseconds]) => {
  document.documentElement.style.setProperty(`--${name.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`)}`, `${milliseconds}ms`);
});

const TASKS = ['Warm-ups', 'Hey Joe practice', 'Logic session', 'Read'];
const STORAGE_KEY = 'seven-days-prototype';
const CREATURE_SCALE = 0.46;
const SWORD_REVEALS = [0, 22, 40, 70, 100];
const CREATURES = [
  { file: 'egg.png', width: 829 },
  ...Array.from({ length: 7 }, (_, index) => ({ file: `stage-${index + 1}.png`, width: [456, 509, 648, 919, 974, 1056, 1193][index] })),
];

const STAGE_ONE = CREATURES[1];
const EGG_WIDTH_PERCENT = ((STAGE_ONE.width / 1024) * CREATURE_SCALE * (442 / 456)) * (829 / 1033) * 100;

const params = new URLSearchParams(window.location.search);
const isLayoutMode = params.get('layout') === '1';
if (!isLayoutMode) document.querySelector('#layout-tools').remove();
if (params.get('reset') === '1' && !isLayoutMode) {
  localStorage.removeItem(STORAGE_KEY);
  window.location.replace(`${window.location.pathname}${params.has('today') ? `?today=${params.get('today')}` : ''}`);
}

function localDateString(date = new Date()) {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

const override = /^\d{4}-\d{2}-\d{2}$/.test(params.get('today') || '') ? params.get('today') : null;
const today = override || localDateString();

function loadState() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) return JSON.parse(stored);
  const state = { firstDay: today, days: {} };
  if (!isLayoutMode) localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  return state;
}
let state = loadState();
let activeSequence = null;
let layoutPoints = null;
let layoutSceneName = null;
let layoutPreview = null;
let layoutGlowPoints = [];
let layoutGlintPoints = [];
let layoutMode = 'sprites';
let layoutGhostCooldown = false;
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function save() { if (!isLayoutMode) localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function dayOffset(date) {
  const [y, m, d] = date.split('-').map(Number);
  const [fy, fm, fd] = state.firstDay.split('-').map(Number);
  return Math.round((new Date(y, m - 1, d) - new Date(fy, fm - 1, fd)) / 86400000);
}
function todayTasks() { return state.days[today]?.tasks || {}; }
function completedCount(tasks) { return TASKS.filter(task => tasks[task]).length; }
function isComplete(tasks) { return completedCount(tasks) === TASKS.length; }
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
  for (const name of ['creature', 'ghost', 'sword']) {
    scene.style.setProperty(`--${name}-x`, `${points[name].x}%`);
    scene.style.setProperty(`--${name}-y`, `${points[name].y}%`);
  }
  updateLayoutReadout(sceneConfig);
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
  const creatureBox = document.querySelector('#creature').getBoundingClientRect();
  return {
    x: ((creatureBox.left + creatureBox.width / 2 - sceneBox.left) / sceneBox.width) * 100,
    y: ((creatureBox.top + creatureBox.height / 2 - sceneBox.top) / sceneBox.height) * 100,
  };
}

function setEffectCenter(point) {
  const scene = document.querySelector('#scene');
  scene.style.setProperty('--effect-x', `${point.x}%`);
  scene.style.setProperty('--effect-y', `${point.y}%`);
}

function pulseSilhouette() {
  const visible = document.querySelector('#evolution-form').style.opacity === '1' ? document.querySelector('#evolution-form') : document.querySelector('#creature');
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
  const rect = scene.getBoundingClientRect();
  const pixelRatio = window.devicePixelRatio || 1;
  if (canvas.width !== Math.round(rect.width * pixelRatio) || canvas.height !== Math.round(rect.height * pixelRatio)) {
    canvas.width = Math.round(rect.width * pixelRatio); canvas.height = Math.round(rect.height * pixelRatio);
  }
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
    context.fillStyle = `${AMBIENT_CONFIG.mist.colour}${Math.round(AMBIENT_CONFIG.mist.opacity * 255).toString(16).padStart(2, '0')}`;
    context.fillRect(((time * AMBIENT_CONFIG.mist.speed) % rect.width) - rect.width, rect.height * .72, rect.width * 1.5, rect.height * .18);
    for (const firefly of ambient.fireflies) {
      firefly.phase += delta * firefly.blink; firefly.drift += delta * AMBIENT_CONFIG.fireflies.speed / 18;
      const x = firefly.x + Math.cos(firefly.drift) * 2, y = firefly.y + Math.sin(firefly.drift * .7) * 1.4;
      context.globalAlpha = AMBIENT_CONFIG.fireflies.opacity * (.35 + .65 * Math.abs(Math.sin(firefly.phase)));
      context.fillStyle = firefly.colour; context.beginPath(); context.arc(toX(x), toY(y), AMBIENT_CONFIG.fireflies.radius, 0, Math.PI * 2); context.fill();
    }
    context.globalAlpha = AMBIENT_CONFIG.petals.opacity;
    for (const petal of ambient.petals) { petal.y += petal.speed * delta / rect.height * 100; if (petal.y > 105) { petal.y = -4; petal.x = Math.random() * 100; } petal.phase += delta; context.fillStyle = AMBIENT_CONFIG.petals.colour; context.beginPath(); context.ellipse(toX(petal.x + Math.sin(petal.phase) * 2), toY(petal.y), ...AMBIENT_CONFIG.petals.size, petal.phase, 0, Math.PI * 2); context.fill(); }
    if (timestamp >= ambient.nextGlint) { for (const point of ambientScenePoints(sceneConfig, 'glintPoints')) { const radius = AMBIENT_CONFIG.waterGlints.radius; addAmbientParticle({ type: 'glint', x: point.x + (Math.random() - .5) * 2 * radius / rect.width * 100, y: point.y + (Math.random() - .5) * 2 * radius / rect.height * 100, age: 0, life: AMBIENT_CONFIG.waterGlints.lifetime }); } ambient.nextGlint = timestamp + randomBetween(AMBIENT_CONFIG.waterGlints.interval); }
    const creature = document.querySelector('#creature');
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

  scene.className = `scene${isLayoutMode ? ` layout-mode${layoutMode === 'sprites' ? '' : ' layout-points'}` : ''}${activeSequence ? ` ${activeSequence.kind}` : ''}${isLayoutMode && activeSequence ? ' replaying' : ''}${reduceMotion ? ' reduced-motion' : ''}`;
  sceneImage.src = `assets/${sceneConfig.file}`;
  creature.src = `assets/${creatureConfig.file}`;
  const width = displayStage === 0 ? EGG_WIDTH_PERCENT : (creatureConfig.width / 1024) * CREATURE_SCALE * 100;
  creature.style.setProperty('--creature-width', `${width}%`);
  applyPositions(sceneConfig);
  renderAmbientMarkers();
  creature.classList.toggle('egg-idle', displayStage === 0 && !activeSequence && !isLayoutMode);
  creature.classList.toggle('idle', displayStage > 0 && !activeSequence && !isLayoutMode);
  const revealed = isLayoutMode ? 100 : activeSequence?.revealOverride ?? SWORD_REVEALS[completedCount(tasks)];
  sword.style.setProperty('--sword-clip', `${100 - revealed}%`);
  sword.classList.toggle('partial', !activeSequence && !isLayoutMode && revealed > 0 && revealed < 100);
  ghost.hidden = (!isLayoutMode && isTodayComplete && !activeSequence) || Boolean(activeSequence?.ghostGone) || (isLayoutMode && layoutGhostCooldown);
  sword.hidden = Boolean(activeSequence?.swordGone);
  const showEvolution = activeSequence?.kind === 'evolving';
  evolutionForm.hidden = !showEvolution;
  if (showEvolution) {
    const target = CREATURES[activeSequence.targetStage];
    evolutionForm.src = `assets/${target.file}`;
    const targetWidth = activeSequence.targetStage === 0 ? EGG_WIDTH_PERCENT : (target.width / 1024) * CREATURE_SCALE * 100;
    evolutionForm.style.setProperty('--creature-width', `${targetWidth}%`);
    evolutionForm.style.opacity = activeSequence.showNew ? '1' : '0';
    creature.style.opacity = activeSequence.showNew ? '0' : '1';
  } else {
    creature.style.opacity = '';
  }

  document.querySelector('#day-number').textContent = offset + 1;
  document.querySelector('#date-label').textContent = formatDate(today);
  document.querySelector('#task-list').innerHTML = TASKS.map(task => {
    const checked = Boolean(tasks[task]);
    return `<div class="task"><span>${task}</span><button class="tick" data-task="${task}" aria-pressed="${checked}" aria-label="${checked ? `Undo ${task}` : `Complete ${task}` }" ${activeSequence || isLayoutMode ? 'disabled' : ''}>✓</button></div>`;
  }).join('');
  document.querySelector('#record').innerHTML = Array.from({ length: 7 }, (_, index) => {
    const date = recordDate(index);
    const count = completedCount(state.days[date]?.tasks || {});
    return `<div class="record-cell ${date === today ? 'current' : ''}"><span class="record-day">Day ${index + 1}</span><span class="record-value">${count} / 4</span></div>`;
  }).join('');
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
    activeSequence = { kind: 'reduced-crossfade', beforeStage, revealOverride: SWORD_REVEALS[toCount] };
    render();
    await wait(ANIMATION_TIMINGS.forgePulse);
    done();
    return;
  }
  activeSequence = { kind: 'forge-pulse', beforeStage, revealOverride: SWORD_REVEALS[fromCount] };
  render();
  requestAnimationFrame(() => {
    const edge = swordEdgePoint(SWORD_REVEALS[fromCount]);
    const scene = document.querySelector('#scene');
    scene.style.setProperty('--sword-edge-x', `${edge.x}%`);
    scene.style.setProperty('--sword-edge-y', `${edge.y}%`);
    setSwordShimmer(SWORD_REVEALS[fromCount]);
    for (let index = 0; index < 8 + Math.floor(Math.random() * 5); index += 1) {
      const point = swordSparkPoint(SWORD_REVEALS[fromCount]);
      particleBurst(point.x, point.y, 1);
    }
  });
  await waitForVisualCompletion([
    document.querySelector('#sword'),
    document.querySelector('#sword-shimmer'),
    document.querySelector('#sword-edge'),
  ]);
  activeSequence = { kind: 'forge-cool', beforeStage, revealOverride: SWORD_REVEALS[toCount] };
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
  await runForge(countBefore, 4, beforeStage, async () => {
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
  await wait(ANIMATION_TIMINGS.hatchRock + ANIMATION_TIMINGS.hatchPause + ANIMATION_TIMINGS.hatchJolt);
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
      document.querySelector('#creature').style.opacity = showNew ? '0' : '1';
      document.querySelector('#evolution-form').style.opacity = showNew ? '1' : '0';
      pulseSilhouette();
      await wait(500 - 450 * progress);
    }
    activeSequence.showNew = true;
    document.querySelector('#creature').style.opacity = '0';
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
  for (const spriteName of ['creature', 'ghost', 'sword']) {
    const element = document.querySelector(`#${spriteName}`);
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

if (override) {
  const banner = document.querySelector('#date-override');
  banner.hidden = false;
  banner.textContent = `Testing date: ${override}`;
}
setupLayoutTools();
render();
startAmbient();
