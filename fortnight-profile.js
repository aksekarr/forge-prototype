// Fortnight integration for personal links and the guided demo.
function newProfileRules() {
  return params.get('rules') === 'fortnight' ? { rules: 'fortnight' } : {};
}

function isFortnightProfile() {
  return (isProfileMode || isDemoMode) && state.rules === 'fortnight';
}

function fortnightCompletedDates() {
  return Object.keys(state.days).filter(date => isComplete(state.days[date].tasks || {}));
}

function fortnightStage() {
  return MirrorwoodRules.stageForKept(MirrorwoodRules.keptDaysInWindow(fortnightCompletedDates(), state.firstDay));
}

function fortnightStartMessage() {
  if (!isBeforeFirstDay()) return 'Your fortnight begins today.';
  if (dayOffset(today) === -1) return 'Your fortnight begins tomorrow.';
  const weekday = new Intl.DateTimeFormat(undefined, { weekday: 'long' }).format(new Date(`${state.firstDay}T00:00:00`));
  return `Your fortnight begins on ${weekday}.`;
}

function fortnightEarnedCardIds() {
  return isFortnightProfile() ? Object.values(state.tarot?.awards || {}) : [];
}

function fortnightRecordWeek(week) {
  return Array.from({ length: 7 }, (_, index) => {
    const offset = (week - 1) * 7 + index;
    const date = recordDate(offset);
    const tasks = date > today ? {} : state.days[date]?.tasks || {};
    return { day: offset + 1, date, count: completedCount(tasks), kept: isComplete(tasks) };
  });
}

function fortnightRecordCells(days) {
  return days.map(day => `<div class="record-cell ${day.date === today ? 'current' : ''}"><span class="record-day">Day ${day.day}</span><span class="record-value">${day.count} / ${currentTasks().length}</span></div>`).join('');
}

function openFortnightRecord(button) {
  const history = document.createElement('div');
  history.className = 'fortnight-record-history';
  [1, 2].forEach(week => {
    const section = document.createElement('section');
    const heading = document.createElement('h3');
    heading.id = `record-week-${week}`;
    heading.textContent = `Week ${week}`;
    section.setAttribute('aria-labelledby', heading.id);
    const cells = document.createElement('div');
    cells.className = 'record';
    cells.innerHTML = fortnightRecordCells(fortnightRecordWeek(week));
    section.append(heading, cells);
    history.append(section);
  });
  MirrorwoodDrawers.open('Record', [history], true, button);
}

function renderFortnightRecord() {
  const record = document.querySelector('#record');
  const currentWeek = dayOffset(today) < 7 ? 1 : 2;
  record.setAttribute('aria-label', `Week ${currentWeek} record`);
  record.closest('.side-column').setAttribute('aria-label', 'Daily tasks and fortnight record');
  record.innerHTML = fortnightRecordCells(fortnightRecordWeek(currentWeek));

  let tally = document.querySelector('#fortnight-record-tally');
  if (!tally) {
    tally = document.createElement('div');
    tally.id = 'fortnight-record-tally';
    tally.className = 'fortnight-record-tally';
    record.before(tally);
  }
  tally.replaceChildren();
  [1, 2].forEach(week => {
    const days = fortnightRecordWeek(week);
    if (days[6].date >= today) return;
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = `Week ${week} · ${days.filter(day => day.kept).length} of 7 kept`;
    button.setAttribute('aria-controls', 'tarot-drawer');
    button.setAttribute('aria-haspopup', 'dialog');
    button.addEventListener('click', () => openFortnightRecord(button));
    tally.append(button);
  });
}

async function awardFortnightCard(date, currentStage) {
  if (Object.prototype.hasOwnProperty.call(state.tarot?.awards || {}, date)) return;
  const data = await MirrorwoodTarot.loadCards();
  // Recheck after loading before making the date's permanent award.
  if (Object.prototype.hasOwnProperty.call(state.tarot?.awards || {}, date)) return;
  const cardId = isDemoMode ? 'mirror' : MirrorwoodRules.drawCard(data.cards, fortnightEarnedCardIds(), currentStage, Math.random);
  if (cardId === null) return;
  if (!state.tarot) state.tarot = {};
  if (!state.tarot.awards) state.tarot.awards = {};
  state.tarot.awards[date] = cardId;
  save();
  await MirrorwoodTarot.revealCard(cardId);
}

async function runFortnightCompletion(countBefore) {
  const date = today;
  const completeDates = fortnightCompletedDates();
  const kept = MirrorwoodRules.keptDaysInWindow(completeDates, state.firstDay);
  const beforeKept = MirrorwoodRules.keptDaysInWindow(completeDates.filter(day => day !== date), state.firstDay);
  const beforeStage = MirrorwoodRules.stageForKept(beforeKept);
  const afterStage = MirrorwoodRules.stageForKept(kept);
  // A completion beyond the calendar window still strikes, but earns no reward.
  const reward = MirrorwoodRules.keptDaysInWindow([date], state.firstDay)
    ? MirrorwoodRules.rewardForKeptDay(kept) : null;
  try {
    await runForge(countBefore, currentTasks().length, beforeStage, () => {});
    await runStrike(beforeStage);
    if (reward === 'evolve') {
      if (beforeStage === 0) await runHatch(beforeStage, afterStage);
      else await runEvolution(beforeStage, afterStage);
    } else if (reward === 'card') {
      activeSequence = { kind: 'tarot-reward', beforeStage: afterStage, revealOverride: 100, ghostGone: true, swordGone: true };
      render();
      await awardFortnightCard(date, afterStage);
    }
  } catch (error) {
    console.error('Fortnight completion failed:', error);
  } finally {
    activeSequence = null;
    render();
  }
}
