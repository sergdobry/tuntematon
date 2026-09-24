/* Tuntematon — Works archive page: filterable grid of every work,
   filtered by medium. Clicking a card opens the same WorkPopup used
   on the Home page (js/common.js) — a work has no separate detail
   page, the pop-up is its entire presentation.

   Data (workPool) lives in js/data/works.js, shared with home.js —
   load that file before this one. */

const works = workPool;

let activeFilter = 'all';

function allTags() {
  const s = new Set();
  works.forEach(w => w.tags.forEach(t => s.add(t)));
  return ['all', ...Array.from(s).sort()];
}

function renderFilters() {
  const wrap = document.getElementById('filters');
  wrap.innerHTML = '';
  allTags().forEach(tag => {
    const btn = document.createElement('button');
    btn.className = 'filter-btn' + (tag === activeFilter ? ' active' : '');
    btn.textContent = tag.toUpperCase();
    btn.onclick = () => { activeFilter = tag; renderFilters(); renderGrid(); };
    wrap.appendChild(btn);
  });
}

function renderGrid() {
  const grid = document.getElementById('works-grid');
  grid.innerHTML = '';
  const list = activeFilter === 'all' ? works : works.filter(w => w.tags.includes(activeFilter));
  list.forEach(item => {
    const div = document.createElement('div');
    div.className = 'cell';
    const label = document.createElement('span');
    label.className = 'px-title';
    label.textContent = item.t;
    if (item.img) {
      div.style.backgroundImage = "url('" + item.img + "')";
      div.style.backgroundColor = item.ph;
      applyImageContrast(label, item.img);
    } else {
      div.style.backgroundColor = item.ph;
      label.style.color = contrastColor(item.ph);
    }
    div.appendChild(label);
    div.tabIndex = 0;
    div.setAttribute('role', 'button');
    div.onclick = () => WorkPopup.open(item);
    div.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); WorkPopup.open(item); } };
    grid.appendChild(div);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  renderFilters();
  renderGrid();
});
