export default class AudioEngine {
  #ctx;
  #master;

  constructor() {
    const AC = window.AudioContext || window.webkitAudioContext;
    this.#ctx = new AC();
    this.#master = this.#ctx.createGain();
    this.#master.gain.value = 0.3;
    this.#master.connect(this.#ctx.destination);
  }

  init() {
    if (this.#ctx.state === 'suspended') this.#ctx.resume();
  }

  playCoin() {
    try {
      const osc = this.#ctx.createOscillator();
      const gain = this.#ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, this.#ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(
        1200,
        this.#ctx.currentTime + 0.1
      );
      gain.gain.setValueAtTime(0.5, this.#ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.#ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(this.#master);
      osc.start();
      osc.stop(this.#ctx.currentTime + 0.3);
    } catch (_) {
      /* silent fail */
    }
  }

  playCrash() {
    try {
      const osc = this.#ctx.createOscillator();
      const gain = this.#ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, this.#ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(
        0.01,
        this.#ctx.currentTime + 0.5
      );
      gain.gain.setValueAtTime(1, this.#ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.#ctx.currentTime + 0.5);
      osc.connect(gain);
      gain.connect(this.#master);
      osc.start();
      osc.stop(this.#ctx.currentTime + 0.5);
    } catch (_) {
      /* silent fail */
    }
  }
}
