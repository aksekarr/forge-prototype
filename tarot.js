(function () {
  'use strict';

  let frame = 'assets/tarot/card-frame.webp';
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  function restShiny(element) {
    element.classList.remove('tarot-live');
    element.style.setProperty('--tarot-rx', '0deg');
    element.style.setProperty('--tarot-ry', '0deg');
  }

  // Shared by the drawer, viewer and reveal. No effects are added to standard cards.
  function addShinyEffect(element) {
    element.classList.add('tarot-shiny', 'tarot-rest-subtle');
    ['holo', 'glare', 'glint', 'sparkles'].forEach(function (effect) {
      const layer = document.createElement('div');
      layer.className = 'tarot-' + effect;
      layer.setAttribute('aria-hidden', 'true');
      if (effect === 'sparkles') {
        [[18, 20, .1], [74, 16, 1.1], [62, 52, .6], [24, 58, 1.8], [86, 40, 2.2], [46, 6, 1.4]].forEach(function (point) {
          const sparkle = document.createElement('i');
          sparkle.style.left = point[0] + '%';
          sparkle.style.top = point[1] + '%';
          sparkle.style.animationDelay = point[2] + 's';
          layer.append(sparkle);
        });
      }
      element.append(layer);
    });

    function move(event) {
      if (event.pointerType === 'touch' || reducedMotion.matches || element.classList.contains('tarot-burst')) return;
      const bounds = element.getBoundingClientRect();
      const x = Math.max(0, Math.min(1, (event.clientX - bounds.left) / bounds.width));
      const y = Math.max(0, Math.min(1, (event.clientY - bounds.top) / bounds.height));
      element.classList.add('tarot-live');
      element.style.setProperty('--tarot-ry', ((x - .5) * 18).toFixed(2) + 'deg');
      element.style.setProperty('--tarot-rx', ((.5 - y) * 18).toFixed(2) + 'deg');
      ['hx', 'gx'].forEach(function (name) { element.style.setProperty('--tarot-' + name, (x * 100).toFixed(1) + '%'); });
      ['hy', 'gy'].forEach(function (name) { element.style.setProperty('--tarot-' + name, (y * 100).toFixed(1) + '%'); });
    }
    element.addEventListener('pointerenter', move);
    element.addEventListener('pointermove', move);
    ['pointerleave', 'pointerup', 'pointercancel'].forEach(function (event) {
      element.addEventListener(event, function () { restShiny(element); });
    });
  }

  reducedMotion.addEventListener('change', function () {
    document.querySelectorAll('.tarot-shiny.tarot-live').forEach(restShiny);
  });

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
    if (card.numeral === null) addShinyEffect(element);
    return element;
  }

  function waitForImage(image) {
    if (image.decode) return image.decode();
    return new Promise(function (resolve, reject) {
      if (image.complete) {
        if (image.naturalWidth) resolve();
        else reject(new Error('Unable to load tarot image: ' + image.src));
        return;
      }
      image.addEventListener('load', resolve, { once: true });
      image.addEventListener('error', reject, { once: true });
    });
  }

  async function readyCard(element) {
    const assets = Array.from(element.querySelectorAll('img')).map(waitForImage);
    if (document.fonts) {
      // Explicitly request fonts used in the still-hidden dialog before it opens.
      assets.push(document.fonts.load('600 24px "Pixelify Sans"'));
      assets.push(document.fonts.load('400 18px "IM Fell English"'));
      assets.push(document.fonts.load('italic 400 18px "Tarot Fell Roman"'));
    }
    await Promise.all(assets);
    if (document.fonts) await document.fonts.ready;
  }

  function signalTarot() {
    const trigger = document.getElementById('tarot-open');
    if (!trigger) return;
    trigger.classList.remove('tarot-arrived');
    void trigger.offsetWidth;
    trigger.classList.add('tarot-arrived');
    trigger.addEventListener('animationend', function () {
      trigger.classList.remove('tarot-arrived');
    }, { once: true });
  }

  async function showReveal(cardId) {
    if (document.readyState === 'loading') {
      await new Promise(function (resolve) { document.addEventListener('DOMContentLoaded', resolve, { once: true }); });
    }
    const data = await loadCards();
    const card = data.cards.find(function (entry) { return entry.id === cardId; });
    if (!card) throw new RangeError('Unknown tarot card: ' + cardId);

    const shiny = card.numeral === null;
    const dialog = document.createElement('dialog');
    dialog.className = 'tarot-reveal' + (shiny ? ' tarot-reveal-shiny' : '');
    dialog.setAttribute('aria-label', 'Card drawn: ' + card.name);
    dialog.setAttribute('closedby', 'closerequest');
    const stage = document.createElement('div');
    stage.className = 'tarot-reveal-stage';
    const element = renderCard(card);
    stage.append(element);
    const keep = document.createElement('button');
    keep.type = 'button';
    keep.className = 'tarot-keep';
    keep.textContent = 'Keep';
    keep.autofocus = true;
    dialog.append(stage, keep);
    document.body.append(dialog);

    try {
      await readyCard(element);
    } catch (error) {
      dialog.remove();
      throw error;
    }

    return new Promise(function (resolve, reject) {
      const previousFocus = document.activeElement;
      let animationFrame;
      let settleTimer;
      function settle() {
        element.classList.remove('tarot-burst', 'tarot-turn');
        dialog.classList.remove('tarot-reveal-entering');
        if (shiny) element.classList.add('tarot-rest-subtle');
      }
      function motionChanged() {
        if (reducedMotion.matches) {
          clearTimeout(settleTimer);
          settle();
        }
      }
      keep.addEventListener('click', function () { dialog.close(); });
      dialog.addEventListener('cancel', function (event) {
        event.preventDefault();
        dialog.close();
      });
      dialog.addEventListener('close', function () {
        cancelAnimationFrame(animationFrame);
        clearTimeout(settleTimer);
        reducedMotion.removeEventListener('change', motionChanged);
        dialog.remove();
        document.documentElement.classList.remove('tarot-reveal-open');
        if (previousFocus && previousFocus.isConnected) previousFocus.focus({ preventScroll: true });
        signalTarot();
        resolve();
      }, { once: true });
      reducedMotion.addEventListener('change', motionChanged);
      document.documentElement.classList.add('tarot-reveal-open');
      try {
        dialog.showModal();
      } catch (error) {
        reducedMotion.removeEventListener('change', motionChanged);
        document.documentElement.classList.remove('tarot-reveal-open');
        dialog.remove();
        reject(error);
        return;
      }
      // Safari's native focus is settled before the entrance starts.
      animationFrame = requestAnimationFrame(function () {
        if (!dialog.open) return;
        dialog.classList.add('tarot-reveal-entering');
        if (shiny) element.classList.remove('tarot-rest-subtle');
        element.classList.add(shiny ? 'tarot-burst' : 'tarot-turn');
        settleTimer = setTimeout(settle, reducedMotion.matches ? 250 : shiny ? 2800 : 900);
      });
    });
  }

  let revealQueue = Promise.resolve();

  // Presentation only: resolves on Keep/Escape; rejects unknown IDs/load failures.
  // Concurrent calls are shown in order, without changing earned progress or storage.
  function revealCard(cardId) {
    const reveal = revealQueue.then(function () { return showReveal(cardId); });
    revealQueue = reveal.catch(function () {});
    return reveal;
  }

  let drawerCards = [];
  let earnedSource = function () { return []; };

  function setEarnedSource(source) {
    earnedSource = source;
  }

  // Read current earned progress whenever the drawer opens. Preview never writes storage.
  function earnedTarotIds() {
    if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
      const preview = new URLSearchParams(location.search).get('tarotPreview');
      if (preview === 'all') return drawerCards.map(function (card) { return card.id; });
      if (preview !== null) return preview.split(',').map(function (id) { return id.trim(); });
    }
    return earnedSource();
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
    viewerClose.textContent = '✕';
    viewerClose.setAttribute('aria-label', 'Close card');
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

  function setup() {
    setupDrawer();
    if (location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') return;
    const preview = new URLSearchParams(location.search).get('tarotReveal');
    if (!preview) return;
    async function previewReveal() {
      try {
        if (document.fonts) await document.fonts.ready;
        await revealCard(preview);
      } catch (error) {
        console.error('Tarot reveal preview failed:', error);
      }
    }
    if (document.readyState === 'complete') previewReveal();
    else window.addEventListener('load', previewReveal, { once: true });
  }

  window.MirrorwoodTarot = { loadCards: loadCards, renderCard: renderCard, revealCard: revealCard, earnedTarotIds: earnedTarotIds,
    setEarnedSource: setEarnedSource,
    openOath: function () { return window.MirrorwoodDrawers.openOath(); } };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setup);
  else setup();
}());
