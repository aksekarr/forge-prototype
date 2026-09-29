(function () {
  'use strict';

  let frame = 'assets/tarot/card-frame.webp';

  async function loadCards() {
    const response = await fetch('assets/tarot/cards.json');
    if (!response.ok) throw new Error('Unable to load tarot cards: ' + response.status);
    const data = await response.json();
    frame = data.frame;
    return data;
  }

  // Pass one entry from data.cards; the requested edition must exist.
  function renderCard(card, options = {}) {
    const editionNumber = options.edition === undefined ? 1 : options.edition;
    const edition = card.editions.find(function (entry) {
      return entry.edition === editionNumber;
    });
    if (!edition) throw new RangeError('No edition ' + editionNumber + ' for ' + card.id);

    const element = document.createElement('article');
    element.className = 'tarot-card';
    element.dataset.cardId = card.id;
    element.dataset.edition = editionNumber;
    element.setAttribute('aria-label', card.name);

    const art = document.createElement('img');
    art.className = 'tarot-art';
    art.src = edition.art;
    art.alt = card.name;
    const border = document.createElement('img');
    border.className = 'tarot-frame';
    border.src = frame;
    border.alt = '';

    const name = document.createElement('h2');
    name.className = 'tarot-name';
    const label = document.createElement('span');
    const mark = document.createElement('span');
    if (card.numeral === null) {
      mark.className = 'tarot-star';
      mark.textContent = '✦';
      label.append(mark, ' ' + card.name + ' ', mark.cloneNode(true));
    } else {
      mark.className = 'tarot-numeral';
      mark.textContent = card.numeral;
      label.append(mark, ' · ' + card.name);
    }
    name.append(label);

    const textBox = document.createElement('div');
    textBox.className = 'tarot-text tarot-text-' + edition.layout;
    const text = document.createElement('p');
    text.className = 'tarot-copy';
    const closing = document.createElement('em');
    closing.textContent = edition.closing;
    if (edition.layout === 'verse') {
      edition.lines.forEach(function (line) {
        const verse = document.createElement('span');
        verse.className = 'tarot-line';
        verse.textContent = line;
        text.append(verse);
      });
      closing.className = 'tarot-line';
      text.append(closing);
    } else {
      text.append(edition.lines.join(' ') + ' ', closing);
    }
    textBox.append(text);
    element.append(art, border, name, textBox);
    return element;
  }

  let drawerCards = [];

  // Future earned progress has one integration point. Preview never writes storage.
  function earnedTarotIds() {
    if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
      const preview = new URLSearchParams(location.search).get('tarotPreview');
      if (preview === 'all') return drawerCards.map(function (card) { return card.id; });
      if (preview !== null) return preview.split(',').map(function (id) { return id.trim(); });
    }
    return [];
  }

  function setupDrawer() {
    const trigger = document.getElementById('tarot-open');
    if (!trigger) return;

    const status = document.createElement('p');
    status.className = 'tarot-drawer-status';
    status.setAttribute('role', 'status');
    const grid = document.createElement('div');
    grid.className = 'tarot-slots';
    const viewer = document.createElement('dialog');
    viewer.className = 'tarot-viewer';
    const viewerClose = document.createElement('button');
    viewerClose.type = 'button';
    viewerClose.className = 'drawer-close';
    viewerClose.textContent = 'Close card';
    const largeCard = document.createElement('div');
    largeCard.className = 'tarot-large-card';
    viewer.append(viewerClose, largeCard);
    document.body.append(viewer);

    window.MirrorwoodDrawers.dismissOnBackdrop(viewer);
    viewerClose.addEventListener('click', function () { viewer.close(); });
    let selectedSlot;
    viewer.addEventListener('close', function () {
      largeCard.replaceChildren();
      if (selectedSlot) selectedSlot.focus({ preventScroll: true });
    });
    let loading;
    trigger.addEventListener('click', async function () {
      trigger.disabled = true;
      status.hidden = false;
      status.textContent = 'Loading cards…';
      try {
        if (!loading) loading = loadCards().catch(function (error) { loading = null; throw error; });
        const data = await loading;
        drawerCards = data.cards;
        const earned = new Set(earnedTarotIds());
        grid.replaceChildren();
        drawerCards.forEach(function (card) {
          const slot = document.createElement(earned.has(card.id) ? 'button' : 'div');
          slot.className = 'tarot-slot';
          if (earned.has(card.id)) {
            slot.type = 'button';
            slot.classList.add('tarot-slot-earned');
            slot.setAttribute('aria-label', 'View ' + card.name);
            slot.setAttribute('aria-haspopup', 'dialog');
            slot.append(renderCard(card));
            slot.addEventListener('click', function () {
              selectedSlot = slot;
              largeCard.replaceChildren(renderCard(card));
              viewer.setAttribute('aria-label', card.name);
              viewer.showModal();
            });
          } else {
            slot.classList.add('tarot-slot-empty');
            slot.textContent = card.numeral === null ? '✦' : card.numeral;
          }
          grid.append(slot);
        });
        status.hidden = true;
      } catch (error) {
        status.textContent = 'Cards could not be loaded. Close and reopen Tarot to retry.';
      }
      trigger.disabled = false;
      window.MirrorwoodDrawers.open('Tarot', [status, grid], false, trigger);
    });
  }

  window.MirrorwoodTarot = { loadCards: loadCards, renderCard: renderCard, earnedTarotIds: earnedTarotIds,
    openOath: function () { return window.MirrorwoodDrawers.openOath(); } };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setupDrawer);
  else setupDrawer();
}());
