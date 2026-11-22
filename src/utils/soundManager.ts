class SoundManager {
  private bgmAudio: HTMLAudioElement | null = null;
  private audioCtx: AudioContext | null = null;
  private audioBuffers: Record<string, AudioBuffer> = {};
  private audioLoading = false;
  private fallbackCache: Record<string, HTMLAudioElement> = {};
  private isInGameplay = false;
  public soundEnabled = true;
  public musicEnabled = true;
  public vibrationEnabled = true;

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioCtx) {
      const Ctx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (Ctx) {
        this.audioCtx = new Ctx();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
    return this.audioCtx;
  }

  private preloadSounds() {
    if (typeof window === 'undefined' || this.audioLoading) return;
    this.audioLoading = true;

    const files: Record<string, string> = {
      click: '/assets/ludo/audio/click.mp3',
      dice_roll: '/assets/ludo/audio/dice_roll.mp3',
      token_step: '/assets/ludo/audio/token_step.mp3',
      token_out: '/assets/ludo/audio/token_out.mp3',
      match_found: '/assets/ludo/audio/match_found.mp3',
      player_join: '/assets/ludo/audio/player_join.mp3',
      timer_warn: '/assets/ludo/audio/timer_warn.mp3',
      timeout: '/assets/ludo/audio/timeout.mp3',
    };

    const ctx = this.getAudioContext();
    for (const [key, src] of Object.entries(files)) {
      // Lightweight fallback audio element
      if (!this.fallbackCache[key]) {
        const audio = new Audio(src);
        audio.preload = 'auto';
        this.fallbackCache[key] = audio;
      }
      // Decode into Web Audio API AudioBuffer for 0ms latency & zero GC lag on mobile
      if (ctx) {
        fetch(src)
          .then((r) => r.arrayBuffer())
          .then((arr) => ctx.decodeAudioData(arr))
          .then((buf) => {
            this.audioBuffers[key] = buf;
          })
          .catch(() => {});
      }
    }
  }

  private playClip(key: string, volume = 0.9) {
    if (!this.soundEnabled || typeof window === 'undefined') return;
    this.preloadSounds();

    const ctx = this.getAudioContext();
    const buffer = this.audioBuffers[key];
    if (ctx && buffer) {
      try {
        const source = ctx.createBufferSource();
        const gain = ctx.createGain();
        source.buffer = buffer;
        gain.gain.value = volume;
        source.connect(gain);
        gain.connect(ctx.destination);
        source.start(0);
        return;
      } catch {
        // fallback below
      }
    }

    const base = this.fallbackCache[key];
    if (base) {
      try {
        base.pause();
        base.currentTime = 0;
        base.volume = volume;
        base.play().catch(() => {});
      } catch {
        // ignore
      }
    }
  }

  public initBgm() {
    if (typeof window === 'undefined') return;
    this.preloadSounds();
    if (!this.bgmAudio) {
      this.bgmAudio = new Audio('/assets/ludo/audio/bgm.mp3');
      this.bgmAudio.loop = true;
      this.bgmAudio.volume = 0.48;
    }
  }

  /**
   * Enforce strict gameplay audio rule:
   * - During active gameplay on the board, app BGM MUST NEVER play.
   * - Outside gameplay (Home / Menus / Lobby), BGM plays if musicEnabled.
   */
  public setGameplayMode(active: boolean) {
    this.isInGameplay = active;
    if (active) {
      this.stopBgm();
    } else if (this.musicEnabled) {
      this.playBgm();
    }
  }

  public playBgm() {
    if (this.isInGameplay) {
      this.stopBgm();
      return;
    }
    this.initBgm();
    if (!this.musicEnabled || !this.bgmAudio) return;
    if (this.bgmAudio.paused) {
      this.bgmAudio.play().catch(() => {});
    }
  }

  public startBgm() {
    this.playBgm();
  }

  public stopBgm() {
    if (this.bgmAudio) {
      this.bgmAudio.pause();
      this.bgmAudio.currentTime = 0;
    }
  }

  public setMusicEnabled(enabled: boolean) {
    this.musicEnabled = enabled;
    if (enabled && !this.isInGameplay) {
      this.playBgm();
    } else {
      this.stopBgm();
    }
  }

  public setSoundEnabled(enabled: boolean) {
    this.soundEnabled = enabled;
  }

  public toggleMusic(): boolean {
    this.musicEnabled = !this.musicEnabled;
    if (this.musicEnabled && !this.isInGameplay) {
      this.playBgm();
    } else {
      this.stopBgm();
    }
    return this.musicEnabled;
  }

  public toggleSound(): boolean {
    this.soundEnabled = !this.soundEnabled;
    return this.soundEnabled;
  }

  public vibrate(ms: number = 30) {
    if (this.vibrationEnabled && typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(ms);
      } catch {
        // ignore
      }
    }
  }

  // Authentic Ludo King isolated UI touch/click sound (only plays when user explicitly taps a button)
  public playClick() {
    if (!this.soundEnabled) return;
    this.playClip('click', 0.9);
  }

  // Authentic Ludo King player joined Friends Room sound
  public playPlayerJoin() {
    if (!this.soundEnabled) return;
    this.playClip('player_join', 0.95);
  }

  // Authentic Ludo King match start & coin chest fanfare (only in lobby before board opens)
  public playGameStart() {
    this.stopBgm();
    if (!this.soundEnabled) return;
    this.playClip('match_found', 0.95);
  }

  // Authentic Ludo King isolated dice roll rattle (plays for BOTH user and opponent)
  public playDiceRoll() {
    if (!this.soundEnabled) return;
    this.vibrate(20);
    this.playClip('dice_roll', 1.0);
  }

  // Authentic Ludo King isolated token step hop sound ("tak-tak")
  public playTokenStep(_stepCount: number = 1) {
    if (!this.soundEnabled) return;
    this.playClip('token_step', 1.0);
  }

  // Authentic Ludo King token exiting base on 6
  public playTokenOut() {
    if (!this.soundEnabled) return;
    this.vibrate(30);
    this.playClip('token_out', 1.0);
  }

  // Authentic Ludo King low-time red border warning tick
  public playTimerWarn() {
    if (!this.soundEnabled) return;
    this.playClip('timer_warn', 0.85);
  }

  // Authentic Ludo King turn timeout sound ("You ran out of time!")
  public playTimeout() {
    if (!this.soundEnabled) return;
    this.vibrate(45);
    this.playClip('timeout', 0.95);
  }

  // Crisp Goti Cut / Capture SFX (clean descending punchy swoosh - zero BGM/music bleed)
  public playCapture() {
    if (!this.soundEnabled) return;
    this.vibrate(70);
    const ctx = this.getAudioContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(680, now);
      osc.frequency.exponentialRampToValueAtTime(160, now + 0.22);
      gain.gain.setValueAtTime(0.32, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.25);
    } catch {
      // ignore
    }
  }

  // Crisp Goti Home Reached SFX (bright celebratory 3-note chime - zero BGM/music bleed)
  public playTokenHome() {
    if (!this.soundEnabled) return;
    this.vibrate(55);
    const ctx = this.getAudioContext();
    if (!ctx) return;
    try {
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, i) => {
        const now = ctx.currentTime + i * 0.085;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime(0.24, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.23);
      });
    } catch {
      // ignore
    }
  }

  public playCoinUnlock() {
    if (!this.soundEnabled) return;
    this.vibrate(35);
    if (this.isInGameplay) {
      this.playClick();
      return;
    }
    this.playClip('match_found', 0.8);
  }

  public playCoinCollect() {
    this.playCoinUnlock();
  }

  public playInvalid() {
    if (!this.soundEnabled) return;
    this.playClip('timeout', 0.75);
  }

  public playChatPop() {
    this.playClick();
  }

  public playTurnAlert() {
    // Silent during gameplay to prevent unwanted extra sound effects
  }

  public playVoiceNote(text: string, gender: 'male' | 'female' = 'female') {
    if (!this.soundEnabled) return;
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(text);
        utter.lang = 'hi-IN';
        utter.pitch = gender === 'female' ? 1.4 : 0.88;
        utter.rate = 1.05;
        window.speechSynthesis.speak(utter);
      } catch {
        this.playClick();
      }
    } else {
      this.playClick();
    }
  }
}

export const soundManager = new SoundManager();
