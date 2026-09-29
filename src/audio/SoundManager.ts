export class SoundManager {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private isAmbiencePlaying: boolean = false;
  private ambientGain: GainNode | null = null;

  constructor() {
    // Lazy init on first user click
    const initAudio = () => {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
          this.startGothicAmbience();
        }
      } else if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      window.removeEventListener('click', initAudio);
      window.removeEventListener('keydown', initAudio);
    };

    window.addEventListener('click', initAudio);
    window.addEventListener('keydown', initAudio);
  }

  public play(key: string): void {
    if (this.isMuted || !this.ctx) return;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    try {
      switch (key) {
        case 'sword_swing':
          this.playSwordSwing();
          break;
        case 'hit_flesh':
        case 'monster_hit':
          this.playHitFlesh();
          break;
        case 'shield_block':
          this.playShieldBlock();
          break;
        case 'bone_clatter':
          this.playBoneClatter();
          break;
        case 'skeleton_death':
          this.playSkeletonDeath();
          break;
        case 'potion_gulp':
          this.playPotionGulp();
          break;
        case 'gold_pickup':
          this.playGoldPickup();
          break;
        case 'item_equip':
          this.playItemEquip();
          break;
        case 'level_up':
          this.playLevelUp();
          break;
        case 'butcher_shout':
          this.playButcherShout();
          break;
        case 'portal_open':
          this.playPortalSound();
          break;
        case 'footstep':
          this.playFootstep();
          break;
        default:
          this.playHitFlesh();
          break;
      }
    } catch {
      // Ignore audio synthesis errors on strict policies
    }
  }

  // ==========================================
  // PROCEDURAL SOUND SYNTHESIZERS
  // ==========================================

  private playSwordSwing(): void {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(380, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.18);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1200, now);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.19);
  }

  private playHitFlesh(): void {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.15);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.16);
  }

  private playShieldBlock(): void {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    // Resonant metallic ping
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(1600, now);
    osc1.frequency.exponentialRampToValueAtTime(800, now + 0.25);

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(840, now);
    osc2.frequency.exponentialRampToValueAtTime(400, now + 0.25);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.26);
    osc2.stop(now + 0.26);
  }

  private playBoneClatter(): void {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    for (let i = 0; i < 3; i++) {
      const t = now + i * 0.04;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(600 + Math.random() * 400, t);
      osc.frequency.exponentialRampToValueAtTime(150, t + 0.04);

      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.04);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.05);
    }
  }

  private playSkeletonDeath(): void {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    for (let i = 0; i < 7; i++) {
      const t = now + i * 0.05;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(800 - i * 80 + Math.random() * 100, t);
      osc.frequency.exponentialRampToValueAtTime(80, t + 0.06);

      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.06);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.07);
    }
  }

  private playPotionGulp(): void {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(260, now);
    osc.frequency.exponentialRampToValueAtTime(540, now + 0.12);
    osc.frequency.exponentialRampToValueAtTime(320, now + 0.24);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.26);
  }

  private playGoldPickup(): void {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const freqs = [1800, 2400];
    freqs.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.04);

      gain.gain.setValueAtTime(0.2, now + idx * 0.04);
      gain.gain.exponentialRampToValueAtTime(0.005, now + idx * 0.04 + 0.2);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(now + idx * 0.04);
      osc.stop(now + idx * 0.04 + 0.22);
    });
  }

  private playItemEquip(): void {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(100, now + 0.12);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.13);
  }

  private playLevelUp(): void {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const notes = [440, 554.37, 659.25, 880]; // A major triumphant chime

    notes.forEach((freq, idx) => {
      const t = now + idx * 0.12;
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.4);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(t);
      osc.stop(t + 0.45);
    });
  }

  private playButcherShout(): void {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    // Deep, guttural roar: "Ah, fresh meat!"
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(90, now);
    osc.frequency.linearRampToValueAtTime(130, now + 0.2);
    osc.frequency.exponentialRampToValueAtTime(65, now + 0.7);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(500, now);

    gain.gain.setValueAtTime(0.45, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.7);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.75);
  }

  private playPortalSound(): void {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.linearRampToValueAtTime(700, now + 0.3);
    osc.frequency.linearRampToValueAtTime(450, now + 0.6);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.65);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.7);
  }

  private playFootstep(): void {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(90, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.05);

    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.06);
  }

  // ==========================================
  // GOTHIC AMBIENT DRONE
  // ==========================================
  private startGothicAmbience(): void {
    if (!this.ctx || this.isAmbiencePlaying) return;
    this.isAmbiencePlaying = true;

    this.ambientGain = this.ctx.createGain();
    this.ambientGain.gain.setValueAtTime(0.12, this.ctx.currentTime);
    this.ambientGain.connect(this.ctx.destination);

    // Ominous minor triad drone (D2, A2, F3)
    const baseFreqs = [73.42, 110.0, 174.61];
    baseFreqs.forEach(freq => {
      const osc = this.ctx!.createOscillator();
      const filter = this.ctx!.createBiquadFilter();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, this.ctx!.currentTime);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(350, this.ctx!.currentTime);

      osc.connect(filter);
      filter.connect(this.ambientGain!);

      osc.start();
    });
  }
}
