// Fortnight-only profile integration. App state and animation helpers live in app.js.
function newProfileRules() {
  return params.get('rules') === 'fortnight' ? { rules: 'fortnight' } : {};
}

function isFortnightProfile() {
  return isProfileMode && state.rules === 'fortnight';
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

async function awardFortnightCard(date, currentStage) {
  if (Object.prototype.hasOwnProperty.call(state.tarot?.awards || {}, date)) return;
  const data = await MirrorwoodTarot.loadCards();
  // Recheck after loading before making the date's permanent award.
  if (Object.prototype.hasOwnProperty.call(state.tarot?.awards || {}, date)) return;
  const cardId = MirrorwoodRules.drawCard(data.cards, fortnightEarnedCardIds(), currentStage, Math.random);
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
