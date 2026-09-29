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

  window.MirrorwoodTarot = { loadCards: loadCards, renderCard: renderCard };
}());
