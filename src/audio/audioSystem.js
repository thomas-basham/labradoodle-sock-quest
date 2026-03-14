import { AUDIO_CONFIG } from "../game/config";

const MUSIC_STEP_SECONDS = 0.32;
const MUSIC_SCHEDULE_AHEAD_SECONDS = 0.48;
const FOOTSTEP_MIN_SPEED = 0.75;
const FOOTSTEP_WALK_INTERVAL = 0.34;
const FOOTSTEP_SPRINT_INTERVAL = 0.21;
const MUSIC_PATTERN = [
  { bass: 196, lead: 392 },
  { bass: null, lead: 440 },
  { bass: 246.94, lead: 493.88 },
  { bass: null, lead: 392 },
  { bass: 220, lead: 440 },
  { bass: null, lead: 523.25 },
  { bass: 246.94, lead: 587.33 },
  { bass: null, lead: 493.88 },
];

function loadStoredEnabledState() {
  try {
    const rawValue = window.localStorage.getItem(AUDIO_CONFIG.storageKey);
    if (rawValue === null) {
      return AUDIO_CONFIG.enabledByDefault;
    }

    return rawValue === "true";
  } catch {
    return AUDIO_CONFIG.enabledByDefault;
  }
}

function storeEnabledState(enabled) {
  try {
    window.localStorage.setItem(AUDIO_CONFIG.storageKey, String(enabled));
  } catch {
    // Ignore storage failures and keep the in-memory setting.
  }
}

function hasWebAudioSupport() {
  return typeof window !== "undefined" && (window.AudioContext || window.webkitAudioContext);
}

function getAudioContextConstructor() {
  return window.AudioContext || window.webkitAudioContext;
}

function clampVolume(value) {
  return Math.max(0, Math.min(1, value));
}

export class AudioSystem {
  constructor() {
    this.supported = hasWebAudioSupport();
    this.enabled = loadStoredEnabledState();
    this.context = null;
    this.masterGain = null;
    this.musicGain = null;
    this.sfxGain = null;
    this.noiseBuffer = null;
    this.musicStarted = false;
    this.musicStep = 0;
    this.nextMusicTime = 0;
    this.footstepTimer = 0;
    this.footstepPhase = 0;
  }

  isSupported() {
    return this.supported;
  }

  getEnabled() {
    return this.enabled;
  }

  isRunning() {
    return this.context !== null && this.context.state === "running";
  }

  setEnabled(enabled) {
    this.enabled = Boolean(enabled);
    storeEnabledState(this.enabled);

    if (this.masterGain && this.context) {
      const now = this.context.currentTime;
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.setTargetAtTime(this.enabled ? 1 : 0, now, 0.04);
    }

    if (!this.enabled) {
      this.footstepTimer = 0;
    }
  }

  toggleEnabled() {
    this.setEnabled(!this.enabled);
    return this.enabled;
  }

  unlock() {
    if (!this.supported || !this.enabled) {
      return;
    }

    this.ensureContext();
    if (!this.context) {
      return;
    }

    this.context.resume().catch(() => {
      // Autoplay restrictions can keep the context suspended until the next gesture.
    });
  }

  update({ delta, dogSpeed, sprinting }) {
    if (!this.enabled || !this.isRunning()) {
      return;
    }

    this.scheduleMusic();
    this.updateFootsteps(delta, dogSpeed, sprinting);
  }

  playSniff() {
    this.playSequence([
      { frequency: 520, duration: 0.06, delay: 0, volume: 0.12, type: "sine" },
      { frequency: 680, duration: 0.08, delay: 0.05, volume: 0.1, type: "triangle" },
    ]);
  }

  playPickup() {
    this.playSequence([
      { frequency: 660, duration: 0.09, delay: 0, volume: 0.12, type: "triangle" },
      { frequency: 880, duration: 0.12, delay: 0.06, volume: 0.14, type: "triangle" },
    ]);
  }

  playReturn() {
    this.playSequence([
      { frequency: 523.25, duration: 0.13, delay: 0, volume: 0.14, type: "triangle" },
      { frequency: 659.25, duration: 0.16, delay: 0.08, volume: 0.16, type: "triangle" },
      { frequency: 783.99, duration: 0.18, delay: 0.16, volume: 0.12, type: "sine" },
    ]);
  }

  playRoundComplete() {
    this.playSequence([
      { frequency: 523.25, duration: 0.16, delay: 0, volume: 0.16, type: "triangle" },
      { frequency: 659.25, duration: 0.16, delay: 0.1, volume: 0.18, type: "triangle" },
      { frequency: 783.99, duration: 0.18, delay: 0.2, volume: 0.18, type: "triangle" },
      { frequency: 1046.5, duration: 0.24, delay: 0.32, volume: 0.15, type: "sine" },
    ]);
  }

  destroy() {
    if (this.context) {
      this.context.close().catch(() => {
        // Ignore teardown issues during navigation.
      });
    }

    this.context = null;
    this.masterGain = null;
    this.musicGain = null;
    this.sfxGain = null;
    this.noiseBuffer = null;
  }

