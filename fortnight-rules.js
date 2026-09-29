(function () {
  'use strict';

  const FORTNIGHT_LENGTH = 14;
  const SHINY_RATE = 1 / 8;

  function stageForKept(kept) {
    return Math.min(Math.ceil(kept / 2), 7);
  }

  function rewardForKeptDay(k) {
    if (k < 1 || k > FORTNIGHT_LENGTH) return null;
    return k % 2 === 1 ? 'evolve' : 'card';
  }

  function keptDaysInWindow(completeDates, firstDay) {
    const [year, month, day] = firstDay.split('-').map(Number);
    // Use UTC only as a calendar calculator, independent of local clock changes.
    const end = new Date(0);
    end.setUTCFullYear(year, month - 1, day + FORTNIGHT_LENGTH);
    const afterLastDay = end.toISOString().slice(0, 10);
    return Array.from(new Set(completeDates)).filter(function (date) {
      return date >= firstDay && date < afterLastDay;
    }).length;
  }

  function drawCard(cards, ownedIds, stage, rng) {
    const owned = new Set(ownedIds);
    const shinies = cards.filter(function (card) {
      return card.numeral === null && card.form <= stage && !owned.has(card.id);
    });
    function pick(pool) {
      return pool[Math.floor(rng() * pool.length)].id;
    }
    if (shinies.length && rng() < SHINY_RATE) return pick(shinies);
    const standards = cards.filter(function (card) {
      return card.numeral !== null && !owned.has(card.id);
    });
    if (standards.length) return pick(standards);
    if (shinies.length) return pick(shinies);
    return null;
  }

  window.MirrorwoodRules = {
    FORTNIGHT_LENGTH,
    SHINY_RATE,
    stageForKept,
    rewardForKeptDay,
    keptDaysInWindow,
    drawCard
  };
}());
