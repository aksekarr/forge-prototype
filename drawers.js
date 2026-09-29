(function () {
  'use strict';

  // A dialog backdrop targets the dialog itself; padding is still inside the tray.
  function dismissOnBackdrop(dialog) {
    let startedOutside = false;
    function outside(event) {
      const bounds = dialog.getBoundingClientRect();
      return event.target === dialog && (event.clientX < bounds.left ||
        event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom);
    }
    dialog.addEventListener('pointerdown', function (event) { startedOutside = outside(event); });
    dialog.addEventListener('click', function (event) {
      if (startedOutside && outside(event)) dialog.close();
      startedOutside = false;
    });
  }

  function setupDrawer() {
    const trigger = document.getElementById('tarot-open');
    if (!trigger) return;

    const drawer = document.createElement('dialog');
    drawer.id = 'tarot-drawer';
    drawer.className = 'drawer-shell';
    drawer.setAttribute('aria-labelledby', 'drawer-title');
    const header = document.createElement('div');
    header.className = 'drawer-header';
    const title = document.createElement('h2');
    title.id = 'drawer-title';
    title.className = 'drawer-title';
    title.textContent = 'Tarot';
    const close = document.createElement('button');
    close.type = 'button';
    close.className = 'drawer-close';
    close.textContent = '✕';
    close.setAttribute('aria-label', 'Close drawer');
    header.append(title, close);
    const interior = document.createElement('div');
    interior.className = 'drawer-interior';
    ['left', 'right'].forEach(function (side) {
      const panel = document.createElement('div');
      panel.className = 'drawer-side-panel drawer-side-panel-' + side;
      panel.setAttribute('aria-hidden', 'true');
      panel.textContent = '✦';
      interior.append(panel);
    });
    const content = document.createElement('div');
    content.className = 'drawer-content';
    interior.append(content);
    drawer.append(header, interior);

    document.body.append(drawer);
    dismissOnBackdrop(drawer);
    close.addEventListener('click', function () { drawer.close(); });
    let opener = trigger;
    drawer.addEventListener('close', function () {
      drawer.classList.remove('drawer-enter');
      document.documentElement.classList.remove('drawer-open');
      opener.focus({ preventScroll: true });
    });

    // Every drawer uses this same dialog, frame, header and dismissal handlers.
    function openDrawer(label, nodes, reading, button) {
      opener = button;
      title.textContent = label;
      drawer.classList.toggle('drawer-reading', reading);
      content.replaceChildren(...nodes);
      content.scrollTop = 0;
      document.documentElement.classList.add('drawer-open');
      drawer.showModal();
      // Start motion after native dialog focus has settled, avoiding Safari scroll jumps.
      requestAnimationFrame(function () {
        if (drawer.open) drawer.classList.add('drawer-enter');
      });
    }

    // Move the existing prose, keeping the demo's source and reveal untouched.
    if (new URLSearchParams(location.search).get('demo') !== '1') {
      const oathSource = document.querySelector('#shared-oath');
      const oathNodes = Array.from(oathSource.querySelector('.oath-panel').children)
        .filter(function (node) { return node.tagName !== 'H2'; });
      const about = document.querySelector('[aria-labelledby="about-title"]');
      const ghostNodes = Array.from(about.querySelector('article').querySelectorAll('p'));
      oathNodes.concat(ghostNodes).forEach(function (node) { node.remove(); });
      oathSource.remove();
      about.remove();
      window.MirrorwoodDrawers.openOath = function () {
        openDrawer('The Oath', oathNodes, true, document.getElementById('read-oath'));
      };
      const ghostTrigger = document.getElementById('ghost-open');
      ghostTrigger.addEventListener('click', function () {
        openDrawer('The Ghost', ghostNodes, true, ghostTrigger);
      });
    }

    window.MirrorwoodDrawers.open = openDrawer;
  }

  window.MirrorwoodDrawers = { dismissOnBackdrop: dismissOnBackdrop };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setupDrawer);
  else setupDrawer();
}());
