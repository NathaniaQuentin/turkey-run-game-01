// Gobble Run — the renderer: every sprite is drawn with canvas paths, so the
// game needs no image files at all. The camera sits still while the world
// scrolls past; the turkey bobs, the farmer pumps his legs, knives swing,
// ovens glow, and the HUD and screens are painted over the top.

import { ESCAPE_DISTANCE, FIELD, PALETTE, STAGES } from './config.js';
import { KIND_BALE, KIND_FENCE, KIND_GOLD_CORN, KIND_HAYSTACK, KIND_KNIFE, KIND_OVEN, KIND_PUDDLE, KIND_PUMPKIN, KIND_CORN, KIND_FEATHER, KIND_PIE } from './world.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_OVER = 'over';
export const SCREEN_WIN = 'win';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function ellipse(ctx, x, y, rx, ry) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  let scale = 1;
  let offsetX = 0;
  let offsetY = 0;

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = canvas.clientWidth || window.innerWidth;
    const h = canvas.clientHeight || window.innerHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    scale = Math.min(canvas.width / FIELD.width, canvas.height / FIELD.height);
    offsetX = (canvas.width - FIELD.width * scale) / 2;
    offsetY = (canvas.height - FIELD.height * scale) / 2;
  }

  function sky(state) {
    const stage = STAGES[state.stage];
    const grad = ctx.createLinearGradient(0, 0, 0, FIELD.groundY);
    grad.addColorStop(0, stage.sky[0]);
    grad.addColorStop(1, stage.sky[1]);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, FIELD.width, FIELD.groundY);
    // Sun and drifting clouds.
    ctx.fillStyle = '#fff3c4';
    ellipse(ctx, 1080, 96, 44, 44);
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    const drift = (state.time * 12) % 1400;
    for (let i = 0; i < 4; i += 1) {
      const cx = ((i * 360 + drift) % 1400) - 60;
      const cy = 70 + i * 46;
      ellipse(ctx, cx, cy, 52, 20);
      ellipse(ctx, cx + 34, cy + 6, 40, 16);
      ellipse(ctx, cx - 36, cy + 8, 36, 14);
    }
    // Distant hills.
    ctx.fillStyle = 'rgba(90, 120, 60, 0.55)';
    ctx.beginPath();
    ctx.moveTo(0, FIELD.groundY);
    for (let x = 0; x <= FIELD.width; x += 80) {
      ctx.lineTo(x, FIELD.groundY - 60 - Math.sin((x + state.distance * 4) * 0.004) * 34);
    }
    ctx.lineTo(FIELD.width, FIELD.groundY);
    ctx.closePath();
    ctx.fill();
    // Stage props in the mid-ground, drifting slowly with the run.
    const driftX = (state.distance * 9) % 640;
    if (state.stage === 0) {
      // Farmyard: a fence line and a round oak.
      ctx.fillStyle = 'rgba(122, 82, 48, 0.6)';
      for (let x = -driftX; x < FIELD.width; x += 320) {
        ctx.fillRect(x, FIELD.groundY - 44, 8, 44);
        ctx.fillRect(x + 64, FIELD.groundY - 44, 8, 44);
        ctx.fillRect(x, FIELD.groundY - 40, 72, 6);
        ctx.fillRect(x, FIELD.groundY - 26, 72, 6);
      }
      ctx.fillStyle = 'rgba(58, 122, 42, 0.65)';
      ellipse(ctx, 1060 - driftX * 0.2, FIELD.groundY - 110, 70, 60);
      ctx.fillStyle = 'rgba(90, 58, 34, 0.65)';
      ctx.fillRect(1052 - driftX * 0.2, FIELD.groundY - 60, 16, 60);
    } else if (state.stage === 1) {
      // Barn: a big red barn wall with a loft door.
      ctx.fillStyle = 'rgba(150, 52, 40, 0.55)';
      ctx.fillRect(880 - driftX * 0.2, FIELD.groundY - 210, 300, 210);
      ctx.beginPath();
      ctx.moveTo(880 - driftX * 0.2, FIELD.groundY - 210);
      ctx.lineTo(1030 - driftX * 0.2, FIELD.groundY - 290);
      ctx.lineTo(1180 - driftX * 0.2, FIELD.groundY - 210);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = 'rgba(90, 30, 22, 0.6)';
      ctx.fillRect(990 - driftX * 0.2, FIELD.groundY - 110, 80, 110);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.fillRect(1010 - driftX * 0.2, FIELD.groundY - 190, 40, 40);
    } else {
      // Kitchen: a giant oven silhouette with a chimney, and hanging pans.
      ctx.fillStyle = 'rgba(74, 74, 85, 0.38)';
      roundRect(ctx, 900 - driftX * 0.2, FIELD.groundY - 260, 260, 260, 14);
      ctx.fill();
      ctx.fillRect(1100 - driftX * 0.2, FIELD.groundY - 330, 40, 80);
      ctx.fillStyle = 'rgba(60, 60, 70, 0.38)';
      roundRect(ctx, 950 - driftX * 0.2, FIELD.groundY - 200, 160, 120, 10);
      ctx.fill();
      ctx.strokeStyle = 'rgba(60, 40, 30, 0.55)';
      ctx.lineWidth = 5;
      for (let i = 0; i < 3; i += 1) {
        const px = 120 + i * 130 - driftX * 0.35;
        ctx.beginPath();
        ctx.moveTo(px, 60);
        ctx.lineTo(px, 110);
        ctx.stroke();
        ctx.fillStyle = 'rgba(70, 70, 80, 0.6)';
        ellipse(ctx, px, 134, 26, 22);
        ctx.fillStyle = 'rgba(255,255,255,0.25)';
        ellipse(ctx, px - 8, 126, 7, 5);
      }
    }
  }

  function ground(state) {
    const stage = STAGES[state.stage];
    ctx.fillStyle = stage.ground;
    ctx.fillRect(0, FIELD.groundY, FIELD.width, FIELD.height - FIELD.groundY);
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.fillRect(0, FIELD.groundY, FIELD.width, 6);
    // Scrolling dirt dashes and tufts.
    const offset = (state.distance * 18) % 90;
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    for (let x = -offset; x < FIELD.width; x += 90) {
      ctx.fillRect(x, FIELD.groundY + 34, 34, 5);
      ctx.fillRect(x + 52, FIELD.groundY + 66, 22, 5);
    }
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 2;
    for (let x = -offset; x < FIELD.width; x += 130) {
      ctx.beginPath();
      ctx.moveTo(x, FIELD.groundY + 18);
      ctx.lineTo(x + 6, FIELD.groundY + 6);
      ctx.lineTo(x + 12, FIELD.groundY + 18);
      ctx.stroke();
    }
  }

  function drawTurkey(state, ghost) {
    const t = state.turkey;
    if (t.hidden || ghost) return;
    const bob = t.onGround ? Math.sin(t.runPhase * 2) * 3 : 0;
    const squash = t.onGround && Math.sin(t.runPhase * 2) > 0.7 ? 0.94 : 1;
    const cx = t.x + t.width / 2;
    const cy = t.y + t.height / 2 + bob;
    const blink = t.invulnerable > 0 && Math.floor(state.time * 14) % 2 === 0;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(squash, 1 / squash);
    ctx.globalAlpha = blink ? 0.45 : 1;
    // Tail fan.
    for (let i = 0; i < 5; i += 1) {
      const angle = -0.9 + i * 0.45;
      const len = 44 - Math.abs(i - 2) * 5;
      ctx.save();
      ctx.translate(-26, 2);
      ctx.rotate(angle - Math.PI / 2 + 0.5);
      ctx.fillStyle = PALETTE.turkeyTail[i];
      ctx.beginPath();
      ctx.ellipse(0, -len / 2, 11, len / 2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    // Body.
    ctx.fillStyle = PALETTE.turkeyBody;
    ellipse(ctx, 0, 4, 34, 26);
    ctx.fillStyle = PALETTE.turkeyDark;
    ellipse(ctx, -6, 10, 22, 16);
    // Wing, flapping harder in the air.
    const flap = t.onGround ? Math.sin(t.runPhase * 2) * 6 : Math.sin(state.time * 22) * 14;
    ctx.fillStyle = '#a06a35';
    ctx.beginPath();
    ctx.ellipse(-4, 2 + flap * 0.3, 20, 11, -0.4 + flap * 0.02, 0, Math.PI * 2);
    ctx.fill();
    // Legs.
    ctx.strokeStyle = '#e8a33c';
    ctx.lineWidth = 4;
    const legSwing = t.onGround ? Math.sin(t.runPhase * 2) * 10 : 6;
    ctx.beginPath();
    ctx.moveTo(-8, 26);
    ctx.lineTo(-8 + legSwing, 34);
    ctx.moveTo(8, 26);
    ctx.lineTo(8 - legSwing, 34);
    ctx.stroke();
    // Head, beak, wattle, eye.
    ctx.fillStyle = PALETTE.turkeyHead;
    ellipse(ctx, 26, -22, 15, 14);
    ctx.fillStyle = PALETTE.turkeyBeak;
    ctx.beginPath();
    ctx.moveTo(38, -24);
    ctx.lineTo(52, -19);
    ctx.lineTo(38, -15);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = PALETTE.turkeyWattle;
    ellipse(ctx, 34, -10, 5, 8);
    ctx.fillStyle = '#222';
    ellipse(ctx, 30, -26, 3, 3);
    ctx.restore();
  }

  function drawFarmer(state) {
    const f = state.farmer;
    const x = f.x;
    if (x < -120) return;
    const y = FIELD.groundY;
    const swing = Math.sin(f.runPhase * 2) * 12;
    ctx.save();
    ctx.translate(x, y);
    // Pitchfork, jabbing forward as he runs.
    ctx.strokeStyle = '#8a6a3a';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(28, -58);
    ctx.lineTo(52, -96);
    ctx.stroke();
    ctx.strokeStyle = '#dfe6ee';
    ctx.lineWidth = 3;
    for (let i = -1; i <= 1; i += 1) {
      ctx.beginPath();
      ctx.moveTo(52 + i * 7, -96);
      ctx.lineTo(52 + i * 9, -112);
      ctx.stroke();
    }
    // Legs.
    ctx.strokeStyle = PALETTE.farmerOveralls;
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.moveTo(-4, -34);
    ctx.lineTo(-4 + swing, 0);
    ctx.moveTo(8, -34);
    ctx.lineTo(8 - swing, 0);
    ctx.stroke();
    // Body: shirt and overalls.
    ctx.fillStyle = PALETTE.farmerShirt;
    roundRect(ctx, -16, -66, 36, 36, 8);
    ctx.fill();
    ctx.fillStyle = PALETTE.farmerOveralls;
    ctx.fillRect(-14, -46, 32, 14);
    // Head and hat.
    ctx.fillStyle = PALETTE.farmerSkin;
    ellipse(ctx, 4, -76, 13, 13);
    ctx.fillStyle = PALETTE.farmerHat;
    ctx.fillRect(-12, -88, 34, 6);
    ctx.fillRect(-6, -102, 22, 16);
    // Angry eyes and moustache.
    ctx.fillStyle = '#222';
    ellipse(ctx, 10, -78, 2, 2);
    ctx.strokeStyle = '#5a3a22';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(2, -70);
    ctx.lineTo(16, -70);
    ctx.stroke();
    ctx.restore();
    if (f.searching) {
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 26px ' + '"Trebuchet MS", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('?', x + 6, y - 128);
    }
  }

  function drawObstacle(o, state) {
    if (!o.active) return;
    if (o.kind === KIND_FENCE) {
      ctx.fillStyle = '#7a5230';
      ctx.fillRect(o.x, o.y, 8, o.height);
      ctx.fillRect(o.x + o.width - 8, o.y, 8, o.height);
      ctx.fillRect(o.x, o.y + 10, o.width, 8);
      ctx.fillRect(o.x, o.y + 30, o.width, 8);
    } else if (o.kind === KIND_BALE) {
      ctx.fillStyle = '#d9a441';
      roundRect(ctx, o.x, o.y, o.width, o.height, 10);
      ctx.fill();
      ctx.strokeStyle = '#a87c22';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(o.x + o.width / 2, o.y + o.height / 2, 14, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(o.x + o.width / 2, o.y + o.height / 2, 6, 0, Math.PI * 2);
      ctx.stroke();
    } else if (o.kind === KIND_PUMPKIN) {
      ctx.fillStyle = '#e8722a';
      ellipse(ctx, o.x + o.width / 2, o.y + o.height / 2, o.width / 2, o.height / 2);
      ctx.fillStyle = '#c75a17';
      ellipse(ctx, o.x + o.width / 2 - 10, o.y + o.height / 2, 4, o.height / 2 - 6);
      ellipse(ctx, o.x + o.width / 2 + 10, o.y + o.height / 2, 4, o.height / 2 - 6);
      ctx.fillStyle = '#3a7a2a';
      ctx.fillRect(o.x + o.width / 2 - 3, o.y - 8, 6, 12);
    } else if (o.kind === KIND_PUDDLE) {
      ctx.fillStyle = '#7ec8e8';
      ellipse(ctx, o.x + o.width / 2, o.y + 6, o.width / 2, 8);
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ellipse(ctx, o.x + o.width / 2 - 16, o.y + 4, 16, 3);
    } else if (o.kind === KIND_OVEN) {
      ctx.fillStyle = PALETTE.ovenBody;
      roundRect(ctx, o.x, o.y, o.width, o.height, 8);
      ctx.fill();
      ctx.fillStyle = PALETTE.ovenDoor;
      roundRect(ctx, o.x + 12, o.y + 18, o.width - 24, o.height - 30, 6);
      ctx.fill();
      // Roaring fire in the oven window.
      const flicker = Math.sin(state.time * 18 + o.x) * 4;
      ctx.fillStyle = PALETTE.flame;
      ctx.beginPath();
      ctx.moveTo(o.x + 30, o.y + o.height - 16);
      ctx.quadraticCurveTo(o.x + 44, o.y + 34 + flicker, o.x + 58, o.y + o.height - 16);
      ctx.quadraticCurveTo(o.x + 72, o.y + 44 - flicker, o.x + 88, o.y + o.height - 16);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#ffd94d';
      ellipse(ctx, o.x + o.width / 2, o.y + o.height - 22, 16, 8);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 15px "Trebuchet MS", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('HOT!', o.x + o.width / 2, o.y - 10);
    } else if (o.kind === KIND_KNIFE) {
      const swing = Math.sin(o.phase) * 46;
      const tipX = o.x + o.width / 2 + swing;
      const tipY = o.y + o.height;
      ctx.strokeStyle = '#8a8a8a';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(o.x + o.width / 2, o.y - (o.rope ?? 150));
      ctx.lineTo(tipX, tipY - 40);
      ctx.stroke();
      ctx.save();
      ctx.translate(tipX, tipY - 18);
      ctx.rotate(Math.sin(o.phase) * 0.5);
      ctx.fillStyle = PALETTE.knifeHandle;
      ctx.fillRect(-5, -34, 10, 22);
      ctx.fillStyle = PALETTE.knifeBlade;
      ctx.beginPath();
      ctx.moveTo(-9, -12);
      ctx.lineTo(9, -12);
      ctx.lineTo(0, 34);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    } else if (o.kind === KIND_HAYSTACK) {
      ctx.fillStyle = '#e8c25e';
      ctx.beginPath();
      ctx.moveTo(o.x, o.y + o.height);
      ctx.quadraticCurveTo(o.x + o.width / 2, o.y - 26, o.x + o.width, o.y + o.height);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#b8933a';
      ctx.lineWidth = 2;
      for (let i = 1; i <= 3; i += 1) {
        ctx.beginPath();
        ctx.moveTo(o.x + (o.width * i) / 4, o.y + o.height - 8);
        ctx.quadraticCurveTo(o.x + (o.width * i) / 4 + 6, o.y + 18, o.x + (o.width * i) / 4, o.y + 34);
        ctx.stroke();
      }
    }
  }

  function drawPickup(p, state) {
    if (!p.active) return;
    const bob = Math.sin(p.phase) * 4;
    const y = p.y + bob;
    if (p.kind === KIND_CORN) {
      ctx.fillStyle = '#f7e07a';
      ellipse(ctx, p.x + 15, y + 15, 11, 15);
      ctx.fillStyle = PALETTE.corn;
      for (let r = 0; r < 3; r += 1) {
        for (let c = 0; c < 2; c += 1) ellipse(ctx, p.x + 10 + c * 10, y + 7 + r * 9, 3.5, 3.5);
      }
      ctx.fillStyle = '#5a9a3a';
      ctx.beginPath();
      ctx.moveTo(p.x + 15, y + 30);
      ctx.lineTo(p.x + 6, y + 38);
      ctx.lineTo(p.x + 24, y + 38);
      ctx.closePath();
      ctx.fill();
    } else if (p.kind === KIND_GOLD_CORN) {
      ctx.save();
      ctx.shadowColor = '#ffb700';
      ctx.shadowBlur = 16;
      ctx.fillStyle = PALETTE.gold;
      ellipse(ctx, p.x + 17, y + 17, 14, 18);
      ctx.fillStyle = '#ffe27a';
      for (let r = 0; r < 3; r += 1) {
        for (let c = 0; c < 2; c += 1) ellipse(ctx, p.x + 11 + c * 11, y + 8 + r * 10, 4, 4);
      }
      ctx.restore();
    } else if (p.kind === KIND_FEATHER) {
      ctx.fillStyle = PALETTE.feather;
      ctx.beginPath();
      ctx.ellipse(p.x + 15, y + 15, 7, 16, 0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#c9d2e3';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(p.x + 15, y + 2);
      ctx.lineTo(p.x + 15, y + 30);
      ctx.stroke();
    } else if (p.kind === KIND_PIE) {
      ctx.fillStyle = '#d98a4a';
      ctx.beginPath();
      ctx.moveTo(p.x + 2, y + 26);
      ctx.lineTo(p.x + 32, y + 26);
      ctx.lineTo(p.x + 17, y + 4);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#ff5a7a';
      ctx.beginPath();
      ctx.arc(p.x + 17, y + 18, 6, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawParticles(state) {
    for (const p of state.particles) {
      ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
      ctx.fillStyle = p.color;
      ellipse(ctx, p.x, p.y, p.size, p.size);
    }
    ctx.globalAlpha = 1;
    ctx.font = 'bold 20px "Trebuchet MS", sans-serif';
    ctx.textAlign = 'center';
    for (const fl of state.floaters) {
      ctx.globalAlpha = Math.min(1, fl.life);
      ctx.fillStyle = fl.color;
      ctx.fillText(fl.text, fl.x, fl.y);
    }
    ctx.globalAlpha = 1;
  }

  function drawGate(state) {
    // The forest gate at the end of the kitchen: the turkey's way out.
    const progress = state.distance / ESCAPE_DISTANCE;
    const gateX = FIELD.width - 120 + (1 - progress) * 500;
    if (progress < 0.82 || state.escaped) return;
    ctx.fillStyle = '#5a3a22';
    ctx.fillRect(gateX, FIELD.groundY - 150, 14, 150);
    ctx.fillRect(gateX + 106, FIELD.groundY - 150, 14, 150);
    ctx.fillStyle = '#2a6a2a';
    ctx.fillRect(gateX, FIELD.groundY - 168, 120, 22);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 18px "Trebuchet MS", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('FOREST', gateX + 60, FIELD.groundY - 176);
  }

  function drawHud(state, best) {
    const stage = STAGES[state.stage];
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    // Top bar.
    ctx.fillStyle = PALETTE.panel;
    roundRect(ctx, 16, 14, 560, 64, 12);
    ctx.fill();
    ctx.strokeStyle = PALETTE.panelEdge;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = PALETTE.text;
    ctx.font = 'bold 24px "Trebuchet MS", sans-serif';
    ctx.fillText(`SCORE ${Math.floor(state.score)}`, 34, 42);
    ctx.font = 'bold 20px "Trebuchet MS", sans-serif';
    ctx.fillText(`${Math.floor(state.distance)} m  ·  ${stage.name}`, 34, 68);
    ctx.fillStyle = PALETTE.muted;
    ctx.font = '16px "Trebuchet MS", sans-serif';
    ctx.fillText(`BEST ${best}`, 420, 40);
    // Lives as hearts.
    for (let i = 0; i < 5; i += 1) {
      const x = 420 + i * 26;
      const y = 58;
      ctx.fillStyle = i < state.lives ? PALETTE.heart : PALETTE.heartEmpty;
      ctx.beginPath();
      ctx.arc(x, y, 7, 0, Math.PI * 2);
      ctx.arc(x + 12, y, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x - 5, y + 4);
      ctx.lineTo(x + 18, y + 4);
      ctx.lineTo(x + 6, y + 16);
      ctx.closePath();
      ctx.fill();
    }
    // Farmer gap meter, right side.
    const meterW = 300;
    const meterX = FIELD.width - meterW - 20;
    ctx.fillStyle = PALETTE.panel;
    roundRect(ctx, meterX, 14, meterW, 64, 12);
    ctx.fill();
    ctx.strokeStyle = state.alarm ? PALETTE.gapBad : PALETTE.panelEdge;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = PALETTE.text;
    ctx.font = 'bold 18px "Trebuchet MS", sans-serif';
    ctx.fillText(state.alarm ? 'FARMER CLOSE!' : 'FARMER', meterX + 14, 40);
    const gapRatio = state.gap / 430;
    ctx.fillStyle = state.alarm ? PALETTE.gapBad : PALETTE.gapGood;
    roundRect(ctx, meterX + 14, 50, Math.max(8, (meterW - 28) * gapRatio), 14, 7);
    ctx.fill();
    // Escape progress bar along the bottom.
    const progress = Math.min(1, state.distance / ESCAPE_DISTANCE);
    ctx.fillStyle = 'rgba(58,36,21,0.7)';
    ctx.fillRect(0, FIELD.height - 14, FIELD.width, 14);
    ctx.fillStyle = '#7ee081';
    ctx.fillRect(0, FIELD.height - 14, FIELD.width * progress, 14);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px "Trebuchet MS", sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('ESCAPE → FOREST GATE', FIELD.width - 12, FIELD.height - 22);
    ctx.textAlign = 'left';
  }

  function button(x, y, w, h, label) {
    ctx.fillStyle = '#ffb347';
    roundRect(ctx, x, y, w, h, 14);
    ctx.fill();
    ctx.strokeStyle = '#7a4a12';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = '#3a2415';
    ctx.font = 'bold 26px "Trebuchet MS", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(label, x + w / 2, y + h / 2 + 9);
    ctx.textAlign = 'left';
  }

  function drawTitle(state, best) {
    ctx.fillStyle = 'rgba(40, 20, 8, 0.45)';
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffb347';
    ctx.font = 'bold 84px "Trebuchet MS", sans-serif';
    ctx.fillText('GOBBLE RUN', FIELD.width / 2, 150);
    ctx.fillStyle = PALETTE.text;
    ctx.font = 'bold 34px "Trebuchet MS", sans-serif';
    ctx.fillText('The Great Turkey Escape', FIELD.width / 2, 200);
    ctx.font = '22px "Trebuchet MS", sans-serif';
    ctx.fillStyle = PALETTE.muted;
    ctx.fillText('Thanksgiving is coming. The farmer is coming faster.', FIELD.width / 2, 244);
    ctx.fillText('Outrun him through the farmyard, the barn and the kitchen —', FIELD.width / 2, 276);
    ctx.fillText('dodge the oven and the carving knives, and reach the forest gate!', FIELD.width / 2, 308);
    ctx.font = 'bold 20px "Trebuchet MS", sans-serif';
    ctx.fillStyle = PALETTE.text;
    ctx.fillText('← → speed up / slow down    SPACE jump (twice to flap)    ↓ slide & hide in hay    SHIFT dash', FIELD.width / 2, 372);
    ctx.fillText('Grab corn, golden corn and pie. Don\'t let the farmer catch you!', FIELD.width / 2, 404);
    if (best > 0) {
      ctx.fillStyle = '#ffd94d';
      ctx.font = 'bold 24px "Trebuchet MS", sans-serif';
      ctx.fillText(`BEST SCORE: ${best}`, FIELD.width / 2, 448);
    }
    button(FIELD.width / 2 - 170, 490, 340, 64, '▶  START THE ESCAPE');
    ctx.font = '18px "Trebuchet MS", sans-serif';
    ctx.fillStyle = PALETTE.muted;
    ctx.fillText('Press SPACE or click to start  ·  P pause  ·  M mute', FIELD.width / 2, 596);
    ctx.textAlign = 'left';
  }

  function drawPaused() {
    ctx.fillStyle = 'rgba(40, 20, 8, 0.6)';
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    ctx.textAlign = 'center';
    ctx.fillStyle = PALETTE.text;
    ctx.font = 'bold 64px "Trebuchet MS", sans-serif';
    ctx.fillText('PAUSED', FIELD.width / 2, 330);
    ctx.font = '24px "Trebuchet MS", sans-serif';
    ctx.fillText('The farmer waits for no turkey. Press P or SPACE to keep running.', FIELD.width / 2, 380);
    ctx.textAlign = 'left';
  }

  function drawOver(state, best, won) {
    ctx.fillStyle = won ? 'rgba(20, 60, 20, 0.55)' : 'rgba(60, 10, 10, 0.55)';
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    ctx.textAlign = 'center';
    ctx.fillStyle = won ? '#7ee081' : '#ff8f8f';
    ctx.font = 'bold 76px "Trebuchet MS", sans-serif';
    ctx.fillText(won ? 'ESCAPED!' : 'CAUGHT!', FIELD.width / 2, 210);
    ctx.fillStyle = PALETTE.text;
    ctx.font = '28px "Trebuchet MS", sans-serif';
    ctx.fillText(
      won
        ? 'Tom the turkey slips through the forest gate — pardoned, free, and full of corn.'
        : state.lives <= 0
          ? 'Too many tumbles — the farmer finally got his hands on Tom.'
          : 'The farmer caught up. Thanksgiving dinner is served… almost.',
      FIELD.width / 2,
      268,
    );
    ctx.font = 'bold 30px "Trebuchet MS", sans-serif';
    ctx.fillText(`SCORE ${Math.floor(state.score)}   ·   DISTANCE ${Math.floor(state.distance)} m`, FIELD.width / 2, 330);
    ctx.font = '24px "Trebuchet MS", sans-serif';
    ctx.fillStyle = '#ffd94d';
    ctx.fillText(`BEST ${best}`, FIELD.width / 2, 372);
    ctx.fillStyle = PALETTE.text;
    ctx.font = '20px "Trebuchet MS", sans-serif';
    ctx.fillText('Corn eaten, knives dodged, ovens jumped — run again and beat it!', FIELD.width / 2, 420);
    button(FIELD.width / 2 - 150, 470, 300, 64, '↻  RUN AGAIN');
    ctx.font = '18px "Trebuchet MS", sans-serif';
    ctx.fillStyle = PALETTE.muted;
    ctx.fillText('Press SPACE or click to restart', FIELD.width / 2, 580);
    ctx.textAlign = 'left';
  }

  function draw(state, screen, best) {
    resize();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#11141b';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(scale, 0, 0, scale, offsetX, offsetY);
    if (state.shake > 0) {
      const mag = state.shake * 14;
      ctx.translate((Math.random() - 0.5) * mag, (Math.random() - 0.5) * mag);
    }
    sky(state);
    drawGate(state);
    ground(state);
    for (const o of state.obstacles) drawObstacle(o, state);
    for (const p of state.pickups) drawPickup(p, state);
    drawFarmer(state);
    drawTurkey(state, false);
    drawParticles(state);
    if (screen === SCREEN_PLAY || screen === SCREEN_PAUSED) drawHud(state, best);
    if (screen === SCREEN_TITLE) drawTitle(state, best);
    else if (screen === SCREEN_PAUSED) drawPaused();
    else if (screen === SCREEN_OVER) drawOver(state, best, false);
    else if (screen === SCREEN_WIN) drawOver(state, best, true);
  }

  return { draw, resize };
}
