(() => {
  const tracks = {
    home: ['maria-la-portuguesa', 'María la Portuguesa', 0],
    garage: ['estudiantina-madrilena', 'Estudiantina Madrileña', 1.09],
    menu: ['las-cintas-de-mi-capa', 'Las cintas de mi capa', .42],
    intro: ['verbena-san-cayetano', 'Verbena de San Cayetano', .54],
    race: ['clavelitos', 'Clavelitos', .32],
    podium: ['todos-los-besos', 'Todos los besos', 1.01],
    results: ['soy-cordobes', 'Soy Cordobés', .56],
    reserve: ['isa-de-ronda', 'Isa de ronda', .1]
  };

  class Music {
    constructor(player) {
      this.player = player;
      this.enabled = true;
      this.unlocked = false;
      this.paused = false;
      this.ducked = false;
      this.volume = .65;
      this.scene = '';
      this.player.loop = true;
      player.addEventListener('loadedmetadata', () => {
        const seek = this.resumeAt || Number(player.dataset.offset);
        if (Number.isFinite(seek) && seek < player.duration) player.currentTime = seek;
      });
      player.addEventListener('playing', () => { this.retryAt = 0; });
      player.addEventListener('error', () => this.recover());
      for (const event of ['pause', 'waiting', 'stalled', 'ended']) {
        player.addEventListener(event, () => this.scheduleRecovery());
      }
      this.setScene('home');
    }

    canPlay() {
      return this.enabled && this.unlocked && !this.paused && !document.hidden;
    }

    load(key, resumeAt = 0) {
      const [file, title, offset] = tracks[key];
      this.source = key;
      this.resumeAt = resumeAt;
      this.player.dataset.scene = this.scene;
      this.player.dataset.title = title;
      this.player.dataset.offset = offset;
      this.player.src = 'musica/pistas/' + file + '.mp3';
    }

    play() {
      if (!this.canPlay() || !this.player.paused || this.attempt) return;
      const attempt = Promise.resolve(this.player.play());
      this.attempt = attempt;
      attempt.catch(error => {
        if (this.attempt !== attempt) return;
        if (error.name === 'NotAllowedError') {
          this.unlocked = false;
          return;
        }
        this.scheduleRecovery();
      }).finally(() => {
        if (this.attempt === attempt) this.attempt = null;
      });
    }

    scheduleRecovery() {
      if (!this.canPlay() || this.timer) return;
      const timestamp = this.player.currentTime;
      this.timer = setTimeout(() => {
        this.timer = 0;
        if (this.canPlay() && (this.player.paused || this.player.currentTime === timestamp)) this.recover();
      }, 2200);
    }

    recover() {
      if (!this.canPlay() || Date.now() < this.retryAt) {
        this.scheduleRecovery();
        return;
      }
      if (this.sourcesTried >= 3) {
        return;
      }
      this.retryAt = Date.now() + 1800;
      this.sourcesTried++;
      const retrySame = this.sourcesTried === 1;
      const next = retrySame ? this.source : this.sourcesTried === 2 ? 'reserve' : 'menu';
      const resumeAt = retrySame ? this.player.currentTime : 0;
      this.attempt = null;
      this.load(next, resumeAt);
      this.play();
      this.scheduleRecovery();
    }

    unlock() {
      if (!this.unlocked) {
        this.unlocked = true;
        this.sourcesTried = 0;
        if (this.player.error) this.recover();
      }
      this.play();
    }

    setScene(scene) {
      if (scene === this.scene) return;
      clearTimeout(this.timer);
      this.timer = 0;
      this.attempt = null;
      this.scene = scene;
      this.paused = false;
      this.ducked = false;
      this.sourcesTried = 0;
      this.retryAt = 0;
      this.load(scene);
      this.mix();
      this.play();
    }

    setEnabled(enabled) {
      this.enabled = enabled;
      if (enabled && this.sourcesTried >= 3) {
        this.sourcesTried = 0;
        this.retryAt = 0;
      }
      this.refresh();
    }

    pause(paused) {
      this.paused = paused;
      this.refresh();
    }

    refresh() {
      if (!this.canPlay()) {
        clearTimeout(this.timer);
        this.timer = 0;
        this.attempt = null;
        this.player.pause();
        return;
      }
      if (this.player.error) this.recover();
      else this.play();
    }

    setVolume(volume) {
      this.volume = Math.max(0, Math.min(1, volume));
      this.mix();
    }

    duck(ducked) {
      if (this.ducked === ducked) return;
      this.ducked = ducked;
      this.mix();
    }

    mix() {
      this.player.volume = this.volume * (this.ducked ? .14 : this.scene === 'race' ? .29 : .34);
      this.player.muted = this.volume === 0;
    }
  }

  globalThis.ATunaGas.Music = Music;
})();
