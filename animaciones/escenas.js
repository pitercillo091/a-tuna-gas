(() => {
  const game = globalThis.ATunaGas;
  const {rect,ellipse,poly} = game.drawing;
  const assetImages = new Map();
  const ready = Promise.all(Object.entries(game.atlas).map(([id, asset]) => new Promise((resolve,reject) => {
    const image = new Image();
    image.onload = () => {assetImages.set(id,image); resolve();};
    image.onerror = () => reject(new Error('Falta el atlas de ' + id));
    image.src = asset.src;
  })));
  const roleOnPodium = pilot => ['Baile','Acompañante'].includes(pilot.role) ? 'Pandereta de podio' : pilot.role;

  function introCar(ctx, entrant, t, side) {
    const {vehicle, character} = entrant;
    const f = side ? 23 : 0;
    const bob = Math.round(Math.sin(t*19)*1.3);
    const face = game.portrait.heads.get(character.id);
    const glance = Math.round(Math.sin(t*4)*3);
    ctx.save();
    ctx.translate(448 + f,177+bob);
    ellipse(ctx,'#151d2cd0',8,91,206,29);
    for(const x of [-141,122]) {
      ellipse(ctx,'#151923',x,54,42,51);
      ellipse(ctx,'#354250',x+3,56,31,46);
      ellipse(ctx,'#52626a',x+side*11,58,19,28);
      ellipse(ctx,'#1d2935',x+side*11,57,12,18);
    }
    poly(ctx,[[-135,11],[-106,-25],[-94,-58],[-53,-73],[58,-73],[105,-45],[133,-14],[154,57],
      [118,89],[-124,89],[-156,59]],'#111c2b');
    poly(ctx,[[-130,-4],[-102,-28],[-91,-54],[-55,-65],[56,-65],[96,-38],[127,-10],[145,53],
      [111,80],[-118,80],[-144,52]],vehicle.color);
    poly(ctx,[[-122,11],[-91,-31],[-75,-44],[73,-44],[119,-5],[137,41],[112,64],[-127,62],[-140,42]],vehicle.light);
    poly(ctx,[[-88,-4],[-74,-43],[-49,-60],[55,-60],[86,-36],[96,-4]],'#222b3c');
    ellipse(ctx,'#393948',-f,8,56,47);
    poly(ctx,[[-57,18],[-53,-21],[-33,-34],[28,-34],[53,-17],[57,28]],'#21222b');
    poly(ctx,[[-49,4],[-31,-26],[-7,-10],[2,-3],[-9,8]],'#e44248');
    poly(ctx,[[48,4],[30,-26],[9,-10],[-1,-3],[9,8]],'#b5293b');
    if(face){
      const tilt=(side?-.025:.02)*Math.sin(t*5);
      ctx.save();
      ctx.translate(glance-f*.3,-63+Math.sin(t*8));
      ctx.rotate(tilt);
      ctx.shadowColor='#0c151bb0';
      ctx.shadowBlur=4;
      ctx.drawImage(face,-35,-40,70,77);
      ctx.restore();
    }
    ctx.strokeStyle='#111923';
    ctx.lineWidth=9;
    ctx.beginPath();
    ctx.ellipse(-f*.2,4,34,15,Math.sin(t*4)*.08,0,Math.PI*2);
    ctx.stroke();
    ctx.lineWidth=2;
    ctx.strokeStyle='#aa9b90';
    ctx.beginPath(); ctx.ellipse(-f*.2,3,31,12,0,Math.PI,Math.PI*2); ctx.stroke();
    for(const d of [-1,1]){
      ellipse(ctx,'#f7e5cb',d*35-f*.2,8,10,7);
      ellipse(ctx,'#e7a675',d*31-f*.2,4+Math.sin(t*4)*d*2,10,7);
    }

    poly(ctx,[[-140,32],[-107,11],[99,11],[144,35],[120,81],[-121,81]],vehicle.color);
    poly(ctx,[[-101,13],[104,13],[125,33],[105,44],[-103,44],[-128,33]],vehicle.light);
    if(vehicle.shape==='rocket'){
      poly(ctx,[[-25,14],[26,14],[54,63],[0,81],[-54,63]],'#ffcf75');
      rect(ctx,'#795267',-139,58,278,13);
      rect(ctx,'#ffb966',-143,52,286,6);
      for(const x of [-96,87]) rect(ctx,'#b9d7d5',x,68,12,15);
    } else if(vehicle.shape==='stone'){
      for(const [x,y,c] of [[-86,29,'#c8c8ba'],[-45,21,'#9d9ca1'],[7,21,'#cfcaaf'],[49,28,'#a5b1b3'],[81,51,'#b9a496']]){
        poly(ctx,[[x-20,y],[x-12,y-12],[x+9,y-15],[x+20,y-1],[x+14,y+16],[x-12,y+14]],c);
      }
    } else if(vehicle.shape==='lantern'){
      for(const x of [-92,84]){
        rect(ctx,'#372d51',x-9,-48,25,37);
        rect(ctx,'#8ad6ba',x-6,-44,19,27);
        rect(ctx,'#e2ffc9',x-3,-41,9,20);
        rect(ctx,'#52466a',x+3,-44,3,25);
      }
      ellipse(ctx,'#b1e4be',3,37,18,16);
      ellipse(ctx,vehicle.color,10,31,15,14);
    } else if(vehicle.shape==='ribbon'){
      poly(ctx,[[0,65],[-58,43],[-47,28],[-19,21],[17,21],[47,28],[59,42]],'#ffe0a5');
      for(let i=-4;i<=4;i++) poly(ctx,[[0,62],[i*12,31+Math.abs(i)*3],[i*12+2,31+Math.abs(i)*3]],'#dd9c86');
      for(const s of [-1,1]) poly(ctx,[[s*117,53],[s*163,55],[s*177,64+Math.sin(t*12)*5],[s*125,65]],'#f1a7c5');
    } else if(vehicle.shape==='boiler'){
      ellipse(ctx,'#704038',0,39,48,25);
      ellipse(ctx,'#ffbd77',0,34,43,21);
      ellipse(ctx,'#51383c',0,31,27,14);
      for(const x of [-109,98]) {rect(ctx,'#4b9d94',x,8,11,44);rect(ctx,'#95ddd0',x,10,3,39);}
    } else {
      for(let i=-6;i<=6;i++)rect(ctx,i%2?'#7c5c42':'#bd975b',-79,17+i*4+24,162,1.5);
      ellipse(ctx,'#eed096',0,49,37,23);
      ellipse(ctx,'#8b6f4e',0,49,28,17);
      ellipse(ctx,'#d3ab71',0,49,22,13);
      ellipse(ctx,'#856545',0,49,9,7);
      for(const s of [-1,1]) poly(ctx,[[s*107,22],[s*163,17+Math.sin(t*9)*4],[s*134,43],[s*114,49]],'#a7c977');
    }
    for(const x of [-112,84]){
      rect(ctx,'#222937',x-3,57,34,21);
      rect(ctx,vehicle.shape==='lantern'?'#a5e3b7':'#efc780',x,58,28,14);
      rect(ctx,'#fff1bc',x+4,60,16,4);
    }
    ctx.restore();
  }

  function paintFront(ctx,entrant,x,y,scale,tilt=0) {
    ctx.save();
    ctx.translate(x,y);
    ctx.rotate(tilt);
    ctx.scale(scale,scale);
    ctx.translate(-448,-177);
    introCar(ctx,entrant,0,0);
    ctx.restore();
  }

  function gridPortrait(canvas,entrant) {
    const ctx=canvas.getContext('2d');
    ctx.imageSmoothingEnabled=false;
    const wash=ctx.createRadialGradient(canvas.width/2,canvas.height*.40,12,canvas.width/2,canvas.height*.42,canvas.width*.57);
    wash.addColorStop(0,'#4b5b66');
    wash.addColorStop(1,'#253540');
    rect(ctx,wash,0,0,canvas.width,canvas.height);
    const scale=Math.min(canvas.width/460,canvas.height/240);
    ctx.save();
    ctx.translate(canvas.width/2-448*scale,canvas.height*.51-171*scale);
    ctx.scale(scale,scale);
    introCar(ctx,entrant,0,0);
    ctx.restore();
  }

  function intro(canvas,entrant,time,angle,track,background) {
    const ctx=canvas.getContext('2d');
    ctx.imageSmoothingEnabled=false;
    ctx.drawImage(background,0,0,canvas.width,canvas.height);
    rect(ctx,'#131c29b2',0,0,canvas.width,canvas.height);
    const halo=ctx.createRadialGradient(450,170,24,450,170,320);
    halo.addColorStop(0,(track.palette?.highlight||'#f4c583')+'55'); halo.addColorStop(1,'#16212e00');
    rect(ctx,halo,0,0,canvas.width,canvas.height);
    for(let x=18;x<900;x+=30) rect(ctx,(x%60===18?'#e2bb83':'#523946')+'b0',x,287,27,5);
    introCar(ctx,entrant,time,angle);
  }

  function atlasFrame(ctx, pilot, row, t, reaction) {
    const img=assetImages.get(pilot.id);
    const count=img.naturalWidth/192;
    const col=Math.floor(t)%count;
    const x=col*192, y=row*320;
    if(!reaction) {
      ctx.drawImage(img,x,y,192,320,0,0,192,320);
      return;
    }
    const shoulder=152;
    ctx.drawImage(img,x,y+shoulder,192,320-shoulder,0,shoulder,192,320-shoulder);
    ctx.save();
    const {shrug,bend,headAngle}=reaction;
    ctx.transform(1,0,bend,shrug,-bend*shoulder,(1-shrug)*shoulder);
    const [left,top,faceWidth,faceHeight]=game.frames[pilot.id];
    const split=top+faceHeight-5;
    ctx.drawImage(img,x,y+split,192,shoulder-split,0,split,192,shoulder-split);
    ctx.translate(left+faceWidth/2,split);
    ctx.rotate(headAngle);
    ctx.drawImage(img,x,y,192,split,-left-faceWidth/2,-split,192,split);
    ctx.restore();
  }

  function expression(ctx,pilot,place,time,reaction) {
    const [left,top,w,h,eyes]=game.frames[pilot.id];
    const x=left+w*.52;
    const y=eyes+(top+h-eyes)*.60;
    ctx.save();
    if(reaction) {
      ctx.transform(1,0,reaction.bend,reaction.shrug,-reaction.bend*152,(1-reaction.shrug)*152);
      ctx.translate(left+w/2,top+h-5);
      ctx.rotate(reaction.headAngle);
      ctx.translate(-left-w/2,-top-h+5);
    }
    if(place===0) {
      // A short upward edge and pixel of light suggest a smile in the playing pose.
      poly(ctx,[[x-4,y-1],[x-1,y+1],[x+3,y+1],[x+7,y-2],[x+3,y+4],[x-1,y+4]],'#8c4b42');
      rect(ctx,'#f6d1ae',x-1,y+1,5,1.2);
    } else if(place===1) {
      poly(ctx,[[x-7,y+4],[x-3,y],[x+4,y-1],[x+9,y+3],[x+4,y+2],[x-3,y+3]],'#5d342f');
      for(const side of [-1,1]){
        const eye=x+side*w*.155;
        poly(ctx,[[eye-5,eyes-1],[eye+5,eyes-3],[eye+4,eyes],[eye-4,eyes+1]],'#654642');
      }
      if(Math.sin(time*2.1)<-.40) {
        rect(ctx,'#d4c4a580',x-18,y+13,5,2);
        rect(ctx,'#d4c4a558',x-23,y+15,4,2);
      }
    } else {
      ellipse(ctx,'#56313e',x+1,y+1,5.2,3.8);
      rect(ctx,'#b26860',x-1,y+4,4,1.5);
      for(const side of [-1,1]){
        const eye=x+side*w*.153;
        poly(ctx,[[eye-5,eyes+2],[eye,eyes-3],[eye+5,eyes+2],[eye+5,eyes+3],[eye,eyes],[eye-5,eyes+3]],'#563d3c');
        for(let drop=0;drop<2;drop++){
          const t=(time*1.8+drop*.55+side*.09+1)%1;
          const dx=eye+side*t*14;
          rect(ctx,'#80c9ed',dx,eyes+3+t*38,2+t*3,3+t*5);
          rect(ctx,'#d2f2ff',dx,eyes+3+t*38,2,2);
        }
      }
    }
    ctx.restore();
  }

  function percussion(ctx,pilot,beat) {
    if(!['Baile','Acompañante'].includes(pilot.role)) return;
    const isDancer=pilot.role==='Baile';
    const x=isDancer?41:43;
    const y=isDancer?128:94;
    ellipse(ctx,'#552d2d',x,y,20,27);
    ellipse(ctx,'#d18a48',x-1,y-1,19,26);
    ellipse(ctx,'#f4cb84',x-2,y-2,15,22);
    for(const side of [-1,1]) for(const offset of [-11,7]){
      rect(ctx,'#ffde9c',x+side*15-2,y+offset,5,3);
    }
    ellipse(ctx,'#e3ab70',x-13,y+9+Math.sin(beat*10)*3,5,5);
  }

  function drawPodium(canvas, top, time) {
    const ctx=canvas.getContext('2d');
    ctx.imageSmoothingEnabled=false;
    const gradient=ctx.createLinearGradient(0,0,0,canvas.height);
    gradient.addColorStop(0,'#192333'); gradient.addColorStop(.9,'#53404e');
    rect(ctx,gradient,0,0,canvas.width,canvas.height);
    for(let i=0;i<25;i++){
      const x=18+i*36;
      const y=24+Math.sin(x/184)*14;
      rect(ctx,'#b8997355',x,y+3,39,1);
      ellipse(ctx,'#ffce6850',x,y+4,8,5);
      ellipse(ctx,'#ffde95',x,y+4,3,3);
    }
    ellipse(ctx,'#ede9b315',450,249,194,117);
    const positions=[{x:450,y:263,accent:'#ffbf64'}, {x:244,y:283,accent:'#b7cbd4'},
      {x:656,y:301,accent:'#d58d76'}];
    for(const [i,{x,y,accent}] of positions.entries()){
      rect(ctx,'#202a35',x-85,y+4,170,365-y);
      rect(ctx,'#46515a',x-75,y+10,150,353-y);
      rect(ctx,accent,x-86,y,172,7);
      ctx.textAlign='center';
      ctx.font='bold 20px Archivo Black';
      ctx.fillStyle=accent;
      ctx.fillText(String(i+1),x,346);
    }

    for(const [i,{character:pilot}] of top.entries()){
      const {x,y}=positions[i];
      const entering=Math.min(1,Math.max(0,(time-.18-i*.10)/1.2));
      const settle=1-(1-entering)**3;
      const appear=Math.min(1,entering*3);
      const lean=i===1 ? .09+Math.sin(time*2.7)*.036 : i===2 ? -.095+Math.sin(time*12)*.028 : Math.sin(time*3)*.025;
      const vertical=i===0 ? 36*(1-settle)-14*Math.sin(entering*Math.PI) :
        (i===1?2:4+Math.sin(time*13)*1.8)+24*(1-settle);
      const scale=i===0?.675:.55;
      ctx.save();
      ctx.globalAlpha=appear;
      ellipse(ctx,'#191e29a5',x,y-3,47,5);
      ctx.translate(x + (i===0 ? -80*(1-settle) : 30*(1-settle)*(i===1?-1:1)),y+vertical);
      ctx.scale(scale,scale);
      ctx.rotate(lean*settle);
      ctx.translate(-96,-317);
      const row=entering<.92 ? 1 : i===0 ? 2 : 0;
      const reaction=entering>.92 && i>0 ? i===1
        ? {shrug:.88,bend:.18+Math.sin(time*2.5)*.044,headAngle:.20+Math.sin(time*2.1)*.08}
        : {shrug:.79+Math.sin(time*12)*.044,bend:-.12+Math.sin(time*9)*.04,headAngle:-.16+Math.sin(time*10)*.07} : null;
      atlasFrame(ctx,pilot,row,i===0 ? time*14 : (i===1 ? time*4 : time*7),reaction);
      percussion(ctx,pilot,time);
      if(entering>.92)expression(ctx,pilot,i,time,reaction);
      ctx.restore();
    }
    for(let i=0;i<39;i++){
      const t=(time*.31+i*.127)%1;
      const x=450+Math.sin(i*2.71)*((i%7)*16+73) + Math.sin(t*5+i)*15;
      const y=34+t*194;
      rect(ctx,['#e9a76c','#ffce67','#83cbb9','#ec87a3'][i%4],x,y,3+i%2,2+i%3);
    }
  }

  game.sequences={ready,intro,gridPortrait,paintFront,drawPodium,roleOnPodium,secondsPerDriver:1.12};
})();
