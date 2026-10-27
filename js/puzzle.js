/* Tuntematon — "sliding puzzle" prototype for the Home grid.
   Free-swap drag (not classic 15-puzzle: no empty slot — any two
   modules just swap places). Pointer Events give one code path for
   both mouse and touch, with one deliberate difference in *when* a
   drag starts:

   - Mouse/pen: drag starts as soon as the pointer moves past a small
     threshold. There's no scroll gesture to protect on desktop.
   - Touch: dragging only starts after a LONG PRESS (~600ms) with the
     finger held still. A normal quick touch-and-move scrolls the page
     instead — see "Why scrolling is done manually" below for why that
     scroll is implemented by hand in this file, not left to the browser.

   Layout is NOT persisted across reloads — a fresh page load always
   reshuffles, by design (see design-system notes elsewhere in the
   project).

   Prototype scope: Home grid only. Port to Works archive
   (js/works.js's #works-grid) later if this feels right. */

/* Why scrolling is done manually instead of letting the browser do it:
   `touch-action` (the CSS property that tells the browser whether it
   may scroll on touch) is fixed for an entire gesture the instant a
   touch begins and can't be changed mid-gesture. Two attempts at
   picking the "right" value both failed in real testing:

   1. `touch-action: none` — stops the browser from ever scrolling
      these cells, which also broke ordinary scrolling, since the
      modules fill the whole screen and there's nowhere else to swipe
      from.
   2. `touch-action: auto` / `pan-y` — lets the browser scroll, but
      that means the browser's own compositor is independently watching
      the same touch and may decide, on its own schedule, that it's a
      scroll gesture — sometimes before our long-press timer fires,
      sometimes seemingly after. Either way, there is no reliable
      signal in JS for "the browser just took this touch away from
      you", so a long-press that depends on winning that race is
      exactly as flaky as the race itself.

   The fix: give the browser nothing (`touch-action: none`, cells never
   scroll on their own) and do the scrolling ourselves in JS. During
   the long-press wait, if the finger moves more than a small amount,
   we treat it as a scroll and call `window.scrollBy()` to match the
   finger 1:1 for as long as it moves — not native momentum
   scrolling (no coasting once the finger lifts), but deterministic,
   and it can't be stolen by the browser because the browser was never
   offered it in the first place. */

