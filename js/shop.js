/* Tuntematon — Shop page. Placeholder catalogue only: no real
   editions, pricing, or purchase flow have been supplied yet (see
   README.md, "Open items"). Card layout and pop-up are final; the
   data and the Purchase button's behavior are not. */

const shopItems = [
  { t: "Edition Print No. 1", price: "$XXX", meta: "Edition 1/50 · in stock", ph: "#0F0F0F", fg: "#F5F3EF", desc: "[Placeholder — description pending real product.]" },
  { t: "Edition Print No. 2", price: "$XXX", meta: "Edition 1/25 · on request", ph: "#7a2e24", fg: "#F5F3EF", desc: "[Placeholder — description pending real product.]" },
  { t: "Edition Print No. 3", price: "$XXX", meta: "Edition 1/10 · sold out", ph: "#F5F3EF", fg: "#0F0F0F", desc: "[Placeholder — description pending real product.]" },
];

function renderShop() {
  const grid = document.getElementById('shop-grid');
  shopItems.forEach(item => {
    const div = document.createElement('div');
    div.className = 'cell';
    div.style.background = item.ph;
    div.style.color = item.fg;
    div.classList.add('shop-cell');
    div.innerHTML = '<span class="px-title">' + item.t + '</span><span class="price-tag">' + item.price + '</span>';
    div.tabIndex = 0;
    div.setAttribute('role', 'button');
    div.onclick = () => openShopItem(item);
    div.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openShopItem(item); } };
    grid.appendChild(div);
  });
}

function openShopItem(item) {
  document.getElementById('ov-title').textContent = item.t;
  document.getElementById('ov-meta').textContent = item.meta + ' · ' + item.price;
  document.getElementById('ov-desc').textContent = item.desc;
  document.getElementById('overlay').classList.add('open');
}
function closeShopOverlay() {
  document.getElementById('overlay').classList.remove('open');
}

document.addEventListener('DOMContentLoaded', () => {
  renderShop();
  document.getElementById('overlay-inner').onclick = closeShopOverlay;
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeShopOverlay(); });
});
