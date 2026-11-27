// Gobble Run — the world: one turkey, one very determined farmer, and a farm
// full of things to trip over. The turkey runs right on its own; the player
// steers its speed, jumps, flaps, slides and dashes. The farmer trails behind
// by a gap in pixels: stumble and he closes in, sprint and dash and he falls
// back. Reach the forest gate at ESCAPE_DISTANCE and the turkey is pardoned;
// let the gap hit zero, or lose all three lives, and it is dinner.
//
// Everything here is pure simulation (no DOM, no audio): the renderer draws
// state, the screenshot stager drives it with an autopilot, and the headless
// play-test below the game runs it the same way.

import { DASH, DIFFICULTY, ESCAPE_DISTANCE, FARMER, FIELD, LIVES, POINTS, PX_PER_METRE, STAGES, TURKEY } from './config.js';

export const EVENT_NONE = 0;
export const EVENT_HIT = 1;
export const EVENT_OVER = 2;
export const EVENT_ESCAPED = 4;
export const EVENT_PICKUP = 8;
export const EVENT_STAGE = 16;

export const KIND_FENCE = 'fence';
export const KIND_BALE = 'bale';
export const KIND_PUMPKIN = 'pumpkin';
export const KIND_PUDDLE = 'puddle';
export const KIND_OVEN = 'oven';
export const KIND_KNIFE = 'knife';
export const KIND_HAYSTACK = 'haystack';
export const KIND_CORN = 'corn';
export const KIND_GOLD_CORN = 'goldcorn';
export const KIND_FEATHER = 'feather';
export const KIND_PIE = 'pie';

const HAZARDS = {
  [KIND_FENCE]: { width: 34, height: 56 },
  [KIND_BALE]: { width: 64, height: 52 },
  [KIND_PUMPKIN]: { width: 44, height: 40 },
  [KIND_PUDDLE]: { width: 70, height: 12 },
  [KIND_OVEN]: { width: 120, height: 96 },
  [KIND_KNIFE]: { width: 26, height: 74 },
};

/** Which hazards each stage throws at the turkey. */
const STAGE_HAZARDS = [
  [KIND_FENCE, KIND_BALE, KIND_PUDDLE, KIND_PUMPKIN],
  [KIND_FENCE, KIND_BALE, KIND_PUDDLE, KIND_PUMPKIN, KIND_KNIFE],
  [KIND_OVEN, KIND_KNIFE, KIND_FENCE, KIND_PUDDLE, KIND_PUMPKIN],
];

function stageIndexFor(distance) {
  for (let i = STAGES.length - 1; i >= 0; i -= 1) {
    if (distance >= STAGES[i].from) return i;
  }
  return 0;
}

export function stageFor(distance) {
  return STAGES[stageIndexFor(distance)];
}

