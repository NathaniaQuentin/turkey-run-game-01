// All sound is synthesized with the Web Audio API: no audio files, no network,
// nothing to load. A gobble is a wobbling sawtooth, a pickup a bright blip, and
// the kitchen alarm a two-note siren. Music is a small step sequencer that
// plays a bouncy bass line while the run is on.

function makeOscillator(context, type, frequency) {
  const osc = context.createOscillator();
  osc.type = type;
  osc.frequency.value = frequency;
  return osc;
}

export function createAudio() {
  let context = null;
  let master = null;
  let musicGain = null;
  let muted = false;
  let musicOn = false;
  let musicTimer = null;
  let step = 0;

  // A cheerful chase bass line, one note per eighth step, in A minor.
  const BASS = [110, 0, 130.81, 0, 98, 0, 123.47, 0, 110, 0, 164.81, 0, 146.83, 123.47, 98, 0];
  const STEP_SECONDS = 0.16;

  function ensure() {
    if (context) return true;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      context = new AudioContext();
      master = context.createGain();
      master.gain.value = muted ? 0 : 0.5;
      master.connect(context.destination);
      musicGain = context.createGain();
      musicGain.gain.value = 0.16;
      musicGain.connect(master);
    } catch {
      return false;
    }
    return true;
  }

  function tone({ type = 'sine', from = 440, to = null, seconds = 0.15, volume = 0.5, delay = 0, slide = false }) {
    if (!ensure() || muted) return;
    const start = context.currentTime + delay;
    const osc = makeOscillator(context, type, from);
    const gain = context.createGain();
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(Math.max(volume, 0.0002), start + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + seconds);
    if (to !== null) {
      if (slide) osc.frequency.setValueAtTime(from, start);
      osc.frequency.exponentialRampToValueAtTime(Math.max(to, 1), start + seconds);
    }
    osc.connect(gain);
    gain.connect(master);
    osc.start(start);
    osc.stop(start + seconds + 0.05);
  }

  function gobbleBurst(delay) {
    // Three quick low wobbles: the turkey's signature sound.
    for (let i = 0; i < 3; i += 1) {
      tone({ type: 'sawtooth', from: 320 - i * 40, to: 180 - i * 30, seconds: 0.11, volume: 0.22, delay: delay + i * 0.1, slide: true });
    }
  }

  const api = {
    unlock() {
      if (ensure() && context.state === 'suspended') context.resume().catch(() => {});
    },
    toggleMute() {
      muted = !muted;
      if (master) master.gain.value = muted ? 0 : 0.5;
      return muted;
    },
    isMuted() {
      return muted;
    },
    gobble() {
      gobbleBurst(0);
    },
    flap() {
      tone({ type: 'triangle', from: 500, to: 900, seconds: 0.09, volume: 0.2, slide: true });
    },
    jump() {
      tone({ type: 'sine', from: 300, to: 620, seconds: 0.14, volume: 0.25, slide: true });
    },
    pickup() {
      tone({ type: 'sine', from: 880, to: 1320, seconds: 0.12, volume: 0.3, slide: true });
      tone({ type: 'sine', from: 1320, to: 1760, seconds: 0.1, volume: 0.18, delay: 0.07, slide: true });
    },
    gold() {
      [523, 659, 784, 1047].forEach((freq, i) => tone({ type: 'triangle', from: freq, seconds: 0.16, volume: 0.25, delay: i * 0.06 }));
    },
    hit() {
      tone({ type: 'square', from: 220, to: 70, seconds: 0.25, volume: 0.35, slide: true });
      tone({ type: 'sawtooth', from: 160, to: 60, seconds: 0.3, volume: 0.2, delay: 0.02, slide: true });
    },
    dash() {
      tone({ type: 'sine', from: 400, to: 1400, seconds: 0.18, volume: 0.22, slide: true });
    },
    hide() {
      tone({ type: 'sine', from: 600, to: 300, seconds: 0.25, volume: 0.2, slide: true });
    },
    alarm() {
      tone({ type: 'square', from: 740, seconds: 0.12, volume: 0.14 });
      tone({ type: 'square', from: 587, seconds: 0.12, volume: 0.14, delay: 0.14 });
    },
    click() {
      tone({ type: 'sine', from: 700, to: 900, seconds: 0.06, volume: 0.2, slide: true });
    },
    win() {
      [523, 659, 784, 1047, 1319].forEach((freq, i) => tone({ type: 'triangle', from: freq, seconds: 0.3, volume: 0.28, delay: i * 0.11 }));
      gobbleBurst(0.55);
    },
    lose() {
      [392, 330, 262, 196].forEach((freq, i) => tone({ type: 'triangle', from: freq, seconds: 0.3, volume: 0.25, delay: i * 0.16 }));
    },
    startMusic() {
      if (musicOn || !ensure()) return;
      musicOn = true;
      step = 0;
      musicTimer = window.setInterval(() => {
        if (muted || !musicOn) return;
        const note = BASS[step % BASS.length];
        if (note > 0) {
          const osc = makeOscillator(context, 'triangle', note);
          const gain = context.createGain();
          const start = context.currentTime;
          gain.gain.setValueAtTime(0.0001, start);
          gain.gain.exponentialRampToValueAtTime(0.5, start + 0.01);
          gain.gain.exponentialRampToValueAtTime(0.0001, start + STEP_SECONDS * 0.95);
          osc.connect(gain);
          gain.connect(musicGain);
          osc.start(start);
          osc.stop(start + STEP_SECONDS);
        }
        step += 1;
      }, STEP_SECONDS * 1000);
    },
    stopMusic() {
      musicOn = false;
      if (musicTimer !== null) {
        window.clearInterval(musicTimer);
        musicTimer = null;
      }
    },
  };
  return api;
}
