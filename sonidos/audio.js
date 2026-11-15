(() => {
  const patterns = {
    tick: [[420, 0, .11]], go: [[720, 0, .21], [960, .13, .25]],
    boost: [[298, 0, .13], [474, .06, .13], [724, .12, .19]],
    shield: [[466, 0, .2], [698, .08, .22]], bump: [[77, 0, .14], [56, .035, .11]],
    boxPush: [[229, 0, .12], [483, .05, .19], [717, .11, .22]],
    boxSlow: [[362, 0, .13], [238, .08, .16], [112, .19, .21]],
    pickup: [[520, 0, .1], [780, .07, .13]],
    bottleTurbo: [[210,0,.12],[310,.065,.14],[495,.12,.16],[782,.18,.20]],
    spin: [[166,0,.15],[313,.07,.13],[138,.13,.22]],
    guitar: [[196,0,.25],[247,.04,.26],[293,.08,.27],[392,.12,.31],[330,.39,.19],[392,.49,.34]],
    strings: [[294,0,.18],[370,.047,.19],[440,.105,.2],[494,.22,.25],[587,.34,.31]],
    tambourine: [[138,0,.09],[192,.08,.08],[165,.14,.085],[234,.30,.11],[198,.383,.13]],
    finish: [[392, 0, .24], [494, .14, .24], [587, .28, .24], [784, .42, .42]]
  };

  class GameAudio {
    constructor() { this.enabled = true; }

    unlock() {
      const AudioContext = globalThis.AudioContext || globalThis.webkitAudioContext;
      if (!this.enabled || !AudioContext) return;
      if (!this.context) {
        this.context = new AudioContext();
        this.main = this.context.createGain();
        this.main.gain.value = .28;
        this.main.connect(this.context.destination);
        this.engine = this.context.createOscillator();
        this.engine.type = 'triangle';
        this.throttle = this.context.createGain();
        this.throttle.gain.value = 0;
        this.engine.connect(this.throttle).connect(this.main);
        this.engine.start();
      }
      if (this.context.state === 'suspended') this.context.resume().catch(() => {});
    }

    toggle() {
      this.enabled = !this.enabled;
      if (this.enabled) this.unlock();
      if (this.main) this.main.gain.setTargetAtTime(this.enabled ? .28 : 0, this.context.currentTime, .015);
      return this.enabled;
    }

    motor(speed, active) {
      if (!this.engine) return;
      const time = this.context.currentTime;
      this.engine.frequency.setTargetAtTime(38 + Math.abs(speed) * .45, time, .06);
      this.throttle.gain.setTargetAtTime(active ? .05 + Math.min(.09, Math.abs(speed) / 5500) : 0, time, .055);
    }

    effect(name) {
      if (!this.enabled || !this.context) return;
      for (const [pitch, offset, length] of patterns[name]) {
        const time = this.context.currentTime + offset;
        const oscillator = this.context.createOscillator();
        const envelope = this.context.createGain();
        oscillator.type = name === 'bump' || name === 'tambourine' ? 'sawtooth' : 'triangle';
        oscillator.frequency.value = pitch;
        envelope.gain.setValueAtTime(.001, time);
        envelope.gain.exponentialRampToValueAtTime(.30, time + .014);
        envelope.gain.exponentialRampToValueAtTime(.001, time + length);
        oscillator.connect(envelope).connect(this.main);
        oscillator.start(time);
        oscillator.stop(time + length + .01);
      }
    }
  }
  globalThis.ATunaGas.GameAudio = GameAudio;
})();
