// Keyboard and mouse input. The game reads a direction every frame (-1 slow down,
// 0 cruise, +1 sprint) and one-shot actions (jump, slide, dash, confirm, pause,
// mute) that the loop consumes once, so holding a key never double-fires.

export const ACTION_JUMP = 1;
export const ACTION_SLIDE = 2;
export const ACTION_DASH = 4;
export const ACTION_CONFIRM = 8;
export const ACTION_PAUSE = 16;
export const ACTION_MUTE = 32;

const JUMP_KEYS = new Set([' ', 'ArrowUp', 'w', 'W']);
const SLIDE_KEYS = new Set(['ArrowDown', 's', 'S']);
const DASH_KEYS = new Set(['Shift', 'x', 'X']);
const CONFIRM_KEYS = new Set([' ', 'Enter']);
const PAUSE_KEYS = new Set(['p', 'P', 'Escape']);
const MUTE_KEYS = new Set(['m', 'M']);

export function createInput(canvas) {
  const held = new Set();
  let queued = 0;
  let pointerX = 0;
  let pointerY = 0;

  function press(action) {
    queued |= action;
  }

  function onKeyDown(event) {
    if (JUMP_KEYS.has(event.key)) {
      press(ACTION_JUMP);
      if (event.key === ' ') press(ACTION_CONFIRM);
      event.preventDefault();
    } else if (SLIDE_KEYS.has(event.key)) {
      press(ACTION_SLIDE);
      event.preventDefault();
    } else if (DASH_KEYS.has(event.key)) {
      press(ACTION_DASH);
    } else if (CONFIRM_KEYS.has(event.key)) {
      press(ACTION_CONFIRM);
    } else if (PAUSE_KEYS.has(event.key)) {
      press(ACTION_PAUSE);
    } else if (MUTE_KEYS.has(event.key)) {
      press(ACTION_MUTE);
    }
    held.add(event.key);
  }

  function onKeyUp(event) {
    held.delete(event.key);
  }

  function onPointerDown(event) {
    const rect = canvas.getBoundingClientRect();
    pointerX = event.clientX - rect.left;
    pointerY = event.clientY - rect.top;
    press(ACTION_JUMP);
    press(ACTION_CONFIRM);
  }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  canvas.addEventListener('pointerdown', onPointerDown);

  return {
    /** -1 while holding left/A, +1 while holding right/D, else 0. */
    direction() {
      const left = held.has('ArrowLeft') || held.has('a') || held.has('A');
      const right = held.has('ArrowRight') || held.has('d') || held.has('D');
      return (right ? 1 : 0) - (left ? 1 : 0);
    },
    slideHeld() {
      return held.has('ArrowDown') || held.has('s') || held.has('S');
    },
    takeActions() {
      const actions = queued;
      queued = 0;
      return actions;
    },
    pointer() {
      return { x: pointerX, y: pointerY };
    },
  };
}
