import { CONFIG, ENEMY_TYPES, COLLECTIBLE_TYPES } from './Config.js';

export default class GameEngine {
  #player;
  #ui;
  #container;
  #road;
  #roadStyle;
  #isPlaying;
  #score;
  #coins;
  #speed;
  #roadOffset;
  #lastTime;
  #spawnTimer;
  #colTimer;
  #stage;
  #enemies;
  #particles;
  #skids;
  #collectibles;
  #skidTimer;
  #boost;
  #boostStyle;
  #wrapper;
  #flame;
  #hyper;
  #nearMissUI;
  #nearMissTimer;
  #shieldUI;
  #shielded;
  #weatherLayer;
  #raining;
  #weatherTimer;
  #draftUI;

  constructor(player, uiCallbacks) {
    this.#player = player;
    this.#ui = uiCallbacks;
    this.#container = document.getElementById('game-container');
    this.#road = document.getElementById('road');
    this.#roadStyle = this.#road.style;
    this.#boostStyle = document.getElementById('boost-bar').style;
    this.#wrapper = document.getElementById('game-wrapper');
    this.#nearMissUI = document.getElementById('near-miss-alert');
    this.#shieldUI = document.getElementById('shield-ui');
    this.#weatherLayer = document.getElementById('weather-layer');
    this.#draftUI = document.getElementById('draft-ui');

    const pe = document.getElementById('player');
    this.#flame = document.createElement('div');
    this.#flame.className = 'boost-flame';
    this.#flame.style.display = 'none';
    pe.appendChild(this.#flame);

    const hl = document.createElement('div');
    hl.className = 'headlights';
    pe.appendChild(hl);

    this.#isPlaying = false;
    this.#score = 0;
    this.#coins = 0;
    this.#speed = 0.25;
    this.#roadOffset = 0;
    this.#lastTime = 0;
    this.#spawnTimer = 0;
    this.#colTimer = 0;
    this.#stage = null;
    this.#shielded = false;
    this.#raining = false;
    this.#weatherTimer = 0;
    this.#skidTimer = 0;
    this.#boost = 100;
    this.#hyper = false;

    this.#enemies = [];
    this.#particles = [];
    this.#skids = [];
    this.#collectibles = [];

    this.#initPools();
  }

  #initPools() {
    for (let i = 0; i < 8; i++) {
      const el = document.createElement('div');
      el.className = 'car hidden';
      this.#container.appendChild(el);
      this.#enemies.push({
        el,
        style: el.style,
        x: 0,
        y: -150,
        w: 50,
        h: 90,
        speedMod: 1,
        active: false,
        tilt: 0,
        nearMissed: false,
        isNemesis: false,
      });
    }
    for (let i = 0; i < CONFIG.MAX_SKIDS; i++) {
      const el = document.createElement('div');
      el.className = 'skid-mark hidden';
      this.#container.appendChild(el);
      this.#skids.push({
        el,
        style: el.style,
        x: 0,
        y: 0,
        life: 0,
        active: false,
      });
    }
    for (let i = 0; i < CONFIG.MAX_PARTICLES; i++) {
      const el = document.createElement('div');
      el.className = 'particle hidden';
      this.#container.appendChild(el);
      this.#particles.push({
        el,
        style: el.style,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        life: 0,
        active: false,
      });
    }
    for (let i = 0; i < CONFIG.MAX_COLLECTIBLES; i++) {
      const el = document.createElement('div');
      el.className = 'hidden';
      el.style.position = 'absolute';
      el.style.willChange = 'transform';
      this.#container.appendChild(el);
      this.#collectibles.push({
        el,
        style: el.style,
        x: 0,
        y: 0,
        w: 25,
        h: 25,
        type: 'coin',
        active: false,
      });
    }
  }

  get isRunning() {
    return this.#isPlaying;
  }

  #checkCollision(a, b, px = 10, py = 15) {
    return (
      a.x + px < b.x + b.w - px &&
      a.x + a.w - px > b.x + px &&
      a.y + py < b.y + b.h - py &&
      a.y + a.h - py > b.y + py
    );
  }

  start(stage) {
    this.#stage = stage;
    this.#isPlaying = true;
    this.#score = 0;
    this.#coins = 0;
    this.#speed = 0.25;
    this.#boost = 100;
    this.#player.reset();
    this.#setShield(false);
    this.#wrapper.classList.remove('is-raining');
    this.#raining = false;
    this.#weatherTimer = 0;
    this.#spawnTimer = 0;
    this.#colTimer = 0;

    for (const pool of [
      this.#enemies,
      this.#particles,
      this.#skids,
      this.#collectibles,
    ]) {
      for (const o of pool) {
        o.active = false;
        o.el.className = 'hidden';
      }
    }

    this.#setHyper(false);
    document.body.className = stage.theme;
    this.#lastTime = performance.now();
    requestAnimationFrame((t) => this.#loop(t));
  }

  #setHyper(on) {
    if (this.#hyper === on) return;
    this.#hyper = on;
    this.#wrapper.classList.toggle('hyper-active', on);
    this.#flame.style.display = on ? 'block' : 'none';
  }

  #setShield(on) {
    this.#shielded = on;
    const pe = document.getElementById('player');
    pe.classList.toggle('player-shielded', on);
    this.#shieldUI.classList.toggle('hidden', !on);
  }

  #loop(now) {
    if (!this.#isPlaying) return;
    let dt = now - this.#lastTime;
    this.#lastTime = now;
    if (dt > CONFIG.FPS_CAP_MS) dt = 16;

    // Weather
    this.#weatherTimer += dt;
    if (this.#weatherTimer > 15000 && Math.random() > 0.7) {
      this.#raining = !this.#raining;
      this.#wrapper.classList.toggle('is-raining', this.#raining);
      if (this.#raining) {
        const flash = document.createElement('div');
        flash.className = 'lightning-flash';
        flash.style.cssText =
          'position:absolute;width:100%;height:100%;z-index:2500;pointer-events:none;';
        this.#wrapper.appendChild(flash);
        setTimeout(() => flash.remove(), 600);
      }
      this.#weatherTimer = 0;
    }

    const wet = this.#raining ? 0.8 : 1.0;
    let speedMul = 1.0;
    const drafting = this.#checkSlipstream();
    if (drafting) {
      speedMul = 1.5;
      document.getElementById('player').classList.add('drafting-aura');
      this.#draftUI.style.opacity = '1';
    } else {
      document.getElementById('player').classList.remove('drafting-aura');
      this.#draftUI.style.opacity = '0';
    }

    const boosting = this.#player.isBoosting;
    if (boosting && this.#boost > 0) {
      speedMul = 2.0;
      this.#boost -= dt * 0.06;
      if (this.#boost < 0) this.#boost = 0;
      this.#setHyper(true);
    } else {
      this.#boost += dt * 0.015;
      if (this.#boost > 100) this.#boost = 100;
      this.#setHyper(false);
    }
    this.#boostStyle.transform = `scale3d(1, ${this.#boost / 100}, 1)`;

    // Road scroll
    this.#roadOffset += this.#speed * speedMul * dt;
    if (this.#roadOffset >= CONFIG.ROAD_LOOP_HEIGHT)
      this.#roadOffset -= CONFIG.ROAD_LOOP_HEIGHT;
    this.#roadStyle.backgroundPosition = `0px ${this.#roadOffset}px`;

    // Player
    this.#player.baseSpeed =
      (0.35 +
        (parseInt(localStorage.getItem('neonRacerEngineLevel')) || 1) * 0.05) *
      wet;
    this.#player.update(dt);

    // Particles
    this.#updateParticles(dt);

    // Skid marks
    this.#skidTimer += dt;
    if (this.#player.isDrifting && this.#skidTimer > 30) {
      this.#spawnSkid(
        this.#player.x + 8,
        this.#player.y + this.#player.height - 15
      );
      this.#spawnSkid(
        this.#player.x + this.#player.width - 13,
        this.#player.y + this.#player.height - 15
      );
      this.#skidTimer = 0;
    }
    for (const s of this.#skids) {
      if (!s.active) continue;
      s.y += this.#speed * speedMul * dt;
      s.life -= 0.003 * dt;
      s.style.transform = `translate3d(${s.x}px, ${s.y}px, 0)`;
      s.style.opacity = s.life;
      if (s.life <= 0 || s.y > 650) {
        s.active = false;
        s.el.classList.add('hidden');
      }
    }

    // Spawn enemies
    this.#spawnTimer += dt;
    const progress = Math.min(this.#score / this.#stage.targetScore, 1);
    const dynDiv = 1.2 + (CONFIG.SPAWN_DIVISOR - 1.2) * progress;
    const interval = this.#stage.baseSpawn / (this.#speed * speedMul * dynDiv);

    if (this.#spawnTimer > interval) {
      let blocked = false;
      for (const e of this.#enemies) {
        if (e.active && e.y > -50 && e.y < 180) {
          blocked = true;
          break;
        }
      }
      if (!blocked) {
        const enemy = this.#enemies.find((e) => !e.active);
        if (enemy) {
          const lanes = [25, 115, 205, 295];
          const occupied = [];
          for (const e of this.#enemies) {
            if (e.active && e.y < 350) {
              const cl = lanes.reduce((a, b) =>
                Math.abs(b - e.x) < Math.abs(a - e.x) ? b : a
              );
              occupied.push(cl);
            }
          }
          const safe = lanes.filter((l) => !occupied.includes(l));
          if (safe.length > 1) {
            const x = safe[Math.floor(Math.random() * safe.length)];
            const arch =
              ENEMY_TYPES[Math.floor(Math.random() * ENEMY_TYPES.length)];
            enemy.active = true;
            enemy.w = arch.width;
            enemy.h = arch.height;
            enemy.speedMod = arch.speedMod;
            enemy.el.className = `car ${arch.cssClass}`;
            enemy.style.width = `${arch.width}px`;
            enemy.style.height = `${arch.height}px`;
            enemy.x = x;
            enemy.y = -150;
            enemy.tilt = 0;
            enemy.nearMissed = false;
            enemy.isNemesis = arch.isNemesis;
            enemy.el.classList.remove('hidden');
            this.#spawnTimer = 0;
          }
        }
      }
    }

    // Spawn collectibles
    this.#colTimer += dt;
    const colInt = 2500 / (this.#speed * speedMul);
    if (this.#colTimer > colInt) {
      const item = this.#collectibles.find((c) => !c.active);
      if (item) {
        const rand = Math.random() * 100;
        let td = COLLECTIBLE_TYPES[0];
        if (rand > 80) td = COLLECTIBLE_TYPES[1];

        const lanes = [25, 115, 205, 295];
        const occupied = [];
        for (const e of this.#enemies) {
          if (e.active && e.y < 350) {
            const cl = lanes.reduce((a, b) =>
              Math.abs(b - e.x) < Math.abs(a - e.x) ? b : a
            );
            occupied.push(cl);
          }
        }
        const safe = lanes.filter((l) => !occupied.includes(l));
        const fx =
          safe.length > 0
            ? safe[Math.floor(Math.random() * safe.length)]
            : lanes[Math.floor(Math.random() * lanes.length)];

        item.active = true;
        item.type = td.type;
        item.w = td.width;
        item.h = td.height;
        item.el.className = td.cssClass;
        item.style.width = `${td.width}px`;
        item.style.height = `${td.height}px`;
        item.x = fx;
        item.y = -50;
        this.#colTimer = 0;
      }
    }

    // Process collectibles
    for (const c of this.#collectibles) {
      if (!c.active) continue;
      c.y += this.#speed * speedMul * dt;
      c.style.transform = `translate3d(${c.x}px, ${c.y}px, 0)`;
      if (this.#checkCollision(this.#player, c, 0, 0)) {
        if (c.type === 'coin') {
          this.#coins += 5;
          this.#score += 10;
        } else if (c.type === 'shield') {
          this.#setShield(true);
        }
        c.active = false;
        c.el.className = 'hidden';
        continue;
      }
      if (c.y > 650) {
        c.active = false;
        c.el.className = 'hidden';
      }
    }

    // Process enemies
    for (const e of this.#enemies) {
      if (!e.active) continue;
      let swerve = false;
      if (e.isNemesis) {
        if (e.x + e.w / 2 < this.#player.x + this.#player.width / 2) {
          e.x += 0.05 * dt;
          e.tilt = Math.min(e.tilt + 1, 5);
        } else {
          e.x -= 0.05 * dt;
          e.tilt = Math.max(e.tilt - 1, -5);
        }
        swerve = true;
      } else {
        for (const o of this.#enemies) {
          if (o === e || !o.active) continue;
          if (o.y > e.y && o.y - e.y < 150 && Math.abs(e.x - o.x) < 60) {
            if (e.speedMod >= o.speedMod) {
              swerve = true;
              if (e.x < o.x && e.x > 20) {
                e.x -= CONFIG.AI_SWERVE_SPEED * dt;
                e.tilt -= 2;
                if (e.tilt < -CONFIG.MAX_TILT) e.tilt = -CONFIG.MAX_TILT;
              } else if (e.x + e.w < 380) {
                e.x += CONFIG.AI_SWERVE_SPEED * dt;
                e.tilt += 2;
                if (e.tilt > CONFIG.MAX_TILT) e.tilt = CONFIG.MAX_TILT;
              } else {
                e.y -= this.#speed * speedMul * (e.speedMod - o.speedMod) * dt;
              }
            }
          }
        }
      }
      if (!swerve) {
        if (e.tilt > 0) {
          e.tilt -= 1;
          if (e.tilt < 0) e.tilt = 0;
        }
        if (e.tilt < 0) {
          e.tilt += 1;
          if (e.tilt > 0) e.tilt = 0;
        }
      }

      e.y += this.#speed * speedMul * e.speedMod * dt;
      e.style.transform = `translate3d(${e.x}px, ${e.y}px, 0) rotate(${e.tilt}deg)`;

      if (this.#checkCollision(this.#player, e)) {
        if (this.#shielded) {
          this.#spawnCrash(e.x, e.y);
          e.active = false;
          e.el.classList.add('hidden');
          this.#setShield(false);
          this.#wrapper.classList.add('shake');
          setTimeout(() => this.#wrapper.classList.remove('shake'), 400);
          continue;
        } else {
          this.#gameOver();
          return;
        }
      }

      if (!e.nearMissed && this.#checkNearMiss(this.#player, e)) {
        e.nearMissed = true;
        this.#score += 25;
        this.#triggerNearMiss();
      }

      if (e.y > 650) {
        e.active = false;
        e.el.classList.add('hidden');
      }
    }

    // Score & progression
    this.#score += this.#speed * speedMul * dt * CONFIG.BASE_SCORE_RATE;
    if (this.#speed < this.#stage.maxSpeed)
      this.#speed += CONFIG.ACCELERATION * dt;

    if (this.#score >= this.#stage.targetScore) {
      this.#isPlaying = false;
      this.#ui.onVictory(this.#stage.id, this.#coins);
      return;
    }

    if (
      Math.floor(this.#score) > 0 &&
      Math.floor(this.#score) % 100 === 0 &&
      Math.floor(this.#score) / 100 > this.#coins
    ) {
      this.#coins++;
    }

    this.#ui.onUpdateScore(this.#score);

    if (this.#isPlaying) requestAnimationFrame((t) => this.#loop(t));
  }

  #checkSlipstream() {
    for (const e of this.#enemies) {
      if (!e.active) continue;
      if (
        Math.abs(e.x + e.w / 2 - (this.#player.x + this.#player.width / 2)) <
          25 &&
        e.y < this.#player.y &&
        e.y > this.#player.y - 120
      )
        return true;
    }
    return false;
  }

  #spawnSkid(x, y) {
    const s = this.#skids.find((s) => !s.active);
    if (s) {
      s.active = true;
      s.x = x;
      s.y = y;
      s.life = 1;
      s.el.classList.remove('hidden');
    }
  }

  #spawnCrash(x, y) {
    const colors = ['#ff4757', '#ffa502', '#ff6b81'];
    let spawned = 0;
    for (const p of this.#particles) {
      if (spawned >= 15) break;
      if (!p.active) {
        p.active = true;
        p.x = x + 25;
        p.y = y + 10;
        p.vx = (Math.random() - 0.5) * 1.5;
        p.vy = (Math.random() - 0.5) * 1.5 - 0.5;
        p.life = 1;
        p.style.backgroundColor =
          colors[Math.floor(Math.random() * colors.length)];
        const sz = Math.random() * 8 + 4;
        p.style.width = `${sz}px`;
        p.style.height = `${sz}px`;
        p.el.classList.remove('hidden');
        spawned++;
      }
    }
  }

  #updateParticles(dt) {
    for (const p of this.#particles) {
      if (!p.active) continue;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= 0.002 * dt;
      p.style.transform = `translate3d(${p.x}px, ${p.y}px, 0)`;
      p.style.opacity = p.life;
      if (p.life <= 0) {
        p.active = false;
        p.el.classList.add('hidden');
      }
    }
  }

  #checkNearMiss(p, e) {
    const gx = -20,
      gy = -20;
    return (
      p.x + gx < e.x + e.w - gx &&
      p.x + p.w - gx > e.x + gx &&
      p.y + gy < e.y + e.h - gy &&
      p.y + p.h - gy > e.y + gy
    );
  }

  #triggerNearMiss() {
    if (this.#nearMissTimer) clearTimeout(this.#nearMissTimer);
    this.#nearMissUI.classList.add('show-miss');
    this.#nearMissTimer = setTimeout(() => {
      this.#nearMissUI.classList.remove('show-miss');
    }, 600);
  }

  #gameOver() {
    this.#player.crash();
    this.#spawnCrash(this.#player.x, this.#player.y);
    this.#isPlaying = false;
    document.body.className = '';
    setTimeout(() => {
      this.#ui.onGameOver(this.#score, this.#coins);
    }, 500);
  }
}