(function () {
  const MOUSE_DRAG_THRESHOLD = 6;   // px of movement before a mouse press counts as a drag
  const TOUCH_INTENT_THRESHOLD = 16; // px (straight-line distance, not x+y) of movement before a touch commits to "scroll" instead of waiting for the long press. Was 12 measured as |dx|+|dy|, which a slightly drifting held finger could cross.
  const LONG_PRESS_MS = 600;        // how long a touch must be held still before it becomes a drag
  const LIFT_SCALE = 1.05;          // the lifted tile "pops" slightly so it's obvious the long press registered
  const VERSION = 'v5-touchstart-block';
  // On-screen event log. Turned on by ANY of: index-debug.html (sets
  // window.PUZZLE_DEBUG), ?debug in the URL, or #debug in the URL.
  // The separate index-debug.html exists because mobile file managers
  // often drop the ?query part of a file:// address.
  const DEBUG = window.PUZZLE_DEBUG === true || /[?&]debug\b/.test(location.search) || location.hash === '#debug';

  let grid = null;
  let draggingCell = null;
  let dropTarget = null;
  let startX = 0, startY = 0;
  let lastY = 0;                    // previous pointermove's Y, for frame-to-frame manual scroll
  let pointerId = null;
  let pointerType = 'mouse';
  let dragActive = false;           // true once a drag has actually started (mouse: past threshold; touch: after long press)
  let scrolling = false;            // true once a touch has committed to manual scrolling instead of a drag
  let longPressTimer = null;
  let suppressNextClick = false;
  let lastPointerType = 'mouse';    // survives after the gesture ends, so contextmenu/selectstart (which can fire late) can still tell it was a touch
  let downAt = 0;                   // timestamp of the current pointerdown, for the debug log
  let movesSinceArm = 0;            // pointermoves seen after the drag armed (debug only)
  let selectedCell = null;          // fallback "picked up" tile: tap another tile to swap (see onPointerCancel)

  /* On-screen event log for testing on a real phone, where there's no
     console. Only exists when the page is opened with ?debug=1.
     Answers "what did the browser actually do during the long press" —
     in particular whether it fired pointercancel / contextmenu and
     how many ms after the finger went down. */
  let debugBox = null;
  function dbg(msg) {
    if (!DEBUG) return;
    if (!debugBox) {
      debugBox = document.createElement('pre');
      debugBox.style.cssText = 'position:fixed;left:0;bottom:0;right:0;max-height:38vh;overflow:hidden;margin:0;padding:6px;background:rgba(0,0,0,0.85);color:#7CFC00;font:11px/14px monospace;z-index:99999;pointer-events:none;white-space:pre-wrap;';
      document.body.appendChild(debugBox);
    }
    const t = downAt ? Math.round(performance.now() - downAt) : 0;
    const lines = debugBox.textContent ? debugBox.textContent.split('\n') : [];
    lines.push(String(t).padStart(4, ' ') + 'ms  ' + msg);
    debugBox.textContent = lines.slice(-14).join('\n');
  }

  function onPointerDown(e) {
    lastPointerType = e.pointerType || 'mouse';
    const cell = e.target.closest('.cell');
    if (!cell || !grid.contains(cell)) return;
    if (e.button !== undefined && e.button !== 0) return; // primary button / single touch-pen contact only

    downAt = performance.now();
    movesSinceArm = 0;
    dbg('pointerdown type=' + lastPointerType);
    draggingCell = cell;
    pointerId = e.pointerId;
    pointerType = e.pointerType || 'mouse';
    startX = e.clientX;
    startY = e.clientY;
    lastY = e.clientY;
    dragActive = false;
    scrolling = false;

    // Captured immediately and unconditionally (not deferred into the
    // long-press timeout) — this is what makes event delivery to this
    // element reliable regardless of what CSS/visual state changes
    // happen later. Capture only affects which element *receives* the
    // events; it has no bearing on scrolling, so it's safe to do this
    // before we know whether this touch will turn into a drag or a
    // scroll.
    try { cell.setPointerCapture(pointerId); } catch (err) { /* ignore */ }
    cell.addEventListener('pointermove', onPointerMove, { passive: false });
    cell.addEventListener('pointerup', onPointerUp);
    cell.addEventListener('pointercancel', onPointerCancel);

    if (pointerType === 'touch') {
      longPressTimer = setTimeout(() => activateDrag(cell), LONG_PRESS_MS);
    }
  }

  function activateDrag(cell) {
    if (draggingCell !== cell || scrolling) return; // already scrolling, lifted, or cancelled
    dragActive = true;
    cell.classList.add('puzzle-dragging');
    cell.style.transform = `scale(${LIFT_SCALE})`;
    // Short buzz where supported (Android): confirms the long press registered.
    if (navigator.vibrate) { try { navigator.vibrate(15); } catch (err) { /* ignore */ } }
    dbg('LONG PRESS ACTIVATED (drag armed)');
  }

  function onPointerMove(e) {
    if (!draggingCell || e.pointerId !== pointerId) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    if (dragActive) {
      e.preventDefault();
      movesSinceArm++;
      draggingCell.style.transform = `translate(${dx}px, ${dy}px) scale(${pointerType === 'touch' ? LIFT_SCALE : 1})`;
      updateDropTarget(e.clientX, e.clientY);
      return;
    }

    if (pointerType === 'touch') {
      if (scrolling) {
        e.preventDefault();
        window.scrollBy(0, lastY - e.clientY);
        lastY = e.clientY;
        return;
      }
      if (Math.hypot(dx, dy) > TOUCH_INTENT_THRESHOLD) {
        // Commits to "this is a scroll, not a hold" — cancel the
        // pending long press and start moving the page ourselves.
        // (touch-action: none means the browser never saw this as a
        // scroll gesture at all, so there's nothing for it to fight us
        // over.)
        clearTimeout(longPressTimer);
        scrolling = true;
        dbg('moved ' + Math.round(Math.hypot(dx, dy)) + 'px before long press -> SCROLL mode');
        e.preventDefault();
        window.scrollBy(0, lastY - e.clientY);
        lastY = e.clientY;
      }
      return;
    }

    // Mouse/pen: small-movement threshold before a drag counts as started.
    if (Math.abs(dx) + Math.abs(dy) < MOUSE_DRAG_THRESHOLD) return;
    dragActive = true;
    draggingCell.classList.add('puzzle-dragging');
    e.preventDefault();
    draggingCell.style.transform = `translate(${dx}px, ${dy}px)`;
    updateDropTarget(e.clientX, e.clientY);
  }

  /* Finds the cell visually under (x, y), ignoring the cell currently
     being dragged — elementsFromPoint returns the full stack at that
     point, so we just skip past the dragged tile itself instead of
     needing to toggle its pointer-events on and off. */
  function updateDropTarget(x, y) {
    const stack = document.elementsFromPoint(x, y);
    let targetCell = null;
    for (const el of stack) {
      const c = el.closest && el.closest('.cell');
      if (c && c !== draggingCell && grid.contains(c)) { targetCell = c; break; }
    }
    if (targetCell !== dropTarget) {
      if (dropTarget) dropTarget.classList.remove('puzzle-drop-target');
      dropTarget = targetCell;
      if (dropTarget) dropTarget.classList.add('puzzle-drop-target');
    }
  }

  function onPointerUp(e) {
    if (!draggingCell || e.pointerId !== pointerId) return;
    clearTimeout(longPressTimer);
    const wasDragging = dragActive;
    const target = dropTarget;
    dbg('pointerup dragActive=' + wasDragging + ' scrolling=' + scrolling + ' target=' + !!target);

    const cell = draggingCell;
    const wasScrolling = scrolling;
    const heldMs = performance.now() - downAt;

    cleanupDragVisuals();

    if (wasDragging) {
      if (target) swapCells(cell, target);
      clearSelection();
      // The browser fires a synthetic 'click' right after pointerup —
      // swallow exactly that one so a drag doesn't also open the
      // pop-up / navigate.
      suppressNextClick = true;
      setTimeout(() => { suppressNextClick = false; }, 0);
    }

    teardownPointerListeners();

    // Touch tap (no drag, no scroll). We block touchstart's default (see
    // init), which also suppresses the browser's own synthetic click, so
    // taps are re-created here by hand.
    if (pointerType === 'touch' && !wasDragging && !wasScrolling && heldMs < LONG_PRESS_MS) {
      if (selectedCell && selectedCell !== cell) {
        // A tile was picked up earlier (drag was cancelled by the
        // browser) — this tap is the "drop here" half of the fallback.
        dbg('tap on another tile -> swap with selected');
        const picked = selectedCell;
        clearSelection();
        swapCells(picked, cell);
      } else if (selectedCell === cell) {
        dbg('tap on selected tile -> deselect');
        clearSelection();
      } else {
        dbg('tap -> click()');
        cell.click();
      }
    }
  }

  function onPointerCancel(e) {
    if (e.pointerId !== pointerId) return;
    clearTimeout(longPressTimer);
    dbg('POINTERCANCEL - browser took the touch away (dragActive=' + dragActive + ', moves since arm=' + movesSinceArm + ')');
    const cell = draggingCell;
    const wasArmed = dragActive && pointerType === 'touch';
    cleanupDragVisuals();
    teardownPointerListeners();
    if (wasArmed && cell) {
      // The long press registered but the browser cancelled the gesture
      // before the finger could drag. Don't lose it: leave the tile
      // visibly picked up and let the next tap on another tile finish
      // the swap.
      clearSelection();
      selectedCell = cell;
      cell.classList.add('puzzle-dragging');
      cell.style.transform = `scale(${LIFT_SCALE})`;
      dbg('SELECTED - tap another tile to swap with it');
    }
  }

  function clearSelection() {
    if (!selectedCell) return;
    selectedCell.classList.remove('puzzle-dragging');
    selectedCell.style.transform = '';
    selectedCell = null;
  }

  function cleanupDragVisuals() {
    if (draggingCell) {
      draggingCell.classList.remove('puzzle-dragging');
      draggingCell.style.transform = '';
    }
    if (dropTarget) dropTarget.classList.remove('puzzle-drop-target');
    dropTarget = null;
    dragActive = false;
    scrolling = false;
  }

  function teardownPointerListeners() {
    if (!draggingCell) return;
    draggingCell.removeEventListener('pointermove', onPointerMove);
    draggingCell.removeEventListener('pointerup', onPointerUp);
    draggingCell.removeEventListener('pointercancel', onPointerCancel);
    try { draggingCell.releasePointerCapture(pointerId); } catch (err) { /* already released */ }
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
    if (DEBUG) {
      dbg('DEBUG ON - puzzle.js ' + VERSION + ' | grid found: ' + !!grid + ' | PointerEvent: ' + (typeof window.PointerEvent));
      // Global probes: do pointer/touch events reach the page at all,
      // and does anything cancel them?
      document.addEventListener('pointerdown', (e) => dbg('doc pointerdown <' + e.target.tagName.toLowerCase() + (e.target.className ? '.' + String(e.target.className).split(' ')[0] : '') + '> ' + e.pointerType), true);
      document.addEventListener('pointercancel', (e) => dbg('doc pointercancel ' + e.pointerType), true);
      document.addEventListener('touchcancel', () => dbg('doc touchcancel'), true);
    }
    if (!grid) return;
    grid.addEventListener('pointerdown', onPointerDown);
    // Capture phase: must run before home.js's own click handler (bound
    // directly on each cell) gets a chance to fire.
    grid.addEventListener('click', onClickCapture, true);

    /* Android Chrome treats a ~500ms press as a "long press" of its own:
       it fires `contextmenu` and may cancel the pointer sequence
       (pointercancel), which is shorter than our LONG_PRESS_MS and so
       kills the drag before it can arm. iOS has the equivalent callout
       and text-selection handles. Suppress all of that, but only for
       touch — a desktop right-click menu on a tile is harmless. */
    grid.addEventListener('contextmenu', (e) => {
      dbg('contextmenu event (touch=' + (lastPointerType === 'touch') + ')');
      if (lastPointerType === 'touch') e.preventDefault();
    });
    grid.addEventListener('selectstart', (e) => {
      if (lastPointerType === 'touch') e.preventDefault();
    });
    grid.addEventListener('dragstart', (e) => e.preventDefault());

    /* The key one. Cancelling touchstart tells the browser this touch is
       entirely ours: it then generates NO gestures for it — no long
       press, no context menu / selection handling, no native scroll, no
       synthetic click. The pointercancel that kept ending the drag
       ~140ms after the long press came from the browser's own gesture
       recognizer; with touchstart cancelled, that recognizer never runs.
       Cost: the synthetic click is gone too, so onPointerUp re-creates
       taps by hand (cell.click()). Must be non-passive to be allowed to
       call preventDefault. */
    grid.addEventListener('touchstart', (e) => {
      if (!e.target.closest('.cell')) return;
      dbg('touchstart (default prevented)');
      e.preventDefault();
    }, { passive: false });
  }

  document.addEventListener('DOMContentLoaded', () => init('home-grid'));
})();
