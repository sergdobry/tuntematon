/* Tuntematon — Home page: the modular grid.
   Top: 8 fixed info-modules + 8 work-modules, strictly alternating
   (info, work, info, work...), positions reshuffled on every load.
   Below that: every remaining work not shown up top, in random order —
   the feed grows as the work pool grows, instead of capping at 8.
   Info-modules: random black/white background, auto-contrast text.
   Work-modules: photo background, caption color auto-computed from
   the photo's average color. See README.md for the full spec.

   Data (infoItems, workPool) lives in js/data/works.js, shared with
   works.js — load that file before this one. */

const bwCombos = ['#0F0F0F', '#F5F3EF'];

/* New/recent works go at the FRONT of workPool (js/data/works.js) —
   this function takes them from there. Half the 8 shown work-modules
   come from the most recently added works, half from the rest of the
   pool — both halves picked at random, per the agreed 50/50 rule.
   This only governs the top, alternating section — see render(). */
function pickWorks(pool, n) {
  const recentCount = Math.min(Math.ceil(n / 2), pool.length);
  const recent = pool.slice(0, recentCount);
  const rest = pool.slice(recentCount);
  const fromRecent = shuffle(recent).slice(0, Math.min(n - Math.floor(n / 2), recent.length));
  const fromRest = shuffle(rest).slice(0, n - fromRecent.length);
  return shuffle([...fromRecent, ...fromRest]);
}

function renderCell(item) {
  const div = document.createElement('div');
  div.className = 'cell';
  if (item.type === 'work') {
    div.classList.add('work-cell');
    const label = document.createElement('span');
    label.className = 'px-title';
    label.textContent = item.t;
    if (item.img) {
      div.style.backgroundImage = "url('" + item.img + "')";
      div.style.backgroundColor = item.ph;
      label.style.color = '#F5F3EF';
      applyImageContrast(label, item.img);
    } else {
      div.style.backgroundColor = item.ph;
      label.style.color = contrastColor(item.ph);
    }
    div.appendChild(label);
  } else {
    const bg = bwCombos[Math.floor(Math.random() * bwCombos.length)];
    const fg = contrastColor(bg);
    div.style.background = bg;
    const label = document.createElement('span');
    label.className = 'px-title';
    label.style.color = fg;
    label.textContent = item.t;
    div.appendChild(label);
  }
  div.tabIndex = 0;
  div.setAttribute('role', 'button');
  const go = () => { if (item.href) { window.location.href = item.href; } else { WorkPopup.open(item); } };
  div.onclick = go;
  div.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } };
  return div;
}

function render() {
  const grid = document.getElementById('home-grid');
  grid.innerHTML = '';
  const infoShuffled = shuffle(infoItems);
  const featured = pickWorks(workPool, Math.min(8, workPool.length));

  const items = [];
  for (let i = 0; i < infoShuffled.length; i++) {
    items.push(infoShuffled[i]);
    if (featured[i]) items.push(featured[i]);
  }

  // Every work not already featured up top, appended below in random
  // order — the feed just gets longer as the pool grows, no cap.
  const remaining = shuffle(workPool.filter(w => !featured.includes(w)));
  items.push(...remaining);

  items.forEach(item => grid.appendChild(renderCell(item)));

  requestAnimationFrame(() => {
    document.querySelectorAll('#home-grid .cell').forEach((c, i) => {
      setTimeout(() => c.classList.add('show'), i * 12);
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  render();
  document.getElementById('shuffle-btn').onclick = render;
});
