// Edit these scene-relative positions to match changes to the artwork.
const SCENES = [
  { name: 'clearing', file: 'scene-clearing.png', creature: { x: 53, y: 75 }, ghost: { x: 85, y: 19 }, sword: { x: 16, y: 21 } },
  { name: 'hollow', file: 'scene-hollow.png', creature: { x: 40, y: 76 }, ghost: { x: 76, y: 26 }, sword: { x: 56, y: 38 } },
  { name: 'stream', file: 'scene-stream.png', creature: { x: 30, y: 68 }, ghost: { x: 74, y: 24 }, sword: { x: 52, y: 36 } },
];

const ANIMATION_TIMINGS = {
  forgePulse: 800, forgeCool: 600, strikeCharge: 600, strikeHold: 300, strikeDrive: 250,
  impact: 800, hatch: 2800, evolve: 3000, finalFlash: 420,
};

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
  return `{ name: '${sceneConfig.name}', file: '${sceneConfig.file}', creature: ${point('creature')}, ghost: ${point('ghost')}, sword: ${point('sword')} }`;
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
function particleBurst(x, y, count, star = false) {
  if (reduceMotion) return;
  const layer = document.querySelector('#particles');
  for (let index = 0; index < count; index += 1) {
    const particle = document.createElement('i');
    const angle = Math.random() * Math.PI * 2;
    const distance = (star ? 22 : 12) + Math.random() * (star ? 48 : 26);
    particle.className = `spark${star ? ' star' : ''}`;
    particle.style.setProperty('--x', `${x}%`);
    particle.style.setProperty('--y', `${y}%`);
    particle.style.setProperty('--dx', `${Math.cos(angle) * distance}px`);
    particle.style.setProperty('--dy', `${Math.sin(angle) * distance}px`);
    particle.style.setProperty('--life', `${star ? .6 + Math.random() * .35 : .35 + Math.random() * .3}s`);
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

function render() {
  const offset = Math.max(0, dayOffset(today));
  const sceneConfig = SCENES[offset % SCENES.length];
  if (isLayoutMode && layoutSceneName !== sceneConfig.name) {
    layoutSceneName = sceneConfig.name;
    layoutPoints = copyPoints({ creature: sceneConfig.creature, ghost: sceneConfig.ghost, sword: sceneConfig.sword });
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

  scene.className = `scene${isLayoutMode ? ' layout-mode' : ''}${activeSequence ? ` ${activeSequence.kind}` : ''}${isLayoutMode && activeSequence ? ' replaying' : ''}${reduceMotion ? ' reduced-motion' : ''}`;
  sceneImage.src = `assets/${sceneConfig.file}`;
  creature.src = `assets/${creatureConfig.file}`;
  const width = displayStage === 0 ? EGG_WIDTH_PERCENT : (creatureConfig.width / 1024) * CREATURE_SCALE * 100;
  creature.style.setProperty('--creature-width', `${width}%`);
  applyPositions(sceneConfig);
  creature.classList.toggle('egg-idle', displayStage === 0 && !activeSequence && !isLayoutMode);
  creature.classList.toggle('idle', displayStage > 0 && !activeSequence && !isLayoutMode);
  const revealed = isLayoutMode ? 100 : activeSequence?.revealOverride ?? SWORD_REVEALS[completedCount(tasks)];
  sword.style.setProperty('--sword-clip', `${100 - revealed}%`);
  sword.classList.toggle('partial', !activeSequence && !isLayoutMode && revealed > 0 && revealed < 100);
  ghost.hidden = (!isLayoutMode && isTodayComplete && !activeSequence) || Boolean(activeSequence?.ghostGone);
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
    particleBurst(edge.x, edge.y, 8 + Math.floor(Math.random() * 5));
  });
  await wait(ANIMATION_TIMINGS.forgePulse);
  activeSequence = { kind: 'forge-cool', beforeStage, revealOverride: SWORD_REVEALS[toCount] };
  render();
  await wait(ANIMATION_TIMINGS.forgeCool);
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
  const distance = Math.max(0, Math.hypot(dx, dy) - swordBox.height / 2);
  scene.style.setProperty('--strike-angle', `${angle}deg`);
  scene.style.setProperty('--strike-dx', `${Math.sin(angle * Math.PI / 180) * distance}px`);
  scene.style.setProperty('--strike-dy', `${-Math.cos(angle * Math.PI / 180) * distance}px`);
}

async function runStrike(beforeStage) {
  activeSequence = { kind: 'strike-charge', beforeStage, revealOverride: 100 };
  render();
  requestAnimationFrame(setStrikeVector);
  await wait(ANIMATION_TIMINGS.strikeCharge);
  activeSequence.kind = 'strike-hold';
  render();
  await wait(ANIMATION_TIMINGS.strikeHold);
  activeSequence.kind = 'strike-drive';
  render();
  await wait(ANIMATION_TIMINGS.strikeDrive);
  activeSequence.kind = 'strike-impact';
  render();
  particleBurst(currentSceneConfig().ghost.x, currentSceneConfig().ghost.y, 10, true);
  await wait(ANIMATION_TIMINGS.impact);
}

async function runHatch(beforeStage, targetStage) {
  activeSequence = { kind: 'hatching', beforeStage, targetStage, revealOverride: 100, ghostGone: true, swordGone: true };
  render();
  await wait(ANIMATION_TIMINGS.hatch);
  activeSequence = { kind: 'hatch-reveal', beforeStage: targetStage, revealOverride: 100, ghostGone: true, swordGone: true };
  render();
  const point = currentSceneConfig().creature;
  particleBurst(point.x, point.y - 12, 16, true);
  await wait(ANIMATION_TIMINGS.finalFlash);
}

async function runEvolution(beforeStage, targetStage) {
  activeSequence = { kind: 'evolving', beforeStage, targetStage, revealOverride: 100, showNew: false, ghostGone: true, swordGone: true };
  render();
  if (!reduceMotion) {
    const start = performance.now();
    let flip = false;
    while (performance.now() - start < ANIMATION_TIMINGS.evolve) {
      const progress = (performance.now() - start) / ANIMATION_TIMINGS.evolve;
      activeSequence.showNew = flip = !flip;
      document.querySelector('#creature').style.opacity = flip ? '0' : '1';
      document.querySelector('#evolution-form').style.opacity = flip ? '1' : '0';
      await wait(400 - 350 * progress);
    }
  } else await wait(ANIMATION_TIMINGS.evolve);
  activeSequence = { kind: 'final-flash', beforeStage: targetStage, revealOverride: 100, ghostGone: true, swordGone: true };
  render();
  const point = currentSceneConfig().creature;
  particleBurst(point.x, point.y - 14, 18, true);
  await wait(ANIMATION_TIMINGS.finalFlash);
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
  tools.hidden = false;
  preview.innerHTML = CREATURES.map((creature, index) => `<option value="${index}">${index === 0 ? 'Egg' : `Stage ${index}`}</option>`).join('');
  preview.value = stage();
  layoutPreview = Number(preview.value);
  preview.addEventListener('change', () => { layoutPreview = Number(preview.value); render(); });
  for (const spriteName of ['creature', 'ghost', 'sword']) {
    const element = document.querySelector(`#${spriteName}`);
    element.addEventListener('pointerdown', event => {
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
