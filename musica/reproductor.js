(() => {
  const music = {
    home: ['maria-la-portuguesa','María la Portuguesa',0],
    garage: ['estudiantina-madrilena','Estudiantina Madrileña',1.09],
    menu: ['las-cintas-de-mi-capa','Las cintas de mi capa',.42],
    intro: ['verbena-san-cayetano','Verbena de San Cayetano',.54],
    race: ['clavelitos','Clavelitos',.32],
    turbo: ['isa-de-ronda','Isa de ronda',.1],
    podium: ['todos-los-besos','Todos los besos',1.01],
    results: ['soy-cordobes','Soy Cordobés',.56]
  };

  class Music {
    constructor(main, accent) {
      this.main=main;
      this.accent=accent;
      this.enabled=true;
      this.unlocked=false;
      this.paused=false;
      this.ducked=false;
      this.scene='';
      this.activeBoost=false;
      this.main.loop=true;
      for(const player of [main, accent]){
        player.addEventListener('loadedmetadata',()=> {
          const offset=Number(player.dataset.offset);
          if(Number.isFinite(offset) && offset<player.duration) player.currentTime=offset;
        });
      }
      this.load(accent,'turbo');
      this.setScene('home');
    }

    load(player, scene) {
      const [file,title,offset]=music[scene];
      player.pause();
      player.dataset.scene=scene;
      player.dataset.title=title;
      player.dataset.offset=offset;
      player.src='musica/pistas/'+file+'.mp3';
    }

    play(player) {
      if (!this.enabled || !this.unlocked || this.paused || document.hidden) return;
      player.play().catch(()=>{});
    }

    unlock() {
      this.unlocked=true;
      this.play(this.main);
    }

    setScene(scene) {
      if(scene===this.scene) return;
      this.scene=scene;
      this.paused=false;
      this.ducked=false;
      this.setBoost(false);
      this.load(this.main,scene);
      this.mix();
      this.play(this.main);
    }

    setEnabled(enabled) {
      this.enabled=enabled;
      this.refresh();
    }

    pause(paused) {
      this.paused=paused;
      this.refresh();
    }

    refresh() {
      if(this.paused || !this.enabled || document.hidden) {
        this.main.pause();
        this.accent.pause();
      } else {
        this.play(this.main);
        if(this.activeBoost) this.play(this.accent);
      }
    }

    duck(ducked) {
      if(this.ducked===ducked)return;
      this.ducked=ducked;
      this.mix();
    }

    setBoost(active) {
      if(active===this.activeBoost) return;
      this.activeBoost=active;
      if(active) {
        if(this.accent.readyState>=1) this.accent.currentTime=Number(this.accent.dataset.offset);
        this.play(this.accent);
      } else this.accent.pause();
      this.mix();
    }

    mix() {
      this.main.volume=this.ducked ? .047 : this.activeBoost ? .065 : this.scene==='race' ? .13 : .16;
      this.accent.volume=.16;
    }
  }

  globalThis.ATunaGas.Music=Music;
})();
