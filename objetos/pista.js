(() => {
  const game=globalThis.ATunaGas;
  const radii = {bottle: 38, box: 37, spike: 25};
  const spikeDuration=.86;
  class TrackItems {
    constructor(track, occupied, random=Math.random) {
      this.amounts = {bottle: 7, box: Math.min(12, Math.max(7, Math.round(track.total / 600))), spike: 4};
      this.track=track;
      this.fixed=occupied;
      this.random=random;
      this.entries=[];
      for(const [kind, count] of Object.entries(this.amounts)) {
        for(let i=0;i<count;i++){
          const item={kind, segment:i, active:false, wake:0};
          this.entries.push(item);
          this.place(item);
        }
      }
    }

    place(item, blocked=[], time=0) {
      const {track,random}=this;
      const near=[...this.fixed,...this.entries.filter(candidate=>candidate.active),...blocked];
      for(let retry=0;retry<80;retry++){
        // Distribute pickups along the lap; the exact distance and side vary each time.
        const fraction=.045+.92*((item.segment + .12 + random() * .76)/this.amounts[item.kind]);
        const s=fraction*track.total;
        const lane=track.roadAt(s)*(1.22*random()-.61);
        const pose=track.at(s,lane);
        if(near.some(point=>(point.x-pose.x)**2+(point.y-pose.y)**2<64**2))continue;
        Object.assign(item,pose,{active:true,s});
        return;
      }
      item.wake=time+2;
    }

    update(time, cars) {
      for(const item of this.entries){
        if(!item.active && time>=item.wake)this.place(item,cars,time);
      }
    }

    take(item,time) {
      item.active=false;
      item.wake=time+(item.kind==='box'?16:11)+this.random()*7;
    }
  }

  function touches(item, car) {
    const dx = car.x - car.previousX;
    const dy = car.y - car.previousY;
    const length2 = dx * dx + dy * dy;
    const t = length2 > 0 && length2 < 28 ** 2
      ? Math.max(0, Math.min(1, ((item.x - car.previousX) * dx + (item.y - car.previousY) * dy) / length2))
      : 1;
    const x = t === 1 ? car.x : car.previousX + t * dx;
    const y = t === 1 ? car.y : car.previousY + t * dy;
    return (x - item.x) ** 2 + (y - item.y) ** 2 <= radii[item.kind] ** 2;
  }

  function drawBottle(ctx, x, y, scale=1) {
    const {rect,poly}=game.drawing;
    ctx.save();
    ctx.translate(Math.round(x),Math.round(y));
    ctx.scale(scale,scale);
    poly(ctx,[[-4,-16],[4,-16],[4,-8],[7,-5],[7,15],[-7,15],[-7,-5],[-4,-8]],'#242029');
    rect(ctx,'#78432e',-5,-3,10,16);
    rect(ctx,'#ab6235',-3,-4,4,17);
    rect(ctx,'#e1a65b',-3,-6,2,18);
    rect(ctx,'#ae642e',-2,-13,4,8);
    rect(ctx,'#d7c275',-4,-16,8,3);
    rect(ctx,'#e4b35b',-6,-2,12,12);
    rect(ctx,'#93343c',-5,0,10,8);
    rect(ctx,'#fbd587',-2,1,5,1);
    rect(ctx,'#fbd587',-3,2,2,4);
    rect(ctx,'#fbd587',-2,6,5,1);
    rect(ctx,'#d48342',-4,12,6,1);
    ctx.restore();
  }

  let spike;
  const ready=typeof Image==='undefined'?Promise.resolve():new Promise((resolve,reject)=>{
    spike=new Image();
    spike.onload=resolve;
    spike.onerror=()=>reject(Error('Falta el icono del obstáculo'));
    spike.src='objetos/arte/cruz-con-pinchos.png';
  });

  function draw(ctx, item, time) {
    const {ellipse,rect}=game.drawing;
    if(item.kind==='bottle') {
      const lift=Math.round(Math.sin(time*4+item.x)*3);
      ellipse(ctx,'#ffd36e48',item.x,item.y,26,14);
      drawBottle(ctx,item.x,item.y-6+lift,1.35);
      if(Math.sin(time*5+item.y)>.2)rect(ctx,'#ffe4a6',item.x+8,item.y-17+lift,2,2);
    } else if (item.kind === 'box') {
      const y = Math.round(item.y + Math.sin(time * 5 + item.s) * 3);
      const x = Math.round(item.x);
      ellipse(ctx, '#f36c5755', x, item.y + 7, 23, 13);
      rect(ctx, '#302332', x-16, y-17, 32, 31);
      rect(ctx, '#871f34', x-14, y-14, 28, 25);
      rect(ctx, '#d03a44', x-13, y-17, 23, 24);
      rect(ctx, '#ff8f68', x-13, y-17, 22, 3);
      rect(ctx, '#ffab81', x-12, y-14, 2, 19);
      ctx.save();
      ctx.font = '900 23px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#fff0a5';
      ctx.fillText('?', x-1, y-3);
      ctx.restore();
    } else if(spike?.naturalWidth) {
      ellipse(ctx,'#ef9c6a44',item.x,item.y,19,13);
      ctx.drawImage(spike,item.x-17,item.y-17,34,34);
    }
  }

  game.roadObjects={TrackItems,spikeDuration,ready,draw,drawBottle,touches,radii};
})();
