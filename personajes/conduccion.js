(() => {
  const game = globalThis.ATunaGas;
  // Hair, beard and glasses are drawn on a crown facing the nose of the kart.
  const features = {
    pandereta:['wave','#706358','#7a665b','clear',10.4], guitarra:['bald','#715144',null,null,8.5],
    bandurria:['wave','#231e25','#30272b',null,9.6], 'guitarra-gafas':['grey','#6b6871',null,null,8.7],
    laud:['short','#604036','#745042',null,8.6], andres:['short','#2e2528','#46302b',null,9.9],
    coki:['short','#34262c',null,'sun',8.9], legia:['receding','#2e2329','#55403a',null,9.6],
    'pedro-v':['slick','#2c2530',null,null,9.1], ponder:['wave','#5a4b48','#79685f',null,9.6],
    pena:['receding','#3d3032','#463635',null,8.1], canero:['swept','#6a4433',null,null,9.4],
    'paco-canero':['crest','#2d2429','#574236',null,8.5], josan:['crest','#2d2428','#33262b',null,9.3],
    'el-casi':['swept','#2e262c','#43332e',null,8.9]
  };

  function drawDriver(ctx, pilot, motion, time) {
    const {poly,rect,ellipse} = game.drawing;
    const [hair,shade,beard,glasses,width] = features[pilot.id];
    const steer = Math.max(-1, Math.min(1, motion.steer || 0));
    const pitch = motion.braking ? -1.2 : (motion.speed || 0) * .002;
    const headX = steer * 1.7;
    const headY = 5 + pitch + Math.sin(time * 12) * (motion.speed ? .35 : .17);
    const skin = '#d88f59';
    const shine = '#ffc992';
    ctx.save();
    ellipse(ctx,'#090e1a',0,9,15,13);
    poly(ctx,[[-14,10],[-14,4],[-9,0],[8,0],[14,4],[14,12],[9,18],[-9,18]],'#242633');
    poly(ctx,[[-13,7],[-8,3],[-3,7],[3,7],[8,3],[13,7],[8,14],[4,11],[0,15],[-5,11],[-8,14]],'#aa253d');
    poly(ctx,[[-13,7],[-8,3],[-2,8],[-5,10],[-10,11]],'#e8494e');
    poly(ctx,[[3,8],[8,3],[13,7],[9,11],[5,11]],'#ef4750');
    rect(ctx,'#efdfbd',-3,4,6,4);
    rect(ctx,'#ffd172',6,10,2,2);
    poly(ctx,[[-13,10],[-11,10],[-9,16],[-11,17],[-14,14]],'#b8293d');
    poly(ctx,[[13,10],[11,10],[9,16],[11,17],[14,14]],'#d14146');
    rect(ctx,'#e7dbc2',-2,15,4,2);
    ctx.strokeStyle='#454554';
    ctx.lineCap='round';
    ctx.lineWidth=5;
    for (const side of [-1,1]) {
      ctx.beginPath();
      ctx.moveTo(side*11,7);
      ctx.lineTo(side*13,-1);
      ctx.lineTo(side*8+steer*1.5,-10+side*steer*3);
      ctx.stroke();
    }
    ctx.save();
    ctx.translate(steer*1.5,-10);
    ctx.rotate(steer*.35);
    ctx.strokeStyle='#0c0f18';
    ctx.lineWidth=3.3;
    ctx.beginPath();
    ctx.ellipse(0,0,9.6,5.6,0,0,Math.PI*2);
    ctx.stroke();
    ctx.strokeStyle='#a59990';
    ctx.lineWidth=1;
    ctx.beginPath();
    ctx.ellipse(0,-.5,8.8,4.9,0,Math.PI,Math.PI*2);
    ctx.moveTo(-7,-1); ctx.lineTo(0,1); ctx.lineTo(7,-1);
    ctx.moveTo(0,1); ctx.lineTo(0,5);
    ctx.stroke();
    ellipse(ctx,'#393747',0,.4,2.9,2);
    for(const side of [-1,1]){
      ellipse(ctx,'#eee4d0',side*9,1.7,2.9,2.5);
      ellipse(ctx,skin,side*8.5,-.1,2.65,2.55);
      rect(ctx,shine,side*8.5-1,-2,2,1);
    }
    ctx.restore();

    ctx.translate(headX,headY);
    const w = width;
    ellipse(ctx,'#101521',1,1,w+1.8,10);
    ellipse(ctx,'#b2724f',-w+1,-2,2.3,3);
    ellipse(ctx,'#a56b4b',w-1,-2,2.3,3);
    ellipse(ctx,skin,0,-1,w,9.2);
    poly(ctx,[[-w+2,-5],[-3,-9],[4,-8],[w-1,-4],[4,-3],[-3,-4]],'#ecae77');
    rect(ctx,shine,-2,-11,3,2); // nose points to the front
    if(beard) poly(ctx,[[-w+1,-4],[-5,-8],[-3,-8],[-1,-6],[1,-6],[4,-8],[w-1,-4],[w-1,0],[4,-1],[-4,-1],[-w+2,0]],beard);
    if(hair === 'bald'){
      // The temples frame the scalp. Leave the whole crown visibly bare.
      poly(ctx,[[-w,-4],[-w+2,-4],[-w+2,2],[-w+3,5],[-w+1,7],[-w,5]],shade);
      poly(ctx,[[w-2,-4],[w,-4],[w,5],[w-2,7],[w-3,5],[w-2,2]],shade);
      ellipse(ctx,'#ffc894',-2,1,3.7,4.8);
      rect(ctx,'#eeb082',-3,5,5,2);
    } else {
      const crown = [[-w,-2],[-w+1,-5],[-w+4,-5],[-w+5,-7],[0,-8],[w-4,-6],[w-1,-4],[w,1],
        [w-1,6],[w-4,9],[0,10],[-w+4,9],[-w+1,6]];
      if (hair === 'receding') { crown[3][1]=-3; crown[4][1]=-5; crown[5][1]=-3; }
      if (hair === 'crest') { crown[3][1]=-9; crown[4][1]=-10; crown[5][1]=-8; }
      if (hair === 'wave') { crown[2][1]=-7; crown[5][1]=-8; crown[8][0]=w+1; }
      if (hair === 'swept') { crown[3][1]=-9; crown[5][1]=-3; }
      poly(ctx,crown,shade);
      const glint = hair === 'grey' ? '#a5a0a4' : hair === 'wave' ? '#958075' : '#786055';
      poly(ctx,[[-w+2,3],[-w+2,0],[-3,-4],[2,-4],[w-2,-2],[3,-1],[-3,2],[-5,6]],glint);
      rect(ctx,hair === 'grey' ? '#c7b9ad' : '#4a3532',-w+3,6,3,2);
      if (hair === 'slick' || hair === 'swept') rect(ctx,glint,-w+3,4,5,1);
    }
    if(glasses){
      for(const side of [-1,1]){
        rect(ctx,'#1b202b',side*4-3,-8.5,6,3);
        rect(ctx,glasses==='sun' ? '#4492a0' : '#dfbdab',side*4-2,-8.5,4,1.1);
      }
      rect(ctx,'#2a2630',-2,-8,4,1);
    }
    ctx.restore();
  }

  const heads = new Map();
  function preparePortrait(id, image) {
    const face = document.createElement('canvas');
    face.width = 80;
    face.height = 88;
    const ctx = face.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    const [x,y,w,h,eyes]=game.frames[id];
    const sx=image.naturalWidth/192, sy=image.naturalHeight/320;
    const scale=66/h;
    const dw=w*scale;
    ctx.drawImage(image,x*sx,y*sy,w*sx,h*sy,Math.round((80-dw)/2),Math.round(38-(eyes-y)*scale),dw,h*scale);
    heads.set(id,face);
  }

  game.portrait = {drawDriver, preparePortrait, heads};
})();
