import { CAMPAIGN_STAGES } from './Config.js';
import Player from './Player.js';
import GameEngine from './GameEngine.js';
import AudioEngine from './AudioEngine.js';

class App {
  #player;
  #engine;
  #db;
  #dom;
  #audio;

  constructor() {
    this.#initDB();
    this.#cacheDOM();
    this.#audio = new AudioEngine();
    this.#initGame();
    this.#bindEvents();
    this.#boot();
  }

  #boot() {
    const pre = document.getElementById('preloader');
    const fill = document.querySelector('.loader-fill');
    if (pre && fill) {
      setTimeout(() => {
        fill.style.width = '100%';
      }, 100);
      setTimeout(() => {
        pre.style.opacity = '0';
        pre.style.visibility = 'hidden';
      }, 1600);
    }
  }

  #initDB() {
    this.#db = {
      totalCoins: parseInt(localStorage.getItem('neonRacerCoins')) || 0,
      engineLevel: parseInt(localStorage.getItem('neonRacerEngineLevel')) || 1,
      highestUnlockedStage:
        parseInt(localStorage.getItem('neonRacerUnlockedStage')) || 1,
    };
  }

  #save() {
    localStorage.setItem('neonRacerCoins', this.#db.totalCoins);
    localStorage.setItem('neonRacerEngineLevel', this.#db.engineLevel);
    localStorage.setItem(
      'neonRacerUnlockedStage',
      this.#db.highestUnlockedStage
    );
  }

  #cacheDOM() {
    this.#dom = {
      screens: {
        start: document.getElementById('start-screen'),
        gameOver: document.getElementById('game-over-screen'),
        garage: document.getElementById('garage-screen'),
        stageMap: document.getElementById('stage-select-screen'),
        victory: document.getElementById('victory-screen'),
      },
      text: {
        score: document.getElementById('score'),
        finalScore: document.getElementById('final-score'),
        runCoins: document.getElementById('run-coins'),
        totalCoins: document.getElementById('coin-count'),
        garageCoins: document.getElementById('garage-coins'),
        victoryCoins: document.getElementById('victory-coins'),
      },
      btns: {
        start: document.getElementById('start-btn'),
        restart: document.getElementById('restart-btn'),
        openGarage: document.getElementById('open-garage-btn'),
        closeGarage: document.getElementById('close-garage-btn'),
        upgradeEngine: document.getElementById('upg-engine'),
        backToMain: document.getElementById('back-to-main-btn'),
        victoryContinue: document.getElementById('victory-continue-btn'),
      },
      grid: document.getElementById('stage-grid'),
      wrapper: document.getElementById('game-wrapper'),
    };
    this.#dom.text.totalCoins.innerText = this.#db.totalCoins;
  }

  #initGame() {
    this.#player = new Player('player');
    this.#player.baseSpeed = 0.35 + this.#db.engineLevel * 0.05;

    const ui = {
      onUpdateScore: (s) => {
        if (Math.floor(s) % 10 === 0)
          this.#dom.text.score.innerText = Math.floor(s);
      },
      onGameOver: (final, earned) => {
        this.#audio.playCrash();
        this.#dom.wrapper.classList.add('shake');
        setTimeout(() => this.#dom.wrapper.classList.remove('shake'), 400);
        this.#dom.text.finalScore.innerText = Math.floor(final);
        this.#dom.text.runCoins.innerText = earned;
        this.#db.totalCoins += earned;
        this.#save();
        this.#dom.text.totalCoins.innerText = this.#db.totalCoins;
        document.body.className = '';
        this.#dom.screens.gameOver.classList.remove('hidden');
      },
      onVictory: (stageId, earned) => {
        this.#audio.playCoin();
        if (
          stageId >= this.#db.highestUnlockedStage &&
          stageId < CAMPAIGN_STAGES.length
        ) {
          this.#db.highestUnlockedStage = stageId + 1;
        }
        const bonus = 50;
        const total = earned + bonus;
        this.#db.totalCoins += total;
        this.#save();
        this.#dom.text.totalCoins.innerText = this.#db.totalCoins;
        this.#dom.text.victoryCoins.innerText = `${total} (includes ${bonus}🪙 bonus!)`;
        document.body.className = '';
        this.#dom.screens.victory.classList.remove('hidden');
      },
    };

    this.#engine = new GameEngine(this.#player, ui);
  }

  #renderMap() {
    this.#dom.grid.innerHTML = '';
    for (const stage of CAMPAIGN_STAGES) {
      const btn = document.createElement('button');
      const locked = stage.id > this.#db.highestUnlockedStage;
      btn.className = `stage-btn ${locked ? 'locked' : ''}`;
      btn.innerHTML = `
        <h3>STAGE ${stage.id}</h3>
        <span>${stage.name}</span>
        ${locked ? '<span>🔒 LOCKED</span>' : `<span>🎯 ${stage.targetScore}m</span>`}
      `;
      if (!locked) {
        btn.addEventListener('click', () => {
          this.#dom.screens.stageMap.classList.add('hidden');
          this.#engine.start(stage);
        });
        btn.addEventListener('touchend', (e) => {
          e.preventDefault();
        });
      }
      this.#dom.grid.appendChild(btn);
    }
  }

  #updateGarage() {
    this.#dom.text.garageCoins.innerText = this.#db.totalCoins;
    const cost = this.#db.engineLevel * 50;
    this.#dom.btns.upgradeEngine.innerText = `⚡ Upgrade (Lvl ${this.#db.engineLevel + 1}) — ${cost}🪙`;
  }

  #bindEvents() {
    // Touch controls
    const btnL = document.getElementById('btn-left');
    const btnR = document.getElementById('btn-right');
    const btnB = document.getElementById('btn-boost');

    const attachTouch = (el, onStart, onEnd) => {
      if (!el) return;
      const start = (e) => {
        e.preventDefault();
        onStart();
        el.classList.add('active');
      };
      const end = (e) => {
        e.preventDefault();
        onEnd();
        el.classList.remove('active');
      };
      el.addEventListener('touchstart', start, { passive: false });
      el.addEventListener('touchend', end, { passive: false });
      el.addEventListener('touchcancel', end, { passive: false });
      el.addEventListener('mousedown', start);
      el.addEventListener('mouseup', end);
      el.addEventListener('mouseleave', end);
    };

    attachTouch(
      btnL,
      () => this.#player.setTouchLeft(true),
      () => this.#player.setTouchLeft(false)
    );
    attachTouch(
      btnR,
      () => this.#player.setTouchRight(true),
      () => this.#player.setTouchRight(false)
    );
    attachTouch(
      btnB,
      () => this.#player.setTouchBoost(true),
      () => this.#player.setTouchBoost(false)
    );

    // Menu buttons
    const click = (el, fn) => {
      if (!el) return;
      el.addEventListener('click', (e) => {
        e.preventDefault();
        fn();
      });
      el.addEventListener('touchend', (e) => {
        e.preventDefault();
        fn();
      });
    };

    click(this.#dom.btns.start, () => {
      this.#audio.init();
      this.#dom.screens.start.classList.add('hidden');
      this.#renderMap();
      this.#dom.screens.stageMap.classList.remove('hidden');
    });

    click(this.#dom.btns.backToMain, () => {
      this.#dom.screens.stageMap.classList.add('hidden');
      this.#dom.screens.start.classList.remove('hidden');
    });

    click(this.#dom.btns.victoryContinue, () => {
      this.#dom.screens.victory.classList.add('hidden');
      this.#renderMap();
      this.#dom.screens.stageMap.classList.remove('hidden');
    });

    click(this.#dom.btns.restart, () => {
      this.#dom.screens.gameOver.classList.add('hidden');
      this.#renderMap();
      this.#dom.screens.stageMap.classList.remove('hidden');
    });

    click(this.#dom.btns.openGarage, () => {
      if (!this.#engine.isRunning) {
        this.#updateGarage();
        this.#dom.screens.start.classList.add('hidden');
        this.#dom.screens.gameOver.classList.add('hidden');
        this.#dom.screens.garage.classList.remove('hidden');
      }
    });

    click(this.#dom.btns.closeGarage, () => {
      this.#dom.screens.garage.classList.add('hidden');
      this.#dom.screens.start.classList.remove('hidden');
    });

    click(this.#dom.btns.upgradeEngine, () => {
      const cost = this.#db.engineLevel * 50;
      if (this.#db.totalCoins >= cost) {
        this.#db.totalCoins -= cost;
        this.#db.engineLevel++;
        this.#save();
        this.#player.baseSpeed = 0.35 + this.#db.engineLevel * 0.05;
        this.#updateGarage();
        this.#dom.text.totalCoins.innerText = this.#db.totalCoins;
      } else {
        const orig = this.#dom.btns.upgradeEngine.innerText;
        this.#dom.btns.upgradeEngine.innerText = '❌ NOT ENOUGH';
        this.#dom.btns.upgradeEngine.style.borderColor = 'red';
        this.#dom.btns.upgradeEngine.style.color = 'red';
        setTimeout(() => {
          this.#dom.btns.upgradeEngine.innerText = orig;
          this.#dom.btns.upgradeEngine.style.borderColor = '';
          this.#dom.btns.upgradeEngine.style.color = '';
        }, 1000);
      }
    });

    // Prevent page scroll on touch
    document.addEventListener(
      'touchmove',
      (e) => {
        if (e.target.closest('.game-wrapper')) e.preventDefault();
      },
      { passive: false }
    );
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new App();
});