export function createWorld(random) {
  const state = {
    time: 0,
    distance: 0,
    score: 0,
    lives: LIVES,
    stage: 0,
    speed: TURKEY.speed,
    gap: FARMER.startGap,
    over: false,
    escaped: false,
    won: false,
    turkey: {
      x: TURKEY.x,
      y: FIELD.groundY - TURKEY.height,
      vy: 0,
      width: TURKEY.width,
      height: TURKEY.height,
      onGround: true,
      sliding: false,
      slideTimer: 0,
      dashTimer: 0,
      dashCooldown: 0,
      flapsLeft: 1,
      invulnerable: 0,
      hidden: false,
      hideTimer: 0,
      stumbleTimer: 0,
      runPhase: 0,
    },
    farmer: { x: TURKEY.x - FARMER.startGap, runPhase: 0, searching: false, searchTimer: 0 },
    obstacles: [],
    pickups: [],
    particles: [],
    floaters: [],
    spawnIn: 1.0,
    lastSpawnX: 0,
    shake: 0,
    alarm: false,
  };

  function reset() {
    state.time = 0;
    state.distance = 0;
    state.score = 0;
    state.lives = LIVES;
    state.stage = 0;
    state.speed = TURKEY.speed;
    state.gap = FARMER.startGap;
    state.over = false;
    state.escaped = false;
    state.won = false;
    state.turkey.x = TURKEY.x;
    state.turkey.y = FIELD.groundY - TURKEY.height;
    state.turkey.vy = 0;
    state.turkey.onGround = true;
    state.turkey.sliding = false;
    state.turkey.slideTimer = 0;
    state.turkey.dashTimer = 0;
    state.turkey.dashCooldown = 0;
    state.turkey.flapsLeft = 1;
    state.turkey.invulnerable = 0;
    state.turkey.hidden = false;
    state.turkey.hideTimer = 0;
    state.turkey.stumbleTimer = 0;
    state.turkey.runPhase = 0;
    state.farmer.x = TURKEY.x - FARMER.startGap;
    state.farmer.runPhase = 0;
    state.farmer.searching = false;
    state.farmer.searchTimer = 0;
    state.obstacles.length = 0;
    state.pickups.length = 0;
    state.particles.length = 0;
    state.floaters.length = 0;
    state.spawnIn = 1.0;
    state.lastSpawnX = 0;
    state.shake = 0;
    state.alarm = false;
  }

  function burst(x, y, count, color, speed) {
    for (let i = 0; i < count; i += 1) {
      state.particles.push({
        x,
        y,
        vx: random.range(-speed, speed),
        vy: random.range(-speed * 0.9, -speed * 0.15),
        life: random.range(0.35, 0.8),
        maxLife: 0.8,
        size: random.range(3, 7),
        color,
      });
    }
  }

  function floater(x, y, text, color) {
    state.floaters.push({ x, y, text, color, life: 1.1 });
  }

  function spawnPattern() {
    const stage = state.stage;
    const table = STAGE_HAZARDS[stage];
    const kind = random.pick(table);
    const size = HAZARDS[kind];
    const x = FIELD.width + 60;
    const obstacle = { kind, x, y: FIELD.groundY - size.height, width: size.width, height: size.height, active: true, phase: random.range(0, Math.PI * 2), passed: false };
    if (kind === KIND_KNIFE) {
      // A carving knife swings down from above on a rope. Most hang high: the
      // turkey runs safely underneath, but jumping into the blade is a mistake.
      // Some hang low, and only sliding under them is safe.
      const low = state.stage > 0 && random.next() < 0.4;
      obstacle.low = low;
      obstacle.rope = low ? 40 : 150;
      obstacle.y = FIELD.groundY - size.height - obstacle.rope;
      obstacle.swing = random.range(0.5, 1.1);
    }
    if (kind === KIND_PUDDLE) obstacle.y = FIELD.groundY - size.height;
    state.obstacles.push(obstacle);
    state.lastSpawnX = x;

    // Corn trails and the occasional haystack to hide in ride along.
    const roll = random.next();
    if (roll < 0.45) {
      const n = 3 + Math.floor(random.next() * 3);
      for (let i = 0; i < n; i += 1) {
        state.pickups.push({
          kind: KIND_CORN,
          x: x + 90 + i * 46,
          y: FIELD.groundY - 46 - (i % 2) * 34,
          width: 30,
          height: 30,
          active: true,
          phase: random.range(0, Math.PI * 2),
        });
      }
    } else if (roll < 0.58) {
      state.pickups.push({ kind: KIND_GOLD_CORN, x: x + 120, y: FIELD.groundY - 120, width: 34, height: 34, active: true, phase: 0 });
    } else if (roll < 0.66) {
      state.pickups.push({ kind: KIND_FEATHER, x: x + 120, y: FIELD.groundY - 130, width: 30, height: 30, active: true, phase: 0 });
    } else if (roll < 0.7) {
      state.pickups.push({ kind: KIND_PIE, x: x + 120, y: FIELD.groundY - 60, width: 34, height: 30, active: true, phase: 0 });
    } else if (roll < 0.82) {
      state.obstacles.push({ kind: KIND_HAYSTACK, x: x + 200, y: FIELD.groundY - 74, width: 92, height: 74, active: true, phase: 0, passed: false });
    }
  }

  function overlaps(a, b) {
    return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
  }

  function turkeyBox() {
    const t = state.turkey;
    const height = t.sliding ? TURKEY.slideHeight : TURKEY.height;
    return { x: t.x + 8, y: t.y + (TURKEY.height - height), width: t.width - 16, height };
  }

  function stumble() {
    const t = state.turkey;
    if (t.invulnerable > 0) return EVENT_NONE;
    if (t.hidden) return EVENT_NONE;
    state.gap = Math.max(0, state.gap - FARMER.stumbleLoss);
    state.shake = 0.45;
    t.stumbleTimer = 0.55;
    t.invulnerable = TURKEY.invulnerable;
    burst(t.x + 40, t.y + 20, 14, '#ffffff', 260);
    burst(t.x + 40, t.y + 20, 8, '#d2691e', 200);
    if (state.gap <= 0) {
      state.over = true;
      return EVENT_HIT | EVENT_OVER;
    }
    state.lives -= 1;
    if (state.lives <= 0) {
      state.over = true;
      return EVENT_HIT | EVENT_OVER;
    }
    return EVENT_HIT;
  }

  function step(dt, direction, actions, slideHeld) {
    if (state.over || state.escaped) return EVENT_NONE;
    let events = EVENT_NONE;
    const t = state.turkey;
    state.time += dt;

    // --- speed: sprint right, dawdle left, dash bursts ---
    let target = TURKEY.speed;
    if (direction > 0) target = TURKEY.sprint;
    else if (direction < 0) target = TURKEY.dawdle;
    if (t.dashTimer > 0) target = DASH.speed;
    state.speed += (target - state.speed) * Math.min(1, dt * 6);
    if (t.dashCooldown > 0) t.dashCooldown -= dt;
    if (t.dashTimer > 0) t.dashTimer -= dt;
    if (actions.dash && t.dashCooldown <= 0 && t.dashTimer <= 0) {
      t.dashTimer = DASH.seconds;
      t.dashCooldown = DASH.cooldown;
      state.gap = Math.min(FARMER.maxGap, state.gap + FARMER.dashGain);
      burst(t.x + 10, t.y + 50, 10, '#ffe9bd', 220);
      events |= EVENT_PICKUP; // dash whoosh is a sound cue, not a pickup
    }

    // --- jump / double flap ---
    if (actions.jump) {
      if (t.onGround) {
        t.vy = TURKEY.jumpVelocity;
        t.onGround = false;
        t.flapsLeft = 1;
        burst(t.x + 30, FIELD.groundY, 6, '#c9b18a', 140);
      } else if (t.flapsLeft > 0) {
        t.vy = TURKEY.flapVelocity;
        t.flapsLeft -= 1;
        burst(t.x + 20, t.y + 40, 8, '#ffffff', 180);
      }
    }

    // --- slide / hide in a haystack ---
    if (slideHeld && t.onGround) {
      t.sliding = true;
      t.slideTimer = 0.6;
      for (const o of state.obstacles) {
        if (o.active && o.kind === KIND_HAYSTACK && Math.abs(o.x - t.x) < 130 && !t.hidden) {
          t.hidden = true;
          t.hideTimer = 1.4;
          state.farmer.searching = true;
          state.farmer.searchTimer = 1.4;
          state.gap = Math.min(FARMER.maxGap, state.gap + 130);
          floater(t.x + 30, t.y - 20, 'HIDDEN!', '#7ee081');
          break;
        }
      }
    }
    if (t.slideTimer > 0) {
      t.slideTimer -= dt;
      if (t.slideTimer <= 0) t.sliding = false;
    }
    if (t.hideTimer > 0) {
      t.hideTimer -= dt;
      if (t.hideTimer <= 0) t.hidden = false;
    }
    if (t.stumbleTimer > 0) t.stumbleTimer -= dt;
    if (t.invulnerable > 0) t.invulnerable -= dt;

    // --- vertical motion ---
    t.vy += TURKEY.gravity * dt;
    t.y += t.vy * dt;
    if (t.y >= FIELD.groundY - TURKEY.height) {
      t.y = FIELD.groundY - TURKEY.height;
      t.vy = 0;
      t.onGround = true;
      t.flapsLeft = 1;
    } else if (t.vy !== 0) {
      t.onGround = false;
    }
    t.runPhase += dt * (state.speed / 28);

    // --- distance, score, stage ---
    const metres = (state.speed * dt) / PX_PER_METRE;
    state.distance += metres;
    state.score += metres * POINTS.metre;
    const newStage = stageIndexFor(state.distance);
    if (newStage !== state.stage) {
      state.stage = newStage;
      state.score += POINTS.stageBonus;
      floater(t.x + 40, t.y - 40, `${STAGES[newStage].name}! +${POINTS.stageBonus}`, '#ffd94d');
      events |= EVENT_STAGE;
    }
    if (state.distance >= ESCAPE_DISTANCE) {
      state.escaped = true;
      state.won = true;
      state.over = true;
      state.score += POINTS.escapeBonus + state.lives * 200;
      return events | EVENT_ESCAPED | EVENT_OVER;
    }

    // --- the farmer: he gains while the turkey dawdles, loses while it sprints ---
    const f = state.farmer;
    if (f.searching) {
      f.searchTimer -= dt;
      if (f.searchTimer <= 0) f.searching = false;
    } else if (direction < 0) {
      state.gap = Math.max(0, state.gap - FARMER.dawdleLossPerSecond * dt);
    } else if (direction === 0 && t.onGround) {
      state.gap = Math.min(FARMER.maxGap, state.gap + FARMER.cleanGainPerSecond * dt);
    }
    if (direction > 0) state.gap = Math.min(FARMER.maxGap, state.gap + FARMER.cleanGainPerSecond * 1.6 * dt);
    if (state.gap <= 0) {
      state.over = true;
      return events | EVENT_OVER;
    }
    f.x = t.x - state.gap;
    f.runPhase += dt * (state.speed / 30);
    state.alarm = state.gap < 110;

    // --- spawning: denser as the stages climb ---
    const progress = Math.min(1, state.distance / ESCAPE_DISTANCE);
    const interval = DIFFICULTY.spawnStart + (DIFFICULTY.spawnEnd - DIFFICULTY.spawnStart) * progress;
    state.spawnIn -= dt;
    const nearestX = Math.min(...state.obstacles.filter((o) => o.active).map((o) => o.x), FIELD.width + 400);
    if (state.spawnIn <= 0 && nearestX > FIELD.width - DIFFICULTY.minGapPx) {
      spawnPattern();
      state.spawnIn = interval * random.range(0.85, 1.25);
    }

    // --- move the world left past the turkey ---
    const dx = state.speed * dt;
    for (const o of state.obstacles) {
      if (!o.active) continue;
      o.x -= dx;
      if (o.kind === KIND_KNIFE) o.phase += dt * o.swing * 2.2;
      if (o.x + o.width < -80) o.active = false;
      // A clean pass over a knife or oven is worth a point of nerve.
      if (!o.passed && o.x + o.width < t.x) {
        o.passed = true;
        if (o.kind === KIND_KNIFE || o.kind === KIND_OVEN) {
          state.score += 5;
          floater(t.x + 50, t.y - 10, '+5', '#ffe9bd');
        }
      }
    }
    for (const p of state.pickups) {
      if (!p.active) continue;
      p.x -= dx;
      p.phase += dt * 3;
      if (p.x < -60) p.active = false;
    }

    // --- collisions ---
    const box = turkeyBox();
    for (const o of state.obstacles) {
      if (!o.active || o.kind === KIND_HAYSTACK) continue;
      let hitBox = o;
      if (o.kind === KIND_KNIFE) {
        // The swinging blade: only its tip can cut.
        const swing = Math.sin(o.phase) * 46;
        const tipX = o.x + o.width / 2 + swing;
        const tipY = o.y + o.height;
        hitBox = { x: tipX - 11, y: tipY - 22, width: 22, height: 30 };
      }
      if (o.kind === KIND_PUDDLE) {
        hitBox = { x: o.x, y: o.y, width: o.width, height: o.height };
        if (t.onGround && overlaps(box, hitBox)) {
          const result = stumble();
          events |= result;
          if (events & EVENT_OVER) return events;
          break;
        }
        continue;
      }
      if (overlaps(box, hitBox)) {
        // Landing on top of a low bale or fence counts as a perch, not a hit.
        const landing = t.vy >= 0 && box.y + box.height - o.y < 22 && o.kind !== KIND_OVEN && o.kind !== KIND_KNIFE;
        if (landing) {
          t.y = o.y - TURKEY.height;
          t.vy = 0;
          t.onGround = true;
          t.flapsLeft = 1;
          continue;
        }
        const result = stumble();
        events |= result;
        if (events & EVENT_OVER) return events;
        break;
      }
    }
    for (const p of state.pickups) {
      if (!p.active) continue;
      const pickupBox = { x: p.x, y: p.y + Math.sin(p.phase) * 4, width: p.width, height: p.height };
      if (overlaps(box, pickupBox)) {
        p.active = false;
        if (p.kind === KIND_CORN) {
          state.score += POINTS.corn;
          state.gap = Math.min(FARMER.maxGap, state.gap + 2);
          floater(p.x, p.y - 10, `+${POINTS.corn}`, '#ffd94d');
          burst(p.x + 15, p.y + 15, 6, '#ffd94d', 150);
        } else if (p.kind === KIND_GOLD_CORN) {
          state.score += POINTS.goldCorn;
          state.gap = Math.min(FARMER.maxGap, state.gap + 30);
          floater(p.x, p.y - 10, `+${POINTS.goldCorn} GOLD!`, '#ffb700');
          burst(p.x + 15, p.y + 15, 12, '#ffb700', 220);
        } else if (p.kind === KIND_FEATHER) {
          t.invulnerable = Math.max(t.invulnerable, 3);
          floater(p.x, p.y - 10, 'FEATHER SHIELD!', '#ffffff');
          burst(p.x + 15, p.y + 15, 10, '#ffffff', 180);
        } else if (p.kind === KIND_PIE) {
          state.lives = Math.min(5, state.lives + 1);
          floater(p.x, p.y - 10, '+1 LIFE!', '#ff8fb0');
          burst(p.x + 15, p.y + 15, 12, '#ff8fb0', 200);
        }
        events |= EVENT_PICKUP;
      }
    }

    // --- particles and floaters age ---
    for (let i = state.particles.length - 1; i >= 0; i -= 1) {
      const p = state.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 500 * dt;
      p.life -= dt;
      if (p.life <= 0) state.particles.splice(i, 1);
    }
    for (let i = state.floaters.length - 1; i >= 0; i -= 1) {
      const fl = state.floaters[i];
      fl.y -= 34 * dt;
      fl.life -= dt;
      if (fl.life <= 0) state.floaters.splice(i, 1);
    }
    if (state.shake > 0) state.shake -= dt;

    return events;
  }

  return { state, reset, step, stageFor: stageFor };
}