  ensureContext() {
    if (!this.supported || this.context) {
      return;
    }

    try {
      const AudioContext = getAudioContextConstructor();
      this.context = new AudioContext();
      this.masterGain = this.context.createGain();
      this.musicGain = this.context.createGain();
      this.sfxGain = this.context.createGain();

      this.masterGain.gain.value = this.enabled ? 1 : 0;
      this.musicGain.gain.value = AUDIO_CONFIG.musicVolume;
      this.sfxGain.gain.value = AUDIO_CONFIG.sfxVolume;

      this.musicGain.connect(this.masterGain);
      this.sfxGain.connect(this.masterGain);
      this.masterGain.connect(this.context.destination);

      this.noiseBuffer = this.createNoiseBuffer();
      this.musicStarted = false;
      this.musicStep = 0;
      this.nextMusicTime = 0;
    } catch {
      this.context = null;
      this.supported = false;
    }
  }

  createNoiseBuffer() {
    if (!this.context) {
      return null;
    }

    const frameCount = this.context.sampleRate * 0.18;
    const buffer = this.context.createBuffer(1, frameCount, this.context.sampleRate);
    const channelData = buffer.getChannelData(0);

    for (let index = 0; index < frameCount; index += 1) {
      channelData[index] = Math.random() * 2 - 1;
    }

    return buffer;
  }

  scheduleMusic() {
    if (!this.context || !this.musicGain) {
      return;
    }

    if (!this.musicStarted) {
      this.musicStarted = true;
      this.nextMusicTime = this.context.currentTime + 0.04;
      this.musicStep = 0;
    }

    while (this.nextMusicTime < this.context.currentTime + MUSIC_SCHEDULE_AHEAD_SECONDS) {
      const step = MUSIC_PATTERN[this.musicStep % MUSIC_PATTERN.length];
      if (step.bass) {
        this.playToneAt({
          frequency: step.bass,
          time: this.nextMusicTime,
          duration: MUSIC_STEP_SECONDS * 0.96,
          volume: 0.12,
          type: "triangle",
          destination: this.musicGain,
        });
      }

      if (step.lead) {
        this.playToneAt({
          frequency: step.lead,
          time: this.nextMusicTime,
          duration: MUSIC_STEP_SECONDS * 0.52,
          volume: 0.085,
          type: "sine",
          destination: this.musicGain,
        });
      }

      this.musicStep += 1;
      this.nextMusicTime += MUSIC_STEP_SECONDS;
    }
  }

  updateFootsteps(delta, dogSpeed, sprinting) {
    if (dogSpeed < FOOTSTEP_MIN_SPEED) {
      this.footstepTimer = 0;
      return;
    }

    this.footstepTimer -= delta;
    if (this.footstepTimer > 0) {
      return;
    }

    this.playFootstep(sprinting);
    const interval = sprinting ? FOOTSTEP_SPRINT_INTERVAL : FOOTSTEP_WALK_INTERVAL;
    const speedFactor = sprinting ? 0.9 : 1;
    this.footstepTimer = interval * speedFactor;
  }

  playFootstep(sprinting) {
    if (!this.context || !this.sfxGain) {
      return;
    }

    const time = this.context.currentTime + 0.005;
    const baseFrequency = sprinting ? 175 : 145;
    const pitchOffset = this.footstepPhase % 2 === 0 ? 1 : 1.12;
    this.footstepPhase += 1;

    this.playToneAt({
      frequency: baseFrequency * pitchOffset,
      time,
      duration: 0.045,
      volume: sprinting ? 0.08 : 0.06,
      type: "triangle",
      destination: this.sfxGain,
    });
    this.playNoiseAt({
      time,
      duration: 0.035,
      volume: sprinting ? 0.05 : 0.035,
      cutoff: sprinting ? 900 : 700,
    });
  }

  playSequence(notes) {
    if (!this.enabled) {
      return;
    }

    this.unlock();
    if (!this.isRunning()) {
      return;
    }

    const now = this.context.currentTime;
    notes.forEach(({ delay, ...note }) => {
      this.playToneAt({
        ...note,
        time: now + delay,
        destination: this.sfxGain,
      });
    });
  }

  playToneAt({ frequency, time, duration, volume, type, destination }) {
    if (!this.context || !destination) {
      return;
    }

    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, time);
    oscillator.connect(gain);
    gain.connect(destination);

    const peak = clampVolume(volume);
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(peak, time + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

    oscillator.start(time);
    oscillator.stop(time + duration + 0.02);
  }

  playNoiseAt({ time, duration, volume, cutoff }) {
    if (!this.context || !this.noiseBuffer || !this.sfxGain) {
      return;
    }

    const source = this.context.createBufferSource();
    const filter = this.context.createBiquadFilter();
    const gain = this.context.createGain();

    source.buffer = this.noiseBuffer;
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(cutoff, time);
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(clampVolume(volume), time + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    source.start(time);
    source.stop(time + duration + 0.02);
  }
}
