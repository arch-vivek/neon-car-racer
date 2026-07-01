const PLAYER_CONFIG = Object.freeze({
  START_X: 175,
  START_Y: 490,
  WIDTH: 50,
  HEIGHT: 90,
  MAX_TILT: 12,
  TILT_SPEED: 1.5,
  TILT_RECOVERY: 1,
});

export default class Player {
  #el;
  #style;
  #x;
  #y;
  #w;
  #h;
  #baseSpeed;
  #tilt;
  #keys;
  #touch;

  constructor(id) {
    this.#el = document.getElementById(id);
    this.#style = this.#el.style;
    this.#x = PLAYER_CONFIG.START_X;
    this.#y = PLAYER_CONFIG.START_Y;
    this.#w = PLAYER_CONFIG.WIDTH;
    this.#h = PLAYER_CONFIG.HEIGHT;
    this.#baseSpeed = 0.35;
    this.#tilt = 0;
    this.#keys = { ArrowLeft: false, ArrowRight: false, Space: false };
    this.#touch = { left: false, right: false, boost: false };
    this.#initKeyboard();
  }

  get x() {
    return this.#x;
  }
  get y() {
    return this.#y;
  }
  get width() {
    return this.#w;
  }
  get height() {
    return this.#h;
  }
  get baseSpeed() {
    return this.#baseSpeed;
  }
  set baseSpeed(v) {
    this.#baseSpeed = v;
  }
  get isDrifting() {
    return Math.abs(this.#tilt) >= PLAYER_CONFIG.MAX_TILT - 0.1;
  }
  get isBoosting() {
    return this.#keys.Space || this.#touch.boost;
  }

  #initKeyboard() {
    window.addEventListener('keydown', (e) => {
      if (
        ['ArrowLeft', 'ArrowRight', 'Space'].includes(e.key) ||
        e.code === 'Space'
      ) {
        e.preventDefault();
      }
      if (this.#keys.hasOwnProperty(e.key)) this.#keys[e.key] = true;
      if (e.code === 'Space') this.#keys.Space = true;
    });
    window.addEventListener('keyup', (e) => {
      if (this.#keys.hasOwnProperty(e.key)) this.#keys[e.key] = false;
      if (e.code === 'Space') this.#keys.Space = false;
    });
  }

  setTouchLeft(v) {
    this.#touch.left = v;
  }
  setTouchRight(v) {
    this.#touch.right = v;
  }
  setTouchBoost(v) {
    this.#touch.boost = v;
  }

  reset() {
    this.#x = PLAYER_CONFIG.START_X;
    this.#tilt = 0;
    this.#el.classList.remove('crashed');
    this.#render();
  }

  crash() {
    this.#el.classList.add('crashed');
  }

  update(dt) {
    const left = this.#keys.ArrowLeft || this.#touch.left;
    const right = this.#keys.ArrowRight || this.#touch.right;

    let turning = false;
    const handling = this.isDrifting ? this.#baseSpeed * 0.75 : this.#baseSpeed;

    if (left && this.#x > 0) {
      this.#x -= handling * dt;
      this.#tilt = Math.max(
        this.#tilt - PLAYER_CONFIG.TILT_SPEED,
        -PLAYER_CONFIG.MAX_TILT
      );
      turning = true;
    }
    if (right && this.#x < 350) {
      this.#x += handling * dt;
      this.#tilt = Math.min(
        this.#tilt + PLAYER_CONFIG.TILT_SPEED,
        PLAYER_CONFIG.MAX_TILT
      );
      turning = true;
    }

    if (!turning) {
      if (this.#tilt > 0)
        this.#tilt = Math.max(this.#tilt - PLAYER_CONFIG.TILT_RECOVERY, 0);
      if (this.#tilt < 0)
        this.#tilt = Math.min(this.#tilt + PLAYER_CONFIG.TILT_RECOVERY, 0);
    }

    this.#render();
  }

  #render() {
    this.#style.transform = `translate3d(${this.#x}px, ${this.#y}px, 0) rotate(${this.#tilt}deg)`;
  }
}
