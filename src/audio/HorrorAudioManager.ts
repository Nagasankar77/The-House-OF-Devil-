/**
 * THE HOUSE OF DEVIL — Clean Cinematic Horror Audio System
 * 
 * High-fidelity, zero-clipping procedural audio engine:
 * - Clean layered horror ambience (Background ambience, Wind, Thunder)
 * - Zero clipping, zero crackling, zero blown-out speaker distortion
 * - Seamless equal-power loop crossfading (eliminates boundary clicks/pops)
 * - Safe 32Hz subsonic filter & transparent 40ms attack master compressor (preserves clean bass without wave-shaping distortion)
 * - Dynamic Lightning & Thunder with variable realistic propagation delays (0.6s - 3.5s)
 * - 3D Positional Audio tracking real-time camera orientation with smooth distance attenuation
 * - Rare psychological stalker footsteps appearing behind player while walking
 * - Subtle whispered vocal formants and faint breathing cues
 * - Physiological Heartbeat engine scaling as player nears the locked gate
 * - Dynamic silence tension manager
 * - Cross-browser safe AudioContext lifecycle management (Desktop & Mobile)
 */

import { SurfaceType } from '../types';

export type AudioMode = 'MENU' | 'GAMEPLAY' | 'INSPECTING';

export interface SpatialAudioParams {
  pan: number;
  filterCutoff: number;
  attenuation: number;
  isBehind: boolean;
}

export class HorrorAudioManager {
  private ctx: AudioContext | null = null;

  // Master audio buses
  private masterGain: GainNode | null = null;
  private masterLimiter: DynamicsCompressorNode | null = null;
  private safetyHighpass: BiquadFilterNode | null = null;

  // Sub-mix buses
  private ambienceBus: GainNode | null = null;
  private sfxBus: GainNode | null = null;
  private uiBus: GainNode | null = null;

  // Layer 1: Dark Cinematic Drone & Eerie Pad
  private droneGain: GainNode | null = null;
  private droneOsc1: OscillatorNode | null = null;
  private droneOsc2: OscillatorNode | null = null;
  private droneOscSub: OscillatorNode | null = null;
  private droneEerieOsc: OscillatorNode | null = null;
  private droneFilter: BiquadFilterNode | null = null;

  // Layer 2: Cold Forest Wind
  private windGain: GainNode | null = null;
  private windLfoGain: GainNode | null = null;
  private windFilter: BiquadFilterNode | null = null;
  private windLowpass: BiquadFilterNode | null = null;
  private windLfo: OscillatorNode | null = null;
  private windSource: AudioBufferSourceNode | null = null;

  // Layer 3: Rain Ambience
  private rainGain: GainNode | null = null;
  private rainSource: AudioBufferSourceNode | null = null;

  // Heartbeat Engine
  private heartbeatGain: GainNode | null = null;
  private heartbeatIntervalId: any = null;
  private heartbeatBpm = 58;
  private heartbeatTargetVol = 0;
  private isHeartbeatRunning = false;

  // Seamless Pre-Rendered Audio Buffers (Zero runtime GC allocation)
  private pinkNoiseBuffer: AudioBuffer | null = null;
  private brownNoiseBuffer: AudioBuffer | null = null;
  private rainBuffer: AudioBuffer | null = null;
  private footstepBuffers: AudioBuffer[] = [];
  private gravelStepBuffers: AudioBuffer[] = [];
  private leavesStepBuffers: AudioBuffer[] = [];
  private woodStepBuffers: AudioBuffer[] = [];
  private stoneStepBuffers: AudioBuffer[] = [];
  private currentSurface: SurfaceType = 'GRAVEL';

  // State & Volumes
  private isInitialized = false;
  private currentMode: AudioMode = 'MENU';
  private masterVolume = 0.75;
  private musicVolume = 0.55; // Ambience
  private sfxVolume = 0.70;
  private isDucked = false;

  // 3D Listener Orientation tracking (from Three.js camera)
  private listenerPos = { x: 0, y: 1.8, z: 8 };
  private listenerForward = { x: 0, y: 0, z: -1 };
  private isPlayerMoving = false;

  // Random Event & Tension Manager
  private isEventManagerRunning = false;
  private eventTimeoutId: any = null;
  private lastFootstepTime = 0;
  private lastTensionUpdate = 0;
  private lastStalkerFootstepTime = 0;
  private stepIndex = 0;
  private currentDistanceToGate = 30;

  // Story Mode Cinematic Audio Architecture
  private storyScoreBus: GainNode | null = null;
  private storyActiveOscs: OscillatorNode[] = [];
  private storyActiveGains: GainNode[] = [];
  private storyIntervalId: any = null;

  constructor() {}

