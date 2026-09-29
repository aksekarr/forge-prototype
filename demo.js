// Three simulated days, using the same completion and record as a fortnight.
const DEMO_TASKS = ['Work out', 'Read 10 pages', 'Practise your craft'];
const DEMO_STATE_VERSION = 3;
const DEMO_DAY_COUNT = 3;

function demoTasks(count) {
  const completedAt = new Date().toISOString();
  return Object.fromEntries(DEMO_TASKS.slice(0, count).map(task => [task, completedAt]));
}

function seededDemoState(demoWelcomeSeen = false) {
  const firstDay = localDateString();
  return {
    firstDay,
    simulatedDate: firstDay,
    days: { [firstDay]: { tasks: demoTasks(2) } },
    rules: 'fortnight',
    tarot: { awards: {} },
    demoStateVersion: DEMO_STATE_VERSION,
    demoTaskStructure: [...DEMO_TASKS],
    demoWelcomeSeen,
  };
}

function prepareDemoPanels() {
  const tarotPanel = document.querySelector('#tarot-open').closest('.panel');
  document.querySelector('#demo-panel').append(tarotPanel);
  document.querySelector('#oath-card').remove();
}

function renderDemoControls() {
  const nextDay = document.querySelector('#next-demo-day');
  const lastDay = dayOffset(today) >= DEMO_DAY_COUNT - 1;
  const complete = isComplete(todayTasks());
  nextDay.hidden = lastDay && complete;
  nextDay.disabled = Boolean(activeSequence) || !complete || lastDay;
  document.querySelector('#reset-demo').disabled = Boolean(activeSequence);
}

function setupDemoWelcome() {
  if (!isDemoMode || state.demoWelcomeSeen) return;
  const welcome = document.querySelector('#demo-welcome');
  const closeButton = document.querySelector('#demo-welcome-close');
  openParchmentDialog(welcome, closeButton, () => {
    state.demoWelcomeSeen = true;
    save();
  });
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
    if (activeSequence || !isComplete(todayTasks()) || dayOffset(today) >= DEMO_DAY_COUNT - 1) return;
    today = addLocalDays(today, 1);
    state.simulatedDate = today;
    state.days[today] = { tasks: demoTasks(2) };
    save();
    render();
  });
  document.querySelector('#reset-demo').addEventListener('click', () => {
    if (activeSequence) return;
    state = seededDemoState(true);
    today = state.simulatedDate;
    save();
    render();
  });
  setupOathReveal(document.querySelector('#read-demo-oath'), demoOath);
}
