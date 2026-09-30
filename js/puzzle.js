/* Tuntematon — "sliding puzzle" prototype for the Home grid.
   Free-swap drag (not classic 15-puzzle: no empty slot — any two
   modules just swap places). Pointer Events give one code path for
   both mouse and touch, with one deliberate difference in *when* a
   drag starts:

   - Mouse/pen: drag starts as soon as the pointer moves past a small
     threshold. There's no scroll gesture to protect on desktop.
   - Touch: dragging only starts after a LONG PRESS (~600ms) with the
     finger held still. A normal quick touch-and-move is left alone —
     the browser scrolls the page as usual. This is the same pattern
     iOS/Android home screens use for "hold to rearrange icons", and
     it's the fix for an earlier version of this file, which disabled
     touch scrolling on every cell outright (`touch-action: none`) —
     that made the grid impossible to scroll on a phone at all, since
     the modules fill the whole screen and there's no "empty" area left
     to scroll from. See the long comment above activateDrag() for why
     a long press is what actually makes this work technically, not
     just a UX preference.

   Layout is NOT persisted across reloads — a fresh page load always
   reshuffles, by design (see design-system notes elsewhere in the
   project).

   Prototype scope: Home grid only. Port to Works archive
   (js/works.js's #works-grid) later if this feels right. */

(function () {
  const MOUSE_DRAG_THRESHOLD = 6;   // px of movement before a mouse press counts as a drag
  const TOUCH_MOVE_CANCEL = 10;     // px of movement during the long-press wait that cancels it (= the user meant to scroll)
  const LONG_PRESS_MS = 600;        // how long a touch must be held still before it becomes a drag

  let grid = null;
  let draggingCell = null;
  let dropTarget = null;
  let startX = 0, startY = 0;
  let pointerId = null;
  let pointerType = 'mouse';
  let dragActive = false;           // true once a drag has actually started (mouse: past threshold; touch: after long press)
  let longPressTimer = null;
  let suppressNextClick = false;

  function onPointerDown(e) {
    const cell = e.target.closest('.cell');
    if (!cell || !grid.contains(cell)) return;
    if (e.button !== undefined && e.button !== 0) return; // primary button / single touch-pen contact only

    draggingCell = cell;
    pointerId = e.pointerId;
    pointerType = e.pointerType || 'mouse';
    startX = e.clientX;
    startY = e.clientY;
    dragActive = false;

    cell.addEventListener('pointermove', onPointerMove);
    cell.addEventListener('pointerup', onPointerUp);
    cell.addEventListener('pointercancel', onPointerCancel);

    if (pointerType === 'touch') {
      // Deliberately do NOT capture the pointer or preventDefault yet —
      // that would block the browser's normal scrolling before we know
      // whether this touch is a scroll or a long-press-to-drag. We just
      // wait, watching for movement (see onPointerMove).
      longPressTimer = setTimeout(() => activateDrag(cell), LONG_PRESS_MS);
    } else {
      // Mouse/pen: no ambiguity with scrolling, so no need to wait.
      cell.setPointerCapture(pointerId);
    }
  }

  /* Why a long press specifically fixes the scroll conflict:
     `touch-action` (the CSS property that tells the browser whether it's
     allowed to scroll on touch) is fixed for the whole gesture the
     instant a touch begins — it cannot be toggled mid-gesture and have
     the browser retroactively honor the change. So the only way to let
     *some* touches scroll and *others* drag is to never disable
     touch-action at all, and instead decide, in JS, before the finger
     has moved anywhere, whether this touch is going to be a drag. If we
     wait until the finger has been held still for LONG_PRESS_MS, we know
     no scroll gesture has started yet (the browser only begins panning
     once it sees directional movement) — so activating drag mode at
     that exact moment, and only then calling preventDefault() on
     subsequent moves, cleanly takes over before the browser had any
     reason to start scrolling in the first place. */
  function activateDrag(cell) {
    if (draggingCell !== cell) return; // pointer already lifted/cancelled
    dragActive = true;
    try { cell.setPointerCapture(pointerId); } catch (err) { /* pointer already gone */ }
    cell.classList.add('puzzle-dragging');
    cell.style.pointerEvents = 'none'; // let elementFromPoint see the tile underneath
  }

  function onPointerMove(e) {
    if (!draggingCell || e.pointerId !== pointerId) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    if (!dragActive) {
      if (pointerType === 'touch') {
        // Finger moved before the long-press fired — this is a scroll,
        // not a drag attempt. Cancel the timer and back off entirely;
        // we never captured the pointer or called preventDefault, so
        // the browser's native scroll just continues uninterrupted.
        if (Math.abs(dx) + Math.abs(dy) > TOUCH_MOVE_CANCEL) {
          clearTimeout(longPressTimer);
          teardownPointerListeners();
          draggingCell = null;
        }
        return;
      }
      // Mouse/pen: small-movement threshold before a drag counts as started.
      if (Math.abs(dx) + Math.abs(dy) < MOUSE_DRAG_THRESHOLD) return;
      dragActive = true;
      draggingCell.classList.add('puzzle-dragging');
      draggingCell.style.pointerEvents = 'none';
    }

    e.preventDefault(); // once dragging, stop the page from scrolling under the finger too
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
    if (!draggingCell || e.pointerId !== pointerId) return;
    clearTimeout(longPressTimer);
    const wasDragging = dragActive;
    const target = dropTarget;

    cleanupDragVisuals();

    if (wasDragging) {
      if (target) swapCells(draggingCell, target);
      // The browser fires a synthetic 'click' right after pointerup —
      // swallow exactly that one so a drag doesn't also open the
      // pop-up / navigate. (For touch, the long press itself means no
      // native click was going to treat this as a tap anyway, but this
      // stays harmless and correct either way.)
      suppressNextClick = true;
      setTimeout(() => { suppressNextClick = false; }, 0);
    }

    teardownPointerListeners();
  }

  function onPointerCancel(e) {
    if (e.pointerId !== pointerId) return;
    clearTimeout(longPressTimer);
    cleanupDragVisuals();
    teardownPointerListeners();
  }

  function cleanupDragVisuals() {
    if (draggingCell) {
      draggingCell.classList.remove('puzzle-dragging');
      draggingCell.style.pointerEvents = '';
      draggingCell.style.transform = '';
    }
    if (dropTarget) dropTarget.classList.remove('puzzle-drop-target');
    dropTarget = null;
    dragActive = false;
  }

  function teardownPointerListeners() {
    if (!draggingCell) return;
    draggingCell.removeEventListener('pointermove', onPointerMove);
    draggingCell.removeEventListener('pointerup', onPointerUp);
    draggingCell.removeEventListener('pointercancel', onPointerCancel);
    try { draggingCell.releasePointerCapture(pointerId); } catch (err) { /* already released or never captured */ }
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
