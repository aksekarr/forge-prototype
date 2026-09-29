(function () {
  'use strict';

  let frame = 'assets/tarot/card-frame.webp';
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const shinyPointers = new WeakMap();

  function restShiny(element) {
    const pointer = shinyPointers.get(element);
    if (pointer) {
      cancelAnimationFrame(pointer.frame);
      pointer.frame = null;
      pointer.position = null;
    }
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

    // The article stays flat and owns hit testing; only its inner face tilts.
    const face = document.createElement('div');
    face.className = 'tarot-shiny-face';
    face.append(...element.childNodes);
    element.append(face);
    const pointer = { frame: null, position: null };
    shinyPointers.set(element, pointer);

    function tiltPaused() {
      return reducedMotion.matches || element.classList.contains('tarot-tilt-paused') || element.classList.contains('tarot-burst');
    }
    function updateTilt() {
      pointer.frame = null;
      if (!pointer.position || !element.isConnected || tiltPaused()) return;
      const bounds = element.getBoundingClientRect();
      if (!bounds.width || !bounds.height) return;
      const x = Math.max(0, Math.min(1, (pointer.position.x - bounds.left) / bounds.width));
      const y = Math.max(0, Math.min(1, (pointer.position.y - bounds.top) / bounds.height));
      element.classList.add('tarot-live');
      element.style.setProperty('--tarot-ry', ((x - .5) * 18).toFixed(2) + 'deg');
      element.style.setProperty('--tarot-rx', ((.5 - y) * 18).toFixed(2) + 'deg');
      ['hx', 'gx'].forEach(function (name) { element.style.setProperty('--tarot-' + name, (x * 100).toFixed(1) + '%'); });
      ['hy', 'gy'].forEach(function (name) { element.style.setProperty('--tarot-' + name, (y * 100).toFixed(1) + '%'); });
    }
    function move(event) {
      if (event.pointerType === 'touch' || tiltPaused()) return;
      pointer.position = { x: event.clientX, y: event.clientY };
      if (pointer.frame === null) pointer.frame = requestAnimationFrame(updateTilt);
    }
    element.addEventListener('pointerenter', move);
    element.addEventListener('pointermove', move);
    ['pointerleave', 'pointerup', 'pointercancel'].forEach(function (event) {
      element.addEventListener(event, function () { restShiny(element); });
    });
  }

  reducedMotion.addEventListener('change', function () {
    document.querySelectorAll('.tarot-shiny').forEach(restShiny);
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

  function createRevealCard(card) {
    const flipper = document.createElement('div');
    flipper.className = 'tarot-reveal-flipper';
    const front = document.createElement('div');
    front.className = 'tarot-reveal-front';
    const element = renderCard(card);
    if (card.numeral === null) element.classList.add('tarot-tilt-paused');
    front.append(element);
    const back = document.createElement('img');
    back.className = 'tarot-reveal-back';
    back.src = 'assets/tarot/card-back.webp';
    back.alt = '';
    back.setAttribute('aria-hidden', 'true');
    flipper.append(front, back);
    return { flipper: flipper, element: element };
  }

  async function flyCardToDrawer(dialog, flipper, element, card, data) {
    const origin = flipper.getBoundingClientRect();
    const flight = document.createElement('dialog');
    flight.className = 'tarot-flight-layer';
    flight.setAttribute('aria-label', 'Keeping ' + card.name);
    const carrier = document.createElement('div');
    carrier.className = 'tarot-flight-card';
    Object.assign(carrier.style, {
      left: origin.left + 'px', top: origin.top + 'px',
      width: origin.width + 'px', height: origin.height + 'px'
    });
    carrier.append(element);
    flight.append(carrier);
    document.body.append(flight);
    let destination;
    let animation;
    function finishMotion() {
      if (reducedMotion.matches && animation) animation.finish();
    }
    // Escape during the short flight should finish landing, not dismiss the drawer.
    flight.addEventListener('cancel', function (event) {
      event.preventDefault();
      if (animation) animation.finish();
    });
    try {
      dialog.close();
      const tray = await openTarotDrawer(data);
      destination = Array.from(tray.grid.querySelectorAll('.tarot-slot-earned'))
        .find(function (slot) { return slot.dataset.cardId === card.id; });
      if (reducedMotion.matches) {
        if (destination) destination.replaceChildren(element);
        return;
      }
      if (destination) destination.classList.add('tarot-slot-arriving');
      // Measure the final slot before the drawer's entrance starts on the next frame.
      const target = destination && destination.getBoundingClientRect();
      flight.showModal();
      if (target && target.width && target.height) {
        const x = target.left - origin.left;
        const y = target.top - origin.top;
        const scaleX = target.width / origin.width;
        const scaleY = target.height / origin.height;
        animation = carrier.animate([
          { transform: 'translate(0, 0) scale(1)', offset: 0 },
          { transform: `translate(${x}px, ${y - 3}px) scale(${scaleX * 1.025}, ${scaleY * 1.025})`, offset: .84 },
          { transform: `translate(${x}px, ${y}px) scale(${scaleX}, ${scaleY})`, offset: 1 }
        ], { duration: 800, easing: 'cubic-bezier(.22, .7, .25, 1)', fill: 'forwards' });
      } else {
        animation = carrier.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 500, easing: 'ease-out', fill: 'forwards' });
      }
      reducedMotion.addEventListener('change', finishMotion);
      await animation.finished;
      if (destination) destination.replaceChildren(element);
    } finally {
      reducedMotion.removeEventListener('change', finishMotion);
      if (destination) destination.classList.remove('tarot-slot-arriving');
      if (animation) animation.cancel();
      if (flight.open) flight.close();
      flight.remove();
    }
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
    const { flipper, element } = createRevealCard(card);
    stage.append(flipper);
    const keep = document.createElement('button');
    keep.type = 'button';
    keep.className = 'tarot-keep';
    keep.textContent = 'Keep';
    keep.autofocus = true;
    dialog.append(stage, keep);
    document.body.append(dialog);

    try {
      await readyCard(stage);
    } catch (error) {
      dialog.remove();
      throw error;
    }

    return new Promise(function (resolve, reject) {
      let animationFrame;
      let entranceAnimation;
      let effectTimer;
      let keeping = false;
      function restFace() {
        element.classList.remove('tarot-burst', 'tarot-standard-sweep', 'tarot-tilt-paused');
        if (shiny) {
          restShiny(element);
          element.classList.add('tarot-rest-subtle');
        }
      }
      function settleEntrance() {
        cancelAnimationFrame(animationFrame);
        clearTimeout(effectTimer);
        flipper.classList.add('tarot-reveal-face-up');
        if (entranceAnimation) entranceAnimation.cancel();
        entranceAnimation = null;
        restFace();
        keep.disabled = keeping;
      }
      function motionChanged() {
        if (reducedMotion.matches) settleEntrance();
      }
      function cleanup() {
        settleEntrance();
        reducedMotion.removeEventListener('change', motionChanged);
        if (dialog.open) dialog.close();
        dialog.remove();
        document.documentElement.classList.remove('tarot-reveal-open');
      }
      async function keepCard() {
        if (keeping) return;
        keeping = true;
        settleEntrance();
        try {
          await flyCardToDrawer(dialog, flipper, element, card, data);
          cleanup();
          resolve();
        } catch (error) {
          cleanup();
          reject(error);
        }
      }
      async function enterCard() {
        if (!dialog.open || keeping) return;
        if (reducedMotion.matches) { settleEntrance(); return; }
        entranceAnimation = flipper.animate([
          { transform: 'rotateY(180deg)' }, { transform: 'rotateY(0deg)' }
        ], { delay: 1000, duration: 1200, easing: 'cubic-bezier(.45, 0, .2, 1)', fill: 'both' });
        try { await entranceAnimation.finished; }
        catch (error) { return; } // Keep/Escape or Reduce Motion can finish the ceremony early.
        flipper.classList.add('tarot-reveal-face-up');
        entranceAnimation.cancel();
        entranceAnimation = null;
        if (keeping) return;
        keep.disabled = false;
        if (shiny) element.classList.remove('tarot-rest-subtle');
        element.classList.add(shiny ? 'tarot-burst' : 'tarot-standard-sweep');
        effectTimer = setTimeout(restFace, shiny ? 2800 : 1000);
      }
      keep.addEventListener('click', keepCard);
      dialog.addEventListener('cancel', function (event) {
        event.preventDefault();
        keepCard();
      });
      reducedMotion.addEventListener('change', motionChanged);
      document.documentElement.classList.add('tarot-reveal-open');
      try {
        dialog.showModal();
      } catch (error) {
        cleanup();
        reject(error);
        return;
      }
      // Safari's native focus is settled before the hold and flip start.
      animationFrame = requestAnimationFrame(enterCard);
    });
  }

  let revealQueue = Promise.resolve();

  // Presentation only: Keep/Escape opens the drawer; resolves after landing.
  // Concurrent calls are shown in order, without changing earned progress or storage.
  function revealCard(cardId) {
    const reveal = revealQueue.then(function () { return showReveal(cardId); });
    revealQueue = reveal.catch(function () {});
    return reveal;
  }

  let drawerCards = [];
  let openTarotDrawer;
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
    openTarotDrawer = async function (suppliedData) {
      trigger.disabled = true;
      status.hidden = false;
      status.textContent = 'Loading cards…';
      try {
        if (suppliedData) loading = Promise.resolve(suppliedData);
        if (!loading) loading = loadCards().catch(function (error) { loading = null; throw error; });
        const data = suppliedData || await loading;
        drawerCards = data.cards;
        const earned = new Set(earnedTarotIds());
        grid.replaceChildren();
        drawerCards.forEach(function (card) {
          const slot = document.createElement(earned.has(card.id) ? 'button' : 'div');
          slot.className = 'tarot-slot';
          slot.dataset.cardId = card.id;
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
      return { grid: grid };
    };
    trigger.addEventListener('click', function () { openTarotDrawer(); });
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
