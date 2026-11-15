(() => {
  const game=globalThis.ATunaGas;
  const amounts={bottle:7, spike:4};
  const spikeDuration=.86;
  class TrackItems {
    constructor(track, occupied, random=Math.random) {
      this.track=track;
      this.fixed=occupied;
      this.random=random;
      this.entries=[];
      for(const kind of Object.keys(amounts)) {
        for(let i=0;i<amounts[kind];i++){
          const item={kind, segment:i, active:false, wake:0};
          this.entries.push(item);
          this.place(item);
        }
      }
    }

    place(item, blocked=[]) {
      const {track,random}=this;
      for(let retry=0;retry<80;retry++){
        // Distribute pickups along the lap; the exact distance and side vary each time.
        const fraction=.07+.89*((item.segment+random())/amounts[item.kind]);
        const s=fraction*track.total;
        const lane=track.roadAt(s)*(.96*random()-.48);
        const pose=track.at(s,lane);
        const near=[...this.fixed,...this.entries.filter(candidate=>candidate.active),...blocked];
        if(near.some(point=>(point.x-pose.x)**2+(point.y-pose.y)**2<56**2))continue;
        Object.assign(item,pose,{active:true,s});
        return;
      }
      item.wake+=2;
    }

    update(time, player) {
      for(const item of this.entries){
        if(!item.active && time>=item.wake)this.place(item,[player]);
      }
    }

    take(item,time) {
      item.active=false;
      item.wake=time+11+this.random()*7;
    }
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
      ellipse(ctx,'#ffd36e32',item.x,item.y+6,17,10);
      drawBottle(ctx,item.x,item.y-5+lift,1.05);
      if(Math.sin(time*5+item.y)>.2)rect(ctx,'#ffe4a6',item.x+8,item.y-17+lift,2,2);
    } else if(spike?.naturalWidth) {
      ellipse(ctx,'#ef9c6a44',item.x,item.y,19,13);
      ctx.drawImage(spike,item.x-17,item.y-17,34,34);
    }
  }

  game.roadObjects={TrackItems,spikeDuration,ready,draw,drawBottle};
})();
