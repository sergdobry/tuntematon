/* Tuntematon — "sliding puzzle" prototype for the Home grid.
   Free-swap drag (not classic 15-puzzle: no empty slot — any two
   modules just swap places). Pointer Events give one code path for
   both mouse and touch, so this file has no separate mobile/desktop
   branches.

   Deliberately independent of home.js: attaches with event delegation
   to #home-grid, so it keeps working across every re-render/reshuffle
   without needing to be re-initialized. Layout is NOT persisted across
   reloads — a fresh page load always reshuffles, by design (see
   design-system notes elsewhere in the project).

   Prototype scope: Home grid only. Port to Works archive
   (js/works.js's #works-grid) later if this feels right. */

(function () {
  const DRAG_THRESHOLD = 6; // px of movement before a press counts as a drag, not a click

  let grid = null;
  let draggingCell = null;
  let dropTarget = null;
  let startX = 0, startY = 0;
  let moved = false;
  let suppressNextClick = false;

  function onPointerDown(e) {
    const cell = e.target.closest('.cell');
    if (!cell || !grid.contains(cell)) return;
    // Only the primary mouse button / a single touch/pen contact.
    if (e.button !== undefined && e.button !== 0) return;

    draggingCell = cell;
    startX = e.clientX;
    startY = e.clientY;
    moved = false;

    cell.setPointerCapture(e.pointerId);
    cell.addEventListener('pointermove', onPointerMove);
    cell.addEventListener('pointerup', onPointerUp);
    cell.addEventListener('pointercancel', onPointerCancel);
  }

  function onPointerMove(e) {
    if (!draggingCell) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    if (!moved) {
      if (Math.abs(dx) + Math.abs(dy) < DRAG_THRESHOLD) return;
      moved = true;
      draggingCell.classList.add('puzzle-dragging');
      // Let elementFromPoint "see through" the dragged tile to whatever
      // is visually underneath it.
      draggingCell.style.pointerEvents = 'none';
    }

    draggingCell.style.transform = `translate(${dx}px, ${dy}px)`;

    const under = document.elementFromPoint(e.clientX, e.clientY);
    const targetCell = under ? under.closest('.cell') : null;
    const validTarget = targetCell && grid.contains(targetCell) && targetCell !== draggingCell ? targetCell : null;

    if (validTarget !== dropTarget) {
      if (dropTarget) dropTarget.classList.remove('puzzle-drop-target');
      dropTarget = validTarget;
      if (dropTarget) dropTarget.classList.add('puzzle-drop-target');
    }
  }

  function onPointerUp(e) {
    if (!draggingCell) return;
    const wasMoved = moved;
    const target = dropTarget;

    cleanupDragVisuals();

    if (wasMoved) {
      if (target) swapCells(draggingCell, target);
      // The browser fires a synthetic 'click' right after pointerup for
      // mouse input — swallow exactly that one so a drag doesn't also
      // open the pop-up / navigate.
      suppressNextClick = true;
      setTimeout(() => { suppressNextClick = false; }, 0);
    }

    teardownPointerListeners(e);
  }

  function onPointerCancel(e) {
    cleanupDragVisuals();
    teardownPointerListeners(e);
  }

  function cleanupDragVisuals() {
    if (draggingCell) {
      draggingCell.classList.remove('puzzle-dragging');
      draggingCell.style.pointerEvents = '';
      draggingCell.style.transform = '';
    }
    if (dropTarget) dropTarget.classList.remove('puzzle-drop-target');
    dropTarget = null;
    moved = false;
  }

  function teardownPointerListeners(e) {
    if (!draggingCell) return;
    draggingCell.removeEventListener('pointermove', onPointerMove);
    draggingCell.removeEventListener('pointerup', onPointerUp);
    draggingCell.removeEventListener('pointercancel', onPointerCancel);
    try { draggingCell.releasePointerCapture(e.pointerId); } catch (err) { /* already released */ }
    draggingCell = null;
  }

  /* Swap two grid children by DOM position — reordering nodes (not
     content) so every bound handler, dataset, and rendered state each
     cell already carries just travels with it. */
  function swapCells(a, b) {
    const placeholder = document.createComment('puzzle-swap');
    a.parentNode.insertBefore(placeholder, a);
    b.parentNode.insertBefore(a, b);
    placeholder.parentNode.insertBefore(b, placeholder);
    placeholder.remove();
  }

  function onClickCapture(e) {
    if (!suppressNextClick) return;
    e.stopPropagation();
    e.preventDefault();
  }

  function init(gridId) {
    grid = document.getElementById(gridId);
    if (!grid) return;
    grid.addEventListener('pointerdown', onPointerDown);
    // Capture phase: must run before home.js's own click handler (bound
    // directly on each cell) gets a chance to fire.
    grid.addEventListener('click', onClickCapture, true);
  }

  document.addEventListener('DOMContentLoaded', () => init('home-grid'));
})();
