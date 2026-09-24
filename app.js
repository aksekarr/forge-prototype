// Edit these scene-relative positions to match changes to the artwork.
const SCENES = [
  { file: 'scene-clearing.png', creatureLeft: '12%', creatureBottom: '15%', ghostLeft: '58%', ghostBottom: '25%', swordLeft: '48%', swordBottom: '15%' },
  { file: 'scene-hollow.png', creatureLeft: '13%', creatureBottom: '14%', ghostLeft: '58%', ghostBottom: '25%', swordLeft: '48%', swordBottom: '15%' },
  // The stream's usable grass is on the left, so both characters stay left of the water.
  { file: 'scene-stream.png', creatureLeft: '8%', creatureBottom: '16%', ghostLeft: '48%', ghostBottom: '26%', swordLeft: '39%', swordBottom: '16%' },
];

const TASKS = ['Warm-ups', 'Hey Joe practice', 'Logic session', 'Read'];
const STORAGE_KEY = 'seven-days-prototype';
const CREATURE_SCALE = 0.46;
const SWORD_REVEALS = [0, 22, 40, 70, 100];
const CREATURES = [
  { file: 'egg.png', width: 829 },
  ...Array.from({ length: 7 }, (_, index) => ({ file: `stage-${index + 1}.png`, width: [456, 509, 648, 919, 974, 1056, 1193][index] })),
];

const params = new URLSearchParams(window.location.search);
if (params.get('reset') === '1') {
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
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  return state;
}
let state = loadState();
let activeSequence = null;

function save() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
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

function render() {
  const offset = Math.max(0, dayOffset(today));
  const sceneConfig = SCENES[offset % SCENES.length];
  const tasks = todayTasks();
  const isTodayComplete = isComplete(tasks);
  const displayStage = activeSequence ? activeSequence.beforeStage : stage();
  const creatureConfig = CREATURES[displayStage];
  const scene = document.querySelector('#scene');
  const sceneImage = document.querySelector('#scene-image');
  const creature = document.querySelector('#creature');
  const sword = document.querySelector('#sword');
  const ghost = document.querySelector('#ghost');

  scene.className = `scene${activeSequence ? ` complete ${activeSequence.kind}` : ''}`;
  sceneImage.src = `assets/${sceneConfig.file}`;
  creature.src = `assets/${creatureConfig.file}`;
  creature.style.setProperty('--creature-width', `${(creatureConfig.width / 1024) * CREATURE_SCALE * 100}%`);
  for (const [property, value] of Object.entries(sceneConfig)) {
    if (property !== 'file') scene.style.setProperty(`--${property.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`)}`, value);
  }
  creature.classList.toggle('egg-idle', displayStage === 0 && !activeSequence);
  const revealed = activeSequence ? 100 : SWORD_REVEALS[completedCount(tasks)];
  sword.style.setProperty('--sword-clip', `${100 - revealed}%`);
  ghost.hidden = isTodayComplete && !activeSequence;

  document.querySelector('#day-number').textContent = offset + 1;
  document.querySelector('#date-label').textContent = formatDate(today);
  document.querySelector('#task-list').innerHTML = TASKS.map(task => {
    const checked = Boolean(tasks[task]);
    return `<div class="task"><span>${task}</span><button class="tick" data-task="${task}" aria-pressed="${checked}" aria-label="${checked ? `Undo ${task}` : `Complete ${task}` }" ${activeSequence ? 'disabled' : ''}>✓</button></div>`;
  }).join('');
  document.querySelector('#record').innerHTML = Array.from({ length: 7 }, (_, index) => {
    const date = recordDate(index);
    const count = completedCount(state.days[date]?.tasks || {});
    return `<div class="record-cell ${date === today ? 'current' : ''}"><span class="record-day">Day ${index + 1}</span><span class="record-value">${count} / 4</span></div>`;
  }).join('');
}

document.querySelector('#task-list').addEventListener('click', event => {
  const button = event.target.closest('.tick');
  if (!button || activeSequence) return;
  const task = button.dataset.task;
  const tasks = todayTasks();
  const wasComplete = isComplete(tasks);
  if (!state.days[today]) state.days[today] = { tasks: {} };
  if (state.days[today].tasks[task]) delete state.days[today].tasks[task];
  else state.days[today].tasks[task] = new Date().toISOString();
  save();
  const nowComplete = isComplete(todayTasks());
  if (!wasComplete && nowComplete) runCompletion();
  else render();
});

function runCompletion() {
  const completedAfter = completedDays();
  const afterStage = Math.min(7, completedAfter);
  const beforeStage = Math.min(7, completedAfter - 1);
  activeSequence = { beforeStage, kind: beforeStage === 7 ? 'complete' : beforeStage === 0 ? 'hatching' : 'evolving' };
  render();
  const duration = activeSequence.kind === 'hatching' ? 3450 : activeSequence.kind === 'evolving' ? 1500 : 850;
  window.setTimeout(() => { activeSequence = null; render(); }, duration);
}

if (override) {
  const banner = document.querySelector('#date-override');
  banner.hidden = false;
  banner.textContent = `Testing date: ${override}`;
}
render();