  /**
   * Initialize Web Audio API on genuine user gesture.
   */
  public async init(): Promise<void> {
    if (this.isInitialized && this.ctx) {
      if (this.ctx.state === 'suspended') {
        try {
          await this.ctx.resume();
        } catch (e) {
          console.warn('AudioContext resume failed:', e);
        }
      }
      return;
    }

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();

      if (this.ctx.state === 'suspended') {
        await this.ctx.resume();
      }

      // 1. Pre-generate smooth, click-free audio buffers
      this.generatePreRenderedBuffers();

      // 2. Setup master limiter & safety sub-filter
      this.setupMasterChain();

      // 3. Setup continuous layered ambience (Drone, Wind, Rain)
      this.setupContinuousAmbience();

      // 4. Setup heartbeat synthesizer bus
      this.setupHeartbeatEngine();

      // 5. Start random atmospheric event manager
      this.startEventManager();

      this.isInitialized = true;
      this.setMode('MENU');
    } catch (e) {
      console.warn('Audio initialization failed:', e);
    }
  }

  /**
   * Master bus signal path:
   * Sub-buses -> Master Gain -> Safety Highpass (32Hz) -> Transparent Compressor -> Destination
   * 
   * Configured with 40ms attack to prevent waveform clipping and speaker distortion on bass frequencies.
   */
  private setupMasterChain(): void {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Sub-buses
    this.ambienceBus = this.ctx.createGain();
    this.ambienceBus.gain.setValueAtTime(this.musicVolume, now);

    this.sfxBus = this.ctx.createGain();
    this.sfxBus.gain.setValueAtTime(this.sfxVolume, now);

    this.uiBus = this.ctx.createGain();
    this.uiBus.gain.setValueAtTime(0.40, now);

    this.storyScoreBus = this.ctx.createGain();
    this.storyScoreBus.gain.setValueAtTime(0.80, now);

    // Master bus
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(this.masterVolume, now);

    this.ambienceBus.connect(this.masterGain);
    this.sfxBus.connect(this.masterGain);
    this.uiBus.connect(this.masterGain);
    this.storyScoreBus.connect(this.masterGain);

    // Subsonic safety highpass filter (removes DC offset and <32Hz rumble that causes speaker distortion)
    this.safetyHighpass = this.ctx.createBiquadFilter();
    this.safetyHighpass.type = 'highpass';
    this.safetyHighpass.frequency.setValueAtTime(32, now);
    this.safetyHighpass.Q.setValueAtTime(0.707, now);
    this.masterGain.connect(this.safetyHighpass);

    // Transparent Master Dynamics Compressor (smooth leveling, NO wave-chopping distortion)
    this.masterLimiter = this.ctx.createDynamicsCompressor();
    this.masterLimiter.threshold.setValueAtTime(-8.0, now); // dB
    this.masterLimiter.knee.setValueAtTime(10.0, now);       // Soft knee
    this.masterLimiter.ratio.setValueAtTime(3.2, now);       // Gentle musical compression
    this.masterLimiter.attack.setValueAtTime(0.040, now);    // 40ms attack: preserves bass waveform shape!
    this.masterLimiter.release.setValueAtTime(0.24, now);    // 240ms smooth recovery

    this.safetyHighpass.connect(this.masterLimiter);
    this.masterLimiter.connect(this.ctx.destination);
  }

  /**
   * Pre-generates high-fidelity stereo noise and impulse textures with equal-power loop crossfading.
   * Eliminates loop clicks, pops, and DC discontinuities.
   */
  private generatePreRenderedBuffers(): void {
    if (!this.ctx) return;
    const sampleRate = this.ctx.sampleRate;

    // 1. High-fidelity Pink Noise Buffer (10 seconds, seamless equal-power loop)
    const pinkLength = sampleRate * 10;
    this.pinkNoiseBuffer = this.ctx.createBuffer(2, pinkLength, sampleRate);
    const fadeLen = Math.floor(sampleRate * 0.5); // 0.5s crossfade window

    for (let ch = 0; ch < 2; ch++) {
      const data = this.pinkNoiseBuffer.getChannelData(ch);
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < pinkLength; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        const pink = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
        b6 = white * 0.115926;
        data[i] = pink * 0.022; // Clean headroom
      }
      // Equal-power Hann crossfade on buffer boundaries
      for (let i = 0; i < fadeLen; i++) {
        const prog = i / fadeLen;
        const gainIn = Math.sin(prog * (Math.PI / 2));
        const gainOut = Math.cos(prog * (Math.PI / 2));
        const headIdx = i;
        const tailIdx = pinkLength - fadeLen + i;
        const blended = data[headIdx] * gainIn + data[tailIdx] * gainOut;
        data[headIdx] = blended;
        data[tailIdx] = blended;
      }
    }

    // 2. High-fidelity Brown Noise Buffer (10 seconds, seamless equal-power loop)
    const brownLength = sampleRate * 10;
    this.brownNoiseBuffer = this.ctx.createBuffer(2, brownLength, sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const data = this.brownNoiseBuffer.getChannelData(ch);
      let lastOut = 0;
      for (let i = 0; i < brownLength; i++) {
        const white = Math.random() * 2 - 1;
        // Leaky integrator filtered to avoid DC accumulation
        lastOut = (lastOut * 0.97) + (white * 0.03);
        data[i] = lastOut * 0.45;
      }
      for (let i = 0; i < fadeLen; i++) {
        const prog = i / fadeLen;
        const gainIn = Math.sin(prog * (Math.PI / 2));
        const gainOut = Math.cos(prog * (Math.PI / 2));
        const headIdx = i;
        const tailIdx = brownLength - fadeLen + i;
        const blended = data[headIdx] * gainIn + data[tailIdx] * gainOut;
        data[headIdx] = blended;
        data[tailIdx] = blended;
      }
    }

    // 3. Subtle Rain Ambience Buffer (8 seconds, smooth continuous bed)
    const rainLength = sampleRate * 8;
    this.rainBuffer = this.ctx.createBuffer(2, rainLength, sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const data = this.rainBuffer.getChannelData(ch);
      let filterA = 0;
      let filterB = 0;
      for (let i = 0; i < rainLength; i++) {
        const white = Math.random() * 2 - 1;
        // Two-pole soft band-filtering: gentle rain hiss without harsh clicks
        filterA = filterA * 0.82 + white * 0.18;
        filterB = filterB * 0.70 + (white - filterA) * 0.30;
        data[i] = filterB * 0.085;
      }
      for (let i = 0; i < fadeLen; i++) {
        const prog = i / fadeLen;
        const gainIn = Math.sin(prog * (Math.PI / 2));
        const gainOut = Math.cos(prog * (Math.PI / 2));
        const headIdx = i;
        const tailIdx = rainLength - fadeLen + i;
        const blended = data[headIdx] * gainIn + data[tailIdx] * gainOut;
        data[headIdx] = blended;
        data[tailIdx] = blended;
      }
    }

    // 4. Pre-rendered Material-Aware Footstep Impulses
    // A. GRAVEL: Gritty pebble friction, loose stone grinding, firm packed driveway ground thud
    const gravelLength = Math.floor(sampleRate * 0.22);
    for (let v = 0; v < 5; v++) {
      const stepBuf = this.ctx.createBuffer(1, gravelLength, sampleRate);
      const data = stepBuf.getChannelData(0);
      let gritFilter = 0;
      for (let i = 0; i < gravelLength; i++) {
        const t = i / sampleRate;
        const env = t < 0.012 ? t / 0.012 : Math.exp(-(t - 0.012) * 19.0);
        const white = Math.random() * 2 - 1;
        gritFilter = gritFilter * 0.58 + white * 0.42;
        const grit = (white - gritFilter) * (1.0 + 0.35 * Math.sin(t * (420 + v * 55)));
        const thudFreq = 115 + (v % 3) * 18;
        const thud = Math.sin(t * 2 * Math.PI * thudFreq) * Math.exp(-t * 24.0) * 0.36;
        const pebbleClick = Math.sin(t * 2 * Math.PI * (1750 + v * 280)) * Math.exp(-t * 65.0) * 0.16;
        data[i] = (grit * 0.26 * env + thud + pebbleClick * env) * 0.38;
      }
      this.gravelStepBuffers.push(stepBuf);
    }

    // B. LEAVES: Brittle twig crackles, crisp multi-point dry leaf fractures, organic rustle tail, cushioned thud
    const leavesLength = Math.floor(sampleRate * 0.26);
    for (let v = 0; v < 5; v++) {
      const stepBuf = this.ctx.createBuffer(1, leavesLength, sampleRate);
      const data = stepBuf.getChannelData(0);
      const crackleTimes = [
        0.007 + (v * 0.003) % 0.011,
        0.021 + ((v * 7) % 5) * 0.004,
        0.039 + ((v * 3) % 4) * 0.005,
        0.062 + ((v * 5) % 6) * 0.004,
      ];
      let noiseFilter = 0;
      let rustleFilter = 0;
      for (let i = 0; i < leavesLength; i++) {
        const t = i / sampleRate;
        const rustleEnv = t < 0.024 ? t / 0.024 : Math.exp(-(t - 0.024) * 14.5);
        const rawWhite = Math.random() * 2 - 1;
        noiseFilter = noiseFilter * 0.46 + rawWhite * 0.54;
        const leafNoise = rawWhite - noiseFilter;
        rustleFilter = rustleFilter * 0.74 + rawWhite * 0.26;

        let crackleSum = 0;
        for (const ct of crackleTimes) {
          const dt = t - ct;
          if (dt >= 0 && dt < 0.008) {
            const cProgress = dt / 0.008;
            const cEnv = Math.sin(cProgress * Math.PI) * Math.exp(-cProgress * 3.6);
            const snap = (Math.random() * 2 - 1) * 0.46 + Math.sin(dt * 2 * Math.PI * (2900 + v * 320)) * 0.24;
            crackleSum += snap * cEnv;
          }
        }

        const cushionedThud = Math.sin(t * 2 * Math.PI * (78 + v * 8)) * Math.exp(-t * 29.0) * 0.16;
        data[i] = (leafNoise * 0.26 * rustleEnv + rustleFilter * 0.09 * rustleEnv + crackleSum * 0.38 + cushionedThud) * 0.40;
      }
      this.leavesStepBuffers.push(stepBuf);
    }

    // C. WOOD: Hollow timber cavity resonance (~140-170Hz), shoe heel tap, and subtle aged plank flex/creak
    const woodLength = Math.floor(sampleRate * 0.25);
    for (let v = 0; v < 5; v++) {
      const stepBuf = this.ctx.createBuffer(1, woodLength, sampleRate);
      const data = stepBuf.getChannelData(0);
      const woodFund = 144 + v * 9;
      const woodHarm = woodFund * 2.38;
      const hasCreak = v === 1 || v === 3;
      let noiseFilt = 0;
      for (let i = 0; i < woodLength; i++) {
        const t = i / sampleRate;
        const tapEnv = t < 0.006 ? t / 0.006 : Math.exp(-(t - 0.006) * 78.0);
        const white = Math.random() * 2 - 1;
        noiseFilt = noiseFilt * 0.65 + white * 0.35;
        const tap = (white - noiseFilt) * tapEnv * 0.24;

        const resEnv = t < 0.008 ? t / 0.008 : Math.exp(-(t - 0.008) * 19.5);
        const res = (
          Math.sin(t * 2 * Math.PI * woodFund) * 0.42 +
          Math.sin(t * 2 * Math.PI * woodHarm) * 0.19
        ) * resEnv;

        let creak = 0;
        if (hasCreak && t > 0.014 && t < 0.12) {
          const cProg = (t - 0.014) / 0.106;
          const cEnv = Math.sin(cProg * Math.PI) * Math.exp(-cProg * 2.2);
          const cFreq = 315 - cProg * 85;
          creak = Math.sin(t * 2 * Math.PI * cFreq) * cEnv * 0.15;
        }

        data[i] = (tap + res + creak) * 0.42;
      }
      this.woodStepBuffers.push(stepBuf);
    }

    // D. STONE: Solid granite/masonry slap, crisp unyielding click, and rapid decay
    const stoneLength = Math.floor(sampleRate * 0.18);
    for (let v = 0; v < 5; v++) {
      const stepBuf = this.ctx.createBuffer(1, stoneLength, sampleRate);
      const data = stepBuf.getChannelData(0);
      let noiseFilt = 0;
      for (let i = 0; i < stoneLength; i++) {
        const t = i / sampleRate;
        const tapEnv = t < 0.004 ? t / 0.004 : Math.exp(-(t - 0.004) * 68.0);
        const white = Math.random() * 2 - 1;
        noiseFilt = noiseFilt * 0.54 + white * 0.46;
        const tap = (white - noiseFilt) * tapEnv * 0.34;

        const thudFreq = 185 + (v * 14);
        const thud = Math.sin(t * 2 * Math.PI * thudFreq) * Math.exp(-t * 39.0) * 0.36;

        let echo = 0;
        if (t > 0.018) {
          const dt = t - 0.018;
          echo = Math.sin(dt * 2 * Math.PI * (thudFreq * 1.5)) * Math.exp(-dt * 52.0) * 0.09;
        }

        data[i] = (tap + thud + echo) * 0.38;
      }
      this.stoneStepBuffers.push(stepBuf);
    }

    // Keep primary reference for backward compatibility
    this.footstepBuffers = this.gravelStepBuffers;
  }

  /**
   * Continuous layered ambience:
   * Layer 1: Dark Sub-Drone & Eerie Pad (Pure sines, warm 85Hz lowpass, 0.3Hz binaural pulse)
   * Layer 2: Cold Forest Wind (Bandpass pink noise with smooth LFO gain swell)
   * Layer 3: Rain Ambience (Gentle stereo bed)
   */
  private setupContinuousAmbience(): void {
    if (!this.ctx || !this.ambienceBus) return;
    const now = this.ctx.currentTime;

    // === LAYER 1: DARK ATMOSPHERIC DRONE ===
    this.droneOsc1 = this.ctx.createOscillator();
    this.droneOsc1.type = 'sine';
    this.droneOsc1.frequency.setValueAtTime(48.0, now); // Low G0

    this.droneOsc2 = this.ctx.createOscillator();
    this.droneOsc2.type = 'sine';
    this.droneOsc2.frequency.setValueAtTime(48.3, now); // 0.3Hz hypnotic binaural beat

    this.droneOscSub = this.ctx.createOscillator();
    this.droneOscSub.type = 'sine';
    this.droneOscSub.frequency.setValueAtTime(72.0, now); // Perfect fifth harmonic overtone

    this.droneFilter = this.ctx.createBiquadFilter();
    this.droneFilter.type = 'lowpass';
    this.droneFilter.frequency.setValueAtTime(85, now);
    this.droneFilter.Q.setValueAtTime(0.707, now);

    this.droneGain = this.ctx.createGain();
    this.droneGain.gain.setValueAtTime(0.024, now);

    // Ethereal subtle high tension resonance (glassy eerie choir tone)
    this.droneEerieOsc = this.ctx.createOscillator();
    this.droneEerieOsc.type = 'sine';
    this.droneEerieOsc.frequency.setValueAtTime(432.0, now);

    const eerieFilter = this.ctx.createBiquadFilter();
    eerieFilter.type = 'bandpass';
    eerieFilter.frequency.setValueAtTime(432, now);
    eerieFilter.Q.setValueAtTime(6.0, now);

    const eerieGain = this.ctx.createGain();
    eerieGain.gain.setValueAtTime(0.005, now);

    this.droneEerieOsc.connect(eerieFilter);
    eerieFilter.connect(eerieGain);
    eerieGain.connect(this.ambienceBus);

    this.droneOsc1.connect(this.droneFilter);
    this.droneOsc2.connect(this.droneFilter);
    this.droneOscSub.connect(this.droneFilter);
    this.droneFilter.connect(this.droneGain);
    this.droneGain.connect(this.ambienceBus);

    this.droneOsc1.start();
    this.droneOsc2.start();
    this.droneOscSub.start();
    this.droneEerieOsc.start();

    // === LAYER 2: COLD FOREST WIND ===
    if (this.pinkNoiseBuffer) {
      this.windSource = this.ctx.createBufferSource();
      this.windSource.buffer = this.pinkNoiseBuffer;
      this.windSource.loop = true;

      this.windFilter = this.ctx.createBiquadFilter();
      this.windFilter.type = 'bandpass';
      this.windFilter.frequency.setValueAtTime(320, now);
      this.windFilter.Q.setValueAtTime(1.1, now);

      this.windLowpass = this.ctx.createBiquadFilter();
      this.windLowpass.type = 'lowpass';
      this.windLowpass.frequency.setValueAtTime(650, now);
      this.windLowpass.Q.setValueAtTime(0.7, now);

      // Smooth volume LFO for wind swells (modulates gain, NOT filter frequency, preventing parameter zipper noise)
      this.windLfo = this.ctx.createOscillator();
      this.windLfo.frequency.setValueAtTime(0.065, now); // ~15 second swell cycle

      this.windLfoGain = this.ctx.createGain();
      this.windLfoGain.gain.setValueAtTime(0.015, now);

      this.windGain = this.ctx.createGain();
      this.windGain.gain.setValueAtTime(0.045, now);

      this.windLfo.connect(this.windLfoGain);
      this.windLfoGain.connect(this.windGain.gain);
      this.windLfo.start();

      this.windSource.connect(this.windFilter);
      this.windFilter.connect(this.windLowpass);
      this.windLowpass.connect(this.windGain);
      this.windGain.connect(this.ambienceBus);

      this.windSource.start();
    }

    // === LAYER 3: RAIN AMBIENCE ===
    if (this.rainBuffer) {
      this.rainSource = this.ctx.createBufferSource();
      this.rainSource.buffer = this.rainBuffer;
      this.rainSource.loop = true;

      const rainFilter = this.ctx.createBiquadFilter();
      rainFilter.type = 'bandpass';
      rainFilter.frequency.setValueAtTime(1800, now);
      rainFilter.Q.setValueAtTime(0.85, now);

      this.rainGain = this.ctx.createGain();
      this.rainGain.gain.setValueAtTime(0.022, now);

      this.rainSource.connect(rainFilter);
      rainFilter.connect(this.rainGain);
      this.rainGain.connect(this.ambienceBus);

      this.rainSource.start();
    }
  }

  /**
   * HEARTBEAT SYSTEM:
   * Anatomical double-beat engine with gentle sine thumps (zero distortion).
   */
  private setupHeartbeatEngine(): void {
    if (!this.ctx || !this.sfxBus) return;
    this.heartbeatGain = this.ctx.createGain();
    this.heartbeatGain.gain.setValueAtTime(0.0, this.ctx.currentTime);
    this.heartbeatGain.connect(this.sfxBus);

    this.startHeartbeatLoop();
  }

  private startHeartbeatLoop(): void {
    if (this.isHeartbeatRunning) return;
    this.isHeartbeatRunning = true;

    const tickHeartbeat = () => {
      if (!this.isHeartbeatRunning || !this.ctx) return;

      if (this.heartbeatTargetVol > 0.005 && this.currentMode === 'GAMEPLAY') {
        this.playSingleHeartbeatPulse(this.heartbeatTargetVol);
      }

      const intervalMs = Math.max(550, (60 / this.heartbeatBpm) * 1000);
      this.heartbeatIntervalId = setTimeout(tickHeartbeat, intervalMs);
    };

    tickHeartbeat();
  }

  private playSingleHeartbeatPulse(volume: number): void {
    if (!this.ctx || !this.heartbeatGain) return;
    const now = this.ctx.currentTime;

    // 1. "Lub" — Primary pulse
    const osc1 = this.ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(52, now);
    osc1.frequency.exponentialRampToValueAtTime(36, now + 0.08);

    const gain1 = this.ctx.createGain();
    gain1.gain.setValueAtTime(0.0001, now);
    gain1.gain.linearRampToValueAtTime(volume * 0.7, now + 0.015);
    gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);

    osc1.connect(gain1);
    gain1.connect(this.heartbeatGain);
    osc1.start(now);
    osc1.stop(now + 0.13);

    // 2. "Dub" — Secondary recoil
    const t2 = now + 0.11;
    const osc2 = this.ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(58, t2);
    osc2.frequency.exponentialRampToValueAtTime(38, t2 + 0.07);

    const gain2 = this.ctx.createGain();
    gain2.gain.setValueAtTime(0.0001, t2);
    gain2.gain.linearRampToValueAtTime(volume * 0.5, t2 + 0.012);
    gain2.gain.exponentialRampToValueAtTime(0.0001, t2 + 0.10);

    osc2.connect(gain2);
    gain2.connect(this.heartbeatGain);
    osc2.start(t2);
    osc2.stop(t2 + 0.11);
  }

  // =========================================================================
  // 3D POSITIONAL AUDIO ENGINE (Relative to Player Camera)
  // =========================================================================

  public updateListener(
    cameraPos: { x: number; y: number; z: number },
    cameraForward: { x: number; y: number; z: number },
    isMoving: boolean
  ): void {
    this.listenerPos.x = cameraPos.x;
    this.listenerPos.y = cameraPos.y;
    this.listenerPos.z = cameraPos.z;

    this.listenerForward.x = cameraForward.x;
    this.listenerForward.y = cameraForward.y;
    this.listenerForward.z = cameraForward.z;

    this.isPlayerMoving = isMoving;
    this.checkStalkerFootstepTrigger();
  }

  public getSpatialParams(worldX: number, worldY: number, worldZ: number): SpatialAudioParams {
    const dx = worldX - this.listenerPos.x;
    const dy = worldY - this.listenerPos.y;
    const dz = worldZ - this.listenerPos.z;
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

    const lx = this.listenerForward.x;
    const lz = this.listenerForward.z;

    // Projection onto listener's right axis (-lz, lx) and forward axis (lx, lz)
    const rightProj = dx * (-lz) + dz * lx;
    const forwardProj = dx * lx + dz * lz;

    const relAngle = Math.atan2(rightProj, forwardProj);
    const pan = Math.max(-1, Math.min(1, Math.sin(relAngle)));
    const isBehind = forwardProj < -0.12;

    const filterCutoff = isBehind ? 2400 : 7500;
    const attenuation = Math.max(0.18, 1.0 / (1.0 + Math.max(0, dist - 1.5) * 0.085));

    return { pan, filterCutoff, attenuation, isBehind };
  }

  private createPanner(panValue: number): AudioNode {
    const clampedPan = Math.max(-1, Math.min(1, panValue));
    if (this.ctx && typeof this.ctx.createStereoPanner === 'function') {
      const panner = this.ctx.createStereoPanner();
      panner.pan.setValueAtTime(clampedPan, this.ctx.currentTime);
      return panner;
    }
    return this.ctx!.createGain();
  }

  // =========================================================================
  // GATE PROXIMITY & TENSION CONTROLLER (Strict 30m / 20m / 12m / 8m / 5m / 3m stages)
  // =========================================================================

  public updateGateProximity(distanceToGate: number): void {
    this.currentDistanceToGate = distanceToGate;
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    if (now - this.lastTensionUpdate < 0.15) return;
    this.lastTensionUpdate = now;

    // 30m+ : Normal atmosphere
    if (distanceToGate >= 28) {
      this.heartbeatTargetVol = 0;
      this.heartbeatBpm = 50;
      if (this.droneGain) this.droneGain.gain.setTargetAtTime(0.022, now, 1.0);
      if (this.windFilter) this.windFilter.frequency.setTargetAtTime(300, now, 1.0);
    }
    // 20m : Subtle wind and distant sounds
    else if (distanceToGate >= 18) {
      this.heartbeatTargetVol = 0;
      this.heartbeatBpm = 52;
      const t = 1 - (distanceToGate - 18) / 10;
      if (this.droneGain) this.droneGain.gain.setTargetAtTime(0.026, now, 0.9);
      if (this.windFilter) this.windFilter.frequency.setTargetAtTime(340 + t * 40, now, 0.9);
    }
    // 12m : Slightly stronger environmental tension
    else if (distanceToGate >= 10) {
      const t = 1 - (distanceToGate - 10) / 8;
      this.heartbeatTargetVol = 0.008 + t * 0.008; // very subtle, barely noticeable
      this.heartbeatBpm = 56 + t * 6;
      if (this.droneGain) this.droneGain.gain.setTargetAtTime(0.030, now, 0.8);
      if (this.windFilter) this.windFilter.frequency.setTargetAtTime(380, now, 0.8);
    }
    // 8m : Occasional heartbeat audible
    else if (distanceToGate >= 6) {
      const t = 1 - (distanceToGate - 6) / 4;
      this.heartbeatTargetVol = 0.018 + t * 0.010;
      this.heartbeatBpm = 62 + t * 8;
      if (this.droneGain) this.droneGain.gain.setTargetAtTime(0.035, now, 0.6);
      if (this.windFilter) this.windFilter.frequency.setTargetAtTime(410, now, 0.6);
    }
    // 5m : Subtle breathing / metal creak
    else if (distanceToGate >= 3.5) {
      const t = 1 - (distanceToGate - 3.5) / 2.5;
      this.heartbeatTargetVol = 0.028 + t * 0.010;
      this.heartbeatBpm = 72 + t * 8;
      if (this.droneGain) this.droneGain.gain.setTargetAtTime(0.040, now, 0.5);
      if (this.windFilter) this.windFilter.frequency.setTargetAtTime(440, now, 0.5);
    }
    // 3m : Strong psychological tension
    else if (distanceToGate >= 2.4) {
      const t = 1 - (distanceToGate - 2.4) / 1.1;
      this.heartbeatTargetVol = 0.040 + t * 0.012;
      this.heartbeatBpm = 82 + t * 8;
      if (this.droneGain) this.droneGain.gain.setTargetAtTime(0.045, now, 0.4);
      if (this.windFilter) this.windFilter.frequency.setTargetAtTime(480, now, 0.4);
    }
    // Very close (< 2.4m) : Brief silence / vacuum before interaction
    else {
      this.heartbeatTargetVol = 0.032;
      this.heartbeatBpm = 76;
      // Gentle atmospheric duck creating psychological vacuum
      if (this.droneGain) this.droneGain.gain.setTargetAtTime(0.018, now, 0.5);
      if (this.windFilter) this.windFilter.frequency.setTargetAtTime(320, now, 0.5);
    }
  }

  // =========================================================================
  // FOOTSTEPS BEHIND THE PLAYER (Psychological Effect)
  // =========================================================================

  private checkStalkerFootstepTrigger(): void {
    if (!this.isPlayerMoving || this.currentMode !== 'GAMEPLAY') return;

    const now = Date.now();
    if (now - this.lastStalkerFootstepTime < 45000) return;

    if (Math.random() < 0.25) {
      this.lastStalkerFootstepTime = now;
      this.triggerStalkerFootstepsBehind();
    } else {
      this.lastStalkerFootstepTime = now - 18000;
    }
  }

  public triggerStalkerFootstepsBehind(): void {
    if (!this.ctx || this.currentMode !== 'GAMEPLAY') return;

    const pos1 = {
      x: this.listenerPos.x - this.listenerForward.x * 4.0 - 0.4,
      y: 0,
      z: this.listenerPos.z - this.listenerForward.z * 4.0,
    };
    this.playSpatialFootstep(pos1.x, pos1.y, pos1.z, 0.026);

    setTimeout(() => {
      if (!this.ctx || this.currentMode !== 'GAMEPLAY') return;
      const pos2 = {
        x: this.listenerPos.x - this.listenerForward.x * 3.2 + 0.3,
        y: 0,
        z: this.listenerPos.z - this.listenerForward.z * 3.2,
      };
      this.playSpatialFootstep(pos2.x, pos2.y, pos2.z, 0.022);
    }, 1100);
  }

  public playSpatialFootstep(x: number, y: number, z: number, baseVol = 0.028): void {
    if (!this.ctx || !this.sfxBus) return;
    const now = this.ctx.currentTime;
    const spatial = this.getSpatialParams(x, y, z);
    const surface = this.getSurfaceTypeAtPosition(x, y, z);

    let buffers = this.gravelStepBuffers;
    if (surface === 'LEAVES' && this.leavesStepBuffers.length > 0) buffers = this.leavesStepBuffers;
    else if (surface === 'WOOD' && this.woodStepBuffers.length > 0) buffers = this.woodStepBuffers;
    else if (surface === 'STONE' && this.stoneStepBuffers.length > 0) buffers = this.stoneStepBuffers;
    else if (this.footstepBuffers.length > 0) buffers = this.footstepBuffers;

    if (buffers.length > 0) {
      const buf = buffers[Math.floor(Math.random() * buffers.length)];
      const source = this.ctx.createBufferSource();
      source.buffer = buf;
      source.playbackRate.setValueAtTime(0.94 + Math.random() * 0.08, now);

      const filter = this.ctx.createBiquadFilter();
      filter.type = surface === 'LEAVES' ? 'bandpass' : 'lowpass';
      if (surface === 'LEAVES') {
        filter.frequency.setValueAtTime(Math.min(spatial.filterCutoff * 1.4, 3600), now);
        filter.Q.setValueAtTime(1.1, now);
      } else if (surface === 'WOOD') {
        filter.frequency.setValueAtTime(Math.min(spatial.filterCutoff, 1400), now);
        filter.Q.setValueAtTime(1.8, now);
      } else {
        filter.frequency.setValueAtTime(spatial.filterCutoff, now);
      }

      const gain = this.ctx.createGain();
      const finalVol = baseVol * spatial.attenuation * (surface === 'LEAVES' ? 1.2 : 1.0);
      gain.gain.setValueAtTime(finalVol, now);

      const panner = this.createPanner(spatial.pan);

      source.connect(filter);
      filter.connect(gain);
      gain.connect(panner);
      panner.connect(this.sfxBus);

      source.start(now);
    } else if (this.pinkNoiseBuffer) {
      const noise = this.ctx.createBufferSource();
      noise.buffer = this.pinkNoiseBuffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(spatial.isBehind ? 650 : 920, now);
      filter.Q.setValueAtTime(2.2, now);

      const gain = this.ctx.createGain();
      const stepVol = baseVol * spatial.attenuation;
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(stepVol, now + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);

      const panner = this.createPanner(spatial.pan);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(panner);
      panner.connect(this.sfxBus);

      noise.start(now);
      noise.stop(now + 0.18);
    }
  }

  // =========================================================================
  // WHISPER & BREATHING SYSTEM (Subtle, Clean)
  // =========================================================================

  public playSubtleWhisper(direction: 'LEFT' | 'RIGHT' | 'BEHIND' | 'DISTANT' = 'BEHIND'): void {
    if (!this.ctx || !this.sfxBus || !this.pinkNoiseBuffer) return;
    const now = this.ctx.currentTime;

    let pan = 0;
    let filterCutoff = 2000;
    let peakGain = 0.016; // Whisper quiet

    if (direction === 'LEFT') {
      pan = -0.80;
      filterCutoff = 3200;
    } else if (direction === 'RIGHT') {
      pan = 0.80;
      filterCutoff = 3200;
    } else if (direction === 'BEHIND') {
      pan = 0.05;
      filterCutoff = 1900;
    } else {
      pan = Math.random() * 1.2 - 0.6;
      peakGain = 0.012;
      filterCutoff = 1600;
    }

    const source = this.ctx.createBufferSource();
    source.buffer = this.pinkNoiseBuffer;

    const formant1 = this.ctx.createBiquadFilter();
    formant1.type = 'bandpass';
    formant1.frequency.setValueAtTime(680 + Math.random() * 60, now);
    formant1.Q.setValueAtTime(4.5, now);
    formant1.frequency.linearRampToValueAtTime(1020, now + 1.8);

    const headFilter = this.ctx.createBiquadFilter();
    headFilter.type = 'lowpass';
    headFilter.frequency.setValueAtTime(filterCutoff, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(peakGain, now + 0.6);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.0);

    const panner = this.createPanner(pan);

    source.connect(formant1);
    formant1.connect(headFilter);
    headFilter.connect(gain);
    gain.connect(panner);
    panner.connect(this.sfxBus);

    source.start(now);
    source.stop(now + 2.1);
  }

  public playFaintBreathing(pan = 0.35): void {
    if (!this.ctx || !this.sfxBus || !this.pinkNoiseBuffer) return;
    const now = this.ctx.currentTime;

    const source = this.ctx.createBufferSource();
    source.buffer = this.pinkNoiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(680, now);
    filter.Q.setValueAtTime(2.2, now);
    filter.frequency.linearRampToValueAtTime(420, now + 1.6);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.016, now + 1.0);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.8);

    const panner = this.createPanner(pan);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(panner);
    panner.connect(this.sfxBus);

    source.start(now);
    source.stop(now + 1.9);
  }

  // =========================================================================
  // LIGHTNING + THUNDER SYSTEM (Dynamic Delays & Zero Distortion)
  // =========================================================================

  public triggerLightningThunder(isCloser = Math.random() < 0.25): void {
    const delayMs = isCloser
      ? Math.floor(Math.random() * 1200 + 600)   // 0.6s - 1.8s
      : Math.floor(Math.random() * 2000 + 1500); // 1.5s - 3.5s

    this.playCinematicThunder(delayMs, isCloser);
  }

  /**
   * Distant or Closer Thunder with smooth lowpass roll-off and zero clipping.
   */
  public playCinematicThunder(delayMs: number = 0, isCloser = false): void {
    if (!this.ctx || !this.sfxBus || !this.brownNoiseBuffer) return;

    setTimeout(() => {
      if (!this.ctx || !this.sfxBus || !this.brownNoiseBuffer) return;
      const now = this.ctx.currentTime;
      const panVal = Math.random() * 0.9 - 0.45;

      const subPeakVol = isCloser ? 0.085 : 0.055;
      const noisePeakVol = isCloser ? 0.075 : 0.045;
      const duration = isCloser ? 4.2 : 5.4;

      // 1. Warm Sub-Bass Rumble Body (Sine wave with gradual 100ms attack to avoid clicks)
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(isCloser ? 58 : 46, now);
      osc.frequency.exponentialRampToValueAtTime(32, now + 3.8);

      const oscGain = this.ctx.createGain();
      oscGain.gain.setValueAtTime(0.0001, now);
      oscGain.gain.linearRampToValueAtTime(subPeakVol, now + 0.14);
      oscGain.gain.exponentialRampToValueAtTime(0.0001, now + 4.2);

      const panner = this.createPanner(panVal);

      osc.connect(oscGain);
      oscGain.connect(panner);
      panner.connect(this.sfxBus);

      osc.start(now);
      osc.stop(now + 4.3);

      // 2. Diffuse Sky Rumble (Gentle lowpass brown noise)
      const noise = this.ctx.createBufferSource();
      noise.buffer = this.brownNoiseBuffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(isCloser ? 140 : 95, now);
      filter.frequency.linearRampToValueAtTime(38, now + duration - 0.5);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.0001, now);
      noiseGain.gain.linearRampToValueAtTime(noisePeakVol, now + (isCloser ? 0.20 : 0.35));
      noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(panner);

      noise.start(now);
      noise.stop(now + duration + 0.1);
    }, delayMs);
  }

  public playDistantThunder(delayMs: number = 0): void {
    this.playCinematicThunder(delayMs, false);
  }

  // =========================================================================
  // HOUSE / ENVIRONMENT SOUNDS (Spatialized & Organic)
  // =========================================================================

  public playGateCreak(intensity: number = 0.5): void {
    if (!this.ctx || !this.sfxBus) return;
    const now = this.ctx.currentTime;

    const spatial = this.getSpatialParams(0, 2.5, -22);

    const osc1 = this.ctx.createOscillator();
    osc1.type = 'sine';

    const baseFreq = 320 + Math.random() * 50;
    osc1.frequency.setValueAtTime(baseFreq, now);
    osc1.frequency.exponentialRampToValueAtTime(baseFreq * 1.18, now + 0.3);
    osc1.frequency.exponentialRampToValueAtTime(baseFreq * 0.92, now + 0.9);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(620, now);
    filter.Q.setValueAtTime(2.5, now);

    const gain = this.ctx.createGain();
    const peakGain = (0.024 + intensity * 0.028) * spatial.attenuation;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(peakGain, now + 0.2);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.1);

    const panner = this.createPanner(spatial.pan);

    osc1.connect(filter);
    filter.connect(gain);
    gain.connect(panner);
    panner.connect(this.sfxBus);

    osc1.start(now);
    osc1.stop(now + 1.15);
  }

  /**
   * FAINT METALLIC CHAIN SOUND:
   * Multi-link iron rattle coming from the gate padlock.
   */
  public playMetallicChainClink(intensity: number = 0.5): void {
    if (!this.ctx || !this.sfxBus) return;
    const spatial = this.getSpatialParams(0, 2.8, -22);

    // 2-3 fast metallic clinks simulating chain links striking
    const numLinks = 2 + Math.floor(Math.random() * 2);
    for (let i = 0; i < numLinks; i++) {
      setTimeout(() => {
        if (!this.ctx || !this.sfxBus) return;
        const now = this.ctx.currentTime;

        const osc = this.ctx.createOscillator();
        osc.type = 'triangle';
        const linkPitch = 1200 + i * 260 + (Math.random() * 120 - 60);
        osc.frequency.setValueAtTime(linkPitch, now);
        osc.frequency.exponentialRampToValueAtTime(linkPitch * 0.65, now + 0.12);

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1400, now);
        filter.Q.setValueAtTime(4.0, now);

        const gain = this.ctx.createGain();
        const linkVol = (0.018 + intensity * 0.022) * spatial.attenuation;
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.linearRampToValueAtTime(linkVol, now + 0.008);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);

        const panner = this.createPanner(spatial.pan);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(panner);
        panner.connect(this.sfxBus);

        osc.start(now);
        osc.stop(now + 0.20);
      }, i * (75 + Math.random() * 45));
    }
  }

  public playGateChainRattle(intensity: number = 0.5): void {
    this.playMetallicChainClink(intensity);
  }

  /**
   * FIRST SCARE SEQUENCE (Step 1): Quiet Metallic Chain Sound
   * Very slow, subtle sound of hanging iron chain links swaying and rubbing against iron bars.
   * Clean, quiet, and spatialized at the gate.
   */
  public playQuietChainShift(): void {
    if (!this.ctx || !this.sfxBus || !this.pinkNoiseBuffer) return;
    const now = this.ctx.currentTime;
    const spatial = this.getSpatialParams(0, 2.85, -22);

    // 1. Soft metallic friction/scrape (pink noise shaped by narrow resonant bandpass)
    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = this.pinkNoiseBuffer;

    const scrapeFilter = this.ctx.createBiquadFilter();
    scrapeFilter.type = 'bandpass';
    scrapeFilter.frequency.setValueAtTime(1450, now);
    scrapeFilter.Q.setValueAtTime(5.5, now);

    const scrapeGain = this.ctx.createGain();
    const peakScrape = 0.014 * spatial.attenuation;
    scrapeGain.gain.setValueAtTime(0.0001, now);
    scrapeGain.gain.linearRampToValueAtTime(peakScrape, now + 0.4);
    scrapeGain.gain.linearRampToValueAtTime(peakScrape * 0.35, now + 1.0);
    scrapeGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.9);

    const panner = this.createPanner(spatial.pan);

    noiseSource.connect(scrapeFilter);
    scrapeFilter.connect(scrapeGain);
    scrapeGain.connect(panner);
    panner.connect(this.sfxBus);

    noiseSource.start(now);
    noiseSource.stop(now + 2.0);

    // 2. Subtle iron link resonance clicks
    [0.25, 0.75, 1.25].forEach((delay, idx) => {
      setTimeout(() => {
        if (!this.ctx || !this.sfxBus) return;
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        osc.type = 'sine';
        const pitch = 880 + idx * 160 + (Math.random() * 40 - 20);
        osc.frequency.setValueAtTime(pitch, t);
        osc.frequency.exponentialRampToValueAtTime(pitch * 0.68, t + 0.12);

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1250, t);
        filter.Q.setValueAtTime(4.5, t);

        const linkGain = this.ctx.createGain();
        const linkVol = 0.010 * spatial.attenuation;
        linkGain.gain.setValueAtTime(0.0001, t);
        linkGain.gain.linearRampToValueAtTime(linkVol, t + 0.006);
        linkGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.14);

        const linkPanner = this.createPanner(spatial.pan);

        osc.connect(filter);
        filter.connect(linkGain);
        linkGain.connect(linkPanner);
        linkPanner.connect(this.sfxBus);

        osc.start(t);
        osc.stop(t + 0.16);
      }, delay * 1000);
    });
  }

  /**
   * FIRST SCARE SEQUENCE (Step 2): Subtle Padlock Shake Clink
   * A single, realistic, tiny metallic "clink" as the padlock shackle shifts against the body.
   */
  public playSubtlePadlockClink(): void {
    if (!this.ctx || !this.sfxBus) return;
    const now = this.ctx.currentTime;
    const spatial = this.getSpatialParams(0, 3.15, -22);

    const osc = this.ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(2280, now);
    osc.frequency.exponentialRampToValueAtTime(1380, now + 0.08);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1980, now);
    filter.Q.setValueAtTime(8.0, now);

    const gain = this.ctx.createGain();
    const clinkVol = 0.022 * spatial.attenuation;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(clinkVol, now + 0.003);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.11);

    const panner = this.createPanner(spatial.pan);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(panner);
    panner.connect(this.sfxBus);

    osc.start(now);
    osc.stop(now + 0.13);
  }

  /**
   * FIRST SCARE SEQUENCE (Step 3 & 5): Psychological Silence
   * Reduces environmental ambience down to very low, pauses heartbeat & random horror triggers,
   * keeping only faint wind/rain whisper.
   */
  public setPsychologicalSilence(enable: boolean, durationSec = 1.2): void {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    if (enable) {
      if (this.droneGain) {
        this.droneGain.gain.cancelScheduledValues(now);
        this.droneGain.gain.linearRampToValueAtTime(0.0001, now + durationSec);
      }
      if (this.windGain) {
        this.windGain.gain.cancelScheduledValues(now);
        this.windGain.gain.linearRampToValueAtTime(0.006, now + durationSec);
      }
      if (this.rainGain) {
        this.rainGain.gain.cancelScheduledValues(now);
        this.rainGain.gain.linearRampToValueAtTime(0.005, now + durationSec);
      }
      this.heartbeatTargetVol = 0;
    } else {
      // Smooth restoration to normal ambience over 3.5 seconds
      if (this.droneGain) {
        this.droneGain.gain.cancelScheduledValues(now);
        this.droneGain.gain.linearRampToValueAtTime(0.045, now + 3.5);
      }
      if (this.windGain) {
        this.windGain.gain.cancelScheduledValues(now);
        this.windGain.gain.linearRampToValueAtTime(0.045, now + 3.5);
      }
      if (this.rainGain) {
        this.rainGain.gain.cancelScheduledValues(now);
        this.rainGain.gain.linearRampToValueAtTime(0.022, now + 3.5);
      }
    }
  }

  /**
   * FIRST SCARE SEQUENCE (Step 6): Human-like Whisper Directly Behind Player
   * Positional 3D binaural whisper directly behind the player's neck.
   * Extremely subtle, clean, zero clipping, no scream. Gives the chilling feeling:
   * "someone is standing right behind me."
   */
  public playCloseWhisperBehind(): void {
    if (!this.ctx || !this.sfxBus || !this.pinkNoiseBuffer) return;
    const now = this.ctx.currentTime;
    const whisperDuration = 1.9;

    // Place sound origin directly behind the player (2.0m back) with slight natural ear bias
    const earBias = Math.random() > 0.5 ? -0.25 : 0.25;

    // Dual-ear binaural simulation placed directly behind listener
    [earBias - 0.15, earBias + 0.15].forEach((panVal, earIdx) => {
      if (!this.ctx || !this.sfxBus) return;
      const source = this.ctx.createBufferSource();
      source.buffer = this.pinkNoiseBuffer;

      // Vocal formant 1 (chest/throat resonance)
      const formant1 = this.ctx.createBiquadFilter();
      formant1.type = 'bandpass';
      formant1.frequency.setValueAtTime(650, now);
      formant1.Q.setValueAtTime(5.2, now);
      formant1.frequency.linearRampToValueAtTime(490, now + whisperDuration);

      // Vocal formant 2 (oral vowel shaping "...shhh... leave...")
      const formant2 = this.ctx.createBiquadFilter();
      formant2.type = 'bandpass';
      formant2.frequency.setValueAtTime(1520, now);
      formant2.Q.setValueAtTime(6.0, now);
      formant2.frequency.linearRampToValueAtTime(1320, now + whisperDuration);

      // Human head shadow attenuation from rear (lowpass 2400Hz)
      const rearFilter = this.ctx.createBiquadFilter();
      rearFilter.type = 'lowpass';
      rearFilter.frequency.setValueAtTime(2400, now);

      const gain = this.ctx.createGain();
      const earGain = 0.020; // Subtle, non-intrusive whisper loudness
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(earGain, now + 0.35);
      gain.gain.setValueAtTime(earGain * 0.85, now + 0.95);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + whisperDuration);

      const panner = this.createPanner(panVal);

      source.connect(formant1);
      formant1.connect(formant2);
      formant2.connect(rearFilter);
      rearFilter.connect(gain);
      gain.connect(panner);
      panner.connect(this.sfxBus);

      // Inter-aural time difference (0.35ms)
      const delay = earIdx === 0 ? 0 : 0.00035;
      source.start(now + delay);
      source.stop(now + whisperDuration + 0.1);
    });
  }


  /**
   * TREE BRANCH BREAKING (Outside player's direct view)
   */
  public playTreeBranchSnap(pan = Math.random() > 0.5 ? 0.75 : -0.75): void {
    if (!this.ctx || !this.sfxBus) return;
    const now = this.ctx.currentTime;

    // 1. Initial sharp woody fracture pop
    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(280, now);
    osc.frequency.exponentialRampToValueAtTime(70, now + 0.045);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(680, now);
    filter.Q.setValueAtTime(1.8, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.038, now + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);

    const panner = this.createPanner(pan);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(panner);
    panner.connect(this.sfxBus);

    osc.start(now);
    osc.stop(now + 0.07);

    // 2. Light following rustle of falling pine needles/leaves
    setTimeout(() => {
      this.playTreeBranchRustle(pan);
    }, 40);
  }

  /**
   * DISTANT METAL SOUND / IMPACT
   */
  public playDistantMetalClang(pan = Math.random() * 1.2 - 0.6): void {
    if (!this.ctx || !this.sfxBus) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(260, now);
    osc.frequency.exponentialRampToValueAtTime(195, now + 1.2);

    const oscHarmonic = this.ctx.createOscillator();
    oscHarmonic.type = 'triangle';
    oscHarmonic.frequency.setValueAtTime(540, now);
    oscHarmonic.frequency.exponentialRampToValueAtTime(390, now + 0.8);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(480, now);
    filter.Q.setValueAtTime(3.0, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.022, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.6);

    const panner = this.createPanner(pan);

    osc.connect(filter);
    oscHarmonic.connect(filter);
    filter.connect(gain);
    gain.connect(panner);
    panner.connect(this.sfxBus);

    osc.start(now);
    oscHarmonic.start(now);
    osc.stop(now + 1.7);
    oscHarmonic.stop(now + 1.7);
  }

  public playTreeBranchRustle(pan = 0): void {
    if (!this.ctx || !this.sfxBus || !this.pinkNoiseBuffer) return;
    const now = this.ctx.currentTime;

    const source = this.ctx.createBufferSource();
    source.buffer = this.pinkNoiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(420, now);
    filter.Q.setValueAtTime(1.5, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.024, now + 0.5);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.6);

    const panner = this.createPanner(pan);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(panner);
    panner.connect(this.sfxBus);

    source.start(now);
    source.stop(now + 1.7);
  }

  public playUnexplainedNoise(pan = 0): void {
    if (!this.ctx || !this.sfxBus) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(78, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 2.2);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(110, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.028, now + 0.7);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.3);

    const panner = this.createPanner(pan);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(panner);
    panner.connect(this.sfxBus);

    osc.start(now);
    osc.stop(now + 2.4);
  }

  public playDistantKnock(): void {
    if (!this.ctx || !this.sfxBus) return;
    const spatial = this.getSpatialParams(2, 3, -42);

    for (let k = 0; k < 3; k++) {
      setTimeout(() => {
        if (!this.ctx || !this.sfxBus) return;
        const now = this.ctx.currentTime;

        const osc = this.ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(120, now);
        osc.frequency.exponentialRampToValueAtTime(60, now + 0.07);

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(240, now);
        filter.Q.setValueAtTime(3.5, now);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.linearRampToValueAtTime(0.026 * spatial.attenuation, now + 0.012);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);

        const panner = this.createPanner(spatial.pan);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(panner);
        panner.connect(this.sfxBus);

        osc.start(now);
        osc.stop(now + 0.14);
      }, k * 280);
    }
  }

  public playHouseCreak(): void {
    if (!this.ctx || !this.sfxBus) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    osc.type = 'triangle';
    const startFreq = 135 + Math.random() * 25;
    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.linearRampToValueAtTime(startFreq - 12, now + 0.8);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(240, now);
    filter.Q.setValueAtTime(2.8, now);

    const panner = this.createPanner(Math.random() * 1.2 - 0.6);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.026, now + 0.16);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.9);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(panner);
    panner.connect(this.sfxBus);

    osc.start(now);
    osc.stop(now + 0.95);
  }

  public triggerRandomWindGust(): void {
    if (!this.ctx || !this.windFilter || !this.windGain) return;
    const now = this.ctx.currentTime;

    this.windFilter.frequency.setTargetAtTime(450, now, 1.2);
    this.windFilter.frequency.setTargetAtTime(320, now + 3.2, 1.8);

    this.windGain.gain.setTargetAtTime(0.075, now, 1.2);
    this.windGain.gain.setTargetAtTime(0.045, now + 3.2, 1.8);
  }

  /**
   * HAUNTED PASSAGE: Brittle old paper rustling when inspecting or brushing past a poster.
   */
  public playPaperRustle(): void {
    if (!this.ctx || !this.sfxBus) return;
    const now = this.ctx.currentTime;

    const bufferSize = this.ctx.sampleRate * 0.28;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.35));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1800, now);
    filter.Q.setValueAtTime(2.2, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.038, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxBus);

    noise.start(now);
  }

  /**
   * HAUNTED PASSAGE: Distant cold water drop echoing between claustrophobic stone walls.
   */
  public playWaterDrop(pan = Math.random() * 1.4 - 0.7): void {
    if (!this.ctx || !this.sfxBus) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    const dropFreq = 950 + Math.random() * 320;
    osc.frequency.setValueAtTime(dropFreq, now);
    osc.frequency.exponentialRampToValueAtTime(dropFreq + 450, now + 0.04);
    osc.frequency.exponentialRampToValueAtTime(dropFreq - 200, now + 0.12);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.024, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);

    const panner = this.createPanner(pan);

    osc.connect(gain);
    gain.connect(panner);
    panner.connect(this.sfxBus);

    osc.start(now);
    osc.stop(now + 0.15);
  }

  /**
   * HAUNTED PASSAGE: Low structural groan of aged stone and mortar shifting.
   */
  public playWallCreak(pan = 0): void {
    if (!this.ctx || !this.sfxBus) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(68 + Math.random() * 14, now);
    osc.frequency.linearRampToValueAtTime(54, now + 0.9);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(160, now);
    filter.Q.setValueAtTime(4.0, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.025, now + 0.2);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.95);

    const panner = this.createPanner(pan);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(panner);
    panner.connect(this.sfxBus);

    osc.start(now);
    osc.stop(now + 1.0);
  }

  /**
   * HAUNTED PASSAGE: Wind whistling down the narrow passage.
   */
  public playPassageWindGust(): void {
    if (!this.ctx || !this.windFilter || !this.windGain) return;
    const now = this.ctx.currentTime;

    this.windFilter.frequency.setTargetAtTime(580, now, 0.8);
    this.windFilter.frequency.setTargetAtTime(310, now + 2.5, 1.4);

    this.windGain.gain.setTargetAtTime(0.09, now, 0.8);
    this.windGain.gain.setTargetAtTime(0.04, now + 2.5, 1.4);
  }

  // =========================================================================
  // SILENCE / TENSION SYSTEM & RANDOM HORROR EVENTS
  // =========================================================================

  private startEventManager(): void {
    if (this.isEventManagerRunning) return;
    this.isEventManagerRunning = true;

    const scheduleNextEvent = () => {
      if (!this.isEventManagerRunning || !this.ctx) return;

      // Generous, unpredictable silent intervals (24 - 46 seconds gap)
      const delay = Math.random() * 22000 + 24000;

      this.eventTimeoutId = setTimeout(() => {
        if (!this.isEventManagerRunning || !this.ctx) return;

        if (this.currentMode === 'GAMEPLAY' && !this.isDucked) {
          this.triggerRandomHorrorEvent();
        }

        scheduleNextEvent();
      }, delay);
    };

    scheduleNextEvent();
  }

  private triggerRandomHorrorEvent(): void {
    const roll = Math.random();

    // Psychological silence tension
    if (roll < 0.14) {
      this.triggerSilenceBeforeScare();
      return;
    }

    if (roll < 0.24) {
      this.triggerRandomWindGust();
    } else if (roll < 0.34) {
      // Tree branch snap outside direct line of sight (pan left or right)
      this.playTreeBranchSnap(Math.random() > 0.5 ? 0.85 : -0.85);
    } else if (roll < 0.44) {
      // Faint metallic chain rattle from the gate
      this.playMetallicChainClink(0.4);
    } else if (roll < 0.54) {
      // Footstep slightly behind player
      const stepX = this.listenerPos.x + (Math.random() > 0.5 ? 2.5 : -2.5);
      const stepZ = this.listenerPos.z + 3.8;
      this.playSpatialFootstep(stepX, 0, stepZ, 0.022);
    } else if (roll < 0.64) {
      // Whisper specifically panned to left, right, or behind
      const dirRoll = Math.random();
      const dir = dirRoll < 0.35 ? 'LEFT' : dirRoll < 0.7 ? 'RIGHT' : 'BEHIND';
      this.playSubtleWhisper(dir);
    } else if (roll < 0.74) {
      // Occasional breathing sound from behind
      this.playFaintBreathing(0.05);
    } else if (roll < 0.82) {
      // Distant metal echo across grounds
      this.playDistantMetalClang(Math.random() * 1.4 - 0.7);
    } else if (roll < 0.90) {
      // Very distant knocking from bungalow
      this.playDistantKnock();
    } else if (roll < 0.96) {
      this.playGateCreak(0.35);
    } else {
      this.triggerLightningThunder();
    }
  }

  private triggerSilenceBeforeScare(): void {
    if (!this.ctx || !this.ambienceBus) return;
    const now = this.ctx.currentTime;

    this.ambienceBus.gain.setTargetAtTime(this.musicVolume * 0.20, now, 0.8);

    setTimeout(() => {
      if (!this.ctx || this.currentMode !== 'GAMEPLAY') return;

      const cueRoll = Math.random();
      if (cueRoll < 0.35) {
        this.playSubtleWhisper('BEHIND');
      } else if (cueRoll < 0.65) {
        this.playDistantKnock();
      } else {
        this.playGateCreak(0.3);
      }

      setTimeout(() => {
        if (!this.ctx || !this.ambienceBus) return;
        const restNow = this.ctx.currentTime;
        const targetVol = this.isDucked ? this.musicVolume * 0.35 : this.musicVolume;
        this.ambienceBus.gain.setTargetAtTime(targetVol, restNow, 1.2);
      }, 2000);
    }, 3000);
  }

  // =========================================================================
  // PLAYER FOOTSTEPS
  // =========================================================================

  /**
   * Determine ground surface material based on player or sound source 3D coordinates.
   * - WOOD: Bungalow veranda porch, timber boardwalk footbridge, and tree staging platform.
   * - STONE: Gate granite threshold, bungalow foundation steps, shrine plinth, and alcove.
   * - GRAVEL: Central estate driveway path (|x| <= 3.8).
   * - LEAVES: Forest underbrush and overgrown foliage off the main path (|x| > 3.8).
   */
  public getSurfaceTypeAtPosition(x: number, y: number, z: number): SurfaceType {
    // 1. WOOD SURFACES
    // A. Colonial Bungalow Veranda Porch (z in [-43.5, -37.0], |x| <= 18.0)
    if (z >= -43.5 && z <= -37.0 && Math.abs(x) <= 18.0) {
      return 'WOOD';
    }
    // B. Weathered Timber Footbridge across muddy ditch towards Garden Shrine (x in [-10.8, -5.8], z in [-15.8, -13.0])
    if (x >= -10.8 && x <= -5.8 && z >= -15.8 && z <= -13.0) {
      return 'WOOD';
    }
    // C. Timber Woodcutter Staging Planks near Dead Tree (x in [8.5, 12.0], z in [-15.2, -12.6])
    if (x >= 8.5 && x <= 12.0 && z >= -15.2 && z <= -12.6) {
      return 'WOOD';
    }

    // 2. STONE SURFACES
    // A. Main Gate Granite Threshold & Pillar Base (z in [-23.4, -20.8], |x| <= 4.2)
    if (z >= -23.4 && z <= -20.8 && Math.abs(x) <= 4.2) {
      return 'STONE';
    }
    // B. Bungalow Stone Foundation Plinth Steps (z in [-37.0, -32.8], |x| <= 5.0)
    if (z >= -37.0 && z <= -32.8 && Math.abs(x) <= 5.0) {
      return 'STONE';
    }
    // C. Broken Garden Shrine Stone Plinth & Slabs (x in [-14.8, -11.6], z in [-15.8, -12.6])
    if (x >= -14.8 && x <= -11.6 && z >= -15.8 && z <= -12.6) {
      return 'STONE';
    }
    // D. Hidden Alcove Stone Shelf & Granite Outcropping (x in [-8.0, -5.6], z in [-20.5, -17.8])
    if (x >= -8.0 && x <= -5.6 && z >= -20.5 && z <= -17.8) {
      return 'STONE';
    }

    // 3. GRAVEL (Central Driveway Path)
    // Main path width is 7.5m (|x| <= 3.8m)
    if (Math.abs(x) <= 3.8) {
      return 'GRAVEL';
    }

    // 4. LEAVES (Deep forest floor, dead autumn leaves, twigs, roots, and pine needles)
    return 'LEAVES';
  }

  public getCurrentSurface(): SurfaceType {
    return this.currentSurface;
  }

  public playFootstep(
    isDistant = false,
    isRunning = false,
    pan = 0,
    position?: { x: number; y: number; z: number },
    forcedSurface?: SurfaceType
  ): void {
    if (!this.ctx || !this.sfxBus) return;
    const now = this.ctx.currentTime;

    const minInterval = isRunning ? 0.12 : 0.15;
    if (now - this.lastFootstepTime < minInterval) return;
    this.lastFootstepTime = now;

    const pos = position || this.listenerPos;
    const surface: SurfaceType = forcedSurface || (pos ? this.getSurfaceTypeAtPosition(pos.x, pos.y, pos.z) : 'GRAVEL');
    this.currentSurface = surface;

    let buffers = this.gravelStepBuffers;
    if (surface === 'LEAVES' && this.leavesStepBuffers.length > 0) {
      buffers = this.leavesStepBuffers;
    } else if (surface === 'WOOD' && this.woodStepBuffers.length > 0) {
      buffers = this.woodStepBuffers;
    } else if (surface === 'STONE' && this.stoneStepBuffers.length > 0) {
      buffers = this.stoneStepBuffers;
    } else if (this.footstepBuffers.length > 0) {
      buffers = this.footstepBuffers;
    }

    if (buffers.length === 0) return;

    this.stepIndex = (this.stepIndex + 1) % buffers.length;
    const buffer = buffers[this.stepIndex];

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;

    // Rate modulation: Running increases cadence/pitch slightly, plus subtle random micro-pitch variation
    let baseRate = isRunning ? 1.06 : 0.98;
    if (surface === 'LEAVES') baseRate += 0.02;
    source.playbackRate.setValueAtTime(
      baseRate + (Math.random() * 0.06 - 0.03),
      now
    );

    // Surface-specific acoustic filtering and dynamics
    const filter = this.ctx.createBiquadFilter();
    let vol = 0.034;

    if (surface === 'LEAVES') {
      // Crisp autumn foliage crunch: allow crisp high-mids through, slight low cut
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(isDistant ? 1200 : (isRunning ? 4400 : 3800), now);
      filter.Q.setValueAtTime(0.8, now);
      vol = isDistant ? 0.016 : (isRunning ? 0.046 : 0.036);
    } else if (surface === 'WOOD') {
      // Resonant hollow timber floorboards: warm low-mid resonance
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(isDistant ? 420 : (isRunning ? 1600 : 1300), now);
      filter.Q.setValueAtTime(1.8, now); // boost wood cavity resonance
      vol = isDistant ? 0.018 : (isRunning ? 0.048 : 0.038);
    } else if (surface === 'STONE') {
      // Solid granite click: crisp transient with fast roll-off
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(isDistant ? 450 : (isRunning ? 2800 : 2400), now);
      filter.Q.setValueAtTime(0.7, now);
      vol = isDistant ? 0.014 : (isRunning ? 0.040 : 0.030);
    } else {
      // GRAVEL: Gritty loose stone grinding
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(isDistant ? 360 : (isRunning ? 2100 : 1700), now);
      filter.Q.setValueAtTime(1.0, now);
      vol = isDistant ? 0.015 : (isRunning ? 0.044 : 0.034);
    }

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(vol, now);

    // Alternating left/right foot stereo panning for true binaural walk feel
    const footPan = isDistant ? pan : (this.stepIndex % 2 === 0 ? -0.07 : 0.07);
    const panner = this.createPanner(footPan);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(panner);
    panner.connect(this.sfxBus);

    source.start(now);
  }

  public playFootstepAtPosition(
    x: number,
    y: number,
    z: number,
    isRunning = false,
    isDistant = false,
    pan = 0
  ): void {
    this.playFootstep(isDistant, isRunning, pan, { x, y, z });
  }

  public playGateProximityTension(distanceNormalized: number): void {
    this.updateGateProximity(distanceNormalized * 30);
  }

  // =========================================================================
  // SCENE & MENU MANAGEMENT
  // =========================================================================

  public setMode(mode: AudioMode): void {
    this.currentMode = mode;
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    if (mode === 'MENU') {
      this.heartbeatTargetVol = 0;
      if (this.droneGain) this.droneGain.gain.setTargetAtTime(0.028, now, 0.6);
      if (this.windGain) this.windGain.gain.setTargetAtTime(0.038, now, 0.6);
      if (this.rainGain) this.rainGain.gain.setTargetAtTime(0.001, now, 0.8);
    } else if (mode === 'GAMEPLAY') {
      if (this.droneGain) this.droneGain.gain.setTargetAtTime(0.024, now, 0.8);
      if (this.windGain) this.windGain.gain.setTargetAtTime(0.045, now, 0.8);
      if (this.rainGain) this.rainGain.gain.setTargetAtTime(0.022, now, 1.0);
    } else if (mode === 'INSPECTING') {
      this.heartbeatTargetVol = 0.040;
      this.heartbeatBpm = 76;
      if (this.droneGain) this.droneGain.gain.setTargetAtTime(0.036, now, 0.5);
      if (this.windGain) this.windGain.gain.setTargetAtTime(0.055, now, 0.5);
      if (this.rainGain) this.rainGain.gain.setTargetAtTime(0.018, now, 0.5);
    }
  }

  public setDuckAmbience(ducked: boolean): void {
    this.isDucked = ducked;
    if (!this.ctx || !this.ambienceBus) return;
    const now = this.ctx.currentTime;

    const targetGain = ducked
      ? this.musicVolume * 0.35
      : this.musicVolume;

    this.ambienceBus.gain.setTargetAtTime(targetGain, now, 0.35);
  }

  public setVolumes(master: number, music: number, sfx: number): void {
    this.masterVolume = master;
    this.musicVolume = music;
    this.sfxVolume = sfx;

    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    if (this.masterGain) {
      this.masterGain.gain.setTargetAtTime(master, now, 0.05);
    }
    if (this.ambienceBus) {
      const amb = this.isDucked ? music * 0.35 : music;
      this.ambienceBus.gain.setTargetAtTime(amb, now, 0.05);
    }
    if (this.sfxBus) {
      this.sfxBus.gain.setTargetAtTime(sfx, now, 0.05);
    }
  }

  // =========================================================================
  // STORY MODE CINEMATIC SOUNDTRACK & FX ENGINE
  // =========================================================================

  public fadeAmbienceForStoryMode(duration = 1.8): void {
    if (!this.ctx || !this.ambienceBus) return;
    const now = this.ctx.currentTime;
    this.heartbeatTargetVol = 0;
    this.ambienceBus.gain.cancelScheduledValues(now);
    this.ambienceBus.gain.setValueAtTime(this.ambienceBus.gain.value, now);
    this.ambienceBus.gain.linearRampToValueAtTime(0.001, now + duration);
  }

  public restoreAmbienceAfterStoryMode(duration = 2.0): void {
    if (!this.ctx || !this.ambienceBus) return;
    const now = this.ctx.currentTime;
    this.stopStoryModeScore();
    this.ambienceBus.gain.cancelScheduledValues(now);
    this.ambienceBus.gain.setValueAtTime(this.ambienceBus.gain.value, now);
    this.ambienceBus.gain.linearRampToValueAtTime(this.musicVolume, now + duration);
  }

  public stopStoryModeScore(): void {
    if (this.storyIntervalId) {
      clearInterval(this.storyIntervalId);
      this.storyIntervalId = null;
    }
    const now = this.ctx ? this.ctx.currentTime : 0;
    for (const gain of this.storyActiveGains) {
      try {
        if (this.ctx) {
          gain.gain.cancelScheduledValues(now);
          gain.gain.setValueAtTime(gain.gain.value, now);
          gain.gain.linearRampToValueAtTime(0.0001, now + 0.35);
        }
      } catch (_) {}
    }
    const oscsToStop = [...this.storyActiveOscs];
    setTimeout(() => {
      for (const osc of oscsToStop) {
        try { osc.stop(); osc.disconnect(); } catch (_) {}
      }
    }, 400);

    this.storyActiveOscs = [];
    this.storyActiveGains = [];
  }

  public playStoryModeScore(theme: 'INTRO' | 'CHILDHOOD' | 'RESPONSIBILITY' | 'COLLEGE' | 'TRUTH_OR_DARE' | 'RULES' | 'APPROACH' | 'DISAPPEAR' | 'SEARCH' | 'RESOLVE' | 'STOP'): void {
    if (!this.ctx || !this.storyScoreBus) return;
    this.stopStoryModeScore();
    if (theme === 'STOP') return;

    const now = this.ctx.currentTime;

    if (theme === 'INTRO') {
      // Somber cello / low bass drone (C# minor: 34.6Hz, 69.3Hz, 138.6Hz)
      const freqs = [34.6, 69.3, 103.8, 138.6];
      freqs.forEach((f, idx) => {
        if (!this.ctx || !this.storyScoreBus) return;
        const osc = this.ctx.createOscillator();
        osc.type = idx === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(f, now);

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(260 + idx * 80, now);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.linearRampToValueAtTime(0.045 / (idx + 1), now + 1.8);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.storyScoreBus);

        osc.start(now);
        this.storyActiveOscs.push(osc);
        this.storyActiveGains.push(gain);
      });
    } else if (theme === 'CHILDHOOD') {
      // Warm, emotional nostalgic progression (C major / Am / F warm music-box chords)
      const chordNotes = [
        [261.6, 329.6, 392.0, 523.2], // C maj
        [220.0, 261.6, 329.6, 440.0], // A min
        [174.6, 261.6, 349.2, 440.0], // F maj
        [196.0, 246.9, 293.6, 392.0], // G maj
      ];
      let chordIdx = 0;

      // Warm background drone
      const drone = this.ctx.createOscillator();
      drone.type = 'sine';
      drone.frequency.setValueAtTime(130.8, now); // C3
      const droneFilter = this.ctx.createBiquadFilter();
      droneFilter.type = 'lowpass';
      droneFilter.frequency.setValueAtTime(320, now);
      const droneGain = this.ctx.createGain();
      droneGain.gain.setValueAtTime(0.0001, now);
      droneGain.gain.linearRampToValueAtTime(0.04, now + 1.2);
      drone.connect(droneFilter);
      droneFilter.connect(droneGain);
      droneGain.connect(this.storyScoreBus);
      drone.start(now);
      this.storyActiveOscs.push(drone);
      this.storyActiveGains.push(droneGain);

      // Play nostalgic bell notes in warm arpeggio
      const playChords = () => {
        if (!this.ctx || !this.storyScoreBus) return;
        const currentChord = chordNotes[chordIdx % chordNotes.length];
        chordIdx++;

        currentChord.forEach((noteFreq, nIdx) => {
          if (!this.ctx || !this.storyScoreBus) return;
          const noteTime = this.ctx.currentTime + nIdx * 0.45;
          const osc = this.ctx.createOscillator();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(noteFreq, noteTime);

          const gain = this.ctx.createGain();
          gain.gain.setValueAtTime(0.0001, noteTime);
          gain.gain.linearRampToValueAtTime(0.035, noteTime + 0.08);
          gain.gain.exponentialRampToValueAtTime(0.0001, noteTime + 2.2);

          osc.connect(gain);
          gain.connect(this.storyScoreBus);
          osc.start(noteTime);
          osc.stop(noteTime + 2.4);
        });
      };

      playChords();
      this.storyIntervalId = setInterval(playChords, 2400);
    } else if (theme === 'RESPONSIBILITY') {
      // Determined, slightly melancholic acoustic guitar/harp plucks
      const baseNotes = [146.8, 164.8, 174.6, 220.0]; // D, E, F, A
      let rIdx = 0;

      const playRespNotes = () => {
        if (!this.ctx || !this.storyScoreBus) return;
        const freq = baseNotes[rIdx % baseNotes.length];
        rIdx++;

        const osc = this.ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(540, this.ctx.currentTime);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.0001, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.04, this.ctx.currentTime + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 1.8);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.storyScoreBus);

        osc.start(this.ctx.currentTime);
        osc.stop(this.ctx.currentTime + 1.9);
      };

      playRespNotes();
      this.storyIntervalId = setInterval(playRespNotes, 1500);
    } else if (theme === 'COLLEGE') {
      // Bright, peaceful daylight college vibe (warm G major chord, airy breeze)
      const cFreqs = [196.0, 246.9, 293.6, 392.0, 493.8];
      cFreqs.forEach((f, idx) => {
        if (!this.ctx || !this.storyScoreBus) return;
        const osc = this.ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, now);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.linearRampToValueAtTime(0.025, now + 1.0);

        osc.connect(gain);
        gain.connect(this.storyScoreBus);
        osc.start(now);
        this.storyActiveOscs.push(osc);
        this.storyActiveGains.push(gain);
      });
    } else if (theme === 'TRUTH_OR_DARE') {
      // Suspense pad with subtle tension pulse
      const osc1 = this.ctx.createOscillator();
      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(110.0, now); // A2

      const osc2 = this.ctx.createOscillator();
      osc2.type = 'sawtooth';
      osc2.frequency.setValueAtTime(155.56, now); // D#3 (Tritone)

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(240, now);
      filter.Q.setValueAtTime(3.0, now);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(0.035, now + 1.2);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(gain);
      gain.connect(this.storyScoreBus);

      osc1.start(now);
      osc2.start(now);
      this.storyActiveOscs.push(osc1, osc2);
      this.storyActiveGains.push(gain);
    } else if (theme === 'APPROACH') {
      // Dark atmospheric drone, low wind, eerie resonance
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(43.65, now); // F0
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(0.06, now + 1.5);
      osc.connect(gain);
      gain.connect(this.storyScoreBus);
      osc.start(now);
      this.storyActiveOscs.push(osc);
      this.storyActiveGains.push(gain);
    } else if (theme === 'DISAPPEAR') {
      // Complete chilling vacuum / silence
      // Stop all sound immediately
      this.stopStoryModeScore();
    } else if (theme === 'SEARCH') {
      // Ticking pulse / urgent emotional dissonance
      const osc = this.ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(82.4, now); // E2
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(0.045, now + 0.8);
      osc.connect(gain);
      gain.connect(this.storyScoreBus);
      osc.start(now);
      this.storyActiveOscs.push(osc);
      this.storyActiveGains.push(gain);

      this.storyIntervalId = setInterval(() => {
        this.playClockTickAudio();
      }, 700);
    } else if (theme === 'RESOLVE') {
      // Swelling emotional dark brass/string swell
      const rFreqs = [55.0, 110.0, 164.8, 220.0, 277.18];
      rFreqs.forEach((f, idx) => {
        if (!this.ctx || !this.storyScoreBus) return;
        const osc = this.ctx.createOscillator();
        osc.type = idx < 2 ? 'sawtooth' : 'triangle';
        osc.frequency.setValueAtTime(f, now);

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(180, now);
        filter.frequency.linearRampToValueAtTime(450, now + 4.0);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.linearRampToValueAtTime(0.04, now + 3.0);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.storyScoreBus);
        osc.start(now);
        this.storyActiveOscs.push(osc);
        this.storyActiveGains.push(gain);
      });
    }
  }

  public playBottleSpinAudio(): void {
    if (!this.ctx || !this.sfxBus) return;
    const now = this.ctx.currentTime;

    // Rapid friction clicks on wood that decelerate
    const clickCount = 18;
    for (let i = 0; i < clickCount; i++) {
      const delay = Math.pow(i / clickCount, 1.8) * 2.2;
      const t = now + delay;

      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1400 - i * 40, t);
      osc.frequency.exponentialRampToValueAtTime(320, t + 0.02);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.linearRampToValueAtTime(0.025 * (1 - i / clickCount * 0.5), t + 0.003);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.025);

      osc.connect(gain);
      gain.connect(this.sfxBus);
      osc.start(t);
      osc.stop(t + 0.03);
    }
  }

  public playStoryRuleHit(ruleIndex = 0): void {
    if (!this.ctx || !this.sfxBus) return;
    const now = this.ctx.currentTime;

    // Deep sub-impact + metallic resonance
    const subOsc = this.ctx.createOscillator();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(65, now);
    subOsc.frequency.exponentialRampToValueAtTime(26, now + 0.8);

    const subGain = this.ctx.createGain();
    subGain.gain.setValueAtTime(0.0001, now);
    subGain.gain.linearRampToValueAtTime(0.12, now + 0.015);
    subGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);

    subOsc.connect(subGain);
    subGain.connect(this.sfxBus);
    subOsc.start(now);
    subOsc.stop(now + 1.25);

    // Resonant iron chime
    const ironOsc = this.ctx.createOscillator();
    ironOsc.type = 'triangle';
    ironOsc.frequency.setValueAtTime(340 + ruleIndex * 35, now);

    const ironFilter = this.ctx.createBiquadFilter();
    ironFilter.type = 'bandpass';
    ironFilter.frequency.setValueAtTime(340 + ruleIndex * 35, now);
    ironFilter.Q.setValueAtTime(6.0, now);

    const ironGain = this.ctx.createGain();
    ironGain.gain.setValueAtTime(0.0001, now);
    ironGain.gain.linearRampToValueAtTime(0.05, now + 0.01);
    ironGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.8);

    ironOsc.connect(ironFilter);
    ironFilter.connect(ironGain);
    ironGain.connect(this.sfxBus);
    ironOsc.start(now);
    ironOsc.stop(now + 1.85);
  }

  public playStoryHorrorSting(): void {
    if (!this.ctx || !this.sfxBus) return;
    const now = this.ctx.currentTime;

    // Sub-bass dread hit
    const sub = this.ctx.createOscillator();
    sub.type = 'sawtooth';
    sub.frequency.setValueAtTime(55, now);
    sub.frequency.exponentialRampToValueAtTime(24, now + 1.6);

    const subFilter = this.ctx.createBiquadFilter();
    subFilter.type = 'lowpass';
    subFilter.frequency.setValueAtTime(140, now);

    const subGain = this.ctx.createGain();
    subGain.gain.setValueAtTime(0.0001, now);
    subGain.gain.linearRampToValueAtTime(0.14, now + 0.03);
    subGain.gain.exponentialRampToValueAtTime(0.0001, now + 2.4);

    sub.connect(subFilter);
    subFilter.connect(subGain);
    subGain.connect(this.sfxBus);
    sub.start(now);
    sub.stop(now + 2.5);

    // Eerie discordant sting
    [587.33, 622.25, 830.61].forEach((f) => {
      if (!this.ctx || !this.sfxBus) return;
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(0.03, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.0);

      osc.connect(gain);
      gain.connect(this.sfxBus);
      osc.start(now);
      osc.stop(now + 2.1);
    });
  }

  public playClockTickAudio(): void {
    if (!this.ctx || !this.sfxBus) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1800, now);
    osc.frequency.exponentialRampToValueAtTime(450, now + 0.012);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.025, now + 0.002);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.015);

    osc.connect(gain);
    gain.connect(this.sfxBus);
    osc.start(now);
    osc.stop(now + 0.02);
  }

  public playCinematicTransition(): void {
    if (!this.ctx || !this.uiBus) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(60, now);
    osc.frequency.exponentialRampToValueAtTime(28, now + 1.2);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.12, now + 0.06);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.3);

    osc.connect(gain);
    gain.connect(this.uiBus);

    osc.start(now);
    osc.stop(now + 1.35);
  }

  public playMenuHover(): void {
    if (!this.ctx || !this.uiBus) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(240, now);
    osc.frequency.exponentialRampToValueAtTime(170, now + 0.04);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.020, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);

    osc.connect(gain);
    gain.connect(this.uiBus);

    osc.start(now);
    osc.stop(now + 0.06);
  }

  public playMenuSelect(): void {
    if (!this.ctx || !this.uiBus) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(130, now);
    osc.frequency.exponentialRampToValueAtTime(65, now + 0.25);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.060, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);

    osc.connect(gain);
    gain.connect(this.uiBus);

    osc.start(now);
    osc.stop(now + 0.30);
  }

  /**
   * LAMP 1: Very distant old bell sound tolling in the foggy hills.
   * Somber, resonant vintage church bell with authentic harmonic overtones and 4+ second acoustic decay.
   */
  public playDistantOldBell(): void {
    if (!this.ctx || !this.sfxBus) return;
    const now = this.ctx.currentTime;

    // Harmonic bell partials: fundamental + striking overtone cluster
    const partials = [
      { freq: 185, gain: 0.045, decay: 4.8 }, // fundamental drone
      { freq: 370, gain: 0.038, decay: 3.6 }, // octave
      { freq: 555, gain: 0.022, decay: 2.8 }, // tierce
      { freq: 835, gain: 0.015, decay: 1.9 }, // quint
      { freq: 1110, gain: 0.008, decay: 1.2 }, // strike tone
    ];

    const bellMaster = this.ctx.createGain();
    bellMaster.gain.setValueAtTime(0.0001, now);
    bellMaster.gain.linearRampToValueAtTime(1.0, now + 0.02);
    bellMaster.gain.exponentialRampToValueAtTime(0.0001, now + 5.0);

    // Muffled distance low-pass filter (sounds distant through forest fog)
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(820, now);
    filter.Q.setValueAtTime(1.5, now);

    // Echoing slightly from the misty hills to the left
    const panner = this.createPanner(-0.35);

    partials.forEach(({ freq, gain, decay }) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      const partGain = this.ctx.createGain();
      partGain.gain.setValueAtTime(0.0001, now);
      partGain.gain.linearRampToValueAtTime(gain, now + 0.015);
      partGain.gain.exponentialRampToValueAtTime(0.00001, now + decay);

      osc.connect(partGain);
      partGain.connect(bellMaster);

      osc.start(now);
      osc.stop(now + decay + 0.1);
    });

    bellMaster.connect(filter);
    filter.connect(panner);
    panner.connect(this.sfxBus);
  }

  /**
   * LAMP 2: Faint wooden creak from the distant bungalow window.
   * Spatialized at the mansion (z = -56), muffled and subtle.
   */
  public playBungalowWindowCreak(): void {
    if (!this.ctx || !this.sfxBus) return;
    const now = this.ctx.currentTime;
    const spatial = this.getSpatialParams(0, 4.2, -56);

    // Wooden window shutter stress
    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.linearRampToValueAtTime(125, now + 0.65);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(260, now);
    filter.Q.setValueAtTime(3.5, now);

    const gain = this.ctx.createGain();
    const vol = 0.018 * spatial.attenuation;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(vol, now + 0.12);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.7);

    const panner = this.createPanner(spatial.pan);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(panner);
    panner.connect(this.sfxBus);

    osc.start(now);
    osc.stop(now + 0.75);
  }

  /**
   * LAMP IGNITION: Soft match/flint strike and warm flame ignition whoosh.
   */
  public playLampIgnition(pan = 0): void {
    if (!this.ctx || !this.sfxBus) return;
    const now = this.ctx.currentTime;

    // 1. Flint friction / match scrape
    if (this.pinkNoiseBuffer) {
      const noise = this.ctx.createBufferSource();
      noise.buffer = this.pinkNoiseBuffer;

      const nFilter = this.ctx.createBiquadFilter();
      nFilter.type = 'bandpass';
      nFilter.frequency.setValueAtTime(3200, now);
      nFilter.Q.setValueAtTime(2.2, now);

      const nGain = this.ctx.createGain();
      nGain.gain.setValueAtTime(0.0001, now);
      nGain.gain.linearRampToValueAtTime(0.022, now + 0.02);
      nGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);

      const panner = this.createPanner(pan);

      noise.connect(nFilter);
      nFilter.connect(nGain);
      nGain.connect(panner);
      panner.connect(this.sfxBus);

      noise.start(now);
      noise.stop(now + 0.1);
    }

    // 2. Warm oil flame whoosh & ignition
    const osc = this.ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(210, now + 0.04);
    osc.frequency.exponentialRampToValueAtTime(85, now + 0.38);

    const oscFilter = this.ctx.createBiquadFilter();
    oscFilter.type = 'lowpass';
    oscFilter.frequency.setValueAtTime(340, now);

    const oscGain = this.ctx.createGain();
    oscGain.gain.setValueAtTime(0.0001, now + 0.04);
    oscGain.gain.linearRampToValueAtTime(0.025, now + 0.08);
    oscGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.42);

    const oscPanner = this.createPanner(pan);

    osc.connect(oscFilter);
    oscFilter.connect(oscGain);
    oscGain.connect(oscPanner);
    oscPanner.connect(this.sfxBus);

    osc.start(now + 0.04);
    osc.stop(now + 0.45);
  }

  /**
   * RITUAL COMPLETE: Gate padlock jolt & subtle metallic lock reaction.
   */
  public playRitualGateReaction(): void {
    if (!this.ctx || !this.sfxBus) return;
    const now = this.ctx.currentTime;
    const spatial = this.getSpatialParams(0, 3.15, -22);

    // Deep metallic thunk
    const osc = this.ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(340, now);
    osc.frequency.exponentialRampToValueAtTime(95, now + 0.22);

    const gain = this.ctx.createGain();
    const vol = 0.035 * spatial.attenuation;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(vol, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);

    const panner = this.createPanner(spatial.pan);

    osc.connect(gain);
    gain.connect(panner);
    panner.connect(this.sfxBus);

    osc.start(now);
    osc.stop(now + 0.32);

    // Followed 80ms later by delicate padlock clink
    setTimeout(() => {
      this.playSubtlePadlockClink();
    }, 90);
  }

  /**
   * KEY PICKUP: Heavy cold antique iron key clinking into investigator pocket.
   */
  public playKeyPickup(): void {
    if (!this.ctx || !this.sfxBus) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(2600, now);
    osc.frequency.exponentialRampToValueAtTime(1450, now + 0.15);

    const osc2 = this.ctx.createOscillator();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(3250, now);
    osc2.frequency.exponentialRampToValueAtTime(1800, now + 0.12);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.028, now + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);

    osc.connect(gain);
    osc2.connect(gain);
    gain.connect(this.sfxBus);

    osc.start(now);
    osc2.start(now);
    osc.stop(now + 0.25);
    osc2.stop(now + 0.25);
  }

  /**
   * GATE UNLOCK & OPEN: Padlock snaps open, heavy iron chain drops, and massive gothic iron gate hinges creak wide.
   */
  public playGateUnlockAndOpen(): void {
    if (!this.ctx || !this.sfxBus) return;
    const now = this.ctx.currentTime;
    const spatial = this.getSpatialParams(0, 3.5, -22);

    // 1. Padlock release snap
    const snapOsc = this.ctx.createOscillator();
    snapOsc.type = 'sawtooth';
    snapOsc.frequency.setValueAtTime(780, now);
    snapOsc.frequency.exponentialRampToValueAtTime(180, now + 0.12);

    const snapFilter = this.ctx.createBiquadFilter();
    snapFilter.type = 'bandpass';
    snapFilter.frequency.setValueAtTime(450, now);
    snapFilter.Q.setValueAtTime(2.5, now);

    const snapGain = this.ctx.createGain();
    snapGain.gain.setValueAtTime(0.0001, now);
    snapGain.gain.linearRampToValueAtTime(0.045 * spatial.attenuation, now + 0.008);
    snapGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);

    const panner = this.createPanner(spatial.pan);

    snapOsc.connect(snapFilter);
    snapFilter.connect(snapGain);
    snapGain.connect(panner);
    panner.connect(this.sfxBus);

    snapOsc.start(now);
    snapOsc.stop(now + 0.2);

    // 2. Chain links falling
    setTimeout(() => {
      this.playMetallicChainClink(0.7);
    }, 140);

    // 3. Deep prolonged gothic gate hinge screech
    setTimeout(() => {
      this.playGateCreak(1.0);
    }, 450);

    setTimeout(() => {
      this.playGateCreak(0.8);
    }, 1400);
  }

  /**
   * POST-STORY JUMP SCARE HORROR IMPACT:
   * Terrifying, jarring cinematic horror sting with powerful low-end sub impact,
   * dissonant screech harmonics, and dark reverberant tail.
   * Completely clean Web Audio synthesis — zero clipping, zero speaker damage.
   */
  public playPostStoryJumpScare(): void {
    if (!this.ctx || !this.sfxBus) return;
    const now = this.ctx.currentTime;

    // 1. Visceral sub-bass chest thump (rapid pitch drop 78Hz -> 28Hz)
    const sub = this.ctx.createOscillator();
    sub.type = 'sawtooth';
    sub.frequency.setValueAtTime(82, now);
    sub.frequency.exponentialRampToValueAtTime(28, now + 0.9);

    const subFilter = this.ctx.createBiquadFilter();
    subFilter.type = 'lowpass';
    subFilter.frequency.setValueAtTime(160, now);

    const subGain = this.ctx.createGain();
    subGain.gain.setValueAtTime(0.0001, now);
    subGain.gain.linearRampToValueAtTime(0.18, now + 0.015);
    subGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.4);

    sub.connect(subFilter);
    subFilter.connect(subGain);
    subGain.connect(this.sfxBus);
    sub.start(now);
    sub.stop(now + 1.45);

    // 2. High-pitch screeching dissonant string cluster (diminished / tritone clash)
    const pitches = [466.16, 493.88, 659.25, 698.46, 932.33]; // Bb4, B4, E5, F5, Bb5
    pitches.forEach((freq, idx) => {
      if (!this.ctx || !this.sfxBus) return;
      const osc = this.ctx.createOscillator();
      osc.type = idx % 2 === 0 ? 'sawtooth' : 'triangle';
      osc.frequency.setValueAtTime(freq, now);
      // Slight pitch bend upwards into terror
      osc.frequency.linearRampToValueAtTime(freq * 1.05, now + 0.35);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.92, now + 1.1);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(freq, now);
      filter.Q.setValueAtTime(4.0, now);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(0.038, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);

      const pan = (idx / (pitches.length - 1)) * 1.6 - 0.8;
      const panner = this.createPanner(pan);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(panner);
      panner.connect(this.sfxBus);

      osc.start(now);
      osc.stop(now + 1.25);
    });

    // 3. Shivering breath/wind rush
    if (this.pinkNoiseBuffer) {
      const noise = this.ctx.createBufferSource();
      noise.buffer = this.pinkNoiseBuffer;

      const nFilter = this.ctx.createBiquadFilter();
      nFilter.type = 'bandpass';
      nFilter.frequency.setValueAtTime(950, now);
      nFilter.Q.setValueAtTime(1.8, now);
      nFilter.frequency.exponentialRampToValueAtTime(2800, now + 0.4);

      const nGain = this.ctx.createGain();
      nGain.gain.setValueAtTime(0.0001, now);
      nGain.gain.linearRampToValueAtTime(0.045, now + 0.02);
      nGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.85);

      noise.connect(nFilter);
      nFilter.connect(nGain);
      nGain.connect(this.sfxBus);

      noise.start(now);
      noise.stop(now + 0.9);
    }
  }

  /**
   * SPATIALIZED YAMINI WHISPER:
   * Eerie, human vocal whisper softly calling "Yamini..." from slightly behind / side of the player.
   * Uses vocal tract formants:
   * "Ya..." (F1 ~750Hz, F2 ~1350Hz) -> "...mi..." (F1 ~320Hz, F2 ~2200Hz) -> "...ni..." (F1 ~300Hz, F2 ~2400Hz).
   */
  public playYaminiWhisper(direction: 'LEFT' | 'RIGHT' | 'BEHIND' = 'BEHIND'): void {
    if (!this.ctx || !this.sfxBus || !this.pinkNoiseBuffer) return;
    const now = this.ctx.currentTime;
    const whisperDuration = 2.4;

    const pan = direction === 'LEFT' ? -0.7 : direction === 'RIGHT' ? 0.7 : (Math.random() > 0.5 ? -0.22 : 0.22);

    // Dual-stage formant vocal filter
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.pinkNoiseBuffer;

    // Formant 1: Vowel opening (Ya -> mi -> ni)
    const f1 = this.ctx.createBiquadFilter();
    f1.type = 'bandpass';
    f1.frequency.setValueAtTime(720, now);
    f1.frequency.exponentialRampToValueAtTime(340, now + 0.9);
    f1.frequency.linearRampToValueAtTime(290, now + whisperDuration);
    f1.Q.setValueAtTime(5.8, now);

    // Formant 2: High vocal resonance
    const f2 = this.ctx.createBiquadFilter();
    f2.type = 'bandpass';
    f2.frequency.setValueAtTime(1380, now);
    f2.frequency.linearRampToValueAtTime(2150, now + 0.9);
    f2.frequency.linearRampToValueAtTime(2350, now + whisperDuration);
    f2.Q.setValueAtTime(6.5, now);

    // Head shadow filter
    const shadowFilter = this.ctx.createBiquadFilter();
    shadowFilter.type = 'lowpass';
    shadowFilter.frequency.setValueAtTime(2600, now);

    const gain = this.ctx.createGain();
    const whisperVol = 0.024; // Subtle, eerie, intimate
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(whisperVol, now + 0.3);
    gain.gain.setValueAtTime(whisperVol * 0.9, now + 1.2);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + whisperDuration);

    const panner = this.createPanner(pan);

    noise.connect(f1);
    f1.connect(f2);
    f2.connect(shadowFilter);
    shadowFilter.connect(gain);
    gain.connect(panner);
    panner.connect(this.sfxBus);

    noise.start(now);
    noise.stop(now + whisperDuration + 0.1);
  }

  /**
   * Direct control over heartbeat rate and volume for tense horror sequences.
   */
  public setHeartbeatDirect(volume: number, bpm: number = 72): void {
    this.heartbeatTargetVol = Math.max(0, Math.min(0.08, volume));
    this.heartbeatBpm = Math.max(45, Math.min(130, bpm));
  }

  /**
   * HAMMER IMPACT 1: Heavy wooden impact with metal vibration, short hollow echo and wood crack.
   * Clean cinematic audio without speaker crackle or clipping.
   */
  public playHammerHit1(): void {
    if (!this.ctx || !this.sfxBus) return;
    const now = this.ctx.currentTime;

    // 1. Heavy low wooden body thud
    const subOsc = this.ctx.createOscillator();
    subOsc.type = 'triangle';
    subOsc.frequency.setValueAtTime(140, now);
    subOsc.frequency.exponentialRampToValueAtTime(45, now + 0.22);

    const subGain = this.ctx.createGain();
    subGain.gain.setValueAtTime(0.0001, now);
    subGain.gain.linearRampToValueAtTime(0.08, now + 0.006);
    subGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.32);

    subOsc.connect(subGain);
    subGain.connect(this.sfxBus);
    subOsc.start(now);
    subOsc.stop(now + 0.35);

    // 2. Iron hammer head clank / metal ring vibration
    const metalOsc = this.ctx.createOscillator();
    metalOsc.type = 'sine';
    metalOsc.frequency.setValueAtTime(820, now);
    metalOsc.frequency.exponentialRampToValueAtTime(640, now + 0.45);

    const metalFilter = this.ctx.createBiquadFilter();
    metalFilter.type = 'bandpass';
    metalFilter.frequency.setValueAtTime(780, now);
    metalFilter.Q.setValueAtTime(8.0, now);

    const metalGain = this.ctx.createGain();
    metalGain.gain.setValueAtTime(0.0001, now);
    metalGain.gain.linearRampToValueAtTime(0.045, now + 0.005);
    metalGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.48);

    metalOsc.connect(metalFilter);
    metalFilter.connect(metalGain);
    metalGain.connect(this.sfxBus);
    metalOsc.start(now);
    metalOsc.stop(now + 0.5);

    // 3. Wood fracture crunch noise
    if (this.pinkNoiseBuffer) {
      const crunch = this.ctx.createBufferSource();
      crunch.buffer = this.pinkNoiseBuffer;

      const cFilter = this.ctx.createBiquadFilter();
      cFilter.type = 'bandpass';
      cFilter.frequency.setValueAtTime(1200, now);
      cFilter.Q.setValueAtTime(3.5, now);

      const cGain = this.ctx.createGain();
      cGain.gain.setValueAtTime(0.0001, now);
      cGain.gain.linearRampToValueAtTime(0.04, now + 0.004);
      cGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);

      crunch.connect(cFilter);
      cFilter.connect(cGain);
      cGain.connect(this.sfxBus);
      crunch.start(now);
      crunch.stop(now + 0.2);
    }
  }

  /**
   * HAMMER IMPACT 2: Stronger wood impact, metal creak, low-frequency impact, longer echo.
   */
  public playHammerHit2(): void {
    if (!this.ctx || !this.sfxBus) return;
    const now = this.ctx.currentTime;

    // 1. Deeper, louder impact thud
    const subOsc = this.ctx.createOscillator();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(120, now);
    subOsc.frequency.exponentialRampToValueAtTime(38, now + 0.3);

    const subGain = this.ctx.createGain();
    subGain.gain.setValueAtTime(0.0001, now);
    subGain.gain.linearRampToValueAtTime(0.11, now + 0.005);
    subGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.42);

    subOsc.connect(subGain);
    subGain.connect(this.sfxBus);
    subOsc.start(now);
    subOsc.stop(now + 0.45);

    // 2. Heavy iron plate reverberation
    const metalOsc = this.ctx.createOscillator();
    metalOsc.type = 'triangle';
    metalOsc.frequency.setValueAtTime(540, now);
    metalOsc.frequency.exponentialRampToValueAtTime(320, now + 0.6);

    const metalFilter = this.ctx.createBiquadFilter();
    metalFilter.type = 'bandpass';
    metalFilter.frequency.setValueAtTime(520, now);
    metalFilter.Q.setValueAtTime(6.0, now);

    const metalGain = this.ctx.createGain();
    metalGain.gain.setValueAtTime(0.0001, now);
    metalGain.gain.linearRampToValueAtTime(0.055, now + 0.008);
    metalGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.65);

    metalOsc.connect(metalFilter);
    metalFilter.connect(metalGain);
    metalGain.connect(this.sfxBus);
    metalOsc.start(now);
    metalOsc.stop(now + 0.7);

    // 3. Strained hinge creak
    this.playStrainedHingeCreak(0.045);
  }

  /**
   * HAMMER IMPACT 3: Violent shattering blow, massive low-end boom followed by dead silence.
   */
  public playHammerHit3(): void {
    if (!this.ctx || !this.sfxBus) return;
    const now = this.ctx.currentTime;

    // 1. Massive low bass punch
    const subOsc = this.ctx.createOscillator();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(160, now);
    subOsc.frequency.exponentialRampToValueAtTime(32, now + 0.4);

    const subGain = this.ctx.createGain();
    subGain.gain.setValueAtTime(0.0001, now);
    subGain.gain.linearRampToValueAtTime(0.14, now + 0.006);
    subGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);

    subOsc.connect(subGain);
    subGain.connect(this.sfxBus);
    subOsc.start(now);
    subOsc.stop(now + 0.6);

    // 2. Splintering wood crack
    if (this.pinkNoiseBuffer) {
      const crack = this.ctx.createBufferSource();
      crack.buffer = this.pinkNoiseBuffer;

      const f = this.ctx.createBiquadFilter();
      f.type = 'bandpass';
      f.frequency.setValueAtTime(1400, now);
      f.Q.setValueAtTime(2.0, now);

      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.0001, now);
      g.gain.linearRampToValueAtTime(0.065, now + 0.005);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);

      crack.connect(f);
      f.connect(g);
      g.connect(this.sfxBus);
      crack.start(now);
      crack.stop(now + 0.3);
    }
  }

  /**
   * Strained metal hinge creak when the heavy door is struck.
   */
  private playStrainedHingeCreak(volume: number): void {
    if (!this.ctx || !this.sfxBus) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(210, now + 0.08);
    osc.frequency.linearRampToValueAtTime(180, now + 0.22);
    osc.frequency.linearRampToValueAtTime(240, now + 0.38);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(450, now);
    filter.Q.setValueAtTime(5.0, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(volume, now + 0.12);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxBus);
    osc.start(now);
    osc.stop(now + 0.48);
  }

  /**
   * HIT #3 FINAL JUMP SCARE:
   * Sharp cinematic horror impact, short female vocal scream/whisper, deep bass hit, sudden wind burst.
   * Master-limited and smoothed: strictly zero speaker crackle or clipping.
   */
  public playHit3FinalJumpscare(): void {
    if (!this.ctx || !this.sfxBus) return;
    const now = this.ctx.currentTime;

    // 1. Deep cinematic sub bass hit (impact boom)
    const subOsc = this.ctx.createOscillator();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(110, now);
    subOsc.frequency.exponentialRampToValueAtTime(32, now + 0.45);

    const subGain = this.ctx.createGain();
    subGain.gain.setValueAtTime(0.0001, now);
    subGain.gain.linearRampToValueAtTime(0.12, now + 0.008);
    subGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.9);

    subOsc.connect(subGain);
    subGain.connect(this.sfxBus);
    subOsc.start(now);
    subOsc.stop(now + 0.95);

    // 2. Short, sharp cinematic horror chord string/screech
    const chordFreqs = [587.33, 622.25, 880.0, 932.33]; // Dissonant minor second clusters (D5, D#5, A5, A#5)
    for (const freq of chordFreqs) {
      const osc = this.ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.linearRampToValueAtTime(freq * 0.96, now + 0.7);

      const f = this.ctx.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.setValueAtTime(3200, now);
      f.frequency.exponentialRampToValueAtTime(800, now + 0.65);

      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.0001, now);
      g.gain.linearRampToValueAtTime(0.022, now + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 0.75);

      osc.connect(f);
      f.connect(g);
      g.connect(this.sfxBus);
      osc.start(now);
      osc.stop(now + 0.8);
    }

    // 3. Short piercing female scream / breath burst (Formant filtered vocal surge)
    if (this.pinkNoiseBuffer) {
      const vocalNoise = this.ctx.createBufferSource();
      vocalNoise.buffer = this.pinkNoiseBuffer;

      const vFormant1 = this.ctx.createBiquadFilter();
      vFormant1.type = 'bandpass';
      vFormant1.frequency.setValueAtTime(1050, now);
      vFormant1.frequency.exponentialRampToValueAtTime(1800, now + 0.25);
      vFormant1.Q.setValueAtTime(4.5, now);

      const vFormant2 = this.ctx.createBiquadFilter();
      vFormant2.type = 'bandpass';
      vFormant2.frequency.setValueAtTime(2600, now);
      vFormant2.frequency.linearRampToValueAtTime(3400, now + 0.3);
      vFormant2.Q.setValueAtTime(5.2, now);

      const vGain = this.ctx.createGain();
      vGain.gain.setValueAtTime(0.0001, now);
      vGain.gain.linearRampToValueAtTime(0.065, now + 0.012);
      vGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.68);

      vocalNoise.connect(vFormant1);
      vFormant1.connect(vFormant2);
      vFormant2.connect(vGain);
      vGain.connect(this.sfxBus);
      vocalNoise.start(now);
      vocalNoise.stop(now + 0.72);

      // Sudden wind burst
      const windNoise = this.ctx.createBufferSource();
      windNoise.buffer = this.pinkNoiseBuffer;

      const wFilter = this.ctx.createBiquadFilter();
      wFilter.type = 'lowpass';
      wFilter.frequency.setValueAtTime(800, now);
      wFilter.frequency.exponentialRampToValueAtTime(250, now + 0.8);

      const wGain = this.ctx.createGain();
      wGain.gain.setValueAtTime(0.0001, now);
      wGain.gain.linearRampToValueAtTime(0.05, now + 0.04);
      wGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.85);

      windNoise.connect(wFilter);
      wFilter.connect(wGain);
      wGain.connect(this.sfxBus);
      windNoise.start(now);
      windNoise.stop(now + 0.9);
    }
  }

  /**
   * BUNGALOW MAIN ENTRANCE DOOR SLOW UNLOCK & SWING OPEN:
   * Long wooden creak, rusted hinge strain, deep atmospheric groan.
   */
  public playBungalowDoorOpen(): void {
    if (!this.ctx || !this.sfxBus) return;
    const now = this.ctx.currentTime;

    // 1. Initial lock bolt click / give
    const clickOsc = this.ctx.createOscillator();
    clickOsc.type = 'triangle';
    clickOsc.frequency.setValueAtTime(320, now);
    clickOsc.frequency.exponentialRampToValueAtTime(90, now + 0.06);

    const clickGain = this.ctx.createGain();
    clickGain.gain.setValueAtTime(0.0001, now);
    clickGain.gain.linearRampToValueAtTime(0.06, now + 0.005);
    clickGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);

    clickOsc.connect(clickGain);
    clickGain.connect(this.sfxBus);
    clickOsc.start(now);
    clickOsc.stop(now + 0.15);

    // 2. Slow prolonged heavy wooden door creak (2.8 seconds)
    const creakOsc = this.ctx.createOscillator();
    creakOsc.type = 'sawtooth';
    creakOsc.frequency.setValueAtTime(95, now + 0.2);
    creakOsc.frequency.linearRampToValueAtTime(140, now + 0.8);
    creakOsc.frequency.linearRampToValueAtTime(85, now + 1.5);
    creakOsc.frequency.linearRampToValueAtTime(115, now + 2.2);
    creakOsc.frequency.linearRampToValueAtTime(65, now + 2.8);

    const creakFilter = this.ctx.createBiquadFilter();
    creakFilter.type = 'bandpass';
    creakFilter.frequency.setValueAtTime(380, now + 0.2);
    creakFilter.Q.setValueAtTime(6.0, now);

    const creakGain = this.ctx.createGain();
    creakGain.gain.setValueAtTime(0.0001, now);
    creakGain.gain.linearRampToValueAtTime(0.048, now + 0.5);
    creakGain.gain.setValueAtTime(0.042, now + 1.8);
    creakGain.gain.exponentialRampToValueAtTime(0.0001, now + 2.9);

    creakOsc.connect(creakFilter);
    creakFilter.connect(creakGain);
    creakGain.connect(this.sfxBus);
    creakOsc.start(now + 0.15);
    creakOsc.stop(now + 3.0);

    // 3. Rusted iron hinge groan
    const hingeOsc = this.ctx.createOscillator();
    hingeOsc.type = 'triangle';
    hingeOsc.frequency.setValueAtTime(420, now + 0.3);
    hingeOsc.frequency.linearRampToValueAtTime(560, now + 1.2);
    hingeOsc.frequency.linearRampToValueAtTime(380, now + 2.1);

    const hFilter = this.ctx.createBiquadFilter();
    hFilter.type = 'bandpass';
    hFilter.frequency.setValueAtTime(480, now);
    hFilter.Q.setValueAtTime(8.5, now);

    const hGain = this.ctx.createGain();
    hGain.gain.setValueAtTime(0.0001, now);
    hGain.gain.linearRampToValueAtTime(0.035, now + 0.6);
    hGain.gain.exponentialRampToValueAtTime(0.0001, now + 2.4);

    hingeOsc.connect(hFilter);
    hFilter.connect(hGain);
    hGain.connect(this.sfxBus);
    hingeOsc.start(now + 0.25);
    hingeOsc.stop(now + 2.5);
  }

  /**
   * Sound of picking up the heavy iron hammer from the ground/crate.
   */
  public playHammerPickup(): void {
    if (!this.ctx || !this.sfxBus) return;
    const now = this.ctx.currentTime;

    // Metallic scrape & wooden clatter
    const mOsc = this.ctx.createOscillator();
    mOsc.type = 'triangle';
    mOsc.frequency.setValueAtTime(680, now);
    mOsc.frequency.exponentialRampToValueAtTime(240, now + 0.15);

    const mGain = this.ctx.createGain();
    mGain.gain.setValueAtTime(0.0001, now);
    mGain.gain.linearRampToValueAtTime(0.04, now + 0.005);
    mGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);

    mOsc.connect(mGain);
    mGain.connect(this.sfxBus);
    mOsc.start(now);
    mOsc.stop(now + 0.25);
  }

  public dispose(): void {
    this.isEventManagerRunning = false;
    this.isHeartbeatRunning = false;
    if (this.eventTimeoutId) clearTimeout(this.eventTimeoutId);
    if (this.heartbeatIntervalId) clearTimeout(this.heartbeatIntervalId);

    if (this.droneOsc1) {
      try { this.droneOsc1.stop(); } catch (_) {}
    }
    if (this.droneOsc2) {
      try { this.droneOsc2.stop(); } catch (_) {}
    }
    if (this.droneOscSub) {
      try { this.droneOscSub.stop(); } catch (_) {}
    }
    if (this.droneEerieOsc) {
      try { this.droneEerieOsc.stop(); } catch (_) {}
    }
    if (this.windLfo) {
      try { this.windLfo.stop(); } catch (_) {}
    }
    if (this.windSource) {
      try { this.windSource.stop(); } catch (_) {}
    }
    if (this.rainSource) {
      try { this.rainSource.stop(); } catch (_) {}
    }

    if (this.ctx && this.ctx.state !== 'closed') {
      this.ctx.close();
    }
    this.ctx = null;
    this.isInitialized = false;
  }
}

export const horrorAudio = new HorrorAudioManager();
